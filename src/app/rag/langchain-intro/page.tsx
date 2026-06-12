"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "First LangChain chain: prompt | llm | parser",
  nodes: [
    { id: "user", icon: "🙋", label: "User", sub: "question dict", x: 8, y: 50, color: "#22d3ee" },
    { id: "prompt", icon: "📋", label: "ChatPromptTemplate", sub: "fills {question}", x: 28, y: 50, color: "#a78bfa" },
    { id: "llm", icon: "🤖", label: "ChatOpenAI", sub: "gpt-4o-mini", x: 48, y: 50, color: "#fb923c" },
    { id: "parser", icon: "🔬", label: "StrOutputParser", sub: "AIMessage → str", x: 68, y: 50, color: "#fbbf24" },
    { id: "answer", icon: "💬", label: "Answer", sub: "plain string", x: 88, y: 50, color: "#34d399" },
    { id: "error", icon: "❌", label: "KeyError", sub: "missing variable", x: 48, y: 15, color: "#f87171" },
    { id: "swap", icon: "🔄", label: "New provider", sub: "one-line change", x: 68, y: 15, color: "#60a5fa" },
  ],
  edges: [
    { id: "user-prompt", from: "user", to: "prompt", color: "#22d3ee" },
    { id: "prompt-llm", from: "prompt", to: "llm", color: "#a78bfa" },
    { id: "llm-parser", from: "llm", to: "parser", color: "#fb923c" },
    { id: "parser-answer", from: "parser", to: "answer", color: "#fbbf24" },
    { id: "prompt-error", from: "prompt", to: "error", dashed: true, color: "#f87171" },
    { id: "llm-swap", from: "llm", to: "swap", dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Battery question through the pipe",
      command: 'chain.invoke({"question": "How long does the X1 battery last?"})',
      steps: [
        { node: "user", paths: ["user-prompt"], text: "Input: {'question': 'How long does the X1 battery last?'}. This is a plain Python dict — the question key will fill the prompt template." },
        { node: "prompt", paths: ["prompt-llm"], text: "ChatPromptTemplate.from_messages([('system', 'You are NimbusBot...'), ('human', '{question}')]). The {question} slot is replaced with the user's query → ChatPromptValue (list of messages)." },
        { node: "llm", paths: ["llm-parser"], text: "ChatOpenAI (gpt-4o-mini, temperature=0) receives the messages. API call to OpenAI → returns AIMessage(content='The Nimbus X1 battery lasts about 28 minutes on a full charge.'). Cost: ~$0.00003 (150 output tokens × $0.60/1M)." },
        { node: "parser", paths: ["parser-answer"], text: "StrOutputParser extracts AIMessage.content → plain string 'The Nimbus X1 battery lasts about 28 minutes on a full charge.' No more object wrappers — just the text." },
        { node: "answer", paths: [], text: "Final output: 'The Nimbus X1 battery lasts about 28 minutes on a full charge.' (str). Ready to display to the user or pass to the next stage of your pipeline. ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Missing prompt variable",
      command: 'chain.invoke({"query": "..."})',
      steps: [
        { node: "user", paths: ["user-prompt"], text: "Oops! Input: {'query': '...'}. The prompt expects a key named 'question', but you provided 'query'. Key mismatch!" },
        { node: "prompt", paths: ["prompt-error"], text: "ChatPromptTemplate tries to fill {question} from the input dict. KeyError: 'question' key not found in {'query': '...'}. The chain stops here — llm never runs." },
        { node: "error", paths: [], text: "KeyError: 'question'. Fix: change input dict to {'question': '...'} OR change template to use {query}. Template variable names MUST match input dict keys exactly. 🚨" },
      ],
    },
    {
      id: "power",
      name: "⚡ Swap the provider",
      command: "llm = ChatAnthropic(model='claude-3-5-sonnet-20241022', temperature=0)",
      steps: [
        { node: "user", paths: ["user-prompt"], text: "Same input: {'question': 'How long does the X1 battery last?'}. No change needed to the user-facing interface." },
        { node: "prompt", paths: ["prompt-llm"], text: "Same prompt template — still fills {question} → ChatPromptValue. Prompts are provider-agnostic." },
        { node: "swap", paths: ["llm-parser"], text: "Replace ChatOpenAI with ChatAnthropic (from langchain-anthropic). ONE line change: llm = ChatAnthropic(...). The rest of the chain (prompt | llm | parser) is UNCHANGED. LangChain abstracts the provider." },
        { node: "parser", paths: ["parser-answer"], text: "Claude returns AIMessage (same structure as OpenAI). StrOutputParser works identically — extracts .content → string. Provider swap complete with zero downstream changes!" },
        { node: "answer", paths: [], text: "Final output: 'The X1 battery lasts approximately 28 minutes.' (Claude's phrasing). Same question, different model, same pipeline. This is the power of LangChain — composable, swappable building blocks. 🔗" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why LangChain Exists" },
  { id: "install", label: "Install & Setup" },
  { id: "chatopenai", label: "ChatOpenAI ⭐" },
  { id: "messages", label: "Messages as Objects" },
  { id: "template", label: "ChatPromptTemplate ⭐" },
  { id: "rag-prompt", label: "The RAG Prompt Shape" },
  { id: "parser", label: "StrOutputParser" },
  { id: "first-chain", label: "Your First Chain ⭐" },
  { id: "visual", label: "Visual Flow" },
  { id: "runnable", label: "Everything is a Runnable" },
  { id: "structured", label: "Structured Output" },
  { id: "debugging", label: "Debugging" },
  { id: "lab", label: "Lab Exercise" },
  { id: "memorize", label: "🧠 Memorize This" },
  { id: "interview", label: "Interview Questions" },
];

export default function LangChainIntroPage() {
  return (
    <TopicShell
      icon="🦜"
      title="LangChain Core — Models, Prompts, Parsers"
      gradientWord="LangChain"
      subtitle="LangChain is the toolkit that turns raw LLM API calls into composable building blocks for NimbusBot. You'll go from glue-heavy OpenAI SDK code to elegant chains: prompt | llm | parser. Models, messages, templates, parsers, and the pipe syntax that powers every RAG pipeline."
      nav={NAV}
      badges={["🦜 LangChain 0.3", "🤖 ChatOpenAI", "📋 Prompt templates", "🔬 Output parsers", "🔗 The pipe | syntax"]}
      next={{ icon: "🔗", label: "LCEL — Chains with the Pipe", href: "/rag/lcel" }}
      backHref="/rag"
      backLabel="🦜 RAG &amp; LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why LangChain Exists">
        <P>
          You&apos;ve called the OpenAI SDK directly — <IC>client.chat.completions.create(...)</IC>. It works, but it&apos;s <strong>glue-heavy</strong>: you build message lists manually, parse responses with <IC>.content</IC>, and swap providers (OpenAI → Anthropic) by rewriting everything. LangChain fixes this with <strong>composable abstractions</strong>.
        </P>
        <CodeBlock
          title="raw_sdk.py (the old way)"
          code={`from openai import OpenAI

client = OpenAI()

# Manually build message list
messages = [
    {"role": "system", "content": "You are NimbusBot, a support chatbot for Nimbus Gear drones."},
    {"role": "user", "content": "How long does the X1 battery last?"}
]

# API call
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    temperature=0
)

# Manually parse
answer = response.choices[0].message.content
print(answer)  # "The Nimbus X1 battery lasts about 28 minutes..."`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>Problems with raw SDK code:</strong>
        </P>
        <Table
          head={["Problem", "Example pain"]}
          rows={[
            ["Manual message construction", <>You write <IC>[{`{"role": "system", "content": "..."}, {"role": "user", "content": "..."}`}]</IC> every time. Typo? Silent failure.</>],
            ["No prompt reuse", "Copy-paste the system prompt across 5 scripts. Change it? Edit 5 files."],
            ["Provider lock-in", "Switch to Anthropic Claude? Rewrite: client.messages.create(...), different message format, different response parsing. 50+ lines changed."],
            ["No composition", "You can't chain: retriever → prompt → llm → parser. You write imperative code: step1(); step2(); step3(). Hard to test, hard to swap components."],
            ["Parsing boilerplate", <>Every response: <IC>response.choices[0].message.content</IC>. Structured output? Write your own JSON parsing + error handling.</>],
          ]}
        />
        <Callout type="analogy">
          🧱 <strong>Lego analogy</strong>: Raw SDK is like building with raw plastic — you CAN build anything, but you spend hours shaping each brick. LangChain gives you pre-made bricks (ChatOpenAI, ChatPromptTemplate, StrOutputParser) that snap together with the <IC>|</IC> pipe. Want a different color brick (Anthropic)? Swap it. The rest of the tower stays intact.
        </Callout>
        <P>
          <strong>What LangChain provides:</strong>
        </P>
        <Table
          head={["Component", "What it does", "Benefit"]}
          rows={[
            [<IC>ChatOpenAI</IC>, "Wrapper around OpenAI SDK with .invoke() interface", "Consistent API across all providers (Anthropic, Cohere, HuggingFace, etc.)"],
            [<IC>ChatPromptTemplate</IC>, <>Reusable templates with variables like <IC>{`{question}`}</IC></>, "No more manual message list construction. DRY (Don't Repeat Yourself)."],
            [<IC>StrOutputParser</IC>, <>Extracts <IC>.content</IC> from AIMessage → plain string</>, "No boilerplate. One line: parser = StrOutputParser()."],
            [<><IC>|</IC> pipe operator</>, <>Chain components: <IC>prompt | llm | parser</IC></>, "Declarative composition. Test each component in isolation, swap providers with one line."],
            [<IC>.invoke()</IC>, "Uniform method to run any Runnable (prompt/llm/parser/chain)", "Everything has .invoke, .batch, .stream for free. No learning new APIs per component."],
          ]}
        />
        <P>
          <strong>Same task, LangChain style:</strong>
        </P>
        <CodeBlock
          title="langchain_style.py (peek ahead — you'll build this by section 08)"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. Template (reusable)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot, a support chatbot for Nimbus Gear drones."),
    ("human", "{question}")
])

# 2. Model (swappable)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 3. Parser (extracts string)
parser = StrOutputParser()

# 4. Chain (declarative composition)
chain = prompt | llm | parser

# 5. Invoke
answer = chain.invoke({"question": "How long does the X1 battery last?"})
print(answer)`}
          output={`The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          6 lines of logic (vs 15 in raw SDK). Swap provider? One line: <IC>llm = ChatAnthropic(...)</IC>. The prompt and parser are untouched. This is why LangChain exists. 🚀
        </P>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install & Setup">
        <CodeBlock
          title="terminal"
          code={`pip install langchain langchain-openai`}
        />
        <P>
          Two packages:
        </P>
        <Table
          head={["Package", "What it contains"]}
          rows={[
            [<IC>langchain</IC>, "Core abstractions: chains, prompts, parsers, document loaders, splitters. No LLM integrations (those are separate)."],
            [<IC>langchain-openai</IC>, <>OpenAI-specific integrations: <IC>ChatOpenAI</IC>, <IC>OpenAIEmbeddings</IC>. Depends on the <IC>openai</IC> SDK under the hood.</>],
          ]}
        />
        <P>
          You also need your OpenAI API key in the environment:
        </P>
        <CodeBlock
          title="terminal (bash/zsh)"
          code={`export OPENAI_API_KEY="sk-proj-..."`}
        />
        <CodeBlock
          title="verify_install.py"
          code={`import langchain
from langchain_openai import ChatOpenAI

print("LangChain version:", langchain.__version__)
print("ChatOpenAI imported successfully!")

# Quick test
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
print("✅ LangChain + OpenAI ready")`}
          output={`LangChain version: 0.3.15
ChatOpenAI imported successfully!
✅ LangChain + OpenAI ready`}
        />
        <Callout type="note">
          📌 <strong>Version note</strong>: This course uses LangChain 0.3.x (latest as of early 2025). If you see <IC>langchain.llms.OpenAI</IC> or <IC>LLMChain</IC> in old tutorials, that&apos;s legacy (0.1.x, deprecated). Modern LangChain uses <IC>langchain-openai</IC> and LCEL (LangChain Expression Language — the pipe syntax). Always check the official docs for 0.3+ APIs.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="chatopenai" number="03" title="ChatOpenAI ⭐">
        <P>
          <IC>ChatOpenAI</IC> is the LangChain wrapper around OpenAI&apos;s chat models (gpt-4o, gpt-4o-mini, etc.). It has a uniform <IC>.invoke()</IC> interface (same for Anthropic, Cohere, Gemini — provider-agnostic code).
        </P>
        <CodeBlock
          title="chatopenai_basic.py"
          code={`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",  # Model name (gpt-4o, gpt-4o-mini, gpt-3.5-turbo, etc.)
    temperature=0          # 0 = deterministic, 1 = creative
)

# Invoke with a plain string (simple prompt)
response = llm.invoke("What is the capital of France?")

print(type(response))     # <class 'langchain_core.messages.ai.AIMessage'>
print(response.content)   # Paris`}
          output={`<class 'langchain_core.messages.ai.AIMessage'>
Paris`}
        />
        <P>
          <strong>Key observations:</strong>
        </P>
        <CodeBlock
          title="breakdown.txt"
          runnable={false}
          code={`llm.invoke("What is the capital of France?")
  → LangChain converts the string to: [HumanMessage(content="...")]
  → Calls OpenAI SDK: client.chat.completions.create(...)
  → Returns: AIMessage(content="Paris", response_metadata={...})

AIMessage is NOT a string — it's an object with:
  .content       → "Paris" (the text you want)
  .response_metadata → dict with token counts, model, finish_reason, etc.
  .id, .usage_metadata, etc.

To get the plain string, access .content OR use StrOutputParser (next section).`}
        />
        <Callout type="tip">
          💡 <strong>temperature=0 for RAG</strong>. NimbusBot answers factual questions (battery life, warranty terms). You want deterministic, grounded answers — not creative hallucinations. <IC>temperature=0</IC> means the model picks the highest-probability token every time (same input → same output). For creative tasks (storytelling, brainstorming), use <IC>temperature=0.7-1.0</IC>. For RAG, stick with 0. 🎯
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="messages" number="04" title="Messages as Objects">
        <P>
          Chat models (GPT, Claude) expect a <strong>list of messages</strong>, each with a role (system/user/assistant). LangChain represents these as <IC>SystemMessage</IC>, <IC>HumanMessage</IC>, <IC>AIMessage</IC> objects.
        </P>
        <CodeBlock
          title="messages.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Multi-message conversation
messages = [
    SystemMessage(content="You are NimbusBot, a support chatbot for Nimbus Gear drones."),
    HumanMessage(content="How long does the X1 battery last?")
]

response = llm.invoke(messages)

print(f"Type: {type(response)}")
print(f"Content: {response.content}")`}
          output={`Type: <class 'langchain_core.messages.ai.AIMessage'>
Content: The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>Message types:</strong>
        </P>
        <Table
          head={["Class", "OpenAI role", "Who writes it", "Example use"]}
          rows={[
            [<IC>SystemMessage</IC>, <IC>&quot;system&quot;</IC>, "You (the developer)", <>Set behavior: <IC>&quot;You are a helpful assistant&quot;</IC></>],
            [<IC>HumanMessage</IC>, <IC>&quot;user&quot;</IC>, "The end-user (customer)", <>User&apos;s question: <IC>&quot;How long does the battery last?&quot;</IC></>],
            [<IC>AIMessage</IC>, <IC>&quot;assistant&quot;</IC>, "The LLM (returned by .invoke)", <>LLM&apos;s answer: <IC>&quot;About 28 minutes&quot;</IC></>],
          ]}
        />
        <P>
          You construct <IC>SystemMessage</IC> and <IC>HumanMessage</IC>. The LLM returns <IC>AIMessage</IC>. In a multi-turn conversation, you append the <IC>AIMessage</IC> to the message list and add the next <IC>HumanMessage</IC> — but for RAG (single-shot Q&amp;A), we stick with system + human (no conversation state).
        </P>
        <Callout type="note">
          📌 <strong>Why not plain dicts?</strong> You CAN use <IC>[{`{"role": "system", "content": "..."}`}]</IC> (LangChain converts them internally), but Message objects have type safety, autocomplete, and metadata fields. Templates (next section) use tuples <IC>(&quot;system&quot;, &quot;...&quot;)</IC> — LangChain converts them to Message objects under the hood. Stick with the high-level API (ChatPromptTemplate) — no need to construct Message objects manually.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="template" number="05" title="ChatPromptTemplate ⭐">
        <P>
          <IC>ChatPromptTemplate</IC> is a reusable prompt with <strong>variables</strong> (placeholders like <IC>{`{question}`}</IC>). You define the template once, fill it many times. No more copy-paste prompts across scripts.
        </P>
        <CodeBlock
          title="template_basic.py"
          code={`from langchain_core.prompts import ChatPromptTemplate

# Define template with {question} variable
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot, a support chatbot for Nimbus Gear drones."),
    ("human", "{question}")
])

# Fill the template (invoke with a dict)
filled = prompt.invoke({"question": "How long does the X1 battery last?"})

print(type(filled))        # <class 'langchain_core.prompt_values.ChatPromptValue'>
print(filled.to_messages())  # [SystemMessage(...), HumanMessage(content="How long...")]`}
          output={`<class 'langchain_core.prompt_values.ChatPromptValue'>
[SystemMessage(content='You are NimbusBot, a support chatbot for Nimbus Gear drones.'), HumanMessage(content='How long does the X1 battery last?')]`}
        />
        <P>
          <strong>Anatomy of from_messages:</strong>
        </P>
        <CodeBlock
          title="template_explained.txt"
          runnable={false}
          code={`ChatPromptTemplate.from_messages([
    ("system", "..."),    → SystemMessage(content="...")
    ("human", "{var}")    → HumanMessage(content=input["var"])
])

Tuple format: (role, content_template)
  role: "system" | "human" | "ai"
  content_template: string with {variables} in curly braces

When you call prompt.invoke({"question": "..."}):
  1. LangChain replaces {question} with the value from the dict
  2. Returns ChatPromptValue (wrapper around [SystemMessage, HumanMessage])
  3. When piped to ChatOpenAI, it auto-converts to the list of messages

────────────────────────────────────────────────────────────────
MULTIPLE VARIABLES:

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are {persona}."),
    ("human", "{question}")
])

prompt.invoke({"persona": "NimbusBot", "question": "Battery life?"})
  → [SystemMessage(content="You are NimbusBot."), HumanMessage(content="Battery life?")]

────────────────────────────────────────────────────────────────
WHY TEMPLATES BEAT f-STRINGS:

BAD (f-string):
  question = "How long..."
  msg = f"User asks: {question}"  # Hardcoded, not reusable

GOOD (template):
  template = ChatPromptTemplate.from_messages([("human", "{question}")])
  template.invoke({"question": "How long..."})  # Reusable, testable, swappable`}
        />
        <Callout type="behind">
          ⚙️ <strong>Behind the scenes</strong>: <IC>ChatPromptTemplate.invoke()</IC> uses Python&apos;s <IC>str.format()</IC> under the hood — <IC>&quot;{`{question}`}&quot;.format(question=&quot;...&quot;)</IC>. The template is just a string formatter. But by wrapping it in a Runnable, LangChain gives you <IC>.invoke/.batch/.stream</IC> for free (same interface as models and parsers). This is the power of the Runnable abstraction — everything composes. 🔗
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="rag-prompt" number="06" title="The RAG Prompt Shape">
        <P>
          RAG prompts have <strong>two variables</strong>: <IC>{`{context}`}</IC> (retrieved chunks) and <IC>{`{question}`}</IC> (user query). This template shape is used in EVERY LangChain RAG tutorial. Memorize it.
        </P>
        <CodeBlock
          title="rag_prompt.py"
          code={`from langchain_core.prompts import ChatPromptTemplate

# The canonical RAG prompt (NimbusBot version)
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are NimbusBot, a support chatbot for Nimbus Gear drones.

Answer the question based ONLY on the following context. If the answer is not in the context, say "I don't have that information in the manual."

Context:
{context}"""),
    ("human", "{question}")
])

# Example: fill with battery context + question
context_text = """The Nimbus X1 battery lasts about 28 minutes on a full charge.
Range: up to 5 km in ideal conditions.
Weight: 795 grams including battery."""

filled = rag_prompt.invoke({
    "context": context_text,
    "question": "How long does the X1 battery last?"
})

print(filled.to_messages()[0].content)  # System message with filled context
print("---")
print(filled.to_messages()[1].content)  # Human message (question)`}
          output={`You are NimbusBot, a support chatbot for Nimbus Gear drones.

Answer the question based ONLY on the following context. If the answer is not in the context, say "I don't have that information in the manual."

Context:
The Nimbus X1 battery lasts about 28 minutes on a full charge.
Range: up to 5 km in ideal conditions.
Weight: 795 grams including battery.
---
How long does the X1 battery last?`}
        />
        <P>
          <strong>Key pattern:</strong> The system message contains the context (retrieved chunks) + instructions (&quot;Answer based ONLY on context&quot;). The human message is the raw question. This separation keeps the prompt clean. When you chain a retriever (next topic: LCEL), the retriever&apos;s output fills <IC>{`{context}`}</IC> automatically. 🔗
        </P>
      </Section>

      {/* 07 */}
      <Section id="parser" number="07" title="StrOutputParser">
        <P>
          <IC>llm.invoke()</IC> returns <IC>AIMessage</IC> (an object). Most of the time, you just want the <strong>string</strong>. <IC>StrOutputParser</IC> extracts <IC>.content</IC> for you.
        </P>
        <CodeBlock
          title="parser_demo.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
parser = StrOutputParser()

# Without parser
response = llm.invoke("What is 2+2?")
print(f"Without parser: {type(response)} → {response.content}")

# With parser (manual)
parsed = parser.invoke(response)
print(f"With parser: {type(parsed)} → {parsed}")`}
          output={`Without parser: <class 'langchain_core.messages.ai.AIMessage'> → 2+2 equals 4.
With parser: <class 'str'> → 2+2 equals 4.`}
        />
        <P>
          <strong>Why chains need parsers:</strong>
        </P>
        <CodeBlock
          title="why_parser.txt"
          runnable={false}
          code={`chain = prompt | llm
result = chain.invoke({"question": "..."})
print(result)  # AIMessage(content="...", response_metadata={...})

Problem: AIMessage is an object. You can't:
  - Print it cleanly to the user (they see AIMessage(...) gibberish)
  - Pass it to a downstream component expecting a string
  - Write it to a file (need .content everywhere)

Solution: Add StrOutputParser
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"question": "..."})
print(result)  # "The Nimbus X1 battery lasts..." (clean string) ✅

────────────────────────────────────────────────────────────────
OTHER PARSERS (quick preview):

StrOutputParser()        → AIMessage → str (most common)
JsonOutputParser()       → AIMessage → parsed dict (if LLM returns JSON)
PydanticOutputParser()   → AIMessage → Pydantic model (structured output)
CommaSeparatedListOutputParser() → "a,b,c" → ["a", "b", "c"]

For NimbusBot Q&A, StrOutputParser is all you need. We'll see structured output next. 🎯`}
        />
      </Section>

      {/* 08 */}
      <Section id="first-chain" number="08" title="Your First Chain ⭐">
        <P>
          Now we combine everything: <IC>prompt | llm | StrOutputParser()</IC>. The <IC>|</IC> pipe operator chains Runnables. Input flows left to right. This is <strong>LCEL</strong> (LangChain Expression Language) — the heart of modern LangChain.
        </P>
        <CodeBlock
          title="first_chain.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. Prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot, a support chatbot for Nimbus Gear drones."),
    ("human", "{question}")
])

# 2. LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 3. Parser
parser = StrOutputParser()

# 4. Chain (the magic ✨)
chain = prompt | llm | parser

# 5. Invoke (input dict → string output)
answer = chain.invoke({"question": "How long does the X1 battery last?"})

print(f"Type: {type(answer)}")
print(f"Answer: {answer}")`}
          output={`Type: <class 'str'>
Answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          <strong>What just happened?</strong>
        </P>
        <CodeBlock
          title="chain_breakdown.txt"
          runnable={false}
          code={`chain.invoke({"question": "How long does the X1 battery last?"})

STEP 1: prompt receives {"question": "..."}
  → Fills the template: [SystemMessage(...), HumanMessage(content="How long...")]
  → Returns ChatPromptValue

STEP 2: llm receives ChatPromptValue
  → Converts to OpenAI message list, sends API request
  → Returns AIMessage(content="The Nimbus X1 battery lasts about 28 minutes...")

STEP 3: parser receives AIMessage
  → Extracts .content → "The Nimbus X1 battery lasts about 28 minutes..."
  → Returns plain string

FINAL RESULT: "The Nimbus X1 battery lasts about 28 minutes..." (str) ✅

────────────────────────────────────────────────────────────────
THE PIPE | OPERATOR:

prompt | llm | parser

IS EQUIVALENT TO:

parser.invoke(llm.invoke(prompt.invoke({"question": "..."})))

The pipe makes it readable (left-to-right flow) instead of nested hell. 🔗`}
        />
        <Callout type="tip">
          💡 <strong>This pipe is LCEL</strong>. You&apos;ll see it EVERYWHERE in LangChain: <IC>retriever | prompt | llm | parser</IC>, <IC>dict | parallel | join | llm</IC>, etc. The next page (LCEL) dives deep into composition, parallel execution, branching, retries, streaming. For now, remember: <IC>|</IC> chains Runnables, flows left to right, gives you <IC>.invoke/.batch/.stream</IC> for free. 🚀
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="visual" number="09" title="Visual Flow">
        <P>
          The AnimatedFlow diagram at the top shows the happy path (battery question → 28 minutes answer), the failure path (missing prompt variable → KeyError), and the power move (swap providers with one line). Scroll back up and click through the 3 scenarios to see the data flow.
        </P>
        <P>
          <strong>Key takeaways from the diagram:</strong>
        </P>
        <Table
          head={["Scenario", "What you learn"]}
          rows={[
            [<>✅ <strong>Happy path</strong></>, "Input dict → template fills → LLM call → parser extracts → clean string output. This is the 99% case for RAG Q&A."],
            [<>❌ <strong>Missing variable</strong></>, <>If your input dict keys don&apos;t match the template variables (<IC>{`{question}`}</IC> vs <IC>{`{query}`}</IC>), you get a KeyError at the prompt stage. The LLM never runs. Fix: match the keys or change the template.</>],
            [<>⚡ <strong>Provider swap</strong></>, <>Change <IC>ChatOpenAI</IC> to <IC>ChatAnthropic</IC> (one line). The rest of the chain is untouched. This is the killer feature — write once, swap providers anytime. No vendor lock-in. 🔗</>],
          ]}
        />
      </Section>

      {/* 10 */}
      <Section id="runnable" number="10" title="Everything is a Runnable">
        <P>
          In LangChain, prompts, models, parsers, chains — <strong>everything</strong> is a <IC>Runnable</IC>. A Runnable is any object with <IC>.invoke()</IC>, <IC>.batch()</IC>, <IC>.stream()</IC> methods. This is the abstraction that powers composition.
        </P>
        <Table
          head={["Component", "Input type", "Output type"]}
          rows={[
            [<IC>ChatPromptTemplate</IC>, <><IC>dict</IC> (e.g., <IC>{`{"question": "..."}`}</IC>)</>, <><IC>ChatPromptValue</IC> (list of messages)</>],
            [<IC>ChatOpenAI</IC>, <><IC>ChatPromptValue</IC> or <IC>list[Message]</IC> or <IC>str</IC></>, <IC>AIMessage</IC>],
            [<IC>StrOutputParser</IC>, <IC>AIMessage</IC>, <IC>str</IC>],
          ]}
        />
        <P>
          Because all three implement the Runnable interface, you can pipe them: <IC>prompt | llm | parser</IC>. The output of each stage becomes the input to the next. LangChain handles type conversion (e.g., <IC>ChatPromptValue</IC> → message list for the LLM).
        </P>
        <CodeBlock
          title="runnable_methods.py"
          code={`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("human", "{question}")])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
parser = StrOutputParser()

chain = prompt | llm | parser

# .invoke (single input)
result = chain.invoke({"question": "What is 2+2?"})
print(f"invoke: {result}")

# .batch (multiple inputs, parallel execution)
results = chain.batch([
    {"question": "What is 2+2?"},
    {"question": "What is 10-3?"}
])
print(f"batch: {results}")`}
          output={`invoke: 2+2 equals 4.
batch: ['2+2 equals 4.', '10-3 equals 7.']`}
        />
        <P>
          <IC>.batch()</IC> runs the chain on multiple inputs in parallel (under the hood, LangChain uses async). This is 2-3× faster than looping. We&apos;ll explore <IC>.stream()</IC> (token-by-token output) in the LCEL topic. 🚀
        </P>
      </Section>

      {/* 11 */}
      <Section id="structured" number="11" title="Structured Output">
        <P>
          Sometimes you want the LLM to return <strong>structured data</strong> (not free text) — like a Pydantic model with fields. Use <IC>llm.with_structured_output(MyModel)</IC>. Perfect for triaging support tickets, extracting entities, etc.
        </P>
        <CodeBlock
          title="structured_output.py"
          code={`from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

# Define the output schema
class TicketTriage(BaseModel):
    category: str = Field(description="Category: battery | firmware | warranty | crash | other")
    urgency: int = Field(description="Urgency level 1-5 (1=low, 5=critical)")
    summary: str = Field(description="One-sentence summary of the issue")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Bind the schema to the LLM
structured_llm = llm.with_structured_output(TicketTriage)

# Invoke with a support ticket
ticket_text = "My X1 won't turn on after charging all night. The LED doesn't light up at all."

result = structured_llm.invoke(ticket_text)

print(f"Type: {type(result)}")
print(f"Category: {result.category}")
print(f"Urgency: {result.urgency}")
print(f"Summary: {result.summary}")`}
          output={`Type: <class '__main__.TicketTriage'>
Category: battery
Urgency: 4
Summary: Customer reports X1 not powering on after charging with no LED response.`}
        />
        <P>
          <strong>How it works:</strong> LangChain instructs the LLM to return JSON matching your Pydantic schema. It validates the response and parses it into a Python object. No manual JSON wrangling. Use cases: form filling, data extraction, routing (if urgency &gt; 3, escalate to human).
        </P>
        <Callout type="note">
          📌 <strong>Cost note</strong>: Structured output uses function calling under the hood (OpenAI&apos;s <IC>tools</IC> parameter). This adds ~50-100 tokens to the prompt (the schema definition). For simple cases (category + urgency), it&apos;s negligible. For complex schemas (20+ fields), consider prompt engineering instead (&quot;Return JSON: {`{category, urgency, summary}`}&quot;). 💰
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="debugging" number="12" title="Debugging">
        <P>
          LangChain has a debug mode that prints the full prompt sent to the LLM. Use it when the output is unexpected — you might have a typo in the template or missing context.
        </P>
        <CodeBlock
          title="debug_mode.py"
          code={`from langchain.globals import set_debug
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Enable debug mode (prints all intermediate steps)
set_debug(True)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are NimbusBot."),
    ("human", "{question}")
])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = prompt | llm | StrOutputParser()

answer = chain.invoke({"question": "Battery life?"})
print(f"\\nFinal answer: {answer}")`}
          output={`[chain/start] [1:chain:RunnableSequence] Entering Chain run with input:
{
  "question": "Battery life?"
}
[chain/start] [1:chain:RunnableSequence > 2:prompt:ChatPromptTemplate] Entering Prompt run with input:
{
  "question": "Battery life?"
}
[chain/end] [1:chain:RunnableSequence > 2:prompt:ChatPromptTemplate] [0ms] Exiting Prompt run with output:
{
  "lc": 1,
  "type": "constructor",
  "id": ["langchain", "prompts", "chat", "ChatPromptValue"],
  "kwargs": {"messages": [{"lc": 1, "type": "constructor", ...}]}
}
[llm/start] [1:chain:RunnableSequence > 3:llm:ChatOpenAI] Entering LLM run with input:
{
  "prompts": ["System: You are NimbusBot.\\nHuman: Battery life?"]
}
[llm/end] [1:chain:RunnableSequence > 3:llm:ChatOpenAI] [812ms] Exiting LLM run with output:
{
  "generations": [[{"text": "The Nimbus X1 battery lasts about 28 minutes...", ...}]]
}
[parser/start] [1:chain:RunnableSequence > 4:parser:StrOutputParser] Entering Parser run with input:
{
  "input": "..."
}
[parser/end] [1:chain:RunnableSequence > 4:parser:StrOutputParser] [0ms] Exiting Parser run with output:
{
  "output": "The Nimbus X1 battery lasts about 28 minutes on a full charge."
}

Final answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.`}
        />
        <P>
          You see the exact messages sent to the LLM (<IC>&quot;System: You are NimbusBot.\nHuman: Battery life?&quot;</IC>). If the output is wrong, check: (1) Is the context included? (2) Are variables filled correctly? (3) Is the system prompt clear?
        </P>
        <P>
          <strong>Common import mistakes:</strong>
        </P>
        <Table
          head={["Wrong import", "Correct import", "Why it matters"]}
          rows={[
            [<><IC>from langchain import ChatOpenAI</IC> ❌</>, <><IC>from langchain_openai import ChatOpenAI</IC> ✅</>, "ChatOpenAI lives in langchain-openai (separate package). Importing from langchain fails."],
            [<><IC>from langchain.prompts import ChatPromptTemplate</IC> ⚠️</>, <><IC>from langchain_core.prompts import ChatPromptTemplate</IC> ✅</>, "Both work (langchain re-exports from langchain_core), but langchain_core is the canonical source. Prefer _core."],
            [<><IC>from langchain.output_parsers import StrOutputParser</IC> ⚠️</>, <><IC>from langchain_core.output_parsers import StrOutputParser</IC> ✅</>, "Same as above. langchain_core.output_parsers is the source."],
          ]}
        />
        <Callout type="mistake">
          ⚠️ <strong>Mistake</strong>: Using old LangChain 0.1.x APIs like <IC>LLMChain</IC>, <IC>from langchain.llms import OpenAI</IC>. These are deprecated. Modern LangChain (0.3+) uses <IC>langchain_openai.ChatOpenAI</IC> and LCEL (the pipe). If you copy code from a 2023 tutorial, it might not work. Always check the version and use official 0.3 docs. 📖
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="lab" number="13" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a NimbusBot persona chain end-to-end
══════════════════════════════════════════════════════════════════

TASK 1: Create a ChatPromptTemplate for NimbusBot
  System message: "You are NimbusBot, a helpful support chatbot for Nimbus Gear drones. Answer customer questions clearly and concisely based on your knowledge of the Nimbus X1."
  Human message: "{question}" (variable)

  Code:
    from langchain_core.prompts import ChatPromptTemplate

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are NimbusBot, a helpful support chatbot for Nimbus Gear drones. Answer customer questions clearly and concisely based on your knowledge of the Nimbus X1."),
        ("human", "{question}")
    ])

  Test: prompt.invoke({"question": "test"}) → should return ChatPromptValue

TASK 2: Create ChatOpenAI with gpt-4o-mini, temperature=0
  Code:
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

  Test: llm.invoke("Hi") → should return AIMessage

TASK 3: Create StrOutputParser
  Code:
    from langchain_core.output_parsers import StrOutputParser

    parser = StrOutputParser()

TASK 4: Chain them with the pipe operator
  Code:
    chain = prompt | llm | parser

TASK 5: Test with 3 NimbusBot questions (verify outputs match facts)
  Code:
    # Question 1: Battery
    answer1 = chain.invoke({"question": "How long does the X1 battery last?"})
    print(f"Q1: {answer1}")
    # Expected: mentions "28 minutes"

    # Question 2: Range
    answer2 = chain.invoke({"question": "What is the range of the X1?"})
    print(f"Q2: {answer2}")
    # Expected: mentions "5 km" or "5 kilometers"

    # Question 3: Warranty
    answer3 = chain.invoke({"question": "What is the warranty period?"})
    print(f"Q3: {answer3}")
    # Expected: mentions "12 months" or "1 year"

  Verify: All 3 answers are consistent with NimbusBot facts (28 min, 5 km, 12 months).
           Type of each answer is <class 'str'> (not AIMessage).

TASK 6: Enable debug mode and observe the full prompt
  Code:
    from langchain.globals import set_debug
    set_debug(True)

    answer = chain.invoke({"question": "Battery life?"})

  Observation: You see the exact messages sent to OpenAI. System + Human messages printed.

TASK 7: Break it (learn from errors)
  - Invoke with wrong key: chain.invoke({"query": "..."}) → KeyError 'question'
  - Remove parser: chain2 = prompt | llm; result = chain2.invoke(...) → AIMessage (not str)
  - Typo in template: "{queston}" instead of "{question}" → unfilled variable

──────────────────────────────────────────────────────────────────
BONUS: Build a RAG-style prompt with {context} and {question}
  prompt_rag = ChatPromptTemplate.from_messages([
      ("system", "Answer based ONLY on context:\\n{context}"),
      ("human", "{question}")
  ])

  chain_rag = prompt_rag | llm | parser

  context = "The X1 weighs 795 grams."
  answer = chain_rag.invoke({"context": context, "question": "How heavy is the X1?"})
  print(answer)  # Should mention "795 grams"

  Try with unrelated context:
  context2 = "The X1 has a camera."
  answer2 = chain_rag.invoke({"context": context2, "question": "Battery life?"})
  print(answer2)  # Should say "I don't have that information" (context doesn't mention battery)`}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Install", "pip install langchain langchain-openai"],
            ["ChatOpenAI", "from langchain_openai import ChatOpenAI; llm = ChatOpenAI(model='gpt-4o-mini', temperature=0)"],
            ["Invoke LLM", "response = llm.invoke('question') → AIMessage; response.content → str"],
            ["ChatPromptTemplate", "from langchain_core.prompts import ChatPromptTemplate; prompt = ChatPromptTemplate.from_messages([('system', '...'), ('human', '{question}')])"],
            ["Fill template", "prompt.invoke({'question': '...'}) → ChatPromptValue"],
            ["StrOutputParser", "from langchain_core.output_parsers import StrOutputParser; parser = StrOutputParser()"],
            ["The pipe |", "chain = prompt | llm | parser; answer = chain.invoke({'question': '...'}) → str"],
            ["RAG prompt shape", "{context} in system message, {question} in human message"],
            ["temperature=0", "Deterministic output (same input → same output). Use for RAG, not creative tasks."],
            ["Debug mode", "from langchain.globals import set_debug; set_debug(True) → prints full prompt"],
            ["with_structured_output", "llm.with_structured_output(PydanticModel) → returns parsed Pydantic object"],
            ["Runnable interface", "All components have .invoke(), .batch(), .stream() — uniform API"],
          ]}
        />
      </Section>

      {/* 15 */}
      <Section id="interview" number="15" title="Interview Questions">
        <P>
          <strong>Q1: Why use LangChain instead of calling the OpenAI SDK directly?</strong>
        </P>
        <Callout type="note">
          📌 LangChain provides composable abstractions (ChatOpenAI, ChatPromptTemplate, StrOutputParser) that work across providers (OpenAI, Anthropic, Cohere). You write <IC>prompt | llm | parser</IC> once, swap providers with one line. The raw SDK is glue-heavy: manual message construction, provider-specific parsing, no reusable templates. LangChain gives you the pipe operator (LCEL), uniform <IC>.invoke/.batch/.stream</IC> interface, and integrations (vector stores, document loaders, etc.). For RAG pipelines, LangChain is the industry standard.
        </Callout>

        <P>
          <strong>Q2: What does <IC>prompt | llm | StrOutputParser()</IC> return at each stage?</strong>
        </P>
        <Callout type="note">
          📌 <IC>prompt.invoke({`{"question": "..."}`})</IC> → <IC>ChatPromptValue</IC> (list of messages). <IC>llm.invoke(ChatPromptValue)</IC> → <IC>AIMessage</IC> (object with <IC>.content</IC>). <IC>StrOutputParser().invoke(AIMessage)</IC> → <IC>str</IC> (plain text). The final chain output is a string. Each component transforms the data: dict → messages → AIMessage → string. This is the standard RAG chain output type. 🔗
        </Callout>

        <P>
          <strong>Q3: What&apos;s the difference between AIMessage and a plain string?</strong>
        </P>
        <Callout type="note">
          📌 <IC>AIMessage</IC> is a LangChain object with <IC>.content</IC> (the text), <IC>.response_metadata</IC> (token counts, model, finish reason), <IC>.id</IC>, <IC>.usage_metadata</IC>, etc. A plain string is just the text. For display or downstream processing, you almost always want the string. That&apos;s why you add <IC>StrOutputParser()</IC> to chains. Without it, you get <IC>AIMessage(...)</IC> when you print — confusing to users. With it, you get clean text. ✅
        </Callout>

        <P>
          <strong>Q4: Why use ChatPromptTemplate instead of f-strings?</strong>
        </P>
        <Callout type="note">
          📌 f-strings are hardcoded (<IC>f&quot;User: {`{question}`}&quot;</IC> is not reusable). <IC>ChatPromptTemplate</IC> is a reusable object — you define it once, invoke it many times with different inputs. It integrates with LCEL (the pipe), supports multiple variables (<IC>{`{context}`}</IC>, <IC>{`{question}`}</IC>), and converts to the correct message format (SystemMessage, HumanMessage). Templates are testable (mock the input dict), swappable (change the template without touching the chain), and composable. f-strings are imperative; templates are declarative. LangChain best practice: always use templates. 🎯
        </Callout>

        <P>
          <strong>Q5: What are some use cases for structured output (<IC>with_structured_output</IC>)?</strong>
        </P>
        <Callout type="note">
          📌 Use structured output when you need the LLM to return typed data, not free text. Examples: (1) Triage support tickets → category, urgency, summary. (2) Extract entities from a document → product name, price, specs. (3) Route queries → determine intent (battery / warranty / firmware) and call the right handler. (4) Form filling → extract name, email, phone from unstructured text. (5) Data validation → ensure the LLM output matches a schema (no hallucinated fields). Under the hood, LangChain uses OpenAI function calling (adds ~50-100 tokens to the prompt). For simple cases, it&apos;s great. For complex schemas, consider prompt engineering instead. 💡
        </Callout>

        <P>
          <strong>Q6: How do you debug a LangChain chain when the output is wrong?</strong>
        </P>
        <Callout type="note">
          📌 (1) Enable debug mode: <IC>from langchain.globals import set_debug; set_debug(True)</IC> — this prints the exact prompt sent to the LLM. (2) Inspect intermediate steps: run <IC>prompt.invoke(...)</IC>, <IC>llm.invoke(...)</IC>, <IC>parser.invoke(...)</IC> separately to see where it breaks. (3) Check input dict keys match template variables (<IC>{`{question}`}</IC> vs <IC>{`{query}`}</IC>). (4) Verify the model name is correct (<IC>&quot;gpt-4o-mini&quot;</IC> not <IC>&quot;gpt-4-mini&quot;</IC>). (5) Check API key is set (<IC>echo $OPENAI_API_KEY</IC>). (6) Look at <IC>response_metadata</IC> for token counts, finish_reason (if <IC>finish_reason=&quot;length&quot;</IC>, you hit max_tokens). Debug mode is your best friend — always start there. 🔍
        </Callout>
      </Section>
    </TopicShell>
  );
}
