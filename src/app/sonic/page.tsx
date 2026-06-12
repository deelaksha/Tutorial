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
      { id: "fundamentals", icon: "🦔", name: "SONiC Architecture & Containers", desc: "What SONiC is and why Microsoft open-sourced it, the container fleet (swss, syncd, bgp, mgmt-framework…) drawn box by box, the DB-centric design where daemons never talk directly, SAI, and the full User → CLI/REST/gNMI → Redis → Orchagent → ASIC journey animated.", meta: "11 sections · start here ⭐", href: "/sonic/fundamentals", available: true },
      { id: "databases", icon: "🗄️", name: "Redis Databases — The Nervous System", desc: "All six databases decoded: CONFIG_DB(4), APPL_DB(0), ASIC_DB(1), COUNTERS_DB(2), FLEX_COUNTER_DB(5), STATE_DB(6) — purpose, producer, consumer, key separators (| vs :), real redis-cli sessions on PORT|Ethernet0, and the config→appl→asic cascade.", meta: "15 sections · know your numbers ⭐", href: "/sonic/databases", available: true },
      { id: "mgmt-overview", icon: "🧭", name: "Management Framework Overview", desc: "The three northbound doors — RESTCONF, gNMI and KLISH CLI — and how all of them converge on one YANG-driven brain. Real curl PATCHes, the request lifecycle REST → Translib → Transformer → CVL → Redis animated stage by stage.", meta: "16 sections · the northbound door ⭐", href: "/sonic/mgmt-overview", available: true },
      { id: "mgmt-common", icon: "📦", name: "mgmt-common Deep Dive", desc: "Anatomy of sonic-mgmt-common: /models/yang, /translib, /cvl, /transformer, /tools — folder by folder with real Go entry points (translib.Update), app registration, the ygot build pipeline and the complete SET call stack.", meta: "12 sections · the brain dissected", href: "/sonic/mgmt-common", available: true },
    ],
  },
  {
    title: "Data Models",
    emoji: "🌳",
    items: [
      { id: "yang", icon: "🌳", name: "YANG Fundamentals", desc: "From zero: modules, containers, lists & keys, leaves & types, leaf-list, choice/case, grouping, augment, deviation, must/when/leafref — every construct as a snippet plus a pyang-style tree, ending with a write-your-own-model lab.", meta: "12 sections · model everything ⭐", href: "/sonic/yang", available: true },
      { id: "openconfig", icon: "🌐", name: "OpenConfig YANG", desc: "The vendor-neutral northbound: config/state split, why SONiC adopted it, and the mapping tables that matter — interfaces, VLAN, NTP, DNS, AAA, BGP paths traced to their exact CONFIG_DB tables, with value transforms like enabled→admin_status.", meta: "13 sections · one model, any vendor", href: "/sonic/openconfig", available: true },
      { id: "sonic-yang", icon: "🟦", name: "SONiC YANG", desc: "The native models that mirror Redis 1:1 — container = table, list key = redis key, leaf = hash field. sonic-port, sonic-vlan, sonic-interface and sonic-ntp walked side by side with their live CONFIG_DB entries, plus the leafrefs that power CVL.", meta: "12 sections · the DB schema", href: "/sonic/sonic-yang", available: true },
    ],
  },
  {
    title: "The Translation Engine",
    emoji: "🔁",
    items: [
      { id: "cvl", icon: "🛡️", name: "CVL — Validation Engine", desc: "The gatekeeper of CONFIG_DB: ValidateEditConfig dissected, the three gates (syntax, semantic must/when, leafref dependency against live Redis), every CVL error code, and crafting invalid payloads to watch each gate slam shut.", meta: "12 sections · nothing bad gets in", href: "/sonic/cvl", available: true },
      { id: "transformer", icon: "🔁", name: "Transformer", desc: "OpenConfig ⇄ Redis translation without hand-written apps: YangToDb and DbToYang flows, the callback taxonomy — key, field, table and subtree transformers — with real Go signatures, XlateFuncBind registration and a full NTP PATCH traced into a dbmap.", meta: "14 sections · the magic engine ⭐", href: "/sonic/transformer", available: true },
      { id: "annotations", icon: "📝", name: "Annotation Files", desc: "How the generic engine learns where every OC node lives: deviation files with sonic-ext:table-name, key-transformer, field-name (and the NULL trick), subtree-transformer and db-name — a full NTP annotation file as centerpiece.", meta: "12 sections · the wiring", href: "/sonic/annotations", available: true },
      { id: "translib", icon: "📚", name: "Translib", desc: "The request orchestrator: Create/Update/Replace/Delete/Get/Subscribe APIs, the two-phase translate→validate→process design, app registry, the db layer with MULTI/EXEC transactions, and ASCII sequence diagrams for every CRUD verb.", meta: "14 sections · CRUD end to end", href: "/sonic/translib", available: true },
    ],
  },
  {
    title: "South of CONFIG_DB",
    emoji: "🛠️",
    items: [
      { id: "host-services", icon: "🛠️", name: "Host Services & hostcfgd", desc: "The bridge from Redis to Linux daemons: hostcfgd subscriptions, handler classes for NTP, SYSLOG, SNMP, AAA/TACACS, DHCP relay and the FEATURE table — each service's table → template → file → daemon chain drawn.", meta: "14 sections · redis to systemd", href: "/sonic/host-services", available: true },
      { id: "jinja-templates", icon: "🧩", name: "Jinja Template System", desc: "sonic-cfggen and in-process rendering: Jinja2 crash course on SONiC data shapes, then four real templates — chrony.conf.j2, rsyslog.conf.j2, snmp, dhcp_relay — each shown as CONFIG_DB input → template → rendered file, before and after.", meta: "11 sections · config generated", href: "/sonic/jinja-templates", available: true },
    ],
  },
  {
    title: "End to End",
    emoji: "🚀",
    items: [
      { id: "ntp-flow", icon: "⏰", name: "NTP — Complete Feature Flow", desc: "The flagship walkthrough: one PATCH traced through all nine hops — REST → YANG → Translib → Transformer → CVL → CONFIG_DB → hostcfgd → Jinja → chronyd — with the exact artifact at every hop and a failure traced too.", meta: "11 sections · the flagship ⭐", href: "/sonic/ntp-flow", available: true },
      { id: "new-feature", icon: "🏗️", name: "Build a New Feature from Scratch", desc: "The 10-step recipe applied to DNS: write the SONiC YANG, the annotation, the transformer callbacks, CVL constraints, hostcfgd handler, resolv.conf.j2 — every file complete with its repo path, plus testing and a debugging checklist.", meta: "12 sections · ship your own ⭐", href: "/sonic/new-feature", available: true },
      { id: "source-walkthrough", icon: "🗺️", name: "Source Code Walkthrough", desc: "Guided tour of the three repos — sonic-mgmt-common, sonic-mgmt-framework, sonic-host-services — directory trees, the files to read first, call graphs for SET and GET, the build system and a dev workflow that actually iterates fast.", meta: "12 sections · read the code", href: "/sonic/source-walkthrough", available: true },
    ],
  },
  {
    title: "Mastery",
    emoji: "🎓",
    items: [
      { id: "debugging", icon: "🐛", name: "Debugging Masterclass", desc: "The triage ladder: binary-search the pipeline to find where a request died — redis MONITOR, REST status-code decoding, translib/transformer traces, CVL trace flags, gNMI, docker & journalctl — ending in a four-terminal end-to-end trace.", meta: "12 sections · trace anything ⭐", href: "/sonic/debugging", available: true },
      { id: "interview-prep", icon: "🎤", name: "Interview Preparation", desc: "100+ questions across beginner, intermediate, advanced and architect tiers with strong answers, 8 production debugging scenarios, the answer framework (layers → artifacts → flow → debug → trade-offs) and a mock-interview lab.", meta: "10 sections · 100+ questions", href: "/sonic/interview-prep", available: true },
      { id: "case-studies", icon: "📂", name: "Production Case Studies", desc: "Five real changes run down the same spine — add NTP server, DHCP relay, syslog server, TACACS/AAA, and shipping a new OpenConfig feature — each with DB diffs, generated files, verification, a production twist and the rollback.", meta: "11 sections · real changes", href: "/sonic/case-studies", available: true },
    ],
  },
];

export default function SonicPage() {
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
          <span className="font-semibold text-slate-300">SONiC</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(251,191,36,0.5)]"
          >
            🦔
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">SONiC</span> — Management Framework end to end
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;what is SONiC?&quot; to shipping your own feature: every layer drawn live —
              Redis databases, YANG &amp; OpenConfig, CVL, Transformer, Translib, annotations,
              hostcfgd and Jinja — one NTP request traced through all nine hops, then the 10-step
              recipe to build a feature from scratch. {total} topics, every one with real file
              paths, real redis-cli output and real debug commands.
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
          {["🦔 Architecture", "🗄️ Redis DBs", "🌳 YANG", "🔁 Transformer", "🛡️ CVL", "🐍 hostcfgd", "🧩 Jinja", "⏰ NTP e2e", "🏗️ Your feature"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-amber-400">→</span>}
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
                        ? "cursor-pointer border-amber-700/50 hover:shadow-[0_0_50px_-15px_rgba(251,191,36,0.6)]"
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
                        <span className="text-sm font-bold text-amber-400">Open →</span>
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
