"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Trophy, Wind, Crown, Medal, TrendingUp, RefreshCw, Flame, Star, Gamepad2, Zap } from "lucide-react";

interface Player {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  windBalance: number;
  gemBalance: number;
  level: number;
  xp: number;
  title: string | null;
  streakDays: number;
}

interface BigWin {
  sessionId: number;
  userId: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  title: string | null;
  level: number;
  gameType: string;
  betWinds: number;
  payoutWinds: number;
  netProfit: number;
  createdAt: string;
}

interface RecentWin {
  sessionId: number;
  displayName: string;
  avatarUrl: string | null;
  gameType: string;
  payoutWinds: number;
  netProfit: number;
  createdAt: string;
}

interface LeaderboardData {
  byWinds: Player[];
  byLevel: Player[];
  biggestWins: BigWin[];
  recentWins: RecentWin[];
  me: { id: number; windsRank: number; levelRank: number; totalPlayers: number };
}

type Board = "winds" | "level" | "wins";

const GAME_LABELS: Record<string, string> = {
  wheel: "Wheel of Gales",
  cyclone: "Cyclone Rush",
  slots: "Tempest Slots",
  harvester: "Zephyr Harvester",
};

function timeAgo(dateStr: string) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Row {
  key: string;
  userId: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  title: string | null;
  level: number;
  primary: string;
  primaryLabel: string;
  secondary: string;
}

export default function LeaderboardSection() {
  const { user, setActiveTab } = useUser();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [board, setBoard] = useState<Board>("winds");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const rows: Row[] = !data
    ? []
    : board === "winds"
    ? data.byWinds.map((p) => ({
        key: `w-${p.id}`,
        userId: p.id,
        displayName: p.displayName,
        username: p.username,
        avatarUrl: p.avatarUrl,
        title: p.title,
        level: p.level,
        primary: p.windBalance.toLocaleString(),
        primaryLabel: "Winds",
        secondary: `🔥 ${p.streakDays}-day streak`,
      }))
    : board === "level"
    ? data.byLevel.map((p) => ({
        key: `l-${p.id}`,
        userId: p.id,
        displayName: p.displayName,
        username: p.username,
        avatarUrl: p.avatarUrl,
        title: p.title,
        level: p.level,
        primary: `Lv. ${p.level}`,
        primaryLabel: `${p.xp.toLocaleString()} XP`,
        secondary: `${p.windBalance.toLocaleString()} Winds`,
      }))
    : data.biggestWins.map((w) => ({
        key: `b-${w.sessionId}`,
        userId: w.userId,
        displayName: w.displayName,
        username: w.username,
        avatarUrl: w.avatarUrl,
        title: w.title,
        level: w.level,
        primary: `+${w.payoutWinds.toLocaleString()}`,
        primaryLabel: `${w.betWinds > 0 ? (w.payoutWinds / w.betWinds).toFixed(1) + "x" : "free"} payout`,
        secondary: `${GAME_LABELS[w.gameType] ?? w.gameType} • ${timeAgo(w.createdAt)}`,
      }));

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const boards: { id: Board; label: string; icon: React.ElementType }[] = [
    { id: "winds", label: "Richest Winds", icon: Wind },
    { id: "level", label: "Highest Level", icon: Star },
    { id: "wins", label: "Biggest Wins", icon: Flame },
  ];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center text-cyan-400 gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest">Consulting the Sky Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </span>
            <span>Hall of Gales Leaderboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            The mightiest wind-wielders of the sanctuary. Climb the ranks and etch your name in the sky.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-slate-300 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Your rank cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 flex items-center gap-4">
            <div className="text-4xl">{user?.avatarUrl || "🌪️"}</div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">Your Winds Rank</div>
              <div className="text-2xl font-black text-white">
                #{data.me.windsRank} <span className="text-xs text-slate-400 font-semibold">of {data.me.totalPlayers}</span>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-500/30 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-300">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Your Level Rank</div>
              <div className="text-2xl font-black text-white">
                #{data.me.levelRank} <span className="text-xs text-slate-400 font-semibold">Lv. {user?.level ?? 1}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("games")}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600/80 to-cyan-600/80 hover:from-emerald-500 hover:to-cyan-500 border border-emerald-400/40 flex items-center gap-4 text-left transition-all hover:scale-[1.02]"
          >
            <div className="p-3 rounded-xl bg-slate-950/30 text-white">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-100">Climb Higher</div>
              <div className="text-lg font-black text-white">Play Wind Games →</div>
            </div>
          </button>
        </div>
      )}

      {/* Board tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        {boards.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => setBoard(b.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                board === b.id
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {b.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
              {[1, 0, 2].map((idx) => {
                const p = podium[idx];
                if (!p) return <div key={idx} />;
                const isMe = p.userId === data?.me.id;
                const styles = [
                  { h: "pt-10 pb-6", ring: "border-amber-400 shadow-amber-500/30", badge: "bg-amber-400 text-slate-950", icon: Crown, glow: "from-amber-500/20" },
                  { h: "pt-8 pb-5", ring: "border-slate-300 shadow-slate-400/20", badge: "bg-slate-300 text-slate-950", icon: Medal, glow: "from-slate-400/15" },
                  { h: "pt-6 pb-4", ring: "border-orange-400 shadow-orange-500/20", badge: "bg-orange-400 text-slate-950", icon: Medal, glow: "from-orange-500/15" },
                ][idx];
                const Icon = styles.icon;
                return (
                  <div
                    key={p.key}
                    className={`relative rounded-2xl bg-gradient-to-b ${styles.glow} to-slate-900/80 border ${
                      isMe ? "border-cyan-400" : "border-slate-800"
                    } px-3 ${styles.h} flex flex-col items-center text-center`}
                  >
                    <div className={`absolute -top-3 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 ${styles.badge}`}>
                      <Icon className="w-3 h-3" /> #{idx + 1}
                    </div>
                    <div
                      className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 ${styles.ring} shadow-xl flex items-center justify-center text-3xl sm:text-4xl`}
                    >
                      {p.avatarUrl || "🌪️"}
                    </div>
                    <div className="mt-3 text-xs sm:text-sm font-black text-white truncate w-full">
                      {p.displayName} {isMe && <span className="text-cyan-400">(You)</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate w-full hidden sm:block">{p.title}</div>
                    <div className="mt-2 text-sm sm:text-lg font-black bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      {p.primary}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">{p.primaryLabel}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranked list */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 bg-slate-900 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">#</div>
              <div className="col-span-7 sm:col-span-6">Player</div>
              <div className="hidden sm:block col-span-2 text-center">Level</div>
              <div className="col-span-4 sm:col-span-3 text-right">{board === "wins" ? "Payout" : board === "level" ? "Rank" : "Balance"}</div>
            </div>
            {rest.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">No more challengers yet — the skies await!</div>
            )}
            <div className="divide-y divide-slate-800/70">
              {rest.map((p, i) => {
                const isMe = p.userId === data?.me.id;
                return (
                  <div
                    key={p.key}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors ${
                      isMe ? "bg-cyan-500/10 border-l-2 border-cyan-400" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="col-span-1 font-black text-slate-400">{i + 4}</div>
                    <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl">
                        {p.avatarUrl || "🌪️"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {p.displayName} {isMe && <span className="text-cyan-400">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{p.secondary}</div>
                      </div>
                    </div>
                    <div className="hidden sm:block col-span-2 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold text-[10px]">Lv. {p.level}</span>
                    </div>
                    <div className="col-span-4 sm:col-span-3 text-right">
                      <div className="font-black text-cyan-300">{p.primary}</div>
                      <div className="text-[10px] text-slate-500">{p.primaryLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live wins feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Wind Gusts
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="divide-y divide-slate-800/70 max-h-[520px] overflow-y-auto">
              {data?.recentWins.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">No wins yet. Be the first!</div>
              )}
              {data?.recentWins.map((w) => (
                <div key={w.sessionId} className="px-4 py-3 flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                    {w.avatarUrl || "🌪️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200 truncate">{w.displayName}</div>
                    <div className="text-[10px] text-slate-500">
                      {GAME_LABELS[w.gameType] ?? w.gameType} • {timeAgo(w.createdAt)}
                    </div>
                  </div>
                  <div className="font-black text-emerald-400">+{w.netProfit.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> Season Rewards
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>👑 <b className="text-amber-300">#1</b> — Divine "Sky Sovereign" title + 100 Gems</li>
              <li>🥈 <b className="text-slate-200">#2</b> — 60 Gems + Legendary Aura</li>
              <li>🥉 <b className="text-orange-300">#3</b> — 30 Gems + Epic Charm</li>
              <li>🌬️ <b className="text-cyan-300">Top 10</b> — 2,500 Winds bonus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
