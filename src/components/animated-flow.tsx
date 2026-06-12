"use client";

import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type FlowNode = {
  id: string;
  icon: string; // emoji
  label: string;
  sub?: string;
  x: number; // 0-100 (% from left)
  y: number; // 0-100 (% from top)
  color?: string; // hex accent when active
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  bend?: number; // perpendicular curve offset (viewBox units, +/-)
  dashed?: boolean; // base line dashed (optional/secondary link)
  color?: string; // hex stroke when active
};

export type FlowStep = {
  node: string; // node id to spotlight
  paths: string[]; // edge ids to animate
  text: string; // narrative line
};

export type FlowScenario = {
  id: string;
  name: string; // button label
  command: string; // monospace "command" shown in the info bar
  steps: FlowStep[];
};

export type AnimatedFlowProps = {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  flows: FlowScenario[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PALETTE = [
  "#22d3ee",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
];

const VB_W = 1000;
const VB_H = 500;

function edgePath(nodes: FlowNode[], e: FlowEdge): string {
  const a = nodes.find((n) => n.id === e.from);
  const b = nodes.find((n) => n.id === e.to);
  if (!a || !b) return "";
  const x1 = (a.x / 100) * VB_W;
  const y1 = (a.y / 100) * VB_H;
  const x2 = (b.x / 100) * VB_W;
  const y2 = (b.y / 100) * VB_H;
  const bend = e.bend ?? 0;
  if (bend === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 + (-dy / len) * bend;
  const cy = (y1 + y2) / 2 + (dx / len) * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AnimatedFlow({ title, nodes, edges, flows }: AnimatedFlowProps) {
  const [flowId, setFlowId] = useState(flows[0]?.id ?? "");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2600);
  const [selected, setSelected] = useState(flows[0]?.steps[0]?.node ?? "");

  const flow = useMemo(
    () => flows.find((f) => f.id === flowId) ?? flows[0],
    [flows, flowId]
  );

  useEffect(() => {
    if (!playing || !flow) return;
    const t = setTimeout(() => {
      const next = (step + 1) % flow.steps.length;
      setStep(next);
      setSelected(flow.steps[next].node);
    }, speed);
    return () => clearTimeout(t);
  }, [playing, step, flow, speed]);

  const activePaths = flow?.steps[step]?.paths ?? [];

  const pickFlow = (id: string) => {
    const f = flows.find((x) => x.id === id);
    if (!f) return;
    setFlowId(id);
    setStep(0);
    setPlaying(true);
    setSelected(f.steps[0].node);
  };

  const move = (dir: 1 | -1) => {
    if (!flow) return;
    const n = (step + dir + flow.steps.length) % flow.steps.length;
    setStep(n);
    setSelected(flow.steps[n].node);
  };

  const edgeColor = (e: FlowEdge, i: number) => e.color ?? PALETTE[i % PALETTE.length];

  if (!flow) return null;

  return (
    <div className="my-6 rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-900/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <span className="text-base">⚡</span>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              {title}
            </div>
            <div className="text-[10px] text-slate-500">
              live diagram · pick a scenario below · click any node
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] bg-slate-900/70 px-2.5 py-1 rounded-full border border-slate-800/70 font-mono text-orange-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
          </span>
          SIMULATING
        </div>
      </div>

      {/* canvas */}
      <div className="relative h-[340px] sm:h-[400px] mx-2 mt-2">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <filter id="af-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* base edges */}
          {edges.map((e) => (
            <path
              key={e.id}
              d={edgePath(nodes, e)}
              stroke="#1e293b"
              strokeWidth={2}
              strokeDasharray={e.dashed ? "5 5" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* active edges */}
          {edges.map((e, i) =>
            activePaths.includes(e.id) ? (
              <path
                key={`a-${e.id}`}
                d={edgePath(nodes, e)}
                stroke={edgeColor(e, i)}
                strokeWidth={3.5}
                filter="url(#af-glow)"
                strokeDasharray="10 7"
                vectorEffect="non-scaling-stroke"
                style={{ animation: "afdash 1s linear infinite" }}
              />
            ) : null
          )}
        </svg>

        {/* nodes */}
        {nodes.map((n) => {
          const active = selected === n.id;
          const accent = n.color ?? "#fb923c";
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelected(n.id)}
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: "translate(-50%, -50%)",
                borderColor: active ? accent : undefined,
                boxShadow: active ? `0 0 28px -6px ${accent}99` : undefined,
                background: active
                  ? `linear-gradient(180deg, ${accent}24, rgba(2,6,23,0.92))`
                  : undefined,
              }}
              className={`absolute z-10 w-28 sm:w-32 px-2 py-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer flex flex-col items-center gap-1 ${
                active
                  ? "scale-105"
                  : "bg-slate-900/70 border-slate-800/80 hover:border-slate-600/80"
              }`}
            >
              <span className="text-lg leading-none">{n.icon}</span>
              <span className="text-[11px] font-bold text-slate-100 leading-tight">
                {n.label}
              </span>
              {n.sub && (
                <span className="text-[9px] text-slate-500 font-mono leading-tight">
                  {n.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* narrative bar */}
      <div className="mx-3 mb-3 mt-1 p-3 bg-slate-950/80 border border-slate-900/80 rounded-xl flex flex-col md:flex-row md:items-center gap-2.5">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-slate-800/90 text-[9px] text-orange-300 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              scenario
            </span>
            <span className="text-[11px] font-mono text-slate-200 font-bold bg-slate-900 px-2 py-0.5 rounded truncate">
              {flow.command}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {flow.steps[step]?.text}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800/70 text-[11px] font-mono text-slate-400 self-start md:self-auto whitespace-nowrap">
          step <span className="text-orange-300 font-bold mx-1">{step + 1}</span>/{" "}
          {flow.steps.length}
        </div>
      </div>

      {/* controls */}
      <div className="px-3 pb-4 flex flex-col gap-3 items-center border-t border-slate-900/70 pt-3">
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {flows.map((f) => {
            const on = f.id === flow.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => pickFlow(f.id)}
                style={
                  on
                    ? { background: "linear-gradient(90deg,#f97316,#fbbf24)" }
                    : undefined
                }
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                  on
                    ? "text-slate-950 border-transparent shadow-lg shadow-orange-500/10"
                    : "bg-slate-900/40 border-slate-800/70 text-slate-400 hover:text-slate-100 hover:border-slate-600/70"
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => move(-1)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800/80 rounded-lg transition"
            title="Step back"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 border ${
              playing
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {playing ? (
              <>
                <span className="h-1.5 w-1.5 bg-amber-400 rounded-[2px]" />
                pause
              </>
            ) : (
              <>
                <span className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-emerald-400" />
                play
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => move(1)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800/80 rounded-lg transition"
            title="Step forward"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="w-px h-4 bg-slate-800" />

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800/80 rounded-lg text-slate-300 font-mono text-[10px] px-2 py-1 focus:outline-none"
          >
            <option value={4000}>slow</option>
            <option value={2600}>normal</option>
            <option value={1400}>fast</option>
          </select>
        </div>
      </div>

      <style>{`
        @keyframes afdash {
          to { stroke-dashoffset: -34; }
        }
      `}</style>
    </div>
  );
}
