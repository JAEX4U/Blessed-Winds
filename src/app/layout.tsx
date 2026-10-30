import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blessed Winds - Harness the Gales | Games, Shop & Winds Balance",
  description: "Official Blessed Winds Sanctuary. Earn winds balance, play Wheel of Gales, Cyclone Rush and Tempest Slots, unlock celestial auras, customize your profile, and explore lore.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
