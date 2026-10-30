"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { Wind, Heart, Shield, Sparkles } from "lucide-react";

export default function Footer() {
  const { setActiveTab } = useUser();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-base font-black text-white tracking-tight">BLESSED WINDS</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The premier interactive fantasy wind sanctuary. Accumulate winds balance, test fate in high-altitude
              games, and acquire rare celestial aura relics.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab("home")} className="hover:text-cyan-300 transition-colors">
                  Sanctuary Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Wind Mini-Games
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("shop")} className="hover:text-cyan-300 transition-colors">
                  Breeze Bazaar Shop
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("leaderboard")} className="hover:text-cyan-300 transition-colors">
                  Hall of Gales Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("profile")} className="hover:text-cyan-300 transition-colors">
                  Player Profile & Ledger
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("faq")} className="hover:text-cyan-300 transition-colors">
                  FAQ & Prophecy
                </button>
              </li>
              <li>
                <a href="/guide" className="hover:text-cyan-300 transition-colors">
                  How to make your own website
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Games Arena</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Live Jackpot Spin (Green • Red • Blue)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Wheel of Gales (Up to 10x)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Cyclone Rush (Multiplier Crash)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Tempest Slots (50x Jackpot)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Zephyr Harvester (Free Clicker)
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Sanctuary Rules</h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              Play responsibly and enjoy the celestial gusts. Wind tokens are purely digital entertainment in this realm.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Play-money demo • No cash prizes</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <div>© 2026 Blessed Winds Sanctuary. All celestial rights reserved.</div>
          <div className="flex items-center space-x-1">
            <span>Powered by the Four Gales &</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Divine Zephyr currents</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
