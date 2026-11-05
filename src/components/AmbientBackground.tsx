/**
 * Ambient, purely decorative atmosphere.
 *
 * Rendered once behind the whole app: slow aurora blooms, a faint altitude
 * grid, twinkling sky motes and wind streaks that drift across the viewport.
 * Everything is CSS-driven (no JS, no timers) and respects
 * `prefers-reduced-motion` via the global media query in globals.css.
 */

const MOTES = [
  { top: "12%", left: "8%", size: 3, delay: "0s" },
  { top: "22%", left: "28%", size: 2, delay: "1.4s" },
  { top: "9%", left: "52%", size: 2, delay: "2.6s" },
  { top: "18%", left: "74%", size: 3, delay: "0.8s" },
  { top: "30%", left: "91%", size: 2, delay: "3.4s" },
  { top: "42%", left: "16%", size: 2, delay: "2.1s" },
  { top: "55%", left: "38%", size: 3, delay: "4.2s" },
  { top: "48%", left: "63%", size: 2, delay: "1.1s" },
  { top: "62%", left: "84%", size: 2, delay: "3.1s" },
  { top: "72%", left: "6%", size: 2, delay: "0.4s" },
  { top: "78%", left: "47%", size: 3, delay: "2.8s" },
  { top: "84%", left: "70%", size: 2, delay: "1.9s" },
];

const STREAKS = [
  { top: "16%", width: "22rem", delay: "0s", duration: "26s", opacity: 0.5 },
  { top: "31%", width: "16rem", delay: "6s", duration: "32s", opacity: 0.35 },
  { top: "47%", width: "28rem", delay: "12s", duration: "38s", opacity: 0.4 },
  { top: "58%", width: "14rem", delay: "3s", duration: "24s", opacity: 0.3 },
  { top: "69%", width: "24rem", delay: "17s", duration: "34s", opacity: 0.35 },
  { top: "81%", width: "18rem", delay: "9s", duration: "29s", opacity: 0.28 },
  { top: "38%", width: "12rem", delay: "21s", duration: "27s", opacity: 0.25 },
];

export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Aurora blooms */}
      <div className="animate-aurora absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full bg-cyan-500/16 blur-[120px]" />
      <div className="animate-aurora-slow absolute -top-24 right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-emerald-400/12 blur-[130px]" />
      <div className="animate-glow absolute bottom-[-16rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-sky-500/12 blur-[140px]" />

      {/* Altitude grid */}
      <div className="grid-lines absolute inset-0 opacity-70" />

      {/* Wind streaks */}
      {STREAKS.map((streak, index) => (
        <span
          key={`streak-${index}`}
          className="animate-drift absolute h-px rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
          style={{
            top: streak.top,
            width: streak.width,
            animationDelay: streak.delay,
            animationDuration: streak.duration,
            opacity: streak.opacity,
          }}
        />
      ))}

      {/* Sky motes */}
      {MOTES.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className="animate-twinkle absolute rounded-full bg-cyan-200 shadow-[0_0_8px_2px_rgba(103,232,249,0.45)]"
          style={{
            top: mote.top,
            left: mote.left,
            width: mote.size,
            height: mote.size,
            animationDelay: mote.delay,
          }}
        />
      ))}

      {/* Vignette so content stays readable at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,17,0.85)_100%)]" />
    </div>
  );
}
