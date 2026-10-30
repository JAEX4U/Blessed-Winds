import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, gameSessions } from "@/db/schema";
import { desc, eq, gt, sql } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export const dynamic = "force-dynamic";

const playerFields = {
  id: users.id,
  displayName: users.displayName,
  username: users.username,
  avatarUrl: users.avatarUrl,
  windBalance: users.windBalance,
  gemBalance: users.gemBalance,
  level: users.level,
  xp: users.xp,
  title: users.title,
  streakDays: users.streakDays,
};

export async function GET() {
  try {
    const me = await ensureDefaultUser();

    const byWinds = await db.select(playerFields).from(users).orderBy(desc(users.windBalance)).limit(20);
    const byLevel = await db
      .select(playerFields)
      .from(users)
      .orderBy(desc(users.level), desc(users.xp))
      .limit(20);

    const biggestWins = await db
      .select({
        sessionId: gameSessions.id,
        userId: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        title: users.title,
        level: users.level,
        gameType: gameSessions.gameType,
        betWinds: gameSessions.betWinds,
        payoutWinds: gameSessions.payoutWinds,
        netProfit: gameSessions.netProfit,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(users, eq(gameSessions.userId, users.id))
      .where(gt(gameSessions.netProfit, 0))
      .orderBy(desc(gameSessions.payoutWinds))
      .limit(20);

    const recentWins = await db
      .select({
        sessionId: gameSessions.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        gameType: gameSessions.gameType,
        payoutWinds: gameSessions.payoutWinds,
        netProfit: gameSessions.netProfit,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(users, eq(gameSessions.userId, users.id))
      .where(gt(gameSessions.netProfit, 0))
      .orderBy(desc(gameSessions.createdAt))
      .limit(10);

    const [windsRankRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gt(users.windBalance, me.windBalance));
    const [levelRankRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.level} > ${me.level} OR (${users.level} = ${me.level} AND ${users.xp} > ${me.xp})`);
    const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(users);

    return NextResponse.json({
      byWinds,
      byLevel,
      biggestWins,
      recentWins,
      me: {
        id: me.id,
        windsRank: (windsRankRow?.count ?? 0) + 1,
        levelRank: (levelRankRow?.count ?? 0) + 1,
        totalPlayers: totalRow?.count ?? 1,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
