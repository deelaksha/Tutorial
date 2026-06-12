"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "SNS Fan-Out + SQS — Live",
  nodes: [
    { id: "order", icon: "🛒", label: "Order Service", sub: "publishes once", x: 8, y: 50, color: "#22d3ee" },
    { id: "sns", icon: "📣", label: "SNS Topic", sub: "order-placed", x: 32, y: 50, color: "#fb923c" },
    { id: "q1", icon: "📬", label: "Email Queue", sub: "SQS", x: 60, y: 14, color: "#a78bfa" },
    { id: "q2", icon: "📬", label: "Invoice Queue", sub: "SQS", x: 60, y: 50, color: "#34d399" },
    { id: "q3", icon: "📬", label: "Analytics Queue", sub: "SQS", x: 60, y: 86, color: "#fbbf24" },
    { id: "worker", icon: "👷", label: "Workers", sub: "poll & process", x: 88, y: 32, color: "#f472b6" },
    { id: "dlq", icon: "☠️", label: "DLQ", sub: "after 3 failures", x: 88, y: 80, color: "#f87171" },
  ],
  edges: [
    { id: "order-sns", from: "order", to: "sns", color: "#22d3ee" },
    { id: "sns-q1", from: "sns", to: "q1", color: "#a78bfa" },
    { id: "sns-q2", from: "sns", to: "q2", color: "#34d399" },
    { id: "sns-q3", from: "sns", to: "q3", color: "#fbbf24" },
    { id: "q1-worker", from: "q1", to: "worker", dashed: true, color: "#f472b6" },
    { id: "q2-worker", from: "q2", to: "worker", dashed: true, color: "#f472b6" },
    { id: "q2-dlq", from: "q2", to: "dlq", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "fanout",
      name: "📣 Fan-out",
      command: 'sns.publish(topic, {"orderId": 8841})',
      steps: [
        { node: "order", paths: ["order-sns"], text: "Order Service publishes ONE message: \"order 8841 placed\". It doesn't know or care who listens." },
        { node: "sns", paths: ["sns-q1", "sns-q2", "sns-q3"], text: "SNS instantly copies it to EVERY subscribed queue — email, invoicing, analytics — in parallel." },
        { node: "worker", paths: ["q1-worker", "q2-worker"], text: "Each team's workers consume their own queue at their own pace. Add a 4th subscriber tomorrow? Zero changes to Order Service. 📣" },
      ],
    },
    {
      id: "buffer",
      name: "🛡️ Consumer down",
      command: "invoice-worker: CrashLoopBackOff (30 min)",
      steps: [
        { node: "worker", paths: ["q2-worker"], text: "💥 The invoice worker crashes during a deploy gone wrong. Nobody is processing invoices." },
        { node: "q2", paths: ["sns-q2"], text: "No orders are lost — messages simply PILE UP safely in the queue (retention: up to 14 days)." },
        { node: "worker", paths: ["q2-worker"], text: "30 minutes later the fix ships. The worker drains the backlog and the system catches up as if nothing happened. 🛡️" },
      ],
    },
    {
      id: "poison",
      name: "☠️ Poison message",
      command: "maxReceiveCount: 3 → DLQ",
      steps: [
        { node: "q2", paths: ["q2-worker"], text: "One message has corrupt JSON. The worker reads it, throws, and the message returns to the queue after the visibility timeout." },
        { node: "worker", paths: ["q2-worker"], text: "Attempt 2 fails. Attempt 3 fails. Without protection this poison message would loop forever, blocking real work." },
        { node: "dlq", paths: ["q2-dlq"], text: "After 3 receives, SQS moves it to the Dead Letter Queue. An alarm fires; engineers inspect it without any pipeline blockage. ☠️" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-decouple", label: "Why Decouple? ⭐" },
  { id: "queue-vs-pubsub", label: "Queue vs Pub/Sub ⭐" },
  { id: "sqs", label: "SQS — Queues Deep Dive ⭐" },
  { id: "sqs-fifo", label: "Standard vs FIFO & DLQs" },
  { id: "sns", label: "SNS — Pub/Sub & Fan-Out ⭐" },
  { id: "eventbridge", label: "EventBridge — The Event Bus" },
  { id: "kinesis-vs", label: "…and Streams? Kinesis vs SQS" },
  { id: "mq", label: "Amazon MQ — Legacy Brokers" },
  { id: "patterns", label: "Patterns You'll Actually Use" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsMessagingPage() {
  return (
    <TopicShell
      icon="📨"
      title="Messaging & Integration"
      gradientWord="Messaging"
      subtitle="The glue of modern architectures: SQS queues absorb spikes, SNS fans one event out to many listeners, EventBridge routes events by rules. Learn queue vs pub/sub once and every microservice diagram suddenly reads itself."
      nav={NAV}
      badges={["📨 Queues drawn", "📡 Fan-out patterns", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "📊", label: "Data Engineering & Analytics", href: "/aws/analytics" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-decouple" number="01" title="Why Decouple? — The Problem ⭐">
        <P>
          When service A calls service B <em>directly</em> (synchronously), A inherits all of
          B&apos;s problems:
        </P>
        <CodeBlock
          title="tight_vs_loose_coupling.txt"
          runnable={false}
          code={`TIGHT (direct call)                LOOSE (message in between)

 🛒 Order ──HTTP──▶ 📧 Email        🛒 Order ──▶ [📨 queue] ──▶ 📧 Email
                                     │ "queued ✅"
 Email service down?                 │ returns in 5ms
  → order FAILS ❌                   ▼
 Email slow (3s)?                   Email down? messages WAIT,
  → order takes 3s ❌                processed when it's back ✅
 Black Friday burst?                Burst of 50,000 orders?
  → Email crushed ❌                 queue absorbs, Email drains
                                     at its own pace ✅

decoupling = sender and receiver no longer need to be
alive, fast, or scaled the same — the message survives.`}
        />
        <Callout type="analogy">
          📮 Synchronous = a phone call: both people must be free at the same moment.
          Asynchronous = a letterbox: drop the letter and walk away; the receiver reads it when
          they can. Queues are letterboxes between your services.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="queue-vs-pubsub" number="02" title="Queue vs Pub/Sub — The Two Shapes ⭐">
        <P>
          Every messaging service on Earth is one of two shapes. Get this distinction and
          SQS/SNS stop being interchangeable acronyms:
        </P>
        <CodeBlock
          title="two_shapes.txt"
          runnable={false}
          code={`QUEUE (SQS) — 1 message → 1 consumer        "work to be DONE once"

 producer ──▶ [ 📨 🗂️ 📨 📨 ] ──▶ worker pool
              each message is taken,         🏃 🏃 🏃
              processed, DELETED by          (competing consumers —
              exactly ONE worker             more workers = faster drain)

PUB/SUB (SNS) — 1 message → ALL subscribers  "news to be HEARD by all"

                       ┌──▶ 📧 email service
 publisher ──▶ 📡 topic ├──▶ 📦 inventory service
 "OrderPlaced"         ├──▶ 📊 analytics service
                       └──▶ 📱 SMS to customer
              every subscriber gets its OWN copy`}
        />
        <Table
          head={["", "Queue (SQS)", "Pub/Sub (SNS)"]}
          rows={[
            ["Message goes to", "exactly one consumer", "every subscriber"],
            ["Mental model", "to-do list", "announcement / broadcast"],
            ["If consumer is down", "messages wait (up to 14 days)", "SNS retries, then drops (unless → SQS)"],
            ["Use for", "jobs: resize image, send email, charge card", "events: order placed — many teams care"],
          ]}
        />
      </Section>

      {/* 03 */}
      <Section id="sqs" number="03" title="SQS — Queues Deep Dive ⭐">
        <P>
          <strong>SQS (Simple Queue Service)</strong> is the oldest AWS service (2004!) —
          fully managed, scales to any throughput. The message lifecycle is where the
          interview questions live:
        </P>
        <CodeBlock
          title="message_lifecycle.txt"
          runnable={false}
          code={`1. producer: SendMessage ────────▶ [queue]
2. worker:   ReceiveMessage ◀──── message delivered BUT NOT DELETED
                │
                │  ⏱️ VISIBILITY TIMEOUT starts (default 30s)
                │  message becomes INVISIBLE to other workers
                ▼
3a. worker finishes → DeleteMessage ✅ gone forever
3b. worker CRASHES → timeout expires → message VISIBLE again
                     → another worker picks it up 🔁 (nothing lost!)

⚠️ consequence: a message can be delivered MORE THAN ONCE
   (crash after work, before delete) → consumers must be
   IDEMPOTENT — processing twice must be harmless
   (e.g. "set status=paid" ✅  vs  "balance += 10" ❌)`}
        />
        <CodeBlock
          title="sqs_knobs.txt"
          runnable={false}
          code={`visibility timeout   30s default → set to ~6× your processing time
retention            how long unconsumed messages live (default 4 days, max 14)
long polling ⭐      WaitTimeSeconds=20 → wait for messages instead of
                     hammering empty ReceiveMessage calls (cheaper, faster)
message size         max 256KB → bigger? put file in S3, send the key
delay queue          hide new messages for up to 15 min`}
        />
        <Callout type="mistake">
          ⚠️ Visibility timeout shorter than processing time = the classic bug: worker A is
          still processing when the message reappears, worker B processes it too →{" "}
          <em>everything runs twice</em>. Size the timeout generously and make handlers
          idempotent anyway.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="sqs-fifo" number="04" title="Standard vs FIFO & Dead-Letter Queues">
        <CodeBlock
          title="standard_vs_fifo.txt"
          runnable={false}
          code={`STANDARD queue                     FIFO queue (name ends .fifo)
──────────────                     ──────────
throughput: unlimited 🚀           300 msg/s (3,000 batched)
order: BEST EFFORT (may shuffle)   STRICT order per MessageGroupId
delivery: at-least-once            EXACTLY-once (5-min dedup window)
          (duplicates possible)

  in: 1 2 3 4                        in: 1 2 3 4
 out: 1 3 2 4 4  😅                 out: 1 2 3 4  ✅

use: 95% of jobs (emails,          use: order matters per entity —
     thumbnails, notifications)         bank txns, inventory updates
                                        (group by accountId → parallel
                                         groups, ordered within each)`}
        />
        <P>
          And the safety net every queue needs — the <strong>Dead-Letter Queue</strong>:
        </P>
        <CodeBlock
          title="dlq_flow.txt"
          runnable={false}
          code={`[main queue] ──▶ worker tries message
     ▲               │ ❌ fails (bad data? bug?)
     └── back in ────┘
     ... fails again ... receive count hits maxReceiveCount (e.g. 3)
     │
     ▼
[☠️ dead-letter queue]  ← poison message PARKED here
     │
     ├─ CloudWatch alarm: "DLQ depth > 0" → page the team 🚨
     └─ engineer inspects, fixes bug, REDRIVES messages back

without a DLQ: one malformed message loops forever,
blocking real work and burning compute 🔥`}
        />
        <Callout type="tip">
          💡 Rule of thumb: every production queue gets a DLQ + alarm on day one. A DLQ message
          is a bug report that wrote itself.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="sns" number="05" title="SNS — Pub/Sub & the Fan-Out Pattern ⭐">
        <P>
          <strong>SNS (Simple Notification Service)</strong>: publishers send to a{" "}
          <strong>topic</strong>; the topic pushes copies to every subscriber — Lambda, SQS,
          HTTP endpoints, email, SMS, mobile push.
        </P>
        <CodeBlock
          title="fanout_pattern.txt"
          runnable={false}
          code={`THE pattern to remember: SNS → SQS FAN-OUT ⭐

                      ┌─▶ [SQS: email-queue]     ─▶ 📧 email workers
 🛒 OrderService      │
   publish            ├─▶ [SQS: invoice-queue]   ─▶ 🧾 invoice workers
 "OrderPlaced" ─▶ 📡 ─┤
      topic           ├─▶ [SQS: analytics-queue] ─▶ 📊 analytics
                      │
                      └─▶ ⚡ Lambda (fraud check, direct)

why queues behind the topic instead of direct push?
 ✅ subscriber down → ITS queue buffers (durability)
 ✅ each consumer drains at its own pace
 ✅ each queue gets its own DLQ + retry policy
 ✅ new team wants the event? add a queue — producer untouched

+ message FILTERING: subscription receives only matching messages
  invoice-queue policy: {"order_total": [{"numeric": [">", 100]}]}`}
        />
        <Callout type="analogy">
          📰 SNS is a newspaper publisher; subscriptions are home deliveries. The journalist
          (producer) writes once and has no idea — or care — how many homes get a copy. Adding
          subscriber #47 changes nothing for the writer.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="eventbridge" number="06" title="EventBridge — The Event Bus">
        <P>
          <strong>EventBridge</strong> is SNS&apos;s smarter sibling: a <strong>bus</strong>{" "}
          where <em>rules</em> match events by their content and route them to 20+ target
          types. AWS services already publish here automatically.
        </P>
        <CodeBlock
          title="eventbridge_flow.txt"
          runnable={false}
          code={`SOURCES                  BUS + RULES                    TARGETS
 ☁️ AWS services  ──▶  ┌────────────────────┐
 (EC2 state change,    │  rule 1:           │ ──▶ ⚡ Lambda
  S3 upload, Code-     │  source=orders &&  │ ──▶ 📨 SQS
  Pipeline failed...)  │  detail.total>100  │ ──▶ 🪜 Step Functions
                       ├────────────────────┤ ──▶ 📡 SNS
 🧩 your apps ────▶    │  rule 2:           │ ──▶ 🔁 another bus
 PutEvents             │  detail-type=      │     (cross-account!)
                       │  "PaymentFailed"   │
 🌐 SaaS partners ──▶  └────────────────────┘
 (Stripe, Datadog…)
                       + ⏰ Scheduler: "cron(0 9 * * MON *)" → target
                       + 📼 archive & REPLAY past events
                       + 📋 schema registry`}
        />
        <CodeBlock
          title="rule_pattern.json"
          runnable={false}
          code={`// a rule is a JSON pattern matched against each event:
{
  "source": ["myapp.orders"],
  "detail-type": ["OrderPlaced"],
  "detail": {
    "total":   [{ "numeric": [">", 100] }],
    "country": ["IN", "US"]
  }
}
// matches → event routed to the rule's targets. no code, just config.`}
        />
        <Table
          head={["", "SNS", "EventBridge"]}
          rows={[
            ["Model", "topic → subscribers", "bus → rules → targets"],
            ["Filtering", "per-subscription policy", "rich content rules (the core feature)"],
            ["AWS events built-in", "no", "✅ yes — whole platform publishes here"],
            ["Throughput/latency", "higher / lower", "lower / higher (~0.5s)"],
            ["Extras", "SMS, email, mobile push", "scheduler, archive+replay, SaaS, cross-account"],
            ["Pick", "raw fan-out at scale, human-facing notifications", "⭐ event-driven app plumbing"],
          ]}
        />
        <Callout type="note">
          📝 Modern default: app events → EventBridge (routing brain), with SQS queues as
          targets (buffering muscle), SNS when you need fan-out scale or SMS/email/push.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="kinesis-vs" number="07" title="…and Streams? Kinesis vs SQS in 60 Seconds">
        <P>
          People lump <strong>Kinesis</strong> in with messaging. It is a different animal — a
          replayable <em>stream</em>, not a destructive queue:
        </P>
        <CodeBlock
          title="queue_vs_stream.txt"
          runnable={false}
          code={`SQS (queue)                        Kinesis (stream)
read message → DELETE it           read records → they STAY (1-365 days)
1 consumer per message             MANY apps read the SAME stream,
                                   each keeping its own position 🔖
                                   rewind & REPLAY history ⏪

 [📨📨📨] → gone when done          |0|1|2|3|4|5|6|7|8|9| ...
                                      ▲analytics    ▲fraud-detector
                                      (at offset 2)  (at offset 7)

use: jobs & decoupling             use: clickstreams, logs, IoT telemetry,
                                        real-time analytics
→ full story in the Analytics topic 📊`}
        />
      </Section>

      {/* 08 */}
      <Section id="mq" number="08" title="Amazon MQ — For Legacy Brokers">
        <P>
          <strong>Amazon MQ</strong> = managed <strong>ActiveMQ / RabbitMQ</strong>. It exists
          for one reason: migrating apps that already speak broker protocols (AMQP, MQTT,
          STOMP, JMS) without rewriting them.
        </P>
        <CodeBlock
          title="mq_decision.txt"
          runnable={false}
          code={`"we have an on-prem app using RabbitMQ/ActiveMQ"
 │
 ├─ rewrite is off the table this quarter
 │   → Amazon MQ: same protocols, AWS runs the broker ✅
 │     (note: broker = instances → capacity limits, maintenance windows)
 │
 └─ building NEW on AWS?
     → SQS/SNS/EventBridge — serverless, infinite scale, cheaper 💰
       MQ is a bridge for the past, not a choice for the future`}
        />
      </Section>

      {/* 09 */}
      <Section id="patterns" number="09" title="Patterns You'll Actually Use">
        <CodeBlock
          title="greatest_hits.txt"
          runnable={false}
          code={`1️⃣ WORK QUEUE — absorb spikes, scale workers
   API ─▶ [SQS] ─▶ Lambda/ECS workers (autoscale on queue depth!)
   metric: ApproximateNumberOfMessagesVisible → scaling policy

2️⃣ FAN-OUT — one event, many independent reactions
   producer ─▶ SNS/EventBridge ─▶ [SQS][SQS][SQS] ─▶ consumers

3️⃣ DLQ EVERYWHERE — poison messages parked, alarmed, redriven

4️⃣ BUFFERED WRITES — protect the database
   burst of 10k writes ─▶ [SQS] ─▶ worker writes at DB-friendly pace

5️⃣ SAGA / CHOREOGRAPHY — microservices react to each other's events
   Order ─"OrderPlaced"─▶ bus ─▶ Payment ─"PaymentDone"─▶ bus ─▶ Shipping
   (no service calls another directly — they only emit & listen)

the meta-rule: any arrow between two services in your diagram
is a place a queue could make the system calmer 🧘`}
        />
        <Callout type="tip">
          💡 Interview framing: &quot;I put SQS between the API and heavy work so the API stays
          fast, spikes get absorbed, failures retry automatically, and workers scale on queue
          depth — with a DLQ so bad messages never block good ones.&quot; That sentence covers
          five concepts.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Decoupling", "message survives even if receiver is down/slow"],
            ["Queue vs pub/sub", "SQS: 1 msg → 1 worker · SNS: 1 msg → ALL subscribers"],
            ["Visibility timeout", "invisible while processed; crash → reappears (no loss)"],
            ["At-least-once", "duplicates possible → consumers must be IDEMPOTENT"],
            ["Standard vs FIFO", "unlimited+unordered vs ordered+exactly-once (300/s)"],
            ["DLQ", "after N failures park message + alarm — every queue needs one"],
            ["Fan-out ⭐", "SNS topic → multiple SQS queues → independent consumers"],
            ["EventBridge", "event bus + content rules; AWS services publish natively"],
            ["SQS vs Kinesis", "queue deletes on read · stream keeps + replays"],
            ["Amazon MQ", "managed ActiveMQ/RabbitMQ — migrations only"],
            ["Long polling", "WaitTimeSeconds=20 → fewer empty receives, lower cost"],
            ["Scale workers on", "queue depth metric → autoscaling policy"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
