"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "S3 Object Journey — Live",
  nodes: [
    { id: "app", icon: "📱", label: "Your App", sub: "PUT / GET", x: 8, y: 50, color: "#22d3ee" },
    { id: "bucket", icon: "🪣", label: "S3 Bucket", sub: "my-app-uploads", x: 34, y: 50, color: "#fb923c" },
    { id: "std", icon: "⚡", label: "Standard", sub: "hot · ms access", x: 66, y: 14, color: "#34d399" },
    { id: "ia", icon: "💤", label: "Standard-IA", sub: "warm · cheaper", x: 74, y: 50, color: "#fbbf24" },
    { id: "glacier", icon: "🧊", label: "Glacier", sub: "cold · pennies", x: 66, y: 86, color: "#60a5fa" },
  ],
  edges: [
    { id: "app-bucket", from: "app", to: "bucket", color: "#22d3ee" },
    { id: "bucket-std", from: "bucket", to: "std", color: "#34d399" },
    { id: "std-ia", from: "std", to: "ia", dashed: true, color: "#fbbf24" },
    { id: "ia-glacier", from: "ia", to: "glacier", dashed: true, color: "#60a5fa" },
    { id: "bucket-glacier", from: "bucket", to: "glacier", bend: 20, dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "upload",
      name: "⬆️ Upload",
      command: "aws s3 cp video.mp4 s3://my-app-uploads/",
      steps: [
        { node: "app", paths: ["app-bucket"], text: "Your app PUTs an object. The key \"video.mp4\" + the bytes + metadata travel over HTTPS to the bucket." },
        { node: "bucket", paths: ["bucket-std"], text: "S3 lands it in the Standard class and synchronously copies it across 3+ Availability Zones before confirming." },
        { node: "std", paths: [], text: "Stored with 99.999999999% (11 nines) durability. Lose-a-file odds: one object per 10,000 years per 10 million objects. ⚡" },
      ],
    },
    {
      id: "lifecycle",
      name: "♻️ Lifecycle",
      command: "lifecycle rule: 30d → IA, 90d → Glacier",
      steps: [
        { node: "std", paths: ["std-ia"], text: "Day 30: nobody has downloaded the file recently. The lifecycle rule transitions it to Standard-IA — ~45% cheaper, same instant access." },
        { node: "ia", paths: ["ia-glacier"], text: "Day 90: still untouched. It moves to Glacier — ~80% cheaper than Standard. Retrieval now takes minutes-to-hours." },
        { node: "glacier", paths: [], text: "The object sleeps for years costing ~$1/TB-month. You changed storage classes, never your code. ♻️" },
      ],
    },
    {
      id: "restore",
      name: "🧊 Restore",
      command: "aws s3api restore-object --key video.mp4 --days 7",
      steps: [
        { node: "app", paths: ["app-bucket"], text: "Legal asks for that old video. A normal GET fails — Glacier objects must be restored first." },
        { node: "glacier", paths: ["bucket-glacier"], text: "You request a restore. Glacier thaws a temporary copy (Standard retrieval: 3-5 hours; Expedited: minutes, costs more)." },
        { node: "bucket", paths: ["app-bucket"], text: "The temp copy is readable for 7 days, then evaporates — the original stays safely frozen in Glacier. 🧊" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-s3", label: "What Is S3?" },
  { id: "buckets-objects", label: "Buckets & Objects ⭐" },
  { id: "versioning", label: "Versioning" },
  { id: "storage-classes", label: "Storage Classes ⭐" },
  { id: "lifecycle", label: "Lifecycle Rules" },
  { id: "website-replication", label: "Static Sites & Replication" },
  { id: "security", label: "Bucket Security" },
  { id: "block-vs-file", label: "EBS vs EFS vs S3 ⭐" },
  { id: "other-storage", label: "FSx · Storage GW · Snow" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsStoragePage() {
  return (
    <TopicShell
      icon="🪣"
      title="Storage — S3 & Family"
      gradientWord="S3"
      subtitle="S3 stores trillions of objects with 11 nines of durability. Buckets, objects, versioning, lifecycle rules and storage classes drawn as one temperature scale — then the whole storage family: EBS vs EFS vs FSx vs Snow, decided with a flowchart."
      nav={NAV}
      badges={["🪣 Objects drawn", "🌡️ Classes as temperature", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🗄️", label: "Databases — RDS to DynamoDB", href: "/aws/databases" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-s3" number="01" title="What Is S3, Precisely?">
        <P>
          <strong>S3 (Simple Storage Service)</strong> is <em>object storage</em>: an infinite
          bucket you throw files into and retrieve over HTTP. No disks to size, no filesystems to
          mount — every file gets a URL.
        </P>
        <CodeBlock
          title="s3_big_picture.txt"
          runnable={false}
          code={`upload anything, address it by URL:

  📄 report.pdf ──▶ PUT ──▶ ┌────────────────────────┐
  🖼️ cat.jpg    ──▶ PUT ──▶ │  🪣 bucket: my-files    │
  🎬 video.mp4  ──▶ PUT ──▶ │  (bottomless, pay per   │
                            │   GB actually stored)   │
                            └───────────┬────────────┘
                                        ▼ GET
        https://my-files.s3.amazonaws.com/cat.jpg

 durability: 99.999999999%  (11 nines!)
 → store 10,000,000 objects, expect to lose ONE every 10,000 years
 → objects auto-copied across ≥3 AZs behind the scenes`}
        />
        <Table
          head={["S3 is for", "S3 is NOT for"]}
          rows={[
            ["backups & archives", "an OS boot disk (that's EBS)"],
            ["images / video / static websites", "a shared POSIX filesystem (that's EFS)"],
            ["data lakes for analytics", "a database with queries (that's RDS/DynamoDB)"],
            ["log storage", "frequently-edited-in-place files (objects are replaced whole)"],
          ]}
        />
        <Callout type="analogy">
          🅿️ EBS is your <strong>own garage</strong> (one car, attached to one house). S3 is{" "}
          <strong>infinite valet parking</strong>: hand over anything, get a claim ticket (the
          key), retrieve it from anywhere. You never think about how big the parking lot is.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="buckets-objects" number="02" title="Buckets & Objects — The Two Nouns ⭐">
        <CodeBlock
          title="bucket_and_object.txt"
          runnable={false}
          code={`🪣 BUCKET                              📄 OBJECT
 ───────────────────────────           ─────────────────────────────
 the container                         the file + its metadata
 name: GLOBALLY unique                 key:   its full "path" name
 (across every AWS account             value: the bytes (max 5 TB)
  on earth!)                           metadata, tags, version-id
 lives in ONE region
 holds unlimited objects

 s3://acme-assets/img/products/shoe.png
       └───┬────┘ └─────────┬─────────┘
         bucket          object KEY (one string!)

 ⚠️ "img/products/" is NOT a real folder — S3 is FLAT.
    the console just draws "/" in keys as folders for your sanity.`}
        />
        <CodeBlock
          title="s3_cli_basics.sh"
          runnable={false}
          code={`$ aws s3 mb s3://acme-assets-2026            # make bucket (name must be unique!)
$ aws s3 cp shoe.png s3://acme-assets-2026/img/shoe.png
$ aws s3 ls s3://acme-assets-2026/img/
$ aws s3 sync ./website s3://acme-assets-2026  # upload a whole folder
$ aws s3 rm s3://acme-assets-2026/img/shoe.png`}
          output={`make_bucket: acme-assets-2026
upload: ./shoe.png to s3://acme-assets-2026/img/shoe.png
2026-06-12 10:31:55     48213 shoe.png`}
        />
        <Callout type="mistake">
          Bucket names are global: <IC>test</IC> and <IC>my-bucket</IC> were taken in 2006.
          Convention: <IC>company-project-env</IC>, e.g. <IC>acme-assets-prod</IC>. Names also
          appear in URLs — lowercase, no underscores.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="versioning" number="03" title="Versioning — The Undo Button">
        <P>
          With versioning ON, S3 keeps <strong>every version of every object</strong>. Overwrites
          stack up; deletes just add a marker:
        </P>
        <CodeBlock
          title="versioning.txt"
          runnable={false}
          code={`bucket with versioning ENABLED:

 PUT report.pdf (v1) ──▶  report.pdf  [v1]
 PUT report.pdf (v2) ──▶  report.pdf  [v2]  ← current
                                      [v1]  ← still there!
 DELETE report.pdf   ──▶  report.pdf  [🪦 delete marker] ← "current"
                                      [v2]  ← still there!
                                      [v1]  ← still there!

 "undelete" = remove the delete marker 🪄
 "rollback" = restore/copy v1 as the new current version

 ⚠️ every stored version bills as a full object
    → pair versioning with lifecycle rules to expire old versions`}
        />
        <Table
          head={["Fact", "Detail"]}
          rows={[
            ["States", "unversioned (default) → enabled → suspended (never fully off)"],
            ["Protects against", "accidental overwrite AND accidental delete"],
            ["Delete with versioning", "adds a delete marker; data remains"],
            ["Cost", "all versions bill — manage with lifecycle rules"],
          ]}
        />
        <Callout type="tip">
          Exam favorite: &quot;protect S3 data from accidental deletion&quot; →{" "}
          <strong>versioning + MFA Delete</strong> (MFA required to permanently delete versions).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="storage-classes" number="04" title="Storage Classes — A Temperature Scale ⭐">
        <P>
          Same bucket, same API — different price per GB based on how often you touch the data.
          Think <strong>hot → cold</strong>:
        </P>
        <CodeBlock
          title="storage_classes.txt"
          runnable={false}
          code={`HOT 🔥 ──────────────────────────────────────────────▶ COLD 🧊
 access constantly                        access ~never (archives)

 STANDARD          INT.TIERING      STANDARD-IA      GLACIER       GLACIER
 $0.023/GB         auto-moves       $0.0125/GB       FLEX.RETR.    DEEP ARCHIVE
 ms access         objects          ms access        $0.0036/GB    $0.00099/GB
 no minimums       between tiers    retrieval fee    mins-hours    ~12 hours
                   for you 🪄       30-day min       90-day min    180-day min
 default choice    unknown access   backups          old logs      compliance
                   patterns ⭐       DR copies        archives      7-year tax docs

 + ONE ZONE-IA: like Standard-IA but ONE AZ only (20% cheaper,
   dies if that AZ dies → only for re-creatable data)`}
        />
        <Table
          head={["Class", "$/GB/mo", "Retrieval", "Min storage", "Use"]}
          rows={[
            ["Standard", "$0.023", "instant, free", "none", "active data"],
            ["Intelligent-Tiering", "≈auto", "instant", "none", "unknown patterns"],
            ["Standard-IA", "$0.0125", "instant + fee", "30 days", "backups"],
            ["One Zone-IA", "$0.01", "instant + fee", "30 days", "re-creatable copies"],
            ["Glacier Instant", "$0.004", "instant + fee", "90 days", "archives, rare ms access"],
            ["Glacier Flexible", "$0.0036", "minutes–hours", "90 days", "true archives"],
            ["Glacier Deep Archive", "$0.00099", "~12 hours", "180 days", "compliance vaults"],
          ]}
        />
        <Callout type="mistake">
          Cold classes look cheap until you retrieve: IA and Glacier charge{" "}
          <strong>per-GB retrieval fees</strong> and early-deletion penalties. Storing hot data
          in Glacier can cost MORE than Standard. Match class to access pattern — or let
          Intelligent-Tiering decide.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="lifecycle" number="05" title="Lifecycle Rules — Automate the Temperature Drop">
        <P>
          A <strong>lifecycle rule</strong> moves objects down the temperature scale (and
          eventually deletes them) on a schedule — set once, never think about it again:
        </P>
        <CodeBlock
          title="lifecycle_rule.txt"
          runnable={false}
          code={`rule on prefix "logs/":

 day 0          day 30            day 90            day 365
 ┌─────────┐    ┌────────────┐    ┌──────────┐      ┌─────────┐
 │ STANDARD│──▶│ STANDARD-IA │──▶│ GLACIER  │ ──▶  │ DELETED │
 │  (hot)  │    │   (cool)   │    │  (cold)  │      │  🗑️     │
 └─────────┘    └────────────┘    └──────────┘      └─────────┘
   $0.023/GB      $0.0125/GB        $0.0036/GB        $0

 also great for:
 • expire old VERSIONS from versioned buckets (cost bomb defused)
 • abort incomplete multipart uploads after 7 days (hidden cost!)`}
        />
        <Callout type="analogy">
          📦 Your closet: this season&apos;s clothes hang in front (Standard), last season&apos;s
          go to the top shelf (IA), wedding outfit into the attic (Glacier), and after years of
          no wear — donate (expire). Lifecycle rules are the rule &quot;move anything unworn for
          30 days to the shelf&quot;, executed automatically.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="website-replication" number="06" title="Static Website Hosting & Cross-Region Replication">
        <CodeBlock
          title="static_website.txt"
          runnable={false}
          code={`S3 can BE your web server (static sites: HTML/CSS/JS, no backend):

 1️⃣ create bucket            acme.com
 2️⃣ upload site              index.html, style.css, app.js
 3️⃣ enable static website hosting   (+ index & error document)
 4️⃣ allow public read        (bucket policy)
        │
        ▼
 http://acme.com.s3-website-us-east-1.amazonaws.com  🎉

 production version (HTTPS + custom domain + speed):
 👩 users → CloudFront (CDN, TLS) → S3 bucket (kept private!)
            └ Route 53: acme.com → CloudFront`}
        />
        <CodeBlock
          title="replication.txt"
          runnable={false}
          code={`REPLICATION — auto-copy new objects to another bucket:

 ┌──────────────────┐    async, automatic   ┌──────────────────┐
 │ 🪣 us-east-1      │ ────────────────────▶ │ 🪣 eu-west-1      │
 │ (source)         │    new objects only   │ (replica)        │
 └──────────────────┘                       └──────────────────┘
 CRR = Cross-Region  (DR, latency for EU users, compliance)
 SRR = Same-Region   (separate prod/log accounts, test copies)
 requires: versioning ON both sides · existing objects need Batch Replication`}
        />
        <Callout type="note">
          Replication is one-way and asynchronous (seconds-to-minutes lag). It complements — not
          replaces — versioning: replication copies <em>mistakes too</em>, including delete
          markers if you let it.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="security" number="07" title="Bucket Security — The Leak Prevention Kit">
        <P>
          &quot;Company exposes 100M records in public S3 bucket&quot; — the recurring headline.
          The layers that prevent it:
        </P>
        <CodeBlock
          title="s3_security_layers.txt"
          runnable={false}
          code={`request to read s3://acme-secrets/data.csv
        │
        ▼
 1️⃣ BLOCK PUBLIC ACCESS  (account/bucket master switch — ON by default)
        │  "even if a policy says public, NO" 🛑
        ▼
 2️⃣ BUCKET POLICY        resource-based JSON (like IAM but on the bucket)
        │  "who may touch THIS bucket"
        ▼
 3️⃣ IAM POLICY           identity-based: "what may THIS user touch"
        │
        ▼
 4️⃣ ENCRYPTION           at rest: SSE-S3 (default) or SSE-KMS
        │                 in transit: HTTPS
        ▼
 ✅ access granted (explicit deny anywhere above = blocked)`}
        />
        <Table
          head={["Tool", "What it does"]}
          rows={[
            ["Block Public Access", "master kill-switch for any public exposure — leave ON"],
            ["Bucket policy", "JSON on the bucket: cross-account access, enforce HTTPS, IP limits"],
            ["Presigned URL", "temporary signed link to ONE object (e.g. download for 10 min)"],
            ["SSE-S3 / SSE-KMS", "server-side encryption; KMS adds key control + audit"],
            ["Access logs / CloudTrail", "who touched what, when"],
          ]}
        />
        <Callout type="tip">
          &quot;How do you let users download a private file briefly?&quot; →{" "}
          <strong>presigned URL</strong>. Your backend signs a URL valid for N minutes; no
          credentials, no public bucket.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="block-vs-file" number="08" title="EBS vs EFS vs S3 — The Three Shapes of Storage ⭐">
        <CodeBlock
          title="three_storage_shapes.txt"
          runnable={false}
          code={`BLOCK (EBS)            FILE (EFS)               OBJECT (S3)
 ──────────────         ─────────────────         ────────────────
 raw disk blocks        shared filesystem         files via HTTP API
                        (NFS)
 ┌─────┐                ┌─────┐ ┌─────┐ ┌─────┐    🌍 any client,
 │ EC2 │                │ EC2 │ │ EC2 │ │ EC2 │    anywhere
 └──┬──┘                └──┬──┘ └──┬──┘ └──┬──┘         │
    │ 1-to-1               └──────┼───────┘            ▼
 ┌──▼──┐                       ┌──▼──┐            ┌─────────┐
 │ EBS │ one AZ                │ EFS │ multi-AZ   │   S3    │ region-wide
 └─────┘                       └─────┘ grows auto └─────────┘
 boot disks, DBs        shared content, home      backups, media,
                        dirs, CMS uploads         data lakes, sites`}
        />
        <Table
          head={["", "EBS", "EFS", "S3"]}
          rows={[
            ["Type", "block device", "NFS file system", "object store"],
            ["Attach", "ONE instance*, same AZ", "MANY instances, multi-AZ", "no attach — HTTP API"],
            ["Size", "you provision (GB)", "elastic, automatic", "bottomless"],
            ["Latency", "lowest", "low", "higher (per request)"],
            ["Boot volume?", "✅", "❌", "❌"],
            ["Pay for", "provisioned size", "used size", "used size + requests"],
          ]}
        />
        <Callout type="tip">
          Keyword-matching: &quot;shared storage for multiple EC2&quot; → <strong>EFS</strong>.
          &quot;database disk / boot volume&quot; → <strong>EBS</strong>. &quot;backups, static
          assets, data lake&quot; → <strong>S3</strong>. (*io2 Multi-Attach exists but is the
          exotic exception.)
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="other-storage" number="09" title="FSx, Storage Gateway & the Snow Family">
        <Table
          head={["Service", "One-liner", "Trigger words"]}
          rows={[
            ["FSx for Windows", "managed Windows file server (SMB)", "Active Directory, Windows shares"],
            ["FSx for Lustre", "blazing parallel FS for HPC/ML", "100s GB/s, training data"],
            ["FSx for NetApp / OpenZFS", "managed enterprise filers", "migrating NetApp/ZFS workloads"],
            ["Storage Gateway", "hybrid bridge: on-prem apps ↔ S3", "extend datacenter storage to cloud"],
            ["Snowcone / Snowball", "shippable storage devices (TBs–PBs)", "slow links, bulk migration"],
          ]}
        />
        <CodeBlock
          title="snow_family_math.txt"
          runnable={false}
          code={`why mail a box of disks in 2026? bandwidth math:

 100 TB over a 100 Mbps line  ≈ 100+ DAYS of saturated uplink 🐌
 100 TB via Snowball Edge     ≈ ship 📦 → copy locally → ship back
                                 ~1 week door to door ✅

 "never underestimate the bandwidth of a truck full of hard drives"
 rule of thumb: > a week of transfer time? → Snow device`}
        />
        <Callout type="note">
          Storage Gateway modes: <strong>File</strong> (NFS/SMB → S3), <strong>Volume</strong>{" "}
          (iSCSI blocks backed by S3), <strong>Tape</strong> (virtual tape library for backup
          software). All three keep hot data cached locally.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["S3", "object storage over HTTP — 11 nines durability, ≥3 AZs"],
            ["Bucket", "globally-unique name, lives in one region"],
            ["Object", "key + value (≤5TB) — S3 is FLAT, folders are fake"],
            ["Versioning", "keeps every version; delete = marker (undo-able)"],
            ["Classes (hot→cold)", "Standard → IA → Glacier → Deep Archive"],
            ["Intelligent-Tiering", "unknown access pattern? let S3 move it"],
            ["Lifecycle rule", "auto-transition + expire on a schedule"],
            ["Static hosting", "S3 + CloudFront + Route 53 = serverless website"],
            ["CRR", "auto-copy to another region (versioning required)"],
            ["Leak prevention", "Block Public Access ON · presigned URLs for sharing"],
            ["EBS vs EFS vs S3", "one instance/AZ · shared NFS · HTTP objects"],
            ["Snowball", "ship data when the network would take weeks"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
