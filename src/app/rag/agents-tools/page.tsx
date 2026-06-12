"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Agent loop — LLM chooses which tools to call",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "question", x: 6, y: 50, color: "#22d3ee" },
    { id: "agent", icon: "🤖", label: "Agent LLM", sub: "gpt-4o-mini", x: 28, y: 50, color: "#a78bfa" },
    { id: "router", icon: "🔀", label: "Tool Router", sub: "parse tool_calls", x: 50, y: 50, color: "#fb923c" },
    { id: "search", icon: "📚", label: "search_docs", sub: "RAG retriever", x: 68, y: 14, color: "#34d399" },
    { id: "stock", icon: "📦", label: "check_stock", sub: "inventory", x: 68, y: 50, color: "#60a5fa" },
    { id: "return", icon: "📅", label: "days_left_for_return", sub: "date math", x: 68, y: 86, color: "#fbbf24" },
    { id: "observation", icon: "👁️", label: "Observation", sub: "tool results", x: 84, y: 50, color: "#f472b6" },
    { id: "answer", icon: "💬", label: "Final Answer", sub: "", x: 96, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "user-agent", from: "user", to: "agent", color: "#22d3ee" },
    { id: "agent-router", from: "agent", to: "router", color: "#a78bfa" },
    { id: "router-search", from: "router", to: "search", color: "#34d399" },
    { id: "router-stock", from: "router", to: "stock", color: "#60a5fa" },
    { id: "router-return", from: "router", to: "return", color: "#fbbf24" },
    { id: "search-obs", from: "search", to: "observation", color: "#34d399" },
    { id: "stock-obs", from: "stock", to: "observation", color: "#60a5fa" },
    { id: "return-obs", from: "return", to: "observation", color: "#fbbf24" },
    { id: "obs-agent", from: "observation", to: "agent", bend: -80, color: "#f472b6" },
    { id: "agent-answer", from: "agent", to: "answer", color: "#34d399" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Multi-tool reasoning",
      command: "Can I still return my X1? Bought May 20",
      steps: [
        { node: "user", paths: ["user-agent"], text: "User asks: 'Can I still return my X1? I bought it on May 20.' This requires TWO pieces of info: (1) How many days left? (2) What is the return policy?" },
        { node: "agent", paths: ["agent-router"], text: "Agent LLM thinks: 'I need to calculate days left AND search the docs for the return window.' It decides to call TWO tools: days_left_for_return(purchase_date='2026-05-20') and search_docs(query='return policy')." },
        { node: "router", paths: ["router-return", "router-search"], text: "Tool router parses the AIMessage.tool_calls list: [{'name': 'days_left_for_return', 'args': {'purchase_date': '2026-05-20'}}, {'name': 'search_docs', 'args': {'query': 'return policy'}}]. It executes both tools in parallel." },
        { node: "return", paths: ["return-obs"], text: "days_left_for_return tool: Calculates (2026-06-12) - (2026-05-20) = 23 days elapsed. Returns: '7 days left in the return window.' (30 - 23 = 7)" },
        { node: "search", paths: ["search-obs"], text: "search_docs tool: Wraps the RAG retriever. Embeds 'return policy' → Chroma returns: 'Returns accepted within 30 days of purchase with original packaging.' Passes this to the agent." },
        { node: "observation", paths: ["obs-agent"], text: "Agent receives BOTH observations: (1) '7 days left', (2) '30-day return policy'. Now it has all the info needed to answer the user's question." },
        { node: "agent", paths: ["agent-answer"], text: "Agent LLM synthesizes: 'Yes, you can still return your Nimbus X1. You bought it 23 days ago, and our return policy allows returns within 30 days. You have 7 days left.' Grounded in BOTH tools. ✅" },
        { node: "answer", paths: [], text: "User gets a complete, accurate answer. The agent autonomously chose which tools to call, executed them, and combined results. This is agentic RAG!" },
      ],
    },
    {
      id: "fail",
      name: "❌ Tool error → recovery",
      command: "Is the X9 battery in stock?",
      steps: [
        { node: "user", paths: ["user-agent"], text: "User asks: 'Is the X9 battery in stock?' (X9 doesn't exist — typo for X1, or a non-existent product.)" },
        { node: "agent", paths: ["agent-router"], text: "Agent decides to call check_stock(sku='X9-BAT-002'). It extracts 'X9' from the question and guesses the SKU format." },
        { node: "router", paths: ["router-stock"], text: "Tool router executes check_stock('X9-BAT-002')." },
        { node: "stock", paths: ["stock-obs"], text: "check_stock tool: Looks up SKU in inventory dict. KeyError: 'X9-BAT-002' not found. The tool RAISES an exception or returns: 'Error: SKU X9-BAT-002 not found in inventory.' 🚨" },
        { node: "observation", paths: ["obs-agent"], text: "The error is fed back to the agent as an observation: 'Tool error: SKU not found.' The agent sees this like any other tool result." },
        { node: "agent", paths: ["agent-answer"], text: "Agent LLM handles the error gracefully: 'I couldn't find SKU X9-BAT-002 in our inventory. Did you mean the Nimbus X1 battery (X1-BAT-002)? That one is in stock (7 units).' The agent RECOVERS from the error and suggests a correction. ✅" },
        { node: "answer", paths: [], text: "User gets a helpful response even though the tool failed. The agent loop is resilient — errors are observations, not crashes. This is why agents > rigid chains." },
      ],
    },
    {
      id: "power",
      name: "⚡ Multi-hop reasoning",
      command: "Is the battery in stock and warranty-covered?",
      steps: [
        { node: "user", paths: ["user-agent"], text: "User asks: 'Is the spare battery in stock, and is it covered by warranty?' Two independent sub-questions requiring different tools." },
        { node: "agent", paths: ["agent-router"], text: "Agent plans: (1) Check stock for battery SKU. (2) Search docs for battery warranty coverage. Calls: check_stock(sku='X1-BAT-002') and search_docs(query='battery warranty')." },
        { node: "router", paths: ["router-stock", "router-search"], text: "Router executes both tools in parallel (or sequentially — implementation detail)." },
        { node: "stock", paths: ["stock-obs"], text: "check_stock returns: 'X1-BAT-002: 7 units in stock.'" },
        { node: "search", paths: ["search-obs"], text: "search_docs retrieves: 'Replacement batteries are covered under the 12-month warranty if defective. Accidental damage not covered.'" },
        { node: "observation", paths: ["obs-agent"], text: "Agent receives both observations: stock status (7 units) + warranty info (covered if defective, 12 months)." },
        { node: "agent", paths: ["agent-answer"], text: "Agent synthesizes: 'Yes, the spare battery (X1-BAT-002) is in stock (7 units available). It is covered by the 12-month warranty if it's defective, but accidental damage is not covered.' Multi-hop reasoning complete! ⚡" },
        { node: "answer", paths: [], text: "The agent autonomously broke down a compound question, called the right tools, and merged the results. This is the power of agentic workflows — no hard-coded paths!" },
      ],
    },
  ],
};

const NAV = [
  { id: "chain-vs-agent", label: "Chain vs Agent ⭐" },
  { id: "tools", label: "Tools = Functions the Model Can Call" },
  { id: "tool-decorator", label: "@tool Decorator ⭐" },
  { id: "bind-tools", label: "bind_tools and tool_calls" },
  { id: "agent-loop", label: "The Agent Loop Drawn" },
  { id: "react-agent", label: "create_react_agent" },
  { id: "rag-as-tool", label: "RAG-as-a-Tool ⭐" },
  { id: "multi-rounds", label: "Multiple Rounds & Max Iterations" },
  { id: "when-not", label: "When NOT to Use Agents ⭐" },
  { id: "structured-args", label: "Structured Tool Args" },
  { id: "debugging", label: "Debugging & Common Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AgentsToolsPage() {
  return (
    <TopicShell
      icon="🤝"
      title="Agents & Tools — RAG That Takes Action"
      gradientWord="Agents"
      subtitle="when one retrieval isn&apos;t enough: the model decides what to call"
      nav={NAV}
      badges={["🤝 LLM agents", "🔧 Tool calling", "🔄 ReAct loop", "📚 RAG as tool", "🧠 Multi-hop reasoning"]}
      next={{ icon: "🚀", label: "Advanced RAG — Re-ranking & Eval", href: "/rag/advanced" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="chain-vs-agent" number="01" title="Chain vs Agent ⭐">
        <P>
          You&apos;ve built RAG chains: retrieve → stuff into prompt → LLM → answer. The steps are FIXED. You (the developer) decide the flow. But what if the user&apos;s question needs MORE than one retrieval? Or a database lookup? Or a calculation?
        </P>
        <Table
          head={["Pattern", "Who decides the steps?", "Example", "When to use"]}
          rows={[
            [<><strong>Chain</strong> (what you&apos;ve been building)</>, "You (the developer) hard-code the flow", <>retrieve → prompt → LLM. Always 1 retrieval. If the question needs 2 retrievals, you&apos;d write: retrieve A → retrieve B → combine → LLM. <strong>Train on rails.</strong></>, "Steps are known and fixed. Example: every support question needs exactly 1 RAG retrieval + answer."],
            [<><strong>Agent</strong> (the LLM decides)</>, "The LLM chooses which tools to call, in what order, possibly multiple rounds", <>LLM sees tools: search_docs, check_stock, calculate_days. User asks: <IC>&quot;Can I return my X1? Bought May 20&quot;</IC> → LLM calls days_left_for_return(May 20) → gets <IC>&quot;7 days left&quot;</IC> → calls search_docs(<IC>&quot;return policy&quot;</IC>) → gets <IC>&quot;30 days&quot;</IC> → synthesizes answer. <strong>Taxi driver: you say the destination, LLM picks the route.</strong></>, "Steps vary per question. Example: some questions need inventory lookup, some need docs search, some need both, some need neither."],
          ]}
        />
        <P>
          <strong>Chain example:</strong>
        </P>
        <CodeBlock
          title="chain_fixed_steps.py"
          code={`# You hard-code: ALWAYS retrieve, ALWAYS answer
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# This chain ALWAYS retrieves, even if the question is "What time is it?" (doesn't need docs)
# It can't decide "I'll skip retrieval for this one"`}
          runnable={false}
        />
        <P>
          <strong>Agent example:</strong>
        </P>
        <CodeBlock
          title="agent_dynamic_steps.py"
          code={`# You give the LLM TOOLS (functions it can call)
tools = [search_docs, check_stock, days_left_for_return]

# The LLM DECIDES: "For this question, I'll call check_stock. For that one, I'll call search_docs twice."
agent = create_react_agent(llm, tools)

# Same agent handles:
# "Is the battery in stock?" → calls check_stock
# "What's the return policy?" → calls search_docs
# "Can I return my X1? Bought May 20" → calls days_left_for_return THEN search_docs`}
          runnable={false}
        />
        <Callout type="analogy">
          🌍 <strong>Train vs taxi</strong>: A chain is a train — it follows fixed tracks (retrieve → answer). An agent is a taxi — you tell it the destination (<IC>&quot;answer my question&quot;</IC>), and the driver (LLM) picks the route (which tools to call, in what order). The taxi might take different routes for different destinations.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="tools" number="02" title="Tools = Functions the Model Can Call">
        <P>
          A <strong>tool</strong> is a Python function that the LLM can invoke. The LLM doesn&apos;t execute code — it returns a REQUEST to call the function. Your agent loop executes it and feeds the result back to the LLM.
        </P>
        <P>
          Example tools for NimbusBot (the support chatbot):
        </P>
        <Table
          head={["Tool name", "What it does", "Example call", "Example return"]}
          rows={[
            [<IC>search_docs</IC>, "Wraps the RAG retriever — searches the Nimbus manual chunks in Chroma", <><IC>search_docs(query=&quot;battery life&quot;)</IC></>, <><IC>&quot;The Nimbus X1 battery lasts 28 minutes.&quot;</IC> (retrieved context)</>],
            [<IC>check_stock</IC>, "Looks up inventory in a fake dict", <><IC>check_stock(sku=&quot;X1-BAT-002&quot;)</IC></>, <><IC>&quot;X1-BAT-002: 7 units in stock&quot;</IC></>],
            [<IC>days_left_for_return</IC>, "Calculates how many days left in the 30-day return window given a purchase date", <><IC>days_left_for_return(purchase_date=&quot;2026-05-20&quot;)</IC></>, <><IC>&quot;23 days elapsed, 7 days left&quot;</IC> (today is 2026-06-12)</>],
          ]}
        />
        <P>
          The LLM reads the <strong>tool descriptions</strong> (docstrings) and decides which to call. You don&apos;t hard-code <IC>&quot;if question mentions stock, call check_stock&quot;</IC> — the LLM figures that out.
        </P>
      </Section>

      {/* 03 */}
      <Section id="tool-decorator" number="03" title="@tool Decorator ⭐">
        <P>
          LangChain provides the <IC>@tool</IC> decorator to turn a Python function into a tool. The function&apos;s <strong>docstring</strong> becomes the description the LLM reads.
        </P>
        <CodeBlock
          title="define_tools.py"
          code={`from langchain_core.tools import tool
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from datetime import datetime, timedelta

# Tool 1: RAG retriever wrapped as a tool
@tool
def search_docs(query: str) -> str:
    """Search the Nimbus Gear product documentation for information about drones, batteries, warranty, returns, and firmware.
    Use this tool when the user asks about product specs, policies, or troubleshooting."""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = Chroma(persist_directory="./nimbus_db", embedding_function=embeddings)
    docs = vectorstore.similarity_search(query, k=3)
    # Combine top 3 chunks
    context = "\\n\\n".join([doc.page_content for doc in docs])
    return context

# Tool 2: Inventory lookup (fake data)
INVENTORY = {
    "X1-BAT-002": 7,
    "X1-PROP-004": 12,
    "X1-CASE-001": 3,
}

@tool
def check_stock(sku: str) -> str:
    """Check the current stock level for a Nimbus Gear product by SKU.
    Example SKUs: X1-BAT-002 (battery), X1-PROP-004 (propellers), X1-CASE-001 (carrying case)."""
    if sku in INVENTORY:
        return f"{sku}: {INVENTORY[sku]} units in stock"
    else:
        return f"Error: SKU {sku} not found in inventory"

# Tool 3: Return eligibility calculator
@tool
def days_left_for_return(purchase_date: str) -> str:
    """Calculate how many days are left in the 30-day return window.
    purchase_date format: YYYY-MM-DD (e.g., '2026-05-20').
    Returns how many days have elapsed and how many days remain."""
    purchase = datetime.fromisoformat(purchase_date)
    today = datetime(2026, 6, 12)  # Fixed "today" for this tutorial
    elapsed = (today - purchase).days
    remaining = 30 - elapsed
    if remaining > 0:
        return f"{elapsed} days elapsed, {remaining} days left in the return window"
    else:
        return f"Return window expired ({abs(remaining)} days past the 30-day limit)"

# List of all tools
tools = [search_docs, check_stock, days_left_for_return]

print("Tools registered:")
for t in tools:
    print(f"  - {t.name}: {t.description[:60]}...")`}
          output={`Tools registered:
  - search_docs: Search the Nimbus Gear product documentation for infor...
  - check_stock: Check the current stock level for a Nimbus Gear produc...
  - days_left_for_return: Calculate how many days are left in the 30-day return wi...`}
        />
        <P>
          <strong>Key points:</strong>
        </P>
        <CodeBlock
          title="tool_anatomy.txt"
          runnable={false}
          code={`@tool
def search_docs(query: str) -> str:
    """This docstring is sent to the LLM!
    It must explain WHEN to use the tool and WHAT it returns.
    Be specific: bad docstring = LLM won't call the tool."""
    # Your implementation
    return result

────────────────────────────────────────────────────────────────
DOCSTRING BEST PRACTICES:

  ✅ "Search the product docs for specs, warranty, returns"
     → Tells the LLM: use this for policy questions

  ✅ "Check stock by SKU. Example: X1-BAT-002 (battery)"
     → Tells the LLM: use this for inventory + gives format hint

  ❌ "Search"
     → Too vague. LLM won't know when to use it.

  ❌ "Calls the Chroma retriever with k=3"
     → Implementation detail, not user-facing purpose.

────────────────────────────────────────────────────────────────
TYPE HINTS MATTER:

def check_stock(sku: str) -> str:
                    ↑         ↑
              arg type    return type

The LLM sees: "This function takes a 'sku' (string) and returns a string."
If the LLM passes the wrong type, LangChain will validate and raise an error
(which becomes an observation the LLM can see and fix).`}
        />
        <Callout type="tip">
          💡 <strong>The docstring is the LLM&apos;s only guide</strong>. Spend time writing clear, specific docstrings. Include examples (<IC>&quot;Example SKUs: X1-BAT-002&quot;</IC>). The better the docstring, the more reliably the LLM calls the right tool.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="bind-tools" number="04" title="bind_tools and tool_calls">
        <P>
          To give tools to the LLM, use <IC>llm.bind_tools(tools)</IC>. The LLM&apos;s response will include <IC>tool_calls</IC> — a list of tools it wants to call:
        </P>
        <CodeBlock
          title="bind_tools_example.py"
          code={`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Bind tools to the LLM
llm_with_tools = llm.bind_tools(tools)

# Ask a question that requires a tool
response = llm_with_tools.invoke("Is the spare battery in stock?")

print("AI response type:", type(response))
print("Content:", response.content)
print("Tool calls:", response.tool_calls)`}
          output={`AI response type: <class 'langchain_core.messages.ai.AIMessage'>
Content:
Tool calls: [{'name': 'check_stock', 'args': {'sku': 'X1-BAT-002'}, 'id': 'call_abc123', 'type': 'tool_call'}]`}
        />
        <P>
          <strong>What happened?</strong>
        </P>
        <CodeBlock
          title="tool_calls_explained.txt"
          runnable={false}
          code={`The LLM did NOT answer the question directly.
Instead, it returned a REQUEST to call a tool:

response.tool_calls = [
    {
        'name': 'check_stock',           # Which tool to call
        'args': {'sku': 'X1-BAT-002'},  # Arguments to pass
        'id': 'call_abc123',             # Unique ID (for multi-tool scenarios)
        'type': 'tool_call'
    }
]

────────────────────────────────────────────────────────────────
YOUR CODE must:
  1. Parse response.tool_calls
  2. Execute the requested tool: check_stock(sku="X1-BAT-002")
  3. Feed the result back to the LLM as an "observation"
  4. The LLM sees the observation and generates the final answer

This is the AGENT LOOP (coming next).`}
        />
        <Callout type="behind">
          ⚙️ <strong>Behind the scenes</strong>: <IC>bind_tools</IC> sends the tool definitions (name, args schema, docstring) to OpenAI&apos;s API as <IC>tools</IC> in the request. OpenAI&apos;s model is trained to output <IC>tool_calls</IC> JSON when it decides to use a tool. LangChain parses the response and populates <IC>response.tool_calls</IC>. You never see the raw JSON — LangChain abstracts it.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="agent-loop" number="05" title="The Agent Loop Drawn">
        <P>
          The agent loop is a <strong>think → act → observe → repeat</strong> cycle. Here&apos;s the manual version (~25 lines) so you understand the magic:
        </P>
        <CodeBlock
          title="manual_agent_loop.py"
          code={`from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

# Manual agent loop (simplified)
llm_with_tools = llm.bind_tools(tools)
messages = [HumanMessage(content="Is the spare battery in stock?")]

max_iterations = 5
for i in range(max_iterations):
    print(f"\\n--- Iteration {i+1} ---")

    # Step 1: LLM thinks
    response = llm_with_tools.invoke(messages)
    messages.append(response)

    # Step 2: Check if LLM wants to call a tool
    if not response.tool_calls:
        # No tool calls → LLM is done, response.content is the final answer
        print("Final answer:", response.content)
        break

    # Step 3: Execute each tool call
    for tool_call in response.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        print(f"Calling tool: {tool_name}({tool_args})")

        # Find the tool function
        tool_fn = next(t for t in tools if t.name == tool_name)

        # Execute it
        observation = tool_fn.invoke(tool_args)
        print(f"Observation: {observation}")

        # Feed the observation back to the LLM
        messages.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))

    # Loop back: LLM sees the observation and decides next step
    # (might call another tool, or generate final answer)

print("\\nFinal message history:")
for m in messages:
    print(f"  {m.type}: {m.content[:60] if m.content else '(tool_calls)'}...")`}
          output={`--- Iteration 1 ---
Calling tool: check_stock({'sku': 'X1-BAT-002'})
Observation: X1-BAT-002: 7 units in stock

--- Iteration 2 ---
Final answer: Yes, the spare battery (X1-BAT-002) is in stock. We currently have 7 units available.

Final message history:
  human: Is the spare battery in stock?...
  ai: (tool_calls)...
  tool: X1-BAT-002: 7 units in stock...
  ai: Yes, the spare battery (X1-BAT-002) is in stock. We curren...`}
        />
        <P>
          <strong>The loop:</strong>
        </P>
        <CodeBlock
          title="agent_loop_diagram.txt"
          runnable={false}
          code={`User question
    ↓
┌───────────────────────────────────────┐
│  LLM thinks: "I need to call a tool"  │ ← Iteration 1
│  Returns: tool_calls = [check_stock]  │
└───────────────────────────────────────┘
    ↓
Execute check_stock(sku="X1-BAT-002")
    ↓
Observation: "7 units in stock"
    ↓ (feed back to LLM as ToolMessage)
┌───────────────────────────────────────┐
│  LLM sees observation                 │ ← Iteration 2
│  Returns: "Yes, 7 units available"    │
│  (no tool_calls → DONE)               │
└───────────────────────────────────────┘
    ↓
Final answer

────────────────────────────────────────────────────────────────
KEY INSIGHT:

The LLM NEVER executes tools. It only REQUESTS them.
Your code (the agent loop) executes the tool and returns the result.
The LLM sees the result as TEXT (ToolMessage) and generates a response.

This is why tool errors are recoverable — they're just observations!`}
        />
      </Section>

      {/* 06 */}
      <Section id="react-agent" number="06" title="create_react_agent">
        <P>
          LangGraph provides <IC>create_react_agent</IC> — a pre-built agent loop (the manual version above, but production-ready):
        </P>
        <CodeBlock
          title="react_agent.py"
          code={`from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Create the agent
agent = create_react_agent(llm, tools)

# Test: multi-tool question
result = agent.invoke({
    "messages": [("user", "Can I still return my X1? I bought it on May 20")]
})

print("Message trace:")
for msg in result["messages"]:
    print(f"\\n{msg.type.upper()}:")
    if hasattr(msg, "content") and msg.content:
        print(f"  {msg.content}")
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        for tc in msg.tool_calls:
            print(f"  TOOL CALL: {tc['name']}({tc['args']})")`}
          output={`Message trace:

USER:
  Can I still return my X1? I bought it on May 20

AI:
  TOOL CALL: days_left_for_return({'purchase_date': '2026-05-20'})
  TOOL CALL: search_docs({'query': 'return policy'})

TOOL:
  23 days elapsed, 7 days left in the return window

TOOL:
  Returns are accepted within 30 days of purchase with original packaging and proof of purchase. Refunds issued to original payment method within 7-10 business days.

AI:
  Yes, you can still return your Nimbus X1. You purchased it 23 days ago, and our return policy allows returns within 30 days of purchase. You have 7 days left to initiate the return. Make sure you have the original packaging and proof of purchase.`}
        />
        <P>
          <strong>What happened?</strong> The agent autonomously:
        </P>
        <CodeBlock
          title="agent_trace.txt"
          runnable={false}
          code={`1. Read the question: "Can I still return my X1? Bought May 20"
2. Identified TWO sub-tasks:
     a. Calculate days left (requires days_left_for_return tool)
     b. Check return policy (requires search_docs tool)
3. Called BOTH tools (in parallel or sequence — LangGraph decides)
4. Received observations:
     - "23 days elapsed, 7 days left"
     - "Returns within 30 days..."
5. Synthesized a final answer using BOTH observations

No hard-coded logic. The LLM reasoned through the task.`}
        />
        <Callout type="tip">
          💡 <strong>ReAct = Reasoning + Acting</strong>. The LLM alternates: reason (<IC>&quot;I need to call this tool&quot;</IC>) → act (tool call) → observe (tool result) → reason (<IC>&quot;now I know X, so I&apos;ll...&quot;</IC>). This loop enables multi-step reasoning. The name <IC>create_react_agent</IC> comes from this pattern.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="rag-as-tool" number="07" title="RAG-as-a-Tool ⭐">
        <P>
          The <IC>search_docs</IC> tool wraps your RAG retriever. This is <strong>agentic RAG</strong> — the agent decides WHEN to search (not every question needs docs):
        </P>
        <CodeBlock
          title="agentic_rag_examples.py"
          code={`# Question 1: Needs docs
result = agent.invoke({"messages": [("user", "What is the X1 battery life?")]})
print("Q1:", result["messages"][-1].content)

# Question 2: Needs inventory (NO docs)
result = agent.invoke({"messages": [("user", "Is the battery in stock?")]})
print("\\nQ2:", result["messages"][-1].content)

# Question 3: Needs BOTH docs AND inventory
result = agent.invoke({"messages": [("user", "Do you sell spare propellers and what's the warranty?")]})
print("\\nQ3:", result["messages"][-1].content)

# Question 4: Needs NEITHER (arithmetic)
result = agent.invoke({"messages": [("user", "If I bought my X1 on May 1, how many days left to return?")]})
print("\\nQ4:", result["messages"][-1].content)`}
          output={`Q1: The Nimbus X1 battery lasts 28 minutes.

Q2: Yes, the battery (X1-BAT-002) is in stock. We have 7 units available.

Q3: Yes, we sell spare propellers (X1-PROP-004, 12 units in stock). Replacement parts including propellers are covered under the 12-month warranty if defective.

Q4: You purchased your X1 on May 1. As of today (June 12), 42 days have elapsed, so the 30-day return window has expired by 12 days.`}
        />
        <P>
          <strong>Analysis:</strong>
        </P>
        <Table
          head={["Question", "Tools called", "Why"]}
          rows={[
            [<IC>&quot;What is the X1 battery life?&quot;</IC>, <IC>search_docs</IC>, "Needs product specs from the manual"],
            [<IC>&quot;Is the battery in stock?&quot;</IC>, <IC>check_stock</IC>, "Needs inventory, NOT docs"],
            [<IC>&quot;Do you sell spare propellers and what&apos;s the warranty?&quot;</IC>, <><IC>check_stock</IC> + <IC>search_docs</IC></>, "Compound question: stock (inventory) + warranty (docs)"],
            [<IC>&quot;If I bought my X1 on May 1, how many days left to return?&quot;</IC>, <IC>days_left_for_return</IC>, "Date calculation, NO docs needed"],
          ]}
        />
        <P>
          The agent chose the right tools for each question. You didn&apos;t write <IC>if &quot;stock&quot; in question: call check_stock</IC> — the LLM figured it out from the tool docstrings. This is the power of agents. ✅
        </P>
        <Callout type="note">
          📌 <strong>Agentic RAG</strong> means RAG is ONE of many tools, not the entire pipeline. The agent can combine RAG with APIs, databases, calculations, etc. This unlocks multi-hop reasoning: <IC>&quot;Is the battery in stock, and is it covered by warranty?&quot;</IC> → stock API + docs search → synthesis.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="multi-rounds" number="08" title="Multiple Rounds & Max Iterations">
        <P>
          Agents can loop multiple times. Example: the LLM calls tool A, sees the result, then calls tool B, then answers. But what if it loops forever?
        </P>
        <CodeBlock
          title="runaway_loop.py"
          code={`# Runaway scenario (hypothetical):
# LLM calls search_docs → not satisfied → calls search_docs again with different query
# → still not satisfied → calls check_stock → confused → calls search_docs again...
# → 50 iterations → timeout or cost explosion

# create_react_agent has a recursion_limit to prevent this
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(llm, tools, state_modifier="You are a helpful assistant.")

# Default recursion_limit is ~25. If exceeded:
result = agent.invoke(
    {"messages": [("user", "Some very ambiguous question")]},
    config={"recursion_limit": 10},  # Lower limit for safety
)

# If the agent hits 10 iterations without finishing, it raises:
# langchain_core.runnables.config.RecursionError: Recursion limit exceeded`}
          runnable={false}
        />
        <P>
          <strong>Best practices:</strong>
        </P>
        <Table
          head={["Setting", "Value", "Why"]}
          rows={[
            [<IC>recursion_limit</IC>, "10-15 for production", "Most questions resolve in 2-3 iterations. 10 is a safety net. Higher = runaway cost risk."],
            ["Tool docstrings", "Clear, specific, with examples", "Vague docstrings → LLM calls wrong tool → retries → wasted iterations"],
            ["System prompt", <><IC>&quot;You are concise. Use tools efficiently.&quot;</IC></>, "Discourages the LLM from over-thinking or calling tools unnecessarily"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ <strong>Runaway agents are expensive</strong>. Each iteration = 1 LLM call. If an agent loops 20 times on a single question, that&apos;s 20× the cost of a chain. Monitor your agent loops in production (log iteration count, set alerts if P95 &gt; 5 iterations).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="when-not" number="09" title="When NOT to Use Agents ⭐">
        <P>
          Agents are powerful but SLOW and UNPREDICTABLE. Use them only when you need dynamic tool selection.
        </P>
        <Table
          head={["Scenario", "Chain or Agent?", "Why"]}
          rows={[
            ["Every question needs exactly 1 RAG retrieval + answer", <><strong>CHAIN</strong></>, "Steps are fixed: retrieve → answer. No need for the agent to decide. Chains are 3× faster (1 LLM call vs 2-3) and deterministic."],
            ["Some questions need docs, some need inventory, some need both", <><strong>AGENT</strong></>, "Steps vary per question. The agent autonomously picks the right tool(s). Worth the +2 LLM calls."],
            ["Multi-step workflows where order is known", <><strong>CHAIN</strong></>, <>Example: <IC>&quot;Always check stock, then check warranty, then answer.&quot;</IC> Hard-code this as a chain (faster, predictable). Agent would waste iterations rediscovering the order.</>],
            ["User might ask off-topic questions", <><strong>AGENT</strong></>, <>Agent can decline to call tools: <IC>&quot;I&apos;m a Nimbus support bot. I can&apos;t help with math homework.&quot;</IC> Chains blindly retrieve even for <IC>&quot;What&apos;s 2+2?&quot;</IC></>],
            ["Latency budget &lt; 500ms", <><strong>CHAIN</strong></>, "Agents take 800ms - 2s (multiple LLM calls + tool execution). Chains take 300-500ms (1 LLM call). If speed matters, chain wins."],
            ["Compound questions with unknown sub-tasks", <><strong>AGENT</strong></>, <>Example: <IC>&quot;Compare the X1 and X2 battery life and check if both are in stock.&quot;</IC> Agent breaks this into 4 tool calls. Chain can&apos;t.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Decision framework</strong>: Start with a CHAIN (simple, fast). If you find yourself writing <IC>if ... elif ... elif</IC> to handle different question types, switch to an AGENT. If 90% of questions follow the same path, stick with a chain and handle edge cases manually.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="structured-args" number="10" title="Structured Tool Args">
        <P>
          For complex tools, use Pydantic schemas to validate arguments:
        </P>
        <CodeBlock
          title="structured_tool_args.py"
          code={`from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Define a schema for tool arguments
class StockCheckArgs(BaseModel):
    sku: str = Field(description="Product SKU in format: X1-XXX-NNN (e.g., X1-BAT-002)")
    quantity: int = Field(default=1, description="Quantity to check (default 1)")

@tool(args_schema=StockCheckArgs)
def check_stock_advanced(sku: str, quantity: int = 1) -> str:
    """Check if we have enough stock for a given SKU and quantity."""
    available = INVENTORY.get(sku, 0)
    if available >= quantity:
        return f"{sku}: {available} units available (you need {quantity}). IN STOCK ✅"
    else:
        return f"{sku}: only {available} units available (you need {quantity}). OUT OF STOCK ❌"

# Test: LLM calls with wrong format
llm_with_tools = llm.bind_tools([check_stock_advanced])
response = llm_with_tools.invoke("Do you have 10 batteries?")

print("Tool calls:", response.tool_calls)`}
          output={`Tool calls: [{'name': 'check_stock_advanced', 'args': {'sku': 'X1-BAT-002', 'quantity': 10}, 'id': 'call_xyz789', 'type': 'tool_call'}]`}
        />
        <P>
          If the LLM passes invalid args (e.g., <IC>quantity=-5</IC>), Pydantic validates and raises a <IC>ValidationError</IC>. This error is fed back to the LLM as an observation, and the LLM can retry with corrected args. The agent self-corrects!
        </P>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging & Common Errors">
        <P>
          <strong>Debugging agents:</strong>
        </P>
        <Callout type="tip">
          💡 <strong>Debug move #1: Print every message in the trace</strong>
        </Callout>
        <CodeBlock
          title="debug_print_trace.py"
          code={`result = agent.invoke({"messages": [("user", "Is the battery in stock?")]})

for i, msg in enumerate(result["messages"]):
    print(f"\\n[{i}] {msg.type.upper()}:")
    if hasattr(msg, "content") and msg.content:
        print(f"  Content: {msg.content[:100]}...")
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        print(f"  Tool calls: {msg.tool_calls}")`}
          output={`[0] HUMAN:
  Content: Is the battery in stock?...

[1] AI:
  Tool calls: [{'name': 'check_stock', 'args': {'sku': 'X1-BAT-002'}, ...}]

[2] TOOL:
  Content: X1-BAT-002: 7 units in stock...

[3] AI:
  Content: Yes, the battery (X1-BAT-002) is in stock. We have 7 units available....`}
        />
        <P>
          This shows you exactly what the agent did: which tools it called, what observations it received, how it responded.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 1: Tool not called (vague docstring)</strong>
        </Callout>
        <CodeBlock
          title="bad_docstring.py"
          code={`@tool
def search_docs(query: str) -> str:
    """Search."""  # ❌ Too vague!
    ...

# LLM doesn't know WHEN to use this. It might call check_stock for a docs question.`}
          runnable={false}
        />
        <P>
          <strong>Fix</strong>: Rewrite the docstring: <IC>&quot;Search the Nimbus Gear product documentation for specs, warranty, returns, and troubleshooting. Use this when the user asks about product features or policies.&quot;</IC> ✅
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 2: Agent hallucinates tool names</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`# Agent tries to call a tool that doesn't exist`}
          error
          output={`langchain_core.exceptions.ToolException: Tool 'get_inventory' not found. Available tools: ['search_docs', 'check_stock', 'days_left_for_return']`}
        />
        <P>
          <strong>Why</strong>: The LLM guessed a plausible tool name (<IC>get_inventory</IC> sounds reasonable). <strong>Fix</strong>: Add a system prompt: <IC>&quot;You have access to these tools: search_docs, check_stock, days_left_for_return. ONLY call these tools, no others.&quot;</IC> Or use <IC>strict=True</IC> in OpenAI&apos;s function calling (forces the LLM to pick from the list).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 3: Tool returns an error, agent doesn&apos;t recover</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`# Tool returns: "Error: SKU not found"`}
          output={`AI: I couldn't find that SKU in our inventory.`}
          runnable={false}
        />
        <P>
          <strong>Good news</strong>: The agent DID recover (it told the user the SKU wasn&apos;t found). But if the agent is confused, add a system prompt: <IC>&quot;If a tool returns an error, explain the error to the user and suggest alternatives if possible.&quot;</IC>
        </P>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Add a track_order tool and test multi-tool reasoning
──────────────────────────────────────────────────────────────

TASK 1: Define the track_order tool
  Code:
    ORDERS = {
        "ORD-1001": "Shipped - Arriving June 15",
        "ORD-1002": "Processing - Estimated ship date June 14",
        "ORD-1003": "Delivered - June 10",
    }

    @tool
    def track_order(order_id: str) -> str:
        """Track the status of a Nimbus Gear order by order ID.
        Example IDs: ORD-1001, ORD-1002, ORD-1003."""
        if order_id in ORDERS:
            return f"Order {order_id}: {ORDERS[order_id]}"
        else:
            return f"Error: Order {order_id} not found in our system"

  Test: Call track_order("ORD-1001") manually
  Expected: "Order ORD-1001: Shipped - Arriving June 15"

TASK 2: Add track_order to the agent's tools list
  Code:
    tools = [search_docs, check_stock, days_left_for_return, track_order]
    agent = create_react_agent(llm, tools)

  Test: agent.invoke({"messages": [("user", "Where is my order ORD-1002?")]})
  Expected: Agent calls track_order, returns "Processing - Estimated ship date June 14"

TASK 3: Test a question requiring track_order + search_docs
  Question: "I ordered a battery (ORD-1001). Can I return it when it arrives?"

  Expected flow:
    1. Agent calls track_order("ORD-1001") → "Shipped - Arriving June 15"
    2. Agent calls search_docs("return policy") → "30 days from purchase"
    3. Agent synthesizes: "Your order is arriving June 15. You can return it within 30 days of delivery."

  Test: Print the message trace, verify both tools were called.

TASK 4: Test tool error recovery
  Question: "Where is order ORD-9999?"

  Expected: Agent calls track_order("ORD-9999") → "Error: Order not found"
           Agent responds: "I couldn't find order ORD-9999 in our system. Please check the order ID."

  Test: Verify the agent doesn't crash, handles the error gracefully.

TASK 5: Compare agent vs chain
  Implement a CHAIN that always calls search_docs (no agent).
  Ask: "Is the battery in stock?"

  Chain: Retrieves docs (irrelevant), answers based on docs (wrong/confused)
  Agent: Calls check_stock (correct), answers "7 units in stock" (correct)

  Conclusion: Agents win when tool choice varies per question.

BONUS: Add a system prompt to the agent
  Code:
    agent = create_react_agent(
        llm,
        tools,
        state_modifier="You are a Nimbus Gear support assistant. Be concise. Only use tools when necessary."
    )

  Test: Ask "Hello, how are you?"
  Expected: Agent does NOT call any tools, just responds conversationally.`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is the difference between a chain and an agent?", "A chain has fixed steps hard-coded by the developer (e.g., always retrieve → answer). An agent has tools (functions the LLM can call), and the LLM decides which tools to use, in what order, possibly multiple rounds. Chain = train on rails (predictable, fast). Agent = taxi (flexible, slower). Use chains when steps are known; agents when steps vary per question."],
            ["What is a tool in LangChain?", "A tool is a Python function the LLM can invoke (but doesn't execute itself). You define it with @tool decorator. The function's docstring becomes the tool description the LLM reads. The LLM returns a tool_call request (name + args), your code executes the function, and you feed the result back to the LLM as a ToolMessage. Tools can wrap RAG retrieval, APIs, databases, calculations, etc."],
            ["How does llm.bind_tools work?", "bind_tools(tools) sends the tool definitions (name, args schema, docstring) to the LLM (e.g., OpenAI's function calling API). When the LLM decides to call a tool, it returns an AIMessage with tool_calls = [{'name': '...', 'args': {...}}]. Your code parses tool_calls, executes the tools, and feeds results back as ToolMessages. The LLM never executes code — it only requests tool calls."],
            ["What is the agent loop?", "Think → Act → Observe → Repeat. (1) LLM thinks: 'I need to call tool X.' Returns tool_calls. (2) Your code executes the tool. (3) Tool result becomes an observation (ToolMessage). (4) LLM sees the observation, decides next step (call another tool, or generate final answer). Loop continues until LLM returns no tool_calls (done). This is the ReAct pattern (Reasoning + Acting)."],
            ["What is create_react_agent?", "A pre-built LangGraph agent that implements the ReAct loop. You pass it llm + tools. It handles: parsing tool_calls, executing tools, feeding observations back, looping until done. You invoke it with {'messages': [('user', 'question')]}. It returns the full message history (all LLM responses, tool calls, observations). It's the production-ready version of the manual agent loop."],
            ["What is agentic RAG?", "RAG is a TOOL (search_docs) that the agent can choose to call. Unlike basic RAG (always retrieve), agentic RAG lets the agent decide: 'This question needs docs, that one needs inventory, this one needs both, that one needs neither.' The agent combines RAG with other tools (APIs, DBs, calculations) for multi-hop reasoning. Example: 'Is the battery in stock and covered by warranty?' → check_stock + search_docs."],
            ["Why are tool docstrings important?", "The docstring is the LLM's ONLY guide for when to use the tool. A vague docstring ('Search') → the LLM won't know when to call it. A clear docstring ('Search the product docs for specs, warranty, returns') → the LLM calls it correctly. Include examples ('Example SKUs: X1-BAT-002'). Bad docstrings = wrong tool calls = wasted iterations = higher cost."],
            ["When should you NOT use an agent?", "When steps are fixed and known. Example: every question needs exactly 1 RAG retrieval → use a CHAIN (3× faster, 1 LLM call vs 3). Agents are slower (multiple LLM calls), less predictable (might loop 5 times or 1 time), and more expensive. Only use agents when tool choice varies per question or you need multi-hop reasoning. If 90% of questions follow the same path, chain wins."],
            ["What is recursion_limit in agents?", "The max number of iterations (think-act-observe loops) before the agent stops. Default ~25. Prevents runaway loops (LLM keeps calling tools forever, costing $$). Set it to 10-15 in production. If exceeded, raises RecursionError. Most questions resolve in 2-3 iterations. If your agent hits 10, your tool docstrings are vague or the question is ambiguous."],
            ["How do you debug an agent that calls the wrong tool?", "1. Print the full message trace (all AIMessages, ToolMessages). See which tool was called and why. 2. Check the tool's docstring — is it clear? Add examples. 3. Check the system prompt — does it guide the LLM to use tools efficiently? 4. Check if the LLM hallucinated a tool name (tool not in your list). Add strict=True or list available tools in the system prompt. 5. Reduce temperature to 0 for determinism."],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Chain vs Agent", "Chain = fixed steps (you decide). Agent = dynamic tools (LLM decides). Chain faster, agent flexible."],
            ["Tool definition", "@tool decorator + docstring (LLM reads this!) + function body (you execute this)"],
            ["Bind tools", "llm_with_tools = llm.bind_tools(tools)"],
            ["Tool call signature", "response.tool_calls = [{'name': '...', 'args': {...}, 'id': '...'}]"],
            ["Agent loop", "Think (LLM returns tool_calls) → Act (execute tool) → Observe (ToolMessage) → Repeat"],
            ["Create agent", "from langgraph.prebuilt import create_react_agent; agent = create_react_agent(llm, tools)"],
            ["Invoke agent", "result = agent.invoke({'messages': [('user', 'question')]})"],
            ["Agentic RAG", "RAG as ONE tool among many. Agent decides when to search docs vs other tools."],
            ["Recursion limit", "config={'recursion_limit': 10} — prevents runaway loops (default ~25, use 10-15 prod)"],
            ["When NOT to use agents", "Fixed steps known in advance. Agents = slower (2-5 LLM calls) + less predictable."],
            ["Debug agents", "Print message trace: for msg in result['messages']: print(msg.type, msg.content, msg.tool_calls)"],
            ["Docstring best practice", "Clear, specific, with examples. 'Search product docs for specs, warranty' > 'Search'"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
