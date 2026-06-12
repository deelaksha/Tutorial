"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Chat completions API call flow",
  nodes: [
    { id: "messages", icon: "💬", label: "messages list", sub: "[system, user]", x: 10, y: 50, color: "#22d3ee" },
    { id: "api", icon: "🌐", label: "OpenAI API", sub: "HTTPS POST", x: 30, y: 50, color: "#a78bfa" },
    { id: "model", icon: "🤖", label: "gpt-4o-mini", sub: "token predictor", x: 50, y: 50, color: "#fb923c" },
    { id: "response", icon: "📝", label: "completion", sub: "text + metadata", x: 70, y: 50, color: "#34d399" },
    { id: "history", icon: "💾", label: "append to history", sub: "for next turn", x: 50, y: 16, color: "#fbbf24" },
    { id: "usage", icon: "💰", label: "usage", sub: "tokens + cost", x: 50, y: 84, color: "#f472b6" },
    { id: "client", icon: "🔍", label: "your Python code", sub: "prints answer", x: 90, y: 50, color: "#60a5fa" },
  ],
  edges: [
    { id: "msg-api", from: "messages", to: "api", color: "#22d3ee" },
    { id: "api-model", from: "api", to: "model", color: "#a78bfa" },
    { id: "model-response", from: "model", to: "response", color: "#fb923c" },
    { id: "response-client", from: "response", to: "client", color: "#34d399" },
    { id: "response-history", from: "response", to: "history", dashed: true, color: "#fbbf24" },
    { id: "response-usage", from: "response", to: "usage", dashed: true, color: "#f472b6" },
    { id: "history-messages", from: "history", to: "messages", bend: -70, dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "happy",
      name: " Single API call",
      command: "client.chat.completions.create(...)",
      steps: [
        { node: "messages", paths: ["msg-api"], text: "You build a messages list: [{'role': 'system', 'content': 'You are NimbusBot.'}, {'role': 'user', 'content': 'Say hello!'}]. This is the prompt you send to the API." },
        { node: "api", paths: ["api-model"], text: "The OpenAI API receives your POST request with messages, model='gpt-4o-mini', and optional params (temperature, max_tokens). It forwards the prompt to the model." },
        { node: "model", paths: ["model-response"], text: "gpt-4o-mini reads the messages and predicts tokens: 'Hello' ❓ '!' ❓ ' Welcome' ❓ ... ❓ stop. It generates a completion: 'Hello! Welcome to Nimbus Gear support.'" },
        { node: "response", paths: ["response-usage", "response-client"], text: "The API returns a response object: {choices: [{message: {content: '...'}}], usage: {prompt_tokens: 18, completion_tokens: 9}}. You get the answer + metadata." },
        { node: "usage", paths: [], text: "Usage data shows 18 input tokens + 9 output tokens. At $0.15/1M input, $0.60/1M output: cost = $0.0000027 + $0.0000054 = $0.0000081 (~1 cent per 1000 calls)." },
        { node: "client", paths: [], text: "Your code reads resp.choices[0].message.content ❓ 'Hello! Welcome to Nimbus Gear support.' Prints it. Single-turn call complete. " },
      ],
    },
    {
      id: "fail",
      name: "L Stateless trap: no memory",
      command: "Ask follow-up without history",
      steps: [
        { node: "messages", paths: ["msg-api"], text: "First call: messages = [{'role': 'user', 'content': 'My name is Alice.'}]. You send it, the model replies 'Nice to meet you, Alice!'" },
        { node: "api", paths: ["api-model"], text: "Second call (NEW request): messages = [{'role': 'user', 'content': 'What is my name?'}]. NO history  you didn't include the first turn!" },
        { node: "model", paths: ["model-response"], text: "The model sees ONLY 'What is my name?'  it has NO memory of 'Alice' (that was a different request). It says 'I don't know your name.' L" },
        { node: "response", paths: ["response-client"], text: "You get: 'I don't know your name.' This is the STATELESS trap. The API remembers NOTHING between calls. You must manually resend history." },
        { node: "client", paths: [], text: "User sees wrong answer. The fix: append the assistant's reply to messages, then send the FULL history on the next call. RAG pipelines must manage this carefully." },
      ],
    },
    {
      id: "power",
      name: "❓ Multi-turn with history",
      command: "Manual memory: resend full conversation",
      steps: [
        { node: "messages", paths: ["msg-api"], text: "Turn 1: messages = [{'role': 'system', 'content': '...'}, {'role': 'user', 'content': 'My name is Alice.'}]. Send, get 'Nice to meet you, Alice!'" },
        { node: "history", paths: ["history-messages"], text: "You append the assistant reply: messages.append({'role': 'assistant', 'content': 'Nice to meet you, Alice!'}). Now messages has 3 items (system, user, assistant)." },
        { node: "messages", paths: ["msg-api"], text: "Turn 2: Append new user message: messages.append({'role': 'user', 'content': 'What is my name?'}). Now messages has 4 items. Send the FULL list." },
        { node: "api", paths: ["api-model"], text: "The API receives all 4 messages. The model sees the ENTIRE conversation: system prompt, 'My name is Alice', assistant reply, new question." },
        { node: "model", paths: ["model-response"], text: "The model reads 'My name is Alice' in the history and answers 'Your name is Alice.' CORRECT! It 'remembered' because you resent the history. ❓" },
        { node: "response", paths: ["response-history", "response-client"], text: "You get the correct answer. Append it to history again for turn 3. This is manual multi-turn: you manage the messages list, the API stays stateless." },
        { node: "client", paths: [], text: "User sees 'Your name is Alice.' Success! This is how chatbots work: loop = get user input ❓ append to messages ❓ call API ❓ append assistant reply ❓ repeat." },
      ],
    },
  ],
};

const NAV = [
  { id: "mental-model", label: "The Chat Completions Mental Model" },
  { id: "install", label: "Install & API Key" },
  { id: "first-call", label: "Your First API Call P" },
  { id: "three-roles", label: "The Three Roles (system, user, assistant)" },
  { id: "stateless", label: "The API is STATELESS P" },
  { id: "temperature", label: "Temperature & max_tokens" },
  { id: "streaming", label: "Streaming (Typewriter Effect)" },
  { id: "tokens-cost", label: "Tokens & Cost Math P" },
  { id: "structured", label: "Structured Output (JSON)" },
  { id: "errors", label: "Error Handling" },
  { id: "grounding-preview", label: "Grounding Preview (Manual + Context)" },
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
      subtitle="You'll call gpt-4o-mini programmatically: send messages, get completions, understand roles (system/user/assistant), handle statelessness, stream responses, calculate costs, and preview grounding (pasting context into the prompt). This is the foundation for RAG  you MUST master LLM APIs before building retrieval systems."
      nav={NAV}
      badges={["🤖 OpenAI API", "🔍 Pure Python", "💰 Cost breakdown", "🎤 Interview-ready"]}
      next={{ icon: "🧲", label: "Embeddings  Meaning as Numbers", href: "/rag/embeddings" }}
      backHref="/rag"
      backLabel="🦜 RAG & LangChain"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="mental-model" number="01" title="The Chat Completions Mental Model">
        <P>
          The OpenAI API (and most LLM APIs) work the same way:
        </P>
        <CodeBlock
          title="mental_model.txt"
          runnable={false}
          code={`YOU ❓ send a LIST of messages ❓ API ❓ LLM ❓ send back ONE message

INPUT:
  [
    {"role": "system", "content": "You are NimbusBot."},
    {"role": "user", "content": "How long does the X1 battery last?"}
  ]

OUTPUT:
  {
    "choices": [{"message": {"role": "assistant", "content": "28 minutes."}}],
    "usage": {"prompt_tokens": 20, "completion_tokens": 4}
  }

                                                                
KEY CONCEPTS:

1. It's just HTTPS (like the Python API track taught).
   POST https://api.openai.com/v1/chat/completions
   Headers: {Authorization: Bearer YOUR_API_KEY, Content-Type: application/json}
   Body: {model: "gpt-4o-mini", messages: [...]}

2. The messages list = your prompt.
   The model reads ALL messages in order, then generates a reply.

3. The API is STATELESS.
   It remembers NOTHING. Every request is independent.
   To "remember" past turns, YOU resend the full history.

4. You get back ONE message (the assistant reply).
   To continue the conversation, append it to messages and call again.

                                                                
COMPARISON TO THE FASTAPI TRACK:

FastAPI (server):         OpenAI API (client):
  You BUILD an API.         You CALL an API.
  @app.get("/menu")         client.chat.completions.create(...)
  Return JSON.              Receive JSON.
  uvicorn runs your code.   OpenAI's servers run the model.

Same protocol (HTTP + JSON), different sides. `}
        />
        <Callout type="analogy">
          🄍 <strong>Restaurant analogy</strong>: Calling the OpenAI API = calling a restaurant. You send your order (messages list: &quot;I want a latte&quot;). The restaurant (API server) processes it (runs the LLM), and sends back the result (&quot;One latte, ready!&quot;). You don&apos;t see the kitchen (model), you just consume the output.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install & API Key">
        <CodeBlock
          title="terminal"
          code={`pip install openai`}
        />
        <P>
          You need an <IC>OPENAI_API_KEY</IC>. Get it from <strong>platform.openai.com</strong> (sign up, create a new API key). NEVER hardcode keys in code  use environment variables:
        </P>
        <CodeBlock
          title="terminal (set env var)"
          code={`export OPENAI_API_KEY="sk-proj-...your-key..."`}
        />
        <CodeBlock
          title="verify_key.py"
          code={`import os
from openai import OpenAI

# The client auto-reads OPENAI_API_KEY from env
client = OpenAI()

print("API key loaded:", os.environ.get("OPENAI_API_KEY")[:10] + "...")
print("Client ready! ")`}
          output={`API key loaded: sk-proj-Ab...
Client ready! `}
        />
        <Callout type="mistake">
          ❓ <strong>NEVER hardcode keys</strong>: <IC>client = OpenAI(api_key=&quot;sk-proj-...&quot;)</IC> = BAD. If you push this to GitHub, your key leaks and attackers drain your account. Use <IC>export OPENAI_API_KEY=...</IC> or a <IC>.env</IC> file (with <IC>python-dotenv</IC>).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="first-call" number="03" title="Your First API Call P">
        <P>
          Let&apos;s call gpt-4o-mini and ask it to say hello:
        </P>
        <CodeBlock
          title="first_call.py"
          code={`from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from env

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Say hello to Nimbus Gear!"}
    ]
)

print("Assistant:", response.choices[0].message.content)`}
          output={`Assistant: Hello, Nimbus Gear! How can I assist you today?`}
        />
        <P>
          <strong>What just happened?</strong>
        </P>
        <CodeBlock
          title="breakdown.txt"
          runnable={false}
          code={`client.chat.completions.create(
    model="gpt-4o-mini",
      ❓
    Which model to use. Options:
      - gpt-4o-mini (cheap, fast, good quality) ❓ use this for RAG
      - gpt-4o (expensive, best quality)
      - gpt-3.5-turbo (older, cheaper than mini)

    messages=[{"role": "user", "content": "Say hello to Nimbus Gear!"}]
      ❓
    A list of message dicts. Each dict has:
      - role: "system", "user", or "assistant"
      - content: the text (string)

    The model reads ALL messages in order, then generates a reply.
)

                                                                
RESPONSE OBJECT:

response = {
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello, Nimbus Gear! How can I assist you today?"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 7,
    "completion_tokens": 11,
    "total_tokens": 18
  }
}

Access the text:
  response.choices[0].message.content  ❓ "Hello, Nimbus Gear! ..."

Access token counts:
  response.usage.prompt_tokens      ❓ 7 (your input)
  response.usage.completion_tokens  ❓ 11 (model's output)

                                                                
WHY choices[0]?

The API can return multiple completions (if you set n=3, you get 3 different
answers). By default n=1, so choices has 1 item. We access choices[0].

                                                                
THIS IS THE FOUNDATION OF RAG.

Later we'll:
  1. Retrieve relevant chunks from our docs.
  2. Add them to the messages list as context.
  3. Call the API (same code, just different messages).
  4. Get a grounded answer.

For now, master the API call. 🎯`}
        />
      </Section>

      {/* 04 */}
      <Section id="three-roles" number="04" title="The Three Roles (system, user, assistant)">
        <P>
          Messages have three roles:
        </P>
        <Table
          head={["Role", "Who", "Purpose", "Example"]}
          rows={[
            [<><IC>system</IC></>, "You (developer)", <>Sets behavior, instructions, persona. The model follows this throughout the conversation.</>, <>&quot;You are NimbusBot, a helpful drone support agent. Be concise.&quot;</>],
            [<><IC>user</IC></>, "End user", <>The user&apos;s question or input.</>, <>&quot;How long does the X1 battery last?&quot;</>],
            [<><IC>assistant</IC></>, "LLM", <>The model&apos;s reply. You also use this to show the model its OWN past replies (for multi-turn chat).</>, <>&quot;The X1 battery lasts 28 minutes.&quot;</>],
          ]}
        />
        <P>
          <strong>Demo: system prompt changes behavior</strong>
        </P>
        <CodeBlock
          title="system_prompt_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

#    Call 1: no system prompt (default polite assistant)   
response1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Tell me about the X1."}
    ]
)
print("No system prompt:")
print(response1.choices[0].message.content)

print("\\n" + "="*60 + "\\n")

#    Call 2: with system prompt (NimbusBot persona)   
response2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are NimbusBot, a concise drone support agent. Answer in 1-2 sentences max."},
        {"role": "user", "content": "Tell me about the X1."}
    ]
)
print("With NimbusBot system prompt:")
print(response2.choices[0].message.content)`}
          output={`No system prompt:
The Nimbus X1 is a consumer drone known for its portability and ease of use. It features a high-quality camera, long battery life, and advanced flight stabilization, making it suitable for both beginners and experienced pilots.

============================================================

With NimbusBot system prompt:
The Nimbus X1 is a portable drone with 28 min battery life, 5 km range, and 4K camera. Great for both beginners and pros.`}
        />
        <P>
          See the difference? The system prompt shaped the <strong>tone and length</strong>. In RAG, we use system prompts to say: &quot;Answer ONLY from the context below. If not in context, say I don&apos;t know.&quot;
        </P>
        <Callout type="tip">
          💡 <strong>Best practice</strong>: ALWAYS use a system prompt in production. It keeps the model on-task. For RAG: system = instructions + retrieved context. User = question.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="stateless" number="05" title="The API is STATELESS P">
        <P>
          <strong>Critical insight</strong>: The API remembers <strong>NOTHING</strong>. Every request is isolated. To &quot;remember&quot; past conversation, YOU must resend the full history.
        </P>
        <CodeBlock
          title="stateless_trap.py"
          code={`from openai import OpenAI

client = OpenAI()

#    Turn 1: User says their name   
response1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "My name is Alice."}
    ]
)
print("Turn 1:")
print(response1.choices[0].message.content)

#    Turn 2: Ask "What is my name?" (NO HISTORY)   
response2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "What is my name?"}  # L NO CONTEXT
    ]
)
print("\\nTurn 2 (no history):")
print(response2.choices[0].message.content)`}
          output={`Turn 1:
Nice to meet you, Alice! How can I assist you today?

Turn 2 (no history):
I don't have access to personal information, so I don't know your name. Could you please tell me?`}
        />
        <P>
          <strong>WRONG!</strong> The model forgot Alice because we didn&apos;t send the first turn. Fix: resend the FULL conversation:
        </P>
        <CodeBlock
          title="stateless_fix.py"
          code={`from openai import OpenAI

client = OpenAI()

# Build the conversation history as a list
messages = []

#    Turn 1   
messages.append({"role": "user", "content": "My name is Alice."})

response1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages
)

assistant_reply = response1.choices[0].message.content
print("Turn 1:", assistant_reply)

# Append the assistant's reply to history
messages.append({"role": "assistant", "content": assistant_reply})

#    Turn 2   
messages.append({"role": "user", "content": "What is my name?"})

response2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages  #  FULL HISTORY (3 messages)
)

print("Turn 2:", response2.choices[0].message.content)

print("\\nFinal messages list:")
for msg in messages:
    print(f"  {msg['role']}: {msg['content'][:50]}...")`}
          output={`Turn 1: Nice to meet you, Alice! How can I assist you today?
Turn 2: Your name is Alice.

Final messages list:
  user: My name is Alice....
  assistant: Nice to meet you, Alice! How can I assist you...
  user: What is my name?...`}
        />
        <P>
          <strong>Success!</strong> The model &quot;remembered&quot; because we sent the full history (user, assistant, user). This is <strong>manual memory management</strong>  you maintain the messages list.
        </P>
        <Callout type="behind">
          ❓ <strong>Behind the scenes</strong>: The model STILL has zero memory. On turn 2, it received 3 messages and processed them like a NEW request. It saw &quot;My name is Alice&quot; in the input and answered accordingly. The API is stateless; YOU are the state keeper.
        </Callout>
        <P>
          <strong>Implication for RAG</strong>: If your chatbot has a 10-turn conversation, you must send all 20 messages (10 user + 10 assistant) on turn 11. Longer history = more tokens = higher cost. Advanced RAG systems truncate old turns or summarize them.
        </P>
      </Section>

      {/* 06 */}
      <Section id="temperature" number="06" title="Temperature & max_tokens">
        <P>
          Two key parameters:
        </P>
        <Table
          head={["Parameter", "What it does", "Range", "When to use"]}
          rows={[
            [<><IC>temperature</IC></>, <>Controls randomness. Low = deterministic, high = creative.</>, <>0.0 to 2.0 (default 1.0)</>, <><IC>temperature=0</IC> for RAG (factual, consistent answers). <IC>temperature=1.0-1.5</IC> for creative writing.</>],
            [<><IC>max_tokens</IC></>, <>Max OUTPUT tokens (model stops after this many). Does NOT limit input.</>, <>1 to context window size</>, <>Set to prevent runaway costs. E.g., <IC>max_tokens=100</IC> = max ~75 words output.</>],
          ]}
        />
        <CodeBlock
          title="temperature_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

prompt = "Complete this: The Nimbus X1 is a"

#    temperature=0 (deterministic)   
resp1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    temperature=0
)
print("temp=0 (run 1):", resp1.choices[0].message.content)

resp2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    temperature=0
)
print("temp=0 (run 2):", resp2.choices[0].message.content)

print("\\n" + "="*60 + "\\n")

#    temperature=1.2 (creative)   
resp3 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    temperature=1.2
)
print("temp=1.2 (run 1):", resp3.choices[0].message.content)

resp4 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    temperature=1.2
)
print("temp=1.2 (run 2):", resp4.choices[0].message.content)`}
          output={`temp=0 (run 1): The Nimbus X1 is a portable consumer drone designed for ease of use.
temp=0 (run 2): The Nimbus X1 is a portable consumer drone designed for ease of use.

============================================================

temp=1.2 (run 1): The Nimbus X1 is a cutting-edge drone that combines agility with advanced camera technology!
temp=1.2 (run 2): The Nimbus X1 is a sleek, high-performance drone perfect for aerial photography enthusiasts.`}
        />
        <P>
          <strong>temp=0</strong>: Identical outputs (deterministic). <strong>temp=1.2</strong>: Different, creative variations. For RAG, use <IC>temperature=0</IC> to get consistent, factual answers.
        </P>
        <CodeBlock
          title="max_tokens_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

#    No max_tokens (model decides when to stop)   
resp1 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain the Nimbus X1."}]
)
print("No max_tokens (output length:", resp1.usage.completion_tokens, "tokens):")
print(resp1.choices[0].message.content)

print("\\n" + "="*60 + "\\n")

#    max_tokens=20 (force short answer)   
resp2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain the Nimbus X1."}],
    max_tokens=20
)
print("max_tokens=20 (output length:", resp2.usage.completion_tokens, "tokens):")
print(resp2.choices[0].message.content)`}
          output={`No max_tokens (output length: 67 tokens):
The Nimbus X1 is a consumer drone featuring a 28-minute battery life, 5 km range, 4K camera, and advanced stabilization. It's designed for both beginners and experienced pilots.

============================================================

max_tokens=20 (output length: 20 tokens):
The Nimbus X1 is a consumer drone with a 28-minute battery life and`}
        />
        <P>
          Notice: <IC>max_tokens=20</IC> cut off mid-sentence. The model hit the token limit and stopped. Use this to cap costs, but set it high enough for complete answers (e.g., 300-500 for RAG).
        </P>
      </Section>

      {/* 07 */}
      <Section id="streaming" number="07" title="Streaming (Typewriter Effect)">
        <P>
          By default, you wait for the FULL response, then print it. With <IC>stream=True</IC>, you get tokens as they&apos;re generated (typewriter effect):
        </P>
        <CodeBlock
          title="streaming_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Explain the Nimbus X1 battery in one sentence."}
    ],
    stream=True  # ❓ Enable streaming
)

print("Streaming output:", end=" ")

for chunk in stream:
    # chunk.choices[0].delta.content = next token(s)
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)

print()  # newline at end`}
          output={`Streaming output: The Nimbus X1 battery provides 28 minutes of flight time and takes 90 minutes to fully charge.`}
        />
        <P>
          <strong>What you see</strong>: The text appears word-by-word (or token-by-token) in real-time, like ChatGPT&apos;s UI. <strong>Why use it?</strong> Better UX (users see progress), lower latency to first token.
        </P>
        <Callout type="note">
          🗌 With streaming, you can&apos;t access <IC>response.usage</IC> until the stream ends. If you need token counts, collect chunks manually or use a non-streaming call.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="tokens-cost" number="08" title="Tokens & Cost Math P">
        <P>
          <strong>Tokens</strong> = chunks of text (a word or part of a word). <strong>Cost</strong> = based on token count.
        </P>
        <Table
          head={["Model", "Input cost (per 1M tokens)", "Output cost (per 1M tokens)", "When to use"]}
          rows={[
            ["gpt-4o-mini", "$0.15", "$0.60", "RAG, chatbots, most use cases (best value)"],
            ["gpt-4o", "$2.50", "$10.00", "Complex reasoning, high-quality writing"],
            ["gpt-3.5-turbo", "$0.50", "$1.50", "Older model, use mini instead"],
          ]}
        />
        <P>
          <strong>Example cost calculation</strong>:
        </P>
        <CodeBlock
          title="cost_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are NimbusBot. Answer concisely."},
        {"role": "user", "content": "How long does the X1 battery last?"}
    ]
)

print("Answer:", response.choices[0].message.content)

# Extract token counts
input_tokens = response.usage.prompt_tokens
output_tokens = response.usage.completion_tokens

print(f"\\nTokens: {input_tokens} input, {output_tokens} output")

# Cost calculation (gpt-4o-mini pricing)
input_cost = (input_tokens / 1_000_000) * 0.15   # $0.15 per 1M
output_cost = (output_tokens / 1_000_000) * 0.60  # $0.60 per 1M
total_cost = input_cost + output_cost

print(f"Cost: \\${input_cost:.6f} (input) + \\${output_cost:.6f} (output) = \\${total_cost:.6f} total")

# Extrapolate to 1000 calls
print(f"\\n1000 calls like this = \\${total_cost * 1000:.4f}")`}
          output={`Answer: The Nimbus X1 battery lasts about 28 minutes on a full charge.

Tokens: 18 input, 14 output
Cost: $0.000003 (input) + $0.000008 (output) = $0.000011 total

1000 calls like this = $0.0110`}
        />
        <P>
          <strong>Key insights</strong>:
        </P>
        <Table
          head={["Insight", "Explanation"]}
          rows={[
            ["Output is 4x more expensive than input", <>gpt-4o-mini: $0.60 vs $0.15 per 1M. Minimize output tokens (use <IC>max_tokens</IC>, concise system prompts).</>],
            ["RAG adds retrieval context to input", <>If you paste 2K tokens of chunks every request, input tokens go up 100x. Still cheap with mini (~$0.0003/call).</>],
            ["Token count ` word count", <>1 token H 0.75 words (English). 100 words H 133 tokens. Use <IC>response.usage</IC> for exact counts.</>],
            ["1000 calls = ~$0.01 with mini", <>At 18 input + 14 output tokens per call. Even with RAG (2K input + 50 output), 1000 calls H $0.33. Mini is CHEAP.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Cost optimization for RAG</strong>: (1) Use gpt-4o-mini (not gpt-4o). (2) Retrieve only top 2-3 chunks (not 10). (3) Use <IC>temperature=0</IC> + <IC>max_tokens=300</IC>. (4) Truncate old chat history after 5-10 turns. This keeps RAG costs under $0.001/query.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="structured" number="09" title="Structured Output (JSON)">
        <P>
          You can ask the model to return JSON (useful for RAG pipelines that parse answers):
        </P>
        <CodeBlock
          title="json_mode.py"
          code={`import json
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant. Return your answer as JSON."
        },
        {
            "role": "user",
            "content": "Give me the Nimbus X1 specs: battery (minutes), range (km), weight (grams)."
        }
    ],
    response_format={"type": "json_object"}  # ❓ Force JSON output
)

answer_text = response.choices[0].message.content
print("Raw output (JSON string):")
print(answer_text)

# Parse JSON
data = json.loads(answer_text)
print("\\nParsed:")
print(f"  Battery: {data['battery']} minutes")
print(f"  Range: {data['range']} km")
print(f"  Weight: {data['weight']} grams")`}
          output={`Raw output (JSON string):
{"battery": 28, "range": 5, "weight": 795}

Parsed:
  Battery: 28 minutes
  Range: 5 km
  Weight: 795 grams`}
        />
        <P>
          <strong>When to use</strong>: Advanced RAG systems that need structured answers (e.g., extract flight time + range + weight from the manual in one call).
        </P>
      </Section>

      {/* 10 */}
      <Section id="errors" number="10" title="Error Handling">
        <P>
          Common errors and how to catch them:
        </P>
        <CodeBlock
          title="error_handling.py"
          code={`from openai import OpenAI, RateLimitError, AuthenticationError, APIError

client = OpenAI()

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello"}],
        timeout=5  # 5 second timeout
    )
    print(response.choices[0].message.content)

except AuthenticationError as e:
    print("L Bad API key:", e)
    # Fix: Check OPENAI_API_KEY env var

except RateLimitError as e:
    print("L Rate limit hit:", e)
    # Fix: Wait and retry (exponential backoff)

except APIError as e:
    print("L API error (server side):", e)
    # Fix: Retry after a delay

except Exception as e:
    print("L Unexpected error:", e)
    # Fix: Check network, model name, etc.`}
          output={`Hello! How can I assist you today?`}
        />
        <P>
          <strong>Production pattern</strong>: Wrap API calls in retry logic (exponential backoff):
        </P>
        <CodeBlock
          title="retry_logic.py"
          code={`import time
from openai import OpenAI, RateLimitError, APIError

client = OpenAI()

def call_with_retry(messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                timeout=10
            )
        except (RateLimitError, APIError) as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                print(f"Error: {e}. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise  # Give up after max_retries

# Test
response = call_with_retry([{"role": "user", "content": "Say hi"}])
print(response.choices[0].message.content)`}
          output={`Hi there! How can I help you today?`}
        />
      </Section>

      {/* 11 */}
      <Section id="grounding-preview" number="11" title="Grounding Preview (Manual + Context)">
        <P>
          <strong>This is the bridge to RAG.</strong> Let&apos;s manually paste context into the prompt and watch the model ground its answer:
        </P>
        <CodeBlock
          title="grounding_demo.py"
          code={`from openai import OpenAI

client = OpenAI()

# Step 1: Hardcode a chunk from manual.md
manual_excerpt = """
Nimbus X1 Specifications:
- Battery flight time: 28 minutes (full charge)
- Battery charge time: 90 minutes
- Range: 5 km
- Weight: 795 g
- Max wind resistance: 38 km/h
"""

# Step 2: Build the prompt with context
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": f"You are NimbusBot. Answer ONLY using the context below. If the answer is not in the context, say 'I don't know.'\\n\\nContext:\\n{manual_excerpt}"
        },
        {
            "role": "user",
            "content": "How long does the X1 battery last?"
        }
    ],
    temperature=0
)

print("Answer:", response.choices[0].message.content)

# Step 3: Test with a question NOT in context
response2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": f"You are NimbusBot. Answer ONLY using the context below. If the answer is not in the context, say 'I don't know.'\\n\\nContext:\\n{manual_excerpt}"
        },
        {
            "role": "user",
            "content": "What is the X1's camera resolution?"  # NOT in context
        }
    ],
    temperature=0
)

print("\\nQuestion not in context:")
print("Answer:", response2.choices[0].message.content)`}
          output={`Answer: The Nimbus X1 battery lasts 28 minutes on a full charge.

Question not in context:
Answer: I don't know.`}
        />
        <P>
          <strong>GROUNDED!</strong> The model:
        </P>
        <Table
          head={["Scenario", "Result"]}
          rows={[
            ["Question in context (battery)", <>Answered correctly: &quot;28 minutes.&quot; It READ the context, didn&apos;t hallucinate.</>],
            ["Question NOT in context (camera)", <>Said &quot;I don&apos;t know.&quot; It DIDN&apos;T hallucinate a resolution. The system prompt kept it honest.</>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>This is RAG without the R.</strong> We manually pasted context. In real RAG, we RETRIEVE the context (using embeddings + vector search) instead of hardcoding it. The generation step (calling the LLM with context) is IDENTICAL. You just did RAG generation! Next chapter: retrieval (embeddings).
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="debugging" number="12" title="Debugging & Common Errors">
        <Callout type="mistake">
          ❓ <strong>Error 1: AuthenticationError: 401 Incorrect API key</strong>
        </Callout>
        <P>
          <strong>Fix</strong>: Check <IC>echo $OPENAI_API_KEY</IC>. If empty, run <IC>export OPENAI_API_KEY=&quot;sk-proj-...&quot;</IC>. If the key is wrong, get a new one from platform.openai.com.
        </P>
        <Callout type="mistake">
          ❓ <strong>Error 2: RateLimitError: 429 You exceeded your current quota</strong>
        </Callout>
        <P>
          <strong>Fix</strong>: You hit your account&apos;s free tier limit or monthly budget. Add payment method at platform.openai.com/account/billing, or wait for quota reset.
        </P>
        <Callout type="mistake">
          ❓ <strong>Error 3: Model not found (e.g., <IC>model=&quot;gpt-5&quot;</IC>)</strong>
        </Callout>
        <P>
          <strong>Fix</strong>: Use valid model names: <IC>gpt-4o-mini</IC>, <IC>gpt-4o</IC>, <IC>gpt-3.5-turbo</IC>. Check platform.openai.com/docs/models.
        </P>
        <Callout type="mistake">
          ❓ <strong>Error 4: Response is cut off mid-sentence</strong>
        </Callout>
        <P>
          <strong>Fix</strong>: You hit <IC>max_tokens</IC>. Increase it (e.g., <IC>max_tokens=500</IC>) or remove the param (model decides).
        </P>
        <P>
          <strong>Debugging tips</strong>:
        </P>
        <CodeBlock
          title="debugging_tips.txt"
          runnable={false}
          code={`1. Print the messages list BEFORE calling the API.
     print("Sending messages:", messages)
   ❓ Verify you're sending what you think you're sending.

2. Print response.usage to see token counts.
     print(f"Used {response.usage.total_tokens} tokens")
   ❓ Catch runaway costs early.

3. Use temperature=0 for deterministic output (easier to debug).

4. Test with a simple prompt first (e.g., "Say hello") to verify API key works.

5. Check response.choices[0].finish_reason:
     "stop"       ❓ normal completion
     "length"     ❓ hit max_tokens (output truncated)
     "content_filter" ❓ triggered safety filter (rare)

6. Wrap calls in try/except and log errors.
     except Exception as e:
         print(f"API error: {e}")
         with open("error.log", "a") as f:
             f.write(f"{e}\\n")`}
        />
      </Section>

      {/* 13 */}
      <Section id="lab" number="13" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build a terminal chatbot with history
                                                                

TASK 1: Setup
  1. Set OPENAI_API_KEY env var.
  2. Create chatbot.py.
  3. Import OpenAI, create client.

TASK 2: System prompt
  Define:
    system_msg = {
      "role": "system",
      "content": "You are NimbusBot, a helpful Nimbus Gear support agent."
    }

  Initialize messages list:
    messages = [system_msg]

TASK 3: Chat loop
  while True:
      user_input = input("You: ")
      if user_input.lower() == "quit":
          break

      messages.append({"role": "user", "content": user_input})

      response = client.chat.completions.create(
          model="gpt-4o-mini",
          messages=messages,
          temperature=0
      )

      assistant_reply = response.choices[0].message.content
      print("Bot:", assistant_reply)

      messages.append({"role": "assistant", "content": assistant_reply})

TASK 4: Test multi-turn
  Run: python chatbot.py
  Conversation:
    You: My drone is the X1.
    Bot: Great! How can I help with your X1?
    You: How long does the battery last?
    Bot: The X1 battery lasts about 28 minutes.
    You: What did I say my drone was?
    Bot: You said your drone is the X1.  ❓  MEMORY WORKS

  The bot remembers because you resent the full history.

TASK 5: Add token usage logging
  After each response, print:
    print(f"(Tokens: {response.usage.total_tokens})")

  Watch tokens grow as history accumulates.

TASK 6: Add grounding (bonus)
  Paste manual excerpt into system prompt (like grounding_demo.py).
  Ask "How long does the battery last?" ❓ should say 28 min (from context).
  Ask "What's the camera resolution?" (not in context) ❓ "I don't know."

                                                                
LEARNING GOALS:

- Build a stateful chatbot (manual history management).
- Observe token growth over time.
- Test grounding (manual RAG generation).
- Debug API errors (bad key, rate limits).`}
        />
      </Section>

      {/* 14 */}
      <Section id="interview" number="14" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["How do you call an LLM from Python?", "Use the OpenAI library: client = OpenAI(), then client.chat.completions.create(model='gpt-4o-mini', messages=[...]). The messages list is your prompt (role + content). The API returns a response with choices[0].message.content (the answer) and usage (token counts)."],
            ["What are the three message roles?", "system (instructions/persona set by you), user (end user's input), assistant (model's replies  you also use this to show the model its own past replies for multi-turn chat). Example: [{role: 'system', ...}, {role: 'user', ...}, {role: 'assistant', ...}]."],
            ["Why is the API stateless?", "The API remembers NOTHING between requests. Every call is independent. To 'remember' past conversation, YOU must resend the full history (all previous user + assistant messages) on each new call. This is manual memory management."],
            ["How do you handle multi-turn chat?", "Maintain a messages list. After each call: (1) append the user's message, (2) call the API with the full messages list, (3) append the assistant's reply to messages. Repeat. The list grows: [system, user1, asst1, user2, asst2, ...]. The model 'remembers' by reading history."],
            ["What is temperature?", "Controls randomness. 0.0 = deterministic (same input ❓ same output), 1.0 = default, 2.0 = very creative. For RAG, use temperature=0 to get consistent, factual answers. For creative writing, use 1.0-1.5."],
            ["What is max_tokens?", "The maximum number of OUTPUT tokens the model can generate. It does NOT limit input tokens. Use it to cap costs (e.g., max_tokens=100 = ~75 words max). If the model hits this limit, it stops mid-sentence (finish_reason='length')."],
            ["How do you calculate cost?", "Cost = (input_tokens / 1M) ❓ input_price + (output_tokens / 1M) ❓ output_price. Example (gpt-4o-mini): 1000 input tokens + 500 output tokens = (1000/1M)❓$0.15 + (500/1M)❓$0.60 = $0.00015 + $0.0003 = $0.00045. Check response.usage for token counts."],
            ["Why use gpt-4o-mini for RAG?", "It's cheap ($0.15/1M input, $0.60/1M output  10x cheaper than gpt-4o), fast (~1 sec latency), and good quality for factual Q&A. RAG adds retrieval context (2K tokens), so input cost is still low. Mini is the best value for most RAG use cases."],
            ["What is streaming?", "stream=True makes the API return tokens as they're generated (typewriter effect). You iterate over chunks and print delta.content in real-time. Better UX (users see progress), lower latency to first token. Trade-off: you can't access response.usage until the stream ends."],
            ["How do you ground an LLM answer?", "Paste context into the prompt (usually system message): 'Answer ONLY from the context below: [paste chunks]. If not in context, say I don't know.' Set temperature=0. The model reads the context and generates a grounded answer. This is RAG generation (retrieval comes next)."],
            ["Common errors and fixes?", "401 AuthenticationError ❓ bad API key (check OPENAI_API_KEY env). 429 RateLimitError ❓ quota exceeded (add payment or wait). Model not found ❓ use valid names (gpt-4o-mini, gpt-4o). Truncated output ❓ increase max_tokens. Always wrap calls in try/except and retry with backoff."],
            ["What's the difference between input and output cost?", "Output tokens are MORE expensive (e.g., gpt-4o-mini: $0.60/1M output vs $0.15/1M input = 4x). Minimize output (use max_tokens, concise prompts). RAG adds context to INPUT (cheap). Optimize by retrieving only top 2-3 chunks, not 10."],
          ]}
        />
      </Section>

      {/* 15 */}
      <Section id="memorize" number="15" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Install", "pip install openai; export OPENAI_API_KEY=sk-proj-..."],
            ["First call", "from openai import OpenAI; client = OpenAI(); client.chat.completions.create(model='gpt-4o-mini', messages=[...])"],
            ["Three roles", "system (instructions), user (input), assistant (model reply  also for history)"],
            ["Stateless API", "API remembers NOTHING  YOU resend full messages list every call (manual history)"],
            ["Get answer", "response.choices[0].message.content ❓ the text; response.usage ❓ token counts"],
            ["Multi-turn pattern", "messages.append(user_msg) ❓ call API ❓ messages.append(assistant_reply) ❓ repeat"],
            ["Temperature", "0 = deterministic (RAG), 1 = default, 1.5 = creative (use 0 for factual answers)"],
            ["Max tokens", "max_tokens=100 ❓ max ~75 words output (caps cost, may truncate mid-sentence)"],
            ["Cost formula", "(input_tokens/1M)❓$0.15 + (output_tokens/1M)❓$0.60 (gpt-4o-mini)"],
            ["Streaming", "stream=True ❓ iterate chunks, print delta.content (typewriter effect, better UX)"],
            ["Grounding", "Paste context in system prompt: 'Answer from context: [chunks]. If not in context, say I don't know.'"],
            ["Error handling", "try/except: AuthenticationError (bad key), RateLimitError (quota), APIError (retry with backoff)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
