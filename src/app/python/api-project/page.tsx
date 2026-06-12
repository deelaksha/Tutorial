"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The Finished System — Brew & Bean API",
  nodes: [
    { id: "client", icon: "🌐", label: "Any client", sub: "curl/React/mobile", x: 6, y: 50, color: "#22d3ee" },
    { id: "mw", icon: "🧱", label: "CORS + logging", sub: "middleware", x: 24, y: 50, color: "#fb923c" },
    { id: "authn", icon: "🔐", label: "JWT guard", sub: "Depends(get_current_user)", x: 42, y: 22, color: "#a78bfa" },
    { id: "routes", icon: "🧭", label: "Routers", sub: "/menu /orders /stats", x: 42, y: 78, color: "#34d399" },
    { id: "models", icon: "🛡️", label: "Pydantic", sub: "validation + serialization", x: 62, y: 22, color: "#60a5fa" },
    { id: "db", icon: "🗃️", label: "SQLite", sub: "orders.db", x: 62, y: 78, color: "#fbbf24" },
    { id: "tests", icon: "🧪", label: "pytest + TestClient", sub: "12 tests", x: 82, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "c-mw", from: "client", to: "mw", color: "#fb923c" },
    { id: "mw-authn", from: "mw", to: "authn", color: "#a78bfa" },
    { id: "mw-routes", from: "mw", to: "routes", color: "#34d399" },
    { id: "authn-routes", from: "authn", to: "routes", bend: -20, dashed: true, color: "#34d399" },
    { id: "routes-models", from: "routes", to: "models", color: "#60a5fa" },
    { id: "routes-db", from: "routes", to: "db", color: "#fbbf24" },
    { id: "tests-routes", from: "tests", to: "routes", bend: 30, color: "#f472b6" },
    { id: "tests-db", from: "tests", to: "db", bend: -30, dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "customer-journey",
      name: "🎯 Customer journey",
      command: "Login → browse menu → order 2×Latte → check status → all 200s",
      steps: [
        { node: "client", paths: ["c-mw"], text: "Customer opens the app. Step 1: POST /login with username='alice', password='secret123'. No auth needed for login endpoint itself." },
        { node: "mw", paths: ["mw-routes"], text: "CORS middleware allows the browser origin. Request passes through. /login is public (no JWT guard)." },
        { node: "routes", paths: ["routes-db"], text: "POST /login route: look up alice in users table, bcrypt.checkpw verifies password, generate JWT with exp=1h, return {access_token: ...}." },
        { node: "db", paths: [], text: "SELECT * FROM users WHERE username='alice' → found. Hash matches. Client stores token in memory/localStorage." },
        { node: "client", paths: ["c-mw"], text: "Step 2: GET /menu (public, no auth). Client wants to see the coffee menu before ordering." },
        { node: "routes", paths: [], text: "GET /menu returns fixed list: Latte ₹180, Cappuccino ₹160, Espresso ₹90, Croissant ₹120. 200 OK. Client displays menu." },
        { node: "client", paths: ["c-mw"], text: "Step 3: POST /orders {item_id: 1, qty: 2} with Authorization: Bearer <token>. Customer orders 2×Latte." },
        { node: "mw", paths: ["mw-authn"], text: "CORS allows origin. Request has Authorization header → routed to protected endpoint." },
        { node: "authn", paths: ["authn-routes"], text: "Depends(get_current_user): extract token, jwt.decode() verifies signature + expiry, returns username='alice'. ✅ Auth passed." },
        { node: "routes", paths: ["routes-models", "routes-db"], text: "POST /orders: Pydantic validates {item_id: 1, qty: 2} ✓. Business logic: price=180, total=2×180=360. INSERT order with username='alice'." },
        { node: "db", paths: [], text: "INSERT INTO orders (username, item_id, qty, total, status) VALUES ('alice', 1, 2, 360, 'pending'). Returns id=1. Response: 201 Created with OrderOut model." },
        { node: "client", paths: ["c-mw"], text: "Step 4: GET /orders with token. Customer checks order status." },
        { node: "authn", paths: ["authn-routes"], text: "JWT verified again (stateless — server checks signature every request, no session DB lookup)." },
        { node: "routes", paths: ["routes-db"], text: "GET /orders: SELECT * FROM orders WHERE username='alice' → returns alice's orders only (per-user filtering). 200 OK." },
        { node: "db", paths: [], text: "Returns [{id: 1, item_id: 1, qty: 2, total: 360, status: 'pending'}]. Customer sees their order. Journey complete! ☕✨" },
      ],
    },
    {
      id: "bad-actor",
      name: "⚠️ Bad actor blocked",
      command: "No token → 403; SQL injection attempt → safe",
      steps: [
        { node: "client", paths: ["c-mw"], text: "Attacker tries: POST /orders without Authorization header. Malicious intent: create fake orders." },
        { node: "mw", paths: ["mw-authn"], text: "Request reaches protected route. Depends(HTTPBearer) requires Authorization header." },
        { node: "authn", paths: [], text: "HTTPBearer dependency raises 403 Forbidden: {\"detail\": \"Not authenticated\"}. Route handler never runs. Attack blocked at auth layer. 🛑" },
        { node: "client", paths: ["c-mw"], text: "Attacker tries SQL injection: GET /orders?status=pending' OR '1'='1 (trying to break WHERE clause)." },
        { node: "routes", paths: ["routes-db"], text: "Query param status='pending\\' OR \\'1\\'=\\'1' is passed to parameterized query." },
        { node: "db", paths: [], text: "SELECT * FROM orders WHERE status = ? with param ('pending\\' OR \\'1\\'=\\'1',). SQLite treats entire string as literal value, no OR logic executed. Returns 0 rows (no order has that exact status string). Injection fails. ✅" },
      ],
    },
    {
      id: "ci-tests",
      name: "🧪 CI tests pass",
      command: "pytest runs TestClient, 12 tests, deploy-ready",
      steps: [
        { node: "tests", paths: ["tests-routes"], text: "CI runner (GitHub Actions) runs: pytest tests/ -v. TestClient spins up a test instance of the FastAPI app (no network, in-memory)." },
        { node: "routes", paths: ["routes-db"], text: "Test 1: test_create_order_computes_total. POST /orders {item_id: 1, qty: 2}, assert response.json()['total'] == 360. ✅ Pass." },
        { node: "db", paths: [], text: "Test uses a temp SQLite DB (pytest fixture: @pytest.fixture def db() → create tables, yield, drop). Isolated from prod DB." },
        { node: "tests", paths: ["tests-routes"], text: "Test 2: test_requires_auth. POST /orders without token → assert response.status_code == 403. ✅ Pass." },
        { node: "tests", paths: ["tests-routes"], text: "Test 3: test_get_order_404. GET /orders/999 (doesn't exist) → assert 404. ✅ Pass." },
        { node: "tests", paths: ["tests-routes"], text: "Test 4-12: login success/fail, per-user filtering, delete then 404, PATCH status, etc. All ✅ Pass." },
        { node: "tests", paths: [], text: "pytest output: 12 passed in 1.2s. CI goes green 🟢. Ready to deploy to Render/Railway/Docker. Ship it! 🚀" },
      ],
    },
  ],
};

const NAV = [
  { id: "the-spec", label: "The Spec — What We're Building" },
  { id: "project-structure", label: "Project Structure (Files & Why)" },
  { id: "db-layer", label: "db.py — Database Initialization" },
  { id: "models-layer", label: "models.py — Pydantic Models" },
  { id: "auth-layer", label: "auth.py — Hashing + JWT + Dependency" },
  { id: "menu-router", label: "routers/menu.py — Public Endpoint" },
  { id: "orders-router", label: "routers/orders.py — Protected CRUD" },
  { id: "stats-router", label: "routers/stats.py — Aggregations" },
  { id: "main-app", label: "main.py — Wire Everything Together" },
  { id: "testing", label: "Testing with pytest + TestClient ⭐" },
  { id: "manual-smoke-test", label: "Manual Smoke Test (requests script)" },
  { id: "deploy-prep", label: "Preparing to Ship — requirements.txt, env vars" },
  { id: "customer-journey", label: "The Customer Journey (curl demo)" },
  { id: "debugging", label: "Debugging pytest, TestClient, DB isolation" },
  { id: "lab", label: "Lab — Extend the API Yourself" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiProjectPage() {
  return (
    <TopicShell
      icon="🚀"
      title="Capstone — Build & Ship the Brew & Bean API"
      gradientWord="Capstone"
      subtitle="You&apos;ve learned CRUD, auth, and security. Now build the complete production-ready API from scratch: proper project structure (routers, models, db layer), all endpoints (menu, orders, stats), JWT authentication, per-user data, parameterized SQL, pytest test suite with TestClient (12 tests covering auth, CRUD, edge cases), and deployment prep (requirements.txt, env vars). This is the real thing — what you&apos;d ship to customers."
      nav={NAV}
      badges={["📁 Real project structure", "🧪 pytest + TestClient", "📊 Aggregation endpoint", "🚢 Deploy-ready", "☕ Brew & Bean complete"]}
      next={{ icon: "🐳", label: "Deploy it with Docker", href: "/docker" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="the-spec" number="01" title="The Spec — What We're Building">
        <P>
          You&apos;re the backend engineer for <strong>Brew &amp; Bean</strong>, a coffee shop chain. The frontend team needs an API. Here&apos;s the ticket:
        </P>
        <Table
          head={["Endpoint", "Method", "Auth?", "What it does"]}
          rows={[
            [<IC key="1">{`POST /register`}</IC>, "POST", "No", "Register new user (username, password → bcrypt hash)"],
            [<IC key="1">{`POST /login`}</IC>, "POST", "No", "Login (username, password → JWT)"],
            [<IC key="1">{`GET /menu`}</IC>, "GET", "No", "List menu items (id, name, price)"],
            [<IC key="1">{`POST /orders`}</IC>, "POST", "Yes", "Create order (item_id, qty → compute total, store with username)"],
            [<IC key="1">{`GET /orders`}</IC>, "GET", "Yes", "List user's orders (filtered by current_user)"],
            [<IC key="1">{`GET /orders/{id}`}</IC>, "GET", "Yes", "Get order detail (404 if not found or not user's order)"],
            [<IC key="1">{`PATCH /orders/{id}`}</IC>, "PATCH", "Yes", "Update order status (pending → ready → delivered)"],
            [<IC key="1">{`DELETE /orders/{id}`}</IC>, "DELETE", "Yes", "Delete order (only owner can delete)"],
            [<IC key="1">{`GET /stats`}</IC>, "GET", "Yes", "Aggregate stats: total revenue, top item, order count"],
          ]}
        />
        <P>
          <strong>Data models:</strong>
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li><IC>User</IC>: username (PK), hashed_password</li>
          <li><IC>Order</IC>: id (PK), username (FK), item_id, qty, total, status, created_at</li>
          <li><IC>Menu</IC> (hardcoded, no table): id=1 Latte ₹180, id=2 Cappuccino ₹160, id=3 Espresso ₹90, id=4 Croissant ₹120</li>
        </ul>
        <P>
          <strong>Status codes:</strong> 200 OK, 201 Created, 204 No Content, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity.
        </P>
      </Section>

      {/* 02 */}
      <Section id="project-structure" number="02" title="Project Structure — Files & Why">
        <P>
          Real APIs don&apos;t live in a single 500-line <IC>main.py</IC>. Split into modules:
        </P>
        <CodeBlock
          title="project_tree.txt"
          runnable={false}
          code={`brew-bean-api/
├── main.py             # FastAPI app, middleware, startup, include routers
├── db.py               # Database init, connection factory
├── models.py           # Pydantic models (all input/output schemas)
├── auth.py             # Password hashing, JWT encode/decode, get_current_user dependency
├── routers/
│   ├── __init__.py
│   ├── menu.py         # GET /menu (public)
│   ├── orders.py       # POST/GET/PATCH/DELETE /orders (protected)
│   └── stats.py        # GET /stats (protected)
├── tests/
│   ├── __init__.py
│   ├── conftest.py     # pytest fixtures (test DB, test client)
│   └── test_api.py     # All tests (12 tests covering auth, CRUD, edge cases)
├── requirements.txt    # Dependencies (fastapi, uvicorn, pyjwt, bcrypt, pytest)
├── .env.example        # Template for environment variables
└── orders.db           # SQLite database (gitignored)`}
        />
        <P>
          <strong>Why this structure?</strong>
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li><IC>routers/</IC>: Each router is a mini-app (menu endpoints, order endpoints). Makes code navigable (100 lines per file vs. 500-line main.py).</li>
          <li><IC>models.py</IC>: All Pydantic schemas in one place. Easy to see the API contract.</li>
          <li><IC>auth.py</IC>: Security logic isolated. Reusable across routers.</li>
          <li><IC>tests/</IC>: Tests live separately. <IC>conftest.py</IC> holds shared fixtures (test DB, test client).</li>
          <li><IC>requirements.txt</IC>: <IC>pip install -r requirements.txt</IC> installs all deps. Essential for deployment.</li>
        </ul>
        <Callout type="tip">
          In an interview, when asked &quot;How do you structure a FastAPI project?&quot;, mention: <strong>Routers for endpoint grouping, separate models.py for schemas, auth.py for security, db.py for data layer, tests/ for pytest, requirements.txt for deps. Avoid single-file monoliths past ~200 lines.</strong>
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="db-layer" number="03" title="db.py — Database Initialization">
        <CodeBlock
          title="db.py"
          code={`import sqlite3
from datetime import datetime

DB_FILE = "orders.db"

def init_db():
    """Create tables if they don't exist."""
    conn = sqlite3.connect(DB_FILE)

    # Users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hashed_password TEXT NOT NULL
        )
    """)

    # Orders table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            total INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    """)

    conn.commit()
    conn.close()

def get_conn():
    """Get a database connection with row_factory for dict-like access."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn`}
        />
        <P>
          <IC>init_db()</IC> is called once on app startup. <IC>get_conn()</IC> is called in every route that needs DB access. The <IC>row_factory</IC> lets you do <IC>dict(row)</IC> to convert SQLite rows to dicts (for Pydantic models).
        </P>
      </Section>

      {/* 04 */}
      <Section id="models-layer" number="04" title="models.py — Pydantic Models">
        <CodeBlock
          title="models.py"
          code={`from pydantic import BaseModel, Field
from typing import Optional

# --- Auth models ---
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Menu models ---
class MenuItem(BaseModel):
    id: int
    name: str
    price: int

# --- Order models ---
class OrderIn(BaseModel):
    item_id: int
    qty: int = Field(gt=0, le=20)

class OrderOut(BaseModel):
    id: int
    username: str
    item_id: int
    qty: int
    total: int
    status: str
    created_at: str

class StatusUpdate(BaseModel):
    status: str  # "pending" | "ready" | "delivered"

# --- Stats model ---
class StatsOut(BaseModel):
    total_orders: int
    total_revenue: int
    top_item_id: Optional[int]
    top_item_revenue: Optional[int]`}
        />
        <P>
          All API contracts in one file. When the frontend team asks &quot;what does POST /orders accept?&quot; → point them to <IC>OrderIn</IC>.
        </P>
      </Section>

      {/* 05 */}
      <Section id="auth-layer" number="05" title="auth.py — Hashing, JWT, Dependency">
        <CodeBlock
          title="auth.py"
          code={`import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

security = HTTPBearer()

# --- Password hashing ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

# --- JWT ---
def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency for protected routes ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")`}
        />
        <P>
          <IC>get_current_user</IC> is the magic sauce. Every protected route uses <IC>Depends(get_current_user)</IC> to get the authenticated username.
        </P>
      </Section>

      {/* 06 */}
      <Section id="menu-router" number="06" title="routers/menu.py — Public Endpoint">
        <CodeBlock
          title="routers/menu.py"
          code={`from fastapi import APIRouter
from models import MenuItem

router = APIRouter(prefix="/menu", tags=["menu"])

# Hardcoded menu (no DB needed)
MENU = [
    MenuItem(id=1, name="Latte", price=180),
    MenuItem(id=2, name="Cappuccino", price=160),
    MenuItem(id=3, name="Espresso", price=90),
    MenuItem(id=4, name="Croissant", price=120),
]

@router.get("", response_model=list[MenuItem])
def get_menu():
    """Public endpoint: list all menu items."""
    return MENU`}
        />
        <P>
          No auth, no DB — just return the fixed menu. The <IC>response_model=list[MenuItem]</IC> tells FastAPI to serialize each item as a MenuItem Pydantic model (auto-validates + OpenAPI docs).
        </P>
      </Section>

      {/* 07 */}
      <Section id="orders-router" number="07" title="routers/orders.py — Protected CRUD">
        <CodeBlock
          title="routers/orders.py"
          code={`from fastapi import APIRouter, HTTPException, Depends
from models import OrderIn, OrderOut, StatusUpdate
from auth import get_current_user
from db import get_conn
from datetime import datetime

router = APIRouter(prefix="/orders", tags=["orders"])

# Menu prices (duplicate from menu.py, or import)
MENU_PRICES = {1: 180, 2: 160, 3: 90, 4: 120}

@router.post("", response_model=OrderOut, status_code=201)
def create_order(order: OrderIn, current_user: str = Depends(get_current_user)):
    if order.item_id not in MENU_PRICES:
        raise HTTPException(status_code=404, detail=f"Menu item {order.item_id} not found")

    price = MENU_PRICES[order.item_id]
    total = order.qty * price
    created_at = datetime.utcnow().isoformat()

    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO orders (username, item_id, qty, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (current_user, order.item_id, order.qty, total, "pending", created_at)
    )
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()

    return OrderOut(
        id=order_id,
        username=current_user,
        item_id=order.item_id,
        qty=order.qty,
        total=total,
        status="pending",
        created_at=created_at
    )

@router.get("", response_model=list[OrderOut])
def list_orders(current_user: str = Depends(get_current_user)):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM orders WHERE username = ?", (current_user,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, current_user: str = Depends(get_current_user)):
    conn = get_conn()
    row = conn.execute("SELECT * FROM orders WHERE id = ? AND username = ?", (order_id, current_user)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(row)

@router.patch("/{order_id}", response_model=OrderOut)
def update_order_status(order_id: int, update: StatusUpdate, current_user: str = Depends(get_current_user)):
    conn = get_conn()
    conn.execute("UPDATE orders SET status = ? WHERE id = ? AND username = ?", (update.status, order_id, current_user))
    conn.commit()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(row)

@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, current_user: str = Depends(get_current_user)):
    conn = get_conn()
    cursor = conn.execute("DELETE FROM orders WHERE id = ? AND username = ?", (order_id, current_user))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Order not found")`}
        />
        <P>
          Notice: every route has <IC>current_user: str = Depends(get_current_user)</IC>. FastAPI auto-calls the dependency, verifies the JWT, and injects the username. All SQL queries include <IC>WHERE username = ?</IC> → per-user data isolation.
        </P>
      </Section>

      {/* 08 */}
      <Section id="stats-router" number="08" title="routers/stats.py — Aggregations">
        <CodeBlock
          title="routers/stats.py"
          code={`from fastapi import APIRouter, Depends
from models import StatsOut
from auth import get_current_user
from db import get_conn

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsOut)
def get_stats(current_user: str = Depends(get_current_user)):
    """Aggregate stats for the current user."""
    conn = get_conn()

    # Total orders
    total_orders = conn.execute("SELECT COUNT(*) FROM orders WHERE username = ?", (current_user,)).fetchone()[0]

    # Total revenue
    total_revenue = conn.execute("SELECT SUM(total) FROM orders WHERE username = ?", (current_user,)).fetchone()[0] or 0

    # Top item by revenue (GROUP BY item_id, ORDER BY sum DESC, LIMIT 1)
    top_row = conn.execute("""
        SELECT item_id, SUM(total) as revenue
        FROM orders
        WHERE username = ?
        GROUP BY item_id
        ORDER BY revenue DESC
        LIMIT 1
    """, (current_user,)).fetchone()

    conn.close()

    if top_row:
        return StatsOut(
            total_orders=total_orders,
            total_revenue=total_revenue,
            top_item_id=top_row["item_id"],
            top_item_revenue=top_row["revenue"]
        )
    else:
        return StatsOut(
            total_orders=0,
            total_revenue=0,
            top_item_id=None,
            top_item_revenue=None
        )`}
        />
        <P>
          Example: alice has 5 orders totaling ₹1,020. Top item: Latte (3 orders, ₹540). The stats endpoint computes this with SQL aggregations (<IC>COUNT</IC>, <IC>SUM</IC>, <IC>GROUP BY</IC>).
        </P>
      </Section>

      {/* 09 */}
      <Section id="main-app" number="09" title="main.py — Wire Everything Together">
        <CodeBlock
          title="main.py"
          code={`from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import UserRegister, UserLogin, Token
from auth import hash_password, verify_password, create_access_token
from db import init_db, get_conn
from routers import menu, orders, stats

app = FastAPI(title="Brew & Bean API", version="1.0.0")

# CORS middleware (allow frontend at localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

# Include routers
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(stats.router)

# --- Auth endpoints (not in routers, kept in main for simplicity) ---

@app.post("/register", status_code=201)
def register(user: UserRegister):
    conn = get_conn()
    existing = conn.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = hash_password(user.password)
    conn.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", (user.username, hashed))
    conn.commit()
    conn.close()
    return {"message": "User registered successfully"}

@app.post("/login", response_model=Token)
def login(credentials: UserLogin):
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (credentials.username,)).fetchone()
    conn.close()

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(credentials.username)
    return Token(access_token=token, token_type="bearer")

@app.get("/")
def root():
    return {"message": "Welcome to Brew & Bean API. Docs at /docs"}`}
        />
        <P>
          <IC>app.include_router(...)</IC> mounts the routers. Now <IC>GET /menu</IC> → <IC>menu.router.get_menu()</IC>, <IC>POST /orders</IC> → <IC>orders.router.create_order()</IC>, etc.
        </P>
      </Section>

      {/* 10 */}
      <Section id="testing" number="10" title="Testing with pytest + TestClient ⭐">
        <P>
          <strong>TestClient</strong> is FastAPI&apos;s test harness. It spins up your app in-memory (no actual server, no network), so you can call endpoints as if they were functions and assert on responses.
        </P>
        <CodeBlock
          title="tests/conftest.py"
          code={`import pytest
from fastapi.testclient import TestClient
from main import app
from db import init_db, get_conn
import os

@pytest.fixture(scope="function")
def client():
    # Use a temp DB for tests
    os.environ["DB_FILE"] = "test_orders.db"
    init_db()

    with TestClient(app) as test_client:
        yield test_client

    # Cleanup: delete test DB
    conn = get_conn()
    conn.execute("DROP TABLE IF EXISTS orders")
    conn.execute("DROP TABLE IF EXISTS users")
    conn.close()
    if os.path.exists("test_orders.db"):
        os.remove("test_orders.db")`}
        />
        <CodeBlock
          title="tests/test_api.py"
          code={`def test_register_login(client):
    # Register alice
    resp = client.post("/register", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 201

    # Login alice
    resp = client.post("/login", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_create_order_computes_total(client):
    # Register + login
    client.post("/register", json={"username": "alice", "password": "secret123"})
    login_resp = client.post("/login", json={"username": "alice", "password": "secret123"})
    token = login_resp.json()["access_token"]

    # Create order: 2×Latte (item_id=1, price=180 → total=360)
    resp = client.post("/orders", json={"item_id": 1, "qty": 2}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["total"] == 360
    assert data["status"] == "pending"

def test_requires_auth(client):
    # POST /orders without token → 403
    resp = client.post("/orders", json={"item_id": 1, "qty": 2})
    assert resp.status_code == 403

def test_get_order_404(client):
    # Register + login
    client.post("/register", json={"username": "alice", "password": "secret123"})
    login_resp = client.post("/login", json={"username": "alice", "password": "secret123"})
    token = login_resp.json()["access_token"]

    # GET /orders/999 (doesn't exist) → 404
    resp = client.get("/orders/999", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404

def test_delete_then_404(client):
    client.post("/register", json={"username": "alice", "password": "secret123"})
    login_resp = client.post("/login", json={"username": "alice", "password": "secret123"})
    token = login_resp.json()["access_token"]

    # Create order
    create_resp = client.post("/orders", json={"item_id": 1, "qty": 2}, headers={"Authorization": f"Bearer {token}"})
    order_id = create_resp.json()["id"]

    # Delete it
    delete_resp = client.delete(f"/orders/{order_id}", headers={"Authorization": f"Bearer {token}"})
    assert delete_resp.status_code == 204

    # GET it again → 404
    get_resp = client.get(f"/orders/{order_id}", headers={"Authorization": f"Bearer {token}"})
    assert get_resp.status_code == 404

def test_per_user_filtering(client):
    # Register alice and bob
    client.post("/register", json={"username": "alice", "password": "secret123"})
    client.post("/register", json={"username": "bob", "password": "bob123"})

    alice_token = client.post("/login", json={"username": "alice", "password": "secret123"}).json()["access_token"]
    bob_token = client.post("/login", json={"username": "bob", "password": "bob123"}).json()["access_token"]

    # Alice creates order
    client.post("/orders", json={"item_id": 1, "qty": 2}, headers={"Authorization": f"Bearer {alice_token}"})

    # Bob lists orders → should be empty (doesn't see alice's order)
    resp = client.get("/orders", headers={"Authorization": f"Bearer {bob_token}"})
    assert len(resp.json()) == 0

    # Alice lists orders → should see 1
    resp = client.get("/orders", headers={"Authorization": f"Bearer {alice_token}"})
    assert len(resp.json()) == 1

# ... add 6 more tests (PATCH status, stats endpoint, invalid login, duplicate username, etc.)
# Total: 12 tests`}
        />
        <P>
          Run the tests:
        </P>
        <CodeBlock
          title="run_tests.sh"
          runnable={false}
          code={`pytest tests/ -v

# Output:
# test_api.py::test_register_login PASSED
# test_api.py::test_create_order_computes_total PASSED
# test_api.py::test_requires_auth PASSED
# test_api.py::test_get_order_404 PASSED
# test_api.py::test_delete_then_404 PASSED
# test_api.py::test_per_user_filtering PASSED
# ... (6 more)
# ======================== 12 passed in 1.2s ========================`}
        />
        <Callout type="tip">
          In an interview, when asked &quot;How do you test a FastAPI app?&quot;, say: <strong>&quot;I use pytest with TestClient. TestClient runs the app in-memory, no network. I write fixtures for a temp DB (isolated per test), then assert on response.status_code and response.json(). I test happy paths (create order → assert total), auth (no token → 403), edge cases (404, delete then 404), and per-user isolation.&quot;</strong>
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="manual-smoke-test" number="11" title="Manual Smoke Test — requests Script">
        <P>
          Automated tests are great, but you also want to manually verify the API works end-to-end. Use a Python script with the <IC>requests</IC> library:
        </P>
        <CodeBlock
          title="smoke_test.py"
          code={`import requests

BASE = "http://127.0.0.1:8000"

# 1. Register alice
resp = requests.post(f"{BASE}/register", json={"username": "alice", "password": "secret123"})
print(f"Register: {resp.status_code} {resp.json()}")

# 2. Login alice
resp = requests.post(f"{BASE}/login", json={"username": "alice", "password": "secret123"})
token = resp.json()["access_token"]
print(f"Login: {resp.status_code}, token: {token[:20]}...")

# 3. Get menu (public)
resp = requests.get(f"{BASE}/menu")
print(f"Menu: {resp.status_code} {resp.json()}")

# 4. Create order: 2×Latte
headers = {"Authorization": f"Bearer {token}"}
resp = requests.post(f"{BASE}/orders", json={"item_id": 1, "qty": 2}, headers=headers)
order = resp.json()
print(f"Create order: {resp.status_code} {order}")

# 5. List orders
resp = requests.get(f"{BASE}/orders", headers=headers)
print(f"List orders: {resp.status_code} {resp.json()}")

# 6. Get stats
resp = requests.get(f"{BASE}/stats", headers=headers)
print(f"Stats: {resp.status_code} {resp.json()}")

# 7. Update order status
order_id = order["id"]
resp = requests.patch(f"{BASE}/orders/{order_id}", json={"status": "ready"}, headers=headers)
print(f"Update status: {resp.status_code} {resp.json()}")

# 8. Delete order
resp = requests.delete(f"{BASE}/orders/{order_id}", headers=headers)
print(f"Delete: {resp.status_code}")`}
          output={`Register: 201 {'message': 'User registered successfully'}
Login: 200, token: eyJhbGciOiJIUzI1NiIs...
Menu: 200 [{'id': 1, 'name': 'Latte', 'price': 180}, ...]
Create order: 201 {'id': 1, 'username': 'alice', 'item_id': 1, 'qty': 2, 'total': 360, 'status': 'pending', 'created_at': '2024-01-15T12:00:00'}
List orders: 200 [{'id': 1, 'username': 'alice', ...}]
Stats: 200 {'total_orders': 1, 'total_revenue': 360, 'top_item_id': 1, 'top_item_revenue': 360}
Update status: 200 {'id': 1, 'status': 'ready', ...}
Delete: 204`}
        />
      </Section>

      {/* 12 */}
      <Section id="deploy-prep" number="12" title="Preparing to Ship — requirements.txt, env vars">
        <CodeBlock
          title="requirements.txt"
          code={`fastapi==0.109.0
uvicorn[standard]==0.27.0
pyjwt==2.8.0
bcrypt==4.1.2
python-multipart==0.0.6
pytest==7.4.4`}
        />
        <P>
          Install: <IC>pip install -r requirements.txt</IC>. For production deployment (Render, Railway, Fly.io):
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>Set <IC>SECRET_KEY</IC> as an environment variable (never hardcode in code)</li>
          <li>Use a production ASGI server: <IC>uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4</IC> (workers = CPU cores)</li>
          <li>For PostgreSQL instead of SQLite, use <IC>psycopg2</IC> + connection pooling</li>
          <li>Add a <IC>Procfile</IC> for Heroku/Render: <IC>web: uvicorn main:app --host 0.0.0.0 --port $PORT</IC></li>
        </ul>
        <CodeBlock
          title=".env.example"
          runnable={false}
          code={`# Copy to .env and fill in values (never commit .env to Git)
SECRET_KEY=your-super-secret-key-min-32-chars
DATABASE_URL=sqlite:///orders.db  # or postgresql://...`}
        />
        <P>
          For Docker (next course): <IC>Dockerfile</IC> + <IC>docker-compose.yml</IC> with environment variables. The API is already Docker-ready (no hardcoded paths, env-configurable).
        </P>
      </Section>

      {/* 13 */}
      <Section id="customer-journey" number="13" title="The Customer Journey (Complete curl Demo)">
        <CodeBlock
          title="customer_journey.sh"
          runnable={false}
          code={`#!/bin/bash
BASE=http://127.0.0.1:8000

echo "=== CUSTOMER JOURNEY: Alice orders coffee ==="
echo ""

echo "1️⃣ Alice registers"
curl -X POST $BASE/register -H "Content-Type: application/json" -d '{"username": "alice", "password": "secret123"}'
echo -e "\\n"

echo "2️⃣ Alice logs in"
TOKEN=$(curl -s -X POST $BASE/login -H "Content-Type: application/json" -d '{"username": "alice", "password": "secret123"}' | jq -r .access_token)
echo "Token: $TOKEN"
echo ""

echo "3️⃣ Alice browses the menu"
curl -s $BASE/menu | jq
echo ""

echo "4️⃣ Alice orders 2×Latte (₹360)"
ORDER=$(curl -s -X POST $BASE/orders -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"item_id": 1, "qty": 2}' | jq)
echo "$ORDER"
ORDER_ID=$(echo "$ORDER" | jq -r .id)
echo ""

echo "5️⃣ Alice checks her orders"
curl -s $BASE/orders -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "6️⃣ Barista updates order status to 'ready'"
curl -s -X PATCH $BASE/orders/$ORDER_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status": "ready"}' | jq
echo ""

echo "7️⃣ Alice picks up the order, status → 'delivered'"
curl -s -X PATCH $BASE/orders/$ORDER_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status": "delivered"}' | jq
echo ""

echo "8️⃣ Alice checks her stats"
curl -s $BASE/stats -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "✅ Journey complete! Alice registered, logged in, browsed menu, ordered, tracked status, and viewed stats."`}
        />
        <P>
          Run it: <IC>chmod +x customer_journey.sh && ./customer_journey.sh</IC>. You&apos;ll see the full flow with real JSON responses.
        </P>
      </Section>

      {/* 14 */}
      <Section id="debugging" number="14" title="Debugging pytest, TestClient, DB Isolation">
        <P>
          <strong>1. Tests fail with <IC>sqlite3.OperationalError: table orders already exists</IC></strong>
        </P>
        <P>
          Cause: Test DB not cleaned up between tests. Fix: Use <IC>scope=&quot;function&quot;</IC> fixture, drop tables in teardown.
        </P>
        <P>
          <strong>2. Tests pass but manual curl fails (or vice versa)</strong>
        </P>
        <P>
          Cause: TestClient uses a different DB file than the running server. Fix: Check <IC>DB_FILE</IC> env var. TestClient should use <IC>test_orders.db</IC>, uvicorn should use <IC>orders.db</IC>.
        </P>
        <P>
          <strong>3. <IC>pytest -x</IC> stops on first failure</strong>
        </P>
        <P>
          Useful for debugging: <IC>pytest -x -v</IC> (stop on first fail, verbose output). Fix the first test, then re-run.
        </P>
        <P>
          <strong>4. <IC>assert resp.status_code == 201</IC> fails, actual is 422</strong>
        </P>
        <P>
          Cause: Pydantic validation failed. Check <IC>resp.json()</IC> for <IC>detail</IC> array. Likely wrong field type or missing required field in test data.
        </P>
        <Callout type="note">
          TestClient is synchronous (no <IC>await</IC>). If you later add async DB (like <IC>asyncpg</IC>), switch to <IC>httpx.AsyncClient</IC> for async tests. For now, SQLite + TestClient works great.
        </Callout>
      </Section>

      {/* 15 */}
      <Section id="lab" number="15" title="Lab — Extend the API Yourself">
        <P>
          <strong>Goal:</strong> Add three features to the API and write tests for them.
        </P>
        <P>
          <strong>Feature 1: DELETE protection</strong> — Only the order owner can delete. If bob tries to delete alice&apos;s order, return 404 (pretend it doesn&apos;t exist, for security — don&apos;t leak existence).
        </P>
        <P>
          Implementation: In <IC>delete_order</IC>, the <IC>WHERE id = ? AND username = ?</IC> already does this. Test it: alice creates order, bob tries to delete it with bob&apos;s token → 404.
        </P>
        <P>
          <strong>Feature 2: GET /menu search param</strong> — <IC>GET /menu?category=drink</IC> filters to drinks (Latte, Cappuccino, Espresso).
        </P>
        <P>
          Implementation:
        </P>
        <CodeBlock
          title="menu.py (extended)"
          code={`from typing import Optional

@router.get("", response_model=list[MenuItem])
def get_menu(category: Optional[str] = None):
    if category == "drink":
        return [item for item in MENU if item.id in [1, 2, 3]]
    elif category == "food":
        return [item for item in MENU if item.id == 4]
    else:
        return MENU`}
        />
        <P>
          Test:
        </P>
        <CodeBlock
          title="test_menu_filter.py"
          code={`def test_menu_filter(client):
    resp = client.get("/menu?category=drink")
    items = resp.json()
    assert len(items) == 3  # Latte, Cappuccino, Espresso
    assert all(item["id"] in [1, 2, 3] for item in items)`}
        />
        <P>
          <strong>Feature 3: Add 2 new tests</strong> — (1) <IC>test_patch_status_not_owner</IC>: alice creates order, bob tries to PATCH → 404. (2) <IC>test_invalid_login</IC>: wrong password → 401.
        </P>
        <P>
          <strong>Checkpoints:</strong>
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>After Feature 1: <IC>pytest tests/test_api.py::test_delete_protection -v</IC> → PASSED</li>
          <li>After Feature 2: <IC>curl http://127.0.0.1:8000/menu?category=drink | jq</IC> → 3 items</li>
          <li>After Feature 3: <IC>pytest tests/ -v</IC> → 14 passed (12 original + 2 new)</li>
        </ul>
        <P>
          Submit: Screenshot of <IC>pytest</IC> output showing 14 passed tests. You&apos;ve built and extended a production API. 🚀
        </P>
      </Section>

      {/* 16 */}
      <Section id="memorize" number="16" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Project structure", "main.py (app), routers/ (endpoints), models.py (Pydantic), auth.py (JWT+hash), db.py (SQLite), tests/ (pytest)"],
            ["Router pattern", "router = APIRouter(prefix='/orders'); app.include_router(router) — modular endpoints"],
            ["Protected route", "def route(user: str = Depends(get_current_user)) — FastAPI injects authenticated username"],
            ["TestClient usage", "from fastapi.testclient import TestClient; client = TestClient(app); resp = client.post(...)"],
            ["Test fixture for DB", "@pytest.fixture(scope='function') def client(): init temp DB, yield TestClient, cleanup"],
            ["Assert status + data", "assert resp.status_code == 201; assert resp.json()['total'] == 360"],
            ["Per-user filtering", "SELECT * FROM orders WHERE username = ? — every query includes current_user"],
            ["Stats aggregation", "SELECT SUM(total), COUNT(*), item_id, SUM(total) FROM orders GROUP BY item_id ORDER BY sum DESC LIMIT 1"],
            ["CORS for frontend", "app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000'], allow_credentials=True)"],
            ["requirements.txt", "fastapi, uvicorn[standard], pyjwt, bcrypt, pytest — pip install -r requirements.txt"],
            ["Deploy checklist", "SECRET_KEY in env, uvicorn --workers 4, PostgreSQL (not SQLite) for prod, HTTPS only"],
            ["Smoke test script", "requests.post/get/patch/delete with token in headers — manual end-to-end verification"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
