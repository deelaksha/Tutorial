"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "kubectl apply, Traced — Live",
  nodes: [
    { id: "you", icon: "🧑‍💻", label: "You", sub: "kubectl apply", x: 7, y: 50, color: "#22d3ee" },
    { id: "api", icon: "🎯", label: "API Server", sub: "validate & store", x: 28, y: 30, color: "#a78bfa" },
    { id: "etcd", icon: "📚", label: "etcd", sub: "desired state", x: 32, y: 75, color: "#fbbf24" },
    { id: "scheduler", icon: "🧠", label: "Scheduler", sub: "picks node", x: 55, y: 18, color: "#34d399" },
    { id: "kubelet", icon: "⚙️", label: "Kubelet", sub: "runs container", x: 75, y: 45, color: "#fb923c" },
    { id: "pod", icon: "📦", label: "Pod", sub: "Running", x: 90, y: 70, color: "#f472b6" },
  ],
  edges: [
    { id: "you-api", from: "you", to: "api", color: "#a78bfa" },
    { id: "api-etcd", from: "api", to: "etcd", color: "#fbbf24" },
    { id: "api-scheduler", from: "api", to: "scheduler", color: "#34d399" },
    { id: "scheduler-kubelet", from: "scheduler", to: "kubelet", color: "#fb923c" },
    { id: "kubelet-pod", from: "kubelet", to: "pod", color: "#f472b6" },
    { id: "etcd-api", from: "etcd", to: "api", bend: 20, dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "apply",
      name: "🚀 kubectl apply → pod",
      command: "kubectl apply -f deployment.yaml",
      steps: [
        { node: "you", paths: ["you-api"], text: "You run kubectl apply. The manifest goes to the API server — the only component you ever talk to directly." },
        { node: "api", paths: ["api-etcd"], text: "API server validates the YAML (right schema? RBAC allowed?), then writes the DESIRED state to etcd. Now it's official." },
        { node: "scheduler", paths: ["api-scheduler", "scheduler-kubelet"], text: "Scheduler watches for unassigned pods, picks node-02 (enough CPU/mem), tells API → kubelet on node-02 is assigned." },
        { node: "kubelet", paths: ["kubelet-pod"], text: "Kubelet pulls the image, starts the container, reports ACTUAL state back to API. Loop converges: desired = actual. 🎯" },
      ],
    },
    {
      id: "reconcile",
      name: "🔁 Node dies → reconcile",
      command: "node-02 crashes · pod spec says replicas: 3",
      steps: [
        { node: "pod", paths: [], text: "Node-02 dies. Kubelet stops reporting heartbeats. After ~40s, pods on that node are marked Terminating." },
        { node: "etcd", paths: ["etcd-api"], text: "Controller-manager notices: DESIRED 3 pods, ACTUAL 2 running. Gap detected. Reconciliation loop kicks in." },
        { node: "scheduler", paths: ["scheduler-kubelet"], text: "New pod created, scheduler assigns it to node-03 (node-02 still down), kubelet there starts the replacement." },
        { node: "pod", paths: ["kubelet-pod"], text: "Within 2 minutes, count returns to 3. Kubernetes self-healed WITHOUT you doing anything. That's the reconciliation loop. 🔁" },
      ],
    },
    {
      id: "scale",
      name: "📈 Scale 3→10, watch loop",
      command: "kubectl scale deployment/app --replicas=10",
      steps: [
        { node: "you", paths: ["you-api"], text: "kubectl scale changes DESIRED replica count in etcd from 3 to 10. The gap: 10 desired, 3 actual." },
        { node: "api", paths: ["api-etcd", "api-scheduler"], text: "ReplicaSet controller sees the gap, creates 7 pod definitions. Scheduler assigns them across nodes with capacity." },
        { node: "kubelet", paths: ["scheduler-kubelet", "kubelet-pod"], text: "Kubelets on each node pull images in parallel, start containers. Watch with kubectl get pods -w — count rises: 3…5…7…10." },
        { node: "pod", paths: [], text: "10/10 Running. The loop converged. Scale down works the same way: delete excess pods until actual matches desired. 📉📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Orchestration?" },
  { id: "architecture", label: "Cluster Architecture ⭐" },
  { id: "control-plane", label: "Control Plane Components" },
  { id: "worker-nodes", label: "Worker Nodes" },
  { id: "reconciliation", label: "Desired-State Reconciliation ⭐" },
  { id: "kubectl-apply", label: "What Happens on kubectl apply ⭐" },
  { id: "kubectl-essentials", label: "kubectl Essentials" },
  { id: "local-clusters", label: "Local Clusters (minikube/kind/k3s)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sFundamentalsPage() {
  return (
    <TopicShell
      icon="☸️"
      title="Kubernetes Fundamentals"
      gradientWord="Kubernetes"
      subtitle="Why orchestration matters, the cluster architecture drawn box by box (control plane + worker nodes), the desired-state reconciliation loop that makes Kubernetes self-healing, and what happens step by step when you run kubectl apply."
      nav={NAV}
      badges={["🏗️ Full architecture", "🔁 Reconciliation loop", "📦 kubectl flow"]}
      next={{ icon: "📦", label: "Pods", href: "/kubernetes/pods" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Orchestration?">
        <P>
          You&apos;ve containerized your app. Now you need to run it at scale: 100 containers across 20 servers, with zero-downtime deploys, auto-restart on crashes, load balancing, rolling updates, secrets injection, and health checks. Doing this by hand with docker run is a nightmare.
        </P>
        <CodeBlock
          title="the_problem_at_scale.txt"
          runnable={false}
          code={`MANUAL CONTAINER MANAGEMENT (SSH to 20 servers)
┌─────────────────────────────────────────────────┐
│ SERVER 1        SERVER 2        SERVER 3        │
│ 5 containers    7 containers    crashed (!)     │
│                                                  │
│ your tasks by hand:                             │
│ ✗ ssh to server-03, restart containers          │
│ ✗ rebalance: move 2 from server-2 to server-3   │
│ ✗ deploy v2: stop each container, pull new      │
│   image, start — one by one (downtime!)         │
│ ✗ one container OOMKilled → grep logs on        │
│   which server? was it server 11 or 14?         │
│ ✗ secrets as env vars in 100 shell scripts      │
│ ✗ no history: who deployed what when?           │
└─────────────────────────────────────────────────┘

KUBERNETES (declare what you want, it does the rest)
┌─────────────────────────────────────────────────┐
│ YOU              KUBERNETES                     │
│ deployment.yaml  ┌───────────────────┐          │
│ replicas: 10  ──▶│ ✓ schedules pods  │          │
│ image: app:v2    │ ✓ restarts on crash│         │
│                  │ ✓ rolling updates │          │
│                  │ ✓ load balances   │          │
│                  │ ✓ scales on demand│          │
│                  │ ✓ centralized logs│          │
│                  └───────────────────┘          │
│ you: 1 YAML file  it: 1000 decisions/minute     │
└─────────────────────────────────────────────────┘

orchestration = automation of container lifecycle at scale`}
        />
        <Callout type="analogy">
          🏗️ Think of Kubernetes as a building manager. You say &quot;I need 10 apartments kept warm, always&quot; — you don&apos;t tell the manager which boilers to turn on. The manager watches thermometers and adjusts. Kubernetes watches your app and adjusts replicas/restarts/nodes.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="architecture" number="02" title="Cluster Architecture ⭐">
        <P>
          A Kubernetes <IC>cluster</IC> = <IC>control plane</IC> (the brain) + <IC>worker nodes</IC> (the muscle). The control plane makes decisions, the nodes run your containers. Here&apos;s the full map:
        </P>
        <CodeBlock
          title="cluster_architecture.txt"
          runnable={false}
          code={`┌────────────────── KUBERNETES CLUSTER ──────────────────┐
│                                                         │
│  ┏━━━━━━━━━━━━━━━ CONTROL PLANE ━━━━━━━━━━━━━━┓        │
│  ┃  (the brain — usually 1 or 3 for HA)       ┃        │
│  ┃  ┌──────────────┐  ┌──────────────┐        ┃        │
│  ┃  │ API Server   │  │ Scheduler    │        ┃        │
│  ┃  │ kubectl ────▶│  │ assigns pods │        ┃        │
│  ┃  │ talks here   │  │ to nodes     │        ┃        │
│  ┃  └──────┬───────┘  └──────────────┘        ┃        │
│  ┃         │                                   ┃        │
│  ┃  ┌──────▼────────────────┐  ┌────────────┐ ┃        │
│  ┃  │ etcd (key-value DB)   │  │ Controller │ ┃        │
│  ┃  │ DESIRED state lives   │  │ Manager    │ ┃        │
│  ┃  │ here (the source of   │  │ reconcile  │ ┃        │
│  ┃  │ truth) — replicas: 3  │  │ loops      │ ┃        │
│  ┃  └───────────────────────┘  └────────────┘ ┃        │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛        │
│                      │                                  │
│                      ▼ (API calls)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │ WORKER NODE 1                                  │    │
│  │  ┌───────────────────────────────────────┐    │    │
│  │  │ Kubelet (node agent)                  │    │    │
│  │  │ • watches API for "run pod X here"    │    │    │
│  │  │ • tells container runtime to start it │    │    │
│  │  │ • reports status back to API          │    │    │
│  │  └───────────────────────────────────────┘    │    │
│  │  ┌───────────────────────────────────────┐    │    │
│  │  │ Container Runtime (containerd/CRI-O)  │    │    │
│  │  │ pulls images, runs containers         │    │    │
│  │  └───────────────────────────────────────┘    │    │
│  │  ┌───────────────────────────────────────┐    │    │
│  │  │ kube-proxy (network rules)            │    │    │
│  │  │ routes Service traffic to pods        │    │    │
│  │  └───────────────────────────────────────┘    │    │
│  │                                                │    │
│  │  📦 Pod A    📦 Pod B    📦 Pod C             │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │ WORKER NODE 2     (same components)            │    │
│  │  📦 Pod D    📦 Pod E                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘

YOU talk to: API server (via kubectl)
API server talks to: etcd + scheduler + controller-manager
Scheduler talks to: API (assigns pods to nodes)
Kubelet (on each node) talks to: API (gets work, reports status)
                                  container runtime (starts pods)`}
        />
      </Section>

      {/* 03 */}
      <Section id="control-plane" number="03" title="Control Plane Components">
        <P>The control plane has 4 key processes (often on the same machine, or spread across 3 for HA):</P>
        <Table
          head={["Component", "Job", "Analogy"]}
          rows={[
            [
              <IC key="1">kube-apiserver</IC>,
              "The ONLY component you (or any other component) talk to. REST API, authentication, authorization. Every kubectl command hits this.",
              "The receptionist — all requests go through them.",
            ],
            [
              <IC key="2">etcd</IC>,
              "Distributed key-value database. Stores the entire cluster state — the DESIRED state of every resource (pods, services, secrets…). If etcd dies, you lose the cluster's memory.",
              "The filing cabinet. Everything is written here.",
            ],
            [
              <IC key="3">kube-scheduler</IC>,
              "Watches for newly created pods with no assigned node. Picks the best node (based on CPU/mem requests, affinity rules, taints). Tells API server 'run pod X on node Y'.",
              "The HR hiring manager — matches jobs (pods) to workers (nodes).",
            ],
            [
              <IC key="4">kube-controller-manager</IC>,
              "Runs controller loops: ReplicaSet controller (keep N pods running), Node controller (detect node failures), Job controller, etc. Constantly compares DESIRED vs ACTUAL and fixes gaps.",
              "The building inspector — walks around ensuring everything matches the blueprint.",
            ],
          ]}
        />
        <Callout type="behind">
          🔍 etcd uses the Raft consensus algorithm — a majority of nodes (quorum) must agree on writes. That&apos;s why production control planes run 3 or 5 etcd instances (odd numbers avoid split-brain). Lose the quorum → cluster is read-only until restored.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="worker-nodes" number="04" title="Worker Nodes">
        <P>Every worker node runs 3 things:</P>
        <CodeBlock
          title="worker_node_internals.txt"
          runnable={false}
          code={`WORKER NODE
┌────────────────────────────────────────────┐
│ 1. KUBELET (the node agent)                │
│    • registers node with API server        │
│    • watches API: "any pods assigned to me?"│
│    • tells container runtime to start/stop │
│    • mounts volumes                         │
│    • reports pod status (Running/Failed)    │
│    • runs liveness/readiness probes         │
│                                             │
│ 2. CONTAINER RUNTIME (containerd/CRI-O)    │
│    • pulls images from registry            │
│    • runs containers (used to be Docker,   │
│      now containerd via CRI interface)     │
│    • manages container lifecycle           │
│                                             │
│ 3. KUBE-PROXY (network plumbing)           │
│    • maintains iptables/IPVS rules         │
│    • routes traffic from Service VIP to    │
│      backend pod IPs                       │
│    • handles load balancing across pods    │
│                                             │
│ PODS running here ───────────────────────  │
│   📦 app-7d4f8-xyz   📦 db-9k3l2-abc      │
└────────────────────────────────────────────┘`}
        />
        <Callout type="tip">
          💡 You can run a cluster with control plane + worker on the SAME machine (minikube does this). In production, control plane nodes are often tainted to NOT run user workloads — they just orchestrate.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="reconciliation" number="05" title="The Desired-State Reconciliation Loop ⭐">
        <P>
          This is THE core idea of Kubernetes: you declare DESIRED state (&quot;I want 3 replicas of this pod&quot;), Kubernetes continuously compares it to ACTUAL state, and automatically fixes any drift. It&apos;s a self-healing control loop.
        </P>
        <CodeBlock
          title="reconciliation_loop.txt"
          runnable={false}
          code={`THE RECONCILIATION LOOP (runs every few seconds)

┌─────────────────────────────────────────────────┐
│ ETCD (desired state)                            │
│ "replicas: 3"  "image: app:v2"                  │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ CONTROLLER watches actual state                │
│ (asks API: how many pods are Running?)         │
└────────┬───────────────────────────────────────┘
         │
         ▼
     ┌───────┐
     │ GAP?  │  desired 3, actual 2 → CREATE 1 pod
     └───┬───┘  desired 3, actual 5 → DELETE 2 pods
         │      desired = actual     → do nothing
         ▼
┌────────────────────────────────────────────────┐
│ CONTROLLER takes action (via API)              │
│ • creates missing pods                          │
│ • deletes excess pods                           │
│ • replaces failed pods                          │
└────────┬───────────────────────────────────────┘
         │
         ▼ (loop repeats forever)
     back to check

EXAMPLE: node crashes
┌──────────────────────────────────────────────┐
│ time  desired  actual  controller action     │
│ t=0   3        3       ✓ all good            │
│ t=10  3        3       ✓ still good          │
│ t=20  3        2 (!)   node-02 died,         │
│                        1 pod lost             │
│                        → create new pod,      │
│                          assign to node-03    │
│ t=30  3        2       new pod Pending        │
│                        (image pulling)        │
│ t=50  3        3       ✓ converged            │
└──────────────────────────────────────────────┘

you NEVER manually restart that pod — the loop does it`}
        />
        <Callout type="analogy">
          🌡️ It&apos;s a thermostat. You set desired temp to 72°F. Room drops to 68°F → heater turns on automatically. Reaches 72°F → heater turns off. Kubernetes is a thermostat for your infrastructure.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="kubectl-apply" number="06" title="What Happens on kubectl apply ⭐">
        <P>Let&apos;s trace a single command end to end through the cluster:</P>
        <CodeBlock
          title="deployment.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
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
          code={`kubectl apply -f deployment.yaml`}
          output={`deployment.apps/nginx created`}
        />
        <CodeBlock
          title="what_just_happened_step_by_step.txt"
          runnable={false}
          code={`STEP-BY-STEP (10 seconds, 6 components involved)

1️⃣ YOU → API SERVER
   kubectl reads deployment.yaml, sends HTTP POST to API server
   (default: https://127.0.0.1:6443 or your cluster IP)

2️⃣ API SERVER validates
   • is the YAML schema correct? (kind: Deployment exists?)
   • authentication: who are you? (kubeconfig certs)
   • authorization: can you create Deployments? (RBAC check)
   ✅ all pass

3️⃣ API SERVER → ETCD
   writes the Deployment object to etcd:
     /registry/deployments/default/nginx: {spec: replicas:2 …}
   this is now the DESIRED state, official record

4️⃣ DEPLOYMENT CONTROLLER (part of controller-manager) notices
   "new Deployment created → I need to create a ReplicaSet"
   tells API: create ReplicaSet nginx-7d4f8bf with 2 pod templates

5️⃣ REPLICASET CONTROLLER notices
   "new ReplicaSet, 0 pods exist, need 2"
   tells API: create 2 Pods (nginx-7d4f8bf-abc, nginx-7d4f8bf-xyz)

6️⃣ SCHEDULER notices
   "2 new Pods, no node assigned"
   picks nodes: node-1 has space for pod-abc, node-2 for pod-xyz
   tells API: bind pod-abc to node-1, pod-xyz to node-2

7️⃣ KUBELET on node-1 notices (watches API every few sec)
   "pod-abc assigned to me!"
   tells container runtime: pull image nginx:1.25, start container
   reports back: pod-abc status = Running

8️⃣ KUBELET on node-2 does the same
   pod-xyz now Running

9️⃣ YOU check:
   kubectl get pods
   NAME                    READY   STATUS
   nginx-7d4f8bf-abc       1/1     Running
   nginx-7d4f8bf-xyz       1/1     Running

all 9 steps happened in ~10 seconds, zero manual intervention
after step 3 🚀`}
        />
        <Callout type="tip">
          💡 Add <IC>--v=8</IC> to any kubectl command to see the raw HTTP requests it makes to the API server. Try <IC>kubectl get pods --v=8</IC> — you&apos;ll see GET /api/v1/namespaces/default/pods with full headers. Great for debugging auth issues.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="kubectl-essentials" number="07" title="kubectl Essentials">
        <P>kubectl is your CLI to the API server. The pattern: <IC>kubectl [verb] [resource]</IC>.</P>
        <Table
          head={["Command", "What it does"]}
          rows={[
            [<IC key="1">kubectl get pods</IC>, "list all pods (add -o wide for IPs/nodes, -o yaml for full spec)"],
            [<IC key="2">kubectl describe pod nginx-abc</IC>, "detailed info: events, status, why it failed"],
            [<IC key="3">kubectl logs nginx-abc</IC>, "stdout/stderr from the container (add -f to tail, -p for previous crashed container)"],
            [<IC key="4">kubectl exec -it nginx-abc -- /bin/bash</IC>, "SSH into the container (for debugging)"],
            [<IC key="5">kubectl apply -f file.yaml</IC>, "create or update resources (idempotent)"],
            [<IC key="6">kubectl delete pod nginx-abc</IC>, "delete (if part of a Deployment, it'll recreate — kill the Deployment instead)"],
            [<IC key="7">kubectl get all</IC>, "pods + services + deployments in one view"],
            [<IC key="8">kubectl get events --sort-by=.metadata.creationTimestamp</IC>, "cluster event log (pod scheduled, image pulled, failed, etc.)"],
          ]}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl get pods -o wide`}
          output={`NAME                    READY   STATUS    IP           NODE
nginx-7d4f8bf-abc       1/1     Running   10.244.1.5   node-1
nginx-7d4f8bf-xyz       1/1     Running   10.244.2.8   node-2`}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: <IC>kubectl delete pod my-app-abc</IC> when my-app is managed by a Deployment. The pod disappears for 3 seconds, then the ReplicaSet controller creates a replacement (reconciliation loop!). To truly remove it, delete the Deployment: <IC>kubectl delete deployment my-app</IC>.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="local-clusters" number="08" title="Local Clusters for Learning">
        <P>
          You don&apos;t need cloud VMs to learn Kubernetes. These tools run a full cluster on your laptop:
        </P>
        <Table
          head={["Tool", "Best for", "Setup"]}
          rows={[
            [
              <IC key="1">minikube</IC>,
              "Easiest start — single-node cluster in a VM or Docker container, built-in dashboard, supports LoadBalancer services locally.",
              <IC key="1b">brew install minikube && minikube start</IC>,
            ],
            [
              <IC key="2">kind (Kubernetes IN Docker)</IC>,
              "Fast multi-node clusters as Docker containers. Great for CI/CD testing. Lightweight.",
              <IC key="2b">brew install kind && kind create cluster</IC>,
            ],
            [
              <IC key="3">k3s</IC>,
              "Production-grade lightweight K8s (uses 512MB RAM vs 2GB+). Runs on Raspberry Pi, edge devices. Single binary.",
              <IC key="3b">curl -sfL https://get.k3s.io | sh -</IC>,
            ],
            [
              <IC key="4">Docker Desktop</IC>,
              "If you already have Docker Desktop, enable Kubernetes in settings. Single-node, easy.",
              "Settings → Kubernetes → Enable",
            ],
          ]}
        />
        <CodeBlock
          title="terminal (example: minikube)"
          code={`minikube start
kubectl get nodes`}
          output={`😄  minikube v1.32.0 on Darwin 14.1
✨  Using the docker driver
🎉  minikube cluster created!

NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   12s   v1.28.3`}
        />
        <Callout type="tip">
          💡 For this course, use <IC>minikube</IC> or <IC>kind</IC>. Teardown is instant: <IC>minikube delete</IC> — no cloud bills, no leftover VMs. You&apos;ll deploy and destroy clusters 20 times while learning; local is perfect.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Orchestration", "automate container lifecycle at scale (schedule, restart, scale, update)"],
            ["Cluster", "control plane (brain) + worker nodes (muscle)"],
            ["Control plane", "API server + etcd + scheduler + controller-manager"],
            ["API server", "the ONLY component you talk to — REST API, auth, validation"],
            ["etcd", "key-value DB — stores DESIRED state of entire cluster"],
            ["Scheduler", "assigns pods to nodes (based on resources, affinity, taints)"],
            ["Kubelet", "node agent — starts containers, reports status to API server"],
            ["Reconciliation loop", "compare DESIRED (etcd) vs ACTUAL → fix the gap automatically"],
            ["kubectl apply flow", "you → API → etcd → controller → scheduler → kubelet → pod Running"],
            ["kubectl logs pod-x", "see stdout/stderr (add -f to tail, -p for previous crash)"],
            ["kubectl describe pod-x", "detailed events — WHY did it fail?"],
            ["Local clusters", "minikube (easiest) · kind (fast multi-node) · k3s (lightweight)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
