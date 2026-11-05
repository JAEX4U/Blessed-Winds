"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  Wind,
  Disc,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  Sparkles,
  Trophy,
  AlertTriangle,
  Flame,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

import LiveSpinGame from "@/components/LiveSpinGame";

export default function GamesSection() {
  const { user, refreshUser } = useUser();
  const [selectedGame, setSelectedGame] = useState<"spin" | "wheel" | "cyclone" | "slots" | "harvester">("spin");

  return (
    <div className="space-y-8 pb-16">
      {/* Game Mode Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Wind className="w-6 h-6 animate-pulse" />
            </span>
            <span>Blessed Winds Games Arena</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Wager your Winds, harness gale currents, and multiply your celestial balance.
          </p>
        </div>

        {/* Game Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedGame("spin")}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedGame === "spin"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Live Jackpot Spin</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black animate-pulse">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setSelectedGame("wheel")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedGame === "wheel"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Wheel of Gales</span>
          </button>

          <button
            onClick={() => setSelectedGame("cyclone")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedGame === "cyclone"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Cyclone Rush (Crash)</span>
          </button>

          <button
            onClick={() => setSelectedGame("slots")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedGame === "slots"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tempest Slots</span>
          </button>

          <button
            onClick={() => setSelectedGame("harvester")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedGame === "harvester"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Zephyr Harvester</span>
          </button>
        </div>
      </div>

      {/* Render Selected Game */}
      {selectedGame === "spin" && <LiveSpinGame />}
      {selectedGame === "wheel" && <WheelOfGales />}
      {selectedGame === "cyclone" && <CycloneRush />}
      {selectedGame === "slots" && <TempestSlots />}
      {selectedGame === "harvester" && <ZephyrHarvester />}
    </div>
  );
}

/* =========================================================================
   1. WHEEL OF GALES COMPONENT
   ========================================================================= */
function WheelOfGales() {
  const { user, refreshUser } = useUser();
  const [spinMode, setSpinMode] = useState<"free" | "paid">("free");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(5);
  const [paidSpinsRemaining, setPaidSpinsRemaining] = useState(5);

  const PAID_SPIN_COST = 150;
  const MAX_FREE_SPINS = 5;
  const MAX_PAID_SPINS = 5;

  const freeSegments = [
    { payout: 0, label: "0", color: "from-slate-700 to-slate-800", text: "Calm Breeze (0)", weight: 30 },
    { payout: 50, label: "50", color: "from-sky-700 to-sky-900", text: "Gentle Breeze (50)", weight: 25 },
    { payout: 100, label: "100", color: "from-teal-600 to-teal-800", text: "Brisk Draft (100)", weight: 20 },
    { payout: 200, label: "200", color: "from-emerald-600 to-emerald-800", text: "Gale Gust (200)", weight: 15 },
    { payout: 500, label: "500", color: "from-cyan-600 to-blue-800", text: "Storm Surge (500)", weight: 7 },
    { payout: 800, label: "800", color: "from-purple-600 to-purple-900", text: "Typhoon Blessing (800)", weight: 2 },
    { payout: 3000, label: "3000", color: "from-amber-500 to-yellow-600", text: "BLESSED HURRICANE (3000)!", weight: 1 },
  ];

  const paidSegments = [
    { payout: 0, label: "0", color: "from-slate-700 to-slate-800", text: "Calm Breeze (0)", weight: 15 },
    { payout: 50, label: "50", color: "from-sky-700 to-sky-900", text: "Gentle Breeze (50)", weight: 20 },
    { payout: 100, label: "100", color: "from-teal-600 to-teal-800", text: "Brisk Draft (100)", weight: 22 },
    { payout: 200, label: "200", color: "from-emerald-600 to-emerald-800", text: "Gale Gust (200)", weight: 18 },
    { payout: 500, label: "500", color: "from-cyan-600 to-blue-800", text: "Storm Surge (500)", weight: 12 },
    { payout: 800, label: "800", color: "from-purple-600 to-purple-900", text: "Typhoon Blessing (800)", weight: 8 },
    { payout: 3000, label: "3000", color: "from-amber-500 to-yellow-600", text: "BLESSED HURRICANE (3000)!", weight: 5 },
  ];

  const segments = spinMode === "paid" ? paidSegments : freeSegments;
  const segmentCount = segments.length;
  const segmentAngle = 360 / segmentCount;

  const handleSpin = async () => {
    if (isSpinning) return;

    const cost = spinMode === "paid" ? PAID_SPIN_COST : 0;
    const remaining = spinMode === "paid" ? paidSpinsRemaining : freeSpinsRemaining;

    if (remaining <= 0) {
      setResultMessage(
        spinMode === "paid"
          ? "No paid spins left today. Try again tomorrow!"
          : "No free spins left today. Buy a paid spin or come back tomorrow!"
      );
      return;
    }

    if (spinMode === "paid" && (user?.windBalance ?? 0) < cost) {
      setResultMessage("Not enough Winds balance for a paid spin!");
      return;
    }

    setIsSpinning(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "wheel", bet: cost, isPaid: spinMode === "paid" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResultMessage(data.error || "Spin failed");
        setIsSpinning(false);
        return;
      }

      const segmentIndex = data.extra?.segmentIndex ?? 0;
      // Target angle so top pointer hits segmentIndex
      const randomFullSpins = 5 + Math.floor(Math.random() * 3);
      const targetDeg =
        wheelRotation +
        randomFullSpins * 360 +
        (360 - segmentIndex * segmentAngle - segmentAngle / 2);

      setWheelRotation(targetDeg);

      setTimeout(async () => {
        setIsSpinning(false);
        setResultMessage(data.message);
        setLastWin(data.payout);
        // Update remaining spin counts from server response
        setFreeSpinsRemaining(data.extra?.freeSpinsRemaining ?? 0);
        setPaidSpinsRemaining(data.extra?.paidSpinsRemaining ?? 0);
        await refreshUser();

        const netWin = data.payout - cost;
        if (netWin > 0) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.5 },
            colors: ["#38bdf8", "#34d399", "#fbbf24"],
          });
        }
      }, 3500);
    } catch {
      setIsSpinning(false);
      setResultMessage("Spin network error.");
    }
  };

  const noSpinsLeft = freeSpinsRemaining <= 0 && paidSpinsRemaining <= 0;

  // Result badge styling
  const resultBadgeClass = (() => {
    if (!lastWin) return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
    const cost = spinMode === "paid" ? PAID_SPIN_COST : 0;
    return lastWin > cost
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
  })();

  const spinButtonLabel = isSpinning
    ? "Spinning Gales..."
    : spinMode === "free"
    ? "Free Spin"
    : `Paid Spin (${PAID_SPIN_COST} WND)`;

  const bottomContent = noSpinsLeft ? (
    <div className="p-3 rounded-xl bg-rose-900/20 border border-rose-500/30 text-center">
      <p className="text-xs text-rose-400 font-medium">
        All spins used today — come back tomorrow!
      </p>
    </div>
  ) : (
    <button
      onClick={handleSpin}
      disabled={isSpinning}
      className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      <RotateCcw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
      <span>{spinButtonLabel}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 lg:p-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60">
      {/* Wheel Visual Canvas */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
        {/* Top Pointer */}
        <div className="z-20 -mb-5 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-md animate-bounce" />
        </div>

        {/* Circular Wheel */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-72 lg:h-72 rounded-full p-2 bg-gradient-to-tr from-cyan-500 via-sky-400 to-emerald-400 shadow-2xl shadow-cyan-500/30">
          <div
            className="w-full h-full rounded-full bg-slate-950 relative overflow-hidden transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            {segments.map((seg, i) => {
              const rotation = (360 / segmentCount) * i;
              return (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left flex items-start justify-center pt-3"
                  style={{
                    transform: `rotate(${rotation}deg) skewY(-45deg)`,
                  }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${seg.color} border border-cyan-400/20 flex items-start justify-center pt-2`}
                  >
                    <span
                      className="text-[10px] sm:text-xs font-black text-white drop-shadow transform -skew-y-[-45deg] leading-none"
                      style={{ transform: "rotate(22.5deg)" }}
                    >
                      {seg.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Wheel Center Cap */}
            <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900 border-4 border-cyan-400 flex items-center justify-center shadow-inner">
              <Wind className="w-6 h-6 text-cyan-300 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
          </div>
        </div>

        {resultMessage && (
          <div className="mt-6 text-center">
            <span
              className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${resultBadgeClass}`}
            >
              {resultMessage}
            </span>
          </div>
        )}

        {/* Spin button right under the wheel */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || noSpinsLeft}
          className="w-full py-3.5 rounded-2xl text-slate-950 font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          style={{ background: spinMode === "paid" ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #06b6d4, #10b981)" }}
        >
          <RotateCcw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
          <span>{isSpinning ? "Spinning Gales..." : spinButtonLabel}</span>
          {noSpinsLeft && <span className="text-[10px] text-rose-400">No spins left</span>}
        </button>
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-5 bg-slate-950/80 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-5 lg:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-cyan-400" />
            Wheel of Gales
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Spin the celestial compass. Fixed payouts: 50, 100, 200, 500, 800, 3000 Winds.
          </p>
        </div>

        {/* Daily spin counters */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Free Spins Today
            </div>
            <div className="text-xl font-black text-cyan-400">
              {freeSpinsRemaining}
            </div>
            <div className="text-[10px] text-slate-500">/ {MAX_FREE_SPINS}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paid Spins Today
            </div>
            <div className="text-xl font-black text-amber-400">
              {paidSpinsRemaining}
            </div>
            <div className="text-[10px] text-slate-500">/ {MAX_PAID_SPINS}</div>
          </div>
        </div>

        {/* Spin mode selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSpinMode("free")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              spinMode === "free"
                ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setSpinMode("paid")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              spinMode === "paid"
                ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Paid ({PAID_SPIN_COST} WND)
          </button>
        </div>

        {/* Balance info */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Winds Balance</span>
            <span className="text-cyan-400 font-bold">
              {(user?.windBalance ?? 0).toLocaleString()}
            </span>
          </label>
          <p className="text-[10px] text-slate-500">
            {spinMode === "paid" ? `Costs ${PAID_SPIN_COST} Winds per spin` : "No cost — free daily spin"}
          </p>
        </div>

        {/* Payout info */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Fixed Payouts
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Blessed Hurricane:</span>
            <span className="text-amber-400 font-bold">3000 Winds</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Typhoon Blessing:</span>
            <span className="text-purple-400 font-bold">800 Winds</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Storm Surge:</span>
            <span className="text-cyan-400 font-bold">500 Winds</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Gale Gust:</span>
            <span className="text-emerald-400 font-bold">200 Winds</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Brisk Draft:</span>
            <span className="text-teal-400 font-bold">100 Winds</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Gentle Breeze:</span>
            <span className="text-sky-400 font-bold">50 Winds</span>
          </div>
        </div>

        {bottomContent}
      </div>
    </div>
  );
}

/* =========================================================================
   2. CYCLONE RUSH (Crash Game)
   ========================================================================= */
function CycloneRush() {
  const { user, refreshUser } = useUser();
  const [bet, setBet] = useState(50);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<"idle" | "running" | "cashed_out" | "crashed">("idle");
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [cashedMultiplier, setCashedMultiplier] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  const startFlight = () => {
    if (gameState === "running") return;
    if ((user?.windBalance ?? 0) < bet) {
      setStatusMsg("Not enough Winds balance!");
      return;
    }

    setGameState("running");
    setMultiplier(1.0);
    setCashedMultiplier(null);
    setStatusMsg(null);

    // Generate random crash point with slight house edge curve
    // Weighted between 1.1x and 12x
    const rand = Math.random();
    let point = 1.0;
    if (rand < 0.08) {
      point = 1.05 + Math.random() * 0.2; // instant crash
    } else if (rand < 0.5) {
      point = 1.2 + Math.random() * 1.5; // 1.2x - 2.7x
    } else if (rand < 0.85) {
      point = 2.5 + Math.random() * 3.5; // 2.5x - 6.0x
    } else {
      point = 5.0 + Math.random() * 8.0; // 5.0x - 13.0x
    }
    point = parseFloat(point.toFixed(2));
    setCrashPoint(point);

    let current = 1.0;
    animationRef.current = setInterval(() => {
      current = parseFloat((current + 0.04 * (current * 0.8)).toFixed(2));
      setMultiplier(current);

      if (current >= point) {
        if (animationRef.current) clearInterval(animationRef.current);
        setGameState("crashed");
        setStatusMsg(`CYCLONE COLLAPSED at ${point}x! Lost ${bet} Winds.`);
        // send crash payload to server
        fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameType: "cyclone", bet, action: "crash" }),
        }).then(() => refreshUser());
      }
    }, 120);
  };

  const cashOut = async () => {
    if (gameState !== "running") return;
    if (animationRef.current) clearInterval(animationRef.current);

    const winningMult = multiplier;
    setCashedMultiplier(winningMult);
    setGameState("cashed_out");

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "cyclone",
          bet,
          action: "cashout",
          clientData: { multiplier: winningMult },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`BLESSED DESCENT! Cashed out at ${winningMult.toFixed(2)}x (+${data.payout} Winds)`);
        await refreshUser();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#34d399", "#fbbf24"],
        });
      }
    } catch {
      setStatusMsg("Error finalizing cashout");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 lg:p-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60">
      {/* Cyclone Visual Display */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center p-4 lg:p-8 bg-slate-950/90 rounded-2xl border border-slate-800 relative overflow-hidden min-h-[280px] sm:min-h-[360px]">
        {/* Dynamic Storm Aura Background */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            gameState === "running"
              ? "bg-gradient-to-t from-cyan-950/50 via-sky-950/20 to-slate-950 opacity-100"
              : gameState === "crashed"
              ? "bg-gradient-to-t from-rose-950/50 via-slate-950 to-slate-950 opacity-100"
              : "opacity-40"
          }`}
        />

        {/* Hurricane Eye Animation */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${
              gameState === "running"
                ? "border-cyan-400 bg-cyan-500/10 scale-110 shadow-2xl shadow-cyan-500/50"
                : gameState === "crashed"
                ? "border-rose-500 bg-rose-500/10 scale-90"
                : gameState === "cashed_out"
                ? "border-emerald-400 bg-emerald-500/10 scale-105"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            <Wind
              className={`w-16 h-16 ${
                gameState === "running"
                  ? "text-cyan-300 animate-spin"
                  : gameState === "crashed"
                  ? "text-rose-400"
                  : gameState === "cashed_out"
                  ? "text-emerald-400"
                  : "text-slate-600"
              }`}
              style={{
                animationDuration:
                  gameState === "running" ? `${Math.max(0.3, 2 / multiplier)}s` : "4s",
              }}
            />
          </div>

          {/* Current Multiplier */}
          <div className="text-center">
            <div
              className={`text-5xl sm:text-6xl font-black tracking-tight ${
                gameState === "crashed"
                  ? "text-rose-500 line-through"
                  : gameState === "cashed_out"
                  ? "text-emerald-400"
                  : gameState === "running"
                  ? "text-cyan-300 animate-pulse"
                  : "text-slate-500"
              }`}
            >
              {multiplier.toFixed(2)}x
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold">
              {gameState === "running"
                ? "Cyclone Altitude Rising..."
                : gameState === "crashed"
                ? "Cyclone Collapsed!"
                : gameState === "cashed_out"
                ? `Cashed Out at ${cashedMultiplier?.toFixed(2)}x!`
                : "Ready to launch"}
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="relative z-10 mt-6 text-center">
            <span
              className={`inline-block px-4 py-2 rounded-xl text-xs font-bold ${
                gameState === "cashed_out"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : gameState === "crashed"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              }`}
            >
              {statusMsg}
            </span>
          </div>
        )}
      </div>

      {/* Crash Bet Panel */}
      <div className="lg:col-span-4 bg-slate-950/80 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-5 lg:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Cyclone Rush
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hop into the cyclone! Cash out before the wind vortex collapses into thin air.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Wager (Winds)</span>
            <span className="text-cyan-400 font-bold">Balance: {(user?.windBalance ?? 0).toLocaleString()}</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 100, 200].map((amt) => (
              <button
                key={amt}
                disabled={gameState === "running"}
                onClick={() => setBet(amt)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  bet === amt
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Live Payout projection if running */}
        {gameState === "running" && (
          <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-center">
            <span className="text-xs text-cyan-300">Current Payout Value:</span>
            <div className="text-xl font-black text-cyan-200">
              {Math.round(bet * multiplier).toLocaleString()} Winds
            </div>
          </div>
        )}

        {/* Action Button: Start or Cash Out */}
        {gameState === "running" ? (
          <button
            onClick={cashOut}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 animate-bounce"
          >
            <Sparkles className="w-5 h-5" />
            <span>CASH OUT ({Math.round(bet * multiplier)} WINDS)</span>
          </button>
        ) : (
          <button
            onClick={startFlight}
            disabled={(user?.windBalance ?? 0) < bet}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Ride Cyclone for {bet} Winds</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   3. TEMPEST SLOTS COMPONENT
   ========================================================================= */
function TempestSlots() {
  const { user, refreshUser } = useUser();
  const [bet, setBet] = useState(30);
  const [reels, setReels] = useState(["🍃", "🌪️", "💎"]);
  const [isRolling, setIsRolling] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const symbols = ["🍃", "🪶", "⚡", "🌪️", "💎", "👑"];

  const spinSlots = async () => {
    if (isRolling) return;
    if ((user?.windBalance ?? 0) < bet) {
      setResultMsg("Insufficient Winds balance!");
      return;
    }

    setIsRolling(true);
    setResultMsg(null);

    // Reel rolling animation
    const rollInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 90);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "slots", bet }),
      });
      const data = await res.json();

      setTimeout(async () => {
        clearInterval(rollInterval);
        setIsRolling(false);
        if (res.ok) {
          setReels(data.extra?.grid || ["🍃", "🍃", "🍃"]);
          setResultMsg(data.message);
          await refreshUser();
          if (data.payout > 0) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#38bdf8", "#fbbf24", "#34d399"],
            });
          }
        } else {
          setResultMsg(data.error || "Slot pull failed");
        }
      }, 1500);
    } catch {
      clearInterval(rollInterval);
      setIsRolling(false);
      setResultMsg("Slot network error.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 lg:p-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60">
      {/* Slots Machine Display */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center p-4 lg:p-8 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-5 lg:space-y-6">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Three-Reel Blessed Winds Matrix</span>
        </div>

        {/* Reels Box */}
        <div className="flex items-center space-x-4 sm:space-x-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
          {reels.map((symbol, i) => (
            <div
              key={i}
              className={`w-20 h-28 sm:w-28 sm:h-36 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-4xl sm:text-6xl shadow-inner select-none transition-transform ${
                isRolling ? "scale-95 animate-pulse" : "scale-100"
              }`}
            >
              {symbol}
            </div>
          ))}
        </div>

        {resultMsg && (
          <div className="text-center">
            <span className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {resultMsg}
            </span>
          </div>
        )}

        {/* Paytable snippet */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full pt-4 border-t border-slate-800/80 text-[11px] text-center text-slate-400">
          <div className="p-2 rounded-lg bg-slate-900/50">👑 👑 👑 : <span className="text-amber-400 font-bold">50x</span></div>
          <div className="p-2 rounded-lg bg-slate-900/50">💎 💎 💎 : <span className="text-cyan-400 font-bold">25x</span></div>
          <div className="p-2 rounded-lg bg-slate-900/50">🌪️ 🌪️ 🌪️ : <span className="text-sky-400 font-bold">15x</span></div>
          <div className="p-2 rounded-lg bg-slate-900/50">⚡ ⚡ ⚡ : <span className="text-yellow-400 font-bold">10x</span></div>
          <div className="p-2 rounded-lg bg-slate-900/50">🪶 🪶 🪶 : <span className="text-emerald-400 font-bold">6x</span></div>
          <div className="p-2 rounded-lg bg-slate-900/50">Any Pair : <span className="text-purple-400 font-bold">1.5x</span></div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-4 bg-slate-950/80 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-5 lg:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Tempest Slots
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Align mystical wind relics. Hit triple Archon crowns for a massive 50x jackpot!
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Spin Bet (Winds)</span>
            <span className="text-cyan-400 font-bold">Balance: {(user?.windBalance ?? 0).toLocaleString()}</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 30, 75, 150].map((amt) => (
              <button
                key={amt}
                disabled={isRolling}
                onClick={() => setBet(amt)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  bet === amt
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={spinSlots}
          disabled={isRolling || (user?.windBalance ?? 0) < bet}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <RotateCcw className={`w-5 h-5 ${isRolling ? "animate-spin" : ""}`} />
          <span>{isRolling ? "Summoning Relics..." : `Pull Lever (${bet} Winds)`}</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   4. ZEPHYR HARVESTER (Clicker / Tap essence)
   ========================================================================= */
function ZephyrHarvester() {
  const { user, refreshUser } = useUser();
  const [accumulatedTaps, setAccumulatedTaps] = useState(0);
  const [tapAnimations, setTapAnimations] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isDepositing, setIsDepositing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleOrbClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTapId = Date.now() + Math.random();
    setTapAnimations((prev) => [...prev, { id: newTapId, x, y }]);
    setAccumulatedTaps((prev) => prev + 1);

    setTimeout(() => {
      setTapAnimations((prev) => prev.filter((item) => item.id !== newTapId));
    }, 800);
  };

  const depositHarvest = async () => {
    if (accumulatedTaps <= 0 || isDepositing) return;
    setIsDepositing(true);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "harvester",
          clientData: { taps: accumulatedTaps },
        }),
      });
      const data = await res.json();
      setIsDepositing(false);

      if (res.ok) {
        setStatusMsg(data.message);
        setAccumulatedTaps(0);
        await refreshUser();
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#34d399", "#38bdf8"],
        });
      }
    } catch {
      setIsDepositing(false);
      setStatusMsg("Failed to deposit wind harvest.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/60 p-8 rounded-3xl border border-cyan-500/20">
      {/* Clicker Area */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center p-8 bg-slate-950/90 rounded-2xl border border-slate-800 relative select-none min-h-[360px]">
        <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-4">
          Tap the Vortex Orb to Condense Wind Essence
        </div>

        {/* Central Clickable Orb */}
        <div
          onClick={handleOrbClick}
          className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-400 to-emerald-400 p-1.5 cursor-pointer transform active:scale-95 transition-transform shadow-2xl shadow-cyan-500/30 group"
        >
          <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative">
            <Wind className="w-20 h-20 text-cyan-300 animate-spin group-hover:text-emerald-300 transition-colors" style={{ animationDuration: "5s" }} />
            <span className="text-xs font-extrabold text-cyan-200 mt-2">TAP TO GATHER</span>
          </div>

          {/* Floating +3 Winds Particles */}
          {tapAnimations.map((tap) => (
            <div
              key={tap.id}
              className="pointer-events-none absolute text-sm font-black text-emerald-300 animate-out fade-out slide-out-to-top duration-700"
              style={{ left: tap.x, top: tap.y }}
            >
              +3 Winds!
            </div>
          ))}
        </div>

        {statusMsg && (
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {statusMsg}
            </span>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-4 bg-slate-950/80 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-5 lg:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Zephyr Harvester
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            No risk involved! Tap to condense free wind gusts and store them into your sanctuary vault.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400">Condensed Essence (Pending)</div>
          <div className="text-2xl font-black text-cyan-300">
            {accumulatedTaps * 3} <span className="text-xs font-bold text-slate-400">Winds ({accumulatedTaps} taps)</span>
          </div>
        </div>

        <button
          onClick={depositHarvest}
          disabled={accumulatedTaps === 0 || isDepositing}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isDepositing ? "Channeling Winds..." : `Deposit ${accumulatedTaps * 3} Winds to Vault`}</span>
        </button>
      </div>
    </div>
  );
}
