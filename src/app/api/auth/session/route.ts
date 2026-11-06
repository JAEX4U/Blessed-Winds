import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCookie, verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = await getSessionCookie();
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        windBalance: users.windBalance,
        gemBalance: users.gemBalance,
        level: users.level,
        xp: users.xp,
        title: users.title,
        bio: users.bio,
        blessingTier: users.blessingTier,
        equippedBadge: users.equippedBadge,
        equippedAura: users.equippedAura,
        streakDays: users.streakDays,
        wheelFreeSpinsUsed: users.wheelFreeSpinsUsed,
        wheelPaidSpinsUsed: users.wheelPaidSpinsUsed,
        wheelSpinsDate: users.wheelSpinsDate,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
