"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ───────────────────────── inline SVG icons ───────────────────────── */

const ClientIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DaemonIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RegistryIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const ContainerIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const NetworkIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const VolumeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

/* ───────────────────────── diagram geometry ───────────────────────── */

type NodeId = "client" | "daemon" | "registry" | "images" | "containers" | "networks" | "volumes";

const NODES: { id: NodeId; label: string; sub: string; x: number; y: number; icon: () => React.ReactElement }[] = [
  { id: "client", label: "Client", sub: "docker CLI", x: 13, y: 16, icon: ClientIcon },
  { id: "daemon", label: "Daemon", sub: "dockerd", x: 50, y: 16, icon: DaemonIcon },
  { id: "registry", label: "Registry", sub: "Docker Hub", x: 87, y: 16, icon: RegistryIcon },
  { id: "images", label: "Images", sub: "local store", x: 28, y: 55, icon: ImageIcon },
  { id: "containers", label: "Containers", sub: "processes", x: 72, y: 55, icon: ContainerIcon },
  { id: "networks", label: "Networks", sub: "ports · DNS", x: 50, y: 89, icon: NetworkIcon },
  { id: "volumes", label: "Volumes", sub: "persistent data", x: 87, y: 89, icon: VolumeIcon },
];

const PATHS: Record<string, [NodeId, NodeId]> = {
  "client-to-daemon": ["client", "daemon"],
  "daemon-to-registry": ["daemon", "registry"],
  "daemon-to-images": ["daemon", "images"],
  "registry-to-images": ["registry", "images"],
  "images-to-containers": ["images", "containers"],
  "containers-to-networks": ["containers", "networks"],
  "containers-to-volumes": ["containers", "volumes"],
};

/* ───────────────────────── workflow scripts ───────────────────────── */

type Step = { node: NodeId; highlightPaths: string[]; narrative: string; logs: string[] };
type Workflow = { name: string; command: string; description: string; steps: Step[] };

const WORKFLOWS: Record<string, Workflow> = {
  build: {
    name: "docker build",
    command: "docker build -t custom-app:v1 .",
    description: "Compile local source code + Dockerfile instructions into an immutable image.",
    steps: [
      {
        node: "client",
        highlightPaths: ["client-to-daemon"],
        narrative: "Client collects the local build context (source code, files) and transfers it to the Docker daemon.",
        logs: ["Sending build context to Docker daemon  3.52MB", "Step 1/4 : FROM python:3.12-slim"],
      },
      {
        node: "daemon",
        highlightPaths: ["client-to-daemon", "daemon-to-images"],
        narrative: "Daemon executes the Dockerfile top to bottom — each instruction runs in a temp container and becomes a layer.",
        logs: [" ---> Running in temporary build container", "Step 2/4 : WORKDIR /app", "Step 3/4 : COPY requirements.txt .", "Step 4/4 : RUN pip install -r requirements.txt"],
      },
      {
        node: "images",
        highlightPaths: ["daemon-to-images"],
        narrative: "Daemon stacks the final layers, assigns the tag custom-app:v1, and commits it to the local image store.",
        logs: ["Successfully built 4f23b2dc9c8c", "Successfully tagged custom-app:v1", "Image stored in local repository"],
      },
    ],
  },
  pull: {
    name: "docker pull",
    command: "docker pull redis:alpine",
    description: "Retrieve a pre-built image from a registry and save it to the local store.",
    steps: [
      {
        node: "client",
        highlightPaths: ["client-to-daemon"],
        narrative: "Client issues a pull request with repository + tag details to the daemon's API.",
        logs: ["Using default tag: alpine", "Pulling from library/redis"],
      },
      {
        node: "daemon",
        highlightPaths: ["client-to-daemon", "daemon-to-registry"],
        narrative: "Daemon checks the local store first — layers missing, so it negotiates with the registry endpoint.",
        logs: ["Checking local image store... not found", "Connecting to registry-1.docker.io"],
      },
      {
        node: "registry",
        highlightPaths: ["daemon-to-registry", "registry-to-images"],
        narrative: "Registry resolves the manifest and streams each missing layer over HTTPS — layer by layer, in parallel.",
        logs: ["59bf1c3509f3: Pulling fs layer", "8ed0db824147: Downloading [=======>      ]  1.2MB/3.4MB", "b129dd9427ad: Download complete"],
      },
      {
        node: "images",
        highlightPaths: ["registry-to-images"],
        narrative: "Daemon verifies each layer's checksum, extracts them, and the image lands in the local store — ready to run.",
        logs: ["Digest: sha256:4b4fcfae69e8b...", "Status: Downloaded newer image for redis:alpine"],
      },
    ],
  },
  run: {
    name: "docker run",
    command: "docker run -d -p 8080:80 -v web_data:/usr/share/nginx/html nginx:alpine",
    description: "Instantiate a container from an image with isolated filesystem, network and storage.",
    steps: [
      {
        node: "client",
        highlightPaths: ["client-to-daemon"],
        narrative: "Client parses your flags — detach, port binding, volume mount — and sends the run request to the daemon.",
        logs: ["Parsing options: -d · port 8080->80 · volume web_data"],
      },
      {
        node: "daemon",
        highlightPaths: ["client-to-daemon", "daemon-to-images"],
        narrative: "Daemon looks up the image in the local store. Found — so no pull needed; it prepares the container config.",
        logs: ['Local image "nginx:alpine" found — skipping pull', "Creating container metadata + writable layer"],
      },
      {
        node: "containers",
        highlightPaths: ["images-to-containers"],
        narrative: "Daemon creates the container: the image's read-only layers + a fresh writable layer, isolated in its own namespaces.",
        logs: ["Allocated container ID: 8ac3e70d49f1", "Starting main process: nginx"],
      },
      {
        node: "networks",
        highlightPaths: ["containers-to-networks"],
        narrative: "Network wiring: the container joins a bridge network and host port 8080 is forwarded to container port 80.",
        logs: ["Binding 0.0.0.0:8080 -> container port 80", "Attached to bridge network"],
      },
      {
        node: "volumes",
        highlightPaths: ["containers-to-volumes"],
        narrative: "The named volume web_data is mounted into the filesystem — data written there will outlive the container.",
        logs: ['Mounting volume "web_data" -> /usr/share/nginx/html', "Container is up — serving on :8080 ✓"],
      },
    ],
  },
  compose: {
    name: "docker compose up",
    command: "docker compose up -d",
    description: "Orchestrate a whole multi-container stack declared in one compose.yaml.",
    steps: [
      {
        node: "client",
        highlightPaths: ["client-to-daemon"],
        narrative: "Compose parses compose.yaml, substitutes variables from .env, and sends the desired state to the daemon.",
        logs: ["Parsing compose.yaml — services: api, db", "Substituting variables from .env"],
      },
      {
        node: "daemon",
        highlightPaths: ["client-to-daemon", "daemon-to-images"],
        narrative: "Daemon diffs desired state vs reality: which images to build or pull, which containers need (re)creating.",
        logs: ["Service db: image postgres:16 found locally", "Service api: build . → cache hit on 4/5 layers"],
      },
      {
        node: "networks",
        highlightPaths: ["containers-to-networks"],
        narrative: "The project network is created first — every service joins it and becomes resolvable BY NAME (api, db).",
        logs: ["✔ Network myapp_default  Created"],
      },
      {
        node: "volumes",
        highlightPaths: ["containers-to-volumes"],
        narrative: "Declared named volumes are created (or reused from last time) so data survives any container.",
        logs: ["✔ Volume myapp_dbdata  Created"],
      },
      {
        node: "containers",
        highlightPaths: ["images-to-containers", "containers-to-networks", "containers-to-volumes"],
        narrative: "Containers start in dependency order — healthchecks gate dependents until services are actually ready.",
        logs: ["✔ Container myapp-db-1   Healthy", "✔ Container myapp-api-1  Started", "Stack is up 🎉"],
      },
    ],
  },
  push: {
    name: "docker push",
    command: "docker push deelaksha/myapp:1.0",
    description: "Upload a locally built image's layers to a registry so any server can pull and run it.",
    steps: [
      {
        node: "client",
        highlightPaths: ["client-to-daemon"],
        narrative: "Client asks the daemon to push the tagged image to its registry repository.",
        logs: ["The push refers to repository [docker.io/deelaksha/myapp]"],
      },
      {
        node: "images",
        highlightPaths: ["daemon-to-images"],
        narrative: "Daemon reads the image's layer stack from the local store and computes each layer's digest.",
        logs: ["Preparing 5 layers...", "5f70bf18a086: Preparing"],
      },
      {
        node: "daemon",
        highlightPaths: ["daemon-to-images", "daemon-to-registry"],
        narrative: "Daemon negotiates with the registry: which layers are missing? Base layers it already knows are skipped.",
        logs: ["a3ed95caeb02: Mounted from library/python  ← dedup!", "e2eb06d8af82: Layer already exists"],
      },
      {
        node: "registry",
        highlightPaths: ["daemon-to-registry"],
        narrative: "Only the new layers upload. The registry stores them content-addressed and records the tag → digest mapping.",
        logs: ["5f70bf18a086: Pushed", "1.0: digest: sha256:9b8e7f6a... size: 1573", "Any server can now docker pull it ✓"],
      },
    ],
  },
};

type WorkflowKey = keyof typeof WORKFLOWS;

/* ───────────────────────── the component ───────────────────────── */

export function DockerFlow({ initial = "run" }: { initial?: WorkflowKey }) {
  const [wfKey, setWfKey] = useState<WorkflowKey>(initial);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  const wf = WORKFLOWS[wfKey];
  const step = wf.steps[idx];
  const logs = wf.steps.slice(0, idx + 1).flatMap((s) => s.logs);

  /* auto-advance */
  useEffect(() => {
    if (!playing) return;
    if (idx >= wf.steps.length - 1) {
      const t = setTimeout(() => setPlaying(false), 3200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 3200);
    return () => clearTimeout(t);
  }, [playing, idx, wf]);

  /* keep the terminal scrolled to the latest line */
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logs.length]);

  const selectWorkflow = (k: WorkflowKey) => {
    setWfKey(k);
    setIdx(0);
    setPlaying(true);
  };

  const nodeOf = (id: NodeId) => NODES.find((n) => n.id === id)!;
  const visited = new Set(wf.steps.slice(0, idx + 1).map((s) => s.node));

  return (
    <div className="glass my-5 overflow-hidden rounded-2xl border border-cyan-900/40">
      {/* header: workflow tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3">
        <span className="mr-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          🐳 watch it travel
        </span>
        {(Object.keys(WORKFLOWS) as WorkflowKey[]).map((k) => (
          <button
            key={k}
            onClick={() => selectWorkflow(k)}
            className={`code-font rounded-full border px-3 py-1 text-[11px] transition ${
              k === wfKey
                ? "border-cyan-500/60 bg-cyan-950/60 text-cyan-300"
                : "border-slate-700/60 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {WORKFLOWS[k].name}
          </button>
        ))}
      </div>

      {/* command + description */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-2.5">
        <div className="code-font text-[12px] text-emerald-300">
          <span className="text-slate-500">$ </span>
          {wf.command}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{wf.description}</p>
      </div>

      {/* diagram */}
      <div className="relative h-[300px] w-full sm:h-[340px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* base lines */}
          {Object.entries(PATHS).map(([id, [a, b]]) => {
            const n1 = nodeOf(a);
            const n2 = nodeOf(b);
            return (
              <line
                key={id}
                x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                stroke="rgba(148,163,184,0.18)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {/* active lines + travelling packets */}
          <AnimatePresence>
            {step.highlightPaths.map((id) => {
              const pair = PATHS[id];
              if (!pair) return null;
              const n1 = nodeOf(pair[0]);
              const n2 = nodeOf(pair[1]);
              return (
                <motion.g key={`${wfKey}-${idx}-${id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* glow */}
                  <line
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke="rgba(34,211,238,0.25)" strokeWidth={6}
                    vectorEffect="non-scaling-stroke" strokeLinecap="round"
                  />
                  {/* animated dashes */}
                  <motion.line
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke="#22d3ee" strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2.5 2.5"
                    animate={{ strokeDashoffset: [0, -10] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  {/* travelling packet */}
                  <motion.circle
                    r={1.4}
                    fill="#67e8f9"
                    initial={{ cx: n1.x, cy: n1.y }}
                    animate={{ cx: [n1.x, n2.x], cy: [n1.y, n2.y] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* nodes */}
        {NODES.map((n) => {
          const isActive = step.node === n.id;
          const wasVisited = visited.has(n.id);
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={`flex flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 backdrop-blur-sm transition-colors sm:px-3.5 sm:py-2 ${
                  isActive
                    ? "border-cyan-400/80 bg-cyan-950/80 text-cyan-300 shadow-[0_0_28px_-4px_rgba(34,211,238,0.7)]"
                    : wasVisited
                    ? "border-cyan-900/60 bg-slate-900/85 text-cyan-600"
                    : "border-slate-700/60 bg-slate-900/85 text-slate-500"
                }`}
              >
                <Icon />
                <span className={`text-[10px] font-bold sm:text-[11px] ${isActive ? "text-cyan-200" : "text-slate-300"}`}>
                  {n.label}
                </span>
                <span className="code-font hidden text-[9px] text-slate-500 sm:block">{n.sub}</span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* narrative + controls */}
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <button
              onClick={() => { setIdx(0); setPlaying(true); }}
              className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500"
              title="Replay"
            >
              ↺
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rounded-lg border border-cyan-700/60 bg-cyan-950/60 px-2 py-1 text-xs text-cyan-300 transition hover:border-cyan-500"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => { setPlaying(false); setIdx((i) => Math.min(i + 1, wf.steps.length - 1)); }}
              className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500"
              title="Next step"
            >
              ⏭
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${wfKey}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="min-h-[2.5rem] flex-1 text-xs leading-relaxed text-slate-300"
            >
              <span className="code-font mr-2 rounded bg-cyan-950/70 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                {idx + 1}/{wf.steps.length}
              </span>
              {step.narrative}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* step dots */}
        <div className="mt-2.5 flex items-center gap-1.5 pl-1">
          {wf.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPlaying(false); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-cyan-400" : i < idx ? "w-1.5 bg-cyan-800" : "w-1.5 bg-slate-700"
              }`}
              aria-label={`step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* terminal log */}
      <div className="border-t border-slate-800 bg-[#0a0e14]">
        <div className="flex items-center gap-1.5 px-4 pt-2.5">
          <span className="h-2 w-2 rounded-full bg-rose-500/70" />
          <span className="h-2 w-2 rounded-full bg-amber-500/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
          <span className="code-font ml-2 text-[10px] text-slate-600">daemon output</span>
        </div>
        <div ref={logRef} className="code-font max-h-28 overflow-y-auto px-4 pb-3 pt-1.5 text-[11px] leading-relaxed">
          {logs.map((line, i) => (
            <motion.div
              key={`${wfKey}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i === logs.length - 1 ? 0.15 : 0 }}
              className={line.startsWith("✔") || line.includes("Success") || line.includes("✓") ? "text-emerald-300" : "text-slate-400"}
            >
              {line}
            </motion.div>
          ))}
          <span className="caret text-cyan-400">▌</span>
        </div>
      </div>
    </div>
  );
}
