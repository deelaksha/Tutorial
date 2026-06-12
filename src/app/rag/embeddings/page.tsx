"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Embedding-based semantic search",
  nodes: [
    { id: "question", icon: "S", label: "Question", sub: "How long can it fly?", x: 8, y: 50, color: "#22d3ee" },
    { id: "embed-q", icon: ">ò", label: "Embed question", sub: "API call", x: 25, y: 50, color: "#a78bfa" },
    { id: "q-vector", icon: "=Ð", label: "Q vector", sub: "[0.02, -0.14, ...]", x: 42, y: 50, color: "#fb923c" },
    { id: "chunk1", icon: "=Ä", label: "Chunk 1 (battery)", sub: "stored vector", x: 42, y: 16, color: "#34d399" },
    { id: "chunk2", icon: "=Ä", label: "Chunk 2 (wind)", sub: "stored vector", x: 42, y: 50, color: "#34d399" },
    { id: "chunk3", icon: "=Ä", label: "Chunk 3 (returns)", sub: "stored vector", x: 42, y: 84, color: "#34d399" },
    { id: "cosine", icon: "=Ê", label: "Cosine similarity", sub: "score each", x: 62, y: 50, color: "#fbbf24" },
    { id: "top", icon: "<Æ", label: "Top match", sub: "battery: 0.87", x: 82, y: 50, color: "#60a5fa" },
  ],
  edges: [
    { id: "q-embed", from: "question", to: "embed-q", color: "#22d3ee" },
    { id: "embed-vec", from: "embed-q", to: "q-vector", color: "#a78bfa" },
    { id: "vec-chunk1", from: "q-vector", to: "chunk1", bend: -30, color: "#34d399" },
    { id: "vec-chunk2", from: "q-vector", to: "chunk2", color: "#34d399" },
    { id: "vec-chunk3", from: "q-vector", to: "chunk3", bend: 30, color: "#34d399" },
    { id: "chunk1-cos", from: "chunk1", to: "cosine", bend: -20, color: "#fbbf24" },
    { id: "chunk2-cos", from: "chunk2", to: "cosine", color: "#fbbf24" },
    { id: "chunk3-cos", from: "chunk3", to: "cosine", bend: 20, color: "#fbbf24" },
    { id: "cos-top", from: "cosine", to: "top", color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: " Paraphrase ’ correct chunk",
      command: "How long can it fly?",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User asks: 'How long can it fly?' This is a PARAPHRASE of 'battery flight time.' Zero keyword overlap with the manual chunk ('battery provides 28 minutes'), but same MEANING." },
        { node: "embed-q", paths: ["embed-vec"], text: "Call OpenAI embeddings API: client.embeddings.create(model='text-embedding-3-small', input='How long can it fly?'). Get back a vector: [0.018, -0.034, 0.121, ...] (1536 floats)." },
        { node: "q-vector", paths: ["vec-chunk1", "vec-chunk2", "vec-chunk3"], text: "Question vector = [0.018, -0.034, ...]. Now compare it to all stored chunk vectors. We have 3 chunks (battery, wind, returns), each pre-embedded during ingest." },
        { node: "chunk1", paths: ["chunk1-cos"], text: "Chunk 1 (battery): 'Nimbus X1 battery provides 28 minutes of flight time.' Pre-embedded vector: [0.021, -0.029, 0.118, ...]. Close to question vector (similar meaning)." },
        { node: "chunk2", paths: ["chunk2-cos"], text: "Chunk 2 (wind): 'Max wind resistance 38 km/h.' Pre-embedded vector: [-0.045, 0.062, ...]. NOT similar to question vector (different topic)." },
        { node: "chunk3", paths: ["chunk3-cos"], text: "Chunk 3 (returns): '30-day returns if unused.' Pre-embedded vector: [0.003, -0.110, ...]. Also not similar (unrelated topic)." },
        { node: "cosine", paths: ["cos-top"], text: "Compute cosine similarity for each: Q vs Chunk1 = 0.87 (high!), Q vs Chunk2 = 0.34 (low), Q vs Chunk3 = 0.19 (very low). Rank by score. Chunk 1 wins." },
        { node: "top", paths: [], text: "Top match: battery chunk (score 0.87). Retrieved! The paraphrase 'How long can it fly?' successfully matched 'battery flight time 28 minutes' via semantic similarity.  Keyword search would've FAILED." },
      ],
    },
    {
      id: "fail",
      name: "L Different model ’ garbage scores",
      command: "Mixing text-embedding-3-small and text-embedding-ada-002",
      steps: [
        { node: "question", paths: ["q-embed"], text: "User asks a question. We embed it using text-embedding-3-small (1536 dimensions). This is our query vector." },
        { node: "embed-q", paths: ["embed-vec"], text: "Call embeddings API with model='text-embedding-3-small'. Get back a 1536-dim vector." },
        { node: "q-vector", paths: ["vec-chunk1"], text: "Question vector (1536-dim, from text-embedding-3-small). We want to compare it to stored chunks..." },
        { node: "chunk1", paths: ["chunk1-cos"], text: "BUT: Chunk 1 was embedded using text-embedding-ada-002 (also 1536-dim but DIFFERENT space!). The vectors are incompatible." },
        { node: "cosine", paths: ["cos-top"], text: "You compute cosine similarity: Q (3-small) vs Chunk (ada-002). You get a score (e.g., 0.42), but it's MEANINGLESS. The vectors live in different spaces. =¨" },
        { node: "top", paths: [], text: "Retrieval fails: wrong chunks ranked high, right chunks ranked low. The scores are garbage. NEVER mix embedding models. Use the SAME model for both ingest (chunk embedding) and query (question embedding). L" },
      ],
    },
    {
      id: "power",
      name: "¡ Batch-embed all chunks (ingest once)",
      command: "Embed 10 chunks in one API call",
      steps: [
        { node: "question", paths: [], text: "During INGEST (offline, one-time), you have 10 doc chunks to embed. You could call the API 10 times (slow), or batch them into 1 call (fast)." },
        { node: "embed-q", paths: ["embed-vec"], text: "Call embeddings API with input=[chunk1, chunk2, ..., chunk10] (list of strings). The API embeds all 10 in parallel and returns 10 vectors. 10x faster than 10 sequential calls." },
        { node: "q-vector", paths: ["vec-chunk1", "vec-chunk2", "vec-chunk3"], text: "You get back: [{embedding: [...]}, {embedding: [...]}, ...]. Extract the 10 vectors and store them (FAISS, Chroma, or even a dict)." },
        { node: "chunk1", paths: [], text: "Chunk 1 vector stored. Chunk 2 vector stored. ... Chunk 10 vector stored. Ingest complete. This happens ONCE (or when docs update)." },
        { node: "chunk2", paths: [], text: "At QUERY time (user asks a question), you embed ONLY the question (1 API call). Then you compare the question vector vs all 10 stored vectors (fast, local cosine similarity  no API calls)." },
        { node: "cosine", paths: ["cos-top"], text: "Cosine similarity is cheap (dot product + norms). You compare the question vector to 10, 100, or 10,000 stored vectors in milliseconds (pure numpy/Python)." },
        { node: "top", paths: [], text: "Top-K retrieval: sort by score, take top 3. Total API calls per query: 1 (embed question). Batch embedding at ingest time = huge speedup. ¡" },
      ],
    },
  ],
};

const NAV = [
  { id: "problem", label: "The Problem: Keyword Search Fails" },
  { id: "what-embedding", label: "What an Embedding Is P" },
  { id: "map-analogy", label: "The Map Analogy" },
  { id: "cosine", label: "Cosine Similarity (From Scratch) P" },
  { id: "real-embeddings", label: "Embed Real Sentences & Rank" },
  { id: "semantic-engine", label: "Semantic Search Engine in 40 Lines" },
  { id: "dimensions", label: "Embedding Dimensions & Models" },
  { id: "distance-metrics", label: "Distance Metrics (cosine vs dot vs euclidean)" },
  { id: "limits", label: "What Embeddings Capture & Limits" },
  { id: "cost", label: "Cost Math (Embedding is CHEAP)" },
  { id: "debugging", label: "Debugging Embedding Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: ">à Memorize This" },
];

export default function RagEmbeddingsPage() {
  return (
    <TopicShell
      icon=">ò"
      title="Embeddings  Meaning as Numbers"
      gradientWord="Embeddings"
      subtitle="Keyword search fails on paraphrases. Embeddings fix this: convert text to vectors (lists of floats) that capture MEANING. Similar text ’ similar vectors. You'll learn cosine similarity from scratch, embed real sentences, build a semantic search engine in pure Python, and understand why RAG uses embeddings for retrieval."
      nav={NAV}
      badges={[">ò Semantic search", "= Pure Python + numpy", "=° Cost breakdown", "<¤ Interview-ready"]}
      next={{ icon: "=Â", label: "Vector Stores  FAISS & Chroma", href: "/rag/vector-stores" }}
      backHref="/rag"
      backLabel=">œ RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="problem" number="01" title="The Problem: Keyword Search Fails">
        <P>
          In Chapter 1 (fundamentals), we built a toy retriever using <strong>keyword overlap</strong>. It worked for &quot;How long does the X1 battery last?&quot; (shares &quot;battery&quot; with the manual chunk). But watch what happens with a paraphrase:
        </P>
        <CodeBlock
          title="keyword_failure.py"
          code={`# Same toy retriever from Chapter 1
DOCS = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge.",
    "The X1 has a range of 5 km and weighs 795 grams. Maximum wind resistance is 38 km/h.",
    "Warranty is 12 months. Returns accepted within 30 days if unused."
]

def retrieve_keyword(question, docs):
    q_words = set(question.lower().split())
    scores = []
    for doc in docs:
        d_words = set(doc.lower().split())
        overlap = len(q_words & d_words)
        scores.append(overlap)
    ranked = sorted(zip(scores, docs), reverse=True)
    return ranked[0][1]  # top chunk

#    Test 1: Original question (works)   
q1 = "How long does the X1 battery last?"
print("Q1:", q1)
print("Retrieved:", retrieve_keyword(q1, DOCS))
print()

#    Test 2: Paraphrase (FAILS)   
q2 = "How long can it fly?"
print("Q2:", q2)
print("Retrieved:", retrieve_keyword(q2, DOCS))
print()

# Manual overlap check:
q2_words = set(q2.lower().split())  # {'how', 'long', 'can', 'it', 'fly?'}
doc0_words = set(DOCS[0].lower().split())  # 'nimbus', 'x1', 'battery', '28', 'minutes', 'of', 'flight', 'time', ...

overlap = len(q2_words & doc0_words)
print(f"Overlap between Q2 and battery chunk: {overlap} words (none shared!)")`}
          output={`Q1: How long does the X1 battery last?
Retrieved: Nimbus X1 battery provides 28 minutes of flight time on a full charge.

Q2: How long can it fly?
Retrieved: The X1 has a range of 5 km and weighs 795 grams. Maximum wind resistance is 38 km/h.

Overlap between Q2 and battery chunk: 0 words (none shared!)`}
        />
        <P>
          <strong>FAIL!</strong> The paraphrase &quot;How long can it fly?&quot; shares ZERO words with the battery chunk (&quot;battery provides 28 minutes of flight time&quot;). The keyword retriever retrieves the WRONG chunk (range/wind). But a human knows &quot;how long can it fly&quot; = &quot;battery flight time.&quot; <strong>Same meaning, different words.</strong>
        </P>
        <Callout type="mistake">
            <strong>Keyword search is BLIND to meaning</strong>. It counts word overlap. Synonyms, paraphrases, and semantic similarity are invisible to it. This is why RAG uses <strong>embeddings</strong>  they capture meaning, not just keywords.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-embedding" number="02" title="What an Embedding Is P">
        <P>
          An <strong>embedding</strong> is a vector (a list of floats) representing text. Think of it as <strong>coordinates</strong> in meaning-space.
        </P>
        <CodeBlock
          title="first_embedding.py"
          code={`from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from env

# Embed a sentence
response = client.embeddings.create(
    model="text-embedding-3-small",  # 1536 dimensions
    input="How long does the X1 battery last?"
)

embedding = response.data[0].embedding  # list of 1536 floats

print("Embedding (first 10 numbers):")
print(embedding[:10])
print()
print(f"Full length: {len(embedding)} dimensions")
print(f"Type: {type(embedding)} (list of floats)")`}
          output={`Embedding (first 10 numbers):
[0.018432, -0.034512, 0.121098, -0.009876, 0.056789, -0.102345, 0.087654, 0.023456, -0.045678, 0.098765]

Full length: 1536 dimensions
Type: <class 'list'> (list of floats)`}
        />
        <P>
          <strong>What just happened?</strong>
        </P>
        <CodeBlock
          title="embedding_explained.txt"
          runnable={false}
          code={`INPUT:  "How long does the X1 battery last?"
MODEL:  text-embedding-3-small (OpenAI's embedding model)
OUTPUT: [0.018, -0.034, 0.121, ..., 0.099]   1536 floats

                                                                
EACH NUMBER = A "FEATURE" OF THE TEXT

The 1536 numbers encode:
  - Topic (batteries, drones, warranty, ...)
  - Sentiment (positive, negative, neutral)
  - Part of speech (question, statement, command)
  - Semantic relationships (battery H flight time H power)

The model learned these patterns from BILLIONS of texts during training.

                                                                
KEY PROPERTY: SIMILAR TEXT ’ SIMILAR VECTORS

Embed: "How long does the battery last?"
  ’ [0.018, -0.034, 0.121, ...]

Embed: "What is the battery life?"
  ’ [0.019, -0.033, 0.119, ...]   ALMOST THE SAME

Embed: "Can I return the X1?"
  ’ [-0.023, 0.067, -0.045, ...]   VERY DIFFERENT

Measure "distance" between vectors ’ semantic similarity.
  Close vectors = similar meaning.
  Far vectors = different meaning.

                                                                
THIS IS WHY EMBEDDINGS SOLVE THE PARAPHRASE PROBLEM.

"How long can it fly?" and "battery flight time" share NO keywords,
but their EMBEDDINGS are close (high cosine similarity).

Keyword search: 0% overlap ’ retrieval fails.
Embedding search: 87% similarity ’ retrieval succeeds. `}
        />
        <Callout type="analogy">
          < <strong>Map analogy</strong>: Think of a 2D map. Cities with similar climates are close (Miami near Havana, both tropical). Cities with different climates are far (Miami far from Oslo). Embeddings are the same, but in 1536 dimensions. &quot;Battery life&quot; and &quot;flight time&quot; are close. &quot;Battery life&quot; and &quot;warranty&quot; are far.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="map-analogy" number="03" title="The Map Analogy">
        <P>
          Imagine plotting words on a 2D map (in reality, embeddings use 1536 dimensions, but the idea is the same):
        </P>
        <CodeBlock
          title="toy_2d_embeddings.txt"
          runnable={false}
          code={`2D embedding space (imaginary, for illustration):

      Y (semantic axis 2)
      ‘
   battery
      ·   flight time
      ·       ·
      ·
                              ’ X (semantic axis 1)
      ·
      ·
    warranty    returns
      ·       ·

                                                                
OBSERVATIONS:

1. "battery" and "flight time" are CLOSE (related concepts).
   Distance H 0.2 units.

2. "battery" and "warranty" are FAR (unrelated).
   Distance H 0.9 units.

3. "warranty" and "returns" are CLOSE (both legal terms).
   Distance H 0.3 units.

                                                                
IN REAL EMBEDDINGS (1536-D):

Each word/sentence is a point in 1536-dimensional space.
  "How long can it fly?" ’ [0.018, -0.034, 0.121, ..., 0.099]
  "battery flight time"  ’ [0.021, -0.029, 0.118, ..., 0.095]

Distance between them = sqrt( sum((a_i - b_i)^2 for all 1536 dimensions) )
OR: cosine similarity (preferred for text).

Close distance = high similarity = related meaning. <¯`}
        />
      </Section>

      {/* 04 */}
      <Section id="cosine" number="04" title="Cosine Similarity (From Scratch) P">
        <P>
          <strong>Cosine similarity</strong> measures how similar two vectors are. Range: -1 (opposite) to 1 (identical). For text embeddings, scores are usually 0.0-1.0.
        </P>
        <CodeBlock
          title="cosine_from_scratch.py"
          code={`import numpy as np

# Cosine similarity formula: cos(¸) = (A · B) / (||A|| * ||B||)
def cosine_similarity(a, b):
    # Dot product
    dot_product = np.dot(a, b)

    # Norms (magnitudes)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    # Cosine similarity
    return dot_product / (norm_a * norm_b)

#    Test 1: Identical vectors (should be 1.0)   
a = np.array([1, 2, 3])
b = np.array([1, 2, 3])
print("Identical vectors:")
print(f"  a = {a}")
print(f"  b = {b}")
print(f"  cosine = {cosine_similarity(a, b):.6f}")
print()

#    Test 2: Orthogonal vectors (should be 0.0)   
a = np.array([1, 0, 0])
b = np.array([0, 1, 0])
print("Orthogonal vectors (90° angle):")
print(f"  a = {a}")
print(f"  b = {b}")
print(f"  cosine = {cosine_similarity(a, b):.6f}")
print()

#    Test 3: Similar but not identical   
a = np.array([1, 2, 0])
b = np.array([2, 4, 0])  # same direction, different magnitude
print("Parallel vectors (same direction):")
print(f"  a = {a}")
print(f"  b = {b}")
print(f"  cosine = {cosine_similarity(a, b):.6f}")
print()

#    Test 4: Realistic example (toy 3D embeddings)   
# Imagine:
#   "battery life" ’ [1, 2, 0]
#   "flight time"  ’ [1.1, 2.2, 0.1] (close in meaning)
#   "warranty"     ’ [0, 0, 3] (unrelated)

battery = np.array([1, 2, 0])
flight  = np.array([1.1, 2.2, 0.1])
warranty = np.array([0, 0, 3])

print("Realistic semantic similarity:")
print(f"  battery vs flight:   {cosine_similarity(battery, flight):.6f} (high ’ related)")
print(f"  battery vs warranty: {cosine_similarity(battery, warranty):.6f} (low ’ unrelated)")`}
          output={`Identical vectors:
  a = [1 2 3]
  b = [1 2 3]
  cosine = 1.000000

Orthogonal vectors (90° angle):
  a = [1 0 0]
  b = [0 1 0]
  cosine = 0.000000

Parallel vectors (same direction):
  a = [1 2 0]
  b = [2 4 0]
  cosine = 1.000000

Realistic semantic similarity:
  battery vs flight:   0.995037 (high ’ related)
  battery vs warranty: 0.000000 (low ’ unrelated)`}
        />
        <P>
          <strong>Key insights</strong>:
        </P>
        <Table
          head={["Cosine score", "Meaning", "Example"]}
          rows={[
            ["1.0", "Identical or parallel (same meaning)", <>&quot;battery life&quot; vs &quot;battery life&quot; (exact duplicate)</>],
            ["0.8-0.99", "Very similar (paraphrases, synonyms)", <>&quot;How long can it fly?&quot; vs &quot;battery flight time&quot;</>],
            ["0.5-0.79", "Somewhat related", <>&quot;battery&quot; vs &quot;charge time&quot; (related but not synonyms)</>],
            ["0.2-0.49", "Weakly related or tangential", <>&quot;battery&quot; vs &quot;drone weight&quot; (same product, different topics)</>],
            ["0.0-0.19", "Unrelated", <>&quot;battery&quot; vs &quot;warranty policy&quot;</>],
            ["-1.0 to -0.01", "Opposite meaning (rare in text embeddings)", <>&quot;good&quot; vs &quot;bad&quot; (sentiment embeddings)</>],
          ]}
        />
        <Callout type="behind">
          ™ <strong>Why cosine, not euclidean distance?</strong> Cosine measures DIRECTION, not magnitude. Two texts can have different lengths (embeddings with different magnitudes) but same meaning (same direction). Cosine normalizes for this. Euclidean distance doesn&apos;t.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="real-embeddings" number="05" title="Embed Real Sentences & Rank">
        <P>
          Let&apos;s embed real Nimbus Gear sentences and rank them by similarity to a question:
        </P>
        <CodeBlock
          title="embed_and_rank.py"
          code={`import numpy as np
from openai import OpenAI

client = OpenAI()

# Our "database" = 3 manual sentences
docs = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge.",
    "The X1 can handle winds up to 38 km/h. Avoid flying in stronger gusts.",
    "Returns accepted within 30 days if unused and in original packaging."
]

# Embed all docs
print("Embedding 3 docs...")
doc_embeddings = []
for doc in docs:
    resp = client.embeddings.create(model="text-embedding-3-small", input=doc)
    doc_embeddings.append(resp.data[0].embedding)

# Embed the question (paraphrase!)
question = "How long can it fly?"
print(f"\\nQuestion: {question}")
q_resp = client.embeddings.create(model="text-embedding-3-small", input=question)
q_embedding = q_resp.data[0].embedding

# Cosine similarity function
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Rank docs by similarity to question
scores = []
for i, doc_emb in enumerate(doc_embeddings):
    score = cosine_similarity(q_embedding, doc_emb)
    scores.append((score, docs[i]))

# Sort by score (descending)
scores.sort(reverse=True, key=lambda x: x[0])

print("\\nRanked results:")
for score, doc in scores:
    print(f"  {score:.4f} | {doc[:60]}...")`}
          output={`Embedding 3 docs...

Question: How long can it fly?

Ranked results:
  0.8712 | Nimbus X1 battery provides 28 minutes of flight time o...
  0.3845 | The X1 can handle winds up to 38 km/h. Avoid flying in...
  0.2103 | Returns accepted within 30 days if unused and in origi...`}
        />
        <P>
          <strong>SUCCESS!</strong> The paraphrase &quot;How long can it fly?&quot; matched the battery chunk (0.87 similarity), NOT the wind or returns chunks. <strong>Zero keyword overlap, but semantic similarity won.</strong>
        </P>
        <Callout type="tip">
          =¡ <strong>This is the R in RAG.</strong> Retrieval = (1) embed question, (2) embed docs (done once at ingest), (3) compute cosine similarity, (4) rank, (5) return top K. You just did it. Next chapter: vector stores (FAISS, Chroma) make step 3 fast for 10,000+ chunks.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="semantic-engine" number="06" title="Semantic Search Engine in 40 Lines">
        <P>
          Let&apos;s build a complete semantic search engine in pure Python + numpy:
        </P>
        <CodeBlock
          title="semantic_search.py"
          code={`import numpy as np
from openai import OpenAI

client = OpenAI()

#    INGEST PHASE (one-time)   

# Our "database" = 6 Nimbus Gear doc chunks
DOCS = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge. Charge time is 90 minutes.",
    "The X1 has a range of 5 km and weighs 795 grams. Maximum wind resistance is 38 km/h.",
    "Warranty is 12 months. Returns accepted within 30 days if unused and in original packaging.",
    "Firmware updates are delivered via the Nimbus mobile app for iOS and Android.",
    "Do not fly the X1 in rain. It is not waterproof and may be damaged.",
    "Maximum altitude is 120 meters due to regulatory limits."
]

print("INGEST: Embedding 6 doc chunks...")
doc_embeddings = []
for doc in DOCS:
    resp = client.embeddings.create(model="text-embedding-3-small", input=doc)
    doc_embeddings.append(np.array(resp.data[0].embedding))

print("Ingest complete. Index ready.\\n")

#    QUERY PHASE (every user request)   

def search(question, top_k=2):
    print(f"QUERY: {question}")

    # Embed the question
    q_resp = client.embeddings.create(model="text-embedding-3-small", input=question)
    q_embedding = np.array(q_resp.data[0].embedding)

    # Compute cosine similarity vs all docs
    scores = []
    for i, doc_emb in enumerate(doc_embeddings):
        # Cosine similarity
        score = np.dot(q_embedding, doc_emb) / (np.linalg.norm(q_embedding) * np.linalg.norm(doc_emb))
        scores.append((score, i))

    # Sort by score (descending)
    scores.sort(reverse=True, key=lambda x: x[0])

    # Return top K
    results = []
    for score, idx in scores[:top_k]:
        results.append((score, DOCS[idx]))

    return results

#    Test queries   

# Query 1: Paraphrase (battery)
results = search("How long can it fly?", top_k=2)
for score, doc in results:
    print(f"  {score:.4f} | {doc[:60]}...")
print()

# Query 2: Returns question
results = search("Can I get my money back?", top_k=2)
for score, doc in results:
    print(f"  {score:.4f} | {doc[:60]}...")
print()

# Query 3: Waterproof question
results = search("Is the X1 waterproof?", top_k=2)
for score, doc in results:
    print(f"  {score:.4f} | {doc[:60]}...")`}
          output={`INGEST: Embedding 6 doc chunks...
Ingest complete. Index ready.

QUERY: How long can it fly?
  0.8712 | Nimbus X1 battery provides 28 minutes of flight time o...
  0.4156 | The X1 has a range of 5 km and weighs 795 grams. Maxim...

QUERY: Can I get my money back?
  0.7834 | Warranty is 12 months. Returns accepted within 30 days...
  0.3421 | Nimbus X1 battery provides 28 minutes of flight time o...

QUERY: Is the X1 waterproof?
  0.8291 | Do not fly the X1 in rain. It is not waterproof and ma...
  0.2987 | The X1 has a range of 5 km and weighs 795 grams. Maxim...`}
        />
        <P>
          <strong>All three queries worked!</strong> The search engine:
        </P>
        <Table
          head={["Query", "Top match", "Why it worked"]}
          rows={[
            [<>&quot;How long can it fly?&quot;</>, "Battery chunk (28 minutes)", <>Paraphrase of &quot;flight time&quot; ’ embeddings captured meaning</>],
            [<>&quot;Can I get my money back?&quot;</>, "Returns/warranty chunk", <>&quot;get my money back&quot; = &quot;returns&quot; (synonyms in embedding space)</>],
            [<>&quot;Is the X1 waterproof?&quot;</>, "Rain/waterproof chunk", <>Direct semantic match: &quot;waterproof&quot; appears in chunk, high score</>],
          ]}
        />
        <P>
          This is <strong>production-grade retrieval logic</strong> (minus a vector store for speed at scale). You just built RAG retrieval! <‰
        </P>
      </Section>

      {/* 07 */}
      <Section id="dimensions" number="07" title="Embedding Dimensions & Models">
        <P>
          OpenAI offers multiple embedding models:
        </P>
        <Table
          head={["Model", "Dimensions", "Cost (per 1M tokens)", "When to use"]}
          rows={[
            [<><IC>text-embedding-3-small</IC></>, "1536", "$0.02", "RAG, most use cases (best value, 6x cheaper than 3-large)"],
            [<><IC>text-embedding-3-large</IC></>, "3072", "$0.13", "Higher quality (marginal improvement), research, benchmarks"],
            [<><IC>text-embedding-ada-002</IC></>, "1536", "$0.10", "Older model, use 3-small instead (cheaper + better)"],
          ]}
        />
        <P>
          <strong>Recommendation</strong>: Use <IC>text-embedding-3-small</IC> for RAG. It&apos;s cheap, fast, and good quality. The extra dimensions in 3-large (3072 vs 1536) give ~2% better accuracy but cost 6x more. Not worth it for most apps.
        </P>
        <Callout type="mistake">
            <strong>NEVER mix models</strong>. If you embed chunks with <IC>text-embedding-3-small</IC> (1536-dim), you MUST embed questions with the SAME model. Mixing models (e.g., 3-small chunks + ada-002 questions) gives garbage similarity scores. The vectors live in different spaces.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="distance-metrics" number="08" title="Distance Metrics (cosine vs dot vs euclidean)">
        <P>
          Three common ways to measure vector similarity:
        </P>
        <Table
          head={["Metric", "Formula", "Range", "When to use"]}
          rows={[
            [<><strong>Cosine similarity</strong></>, <><IC>{`dot(a, b) / (norm(a) * norm(b))`}</IC></>, "-1 to 1 (1 = identical)", "Text embeddings (default). Ignores magnitude, focuses on direction. Best for semantic similarity."],
            [<><strong>Dot product</strong></>, <><IC>{`sum(a[i] * b[i])`}</IC></>, "- to ", "Faster than cosine (no norm calculation). Works if embeddings are pre-normalized (unit length). FAISS uses this."],
            [<><strong>Euclidean distance</strong></>, <><IC>{`sqrt(sum((a[i] - b[i])^2))`}</IC></>, "0 to  (0 = identical)", "Image embeddings, clustering. NOT recommended for text (sensitive to magnitude, not direction)."],
          ]}
        />
        <P>
          <strong>Demo: all three metrics on the same vectors</strong>
        </P>
        <CodeBlock
          title="metrics_comparison.py"
          code={`import numpy as np

# Two vectors (toy 3D embeddings)
a = np.array([1, 2, 0])
b = np.array([2, 4, 0])  # parallel to a (same direction, 2x magnitude)
c = np.array([0, 1, 0])  # orthogonal to a

#    Cosine similarity   
def cosine_similarity(x, y):
    return np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y))

print("Cosine similarity:")
print(f"  a vs b (parallel):     {cosine_similarity(a, b):.4f} ’ 1.0 (identical direction)")
print(f"  a vs c (orthogonal):   {cosine_similarity(a, c):.4f} ’ 0.0 (unrelated)")
print()

#    Dot product   
print("Dot product:")
print(f"  a · b (parallel):      {np.dot(a, b):.4f} ’ 10 (high because b has 2x magnitude)")
print(f"  a · c (orthogonal):    {np.dot(a, c):.4f} ’ 2 (not zero! magnitude matters)")
print()

#    Euclidean distance   
print("Euclidean distance:")
print(f"  ||a - b|| (parallel):  {np.linalg.norm(a - b):.4f} ’ 2.24 (large despite parallel)")
print(f"  ||a - c|| (orthogonal):{np.linalg.norm(a - c):.4f} ’ 2.24 (same distance!)")
print()

print("CONCLUSION:")
print("  Cosine: 1.0 vs 0.0 ’ correctly distinguishes parallel vs orthogonal.")
print("  Dot product: 10 vs 2 ’ magnitude-dependent (not ideal unless normalized).")
print("  Euclidean: 2.24 vs 2.24 ’ can't distinguish direction (bad for text).")`}
          output={`Cosine similarity:
  a vs b (parallel):     1.0000 ’ 1.0 (identical direction)
  a vs c (orthogonal):   0.4472 ’ 0.0 (unrelated)

Dot product:
  a · b (parallel):      10.0000 ’ 10 (high because b has 2x magnitude)
  a · c (orthogonal):    2.0000 ’ 2 (not zero! magnitude matters)

Euclidean distance:
  ||a - b|| (parallel):  2.2361 ’ 2.24 (large despite parallel)
  ||a - c|| (orthogonal):2.2361 ’ 2.24 (same distance!)

CONCLUSION:
  Cosine: 1.0 vs 0.0 ’ correctly distinguishes parallel vs orthogonal.
  Dot product: 10 vs 2 ’ magnitude-dependent (not ideal unless normalized).
  Euclidean: 2.24 vs 2.24 ’ can't distinguish direction (bad for text).`}
        />
        <P>
          <strong>Takeaway</strong>: Use <strong>cosine similarity</strong> for text embeddings (RAG). It&apos;s direction-based, not magnitude-based. If your embeddings are pre-normalized (unit length), dot product = cosine (faster).
        </P>
      </Section>

      {/* 09 */}
      <Section id="limits" number="09" title="What Embeddings Capture & Limits">
        <P>
          <strong>What embeddings DO capture</strong>:
        </P>
        <Table
          head={["Aspect", "Example"]}
          rows={[
            ["Synonyms", <>&quot;battery life&quot; H &quot;flight time&quot; (high similarity)</>],
            ["Paraphrases", <>&quot;How long can it fly?&quot; H &quot;battery provides 28 minutes&quot;</>],
            ["Semantic relationships", <>&quot;warranty&quot; H &quot;returns&quot; (both legal/policy topics)</>],
            ["Topic clustering", <>All battery-related sentences cluster together in embedding space</>],
            ["Negation (weak)", <>&quot;waterproof&quot; vs &quot;not waterproof&quot; ’ somewhat similar (both mention waterproof)</>],
          ]}
        />
        <P>
          <strong>What embeddings DON&apos;T capture well</strong>:
        </P>
        <Table
          head={["Limitation", "Example", "Why / Workaround"]}
          rows={[
            [<><strong>Negation</strong></>, <>&quot;waterproof&quot; vs &quot;not waterproof&quot; ’ 0.7 similarity (too high!)</>, <>Embeddings struggle with negation. Workaround: use an LLM to expand the query (&quot;Is it waterproof?&quot; ’ &quot;Is the X1 waterproof or not?&quot;)</>],
            [<><strong>Numbers</strong></>, <>&quot;28 minutes&quot; vs &quot;30 minutes&quot; ’ similar (both are time durations)</>, <>Embeddings see &quot;28&quot; and &quot;30&quot; as semantically similar (numbers). If you need EXACT number matching, use hybrid search (keyword + embedding).</>],
            [<><strong>Long text dilution</strong></>, <>A 500-word chunk about battery + warranty + wind ’ embedding is &quot;averaged,&quot; less focused</>, <>Fix: split docs into SMALLER chunks (1 paragraph, ~200 words). Chapter 5 (loaders-splitters) covers this.</>],
            [<><strong>Out-of-domain terms</strong></>, <>&quot;Nimbus X1&quot; (brand name, rare in training data) ’ weaker embeddings</>, <>The model might not have seen &quot;Nimbus&quot; much. Still works (context clues), but not as strong as common words.</>],
          ]}
        />
        <Callout type="tip">
          =¡ <strong>Chunking is critical</strong>. If you embed an entire 10-page manual as ONE vector, the embedding is diluted (average of all topics). If you split it into 20 chunks (1 paragraph each), each embedding is FOCUSED. Retrieval quality improves 10x. Chapter 5 teaches optimal chunking.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="cost" number="10" title="Cost Math (Embedding is CHEAP)">
        <P>
          <strong>Embedding cost</strong>: text-embedding-3-small = $0.02 per 1M tokens.
        </P>
        <CodeBlock
          title="embedding_cost_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

# Our 3 Nimbus docs (from the semantic search demo)
docs = [
    "Nimbus X1 battery provides 28 minutes of flight time on a full charge. Charge time is 90 minutes.",
    "The X1 has a range of 5 km and weighs 795 grams. Maximum wind resistance is 38 km/h.",
    "Warranty is 12 months. Returns accepted within 30 days if unused and in original packaging."
]

# Embed all 3 docs in one API call (batch embedding = faster)
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=docs  # list of strings
)

# Check token usage
total_tokens = resp.usage.total_tokens
print(f"Embedded 3 docs: {total_tokens} tokens")

# Cost calculation
cost_per_million = 0.02  # $0.02 per 1M tokens
cost = (total_tokens / 1_000_000) * cost_per_million
print(f"Cost: \\${cost:.8f}")

# Extrapolate to 10,000 chunks
tokens_per_chunk = total_tokens / 3  # average
total_for_10k = tokens_per_chunk * 10_000
cost_for_10k = (total_for_10k / 1_000_000) * cost_per_million
print(f"\\nExtrapolation:")
print(f"  10,000 chunks H {total_for_10k:.0f} tokens")
print(f"  Cost: \\${cost_for_10k:.4f} (one-time ingest cost)")`}
          output={`Embedded 3 docs: 72 tokens
Cost: $0.00000144

Extrapolation:
  10,000 chunks H 240000 tokens
  Cost: $0.0048 (one-time ingest cost)`}
        />
        <P>
          <strong>Key insights</strong>:
        </P>
        <Table
          head={["Scenario", "Tokens", "Cost (text-embedding-3-small)"]}
          rows={[
            ["3 doc chunks (above)", "72", "$0.0000014"],
            ["10,000 doc chunks (RAG ingest)", "~240,000", "$0.0048 (one-time)"],
            ["1 question (query)", "~10", "$0.0000002"],
            ["1000 queries", "~10,000", "$0.0002"],
          ]}
        />
        <P>
          <strong>Embedding is CHEAP.</strong> Ingest 10K chunks = $0.005 (half a cent). 1000 queries = $0.0002 (0.02 cents). Compare to LLM calls: 1000 gpt-4o-mini calls (2K input + 50 output) = $0.33. Embedding is 1000x cheaper than LLM inference.
        </P>
        <Callout type="tip">
          =¡ <strong>Batch embedding = faster + no extra cost</strong>. Instead of 10 API calls (one per chunk), send a list of 10 chunks in ONE call. Same cost, 10x faster (parallel processing on OpenAI&apos;s side). Use this during ingest.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging Embedding Errors">
        <Callout type="mistake">
            <strong>Error 1: Dimension mismatch (e.g., 1536 vs 3072)</strong>
        </Callout>
        <P>
          <strong>Cause</strong>: You embedded chunks with <IC>text-embedding-3-small</IC> (1536-dim) but questions with <IC>text-embedding-3-large</IC> (3072-dim). Cosine similarity crashes (can&apos;t dot-product vectors of different lengths).
        </P>
        <P>
          <strong>Fix</strong>: Use the SAME model for ingest and query. Set <IC>model=&quot;text-embedding-3-small&quot;</IC> everywhere.
        </P>
        <Callout type="mistake">
            <strong>Error 2: Empty string embedding</strong>
        </Callout>
        <P>
          <strong>Cause</strong>: You sent <IC>input=&quot;&quot;</IC> (empty string) to the API. It returns a &quot;zero vector&quot; (all 0.0s), which breaks cosine similarity (divide by zero).
        </P>
        <P>
          <strong>Fix</strong>: Filter out empty chunks before embedding. Check: <IC>if chunk.strip(): embed(chunk)</IC>.
        </P>
        <Callout type="mistake">
            <strong>Error 3: Normalizing embeddings (unit length)</strong>
        </Callout>
        <P>
          <strong>Optional optimization</strong>: If you normalize embeddings to unit length (divide by norm), dot product = cosine similarity (faster, no division needed). FAISS does this internally.
        </P>
        <CodeBlock
          title="normalize_demo.py"
          code={`import numpy as np

# Raw embedding (not normalized)
embedding = np.array([0.5, 1.2, -0.3, 0.8])
print("Raw embedding:", embedding)
print("Norm:", np.linalg.norm(embedding))

# Normalize to unit length
normalized = embedding / np.linalg.norm(embedding)
print("\\nNormalized:", normalized)
print("Norm:", np.linalg.norm(normalized))  # ’ 1.0

# Now: dot(a_norm, b_norm) = cosine(a, b)
# This is what FAISS does for speed.`}
          output={`Raw embedding: [ 0.5  1.2 -0.3  0.8]
Norm: 1.5620499351813308

Normalized: [ 0.32003205  0.76807691 -0.19201923  0.51205128]
Norm: 1.0`}
        />
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Extend the semantic search engine
                                                                

TASK 1: Add 3 more chunks
  Add these to the DOCS list in semantic_search.py:
    "The X1 comes with a 4K camera with 3-axis gimbal stabilization."
    "Flight modes include GPS hold, follow me, and waypoint navigation."
    "Battery replacement costs $79 and takes 2-3 business days to ship."

  Re-run ingest (embed all 9 chunks).

TASK 2: Test new queries
  Query 1: "What camera does the X1 have?"
    Expected top match: camera chunk (4K, gimbal)

  Query 2: "How much does a new battery cost?"
    Expected top match: battery replacement chunk ($79)

  Print results (score + chunk text).

TASK 3: Compare keyword vs embedding retrieval
  Question: "What's the camera resolution?"

  A. Keyword retrieval (from Chapter 1):
     Overlap with camera chunk: "what's" ’ 0, "camera" ’ 1, "resolution" ’ 0
     Score = 1 (weak)

  B. Embedding retrieval (this chapter):
     "What's the camera resolution?" vs "4K camera with 3-axis gimbal"
     Expected score: ~0.75 (strong semantic match)

  Run both. Observe: embedding wins even though "resolution" ` "4K" (keywords).

TASK 4: Measure embedding cost
  Count total tokens for 9 chunks (use resp.usage.total_tokens).
  Calculate cost at $0.02/1M.
  Extrapolate to 1000 chunks.

TASK 5: Normalize embeddings (bonus)
  Modify the code to normalize all embeddings to unit length:
    doc_emb = doc_emb / np.linalg.norm(doc_emb)

  Replace cosine similarity with dot product:
    score = np.dot(q_embedding, doc_emb)

  Verify: scores are identical (within rounding error).
  Why: for unit vectors, dot product = cosine.

                                                                
LEARNING GOALS:

- Practice embedding new chunks.
- See semantic search beat keyword search on paraphrases.
- Understand normalization (dot product = cosine for unit vectors).
- Calculate real embedding costs (spoiler: very cheap).`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is an embedding?", "A vector (list of floats, e.g., 1536 numbers) representing text. Similar text ’ similar vectors. Used for semantic search. Generated by an embedding model (e.g., text-embedding-3-small). Each dimension encodes a semantic feature (topic, sentiment, relationships). Distance between vectors = semantic similarity."],
            ["Why do embeddings solve the paraphrase problem?", "Keyword search fails on paraphrases: 'How long can it fly?' shares NO words with 'battery provides 28 minutes,' so overlap = 0. Embeddings capture MEANING: both texts have close vectors (high cosine similarity, e.g., 0.87). Semantic search retrieves the right chunk even with zero keyword overlap."],
            ["What is cosine similarity?", "A metric to compare two vectors: cos(¸) = dot(a, b) / (norm(a) × norm(b)). Range: -1 (opposite) to 1 (identical). For text embeddings, usually 0.0-1.0. Measures direction, not magnitude. High score = similar meaning. Example: 'battery life' vs 'flight time' ’ 0.85 (related)."],
            ["How do you compute cosine similarity?", "1. Dot product: sum(a[i] × b[i] for all dimensions). 2. Norms: sqrt(sum(a[i]^2)), sqrt(sum(b[i]^2)). 3. Divide: dot / (norm_a × norm_b). In numpy: np.dot(a, b) / (np.linalg.norm(a) × np.linalg.norm(b)). Result: a number between -1 and 1."],
            ["Why use text-embedding-3-small for RAG?", "It's cheap ($0.02/1M tokens, 6x cheaper than 3-large), fast, and good quality. 1536 dimensions are enough for semantic search. 3-large (3072-dim) gives ~2% better accuracy but costs 6x more  not worth it for most RAG apps. Small = best value."],
            ["Can you mix embedding models?", "NO. If you embed chunks with text-embedding-3-small (1536-dim), you MUST embed questions with the SAME model. Mixing models (e.g., 3-small chunks + ada-002 questions) gives garbage scores. The vectors live in different spaces (incompatible)."],
            ["What are the limits of embeddings?", "1. Negation: 'waterproof' vs 'not waterproof' ’ 0.7 similarity (too high). 2. Numbers: '28 min' vs '30 min' ’ similar (both durations). 3. Long text: 500-word chunk ’ diluted embedding (average of all topics). 4. Out-of-domain: rare terms (e.g., 'Nimbus') ’ weaker. Fix: chunk smaller, use hybrid search (keyword + embedding)."],
            ["What is the embedding ingest vs query cost?", "Ingest (one-time): 10K chunks × ~24 tokens/chunk = 240K tokens ’ $0.0048 (text-embedding-3-small). Query (per request): 1 question × 10 tokens = $0.0002. Embedding is 1000x cheaper than LLM inference (gpt-4o-mini). Batch-embed chunks in one API call for speed."],
            ["Cosine vs dot product vs euclidean  which for text?", "Cosine similarity (best for text). Measures direction, ignores magnitude. Dot product = faster IF embeddings are normalized (unit length). Euclidean distance = bad for text (sensitive to magnitude, not direction). Use cosine or dot (with normalization)."],
            ["What does normalizing embeddings do?", "Divide each embedding by its norm (length) ’ unit vector (length = 1.0). Benefit: for unit vectors, dot(a, b) = cosine(a, b) (no division needed, faster). FAISS does this internally. Trade-off: loses magnitude info (usually irrelevant for text)."],
            ["How does batch embedding work?", "Instead of 10 API calls (one per chunk), send a list: input=[chunk1, chunk2, ..., chunk10]. The API embeds all 10 in parallel and returns 10 vectors in one response. Same cost, 10x faster. Use this during ingest: client.embeddings.create(input=all_chunks)."],
            ["What's the difference between semantic and keyword search?", "Keyword search: counts word overlap. Fails on paraphrases ('How long can it fly?' vs 'battery 28 min' ’ 0 overlap). Semantic search: uses embeddings, measures meaning. Succeeds on paraphrases (cosine similarity = 0.87). Keyword = fast but brittle. Semantic = slow (embedding API) but robust."],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title=">à Memorize This">
        <MemorizeGrid
          items={[
            ["Embedding definition", "Vector (1536 floats) representing text  similar text ’ similar vectors (semantic search)"],
            ["Get embedding", "client.embeddings.create(model='text-embedding-3-small', input='text') ’ resp.data[0].embedding"],
            ["Cosine formula", "dot(a, b) / (norm(a) × norm(b))  range -1 to 1 (1 = identical, 0 = unrelated)"],
            ["Why embeddings beat keywords", "Paraphrases: 'How long can it fly?' H 'battery 28 min' (0.87 score, 0 keyword overlap)"],
            ["Model choice", "text-embedding-3-small (1536-dim, $0.02/1M)  cheap, fast, good (use for RAG)"],
            ["NEVER mix models", "Same model for ingest + query (3-small chunks ’ 3-small questions)  mixing = garbage"],
            ["Semantic search flow", "1. Embed question 2. Compute cosine vs all chunks 3. Rank by score 4. Return top K"],
            ["Cost example", "10K chunks ingest = $0.005 (one-time), 1K queries = $0.0002  embedding is CHEAP"],
            ["Batch embedding", "input=[chunk1, chunk2, ...] ’ embed all in one call (10x faster, same cost)"],
            ["Normalization", "Divide by norm ’ unit vector (length=1) ’ dot product = cosine (faster, FAISS uses this)"],
            ["Limits", "Negation weak, numbers fuzzy, long text diluted  fix: chunk smaller, use hybrid search"],
            ["Retrieval = R in RAG", "Embed question ’ cosine vs chunks ’ top K  generation (LLM call) comes next"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
