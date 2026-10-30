import { NextResponse } from "next/server";
import { db } from "@/db";
import { userQuests, users, windTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    const user = await ensureDefaultUser();
    const body = await request.json();
    const { questId } = body;

    if (!questId) {
      return NextResponse.json({ error: "Quest ID is required" }, { status: 400 });
    }

    const [quest] = await db
      .select()
      .from(userQuests)
      .where(and(eq(userQuests.id, questId), eq(userQuests.userId, user.id)))
      .limit(1);

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (!quest.isCompleted) {
      return NextResponse.json({ error: "Quest is not completed yet" }, { status: 400 });
    }

    if (quest.isClaimed) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 400 });
    }

    const newWinds = user.windBalance + quest.rewardWinds;
    const newGems = user.gemBalance + quest.rewardGems;
    const newXp = user.xp + 50;
    const newLevel = Math.floor(newXp / 250) + 1;

    const [updatedUser] = await db
      .update(users)
      .set({
        windBalance: newWinds,
        gemBalance: newGems,
        xp: newXp,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    await db
      .update(userQuests)
      .set({ isClaimed: true })
      .where(eq(userQuests.id, quest.id));

    await db.insert(windTransactions).values({
      userId: user.id,
      type: "quest_reward",
      amount: quest.rewardWinds,
      balanceAfter: newWinds,
      reason: `Quest: ${quest.title}`,
    });

    return NextResponse.json({
      success: true,
      message: `Claimed +${quest.rewardWinds} Winds & +${quest.rewardGems} Gems!`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Quest claim error:", error);
    return NextResponse.json({ error: "Failed to claim quest" }, { status: 500 });
  }
}
