"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  meta: string;
  href: string;
  available: boolean;
};

type Group = { title: string; emoji: string; items: Category[] };

const GROUPS: Group[] = [
  {
    title: "Foundations",
    emoji: "🌱",
    items: [
      { id: "fundamentals", icon: "🧠", name: "RAG Fundamentals — Why & What", desc: "Why LLMs hallucinate about your private docs, what Retrieval-Augmented Generation actually is, the retrieve → augment → generate loop drawn step by step, RAG vs fine-tuning vs long context, and your first look at NimbusBot — the drone support bot you build across the whole course.", meta: "start here ⭐", href: "/rag/fundamentals", available: true },
      { id: "llm-apis", icon: "🤖", name: "LLM APIs — Talking to GPT", desc: "The raw OpenAI API from zero: chat completions, roles (system/user/assistant), temperature, max tokens, streaming, counting tokens with tiktoken, and real cost math for gpt-4o-mini — $0.15/1M in, $0.60/1M out — so NimbusBot never surprises you on the bill.", meta: "the raw API ⭐", href: "/rag/llm-apis", available: true },
      { id: "embeddings", icon: "🧲", name: "Embeddings — Meaning as Numbers", desc: "How text becomes a 1536-dimension vector with text-embedding-3-small, cosine similarity computed by hand, why “battery life” matches “how long does it fly” with zero shared words, semantic search over Nimbus docs in pure NumPy before any framework.", meta: "the magic ingredient ⭐", href: "/rag/embeddings", available: true },
      { id: "vector-stores", icon: "🗂️", name: "Vector Stores — FAISS & Chroma", desc: "Where vectors live: FAISS in-memory vs Chroma persisted to ./nimbus_db, similarity_search and scores, metadata filtering by source file, persistence across restarts, and the add → embed → index → query lifecycle animated.", meta: "the searchable brain", href: "/rag/vector-stores", available: true },
    ],
  },
  {
    title: "LangChain Core",
    emoji: "🦜",
    items: [
      { id: "langchain-intro", icon: "🦜", name: "LangChain Core — Models, Prompts, Parsers", desc: "The toolkit that turns raw API calls into lego bricks: ChatOpenAI, message objects, ChatPromptTemplate with {context} and {question} slots, StrOutputParser, structured output with Pydantic, and your first chain — prompt | llm | parser.", meta: "the building blocks ⭐", href: "/rag/langchain-intro", available: true },
      { id: "lcel", icon: "🔗", name: "LCEL — Chains with the Pipe", desc: "LangChain Expression Language: invoke vs batch vs stream, RunnablePassthrough, RunnableParallel and the dict syntax that is the heart of every RAG chain, branching, fallbacks, retries, async, and printing your chain as an ASCII graph.", meta: "the composition layer ⭐", href: "/rag/lcel", available: true },
      { id: "loaders-splitters", icon: "📄", name: "Loaders & Splitters — Chunking", desc: "Getting documents in and cut right: TextLoader, DirectoryLoader, PyPDFLoader, WebBaseLoader, then RecursiveCharacterTextSplitter at 500 chars / 80 overlap producing NimbusBot’s 11 chunks, Markdown-header splitting, and why chunk size makes or breaks retrieval.", meta: "garbage in, garbage out", href: "/rag/loaders-splitters", available: true },
      { id: "retrievers", icon: "🎯", name: "Retrievers — Finding the Right Chunks", desc: "as_retriever and the k knob, MMR for diversity, score thresholds, MultiQueryRetriever rewriting questions, BM25 keyword search and hybrid ensembles, contextual compression — every strategy benchmarked on the same Nimbus questions.", meta: "precision tuning ⭐", href: "/rag/retrievers", available: true },
    ],
  },
  {
    title: "RAG End to End",
    emoji: "🔗",
    items: [
      { id: "pipeline", icon: "🏗️", name: "The Full RAG Pipeline", desc: "The flagship: load → split → embed → store → retrieve → augment → generate as one complete program, create_stuff_documents_chain and create_retrieval_chain, source citations, and the canonical battery question traced through every stage with the real artifact at each hop.", meta: "the flagship ⭐", href: "/rag/pipeline", available: true },
      { id: "conversational", icon: "💬", name: "Conversational RAG — Memory", desc: "Follow-up questions break naive RAG — “what about its range?” retrieves nothing. Fix it with create_history_aware_retriever, question rewriting, RunnableWithMessageHistory, session stores, and trimming strategies so NimbusBot holds a real conversation.", meta: "multi-turn chat ⭐", href: "/rag/conversational", available: true },
      { id: "agents-tools", icon: "🤝", name: "Agents & Tools — RAG That Acts", desc: "From pipeline to agent: @tool functions, bind_tools, the reason → act → observe loop, LangGraph’s create_react_agent wielding the Nimbus retriever plus an order-lookup tool, deciding per-question whether to search docs, call an API, or just answer.", meta: "the agent loop", href: "/rag/agents-tools", available: true },
    ],
  },
  {
    title: "Advanced & Production",
    emoji: "🚀",
    items: [
      { id: "advanced", icon: "🚀", name: "Advanced RAG Techniques", desc: "The upgrade kit: cross-encoder reranking, HyDE hypothetical documents, self-query metadata filters, ParentDocument small-to-big retrieval, query decomposition — each technique shown as before/after on the same failing Nimbus query.", meta: "the upgrade kit", href: "/rag/advanced", available: true },
      { id: "production", icon: "🏭", name: "Evaluation & Production", desc: "Prove it works, then ship it: hit-rate and MRR on a golden dataset, the RAG triad with LLM-as-judge, RAGAS, cost per query ($0.000258), caching, FastAPI serving with streaming, LangSmith tracing, and Docker deployment.", meta: "measure then ship ⭐", href: "/rag/production", available: true },
      { id: "capstone", icon: "🎓", name: "Capstone — NimbusBot Complete", desc: "Everything assembled: the full NimbusBot repo file by file — ingestion script, conversational RAG chain, FastAPI app with sessions and streaming, pytest suite (8 passed), eval harness, Dockerfile — plus a course recap and interview drill.", meta: "ship the whole bot 🎓", href: "/rag/capstone", available: true },
    ],
  },
];

export default function RagPage() {
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">RAG &amp; LangChain</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(244,114,182,0.5)]"
          >
            🦜
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">RAG &amp; LangChain</span> — end to end
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;why do LLMs hallucinate?&quot; to a deployed, evaluated chatbot: embeddings,
              vector stores, LCEL chains, retrievers, conversational memory, agents, reranking,
              evaluation and FastAPI serving — all by building one project, NimbusBot, a support
              bot that answers from real drone docs. {total} topics, every pipeline animated,
              every number precomputed, zero prior AI knowledge assumed.
            </motion.p>
          </div>
        </div>

        {/* The journey strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mb-12 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-4 text-[11px] font-semibold text-slate-300"
        >
          {["🧠 Why RAG", "🤖 LLM APIs", "🧲 Embeddings", "🗂️ Vector stores", "🦜 LangChain", "🔗 LCEL", "🎯 Retrievers", "🏗️ Full pipeline", "💬 Memory", "🏭 Production", "🎓 Capstone"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-pink-400">→</span>}
              </span>
            )
          )}
        </motion.div>

        {/* Grouped category cards */}
        {GROUPS.map((group, g) => (
          <section key={group.title} className="mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + g * 0.06 }}
              className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400"
            >
              <span className="text-base">{group.emoji}</span>
              {group.title}
              <span className="ml-2 h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-600">
                {group.items.length} topics
              </span>
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((cat, i) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + g * 0.06 + i * 0.04 }}
                    whileHover={cat.available ? { y: -5, scale: 1.02 } : undefined}
                    className={`glass relative flex h-full flex-col rounded-2xl p-5 transition-shadow ${
                      cat.available
                        ? "cursor-pointer border-pink-700/50 hover:shadow-[0_0_50px_-15px_rgba(244,114,182,0.6)]"
                        : "opacity-50"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/80 text-xl">
                        {cat.icon}
                      </span>
                      {cat.available ? (
                        <span className="rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          ● Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          🔒 Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {cat.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-[11px] text-slate-500">{cat.meta}</span>
                      {cat.available && (
                        <span className="text-sm font-bold text-pink-400">Open →</span>
                      )}
                    </div>
                  </motion.div>
                );
                return cat.available ? (
                  <Link key={cat.id} href={cat.href} className="h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={cat.id} className="h-full">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
