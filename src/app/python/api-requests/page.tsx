"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "requests.get() under the hood",
  nodes: [
    { id: "code", icon: "🐍", label: "requests.get(url)", sub: "", x: 6, y: 50, color: "#22d3ee" },
    { id: "build", icon: "📨", label: "Build HTTP request", sub: "headers · params", x: 24, y: 22, color: "#fb923c" },
    { id: "socket", icon: "🔌", label: "TCP + TLS", sub: "", x: 24, y: 78, color: "#a78bfa" },
    { id: "server", icon: "🏢", label: "API server", sub: "", x: 46, y: 50, color: "#34d399" },
    { id: "status", icon: "🚦", label: "status_code", sub: "", x: 66, y: 22, color: "#fbbf24" },
    { id: "parse", icon: "📦", label: ".json()", sub: "dict/list", x: 66, y: 78, color: "#60a5fa" },
    { id: "use", icon: "✅", label: "Your data", sub: "", x: 88, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "code-build", from: "code", to: "build", color: "#fb923c" },
    { id: "code-socket", from: "code", to: "socket", color: "#a78bfa" },
    { id: "build-server", from: "build", to: "server", color: "#fb923c" },
    { id: "socket-server", from: "socket", to: "server", color: "#a78bfa" },
    { id: "server-status", from: "server", to: "status", color: "#fbbf24" },
    { id: "server-parse", from: "server", to: "parse", color: "#60a5fa" },
    { id: "status-use", from: "status", to: "use", color: "#34d399" },
    { id: "parse-use", from: "parse", to: "use", color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ GET menu + .json()",
      command: "r = requests.get(url); r.json()",
      steps: [
        { node: "code", paths: ["code-build", "code-socket"], text: "You call requests.get('https://api.brewbean.dev/menu'). The library starts building the HTTP request and opening a TCP connection." },
        { node: "build", paths: ["build-server"], text: "requests constructs the raw HTTP text: GET /menu HTTP/1.1, Host: api.brewbean.dev, User-Agent: python-requests/2.31, Accept: */*. Adds any headers/params you specified." },
        { node: "socket", paths: ["socket-server"], text: "Opens a TCP socket to the server's IP (port 443 for https). If https, wraps it in TLS encryption. Sends the raw HTTP request bytes." },
        { node: "server", paths: ["server-status", "server-parse"], text: "Server processes the request and sends back: HTTP/1.1 200 OK, Content-Type: application/json, body: [{...}, {...}]. requests reads the response." },
        { node: "status", paths: ["status-use"], text: "requests parses the status line. You access r.status_code → 200, r.ok → True. You check: if not r.ok, handle error." },
        { node: "parse", paths: ["parse-use"], text: "You call r.json(). This does json.loads(r.text), converting the JSON string into a Python list of dicts. No manual decoding needed!" },
        { node: "use", paths: [], text: "You have your data! menu = r.json() → [{'id':1, 'name':'Latte', 'price':180}, ...]. Loop, filter, display. ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Server down (ConnectionError)",
      command: "requests.get(url, timeout=5)",
      steps: [
        { node: "code", paths: ["code-socket"], text: "You call requests.get() but the server's IP is unreachable (server down, no internet, wrong domain)." },
        { node: "socket", paths: [], text: "TCP connection fails after timeout seconds. No HTTP request is sent because we can't even reach the server. 🚨" },
        { node: "code", paths: [], text: "requests raises: requests.exceptions.ConnectionError: ('Connection aborted.', ConnectionRefusedError(...)). Your code crashes UNLESS you wrapped it in try/except." },
        { node: "code", paths: ["code-build", "code-socket"], text: "Fix: Use try/except requests.exceptions.ConnectionError. Log the error, retry after a delay, or alert the user. Set timeout= to avoid hanging forever." },
      ],
    },
    {
      id: "power",
      name: "⚡ POST with API key",
      command: "POST /orders + headers + json=",
      steps: [
        { node: "code", paths: ["code-build"], text: "You call requests.post(url, json={'items': [1, 3]}, headers={'Authorization': 'Bearer sk_abc123'}, timeout=10). Notice json= parameter." },
        { node: "build", paths: ["build-server"], text: "requests builds: POST /orders HTTP/1.1, Host: api.brewbean.dev, Authorization: Bearer sk_abc123, Content-Type: application/json (auto-added!), body: {\"items\": [1, 3]}." },
        { node: "socket", paths: ["socket-server"], text: "Opens connection, sends the POST request with headers + JSON body. Server sees the Authorization header and authenticates you." },
        { node: "server", paths: ["server-status", "server-parse"], text: "Server validates the API key, processes the order, returns: HTTP/1.1 201 Created, body: {'order_id': 1042, 'total': 270, 'status': 'pending'}." },
        { node: "status", paths: ["status-use"], text: "r.status_code = 201 (Created, not 200). r.ok is still True (any 2xx = success). Check status to distinguish create vs read." },
        { node: "parse", paths: ["parse-use"], text: "r.json() → {'order_id': 1042, ...}. Extract the new order ID: order_id = r.json()['order_id']. POST completed! 🎉" },
        { node: "use", paths: [], text: "You have the new order details. Display confirmation: 'Order #1042 placed, total ₹270'. Success path complete." },
      ],
    },
  ],
};

const NAV = [
  { id: "install", label: "Install requests" },
  { id: "first-get", label: "Your First requests.get() ⭐" },
  { id: "response", label: "The Response Object ⭐" },
  { id: "params", label: "Query Parameters the RIGHT Way" },
  { id: "headers", label: "Custom Headers" },
  { id: "post", label: "POST with JSON ⭐" },
  { id: "errors", label: "Error Handling the Pro Way ⭐" },
  { id: "timeout", label: "ALWAYS Set timeout=" },
  { id: "pagination", label: "Pagination Loop" },
  { id: "api-keys", label: "API Keys & Authentication ⭐" },
  { id: "script", label: "Real Script: Sum Revenue" },
  { id: "session", label: "requests.Session() for Speed" },
  { id: "debugging", label: "Debugging Tricks" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiRequestsPage() {
  return (
    <TopicShell
      icon="📡"
      title="The requests Library — Calling Any API"
      gradientWord="requests"
      subtitle="The requests library is the gold standard for HTTP in Python. You'll learn to GET data, POST with JSON, handle errors like a pro, paginate results, and authenticate with API keys. By the end, you'll be calling real APIs and parsing responses with confidence."
      nav={NAV}
      badges={["📡 GET & POST mastery", "🔑 API key auth", "🚨 Professional error handling", "🔄 Pagination patterns", "⚡ Session reuse"]}
      next={{ icon: "⚡", label: "Build an API with FastAPI", href: "/python/api-fastapi" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="install" number="01" title="Install requests">
        <CodeBlock
          title="terminal"
          code={`pip install requests`}
        />
        <CodeBlock
          title="verify_install.py"
          code={`import requests

print("requests version:", requests.__version__)
print("Ready to call APIs! 🚀")`}
          output={`requests version: 2.31.0
Ready to call APIs! 🚀`}
        />
        <P>
          The <IC>requests</IC> library is not part of Python&apos;s standard library — you must install it. But it&apos;s the de facto standard; every Python developer knows it. The tagline: <strong>&quot;HTTP for Humans&quot;</strong>. It turns 15 lines of urllib into 2 lines.
        </P>
      </Section>

      {/* 02 */}
      <Section id="first-get" number="02" title="Your First requests.get() ⭐">
        <CodeBlock
          title="first_get.py"
          code={`import requests

url = "https://api.brewbean.dev/menu"

r = requests.get(url)

print("Status code:", r.status_code)
print("Content-Type:", r.headers["Content-Type"])
print("\\nRaw text (first 100 chars):")
print(r.text[:100])

print("\\nParsed JSON:")
menu = r.json()  # ← the magic line: JSON string → Python list
for item in menu:
    print(f"  {item['id']}. {item['name']} — ₹{item['price']}")`}
          output={`Status code: 200
Content-Type: application/json; charset=utf-8

Raw text (first 100 chars):
[{"id":1,"name":"Latte","category":"Drink","price":180},{"id":2,"name":"Cappuccino","category":"Dri

Parsed JSON:
  1. Latte — ₹180
  2. Cappuccino — ₹160
  3. Espresso — ₹90
  4. Croissant — ₹120`}
        />
        <P>
          That&apos;s it! <IC>requests.get(url)</IC> sends the request, waits for the response, and gives you a <IC>Response</IC> object. Three key attributes:
        </P>
        <Table
          head={["Attribute", "Type", "What it gives you"]}
          rows={[
            [<IC>r.status_code</IC>, <IC>int</IC>, "The HTTP status: 200, 404, 500, etc."],
            [<IC>r.text</IC>, <IC>str</IC>, "Response body as a string (raw JSON, HTML, XML, whatever)"],
            [<IC>r.json()</IC>, <IC>dict/list</IC>, "Parses r.text as JSON → Python dict or list. Shortcut for json.loads(r.text)."],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Always call r.json() AFTER checking r.status_code.</strong> If status is 404 or 500, the body might be HTML (error page), and r.json() will crash with a JSONDecodeError. Safe pattern: <IC>if r.ok: data = r.json()</IC>.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="response" number="03" title="The Response Object ⭐">
        <P>
          The <IC>Response</IC> object has everything you need. Here&apos;s the full tour:
        </P>
        <CodeBlock
          title="response_tour.py"
          code={`import requests

r = requests.get("https://api.brewbean.dev/menu/1")

# STATUS
print("Status code:", r.status_code)
print("OK? (2xx):", r.ok)  # True if 200-299, False otherwise

# HEADERS
print("\\nResponse headers:")
print("  Content-Type:", r.headers["Content-Type"])
print("  Date:", r.headers.get("Date", "N/A"))

# BODY (3 ways to access)
print("\\nBody as text (string):")
print(r.text[:80], "...")

print("\\nBody as JSON (parsed):")
item = r.json()
print(item)

print("\\nBody as bytes:")
print(r.content[:40], "...")

# REQUEST INFO
print("\\nRequest URL:", r.url)
print("Request method:", r.request.method)

# TIMING
print("\\nElapsed time:", r.elapsed.total_seconds(), "seconds")`}
          output={`Status code: 200
OK? (2xx): True

Response headers:
  Content-Type: application/json; charset=utf-8
  Date: Fri, 12 Jun 2026 11:05:23 GMT

Body as text (string):
{"id":1,"name":"Latte","category":"Drink","price":180} ...

Body as JSON (parsed):
{'id': 1, 'name': 'Latte', 'category': 'Drink', 'price': 180}

Body as bytes:
b'{"id":1,"name":"Latte","category":"Drink" ...

Request URL: https://api.brewbean.dev/menu/1
Request method: GET

Elapsed time: 0.342 seconds`}
        />
        <Table
          head={["Attribute/Method", "Returns", "Use case"]}
          rows={[
            [<IC>r.status_code</IC>, <IC>int</IC>, "200, 404, 500... Check this FIRST."],
            [<IC>r.ok</IC>, <IC>bool</IC>, "True if 200-299 (success), False otherwise. Quick check."],
            [<IC>r.text</IC>, <IC>str</IC>, "Body as Unicode string. Use for JSON, HTML, XML."],
            [<IC>r.json()</IC>, <IC>dict/list</IC>, "Parse JSON → Python. Raises JSONDecodeError if not valid JSON."],
            [<IC>r.content</IC>, <IC>bytes</IC>, "Body as raw bytes. Use for images, PDFs, binary data."],
            [<IC>r.headers</IC>, <IC>dict</IC>, "Response headers. Case-insensitive: r.headers['content-type'] works."],
            [<IC>r.url</IC>, <IC>str</IC>, "Final URL (after redirects). Check if params were added correctly."],
            [<IC>r.elapsed</IC>, <IC>timedelta</IC>, "How long the request took. r.elapsed.total_seconds() → float."],
            [<IC>r.request</IC>, <IC>PreparedRequest</IC>, "The request you sent. Inspect: r.request.headers, r.request.body."],
          ]}
        />
      </Section>

      {/* 04 */}
      <Section id="params" number="04" title="Query Parameters the RIGHT Way">
        <P>
          Query parameters (the <IC>?key=value&amp;key2=value2</IC> part of a URL) are filters or options. <strong>NEVER</strong> build them by hand with f-strings — let requests do it:
        </P>
        <CodeBlock
          title="query_params.py"
          code={`import requests

base_url = "https://api.brewbean.dev/menu"

# WRONG WAY (fragile, breaks with spaces/special chars)
# url = f"{base_url}?category=Drink&max_price=150"

# RIGHT WAY: use params= dict
params = {
    "category": "Drink",
    "max_price": 150
}

r = requests.get(base_url, params=params)

print("Final URL:", r.url)
print("Status:", r.status_code)
print("\\nFiltered menu:")
for item in r.json():
    print(f"  {item['name']} — ₹{item['price']}")`}
          output={`Final URL: https://api.brewbean.dev/menu?category=Drink&max_price=150
Status: 200

Filtered menu:
  Espresso — ₹90`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Hand-building URLs with f-strings. If a param has spaces or special chars, you&apos;ll break the URL. Example: <IC>city=&quot;New Delhi&quot;</IC> → needs encoding as <IC>New%20Delhi</IC>. The <IC>params=</IC> dict handles this automatically (URL-encodes values, joins with <IC>&amp;</IC>, appends <IC>?</IC>).
        </Callout>
        <CodeBlock
          title="params_with_spaces.py"
          code={`import requests

url = "https://api.weatherapi.dev/current"

params = {
    "city": "New Delhi",   # space gets encoded as %20
    "units": "metric"
}

r = requests.get(url, params=params)

print("Final URL:", r.url)
# https://api.weatherapi.dev/current?city=New+Delhi&units=metric
# (+ or %20 both work for space encoding)`}
          output={`Final URL: https://api.weatherapi.dev/current?city=New+Delhi&units=metric`}
        />
      </Section>

      {/* 05 */}
      <Section id="headers" number="05" title="Custom Headers">
        <P>
          Headers are metadata about your request. Common use cases: API keys, content negotiation, user-agent spoofing (for scraping). Pass them as a dict:
        </P>
        <CodeBlock
          title="custom_headers.py"
          code={`import requests

url = "https://api.brewbean.dev/orders"

headers = {
    "Authorization": "Bearer sk_live_abc123xyz",
    "User-Agent": "BrewBeanApp/1.0",
    "Accept": "application/json"
}

r = requests.get(url, headers=headers)

print("Status:", r.status_code)
if r.ok:
    orders = r.json()
    print(f"You have {len(orders)} orders.")
else:
    print("Error:", r.status_code, r.text)`}
          output={`Status: 200
You have 3 orders.`}
        />
        <Table
          head={["Header", "Purpose", "Example value"]}
          rows={[
            [<IC>Authorization</IC>, "Authenticate (prove who you are). Bearer token, API key.", <><IC>&quot;Bearer sk_abc123&quot;</IC> or <IC>&quot;ApiKey YOUR_KEY&quot;</IC></>],
            [<IC>User-Agent</IC>, "Identify your app/script. Some APIs block default python-requests UA.", <><IC>&quot;MyApp/1.0&quot;</IC> or <IC>&quot;Mozilla/5.0...&quot;</IC></>],
            [<IC>Accept</IC>, "Tell server what format you want (JSON, XML, etc.). Usually application/json.", <IC>&quot;application/json&quot;</IC>],
            [<IC>Content-Type</IC>, "Format of YOUR request body (for POST/PUT). Auto-set by requests if you use json= param.", <IC>&quot;application/json&quot;</IC>],
          ]}
        />
        <Callout type="tip">
          💡 <strong>For APIs requiring keys</strong>: Check their docs — some want <IC>Authorization: Bearer &lt;key&gt;</IC>, others want a query param <IC>?api_key=&lt;key&gt;</IC>, others want a custom header like <IC>X-API-Key: &lt;key&gt;</IC>. There&apos;s no universal standard, annoyingly.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="post" number="06" title="POST with JSON ⭐">
        <P>
          To create something (an order, a user, a post), you send a <strong>POST</strong> request with a <strong>body</strong> (the data). Use <IC>json=</IC> to auto-encode a Python dict as JSON:
        </P>
        <CodeBlock
          title="post_json.py"
          code={`import requests

url = "https://api.brewbean.dev/orders"

# The data you're sending (will be converted to JSON)
order_data = {
    "items": [1, 3],       # menu item IDs: Latte (1), Espresso (3)
    "customer_id": "C001"
}

headers = {
    "Authorization": "Bearer sk_test_abc123"
}

r = requests.post(url, json=order_data, headers=headers)

print("Status:", r.status_code)
if r.status_code == 201:  # 201 = Created
    result = r.json()
    print("✅ Order created!")
    print(f"  Order ID: {result['order_id']}")
    print(f"  Total: ₹{result['total']}")
    print(f"  Status: {result['status']}")
else:
    print("❌ Error:", r.status_code)
    print(r.json())`}
          output={`Status: 201
✅ Order created!
  Order ID: 1042
  Total: 270
  Status: pending`}
        />
        <P>
          <strong>What happened</strong>: <IC>json=order_data</IC> did THREE things automatically:
        </P>
        <CodeBlock
          title="what_json_param_does.txt"
          runnable={false}
          code={`json=order_data  IS SHORTHAND FOR:

1. Convert the dict to JSON string:
     import json
     body = json.dumps(order_data)

2. Set Content-Type header:
     headers["Content-Type"] = "application/json"

3. Send the JSON string as the request body.

────────────────────────────────────────────────────────────────
WITHOUT json= (the hard way):

import json
body = json.dumps(order_data)
headers = {
    "Authorization": "Bearer sk_test_abc123",
    "Content-Type": "application/json"  # YOU have to set this
}
r = requests.post(url, data=body, headers=headers)

────────────────────────────────────────────────────────────────
WITH json= (the requests way):

r = requests.post(url, json=order_data, headers={"Authorization": "..."})

→ Content-Type is auto-set. Body is auto-encoded. Clean. ✅`}
        />
        <Callout type="mistake">
          ⚠️ <strong>json= vs data=</strong>: Common confusion. Use <IC>json=</IC> for JSON APIs. Use <IC>data=</IC> for form data (application/x-www-form-urlencoded, like old HTML forms). If you pass a dict to <IC>data=</IC>, requests sends it as form-encoded, NOT JSON. Always use <IC>json=</IC> for modern APIs.
        </Callout>
        <Table
          head={["Parameter", "Body format", "Content-Type set to", "Use case"]}
          rows={[
            [<IC>json={`{...}`}</IC>, "JSON string", <IC>application/json</IC>, "Modern APIs (99% of cases)"],
            [<IC>data={`{...}`}</IC>, "Form-encoded: <IC>key=value&amp;key2=value2</IC>", <IC>application/x-www-form-urlencoded</IC>, "Old APIs, HTML form submissions"],
            [<IC>data=&quot;raw string&quot;</IC>, "Raw string", "Not set (you set it manually)", "Sending XML, custom formats"],
          ]}
        />
      </Section>

      {/* 07 */}
      <Section id="errors" number="07" title="Error Handling the Pro Way ⭐">
        <P>
          Calling an API without error handling is like driving without a seatbelt. Things WILL go wrong. Here&apos;s the professional pattern:
        </P>
        <CodeBlock
          title="error_handling_pro.py"
          code={`import requests
from requests.exceptions import HTTPError, ConnectionError, Timeout

url = "https://api.brewbean.dev/menu/999"  # doesn't exist

try:
    r = requests.get(url, timeout=5)
    r.raise_for_status()  # raises HTTPError if status >= 400

    # If we get here, status was 2xx
    menu = r.json()
    print("Success:", menu)

except HTTPError as e:
    # 4xx or 5xx response received
    print(f"❌ HTTP error: {e.response.status_code}")
    print("Error body:", e.response.text)

except ConnectionError:
    # Couldn't reach server (no internet, server down, wrong domain)
    print("❌ Connection failed. Is the server up? Is your internet working?")

except Timeout:
    # Request took longer than timeout= seconds
    print("❌ Request timed out. Server is slow or unresponsive.")

except Exception as e:
    # Catch-all for other errors (JSONDecodeError, etc.)
    print(f"❌ Unexpected error: {type(e).__name__}: {e}")`}
          output={`❌ HTTP error: 404
Error body: {"error": "Menu item 999 not found"}`}
        />
        <P>
          Let&apos;s break down <IC>r.raise_for_status()</IC>:
        </P>
        <CodeBlock
          title="raise_for_status_explained.txt"
          runnable={false}
          code={`r.raise_for_status()  — WHAT IT DOES:

If r.status_code >= 400 (any error):
  → raises requests.exceptions.HTTPError
  → the exception has .response attribute (the full Response object)
  → you can read e.response.status_code, e.response.text, etc.

If r.status_code < 400 (success):
  → does nothing, execution continues

────────────────────────────────────────────────────────────────
WITHOUT raise_for_status() (manual check):

if not r.ok:
    print("Error:", r.status_code, r.text)
    return
data = r.json()
# ... proceed

────────────────────────────────────────────────────────────────
WITH raise_for_status() (exception-based):

try:
    r.raise_for_status()
    data = r.json()
    # ... proceed
except HTTPError as e:
    print("Error:", e.response.status_code, e.response.text)

────────────────────────────────────────────────────────────────
WHY USE IT? Centralizes error handling. If you have 10 API calls,
you wrap them all in one try/except instead of 10 if-checks. Cleaner.`}
        />
        <Callout type="tip">
          💡 <strong>The 3 exceptions you MUST handle</strong>:
          <br />1. <IC>HTTPError</IC> — server responded with 4xx/5xx (check <IC>e.response.status_code</IC>)
          <br />2. <IC>ConnectionError</IC> — couldn&apos;t reach server (network down, server offline)
          <br />3. <IC>Timeout</IC> — request took longer than <IC>timeout=</IC> seconds (server slow/hung)
          <br /><br />Catch all three and your script won&apos;t crash unexpectedly.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="timeout" number="08" title="ALWAYS Set timeout=">
        <P>
          By default, <IC>requests.get()</IC> waits <strong>forever</strong> for a response. If the server is slow or hung, your script hangs indefinitely. <strong>ALWAYS</strong> set <IC>timeout=</IC>:
        </P>
        <CodeBlock
          title="timeout_demo.py"
          code={`import requests
from requests.exceptions import Timeout

url = "https://api.slowserver.dev/menu"  # deliberately slow

try:
    r = requests.get(url, timeout=5)  # wait max 5 seconds
    print("Success:", r.status_code)
except Timeout:
    print("❌ Server took longer than 5 seconds. Giving up.")
    # Retry logic, alert user, etc.`}
          output={`❌ Server took longer than 5 seconds. Giving up.`}
        />
        <Callout type="mistake">
          ⚠️ <strong>The horror story</strong>: You deploy a script that calls an API in a loop (e.g., every 10 seconds). One day the API server hangs (bug on their side). Your script hangs on <IC>requests.get()</IC> FOREVER. No timeout = your process is stuck, consuming a thread/worker, and you don&apos;t even know. When you come back 3 hours later, nothing has run. Always set <IC>timeout=5</IC> (or 10, or 30, depending on the API).
        </Callout>
        <P>
          <strong>Good defaults</strong>:
        </P>
        <Table
          head={["API type", "Recommended timeout", "Reasoning"]}
          rows={[
            ["Fast APIs (read data)", "5-10 seconds", "Should be instant. If it takes &gt;10s, something is wrong."],
            ["Slow APIs (POST/heavy compute)", "30-60 seconds", "Creating resources, generating reports — might be slow."],
            ["File downloads (images, PDFs)", "None or very high (300s)", "Large files take time. Or stream with stream=True."],
          ]}
        />
        <CodeBlock
          title="timeout_tuple.py"
          code={`import requests

url = "https://api.brewbean.dev/menu"

# Advanced: separate timeouts for CONNECT and READ
r = requests.get(url, timeout=(3, 10))
#                              ↑   ↑
#                            connect │
#                                  read

# Connect timeout: 3s to establish TCP connection
# Read timeout: 10s to receive the full response after connecting

print("Got response:", r.status_code)`}
          output={`Got response: 200`}
        />
      </Section>

      {/* 09 */}
      <Section id="pagination" number="09" title="Pagination Loop">
        <P>
          Many APIs return data in <strong>pages</strong> (chunks). Instead of returning 1000 orders at once, they return 50 at a time. You loop, incrementing <IC>page=</IC>, until you get an empty result:
        </P>
        <CodeBlock
          title="pagination_loop.py"
          code={`import requests

url = "https://api.brewbean.dev/orders"

headers = {"Authorization": "Bearer sk_abc123"}

all_orders = []
page = 1

while True:
    params = {"page": page, "per_page": 50}
    r = requests.get(url, headers=headers, params=params, timeout=10)
    r.raise_for_status()

    chunk = r.json()

    if not chunk:  # empty list = no more pages
        break

    all_orders.extend(chunk)
    print(f"Fetched page {page}: {len(chunk)} orders")
    page += 1

print(f"\\nTotal orders fetched: {len(all_orders)}")`}
          output={`Fetched page 1: 50 orders
Fetched page 2: 50 orders
Fetched page 3: 50 orders
Fetched page 4: 23 orders
Fetched page 5: 0 orders

Total orders fetched: 173`}
        />
        <Callout type="tip">
          💡 <strong>Some APIs use cursor-based pagination</strong> instead of pages. The response includes a <IC>next_cursor</IC> token. You pass it as <IC>?cursor=abc123</IC> in the next request. Keep looping until <IC>next_cursor</IC> is null. Same pattern, different param name.
        </Callout>
        <CodeBlock
          title="cursor_pagination.py"
          code={`import requests

url = "https://api.brewbean.dev/orders"
headers = {"Authorization": "Bearer sk_abc123"}

all_orders = []
cursor = None

while True:
    params = {"limit": 50}
    if cursor:
        params["cursor"] = cursor

    r = requests.get(url, headers=headers, params=params, timeout=10)
    r.raise_for_status()

    data = r.json()
    all_orders.extend(data["results"])

    cursor = data.get("next_cursor")
    if not cursor:  # no more pages
        break

    print(f"Fetched {len(data['results'])} orders, next cursor: {cursor[:10]}...")

print(f"\\nTotal: {len(all_orders)} orders")`}
          output={`Fetched 50 orders, next cursor: eyJpZCI6MT...
Fetched 50 orders, next cursor: eyJpZCI6NT...
Fetched 23 orders, next cursor: None

Total: 123 orders`}
        />
      </Section>

      {/* 10 */}
      <Section id="api-keys" number="10" title="API Keys & Authentication ⭐">
        <P>
          Most real APIs require an <strong>API key</strong> to identify/authenticate you. Where do you get one? Sign up on the API&apos;s website, go to settings/developer portal, generate a key. It&apos;s a long random string like <IC>sk_live_a1b2c3d4e5f6...</IC>.
        </P>
        <P>
          <strong>Where to put the API key?</strong> Three common patterns:
        </P>
        <Table
          head={["Pattern", "Example", "Used by"]}
          rows={[
            ["Authorization header (Bearer)", <IC>headers = {`{"Authorization": "Bearer sk_abc123"}`}</IC>, "Stripe, GitHub, OpenAI, most modern APIs"],
            ["Custom header", <IC>headers = {`{"X-API-Key": "abc123"}`}</IC>, "Some older APIs"],
            ["Query parameter", <IC>params = {`{"api_key": "abc123"}`}</IC>, "Google Maps, OpenWeather (less secure — logged in URLs)"],
          ]}
        />
        <CodeBlock
          title="api_key_example.py"
          code={`import requests
import os

# NEVER hardcode keys in code! Use environment variables.
api_key = os.environ.get("BREWBEAN_API_KEY")

if not api_key:
    print("❌ Error: Set BREWBEAN_API_KEY environment variable")
    exit(1)

url = "https://api.brewbean.dev/orders"

headers = {
    "Authorization": f"Bearer {api_key}"
}

r = requests.get(url, headers=headers, timeout=10)

if r.status_code == 401:
    print("❌ 401 Unauthorized: Invalid API key")
elif r.status_code == 403:
    print("❌ 403 Forbidden: Valid key but you don't have permission")
elif r.ok:
    orders = r.json()
    print(f"✅ Authenticated! You have {len(orders)} orders.")
else:
    print(f"❌ Error {r.status_code}: {r.text}")`}
          output={`✅ Authenticated! You have 7 orders.`}
        />
        <Callout type="mistake">
          ⚠️ <strong>NEVER commit API keys to git!</strong> Store them in environment variables or a <IC>.env</IC> file (add <IC>.env</IC> to <IC>.gitignore</IC>). If you accidentally push a key to GitHub, assume it&apos;s compromised — rotate it immediately (generate a new key, revoke the old one). Tools like <IC>python-dotenv</IC> help manage <IC>.env</IC> files:
        </Callout>
        <CodeBlock
          title="using_dotenv.py"
          code={`# Install: pip install python-dotenv

from dotenv import load_dotenv
import os
import requests

load_dotenv()  # reads .env file, sets environment variables

api_key = os.environ["BREWBEAN_API_KEY"]

headers = {"Authorization": f"Bearer {api_key}"}
r = requests.get("https://api.brewbean.dev/orders", headers=headers)
print("Status:", r.status_code)`}
          output={`Status: 200`}
        />
        <CodeBlock
          title=".env file (NEVER commit this!)"
          runnable={false}
          code={`BREWBEAN_API_KEY=sk_live_a1b2c3d4e5f6g7h8i9j0
OPENAI_API_KEY=sk-proj-xyz123...`}
        />
      </Section>

      {/* 11 */}
      <Section id="script" number="11" title="Real Script: Sum Revenue">
        <P>
          Let&apos;s write a real script: fetch all orders from Brew &amp; Bean, calculate total revenue using the fixed menu prices, and print a report. This combines everything you&apos;ve learned:
        </P>
        <CodeBlock
          title="sum_revenue.py"
          code={`import requests

# Fixed menu prices (₹)
MENU = {
    1: {"name": "Latte", "price": 180},
    2: {"name": "Cappuccino", "price": 160},
    3: {"name": "Espresso", "price": 90},
    4: {"name": "Croissant", "price": 120},
}

url = "https://api.brewbean.dev/orders"

try:
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    orders = r.json()
except Exception as e:
    print(f"❌ Failed to fetch orders: {e}")
    exit(1)

total_revenue = 0
item_counts = {item_id: 0 for item_id in MENU}

for order in orders:
    for item_id in order["items"]:
        if item_id in MENU:
            total_revenue += MENU[item_id]["price"]
            item_counts[item_id] += 1

print("🧾 BREW & BEAN REVENUE REPORT")
print("=" * 40)
for item_id, count in item_counts.items():
    item = MENU[item_id]
    subtotal = item["price"] * count
    print(f"{item['name']:12} × {count:2}  =  ₹{subtotal:5}")

print("=" * 40)
print(f"{'TOTAL REVENUE':20}  ₹{total_revenue}")
print(f"\\nOrders processed: {len(orders)}")`}
          output={`🧾 BREW & BEAN REVENUE REPORT
========================================
Latte        × 12  =  ₹ 2160
Cappuccino   ×  5  =  ₹  800
Espresso     ×  8  =  ₹  720
Croissant    ×  3  =  ₹  360
========================================
TOTAL REVENUE         ₹4040

Orders processed: 15`}
        />
        <P>
          This is production-ready. Error handling, timeout, clean output, accurate arithmetic. Ship it. 🚀
        </P>
      </Section>

      {/* 12 */}
      <Section id="session" number="12" title="requests.Session() for Speed">
        <P>
          If you call the same API multiple times, use a <IC>Session</IC>. It reuses the TCP connection (faster) and lets you set headers once:
        </P>
        <CodeBlock
          title="session_demo.py"
          code={`import requests

session = requests.Session()

# Set headers ONCE for all requests in this session
session.headers.update({
    "Authorization": "Bearer sk_abc123",
    "User-Agent": "BrewBeanScript/1.0"
})

# Now all requests inherit those headers
r1 = session.get("https://api.brewbean.dev/menu", timeout=10)
r2 = session.get("https://api.brewbean.dev/orders", timeout=10)

print("Menu status:", r1.status_code)
print("Orders status:", r2.status_code)

session.close()  # clean up (or use 'with' context manager)`}
          output={`Menu status: 200
Orders status: 200`}
        />
        <CodeBlock
          title="session_context_manager.py"
          code={`import requests

with requests.Session() as s:
    s.headers.update({"Authorization": "Bearer sk_abc123"})

    # Multiple requests — connection is reused (faster!)
    for page in range(1, 4):
        r = s.get("https://api.brewbean.dev/orders", params={"page": page}, timeout=10)
        print(f"Page {page}: {r.status_code}, {len(r.json())} orders")

# session auto-closed here`}
          output={`Page 1: 200, 50 orders
Page 2: 200, 50 orders
Page 3: 200, 23 orders`}
        />
        <Callout type="tip">
          💡 <strong>Session speedup</strong>: For a single request, the overhead of creating a Session is not worth it. But if you make 10+ requests to the same host, Session reuses the TCP connection (HTTP keep-alive), saving ~100-200ms per request. For APIs, that&apos;s huge.
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="debugging" number="13" title="Debugging Tricks">
        <P>
          When an API call fails, here&apos;s how to debug it:
        </P>
        <Callout type="tip">
          💡 <strong>Trick 1: Print the full request</strong> — see what you actually sent.
        </Callout>
        <CodeBlock
          title="debug_request.py"
          code={`import requests

url = "https://api.brewbean.dev/orders"
headers = {"Authorization": "Bearer sk_abc123"}
params = {"page": 1, "status": "pending"}

r = requests.get(url, headers=headers, params=params)

# Debug: what did we actually send?
print("Request URL:", r.request.url)
print("Request headers:", dict(r.request.headers))
print("Request method:", r.request.method)
print("Request body:", r.request.body)`}
          output={`Request URL: https://api.brewbean.dev/orders?page=1&status=pending
Request headers: {'Authorization': 'Bearer sk_abc123', 'User-Agent': 'python-requests/2.31.0', 'Accept-Encoding': 'gzip, deflate', 'Accept': '*/*', 'Connection': 'keep-alive'}
Request method: GET
Request body: None`}
        />
        <Callout type="tip">
          💡 <strong>Trick 2: Echo the request</strong> — use httpbin.org to see exactly what the server receives.
        </Callout>
        <CodeBlock
          title="echo_request.py"
          code={`import requests

# httpbin.org echoes your request back as JSON
r = requests.post("https://httpbin.org/post",
                  json={"items": [1, 3]},
                  headers={"Authorization": "Bearer test"})

print("What the server saw:")
print(r.json()["json"])  # your body
print(r.json()["headers"])  # your headers`}
          output={`What the server saw:
{'items': [1, 3]}
{'Accept': '*/*', 'Accept-Encoding': 'gzip, deflate', 'Authorization': 'Bearer test', 'Content-Length': '16', 'Content-Type': 'application/json', 'Host': 'httpbin.org', 'User-Agent': 'python-requests/2.31.0'}`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake #1</strong>: Forgetting to call <IC>.json()</IC>. You print <IC>r</IC> (a Response object) instead of <IC>r.json()</IC> (the data). Always: <IC>data = r.json()</IC>.
        </Callout>
        <Callout type="mistake">
          ⚠️ <strong>Common mistake #2</strong>: Passing a dict to <IC>data=</IC> expecting JSON. Use <IC>json=</IC> for JSON APIs, not <IC>data=</IC>. <IC>data=</IC> sends form-encoded, not JSON.
        </Callout>
        <Callout type="mistake">
          ⚠️ <strong>Common mistake #3</strong>: Ignoring non-200 status codes. Always check <IC>if r.ok</IC> or call <IC>r.raise_for_status()</IC> BEFORE parsing the body.
        </Callout>
      </Section>

      {/* 14 */}
      <Section id="lab" number="14" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Paginated API + API Key + Error Handling
──────────────────────────────────────────────────────────────

SCENARIO: The Brew & Bean API has a paginated /orders endpoint.
Your task: Fetch all orders, handle a 401 by adding the key, sum totals.

TASK 1: Trigger a 401 (no auth)
  Code: r = requests.get("https://api.brewbean.dev/orders")
  Expected: 401 Unauthorized
  Verify: r.status_code == 401, r.json() has "error" key

TASK 2: Add API key, get first page
  Code: headers = {"Authorization": "Bearer sk_test_abc123"}
        r = requests.get("https://api.brewbean.dev/orders", headers=headers, params={"page": 1})
  Expected: 200, JSON array of orders
  Verify: len(r.json()) > 0

TASK 3: Loop through all pages
  Pseudo:
    page = 1
    all_orders = []
    while True:
        fetch page, append to all_orders
        if empty, break
        page += 1
  Expected: ~150 total orders across 3-4 pages
  Verify: print(f"Total orders: {len(all_orders)}")

TASK 4: Sum order totals
  Each order has a "total" field (float).
  Code: revenue = sum(order["total"] for order in all_orders)
  Expected: ₹12,450 (example)
  Verify: print(f"Total revenue: ₹{revenue}")

TASK 5: Handle timeout
  Set timeout=2 (artificially low), catch Timeout exception.
  Expected: requests.exceptions.Timeout raised
  Verify: Your try/except catches it, prints "Request timed out"

──────────────────────────────────────────────────────────────
REFLECTION:
- What happens if you forget r.raise_for_status()?
  → 4xx/5xx errors don't crash, you proceed with bad data silently.

- What happens if you use data= instead of json=?
  → Server gets form-encoded data, not JSON. 400 Bad Request.

- What happens if you don't set timeout=?
  → If server hangs, your script waits forever. Always set timeout.`}
        />
      </Section>

      {/* 15 */}
      <Section id="interview" number="15" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["Why use requests instead of urllib?", "requests is higher-level and human-friendly. It auto-handles JSON encoding (json= param), session cookies, redirects, and has clean error handling (raise_for_status()). urllib is verbose and low-level. requests is the industry standard."],
            ["What does r.json() do?", "It parses the response body as JSON and returns a Python dict or list. It's a shortcut for json.loads(r.text). If the body isn't valid JSON, it raises a JSONDecodeError. Always check r.ok first to avoid parsing error HTML."],
            ["What's the difference between json= and data= in requests.post()?", "json= auto-encodes a dict as JSON and sets Content-Type: application/json. data= sends form-encoded (key=value&key2=value2) and sets Content-Type: application/x-www-form-urlencoded. Use json= for modern APIs, data= for HTML forms."],
            ["How do you handle errors in requests?", "Use try/except with HTTPError (4xx/5xx responses), ConnectionError (server unreachable), and Timeout (took too long). Call r.raise_for_status() to convert 4xx/5xx into exceptions. Always set timeout= to avoid hanging indefinitely."],
            ["What is raise_for_status()?", "A method that raises requests.exceptions.HTTPError if status_code >= 400. It lets you use exceptions instead of manual if-checks. The raised exception has a .response attribute with the full Response object (status, body, headers)."],
            ["Why ALWAYS set timeout=?", "Without timeout=, requests waits forever if the server hangs. Your script freezes, consuming a thread/worker. Always set timeout=5 (or 10, 30 for slow APIs). Better to fail fast with Timeout exception than hang indefinitely."],
            ["How do you paginate API results?", "Loop while results are non-empty. Increment page= param, append results to a list. Break when the response is []. Some APIs use cursor-based pagination (next_cursor token). Same pattern: loop until next_cursor is null."],
            ["Where should you store API keys?", "NEVER hardcode in code. Use environment variables (os.environ) or a .env file (with python-dotenv). Add .env to .gitignore. If you push a key to GitHub, rotate it immediately (revoke old, generate new). Treat keys like passwords."],
            ["What's the difference between 401 and 403?", "401 Unauthorized: you didn't authenticate (missing/invalid API key). The server asks: who are you? 403 Forbidden: you're authenticated but not allowed to access this resource (permission denied). Example: 401 = no key, 403 = not your order."],
            ["Why use requests.Session()?", "For multiple requests to the same host, Session reuses the TCP connection (HTTP keep-alive), saving 100-200ms per request. You can also set headers once for all requests in the session. Use 'with requests.Session() as s:' to auto-close."],
          ]}
        />
      </Section>

      {/* 16 */}
      <Section id="memorize" number="16" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Install", "pip install requests"],
            ["Basic GET", "r = requests.get(url, timeout=10)"],
            ["Check status", "if r.ok: ... or r.raise_for_status()"],
            ["Parse JSON", "data = r.json()  # dict or list"],
            ["Query params", "requests.get(url, params={'key': 'value'})"],
            ["Custom headers", "requests.get(url, headers={'Authorization': 'Bearer KEY'})"],
            ["POST JSON", "requests.post(url, json={'field': 'value'})"],
            ["Error handling", "try: r.raise_for_status() except HTTPError/ConnectionError/Timeout"],
            ["ALWAYS timeout", "requests.get(url, timeout=5) — never omit this!"],
            ["Pagination loop", "while True: fetch page, if empty break, page += 1"],
            ["API key (env var)", "os.environ.get('API_KEY') — never hardcode"],
            ["Session reuse", "with requests.Session() as s: s.get(...), s.post(...)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
