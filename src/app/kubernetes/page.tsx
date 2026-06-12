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
      { id: "fundamentals", icon: "☸️", name: "Kubernetes Fundamentals", desc: "Why orchestration matters: the container-at-scale problem drawn. The cluster architecture box by box — control plane + worker nodes — and the desired-state reconciliation loop that makes Kubernetes work.", meta: "9 sections · start here ⭐", href: "/kubernetes/fundamentals", available: true },
      { id: "pods", icon: "📦", name: "Pods", desc: "The smallest deployable unit: pod vs container drawn, lifecycle phases from Pending to CrashLoopBackOff, multi-container patterns (sidecar, init containers), and the debugging trio: describe, logs, exec.", meta: "8 sections · building block", href: "/kubernetes/pods", available: true },
    ],
  },
  {
    title: "Workloads & Traffic",
    emoji: "🚀",
    items: [
      { id: "workloads", icon: "🚀", name: "Deployments & Workloads", desc: "ReplicaSet reconciliation (kill a pod, watch it return), Deployment → ReplicaSet → Pods ownership, rolling updates drawn step-by-step, DaemonSets, Jobs, CronJobs, and the workload chooser flowchart.", meta: "9 sections · zero downtime ⭐", href: "/kubernetes/workloads", available: true },
      { id: "services", icon: "🌐", name: "Services & Networking", desc: "The problem: pod IPs are ephemeral. Service = stable VIP + label selector. ClusterIP vs NodePort vs LoadBalancer drawn, CoreDNS resolution, and the service-not-working debug flowchart.", meta: "10 sections · stable routing ⭐", href: "/kubernetes/services", available: true },
      { id: "ingress", icon: "🚪", name: "Ingress", desc: "One cloud load balancer, many services: Ingress solves the cost problem. Controller vs resource distinction (huge gotcha!), host-based and path-based routing, TLS termination, and the Gateway API future.", meta: "8 sections · one door in", href: "/kubernetes/ingress", available: true },
    ],
  },
  {
    title: "Config & State",
    emoji: "⚙️",
    items: [
      { id: "config-secrets", icon: "🔧", name: "ConfigMaps & Secrets", desc: "12-factor config: same image, dev to prod. ConfigMaps vs Secrets, env vars vs volume files (one freezes, one hot-updates), base64 is NOT encryption (drawn), and external-secrets for real protection.", meta: "9 sections · config out of images", href: "/kubernetes/config-secrets", available: true },
      { id: "storage", icon: "💾", name: "Storage & StatefulSets", desc: "Volumes, PersistentVolumes, PersistentVolumeClaims — the 3-layer storage model drawn. StatefulSets for stable identities, volumeClaimTemplates, and the database-on-k8s debate.", meta: "9 sections · stateful apps", href: "/kubernetes/storage", available: true },
    ],
  },
  {
    title: "Reliability & Scale",
    emoji: "📈",
    items: [
      { id: "scheduling-health", icon: "🩺", name: "Scheduling & Health", desc: "How the scheduler picks nodes (resources, affinity, taints/tolerations), liveness vs readiness probes drawn (one restarts, one removes from endpoints), and resource requests/limits that prevent OOMKill.", meta: "10 sections · keep it running", href: "/kubernetes/scheduling-health", available: true },
      { id: "autoscaling", icon: "📈", name: "Autoscaling", desc: "HPA: scale pods by CPU/memory/custom metrics. VPA: right-size requests. Cluster Autoscaler: add nodes when pods are pending. The full autoscaling pyramid drawn, plus when NOT to autoscale.", meta: "8 sections · elastic workloads", href: "/kubernetes/autoscaling", available: true },
    ],
  },
  {
    title: "Security & Packaging",
    emoji: "🛡️",
    items: [
      { id: "rbac-security", icon: "🔐", name: "RBAC & Security", desc: "Who can do what: ServiceAccounts, Roles, ClusterRoles, RoleBindings — the full RBAC matrix. Pod Security Standards, NetworkPolicies as firewall rules, and the principle of least privilege enforced.", meta: "10 sections · lock it down ⭐", href: "/kubernetes/rbac-security", available: true },
      { id: "helm", icon: "⎈", name: "Helm", desc: "The Kubernetes package manager: charts, templates, values.yaml parameterization. Install complex apps with one command, upgrade/rollback history, and when to use Helm vs raw manifests.", meta: "8 sections · template once, deploy many", href: "/kubernetes/helm", available: true },
    ],
  },
  {
    title: "Production",
    emoji: "🏭",
    items: [
      { id: "production", icon: "🏭", name: "Production Best Practices", desc: "The full production checklist: namespaces for isolation, resource quotas, LimitRanges, logging with sidecar aggregators, monitoring (Prometheus + Grafana), GitOps (ArgoCD/Flux), multi-cluster strategies, and the upgrade playbook.", meta: "11 sections · run it for real ⭐", href: "/kubernetes/production", available: true },
    ],
  },
];

export default function KubernetesPage() {
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
          <span className="font-semibold text-slate-300">Kubernetes</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(96,165,250,0.5)]"
          >
            ☸️
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Kubernetes</span> — container orchestration, end to end
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From the cluster architecture to production-ready deployments: pods, services, ingress, config, storage, RBAC, Helm and autoscaling — {total} topics that build on each other, drawn box by box.
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
          {["🧠 Architecture", "📦 Pods", "🚀 Workloads", "🌐 Networking", "⚙️ Config & Storage", "🛡️ Security", "📈 Scale", "🏭 Production"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-sky-400">→</span>}
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
                        ? "cursor-pointer border-sky-700/50 hover:shadow-[0_0_50px_-15px_rgba(96,165,250,0.6)]"
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
