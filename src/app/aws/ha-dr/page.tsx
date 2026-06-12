"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Multi-Region Failover — Live",
  nodes: [
    { id: "users", icon: "👥", label: "Users", sub: "worldwide", x: 8, y: 50, color: "#22d3ee" },
    { id: "r53", icon: "🌐", label: "Route 53", sub: "health checks", x: 32, y: 50, color: "#fb923c" },
    { id: "primary", icon: "🌎", label: "Region A", sub: "us-east-1 · ACTIVE", x: 66, y: 20, color: "#34d399" },
    { id: "dr", icon: "🌏", label: "Region B", sub: "eu-west-1 · standby", x: 66, y: 80, color: "#a78bfa" },
    { id: "data", icon: "🔁", label: "Replication", sub: "Aurora Global · S3 CRR", x: 92, y: 50, color: "#fbbf24" },
  ],
  edges: [
    { id: "users-r53", from: "users", to: "r53", color: "#22d3ee" },
    { id: "r53-primary", from: "r53", to: "primary", color: "#34d399" },
    { id: "r53-dr", from: "r53", to: "dr", dashed: true, color: "#a78bfa" },
    { id: "primary-data", from: "primary", to: "data", dashed: true, color: "#fbbf24" },
    { id: "data-dr", from: "data", to: "dr", dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "normal",
      name: "☀️ Normal day",
      command: "RTO 15 min · RPO 1 s (warm standby)",
      steps: [
        { node: "users", paths: ["users-r53", "r53-primary"], text: "Route 53's failover policy sends 100% of traffic to the ACTIVE Region A while its health check stays green." },
        { node: "primary", paths: ["primary-data"], text: "Region A serves everything. Aurora Global Database streams every write to Region B with ~1 second lag." },
        { node: "dr", paths: ["data-dr"], text: "Region B runs a minimal \"warm standby\": data is current, but the app fleet is scaled tiny. Cost: ~15% of prod. ☀️" },
      ],
    },
    {
      id: "disaster",
      name: "🌋 Region failure",
      command: "us-east-1: health check FAILING (3/3)",
      steps: [
        { node: "primary", paths: ["r53-primary"], text: "🌋 Region A has a major outage. The Route 53 health check fails 3 consecutive times — endpoint declared unhealthy." },
        { node: "r53", paths: ["r53-dr"], text: "Route 53 automatically flips DNS answers to Region B. New connections start landing in Europe." },
        { node: "dr", paths: ["data-dr", "r53-dr"], text: "Aurora secondary is PROMOTED to writer, the standby fleet scales out. Live again in ~15 min, having lost ≤1s of data. 🌋" },
      ],
    },
    {
      id: "recovery",
      name: "🌅 Recovery",
      command: "us-east-1 healthy again — fail back?",
      steps: [
        { node: "primary", paths: ["data-dr"], text: "Hours later AWS restores Region A. Don't rush back! Replication first reverses: B → A until data is in sync." },
        { node: "r53", paths: ["r53-primary"], text: "During a calm window, you fail back deliberately — flip Route 53, watch dashboards, keep B warm in case." },
        { node: "users", paths: ["users-r53", "r53-primary"], text: "Users never knew which continent served them. That's the whole game: practiced, boring failovers. 🌅" },
      ],
    },
  ],
};

const NAV = [
  { id: "vocabulary", label: "HA vs FT vs DR — Vocabulary ⭐" },
  { id: "rto-rpo", label: "RTO & RPO — The Two Numbers ⭐" },
  { id: "multi-az", label: "Multi-AZ — HA by Default ⭐" },
  { id: "multi-region", label: "Multi-Region — When & Why" },
  { id: "dr-patterns", label: "The 4 DR Patterns ⭐" },
  { id: "backups", label: "Backups — The Foundation" },
  { id: "failover", label: "Failover Mechanics — DNS & Data" },
  { id: "testing", label: "Testing DR — GameDays" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsHaDrPage() {
  return (
    <TopicShell
      icon="🛟"
      title="High Availability & Disaster Recovery"
      gradientWord="Disaster Recovery"
      subtitle="Everything fails, all the time — so architect for it. Two numbers (RTO, RPO) drive every decision, Multi-AZ handles the everyday failures, and four DR patterns — backup-restore, pilot light, warm standby, active-active — cover the catastrophes."
      nav={NAV}
      badges={["⏱️ RTO/RPO timeline", "🔥 4 DR patterns", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🕸️", label: "Advanced Networking", href: "/aws/advanced-networking" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="vocabulary" number="01" title="HA vs Fault Tolerance vs DR — Vocabulary ⭐">
        <CodeBlock
          title="three_terms.txt"
          runnable={false}
          code={`🛡️ HIGH AVAILABILITY (HA)   survive SMALL failures with little/no
                            downtime — an instance dies, an AZ wobbles
                            tool: redundancy within a region (Multi-AZ)

💪 FAULT TOLERANCE (FT)     stronger: ZERO interruption even during
                            failure — N+1 capacity absorbs the loss
                            (HA may blip for seconds; FT may not)

🔥 DISASTER RECOVERY (DR)   survive BIG failures — region down,
                            account compromised, ransomware,
                            "we deleted the production database"
                            tool: copies in ANOTHER region + a plan

scale of bad days:
 disk dies ──── instance dies ──── AZ down ──── REGION down ── account
 └────────── HA handles these ───────────┘     └─── DR territory ───┘`}
        />
        <CodeBlock
          title="the_nines.txt"
          runnable={false}
          code={`availability is measured in "nines" (per year):
 99%      = 3.65 DAYS down     hobby project
 99.9%    = 8.77 hours         typical internal app
 99.99%   = 52.6 minutes       serious product (Multi-AZ gets you here)
 99.999%  = 5.26 minutes       multi-region, deep pockets 💰

each extra nine ≈ 10× the engineering cost.
serial chain kills nines: A(99.9%) → B(99.9%) → C(99.9%) = 99.7%!`}
        />
        <Callout type="analogy">
          🚗 HA = a spare tire (brief stop, you continue). FT = run-flat tires (never stop).
          DR = insurance + a rental car plan for when the whole car burns down. You need
          different preparations for a flat than for a fire.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="rto-rpo" number="02" title="RTO & RPO — The Two Numbers That Decide Everything ⭐">
        <P>
          Every DR conversation starts with two numbers. Draw this timeline in interviews:
        </P>
        <CodeBlock
          title="rto_rpo_timeline.txt"
          runnable={false}
          code={`            last good        💥 DISASTER          service
            backup/replica         │                restored
 ──────────────●───────────────────●───────────────────●──────▶ time
                ◀────── RPO ──────▶ ◀────── RTO ──────▶
                "how much DATA      "how much TIME
                 do we lose?"        until we're back?"

 RPO (Recovery POINT Objective) — driven by how often data is copied:
   nightly backup        → RPO up to 24h 😬
   continuous replication → RPO ≈ seconds ✅

 RTO (Recovery TIME Objective) — driven by how ready the standby is:
   restore from scratch  → RTO hours/days
   hot standby running   → RTO minutes/seconds

 smaller numbers = more $$$. the business picks the numbers,
 engineering picks the (cheapest) pattern that hits them ⭐`}
        />
        <Callout type="tip">
          💡 Always ask &quot;what are the RTO and RPO requirements?&quot; before naming a
          solution. Exam answers and real architectures both hang entirely on those two
          numbers.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="multi-az" number="03" title="Multi-AZ — HA by Default ⭐">
        <P>
          Within one region, AZs are your isolation boundaries — this is the standard HA
          blueprint you have been building all course:
        </P>
        <CodeBlock
          title="multi_az_blueprint.txt"
          runnable={false}
          code={`            🌍 Route 53
                 │
            ⚖️ ALB (spans AZs by design)
        ┌────────┴────────┐
   AZ-a ▼            AZ-b ▼          one AZ fails →
 ┌─────────────┐  ┌─────────────┐    • ALB stops routing there
 │ 🖥️ app ×2   │  │ 🖥️ app ×2   │    • ASG replaces lost
 │ (ASG)       │  │ (ASG)       │      instances in healthy AZ
 ├─────────────┤  ├─────────────┤    • RDS fails over to standby
 │ 🗄️ RDS      │  │ 🗄️ RDS      │      (~1-2 min, same endpoint)
 │ primary ────┼──▶ standby     │    users: maybe a blip 🤷
 └─────────────┘  └─────────────┘

per-service Multi-AZ cheat sheet:
 RDS Multi-AZ    sync standby, auto-failover    you enable it ☑️
 Aurora          storage across 3 AZs ALWAYS    built-in
 S3 / DynamoDB / SQS / Lambda                   multi-AZ natively ✅
 EC2             NOT automatic → ASG across AZs is YOUR job ⚠️
 EBS             single-AZ! → snapshots (cross-AZ via restore)
 EFS             regional, multi-AZ ✅`}
        />
        <Callout type="mistake">
          ⚠️ Capacity math people forget: 2 AZs at 100% load each means losing one AZ leaves
          50% capacity for 100% of traffic → overload cascade. Run N+1: either over-provision
          or spread across 3 AZs at ≤66% each.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="multi-region" number="04" title="Multi-Region — When & Why">
        <CodeBlock
          title="why_multi_region.txt"
          runnable={false}
          code={`reasons to go multi-region (in honesty order):
 1. 🔥 DR — survive a full region outage (rare, but happens)
 2. 🌏 LATENCY — serve Mumbai users from Mumbai, not Virginia
 3. ⚖️ COMPLIANCE — "EU data stays in EU" (data residency)

the hard part is never compute — it's DATA:

 cross-region replication menu:
  🪣 S3 CRR                 async, minutes           RPO ~minutes
  🗄️ Aurora Global Database async, <1s lag ⭐        RPO ~1s,
                            promote secondary <1 min  RTO ~1min
  ⚡ DynamoDB Global Tables  multi-ACTIVE writes!     RPO ~s
                            (last-writer-wins conflicts)
  🗄️ RDS cross-region read replica  async, promote manually
  💾 AWS Backup             scheduled copy to region B

physics rule: SYNC replication across continents = every write
waits for a 60-150ms round trip → cross-region is ASYNC,
so region failover almost always loses a few seconds of data (RPO>0)`}
        />
      </Section>

      {/* 05 */}
      <Section id="dr-patterns" number="05" title="The 4 DR Patterns ⭐">
        <P>
          The famous spectrum — cheaper-but-slower on the left, instant-but-expensive on the
          right:
        </P>
        <CodeBlock
          title="four_patterns.txt"
          runnable={false}
          code={`1️⃣ BACKUP & RESTORE          RTO: hours-days    RPO: hours    $
   region B has: snapshots in S3 + IaC templates. nothing runs.
   disaster → terraform apply + restore backups + repoint DNS

2️⃣ PILOT LIGHT 🕯️            RTO: ~tens of min  RPO: ~seconds $$
   region B has: DATA live (replicated DB, AMIs ready),
   compute OFF. disaster → start instances around the warm core
   (like a gas heater: the pilot flame burns; ignite to full heat)

3️⃣ WARM STANDBY              RTO: minutes       RPO: ~seconds $$$
   region B has: a SCALED-DOWN copy actually RUNNING
   (min-size ASG, small DB replica) — already serving test traffic
   disaster → scale up + flip DNS

4️⃣ ACTIVE-ACTIVE (multi-site) RTO: ~0           RPO: ~0       $$$$
   BOTH regions serve real traffic (Route 53 weighted/latency)
   disaster → healthy region absorbs 100% (capacity headroom!)
   hardest part: multi-region writes (DynamoDB Global Tables /
   Aurora Global + write forwarding / partition users by region)

 cost ──────────────────────────────────────────────▶
 1️⃣ ──────── 2️⃣ ──────── 3️⃣ ──────── 4️⃣
 ◀────────────────────────────────────── recovery speed`}
        />
        <Table
          head={["Pattern", "What runs in region B", "RTO", "Typical fit"]}
          rows={[
            ["Backup & restore", "nothing — just backups + IaC", "hours–days", "internal tools, dev, tight budgets"],
            ["Pilot light", "data only (DB replica), compute off", "10s of minutes", "most production apps ⭐"],
            ["Warm standby", "mini copy running", "minutes", "revenue-critical apps"],
            ["Active-active", "full capacity, serving", "≈ zero", "payments, trading, global SaaS"],
          ]}
        />
        <Callout type="tip">
          💡 Exam keyword mapping: &quot;cheapest DR&quot; → backup & restore. &quot;Data ready,
          minimal cost, faster recovery&quot; → pilot light. &quot;Scaled-down running copy&quot;
          → warm standby. &quot;Zero downtime, both serving&quot; → active-active.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="backups" number="06" title="Backups — The Unsexy Foundation">
        <CodeBlock
          title="aws_backup.txt"
          runnable={false}
          code={`💾 AWS BACKUP — one service to schedule them all
   backup PLAN: "daily, keep 35d; monthly, keep 1yr"
   applies BY TAG (env=prod) across: EBS, RDS, Aurora, DynamoDB,
   EFS, FSx, S3... + copies to ANOTHER REGION/ACCOUNT automatically

the 3-2-1 rule, cloud edition:
   3 copies · 2 locations (regions) · 1 logically separate (account)

🔐 ransomware/insider-proofing:
   • backup VAULT LOCK — WORM: nobody (not even root) can delete
     backups before retention expires
   • cross-ACCOUNT copies — attacker owning prod account
     still can't reach the backup account ⭐`}
        />
        <Callout type="mistake">
          ⚠️ A backup you have never restored is a hope, not a backup. Schedule restore drills:
          actually rebuild the DB from a snapshot quarterly and time it — that time IS your
          real RTO for pattern 1.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="failover" number="07" title="Failover Mechanics — DNS & Data Promotion">
        <CodeBlock
          title="failover_anatomy.txt"
          runnable={false}
          code={`a region failover is really TWO switches:

1️⃣ TRAFFIC SWITCH — Route 53 failover routing
   primary record  → region A endpoint  + HEALTH CHECK 🩺
   secondary       → region B endpoint
   health check fails ~3× → Route 53 starts answering with B
   ⚠️ set low TTL (60s) — high TTL = clients cache A for hours!
   (Global Accelerator can switch faster — no DNS caching)

2️⃣ DATA SWITCH — promote the replica
   Aurora Global: promote secondary cluster (<1 min)
   RDS replica:   promote (takes minutes, breaks replication)
   DynamoDB Global Tables: nothing to do — already multi-active ✅

THE classic trap: traffic moves to region B but the app there
still points at region A's (dead) database 💀
→ failover RUNBOOK must flip both, ideally one automated script

split-brain warning: if region A comes back and BOTH accept
writes → diverging data. fence the old primary before reviving.`}
        />
      </Section>

      {/* 08 */}
      <Section id="testing" number="08" title="Testing DR — GameDays & Chaos">
        <CodeBlock
          title="testing_ladder.txt"
          runnable={false}
          code={`untested DR plan = fiction 📜🔥  climb this ladder:

 level 1  📋 tabletop — walk the runbook in a meeting
          ("wait, who has access to the DR account?" — found it!)
 level 2  💾 restore drill — rebuild DB from backup, TIME it
 level 3  🎯 component failover — kill RDS primary in staging,
          watch Multi-AZ do its thing (terminate ASG instances too)
 level 4  🎮 GAMEDAY — scheduled full region evacuation in
          prod or prod-like, whole team, on the clock ⏱️
          measured RTO vs promised RTO → fix the gaps
 level 5  🐒 continuous chaos — AWS Fault Injection Service (FIS)
          randomly degrades things; surviving is business as usual

 cultural goal: failover so routine it's boring.
 Netflix unplugs regions on purpose; that's why outages
 barely touch them 🍿`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["HA vs DR", "HA = survive small failures in-region · DR = survive region-scale"],
            ["RPO", "data loss tolerance — set by replication frequency"],
            ["RTO", "downtime tolerance — set by standby readiness"],
            ["Multi-AZ first", "ALB + ASG across AZs + RDS Multi-AZ = 99.99% territory"],
            ["EC2/EBS warning", "not multi-AZ by themselves — ASG and snapshots are on you"],
            ["4 DR patterns", "backup-restore → pilot light → warm standby → active-active"],
            ["Pilot light", "data replicated live, compute off — the sweet spot"],
            ["Active-active", "both regions serve · needs Global Tables / Aurora Global"],
            ["Cross-region = async", "physics → RPO > 0 on region failover"],
            ["Aurora Global", "<1s lag, promote in <1 min — the DR darling"],
            ["Failover = 2 switches", "Route 53 (traffic) AND replica promotion (data)"],
            ["Untested DR", "= fiction — restore drills & GameDays make it real"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
