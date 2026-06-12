"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "RAG in action: retrieve ❓ generate",
  nodes: [
    { id: "question", icon: "S", label: "User Question", sub: "battery query", x: 8, y: 50, color: "#22d3ee" },
    { id: "embed", icon: "🧲", label: "Embed Query", sub: "text ❓ vector", x: 28, y: 50, color: "#a78bfa" },
    { id: "search", icon: "🔍", label: "Vector Search", sub: "find chunks", x: 48, y: 50, color: "#fb923c" },
    { id: "manual", icon: "📄", label: "manual.md", sub: "28 min chunk", x: 48, y: 16, color: "#34d399" },
    { id: "faq", icon: "📄", label: "faq.md", sub: "", x: 48, y: 84, color: "#34d399" },
    { id: "prompt", icon: "📝", label: "Stuff Context", sub: "build prompt", x: 68, y: 50, color: "#fbbf24" },
    { id: "llm", icon: "🤖", label: "LLM (gpt-4o-mini)", sub: "generate answer", x: 88, y: 50, color: "#60a5fa" },
  ],
  edges: [
    { id: "q-embed", from: "question", to: "embed", color: "#22d3ee" },
    { id: "embed-search", from: "embed", to: "search", color: "#a78bfa" },
    { id: "search-manual", from: "search", to: "manual", color: "#34d399" },
    { id: "search-faq", from: "search", to: "faq", dashed: true, color: "#34d399" },
    { id: "manual-prompt", from: "manual", to: "prompt", color: "#fbbf24" },
    { id: "prompt-llm", from: "prompt", to: "llm", color: "#60a5fa" },
    { id: "llm-back", from: "llm", to: "question", bend: -80, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: " Battery question ❓ correct 28 min",
      command: "How long does the X1 battery last?",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User asks: 'How long does the X1 battery last?'  This is the test question we care about. WITHOUT RAG, the model often hallucinates. WITH RAG, we retrieve the real answer from our docs." },
        { node: "embed", paths: ["embed-search"], text: "Convert question to embedding (a vector of 1536 floats using text-embedding-3-small). The embedding captures MEANING, so 'How long does the battery last?' and 'battery flight time' are mathematically similar." },
        { node: "search", paths: ["search-manual"], text: "Vector search: compare question embedding vs all doc chunk embeddings (using cosine similarity). The manual chunk about 'battery flight time 28 minutes' scores highest (e.g., 0.89). It WINS." },
        { node: "manual", paths: ["manual-prompt"], text: "Retrieved chunk: 'Nimbus X1 battery provides 28 minutes of flight time on a full charge.' This is REAL data from our docs  no hallucination possible." },
        { node: "prompt", paths: ["prompt-llm"], text: "Build prompt: System: 'You are NimbusBot. Answer ONLY from the context.' User: 'Context: [retrieved chunk]\\n\\nQuestion: How long does the X1 battery last?' We STUFF the retrieved chunk into the prompt." },
        { node: "llm", paths: ["llm-back"], text: "LLM generates: 'The Nimbus X1 battery lasts about 28 minutes on a full charge.' CORRECT! The model read the context, not hallucination. This is grounded generation." },
        { node: "question", paths: [], text: "User receives accurate answer with citation. RAG success: retrieve relevant docs ❓ generate grounded answer. The LLM never 'knew' this fact  we fed it at query time. " },
      ],
    },
    {
      id: "fail",
      name: "L No RAG ❓ hallucination",
      command: "How long does the X1 battery last? (no retrieval)",
      steps: [
        { node: "question", paths: ["q-embed"], text: "Same question: 'How long does the X1 battery last?'  But imagine we SKIP retrieval (no RAG). We just ask the LLM directly." },
        { node: "embed", paths: [], text: "Without RAG, we don't embed the question. We don't search. We just send the question to the LLM with NO context from our docs. This is the naive approach." },
        { node: "search", paths: [], text: "No search happens. The LLM has ZERO access to manual.md, faq.md, warranty.md. It only knows what it learned during training (frozen, months old, generic)." },
        { node: "manual", paths: [], text: "The correct chunk (28 min) sits unused in our docs. The LLM never sees it. This is the tragedy: the answer exists, but the model can't access it." },
        { node: "prompt", paths: ["prompt-llm"], text: "Prompt is just: 'User: How long does the X1 battery last?'  no context. The LLM is flying blind. It has no grounding, no facts, no Nimbus Gear docs." },
        { node: "llm", paths: ["llm-back"], text: "LLM generates: 'The Nimbus X1 battery typically lasts about 45 minutes.' WRONG! It hallucinated a plausible-sounding but INCORRECT number. This is why we need RAG. 🖨" },
        { node: "question", paths: [], text: "User receives wrong answer (45 min instead of 28). No citation, no grounding. This is hallucination in action. RAG fixes this by ALWAYS retrieving real docs before generating. L" },
      ],
    },
    {
      id: "power",
      name: "❓ Follow-up with chat history",
      command: "Can I fly it in wind? (context from previous turn)",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User asks a follow-up: 'Can I fly it in wind?'  'it' refers to the X1 from the previous question. We need to carry chat history for context." },
        { node: "embed", paths: ["embed-search"], text: "Embed the follow-up question. We also include the PREVIOUS user question + assistant answer in the embedding (or use a smart re-phrasing step to make the query standalone: 'Can I fly the Nimbus X1 in wind?')." },
        { node: "search", paths: ["search-manual"], text: "Vector search with the rephrased/contextualized query. The manual chunk about 'max wind resistance 38 km/h' scores highest. Retrieval adapts to conversation context." },
        { node: "manual", paths: ["manual-prompt"], text: "Retrieved chunk: 'The Nimbus X1 can handle winds up to 38 km/h. Avoid flying in stronger gusts.' This is the wind spec from our docs." },
        { node: "prompt", paths: ["prompt-llm"], text: "Build prompt with FULL chat history (previous Q&A) + new context chunk + new question. The LLM sees the conversation thread, knows 'it' = X1, and has the wind spec." },
        { node: "llm", paths: ["llm-back"], text: "LLM generates: 'Yes, the X1 can handle winds up to 38 km/h. Stronger winds are not recommended.' CORRECT, contextual, grounded. Multi-turn RAG works! ❓" },
        { node: "question", paths: [], text: "User gets a natural, conversational answer that references the previous topic. This is advanced RAG: chat history + retrieval + generation. Coming in later chapters." },
      ],
    },
  ],
};

const NAV = [
  { id: "why-hallucinate", label: "Why LLMs Hallucinate" },
  { id: "what-llm", label: "What an LLM Actually Is (5 Minutes)" },
  { id: "context-window", label: "The Context Window" },
  { id: "naive-fix", label: "The Naive Fix: Paste All Docs" },
  { id: "rag-idea", label: "The RAG Idea P" },
  { id: "two-phases", label: "The Two Phases: Ingest & Query" },
  { id: "rag-vs-finetune", label: "RAG vs Fine-Tuning" },
  { id: "what-build", label: "What We'll Build: NimbusBot" },
  { id: "vocabulary", label: "RAG Vocabulary" },
  { id: "toy-rag", label: "Toy RAG in 30 Lines (Pure Python)" },
  { id: "misconceptions", label: "Common Misconceptions" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function RagFundamentalsPage() {
  return (
    <TopicShell
      icon="🧠"
      title="RAG from Zero  Why LLMs Need Retrieval"
      gradientWord="RAG"
      subtitle="LLMs are powerful, but they hallucinate. They don't know YOUR data. RAG (Retrieval-Augmented Generation) solves this: retrieve relevant chunks from your docs, then let the LLM generate grounded answers. You'll learn the core idea, see the two-phase architecture, and build a toy RAG system in pure Python  zero libraries, zero APIs, just the concept."
      nav={NAV}
      badges={["🧠 Concepts first", "🔍 Pure Python toy", "💡 Zero to RAG", "🎤 Interview-ready"]}
      next={{ icon: "🤖", label: "Calling LLMs from Python", href: "/rag/llm-apis" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-hallucinate" number="01" title="Why LLMs Hallucinate">
        <P>
          You ask ChatGPT: &quot;How long does the Nimbus X1 battery last?&quot; It confidently replies: <strong>&quot;About 45 minutes.&quot;</strong>
        </P>
        <P>
          <strong>WRONG.</strong> The real answer is <strong>28 minutes</strong>. You have the manual (manual.md) with the exact spec. But the LLM never saw it. It guessed a plausible number and presented it as fact. This is <strong>hallucination</strong>.
        </P>
        <CodeBlock
          title="hallucination_demo.txt"
          runnable={false}
          code={`USER: How long does the Nimbus X1 battery last?

LLM (without RAG):
  "The Nimbus X1 battery typically lasts about 45 minutes on a full
   charge, depending on flying conditions."

                                                                
WHY THIS HAPPENS:

1. The LLM was trained on public internet data (Wikipedia, GitHub, etc.)
   ❓ It NEVER saw your manual.md (your private company docs).

2. Training data is a FROZEN SNAPSHOT (e.g., data up to Jan 2024).
   ❓ If you updated the spec yesterday, the model can't know.

3. LLMs predict the next token based on patterns.
   ❓ "battery lasts about X minutes" ❓ X is often 30-60 for drones.
   ❓ The model fills in a statistically plausible number.

4. The model has NO MEMORY of your docs.
   ❓ It can't look up facts. It only "remembers" patterns from training.

                                                                
THE REAL SPEC (from manual.md):
  "Nimbus X1 battery: 28 minutes flight time on full charge."

The model SHOULD say 28, but it CAN'T  it doesn't have access. 🖨`}
        />
        <Callout type="mistake">
          ❓ <strong>Hallucination = confident wrongness</strong>. The LLM doesn&apos;t say &quot;I don&apos;t know.&quot; It generates a fluent, confident answer that SOUNDS right but is factually wrong. This breaks trust. Users assume it&apos;s correct. RAG fixes this by grounding answers in YOUR real docs.
        </Callout>
        <P>
          The root cause: <strong>LLMs don&apos;t have access to YOUR data</strong>. They only know what they learned during training (months ago, on public data). Your company docs, your database, your PDFs  invisible to the model.
        </P>
      </Section>

      {/* 02 */}
      <Section id="what-llm" number="02" title="What an LLM Actually Is (5 Minutes)">
        <P>
          Before we fix hallucination, understand <strong>what an LLM is</strong> in one sentence:
        </P>
        <CodeBlock
          title="llm_explained.txt"
          runnable={false}
          code={`AN LLM IS A NEXT-TOKEN PREDICTOR.

Given: "The capital of France is"
Predict next token: "Paris"

Given: "How long does the X1 battery"
Predict next token: "last"

Given: "How long does the X1 battery last?"
Predict next token: "About" ❓ "45" ❓ "minutes" ❓ ...

                                                                
TOKENS = CHUNKS OF TEXT

Text: "How long does the X1 battery last?"
Tokens: ["How", " long", " does", " the", " X", "1", " battery", " last", "?"]
         ❓      ❓        ❓       ❓     ❓   ❓    ❓         ❓      ❓
      ~9 tokens (depends on tokenizer; spaces count)

A token H a word or part of a word. Numbers, punctuation = separate tokens.

                                                                
THE MODEL IS A PROBABILITY MACHINE

You give it a prompt (sequence of tokens).
It outputs: P(next token | prompt).

Example:
  Prompt: "The capital of France is"
  P("Paris") = 0.87  ❓ most likely
  P("Lyon")  = 0.05
  P("Berlin")= 0.02

It SAMPLES from this distribution ❓ picks "Paris" (highest prob).

                                                                
TRAINING = LEARNING PATTERNS FROM TEXT

The model read billions of sentences:
  "The capital of France is Paris."
  "France's capital, Paris, ..."
  "Paris, the capital of France, ..."

It learned: after "capital of France is", say "Paris" (high probability).

BUT: It NEVER learned "Nimbus X1 battery = 28 minutes" (not in training data).
  ❓ So it guesses. And guesses wrong. 🖨

                                                                
KEY INSIGHT:

The LLM is NOT a database. It's NOT a search engine.
It's a TEXT COMPLETION ENGINE trained on a frozen snapshot of the internet.

To make it answer YOUR questions with YOUR data, you must FEED that data
into the prompt at query time. That's what RAG does. `}
        />
        <Callout type="analogy">
          🄍 <strong>Library analogy</strong>: Imagine a librarian who memorized summaries of 10,000 books years ago. You ask: &quot;What&apos;s on page 42 of this new book I just published?&quot; She can&apos;t answer  she never read your book. She might guess based on similar books (hallucinate). To get the right answer, you&apos;d hand her your book and say &quot;read page 42, then answer.&quot; That&apos;s RAG.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="context-window" number="03" title="The Context Window">
        <P>
          LLMs can only see what you <strong>paste into the prompt</strong>. This input area is called the <strong>context window</strong>.
        </P>
        <CodeBlock
          title="context_window_demo.py"
          code={`# You send a prompt (a list of messages) to the LLM API
messages = [
    {"role": "system", "content": "You are NimbusBot."},
    {"role": "user", "content": "How long does the X1 battery last?"}
]

# The LLM sees ONLY these messages. Nothing else.
# If the answer is NOT in this text, the model will guess (hallucinate).

#                                                                 
# CONTEXT WINDOW SIZE (examples):

# gpt-4o-mini: 128,000 tokens (~96,000 words, ~300 pages)
# gpt-4o:      128,000 tokens
# claude-3.5:  200,000 tokens (~600 pages)

# Looks huge! But:
# - Input + output combined count toward the limit.
# - Longer context = higher cost ($).
# - You can't paste 10,000 PDFs (millions of tokens).

#                                                                 
# THE MODEL ONLY SEES WHAT YOU SEND

# The model has ZERO access to:
# - Your hard drive
# - The internet (during inference)
# - Previous conversations (unless you resend them)
# - Your database

# It's STATELESS. Every request is isolated.
# You must INCLUDE all relevant info in the prompt. 🎯`}
          output={`(no output  this is a conceptual demo)`}
          runnable={false}
        />
        <Table
          head={["Model", "Context window", "Cost (per 1M input tokens)", "When to use"]}
          rows={[
            ["gpt-4o-mini", "128K tokens (~300 pages)", "$0.15", "RAG, chatbots, most use cases (cheap, fast)"],
            ["gpt-4o", "128K tokens", "$2.50", "Complex reasoning, high-quality output"],
            ["claude-3.5-sonnet", "200K tokens (~600 pages)", "$3.00", "Long documents, deep analysis"],
          ]}
        />
        <P>
          <strong>Key insight</strong>: Even with a huge window (128K tokens), you can&apos;t paste ALL your docs. If you have 10,000 support tickets (millions of tokens), you&apos;ll hit the limit. Solution: <strong>retrieve only the RELEVANT chunks</strong>, not everything. That&apos;s RAG.
        </P>
      </Section>

      {/* 04 */}
      <Section id="naive-fix" number="04" title="The Naive Fix: Paste All Docs">
        <P>
          Naive idea: paste your entire manual.md into the system prompt. The LLM reads it, then answers. Does this work?
        </P>
        <CodeBlock
          title="naive_rag.py"
          code={`# Read manual.md (contains battery spec: 28 minutes)
with open("manual.md") as f:
    manual = f.read()  # e.g., 2000 words = ~2700 tokens

# System prompt: paste the whole manual
messages = [
    {"role": "system", "content": f"You are NimbusBot. Here is the manual:\\n\\n{manual}"},
    {"role": "user", "content": "How long does the X1 battery last?"}
]

# Send to LLM (gpt-4o-mini)
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages
)

print(response.choices[0].message.content)`}
          output={`The Nimbus X1 battery provides 28 minutes of flight time on a full charge.`}
        />
        <P>
          <strong>It works!</strong> The model read the manual and answered correctly. Why don&apos;t we always do this?
        </P>
        <Table
          head={["Problem", "Why it breaks at scale"]}
          rows={[
            [<><strong>Context limit</strong></>, <>You have 100 docs (1M tokens total). The window is 128K. You <strong>can&apos;t fit everything</strong>. Even if you could, most of it is irrelevant (e.g., warranty policy when the user asks about battery).</>],
            [<><strong>Cost</strong></>, <>gpt-4o-mini: $0.15 per 1M input tokens. If you paste 100K tokens every request (100 docs), that&apos;s $0.015 per call. 1000 calls = $15. With retrieval, you paste only 2K tokens (2 relevant chunks) ❓ $0.0003 per call. 50x cheaper.</>],
            [<><strong>Speed</strong></>, <>Longer context = slower. Reading 100K tokens takes ~5-10 seconds. Reading 2K tokens takes ~1 second. Users expect instant answers.</>],
            [<><strong>Quality</strong></>, <>LLMs lose focus in long contexts (&quot;lost in the middle&quot; problem). If the answer is buried in token 80,000, the model might miss it. Shorter, focused context = better answers.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>The naive fix works for SMALL doc sets</strong> (e.g., 1-3 short docs that fit in ~10K tokens). For anything larger, you need retrieval. RAG = smart, scalable version of &quot;paste the docs.&quot;
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="rag-idea" number="05" title="The RAG Idea P">
        <P>
          <strong>Retrieval-Augmented Generation (RAG)</strong> is a simple, powerful pattern:
        </P>
        <CodeBlock
          title="rag_pseudocode.txt"
          runnable={false}
          code={`1. User asks a question: "How long does the X1 battery last?"

2. RETRIEVE: Search your docs for RELEVANT chunks.
     ❓ Input: question
     ❓ Output: top 2-3 chunks (e.g., manual excerpt about battery)

3. STUFF: Build a prompt with the retrieved chunks + question.
     messages = [
       {"role": "system", "content": "Answer ONLY from the context below."},
       {"role": "user", "content": "Context: [chunk 1]\\n[chunk 2]\\n\\nQuestion: ..."}
     ]

4. GENERATE: Call the LLM. It reads the context, generates an answer.
     ❓ Output: "The X1 battery lasts 28 minutes."

                                                                
KEY IDEA:

You DON'T paste all docs (too big, too slow, too expensive).
You RETRIEVE only what's needed (2-3 chunks, ~2K tokens).
You AUGMENT the prompt with those chunks.
You let the LLM GENERATE the answer from the augmented context.

                                                                
WHY IT WORKS:

 Scalable: Works with 10 docs or 10,000 docs (retrieve top K, always).
 Cheap: Only paste 2K tokens (relevant chunks), not 100K (all docs).
 Fast: Small context = fast LLM inference (~1 sec).
 Accurate: Focused context = better answers (no "lost in the middle").
 Grounded: Answers cite real chunks. No hallucination (if chunks are right).

                                                                
THE MAGIC:

HOW do we "search for relevant chunks"?
  ❓ Embeddings + vector search (Chapter 3: Embeddings).

For now, understand the FLOW:
  Question ❓ Retrieve ❓ Stuff ❓ Generate ❓ Answer `}
        />
        <Callout type="analogy">
          🄍 <strong>Librarian analogy</strong>: You ask a librarian: &quot;What&apos;s the X1 battery life?&quot; She doesn&apos;t read all 10,000 books. She searches the index, finds the 2 relevant pages (manual p.14, FAQ p.3), hands them to you, and says &quot;read these.&quot; You read those 2 pages and answer. That&apos;s RAG. The librarian = retrieval. You reading = LLM generating from context.
        </Callout>
        <P>
          RAG is <strong>not</strong> a new model type. It&apos;s a <strong>design pattern</strong>. You use a normal LLM (gpt-4o-mini, Claude, Llama) + a search step. The LLM doesn&apos;t change. You change the PROMPT (add retrieved context).
        </P>
      </Section>

      {/* 06 */}
      <Section id="two-phases" number="06" title="The Two Phases: Ingest & Query">
        <P>
          RAG has <strong>two phases</strong>: INGEST (one-time setup) and QUERY (every user question).
        </P>
        <CodeBlock
          title="two_phases.txt"
          runnable={false}
          code={`PHASE 1: INGEST (offline, one-time  or when docs change)
                                                                
Goal: Prepare your docs for search.

Steps:
  1. LOAD documents (manual.md, faq.md, warranty.md)
     ❓ Raw text files, PDFs, web scrapes, etc.

  2. SPLIT into chunks (e.g., 500-word paragraphs)
     ❓ Why? Embeddings work best on paragraph-sized text.
     ❓ Example: manual.md (10 pages) ❓ 20 chunks.

  3. EMBED each chunk (text ❓ vector of 1536 floats)
     ❓ Use OpenAI's text-embedding-3-small API.
     ❓ Each chunk becomes a point in 1536-dimensional space.

  4. STORE embeddings in a vector database (FAISS, Chroma, Pinecone)
     ❓ Index = {chunk_text, chunk_embedding}
     ❓ Now you can search by similarity.

You do this ONCE (or when docs update). Result: a searchable index.

                                                                
PHASE 2: QUERY (online, every user request)
                                                                
Goal: Answer a user question.

Steps:
  1. EMBED the question ("How long does the X1 battery last?")
     ❓ Same embedding model (text-embedding-3-small).
     ❓ Question becomes a vector.

  2. SEARCH the index: find top K most similar chunks (K=2 or 3)
     ❓ Compare question vector vs all chunk vectors (cosine similarity).
     ❓ Top match: manual chunk about battery (score 0.89).

  3. RETRIEVE the text of those K chunks.
     ❓ chunk 1: "Nimbus X1 battery: 28 minutes flight time."
     ❓ chunk 2: "Charge time: 90 minutes with included adapter."

  4. STUFF chunks into the prompt:
     messages = [
       {"role": "system", "content": "Answer from context only."},
       {"role": "user", "content": "Context: [chunks]\\n\\nQ: ..."}
     ]

  5. GENERATE: Call LLM, get answer.
     ❓ "The X1 battery lasts 28 minutes."

  6. Return answer (+ optionally cite chunks).

                                                                
INGEST vs QUERY:

INGEST:  Slow, heavy (embed all docs), done ONCE.
QUERY:   Fast, light (embed 1 question, search, generate), done EVERY time.

You'll build both in later chapters. For now, remember the split. 🎯`}
        />
        <Table
          head={["Phase", "When", "What happens", "Cost"]}
          rows={[
            [<><strong>Ingest</strong></>, "Once (or when docs change)", <>Load ❓ Split ❓ Embed all chunks ❓ Store in vector DB</>, <>One-time: e.g., 10K chunks ❓ $0.00002/chunk (embedding cost) = $0.20</>],
            [<><strong>Query</strong></>, "Every user question", <>Embed question ❓ Search top K ❓ Stuff ❓ Generate</>, <>Per request: ~$0.0003 (embedding) + ~$0.0006 (LLM) = ~$0.001</>],
          ]}
        />
      </Section>

      {/* 07 */}
      <Section id="rag-vs-finetune" number="07" title="RAG vs Fine-Tuning">
        <P>
          Two ways to teach an LLM new facts: <strong>RAG</strong> vs <strong>fine-tuning</strong>. When do you use each?
        </P>
        <Table
          head={["Aspect", "RAG", "Fine-tuning"]}
          rows={[
            [<><strong>What it does</strong></>, <>Retrieves docs at query time, pastes into prompt. LLM reads &amp; answers.</>, <>Re-trains the model on YOUR data. Model learns patterns, facts, style.</>],
            [<><strong>When to use</strong></>, <>You have KNOWLEDGE (docs, FAQs, manuals) the model must reference. Facts change often (new products, updated specs).</>, <>You want to change model BEHAVIOR (tone, format, reasoning style). Facts are stable (e.g., medical guidelines from 2020).</>],
            [<><strong>Data freshness</strong></>, <🤅 Fresh: Update docs ❓ retrieval uses new data instantly (no retraining).</>, <>L Stale: Must re-train to update facts (slow, expensive).</>],
            [<><strong>Cost</strong></>, <>💰 Cheap: Embedding + inference = ~$0.001/query. No training cost.</>, <>💰💰💰 Expensive: Training gpt-4o-mini = $0.60-$2/1K examples. Plus GPU time.</>],
            [<><strong>Setup time</strong></>, <🧱 Fast: Ingest docs in minutes (embed + index). Query immediately.</>, <🧱❓❓ Slow: Prepare training data (weeks), train (hours/days), evaluate.</>],
            [<><strong>Transparency</strong></>, <🤅 Explainable: You see which chunks were retrieved. You can cite sources.</>, <>L Black box: Model &quot;knows&quot; facts but can&apos;t show where it learned them.</>],
            [<><strong>Hallucination risk</strong></>, <🤅 Low: If you retrieve good chunks and prompt &quot;answer ONLY from context,&quot; the model stays grounded.</>, <>L High: Model might still hallucinate if training didn&apos;t cover the question.</>],
            [<><strong>Example use case</strong></>, <>Support chatbot (10K docs, updated weekly), internal knowledge base, Q&amp;A over PDFs.</>, <>Customer service tone (train model to be formal/friendly), code completion (train on your codebase style).</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Rule of thumb</strong>: Use <strong>RAG</strong> for knowledge (facts, docs, changing data). Use <strong>fine-tuning</strong> for behavior (style, format, domain-specific reasoning). Often you do BOTH: fine-tune for tone, RAG for facts.
        </Callout>
        <P>
          For NimbusBot (support chatbot answering from docs), <strong>RAG is the right choice</strong>. Facts change (new products, updated specs), we need citations, and we want low cost. Fine-tuning would be overkill.
        </P>
      </Section>

      {/* 08 */}
      <Section id="what-build" number="08" title="What We&apos;ll Build: NimbusBot">
        <P>
          Across this 14-topic RAG course, we build <strong>NimbusBot</strong>  a support chatbot for <strong>Nimbus Gear</strong> (fictional drone company). It answers questions about the Nimbus X1 drone from 3 docs:
        </P>
        <Table
          head={["Doc", "Content examples"]}
          rows={[
            [<><IC>manual.md</IC></>, "Battery: 28 min flight time, 90 min charge. Range: 5 km. Weight: 795 g. Max wind: 38 km/h. Firmware updates via Nimbus app."],
            [<><IC>faq.md</IC></>, "Q: Can I fly in rain? A: No, X1 is not waterproof. Q: What's the max altitude? A: 120 m (regulatory limit)."],
            [<><IC>warranty.md</IC></>, "12-month warranty. 30-day returns. Covers manufacturing defects, not crash damage."],
          ]}
        />
        <P>
          <strong>Fixed facts (NEVER contradict these  used in examples across all 14 chapters):</strong>
        </P>
        <CodeBlock
          title="nimbus_x1_specs.txt"
          runnable={false}
          code={`Nimbus X1 Drone  Official Specs
                                                                
Battery flight time:    28 minutes (full charge)
Battery charge time:    90 minutes
Range:                  5 km
Weight:                 795 g
Max wind resistance:    38 km/h
Warranty:               12 months
Returns:                30 days (unused, original packaging)
Firmware updates:       Via Nimbus mobile app (iOS/Android)
Waterproof:             No (do NOT fly in rain)
Max altitude:           120 m (regulatory limit)

                                                                
CANONICAL TEST QUESTION:

Q: "How long does the X1 battery last?"
A: "About 28 minutes on a full charge."

This is the question we use to test RAG systems. The correct answer
is 28 minutes. Any other number = hallucination or wrong retrieval. 🎯`}
        />
        <P>
          <strong>Tech stack (used across the course):</strong>
        </P>
        <Table
          head={["Component", "Tool/Model"]}
          rows={[
            ["Chat LLM", <><IC>gpt-4o-mini</IC> (cheap, fast, good quality)</>],
            ["Embedding model", <><IC>text-embedding-3-small</IC> (1536 dimensions, $0.02/1M tokens)</>],
            ["Vector store", "FAISS (local, fast, free) or Chroma (easier API)"],
            ["Orchestration", "LangChain (later chapters) and pure Python (early chapters)"],
            ["API key", <><IC>OPENAI_API_KEY</IC> environment variable (get from platform.openai.com)</>],
          ]}
        />
        <P>
          We start with pure Python (no libraries) to understand the mechanics, then level up to LangChain for production patterns.
        </P>
      </Section>

      {/* 09 */}
      <Section id="vocabulary" number="09" title="RAG Vocabulary">
        <P>
          Learn the jargon. These terms appear in EVERY RAG tutorial/paper:
        </P>
        <Table
          head={["Term", "Definition"]}
          rows={[
            [<><strong>Embedding</strong></>, <>A vector (list of floats, e.g., 1536 numbers) representing text. Similar text ❓ similar vectors. Used for semantic search. Example: &quot;battery life&quot; and &quot;flight time&quot; have close embeddings.</>],
            [<><strong>Vector store / Vector DB</strong></>, <>A database optimized for storing &amp; searching embeddings. Examples: FAISS, Chroma, Pinecone, Weaviate. Supports similarity search (find top K nearest vectors).</>],
            [<><strong>Chunk</strong></>, <>A small piece of a document (e.g., 1 paragraph, 500 words, 1 page). You split docs into chunks before embedding. Why? Embeddings work best on focused text (not entire 50-page PDFs).</>],
            [<><strong>Retriever</strong></>, <>The component that searches the vector store. Input: query (text or embedding). Output: top K chunks (ranked by similarity). Example: &quot;battery&quot; query retrieves battery-related chunks.</>],
            [<><strong>Context</strong></>, <>The retrieved chunks you paste into the LLM prompt. The LLM reads this context to answer. Synonym: &quot;grounding text.&quot; Example: Context = manual excerpt about battery.</>],
            [<><strong>Grounding</strong></>, <>Making the LLM answer from PROVIDED context (retrieved docs) instead of guessing from training. Grounded answer = based on real chunks. Opposite = hallucination.</>],
            [<><strong>Hallucination</strong></>, <>When the LLM generates plausible but WRONG information (not in context, not factual). Example: &quot;X1 battery lasts 45 min&quot; (real = 28). RAG reduces hallucination by grounding.</>],
            [<><strong>Top-K retrieval</strong></>, <>Fetch the K most similar chunks (e.g., K=3). You don&apos;t retrieve ALL chunks (too many), just the top-scoring ones. Typical K: 2-5.</>],
            [<><strong>Cosine similarity</strong></>, <>A metric to compare two vectors (0 = unrelated, 1 = identical). Used to rank chunks by relevance. Example: question embedding vs chunk embedding ❓ score 0.89 (very relevant).</>],
            [<><strong>Semantic search</strong></>, <>Search by MEANING, not keywords. Uses embeddings. Example: &quot;How long can it fly?&quot; retrieves &quot;battery flight time 28 minutes&quot; (different words, same meaning).</>],
            [<><strong>INGEST</strong></>, <>The offline phase: load docs ❓ split ❓ embed ❓ store. Done once (or when docs change). Prepares the retrieval index.</>],
            [<><strong>QUERY</strong></>, <>The online phase: embed question ❓ retrieve ❓ stuff ❓ generate. Done every user request. Fast (~1 sec).</>],
          ]}
        />
        <Callout type="note">
          🗌 <strong>Memorize these terms</strong>. Interviews, docs, papers all use this vocab. If someone says &quot;our retriever uses cosine similarity over text-embedding-3-small vectors&quot;, you now know exactly what that means.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="toy-rag" number="10" title="Toy RAG in 30 Lines (Pure Python)">
        <P>
          Let&apos;s build a <strong>toy RAG system</strong> in pure Python. No APIs, no embeddings (yet)  just <strong>keyword overlap scoring</strong>. Goal: retrieve the best chunk for the battery question.
        </P>
        <CodeBlock
          title="toy_rag.py"
          code={`# Toy RAG: keyword-based retrieval (no embeddings, no LLM  just the idea)

# Step 1: Our "database" = 3 hardcoded doc chunks
DOCS = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge. Charge time is 90 minutes.",
    "The X1 has a range of 5 km and weighs 795 grams. Maximum wind resistance is 38 km/h.",
    "Warranty is 12 months. Returns accepted within 30 days if unused and in original packaging."
]

# Step 2: Retrieval function (keyword overlap = poor man's similarity)
def retrieve(question, docs, top_k=1):
    # Tokenize question into words (lowercased)
    q_words = set(question.lower().split())

    scores = []
    for doc in docs:
        # Tokenize doc into words
        d_words = set(doc.lower().split())
        # Overlap = number of shared words
        overlap = len(q_words & d_words)
        scores.append(overlap)

    # Sort docs by score (descending)
    ranked = sorted(zip(scores, docs), reverse=True)
    # Return top K
    return [doc for score, doc in ranked[:top_k]]

# Step 3: Test with the canonical battery question
question = "How long does the X1 battery last?"
chunks = retrieve(question, DOCS, top_k=1)

print("Question:", question)
print("\\nRetrieved chunk:")
print(chunks[0])

#                                                                 
# Manual overlap calculation (for learning):

q_words = set("how long does the x1 battery last?".lower().split())
# q_words = {'how', 'long', 'does', 'the', 'x1', 'battery', 'last?'}

doc0_words = set("nimbus x1 battery provides 28 minutes of flight time on a full charge. charge time is 90 minutes.".lower().split())
# doc0_words = {'nimbus', 'x1', 'battery', 'provides', '28', 'minutes', 'of', 'flight', 'time', 'on', 'a', 'full', 'charge.', 'charge', 'time', 'is', '90', 'minutes.'}

overlap0 = len(q_words & doc0_words)  # shared: 'x1', 'battery' ❓ overlap = 2

doc1_words = set("the x1 has a range of 5 km and weighs 795 grams. maximum wind resistance is 38 km/h.".lower().split())
overlap1 = len(q_words & doc1_words)  # shared: 'the', 'x1' ❓ overlap = 2

doc2_words = set("warranty is 12 months. returns accepted within 30 days if unused and in original packaging.".lower().split())
overlap2 = len(q_words & doc2_words)  # shared: (none) ❓ overlap = 0

# Doc 0 ties with Doc 1 (overlap=2), but Doc 0 comes first, so it wins.
# Tie-breaking: first match wins (or use doc length, etc.).

print("\\nScores: [2, 2, 0] ❓ Doc 0 retrieved ")`}
          output={`Question: How long does the X1 battery last?

Retrieved chunk:
Nimbus X1 battery provides 28 minutes of flight time on a full charge. Charge time is 90 minutes.

Scores: [2, 2, 0] ❓ Doc 0 retrieved `}
        />
        <P>
          <strong>What happened?</strong> The question shares 2 words with Doc 0 (&quot;x1&quot;, &quot;battery&quot;) and 2 with Doc 1 (&quot;the&quot;, &quot;x1&quot;). Tie ❓ first wins. Doc 0 is the right chunk (contains &quot;28 minutes&quot;). <strong>Retrieval worked!</strong>
        </P>
        <Callout type="mistake">
          ❓ <strong>Keyword overlap FAILS on paraphrases</strong>. If the user asks &quot;How long can it fly?&quot; (different words, same meaning), this retriever scores 0 overlap with Doc 0. It would fail. <strong>Embeddings fix this</strong>  they capture meaning, not just keywords. Chapter 3 covers embeddings.
        </Callout>
        <P>
          This toy RAG is <strong>not production-ready</strong>, but it shows the <strong>core loop</strong>: rank docs by relevance, pick the top one, return it. Real RAG uses embeddings + vector search instead of keyword overlap.
        </P>
      </Section>

      {/* 11 */}
      <Section id="misconceptions" number="11" title="Common Misconceptions">
        <Callout type="mistake">
          ❓ <strong>Misconception 1: &quot;RAG retrains the LLM on my data.&quot;</strong>
        </Callout>
        <P>
          <strong>FALSE.</strong> RAG does <strong>NOT</strong> retrain the model. The model weights never change. You just <strong>change the PROMPT</strong> (add retrieved chunks). The LLM reads the chunks at inference time. No training, no fine-tuning, no gradient updates.
        </P>
        <Callout type="mistake">
          ❓ <strong>Misconception 2: &quot;The LLM searches the database.&quot;</strong>
        </Callout>
        <P>
          <strong>FALSE.</strong> The LLM does <strong>NOT</strong> search. <strong>YOUR code</strong> (the retriever) searches the vector store, retrieves chunks, and pastes them into the prompt. The LLM just reads the prompt and generates text. It has no access to the database.
        </P>
        <Callout type="mistake">
          ❓ <strong>Misconception 3: &quot;RAG eliminates hallucination.&quot;</strong>
        </Callout>
        <P>
          <strong>PARTIALLY TRUE.</strong> RAG <strong>reduces</strong> hallucination by grounding answers in real chunks. BUT: if retrieval fails (wrong chunks), the LLM might still hallucinate. You must ensure good retrieval (chunk quality, embedding model, top-K tuning).
        </P>
        <Callout type="mistake">
          ❓ <strong>Misconception 4: &quot;Embeddings are just word counts.&quot;</strong>
        </Callout>
        <P>
          <strong>FALSE.</strong> Embeddings capture <strong>semantic meaning</strong>, not word frequency. &quot;How long can it fly?&quot; and &quot;battery flight time&quot; share ZERO words, but their embeddings are close (high cosine similarity). Keyword search would miss this. Embeddings catch it.
        </P>
        <Callout type="tip">
          💡 <strong>What RAG IS</strong>: A design pattern where you retrieve relevant docs and paste them into the LLM prompt. What RAG ISN&apos;T: A model type, a training method, or a replacement for databases. It&apos;s middleware between your data and the LLM.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Extend the toy RAG retriever
                                                                

TASK 1: Add 3 more doc chunks
  Add these to the DOCS list:
    "Firmware updates are delivered via the Nimbus mobile app for iOS and Android."
    "Do not fly the X1 in rain. It is not waterproof and may be damaged."
    "Maximum altitude is 120 meters due to regulatory limits."

  Verify: DOCS list has 6 items total.

TASK 2: Test the warranty question
  Question: "Can I return the X1?"
  Expected retrieved chunk: "Warranty is 12 months. Returns accepted within 30 days..."

  Run:
    question = "Can I return the X1?"
    chunks = retrieve(question, DOCS, top_k=1)
    print(chunks[0])

  Check: Did it retrieve the warranty chunk? (It should  "return" and "x1" overlap.)

TASK 3: Test a paraphrase (will FAIL with keyword overlap)
  Question: "How long can it fly?"
  Expected: Should retrieve battery chunk (28 min).
  Actual: Will likely retrieve wind/range chunk or score 0 (no keyword overlap).

  This shows the LIMIT of keyword retrieval. Embeddings fix this (Chapter 3).

TASK 4: Improve the scorer (bonus)
  Current scorer counts raw overlap. Problem: common words ("the", "is") inflate scores.
  Improve: Filter stop words before scoring.

  stop_words = {"the", "a", "is", "does", "can", "it", "in", "on", "and", "or"}
  q_words = set(question.lower().split()) - stop_words
  d_words = set(doc.lower().split()) - stop_words

  Test: Does this improve ranking?

TASK 5: Return top-3 chunks instead of top-1
  Modify top_k=3. Print all 3 retrieved chunks.
  Observation: The LLM would read all 3 as context. More context = better coverage,
  but also more cost (longer prompt) and noise (irrelevant chunks).

                                                                
LEARNING GOALS:

- Understand retrieval = ranking + selection.
- See keyword overlap's limits (paraphrases fail).
- Appreciate why embeddings are needed (Chapter 3).
- Practice tuning top-K (trade-off: recall vs precision).`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is RAG?", "Retrieval-Augmented Generation. A design pattern where you retrieve relevant doc chunks from a vector store, paste them into the LLM prompt as context, and let the LLM generate grounded answers. It prevents hallucination by grounding responses in real data."],
            ["Why do LLMs hallucinate?", "LLMs are trained on a frozen snapshot of public data. They never saw YOUR private docs (manuals, databases). When asked about facts not in training data, they guess based on patterns  generating plausible but wrong answers. RAG fixes this by feeding real docs at query time."],
            ["What is the context window?", "The input area where you paste messages (system, user, assistant). The LLM only sees what's in this window  it has zero access to your hard drive, the internet, or past conversations (unless you resend them). Context window size: e.g., 128K tokens for gpt-4o-mini."],
            ["Why not paste all docs into the prompt?", "Three reasons: (1) Context limit  you can't fit 10,000 docs (millions of tokens) in a 128K window. (2) Cost  longer prompts = higher $ per call. (3) Quality  LLMs lose focus in long contexts ('lost in the middle'). Retrieval solves this: paste only top 2-3 relevant chunks."],
            ["What are the two phases of RAG?", "INGEST (offline): Load docs ❓ split into chunks ❓ embed ❓ store in vector DB. Done once. QUERY (online): Embed question ❓ search top K chunks ❓ stuff into prompt ❓ generate answer. Done every request."],
            ["RAG vs fine-tuning  when to use each?", "Use RAG for KNOWLEDGE (facts, docs, changing data)  it's cheap, fresh, explainable. Use fine-tuning for BEHAVIOR (tone, style, reasoning)  it changes how the model talks, not what it knows. Often you do both: fine-tune tone, RAG for facts."],
            ["What is an embedding?", "A vector (list of floats, e.g., 1536 numbers) representing text. Similar text ❓ similar vectors. Used for semantic search. Example: 'battery life' and 'flight time' are close in embedding space (high cosine similarity), even if they share no words."],
            ["What is a chunk?", "A small piece of a document (e.g., 1 paragraph, 500 words). You split docs into chunks before embedding because embeddings work best on focused text (not entire 50-page PDFs). Chunking is an art: too small = loss of context, too large = diluted meaning."],
            ["What is grounding?", "Making the LLM answer from PROVIDED context (retrieved chunks) instead of guessing from training. Grounded answer = based on real docs. Opposite = hallucination. Prompt design is key: 'Answer ONLY from the context below. If not in context, say I don't know.'"],
            ["Does RAG eliminate hallucination?", "No, but it reduces it significantly. RAG grounds answers in real chunks. BUT: if retrieval fails (wrong chunks, bad embeddings, low top-K), the LLM might still hallucinate or say 'not in context.' Good RAG = good retrieval + good prompt engineering."],
            ["What is top-K retrieval?", "Fetching the K most similar chunks (e.g., K=3). You don't retrieve ALL chunks (too many, too noisy), just the top-scoring ones (by cosine similarity). Typical K: 2-5. Trade-off: higher K = better recall (more likely to include the answer), but more cost (longer prompt) and noise."],
            ["What is the toy RAG's limitation?", "It uses keyword overlap (count shared words). This FAILS on paraphrases: 'How long can it fly?' shares zero words with 'battery flight time 28 minutes', so it scores 0 (wrong). Embeddings fix this  they capture meaning, not just keywords. That's why real RAG uses embeddings."],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["RAG definition", "Retrieval-Augmented Generation: retrieve chunks ❓ stuff into prompt ❓ generate grounded answer"],
            ["Why LLMs hallucinate", "Trained on frozen snapshot, no access to YOUR docs ❓ guess plausible but wrong facts"],
            ["Context window", "Input area for LLM (128K tokens for gpt-4o-mini)  only sees what you paste, nothing else"],
            ["Naive fix problem", "Paste all docs ❓ hits context limit, high cost, slow, 'lost in the middle' quality issue"],
            ["RAG phases", "INGEST (load❓split❓embed❓store, once) + QUERY (embed Q❓search❓stuff❓generate, every request)"],
            ["Embedding", "Vector (1536 floats) representing text  similar text ❓ similar vectors (semantic search)"],
            ["Chunk", "Small doc piece (1 paragraph, ~500 words)  embed chunks, not whole docs (focus matters)"],
            ["Grounding", "LLM answers from PROVIDED context (retrieved chunks), not training data ❓ prevents hallucination"],
            ["Top-K retrieval", "Fetch K most similar chunks (e.g., K=3)  trade-off: recall vs cost/noise"],
            ["RAG vs fine-tune", "RAG for knowledge (facts, docs, fresh data), fine-tuning for behavior (tone, style)"],
            ["Toy RAG limit", "Keyword overlap fails on paraphrases  embeddings needed for semantic search"],
            ["Canonical test Q", "How long does the X1 battery last? ❓ Correct answer: 28 minutes (NimbusBot spec)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
