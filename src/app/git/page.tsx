"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  meta: string;
  href: string;
  available: boolean;
};

type Group = { title: string; emoji: string; items: Category[] };

const GROUPS: Group[] = [
  {
    title: "Foundations",
    emoji: "🌱",
    items: [
      { id: "intro", icon: "🤔", name: "Why Git & GitHub?", desc: "final_v2_REAL.py hell, what version control actually solves, Git vs GitHub, and 6 real disasters Git rescues you from.", meta: "9 sections · start here", href: "/git/intro", available: true },
      { id: "setup", icon: "🔧", name: "Setup — config, init, clone", desc: "Every first-time command: identity, default branch, editor, aliases, SSH keys, git init anatomy, both clone styles.", meta: "10 sections · copy-paste ready", href: "/git/setup", available: true },
      { id: "internals", icon: "🧬", name: "How Git Stores — .git Internals", desc: "Blobs, trees, commits, SHA-1 hashes, HEAD and refs — the entire object database drawn box by box.", meta: "10 sections · the magic exposed ⭐", href: "/git/internals", available: true },
    ],
  },
  {
    title: "The Daily Loop",
    emoji: "🔁",
    items: [
      { id: "basics", icon: "📸", name: "status · add · commit · log", desc: "The edit→stage→commit cycle through the three-areas diagram, plus diff, show, rm, mv — every flag that matters.", meta: "11 sections · the core loop ⭐", href: "/git/basics", available: true },
      { id: "branches", icon: "🌿", name: "Branches & Merging", desc: "Branches as movable stickers, switch/checkout, fast-forward vs 3-way merge drawn, and conflicts resolved line by line.", meta: "11 sections · merge drawn", href: "/git/branches", available: true },
      { id: "undo", icon: "⏪", name: "Undo Anything", desc: "restore, reset (soft/mixed/hard), revert, amend, stash, clean and the reflog safety net — matched to real 'oh no' moments.", meta: "11 sections · panic manual ⭐", href: "/git/undo", available: true },
    ],
  },
  {
    title: "Going Online",
    emoji: "☁️",
    items: [
      { id: "remotes", icon: "📡", name: "Remotes — push · pull · fetch", desc: "origin demystified: tracking branches, push -u, fetch vs pull, rejected pushes — local↔remote drawn for every command.", meta: "10 sections · sync diagrams", href: "/git/remotes", available: true },
      { id: "github", icon: "🐙", name: "GitHub — PRs & Teamwork", desc: "The full collaboration loop: fork, clone, branch, push, pull request, review, merge — a 2-person scenario end to end.", meta: "10 sections · real team flow", href: "/git/github", available: true },
    ],
  },
  {
    title: "Power User",
    emoji: "⚡",
    items: [
      { id: "advanced", icon: "🧠", name: "rebase · cherry-pick · bisect", desc: "Rewriting history safely: interactive rebase, squash, cherry-pick, tag, blame, bisect — plus the giant all-commands cheat sheet.", meta: "11 sections · + full cheat sheet ⭐", href: "/git/advanced", available: true },
    ],
  },
];

export default function GitPage() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Git & GitHub</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(249,115,22,0.5)]"
          >
            🌿
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Git & GitHub</span> — every command, drawn
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;what is version control&quot; to rebasing like a senior: every command with
              its real terminal output, the .git storage engine drawn box by box, and a real
              &quot;when this saves you&quot; scenario for each one.
            </motion.p>
          </div>
        </div>

        {/* The pipeline strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mb-12 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-4 text-[11px] font-semibold text-slate-300"
        >
          {["📝 Working dir", "📦 Staging (add)", "📸 Local repo (commit)", "☁️ GitHub (push)", "👥 Pull Request", "✅ Merged"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-orange-400">→</span>}
              </span>
            )
          )}
        </motion.div>

        {/* Grouped category cards */}
        {GROUPS.map((group, g) => (
          <section key={group.title} className="mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + g * 0.08 }}
              className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400"
            >
              <span className="text-base">{group.emoji}</span>
              {group.title}
              <span className="ml-2 h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-600">
                {group.items.length} topics
              </span>
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((cat, i) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + g * 0.08 + i * 0.04 }}
                    whileHover={cat.available ? { y: -5, scale: 1.02 } : undefined}
                    className={`glass relative flex h-full flex-col rounded-2xl p-5 transition-shadow ${
                      cat.available
                        ? "cursor-pointer border-orange-700/50 hover:shadow-[0_0_50px_-15px_rgba(249,115,22,0.6)]"
                        : "opacity-50"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/80 text-xl">
                        {cat.icon}
                      </span>
                      {cat.available ? (
                        <span className="rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          ● Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          🔒 Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {cat.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-[11px] text-slate-500">{cat.meta}</span>
                      {cat.available && (
                        <span className="text-sm font-bold text-orange-400">Open →</span>
                      )}
                    </div>
                  </motion.div>
                );
                return cat.available ? (
                  <Link key={cat.id} href={cat.href} className="h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={cat.id} className="h-full">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
