"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  Wind,
  Sparkles,
  Gamepad2,
  ShoppingBag,
  User,
  HelpCircle,
  Gem,
  Award,
  Zap,
  Menu,
  X,
  Volume2,
  VolumeX,
  Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Header() {
  const { user, activeTab, setActiveTab, claimDailyBlessing } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleDailyClick = async () => {
    setIsClaiming(true);
    const result = await claimDailyBlessing();
    setIsClaiming(false);
    setDailyStatus(result.message);
    if (result.success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.2 },
        colors: ["#38bdf8", "#34d399", "#fbbf24", "#a855f7"],
      });
    }
    setTimeout(() => setDailyStatus(null), 5000);
  };

  const navItems = [
    { id: "home", label: "Sanctuary", icon: Wind },
    { id: "games", label: "Wind Games", icon: Gamepad2 },
    { id: "shop", label: "Shop", icon: ShoppingBag },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "My Profile", icon: User },
    { id: "faq", label: "FAQ & Lore", icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-sky-500/20 shadow-lg shadow-sky-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-400 to-emerald-400 p-[2px] transition-transform duration-300 group-hover:scale-105 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Wind className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">
                  BLESSED WINDS
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  REALM v2.4
                </span>
              </div>
              <p className="text-xs text-sky-300/60 font-medium tracking-wide">
                Gather Winds • Ride The Gales • Ascend
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-2xl border border-sky-500/15">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/20 to-cyan-500/30 text-cyan-300 border border-cyan-400/30 shadow-md shadow-cyan-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400 animate-bounce" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Balances & Quick Daily Blessing */}
          <div className="hidden xl:flex items-center space-x-3">
            {/* Winds Balance Pill */}
            <div
              onClick={() => setActiveTab("profile")}
              className="group cursor-pointer flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-950/70 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-sm"
              title="Your Blessed Winds Balance - Click to View Profile"
            >
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Wind className="w-4 h-4 animate-spin" style={{ animationDuration: "8s" }} />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-cyan-300/70 font-semibold uppercase tracking-wider">
                  Winds Balance
                </div>
                <div className="text-sm font-extrabold text-cyan-200 flex items-center space-x-1">
                  <span>{(user?.windBalance ?? 0).toLocaleString()}</span>
                  <span className="text-[11px] text-cyan-400 font-bold">WND</span>
                </div>
              </div>
            </div>

            {/* Gems Balance */}
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-500/30"
              title="Celestial Sky Gems"
            >
              <Gem className="w-4 h-4 text-purple-400" />
              <div className="text-xs font-bold text-purple-200">
                {user?.gemBalance ?? 0} <span className="text-[10px] text-purple-400">GEMS</span>
              </div>
            </div>

            {/* Daily Blessing Button */}
            <button
              onClick={handleDailyClick}
              disabled={isClaiming}
              className="relative group overflow-hidden px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              title="Claim your Daily Blessed Winds"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-amber-300 animate-pulse" />
              <span>{isClaiming ? "Invoking..." : "Daily Gift"}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex xl:hidden items-center space-x-2">
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-300">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(user?.windBalance ?? 0).toLocaleString()}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Floating daily notification alert if claimed */}
      {dailyStatus && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium text-center py-2 px-4 shadow-md flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{dailyStatus}</span>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-sky-500/20 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center space-x-2 p-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400">Winds</div>
                <div className="text-xs font-bold text-cyan-200">{(user?.windBalance ?? 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <Gem className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400">Sky Gems</div>
                <div className="text-xs font-bold text-purple-200">{user?.gemBalance ?? 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              handleDailyClick();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Claim Daily Winds Blessing</span>
          </button>

          <div className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
