"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "RDS + Cache in Action — Live",
  nodes: [
    { id: "app", icon: "📱", label: "Your App", sub: "SQL + cache client", x: 8, y: 50, color: "#22d3ee" },
    { id: "cache", icon: "⚡", label: "ElastiCache", sub: "Redis · µs reads", x: 36, y: 14, color: "#f472b6" },
    { id: "primary", icon: "🐘", label: "RDS Primary", sub: "AZ-a · writes", x: 42, y: 62, color: "#fb923c" },
    { id: "standby", icon: "🛟", label: "Standby", sub: "AZ-b · sync copy", x: 74, y: 86, color: "#fbbf24" },
    { id: "replica", icon: "📖", label: "Read Replica", sub: "async · reads", x: 78, y: 30, color: "#34d399" },
  ],
  edges: [
    { id: "app-cache", from: "app", to: "cache", bend: -15, color: "#f472b6" },
    { id: "app-primary", from: "app", to: "primary", bend: 15, color: "#22d3ee" },
    { id: "primary-standby", from: "primary", to: "standby", color: "#fbbf24" },
    { id: "primary-replica", from: "primary", to: "replica", dashed: true, color: "#34d399" },
    { id: "app-replica", from: "app", to: "replica", bend: -45, dashed: true, color: "#34d399" },
  ],
  flows: [
    {
      id: "write",
      name: "✍️ Write (Multi-AZ)",
      command: "INSERT INTO orders VALUES (…);",
      steps: [
        { node: "app", paths: ["app-primary"], text: "Your app INSERTs a new order. Writes always go to the Primary — there is exactly one writer." },
        { node: "primary", paths: ["primary-standby"], text: "Before confirming, the Primary SYNCHRONOUSLY replicates the row to the Standby in another AZ. Zero data loss guarantee." },
        { node: "standby", paths: ["primary-replica"], text: "Commit acknowledged. The Read Replica also catches up asynchronously (a few ms behind). ✍️" },
      ],
    },
    {
      id: "read",
      name: "⚡ Cached read",
      command: "GET product:42 → cache miss → SELECT …",
      steps: [
        { node: "app", paths: ["app-cache"], text: "App asks Redis first: GET product:42. Miss! First reader pays the price." },
        { node: "replica", paths: ["app-replica"], text: "App falls back to SQL — but sends the SELECT to the Read Replica, keeping load off the Primary." },
        { node: "cache", paths: ["app-cache"], text: "App stores the result in Redis with a 60s TTL. The next 10,000 reads are microsecond cache hits. ⚡" },
      ],
    },
    {
      id: "failover",
      name: "🔥 AZ failover",
      command: "AZ-a fails — Primary unreachable!",
      steps: [
        { node: "primary", paths: ["app-primary"], text: "💥 AZ-a goes down. Writes start failing. RDS health checks detect the dead Primary in seconds." },
        { node: "standby", paths: ["primary-standby"], text: "RDS PROMOTES the Standby to be the new Primary. It already has every committed row (sync replication)." },
        { node: "app", paths: ["app-primary"], text: "The DNS endpoint myapp.xxx.rds.amazonaws.com now points at the new Primary. App reconnects — total blip: ~60-120s, zero code changes. 🛟" },
      ],
    },
  ],
};

const NAV = [
  { id: "picking", label: "Which Database? The Flowchart ⭐" },
  { id: "rds", label: "RDS — Managed Relational ⭐" },
  { id: "multi-az-replicas", label: "Multi-AZ vs Read Replicas ⭐" },
  { id: "aurora", label: "Aurora — RDS, Rebuilt" },
  { id: "dynamodb", label: "DynamoDB — NoSQL ⭐" },
  { id: "dynamo-design", label: "DynamoDB Keys & Capacity" },
  { id: "elasticache", label: "ElastiCache — In-Memory Speed" },
  { id: "specialty", label: "Redshift · Neptune · DocumentDB ..." },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsDatabasesPage() {
  return (
    <TopicShell
      icon="🗄️"
      title="Databases"
      gradientWord="Databases"
      subtitle="AWS has 15+ databases because no single one fits every shape of data. Learn the decision flowchart first, then the big four in depth — RDS, Aurora, DynamoDB, ElastiCache — with Multi-AZ vs read replicas finally drawn clearly."
      nav={NAV}
      badges={["🔀 Decision flowcharts", "🗄️ Replication drawn", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🕸️", label: "VPC — Your Private Network", href: "/aws/networking" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="picking" number="01" title="Which Database? — The Flowchart ⭐">
        <CodeBlock
          title="db_decision_flow.txt"
          runnable={false}
          code={`"my data is..."
 │
 ├─ 🧾 relational (tables, JOINs, transactions, SQL)
 │    ├─ standard engine (MySQL/Postgres/...)  → RDS
 │    └─ need more speed/scale, cloud-native   → Aurora
 │
 ├─ 🔑 key-value, massive scale, ms latency    → DynamoDB
 ├─ ⚡ cache / sessions / leaderboards (µs)    → ElastiCache
 ├─ 📊 analytics across billions of rows       → Redshift
 ├─ 🕸️ highly-connected graph (friends-of...)  → Neptune
 ├─ 📄 MongoDB-style documents                 → DocumentDB
 ├─ ⏱️ time-series (IoT metrics)               → Timestream
 └─ 🔗 immutable, cryptographically verifiable → QLDB

 default instincts:
   classic app + SQL  → RDS/Aurora
   serverless + scale → DynamoDB
   make it faster     → put ElastiCache in front`}
        />
        <Callout type="analogy">
          🧰 &quot;Purpose-built databases&quot; = a toolbox. SQL was the hammer everyone used for
          everything; AWS hands you a screwdriver (DynamoDB), a wrench (Redshift), pliers
          (Neptune). Pick by the shape of the data and the question you ask it.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="rds" number="02" title="RDS — Relational Databases, Managed ⭐">
        <P>
          <strong>RDS (Relational Database Service)</strong> runs a normal database engine —
          MySQL, PostgreSQL, MariaDB, Oracle, SQL Server — but AWS handles the painful parts:
        </P>
        <CodeBlock
          title="rds_vs_diy.txt"
          runnable={false}
          code={`DB on your own EC2:                RDS:

 you: install postgres              you: click "Create database"
 you: configure replication         AWS: provisioning, OS patching,
 you: cron the backups                   automated backups (1-35 days
 you: patch OS + engine                  retention, point-in-time
 you: handle failover at 3am 😱         restore), failover, metrics
 you: tune storage                  you: schema, queries, indexes
                                         — the actual DB work

 connect EXACTLY like always:
 psql -h mydb.xyz123.us-east-1.rds.amazonaws.com -U app_user
       └────────────── the "endpoint" ─────────────┘
 ⚠️ no SSH into an RDS box — it's managed; you get a SQL port, not a shell`}
        />
        <Table
          head={["You still do", "RDS does"]}
          rows={[
            ["schema design, indexes, queries", "hardware, OS, engine installation"],
            ["choosing instance size & storage", "patching (in your maintenance window)"],
            ["security groups, IAM, encryption flags", "automated backups + PITR"],
            ["deciding Multi-AZ / replicas", "executing the failover"],
          ]}
        />
        <Callout type="note">
          RDS lives <strong>inside your VPC</strong> in (ideally private) subnets — your app
          reaches it through a security group rule, the internet never does. This becomes
          concrete in the VPC topic.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="multi-az-replicas" number="03" title="Multi-AZ vs Read Replicas — Don't Mix Them Up ⭐">
        <P>
          The most-confused pair in AWS interviews. Both make copies — for{" "}
          <strong>opposite reasons</strong>:
        </P>
        <CodeBlock
          title="multi_az_vs_replicas.txt"
          runnable={false}
          code={`MULTI-AZ  (for SURVIVAL)              READ REPLICAS  (for SPEED)

      app                                      app
       │ one endpoint                 writes │      │ reads
       ▼                                     ▼      ▼
 ┌──────────┐  SYNC copy   ┌─────────┐  ┌─────────┐  ┌─────────┐
 │ PRIMARY  │═════════════▶│ STANDBY │  │ PRIMARY │─▶│ replica1│
 │ (AZ-a)   │  every write │ (AZ-b)  │  │         │─▶│ replica2│ ASYNC
 └──────────┘  waits for   └─────────┘  └─────────┘─▶│ replica3│ copies
       │       both ✅          ▲        reads scale  └─────────┘
   AZ-a dies!                  │        out across replicas 🚀
       └── auto-failover ~1-2min┘        (can be cross-region!)

 standby is INVISIBLE — no reads!       replicas are READABLE
 zero data loss (sync)                  slight lag (async)
 purpose: high availability            purpose: read scaling`}
        />
        <Table
          head={["", "Multi-AZ", "Read replica"]}
          rows={[
            ["Replication", "synchronous", "asynchronous (lag)"],
            ["Copy serves reads?", "❌ standby is idle", "✅ that's the point"],
            ["On primary failure", "auto-failover, same endpoint", "manual promotion"],
            ["Cross-region?", "no (AZs in one region)", "✅ yes"],
            ["Solves", "availability", "read-heavy load"],
          ]}
        />
        <Callout type="tip">
          They combine: production = <strong>Multi-AZ primary + N read replicas</strong>.
          Keyword-matching: &quot;survive AZ failure&quot; → Multi-AZ. &quot;read-heavy
          reporting&quot; → read replica. &quot;reduce read latency in another region&quot; →
          cross-region replica.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="aurora" number="04" title="Aurora — RDS, Rebuilt for the Cloud">
        <P>
          <strong>Aurora</strong> is Amazon&apos;s own engine, wire-compatible with MySQL and
          PostgreSQL (drivers just work) — but with the storage layer redesigned:
        </P>
        <CodeBlock
          title="aurora_architecture.txt"
          runnable={false}
          code={`classic RDS: each instance has its own disk (copies move data around)

 AURORA: compute and storage SPLIT —

   ┌─ writer ─┐   ┌─ reader ─┐  ┌─ reader ─┐ ... up to 15 readers
   └────┬─────┘   └────┬─────┘  └────┬─────┘     (replicas in seconds:
        └──────────────┼─────────────┘            no data copy needed!)
                       ▼
 ┌─────────────────────────────────────────────────┐
 │  SHARED STORAGE VOLUME — 6 copies across 3 AZs  │
 │  AZ-a: ▣ ▣    AZ-b: ▣ ▣    AZ-c: ▣ ▣           │
 │  auto-grows to 128TB · self-healing             │
 └─────────────────────────────────────────────────┘

 failover: a reader promotes in ~30s (storage is already shared)
 AURORA SERVERLESS: capacity scales up/down automatically —
   pay per ACU-second, perfect for spiky/dev workloads`}
        />
        <Table
          head={["", "RDS MySQL", "Aurora MySQL"]}
          rows={[
            ["Throughput", "baseline", "claimed up to ~5x"],
            ["Max read replicas", "5 (async, minutes to create)", "15 (shared storage, seconds)"],
            ["Storage", "you provision, max 64TB", "auto-grows to 128TB"],
            ["Failover", "~1–2 min", "~30 s"],
            ["Price", "cheaper per instance", "~20% premium (worth it at scale)"],
          ]}
        />
        <Callout type="tip">
          Exam shortcut: &quot;MySQL/Postgres-compatible + highest availability/performance&quot;
          → Aurora. &quot;unpredictable workload, scales to zero&quot; → Aurora Serverless.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="dynamodb" number="05" title="DynamoDB — Serverless NoSQL ⭐">
        <P>
          <strong>DynamoDB</strong> is a fully-serverless key-value store: no instances, no
          connections to pool, no patching — just a table that answers in single-digit
          milliseconds whether it holds 1 row or 10 billion.
        </P>
        <CodeBlock
          title="dynamodb_model.txt"
          runnable={false}
          code={`TABLE: users                      (no schema except the KEY!)
 ┌─────────────┬──────────────────────────────────────────┐
 │ user_id (PK)│ ...anything else, per item               │
 ├─────────────┼──────────────────────────────────────────┤
 │ "u#101"     │ {name:"Asha",  plan:"pro", logins: 42}   │
 │ "u#102"     │ {name:"Ravi",  city:"Pune"}              │ ← different
 │ "u#103"     │ {name:"Mei",   tags:["a","b"], age: 31}  │   fields! ok!
 └─────────────┴──────────────────────────────────────────┘

 you query BY KEY (instant):     GetItem(user_id="u#102")  → 5ms ✅
 you do NOT do JOINs / ad-hoc:   "users in Pune with >10 logins"
                                  → full Scan 🐌💸 (design keys for
                                    your access patterns instead)

 vs SQL mindset:
 SQL:      flexible queries, rigid schema
 DynamoDB: rigid queries (by key), flexible schema`}
        />
        <Table
          head={["Trait", "Detail"]}
          rows={[
            ["Serverless", "no instances; scales automatically; pay per request or capacity"],
            ["Performance", "consistent ms at ANY size — the superpower"],
            ["Availability", "data on SSDs across 3 AZs, built-in"],
            ["Item limit", "400 KB per item (big blobs → S3, store the key)"],
            ["Extras", "TTL auto-expiry, Streams (change feed), Global Tables (multi-region active-active), DAX (µs cache)"],
          ]}
        />
        <Callout type="mistake">
          Treating DynamoDB like SQL — normalizing into many tables and &quot;joining&quot; in
          code, or Scanning for queries — produces slow, expensive apps. Rule:{" "}
          <strong>know your access patterns first</strong>, design keys around them.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="dynamo-design" number="06" title="DynamoDB Keys & Capacity — Just Enough Design">
        <CodeBlock
          title="keys_and_capacity.txt"
          runnable={false}
          code={`PRIMARY KEY = partition key (+ optional sort key)

 table: orders        PK = customer_id, SK = order_date
 ┌──────────────┬─────────────┬─────────────────┐
 │ customer_id  │ order_date  │ ...attributes   │
 ├──────────────┼─────────────┼─────────────────┤
 │ "c#7"        │ 2026-01-03  │ {...}           │ ┐ same partition,
 │ "c#7"        │ 2026-02-14  │ {...}           │ ├ sorted by SK →
 │ "c#7"        │ 2026-05-30  │ {...}           │ ┘ range queries!
 │ "c#9"        │ 2026-01-11  │ {...}           │
 └──────────────┴─────────────┴─────────────────┘
 Query: "all c#7 orders in 2026"  → fast ✅ (one partition, SK range)
 need another pattern? add a GSI (secondary index = alternate key)

 CAPACITY MODES:
 on-demand    → pay per request, zero planning      ← start here
 provisioned  → reserve RCU/WCU, cheaper at steady high volume`}
        />
        <Callout type="behind">
          The partition key is <em>hashed</em> to pick which physical partition stores the item —
          that&apos;s why lookups stay O(1)-ish forever, and why a &quot;hot&quot; key (everyone
          writing to <IC>pk=&quot;global&quot;</IC>) throttles: one partition takes all the heat.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="elasticache" number="07" title="ElastiCache — Microsecond Reads in Front of Your DB">
        <P>
          <strong>ElastiCache</strong> is managed Redis (or Memcached): an in-memory store you put{" "}
          <em>in front of</em> a database so repeated reads never hit the disk:
        </P>
        <CodeBlock
          title="cache_aside.txt"
          runnable={false}
          code={`the cache-aside pattern (the one to know):

 app needs product #42
   │
   ├─▶ 1. GET product:42 from ElastiCache
   │       ├─ HIT  → return in ~0.5ms ✅  (most requests!)
   │       └─ MISS ▼
   ├─▶ 2. SELECT ... FROM products WHERE id=42   (RDS, ~10ms)
   └─▶ 3. SET product:42 in cache with TTL 300s → next time: HIT

 result: DB handles 5% of reads instead of 100% — smaller instance,
 happier users. classic uses: sessions, hot queries, leaderboards
 (Redis sorted sets), rate limiting, pub/sub.`}
        />
        <Table
          head={["", "Redis (default choice)", "Memcached"]}
          rows={[
            ["Data types", "strings, lists, sorted sets, streams...", "strings only"],
            ["Persistence / replication", "✅ snapshots, replicas, failover", "❌ pure cache"],
            ["Use when", "almost always", "dead-simple cache, multithreaded"],
          ]}
        />
        <Callout type="mistake">
          A cache is a <strong>copy, not a source of truth</strong> — design for stale data (TTLs,
          invalidation) and for the cache being empty (cold start after restart). If losing the
          data would hurt, it belongs in a database.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="specialty" number="08" title="The Specialists — Redshift, Neptune, DocumentDB, Timestream">
        <CodeBlock
          title="oltp_vs_olap.txt"
          runnable={false}
          code={`the key split — OLTP vs OLAP:

 OLTP (transactions)                 OLAP (analytics)
 "insert THIS order"                 "sum revenue by region, 3 years"
 many tiny reads/writes              few HUGE scans
 row-oriented storage                column-oriented storage
 RDS / Aurora / DynamoDB             REDSHIFT 📊
        │                                  ▲
        └────── nightly ETL / streams ─────┘
        (don't run reports on your prod OLTP db!)`}
        />
        <Table
          head={["Service", "Data shape", "Killer query", "Trigger words"]}
          rows={[
            ["Redshift", "columnar warehouse (PBs)", "aggregate billions of rows in seconds", "BI, dashboards, data warehouse"],
            ["Neptune", "graph (nodes + edges)", "friends-of-friends in ms", "social, fraud rings, recommendations"],
            ["DocumentDB", "JSON documents", "MongoDB-compatible queries", "existing Mongo app, managed"],
            ["Timestream", "time-series", "avg sensor value per minute, last 24h", "IoT, metrics"],
            ["QLDB", "append-only ledger", "cryptographically-verifiable history", "audit trail, registrations"],
            ["Keyspaces", "wide-column", "Cassandra-compatible", "existing Cassandra app"],
          ]}
        />
        <Callout type="tip">
          You don&apos;t need depth on these for most roles — recognize the{" "}
          <strong>data shape → service</strong> mapping. The Analytics topic returns to Redshift
          properly.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["RDS", "managed MySQL/Postgres/...: AWS patches, backs up, fails over"],
            ["No SSH to RDS", "you get an endpoint + port, not a shell"],
            ["Multi-AZ", "SYNC standby, invisible, auto-failover — availability"],
            ["Read replica", "ASYNC, readable, cross-region ok — read scaling"],
            ["Aurora", "MySQL/PG-compatible, 6-way storage across 3 AZs, 15 readers"],
            ["Aurora Serverless", "auto-scaling capacity for spiky workloads"],
            ["DynamoDB", "serverless key-value, ms at any scale, query by key"],
            ["DynamoDB design", "access patterns first; PK(+SK); GSI for extra patterns"],
            ["ElastiCache", "Redis in front of the DB — cache-aside + TTL"],
            ["OLTP vs OLAP", "app transactions (RDS) vs analytics scans (Redshift)"],
            ["Graph / docs / time", "Neptune · DocumentDB · Timestream"],
            ["Default picks", "SQL→RDS/Aurora · scale+serverless→DynamoDB · speed→cache"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
