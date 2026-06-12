"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Traffic Spike Autoscaling — Live",
  nodes: [
    { id: "users", icon: "👥", label: "Users", sub: "traffic spike", x: 8, y: 40, color: "#fbbf24" },
    { id: "metrics", icon: "📊", label: "metrics-server", sub: "collects CPU/mem", x: 30, y: 20, color: "#60a5fa" },
    { id: "hpa", icon: "🎯", label: "HPA", sub: "controller", x: 50, y: 20, color: "#a78bfa" },
    { id: "deploy", icon: "🚀", label: "Deployment", sub: "3→5→3 replicas", x: 50, y: 60, color: "#22d3ee" },
    { id: "nodes", icon: "🖥️", label: "Nodes", sub: "cluster capacity", x: 75, y: 60, color: "#34d399" },
    { id: "ca", icon: "🏭", label: "Cluster Autoscaler", sub: "adds nodes", x: 88, y: 30, color: "#fb923c" },
  ],
  edges: [
    { id: "users-deploy", from: "users", to: "deploy", color: "#fbbf24" },
    { id: "deploy-metrics", from: "deploy", to: "metrics", bend: -30, color: "#60a5fa" },
    { id: "metrics-hpa", from: "metrics", to: "hpa", color: "#a78bfa" },
    { id: "hpa-deploy", from: "hpa", to: "deploy", color: "#22d3ee" },
    { id: "deploy-nodes", from: "deploy", to: "nodes", color: "#34d399" },
    { id: "nodes-ca", from: "nodes", to: "ca", color: "#fb923c" },
    { id: "ca-nodes", from: "ca", to: "nodes", bend: 40, dashed: true, color: "#fb923c" },
  ],
  flows: [
    {
      id: "scale-up",
      name: "📈 CPU spike → scale up",
      command: "CPU 80% > 50% target → replicas 3→5",
      steps: [
        { node: "users", paths: ["users-deploy"], text: "Traffic doubles. Pods at 80% CPU (above the 50% target). App slowing down." },
        { node: "hpa", paths: ["deploy-metrics", "metrics-hpa"], text: "HPA queries metrics-server every 15s. Formula: desiredReplicas = ceil(3 × 80/50) = ceil(4.8) = 5." },
        { node: "deploy", paths: ["hpa-deploy", "deploy-nodes"], text: "HPA updates Deployment to 5 replicas. Kubernetes schedules 2 new pods. CPU drops to ~48% across 5 pods. ✅" },
      ],
    },
    {
      id: "pending",
      name: "🏗️ No room → CA adds node",
      command: "pods Pending → cluster-autoscaler provisions node",
      steps: [
        { node: "deploy", paths: ["deploy-nodes"], text: "HPA scales to 8 replicas but nodes are full. 3 pods stuck in Pending (insufficient CPU)." },
        { node: "ca", paths: ["nodes-ca", "ca-nodes"], text: "Cluster Autoscaler detects Pending pods → calls cloud API (AWS/GCP/Azure) → new node added in ~2-4 min." },
        { node: "nodes", paths: ["ca-nodes", "deploy-nodes"], text: "New node joins cluster. Pending pods scheduled. Full stack autoscaling: HPA→pods, CA→nodes. 🏗️" },
      ],
    },
    {
      id: "scale-down",
      name: "📉 Traffic drops → scale down",
      command: "CPU 20% < 50% target → cooldown → replicas 5→3",
      steps: [
        { node: "hpa", paths: ["metrics-hpa"], text: "Traffic drops, CPU at 20%. Formula: ceil(5 × 20/50) = 2 replicas. But HPA waits 5 min (scale-down stabilization)." },
        { node: "deploy", paths: ["hpa-deploy"], text: "After cooldown, HPA scales to 3 replicas (not 2 — conservative). Prevents flapping. 📉" },
        { node: "ca", paths: ["nodes-ca", "ca-nodes"], text: "If a node becomes underutilized (< 50% for 10min), CA drains and deletes it. Cost savings. 💰" },
      ],
    },
  ],
};

const NAV = [
  { id: "manual", label: "Manual Scaling Recap" },
  { id: "metrics-server", label: "Metrics Server Pipeline ⭐" },
  { id: "hpa", label: "Horizontal Pod Autoscaler (HPA) ⭐" },
  { id: "hpa-config", label: "HPA Configuration Deep Dive" },
  { id: "vpa", label: "Vertical Pod Autoscaler (VPA)" },
  { id: "cluster-autoscaler", label: "Cluster Autoscaler ⭐" },
  { id: "full-chain", label: "The Full Autoscaling Chain" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sAutoscalingPage() {
  return (
    <TopicShell
      icon="📈"
      title="Kubernetes Autoscaling"
      gradientWord="Autoscaling"
      subtitle="Stop manually running kubectl scale. This topic teaches the three autoscalers: HPA (add pods when CPU/memory high), VPA (right-size requests), and Cluster Autoscaler (add nodes when pods are Pending). The full formula, the gotchas, and how they chain together to handle traffic spikes from 3 users to 3 million."
      nav={NAV}
      badges={["🎯 HPA formula", "📐 VPA vs HPA", "🏗️ Cluster Autoscaler"]}
      next={{ icon: "🔒", label: "RBAC & Security", href: "/kubernetes/rbac-security" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="manual" number="01" title="Manual Scaling Recap — Why It Doesn&apos;t Work">
        <P>
          You can scale a Deployment manually anytime:
        </P>
        <CodeBlock
          title="kubectl scale"
          output={`$ kubectl scale deployment api --replicas=10
deployment.apps/api scaled

$ kubectl get pods
NAME                   READY   STATUS
api-7f8d9c-abc12       1/1     Running
api-7f8d9c-def34       1/1     Running
...                    (10 pods total)

works great — if you're watching metrics 24/7 and adjusting manually 🥱`}
          code={`kubectl scale deployment api --replicas=10
kubectl get pods`}
        />
        <P>
          The problem: traffic is unpredictable. Monday 9am → spike. Saturday 2am → idle. Black Friday → 10× normal. Manual scaling means:
        </P>
        <CodeBlock
          title="manual_scaling_problems.txt"
          runnable={false}
          code={`❌ overprovisioned most of the time (paying for idle pods)
❌ underprovisioned during spikes (slow/crashed app)
❌ requires human in the loop (no one wants pager duty for scaling)
❌ slow reaction time (by the time you notice CPU at 90%, users
   are already experiencing slowness)

solution: AUTOSCALING — let Kubernetes watch metrics and
adjust replicas automatically 📈`}
        />
      </Section>

      {/* 02 */}
      <Section id="metrics-server" number="02" title="Metrics Server — The Data Source ⭐">
        <P>
          Autoscaling needs real-time metrics (CPU, memory). The <strong>metrics-server</strong> is a cluster addon that collects resource usage from every kubelet and exposes it via the Metrics API.
        </P>
        <CodeBlock
          title="metrics_pipeline.txt"
          runnable={false}
          code={`┌─────────────────────────────────────────────────────────────┐
│ 1. kubelet (on every node)                                  │
│    collects cgroup stats from containers (CPU, RAM used)    │
└────────────────────────┬────────────────────────────────────┘
                         │ scrapes every 15s
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. metrics-server (cluster addon)                           │
│    aggregates metrics from all kubelets                     │
│    stores in-memory (not persistent — last 1-2 data points) │
└────────────────────────┬────────────────────────────────────┘
                         │ exposes via Metrics API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. consumers                                                │
│    • kubectl top pods/nodes                                 │
│    • HPA controller (reads metrics to compute scaling)      │
│    • VPA (reads to recommend requests)                      │
│    • Dashboard UI                                           │
└─────────────────────────────────────────────────────────────┘

metrics-server is NOT a monitoring system (no history, no alerts)
for that, use Prometheus (topic: Production & GitOps)`}
        />
        <CodeBlock
          title="kubectl top (requires metrics-server)"
          output={`$ kubectl top nodes
NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
node-1    850m         21%    3.2Gi           40%
node-2    1200m        30%    2.8Gi           35%
node-3    400m         10%    1.5Gi           18%

$ kubectl top pods
NAME                   CPU(cores)   MEMORY(bytes)
api-7f8d9c-abc12       120m         256Mi
api-7f8d9c-def34       340m         512Mi   ← high CPU candidate for HPA
db-0                   50m          1.2Gi`}
          code={`kubectl top nodes
kubectl top pods`}
        />
        <Callout type="note">
          📌 Most managed Kubernetes clusters (GKE, EKS, AKS) have metrics-server pre-installed. If <IC>kubectl top</IC> returns <IC>error: Metrics API not available</IC>, install it: <IC>kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml</IC>
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="hpa" number="03" title="Horizontal Pod Autoscaler (HPA) — The Formula ⭐">
        <P>
          The <strong>HPA</strong> is a controller that watches a Deployment/ReplicaSet and adjusts its <IC>replicas</IC> based on metrics. The default metric: CPU utilization (as % of <IC>requests</IC>).
        </P>
        <CodeBlock
          title="hpa_control_loop.txt"
          runnable={false}
          code={`every 15 seconds (default):
  1. HPA queries metrics-server for current CPU/memory usage
  2. computes desired replicas with this formula:

     desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)

  3. if desiredReplicas ≠ currentReplicas:
       update Deployment.spec.replicas
     else:
       do nothing

example:
  current: 4 replicas, avg CPU = 80% (of requests)
  target: 50%
  desiredReplicas = ceil(4 × 80 / 50) = ceil(6.4) = 7
  → HPA scales deployment to 7 replicas ✅`}
        />
        <CodeBlock
          title="hpa_example.yaml"
          runnable={false}
          code={`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api   # ← the deployment to scale
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50   # target 50% CPU (of requests)
  # optional: also scale on memory
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80   # target 80% memory`}
        />
        <CodeBlock
          title="kubectl apply + watch HPA"
          output={`$ kubectl apply -f hpa_example.yaml
horizontalpodautoscaler.autoscaling/api-hpa created

$ kubectl get hpa -w
NAME      REFERENCE        TARGETS   MINPODS   MAXPODS   REPLICAS
api-hpa   Deployment/api   35%/50%   2         10        2
api-hpa   Deployment/api   75%/50%   2         10        2    ← CPU spike
api-hpa   Deployment/api   75%/50%   2         10        3    ← scaled up
api-hpa   Deployment/api   52%/50%   2         10        3
api-hpa   Deployment/api   48%/50%   2         10        3    ← stabilized ✅

# detailed view
$ kubectl describe hpa api-hpa
Metrics:            cpu: 48% (target: 50%)
Events:
  Normal   SuccessfulRescale   HPA scaled deployment from 2 to 3`}
          code={`kubectl apply -f hpa_example.yaml
kubectl get hpa -w`}
        />
        <Callout type="behind">
          🔧 <strong>Why % of requests?</strong> CPU/memory targets are percentages of the container&apos;s <IC>requests</IC>. If a pod requests 1 CPU and uses 0.8 CPU, that&apos;s 80% utilization. This is why HPA requires you to set <IC>resources.requests</IC> — without it, HPA can&apos;t compute %.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="hpa-config" number="04" title="HPA Configuration Deep Dive — Worked Example">
        <P>
          Let&apos;s walk through the formula with a real scenario:
        </P>
        <CodeBlock
          title="hpa_formula_walkthrough.txt"
          runnable={false}
          code={`SCENARIO
  deployment: 3 replicas
  each pod: requests 500m CPU (0.5 cores)
  current usage: pod-1: 400m, pod-2: 350m, pod-3: 450m
  HPA target: 50% (of requests)

STEP 1: compute current utilization %
  pod-1: 400m / 500m = 80%
  pod-2: 350m / 500m = 70%
  pod-3: 450m / 500m = 90%
  average: (80 + 70 + 90) / 3 = 80%

STEP 2: apply formula
  desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)
  desiredReplicas = ceil(3 × 80 / 50)
  desiredReplicas = ceil(3 × 1.6)
  desiredReplicas = ceil(4.8) = 5

STEP 3: HPA scales deployment to 5 replicas
  after scale-up, usage redistributes:
  5 pods × ~240m each = 1200m total (same work, more pods)
  240m / 500m = 48% utilization ✅ (below 50% target)

RESULT: traffic handled, CPU back to healthy levels`}
        />
        <P>
          HPA has sophisticated <strong>behavior controls</strong> to prevent flapping (rapid up/down cycles):
        </P>
        <CodeBlock
          title="hpa_behavior.yaml"
          runnable={false}
          code={`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  behavior:   # ← stabilization rules
    scaleUp:
      stabilizationWindowSeconds: 0   # scale up immediately (no delay)
      policies:
      - type: Percent
        value: 100   # can double replicas in one step
        periodSeconds: 15
      - type: Pods
        value: 4     # or add max 4 pods per 15s
        periodSeconds: 15
      selectPolicy: Max   # pick the more aggressive policy
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5min before scaling down
      policies:
      - type: Percent
        value: 50    # max: cut replicas in half per step
        periodSeconds: 60
      selectPolicy: Min   # pick the more conservative policy`}
        />
        <Callout type="tip">
          💡 <strong>Asymmetric scaling</strong>: scale up fast (0s stabilization) to handle spikes, scale down slow (300s) to avoid thrashing during oscillating traffic. This is the default recommended pattern.
        </Callout>
        <P>
          You can also scale on <strong>custom metrics</strong> (requests per second, queue depth) using the Prometheus Adapter or KEDA:
        </P>
        <CodeBlock
          title="hpa_custom_metric.yaml"
          runnable={false}
          code={`# requires prometheus-adapter or KEDA installed
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 50
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"   # target 1000 req/s per pod
# when traffic spikes to 5000 req/s across 2 pods (2500 each):
# desiredReplicas = ceil(2 × 2500 / 1000) = ceil(5) = 5 ✅`}
        />
      </Section>

      {/* 05 */}
      <Section id="vpa" number="05" title="Vertical Pod Autoscaler (VPA) — Right-Sizing Requests">
        <P>
          HPA adds <em>more pods</em> (horizontal). VPA adjusts the <IC>requests</IC> and <IC>limits</IC> of <em>existing</em> pods (vertical). Use it when you don&apos;t know the right resource requests upfront.
        </P>
        <CodeBlock
          title="vpa_vs_hpa.txt"
          runnable={false}
          code={`HPA (Horizontal)                 VPA (Vertical)
┌────────────────────────┐       ┌────────────────────────┐
│ adds MORE pods         │       │ adjusts REQUESTS/LIMITS│
│ based on CPU/memory %  │       │ based on actual usage  │
│ fast reaction (~15s)   │       │ slow (restarts pod!)   │
│ use for: stateless     │       │ use for: can't scale   │
│   web/API servers      │       │   horizontally (legacy │
│                        │       │   apps, singletons)    │
└────────────────────────┘       └────────────────────────┘

CRITICAL: you CANNOT use HPA + VPA on the SAME metric
  (both on CPU → conflict, HPA scales pods while VPA changes
   their size → chaos 💥)
  allowed: HPA on CPU + VPA on memory (different metrics)`}
        />
        <Table
          head={["Feature", "HPA", "VPA"]}
          rows={[
            ["Scales what?", "replicas (1→10)", "requests/limits (500m→2000m)"],
            ["Requires restart?", "no (new pods added)", "yes (pod recreated with new resources) ⚠️"],
            ["Reaction time", "~15-60s", "minutes (due to restart)"],
            ["Best for", "stateless apps, traffic spikes", "right-sizing unknown workloads, cost optimization"],
            ["Conflict", "⚠️ can't use with VPA on same metric", "⚠️ can't use with HPA on same metric"],
          ]}
        />
        <CodeBlock
          title="vpa_example.yaml"
          runnable={false}
          code={`# VPA is not built-in — install: https://github.com/kubernetes/autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  updatePolicy:
    updateMode: "Auto"   # or "Recreate" (restarts pods immediately)
                         # or "Off" (just recommends, doesn't apply)
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
      controlledResources: ["cpu", "memory"]`}
        />
        <CodeBlock
          title="kubectl get vpa"
          output={`$ kubectl get vpa
NAME      MODE   CPU     MEM       PROVIDED   AGE
api-vpa   Auto   250m    512Mi     True       2d

$ kubectl describe vpa api-vpa
Recommendation:
  Container api:
    Lower Bound:  cpu: 200m, memory: 400Mi
    Target:       cpu: 250m, memory: 512Mi   ← VPA will set requests to this
    Upper Bound:  cpu: 500m, memory: 1Gi

# VPA will restart pods one-by-one to apply new requests (⚠️ disruption)`}
          code={`kubectl get vpa
kubectl describe vpa api-vpa`}
        />
        <Callout type="mistake">
          ⚠️ VPA in <IC>Auto</IC> mode <strong>restarts pods</strong> to change their requests — this causes downtime for single-replica apps. For production, use <IC>updateMode: Off</IC> (recommendation only) and manually apply changes during maintenance windows, OR ensure multiple replicas + PodDisruptionBudget.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="cluster-autoscaler" number="06" title="Cluster Autoscaler — Adding Nodes ⭐">
        <P>
          HPA scales pods, but what if there&apos;s no room on any node? Pods stay <IC>Pending</IC>. The <strong>Cluster Autoscaler</strong> (CA) watches for Pending pods and provisions new nodes from the cloud.
        </P>
        <CodeBlock
          title="cluster_autoscaler_flow.txt"
          runnable={false}
          code={`┌─────────────────────────────────────────────────────────────┐
│ 1. HPA scales deployment to 20 replicas                     │
│    scheduler tries to place new pods → 15 fit, 5 Pending    │
│    reason: insufficient CPU on all nodes                    │
└────────────────────────┬────────────────────────────────────┘
                         │ CA detects Pending pods
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cluster Autoscaler (runs as a pod in kube-system)        │
│    reads Pending pods, simulates scheduling                 │
│    decision: "adding 1 node would fit all 5 pending pods"   │
└────────────────────────┬────────────────────────────────────┘
                         │ calls cloud API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Cloud provider (AWS/GCP/Azure)                           │
│    launches new EC2/GCE instance, joins it to cluster       │
│    time: 2-4 minutes (node boot + kubelet ready)            │
└────────────────────────┬────────────────────────────────────┘
                         │ node joins
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. scheduler places the 5 Pending pods on new node          │
│    cluster now has capacity for future spikes ✅             │
└─────────────────────────────────────────────────────────────┘

CA also SCALES DOWN: if a node is <50% utilized for 10 min,
CA drains it (evicts pods) and deletes the node → cost savings 💰`}
        />
        <Callout type="note">
          📌 Cluster Autoscaler is <strong>cloud-specific</strong>. On AWS it integrates with Auto Scaling Groups (ASG). On GCP: instance groups. On Azure: scale sets. Managed K8s clusters (EKS/GKE/AKS) have CA available as an addon — just enable it.
        </Callout>
        <CodeBlock
          title="cluster_autoscaler_config.yaml (AWS example)"
          runnable={false}
          code={`# deployed as a Deployment in kube-system namespace
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler   # needs IAM/RBAC to manage ASG
      containers:
      - name: cluster-autoscaler
        image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
        - ./cluster-autoscaler
        - --cloud-provider=aws
        - --namespace=kube-system
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        - --scale-down-delay-after-add=10m   # wait 10min after adding before removing
        - --scale-down-unneeded-time=10m     # node idle 10min → drain + delete`}
        />
        <CodeBlock
          title="kubectl logs cluster-autoscaler"
          output={`$ kubectl logs -n kube-system cluster-autoscaler-xyz
I0612 10:15:32 Pod api-abc12 is unschedulable (insufficient cpu)
I0612 10:15:32 Scale-up: group eks-nodegroup-1: 3 -> 4 nodes
I0612 10:17:45 Node ip-10-0-1-50 registered
I0612 10:18:00 Pod api-abc12 scheduled to ip-10-0-1-50 ✅

I0612 14:30:00 Node ip-10-0-1-23 is underutilized (cpu: 15%, mem: 20%)
I0612 14:40:00 Scale-down: draining node ip-10-0-1-23
I0612 14:42:00 Node ip-10-0-1-23 terminated → cost savings 💰`}
          code={`kubectl logs -n kube-system cluster-autoscaler-xyz`}
        />
        <Callout type="tip">
          💡 Set <IC>PodDisruptionBudget</IC> to prevent CA from draining nodes with critical single-replica apps. CA respects PDBs during scale-down (it won&apos;t evict a pod if it violates the budget).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="full-chain" number="07" title="The Full Autoscaling Chain — End to End">
        <P>
          Here&apos;s how all three autoscalers work together in a production cluster:
        </P>
        <CodeBlock
          title="full_autoscaling_chain.txt"
          runnable={false}
          code={`TIME    EVENT                          AUTOSCALER     ACTION
──────────────────────────────────────────────────────────────────
10:00   normal traffic: 3 pods, 40% CPU   (none)     stable ✅

10:15   traffic spike: CPU → 80%          HPA        scale 3→6 pods
        5 pods fit, 1 Pending (no room)

10:16   pod Pending (insufficient cpu)    CA         add node (2-4min)

10:19   new node joins cluster            scheduler  place Pending pod ✅
        all 6 pods running, CPU → 50%

12:00   traffic drops: CPU → 20%          HPA        wait 5min (stabilization)

12:05   still low, scale down             HPA        scale 6→3 pods

12:15   node underutilized (30% cpu)      CA         wait 10min

12:25   still underutilized               CA         drain + delete node 💰

        ─────────────────────────────────────────────────────────
        OPTIONAL: over weeks, VPA notices pods use 200m avg
                  (current requests: 500m = wasted)
                  VPA recommendation: lower requests to 250m
                  admin applies → better bin-packing, fewer nodes needed`}
        />
        <Table
          head={["Autoscaler", "Watches", "Scales", "Time to react"]}
          rows={[
            [<IC key="1">HPA</IC>, "CPU/memory % or custom metrics", "pod replicas", "15-60s"],
            [<IC key="2">VPA</IC>, "actual usage vs requests", "requests/limits (⚠️ restarts pods)", "minutes"],
            [<IC key="3">Cluster Autoscaler</IC>, "Pending pods", "nodes (cloud VMs)", "2-4 minutes"],
          ]}
        />
        <Callout type="analogy">
          🏗️ <strong>Restaurant analogy</strong>: HPA = hiring more waiters when customers flood in. VPA = adjusting each waiter&apos;s section size (how many tables they handle). Cluster Autoscaler = building a new dining room when the restaurant is full. All three together = elastic restaurant that grows/shrinks with demand.
        </Callout>
        <P>
          Finally, <strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling) is a CNCF project that extends HPA to scale based on event sources (SQS queue depth, Kafka lag, cron schedules, Prometheus queries). Install as an addon:
        </P>
        <CodeBlock
          title="keda_example.yaml"
          runnable={false}
          code={`# KEDA ScaledObject (wraps HPA + adds event-driven triggers)
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: queue-scaler
spec:
  scaleTargetRef:
    name: worker   # Deployment to scale
  minReplicaCount: 0   # ← can scale to ZERO (HPA can't)
  maxReplicaCount: 30
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.us-east-1.amazonaws.com/123/jobs
      queueLength: "5"   # target: 5 messages per pod
      awsRegion: us-east-1
# when queue has 50 messages: desiredReplicas = 50/5 = 10
# when queue empty for 5min: scale to 0 (zero cost) 💰`}
        />
      </Section>

      {/* 08 */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["metrics-server", "collects CPU/mem from kubelets → exposes Metrics API → kubectl top + HPA"],
            ["HPA formula", "desiredReplicas = ceil(current × currentMetric / targetMetric)"],
            ["HPA target", "% of requests — pod using 400m with 500m request = 80% utilization"],
            ["HPA example", "3 pods at 80% CPU, target 50% → ceil(3×80/50) = ceil(4.8) = 5 replicas"],
            ["HPA behavior", "scale up fast (0s delay), scale down slow (300s stabilization) — prevent flapping"],
            ["VPA", "adjusts requests/limits based on usage — ⚠️ RESTARTS pods (disruption)"],
            ["VPA vs HPA conflict", "⚠️ can't use both on SAME metric (CPU) — allowed: HPA on CPU + VPA on memory"],
            ["Cluster Autoscaler", "Pending pods → add nodes (2-4min cloud provision) · idle nodes → drain + delete"],
            ["CA scale-down", "node <50% util for 10min → drain pods (respects PDB) → delete → cost savings 💰"],
            ["Full chain", "HPA adds pods → pods Pending → CA adds nodes → scheduler places pods ✅"],
            ["KEDA", "event-driven autoscaling (SQS, Kafka, cron) — can scale to ZERO (HPA can't)"],
            ["kubectl top", "kubectl top nodes / kubectl top pods — requires metrics-server"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
