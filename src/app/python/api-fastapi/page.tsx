"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "uvicorn serves your first endpoint",
  nodes: [
    { id: "browser", icon: "🌐", label: "Client", sub: "browser / curl", x: 6, y: 50, color: "#22d3ee" },
    { id: "uvicorn", icon: "🦄", label: "uvicorn", sub: "ASGI server :8000", x: 26, y: 50, color: "#a78bfa" },
    { id: "app", icon: "⚡", label: "FastAPI app", sub: "", x: 46, y: 50, color: "#fb923c" },
    { id: "route", icon: "🧭", label: "@app.get('/menu')", sub: "", x: 66, y: 22, color: "#fbbf24" },
    { id: "func", icon: "🐍", label: "def get_menu()", sub: "", x: 66, y: 78, color: "#34d399" },
    { id: "docs", icon: "📖", label: "/docs", sub: "auto Swagger", x: 46, y: 14, color: "#60a5fa" },
    { id: "json", icon: "📦", label: "JSON out", sub: "", x: 88, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "browser-uvicorn", from: "browser", to: "uvicorn", color: "#22d3ee" },
    { id: "uvicorn-app", from: "uvicorn", to: "app", color: "#a78bfa" },
    { id: "app-route", from: "app", to: "route", color: "#fbbf24" },
    { id: "route-func", from: "route", to: "func", color: "#34d399" },
    { id: "func-json", from: "func", to: "json", color: "#34d399" },
    { id: "json-browser", from: "json", to: "browser", bend: -80, color: "#34d399" },
    { id: "app-docs", from: "app", to: "docs", dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ GET /menu → 200",
      command: "curl http://127.0.0.1:8000/menu",
      steps: [
        { node: "browser", paths: ["browser-uvicorn"], text: "Client sends: GET /menu HTTP/1.1 to localhost:8000. Could be curl, a browser, requests, Postman — any HTTP client." },
        { node: "uvicorn", paths: ["uvicorn-app"], text: "uvicorn (ASGI server) listens on port 8000. It receives the raw HTTP request, parses it, and hands it to your FastAPI app instance." },
        { node: "app", paths: ["app-route"], text: "FastAPI app looks at the method (GET) and path (/menu). It searches registered routes: which decorator matches @app.get('/menu')?" },
        { node: "route", paths: ["route-func"], text: "Match found! The @app.get('/menu') decorator registered get_menu() as the handler. FastAPI calls your function: result = get_menu()." },
        { node: "func", paths: ["func-json"], text: "Your function runs: return [{'id':1,'name':'Latte','price':180}, ...]. You return a Python list. No manual JSON encoding needed!" },
        { node: "json", paths: ["json-browser"], text: "FastAPI auto-converts your list to JSON, sets Content-Type: application/json, status 200 OK, and returns the response to uvicorn." },
        { node: "browser", paths: [], text: "Client receives: HTTP/1.1 200 OK, body: [{...}, {...}]. Your Python function is now a live API endpoint! ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Wrong type → 422",
      command: "GET /menu/abc (expects int)",
      steps: [
        { node: "browser", paths: ["browser-uvicorn"], text: "Client sends: GET /menu/abc. The endpoint is defined as @app.get('/menu/{item_id}') with item_id: int." },
        { node: "uvicorn", paths: ["uvicorn-app"], text: "uvicorn hands the request to FastAPI. Path parameter is 'abc' (a string)." },
        { node: "app", paths: ["app-route"], text: "FastAPI tries to convert 'abc' to int (because you typed item_id: int). Conversion fails: ValueError." },
        { node: "route", paths: ["json-browser"], text: "FastAPI catches the error BEFORE calling your function. Returns: 422 Unprocessable Entity, body: {'detail': [{'loc': ['path', 'item_id'], 'msg': 'value is not a valid integer', 'type': 'type_error.integer'}]}. 🚨" },
        { node: "json", paths: ["json-browser"], text: "The 422 response (red flag) travels back to the client. Your function NEVER ran — FastAPI validated and rejected the request for you." },
        { node: "browser", paths: [], text: "Client sees 422 + helpful error JSON. Fix: use /menu/1 (int) not /menu/abc. Type hints = automatic validation. 🎯" },
      ],
    },
    {
      id: "power",
      name: "⚡ Explore /docs",
      command: "Open browser: http://127.0.0.1:8000/docs",
      steps: [
        { node: "browser", paths: ["browser-uvicorn"], text: "You navigate to /docs in your browser. This is a built-in route — you didn't write any code for it!" },
        { node: "uvicorn", paths: ["uvicorn-app"], text: "uvicorn forwards GET /docs to FastAPI." },
        { node: "app", paths: ["app-docs"], text: "FastAPI auto-generated an OpenAPI spec from your code (read your decorators, type hints, docstrings). It serves an interactive Swagger UI at /docs." },
        { node: "docs", paths: ["json-browser"], text: "Swagger UI renders. You see all your endpoints: GET /menu, GET /menu/{item_id}, POST /orders. Click one, fill params, click 'Try it out'." },
        { node: "json", paths: ["json-browser"], text: "The UI sends a real HTTP request to your API (e.g., GET /menu/1) and displays the response. It's a live playground built into your API for free! 📖" },
        { node: "browser", paths: [], text: "You can test every endpoint without writing curl commands. Share /docs with teammates — they have instant API documentation. 🚀" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Build Your Own API?" },
  { id: "install", label: "Install FastAPI & uvicorn" },
  { id: "first", label: "Your First 8-Line API ⭐" },
  { id: "decorator", label: "What @app.get() Means" },
  { id: "auto-json", label: "Auto JSON Conversion" },
  { id: "menu", label: "Serve the MENU" },
  { id: "path-params", label: "Path Parameters ⭐" },
  { id: "query-params", label: "Query Parameters" },
  { id: "http-exception", label: "Raising Errors (HTTPException) ⭐" },
  { id: "docs", label: "Free Auto-Docs (/docs & /redoc) ⭐" },
  { id: "reload", label: "The --reload Dev Loop" },
  { id: "full-circle", label: "Full Circle: Call Your Own API" },
  { id: "debugging", label: "Debugging & Common Errors" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiFastApiPage() {
  return (
    <TopicShell
      icon="⚡"
      title="FastAPI — Build Your First API"
      gradientWord="FastAPI"
      subtitle="FastAPI is the modern, fast Python framework for building APIs. It uses type hints for automatic validation, generates interactive docs, and makes you productive in minutes. You'll build real endpoints, handle errors, and experience the full-circle moment: calling your own API with requests."
      nav={NAV}
      badges={["⚡ FastAPI basics", "🧭 Routes & decorators", "🔧 Path & query params", "📖 Auto-generated docs", "🚨 Error handling"]}
      next={{ icon: "🗃️", label: "CRUD — a Real Orders API", href: "/python/api-crud" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Build Your Own API?">
        <P>
          You&apos;ve learned to <strong>call</strong> APIs with requests. Now you&apos;ll <strong>build</strong> one. Why?
        </P>
        <Table
          head={["Use case", "Example"]}
          rows={[
            ["Share your Python functions with other apps", "Your data-cleaning script becomes an API. A web app (JavaScript) calls it via HTTP instead of running Python directly."],
            ["Build a backend for a mobile/web app", "Flutter app needs coffee menu? Your FastAPI serves GET /menu. React app submits orders? Your FastAPI handles POST /orders."],
            ["Microservices", "Split a big app into small services. Orders API, Payments API, Notifications API — each is a separate FastAPI app talking via HTTP."],
            ["Expose ML models", "Train a model in scikit-learn, wrap it in FastAPI. Now anyone can POST /predict with data, get predictions back as JSON."],
            ["Internal tools for your team", "Automate database queries, file uploads, report generation — wrap them as API endpoints. Teammates call them from Postman/curl."],
          ]}
        />
        <P>
          <strong>Why FastAPI specifically?</strong> It&apos;s fast (built on Starlette + Pydantic), uses modern Python (type hints for validation), auto-generates docs (Swagger UI), and has the best developer experience. Flask is older and simpler; Django is heavier. FastAPI is the sweet spot for APIs. 🚀
        </P>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install FastAPI & uvicorn">
        <CodeBlock
          title="terminal"
          code={`pip install fastapi uvicorn`}
        />
        <P>
          Two packages:
        </P>
        <Table
          head={["Package", "What it is", "Role"]}
          rows={[
            [<IC>fastapi</IC>, "The web framework (routing, validation, docs generation)", "You write code with FastAPI classes and decorators"],
            [<IC>uvicorn</IC>, "An ASGI server (like gunicorn but for async Python)", "Runs your FastAPI app, listens on a port, serves HTTP requests"],
          ]}
        />
        <CodeBlock
          title="verify_install.py"
          code={`import fastapi
import uvicorn

print("FastAPI version:", fastapi.__version__)
print("uvicorn version:", uvicorn.__version__)
print("Ready to build APIs! ⚡")`}
          output={`FastAPI version: 0.109.0
uvicorn version: 0.27.0
Ready to build APIs! ⚡`}
        />
      </Section>

      {/* 03 */}
      <Section id="first" number="03" title="Your First 8-Line API ⭐">
        <P>
          Let&apos;s build the simplest possible API: one endpoint that returns a message.
        </P>
        <CodeBlock
          title="main.py"
          code={`from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Brew & Bean is open!"}

# That's it! 7 lines (8 with imports). Now run it.`}
        />
        <CodeBlock
          title="terminal (run the server)"
          code={`uvicorn main:app --reload`}
          output={`INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.`}
        />
        <P>
          Your API is LIVE! Open a new terminal (leave uvicorn running) and test it:
        </P>
        <CodeBlock
          title="terminal (test with curl)"
          code={`curl http://127.0.0.1:8000/`}
          output={`{"message":"Brew & Bean is open!"}`}
        />
        <CodeBlock
          title="test_with_requests.py (in another terminal)"
          code={`import requests

r = requests.get("http://127.0.0.1:8000/")
print("Status:", r.status_code)
print("JSON:", r.json())`}
          output={`Status: 200
JSON: {'message': 'Brew & Bean is open!'}`}
        />
        <P>
          <strong>What just happened?</strong>
        </P>
        <CodeBlock
          title="breakdown.txt"
          runnable={false}
          code={`from fastapi import FastAPI
  → Import the FastAPI class (the framework core).

app = FastAPI()
  → Create an instance. This 'app' object is your API.
    You register routes (endpoints) on it with decorators.

@app.get("/")
  → A decorator. Registers the next function as a handler for:
      METHOD: GET
      PATH: /
    When a client sends "GET /", FastAPI calls root().

def root():
  → Your handler function. It runs when the route matches.
    The name 'root' is arbitrary — call it anything.

return {"message": "Brew & Bean is open!"}
  → Return a Python dict. FastAPI auto-converts it to JSON.
    No json.dumps(), no Content-Type header — automatic. ✅

────────────────────────────────────────────────────────────────
uvicorn main:app --reload
  → main = Python module (main.py)
  → app = the FastAPI() instance in that module
  → --reload = auto-restart when code changes (dev mode only!)

uvicorn binds to 127.0.0.1:8000 (localhost, port 8000).
Your API is now running. Keep this terminal open. 🚀`}
        />
        <Callout type="tip">
          💡 <strong>--reload is magic during development</strong>. Every time you save <IC>main.py</IC>, uvicorn restarts automatically. You see changes instantly without stopping/starting the server. In production, remove <IC>--reload</IC> (it&apos;s slow and uses extra memory).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="decorator" number="04" title="What @app.get() Means">
        <P>
          The <IC>@app.get(&quot;/&quot;)</IC> line is a <strong>decorator</strong> — a Python feature that wraps a function. Here&apos;s what it does under the hood:
        </P>
        <CodeBlock
          title="decorator_explained.txt"
          runnable={false}
          code={`@app.get("/")
def root():
    return {"message": "Hello"}

IS EQUIVALENT TO:

def root():
    return {"message": "Hello"}

root = app.get("/")(root)  # decorator magic

WHAT app.get("/") DOES:
1. Registers root() in FastAPI's internal route table:
     routes[("GET", "/")] = root

2. When a request arrives (GET /), FastAPI looks up the table,
   finds root(), calls it, and returns the result as JSON.

────────────────────────────────────────────────────────────────
OTHER HTTP METHODS (same pattern):

@app.post("/orders")      → POST /orders
@app.put("/orders/7")     → PUT /orders/7
@app.patch("/orders/7")   → PATCH /orders/7
@app.delete("/orders/7")  → DELETE /orders/7

You can have MULTIPLE routes on the same path with different methods:

@app.get("/orders")        ← list orders
def list_orders():
    ...

@app.post("/orders")       ← create order (DIFFERENT endpoint!)
def create_order():
    ...

Same PATH, different METHOD = different routes. 🎯`}
        />
        <Callout type="behind">
          ⚙️ <strong>Behind the scenes</strong>: FastAPI uses Starlette (a low-level ASGI framework) to handle HTTP parsing. When a request comes in, Starlette parses it, FastAPI matches the route, calls your function, validates inputs (type hints), and serializes the output (dict → JSON). You write business logic; FastAPI handles the HTTP plumbing.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="auto-json" number="05" title="Auto JSON Conversion">
        <P>
          In Flask, you&apos;d write <IC>return jsonify({`{...}`})</IC>. In FastAPI, just return a dict or list — it auto-converts to JSON:
        </P>
        <CodeBlock
          title="auto_json.py"
          code={`from fastapi import FastAPI

app = FastAPI()

@app.get("/item")
def get_item():
    # Return a dict — becomes JSON automatically
    return {"id": 1, "name": "Latte", "price": 180}

@app.get("/items")
def get_items():
    # Return a list of dicts — becomes JSON array
    return [
        {"id": 1, "name": "Latte"},
        {"id": 2, "name": "Cappuccino"}
    ]

@app.get("/count")
def get_count():
    # Return a plain int — becomes JSON number
    return 42

# Run: uvicorn auto_json:app --reload
# Test: curl http://127.0.0.1:8000/items`}
        />
        <CodeBlock
          title="terminal"
          code={`curl http://127.0.0.1:8000/items`}
          output={`[{"id":1,"name":"Latte"},{"id":2,"name":"Cappuccino"}]`}
        />
        <P>
          FastAPI sets <IC>Content-Type: application/json</IC> automatically. It uses Pydantic&apos;s JSON encoder (handles datetime, Decimal, UUID, etc. out of the box).
        </P>
        <Callout type="note">
          📌 You can also return Pydantic models (coming in next chapter: CRUD). FastAPI serializes them to JSON using their schema. For now, dicts/lists are enough.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="menu" number="06" title="Serve the MENU">
        <P>
          Let&apos;s build a real endpoint: serve the Brew &amp; Bean menu (our fixed 4 items).
        </P>
        <CodeBlock
          title="menu_api.py"
          code={`from fastapi import FastAPI

app = FastAPI()

# In-memory data (in real apps, this comes from a database)
MENU = [
    {"id": 1, "name": "Latte", "category": "Drink", "price": 180},
    {"id": 2, "name": "Cappuccino", "category": "Drink", "price": 160},
    {"id": 3, "name": "Espresso", "category": "Drink", "price": 90},
    {"id": 4, "name": "Croissant", "category": "Food", "price": 120},
]

@app.get("/menu")
def get_menu():
    return MENU

# Run: uvicorn menu_api:app --reload
# Test: curl http://127.0.0.1:8000/menu`}
        />
        <CodeBlock
          title="terminal"
          code={`curl http://127.0.0.1:8000/menu`}
          output={`[{"id":1,"name":"Latte","category":"Drink","price":180},{"id":2,"name":"Cappuccino","category":"Drink","price":160},{"id":3,"name":"Espresso","category":"Drink","price":90},{"id":4,"name":"Croissant","category":"Food","price":120}]`}
        />
        <P>
          Congratulations! You just built a REST API endpoint. Any client (curl, requests, a browser, a mobile app) can call <IC>GET /menu</IC> and get the menu as JSON. 🎉
        </P>
      </Section>

      {/* 07 */}
      <Section id="path-params" number="07" title="Path Parameters ⭐">
        <P>
          What if you want to fetch ONE menu item by ID? Use a <strong>path parameter</strong> (variable part of the URL):
        </P>
        <CodeBlock
          title="path_params.py"
          code={`from fastapi import FastAPI

app = FastAPI()

MENU = [
    {"id": 1, "name": "Latte", "category": "Drink", "price": 180},
    {"id": 2, "name": "Cappuccino", "category": "Drink", "price": 160},
    {"id": 3, "name": "Espresso", "category": "Drink", "price": 90},
    {"id": 4, "name": "Croissant", "category": "Food", "price": 120},
]

@app.get("/menu/{item_id}")
def get_menu_item(item_id: int):
    # item_id is extracted from the URL path
    # FastAPI auto-converts it to int (because of the type hint)
    for item in MENU:
        if item["id"] == item_id:
            return item
    # If not found, we'll handle that in the next section
    return {"error": "Item not found"}

# Run: uvicorn path_params:app --reload
# Test: curl http://127.0.0.1:8000/menu/2`}
        />
        <CodeBlock
          title="terminal"
          code={`curl http://127.0.0.1:8000/menu/2`}
          output={`{"id":2,"name":"Cappuccino","category":"Drink","price":160}`}
        />
        <P>
          <strong>What happened?</strong>
        </P>
        <CodeBlock
          title="path_params_explained.txt"
          runnable={false}
          code={`@app.get("/menu/{item_id}")
            ↑
      curly braces = path parameter (variable)

def get_menu_item(item_id: int):
                    ↑        ↑
                 name matches  type hint

REQUEST:   GET /menu/2
EXTRACTED: item_id = "2" (string from URL)
CONVERTED: item_id = 2 (int, because of : int type hint)
VALIDATION: If you send /menu/abc (not an int), FastAPI returns 422
            BEFORE calling your function. Automatic validation! 🎯

────────────────────────────────────────────────────────────────
TYPE HINTS = AUTOMATIC VALIDATION

def get_item(item_id: int)     → /menu/2   ✅ (converts "2" → 2)
                                 /menu/abc ❌ (422 validation error)

def get_item(item_id: str)     → /menu/abc ✅ (keeps as "abc")

def get_item(item_id: float)   → /menu/3.5 ✅ (converts "3.5" → 3.5)

def get_item(item_id)          → NO type hint = treated as string

────────────────────────────────────────────────────────────────
MULTIPLE PATH PARAMS:

@app.get("/orders/{order_id}/items/{item_id}")
def get_order_item(order_id: int, item_id: int):
    # order_id and item_id extracted from URL
    return {"order": order_id, "item": item_id}

Test: curl http://127.0.0.1:8000/orders/7/items/3
  → order_id=7, item_id=3 ✅`}
        />
        <Callout type="tip">
          💡 <strong>Type hints are not just documentation</strong> — FastAPI uses them to validate inputs. If you type <IC>item_id: int</IC> and someone sends <IC>/menu/abc</IC>, FastAPI returns a 422 error with a helpful message BEFORE your function runs. This prevents crashes and makes your API robust. Always use type hints!
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="query-params" number="08" title="Query Parameters">
        <P>
          Query params (the <IC>?key=value&amp;key2=value2</IC> part) are for <strong>optional filters</strong>. In FastAPI, they&apos;re just function arguments that aren&apos;t in the path:
        </P>
        <CodeBlock
          title="query_params.py"
          code={`from fastapi import FastAPI

app = FastAPI()

MENU = [
    {"id": 1, "name": "Latte", "category": "Drink", "price": 180},
    {"id": 2, "name": "Cappuccino", "category": "Drink", "price": 160},
    {"id": 3, "name": "Espresso", "category": "Drink", "price": 90},
    {"id": 4, "name": "Croissant", "category": "Food", "price": 120},
]

@app.get("/menu")
def list_menu(max_price: int = 1000):
    # max_price is a QUERY param (not in path)
    # Default value = 1000 (optional: if not provided, use 1000)
    filtered = [item for item in MENU if item["price"] <= max_price]
    return filtered

# Run: uvicorn query_params:app --reload
# Test: curl "http://127.0.0.1:8000/menu?max_price=150"`}
        />
        <CodeBlock
          title="terminal"
          code={`curl "http://127.0.0.1:8000/menu?max_price=150"`}
          output={`[{"id":3,"name":"Espresso","category":"Drink","price":90},{"id":4,"name":"Croissant","category":"Food","price":120}]`}
        />
        <P>
          <strong>How FastAPI knows it&apos;s a query param:</strong>
        </P>
        <CodeBlock
          title="query_vs_path.txt"
          runnable={false}
          code={`@app.get("/menu/{item_id}")
def get_item(item_id: int, details: bool = False):
                ↑                  ↑
          PATH param          QUERY param
         (in the route)     (not in the route, has default)

REQUEST: GET /menu/2?details=true
EXTRACTED:
  item_id = 2      (from path /menu/2)
  details = True   (from query ?details=true, converted to bool)

────────────────────────────────────────────────────────────────
RULES:
- If the param name appears in the route ("/menu/{item_id}"),
  it's a PATH parameter.

- If it doesn't appear in the route but is a function arg,
  it's a QUERY parameter.

- Query params with default values are OPTIONAL.
  Query params without defaults are REQUIRED (422 if missing).

────────────────────────────────────────────────────────────────
EXAMPLES:

@app.get("/menu")
def list_menu(category: str = None, max_price: int = 1000):
    # Both query params, both optional
    # /menu → category=None, max_price=1000
    # /menu?category=Drink → category="Drink", max_price=1000
    # /menu?category=Food&max_price=100 → category="Food", max_price=100
    ...

@app.get("/search")
def search(q: str):
    # q is REQUIRED (no default)
    # /search → 422 error "field required"
    # /search?q=latte → q="latte" ✅
    ...`}
        />
        <Callout type="note">
          📌 <strong>Query params vs path params</strong>: Use PATH params for resource IDs (required, part of the resource identity). Use QUERY params for filters, sorting, pagination (optional or configurable). Example: <IC>GET /orders/7</IC> (path) vs <IC>GET /orders?status=pending&amp;page=2</IC> (query).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="http-exception" number="09" title="Raising Errors (HTTPException) ⭐">
        <P>
          When something goes wrong (item not found, invalid input, etc.), you <strong>raise</strong> an <IC>HTTPException</IC>. FastAPI catches it and returns the appropriate status code + JSON error:
        </P>
        <CodeBlock
          title="http_exception.py"
          code={`from fastapi import FastAPI, HTTPException

app = FastAPI()

MENU = [
    {"id": 1, "name": "Latte", "category": "Drink", "price": 180},
    {"id": 2, "name": "Cappuccino", "category": "Drink", "price": 160},
    {"id": 3, "name": "Espresso", "category": "Drink", "price": 90},
    {"id": 4, "name": "Croissant", "category": "Food", "price": 120},
]

@app.get("/menu/{item_id}")
def get_menu_item(item_id: int):
    for item in MENU:
        if item["id"] == item_id:
            return item

    # Not found → raise HTTPException
    raise HTTPException(status_code=404, detail="Menu item not found")

# Run: uvicorn http_exception:app --reload
# Test: curl http://127.0.0.1:8000/menu/999`}
        />
        <CodeBlock
          title="terminal"
          code={`curl -i http://127.0.0.1:8000/menu/999`}
          output={`HTTP/1.1 404 Not Found
content-type: application/json

{"detail":"Menu item not found"}`}
        />
        <P>
          <strong>HTTPException anatomy:</strong>
        </P>
        <CodeBlock
          title="http_exception_explained.txt"
          runnable={false}
          code={`raise HTTPException(status_code=404, detail="Menu item not found")
                       ↑             ↑                ↑
                  status code    the HTTP     error message (goes in JSON body)
                  (404, 400,      code         {"detail": "..."}
                   401, 422,
                   500, etc.)

────────────────────────────────────────────────────────────────
COMMON PATTERNS:

# 404 Not Found (resource doesn't exist)
if item not in database:
    raise HTTPException(404, detail="Item not found")

# 400 Bad Request (client sent invalid data)
if len(order["items"]) == 0:
    raise HTTPException(400, detail="Order must have at least 1 item")

# 401 Unauthorized (missing/invalid API key)
if api_key != "sk_secret":
    raise HTTPException(401, detail="Invalid API key")

# 403 Forbidden (authenticated but not allowed)
if order.customer_id != current_user.id:
    raise HTTPException(403, detail="You can't access this order")

# 422 Unprocessable Entity (validation failed — usually auto-raised)
# You rarely raise 422 manually; FastAPI does it for type mismatches.

────────────────────────────────────────────────────────────────
WHY USE HTTPException INSTEAD OF return {"error": "..."}?

BAD:
  return {"error": "Item not found"}  # status is 200 ❌
  → Client sees 200 OK but body has error. Misleading!

GOOD:
  raise HTTPException(404, detail="Item not found")  # status 404 ✅
  → Client sees 404 Not Found + error body. Clear signal.

HTTP status codes are SEMANTIC. Use them correctly. 🎯`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake</strong>: Returning <IC>{`{"error": "..."}`}</IC> with status 200. This confuses clients — they check <IC>r.ok</IC> (True because 200), then crash when parsing the body. ALWAYS raise <IC>HTTPException</IC> for errors, not return error dicts.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="docs" number="10" title="Free Auto-Docs (/docs & /redoc) ⭐">
        <P>
          The killer feature: FastAPI <strong>auto-generates interactive API documentation</strong> from your code. No extra work. Just navigate to <IC>/docs</IC>:
        </P>
        <CodeBlock
          title="terminal (while uvicorn is running)"
          code={`# Open in browser:
# http://127.0.0.1:8000/docs`}
          runnable={false}
        />
        <P>
          You&apos;ll see <strong>Swagger UI</strong> — a web page listing all your endpoints. You can:
        </P>
        <Table
          head={["Feature", "What you can do"]}
          rows={[
            ["See all endpoints", "GET /menu, GET /menu/{item_id}, POST /orders — every route you defined"],
            ["View parameters", "Path params, query params, request body schemas — all auto-documented"],
            ["Try it out", "Click an endpoint → fill in values → click 'Execute' → see real response"],
            ["See response schemas", "FastAPI infers response shape from your return statements / Pydantic models"],
            ["Download OpenAPI spec", "Click /docs → top-right → 'OpenAPI schema' → JSON spec for code generators"],
          ]}
        />
        <P>
          There&apos;s also <IC>/redoc</IC> (alternative UI, read-only, cleaner for sharing docs):
        </P>
        <CodeBlock
          title="terminal"
          code={`# Open in browser:
# http://127.0.0.1:8000/redoc`}
          runnable={false}
        />
        <Callout type="tip">
          💡 <strong>Teams LOVE this.</strong> You share <IC>http://your-api.com/docs</IC> with frontend devs, they explore the API interactively, test endpoints, copy example requests — no Postman collection needed. The docs are always up-to-date because they&apos;re generated from your live code. 📖
        </Callout>
        <CodeBlock
          title="how_docs_are_generated.txt"
          runnable={false}
          code={`HOW DOES /docs WORK?

1. FastAPI reads your decorators:
     @app.get("/menu/{item_id}")
     → Knows: method=GET, path="/menu/{item_id}"

2. FastAPI reads your type hints:
     def get_item(item_id: int, details: bool = False):
     → Knows: item_id is an int (path param), details is bool (query param, optional)

3. FastAPI reads your return type (if you annotate it):
     def get_item(...) -> dict:
     → Knows: response is a dict (can infer schema)

4. FastAPI generates an OpenAPI 3.0 JSON spec (industry standard).

5. /docs serves Swagger UI (HTML/JS) that renders the OpenAPI spec.

6. /redoc serves ReDoc (alternative renderer, also from OpenAPI spec).

────────────────────────────────────────────────────────────────
YOU WRITE CODE. FASTAPI WRITES THE DOCS. 🚀

No manual Swagger YAML. No Postman collections to maintain.
Change your code → docs update automatically. ✅`}
        />
      </Section>

      {/* 11 */}
      <Section id="reload" number="11" title="The --reload Dev Loop">
        <P>
          The <IC>--reload</IC> flag is your best friend during development. It watches your <IC>main.py</IC> (and imported files) and auto-restarts uvicorn when you save:
        </P>
        <CodeBlock
          title="terminal"
          code={`uvicorn main:app --reload`}
          output={`INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.`}
        />
        <P>
          Now edit <IC>main.py</IC>, save, and look at the terminal:
        </P>
        <CodeBlock
          title="terminal (after saving main.py)"
          code={`# (automatically appears in the uvicorn terminal)`}
          output={`INFO:     Detected file change in 'main.py'. Reloading...
INFO:     Shutting down
INFO:     Finished server process [12346]
INFO:     Started server process [12347]
INFO:     Waiting for application startup.
INFO:     Application startup complete.`}
        />
        <P>
          Your changes are live instantly. No manual restart. The dev loop:
        </P>
        <CodeBlock
          title="dev_loop.txt"
          runnable={false}
          code={`1. uvicorn main:app --reload  (start server, keep running)
2. Edit main.py (add a route, fix a bug)
3. Save (Ctrl+S / Cmd+S)
4. uvicorn auto-restarts (~1 second)
5. Test: curl http://127.0.0.1:8000/your-new-route
6. Repeat steps 2-5

────────────────────────────────────────────────────────────────
PRODUCTION:

uvicorn main:app --host 0.0.0.0 --port 8000
  (NO --reload, bind to all interfaces, production-ready)

Or use gunicorn with uvicorn workers (more robust):
  gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

────────────────────────────────────────────────────────────────
WHERE DOES PRINT() OUTPUT GO?

print("Debug message")  → appears in the uvicorn terminal

This is your friend for debugging. Want to see what item_id is?
  print(f"Received item_id: {item_id}")
Look at the terminal running uvicorn. You'll see the message. 🔍`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Mistake</strong>: Running uvicorn in the background or in a separate terminal, then forgetting where the output goes. Keep the uvicorn terminal visible — that&apos;s where errors, print statements, and reload messages appear.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="full-circle" number="12" title="Full Circle: Call Your Own API">
        <P>
          The magic moment: you built an API (FastAPI). Now call it from another script (requests). The full circle — client and server, both Python, both you:
        </P>
        <CodeBlock
          title="Step 1: Start your FastAPI server"
          code={`# In terminal 1:
uvicorn main:app --reload

# (keep this running)`}
          runnable={false}
        />
        <CodeBlock
          title="Step 2: Call your own API from Python"
          code={`# In terminal 2 (or a separate script):
import requests

url = "http://127.0.0.1:8000/menu"

r = requests.get(url)
print("Status:", r.status_code)
print("Menu:")
for item in r.json():
    print(f"  {item['id']}. {item['name']} — ₹{item['price']}")`}
          output={`Status: 200
Menu:
  1. Latte — ₹180
  2. Cappuccino — ₹160
  3. Espresso — ₹90
  4. Croissant — ₹120`}
        />
        <P>
          <strong>What just happened?</strong>
        </P>
        <CodeBlock
          title="full_circle.txt"
          runnable={false}
          code={`YOU WROTE THE SERVER (FastAPI):
  @app.get("/menu")
  def get_menu():
      return MENU

YOU WROTE THE CLIENT (requests):
  r = requests.get("http://127.0.0.1:8000/menu")
  menu = r.json()

THEY TALK VIA HTTP:
  Client → HTTP request → Server
  Server → HTTP response → Client

────────────────────────────────────────────────────────────────
THIS IS THE FOUNDATION OF MODERN SOFTWARE:

- Your FastAPI = backend (serves data)
- Your requests script = client (fetches data)
- Replace requests with a React app → you have a web app
- Replace requests with a Flutter app → you have a mobile app
- Replace requests with another FastAPI → microservices architecture

The protocol (HTTP + JSON) is universal. You now speak it on both ends. 🚀`}
        />
        <Callout type="note">
          📌 In production, you&apos;d deploy your FastAPI to a server (AWS, Heroku, Render, Railway) and change the URL to <IC>https://your-api.com/menu</IC>. The code is identical — only the URL changes. Localhost (<IC>127.0.0.1</IC>) is just for dev.
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="debugging" number="13" title="Debugging & Common Errors">
        <P>
          Here are the errors you&apos;ll hit and how to fix them:
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 1: ModuleNotFoundError: No module named &apos;uvicorn&apos;</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`uvicorn main:app --reload`}
          error
          output={`Traceback (most recent call last):
  File "/usr/local/bin/uvicorn", line 5, in <module>
    from uvicorn.main import main
ModuleNotFoundError: No module named 'uvicorn'`}
        />
        <P>
          <strong>Fix</strong>: <IC>pip install uvicorn</IC> (you forgot to install it).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 2: Error loading ASGI app. Attribute &quot;app&quot; not found</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`uvicorn main:myapp --reload`}
          error
          output={`ERROR:    Error loading ASGI app. Attribute "myapp" not found in module "main".`}
        />
        <P>
          <strong>Fix</strong>: You wrote <IC>app = FastAPI()</IC> but ran <IC>uvicorn main:myapp</IC>. The name must match. Use <IC>uvicorn main:app</IC> (or rename your variable to <IC>myapp</IC>).
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 3: OSError: [Errno 48] Address already in use</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`uvicorn main:app --reload`}
          error
          output={`ERROR:    [Errno 48] error while attempting to bind on address ('127.0.0.1', 8000): address already in use`}
        />
        <P>
          <strong>Fix</strong>: Port 8000 is already taken (you ran uvicorn twice, or another process is using it). Stop the old process (Ctrl+C in the terminal running uvicorn) or use a different port: <IC>uvicorn main:app --reload --port 8001</IC>.
        </P>
        <Callout type="mistake">
          ⚠️ <strong>Error 4: 422 Unprocessable Entity when calling your API</strong>
        </Callout>
        <CodeBlock
          title="terminal"
          code={`curl http://127.0.0.1:8000/menu/abc`}
          output={`{"detail":[{"loc":["path","item_id"],"msg":"value is not a valid integer","type":"type_error.integer"}]}`}
        />
        <P>
          <strong>Fix</strong>: You sent <IC>/menu/abc</IC> but <IC>item_id: int</IC> expects an integer. Use <IC>/menu/1</IC>. This is FastAPI&apos;s automatic validation — it&apos;s protecting you from bad input.
        </P>
        <Callout type="tip">
          💡 <strong>Reading 422 errors</strong>: The <IC>detail</IC> array tells you exactly what went wrong. <IC>loc</IC> = location (path/query/body), <IC>msg</IC> = human-readable message, <IC>type</IC> = error type. Use this to debug client requests.
        </Callout>
        <P>
          <strong>Where does print() output go?</strong> The uvicorn terminal. Always look there for debug messages, tracebacks, reload notices.
        </P>
      </Section>

      {/* 14 */}
      <Section id="lab" number="14" title="Lab Exercise">
        <CodeBlock
          title="lab_tasks.txt"
          runnable={false}
          code={`LAB: Build /menu and /menu/{id} from scratch
──────────────────────────────────────────────────────────────

TASK 1: Create main.py with FastAPI boilerplate
  Code:
    from fastapi import FastAPI
    app = FastAPI()

    MENU = [
      {"id": 1, "name": "Latte", "price": 180},
      {"id": 2, "name": "Cappuccino", "price": 160},
      {"id": 3, "name": "Espresso", "price": 90},
      {"id": 4, "name": "Croissant", "price": 120},
    ]

  Verify: File exists, no syntax errors.

TASK 2: Add GET /menu endpoint
  Code:
    @app.get("/menu")
    def get_menu():
        return MENU

  Test: uvicorn main:app --reload
        curl http://127.0.0.1:8000/menu
  Expected: JSON array with 4 items, status 200.

TASK 3: Add GET /menu/{item_id} endpoint with validation
  Code:
    from fastapi import HTTPException

    @app.get("/menu/{item_id}")
    def get_menu_item(item_id: int):
        for item in MENU:
            if item["id"] == item_id:
                return item
        raise HTTPException(404, detail="Item not found")

  Test: curl http://127.0.0.1:8000/menu/2
        curl http://127.0.0.1:8000/menu/999
        curl http://127.0.0.1:8000/menu/abc
  Expected:
    /menu/2 → 200 + Cappuccino JSON
    /menu/999 → 404 + {"detail": "Item not found"}
    /menu/abc → 422 + validation error

TASK 4: Test with requests (Python client)
  Code (separate script):
    import requests
    r = requests.get("http://127.0.0.1:8000/menu/1")
    print(r.status_code, r.json())

  Expected: 200 {'id': 1, 'name': 'Latte', 'price': 180}

TASK 5: Explore /docs
  Open browser: http://127.0.0.1:8000/docs
  Try: Click GET /menu/{item_id}, enter item_id=3, Execute
  Expected: Live response with Espresso JSON.

TASK 6: Break it (learn from errors)
  - Send /menu/zero → see 422 error body
  - Raise HTTPException(500, detail="Test") in your function → see 500
  - Stop uvicorn, try curl → "Connection refused" (server not running)

──────────────────────────────────────────────────────────────
BONUS: Add a query param filter
  @app.get("/menu")
  def get_menu(max_price: int = 1000):
      return [item for item in MENU if item["price"] <= max_price]

  Test: curl "http://127.0.0.1:8000/menu?max_price=100"
  Expected: Only Espresso (₹90) returned.`}
        />
      </Section>

      {/* 15 */}
      <Section id="interview" number="15" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is FastAPI?", "FastAPI is a modern, high-performance Python web framework for building APIs. It uses type hints for automatic validation, generates interactive docs (Swagger UI), and is built on Starlette (ASGI) + Pydantic (data validation). It's fast, async-capable, and has great developer experience."],
            ["What is uvicorn?", "uvicorn is an ASGI server (like gunicorn but for async Python). It runs your FastAPI app, listens on a port, and serves HTTP requests. You run it with: uvicorn main:app --reload. In production, use gunicorn with uvicorn workers for robustness."],
            ["What does @app.get('/menu') do?", "It's a decorator that registers the next function as a handler for GET requests to /menu. When a client sends GET /menu, FastAPI calls that function and returns its result as JSON. Other decorators: @app.post, @app.put, @app.delete, @app.patch."],
            ["How does FastAPI convert dicts to JSON?", "Automatically. If you return a dict or list, FastAPI serializes it to JSON using Pydantic's encoder (handles datetime, Decimal, UUID, etc.). It sets Content-Type: application/json. You never call json.dumps() manually."],
            ["What's the difference between path params and query params?", "Path params are in the URL path (/menu/{item_id}), required, part of resource identity. Query params are after ? (/menu?max_price=100), optional (or have defaults), used for filters/options. FastAPI infers which is which based on your route and function signature."],
            ["How does type hint validation work?", "FastAPI reads your function signature: def get_item(item_id: int). If a client sends /menu/abc (not an int), FastAPI returns 422 Unprocessable Entity BEFORE calling your function. Type hints = automatic validation + auto-docs. Always use them!"],
            ["What is HTTPException?", "An exception you raise to return an HTTP error. Example: raise HTTPException(404, detail='Not found'). FastAPI catches it, returns status 404 + JSON {\"detail\": \"Not found\"}. Use it instead of returning {\"error\": ...} with status 200 (misleading)."],
            ["What is /docs and how is it generated?", "/docs is auto-generated Swagger UI. FastAPI reads your decorators, type hints, docstrings, and generates an OpenAPI 3.0 spec. Swagger UI renders it as an interactive web page where you can test endpoints. /redoc is an alternative (ReDoc). Both are free and always up-to-date."],
            ["What does --reload do?", "--reload watches your code files and auto-restarts uvicorn when you save. Great for development (instant feedback). In production, NEVER use --reload (slow, high memory, security risk). Use plain uvicorn main:app or gunicorn."],
            ["How do you debug a FastAPI app?", "1. Look at the uvicorn terminal (print() output, tracebacks). 2. Check /docs to see if the endpoint is registered. 3. Use curl -i to see full HTTP response (headers + status). 4. Read 422 error bodies (they tell you exactly what's wrong). 5. Test with requests to isolate client vs server issues."],
          ]}
        />
      </Section>

      {/* 16 */}
      <Section id="memorize" number="16" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Install", "pip install fastapi uvicorn"],
            ["Boilerplate", "from fastapi import FastAPI; app = FastAPI()"],
            ["Run server", "uvicorn main:app --reload"],
            ["GET route", "@app.get('/menu'); def get_menu(): return MENU"],
            ["Path param", "@app.get('/menu/{item_id}'); def get_item(item_id: int): ..."],
            ["Query param", "@app.get('/menu'); def list(max_price: int = 1000): ..."],
            ["Raise error", "from fastapi import HTTPException; raise HTTPException(404, detail='Not found')"],
            ["Auto JSON", "Return dict/list → FastAPI auto-converts to JSON + sets Content-Type"],
            ["Auto docs", "http://127.0.0.1:8000/docs (Swagger UI) or /redoc (ReDoc)"],
            ["Type hints = validation", "item_id: int → /menu/abc returns 422 (auto-validated)"],
            ["Dev loop", "Edit code → save → uvicorn auto-reloads (~1s) → test"],
            ["Print debug", "print('msg') → output appears in uvicorn terminal"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
