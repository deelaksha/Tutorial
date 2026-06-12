"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "VPC Traffic Paths — Live",
  nodes: [
    { id: "internet", icon: "🌐", label: "Internet", sub: "the outside world", x: 8, y: 50, color: "#22d3ee" },
    { id: "igw", icon: "🚪", label: "IGW", sub: "internet gateway", x: 30, y: 50, color: "#fb923c" },
    { id: "web", icon: "🖥️", label: "Web Server", sub: "PUBLIC subnet", x: 56, y: 18, color: "#34d399" },
    { id: "nat", icon: "🔄", label: "NAT Gateway", sub: "public subnet", x: 56, y: 78, color: "#fbbf24" },
    { id: "app", icon: "🔒", label: "App Server", sub: "PRIVATE subnet", x: 84, y: 48, color: "#a78bfa" },
  ],
  edges: [
    { id: "internet-igw", from: "internet", to: "igw", color: "#22d3ee" },
    { id: "igw-web", from: "igw", to: "web", color: "#34d399" },
    { id: "web-app", from: "web", to: "app", color: "#a78bfa" },
    { id: "app-nat", from: "app", to: "nat", bend: 18, color: "#fbbf24" },
    { id: "nat-igw", from: "nat", to: "igw", bend: -20, color: "#fbbf24" },
    { id: "internet-app", from: "internet", to: "app", bend: -70, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "inbound",
      name: "📥 Inbound request",
      command: "GET https://myapp.com → 10.0.1.x",
      steps: [
        { node: "internet", paths: ["internet-igw"], text: "A user's request arrives at your VPC's single front door: the Internet Gateway." },
        { node: "web", paths: ["igw-web"], text: "The public subnet's route table (0.0.0.0/0 → IGW) lets it reach the web server, which has a public IP." },
        { node: "app", paths: ["web-app"], text: "The web tier forwards to the app server on its PRIVATE IP (10.0.2.x). The app server is invisible from outside. 📥" },
      ],
    },
    {
      id: "outbound",
      name: "📤 Private → out (NAT)",
      command: "app-server$ sudo apt update",
      steps: [
        { node: "app", paths: ["app-nat"], text: "The private app server needs OS updates — it must reach the internet but has NO public IP." },
        { node: "nat", paths: ["nat-igw"], text: "Its route table sends 0.0.0.0/0 → NAT Gateway. NAT swaps the private source IP for its own public Elastic IP." },
        { node: "igw", paths: ["internet-igw"], text: "Packets exit through the IGW. Replies flow back through NAT — but NOBODY outside can initiate a connection inward. 📤" },
      ],
    },
    {
      id: "blocked",
      name: "⛔ Direct attack",
      command: "attacker$ nmap 10.0.2.50",
      steps: [
        { node: "internet", paths: ["internet-app"], text: "An attacker tries to reach the app server directly from the internet." },
        { node: "app", paths: [], text: "Impossible: the server has no public IP, and the private subnet's route table has NO route to the IGW. The packet can't even arrive. ⛔" },
        { node: "igw", paths: [], text: "This is defense by architecture — private subnets aren't \"firewalled off\" the internet, they're simply not connected to it." },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-vpc", label: "What Is a VPC?" },
  { id: "cidr", label: "CIDR — Reading 10.0.0.0/16 ⭐" },
  { id: "subnets", label: "Subnets — Public vs Private ⭐" },
  { id: "route-tables", label: "Route Tables" },
  { id: "igw", label: "Internet Gateway" },
  { id: "nat", label: "NAT Gateway ⭐" },
  { id: "sg-vs-nacl", label: "Security Groups vs NACLs ⭐" },
  { id: "full-picture", label: "The Full VPC, Assembled ⭐" },
  { id: "peering-tgw", label: "VPC Peering & Transit Gateway" },
  { id: "trace", label: "Trace a Packet End-to-End" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsVpcPage() {
  return (
    <TopicShell
      icon="🕸️"
      title="VPC Networking"
      gradientWord="VPC"
      subtitle="The most important AWS topic. Build one real network box by box — CIDR plan, public and private subnets, route tables, Internet Gateway, NAT — until you can trace any packet from a user's browser to a private database and back."
      nav={NAV}
      badges={["🕸️ Network drawn box by box", "📍 Packet tracing", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "📡", label: "Route 53 & CloudFront", href: "/aws/dns-cdn" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-vpc" number="01" title="What Is a VPC, Precisely?">
        <P>
          A <strong>VPC (Virtual Private Cloud)</strong> is your own private, isolated slice of
          the AWS network in one region — your IP range, your subnets, your routing rules, your
          firewalls. Nothing gets in or out unless you build a door.
        </P>
        <CodeBlock
          title="vpc_concept.txt"
          runnable={false}
          code={`AWS REGION (us-east-1) — a shared continent of network
 ┌────────────────────────────────────────────────────────┐
 │   your VPC 10.0.0.0/16          someone else's VPC     │
 │  ┌───────────────────────┐     ┌───────────────────┐   │
 │  │ 🏰 your private city   │     │ 🏰 their city      │   │
 │  │ your EC2, RDS, ...    │ ✋  │                   │   │
 │  │ invisible to them ────┼─────┼── invisible to you│   │
 │  └───────────────────────┘     └───────────────────┘   │
 └────────────────────────────────────────────────────────┘

 a VPC is REGIONAL → it spans all AZs in its region
 every account gets a "default VPC" (training wheels);
 production = a VPC you design deliberately`}
        />
        <Callout type="analogy">
          🏰 A VPC is a <strong>walled city</strong> you found in AWS&apos;s continent: you draw
          the districts (subnets), pave the roads (route tables), and decide where the city gates
          go (gateways). The rest of this page builds that city, one structure at a time.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="cidr" number="02" title="CIDR — How to Read 10.0.0.0/16 ⭐">
        <P>
          Every VPC starts with a <strong>CIDR block</strong> — its range of private IP
          addresses. The <IC>/number</IC> says how many addresses you get:
        </P>
        <CodeBlock
          title="cidr_decoder.txt"
          runnable={false}
          code={`10.0.0.0/16
 └──┬───┘ └┬┘
 start IP  how many leading BITS are FIXED (of 32 total)

 /16 → first 16 bits fixed → last 16 bits free
     → 2^16 = 65,536 addresses:  10.0.0.0 → 10.0.255.255

 the sizes you'll actually use:
 ┌───────┬─────────────┬──────────────────────────────┐
 │ /16   │ 65,536 IPs  │ a whole VPC (the common max) │
 │ /24   │ 256 IPs     │ a typical subnet             │
 │ /28   │ 16 IPs      │ tiny subnet (minimum)        │
 │ /32   │ 1 IP        │ exactly one host (firewalls) │
 └───────┴─────────────┴──────────────────────────────┘
 rule: bigger /number = smaller network (each +1 halves it)

 0.0.0.0/0 = "every IP on the internet" ← you'll see this in routes
 private ranges (RFC1918): 10.x.x.x · 172.16-31.x.x · 192.168.x.x
 ⚠️ AWS reserves 5 IPs per subnet (.0 .1 .2 .3 .255) — a /24 nets 251`}
        />
        <Callout type="mistake">
          Picking <IC>10.0.0.0/16</IC> for EVERY VPC feels tidy — until two VPCs must peer or
          connect to the office VPN: <strong>overlapping CIDRs cannot be routed</strong>. Plan
          unique ranges per VPC/environment up front (e.g. 10.0/16 prod, 10.1/16 staging).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="subnets" number="03" title="Subnets — Public vs Private ⭐">
        <P>
          A <strong>subnet</strong> is a slice of the VPC&apos;s CIDR pinned to{" "}
          <strong>one AZ</strong>. The public/private split is THE core pattern of cloud
          networking:
        </P>
        <CodeBlock
          title="subnet_layout.txt"
          runnable={false}
          code={`VPC 10.0.0.0/16  (region us-east-1)
 ┌──────────────────────────────────────────────────────────┐
 │        AZ us-east-1a          │       AZ us-east-1b      │
 │  ┌─────────────────────────┐  │  ┌──────────────────────┐│
 │  │ 🌐 PUBLIC subnet         │  │  │ 🌐 PUBLIC subnet      ││
 │  │    10.0.1.0/24          │  │  │    10.0.2.0/24       ││
 │  │    load balancers,      │  │  │                      ││
 │  │    NAT gateway, bastion │  │  │                      ││
 │  ├─────────────────────────┤  │  ├──────────────────────┤│
 │  │ 🔒 PRIVATE subnet        │  │  │ 🔒 PRIVATE subnet     ││
 │  │    10.0.11.0/24         │  │  │    10.0.12.0/24      ││
 │  │    app servers, RDS     │  │  │                      ││
 │  └─────────────────────────┘  │  └──────────────────────┘│
 └──────────────────────────────────────────────────────────┘

 PUBLIC subnet  = its route table has a route to the Internet Gateway
 PRIVATE subnet = it doesn't. that's the WHOLE difference. (next section)

 ⭐ standard pattern: 2+ AZs × (public + private) = 4+ subnets minimum`}
        />
        <Table
          head={["", "Public subnet", "Private subnet"]}
          rows={[
            ["Reachable from internet", "✅ (if instance has public IP)", "❌ never directly"],
            ["Typical residents", "load balancers, NAT GW, bastion hosts", "app servers, databases, caches"],
            ["Default for...", "things that MUST face users", "everything else (most of your fleet!)"],
          ]}
        />
        <Callout type="tip">
          Interview phrasing: &quot;what makes a subnet public?&quot; — <em>not</em> a checkbox,
          but <strong>a route to an Internet Gateway in its route table</strong>. Saying exactly
          that signals you actually understand VPCs.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="route-tables" number="04" title="Route Tables — The Road Signs">
        <P>
          Every subnet consults exactly one <strong>route table</strong>: a list of
          &quot;destination → next hop&quot; rules. The most specific match wins:
        </P>
        <CodeBlock
          title="route_tables.txt"
          runnable={false}
          code={`PUBLIC route table                    PRIVATE route table
 ┌─────────────────┬──────────┐        ┌─────────────────┬──────────┐
 │ destination     │ target   │        │ destination     │ target   │
 ├─────────────────┼──────────┤        ├─────────────────┼──────────┤
 │ 10.0.0.0/16     │ local    │        │ 10.0.0.0/16     │ local    │
 │ 0.0.0.0/0       │ igw-abc  │        │ 0.0.0.0/0       │ nat-xyz  │
 └─────────────────┴──────────┘        └─────────────────┴──────────┘
   "inside VPC? stay local.              "inside VPC? stay local.
    anything else? → internet             anything else? → NAT
    gateway" = PUBLIC                     gateway" = private w/ egress

 how a packet picks its road:
 to 10.0.11.7  → matches 10.0.0.0/16 → local (VPC internal) ✅
 to 142.250.4.27 (google) → only 0.0.0.0/0 matches → igw / nat
 LONGEST PREFIX WINS: /16 is more specific than /0`}
        />
        <Callout type="note">
          The <IC>local</IC> route (the VPC&apos;s own CIDR) exists in every route table and
          can&apos;t be removed — <strong>everything inside a VPC can route to everything else
          inside it</strong> by default; security groups are what limit it.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="igw" number="05" title="Internet Gateway — The Front Door">
        <P>
          The <strong>Internet Gateway (IGW)</strong> is the VPC&apos;s connection to the public
          internet — attached once per VPC, infinitely scalable, free:
        </P>
        <CodeBlock
          title="igw.txt"
          runnable={false}
          code={`for an instance to be reachable FROM the internet,
ALL FOUR must be true:

 1️⃣ VPC has an IGW attached            ┌─────────── VPC ───────────┐
 2️⃣ subnet routes 0.0.0.0/0 → IGW      │  ┌─ public subnet ─┐      │
 3️⃣ instance has a PUBLIC IP           │  │  🖥️ EC2          │      │
 4️⃣ security group allows the port     │  │  pub: 54.23.1.8 │      │
                                        │  │  prv: 10.0.1.5  │      │
 🌍 internet                            │  └────────┬────────┘      │
   │    54.23.1.8                       │           │               │
   └──────────▶ ┌─────┐  1:1 NAT        │           │               │
                │ IGW │ ◀───────────────┼───────────┘               │
                └─────┘  54.23.1.8 ⇄ 10.0.1.5                      │
                                        └───────────────────────────┘
 the instance NEVER sees its public IP — the IGW translates
 public ⇄ private on the way through (1-to-1 NAT)`}
        />
        <Callout type="mistake">
          &quot;I attached an IGW but can&apos;t reach my instance&quot; — check the other three:
          route table entry, public IP on the instance, security group. The IGW alone does
          nothing; the <strong>route</strong> makes a subnet public.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="nat" number="06" title="NAT Gateway — Outbound-Only for Private Subnets ⭐">
        <P>
          Private instances still need to <em>start</em> conversations with the internet — OS
          updates, calling external APIs, pulling packages. The <strong>NAT Gateway</strong>{" "}
          gives them an outbound-only path:
        </P>
        <CodeBlock
          title="nat_gateway.txt"
          runnable={false}
          code={`🔒 private EC2 (10.0.11.7) runs: dnf update

 ┌──────────────────── VPC ─────────────────────┐
 │ ┌─ private subnet ─┐   ┌─ public subnet ──┐  │
 │ │ 🖥️ 10.0.11.7      │   │  ┌─────┐          │  │      🌍
 │ │   "get updates!" ─┼──▶│  │ NAT │──────────┼──┼──▶ IGW ──▶ repo
 │ │                  │   │  └─────┘          │  │      server
 │ │ ◀────────────────┼───┼── response comes  │  │
 │ └──────────────────┘   │   back the same   │  │
 │                        │   path ✅          │  │
 └──────────────────────────────────────────────┘

 ✅ OUT: private instance → NAT → IGW → internet     works
 ⛔ IN:  internet → NAT → private instance           IMPOSSIBLE
        (NAT only forwards replies to conversations
         that started from inside)

 placement rules: NAT lives IN a public subnet, per-AZ for HA
 cost: ~$32/mo + per-GB 💸 — the classic forgotten-lab-bill`}
        />
        <Table
          head={["", "Internet Gateway", "NAT Gateway"]}
          rows={[
            ["Direction", "two-way (in + out)", "outbound-only (replies allowed back)"],
            ["Serves", "public subnets", "private subnets"],
            ["Count", "one per VPC", "one per AZ (recommended)"],
            ["Cost", "free", "~$0.045/hr + per-GB"],
          ]}
        />
        <Callout type="analogy">
          📬 The NAT Gateway is the <strong>office mailroom</strong>: employees (private
          instances) can send letters out and receive the replies, but a stranger can&apos;t mail
          themselves into the building — the mailroom only matches incoming mail to conversations
          employees started.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="sg-vs-nacl" number="07" title="Security Groups vs NACLs — Two Fences ⭐">
        <P>
          Two firewall layers, endlessly compared in interviews. The differences that matter:
        </P>
        <CodeBlock
          title="sg_vs_nacl.txt"
          runnable={false}
          code={`packet from the internet to your instance passes BOTH:

 🌍 ──▶ │NACL│ ──▶ subnet ──▶ (SG) ──▶ 🖥️ instance
         at the subnet         wrapped around the
         boundary (moat)       instance itself (bodyguard)

 NACL                              SECURITY GROUP
 ──────────────────────────        ──────────────────────────
 subnet level                      instance (ENI) level
 STATELESS — reply traffic         STATEFUL — replies auto-
   needs its own rule!               allowed, no return rule
 ALLOW and DENY rules              ALLOW rules only
 rules numbered, evaluated         all rules evaluated
   in order, first match wins        together
 default NACL: allow all           default SG: deny all in,
                                     allow all out`}
        />
        <Table
          head={["Question", "Answer"]}
          rows={[
            ["Day-to-day workhorse?", "Security groups — 95% of your firewall work"],
            ["Block ONE bad IP address?", "NACL — SGs can't write deny rules"],
            ["Why is my reply traffic dropped?", "custom NACL is stateless — add outbound (ephemeral port) rules"],
            ["Defense in depth?", "both: NACL = coarse subnet moat, SG = precise instance guard"],
          ]}
        />
        <Callout type="tip">
          The exam loves <strong>stateful vs stateless</strong>: SG remembers connections (reply
          auto-allowed); NACL inspects every packet fresh (reply needs an explicit rule on
          ephemeral ports 1024-65535).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="full-picture" number="08" title="The Full VPC, Assembled ⭐">
        <P>Every block from this page in one production-grade diagram — the architecture behind most real web apps:</P>
        <CodeBlock
          title="production_vpc.txt"
          runnable={false}
          code={`                          🌍 INTERNET
                               │
                            ┌──┴──┐
                            │ IGW │
                            └──┬──┘
 VPC 10.0.0.0/16 ──────────────┼──────────────────────────────┐
 │            AZ-a             │             AZ-b             │
 │ ┌─ public 10.0.1.0/24 ──────┴──┐ ┌─ public 10.0.2.0/24 ──┐ │
 │ │   ⚖️ load balancer (spans both subnets)        ⚖️      │ │
 │ │   ┌─────┐                    │ │                       │ │
 │ │   │ NAT │                    │ │   (NAT b for HA)      │ │
 │ └───┴──┬──┴────────────────────┘ └───────────────────────┘ │
 │        │ outbound only              ▲ routes 0.0.0.0/0→IGW │
 │ ┌─ private 10.0.11.0/24 ────────┐ ┌─ private 10.0.12.0/24┐ │
 │ │   🖥️ app server  ◀────────────┼─┼──🖥️ app server        │ │
 │ │      ▲ SG: only from LB's SG  │ │     (auto scaling)   │ │
 │ └──────┼────────────────────────┘ └───────────┬──────────┘ │
 │ ┌─ private 10.0.21.0/24 ────────┐ ┌─ private 10.0.22.0/24┐ │
 │ │   🗄️ RDS primary ═════════════╪═╪══ RDS standby (sync) │ │
 │ │      SG: only port 5432       │ │   (Multi-AZ)         │ │
 │ │      from app SG              │ │                      │ │
 │ └───────────────────────────────┘ └──────────────────────┘ │
 └─────────────────────────────────────────────────────────────┘

 the security-group chain (no IPs, just SG references!):
 LB-SG: allow 443 from 0.0.0.0/0
 APP-SG: allow 8080 from LB-SG          ← SG as source ⭐
 DB-SG: allow 5432 from APP-SG`}
        />
        <Callout type="tip">
          The <strong>SG-references-SG chain</strong> is the professional pattern: rules follow
          the architecture, not fragile IP lists. New app instance from auto-scaling?
          Automatically allowed at the DB — it wears APP-SG.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="peering-tgw" number="09" title="VPC Peering & Transit Gateway">
        <CodeBlock
          title="peering_vs_tgw.txt"
          runnable={false}
          code={`VPC PEERING — private link between TWO VPCs
   VPC-A 10.0.0.0/16 ◀═══ peering ═══▶ VPC-B 10.1.0.0/16
   + add routes both sides · CIDRs must NOT overlap
   ⚠️ NOT transitive: A↔B and B↔C does NOT give A↔C!

 the mesh problem:               TRANSIT GATEWAY — the hub:
 4 VPCs = 6 peerings 😐           ┌─────┐  ┌─────┐
 10 VPCs = 45 peerings 😱         │VPC-A│  │VPC-B│
   A ─ B                          └──┬──┘  └──┬──┘
   │ ╳ │   every pair,            ┌──▼───────▼──┐    ┌────────┐
   C ─ D   every route table      │     TGW     │◀──▶│ on-prem│
                                  └──┬───────┬──┘    │  (VPN) │
                                  ┌──▼──┐ ┌──▼──┐    └────────┘
                                  │VPC-C│ │VPC-D│
                                  └─────┘ └─────┘
 rule of thumb: 2-3 VPCs → peering · more (or hybrid) → TGW`}
        />
        <Table
          head={["", "Peering", "Transit Gateway"]}
          rows={[
            ["Topology", "point-to-point", "hub and spoke"],
            ["Transitive routing", "❌", "✅"],
            ["Scales to", "a few VPCs", "thousands of VPCs + VPN/DX"],
            ["Cost", "data transfer only", "per-attachment + per-GB"],
          ]}
        />
        <Callout type="note">
          Transit Gateway, PrivateLink and VPC endpoints get a full deep dive in the{" "}
          <strong>Advanced Networking</strong> topic — here you just need the shape of the
          problem each solves.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="trace" number="10" title="Trace a Packet End-to-End — The Final Exam">
        <P>
          If you can narrate these two journeys aloud, you understand VPCs better than most
          working engineers:
        </P>
        <CodeBlock
          title="packet_trace.txt"
          runnable={false}
          code={`JOURNEY 1 — user loads your site:
 👩 browser → https://yourapp.com
 1. Route 53 resolves to the load balancer's public IPs
 2. packet hits IGW → NACL (public subnet) → LB's security group ✅
 3. ⚖️ LB picks a healthy app instance in a PRIVATE subnet
 4. route: 10.0.11.7 matches "10.0.0.0/16 → local" ✅
 5. APP-SG allows 8080 from LB-SG ✅ → app handles request
 6. app queries RDS: DB-SG allows 5432 from APP-SG ✅
 7. response retraces the path (SGs stateful — no extra rules) 🎉

 JOURNEY 2 — that private app instance calls a payments API:
 1. destination api.stripe.com → only 0.0.0.0/0 matches
 2. private route table: 0.0.0.0/0 → NAT gateway
 3. NAT (public subnet) forwards via IGW, rewrites source IP
 4. reply returns to NAT → matched to the conversation → instance ✅
 5. stripe can NEVER initiate a connection inward ⛔ — by design`}
        />
        <Callout type="tip">
          Debug checklist when &quot;it doesn&apos;t connect&quot; (in order): instance running? →
          security group? → route table? → NACL? → public IP/IGW or NAT present? Nine times out
          of ten it&apos;s the security group.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["VPC", "your isolated network in one region, spans its AZs"],
            ["CIDR /16 vs /24", "65,536 IPs vs 256 — bigger / = smaller net"],
            ["0.0.0.0/0", "\"the whole internet\" — the default route"],
            ["Subnet", "slice of VPC CIDR, pinned to ONE AZ"],
            ["Public subnet =", "route table has 0.0.0.0/0 → IGW. that's it."],
            ["IGW", "two-way door, 1 per VPC, free, does 1:1 NAT"],
            ["NAT gateway", "outbound-only for private subnets; lives in public subnet; $$"],
            ["Route table", "destination→target list; longest prefix wins"],
            ["SG vs NACL", "instance·stateful·allow-only vs subnet·stateless·allow+deny"],
            ["SG chain", "LB-SG → APP-SG → DB-SG (SGs reference SGs)"],
            ["Peering", "2 VPCs, NOT transitive, CIDRs can't overlap"],
            ["Transit Gateway", "hub-and-spoke router for many VPCs + on-prem"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
