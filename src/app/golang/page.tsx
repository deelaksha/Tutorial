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
      { id: "fundamentals", icon: "🐹", name: "Go Fundamentals", desc: "Why Go exists (Google, compile speed, built-in concurrency), install & toolchain (go run/build/fmt/vet), hello world dissected, compilation story drawn from source to static binary, cross-compilation, and the gofmt philosophy.", meta: "10 sections · start here ⭐", href: "/golang/fundamentals", available: true },
      { id: "variables-types", icon: "📦", name: "Variables & Types", desc: "var, :=, const + iota drawn as a counter, basic types & sizes table, zero values (Go never has undefined!), explicit conversions only, fmt verbs (%v %T %d %s), and strings immutability.", meta: "9 sections · typed boxes ⭐", href: "/golang/variables-types", available: true },
      { id: "control-flow", icon: "🔀", name: "Control Flow", desc: "if with init statement, for as THE only loop (3 forms drawn: classic/while/range), switch with auto-break, labels & break/continue, defer LIFO stack drawn step by step, and when to use goto.", meta: "9 sections · the defer stack ⭐", href: "/golang/control-flow", available: true },
    ],
  },
  {
    title: "Core Language",
    emoji: "🧱",
    items: [
      { id: "functions", icon: "⚙️", name: "Functions", desc: "Declarations, multiple return values (THE Go signature move), named returns, variadic params, functions as values, closures capturing environments drawn, recursion, and defer + named return interplay.", meta: "9 sections · closures & multi-return ⭐", href: "/golang/functions", available: true },
      { id: "collections", icon: "📚", name: "Collections", desc: "Arrays (fixed, value semantics) vs slices, slice header drawn (ptr/len/cap), append growth & reallocation drawn, slicing shares backing array (gotcha!), copy, maps (CRUD + comma-ok), and strings vs []byte vs []rune.", meta: "10 sections · slice header ⭐", href: "/golang/collections", available: true },
      { id: "structs-methods", icon: "🏗️", name: "Structs & Methods", desc: "Struct definition & literals, struct tags (JSON marshaling), embedding = composition (drawn vs inheritance), methods, pointer vs value receivers drawn (copy vs same box), constructor convention NewX, and method sets.", meta: "9 sections · receivers: copy or same? ⭐", href: "/golang/structs-methods", available: true },
      { id: "interfaces", icon: "🧩", name: "Interfaces", desc: "Implicit satisfaction, the empty interface, type assertions & switches, common patterns (io.Reader/Writer, error interface), interface values drawn (type + value pair), and when nil interfaces aren't nil.", meta: "9 sections · polymorphism", href: "/golang/interfaces", available: true },
    ],
  },
  {
    title: "Robust Code",
    emoji: "🛡️",
    items: [
      { id: "error-handling", icon: "⚠️", name: "Error Handling", desc: "The error interface, if err != nil everywhere (drawn), errors.New vs fmt.Errorf, wrapping errors with %w, errors.Is & errors.As, custom error types, panic/recover when appropriate, and defensive programming patterns.", meta: "9 sections · no exceptions", href: "/golang/error-handling", available: true },
    ],
  },
  {
    title: "Concurrency",
    emoji: "⚡",
    items: [
      { id: "goroutines-channels", icon: "⚡", name: "Goroutines & Channels", desc: "The go keyword, goroutine scheduling drawn (M:N model), channels as typed pipes, send/receive, buffered vs unbuffered, close & range, select multiplexing, the WaitGroup pattern, and the classic concurrency bugs.", meta: "10 sections · CSP model ⭐", href: "/golang/goroutines-channels", available: true },
      { id: "concurrency-patterns", icon: "🔄", name: "Concurrency Patterns", desc: "Worker pools, pipeline stages, fan-out/fan-in, cancellation with context, rate limiting, the sync package (Mutex, RWMutex, Once, Pool), and when NOT to use concurrency.", meta: "9 sections · production patterns", href: "/golang/concurrency-patterns", available: true },
    ],
  },
  {
    title: "Real World",
    emoji: "🚀",
    items: [
      { id: "packages-modules", icon: "📦", name: "Packages & Modules", desc: "Package organization, imports (blank, dot, aliased), exported vs unexported names, go.mod & go.sum, semantic versioning, go get & tidy, replace directives, and workspace mode (multi-module dev).", meta: "9 sections · modularity", href: "/golang/packages-modules", available: true },
      { id: "web-api", icon: "🌐", name: "Web & API", desc: "net/http server & router patterns, handlers & middleware, JSON encoding/decoding, http.Client for making requests, context for timeouts, templates (html/template), and a REST API built step by step.", meta: "10 sections · build APIs ⭐", href: "/golang/web-api", available: true },
    ],
  },
];

export default function GolangPage() {
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Go</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(34,211,238,0.5)]"
          >
            🐹
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Go</span> — concurrency-first backend language
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;why Go exists&quot; to building concurrent web APIs: goroutines, channels, slices,
              interfaces, and error handling drawn box by box — {total} topics that build on each other,
              from zero-values to worker pools, ending with production-ready patterns.
            </motion.p>
          </div>
        </div>

        {/* The journey strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mb-12 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-4 text-[11px] font-semibold text-slate-300"
        >
          {["🐹 Fundamentals", "📦 Types & flow", "🧱 Functions & data", "🧩 Interfaces", "⚡ Goroutines", "🔄 Patterns", "🚀 Web APIs"].map(
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
              transition={{ delay: 0.1 + g * 0.06 }}
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
                    transition={{ delay: 0.1 + g * 0.06 + i * 0.04 }}
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
