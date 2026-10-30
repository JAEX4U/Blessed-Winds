import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, windTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export async function POST() {
  try {
    const user = await ensureDefaultUser();

    // Blessed Wind Fountain grants a random burst of 50 - 150 Winds
    const fountainAward = Math.floor(Math.random() * 101) + 50;
    const newBalance = user.windBalance + fountainAward;
    const newXp = user.xp + 15;
    const newLevel = Math.floor(newXp / 250) + 1;

    const [updatedUser] = await db
      .update(users)
      .set({
        windBalance: newBalance,
        xp: newXp,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    await db.insert(windTransactions).values({
      userId: user.id,
      type: "wind_fountain",
      amount: fountainAward,
      balanceAfter: newBalance,
      reason: "Blessed Wind Fountain Offering",
    });

    return NextResponse.json({
      success: true,
      amount: fountainAward,
      user: updatedUser,
      message: `The sacred altar whispers: +${fountainAward} Winds granted!`,
    });
  } catch (error) {
    console.error("Fountain error:", error);
    return NextResponse.json({ error: "Failed to receive fountain blessing" }, { status: 500 });
  }
}
