"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  Wind,
  Sparkles,
  Gamepad2,
  ShoppingBag,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Compass,
  Flame,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function HomeSection() {
  const { user, setActiveTab, offerFountain } = useUser();
  const [fountainLoading, setFountainLoading] = useState(false);
  const [fountainNote, setFountainNote] = useState<string | null>(null);

  const handleFountainClick = async () => {
    setFountainLoading(true);
    const res = await offerFountain();
    setFountainLoading(false);
    setFountainNote(res.message);
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#38bdf8", "#34d399", "#a7f3d0"],
      });
    }
    setTimeout(() => setFountainNote(null), 4000);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-sky-950/80 p-8 md:p-12 shadow-2xl shadow-cyan-950/40">
        {/* Ambient atmospheric gusts */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Sanctuary of the Four Gales</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Harness the Power of{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent underline decoration-cyan-400/30">
                Blessed Winds
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Step into an ethereal realm where gentle breezes and torrential typhoons grant boundless wealth.
              Earn winds, wager in fortune games, expand your mystical inventory, and ascend to Archon status.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setActiveTab("games")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm flex items-center space-x-2 shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Play Wind Games</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => setActiveTab("shop")}
                className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-sm flex items-center space-x-2 transition-all hover:border-cyan-400"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Visit Bazaar Shop</span>
              </button>
            </div>
            <a
              href="/guide"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-300"
            >
              Want to make a website like this? Read the creator guide
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* User Fast Overview Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-sky-400/30 bg-slate-900/90 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30">
                    {user?.avatarUrl || "🌪️"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.displayName || "Zephyr Traveler"}</h3>
                    <p className="text-xs text-cyan-400 font-medium">{user?.title || "Zephyr Apprentice"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">Level</span>
                  <div className="text-xl font-black text-amber-400">{user?.level ?? 1}</div>
                </div>
              </div>

              {/* Winds Balance Display */}
              <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-cyan-950/60 border border-cyan-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    Available Winds Balance
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline space-x-2">
                  <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                    {(user?.windBalance ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-cyan-400">WINDS</span>
                </div>
              </div>

              {/* Quick Interactive: Wind Fountain Offering */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Sacred Wind Fountain
                  </span>
                  <span className="text-[11px] text-cyan-400">Free Wind Well</span>
                </div>
                <button
                  onClick={handleFountainClick}
                  disabled={fountainLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{fountainLoading ? "Communing with the Winds..." : "Touch the Wind Fountain (+50-150 WND)"}</span>
                </button>
                {fountainNote && (
                  <p className="mt-2 text-center text-xs font-semibold text-emerald-400 animate-pulse">
                    {fountainNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => setActiveTab("games")}
          className="cursor-pointer group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300">5 Games + Live Arena</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live multiplayer Jackpot Spin on green/red/blue, plus Wheel of Gales, Cyclone Rush, Slots & Harvester.
          </p>
        </div>

        <div
          onClick={() => setActiveTab("shop")}
          className="cursor-pointer group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300">Breeze Bazaar</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Acquire celestial Auras, Charms, Wind Flasks, Sprites, and mythical titles.
          </p>
        </div>

        <div
          onClick={() => setActiveTab("profile")}
          className="cursor-pointer group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/90 transition-all shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300">Player Profile</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Equip cosmetics, inspect your level progress, quests, and full transaction history.
          </p>
        </div>

        <div
          onClick={() => setActiveTab("faq")}
          className="cursor-pointer group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300">Lore & FAQ</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Understand Wind Mechanics, multipliers, drop rates, and legendary lore secrets.
          </p>
        </div>
      </section>

      {/* Wind Realm Pillars */}
      <section className="rounded-2xl border border-sky-500/20 bg-slate-900/40 p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">The Four Cardinal Winds</h2>
            <p className="text-sm text-slate-400">
              Each wind brings distinct fortune and gameplay advantages across the sanctuary.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("games")}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-all border border-cyan-500/30"
          >
            Launch Games
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
            <div className="text-2xl">🌱 Zephyrus (West)</div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">The Gentle Spring</div>
            <p className="text-xs text-slate-400">
              Reliable growth. Powers the daily Wind Harvester and guarantees steady wind tokens.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-2">
            <div className="text-2xl">❄️ Boreas (North)</div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">The Frost Hurricane</div>
            <p className="text-xs text-slate-400">
              High risk, high payout. Dictates the high multipliers in the Cyclone Rush crash game.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-2">
            <div className="text-2xl">☀️ Notus (South)</div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">The Blazing Gale</div>
            <p className="text-xs text-slate-400">
              Brings warmth and rare treasures into the Bazaar shop with limited-edition charms.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-2">
            <div className="text-2xl">⚡ Eurus (East)</div>
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">The Storm Whirlwind</div>
            <p className="text-xs text-slate-400">
              Powers the Wheel of Gales and Tempest Slots with lightning-fast jackpot chances.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
