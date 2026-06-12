"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const LANGUAGES = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    tagline: "Automation · Scripting · DSA · Interviews",
    desc: "Learn every concept visually — code, memory, output, exception cases and now full DSA: recursion, trees, graphs.",
    href: "/python",
    available: true,
    modules: "31 topics live · visual",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(56,189,248,0.6)]",
    ring: "border-sky-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  {
    id: "ml",
    name: "Machine Learning",
    icon: "🤖",
    tagline: "Train models · From scratch · sklearn",
    desc: "Train a model from raw CSV to final predictions — every step drawn out: clean, split, fit, score.",
    href: "/ml",
    available: true,
    modules: "11 topics · end-to-end",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(168,85,247,0.6)]",
    ring: "border-purple-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  {
    id: "git",
    name: "Git & GitHub",
    icon: "🌿",
    tagline: "Version control · Teamwork · Every command",
    desc: "Every git command end to end — how .git stores your code, drawn box by box, with real rescue scenarios.",
    href: "/git",
    available: true,
    modules: "9 topics · all commands",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.6)]",
    ring: "border-orange-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  {
    id: "docker",
    name: "Docker",
    icon: "🐳",
    tagline: "Containers · Images · Deploy anywhere",
    desc: "From 'works on my machine' to production: images and layers drawn box by box, one app carried Dockerfile → compose → deploy.",
    href: "/docker",
    available: true,
    modules: "9 topics · end-to-end",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(34,211,238,0.6)]",
    ring: "border-cyan-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  {
    id: "linux",
    name: "Linux",
    icon: "🐧",
    tagline: "Shell · Files · Pipes · Servers",
    desc: "Every essential command with CLI animations of what ACTUALLY happens — files moving, pipes flowing, permissions flipping, processes dying.",
    href: "/linux",
    available: true,
    modules: "13 topics · all commands",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(52,211,153,0.6)]",
    ring: "border-emerald-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  {
    id: "aws",
    name: "AWS",
    icon: "☁️",
    tagline: "Cloud · EC2 · S3 · VPC · Serverless",
    desc: "The complete cloud course: 21 topics from 'what is the cloud?' to multi-region architectures — every service drawn box by box, ending at certification prep.",
    href: "/aws",
    available: true,
    modules: "21 topics · full course",
    glow: "hover:shadow-[0_0_60px_-15px_rgba(251,146,60,0.6)]",
    ring: "border-orange-700/50",
    badge: "bg-emerald-950/60 border-emerald-700/50 text-emerald-300",
  },
  { id: "c", name: "C", icon: "⚙️", tagline: "Memory · Pointers · Systems", desc: "Understand what really happens under the hood — stack, heap and addresses, drawn live.", available: false },
  { id: "cpp", name: "C++", icon: "🚀", tagline: "OOP · STL · Performance", desc: "From classes to templates with visual object lifetimes.", available: false },
  { id: "java", name: "Java", icon: "☕", tagline: "OOP · JVM · Backend", desc: "Objects, references and the JVM heap — visualized step by step.", available: false },
  { id: "js", name: "JavaScript", icon: "⚡", tagline: "Web · Async · Node", desc: "Event loop, closures and promises as animated diagrams.", available: false },
  { id: "go", name: "Go", icon: "🐹", tagline: "Concurrency · Cloud", desc: "Goroutines and channels you can actually see.", available: false },
  { id: "bash", name: "Bash", icon: "💻", tagline: "Shell · Automation", desc: "Pipes, redirection and scripting — visually traced.", available: false },
  { id: "sql", name: "SQL", icon: "🗄️", tagline: "Queries · Joins · Data", desc: "Watch joins and filters transform tables in front of you.", available: false },
];

export default function Home() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-14 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-3xl shadow-[0_0_50px_-10px_rgba(56,189,248,0.5)]"
          >
            👁️
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Learn to code <span className="animated-gradient-text">by seeing it</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg"
          >
            Every concept end-to-end: the code, the memory behind it, the output it produces and the
            exceptions it can throw — all <span className="text-slate-200">visualized</span>, so you
            understand at a glance and can write your own.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs"
          >
            {["📟 Code + Output side by side", "🧠 Memory diagrams", "💥 Exception cases", "💬 Interview-ready"].map(
              (t) => (
                <span key={t} className="glass rounded-full px-3.5 py-1.5 font-semibold text-slate-300">
                  {t}
                </span>
              )
            )}
          </motion.div>
        </div>

        {/* Language cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LANGUAGES.map((lang, i) => {
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={lang.available ? { y: -6, scale: 1.02 } : undefined}
                className={`glass relative flex h-full flex-col rounded-2xl p-5 transition-shadow ${
                  lang.available
                    ? `cursor-pointer ${lang.ring} ${lang.glow}`
                    : "opacity-55"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/80 text-2xl">
                    {lang.icon}
                  </span>
                  {lang.available ? (
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${lang.badge}`}>
                      ● Live
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      🔒 Soon
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-100">{lang.name}</h2>
                <p className="code-font mt-0.5 text-[11px] text-sky-400">{lang.tagline}</p>
                <p className="mt-2.5 flex-1 text-xs leading-relaxed text-slate-400">{lang.desc}</p>
                {lang.available && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-500">{lang.modules}</span>
                    <span className="text-sm font-bold text-sky-400">Start →</span>
                  </div>
                )}
              </motion.div>
            );
            return lang.available ? (
              <Link key={lang.id} href={lang.href!} className="h-full">
                {card}
              </Link>
            ) : (
              <div key={lang.id} className="h-full">
                {card}
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-slate-600">
          Built for interview prep, scripting and automation engineers — one language at a time.
        </p>
      </div>
    </main>
  );
}
