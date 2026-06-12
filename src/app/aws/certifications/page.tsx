"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Your Path to Certified — Live",
  nodes: [
    { id: "you", icon: "🧑‍🎓", label: "You", sub: "finished this course", x: 7, y: 50, color: "#22d3ee" },
    { id: "study", icon: "📚", label: "Study", sub: "course + docs + FAQs", x: 28, y: 18, color: "#a78bfa" },
    { id: "build", icon: "🛠️", label: "Build", sub: "real projects", x: 32, y: 78, color: "#34d399" },
    { id: "mocks", icon: "📝", label: "Mock Exams", sub: "score 80%+ twice", x: 58, y: 40, color: "#fbbf24" },
    { id: "exam", icon: "🎯", label: "SAA Exam", sub: "65 Qs · 130 min", x: 80, y: 18, color: "#fb923c" },
    { id: "badge", icon: "🏅", label: "Certified!", sub: "valid 3 years", x: 90, y: 70, color: "#f472b6" },
  ],
  edges: [
    { id: "you-study", from: "you", to: "study", color: "#a78bfa" },
    { id: "you-build", from: "you", to: "build", color: "#34d399" },
    { id: "study-mocks", from: "study", to: "mocks", color: "#fbbf24" },
    { id: "build-mocks", from: "build", to: "mocks", color: "#34d399" },
    { id: "mocks-exam", from: "mocks", to: "exam", color: "#fb923c" },
    { id: "exam-badge", from: "exam", to: "badge", color: "#f472b6" },
    { id: "mocks-study", from: "mocks", to: "study", bend: 20, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "path",
      name: "🗺️ The 8-week path",
      command: "goal: AWS Solutions Architect – Associate",
      steps: [
        { node: "you", paths: ["you-study", "you-build"], text: "Weeks 1-5: study the domains AND build in parallel. Reading alone doesn't stick — deploying does." },
        { node: "build", paths: ["you-build"], text: "Deploy the 3-tier app, break an AZ on purpose, watch the failover. Exam questions describe things you'll have SEEN." },
        { node: "mocks", paths: ["study-mocks", "build-mocks"], text: "Weeks 6-7: timed mock exams. Review every wrong answer — and every right-but-guessed one." },
        { node: "badge", paths: ["mocks-exam", "exam-badge"], text: "Score 80%+ on two different mocks → book the real thing. Week 8: pass. 🏅" },
      ],
    },
    {
      id: "loop",
      name: "🔁 Weak-area loop",
      command: "mock #1: 62% — networking domain: 41%",
      steps: [
        { node: "mocks", paths: ["mocks-study"], text: "First mock: 62%. Not a failure — a diagnosis. The breakdown shows networking is your weak domain." },
        { node: "study", paths: ["you-study"], text: "Targeted loop: re-read the VPC + Advanced Networking topics, redo the subnet math, rebuild the NAT setup." },
        { node: "mocks", paths: ["study-mocks"], text: "Mock #2: 78%. Mock #3: 84%. The loop converges fast when it's targeted instead of re-reading everything. 🔁" },
      ],
    },
    {
      id: "examday",
      name: "🎯 Exam day",
      command: "65 questions · 130 min · ~720/1000 to pass",
      steps: [
        { node: "exam", paths: ["mocks-exam"], text: "Strategy: ~2 min per question. Unsure? Eliminate 2 obviously-wrong options, flag it, move on. No negative marking — answer EVERYTHING." },
        { node: "exam", paths: [], text: "Read for keywords: \"cost-effective\" → S3/Spot/serverless · \"highly available\" → Multi-AZ · \"global users\" → CloudFront." },
        { node: "badge", paths: ["exam-badge"], text: "Submit → pass notification on screen. Badge arrives in 24h. Valid 3 years — and the knowledge is yours forever. 🎯🏅" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-certs", label: "Why Certify (and Why Not)" },
  { id: "the-ladder", label: "The Certification Ladder ⭐" },
  { id: "which-first", label: "Which Cert First? Flowchart ⭐" },
  { id: "saa-deep", label: "SAA — The Most Popular Cert ⭐" },
  { id: "exam-anatomy", label: "Anatomy of an AWS Exam" },
  { id: "study-plan", label: "The 8-Week Study Plan" },
  { id: "question-tactics", label: "Question Tactics — Keyword Map ⭐" },
  { id: "after", label: "After the Badge" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsCertificationsPage() {
  return (
    <TopicShell
      icon="🎓"
      title="AWS Certifications Path"
      gradientWord="Certifications"
      subtitle="You've done the 20 topics — this is how to convert them into a badge. The cert ladder, which exam fits you, an 8-week plan, and the keyword-to-answer map that makes AWS exam questions feel rigged in your favor."
      nav={NAV}
      badges={["🪜 Full ladder", "🗓️ 8-week plan", "🔑 Keyword map"]}
      backHref="/aws"
      backLabel="☁️ AWS"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-certs" number="01" title="Why Certify (and Why Not)">
        <CodeBlock
          title="honest_pros_cons.txt"
          runnable={false}
          code={`WHY IT'S WORTH IT                  WHAT IT ISN'T
✅ forcing function — a date on     ❌ not a substitute for having
   the calendar makes you finish      BUILT things (interviewers
   the learning                       probe past the badge fast)
✅ HR filter pass — recruiters      ❌ not a guarantee of a job
   search for "SAA" literally       ❌ not permanent — recertify
✅ shared vocabulary at work          every 3 years
✅ consulting/partner firms NEED
   certified staff (AWS partner
   tiers count badges) → real
   hiring demand
✅ structured map of services
   you'd never otherwise touch

best combo: cert + 2-3 small REAL projects deployed
(this course's architectures!) — badge opens the door,
projects carry the interview 🚪`}
        />
      </Section>

      {/* 02 */}
      <Section id="the-ladder" number="02" title="The Certification Ladder ⭐">
        <CodeBlock
          title="cert_ladder.txt"
          runnable={false}
          code={`FOUNDATIONAL ($100, 90 min)
 ☁️ Cloud Practitioner (CLF)      cloud + billing basics, no code
 🤖 AI Practitioner (AIF)         AI/ML services overview
        │
ASSOCIATE ($150, 130 min) ⭐ the sweet spot
 🏗️ Solutions Architect (SAA)     design systems — THE most
                                  popular AWS cert, period
 💻 Developer (DVA)               build/deploy: Lambda, APIGW,
                                  DynamoDB, CI/CD, SDK details
 ⚙️ SysOps Administrator (SOA)    operate: monitoring, networking
 📊 Data Engineer (DEA)           pipelines: Glue, Kinesis, Redshift
 🤖 ML Engineer Associate (MLA)   SageMaker in practice
        │
PROFESSIONAL ($300, 180 min) 💪
 🏗️ Solutions Architect Pro (SAP) multi-account, migrations,
                                  cost at enterprise scale
 🔁 DevOps Engineer Pro (DOP)     advanced CI/CD, ops automation
        │
SPECIALTY ($300)
 🔒 Security (SCS)    🕸️ Advanced Networking (ANS)
 🤖 ML Specialty (MLS)

no prerequisites — you MAY jump straight to any level
(most people still start CLF or SAA)`}
        />
      </Section>

      {/* 03 */}
      <Section id="which-first" number="03" title="Which Cert First? — The Flowchart ⭐">
        <CodeBlock
          title="which_cert_flow.txt"
          runnable={false}
          code={`"which exam should I take?"
 │
 ├─ non-technical / sales / PM / total beginner?
 │    └─▶ ☁️ CLOUD PRACTITIONER — gentle, 2-4 weeks
 │
 ├─ finished a course like this one, want max career value?
 │    └─▶ 🏗️ SAA (Solutions Architect Associate) ⭐
 │         default answer for 80% of people
 │
 ├─ working developer, write Lambda/APIs daily?
 │    └─▶ 💻 DVA — overlaps SAA ~60%, more SDK/CICD detail
 │
 ├─ ops / SRE background?            └─▶ ⚙️ SOA
 ├─ data pipelines are your job?     └─▶ 📊 DEA
 ├─ already certified associate + 2yrs hands-on?
 │    └─▶ 🏗️ SAP or 🔁 DOP (genuinely hard — respect them)
 └─ security specialist?             └─▶ 🔒 SCS (after SAA)

popular path: (CLF) → SAA → DVA → SAP
              cheap momentum → breadth → depth → seniority`}
        />
        <Callout type="tip">
          💡 If you completed topics 1–20 of this course, you can skip Cloud Practitioner and
          aim straight at SAA — this course already covers the CLF syllabus and most of the
          SAA one.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="saa-deep" number="04" title="SAA Deep Dive — What the Exam Actually Tests ⭐">
        <CodeBlock
          title="saa_breakdown.txt"
          runnable={false}
          code={`SAA-C03: 65 questions · 130 min · pass ≈ 720/1000
scoring: 50 count + 15 unscored experiments (you can't tell which)

DOMAINS                                    ← course topics that cover it
 1. design SECURE architectures      30%   IAM, KMS, security svcs,
                                           VPC endpoints, SG/NACL
 2. design RESILIENT architectures   26%   multi-AZ, DR patterns,
                                           SQS decoupling, Route 53
 3. HIGH-PERFORMING architectures    24%   right compute/DB choice,
                                           caching, Kinesis, EBS types
 4. COST-OPTIMIZED architectures     20%   S3 classes, Spot/SP,
                                           NAT/endpoint traps

translation: it is a "pick the right service given constraints"
exam — exactly the flowcharts you've been learning ✅`}
        />
        <CodeBlock
          title="saa_sample_question.txt"
          runnable={false}
          code={`typical question shape:

"A company runs a web app on EC2 behind an ALB. Traffic spikes
unpredictably. Some image-processing jobs take 20 minutes and
currently time out. The DB has heavy read traffic on product
pages. What should a solutions architect recommend?
(choose the MOST cost-effective solution)"

decode the keywords:
 "spikes unpredictably"        → Auto Scaling Group
 "20-min jobs time out"        → decouple: SQS + worker fleet
 "heavy READ traffic"          → read replica or ElastiCache
 "MOST cost-effective"         → eliminate the gold-plated option

every question = 2 obviously-wrong + 2 plausible answers,
separated by ONE constraint word (cheapest? fastest? least ops?)`}
        />
      </Section>

      {/* 05 */}
      <Section id="exam-anatomy" number="05" title="Anatomy of an AWS Exam">
        <CodeBlock
          title="logistics.txt"
          runnable={false}
          code={`📍 WHERE     Pearson VUE test center, or online proctored
             (webcam, clean desk, stable internet)
🗣️ ESL bonus: non-native English speakers can request
             +30 minutes (ESL accommodation) — take it!
⏱️ PACE      130 min / 65 q ≈ 2 min each
             flag-and-return is your friend 🚩
❌ SCORING   no negative marking → NEVER leave blanks,
             always guess
📅 RESULT    pass/fail by email within hours-days
♻️ VALIDITY  3 years · recertify by re-passing (or passing
             a higher level, which renews lower ones)
🎟️ PERK     pass any exam → 50% off voucher for the next one
💸 FAIL?     14-day wait, full fee again — mock-test first!`}
        />
      </Section>

      {/* 06 */}
      <Section id="study-plan" number="06" title="The 8-Week Study Plan (for SAA)">
        <CodeBlock
          title="eight_week_plan.txt"
          runnable={false}
          code={`assumes ~1h/day. you've done this course = weeks 1-4 are review.

wk 1-2  📖 LEARN: course/topics 1-9 (IAM→security)
        🛠️ BUILD: the 3-tier app for real — VPC, ALB, ASG,
        RDS Multi-AZ (then TEAR IT DOWN 💰)
wk 3-4  📖 LEARN: topics 10-19 (serverless→networking)
        🛠️ BUILD: serverless API (APIGW+Lambda+DynamoDB) + S3
        site behind CloudFront
wk 5    📝 first FULL mock exam, timed
        → score <60%? extend learning 2 weeks, no shame
        → review EVERY question, even correct ones:
          "why are the 3 wrong answers wrong?" ⭐ (the real learning)
wk 6    🔁 weak-domain grind: re-read those topics' memorize
        grids, redo flowcharts from memory on paper
wk 7    📝 mock #2 and #3 → consistently 80%+? book the exam 📅
wk 8    🧘 light review only: memorize grids, keyword map (§07),
        S3 classes, DR patterns, SG-vs-NACL. sleep. pass. 🎉

mock-exam rule: practice scores ~80%+ → real exam pass is likely
(reputable mocks: Tutorials Dojo/Jon Bonso are the community gold standard)`}
        />
        <Callout type="mistake">
          ⚠️ The #1 failure mode: watching videos for months without doing mock exams. Mocks
          are not assessment, they are <em>training</em> — the question style is a skill of its
          own. Start them at week 5, not the night before.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="question-tactics" number="07" title="Question Tactics — The Keyword Map ⭐">
        <P>
          AWS exam questions telegraph their answers through constraint keywords. This map is
          the closest thing to a legal cheat sheet:
        </P>
        <Table
          head={["When the question says…", "The answer almost always involves…"]}
          rows={[
            ["“least operational overhead”", "serverless/managed: Lambda, Fargate, Aurora Serverless, S3"],
            ["“most cost-effective” + interruptible", "Spot instances"],
            ["“most cost-effective” + steady 24/7", "Savings Plans / Reserved"],
            ["“rarely accessed, retrieve in ms”", "S3 Standard-IA (Glacier if hours are OK)"],
            ["“unknown access pattern”", "S3 Intelligent-Tiering"],
            ["“decouple” / “buffer” / “spike”", "SQS"],
            ["“fan-out” / “notify multiple”", "SNS (→ SQS queues)"],
            ["“real-time streaming analytics”", "Kinesis"],
            ["“ms latency at any scale, key-value”", "DynamoDB (+ DAX for µs reads)"],
            ["“global users, static IP, TCP/UDP”", "Global Accelerator"],
            ["“cache static content globally”", "CloudFront"],
            ["“private connectivity to S3, no internet”", "Gateway VPC endpoint"],
            ["“on-prem to AWS, consistent bandwidth”", "Direct Connect (+ VPN backup for HA)"],
            ["“who made this API call?”", "CloudTrail"],
            ["“encrypt with keys you control/rotate”", "KMS (CloudHSM if dedicated hardware)"],
            ["“RTO minutes, minimize cost”", "pilot light / warm standby"],
            ["“zero RTO/RPO across regions”", "active-active + Global Tables/Aurora Global"],
          ]}
        />
        <Callout type="tip">
          💡 Elimination order: (1) cross out answers with non-existent features or wrong-tool
          pairings, (2) cross out the one ignoring the constraint keyword, (3) of the final
          two, pick the more <em>managed</em>/simpler one — AWS exams reward their own managed
          services.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="after" number="08" title="After the Badge — Cashing It In">
        <CodeBlock
          title="after_the_badge.txt"
          runnable={false}
          code={`📛 claim the Credly badge → LinkedIn title + certifications
   section ("AWS Certified Solutions Architect – Associate")
🛠️ pin 2-3 portfolio repos that PROVE it:
   • 3-tier app as CDK/Terraform code (IaC > screenshots)
   • serverless API with CI/CD pipeline + README architecture
     diagram — the diagram does the talking 🗺️
💬 interview prep: rehearse the scaling story (topic 20 §06)
   and 2-3 "trade-off sentences" about YOUR projects
🪜 next rung: 50%-off voucher → DVA in ~4 weeks (big overlap)
   or go build for a year and take SAP with real scars
♻️ calendar reminder: recert at year 2.5, not month 35 😅

and that's the course. 21 topics ago this was "what is the
cloud?" — now you can design, secure, scale, price and
certify it. go build something. ☁️🚀`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Ladder", "Foundational → Associate → Professional + Specialty"],
            ["Default first cert", "SAA — most popular, best career ROI"],
            ["SAA format", "65 q / 130 min / ~720 to pass / $150"],
            ["SAA domains", "secure 30 · resilient 26 · performant 24 · cost 20"],
            ["Validity", "3 years · higher pass renews lower · 50% next-exam voucher"],
            ["No negatives", "never leave a question blank — always guess"],
            ["ESL perk", "+30 min accommodation for non-native English speakers"],
            ["Study core", "build it for real + mock exams from week 5"],
            ["Mock rule", "consistent 80%+ on good mocks → book the real one"],
            ["Keyword: least ops", "serverless / most-managed option"],
            ["Keyword: cost + steady", "Savings Plans · interruptible → Spot"],
            ["Final tiebreak", "pick the more managed service — AWS grades AWS-ly"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
