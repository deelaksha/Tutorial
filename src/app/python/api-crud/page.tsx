"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "POST /orders — validate → store → 201",
  nodes: [
    { id: "client", icon: "🌐", label: "Client", x: 6, y: 50, color: "#22d3ee" },
    { id: "pyd", icon: "🛡️", label: "Pydantic model", sub: "OrderIn", x: 26, y: 22, color: "#a78bfa" },
    { id: "route", icon: "🧭", label: "POST /orders", x: 26, y: 78, color: "#fb923c" },
    { id: "logic", icon: "⚙️", label: "Business logic", sub: "price lookup", x: 48, y: 50, color: "#34d399" },
    { id: "store", icon: "🗃️", label: "SQLite", sub: "orders table", x: 68, y: 78, color: "#fbbf24" },
    { id: "out", icon: "📦", label: "OrderOut", sub: "201 + Location", x: 68, y: 22, color: "#60a5fa" },
    { id: "err", icon: "❌", label: "422 / 404", x: 88, y: 50, color: "#f87171" },
  ],
  edges: [
    { id: "c-pyd", from: "client", to: "pyd", color: "#a78bfa" },
    { id: "c-route", from: "client", to: "route", color: "#fb923c" },
    { id: "pyd-logic", from: "pyd", to: "logic", color: "#34d399" },
    { id: "route-logic", from: "route", to: "logic", color: "#34d399" },
    { id: "logic-store", from: "logic", to: "store", color: "#fbbf24" },
    { id: "logic-out", from: "logic", to: "out", color: "#60a5fa" },
    { id: "pyd-err", from: "pyd", to: "err", bend: 40, dashed: true, color: "#f87171" },
    { id: "logic-err", from: "logic", to: "err", bend: -20, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy-path",
      name: "🎯 Create order 2×Latte",
      command: "POST /orders {item_id: 1, qty: 2}",
      steps: [
        { node: "client", paths: ["c-pyd", "c-route"], text: "Client sends JSON: {item_id: 1, qty: 2}. FastAPI receives the request and starts processing." },
        { node: "pyd", paths: ["pyd-logic"], text: "Pydantic deserializes and validates: item_id is int ✓, qty is int ✓, qty > 0 ✓, qty ≤ 20 ✓. Validation passes." },
        { node: "route", paths: ["route-logic"], text: "POST /orders route handler receives validated OrderIn object. No manual type-checking needed — Pydantic already did it." },
        { node: "logic", paths: ["logic-store"], text: "Look up item_id=1 in menu (Latte, ₹180). Compute total: 2 × 180 = ₹360. Build order object with generated ID." },
        { node: "store", paths: [], text: "INSERT INTO orders (id, item_id, qty, status, total) VALUES (1, 1, 2, 'pending', 360). Data persisted to SQLite." },
        { node: "logic", paths: ["logic-out"], text: "Construct response: OrderOut model with id=1, total=360, status='pending'. Return 201 Created." },
        { node: "out", paths: [], text: "Response: 201 Created, Location: /orders/1, body: {\"id\": 1, \"item_id\": 1, \"qty\": 2, \"total\": 360, \"status\": \"pending\"}. Client receives confirmation. ✅" },
      ],
    },
    {
      id: "validation-fail",
      name: "⚠️ qty: -3 → 422",
      command: "POST /orders {item_id: 1, qty: -3}",
      steps: [
        { node: "client", paths: ["c-pyd"], text: "Client sends invalid JSON: {item_id: 1, qty: -3}. Mistake: negative quantity." },
        { node: "pyd", paths: ["pyd-err"], text: "Pydantic validation fails: qty=-3 violates Field(gt=0). Your business logic code NEVER runs. FastAPI auto-generates a 422 response." },
        { node: "err", paths: [], text: "422 Unprocessable Entity with detailed JSON error: {\"detail\": [{\"loc\": [\"body\", \"qty\"], \"msg\": \"Input should be greater than 0\", \"type\": \"greater_than\"}]}. Client sees exactly which field failed and why. No crash, no manual validation code. 🛑" },
      ],
    },
    {
      id: "full-lifecycle",
      name: "🔁 Full lifecycle",
      command: "POST → GET → PATCH → DELETE → GET(404)",
      steps: [
        { node: "client", paths: ["c-route"], text: "1️⃣ POST /orders {item_id: 2, qty: 1} → 201 Created with id=2 (Cappuccino, ₹160 total)." },
        { node: "route", paths: ["route-logic"], text: "2️⃣ GET /orders/2 → route queries SQLite, returns 200 OK with {\"id\": 2, \"total\": 160, \"status\": \"pending\"}." },
        { node: "logic", paths: ["logic-store"], text: "3️⃣ PATCH /orders/2 {\"status\": \"ready\"} → UPDATE orders SET status='ready' WHERE id=2. Returns 200 OK with updated object." },
        { node: "store", paths: [], text: "4️⃣ DELETE /orders/2 → DELETE FROM orders WHERE id=2. Returns 204 No Content (no body, just success status). Order gone." },
        { node: "route", paths: ["route-logic"], text: "5️⃣ GET /orders/2 again → query returns empty. Route handler raises HTTPException(status_code=404)." },
        { node: "err", paths: [], text: "404 Not Found with {\"detail\": \"Order not found\"}. The lifecycle is complete: create → read → update → delete → verify deletion. 🔄" },
      ],
    },
  ],
};

const NAV = [
  { id: "crud-intro", label: "CRUD = Create Read Update Delete" },
  { id: "http-verbs", label: "HTTP Verbs → Status Codes" },
  { id: "pydantic-validation", label: "Pydantic Validation (Input Models)" },
  { id: "response-models", label: "Response Models (Output ≠ Input)" },
  { id: "in-memory-api", label: "In-Memory API — All 5 Endpoints" },
  { id: "sqlite-upgrade", label: "SQLite — Restart Persistence" },
  { id: "sql-injection", label: "SQL Injection & Parameterization ⚠️" },
  { id: "query-params", label: "Query Params for Filtering" },
  { id: "debugging", label: "Debugging 422 / 404 / DB Errors" },
  { id: "lab", label: "Lab — Build the Full Orders API" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiCrudPage() {
  return (
    <TopicShell
      icon="🗃️"
      title="CRUD — A Real Orders API"
      gradientWord="CRUD"
      subtitle="The Brew &amp; Bean coffee shop needs an orders API. You&apos;ll build all five REST endpoints (POST, GET list, GET detail, PATCH, DELETE) from zero — first in-memory (dict + next_id), then upgraded to SQLite for persistence. You&apos;ll master Pydantic validation (how FastAPI rejects bad input BEFORE your code runs), response models (why output ≠ input), status codes (201 vs 200 vs 204 vs 404 vs 422), and SQL injection defense."
      nav={NAV}
      badges={["📋 5 REST endpoints", "🛡️ Pydantic validation", "🗄️ SQLite persistence", "⚠️ SQL injection fixed"]}
      next={{ icon: "🔐", label: "Auth & Security", href: "/python/api-auth" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="crud-intro" number="01" title="CRUD = Create Read Update Delete">
        <P>
          Every database-backed API does four things: <strong>Create</strong> records, <strong>Read</strong> them back, <strong>Update</strong> existing records, <strong>Delete</strong> records. That&apos;s CRUD.
        </P>
        <P>
          For the Brew &amp; Bean orders API, the CRUD operations map to HTTP like this:
        </P>
        <Table
          head={["Operation", "HTTP Method", "Endpoint", "What it does"]}
          rows={[
            ["Create", <IC key="1">{`POST`}</IC>, <IC key="2">{`/orders`}</IC>, "Add a new order to the system"],
            ["Read (list)", <IC key="1">{`GET`}</IC>, <IC key="2">{`/orders`}</IC>, "Get all orders"],
            ["Read (detail)", <IC key="1">{`GET`}</IC>, <IC key="2">{`/orders/{id}`}</IC>, "Get one order by ID"],
            ["Update", <IC key="1">{`PATCH`}</IC>, <IC key="2">{`/orders/{id}`}</IC>, "Change order status (pending→ready→delivered)"],
            ["Delete", <IC key="1">{`DELETE`}</IC>, <IC key="2">{`/orders/{id}`}</IC>, "Remove an order"],
          ]}
        />
        <P>
          You already know GET from the requests topic. Now you&apos;ll implement the full set as a FastAPI server.
        </P>
        <Callout type="analogy">
          Think of CRUD as the file operations on your OS: Create = touch new.txt, Read = cat file.txt, Update = echo &quot;edit&quot; &gt;&gt; file.txt, Delete = rm file.txt. Databases (and REST APIs) follow the same pattern — just over HTTP instead of file syscalls.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="http-verbs" number="02" title="HTTP Verbs → Status Codes (the Contract)">
        <P>
          HTTP verbs come with expectations. Clients (browsers, mobile apps, curl) expect specific status codes:
        </P>
        <Table
          head={["Method", "Success status", "When to use it", "Has request body?", "Has response body?"]}
          rows={[
            [<IC key="1">{`POST`}</IC>, "201 Created", "Creating a new resource", "Yes (the data)", "Usually (the created object)"],
            [<IC key="1">{`GET`}</IC>, "200 OK", "Reading data (list or detail)", "No", "Yes (the data)"],
            [<IC key="1">{`PATCH`}</IC>, "200 OK", "Partial update (e.g. status field only)", "Yes (fields to update)", "Usually (updated object)"],
            [<IC key="1">{`PUT`}</IC>, "200 OK", "Full replacement (we won&apos;t use this)", "Yes (entire object)", "Yes"],
            [<IC key="1">{`DELETE`}</IC>, "204 No Content", "Deleting a resource", "No", "No (just 204 status)"],
          ]}
        />
        <P>
          FastAPI defaults to 200 for all routes. For POST (create), you&apos;ll manually set <IC>{`status_code=201`}</IC>. For DELETE, you&apos;ll return <IC>{`status_code=204`}</IC> with no body.
        </P>
        <Callout type="behind">
          Why 201 instead of 200 for POST? Because 201 tells the client &quot;a new resource was created&quot; and typically includes a <IC>Location</IC> header with the new resource&apos;s URL (e.g., <IC>Location: /orders/42</IC>). It&apos;s the polite HTTP way of saying &quot;I made the thing you asked for — here&apos;s where to find it.&quot; Most APIs skip the Location header and just return the object in the body, but 201 is still the correct status.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="pydantic-validation" number="03" title="Pydantic Validation — The Bouncer at the Door">
        <P>
          FastAPI uses <strong>Pydantic</strong> models to auto-validate incoming JSON. If the client sends garbage, Pydantic rejects it with a 422 response <em>before</em> your route handler runs. You never write <IC>{`if not isinstance(qty, int):`}</IC> — Pydantic does it.
        </P>
        <CodeBlock
          title="models.py"
          code={`from pydantic import BaseModel, Field

class OrderIn(BaseModel):
    item_id: int
    qty: int = Field(gt=0, le=20)  # greater than 0, less than or equal 20

# Usage in route:
@app.post("/orders")
def create_order(order: OrderIn):
    # If you reach this line, order.item_id is an int and order.qty is 1..20
    # Pydantic already validated. You can trust the data.
    return {"id": 1, "item_id": order.item_id, "qty": order.qty}`}
        />
        <P>
          Send valid JSON <IC>{`{"item_id": 1, "qty": 2}`}</IC> → Pydantic validates, route runs, 200 OK.
          Send invalid JSON <IC>{`{"item_id": 1, "qty": -3}`}</IC> → Pydantic rejects, route <em>never runs</em>, 422 Unprocessable Entity with detailed error.
        </P>
        <CodeBlock
          title="test_validation.sh"
          runnable={false}
          code={`# Valid request
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 1, "qty": 2}'

# Response: 200 OK (or 201 if you set status_code=201)
# {"id": 1, "item_id": 1, "qty": 2}


# Invalid: qty is negative
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 1, "qty": -3}'

# Response: 422 Unprocessable Entity
# {
#   "detail": [
#     {
#       "type": "greater_than",
#       "loc": ["body", "qty"],
#       "msg": "Input should be greater than 0",
#       "input": -3,
#       "ctx": {"gt": 0}
#     }
#   ]
# }


# Invalid: missing field
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"qty": 2}'

# Response: 422
# {
#   "detail": [
#     {
#       "type": "missing",
#       "loc": ["body", "item_id"],
#       "msg": "Field required",
#       "input": {"qty": 2}
#     }
#   ]
# }`}
        />
        <P>
          Notice how the 422 response tells you exactly what went wrong: which field (<IC>loc: [&quot;body&quot;, &quot;qty&quot;]</IC>), what rule was violated (<IC>greater_than</IC>), the expected constraint (<IC>ctx: {`{`}&quot;gt&quot;: 0{`}`}</IC>). Your frontend can parse this and show field-level error messages.
        </P>
        <Callout type="tip">
          In an interview, when asked &quot;How do you validate API inputs?&quot;, say: <strong>&quot;I use Pydantic models in FastAPI. Pydantic auto-validates types, ranges, required fields, and returns 422 with field-level errors before my route handler runs. I never write manual type checks.&quot;</strong>
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="response-models" number="04" title="Response Models — Why Output ≠ Input">
        <P>
          Input models (what the client sends) often differ from output models (what you return):
        </P>
        <CodeBlock
          title="models.py"
          code={`from pydantic import BaseModel, Field

# INPUT: client sends item_id + qty
class OrderIn(BaseModel):
    item_id: int
    qty: int = Field(gt=0, le=20)

# OUTPUT: we return id, total, status (computed/generated fields)
class OrderOut(BaseModel):
    id: int
    item_id: int
    qty: int
    total: int       # computed: menu_price * qty
    status: str      # default: "pending"

# The client sends OrderIn, we return OrderOut.`}
        />
        <P>
          Why separate models? Because:
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>The client doesn&apos;t send <IC>id</IC> (server generates it)</li>
          <li>The client doesn&apos;t send <IC>total</IC> (server computes it from menu prices)</li>
          <li>The client doesn&apos;t send <IC>status</IC> (server defaults to &quot;pending&quot;)</li>
          <li>You <em>never</em> echo internal fields like <IC>hashed_password</IC> or <IC>created_at</IC> back to the client unless explicitly needed</li>
        </ul>
        <P>
          In FastAPI, declare the response model on the decorator:
        </P>
        <CodeBlock
          title="main.py"
          code={`from fastapi import FastAPI
from models import OrderIn, OrderOut

app = FastAPI()

@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(order: OrderIn) -> OrderOut:
    # compute total, generate id, set status
    new_order = OrderOut(
        id=1,
        item_id=order.item_id,
        qty=order.qty,
        total=order.qty * 180,  # hardcoded price for now
        status="pending"
    )
    return new_order

# FastAPI will:
# 1. Accept OrderIn JSON (validate with Pydantic)
# 2. Run your function
# 3. Serialize the OrderOut object to JSON
# 4. Return 201 with the OrderOut JSON`}
        />
        <Callout type="mistake">
          <strong>Common mistake:</strong> Echoing the input back as-is. Don&apos;t do <IC>{`return order`}</IC> (that&apos;s the OrderIn, missing id/total/status). Always return the <em>output</em> model with all computed fields.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="in-memory-api" number="05" title="In-Memory API — All 5 Endpoints">
        <P>
          Let&apos;s build the complete CRUD API in memory (using a dict) before adding SQLite. The menu is fixed:
        </P>
        <CodeBlock
          title="main.py (full in-memory version)"
          code={`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

# Fixed menu
MENU = {
    1: {"name": "Latte", "price": 180},
    2: {"name": "Cappuccino", "price": 160},
    3: {"name": "Espresso", "price": 90},
    4: {"name": "Croissant", "price": 120},
}

# In-memory storage
orders_db = {}
next_id = 1

# --- Models ---
class OrderIn(BaseModel):
    item_id: int
    qty: int = Field(gt=0, le=20)

class OrderOut(BaseModel):
    id: int
    item_id: int
    qty: int
    total: int
    status: str

class StatusUpdate(BaseModel):
    status: str  # "pending" | "ready" | "delivered"


# --- Endpoints ---

@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(order: OrderIn):
    global next_id
    if order.item_id not in MENU:
        raise HTTPException(status_code=404, detail=f"Menu item {order.item_id} not found")

    price = MENU[order.item_id]["price"]
    total = order.qty * price

    new_order = {
        "id": next_id,
        "item_id": order.item_id,
        "qty": order.qty,
        "total": total,
        "status": "pending",
    }
    orders_db[next_id] = new_order
    next_id += 1
    return new_order


@app.get("/orders")
def list_orders():
    # Return all orders as a list
    return {"orders": list(orders_db.values())}


@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]


@app.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(order_id: int, update: StatusUpdate):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    orders_db[order_id]["status"] = update.status
    return orders_db[order_id]


@app.delete("/orders/{order_id}", status_code=204)
def delete_order(order_id: int):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    del orders_db[order_id]
    # 204 means "success, no body" — don't return anything`}
        />
        <P>
          Run the server: <IC>uvicorn main:app --reload</IC>. Now test the full CRUD cycle with curl:
        </P>
        <CodeBlock
          title="crud_test.sh (complete session)"
          runnable={false}
          code={`# 1. Create order: 2×Latte (item_id=1, price=180 → total=360)
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 1, "qty": 2}'

# Response: 201 Created
# {"id": 1, "item_id": 1, "qty": 2, "total": 360, "status": "pending"}


# 2. Create order: 1×Croissant (item_id=4, price=120 → total=120)
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 4, "qty": 1}'

# Response: 201
# {"id": 2, "item_id": 4, "qty": 1, "total": 120, "status": "pending"}


# 3. Create order: 3×Espresso (item_id=3, price=90 → total=270)
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 3, "qty": 3}'

# Response: 201
# {"id": 3, "item_id": 3, "qty": 3, "total": 270, "status": "pending"}


# 4. List all orders
curl http://127.0.0.1:8000/orders

# Response: 200 OK
# {
#   "orders": [
#     {"id": 1, "item_id": 1, "qty": 2, "total": 360, "status": "pending"},
#     {"id": 2, "item_id": 4, "qty": 1, "total": 120, "status": "pending"},
#     {"id": 3, "item_id": 3, "qty": 3, "total": 270, "status": "pending"}
#   ]
# }


# 5. Get order detail
curl http://127.0.0.1:8000/orders/2

# Response: 200
# {"id": 2, "item_id": 4, "qty": 1, "total": 120, "status": "pending"}


# 6. Update order status (PATCH)
curl -X PATCH http://127.0.0.1:8000/orders/2 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "ready"}'

# Response: 200
# {"id": 2, "item_id": 4, "qty": 1, "total": 120, "status": "ready"}


# 7. Update again: ready → delivered
curl -X PATCH http://127.0.0.1:8000/orders/2 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "delivered"}'

# Response: 200
# {"id": 2, "item_id": 4, "qty": 1, "total": 120, "status": "delivered"}


# 8. Delete order
curl -X DELETE http://127.0.0.1:8000/orders/2

# Response: 204 No Content (empty body, just HTTP status)


# 9. Try to get the deleted order
curl http://127.0.0.1:8000/orders/2

# Response: 404 Not Found
# {"detail": "Order not found"}


# 10. List orders again (order 2 is gone)
curl http://127.0.0.1:8000/orders

# Response: 200
# {
#   "orders": [
#     {"id": 1, "item_id": 1, "qty": 2, "total": 360, "status": "pending"},
#     {"id": 3, "item_id": 3, "qty": 3, "total": 270, "status": "pending"}
#   ]
# }

# ✅ CRUD lifecycle complete: create 3 → list → get detail → update status → delete → verify 404`}
        />
        <P>
          Perfect. But there&apos;s one problem: restart the server, run <IC>GET /orders</IC> again → empty. The dict resets. Time to add persistence.
        </P>
      </Section>

      {/* 06 */}
      <Section id="sqlite-upgrade" number="06" title="SQLite — Restart Persistence">
        <P>
          Replace the dict with SQLite (Python stdlib, no install needed). The API interface stays identical — only the storage backend changes.
        </P>
        <CodeBlock
          title="db.py (database layer)"
          code={`import sqlite3

DB_FILE = "orders.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            total INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
        )
    """)
    conn.commit()
    conn.close()

def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # dict-like row access
    return conn`}
        />
        <CodeBlock
          title="main.py (with SQLite)"
          code={`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from db import init_db, get_conn

app = FastAPI()

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

MENU = {
    1: {"name": "Latte", "price": 180},
    2: {"name": "Cappuccino", "price": 160},
    3: {"name": "Espresso", "price": 90},
    4: {"name": "Croissant", "price": 120},
}

class OrderIn(BaseModel):
    item_id: int
    qty: int = Field(gt=0, le=20)

class OrderOut(BaseModel):
    id: int
    item_id: int
    qty: int
    total: int
    status: str

class StatusUpdate(BaseModel):
    status: str


@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(order: OrderIn):
    if order.item_id not in MENU:
        raise HTTPException(status_code=404, detail=f"Menu item {order.item_id} not found")

    price = MENU[order.item_id]["price"]
    total = order.qty * price

    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO orders (item_id, qty, total, status) VALUES (?, ?, ?, ?)",
        (order.item_id, order.qty, total, "pending")
    )
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()

    return OrderOut(id=order_id, item_id=order.item_id, qty=order.qty, total=total, status="pending")


@app.get("/orders")
def list_orders():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM orders").fetchall()
    conn.close()
    return {"orders": [dict(r) for r in rows]}


@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(row)


@app.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(order_id: int, update: StatusUpdate):
    conn = get_conn()
    conn.execute("UPDATE orders SET status = ? WHERE id = ?", (update.status, order_id))
    conn.commit()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(row)


@app.delete("/orders/{order_id}", status_code=204)
def delete_order(order_id: int):
    conn = get_conn()
    cursor = conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Order not found")`}
        />
        <P>
          Now test restart persistence:
        </P>
        <CodeBlock
          title="persistence_test.sh"
          runnable={false}
          code={`# 1. Create an order
curl -X POST http://127.0.0.1:8000/orders -H "Content-Type: application/json" -d '{"item_id": 1, "qty": 2}'
# Response: {"id": 1, "item_id": 1, "qty": 2, "total": 360, "status": "pending"}

# 2. Kill the server (Ctrl+C)

# 3. Restart: uvicorn main:app --reload

# 4. List orders (data is still there!)
curl http://127.0.0.1:8000/orders
# Response: {"orders": [{"id": 1, "item_id": 1, "qty": 2, "total": 360, "status": "pending"}]}

# ✅ Persistence works. The orders.db file survives restarts.`}
        />
        <Callout type="note">
          SQLite is a single-file database (orders.db). It&apos;s perfect for prototypes, local dev, and low-traffic apps. For production at scale, you&apos;d use PostgreSQL/MySQL with an ORM like SQLAlchemy — but the pattern (parameterized queries, connection management) is the same.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="sql-injection" number="07" title="SQL Injection & Parameterization ⚠️">
        <P>
          <strong>SQL injection</strong> is when an attacker crafts malicious input that becomes part of your SQL query, breaking out of the intended logic and running arbitrary SQL.
        </P>
        <Callout type="mistake">
          <strong>NEVER build SQL with f-strings or string concatenation:</strong>
        </Callout>
        <CodeBlock
          title="DANGEROUS (DO NOT DO THIS)"
          code={`# ❌ BROKEN CODE (vulnerable to SQL injection)
def get_order_UNSAFE(order_id: int):
    conn = get_conn()
    query = f"SELECT * FROM orders WHERE id = {order_id}"  # DANGER
    row = conn.execute(query).fetchone()
    conn.close()
    return dict(row) if row else None

# Attacker sends: order_id = "1 OR 1=1"
# Query becomes: SELECT * FROM orders WHERE id = 1 OR 1=1
# Returns ALL orders instead of just order 1.

# Worse: order_id = "1; DROP TABLE orders; --"
# Query becomes: SELECT * FROM orders WHERE id = 1; DROP TABLE orders; --
# Your orders table is DELETED. 💀`}
        />
        <P>
          The fix: <strong>parameterized queries</strong> with <IC>?</IC> placeholders. SQLite treats the params as <em>data</em>, not SQL code:
        </P>
        <CodeBlock
          title="SAFE (parameterized)"
          code={`# ✅ SAFE (parameterized query)
def get_order_SAFE(order_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

# Even if order_id = "1 OR 1=1", SQLite treats it as the literal string "1 OR 1=1",
# which doesn't match any integer ID. No injection possible.`}
        />
        <P>
          Our SQLite code already uses <IC>?</IC> placeholders everywhere (<IC>{`(order.item_id, order.qty, total, "pending")`}</IC>). That&apos;s the defense. Always use them.
        </P>
        <Callout type="tip">
          In an interview, if asked about security: <strong>&quot;I always use parameterized queries (? placeholders in SQLite, %s in psycopg2) to prevent SQL injection. I never interpolate user input into SQL strings with f-strings or concatenation.&quot;</strong>
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="query-params" number="08" title="Query Params for Filtering">
        <P>
          Users want to filter: <IC>GET /orders?status=pending</IC>. Query params are the <IC>?key=value</IC> part after the path.
        </P>
        <CodeBlock
          title="query_params.py"
          code={`from typing import Optional

@app.get("/orders")
def list_orders(status: Optional[str] = None):
    conn = get_conn()
    if status:
        # Filter by status
        rows = conn.execute("SELECT * FROM orders WHERE status = ?", (status,)).fetchall()
    else:
        # No filter, return all
        rows = conn.execute("SELECT * FROM orders").fetchall()
    conn.close()
    return {"orders": [dict(r) for r in rows]}

# Usage:
# GET /orders → all orders
# GET /orders?status=pending → only pending orders
# GET /orders?status=ready → only ready orders`}
        />
        <P>
          FastAPI auto-parses query params. The <IC>status: Optional[str] = None</IC> param means &quot;if <IC>?status=...</IC> is present, bind it; otherwise <IC>status</IC> is None.&quot;
        </P>
        <CodeBlock
          title="test_filter.sh"
          runnable={false}
          code={`# Create 3 orders
curl -X POST http://127.0.0.1:8000/orders -H "Content-Type: application/json" -d '{"item_id": 1, "qty": 2}'
curl -X POST http://127.0.0.1:8000/orders -H "Content-Type: application/json" -d '{"item_id": 2, "qty": 1}'
curl -X POST http://127.0.0.1:8000/orders -H "Content-Type: application/json" -d '{"item_id": 3, "qty": 3}'

# Update order 2 to "ready"
curl -X PATCH http://127.0.0.1:8000/orders/2 -H "Content-Type: application/json" -d '{"status": "ready"}'

# Filter by status=pending (should return orders 1 and 3)
curl "http://127.0.0.1:8000/orders?status=pending"

# Response: {"orders": [{"id": 1, ...}, {"id": 3, ...}]}

# Filter by status=ready (should return order 2)
curl "http://127.0.0.1:8000/orders?status=ready"

# Response: {"orders": [{"id": 2, "status": "ready", ...}]}`}
        />
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging 422 / 404 / Database Errors">
        <P>
          <strong>1. 422 Unprocessable Entity</strong> → Pydantic validation failed. Read the <IC>detail</IC> array:
        </P>
        <CodeBlock
          title="422_example.json"
          runnable={false}
          code={`{
  "detail": [
    {
      "type": "greater_than",
      "loc": ["body", "qty"],
      "msg": "Input should be greater than 0",
      "input": -3,
      "ctx": {"gt": 0}
    }
  ]
}

# Meaning: field "qty" (in request body) failed "greater_than 0" rule. Fix: send qty > 0.`}
        />
        <P>
          <strong>2. 404 Not Found</strong> → Resource doesn&apos;t exist. Check the ID. For GET/PATCH/DELETE, the ID must exist in the DB.
        </P>
        <P>
          <strong>3. Database errors:</strong>
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li><IC>sqlite3.OperationalError: no such table: orders</IC> → You forgot to call <IC>init_db()</IC> on startup. Add the <IC>@app.on_event(&quot;startup&quot;)</IC> handler.</li>
          <li><IC>sqlite3.OperationalError: database is locked</IC> → Another process (or the sqlite3 CLI) has the DB open for writing. Close it.</li>
          <li><IC>TypeError: &apos;Row&apos; object is not subscriptable</IC> → You forgot <IC>conn.row_factory = sqlite3.Row</IC>, or you&apos;re not calling <IC>dict(row)</IC>. Fix: <IC>return dict(row)</IC>.</li>
        </ul>
        <P>
          <strong>Debugging trick:</strong> Use the sqlite3 CLI to inspect the DB directly:
        </P>
        <CodeBlock
          title="sqlite_cli.sh"
          runnable={false}
          code={`sqlite3 orders.db

# Inside the CLI:
.tables                     # list tables → should show "orders"
.schema orders              # show CREATE TABLE statement
SELECT * FROM orders;       # view all rows
SELECT * FROM orders WHERE status = 'pending';  # filter
.exit`}
        />
        <Callout type="note">
          The sqlite3 CLI is installed with Python. Run <IC>sqlite3 orders.db</IC> in the same directory as your main.py. It&apos;s invaluable for verifying what&apos;s actually in the database vs. what your API is returning.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab — Build the Full Orders API">
        <P>
          <strong>Goal:</strong> Build the complete Brew &amp; Bean orders API with SQLite persistence, then run a 10-step curl session to verify all CRUD operations.
        </P>
        <P>
          <strong>Steps:</strong>
        </P>
        <ol className="ml-6 list-decimal space-y-2 text-sm text-slate-300">
          <li>Create <IC>db.py</IC> with <IC>init_db()</IC> and <IC>get_conn()</IC> as shown in §06.</li>
          <li>Create <IC>main.py</IC> with the five endpoints: POST, GET list, GET detail, PATCH, DELETE.</li>
          <li>Add the <IC>@app.on_event(&quot;startup&quot;)</IC> handler to call <IC>init_db()</IC>.</li>
          <li>Run <IC>uvicorn main:app --reload</IC>. Verify the server starts without errors.</li>
          <li>
            Run this curl script (copy it to <IC>test.sh</IC>, <IC>chmod +x test.sh</IC>, <IC>./test.sh</IC>):
          </li>
        </ol>
        <CodeBlock
          title="test.sh (10-step session)"
          runnable={false}
          code={`#!/bin/bash
BASE=http://127.0.0.1:8000

echo "1. Create order: 2×Latte (₹360)"
curl -X POST $BASE/orders -H "Content-Type: application/json" -d '{"item_id": 1, "qty": 2}'
echo -e "\\n"

echo "2. Create order: 1×Croissant (₹120)"
curl -X POST $BASE/orders -H "Content-Type: application/json" -d '{"item_id": 4, "qty": 1}'
echo -e "\\n"

echo "3. Create order: 3×Espresso (₹270)"
curl -X POST $BASE/orders -H "Content-Type: application/json" -d '{"item_id": 3, "qty": 3}'
echo -e "\\n"

echo "4. List all orders (should have 3)"
curl $BASE/orders
echo -e "\\n"

echo "5. Get order 2 detail (Croissant, ₹120)"
curl $BASE/orders/2
echo -e "\\n"

echo "6. Update order 2 status to 'ready'"
curl -X PATCH $BASE/orders/2 -H "Content-Type: application/json" -d '{"status": "ready"}'
echo -e "\\n"

echo "7. Update order 2 status to 'delivered'"
curl -X PATCH $BASE/orders/2 -H "Content-Type: application/json" -d '{"status": "delivered"}'
echo -e "\\n"

echo "8. Delete order 2 (should return 204 No Content)"
curl -X DELETE $BASE/orders/2 -w "\\nHTTP status: %{http_code}\\n"
echo -e "\\n"

echo "9. Try to get order 2 (should 404)"
curl $BASE/orders/2
echo -e "\\n"

echo "10. List orders (should have 2 left: 1 and 3)"
curl $BASE/orders
echo -e "\\n"

echo "✅ Lab complete. Verify:"
echo "   - Step 1-3: each returns 201 with correct total (360, 120, 270)"
echo "   - Step 4: 3 orders"
echo "   - Step 5: order 2 with total=120"
echo "   - Step 6-7: status updates reflected"
echo "   - Step 8: 204 No Content"
echo "   - Step 9: 404 Not Found"
echo "   - Step 10: 2 orders (1 and 3), order 2 gone"`}
        />
        <ol start={6} className="ml-6 list-decimal space-y-2 text-sm text-slate-300">
          <li>Verify each response matches the expected output (totals: 360, 120, 270).</li>
          <li>Kill the server (Ctrl+C), restart it, and run <IC>curl http://127.0.0.1:8000/orders</IC> — the data should still be there (persistence test).</li>
          <li>Open the sqlite3 CLI (<IC>sqlite3 orders.db</IC>) and run <IC>SELECT * FROM orders;</IC> — verify the data matches the API responses.</li>
        </ol>
        <P>
          <strong>Expected totals (arithmetic check):</strong>
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>Order 1: item_id=1 (Latte, ₹180), qty=2 → total = 2 × 180 = <strong>₹360</strong></li>
          <li>Order 2: item_id=4 (Croissant, ₹120), qty=1 → total = 1 × 120 = <strong>₹120</strong></li>
          <li>Order 3: item_id=3 (Espresso, ₹90), qty=3 → total = 3 × 90 = <strong>₹270</strong></li>
        </ul>
        <P>
          If you see those totals in the responses, you&apos;ve built a production-ready CRUD API. 🚀
        </P>
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["CRUD verbs", "POST (create, 201), GET (read, 200), PATCH (update, 200), DELETE (204 no body)"],
            ["Pydantic input", "class OrderIn(BaseModel): item_id: int; qty: int = Field(gt=0)"],
            ["Pydantic auto-validates", "422 before route runs if validation fails; no manual type checks needed"],
            ["Response model", "@app.post(..., response_model=OrderOut, status_code=201) — output ≠ input"],
            ["HTTPException for 404", "raise HTTPException(status_code=404, detail=\"Order not found\")"],
            ["SQLite parameterized", 'conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,))'],
            ["SQL injection defense", "NEVER f-string SQL. Always use ? placeholders (params tuple)."],
            ["Query params", "def list_orders(status: Optional[str] = None) → GET /orders?status=pending"],
            ["DB init on startup", "@app.on_event(\"startup\"): init_db() — creates table if not exists"],
            ["Restart persistence", "SQLite persists to orders.db file; survives server restarts"],
            ["Debugging 422", "Read detail array: loc=[\"body\", field], msg=reason, input=what_you_sent"],
            ["SQLite CLI inspect", "sqlite3 orders.db → .tables, SELECT * FROM orders; — verify real data"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
