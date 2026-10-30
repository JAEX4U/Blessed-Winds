"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Leaf, Flame, Droplets, Users, Timer, Trophy, Wind, Sparkles, Info, Percent, Coins, Split } from "lucide-react";
import confetti from "canvas-confetti";

type SpinColor = "green" | "red" | "blue";
const COLOR_ORDER: SpinColor[] = ["green", "red", "blue"];

const COLOR_CFG: Record<
  SpinColor,
  { label: string; base: string; alt: string; text: string; ring: string; bg: string; icon: React.ElementType }
> = {
  green: { label: "GREEN", base: "#10b981", alt: "#34d399", text: "text-emerald-400", ring: "border-emerald-400", bg: "bg-emerald-500/15", icon: Leaf },
  red: { label: "RED", base: "#ef4444", alt: "#f87171", text: "text-rose-400", ring: "border-rose-400", bg: "bg-rose-500/15", icon: Flame },
  blue: { label: "BLUE", base: "#3b82f6", alt: "#60a5fa", text: "text-sky-400", ring: "border-sky-400", bg: "bg-sky-500/15", icon: Droplets },
};

interface SpinBet {
  id: number;
  userId: number | null;
  playerName: string;
  avatar: string;
  color: SpinColor;
  amount: number;
  isBot: boolean;
  share: number; // % of their color's pool
  potential: number; // Winds they'd collect if their color hit right now
}

interface ColorStat {
  color: SpinColor;
  total: number;
  chance: number;
  multiplier: number;
  riders: number;
}

interface SpinState {
  round: {
    id: number;
    status: "betting" | "spinning" | "finished";
    bettingEndsAt: string;
    spinEndsAt: string | null;
    totalPot: number;
    winningTicket: number | null;
    winningColor: SpinColor | null;
    winningColorTotal: number;
    winnersCount: number;
    topWinnerName: string | null;
    topWinnerAvatar: string | null;
    revealMs: number;
  };
  bets: SpinBet[];
  colorTotals: Record<SpinColor, number>;
  colorStats: ColorStat[];
  playersCount: number;
  myTotal: number;
  myByColor: Record<SpinColor, number>;
  myChance: number;
  myPayout: number;
  history: { id: number; winningColor: SpinColor | null; winnersCount: number; pot: number }[];
  serverTime: number;
}

const BETTING_MS = 30000;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

function slicePath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
}

export default function LiveSpinGame() {
  const { user, refreshUser } = useUser();
  const [state, setState] = useState<SpinState | null>(null);
  const [color, setColor] = useState<SpinColor>("green");
  const [amount, setAmount] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; error?: boolean } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [rotation, setRotation] = useState(0);
  const [spinTransition, setSpinTransition] = useState<string>("none");

  const offsetRef = useRef(0);
  const rotationRef = useRef(0);
  const spunRef = useRef<number | null>(null);
  const celebratedRef = useRef<number | null>(null);
  const paidRefreshRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/spin", { cache: "no-store" });
      if (res.ok) {
        const data: SpinState = await res.json();
        offsetRef.current = data.serverTime - Date.now();
        setState(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 2000);
    const tick = setInterval(() => setNow(Date.now() + offsetRef.current), 100);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  // Drive the wheel from authoritative server phases.
  useEffect(() => {
    if (!state) return;
    const { round } = state;

    if (round.status === "betting" && spunRef.current !== null) {
      spunRef.current = null;
      setSpinTransition("none");
      const norm = rotationRef.current % 360;
      rotationRef.current = norm;
      setRotation(norm);
    }

    if (round.status === "spinning" && round.winningTicket !== null && spunRef.current !== round.id && round.spinEndsAt) {
      spunRef.current = round.id;
      const frac = round.winningTicket / 1_000_000;
      const serverNow = Date.now() + offsetRef.current;
      const dur = Math.min(6000, Math.max(1500, new Date(round.spinEndsAt).getTime() - serverNow - 250));
      const base = Math.ceil(rotationRef.current / 360) * 360;
      const target = base + 360 * 5 + (360 - frac * 360);
      rotationRef.current = target;
      setSpinTransition(`transform ${dur}ms cubic-bezier(0.12, 0.8, 0.06, 1)`);
      requestAnimationFrame(() => setRotation(target));
    }

    if (round.status === "finished") {
      if (state.myPayout > 0 && celebratedRef.current !== round.id) {
        celebratedRef.current = round.id;
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 }, colors: ["#34d399", "#f87171", "#60a5fa", "#fbbf24"] });
      }
      if (paidRefreshRef.current !== round.id) {
        paidRefreshRef.current = round.id;
        refreshUser();
      }
    }
  }, [state, refreshUser]);

  const placeBet = async () => {
    if (placing) return;
    setPlacing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        offsetRef.current = data.serverTime - Date.now();
        setState(data);
        setFeedback({ msg: `You're in! ${amount} Winds on ${COLOR_CFG[color].label}` });
        refreshUser();
      } else {
        setFeedback({ msg: data.error || "Bet failed", error: true });
      }
    } catch {
      setFeedback({ msg: "Network error — try again", error: true });
    } finally {
      setPlacing(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (!state) {
    return (
      <div className="py-24 flex flex-col items-center text-cyan-400 gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest">Opening the Live Arena...</p>
      </div>
    );
  }

  const { round, bets, colorTotals, colorStats, myChance, myTotal, myByColor, myPayout, playersCount, history } = state;
  const pot = round.totalPot;
  const bettingLeft = Math.max(0, new Date(round.bettingEndsAt).getTime() - now);
  const revealLeft = round.spinEndsAt ? Math.max(0, new Date(round.spinEndsAt).getTime() + round.revealMs - now) : 0;
  const canBet = round.status === "betting" && bettingLeft > 600;

  // Three color regions — every bet grows its color's area.
  let cursor = 0;
  const segments = COLOR_ORDER.map((c) => {
    const angle = pot > 0 ? (colorTotals[c] / pot) * 360 : 120;
    const seg = { color: c, a0: cursor, a1: cursor + angle, total: colorTotals[c] };
    cursor += angle;
    return seg;
  });

  // "If I join now" preview for the selected color.
  const joinPot = pot + amount;
  const joinColorTotal = colorTotals[color] + amount;
  const joinChance = (joinColorTotal / Math.max(1, joinPot)) * 100;
  const joinPayout = Math.floor(((myByColor[color] + amount) / Math.max(1, joinColorTotal)) * joinPot);

  const statusChip =
    round.status === "betting" ? (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        Bets Open
      </span>
    ) : round.status === "spinning" ? (
      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
        🌀 The Gales Decide...
      </span>
    ) : (
      <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
        Round Settled
      </span>
    );

  return (
    <div className="space-y-6">
      {/* Arena status strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-white">Round #{round.id}</span>
          {statusChip}
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            {playersCount} wind rider{playersCount === 1 ? "" : "s"} in the arena
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">Recent gales</span>
          <div className="flex items-center gap-1.5">
            {history.slice(0, 8).map((h) => (
              <div
                key={h.id}
                title={
                  h.winningColor
                    ? `${h.winningColor.toUpperCase()} • ${h.winnersCount} rider${h.winnersCount === 1 ? "" : "s"} split ${h.pot.toLocaleString()} Winds`
                    : "Calm round — no bets"
                }
                className="w-4 h-4 rounded-full border border-slate-950"
                style={{ backgroundColor: h.winningColor ? COLOR_CFG[h.winningColor].base : "#334155" }}
              />
            ))}
            {history.length === 0 && <span className="text-[10px] text-slate-600">no rounds yet</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============ WHEEL ============ */}
        <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-slate-900/60 border border-cyan-500/20">
          <div className="w-full mb-4">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-cyan-400" />
                {round.status === "betting" ? "Betting closes in" : round.status === "spinning" ? "Spinning" : "Next round in"}
              </span>
              <span className={`font-black tabular-nums text-base ${round.status === "betting" && bettingLeft < 6000 ? "text-rose-400 animate-pulse" : "text-cyan-300"}`}>
                {round.status === "betting"
                  ? `${(bettingLeft / 1000).toFixed(1)}s`
                  : round.status === "spinning"
                  ? "🌀"
                  : `${Math.ceil(revealLeft / 1000)}s`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${round.status === "betting" && bettingLeft < 6000 ? "bg-rose-500" : "bg-gradient-to-r from-cyan-400 to-emerald-400"}`}
                style={{
                  width:
                    round.status === "betting"
                      ? `${(bettingLeft / BETTING_MS) * 100}%`
                      : round.status === "finished"
                      ? `${(revealLeft / round.revealMs) * 100}%`
                      : "100%",
                }}
              />
            </div>
          </div>

          <div className="z-20 -mb-4 w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-lg" />

          <div className="relative w-full max-w-[340px] aspect-square">
            <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl" style={{ transform: `rotate(${rotation}deg)`, transition: spinTransition }}>
              <circle cx="160" cy="160" r="158" fill="#020617" />
              <circle cx="160" cy="160" r="155" fill="none" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="3" />
              {segments.map((seg) => {
                const cfg = COLOR_CFG[seg.color];
                const span = seg.a1 - seg.a0;
                const mine = myByColor[seg.color] > 0;
                if (span <= 0.01) return null;
                const colorBets = bets.filter((b) => b.color === seg.color).slice(0, 8);
                return (
                  <g key={seg.color}>
                    {span >= 359.99 ? (
                      <circle cx="160" cy="160" r="150" fill={cfg.base} opacity={pot > 0 ? 1 : 0.25} stroke={mine ? "#f8fafc" : "none"} strokeWidth={mine ? 3 : 0} />
                    ) : (
                      <path
                        d={slicePath(160, 160, 150, seg.a0, seg.a1)}
                        fill={cfg.base}
                        opacity={pot > 0 ? 1 : 0.25}
                        stroke={mine ? "#f8fafc" : "#020617"}
                        strokeWidth={mine ? 3 : 2}
                      />
                    )}
                    {/* Riders of this color ride inside its region */}
                    {pot > 0 &&
                      span > 12 &&
                      colorBets.map((b, i) => {
                        const n = Math.min(colorBets.length, span > 40 ? 8 : span > 22 ? 3 : 1);
                        if (i >= n) return null;
                        const mid = seg.a0 + (span * (i + 0.5)) / n;
                        const r = n > 3 && i % 2 === 1 ? 88 : 114;
                        const p = polar(160, 160, r, mid);
                        const isMine = b.userId === user?.id && !b.isBot;
                        return (
                          <g key={b.id}>
                            {isMine && <circle cx={p.x} cy={p.y} r="12" fill="#020617" opacity="0.55" />}
                            <text x={p.x} y={p.y} fontSize="16" textAnchor="middle" dominantBaseline="central" transform={`rotate(${mid}, ${p.x}, ${p.y})`}>
                              {b.avatar}
                            </text>
                          </g>
                        );
                      })}
                  </g>
                );
              })}
              <circle cx="160" cy="160" r="56" fill="#020617" stroke="#22d3ee" strokeWidth="3" />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Wind className="w-4 h-4 text-cyan-400 mb-0.5" />
              <div className="text-lg font-black text-white tabular-nums leading-none">{pot.toLocaleString()}</div>
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">Wind Pot</div>
            </div>
          </div>

          {/* Color odds + split multiplier */}
          <div className="grid grid-cols-3 gap-2 w-full mt-5">
            {colorStats.map((cs) => {
              const cfg = COLOR_CFG[cs.color];
              const Icon = cfg.icon;
              return (
                <div key={cs.color} className={`p-2.5 rounded-xl ${cfg.bg} border ${myByColor[cs.color] > 0 ? cfg.ring : "border-slate-800"} text-center`}>
                  <div className={`flex items-center justify-center gap-1 text-[10px] font-black ${cfg.text}`}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </div>
                  <div className="text-sm font-black text-white tabular-nums">{(pot > 0 ? cs.chance : 33.3).toFixed(1)}%</div>
                  <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                    <Split className="w-2.5 h-2.5" />
                    {cs.multiplier > 0 ? `splits ${cs.multiplier.toFixed(2)}x` : "no bets"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result banner */}
          {round.status === "finished" && (
            <div
              className={`w-full mt-4 p-4 rounded-2xl border text-center ${
                round.totalPot === 0
                  ? "bg-slate-900 border-slate-700"
                  : myPayout > 0
                  ? "bg-emerald-500/15 border-emerald-400/50"
                  : "bg-slate-900 border-slate-700"
              }`}
            >
              {round.totalPot === 0 || !round.winningColor ? (
                <p className="text-xs font-bold text-slate-400">🍃 Calm winds — nobody joined this round.</p>
              ) : (
                <>
                  <p className={`text-base font-black flex items-center justify-center gap-2 ${COLOR_CFG[round.winningColor].text}`}>
                    {React.createElement(COLOR_CFG[round.winningColor].icon, { className: "w-5 h-5" })}
                    {COLOR_CFG[round.winningColor].label} WINS!
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    <b className="text-amber-300">{round.totalPot.toLocaleString()} Winds</b> split between{" "}
                    <b>{round.winnersCount} rider{round.winnersCount === 1 ? "" : "s"}</b> by stake
                    {round.winningColorTotal > 0 && (
                      <> • <b className="text-cyan-300">{(round.totalPot / round.winningColorTotal).toFixed(2)}x</b> each stake</>
                    )}
                  </p>
                  {myPayout > 0 ? (
                    <p className="mt-2 text-sm font-black text-emerald-300">🏆 You collected +{myPayout.toLocaleString()} Winds!</p>
                  ) : myTotal > 0 ? (
                    <p className="mt-2 text-xs font-bold text-slate-400">Your colors missed this gale — next one is yours.</p>
                  ) : null}
                  {round.topWinnerName && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Biggest share: {round.topWinnerAvatar} {round.topWinnerName}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ============ BET PANEL ============ */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Back a Color
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              If your color wins, its riders <b className="text-cyan-300">split the whole pot</b> by stake — losing colors feed it.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {COLOR_ORDER.map((c) => {
              const cfg = COLOR_CFG[c];
              const Icon = cfg.icon;
              const active = color === c;
              return (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={!canBet}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all disabled:opacity-50 ${
                    active ? `${cfg.ring} ${cfg.bg} scale-105 shadow-lg` : "border-slate-800 bg-slate-900 hover:border-slate-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${cfg.text}`} />
                  <span className={`text-[10px] font-black ${active ? cfg.text : "text-slate-400"}`}>{cfg.label}</span>
                  {myByColor[c] > 0 && <span className="text-[9px] font-bold text-white">{myByColor[c]} in</span>}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Bet amount (Winds)</span>
              <span className="text-cyan-400 font-bold">Balance: {(user?.windBalance ?? 0).toLocaleString()}</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[25, 50, 100, 250, 500].map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  disabled={!canBet}
                  className={`py-2 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${
                    amount === a ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={10}
              value={amount}
              disabled={!canBet}
              onChange={(e) => setAmount(Math.max(10, Math.floor(Number(e.target.value)) || 10))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            />
          </div>

          {/* If-you-join preview */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-cyan-400" /> {COLOR_CFG[color].label} hit chance if you join
              </span>
              <span className="font-black text-cyan-300 tabular-nums">{joinChance.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" /> You'd collect if it hits
              </span>
              <span className="font-black text-amber-300 tabular-nums">~{joinPayout.toLocaleString()} WND</span>
            </div>
          </div>

          {feedback && (
            <div className={`text-xs font-bold text-center px-3 py-2 rounded-xl ${feedback.error ? "bg-rose-950/50 text-rose-300 border border-rose-500/30" : "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"}`}>
              {feedback.msg}
            </div>
          )}

          <button
            onClick={placeBet}
            disabled={!canBet || placing || (user?.windBalance ?? 0) < amount}
            className="w-full py-4 rounded-2xl text-slate-950 font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(90deg, ${COLOR_CFG[color].base}, ${COLOR_CFG[color].alt})` }}
          >
            <Sparkles className="w-5 h-5" />
            {round.status === "betting"
              ? placing
                ? "Joining the gale..."
                : `Bet ${amount.toLocaleString()} on ${COLOR_CFG[color].label}`
              : round.status === "spinning"
              ? "Wheel is spinning..."
              : "Waiting for next round..."}
          </button>

          {/* My standing */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-slate-400">Your stake this round</div>
              <div className="font-black text-white">{myTotal.toLocaleString()} Winds</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-cyan-400">Your colors' chance</div>
              <div className="text-xl font-black text-cyan-300 tabular-nums">{myChance.toFixed(1)}%</div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed flex gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Example: you & a rival each put 100 on GREEN, 200 sits on RED. GREEN hits → you each take 200 (half the 400 pot).
            Bigger color = safer but smaller split. Rival sky-spirits join automatically.
          </p>
        </div>

        {/* ============ RIDERS ============ */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Riders & Splits
          </h3>
          {colorStats.map((cs) => {
            const cfg = COLOR_CFG[cs.color];
            const Icon = cfg.icon;
            const list = bets.filter((b) => b.color === cs.color);
            return (
              <div key={cs.color} className="space-y-1.5">
                <div className={`flex items-center justify-between text-[10px] font-black uppercase tracking-wider ${cfg.text}`}>
                  <span className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" /> {cfg.label} • {cs.riders}
                  </span>
                  <span>{cs.multiplier > 0 ? `${cs.multiplier.toFixed(2)}x split` : "—"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cs.chance}%`, backgroundColor: cfg.base }} />
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {list.length === 0 && <div className="text-[10px] text-slate-600 italic py-1">No riders yet</div>}
                  {list.map((b) => {
                    const mine = b.userId === user?.id && !b.isBot;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] ${mine ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-slate-950/60"}`}
                        title={`${b.share.toFixed(1)}% of ${cfg.label} → collects ~${b.potential.toLocaleString()} Winds if it hits`}
                      >
                        <span className="text-base leading-none">{b.avatar}</span>
                        <span className={`flex-1 truncate font-semibold ${mine ? "text-cyan-300" : "text-slate-300"}`}>
                          {mine ? "You" : b.playerName}
                        </span>
                        <span className="text-slate-400 tabular-nums">{b.amount}</span>
                        <span className={`font-black tabular-nums ${cfg.text}`}>→{b.potential.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="text-[9px] text-slate-600 leading-relaxed">
            → shows what each rider collects right now if that color wins. Share of the color pool = stake ÷ color total.
          </p>
        </div>
      </div>
    </div>
  );
}
