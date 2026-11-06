"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Crown,
  Flame,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  Wind,
} from "lucide-react";

/* ---------------------------------- types --------------------------------- */

interface Rider {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  windBalance: number;
  level: number;
  title: string | null;
}

interface WinRow {
  sessionId: number;
  displayName: string;
  avatarUrl: string | null;
  gameType: string;
  payoutWinds: number;
  createdAt: string;
}

interface LeaderboardPayload {
  byWinds: Rider[];
  recentWins: WinRow[];
  me: { id: number; windsRank: number; totalPlayers: number };
}

interface SpinPayload {
  round: {
    id: number;
    status: "betting" | "spinning" | "finished" | string;
    bettingEndsAt: string;
    totalPot: number;
    winningColor: string | null;
  };
  colorTotals: Record<string, number>;
  playersCount: number;
  serverTime: number;
}

const COLOR_HEX: Record<string, string> = {
  green: "#34d399",
  red: "#fb7185",
  blue: "#60a5fa",
};

const GAME_LABEL: Record<string, string> = {
  wheel: "Wheel of Gales",
  cyclone: "Cyclone Rush",
  slots: "Tempest Slots",
  harvester: "Zephyr Harvester",
  spin: "Live Arena",
};

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return value.toLocaleString();
}

/* ------------------------------- data hooks -------------------------------- */

function useLeaderboard() {
  const [data, setData] = useState<LeaderboardPayload | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) return;
        const json = (await res.json()) as LeaderboardPayload;
        if (alive) setData(json);
      } catch {
        /* the cards simply stay empty */
      }
    };
    void load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return data;
}

function useLiveRound() {
  const [data, setData] = useState<SpinPayload | null>(null);
  const [skew, setSkew] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/spin", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SpinPayload;
        if (!alive) return;
        setData(json);
        if (json.serverTime) setSkew(Date.now() - json.serverTime);
      } catch {
        /* keep the previous snapshot */
      }
    };
    void load();
    const timer = setInterval(load, 6_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return { data, skew };
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/* ------------------------------ winners ticker ----------------------------- */

export function WinnersTicker() {
  const board = useLeaderboard();

  const rows = useMemo(() => {
    const wins = board?.recentWins ?? [];
    if (wins.length === 0) {
      return [
        { label: "Wheel of Gales", detail: "10x payout claimed", icon: "🌪️" },
        { label: "Live Arena", detail: "Green riders split 950 pot", icon: "🟢" },
        { label: "Cyclone Rush", detail: "4,850 Winds at 9.7x", icon: "🌀" },
      ];
    }
    return wins.map((win) => ({
      label: win.displayName,
      detail: `${GAME_LABEL[win.gameType] ?? win.gameType} · +${win.payoutWinds.toLocaleString()}`,
      icon: win.avatarUrl || "🌪️",
    }));
  }, [board]);

  const track = [...rows, ...rows];

  return (
    <div className="pf-card pf-card-hover pf-card-lift fade-x relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/60 py-3 backdrop-blur">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap px-6">
        {track.map((row, index) => (
          <span
            key={`${row.label}-${index}`}
            className="flex items-center gap-2.5 text-xs text-slate-300"
          >
            <span className="text-base leading-none">{row.icon}</span>
            <span className="font-bold text-white">{row.label}</span>
            <span className="text-cyan-300/90">{row.detail}</span>
            <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- live arena -------------------------------- */

export function LiveArenaCard() {
  const { data, skew } = useLiveRound();
  const { setActiveTab } = useUser();
  const now = useNow();

  const round = data?.round;
  const totals = data?.colorTotals ?? { green: 0, red: 0, blue: 0 };
  const pot = round?.totalPot ?? 0;
  const totalStaked = totals.green + totals.red + totals.blue;

  const share = (color: string) =>
    totalStaked > 0 ? Math.round((totals[color] / totalStaked) * 100) : 33;

  const green = share("green");
  const red = share("red");

  const wheelGradient = `conic-gradient(${COLOR_HEX.green} 0% ${green}%, ${COLOR_HEX.red} ${green}% ${
    green + red
  }%, ${COLOR_HEX.blue} ${green + red}% 100%)`;

  const remainingMs = round ? new Date(round.bettingEndsAt).getTime() - (now - skew) : 0;
  const countdown = Math.max(0, Math.ceil(remainingMs / 1000));
  const isBetting = round?.status === "betting";

  return (
    <div className="pf-card pf-card-hover pf-card-lift relative overflow-hidden rounded-2xl p-5">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live Arena
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
          <Users className="h-3 w-3" />
          {data?.playersCount ?? 0} players
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-4">
        <div
          className="relative h-20 w-20 flex-none rounded-full p-[3px] shadow-[0_0_25px_-6px_rgba(52,211,153,0.6)]"
          style={{ background: wheelGradient }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/90">
            <Wind className="h-7 w-7 animate-spin-slow text-cyan-300" />
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Pot</p>
          <p className="text-2xl font-black text-white">
            {pot.toLocaleString()} <span className="text-xs font-bold text-emerald-400">WND</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            {isBetting ? (
              <>
                <Timer className="h-3.5 w-3.5 text-cyan-400" />
                Bets close in <span className="font-bold text-cyan-300 tabular-nums">{countdown}s</span>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                <span className="capitalize">{round?.status ?? "syncing"}…</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="relative mt-4 space-y-1.5">
        {(["green", "red", "blue"] as const).map((color) => (
          <div key={color} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_HEX[color] }}
            />
            <span className="w-12 capitalize text-slate-400">{color}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${share(color)}%`, backgroundColor: COLOR_HEX[color] }}
              />
            </div>
            <span className="w-14 text-right font-semibold tabular-nums text-slate-300">
              {compact(totals[color] ?? 0)}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setActiveTab("games")}
        className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20"
      >
        Join <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* -------------------------------- top riders ------------------------------- */

export function TopRidersCard() {
  const board = useLeaderboard();
  const { setActiveTab } = useUser();
  const riders = (board?.byWinds ?? []).slice(0, 5);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="pf-card pf-card-hover pf-card-lift relative overflow-hidden rounded-2xl p-5">
      <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
          <Trophy className="h-3.5 w-3.5" /> Top Riders
        </span>
        {board?.me ? (
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
            You: #{board.me.windsRank} / {board.me.totalPlayers}
          </span>
        ) : null}
      </div>

      <ul className="relative mt-4 space-y-2">
        {riders.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="h-9 animate-pulse rounded-lg bg-slate-800/50" />
            ))
          : riders.map((rider, index) => {
              const isMe = board?.me?.id === rider.id;
              return (
                <li
                  key={rider.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 transition ${
                    isMe
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-transparent hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <span className="w-5 text-center text-xs font-black text-slate-400">
                    {medals[index] ?? index + 1}
                  </span>
                  <span className="text-lg leading-none">{rider.avatarUrl || "🌪️"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-white">
                      {rider.displayName}
                      {isMe ? <span className="ml-1 text-[10px] text-cyan-300">(you)</span> : null}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">
                      Lv {rider.level} · {rider.title ?? "Wanderer"}
                    </span>
                  </span>
                  <span className="text-right text-xs font-black text-cyan-200 tabular-nums">
                    {compact(rider.windBalance)}
                  </span>
                </li>
              );
            })}
      </ul>

      <button
        onClick={() => setActiveTab("leaderboard")}
        className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20"
      >
        Full rankings <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* -------------------------------- quest card ------------------------------- */

export function QuestsCard() {
  const { quests, setActiveTab } = useUser();
  const preview = quests.slice(0, 3);
  const done = quests.filter((quest) => quest.isClaimed).length;

  return (
    <div className="pf-card pf-card-hover pf-card-lift relative overflow-hidden rounded-2xl p-5">
      <div className="absolute -right-12 bottom-[-3rem] h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
          <Target className="h-3.5 w-3.5" /> Quests
        </span>
        <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-200">
          {done}/{quests.length || 0} claimed
        </span>
      </div>

      <ul className="relative mt-4 space-y-3">
        {preview.length === 0
          ? Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/70" />
                <div className="h-1.5 animate-pulse rounded-full bg-slate-800/70" />
              </li>
            ))
          : preview.map((quest) => {
              const percent = Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100));
              return (
                <li key={quest.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-200">
                      {quest.isClaimed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-400" />
                      ) : (
                        <Flame
                          className={`h-3.5 w-3.5 flex-none ${
                            quest.isCompleted ? "text-amber-400" : "text-slate-500"
                          }`}
                        />
                      )}
                      <span className="truncate">{quest.title}</span>
                    </span>
                    <span className="flex-none tabular-nums text-cyan-300">
                      {quest.progress}/{quest.target}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        quest.isCompleted
                          ? "bg-gradient-to-r from-amber-400 to-emerald-400"
                          : "bg-gradient-to-r from-cyan-500 to-sky-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
      </ul>

      <button
        onClick={() => setActiveTab("profile")}
        className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/25 bg-purple-500/10 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-500/20"
      >
        Claim rewards <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* -------------------------------- how it works ----------------------------- */

const STEPS = [
  {
    icon: Sparkles,
    title: "Daily Blessing",
    body: "Claim your daily gift every 24 hours.",
    accent: "from-amber-400/20 to-transparent text-amber-300 border-amber-400/30",
  },
  {
    icon: Wind,
    title: "Play Games",
    body: "Play Wheel, Cyclone, Slots, or Harvester to win Winds.",
    accent: "from-cyan-400/20 to-transparent text-cyan-300 border-cyan-400/30",
  },
  {
    icon: Crown,
    title: "Climb Leaderboard",
    body: "Spend Winds on auras and titles. Climb the ranks.",
    accent: "from-emerald-400/20 to-transparent text-emerald-300 border-emerald-400/30",
  },
];

export function HowItWorks() {
  const { setActiveTab } = useUser();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-slate-900/40 p-6 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px hairline" />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">How to Play</h2>
          <p className="text-sm text-slate-400">Claim, play, and climb.</p>
        </div>
        <button
          onClick={() => setActiveTab("faq")}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          FAQ <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className={`pf-card pf-card-hover pf-card-lift relative overflow-hidden rounded-xl border bg-slate-950/60 p-5 ${step.accent}`}
            >
              <span className="absolute right-4 top-3 text-4xl font-black text-white/5">
                0{index + 1}
              </span>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-transparent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------- combined -------------------------------- */

export default function HomeHighlights() {
  return (
    <div className="space-y-6">
      <WinnersTicker />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <LiveArenaCard />
        <TopRidersCard />
        <QuestsCard />
      </div>
      <HowItWorks />
    </div>
  );
}
