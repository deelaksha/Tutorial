"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "From raw files to embedded chunks in Chroma",
  nodes: [
    { id: "files", icon: "📁", label: "Raw Files", sub: "3 .md docs", x: 5, y: 50, color: "#22d3ee" },
    { id: "loader", icon: "📄", label: "Loader", sub: "DirectoryLoader", x: 20, y: 50, color: "#fb923c" },
    { id: "docs", icon: "📋", label: "Documents", sub: "3 objects", x: 35, y: 50, color: "#a78bfa" },
    { id: "splitter", icon: "✂️", label: "Splitter", sub: "chunk_size=500", x: 50, y: 50, color: "#34d399" },
    { id: "chunks", icon: "🧩", label: "Chunks", sub: "11 pieces", x: 65, y: 50, color: "#fbbf24" },
    { id: "embed", icon: "🔢", label: "Embedder", sub: "1536 dims", x: 80, y: 50, color: "#f472b6" },
    { id: "store", icon: "💾", label: "Chroma DB", sub: "./nimbus_db", x: 95, y: 50, color: "#60a5fa" },
    { id: "metadata", icon: "🏷️", label: "Metadata", sub: "source + section", x: 50, y: 15, color: "#34d399" },
  ],
  edges: [
    { id: "files-loader", from: "files", to: "loader", color: "#22d3ee" },
    { id: "loader-docs", from: "loader", to: "docs", color: "#fb923c" },
    { id: "docs-splitter", from: "docs", to: "splitter", color: "#a78bfa" },
    { id: "splitter-chunks", from: "splitter", to: "chunks", color: "#34d399" },
    { id: "chunks-embed", from: "chunks", to: "embed", color: "#fbbf24" },
    { id: "embed-store", from: "embed", to: "store", color: "#f472b6" },
    { id: "splitter-metadata", from: "splitter", to: "metadata", dashed: true, color: "#34d399" },
    { id: "metadata-store", from: "metadata", to: "store", dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ 3 files → 11 clean chunks",
      command: "python ingest.py",
      steps: [
        { node: "files", paths: ["files-loader"], text: "Start: manual.md (2,100 chars), faq.md (1,800 chars), warranty.md (1,600 chars). Three markdown files containing all Nimbus X1 drone documentation." },
        { node: "loader", paths: ["loader-docs"], text: "DirectoryLoader(\"./docs\", glob=\"**/*.md\") scans the directory. Each file becomes ONE Document object with page_content=file contents and metadata={\"source\": \"docs/manual.md\"}." },
        { node: "docs", paths: ["docs-splitter"], text: "We have 3 Document objects totaling 5,500 chars. Too big to embed as-is (diluted vectors + context overflow). Need to split into manageable chunks." },
        { node: "splitter", paths: ["splitter-chunks", "splitter-metadata"], text: "RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80) splits at natural boundaries (\\n\\n, \\n, \". \", \" \"). Tries longest separators first. The battery sentence \"Flight time: 28 minutes\" stays INTACT in one chunk." },
        { node: "chunks", paths: ["chunks-embed"], text: "Result: 11 chunks. Each is ~450-500 chars with 80-char overlap. The overlap ensures facts straddling a boundary appear fully in at least one chunk. Metadata inherited + chunk index added." },
        { node: "embed", paths: ["embed-store"], text: "OpenAIEmbeddings(model=\"text-embedding-3-small\") converts each chunk to a 1536-dim vector. 11 API calls (batched). Each vector captures semantic meaning of the chunk." },
        { node: "store", paths: [], text: "Chroma.from_documents(chunks, embeddings, persist_directory=\"./nimbus_db\") stores vectors + text + metadata. Persisted to disk. Ready for retrieval! Output: \"Ingested 11 chunks from 3 files\" ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ chunk_size=3000 — mega-chunk hell",
      command: "chunk_size=3000 (too big)",
      steps: [
        { node: "files", paths: ["files-loader"], text: "Same 3 files. But this time we set chunk_size=3000 — way too large. Let's see what breaks." },
        { node: "loader", paths: ["loader-docs"], text: "DirectoryLoader works the same: 3 Document objects. No change yet." },
        { node: "docs", paths: ["docs-splitter"], text: "3 docs, 5,500 total chars. We're about to split with chunk_size=3000..." },
        { node: "splitter", paths: ["splitter-chunks"], text: "With chunk_size=3000, warranty.md (1,600 chars) + faq.md (1,800 chars) merge into ONE mega-chunk! Now \"returns policy\" + \"firmware updates\" + \"battery specs\" all live in the same vector." },
        { node: "chunks", paths: ["chunks-embed"], text: "Only 2 chunks: one mega-chunk (3,400 chars: warranty + faq), one for manual. The mega-chunk embedding is DILUTED — it represents too many unrelated topics. Similarity scores will be mediocre for all queries." },
        { node: "embed", paths: ["embed-store"], text: "Embedding the mega-chunk produces a vector that's the average of \"returns\", \"firmware\", \"battery\". No single topic dominates. Similarity to \"How do I return my drone?\" = 0.42 (low!)." },
        { node: "store", paths: [], text: "Stored 2 chunks. When user asks \"What's the return policy?\", retrieval returns the mega-chunk with similarity 0.42. The LLM must sift through 3,400 chars (warranty + faq + battery). Context pollution → wrong answer or \"I don't know\". ❌" },
      ],
    },
    {
      id: "power",
      name: "⚡ MarkdownHeaderTextSplitter — structured metadata",
      command: "Split by headers, then size",
      steps: [
        { node: "files", paths: ["files-loader"], text: "Same 3 files. But this time we want to preserve the document structure: ## Warranty, ## Returns, ## Firmware, etc." },
        { node: "loader", paths: ["loader-docs"], text: "DirectoryLoader loads 3 Document objects. Each file has markdown headers like \"## Battery Specs\" and \"## Firmware Updates\"." },
        { node: "docs", paths: ["docs-splitter"], text: "Instead of blind character-count splitting, we'll use MarkdownHeaderTextSplitter first to split on \"##\" headers. Each section becomes a separate chunk." },
        { node: "splitter", paths: ["splitter-chunks", "splitter-metadata"], text: "MarkdownHeaderTextSplitter splits on ## headers. Each resulting chunk has metadata={\"Header 2\": \"Battery Specs\"}. THEN RecursiveCharacterTextSplitter splits long sections by size. Headers travel as metadata!" },
        { node: "metadata", paths: ["metadata-store"], text: "Every chunk now has metadata: {\"source\": \"manual.md\", \"Header 2\": \"Battery Specs\"}. We can filter retrieval: only return chunks from the \"Warranty\" section! Structured retrieval." },
        { node: "chunks", paths: ["chunks-embed"], text: "11 chunks, but now each chunk knows which section it came from. Chunk 4 has metadata={\"source\": \"manual.md\", \"Header 2\": \"Battery Specs\"}. Perfect for citations and filtering." },
        { node: "embed", paths: ["embed-store"], text: "Embeddings generated. Metadata is stored alongside vectors in Chroma." },
        { node: "store", paths: [], text: "Chroma stores vectors + text + metadata. Now we can: (1) filter by section: retriever.search(query, filter={\"Header 2\": \"Warranty\"}), (2) cite sections: \"Battery lasts 28 minutes [manual.md — Battery Specs]\". Metadata = superpowers! ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Chunking Decides RAG Quality ⭐" },
  { id: "document", label: "The Document Object" },
  { id: "loaders", label: "Loaders Tour" },
  { id: "naive", label: "The Naive Splitter Trap" },
  { id: "recursive", label: "RecursiveCharacterTextSplitter ⭐" },
  { id: "overlap", label: "Chunk Overlap Explained" },
  { id: "tuning", label: "Chunk Size Tuning" },
  { id: "metadata", label: "Metadata Enrichment" },
  { id: "markdown", label: "MarkdownHeaderTextSplitter" },
  { id: "tokens", label: "Token-Based Length" },
  { id: "ingest", label: "ingest.py for NimbusBot ⭐" },
  { id: "debugging", label: "Debugging Ingestion" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LoadersSplittersPage() {
  return (
    <TopicShell
      icon="📄"
      title="Loaders & Splitters — Chunking Done Right"
      gradientWord="Chunking"
      subtitle="Garbage chunks in, garbage answers out. The retriever can only find what you feed it. Learn how loaders turn files into Documents, why naive splitting breaks retrieval, and how RecursiveCharacterTextSplitter + chunk overlap keep facts intact. This is where RAG quality is won or lost."
      nav={NAV}
      badges={["📄 Loaders: text, PDF, CSV, web", "✂️ Smart splitting: overlap + boundaries", "🏷️ Metadata for citations", "💾 Chroma persistence", "🔧 Debugging chunks"]}
      next={{ icon: "🎯", label: "Retrievers — Finding the Right Chunks", href: "/rag/retrievers" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Chunking Decides RAG Quality ⭐">
        <P>
          RAG has three stages: <strong>ingest</strong> (load + split + embed + store), <strong>retrieve</strong> (find relevant chunks), <strong>generate</strong> (LLM answers from chunks). Chunking happens in stage 1 and determines the ceiling of your RAG system. Why?
        </P>
        <Table
          head={["Problem", "Why chunking matters"]}
          rows={[
            ["The retriever can only find chunks that EXIST", "If \"battery: 28 minutes\" is split across two chunks (\"battery: 28\" and \"minutes\"), neither chunk will match the query \"How long does the battery last?\". The fact is lost in the split."],
            ["Chunks that are too BIG", "Embedding a 2,000-char chunk = averaging the meaning of 10 unrelated facts. The vector is diluted. Similarity scores are mediocre for ALL queries. Plus, you waste LLM context tokens on irrelevant sentences."],
            ["Chunks that are too SMALL", "A 50-char chunk: \"Flight time: 28 minutes.\" Missing context: 28 minutes of WHAT? On a full charge? In what conditions? Orphaned facts without surrounding explanation."],
            ["No overlap between chunks", "Fact: \"The X1 battery provides 28 minutes of flight time in calm conditions.\" If the split happens at \"provides\", chunk A ends with \"battery provides\" and chunk B starts with \"28 minutes...\". The complete sentence is in NEITHER chunk."],
          ]}
        />
        <Callout type="analogy">
          🌍 <strong>Pizza-slice analogy</strong>: Imagine cutting a pizza. If you cut through the pepperoni, both slices have half a pepperoni — neither is satisfying. Good chunking = cutting BETWEEN toppings. Each slice is whole and delicious. RAG chunking is the same: cut at natural boundaries (paragraphs, sentences) so each chunk is a complete thought.
        </Callout>
        <P>
          <strong>The brutal truth</strong>: If you chunk badly, no amount of fancy retrieval (MMR, reranking, multi-query) will save you. You can&apos;t retrieve what doesn&apos;t exist. Chunking is the foundation. Get it right, and RAG works. Get it wrong, and you&apos;ll spend weeks debugging hallucinations. ⭐
        </P>
      </Section>

      {/* 02 */}
      <Section id="document" number="02" title="The Document Object">
        <P>
          In LangChain, a <IC>Document</IC> is the core data structure. It has two fields:
        </P>
        <CodeBlock
          title="document_object.py"
          code={`from langchain_core.documents import Document

# Create a Document manually
doc = Document(
    page_content="The Nimbus X1 flies for up to 28 minutes on a full charge.",
    metadata={"source": "manual.md", "page": 3}
)

print("Content:", doc.page_content)
print("Metadata:", doc.metadata)`}
          output={`Content: The Nimbus X1 flies for up to 28 minutes on a full charge.
Metadata: {'source': 'manual.md', 'page': 3}`}
        />
        <Table
          head={["Field", "Type", "What it is"]}
          rows={[
            [<IC>page_content</IC>, "str", "The actual text. Could be 1 sentence, 1 paragraph, 1 page, or an entire file. This is what gets embedded and fed to the LLM."],
            [<IC>metadata</IC>, "dict", "Extra info: source file, page number, author, timestamp, section header, etc. Used for filtering retrieval, citations, debugging. NOT embedded (unless you explicitly add it to page_content)."],
          ]}
        />
        <P>
          Loaders return <IC>list[Document]</IC>. Splitters take <IC>list[Document]</IC> and return a longer <IC>list[Document]</IC> (one input doc → many chunks). Every chunk is a Document with inherited + new metadata.
        </P>
      </Section>

      {/* 03 */}
      <Section id="loaders" number="03" title="Loaders Tour">
        <P>
          Loaders read files/URLs and convert them into Documents. LangChain has 100+ loaders. Here are the most common:
        </P>
        <CodeBlock
          title="loaders_tour.py"
          code={`from langchain_community.document_loaders import (
    TextLoader, DirectoryLoader, PyPDFLoader, WebBaseLoader, CSVLoader
)

# 1. TextLoader — single text file
loader = TextLoader("docs/manual.md")
docs = loader.load()  # [Document(page_content=<entire file>, metadata={"source": "docs/manual.md"})]
print(f"TextLoader: {len(docs)} document(s)")

# 2. DirectoryLoader — all files matching a glob pattern
loader = DirectoryLoader("./docs", glob="**/*.md", loader_cls=TextLoader)
docs = loader.load()  # One Document per .md file
print(f"DirectoryLoader: {len(docs)} document(s)")

# 3. PyPDFLoader — PDF, one Document per page
loader = PyPDFLoader("manual.pdf")
docs = loader.load()  # If PDF has 12 pages → 12 Documents
print(f"PyPDFLoader: {len(docs)} document(s), metadata: {docs[0].metadata}")

# 4. WebBaseLoader — scrape HTML from a URL
loader = WebBaseLoader("https://nimbusgear.com/support/faq")
docs = loader.load()  # [Document(page_content=<HTML converted to text>, metadata={"source": <url>})]
print(f"WebBaseLoader: {len(docs)} document(s)")

# 5. CSVLoader — one Document per row
loader = CSVLoader("orders.csv")
docs = loader.load()  # 100 rows → 100 Documents (each row as text + metadata)
print(f"CSVLoader: {len(docs)} document(s)")`}
          output={`TextLoader: 1 document(s)
DirectoryLoader: 3 document(s)
PyPDFLoader: 12 document(s), metadata: {'source': 'manual.pdf', 'page': 0}
WebBaseLoader: 1 document(s)
CSVLoader: 100 document(s)`}
        />
        <Table
          head={["Loader", "What one Document represents"]}
          rows={[
            [<IC>TextLoader(&quot;file.txt&quot;)</IC>, "The entire file as one Document."],
            [<IC>DirectoryLoader(&quot;./docs&quot;, glob=&quot;**/*.md&quot;)</IC>, "Each .md file = one Document."],
            [<IC>PyPDFLoader(&quot;doc.pdf&quot;)</IC>, "Each page = one Document. Metadata includes page number."],
            [<IC>WebBaseLoader(&quot;https://...&quot;)</IC>, "The scraped HTML (converted to markdown/text) as one Document."],
            [<IC>CSVLoader(&quot;data.csv&quot;)</IC>, "Each row = one Document. Columns become part of page_content."],
          ]}
        />
        <P>
          For NimbusBot, we use <IC>DirectoryLoader(&quot;./docs&quot;, glob=&quot;**/*.md&quot;)</IC> to load all markdown files (manual.md, faq.md, warranty.md) in one call. Result: 3 Documents, one per file. ✅
        </P>
      </Section>

      {/* 04 */}
      <Section id="naive" number="04" title="The Naive Splitter Trap">
        <P>
          You might think: &quot;I&apos;ll just split every 500 characters. Easy!&quot; Let&apos;s see what happens:
        </P>
        <CodeBlock
          title="naive_split.py"
          code={`# BAD: split every 500 chars, no regard for sentence boundaries
text = """The Nimbus X1 battery provides up to 28 minutes of flight time in calm conditions. For best results, avoid flying in winds exceeding 38 km/h."""

def naive_split(text, size=60):
    # Just slice every 'size' chars
    chunks = [text[i:i+size] for i in range(0, len(text), size)]
    return chunks

chunks = naive_split(text, size=60)
for i, c in enumerate(chunks):
    print(f"Chunk {i}: {repr(c)}")`}
          output={`Chunk 0: 'The Nimbus X1 battery provides up to 28 minutes of flight '
Chunk 1: 'time in calm conditions. For best results, avoid flying i'
Chunk 2: 'n winds exceeding 38 km/h.'`}
        />
        <P>
          <strong>What went wrong?</strong>
        </P>
        <Table
          head={["Problem", "Example"]}
          rows={[
            ["Chunk 0 ends mid-sentence", "\"...28 minutes of flight\" — WHERE is the flight time? The sentence is cut. If you embed this chunk, the query \"How long can it fly?\" might miss it because the chunk doesn't say \"28 minutes of FLIGHT TIME\" — just \"flight\"."],
            ["Chunk 1 starts mid-sentence", "\"time in calm conditions...\" — time of WHAT? The subject (battery) is in the previous chunk. Orphaned fragment."],
            ["The critical fact is SPLIT", "\"28 minutes of flight\" is in chunk 0. \"time in calm conditions\" is in chunk 1. The complete fact (\"28 minutes of flight time in calm conditions\") is in NEITHER chunk. Retrieval will miss it."],
          ]}
        />
        <Callout type="mistake">
          ⚠️ <strong>The naive trap</strong>: Simple character-count splitting WILL break your RAG. A user asks &quot;How long does the X1 battery last?&quot; The retriever finds chunk 0 (&quot;...28 minutes of flight&quot;) with low similarity because the sentence is incomplete. It might rank a different chunk higher. The LLM says &quot;I don&apos;t know&quot; even though the manual contains the answer. This is the #1 RAG failure mode. ❌
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="recursive" number="05" title="RecursiveCharacterTextSplitter ⭐">
        <P>
          The solution: <IC>RecursiveCharacterTextSplitter</IC>. It tries to split at <strong>natural boundaries</strong> in order: <IC>\n\n</IC> (paragraphs), <IC>\n</IC> (lines), <IC>. </IC> (sentences), <IC> </IC> (words). It only falls back to character-count if a chunk is still too big.
        </P>
        <CodeBlock
          title="recursive_split.py"
          code={`from langchain_text_splitters import RecursiveCharacterTextSplitter

text = """The Nimbus X1 battery provides up to 28 minutes of flight time in calm conditions.

For best results, avoid flying in winds exceeding 38 km/h. The drone will automatically return to home if battery drops below 15%."""

splitter = RecursiveCharacterTextSplitter(
    chunk_size=80,
    chunk_overlap=20,
    separators=["\\n\\n", "\\n", ". ", " ", ""],  # try in order
)

chunks = splitter.split_text(text)
for i, c in enumerate(chunks):
    print(f"Chunk {i}: {repr(c)}")`}
          output={`Chunk 0: 'The Nimbus X1 battery provides up to 28 minutes of flight time in calm'
Chunk 1: 'calm conditions.'
Chunk 2: 'For best results, avoid flying in winds exceeding 38 km/h. The drone will'
Chunk 3: 'The drone will automatically return to home if battery drops below 15%.'`}
        />
        <P>
          <strong>What happened?</strong>
        </P>
        <CodeBlock
          title="how_it_works.txt"
          runnable={false}
          code={`RecursiveCharacterTextSplitter logic:

1. Try splitting on "\\n\\n" (paragraph break).
   → Text has one paragraph break after "...calm conditions."
   → Split into 2 parts:
       Part A: "The Nimbus X1 battery...calm conditions."
       Part B: "For best results...below 15%."

2. Part A is 82 chars (> chunk_size=80). Try splitting on ". " (sentence).
   → One sentence: "The Nimbus X1 battery...time in calm conditions."
   → Still 82 chars. Try splitting on " " (word).
   → Split at word boundary: "...flight time in calm" (79 chars) + "conditions." (11 chars).
   → Chunk 0: "...in calm", Chunk 1: "calm conditions." (overlap keeps "calm").

3. Part B is 134 chars. Try ". " split.
   → Two sentences: "For best results...38 km/h." (75 chars), "The drone...15%." (73 chars).
   → Both fit! Chunk 2 and Chunk 3.

RESULT: 4 chunks. Every chunk is a COMPLETE sentence or phrase. The battery fact
        ("28 minutes of flight time in calm conditions") is intact across chunks 0+1
        thanks to overlap. ✅

────────────────────────────────────────────────────────────────────────────────
WHY THIS MATTERS FOR RAG:

Query: "How long does the X1 battery last?"

Naive split (char-count):
  Chunk: "...28 minutes of flight" (incomplete) — similarity 0.58

Recursive split (sentence boundaries):
  Chunk: "The Nimbus X1 battery provides up to 28 minutes of flight time in calm"
  (complete thought) — similarity 0.81 ✅

The retriever ranks the recursive chunk MUCH higher. The LLM gets the full context.`}
        />
        <P>
          For NimbusBot, we use <IC>RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)</IC>. The manual.md (2,100 chars) → 4 chunks. faq.md → 4 chunks. warranty.md → 3 chunks. Total: 11 clean, semantically intact chunks. ⭐
        </P>
      </Section>

      {/* 06 */}
      <Section id="overlap" number="06" title="Chunk Overlap Explained">
        <P>
          <IC>chunk_overlap</IC> is the secret weapon against boundary cuts. If a fact straddles a chunk boundary, overlap ensures it appears FULLY in at least one chunk.
        </P>
        <CodeBlock
          title="overlap_diagram.txt"
          runnable={false}
          code={`Text: "The X1 has a range of 5 km. Battery lasts 28 minutes."

chunk_size=30, chunk_overlap=10

WITHOUT OVERLAP (overlap=0):
  Chunk 0: "The X1 has a range of 5 km." (28 chars)
  Chunk 1: " Battery lasts 28 minutes."  (27 chars)
  → Clean split. But if the split happened mid-sentence, we'd lose the fact.

WITH OVERLAP (overlap=10):
  Chunk 0: "The X1 has a range of 5 km." (28 chars)
  Chunk 1: "of 5 km. Battery lasts 28 minutes." (35 chars — includes 10 chars from chunk 0)
  → The last 10 chars of chunk 0 ("of 5 km. ") are repeated in chunk 1.

────────────────────────────────────────────────────────────────────────────────
WHY OVERLAP HELPS:

Imagine the boundary falls in the middle of "Battery lasts 28 minutes":

Without overlap:
  Chunk 0: "...range of 5 km. Battery lasts"
  Chunk 1: "28 minutes."
  → "28 minutes" is orphaned. Query "How long is the battery?" might miss it.

With overlap=10:
  Chunk 0: "...range of 5 km. Battery lasts" (ends here)
  Chunk 1: "tery lasts 28 minutes." (starts 10 chars earlier: "tery lasts")
  → Even if chunk 0 cuts at "lasts", chunk 1 has "lasts 28 minutes" — the fact is whole!

────────────────────────────────────────────────────────────────────────────────
RULE OF THUMB:

chunk_overlap = 10-20% of chunk_size

- chunk_size=500 → overlap=50-100 (we use 80)
- chunk_size=1000 → overlap=100-200

Too much overlap = duplicate storage + slower retrieval.
Too little = facts get cut.`}
        />
        <Callout type="tip">
          💡 <strong>The overlap insurance policy</strong>: Think of overlap as insurance. It costs a bit (duplicate storage), but it prevents catastrophic losses (missing facts). For RAG, the cost is tiny (a few extra vectors), and the benefit is huge (reliable retrieval). Always use 10-20% overlap. ✅
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="tuning" number="07" title="Chunk Size Tuning">
        <P>
          What&apos;s the right <IC>chunk_size</IC>? There&apos;s no universal answer, but here&apos;s a guide:
        </P>
        <Table
          head={["chunk_size", "Embedding quality", "Context cost", "When to use"]}
          rows={[
            [<IC>100-200</IC>, "Low (facts lack context)", "Low (small chunks)", "Very dense, structured data (product specs, API params). Each fact is self-contained."],
            [<IC>400-600</IC>, "High (complete thoughts)", "Medium (sweet spot)", "Most use cases: docs, FAQs, manuals, articles. Enough context for the LLM, not too diluted. ⭐ (NimbusBot uses 500)"],
            [<IC>800-1200</IC>, "Medium (some dilution)", "High (big chunks)", "Long-form content where context matters (legal docs, research papers). Retrieves more surrounding info."],
            [<IC>2000+</IC>, "Low (very diluted)", "Very high (wasteful)", "Rarely useful. Embedding represents too many topics. Use only if you need entire sections as single units."],
          ]}
        />
        <P>
          <strong>How to test:</strong> Run ingestion at 200, 500, 1000. For each size, run your top 10 test queries. Check: (1) Does the top-1 retrieved chunk contain the answer? (2) How much irrelevant text is in the chunk? Pick the size where precision is high and noise is low.
        </P>
        <CodeBlock
          title="chunk_size_comparison.py"
          code={`from langchain_text_splitters import RecursiveCharacterTextSplitter

manual_text = """The Nimbus X1 is a compact drone weighing 795 grams. It has a maximum flight time of 28 minutes and a range of 5 km. The drone can withstand winds up to 38 km/h. Battery charges fully in 90 minutes."""

# Test 3 sizes
for size in [50, 150, 500]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=size, chunk_overlap=int(size*0.15))
    chunks = splitter.split_text(manual_text)
    print(f"\\nchunk_size={size} → {len(chunks)} chunks")
    for i, c in enumerate(chunks):
        print(f"  [{i}] {c[:60]}..." if len(c) > 60 else f"  [{i}] {c}")`}
          output={`
chunk_size=50 → 6 chunks
  [0] The Nimbus X1 is a compact drone weighing 795 grams.
  [1] grams. It has a maximum flight time of 28 minutes and
  [2] minutes and a range of 5 km. The drone can withstand
  [3] can withstand winds up to 38 km/h. Battery charges
  [4] Battery charges fully in 90 minutes.

chunk_size=150 → 2 chunks
  [0] The Nimbus X1 is a compact drone weighing 795 grams. It has a maximum flight time of 28 minutes and a range of 5 km.
  [1] 5 km. The drone can withstand winds up to 38 km/h. Battery charges fully in 90 minutes.

chunk_size=500 → 1 chunks
  [0] The Nimbus X1 is a compact drone weighing 795 grams. It has a maximum flight time of 28 minutes and a range of 5 km. The drone can withstand winds up to 38 km/h. Battery charges fully in 90 minutes.`}
        />
        <P>
          For this 184-char text: size=50 → 6 tiny chunks (facts split), size=150 → 2 good chunks (balanced), size=500 → 1 chunk (entire text, fine for short docs). For NimbusBot&apos;s 5,500-char corpus, chunk_size=500 → 11 chunks is the sweet spot. ⭐
        </P>
      </Section>

      {/* 08 */}
      <Section id="metadata" number="08" title="Metadata Enrichment">
        <P>
          Metadata is your RAG superpower. It enables: (1) <strong>Citations</strong> — tell the user WHERE the answer came from. (2) <strong>Filtered retrieval</strong> — only search in specific sections/files. (3) <strong>Debugging</strong> — trace which chunk produced a bad answer.
        </P>
        <CodeBlock
          title="metadata_enrichment.py"
          code={`from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load docs
loader = DirectoryLoader("./docs", glob="**/*.md", loader_cls=TextLoader)
docs = loader.load()  # [Document(page_content=..., metadata={"source": "docs/manual.md"}), ...]

# Split
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
chunks = splitter.split_documents(docs)  # split_documents (not split_text) preserves metadata!

# Enrich: add chunk index, section, timestamp
for i, chunk in enumerate(chunks):
    chunk.metadata["chunk_id"] = i
    chunk.metadata["total_chunks"] = len(chunks)
    # If you know the section (from headers or filename), add it:
    if "battery" in chunk.page_content.lower():
        chunk.metadata["section"] = "Battery"
    elif "warranty" in chunk.page_content.lower():
        chunk.metadata["section"] = "Warranty"

print(f"Total chunks: {len(chunks)}")
print(f"Chunk 0 metadata: {chunks[0].metadata}")
print(f"Chunk 0 content preview: {chunks[0].page_content[:100]}...")`}
          output={`Total chunks: 11
Chunk 0 metadata: {'source': 'docs/manual.md', 'chunk_id': 0, 'total_chunks': 11, 'section': 'Battery'}
Chunk 0 content preview: The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions...`}
        />
        <P>
          <strong>Why metadata matters:</strong>
        </P>
        <Table
          head={["Use case", "How metadata helps"]}
          rows={[
            ["Citations", <>User asks &quot;How long is the battery?&quot; LLM answers &quot;28 minutes&quot;. You append: <IC>[manual.md — Battery section]</IC>. User trusts the answer because they know the source.</>],
            ["Filtered retrieval", <>User asks &quot;What&apos;s the warranty?&quot; You filter: <IC>{`retriever.search(query, filter={"section": "Warranty"})`}</IC>. Only warranty chunks are considered. Faster + more precise.</>],
            ["Debugging", "Wrong answer? Print the metadata of the retrieved chunks. See which file/section caused the issue. Fix the source doc or adjust chunking for that section."],
            ["Version tracking", <>Add <IC>{`{"version": "2.4", "updated": "2024-12-01"}`}</IC>. When docs update, you can filter by version or expire old chunks.</>],
          ]}
        />
        <Callout type="note">
          📌 <strong>Metadata is NOT embedded</strong> (unless you add it to <IC>page_content</IC>). It&apos;s stored alongside the vector and used for filtering/citations AFTER retrieval. If you want the LLM to see metadata, include it in the chunk text: <IC>f&quot;[Source: {`{metadata[&apos;source&apos;]}`}] {`{page_content}`}&quot;</IC>.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="markdown" number="09" title="MarkdownHeaderTextSplitter">
        <P>
          For markdown docs with headers (<IC>## Battery</IC>, <IC>## Warranty</IC>), use <IC>MarkdownHeaderTextSplitter</IC> FIRST, then <IC>RecursiveCharacterTextSplitter</IC>. It splits on headers and stores them as metadata.
        </P>
        <CodeBlock
          title="markdown_splitter.py"
          code={`from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

markdown_text = """# Nimbus X1 Manual

## Battery Specs
The X1 battery lasts 28 minutes and charges in 90 minutes.

## Warranty
12-month warranty. Returns within 30 days.
"""

# Step 1: Split on headers
header_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "Header 1"),
        ("##", "Header 2"),
    ]
)
header_chunks = header_splitter.split_text(markdown_text)

print(f"After header split: {len(header_chunks)} chunks")
for chunk in header_chunks:
    print(f"  Metadata: {chunk.metadata}")
    print(f"  Content: {chunk.page_content[:60]}...\\n")

# Step 2: Further split by size (if chunks are still too big)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
final_chunks = text_splitter.split_documents(header_chunks)

print(f"After size split: {len(final_chunks)} chunks")
for chunk in final_chunks:
    print(f"  Metadata: {chunk.metadata}")
    print(f"  Content: {chunk.page_content}\\n")`}
          output={`After header split: 2 chunks
  Metadata: {'Header 1': 'Nimbus X1 Manual', 'Header 2': 'Battery Specs'}
  Content: The X1 battery lasts 28 minutes and charges in 90 minutes...

  Metadata: {'Header 1': 'Nimbus X1 Manual', 'Header 2': 'Warranty'}
  Content: 12-month warranty. Returns within 30 days...

After size split: 2 chunks
  Metadata: {'Header 1': 'Nimbus X1 Manual', 'Header 2': 'Battery Specs'}
  Content: The X1 battery lasts 28 minutes and charges in 90 minutes.

  Metadata: {'Header 1': 'Nimbus X1 Manual', 'Header 2': 'Warranty'}
  Content: 12-month warranty. Returns within 30 days.`}
        />
        <P>
          <strong>The result:</strong> Every chunk knows which section it came from. You can now filter retrieval by section or cite the section in the answer: &quot;The battery lasts 28 minutes. [manual.md — Battery Specs]&quot; ⭐
        </P>
      </Section>

      {/* 10 */}
      <Section id="tokens" number="10" title="Token-Based Length">
        <P>
          <IC>chunk_size</IC> is in <strong>characters</strong> by default. But LLMs charge by <strong>tokens</strong>. For precise budgeting, use <IC>length_function</IC> with tiktoken:
        </P>
        <CodeBlock
          title="token_based_split.py"
          code={`from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

# tiktoken tokenizer (matches OpenAI's token counting)
encoding = tiktoken.encoding_for_model("gpt-4o-mini")

def token_length(text: str) -> int:
    return len(encoding.encode(text))

# Splitter with token-based length
splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,  # 100 TOKENS (not chars)
    chunk_overlap=20,
    length_function=token_length,  # custom length function
)

text = """The Nimbus X1 is a high-performance drone with 28 minutes of flight time, 5 km range, and a 795-gram weight. It includes GPS navigation, 4K camera, and autonomous return-to-home."""

chunks = splitter.split_text(text)
print(f"Chunks: {len(chunks)}")
for i, c in enumerate(chunks):
    print(f"Chunk {i} ({token_length(c)} tokens): {c}")`}
          output={`Chunks: 2
Chunk 0 (92 tokens): The Nimbus X1 is a high-performance drone with 28 minutes of flight time, 5 km range, and a 795-gram weight.
Chunk 1 (78 tokens): 795-gram weight. It includes GPS navigation, 4K camera, and autonomous return-to-home.`}
        />
        <P>
          <strong>Why tokens matter:</strong> Characters ≠ tokens. &quot;drone&quot; = 1 token. &quot;high-performance&quot; = 3 tokens. If you budget context by characters, you might overshoot the 8K token limit. Token-based splitting gives you precise control. For most use cases, character-based is fine. Use token-based for: (1) tight token budgets, (2) cost optimization, (3) models with small context windows.
        </P>
      </Section>

      {/* 11 */}
      <Section id="ingest" number="11" title="ingest.py for NimbusBot ⭐">
        <P>
          Here&apos;s the complete ingestion script for NimbusBot. Run it once to load, split, embed, and persist all chunks to Chroma. This is the foundation for all retrieval topics:
        </P>
        <CodeBlock
          title="ingest.py"
          code={`from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# 1. Load all .md files from ./docs
loader = DirectoryLoader("./docs", glob="**/*.md", loader_cls=TextLoader)
docs = loader.load()
print(f"Loaded {len(docs)} documents")

# 2. Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=80,
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)
chunks = splitter.split_documents(docs)
print(f"Split into {len(chunks)} chunks")

# 3. Embed & store in Chroma
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")  # 1536 dims
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./nimbus_db",  # persist to disk
)

print(f"✅ Ingested {len(chunks)} chunks from {len(docs)} files")
print(f"   Stored in ./nimbus_db (Chroma vector store)")
print(f"   Ready for retrieval!")`}
          output={`Loaded 3 documents
Split into 11 chunks
✅ Ingested 11 chunks from 3 files
   Stored in ./nimbus_db (Chroma vector store)
   Ready for retrieval!`}
        />
        <P>
          <strong>What this does:</strong>
        </P>
        <CodeBlock
          title="ingest_explained.txt"
          runnable={false}
          code={`Step-by-step breakdown:

1. DirectoryLoader("./docs", glob="**/*.md", loader_cls=TextLoader)
   → Loads all .md files in ./docs recursively.
   → Result: 3 Document objects (manual.md, faq.md, warranty.md).

2. RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
   → Splits each doc at natural boundaries (paragraphs, sentences).
   → Result: 11 chunks (~450-500 chars each, 80-char overlap).

3. OpenAIEmbeddings(model="text-embedding-3-small")
   → Converts each chunk to a 1536-dim vector.
   → 11 chunks = 11 API calls (batched by LangChain).
   → Cost: 11 chunks * 500 chars ≈ 1,400 tokens * $0.00002/1K ≈ $0.00003 (negligible).

4. Chroma.from_documents(documents=chunks, embedding=embeddings, persist_directory="./nimbus_db")
   → Stores vectors + text + metadata in Chroma.
   → persist_directory="./nimbus_db" saves to disk (SQLite + parquet files).
   → You can now load this vectorstore in other scripts without re-embedding!

────────────────────────────────────────────────────────────────────────────────
DIRECTORY STRUCTURE AFTER RUNNING:

project/
  docs/
    manual.md      ← source
    faq.md         ← source
    warranty.md    ← source
  nimbus_db/       ← NEW (Chroma persist dir)
    chroma.sqlite3
    [uuid]/
      data_level0.bin
      ...
  ingest.py        ← this script

────────────────────────────────────────────────────────────────────────────────
RUN ONCE, USE EVERYWHERE:

You run ingest.py ONCE when you add/update docs. All other scripts (retrieval,
RAG chains, evals) load the existing vectorstore:

  vectorstore = Chroma(
      persist_directory="./nimbus_db",
      embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
  )

No re-embedding! Instant load. ✅`}
        />
        <Callout type="tip">
          💡 <strong>When to re-run ingest.py</strong>: (1) You add/update docs in <IC>./docs</IC>. (2) You change <IC>chunk_size</IC> or <IC>chunk_overlap</IC>. (3) You switch embedding models. Otherwise, load the existing <IC>./nimbus_db</IC> — it&apos;s instant and free.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="debugging" number="12" title="Debugging Ingestion">
        <P>
          Here are the errors you&apos;ll hit and how to fix them:
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 1: UnicodeDecodeError when loading files</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`python ingest.py`}
          error
          output={`UnicodeDecodeError: 'utf-8' codec can't decode byte 0x93 in position 42: invalid start byte`}
        />
        <P>
          <strong>Fix</strong>: Your file is not UTF-8 encoded (maybe Windows-1252 or Latin-1). Pass <IC>encoding</IC> to TextLoader:
        </P>
        <CodeBlock
          title="fix_encoding.py"
          code={`loader = DirectoryLoader(
    "./docs",
    glob="**/*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"},  # or "latin-1", "windows-1252"
)`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Error 2: Zero chunks after splitting</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`python ingest.py`}
          output={`Loaded 3 documents
Split into 0 chunks
✅ Ingested 0 chunks from 3 files`}
        />
        <P>
          <strong>Cause</strong>: Your <IC>glob</IC> pattern matched files, but they&apos;re empty or the splitter config is broken. Debug:
        </P>
        <CodeBlock
          title="debug_empty_chunks.py"
          code={`docs = loader.load()
for doc in docs:
    print(f"Source: {doc.metadata['source']}, Length: {len(doc.page_content)} chars")
    print(f"Preview: {doc.page_content[:100]}...")

# If length=0 → your files are empty (wrong path or glob).
# If length>0 but chunks=0 → your chunk_size is larger than all docs combined.`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Error 3: Duplicate chunks after re-running ingest.py</strong>
        </Callout>
        <P>
          <strong>Symptom</strong>: You run <IC>ingest.py</IC> twice. Now retrieval returns duplicate results (the same chunk appears twice).
        </P>
        <P>
          <strong>Cause</strong>: <IC>Chroma.from_documents</IC> APPENDS to the existing store. It doesn&apos;t clear it. If you re-run ingestion, you get duplicates.
        </P>
        <P>
          <strong>Fix</strong>: Delete <IC>./nimbus_db</IC> before re-running:
        </P>
        <CodeBlock
          title="terminal"
          code={`rm -rf ./nimbus_db
python ingest.py`}
        />
        <P>
          Or, in code, clear the collection:
        </P>
        <CodeBlock
          title="clear_before_ingest.py"
          code={`import shutil
import os

# Delete the persist directory if it exists
if os.path.exists("./nimbus_db"):
    shutil.rmtree("./nimbus_db")

# Now run ingestion (creates fresh DB)
vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory="./nimbus_db")`}
        />
      </Section>

      {/* 13 */}
      <Section id="lab" number="13" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Re-chunk at different sizes and compare retrieval
──────────────────────────────────────────────────────────────────────────────

TASK 1: Baseline — chunk_size=500 (our default)
  Run ingest.py with chunk_size=500, chunk_overlap=80.
  Query: "How long does the X1 battery last?"
  Print the top-1 retrieved chunk and its similarity score.

TASK 2: Too small — chunk_size=200
  Delete ./nimbus_db.
  Change chunk_size=200, chunk_overlap=40.
  Re-run ingest.py.
  Same query. Does the top chunk have the full answer?
  Expected: More chunks, but each chunk might lack context.

TASK 3: Too large — chunk_size=2000
  Delete ./nimbus_db.
  Change chunk_size=2000, chunk_overlap=200.
  Re-run ingest.py.
  Same query. How many chunks? What's the similarity score?
  Expected: Only 2-3 chunks. Lower similarity (diluted vectors).

TASK 4: Compare
  Fill in this table:

  | chunk_size | # chunks | top-1 similarity | top-1 contains answer? |
  |------------|----------|------------------|------------------------|
  | 200        | ?        | ?                | ?                      |
  | 500        | 11       | 0.82             | YES ✅                 |
  | 2000       | ?        | ?                | ?                      |

  Which size works best for the battery query?

BONUS: Test edge-case queries
  - "What is the Nimbus X1?" (broad, should retrieve intro chunk)
  - "X1-BAT-002" (exact part number, test if small chunks help)
  - "How do I update firmware?" (specific, test if 500 is enough context)

──────────────────────────────────────────────────────────────────────────────
HINT: Retrieval code:

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

vectorstore = Chroma(
    persist_directory="./nimbus_db",
    embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
)

results = vectorstore.similarity_search_with_score("How long does the X1 battery last?", k=1)
chunk, score = results[0]
print(f"Similarity: {score:.2f}")
print(f"Chunk: {chunk.page_content}")`}
        />
      </Section>

      {/* 14 */}
      <Section id="interview" number="14" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is a Document in LangChain?", "A Document is the core data structure with two fields: page_content (the text string) and metadata (a dict with source, page, section, etc.). Loaders return list[Document]. Splitters take Documents and return more Documents (chunks). Every chunk is a Document."],
            ["Why can't you just split on newlines?", "Newlines don't always align with semantic boundaries. A paragraph might have multiple sentences. Splitting on \\n alone could cut mid-sentence. RecursiveCharacterTextSplitter tries \\n\\n (paragraphs) first, then \\n (lines), then \". \" (sentences), then \" \" (words), ensuring clean splits."],
            ["What does RecursiveCharacterTextSplitter do?", "It splits text at natural boundaries in order: \\n\\n, \\n, \". \", \" \", and finally character-count if needed. This keeps sentences and paragraphs intact. chunk_size controls max chunk length; chunk_overlap ensures facts straddling boundaries appear fully in at least one chunk."],
            ["Why is chunk_overlap important?", "If a fact is split across two chunks (e.g., \"battery: 28\" in chunk A, \"minutes\" in chunk B), neither chunk contains the complete fact. Overlap repeats the last N chars of chunk A at the start of chunk B, so the boundary region appears fully in both chunks. Insurance against cuts."],
            ["What's the ideal chunk_size?", "400-600 chars for most docs (NimbusBot uses 500). Too small (100-200) = facts lack context. Too large (2000+) = diluted embeddings (many unrelated facts in one vector) + wasted LLM context. Test with your queries: does top-1 chunk contain the answer?"],
            [<>How does <IC>DirectoryLoader</IC> work?</>, <>DirectoryLoader scans a directory with a glob pattern (e.g., <IC>**/*.md</IC>). Each matching file becomes one Document. You specify <IC>loader_cls=TextLoader</IC> (or PyPDFLoader, CSVLoader, etc.) to parse each file. Result: list[Document], one per file.</>],
            ["What does PyPDFLoader return?", "PyPDFLoader loads a PDF and returns one Document PER PAGE. A 12-page PDF → 12 Documents. Metadata includes {\"source\": \"file.pdf\", \"page\": 0} for each page. You then split pages further if they're too long."],
            ["Why use MarkdownHeaderTextSplitter?", "For markdown docs with ## headers, MarkdownHeaderTextSplitter splits on headers and stores them as metadata: {\"Header 2\": \"Battery Specs\"}. This enables: (1) filtered retrieval (only search Warranty section), (2) citations (\"answer is in manual.md — Battery Specs\"). Use it BEFORE RecursiveCharacterTextSplitter."],
            ["What is metadata used for?", "Metadata is NOT embedded (unless added to page_content). It's used for: (1) citations (show the user \"source: manual.md, section: Battery\"), (2) filtering (retriever.search(query, filter={\"section\": \"Warranty\"})), (3) debugging (which chunk caused a bad answer?)."],
            ["How do you debug empty chunks after splitting?", "Print len(chunks) and inspect chunks[0].page_content. If 0 chunks: (1) your files are empty (check glob pattern), (2) chunk_size > total text length (make chunk_size smaller), (3) encoding issue (file didn't load). Print len(docs) and docs[0].page_content to isolate loader vs splitter."],
            ["What happens if you re-run ingest.py without clearing the DB?", "Chroma.from_documents APPENDS to the existing vectorstore. You'll have duplicate chunks. Retrieval returns the same chunk twice. Fix: delete ./nimbus_db before re-ingesting, or use shutil.rmtree(\"./nimbus_db\") in code before Chroma.from_documents."],
            ["Chars vs tokens for chunk_size?", "By default, chunk_size is in characters. For precise token budgeting (cost + context limits), use length_function=tiktoken_length. Chars are simpler; tokens are exact. For most use cases, chars are fine. Use tokens if you have tight budgets or small context windows."],
          ]}
        />
      </Section>

      {/* 15 */}
      <Section id="memorize" number="15" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Load directory", "DirectoryLoader(\"./docs\", glob=\"**/*.md\", loader_cls=TextLoader).load()"],
            ["Recursive splitter", "RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80, separators=[\"\\n\\n\",\"\\n\",\". \",\" \",\"\"])"],
            ["Split docs (keeps metadata)", "splitter.split_documents(docs)  # NOT split_text"],
            ["Embed & store in Chroma", "Chroma.from_documents(chunks, OpenAIEmbeddings(model=\"text-embedding-3-small\"), persist_directory=\"./nimbus_db\")"],
            ["Load existing Chroma", "Chroma(persist_directory=\"./nimbus_db\", embedding_function=OpenAIEmbeddings(model=\"text-embedding-3-small\"))"],
            ["Chunk overlap rule", "chunk_overlap = 10-20% of chunk_size (e.g., 500 → 80)"],
            ["Document structure", "Document(page_content=str, metadata=dict)"],
            ["PyPDFLoader", "PyPDFLoader(\"file.pdf\").load()  # one Document per page"],
            ["Markdown header split", "MarkdownHeaderTextSplitter(headers_to_split_on=[(\"##\",\"Header 2\")]).split_text(text)"],
            ["Clear Chroma before re-ingest", "import shutil; shutil.rmtree(\"./nimbus_db\") if exists"],
            ["Token-based length", "RecursiveCharacterTextSplitter(chunk_size=100, length_function=lambda t: len(tiktoken.encode(t)))"],
            ["Ingest mantra", "Load → Split (with overlap!) → Embed → Store (persist_directory) ✅"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
