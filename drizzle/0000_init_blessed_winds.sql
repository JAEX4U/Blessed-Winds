CREATE TABLE "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"bet_winds" integer DEFAULT 0 NOT NULL,
	"payout_winds" integer DEFAULT 0 NOT NULL,
	"net_profit" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"price_winds" integer NOT NULL,
	"price_gems" integer DEFAULT 0,
	"rarity" text DEFAULT 'Common' NOT NULL,
	"effect_bonus" text NOT NULL,
	"stock" integer DEFAULT -1,
	"is_featured" boolean DEFAULT false,
	CONSTRAINT "shop_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spin_bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"user_id" integer,
	"player_name" text NOT NULL,
	"avatar" text DEFAULT '🌪️' NOT NULL,
	"color" text NOT NULL,
	"amount" integer NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spin_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'betting' NOT NULL,
	"betting_ends_at" timestamp NOT NULL,
	"spin_ends_at" timestamp,
	"total_pot" integer DEFAULT 0 NOT NULL,
	"winning_ticket" integer,
	"winning_color" text,
	"winning_color_total" integer DEFAULT 0 NOT NULL,
	"winners_count" integer DEFAULT 0 NOT NULL,
	"winner_user_id" integer,
	"winner_name" text,
	"winner_avatar" text,
	"winner_is_bot" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_equipped" boolean DEFAULT false,
	"acquired_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"quest_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reward_winds" integer NOT NULL,
	"reward_gems" integer DEFAULT 0 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text DEFAULT '🌪️',
	"wind_balance" integer DEFAULT 1000 NOT NULL,
	"gem_balance" integer DEFAULT 25 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"title" text DEFAULT 'Zephyr Novice',
	"bio" text DEFAULT 'Embracing the Blessed Winds on a legendary journey.',
	"blessing_tier" text DEFAULT 'Aero Disciple',
	"equipped_badge" text DEFAULT '🌬️ Wind Whisperer',
	"equipped_aura" text DEFAULT 'emerald_breeze',
	"last_daily_claim" timestamp,
	"streak_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wind_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_bets" ADD CONSTRAINT "spin_bets_round_id_spin_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."spin_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_item_id_shop_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wind_transactions" ADD CONSTRAINT "wind_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;