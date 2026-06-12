"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Rolling Update — Live",
  nodes: [
    { id: "deploy", icon: "🚀", label: "Deployment", sub: "image: v2", x: 10, y: 50, color: "#a78bfa" },
    { id: "rs-v1", icon: "📋", label: "ReplicaSet v1", sub: "scaling down", x: 32, y: 25, color: "#fbbf24" },
    { id: "rs-v2", icon: "📋", label: "ReplicaSet v2", sub: "scaling up", x: 32, y: 72, color: "#34d399" },
    { id: "pods-old", icon: "📦", label: "Pods v1", sub: "terminating", x: 60, y: 18, color: "#f87171" },
    { id: "pods-new", icon: "📦", label: "Pods v2", sub: "running", x: 60, y: 78, color: "#22d3ee" },
    { id: "users", icon: "👥", label: "Users", sub: "zero downtime", x: 88, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "deploy-v1", from: "deploy", to: "rs-v1", dashed: true, color: "#fbbf24" },
    { id: "deploy-v2", from: "deploy", to: "rs-v2", color: "#34d399" },
    { id: "v1-pods-old", from: "rs-v1", to: "pods-old", dashed: true, color: "#f87171" },
    { id: "v2-pods-new", from: "rs-v2", to: "pods-new", color: "#22d3ee" },
    { id: "old-users", from: "pods-old", to: "users", dashed: true, color: "#60a5fa" },
    { id: "new-users", from: "pods-new", to: "users", color: "#f472b6" },
  ],
  flows: [
    {
      id: "rolling",
      name: "🔄 v1→v2 rolling update",
      command: "kubectl set image deployment/app app=app:v2",
      steps: [
        { node: "deploy", paths: ["deploy-v2"], text: "Deployment spec updated: image v1 → v2. Controller creates NEW ReplicaSet for v2 template. Old RS still has 3 pods running." },
        { node: "rs-v2", paths: ["v2-pods-new"], text: "New RS scales up: 1 v2 pod created, waits for readiness probe to pass. Old RS still at 3. Total: 4 pods (maxSurge)." },
        { node: "pods-old", paths: ["v1-pods-old", "old-users"], text: "v2 pod Ready → old RS scales down: 1 v1 pod terminated. Now 2 v1 + 1 v2 running. Traffic shifts gradually." },
        { node: "users", paths: ["new-users"], text: "Repeat: +1 v2, -1 v1… until 0 v1 + 3 v2. Zero downtime — Service sent traffic to healthy pods throughout. ✅" },
      ],
    },
    {
      id: "stuck",
      name: "❌ v2 crashloops → rollout stuck",
      command: "kubectl rollout status / undo",
      steps: [
        { node: "rs-v2", paths: ["v2-pods-new"], text: "v2 pods start, immediately crash (missing env var). CrashLoopBackOff. Readiness probe never passes." },
        { node: "deploy", paths: ["deploy-v2"], text: "Rollout STUCK: can't scale down v1 until v2 is Ready (progressDeadlineSeconds: 600s = 10min). kubectl rollout status shows waiting." },
        { node: "deploy", paths: ["deploy-v1"], text: "kubectl rollout undo deployment/app → reverts to v1 template. v2 RS scaled to 0, v1 RS back to 3. App rescued. 🔁" },
      ],
    },
    {
      id: "heal",
      name: "🩹 Pod killed → ReplicaSet heals",
      command: "kubectl delete pod app-abc",
      steps: [
        { node: "pods-new", paths: [], text: "You (or a node crash) kill pod app-abc. ReplicaSet controller notices: DESIRED 3, ACTUAL 2. Gap!" },
        { node: "rs-v2", paths: ["v2-pods-new"], text: "ReplicaSet immediately creates replacement pod app-def. Scheduler assigns it, kubelet starts it. ~10 seconds." },
        { node: "pods-new", paths: ["new-users"], text: "Count restored to 3/3 Running. Reconciliation loop self-healed. This is why you use Deployments, not bare pods. 🩹" },
      ],
    },
  ],
};

const NAV = [
  { id: "replicaset", label: "ReplicaSet Reconciliation ⭐" },
  { id: "deployment", label: "Deployment Ownership Chain ⭐" },
  { id: "rolling-update", label: "Rolling Updates (maxSurge/maxUnavailable)" },
  { id: "rollout-commands", label: "Rollout Commands" },
  { id: "daemonset", label: "DaemonSet — One Per Node" },
  { id: "job-cronjob", label: "Job & CronJob" },
  { id: "statefulset", label: "StatefulSet (stable names)" },
  { id: "workload-chooser", label: "Workload Chooser Table ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sWorkloadsPage() {
  return (
    <TopicShell
      icon="🚀"
      title="Deployments & Workloads"
      gradientWord="Workloads"
      subtitle="ReplicaSet reconciliation (kill a pod, watch it return), the Deployment → ReplicaSet → Pods ownership chain, rolling updates drawn step-by-step with maxSurge/maxUnavailable, DaemonSets, Jobs, CronJobs, and the workload chooser flowchart."
      nav={NAV}
      badges={["🔄 Rolling updates", "🩹 Self-healing", "📊 Workload types"]}
      next={{ icon: "🌐", label: "Services", href: "/kubernetes/services" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="replicaset" number="01" title="ReplicaSet Reconciliation ⭐">
        <P>
          A <IC>ReplicaSet</IC> ensures N identical pods are always running. If one dies, the ReplicaSet controller creates a replacement. This is the self-healing mechanism.
        </P>
        <CodeBlock
          title="replicaset_job.txt"
          runnable={false}
          code={`REPLICASET CONTROLLER (runs in controller-manager)

┌────────────────────────────────────────────────┐
│ DESIRED state (in etcd)                        │
│   replicas: 3                                  │
│   selector: app=nginx                          │
└────────┬───────────────────────────────────────┘
         │
         ▼
    ┌────────────────────────┐
    │ count ACTUAL pods      │
    │ with label app=nginx   │  ← asks API server
    └────────┬───────────────┘
             │
             ▼
        ┌─────────┐
        │ DESIRED │   3 vs 2 → create 1 pod
        │    vs   │   3 vs 5 → delete 2 pods
        │ ACTUAL? │   3 vs 3 → do nothing
        └────┬────┘
             │
             ▼ (loop every few seconds)

EXPERIMENT: kill a pod, watch it return
┌────────────────────────────────────────────────┐
│ t=0   3 pods running                           │
│ t=10  you: kubectl delete pod nginx-abc        │
│       pod nginx-abc deleted                    │
│ t=11  controller: desired 3, actual 2 → CREATE │
│ t=12  new pod nginx-def created (Pending)      │
│ t=15  scheduler assigns to node-2              │
│ t=20  kubelet pulls image, starts container    │
│ t=25  nginx-def Running — count back to 3 ✅  │
└────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="replicaset.yaml (you almost never write this by hand)"
          runnable={false}
          code={`apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-rs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx        # "manage all pods with label app=nginx"
  template:             # pod template (same as Pod spec)
    metadata:
      labels:
        app: nginx      # MUST match selector above
    spec:
      containers:
      - name: nginx
        image: nginx:1.25`}
        />
        <Callout type="note">
          📝 You&apos;ll almost never create a ReplicaSet directly — Deployments create them for you. But understanding ReplicaSets is KEY to understanding Deployments.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="deployment" number="02" title="Deployment → ReplicaSet → Pods Ownership Chain ⭐">
        <P>
          A <IC>Deployment</IC> is a higher-level wrapper around ReplicaSet. It manages rolling updates, rollbacks, and history. Here&apos;s the ownership chain:
        </P>
        <CodeBlock
          title="ownership_chain.txt"
          runnable={false}
          code={`YOU create:
┌─────────────────────────┐
│ Deployment nginx        │  (you apply this)
│ replicas: 3             │
│ image: nginx:1.25       │
└──────────┬──────────────┘
           │
           ▼ Deployment controller creates ▼
┌─────────────────────────┐
│ ReplicaSet nginx-7d4f8  │  (auto-created, hash suffix)
│ replicas: 3             │
│ pod template: …         │
└──────────┬──────────────┘
           │
           ▼ ReplicaSet controller creates ▼
┌─────────────────────────┐
│ Pod nginx-7d4f8-abc     │
│ Pod nginx-7d4f8-xyz     │
│ Pod nginx-7d4f8-123     │
└─────────────────────────┘

kubectl get all shows the full chain:
NAME                          READY   STATUS
pod/nginx-7d4f8-abc           1/1     Running
pod/nginx-7d4f8-xyz           1/1     Running
pod/nginx-7d4f8-123           1/1     Running

NAME                                DESIRED   CURRENT
replicaset.apps/nginx-7d4f8         3         3

NAME                    READY   UP-TO-DATE   AVAILABLE
deployment.apps/nginx   3/3     3            3

WHY this chain?
• ReplicaSet: maintains pod count (self-healing)
• Deployment: manages updates (v1 → v2 rolling, rollback)
• you: declare high-level intent, controllers do the rest`}
        />
        <CodeBlock
          title="deployment.yaml (what you actually write)"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:             # pod template (same as ReplicaSet template)
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f deployment.yaml
kubectl get deployments
kubectl get replicasets
kubectl get pods`}
          output={`deployment.apps/nginx created

NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   3/3     3            3           10s

NAME              DESIRED   CURRENT   READY   AGE
nginx-7d4f8bf     3         3         3       10s

NAME                    READY   STATUS    AGE
nginx-7d4f8bf-abc       1/1     Running   10s
nginx-7d4f8bf-xyz       1/1     Running   10s
nginx-7d4f8bf-123       1/1     Running   10s`}
        />
      </Section>

      {/* 03 */}
      <Section id="rolling-update" number="03" title="Rolling Updates — Zero Downtime ⭐">
        <P>
          Change the Deployment spec (e.g., new image) → Deployment creates a NEW ReplicaSet for v2, gradually scales it up while scaling the old one down. Traffic shifts smoothly.
        </P>
        <CodeBlock
          title="rolling_update_process.txt"
          runnable={false}
          code={`ROLLING UPDATE STRATEGY (default)

start state: 3 pods running v1
┌──────────────────────────────────────────────┐
│ ReplicaSet v1 (old)   ReplicaSet v2 (new)   │
│   3 pods running        0 pods              │
└──────────────────────────────────────────────┘

you: kubectl set image deployment/nginx nginx=nginx:1.26
     (or edit deployment.yaml and kubectl apply)

step 1: create 1 v2 pod (maxSurge: 1 allows 4 total)
┌──────────────────────────────────────────────┐
│ v1: 3 pods              v2: 1 pod Pending    │
│ total: 4 pods (3 desired + 1 surge)          │
└──────────────────────────────────────────────┘

step 2: v2 pod ready → terminate 1 v1 pod
┌──────────────────────────────────────────────┐
│ v1: 2 pods              v2: 1 pod Running    │
│ total: 3 pods                                │
└──────────────────────────────────────────────┘

step 3: repeat — create +1 v2, wait ready, -1 v1
┌──────────────────────────────────────────────┐
│ v1: 1 pod               v2: 2 pods           │
└──────────────────────────────────────────────┘

step 4: final
┌──────────────────────────────────────────────┐
│ v1: 0 pods (RS scaled to 0, kept for rollback)│
│ v2: 3 pods Running                           │
└──────────────────────────────────────────────┘

USERS: Service endpoints update as pods become Ready
       → traffic gradually shifts v1 → v2
       → ZERO requests dropped (if readiness probes correct)`}
        />
        <P>Two knobs control the rollout speed:</P>
        <Table
          head={["Field", "Default", "Meaning"]}
          rows={[
            [
              <IC key="1">maxSurge</IC>,
              "25%",
              "Max extra pods during update. 3 replicas + 25% = allow 4 total (1 extra). Can be absolute number (1) or % (25%).",
            ],
            [
              <IC key="2">maxUnavailable</IC>,
              "25%",
              "Max pods that can be down during update. 3 replicas - 25% = min 2 available. 0 maxUnavailable = zero-downtime guarantee.",
            ],
          ]}
        />
        <CodeBlock
          title="deployment.yaml (strategy tuning)"
          runnable={false}
          code={`spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2          # allow 12 pods during update (10 + 2)
      maxUnavailable: 1    # min 9 must be available (10 - 1)
  template:
    spec:
      containers:
      - name: app
        image: app:v2
        readinessProbe:    # CRITICAL for zero downtime
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3`}
        />
        <Callout type="mistake">
          ⚠️ Mistake: no readiness probe → Kubernetes assumes pod is Ready as soon as it starts (even if app takes 30s to boot). Rolling update sends traffic to not-yet-ready pods → errors. ALWAYS define readinessProbe for web apps.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="rollout-commands" number="04" title="Rollout Commands">
        <P>Manage Deployment rollouts with <IC>kubectl rollout</IC> subcommands:</P>
        <Table
          head={["Command", "What it does"]}
          rows={[
            [<IC key="1">kubectl rollout status deployment/nginx</IC>, "Watch rollout progress live (blocks until done or timeout)"],
            [<IC key="2">kubectl rollout history deployment/nginx</IC>, "Show revision history (change-cause annotations)"],
            [<IC key="3">kubectl rollout undo deployment/nginx</IC>, "Rollback to previous revision (swaps RS replicas)"],
            [<IC key="4">kubectl rollout undo deployment/nginx --to-revision=2</IC>, "Rollback to specific revision"],
            [<IC key="5">kubectl rollout pause deployment/nginx</IC>, "Pause rollout (make multiple changes, then resume)"],
            [<IC key="6">kubectl rollout resume deployment/nginx</IC>, "Resume paused rollout"],
          ]}
        />
        <CodeBlock
          title="terminal (rollout undo saves the day)"
          code={`kubectl set image deployment/app app=app:v2-broken
kubectl rollout status deployment/app`}
          output={`Waiting for rollout to finish: 1 out of 3 new replicas updated...
Waiting for rollout to finish: 2 out of 3 new replicas updated...
(stuck here — v2 pods CrashLoopBackOff)`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl rollout undo deployment/app`}
          output={`deployment.apps/app rolled back`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl rollout status deployment/app`}
          output={`deployment "app" successfully rolled out
(back to v1, all 3/3 Running)`}
        />
        <Callout type="tip">
          💡 Add <IC>--record</IC> to kubectl apply (deprecated but still works) or use <IC>kubernetes.io/change-cause</IC> annotation to track WHY each revision was created. Shows up in <IC>rollout history</IC>.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="daemonset" number="05" title="DaemonSet — One Per Node">
        <P>
          A <IC>DaemonSet</IC> runs exactly ONE pod per node (on ALL nodes, or a subset via node selectors). Use for node-level agents.
        </P>
        <CodeBlock
          title="daemonset_pattern.txt"
          runnable={false}
          code={`DAEMONSET (not replicas: N, but one per node)

┌─────────────────────────────────────────────────┐
│ CLUSTER (3 nodes)                               │
│  NODE 1             NODE 2             NODE 3   │
│  ┌────────┐        ┌────────┐        ┌────────┐│
│  │ log-   │        │ log-   │        │ log-   ││
│  │ agent  │        │ agent  │        │ agent  ││
│  └────────┘        └────────┘        └────────┘│
│                                                 │
│ add NODE 4 → DaemonSet auto-creates pod there  │
│ taint a node → DaemonSet skips it (unless      │
│                toleration set)                  │
└─────────────────────────────────────────────────┘

common use cases:
• log collectors (Fluentd, Filebeat) — scrape logs from all nodes
• monitoring agents (Prometheus node-exporter, Datadog agent)
• network plugins (Calico, Weave) — set up networking on each node
• storage daemons (Ceph, GlusterFS)`}
        />
        <CodeBlock
          title="daemonset.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v1.16
        volumeMounts:
        - name: varlog
          mountPath: /var/log       # read node's logs
      volumes:
      - name: varlog
        hostPath:
          path: /var/log            # mount HOST /var/log`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f daemonset.yaml
kubectl get daemonsets
kubectl get pods -o wide`}
          output={`daemonset.apps/fluentd created

NAME      DESIRED   CURRENT   READY   NODE SELECTOR
fluentd   3         3         3       <none>

NAME            READY   NODE
fluentd-abc     1/1     node-1
fluentd-xyz     1/1     node-2
fluentd-123     1/1     node-3`}
        />
      </Section>

      {/* 06 */}
      <Section id="job-cronjob" number="06" title="Job & CronJob">
        <P>
          Unlike Deployments (run forever), <IC>Job</IC> runs a pod to completion, then stops. <IC>CronJob</IC> creates Jobs on a schedule.
        </P>
        <CodeBlock
          title="job_vs_deployment.txt"
          runnable={false}
          code={`DEPLOYMENT              JOB
run forever             run to completion (exit 0)
restartPolicy: Always   restartPolicy: OnFailure or Never
replicas: 3             completions: 1 (or N for parallel)
app crashes → restart   app succeeds → pod stays Succeeded
kubectl scale           no scaling (fixed task count)

use Deployment for:     use Job for:
• web servers           • batch processing
• APIs                  • data migration
• workers (queues)      • backups
                        • one-time admin tasks`}
        />
        <CodeBlock
          title="job.yaml"
          runnable={false}
          code={`apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
spec:
  completions: 1        # how many successful completions needed
  parallelism: 1        # how many pods to run in parallel
  backoffLimit: 3       # retry up to 3 times on failure
  template:
    spec:
      restartPolicy: OnFailure   # required for Jobs (not Always)
      containers:
      - name: migrate
        image: migrate-tool:1.0
        command: ["./migrate.sh"]`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f job.yaml
kubectl get jobs
kubectl get pods`}
          output={`job.batch/db-migrate created

NAME         COMPLETIONS   DURATION   AGE
db-migrate   0/1           5s         5s

NAME               READY   STATUS    AGE
db-migrate-abc     1/1     Running   5s

(10 seconds later)
NAME               READY   STATUS      AGE
db-migrate-abc     0/1     Completed   15s

Job succeeded ✅ — pod stays in Completed state for logs`}
        />
        <P>
          <IC>CronJob</IC> creates Jobs on a cron schedule:
        </P>
        <CodeBlock
          title="cronjob.yaml"
          runnable={false}
          code={`apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 2 * * *"    # cron format: 2 AM daily
  jobTemplate:             # template for the Job it creates
    spec:
      template:            # template for the Pod
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: backup-tool:1.0
            command: ["./backup.sh"]`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl get cronjobs`}
          output={`NAME     SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
backup   0 2 * * *     False     0        23h             5d`}
        />
      </Section>

      {/* 07 */}
      <Section id="statefulset" number="07" title="StatefulSet — Stable Identities">
        <P>
          <IC>StatefulSet</IC> is like a Deployment, but pods get stable names, stable network IDs, and stable storage. Use for databases, clusters that need member identity.
        </P>
        <CodeBlock
          title="deployment_vs_statefulset.txt"
          runnable={false}
          code={`DEPLOYMENT pods (random hash suffixes)
nginx-7d4f8-abc   ← random
nginx-7d4f8-xyz   ← random
nginx-7d4f8-123   ← random
delete one → replacement gets NEW random name
all pods identical, interchangeable

STATEFULSET pods (ordinal index)
postgres-0   ← stable name
postgres-1   ← stable name
postgres-2   ← stable name
delete postgres-1 → recreated as postgres-1 (same name!)
pods have IDENTITY (postgres-0 is primary, -1 -2 replicas)

each pod gets:
• stable DNS: postgres-0.postgres-service.default.svc.cluster.local
• stable PersistentVolume (postgres-0 always gets pvc-postgres-0)
• ordered startup: 0 starts, waits Ready, then 1, then 2…
• ordered shutdown: 2 terminates, then 1, then 0

use for: databases, Kafka, ZooKeeper, Elasticsearch — anything
that needs "server 0 vs server 1" distinction`}
        />
        <Callout type="note">
          📝 StatefulSets are complex (covered fully in the Storage topic). For now: Deployment = stateless replicas, StatefulSet = stateful members with identity.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="workload-chooser" number="08" title="Workload Chooser — Which to Use? ⭐">
        <Table
          head={["Workload type", "Use when…", "Example"]}
          rows={[
            [
              <IC key="1">Deployment</IC>,
              "Default choice. Stateless app, need multiple replicas, rolling updates, self-healing.",
              "Web servers, APIs, stateless workers",
            ],
            [
              <IC key="2">ReplicaSet</IC>,
              "Almost never directly — Deployments create these for you.",
              "(internal to Deployments)",
            ],
            [
              <IC key="3">DaemonSet</IC>,
              "Need exactly one pod per node (or per labeled subset of nodes).",
              "Log agents, monitoring, network plugins",
            ],
            [
              <IC key="4">Job</IC>,
              "Task that runs to completion once (or N times in parallel).",
              "Batch processing, migrations, backups",
            ],
            [
              <IC key="5">CronJob</IC>,
              "Job that runs on a schedule (cron syntax).",
              "Nightly backups, hourly report generation",
            ],
            [
              <IC key="6">StatefulSet</IC>,
              "Pods need stable names, stable network IDs, stable storage (identity matters).",
              "Databases, Kafka, ZooKeeper, Cassandra",
            ],
            [
              <IC key="7">Bare Pod</IC>,
              "Never in production. Only for debugging or learning.",
              "kubectl run nginx --image=nginx (ephemeral test)",
            ],
          ]}
        />
        <CodeBlock
          title="decision_tree.txt"
          runnable={false}
          code={`WHICH WORKLOAD?
│
├─ runs to completion (exits 0/1)?
│    ├─ once             → Job
│    └─ on a schedule    → CronJob
│
├─ one per node?         → DaemonSet
│
├─ needs stable identity (db cluster)?
│                        → StatefulSet
│
└─ stateless replicas (default)
                         → Deployment ⭐

95% of the time: Deployment`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["ReplicaSet", "maintains N pods — kill one, it creates replacement (reconciliation)"],
            ["Deployment", "wraps ReplicaSet — adds rolling updates, rollback, history"],
            ["Ownership chain", "Deployment → ReplicaSet → Pods (you create Deployment only)"],
            ["Rolling update", "new RS scales up, old RS scales down — zero downtime (if readiness probe set)"],
            ["maxSurge", "extra pods allowed during update (default 25% of replicas)"],
            ["maxUnavailable", "max pods down during update (0 = zero-downtime guarantee)"],
            ["kubectl rollout undo", "rollback to previous revision (swaps RS replicas instantly)"],
            ["DaemonSet", "one pod per node — for log/monitoring agents"],
            ["Job", "runs to completion (exit 0) — batch tasks, migrations"],
            ["CronJob", "Job on a schedule (cron syntax) — backups, reports"],
            ["StatefulSet", "stable names (app-0, app-1) + stable storage — for databases"],
            ["Default choice", "Deployment — stateless replicas with rolling updates"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
