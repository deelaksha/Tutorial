"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Migration Cutover — Live",
  nodes: [
    { id: "server", icon: "🏢", label: "On-Prem Server", sub: "web app · VMware", x: 8, y: 26, color: "#22d3ee" },
    { id: "db", icon: "🗄️", label: "On-Prem DB", sub: "Oracle 19c", x: 8, y: 76, color: "#a78bfa" },
    { id: "mgn", icon: "🚚", label: "MGN", sub: "block replication", x: 36, y: 26, color: "#fb923c" },
    { id: "dms", icon: "🔄", label: "DMS", sub: "full load + CDC", x: 36, y: 76, color: "#f472b6" },
    { id: "ec2", icon: "🖥️", label: "EC2", sub: "replicated server", x: 64, y: 26, color: "#34d399" },
    { id: "rds", icon: "🐘", label: "RDS", sub: "target database", x: 64, y: 76, color: "#34d399" },
    { id: "dns", icon: "🌐", label: "DNS Cutover", sub: "Route 53", x: 90, y: 50, color: "#fbbf24" },
  ],
  edges: [
    { id: "server-mgn", from: "server", to: "mgn", color: "#fb923c" },
    { id: "mgn-ec2", from: "mgn", to: "ec2", color: "#34d399" },
    { id: "db-dms", from: "db", to: "dms", color: "#f472b6" },
    { id: "dms-rds", from: "dms", to: "rds", color: "#34d399" },
    { id: "ec2-dns", from: "ec2", to: "dns", dashed: true, color: "#fbbf24" },
    { id: "rds-dns", from: "rds", to: "dns", dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "server",
      name: "🚚 Server (rehost)",
      command: "MGN: install agent → replicate → cutover",
      steps: [
        { node: "server", paths: ["server-mgn"], text: "The MGN agent installs on the on-prem server and starts CONTINUOUS block-level replication — the server keeps running." },
        { node: "mgn", paths: ["mgn-ec2"], text: "Every disk write is mirrored to a staging area in AWS. You launch TEST instances anytime without touching production." },
        { node: "ec2", paths: ["mgn-ec2"], text: "Cutover night: final sync (minutes, not hours), launch the real EC2 instance — an exact copy, byte for byte. 🚚" },
      ],
    },
    {
      id: "database",
      name: "🔄 Database (CDC)",
      command: "DMS task: full-load-and-cdc Oracle → RDS",
      steps: [
        { node: "db", paths: ["db-dms"], text: "DMS does a FULL LOAD of the Oracle database while it stays live — users keep writing the whole time." },
        { node: "dms", paths: ["dms-rds"], text: "Then CDC (Change Data Capture) replays every new transaction to RDS in near-real-time. Lag: seconds." },
        { node: "rds", paths: ["dms-rds"], text: "Source and target stay in sync for days while you test. (Different engine? Schema Conversion Tool first.) 🔄" },
      ],
    },
    {
      id: "cutover",
      name: "🌐 The cutover",
      command: "route53: app.acme.com → AWS (TTL 60)",
      steps: [
        { node: "dns", paths: ["ec2-dns", "rds-dns"], text: "Both targets are in sync and tested. Friday 11pm: flip the Route 53 record to point at AWS." },
        { node: "ec2", paths: ["ec2-dns"], text: "Users land on EC2 + RDS. The old data center is still running untouched — that's your instant rollback plan." },
        { node: "dns", paths: [], text: "One quiet week later, decommission on-prem. Total user-facing downtime: about 5 minutes of DNS TTL. 🌐" },
      ],
    },
  ],
};

const NAV = [
  { id: "seven-rs", label: "The 7 Rs — Migration Strategies ⭐" },
  { id: "phases", label: "Assess → Mobilize → Migrate" },
  { id: "mgn", label: "MGN — Lift-and-Shift Servers ⭐" },
  { id: "dms", label: "DMS — Migrating Databases ⭐" },
  { id: "datasync", label: "DataSync — Moving Files" },
  { id: "snow-transfer", label: "Snowball & Transfer Family" },
  { id: "picking-tool", label: "Which Tool? The Flowchart ⭐" },
  { id: "real-migration", label: "A Real Migration, Drawn" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsMigrationPage() {
  return (
    <TopicShell
      icon="🚚"
      title="Migration & Transfer"
      gradientWord="Migration"
      subtitle="How companies move 500 servers, 40 databases and 200TB of files into AWS without a weekend of downtime. The 7 Rs decide the strategy per app; MGN, DMS, DataSync and Snowball do the heavy lifting."
      nav={NAV}
      badges={["7️⃣ The 7 Rs", "🔀 Tool flowcharts", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "💰", label: "Cost Optimization", href: "/aws/cost-optimization" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="seven-rs" number="01" title="The 7 Rs — One Strategy Per App ⭐">
        <P>
          A migration is not one decision — it is one decision <em>per application</em>. The
          industry framework is the <strong>7 Rs</strong>:
        </P>
        <CodeBlock
          title="seven_rs.txt"
          runnable={false}
          code={`effort ▼                                                   value ▼
1. RETIRE      💀 "nobody uses this since 2019" → turn it OFF
               (typical estate: 10-20% of servers!)        saves $$
2. RETAIN      🏠 keep on-prem (latency, license, compliance,
               or 'just not yet')                          zero
3. REHOST ⭐   📦 "lift & shift" — VM → EC2 as-is (tool: MGN)
               fast, low risk, no code changes             cloud, not
                                                           cloud-NATIVE
4. RELOCATE    🚛 special rehost: VMware on-prem →
               VMware Cloud on AWS (hypervisor-level move)
5. REPLATFORM  🔧 "lift & RESHAPE" — small upgrades on the way:
               self-managed MySQL → RDS, app → containers
               big wins, modest effort ⭐ sweet spot
6. REPURCHASE  💳 drop it, buy SaaS instead
               (self-hosted CRM → Salesforce)
7. REFACTOR    🏗️ rebuild cloud-native (microservices,
               serverless) — max value, max cost/time —
               reserve for apps that ARE the business`}
        />
        <Callout type="analogy">
          📦 Moving house: retire = throw it out, retain = leave at mom&apos;s, rehost = move
          the wardrobe as-is, replatform = buy the IKEA version on the way, repurchase =
          subscribe instead of own, refactor = build custom furniture for the new home. Nobody
          builds custom furniture for every room.
        </Callout>
        <Callout type="tip">
          💡 Real migrations are mostly rehost + replatform to hit the deadline, then refactor
          the few apps where cloud-native pays. &quot;Rehost first, optimize later&quot; is a
          legitimate, exam-blessed strategy.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="phases" number="02" title="Assess → Mobilize → Migrate (the 3 Phases)">
        <CodeBlock
          title="migration_phases.txt"
          runnable={false}
          code={`1️⃣ ASSESS — "what do we even have?"
   🔎 Application Discovery Service: agents/agentless scan of
      on-prem servers → inventory, dependencies, utilization
   🗺️ Migration Hub: ONE dashboard tracking every app's status
      across all tools
   💵 Migration Evaluator: business case — "your 500 VMs ≈
      $X/month on AWS" (right-sized, not 1:1!)

2️⃣ MOBILIZE — "prepare the landing zone"
   🏗️ Control Tower: multi-account setup, guardrails, SSO,
      networking baseline — BUILD THE FOUNDATION FIRST
   🧪 pilot: migrate 1-2 friendly apps, learn, write the runbook

3️⃣ MIGRATE & MODERNIZE — "wave by wave"
   group apps into WAVES by dependency
   (an app and its database move in the SAME wave!)
   wave 1: low-risk internal tools → wave N: the crown jewels`}
        />
        <Callout type="mistake">
          ⚠️ The classic failure: migrating an app but not the database it chats with 2,000
          times per request. On-prem ↔ AWS latency (even 5ms each way) turns a 200ms page into
          a 20-second page. Dependency mapping decides the waves.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="mgn" number="03" title="MGN — Lift-and-Shift for Servers ⭐">
        <P>
          <strong>MGN (Application Migration Service)</strong> is the rehost tool: it clones
          running on-prem servers into AWS with near-zero downtime.
        </P>
        <CodeBlock
          title="mgn_flow.txt"
          runnable={false}
          code={`ON-PREM                                AWS
┌─ server (LIVE, serving users) ─┐
│  🕵️ replication agent installed │
│  copies disk blocks, then       │     staging area (cheap
│  streams every CHANGE,          │ ──▶ instances + EBS holding
│  CONTINUOUSLY                   │     an up-to-date replica)
└─────────────────────────────────┘
            users never notice              │
                                            ▼
                              1. LAUNCH TEST instance from replica
                                 ✅ test freely — source untouched
                              2. CUTOVER window (minutes):
                                 stop app → final sync →
                                 launch prod instance → flip DNS
                              3. rollback = point DNS back 🛟

downtime = the cutover minutes, not the days of copying`}
        />
        <Callout type="behind">
          🔧 Continuous block-level replication is the trick: the long copy happens while the
          source keeps serving traffic, so the final sync at cutover is only the last few
          minutes of changes.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="dms" number="04" title="DMS — Migrating Databases ⭐">
        <P>
          <strong>DMS (Database Migration Service)</strong> does for databases what MGN does
          for servers — including the magic <strong>CDC</strong> trick that removes downtime:
        </P>
        <CodeBlock
          title="dms_cdc.txt"
          runnable={false}
          code={`source DB (LIVE) ──▶ 🚚 DMS replication instance ──▶ target DB
                        │
   phase 1: FULL LOAD   │  copy all existing rows (hours/days,
                        │  source stays online)
   phase 2: CDC ⭐      │  Change Data Capture — reads the DB's
                        │  transaction log, streams every new
                        │  INSERT/UPDATE/DELETE as it happens
                        ▼
   target stays in sync, lag ~seconds...
   cutover: pause writes → lag hits 0 → point app at target ✅
   downtime: minutes. rollback: source still intact.`}
        />
        <CodeBlock
          title="homogeneous_vs_heterogeneous.txt"
          runnable={false}
          code={`HOMOGENEOUS  (same engine)        HETEROGENEOUS (different engine)
MySQL → RDS MySQL                 Oracle → Aurora PostgreSQL
 └─ DMS alone ✅ easy              └─ TWO tools:
                                     1. 🪄 SCT (Schema Conversion Tool)
                                        converts schema, types, procs —
                                        and REPORTS what needs a human
                                        ("83% auto-converted")
                                     2. 🚚 DMS moves the data
                                   why bother? escaping Oracle/SQL Server
                                   license fees 💸 (huge motivator)`}
        />
        <Callout type="tip">
          💡 DMS CDC is also used <em>outside</em> migrations: keep a read-replica in another
          region, or stream DB changes into S3/Kinesis to feed the data lake. &quot;CDC&quot;
          is a term worth owning.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="datasync" number="05" title="DataSync — Moving Files Over the Wire">
        <P>
          <strong>DataSync</strong> moves file/object data — NFS, SMB, HDFS, other clouds —
          into S3/EFS/FSx, fast and verified:
        </P>
        <CodeBlock
          title="datasync.txt"
          runnable={false}
          code={`on-prem NAS ──▶ 🛰️ DataSync agent (VM you run) ──▶ ☁️ S3 / EFS / FSx
                    │
                    ├─ parallel multi-threaded transfer (saturates links
                    │  where rsync crawls)
                    ├─ ✅ integrity verification built in
                    ├─ preserves permissions/metadata
                    ├─ incremental: re-run = only changed files
                    └─ schedule it: nightly sync until cutover day

vs rolling your own rsync+cron: faster, verified, monitored
(CloudWatch), and retried — for $0.0125/GB`}
        />
      </Section>

      {/* 06 */}
      <Section id="snow-transfer" number="06" title="Snowball & Transfer Family">
        <P>
          When the dataset is huge or the internet is thin, physics wins — so AWS ships you a
          box:
        </P>
        <CodeBlock
          title="snowball_math.txt"
          runnable={false}
          code={`the bandwidth reality check:
  500 TB over a 1 Gbps line (best case) ≈ 46+ DAYS of saturation 😱

📦 SNOWBALL EDGE — ruggedized ~80-210TB device, shipped to you
   1. AWS ships the box  2. plug into LAN, copy data (encrypted,
   tamper-proof)  3. ship back  4. AWS loads into S3
   total: ~1-2 weeks REGARDLESS of your internet
   (also runs EC2/Lambda at the edge — ships, mines, field sites)

🚛 (RIP Snowmobile — the literal truck — retired 2024)

rule of thumb: transfer would take > a week online? → Snow`}
        />
        <CodeBlock
          title="transfer_family.txt"
          runnable={false}
          code={`📤 TRANSFER FAMILY — not migration: ONGOING B2B file exchange
   partners speak SFTP/FTPS/AS2 (banks, insurers, logistics...)
   old way: an SFTP server VM you patch forever
   new way: managed SFTP endpoint ──▶ lands directly in S3
            └─ then S3 events → Lambda → process the file 🔁`}
        />
      </Section>

      {/* 07 */}
      <Section id="picking-tool" number="07" title="Which Tool? — The Flowchart ⭐">
        <CodeBlock
          title="tool_decision_flow.txt"
          runnable={false}
          code={`"I need to move ___ to AWS"
 │
 ├─ 🖥️ whole SERVERS (VMs, OS and all)
 │    └─▶ MGN (continuous replication → test → cutover)
 │
 ├─ 🗄️ a DATABASE
 │    ├─ same engine       → DMS
 │    └─ different engine  → SCT (schema) + DMS (data)
 │
 ├─ 📁 FILES / objects
 │    ├─ fits over the network (< ~10s of TB, decent link)
 │    │    └─▶ DataSync (scheduled, verified, incremental)
 │    └─ too big / link too thin (weeks of transfer)
 │         └─▶ Snowball Edge 📦
 │
 ├─ 🔁 ongoing partner SFTP feeds (not a one-time move)
 │    └─▶ Transfer Family → S3
 │
 └─ 🗺️ tracking 100s of these across teams?
      └─▶ Migration Hub (the single dashboard)`}
        />
        <Table
          head={["Tool", "Moves", "Downtime trick"]}
          rows={[
            ["MGN", "entire servers → EC2", "continuous block replication, minutes-long cutover"],
            ["DMS (+SCT)", "databases (any → any)", "full load + CDC keeps target in sync"],
            ["DataSync", "files → S3/EFS/FSx", "incremental re-syncs until cutover"],
            ["Snowball Edge", "10s of TB–PB, offline", "physics: trucks beat thin pipes"],
            ["Transfer Family", "ongoing SFTP/FTPS/AS2", "n/a — it's a managed endpoint"],
          ]}
        />
      </Section>

      {/* 08 */}
      <Section id="real-migration" number="08" title="A Real Migration, Drawn">
        <CodeBlock
          title="acme_corp_migration.txt"
          runnable={false}
          code={`ACME Corp: 240 servers, 30 DBs, 120TB NAS, 9-month deadline

ASSESS    🔎 Discovery agents 2 weeks → Migration Hub inventory
          findings: 41 servers idle → RETIRE 💀 (-17% instantly)
          ERP → RETAIN (vendor constraint) · CRM → REPURCHASE (SaaS)

MOBILIZE  🏗️ Control Tower landing zone (accounts, SSO, VPCs,
          guardrails) · Direct Connect ordered (lead time!)
          pilot wave: internal wiki + 1 small app → runbook v1

MIGRATE   waves, app + its DB together:
  wave 1  low-risk web apps      → MGN rehost
  wave 2  file shares 120TB      → 📦 Snowball ×2 (bulk)
                                   + DataSync (delta until cutover)
  wave 3  MySQL fleet            → DMS replatform to RDS ⭐
  wave 4  Oracle ERP-adjacent DB → SCT + DMS → Aurora Postgres
                                   (license savings funds the project 💰)
  wave 5  the crown jewel app    → REFACTOR to ECS+SQS (the one
                                   that earns cloud-native)

each wave: replicate → TEST in AWS → cutover window → monitor
           → decommission on-prem (the savings are only real
              when the old hardware turns OFF 🔌)`}
        />
        <Callout type="tip">
          💡 The closing trap: companies migrate, keep the data center &quot;just in case&quot;,
          and pay double for a year. A migration is finished when the old servers are powered
          off — put decommission dates in the plan.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["7 Rs", "retire, retain, rehost, relocate, replatform, repurchase, refactor"],
            ["Rehost", "lift & shift as-is — fast, low risk (tool: MGN)"],
            ["Replatform", "lift & reshape: MySQL→RDS on the way — sweet spot"],
            ["Refactor", "rebuild cloud-native — only for apps that earn it"],
            ["3 phases", "assess (discover) → mobilize (landing zone) → migrate (waves)"],
            ["Wave rule", "an app and its chatty database move TOGETHER"],
            ["MGN", "continuous block replication → test instance → minutes cutover"],
            ["DMS CDC", "full load + change capture = near-zero downtime DB move"],
            ["SCT", "converts schema between engines (Oracle → Aurora PG)"],
            ["DataSync", "fast verified file transfer to S3/EFS/FSx, incremental"],
            ["Snowball", "shipped 80-210TB box — when transfer beats bandwidth"],
            ["Done means", "old servers POWERED OFF — else paying twice"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
