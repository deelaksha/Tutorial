"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "RunnableParallel: fan-out, join, prompt, answer",
  nodes: [
    { id: "question", icon: "🙋", label: "Question", sub: "string input", x: 8, y: 50, color: "#22d3ee" },
    { id: "parallel", icon: "🧩", label: "RunnableParallel", sub: "dict keys", x: 28, y: 50, color: "#a78bfa" },
    { id: "retriever", icon: "🔍", label: "Retriever", sub: "fetch chunks", x: 48, y: 30, color: "#fb923c" },
    { id: "passthrough", icon: "➡️", label: "RunnablePassthrough", sub: "echo input", x: 48, y: 70, color: "#fbbf24" },
    { id: "join", icon: "🔗", label: "Dict join", sub: "{context, question}", x: 68, y: 50, color: "#34d399" },
    { id: "prompt", icon: "📋", label: "Prompt", sub: "fills template", x: 82, y: 50, color: "#60a5fa" },
    { id: "answer", icon: "💬", label: "Answer", sub: "28 minutes", x: 96, y: 50, color: "#34d399" },
    { id: "error", icon: "❌", label: "KeyError", sub: "nested dict", x: 82, y: 15, color: "#f87171" },
  ],
  edges: [
    { id: "question-parallel", from: "question", to: "parallel", color: "#22d3ee" },
    { id: "parallel-retriever", from: "parallel", to: "retriever", color: "#fb923c" },
    { id: "parallel-passthrough", from: "parallel", to: "passthrough", color: "#fbbf24" },
    { id: "retriever-join", from: "retriever", to: "join", color: "#fb923c" },
    { id: "passthrough-join", from: "passthrough", to: "join", color: "#fbbf24" },
    { id: "join-prompt", from: "join", to: "prompt", color: "#60a5fa" },
    { id: "prompt-answer", from: "prompt", to: "answer", color: "#34d399" },
    { id: "join-error", from: "join", to: "error", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Fan-out and join",
      command: '{"context": retriever, "question": RunnablePassthrough()} | prompt | llm',
      steps: [
        { node: "question", paths: ["question-parallel"], text: "Input: 'How long does the X1 battery last?' (plain string). This is the canonical battery question that will be both retrieved against AND passed to the prompt." },
        { node: "parallel", paths: ["parallel-retriever", "parallel-passthrough"], text: "RunnableParallel (auto-created from the dict syntax) SPLITS the input: the SAME question string goes to TWO branches in parallel — the retriever and the passthrough." },
        { node: "retriever", paths: ["retriever-join"], text: "Retriever branch: fake_retriever (a RunnableLambda) receives the question, returns the manual.md battery paragraph: 'The Nimbus X1 battery lasts about 28 minutes on a full charge.' This is the {context}." },
        { node: "passthrough", paths: ["passthrough-join"], text: "Passthrough branch: RunnablePassthrough() receives the question and echoes it unchanged: 'How long does the X1 battery last?' This is the {question}." },
        { node: "join", paths: ["join-prompt"], text: "RunnableParallel JOINS the two outputs into a dict: {'context': 'The Nimbus X1 battery...', 'question': 'How long does the X1 battery last?'}. This dict is the input to the next stage." },
        { node: "prompt", paths: ["prompt-answer"], text: "ChatPromptTemplate receives the dict, fills {context} and {question} slots → messages sent to LLM → AIMessage → StrOutputParser → string." },
        { node: "answer", paths: [], text: "Final output: 'The Nimbus X1 battery lasts about 28 minutes on a full charge.' The parallel fan-out/join pattern is THE HEART OF RAG: retrieve + preserve question, then combine. ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Forgot RunnablePassthrough",
      command: '{"context": retriever} | prompt (no question key!)',
      steps: [
        { node: "question", paths: ["question-parallel"], text: "Input: 'How long does the X1 battery last?' (string)." },
        { node: "parallel", paths: ["parallel-retriever"], text: "Oops! The dict has ONLY {'context': retriever}. No 'question' key. The retriever runs, but the question is LOST (not passed through)." },
        { node: "retriever", paths: ["retriever-join"], text: "Retriever returns the battery paragraph → {'context': 'The Nimbus X1 battery...'}. This dict goes to the prompt." },
        { node: "join", paths: ["join-error"], text: "Prompt expects TWO keys: {context} and {question}. Input dict has only {'context': '...'}. Missing 'question' key!" },
        { node: "error", paths: [], text: "KeyError: 'question' (or PromptInputError: Expected mapping with keys context, question but got {'context': ...}). Fix: Add 'question': RunnablePassthrough() to the dict. Without passthrough, the question doesn't survive the parallel split. 🚨" },
      ],
    },
    {
      id: "power",
      name: "⚡ Streaming through the graph",
      command: 'chain.stream("How long does the X1 battery last?")',
      steps: [
        { node: "question", paths: ["question-parallel"], text: "Input: 'How long does the X1 battery last?' Same question, but we call .stream() instead of .invoke()." },
        { node: "parallel", paths: ["parallel-retriever", "parallel-passthrough"], text: "RunnableParallel runs both branches (retriever + passthrough). These complete FIRST (not streamed — they return full results)." },
        { node: "retriever", paths: ["retriever-join"], text: "Retriever returns the battery paragraph (blocking call, no streaming). RunnablePassthrough returns the question (instant)." },
        { node: "join", paths: ["join-prompt"], text: "Join assembles {'context': '...', 'question': '...'}. This dict flows to the prompt (instant — just template filling)." },
        { node: "prompt", paths: ["prompt-answer"], text: "Prompt fills, sends to LLM. The LLM STREAMS tokens back: 'The', ' Nimbus', ' X1', ' battery', ' lasts', ' about', ' 28', ' minutes', '...'. Each token is yielded as it arrives." },
        { node: "answer", paths: [], text: "Your code receives tokens in real-time: print(chunk, end='', flush=True). The user sees the answer appear word-by-word like ChatGPT. Streaming propagates through the chain — earlier stages (retrieval) block, later stages (LLM generation) stream. ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-lcel", label: "What LCEL Is ⭐" },
  { id: "invoke-batch-stream", label: "invoke vs batch vs stream" },
  { id: "lambda", label: "RunnableLambda" },
  { id: "passthrough", label: "RunnablePassthrough ⭐" },
  { id: "parallel", label: "RunnableParallel / Dict Syntax ⭐" },
  { id: "visual", label: "Visual Flow" },
  { id: "branching", label: "Branching & Routing" },
  { id: "fallbacks", label: "Fallbacks & Retries" },
  { id: "inspect", label: "Inspecting Chains" },
  { id: "async", label: "Async (ainvoke / abatch)" },
  { id: "debugging", label: "Debugging" },
  { id: "lab", label: "Lab Exercise" },
  { id: "memorize", label: "🧠 Memorize This" },
  { id: "interview", label: "Interview Questions" },
];

export default function LcelPage() {
  return (
    <TopicShell
      icon="🔗"
      title="LCEL — Chains with the Pipe"
      gradientWord="LCEL"
      subtitle="LCEL (LangChain Expression Language) is the composition layer every RAG pipeline is built on. The pipe operator turns prompt | llm | parser into a Runnable with .invoke/.batch/.stream for free. You'll master RunnableParallel (the heart of RAG), RunnablePassthrough (the trick that preserves the question), branching, retries, async, and streaming — everything you need to build production chains."
      nav={NAV}
      badges={["🔗 LCEL pipe syntax", "🧩 RunnableParallel", "➡️ RunnablePassthrough", "🔀 Branching & routing", "⚡ Streaming"]}
      next={{ icon: "📄", label: "Loaders &amp; Splitters — Chunking", href: "/rag/loaders-splitters" }}
      backHref="/rag"
      backLabel="🦜 RAG &amp; LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-lcel" number="01" title="What LCEL Is ⭐">
        <P>
          <strong>LCEL</strong> (LangChain Expression Language) is the <IC>|</IC> pipe syntax you saw in the previous topic: <IC>prompt | llm | parser</IC>. It&apos;s a declarative DSL (domain-specific language) for composing Runnables. Every chain you build is LCEL.
        </P>
        <CodeBlock
          title="lcel_basic.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
parser = StrOutputParser()

# LCEL: pipe 3 Runnables
chain = prompt | llm | parser

# The chain is ALSO a Runnable
print(type(chain))  # <class 'langchain_core.runnables.base.RunnableSequence'>

# All Runnables have .invoke, .batch, .stream
answer = chain.invoke({"question": "What is 2+2?"})
print(answer)  # "2+2 equals 4."`}
          output={`<class 'langchain_core.runnables.base.RunnableSequence'>
2+2 equals 4.`}
        />
        <P>
          <strong>Why LCEL matters:</strong>
        </P>
        <Table
          head={["Feature", "What you get", "Example"]}
          rows={[
            ["Composition", <>Chain any Runnables with <IC>|</IC>. Order matters (left to right).</>, <><IC>a | b | c</IC> means <IC>c(b(a(input)))</IC></>],
            ["Uniform interface", <>Every chain has <IC>.invoke</IC>, <IC>.batch</IC>, <IC>.stream</IC> for free.</>, <><IC>chain.invoke(x)</IC>, <IC>chain.batch([x, y])</IC>, <IC>chain.stream(x)</IC></>],
            ["Parallelism", <><IC>.batch()</IC> runs multiple inputs in parallel (async under the hood).</>, "3 questions in 1.2s instead of 3.1s (looping)"],
            ["Streaming", <><IC>.stream()</IC> yields tokens as they arrive from the LLM.</>, "ChatGPT-style word-by-word output"],
            ["Retries & fallbacks", <>Add <IC>.with_retry()</IC>, <IC>.with_fallbacks([backup])</IC> to any Runnable.</>, "Rate-limit? Retry 3 times. Primary LLM down? Fall back to Claude."],
          ]}
        />
        <Callout type="analogy">
          🚰 <strong>Unix pipes analogy</strong>: LCEL is like shell pipes — <IC>cat file.txt | grep error | sort</IC>. Each command is a Runnable (takes input, produces output). The <IC>|</IC> connects them. Output of <IC>cat</IC> flows to <IC>grep</IC>, output of <IC>grep</IC> flows to <IC>sort</IC>. Same concept: <IC>prompt | llm | parser</IC>. Data flows left to right, each stage transforms it. LangChain just made it work for LLMs. 🔗
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="invoke-batch-stream" number="02" title="invoke vs batch vs stream">
        <P>
          Same chain, three calling styles. <IC>.invoke()</IC> for one input, <IC>.batch()</IC> for multiple inputs in parallel, <IC>.stream()</IC> for token-by-token output.
        </P>
        <CodeBlock
          title="invoke_vs_batch.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import time

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = prompt | llm | StrOutputParser()

# 1. invoke (one input at a time)
start = time.time()
answer1 = chain.invoke({"question": "What is 2+2?"})
answer2 = chain.invoke({"question": "What is 10-3?"})
answer3 = chain.invoke({"question": "What is 5*6?"})
loop_time = time.time() - start

print(f"Loop (3× invoke): {loop_time:.2f}s")
print(f"  {answer1}")
print(f"  {answer2}")
print(f"  {answer3}")

# 2. batch (parallel)
start = time.time()
answers = chain.batch([
    {"question": "What is 2+2?"},
    {"question": "What is 10-3?"},
    {"question": "What is 5*6?"}
])
batch_time = time.time() - start

print(f"\\nBatch (parallel): {batch_time:.2f}s")
for a in answers:
    print(f"  {a}")`}
          output={`Loop (3× invoke): 3.12s
  2+2 equals 4.
  10-3 equals 7.
  5*6 equals 30.

Batch (parallel): 1.18s
  2+2 equals 4.
  10-3 equals 7.
  5*6 equals 30.`}
        />
        <P>
          <strong>Why batch is faster:</strong> LangChain uses <IC>asyncio</IC> under the hood. Instead of waiting for each API call to finish (3× 1s = 3s), it sends all 3 requests concurrently and waits for the slowest one (max 1.2s). Near 3× speedup for I/O-bound tasks (API calls, database queries, retrieval). 🚀
        </P>
        <CodeBlock
          title="stream_demo.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = prompt | llm | StrOutputParser()

# 3. stream (token-by-token)
print("Streaming answer:")
for chunk in chain.stream({"question": "Explain the X1 battery in one sentence."}):
    print(chunk, end="", flush=True)
print()  # newline at the end`}
          output={`Streaming answer:
The Nimbus X1 battery provides approximately 28 minutes of flight time on a full charge.`}
        />
        <P>
          <strong>When to use each:</strong>
        </P>
        <Table
          head={["Method", "Use case", "When NOT to use"]}
          rows={[
            [<IC>.invoke(x)</IC>, "Single input (one question, one document, one user request)", "Processing many inputs (use .batch instead)"],
            [<IC>.batch([x, y, z])</IC>, "Multiple inputs in parallel (bulk processing, testing, batch jobs)", "Real-time user interaction (no streaming feedback)"],
            [<IC>.stream(x)</IC>, "Real-time UI (chatbot, CLI tool) where user sees tokens as they arrive", "Batch processing (streaming overhead for no benefit)"],
          ]}
        />
      </Section>

      {/* 03 */}
      <Section id="lambda" number="03" title="RunnableLambda">
        <P>
          <IC>RunnableLambda</IC> wraps any Python function into a Runnable so you can pipe it. Use it for custom logic (data cleaning, API calls, database lookups, etc.) in the middle of a chain.
        </P>
        <CodeBlock
          title="runnable_lambda.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

# Custom function: clean the question (lowercase, strip)
def cleanup_question(q: str) -> str:
    return q.lower().strip()

# Wrap it in RunnableLambda
cleanup = RunnableLambda(cleanup_question)

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
parser = StrOutputParser()

# Chain: cleanup → prompt → llm → parser
chain = cleanup | prompt | llm | parser

# Test with messy input
answer = chain.invoke("  WHAT IS 2+2?  ")
print(answer)  # LLM receives lowercase/stripped version`}
          output={`2+2 equals 4.`}
        />
        <P>
          <strong>When to use RunnableLambda:</strong>
        </P>
        <Table
          head={["Scenario", "Example function"]}
          rows={[
            ["Data cleaning", <>Lowercase, strip whitespace, remove punctuation: <IC>lambda q: q.lower().strip()</IC></>],
            ["API call", <>Fetch external data: <IC>lambda city: requests.get(f&quot;https://api.weather/{`{city}`}&quot;).json()</IC></>],
            ["Database lookup", <>Query a DB: <IC>lambda user_id: db.get_user(user_id)</IC></>],
            ["Logging", <>Log inputs: <IC>lambda x: (print(f&quot;Input: {`{x}`}&quot;), x)[1]</IC> (side effect + return input)</>],
            ["Routing logic", <>Decide next step: <IC>lambda q: &quot;warranty&quot; if &quot;return&quot; in q else &quot;general&quot;</IC></>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Lambda shorthand</strong>: <IC>RunnableLambda(lambda x: x.lower())</IC> works for one-liners. For multi-line functions, define a <IC>def</IC> function and wrap it: <IC>RunnableLambda(my_func)</IC>. Both are Runnables — both have <IC>.invoke/.batch/.stream</IC>. Use lambdas for simple transforms, full functions for complex logic. 🎯
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="passthrough" number="04" title="RunnablePassthrough ⭐">
        <P>
          <IC>RunnablePassthrough()</IC> is the identity function — it receives input and returns it unchanged. Why? <strong>RAG needs it</strong>. The question must survive alongside the retrieved context. Without passthrough, the question is lost.
        </P>
        <CodeBlock
          title="passthrough_demo.py"
          code={`from langchain_core.runnables import RunnablePassthrough

passthrough = RunnablePassthrough()

# It just echoes the input
result = passthrough.invoke("hello")
print(result)  # "hello"

result2 = passthrough.invoke({"key": "value"})
print(result2)  # {"key": "value"}`}
          output={`hello
{'key': 'value'}`}
        />
        <P>
          Seems pointless? Not in a chain. Look at this RAG pattern:
        </P>
        <CodeBlock
          title="rag_passthrough.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

# Fake retriever (in real RAG, this is a VectorStore.as_retriever())
def fake_retriever(question: str) -> str:
    # Simulate retrieval: return the battery paragraph
    return "The Nimbus X1 battery lasts about 28 minutes on a full charge."

retriever = RunnableLambda(fake_retriever)

# RAG prompt (expects {context} and {question})
prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer based ONLY on context:\\n{context}"),
    ("human", "{question}")
])

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# THE RAG CHAIN (heart of LCEL) ⭐
chain = (
    {"context": retriever, "question": RunnablePassthrough()}  # dict → RunnableParallel
    | prompt
    | llm
    | StrOutputParser()
)

answer = chain.invoke("How long does the X1 battery last?")
print(answer)`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>What happened:</strong>
        </P>
        <CodeBlock
          title="rag_breakdown.txt"
          runnable={false}
          code={`chain.invoke("How long does the X1 battery last?")

INPUT: "How long does the X1 battery last?" (plain string)

STEP 1: {"context": retriever, "question": RunnablePassthrough()}
  This is RunnableParallel (dict syntax). It SPLITS the input:
    - "context" branch: calls retriever("How long...") → "The Nimbus X1 battery..."
    - "question" branch: calls RunnablePassthrough()("How long...") → "How long..." (unchanged)

  Output: {"context": "The Nimbus X1 battery...", "question": "How long..."}

STEP 2: prompt receives the dict
  Fills {context} and {question} slots → messages

STEP 3: llm → AIMessage
STEP 4: parser → string

────────────────────────────────────────────────────────────────
WHY PASSTHROUGH?

Without it:
  {"context": retriever}  # No "question" key!
  The dict becomes: {"context": "..."}
  Prompt expects {question} → KeyError ❌

With it:
  {"context": retriever, "question": RunnablePassthrough()}
  The dict becomes: {"context": "...", "question": "..."}
  Prompt gets both → fills template ✅

RunnablePassthrough is THE trick that preserves the question
in RAG. Every RAG chain uses it. 🔗`}
        />
        <Callout type="note">
          📌 <strong>Dict syntax shortcut</strong>: A plain dict in a chain auto-becomes <IC>RunnableParallel</IC>. <IC>{`{"context": retriever, "question": RunnablePassthrough()}`}</IC> is shorthand for <IC>RunnableParallel(context=retriever, question=RunnablePassthrough())</IC>. Both do the same thing: run branches in parallel, assemble results into a dict. The dict syntax is cleaner — always use it. 🎯
          </Callout>
      </Section>

      {/* 05 */}
      <Section id="parallel" number="05" title="RunnableParallel / Dict Syntax ⭐">
        <P>
          <IC>RunnableParallel</IC> is the <strong>heart of RAG</strong>. It takes one input, splits it into multiple branches (runs them in parallel), and joins the outputs into a dict. The dict syntax <IC>{`{"key1": runnable1, "key2": runnable2}`}</IC> auto-creates a RunnableParallel.
        </P>
        <CodeBlock
          title="parallel_demo.py"
          code={`from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# Two functions (simulate retriever + passthrough)
def get_context(q: str) -> str:
    return f"Context for: {q}"

def uppercase(q: str) -> str:
    return q.upper()

# Dict syntax → RunnableParallel
parallel = {
    "context": RunnableLambda(get_context),
    "question": RunnablePassthrough(),
    "upper": RunnableLambda(uppercase)
}

result = parallel.invoke("What is the battery life?")
print(result)`}
          output={`{'context': 'Context for: What is the battery life?', 'question': 'What is the battery life?', 'upper': 'WHAT IS THE BATTERY LIFE?'}`}
        />
        <P>
          <strong>How it works:</strong>
        </P>
        <CodeBlock
          title="parallel_breakdown.txt"
          runnable={false}
          code={`parallel.invoke("What is the battery life?")

INPUT: "What is the battery life?" (string)

RunnableParallel SPLITS the input to 3 branches:
  Branch 1: "context" key → RunnableLambda(get_context)
    → get_context("What is the battery life?")
    → "Context for: What is the battery life?"

  Branch 2: "question" key → RunnablePassthrough()
    → "What is the battery life?" (unchanged)

  Branch 3: "upper" key → RunnableLambda(uppercase)
    → uppercase("What is the battery life?")
    → "WHAT IS THE BATTERY LIFE?"

All 3 branches run IN PARALLEL (async under the hood).

RunnableParallel JOINS the outputs:
  {
    "context": "Context for: What is the battery life?",
    "question": "What is the battery life?",
    "upper": "WHAT IS THE BATTERY LIFE?"
  }

This dict is the final output (or the input to the next stage if chained).

────────────────────────────────────────────────────────────────
RAG USE CASE:

{"context": retriever, "question": RunnablePassthrough()}
  → retriever fetches chunks (slow, ~100ms)
  → passthrough echoes the question (instant)
  → Both run in parallel (no sequential wait)
  → Output: {"context": "...", "question": "..."}
  → This dict flows to the prompt → fills {context} and {question} ✅

Without parallel, you'd write imperative code:
  context = retriever.invoke(question)
  data = {"context": context, "question": question}
  result = prompt.invoke(data)

With parallel:
  chain = {"context": retriever, "question": RunnablePassthrough()} | prompt
  result = chain.invoke(question)

Declarative > imperative. LCEL FTW. 🔗`}
        />
      </Section>

      {/* 06 */}
      <Section id="visual" number="06" title="Visual Flow">
        <P>
          The AnimatedFlow diagram at the top shows the fan-out/join pattern: one input splits into two branches (retriever + passthrough), then joins into a dict <IC>{`{"context": "...", "question": "..."}`}</IC>. Scroll back up and click through the 3 scenarios:
        </P>
        <Table
          head={["Scenario", "What you learn"]}
          rows={[
            [<>✅ <strong>Fan-out and join</strong></>, "The question is COPIED to both branches. Retriever returns context, passthrough returns the original question. The dict assembles both → flows to the prompt → answer. This is every RAG chain."],
            [<>❌ <strong>Forgot passthrough</strong></>, <>If you omit <IC>&quot;question&quot;: RunnablePassthrough()</IC>, the dict has only <IC>{`{"context": "..."}`}</IC>. The prompt expects <IC>{`{question}`}</IC> → KeyError. The question is LOST because nothing passed it through. 🚨</>],
            [<>⚡ <strong>Streaming</strong></>, <>Call <IC>.stream()</IC> on the chain. Retrieval runs first (blocking), then the LLM streams tokens back word-by-word. Streaming propagates through the graph — earlier stages block, LLM generation streams. User sees real-time output. ⚡</>],
          ]}
        />
      </Section>

      {/* 07 */}
      <Section id="branching" number="07" title="Branching & Routing">
        <P>
          Sometimes you want <strong>different prompts</strong> based on the question. Example: refund questions → warranty prompt; everything else → general prompt. Use a routing <IC>RunnableLambda</IC> or <IC>RunnableBranch</IC> (deprecated in 0.3, use lambda instead).
        </P>
        <CodeBlock
          title="routing_demo.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

# Two prompts
warranty_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot. Focus on warranty and return policy."),
    ("human", "{question}")
])

general_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot. Answer general questions about the X1."),
    ("human", "{question}")
])

# Router: decide which prompt based on question
def route_question(q: str):
    if "return" in q.lower() or "refund" in q.lower():
        return warranty_prompt
    else:
        return general_prompt

router = RunnableLambda(route_question)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Chain: router picks the prompt, then llm, then parser
chain = router | llm | StrOutputParser()

# Test 1: refund question (should use warranty_prompt)
answer1 = chain.invoke("Can I return my X1 after 6 weeks?")
print(f"Refund Q: {answer1}")

# Test 2: battery question (should use general_prompt)
answer2 = chain.invoke("How long does the battery last?")
print(f"Battery Q: {answer2}")`}
          output={`Refund Q: According to our return policy, we offer a 30-day return window. Since 6 weeks exceeds this period, you would not be eligible for a return.
Battery Q: The Nimbus X1 battery lasts approximately 28 minutes on a full charge.`}
        />
        <P>
          <strong>How routing works:</strong>
        </P>
        <CodeBlock
          title="routing_explained.txt"
          runnable={false}
          code={`chain.invoke("Can I return my X1 after 6 weeks?")

INPUT: "Can I return my X1 after 6 weeks?" (string)

STEP 1: router (RunnableLambda)
  Calls route_question("Can I return...")
  → "return" in question.lower() → True
  → Returns warranty_prompt (a ChatPromptTemplate object)

STEP 2: llm receives warranty_prompt
  Wait, how? The router returned a PROMPT (not messages).
  LangChain auto-invokes it:
    warranty_prompt.invoke({"question": "Can I return..."})
    → ChatPromptValue (messages)
  Then calls llm.invoke(messages) → AIMessage

STEP 3: parser → string

────────────────────────────────────────────────────────────────
KEY INSIGHT:

If a chain stage returns a Runnable (e.g., warranty_prompt),
LangChain auto-invokes it with the ORIGINAL input.

This enables dynamic routing: the router picks a DIFFERENT
chain based on input, and that chain runs. Powerful! 🔀

────────────────────────────────────────────────────────────────
USE CASES:

- Ticket triage: urgent → escalate chain, normal → standard chain
- Multi-language: detect language → route to language-specific prompt
- Multi-product: "X1" in question → X1 knowledge base, "Pro" → Pro KB
- Intent routing: battery/warranty/firmware → 3 different prompts`}
        />
      </Section>

      {/* 08 */}
      <Section id="fallbacks" number="08" title="Fallbacks & Retries">
        <P>
          Production RAG faces rate limits, API errors, timeouts. <IC>.with_retry()</IC> retries on failure. <IC>.with_fallbacks()</IC> tries a backup model. Both methods work on ANY Runnable.
        </P>
        <CodeBlock
          title="retry_demo.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Add retry: up to 3 attempts, exponential backoff
llm_with_retry = llm.with_retry(stop_after_attempt=3)

chain = prompt | llm_with_retry | StrOutputParser()

# If OpenAI rate-limits (429), LangChain retries 3 times (waits 1s, 2s, 4s)
answer = chain.invoke({"question": "What is 2+2?"})
print(answer)`}
          output={`2+2 equals 4.`}
        />
        <CodeBlock
          title="fallback_demo.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])

# Primary LLM: gpt-4o-mini
primary_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Backup LLM: Claude (in case OpenAI is down)
backup_llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)

# Fallback: try primary, if it fails, try backup
llm_with_fallback = primary_llm.with_fallbacks([backup_llm])

chain = prompt | llm_with_fallback | StrOutputParser()

# If OpenAI is down (500 error), LangChain calls Claude instead
answer = chain.invoke({"question": "What is 2+2?"})
print(answer)`}
          output={`2+2 equals 4.`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Production mistake</strong>: Running RAG with no retry in production. A single 429 rate-limit error crashes your app. <strong>Always add <IC>.with_retry()</IC> to the LLM</strong> (or the entire chain). Exponential backoff (1s, 2s, 4s) avoids hammering the API. For mission-critical systems, add fallbacks too (OpenAI → Claude). Costs 2× in API fees? Worth it for 99.9% uptime. 🚨
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="inspect" number="09" title="Inspecting Chains">
        <P>
          LangChain chains are <strong>graphs</strong> (directed acyclic graphs, DAGs). You can inspect the structure with <IC>.get_graph()</IC> and print an ASCII diagram.
        </P>
        <CodeBlock
          title="inspect_chain.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

def fake_retriever(q: str) -> str:
    return "battery: 28 min"

prompt = ChatPromptTemplate.from_messages([
    ("system", "Context: {context}"),
    ("human", "{question}")
])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

chain = (
    {"context": RunnableLambda(fake_retriever), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# Print ASCII graph
print(chain.get_graph().print_ascii())`}
          output={`           +---------------------------------+
           | Parallel<context,question>Input |
           +---------------------------------+
                         **
                         **
           +--------------------------------+
           | Parallel<context,question>Map  |
           +--------------------------------+
                    ***               ***
                 ***                     ***
+----------------------+              +-------------+
| Lambda(fake_retriever)|              |Passthrough  |
+----------------------+              +-------------+
                    ***               ***
                       ***         ***
           +-------------------------------+
           | Parallel<context,question>Out |
           +-------------------------------+
                         *
                         *
               +--------------------+
               | ChatPromptTemplate |
               +--------------------+
                         *
                         *
                   +-----------+
                   | ChatOpenAI|
                   +-----------+
                         *
                         *
               +------------------+
               | StrOutputParser  |
               +------------------+
                         *
                         *
           +------------------------------+
           | StrOutputParserOutput        |
           +------------------------------+`}
        />
        <P>
          You see the parallel split (context + question), the join, then the sequential stages (prompt → llm → parser). Use this to debug complex chains: does data flow where you expect?
        </P>
        <P>
          <strong>Other inspection methods:</strong>
        </P>
        <CodeBlock
          title="chain_attributes.txt"
          runnable={false}
          code={`chain.first   → The first Runnable in the sequence (the dict/parallel)
chain.last    → The last Runnable (StrOutputParser)
chain.steps   → List of all Runnables in order [parallel, prompt, llm, parser]

Use case: chain.steps[2] → the LLM (ChatOpenAI). You can inspect its config,
          swap it out, or call it directly for debugging. 🔍`}
        />
      </Section>

      {/* 10 */}
      <Section id="async" number="10" title="Async (ainvoke / abatch)">
        <P>
          LangChain has async versions of all Runnable methods: <IC>.ainvoke()</IC>, <IC>.abatch()</IC>, <IC>.astream()</IC>. Use them in async Python code (FastAPI, async scripts, etc.). They&apos;re faster because they don&apos;t block the event loop.
        </P>
        <CodeBlock
          title="async_demo.py"
          code={`import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = prompt | llm | StrOutputParser()

async def main():
    # ainvoke (async version of invoke)
    answer = await chain.ainvoke({"question": "What is 2+2?"})
    print(f"ainvoke: {answer}")

    # abatch (async version of batch)
    answers = await chain.abatch([
        {"question": "What is 2+2?"},
        {"question": "What is 10-3?"}
    ])
    print(f"abatch: {answers}")

# Run the async function
asyncio.run(main())`}
          output={`ainvoke: 2+2 equals 4.
abatch: ['2+2 equals 4.', '10-3 equals 7.']`}
        />
        <P>
          <strong>When to use async:</strong>
        </P>
        <Table
          head={["Context", "Use", "Why"]}
          rows={[
            ["FastAPI endpoint", <><IC>await chain.ainvoke(...)</IC></>, "FastAPI is async. Blocking .invoke() ties up a worker thread. Async keeps the server responsive."],
            ["Async script", <><IC>await chain.ainvoke(...)</IC></>, "If your script is async (uses asyncio), use async methods. Mixing sync/async causes deadlocks."],
            ["Sync script / Jupyter", <><IC>chain.invoke(...)</IC></>, "Simpler. No await, no asyncio.run(). Jupyter runs sync by default."],
          ]}
        />
        <Callout type="note">
          📌 <strong>Under the hood</strong>: LangChain&apos;s <IC>.invoke()</IC> is sync but calls async code internally (e.g., OpenAI SDK uses <IC>httpx</IC> async). LangChain wraps it with <IC>asyncio.run()</IC> for you. If you call <IC>.invoke()</IC> inside an existing async context (e.g., FastAPI), it creates a nested event loop → error. Solution: use <IC>.ainvoke()</IC> in async contexts. For simple scripts, stick with <IC>.invoke()</IC>. 🎯
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging">
        <P>
          <strong>Common LCEL errors and how to fix them:</strong>
        </P>
        <Table
          head={["Error", "Cause", "Fix"]}
          rows={[
            [<><IC>Expected mapping with keys {`{context, question}`}</IC></>, <>Prompt expects a dict with specific keys, but received something else (e.g., a string or dict with wrong keys).</>, <>Check the input to the prompt. If chaining with RunnableParallel, ensure the dict keys match the template variables: <IC>{`{"context": ..., "question": ...}`}</IC> → <IC>{`{context}`}</IC> and <IC>{`{question}`}</IC> in template.</>],
            [<><IC>TypeError: unsupported operand type(s) for |</IC></>, <>You tried to pipe something that&apos;s NOT a Runnable (e.g., a plain function).</>, <>Wrap it in <IC>RunnableLambda</IC>: <IC>RunnableLambda(my_func)</IC>. Only Runnables support the <IC>|</IC> operator.</>],
            [<><IC>KeyError: &apos;question&apos;</IC></>, <>The prompt template has <IC>{`{question}`}</IC>, but the input dict doesn&apos;t have a <IC>&quot;question&quot;</IC> key.</>, <>Add <IC>&quot;question&quot;: RunnablePassthrough()</IC> to your RunnableParallel dict, OR change the template variable name to match the input key.</>],
            [<><IC>Streaming not working (chunks buffered)</IC></>, <>You added a parser or component that buffers output (e.g., a custom function that calls <IC>.join()</IC> on a list).</>, <>Remove buffering components. StrOutputParser streams correctly. If you have a custom RunnableLambda, make sure it yields chunks, not a final string.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Debug checklist</strong>: (1) Enable <IC>set_debug(True)</IC> to see data flow. (2) Run each stage separately: <IC>parallel.invoke(...)</IC>, <IC>prompt.invoke(...)</IC>, etc. (3) Print intermediate outputs: <IC>result = parallel.invoke(x); print(result)</IC>. (4) Check types: is the parallel output a dict? Does it have the right keys? (5) Use <IC>.get_graph().print_ascii()</IC> to visualize the chain structure. 🔍
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a 2-branch parallel chain: summarize topic + answer question
══════════════════════════════════════════════════════════════════

TASK 1: Create two RunnableLambdas (simulate topic summarizer + question answerer)
  Code:
    from langchain_core.runnables import RunnableLambda, RunnablePassthrough

    # Branch A: extract topic (fake summarizer)
    def summarize_topic(q: str) -> str:
        if "battery" in q.lower():
            return "Topic: Battery life"
        elif "weight" in q.lower():
            return "Topic: Drone weight"
        else:
            return "Topic: General"

    # Branch B: echo the question
    def echo_question(q: str) -> str:
        return q

    summarizer = RunnableLambda(summarize_topic)
    echoer = RunnableLambda(echo_question)

TASK 2: Create a RunnableParallel (dict syntax) with both branches
  Code:
    parallel = {
        "topic": summarizer,
        "question": echoer
    }

  Test: parallel.invoke("How long does the X1 battery last?")
  Expected: {"topic": "Topic: Battery life", "question": "How long does the X1 battery last?"}

TASK 3: Create a prompt that uses {topic} and {question}
  Code:
    from langchain_core.prompts import ChatPromptTemplate

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are NimbusBot. The user is asking about: {topic}"),
        ("human", "{question}")
    ])

TASK 4: Chain: parallel → prompt → llm → parser
  Code:
    from langchain_openai import ChatOpenAI
    from langchain_core.output_parsers import StrOutputParser

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    parser = StrOutputParser()

    chain = parallel | prompt | llm | parser

TASK 5: Test with 3 questions (battery, weight, general)
  Code:
    q1 = "How long does the X1 battery last?"
    q2 = "How much does the X1 weigh?"
    q3 = "Can I fly it in the rain?"

    a1 = chain.invoke(q1)
    a2 = chain.invoke(q2)
    a3 = chain.invoke(q3)

    print(f"Battery Q: {a1}")
    print(f"Weight Q: {a2}")
    print(f"Rain Q: {a3}")

  Expected:
    - Battery answer mentions "28 minutes"
    - Weight answer mentions "795 grams"
    - Rain answer is general (no specific topic)

  Verify: All 3 answers are factually correct about the X1.

TASK 6: Inspect the chain graph
  Code:
    chain.get_graph().print_ascii()

  Observation: You see Parallel → Prompt → ChatOpenAI → Parser.
               The parallel has 2 branches (topic + question).

TASK 7: Break it (learn from errors)
  - Remove one dict key: {"topic": summarizer} (no "question")
    → KeyError when prompt tries to fill {question}
  - Pipe a plain function: chain2 = summarize_topic | prompt
    → TypeError (summarize_topic is not a Runnable)
  - Pass wrong input: chain.invoke(123) (not a string)
    → TypeError in summarizer (expects str)

──────────────────────────────────────────────────────────────────
BONUS: Add .batch() and compare speed vs looping
  Code:
    import time

    questions = [
        "How long does the X1 battery last?",
        "How much does the X1 weigh?",
        "What is the range?"
    ]

    # Loop (3× invoke)
    start = time.time()
    for q in questions:
        _ = chain.invoke(q)
    loop_time = time.time() - start

    # Batch (parallel)
    start = time.time()
    answers = chain.batch(questions)
    batch_time = time.time() - start

    print(f"Loop: {loop_time:.2f}s")
    print(f"Batch: {batch_time:.2f}s")
    print(f"Speedup: {loop_time / batch_time:.1f}×")

  Expected: Batch is ~2-3× faster (3 questions in ~1.2s vs ~3s looping).`}
        />
      </Section>

      {/* 13 */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["LCEL pipe", "chain = a | b | c → pipes Runnables left-to-right"],
            [".invoke(x)", "Run chain on single input → output"],
            [".batch([x, y])", "Run chain on multiple inputs in parallel (async under hood, 2-3× faster than looping)"],
            [".stream(x)", "Run chain, yield tokens as they arrive (ChatGPT-style output)"],
            ["RunnablePassthrough", "Identity function: input → output (unchanged). Use to preserve question in RAG."],
            ["RunnableParallel", "Dict syntax: {'key1': r1, 'key2': r2} → runs both in parallel, joins into dict"],
            ["RAG pattern", "{'context': retriever, 'question': RunnablePassthrough()} | prompt | llm | parser"],
            ["RunnableLambda", "Wrap any function: RunnableLambda(my_func) → makes it pipeable"],
            [".with_retry()", "llm.with_retry(stop_after_attempt=3) → retries on error (rate limits, timeouts)"],
            [".with_fallbacks()", "llm.with_fallbacks([backup_llm]) → if primary fails, try backup"],
            [".ainvoke()", "Async version of .invoke() — use in FastAPI, async scripts"],
            [".get_graph()", "chain.get_graph().print_ascii() → visualize chain structure (debug complex chains)"],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="interview" number="14" title="Interview Questions">
        <P>
          <strong>Q1: What does LCEL give you for free?</strong>
        </P>
        <Callout type="note">
          📌 LCEL (the <IC>|</IC> pipe) gives you: (1) Declarative composition — chain Runnables left-to-right, no nested function calls. (2) Uniform interface — every chain has <IC>.invoke/.batch/.stream</IC> automatically. (3) Parallelism — <IC>.batch()</IC> runs multiple inputs concurrently (2-3× faster than looping). (4) Streaming — <IC>.stream()</IC> yields tokens as they arrive from the LLM. (5) Retries/fallbacks — <IC>.with_retry()</IC> and <IC>.with_fallbacks()</IC> work on any Runnable. (6) Async support — <IC>.ainvoke/.abatch/.astream</IC> for async contexts (FastAPI). You write <IC>a | b | c</IC>, LangChain handles the rest. 🚀
        </Callout>

        <P>
          <strong>Q2: What happens when you put a dict in a chain?</strong>
        </P>
        <Callout type="note">
          📌 A plain dict <IC>{`{"key1": runnable1, "key2": runnable2}`}</IC> auto-becomes <IC>RunnableParallel</IC>. LangChain: (1) Takes the input (e.g., a string). (2) Passes it to EACH dict value (runnable1, runnable2) in parallel. (3) Collects outputs and assembles a new dict: <IC>{`{"key1": output1, "key2": output2}`}</IC>. (4) This output dict flows to the next stage. Example: <IC>{`{"context": retriever, "question": RunnablePassthrough()}`}</IC> → retriever fetches chunks, passthrough echoes the question → output is <IC>{`{"context": "...", "question": "..."}`}</IC>. This is THE RAG pattern. 🔗
        </Callout>

        <P>
          <strong>Q3: Why do you need RunnablePassthrough in RAG?</strong>
        </P>
        <Callout type="note">
          📌 RAG prompts have two variables: <IC>{`{context}`}</IC> (retrieved chunks) and <IC>{`{question}`}</IC> (user query). The retriever provides context, but the QUESTION must also reach the prompt. Without <IC>RunnablePassthrough()</IC>, the parallel dict is <IC>{`{"context": retriever}`}</IC> (no question key) → prompt expects <IC>{`{question}`}</IC> → KeyError. <IC>RunnablePassthrough()</IC> echoes the input (the question) unchanged, so the dict becomes <IC>{`{"context": "...", "question": "..."}`}</IC> → both slots filled. It&apos;s the trick that preserves the question alongside the context. Every RAG chain uses it. ✅
        </Callout>

        <P>
          <strong>Q4: What&apos;s the difference between .batch() and looping .invoke()?</strong>
        </P>
        <Callout type="note">
          📌 <IC>.invoke()</IC> in a loop runs sequentially: call 1 → wait → call 2 → wait → call 3. Total time = 3 × latency (~3s for 3 LLM calls). <IC>.batch([x, y, z])</IC> runs in parallel (async under the hood): call 1, 2, 3 concurrently → wait for the slowest one → return all results. Total time = max latency (~1.2s for the slowest call). Speedup: ~3× for I/O-bound tasks (API calls, DB queries, retrieval). Use <IC>.batch()</IC> for bulk processing, testing, or any scenario with multiple independent inputs. 🚀
        </Callout>

        <P>
          <strong>Q5: How does streaming propagate through a chain?</strong>
        </P>
        <Callout type="note">
          📌 <IC>.stream()</IC> yields chunks as they become available. In a chain like <IC>retriever | prompt | llm | parser</IC>: (1) Retriever runs (blocking, no streaming — returns full chunks). (2) Prompt fills (instant, no streaming). (3) LLM generates tokens → STREAMS them one-by-one. (4) Parser forwards each token (no buffering). So streaming starts at the LLM stage — earlier stages block, later stages stream. User sees real-time output: &quot;The&quot;, &quot; Nimbus&quot;, &quot; X1&quot;, &quot; battery&quot;, etc. Perfect for chat UIs (like ChatGPT). For batch jobs, use <IC>.invoke()</IC> (no streaming overhead). ⚡
        </Callout>

        <P>
          <strong>Q6: When should you use .ainvoke() vs .invoke()?</strong>
        </P>
        <Callout type="note">
          📌 Use <IC>.ainvoke()</IC> (async) when: (1) Your code is already async (FastAPI endpoint, async script). (2) You want to avoid blocking the event loop (FastAPI uses async workers — blocking <IC>.invoke()</IC> ties up a worker). Use <IC>.invoke()</IC> (sync) when: (1) Simple scripts, Jupyter notebooks (no async context). (2) You don&apos;t care about concurrency (one request at a time). Rule of thumb: <strong>If you see <IC>async def</IC> or <IC>await</IC> in your code, use <IC>.ainvoke()</IC></strong>. Otherwise, stick with <IC>.invoke()</IC>. Mixing sync/async causes deadlocks. 🎯
        </Callout>
      </Section>
    </TopicShell>
  );
}
