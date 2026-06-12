"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Probes Save Production — Live",
  nodes: [
    { id: "kubelet", icon: "🔍", label: "kubelet", sub: "health checker", x: 8, y: 40, color: "#60a5fa" },
    { id: "app", icon: "🎯", label: "App Pod", sub: "web server", x: 32, y: 40, color: "#22d3ee" },
    { id: "liveness", icon: "💓", label: "Liveness", sub: "restart me?", x: 32, y: 12, color: "#f472b6" },
    { id: "readiness", icon: "🟢", label: "Readiness", sub: "send traffic?", x: 32, y: 68, color: "#34d399" },
    { id: "service", icon: "🔀", label: "Service", sub: "load balancer", x: 60, y: 40, color: "#a78bfa" },
    { id: "traffic", icon: "👥", label: "Traffic", sub: "users", x: 85, y: 40, color: "#fbbf24" },
  ],
  edges: [
    { id: "kubelet-app", from: "kubelet", to: "app", color: "#60a5fa" },
    { id: "app-liveness", from: "app", to: "liveness", color: "#f472b6" },
    { id: "app-readiness", from: "app", to: "readiness", color: "#34d399" },
    { id: "app-service", from: "app", to: "service", color: "#a78bfa" },
    { id: "service-traffic", from: "service", to: "traffic", color: "#fbbf24" },
    { id: "readiness-service", from: "readiness", to: "service", bend: -40, dashed: true, color: "#34d399" },
    { id: "liveness-kubelet", from: "liveness", to: "kubelet", bend: 40, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "healthy",
      name: "✅ Healthy app",
      command: "both probes passing → traffic flows",
      steps: [
        { node: "kubelet", paths: ["kubelet-app", "app-liveness"], text: "kubelet pings liveness probe every 10s: GET /healthz → 200 OK. App is alive. ✅" },
        { node: "readiness", paths: ["app-readiness", "readiness-service"], text: "Readiness probe: GET /ready → 200 OK. Pod marked Ready → added to Service endpoints." },
        { node: "traffic", paths: ["service-traffic"], text: "Users hit the Service → traffic routed to this pod. Both probes green = production-ready. 🟢" },
      ],
    },
    {
      id: "hang",
      name: "💀 App hangs",
      command: "liveness fails → restart",
      steps: [
        { node: "app", paths: ["app-liveness"], text: "App deadlocks (infinite loop, db connection hangs). Process still running but not responding." },
        { node: "liveness", paths: ["liveness-kubelet"], text: "Liveness probe times out 3 times (failureThreshold). kubelet decides: pod is DEAD. 💀" },
        { node: "kubelet", paths: ["kubelet-app"], text: "kubelet kills the container and restarts it (restartPolicy: Always). Fresh start, deadlock cleared. 🔄" },
      ],
    },
    {
      id: "overload",
      name: "🔄 Overload recovery",
      command: "readiness fails → pulled from rotation → recovers",
      steps: [
        { node: "readiness", paths: ["app-readiness"], text: "Traffic spike: app overloaded, responding slowly. Readiness probe /ready → 503 (or timeout)." },
        { node: "service", paths: ["readiness-service"], text: "Pod marked NotReady → removed from Service endpoints. No NEW traffic sent to it. 🚫" },
        { node: "readiness", paths: ["app-readiness", "readiness-service", "service-traffic"], text: "Backlog clears. Readiness probe recovers: 200 OK → pod rejoins rotation. No restart needed. 🟢" },
      ],
    },
  ],
};

const NAV = [
  { id: "scheduler", label: "How the Scheduler Picks a Node ⭐" },
  { id: "resources", label: "Requests vs Limits ⭐" },
  { id: "qos", label: "QoS Classes & Eviction" },
  { id: "probes", label: "The Three Probes ⭐" },
  { id: "probe-config", label: "Probe Configuration Deep Dive" },
  { id: "node-selection", label: "Node Selection & Affinity" },
  { id: "taints-tolerations", label: "Taints & Tolerations" },
  { id: "priority", label: "Priority Classes" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sSchedulingHealthPage() {
  return (
    <TopicShell
      icon="🎯"
      title="Kubernetes Scheduling, Probes & Resources"
      gradientWord="Scheduling"
      subtitle="How Kubernetes decides which node gets a pod, how to reserve and limit CPU/memory, and the three probes that keep your production apps alive: liveness (restart me), readiness (am I ready for traffic), and startup (I&apos;m slow to boot). This is the difference between an app that crashes silently and one that self-heals."
      nav={NAV}
      badges={["🧮 Requests/Limits", "💓 3 probes", "🎯 Affinity/Taints"]}
      next={{ icon: "📈", label: "Autoscaling", href: "/kubernetes/autoscaling" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="scheduler" number="01" title="How the Scheduler Picks a Node ⭐">
        <P>
          When you create a pod, it starts in <IC>Pending</IC> state. The <strong>kube-scheduler</strong> (a control-plane component) watches for unscheduled pods and assigns each one to a node. The process has two phases:
        </P>
        <CodeBlock
          title="scheduler_algorithm.txt"
          runnable={false}
          code={`PHASE 1: FILTERING (eliminate impossible nodes)
┌────────────────────────────────────────────────────────────┐
│ pod requests: 2 CPU, 4Gi RAM                               │
│ nodes in cluster:                                          │
│  node-1: 4 CPU, 8Gi RAM  (2 used) → 2 free ✅              │
│  node-2: 2 CPU, 4Gi RAM  (2 used) → 0 free ❌ (filtered)   │
│  node-3: taint NoSchedule → ❌ (filtered, no toleration)   │
│  node-4: 8 CPU, 16Gi RAM (1 used) → 7 free ✅              │
└────────────────────────────────────────────────────────────┘
   filters applied: PodFitsResources, PodFitsHostPorts,
                    NodeAffinity, TaintToleration, ...
   ↓ feasible nodes: node-1, node-4

PHASE 2: SCORING (rank remaining nodes)
┌────────────────────────────────────────────────────────────┐
│ scoring functions (0-100 each, then weighted average):    │
│  • LeastAllocated (prefer emptier nodes → spread load)    │
│  • BalancedResourceAllocation (CPU/RAM ratio balanced)    │
│  • ImageLocality (image already pulled? faster start)     │
│  • NodeAffinity score (preferred affinity rules)          │
│                                                            │
│ node-1 score: 65  (medium loaded)                          │
│ node-4 score: 85  (mostly empty, image cached) ← WINNER ✅ │
└────────────────────────────────────────────────────────────┘
   pod.spec.nodeName = node-4 → kubelet on node-4 starts it`}
        />
        <Callout type="behind">
          🔧 The scheduler is pluggable. You can write custom scheduling plugins or use multiple schedulers. Specify <IC>schedulerName</IC> in the pod spec to use a non-default scheduler.
        </Callout>
        <P>
          If <strong>no node passes filtering</strong>, the pod stays <IC>Pending</IC> with an event like <IC>0/5 nodes are available: insufficient cpu</IC>. Fix: add nodes, reduce requests, or remove taints.
        </P>
      </Section>

      {/* 02 */}
      <Section id="resources" number="02" title="Requests vs Limits — Reservation vs Ceiling ⭐">
        <P>
          Every container can specify <IC>resources.requests</IC> (guaranteed minimum) and <IC>resources.limits</IC> (hard cap). These control scheduling AND runtime behavior.
        </P>
        <CodeBlock
          title="requests_vs_limits.txt"
          runnable={false}
          code={`┌────────────────────────────────────────────────────────────┐
│ REQUESTS = "I need at least this much"                    │
│  • used by SCHEDULER to pick a node (must have free space)│
│  • kubelet RESERVES this capacity (even if unused)        │
│  • container CAN use more if node has idle resources      │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ LIMITS = "I can never use more than this"                 │
│  • NOT used by scheduler (scheduling = requests only)     │
│  • enforced by kubelet/cgroups at RUNTIME                 │
│  • CPU: throttled if exceeded (slow down)                 │
│  • Memory: OOMKilled if exceeded (pod killed) 💀           │
└────────────────────────────────────────────────────────────┘

example node with 4 CPU, 8Gi RAM:
┌────────────────────────────────────────────────────────────┐
│ pod-A: request 1 CPU, limit 2 CPU                          │
│ pod-B: request 2 CPU, limit 4 CPU                          │
│ ────────────────────────────────────────────────────────── │
│ SCHEDULER sees: 3 CPU requested → 1 CPU "free" for sched  │
│ RUNTIME: if both pods idle, 4 CPU actually available       │
│          if both pods spike, A gets ≤2, B gets ≤4 (limits) │
│          if pod-B tries to use 5 CPU → throttled to 4      │
└────────────────────────────────────────────────────────────┘

overcommitment: sum(limits) > node capacity is ALLOWED
(scheduler only cares about requests)`}
        />
        <CodeBlock
          title="deployment_with_resources.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myapi:v1
        resources:
          requests:
            cpu: "500m"      # 0.5 CPU (500 millicores)
            memory: "512Mi"  # 512 mebibytes
          limits:
            cpu: "1000m"     # 1 full CPU max
            memory: "1Gi"    # hard cap — exceed → OOMKilled`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Worst practice</strong>: no requests/limits. Scheduler can&apos;t reserve capacity → pods scheduled to overloaded nodes → random OOMKills. <strong>Second worst</strong>: limits without requests (requests default to limits) → massive overreservation, wasted nodes.
        </Callout>
        <CodeBlock
          title="kubectl top + OOMKilled event"
          output={`$ kubectl top pod api-7f8d9c-abc12
NAME                  CPU(cores)   MEMORY(bytes)
api-7f8d9c-abc12      780m         950Mi   ← approaching 1Gi limit

# if memory crosses 1Gi:
$ kubectl describe pod api-7f8d9c-abc12
...
Events:
  Type     Reason     Message
  ----     ------     -------
  Normal   Pulled     Container image pulled
  Warning  BackOff    Back-off restarting failed container
  Normal   Killing    Memory limit exceeded: OOMKilled   ← 💀

restartCount increments, pod enters CrashLoopBackOff`}
          code={`kubectl top pod api-7f8d9c-abc12
kubectl describe pod api-7f8d9c-abc12`}
        />
        <Callout type="tip">
          💡 <strong>CPU vs Memory difference</strong>: CPU limit = throttling (app just runs slower). Memory limit = <IC>OOMKilled</IC> (instant death). This is why memory limits are more dangerous — set them too low and your app randomly dies under load.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="qos" number="03" title="QoS Classes & Eviction Order">
        <P>
          Kubernetes assigns every pod a <strong>Quality of Service (QoS) class</strong> based on its requests/limits. This determines eviction priority when a node runs out of resources.
        </P>
        <Table
          head={["QoS Class", "Condition", "Eviction priority", "Use case"]}
          rows={[
            [<IC key="1">Guaranteed</IC>, "limits = requests for all containers (and both CPU+mem set)", "LAST evicted (highest priority)", "production databases, critical apps"],
            [<IC key="2">Burstable</IC>, "at least one container has requests < limits (or only requests set)", "middle priority", "most apps — reserve minimum, burst when idle capacity"],
            [<IC key="3">BestEffort</IC>, "no requests or limits set at all", "FIRST evicted (lowest priority)", "batch jobs, can tolerate interruption"],
          ]}
        />
        <CodeBlock
          title="qos_examples.yaml"
          runnable={false}
          code={`# Guaranteed QoS
resources:
  requests:
    cpu: "1"
    memory: "1Gi"
  limits:
    cpu: "1"       # ← same as request
    memory: "1Gi"  # ← same as request
# pod.status.qosClass = Guaranteed
---
# Burstable QoS
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "2"       # ← higher than request
    memory: "2Gi"  # ← can burst
# pod.status.qosClass = Burstable
---
# BestEffort QoS
resources: {}    # no requests, no limits
# pod.status.qosClass = BestEffort (first to die 💀)`}
        />
        <P>
          When a node runs out of memory (not enough to satisfy all requests), kubelet evicts pods in this order:
        </P>
        <CodeBlock
          title="eviction_priority.txt"
          runnable={false}
          code={`node memory exhausted → kubelet eviction process:
1. kill BestEffort pods first (sorted by usage)
2. if still not enough, kill Burstable pods EXCEEDING requests
3. last resort: kill Burstable pods within requests
4. almost never: kill Guaranteed pods (only if node critically low)

within same priority: sort by (usage - request) descending
→ the pod using MOST over its request dies first`}
        />
        <Callout type="tip">
          💡 To protect critical pods: set requests = limits (Guaranteed QoS) + use <IC>PriorityClass</IC> (§08). This makes them last to be evicted and first to be scheduled.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="probes" number="04" title="The Three Probes — Liveness, Readiness, Startup ⭐">
        <P>
          Kubernetes doesn&apos;t just check if a container <em>process</em> is running — it checks if the <em>app</em> is healthy via <strong>probes</strong>. Three types, three purposes:
        </P>
        <Table
          head={["Probe", "Question it answers", "Action on failure", "When to use"]}
          rows={[
            [<IC key="1">livenessProbe</IC>, "Is the app alive or deadlocked?", "restart the container 🔄", "detect infinite loops, hung threads, db connection exhausted"],
            [<IC key="2">readinessProbe</IC>, "Is the app ready to serve traffic?", "remove from Service endpoints 🚫", "startup dependencies (db not ready), overload, graceful shutdown"],
            [<IC key="3">startupProbe</IC>, "Has the app finished booting?", "wait (disable liveness until this passes) ⏳", "slow-starting apps (Java 60s startup) — prevents liveness from killing during boot"],
          ]}
        />
        <CodeBlock
          title="three_probes_flow.txt"
          runnable={false}
          code={`pod lifecycle with all three probes:
┌────────────────────────────────────────────────────────────┐
│ 1. container starts                                        │
│    startupProbe runs every 5s: GET /healthz                │
│    (liveness + readiness DISABLED until startup succeeds)  │
│    ↓ after 30s: startup probe passes ✅                    │
├────────────────────────────────────────────────────────────┤
│ 2. app running                                             │
│    livenessProbe: GET /healthz every 10s → 200 OK ✅       │
│    readinessProbe: GET /ready every 5s → 200 OK ✅         │
│    pod status: Running + Ready → receives traffic 🟢       │
├────────────────────────────────────────────────────────────┤
│ 3. app overloaded                                          │
│    readinessProbe: GET /ready → 503 (app says not ready)  │
│    pod marked NotReady → removed from Service endpoints    │
│    liveness still OK → no restart, just no traffic 🚫      │
│    ↓ load decreases, readiness recovers → rejoins          │
├────────────────────────────────────────────────────────────┤
│ 4. app deadlocks (db connection hung, infinite loop)       │
│    livenessProbe: GET /healthz → timeout (no response)     │
│    fails 3 times (failureThreshold) → kubelet restarts pod │
│    ↓ fresh start, deadlock cleared 🔄                      │
└────────────────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="deployment_with_probes.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myapi:v1
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /healthz     # app must implement this endpoint
            port: 8080
          initialDelaySeconds: 15   # wait 15s after start
          periodSeconds: 10         # check every 10s
          timeoutSeconds: 3         # fail if no response in 3s
          failureThreshold: 3       # restart after 3 failures
        readinessProbe:
          httpGet:
            path: /ready       # separate endpoint (checks dependencies)
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 2   # 2 failures → NotReady (faster)
        startupProbe:
          httpGet:
            path: /healthz     # often same as liveness
            port: 8080
          periodSeconds: 5
          failureThreshold: 30  # 30×5s = 150s max startup time`}
        />
        <Callout type="analogy">
          🏥 <strong>Medical checkup analogy</strong>: <IC>startupProbe</IC> = &quot;did the patient wake up from surgery?&quot; (one-time). <IC>livenessProbe</IC> = &quot;is the heart beating?&quot; (if no, emergency restart). <IC>readinessProbe</IC> = &quot;can they walk?&quot; (if no, keep in recovery room, don&apos;t discharge to the lobby yet).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="probe-config" number="05" title="Probe Configuration Deep Dive">
        <P>
          Probes can use three mechanisms: HTTP GET, TCP socket, or exec command. HTTP is most common.
        </P>
        <CodeBlock
          title="probe_types.yaml"
          runnable={false}
          code={`# HTTP probe (most common)
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    httpHeaders:          # optional custom headers
    - name: X-Health-Check
      value: "true"
  periodSeconds: 10
---
# TCP probe (just check if port is open — no HTTP needed)
livenessProbe:
  tcpSocket:
    port: 3306   # MySQL port
  periodSeconds: 10
  # useful for databases, Redis, etc (no HTTP endpoint)
---
# Exec probe (run command in container)
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy   # exit 0 = success, nonzero = failure
  periodSeconds: 5
  # useful for legacy apps without HTTP endpoint`}
        />
        <P>
          Timing parameters (CRITICAL to tune correctly):
        </P>
        <Table
          head={["Parameter", "Default", "Meaning", "Tuning advice"]}
          rows={[
            [<IC key="1">initialDelaySeconds</IC>, "0", "wait this long after container start before first probe", "set > app startup time (avoid false failures during boot)"],
            [<IC key="2">periodSeconds</IC>, "10", "how often to probe", "liveness: 10-30s is fine · readiness: 5-10s (faster reaction)"],
            [<IC key="3">timeoutSeconds</IC>, "1", "probe must respond within this", "slow apps: increase to 3-5s (avoid false timeouts)"],
            [<IC key="4">successThreshold</IC>, "1", "consecutive successes to mark healthy", "always 1 for liveness · readiness can be >1 for stability"],
            [<IC key="5">failureThreshold</IC>, "3", "consecutive failures to mark unhealthy", "liveness: 3-5 (avoid premature restarts) · readiness: 1-2 (faster removal)"],
          ]}
        />
        <CodeBlock
          title="probe_timing_formula.txt"
          runnable={false}
          code={`max time to detect failure:
  failureThreshold × periodSeconds

example: failureThreshold=3, periodSeconds=10
  → 30 seconds to detect and restart a dead app

max startup time before killed:
  startupProbe: failureThreshold × periodSeconds
  example: 30 × 5s = 150s (2.5 minutes allowed to boot)`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: liveness probe that depends on external services. If your DB is down, liveness should still pass (the app process is alive, just can&apos;t serve traffic). Make DB dependency a <IC>readinessProbe</IC> check instead — this removes the pod from rotation without killing it.
        </Callout>
        <CodeBlock
          title="good_vs_bad_probes.txt"
          runnable={false}
          code={`❌ BAD liveness probe (kills pod when DB down)
livenessProbe:
  httpGet:
    path: /healthz
  # /healthz checks: db.ping() → if DB down, returns 500
  # → liveness fails → pod restarted → STILL no DB → loop 💀

✅ GOOD separation
livenessProbe:
  httpGet:
    path: /healthz
  # /healthz returns 200 if app process is running (no external deps)

readinessProbe:
  httpGet:
    path: /ready
  # /ready checks db.ping() → if DB down, returns 503
  # → pod marked NotReady → no traffic, but NOT restarted
  # → when DB recovers, readiness passes → rejoins`}
        />
      </Section>

      {/* 06 */}
      <Section id="node-selection" number="06" title="Node Selection — nodeSelector, Affinity, Anti-Affinity">
        <P>
          By default, the scheduler picks any node that passes filtering. But you can <strong>constrain</strong> or <strong>prefer</strong> certain nodes:
        </P>
        <CodeBlock
          title="node_selection_hierarchy.txt"
          runnable={false}
          code={`SIMPLE → ADVANCED

1. nodeName (hardcode a node — never use in prod)
   spec:
     nodeName: node-3   # skip scheduler, force this node ⚠️

2. nodeSelector (must match labels)
   spec:
     nodeSelector:
       disktype: ssd   # only nodes with this label
   simple, but inflexible (AND logic only)

3. nodeAffinity (required or preferred, complex rules)
   spec:
     affinity:
       nodeAffinity:
         requiredDuringSchedulingIgnoredDuringExecution:  ← MUST
         preferredDuringSchedulingIgnoredDuringExecution: ← NICE-TO-HAVE

4. podAffinity / podAntiAffinity (co-locate or spread pods)
   "schedule near pods with label X" or "avoid nodes with label Y"`}
        />
        <CodeBlock
          title="nodeSelector_example.yaml"
          runnable={false}
          code={`# first, label nodes
# kubectl label nodes node-1 disktype=ssd
# kubectl label nodes node-2 disktype=ssd
# kubectl label nodes node-3 disktype=hdd

apiVersion: v1
kind: Pod
metadata:
  name: db
spec:
  nodeSelector:
    disktype: ssd   # will ONLY schedule to node-1 or node-2
  containers:
  - name: postgres
    image: postgres:15`}
        />
        <CodeBlock
          title="nodeAffinity_example.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  affinity:
    nodeAffinity:
      # REQUIRED: must match (like nodeSelector, but more expressive)
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/arch
            operator: In
            values:
            - amd64
            - arm64   # must be one of these architectures
      # PREFERRED: try to match, but not mandatory (scoring)
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80   # 0-100 weight in scoring
        preference:
          matchExpressions:
          - key: disktype
            operator: In
            values:
            - ssd   # prefer SSD nodes, but will schedule to HDD if needed
  containers:
  - name: api
    image: myapi:v1`}
        />
        <P>
          <strong>Pod anti-affinity</strong>: spread replicas across nodes or zones for high availability.
        </P>
        <CodeBlock
          title="pod_antiaffinity.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: web   # avoid nodes that already have app=web
            topologyKey: kubernetes.io/hostname   # spread across nodes
            # or: topology.kubernetes.io/zone    # spread across AZs
      containers:
      - name: web
        image: nginx
# result: 3 replicas → 3 different nodes (if possible)`}
        />
        <Callout type="tip">
          💡 Use anti-affinity with <IC>topologyKey: topology.kubernetes.io/zone</IC> to spread replicas across availability zones — this survives a full zone outage. Most managed K8s clusters label nodes with zone automatically.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="taints-tolerations" number="07" title="Taints & Tolerations — Node Repels, Pod Tolerates">
        <P>
          Taints are the <em>opposite</em> of node selectors: they <strong>repel</strong> pods by default. Pods must explicitly <strong>tolerate</strong> a taint to land on that node.
        </P>
        <CodeBlock
          title="taint_toleration_model.txt"
          runnable={false}
          code={`┌────────────────────────────────────────────────────────────┐
│ node-gpu: tainted with gpu=true:NoSchedule                │
│  (means: don't schedule normal pods here, save for GPU)   │
└────────────────────────────────────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           ▼                        ▼
┌────────────────────┐    ┌────────────────────┐
│ pod-A (no toleration) │    │ pod-B (tolerates)  │
│ → REJECTED ❌        │    │ spec:              │
│                    │    │   tolerations:     │
│                    │    │   - key: gpu       │
│                    │    │     value: "true"  │
│                    │    │     effect: NoSchedule
│                    │    │ → ACCEPTED ✅      │
└────────────────────┘    └────────────────────┘

use cases:
• dedicated nodes for ML workloads (GPU taints)
• cordoned nodes (maintenance → NoSchedule)
• spot instances (taint → only tolerant batch jobs)`}
        />
        <CodeBlock
          title="kubectl taint node"
          output={`# add taint to node-1
$ kubectl taint nodes node-1 gpu=true:NoSchedule
node/node-1 tainted

# list taints
$ kubectl describe node node-1 | grep Taint
Taints: gpu=true:NoSchedule

# remove taint (note the - suffix)
$ kubectl taint nodes node-1 gpu=true:NoSchedule-
node/node-1 untainted`}
          code={`kubectl taint nodes node-1 gpu=true:NoSchedule
kubectl describe node node-1 | grep Taint`}
        />
        <P>
          Three taint effects:
        </P>
        <Table
          head={["Effect", "Meaning", "Existing pods"]}
          rows={[
            [<IC key="1">NoSchedule</IC>, "new pods rejected (unless tolerating)", "existing pods stay"],
            [<IC key="2">PreferNoSchedule</IC>, "try to avoid, but not forbidden", "soft constraint (scoring)"],
            [<IC key="3">NoExecute</IC>, "new pods rejected AND existing pods evicted (unless tolerating)", "⚠️ drains the node"],
          ]}
        />
        <CodeBlock
          title="toleration_example.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: gpu-job
spec:
  tolerations:
  - key: "gpu"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"   # tolerates the NoSchedule taint
  # this pod CAN land on tainted gpu nodes (but also on normal nodes)
  containers:
  - name: trainer
    image: tensorflow/tensorflow:latest-gpu`}
        />
        <Callout type="analogy">
          🚫 <strong>VIP lounge analogy</strong>: taints = &quot;VIP only&quot; velvet rope. Tolerations = VIP pass. Normal pods (no pass) are turned away. Pods with the pass can enter — but they can also sit in the regular area if they want (tolerations don&apos;t force placement, just allow it).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="priority" number="08" title="Priority Classes — Who Gets Scheduled First">
        <P>
          When resources are tight, <strong>PriorityClass</strong> determines which pods get scheduled first and which get evicted last.
        </P>
        <CodeBlock
          title="priorityclass_example.yaml"
          runnable={false}
          code={`apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000   # higher = more important (range: -2^31 to 2^31-1)
globalDefault: false
description: "Critical production workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 100
globalDefault: false
description: "Batch jobs, can be interrupted"
---
# use in pod
apiVersion: v1
kind: Pod
metadata:
  name: critical-db
spec:
  priorityClassName: high-priority   # ← reference the PriorityClass
  containers:
  - name: postgres
    image: postgres:15`}
        />
        <P>
          When the scheduler can&apos;t fit a high-priority pod, it may <strong>preempt</strong> (evict) lower-priority pods to make room.
        </P>
        <CodeBlock
          title="preemption_scenario.txt"
          runnable={false}
          code={`node capacity: 4 CPU
current pods:
  batch-1 (priority 100): 2 CPU
  batch-2 (priority 100): 2 CPU
  → node full (4/4 CPU used)

new pod arrives:
  critical-api (priority 1000000): 2 CPU

scheduler decision:
  1. no room for critical-api
  2. check preemption: can I evict low-priority pods?
  3. evict batch-2 (priority 100) → frees 2 CPU
  4. schedule critical-api ✅

batch-2 is rescheduled elsewhere (or stays Pending if no room)`}
        />
        <Callout type="tip">
          💡 Combine PriorityClass + Guaranteed QoS + anti-affinity for bulletproof critical workloads: high priority (scheduled first), guaranteed resources (last evicted), spread across zones (survives AZ outage).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Scheduler phases", "1) filter impossible nodes 2) score remaining → pick highest"],
            ["Requests", "guaranteed minimum, used by SCHEDULER, can burst above if idle capacity"],
            ["Limits", "hard cap enforced at RUNTIME — CPU throttled, memory OOMKilled 💀"],
            ["QoS eviction order", "BestEffort (first) → Burstable → Guaranteed (last)"],
            ["Guaranteed QoS", "requests = limits for all containers (both CPU and memory)"],
            ["Liveness probe", "is app alive? fails → restart container 🔄"],
            ["Readiness probe", "ready for traffic? fails → remove from Service, no restart 🚫"],
            ["Startup probe", "finished booting? disables liveness until passes (for slow apps) ⏳"],
            ["Probe timing", "failureThreshold × periodSeconds = max detection time"],
            ["nodeSelector", "simple label match — node must have disktype=ssd"],
            ["nodeAffinity", "required (must) or preferred (nice-to-have) — more expressive"],
            ["podAntiAffinity", "spread replicas across nodes/zones — topologyKey: kubernetes.io/hostname"],
            ["Taints", "node repels pods by default — kubectl taint nodes node-1 gpu=true:NoSchedule"],
            ["Tolerations", "pod tolerates taint → allowed to land on tainted node"],
            ["NoExecute taint", "⚠️ evicts existing pods (unless tolerating) — drains the node"],
            ["PriorityClass", "value: 1000000 (higher wins) — scheduled first, preempts lower priority"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
