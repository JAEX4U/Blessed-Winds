"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { ShopItemData } from "@/types";
import {
  ShoppingBag,
  Sparkles,
  Wind,
  Gem,
  Check,
  ShieldAlert,
  Zap,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ShopSection() {
  const { user, inventory, refreshUser } = useUser();
  const [items, setItems] = useState<ShopItemData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/shop");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load shop:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (item: ShopItemData) => {
    setPurchasingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action: "buy" }),
      });
      const data = await res.json();
      setPurchasingId(null);

      if (res.ok) {
        setFeedback({ id: item.id, message: data.message });
        await refreshUser();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#34d399", "#38bdf8", "#fbbf24"],
        });
      } else {
        setFeedback({ id: item.id, message: data.error || "Purchase failed", isError: true });
      }
    } catch {
      setPurchasingId(null);
      setFeedback({ id: item.id, message: "Purchase network error", isError: true });
    }
  };

  const handleEquip = async (item: ShopItemData) => {
    setPurchasingId(item.id);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action: "equip" }),
      });
      setPurchasingId(null);
      if (res.ok) {
        await refreshUser();
      }
    } catch {
      setPurchasingId(null);
    }
  };

  const categories = [
    { id: "all", label: "All Items" },
    { id: "auras", label: "Auras" },
    { id: "charms", label: "Charms" },
    { id: "boosts", label: "Boosts" },
    { id: "pets", label: "Spirits & Pets" },
    { id: "titles", label: "Titles" },
  ];

  const filteredItems = items.filter(
    (item) => selectedCategory === "all" || item.category === selectedCategory
  );

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "Divine":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Legendary":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "Epic":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "Rare":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-700/40 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="w-6 h-6 animate-pulse" />
            </span>
            <span>Breeze Bazaar & Shop</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Exchange your Winds & Sky Gems for mythical relics, aura cosmetics, and game modifiers.
          </p>
        </div>

        {/* Current Balances Pill */}
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center space-x-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Your Winds:</span>
            <span className="text-sm font-black text-cyan-300">{(user?.windBalance ?? 0).toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center space-x-2">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400 font-medium">Gems:</span>
            <span className="text-sm font-black text-purple-300">{user?.gemBalance ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 ml-1 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const owned = inventory.find((inv) => inv.itemId === item.id);
          const isEquipped = owned?.isEquipped || false;
          const canAffordWinds = (user?.windBalance ?? 0) >= item.priceWinds;
          const canAffordGems = (user?.gemBalance ?? 0) >= (item.priceGems || 0);
          const canAfford = canAffordWinds && canAffordGems;

          return (
            <div
              key={item.id}
              className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-cyan-950/20"
            >
              {/* Item Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRarityBadge(
                        item.rarity
                      )}`}
                    >
                      {item.rarity}
                    </span>
                    {owned && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Owned (x{owned.quantity})
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-4">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>

                {/* Effect Bonus Pill */}
                <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.effectBonus}</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {item.priceWinds > 0 && (
                      <div className="flex items-center space-x-1 text-cyan-300 font-extrabold text-sm">
                        <Wind className="w-4 h-4 text-cyan-400" />
                        <span>{item.priceWinds.toLocaleString()}</span>
                      </div>
                    )}
                    {item.priceGems > 0 && (
                      <div className="flex items-center space-x-1 text-purple-300 font-extrabold text-sm">
                        <Gem className="w-4 h-4 text-purple-400" />
                        <span>{item.priceGems}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback message */}
                {feedback && feedback.id === item.id && (
                  <div
                    className={`mb-2 text-xs text-center font-bold px-2 py-1 rounded-lg ${
                      feedback.isError ? "text-rose-400 bg-rose-950/40" : "text-emerald-400 bg-emerald-950/40"
                    }`}
                  >
                    {feedback.message}
                  </div>
                )}

                <div className="flex space-x-2">
                  {owned && (item.category === "auras" || item.category === "titles") ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={purchasingId === item.id}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isEquipped
                          ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30"
                      }`}
                    >
                      {isEquipped ? "Unequip" : "Equip"}
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || purchasingId === item.id}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1 ${
                      canAfford
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {purchasingId === item.id
                        ? "Purchasing..."
                        : owned
                        ? "Buy Another"
                        : "Acquire"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
