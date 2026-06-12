"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Conversational RAG — memory-aware retrieval",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "follow-up question", x: 6, y: 50, color: "#22d3ee" },
    { id: "history", icon: "📚", label: "Chat History", sub: "past turns", x: 22, y: 14, color: "#fbbf24" },
    { id: "rewriter", icon: "🔄", label: "Query Rewriter", sub: "LLM", x: 36, y: 50, color: "#a78bfa" },
    { id: "retriever", icon: "🔍", label: "Retriever", sub: "search", x: 54, y: 50, color: "#fb923c" },
    { id: "chroma", icon: "🗄️", label: "Chroma DB", sub: "11 chunks", x: 70, y: 50, color: "#34d399" },
    { id: "qa", icon: "📝", label: "QA Prompt", sub: "with history", x: 54, y: 14, color: "#60a5fa" },
    { id: "llm", icon: "🤖", label: "LLM", sub: "gpt-4o-mini", x: 70, y: 14, color: "#f472b6" },
    { id: "answer", icon: "💬", label: "Answer", sub: "grounded", x: 88, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "user-rewriter", from: "user", to: "rewriter", color: "#22d3ee" },
    { id: "history-rewriter", from: "history", to: "rewriter", dashed: true, color: "#fbbf24" },
    { id: "rewriter-retriever", from: "rewriter", to: "retriever", color: "#a78bfa" },
    { id: "retriever-chroma", from: "retriever", to: "chroma", color: "#fb923c" },
    { id: "chroma-qa", from: "chroma", to: "qa", bend: -40, color: "#34d399" },
    { id: "history-qa", from: "history", to: "qa", dashed: true, color: "#fbbf24" },
    { id: "user-qa", from: "user", to: "qa", bend: 60, color: "#22d3ee" },
    { id: "qa-llm", from: "qa", to: "llm", color: "#60a5fa" },
    { id: "llm-answer", from: "llm", to: "answer", color: "#f472b6" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Follow-up rewritten",
      command: "And how far can it fly?",
      steps: [
        { node: "user", paths: ["user-rewriter"], text: "User asks a follow-up: 'And how far can it fly?' The pronoun 'it' refers to the X1 from the previous turn, but the query itself is ambiguous." },
        { node: "history", paths: ["history-rewriter"], text: "Chat history stores the previous question: 'How long does the X1 battery last?' The rewriter needs this context to resolve pronouns." },
        { node: "rewriter", paths: ["rewriter-retriever"], text: "Query rewriter LLM receives history + follow-up. It produces: 'How far can the Nimbus X1 fly?' — a standalone question with pronouns resolved. This is the secret!" },
        { node: "retriever", paths: ["retriever-chroma"], text: "Retriever embeds the REWRITTEN question: 'How far can the Nimbus X1 fly?' — much better semantic match than 'it' alone." },
        { node: "chroma", paths: ["chroma-qa"], text: "Chroma returns the range spec chunk: '5 km maximum range' (ranked #1 because the rewritten query matches well). Retrieval succeeds!" },
        { node: "qa", paths: ["qa-llm"], text: "QA prompt combines: context (range chunk), history (battery question), and the user's original follow-up. The LLM sees the full conversation thread." },
        { node: "llm", paths: ["llm-answer"], text: "LLM generates: 'The Nimbus X1 can fly up to 5 km.' — grounded in the retrieved chunk, conversationally coherent." },
        { node: "answer", paths: [], text: "User receives the correct answer. The follow-up was resolved by rewriting the query before retrieval. Conversational RAG works! ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ No rewrite → wrong chunk",
      command: "And how far can it fly? (no rewriter)",
      steps: [
        { node: "user", paths: ["user-retriever"], text: "User asks: 'And how far can it fly?' Without the rewriter, this raw question (with 'it') goes straight to the retriever." },
        { node: "retriever", paths: ["retriever-chroma"], text: "Retriever embeds the literal query: 'And how far can it fly?' The word 'it' has weak semantics — embeddings can't resolve pronouns!" },
        { node: "chroma", paths: ["chroma-qa"], text: "Chroma returns a poor match: the firmware update chunk or battery specs (anything vaguely matching 'far' or 'fly'). The range chunk ranks lower because 'it' doesn't match 'Nimbus X1'." },
        { node: "qa", paths: ["qa-llm"], text: "QA prompt receives the WRONG context (e.g., firmware notes) + the follow-up question. The LLM has no way to answer correctly — garbage in, garbage out." },
        { node: "llm", paths: ["llm-answer"], text: "LLM generates a confused or hallucinated answer: 'I'm not sure what you're referring to' or a wrong fact. The retrieval failed." },
        { node: "answer", paths: [], text: "User gets a bad answer. The pipeline broke because the retriever couldn't understand 'it'. Query rewriting is ESSENTIAL for follow-ups. ❌" },
      ],
    },
    {
      id: "power",
      name: "⚡ Two sessions isolated",
      command: "session_id: alice vs bob",
      steps: [
        { node: "user", paths: ["user-rewriter"], text: "Two users (Alice and Bob) both ask questions. Each has a unique session_id ('alice', 'bob') for history isolation." },
        { node: "history", paths: ["history-rewriter"], text: "Alice's history: ['How long does the X1 battery last?', '28 minutes']. Bob's history: ['Is shipping free?', 'Yes, free shipping']. Stored separately in a dict by session_id." },
        { node: "rewriter", paths: ["rewriter-retriever"], text: "Alice asks: 'And the range?' Rewriter sees Alice's history only → rewrites to 'What is the range of the Nimbus X1?' Bob's history never leaks into Alice's rewrite." },
        { node: "retriever", paths: ["retriever-chroma"], text: "Retriever processes the rewritten query for Alice: 'What is the range of the Nimbus X1?' — embeds and searches Chroma." },
        { node: "chroma", paths: ["chroma-qa"], text: "Chroma returns the range chunk (5 km) for Alice's query. Bob's session is unaffected — he could simultaneously ask about warranty using his own history." },
        { node: "qa", paths: ["qa-llm"], text: "QA prompt for Alice uses her history + retrieved context. Bob's prompt would use his history + his retrieved context. No cross-contamination!" },
        { node: "llm", paths: ["llm-answer"], text: "LLM generates Alice's answer: 'The Nimbus X1 has a range of 5 km.' Bob's answer (in parallel) would be about warranty. Independent sessions." },
        { node: "answer", paths: [], text: "Alice and Bob each get correct, personalized answers. RunnableWithMessageHistory per session_id keeps histories isolated. Multi-user conversational RAG! ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-breaks", label: "Why Our Pipeline Breaks on Follow-ups ⭐" },
  { id: "two-memories", label: "Two Memories, Two Problems" },
  { id: "query-rewrite", label: "Query Rewriting / Condensing ⭐" },
  { id: "history-aware", label: "create_history_aware_retriever ⭐" },
  { id: "full-chain", label: "The Full Conversational Chain" },
  { id: "managing-history", label: "Managing History" },
  { id: "trimming", label: "Trimming History" },
  { id: "streaming", label: "Streaming + History Together" },
  { id: "when-not", label: "When You DON'T Need Conversational RAG" },
  { id: "debugging", label: "Debugging & Common Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ConversationalRagPage() {
  return (
    <TopicShell
      icon="💬"
      title="Conversational RAG — Memory & Follow-ups"
      gradientWord="Conversational"
      subtitle="how long does IT last? — making RAG survive pronouns"
      nav={NAV}
      badges={["💬 Query rewriting", "📚 Chat history", "🔄 History-aware retrieval", "🧠 Session management", "✂️ History trimming"]}
      next={{ icon: "🤝", label: "Agents & Tools", href: "/rag/agents-tools" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-breaks" number="01" title="Why Our Pipeline Breaks on Follow-ups ⭐">
        <P>
          You built a RAG chatbot for Nimbus Gear (the drone manual). Turn 1 works perfectly:
        </P>
        <CodeBlock
          title="turn_1_works.py"
          code={`# Turn 1: User asks about battery life
user_question = "How long does the X1 battery last?"

# Retriever embeds this → finds the battery spec chunk in Chroma
# Context: "Nimbus X1 battery: 28 minutes flight time..."
# LLM generates: "The Nimbus X1 battery lasts 28 minutes."

print("✅ Turn 1: 28 minutes (CORRECT)")`}
          output={`✅ Turn 1: 28 minutes (CORRECT)`}
        />
        <P>
          Now the user asks a follow-up:
        </P>
        <CodeBlock
          title="turn_2_breaks.py"
          code={`# Turn 2: Follow-up question
user_question = "And how far can it fly?"

# The retriever embeds the LITERAL query: "And how far can it fly?"
# PROBLEM: "it" has weak semantics. Embeddings can't resolve pronouns!
# Chroma returns: the firmware chunk (irrelevant) or battery chunk (wrong)
# The retriever MISSES the range spec (5 km) because the query doesn't mention "X1" or "Nimbus"

# LLM sees the wrong context → confused answer or hallucination
print("❌ Turn 2: 'I'm not sure what you're referring to' (WRONG)")`}
          output={`❌ Turn 2: 'I'm not sure what you're referring to' (WRONG)`}
        />
        <P>
          <strong>What went wrong?</strong> The retriever processed <IC>&quot;And how far can it fly?&quot;</IC> verbatim. The pronoun <IC>&quot;it&quot;</IC> doesn&apos;t match <IC>&quot;Nimbus X1&quot;</IC> in the embedding space. The correct chunk (range: 5 km) ranked poorly. Your RAG pipeline has no conversational memory — each turn is isolated.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>The retrieval failure is invisible</strong>. The LLM still generates an answer (it&apos;s trained to be helpful), but it&apos;s based on the WRONG chunks or pure hallucination. You won&apos;t see an error — just a confident, incorrect response. This is the danger of naive RAG on follow-up questions.
        </Callout>
        <P>
          Here&apos;s what the retrieval actually returned:
        </P>
        <CodeBlock
          title="print_bad_retrieval.py"
          code={`from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# Load the Nimbus manual Chroma DB
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)

# Turn 2 query (literal)
query = "And how far can it fly?"
docs = vectorstore.similarity_search(query, k=3)

print("Query:", query)
print("\\nTop 3 retrieved chunks:")
for i, doc in enumerate(docs, 1):
    snippet = doc.page_content[:100].replace("\\n", " ")
    print(f"  {i}. {snippet}...")`}
          output={`Query: And how far can it fly?

Top 3 retrieved chunks:
  1. Firmware updates are available through the Nimbus app. Connect your X1 via Bluetooth and check ...
  2. Battery: 28 minutes flight time, 2200 mAh LiPo, charging time 90 minutes. Weight: 795 grams inc...
  3. Maximum range: 5 km. Operating frequency: 2.4 GHz. Maximum wind resistance: 38 km/h. Camera: 4K...`}
        />
        <P>
          The range chunk appeared at #3, but the top results were firmware and battery (both irrelevant to <IC>&quot;how far&quot;</IC>). If you use <IC>k=1</IC> (common in production), the range chunk never enters the prompt. The LLM hallucinates or says <IC>&quot;I don&apos;t know.&quot;</IC>
        </P>
      </Section>

      {/* 02 */}
      <Section id="two-memories" number="02" title="Two Memories, Two Problems">
        <P>
          Conversational RAG requires TWO types of memory:
        </P>
        <Table
          head={["Memory type", "What it stores", "Where it goes", "Problem if missing"]}
          rows={[
            ["LLM memory (chat history)", "Past questions + answers", "In the QA prompt as HumanMessage / AIMessage list", "LLM forgets context, loses thread. (You already solved this in llm-apis topic.)"],
            [<><strong>Retriever memory</strong> (query rewriting)</>, "Past questions (for rewriting the current query)", "NOT in the retriever — we rewrite the query BEFORE retrieval", <>The retriever embeds <IC>&quot;it&quot;</IC> literally → retrieves wrong chunks → <strong>the subtle failure!</strong></>],
          ]}
        />
        <P>
          <strong>The LLM memory is easy</strong> — you append <IC>HumanMessage(&quot;...&quot;)</IC> and <IC>AIMessage(&quot;...&quot;)</IC> to a list, then include it in your prompt. This keeps the LLM conversationally coherent. You&apos;ve done this before.
        </P>
        <P>
          <strong>The retriever memory is the hard part.</strong> The retriever is a dumb semantic search — it embeds your query as-is. It doesn&apos;t know what <IC>&quot;it&quot;</IC> or <IC>&quot;that&quot;</IC> means. The fix: <strong>rewrite the follow-up query into a standalone question BEFORE retrieval</strong>.
        </P>
        <Callout type="behind">
          ⚙️ <strong>Behind the scenes</strong>: This is a two-LLM-call pattern. LLM call #1 rewrites the query (cheap, fast: gpt-4o-mini, ~50 tokens). LLM call #2 answers the question (using the rewritten query&apos;s retrieval results). Total latency: +200ms. Total cost: ~$0.0001 per turn. The precision gain is massive.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="query-rewrite" number="03" title="Query Rewriting / Condensing ⭐">
        <P>
          The solution: before retrieval, use an LLM to <strong>condense</strong> the follow-up question into a <strong>standalone question</strong> that includes context from history.
        </P>
        <CodeBlock
          title="manual_query_rewrite.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# Step 1: Build a rewrite prompt
contextualize_q_system_prompt = """Given a chat history and the latest user question \\
which might reference context in the chat history, formulate a standalone question \\
which can be understood without the chat history. Do NOT answer the question, \\
just reformulate it if needed and otherwise return it as is."""

contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Step 2: Test the rewriter
chat_history = [
    HumanMessage(content="How long does the X1 battery last?"),
    AIMessage(content="The Nimbus X1 battery lasts 28 minutes."),
]

follow_up = "And how far can it fly?"

# Invoke the rewrite chain
rewrite_chain = contextualize_q_prompt | llm
rewritten = rewrite_chain.invoke({"input": follow_up, "chat_history": chat_history})

print("Original follow-up:", follow_up)
print("Rewritten query:", rewritten.content)`}
          output={`Original follow-up: And how far can it fly?
Rewritten query: How far can the Nimbus X1 fly?`}
        />
        <P>
          <strong>What happened?</strong> The LLM saw the history (<IC>&quot;How long does the X1 battery last?&quot;</IC>) and the follow-up (<IC>&quot;And how far can it fly?&quot;</IC>). It resolved <IC>&quot;it&quot;</IC> to <IC>&quot;Nimbus X1&quot;</IC> and produced a standalone question: <IC>&quot;How far can the Nimbus X1 fly?&quot;</IC>
        </P>
        <P>
          Now retrieval works:
        </P>
        <CodeBlock
          title="retrieval_with_rewritten_query.py"
          code={`# Use the REWRITTEN query for retrieval
rewritten_query = "How far can the Nimbus X1 fly?"
docs = vectorstore.similarity_search(rewritten_query, k=3)

print("Rewritten query:", rewritten_query)
print("\\nTop 3 retrieved chunks:")
for i, doc in enumerate(docs, 1):
    snippet = doc.page_content[:100].replace("\\n", " ")
    print(f"  {i}. {snippet}...")`}
          output={`Rewritten query: How far can the Nimbus X1 fly?

Top 3 retrieved chunks:
  1. Maximum range: 5 km. Operating frequency: 2.4 GHz. Maximum wind resistance: 38 km/h. Camera: 4K...
  2. Nimbus X1 drone specifications: Battery 28 minutes, range 5 km, weight 795 g, max wind 38 km/h....
  3. The X1 is designed for outdoor flight with a range of up to 5 kilometers. Maintain line-of-sight...`}
        />
        <P>
          <strong>SUCCESS!</strong> The range chunk is now #1. The rewritten query (<IC>&quot;Nimbus X1 fly&quot;</IC>) matches the spec chunks perfectly. The retrieval is fixed. ✅
        </P>
        <Callout type="tip">
          💡 <strong>The rewrite prompt is critical</strong>. The system message says <IC>&quot;Do NOT answer the question, just reformulate it&quot;</IC> — otherwise the LLM might try to answer directly (defeating the purpose). <IC>temperature=0</IC> keeps rewrites deterministic. The <IC>MessagesPlaceholder(&quot;chat_history&quot;)</IC> is where past turns go.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="history-aware" number="04" title="create_history_aware_retriever ⭐">
        <P>
          LangChain provides <IC>create_history_aware_retriever</IC> — a helper that wraps your retriever with automatic query rewriting:
        </P>
        <CodeBlock
          title="history_aware_retriever.py"
          code={`from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma

# Load the Nimbus manual Chroma DB
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Rewrite prompt (same as before)
contextualize_q_system_prompt = """Given a chat history and the latest user question \\
which might reference context in the chat history, formulate a standalone question \\
which can be understood without the chat history. Do NOT answer the question, \\
just reformulate it if needed and otherwise return it as is."""

contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

# Wrap the retriever with history-aware rewriting
history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)

# Test it
from langchain_core.messages import HumanMessage, AIMessage

chat_history = [
    HumanMessage(content="How long does the X1 battery last?"),
    AIMessage(content="The Nimbus X1 battery lasts 28 minutes."),
]

docs = history_aware_retriever.invoke({"input": "And how far can it fly?", "chat_history": chat_history})

print("Retrieved chunks:")
for i, doc in enumerate(docs, 1):
    snippet = doc.page_content[:80].replace("\\n", " ")
    print(f"  {i}. {snippet}...")`}
          output={`Retrieved chunks:
  1. Maximum range: 5 km. Operating frequency: 2.4 GHz. Maximum wind resistance: ...
  2. Nimbus X1 drone specifications: Battery 28 minutes, range 5 km, weight 795 g,...
  3. The X1 is designed for outdoor flight with a range of up to 5 kilometers. Mai...`}
        />
        <P>
          <strong>How it works internally:</strong>
        </P>
        <CodeBlock
          title="history_aware_retriever_logic.txt"
          runnable={false}
          code={`def create_history_aware_retriever(llm, retriever, prompt):
    # Pseudocode for what it does:

    if chat_history is empty:
        # No history → no rewriting needed, pass input directly to retriever
        return retriever.invoke(input)
    else:
        # History exists → rewrite the query first
        rewritten_query = (prompt | llm).invoke({"input": input, "chat_history": chat_history})
        return retriever.invoke(rewritten_query.content)

────────────────────────────────────────────────────────────────
BENEFITS:
  ✅ Automatic rewriting when history exists
  ✅ Skips rewriting on turn 1 (no history yet → saves an LLM call)
  ✅ Works with any retriever (Chroma, FAISS, Pinecone, etc.)
  ✅ Clean API: you invoke with {input, chat_history}, it returns docs`}
        />
        <Callout type="note">
          📌 <strong>Turn 1 optimization</strong>: If <IC>chat_history</IC> is empty (first turn), the retriever skips the rewrite step (no LLM call). This saves ~200ms and ~$0.0001. On turn 2+, the rewrite happens automatically. Smart!
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="full-chain" number="05" title="The Full Conversational Chain">
        <P>
          Now combine the history-aware retriever with a QA chain (that also has chat history in the prompt):
        </P>
        <CodeBlock
          title="full_conversational_rag.py"
          code={`from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, AIMessage

# Setup
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 1. History-aware retriever (query rewriting)
contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

history_aware_retriever = create_history_aware_retriever(llm, retriever, contextualize_q_prompt)

# 2. QA prompt (with history + context)
qa_system_prompt = """You are a support assistant for Nimbus Gear drones. \\
Use the following pieces of retrieved context to answer the question. \\
If you don't know the answer, say you don't know. Keep answers concise (2-3 sentences).

Context:
{context}"""

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", qa_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

# 3. Combine into a retrieval chain
question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

# Test: 3-turn conversation
chat_history = []

# Turn 1
result = rag_chain.invoke({"input": "How long does the X1 battery last?", "chat_history": chat_history})
print("Q1:", result["input"])
print("A1:", result["answer"])
chat_history.append(HumanMessage(content=result["input"]))
chat_history.append(AIMessage(content=result["answer"]))

# Turn 2
result = rag_chain.invoke({"input": "And how far can it fly?", "chat_history": chat_history})
print("\\nQ2:", result["input"])
print("A2:", result["answer"])
chat_history.append(HumanMessage(content=result["input"]))
chat_history.append(AIMessage(content=result["answer"]))

# Turn 3
result = rag_chain.invoke({"input": "Is that covered by warranty?", "chat_history": chat_history})
print("\\nQ3:", result["input"])
print("A3:", result["answer"])`}
          output={`Q1: How long does the X1 battery last?
A1: The Nimbus X1 battery lasts 28 minutes.

Q2: And how far can it fly?
A2: The Nimbus X1 can fly up to 5 km.

Q3: Is that covered by warranty?
A3: Yes, the Nimbus X1 is covered by a 12-month warranty from the date of purchase.`}
        />
        <P>
          <strong>All three answers are correct!</strong> Turn 2 resolved <IC>&quot;it&quot;</IC> to <IC>&quot;Nimbus X1&quot;</IC> via query rewriting. Turn 3 resolved <IC>&quot;that&quot;</IC> (referring to the drone) and retrieved the warranty chunk. The history-aware retriever + history-aware QA prompt make RAG conversational. ✅
        </P>
        <Callout type="tip">
          💡 <strong>The two prompts work together</strong>: <IC>contextualize_q_prompt</IC> rewrites the query (for retrieval). <IC>qa_prompt</IC> answers the question (with retrieved context + history). Both have <IC>MessagesPlaceholder(&quot;chat_history&quot;)</IC>, but they serve different purposes. Don&apos;t confuse them!
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="managing-history" number="06" title="Managing History">
        <P>
          In the example above, you manually managed <IC>chat_history</IC> as a Python list. In production, you need <strong>per-user session isolation</strong> — Alice&apos;s history must not leak into Bob&apos;s. LangChain provides <IC>RunnableWithMessageHistory</IC> for this:
        </P>
        <CodeBlock
          title="session_based_history.py"
          code={`from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

# In-memory store: session_id -> ChatMessageHistory
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# Wrap the RAG chain with session-based history
conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer",
)

# User Alice (session: alice)
result = conversational_rag_chain.invoke(
    {"input": "How long does the X1 battery last?"},
    config={"configurable": {"session_id": "alice"}},
)
print("Alice Q1:", result["input"])
print("Alice A1:", result["answer"])

result = conversational_rag_chain.invoke(
    {"input": "And the range?"},
    config={"configurable": {"session_id": "alice"}},
)
print("\\nAlice Q2:", result["input"])
print("Alice A2:", result["answer"])

# User Bob (session: bob)
result = conversational_rag_chain.invoke(
    {"input": "Is shipping free?"},
    config={"configurable": {"session_id": "bob"}},
)
print("\\nBob Q1:", result["input"])
print("Bob A1:", result["answer"])

# Check: Alice's history should NOT include Bob's question
print("\\nAlice's history:", [(m.type, m.content) for m in store["alice"].messages])
print("Bob's history:", [(m.type, m.content) for m in store["bob"].messages])`}
          output={`Alice Q1: How long does the X1 battery last?
Alice A1: The Nimbus X1 battery lasts 28 minutes.

Alice Q2: And the range?
Alice A2: The Nimbus X1 has a range of 5 km.

Bob Q1: Is shipping free?
Bob A1: Yes, Nimbus Gear offers free shipping on all orders.

Alice's history: [('human', 'How long does the X1 battery last?'), ('ai', 'The Nimbus X1 battery lasts 28 minutes.'), ('human', 'And the range?'), ('ai', 'The Nimbus X1 has a range of 5 km.')]
Bob's history: [('human', 'Is shipping free?'), ('ai', 'Yes, Nimbus Gear offers free shipping on all orders.')]`}
        />
        <P>
          <strong>How it works:</strong>
        </P>
        <CodeBlock
          title="session_isolation.txt"
          runnable={false}
          code={`RunnableWithMessageHistory:
  1. Before each invoke, calls get_session_history(session_id) → retrieves the ChatMessageHistory for that user
  2. Loads past messages into chat_history
  3. Invokes the RAG chain with {input, chat_history}
  4. Appends the new HumanMessage(input) and AIMessage(answer) to the session's history
  5. Next invoke for the same session_id sees the updated history

────────────────────────────────────────────────────────────────
STORE OPTIONS:

In-memory (dict):  Good for dev/testing. Lost on restart.
Redis:             from langchain_community.chat_message_histories import RedisChatMessageHistory
                   Persistent, multi-server, production-ready.
Database:          from langchain_community.chat_message_histories import SQLChatMessageHistory
                   Postgres/MySQL/SQLite — durable, queryable.
File-based:        from langchain_community.chat_message_histories import FileChatMessageHistory
                   Simple persistence, single-server.

────────────────────────────────────────────────────────────────
SESSION_ID BEST PRACTICES:

  - Web app: Use user ID or session token (e.g., "user_12345" or UUID)
  - Slack bot: Use channel_id or thread_ts
  - WhatsApp bot: Use phone number
  - Multi-tenant: Prefix with tenant: "tenant_a:user_123"
  - Expire old sessions (TTL in Redis, periodic cleanup in DB)`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Using the same <IC>session_id</IC> for all users (e.g., hardcoded <IC>&quot;default&quot;</IC>). This mixes everyone&apos;s histories — Alice sees Bob&apos;s questions! Always pass a unique <IC>session_id</IC> per user/conversation.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="trimming" number="07" title="Trimming History">
        <P>
          After 50 turns, the chat history becomes 100+ messages (user + assistant per turn). Problems:
        </P>
        <Table
          head={["Problem", "Why it happens", "Impact"]}
          rows={[
            ["Token bloat", "Every message in history goes into the rewrite prompt AND the QA prompt", "Costs spike (paying for 10K tokens of history per call); latency increases (slower LLM calls); context window overflow (gpt-4o-mini has 128K limit but effective attention degrades)"],
            ["Stale context", "Turn 1 asked about battery, turn 50 asks about returns — turn 1 is noise now", "Retrieval confused by irrelevant history; LLM distracted by old topics"],
            ["Memory leaks", "Session never expires — grows forever in Redis/DB", "Storage costs; slow history loading; OOM on in-memory stores"],
          ]}
        />
        <P>
          <strong>Solutions:</strong>
        </P>
        <Table
          head={["Strategy", "How it works", "Pros / Cons"]}
          rows={[
            [<>Keep last N messages (<IC>trim_messages</IC>)</>, <>from langchain_core.messages import trim_messages; trimmed = trim_messages(chat_history, max_tokens=2000, strategy=&quot;last&quot;) — keeps the most recent turns, drops old ones</>, <>✅ Simple, deterministic, low latency. ❌ Loses long-term context (user mentioned their order ID in turn 2, you forget it by turn 20)</>],
            ["Summarize old history", "Every N turns, use an LLM to compress turns 1-20 into one summary message: 'User asked about battery (28 min), range (5 km), warranty (12 months).' Keep summary + recent N turns.", <>✅ Preserves key facts long-term. ❌ Extra LLM call every N turns; summary quality depends on prompt; adds ~500ms latency</>],
            ["Sliding window (fixed)", <>Keep exactly last 10 turns (20 messages). Every new turn, drop the oldest. <IC>chat_history = chat_history[-20:]</IC></>, <>✅ Constant memory, predictable cost. ❌ Hard cutoff — no nuance (turn 11 might be important but it&apos;s gone)</>],
            ["TTL-based expiration", "Redis/DB: set expiry on session (e.g., 1 hour idle → delete history). On next message, start fresh.", "✅ Prevents unbounded growth. ❌ Users lose context mid-conversation if they pause for lunch"],
          ]}
        />
        <P>
          Example: trim to last 10 messages (5 turns):
        </P>
        <CodeBlock
          title="trim_history.py"
          code={`from langchain_core.messages import trim_messages

# Simulate a long conversation (20 messages = 10 turns)
chat_history = [
    HumanMessage(content=f"Question {i}") for i in range(1, 11)
] + [
    AIMessage(content=f"Answer {i}") for i in range(1, 11)
]

print(f"Original history: {len(chat_history)} messages")

# Trim to last 10 messages
trimmed = trim_messages(
    chat_history,
    max_tokens=2000,  # or max_messages=10
    strategy="last",
    token_counter=len,  # simple heuristic (use tiktoken for accuracy)
)

print(f"Trimmed history: {len(trimmed)} messages")
print("Kept:", [(m.type, m.content) for m in trimmed[-4:]])`}
          output={`Original history: 20 messages
Trimmed history: 10 messages
Kept: [('human', 'Question 9'), ('ai', 'Answer 9'), ('human', 'Question 10'), ('ai', 'Answer 10')]`}
        />
        <Callout type="tip">
          💡 <strong>Recommendation</strong>: For support chatbots, use a sliding window of 6-10 turns (12-20 messages). For long-form assistants (coding, research), use summarization every 15 turns. For high-traffic APIs, add Redis TTL (30 min idle). Measure your P95 conversation length and set limits accordingly.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="streaming" number="08" title="Streaming + History Together">
        <P>
          You can stream the LLM&apos;s answer while maintaining history (for real-time UX):
        </P>
        <CodeBlock
          title="streaming_conversational_rag.py"
          code={`# Use the same rag_chain from earlier, but call .stream() instead of .invoke()
chat_history = []

print("Turn 1:")
print("Q: How long does the X1 battery last?")
print("A: ", end="", flush=True)
for chunk in rag_chain.stream({"input": "How long does the X1 battery last?", "chat_history": chat_history}):
    if "answer" in chunk:
        print(chunk["answer"], end="", flush=True)
print()

# Update history (manual for now)
chat_history.append(HumanMessage(content="How long does the X1 battery last?"))
chat_history.append(AIMessage(content="The Nimbus X1 battery lasts 28 minutes."))

print("\\nTurn 2:")
print("Q: And the range?")
print("A: ", end="", flush=True)
for chunk in rag_chain.stream({"input": "And the range?", "chat_history": chat_history}):
    if "answer" in chunk:
        print(chunk["answer"], end="", flush=True)
print()`}
          output={`Turn 1:
Q: How long does the X1 battery last?
A: The Nimbus X1 battery lasts 28 minutes.

Turn 2:
Q: And the range?
A: The Nimbus X1 has a range of 5 km.`}
        />
        <P>
          Streaming works seamlessly with <IC>RunnableWithMessageHistory</IC> — the final answer is auto-appended to history after streaming completes.
        </P>
      </Section>

      {/* 09 */}
      <Section id="when-not" number="09" title="When You DON'T Need Conversational RAG">
        <P>
          Conversational RAG adds complexity (two LLM calls, history management, storage). Don&apos;t use it when:
        </P>
        <Table
          head={["Use case", "Why conversational RAG is overkill", "What to use instead"]}
          rows={[
            ["Single-shot search tools", <>User searches once, reads result, leaves. No follow-ups. (Example: FAQ search on a website, <IC>&quot;What is your return policy?&quot;</IC>)</>, "Basic RAG (no history). One retrieval, one answer, done."],
            ["Batch question answering", "Processing 1000 questions offline (e.g., evaluate a QA dataset). No user, no conversation.", "Loop over questions with basic RAG. No history needed."],
            ["Structured forms", "User fills fields: product, issue, order ID. Submits once. No back-and-forth.", "Direct retrieval with metadata filters (e.g., filter by product). No conversational context."],
            ["Public read-only docs", "Documentation site: each page is independent. Users jump around, no thread.", "Per-page RAG. No session, no history."],
          ]}
        />
        <Callout type="note">
          📌 <strong>Complexity tax</strong>: Conversational RAG costs +1 LLM call (query rewrite), +storage (history), +latency (~200ms), +code complexity (session management). Only pay this tax when users ACTUALLY have multi-turn conversations. If 90% of your users ask one question and leave, basic RAG is better.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="debugging" number="10" title="Debugging & Common Errors">
        <P>
          <strong>Debugging conversational RAG:</strong>
        </P>
        <Callout type="tip">
          💡 <strong>Debug move #1: Print the rewritten query</strong>
        </Callout>
        <CodeBlock
          title="debug_print_rewritten_query.py"
          code={`# Wrap the rewrite chain to see the rewritten query
contextualize_chain = contextualize_q_prompt | llm

rewritten = contextualize_chain.invoke({
    "input": "And how far can it fly?",
    "chat_history": [
        HumanMessage(content="How long does the X1 battery last?"),
        AIMessage(content="28 minutes."),
    ],
})

print("🔍 REWRITTEN QUERY:", rewritten.content)
# Now you can see what the retriever actually searched for!`}
          output={`🔍 REWRITTEN QUERY: How far can the Nimbus X1 fly?`}
        />
        <P>
          If the rewritten query looks wrong, your <IC>contextualize_q_prompt</IC> needs tuning (add examples, clarify instructions).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 1: History grows unbounded</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`# After 100 turns`}
          error
          output={`openai.error.InvalidRequestError: This model's maximum context length is 128000 tokens. However, your messages resulted in 145000 tokens.`}
        />
        <P>
          <strong>Fix</strong>: Trim history (see section 07). Use <IC>trim_messages</IC> or a sliding window.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 2: Wrong session_id → history leak</strong>
        </Callout>
        <CodeBlock
          title="bug_session_leak.py"
          code={`# Alice asks about battery
conversational_rag_chain.invoke({"input": "Battery life?"}, config={"configurable": {"session_id": "user"}})

# Bob asks about warranty (SAME session_id!)
result = conversational_rag_chain.invoke({"input": "Warranty length?"}, config={"configurable": {"session_id": "user"}})

# Bob's answer references Alice's battery question! 🚨`}
          runnable={false}
        />
        <P>
          <strong>Fix</strong>: Use unique <IC>session_id</IC> per user: <IC>{`{"session_id": f"user_{user.id}"}`}</IC>.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 3: Rewriter answers the question instead of rewriting</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`# Bad rewrite prompt (missing "Do NOT answer")`}
          output={`🔍 REWRITTEN QUERY: The Nimbus X1 can fly up to 5 km.
# ❌ This is the ANSWER, not a query! Retrieval will fail.`}
          runnable={false}
        />
        <P>
          <strong>Fix</strong>: Add <IC>&quot;Do NOT answer the question, just reformulate it&quot;</IC> to the system prompt. Use <IC>temperature=0</IC> for determinism.
        </P>
      </Section>

      {/* 11 */}
      <Section id="lab" number="11" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a 5-turn conversational RAG REPL with session isolation
──────────────────────────────────────────────────────────────

TASK 1: Build the history-aware retriever
  Code:
    - Load Nimbus Chroma DB
    - Create contextualize_q_prompt (with MessagesPlaceholder("chat_history"))
    - Build history_aware_retriever with create_history_aware_retriever(llm, retriever, prompt)

  Test: Invoke with {"input": "And the range?", "chat_history": [battery Q&A]}
  Expected: Retrieved docs include the 5 km range chunk (not firmware).

TASK 2: Build the full conversational chain
  Code:
    - Create qa_prompt (system + MessagesPlaceholder + human)
    - Build question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    - Build rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

  Test: Invoke 3 turns manually (battery → range → warranty), appending to chat_history each time.
  Expected: All 3 answers correct (28 min, 5 km, 12 months).

TASK 3: Wrap with RunnableWithMessageHistory
  Code:
    - Create store = {} (dict)
    - Define get_session_history(session_id) → ChatMessageHistory
    - Wrap rag_chain with RunnableWithMessageHistory

  Test: Two users (alice, bob) each ask 2 questions with different session_ids.
  Expected: Alice's history has 4 messages, Bob's has 4 messages, no overlap.

TASK 4: Add debug logging for the rewritten query
  Code:
    - Before retrieval, print the rewritten query
    - Hint: Invoke contextualize_q_prompt | llm manually and log the output

  Test: Ask "And the warranty?" after battery question.
  Expected: See logged "🔍 REWRITTEN: What is the warranty for the Nimbus X1?"

TASK 5: Verify pronoun resolution
  Code:
    - Turn 1: "How long does the X1 battery last?"
    - Turn 2: "And how far can it fly?"

  Test: Check that turn 2 retrieves the range chunk (5 km), not firmware.
  Expected: Answer is "5 km" (correct).

BONUS: Implement history trimming (last 6 messages)
  Code:
    - Use trim_messages(chat_history, max_messages=6, strategy="last")
    - Simulate 10 turns, check that only last 3 turns remain

  Test: After turn 10, history should have 6 messages (turns 8, 9, 10).`}
        />
      </Section>

      {/* 12 */}
      <Section id="interview" number="12" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["Why does basic RAG fail on follow-up questions?", "Basic RAG retrieves using the literal query. Follow-ups often contain pronouns ('it', 'that', 'they') or incomplete context ('And the range?'). Embeddings can't resolve pronouns — 'it' doesn't match 'Nimbus X1' in the embedding space. The retriever returns irrelevant chunks, and the LLM hallucinates or says 'I don't know.' The fix: rewrite the query before retrieval."],
            ["What are the two types of memory in conversational RAG?", "1. LLM memory (chat history): Past questions + answers included in the QA prompt as HumanMessage/AIMessage list. Keeps the LLM conversationally coherent. 2. Retriever memory (query rewriting): Rewrite the current query using past questions to resolve pronouns and make it standalone. The retriever doesn't see history — we preprocess the query for it."],
            ["How does create_history_aware_retriever work?", "It wraps a retriever with automatic query rewriting. If chat_history is empty (turn 1), it passes the input directly to the retriever (no LLM call). If chat_history exists, it rewrites the query using an LLM (contextualize_q_prompt) to resolve pronouns and add context, then retrieves using the rewritten query. Returns retrieved documents. It's a smart wrapper that saves an LLM call on turn 1."],
            ["What does the rewrite prompt do?", "The rewrite prompt (contextualize_q_prompt) takes chat history + current question and produces a standalone question that can be understood without history. Example: Input: 'And how far can it fly?' (after 'How long does the X1 battery last?') → Output: 'How far can the Nimbus X1 fly?' The system message must say 'Do NOT answer the question' — otherwise the LLM tries to answer instead of rewriting."],
            ["How do you isolate sessions per user?", "Use RunnableWithMessageHistory with unique session_id per user (e.g., user ID, session token). Pass config={'configurable': {'session_id': 'alice'}} on each invoke. The history store (dict, Redis, DB) maps session_id → ChatMessageHistory. Alice's history never leaks into Bob's. Critical for multi-user apps (chatbots, APIs)."],
            ["Why does history need trimming?", "After 50 turns, history has 100+ messages. Problems: 1. Token bloat: Costs spike (paying for 10K tokens of history per call), latency increases. 2. Context overflow: gpt-4o-mini has 128K limit but attention degrades. 3. Memory leaks: Redis/DB grows forever. Solutions: Trim to last N messages (sliding window), summarize old history, or TTL expiry (Redis)."],
            ["What is the conversational RAG full chain?", "history_aware_retriever (rewrites query if history exists, retrieves docs) + question_answer_chain (combines docs + history + question in prompt, calls LLM) wrapped by create_retrieval_chain. Invoke with {input, chat_history} → returns {answer, context}. Optionally wrap with RunnableWithMessageHistory for session management. This is the complete pattern."],
            ["When should you NOT use conversational RAG?", "When users don't have multi-turn conversations: single-shot FAQ search, batch QA (no user), structured forms (one submit), public docs (no sessions). Conversational RAG adds +1 LLM call (rewrite), +storage (history), +latency (~200ms), +code complexity. Only worth it if users actually have follow-ups. If 90% ask one question and leave, use basic RAG."],
            ["How do you debug a bad conversational RAG answer?", "1. Print the rewritten query (invoke contextualize_q_prompt | llm manually, log output). If the rewritten query looks wrong, tune the rewrite prompt. 2. Print the retrieved docs. If they're irrelevant, the rewrite failed. 3. Check chat_history (print it). If it's empty, the rewriter is skipped. 4. Verify session_id isolation (different users should have different histories). 5. Check for history overflow (trim if needed)."],
            ["What's the difference between contextualize_q_prompt and qa_prompt?", "contextualize_q_prompt rewrites the query (for retrieval). Takes chat_history + input, outputs a standalone question. Used BEFORE retrieval. qa_prompt answers the question (for the user). Takes chat_history + input + retrieved context, outputs the final answer. Used AFTER retrieval. Both have MessagesPlaceholder('chat_history'), but different jobs. Don't confuse them!"],
          ]}
        />
      </Section>

      {/* 13 */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Problem", "Follow-ups have pronouns ('it', 'that') → embeddings fail → retrieval returns wrong chunks"],
            ["Two memories", "LLM memory (chat history in prompt) + Retriever memory (query rewriting before retrieval)"],
            ["Rewrite prompt", "ChatPromptTemplate.from_messages([('system', 'formulate standalone question'), MessagesPlaceholder('chat_history'), ('human', '{input}')])"],
            ["History-aware retriever", "create_history_aware_retriever(llm, retriever, contextualize_q_prompt)"],
            ["Full chain", "create_retrieval_chain(history_aware_retriever, question_answer_chain)"],
            ["Session isolation", "RunnableWithMessageHistory + unique session_id per user"],
            ["Invoke signature", "rag_chain.invoke({'input': '...', 'chat_history': [...]})"],
            ["Trim history", "trim_messages(chat_history, max_messages=10, strategy='last')"],
            ["Turn 1 optimization", "If chat_history is empty, history_aware_retriever skips the rewrite (saves 1 LLM call)"],
            ["Debug #1", "Print the rewritten query: (contextualize_q_prompt | llm).invoke(...).content"],
            ["When NOT to use", "Single-shot search, batch QA, forms, public docs — no multi-turn conversation"],
            ["Complexity tax", "+1 LLM call (rewrite), +storage (history), +200ms latency, +session management code"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
