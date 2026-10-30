import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, userInventory, shopItems, userQuests, windTransactions, gameSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export async function GET() {
  try {
    const user = await ensureDefaultUser();

    // Fetch user inventory with item details
    const inventory = await db
      .select({
        inventoryId: userInventory.id,
        itemId: shopItems.id,
        name: shopItems.name,
        slug: shopItems.slug,
        category: shopItems.category,
        description: shopItems.description,
        icon: shopItems.icon,
        rarity: shopItems.rarity,
        effectBonus: shopItems.effectBonus,
        isEquipped: userInventory.isEquipped,
        quantity: userInventory.quantity,
        acquiredAt: userInventory.acquiredAt,
      })
      .from(userInventory)
      .innerJoin(shopItems, eq(userInventory.itemId, shopItems.id))
      .where(eq(userInventory.userId, user.id));

    // Fetch quests
    const quests = await db
      .select()
      .from(userQuests)
      .where(eq(userQuests.userId, user.id));

    // Fetch recent transactions
    const transactions = await db
      .select()
      .from(windTransactions)
      .where(eq(windTransactions.userId, user.id))
      .orderBy(desc(windTransactions.createdAt))
      .limit(10);

    // Fetch recent game stats
    const recentGames = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, user.id))
      .orderBy(desc(gameSessions.createdAt))
      .limit(8);

    return NextResponse.json({
      user,
      inventory,
      quests,
      transactions,
      recentGames,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await ensureDefaultUser();
    const body = await request.json();

    const { displayName, avatarUrl, bio, title, equippedBadge, equippedAura } = body;

    const [updatedUser] = await db
      .update(users)
      .set({
        ...(displayName !== undefined ? { displayName } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(equippedBadge !== undefined ? { equippedBadge } : {}),
        ...(equippedAura !== undefined ? { equippedAura } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
