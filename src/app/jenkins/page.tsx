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
      { id: "fundamentals", icon: "🎩", name: "CI/CD & Jenkins Fundamentals", desc: "Life before CI drawn as integration hell, what Continuous Integration / Delivery / Deployment each mean, what Jenkins is (the butler analogy), controller + agent architecture, and Jenkins vs GitHub Actions vs GitLab CI.", meta: "10 sections · start here ⭐", href: "/jenkins/fundamentals", available: true },
      { id: "installation", icon: "🛠️", name: "Install & First Run", desc: "Run Jenkins with Docker, the unlock ritual, suggested plugins, UI tour drawn (dashboard → job → build → console), JENKINS_HOME anatomy, backup basics, and alternative install methods.", meta: "9 sections · get it running ⭐", href: "/jenkins/installation", available: true },
    ],
  },
  {
    title: "Building Blocks",
    emoji: "🧱",
    items: [
      { id: "freestyle-jobs", icon: "🧱", name: "Freestyle Jobs", desc: "Create your first job click by click, what a BUILD actually is (workspace checkout → steps → status drawn), triggers compared (manual, cron, poll SCM, webhook), build steps, environment variables, artifacts, and why freestyle doesn&apos;t scale.", meta: "10 sections · first build ⭐", href: "/jenkins/freestyle-jobs", available: true },
      { id: "pipelines", icon: "📜", name: "Pipelines as Code", desc: "Why pipeline-as-code (Jenkinsfile lives in git), declarative skeleton dissected line by line, post conditions, environment & credentials, parameters, when {} conditionals, stage view visualization, scripted vs declarative, replay & restart.", meta: "10 sections · the real Jenkins ⭐", href: "/jenkins/pipelines", available: true },
    ],
  },
  {
    title: "Scaling Out",
    emoji: "⚡",
    items: [
      { id: "agents-distributed", icon: "🤖", name: "Agents & Distributed Builds", desc: "Controller vs agent architecture drawn, why distribute builds (parallelism, isolation, tooling), agent types (permanent, cloud, Docker), labels & executors, pipeline agent directives, and dynamic agent provisioning.", meta: "9 sections · scale horizontally", href: "/jenkins/agents-distributed", available: true },
      { id: "integrations", icon: "🔌", name: "Integrations & Plugins", desc: "The plugin ecosystem explored, essential plugins (Git, Pipeline, Docker, Credentials), GitHub webhooks, Slack/email notifications, artifact archiving to Nexus/Artifactory, SonarQube code quality gates, and the plugin manager.", meta: "9 sections · connect everything", href: "/jenkins/integrations", available: true },
    ],
  },
  {
    title: "Production",
    emoji: "🚀",
    items: [
      { id: "credentials-security", icon: "🔐", name: "Credentials & Security", desc: "Credentials plugin deep dive (username/password, SSH keys, secret text, certificates), credential scopes & binding, role-based access control (RBAC), matrix authorization, script approval, audit trails with CloudBees, and security best practices.", meta: "9 sections · lock it down ⭐", href: "/jenkins/credentials-security", available: true },
      { id: "production-cicd", icon: "🚀", name: "Production CI/CD Patterns", desc: "Multi-branch pipelines (auto-discover branches), shared libraries (reusable pipeline code), deployment patterns (blue-green, canary, rolling), environment promotion (dev → staging → prod), rollback strategies, monitoring builds, and backup/disaster recovery.", meta: "10 sections · production ready ⭐", href: "/jenkins/production-cicd", available: true },
    ],
  },
];

export default function JenkinsPage() {
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
          <span className="font-semibold text-slate-300">Jenkins</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(248,113,113,0.5)]"
          >
            🎩
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Jenkins</span> — CI/CD automation end to end
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;what is Continuous Integration?&quot; to production pipelines-as-code: every Jenkins concept drawn box by box — freestyle jobs, Jenkinsfiles, distributed agents, credentials, webhooks and deployment patterns — {total} topics that build the automation butler who tests, builds and ships your code 24/7.
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
          {["🧠 CI/CD concepts", "🛠️ Install", "🧱 Jobs", "📜 Pipelines", "🤖 Agents", "🔌 Integrations", "🔐 Security", "🚀 Production"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-rose-400">→</span>}
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
                        ? "cursor-pointer border-rose-700/50 hover:shadow-[0_0_50px_-15px_rgba(248,113,113,0.6)]"
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
                        <span className="text-sm font-bold text-rose-400">Open →</span>
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
