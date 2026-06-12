"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Pod Lifecycle — Live",
  nodes: [
    { id: "scheduler", icon: "🧠", label: "Scheduler", sub: "assigns to node", x: 10, y: 25, color: "#34d399" },
    { id: "node", icon: "🖥️", label: "Node", sub: "kubelet running", x: 30, y: 50, color: "#a78bfa" },
    { id: "init", icon: "🔧", label: "Init Container", sub: "runs first", x: 50, y: 18, color: "#fbbf24" },
    { id: "app", icon: "📦", label: "App Container", sub: "main workload", x: 65, y: 50, color: "#22d3ee" },
    { id: "sidecar", icon: "🔗", label: "Sidecar", sub: "logs/proxy", x: 50, y: 78, color: "#fb923c" },
    { id: "status", icon: "✅", label: "Status", sub: "Running/Failed", x: 88, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "sched-node", from: "scheduler", to: "node", color: "#a78bfa" },
    { id: "node-init", from: "node", to: "init", color: "#fbbf24" },
    { id: "init-app", from: "init", to: "app", color: "#22d3ee" },
    { id: "node-sidecar", from: "node", to: "sidecar", color: "#fb923c" },
    { id: "app-status", from: "app", to: "status", color: "#f472b6" },
    { id: "sidecar-status", from: "sidecar", to: "status", dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "🚀 Normal startup",
      command: "kubectl apply -f pod.yaml",
      steps: [
        { node: "scheduler", paths: ["sched-node"], text: "Scheduler assigns pod to node-2 (has capacity). Kubelet on node-2 sees the assignment." },
        { node: "init", paths: ["node-init", "init-app"], text: "Init container runs first (e.g., download config). Completes successfully → exit 0. Now main containers can start." },
        { node: "app", paths: ["app-status"], text: "App container starts, passes readiness probe. Sidecar starts in parallel. Pod status: Pending → ContainerCreating → Running." },
        { node: "status", paths: ["sidecar-status"], text: "All containers Running, ready 2/2. Pod added to Service endpoints. Traffic flows. ✅" },
      ],
    },
    {
      id: "image-typo",
      name: "❌ ImagePullBackOff",
      command: "image: ngins:1.25 (typo!)",
      steps: [
        { node: "node", paths: ["node-init"], text: "Kubelet tries to pull image 'ngins:1.25' from Docker Hub. 404 Not Found. Retry with exponential backoff." },
        { node: "status", paths: [], text: "Pod stuck in ImagePullBackOff. kubectl get pods shows ErrImagePull → ImagePullBackOff (backing off 1m, 2m, 4m…)." },
        { node: "node", paths: [], text: "kubectl describe pod shows: Failed to pull image 'ngins:1.25': not found. Fix the typo in YAML, re-apply. 🔧" },
      ],
    },
    {
      id: "crash",
      name: "🔁 CrashLoopBackOff",
      command: "app exits immediately with error",
      steps: [
        { node: "app", paths: ["app-status"], text: "Container starts, crashes after 2 seconds (e.g., missing env var). Kubelet restarts it (restartPolicy: Always)." },
        { node: "app", paths: [], text: "Crashes again. Restart #2. Then #3. Backoff delays grow: 10s, 20s, 40s, 80s (caps at 5min). Status: CrashLoopBackOff." },
        { node: "app", paths: [], text: "kubectl logs pod-x shows the error. Fix the code/config, rebuild image, update Deployment. Pod recreated with fix. 🔁" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-pod", label: "What is a Pod? ⭐" },
  { id: "pod-yaml", label: "Pod YAML Anatomy" },
  { id: "lifecycle", label: "Pod Lifecycle Phases ⭐" },
  { id: "multi-container", label: "Multi-Container Patterns" },
  { id: "init-containers", label: "Init Containers" },
  { id: "debugging", label: "Debugging Pods (describe/logs/exec) ⭐" },
  { id: "restart-policy", label: "Restart Policy" },
  { id: "bare-pods", label: "Why You Almost Never Create Bare Pods" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sPodsPage() {
  return (
    <TopicShell
      icon="📦"
      title="Pods"
      gradientWord="Pods"
      subtitle="The smallest deployable unit in Kubernetes. What a pod IS (vs a container), the full lifecycle from Pending to CrashLoopBackOff, multi-container patterns (sidecar, init containers), and the debugging trio: describe, logs, exec."
      nav={NAV}
      badges={["📦 Pod = 1+ containers", "🔁 Lifecycle phases", "🐛 Debug flow"]}
      next={{ icon: "🚀", label: "Workloads", href: "/kubernetes/workloads" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-pod" number="01" title="What is a Pod? ⭐">
        <P>
          A <IC>pod</IC> is the smallest deployable unit in Kubernetes — not a container, a <em>pod</em>. A pod wraps one or more containers that share the same network namespace and storage volumes.
        </P>
        <CodeBlock
          title="pod_vs_container.txt"
          runnable={false}
          code={`CONTAINER (Docker concept)
┌─────────────────────────┐
│  nginx container        │
│  IP: assigned by Docker │
│  isolated process       │
└─────────────────────────┘

POD (Kubernetes concept)
┌─────────────────────────────────────────────┐
│ POD my-app-abc                              │
│ POD IP: 10.244.1.5 (shared by all inside)  │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ nginx        │  │ log-forwarder│        │
│  │ container    │  │ (sidecar)    │        │
│  │ localhost:80 │◀─┤ reads logs   │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│ shared: network (both see localhost)       │
│         volumes (mount same /data)          │
│         lifecycle (live/die together)       │
└─────────────────────────────────────────────┘

why a pod, not just a container?
• some apps need helper containers (log shipper, proxy)
• they need to talk via localhost (same network namespace)
• Kubernetes schedules the WHOLE pod to one node as atomic unit`}
        />
        <Callout type="analogy">
          🏠 A pod is like a tiny apartment. Multiple roommates (containers) live in it, share the WiFi (network), share the fridge (volumes), and pay one electric bill (pod IP). If the landlord evicts the apartment, everyone leaves together.
        </Callout>
        <P>
          <strong>95% of the time you&apos;ll have ONE container per pod.</strong> Multi-container pods are for specific patterns (next section).
        </P>
      </Section>

      {/* 02 */}
      <Section id="pod-yaml" number="02" title="Pod YAML Anatomy">
        <P>Here&apos;s a minimal pod manifest, dissected line by line:</P>
        <CodeBlock
          title="pod.yaml"
          runnable={false}
          code={`apiVersion: v1              # API group/version for Pods
kind: Pod                   # resource type
metadata:
  name: nginx-pod           # pod name (must be unique in namespace)
  labels:
    app: nginx              # key-value tags (used by Services to find pods)
    env: prod
spec:                       # DESIRED state starts here
  containers:               # list of containers (usually 1)
  - name: nginx             # container name (unique within pod)
    image: nginx:1.25       # Docker image (pulls from Docker Hub by default)
    ports:
    - containerPort: 80     # port the app listens on (documentation — doesn't enforce)
    env:                    # environment variables
    - name: ENV
      value: production
    resources:              # CPU/memory requests & limits (we'll cover in scheduling)
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f pod.yaml
kubectl get pods`}
          output={`pod/nginx-pod created

NAME        READY   STATUS    RESTARTS   AGE
nginx-pod   1/1     Running   0          8s`}
        />
        <Callout type="tip">
          💡 <IC>containerPort</IC> is DOCUMENTATION ONLY — it doesn&apos;t open the port (containers can bind to any port). But it helps humans (and tools) know what the app exposes. Always declare it.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="lifecycle" number="03" title="Pod Lifecycle Phases ⭐">
        <P>
          A pod moves through states. Understanding these is critical for debugging stuck pods:
        </P>
        <CodeBlock
          title="pod_lifecycle_phases.txt"
          runnable={false}
          code={`POD LIFECYCLE (phases you'll see in kubectl get pods)

┌─────────────────────────────────────────────────────┐
│ 1. PENDING                                          │
│    pod accepted by API, but not scheduled yet       │
│    OR scheduled but image pull hasn't started       │
│    ▼                                                │
│ 2. CONTAINER CREATING                               │
│    kubelet pulling image, creating container        │
│    ▼                                                │
│ 3. RUNNING                                          │
│    ✅ at least one container is running            │
│    ▼ (app exits)                                   │
│ 4. SUCCEEDED  (exit 0)                              │
│    all containers completed successfully            │
│    (Jobs/CronJobs use this)                         │
│    OR ▼                                            │
│ 5. FAILED  (exit non-zero)                          │
│    container crashed, pod won't restart             │
│    (if restartPolicy: Never)                        │
└─────────────────────────────────────────────────────┘

COMMON ERROR STATES (substatus of Pending/Running)
┌──────────────────────────────────────────────────┐
│ ImagePullBackOff                                 │
│   image doesn't exist or no auth to pull it      │
│   (typo in image name is #1 cause)               │
│   exponential backoff: 10s, 20s, 40s…           │
│                                                  │
│ CrashLoopBackOff                                 │
│   container starts, crashes immediately          │
│   Kubernetes restarts it, crashes again          │
│   backoff: 10s, 20s, 40s, 80s, cap at 5min      │
│                                                  │
│ ErrImagePull                                     │
│   initial image pull failed (becomes             │
│   ImagePullBackOff after first retry)            │
│                                                  │
│ Pending (0/1)                                    │
│   stuck in Pending — no node has capacity        │
│   OR node selector/affinity rules don't match    │
│                                                  │
│ CreateContainerConfigError                       │
│   config issue: missing Secret/ConfigMap         │
└──────────────────────────────────────────────────┘

to see current phase: kubectl get pods
to see WHY it's stuck: kubectl describe pod <name>`}
        />
        <Callout type="mistake">
          ⚠️ Mistake: seeing CrashLoopBackOff and thinking &quot;it&apos;s not starting&quot; — it IS starting, then crashing. Check logs: <IC>kubectl logs pod-x</IC> (add <IC>-p</IC> for previous crashed container&apos;s logs). The error message is in there.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="multi-container" number="04" title="Multi-Container Patterns">
        <P>
          When you DO need multiple containers in a pod, they follow specific patterns:
        </P>
        <CodeBlock
          title="multi_container_patterns.txt"
          runnable={false}
          code={`PATTERN 1: SIDECAR (helper running alongside main app)
┌────────────────────────────────────────────────┐
│ POD                                            │
│  ┌─────────────┐     ┌──────────────┐         │
│  │ nginx       │────▶│ log-forwarder│         │
│  │ writes logs │     │ (fluentd)    │─────┐   │
│  │ to /var/log │     │ ships to ELK │     │   │
│  └─────────────┘     └──────────────┘     ▼   │
│                                        [remote]│
└────────────────────────────────────────────────┘
shared volume: /var/log (nginx writes, fluentd reads)
use case: logging, monitoring agents, service mesh proxies

PATTERN 2: ADAPTER (transform data format)
┌────────────────────────────────────────────────┐
│ POD                                            │
│  ┌─────────────┐     ┌──────────────┐         │
│  │ legacy app  │────▶│ adapter      │─────▶   │
│  │ outputs XML │     │ converts to  │    JSON │
│  │             │     │ JSON/Prom    │    to   │
│  └─────────────┘     └──────────────┘  scrapers│
└────────────────────────────────────────────────┘
use case: expose legacy app metrics in Prometheus format

PATTERN 3: AMBASSADOR (proxy to outside world)
┌────────────────────────────────────────────────┐
│ POD                                            │
│  ┌─────────────┐     ┌──────────────┐         │
│  │ app         │────▶│ ambassador   │───▶ DB  │
│  │ talks to    │     │ (local proxy)│   shard │
│  │ localhost   │     │ handles      │  routing│
│  └─────────────┘     │ sharding     │         │
│                      └──────────────┘         │
└────────────────────────────────────────────────┘
app thinks DB is localhost:5432, ambassador routes to correct shard`}
        />
        <CodeBlock
          title="sidecar-pod.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
  - name: app
    image: my-app:1.0
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  - name: log-shipper
    image: fluent/fluentd
    volumeMounts:
    - name: logs
      mountPath: /var/log/app   # same mount point — SHARED
  volumes:
  - name: logs
    emptyDir: {}                # ephemeral volume, lives with pod`}
        />
      </Section>

      {/* 05 */}
      <Section id="init-containers" number="05" title="Init Containers">
        <P>
          <IC>Init containers</IC> run BEFORE the main app containers, in sequence. They must complete successfully (exit 0) or the pod stays Pending.
        </P>
        <CodeBlock
          title="init_container_flow.txt"
          runnable={false}
          code={`INIT CONTAINERS (run in ORDER, one at a time)

┌────────────────────────────────────────────────┐
│ POD startup sequence                           │
│                                                │
│ 1. init-db ──▶ runs: wait-for-db.sh           │
│                waits for postgres:5432 to respond│
│                ✅ exit 0                       │
│    ▼                                          │
│ 2. init-config ──▶ downloads config from S3   │
│                    ✅ exit 0                   │
│    ▼                                          │
│ 3. app container starts (now safe, DB is up)  │
│    sidecar starts in parallel                  │
└────────────────────────────────────────────────┘

if ANY init container fails (exit 1), pod stuck in Init:Error
Kubernetes retries the FAILED init container (with backoff)`}
        />
        <CodeBlock
          title="pod-with-init.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  initContainers:                 # these run FIRST, in order
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 2; done']
  - name: fetch-config
    image: amazon/aws-cli
    command: ['aws', 's3', 'cp', 's3://configs/app.json', '/config/']
    volumeMounts:
    - name: config
      mountPath: /config
  containers:                     # these start AFTER all inits succeed
  - name: app
    image: my-app:1.0
    volumeMounts:
    - name: config
      mountPath: /config
  volumes:
  - name: config
    emptyDir: {}`}
        />
        <Callout type="tip">
          💡 Use init containers for setup tasks that must finish before the app starts: wait for dependencies, download configs, run migrations. Don&apos;t put them in the main container&apos;s entrypoint script — init containers make failures explicit.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="debugging" number="06" title="Debugging Pods — The Holy Trinity ⭐">
        <P>When a pod misbehaves, use these 3 commands IN ORDER:</P>
        <Table
          head={["Command", "Shows you", "When to use"]}
          rows={[
            [
              <IC key="1">kubectl describe pod &lt;name&gt;</IC>,
              "Full pod details: events (image pulled, container started, FAILED, probe failed), status, volumes, node placement.",
              "FIRST STEP — tells you WHAT went wrong (image pull error, crash, probe timeout).",
            ],
            [
              <IC key="2">kubectl logs &lt;pod&gt; [-c container]</IC>,
              "Stdout/stderr from the container (app logs). Add -f to tail, -p for previous crashed container.",
              "WHY did it crash? Application errors, stack traces live here.",
            ],
            [
              <IC key="3">kubectl exec -it &lt;pod&gt; -- /bin/bash</IC>,
              "Shell into the running container. Check files, env vars, run commands.",
              "Last resort — interactive debugging (is the config file there? Can I curl the DB?).",
            ],
          ]}
        />
        <CodeBlock
          title="terminal (debugging CrashLoopBackOff)"
          code={`kubectl get pods`}
          output={`NAME       READY   STATUS             RESTARTS   AGE
app-xyz    0/1     CrashLoopBackOff   5          3m`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl describe pod app-xyz | tail -20`}
          output={`Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  3m                 scheduler          Successfully assigned
  Normal   Pulled     2m (x4)            kubelet            Pulled image "app:v2"
  Normal   Created    2m (x4)            kubelet            Created container
  Warning  BackOff    30s (x10)          kubelet            Back-off restarting failed container

Last State:     Terminated
  Reason:       Error
  Exit Code:    1`}
        />
        <CodeBlock
          title="terminal (check WHY it exited 1)"
          code={`kubectl logs app-xyz`}
          output={`Error: DATABASE_URL environment variable not set
Exiting.`}
        />
        <P>
          Found it! Missing env var. Fix the Deployment, re-apply. Pod recreates with the fix.
        </P>
        <Callout type="tip">
          💡 For previous crashed container logs: <IC>kubectl logs app-xyz -p</IC> (the <IC>-p</IC> flag = previous). The current container might be in a restart loop waiting — you need the PREVIOUS one&apos;s logs to see the crash.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="restart-policy" number="07" title="Restart Policy">
        <P>
          What should Kubernetes do when a container exits? Controlled by <IC>spec.restartPolicy</IC>:
        </P>
        <Table
          head={["Policy", "Behavior", "Use case"]}
          rows={[
            [
              <IC key="1">Always</IC>,
              "Restart container even if it exits 0. DEFAULT for Deployments.",
              "Long-running apps (web servers, workers). You want them UP forever.",
            ],
            [
              <IC key="2">OnFailure</IC>,
              "Restart only if exit code ≠ 0. If exit 0, leave it Succeeded.",
              "Jobs (batch tasks). If the job completes successfully, don't restart it.",
            ],
            [
              <IC key="3">Never</IC>,
              "Never restart. Pod goes to Failed or Succeeded.",
              "One-off tasks where you want to see the final state.",
            ],
          ]}
        />
        <CodeBlock
          title="pod.yaml"
          runnable={false}
          code={`spec:
  restartPolicy: OnFailure   # or Always (default), Never
  containers:
  - name: task
    image: task:1.0`}
        />
      </Section>

      {/* 08 */}
      <Section id="bare-pods" number="08" title="Why You Almost Never Create Bare Pods">
        <P>
          The YAML examples here are <IC>kind: Pod</IC> for learning — but in real clusters, you almost NEVER create pods directly. You create a <IC>Deployment</IC> (next topic), which creates a ReplicaSet, which creates pods.
        </P>
        <CodeBlock
          title="bare_pod_vs_deployment.txt"
          runnable={false}
          code={`BARE POD (kubectl apply -f pod.yaml)
┌────────────────────────────────────────────────┐
│  pod-abc  (1 pod)                              │
│                                                │
│  ✗ dies → gone forever (no self-healing)       │
│  ✗ can't scale (no replicas concept)           │
│  ✗ can't rolling-update to v2                  │
│  ✗ manual: you manage lifecycle by hand        │
└────────────────────────────────────────────────┘

DEPLOYMENT (kubectl apply -f deployment.yaml)
┌────────────────────────────────────────────────┐
│ Deployment nginx                               │
│   └─▶ ReplicaSet nginx-7d4f8                   │
│         └─▶ pod nginx-7d4f8-abc                │
│         └─▶ pod nginx-7d4f8-xyz                │
│         └─▶ pod nginx-7d4f8-123                │
│                                                │
│  ✅ dies → ReplicaSet creates replacement      │
│  ✅ scale: kubectl scale --replicas=10          │
│  ✅ update image → rolling update v1 → v2      │
│  ✅ rollback: kubectl rollout undo              │
└────────────────────────────────────────────────┘

exception: Jobs/CronJobs create bare pods (they're meant
to run once and stop, no need for ReplicaSet)`}
        />
        <Callout type="note">
          📝 This topic teaches pods as the foundation. Next topic (Workloads) teaches Deployments — the RIGHT way to run apps in Kubernetes. Pods are the atom, Deployments are the molecule.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Pod", "smallest unit — wraps 1+ containers, shared network + volumes"],
            ["Pod IP", "every pod gets one IP (shared by all containers inside)"],
            ["Lifecycle", "Pending → ContainerCreating → Running → Succeeded/Failed"],
            ["ImagePullBackOff", "image not found (typo?) or no auth — check describe"],
            ["CrashLoopBackOff", "container starts then crashes — check logs (add -p for previous)"],
            ["Debug trio", "1) kubectl describe (events) 2) logs (app errors) 3) exec (shell in)"],
            ["Multi-container", "sidecar (helper), adapter (transform), ambassador (proxy)"],
            ["Init containers", "run BEFORE main app, in sequence — use for setup/wait tasks"],
            ["restartPolicy", "Always (default, web apps) · OnFailure (Jobs) · Never (one-off)"],
            ["Bare pods", "DON'T create in production — use Deployments (self-healing, scale, rollout)"],
            ["containerPort", "documentation only — doesn't enforce, but always declare it"],
            ["kubectl logs -p", "see PREVIOUS crashed container logs (current might be restarting)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
