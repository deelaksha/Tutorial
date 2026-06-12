"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "ALB + Auto Scaling — Live",
  nodes: [
    { id: "users", icon: "👥", label: "Users", sub: "traffic spike!", x: 8, y: 50, color: "#22d3ee" },
    { id: "alb", icon: "⚖️", label: "ALB", sub: "health checks /health", x: 32, y: 50, color: "#fb923c" },
    { id: "t1", icon: "🖥️", label: "Target 1", sub: "AZ-a · healthy", x: 62, y: 14, color: "#34d399" },
    { id: "t2", icon: "🖥️", label: "Target 2", sub: "AZ-b · healthy", x: 62, y: 50, color: "#34d399" },
    { id: "t3", icon: "✨", label: "Target 3", sub: "launched by ASG", x: 62, y: 86, color: "#a78bfa" },
    { id: "asg", icon: "📈", label: "Auto Scaling", sub: "CloudWatch + ASG", x: 88, y: 50, color: "#fbbf24" },
  ],
  edges: [
    { id: "users-alb", from: "users", to: "alb", color: "#22d3ee" },
    { id: "alb-t1", from: "alb", to: "t1", color: "#34d399" },
    { id: "alb-t2", from: "alb", to: "t2", color: "#34d399" },
    { id: "alb-t3", from: "alb", to: "t3", dashed: true, color: "#a78bfa" },
    { id: "asg-t3", from: "asg", to: "t3", dashed: true, color: "#fbbf24" },
    { id: "t2-asg", from: "t2", to: "asg", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "distribute",
      name: "⚖️ Distribute",
      command: "10,000 req/min → 2 targets",
      steps: [
        { node: "users", paths: ["users-alb"], text: "All traffic hits ONE address — the ALB's DNS name. Users never talk to instances directly." },
        { node: "alb", paths: ["alb-t1", "alb-t2"], text: "The ALB spreads requests across healthy targets in BOTH AZs (round-robin per target group)." },
        { node: "t1", paths: ["alb-t1"], text: "Each target handles ~50% of the load. Lose an AZ? The other keeps serving. ⚖️" },
      ],
    },
    {
      id: "unhealthy",
      name: "🤕 Unhealthy target",
      command: "GET /health → 500 (Target 2)",
      steps: [
        { node: "t2", paths: ["alb-t2"], text: "Target 2's app crashes. The ALB's health check (GET /health every 10s) fails 2 times in a row." },
        { node: "alb", paths: ["alb-t1"], text: "ALB marks it UNHEALTHY and instantly stops routing to it. Users only reach Target 1 — nobody sees an error." },
        { node: "asg", paths: ["t2-asg", "asg-t3"], text: "The ASG notices a failed instance, TERMINATES it, and launches a fresh replacement. Self-healing, zero humans. 🤕→✨" },
      ],
    },
    {
      id: "scale",
      name: "📈 Scale out",
      command: "CloudWatch: CPU avg 85% > target 50%",
      steps: [
        { node: "asg", paths: ["t2-asg"], text: "Traffic doubles. CloudWatch reports average CPU way above the 50% target-tracking goal." },
        { node: "t3", paths: ["asg-t3"], text: "The ASG launches Target 3 from the launch template. It boots, passes health checks, and registers with the ALB." },
        { node: "alb", paths: ["alb-t1", "alb-t2", "alb-t3"], text: "Load now spreads across 3 targets — CPU drops back to ~50%. When traffic falls, the ASG scales back in to save money. 📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Load Balance?" },
  { id: "elb-family", label: "ALB vs NLB vs GWLB ⭐" },
  { id: "alb", label: "ALB — Smart HTTP Routing" },
  { id: "target-health", label: "Target Groups & Health Checks ⭐" },
  { id: "asg", label: "Auto Scaling Groups ⭐" },
  { id: "scaling-policies", label: "Dynamic · Predictive · Scheduled" },
  { id: "together", label: "ELB + ASG Together ⭐" },
  { id: "gotchas", label: "Real-World Gotchas" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsLoadBalancingPage() {
  return (
    <TopicShell
      icon="⚖️"
      title="Load Balancing & Auto Scaling"
      gradientWord="Elasticity"
      subtitle="The pattern behind every serious web app: a load balancer spreading traffic across an auto-scaling fleet in multiple AZs. ALB vs NLB decided with a flowchart, health checks drawn, and scaling policies reacting to a real traffic day."
      nav={NAV}
      badges={["⚖️ Traffic flow drawn", "📈 Scaling timelines", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "📊", label: "CloudWatch & CloudTrail", href: "/aws/monitoring" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Load Balance At All?">
        <CodeBlock
          title="single_server_problems.txt"
          runnable={false}
          code={`one server:                        load-balanced fleet:

 👥👥👥 users                        👥👥👥 users
     │                                  │
     ▼                            ┌─────▼─────┐
 ┌────────┐                       │    ELB    │ one stable DNS name
 │ 🖥️ EC2 │ ← crashes? DOWN 💀    └─┬───┬───┬─┘
 └────────┘ ← traffic x10? DOWN   ┌─▼─┐┌─▼─┐┌─▼─┐
            ← deploy? DOWNTIME    │🖥️ ││🖥️ ││🖥️ │  one dies? others
                                  └───┘└───┘└───┘  carry on ✅
                                  AZ-a  AZ-b AZ-a

 a load balancer gives you, in one box:
 1. 📈 scale OUT  — many machines behind one name
 2. 🛟 availability — route around dead instances + dead AZs
 3. 🔄 zero-downtime deploys — drain old, add new
 4. 🔐 one place for TLS certificates`}
        />
        <Callout type="analogy">
          🛂 The airport security boss who points you to the shortest open lane: lanes open and
          close (instances scale, fail), but travelers only ever deal with the one person
          directing traffic.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="elb-family" number="02" title="The ELB Family — ALB vs NLB vs GWLB ⭐">
        <CodeBlock
          title="elb_picker.txt"
          runnable={false}
          code={`"which load balancer?" — the flowchart:

 routing HTTP/HTTPS web traffic?
   └─ yes → 🅰️ ALB (Application LB) — layer 7
            understands URLs, headers, cookies → smart routing
 raw TCP/UDP, millions of req/s, static IP, ultra-low latency?
   └─ yes → 🅽 NLB (Network LB) — layer 4
            doesn't read HTTP, just forwards connections FAST
 deploying 3rd-party firewall/inspection appliances inline?
   └─ yes → 🅶 GWLB (Gateway LB) — layer 3
            transparently routes ALL traffic through appliance fleet
 (CLB = Classic LB: legacy, don't use for new builds)`}
        />
        <Table
          head={["", "ALB", "NLB", "GWLB"]}
          rows={[
            ["OSI layer", "7 (HTTP)", "4 (TCP/UDP)", "3 (IP)"],
            ["Sees", "URLs, headers, cookies", "IPs + ports only", "all packets"],
            ["Routing smarts", "path/host/header-based", "flow hashing", "to appliance fleet"],
            ["Static IP", "❌ (use NLB in front / ALIAS)", "✅ one per AZ + EIP", "—"],
            ["Latency", "ms", "~100µs", "—"],
            ["Typical use", "websites, APIs, microservices", "gaming, IoT, TCP services, NLB→ALB combos", "firewalls, IDS/IPS"],
          ]}
        />
        <Callout type="tip">
          Exam keywords: &quot;path-based routing / WebSockets / fixed-response&quot; →{" "}
          <strong>ALB</strong>. &quot;static IP / extreme performance / non-HTTP&quot; →{" "}
          <strong>NLB</strong>. &quot;inline security appliances&quot; → <strong>GWLB</strong>.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="alb" number="03" title="ALB — Smart HTTP Routing">
        <P>
          Because the ALB reads HTTP, one balancer can front your whole microservice zoo using{" "}
          <strong>listener rules</strong>:
        </P>
        <CodeBlock
          title="alb_rules.txt"
          runnable={false}
          code={`        🌐 https://acme.com (listener :443, one ACM cert)
                         │
        ┌────────────────┼────────────── ALB rules (top-down) ─┐
        │ IF path /api/* ──────────▶ target group: api-tg      │
        │ IF path /img/* ──────────▶ target group: static-tg   │
        │ IF host admin.acme.com ──▶ target group: admin-tg    │
        │ IF header X-Beta: true ──▶ target group: beta-tg     │
        │ DEFAULT ─────────────────▶ target group: web-tg      │
        └───────────────────────────────────────────────────────┘
            each target group = its own fleet + health check

 also built in:
 • HTTP→HTTPS redirect rules (no code)
 • fixed responses (maintenance page from the LB itself)
 • weighted target groups (90/10 canary at the LB layer)
 • authentication (OIDC/Cognito) BEFORE traffic hits your app`}
        />
        <Callout type="behind">
          The ALB terminates the client&apos;s connection and opens a new one to the target —
          so targets see the ALB&apos;s IP, not the user&apos;s. The real client IP arrives in
          the <IC>X-Forwarded-For</IC> header. Every web framework has a setting for this; now
          you know why.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="target-health" number="04" title="Target Groups & Health Checks ⭐">
        <CodeBlock
          title="health_checks.txt"
          runnable={false}
          code={`TARGET GROUP web-tg
 health check: GET /health every 30s, expect HTTP 200
 healthy after 2 ✅ in a row · unhealthy after 2 ❌ in a row

 ┌───────────┬──────────┬─────────────────────────────┐
 │ target    │ status   │ receiving traffic?          │
 ├───────────┼──────────┼─────────────────────────────┤
 │ 🖥️ i-aaa  │ 🟢 healthy │ ✅                          │
 │ 🖥️ i-bbb  │ 🟢 healthy │ ✅                          │
 │ 🖥️ i-ccc  │ 🔴 2× ❌   │ ⛔ pulled out automatically │
 │ 🖥️ i-ddd  │ 🟡 draining│ finishing existing requests │
 └───────────┴──────────┴─────────────────────────────┘
 targets can be: EC2 instances · IPs · Lambda · containers (ECS)

 a good /health endpoint:
 ❌ "return 200"                    (lies — app may be broken)
 ✅ check DB reachable, disk ok,    (truth — fail fast, get
    deps up → 200 else 503           pulled before users notice)`}
        />
        <Callout type="mistake">
          Health-checking <IC>/</IC> on an app whose homepage is cached or static = zombies that
          pass checks while every API call fails. Give the LB a real <IC>/health</IC> that
          exercises critical dependencies.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="asg" number="05" title="Auto Scaling Groups — The Self-Healing Fleet ⭐">
        <P>
          An <strong>Auto Scaling Group (ASG)</strong> maintains a fleet of identical instances:
          replaces the dead, adds under load, removes when idle.
        </P>
        <CodeBlock
          title="asg_anatomy.txt"
          runnable={false}
          code={`LAUNCH TEMPLATE (the recipe)          ASG (the fleet manager)
 ┌──────────────────────────┐          min: 2  desired: 3  max: 10
 │ AMI: golden-web-v42      │          subnets: private-a, private-b
 │ type: t3.medium          │   ───▶   target group: web-tg
 │ SG: APP-SG               │
 │ user data: self-config   │          ┌── the control loop ──────┐
 │ IAM role: s3-reader      │          │ count fleet every minute │
 └──────────────────────────┘          │ actual < desired? launch │
                                       │ actual > desired? kill   │
 remember EC2 topic? AMI +             │ instance failed health   │
 user data = instances born            │ check? replace it 🪄     │
 configured — REQUIRED here,           └──────────────────────────┘
 nobody SSHes into ASG clones!         spread across AZs evenly`}
        />
        <Table
          head={["Setting", "Meaning"]}
          rows={[
            [<IC key="m">min</IC>, "never fewer than this (your availability floor)"],
            [<IC key="d">desired</IC>, "current target — what policies adjust"],
            [<IC key="x">max</IC>, "never more (your cost ceiling)"],
            ["Health check type", "EC2 status — or ELB: 'failing the LB health check = replace'"],
            ["Termination policy", "which instance dies when scaling in (default: balance AZs, oldest template first)"],
          ]}
        />
        <Callout type="tip">
          Even with <strong>min = max = 2</strong> (no scaling!) an ASG is worth it: free
          self-healing across AZs. Many teams run every stateless service in an ASG purely for
          the auto-replacement.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="scaling-policies" number="06" title="Scaling Policies — Dynamic, Predictive, Scheduled">
        <CodeBlock
          title="a_day_of_scaling.txt"
          runnable={false}
          code={`a real traffic day, three policies cooperating:

 servers
 10│                       ⛅ predictive pre-warms
   │                      ╭────────╮ before the evening
  8│   scheduled:        ╭╯        ╰╮ peak (learned pattern)
   │   scale to 6       ╭╯          ╰╮
  6│   at 09:00 ╭───────╯            ╰───╮
   │           ╭╯  dynamic: CPU>70%       ╰╮
  4│          ╭╯   add 2 (spike! 📈)       ╰╮ scale-in slowly
   │          │                             ╰────╮ (cooldown)
  2├──────────╯                                  ╰──────── min=2
   └────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬────▶
       00:00 06:00 09:00 12:00 15:00 18:00 21:00 24:00`}
        />
        <Table
          head={["Policy type", "Trigger", "Best for"]}
          rows={[
            [<strong key="t">Target tracking ⭐</strong>, "\"keep avg CPU at 50%\" — AWS does the math", "the default — start here"],
            ["Step scaling", "alarm thresholds: CPU>70 → +2, CPU>90 → +4", "fine-grained control"],
            ["Scheduled", "cron: weekdays 09:00 → desired 6", "known rhythms (office hours, sales)"],
            ["Predictive", "ML forecasts from 2 weeks of history", "regular daily/weekly patterns — pre-warms"],
          ]}
        />
        <Callout type="behind">
          Scale OUT fast, scale IN slow: adding capacity fixes pain immediately, but removing it
          too eagerly causes flapping (launch → terminate → launch...). Cooldowns and
          conservative scale-in thresholds are deliberate asymmetry.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="together" number="07" title="ELB + ASG Together — The Standard Architecture ⭐">
        <CodeBlock
          title="the_full_loop.txt"
          runnable={false}
          code={`                       🌐 users (via Route 53)
                              │
                       ┌──────▼──────┐
                       │     ALB     │ public subnets, 2 AZs
                       └──────┬──────┘
                   registers/deregisters targets
                  ┌───────────┼────────────┐
                  ▼           ▼            ▼
              🖥️ i-aaa     🖥️ i-bbb     🖥️ i-ccc       private subnets
              └──────── ASG (min2 / des3 / max10) ────────┘
                              ▲
            CloudWatch: avg CPU 82% > target 50%
                              │
            ASG launches i-ddd from launch template
            → user data configures it
            → ALB health checks pass → IN SERVICE 🎉

 the virtuous cycle:
 traffic ↑ → metrics ↑ → ASG adds → ALB spreads → metrics normalize
 instance 💀 → health check fails → ALB stops routing → ASG replaces`}
        />
        <Callout type="note">
          This diagram + the VPC topic&apos;s network diagram are the same picture from two
          angles. ALB in public subnets, fleet in private, RDS Multi-AZ below — that&apos;s 80%
          of production AWS architectures you&apos;ll ever meet.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="gotchas" number="08" title="Real-World Gotchas">
        <Table
          head={["Gotcha", "What's happening", "Fix"]}
          rows={[
            ["sessions vanish when scaling", "user's next request hit a different instance (in-memory session)", "store sessions in ElastiCache/DynamoDB (stateless apps!) — sticky sessions are the crutch"],
            ["scale-out too slow for spikes", "instance boot + config takes minutes", "golden AMI (less user data work), predictive scaling, or over-provision min"],
            ["ALB 502/504 errors", "targets crashing or timing out", "check target app logs; align LB idle timeout with app keep-alive"],
            ["one AZ overloaded", "ASG/subnet config covers one AZ only", "ASG across ≥2 AZ subnets; cross-zone LB on"],
            ["deploy kills all instances at once", "new launch template + aggressive instance refresh", "rolling instance refresh with min healthy %"],
          ]}
        />
        <Callout type="tip">
          The deepest lesson of this topic: <strong>design stateless</strong>. Any instance must
          be killable at any moment — state lives in databases, caches and S3, never on the box.
          Statelessness is what MAKES auto scaling possible.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["ELB gives", "scale-out + AZ failover + zero-downtime deploys + TLS"],
            ["ALB", "layer 7 — routes on path/host/header; microservices"],
            ["NLB", "layer 4 — TCP/UDP, static IP, extreme speed"],
            ["GWLB", "layer 3 — inline security appliances"],
            ["Client IP at target", "X-Forwarded-For header (ALB proxies)"],
            ["Target group", "fleet + health check; targets: EC2/IP/Lambda/ECS"],
            ["Health check rule", "real /health endpoint checking dependencies"],
            ["ASG", "min/desired/max — self-healing fleet from a launch template"],
            ["ASG needs", "AMI + user data (clones must self-configure)"],
            ["Target tracking", "\"keep CPU at 50%\" — default scaling policy"],
            ["Scheduled/Predictive", "known rhythms / ML pre-warming"],
            ["Golden rule", "stateless apps — state in DB/cache/S3, never on instances"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
