"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Hybrid retrieval merging vector + keyword paths",
  nodes: [
    { id: "question", icon: "❓", label: "Question", sub: "user query", x: 5, y: 50, color: "#22d3ee" },
    { id: "hub", icon: "🎯", label: "Retriever Hub", sub: "orchestrator", x: 25, y: 50, color: "#fb923c" },
    { id: "vector", icon: "🔢", label: "Vector Store", sub: "Chroma", x: 40, y: 20, color: "#a78bfa" },
    { id: "bm25", icon: "🔤", label: "BM25", sub: "keyword scoring", x: 40, y: 80, color: "#34d399" },
    { id: "rewriter", icon: "🔄", label: "LLM Rewriter", sub: "multi-query", x: 60, y: 50, color: "#f472b6" },
    { id: "ranked", icon: "📊", label: "Ranked Chunks", sub: "merged results", x: 75, y: 50, color: "#fbbf24" },
    { id: "topk", icon: "🏆", label: "Top-k", sub: "final 3", x: 90, y: 50, color: "#60a5fa" },
  ],
  edges: [
    { id: "question-hub", from: "question", to: "hub", color: "#22d3ee" },
    { id: "hub-vector", from: "hub", to: "vector", color: "#a78bfa" },
    { id: "hub-bm25", from: "hub", to: "bm25", color: "#34d399" },
    { id: "hub-rewriter", from: "hub", to: "rewriter", dashed: true, color: "#f472b6" },
    { id: "vector-ranked", from: "vector", to: "ranked", color: "#a78bfa" },
    { id: "bm25-ranked", from: "bm25", to: "ranked", color: "#34d399" },
    { id: "rewriter-vector", from: "rewriter", to: "vector", bend: -40, dashed: true, color: "#f472b6" },
    { id: "ranked-topk", from: "ranked", to: "topk", color: "#fbbf24" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Hybrid: vector + BM25 merge",
      command: "EnsembleRetriever([vector, bm25], weights=[0.5, 0.5])",
      steps: [
        { node: "question", paths: ["question-hub"], text: "User asks: \"How long can the X1 fly?\" (paraphrased — the manual says \"flight time\", not \"fly\"). Semantic similarity will work, but let's use hybrid for robustness." },
        { node: "hub", paths: ["hub-vector", "hub-bm25"], text: "EnsembleRetriever orchestrates TWO retrievers in parallel: (1) vector store (Chroma with cosine similarity), (2) BM25 (classic keyword TF-IDF scoring). Both get the same query." },
        { node: "vector", paths: ["vector-ranked"], text: "Chroma vector search: embeds \"How long can the X1 fly?\" → finds top-3 by cosine similarity. Result: [chunk_battery (0.81), chunk_range (0.74), chunk_specs (0.68)]. Semantic match: \"fly\" ≈ \"flight time\"." },
        { node: "bm25", paths: ["bm25-ranked"], text: "BM25 keyword search: scores chunks by term frequency. \"X1\" appears in chunk_battery and chunk_specs. \"fly\" doesn't match \"flight\" exactly (no stemming by default), so scores are [chunk_battery (12.3), chunk_specs (8.1), chunk_warranty (2.4)]." },
        { node: "ranked", paths: ["ranked-topk"], text: "Ensemble merges both lists with weights [0.5, 0.5]. Each chunk gets: score = 0.5*(vector_score) + 0.5*(bm25_score). Normalize and rank. Final: [chunk_battery (top in both), chunk_range, chunk_specs]. Redundancy removed (reciprocal rank fusion)." },
        { node: "topk", paths: [], text: "Top-3 results returned: battery chunk (28 minutes), range chunk (5 km), specs chunk (795 g). The battery chunk wins because it scored high in BOTH vector and keyword. Hybrid retrieval beats either alone! ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Pure-vector misses exact SKU \"X1-BAT-002\"",
      command: "Question: \"Where can I buy X1-BAT-002?\"",
      steps: [
        { node: "question", paths: ["question-hub"], text: "User asks: \"Where can I buy replacement battery X1-BAT-002?\" (exact part number). The manual mentions this SKU in the accessories section." },
        { node: "hub", paths: ["hub-vector"], text: "Using PURE vector retrieval (no BM25). The query is embedded: \"Where can I buy replacement battery X1-BAT-002?\" → 1536-dim vector. Now search Chroma for nearest neighbors." },
        { node: "vector", paths: ["vector-ranked"], text: "Problem: \"X1-BAT-002\" is a random alphanumeric string. Embeddings don't capture exact matches — they capture semantic meaning. The vector for \"X1-BAT-002\" is NOT similar to \"X1-BAT-002\" in the chunk (they're just characters). Cosine similarity = 0.51 (mediocre)." },
        { node: "ranked", paths: ["ranked-topk"], text: "Top-3 results: [chunk_battery_general (0.58 — mentions \"battery\" semantically), chunk_warranty (0.54), chunk_specs (0.51)]. The accessories chunk with \"X1-BAT-002\" ranks 4th (similarity 0.49). MISSED! ❌" },
        { node: "topk", paths: [], text: "LLM receives top-3 chunks. None mention the exact SKU \"X1-BAT-002\". Answer: \"I don't know where to buy X1-BAT-002.\" User frustrated — the manual HAS this info! Pure-vector failed because it can't match exact strings. ❌" },
        { node: "bm25", paths: [], text: "(If we had used BM25 hybrid): BM25 scores by EXACT keyword match. \"X1-BAT-002\" in query + \"X1-BAT-002\" in chunk = HIGH score. The accessories chunk would rank #1. Hybrid would have found it! Lesson: use hybrid for queries with IDs, SKUs, codes." },
      ],
    },
    {
      id: "power",
      name: "⚡ Multi-query: 1 question → 3 paraphrases",
      command: "MultiQueryRetriever.from_llm(base_retriever, llm)",
      steps: [
        { node: "question", paths: ["question-hub"], text: "User asks: \"How long can it fly?\" (casual phrasing). If the manual uses formal language like \"maximum flight duration\", a single vector search might miss nuances. Multi-query to the rescue!" },
        { node: "hub", paths: ["hub-rewriter"], text: "MultiQueryRetriever wraps the base retriever (Chroma). It first sends the query to an LLM (gpt-4o-mini): \"Generate 3 alternative phrasings of this question.\" Cost: 1 extra LLM call (~100 tokens)." },
        { node: "rewriter", paths: ["rewriter-vector"], text: "LLM generates 3 paraphrases: (1) \"What is the maximum flight time of the X1?\", (2) \"How many minutes can the X1 stay airborne?\", (3) \"What is the battery endurance of the X1?\". Now we have 4 queries total (original + 3 paraphrases)." },
        { node: "vector", paths: ["vector-ranked"], text: "Run vector search for ALL 4 queries in parallel. Each query retrieves top-k=3 chunks. That's 12 results total (with duplicates). Union them: {chunk_battery, chunk_range, chunk_specs, chunk_warranty, ...}. Deduplicate by chunk ID." },
        { node: "ranked", paths: ["ranked-topk"], text: "After deduplication: 6 unique chunks. Rank by: number of queries that retrieved it + average similarity. chunk_battery appeared in all 4 queries (\"flight time\", \"airborne\", \"battery endurance\") → top rank. chunk_range appeared in 2 → rank 2." },
        { node: "topk", paths: [], text: "Final top-3: [chunk_battery (retrieved by 4/4 queries), chunk_range (2/4), chunk_specs (2/4)]. The battery chunk is a strong consensus pick. Multi-query beats single-query on paraphrase-robustness! Cost: 1 extra LLM call. Worth it for critical queries. ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "interface", label: "The Retriever Interface ⭐" },
  { id: "k", label: "Choosing k (How Many Chunks?)" },
  { id: "mmr", label: "Similarity vs MMR ⭐" },
  { id: "threshold", label: "Score Thresholds" },
  { id: "multiquery", label: "MultiQueryRetriever ⭐" },
  { id: "hybrid", label: "BM25 + Hybrid Search" },
  { id: "compression", label: "ContextualCompressionRetriever" },
  { id: "metadata", label: "Metadata-Filtered Retrieval" },
  { id: "which", label: "Which Retriever When? ⭐" },
  { id: "debugging", label: "Debugging Retrieval" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function RetrieversPage() {
  return (
    <TopicShell
      icon="🎯"
      title="Retrievers — Finding the Right Chunks"
      gradientWord="Retrievers"
      subtitle="Similarity is just the start. You need MMR for diversity, multi-query for paraphrase robustness, hybrid (vector + BM25) for exact matches, and compression to squeeze context. Learn to choose k, filter by metadata, debug empty results, and build retrievers that actually find the right chunks."
      nav={NAV}
      badges={["🎯 Similarity vs MMR", "🔄 Multi-query LLM rewriting", "🔤 BM25 + hybrid search", "🗜️ Compression for context budget", "🔍 Debugging retrieval"]}
      next={{ icon: "🏗️", label: "The Full RAG Pipeline", href: "/rag/pipeline" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="interface" number="01" title="The Retriever Interface ⭐">
        <P>
          In LangChain, a <strong>Retriever</strong> is anything with an <IC>.invoke(query)</IC> method that returns <IC>list[Document]</IC>. It&apos;s an interface, not a specific class. Why?
        </P>
        <CodeBlock
          title="retriever_interface.py"
          code={`from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# Load the vectorstore we created in topic 7 (loaders-splitters)
vectorstore = Chroma(
    persist_directory="./nimbus_db",
    embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
)

# Turn it into a retriever
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Retrieve!
query = "How long does the X1 battery last?"
docs = retriever.invoke(query)

print(f"Retrieved {len(docs)} documents:")
for i, doc in enumerate(docs):
    print(f"\\n[{i}] {doc.page_content[:100]}...")
    print(f"    Metadata: {doc.metadata}")`}
          output={`Retrieved 3 documents:

[0] The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditio...
    Metadata: {'source': 'docs/manual.md', 'chunk_id': 0}

[1] Battery charges fully in 90 minutes using the included USB-C charger. For optimal battery life, a...
    Metadata: {'source': 'docs/manual.md', 'chunk_id': 1}

[2] The X1 has a range of 5 km and can withstand winds up to 38 km/h. Weight: 795 grams including bat...
    Metadata: {'source': 'docs/manual.md', 'chunk_id': 3}`}
        />
        <P>
          <strong>Why an interface?</strong> Because you can swap retrieval strategies WITHOUT changing your RAG chain. All of these are valid retrievers:
        </P>
        <Table
          head={["Retriever", "What it does"]}
          rows={[
            [<IC>vectorstore.as_retriever()</IC>, "Plain vector similarity search (cosine distance)."],
            [<IC>vectorstore.as_retriever(search_type=&quot;mmr&quot;)</IC>, "Maximal Marginal Relevance (diverse results, avoid duplicates)."],
            [<>MultiQueryRetriever.from_llm(...)</>, "LLM rewrites query into 3 paraphrases, retrieves for all, unions results."],
            [<IC>EnsembleRetriever([vector_ret, bm25_ret])</IC>, "Hybrid: merges vector + keyword (BM25) results."],
            [<IC>ContextualCompressionRetriever(...)</IC>, "Wraps any retriever, compresses chunks to only relevant sentences."],
          ]}
        />
        <P>
          All have <IC>.invoke(query)</IC> → <IC>list[Document]</IC>. Your RAG chain doesn&apos;t care which retriever you use — it just calls <IC>retriever.invoke(query)</IC>. Swap retrievers to test which works best for your data. ⭐
        </P>
      </Section>

      {/* 02 */}
      <Section id="k" number="02" title="Choosing k (How Many Chunks?)">
        <P>
          <IC>k</IC> is the number of chunks to retrieve. Default is often 4. How do you pick?
        </P>
        <Table
          head={["k", "Precision", "Recall", "Cost", "When to use"]}
          rows={[
            [<IC>k=1</IC>, "High (only best match)", "Low (might miss answer)", "Low (1 chunk in context)", "Single-fact queries where you trust top-1 similarity. Risky — if top-1 is wrong, you get no answer."],
            [<IC>k=2-3</IC>, "High", "Medium", "Low-Medium", "Most use cases. NimbusBot uses k=3. Enough to cover the answer + some context, not too noisy. ⭐"],
            [<IC>k=5-10</IC>, "Medium (some noise)", "High (likely has answer)", "High (big context)", "Complex queries needing multiple perspectives. Or when similarity scores are unreliable (need safety margin)."],
            [<IC>k=20+</IC>, "Low (lots of noise)", "Very high", "Very high (wasteful)", "Rarely useful. Only for: (1) reranking (retrieve 20, rerank to 3), (2) exploratory search, (3) evals (measure recall@20)."],
          ]}
        />
        <CodeBlock
          title="compare_k.py"
          code={`retriever_k1 = vectorstore.as_retriever(search_kwargs={"k": 1})
retriever_k6 = vectorstore.as_retriever(search_kwargs={"k": 6})

query = "How long does the X1 battery last?"

docs_k1 = retriever_k1.invoke(query)
docs_k6 = retriever_k6.invoke(query)

print(f"k=1: {len(docs_k1)} doc(s)")
print(f"  Top-1: {docs_k1[0].page_content[:80]}...\\n")

print(f"k=6: {len(docs_k6)} doc(s)")
for i, doc in enumerate(docs_k6):
    print(f"  [{i}] {doc.page_content[:60]}...")`}
          output={`k=1: 1 doc(s)
  Top-1: The Nimbus X1 battery provides up to 28 minutes of flight time on a full char...

k=6: 6 doc(s)
  [0] The Nimbus X1 battery provides up to 28 minutes of flight...
  [1] Battery charges fully in 90 minutes using the included USB...
  [2] The X1 has a range of 5 km and can withstand winds up to 3...
  [3] Firmware updates are available via the Nimbus mobile app. C...
  [4] 12-month warranty covers manufacturing defects. Returns acc...
  [5] The X1 includes GPS navigation, 4K camera, and autonomous r...`}
        />
        <P>
          <strong>k=1 risk</strong>: What if the top chunk is: &quot;Battery charges in 90 minutes&quot; (about charging, not flight time)? The LLM won&apos;t have the flight-time chunk. It says &quot;I don&apos;t know.&quot; With k=3, you get charging + flight time + one extra. The answer is in there. ✅
        </P>
        <Callout type="tip">
          💡 <strong>Start with k=3</strong>. If your LLM says &quot;I don&apos;t know&quot; often, try k=5. If it says &quot;based on the context...&quot; and cites irrelevant chunks, lower k to 2. Monitor: what % of queries have the answer in top-k? Aim for 90%+.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="mmr" number="03" title="Similarity vs MMR ⭐">
        <P>
          Plain <IC>similarity</IC> search can return near-duplicate chunks. <strong>MMR</strong> (Maximal Marginal Relevance) returns DIVERSE results: high similarity to the query, low similarity to each other.
        </P>
        <CodeBlock
          title="similarity_vs_mmr.py"
          code={`# Plain similarity (default)
retriever_sim = vectorstore.as_retriever(search_kwargs={"k": 3})
docs_sim = retriever_sim.invoke("Tell me about the battery")

print("SIMILARITY (k=3):")
for i, doc in enumerate(docs_sim):
    print(f"  [{i}] {doc.page_content[:70]}...")

# MMR (diverse results)
retriever_mmr = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 3, "fetch_k": 10, "lambda_mult": 0.5},
)
docs_mmr = retriever_mmr.invoke("Tell me about the battery")

print("\\nMMR (k=3, fetch_k=10, lambda=0.5):")
for i, doc in enumerate(docs_mmr):
    print(f"  [{i}] {doc.page_content[:70]}...")`}
          output={`SIMILARITY (k=3):
  [0] The Nimbus X1 battery provides up to 28 minutes of flight time on ...
  [1] Battery charges fully in 90 minutes using the included USB-C charg...
  [2] For optimal battery life, avoid deep discharges. Store at 50% char...

MMR (k=3, fetch_k=10, lambda=0.5):
  [0] The Nimbus X1 battery provides up to 28 minutes of flight time on ...
  [1] The X1 has a range of 5 km and can withstand winds up to 38 km/h. ...
  [2] Firmware updates are available via the Nimbus mobile app. Check fo...`}
        />
        <P>
          <strong>What happened?</strong>
        </P>
        <CodeBlock
          title="mmr_explained.txt"
          runnable={false}
          code={`SIMILARITY:
  All 3 results are about the battery (flight time, charging, storage).
  → Near-duplicates. If the user wanted GENERAL info about the X1,
     they only get battery facts. No diversity.

MMR:
  [0] Battery (flight time) — most relevant to "battery"
  [1] Range & wind resistance — DIFFERENT topic, still relevant to X1
  [2] Firmware updates — DIFFERENT topic again
  → Diverse! User learns about battery + other X1 features.

────────────────────────────────────────────────────────────────────────────────
MMR PARAMETERS:

fetch_k=10:
  Fetch top-10 by similarity first (candidate pool).

k=3:
  From the 10 candidates, pick 3 using MMR scoring.

lambda_mult=0.5:
  Balance between relevance and diversity.
  - lambda=1.0 → pure similarity (no diversity, same as default)
  - lambda=0.0 → pure diversity (might return irrelevant chunks)
  - lambda=0.5 → 50/50 balance ⭐ (recommended)

────────────────────────────────────────────────────────────────────────────────
MMR ALGORITHM:

1. Retrieve top-10 by similarity: [chunk_battery_flight, chunk_battery_charge,
   chunk_battery_storage, chunk_range, chunk_firmware, chunk_warranty, ...]

2. Pick #1: chunk_battery_flight (highest similarity to "battery").

3. Pick #2: From the remaining 9, score each by:
      score = lambda * sim(chunk, query) - (1-lambda) * max_sim(chunk, [already_picked])
   → chunk_battery_charge has high sim(query) but ALSO high sim(chunk_battery_flight)
     → penalty! → lower score.
   → chunk_range has medium sim(query) but LOW sim(chunk_battery_flight)
     → no penalty → higher score → PICKED.

4. Pick #3: Same logic. chunk_firmware is diverse from both battery and range → PICKED.

RESULT: 3 chunks covering battery, range, firmware. Diverse! ✅`}
        />
        <Callout type="tip">
          💡 <strong>When to use MMR</strong>: Use <IC>search_type=&quot;mmr&quot;</IC> when: (1) your docs have repetitive sections (multiple battery mentions), (2) you want to show the user a variety of info (overview queries), (3) you&apos;re building a chatbot that explores topics. Stick with plain similarity for precise single-fact queries (&quot;What is the warranty period?&quot;).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="threshold" number="04" title="Score Thresholds">
        <P>
          What if the user asks an off-topic question? (&quot;What&apos;s the best pizza in town?&quot;) Without a threshold, the retriever returns the top-k chunks ANYWAY (low similarity, but still top-k). The LLM might hallucinate an answer. <strong>Solution: score thresholds.</strong>
        </P>
        <CodeBlock
          title="score_threshold.py"
          code={`# Retriever with score threshold (only return chunks with similarity >= 0.5)
retriever_threshold = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.5},
)

# On-topic query
docs_on = retriever_threshold.invoke("How long does the X1 battery last?")
print(f"On-topic query: {len(docs_on)} doc(s) retrieved")

# Off-topic query
docs_off = retriever_threshold.invoke("What's the best pizza in town?")
print(f"Off-topic query: {len(docs_off)} doc(s) retrieved")`}
          output={`On-topic query: 3 doc(s) retrieved
Off-topic query: 0 doc(s) retrieved`}
        />
        <P>
          <strong>What happened?</strong> The pizza query has NO relevant chunks in the Nimbus docs. All similarities are &lt; 0.5. Threshold blocks them. Result: 0 docs. Your RAG chain can check: <IC>if len(docs) == 0: return &quot;I don&apos;t have information about that.&quot;</IC> Honest bot! ✅
        </P>
        <Callout type="note">
          📌 <strong>Choosing the threshold</strong>: 0.5 is a good start. Too high (0.8) = misses valid chunks. Too low (0.2) = lets garbage through. Test with off-topic queries. Adjust until off-topic queries return 0 docs and on-topic queries return results.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="multiquery" number="05" title="MultiQueryRetriever ⭐">
        <P>
          Problem: User asks &quot;How long can it fly?&quot; Manual says &quot;flight time: 28 minutes.&quot; Embedding similarity is good but not perfect. <IC>MultiQueryRetriever</IC> uses an LLM to generate 3 paraphrases of the query, retrieves for all, unions the results. More robust to phrasing variations.
        </P>
        <CodeBlock
          title="multi_query.py"
          code={`from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI

# Base retriever (plain vector search)
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Wrap with MultiQueryRetriever
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
multi_retriever = MultiQueryRetriever.from_llm(
    retriever=base_retriever,
    llm=llm,
)

# Retrieve (LLM generates paraphrases internally)
query = "How long can the X1 fly?"
docs = multi_retriever.invoke(query)

print(f"Retrieved {len(docs)} unique documents (after deduplication)")
for i, doc in enumerate(docs):
    print(f"\\n[{i}] {doc.page_content[:80]}...")`}
          output={`Retrieved 4 unique documents (after deduplication)

[0] The Nimbus X1 battery provides up to 28 minutes of flight time on a full char...

[1] Battery charges fully in 90 minutes using the included USB-C charger. For opt...

[2] The X1 has a range of 5 km and can withstand winds up to 38 km/h. Weight: 79...

[3] Firmware updates are available via the Nimbus mobile app. Check for updates w...`}
        />
        <P>
          <strong>What happened behind the scenes:</strong>
        </P>
        <CodeBlock
          title="multi_query_internals.txt"
          runnable={false}
          code={`USER QUERY: "How long can the X1 fly?"

STEP 1: LLM generates 3 paraphrases
  Prompt (internal): "Generate 3 alternative phrasings of this question: How long can the X1 fly?"

  LLM output:
    1. "What is the maximum flight time of the Nimbus X1?"
    2. "How many minutes can the X1 stay airborne?"
    3. "What is the battery endurance of the X1?"

STEP 2: Retrieve for ALL 4 queries (original + 3 paraphrases)
  base_retriever.invoke("How long can the X1 fly?")        → [chunk_battery, chunk_range, chunk_specs]
  base_retriever.invoke("What is the maximum flight time...") → [chunk_battery, chunk_charge, chunk_warranty]
  base_retriever.invoke("How many minutes can the X1...")  → [chunk_battery, chunk_range, chunk_firmware]
  base_retriever.invoke("What is the battery endurance...") → [chunk_battery, chunk_charge, chunk_specs]

STEP 3: Union + deduplicate
  All results: [chunk_battery, chunk_range, chunk_specs, chunk_battery, chunk_charge, chunk_warranty,
                chunk_battery, chunk_range, chunk_firmware, chunk_battery, chunk_charge, chunk_specs]

  Deduplicate by chunk ID: [chunk_battery, chunk_range, chunk_specs, chunk_charge, chunk_warranty, chunk_firmware]

  → 6 unique chunks (but we limit to top k by counting how many queries returned each chunk)

STEP 4: Return top k=4 (by frequency)
  chunk_battery appeared in 4/4 queries → rank 1
  chunk_range appeared in 2/4 queries   → rank 2
  chunk_specs appeared in 2/4 queries   → rank 3
  chunk_charge appeared in 2/4 queries  → rank 4

────────────────────────────────────────────────────────────────────────────────
COST:
  1 extra LLM call (generate paraphrases): ~100 input tokens + 60 output tokens
  At gpt-4o-mini pricing ($0.15/1M in, $0.60/1M out): ~$0.00005 per query

  Worth it? YES for production chatbots (better recall). NO for high-volume batch jobs.`}
        />
        <Callout type="tip">
          💡 <strong>Multi-query wins on paraphrases</strong>: If your users ask questions in many ways (&quot;How long...?&quot;, &quot;What is the duration...?&quot;, &quot;How many minutes...?&quot;), multi-query ensures you retrieve the answer for ALL phrasings. Single-query might miss some. Trade-off: 1 extra LLM call per query. For customer-facing bots, worth it. ⭐
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="hybrid" number="06" title="BM25 + Hybrid Search">
        <P>
          Vector search is semantic: &quot;fly&quot; ≈ &quot;flight time.&quot; But it fails on exact matches: part numbers, IDs, names. <strong>BM25</strong> is classic keyword search (TF-IDF). <strong>Hybrid = vector + BM25 merged.</strong>
        </P>
        <CodeBlock
          title="hybrid_search.py"
          code={`from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

# 1. Vector retriever (Chroma)
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 2. BM25 retriever (keyword-based, needs all chunks in memory)
#    Load chunks from vectorstore (we stored them earlier)
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

vectorstore_load = Chroma(
    persist_directory="./nimbus_db",
    embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
)
all_chunks = vectorstore_load.get()["documents"]  # list of page_content strings
# Convert to Document objects for BM25Retriever
from langchain_core.documents import Document
docs_for_bm25 = [Document(page_content=chunk) for chunk in all_chunks]

bm25_retriever = BM25Retriever.from_documents(docs_for_bm25)
bm25_retriever.k = 3

# 3. Ensemble (hybrid): merge vector + BM25 with equal weights
hybrid_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.5, 0.5],  # 50% vector, 50% BM25
)

# Test: exact part number query
query = "Where can I buy X1-BAT-002?"
docs = hybrid_retriever.invoke(query)

print(f"Hybrid retrieval: {len(docs)} doc(s)")
for i, doc in enumerate(docs):
    print(f"\\n[{i}] {doc.page_content[:100]}...")`}
          output={`Hybrid retrieval: 3 doc(s)

[0] Replacement parts: Battery pack X1-BAT-002 available at nimbusgear.com/parts. Propellers, camera...

[1] The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditio...

[2] 12-month warranty covers manufacturing defects. Returns accepted within 30 days with original rec...`}
        />
        <P>
          <strong>Why hybrid won:</strong>
        </P>
        <Table
          head={["Retriever", "Query: \"Where can I buy X1-BAT-002?\"", "Result"]}
          rows={[
            ["Pure vector", "Embeds query. \"X1-BAT-002\" is random alphanumerics → embedding doesn't capture it as an exact string. Similarity to chunks mentioning \"X1-BAT-002\" = 0.49 (low). Chunk with part number ranks 4th. MISS ❌", "LLM: \"I don't know.\""],
            ["Pure BM25", <>Keyword match: &quot;X1-BAT-002&quot; in query + &quot;X1-BAT-002&quot; in chunk = HIGH TF-IDF score. Chunk with part number ranks #1. HIT ✅</>, "LLM: \"Available at nimbusgear.com/parts\""],
            ["Hybrid (vector + BM25)", "BM25 ranks part-number chunk #1 (keyword match). Vector ranks battery chunk #1 (semantic: \"buy\" ≈ \"available\"). Ensemble merges both. Part-number chunk still ranks high (BM25 boosted it). HIT ✅", "Best of both worlds!"],
          ]}
        />
        <Callout type="note">
          📌 <strong>When to use hybrid</strong>: Use <IC>EnsembleRetriever</IC> when your docs contain: (1) exact IDs/SKUs/codes (part numbers, error codes, API keys), (2) names (people, places, products), (3) acronyms. Vector search fails on these; BM25 nails them. Hybrid = safety net. ⭐
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="compression" number="07" title="ContextualCompressionRetriever">
        <P>
          Problem: You retrieve a 500-char chunk. Only 1 sentence is relevant. You send all 500 chars to the LLM. Waste of context budget. <IC>ContextualCompressionRetriever</IC> compresses chunks to ONLY the relevant parts using an LLM.
        </P>
        <CodeBlock
          title="compression.py"
          code={`from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_openai import ChatOpenAI

# Base retriever
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Compressor: uses an LLM to extract ONLY relevant sentences
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
compressor = LLMChainExtractor.from_llm(llm)

# Wrap base retriever with compression
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)

query = "How long does the X1 battery last?"

# Retrieve WITHOUT compression (baseline)
docs_base = base_retriever.invoke(query)
print("WITHOUT COMPRESSION:")
print(f"  Chunk 0 ({len(docs_base[0].page_content)} chars): {docs_base[0].page_content}\\n")

# Retrieve WITH compression
docs_compressed = compression_retriever.invoke(query)
print("WITH COMPRESSION:")
print(f"  Chunk 0 ({len(docs_compressed[0].page_content)} chars): {docs_compressed[0].page_content}")`}
          output={`WITHOUT COMPRESSION:
  Chunk 0 (487 chars): The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions. Battery charges fully in 90 minutes using the included USB-C charger. For optimal battery life, avoid deep discharges. Store at 50% charge if not using for extended periods. Low battery warning triggers at 20%. Automatic return-to-home activates at 15% remaining. Replace battery every 300 charge cycles for best performance.

WITH COMPRESSION:
  Chunk 0 (91 chars): The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions.`}
        />
        <P>
          <strong>Savings: 487 chars → 91 chars.</strong> The LLM extracted ONLY the sentence answering the query. The rest (charging time, storage tips, return-to-home) was filtered out. You just saved 396 tokens of context! ⭐
        </P>
        <Callout type="behind">
          ⚙️ <strong>How compression works</strong>: For each retrieved chunk, the compressor sends it + the query to an LLM with the prompt: &quot;Extract ONLY the parts of this document relevant to the question. Omit irrelevant info.&quot; The LLM returns a compressed version. Cost: 1 LLM call per chunk (3 chunks = 3 calls). At gpt-4o-mini pricing: ~$0.0001 per query. Worth it if context budget is tight (long docs, many chunks).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="metadata" number="08" title="Metadata-Filtered Retrieval">
        <P>
          Remember metadata from topic 7? (source, section, chunk_id) You can filter retrieval to ONLY search specific files or sections. Example: &quot;Only search the warranty section.&quot;
        </P>
        <CodeBlock
          title="metadata_filter.py"
          code={`# Retriever with metadata filter
retriever_filtered = vectorstore.as_retriever(
    search_kwargs={
        "k": 3,
        "filter": {"source": "docs/warranty.md"},  # ONLY search warranty.md
    }
)

query = "What is the return policy?"
docs = retriever_filtered.invoke(query)

print(f"Retrieved {len(docs)} doc(s) (warranty.md only):")
for i, doc in enumerate(docs):
    print(f"\\n[{i}] Source: {doc.metadata['source']}")
    print(f"    Content: {doc.page_content[:100]}...")`}
          output={`Retrieved 2 doc(s) (warranty.md only):

[0] Source: docs/warranty.md
    Content: Returns accepted within 30 days of purchase with original receipt. Drone must be in origin...

[1] Source: docs/warranty.md
    Content: 12-month warranty covers manufacturing defects. Damage from crashes, water, or modificatio...`}
        />
        <P>
          Only chunks from <IC>warranty.md</IC> were considered. Even if <IC>manual.md</IC> or <IC>faq.md</IC> mention returns, they&apos;re excluded. Faster + more precise. ✅
        </P>
        <Table
          head={["Filter", "Example", "Use case"]}
          rows={[
            [<IC>{`{"source": "docs/warranty.md"}`}</IC>, "Only search warranty.md", "User explicitly asks about warranty/returns."],
            [<IC>{`{"Header 2": "Battery Specs"}`}</IC>, "Only search chunks from the Battery Specs section (requires MarkdownHeaderTextSplitter)", "Narrow down to a specific topic."],
            [<IC>{`{"version": "2.4"}`}</IC>, "Only search docs from version 2.4 (if you add version metadata)", "Multi-version docs (e.g., API v1 vs v2)."],
            [<IC>{`{"chunk_id": {"$lt": 5}}`}</IC>, <>Only search first 5 chunks (Chroma supports <IC>$lt</IC>, <IC>$gt</IC>, <IC>$in</IC> operators)</>, "Testing or debugging specific chunks."],
          ]}
        />
      </Section>

      {/* 09 */}
      <Section id="which" number="09" title="Which Retriever When? ⭐">
        <P>
          Here&apos;s the decision table. Bookmark this:
        </P>
        <Table
          head={["Scenario", "Retriever choice", "Why"]}
          rows={[
            ["Simple FAQ bot, docs are clean", <IC>vectorstore.as_retriever(search_kwargs={`{"k": 3}`})</IC>, "Plain similarity is fast and works for 80% of use cases. Start here."],
            ["Docs have repetitive sections (e.g., multiple battery mentions)", <IC>vectorstore.as_retriever(search_type=&quot;mmr&quot;, search_kwargs={`{"k": 3, "fetch_k": 10, "lambda_mult": 0.5}`})</IC>, "MMR prevents near-duplicate results. User gets diverse info."],
            ["Users paraphrase queries in many ways", <IC>MultiQueryRetriever.from_llm(base_retriever, llm)</IC>, "LLM generates 3 paraphrases, retrieves for all. Robust to phrasing. Costs 1 extra LLM call."],
            ["Docs contain exact IDs, SKUs, codes, names", <IC>EnsembleRetriever([vector_ret, bm25_ret], weights=[0.5, 0.5])</IC>, "Hybrid (vector + BM25) catches both semantic and keyword matches. Best safety net."],
            ["Chunks are large, context budget is tight", <IC>ContextualCompressionRetriever(compressor, base_retriever)</IC>, "LLM compresses chunks to only relevant sentences. Saves context. Costs 1 LLM call per chunk."],
            ["You want to block off-topic queries", <IC>vectorstore.as_retriever(search_type=&quot;similarity_score_threshold&quot;, search_kwargs={`{"score_threshold": 0.5}`})</IC>, "Returns 0 docs if similarity &lt; threshold. Honest bot: \"I don't know.\""],
            ["User specifies a section or file to search", <IC>vectorstore.as_retriever(search_kwargs={`{"k": 3, "filter": {"source": "warranty.md"}}`})</IC>, "Metadata filter narrows search. Faster + more precise."],
            ["Production chatbot with budget", <IC>MultiQueryRetriever + EnsembleRetriever (nested)</IC>, "Combine multi-query (paraphrase robustness) + hybrid (keyword safety). Best recall. Costs ~2 extra LLM calls."],
          ]}
        />
        <Callout type="tip">
          💡 <strong>The progressive stack</strong>: Start with plain similarity. If users complain about missed answers, add MMR. If they use exact IDs, add hybrid (BM25). If context budget is tight, add compression. If queries vary a lot, add multi-query. Layer these strategies based on real user feedback, not upfront guesses. ⭐
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="debugging" number="10" title="Debugging Retrieval">
        <P>
          The #1 RAG debugging rule: <strong>Print retrieved chunks BEFORE blaming the LLM.</strong> 90% of wrong answers = wrong retrieval.
        </P>
        <CodeBlock
          title="debug_retrieval.py"
          code={`query = "What is the warranty period?"
docs = retriever.invoke(query)

print(f"Query: {query}")
print(f"Retrieved {len(docs)} doc(s):\\n")

for i, doc in enumerate(docs):
    print(f"[{i}] Similarity: (if available)")  # some retrievers return scores
    print(f"    Source: {doc.metadata.get('source', 'unknown')}")
    print(f"    Content: {doc.page_content}\\n")

# Now check: Does ANY of these chunks mention "12 months"?
# If NO → retrieval failed (wrong chunks). Fix: adjust chunk_size, k, or use hybrid.
# If YES → LLM failed to extract the answer. Fix: improve prompt or use better model.`}
          output={`Query: What is the warranty period?
Retrieved 3 doc(s):

[0] Similarity: (if available)
    Source: docs/warranty.md
    Content: 12-month warranty covers manufacturing defects. Damage from crashes, water, or modifications not covered.

[1] Similarity: (if available)
    Source: docs/warranty.md
    Content: Returns accepted within 30 days of purchase with original receipt. Drone must be in original condition.

[2] Similarity: (if available)
    Source: docs/manual.md
    Content: The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions.`}
        />
        <P>
          Chunk [0] has the answer: &quot;12-month warranty.&quot; If the LLM still says &quot;I don&apos;t know,&quot; the problem is the LLM (prompt/model), NOT retrieval. If chunk [0] was missing, the problem is retrieval (wrong k, wrong chunks, need hybrid). Debug the right layer! ⭐
        </P>
        <Table
          head={["Symptom", "Likely cause", "Fix"]}
          rows={[
            ["Empty results (0 docs)", <>Threshold too strict (<IC>score_threshold=0.8</IC>) or off-topic query</>, "Lower threshold to 0.5, or this is correct behavior (honest bot)."],
            ["All results are near-duplicates", <>Plain similarity returns similar chunks (e.g., 3 battery chunks)</>, <>Use <IC>search_type=&quot;mmr&quot;</IC> for diversity.</>],
            ["Exact ID/SKU not found", "Vector search doesn't match exact strings", <>Use hybrid: <IC>EnsembleRetriever([vector_ret, bm25_ret])</IC></>],
            ["Retrieved chunks don't contain the answer", "Wrong k (too low), wrong chunk_size (fact was split), or docs don't have the info", "Increase k to 5-10, or re-chunk at smaller size (e.g., 300 instead of 500), or add the missing info to docs."],
            ["MultiQueryRetriever: 'llm' not provided", <>You forgot to pass <IC>llm</IC> to <IC>MultiQueryRetriever.from_llm(retriever, llm)</IC></>, <>Pass <IC>llm=ChatOpenAI(model=&quot;gpt-4o-mini&quot;)</IC></>],
            ["BM25Retriever fails: 'k' not set", <>BM25Retriever doesn&apos;t have a default k</>, <>Set <IC>bm25_retriever.k = 3</IC> after creating it.</>],
          ]}
        />
        <Callout type="mistake">
          ⚠️ <strong>Don&apos;t skip this step</strong>: Always print retrieved chunks during development. Use <IC>print(f&quot;Retrieved: {`{len(docs)}`} docs&quot;)</IC> and inspect <IC>docs[0].page_content</IC>. You&apos;ll catch retrieval bugs instantly. In production, log retrieved chunks for failed queries so you can debug later.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="lab" number="11" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a hybrid retriever and test edge cases
──────────────────────────────────────────────────────────────────────────────

TASK 1: Baseline — plain similarity retriever
  Code:
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    query = "How long does the X1 battery last?"
    docs = retriever.invoke(query)
    print(f"Retrieved {len(docs)} docs")
    for doc in docs:
        print(doc.page_content[:60])

  Expected: 3 chunks, top one mentions "28 minutes".

TASK 2: Test an exact-SKU query (pure vector will fail)
  Query: "Where can I buy X1-BAT-002?"

  Expected with plain similarity:
    Top chunks don't mention X1-BAT-002 (low similarity to random alphanumerics).
    LLM says "I don't know."

TASK 3: Build hybrid retriever (vector + BM25)
  Code:
    from langchain_community.retrievers import BM25Retriever
    from langchain.retrievers import EnsembleRetriever

    # Load all chunks for BM25
    all_docs = [...]  # see code in section 06
    bm25_retriever = BM25Retriever.from_documents(all_docs)
    bm25_retriever.k = 3

    # Hybrid
    hybrid_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.5, 0.5],
    )

    docs = hybrid_retriever.invoke("Where can I buy X1-BAT-002?")
    print(docs[0].page_content)

  Expected: Top chunk mentions X1-BAT-002 (BM25 keyword match saved it!).

TASK 4: Test off-topic query with threshold
  Code:
    retriever_threshold = vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"score_threshold": 0.5},
    )
    docs = retriever_threshold.invoke("What's the weather today?")
    print(f"Off-topic: {len(docs)} docs")

  Expected: 0 docs (threshold blocked low-similarity results).

TASK 5: Test paraphrase robustness with MultiQueryRetriever
  Code:
    from langchain.retrievers.multi_query import MultiQueryRetriever
    multi_retriever = MultiQueryRetriever.from_llm(base_retriever, llm)

    docs = multi_retriever.invoke("How many minutes can it fly?")
    print(f"Multi-query: {len(docs)} unique docs")

  Expected: 4-6 unique docs (LLM paraphrased the query, retrieved for all).

──────────────────────────────────────────────────────────────────────────────
BONUS: Compare retrieval quality

  Test 5 queries with 3 retrievers:
    1. Plain similarity
    2. Hybrid (vector + BM25)
    3. Multi-query

  Queries:
    - "How long does the battery last?" (semantic)
    - "What is X1-BAT-002?" (exact ID)
    - "Tell me about the drone" (broad, needs diversity)
    - "Return policy?" (paraphrase of "returns")
    - "Best pizza?" (off-topic)

  Fill in:
    | Query | Plain | Hybrid | Multi-query | Winner |
    |-------|-------|--------|-------------|--------|
    | ...   | ...   | ...    | ...         | ...    |`}
        />
      </Section>

      {/* 12 */}
      <Section id="interview" number="12" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is a Retriever in LangChain?", "A Retriever is anything with .invoke(query) → list[Document]. It's an interface, not a class. Examples: vectorstore.as_retriever(), MultiQueryRetriever, EnsembleRetriever. All return Documents. Your RAG chain calls retriever.invoke(query) without caring which retriever it is."],
            ["How do you choose k?", "k is the number of chunks to retrieve. Start with k=3. If the LLM often says \"I don't know\", increase to k=5-10 (more recall). If it cites irrelevant chunks, lower to k=2 (more precision). Trade-off: k↑ = more recall + more noise + higher cost."],
            ["What is MMR and when do you use it?", "MMR (Maximal Marginal Relevance) retrieves DIVERSE results: high similarity to query, low similarity to each other. Use search_type=\"mmr\", search_kwargs={\"k\": 3, \"fetch_k\": 10, \"lambda_mult\": 0.5}. Prevents near-duplicate chunks. Use it for: repetitive docs, overview queries, chatbots that explore topics."],
            ["What does lambda_mult do in MMR?", "lambda_mult balances relevance vs diversity. lambda=1.0 → pure similarity (no diversity). lambda=0.0 → pure diversity (might return irrelevant chunks). lambda=0.5 → 50/50 balance (recommended). fetch_k=10 means: fetch top-10 by similarity, then pick k=3 using MMR scoring."],
            ["What is MultiQueryRetriever?", "MultiQueryRetriever wraps a base retriever. It uses an LLM to generate 3 paraphrases of the query, retrieves for all 4 queries (original + 3), unions results, deduplicates. Robust to phrasing variations. Cost: 1 extra LLM call (~100 tokens). Use for: chatbots where users paraphrase questions."],
            ["What is BM25 and why use hybrid search?", "BM25 is classic keyword search (TF-IDF scoring). It matches exact terms. Vector search is semantic but fails on exact IDs/SKUs/names. Hybrid = EnsembleRetriever([vector, bm25], weights=[0.5, 0.5]) merges both. Use hybrid when docs contain: part numbers, error codes, acronyms, names."],
            ["What does ContextualCompressionRetriever do?", "It compresses retrieved chunks to ONLY relevant sentences using an LLM. Example: 500-char chunk → 90-char compressed chunk (only the sentence answering the query). Saves context budget. Cost: 1 LLM call per chunk (3 chunks = 3 calls). Use when: context is tight, chunks are large."],
            ["How do you filter retrieval by metadata?", <>Pass <IC>filter</IC> to <IC>search_kwargs</IC>: <IC>{`vectorstore.as_retriever(search_kwargs={"k": 3, "filter": {"source": "warranty.md"}})`}</IC>. Only chunks with matching metadata are considered. Use for: searching specific sections/files, multi-version docs, testing specific chunks.</>, ],
            ["What is a score threshold and why use it?", <>Set <IC>search_type=&quot;similarity_score_threshold&quot;</IC> and <IC>score_threshold=0.5</IC>. Only return chunks with similarity ≥ threshold. If all chunks are below threshold, return 0 docs. Use to: block off-topic queries, build an honest bot that says &quot;I don&apos;t know&quot; instead of hallucinating.</>, ],
            ["How do you debug wrong answers in RAG?", "Step 1: Print retrieved chunks. Check: do they contain the answer? If NO → retrieval failed (wrong k, wrong chunks, need hybrid). If YES → LLM failed (bad prompt, weak model). Fix the right layer. 90% of RAG bugs = retrieval bugs. Always debug retrieval first."],
            ["What's the difference between similarity and MMR?", "Similarity returns top-k by cosine distance (might be near-duplicates). MMR returns top-k that are: (1) similar to query, (2) DIVERSE from each other. MMR fetches top-fetch_k by similarity, then picks k using: score = lambda*sim(query) - (1-lambda)*max_sim(already_picked). Prevents redundant results."],
            ["When would you use EnsembleRetriever?", "When you want to merge results from multiple retrievers. Most common: hybrid search (vector + BM25). EnsembleRetriever([vector_ret, bm25_ret], weights=[0.5, 0.5]) runs both, scores each chunk, merges by weighted reciprocal rank. Use for: docs with exact IDs, safety net against vector-only failures."],
          ]}
        />
      </Section>

      {/* 13 */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Basic retriever", "vectorstore.as_retriever(search_kwargs={\"k\": 3})"],
            ["MMR (diverse results)", "vectorstore.as_retriever(search_type=\"mmr\", search_kwargs={\"k\": 3, \"fetch_k\": 10, \"lambda_mult\": 0.5})"],
            ["Score threshold (block off-topic)", "vectorstore.as_retriever(search_type=\"similarity_score_threshold\", search_kwargs={\"score_threshold\": 0.5})"],
            ["MultiQueryRetriever", "MultiQueryRetriever.from_llm(base_retriever, ChatOpenAI(model=\"gpt-4o-mini\"))"],
            ["BM25 keyword retriever", "BM25Retriever.from_documents(docs); retriever.k = 3"],
            ["Hybrid (vector + BM25)", "EnsembleRetriever(retrievers=[vector_ret, bm25_ret], weights=[0.5, 0.5])"],
            ["Compression (save context)", "ContextualCompressionRetriever(base_compressor=LLMChainExtractor.from_llm(llm), base_retriever=base_ret)"],
            ["Metadata filter", "vectorstore.as_retriever(search_kwargs={\"k\": 3, \"filter\": {\"source\": \"warranty.md\"}})"],
            ["Retrieve & print chunks", "docs = retriever.invoke(query); print(docs[0].page_content)"],
            ["Check if answer is in chunks", "any(\"28 minutes\" in doc.page_content for doc in docs)  # debug!"],
            ["MMR lambda rule", "lambda=1.0 (pure sim), lambda=0.0 (pure diversity), lambda=0.5 (balanced ⭐)"],
            ["Debug mantra", "Print retrieved chunks FIRST. If chunks have answer but LLM fails → prompt/model issue. If chunks lack answer → retrieval issue. Fix the right layer! ✅"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
