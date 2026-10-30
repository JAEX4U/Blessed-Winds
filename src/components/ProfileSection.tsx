"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  User,
  Award,
  Wind,
  Gem,
  CheckCircle,
  Clock,
  Edit3,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ProfileSection() {
  const { user, inventory, quests, transactions, refreshUser, setUser } = useUser();
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "quests" | "history">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || "🌪️");
  const [isSaving, setIsSaving] = useState(false);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);

  const avatars = ["🌪️", "🦅", "⚡", "🍃", "🐉", "🔮", "✨", "👑"];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editName,
          bio: editBio,
          avatarUrl: editAvatar,
        }),
      });
      const data = await res.json();
      setIsSaving(false);
      if (res.ok) {
        setUser(data.user);
        setIsEditing(false);
      }
    } catch {
      setIsSaving(false);
    }
  };

  const handleClaimQuest = async (questId: number) => {
    setClaimLoadingId(questId);
    try {
      const res = await fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();
      setClaimLoadingId(null);
      if (res.ok) {
        await refreshUser();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#34d399", "#fbbf24"],
        });
      }
    } catch {
      setClaimLoadingId(null);
    }
  };

  const xpCurrentLevel = (user?.xp || 0) % 250;
  const xpPercent = Math.min(100, Math.floor((xpCurrentLevel / 250) * 100));

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-sky-950/80 border border-cyan-500/30 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Core identity */}
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-5xl shadow-xl shadow-cyan-500/20">
                {user?.avatarUrl || "🌪️"}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs border border-white">
                Lv.{user?.level ?? 1}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.displayName}</h1>
                <button
                  onClick={() => {
                    setEditName(user?.displayName || "");
                    setEditBio(user?.bio || "");
                    setEditAvatar(user?.avatarUrl || "🌪️");
                    setIsEditing(!isEditing);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-cyan-400 font-semibold mt-0.5">@{user?.username} • {user?.title}</p>
              <p className="text-xs text-slate-400 max-w-md mt-2 italic">"{user?.bio}"</p>
            </div>
          </div>

          {/* Quick Balance Summary Badges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-center flex-1 sm:flex-initial">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Blessed Winds</div>
              <div className="text-xl font-black text-white flex items-center justify-center space-x-1 mt-0.5">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>{(user?.windBalance ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-center flex-1 sm:flex-initial">
              <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Sky Gems</div>
              <div className="text-xl font-black text-white flex items-center justify-center space-x-1 mt-0.5">
                <Gem className="w-4 h-4 text-purple-400" />
                <span>{user?.gemBalance ?? 0}</span>
              </div>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center flex-1 sm:flex-initial">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Streak</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {user?.streakDays ?? 1} Days
              </div>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Level {user?.level ?? 1} Journey</span>
            <span className="text-cyan-400">{xpCurrentLevel} / 250 XP to Level {(user?.level ?? 1) + 1}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Edit Profile Drawer */}
        {isEditing && (
          <div className="relative z-20 mt-6 p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Zephyr Avatar & Bio</h3>
            
            {/* Avatar Select */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Choose Avatar Emblem</label>
              <div className="flex flex-wrap gap-2">
                {avatars.map((av) => (
                  <button
                    key={av}
                    onClick={() => setEditAvatar(av)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                      editAvatar === av
                        ? "bg-cyan-500/20 border-cyan-400 scale-110 shadow-md shadow-cyan-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Personal Bio</label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:bg-cyan-400 transition-all shadow-md"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Section Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Equipped & Badges
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "inventory"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Inventory ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("quests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "quests"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Daily Quests ({quests.filter((q) => q.isCompleted && !q.isClaimed).length} ready)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Wind Ledger History
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Blessing Tier
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20">
              <div className="text-xs text-slate-400">Current Rank</div>
              <div className="text-lg font-black text-cyan-300">{user?.blessingTier || "Aero Disciple"}</div>
              <p className="text-xs text-slate-400 mt-2">
                Gain wind XP through mini-games to promote into High Tempest Archon.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Equipped Aura
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20">
              <div className="text-xs text-slate-400">Active Atmospheric Aura</div>
              <div className="text-lg font-black text-emerald-300 capitalize">
                {(user?.equippedAura || "None").replace("_", " ")}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Visit the Breeze Bazaar to purchase more celestial auras with special bonuses.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Equipped Badge
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20">
              <div className="text-xs text-slate-400">Honor Title</div>
              <div className="text-lg font-black text-purple-300">{user?.equippedBadge}</div>
              <p className="text-xs text-slate-400 mt-2">
                Equipped on your profile and leaderboards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Inventory */}
      {activeTab === "inventory" && (
        <div>
          {inventory.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
              Your inventory is empty! Explore the Breeze Bazaar to acquire auras, charms, and pets.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((inv) => (
                <div
                  key={inv.inventoryId}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl">
                      {inv.icon}
                    </div>
                    {inv.isEquipped && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold uppercase">
                        Equipped
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{inv.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{inv.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs text-cyan-300 flex justify-between items-center">
                    <span>{inv.effectBonus}</span>
                    <span className="text-slate-400 font-bold">Qty: {inv.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quests */}
      {activeTab === "quests" && (
        <div className="space-y-4">
          {quests.map((quest) => {
            const isReady = quest.isCompleted && !quest.isClaimed;
            return (
              <div
                key={quest.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-white">{quest.title}</h4>
                    {quest.isClaimed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Claimed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{quest.description}</p>
                  <div className="flex items-center space-x-2 pt-1 text-xs text-cyan-300 font-bold">
                    <span>Reward: +{quest.rewardWinds} Winds</span>
                    {quest.rewardGems > 0 && <span>• +{quest.rewardGems} Gems</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Progress</span>
                    <div className="text-sm font-black text-cyan-400">
                      {quest.progress} / {quest.target}
                    </div>
                  </div>

                  {isReady ? (
                    <button
                      onClick={() => handleClaimQuest(quest.id)}
                      disabled={claimLoadingId === quest.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20"
                    >
                      {claimLoadingId === quest.id ? "Claiming..." : "Claim Reward"}
                    </button>
                  ) : quest.isClaimed ? (
                    <div className="p-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold">
                      Incomplete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Wind Ledger Activity
          </div>
          <div className="divide-y divide-slate-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{tx.reason}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div
                  className={`text-sm font-black ${
                    tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Winds
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
