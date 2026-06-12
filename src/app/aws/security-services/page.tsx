"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Defense In Depth — Live",
  nodes: [
    { id: "attacker", icon: "😈", label: "Attacker", sub: "SQLi attempt", x: 8, y: 18, color: "#f87171" },
    { id: "waf", icon: "🛡️", label: "WAF", sub: "L7 rule engine", x: 32, y: 18, color: "#fb923c" },
    { id: "app", icon: "🖥️", label: "Your App", sub: "behind ALB", x: 56, y: 40, color: "#22d3ee" },
    { id: "kms", icon: "🔑", label: "KMS", sub: "keys never leave", x: 50, y: 84, color: "#fbbf24" },
    { id: "s3", icon: "🪣", label: "S3 (encrypted)", sub: "ciphertext at rest", x: 82, y: 78, color: "#34d399" },
    { id: "gd", icon: "🕵️", label: "GuardDuty", sub: "threat detection", x: 84, y: 18, color: "#a78bfa" },
  ],
  edges: [
    { id: "attacker-waf", from: "attacker", to: "waf", color: "#f87171" },
    { id: "waf-app", from: "waf", to: "app", dashed: true, color: "#22d3ee" },
    { id: "app-kms", from: "app", to: "kms", color: "#fbbf24" },
    { id: "app-s3", from: "app", to: "s3", bend: -20, color: "#34d399" },
    { id: "gd-app", from: "gd", to: "app", dashed: true, color: "#a78bfa" },
  ],
  flows: [
    {
      id: "block",
      name: "🛡️ WAF blocks",
      command: "GET /login?user=admin'-- (SQL injection)",
      steps: [
        { node: "attacker", paths: ["attacker-waf"], text: "An attacker sends a classic SQL-injection payload at your login page." },
        { node: "waf", paths: ["attacker-waf"], text: "WAF inspects the HTTP request BEFORE it reaches your app. The SQLi managed rule matches → 403 Forbidden. Request dies here." },
        { node: "app", paths: ["waf-app"], text: "Only clean traffic flows through to the app. Your code never saw the attack — that's the point of a perimeter. 🛡️" },
      ],
    },
    {
      id: "encrypt",
      name: "🔑 Envelope encrypt",
      command: "kms:GenerateDataKey → AES-256 → s3:PutObject",
      steps: [
        { node: "app", paths: ["app-kms"], text: "App asks KMS for a data key. KMS returns TWO copies: one plaintext (use now), one encrypted under the master key (store)." },
        { node: "kms", paths: ["app-kms"], text: "The master key NEVER leaves KMS hardware. The app encrypts the file locally with the plaintext key, then wipes it from memory." },
        { node: "s3", paths: ["app-s3"], text: "Ciphertext + the encrypted data key are stored together in S3. To decrypt, you must ask KMS again — every call logged in CloudTrail. 🔑" },
      ],
    },
    {
      id: "detect",
      name: "🕵️ GuardDuty detects",
      command: "finding: CryptoCurrency:EC2/BitcoinTool.B!DNS",
      steps: [
        { node: "gd", paths: ["gd-app"], text: "GuardDuty silently analyzes CloudTrail, VPC Flow Logs and DNS queries with ML — no agents installed." },
        { node: "app", paths: ["gd-app"], text: "A compromised instance starts calling a bitcoin-mining domain. GuardDuty raises a HIGH severity finding within minutes." },
        { node: "gd", paths: [], text: "The finding flows to Security Hub / EventBridge → auto-isolate the instance with a quarantine security group. 🕵️" },
      ],
    },
  ],
};

const NAV = [
  { id: "map", label: "The Security Service Map" },
  { id: "kms", label: "KMS — Envelope Encryption ⭐" },
  { id: "secrets", label: "Secrets Manager ⭐" },
  { id: "acm", label: "Certificate Manager" },
  { id: "waf-shield", label: "WAF & Shield — The Edge ⭐" },
  { id: "guardduty-inspector", label: "GuardDuty & Inspector" },
  { id: "hub-macie", label: "Security Hub & Macie" },
  { id: "layers", label: "Defense in Depth, Assembled" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsSecurityServicesPage() {
  return (
    <TopicShell
      icon="🔰"
      title="Security Services"
      gradientWord="Security"
      subtitle="IAM controls WHO; these services control everything else: KMS encrypting data (envelope encryption finally drawn clearly), Secrets Manager rotating passwords, WAF+Shield blocking attacks at the edge, and the detectives — GuardDuty, Inspector, Macie, Security Hub."
      nav={NAV}
      badges={["🔑 Envelope encryption drawn", "🛡️ Attack path blocked", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "λ", label: "Serverless — Lambda & Beyond", href: "/aws/serverless" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="map" number="01" title="The Security Service Map — One Question Each">
        <CodeBlock
          title="security_map.txt"
          runnable={false}
          code={`every AWS security service answers ONE question:

 PROTECT 🛡️
 ├─ KMS              "how do I encrypt data?"          (keys)
 ├─ Secrets Manager  "where do DB passwords live?"     (secrets)
 ├─ ACM              "how do I get TLS certificates?"  (certs)
 ├─ WAF              "how do I block bad requests?"    (layer 7)
 └─ Shield           "what about DDoS floods?"         (layer 3/4)

 DETECT 🕵️
 ├─ GuardDuty        "is something ATTACKING us?"      (threats)
 ├─ Inspector        "are my workloads VULNERABLE?"    (CVEs)
 ├─ Macie            "is sensitive data exposed in S3?"(PII)
 └─ Security Hub     "show me everything in one place" (aggregator)

 remember from earlier topics:
 IAM = who may act · CloudTrail = who DID act · Config = what changed`}
        />
        <Callout type="analogy">
          🏰 A castle: KMS forges the locks, Secrets Manager is the keymaster&apos;s vault, ACM
          issues the royal seals, WAF+Shield man the gates, GuardDuty patrols the walls,
          Inspector checks for cracks, Macie guards the treasury, and Security Hub is the war
          room where all reports land.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="kms" number="02" title="KMS — Envelope Encryption, Finally Clear ⭐">
        <P>
          <strong>KMS (Key Management Service)</strong> holds master keys that{" "}
          <em>never leave the service</em>, and every encryption in AWS builds on one trick —{" "}
          <strong>envelope encryption</strong>:
        </P>
        <CodeBlock
          title="envelope_encryption.txt"
          runnable={false}
          code={`why not encrypt a 5GB file with KMS directly?
 → KMS only encrypts ≤4KB per call. so: encrypt a KEY, not the data.

 ENCRYPT:
 1. ask KMS: "give me a data key" (under master key K)
    KMS returns: 🔑 plaintext data key + 🔒 encrypted copy of it
 2. encrypt the 5GB file LOCALLY with 🔑 (fast, AES-256)
 3. throw 🔑 away! store together:
    ┌──────────────────────────────┐
    │ 🔒 encrypted data key (tiny) │  ← the "envelope"
    │ 🗄️ encrypted file (5GB)      │
    └──────────────────────────────┘
 DECRYPT:
 1. send 🔒 encrypted data key to KMS: "unwrap this"
    (KMS checks IAM + key policy! ← access control lives HERE)
 2. KMS returns 🔑 → decrypt file locally → discard 🔑

 the magic: master key NEVER leaves KMS · data NEVER goes to KMS
 and S3/EBS/RDS "enable encryption ✓" does ALL of this invisibly`}
        />
        <Table
          head={["Key type", "Managed by", "When"]}
          rows={[
            ["AWS managed (aws/s3...)", "AWS, free", "default checkbox encryption"],
            ["Customer managed (CMK)", "you: rotation, key policy, audit", "compliance, cross-account, control"],
            ["Imported / External", "you supply key material", "regulatory edge cases"],
          ]}
        />
        <Callout type="tip">
          Encrypting data also gives <strong>access control + audit</strong>: no{" "}
          <IC>kms:Decrypt</IC> permission = ciphertext is garbage, and every key use lands in
          CloudTrail. &quot;Deleting&quot; data at scale = deleting the key (crypto-shredding).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="secrets" number="03" title="Secrets Manager — No More Passwords in Code ⭐">
        <CodeBlock
          title="secrets_manager.txt"
          runnable={false}
          code={`THE CRIME SCENE                     THE FIX
 config.py:                          app at runtime:
   DB_PASS = "hunter2"  😱             1. IAM role (no creds in code!)
 → committed to git forever            2. GetSecretValue("prod/db")
 → same password for 3 years           3. use it, never store it

 ROTATION — the killer feature:
 every 30 days, automatically:
 ┌────────────┐  1. generate new password
 │  Secrets   │  2. λ rotation function updates the DATABASE
 │  Manager   │  3. store new version
 └────────────┘  apps fetch → always get the current one ✅
 zero humans involved · RDS rotation is built-in

 Secrets Manager vs SSM PARAMETER STORE:
 ┌────────────────┬─────────────────┬────────────────────┐
 │                │ Secrets Manager │ Param Store (basic) │
 │ price          │ $0.40/secret/mo │ free                │
 │ auto-rotation  │ ✅ built-in     │ ❌ DIY              │
 │ use for        │ DB creds, API   │ config values,      │
 │                │ keys that rotate│ non-rotating params │
 └────────────────┴─────────────────┴────────────────────┘`}
        />
        <Callout type="mistake">
          Fetching a secret then writing it to a file or env var &quot;for convenience&quot;
          recreates the original problem. Fetch at startup (or on demand), keep it in memory,
          let rotation work.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="acm" number="04" title="ACM — Free TLS Certificates, Auto-Renewed">
        <CodeBlock
          title="acm_flow.txt"
          runnable={false}
          code={`the old world: buy cert ($$$) → install → FORGET TO RENEW →
              "your connection is not private" on launch day 💀

 ACM:
 1. request certificate for acme.com + *.acme.com   (free!)
 2. prove ownership: ACM gives a CNAME → add to Route 53 (1 click)
 3. status: ISSUED ✅
 4. attach to: ⚖️ ALB / 📡 CloudFront / API Gateway
 5. renewal: AUTOMATIC forever (DNS record stays = re-validates)

 ⚠️ two rules everyone trips on:
 • certs are REGIONAL → cert for an ALB must be in the ALB's region
 • CloudFront only reads certs from us-east-1 (it's global/edge)
 • you can NOT download the private key → can't use on raw EC2
   (that's the point — keys never leave AWS infrastructure)`}
        />
        <Callout type="note">
          ACM&apos;s job ends at AWS-managed endpoints (ALB, CloudFront, API Gateway). TLS on a
          raw EC2 box = bring your own cert (Let&apos;s Encrypt) — or better, terminate at the
          ALB and keep instances private.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="waf-shield" number="05" title="WAF & Shield — Blocking Attacks at the Edge ⭐">
        <CodeBlock
          title="waf_shield.txt"
          runnable={false}
          code={`two different attacks, two different defenders:

 DDoS FLOOD (dumb volume, L3/4)        EXPLOITS (clever requests, L7)
 1M SYN packets/sec 🌊                 GET /products?id=1 OR 1=1 🐍
        │                                     │
        ▼                                     ▼
 ┌──────────────┐                      ┌──────────────┐
 │ 🛡️ SHIELD    │                      │ 🧱 WAF       │
 │ Standard:    │                      │ rules engine │
 │ FREE, always │                      │ on ALB/      │
 │ on, absorbs  │                      │ CloudFront/  │
 │ common DDoS  │                      │ API Gateway  │
 └──────────────┘                      └──────────────┘

 WAF rule examples:
 • managed rule sets: SQLi, XSS, "known bad inputs" (subscribe ✅)
 • rate limit: >2000 req / 5min per IP → block (brute force, scraping)
 • geo match, IP sets, header/body regex
 SHIELD ADVANCED ($3k/mo): bigger DDoS, response team, cost insurance`}
        />
        <Table
          head={["", "Shield", "WAF"]}
          rows={[
            ["Layer", "3/4 (network floods)", "7 (HTTP content)"],
            ["Threat", "DDoS volume", "SQLi, XSS, bots, brute force"],
            ["Cost", "Standard free / Advanced $$$", "per rule + per request"],
            ["Sits on", "automatic, edge-wide", "CloudFront, ALB, API Gateway"],
          ]}
        />
        <Callout type="tip">
          Exam keywords: &quot;SQL injection / cross-site scripting&quot; → <strong>WAF</strong>.
          &quot;DDoS&quot; → <strong>Shield</strong>. &quot;both + experts on call&quot; →
          Shield Advanced.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="guardduty-inspector" number="06" title="GuardDuty & Inspector — Attacked vs Vulnerable">
        <P>
          The most-confused pair. <strong>GuardDuty</strong> finds active threats;{" "}
          <strong>Inspector</strong> finds weaknesses before anyone exploits them:
        </P>
        <CodeBlock
          title="guardduty_vs_inspector.txt"
          runnable={false}
          code={`🕵️ GUARDDUTY — threat DETECTION (is it happening NOW?)
 reads: CloudTrail + VPC Flow Logs + DNS logs (+ EKS, S3 events)
 ML + threat intel finds:
 ⚠️ "EC2 i-0abc is talking to a known crypto-mining pool"
 ⚠️ "API calls from TOR exit node using alice's keys"
 ⚠️ "unusual mass-download from S3 by this role"
 enable once, zero agents, just findings.

 🔍 INSPECTOR — vulnerability SCANNING (could it happen?)
 scans: EC2 (via SSM agent), ECR images, Lambda
 finds known CVEs + network exposure:
 ⚠️ "i-0abc runs openssl 1.0.2 — CVE-2024-XXXX, critical"
 ⚠️ "image api:v3 ships log4j 2.14 💀"
 ⚠️ "port 22 reachable from the internet"

 burglar alarm (GuardDuty)  vs  building inspector (Inspector)`}
        />
        <Callout type="note">
          They feed each other&apos;s story: Inspector says &quot;this CVE exists&quot;;
          GuardDuty says &quot;someone is exploiting it&quot;. Mature accounts run both, piped
          into Security Hub → EventBridge → ticket/page.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="hub-macie" number="07" title="Security Hub & Macie">
        <CodeBlock
          title="hub_and_macie.txt"
          runnable={false}
          code={`SECURITY HUB — the single pane of glass:

 GuardDuty ─┐                      ┌─ score vs standards:
 Inspector ─┤   ┌──────────────┐   │  CIS benchmark      78% 🟡
 Macie ─────┼──▶│ SECURITY HUB │──▶│  AWS best practices 91% 🟢
 Config ────┤   │ (aggregates, │   │  PCI-DSS            64% 🔴
 WAF, IAM...┘   │  normalizes, │   └─ findings sorted by severity
                │  prioritizes)│──▶ EventBridge → auto-remediate/ticket
                └──────────────┘    multi-ACCOUNT rollup for orgs

 MACIE — finds sensitive data in S3:
 scans buckets with ML + patterns →
 ⚠️ "customers.csv: 50,000 credit card numbers — bucket PUBLIC 😱"
 ⚠️ "dump.sql: emails + passwords in plaintext"
 GDPR/PCI's favorite tool: you can't protect PII you don't know about`}
        />
        <Callout type="tip">
          Keyword-matching: &quot;single place to view security posture&quot; →{" "}
          <strong>Security Hub</strong>. &quot;discover PII/sensitive data in S3&quot; →{" "}
          <strong>Macie</strong>.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="layers" number="08" title="Defense in Depth — The Whole Stack Assembled">
        <CodeBlock
          title="defense_in_depth.txt"
          runnable={false}
          code={`one malicious request vs your layers:

 🌍 attacker
  │
  ▼ 🛡️ Shield        absorbs the DDoS flood accompanying the attack
  ▼ 🧱 WAF           blocks the SQLi payload variants
  ▼ 📡 CloudFront/ALB TLS via ACM (no plaintext anywhere)
  ▼ 🕸️ VPC           NACLs + private subnets (app not even addressable)
  ▼ 🔒 SG chain      only LB-SG → APP-SG → DB-SG paths exist
  ▼ 👤 IAM           app role: least privilege, no wildcards
  ▼ 🔑 KMS           data at rest encrypted; secrets in Secrets Manager
  ─────────────────────────────────────────────────────────
 watching the whole time:
 🕵️ GuardDuty (threats) · 🔍 Inspector (CVEs) · 📋 Config (drift)
 🗂️ CloudTrail (every API call) · 📊 Security Hub (the scoreboard)

 no single layer is trusted to be perfect — that's the philosophy.`}
        />
        <Callout type="analogy">
          🧅 Security is an onion: every layer assumes the previous one failed. WAF missed the
          payload? The SG chain blocks lateral movement. Key leaked? KMS policies and CloudTrail
          limit and record the damage. One mistake ≠ game over.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["KMS", "master keys never leave; envelope encryption for big data"],
            ["Envelope trick", "encrypt data with data key; KMS encrypts the data key"],
            ["Crypto access control", "no kms:Decrypt = no data — and it's audited"],
            ["Secrets Manager", "store + AUTO-ROTATE credentials; fetch via IAM role"],
            ["Param Store", "free config storage; no built-in rotation"],
            ["ACM", "free TLS, auto-renews; CloudFront certs → us-east-1"],
            ["WAF", "layer 7 — SQLi/XSS/rate limits on ALB/CloudFront/APIGW"],
            ["Shield", "DDoS — Standard free & always-on; Advanced $$$"],
            ["GuardDuty", "threat detection NOW (logs + ML, no agents)"],
            ["Inspector", "vulnerability scanning (CVEs in EC2/ECR/Lambda)"],
            ["Macie", "find PII in S3 buckets"],
            ["Security Hub", "aggregate everything, score vs standards"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
