import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { db } from "@/db";
import { users, spinRounds, spinBets, windTransactions, gameSessions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ensureDefaultUser, RIVAL_PLAYERS } from "@/lib/seed";

export const dynamic = "force-dynamic";

const BETTING_MS = 30000;
const SPIN_MS = 6000;
const REVEAL_MS = 8000;
const TICKETS = 1_000_000;
const COLORS = ["green", "red", "blue"] as const;
type SpinColor = (typeof COLORS)[number];

type Round = typeof spinRounds.$inferSelect;
type Bet = typeof spinBets.$inferSelect;

async function createRound(): Promise<Round> {
  const [round] = await db
    .insert(spinRounds)
    .values({ status: "betting", bettingEndsAt: new Date(Date.now() + BETTING_MS) })
    .returning();
  return round;
}

function colorTotalsOf(bets: Bet[]): Record<SpinColor, number> {
  const totals: Record<SpinColor, number> = { green: 0, red: 0, blue: 0 };
  for (const b of bets) totals[b.color as SpinColor] += b.amount;
  return totals;
}

/** Display order matches the wheel: green → red → blue, insertion order inside a color. */
function orderedBets(bets: Bet[]): Bet[] {
  return [...bets].sort((a, b) => {
    const c = COLORS.indexOf(a.color as SpinColor) - COLORS.indexOf(b.color as SpinColor);
    return c !== 0 ? c : a.id - b.id;
  });
}

/**
 * Parimutuel split: the WHOLE pot is divided among the winning color's bets
 * proportionally to stake. Floors first, then the remainder goes +1 to the
 * biggest stakes (ties → earliest bet) so the split always sums exactly to the pot.
 */
function allocatePayouts(winners: Bet[], pot: number): Map<number, number> {
  const result = new Map<number, number>();
  const colorTotal = winners.reduce((s, b) => s + b.amount, 0);
  if (colorTotal <= 0 || pot <= 0) return result;
  let assigned = 0;
  for (const b of winners) {
    const share = Math.floor((b.amount / colorTotal) * pot);
    result.set(b.id, share);
    assigned += share;
  }
  let remainder = pot - assigned;
  const byStake = [...winners].sort((a, b) => b.amount - a.amount || a.id - b.id);
  for (let i = 0; remainder > 0 && byStake.length > 0; i = (i + 1) % byStake.length) {
    result.set(byStake[i].id, (result.get(byStake[i].id) ?? 0) + 1);
    remainder--;
  }
  return result;
}

/** Advance the latest round through betting → spinning → finished → next round. */
async function advanceRound(): Promise<Round> {
  let [round] = await db.select().from(spinRounds).orderBy(desc(spinRounds.id)).limit(1);
  if (!round) return createRound();
  const now = Date.now();

  // Betting deadline → draw the winning COLOR server-side.
  if (round.status === "betting" && now >= new Date(round.bettingEndsAt).getTime()) {
    round = await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(spinRounds).where(eq(spinRounds.id, round.id)).for("update");
      if (locked.status !== "betting") return locked;
      const bets = await tx.select().from(spinBets).where(eq(spinBets.roundId, locked.id));
      const pot = bets.reduce((s, b) => s + b.amount, 0);

      if (pot === 0) {
        const [done] = await tx
          .update(spinRounds)
          .set({ status: "finished", totalPot: 0, spinEndsAt: new Date() })
          .where(eq(spinRounds.id, locked.id))
          .returning();
        return done;
      }

      const totals = colorTotalsOf(bets);
      const ticket = randomInt(0, TICKETS);
      const target = (ticket / TICKETS) * pot;
      let cumulative = 0;
      let winningColor: SpinColor = "blue";
      for (const c of COLORS) {
        cumulative += totals[c];
        if (target < cumulative) {
          winningColor = c;
          break;
        }
      }

      const winners = bets.filter((b) => b.color === winningColor);
      const alloc = allocatePayouts(winners, pot);
      const top = [...winners].sort(
        (a, b) => (alloc.get(b.id) ?? 0) - (alloc.get(a.id) ?? 0) || a.id - b.id
      )[0];
      const riderKeys = new Set(winners.map((b) => (b.isBot ? `bot-${b.playerName}` : `u-${b.userId}`)));

      const [spinning] = await tx
        .update(spinRounds)
        .set({
          status: "spinning",
          totalPot: pot,
          winningTicket: ticket,
          winningColor,
          winningColorTotal: totals[winningColor],
          winnersCount: riderKeys.size,
          winnerUserId: top.userId,
          winnerName: top.playerName,
          winnerAvatar: top.avatar,
          winnerIsBot: top.isBot,
          spinEndsAt: new Date(Date.now() + SPIN_MS),
        })
        .where(eq(spinRounds.id, locked.id))
        .returning();
      return spinning;
    });
  }

  // Wheel settled → split the pot among the winning color's riders.
  if (round.status === "spinning" && round.spinEndsAt && now >= new Date(round.spinEndsAt).getTime()) {
    round = await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(spinRounds).where(eq(spinRounds.id, round.id)).for("update");
      if (locked.status !== "spinning") return locked;
      const bets = await tx.select().from(spinBets).where(eq(spinBets.roundId, locked.id));
      const winners = bets.filter((b) => b.color === locked.winningColor);
      const alloc = allocatePayouts(winners, locked.totalPot);

      // Aggregate real players: total staked (all colors) and payout (winning color only).
      const byUser = new Map<number, { staked: number; payout: number }>();
      for (const b of bets) {
        if (b.isBot || !b.userId) continue;
        const entry = byUser.get(b.userId) ?? { staked: 0, payout: 0 };
        entry.staked += b.amount;
        entry.payout += alloc.get(b.id) ?? 0;
        byUser.set(b.userId, entry);
      }

      for (const [uid, { staked, payout }] of byUser) {
        const [player] = await tx.select().from(users).where(eq(users.id, uid)).limit(1);
        if (!player) continue;
        if (payout > 0) {
          const newBalance = player.windBalance + payout;
          const newXp = player.xp + Math.floor(payout / 20);
          await tx
            .update(users)
            .set({ windBalance: newBalance, xp: newXp, level: Math.floor(newXp / 250) + 1, updatedAt: new Date() })
            .where(eq(users.id, uid));
          const mult = locked.winningColorTotal > 0 ? (locked.totalPot / locked.winningColorTotal).toFixed(2) : "1.00";
          await tx.insert(windTransactions).values({
            userId: uid,
            type: "game_reward",
            amount: payout,
            balanceAfter: newBalance,
            reason: `Live Spin: ${locked.winningColor?.toUpperCase()} hit — pot split ${mult}x (${locked.winnersCount} riders)`,
          });
        }
        await tx.insert(gameSessions).values({
          userId: uid,
          gameType: "live_spin",
          betWinds: staked,
          payoutWinds: payout,
          netProfit: payout - staked,
          score: payout,
          details: JSON.stringify({ roundId: locked.id, color: locked.winningColor, split: true }),
        });
      }

      const [done] = await tx
        .update(spinRounds)
        .set({ status: "finished" })
        .where(eq(spinRounds.id, locked.id))
        .returning();
      return done;
    });
  }

  // Result shown long enough → open a fresh round.
  if (round.status === "finished") {
    const revealBase = round.spinEndsAt ? new Date(round.spinEndsAt).getTime() : now;
    if (now >= revealBase + REVEAL_MS) return createRound();
  }

  return round;
}

/** Rival sky-spirits trickle into the arena so rounds feel alive. */
async function maybeAddBot(round: Round) {
  if (round.status !== "betting") return;
  const now = Date.now();
  const startedAt = new Date(round.bettingEndsAt).getTime() - BETTING_MS;
  const elapsed = now - startedAt;
  if (elapsed < 2500 || now > new Date(round.bettingEndsAt).getTime() - 4000) return;

  const bets = await db.select().from(spinBets).where(eq(spinBets.roundId, round.id));
  const bots = bets.filter((b) => b.isBot);
  if (bots.length >= 7) return;
  const lastBetAt = bets.length ? Math.max(...bets.map((b) => new Date(b.createdAt).getTime())) : 0;
  if (bots.length > 0 && now - lastBetAt < 2600) return;
  if (bots.length > 0 && Math.random() > 0.8) return;

  const rival = RIVAL_PLAYERS[randomInt(0, RIVAL_PLAYERS.length)];
  const amounts = [25, 50, 75, 100, 100, 150, 200, 300];
  const amount = amounts[randomInt(0, amounts.length)];
  const color = COLORS[randomInt(0, COLORS.length)];

  await db.insert(spinBets).values({
    roundId: round.id,
    userId: null,
    playerName: rival.displayName,
    avatar: rival.avatarUrl,
    color,
    amount,
    isBot: true,
  });
  await db
    .update(spinRounds)
    .set({ totalPot: sql`${spinRounds.totalPot} + ${amount}` })
    .where(eq(spinRounds.id, round.id));
}

async function buildState(meId: number) {
  const round = await advanceRound();
  await maybeAddBot(round);

  const [fresh] = await db.select().from(spinRounds).where(eq(spinRounds.id, round.id));
  const bets = orderedBets(await db.select().from(spinBets).where(eq(spinBets.roundId, fresh.id)));
  const pot = bets.reduce((s, b) => s + b.amount, 0);
  const totals = colorTotalsOf(bets);

  // What each bet would earn right now if its color hit (live preview of the split).
  const previewAlloc = new Map<number, number>();
  for (const c of COLORS) {
    const colorBets = bets.filter((b) => b.color === c);
    for (const [id, payout] of allocatePayouts(colorBets, pot)) previewAlloc.set(id, payout);
  }

  // My exact payout once the color is drawn.
  let myPayout = 0;
  if (fresh.winningColor && fresh.status !== "betting") {
    const winners = bets.filter((b) => b.color === fresh.winningColor);
    const alloc = allocatePayouts(winners, pot);
    for (const b of winners) if (b.userId === meId && !b.isBot) myPayout += alloc.get(b.id) ?? 0;
  }

  const myByColor: Record<SpinColor, number> = { green: 0, red: 0, blue: 0 };
  for (const b of bets) if (b.userId === meId && !b.isBot) myByColor[b.color as SpinColor] += b.amount;
  const myTotal = myByColor.green + myByColor.red + myByColor.blue;
  const myChance =
    pot > 0
      ? COLORS.reduce((s, c) => s + (myByColor[c] > 0 ? (totals[c] / pot) * 100 : 0), 0)
      : 0;

  const colorStats = COLORS.map((c) => {
    const riders = new Set(
      bets.filter((b) => b.color === c).map((b) => (b.isBot ? `bot-${b.playerName}` : `u-${b.userId}`))
    ).size;
    return {
      color: c,
      total: totals[c],
      chance: pot > 0 ? (totals[c] / pot) * 100 : 0,
      multiplier: totals[c] > 0 ? pot / totals[c] : 0,
      riders,
    };
  });

  const history = await db
    .select()
    .from(spinRounds)
    .where(eq(spinRounds.status, "finished"))
    .orderBy(desc(spinRounds.id))
    .limit(10);

  return {
    round: {
      id: fresh.id,
      status: fresh.status,
      bettingEndsAt: fresh.bettingEndsAt,
      spinEndsAt: fresh.spinEndsAt,
      totalPot: pot,
      winningTicket: fresh.winningTicket,
      winningColor: fresh.winningColor,
      winningColorTotal: fresh.winningColorTotal,
      winnersCount: fresh.winnersCount,
      topWinnerName: fresh.winnerName,
      topWinnerAvatar: fresh.winnerAvatar,
      revealMs: REVEAL_MS,
    },
    bets: bets.map((b) => ({
      id: b.id,
      userId: b.userId,
      playerName: b.playerName,
      avatar: b.avatar,
      color: b.color,
      amount: b.amount,
      isBot: b.isBot,
      share: totals[b.color as SpinColor] > 0 ? (b.amount / totals[b.color as SpinColor]) * 100 : 0,
      potential: previewAlloc.get(b.id) ?? 0,
    })),
    colorTotals: totals,
    colorStats,
    playersCount: new Set(bets.map((b) => (b.isBot ? `bot-${b.playerName}` : `u-${b.userId}`))).size,
    myTotal,
    myByColor,
    myChance,
    myPayout,
    history: history.map((h) => ({
      id: h.id,
      winningColor: h.winningColor,
      winnersCount: h.winnersCount,
      pot: h.totalPot,
    })),
    serverTime: Date.now(),
  };
}

export async function GET() {
  try {
    const me = await ensureDefaultUser();
    return NextResponse.json(await buildState(me.id));
  } catch (error) {
    console.error("Spin GET error:", error);
    return NextResponse.json({ error: "Failed to load spin arena" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const me = await ensureDefaultUser();
    const body = await request.json();
    const amount = Math.floor(Number(body?.amount));
    const color = String(body?.color ?? "") as SpinColor;

    if (!COLORS.includes(color)) {
      return NextResponse.json({ error: "Choose green, red or blue" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 10) {
      return NextResponse.json({ error: "Minimum bet is 10 Winds" }, { status: 400 });
    }
    if (amount > 100000) {
      return NextResponse.json({ error: "Maximum bet is 100,000 Winds per entry" }, { status: 400 });
    }

    await advanceRound();
    const [round] = await db.select().from(spinRounds).orderBy(desc(spinRounds.id)).limit(1);
    if (!round || round.status !== "betting" || Date.now() >= new Date(round.bettingEndsAt).getTime() - 400) {
      return NextResponse.json({ error: "Betting is closed for this round — wait for the next gale!" }, { status: 400 });
    }

    try {
      await db.transaction(async (tx) => {
        const [player] = await tx.select().from(users).where(eq(users.id, me.id)).for("update");
        if (player.windBalance < amount) throw new Error("INSUFFICIENT");
        const newXp = player.xp + Math.floor(amount / 10);
        const newBalance = player.windBalance - amount;
        await tx
          .update(users)
          .set({ windBalance: newBalance, xp: newXp, level: Math.floor(newXp / 250) + 1, updatedAt: new Date() })
          .where(eq(users.id, me.id));
        await tx.insert(spinBets).values({
          roundId: round.id,
          userId: me.id,
          playerName: player.displayName,
          avatar: player.avatarUrl ?? "🌪️",
          color,
          amount,
          isBot: false,
        });
        await tx
          .update(spinRounds)
          .set({ totalPot: sql`${spinRounds.totalPot} + ${amount}` })
          .where(eq(spinRounds.id, round.id));
        await tx.insert(windTransactions).values({
          userId: me.id,
          type: "game_reward",
          amount: -amount,
          balanceAfter: newBalance,
          reason: `Live Spin: ${amount} Winds on ${color.toUpperCase()}`,
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "INSUFFICIENT") {
        return NextResponse.json({ error: "Insufficient Winds balance for this bet!" }, { status: 400 });
      }
      throw e;
    }

    return NextResponse.json(await buildState(me.id));
  } catch (error) {
    console.error("Spin POST error:", error);
    return NextResponse.json({ error: "Failed to place spin bet" }, { status: 500 });
  }
}
