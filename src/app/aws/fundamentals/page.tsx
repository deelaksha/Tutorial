"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "AWS Global Infrastructure — Live",
  nodes: [
    { id: "you", icon: "👩‍💻", label: "You", sub: "browser / app", x: 8, y: 50, color: "#22d3ee" },
    { id: "edge", icon: "📍", label: "Edge Location", sub: "CloudFront PoP", x: 32, y: 18, color: "#a78bfa" },
    { id: "region", icon: "🌍", label: "Region", sub: "us-east-1", x: 50, y: 58, color: "#fb923c" },
    { id: "aza", icon: "🏠", label: "AZ-a", sub: "data center", x: 80, y: 28, color: "#34d399" },
    { id: "azb", icon: "🏠", label: "AZ-b", sub: "data center", x: 80, y: 78, color: "#34d399" },
  ],
  edges: [
    { id: "you-edge", from: "you", to: "edge", bend: -20, color: "#a78bfa" },
    { id: "you-region", from: "you", to: "region", bend: 20, color: "#22d3ee" },
    { id: "edge-region", from: "edge", to: "region", dashed: true, color: "#a78bfa" },
    { id: "region-aza", from: "region", to: "aza", color: "#34d399" },
    { id: "region-azb", from: "region", to: "azb", color: "#34d399" },
    { id: "aza-azb", from: "aza", to: "azb", dashed: true, bend: -25, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "request",
      name: "🌍 Normal request",
      command: "GET https://myapp.com →",
      steps: [
        { node: "you", paths: ["you-region"], text: "Your browser sends a request across the internet toward the AWS Region you deployed in (us-east-1)." },
        { node: "region", paths: ["region-aza"], text: "Inside the Region, traffic is routed to one of its isolated Availability Zones — here, AZ-a." },
        { node: "aza", paths: ["aza-azb"], text: "AZ-a serves the response. Meanwhile your data is replicated to AZ-b so a disaster in one building never loses it." },
      ],
    },
    {
      id: "failover",
      name: "🔥 AZ failure",
      command: "AZ-a power outage!",
      steps: [
        { node: "aza", paths: ["region-aza"], text: "💥 AZ-a loses power — every server in that data center goes dark at once." },
        { node: "region", paths: ["region-azb"], text: "The Region instantly routes all new traffic to healthy AZ-b. This is why one Region has 3+ AZs." },
        { node: "azb", paths: ["you-region", "region-azb"], text: "AZ-b already has the replicated data, so users keep working — most never notice anything happened." },
      ],
    },
    {
      id: "edge",
      name: "📍 Edge cache",
      command: "GET /logo.png (cached)",
      steps: [
        { node: "you", paths: ["you-edge"], text: "Static content request goes to the nearest Edge Location — maybe 10ms away in your own city." },
        { node: "edge", paths: ["you-edge"], text: "Cache HIT! The Edge Location returns the file immediately. The Region was never contacted." },
        { node: "edge", paths: ["edge-region"], text: "On a cache MISS, the edge fetches from the Region origin once, stores it, and serves everyone nearby after that." },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-cloud", label: "What Is Cloud Computing?" },
  { id: "onprem-vs-cloud", label: "On-Premises vs Cloud ⭐" },
  { id: "service-models", label: "IaaS vs PaaS vs SaaS ⭐" },
  { id: "deployment-models", label: "Public / Private / Hybrid / Multi" },
  { id: "global-infra", label: "AWS Global Infrastructure ⭐" },
  { id: "regions", label: "Regions — Picking One" },
  { id: "azs", label: "Availability Zones" },
  { id: "edge", label: "Edge Locations" },
  { id: "shared-responsibility", label: "Shared Responsibility Model ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsFundamentalsPage() {
  return (
    <TopicShell
      icon="☁️"
      title="Cloud Fundamentals"
      gradientWord="Cloud Computing"
      subtitle="Before any AWS service: WHAT is the cloud, WHY did everyone stop buying servers, and HOW is AWS physically built — Regions, Availability Zones and Edge Locations drawn on a map you'll never forget."
      nav={NAV}
      badges={["🗺️ Infrastructure drawn", "⚖️ Side-by-side comparisons", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🔐", label: "AWS Account & IAM", href: "/aws/account-security" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-cloud" number="01" title="What Is Cloud Computing, Precisely?">
        <P>
          <strong>Cloud computing</strong> = renting someone else&apos;s computers over the
          internet, paying only for what you use, and getting them in seconds instead of weeks.
          That&apos;s the whole idea. AWS owns millions of servers; you borrow slices of them.
        </P>
        <CodeBlock
          title="the_big_idea.txt"
          runnable={false}
          code={`THE OLD WAY (buy)                    THE CLOUD WAY (rent)

 you need a server                    you need a server
        │                                    │
        ▼                                    ▼
 💸 buy hardware ($10,000+)           🖱️ click "Launch Instance"
 📦 wait 2-6 weeks for delivery       ⏱️ wait ~60 seconds
 🔌 rack it, cable it, cool it        💳 pay ~$0.01-$1 per HOUR
 🧑‍🔧 hire people to maintain it       🗑️ delete it when done — $0
 😰 guess capacity for 3 years        📈 add 100 more during a spike

 capacity is a GUESS                  capacity follows DEMAND`}
        />
        <P>The 5 properties that make something &quot;cloud&quot; (NIST definition, asked in interviews):</P>
        <Table
          head={["Property", "Meaning", "AWS example"]}
          rows={[
            ["On-demand self-service", "get resources yourself, no humans involved", "launch an EC2 instance from the console at 3am"],
            ["Broad network access", "everything available over the network", "APIs, console, CLI from anywhere"],
            ["Resource pooling", "hardware shared between many customers", "your VM and a stranger's VM on the same physical host"],
            ["Rapid elasticity", "scale up AND down in minutes", "10 servers → 1000 for Black Friday → back to 10"],
            ["Measured service", "pay-per-use, metered like electricity", "billed per second / per GB / per request"],
          ]}
        />
        <Callout type="analogy">
          ⚡ The cloud is <strong>electricity</strong>. A century ago factories built their own
          power plants (on-premises). Then the grid arrived: plug in, use what you need, pay the
          meter. Nobody builds a power plant to toast bread — and today, almost nobody builds a
          data center to run a website.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="onprem-vs-cloud" number="02" title="On-Premises vs Cloud — The Trade Drawn ⭐">
        <CodeBlock
          title="onprem_vs_cloud.txt"
          runnable={false}
          code={`ON-PREMISES                            CLOUD (AWS)

 ┌─ YOUR building ────────────┐         ┌─ AWS's buildings ──────────┐
 │  🏢 your data center        │         │  🌍 100+ data centers       │
 │  🖥️ your servers            │         │  🖥️ their servers           │
 │  ❄️ your cooling            │         │  ❄️ their cooling           │
 │  🔌 your power + backup     │         │  🔌 their power + backup    │
 │  🧑‍🔧 your hardware team      │         │  🧑‍🔧 their hardware team     │
 │  💾 your app + data  ◀──────┼── you ──┼─▶ 💾 your app + data        │
 └────────────────────────────┘ manage  └────────────────────────────┘
                                 ONLY
 CAPEX: big money UP FRONT      ─this─   OPEX: small money AS YOU GO
 (capital expenditure)                   (operational expenditure)`}
        />
        <Table
          head={["Question", "On-Premises", "Cloud"]}
          rows={[
            ["Upfront cost", "huge (hardware, building, staff)", "≈ zero"],
            ["Time to get a server", "weeks to months", "minutes"],
            ["Scaling up", "buy more hardware, wait", "API call, seconds"],
            ["Scaling DOWN", "impossible — you own it now", "delete it, stop paying"],
            ["Capacity planning", "guess 3 years ahead", "unnecessary — elastic"],
            ["Who fixes broken disks", "you, at 3am", "AWS, you never notice"],
            ["Global reach", "build a DC on each continent 💸", "deploy to 30+ regions today"],
          ]}
        />
        <Callout type="tip">
          The interview phrasing: cloud converts <strong>CAPEX into OPEX</strong> — big upfront
          capital investments become small ongoing operational costs — and trades{" "}
          <strong>guessing capacity</strong> for <strong>elasticity</strong>.
        </Callout>
        <Callout type="note">
          On-prem isn&apos;t dead: banks, governments and factories keep workloads local for
          compliance, latency or existing investment — which is exactly why{" "}
          <strong>hybrid cloud</strong> (section 04) exists.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="service-models" number="03" title="IaaS vs PaaS vs SaaS — Who Manages What ⭐">
        <P>
          Cloud services come in three depths. The only question that matters:{" "}
          <strong>how much of the stack do YOU manage?</strong>
        </P>
        <CodeBlock
          title="service_models.txt"
          runnable={false}
          code={`              ON-PREM        IaaS           PaaS           SaaS
              (baseline)     (EC2)          (Beanstalk)    (Gmail)

 application   🟦 you         🟦 you         🟦 you          🟧 provider
 data          🟦 you         🟦 you         🟦 you          🟧 provider
 runtime       🟦 you         🟦 you         🟧 provider     🟧 provider
 OS            🟦 you         🟦 you         🟧 provider     🟧 provider
 virtualization🟦 you         🟧 provider    🟧 provider     🟧 provider
 servers       🟦 you         🟧 provider    🟧 provider     🟧 provider
 storage       🟦 you         🟧 provider    🟧 provider     🟧 provider
 networking    🟦 you         🟧 provider    🟧 provider     🟧 provider

               you manage     you manage     you manage      you manage
               EVERYTHING     the OS up      only app+data   NOTHING
                              ⬆ more control          more convenience ⬆`}
        />
        <Table
          head={["Model", "You get", "You manage", "AWS / real examples"]}
          rows={[
            [<strong key="i">IaaS</strong>, "raw virtual machines, storage, networks", "OS, patches, runtime, app", "EC2, EBS, VPC"],
            [<strong key="p">PaaS</strong>, "a platform — just bring code", "only your app + data", "Elastic Beanstalk, RDS, Lambda*"],
            [<strong key="s">SaaS</strong>, "finished software", "nothing — just use it", "Gmail, Salesforce, Dropbox, Zoom"],
          ]}
        />
        <Callout type="analogy">
          🍕 <strong>Pizza as a Service</strong>: made at home = on-prem (you do everything).
          Take-and-bake = IaaS (their pizza, your oven). Delivery = PaaS (you just provide the
          table &amp; drinks). Dining out = SaaS (sit down and eat).
        </Callout>
        <Callout type="tip">
          *Lambda is often called <strong>FaaS</strong> (Functions as a Service) — even higher
          than PaaS: you manage only the function code, not even the runtime scaling.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="deployment-models" number="04" title="Public, Private, Hybrid & Multi-Cloud">
        <CodeBlock
          title="deployment_models.txt"
          runnable={false}
          code={`PUBLIC CLOUD              PRIVATE CLOUD             HYBRID CLOUD
 (AWS, Azure, GCP)         (your own "mini-AWS")

 ┌────────────────┐        ┌────────────────┐       ┌─────────┐ VPN/ ┌───────┐
 │ shared infra,  │        │ cloud tech, but│       │ on-prem │◀────▶│  AWS  │
 │ many customers │        │ ONE org only,  │       │ (legacy,│Direct│(scale,│
 │ pay-as-you-go  │        │ own hardware   │       │ secrets)│Conn. │ new)  │
 └────────────────┘        └────────────────┘       └─────────┘      └───────┘
  cheapest, fastest         control + compliance      best of both worlds

MULTI-CLOUD
 ┌───────┐   ┌───────┐   ┌───────┐
 │  AWS  │ + │ Azure │ + │  GCP  │   two or more public clouds at once
 └───────┘   └───────┘   └───────┘   (avoid lock-in / pick best service)`}
        />
        <Table
          head={["Model", "Best for", "Watch out"]}
          rows={[
            ["Public", "most workloads — startups to enterprises", "data lives on shared infrastructure"],
            ["Private", "strict compliance (banks, government)", "you're back to buying hardware"],
            ["Hybrid", "gradual migration, keep sensitive data local", "complex networking (VPN / Direct Connect)"],
            ["Multi-cloud", "avoiding vendor lock-in, best-of-breed", "2x the expertise needed, 2x the bills"],
          ]}
        />
        <Callout type="note">
          This whole course is about <strong>public cloud</strong> (AWS). Hybrid connectivity
          (VPN, Direct Connect) gets its own treatment in the Advanced Networking topic.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="global-infra" number="05" title="AWS Global Infrastructure — The Three Layers ⭐">
        <P>
          Everything physical in AWS fits a three-layer hierarchy. Learn this picture and every
          later topic (Multi-AZ RDS, CloudFront, DR) snaps into place:
        </P>
        <CodeBlock
          title="global_infrastructure.txt"
          runnable={false}
          code={`🌍 THE WORLD
 │
 ├── 🗺️ REGION (us-east-1, eu-west-2, ap-south-1 ... 30+)
 │    a geographic area = a CLUSTER of data centers
 │    │
 │    ├── 🏢 AVAILABILITY ZONE a  (us-east-1a)  ─┐ isolated DCs,
 │    ├── 🏢 AVAILABILITY ZONE b  (us-east-1b)   ├ separate power/
 │    └── 🏢 AVAILABILITY ZONE c  (us-east-1c)  ─┘ network/flooding
 │         each AZ = 1+ data centers, linked by
 │         private fiber: <2ms latency between AZs
 │
 └── 📡 EDGE LOCATIONS (400+ cities worldwide)
      tiny cache sites near USERS — CloudFront, Route 53
      NOT for running your servers, only caching + DNS

 hierarchy:  Region ⊃ AZs (2-6 per region) ... Edge is separate, everywhere`}
        />
        <Table
          head={["Layer", "Count", "Purpose", "You use it when..."]}
          rows={[
            ["Region", "30+", "where your infrastructure LIVES", "choosing where to deploy"],
            ["Availability Zone", "2–6 per region (100+ total)", "fault isolation WITHIN a region", "designing for high availability"],
            ["Edge Location", "400+", "caching close to users", "CloudFront CDN, Route 53 DNS"],
          ]}
        />
        <Callout type="mistake">
          &quot;us-east-1a is the same building for everyone&quot; — no! AWS shuffles AZ letters
          per account: your <IC>us-east-1a</IC> may be someone else&apos;s <IC>us-east-1c</IC>.
          This spreads load evenly across the physical AZs.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="regions" number="06" title="Regions — How to Pick One">
        <P>
          A region is a named geographic cluster like <IC>us-east-1</IC> (N. Virginia) or{" "}
          <IC>ap-south-1</IC> (Mumbai). Your resources live in ONE region unless you deliberately
          replicate. Four factors decide which one:
        </P>
        <CodeBlock
          title="picking_a_region.txt"
          runnable={false}
          code={`pick a region — the 4-question flowchart:

 1️⃣ COMPLIANCE  "must data stay in-country?" (GDPR, RBI, HIPAA)
        │ yes → that country's region. done.
        ▼ no
 2️⃣ LATENCY    "where are my users?"
        │ → pick the region closest to them
        ▼
 3️⃣ SERVICES   "does that region have the service I need?"
        │ → new services launch in big regions first (us-east-1)
        ▼
 4️⃣ PRICE      "same instance, different price per region"
        → t3.large: ~$0.083/hr Virginia vs ~$0.099/hr São Paulo`}
        />
        <Table
          head={["Region code", "City", "Note"]}
          rows={[
            [<IC key="1">us-east-1</IC>, "N. Virginia", "oldest, biggest, cheapest, gets features first — also where global services (IAM certs, CloudFront) anchor"],
            [<IC key="2">us-west-2</IC>, "Oregon", "popular US west choice"],
            [<IC key="3">eu-west-1</IC>, "Ireland", "the European workhorse"],
            [<IC key="4">ap-south-1</IC>, "Mumbai", "India workloads"],
            [<IC key="5">ap-southeast-1</IC>, "Singapore", "South-East Asia hub"],
          ]}
        />
        <Callout type="note">
          Some services are <strong>global</strong> (IAM, Route 53, CloudFront) — no region
          selection. Most are <strong>regional</strong> (EC2, S3 buckets, VPC) — created in
          exactly one region.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="azs" number="07" title="Availability Zones — Why Apps Survive Disasters">
        <P>
          An AZ is one or more data centers with <strong>independent</strong> power, cooling and
          networking. AZs in a region are far enough apart that a flood or fire can&apos;t take
          out two — but close enough for ~1-2ms fiber links between them.
        </P>
        <CodeBlock
          title="multi_az.txt"
          runnable={false}
          code={`single-AZ app (fragile):              multi-AZ app (survives):

 us-east-1a                           us-east-1a        us-east-1b
 ┌──────────────┐                     ┌────────────┐    ┌────────────┐
 │ web + db 🖥️  │                     │  web 🖥️    │    │  web 🖥️    │
 └──────────────┘                     │  db (main) │───▶│ db (copy)  │
        │                             └────────────┘    └────────────┘
   ⚡ AZ power failure                       │  ⚡ AZ-a fails      │
        │                                    ▼                     ▼
        ▼                              traffic shifts to AZ-b, copy
   💥 app is DOWN                      promoted → app STAYS UP ✅`}
        />
        <Callout type="tip">
          ⭐ The #1 AWS design rule: <strong>always run across at least 2 AZs</strong>. Load
          balancers, Auto Scaling groups and RDS Multi-AZ exist exactly for this — they get their
          own topics later.
        </Callout>
        <Callout type="behind">
          AZs within a region are typically &lt;100 km apart. The private fiber between them is so
          fast that a database can replicate to another AZ <em>synchronously</em> — every write
          confirmed in both buildings before your app gets the &quot;OK&quot;.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="edge" number="08" title="Edge Locations — The 400+ Mini-Outposts">
        <P>
          Regions are few and far away; users are everywhere. <strong>Edge locations</strong> are
          small AWS sites in 400+ cities that <em>cache</em> content close to users:
        </P>
        <CodeBlock
          title="edge_locations.txt"
          runnable={false}
          code={`WITHOUT edge (every request crosses the planet):
 👩 user in Delhi ──── 220ms round trip ────▶ 🗺️ server in Virginia

WITH CloudFront edge caching:
 👩 user in Delhi ── 20ms ──▶ 📡 Delhi edge location
                                 │ cache HIT  → serve instantly ✅
                                 │ cache MISS → fetch once from
                                 ▼              Virginia, then cache
                              🗺️ us-east-1 (origin)

 first viewer:  slow-ish (fills the cache)
 next 10,000:   served from 20ms away 🚀`}
        />
        <Table
          head={["", "Region", "Edge location"]}
          rows={[
            ["Runs EC2 / RDS / your code?", "✅ yes", "❌ no (cache + DNS only)"],
            ["Count", "30+", "400+"],
            ["Used by", "almost every service", "CloudFront, Route 53, Global Accelerator"],
            ["You pick it?", "yes, explicitly", "no — nearest one is automatic"],
          ]}
        />
        <Callout type="analogy">
          🏪 Regions are <strong>warehouses</strong>; edge locations are{" "}
          <strong>corner shops</strong>. The warehouse stocks everything; the corner shop keeps
          the popular items so you don&apos;t drive across the country for milk.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="shared-responsibility" number="09" title="The Shared Responsibility Model ⭐">
        <P>
          The most-quoted security slide in AWS history. One line splits all security duties:{" "}
          AWS secures the cloud itself; <strong>you</strong> secure what you put in it.
        </P>
        <CodeBlock
          title="shared_responsibility.txt"
          runnable={false}
          code={`YOU — security IN the cloud
 ┌────────────────────────────────────────────────────┐
 │ your data (encrypt it!)                            │
 │ IAM users, roles, permissions, MFA                 │
 │ OS patches on YOUR EC2 instances                   │
 │ security groups, firewall rules, network config    │
 │ application code & its vulnerabilities             │
 ├────────────────────────────────────────────────────┤  ← the line
 │ hypervisor & virtualization layer                  │
 │ physical servers, disks, networking gear           │
 │ data center buildings, guards, cameras, power      │
 │ the global fiber backbone                          │
 └────────────────────────────────────────────────────┘
 AWS — security OF the cloud`}
        />
        <Table
          head={["Scenario", "Whose fault?"]}
          rows={[
            ["S3 bucket left public, data leaked", "YOU — bucket config is your job"],
            ["disk in a data center fails", "AWS — physical hardware"],
            ["EC2 hacked via unpatched OS", "YOU — you patch the guest OS"],
            ["RDS underlying host patched", "AWS — managed service host"],
            ["IAM access key leaked on GitHub", "YOU — credential hygiene"],
            ["power outage in a data center", "AWS — infrastructure"],
          ]}
        />
        <Callout type="tip">
          The responsibility line <strong>moves with the service model</strong>: on EC2 (IaaS) you
          patch the OS; on RDS (managed) AWS patches it; on Lambda you manage only code. Higher
          abstraction = less for you to secure.
        </Callout>
        <Callout type="mistake">
          &quot;It&apos;s on AWS, so it&apos;s secure&quot; — the cause of nearly every cloud data
          breach in the news. Misconfigured buckets and leaked keys are <em>customer</em>-side
          failures. AWS gives you the locks; you must turn them.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Cloud =", "on-demand IT, pay-as-you-go, over the internet"],
            ["Cloud vs on-prem", "CAPEX → OPEX, guessing → elasticity"],
            ["IaaS", "raw VMs — you manage OS and up (EC2)"],
            ["PaaS", "bring code only (Elastic Beanstalk)"],
            ["SaaS", "finished software (Gmail)"],
            ["Region", "geographic cluster of data centers (30+)"],
            ["AZ", "isolated data center(s) in a region — use 2+ always"],
            ["Edge location", "400+ cache sites near users (CloudFront)"],
            ["Hierarchy", "Region ⊃ 2-6 AZs · edges everywhere"],
            ["Shared responsibility", "AWS: OF the cloud · You: IN the cloud"],
            ["Global services", "IAM, Route 53, CloudFront"],
            ["Regional services", "EC2, VPC, S3 buckets, RDS"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
