/* comunikit — AuthHero (Animated Runpod-inspired cyberpunk aside) */
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  { text: "Лучший маркетплейс в AITU", author: "aslan_k" },
  { text: "Нашёл макбук за 5 минут", author: "dana_m" },
  { text: "OCR просто магия", author: "yerbol_t" },
  { text: "Карма реально работает", author: "madina_a" },
] as const;

const BOOT_SEQUENCE = [
  { cmd: "init", arg: "student.network", highlight: false },
  { cmd: "load", arg: "verified_students.db", highlight: false },
  { cmd: "verify", arg: "aitu.edu.kz", highlight: false },
  { cmd: "status:", arg: "● ONLINE [847 users]", highlight: true },
] as const;

const ASCII_LOGO = `┌─── COMUNIKIT ─────────────────────┐
│                                   │
│    ██████╗██╗  ██╗                │
│   ██╔════╝██║ ██╔╝                │
│   ██║     █████╔╝                 │
│   ██║     ██╔═██╗                 │
│   ╚██████╗██║  ██╗                │
│    ╚═════╝╚═╝  ╚═╝                │
│                                   │
└───────────────────────────────────┘`;

const IMAGES = [
  "/auth/ascii-logo.png",
  "/auth/ascii-stadium.png",
  "/auth/ascii-interior.png",
] as const;

export interface AuthHeroProps {
  /** Render dithered AITU background image slideshow (used on RegisterPage). */
  withImages?: boolean;
  /** Override the default headline. */
  heading?: ReactNode;
  /** Override the default tagline below the headline. */
  subheading?: ReactNode;
}

export default function AuthHero({
  withImages = false,
  heading,
  subheading,
}: AuthHeroProps) {
  const [active, setActive] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [bootStep, setBootStep] = useState(0);
  const [glitching, setGlitching] = useState(false);

  /* Testimonials rotation */
  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  /* Background image slideshow (register only) */
  useEffect(() => {
    if (!withImages) return;
    const id = setInterval(() => {
      setImgIdx((i) => (i + 1) % IMAGES.length);
    }, 5500);
    return () => clearInterval(id);
  }, [withImages]);

  /* Sequential boot reveal */
  useEffect(() => {
    const timers = BOOT_SEQUENCE.map((_, i) =>
      window.setTimeout(() => setBootStep(i + 1), 500 + i * 650),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  /* Random glitch flicker on the ASCII logo */
  useEffect(() => {
    const id = window.setInterval(() => {
      setGlitching(true);
      window.setTimeout(() => setGlitching(false), 260);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside
      aria-hidden="true"
      className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between overflow-hidden bg-zinc-950 p-12 font-mono text-zinc-300"
    >
      {/* ── Background image slideshow (Ken Burns) ──────────── */}
      {withImages && (
        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={imgIdx}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 0.3, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.14 }}
              transition={{
                opacity: { duration: 2 },
                scale: { duration: 7, ease: "linear" },
              }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${IMAGES[imgIdx]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "contrast(1.15) saturate(1.5) hue-rotate(-10deg)",
                mixBlendMode: "screen",
              }}
            />
          </AnimatePresence>
          {/* Dithered dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-fuchsia-950/40" />
        </div>
      )}

      {/* ── Grid background ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Moving scanline beam ────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent blur-[1px]"
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Static scanline overlay ─────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* ── Pulsing glow orbs ───────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-fuchsia-600/15 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-32 bottom-1/4 size-96 rounded-full bg-sky-500/15 blur-3xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* ── Top prompt ──────────────────────────────────────── */}
      <div className="relative flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="uppercase tracking-[0.2em]">
          comunikit // access.terminal
        </span>
      </div>

      {/* ── Center: ASCII logo + boot sequence ──────────────── */}
      <div className="relative">
        <motion.pre
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            x: glitching ? [-2, 2, -1, 1, 0] : 0,
          }}
          transition={{
            opacity: { duration: 0.8 },
            y: { duration: 0.8 },
            x: { duration: 0.25 },
          }}
          style={{
            textShadow: glitching
              ? "2px 0 0 rgba(255,50,200,0.8), -2px 0 0 rgba(50,200,255,0.8)"
              : undefined,
          }}
          className={cn(
            "ck-neon-text select-none whitespace-pre text-[11px] leading-[1.1] transition-colors",
            glitching && "brightness-125",
          )}
        >
          {ASCII_LOGO}
        </motion.pre>

        {/* Boot sequence — revealed line by line */}
        <div className="mt-8 min-h-[92px] space-y-1.5 text-[13px]">
          {BOOT_SEQUENCE.slice(0, bootStep).map((line, i) => {
            const isLast =
              i === bootStep - 1 && bootStep < BOOT_SEQUENCE.length;
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center gap-2"
              >
                <span className="text-emerald-400">$</span>
                <span className="text-zinc-500">{line.cmd}</span>
                <span
                  className={
                    line.highlight ? "text-emerald-400" : "text-zinc-200"
                  }
                >
                  {line.arg}
                </span>
                {isLast && (
                  <span className="ml-1 inline-block h-3 w-[7px] animate-pulse bg-zinc-400" />
                )}
              </motion.p>
            );
          })}
        </div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="mt-10 max-w-md font-mono text-3xl font-bold leading-tight text-zinc-100"
        >
          {heading ?? (
            <>
              Закрытая сеть для студентов{" "}
              <span className="text-fuchsia-400">AITU</span>
              <span className="ml-1 inline-block h-7 w-[3px] translate-y-1 animate-pulse bg-fuchsia-400" />
            </>
          )}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
          className="mt-3 max-w-md text-sm text-zinc-500"
        >
          {subheading ?? (
            <>Форум, маркетплейс, Lost &amp; Found — одним аккаунтом.</>
          )}
        </motion.p>
      </div>

      {/* ── Bottom: rotating testimonials + footer ──────────── */}
      <div className="relative">
        <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          <span className="h-px w-8 bg-zinc-800" />
          <span>отзывы.log</span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>
        <div className="relative h-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <p className="text-lg text-zinc-100">
                <span className="text-fuchsia-400">&gt;</span> &ldquo;
                {TESTIMONIALS[active].text}&rdquo;
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                — @{TESTIMONIALS[active].author}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600">
          <span>v2.0.1</span>
          <span>aitu.edu.kz</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-500" />
            secure
          </span>
        </div>
      </div>
    </aside>
  );
}
