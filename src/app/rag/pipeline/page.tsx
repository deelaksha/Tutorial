"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The full RAG pipeline  from question to cited answer",
  nodes: [
    { id: "user", icon: "=d", label: "User", sub: "asks question", x: 3, y: 50, color: "#22d3ee" },
    { id: "embed", icon: "="", label: "Embed Question", sub: "text-embedding-3-small", x: 14, y: 50, color: "#fb923c" },
    { id: "chroma", icon: "💾", label: "Chroma", sub: "11 chunks", x: 25, y: 50, color: "#a78bfa" },
    { id: "top3", icon: "🎯", label: "Top-3 Chunks", sub: "similarity ranked", x: 36, y: 50, color: "#34d399" },
    { id: "format", icon: "📝", label: "format_docs", sub: "join chunks", x: 47, y: 50, color: "#fbbf24" },
    { id: "prompt", icon: "💬", label: "Prompt", sub: "system + context + question", x: 58, y: 50, color: "#f472b6" },
    { id: "llm", icon: "🧠", label: "gpt-4o-mini", sub: "generate", x: 69, y: 50, color: "#60a5fa" },
    { id: "answer", icon: "", label: "Answer", sub: "with citations", x: 80, y: 50, color: "#34d399" },
    { id: "sources", icon: "📚", label: "Sources", sub: "metadata list", x: 91, y: 50, color: "#a78bfa" },
  ],
  edges: [
    { id: "user-embed", from: "user", to: "embed", color: "#22d3ee" },
    { id: "embed-chroma", from: "embed", to: "chroma", color: "#fb923c" },
    { id: "chroma-top3", from: "chroma", to: "top3", color: "#a78bfa" },
    { id: "top3-format", from: "top3", to: "format", color: "#34d399" },
    { id: "format-prompt", from: "format", to: "prompt", color: "#fbbf24" },
    { id: "prompt-llm", from: "prompt", to: "llm", color: "#f472b6" },
    { id: "llm-answer", from: "llm", to: "answer", color: "#60a5fa" },
    { id: "top3-sources", from: "top3", to: "sources", dashed: true, color: "#a78bfa" },
    { id: "sources-answer", from: "sources", to: "answer", dashed: true, color: "#34d399" },
  ],
  flows: [
    {
      id: "happy",
      name: " Battery question  full trace",
      command: 'rag_chain.invoke("How long does the X1 battery last?")',
      steps: [
        { node: "user", paths: ["user-embed"], text: "User asks: \"How long does the X1 battery last?\" This is the input to our RAG chain. The chain will retrieve relevant chunks, format them as context, and generate an answer." },
        { node: "embed", paths: ["embed-chroma"], text: "OpenAIEmbeddings embeds the question into a 1536-dim vector. The query vector represents the semantic meaning of \"battery duration\". This vector will be compared to all 11 chunk vectors in Chroma." },
        { node: "chroma", paths: ["chroma-top3"], text: "Chroma performs similarity search: query_vector vs all 11 chunk vectors. Cosine similarity scores: chunk 2 (battery section) = 0.89, chunk 5 (specs) = 0.74, chunk 8 (FAQ) = 0.68. Returns top-3 chunks." },
        { node: "top3", paths: ["top3-format", "top3-sources"], text: "Top-3 chunks retrieved: [chunk 2: \"The Nimbus X1 flies for about 28 minutes...\", chunk 5: \"Specs: 28min battery, 5km range...\", chunk 8: \"Q: How long can I fly? A: 28 minutes...\"]. All contain the answer!" },
        { node: "format", paths: ["format-prompt"], text: "format_docs(chunks) joins the 3 chunks with \\n\\n separators into one context string: \"The Nimbus X1 flies for about 28 minutes...\\n\\nSpecs: 28min battery...\\n\\nQ: How long can I fly? A: 28 minutes...\". This becomes the {context} variable." },
        { node: "prompt", paths: ["prompt-llm"], text: "ChatPromptTemplate formats: System: \"You are NimbusBot... Answer ONLY from context...\" + \"Context:\\n{context}\\n\\nQuestion: {question}\". The LLM now has 3 relevant chunks + the question. Total prompt: ~450 tokens." },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini generates: \"The Nimbus X1 battery lasts about 28 minutes on a full charge.\" It pulled the fact from chunk 2 (highest similarity). The answer is grounded in the retrieved context  no hallucination!" },
        { node: "answer", paths: [], text: "Output: \"The Nimbus X1 battery lasts about 28 minutes on a full charge.\" We can append sources: [manual.md, faq.md]. The user gets a cited, confident answer. RAG pipeline complete! " },
      ],
    },
    {
      id: "fail",
      name: "L Off-topic question  honest \"I don't know\"",
      command: 'rag_chain.invoke("Does the X1 have obstacle avoidance?")',
      steps: [
        { node: "user", paths: ["user-embed"], text: "User asks: \"Does the X1 have obstacle avoidance?\" This feature is NOT mentioned in our 3 docs (manual, FAQ, warranty). Let's see how the RAG chain handles it." },
        { node: "embed", paths: ["embed-chroma"], text: "Query vector represents \"obstacle avoidance\". This is embedded into 1536 dims. The semantic meaning is clear, but our corpus doesn't have matching content." },
        { node: "chroma", paths: ["chroma-top3"], text: "Chroma searches all 11 chunks. Best match: chunk 7 (\"max wind 38 km/h\") with similarity 0.38 (LOW!). Chunk 3 (\"GPS return-to-home\") = 0.31. Chunk 5 (\"weight 795g\") = 0.28. No chunk talks about obstacles." },
        { node: "top3", paths: ["top3-format"], text: "Top-3 chunks: all have low similarity (< 0.4). They mention wind resistance, GPS, and weight  nothing about obstacle avoidance. The retriever did its job (returned best matches), but they're not relevant." },
        { node: "format", paths: ["format-prompt"], text: "format_docs joins the 3 low-relevance chunks: \"Max wind 38 km/h...\\n\\nGPS return-to-home...\\n\\nWeight: 795g...\". This context does NOT answer the question. The LLM will have to admit it doesn't know." },
        { node: "prompt", paths: ["prompt-llm"], text: "Prompt includes: System instruction: \"If the answer is not in the context, say you don't know. DO NOT make up information.\" + Context (3 irrelevant chunks) + Question: \"Does the X1 have obstacle avoidance?\"" },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini reads the context, sees no mention of obstacle avoidance. It follows the system instruction and generates: \"I don't have information about obstacle avoidance features in the provided documentation.\" Honest answer!" },
        { node: "answer", paths: [], text: "Output: \"I don't have information about obstacle avoidance features in the provided documentation.\" No hallucination! The system instruction saved us. Without it, GPT might invent an answer. This is RAG done right. L❓" },
      ],
    },
    {
      id: "power",
      name: "❓ Returns question with filtered retrieval + citations",
      command: 'retriever.search(query, filter={"source": "docs/warranty.md"})',
      steps: [
        { node: "user", paths: ["user-embed"], text: "User asks: \"What is your return policy?\" We'll use metadata filtering to only search the warranty.md file. This is more precise than searching all 11 chunks." },
        { node: "embed", paths: ["embed-chroma"], text: "Query vector for \"return policy\" is embedded. We'll pass this to Chroma WITH a metadata filter: {\"source\": \"docs/warranty.md\"}. Only chunks from warranty.md will be considered." },
        { node: "chroma", paths: ["chroma-top3"], text: "Chroma searches only 3 chunks (all from warranty.md). Chunk 9 (\"Returns accepted within 30 days...\") = 0.91 similarity. Chunk 10 (\"12-month warranty...\") = 0.52. Filtered retrieval = faster + more precise!" },
        { node: "top3", paths: ["top3-format", "top3-sources"], text: "Top-3 chunks (all from warranty.md): chunk 9 is perfect (\"Returns within 30 days, contact support@nimbusgear...\"). Chunks 10-11 are also warranty-related. All chunks have metadata={\"source\": \"docs/warranty.md\"}." },
        { node: "format", paths: ["format-prompt"], text: "format_docs joins chunks. We also capture metadata.source from each chunk to build a citation list: sources = [\"docs/warranty.md\"]. Context string is clean and focused on returns." },
        { node: "prompt", paths: ["prompt-llm"], text: "Prompt: System + Context (3 warranty chunks) + Question. We can also inject: \"Cite your sources in brackets.\" The LLM will include [warranty.md] in the answer." },
        { node: "llm", paths: ["llm-answer"], text: "gpt-4o-mini generates: \"Returns are accepted within 30 days of purchase. Contact support@nimbusgear.example.com for an RMA. [warranty.md]\" The answer is grounded + cited!" },
        { node: "sources", paths: ["sources-answer"], text: "We extract unique sources from retrieved chunks: [\"docs/warranty.md\"]. Append to answer or display separately. User sees: Answer + Sources. Trust = 100%." },
        { node: "answer", paths: [], text: "Output: \"Returns are accepted within 30 days of purchase. Contact support@nimbusgear.example.com for an RMA.\" Sources: [warranty.md]. Filtered retrieval + citations = surgical precision. ❓" },
      ],
    },
  ],
};

const NAV = [
  { id: "recap", label: "Assembling the Full Pipeline" },
  { id: "prompt", label: "The RAG Prompt Template P" },
  { id: "format", label: "format_docs  Chunks to String" },
  { id: "chain", label: "The LCEL RAG Chain P" },
  { id: "helpers", label: "Helper Functions (create_retrieval_chain)" },
  { id: "citations", label: "Citations  Cite Your Sources P" },
  { id: "streaming", label: "Streaming Answers" },
  { id: "eval", label: "Quick Evaluation Harness" },
  { id: "cost", label: "Cost & Latency Budget" },
  { id: "nimbusbot", label: "Complete nimbusbot.py P" },
  { id: "debugging", label: "Debugging the Pipeline" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function PipelinePage() {
  return (
    <TopicShell
      icon="🏗"
      title="The Full RAG Pipeline  End to End"
      gradientWord="Pipeline"
      subtitle="Ingest ❓ retrieve ❓ prompt ❓ generate ❓ cite. This is the flagship topic: you'll build the complete NimbusBot RAG system from scratch. Every stage traced with real intermediate values. By the end, you'll have a working chatbot that answers from docs, cites sources, and says \"I don't know\" when it should. This is RAG done right."
      nav={NAV}
      badges={["🔗 LCEL chain: retriever | prompt | LLM", "💬 RAG prompt design", "📚 Citations + sources", "🧪 Quick eval harness", "🤖 Complete chatbot script"]}
      next={{ icon: "💬", label: "Conversational RAG  Memory", href: "/rag/conversational" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="recap" number="01" title="Assembling the Full Pipeline">
        <P>
          You&apos;ve learned the pieces. Now we assemble them into the full RAG pipeline:
        </P>
        <Table
          head={["Stage", "What we built", "From which topic"]}
          rows={[
            [<>1. <strong>Load & split</strong></>, <>DirectoryLoader ❓ RecursiveCharacterTextSplitter ❓ 11 chunks</>, "Loaders & Splitters (previous topic)"],
            [<>2. <strong>Embed & store</strong></>, <>OpenAIEmbeddings ❓ Chroma (persist to ./nimbus_db)</>, "Loaders & Splitters (previous topic)"],
            [<>3. <strong>Retrieve</strong></>, <>Chroma.as_retriever(k=3) ❓ similarity_search ❓ top-3 chunks</>, "Retrievers (previous topic)"],
            [<>4. <strong>Prompt</strong></>, <>ChatPromptTemplate with system instruction + context + question</>, "This topic P"],
            [<>5. <strong>Generate</strong></>, <>ChatOpenAI (gpt-4o-mini) reads context, generates answer</>, "This topic P"],
            [<>6. <strong>Parse & cite</strong></>, <>StrOutputParser extracts text; append sources from metadata</>, "This topic P"],
          ]}
        />
        <P>
          The chain: <IC>Question ❓ embed ❓ retrieve top-k ❓ format as context ❓ prompt LLM ❓ generate answer</IC>. Every RAG system follows this flow. Let&apos;s build it step by step. 
        </P>
      </Section>

      {/* 02 */}
      <Section id="prompt" number="02" title="The RAG Prompt Template P">
        <P>
          The prompt is THE most important part of RAG. It tells the LLM: (1) what role to play, (2) what data to use (the retrieved context), (3) what NOT to do (hallucinate). Here&apos;s the NimbusBot prompt:
        </P>
        <CodeBlock
          title="rag_prompt.py"
          code={`from langchain_core.prompts import ChatPromptTemplate

template = """You are NimbusBot, a helpful support assistant for Nimbus Gear drones.

Your job: Answer the user's question using ONLY the information in the Context below.

Rules:
1. If the answer is in the Context, provide a clear, concise response.
2. If the answer is NOT in the Context, say: "I don't have that information in the documentation."
3. DO NOT make up information. DO NOT use knowledge outside the Context.
4. Be friendly and helpful.

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# Test: format with sample data
formatted = prompt.format(
    context="The Nimbus X1 battery lasts 28 minutes on a full charge.",
    question="How long does the battery last?"
)
print(formatted)`}
          output={`You are NimbusBot, a helpful support assistant for Nimbus Gear drones.

Your job: Answer the user's question using ONLY the information in the Context below.

Rules:
1. If the answer is in the Context, provide a clear, concise response.
2. If the answer is NOT in the Context, say: "I don't have that information in the documentation."
3. DO NOT make up information. DO NOT use knowledge outside the Context.
4. Be friendly and helpful.

Context:
The Nimbus X1 battery lasts 28 minutes on a full charge.

Question: How long does the battery last?

Answer:`}
        />
        <P>
          <strong>Why each part matters:</strong>
        </P>
        <Table
          head={["Prompt element", "Why it&apos;s critical"]}
          rows={[
            [<>&quot;You are NimbusBot...&quot;</>, "Sets the role. The LLM adopts a helpful, support-assistant tone. Without this, it might be too formal or too casual."],
            [<>&quot;using ONLY the Context&quot;</>, "Grounds the answer. The LLM must IGNORE its training data and rely solely on the retrieved chunks. This is the core of RAG."],
            [<>&quot;If the answer is NOT in the Context, say...&quot;</>, "Prevents hallucinations. Without this, GPT will invent plausible-sounding answers. This instruction forces honesty."],
            [<>&quot;DO NOT make up information&quot;</>, "Reinforces the no-hallucination rule. Repetition helps (LLMs sometimes need it stated 2-3 ways)."],
            [<IC>{`{context}`}</IC>, "The placeholder for retrieved chunks. We'll inject the top-k chunks here (formatted as a single string)."],
            [<IC>{`{question}`}</IC>, "The user's question. We pass this as a variable to the prompt template."],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Prompt engineering for RAG</strong>: The &quot;don&apos;t know&quot; instruction is NON-NEGOTIABLE. Without it, GPT-4o-mini will hallucinate ~30% of the time on off-topic questions. With it, hallucination drops to &lt;5%. Test both: ask a question NOT in your docs. A good RAG system says &quot;I don&apos;t know&quot;. A bad one invents an answer.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="format" number="03" title="format_docs  Chunks to String">
        <P>
          The retriever returns <IC>list[Document]</IC> (3-5 chunks). The prompt expects a single <IC>context</IC> string. We need a helper to join them:
        </P>
        <CodeBlock
          title="format_docs.py"
          code={`def format_docs(docs):
    """Join retrieved chunks into one context string."""
    return "\\n\\n".join(doc.page_content for doc in docs)

# Example: 3 retrieved chunks
from langchain_core.documents import Document

chunks = [
    Document(page_content="The X1 battery lasts 28 minutes.", metadata={"source": "manual.md"}),
    Document(page_content="Max wind resistance: 38 km/h.", metadata={"source": "manual.md"}),
    Document(page_content="Returns within 30 days.", metadata={"source": "warranty.md"}),
]

context_str = format_docs(chunks)
print(context_str)`}
          output={`The X1 battery lasts 28 minutes.

Max wind resistance: 38 km/h.

Returns within 30 days.`}
        />
        <P>
          <strong>Why <IC>\n\n</IC> separators?</strong> Double-newline creates visual separation. The LLM sees 3 distinct facts. Single <IC>\n</IC> would blend them into one paragraph. Triple <IC>\n\n\n</IC> wastes tokens. Double is the sweet spot.
        </P>
        <Callout type="behind">
          ❓ <strong>Optional enhancement</strong>: Add source tags to each chunk: <IC>f&quot;[Source: {`{doc.metadata[&apos;source&apos;]}`}] {`{doc.page_content}`}&quot;</IC>. The LLM can then cite sources in its answer: &quot;The battery lasts 28 minutes [manual.md].&quot; We&apos;ll implement this in the Citations section.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="chain" number="04" title="The LCEL RAG Chain P">
        <P>
          Now we build the chain. LCEL (LangChain Expression Language) lets us pipe stages together with <IC>|</IC>. Here&apos;s the full RAG chain:
        </P>
        <CodeBlock
          title="rag_chain.py"
          code={`from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 1. Load the persisted vectorstore
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)

# 2. Create retriever (top-3 chunks)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 3. Define the prompt
template = """You are NimbusBot, a support assistant for Nimbus Gear.

Answer the question using ONLY the Context below. If the answer is not in the Context, say "I don't have that information."

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# 4. Define the LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 5. Helper function: join chunks into context string
def format_docs(docs):
    return "\\n\\n".join(doc.page_content for doc in docs)

# 6. Build the RAG chain (LCEL)
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 7. Invoke the chain
answer = rag_chain.invoke("How long does the X1 battery last?")
print(answer)`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>Let&apos;s dissect this chain line by line:</strong>
        </P>
        <CodeBlock
          title="chain_explained.txt"
          runnable={false}
          code={`{"context": retriever | format_docs, "question": RunnablePassthrough()}
 ❓                ❓           ❓                       ❓
 |                |           |                       |
 Creates a dict   retriever   pipe into format_docs   pass the input through unchanged

HOW IT WORKS:
- Input: "How long does the X1 battery last?" (a string)
- This string flows into TWO branches in parallel:

  Branch 1: "context" key
    ❓ retriever.invoke("How long...") ❓ [chunk1, chunk2, chunk3] (list[Document])
    ❓ format_docs([chunk1, chunk2, chunk3]) ❓ "chunk1\\n\\nchunk2\\n\\nchunk3" (string)

  Branch 2: "question" key
    ❓ RunnablePassthrough() ❓ "How long does the X1 battery last?" (unchanged)

- Result: {"context": "chunk1\\n\\nchunk2\\n\\nchunk3", "question": "How long..."}

                                                                                
| prompt
❓
pipe the dict into prompt.invoke(...)

HOW IT WORKS:
- prompt.invoke({"context": "...", "question": "..."})
- ChatPromptTemplate.from_template fills {context} and {question} placeholders
- Result: A ChatPromptValue (list of messages: [SystemMessage(...), HumanMessage(...)])

                                                                                
| llm
❓
pipe the prompt into llm.invoke(...)

HOW IT WORKS:
- llm.invoke(ChatPromptValue) sends messages to gpt-4o-mini
- LLM reads context + question, generates answer
- Result: AIMessage(content="The Nimbus X1 battery lasts about 28 minutes...")

                                                                                
| StrOutputParser()
❓
pipe the AIMessage into parser

HOW IT WORKS:
- StrOutputParser() extracts .content from AIMessage
- Result: "The Nimbus X1 battery lasts about 28 minutes..." (plain string)

                                                                                
FINAL OUTPUT:
  "The Nimbus X1 battery lasts about 28 minutes on a full charge."

                                                                                
THE MAGIC OF LCEL:
- Each stage is a Runnable (invoke method).
- | pipes output of left into input of right.
- Parallel dict keys run in parallel (retriever runs while question passes through).
- You can .invoke(), .stream(), .batch()  same chain, different execution modes.
- Debugging: call each stage manually to see intermediate values.`}
        />
        <Callout type="note">
          🗌 <strong>Why RunnablePassthrough()?</strong> The input (&quot;How long...&quot;) needs to flow to TWO places: (1) the retriever (to fetch chunks) and (2) the prompt (as the {`{question}`} variable). <IC>RunnablePassthrough()</IC> is a no-op: it takes the input and returns it unchanged. This lets us capture the question while also sending it to the retriever.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="helpers" number="05" title="Helper Functions (create_retrieval_chain)">
        <P>
          LCEL gives you full control, but LangChain also provides helper functions for common patterns. <IC>create_retrieval_chain</IC> + <IC>create_stuff_documents_chain</IC> build the same RAG chain with less boilerplate:
        </P>
        <CodeBlock
          title="helper_chain.py"
          code={`from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# Setup
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Prompt (different format: uses {input} and {context})
prompt = ChatPromptTemplate.from_template(
    """You are NimbusBot. Answer using ONLY the context. If not in context, say "I don't know."

Context: {context}

Question: {input}"""
)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Step 1: Create a "stuff documents" chain (formats docs into prompt)
combine_docs_chain = create_stuff_documents_chain(llm, prompt)

# Step 2: Create retrieval chain (retriever + combine_docs_chain)
rag_chain = create_retrieval_chain(retriever, combine_docs_chain)

# Invoke
result = rag_chain.invoke({"input": "How long does the battery last?"})
print("Answer:", result["answer"])
print("Context docs:", len(result["context"]))`}
          output={`Answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.
Context docs: 3`}
        />
        <P>
          <strong>LCEL vs helpers  which to use?</strong>
        </P>
        <Table
          head={["Approach", "Pros", "Cons"]}
          rows={[
            [<>LCEL (<IC>{`{&quot;context&quot;: retriever | format_docs, ...}`}</IC>)</>, <>Full control. You see every stage. Easy to customize (add reranking, compression, multi-query). Debugging is transparent.</>, "More verbose. You write format_docs yourself."],
            [<>Helpers (<IC>create_retrieval_chain</IC>)</>, <>Less boilerplate. Returns a dict with <IC>answer</IC> AND <IC>context</IC> (free citations). Good for quick prototypes.</>, <>Less flexible. Harder to customize (e.g., inject reranking). The chain is a black box (harder to debug intermediate steps).</>],
          ]}
        />
        <P>
          For learning, use <strong>LCEL</strong> (you understand what&apos;s happening). For production, LCEL is still preferred (easier to extend). Helpers are fine for quick demos. NimbusBot uses LCEL. P
        </P>
      </Section>

      {/* 06 */}
      <Section id="citations" number="06" title="Citations  Cite Your Sources P">
        <P>
          Users trust answers more when you cite sources. Two approaches: (1) <strong>Instruct the LLM</strong> to include citations in the answer. (2) <strong>Programmatically append</strong> sources from metadata.
        </P>
        <CodeBlock
          title="citations_approach1.py"
          code={`# Approach 1: Prompt the LLM to cite sources

def format_docs_with_sources(docs):
    """Format chunks with [source] tags."""
    chunks = []
    for doc in docs:
        source = doc.metadata.get("source", "unknown")
        chunks.append(f"[Source: {source}]\\n{doc.page_content}")
    return "\\n\\n".join(chunks)

template = """You are NimbusBot. Answer using ONLY the context. Cite your sources in brackets at the end.

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# Modified chain with source tags in context
rag_chain = (
    {"context": retriever | format_docs_with_sources, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

answer = rag_chain.invoke("How long does the battery last?")
print(answer)`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge. [manual.md]`}
        />
        <CodeBlock
          title="citations_approach2.py"
          code={`# Approach 2: Append sources programmatically (more reliable)

def rag_with_sources(question: str):
    # Retrieve chunks
    chunks = retriever.invoke(question)

    # Format context
    context = format_docs(chunks)

    # Generate answer
    answer = (prompt | llm | StrOutputParser()).invoke({"context": context, "question": question})

    # Extract unique sources
    sources = list(set(doc.metadata.get("source", "unknown") for doc in chunks))

    return {
        "answer": answer,
        "sources": sources,
        "chunks": chunks  # for debugging
    }

result = rag_with_sources("How long does the battery last?")
print("Answer:", result["answer"])
print("Sources:", result["sources"])`}
          output={`Answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.
Sources: ['docs/manual.md', 'docs/faq.md']`}
        />
        <P>
          <strong>Which approach?</strong>
        </P>
        <Table
          head={["Approach", "When to use"]}
          rows={[
            ["LLM cites inline (approach 1)", "When you want natural citations in the answer text: \"The battery lasts 28 minutes [manual.md].\" Good for chat UIs. BUT: LLM sometimes forgets to cite or cites incorrectly."],
            ["Programmatic append (approach 2)", "When you want guaranteed, accurate citations. Display sources separately in the UI: Answer + \"Sources: manual.md, faq.md\". Recommended for production. P"],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Best practice</strong>: Use approach 2 (programmatic). LLMs are unreliable at following citation instructions (~20% of the time they skip it). Programmatic citations = 100% reliable. You can ALSO include source tags in context (approach 1 format) as a hint to the LLM, then override with programmatic sources. Belt + suspenders.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="streaming" number="07" title="Streaming Answers">
        <P>
          For chat UIs, you want to stream the answer token by token (like ChatGPT). LCEL chains support streaming out of the box:
        </P>
        <CodeBlock
          title="streaming_chain.py"
          code={`# Same chain, just call .stream() instead of .invoke()

for chunk in rag_chain.stream("How long does the battery last?"):
    print(chunk, end="", flush=True)
print()  # newline at end`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>What happens?</strong> Each <IC>chunk</IC> is a small piece of the answer (1-5 tokens). You print it immediately, creating a typewriter effect. The user sees the answer appear in real time.
        </P>
        <CodeBlock
          title="streaming_with_sources.py"
          code={`# Streaming + sources (retrieve first, then stream LLM output)

def rag_stream_with_sources(question: str):
    # Retrieve chunks (blocking  happens first)
    chunks = retriever.invoke(question)
    context = format_docs(chunks)

    # Stream the LLM answer
    print("Answer: ", end="", flush=True)
    for chunk in (prompt | llm | StrOutputParser()).stream({"context": context, "question": question}):
        print(chunk, end="", flush=True)
    print()  # newline

    # Print sources after streaming completes
    sources = list(set(doc.metadata.get("source", "unknown") for doc in chunks))
    print(f"Sources: {', '.join(sources)}")

rag_stream_with_sources("How long does the battery last?")`}
          output={`Answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.
Sources: docs/manual.md, docs/faq.md`}
        />
        <Callout type="note">
          🗌 <strong>Why retrieval isn&apos;t streamed</strong>: Retrieval is fast (~50-100ms for Chroma). Streaming retrieval adds complexity for no UX gain. Stream only the LLM output (1-3 seconds for a 50-token answer). The user sees: [retrieval happens] ❓ [answer starts streaming immediately].
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="eval" number="08" title="Quick Evaluation Harness">
        <P>
          How do you know if your RAG system works? Test it! Here&apos;s a 5-question mini eval harness (preview of the advanced Evals topic):
        </P>
        <CodeBlock
          title="mini_eval.py"
          code={`# Define test cases: (question, expected_fact)
eval_cases = [
    ("How long does the X1 battery last?", "28 minutes"),
    ("What is the max wind resistance?", "38 km/h"),
    ("What is the range?", "5 km"),
    ("How long is the warranty?", "12 months"),
    ("Can I return the drone?", "30 days"),
]

# Run eval
score = 0
for question, expected_fact in eval_cases:
    answer = rag_chain.invoke(question)
    if expected_fact.lower() in answer.lower():
        print(f" {question}")
        print(f"   Expected: {expected_fact}  Found in: {answer[:60]}...")
        score += 1
    else:
        print(f"L {question}")
        print(f"   Expected: {expected_fact}  Got: {answer[:60]}...")
print(f"\\nScore: {score}/{len(eval_cases)}")`}
          output={` How long does the X1 battery last?
   Expected: 28 minutes  Found in: The Nimbus X1 battery lasts about 28 minutes on a full cha...
 What is the max wind resistance?
   Expected: 38 km/h  Found in: The maximum wind resistance is 38 km/h...
 What is the range?
   Expected: 5 km  Found in: The range is 5 km in ideal conditions...
 How long is the warranty?
   Expected: 12 months  Found in: The Nimbus X1 is covered by a 12-month warranty...
 Can I return the drone?
   Expected: 30 days  Found in: Yes, returns are accepted within 30 days of purchase...

Score: 5/5`}
        />
        <P>
          <strong>5/5!</strong> Your RAG system is working. For production, expand this to 50-100 test cases covering edge cases (off-topic questions, multi-hop reasoning, ambiguous queries). This simple harness catches 80% of regressions.
        </P>
      </Section>

      {/* 09 */}
      <Section id="cost" number="09" title="Cost & Latency Budget">
        <P>
          Let&apos;s calculate the cost and latency of one RAG query:
        </P>
        <Table
          head={["Stage", "Cost", "Latency", "Notes"]}
          rows={[
            [<>1. Embed question</>, "$0.000002", "20-50ms", <>1 embedding call (text-embedding-3-small). ~10 tokens * $0.00002/1K = $0.0000002. Rounds to $0.000002.</>],
            [<>2. Retrieve from Chroma</>, "$0", "30-80ms", "Local similarity search (no API call). Free. Latency depends on corpus size (11 chunks = instant)."],
            [<>3. LLM generation</>, "$0.00015", "1000-2000ms", <>gpt-4o-mini. Prompt: ~600 tokens (context) + 50 tokens (system + question) = 650 input tokens. Output: ~50 tokens. Cost: (650*$0.00015/1K) + (50*$0.0006/1K) H $0.00015.</>],
            [<><strong>Total per query</strong></>, <strong>$0.00015</strong>, <strong>1-2 seconds</strong>, <>Embedding cost is negligible. LLM dominates cost. For 1,000 queries/day: $0.15/day = $4.50/month. Cheap! </>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Cost optimization</strong>: (1) Use gpt-4o-mini (10x cheaper than gpt-4o). (2) Keep k=3 (not k=10  more context = more input tokens). (3) Use smaller chunks (500 chars, not 2000). (4) Cache embeddings (we do: Chroma persist). For 99% of RAG apps, cost is NOT the bottleneck. Latency is  focus on that.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="nimbusbot" number="10" title="Complete nimbusbot.py P">
        <P>
          Here&apos;s the full NimbusBot script. Run it to chat with your docs:
        </P>
        <CodeBlock
          title="nimbusbot.py"
          code={`from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 1. Load vectorstore
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 2. Define prompt
template = """You are NimbusBot, a helpful support assistant for Nimbus Gear drones.

Answer the user's question using ONLY the information in the Context below.
If the answer is NOT in the Context, say: "I don't have that information in the documentation."
DO NOT make up information.

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# 3. LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 4. Helper
def format_docs(docs):
    return "\\n\\n".join(doc.page_content for doc in docs)

# 5. Build chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 6. REPL loop
print("NimbusBot ready! (type 'quit' to exit)\\n")
while True:
    question = input("You: ")
    if question.lower() in ["quit", "exit", "q"]:
        print("Goodbye!")
        break

    answer = rag_chain.invoke(question)
    print(f"NimbusBot: {answer}\\n")`}
          output={`NimbusBot ready! (type 'quit' to exit)

You: How long does the X1 battery last?
NimbusBot: The Nimbus X1 battery lasts about 28 minutes on a full charge.

You: What's the return policy?
NimbusBot: Returns are accepted within 30 days of purchase. Contact support@nimbusgear.example.com for an RMA.

You: Does it have obstacle avoidance?
NimbusBot: I don't have that information in the documentation.

You: quit
Goodbye!`}
        />
        <P>
          <strong>This is it!</strong> A working RAG chatbot in 40 lines. It answers from docs, cites nothing when it doesn&apos;t know, and runs locally. You&apos;ve built the full pipeline. 🆉
        </P>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging the Pipeline">
        <P>
          When answers are wrong, debug in order: retrieval ❓ prompt ❓ LLM. Here&apos;s the triage ladder:
        </P>
        <Callout type="mistake">
          ❓ <strong>Step 1: Print retrieved chunks</strong>
        </Callout>
        <CodeBlock
          title="debug_retrieval.py"
          code={`question = "How long does the battery last?"

# Manually invoke retriever
chunks = retriever.invoke(question)

print(f"Retrieved {len(chunks)} chunks:")
for i, chunk in enumerate(chunks):
    print(f"\\nChunk {i+1} (source: {chunk.metadata.get('source', 'unknown')}):")
    print(chunk.page_content[:200])`}
          output={`Retrieved 3 chunks:

Chunk 1 (source: docs/manual.md):
The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions. Battery charges fully in 90 minutes using the included USB-C cable.

Chunk 2 (source: docs/faq.md):
Q: How long can I fly the X1?
A: The X1 flies for about 28 minutes on a full charge...

Chunk 3 (source: docs/manual.md):
Specs: Weight 795g, Range 5km, Flight time 28min, Max wind 38km/h...`}
        />
        <P>
          <strong>Question to ask:</strong> Does chunk 1 or 2 contain the answer? If YES ❓ retrieval is fine, move to step 2. If NO ❓ retrieval failed (re-chunk? tune k? check embeddings?).
        </P>
        <Callout type="mistake">
          ❓ <strong>Step 2: Print the final prompt</strong>
        </Callout>
        <CodeBlock
          title="debug_prompt.py"
          code={`context = format_docs(chunks)
formatted_prompt = prompt.format(context=context, question=question)

print("FINAL PROMPT SENT TO LLM:")
print("=" * 80)
print(formatted_prompt)
print("=" * 80)`}
          output={`FINAL PROMPT SENT TO LLM:
================================================================================
You are NimbusBot, a helpful support assistant for Nimbus Gear drones.

Answer the user's question using ONLY the information in the Context below.
If the answer is NOT in the Context, say: "I don't have that information in the documentation."
DO NOT make up information.

Context:
The Nimbus X1 battery provides up to 28 minutes of flight time on a full charge in calm conditions. Battery charges fully in 90 minutes using the included USB-C cable.

Q: How long can I fly the X1?
A: The X1 flies for about 28 minutes on a full charge...

Specs: Weight 795g, Range 5km, Flight time 28min, Max wind 38km/h...

Question: How long does the battery last?

Answer:
================================================================================`}
        />
        <P>
          <strong>Question to ask:</strong> Is the answer CLEARLY in the context? If YES ❓ LLM should answer correctly. If it doesn&apos;t, the prompt instructions are weak (add more &quot;DO NOT hallucinate&quot; warnings). If NO ❓ retrieval failed (go back to step 1).
        </P>
        <Callout type="mistake">
          ❓ <strong>Step 3: Only THEN blame the LLM</strong>
        </Callout>
        <P>
          If steps 1-2 look good but the answer is still wrong, it&apos;s an LLM issue. Try: (1) temperature=0 (more deterministic), (2) stronger model (gpt-4o instead of gpt-4o-mini), (3) rephrased prompt, (4) few-shot examples in the prompt.
        </P>
        <Table
          head={["Symptom", "Root cause", "Fix"]}
          rows={[
            ["Answer is wrong but retrieval looks good", "LLM misread the context OR prompt is unclear", "Print the prompt. Check if instructions are explicit. Try temperature=0. Try gpt-4o."],
            ["Answer is \"I don't know\" but the answer IS in the chunks", "LLM is being overly cautious (system instruction too strong)", <>Soften the instruction: &quot;If the answer is not CLEARLY in the context...&quot; ❓ &quot;If you can&apos;t find the answer...&quot;</>],
            ["Answer is off-topic / hallucinated", "LLM ignored the context (retrieval returned low-relevance chunks)", "Check retrieval (step 1). If chunks are bad, re-chunk or tune k. If chunks are good, strengthen prompt: \"ONLY use the context. Ignore your training data.\""],
            ["Answer is correct but cites wrong source", "Metadata is wrong OR you're using LLM citations (unreliable)", "Use programmatic citations (approach 2 from Citations section). Don't trust LLM to cite correctly."],
          ]}
        />
        <Callout type="tip">
          💡 <strong>The debugging mantra</strong>: Print retrieved chunks FIRST. 90% of RAG bugs are bad retrieval (chunks don&apos;t contain the answer). Only 10% are LLM issues. Don&apos;t waste time tuning prompts if retrieval is broken.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Add a 4th doc and query for new content
                                                                              

TASK 1: Create changelog.md
  Create ./docs/changelog.md:

  # Nimbus X1 Changelog

  ## Version 2.4 (2024-12-01)
  - Added Follow-Me mode (drone follows GPS signal from phone)
  - Improved wind resistance algorithm
  - Battery optimization: +2 minutes flight time in Eco mode

  ## Version 2.3 (2024-10-15)
  - Firmware stability improvements
  - Bug fix: GPS lock time reduced

TASK 2: Re-ingest
  Delete ./nimbus_db:
    rm -rf ./nimbus_db

  Run ingest.py (it will now load 4 files: manual, faq, warranty, changelog)
  Expected output: "Ingested X chunks from 4 files" (X should be ~14-15)

TASK 3: Test new content
  Run nimbusbot.py
  Ask: "What is Follow-Me mode?"
  Expected: NimbusBot should describe Follow-Me from changelog.md 

  Ask: "How long does the battery last in Eco mode?"
  Expected: "30 minutes in Eco mode" (28 base + 2 from changelog) 

TASK 4: Test edge case
  Ask: "What's new in version 2.3?"
  Expected: NimbusBot cites changelog.md, mentions GPS lock fix 

  Ask: "Does the X1 have a camera?"
  Expected: "I don't have that information..." (not in docs) 

BONUS: Add citations
  Modify nimbusbot.py to use the rag_with_sources() function from the Citations section.
  After each answer, print: "Sources: [manual.md, changelog.md]"
  Verify that changelog.md appears in sources for Follow-Me questions.

                                                                              
REFLECTION:
- How many chunks did changelog.md become? (check ingest.py output)
- Did retrieval find the right chunks for "Follow-Me"? (print chunks to verify)
- What happens if you ask about version 2.2? (not in docs  test "I don't know")

This exercise shows the full loop: add docs ❓ re-ingest ❓ query ❓ verify.
In production, you'd automate re-ingestion (daily cron job, webhook on doc updates).`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["Walk me through a RAG system end-to-end.", "RAG has 3 stages: (1) Ingest: load docs ❓ split into chunks ❓ embed ❓ store in vectorstore (one-time setup). (2) Retrieve: embed user question ❓ similarity search vectorstore ❓ return top-k chunks. (3) Generate: format chunks as context ❓ prompt LLM (\"answer using ONLY context\") ❓ LLM generates answer. The key: LLM never sees the full docs, only the relevant chunks retrieved for each question."],
            ["What does the RAG prompt do?", "The RAG prompt has 3 parts: (1) System instruction (role: \"You are a support assistant\"), (2) Context (the retrieved chunks formatted as text), (3) Question. The critical instruction: \"Answer using ONLY the context. If not in context, say 'I don't know.'\" This grounds the LLM and prevents hallucinations. Without this, the LLM will use its training data and invent answers."],
            [<>What is <IC>format_docs</IC> for?</>, <>The retriever returns <IC>list[Document]</IC>. The prompt expects a string. <IC>format_docs</IC> joins chunks with <IC>\n\n</IC> separators into one context string. Example: 3 chunks ❓ &quot;chunk1\n\nchunk2\n\nchunk3&quot;. This string is injected into the prompt&apos;s <IC>{`{context}`}</IC> placeholder.</>],
            [<>Explain the LCEL chain: <IC>{`{&quot;context&quot;: retriever | format_docs, &quot;question&quot;: RunnablePassthrough()}`}</IC></>, <>This creates a dict with 2 keys. The input (question string) flows into both branches in parallel. Branch 1 (context): retriever.invoke(question) ❓ list[Document] ❓ format_docs ❓ string. Branch 2 (question): RunnablePassthrough() ❓ question (unchanged). Result: <IC>{`{&quot;context&quot;: &quot;chunk1\n\nchunk2...&quot;, &quot;question&quot;: &quot;How long...&quot;}`}</IC>. This dict is piped into the prompt.</>],
            ["Why is temperature=0 recommended for RAG?", "temperature=0 makes the LLM deterministic (same input ❓ same output). For RAG, you want consistent, factual answers from the context. temperature > 0 adds randomness  the LLM might paraphrase differently each time, or worse, hallucinate. RAG is about grounding in facts, not creativity. Use temperature=0."],
            ["How do you add citations to RAG answers?", "Two approaches: (1) Instruct the LLM to cite (add \"cite sources in brackets\" to prompt + tag chunks with [source: manual.md] in context). Unreliable  LLM forgets ~20% of the time. (2) Programmatic: retrieve chunks ❓ extract unique metadata.source ❓ append to answer. Recommended. You get 100% reliable citations: Answer + Sources: [manual.md, faq.md]."],
            ["What's the cost of a RAG query?", "Per query: (1) Embed question: ~10 tokens * $0.00002/1K H $0.0000002. (2) Retrieve: free (local similarity search). (3) LLM: ~650 input tokens (context + prompt) * $0.00015/1K + 50 output tokens * $0.0006/1K H $0.00015. Total: ~$0.00015/query. For 1,000 queries/day: $0.15/day = $4.50/month. Cheap!"],
            ["How do you debug wrong RAG answers?", "Triage ladder: (1) Print retrieved chunks. Do they contain the answer? If NO ❓ retrieval failed (re-chunk, tune k, check embeddings). If YES ❓ move to (2). (2) Print the final prompt. Is the answer clearly in the context? If NO ❓ retrieval is bad. If YES ❓ move to (3). (3) LLM issue: try temperature=0, stronger model (gpt-4o), or rephrase prompt. 90% of bugs are step 1 (bad retrieval)."],
            ["Why say 'I don't know' instead of hallucinating?", "Hallucinated answers erode trust. A user asks about a feature not in docs. If the LLM invents a plausible answer (\"Yes, the X1 has obstacle avoidance\"), the user might make a purchase decision based on false info. One hallucination ❓ lost customer. \"I don't know\" is honest. The user trusts future answers. For support/docs RAG, honesty > helpfulness."],
            [<>What does <IC>create_retrieval_chain</IC> do?</>, <>A helper that builds the RAG chain for you: <IC>create_retrieval_chain(retriever, combine_docs_chain)</IC>. It returns a chain that: (1) retrieves chunks, (2) formats them into a prompt, (3) calls the LLM, (4) returns a dict with <IC>answer</IC> and <IC>context</IC> (the retrieved chunks). Less flexible than LCEL but faster to prototype. LCEL is preferred for production (easier to customize).</>],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["RAG prompt template", 'ChatPromptTemplate.from_template("You are X. Answer using ONLY context. If not in context, say \\"I don\'t know.\\"\\n\\nContext: {context}\\n\\nQuestion: {question}")'],
            ["format_docs", '"\\n\\n".join(doc.page_content for doc in docs)'],
            ["LCEL RAG chain", '{"context": retriever | format_docs, "question": RunnablePassthrough()} | prompt | llm | StrOutputParser()'],
            ["Load Chroma retriever", 'vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings); retriever = vectorstore.as_retriever(search_kwargs={"k": 3})'],
            ["LLM for RAG", 'ChatOpenAI(model="gpt-4o-mini", temperature=0)  # deterministic'],
            ["Stream answers", 'for chunk in rag_chain.stream(question): print(chunk, end="", flush=True)'],
            ["Programmatic citations", 'sources = list(set(doc.metadata.get("source") for doc in chunks))'],
            ["Mini eval harness", 'if expected_fact.lower() in answer.lower(): score += 1'],
            ["Cost per query", "~$0.00015 (gpt-4o-mini: 650 input + 50 output tokens)"],
            ["Debug triage", "1. Print chunks (answer in them?). 2. Print prompt (answer clear?). 3. Blame LLM."],
            ["The don't-know instruction", 'System: "If the answer is NOT in the context, say: I don\'t have that information."'],
            ["REPL chatbot loop", 'while True: q = input("You: "); print(f"Bot: {rag_chain.invoke(q)}")'],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
