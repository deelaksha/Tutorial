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
      { id: "printing", icon: "🖨️", name: "Printing & Output", desc: "22 techniques: sep, end, f-strings, formatting, unpacking, escapes — with exception cases.", meta: "22 techniques · interview kit", href: "/python/printing", available: true },
      { id: "variables", icon: "🏷️", name: "Variables & Memory", desc: "Names, references, id(), aliasing, mutability — see exactly how Python stores objects.", meta: "13 sections · memory visuals", href: "/python/variables", available: true },
      { id: "datatypes", icon: "🧬", name: "Data Types", desc: "int, float, str, bool, None — type conversion, truthiness and the 0.1 + 0.2 trap.", meta: "12 sections · conversion traps", href: "/python/datatypes", available: true },
      { id: "strings", icon: "🧵", name: "Strings", desc: "Indexing, slicing, methods, split/join, reverse — visualized character by character.", meta: "12 sections · char boxes", href: "/python/strings", available: true },
      { id: "operators", icon: "➗", name: "Operators", desc: "Arithmetic, / vs // vs %, comparison chains, and/or short-circuit, is vs ==.", meta: "10 sections · precedence", href: "/python/operators", available: true },
    ],
  },
  {
    title: "Control Flow",
    emoji: "🔀",
    items: [
      { id: "if-else", icon: "🔀", name: "if / elif / else", desc: "Every branch drawn as a flow: ladders, nesting, ternary, match-case, = vs == crashes.", meta: "10 sections · flow diagrams", href: "/python/if-else", available: true },
      { id: "for-loop", icon: "🔁", name: "for Loop", desc: "range, enumerate, zip, nested patterns, accumulators, comprehensions — step by step.", meta: "11 sections · patterns", href: "/python/for-loop", available: true },
      { id: "while-loop", icon: "⏳", name: "while Loop", desc: "Condition anatomy, infinite-loop traps, while True + break, digit tricks with trace tables.", meta: "10 sections · trace tables", href: "/python/while-loop", available: true },
      { id: "loop-control", icon: "🚦", name: "break · continue · pass", desc: "Exit, skip, placeholder — plus the for-else search idiom and retry patterns.", meta: "9 sections · idioms", href: "/python/loop-control", available: true },
    ],
  },
  {
    title: "Data Structures",
    emoji: "🗃️",
    items: [
      { id: "lists", icon: "📋", name: "Lists", desc: "append vs extend, remove/pop/del, sort vs sorted, the copy trap, interview problems.", meta: "11 sections · box visuals", href: "/python/lists", available: true },
      { id: "tuples", icon: "📦", name: "Tuples", desc: "Immutability, the (5,) one-item trap, unpacking, swap, star-unpacking, tuple vs list.", meta: "9 sections · unpacking", href: "/python/tuples", available: true },
      { id: "dicts", icon: "🗂️", name: "Dictionaries", desc: "[] vs get, the counting pattern, nested JSON-like data, hashing — watch lookups happen.", meta: "11 sections · key→value visuals", href: "/python/dicts", available: true },
      { id: "sets", icon: "🎯", name: "Sets", desc: "Instant dedupe, union/intersection/difference, O(1) membership, frozenset.", meta: "9 sections · set math", href: "/python/sets", available: true },
    ],
  },
  {
    title: "Going Deeper",
    emoji: "🚀",
    items: [
      { id: "functions", icon: "📦", name: "Functions", desc: "return vs print, *args/**kwargs, scope, lambda — and the mutable default trap.", meta: "11 sections · scope visuals", href: "/python/functions", available: true },
      { id: "exceptions", icon: "💥", name: "Exception Handling", desc: "Read tracebacks bottom-up, try/except/else/finally, raise, custom errors, EAFP.", meta: "10 sections · error zoo", href: "/python/exceptions", available: true },
      { id: "files", icon: "📁", name: "File Handling", desc: "open modes (w wipes!), with auto-close, line-by-line reading, CSV & JSON, file pointer.", meta: "11 sections · pointer drawn live", href: "/python/files", available: true },
      { id: "modules", icon: "🧩", name: "Modules & pip", desc: "Import styles, __name__ == \"__main__\", stdlib tour, pip, requirements.txt, venv.", meta: "9 sections · import system", href: "/python/modules", available: true },
    ],
  },
  {
    title: "Object-Oriented Python",
    emoji: "🏛️",
    items: [
      { id: "oop", icon: "🏛️", name: "OOP Overview", desc: "The whole picture in one pass: classes, self, __init__, inheritance, polymorphism — start here.", meta: "11 sections · the big map", href: "/python/oop", available: true },
      { id: "oop-classes", icon: "🏗️", name: "Classes & Objects", desc: "Blueprint vs instance, attributes, methods, self explained, class attrs, inspecting objects.", meta: "11 sections · self decoded", href: "/python/oop-classes", available: true },
      { id: "oop-constructor", icon: "🔧", name: "Constructor — __init__", desc: "Auto-setup at birth, defaults, validation, __str__/__repr__, composition (objects in objects).", meta: "10 sections · birth checklist", href: "/python/oop-constructor", available: true },
      { id: "oop-encapsulation", icon: "🔒", name: "Encapsulation", desc: "public / _protected / __private, name mangling, getters & setters, @property with validation.", meta: "10 sections · privacy levels", href: "/python/oop-encapsulation", available: true },
      { id: "oop-abstraction", icon: "🎭", name: "Abstraction", desc: "ABC & @abstractmethod — turn 'every child must have X' into an enforced contract.", meta: "10 sections · contracts", href: "/python/oop-abstraction", available: true },
      { id: "oop-inheritance", icon: "🧬", name: "Inheritance", desc: "child(Parent), super().__init__, lookup path, multilevel, multiple inheritance & MRO.", meta: "10 sections · family trees", href: "/python/oop-inheritance", available: true },
      { id: "oop-polymorphism", icon: "🦆", name: "Polymorphism", desc: "Overriding, duck typing, operator overloading (__add__, __eq__, __len__) — one name, many forms.", meta: "10 sections · dunder magic", href: "/python/oop-polymorphism", available: true },
    ],
  },
  {
    title: "Data Structures & Algorithms",
    emoji: "🧮",
    items: [
      { id: "big-o", icon: "⏱️", name: "Big-O — How Fast Is It?", desc: "Count steps, not seconds: O(1) → O(n²) drawn with growth charts, plus the list-vs-set cheat sheet.", meta: "10 sections · start DSA here", href: "/python/big-o", available: true },
      { id: "recursion", icon: "🌀", name: "Recursion — From Zero", desc: "A function calling itself, demystified: the call stack drawn frame by frame, factorial traced both ways, fibonacci's tree, memoization.", meta: "13 sections · every frame drawn ⭐", href: "/python/recursion", available: true },
      { id: "linked-lists", icon: "🔗", name: "Linked Lists", desc: "Boxes and arrows: build nodes by hand, insert/delete by rewiring pointers, reverse the chain — every arrow drawn.", meta: "11 sections · pointer surgery", href: "/python/linked-lists", available: true },
      { id: "stacks-queues", icon: "🥞", name: "Stacks & Queues", desc: "LIFO plates vs FIFO lines: undo, balanced brackets, why pop(0) is a trap and deque is the fix.", meta: "10 sections · push/pop traced", href: "/python/stacks-queues", available: true },
      { id: "trees", icon: "🌳", name: "Trees & BSTs", desc: "Hierarchy drawn: the 3 traversals traced call by call, level-order with a queue, BST search in O(log n), balanced vs skewed.", meta: "11 sections · real tree diagrams", href: "/python/trees", available: true },
      { id: "graphs", icon: "🕸️", name: "Graphs — BFS & DFS", desc: "Friends, maps, the web: adjacency dicts, BFS ripple and DFS dive traced step by step, shortest path rebuilt.", meta: "11 sections · traversals drawn", href: "/python/graphs", available: true },
      { id: "sorting-searching", icon: "🔀", name: "Sorting & Searching", desc: "Binary search's shrinking window, bubble/insertion pass by pass, merge sort's split-and-zip tree, sorted() and key=.", meta: "11 sections · pass-by-pass", href: "/python/sorting-searching", available: true },
    ],
  },
];

export default function PythonPage() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Python</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(56,189,248,0.5)]"
          >
            🐍
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Python</span> — learn it visually
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              Pick a category. Each one goes end-to-end: concept → code → memory → output →
              exception cases → interview questions. Look at the visuals, understand, then write
              your own.
            </motion.p>
          </div>
        </div>

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
                        ? "cursor-pointer border-sky-700/50 hover:shadow-[0_0_50px_-15px_rgba(56,189,248,0.6)]"
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
                        <span className="text-sm font-bold text-sky-400">Open →</span>
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
