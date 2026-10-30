import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").default("🌪️"),
  windBalance: integer("wind_balance").notNull().default(1000),
  gemBalance: integer("gem_balance").notNull().default(25),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  title: text("title").default("Zephyr Novice"),
  bio: text("bio").default("Embracing the Blessed Winds on a legendary journey."),
  blessingTier: text("blessing_tier").default("Aero Disciple"),
  equippedBadge: text("equipped_badge").default("🌬️ Wind Whisperer"),
  equippedAura: text("equipped_aura").default("emerald_breeze"),
  lastDailyClaim: timestamp("last_daily_claim"),
  streakDays: integer("streak_days").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // 'auras', 'charms', 'boosts', 'pets', 'titles'
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  priceWinds: integer("price_winds").notNull(),
  priceGems: integer("price_gems").default(0),
  rarity: text("rarity").notNull().default("Common"), // Common, Rare, Epic, Legendary, Divine
  effectBonus: text("effect_bonus").notNull(), // e.g. "+15% Wind Yield in Games"
  stock: integer("stock").default(-1), // -1 for unlimited
  isFeatured: boolean("is_featured").default(false),
});

export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => shopItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  isEquipped: boolean("is_equipped").default(false),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameType: text("game_type").notNull(), // 'wind_wheel', 'cyclone_rush', 'tempest_slots', 'zephyr_clicker'
  betWinds: integer("bet_winds").notNull().default(0),
  payoutWinds: integer("payout_winds").notNull().default(0),
  netProfit: integer("net_profit").notNull().default(0),
  score: integer("score").default(0),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const windTransactions = pgTable("wind_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'daily_blessing', 'game_reward', 'shop_purchase', 'quest_reward', 'wind_fountain'
  amount: integer("amount").notNull(), // positive for earned, negative for spent
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const spinRounds = pgTable("spin_rounds", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("betting"), // 'betting' | 'spinning' | 'finished'
  bettingEndsAt: timestamp("betting_ends_at").notNull(),
  spinEndsAt: timestamp("spin_ends_at"),
  totalPot: integer("total_pot").notNull().default(0),
  winningTicket: integer("winning_ticket"), // 0..999999 (fraction of pot)
  winningColor: text("winning_color"),
  winningColorTotal: integer("winning_color_total").notNull().default(0),
  winnersCount: integer("winners_count").notNull().default(0),
  winnerUserId: integer("winner_user_id"),
  winnerName: text("winner_name"),
  winnerAvatar: text("winner_avatar"),
  winnerIsBot: boolean("winner_is_bot").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const spinBets = pgTable("spin_bets", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull().references(() => spinRounds.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  playerName: text("player_name").notNull(),
  avatar: text("avatar").notNull().default("🌪️"),
  color: text("color").notNull(), // 'green' | 'red' | 'blue'
  amount: integer("amount").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questKey: text("quest_key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardWinds: integer("reward_winds").notNull(),
  rewardGems: integer("reward_gems").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(1),
  isCompleted: boolean("is_completed").notNull().default(false),
  isClaimed: boolean("is_claimed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
