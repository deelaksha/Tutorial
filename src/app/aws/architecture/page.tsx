"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "3-Tier Reference Architecture — Live",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "anywhere on Earth", x: 6, y: 50, color: "#22d3ee" },
    { id: "cf", icon: "📍", label: "CloudFront", sub: "edge + WAF", x: 24, y: 50, color: "#a78bfa" },
    { id: "alb", icon: "⚖️", label: "ALB", sub: "public subnets", x: 42, y: 50, color: "#fb923c" },
    { id: "app", icon: "🖥️", label: "App ASG", sub: "private · 2 AZs", x: 60, y: 50, color: "#34d399" },
    { id: "cache", icon: "⚡", label: "ElastiCache", sub: "Redis", x: 78, y: 16, color: "#f472b6" },
    { id: "rds", icon: "🐘", label: "RDS Multi-AZ", sub: "private · data tier", x: 84, y: 76, color: "#fbbf24" },
  ],
  edges: [
    { id: "user-cf", from: "user", to: "cf", color: "#22d3ee" },
    { id: "cf-alb", from: "cf", to: "alb", color: "#a78bfa" },
    { id: "alb-app", from: "alb", to: "app", color: "#fb923c" },
    { id: "app-cache", from: "app", to: "cache", color: "#f472b6" },
    { id: "app-rds", from: "app", to: "rds", color: "#fbbf24" },
  ],
  flows: [
    {
      id: "request",
      name: "🌍 Full request",
      command: "GET /product/42 — end to end",
      steps: [
        { node: "user", paths: ["user-cf"], text: "Request hits the nearest CloudFront edge. WAF filters attacks; static assets return instantly from cache." },
        { node: "alb", paths: ["cf-alb"], text: "Dynamic requests continue to the ALB — the ONLY thing with a public IP. SG chain: ALB accepts 443 from CloudFront only." },
        { node: "app", paths: ["alb-app"], text: "ALB picks a healthy instance from the Auto Scaling Group spread across two AZs in private subnets." },
        { node: "cache", paths: ["app-cache"], text: "App checks Redis first — 90% of reads stop here in under 1ms, shielding the database." },
        { node: "rds", paths: ["app-rds"], text: "Cache misses hit RDS (its SG only accepts 5432 from the app SG). Response flows back out. Total: ~80ms. 🌍" },
      ],
    },
    {
      id: "azfail",
      name: "🔥 AZ goes dark",
      command: "AZ-a: power failure",
      steps: [
        { node: "app", paths: ["alb-app"], text: "💥 AZ-a dies, taking half the app fleet. ALB health checks fail and it routes everything to AZ-b instantly." },
        { node: "rds", paths: ["app-rds"], text: "RDS fails over to its standby in AZ-b (~60-120s). The ASG launches replacement instances in the healthy AZ." },
        { node: "user", paths: ["user-cf", "cf-alb"], text: "Users experienced a brief slowdown — not an outage. Every tier was designed for exactly this moment. 🔥" },
      ],
    },
    {
      id: "spike",
      name: "📈 Traffic ×10",
      command: "marketing campaign goes viral",
      steps: [
        { node: "cf", paths: ["user-cf"], text: "Traffic explodes ×10. CloudFront absorbs the static load at the edge — origins see only dynamic requests." },
        { node: "app", paths: ["alb-app"], text: "CPU climbs → target tracking scales the ASG from 2 to 14 instances over a few minutes." },
        { node: "cache", paths: ["app-cache"], text: "Redis serves the hot product pages, so the database barely notices. Bill scales with traffic — and back down after. 📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "principles", label: "The 7 Design Principles ⭐" },
  { id: "waf", label: "Well-Architected — 6 Pillars ⭐" },
  { id: "pillars-deep", label: "The Pillars, One Line Each" },
  { id: "reference-3tier", label: "Reference: 3-Tier Web App ⭐" },
  { id: "reference-serverless", label: "Reference: Serverless & Events" },
  { id: "scaling-story", label: "1 User → 10 Million Users ⭐" },
  { id: "tradeoffs", label: "Trade-offs — Thinking Like an Architect" },
  { id: "review-checklist", label: "The Architecture Review Checklist" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsArchitecturePage() {
  return (
    <TopicShell
      icon="🏗️"
      title="Architecture Design"
      gradientWord="Architecture"
      subtitle="The capstone: every service you've learned, assembled. Seven design principles, the six Well-Architected pillars, two reference architectures you can draw from memory, and the famous '1 user to 10 million' scaling story."
      nav={NAV}
      badges={["🏛️ 6 pillars", "📐 Reference diagrams", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🎓", label: "Certifications Path", href: "/aws/certifications" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="principles" number="01" title="The 7 Design Principles ⭐">
        <P>
          Before pillars and diagrams, the instincts. Good cloud architects repeat these seven
          ideas in every design:
        </P>
        <CodeBlock
          title="seven_principles.txt"
          runnable={false}
          code={`1️⃣ DESIGN FOR FAILURE         "everything fails, all the time"
   no single point of failure — multi-AZ, health checks, retries
2️⃣ DECOUPLE                   queues/events between components
   one slow service shouldn't drag the rest down (SQS, SNS, EB)
3️⃣ SCALE HORIZONTALLY         many small boxes > one giant box
   requires STATELESS servers (state → DB/cache/S3)
4️⃣ AUTOMATE EVERYTHING        IaC + CI/CD + auto scaling + auto
   recovery — humans design, robots operate
5️⃣ SECURITY IN EVERY LAYER    edge, network, compute, data —
   least privilege + encryption everywhere (defense in depth)
6️⃣ RIGHT TOOL FOR THE JOB     purpose-built services (the DB
   flowchart!) — not everything is EC2 + MySQL
7️⃣ MAKE COST A REQUIREMENT    architecture decisions ARE spending
   decisions — design with the bill in mind

memorize the first three hard: failure, decoupling,
horizontal scale — they generate most right answers ⭐`}
        />
        <Callout type="analogy">
          🚦 A city planner doesn&apos;t design for the day everything works — they design for
          accidents, rush hour, and roadworks: redundant routes, traffic lights that fail
          safe, zones that isolate problems. Cloud architecture is city planning for requests.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="waf" number="02" title="The Well-Architected Framework — 6 Pillars ⭐">
        <P>
          AWS distilled thousands of architecture reviews into the{" "}
          <strong>Well-Architected Framework</strong>: six pillars — six lenses to inspect any
          design through.
        </P>
        <CodeBlock
          title="six_pillars.txt"
          runnable={false}
          code={`        🏛️ THE WELL-ARCHITECTED FRAMEWORK 🏛️
┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ ⚙️ OPER-   │ 🔒 SECURITY│ 🛟 RELIA-  │ ⚡ PERFOR- │ 💰 COST    │ 🌱 SUSTAIN-│
│ ATIONAL    │            │ BILITY     │ MANCE      │ OPTIMIZ-   │ ABILITY    │
│ EXCELLENCE │            │            │ EFFICIENCY │ ATION      │            │
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│ run &      │ protect    │ recover    │ right      │ spend      │ minimize   │
│ improve:   │ data &     │ from       │ resources, │ only what  │ energy &   │
│ IaC, CI/CD,│ systems:   │ failure:   │ measured:  │ the        │ carbon:    │
│ runbooks,  │ IAM, MFA,  │ multi-AZ,  │ right-size,│ business   │ serverless,│
│ post-      │ encryption,│ backups,   │ cache,     │ needs:     │ ARM/       │
│ mortems    │ detection  │ DR, auto-  │ CDN, pick  │ tags, SPs, │ Graviton,  │
│            │ (defense   │ scaling,   │ the right  │ right-size,│ high       │
│            │ in depth)  │ RTO/RPO    │ DB/compute │ lifecycle  │ utilization│
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
 mnemonic: "OSRPCS" → "Only Solid Reviews Produce Cloud Success"

how it's USED: the WA TOOL (free, in console) asks ~50 questions
per workload → flags HIGH RISK ISSUES → you fix the top ones.
not a certification — a recurring health check 🩺`}
        />
        <Callout type="behind">
          🔧 The pillars trade off against each other on purpose: more reliability (multi-region)
          costs more money; tighter security adds operational friction. The framework forces
          you to make those trades <em>consciously</em> instead of by accident.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="pillars-deep" number="03" title="The Pillars, One Question Each">
        <Table
          head={["Pillar", "The question it asks", "Services that usually answer"]}
          rows={[
            ["⚙️ Operational Excellence", "Can you deploy, observe, and improve safely?", "CloudFormation/CDK, CodePipeline, CloudWatch, X-Ray"],
            ["🔒 Security", "Least privilege? Encrypted? Would you detect a breach?", "IAM, KMS, GuardDuty, Security Hub, WAF, CloudTrail"],
            ["🛟 Reliability", "What breaks when an AZ/region/dependency fails?", "Multi-AZ, ASG, Route 53, AWS Backup, SQS"],
            ["⚡ Performance", "Is anything over/under-sized or un-cached?", "right instance types, ElastiCache, CloudFront, DynamoDB"],
            ["💰 Cost", "Does spend match value? Who owns each dollar?", "Cost Explorer, Budgets, Savings Plans, S3 lifecycle"],
            ["🌱 Sustainability", "Could fewer/greener resources do the same work?", "serverless, Graviton, autoscaling, efficient regions"],
          ]}
        />
        <Callout type="tip">
          💡 Notice each pillar maps to a topic of this course: Security pillar = topics 2+9,
          Reliability = topics 7+18, Cost = topic 17, OpEx = topics 8+12. The course WAS the
          framework, taught in order.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="reference-3tier" number="04" title="Reference Architecture: 3-Tier Web App ⭐">
        <P>
          The architecture you must be able to draw on a whiteboard cold — it answers half of
          all design questions:
        </P>
        <CodeBlock
          title="three_tier_reference.txt"
          runnable={false}
          code={`            🌍 Route 53 (DNS, health-checked failover)
                 │
            🌐 CloudFront (cache static, TLS at edge)
                 │              └── 🪣 S3 (assets, /static/*)
            🛡️ WAF
                 │
┌─ VPC 10.0.0.0/16 ───────────────────────────────────────┐
│            ⚖️ ALB (public subnets, 2+ AZs)               │
│   ┌──────────────┴──────────────┐                       │
│ AZ-a ▼                      AZ-b ▼     ◀─ WEB/APP TIER  │
│ ┌─ private subnet ─┐  ┌─ private subnet ─┐              │
│ │ 🖥️🖥️ app (ASG)  │  │ 🖥️🖥️ app (ASG)  │ stateless!   │
│ └────────┬─────────┘  └────────┬─────────┘              │
│          ├──── ⚡ ElastiCache (sessions, hot reads)      │
│ AZ-a ▼                      AZ-b ▼     ◀─ DATA TIER     │
│ ┌─ private subnet ─┐  ┌─ private subnet ─┐              │
│ │ 🗄️ RDS primary ──┼──▶ 🗄️ RDS standby  │ Multi-AZ ✅  │
│ └──────────────────┘  └──────────────────┘              │
│  SG chain: ALB-SG → APP-SG → DB-SG (each only from prev)│
│  gateway endpoint → S3 · NAT GW for outbound updates    │
└──────────────────────────────────────────────────────────┘
 📊 CloudWatch + CloudTrail │ 🔑 KMS everywhere │ 💾 AWS Backup
 🔁 deployed by CodePipeline from CloudFormation/CDK`}
        />
        <Callout type="tip">
          💡 Say the SG chain out loud in interviews: &quot;DB security group only accepts 3306
          from the app SG, app SG only accepts 8080 from the ALB SG — the network enforces the
          tiers.&quot; It signals you&apos;ve actually built this.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="reference-serverless" number="05" title="Reference: Serverless & Event-Driven">
        <CodeBlock
          title="serverless_reference.txt"
          runnable={false}
          code={`SYNC PATH (user waits):
 🌍 user ─▶ CloudFront ─▶ API Gateway ─▶ ⚡ Lambda ─▶ DynamoDB
                │                          (auth: Cognito JWT)
                └─▶ 🪣 S3 (the SPA/static site)

ASYNC PATH (user doesn't wait):
 order placed ─▶ EventBridge "OrderPlaced"
                   ├─▶ [SQS] ─▶ ⚡ charge payment   (+DLQ ☠️)
                   ├─▶ [SQS] ─▶ ⚡ send email       (+DLQ ☠️)
                   └─▶ 🪜 Step Functions: fulfillment workflow
 DynamoDB STREAMS ─▶ ⚡ sync to OpenSearch (search index)

WHEN serverless reference > 3-tier reference:
 ✅ spiky/unpredictable traffic (scale-to-zero economics)
 ✅ small team — no fleet to operate
 ✅ event-shaped domain (things HAPPEN, others react)
 ❌ long-running compute, steady massive load (containers win)`}
        />
      </Section>

      {/* 06 */}
      <Section id="scaling-story" number="06" title="1 User → 10 Million Users — The Scaling Story ⭐">
        <P>
          The classic narrative — how the same app evolves as it grows. Interviewers love
          asking a version of this:
        </P>
        <CodeBlock
          title="scaling_journey.txt"
          runnable={false}
          code={`👤 1-100 USERS — keep it boring
   1× EC2 (or Lightsail/Beanstalk) + RDS. Elastic IP. done.

👥 ~1,000 — separate & survive a failure
   move DB to RDS Multi-AZ · 2× EC2 behind an ALB across AZs

👥👥 ~10,000 — go stateless, start caching
   sessions → ElastiCache · static → S3+CloudFront
   ASG on the app tier · RDS read replicas for read pressure

🏙️ ~100,000 — decouple the heavy work
   SQS between web and workers (thumbnails, emails, reports)
   more caching (CloudFront, ElastiCache, DAX) — cache EVERYTHING
   observability gets real: dashboards, alarms, X-Ray

🌆 ~1,000,000 — split the monolith where it hurts
   hottest paths → services/Lambda · hottest data → DynamoDB
   search → OpenSearch · analytics OFF the prod DB → lake+Athena

🌍 ~10,000,000 — go multi-region
   CloudFront + Global Accelerator · Aurora Global / Global Tables
   active-active or warm standby · cells/shards to cap blast radius

the meta-lesson: you EVOLVE into this. nobody builds
step 6 on day one — that's the over-engineering trap ⚠️
each step = the simplest change that removes the CURRENT bottleneck`}
        />
        <Callout type="analogy">
          🌱 Architectures grow like plants, not buildings: you don&apos;t pour a skyscraper
          foundation for a seedling — you repot when the roots actually hit the walls. Each
          repotting above is triggered by a real, measured bottleneck.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="tradeoffs" number="07" title="Trade-offs — Thinking Like an Architect">
        <P>
          Senior answers are never &quot;X is best&quot; — they are &quot;X, because of these
          trade-offs, given these requirements.&quot; The recurring dials:
        </P>
        <CodeBlock
          title="the_dials.txt"
          runnable={false}
          code={`⏱️ CONSISTENCY ◀──────────────▶ AVAILABILITY/SPEED
   sync Multi-AZ commit          async replicas, eventual
   (RDS standby)                 consistency (DynamoDB GT, CRR)

🧩 SIMPLE/MANAGED ◀───────────▶ CONTROL/PORTABLE
   Fargate, Aurora, Amplify      EC2, self-managed, EKS

💰 COST ◀─────────────────────▶ RESILIENCE
   single-AZ dev                 multi-region active-active

🚀 SPEED-TO-SHIP ◀────────────▶ FUTURE-PROOFING
   monolith on Beanstalk today   microservices you may not need

🔒 LOCKED-IN VALUE ◀──────────▶ PORTABILITY
   DynamoDB/Step Functions       Postgres/Kafka/k8s anywhere

answer template: "Given [requirement: RTO 5min / budget / team
of 3], I'd pick [X] accepting [trade-off], and revisit when
[trigger metric]." — that sentence IS architecture 🏗️`}
        />
        <Callout type="mistake">
          ⚠️ The two failure modes are symmetric: under-engineering (single AZ, no backups,
          prod on a t2.micro) and over-engineering (multi-region Kubernetes for 40 users).
          Requirements — RTO/RPO, budget, team size, traffic — are the only tiebreaker.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="review-checklist" number="08" title="The Architecture Review Checklist">
        <P>Run any design — yours or an interviewer&apos;s — through this 60-second sweep:</P>
        <CodeBlock
          title="review_sweep.txt"
          runnable={false}
          code={`🛟 RELIABILITY
 ☐ what dies if ONE instance dies? one AZ? the region?
 ☐ RTO/RPO stated? backups exist AND restore-tested?
 ☐ retries + DLQs on every async edge?
🔒 SECURITY
 ☐ public surface minimal? (only ALB/CloudFront public)
 ☐ least-privilege roles? secrets in Secrets Manager?
 ☐ encrypted at rest (KMS) + in transit (TLS)? CloudTrail on?
⚡ PERFORMANCE
 ☐ what's cached? (CloudFront / ElastiCache / DAX)
 ☐ DB right for the access pattern? (the flowchart!)
 ☐ where's the bottleneck at 10× traffic?
💰 COST
 ☐ tagged? budgeted? baseline on Savings Plans?
 ☐ data-transfer traps? (NAT→S3, cross-AZ chatter)
⚙️ OPERATIONS
 ☐ 100% IaC? deployed by pipeline? alarmed on symptoms
   (latency/errors) not just causes (CPU)?
 ☐ can you roll back in one step?

any unchecked box = your next sprint's ticket 🎫`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Core instincts", "design for failure · decouple · scale horizontally"],
            ["6 pillars", "OpEx, Security, Reliability, Performance, Cost, Sustainability"],
            ["WA Tool", "free console review → flags high-risk issues per workload"],
            ["Pillars trade off", "reliability costs money; security costs friction — choose consciously"],
            ["3-tier reference", "R53 → CloudFront/WAF → ALB → ASG (stateless) → cache → RDS Multi-AZ"],
            ["SG chain", "ALB-SG → APP-SG → DB-SG — network enforces the tiers"],
            ["Serverless ref", "APIGW→Lambda→DynamoDB sync · EventBridge+SQS async"],
            ["Scaling order", "Multi-AZ → stateless+cache → queues → split services → multi-region"],
            ["Stateless first", "horizontal scale requires state in DB/cache/S3, not servers"],
            ["Cache everything", "CloudFront, ElastiCache, DAX — cheapest performance there is"],
            ["Architect's sentence", "given [requirements] pick [X] accepting [trade-off]"],
            ["Both sins", "under-engineering AND over-engineering — requirements decide"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
