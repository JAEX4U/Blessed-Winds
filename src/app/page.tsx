"use client";

import React from "react";
import { UserProvider, useUser } from "@/context/UserContext";
import Header from "@/components/Header";
import HomeSection from "@/components/HomeSection";
import GamesSection from "@/components/GamesSection";
import ShopSection from "@/components/ShopSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import ProfileSection from "@/components/ProfileSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

function MainContent() {
  const { activeTab, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <p className="text-sm font-black tracking-widest uppercase">Summoning Blessed Winds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "home" && <HomeSection />}
        {activeTab === "games" && <GamesSection />}
        {activeTab === "shop" && <ShopSection />}
        {activeTab === "leaderboard" && <LeaderboardSection />}
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "faq" && <FAQSection />}
      </main>
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  );
}
