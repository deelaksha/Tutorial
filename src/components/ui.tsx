"use client";

import React, { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* ================================================================
   Python syntax highlighter (tiny, dependency-free)
   ================================================================ */

const PY_RE =
  /(#[^\n]*)|((?:[fFrRbB]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|\b(def|class|return|if|elif|else|for|while|in|not|and|or|import|from|as|with|pass|break|continue|lambda|None|True|False|is|try|except|finally|yield|global|del)\b|\b(print|pprint|type|help|len|range|str|int|float|bool|list|dict|tuple|set|input|format|repr|id|abs|round|sum|min|max|sorted|enumerate|zip|map|filter|open|bin|oct|hex|ord|chr)\b|(\b\d[\d_]*(?:\.\d+)?\b)/g;

function renderFString(token: string, key: number): ReactNode {
  // highlight {expressions} inside f-strings
  const parts = token.split(/(\{[^{}]*\})/g);
  return (
    <span key={key} className="tok-str">
      {parts.map((p, i) =>
        p.startsWith("{") && p.endsWith("}") ? (
          <span key={i} className="tok-brace">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(PY_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<span key={key++}>{code.slice(last, idx)}</span>);
    const [full, com, str, kw, builtin, num] = m;
    if (com !== undefined) out.push(<span key={key++} className="tok-com">{full}</span>);
    else if (str !== undefined) {
      if (/^[fF]/.test(full)) out.push(renderFString(full, key++));
      else out.push(<span key={key++} className="tok-str">{full}</span>);
    } else if (kw !== undefined) out.push(<span key={key++} className="tok-kw">{full}</span>);
    else if (builtin !== undefined) out.push(<span key={key++} className="tok-builtin">{full}</span>);
    else if (num !== undefined) out.push(<span key={key++} className="tok-num">{full}</span>);
    else out.push(<span key={key++}>{full}</span>);
    last = idx + full.length;
  }
  if (last < code.length) out.push(<span key={key++}>{code.slice(last)}</span>);
  return out;
}

/* ================================================================
   CodeBlock — terminal-style block, copy button, optional Run
   ================================================================ */

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export function CodeBlock({
  code,
  title = "main.py",
  output,
  error = false,
  runnable = true,
}: {
  code: string;
  title?: string;
  output?: string;
  error?: boolean;
  runnable?: boolean;
}) {
  const [showOut, setShowOut] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] shadow-lg shadow-black/30">
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#11161f] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
          <span className="ml-3 code-font text-[11px] text-slate-500">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {output !== undefined && runnable && (
            <button
              onClick={() => setShowOut((s) => !s)}
              className="rounded-md border border-emerald-700/40 bg-emerald-900/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition hover:border-emerald-500/60"
            >
              {showOut ? "■ Hide" : "▶ Run"}
            </button>
          )}
          <CopyButton text={code} />
        </div>
      </div>
      <pre className="code-font overflow-x-auto px-4 py-3.5 text-slate-200">
        <code>{highlightPython(code)}</code>
      </pre>
      {output !== undefined && showOut && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-slate-800"
        >
          <div className="bg-black/50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              <span
                className={`h-1.5 w-1.5 rounded-full pulse-glow ${error ? "bg-rose-400" : "bg-emerald-400"}`}
              />
              {error ? "stderr · program crashed" : "stdout"}
            </div>
            <pre
              className={`code-font whitespace-pre-wrap ${error ? "text-rose-300" : "text-emerald-300"}`}
            >
              {output}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================
   OutputBlock — standalone terminal output
   ================================================================ */

export function OutputBlock({ children, label = "Output" }: { children: ReactNode; label?: string }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-emerald-900/40 bg-black/60">
      <div className="flex items-center gap-2 border-b border-emerald-900/40 bg-emerald-950/30 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-glow" /> {label}
      </div>
      <pre className="code-font whitespace-pre-wrap px-4 py-3 text-emerald-300">{children}</pre>
    </div>
  );
}

/* ================================================================
   FlowDiagram — animated vertical flow (Program → stdout → Terminal)
   ================================================================ */

export function FlowDiagram({ steps }: { steps: { label: string; sub?: string }[] }) {
  return (
    <div className="my-6 flex flex-col items-center">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass w-full max-w-xs rounded-xl px-5 py-3 text-center"
          >
            <div className="code-font text-sm font-semibold text-sky-300">{s.label}</div>
            {s.sub && <div className="mt-0.5 text-xs text-slate-400">{s.sub}</div>}
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 + 0.1 }}
              className="flex flex-col items-center py-1 text-sky-500"
            >
              <span className="h-4 w-px bg-gradient-to-b from-sky-500/60 to-violet-500/60" />
              <span className="text-xs">▼</span>
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ================================================================
   MemoryDiagram — variable → object box
   ================================================================ */

export function MemoryDiagram({
  vars,
  caption,
}: {
  vars: { name: string; value: string; type?: string }[];
  caption?: string;
}) {
  return (
    <div className="my-6 rounded-xl border border-slate-800 bg-[#0b0f16] p-5">
      <div className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Memory visualization
      </div>
      <div className="flex flex-wrap items-start gap-8">
        {vars.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="code-font rounded-md bg-slate-800/80 px-3 py-1 text-xs text-amber-300">
              {v.name}
            </span>
            <span className="text-sky-500">↓</span>
            <div className="rounded-lg border border-sky-800/50 bg-sky-950/30 px-4 py-2.5 text-center shadow-[0_0_24px_-8px_rgba(56,189,248,0.4)]">
              <div className="code-font text-sm text-sky-200">{v.value}</div>
              {v.type && <div className="mt-1 text-[10px] text-slate-500">{v.type} object</div>}
            </div>
          </motion.div>
        ))}
      </div>
      {caption && <p className="mt-4 text-xs text-slate-500">{caption}</p>}
    </div>
  );
}

/* ================================================================
   Callout — analogy / behind-the-scenes / mistake / tip / note
   ================================================================ */

const CALLOUT_STYLES = {
  analogy: { icon: "🌍", title: "Real-world analogy", border: "border-violet-700/40", bg: "bg-violet-950/20", text: "text-violet-300" },
  behind: { icon: "⚙️", title: "Behind the scenes", border: "border-sky-700/40", bg: "bg-sky-950/20", text: "text-sky-300" },
  mistake: { icon: "⚠️", title: "Common mistake", border: "border-rose-700/40", bg: "bg-rose-950/20", text: "text-rose-300" },
  tip: { icon: "🎯", title: "Interview tip", border: "border-amber-700/40", bg: "bg-amber-950/20", text: "text-amber-300" },
  note: { icon: "📌", title: "Note", border: "border-emerald-700/40", bg: "bg-emerald-950/20", text: "text-emerald-300" },
} as const;

export function Callout({
  type,
  title,
  children,
}: {
  type: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: ReactNode;
}) {
  const s = CALLOUT_STYLES[type];
  return (
    <div className={`my-4 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className={`mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${s.text}`}>
        <span>{s.icon}</span> {title ?? s.title}
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

/* ================================================================
   Section shell
   ================================================================ */

export function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number?: number | string;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      data-section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="section-anchor border-b border-slate-800/60 py-12"
    >
      <div className="mb-6 flex items-baseline gap-3">
        {number !== undefined && (
          <span className="code-font rounded-lg border border-sky-800/50 bg-sky-950/40 px-2.5 py-1 text-xs font-bold text-sky-400">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">{title}</h2>
      </div>
      <div className="space-y-4 text-[15px] leading-relaxed text-slate-300">{children}</div>
    </motion.section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-slate-300">{children}</p>;
}

export function IC({ children }: { children: ReactNode }) {
  return <code className="inline-code">{children}</code>;
}

/* ================================================================
   Comparison / formatting table
   ================================================================ */

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/40">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-300">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
