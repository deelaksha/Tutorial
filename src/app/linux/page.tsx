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
      { id: "intro", icon: "🐚", name: "The Terminal & The Shell", desc: "What ACTUALLY happens when you press Enter — shell parses, $PATH lookup, kernel runs it, output streams back. Plus the prompt decoded and tab-completion superpowers.", meta: "8 sections · start here", href: "/linux/intro", available: true },
      { id: "navigation", icon: "🧭", name: "Navigation — pwd · cd · ls", desc: "The filesystem tree drawn, absolute vs relative paths, . and .. and ~ demystified, ls flags that matter, and an animation of you walking the tree.", meta: "8 sections · animated tree ⭐", href: "/linux/navigation", available: true },
    ],
  },
  {
    title: "Files & Folders",
    emoji: "📁",
    items: [
      { id: "files", icon: "✏️", name: "Create · Copy · Move · Delete", desc: "touch, mkdir -p, cp -r, mv (move AND rename!), rm -rf with its dangers — every command animated against a live folder tree.", meta: "9 sections · watch files move ⭐", href: "/linux/files", available: true },
      { id: "viewing", icon: "👀", name: "Reading Files", desc: "cat vs less vs head vs tail — pick the right tool for the file size, tail -f for live logs (animated), and wc for counting everything.", meta: "8 sections · log streaming", href: "/linux/viewing", available: true },
      { id: "search", icon: "🔍", name: "Finding Things — find & grep", desc: "find by name/type/size/time, grep through file CONTENTS with -r -i -n -v, and the find -exec combo. The two commands that locate anything.", meta: "8 sections · search animated ⭐", href: "/linux/search", available: true },
    ],
  },
  {
    title: "Text Power",
    emoji: "🔧",
    items: [
      { id: "pipes", icon: "🪈", name: "Pipes & Redirection", desc: "The single most important shell idea: stdout → stdin chains with |, file redirection with > >> 2> &&, and watching data flow through a pipeline.", meta: "9 sections · THE core idea ⭐", href: "/linux/pipes", available: true },
      { id: "text-tools", icon: "🔪", name: "Text Surgery — sort · uniq · cut · sed · awk", desc: "Slice columns with cut and awk, dedupe with sort | uniq -c, find-and-replace with sed — building real log-analysis one-liners step by step.", meta: "9 sections · one-liners ⭐", href: "/linux/text-tools", available: true },
    ],
  },
  {
    title: "Permissions & Users",
    emoji: "🔐",
    items: [
      { id: "permissions", icon: "🛡️", name: "Permissions — chmod · chown · sudo", desc: "rwxr-xr-x finally decoded, numeric 755/644 explained, chmod +x to make scripts runnable, chown, and what sudo really does — all animated.", meta: "9 sections · rwx decoded ⭐", href: "/linux/permissions", available: true },
      { id: "users", icon: "👥", name: "Users & Groups", desc: "whoami, id, su vs sudo -i, creating users and groups, /etc/passwd decoded — who you are and how Linux tracks everyone.", meta: "8 sections · identity", href: "/linux/users", available: true },
    ],
  },
  {
    title: "Processes & System",
    emoji: "🖥️",
    items: [
      { id: "processes", icon: "⚙️", name: "Processes — ps · top · kill", desc: "Every program is a process with a PID: ps aux decoded, top/htop live view, kill -15 vs -9, & and jobs and nohup for background work.", meta: "9 sections · kill animated ⭐", href: "/linux/processes", available: true },
      { id: "system", icon: "📊", name: "System Health — df · du · free · systemctl", desc: "Disk full? Memory gone? Service down? df -h, du -sh, free -h, uname, uptime, and systemctl to start/stop/enable services.", meta: "8 sections · server checkup", href: "/linux/system", available: true },
    ],
  },
  {
    title: "Network & Software",
    emoji: "🌐",
    items: [
      { id: "networking", icon: "📡", name: "Network — ping · curl · ssh · scp", desc: "Test connectivity with ping, talk to APIs with curl, control remote servers with ssh, copy files with scp/rsync — the remote-work toolkit animated.", meta: "8 sections · ssh animated ⭐", href: "/linux/networking", available: true },
      { id: "packages", icon: "📦", name: "Software & Archives + Cheat Sheet", desc: "apt/dnf install-update-remove animated, tar -xzf finally memorable, zip/unzip — plus the giant end-to-end cheat sheet of every command in this track.", meta: "8 sections · + cheat sheet ⭐", href: "/linux/packages", available: true },
    ],
  },
];

export default function LinuxPage() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Linux</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]"
          >
            🐧
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Linux</span> — command the machine
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              Every essential command, end to end — and not just WHAT to type but WHAT HAPPENS:
              animated terminals show files appearing, pipes flowing, permissions flipping and
              processes dying. From your first <code className="code-font text-emerald-300">ls</code>{" "}
              to managing a remote server.
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
          {["⌨️ you type", "🐚 shell parses", "⚙️ kernel runs it", "📤 stdout", "🪈 | pipe", "📺 your screen"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-emerald-400">→</span>}
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
                        ? "cursor-pointer border-emerald-700/50 hover:shadow-[0_0_50px_-15px_rgba(52,211,153,0.6)]"
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
                        <span className="text-sm font-bold text-emerald-400">Open →</span>
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
