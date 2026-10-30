import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, windTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export async function POST() {
  try {
    const user = await ensureDefaultUser();

    // Check if claimed today (last 20 hours for friendly UX)
    const now = new Date();
    if (user.lastDailyClaim) {
      const diffMs = now.getTime() - new Date(user.lastDailyClaim).getTime();
      const hoursSince = diffMs / (1000 * 60 * 60);
      if (hoursSince < 20) {
        const remainingHours = Math.ceil(20 - hoursSince);
        return NextResponse.json(
          {
            error: `Your daily blessing is still recharging! Return in ~${remainingHours} hours.`,
            canClaim: false,
          },
          { status: 400 }
        );
      }
    }

    // Calculate reward based on streak
    const nextStreak = (user.streakDays || 1) + 1;
    const baseWinds = 300;
    const streakBonus = Math.min(nextStreak * 50, 500);
    const totalWinds = baseWinds + streakBonus;
    const bonusGems = nextStreak % 3 === 0 ? 5 : 2;

    const newBalance = user.windBalance + totalWinds;
    const newGems = user.gemBalance + bonusGems;
    const newXp = user.xp + 80;
    const newLevel = Math.floor(newXp / 250) + 1;

    const [updatedUser] = await db
      .update(users)
      .set({
        windBalance: newBalance,
        gemBalance: newGems,
        xp: newXp,
        level: newLevel,
        streakDays: nextStreak,
        lastDailyClaim: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
      .returning();

    await db.insert(windTransactions).values({
      userId: user.id,
      type: "daily_blessing",
      amount: totalWinds,
      balanceAfter: newBalance,
      reason: `Day ${nextStreak} Daily Blessed Winds Gift (+${bonusGems} Gems)`,
    });

    return NextResponse.json({
      success: true,
      rewardWinds: totalWinds,
      rewardGems: bonusGems,
      streak: nextStreak,
      user: updatedUser,
      message: `The Blessed Winds bestow +${totalWinds} Winds & +${bonusGems} Gems upon you! (Streak: Day ${nextStreak})`,
    });
  } catch (error) {
    console.error("Daily claim error:", error);
    return NextResponse.json({ error: "Failed to claim daily blessing" }, { status: 500 });
  }
}
