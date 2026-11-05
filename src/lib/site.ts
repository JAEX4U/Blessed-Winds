/**
 * Single source of truth for absolute URLs used in metadata, robots, sitemap
 * and the web manifest. Override with NEXT_PUBLIC_SITE_URL when the site moves
 * to a custom domain.
 */
export const SITE_NAME = "Blessed Winds";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://blessed-winds.vercel.app"
).replace(/\/$/, "");
export const SITE_TAGLINE = "Play wind games, gather Winds, ascend the pantheon";
export const SITE_DESCRIPTION =
  "Blessed Winds is a free-to-play fantasy wind sanctuary: claim daily blessings, ride the live green/red/blue jackpot arena, spin the Wheel of Gales, surf the Cyclone, collect celestial auras in the Breeze Bazaar, and climb the Hall of Gales leaderboard.";
