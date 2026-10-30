import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CloudUpload,
  Code2,
  Database,
  ExternalLink,
  Globe2,
  LockKeyhole,
  MonitorPlay,
  Palette,
  Rocket,
  ShieldAlert,
  Sparkles,
  Terminal,
  Wind,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Make your own website | Blessed Winds creator guide",
  description: "A beginner-friendly guide to run, personalize, and publish the Blessed Winds Next.js website.",
};

function Command({ children }: { children: string }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-3 font-mono text-[13px] text-cyan-200 shadow-inner">
      <span className="mr-3 select-none text-emerald-400">$</span>
      <code>{children}</code>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-white/[0.07] py-6 first:pt-2 last:border-0 last:pb-1">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="text-sm leading-7 text-slate-400">{children}</div>
      </div>
    </li>
  );
}

const files = [
  {
    path: "src/components/Header.tsx",
    label: "Name & navigation",
    detail: "Change the Blessed Winds logo text, menu labels, and links.",
    icon: Wind,
    color: "text-cyan-300",
  },
  {
    path: "src/components/HomeSection.tsx",
    label: "Homepage content",
    detail: "Edit the headline, introduction, buttons, and feature cards.",
    icon: MonitorPlay,
    color: "text-emerald-300",
  },
  {
    path: "src/app/globals.css",
    label: "Colors & styling",
    detail: "Add your own fonts, colors, and global design styles.",
    icon: Palette,
    color: "text-violet-300",
  },
  {
    path: "src/app/layout.tsx",
    label: "Search result details",
    detail: "Update the website title and description shown in browser tabs.",
    icon: Globe2,
    color: "text-amber-300",
  },
  {
    path: "src/lib/seed.ts",
    label: "Starter content",
    detail: "Adjust example shop items, quests, and demo rivals for a fresh database.",
    icon: Sparkles,
    color: "text-pink-300",
  },
  {
    path: "src/app/api/ & src/db/schema.ts",
    label: "Server & database",
    detail: "API routes handle balances, games, and purchases; the schema defines stored data.",
    icon: Database,
    color: "text-sky-300",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#080f1d] text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-72 right-[-12rem] h-[40rem] w-[40rem] rounded-full bg-cyan-500/[0.065] blur-[110px]" />
        <div className="absolute left-[-18rem] top-[36rem] h-[38rem] w-[38rem] rounded-full bg-emerald-500/[0.045] blur-[110px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.07] bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 font-black tracking-tight text-white transition-opacity hover:opacity-80">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Wind className="h-5 w-5" />
            </span>
            <span className="truncate">BLESSED WINDS</span>
            <span className="hidden rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 sm:inline">CREATOR GUIDE</span>
          </Link>
          <Link href="/" className="flex flex-none items-center gap-2 text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-300">
            <ArrowLeft className="h-4 w-4" /> Back to the website
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <section className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> From idea to your own live site
          </div>
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl">
            You already have a website. <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">Make it yours.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
            Blessed Winds is a working Next.js and PostgreSQL project. You do not have to start from scratch.
            Run it on your computer, change the parts you like, then put it on the internet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#setup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-transform hover:-translate-y-0.5">
              Start with the setup <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#publish" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300">
              How to publish <CloudUpload className="h-4 w-4" />
            </a>
          </div>
        </section>

        <div className="mt-14 grid gap-9 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-9">
            <section id="setup" className="scroll-mt-8 rounded-3xl border border-white/[0.09] bg-slate-900/60 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-2.5 text-cyan-300"><Terminal className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">01 / SETUP</div>
                  <h2 className="text-2xl font-bold text-white">Run it on your computer</h2>
                </div>
              </div>
              <ol>
                <Step number="1" title="Get the basics">
                  Install <a className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-white" href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">Node.js 20.9 or newer</a>, PostgreSQL, and a code editor such as VS Code.
                  Open this project folder in a terminal.
                </Step>
                <Step number="2" title="Install the project packages">
                  Run this once in the project folder.
                  <Command>npm install</Command>
                </Step>
                <Step number="3" title="Connect your database">
                  Create an empty PostgreSQL database. Copy the example environment file, then put <strong className="text-slate-200">your own database URL</strong> in <code className="text-emerald-300">.env</code>.
                  <Command>cp .env.example .env</Command>
                  <p className="mt-2 text-xs text-slate-500">On Windows PowerShell, use <code className="text-slate-300">Copy-Item .env.example .env</code>. Never share or upload the real <code>.env</code> file.</p>
                </Step>
                <Step number="4" title="Create the database tables">
                  Drizzle will create the tables used by profiles, balances, games, the shop, and live spin rounds.
                  <Command>npx drizzle-kit push</Command>
                </Step>
                <Step number="5" title="Start the website">
                  Open <span className="font-semibold text-white">http://localhost:3000</span> in your browser after the server starts.
                  <Command>npm run dev</Command>
                </Step>
              </ol>
            </section>

            <section id="customize" className="scroll-mt-8 rounded-3xl border border-white/[0.09] bg-slate-900/60 p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-2.5 text-emerald-300"><Code2 className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">02 / CUSTOMIZE</div>
                  <h2 className="text-2xl font-bold text-white">Change the parts you like</h2>
                </div>
              </div>
              <p className="mb-6 text-sm leading-7 text-slate-400">Edit a file, save it, and your browser updates. These are the best places to begin:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {files.map((file) => {
                  const Icon = file.icon;
                  return (
                    <div key={file.path} className="rounded-2xl border border-white/[0.08] bg-slate-950/50 p-4">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${file.color}`} />
                        <h3 className="text-sm font-semibold text-white">{file.label}</h3>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slate-400">{file.detail}</p>
                      <code className="mt-3 block break-all rounded-lg bg-slate-900 px-2.5 py-2 text-[11px] text-cyan-300">{file.path}</code>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-500">Tip: seeded example items and rivals are only inserted when their tables are empty. Changing the seed file will not overwrite existing database rows.</p>
            </section>

            <section id="publish" className="scroll-mt-8 rounded-3xl border border-white/[0.09] bg-slate-900/60 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-2.5 text-violet-300"><Rocket className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-violet-300">03 / PUBLISH</div>
                  <h2 className="text-2xl font-bold text-white">Put it on the internet</h2>
                </div>
              </div>
              <ol>
                <Step number="1" title="Save your project on GitHub">
                  Make a GitHub repository and upload your code. <code className="text-emerald-300">.gitignore</code> keeps your real <code>.env</code> credentials out of Git.
                </Step>
                <Step number="2" title="Make a hosted PostgreSQL database">
                  Choose a hosted PostgreSQL provider and save its private connection string. Your laptop&apos;s <code>localhost</code> database is not accessible from a deployed website.
                </Step>
                <Step number="3" title="Set the environment variable and tables">
                  Add <code className="text-emerald-300">DATABASE_URL</code> to your hosting provider&apos;s environment settings. Apply the schema to the hosted database with <code className="text-slate-200">npx drizzle-kit push</code> from a trusted environment using that database URL. Do not put database passwords in your code or Git repository.
                </Step>
                <Step number="4" title="Deploy and add your domain">
                  Import the GitHub repository into a Next.js host such as Vercel, deploy it, and check <code className="text-slate-200">/api/health</code>. Then connect a domain in your host&apos;s domain settings to get a lasting public address.
                </Step>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3 text-xs">
                <a href="https://nextjs.org/docs/app/getting-started/deploying" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white">Next.js deployment docs <ExternalLink className="h-3 w-3" /></a>
                <a href="https://vercel.com/docs/deployments" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white">Vercel deployment docs <ExternalLink className="h-3 w-3" /></a>
                <a href="https://orm.drizzle.team/docs/drizzle-kit-push" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white">Drizzle database docs <ExternalLink className="h-3 w-3" /></a>
              </div>
            </section>

            <section id="before-launch" className="scroll-mt-8 rounded-3xl border border-amber-400/25 bg-amber-400/[0.055] p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-2.5 text-amber-300"><ShieldAlert className="h-5 w-5" /></div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300">A REAL-WORLD NOTE</div>
                  <h2 className="mt-0.5 text-xl font-bold text-white">This is a playable demo, not a public multiplayer account system yet.</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Right now, visitors share one demo player account, and the rival riders are simulated. Before inviting real players,
                add sign-up and login, give every person their own account and balance, protect API routes, and add rate limits and
                transaction-safe game payouts. Keep Winds as play-money; do not use this demo for real-money wagering.
              </p>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-5">
              <div className="flex items-center gap-2 text-cyan-300"><BookOpen className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Your roadmap</span></div>
              <nav aria-label="Guide sections" className="mt-5 space-y-1 text-sm">
                {[
                  { href: "#setup", text: "01  Run the site" },
                  { href: "#customize", text: "02  Make it yours" },
                  { href: "#publish", text: "03  Publish it" },
                  { href: "#before-launch", text: "Before going public" },
                ].map((entry) => (
                  <a key={entry.href} href={entry.href} className="block rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">{entry.text}</a>
                ))}
              </nav>
            </div>
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">What&apos;s already built</p>
              <ul className="mt-4 space-y-3 text-xs text-slate-300">
                {["A working homepage and profile", "Games and live color-spin rounds", "Shop, quests, and leaderboards", "PostgreSQL-backed Winds balances"].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="h-4 w-4 flex-none text-emerald-400" />{item}</li>
                ))}
              </ul>
              <Link href="/" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-white">See the website <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="rounded-3xl border border-white/[0.09] bg-slate-900/50 p-5 text-xs leading-6 text-slate-400">
              <div className="mb-2 flex items-center gap-2 font-bold text-slate-200"><LockKeyhole className="h-4 w-4 text-amber-300" /> Protect your keys</div>
              Never share your <code className="text-slate-200">DATABASE_URL</code> or push <code className="text-slate-200">.env</code> to GitHub.
            </div>
          </aside>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/[0.08] pt-8 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:text-left">
          <span>Built with Next.js, Tailwind CSS, Drizzle ORM, and PostgreSQL.</span>
          <Link href="/" className="font-semibold text-cyan-300 hover:text-white">Return to Blessed Winds →</Link>
        </div>
      </main>
    </div>
  );
}
