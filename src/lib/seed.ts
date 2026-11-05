import { db } from "@/db";
import { users, shopItems, userQuests, userInventory } from "@/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_USERNAME = "zephyr_traveler";

export const INITIAL_SHOP_ITEMS = [
  // Auras
  {
    name: "Emerald Breeze Aura",
    slug: "emerald-breeze-aura",
    category: "auras",
    description: "Swirls a soothing green gust around your profile avatar, granting peaceful luck.",
    icon: "🍃",
    priceWinds: 250,
    priceGems: 0,
    rarity: "Common",
    effectBonus: "+5% Winds from Wheel spins",
    isFeatured: true,
  },
  {
    name: "Celestial Storm Aura",
    slug: "celestial-storm-aura",
    category: "auras",
    description: "Crackles with divine cyan lightning and cosmic gale vortices.",
    icon: "⚡",
    priceWinds: 1200,
    priceGems: 10,
    rarity: "Epic",
    effectBonus: "+20% Cyclone Rush multiplier cap",
    isFeatured: true,
  },
  {
    name: "Golden Seraph Winds",
    slug: "golden-seraph-winds",
    category: "auras",
    description: "Holy golden currents blessed by the Ancient Winds Pantheon.",
    icon: "✨",
    priceWinds: 3500,
    priceGems: 40,
    rarity: "Divine",
    effectBonus: "1.5x all Daily Blessing wind awards",
    isFeatured: true,
  },
  // Charms
  {
    name: "Feather of Boreas",
    slug: "feather-of-boreas",
    category: "charms",
    description: "A crystal feather that bends harsh northern winds in your favor.",
    icon: "🪶",
    priceWinds: 400,
    priceGems: 0,
    rarity: "Rare",
    effectBonus: "Prevents first crash below 1.5x in Cyclone Rush",
    isFeatured: false,
  },
  {
    name: "Eye of the Hurricane",
    slug: "eye-of-the-hurricane",
    category: "charms",
    description: "Grants supreme calm and composure amidst raging vortex bets.",
    icon: "👁️",
    priceWinds: 1800,
    priceGems: 15,
    rarity: "Legendary",
    effectBonus: "+15% higher jackpot chance on Tempest Slots",
    isFeatured: true,
  },
  // Boosts
  {
    name: "Gale Speed Elixir (2x)",
    slug: "gale-speed-elixir",
    category: "boosts",
    description: "Bottled hurricane power! Doubles Zephyr tap harvest for 100 clicks.",
    icon: "🧪",
    priceWinds: 150,
    priceGems: 0,
    rarity: "Common",
    effectBonus: "+2x Winds per click in Wind Harvester",
    isFeatured: false,
  },
  {
    name: "Typhoon Blessing Flask",
    slug: "typhoon-blessing-flask",
    category: "boosts",
    description: "Infuses your spirit with 500 bonus Winds directly from the upper stratosphere.",
    icon: "🏺",
    priceWinds: 0,
    priceGems: 5,
    rarity: "Rare",
    effectBonus: "Instant +500 Winds grant",
    isFeatured: false,
  },
  // Companions / Pets
  {
    name: "Zephyr Sprite",
    slug: "zephyr-sprite",
    category: "pets",
    description: "A playful fairy composed of spring gusts that chirps whenever you win.",
    icon: "🧚",
    priceWinds: 850,
    priceGems: 5,
    rarity: "Rare",
    effectBonus: "Auto-gathers 10 Winds every 5 minutes",
    isFeatured: true,
  },
  {
    name: "Sky Drake Hatchling",
    slug: "sky-drake-hatchling",
    category: "pets",
    description: "A noble aerial beast capable of breathing lucky windstorms.",
    icon: "🐉",
    priceWinds: 5000,
    priceGems: 50,
    rarity: "Divine",
    effectBonus: "+25% extra payout on all win events",
    isFeatured: true,
  },
  // Titles
  {
    name: "Herald of the Tempest",
    slug: "title-tempest-herald",
    category: "titles",
    description: "Prestigious title display for master riders of the storm.",
    icon: "🏷️",
    priceWinds: 600,
    priceGems: 2,
    rarity: "Rare",
    effectBonus: "Special Golden Nameplate in Chat & Leaderboard",
    isFeatured: false,
  },
  {
    name: "High Wind Archon",
    slug: "title-wind-archon",
    category: "titles",
    description: "Only the truest wind disciples may claim this mythical mantle.",
    icon: "👑",
    priceWinds: 2800,
    priceGems: 25,
    rarity: "Legendary",
    effectBonus: "Unlocks Archon Glow and VIP Profile border",
    isFeatured: false,
  },
];

export const INITIAL_QUESTS = [
  {
    questKey: "daily_harvest",
    title: "Zephyr Catcher",
    description: "Tap the Wind Harvester 20 times to gather raw breeze essence.",
    rewardWinds: 150,
    rewardGems: 2,
    progress: 0,
    target: 20,
  },
  {
    questKey: "wheel_spinner",
    title: "Winds of Fortune",
    description: "Spin the Wheel of Gales at least 3 times.",
    rewardWinds: 200,
    rewardGems: 3,
    progress: 0,
    target: 3,
  },
  {
    questKey: "cyclone_surfer",
    title: "Cyclone Survivor",
    description: "Cash out at 2.0x or higher in Cyclone Rush.",
    rewardWinds: 300,
    rewardGems: 5,
    progress: 0,
    target: 1,
  },
  {
    questKey: "shop_patron",
    title: "Wind Merchant's Friend",
    description: "Acquire any item from the Blessed Wind Shop.",
    rewardWinds: 250,
    rewardGems: 4,
    progress: 0,
    target: 1,
  },
];

export async function ensureDefaultUser() {
  let [user] = await db.select().from(users).where(eq(users.username, DEFAULT_USERNAME)).limit(1);

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        username: DEFAULT_USERNAME,
        displayName: "Zephyr Nomad",
        avatarUrl: "🌪️",
        windBalance: 2500,
        gemBalance: 45,
        level: 3,
        xp: 520, // matches the level formula used by the API routes: floor(xp / 250) + 1 = 3
        title: "Zephyr Apprentice",
        bio: "Harnessing the celestial gusts of the Blessed Winds sanctuary.",
        blessingTier: "Silver Gale Disciple",
        equippedBadge: "🌬️ Wind Walker",
        equippedAura: "emerald_breeze",
        streakDays: 4,
        wheelFreeSpinsUsed: 0,
        wheelPaidSpinsUsed: 0,
        wheelSpinsDate: new Date(),
      })
      .returning();
    user = newUser;
  }

  // Check shop items
  const existingShopItems = await db.select().from(shopItems).limit(1);
  if (existingShopItems.length === 0) {
    await db.insert(shopItems).values(INITIAL_SHOP_ITEMS);
  }

  // Check user quests
  const existingQuests = await db
    .select()
    .from(userQuests)
    .where(eq(userQuests.userId, user.id));

  if (existingQuests.length === 0) {
    await db.insert(userQuests).values(
      INITIAL_QUESTS.map((q) => ({
        ...q,
        userId: user.id,
      }))
    );
  }

  // Ensure initial starter item in inventory
  const userItems = await db
    .select()
    .from(userInventory)
    .where(eq(userInventory.userId, user.id));

  if (userItems.length === 0) {
    const [firstItem] = await db.select().from(shopItems).limit(1);
    if (firstItem) {
      await db.insert(userInventory).values({
        userId: user.id,
        itemId: firstItem.id,
        quantity: 1,
        isEquipped: true,
      });
    }
  }

  return user;
}
