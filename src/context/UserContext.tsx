"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserData, InventoryItem, QuestItem, TransactionItem } from "@/types";

interface UserContextType {
  user: UserData | null;
  inventory: InventoryItem[];
  quests: QuestItem[];
  transactions: TransactionItem[];
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  claimDailyBlessing: () => Promise<{ success: boolean; message: string }>;
  offerFountain: () => Promise<{ success: boolean; message: string; amount?: number }>;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  activeTab: "home" | "games" | "shop" | "leaderboard" | "profile" | "faq";
  setActiveTab: (tab: "home" | "games" | "shop" | "leaderboard" | "profile" | "faq") => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "games" | "shop" | "leaderboard" | "profile" | "faq">("home");

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setInventory(data.inventory || []);
        setQuests(data.quests || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load user state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const claimDailyBlessing = async () => {
    try {
      const res = await fetch("/api/daily", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) setUser(data.user);
        await refreshUser();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || "Cannot claim right now." };
      }
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const offerFountain = async () => {
    try {
      const res = await fetch("/api/fountain", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) setUser(data.user);
        await refreshUser();
        return { success: true, message: data.message, amount: data.amount };
      } else {
        return { success: false, message: data.error || "Fountain was quiet." };
      }
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        inventory,
        quests,
        transactions,
        isLoading,
        refreshUser,
        claimDailyBlessing,
        offerFountain,
        setUser,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
