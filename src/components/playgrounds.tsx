"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { highlightPython } from "./ui";

function PlayShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-violet-800/40 bg-[#0c0f17]">
      <div className="flex items-center gap-2 border-b border-violet-800/30 bg-violet-950/20 px-4 py-2">
        <span className="text-sm">🧪</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-violet-300">
          Interactive playground
        </span>
        <span className="ml-auto text-[11px] text-slate-500">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MiniCode({ code }: { code: string }) {
  return (
    <pre className="code-font overflow-x-auto rounded-lg border border-slate-800 bg-[#0d1117] px-4 py-3 text-slate-200">
      <code>{highlightPython(code)}</code>
    </pre>
  );
}

function MiniOut({ text, showWhitespace = false }: { text: string; showWhitespace?: boolean }) {
  const display = showWhitespace
    ? text.replace(/ /g, "·").replace(/\n/g, "⏎\n")
    : text;
  return (
    <div className="rounded-lg border border-emerald-900/40 bg-black/60 px-4 py-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
        Terminal output
      </div>
      <pre className="code-font min-h-[1.7em] whitespace-pre-wrap text-emerald-300">{display || " "}</pre>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  width = "w-24",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  width?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span className="code-font text-amber-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`code-font ${width} rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sky-200 outline-none transition focus:border-sky-500`}
      />
    </label>
  );
}

/* ================================================================
   1. sep / end playground
   ================================================================ */

export function SepEndPlayground() {
  const [sep, setSep] = useState("-");
  const [end, setEnd] = useState("\\n");
  const items = ["Python", "Java", "C++"];

  const realSep = sep.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  const realEnd = end.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  const result = items.join(realSep) + realEnd + "next print starts here...";

  return (
    <PlayShell title="sep & end">
      <div className="mb-4 flex flex-wrap gap-4">
        <Field label='sep="' value={sep} onChange={setSep} />
        <Field label='end="' value={end} onChange={setEnd} />
      </div>
      <MiniCode
        code={`print("Python", "Java", "C++", sep="${sep}", end="${end}")\nprint("next print starts here...")`}
      />
      <div className="mt-3">
        <MiniOut text={result} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {items.map((it, i) => (
          <React.Fragment key={it}>
            <motion.span
              layout
              className="code-font rounded-md border border-sky-800/50 bg-sky-950/40 px-3 py-1.5 text-sm text-sky-200"
            >
              {it}
            </motion.span>
            {i < items.length - 1 && (
              <motion.span
                key={sep + i}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="code-font rounded-md border border-violet-700/50 bg-violet-950/40 px-2 py-1 text-xs text-violet-300"
              >
                sep → &quot;{sep}&quot;
              </motion.span>
            )}
          </React.Fragment>
        ))}
        <motion.span
          key={end}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="code-font rounded-md border border-amber-700/50 bg-amber-950/40 px-2 py-1 text-xs text-amber-300"
        >
          end → &quot;{end}&quot;
        </motion.span>
      </div>
    </PlayShell>
  );
}

/* ================================================================
   2. Alignment playground
   ================================================================ */

export function AlignmentPlayground() {
  const [text, setText] = useState("Python");
  const [width, setWidth] = useState(12);
  const [align, setAlign] = useState<"<" | ">" | "^">("<");
  const [fill, setFill] = useState("_");

  const result = useMemo(() => {
    const f = fill || " ";
    const t = text.slice(0, 30);
    if (t.length >= width) return t;
    const pad = width - t.length;
    if (align === "<") return t + f.repeat(pad);
    if (align === ">") return f.repeat(pad) + t;
    const left = Math.floor(pad / 2);
    return f.repeat(left) + t + f.repeat(pad - left);
  }, [text, width, align, fill]);

  return (
    <PlayShell title="alignment formatting">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Field label="text" value={text} onChange={setText} width="w-28" />
        <Field label="fill" value={fill} onChange={(v) => setFill(v.slice(0, 1))} width="w-12" />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span className="code-font text-amber-300">width = {width}</span>
          <input
            type="range"
            min={4}
            max={24}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="accent-sky-500"
          />
        </label>
        <div className="flex gap-1.5">
          {(["<", ">", "^"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAlign(a)}
              className={`code-font rounded-md border px-3 py-1.5 text-sm transition ${
                align === a
                  ? "border-sky-500 bg-sky-950/60 text-sky-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <MiniCode code={`print(f"{'${text}':${fill}${align}${width}}")`} />
      <div className="mt-3">
        <MiniOut text={result} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        <span className="code-font text-sky-400">{"<"}</span> left ·{" "}
        <span className="code-font text-sky-400">{">"}</span> right ·{" "}
        <span className="code-font text-sky-400">^</span> center — fill character pads the remaining{" "}
        {Math.max(width - text.length, 0)} slots.
      </p>
    </PlayShell>
  );
}

/* ================================================================
   3. f-string expression playground
   ================================================================ */

const FSTRING_PRESETS = [
  { expr: "x + 5", calc: (x: number) => String(x + 5) },
  { expr: "x * 20", calc: (x: number) => String(x * 20) },
  { expr: "x ** 2", calc: (x: number) => String(x ** 2) },
  { expr: "x > 5", calc: (x: number) => (x > 5 ? "True" : "False") },
  { expr: "x % 2 == 0", calc: (x: number) => (x % 2 === 0 ? "True" : "False") },
];

export function FStringPlayground() {
  const [x, setX] = useState(10);
  const [preset, setPreset] = useState(0);
  const p = FSTRING_PRESETS[preset];

  return (
    <PlayShell title="f-string expression evaluation">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span className="code-font text-amber-300">x = {x}</span>
          <input
            type="range"
            min={0}
            max={20}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
            className="accent-violet-500"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FSTRING_PRESETS.map((pr, i) => (
            <button
              key={pr.expr}
              onClick={() => setPreset(i)}
              className={`code-font rounded-md border px-2.5 py-1 text-xs transition ${
                preset === i
                  ? "border-violet-500 bg-violet-950/60 text-violet-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              {pr.expr}
            </button>
          ))}
        </div>
      </div>
      <MiniCode code={`x = ${x}\nprint(f"result = {${p.expr}}")`} />
      <div className="my-3 flex items-center justify-center gap-3 text-sm">
        <span className="code-font rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 text-emerald-300">
          {"{"}{p.expr}{"}"}
        </span>
        <span className="text-slate-500">evaluates to →</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={p.calc(x)}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="code-font rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-1.5 text-amber-300"
          >
            {p.calc(x)}
          </motion.span>
        </AnimatePresence>
      </div>
      <MiniOut text={`result = ${p.calc(x)}`} />
    </PlayShell>
  );
}

/* ================================================================
   4. Escape character playground
   ================================================================ */

const ESCAPES = [
  { seq: "\\n", desc: "newline", sample: "Hello\\nWorld", render: "Hello\nWorld" },
  { seq: "\\t", desc: "tab", sample: "Name\\tAge", render: "Name\tAge" },
  { seq: "\\\\", desc: "backslash", sample: "C:\\\\Users", render: "C:\\Users" },
  { seq: '\\"', desc: "double quote", sample: 'He said \\"hi\\"', render: 'He said "hi"' },
  { seq: "\\'", desc: "single quote", sample: "It\\'s Python", render: "It's Python" },
];

export function EscapePlayground() {
  const [sel, setSel] = useState(0);
  const e = ESCAPES[sel];
  return (
    <PlayShell title="escape characters">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ESCAPES.map((es, i) => (
          <button
            key={es.seq}
            onClick={() => setSel(i)}
            className={`code-font rounded-md border px-3 py-1.5 text-sm transition ${
              sel === i
                ? "border-sky-500 bg-sky-950/60 text-sky-300"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
            }`}
          >
            {es.seq}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            What you write ({e.desc})
          </div>
          <MiniCode code={`print("${e.sample}")`} />
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            What the terminal shows
          </div>
          <MiniOut text={e.render} />
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Characters in memory
        </div>
        <div className="flex gap-1">
          {[...e.render].map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`code-font flex h-9 min-w-9 items-center justify-center rounded-md border px-1 text-xs ${
                ch === "\n" || ch === "\t"
                  ? "border-rose-700/60 bg-rose-950/40 text-rose-300"
                  : "border-slate-700 bg-slate-900 text-slate-200"
              }`}
            >
              {ch === "\n" ? "\\n" : ch === "\t" ? "\\t" : ch === " " ? "␣" : ch}
            </motion.span>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Escape sequences look like two characters in source code, but are stored as a{" "}
          <span className="text-slate-300">single character</span> in memory.
        </p>
      </div>
    </PlayShell>
  );
}

/* ================================================================
   5. Number base converter (b / o / x)
   ================================================================ */

export function BaseConverterPlayground() {
  const [n, setN] = useState(255);
  const safe = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  const cards = [
    { spec: "b", name: "Binary", base: "base 2", val: safe.toString(2), color: "sky" },
    { spec: "o", name: "Octal", base: "base 8", val: safe.toString(8), color: "violet" },
    { spec: "x", name: "Hex", base: "base 16", val: safe.toString(16), color: "emerald" },
    { spec: "X", name: "HEX", base: "uppercase", val: safe.toString(16).toUpperCase(), color: "amber" },
  ];
  const colorMap: Record<string, string> = {
    sky: "border-sky-800/50 bg-sky-950/30 text-sky-300",
    violet: "border-violet-800/50 bg-violet-950/30 text-violet-300",
    emerald: "border-emerald-800/50 bg-emerald-950/30 text-emerald-300",
    amber: "border-amber-800/50 bg-amber-950/30 text-amber-300",
  };
  return (
    <PlayShell title="number base conversion">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span className="code-font text-amber-300">num =</span>
          <input
            type="number"
            min={0}
            max={1048575}
            value={safe}
            onChange={(e) => setN(Number(e.target.value))}
            className="code-font w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sky-200 outline-none focus:border-sky-500"
          />
        </label>
        {[10, 64, 255, 4094].map((v) => (
          <button
            key={v}
            onClick={() => setN(v)}
            className="code-font rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-400 transition hover:border-sky-600 hover:text-sky-300"
          >
            {v}
          </button>
        ))}
      </div>
      <MiniCode
        code={`num = ${safe}\nprint(f"{num:b}")   # binary\nprint(f"{num:o}")   # octal\nprint(f"{num:x}")   # hex`}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div
            key={c.spec}
            layout
            className={`rounded-xl border p-3 text-center ${colorMap[c.color]}`}
          >
            <div className="code-font text-[10px] uppercase tracking-widest opacity-70">
              {"{num:"}{c.spec}{"}"} · {c.base}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={c.val}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="code-font mt-1.5 break-all text-lg font-bold"
              >
                {c.val}
              </motion.div>
            </AnimatePresence>
            <div className="mt-0.5 text-[10px] opacity-60">{c.name}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        255 → <span className="code-font text-emerald-400">ff</span> is exactly how one octet of a MAC
        address like <span className="code-font text-emerald-400">ff:ff:ff:ff:ff:ff</span> is printed.
      </p>
    </PlayShell>
  );
}

/* ================================================================
   6. Unpacking visualizer
   ================================================================ */

export function UnpackPlayground() {
  const [unpacked, setUnpacked] = useState(false);
  const items = [1, 2, 3];
  return (
    <PlayShell title="list unpacking with *">
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setUnpacked((u) => !u)}
          className="rounded-lg border border-violet-600/60 bg-violet-950/40 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-900/40"
        >
          {unpacked ? "↺ Reset to print(nums)" : "✨ Apply * unpacking"}
        </button>
      </div>
      <MiniCode code={unpacked ? `nums = [1, 2, 3]\nprint(*nums)   # → print(1, 2, 3)` : `nums = [1, 2, 3]\nprint(nums)`} />
      <div className="my-5 flex min-h-16 items-center justify-center gap-2">
        {!unpacked && (
          <motion.div layout className="code-font flex items-center gap-1 rounded-xl border border-sky-800/60 bg-sky-950/40 px-4 py-2.5 text-sky-200">
            <span className="text-slate-500">[</span>
            {items.map((n, i) => (
              <span key={n}>
                <motion.span layoutId={`n-${n}`} className="inline-block px-1 text-amber-300">{n}</motion.span>
                {i < items.length - 1 && <span className="text-slate-500">,</span>}
              </span>
            ))}
            <span className="text-slate-500">]</span>
            <span className="ml-2 text-[10px] text-slate-500">one list object</span>
          </motion.div>
        )}
        {unpacked &&
          items.map((n, i) => (
            <motion.span
              key={n}
              layoutId={`n-${n}`}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="code-font rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-2.5 text-amber-300"
            >
              {n}
              <span className="ml-1.5 text-[10px] text-slate-500">arg {i + 1}</span>
            </motion.span>
          ))}
      </div>
      <MiniOut text={unpacked ? "1 2 3" : "[1, 2, 3]"} />
      <p className="mt-3 text-xs text-slate-500">
        {unpacked
          ? "* spreads the list into 3 separate positional arguments — print() receives 3 values and joins them with sep."
          : "Without *, print() receives ONE argument (the whole list) and prints its repr — brackets included."}
      </p>
    </PlayShell>
  );
}
