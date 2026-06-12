"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Route 53 + CloudFront — Live",
  nodes: [
    { id: "user", icon: "👩‍💻", label: "User", sub: "Mumbai", x: 8, y: 50, color: "#22d3ee" },
    { id: "r53", icon: "🌐", label: "Route 53", sub: "DNS · myapp.com", x: 32, y: 14, color: "#a78bfa" },
    { id: "cf", icon: "📍", label: "CloudFront", sub: "Mumbai edge PoP", x: 42, y: 62, color: "#fb923c" },
    { id: "alb", icon: "⚖️", label: "ALB Origin", sub: "/api/* · us-east-1", x: 78, y: 26, color: "#34d399" },
    { id: "s3", icon: "🪣", label: "S3 Origin", sub: "static files", x: 78, y: 82, color: "#fbbf24" },
  ],
  edges: [
    { id: "user-r53", from: "user", to: "r53", bend: -15, color: "#a78bfa" },
    { id: "user-cf", from: "user", to: "cf", bend: 15, color: "#22d3ee" },
    { id: "cf-alb", from: "cf", to: "alb", color: "#34d399" },
    { id: "cf-s3", from: "cf", to: "s3", color: "#fbbf24" },
  ],
  flows: [
    {
      id: "resolve",
      name: "🌐 DNS resolve",
      command: "nslookup myapp.com",
      steps: [
        { node: "user", paths: ["user-r53"], text: "The browser doesn't know what \"myapp.com\" is. It asks DNS — the query lands on Route 53 (your hosted zone)." },
        { node: "r53", paths: ["user-r53"], text: "Route 53 finds the ALIAS record: myapp.com → your CloudFront distribution, and returns the IP of the edge NEAREST to the user." },
        { node: "user", paths: ["user-cf"], text: "Browser connects to the Mumbai edge — 8ms away instead of 250ms to Virginia. DNS took ~20ms, cached for the TTL. 🌐" },
      ],
    },
    {
      id: "hit",
      name: "⚡ Cache HIT",
      command: "GET /assets/logo.png",
      steps: [
        { node: "user", paths: ["user-cf"], text: "User requests the logo. The request stops at the Mumbai edge location." },
        { node: "cf", paths: ["user-cf"], text: "Cache HIT — the file is already sitting on the edge's SSD from a previous visitor. Returned instantly (x-cache: Hit from cloudfront)." },
        { node: "user", paths: [], text: "Total: ~10ms. Virginia was never contacted. This is why static sites feel instant worldwide. ⚡" },
      ],
    },
    {
      id: "miss",
      name: "🚚 Cache MISS + API",
      command: "GET /index.html (new) · GET /api/cart",
      steps: [
        { node: "cf", paths: ["cf-s3"], text: "First request for a new file = MISS. The edge fetches it from the S3 origin over AWS's fast backbone, caches it, then serves it." },
        { node: "cf", paths: ["cf-alb"], text: "/api/* requests match a different cache behavior → forwarded to the ALB origin (TTL 0, never cached — it's dynamic data)." },
        { node: "user", paths: ["user-cf"], text: "One domain, two origins: static from S3, dynamic from ALB — CloudFront routes by path pattern. 🚚" },
      ],
    },
  ],
};

const NAV = [
  { id: "dns-basics", label: "How DNS Works ⭐" },
  { id: "route53", label: "Route 53 & Hosted Zones" },
  { id: "records", label: "DNS Record Types ⭐" },
  { id: "routing-policies", label: "Routing Policies ⭐" },
  { id: "health-checks", label: "Health Checks & Failover" },
  { id: "cloudfront", label: "CloudFront — The CDN ⭐" },
  { id: "cloudfront-config", label: "Origins, Caching & Invalidation" },
  { id: "vpn-dx", label: "VPN & Direct Connect" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsDnsCdnPage() {
  return (
    <TopicShell
      icon="📡"
      title="Route 53 & CloudFront"
      gradientWord="Route 53"
      subtitle="How a typed domain name becomes an IP address — resolved step by step — then Route 53's routing policies (weighted, latency, failover) and CloudFront caching your content in 400+ cities. Plus the hybrid links: VPN and Direct Connect."
      nav={NAV}
      badges={["🌍 DNS resolution drawn", "📡 Edge caching drawn", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "⚖️", label: "Load Balancing & Auto Scaling", href: "/aws/load-balancing" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="dns-basics" number="01" title="How DNS Actually Works ⭐">
        <P>
          <strong>DNS is the internet&apos;s phone book</strong>: names humans remember →
          IP addresses machines route. Here&apos;s the full lookup your laptop performs:
        </P>
        <CodeBlock
          title="dns_resolution.txt"
          runnable={false}
          code={`you type: app.acme.com
 │
 ▼
 1️⃣ browser/OS cache — "seen this recently?"  hit → done (0ms)
 │ miss
 ▼
 2️⃣ RESOLVER (your ISP / 8.8.8.8) takes over the hunt:
 │
 ├──▶ 3️⃣ ROOT server (.)        "who handles .com?"
 │        └─ "ask the .com TLD servers" ─┐
 ├──▶ 4️⃣ TLD server (.com)      "who handles acme.com?"
 │        └─ "ask Route 53: ns-123.awsdns-45.com" ─┐
 ├──▶ 5️⃣ AUTHORITATIVE (Route 53!)  "app.acme.com?"
 │        └─ "54.23.11.8 — cache it for 300s (TTL)"
 ▼
 6️⃣ resolver caches it, returns to your browser
 7️⃣ browser connects to 54.23.11.8 🎉      total: ~20-120ms once,
                                            then cached everywhere`}
        />
        <Table
          head={["Term", "Meaning"]}
          rows={[
            ["Resolver", "the librarian that hunts the answer for you (ISP, 8.8.8.8)"],
            ["Root / TLD servers", "the index: . knows .com, .com knows acme.com's servers"],
            ["Authoritative server", "holds the REAL records — Route 53's job"],
            ["TTL", "how long answers may be cached — low TTL = fast changes, more queries"],
          ]}
        />
        <Callout type="mistake">
          &quot;I changed DNS but users still hit the old server!&quot; — caches honor the old
          TTL. Migration trick: drop TTL to 60s a day <em>before</em> the change, switch, then
          raise it back.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="route53" number="02" title="Route 53 & Hosted Zones">
        <P>
          <strong>Route 53</strong> is AWS&apos;s DNS service (port 53 — the DNS port). A{" "}
          <strong>hosted zone</strong> is the container of records for one domain:
        </P>
        <CodeBlock
          title="hosted_zone.txt"
          runnable={false}
          code={`Route 53
 └─ 📁 PUBLIC hosted zone: acme.com
     ├─ acme.com         A      → 54.23.11.8
     ├─ www.acme.com     CNAME  → acme.com
     ├─ api.acme.com     ALIAS  → my-alb-123.elb.amazonaws.com
     └─ acme.com         MX     → mail handled by ...

 └─ 📁 PRIVATE hosted zone: internal.acme  (answers ONLY inside
     ├─ db.internal.acme  A → 10.0.21.5     your VPCs — give
     └─ cache.internal.acme A → 10.0.21.9   private IPs nice names)

 Route 53 also = domain REGISTRAR: buy acme.com in the console,
 and the hosted zone + NS records are wired automatically.`}
        />
        <Callout type="note">
          Route 53 is a <strong>global service</strong> with a 100% availability SLA — DNS is the
          one thing that must never go down, since every request on earth starts with it.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="records" number="03" title="DNS Record Types — The Six You Need ⭐">
        <Table
          head={["Record", "Maps", "Example"]}
          rows={[
            [<IC key="a">A</IC>, "name → IPv4", "acme.com → 54.23.11.8"],
            [<IC key="aaaa">AAAA</IC>, "name → IPv6", "acme.com → 2600:1f18::1"],
            [<IC key="c">CNAME</IC>, "name → another name", "www.acme.com → acme.com"],
            [<IC key="al">ALIAS</IC>, "name → AWS resource (Route 53 special)", "acme.com → ALB / CloudFront / S3"],
            [<IC key="mx">MX</IC>, "mail destination", "acme.com mail → Google Workspace"],
            [<IC key="txt">TXT</IC>, "arbitrary text (verification, SPF)", "\"google-site-verification=...\""],
            [<IC key="ns">NS</IC>, "who is authoritative", "acme.com → ns-123.awsdns-45.com"],
          ]}
        />
        <CodeBlock
          title="cname_vs_alias.txt"
          runnable={false}
          code={`the classic problem: point the ROOT domain at a load balancer

 ❌ acme.com  CNAME  my-alb-123.elb.amazonaws.com
    → ILLEGAL: DNS forbids CNAME at the zone root (apex)

 ✅ acme.com  ALIAS  my-alb-123.elb.amazonaws.com
    → Route 53's answer: looks like an A record to the world,
      resolves the AWS target's CURRENT IPs behind the scenes
      (LB IPs change! never hardcode them in an A record)

 ALIAS: works at apex ✅ · free queries ✅ · AWS targets only
 CNAME: any target ✅   · not at apex ❌ · standard DNS`}
        />
        <Callout type="tip">
          Exam trigger: &quot;point the apex/root domain at an ELB/CloudFront/S3&quot; →{" "}
          <strong>ALIAS record</strong>. It&apos;s Route 53&apos;s flagship feature.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="routing-policies" number="04" title="Routing Policies — One Name, Smart Answers ⭐">
        <P>
          Route 53 isn&apos;t a static phone book — it can give <em>different answers to
          different people</em>. That turns DNS into a traffic-steering tool:
        </P>
        <CodeBlock
          title="routing_policies.txt"
          runnable={false}
          code={`"app.acme.com?" — Route 53 answers depending on policy:

 SIMPLE      → always 54.23.11.8            (one answer)

 WEIGHTED    → 90% get server A, 10% get B  (canary releases!)
               A ◀━━━━━━━━━ 90 ━━┓
                                 ┣━ 🎲
               B ◀━━ 10 ━━━━━━━━━┛

 LATENCY     → user in Tokyo → ap-northeast-1
               user in Paris → eu-west-3    (fastest region wins)

 FAILOVER    → primary healthy? → primary
               primary DOWN?    → DR site   (+ health check)

 GEOLOCATION → India → in-stack · Germany → eu-stack
               (compliance, localized content)

 MULTIVALUE  → return up to 8 healthy IPs, client picks
               (poor man's load balancing)`}
        />
        <Table
          head={["Scenario", "Policy"]}
          rows={[
            ["roll out v2 to 5% of users", "Weighted (95/5)"],
            ["lowest latency across regions", "Latency"],
            ["active-passive disaster recovery", "Failover + health checks"],
            ["EU data must stay in EU", "Geolocation"],
            ["single server, simple site", "Simple"],
          ]}
        />
        <Callout type="note">
          DNS steers <em>between</em> regions/sites; a load balancer spreads{" "}
          <em>within</em> one. Production uses both: Route 53 latency policy → regional ALBs →
          instances. The next topic covers the ALB half.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="health-checks" number="05" title="Health Checks & DNS Failover">
        <CodeBlock
          title="dns_failover.txt"
          runnable={false}
          code={`Route 53 health checkers (global fleet) probe your endpoint:

 every 30s (or 10s): GET https://primary.acme.com/health
   ├─ 2xx/3xx from enough checkers → HEALTHY
   └─ failures past threshold      → UNHEALTHY → flip the answer

 NORMAL                            DISASTER
 app.acme.com                      app.acme.com
   └─▶ 🟢 primary (us-east-1)        └─▶ 🔴 primary ✗ unhealthy
       🌙 standby (eu-west-1)            🟢 standby PROMOTED ✅

 caveat: clients still cache the old answer for up to TTL seconds
 → failover records should use LOW TTLs (30-60s)`}
        />
        <Callout type="behind">
          Health checks can probe endpoints, other health checks (composite alarms), or
          CloudWatch alarms — so &quot;unhealthy&quot; can mean anything from &quot;HTTP 500&quot;
          to &quot;queue depth exploded&quot;.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="cloudfront" number="06" title="CloudFront — Your Content, 20ms From Everyone ⭐">
        <P>
          <strong>CloudFront</strong> is the CDN: it caches your content at 400+ edge locations
          so users fetch from the nearest city instead of crossing oceans:
        </P>
        <CodeBlock
          title="cloudfront_flow.txt"
          runnable={false}
          code={`without CloudFront:                with CloudFront:

 👩 Delhi ──────── 220ms ──▶ 🇺🇸     👩 Delhi ── 20ms ──▶ 📡 Delhi edge
 👨 Paris ──────── 90ms  ──▶ S3      👨 Paris ── 12ms ──▶ 📡 Paris edge
 👩 Sydney ─────── 200ms ──▶ origin  👩 Sydney ─ 15ms ──▶ 📡 Sydney edge
                                            cache MISS? edge fetches
                                            from origin ONCE, keeps it:
                                     📡 edge ── (first time only) ──▶ 🇺🇸 S3

 request flow at the edge:
 1. user hits nearest edge (anycast DNS)
 2. cached + fresh?  → serve in ms ✅  (the goal: high hit ratio)
 3. miss/stale?      → fetch from ORIGIN, cache per TTL, serve
 bonus: TLS terminates AT the edge + AWS backbone to origin
        → even DYNAMIC (uncacheable) requests get faster`}
        />
        <Table
          head={["Term", "Meaning"]}
          rows={[
            ["Distribution", "your CloudFront config (gets a d123.cloudfront.net domain)"],
            ["Origin", "where the truth lives: S3, ALB, any HTTP server"],
            ["Edge location", "the 400+ cache sites (Fundamentals topic!)"],
            ["Cache hit ratio", "% served from cache — the metric to maximize"],
          ]}
        />
        <Callout type="tip">
          The flagship pattern: <strong>S3 (private) + CloudFront + Route 53 ALIAS</strong> = a
          global, HTTPS, serverless website for pennies. S3 stays locked; CloudFront reaches it
          via <strong>Origin Access Control (OAC)</strong>, so users can&apos;t bypass the CDN.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="cloudfront-config" number="07" title="Origins, Caching Behaviors & Invalidation">
        <CodeBlock
          title="cloudfront_config.txt"
          runnable={false}
          code={`one distribution, path-based BEHAVIORS:

 https://acme.com/...
 ├─ /img/*  → origin: S3 bucket      cache: 30 days (immutable assets)
 ├─ /api/*  → origin: ALB            cache: 0 (dynamic — still gains
 │                                            TLS@edge + AWS backbone)
 └─ default → origin: S3 (the site)  cache: 1 hour

 "I deployed but users see the OLD file!" — two fixes:
 1. INVALIDATION: purge now    aws cloudfront create-invalidation
                               --paths "/index.html"   (slow-ish, $ after 1000/mo)
 2. VERSIONED FILENAMES ⭐:    app.css → app.v42.css
                               new name = instant "miss" = fresh fetch
                               (what every build tool does for you)`}
        />
        <Table
          head={["Extra", "What it gives you"]}
          rows={[
            ["HTTPS / custom domain", "free TLS cert via ACM (must be in us-east-1!)"],
            ["Signed URLs / cookies", "paid-content protection — time-limited access"],
            ["AWS WAF integration", "block attacks at the edge, before your origin"],
            ["CloudFront Functions / Lambda@Edge", "run code AT the edge (rewrites, auth)"],
          ]}
        />
        <Callout type="mistake">
          Caching <IC>/api/*</IC> responses that contain user data = serving one user&apos;s
          account page to another. Dynamic/personalized paths get TTL 0 (or carefully chosen
          cache keys). Cache rule #1: when in doubt, don&apos;t.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="vpn-dx" number="08" title="VPN & Direct Connect — Wiring the Office to AWS">
        <P>
          Hybrid cloud needs a private road between your datacenter/office and your VPC. Two
          options:
        </P>
        <CodeBlock
          title="vpn_vs_dx.txt"
          runnable={false}
          code={`SITE-TO-SITE VPN (days to set up)
 🏢 on-prem ══ encrypted tunnel over the INTERNET ══▶ 🕸️ VPC
 customer gateway          2 tunnels (HA)    virtual private gateway
 ✅ fast to deploy, cheap (~$0.05/hr)
 ⚠️ internet latency/jitter · ~1.25 Gbps per tunnel

 DIRECT CONNECT (weeks-months to provision)
 🏢 on-prem ── dedicated PHYSICAL fiber ──▶ DX location ──▶ VPC
 ✅ 1-100 Gbps, consistent latency, private (never touches internet)
 💸 port fees + xconnect · serious commitment

 pro pattern: Direct Connect primary + VPN as failover backup
 (and at many-VPC scale, both terminate on a Transit Gateway)`}
        />
        <Table
          head={["", "Site-to-Site VPN", "Direct Connect"]}
          rows={[
            ["Medium", "encrypted over internet", "dedicated private fiber"],
            ["Setup time", "hours–days", "weeks–months"],
            ["Bandwidth", "~1.25 Gbps/tunnel", "1–100 Gbps"],
            ["Latency", "variable (internet)", "consistent"],
            ["Use", "quick hybrid, backup link", "steady heavy traffic, compliance"],
          ]}
        />
        <Callout type="note">
          Deep-dive (plus Global Accelerator, PrivateLink and VPC endpoints) continues in the{" "}
          <strong>Advanced Networking</strong> topic.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["DNS chain", "cache → resolver → root → TLD → authoritative (Route 53)"],
            ["TTL", "cache lifetime — lower it BEFORE migrations"],
            ["Hosted zone", "all records for one domain (public or VPC-private)"],
            ["A vs CNAME", "name→IP vs name→name (CNAME illegal at apex)"],
            ["ALIAS", "Route 53 special: apex → ALB/CloudFront/S3, free"],
            ["Weighted", "90/10 split — canary deployments"],
            ["Latency policy", "answer with the fastest region per user"],
            ["Failover policy", "health check flips primary → standby"],
            ["CloudFront", "CDN — cache at 400+ edges, origin = S3/ALB"],
            ["OAC", "keep S3 private; only CloudFront may read it"],
            ["Cache busting", "versioned filenames > invalidations"],
            ["VPN vs DX", "internet tunnel (fast setup) vs private fiber (fast packets)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
