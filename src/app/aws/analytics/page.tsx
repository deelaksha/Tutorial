"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Data Pipeline — Live",
  nodes: [
    { id: "apps", icon: "📱", label: "Apps & Logs", sub: "clickstream events", x: 7, y: 50, color: "#22d3ee" },
    { id: "kinesis", icon: "🌊", label: "Kinesis", sub: "Firehose stream", x: 27, y: 50, color: "#a78bfa" },
    { id: "lake", icon: "🪣", label: "S3 Data Lake", sub: "raw → curated", x: 47, y: 50, color: "#fb923c" },
    { id: "glue", icon: "🧪", label: "Glue", sub: "catalog + ETL", x: 47, y: 12, color: "#f472b6" },
    { id: "athena", icon: "🔎", label: "Athena", sub: "SQL on S3", x: 72, y: 26, color: "#34d399" },
    { id: "qs", icon: "📈", label: "QuickSight", sub: "dashboards", x: 91, y: 56, color: "#fbbf24" },
  ],
  edges: [
    { id: "apps-kinesis", from: "apps", to: "kinesis", color: "#22d3ee" },
    { id: "kinesis-lake", from: "kinesis", to: "lake", color: "#a78bfa" },
    { id: "glue-lake", from: "glue", to: "lake", dashed: true, color: "#f472b6" },
    { id: "lake-athena", from: "lake", to: "athena", color: "#34d399" },
    { id: "athena-qs", from: "athena", to: "qs", color: "#fbbf24" },
    { id: "glue-athena", from: "glue", to: "athena", dashed: true, bend: -15, color: "#f472b6" },
  ],
  flows: [
    {
      id: "ingest",
      name: "🌊 Ingest",
      command: "firehose.put_record({clicked: 'buy-btn'})",
      steps: [
        { node: "apps", paths: ["apps-kinesis"], text: "Every click, page view, and log line streams into Kinesis Firehose — millions of events per hour." },
        { node: "kinesis", paths: ["kinesis-lake"], text: "Firehose buffers (60s or 5MB), optionally converts JSON → Parquet, and delivers batches to S3 automatically." },
        { node: "lake", paths: [], text: "Data lands in the RAW zone: s3://lake/raw/year=2025/month=06/. Cheap, durable, infinite. 🌊" },
      ],
    },
    {
      id: "prep",
      name: "🧪 Catalog + ETL",
      command: "glue crawler → table; glue job → parquet",
      steps: [
        { node: "glue", paths: ["glue-lake"], text: "A Glue Crawler scans the files, infers the schema, and writes a TABLE definition into the Data Catalog." },
        { node: "lake", paths: ["glue-lake"], text: "A Glue ETL job cleans the raw JSON — dedupe, fix types, convert to compressed Parquet — and writes to the CURATED zone." },
        { node: "glue", paths: ["glue-athena"], text: "Now every query engine (Athena, Redshift Spectrum, EMR) sees the same tables through one catalog. 🧪" },
      ],
    },
    {
      id: "query",
      name: "🔎 Query + visualize",
      command: "SELECT page, COUNT(*) FROM clicks GROUP BY page",
      steps: [
        { node: "athena", paths: ["lake-athena"], text: "An analyst writes plain SQL. Athena scans the Parquet files in S3 directly — NO database servers exist." },
        { node: "athena", paths: ["glue-athena"], text: "Partition pruning + columnar format: instead of scanning 2TB it reads 4GB. Cost: $5 per TB actually scanned." },
        { node: "qs", paths: ["athena-qs"], text: "QuickSight turns the result into a live dashboard the CEO refreshes every morning. 🔎📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "big-picture", label: "The Data Pipeline Map ⭐" },
  { id: "data-lake", label: "Data Lake on S3 ⭐" },
  { id: "kinesis", label: "Kinesis — Streaming Ingest ⭐" },
  { id: "glue", label: "Glue — Catalog & ETL ⭐" },
  { id: "athena", label: "Athena — SQL on S3 ⭐" },
  { id: "redshift", label: "Redshift — The Warehouse" },
  { id: "emr", label: "EMR — Big Data Clusters" },
  { id: "lakeformation-quicksight", label: "Lake Formation & QuickSight" },
  { id: "full-pipeline", label: "A Real Pipeline, End to End" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsAnalyticsPage() {
  return (
    <TopicShell
      icon="📊"
      title="Data Engineering & Analytics"
      gradientWord="Analytics"
      subtitle="How companies turn raw events into dashboards: Kinesis streams data in, S3 holds the lake, Glue catalogs and transforms it, Athena queries it with plain SQL, Redshift powers the heavy dashboards. One pipeline diagram organizes all six services."
      nav={NAV}
      badges={["🛠️ Pipeline drawn", "🗂️ Lake vs warehouse", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🤖", label: "Machine Learning & AI Services", href: "/aws/machine-learning" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="big-picture" number="01" title="The Data Pipeline Map ⭐">
        <P>
          Every analytics stack on AWS — at every company — is some version of this five-stage
          pipeline. Learn the stages; the services are just employees assigned to them:
        </P>
        <CodeBlock
          title="pipeline_map.txt"
          runnable={false}
          code={`INGEST          STORE           CATALOG &        QUERY &          VISUALIZE
"data in"       "data lake"     TRANSFORM        ANALYZE
                                "clean it"       "ask questions"

🌊 Kinesis      🪣 S3           🧪 Glue          🔍 Athena        📈 QuickSight
 (streams)       (the lake:      • Data Catalog   (SQL on S3)
🚚 DMS /         raw → clean     • ETL jobs      🏬 Redshift
 DataSync        → curated       (Spark)          (warehouse)
📨 app events    zones)                          🐘 EMR
                                                  (Spark/Hadoop
                                                   clusters)

  ──────────────────▶ data flows left to right ──────────────────▶
the same raw data in S3 can be queried by Athena, loaded into
Redshift, AND crunched by EMR — store once, analyze many ways ⭐`}
        />
        <Callout type="analogy">
          🏭 Think of a kitchen: Kinesis is the delivery truck, S3 is the pantry, Glue is the
          prep cook (washing and chopping), Athena/Redshift are the chefs cooking answers, and
          QuickSight plates the dish for the executives.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="data-lake" number="02" title="Data Lake on S3 — Store First, Decide Later ⭐">
        <P>
          A <strong>data lake</strong> is just S3 with discipline: dump <em>all</em> raw data
          cheaply, organize it in zones, and keep it in formats engines can scan fast.
        </P>
        <CodeBlock
          title="lake_zones.txt"
          runnable={false}
          code={`s3://company-datalake/
 ├── raw/        🥩 exactly as it arrived — never modified, ever
 │    └── clickstream/year=2025/month=06/day=12/events.json.gz
 ├── clean/      🧼 validated, deduped, converted to Parquet
 │    └── clickstream/year=2025/month=06/...  .parquet
 └── curated/    🍽️ business-ready: joined, aggregated tables
      └── daily_sales_by_region/...

two tricks that make or break query speed + cost:

1️⃣ PARTITIONING (folders = WHERE clauses)
   WHERE year=2025 AND month=06 → engine reads ONLY that folder,
   skipping terabytes 💨

2️⃣ COLUMNAR FORMAT (Parquet, not JSON/CSV)
   SELECT revenue FROM sales → reads ONLY the revenue column
   JSON 1TB → Parquet ~100GB → Athena bill drops ~90% 💰`}
        />
        <Table
          head={["", "Data lake (S3)", "Data warehouse (Redshift)"]}
          rows={[
            ["Data", "everything, raw + processed, any format", "structured, modeled, loaded on purpose"],
            ["Schema", "on READ (decide when querying)", "on WRITE (decide before loading)"],
            ["Cost", "cents/GB", "$$ — compute clusters"],
            ["Users", "data engineers, scientists", "analysts, BI dashboards"],
            ["Motto", "store first, ask later", "fast answers to known questions"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ A lake without partitioning and a catalog becomes a <strong>data swamp</strong> —
          petabytes nobody can find or afford to query. Zones + partitions + Glue Catalog from
          day one.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="kinesis" number="03" title="Kinesis — Streaming Ingest ⭐">
        <P>
          <strong>Kinesis</strong> handles data that never stops arriving — clicks, logs, IoT
          readings, game telemetry. Two members of the family matter most:
        </P>
        <CodeBlock
          title="kinesis_family.txt"
          runnable={false}
          code={`KINESIS DATA STREAMS — the real-time stream
 producers ─▶ |0|1|2|3|4|5|6|7|8|9|...  (records kept 1-365 days)
              sharded for scale          ▲          ▲
              records are NOT deleted    │consumer A│consumer B
              on read — consumers keep   │(fraud,   │(metrics,
              their own position 🔖      │ offset 3)│ offset 8)
 latency: ~ms · replay: ✅ · you manage consumers (Lambda etc.)

DATA FIREHOSE — the delivery pipe (zero admin) ⭐
 producers ─▶ [firehose buffers 1-15 min / 1-128MB]
                  │ optional: transform via Lambda,
                  │ convert JSON → Parquet automatically!
                  ▼
              🪣 S3 / Redshift / OpenSearch / Datadog...
 latency: near-real-time (buffered) · replay: ❌ · NO shards, NO code

decision: "I need apps REACTING to events in ms"  → Data Streams
          "I just need data LANDING in S3/Redshift" → Firehose ⭐
          (common combo: Streams → Firehose → S3)`}
        />
        <Callout type="behind">
          🔧 Records with the same partition key (e.g. <IC>user_id</IC>) land on the same shard
          → ordered per user, like FIFO message groups. Total throughput = shards × 1MB/s in,
          2MB/s out — or use on-demand mode and let AWS scale shards.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="glue" number="04" title="Glue — The Catalog & the ETL ⭐">
        <P>
          <strong>Glue</strong> is two products wearing one name — and the Catalog half is the
          one everything else depends on:
        </P>
        <CodeBlock
          title="glue_two_halves.txt"
          runnable={false}
          code={`1️⃣ GLUE DATA CATALOG — "the card catalog of the lake" ⭐
   a metadata store: for each dataset → schema, format,
   location, partitions
   ┌──────────────────────────────────────────────┐
   │ table: clickstream                           │
   │  location: s3://lake/clean/clickstream/      │
   │  format: parquet                             │
   │  columns: user_id string, url string, ts ... │
   │  partitions: year, month, day                │
   └──────────────────────────────────────────────┘
   filled by 🕷️ CRAWLERS: point one at an S3 prefix, it sniffs
   files, INFERS schema + partitions, writes the table
   → Athena, Redshift Spectrum & EMR all read THIS catalog
     (define once, query everywhere)

2️⃣ GLUE ETL JOBS — "the transformer"
   serverless Spark: raw JSON ──▶ [job] ──▶ clean Parquet
   • visual editor or PySpark code
   • bookmarks = only process NEW files since last run
   • triggered on schedule or by events
   pay per DPU-hour while the job runs, zero clusters to own`}
        />
        <Callout type="analogy">
          📚 S3 is a vast library where books (files) are piled in rooms. The Glue Catalog is
          the index telling every reader exactly which room, shelf, and language. Athena
          without the catalog is wandering a dark library with a flashlight.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="athena" number="05" title="Athena — SQL Directly on S3 ⭐">
        <P>
          <strong>Athena</strong> is magic the first time: no cluster, no loading — write SQL,
          it scans files in S3 and returns results in seconds. Pay{" "}
          <strong>$5 per TB scanned</strong>, nothing when idle.
        </P>
        <CodeBlock
          title="athena_query.sql"
          runnable={false}
          code={`-- table came from the Glue Catalog (crawler made it)
SELECT url, COUNT(*) AS views
FROM   clickstream
WHERE  year = '2025' AND month = '06'   -- ⭐ partition pruning:
GROUP  BY url                            --    only June folders scanned
ORDER  BY views DESC
LIMIT  10;

-- runtime: ~4s over billions of rows. infra managed by you: none.

cost arithmetic (why formats matter):
  1 TB JSON,  no partitions  → scans 1 TB    → $5.00 per query 😱
  same data,  Parquet + partitions + only 2 columns
                             → scans ~3 GB   → $0.015 per query ✅`}
        />
        <Callout type="tip">
          💡 Athena&apos;s sweet spot: ad-hoc exploration, log digging (ALB/VPC flow logs!),
          dashboards over moderate data. When analysts hammer the same heavy joins all day,
          every day, that workload graduates to Redshift.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="redshift" number="06" title="Redshift — The Data Warehouse">
        <P>
          <strong>Redshift</strong> is a columnar, massively-parallel SQL warehouse for the
          questions a business asks constantly — petabyte joins and aggregations with
          consistent speed.
        </P>
        <CodeBlock
          title="redshift_mpp.txt"
          runnable={false}
          code={`           SELECT region, SUM(revenue) FROM sales GROUP BY region
                              │
                    ┌─ leader node ─┐  plans, splits the work
                    └──────┬────────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   compute node 1   compute node 2   compute node 3
   (its slice of    (its slice)      (its slice)
    the data)            │                │
          └──── partial results merged ───┘ → answer

columnar + parallel = aggregations over billions of rows in seconds

flavors & friends:
 • Redshift SERVERLESS  → pay per query-second, no cluster sizing ⭐
 • Redshift SPECTRUM    → joins warehouse tables with raw S3 data
                          (via the Glue Catalog — lake + warehouse united)
 • loading: COPY FROM s3://... (bulk, parallel) or Firehose direct`}
        />
        <Table
          head={["Question", "Athena", "Redshift"]}
          rows={[
            ["Setup", "zero — point at S3", "cluster or serverless workgroup"],
            ["Pricing", "$5/TB scanned", "per node-hour / RPU-seconds"],
            ["Best at", "ad-hoc, occasional, exploratory", "constant BI load, complex joins, many users"],
            ["Data lives", "stays in S3", "loaded in (or S3 via Spectrum)"],
            ["Rule of thumb", "start here", "graduate here when usage is heavy + predictable"],
          ]}
        />
      </Section>

      {/* 07 */}
      <Section id="emr" number="07" title="EMR — Big Data Clusters (Spark & Friends)">
        <P>
          <strong>EMR (Elastic MapReduce)</strong> = managed clusters running the open-source
          big-data stack: <strong>Spark</strong>, Hive, Presto/Trino, Flink, HBase. For when
          SQL is not enough and you need full programmatic power over huge data.
        </P>
        <CodeBlock
          title="emr_when.txt"
          runnable={false}
          code={`reach for EMR when:
 🐍 custom PySpark/Scala — ML feature pipelines, complex multi-step
    transforms too gnarly for SQL or Glue's job model
 🎛️ you need cluster control: specific Spark versions, libraries, tuning
 💰 huge batch jobs — EMR on SPOT instances = crunch 50TB cheaply

classic pattern (transient cluster):
 spin up 50 nodes (spot) → read s3://lake/raw/ → Spark job 2h →
 write s3://lake/curated/ → TERMINATE cluster (pay only those 2h) ✅

modern option: EMR SERVERLESS — submit Spark job, AWS handles capacity

Glue ETL vs EMR: Glue = serverless, simpler, per-job ⭐ start here
                 EMR  = full control, big sustained workloads, cheaper at scale`}
        />
      </Section>

      {/* 08 */}
      <Section id="lakeformation-quicksight" number="08" title="Lake Formation & QuickSight">
        <CodeBlock
          title="lake_formation.txt"
          runnable={false}
          code={`🔐 LAKE FORMATION — permissions for the lake
problem: IAM speaks buckets/objects, but governance speaks
         "analysts may see sales rows for THEIR region,
          and never the email column"
solution: grant DATABASE / TABLE / COLUMN / ROW-level permissions
          in one place; Athena, Redshift Spectrum, Glue & EMR
          all enforce them

 grant analyst_role SELECT on table sales
   columns: (order_id, region, total)   ← email EXCLUDED
   row filter: region = 'EU'            ← row-level security`}
        />
        <CodeBlock
          title="quicksight.txt"
          runnable={false}
          code={`📈 QUICKSIGHT — the BI dashboard layer
 sources: Athena, Redshift, RDS, S3...
 SPICE: in-memory cache → dashboards stay snappy, sources stay calm
 per-user pricing (readers cheap), embeds into your own apps
 + natural-language: "show me sales by region last quarter" → chart 🤖`}
        />
      </Section>

      {/* 09 */}
      <Section id="full-pipeline" number="09" title="A Real Pipeline, End to End">
        <P>The whiteboard answer to &quot;design our analytics platform&quot;:</P>
        <CodeBlock
          title="clickstream_pipeline.txt"
          runnable={false}
          code={`📱 apps / web ──▶ 🌊 Kinesis Data Streams
                      │                └──▶ ⚡ Lambda: real-time alerts
                      ▼                     (fraud, error spikes)
                 🚚 Firehose (buffers, converts JSON→Parquet)
                      ▼
        🪣 s3://lake/raw/  (partitioned year/month/day)
                      │
                      ▼  🧪 Glue ETL nightly: validate, dedupe, enrich
        🪣 s3://lake/clean/  +  🕷️ crawler updates the Catalog
                      │
        ┌─────────────┼──────────────────┐
        ▼             ▼                  ▼
   🔍 Athena     🏬 Redshift         🐘 EMR Spark
   ad-hoc SQL    COPY curated        ML feature jobs
   for engineers tables → BI         (spot cluster)
        │             │
        └────▶ 📈 QuickSight dashboards ◀────┘
                  (execs, 9am coffee ☕)

 🔐 Lake Formation governs who sees which tables/columns/rows
 💰 S3 lifecycle: raw/ → Glacier after 90 days`}
        />
        <Callout type="tip">
          💡 Notice the shape: <strong>stream in → lake → catalog → many query engines → one
          BI layer</strong>. Services may swap (Firehose↔DMS, Athena↔Redshift) but interviewers
          are listening for this shape, not the logos.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Pipeline shape", "ingest → store (lake) → catalog/ETL → query → visualize"],
            ["Data lake", "S3 zones: raw → clean → curated · schema on read"],
            ["Speed/cost tricks", "partition folders + Parquet columnar = ~90% cheaper"],
            ["Kinesis Streams", "real-time, replayable, consumers track position"],
            ["Firehose", "zero-admin delivery to S3/Redshift, buffers + converts"],
            ["Glue Catalog", "metadata of the lake — crawlers infer schemas"],
            ["Glue ETL", "serverless Spark jobs: raw JSON → clean Parquet"],
            ["Athena", "SQL on S3, $5/TB scanned, zero infra — start here"],
            ["Redshift", "MPP columnar warehouse for constant heavy BI"],
            ["Spectrum", "Redshift queries S3 via the Glue Catalog"],
            ["EMR", "managed Spark/Hadoop clusters · transient + spot = cheap"],
            ["Lake Formation", "table/column/row-level permissions for the lake"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
