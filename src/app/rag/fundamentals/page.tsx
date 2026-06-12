"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "RAG retrieves, then generates",
  nodes: [
    { id: "question", icon: "❓", label: "Question", sub: "How long…?", x: 10, y: 50, color: "#22d3ee" },
    { id: "embed", icon: "🧲", label: "Embed query", sub: "→ vector", x: 28, y: 50, color: "#a78bfa" },
    { id: "store", icon: "🗄️", label: "Vector store", sub: "3 docs embedded", x: 50, y: 30, color: "#fb923c" },
    { id: "retrieve", icon: "🔍", label: "Search", sub: "top match", x: 70, y: 30, color: "#fbbf24" },
    { id: "prompt", icon: "📝", label: "Build prompt", sub: "context + query", x: 50, y: 70, color: "#34d399" },
    { id: "llm", icon: "🤖", label: "LLM", sub: "gpt-4o-mini", x: 70, y: 70, color: "#60a5fa" },
    { id: "answer", icon: "✅", label: "Answer", sub: "28 minutes", x: 90, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "q-embed", from: "question", to: "embed", color: "#22d3ee" },
    { id: "embed-retrieve", from: "embed", to: "retrieve", bend: -40, color: "#a78bfa" },
    { id: "store-retrieve", from: "store", to: "retrieve", color: "#fb923c" },
    { id: "retrieve-prompt", from: "retrieve", to: "prompt", color: "#fbbf24" },
    { id: "q-prompt", from: "question", to: "prompt", bend: 50, dashed: true, color: "#22d3ee" },
    { id: "prompt-llm", from: "prompt", to: "llm", color: "#34d399" },
    { id: "llm-answer", from: "llm", to: "answer", color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Battery question → correct answer",
      command: "How long does the X1 battery last?",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User asks: 'How long does the X1 battery last?' This is a factual question about YOUR docs — the LLM wasn't trained on Nimbus Gear!" },
        { node: "embed", paths: ["embed-retrieve"], text: "The question is embedded into a vector (1536 numbers) using text-embedding-3-small. This captures the MEANING of the question, not just keywords." },
        { node: "store", paths: ["store-retrieve"], text: "The vector store holds embeddings of manual.md, faq.md, warranty.md — split into chunks. Each chunk has a pre-computed vector." },
        { node: "retrieve", paths: ["retrieve-prompt"], text: "Cosine similarity: the question vector is compared to all chunk vectors. The manual chunk 'X1 battery provides 28 minutes of flight time' scores highest → retrieved!" },
        { node: "prompt", paths: ["q-prompt", "prompt-llm"], text: "Build the prompt: system instruction ('Answer using the context below') + retrieved chunk (manual excerpt) + user question. The LLM gets BOTH the question AND the answer snippet!" },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini reads the prompt. It sees the manual chunk mentions '28 minutes' and the question asks about battery. It generates: 'The X1 battery lasts about 28 minutes.'" },
        { node: "answer", paths: [], text: "User receives a GROUNDED answer — the LLM cited the context you provided. No hallucination! ✅ RAG works because retrieval found the right chunk." },
      ],
    },
    {
      id: "fail",
      name: "❌ No RAG → hallucination",
      command: "How long does the X1 battery last? (no retrieval)",
      steps: [
        { node: "question", paths: ["q-prompt"], text: "Same question, but now we SKIP retrieval (no RAG). The question goes straight to the LLM without any context from your docs." },
        { node: "prompt", paths: ["prompt-llm"], text: "The prompt is ONLY the question: 'How long does the X1 battery last?' No manual chunk, no context. The LLM has never seen Nimbus Gear docs in training." },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini tries to answer anyway. It guesses based on patterns in training data: typical drone batteries last 20-45 min. It invents: 'The X1 battery lasts approximately 45 minutes.' ❌" },
        { node: "answer", paths: [], text: "WRONG! The real answer is 28 minutes. Without retrieval, the LLM hallucinated a plausible-sounding but INCORRECT answer. This is why RAG exists." },
      ],
    },
    {
      id: "power",
      name: "⚡ Follow-up with chat history",
      command: "Follow-up: What about wind resistance?",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User follows up: 'What about wind resistance?' This question lacks context — wind resistance of WHAT? We need chat history." },
        { node: "embed", paths: ["embed-retrieve"], text: "Embed the follow-up question. But also: the RAG system remembers the prior turn ('X1 battery') and can embed BOTH the history and the new question for better retrieval." },
        { node: "store", paths: ["store-retrieve"], text: "The vector store still has all 3 docs. We search again, this time for content related to 'wind resistance' in the Nimbus X1 context." },
        { node: "retrieve", paths: ["retrieve-prompt"], text: "Top match: the manual chunk 'X1 can handle winds up to 38 km/h.' The retriever found the right spec even though the question was vague!" },
        { node: "prompt", paths: ["q-prompt", "prompt-llm"], text: "Prompt includes: prior turn (Q: battery, A: 28 min) + retrieved chunk (wind spec) + current question. Now the LLM has full context." },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini sees the chat history (topic: X1 drone) and the retrieved spec. It answers: 'The X1 can handle winds up to 38 km/h.' Grounded + coherent!" },
        { node: "answer", paths: [], text: "Multi-turn RAG! The system retrieved the right chunk by combining history + query, and the LLM generated a contextual answer. This is production RAG. ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why LLMs Hallucinate" },
  { id: "what-llm", label: "What an LLM Is (in 5 Minutes)" },
  { id: "context-window", label: "The Context Window" },
  { id: "naive", label: "The Naive Fix: Paste Docs" },
  { id: "rag-idea", label: "The RAG Idea ⭐" },
  { id: "two-phases", label: "Two Phases: Ingest & Query ⭐" },
  { id: "rag-vs-ft", label: "RAG vs Fine-Tuning" },
  { id: "roadmap", label: "What We'll Build" },
  { id: "vocab", label: "Vocabulary" },
  { id: "toy-rag", label: "Toy RAG in 30 Lines" },
  { id: "misconceptions", label: "Common Misconceptions" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function RagFundamentalsPage() {
  return (
    <TopicShell
      icon="🧠"
      title="RAG from Zero — Why LLMs Need Retrieval"
      gradientWord="RAG"
      subtitle="Large Language Models are amazing, but they hallucinate facts they weren't trained on. Retrieval-Augmented Generation (RAG) solves this: retrieve the right documents, then generate answers grounded in YOUR data. You'll see the problem, the fix, and build your first RAG system from scratch."
      nav={NAV}
      badges={["🧠 Concepts", "🐍 Pure Python first", "💸 Cost math", "🎤 Interview-ready"]}
      next={{ icon: "🤖", label: "Calling LLMs from Python", href: "/rag/llm-apis" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why LLMs Hallucinate">
        <P>
          Imagine you ask ChatGPT: <strong>&quot;How long does the Nimbus X1 battery last?&quot;</strong> It might confidently reply: <em>&quot;The Nimbus X1 battery lasts approximately 45 minutes on a full charge.&quot;</em>
        </P>
        <P>
          Sounds great! Except the REAL answer is <strong>28 minutes</strong> (per the Nimbus Gear manual). The LLM just <strong>hallucinated</strong> — it made up a plausible-sounding but incorrect fact. Why?
        </P>
        <Table
          head={["Reason", "Explanation"]}
          rows={[
            ["Frozen training data", "GPT-4o-mini was trained on text from before its cutoff date (early 2024). It has NEVER seen your Nimbus Gear docs. Nimbus is a fictional company we made up — it doesn't exist in the training set!"],
            ["Pattern-based guessing", "The model learned that 'drone batteries last 20-45 minutes' from thousands of web pages. When you ask about the X1, it guesses a number in that range. It's predicting the NEXT TOKEN, not searching a database."],
            ["No access to YOUR data", "Your company docs (manual.md, faq.md, warranty.md) are private. The LLM can't read your hard drive or your database. It only knows what was in its training corpus."],
            ["Confident tone", "LLMs are trained to sound helpful and confident. They don't say 'I don't know' — they generate the most likely completion. This makes hallucinations dangerous: they LOOK correct."],
          ]}
        />
        <P>
          <strong>The hallucination problem:</strong> You can&apos;t trust the LLM to answer questions about YOUR docs, YOUR products, YOUR database. It will confidently invent facts. This is not a bug — it&apos;s how next-token prediction works. We need a solution.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Thinking GPT-4 &quot;knows everything.&quot; It knows patterns from its training data (billions of web pages, books). It does NOT know: your internal docs, real-time data (stock prices, today&apos;s weather), or anything after its cutoff date. If you ask about those, it will hallucinate or refuse. RAG fixes this.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-llm" number="02" title="What an LLM Is (in 5 Minutes)">
        <P>
          Before we fix hallucinations, understand what an LLM actually does: <strong>next-token prediction</strong>.
        </P>
        <CodeBlock
          title="token_demo.py"
          code={`# Tokens are words/subwords. The LLM splits text into tokens:
text = "How long does the X1 battery last?"

# Rough split (real tokenizers are fancier, but this is the idea):
tokens = ["How", " long", " does", " the", " X", "1", " battery", " last", "?"]

print(f"Text: {text}")
print(f"Tokens: {tokens}")
print(f"Token count: {len(tokens)}")`}
          output={`Text: How long does the X1 battery last?
Tokens: ['How', ' long', ' does', ' the', ' X', '1', ' battery', ' last', '?']
Token count: 9`}
        />
        <P>
          The LLM reads these 9 tokens and predicts the NEXT token. If you paste a manual chunk before the question, the LLM sees more tokens and uses them to predict a better answer. That&apos;s all it does: <IC>P(next_token | previous_tokens)</IC>.
        </P>
        <Callout type="analogy">
          🌍 <strong>Real-world analogy</strong>: An LLM is like autocomplete on your phone, but with a MASSIVE brain. You type &quot;How long does the X1&quot; and it predicts &quot;battery last?&quot; based on patterns it learned from billions of sentences. It&apos;s not searching Google. It&apos;s not reading a manual in real-time. It&apos;s completing the sequence it thinks is most likely. If the manual was in its training data, great. If not, it guesses.
        </Callout>
        <P>
          <strong>Why this matters for RAG:</strong> The LLM can ONLY see what you put in the prompt. If you paste the manual excerpt <em>&quot;X1 battery provides 28 minutes of flight time&quot;</em> before the question, the LLM will see it and predict <em>&quot;28 minutes&quot;</em> as the next tokens. That&apos;s the trick: <strong>give it the answer in the prompt</strong>. RAG is the system that retrieves the right excerpt to paste.
        </P>
      </Section>

      {/* 03 */}
      <Section id="context-window" number="03" title="The Context Window">
        <P>
          The LLM can only see a LIMITED number of tokens at once — the <strong>context window</strong>. This is a hard limit set by the model&apos;s architecture.
        </P>
        <Table
          head={["Model", "Context window", "Equivalent text"]}
          rows={[
            [<IC>gpt-4o-mini</IC>, "128,000 tokens", "~300 pages of text (a short novel)"],
            [<IC>gpt-4o</IC>, "128,000 tokens", "~300 pages"],
            [<IC>claude-3-5-sonnet</IC>, "200,000 tokens", "~500 pages"],
            [<IC>gpt-3.5-turbo</IC>, "16,000 tokens", "~40 pages (older model, smaller window)"],
          ]}
        />
        <P>
          <strong>Why you can&apos;t just paste everything:</strong>
        </P>
        <CodeBlock
          title="context_limit_demo.txt"
          runnable={false}
          code={`YOUR COMPANY KNOWLEDGE BASE:
  - 500 product manuals (5,000 pages)
  - 10,000 support tickets
  - Internal wiki (2,000 articles)

TOTAL TOKENS: ~10 million

gpt-4o-mini context window: 128,000 tokens

❌ You CAN'T paste all 10M tokens. The model will reject it.

NAIVE IDEA: "Just paste all the manuals!"
REALITY: You'll hit the context limit after ~15 manuals. The rest are ignored.

SOLUTION: RAG retrieves ONLY the 3-5 RELEVANT chunks (500 tokens total).
The LLM sees a tiny, focused context and generates accurate answers. ✅`}
        />
        <Callout type="note">
          📌 Even if you could paste 10 million tokens, it would be SLOW and EXPENSIVE. gpt-4o-mini charges per token: $0.15 per 1M input tokens. 10M tokens = $1.50 PER REQUEST. RAG retrieves 500 tokens → $0.000075 per request. That&apos;s a 20,000× cost reduction. RAG isn&apos;t just about accuracy — it&apos;s about economics.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="naive" number="04" title="The Naive Fix: Paste Docs">
        <P>
          Before we get fancy, let&apos;s try the SIMPLEST solution: paste the relevant manual excerpt directly into the prompt. No retrieval, no embeddings — just copy-paste.
        </P>
        <CodeBlock
          title="naive_fix.py"
          code={`# Hardcode the manual excerpt (we know it has the battery info)
manual_excerpt = """
Nimbus X1 Drone — Technical Specifications
Battery: Lithium-polymer, 3200 mAh
Flight time: 28 minutes on full charge
Range: 5 km line-of-sight
Weight: 795 grams
Max wind resistance: 38 km/h
"""

question = "How long does the X1 battery last?"

# Paste the excerpt BEFORE the question in the prompt
prompt = f"""Answer the question using the context below.

Context:
{manual_excerpt}

Question: {question}

Answer:"""

print(prompt)`}
          output={`Answer the question using the context below.

Context:

Nimbus X1 Drone — Technical Specifications
Battery: Lithium-polymer, 3200 mAh
Flight time: 28 minutes on full charge
Range: 5 km line-of-sight
Weight: 795 grams
Max wind resistance: 38 km/h


Question: How long does the X1 battery last?

Answer:`}
        />
        <P>
          Now imagine you send this prompt to <IC>gpt-4o-mini</IC>. The model reads the context, sees <em>&quot;Flight time: 28 minutes&quot;</em>, and generates: <strong>&quot;The X1 battery lasts 28 minutes on a full charge.&quot;</strong> ✅ CORRECT!
        </P>
        <P>
          <strong>Why this works:</strong> The LLM is good at reading comprehension. If the answer is IN the prompt, it will find it. We &quot;grounded&quot; the model by giving it the source text.
        </P>
        <P>
          <strong>Why this DOESN&apos;T scale:</strong>
        </P>
        <Table
          head={["Problem", "Example"]}
          rows={[
            ["You have 100 docs", "Which excerpt do you paste? You can't paste all 100 (context limit + cost)."],
            ["The question is vague", <>&quot;Tell me about the X1.&quot; → Do you paste the manual? The FAQ? The warranty? All three? You need to SEARCH first.</> ],
            ["You have 10,000 support tickets", "Impossible to manually pick the right 3 tickets to paste. You need AUTOMATED retrieval."],
            ["Real-time data", "User asks about yesterday's order. You need to query a database, not paste static text."],
          ]}
        />
        <P>
          <strong>The insight:</strong> Pasting works, but ONLY IF you paste the right chunk. The hard problem is: <strong>how do you automatically find the right chunk?</strong> That&apos;s what RAG solves.
        </P>
      </Section>

      {/* 05 */}
      <Section id="rag-idea" number="05" title="The RAG Idea ⭐">
        <P>
          <strong>Retrieval-Augmented Generation</strong> (RAG) is a two-step process:
        </P>
        <CodeBlock
          title="rag_idea.txt"
          runnable={false}
          code={`STEP 1: RETRIEVAL
  Given a question, SEARCH your documents and find the 3-5 most relevant chunks.
  Example: "How long does the X1 battery last?"
    → Retrieve the manual chunk about battery specs.

STEP 2: GENERATION
  Paste the retrieved chunks into the prompt (like the naive fix).
  The LLM reads the chunks and generates an answer grounded in YOUR docs.

────────────────────────────────────────────────────────────────
WHY "AUGMENTED"?
  The LLM's generation is AUGMENTED (enhanced) by retrieval.
  Without retrieval: hallucination.
  With retrieval: grounded, accurate answers. ✅

────────────────────────────────────────────────────────────────
THE MAGIC:
  Retrieval is AUTOMATIC. You don't manually pick chunks.
  The system uses EMBEDDINGS (vectors) to measure similarity:
    question vector ≈ document chunk vector → high score → retrieve it!

  We'll learn embeddings in 3 pages. For now, trust: it's like semantic search.`}
        />
        <Callout type="analogy">
          🌍 <strong>Library analogy</strong>: You walk into a library (10,000 books) and ask the librarian: &quot;How do I fix a leaky faucet?&quot; The librarian doesn&apos;t hand you all 10,000 books. She doesn&apos;t read every book herself. She RETRIEVES the 3 books about plumbing, hands them to you, and says &quot;Check chapter 4.&quot; You (the reader) then GENERATE an answer by reading those 3 books. The librarian is the <strong>retriever</strong>, you are the <strong>generator</strong> (LLM). RAG is the librarian + you working together.
        </Callout>
        <P>
          <strong>Why RAG beats fine-tuning for knowledge:</strong> Fine-tuning updates the model&apos;s weights (expensive, slow, bakes in facts that go stale). RAG keeps the model frozen and swaps out the DOCUMENTS (cheap, fast, always fresh). If the battery spec changes to 30 minutes, you update <IC>manual.md</IC> and re-ingest. Done. No retraining.
        </P>
      </Section>

      {/* 06 */}
      <Section id="two-phases" number="06" title="Two Phases: Ingest & Query ⭐">
        <P>
          RAG has TWO workflows. You run INGEST once (when you add docs), then QUERY many times (every user question).
        </P>
        <CodeBlock
          title="two_phases.txt"
          runnable={false}
          code={`PHASE 1: INGEST (run once per document update)
  ┌─────────────────────────────────────────────────┐
  │ 1. LOAD docs (manual.md, faq.md, warranty.md)  │
  │ 2. SPLIT into chunks (each ~500 tokens)        │
  │ 3. EMBED each chunk (text → 1536-D vector)     │
  │ 4. STORE vectors in a vector database          │
  └─────────────────────────────────────────────────┘
  Example: manual.md → 8 chunks → 8 vectors stored.

PHASE 2: QUERY (run every time a user asks a question)
  ┌─────────────────────────────────────────────────┐
  │ 1. EMBED the question (text → vector)          │
  │ 2. SEARCH the vector DB (cosine similarity)    │
  │ 3. RETRIEVE top 3 chunks                       │
  │ 4. STUFF chunks into prompt                    │
  │ 5. CALL the LLM (generate answer)              │
  └─────────────────────────────────────────────────┘
  Example: "How long does the X1 battery last?"
    → embed → search → retrieve manual chunk #3
    → prompt = context + question → LLM → "28 minutes"`}
        />
        <P>
          The <strong>INGEST</strong> phase is like indexing a book (table of contents). You do it ONCE. The <strong>QUERY</strong> phase is like looking up a page in the index. You do it EVERY TIME.
        </P>
        <Table
          head={["Phase", "When", "Tools", "Cost"]}
          rows={[
            [<>INGEST</>, "Once per doc change", "LangChain loaders, text splitters, OpenAI embeddings, FAISS/Chroma", <>Embeddings: ~$0.00008 per doc (cheap!)</>],
            [<>QUERY</>, "Every user question", "Embedding API, vector search, LLM API", <>Embedding: $0.000002, LLM: $0.0003 (per query)</>],
          ]}
        />
        <P>
          <strong>Why split into chunks?</strong> A 20-page manual is ~10,000 tokens. If you embed the whole thing as ONE vector, the embedding is diluted — it represents &quot;the average meaning of the manual.&quot; If you split into 20 chunks (500 tokens each), each chunk is FOCUSED: chunk 3 is JUST battery specs. When you search for &quot;battery,&quot; chunk 3 scores high, the others score low. Retrieval is precise. ✅
        </P>
      </Section>

      {/* 07 */}
      <Section id="rag-vs-ft" number="07" title="RAG vs Fine-Tuning">
        <P>
          Students often ask: <strong>&quot;Why not just fine-tune the model on my docs?&quot;</strong> Here&apos;s when to use each:
        </P>
        <Table
          head={["Aspect", "RAG", "Fine-tuning"]}
          rows={[
            ["Use case", <>Inject knowledge (facts, docs, database results)</>, <>Teach behavior/style/format (e.g., write like a pirate, output JSON)</>],
            ["Freshness", <>Update docs → re-ingest (minutes). Always current.</>, <>Update facts → retrain model (hours/days). Facts go stale.</>],
            ["Cost", <>Ingest: ~$0.0001 per doc. Query: ~$0.0003. Total: cents.</>, <>Training: $10-$1000+ depending on model size. High.</>],
            ["Explainability", <>You see WHICH chunks were retrieved → citations, debugging.</>, <>Black box. Can&apos;t see why it answered that way.</>],
            ["Context limit", <>Works with MILLIONS of docs (retrieve top 3).</>, <>Bakes in facts → can&apos;t remember everything, limited by weights.</>],
            ["When to use", <>Q&A over docs, customer support, search, dynamic data.</>, <>Style transfer, domain-specific jargon, format compliance.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Interview tip</strong>: Interviewers love this question. Say: &quot;Fine-tuning teaches the model HOW to respond. RAG teaches it WHAT to respond with. For knowledge (facts, docs), RAG wins: cheaper, fresher, explainable. For behavior (tone, format), fine-tune. Often you do BOTH: fine-tune for style, RAG for facts.&quot;
        </Callout>
        <P>
          <strong>Example:</strong> A legal chatbot. Fine-tune on legal writing style (formal tone, case citation format). Use RAG to retrieve the actual case law from a database (millions of cases, updated daily). Best of both worlds.
        </P>
      </Section>

      {/* 08 */}
      <Section id="roadmap" number="08" title="What We&apos;ll Build">
        <P>
          Across the next 14 topics in this RAG track, we&apos;ll build <strong>NimbusBot</strong> — a support chatbot for Nimbus Gear (our fictional drone company). Here&apos;s the roadmap:
        </P>
        <Table
          head={["Topics 1-5", "Topics 6-10", "Topics 11-14"]}
          rows={[
            [<>🧠 Fundamentals (this page)</>, <>🗂️ Vector stores (FAISS, Chroma)</>, <>🔧 Advanced: reranking, hybrid search</>],
            [<>🤖 LLM APIs (OpenAI client)</>, <>🦜 LangChain basics</>, <>📊 Evaluation (RAGAS metrics)</>],
            [<>🧲 Embeddings & similarity</>, <>⛓️ Chains & memory</>, <>🚀 Production (FastAPI backend)</>],
            [<>📄 Loaders (Markdown, PDF)</>, <>💬 Chat with history</>, <>🎨 Streamlit UI</>],
            [<>✂️ Splitters (recursive, semantic)</>, <>🧭 Agents & tools</>, <>☁️ Deploy (Railway, Render)</>],
          ]}
        />
        <P>
          <strong>The 3 Nimbus docs</strong> (you&apos;ll download/create these in the hands-on labs):
        </P>
        <CodeBlock
          title="docs_overview.txt"
          runnable={false}
          code={`manual.md
  Technical specs: battery 28 min, range 5 km, weight 795g, wind 38 km/h.
  Setup guide: unbox → charge 90 min → pair with app → calibrate → fly.
  Firmware updates via the Nimbus mobile app.

faq.md
  Q: How do I update firmware? A: Via the Nimbus app, Settings → Check for Updates.
  Q: What if it won't pair? A: Hold power button 10 sec, reset Bluetooth, retry.
  Q: Warranty? A: 12 months from purchase. See warranty.md.

warranty.md
  12-month warranty covers manufacturing defects.
  30-day return policy (unused, original packaging).
  Shipping damage: contact support within 7 days.

────────────────────────────────────────────────────────────────
FIXED FACTS (never contradict in examples):
  - Nimbus X1: battery 28 min, range 5 km, weight 795g, wind 38 km/h
  - Warranty: 12 months
  - Returns: 30 days
  - Firmware: via mobile app
  - Charging time: 90 minutes (first charge)`}
        />
        <P>
          <strong>The canonical test question:</strong> <em>&quot;How long does the X1 battery last?&quot;</em> → correct answer: <strong>&quot;about 28 minutes&quot;</strong>. We&apos;ll use this across ALL 14 pages to test our RAG pipeline.
        </P>
      </Section>

      {/* 09 */}
      <Section id="vocab" number="09" title="Vocabulary">
        <P>
          RAG has its own jargon. Memorize these terms — they appear in EVERY tutorial and interview:
        </P>
        <Table
          head={["Term", "Definition"]}
          rows={[
            ["Embedding", <>A vector (list of numbers) representing text. <IC>text-embedding-3-small</IC> → 1536 floats. Similar text → similar vectors. Used for semantic search.</>],
            ["Vector store (vector DB)", <>A database optimized for storing and searching vectors. Examples: FAISS (in-memory), Chroma (persistent), Pinecone (cloud). Query: given a vector, find the top-k most similar vectors (cosine similarity).</>],
            ["Chunk", <>A piece of a document. Example: a 10-page manual split into 20 chunks (~500 tokens each). Each chunk is embedded separately. Retrieval fetches chunks, not whole docs.</>],
            ["Retriever", <>The system that searches the vector store. Input: a question (text). Output: top-k chunks (text). It embeds the question, searches, and returns the best matches.</>],
            ["Context", <>The retrieved chunks pasted into the prompt. The LLM reads the context to answer the question. Also called &quot;grounding text.&quot;</>],
            ["Grounding", <>Using retrieved text to constrain the LLM&apos;s answer. A &quot;grounded&quot; answer cites the context. Opposite of hallucination.</>],
            ["Hallucination", <>When the LLM invents facts not in the context or training data. Example: claiming X1 battery lasts 45 min when the manual says 28. RAG reduces hallucinations by providing context.</>],
            ["Ingest / indexing", <>The offline phase: load docs → split → embed → store. Run once per doc update.</>],
            ["Query / retrieval", <>The online phase: embed question → search → retrieve → generate. Run every time a user asks.</>],
          ]}
        />
      </Section>

      {/* 10 */}
      <Section id="toy-rag" number="10" title="Toy RAG in 30 Lines">
        <P>
          Let&apos;s build a TINY RAG system with NO libraries, NO API calls — pure Python. We&apos;ll use keyword overlap (not embeddings) to retrieve chunks. This is NOT production-quality, but it shows the RAG idea in executable code.
        </P>
        <CodeBlock
          title="toy_rag.py"
          code={`# Our 3 Nimbus docs (hardcoded chunks)
DOCS = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge.",
    "The X1 has a range of 5 km line-of-sight and weighs 795 grams.",
    "Warranty covers manufacturing defects for 12 months from purchase date.",
]

def keyword_score(question, doc):
    """Score based on shared words (lowercase, ignore punctuation)."""
    q_words = set(question.lower().replace("?", "").split())
    d_words = set(doc.lower().replace(".", "").replace(",", "").split())
    overlap = q_words & d_words
    return len(overlap)

def retrieve(question, docs, top_k=1):
    """Return top_k docs by keyword overlap."""
    scored = [(doc, keyword_score(question, doc)) for doc in docs]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, score in scored[:top_k]]

def rag(question):
    """Retrieve top chunk and print it (no LLM — we just show the retrieval)."""
    chunks = retrieve(question, DOCS, top_k=1)
    print(f"Question: {question}")
    print(f"Retrieved chunk: {chunks[0]}")
    print(f"(In real RAG, this chunk would be pasted into the LLM prompt.)\\n")

# Test 1: Battery question
rag("How long does the X1 battery last?")

# Test 2: Warranty question
rag("What is covered under warranty?")`}
          output={`Question: How long does the X1 battery last?
Retrieved chunk: Nimbus X1 battery provides 28 minutes of flight time on a full charge.
(In real RAG, this chunk would be pasted into the LLM prompt.)

Question: What is covered under warranty?
Retrieved chunk: Warranty covers manufacturing defects for 12 months from purchase date.
(In real RAG, this chunk would be pasted into the LLM prompt.)`}
        />
        <P>
          <strong>How it works:</strong>
        </P>
        <CodeBlock
          title="toy_rag_explained.txt"
          runnable={false}
          code={`STEP 1: keyword_score(question, doc)
  Question: "How long does the X1 battery last?"
  Doc 1: "Nimbus X1 battery provides 28 minutes..."
  Shared words: {"x1", "battery"} → 2 points

  Doc 2: "The X1 has a range of 5 km..."
  Shared words: {"x1"} → 1 point

  Doc 3: "Warranty covers manufacturing..."
  Shared words: {} → 0 points

STEP 2: retrieve()
  Sort by score: Doc 1 (2) > Doc 2 (1) > Doc 3 (0)
  Return top 1: Doc 1 ✅

STEP 3: rag()
  Print the retrieved chunk. In a real system, you'd paste this into:
    prompt = f"Context: {chunk}\\n\\nQuestion: {question}\\n\\nAnswer:"
  Then send prompt to gpt-4o-mini.

────────────────────────────────────────────────────────────────
WHY KEYWORD OVERLAP IS WEAK:
  Question: "How long can it fly?"
  Shared words with Doc 1: {} (no overlap! "fly" ≠ "flight", "long" ≠ "28")
  → Doc 1 scores 0. WRONG!

  Embeddings FIX this: "fly" and "flight time" are SEMANTICALLY similar.
  Cosine similarity would correctly match them. That's page 3. 🧲`}
        />
        <Callout type="note">
          📌 This toy RAG is 30 lines and demonstrates the core loop: retrieve → (would) generate. It fails on paraphrases (&quot;How long can it fly?&quot;), but it&apos;s a proof-of-concept. Real RAG uses embeddings (page 3) and LLM APIs (page 2). You&apos;ll upgrade this in the labs.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="misconceptions" number="11" title="Common Misconceptions">
        <Callout type="mistake">
          ⚠️ <strong>Misconception 1: &quot;RAG retrains the model.&quot;</strong>
        </Callout>
        <P>
          WRONG. RAG does NOT modify the LLM&apos;s weights. The model stays frozen. RAG changes the INPUT (the prompt) by pasting retrieved chunks. The model is still <IC>gpt-4o-mini</IC> — you just give it better context.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Misconception 2: &quot;The LLM searches the database.&quot;</strong>
        </Callout>
        <P>
          WRONG. The LLM does NOT search. YOUR CODE searches (the retriever). The LLM only reads the retrieved chunks from the prompt. The flow: question → retriever (your code) → vector DB → top chunks → paste into prompt → LLM reads prompt → generates answer. The LLM is the LAST step, not the searcher.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Misconception 3: &quot;RAG means no hallucinations.&quot;</strong>
        </Callout>
        <P>
          WRONG. RAG REDUCES hallucinations but doesn&apos;t eliminate them. If retrieval fails (no relevant chunks found), the LLM still generates an answer — possibly wrong. If the retrieved chunk is ambiguous, the LLM might misinterpret it. You need: good retrieval, clear prompts, and evaluation (RAGAS, topic 12).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Misconception 4: &quot;Embeddings are slow.&quot;</strong>
        </Callout>
        <P>
          WRONG. Embedding a question (10 tokens) via OpenAI API takes ~100ms. Searching 10,000 vectors with FAISS takes &lt;5ms (in-memory). The bottleneck is the LLM call (500-2000ms). Retrieval is FAST. That&apos;s why RAG scales: you search millions of docs but only send 3 chunks to the slow LLM.
        </P>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_instructions.txt"
          runnable={false}
          code={`LAB: Extend the toy RAG with 3 more chunks and a new question
──────────────────────────────────────────────────────────────

TASK 1: Add 3 more Nimbus doc chunks to DOCS
  Current: 3 chunks (battery, range, warranty)
  Add:
    - "The X1 can handle winds up to 38 km/h."
    - "Returns accepted within 30 days if unused and in original packaging."
    - "Firmware updates available via the Nimbus mobile app."

  Verify: DOCS has 6 elements.

TASK 2: Test the returns question
  Code:
    rag("Can I get my money back if I don't like it?")

  Expected retrieved chunk:
    "Returns accepted within 30 days if unused and in original packaging."

  Why? Shared words: {"i", "it"} are stopwords (low signal).
       Better match: "Returns" ≠ "money back" BUT we need more chunks.
       If it retrieves a different chunk, your keyword scorer is working —
       just not semantically smart. That's OK for now!

TASK 3: Test the wind question
  Code:
    rag("What wind speed can the X1 handle?")

  Expected: "The X1 can handle winds up to 38 km/h."
  Shared words: {"x1", "wind"} → should win.

TASK 4: Break it (edge case)
  Code:
    rag("How do I update the firmware?")

  Expected: Retrieves the firmware chunk.
  Shared words: {"update", "firmware"} → should match.

  If it fails (retrieves battery or warranty), add print statements to
  keyword_score to debug which words matched. This is how you debug retrieval!

TASK 5: Compute retrieval accuracy
  Test 5 questions:
    1. "How long does the X1 battery last?" → battery chunk ✅
    2. "Can I return it?" → returns chunk ✅
    3. "What about wind resistance?" → wind chunk ✅
    4. "How do I update firmware?" → firmware chunk ✅
    5. "What is the warranty period?" → warranty chunk ✅

  Count: X / 5 correct. If < 5, that's the keyword overlap limit.
  Embeddings (page 3) will fix this — they handle paraphrases.

──────────────────────────────────────────────────────────────
BONUS: Add a second retrieval strategy (word count)
  def length_score(question, doc):
      # Longer docs might have more info (naive heuristic)
      return len(doc.split())

  def retrieve_hybrid(question, docs, top_k=1):
      kw = [(doc, keyword_score(question, doc)) for doc in docs]
      ln = [(doc, length_score(question, doc)) for doc in docs]
      # Combine scores (0.7 keyword + 0.3 length)
      combined = {}
      for doc, score in kw:
          combined[doc] = 0.7 * score
      for doc, score in ln:
          combined[doc] = combined.get(doc, 0) + 0.3 * score
      sorted_docs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
      return [doc for doc, score in sorted_docs[:top_k]]

  Test: Does hybrid beat pure keyword? Compare accuracy on the 5 questions.`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is RAG?", "Retrieval-Augmented Generation: a technique where you retrieve relevant documents (chunks) for a user's question, paste them into the LLM prompt as context, and let the LLM generate an answer grounded in those docs. It fixes hallucinations by giving the model YOUR data at query time."],
            ["Why do LLMs hallucinate?", "LLMs predict the next token based on training data (a frozen snapshot). They don't have access to YOUR docs or real-time data. When asked about unknowns, they guess based on patterns, producing plausible but wrong facts. RAG fixes this by retrieving the answer and pasting it into the prompt."],
            ["What is the context window?", "The maximum number of tokens the LLM can see at once (input + output). gpt-4o-mini: 128k tokens (~300 pages). You can't paste all your docs — RAG retrieves the top 3-5 relevant chunks (500 tokens) instead of all 10 million tokens."],
            ["What are the two phases of RAG?", "INGEST (offline): load docs → split into chunks → embed (text → vectors) → store in vector DB. QUERY (online): embed question → search vector DB (cosine similarity) → retrieve top chunks → paste into prompt → LLM generates answer."],
            ["What is an embedding?", "A vector (list of floats) representing text's meaning. text-embedding-3-small → 1536 numbers. Similar text → similar vectors. Used for semantic search: embed question, compute cosine similarity to all doc vectors, retrieve top matches. Better than keyword search (handles paraphrases)."],
            ["What is a chunk?", "A piece of a document. A 10-page manual might be split into 20 chunks (~500 tokens each). Each chunk is embedded separately. Retrieval fetches chunks (not whole docs) because smaller chunks = more focused embeddings = better search precision."],
            ["RAG vs fine-tuning?", "RAG: inject knowledge (facts, docs). Cheap, fast, always fresh (update docs = re-ingest). Explainable (see retrieved chunks). Fine-tuning: teach behavior/style. Expensive, slow, facts go stale. Use RAG for knowledge, fine-tune for tone/format. Often combine: fine-tune for style, RAG for facts."],
            ["What is grounding?", "Using retrieved text to constrain the LLM's answer. A grounded answer cites the context (retrieved chunks), not training data. Opposite of hallucination. Example: 'The manual says the battery lasts 28 minutes' (grounded) vs 'I think it's 45 minutes' (hallucinated)."],
            ["What is a vector store?", "A database optimized for storing and searching vectors (embeddings). Examples: FAISS (in-memory, fast), Chroma (persistent), Pinecone (cloud). Query: given a vector, find the top-k most similar vectors using cosine similarity. Core of RAG retrieval."],
            ["How does retrieval work?", "1. Embed the question (text → vector). 2. Compute cosine similarity between question vector and all stored doc vectors. 3. Sort by similarity score (high = similar meaning). 4. Return top-k chunks (usually 3-5). 5. Paste them into the LLM prompt. The LLM reads them and answers."],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["RAG acronym", "Retrieval-Augmented Generation"],
            ["RAG in one sentence", "Retrieve relevant docs, paste into prompt, LLM generates grounded answer"],
            ["Why LLMs hallucinate", "Frozen training data, no access to YOUR docs, next-token prediction guesses"],
            ["Context window", "Max tokens LLM can see (gpt-4o-mini: 128k ≈ 300 pages)"],
            ["Ingest phase", "Load → split → embed → store (run once per doc update)"],
            ["Query phase", "Embed question → search → retrieve → stuff → generate (every query)"],
            ["Embedding", "Text → vector (1536 floats). Similar text → similar vectors"],
            ["Chunk", "Piece of a doc (~500 tokens). Embed each chunk separately for precision"],
            ["Vector store", "DB for vectors (FAISS, Chroma). Query: find top-k similar vectors"],
            ["Grounding", "Constraining LLM answer using retrieved text (opposite of hallucination)"],
            ["RAG vs fine-tuning", "RAG = knowledge (docs). Fine-tune = behavior (style). RAG: cheap, fresh"],
            ["Canonical test", "Q: 'How long does the X1 battery last?' A: '28 minutes' (from manual)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
