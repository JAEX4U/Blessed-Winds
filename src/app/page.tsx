"use client";

import React from "react";
import { UserProvider, useUser } from "@/context/UserContext";
import AmbientBackground from "@/components/AmbientBackground";
import Header from "@/components/Header";
import HomeSection from "@/components/HomeSection";
import GamesSection from "@/components/GamesSection";
import ShopSection from "@/components/ShopSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import ProfileSection from "@/components/ProfileSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { Wind } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss-950 text-cyan-400">
      <AmbientBackground />
      <div className="flex flex-col items-center space-y-5">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-cyan-400/20" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 [animation:spin_1.1s_linear_infinite]" />
          <Wind className="h-8 w-8 text-cyan-300" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">
            Summoning Blessed Winds
          </p>
          <p className="text-[11px] tracking-wide text-slate-500">Aligning the four gales…</p>
        </div>
      </div>
    </div>
  );
}

function MainContent() {
  const { activeTab, isLoading } = useUser();

  // Only gate the sections that truly need player data. The Sanctuary home
  // renders immediately (with safe fallbacks) so the first paint — and the
  // server-rendered HTML that crawlers see — carries real content.
  if (isLoading && activeTab !== "home") return <LoadingScreen />;

  return (
    <div className="relative flex min-h-screen flex-col text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <AmbientBackground />

      <a
        href="#realm"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950"
      >
        Skip to content
      </a>

      <Header />

      <main
        id="realm"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8"
      >
        {/* Re-keyed on tab change so each section animates in */}
        <div key={activeTab} className="animate-rise">
          {activeTab === "home" && <HomeSection />}
          {activeTab === "games" && <GamesSection />}
          {activeTab === "shop" && <ShopSection />}
          {activeTab === "leaderboard" && <LeaderboardSection />}
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "faq" && <FAQSection />}
        </div>
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
