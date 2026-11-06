"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserData, InventoryItem, QuestItem, TransactionItem } from "@/types";

export type TabId = "home" | "games" | "shop" | "leaderboard" | "profile" | "faq";

export const TAB_IDS: TabId[] = ["home", "games", "shop", "leaderboard", "profile", "faq"];

/** Reads the current tab from the URL hash, e.g. `/#shop` → "shop". */
export function readTabFromLocation(): TabId {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace(/^#\/?/, "").split(/[?&]/)[0].toLowerCase();
  return (TAB_IDS as string[]).includes(raw) ? (raw as TabId) : "home";
}

interface UserContextType {
  user: UserData | null;
  inventory: InventoryItem[];
  quests: QuestItem[];
  transactions: TransactionItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  login: (userData: UserData) => void;
  logout: () => Promise<void>;
  claimDailyBlessing: () => Promise<{ success: boolean; message: string }>;
  offerFountain: () => Promise<{ success: boolean; message: string; amount?: number }>;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Always start on the sanctuary so the client's first render matches the
  // server HTML; a deep link (/#games, /#shop …) is applied right after mount.
  const [activeTab, setActiveTabState] = useState<TabId>("home");

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(!!data.authenticated);
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

  const login = useCallback((userData: UserData) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setInventory([]);
      setQuests([]);
      setTransactions([]);
      setActiveTabState("home");
      if (typeof window !== "undefined") {
        window.location.hash = "#home";
      }
    }
  }, []);

  // Keep the active tab and the URL hash in sync, so browser back/forward and
  // shared links land on the right section.
  useEffect(() => {
    const syncFromUrl = () => setActiveTabState(readTabFromLocation());
    syncFromUrl(); // honour a deep link once we are hydrated
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
    if (typeof window === "undefined") return;
    const hash = `#${tab}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ tab }, "", hash);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
        isAuthenticated,
        refreshUser,
        login,
        logout,
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
