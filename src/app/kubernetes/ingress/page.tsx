"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "One Door, Many Apps — Live",
  nodes: [
    { id: "internet", icon: "🌐", label: "Internet", sub: "users", x: 7, y: 50, color: "#22d3ee" },
    { id: "lb", icon: "⚡", label: "Cloud LB", sub: "1.2.3.4 (one IP)", x: 25, y: 50, color: "#a78bfa" },
    { id: "ingress", icon: "🚪", label: "Ingress Controller", sub: "nginx pod", x: 48, y: 50, color: "#fbbf24" },
    { id: "api-svc", icon: "🎯", label: "API Service", sub: "api.shop.com", x: 72, y: 18, color: "#34d399" },
    { id: "web-svc", icon: "🎯", label: "Web Service", sub: "shop.com/web", x: 72, y: 50, color: "#60a5fa" },
    { id: "admin-svc", icon: "🎯", label: "Admin Service", sub: "admin.shop.com", x: 72, y: 78, color: "#fb923c" },
  ],
  edges: [
    { id: "internet-lb", from: "internet", to: "lb", color: "#a78bfa" },
    { id: "lb-ingress", from: "lb", to: "ingress", color: "#fbbf24" },
    { id: "ingress-api", from: "ingress", to: "api-svc", color: "#34d399" },
    { id: "ingress-web", from: "ingress", to: "web-svc", color: "#60a5fa" },
    { id: "ingress-admin", from: "ingress", to: "admin-svc", color: "#fb923c" },
  ],
  flows: [
    {
      id: "routing",
      name: "🗺️ Host + path routing",
      command: "curl https://api.shop.com/users",
      steps: [
        { node: "internet", paths: ["internet-lb"], text: "User requests api.shop.com/users. DNS resolves to 1.2.3.4 (cloud LB, ONE public IP for ALL apps). HTTPS request hits LB." },
        { node: "ingress", paths: ["lb-ingress", "ingress-api"], text: "LB forwards to Ingress Controller pod (nginx). Controller reads Host header: 'api.shop.com' → matches Ingress rule #1 → route to api-service." },
        { node: "api-svc", paths: [], text: "Traffic forwarded to api-service (ClusterIP) → pods respond. Same LB, same IP, routing by HTTP header. One door, many apps. 💰 Saved $60/mo (3 LBs → 1)." },
      ],
    },
    {
      id: "no-controller",
      name: "❌ No controller → nothing happens",
      command: "kubectl apply -f ingress.yaml",
      steps: [
        { node: "ingress", paths: [], text: "You create Ingress resource (YAML with routing rules). kubectl apply succeeds… but traffic still fails. Why?" },
        { node: "lb", paths: [], text: "Ingress RESOURCE is just config. The Ingress CONTROLLER (nginx/Traefik pod) reads it and does the routing. No controller installed = rules sit unused." },
        { node: "ingress", paths: ["lb-ingress"], text: "Install controller: kubectl apply -f nginx-ingress-controller.yaml. NOW the controller pod starts, reads Ingress rules, provisions cloud LB. Traffic flows. 🔧" },
      ],
    },
    {
      id: "tls",
      name: "🔒 TLS termination",
      command: "https://shop.com (TLS cert in Secret)",
      steps: [
        { node: "internet", paths: ["internet-lb"], text: "HTTPS request (encrypted). Cloud LB forwards encrypted traffic to Ingress Controller." },
        { node: "ingress", paths: ["lb-ingress"], text: "Ingress Controller terminates TLS (cert stored in Kubernetes Secret). Decrypts, reads Host/path headers, routes to backend service." },
        { node: "web-svc", paths: ["ingress-web"], text: "Backend service receives PLAIN HTTP (no TLS). Controller ↔ service traffic is internal (within cluster). TLS offloaded at the edge. 🔒" },
      ],
    },
  ],
};

const NAV = [
  { id: "problem", label: "The Cost Problem ⭐" },
  { id: "ingress-concept", label: "Ingress = L7 Router" },
  { id: "controller-vs-resource", label: "Controller vs Resource (huge gotcha!) ⭐" },
  { id: "routing-rules", label: "Routing Rules (host + path)" },
  { id: "ingress-yaml", label: "Ingress YAML Anatomy" },
  { id: "tls", label: "TLS Termination" },
  { id: "path-types", label: "pathType Table" },
  { id: "gateway-api", label: "Gateway API (the future)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sIngressPage() {
  return (
    <TopicShell
      icon="🚪"
      title="Ingress"
      gradientWord="Ingress"
      subtitle="The cost problem: one cloud LB per LoadBalancer service adds up fast. Ingress = L7 HTTP router: ONE load balancer, many services routed by host/path. Controller vs resource distinction (common mistake!), routing rules, TLS termination, and the Gateway API future."
      nav={NAV}
      badges={["💰 One LB, many apps", "🗺️ Host/path routing", "🔒 TLS termination"]}
      next={{ icon: "🔧", label: "Config & Secrets", href: "/kubernetes/config-secrets" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="problem" number="01" title="The Cost Problem ⭐">
        <P>
          You have 3 apps: api.shop.com, shop.com, admin.shop.com. Each needs external access. The naive approach: 3 LoadBalancer Services → 3 cloud load balancers → $60/month. There&apos;s a better way.
        </P>
        <CodeBlock
          title="the_cost_problem.txt"
          runnable={false}
          code={`WITHOUT INGRESS (expensive)
┌────────────────────────────────────────────────┐
│ CLOUD                                          │
│  ┌────────────┐ $20/mo  → api-service          │
│  │ LB #1      │ 52.1.1.1  (api.shop.com)       │
│  └────────────┘                                │
│  ┌────────────┐ $20/mo  → web-service          │
│  │ LB #2      │ 52.1.1.2  (shop.com)           │
│  └────────────┘                                │
│  ┌────────────┐ $20/mo  → admin-service        │
│  │ LB #3      │ 52.1.1.3  (admin.shop.com)     │
│  └────────────┘                                │
│  TOTAL: $60/month + 3 public IPs to manage     │
└────────────────────────────────────────────────┘

WITH INGRESS (smart)
┌────────────────────────────────────────────────┐
│ CLOUD                                          │
│  ┌──────────────────────────────────┐ $20/mo  │
│  │ ONE Load Balancer                │ 52.1.1.1│
│  │ (provisioned by Ingress Ctrl)    │         │
│  └─────────────┬────────────────────┘         │
│                ▼                               │
│  ┌──────────────────────────────────┐         │
│  │ Ingress Controller (nginx pod)   │         │
│  │ reads Host header, routes:       │         │
│  │  api.shop.com      → api-service │         │
│  │  shop.com          → web-service │         │
│  │  admin.shop.com    → admin-service│        │
│  └──────────────────────────────────┘         │
│  TOTAL: $20/month + 1 public IP                │
│  SAVINGS: $40/month (67% cheaper!) 💰         │
└────────────────────────────────────────────────┘

Ingress operates at HTTP layer (L7) — inspects Host and
path headers to route. LoadBalancer is L4 (just IP:port).`}
        />
        <Callout type="analogy">
          🏢 LoadBalancer Service = each tenant gets their own building entrance ($$). Ingress = one main lobby, receptionist reads visitor badges and directs to the right office. Way cheaper.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="ingress-concept" number="02" title="Ingress = Layer 7 HTTP Router">
        <P>
          <IC>Ingress</IC> routes HTTP(S) traffic based on <IC>host</IC> (domain) and <IC>path</IC> (URL path) to different backend Services. It&apos;s like nginx/Apache virtual hosts, but Kubernetes-native.
        </P>
        <CodeBlock
          title="ingress_routing_logic.txt"
          runnable={false}
          code={`INGRESS ROUTING (L7 — knows HTTP headers)

incoming request:
  GET /api/users HTTP/1.1
  Host: api.shop.com

Ingress Controller checks rules:
┌────────────────────────────────────────────────┐
│ Rule 1: host = api.shop.com                   │
│         path = /              → api-service    │
│                                                │
│ Rule 2: host = shop.com                       │
│         path = /web           → web-service    │
│         path = /admin         → admin-service  │
│                                                │
│ Rule 3: host = admin.shop.com                 │
│         path = /              → admin-service  │
└────────────────────────────────────────────────┘

examples:
  https://api.shop.com/users       → api-service
  https://shop.com/web             → web-service
  https://shop.com/admin           → admin-service
  https://admin.shop.com/          → admin-service
  https://unknown.com/             → 404 (no rule matches)

path types (we'll cover in §07):
  Prefix /api → matches /api, /api/users, /api/v1/…
  Exact /api  → matches ONLY /api (not /api/users)`}
        />
      </Section>

      {/* 03 */}
      <Section id="controller-vs-resource" number="03" title="Controller vs Resource — The Huge Gotcha! ⭐">
        <P>
          This trips up EVERYONE learning Ingress. There are TWO pieces, both called &quot;Ingress&quot;:
        </P>
        <Table
          head={["Component", "What it is", "Who creates it"]}
          rows={[
            [
              <IC key="1">Ingress RESOURCE</IC>,
              "YAML file with routing rules (kind: Ingress). Just config, does nothing by itself.",
              "You write and kubectl apply it",
            ],
            [
              <IC key="2">Ingress CONTROLLER</IC>,
              "A pod (nginx, Traefik, HAProxy…) that READS Ingress resources and does the actual routing. Also provisions the cloud LB.",
              "You install separately (helm, manifest)",
            ],
          ]}
        />
        <CodeBlock
          title="the_confusion.txt"
          runnable={false}
          code={`COMMON MISTAKE (nothing works):

1. you: kubectl apply -f ingress.yaml    ← creates Ingress RESOURCE
2. kubectl get ingress
   NAME    CLASS   HOSTS          ADDRESS   PORTS
   my-ing  <none>  api.shop.com   <none>    80      ← ADDRESS empty!
3. you: "why isn't it working? I created the Ingress!"

PROBLEM: Ingress RESOURCE exists, but NO CONTROLLER is installed
         → nobody is reading the rules or provisioning the LB
         → traffic goes nowhere

FIX:
1. Install Ingress Controller (one-time setup):
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
   (or use Helm, or cloud-specific controller)

2. Controller pod starts, reads your Ingress resource,
   provisions cloud LB, configures routing

3. kubectl get ingress
   NAME    CLASS   HOSTS          ADDRESS      PORTS
   my-ing  nginx   api.shop.com   52.1.1.1     80,443  ← LB IP!

NOW it works. Controller is the engine, resource is the config.`}
        />
        <Callout type="mistake">
          ⚠️ The #1 Ingress mistake: creating the Ingress YAML without installing a controller. The resource sits there doing nothing. Always check: <IC>kubectl get pods -n ingress-nginx</IC> (or whatever controller namespace) — is the controller pod Running?
        </Callout>
        <P>
          Popular controllers:
        </P>
        <Table
          head={["Controller", "Backing tech", "Use case"]}
          rows={[
            [<IC key="1">ingress-nginx</IC>, "nginx", "Default choice, most popular, feature-rich"],
            [<IC key="2">Traefik</IC>, "Traefik proxy", "Auto-TLS with Let's Encrypt, modern dashboard"],
            [<IC key="3">HAProxy</IC>, "HAProxy", "High performance, TCP support"],
            [<IC key="4">AWS ALB Ingress</IC>, "AWS ALB (cloud-native)", "Tight AWS integration, advanced routing"],
            [<IC key="5">GCE Ingress</IC>, "GCP GCLB", "GKE default, serverless backend support"],
          ]}
        />
      </Section>

      {/* 04 */}
      <Section id="routing-rules" number="04" title="Routing Rules — Host + Path">
        <P>
          Ingress rules match on <IC>host</IC> (domain) and <IC>path</IC> (URL prefix/exact), then forward to a Service.
        </P>
        <CodeBlock
          title="routing_examples.txt"
          runnable={false}
          code={`RULE STRUCTURE
┌────────────────────────────────────────────────┐
│ if host matches AND path matches              │
│    → forward to backend Service                │
└────────────────────────────────────────────────┘

HOST-BASED ROUTING (different domains → different services)
  api.shop.com       → api-service
  shop.com           → web-service
  admin.shop.com     → admin-service

PATH-BASED ROUTING (same domain, different paths → different services)
  shop.com/          → web-service
  shop.com/api       → api-service
  shop.com/admin     → admin-service

COMBINED (most common)
  api.shop.com/      → api-service (dedicated subdomain)
  shop.com/web       → web-service (path on main domain)
  shop.com/api       → api-service (path on main domain)
  admin.shop.com/    → admin-service (dedicated subdomain)

DEFAULT BACKEND (catch-all for unmatched requests)
  if no rule matches  → default-backend (404 page)`}
        />
      </Section>

      {/* 05 */}
      <Section id="ingress-yaml" number="05" title="Ingress YAML Anatomy">
        <CodeBlock
          title="ingress.yaml"
          runnable={false}
          code={`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  annotations:
    # controller-specific settings (nginx example)
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx    # which controller handles this (v1.18+)
  rules:
  # Rule 1: api.shop.com → api-service
  - host: api.shop.com
    http:
      paths:
      - path: /
        pathType: Prefix       # matches /, /users, /v1/…
        backend:
          service:
            name: api-service
            port:
              number: 80
  # Rule 2: shop.com → multiple paths
  - host: shop.com
    http:
      paths:
      - path: /web
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
  # Rule 3: admin.shop.com → admin-service
  - host: admin.shop.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f ingress.yaml
kubectl get ingress`}
          output={`ingress.networking.k8s.io/shop-ingress created

NAME           CLASS   HOSTS                              ADDRESS      PORTS
shop-ingress   nginx   api.shop.com,shop.com,admin...     52.1.1.1     80`}
        />
        <CodeBlock
          title="terminal (describe for details)"
          code={`kubectl describe ingress shop-ingress`}
          output={`Name:             shop-ingress
Namespace:        default
Ingress Class:    nginx
Rules:
  Host             Path  Backends
  ----             ----  --------
  api.shop.com
                   /   api-service:80 (10.244.1.5:8080,10.244.2.8:8080)
  shop.com
                   /web      web-service:80 (10.244.1.9:8080)
                   /admin    admin-service:80 (10.244.2.3:8080)
  admin.shop.com
                   /   admin-service:80 (10.244.2.3:8080)`}
        />
      </Section>

      {/* 06 */}
      <Section id="tls" number="06" title="TLS Termination — HTTPS at the Edge">
        <P>
          Ingress can terminate TLS (decrypt HTTPS), so backend services receive plain HTTP. The TLS cert lives in a Kubernetes Secret.
        </P>
        <CodeBlock
          title="tls_flow.txt"
          runnable={false}
          code={`TLS TERMINATION
┌────────────────────────────────────────────────┐
│ 1. User  ──HTTPS (encrypted)──▶ Cloud LB      │
│                                  52.1.1.1:443  │
│ 2. LB    ──HTTPS──▶ Ingress Controller pod    │
│                                                │
│ 3. Controller decrypts (cert from Secret)     │
│    reads Host: api.shop.com, path: /users     │
│                                                │
│ 4. Controller ──HTTP (plain)──▶ api-service   │
│                                  (ClusterIP)   │
│                                                │
│ backend receives plain HTTP — TLS offloaded    │
│ at the edge (controller), not at every pod     │
└────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="1. Create TLS Secret (cert + key)"
          code={`kubectl create secret tls shop-tls \\
  --cert=shop.com.crt \\
  --key=shop.com.key`}
          output={`secret/shop-tls created`}
        />
        <CodeBlock
          title="2. ingress-tls.yaml"
          runnable={false}
          code={`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress-tls
spec:
  ingressClassName: nginx
  tls:                           # TLS section
  - hosts:
    - api.shop.com
    - shop.com
    secretName: shop-tls         # references the Secret above
  rules:
  - host: api.shop.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f ingress-tls.yaml
kubectl get ingress`}
          output={`NAME               CLASS   HOSTS            ADDRESS    PORTS
shop-ingress-tls   nginx   api.shop.com...  52.1.1.1   80, 443`}
        />
        <P>
          Now <IC>https://api.shop.com</IC> works (443), and the controller auto-redirects HTTP → HTTPS.
        </P>
        <Callout type="tip">
          💡 Use <IC>cert-manager</IC> to automate TLS cert issuance from Let&apos;s Encrypt. It creates/renews Secrets automatically. Add annotation: <IC>cert-manager.io/cluster-issuer: letsencrypt-prod</IC> → free auto-TLS. 🔒
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="path-types" number="07" title="pathType — Prefix vs Exact">
        <P>
          The <IC>pathType</IC> field controls how path matching works:
        </P>
        <Table
          head={["pathType", "Behavior", "Example"]}
          rows={[
            [
              <IC key="1">Prefix</IC>,
              "Matches path prefix (most common). /api matches /api, /api/users, /api/v1/posts.",
              "path: /api, pathType: Prefix → routes /api, /api/*, /api/v1/*",
            ],
            [
              <IC key="2">Exact</IC>,
              "Exact match only. /api matches ONLY /api (not /api/users).",
              "path: /api, pathType: Exact → routes /api only",
            ],
            [
              <IC key="3">ImplementationSpecific</IC>,
              "Controller decides (nginx: behaves like Prefix). Avoid — use explicit Prefix/Exact.",
              "(depends on controller)",
            ],
          ]}
        />
        <CodeBlock
          title="pathType_examples.txt"
          runnable={false}
          code={`EXAMPLE: routing /api and /api/v2 differently

spec:
  rules:
  - host: shop.com
    http:
      paths:
      - path: /api/v2         # more specific first
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80
      - path: /api            # catch-all for /api/v1, /api/…
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80

ORDER MATTERS: most specific paths first!
  /api/v2/users  → api-v2-service (matched first rule)
  /api/v1/users  → api-service    (matched second rule)
  /api/users     → api-service    (matched second rule)`}
        />
      </Section>

      {/* 08 */}
      <Section id="gateway-api" number="08" title="Gateway API — The Future of Ingress">
        <P>
          <IC>Gateway API</IC> is the next-gen replacement for Ingress (currently beta, targeting GA in 2024-2025). More expressive, role-oriented (infra vs app teams), supports TCP/UDP (not just HTTP).
        </P>
        <CodeBlock
          title="ingress_vs_gateway_api.txt"
          runnable={false}
          code={`INGRESS (current)
• HTTP/HTTPS only
• one resource type (Ingress)
• annotations for controller-specific config (messy)
• works, but limited

GATEWAY API (future) ⭐
• HTTP/HTTPS + TCP + UDP + gRPC
• multiple resource types:
  - GatewayClass (infra team: "which controller?")
  - Gateway (infra team: listeners, certs, ports)
  - HTTPRoute (app team: routing rules)
• role separation: infra configures Gateway, devs create Routes
• portable: no annotations, standard spec
• richer features: weighted traffic splits (A/B, canary),
  header matching, request mirroring

WHEN TO USE:
• Ingress: production today (stable, widely supported)
• Gateway API: new projects 2024+ (check controller support)
  - nginx-gateway-fabric, Istio, Envoy Gateway, Cilium support it

Gateway API will replace Ingress eventually, but Ingress
isn't going away for years (too widely deployed)`}
        />
        <Callout type="note">
          📝 For this course, learn Ingress (it&apos;s what 95% of clusters use today). Watch Gateway API — when your controller supports it, migration is straightforward. The concepts (L7 routing, TLS termination) are the same.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Ingress problem", "many LoadBalancer services = many cloud LBs ($20 each/mo)"],
            ["Ingress solution", "ONE LB, routes by HTTP host + path to many services (L7 routing)"],
            ["Ingress resource", "YAML with routing rules (kind: Ingress) — just config"],
            ["Ingress controller", "pod (nginx/Traefik) that reads resources, does routing, provisions LB"],
            ["Common mistake", "creating Ingress YAML without installing controller → nothing works"],
            ["Host-based routing", "api.shop.com → api-service, shop.com → web-service"],
            ["Path-based routing", "shop.com/api → api-service, shop.com/web → web-service"],
            ["pathType: Prefix", "/api matches /api, /api/users, /api/* (most common)"],
            ["pathType: Exact", "/api matches ONLY /api (not /api/users)"],
            ["TLS termination", "controller decrypts HTTPS (cert in Secret), sends HTTP to backend"],
            ["cert-manager", "automates Let's Encrypt TLS certs (free auto-renewal)"],
            ["Gateway API", "next-gen Ingress (HTTP+TCP, role separation) — future standard"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
