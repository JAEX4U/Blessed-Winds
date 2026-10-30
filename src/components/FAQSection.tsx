"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Wind, Sparkles, Shield, Gift, Gamepad2 } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Blessed Winds and what are Winds Balance?",
      a: "Blessed Winds is an immersive fantasy wind sanctuary. Your 'Winds Balance' (WND) is the core celestial currency of the realm. You use Winds to play interactive games (Wheel of Gales, Cyclone Rush, Tempest Slots, and Zephyr Harvester), buy rare auras and titles in the Breeze Bazaar, and ascend in ranking.",
    },
    {
      q: "How do I earn more Winds?",
      a: "There are multiple ways to continuously grow your balance: 1) Claim your Daily Blessed Gift every 24 hours to gain streak multipliers; 2) Tap the Sacred Wind Fountain on the Sanctuary home page for spontaneous gales; 3) Harvest raw gusts in the Zephyr Harvester clicker game; 4) Win multipliers in Wheel of Gales and Cyclone Rush; and 5) Complete daily quests for massive windfall rewards.",
    },
    {
      q: "What is the difference between Winds and Sky Gems?",
      a: "Winds are the primary currency used for bets and standard items. Sky Gems are rare celestial tokens awarded through high daily streaks and divine quest completions. Gems can be used to acquire exclusive Divine auras and mythical companions.",
    },
    {
      q: "How does the Live Jackpot Spin split the pot?",
      a: "Everyone bets Winds on GREEN, RED or BLUE, and each bet grows that color's area on the wheel (area = win chance). When the wheel lands on a color, the ENTIRE pot — including all losing colors' bets — is divided among that color's riders proportionally to their stake. Example: you and a rival each bet 100 on GREEN while 200 sits on RED. If GREEN hits, you each collect 200 Winds (half of the 400 pot, a 2x split). A big color wins more often but splits thinner; a small color is risky but pays a huge multiplier.",
    },
    {
      q: "How does the Cyclone Rush crash game work?",
      a: "In Cyclone Rush, the wind multiplier climbs from 1.0x upward as the cyclone gathers celestial energy. Your goal is to click 'Cash Out' before the cyclone unpredictably collapses! If you cash out in time, your wager is multiplied by the altitude coefficient. Cashes over 2.0x also complete special achievements.",
    },
    {
      q: "Do items purchased in the Breeze Bazaar give real gameplay perks?",
      a: "Yes! Auras provide visual flair and boost your daily blessing multipliers. Charms protect against low crashes in Cyclone Rush or boost jackpot odds in Tempest Slots. Sprites and pets grant passive wind harvesting bonuses.",
    },
    {
      q: "Can I customize my player profile and title?",
      a: "Absolutely! Open 'My Profile' to change your display name, personal bio, and choose from 8 avatar emblems. You can also view your full transaction history, check daily quest goals, and equip your acquired auras.",
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* FAQ Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Sanctuary</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions & Lore</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Everything you need to know about harnessing winds balance, playing mini-games, and ascending the pantheon.
        </p>
      </div>

      <a
        href="/guide"
        className="group flex flex-col gap-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 p-5 transition-colors hover:border-cyan-300/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-white">Want to build a website like this?</span>
            <span className="block text-xs leading-6 text-slate-400">Run the project, customize it, and learn how to publish it.</span>
          </span>
        </span>
        <span className="flex-none text-xs font-bold text-cyan-300 group-hover:text-white">Open creator guide →</span>
      </a>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 transition-all overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
              >
                <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                  <Wind className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  {faq.q}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lore Scroll Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 border border-cyan-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>The Blessed Winds Prophecy</span>
        </div>
        <h2 className="text-xl font-bold text-white">Chronicles of the Zephyr Realm</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          In ancient times, when the earthly sky was calm and dormant, the Great Sky Drakes descended from the stratosphere.
          They breathed life into the four cardinal directions, leaving behind the Blessed Winds—a mystical atmosphere that
          crystallizes pure fortune into physical currents. Disciples who master the gales and respect the unpredictable
          cyclones are rewarded with eternal prosperity and the title of Wind Archon.
        </p>
      </div>
    </div>
  );
}
