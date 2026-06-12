"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "SEE → GUARD → CUT — Live",
  nodes: [
    { id: "res", icon: "💸", label: "Resources", sub: "EC2 · RDS · NAT…", x: 8, y: 50, color: "#f87171" },
    { id: "ce", icon: "🔍", label: "Cost Explorer", sub: "see the spend", x: 34, y: 16, color: "#22d3ee" },
    { id: "budget", icon: "⏰", label: "Budgets", sub: "alert at 80%", x: 34, y: 84, color: "#fbbf24" },
    { id: "eng", icon: "👨‍🔧", label: "Engineer", sub: "acts on data", x: 62, y: 50, color: "#34d399" },
    { id: "save", icon: "✂️", label: "Savings", sub: "SP · Spot · rightsize", x: 88, y: 50, color: "#fb923c" },
  ],
  edges: [
    { id: "res-ce", from: "res", to: "ce", color: "#22d3ee" },
    { id: "res-budget", from: "res", to: "budget", color: "#fbbf24" },
    { id: "ce-eng", from: "ce", to: "eng", color: "#34d399" },
    { id: "budget-eng", from: "budget", to: "eng", color: "#fbbf24" },
    { id: "eng-save", from: "eng", to: "save", color: "#fb923c" },
    { id: "save-res", from: "save", to: "res", bend: -60, dashed: true, color: "#34d399" },
  ],
  flows: [
    {
      id: "see",
      name: "🔍 SEE it",
      command: "Cost Explorer: group by tag:team, service",
      steps: [
        { node: "res", paths: ["res-ce"], text: "Every resource generates line items — the bill is just thousands of (usage × rate) rows." },
        { node: "ce", paths: ["res-ce"], text: "Cost Explorer groups them: \"team-search spends $9k/month, 60% of it on NAT Gateway data processing?!\"" },
        { node: "eng", paths: ["ce-eng"], text: "Because everything is TAGGED (team, env, project), the surprise has an owner within minutes. 🔍" },
      ],
    },
    {
      id: "guard",
      name: "⏰ GUARD it",
      command: "budget: $10k/month → alert at 80%, 100%",
      steps: [
        { node: "budget", paths: ["res-budget"], text: "A Budget watches actual + FORECASTED spend. On the 18th, the forecast crosses $10k." },
        { node: "eng", paths: ["budget-eng"], text: "Email + Slack alert at 80%. Not at month-end when it's too late — NOW, while there are 12 days to react." },
        { node: "budget", paths: ["res-budget"], text: "Anomaly Detection also watches per-service baselines: \"S3 spend jumped 300% yesterday\" → instant alert. ⏰" },
      ],
    },
    {
      id: "cut",
      name: "✂️ CUT it",
      command: "savings plan $5/hr + spot workers + rightsize",
      steps: [
        { node: "eng", paths: ["eng-save"], text: "The fix list: rightsize over-provisioned instances (m5.2xlarge at 8% CPU → m5.large), delete unattached EBS volumes." },
        { node: "save", paths: ["eng-save"], text: "Steady baseline → Compute Savings Plan (-30-50%). Interruptible batch work → Spot instances (-70-90%)." },
        { node: "res", paths: ["save-res"], text: "Same workload, 45% smaller bill. The loop repeats monthly — cost optimization is a habit, not a project. ✂️" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-bills-explode", label: "Why AWS Bills Explode ⭐" },
  { id: "see-it", label: "SEE It — Cost Explorer & Tags" },
  { id: "guard-it", label: "GUARD It — Budgets & Alerts ⭐" },
  { id: "compute-pricing", label: "Compute: RI vs Savings Plans vs Spot ⭐" },
  { id: "rightsizing", label: "Right-Sizing & Waste Hunting" },
  { id: "storage-data", label: "Storage & Data Transfer Costs ⭐" },
  { id: "trusted-advisor", label: "Trusted Advisor & Compute Optimizer" },
  { id: "playbook", label: "The Cost Playbook" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsCostOptimizationPage() {
  return (
    <TopicShell
      icon="💰"
      title="Cost Optimization"
      gradientWord="Cost"
      subtitle="The cloud's superpower — pay for what you use — cuts both ways: forget something and you pay for that too. Learn to SEE costs (Cost Explorer, tags), GUARD them (Budgets), and CUT them (Savings Plans, Spot, right-sizing, the data-transfer traps)."
      nav={NAV}
      badges={["👀 See → guard → cut", "💸 Real traps", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🛟", label: "High Availability & DR", href: "/aws/ha-dr" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-bills-explode" number="01" title="Why AWS Bills Explode ⭐">
        <CodeBlock
          title="how_money_leaks.txt"
          runnable={false}
          code={`the usual suspects on a shocking bill:

🧟 ZOMBIES        instances/DBs from finished experiments,
                  unattached EBS volumes, idle load balancers,
                  un-released Elastic IPs — running since March
📏 OVERSIZED      m5.4xlarge at 4% CPU "just to be safe"
🌙 24/7 DEV       staging + dev burning all night and weekend
                  (168h/week paid, ~50h used = 70% waste)
🚪 DATA TRANSFER  the silent killer — cross-AZ chatter, NAT
                  gateway processing, internet egress (§06)
🧾 NO OWNERSHIP   one giant bill, no tags → nobody's problem
💎 WRONG PRICING  steady 24/7 workloads on full on-demand rates
                  (leaving the ~40-70% discount on the table)

the mindset shift: on-prem overspend = bought too much ONCE.
cloud overspend = a leak that bills you EVERY HOUR until found 🚰`}
        />
        <Callout type="analogy">
          🚿 An AWS account is a hotel where every tap left running bills your card by the
          minute. Cost optimization is three habits: install meters (visibility), set alarms
          (budgets), and close taps you are not using (optimization).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="see-it" number="02" title="SEE It — Cost Explorer & Tags">
        <CodeBlock
          title="visibility_tools.txt"
          runnable={false}
          code={`📊 COST EXPLORER — the interactive bill
   group by: service / account / region / TAG
   "EC2 jumped 40% this month" → group by tag:team → "it's the
   data team's new GPU notebooks" → conversation, not mystery
   + forecasts month-end · + RI/SP recommendations

🏷️ COST ALLOCATION TAGS — the foundation of EVERYTHING
   every resource gets:  team=payments  env=prod  project=checkout
   activate them as "cost allocation tags" → they become columns
   in Cost Explorer & CUR
   no tags = one giant anonymous bill = no accountability
   enforce: Tag Policies + SCP "deny RunInstances without tag" 🔒

🧾 CUR (Cost & Usage Report) — every line item → S3
   → query with Athena, dashboard with QuickSight (FinOps teams)

🏢 multi-account: Organizations consolidated billing —
   one payer, per-account breakdown, usage pooled for discounts`}
        />
        <Callout type="tip">
          💡 Tag strategy is a day-one decision. Retro-tagging a year of untagged resources is
          archaeology; tags enforced from the start make every later cost conversation trivial.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="guard-it" number="03" title="GUARD It — Budgets & Anomaly Detection ⭐">
        <CodeBlock
          title="budgets.txt"
          runnable={false}
          code={`💂 AWS BUDGETS — tripwires on spend
   budget: $5,000/month
    ├─ actual hits 80%  → 📧 email team
    ├─ FORECASTED >100% → 📟 alert lead (it predicts ahead! ⭐)
    └─ actual hits 100% → 🚨 page + (optional) BUDGET ACTION:
                          auto-apply a deny-new-instances policy
   scope budgets per team/env via tags

🤖 COST ANOMALY DETECTION — ML watches spending patterns
   "NAT gateway cost 6× its usual today" → alert within hours,
   not at month-end. free. turn it on everywhere.

the goal: NOBODY should ever discover overspend
from the invoice 28 days late 📅`}
        />
        <Callout type="mistake">
          ⚠️ Budgets <em>alert</em>, they don&apos;t stop spending by default. For hard stops
          (hackathons, student accounts) wire budget actions to an SCP, or accept that alerts +
          fast humans are the real control.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="compute-pricing" number="04" title="Compute: RI vs Savings Plans vs Spot ⭐">
        <P>
          Compute is usually the #1 line item, and it has four prices for the same hardware:
        </P>
        <CodeBlock
          title="four_prices_same_cpu.txt"
          runnable={false}
          code={`ON-DEMAND        baseline, no commitment        $1.00 (reference)
RESERVED (RI)    commit 1-3yr to an INSTANCE     ~$0.40-0.60
                 FAMILY in a region (rigid)
SAVINGS PLANS ⭐ commit to $X/HOUR of compute    ~$0.30-0.60
                 for 1-3yr — flexible:
                 • Compute SP: any instance, any region,
                   Fargate & Lambda too! (most flexible)
                 • EC2 Instance SP: one family+region (deeper %)
SPOT             spare capacity, can be          ~$0.10-0.30
                 reclaimed with 2-min warning    (60-90% off!)

how to LAYER them over a real load curve:

 load
  ▲        ╭──╮ spikes      → ON-DEMAND / SPOT
  │   ╭────╯  ╰───╮
  │ ──┤ daytime bump├──     → more SAVINGS PLAN or spot
  │███│█ 24/7 base █│███    → SAVINGS PLAN (always-on floor)
  └────────────────────▶ time`}
        />
        <Table
          head={["", "Savings Plans", "Reserved Instances", "Spot"]}
          rows={[
            ["Commit to", "$/hour of compute", "specific instance family+region", "nothing"],
            ["Discount", "up to ~66-72%", "up to ~72% (+capacity reservation option)", "60-90%"],
            ["Flexibility", "⭐ any instance/region/Fargate/Lambda (Compute SP)", "rigid (convertible RI helps)", "total — but reclaimable"],
            ["Risk", "paying the commit even if usage drops", "stuck with wrong family", "2-min eviction notice"],
            ["Use for", "the steady baseline", "RDS/ElastiCache (no SP there!)", "batch, CI, stateless workers"],
          ]}
        />
        <Callout type="behind">
          🔧 Spot eviction is survivable by design: ASGs with mixed instances replace reclaimed
          nodes, Spot Fleet diversifies across pools, and batch/CI jobs simply retry. Stateless
          + interruptible = 70% off forever. Databases? Never on Spot.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="rightsizing" number="05" title="Right-Sizing & Waste Hunting">
        <CodeBlock
          title="waste_hunt_checklist.txt"
          runnable={false}
          code={`weekly 30-minute waste hunt:

🖥️ EC2 < 10% avg CPU for 2 weeks?   → downsize (each size step = -50%)
🌙 dev/staging at night+weekends?    → scheduler: stop 19:00,
                                       start 08:00 = ~65% off those envs
💾 unattached EBS volumes?           → snapshot then delete
📸 ancient snapshots / AMIs?         → lifecycle them out
🌐 Elastic IPs not attached?         → release (they bill when idle!)
⚖️ load balancers with no targets?   → delete
🗄️ RDS instances nobody queried?     → snapshot + stop/delete
🧊 gp2 volumes?                      → migrate to gp3 (-20%, free win)
🏗️ old-gen instances (m4, t2)?      → newer gen = faster AND cheaper

tools that hunt for you:
 🧮 Compute Optimizer — ML on your metrics: "m5.2xlarge → m6g.large,
    save $87/mo" (Graviton/ARM suggestions = extra ~20% 💪)
 📉 S3 Storage Lens — bucket-level waste analytics`}
        />
        <Callout type="tip">
          💡 Easiest big win in most companies: turning off non-prod outside working hours. An
          Instance Scheduler or a 10-line Lambda on an EventBridge cron pays for itself the
          first week.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="storage-data" number="06" title="Storage & Data Transfer — The Silent Killers ⭐">
        <CodeBlock
          title="storage_costs.txt"
          runnable={false}
          code={`🪣 S3: match class to access (from the Storage topic)
   hot → Standard · unknown → INTELLIGENT-TIERING (set & forget ⭐)
   logs/backups → lifecycle rules → IA → Glacier → expire 🗑️
   + incomplete multipart uploads: invisible until lifecycle-cleaned!`}
        />
        <CodeBlock
          title="data_transfer_rules.txt"
          runnable={false}
          code={`the rules nobody reads until the bill arrives:

 ⬇️ INTO AWS (ingress)             FREE ✅
 🏠 same AZ (private IP)           FREE ✅
 ↔️ CROSS-AZ                       ~$0.01/GB each direction 💸
    (chatty microservices across AZs add up FAST)
 🌍 cross-REGION                   ~$0.02+/GB
 ⬆️ OUT to internet (egress)       ~$0.09/GB 💸💸 THE big one
    1TB/day out ≈ $2,700/month

 🚪 NAT GATEWAY                    $0.045/GB PROCESSED + hourly
    the classic trap: private subnets pulling from S3
    THROUGH NAT = paying NAT rates for S3 traffic 😱
    fix: S3/DynamoDB GATEWAY VPC ENDPOINT = FREE routing ⭐

cheap egress trick: CloudFront → internet is cheaper than
EC2 → internet, AND origin→CloudFront is free. CDN saves twice ✅`}
        />
        <Callout type="mistake">
          ⚠️ The S3-through-NAT trap is the most common &quot;why is NAT $4k/month?&quot;
          answer in real audits. One free gateway endpoint deletes the entire charge. Check
          your VPCs today.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="trusted-advisor" number="07" title="Trusted Advisor & Compute Optimizer">
        <CodeBlock
          title="advisors.txt"
          runnable={false}
          code={`🧑‍⚖️ TRUSTED ADVISOR — automated account audit, 5 categories:
   💰 cost optimization   "idle RDS, low-util EC2, unassociated EIPs"
   🔒 security            "open security groups, MFA off on root"
   ⚡ performance          "overutilized instances"
   🛟 fault tolerance      "EBS without snapshots, single-AZ RDS"
   📏 service limits       "you're at 80% of your VPC limit"
   (full checks need Business/Enterprise support plan)

🧮 COMPUTE OPTIMIZER — free, ML-based right-sizing for
   EC2 / ASG / EBS / Lambda with specific recommendations
   ("over-provisioned: t3.xlarge → t3.medium")

think of them as a free junior FinOps engineer who
never sleeps — but only if someone READS the findings 📋`}
        />
      </Section>

      {/* 08 */}
      <Section id="playbook" number="08" title="The Cost Playbook — In Order">
        <CodeBlock
          title="playbook.txt"
          runnable={false}
          code={`WEEK 1 — SEE 👀
 ☐ activate cost allocation tags (team/env/project) + enforce
 ☐ Cost Explorer review: top 5 services, group by tag
 ☐ enable Cost Anomaly Detection (free)
WEEK 1 — GUARD 💂
 ☐ Budgets per env/team: 80% actual + 100% forecast alerts
WEEK 2-3 — QUICK CUTS ✂️
 ☐ kill zombies (checklist §05) · gp2→gp3 · release idle EIPs
 ☐ schedule non-prod off-hours (-65% on those envs)
 ☐ S3 lifecycle + Intelligent-Tiering
 ☐ S3/DynamoDB gateway endpoints (kill NAT charges)
MONTH 2 — COMMIT 💎
 ☐ 2-4 weeks of clean data → buy Savings Plan for the baseline
   (start ~70% coverage, top up later — under-commit beats over)
 ☐ RIs for RDS/ElastiCache steady instances
 ☐ Spot for batch/CI/stateless fleets
FOREVER 🔁
 ☐ monthly cost review ritual · cost = a feature requirement
   ("this design costs $X/mo at 10× traffic — acceptable?")`}
        />
        <Callout type="analogy">
          🏋️ Cost optimization is fitness, not surgery: not one heroic intervention but a
          weekly habit — weigh in (Cost Explorer), alarms when the trend is wrong (Budgets),
          and small consistent cuts that compound.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Framework", "SEE (Explorer+tags) → GUARD (Budgets) → CUT (optimize)"],
            ["Tags", "team/env/project on everything — no tags, no accountability"],
            ["Budgets", "alert at 80% actual + 100% FORECASTED — never invoice surprises"],
            ["Savings Plans", "commit $/hr 1-3yr, up to ~72% off — covers Fargate+Lambda"],
            ["RI today", "mainly for RDS/ElastiCache (no Savings Plans there)"],
            ["Spot", "60-90% off, 2-min warning — stateless/batch only, never DBs"],
            ["Layering", "SP for baseline · spot/on-demand for spikes"],
            ["Off-hours", "stop non-prod nights+weekends ≈ 65% off those envs"],
            ["Egress", "in = free · cross-AZ = ¢ · out to internet ≈ $0.09/GB"],
            ["NAT trap", "S3 via NAT = $$$ → free gateway VPC endpoint"],
            ["Free advisors", "Trusted Advisor, Compute Optimizer, Anomaly Detection"],
            ["Quick wins", "zombies, gp2→gp3, idle EIPs, S3 lifecycle"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
