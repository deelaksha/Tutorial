"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Serverless Event Universe — Live",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "mobile / web", x: 8, y: 26, color: "#22d3ee" },
    { id: "apigw", icon: "🚪", label: "API Gateway", sub: "REST endpoint", x: 32, y: 26, color: "#a78bfa" },
    { id: "lambda", icon: "⚡", label: "Lambda", sub: "runs only on events", x: 58, y: 50, color: "#fb923c" },
    { id: "ddb", icon: "🗃️", label: "DynamoDB", sub: "ms at any scale", x: 86, y: 26, color: "#34d399" },
    { id: "s3", icon: "🪣", label: "S3", sub: "upload events", x: 20, y: 80, color: "#fbbf24" },
    { id: "sqs", icon: "📬", label: "SQS", sub: "buffered work", x: 86, y: 80, color: "#f472b6" },
  ],
  edges: [
    { id: "user-apigw", from: "user", to: "apigw", color: "#22d3ee" },
    { id: "apigw-lambda", from: "apigw", to: "lambda", color: "#a78bfa" },
    { id: "lambda-ddb", from: "lambda", to: "ddb", color: "#34d399" },
    { id: "s3-lambda", from: "s3", to: "lambda", bend: 18, dashed: true, color: "#fbbf24" },
    { id: "sqs-lambda", from: "sqs", to: "lambda", bend: -18, dashed: true, color: "#f472b6" },
  ],
  flows: [
    {
      id: "api",
      name: "🚪 Sync API call",
      command: "POST /orders → 200 in 45ms",
      steps: [
        { node: "user", paths: ["user-apigw"], text: "User taps \"Buy\". The request hits API Gateway — a fully managed front door, no servers." },
        { node: "lambda", paths: ["apigw-lambda"], text: "API Gateway invokes your Lambda. A micro-VM spins up (or reuses a warm one), runs your handler, and bills per millisecond." },
        { node: "ddb", paths: ["lambda-ddb"], text: "The function writes the order to DynamoDB and returns. Idle the rest of the day? You pay $0. ⚡" },
      ],
    },
    {
      id: "event",
      name: "🪣 S3 event trigger",
      command: "s3:ObjectCreated:Put → thumbnail.jpg",
      steps: [
        { node: "s3", paths: ["s3-lambda"], text: "A user uploads a photo to the bucket. S3 itself EMITS an event — no polling, no cron job." },
        { node: "lambda", paths: ["s3-lambda"], text: "The event invokes Lambda with the bucket + key in the payload. The function downloads the image and generates a thumbnail." },
        { node: "ddb", paths: ["lambda-ddb"], text: "Metadata saved to DynamoDB, thumbnail written back to S3. 1,000 uploads at once? 1,000 parallel Lambdas. 🪣" },
      ],
    },
    {
      id: "queue",
      name: "📬 Queue worker",
      command: "SQS batch (10 msgs) → Lambda",
      steps: [
        { node: "sqs", paths: ["sqs-lambda"], text: "A flash sale dumps 50,000 jobs into SQS. Nothing breaks — the queue absorbs the spike." },
        { node: "lambda", paths: ["sqs-lambda"], text: "Lambda's event-source mapping polls SQS and invokes functions with batches of 10, scaling consumers up automatically." },
        { node: "ddb", paths: ["lambda-ddb"], text: "Each batch is processed and recorded. Failures return to the queue for retry (then DLQ). Backpressure handled by design. 📬" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-serverless", label: "What 'Serverless' Means" },
  { id: "lambda-basics", label: "Lambda — Your First Function ⭐" },
  { id: "triggers", label: "Triggers — What Invokes It ⭐" },
  { id: "lifecycle", label: "Cold Starts & Concurrency" },
  { id: "layers-versions", label: "Layers, Versions & Aliases" },
  { id: "api-gateway", label: "API Gateway ⭐" },
  { id: "step-functions", label: "Step Functions" },
  { id: "events-streams", label: "EventBridge & DynamoDB Streams" },
  { id: "full-app", label: "A Complete Serverless App ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsServerlessPage() {
  return (
    <TopicShell
      icon="λ"
      title="Serverless"
      gradientWord="Lambda"
      subtitle="Code that runs without servers you manage: Lambda functions fired by triggers, fronted by API Gateway, orchestrated by Step Functions, and glued together with EventBridge — a full serverless application assembled piece by piece."
      nav={NAV}
      badges={["λ Invocation flow drawn", "🧊 Cold starts explained", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "📦", label: "Containers on AWS", href: "/aws/containers" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-serverless" number="01" title="What 'Serverless' Actually Means">
        <P>
          Servers obviously exist — <strong>you just never see them</strong>. Serverless means:
          no instances to provision or patch, scaling to zero (and to thousands) is automatic,
          and you pay only while code runs.
        </P>
        <CodeBlock
          title="ec2_vs_lambda.txt"
          runnable={false}
          code={`EC2 mindset:                       Lambda mindset:
 "I run a SERVER that               "I have CODE that runs
  waits for requests"                WHEN something happens"

 🖥️ instance up 24/7                ⚡ function invoked per event
 pay: every hour, even idle         pay: per request + per ms used
 scale: ASG adds instances          scale: automatic, instant-ish
 patch the OS: you                  patch anything: AWS
 idle at 3am: 💸 burning            idle at 3am: $0.00 ✅

 the serverless squad (you've met some):
 compute λ Lambda · api 🚪 API Gateway · db 🗄️ DynamoDB
 storage 🪣 S3 · queue 📨 SQS/SNS/EventBridge · workflow 🪜 Step Functions`}
        />
        <Callout type="analogy">
          🚕 EC2 is <strong>owning a car</strong>: yours 24/7, insurance and parking even when
          parked. Lambda is <strong>taking taxis</strong>: pay per ride, never think about oil
          changes, and 1,000 taxis can show up at once if needed.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="lambda-basics" number="02" title="Lambda — Your First Function ⭐">
        <CodeBlock
          title="handler.py"
          code={`import json

def lambda_handler(event, context):
    # event   = WHAT happened (shape depends on the trigger!)
    # context = runtime info (time remaining, request id...)
    name = event.get("name", "world")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Hello, {name}!"})
    }`}
          output={`$ aws lambda invoke --function-name hello --payload '{"name":"Asha"}' out.json
$ cat out.json
{"statusCode": 200, "body": "{\\"message\\": \\"Hello, Asha!\\"}"}

billed duration: 12 ms · memory used: 38 MB / 128 MB
→ this invocation cost ≈ $0.0000000025  (yes, 9 zeros)`}
        />
        <Table
          head={["Setting", "Range / default", "Note"]}
          rows={[
            ["Memory", "128 MB – 10 GB", "CPU scales WITH memory — more MB = faster CPU"],
            ["Timeout", "max 15 minutes", "longer jobs → ECS/Batch/Step Functions"],
            ["Runtime", "Python, Node, Java, Go... or container image", "your code + deps, zipped or imaged"],
            ["Execution role", "IAM role", "what the function MAY do (write logs, read S3...)"],
            ["Ephemeral /tmp", "512 MB – 10 GB", "scratch space, gone after"],
          ]}
        />
        <Callout type="mistake">
          Counter-intuitive: raising memory often <strong>lowers cost</strong> — 2x memory = 2x
          CPU = job finishes in less than half the time. Tune with AWS Lambda Power Tuning
          instead of defaulting to 128 MB.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="triggers" number="03" title="Triggers — What Invokes Your Function ⭐">
        <CodeBlock
          title="trigger_map.txt"
          runnable={false}
          code={`a Lambda never runs on its own — SOMETHING invokes it:

 SYNC (caller waits for the answer):
 🚪 API Gateway   HTTP request    → λ → response to user
 ⚖️ ALB           HTTP request    → λ → response

 ASYNC (fire-and-forget, retries built in):
 🪣 S3            object created  → λ  (resize the image!)
 📣 SNS           message published → λ
 🎯 EventBridge   event / cron    → λ  (nightly cleanup)

 POLL (Lambda service pulls batches for you):
 📨 SQS           queue messages  → λ (batch of up to 10)
 🌊 Kinesis / DynamoDB Streams    → λ (ordered shard batches)

 ⭐ each trigger = different EVENT SHAPE:
 S3 event: {"Records":[{"s3":{"bucket":..,"object":{"key":..}}}]}
 APIGW:    {"httpMethod":"POST","path":"/orders","body":"..."}
 first line of every Lambda you debug: print(json.dumps(event))`}
        />
        <Callout type="tip">
          Interview framing: sync vs async vs poll determines <strong>retry behavior</strong> —
          sync errors go back to the caller; async retries twice then can dead-letter; poll-based
          retries until success or expiry (a poison message can block an SQS batch — use a DLQ).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="lifecycle" number="04" title="Cold Starts & Concurrency — What's Really Happening">
        <CodeBlock
          title="cold_vs_warm.txt"
          runnable={false}
          code={`COLD START (first request / after idle):
 ┌──────────┬──────────────┬───────────────┬─────────┐
 │ provision│ download code│ start runtime │ run     │
 │ sandbox  │              │ + your init   │ handler │
 └──────────┴──────────────┴───────────────┴─────────┘
 ~100ms-1s+ (worse for big packages / VPC / Java)     │
                                                      ▼
 WARM (sandbox reused):                          ┌─────────┐
 request ───────────────────────────────────────▶│ handler │ ~ms ✅
                                                 └─────────┘
 ⭐ so: heavy stuff (DB connections, SDK clients) goes OUTSIDE
    the handler — it survives between warm invocations!

 CONCURRENCY = how many sandboxes at once:
 1000 simultaneous requests = 1000 parallel sandboxes 😎
 ⚠️ ...each opening a DB connection → RDS dies 💀
    fixes: RDS Proxy (connection pooling) or DynamoDB
 controls: reserved concurrency (cap) · provisioned (pre-warmed, $)`}
        />
        <Callout type="behind">
          A &quot;sandbox&quot; is a Firecracker microVM — boots in ~125ms, isolated per
          customer. AWS keeps it warm for minutes after use, which is why the second request is
          fast and why globals persist between calls (a feature AND a bug source).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="layers-versions" number="05" title="Layers, Versions & Aliases — Shipping Like a Pro">
        <CodeBlock
          title="layers_versions_aliases.txt"
          runnable={false}
          code={`LAYERS — shared dependencies, attached not bundled:
 ┌─ function A ─┐ ┌─ function B ─┐ ┌─ function C ─┐
 │ handler 5KB  │ │ handler 3KB  │ │ handler 8KB  │
 └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
        └───────┬────────┴───────┬────────┘
        ┌───────▼───────┐ ┌──────▼────────┐
        │ layer: pandas │ │ layer: shared │  update lib once,
        │ + numpy 40MB  │ │ utils v7      │  not in 30 functions
        └───────────────┘ └───────────────┘

 VERSIONS — immutable snapshots:        ALIASES — movable pointers:
 publish → v1, v2, v3...                "prod" ──▶ v2
 $LATEST = the editable draft           "prod" ──▶ v3   (deploy = repoint)
                                        rollback = point back ⚡
 CANARY with weighted alias:
 prod ──▶ v2 (90%)                      API Gateway calls
      └─▶ v3 (10%) ← watch errors...    "myfunc:prod" — never v3 directly`}
        />
        <Callout type="note">
          Versions + aliases give serverless the same release hygiene as containers: immutable
          artifacts, instant rollback, weighted canaries — without any servers to roll.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="api-gateway" number="06" title="API Gateway — The Front Door for Functions ⭐">
        <P>
          Lambdas have no port to listen on. <strong>API Gateway</strong> turns HTTPS requests
          into invocations — and handles all the unglamorous API work:
        </P>
        <CodeBlock
          title="api_gateway.txt"
          runnable={false}
          code={`👩 POST https://api.acme.com/orders
        │
        ▼
 ┌─ API GATEWAY ───────────────────────────────┐
 │ ✅ TLS (ACM cert) + custom domain           │
 │ ✅ auth: Cognito / IAM / Lambda authorizer  │
 │ ✅ throttle: 10,000 req/s, burst 5,000      │
 │ ✅ validate request body against schema     │
 │ ✅ cache GETs (optional)                    │
 └──────────────┬──────────────────────────────┘
                ├─ route: POST /orders  → λ create-order
                ├─ route: GET  /orders  → λ list-orders
                └─ route: ANY  /legacy  → HTTP backend (proxy)

 HTTP API  : cheaper, faster, covers most REST needs ← default
 REST API  : full features (caching, api keys, WAF...)
 WebSocket : persistent two-way (chat, live dashboards)`}
        />
        <Callout type="tip">
          The exam trio: <strong>API Gateway + Lambda + DynamoDB</strong> = the canonical
          serverless API. Add Cognito for users, CloudFront in front, and you&apos;ve built the
          reference architecture.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="step-functions" number="07" title="Step Functions — Workflows as Diagrams">
        <P>
          When one Lambda calls another calls another, you&apos;ve built an invisible, fragile
          chain. <strong>Step Functions</strong> makes the workflow explicit, visual, and
          fault-tolerant:
        </P>
        <CodeBlock
          title="order_workflow.txt"
          runnable={false}
          code={`state machine: process-order

        ┌─────────────┐
        │ λ validate  │
        └──────┬──────┘
        ┌──────▼──────┐   retry: 3x, exponential backoff
        │ λ charge    │   catch: PaymentError ─▶ λ notify-fail
        └──────┬──────┘
        ┌──────▼──────────────┐
        │ PARALLEL            │
        │ ├ λ update-inventory│
        │ └ λ send-email      │
        └──────┬──────────────┘
        ┌──────▼──────┐
        │ CHOICE      │ amount > $500? ─▶ ⏸️ wait for human approval
        └──────┬──────┘                    (pause up to 1 YEAR!)
        ┌──────▼──────┐
        │ ✅ success  │  every execution: visual trace of every step,
        └─────────────┘  input/output, where it failed and why

 Standard: up to 1yr, exactly-once  ·  Express: high-volume, ≤5min`}
        />
        <Callout type="analogy">
          🍳 A recipe card vs a cook&apos;s memory: Lambda-calling-Lambda is the cook improvising
          (&quot;did I add salt?&quot;). Step Functions is the printed recipe — every step
          checked off, visible to everyone, resumable after interruptions.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="events-streams" number="08" title="EventBridge & DynamoDB Streams — The Glue">
        <CodeBlock
          title="eventbridge_and_streams.txt"
          runnable={false}
          code={`EVENTBRIDGE — the central event router:
 producers                    BUS + RULES                 targets
 your app ──▶ "order.created" ─▶ ┌──────────┐ ─▶ λ invoice
 AWS services (300+ built-in!) ─▶│ match on │ ─▶ 📨 SQS analytics
 SaaS partners (Stripe...) ────▶ │ pattern  │ ─▶ 🪜 Step Functions
                                 └──────────┘
 rule: {"source":["shop"],"detail-type":["order.created"]}
 + cron schedules · producers don't know consumers exist 🎉

 DYNAMODB STREAMS — the table's change feed:
 ┌────────────┐  every INSERT/UPDATE/DELETE  ┌──────────────┐
 │ 🗄️ orders   │ ────────────────────────────▶│ stream record│─▶ λ
 │ table      │  {old image, new image}      └──────────────┘
 └────────────┘
 use: order row created → stream → λ sends confirmation email
 (react to DATA changes without polling — event-driven to the core)`}
        />
        <Callout type="note">
          EventBridge vs SNS vs SQS — the full comparison lives in the{" "}
          <strong>Messaging</strong> topic. Preview: EventBridge = rich routing rules, SNS =
          simple fan-out, SQS = buffering queue.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="full-app" number="09" title="A Complete Serverless App, Assembled ⭐">
        <CodeBlock
          title="serverless_architecture.txt"
          runnable={false}
          code={`"photo sharing app" — zero servers, scales 0 → millions:

 👩 browser
  │ static site (HTML/JS)
  ├────▶ 📡 CloudFront ──▶ 🪣 S3 (site assets)
  │ api calls (JWT from Cognito)
  └────▶ 🚪 API Gateway
            ├─ POST /photos ──▶ λ get-upload-url ──▶ 🪣 S3 (presigned!)
            │                                          │ photo uploaded
            │                                          ▼ S3 trigger
            │                                       λ make-thumbnail
            │                                          │
            │                                          ▼
            ├─ GET /photos ───▶ λ list ◀──────────  🗄️ DynamoDB
            │                                          │ stream
            └─ DELETE /... ───▶ λ delete               ▼
                                                    λ update-feed
 monthly cost at low traffic: ~$0 💸
 the same architecture at 10M users: same diagram, bigger bill —
 NOTHING to re-architect. that's the serverless promise.`}
        />
        <Callout type="tip">
          Note the patterns combining: presigned URLs (Storage topic), IAM roles per function
          (IAM topic), DynamoDB keys (Database topic), event triggers (this one). AWS mastery is
          exactly this: small concepts, composed.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Serverless =", "no servers to manage, scales to zero, pay per use"],
            ["Lambda limits", "15 min max · 10GB RAM · CPU scales with memory"],
            ["handler(event, ctx)", "event shape depends on the trigger"],
            ["Trigger classes", "sync (APIGW) · async (S3/SNS) · poll (SQS/streams)"],
            ["Cold start", "first-run setup penalty; init code outside handler"],
            ["Lambda + RDS", "careful — 1000 sandboxes = 1000 connections → RDS Proxy"],
            ["Layer", "shared dependencies attached to many functions"],
            ["Version + alias", "immutable snapshots + movable pointer (canary/rollback)"],
            ["API Gateway", "HTTPS front door: auth, throttle, validate → λ"],
            ["Step Functions", "visual workflows: retries, parallel, human approval, 1yr"],
            ["EventBridge", "event bus + rules; cron included"],
            ["DynamoDB Streams", "table change feed → λ (react to data)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
