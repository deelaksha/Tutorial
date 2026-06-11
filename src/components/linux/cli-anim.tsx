"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
   CmdPlay — a reusable "type a command, WATCH what happens" player.

   Left panel : a terminal that accumulates each step's command + output.
   Right panel: a visual that animates per step. Two modes:
     • tree  — a filesystem/process snapshot. Items appear (new, green),
               vanish (gone, red strikethrough), light up (active),
               fade (dim), and can carry a note (permissions, size, pid…).
     • boxes — a vertical pipeline: data flowing through stages
               (shell → kernel, cmd | cmd | cmd, laptop → server…).
   ───────────────────────────────────────────────────────────────────── */

export type TreeItem = {
  id: string;
  label: string;
  depth?: number;
  kind?: "dir" | "file";
  icon?: string;
  state?: "new" | "gone" | "active" | "dim";
  note?: string;
};

export type BoxItem = {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  state?: "active" | "done" | "dim";
};

export type CmdStep = {
  cmd?: string;
  out?: string[];
  narrative: string;
  tree?: TreeItem[];
  boxes?: BoxItem[];
  visualTitle?: string;
};

const STEP_MS = 3400;

export function CmdPlay({ title = "watch it happen", steps }: { title?: string; steps: CmdStep[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const termRef = useRef<HTMLDivElement>(null);

  const step = steps[idx];
  const history = steps.slice(0, idx + 1);

  /* auto-advance */
  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) {
      const t = setTimeout(() => setPlaying(false), STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length]);

  /* keep terminal scrolled to latest */
  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight, behavior: "smooth" });
  }, [idx]);

  return (
    <div className="glass my-5 overflow-hidden rounded-2xl border border-emerald-900/40">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          🐧 {title}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setIdx(0); setPlaying(true); }}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500"
            title="Replay"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-2 py-1 text-xs text-emerald-300 transition hover:border-emerald-500"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => { setPlaying(false); setIdx((i) => Math.min(i + 1, steps.length - 1)); }}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500"
            title="Next step"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* terminal + visual */}
      <div className="grid sm:grid-cols-2">
        {/* terminal */}
        <div className="flex flex-col border-b border-slate-800 bg-[#0a0e14] sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-1.5 px-4 pt-2.5">
            <span className="h-2 w-2 rounded-full bg-rose-500/70" />
            <span className="h-2 w-2 rounded-full bg-amber-500/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
            <span className="code-font ml-2 text-[10px] text-slate-600">terminal</span>
          </div>
          <div
            ref={termRef}
            className="code-font h-44 overflow-y-auto px-4 pb-3 pt-1.5 text-[11px] leading-relaxed sm:h-56"
          >
            {history.map((s, i) => (
              <div key={i}>
                {s.cmd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-300"
                  >
                    <span className="text-slate-500">$ </span>
                    {s.cmd}
                  </motion.div>
                )}
                {s.out?.map((line, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i === idx ? 0.15 + j * 0.1 : 0 }}
                    className={
                      line.includes("✓") || line.includes("✔")
                        ? "text-emerald-300"
                        : line.toLowerCase().includes("denied") || line.toLowerCase().includes("error") || line.includes("✗")
                        ? "text-rose-400"
                        : "text-slate-400"
                    }
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            ))}
            <span className="caret text-emerald-400">▌</span>
          </div>
        </div>

        {/* visual */}
        <div className="relative min-h-[12rem] bg-slate-950/40 p-4 sm:min-h-0">
          <div className="code-font mb-2 text-[10px] uppercase tracking-widest text-slate-600">
            {step.visualTitle ?? (step.tree ? "filesystem" : "what happens")}
          </div>

          {/* tree mode */}
          {step.tree && (
            <div className="code-font space-y-0.5 text-[11px]">
              <AnimatePresence mode="popLayout">
                {step.tree.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: item.state === "dim" ? 0.35 : 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    style={{ paddingLeft: `${(item.depth ?? 0) * 16}px` }}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors ${
                        item.state === "new"
                          ? "bg-emerald-950/70 text-emerald-300 ring-1 ring-emerald-600/50"
                          : item.state === "gone"
                          ? "bg-rose-950/60 text-rose-400 line-through ring-1 ring-rose-700/40"
                          : item.state === "active"
                          ? "bg-cyan-950/70 text-cyan-300 ring-1 ring-cyan-600/50"
                          : "text-slate-400"
                      }`}
                    >
                      <span>{item.icon ?? (item.kind === "dir" ? "📁" : "📄")}</span>
                      {item.label}
                      {item.state === "new" && <span className="text-[9px] text-emerald-500">← new</span>}
                      {item.state === "gone" && <span className="text-[9px] text-rose-500">← gone</span>}
                    </span>
                    {item.note && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[9px] text-slate-500"
                      >
                        {item.note}
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* boxes mode */}
          {step.boxes && (
            <div className="flex flex-col items-stretch gap-1">
              <AnimatePresence mode="popLayout">
                {step.boxes.map((box, i) => (
                  <motion.div
                    key={box.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: box.state === "dim" ? 0.35 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="flex flex-col items-center"
                  >
                    {i > 0 && (
                      <motion.span
                        animate={
                          box.state === "active"
                            ? { y: [0, 3, 0], opacity: [0.5, 1, 0.5] }
                            : { opacity: 0.4 }
                        }
                        transition={{ duration: 0.9, repeat: box.state === "active" ? Infinity : 0 }}
                        className={`text-xs leading-none ${box.state === "active" ? "text-emerald-400" : "text-slate-600"}`}
                      >
                        ↓
                      </motion.span>
                    )}
                    <div
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-colors ${
                        box.state === "active"
                          ? "border-emerald-500/70 bg-emerald-950/60 shadow-[0_0_20px_-6px_rgba(52,211,153,0.7)]"
                          : box.state === "done"
                          ? "border-emerald-900/60 bg-slate-900/70"
                          : "border-slate-700/50 bg-slate-900/70"
                      }`}
                    >
                      {box.icon && <span className="text-base">{box.icon}</span>}
                      <div className="min-w-0">
                        <div
                          className={`code-font truncate text-[11px] font-bold ${
                            box.state === "active"
                              ? "text-emerald-300"
                              : box.state === "done"
                              ? "text-emerald-600"
                              : "text-slate-300"
                          }`}
                        >
                          {box.label}
                        </div>
                        {box.sub && (
                          <div className="truncate text-[9.5px] text-slate-500">{box.sub}</div>
                        )}
                      </div>
                      {box.state === "done" && <span className="ml-auto text-[10px] text-emerald-500">✓</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* narrative + dots */}
      <div className="border-t border-slate-800 px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="min-h-[2.25rem] text-xs leading-relaxed text-slate-300"
          >
            <span className="code-font mr-2 rounded bg-emerald-950/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
              {idx + 1}/{steps.length}
            </span>
            {step.narrative}
          </motion.p>
        </AnimatePresence>
        <div className="mt-2 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPlaying(false); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-emerald-400" : i < idx ? "w-1.5 bg-emerald-800" : "w-1.5 bg-slate-700"
              }`}
              aria-label={`step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
