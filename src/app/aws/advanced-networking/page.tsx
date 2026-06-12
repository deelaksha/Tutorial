"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Transit Gateway Hub — Live",
  nodes: [
    { id: "vpc1", icon: "🏗️", label: "Prod VPC", sub: "10.0.0.0/16", x: 14, y: 16, color: "#34d399" },
    { id: "vpc2", icon: "🧪", label: "Dev VPC", sub: "10.1.0.0/16", x: 14, y: 50, color: "#a78bfa" },
    { id: "vpc3", icon: "🗄️", label: "Shared VPC", sub: "10.2.0.0/16", x: 14, y: 84, color: "#fbbf24" },
    { id: "tgw", icon: "🔀", label: "Transit GW", sub: "the cloud router", x: 48, y: 50, color: "#fb923c" },
    { id: "dx", icon: "🔌", label: "Direct Connect", sub: "private fiber", x: 78, y: 22, color: "#22d3ee" },
    { id: "vpn", icon: "🔐", label: "Site-to-Site VPN", sub: "encrypted backup", x: 78, y: 78, color: "#f472b6" },
    { id: "onprem", icon: "🏢", label: "On-Prem DC", sub: "192.168.0.0/16", x: 93, y: 50, color: "#f87171" },
  ],
  edges: [
    { id: "vpc1-tgw", from: "vpc1", to: "tgw", color: "#34d399" },
    { id: "vpc2-tgw", from: "vpc2", to: "tgw", color: "#a78bfa" },
    { id: "vpc3-tgw", from: "vpc3", to: "tgw", color: "#fbbf24" },
    { id: "tgw-dx", from: "tgw", to: "dx", color: "#22d3ee" },
    { id: "tgw-vpn", from: "tgw", to: "vpn", dashed: true, color: "#f472b6" },
    { id: "dx-onprem", from: "dx", to: "onprem", color: "#22d3ee" },
    { id: "vpn-onprem", from: "vpn", to: "onprem", dashed: true, color: "#f472b6" },
  ],
  flows: [
    {
      id: "hub",
      name: "🔀 VPC ↔ VPC",
      command: "prod (10.0.x) → shared services (10.2.x)",
      steps: [
        { node: "vpc1", paths: ["vpc1-tgw"], text: "Prod needs the shared Active Directory. Its route table says 10.2.0.0/16 → tgw-attachment. One hop." },
        { node: "tgw", paths: ["vpc3-tgw"], text: "The Transit Gateway routes it straight to Shared VPC. With 50 VPCs you manage 50 attachments — not 1,225 peering links." },
        { node: "vpc3", paths: ["vpc2-tgw"], text: "Bonus: TGW route tables SEGMENT traffic — Dev can reach Shared, but Dev → Prod is simply not routed. 🔀" },
      ],
    },
    {
      id: "hybrid",
      name: "🔌 Hybrid via DX",
      command: "on-prem ERP → prod VPC (private fiber)",
      steps: [
        { node: "onprem", paths: ["dx-onprem"], text: "The on-prem ERP calls an API in Prod VPC. Traffic enters the dedicated Direct Connect fiber — never the public internet." },
        { node: "dx", paths: ["tgw-dx"], text: "Direct Connect delivers consistent ~2ms latency and steady bandwidth into the Transit Gateway." },
        { node: "vpc1", paths: ["vpc1-tgw"], text: "TGW forwards to Prod. Finance-grade compliance: predictable, private, fast. 🔌" },
      ],
    },
    {
      id: "failover",
      name: "🪢 DX cut → VPN",
      command: "BGP: DX route withdrawn → VPN takes over",
      steps: [
        { node: "dx", paths: ["dx-onprem"], text: "🚧 A backhoe cuts the Direct Connect fiber downtown. BGP withdraws the DX routes within seconds." },
        { node: "vpn", paths: ["tgw-vpn", "vpn-onprem"], text: "The pre-configured Site-to-Site VPN (running idle as backup) instantly becomes the active path — encrypted over the internet." },
        { node: "onprem", paths: ["vpn-onprem"], text: "Latency jumps from 2ms to ~25ms, but everything WORKS. Always pair DX with a VPN failover. 🪢" },
      ],
    },
  ],
};

const NAV = [
  { id: "recap-problem", label: "Beyond One VPC — The Problems ⭐" },
  { id: "endpoints", label: "VPC Endpoints — Private AWS Access ⭐" },
  { id: "privatelink", label: "PrivateLink — Private SaaS Doors" },
  { id: "transit-gateway", label: "Transit Gateway — The Hub ⭐" },
  { id: "hybrid", label: "VPN vs Direct Connect ⭐" },
  { id: "global-accelerator", label: "Global Accelerator vs CloudFront" },
  { id: "dns-advanced", label: "Route 53 Resolver — Hybrid DNS" },
  { id: "full-map", label: "The Enterprise Network, Drawn" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsAdvancedNetworkingPage() {
  return (
    <TopicShell
      icon="🕸️"
      title="Advanced Networking"
      gradientWord="Networking"
      subtitle="One VPC was easy. Now: 40 VPCs across teams, an on-prem data center, SaaS vendors, and global users. Transit Gateway hubs it, Direct Connect wires the office in, VPC endpoints keep S3 traffic private, Global Accelerator speeds up the world."
      nav={NAV}
      badges={["🕸️ Hub & spoke drawn", "🔌 Hybrid links", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🏗️", label: "Architecture & Well-Architected", href: "/aws/architecture" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="recap-problem" number="01" title="Beyond One VPC — The Problems ⭐">
        <P>
          The VPC topic ended with one tidy network. Real companies hit four walls fast:
        </P>
        <CodeBlock
          title="four_problems.txt"
          runnable={false}
          code={`PROBLEM 1 — "my private subnet calls S3... over NAT?!"
  private EC2 → NAT → 'internet' → S3 = slow path + NAT $$ 💸
  → fix: VPC ENDPOINTS (§02)

PROBLEM 2 — "40 VPCs need to talk"
  peering is 1-to-1 and NOT transitive:
  40 VPCs fully meshed = 780 peering connections 🤯
  → fix: TRANSIT GATEWAY (§04)

PROBLEM 3 — "our data center must reach AWS privately"
  → fix: SITE-TO-SITE VPN or DIRECT CONNECT (§05)

PROBLEM 4 — "users in São Paulo say the app is slow"
  every request crosses the planet to us-east-1 🌍🐌
  → fix: CLOUDFRONT (static) / GLOBAL ACCELERATOR (dynamic) (§06)

this topic = those four fixes + how they snap together`}
        />
      </Section>

      {/* 02 */}
      <Section id="endpoints" number="02" title="VPC Endpoints — Private Access to AWS Services ⭐">
        <CodeBlock
          title="endpoint_types.txt"
          runnable={false}
          code={`WITHOUT endpoint:
 🖥️ private EC2 ──▶ NAT GW ──▶ IGW ──▶ (public S3 endpoint)
                    💸 $0.045/GB        traffic leaves your VPC

1️⃣ GATEWAY ENDPOINT — S3 & DynamoDB ONLY, FREE ⭐
 🖥️ private EC2 ──▶ route table entry ──▶ 🪣 S3
    a target in the ROUTE TABLE (pl-xxxx → vpce-xxx)
    no NAT, no internet, no cost. there is NO reason not to.

2️⃣ INTERFACE ENDPOINT — everything else (~$0.01/h + per GB)
 🖥️ EC2 ──▶ ENI with private IP in YOUR subnet ──▶ SQS/KMS/
    ECR/Secrets Manager/CloudWatch/... (100+ services)
    private DNS: sqs.us-east-1.amazonaws.com now resolves
    to the PRIVATE IP inside your VPC 🪄
    (powered by PrivateLink — next section)

+ endpoint POLICY: "this endpoint may only reach bucket X"
  → even a compromised instance can't exfiltrate to attacker buckets 🔒`}
        />
        <Callout type="mistake">
          ⚠️ Exam + real-bill favorite: &quot;private instances upload to S3; reduce cost and
          keep traffic off the internet&quot; → <strong>gateway endpoint</strong>, always. If
          the answer says NAT for S3 traffic, it is wrong (or expensive).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="privatelink" number="03" title="PrivateLink — Private Doors to Other People's Services">
        <P>
          <strong>PrivateLink</strong> generalizes interface endpoints: expose <em>any</em>{" "}
          service (yours, a SaaS vendor&apos;s) into consumer VPCs as a private IP — without
          connecting the networks.
        </P>
        <CodeBlock
          title="privatelink_flow.txt"
          runnable={false}
          code={`PROVIDER VPC (you, or Datadog/Snowflake/...)
 ┌──────────────────────────────┐
 │  service ◀── NLB ◀── ENDPOINT SERVICE (the "door")
 └──────────────────▲───────────┘
                    │ PrivateLink (one-way!)
 ┌──────────────────┴───────────┐
 │  interface endpoint (ENI,    │   CONSUMER VPC (your customer)
 │  private IP 10.0.1.7)        │
 │  🖥️ app calls 10.0.1.7 ✅    │
 └──────────────────────────────┘

vs PEERING:                      PRIVATELINK:
 whole networks connected         ONE service exposed
 both sides see each other        one-way: consumer → provider only
 CIDRs must not overlap 😩        overlapping CIDRs? don't care ✅
 transitive: no                   scales to 1000s of consumers

use: SaaS private connectivity, shared internal platform APIs
     across 100 team VPCs, exposing services to customers`}
        />
        <Callout type="analogy">
          🏪 Peering merges two houses into one open-plan home. PrivateLink installs a service
          hatch in your wall: the restaurant next door can hand food through, but cannot
          wander into your living room — and you never see their kitchen.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="transit-gateway" number="04" title="Transit Gateway — The Network Hub ⭐">
        <CodeBlock
          title="mesh_vs_hub.txt"
          runnable={false}
          code={`PEERING MESH (the pain)              TRANSIT GATEWAY (the fix)
  VPC-A ───── VPC-B                    VPC-A   VPC-B   VPC-C
    │ ╲     ╱   │                          ╲     │     ╱
    │   ╳ ╳     │                           🔀 TGW (regional
    │ ╱     ╲   │                          ╱  router hub) ╲
  VPC-C ───── VPC-D                    VPC-D            VPN/DX
                                              to on-prem 🏢
  n VPCs = n(n-1)/2 links            n VPCs = n attachments
  40 VPCs = 780 connects 🤯          40 VPCs = 40. done. ✅
  NOT transitive                     TRANSITIVE routing ⭐`}
        />
        <CodeBlock
          title="tgw_features.txt"
          runnable={false}
          code={`attachments: VPCs, VPN connections, Direct Connect, other TGWs
ROUTE TABLES on the TGW = network segmentation:
   table "prod":   prod VPCs + on-prem can reach each other
   table "dev":    dev VPCs isolated from prod 🔒
   table "shared": everyone reaches shared-services VPC (DNS, AD, CI)
inter-region TGW PEERING → global private backbone 🌍
cost: ~$0.05/h per attachment + $0.02/GB processed
      (peering data is cheaper — 2 VPCs? just peer them)

rule of thumb: ≤ ~3 VPCs → peering. more, or hybrid, or
segmentation needs → Transit Gateway.`}
        />
        <Callout type="analogy">
          ✈️ Peering is point-to-point flights between every pair of cities — fine for 3
          cities, absurd for 40. Transit Gateway is the hub airport: every city flies to the
          hub, the hub routes you anywhere, and the security rules at the hub decide who may
          connect where.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="hybrid" number="05" title="VPN vs Direct Connect — Wiring the Office In ⭐">
        <CodeBlock
          title="two_wires.txt"
          runnable={false}
          code={`1️⃣ SITE-TO-SITE VPN — encrypted tunnel over the INTERNET
 🏢 customer gateway ══ipsec══▶ 🌐 internet ══▶ VGW / TGW
   setup: HOURS ✅ · cost: ~$36/mo+data · bandwidth ~1.25Gbps/tunnel
   latency: internet weather 🌦️ (variable)
   2 tunnels per connection for HA (use both!)

2️⃣ DIRECT CONNECT (DX) — a PHYSICAL fiber into AWS
 🏢 your router ── dedicated fiber @ DX location ──▶ AWS backbone
   setup: WEEKS-MONTHS 🐢 · 1/10/100 Gbps dedicated
   latency: consistent, low ✅ · per-GB egress CHEAPER than internet
   ⚠️ NOT encrypted by default (private, but cipher it yourself
      if needed: MACsec or VPN-over-DX)
   ⚠️ one fiber = one failure point → resilience designs:
      DX + second DX (different location) 💎 max
      DX + VPN as failover ⭐ the pragmatic classic

decision: start with VPN today; order DX when bandwidth,
latency-sensitivity, or egress bills justify the fiber.
(both usually land on a TRANSIT GATEWAY → all VPCs reachable)`}
        />
        <Table
          head={["", "Site-to-Site VPN", "Direct Connect"]}
          rows={[
            ["Medium", "encrypted tunnels over internet", "dedicated private fiber"],
            ["Setup time", "hours", "weeks–months"],
            ["Bandwidth", "~1.25 Gbps per tunnel", "1 / 10 / 100 Gbps guaranteed"],
            ["Latency", "variable (internet)", "consistent, low"],
            ["Encryption", "always (IPsec)", "not by default"],
            ["Use", "quick start, backup link, small offices", "data centers, steady heavy traffic"],
          ]}
        />
      </Section>

      {/* 06 */}
      <Section id="global-accelerator" number="06" title="Global Accelerator vs CloudFront">
        <P>
          Both make global users faster using AWS&apos;s private backbone + edge locations —
          but they solve different problems:
        </P>
        <CodeBlock
          title="ga_vs_cloudfront.txt"
          runnable={false}
          code={`user in São Paulo → app in us-east-1, the slow way:
  🌎 ──── public internet, 15 hops, congestion ──── 🇺🇸

🌐 GLOBAL ACCELERATOR:
  user ─▶ nearest AWS EDGE (São Paulo) ─▶ AWS PRIVATE BACKBONE ─▶ ALB/NLB/EIP
  • gives you 2 STATIC ANYCAST IPs for the whole world ⭐
  • TCP/UDP, any port — gaming, VoIP, APIs (not just HTTP)
  • NO caching — every request still hits your origin, just faster
  • failover between regions in SECONDS (no DNS TTL wait!)
    → great with multi-region active-active

🌍 CLOUDFRONT (recap):
  • CDN: CACHES content at the edge — best when responses repeat
  • HTTP(S) only · dynamic acceleration too, but cache is the point

choose:
  static/cacheable content, HTTP        → CloudFront
  TCP/UDP, static IPs, instant regional
  failover, non-cacheable APIs/games    → Global Accelerator
  (large apps often use BOTH)`}
        />
      </Section>

      {/* 07 */}
      <Section id="dns-advanced" number="07" title="Route 53 Resolver — DNS Across the Hybrid Divide">
        <CodeBlock
          title="hybrid_dns.txt"
          runnable={false}
          code={`the hybrid DNS headache:
 🏢 on-prem server must resolve db.aws.internal (private zone)
 ☁️ EC2 must resolve printer.corp.local (on-prem AD DNS)
 ...but each side's DNS knows nothing about the other 🤷

ROUTE 53 RESOLVER ENDPOINTS:
 INBOUND endpoint   = ENIs in your VPC that ACCEPT queries
   🏢 on-prem DNS ──forward "aws.internal"──▶ inbound EP ─▶ private zones ✅
 OUTBOUND endpoint  = sends queries OUT, per forwarding RULES
   ☁️ EC2 ─▶ VPC DNS ─rule: "*.corp.local → 10.9.0.2"─▶ 🏢 AD DNS ✅

(+ traffic flows over your VPN/DX link, naturally)
+ Resolver DNS FIREWALL: block known-bad domains VPC-wide 🔒`}
        />
      </Section>

      {/* 08 */}
      <Section id="full-map" number="08" title="The Enterprise Network, Drawn">
        <CodeBlock
          title="enterprise_network.txt"
          runnable={false}
          code={`                 🌍 users
            ┌───────┴────────┐
     CloudFront          Global Accelerator
     (static/web)        (APIs, static IPs)
            └───────┬────────┘
   ┌─ region us-east-1 ──────────────────────────────┐
   │   ┌─ prod VPC ─┐ ┌─ data VPC ─┐ ┌─ dev VPC ─┐   │
   │   │ ALB→app→db │ │ lake, EMR  │ │ sandbox   │   │
   │   └─────┬──────┘ └─────┬──────┘ └────┬──────┘   │
   │     gateway EPs (S3/DDB free!) ──┐   │          │
   │     interface EPs (ECR, KMS...)  │   │          │
   │         └──────────┬─────────────┘   │          │
   │                🔀 TRANSIT GATEWAY ◀──┘          │
   │   (route tables: dev ✗ prod · all → shared-svcs)│
   └────────┬──────────────────┬─────────────────────┘
            │ TGW peering      │
   ┌─ region eu-west-1 ─┐      ├── 🔌 Direct Connect (primary)
   │  DR / EU VPCs      │      └── 🔐 Site-to-Site VPN (failover)
   └────────────────────┘             │
                               🏢 on-prem DC
                               (Route 53 Resolver endpoints
                                stitch the DNS together)

every box here is one section of this topic 🧩`}
        />
        <Callout type="tip">
          💡 Sequencing for interviews: start with &quot;VPCs attach to a Transit Gateway hub
          with segmented route tables&quot;, add &quot;DX with VPN failover for on-prem&quot;,
          sprinkle &quot;gateway endpoints so S3 never touches NAT&quot;, finish with
          &quot;CloudFront/Global Accelerator at the edge&quot;. That story covers 90% of
          enterprise networking questions.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Gateway endpoint", "S3/DynamoDB via route table — FREE, kills NAT charges"],
            ["Interface endpoint", "private ENI for 100+ AWS services (PrivateLink)"],
            ["PrivateLink", "expose ONE service one-way — CIDR overlap OK, SaaS standard"],
            ["Peering limits", "1-to-1, NOT transitive, no overlapping CIDRs"],
            ["Transit Gateway", "hub-and-spoke router: VPCs+VPN+DX, transitive ⭐"],
            ["TGW route tables", "segmentation: dev can't reach prod"],
            ["Site-to-Site VPN", "IPsec over internet — hours to set up, ~1.25Gbps/tunnel"],
            ["Direct Connect", "dedicated fiber — weeks, consistent latency, not encrypted"],
            ["Hybrid HA classic", "DX primary + VPN failover"],
            ["Global Accelerator", "2 anycast IPs, TCP/UDP on AWS backbone, no cache"],
            ["GA vs CloudFront", "cacheable HTTP → CF · static IPs/UDP/fast failover → GA"],
            ["Resolver endpoints", "inbound = on-prem→AWS DNS · outbound = AWS→on-prem"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
