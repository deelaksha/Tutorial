"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "One API call: the full round trip",
  nodes: [
    { id: "you", icon: "🧑", label: "Your code", sub: "client", x: 6, y: 50, color: "#22d3ee" },
    { id: "internet", icon: "🌍", label: "Internet", sub: "", x: 24, y: 50, color: "#a78bfa" },
    { id: "server", icon: "🏢", label: "API server", sub: "brewbean.dev", x: 44, y: 50, color: "#34d399" },
    { id: "router", icon: "🧭", label: "Route matcher", sub: "/menu → handler", x: 64, y: 22, color: "#fbbf24" },
    { id: "handler", icon: "⚙️", label: "Handler function", sub: "Python", x: 64, y: 78, color: "#fb923c" },
    { id: "db", icon: "🗃️", label: "Data", sub: "", x: 84, y: 78, color: "#60a5fa" },
    { id: "resp", icon: "📦", label: "JSON response", sub: "200 OK", x: 84, y: 22, color: "#34d399" },
  ],
  edges: [
    { id: "you-internet", from: "you", to: "internet", color: "#22d3ee" },
    { id: "internet-server", from: "internet", to: "server", color: "#a78bfa" },
    { id: "server-router", from: "server", to: "router", color: "#fbbf24" },
    { id: "router-handler", from: "router", to: "handler", color: "#fb923c" },
    { id: "handler-db", from: "handler", to: "db", color: "#60a5fa" },
    { id: "db-handler", from: "db", to: "handler", dashed: true, color: "#60a5fa" },
    { id: "handler-resp", from: "handler", to: "resp", color: "#34d399" },
    { id: "resp-you", from: "resp", to: "you", bend: -80, color: "#34d399" },
  ],
  flows: [
    {
      id: "happy",
      name: "📥 GET /menu",
      command: "GET /menu → 200 OK",
      steps: [
        { node: "you", paths: ["you-internet"], text: "Your Python code sends an HTTP request: GET /menu. The request travels through the internet as a text message following the HTTP protocol." },
        { node: "internet", paths: ["internet-server"], text: "The internet routes your request to the API server at brewbean.dev (DNS translates the domain to an IP address like 203.0.113.45)." },
        { node: "server", paths: ["server-router"], text: "The server receives the request and hands it to the route matcher. The matcher looks at the path (/menu) and method (GET)." },
        { node: "router", paths: ["router-handler"], text: "Route matched! The router calls the handler function registered for GET /menu. This is the Python code that runs on the server." },
        { node: "handler", paths: ["handler-db"], text: "The handler reads data from the database or in-memory store. For /menu, it fetches the list of items: Latte, Cappuccino, Espresso, Croissant." },
        { node: "db", paths: ["db-handler"], text: "Data flows back to the handler: [{'id':1,'name':'Latte','price':180}, ...]. The handler formats this as a response." },
        { node: "resp", paths: ["resp-you"], text: "Handler returns: HTTP/1.1 200 OK, Content-Type: application/json, body: [{...}, {...}]. This travels back through the internet to your code." },
        { node: "you", paths: [], text: "Your code receives the response! You parse the JSON body into a Python list of dicts. ✅ The round trip is complete." },
      ],
    },
    {
      id: "fail",
      name: "❌ 404 Not Found",
      command: "GET /menus (typo) → 404",
      steps: [
        { node: "you", paths: ["you-internet"], text: "Your code sends GET /menus — a typo! The 's' at the end doesn't match any route." },
        { node: "internet", paths: ["internet-server"], text: "Request travels normally; the internet doesn't validate paths, it just delivers the message." },
        { node: "server", paths: ["server-router"], text: "Server receives the request and asks the route matcher: do we have a handler for GET /menus?" },
        { node: "router", paths: ["resp-you"], text: "No match found. Router returns: HTTP/1.1 404 Not Found, body: {'error': 'Endpoint not found'}. Red flag: client mistake. 🚨" },
        { node: "resp", paths: ["resp-you"], text: "The 404 response (error) travels back to your code. Status code 404 means: valid request, but the resource doesn't exist." },
        { node: "you", paths: [], text: "Your code receives status_code=404. You check r.status_code and see it's not 200 — something went wrong. Fix the typo: /menu not /menus." },
      ],
    },
    {
      id: "power",
      name: "⚡ POST /orders",
      command: "POST /orders + JSON body → 201 Created",
      steps: [
        { node: "you", paths: ["you-internet"], text: "Your code sends POST /orders with a JSON body: {'items': [1, 3], 'customer_id': 'C001'}. POST means create something new." },
        { node: "internet", paths: ["internet-server"], text: "Request carries both a method (POST), a path (/orders), headers (Content-Type: application/json), and a body (the JSON data)." },
        { node: "server", paths: ["server-router"], text: "Server receives the request. Router matches POST /orders to the create_order handler." },
        { node: "router", paths: ["router-handler"], text: "Handler is called with the request body. It validates: are items valid menu IDs? Is customer_id present?" },
        { node: "handler", paths: ["handler-db"], text: "Validation passes. Handler calculates total (item 1 = ₹180, item 3 = ₹90 → ₹270), generates order ID, writes to database." },
        { node: "db", paths: ["db-handler"], text: "Database confirms: order #1042 created. Handler prepares a response with the new order details." },
        { node: "resp", paths: ["resp-you"], text: "Handler returns: HTTP/1.1 201 Created (201 = successfully created a resource), body: {'order_id': 1042, 'total': 270, 'status': 'pending'}." },
        { node: "you", paths: [], text: "Your code receives 201! You know the order was created. Parse the JSON to get the new order_id. POST completed successfully. 🎉" },
      ],
    },
  ],
};

const NAV = [
  { id: "what", label: "What Even Is an API?" },
  { id: "waiter", label: "The Waiter Analogy 🍽️" },
  { id: "client-server", label: "Client & Server — Defined" },
  { id: "url", label: "URLs Decoded" },
  { id: "http", label: "HTTP — The Language" },
  { id: "verbs", label: "The 4 HTTP Verbs ⭐" },
  { id: "status", label: "Status Codes That Matter ⭐" },
  { id: "json", label: "JSON from Zero" },
  { id: "endpoints", label: "What Is an Endpoint?" },
  { id: "first-call", label: "Your First API Call (No Library!)" },
  { id: "debugging", label: "Debugging & Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiIntroPage() {
  return (
    <TopicShell
      icon="🌐"
      title="APIs from Zero — What Even Is an API?"
      gradientWord="API"
      subtitle="APIs power every app you use — Instagram, Google Maps, your bank. An API lets programs talk to each other over the internet. You'll go from zero knowledge to calling real APIs and understanding every piece of the request-response cycle."
      nav={NAV}
      badges={["🌍 HTTP from scratch", "📡 Request-response cycle", "🔧 curl & browser dev tools", "🧠 REST basics"]}
      next={{ icon: "📡", label: "Calling APIs with requests", href: "/python/api-requests" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what" number="01" title="What Even Is an API?">
        <P>
          <strong>API</strong> = <strong>Application Programming Interface</strong>. That definition is useless. Here&apos;s the real one:
        </P>
        <P>
          An API is a <strong>way for programs to talk to each other</strong>. Instead of humans clicking buttons, programs send messages over the internet and get data back. When you open Instagram, the app doesn&apos;t store every photo on your phone — it <strong>asks Instagram&apos;s API</strong> for your feed, and the API <strong>responds</strong> with JSON data (a list of posts, usernames, images). Your app then displays it.
        </P>
        <Callout type="analogy">
          🌍 Think of an API as a <strong>restaurant waiter</strong>. You (the customer) don&apos;t go into the kitchen and cook. You tell the waiter (the API) what you want. The waiter goes to the kitchen (the server/database), gets your food (the data), and brings it back. You never see the kitchen — you just get results.
        </Callout>
        <P>
          APIs are <strong>everywhere</strong>:
        </P>
        <Table
          head={["When you...", "What&apos;s happening (API call)"]}
          rows={[
            ["Check the weather on your phone", "Weather app → calls OpenWeather API → gets temperature JSON → displays 28°C"],
            ["Log in with Google on a new site", "Site → calls Google OAuth API → Google confirms your identity → you&apos;re logged in"],
            ["Search Google Maps for &quot;coffee near me&quot;", "Maps app → calls Google Places API → gets [{name: 'Brew & Bean', lat: ..., lng: ...}] → shows pins on map"],
            ["Send money via UPI", "Payment app → calls bank API → transfers ₹500 → returns success/failure"],
          ]}
        />
        <P>
          Without APIs, every app would be an isolated island. APIs are the bridges.
        </P>
      </Section>

      {/* 02 */}
      <Section id="waiter" number="02" title="The Waiter Analogy 🍽️">
        <P>
          This analogy will carry you through the entire track. Lock it in:
        </P>
        <CodeBlock
          title="waiter_analogy.txt"
          runnable={false}
          code={`🍽️  THE RESTAURANT ANALOGY

YOU (customer)           →  YOUR PYTHON CODE (client)
WAITER                   →  THE API
KITCHEN + CHEF           →  THE SERVER & DATABASE
MENU                     →  API DOCUMENTATION (what you can order)
YOUR ORDER               →  HTTP REQUEST (GET /menu, POST /orders, etc.)
FOOD ARRIVES             →  HTTP RESPONSE (JSON data, status 200 OK)

────────────────────────────────────────────────────────────────
SCENARIO 1: You ask for the menu
  - You: "Can I see the menu?"               → GET /menu
  - Waiter: goes to kitchen, grabs menu      → server fetches data
  - Waiter: brings menu back                 → 200 OK + JSON [{...}, {...}]
  - You: read menu, decide what to order     → your code parses JSON

SCENARIO 2: You place an order
  - You: "I want a Latte and Croissant"      → POST /orders {"items": [1, 4]}
  - Waiter: takes order to kitchen           → server validates & saves
  - Kitchen: cooks, assigns order number     → database writes order #1042
  - Waiter: "Your order #1042, ₹300 total"   → 201 Created + JSON {order_id: 1042}

SCENARIO 3: You ask for an item not on the menu
  - You: "Do you have sushi?"                → GET /sushi
  - Waiter: "We don't serve that"            → 404 Not Found
  - You: order something else                → retry with valid endpoint

────────────────────────────────────────────────────────────────
KEY INSIGHT: You NEVER enter the kitchen. You don't see the database,
the Python code running on the server, or how the data is stored.
You just send a request and get a response. That's the API contract. ✅`}
        />
        <Callout type="note">
          📌 The <strong>client</strong> is the one making the request (you, the customer). The <strong>server</strong> is the one responding (the kitchen). The <strong>API</strong> is the interface in between (the waiter, following the rules of HTTP).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="client-server" number="03" title="Client & Server — Defined">
        <P>
          Every API interaction involves two roles:
        </P>
        <Table
          head={["Role", "What it does", "Examples"]}
          rows={[
            [<strong>Client</strong>, "Sends a request asking for something (data, action). Initiates the conversation.", "Your Python script, a browser, a mobile app, curl"],
            [<strong>Server</strong>, "Receives the request, processes it (reads database, runs code), sends a response back.", "Flask/FastAPI/Node.js app running on brewbean.dev, Instagram's servers, Google's servers"],
          ]}
        />
        <CodeBlock
          title="client_server_visualization.txt"
          runnable={false}
          code={`CLIENT (your laptop)          SERVER (brewbean.dev, hosted on AWS)
     🧑 your_script.py              🏢 FastAPI app + database
         │                               │
         │  ──────  REQUEST  ──────>     │   "GET /menu"
         │                               │   (server reads database)
         │  <──────  RESPONSE  ──────    │   "200 OK + JSON [{...}]"
         │                               │

The client is active (asks questions).
The server is passive (waits for requests, then responds).

────────────────────────────────────────────────────────────────
REAL EXAMPLES:

Client: Instagram app on your phone
Server: Instagram's API servers (dozens of machines in data centers)
Request: "GET /feed" → show me my feed
Response: JSON with 20 posts

Client: Your Python script
Server: https://api.brewbean.dev
Request: "POST /orders" with JSON body → create an order
Response: "201 Created" + new order details

────────────────────────────────────────────────────────────────
ONE PROGRAM CAN BE BOTH!

Your FastAPI app is a SERVER when your friend's script calls it.
Your FastAPI app is a CLIENT when IT calls the Google Maps API.

Role = whoever is initiating the request at that moment. 🔄`}
        />
      </Section>

      {/* 04 */}
      <Section id="url" number="04" title="URLs Decoded">
        <P>
          A <strong>URL</strong> (Uniform Resource Locator) is the address of a resource on the internet. Every API request starts with a URL. Let&apos;s break one down piece by piece:
        </P>
        <CodeBlock
          title="url_anatomy.txt"
          runnable={false}
          code={`https://api.brewbean.dev:443/menu/1?details=true
│       │                   │   │      │
│       │                   │   │      └─ QUERY STRING (optional filters/params)
│       │                   │   │            ?key=value&key2=value2
│       │                   │   │
│       │                   │   └──────── PATH (which resource you want)
│       │                   │               /menu, /menu/1, /orders, /orders/7
│       │                   │
│       │                   └──────────── PORT (optional, defaults: 80 for http, 443 for https)
│       │                                   You rarely see it written explicitly.
│       │
│       └──────────────────────────────── HOST / DOMAIN (which server to talk to)
│                                           DNS translates this to an IP: 203.0.113.45
│
└──────────────────────────────────────── SCHEME (protocol: http or https)
                                            https = encrypted (secure), http = plain text

────────────────────────────────────────────────────────────────
EXAMPLES:

https://api.brewbean.dev/menu
  → scheme: https, host: api.brewbean.dev, path: /menu, no query

https://api.brewbean.dev/menu/1
  → same, but path is /menu/1 (requesting item with ID 1)

https://api.brewbean.dev/orders?customer_id=C001&status=pending
  → path: /orders, query: customer_id=C001 AND status=pending (filters)

http://127.0.0.1:8000/menu
  → your LOCAL server (127.0.0.1 = localhost = your own machine)
  → port 8000 (dev server), path /menu

────────────────────────────────────────────────────────────────
KEY INSIGHT: The PATH is what changes between API calls to the same server.
  GET https://api.brewbean.dev/menu       → list all menu items
  GET https://api.brewbean.dev/menu/1     → get item #1
  POST https://api.brewbean.dev/orders    → create a new order
  GET https://api.brewbean.dev/orders/7   → get order #7
  DELETE https://api.brewbean.dev/orders/7 → cancel order #7

The HOST (api.brewbean.dev) stays the same. The PATH + HTTP method define WHAT you're doing. 🎯`}
        />
        <Callout type="tip">
          💡 <strong>Always use https in production</strong> (not http). http sends data in plain text — anyone on the network can read your passwords, API keys, etc. https encrypts everything. Most APIs refuse http requests.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="http" number="05" title="HTTP — The Language">
        <P>
          <strong>HTTP</strong> = HyperText Transfer Protocol. It&apos;s the language clients and servers use to talk. Every HTTP message has the same structure: a <strong>method</strong> (verb), a <strong>path</strong>, <strong>headers</strong> (metadata), and optionally a <strong>body</strong> (data payload).
        </P>
        <P>
          Here&apos;s what a raw HTTP request and response look like (what travels over the internet as plain text):
        </P>
        <CodeBlock
          title="raw_http_request.txt"
          runnable={false}
          code={`──────────────────────────────────────────────────────────────
RAW HTTP REQUEST (what your code sends)
──────────────────────────────────────────────────────────────

GET /menu HTTP/1.1                     ← METHOD PATH HTTP-VERSION
Host: api.brewbean.dev                 ← HEADER: which server
User-Agent: Python/3.11 requests/2.31  ← HEADER: who's asking
Accept: application/json               ← HEADER: I want JSON back
                                       ← BLANK LINE (separates headers from body)
                                       ← (no body for GET requests)

──────────────────────────────────────────────────────────────
ANATOMY:
  Line 1: METHOD (GET) + PATH (/menu) + HTTP version
  Lines 2-4: HEADERS (key: value pairs, metadata about the request)
  Blank line: signals end of headers
  Body: (optional, for POST/PUT) — would come after the blank line

──────────────────────────────────────────────────────────────
RAW HTTP RESPONSE (what the server sends back)
──────────────────────────────────────────────────────────────

HTTP/1.1 200 OK                        ← HTTP-VERSION STATUS-CODE STATUS-TEXT
Content-Type: application/json         ← HEADER: response format
Content-Length: 312                    ← HEADER: body size in bytes
Date: Fri, 12 Jun 2026 10:32:15 GMT    ← HEADER: timestamp
                                       ← BLANK LINE
[{"id":1,"name":"Latte","price":180},{"id":2,"name":"Cappuccino","price":160}]
│                                      │
└──────────── BODY (JSON) ─────────────┘

──────────────────────────────────────────────────────────────
ANATOMY:
  Line 1: HTTP version + STATUS CODE (200) + status text (OK)
  Lines 2-4: HEADERS (server tells you about the response)
  Blank line: separates headers from body
  Body: the actual data (JSON, HTML, XML, binary image, etc.)

──────────────────────────────────────────────────────────────
KEY INSIGHT: HTTP is TEXT-BASED. If you opened a raw TCP connection
to port 443 and typed the request above, you'd get the response back.
Libraries like requests/curl just automate this formatting for you. 🚀`}
        />
        <Callout type="behind">
          ⚙️ <strong>Behind the scenes</strong>: When you call <IC>requests.get(&quot;https://api.brewbean.dev/menu&quot;)</IC>, the requests library builds the raw HTTP text above, opens a TCP connection to the server, sends it, waits for the response text, parses it into a response object, and gives you <IC>r.status_code</IC>, <IC>r.headers</IC>, <IC>r.json()</IC>. You never see the raw text — but it&apos;s always there.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="verbs" number="06" title="The 4 HTTP Verbs ⭐">
        <P>
          HTTP has many methods (verbs), but <strong>95% of APIs use just 4</strong>. Each verb has a meaning — a convention that every API follows:
        </P>
        <Table
          head={["Verb", "Meaning", "Brew & Bean example", "Idempotent?"]}
          rows={[
            [<IC>GET</IC>, <><strong>Read</strong> data. Fetch a resource. Never changes anything on the server.</>, <><IC>GET /menu</IC> → list all items. <IC>GET /menu/1</IC> → fetch item #1.</>, "✅ Yes (safe to retry)"],
            [<IC>POST</IC>, <><strong>Create</strong> something new. Send data in the body.</>, <><IC>POST /orders</IC> with body <IC>{`{"items": [1, 3]}`}</IC> → create order.</>, "❌ No (creates duplicates if retried)"],
            [<IC>PUT</IC>, <><strong>Update</strong> (replace) an existing resource entirely.</>, <><IC>PUT /menu/1</IC> with body <IC>{`{"name": "Iced Latte", "price": 200}`}</IC> → overwrite item 1.</>, "✅ Yes (same update twice = same result)"],
            [<IC>PATCH</IC>, <><strong>Partially update</strong> a resource (change one field).</>, <><IC>PATCH /menu/1</IC> with <IC>{`{"price": 190}`}</IC> → only update price, keep name.</>, "✅ Yes"],
            [<IC>DELETE</IC>, <><strong>Remove</strong> a resource.</>, <><IC>DELETE /orders/7</IC> → cancel order #7.</>, "✅ Yes (deleting twice = same result: gone)"],
          ]}
        />
        <Callout type="note">
          📌 <strong>Idempotent</strong> means: doing it multiple times has the same effect as doing it once. GET /menu 5 times = same result. DELETE /orders/7 twice = order still deleted (second call is a no-op). POST /orders twice = two different orders created (NOT idempotent).
        </Callout>
        <CodeBlock
          title="verb_memory_trick.txt"
          runnable={false}
          code={`HTTP VERB → DATABASE ACTION (mental model)

GET     →  SELECT (read rows, never change data)
POST    →  INSERT (add a new row)
PUT     →  UPDATE (overwrite entire row)
PATCH   →  UPDATE (change specific columns)
DELETE  →  DELETE (remove a row)

────────────────────────────────────────────────────────────────
FULL CRUD (Create, Read, Update, Delete):

CREATE  → POST /orders             (add new order)
READ    → GET /orders              (list all orders)
          GET /orders/7            (fetch one order)
UPDATE  → PUT /orders/7            (replace order 7)
          PATCH /orders/7          (tweak order 7)
DELETE  → DELETE /orders/7         (remove order 7)

This pattern is called REST — we'll explain that next. 🎯`}
        />
      </Section>

      {/* 07 */}
      <Section id="status" number="07" title="Status Codes That Matter ⭐">
        <P>
          Every HTTP response includes a <strong>status code</strong> — a 3-digit number that tells you if the request succeeded or failed, and WHY it failed. Memorize these:
        </P>
        <Table
          head={["Code", "Name", "Meaning", "Example"]}
          rows={[
            ["200", "OK", "✅ Success! Request worked, here's the data.", <><IC>GET /menu</IC> → 200 + menu JSON</>],
            ["201", "Created", "✅ Successfully created a new resource.", <><IC>POST /orders</IC> → 201 + new order details</>],
            ["204", "No Content", "✅ Success, but no data to return (often after DELETE).", <><IC>DELETE /orders/7</IC> → 204 (no body)</>],
            ["301", "Moved Permanently", "🔀 Resource moved to a new URL (redirect).", <><IC>GET /old-menu</IC> → 301, Location: /menu</>],
            ["400", "Bad Request", "❌ YOUR mistake: malformed request, invalid JSON, missing field.", <><IC>POST /orders</IC> with <IC>{`{"item": "abc"}`}</IC> → 400 &quot;item must be an int&quot;</>],
            ["401", "Unauthorized", "❌ YOU forgot to authenticate (missing/invalid API key).", <><IC>GET /orders</IC> without header → 401 &quot;API key required&quot;</>],
            ["403", "Forbidden", "❌ YOU are authenticated but not allowed to do this.", <><IC>DELETE /orders/999</IC> (not yours) → 403 &quot;Access denied&quot;</>],
            ["404", "Not Found", "❌ The endpoint or resource doesn't exist. Typo?", <><IC>GET /menus</IC> (should be /menu) → 404</>],
            ["422", "Unprocessable Entity", "❌ Request is valid JSON but fails validation rules.", <><IC>POST /orders</IC> <IC>{`{"items": []}`}</IC> → 422 &quot;items can&apos;t be empty&quot;</>],
            ["500", "Internal Server Error", "🔥 THEIR mistake: server crashed, bug in their code.", <><IC>GET /menu</IC> → 500 (database is down, their problem)</>],
          ]}
        />
        <CodeBlock
          title="status_code_memory_trick.txt"
          runnable={false}
          code={`STATUS CODE MENTAL MODEL (memorize this pattern):

2xx = SUCCESS ✅
  200 OK, 201 Created, 204 No Content
  → Your request worked. Parse the response body (if any).

3xx = REDIRECT 🔀
  301 Moved Permanently, 302 Found, 304 Not Modified
  → Resource moved or cached. Follow the redirect (libraries do this automatically).

4xx = YOU MESSED UP ❌ (client error)
  400 Bad Request  → your data is malformed
  401 Unauthorized → you didn't authenticate
  403 Forbidden    → you're authenticated but not allowed
  404 Not Found    → endpoint/resource doesn't exist
  422 Unprocessable → your data failed validation
  → Fix YOUR code: check spelling, add API key, validate input.

5xx = THEY MESSED UP 🔥 (server error)
  500 Internal Server Error → their code crashed
  502 Bad Gateway  → their proxy/load balancer is down
  503 Service Unavailable → server overloaded or in maintenance
  → Wait and retry. It's THEIR bug, not yours. Report to their support.

────────────────────────────────────────────────────────────────
INTERVIEW TRICK QUESTION:
"What's the difference between 401 and 403?"

401 = Who are you? (you didn't prove your identity)
403 = I know who you are, but you can't do this. (permission denied)

Example:
  GET /orders without API key → 401 "Authenticate first"
  GET /orders WITH valid key → 403 "You don't own this order" ❌`}
        />
        <Callout type="tip">
          💡 <strong>Always check status_code BEFORE parsing the body.</strong> If you get a 404, calling <IC>r.json()</IC> might crash because the body is HTML (error page), not JSON. Rule: if status &lt; 400, proceed. Otherwise, read the error body as text.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="json" number="08" title="JSON from Zero">
        <P>
          <strong>JSON</strong> (JavaScript Object Notation) is the universal data format for APIs. It looks almost identical to Python dicts and lists — by design. Here&apos;s how Python types map to JSON:
        </P>
        <Table
          head={["Python", "JSON", "Example"]}
          rows={[
            [<IC>dict</IC>, <><IC>{`{}`}</IC> (object)</>, <IC>{`{"name": "Latte", "price": 180}`}</IC>],
            [<IC>list</IC>, <><IC>[]</IC> (array)</>, <><IC>{`[1, 2, 3]`}</IC> or <IC>{`[{...}, {...}]`}</IC></>],
            [<IC>str</IC>, <><IC>&quot;...&quot;</IC> (double quotes ONLY)</>, <IC>&quot;Brew &amp; Bean&quot;</IC>],
            [<IC>int / float</IC>, "number", <><IC>180</IC> or <IC>3.14</IC></>],
            [<IC>True / False</IC>, <><IC>true / false</IC> (lowercase)</>, <><IC>true</IC> not <IC>True</IC></>],
            [<IC>None</IC>, <IC>null</IC>, <><IC>null</IC> not <IC>None</IC></>],
          ]}
        />
        <CodeBlock
          title="json_python_demo.py"
          code={`import json

# PYTHON → JSON (serialize, dump)
menu = [
    {"id": 1, "name": "Latte", "price": 180},
    {"id": 2, "name": "Cappuccino", "price": 160},
]

json_string = json.dumps(menu)
print("JSON string:")
print(json_string)
print(type(json_string))

# JSON → PYTHON (deserialize, load)
response_text = '{"order_id": 1042, "total": 270, "items": [1, 3]}'
data = json.loads(response_text)
print("\\nParsed back to Python:")
print(data)
print(type(data))
print("Order ID:", data["order_id"])`}
          output={`JSON string:
[{"id": 1, "name": "Latte", "price": 180}, {"id": 2, "name": "Cappuccino", "price": 160}]
<class 'str'>

Parsed back to Python:
{'order_id': 1042, 'total': 270, 'items': [1, 3]}
<class 'dict'>
Order ID: 1042`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Python uses single quotes <IC>&apos;key&apos;</IC> and <IC>True/False/None</IC>. JSON ONLY accepts double quotes <IC>&quot;key&quot;</IC> and <IC>true/false/null</IC> (lowercase). If you hand-write JSON with single quotes, it&apos;s invalid. Always use <IC>json.dumps()</IC> to generate JSON, never f-strings.
        </Callout>
        <P>
          When an API responds with JSON, the response body is a string. You parse it with <IC>json.loads()</IC> to get a Python dict/list. The requests library has a shortcut: <IC>r.json()</IC> does <IC>json.loads(r.text)</IC> for you.
        </P>
      </Section>

      {/* 09 */}
      <Section id="endpoints" number="09" title="What Is an Endpoint?">
        <P>
          An <strong>endpoint</strong> is a specific URL + HTTP method combination that does ONE thing. Think of it as a function that lives on the server — you call it by sending an HTTP request.
        </P>
        <P>
          Here are the Brew &amp; Bean API endpoints (our running example for the entire track):
        </P>
        <Table
          head={["Method", "Endpoint", "What it does", "Request body?", "Response"]}
          rows={[
            [<IC>GET</IC>, <IC>/menu</IC>, "List all menu items", "No", <IC>{`[{id:1, name:"Latte", price:180}, ...]`}</IC>],
            [<IC>GET</IC>, <IC>/menu/1</IC>, "Get menu item with ID 1", "No", <IC>{`{id:1, name:"Latte", category:"Drink", price:180}`}</IC>],
            [<IC>POST</IC>, <IC>/orders</IC>, "Create a new order", <IC>{`Yes: {"items":[1,3], "customer_id":"C001"}`}</IC>, <IC>{`{order_id:1042, total:270, status:"pending"}`}</IC>],
            [<IC>GET</IC>, <IC>/orders/7</IC>, "Get order with ID 7", "No", <IC>{`{order_id:7, items:[...], total:180, ...}`}</IC>],
            [<IC>DELETE</IC>, <IC>/orders/7</IC>, "Cancel order #7", "No", <IC>204 No Content</IC>],
          ]}
        />
        <CodeBlock
          title="endpoint_anatomy.txt"
          runnable={false}
          code={`ENDPOINT = METHOD + PATH

GET /menu          ← one endpoint (fetch menu)
POST /menu         ← DIFFERENT endpoint (create menu item — admin only)
                    (same PATH, different METHOD = different endpoint)

GET /menu          ← list all items
GET /menu/1        ← get item #1
                    (different PATHs = different endpoints)

────────────────────────────────────────────────────────────────
REST PATTERN (you'll see this everywhere):

GET    /resource        → list all  (e.g. GET /orders)
GET    /resource/:id    → get one   (e.g. GET /orders/7)
POST   /resource        → create    (e.g. POST /orders + body)
PUT    /resource/:id    → replace   (e.g. PUT /orders/7 + full body)
PATCH  /resource/:id    → update    (e.g. PATCH /orders/7 + partial body)
DELETE /resource/:id    → delete    (e.g. DELETE /orders/7)

:id = path parameter (variable part of the URL)
  /orders/7  → id = 7
  /orders/99 → id = 99

────────────────────────────────────────────────────────────────
KEY INSIGHT: APIs document their endpoints in API DOCS.
  Before calling an API, read the docs:
    - What endpoints exist?
    - What parameters do they need?
    - What response format do they return?
    - Do you need an API key?

Example: Brew & Bean docs would say:
  POST /orders
    Body: {"items": [int, ...], "customer_id": str}
    Headers: Authorization: Bearer YOUR_API_KEY
    Response: 201 Created + {"order_id": int, "total": float}

Without docs, you're guessing. Always RTFM (Read The Fine Manual). 📖`}
        />
        <Callout type="note">
          📌 <strong>REST</strong> (REpresentational State Transfer) is just a convention: use nouns for paths <IC>/orders</IC>, verbs for methods <IC>POST</IC>, and structure endpoints around resources. It&apos;s not a strict rule — some APIs break REST patterns — but 90% follow it. We&apos;ll use REST throughout this track.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="first-call" number="10" title="Your First API Call (No Library!)">
        <P>
          You&apos;ve learned the theory. Now let&apos;s make a REAL API call — without any library, just Python&apos;s built-in <IC>urllib</IC>. (In the next chapter we&apos;ll use <IC>requests</IC> which is 10x easier, but doing it the hard way once will make you appreciate what libraries do.)
        </P>
        <CodeBlock
          title="first_api_call_raw.py"
          code={`import urllib.request
import json

url = "https://api.brewbean.dev/menu"

# Open connection, send GET request, read response
response = urllib.request.urlopen(url)

# Read the body (bytes)
body_bytes = response.read()

# Decode to string
body_str = body_bytes.decode('utf-8')

# Parse JSON → Python list
menu = json.loads(body_str)

print("Status:", response.status)
print("Menu:")
for item in menu:
    print(f"  {item['id']}. {item['name']} — ₹{item['price']}")`}
          output={`Status: 200
Menu:
  1. Latte — ₹180
  2. Cappuccino — ₹160
  3. Espresso — ₹90
  4. Croissant — ₹120`}
        />
        <P>
          That worked! But it&apos;s clunky: you have to decode bytes, parse JSON manually, no easy access to headers. That&apos;s why everyone uses <IC>requests</IC> (next chapter). But now you know: under the hood, it&apos;s just opening a socket, sending HTTP text, and reading the response.
        </P>
        <Callout type="tip">
          💡 <strong>For quick testing, use curl</strong> (a command-line tool installed on every Mac/Linux, available for Windows). It&apos;s the fastest way to poke an API:
        </Callout>
        <CodeBlock
          title="terminal"
          code={`curl https://api.brewbean.dev/menu`}
          output={`[{"id":1,"name":"Latte","price":180},{"id":2,"name":"Cappuccino","price":160},{"id":3,"name":"Espresso","price":90},{"id":4,"name":"Croissant","price":120}]`}
        />
        <CodeBlock
          title="terminal (with pretty-print)"
          code={`curl https://api.brewbean.dev/menu | python -m json.tool`}
          output={`[
  {
    "id": 1,
    "name": "Latte",
    "price": 180
  },
  {
    "id": 2,
    "name": "Cappuccino",
    "price": 160
  },
  ...
]`}
        />
        <P>
          You can also explore APIs in your <strong>browser&apos;s DevTools</strong>. Open any website (Instagram, Twitter, Gmail), press <strong>F12</strong>, go to the <strong>Network</strong> tab, and refresh. You&apos;ll see DOZENS of API calls flying — every XHR/Fetch request is an API call. Click one, see the request headers, response body, status code. It&apos;s like X-ray vision for the web. 🔍
        </P>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging & Errors">
        <P>
          APIs fail. A lot. Here&apos;s how to read the failure and fix it:
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 1: 404 Not Found</strong> — You mistyped the endpoint.
        </Callout>
        <CodeBlock
          title="error_404.py"
          code={`import urllib.request

url = "https://api.brewbean.dev/menus"  # TYPO: should be /menu

try:
    response = urllib.request.urlopen(url)
except urllib.error.HTTPError as e:
    print(f"ERROR: {e.code} {e.reason}")
    print("Body:", e.read().decode('utf-8'))`}
          output={`ERROR: 404 Not Found
Body: {"error": "Endpoint not found. Did you mean /menu?"}`}
        />
        <P>
          <strong>Fix</strong>: Check the URL. Read the API docs. /menus vs /menu — one letter matters.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 2: 400 Bad Request</strong> — Your request body is malformed.
        </Callout>
        <CodeBlock
          title="error_400.py"
          code={`import urllib.request
import json

url = "https://api.brewbean.dev/orders"
data = {"item": "Latte"}  # WRONG: should be "items" (list of IDs)

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'),
                              headers={"Content-Type": "application/json"}, method="POST")

try:
    response = urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(f"ERROR: {e.code}")
    print(json.loads(e.read().decode('utf-8')))`}
          output={`ERROR: 400
{'error': 'Missing required field: items (must be a list of menu item IDs)'}`}
        />
        <P>
          <strong>Fix</strong>: Read the error body — it tells you EXACTLY what&apos;s wrong. Change <IC>&quot;item&quot;</IC> to <IC>&quot;items&quot;</IC>, make it a list: <IC>{`{"items": [1]}`}</IC>.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 3: 500 Internal Server Error</strong> — Their server crashed. Not your fault.
        </Callout>
        <CodeBlock
          title="error_500.py"
          code={`import urllib.request

url = "https://api.brewbean.dev/menu"

try:
    response = urllib.request.urlopen(url)
except urllib.error.HTTPError as e:
    print(f"ERROR: {e.code}")
    print("Server is down or broken. Try again later, or contact support.")`}
          output={`ERROR: 500
Server is down or broken. Try again later, or contact support.`}
        />
        <P>
          <strong>Fix</strong>: Wait and retry. Check their status page (status.brewbean.dev). If it persists, report it. You can&apos;t fix their bugs.
        </P>
        <P>
          <strong>Pro debugging trick</strong>: Use <IC>curl -i</IC> (show headers) to see the full HTTP conversation:
        </P>
        <CodeBlock
          title="terminal"
          code={`curl -i https://api.brewbean.dev/menu/999`}
          output={`HTTP/2 404
content-type: application/json
date: Fri, 12 Jun 2026 10:45:00 GMT

{"error": "Menu item 999 not found"}`}
        />
        <P>
          The <IC>-i</IC> flag shows headers + status code + body. Gold for debugging.
        </P>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <P>
          <strong>Your mission</strong>: Use <IC>curl</IC> (or Python with urllib) to explore the Brew &amp; Bean API. Complete these tasks and verify the output:
        </P>
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Explore the Brew & Bean API with curl
──────────────────────────────────────────────────────────────

TASK 1: Fetch the full menu
  Command: curl https://api.brewbean.dev/menu
  Expected: 200 OK, JSON array with 4 items (Latte, Cappuccino, Espresso, Croissant)
  Verify: You see id, name, price for each item.

TASK 2: Fetch menu item #3 (Espresso)
  Command: curl https://api.brewbean.dev/menu/3
  Expected: 200 OK, JSON object {"id": 3, "name": "Espresso", "category": "Drink", "price": 90}
  Verify: price = 90.

TASK 3: Trigger a 404 (typo)
  Command: curl -i https://api.brewbean.dev/menus
  Expected: 404 Not Found, error body
  Verify: Status line says "404", body is JSON with "error" key.

TASK 4: Fetch a non-existent menu item
  Command: curl -i https://api.brewbean.dev/menu/999
  Expected: 404 Not Found, body: {"error": "Menu item 999 not found"}
  Verify: 404, not 500.

TASK 5: Read the response headers
  Command: curl -i https://api.brewbean.dev/menu | head -10
  Expected: You see HTTP/2 200, Content-Type: application/json, Date: ...
  Verify: Content-Type is application/json (not text/html).

TASK 6 (BONUS): Pretty-print the JSON
  Command: curl https://api.brewbean.dev/menu | python -m json.tool
  Expected: Formatted JSON with indentation.
  Verify: Each item on multiple lines, easier to read.

──────────────────────────────────────────────────────────────
REFLECTION QUESTIONS (write answers):
1. What is the base URL of the API? (scheme + host)
2. What are the 4 menu item IDs?
3. What status code means "success"?
4. What status code means "not found"?
5. What header tells you the response format?

Answers:
1. https://api.brewbean.dev
2. 1, 2, 3, 4
3. 200 (or 2xx family)
4. 404
5. Content-Type: application/json`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is an API?", "An API (Application Programming Interface) is a way for programs to communicate over a network. It defines endpoints (URLs + HTTP methods) that accept requests and return responses, usually in JSON format. Example: Instagram app calls Instagram's API to fetch your feed."],
            ["What's the difference between a client and a server?", "The client initiates requests (your script, a browser, a mobile app). The server receives requests, processes them, and sends responses (a Flask/FastAPI app, Instagram's backend). One program can be both depending on context."],
            ["Explain GET vs POST.", "GET fetches data without changing anything on the server (idempotent, safe to retry). POST creates new resources and usually requires a request body. Example: GET /menu (list items), POST /orders (create an order)."],
            ["What does status code 404 mean?", "404 Not Found means the endpoint or resource doesn't exist. It's a client error (4xx) — you made a mistake, like a typo in the URL. Example: GET /menus instead of /menu."],
            ["What's the difference between 401 and 403?", "401 Unauthorized: you didn't authenticate (missing/invalid API key). 403 Forbidden: you're authenticated but not allowed to access this resource (permission denied). Example: 401 = no key, 403 = wrong key or not your order."],
            ["What is JSON and why do APIs use it?", "JSON (JavaScript Object Notation) is a text format for structured data. It maps cleanly to dicts/lists in Python, objects/arrays in JS. It's lightweight, human-readable, and language-agnostic — perfect for APIs. Example: {\"id\": 1, \"name\": \"Latte\"}."],
            ["What is an endpoint?", "An endpoint is a specific URL path + HTTP method combination that performs one action. Example: POST /orders is an endpoint (creates order), GET /orders/7 is another endpoint (fetches order 7). Same path, different method = different endpoint."],
            ["What does REST mean?", "REST (Representational State Transfer) is a design pattern for APIs: use HTTP methods (GET/POST/PUT/DELETE) as verbs, URL paths as nouns (resources like /orders, /menu), and status codes to indicate results. It's a convention, not a strict rule."],
            ["How do you debug a failing API call?", "1. Check status code (200 = ok, 4xx = your mistake, 5xx = their mistake). 2. Read the response body (error message). 3. Use curl -i to see full headers. 4. Verify URL spelling, method, required headers (API key?). 5. Check API docs for required fields."],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["API definition", "A way for programs to talk to each other over the internet via HTTP requests and responses."],
            ["Client vs Server", "Client = requests (your script, browser). Server = responds (Flask/FastAPI app, Instagram backend)."],
            ["HTTP verbs", "GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)."],
            ["Status codes: 2xx", "Success. 200 OK, 201 Created, 204 No Content."],
            ["Status codes: 4xx", "YOU messed up. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error."],
            ["Status codes: 5xx", "THEY messed up. 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable."],
            ["JSON ↔ Python", "dict ↔ {}, list ↔ [], str ↔ \"...\", int/float ↔ number, True/False ↔ true/false, None ↔ null."],
            ["Endpoint", "URL path + HTTP method. POST /orders and GET /orders are DIFFERENT endpoints."],
            ["REST pattern", "GET /resource (list), GET /resource/:id (one), POST /resource (create), PUT/PATCH /resource/:id (update), DELETE /resource/:id (delete)."],
            ["401 vs 403", "401 = who are you? (not authenticated). 403 = I know you, but no. (not authorized)."],
            ["curl basics", "curl URL (GET request), curl -i URL (show headers), curl -X POST -d '{...}' URL (POST with body)."],
            ["DevTools Network tab", "F12 → Network → see every API call your browser makes. Click one → inspect request/response. X-ray vision."],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
