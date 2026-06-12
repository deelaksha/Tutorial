"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "CloudWatch Incident Loop — Live",
  nodes: [
    { id: "app", icon: "🖥️", label: "App / EC2", sub: "emits everything", x: 8, y: 50, color: "#22d3ee" },
    { id: "metrics", icon: "📊", label: "CW Metrics", sub: "numbers over time", x: 34, y: 16, color: "#fb923c" },
    { id: "logs", icon: "📜", label: "CW Logs", sub: "text events", x: 34, y: 84, color: "#a78bfa" },
    { id: "alarm", icon: "🚨", label: "Alarm", sub: "CPU > 80% · 5 min", x: 60, y: 16, color: "#f87171" },
    { id: "sns", icon: "📣", label: "SNS", sub: "notify channel", x: 84, y: 16, color: "#fbbf24" },
    { id: "eng", icon: "👨‍🔧", label: "Engineer", sub: "on-call · 3am", x: 84, y: 70, color: "#34d399" },
  ],
  edges: [
    { id: "app-metrics", from: "app", to: "metrics", color: "#fb923c" },
    { id: "app-logs", from: "app", to: "logs", color: "#a78bfa" },
    { id: "metrics-alarm", from: "metrics", to: "alarm", color: "#f87171" },
    { id: "alarm-sns", from: "alarm", to: "sns", color: "#fbbf24" },
    { id: "sns-eng", from: "sns", to: "eng", color: "#34d399" },
    { id: "eng-logs", from: "eng", to: "logs", bend: 25, dashed: true, color: "#a78bfa" },
  ],
  flows: [
    {
      id: "incident",
      name: "🚨 Incident fires",
      command: "CPUUtilization = 94% (datapoint)",
      steps: [
        { node: "app", paths: ["app-metrics"], text: "The instance pushes CPUUtilization datapoints to CloudWatch every minute (or every second with detailed monitoring)." },
        { node: "alarm", paths: ["metrics-alarm"], text: "The alarm watches: CPU > 80% for 5 consecutive minutes → state flips OK → ALARM. No flapping on brief spikes." },
        { node: "eng", paths: ["alarm-sns", "sns-eng"], text: "ALARM publishes to SNS → email/Slack/PagerDuty. The on-call engineer's phone buzzes at 3am. 🚨" },
      ],
    },
    {
      id: "debug",
      name: "🔍 Debug with Logs",
      command: "fields @timestamp, @message | filter @message like /ERROR/",
      steps: [
        { node: "app", paths: ["app-logs"], text: "All along, the app has been streaming structured logs to CloudWatch Logs via the agent." },
        { node: "eng", paths: ["eng-logs"], text: "The engineer runs a Logs Insights query — filtering millions of lines down to the ERROR entries from the last 15 minutes." },
        { node: "logs", paths: ["eng-logs"], text: "Found it: an infinite retry loop hammering the DB. Root cause in minutes because logs + metrics live in one place. 🔍" },
      ],
    },
    {
      id: "autoheal",
      name: "🤖 Auto-action",
      command: "alarm action: asg:scale-out / ec2:reboot",
      steps: [
        { node: "alarm", paths: ["metrics-alarm"], text: "Alarms don't just notify — they can ACT. This one is wired to an Auto Scaling policy as its action." },
        { node: "app", paths: ["alarm-sns"], text: "The ASG adds an instance (or the EC2 action reboots a frozen box). Mitigation happens before any human is awake." },
        { node: "eng", paths: ["sns-eng"], text: "The engineer still gets the notification — but reads it over coffee instead of fixing it in pajamas. 🤖" },
      ],
    },
  ],
};

const NAV = [
  { id: "observability", label: "The Observability Loop" },
  { id: "metrics", label: "CloudWatch Metrics ⭐" },
  { id: "alarms", label: "Alarms — Metrics That Act ⭐" },
  { id: "logs", label: "CloudWatch Logs" },
  { id: "dashboards-events", label: "Dashboards & EventBridge" },
  { id: "cloudtrail", label: "CloudTrail — WHO Did WHAT ⭐" },
  { id: "config", label: "AWS Config — WHAT Changed" },
  { id: "xray", label: "X-Ray — Tracing Requests" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsMonitoringPage() {
  return (
    <TopicShell
      icon="📊"
      title="Monitoring & Logging"
      gradientWord="CloudWatch"
      subtitle="You can't fix what you can't see. CloudWatch metrics, logs, alarms and dashboards drawn as one feedback loop — then the audit twins: CloudTrail (who did what) and Config (what changed), and X-Ray tracing a request across services."
      nav={NAV}
      badges={["📈 Feedback loops drawn", "🕵️ Audit trails", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🔰", label: "Security Services", href: "/aws/security-services" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="observability" number="01" title="The Observability Loop">
        <CodeBlock
          title="observability_map.txt"
          runnable={false}
          code={`the questions and their tools:

 "is it healthy? how loaded?"   → 📈 CloudWatch METRICS  (numbers)
 "what did my app print?"       → 📜 CloudWatch LOGS     (text)
 "tell me when it breaks!"      → 🔔 CloudWatch ALARMS   (thresholds)
 "show me everything at once"   → 🖥️ DASHBOARDS          (graphs)
 "react to events as they fly"  → 🎯 EVENTBRIDGE         (rules)
 "WHO deleted that bucket?!"    → 🕵️ CLOUDTRAIL          (API audit)
 "is anything misconfigured?"   → 📋 AWS CONFIG          (state audit)
 "WHERE are requests slow?"     → 🔍 X-RAY               (tracing)

 the loop that runs production:
 measure → alarm → act (notify/auto-scale/auto-heal) → measure...`}
        />
        <Callout type="analogy">
          🚗 A car: metrics = speedometer &amp; fuel gauge, logs = the engine&apos;s diagnostic
          stream, alarms = warning lights, dashboard = well, the dashboard. CloudTrail is the
          trip recorder that proves who drove. You wouldn&apos;t drive blind; don&apos;t run
          servers blind.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="metrics" number="02" title="CloudWatch Metrics — The Numbers ⭐">
        <P>
          A <strong>metric</strong> is a time-ordered series of numbers. Nearly every AWS service
          emits them automatically:
        </P>
        <CodeBlock
          title="metric_anatomy.txt"
          runnable={false}
          code={`a metric data point:
 namespace   AWS/EC2                 (which service)
 metric      CPUUtilization          (what's measured)
 dimensions  InstanceId=i-0abc123    (which resource exactly)
 timestamp   2026-06-12T10:31:00Z
 value       73.2 (%)

 CPUUtilization for i-0abc123, last hour:
 100│
    │                                    ╭──╮ ← alarm threshold 80%
  80│┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╭──╯┄┄╰──╮┄┄┄┄┄┄┄┄┄
  60│                      ╭─────╮   ╭╯        ╰╮
  40│        ╭────╮      ╭─╯     ╰───╯          ╰────
  20│────────╯    ╰──────╯
    └──────────────────────────────────────────────────▶ time`}
        />
        <Table
          head={["Free out of the box", "Needs the CloudWatch AGENT"]}
          rows={[
            ["EC2: CPU, network, disk I/O", "EC2: MEMORY % and DISK SPACE % (hypervisor can't see inside the OS!)"],
            ["ALB: request count, 4xx/5xx, latency", "application custom metrics (orders/min, queue depth)"],
            ["RDS: connections, IOPS, free storage", "OS-level processes, detailed disk"],
            ["Lambda: invocations, errors, duration", "—"],
          ]}
        />
        <Callout type="mistake">
          The classic surprise: <strong>EC2 memory usage is NOT a default metric</strong>. The
          hypervisor sees CPU and network from outside, but RAM contents are invisible — install
          the CloudWatch agent to push it. Interview favorite.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="alarms" number="03" title="Alarms — Metrics That Act ⭐">
        <CodeBlock
          title="alarm_lifecycle.txt"
          runnable={false}
          code={`ALARM: "high-cpu"
 watch  CPUUtilization (avg over 5 min)
 rule   > 80% for 2 consecutive periods    ← "for N periods" stops
 then   → SNS topic (email/slack/pagerduty)  one blip from paging you
        → and/or Auto Scaling action
        → and/or EC2 action (reboot/recover)

 states:  OK ──────▶ ALARM ──────▶ OK
              ▲
              └── INSUFFICIENT_DATA (metric missing — also tells
                                     you something is wrong!)

 timeline:
 cpu:   45  52  85  88  91  62  48
              └──┬──┘
        2 periods >80 → 🔔 ALARM → SNS → 📟 on-call paged
                                 → ASG adds 2 instances
                                       cpu falls → ✅ OK`}
        />
        <Table
          head={["Alarm action", "Use"]}
          rows={[
            ["SNS notification", "page/email/Slack the humans"],
            ["Auto Scaling", "the scaling policies from the previous topic ARE alarms"],
            ["EC2 recover", "hardware issue? migrate instance to healthy host automatically"],
            ["Composite alarms", "ALARM only if (high-errors AND high-latency) — kills alert noise"],
            ["Billing alarm", "the $5 spend alarm from the IAM topic — it's this!"],
          ]}
        />
        <Callout type="tip">
          Alert on <strong>symptoms users feel</strong> (5xx rate, p99 latency), not every cause
          (CPU). A noisy pager teaches on-call to ignore it — the real incident then scrolls by
          unnoticed.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="logs" number="04" title="CloudWatch Logs — The Text">
        <CodeBlock
          title="logs_hierarchy.txt"
          runnable={false}
          code={`LOG GROUP  /my-app/prod          (the application)
 ├─ LOG STREAM  i-0abc123        (one source: instance/container)
 │    2026-06-12 10:31:01 INFO  order 1042 created
 │    2026-06-12 10:31:02 ERROR payment timeout user=88
 ├─ LOG STREAM  i-0def456
 └─ retention: 30 days           ← SET THIS. default = forever = 💸

 who writes here?
 Lambda: automatically · ECS: log driver · EC2: CloudWatch agent
 + VPC Flow Logs, Route 53 query logs, API Gateway access logs...

 LOGS INSIGHTS — SQL-ish queries over your logs:
 fields @timestamp, @message
 | filter @message like /ERROR/
 | stats count() by bin(5m)        ← errors per 5 minutes 📊

 METRIC FILTER — logs become metrics:
 pattern "ERROR" → metric app/ErrorCount → alarm > 10/min → page 🔔
 (the full loop: log line → metric → alarm → human)`}
        />
        <Callout type="mistake">
          Two money leaks: log groups default to <strong>never-expire retention</strong>, and
          DEBUG-level logging in production can cost more than the compute. Set retention on
          every group; ship archives to S3 if compliance needs them.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="dashboards-events" number="05" title="Dashboards & CloudWatch Events (EventBridge)">
        <CodeBlock
          title="dashboard.txt"
          runnable={false}
          code={`DASHBOARD "prod-overview" — one glance, whole system:
 ┌────────────────┬────────────────┬────────────────┐
 │ ALB requests/s │ target 5xx %   │ p99 latency    │
 │   ▁▂▄▆█▆▄▂     │ 0.02% ✅       │ 240ms ▂▃▂▂▄    │
 ├────────────────┼────────────────┼────────────────┤
 │ ASG instances  │ RDS CPU        │ DynamoDB       │
 │ 4 ▂▂▄▄▄        │ 38% ▃▃▄▃▃      │ throttles: 0 ✅ │
 └────────────────┴────────────────┴────────────────┘
 tip: the dashboard you check BEFORE deploys and DURING incidents`}
        />
        <CodeBlock
          title="events.txt"
          runnable={false}
          code={`EVENTS — react to things happening, not numbers crossing lines:

 "EC2 instance state-change: terminated"
        │ EventBridge rule matches
        ▼
   → λ Lambda: deregister from inventory
   → 📨 SNS: tell the team channel
   → cron too! "rate(1 day)" → λ nightly cleanup

 (CloudWatch Events grew into EVENTBRIDGE — same engine;
  full event-driven patterns in the Messaging topic)`}
        />
        <Callout type="note">
          Metrics answer &quot;how much?&quot;; events answer &quot;what just happened?&quot;.
          Alarms watch trends; EventBridge rules fire on discrete state changes.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="cloudtrail" number="06" title="CloudTrail — WHO Did WHAT, WHEN ⭐">
        <P>
          <strong>CloudTrail</strong> records (almost) every API call in your account — console
          clicks, CLI commands, SDK calls, and AWS services acting on your behalf:
        </P>
        <CodeBlock
          title="cloudtrail_event.txt"
          runnable={false}
          code={`"someone deleted the prod bucket!" — CloudTrail answers:

 {
   "eventTime":    "2026-06-12T03:14:07Z",
   "eventName":    "DeleteBucket",            ← WHAT
   "userIdentity": { "userName": "bob" },     ← WHO
   "sourceIPAddress": "203.0.113.99",         ← FROM WHERE
   "userAgent":    "aws-cli/2.15",            ← HOW
   "requestParameters": { "bucketName": "prod-data" }
 }

 defaults: 90 days of management events in Event History (free)
 production: create a TRAIL → deliver ALL events to S3 forever
   + log file integrity validation (tamper-evident)
   + multi-region + org-wide trails`}
        />
        <Table
          head={["", "CloudWatch", "CloudTrail"]}
          rows={[
            ["Records", "performance (metrics/logs)", "API activity (audit)"],
            ["Question", "\"is it healthy?\"", "\"who did that?\""],
            ["Example", "CPU 85%", "bob ran TerminateInstances"],
            ["Used by", "ops, on-call", "security, compliance, forensics"],
          ]}
        />
        <Callout type="tip">
          The exam separator: monitoring vs <strong>auditing</strong>. Any question containing
          &quot;who made this API call / change&quot; → CloudTrail. &quot;Resource
          performance&quot; → CloudWatch.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="config" number="07" title="AWS Config — WHAT Changed, and Is It Compliant?">
        <CodeBlock
          title="config.txt"
          runnable={false}
          code={`CONFIG records resource STATE over time + checks rules:

 timeline of security group sg-0abc:
 Jan 10  created — ports: 443
 Mar 02  changed — ports: 443, 22 ← who? (links to CloudTrail!)
 Jun 12  changed — ports: 443    ← fixed

 CONFIG RULES — continuous compliance checks:
 ┌──────────────────────────────────────┬───────────────┐
 │ restricted-ssh (no 22 from 0.0.0.0/0)│ ❌ NON-COMPLIANT│
 │ s3-bucket-public-read-prohibited     │ ✅ COMPLIANT   │
 │ encrypted-volumes                    │ ✅ COMPLIANT   │
 └──────────────────────────────────────┴───────────────┘
        └─ + REMEDIATION: auto-fix via SSM (close the port!)

 the audit trio:
 CloudTrail = WHO acted · Config = WHAT state changed/violates
 CloudWatch = HOW it performs`}
        />
        <Callout type="note">
          Config is the &quot;time machine for configuration&quot;: pick any resource, scrub
          back to what it looked like on any date — gold for incident reviews
          (&quot;was the bucket public when the leak happened?&quot;).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="xray" number="08" title="X-Ray — Tracing One Request Across Services">
        <P>
          Microservices problem: a user&apos;s request touches 6 services — which one is slow?{" "}
          <strong>X-Ray</strong> follows individual requests end-to-end:
        </P>
        <CodeBlock
          title="xray_trace.txt"
          runnable={false}
          code={`trace id: 1-67ab3f... — "POST /checkout" total: 1,840ms 🐌

 API Gateway ▓ 12ms
   └ Lambda: checkout ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 1,800ms
       ├ DynamoDB: get cart        ▓ 8ms
       ├ payments-svc (HTTP)       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 1,650ms ← 💥 HERE
       │   └ external card API     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 1,610ms
       └ SNS: publish receipt      ▓ 14ms

 service map (auto-generated):
 [API GW]→[λ checkout]→[payments] ⚠️ p99=1.7s
                      ↘[DynamoDB] ✅    ↘[card API] 🔴

 verdict in seconds: not your code — the card provider is slow.
 (without tracing: an evening of grepping 6 services' logs)`}
        />
        <Callout type="behind">
          Services pass a <strong>trace ID header</strong> (<IC>X-Amzn-Trace-Id</IC>) along the
          chain; each hop reports its segment timing to X-Ray, which stitches the waterfall.
          Lambda/API Gateway support it with a checkbox; apps use the SDK or ADOT
          (OpenTelemetry).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["CloudWatch", "metrics + logs + alarms + dashboards — performance"],
            ["Metric", "namespace/name/dimensions → time-series numbers"],
            ["EC2 memory %", "NOT default — needs CloudWatch agent"],
            ["Alarm", "threshold for N periods → SNS / scaling / EC2 action"],
            ["Alert on", "symptoms (5xx, p99) not causes (CPU)"],
            ["Logs", "group → streams; SET RETENTION; Insights to query"],
            ["Metric filter", "log pattern → metric → alarm → page"],
            ["CloudTrail", "WHO did WHAT — every API call, audit/forensics"],
            ["Config", "WHAT changed + compliance rules + auto-remediation"],
            ["Trio", "CloudWatch=performance · CloudTrail=who · Config=state"],
            ["X-Ray", "per-request waterfall across services — find the slow hop"],
            ["EventBridge", "react to events (state changes), not thresholds"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
