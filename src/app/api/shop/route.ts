import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopItems, userInventory, users, windTransactions, userQuests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureDefaultUser } from "@/lib/seed";

export async function GET() {
  try {
    await ensureDefaultUser();
    const items = await db.select().from(shopItems);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Shop GET error:", error);
    return NextResponse.json({ error: "Failed to fetch shop items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureDefaultUser();
    const body = await request.json();
    const { itemId, action } = body; // action: 'buy' or 'equip'

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Equip / Unequip handling
    if (action === "equip") {
      const [invItem] = await db
        .select()
        .from(userInventory)
        .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, itemId)))
        .limit(1);

      if (!invItem) {
        return NextResponse.json({ error: "You do not own this item" }, { status: 400 });
      }

      // If item is aura, update user's equipped aura
      if (item.category === "auras") {
        await db
          .update(users)
          .set({ equippedAura: item.slug })
          .where(eq(users.id, user.id));
      } else if (item.category === "titles") {
        await db
          .update(users)
          .set({ title: item.name })
          .where(eq(users.id, user.id));
      }

      const toggledState = !invItem.isEquipped;
      await db
        .update(userInventory)
        .set({ isEquipped: toggledState })
        .where(eq(userInventory.id, invItem.id));

      const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
      return NextResponse.json({ success: true, isEquipped: toggledState, user: updatedUser });
    }

    // Buy handling
    if (user.windBalance < item.priceWinds) {
      return NextResponse.json(
        { error: `Insufficient Winds! You need ${item.priceWinds} Winds but have ${user.windBalance}.` },
        { status: 400 }
      );
    }

    if ((item.priceGems || 0) > 0 && user.gemBalance < (item.priceGems || 0)) {
      return NextResponse.json(
        { error: `Insufficient Sky Gems! You need ${item.priceGems} Gems but have ${user.gemBalance}.` },
        { status: 400 }
      );
    }

    const newWindBalance = user.windBalance - item.priceWinds;
    const newGemBalance = user.gemBalance - (item.priceGems || 0);
    const newXp = user.xp + Math.floor(item.priceWinds / 10);
    const newLevel = Math.floor(newXp / 250) + 1;

    // Deduct user balance
    const [updatedUser] = await db
      .update(users)
      .set({
        windBalance: newWindBalance,
        gemBalance: newGemBalance,
        xp: newXp,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    // Add or increment in inventory
    const [existingInv] = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, itemId)))
      .limit(1);

    if (existingInv) {
      await db
        .update(userInventory)
        .set({ quantity: existingInv.quantity + 1 })
        .where(eq(userInventory.id, existingInv.id));
    } else {
      await db.insert(userInventory).values({
        userId: user.id,
        itemId: item.id,
        quantity: 1,
        isEquipped: true,
      });

      // auto-equip if aura
      if (item.category === "auras") {
        await db.update(users).set({ equippedAura: item.slug }).where(eq(users.id, user.id));
      }
    }

    // Log transaction
    await db.insert(windTransactions).values({
      userId: user.id,
      type: "shop_purchase",
      amount: -item.priceWinds,
      balanceAfter: newWindBalance,
      reason: `Purchased ${item.name}`,
    });

    // Check shop quest
    const [shopQuest] = await db
      .select()
      .from(userQuests)
      .where(and(eq(userQuests.userId, user.id), eq(userQuests.questKey, "shop_patron")))
      .limit(1);

    if (shopQuest && !shopQuest.isCompleted) {
      await db
        .update(userQuests)
        .set({ progress: 1, isCompleted: true })
        .where(eq(userQuests.id, shopQuest.id));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully acquired ${item.name}!`,
      user: updatedUser,
      item,
    });
  } catch (error) {
    console.error("Shop purchase error:", error);
    return NextResponse.json({ error: "Failed to purchase item" }, { status: 500 });
  }
}
