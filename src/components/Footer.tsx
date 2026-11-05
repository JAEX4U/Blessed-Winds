"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Wind, Heart, Shield, Sparkles, Activity } from "lucide-react";

/** Small live indicator that pings /api/health so visitors can see the realm is up. */
function RealmStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      if (!alive || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean };
        if (alive) setStatus(res.ok && json.ok ? "online" : "offline");
      } catch {
        if (alive) setStatus("offline");
      }
    };

    void ping();
    timer = setInterval(ping, 60_000);

    // Pause polling when the tab is hidden to save battery and requests
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const palette =
    status === "online"
      ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/10"
      : status === "offline"
        ? "text-rose-300 border-rose-400/30 bg-rose-500/10"
        : "text-slate-400 border-slate-700 bg-slate-900";

  const label =
    status === "online" ? "Realm online" : status === "offline" ? "Realm offline" : "Checking realm…";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${palette}`}
      title="Live database connection status"
    >
      <Activity className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function Footer() {
  const { setActiveTab } = useUser();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="pf-card p-6 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-base font-black text-white tracking-tight">BLESSED WINDS</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Free-to-play wind games. Earn Winds, play, and climb.
            </p>
          </div>

          <div className="pf-card p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab("home")} className="hover:text-cyan-300 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Games
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("shop")} className="hover:text-cyan-300 transition-colors">
                  Shop
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("leaderboard")} className="hover:text-cyan-300 transition-colors">
                  Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("profile")} className="hover:text-cyan-300 transition-colors">
                  Profile
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("faq")} className="hover:text-cyan-300 transition-colors">
                  FAQ
                </button>
              </li>
              <li>
                <a href="/guide" className="hover:text-cyan-300 transition-colors">
                  Creator Guide
                </a>
              </li>
            </ul>
          </div>

          <div className="pf-card p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Games Arena</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Live Jackpot Spin
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Wheel of Gales
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Cyclone Rush
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Tempest Slots
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("games")} className="hover:text-cyan-300 transition-colors">
                  Zephyr Harvester
                </button>
              </li>
            </ul>
          </div>

          <div className="pf-card p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Sanctuary Rules</h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              Play-money demo. No cash prizes.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Play-money demo • No cash prizes</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <div className="flex items-center gap-3">
            <span>© 2026 Blessed Winds.</span>
            <RealmStatus />
          </div>
          <div className="flex items-center space-x-1">
            <span>Powered by the Four Gales</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
        </div>
      </div>
    </footer>
  );
}
