"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "AWS ML — Three Ways In, Live",
  nodes: [
    { id: "app", icon: "📱", label: "Your App", sub: "needs intelligence", x: 8, y: 50, color: "#22d3ee" },
    { id: "rek", icon: "👁️", label: "Rekognition", sub: "AI API · no ML skill", x: 36, y: 14, color: "#34d399" },
    { id: "bedrock", icon: "🪨", label: "Bedrock", sub: "GenAI · Claude & co", x: 40, y: 56, color: "#fb923c" },
    { id: "kb", icon: "📚", label: "Knowledge Base", sub: "your docs (RAG)", x: 68, y: 26, color: "#a78bfa" },
    { id: "sm", icon: "🧠", label: "SageMaker", sub: "custom models", x: 46, y: 88, color: "#f472b6" },
    { id: "endpoint", icon: "🎯", label: "Endpoint", sub: "real-time inference", x: 82, y: 72, color: "#fbbf24" },
  ],
  edges: [
    { id: "app-rek", from: "app", to: "rek", bend: -15, color: "#34d399" },
    { id: "app-bedrock", from: "app", to: "bedrock", color: "#fb923c" },
    { id: "bedrock-kb", from: "bedrock", to: "kb", dashed: true, color: "#a78bfa" },
    { id: "app-sm", from: "app", to: "sm", bend: 18, dashed: true, color: "#f472b6" },
    { id: "sm-endpoint", from: "sm", to: "endpoint", color: "#fbbf24" },
    { id: "app-endpoint", from: "app", to: "endpoint", bend: 55, dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "aiapi",
      name: "👁️ AI API (easy)",
      command: "rekognition.detect_labels(Image=selfie.jpg)",
      steps: [
        { node: "app", paths: ["app-rek"], text: "Your app needs to moderate uploaded photos. Zero ML knowledge on the team? No problem." },
        { node: "rek", paths: ["app-rek"], text: "One API call to Rekognition — Amazon's pre-trained model returns labels + confidence: {\"Dog\": 98.7%, \"Outdoors\": 95.1%}." },
        { node: "app", paths: [], text: "You pay per image, train nothing, maintain nothing. Same pattern: Transcribe, Polly, Translate, Textract. 👁️" },
      ],
    },
    {
      id: "rag",
      name: "🪨 Bedrock + RAG",
      command: 'bedrock.invoke_model(claude, "What is our refund policy?")',
      steps: [
        { node: "app", paths: ["app-bedrock"], text: "The support chatbot sends a user question to Bedrock — fully managed access to Claude and other foundation models." },
        { node: "kb", paths: ["bedrock-kb"], text: "RAG kicks in: the Knowledge Base vector-searches YOUR company docs and injects the relevant passages into the prompt." },
        { node: "bedrock", paths: ["app-bedrock"], text: "Claude answers using your actual policy — with citations, no hallucinated rules, no model training. 🪨" },
      ],
    },
    {
      id: "custom",
      name: "🧠 Custom model",
      command: "sagemaker: train.py → model.tar.gz → endpoint",
      steps: [
        { node: "sm", paths: ["app-sm"], text: "Fraud detection needs YOUR data. Data scientists train a custom XGBoost model in SageMaker on GPU instances." },
        { node: "endpoint", paths: ["sm-endpoint"], text: "The trained model deploys to a managed real-time Endpoint with auto-scaling — no inference servers to babysit." },
        { node: "app", paths: ["app-endpoint"], text: "Every transaction calls the endpoint: fraud score in 20ms. Most teams never need this layer — start with layers 1-2. 🧠" },
      ],
    },
  ],
};

const NAV = [
  { id: "three-layers", label: "The 3 Layers of AWS ML ⭐" },
  { id: "ai-services", label: "AI Services — Vision & Speech" },
  { id: "language-services", label: "AI Services — Language & Docs" },
  { id: "bedrock", label: "Bedrock — Generative AI ⭐" },
  { id: "sagemaker", label: "SageMaker — Build Your Own ⭐" },
  { id: "sagemaker-deploy", label: "SageMaker — Train & Deploy" },
  { id: "choosing", label: "Which Layer? The Flowchart ⭐" },
  { id: "architecture", label: "ML in a Real Architecture" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsMachineLearningPage() {
  return (
    <TopicShell
      icon="🤖"
      title="Machine Learning & AI"
      gradientWord="Machine Learning"
      subtitle="AWS ML is a three-layer cake: ready-made AI APIs (Rekognition, Comprehend, Textract…), Bedrock for generative AI with foundation models, and SageMaker when you build your own. The flowchart tells you which layer — usually higher than you think."
      nav={NAV}
      badges={["🍰 3-layer model", "🔀 Decision flowchart", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🚚", label: "Migration & Transfer", href: "/aws/migration" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="three-layers" number="01" title="The 3 Layers of AWS ML ⭐">
        <P>
          Twenty-plus ML services collapse into three layers, sorted by how much work{" "}
          <em>you</em> do:
        </P>
        <CodeBlock
          title="three_layer_cake.txt"
          runnable={false}
          code={`        skill needed ▲ effort ▲ control ▲
┌──────────────────────────────────────────────────────────────┐
│ LAYER 3 — BUILD YOUR OWN            🧪 SageMaker             │
│ your data, your model, your training                          │
│ for: ML teams with unique problems (churn, forecasting...)    │
├──────────────────────────────────────────────────────────────┤
│ LAYER 2 — GENERATIVE AI             🪨 Bedrock               │
│ foundation models (Claude, Llama...) via ONE API —           │
│ prompt them, ground them in your docs (RAG), build agents    │
│ for: chatbots, summarization, content generation              │
├──────────────────────────────────────────────────────────────┤
│ LAYER 1 — READY-MADE AI APIs        👁️ Rekognition  🗣️ Polly │
│ one API call, zero ML knowledge     💬 Comprehend  📄 Textract│
│ pre-trained by AWS on huge data     🎙️ Transcribe  🤖 Lex    │
│ for: common tasks — vision, speech, text                      │
└──────────────────────────────────────────────────────────────┘
        ▼ time to ship: hours ── weeks ── months ▼

rule: start at the BOTTOM. climb only when the layer below
can't solve your problem. (most teams never need layer 3)`}
        />
        <Callout type="analogy">
          🍽️ Layer 1 is ordering food delivery, layer 2 is a meal-kit you season to taste,
          layer 3 is farming the ingredients. Hungry people order delivery first; you only
          farm when no restaurant cooks your dish.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="ai-services" number="02" title="AI Services — Vision & Speech (Layer 1)">
        <CodeBlock
          title="vision_and_speech.txt"
          runnable={false}
          code={`👁️ REKOGNITION — images & video
   photo in → { labels: ["Dog","Beach" 98%], faces, celebrities,
                text-in-image, unsafe-content flags }
   uses: content moderation, photo tagging, face-based check-in

🎙️ TRANSCRIBE — speech → text
   audio in → transcript with timestamps, speaker labels
   ("diarization"), custom vocabulary ("Kubernetes", brand names)
   uses: call-center logs, meeting notes, subtitles

🗣️ POLLY — text → speech
   "Your order has shipped" → natural MP3, dozens of voices/languages
   uses: IVR phone systems, accessibility, news readers

the shape is always the same:
   media in ──▶ ONE API call ──▶ JSON out  (pay per image/minute/char)`}
        />
        <CodeBlock
          title="rekognition_call.py"
          runnable={false}
          code={`import boto3

rek = boto3.client("rekognition")
resp = rek.detect_labels(
    Image={"S3Object": {"Bucket": "my-photos", "Name": "beach.jpg"}},
    MaxLabels=5,
)
for label in resp["Labels"]:
    print(label["Name"], round(label["Confidence"], 1))
# Dog 98.7 / Beach 97.2 / Outdoors 95.4 ...
# ML expertise required: zero.`}
        />
      </Section>

      {/* 03 */}
      <Section id="language-services" number="03" title="AI Services — Language & Documents (Layer 1)">
        <CodeBlock
          title="language_and_docs.txt"
          runnable={false}
          code={`💬 COMPREHEND — understand text
   review in → { sentiment: NEGATIVE 0.94,
                 entities: ["iPhone 15" PRODUCT, "Delhi" LOCATION],
                 key phrases, language, PII detection ⭐ }
   uses: triage support tickets, scan logs for leaked PII

📄 TEXTRACT — read documents (OCR++)
   scanned invoice/form in → not just text, but STRUCTURE:
   tables as tables, forms as key→value ("Invoice No" → "INV-841")
   uses: invoice automation, KYC documents, claims processing

🤖 LEX — conversational bots (the Alexa engine)
   defines INTENTS ("BookHotel") + SLOTS (city, dates) →
   handles the dialogue, calls a Lambda to do the work
   uses: support chatbots, phone bots (pairs with Connect)

🌐 TRANSLATE — language translation, 75+ languages, per-character`}
        />
        <CodeBlock
          title="combo_example.txt"
          runnable={false}
          code={`Layer-1 services chain beautifully:

📞 call recording ─▶ Transcribe ─▶ text
                                    ├─▶ Comprehend: sentiment per call
                                    ├─▶ Translate: agent QA across regions
                                    └─▶ Athena: "% angry calls by product"
— a call-analytics platform with zero models trained 🤯`}
        />
      </Section>

      {/* 04 */}
      <Section id="bedrock" number="04" title="Bedrock — Generative AI (Layer 2) ⭐">
        <P>
          <strong>Bedrock</strong> gives you <strong>foundation models</strong> — Anthropic
          Claude, Meta Llama, Amazon Nova, Mistral and more — behind one serverless API. No
          GPUs to rent, pay per token.
        </P>
        <CodeBlock
          title="bedrock_pieces.txt"
          runnable={false}
          code={`🪨 BEDROCK
 ├─ MODEL ACCESS    one API, many models — swap Claude↔Llama
 │                  without rewriting your app
 │
 ├─ KNOWLEDGE BASES (RAG, the killer feature) ⭐
 │   your PDFs/docs in S3 ─▶ chunked ─▶ embeddings ─▶ vector store
 │   question ─▶ retrieve relevant chunks ─▶ model answers
 │   FROM YOUR DOCS, with citations
 │   → the model knows YOUR refund policy, not just the internet
 │
 ├─ AGENTS          model can CALL YOUR APIs/Lambdas:
 │                  "cancel order 123" → agent invokes your
 │                  cancel-order function, then confirms
 │
 └─ GUARDRAILS      block topics, filter PII, keep the bot
                    on-brand and out of trouble

privacy ⭐: your prompts/data are NOT used to train the models —
the #1 reason enterprises use Bedrock over public chatbots`}
        />
        <CodeBlock
          title="rag_flow.txt"
          runnable={false}
          code={`WITHOUT RAG                        WITH RAG (Knowledge Base)
"what's our refund window?"        "what's our refund window?"
        │                                  │
        ▼                                  ▼ search company docs first
🤖 model guesses from               📚 finds: policy.pdf §4.2
   internet training 😬                    │
   (may be wrong/made up)                  ▼ docs + question → model
                                   🤖 "30 days for unopened items,
                                       per policy §4.2" ✅ + citation`}
        />
        <Callout type="tip">
          💡 Interview sound bite: &quot;RAG grounds a general model in private data at query
          time — cheaper, fresher, and more auditable than fine-tuning, which actually retrains
          weights and is rarely needed.&quot;
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="sagemaker" number="05" title="SageMaker — Build Your Own (Layer 3) ⭐">
        <P>
          <strong>SageMaker</strong> is the workbench for the full custom-ML lifecycle. The
          lifecycle is the thing to memorize — SageMaker just has a tool for each step:
        </P>
        <CodeBlock
          title="ml_lifecycle_to_tools.txt"
          runnable={false}
          code={`THE ML LIFECYCLE                  THE SAGEMAKER TOOL
────────────────                  ──────────────────
1. explore data, prototype   ──▶  📓 Studio (managed Jupyter)
2. label training data       ──▶  🏷️ Ground Truth (human workforce)
3. prepare features          ──▶  🧮 Data Wrangler / Feature Store
4. train the model           ──▶  🏋️ Training Jobs — spin up GPU
                                     fleet, train, auto-terminate
                                     (pay only training minutes ⭐)
5. tune hyperparameters      ──▶  🎛️ Automatic Model Tuning
6. deploy for predictions    ──▶  🚀 Endpoints (next section)
7. watch it degrade          ──▶  📡 Model Monitor (drift detection)
8. automate it all           ──▶  🪜 Pipelines (CI/CD for ML)

shortcuts: Autopilot/Canvas — give it a CSV + target column,
it tries many models and hands you the best (AutoML, low/no-code)`}
        />
        <Callout type="behind">
          🔧 The key cost idea: notebooks are small cheap instances; heavy GPU hardware exists
          only for the minutes a <em>training job</em> runs, then terminates itself. Never
          train inside the notebook instance — that is paying GPU rates to run Jupyter.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="sagemaker-deploy" number="06" title="SageMaker — Training & Deployment Options">
        <CodeBlock
          title="training_job.txt"
          runnable={false}
          code={`TRAINING JOB anatomy:
 input:  s3://bucket/training-data/
 code:   your script (or built-in algorithm: XGBoost etc.)
 infra:  ml.p4d.24xlarge × 4  ← exists ONLY during the job
         (+ spot training = up to 90% off, with checkpoints 💰)
 output: s3://bucket/models/model.tar.gz  ← "the artifact"`}
        />
        <CodeBlock
          title="deploy_options.txt"
          runnable={false}
          code={`model.tar.gz → how do you serve predictions?

1️⃣ REAL-TIME ENDPOINT    HTTPS, ms latency, instance always on
   fraud check during checkout          (autoscaling, $$ while idle)
2️⃣ SERVERLESS ENDPOINT   scales to zero, cold starts
   spiky/rare traffic                   (pay per inference ⭐)
3️⃣ ASYNC ENDPOINT        queue in, S3 out — large payloads,
   1-hour video analysis                long processing
4️⃣ BATCH TRANSFORM       no endpoint at all: score a whole
   nightly churn scores                 S3 dataset, then shut down

same decision shape as compute: always-on vs serverless vs batch`}
        />
      </Section>

      {/* 07 */}
      <Section id="choosing" number="07" title="Which Layer? — The Flowchart ⭐">
        <CodeBlock
          title="ml_decision_flow.txt"
          runnable={false}
          code={`"we want AI for ___"
 │
 ├─ common task? (tag images, transcribe audio, OCR forms,
 │  sentiment, translate)
 │   └─▶ LAYER 1 — call Rekognition/Transcribe/Textract/
 │        Comprehend/Translate. ship TODAY ✅
 │
 ├─ generate / chat / summarize / answer-from-our-docs?
 │   └─▶ LAYER 2 — Bedrock
 │        ├─ needs company knowledge → + Knowledge Base (RAG)
 │        └─ needs to take actions   → + Agents
 │
 ├─ predict from OUR tabular data? (churn, demand, fraud scores)
 │   ├─ no ML team → SageMaker Canvas/Autopilot (AutoML)
 │   └─ ML team    → LAYER 3 — SageMaker custom models
 │
 └─ unsure? → prototype on layer 1/2 this week,
              justify layer 3 with the prototype's gaps`}
        />
        <Table
          head={["", "Layer 1 (AI APIs)", "Layer 2 (Bedrock)", "Layer 3 (SageMaker)"]}
          rows={[
            ["ML skill needed", "none", "prompting / RAG basics", "data science team"],
            ["Time to ship", "hours", "days–weeks", "weeks–months"],
            ["Your data used as", "API input", "RAG context / fine-tune", "training data"],
            ["Pricing", "per call/minute", "per token", "per instance-hour"],
            ["Example", "OCR invoices", "support chatbot on your docs", "custom churn model"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Classic over-engineering: a team spends 4 months on a custom SageMaker sentiment
          model that Comprehend matches with one API call. Buying beats building until proven
          otherwise — exam answers reward the managed service too.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="architecture" number="08" title="ML in a Real Architecture">
        <P>A support-automation platform using all three layers together:</P>
        <CodeBlock
          title="support_ai_architecture.txt"
          runnable={false}
          code={`📧 ticket arrives ─▶ EventBridge ─▶ ⚡ Lambda pipeline
                                       │
        ┌──────────────────────────────┼─────────────────────────┐
        ▼                              ▼                         ▼
 💬 Comprehend                  🪨 Bedrock + KB            🧪 SageMaker
 sentiment + language +         drafts a reply from        endpoint scores
 PII masking (layer 1)          policy docs (RAG, layer 2) "churn risk"
        │                              │                   (layer 3)
        └──────────────┬───────────────┘─────────────────────────┘
                       ▼
        angry + high-churn-risk? ─▶ 🧑‍💼 human agent, priority queue
        routine?                  ─▶ 🤖 send drafted reply
                       │
                       ▼
        📊 outcomes → S3 lake → Athena/QuickSight
        (and retraining data for the SageMaker model 🔁)

note the glue: EventBridge, Lambda, S3, IAM roles —
ML services are just more boxes in the same architecture 🧩`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["3 layers", "AI APIs → Bedrock (gen-AI) → SageMaker (build your own)"],
            ["Golden rule", "start at the lowest layer that solves it — buy before build"],
            ["Rekognition", "images/video: labels, faces, moderation"],
            ["Transcribe / Polly", "speech→text / text→speech"],
            ["Comprehend", "text: sentiment, entities, PII detection"],
            ["Textract", "documents → structured tables & key-values (OCR++)"],
            ["Lex", "chatbots: intents + slots → Lambda fulfillment"],
            ["Bedrock", "foundation models via one API · data never trains models"],
            ["RAG / Knowledge Base", "retrieve your docs at query time → grounded answers"],
            ["Bedrock Agents", "model calls your APIs/Lambdas to take actions"],
            ["SageMaker training", "GPU fleet exists only during the job · spot = -90%"],
            ["Deploy options", "real-time / serverless / async / batch transform"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
