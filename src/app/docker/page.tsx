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
      { id: "intro", icon: "🤔", name: "Why Docker?", desc: "\"It works on my machine\" hell, containers vs virtual machines drawn side by side, images vs containers, and the shipping-container analogy that explains everything.", meta: "9 sections · start here", href: "/docker/intro", available: true },
      { id: "setup", icon: "🔧", name: "Install & First Container", desc: "Install Docker on every OS, verify the engine, run hello-world and trace EXACTLY what happened — client → daemon → registry → container.", meta: "8 sections · copy-paste ready", href: "/docker/setup", available: true },
    ],
  },
  {
    title: "Core Building Blocks",
    emoji: "🧱",
    items: [
      { id: "images", icon: "📦", name: "Images & Layers", desc: "pull, tag, inspect, history — how an image is a stack of read-only layers, why layers are shared and cached, and where they live on disk.", meta: "9 sections · layers drawn ⭐", href: "/docker/images", available: true },
      { id: "containers", icon: "🚢", name: "Container Lifecycle", desc: "run, ps, stop, start, exec, logs, rm — the full lifecycle state machine, detached vs interactive, and getting a shell inside anything.", meta: "10 sections · the core loop ⭐", href: "/docker/containers", available: true },
      { id: "dockerfile", icon: "📜", name: "Dockerfile — Build Your Own", desc: "FROM, COPY, RUN, CMD vs ENTRYPOINT, layer caching, .dockerignore and multi-stage builds — a real Python app containerized line by line.", meta: "10 sections · build mastery ⭐", href: "/docker/dockerfile", available: true },
    ],
  },
  {
    title: "Data & Networking",
    emoji: "🔌",
    items: [
      { id: "volumes", icon: "💾", name: "Volumes — Persistent Data", desc: "Containers are disposable, data shouldn't be: named volumes vs bind mounts drawn, database persistence, and live-reload dev workflows.", meta: "8 sections · data survives", href: "/docker/volumes", available: true },
      { id: "networking", icon: "🌐", name: "Networking & Ports", desc: "-p port mapping demystified, bridge networks, container-to-container DNS by name, and why localhost inside a container isn't your laptop.", meta: "8 sections · traffic drawn", href: "/docker/networking", available: true },
    ],
  },
  {
    title: "Shipping It",
    emoji: "🚀",
    items: [
      { id: "compose", icon: "🧩", name: "Docker Compose", desc: "One YAML file, whole stack: web + database + cache started with a single command. Services, depends_on, volumes and networks together.", meta: "9 sections · multi-container ⭐", href: "/docker/compose", available: true },
      { id: "deploy", icon: "☁️", name: "Registry & Deploy — End to End", desc: "Push to Docker Hub, pull on a server, run in production: restart policies, env vars, health checks, image cleanup + the full command cheat sheet.", meta: "9 sections · + cheat sheet ⭐", href: "/docker/deploy", available: true },
    ],
  },
];

export default function DockerPage() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Docker</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(34,211,238,0.5)]"
          >
            🐳
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Docker</span> — build, ship, run anywhere
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;works on my machine&quot; to a full multi-container stack in production:
              every command with its real terminal output, images and layers drawn box by box, and
              one app carried end to end — Dockerfile → image → container → compose → deploy.
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
          {["📜 Dockerfile", "🏗️ build → Image", "🚢 run → Container", "🧩 Compose (stack)", "☁️ push → Registry", "✅ Deployed"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-cyan-400">→</span>}
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
                        ? "cursor-pointer border-cyan-700/50 hover:shadow-[0_0_50px_-15px_rgba(34,211,238,0.6)]"
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
                        <span className="text-sm font-bold text-cyan-400">Open →</span>
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
