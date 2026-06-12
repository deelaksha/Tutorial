"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Service Routing — Live",
  nodes: [
    { id: "client", icon: "📱", label: "Client Pod", sub: "makes request", x: 8, y: 50, color: "#22d3ee" },
    { id: "dns", icon: "🔍", label: "CoreDNS", sub: "resolves name", x: 25, y: 25, color: "#a78bfa" },
    { id: "svc", icon: "🎯", label: "Service VIP", sub: "10.96.10.20", x: 45, y: 50, color: "#fbbf24" },
    { id: "pod-a", icon: "📦", label: "Pod A", sub: "10.244.1.5", x: 70, y: 18, color: "#34d399" },
    { id: "pod-b", icon: "📦", label: "Pod B", sub: "10.244.2.8", x: 70, y: 50, color: "#34d399" },
    { id: "pod-c", icon: "📦", label: "Pod C", sub: "10.244.1.9", x: 70, y: 78, color: "#f87171" },
  ],
  edges: [
    { id: "client-dns", from: "client", to: "dns", color: "#a78bfa" },
    { id: "dns-svc", from: "dns", to: "svc", color: "#fbbf24" },
    { id: "svc-a", from: "svc", to: "pod-a", color: "#34d399" },
    { id: "svc-b", from: "svc", to: "pod-b", color: "#34d399" },
    { id: "svc-c", from: "svc", to: "pod-c", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "🎯 DNS → VIP → healthy pod",
      command: "curl http://api-service/users",
      steps: [
        { node: "client", paths: ["client-dns"], text: "Client pod requests 'api-service' (no IP hardcoded). CoreDNS resolves: api-service.default.svc.cluster.local → 10.96.10.20 (Service VIP)." },
        { node: "svc", paths: ["svc-a", "svc-b"], text: "Service VIP is virtual — kube-proxy iptables rules intercept it, pick a random healthy backend pod (A or B, both Ready)." },
        { node: "pod-b", paths: [], text: "Pod B selected (round-robin). Request routed to 10.244.2.8:8080 (pod's real IP). Response flows back. Load balanced across healthy pods. ✅" },
      ],
    },
    {
      id: "pod-dies",
      name: "🩹 Pod dies → endpoints update",
      command: "pod-b crashes",
      steps: [
        { node: "pod-b", paths: [], text: "Pod B crashes (or readiness probe fails). Kubelet reports status to API server: pod-b NOT Ready." },
        { node: "svc", paths: ["svc-c"], text: "Endpoints controller removes pod-b from Service endpoints. kube-proxy updates iptables: only pod-a, pod-c in rotation now." },
        { node: "pod-a", paths: ["svc-a"], text: "New requests to Service VIP → only healthy pods (A, C). Traffic automatically avoids failed pod. Self-healing routing. 🩹" },
      ],
    },
    {
      id: "selector-typo",
      name: "❌ Selector typo → zero endpoints",
      command: "kubectl describe service api-service",
      steps: [
        { node: "svc", paths: [], text: "Service selector: app=api-server (typo!). Pods have label: app=api. Label mismatch → Service has ZERO endpoints." },
        { node: "client", paths: ["client-dns", "dns-svc"], text: "Client resolves DNS → gets VIP 10.96.10.20. Sends request → connection refused (no backends). Timeout." },
        { node: "svc", paths: [], text: "kubectl describe service shows 'Endpoints: <none>'. Debug: kubectl get pods --show-labels, check selector vs labels. Fix typo, re-apply. 🔧" },
      ],
    },
  ],
};

const NAV = [
  { id: "problem", label: "The Problem: Pod IPs Are Ephemeral ⭐" },
  { id: "service-concept", label: "Service = Stable VIP + Selector" },
  { id: "endpoints", label: "Endpoints / EndpointSlice" },
  { id: "service-types", label: "Service Types (ClusterIP/NodePort/LB) ⭐" },
  { id: "kube-proxy", label: "kube-proxy (iptables magic)" },
  { id: "coredns", label: "CoreDNS — Service Discovery ⭐" },
  { id: "headless", label: "Headless Services" },
  { id: "debug-flow", label: "Debugging Service-Not-Working ⭐" },
  { id: "external-name", label: "ExternalName Services" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sServicesPage() {
  return (
    <TopicShell
      icon="🌐"
      title="Services & Networking"
      gradientWord="Services"
      subtitle="The problem: pod IPs are ephemeral. Service = stable VIP + label selector. ClusterIP vs NodePort vs LoadBalancer drawn, kube-proxy iptables magic, CoreDNS resolution (my-svc.my-ns.svc.cluster.local), and the service-not-working debug flowchart."
      nav={NAV}
      badges={["🎯 Stable VIP", "🔍 DNS discovery", "🐛 Debug checklist"]}
      next={{ icon: "🚪", label: "Ingress", href: "/kubernetes/ingress" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="problem" number="01" title="The Problem: Pod IPs Are Ephemeral ⭐">
        <P>
          Pods get IP addresses (e.g., 10.244.1.5), but those IPs are NOT stable. When a pod dies and is recreated, it gets a NEW IP. You can&apos;t hardcode pod IPs in your app — they&apos;re moving targets.
        </P>
        <CodeBlock
          title="the_ip_problem.txt"
          runnable={false}
          code={`SCENARIO: frontend → backend communication

WITHOUT Service (broken):
┌────────────────────────────────────────────────┐
│ frontend pod                                   │
│   config: BACKEND_URL=http://10.244.1.5:8080  │ ← hardcoded IP
│                                                │
│ backend pod crashes                            │
│   old IP: 10.244.1.5 (dead)                    │
│   new IP: 10.244.2.9 (replacement pod)         │
│                                                │
│ frontend still sends requests to 10.244.1.5    │
│ → connection refused ❌                        │
└────────────────────────────────────────────────┘

WITH Service (correct):
┌────────────────────────────────────────────────┐
│ Service "backend"                              │
│   cluster IP: 10.96.10.20 (STABLE, never changes)│
│   selector: app=backend                        │
│   └─▶ routes to ANY pod with label app=backend│
│                                                │
│ frontend pod                                   │
│   config: BACKEND_URL=http://backend:8080     │ ← DNS name
│   (resolves to 10.96.10.20 via CoreDNS)        │
│                                                │
│ backend pod crashes, new pod created           │
│   Service automatically updates endpoints      │
│   frontend unaware — still hits "backend"      │
│   Service routes to healthy pod ✅             │
└────────────────────────────────────────────────┘

Service = stable DNS name + stable virtual IP (VIP)
         that tracks changing pod IPs behind the scenes`}
        />
        <Callout type="analogy">
          📞 A Service is like a company phone number. Employees (pods) come and go, but the main number stays the same. The receptionist (kube-proxy) routes calls to whoever&apos;s available. Customers (other pods) never need to know employee direct lines.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="service-concept" number="02" title="Service = Stable VIP + Label Selector">
        <P>
          A <IC>Service</IC> has a stable cluster IP (VIP) and uses a <IC>selector</IC> to find backend pods. Any pod matching the selector labels becomes a backend.
        </P>
        <CodeBlock
          title="service_anatomy.txt"
          runnable={false}
          code={`SERVICE SPEC
┌────────────────────────────────────────────────┐
│ apiVersion: v1                                 │
│ kind: Service                                  │
│ metadata:                                      │
│   name: backend            ← DNS name          │
│ spec:                                          │
│   selector:                                    │
│     app: backend           ← FIND pods with    │
│                               this label       │
│   ports:                                       │
│   - port: 80               ← Service listens here│
│     targetPort: 8080       ← forwards to pods' │
│                               port 8080        │
└────────────────────────────────────────────────┘

MATCHING PODS (any pod with label app=backend)
┌────────────────────────────────────────────────┐
│ Pod backend-abc                                │
│   labels: app=backend ✅                       │
│   IP: 10.244.1.5                               │
│   port 8080 listening                          │
│                                                │
│ Pod backend-xyz                                │
│   labels: app=backend ✅                       │
│   IP: 10.244.2.8                               │
│   port 8080 listening                          │
└────────────────────────────────────────────────┘

Service gets cluster IP (auto-assigned):
  backend.default.svc.cluster.local → 10.96.10.20

traffic flow:
  client → 10.96.10.20:80 (Service VIP)
        → load balanced to 10.244.1.5:8080 OR 10.244.2.8:8080
          (random pick among healthy pods)`}
        />
        <CodeBlock
          title="service.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend          # matches pods with label app=backend
  ports:
  - protocol: TCP
    port: 80              # Service exposes port 80
    targetPort: 8080      # forwards to pod port 8080
  type: ClusterIP         # default (internal-only VIP)`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f service.yaml
kubectl get service backend`}
          output={`service/backend created

NAME      TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)
backend   ClusterIP   10.96.10.20    <none>        80/TCP`}
        />
      </Section>

      {/* 03 */}
      <Section id="endpoints" number="03" title="Endpoints / EndpointSlice">
        <P>
          Behind the scenes, Kubernetes creates an <IC>Endpoints</IC> object (or <IC>EndpointSlice</IC> in newer clusters) listing all matching pod IPs + ports. kube-proxy watches this.
        </P>
        <CodeBlock
          title="terminal"
          code={`kubectl get endpoints backend`}
          output={`NAME      ENDPOINTS                      AGE
backend   10.244.1.5:8080,10.244.2.8:8080   5m`}
        />
        <CodeBlock
          title="terminal (describe for details)"
          code={`kubectl describe endpoints backend`}
          output={`Name:         backend
Namespace:    default
Subsets:
  Addresses:          10.244.1.5,10.244.2.8
  NotReadyAddresses:  <none>
  Ports:
    Name     Port  Protocol
    ----     ----  --------
    <unset>  8080  TCP`}
        />
        <P>
          If a pod&apos;s readiness probe fails, it moves from <IC>Addresses</IC> to <IC>NotReadyAddresses</IC> — kube-proxy stops sending traffic to it. When the probe passes, it moves back. Automatic.
        </P>
      </Section>

      {/* 04 */}
      <Section id="service-types" number="04" title="Service Types — ClusterIP / NodePort / LoadBalancer ⭐">
        <P>
          Services have 4 types. <IC>ClusterIP</IC> (default) is internal-only. The others expose externally:
        </P>
        <CodeBlock
          title="service_types.txt"
          runnable={false}
          code={`1. CLUSTERIP (default) — internal-only VIP
┌────────────────────────────────────────────────┐
│ CLUSTER                                        │
│  ┌────────┐       ┌────────────────┐          │
│  │ pod A  │──────▶│ Service VIP    │──▶ pods  │
│  └────────┘       │ 10.96.10.20    │          │
│                   └────────────────┘          │
│ accessible ONLY from inside cluster            │
│ use for: backend APIs, databases (internal)    │
└────────────────────────────────────────────────┘

2. NODEPORT — exposes on EVERY node's IP:port
┌────────────────────────────────────────────────┐
│ CLUSTER                                        │
│  NODE 1                  NODE 2                │
│  public IP: 1.2.3.4      public IP: 5.6.7.8    │
│  :30080 ───────┐         :30080 ───────┐       │
│                ▼                        ▼       │
│           ┌────────────────┐                   │
│           │ Service VIP    │──▶ pods           │
│           └────────────────┘                   │
│                                                │
│ clients hit ANY node IP:30080 → routed to pods │
│ NodePort range: 30000-32767 (configurable)     │
│ use for: dev/test external access, cheap LB    │
└────────────────────────────────────────────────┘

3. LOADBALANCER — provisions cloud load balancer
┌────────────────────────────────────────────────┐
│ CLOUD (AWS/GCP/Azure)                          │
│  ┌──────────────────────┐                      │
│  │ Cloud Load Balancer  │  public IP: 5.6.7.8  │
│  │ (ELB / ALB / NLB)    │                      │
│  └──────────┬───────────┘                      │
│             ▼                                  │
│  CLUSTER                                       │
│   NodePort :30080 on all nodes                 │
│             ▼                                  │
│        ┌────────────────┐                      │
│        │ Service VIP    │──▶ pods              │
│        └────────────────┘                      │
│                                                │
│ cloud controller provisions LB automatically   │
│ COST: $10-30/month PER LoadBalancer service    │
│ use for: production external access            │
└────────────────────────────────────────────────┘

4. EXTERNALNAME — DNS CNAME alias (no proxy)
┌────────────────────────────────────────────────┐
│ Service "external-db"                          │
│   type: ExternalName                           │
│   externalName: db.example.com                 │
│                                                │
│ pod requests "external-db" → DNS returns       │
│   CNAME db.example.com → pod connects directly │
│                                                │
│ use for: aliasing external services            │
└────────────────────────────────────────────────┘`}
        />
        <Table
          head={["Type", "Exposes", "Use case", "Cost"]}
          rows={[
            [<IC key="1">ClusterIP</IC>, "Internal VIP only", "Backend APIs, databases (internal communication)", "Free"],
            [<IC key="2">NodePort</IC>, "Every node IP:high-port", "Dev/test, cheap external access (manual DNS to nodes)", "Free"],
            [<IC key="3">LoadBalancer</IC>, "Cloud LB with public IP", "Production external traffic (one LB per Service!)", "$10-30/mo each"],
            [<IC key="4">ExternalName</IC>, "DNS CNAME alias", "Point internal name to external service", "Free"],
          ]}
        />
        <CodeBlock
          title="nodeport-service.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080      # optional (auto-assigned 30000-32767 if omitted)`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f nodeport-service.yaml
kubectl get service frontend`}
          output={`NAME       TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)
frontend   NodePort   10.96.20.15    <none>        80:30080/TCP

access from outside: http://<any-node-ip>:30080`}
        />
        <CodeBlock
          title="loadbalancer-service.yaml (cloud only)"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080`}
        />
        <CodeBlock
          title="terminal (on cloud cluster)"
          code={`kubectl apply -f loadbalancer-service.yaml
kubectl get service web --watch`}
          output={`NAME   TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
web    LoadBalancer   10.96.30.10    <pending>     80:31234/TCP
(wait 1-2 min for cloud LB provisioning…)
web    LoadBalancer   10.96.30.10    52.1.2.3      80:31234/TCP

access: http://52.1.2.3`}
        />
        <Callout type="tip">
          💡 On local clusters (minikube/kind), LoadBalancer stays <IC>&lt;pending&gt;</IC> forever (no cloud controller). Use <IC>minikube tunnel</IC> to simulate it, or just use NodePort for local dev.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="kube-proxy" number="05" title="kube-proxy — The iptables Magic">
        <P>
          How does the Service VIP actually work? <IC>kube-proxy</IC> (running on every node) watches the API server for Services + Endpoints, then programs <IC>iptables</IC> (or IPVS) rules to intercept and redirect traffic.
        </P>
        <CodeBlock
          title="kube_proxy_flow.txt"
          runnable={false}
          code={`BEHIND THE SCENES (iptables mode, default)

1. Service created: backend, VIP 10.96.10.20
2. kube-proxy (on EVERY node) sees it, creates iptables rules:
   "if destination IP = 10.96.10.20:80, DNAT to
    random(10.244.1.5:8080, 10.244.2.8:8080)"

3. pod sends request: curl http://10.96.10.20:80
4. kernel iptables intercepts (PREROUTING chain)
5. picks random backend: 10.244.2.8:8080
6. DNAT rewrites packet: dest IP changed to 10.244.2.8:8080
7. packet routed to pod-b
8. response flows back (SNAT applied automatically)

the VIP 10.96.10.20 DOESN'T EXIST as a real interface
— it's a virtual IP that iptables intercepts

modes:
• iptables (default) — userspace rules, ~5k services scale
• ipvs — kernel load balancer, ~100k services, lower latency
• userspace (legacy, deprecated)`}
        />
        <Callout type="behind">
          🔍 Run <IC>sudo iptables-save | grep backend</IC> on a node to see the actual rules kube-proxy created. You&apos;ll see KUBE-SERVICES, KUBE-SEP (service endpoint) chains with DNAT targets. It&apos;s low-level networking magic you never need to touch — but it&apos;s cool to see once.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="coredns" number="06" title="CoreDNS — Service Discovery by Name ⭐">
        <P>
          Hardcoding IPs (even Service VIPs) is brittle. Use DNS names. <IC>CoreDNS</IC> runs as a pod in kube-system, provides DNS for the cluster.
        </P>
        <CodeBlock
          title="dns_resolution.txt"
          runnable={false}
          code={`DNS NAME FORMAT
<service>.<namespace>.svc.cluster.local

examples:
  backend                                → backend.default.svc.cluster.local
  backend.default                        → backend.default.svc.cluster.local
  backend.default.svc.cluster.local      → full FQDN (always works)
  postgres.prod                          → postgres.prod.svc.cluster.local
  postgres.prod.svc.cluster.local        → full FQDN

WITHIN THE SAME NAMESPACE: just use service name
┌────────────────────────────────────────────────┐
│ namespace: default                             │
│  frontend pod:                                 │
│    curl http://backend/api   ← short name      │
│    CoreDNS appends .default.svc.cluster.local  │
│    resolves to 10.96.10.20 (Service VIP)       │
└────────────────────────────────────────────────┘

CROSS-NAMESPACE: include namespace
┌────────────────────────────────────────────────┐
│ namespace: prod                                │
│  app pod:                                      │
│    curl http://postgres.data/query             │
│                     ^^^^^^^^ namespace         │
│    resolves postgres service in "data" ns      │
└────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="terminal (test DNS from a pod)"
          code={`kubectl run test --rm -it --image=busybox -- sh
# nslookup backend`}
          output={`Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      backend
Address 1: 10.96.10.20 backend.default.svc.cluster.local`}
        />
        <CodeBlock
          title="terminal"
          code={`# curl http://backend
(connects to 10.96.10.20 → load balanced to pods)`}
        />
        <Callout type="tip">
          💡 In your app config, use DNS names, not IPs: <IC>BACKEND_URL=http://backend</IC> (same namespace) or <IC>http://api.prod</IC> (cross-namespace). Kubernetes DNS handles the rest.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="headless" number="07" title="Headless Services — Direct Pod IPs">
        <P>
          Normally, DNS returns the Service VIP. A <IC>headless service</IC> (clusterIP: None) makes DNS return ALL pod IPs instead. Use when you need to talk to specific pods (e.g., StatefulSet members).
        </P>
        <CodeBlock
          title="headless-service.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None        # headless (no VIP assigned)
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f headless-service.yaml
kubectl get service postgres`}
          output={`NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)
postgres   ClusterIP   None         <none>        5432/TCP`}
        />
        <CodeBlock
          title="terminal (DNS lookup)"
          code={`kubectl run test --rm -it --image=busybox -- nslookup postgres`}
          output={`Name:      postgres
Address 1: 10.244.1.5 postgres-0.postgres.default.svc.cluster.local
Address 2: 10.244.2.8 postgres-1.postgres.default.svc.cluster.local
Address 3: 10.244.1.9 postgres-2.postgres.default.svc.cluster.local

(returns pod IPs, not a VIP — app gets all 3, picks which to connect to)`}
        />
        <P>
          StatefulSets + headless service → each pod gets DNS: <IC>postgres-0.postgres.default.svc.cluster.local</IC> (stable per-pod DNS).
        </P>
      </Section>

      {/* 08 */}
      <Section id="debug-flow" number="08" title="Debugging &quot;Service Not Working&quot; ⭐">
        <P>
          Service issues are common. Follow this checklist:
        </P>
        <CodeBlock
          title="debug_checklist.txt"
          runnable={false}
          code={`SERVICE NOT REACHABLE — DEBUG STEPS

1️⃣ Does the Service exist?
   kubectl get service <name>
   → if not found, typo in name or wrong namespace

2️⃣ Does it have endpoints?
   kubectl get endpoints <name>
   → if "Endpoints: <none>":
      - check Service selector: kubectl describe service <name>
      - check pod labels: kubectl get pods --show-labels
      - selector MUST match pod labels exactly (typos!)

3️⃣ Are the pods Ready?
   kubectl get pods
   → if pods exist but NOT Ready, they won't be in endpoints
   → fix pod issues first (describe/logs)

4️⃣ Is the port mapping correct?
   Service spec:
     port: 80 (what clients connect to)
     targetPort: 8080 (what pod listens on)
   → if targetPort wrong, traffic hits closed port on pod

5️⃣ Can you reach the pod directly (bypass Service)?
   kubectl get pods -o wide  (get pod IP)
   kubectl run test --rm -it --image=busybox -- wget -O- http://10.244.1.5:8080
   → if this works, problem is Service config
   → if this fails, problem is pod app itself

6️⃣ DNS resolution working?
   kubectl run test --rm -it --image=busybox -- nslookup <service-name>
   → should return Service VIP (or pod IPs if headless)
   → if "can't resolve", CoreDNS issue (rare)

7️⃣ Is the Service type correct?
   ClusterIP: internal only (can't access from laptop)
   NodePort/LoadBalancer: external access`}
        />
        <Callout type="mistake">
          ⚠️ #1 mistake: Service selector doesn&apos;t match pod labels. <IC>selector: app=backend</IC> but pods have <IC>app=backend-api</IC> → zero endpoints. Always check: <IC>kubectl get pods --show-labels</IC> and compare to <IC>kubectl describe service</IC> selector.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="external-name" number="09" title="ExternalName Services">
        <P>
          <IC>ExternalName</IC> type creates a DNS CNAME alias to an external service (e.g., cloud database). No proxying, just DNS redirect.
        </P>
        <CodeBlock
          title="externalname-service.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: mydb.abc123.us-east-1.rds.amazonaws.com`}
        />
        <CodeBlock
          title="terminal (from pod)"
          code={`nslookup external-db`}
          output={`external-db.default.svc.cluster.local canonical name = mydb.abc123.us-east-1.rds.amazonaws.com

(app connects to "external-db", DNS redirects to RDS endpoint)`}
        />
        <P>
          Use case: your app code references <IC>postgres</IC> (internal name), but in prod you want it to hit an external RDS instance. ExternalName lets you swap without changing app config.
        </P>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Service", "stable VIP + DNS name that routes to pods matching selector labels"],
            ["Pod IPs ephemeral", "pods die → new IP; Service VIP stays stable"],
            ["Selector", "Service finds pods by label match (app=backend)"],
            ["Endpoints", "list of pod IPs Service routes to (updated as pods come/go)"],
            ["ClusterIP", "default — internal-only VIP (backend APIs, DBs)"],
            ["NodePort", "exposes on every node IP:30000-32767 (dev/test external access)"],
            ["LoadBalancer", "provisions cloud LB ($10-30/mo EACH) — prod external"],
            ["kube-proxy", "watches Services, programs iptables to intercept VIP traffic"],
            ["DNS format", "service.namespace.svc.cluster.local (short: just 'service' if same ns)"],
            ["CoreDNS", "cluster DNS — resolves service names to VIPs"],
            ["Headless service", "clusterIP: None — DNS returns pod IPs, not VIP (StatefulSet)"],
            ["Debug: no endpoints", "selector mismatch OR pods not Ready — check labels vs selector"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
