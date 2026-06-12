"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Stateless API → manual multi-turn memory",
  nodes: [
    { id: "user1", icon: "👤", label: "User", sub: "first question", x: 10, y: 30, color: "#22d3ee" },
    { id: "client1", icon: "🐍", label: "Your script", sub: "messages=[]", x: 30, y: 30, color: "#a78bfa" },
    { id: "api1", icon: "🌐", label: "OpenAI API", sub: "stateless!", x: 55, y: 30, color: "#fb923c" },
    { id: "llm1", icon: "🤖", label: "gpt-4o-mini", sub: "generates reply", x: 80, y: 30, color: "#60a5fa" },
    { id: "user2", icon: "👤", label: "User", sub: "follow-up", x: 10, y: 70, color: "#22d3ee" },
    { id: "client2", icon: "🐍", label: "Your script", sub: "append history", x: 30, y: 70, color: "#a78bfa" },
    { id: "api2", icon: "🌐", label: "OpenAI API", sub: "no memory!", x: 55, y: 70, color: "#fb923c" },
    { id: "llm2", icon: "🤖", label: "gpt-4o-mini", sub: "sees full history", x: 80, y: 70, color: "#60a5fa" },
  ],
  edges: [
    { id: "u1-c1", from: "user1", to: "client1", color: "#22d3ee" },
    { id: "c1-api1", from: "client1", to: "api1", color: "#a78bfa" },
    { id: "api1-llm1", from: "api1", to: "llm1", color: "#fb923c" },
    { id: "llm1-c1", from: "llm1", to: "client1", bend: -50, color: "#60a5fa" },
    { id: "u2-c2", from: "user2", to: "client2", color: "#22d3ee" },
    { id: "c2-api2", from: "client2", to: "api2", color: "#a78bfa" },
    { id: "api2-llm2", from: "api2", to: "llm2", color: "#fb923c" },
    { id: "llm2-c2", from: "llm2", to: "client2", bend: 50, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Single call",
      command: "client.chat.completions.create(...)",
      steps: [
        { node: "user1", paths: ["u1-c1"], text: "User asks: 'Tell me about the Nimbus X1 drone.' This is the FIRST question — no history yet." },
        { node: "client1", paths: ["c1-api1"], text: "Your Python script creates messages=[{'role':'user','content':'Tell me about the Nimbus X1 drone.'}]. This is sent to OpenAI via HTTPS (like the requests library you learned)." },
        { node: "api1", paths: ["api1-llm1"], text: "OpenAI API is STATELESS — it doesn't remember previous calls. It only sees THIS request: model=gpt-4o-mini, messages=[...]. Each call is independent." },
        { node: "llm1", paths: ["llm1-c1"], text: "gpt-4o-mini reads the messages list (just 1 message: the user's question). It generates a reply: 'The Nimbus X1 is a drone with 28-minute battery, 5 km range…' (it guesses from training data)." },
        { node: "client1", paths: [], text: "Your script receives: resp.choices[0].message.content = 'The Nimbus X1 is a drone…'. You print it. One complete call: question → answer. ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Follow-up without history",
      command: "Follow-up: What about the battery? (no history)",
      steps: [
        { node: "user2", paths: ["u2-c2"], text: "User follows up: 'What about the battery?' This assumes context (battery of WHAT?), but you didn't save the prior turn." },
        { node: "client2", paths: ["c2-api2"], text: "Your script sends messages=[{'role':'user','content':'What about the battery?'}]. NO HISTORY — the API doesn't know about the prior question ('Nimbus X1')." },
        { node: "api2", paths: ["api2-llm2"], text: "OpenAI API receives the request. It's stateless — this looks like the FIRST call (it forgot the X1 question). The messages list has only 1 item." },
        { node: "llm2", paths: ["llm2-c2"], text: "gpt-4o-mini sees 'What about the battery?' with NO context. It guesses: 'Batteries vary by device. Which battery are you asking about?' Confused answer! ❌" },
        { node: "client2", paths: [], text: "User sees: 'Which battery are you asking about?' They expected 'X1 battery lasts 28 minutes.' WITHOUT history, the LLM lost context. You must manually resend the prior messages!" },
      ],
    },
    {
      id: "power",
      name: "⚡ Multi-turn with manual history",
      command: "Append assistant reply + new user msg → resend all",
      steps: [
        { node: "user1", paths: ["u1-c1"], text: "Turn 1: User asks 'Tell me about the Nimbus X1 drone.' You send messages=[user_msg]." },
        { node: "client1", paths: ["c1-api1", "api1-llm1", "llm1-c1"], text: "API replies: 'The Nimbus X1 is a drone with…'. You save this: messages.append({'role':'assistant','content':reply}). Now messages has 2 items: user + assistant." },
        { node: "user2", paths: ["u2-c2"], text: "Turn 2: User asks 'What about the battery?' You append: messages.append({'role':'user','content':'What about the battery?'}). Now messages = [user1, assistant1, user2] (3 items)." },
        { node: "client2", paths: ["c2-api2"], text: "You send the FULL messages list (all 3). The API sees the history: prior question (X1) + prior answer + new question (battery)." },
        { node: "api2", paths: ["api2-llm2"], text: "OpenAI API forwards the 3 messages to gpt-4o-mini. The model reads the history and understands 'battery' refers to the X1." },
        { node: "llm2", paths: ["llm2-c2"], text: "gpt-4o-mini generates: 'The X1 battery lasts about 28 minutes.' It used the context from the prior turn! ✅" },
        { node: "client2", paths: [], text: "User sees a coherent answer. Multi-turn works because YOU (the developer) manually carried the history by appending messages and resending the full list. The API itself is still stateless. ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "mental-model", label: "The Chat Completions Mental Model" },
  { id: "install", label: "Install + API Key" },
  { id: "first-call", label: "Your First Call ⭐" },
  { id: "three-roles", label: "The Three Roles ⭐" },
  { id: "stateless", label: "The API Is STATELESS ⭐" },
  { id: "temperature", label: "Temperature & max_tokens" },
  { id: "streaming", label: "Streaming (Typewriter Effect)" },
  { id: "tokens-cost", label: "Tokens & Cost ⭐" },
  { id: "structured", label: "Structured Output (JSON Mode)" },
  { id: "errors", label: "Error Handling" },
  { id: "grounding", label: "Grounding Preview (Paste Context)" },
  { id: "debugging", label: "Debugging & Common Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function RagLlmApisPage() {
  return (
    <TopicShell
      icon="🤖"
      title="Calling LLMs from Python"
      gradientWord="LLMs"
      subtitle="You've learned to call REST APIs with requests. Now you'll call the OpenAI API: send messages, get responses, handle roles, stream tokens, and compute costs. This is the GENERATION step in RAG — you'll paste retrieved chunks into prompts and watch the LLM ground its answers in your docs."
      nav={NAV}
      badges={["🤖 OpenAI client", "💬 Chat completions", "🔄 Stateless API", "💸 Cost tracking"]}
      next={{ icon: "🧲", label: "Embeddings — Meaning as Numbers", href: "/rag/embeddings" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="mental-model" number="01" title="The Chat Completions Mental Model">
        <P>
          The OpenAI API (and most LLM APIs) works like this:
        </P>
        <CodeBlock
          title="mental_model.txt"
          runnable={false}
          code={`YOU SEND:
  - A list of messages (conversation history)
  - Model name (e.g., "gpt-4o-mini")
  - Optional params (temperature, max_tokens, etc.)

YOU GET BACK:
  - One new message (the assistant's reply)

────────────────────────────────────────────────────────────────
EXAMPLE:

SEND:
  {
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Say hello to Nimbus Gear!"}
    ]
  }

RECEIVE:
  {
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "Hello, Nimbus Gear! How can I assist you today?"
        }
      }
    ]
  }

────────────────────────────────────────────────────────────────
IT'S JUST HTTP!
  This is the same as requests.post(url, json=...).
  OpenAI wraps it in a Python client (nicer API), but under the hood:
    HTTPS request → OpenAI server → gpt-4o-mini inference → HTTPS response

  You already know how APIs work from the Python track. This is no different.`}
        />
        <Callout type="note">
          📌 The endpoint is <IC>POST https://api.openai.com/v1/chat/completions</IC>. The Python client abstracts this, but knowing the raw API helps with debugging. You can even call it with <IC>requests</IC> (we&apos;ll stick to the official client for convenience).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install + API Key">
        <CodeBlock
          title="terminal"
          code={`pip install openai`}
        />
        <P>
          You need an <strong>OpenAI API key</strong>. Sign up at <IC>https://platform.openai.com/</IC>, navigate to API Keys, create one, and copy it. It looks like <IC>sk-proj-abc123...</IC>.
        </P>
        <CodeBlock
          title="terminal (set the key as an env var)"
          code={`export OPENAI_API_KEY='sk-proj-YOUR_KEY_HERE'

# Verify it's set:
echo $OPENAI_API_KEY`}
          output={`sk-proj-YOUR_KEY_HERE`}
        />
        <Callout type="mistake">
          ⚠️ <strong>NEVER hardcode your API key in code</strong>. Don&apos;t write <IC>openai.api_key = &quot;sk-proj-...&quot;</IC>. If you commit this to GitHub, bots scrape it in SECONDS and rack up charges on your account. ALWAYS use environment variables. The OpenAI client auto-reads <IC>OPENAI_API_KEY</IC> from the environment.
        </Callout>
        <CodeBlock
          title="verify_install.py"
          code={`from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from environment
print("OpenAI client initialized ✅")
print(f"API key starts with: {client.api_key[:15]}...")`}
          output={`OpenAI client initialized ✅
API key starts with: sk-proj-abc123...`}
        />
      </Section>

      {/* 03 */}
      <Section id="first-call" number="03" title="Your First Call ⭐">
        <CodeBlock
          title="first_call.py"
          code={`from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Say hello to Nimbus Gear!"}
    ]
)

reply = response.choices[0].message.content
print(reply)`}
          output={`Hello, Nimbus Gear! How can I assist you today?`}
        />
        <P>
          <strong>Line-by-line breakdown:</strong>
        </P>
        <CodeBlock
          title="first_call_explained.txt"
          runnable={false}
          code={`from openai import OpenAI
  Import the OpenAI client class.

client = OpenAI()
  Create a client instance. It auto-reads OPENAI_API_KEY from environment.
  If the key is missing, this raises an error.

response = client.chat.completions.create(...)
  Call the chat completions endpoint (POST /v1/chat/completions).
  This is SYNCHRONOUS — it blocks until the API responds (~1-3 seconds).

model="gpt-4o-mini"
  Which model to use. Options: gpt-4o-mini (cheap, fast), gpt-4o (smarter, pricier).
  We use gpt-4o-mini for the whole RAG track (it's good enough + cheap).

messages=[{"role": "user", "content": "Say hello to Nimbus Gear!"}]
  The conversation history. For now: 1 message (the user's question).
  The API returns the assistant's reply.

response.choices[0].message.content
  The API returns a list of "choices" (usually 1). Each choice has a message.
  message.content = the text the model generated (the reply).

────────────────────────────────────────────────────────────────
WHAT JUST HAPPENED?
  1. Your script sent an HTTPS request to OpenAI.
  2. OpenAI ran gpt-4o-mini inference (GPU cluster, ~1-2 sec).
  3. The model generated: "Hello, Nimbus Gear! How can I assist you today?"
  4. OpenAI sent it back as JSON.
  5. Your script printed it.

You just called an LLM from Python. 🚀`}
        />
      </Section>

      {/* 04 */}
      <Section id="three-roles" number="04" title="The Three Roles ⭐">
        <P>
          The <IC>messages</IC> list contains dicts with <IC>role</IC> and <IC>content</IC>. There are THREE roles:
        </P>
        <Table
          head={["Role", "Who", "Example"]}
          rows={[
            [<IC>system</IC>, <>You (the developer). Behavior instructions for the model.</>, <>&quot;You are NimbusBot, a concise support agent for Nimbus Gear drones.&quot;</>],
            [<IC>user</IC>, <>The end-user. Their question or input.</>, <>&quot;How long does the X1 battery last?&quot;</>],
            [<IC>assistant</IC>, <>The model&apos;s own past replies (from prior turns).</>, <>&quot;The X1 battery lasts 28 minutes.&quot;</>],
          ]}
        />
        <P>
          <strong>Why the system role matters:</strong>
        </P>
        <CodeBlock
          title="system_prompt.py"
          code={`from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": "You are NimbusBot, a concise support agent for Nimbus Gear. Answer in 1-2 sentences max."
        },
        {
            "role": "user",
            "content": "Tell me about the Nimbus X1."
        }
    ]
)

print(response.choices[0].message.content)`}
          output={`The Nimbus X1 is a compact drone with a 28-minute battery life, 5 km range, and can handle winds up to 38 km/h.`}
        />
        <P>
          Without the system prompt, the model might write 3 paragraphs. The system message <strong>steers behavior</strong>: tone, format, length, personality. For RAG, the system message will say: <em>&quot;Answer using the context below. If the context doesn&apos;t contain the answer, say &apos;I don&apos;t know.&apos;&quot;</em> This reduces hallucinations.
        </P>
        <Callout type="tip">
          💡 <strong>Interview tip</strong>: &quot;The system role sets instructions (behavior, tone, constraints). The user role is the actual question. The assistant role is for multi-turn conversations — you append the model&apos;s prior replies to maintain context. Always use a system message in production to control output quality.&quot;
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="stateless" number="05" title="The API Is STATELESS ⭐">
        <P>
          This is the #1 gotcha for beginners. The OpenAI API <strong>does NOT remember previous calls</strong>. Every request is independent. Watch what happens:
        </P>
        <CodeBlock
          title="stateless_trap.py"
          code={`from openai import OpenAI

client = OpenAI()

# Call 1
resp1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "My name is Alice."}]
)
print("Call 1:", resp1.choices[0].message.content)

# Call 2 (same client, but NEW request — API forgot call 1)
resp2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What is my name?"}]
)
print("Call 2:", resp2.choices[0].message.content)`}
          output={`Call 1: Nice to meet you, Alice! How can I assist you today?
Call 2: I don't have access to personal information, so I don't know your name.`}
        />
        <P>
          <strong>Why it forgot:</strong> The second call had <IC>messages=[{`{"role":"user","content":"What is my name?"}`}]</IC> — NO history. The API never saw <em>&quot;My name is Alice.&quot;</em> in call 2. It&apos;s a fresh request.
        </P>
        <P>
          <strong>How to fix it: manually carry history</strong>
        </P>
        <CodeBlock
          title="stateless_fix.py"
          code={`from openai import OpenAI

client = OpenAI()

# Start with an empty messages list
messages = []

# Turn 1
messages.append({"role": "user", "content": "My name is Alice."})
resp1 = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
assistant_reply = resp1.choices[0].message.content
print("Turn 1:", assistant_reply)

# Save the assistant's reply
messages.append({"role": "assistant", "content": assistant_reply})

# Turn 2
messages.append({"role": "user", "content": "What is my name?"})
resp2 = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
print("Turn 2:", resp2.choices[0].message.content)

# Now messages = [user1, assistant1, user2]
print("\\nFull history:", messages)`}
          output={`Turn 1: Nice to meet you, Alice! How can I assist you today?
Turn 2: Your name is Alice.

Full history: [{'role': 'user', 'content': 'My name is Alice.'}, {'role': 'assistant', 'content': 'Nice to meet you, Alice! How can I assist you today?'}, {'role': 'user', 'content': 'What is my name?'}]`}
        />
        <P>
          <strong>The pattern:</strong>
        </P>
        <CodeBlock
          title="multi_turn_pattern.txt"
          runnable={false}
          code={`messages = []  # Start empty

# Turn 1
messages.append({"role": "user", "content": "..."})
resp = client.chat.completions.create(model="...", messages=messages)
messages.append({"role": "assistant", "content": resp.choices[0].message.content})

# Turn 2
messages.append({"role": "user", "content": "..."})
resp = client.chat.completions.create(model="...", messages=messages)
messages.append({"role": "assistant", "content": resp.choices[0].message.content})

# Turn 3...
# Keep appending user + assistant messages. The full history is resent every time.

────────────────────────────────────────────────────────────────
WHY THIS WORKS:
  The API sees the FULL messages list: [user1, assistant1, user2, assistant2, user3].
  The model reads the history and understands context (e.g., "my name" refers to Alice).

────────────────────────────────────────────────────────────────
COST IMPLICATION:
  Every turn, you resend ALL prior messages.
  Turn 10: you send 20 messages (10 user + 10 assistant).
  Long conversations = high token cost. Mitigation: summarize old turns, or truncate.`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Forgetting to append the assistant&apos;s reply. If you only append user messages, the model sees: [user1, user2, user3] — it looks like 3 independent questions, no flow. ALWAYS append the assistant&apos;s reply after each call to maintain coherent history.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="temperature" number="06" title="Temperature & max_tokens">
        <P>
          <strong>temperature</strong> (0.0 to 2.0) controls randomness. <strong>max_tokens</strong> limits output length.
        </P>
        <Table
          head={["temperature", "Effect", "Use case"]}
          rows={[
            [<IC>0.0</IC>, "Deterministic (same input → same output)", "RAG, fact extraction, classification (you want consistency)"],
            [<IC>0.7</IC>, "Balanced (default for chat)", "Conversational chatbots (natural but not wild)"],
            [<IC>1.0-2.0</IC>, "Creative, varied", "Story writing, brainstorming (you want novelty)"],
          ]}
        />
        <CodeBlock
          title="temperature_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

prompt = "Suggest a name for a new Nimbus drone model."

# Run at temp=0 twice
for i in range(2):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    print(f"temp=0, run {i+1}:", resp.choices[0].message.content)

# Run at temp=1.2 twice
for i in range(2):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=1.2
    )
    print(f"temp=1.2, run {i+1}:", resp.choices[0].message.content)`}
          output={`temp=0, run 1: Nimbus X2 Pro
temp=0, run 2: Nimbus X2 Pro
temp=1.2, run 1: Nimbus SkyRider
temp=1.2, run 2: Nimbus Aether Flyer`}
        />
        <P>
          At <IC>temperature=0</IC>, outputs are IDENTICAL (deterministic). At <IC>temperature=1.2</IC>, outputs vary (creative). For RAG, use <IC>temperature=0</IC> so users get consistent answers.
        </P>
        <P>
          <strong>max_tokens:</strong>
        </P>
        <CodeBlock
          title="max_tokens_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain RAG in detail."}],
    max_tokens=30  # Hard limit: stop after 30 tokens
)

print(resp.choices[0].message.content)
print(f"Finish reason: {resp.choices[0].finish_reason}")`}
          output={`Retrieval-Augmented Generation (RAG) combines retrieval and generation. It retrieves relevant docs, then an LLM generates answers grounded in
Finish reason: length`}
        />
        <P>
          <IC>finish_reason=&quot;length&quot;</IC> means the output was truncated by <IC>max_tokens</IC>. If <IC>finish_reason=&quot;stop&quot;</IC>, the model finished naturally. For RAG, omit <IC>max_tokens</IC> (let the model finish) or set it high (e.g., 500).
        </P>
      </Section>

      {/* 07 */}
      <Section id="streaming" number="07" title="Streaming (Typewriter Effect)">
        <P>
          By default, <IC>client.chat.completions.create()</IC> waits for the FULL response (2-3 seconds). With <IC>stream=True</IC>, you get tokens AS THEY&apos;RE GENERATED (typewriter effect, like ChatGPT UI).
        </P>
        <CodeBlock
          title="streaming_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain the X1 battery in 2 sentences."}],
    stream=True  # ← Enable streaming
)

print("Streaming response:")
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)  # Print each token as it arrives

print("\\n[Stream complete]")`}
          output={`Streaming response:
The Nimbus X1 features a lithium-polymer battery providing approximately 28 minutes of flight time on a full charge. It takes about 90 minutes to fully recharge.
[Stream complete]`}
        />
        <P>
          <strong>Why streaming matters:</strong>
        </P>
        <Table
          head={["Use case", "Stream?", "Why"]}
          rows={[
            ["Terminal script (batch processing)", "No", "You need the full response to parse/store it. Streaming adds complexity."],
            ["Web UI (chatbot)", "Yes", "Users see tokens appear in real-time (better UX). Feels faster even if total time is the same."],
            ["RAG pipeline (retrieve → generate)", "No", "You paste the full answer into a database or return it as JSON. No need to stream."],
            ["Long-form content generation", "Yes", "If generating 1000 tokens (~2 min), stream so the user knows it's working."],
          ]}
        />
        <Callout type="note">
          📌 Streaming is OPTIONAL. For this RAG track, we&apos;ll skip it (we&apos;re building a backend, not a UI). But know it exists — you&apos;ll use it in Streamlit (topic 13) for the chatbot UI.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="tokens-cost" number="08" title="Tokens & Cost ⭐">
        <P>
          OpenAI charges per <strong>token</strong> (not per API call). You pay for INPUT tokens (your prompt) + OUTPUT tokens (the model&apos;s reply).
        </P>
        <CodeBlock
          title="token_count_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "How long does the X1 battery last?"}
    ]
)

usage = response.usage
print(f"Prompt tokens: {usage.prompt_tokens}")
print(f"Completion tokens: {usage.completion_tokens}")
print(f"Total tokens: {usage.total_tokens}")
print(f"\\nReply: {response.choices[0].message.content}")`}
          output={`Prompt tokens: 24
Completion tokens: 12
Total tokens: 36

Reply: The X1 battery lasts approximately 28 minutes.`}
        />
        <P>
          <strong>Cost calculation (gpt-4o-mini pricing as of 2024):</strong>
        </P>
        <Table
          head={["Type", "Price", "Example"]}
          rows={[
            ["Input tokens", "$0.15 per 1M tokens", "1,200 input tokens → $0.00018"],
            ["Output tokens", "$0.60 per 1M tokens", "300 output tokens → $0.00018"],
            ["Total cost (1 call)", <>Input + output</>, "1,200 in + 300 out → $0.00036 (~3 hundredths of a cent)"],
          ]}
        />
        <CodeBlock
          title="cost_math.py"
          code={`# Cost calculator
def calculate_cost(prompt_tokens, completion_tokens, model="gpt-4o-mini"):
    if model == "gpt-4o-mini":
        input_price = 0.15 / 1_000_000  # $0.15 per 1M
        output_price = 0.60 / 1_000_000  # $0.60 per 1M
    else:
        raise ValueError("Only gpt-4o-mini supported in this demo")

    input_cost = prompt_tokens * input_price
    output_cost = completion_tokens * output_price
    total_cost = input_cost + output_cost

    return {
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": total_cost
    }

# Example: RAG call with 1,200 input + 300 output
cost = calculate_cost(1200, 300)
print(f"Input cost: ${cost['input_cost']:.6f}")
print(f"Output cost: ${cost['output_cost']:.6f}")
print(f"Total cost: ${cost['total_cost']:.6f}")

# Estimate: 1,000 RAG queries/day
daily_cost = cost['total_cost'] * 1000
monthly_cost = daily_cost * 30
print(f"\\nDaily (1,000 queries): ${daily_cost:.2f}")
print(f"Monthly (30k queries): ${monthly_cost:.2f}")`}
          output={`Input cost: $0.000180
Output cost: $0.000180
Total cost: $0.000360

Daily (1,000 queries): $0.36
Monthly (30k queries): $10.80`}
        />
        <P>
          <strong>RAG cost insight:</strong> A typical RAG query sends ~1,200 tokens (system prompt + 3 retrieved chunks + question) and gets ~300 tokens back. That&apos;s $0.00036 per query. If you handle 30,000 queries/month, that&apos;s $10.80 in LLM costs. RAG is CHEAP because you retrieve only relevant chunks (not all docs).
        </P>
        <Callout type="tip">
          💡 <strong>Interview tip</strong>: &quot;Tokens are the billing unit. gpt-4o-mini charges $0.15/1M input + $0.60/1M output. A typical RAG call: 1,200 input + 300 output ≈ $0.0003. Embeddings are even cheaper: $0.02/1M tokens. The real cost driver is OUTPUT length — minimize verbose answers. Always log usage.prompt_tokens and usage.completion_tokens to track spend.&quot;
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="structured" number="09" title="Structured Output (JSON Mode)">
        <P>
          Sometimes you want the LLM to return JSON (e.g., extract fields from a support ticket). Use <IC>response_format={`{"type":"json_object"}`}</IC>:
        </P>
        <CodeBlock
          title="json_mode.py"
          code={`from openai import OpenAI
import json

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": "Extract product and issue from the user's message. Return JSON: {product:..., issue:...}"
        },
        {
            "role": "user",
            "content": "My X1 drone won't pair with the app."
        }
    ],
    response_format={"type": "json_object"}  # Force JSON output
)

reply = response.choices[0].message.content
print("Raw reply:", reply)

parsed = json.loads(reply)
print(f"\\nProduct: {parsed['product']}")
print(f"Issue: {parsed['issue']}")`}
          output={`Raw reply: {"product": "X1 drone", "issue": "won't pair with the app"}

Product: X1 drone
Issue: won't pair with the app`}
        />
        <P>
          <strong>Why this is useful:</strong> You can parse the JSON and store it in a database, trigger workflows, etc. Without <IC>response_format</IC>, the model might say <em>&quot;The product is X1 drone and the issue is pairing.&quot;</em> (prose, not JSON).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Gotcha</strong>: If you set <IC>response_format={`{"type":"json_object"}`}</IC>, you MUST mention &quot;JSON&quot; in the system prompt (e.g., &quot;Return JSON&quot;). Otherwise the API raises an error. The model needs a hint to output JSON.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="errors" number="10" title="Error Handling">
        <P>
          The OpenAI API can fail (rate limits, auth errors, network issues). Always wrap calls in <IC>try/except</IC>:
        </P>
        <CodeBlock
          title="error_handling.py"
          code={`from openai import OpenAI, RateLimitError, AuthenticationError, APIError
import time

client = OpenAI()

def call_with_retry(messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                timeout=10  # 10-second timeout
            )
            return resp.choices[0].message.content

        except RateLimitError:
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"Rate limit hit. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise  # Give up after 3 tries

        except AuthenticationError:
            print("Auth error: Check your OPENAI_API_KEY")
            raise

        except APIError as e:
            print(f"API error: {e}")
            raise

# Test
messages = [{"role": "user", "content": "Hello!"}]
reply = call_with_retry(messages)
print(reply)`}
          output={`Hello! How can I assist you today?`}
        />
        <P>
          <strong>Common errors:</strong>
        </P>
        <Table
          head={["Error", "Cause", "Fix"]}
          rows={[
            [<IC>AuthenticationError</IC>, <>Invalid/missing API key</>, <>Check <IC>OPENAI_API_KEY</IC> env var, verify key at platform.openai.com</>],
            [<IC>RateLimitError</IC>, <>Too many requests (you hit your quota or rate limit)</>, <>Wait + retry with exponential backoff. Or upgrade your OpenAI plan.</>],
            [<IC>Timeout</IC>, <>API took &gt;10s to respond (rare)</>, <>Increase <IC>timeout</IC> param or retry</>],
            [<IC>InvalidRequestError</IC>, <>Bad params (e.g., model name typo, invalid message format)</>, <>Read error message, fix request</>],
          ]}
        />
      </Section>

      {/* 11 */}
      <Section id="grounding" number="11" title="Grounding Preview (Paste Context)">
        <P>
          Let&apos;s preview RAG: paste a manual excerpt into the system prompt and watch the LLM ground its answer.
        </P>
        <CodeBlock
          title="grounding_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

# Hardcode manual excerpt (in real RAG, this comes from retrieval)
manual_chunk = """
Nimbus X1 Specifications:
- Battery: Lithium-polymer, 3200 mAh, 28 minutes flight time
- Range: 5 km line-of-sight
- Weight: 795 grams
- Max wind resistance: 38 km/h
"""

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": f"""You are NimbusBot. Answer using ONLY the context below.
If the context doesn't contain the answer, say "I don't know."

Context:
{manual_chunk}"""
        },
        {
            "role": "user",
            "content": "How long does the X1 battery last?"
        }
    ],
    temperature=0
)

print(response.choices[0].message.content)`}
          output={`The X1 battery lasts 28 minutes.`}
        />
        <P>
          <strong>Why it worked:</strong> The system prompt included the manual chunk. The LLM read it and extracted <em>&quot;28 minutes.&quot;</em> It didn&apos;t hallucinate (no guessing). This is <strong>grounding</strong> — the answer is rooted in the provided context.
        </P>
        <P>
          Now test a question NOT in the context:
        </P>
        <CodeBlock
          title="grounding_demo_2.py"
          code={`# Same setup, different question
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": f"""You are NimbusBot. Answer using ONLY the context below.
If the context doesn't contain the answer, say "I don't know."

Context:
{manual_chunk}"""
        },
        {
            "role": "user",
            "content": "What is the warranty period?"
        }
    ],
    temperature=0
)

print(response.choices[0].message.content)`}
          output={`I don't know.`}
        />
        <P>
          Perfect! The warranty info isn&apos;t in the manual chunk, so the LLM said <em>&quot;I don&apos;t know&quot;</em> instead of hallucinating. This is the RAG promise: <strong>retrieval finds the right chunk → LLM reads it → grounded answer</strong>. If retrieval fails, the LLM admits ignorance (no hallucination).
        </P>
      </Section>

      {/* 12 */}
      <Section id="debugging" number="12" title="Debugging & Common Errors">
        <Callout type="mistake">
          ⚠️ <strong>Error 1: AuthenticationError: Incorrect API key</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`python my_script.py`}
          error
          output={`openai.AuthenticationError: Error code: 401 - {'error': {'message': 'Incorrect API key provided: sk-proj-***. You can find your API key at https://platform.openai.com/account/api-keys.', 'type': 'invalid_request_error'}}`}
        />
        <P>
          <strong>Fix:</strong> Check <IC>echo $OPENAI_API_KEY</IC>. Verify it starts with <IC>sk-proj-</IC> or <IC>sk-</IC>. Re-export it if needed.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 2: RateLimitError: You exceeded your current quota</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`python my_script.py`}
          error
          output={`openai.RateLimitError: Error code: 429 - You exceeded your current quota, please check your plan and billing details.`}
        />
        <P>
          <strong>Fix:</strong> You ran out of credits (free trial expired, or you hit your billing limit). Go to <IC>https://platform.openai.com/account/billing</IC>, add a payment method, or wait for your rate limit to reset (if on free tier).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 3: Model &apos;gpt-4o-mini&apos; does not exist</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`python my_script.py`}
          error
          output={`openai.InvalidRequestError: The model 'gpt-4o-mini' does not exist or you do not have access to it.`}
        />
        <P>
          <strong>Fix:</strong> Typo in model name, or your account doesn&apos;t have access. Double-check the model name. Use <IC>gpt-3.5-turbo</IC> if <IC>gpt-4o-mini</IC> isn&apos;t available (older/free-tier accounts).
        </P>
        <P>
          <strong>Debug checklist:</strong>
        </P>
        <CodeBlock
          title="debug_checklist.txt"
          runnable={false}
          code={`1. Print response.usage to see token counts (are you hitting limits?).
2. Print response.choices[0].finish_reason (is it "length" or "stop"?).
3. Print the full messages list before the call (is history growing too large?).
4. Wrap calls in try/except and print the error type + message.
5. Check OpenAI status page: https://status.openai.com (is the API down?).`}
        />
      </Section>

      {/* 13 */}
      <Section id="lab" number="13" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a terminal chatbot with multi-turn memory
──────────────────────────────────────────────────────────────

TASK 1: Set up OpenAI client
  Code:
    from openai import OpenAI
    client = OpenAI()
  Verify: No error (OPENAI_API_KEY is set).

TASK 2: Create a system message
  Code:
    messages = [
        {
            "role": "system",
            "content": "You are NimbusBot, a helpful support agent for Nimbus Gear drones. Be concise."
        }
    ]
  Verify: messages has 1 item.

TASK 3: Build a loop that appends user input
  Code:
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit"]:
            break

        messages.append({"role": "user", "content": user_input})

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0
        )

        assistant_reply = resp.choices[0].message.content
        print(f"NimbusBot: {assistant_reply}")

        messages.append({"role": "assistant", "content": assistant_reply})

  Test dialogue:
    You: My name is Alice.
    NimbusBot: Nice to meet you, Alice! How can I assist you?
    You: What is my name?
    NimbusBot: Your name is Alice.
    You: quit

  Expected: The bot remembers your name (multi-turn works).

TASK 4: Add token tracking
  After each call, print:
    print(f"[Tokens: {resp.usage.total_tokens}]")

  Watch the token count GROW as the conversation lengthens (you're resending history).

TASK 5: Add cost tracking
  After the loop ends, compute total cost:
    total_prompt = sum(usage from all calls)
    total_completion = sum(...)
    cost = (total_prompt * 0.15 + total_completion * 0.60) / 1_000_000
    print(f"Total cost: ${cost:.6f}")

TASK 6: Test a grounded question
  Before the loop, add this to the system message:
    "Context: The Nimbus X1 battery lasts 28 minutes."

  Test:
    You: How long does the X1 battery last?
    NimbusBot: The Nimbus X1 battery lasts 28 minutes.

  Expected: Grounded answer (no hallucination). The context was in the system prompt.

──────────────────────────────────────────────────────────────
BONUS: Add error handling (RateLimitError)
  Wrap the API call in try/except:
    try:
        resp = client.chat.completions.create(...)
    except RateLimitError:
        print("Rate limit hit. Wait 5s and try again.")
        time.sleep(5)
        # Retry logic here`}
        />
      </Section>

      {/* 14 */}
      <Section id="interview" number="14" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["How does the OpenAI chat API work?", "You send a list of messages (role + content) and a model name. The API returns the assistant's reply. It's a REST API (HTTPS POST) — the Python client wraps it. Each call is stateless; you must manually resend history for multi-turn conversations."],
            ["What are the three roles in messages?", "system (behavior instructions, set by developer), user (end-user's input), assistant (model's prior replies, for multi-turn context). Example: system='You are a bot', user='Hello', assistant='Hi there!'"],
            ["Why is the API stateless?", "The API doesn't store conversation history. Every request is independent. If you make two calls with the same client, call 2 doesn't remember call 1. You must manually carry history by appending messages and resending the full list each time."],
            ["How do you implement multi-turn chat?", "Maintain a messages list. After each user input: append {'role':'user','content':...}, call the API, get the reply, append {'role':'assistant','content':reply}. Next turn: append new user message, resend the full messages list. The model sees history and maintains context."],
            ["What is temperature?", "A parameter (0.0-2.0) controlling randomness. 0 = deterministic (same input → same output). 1 = balanced. 2 = very creative. For RAG, use 0 (you want consistent, factual answers). For creative writing, use 1-1.5."],
            ["What is max_tokens?", "Hard limit on output length. If the model generates 500 tokens but max_tokens=100, it stops at 100 (finish_reason='length'). Use it to cap costs or enforce brevity. Omit it to let the model finish naturally (finish_reason='stop')."],
            ["How are LLM calls billed?", "Per token (input + output). gpt-4o-mini: $0.15/1M input tokens, $0.60/1M output. Example: 1,200 input + 300 output = $0.00036. Track usage.prompt_tokens and usage.completion_tokens to monitor spend."],
            ["What is streaming?", "With stream=True, the API sends tokens as they're generated (typewriter effect). You iterate chunks: for chunk in stream: print(chunk.delta.content). Good for UIs (users see progress). Not needed for batch processing."],
            ["What is JSON mode?", "response_format={'type':'json_object'} forces the model to output valid JSON. Useful for structured extraction (e.g., parse support tickets). You must mention 'JSON' in the system prompt or it errors."],
            ["How do you handle API errors?", "Wrap calls in try/except. Catch AuthenticationError (bad key), RateLimitError (quota exceeded), APIError (server issue). For rate limits, retry with exponential backoff (wait 1s, 2s, 4s). Always set a timeout (e.g., 10s)."],
          ]}
        />
      </Section>

      {/* 15 */}
      <Section id="memorize" number="15" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Install", "pip install openai"],
            ["API key env var", "export OPENAI_API_KEY='sk-proj-...'"],
            ["Create client", "from openai import OpenAI; client = OpenAI()"],
            ["Basic call", "resp = client.chat.completions.create(model='gpt-4o-mini', messages=[...])"],
            ["Get reply", "resp.choices[0].message.content"],
            ["Three roles", "system (instructions), user (input), assistant (prior replies)"],
            ["Stateless API", "API forgets history. Manually append messages, resend full list each turn."],
            ["Multi-turn pattern", "messages.append(user_msg); call API; messages.append(assistant_reply)"],
            ["Temperature", "0 = deterministic (RAG), 1-2 = creative (stories)"],
            ["Tokens & cost", "gpt-4o-mini: $0.15/1M input + $0.60/1M output. Track usage.total_tokens"],
            ["JSON mode", "response_format={'type':'json_object'} + 'Return JSON' in prompt"],
            ["Error handling", "try/except: AuthenticationError, RateLimitError. Retry with backoff."],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
