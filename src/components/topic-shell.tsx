"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { CopyButton } from "./ui";

export type NavItem = { id: string; label: string };

function useActiveSection(first: string) {
  const [active, setActive] = useState(first);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -72% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}

export function TopicShell({
  icon,
  title,
  gradientWord,
  subtitle,
  nav,
  badges = ["▶ Runnable outputs", "🧠 Memory diagrams", "💥 Exception cases"],
  next,
  children,
}: {
  icon: string;
  title: string;
  gradientWord: string;
  subtitle: string;
  nav: NavItem[];
  badges?: string[];
  next?: { icon: string; label: string; href?: string };
  children: ReactNode;
}) {
  const active = useActiveSection(nav[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  const idx = nav.findIndex((s) => s.id === active);
  const pct = Math.max(0, Math.round(((idx + 1) / nav.length) * 100));

  const navList = (
    <div className="min-h-0 flex-1 overflow-y-auto pb-8 pr-1">
      {nav.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={() => setMenuOpen(false)}
          className={`block border-l-2 border-transparent px-3 py-1.5 text-[13px] text-slate-400 transition hover:text-slate-200 ${
            active === s.id ? "nav-active font-semibold" : ""
          }`}
        >
          <span className="code-font mr-2 text-[10px] text-slate-600">
            {String(i + 1).padStart(2, "0")}
          </span>
          {s.label}
        </a>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen">
      {/* top bar */}
      <header className="glass-strong fixed inset-x-0 top-0 z-50">
        <motion.div
          style={{ scaleX }}
          className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400"
        />
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-md border border-slate-700 p-1.5 text-slate-300 lg:hidden"
            aria-label="Open contents"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <nav className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="transition hover:text-sky-400">🏠</Link>
            <span>/</span>
            <Link href="/python" className="shrink-0 transition hover:text-sky-400">🐍 Python</Link>
            <span>/</span>
            <span className="truncate font-semibold text-slate-200">{title}</span>
          </nav>
          <span className="ml-auto hidden shrink-0 rounded-full border border-sky-800/60 bg-sky-950/40 px-3 py-1 text-[11px] font-semibold text-sky-300 sm:block">
            {pct}% read · {nav.length} sections
          </span>
        </div>
      </header>

      {/* mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass-strong absolute inset-y-0 left-0 flex w-72 flex-col p-4 pt-5"
          >
            <div className="mb-3 flex items-center justify-between px-3">
              <span className="text-sm font-bold text-slate-100">{icon} Contents</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400" aria-label="Close">✕</button>
            </div>
            {navList}
          </motion.div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 pt-20 sm:px-6">
        {/* desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col py-6 lg:flex">
          <div className="mb-3 px-3">
            <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              <span>Progress</span>
              <span className="text-sky-400">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                animate={{ width: `${pct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
              />
            </div>
          </div>
          {navList}
        </aside>

        {/* content */}
        <div className="min-w-0 flex-1 pb-24">
          {/* hero strip */}
          <div className="hero-gradient grid-bg mt-6 overflow-hidden rounded-2xl border border-slate-800/80 px-6 py-10 text-center sm:px-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-3xl shadow-[0_0_40px_-8px_rgba(56,189,248,0.5)]"
            >
              {icon}
            </motion.div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              <span className="animated-gradient-text">{gradientWord}</span> — End to End
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">{subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
              {badges.map((t) => (
                <span key={t} className="glass rounded-full px-3 py-1.5 font-semibold text-slate-300">{t}</span>
              ))}
            </div>
          </div>

          {children}

          {/* footer nav */}
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link href="/python" className="glass flex-1 rounded-xl p-4 transition hover:border-sky-700/50">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">← Back</div>
              <div className="mt-1 text-sm font-bold text-slate-200">🐍 Python categories</div>
            </Link>
            {next &&
              (next.href ? (
                <Link href={next.href} className="glass flex-1 rounded-xl p-4 text-right transition hover:border-sky-700/50">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Up next →</div>
                  <div className="mt-1 text-sm font-bold text-slate-200">{next.icon} {next.label}</div>
                </Link>
              ) : (
                <div className="glass flex-1 rounded-xl p-4 text-right opacity-60">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Up next 🔒</div>
                  <div className="mt-1 text-sm font-bold text-slate-200">{next.icon} {next.label}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* Memorize-grid used at the end of every topic */
export function MemorizeGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, snippet]) => (
        <div key={label} className="glass flex flex-col rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200">{label}</span>
            <CopyButton text={snippet} />
          </div>
          <pre className="code-font flex-1 whitespace-pre-wrap rounded-lg bg-black/40 px-3 py-2 text-[13px] text-sky-200">
            {snippet}
          </pre>
        </div>
      ))}
    </div>
  );
}
