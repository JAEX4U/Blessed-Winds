import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, gameSessions, windTransactions, userQuests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";
import { getSessionCookie, verifySessionToken } from "@/lib/auth";

async function getCurrentUser(request: Request) {
  const token = await getSessionCookie();
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (user) return user;
    }
  }
  return ensureDefaultUser();
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { gameType, bet = 0, action, score = 0, clientData } = body;

    // Validate game type
    if (!["wheel", "cyclone", "slots", "harvester"].includes(gameType)) {
      return NextResponse.json({ error: "Invalid game mode" }, { status: 400 });
    }

    let betAmount = Math.max(0, parseInt(bet, 10) || 0);

    if (betAmount > user.windBalance) {
      return NextResponse.json({ error: "Insufficient Winds for this wager!" }, { status: 400 });
    }

    let payout = 0;
    let net = 0;
    let resultMessage = "";
    let extraData: Record<string, unknown> = {};
    // Daily spin counters (used by the wheel game, reset at midnight)
    let freeUsed = user.wheelFreeSpinsUsed ?? 0;
    let paidUsed = user.wheelPaidSpinsUsed ?? 0;
    let spinsDate: Date | null = user.wheelSpinsDate ? new Date(user.wheelSpinsDate) : null;

    // 1. WHEEL OF GALES
    if (gameType === "wheel") {
      // Daily reset of spin counters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const isNewDay =
        !spinsDate ||
        spinsDate.getFullYear() !== today.getFullYear() ||
        spinsDate.getMonth() !== today.getMonth() ||
        spinsDate.getDate() !== today.getDate();

      if (isNewDay) {
        freeUsed = 0;
        paidUsed = 0;
        spinsDate = today;
      }

      const MAX_FREE_SPINS = 5;
      const MAX_PAID_SPINS = 5;
      const PAID_SPIN_COST = 150;
      const isPaid = body.isPaid === true;

      if (isPaid) {
        if (paidUsed >= MAX_PAID_SPINS) {
          return NextResponse.json(
            { error: "No paid spins remaining today" },
            { status: 400 }
          );
        }
        if (betAmount < PAID_SPIN_COST) {
          return NextResponse.json(
            { error: `Paid spin costs ${PAID_SPIN_COST} Winds` },
            { status: 400 }
          );
        }
        betAmount = PAID_SPIN_COST;
        paidUsed += 1;
      } else {
        if (freeUsed >= MAX_FREE_SPINS) {
          return NextResponse.json(
            { error: "No free spins remaining today" },
            { status: 400 }
          );
        }
        betAmount = 0;
        freeUsed += 1;
      }

      // Wheel segments: fixed payouts (Winds), not multipliers
      const freeSegments = [
        { payout: 0, label: "Calm Breeze (0)", weight: 30 },
        { payout: 50, label: "Gentle Breeze (50)", weight: 25 },
        { payout: 100, label: "Brisk Draft (100)", weight: 20 },
        { payout: 200, label: "Gale Gust (200)", weight: 15 },
        { payout: 500, label: "Storm Surge (500)", weight: 7 },
        { payout: 800, label: "Typhoon Blessing (800)", weight: 2 },
        { payout: 3000, label: "BLESSED HURRICANE (3000)!", weight: 1 },
      ];

      const paidSegments = [
        { payout: 0, label: "Calm Breeze (0)", weight: 19 },
        { payout: 50, label: "Gentle Breeze (50)", weight: 20 },
        { payout: 100, label: "Brisk Draft (100)", weight: 22 },
        { payout: 200, label: "Gale Gust (200)", weight: 18 },
        { payout: 500, label: "Storm Surge (500)", weight: 12 },
        { payout: 800, label: "Typhoon Blessing (800)", weight: 8 },
        { payout: 3000, label: "BLESSED HURRICANE (3000)!", weight: 1 },
      ];

      const segments = isPaid ? paidSegments : freeSegments;

      const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
      let rand = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let i = 0; i < segments.length; i++) {
        if (rand < segments[i].weight) {
          selectedIndex = i;
          break;
        }
        rand -= segments[i].weight;
      }

      const segment = segments[selectedIndex];
      payout = segment.payout;
      net = payout - betAmount;
      resultMessage = `Wheel landed on ${segment.label}! Won ${payout} Winds`;
      extraData = {
        segmentIndex: selectedIndex,
        segment,
        isPaid,
        freeSpinsRemaining: MAX_FREE_SPINS - freeUsed,
        paidSpinsRemaining: MAX_PAID_SPINS - paidUsed,
      };

      // Progress wheel quest
      const [wheelQuest] = await db
        .select()
        .from(userQuests)
        .where(and(eq(userQuests.userId, user.id), eq(userQuests.questKey, "wheel_spinner")))
        .limit(1);

      if (wheelQuest && !wheelQuest.isCompleted) {
        const newProg = (wheelQuest.progress || 0) + 1;
        await db
          .update(userQuests)
          .set({ progress: newProg, isCompleted: newProg >= wheelQuest.target })
          .where(eq(userQuests.id, wheelQuest.id));
      }
    }

    // 2. CYCLONE RUSH (Crash game)
    else if (gameType === "cyclone") {
      if (action === "cashout") {
        const cashoutMultiplier = parseFloat(clientData?.multiplier || "1.0");
        if (cashoutMultiplier < 1.0) {
          return NextResponse.json({ error: "Invalid cashout multiplier" }, { status: 400 });
        }
        payout = Math.round(betAmount * cashoutMultiplier);
        net = payout - betAmount;
        resultMessage = `Safe landing! Cashed out at ${cashoutMultiplier.toFixed(2)}x (+${payout} Winds)`;
        extraData = { multiplier: cashoutMultiplier, crashed: false };

        if (cashoutMultiplier >= 2.0) {
          const [cycloneQuest] = await db
            .select()
            .from(userQuests)
            .where(and(eq(userQuests.userId, user.id), eq(userQuests.questKey, "cyclone_surfer")))
            .limit(1);

          if (cycloneQuest && !cycloneQuest.isCompleted) {
            await db
              .update(userQuests)
              .set({ progress: 1, isCompleted: true })
              .where(eq(userQuests.id, cycloneQuest.id));
          }
        }
      } else {
        // Crashed
        payout = 0;
        net = -betAmount;
        resultMessage = `The Cyclone collapsed into a void! Lost ${betAmount} Winds.`;
        extraData = { crashed: true };
      }
    }

    // 3. TEMPEST SLOTS
    else if (gameType === "slots") {
      if (betAmount < 10) {
        return NextResponse.json({ error: "Minimum bet is 10 Winds" }, { status: 400 });
      }

      // Slot symbols: 🍃 (Breeze), 🪶 (Feather), ⚡ (Spark), 🌪️ (Twister), 👑 (Archon Crown), 💎 (Celestial Gem)
      const symbols = ["🍃", "🪶", "⚡", "🌪️", "💎", "👑"];
      const roll1 = symbols[Math.floor(Math.random() * symbols.length)];
      const roll2 = symbols[Math.floor(Math.random() * symbols.length)];
      const roll3 = symbols[Math.floor(Math.random() * symbols.length)];

      const grid = [roll1, roll2, roll3];
      let multiplier = 0;

      if (roll1 === roll2 && roll2 === roll3) {
        // Triple Match
        if (roll1 === "👑") multiplier = 50; // Jackpot
        else if (roll1 === "💎") multiplier = 25;
        else if (roll1 === "🌪️") multiplier = 15;
        else if (roll1 === "⚡") multiplier = 10;
        else if (roll1 === "🪶") multiplier = 6;
        else multiplier = 4;
        resultMessage = `TRIPLE MATCH ${roll1} ${roll2} ${roll3}! Won ${multiplier}x payout!`;
      } else if (roll1 === roll2 || roll2 === roll3 || roll1 === roll3) {
        // Double Match
        multiplier = 1.5;
        resultMessage = `Double Pair match! Won 1.5x payout.`;
      } else {
        multiplier = 0;
        resultMessage = `Scattered gusts (${roll1} ${roll2} ${roll3}). Try again!`;
      }

      payout = Math.round(betAmount * multiplier);
      net = payout - betAmount;
      extraData = { grid, multiplier };
    }

    // 4. ZEPHYR HARVESTER (Clicker / Tap essence)
    else if (gameType === "harvester") {
      const taps = Math.min(Math.max(1, parseInt(clientData?.taps || 1, 10)), 50);
      const windsPerTap = 3;
      payout = taps * windsPerTap;
      net = payout;
      resultMessage = `Gathered +${payout} raw wind essence from ${taps} gusts!`;
      extraData = { taps };

      // Harvest quest
      const [harvestQuest] = await db
        .select()
        .from(userQuests)
        .where(and(eq(userQuests.userId, user.id), eq(userQuests.questKey, "daily_harvest")))
        .limit(1);

      if (harvestQuest && !harvestQuest.isCompleted) {
        const newProg = Math.min(harvestQuest.target, (harvestQuest.progress || 0) + taps);
        await db
          .update(userQuests)
          .set({ progress: newProg, isCompleted: newProg >= harvestQuest.target })
          .where(eq(userQuests.id, harvestQuest.id));
      }
    }

    // Calculate balance updates
    const newWindBalance = Math.max(0, user.windBalance + net);
    const xpGained = Math.max(5, Math.floor((betAmount + Math.max(0, payout)) / 15));
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 250) + 1;

    const userUpdate: Record<string, unknown> = {
      windBalance: newWindBalance,
      xp: newXp,
      level: newLevel,
      updatedAt: new Date(),
    };

    // Persist daily spin counters for the wheel game
    if (gameType === "wheel") {
      userUpdate.wheelFreeSpinsUsed = freeUsed;
      userUpdate.wheelPaidSpinsUsed = paidUsed;
      userUpdate.wheelSpinsDate = spinsDate;
    }

    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, user.id))
      .returning();

    // Log session
    await db.insert(gameSessions).values({
      userId: user.id,
      gameType,
      betWinds: betAmount,
      payoutWinds: payout,
      netProfit: net,
      score: score || payout,
      details: JSON.stringify(extraData),
    });

    // Log transaction if net != 0
    if (net !== 0) {
      await db.insert(windTransactions).values({
        userId: user.id,
        type: "game_reward",
        amount: net,
        balanceAfter: newWindBalance,
        reason: `${gameType.toUpperCase()}: ${resultMessage}`,
      });
    }

    return NextResponse.json({
      success: true,
      gameType,
      betAmount,
      payout,
      net,
      xpGained,
      message: resultMessage,
      extra: extraData,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Game play error:", error);
    return NextResponse.json({ error: "Failed to process game play" }, { status: 500 });
  }
}
