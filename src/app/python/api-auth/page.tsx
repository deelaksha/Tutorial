"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "JWT login → protected request",
  nodes: [
    { id: "user", icon: "🧑", label: "Client", x: 6, y: 50, color: "#22d3ee" },
    { id: "login", icon: "🔑", label: "POST /login", sub: "verify credentials", x: 24, y: 22, color: "#fb923c" },
    { id: "verify", icon: "🧮", label: "Verify password", sub: "bcrypt compare", x: 24, y: 78, color: "#a78bfa" },
    { id: "jwt", icon: "🎫", label: "JWT issued", sub: "signed token", x: 44, y: 50, color: "#34d399" },
    { id: "prot", icon: "🛡️", label: "GET /orders", sub: "protected", x: 64, y: 22, color: "#60a5fa" },
    { id: "check", icon: "🔍", label: "Verify token", sub: "signature + expiry", x: 64, y: 78, color: "#fbbf24" },
    { id: "data", icon: "📦", label: "200 data", x: 86, y: 50, color: "#22d3ee" },
    { id: "err", icon: "🚫", label: "401 Unauthorized", x: 86, y: 78, color: "#f87171" },
  ],
  edges: [
    { id: "u-login", from: "user", to: "login", color: "#fb923c" },
    { id: "login-verify", from: "login", to: "verify", color: "#a78bfa" },
    { id: "verify-jwt", from: "verify", to: "jwt", color: "#34d399" },
    { id: "u-prot", from: "user", to: "prot", color: "#60a5fa" },
    { id: "prot-check", from: "prot", to: "check", color: "#fbbf24" },
    { id: "check-data", from: "check", to: "data", color: "#22d3ee" },
    { id: "jwt-prot", from: "jwt", to: "prot", bend: 30, color: "#60a5fa" },
    { id: "check-err", from: "check", to: "err", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy-login",
      name: "🎯 Login + use token",
      command: "POST /login → 200 token → GET /orders with Authorization header → 200 data",
      steps: [
        { node: "user", paths: ["u-login"], text: "Client sends credentials: {\"username\": \"alice\", \"password\": \"secret123\"}. This is the login request." },
        { node: "login", paths: ["login-verify"], text: "POST /login endpoint receives the credentials. Look up user 'alice' in the database, retrieve stored password hash." },
        { node: "verify", paths: ["verify-jwt"], text: "bcrypt.checkpw(password='secret123', stored_hash). The hash was generated when alice registered. checkpw returns True — password correct! ✓" },
        { node: "jwt", paths: ["jwt-prot"], text: "Generate JWT: payload={\"sub\": \"alice\", \"exp\": now+1hour}, sign with SECRET_KEY. Return {\"access_token\": \"eyJhbGc...\", \"token_type\": \"bearer\"}. Client stores this token (localStorage, memory)." },
        { node: "user", paths: ["u-prot"], text: "Client makes protected request: GET /orders with header Authorization: Bearer eyJhbGc... — the token from login response." },
        { node: "prot", paths: ["prot-check"], text: "Protected endpoint uses Depends(get_current_user). FastAPI extracts the token from the Authorization header and calls the dependency." },
        { node: "check", paths: ["check-data"], text: "Decode JWT with SECRET_KEY. Verify signature (prevents tampering), check exp (not expired). Extract payload: {\"sub\": \"alice\"}. Token is valid. ✅" },
        { node: "data", paths: [], text: "Return user's orders (filtered by username='alice'). Response: 200 OK with [{\"id\": 1, \"item_id\": 1, ...}, ...]. Auth flow complete. 🚀" },
      ],
    },
    {
      id: "tampered-token",
      name: "⚠️ Tampered token → 401",
      command: "Client edits JWT payload (sub: alice → bob) without re-signing",
      steps: [
        { node: "user", paths: ["u-prot"], text: "Attacker intercepts alice's token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMDAwMH0.signature. Decodes the middle part (base64), changes \"alice\" → \"bob\", re-encodes. Sends modified token." },
        { node: "prot", paths: ["prot-check"], text: "Protected endpoint receives the tampered token. Depends(get_current_user) calls jwt.decode(token, SECRET_KEY)." },
        { node: "check", paths: ["check-err"], text: "jwt.decode() computes expected signature from the payload using SECRET_KEY. Attacker didn't have SECRET_KEY, so the signature doesn't match. Raises InvalidSignatureError." },
        { node: "err", paths: [], text: "Dependency raises HTTPException(401, \"Could not validate credentials\"). Response: 401 Unauthorized. The tampered token is rejected. Attacker gets nothing. 🛑" },
      ],
    },
    {
      id: "expired-token",
      name: "⏱️ Expired token → 401 → re-login",
      command: "Token exp in past → 401 → client re-authenticates",
      steps: [
        { node: "user", paths: ["u-prot"], text: "Client sends valid token from 2 hours ago. The token has exp: 1700000000 (timestamp in past). Client may not realize it's expired." },
        { node: "prot", paths: ["prot-check"], text: "Protected endpoint calls get_current_user dependency. jwt.decode() starts verification." },
        { node: "check", paths: ["check-err"], text: "jwt.decode() checks exp claim: exp=1700000000 < now=1700003600. Token is expired. Raises ExpiredSignatureError." },
        { node: "err", paths: [], text: "401 Unauthorized: {\"detail\": \"Token expired\"}. Client must re-login to get a fresh token. Client redirects to login page, user re-authenticates, gets new token with new exp. Security enforced: old tokens don't work forever. ⏰" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-auth", label: "Why Auth — The Open DELETE Problem" },
  { id: "authn-vs-authz", label: "Authentication vs Authorization" },
  { id: "api-keys", label: "Level 1 — API Keys (X-API-Key)" },
  { id: "passwords-hashing", label: "Passwords Done Right — Hashing" },
  { id: "jwt-intro", label: "JWT — Tokens You Can Trust" },
  { id: "jwt-decode", label: "JWT Anatomy — header.payload.signature" },
  { id: "login-flow", label: "Login Flow — POST /login, return JWT" },
  { id: "protected-routes", label: "Protected Routes — Depends(get_current_user)" },
  { id: "cors", label: "CORS — Why the Browser Blocks Your API" },
  { id: "security-checklist", label: "Security Hygiene Checklist" },
  { id: "debugging", label: "Debugging 401 vs 403 vs 422" },
  { id: "lab", label: "Lab — Full Auth System" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ApiAuthPage() {
  return (
    <TopicShell
      icon="🔐"
      title="Auth & Security — Protect Your API"
      gradientWord="Auth"
      subtitle="Your orders API is currently open to the world — anyone can DELETE /orders/7 and destroy data. Time to lock it down. You&apos;ll learn authentication (who are you?), authorization (what can you do?), API keys, password hashing with bcrypt (never store plaintext!), JWTs (stateless signed tokens), protected routes (FastAPI dependencies), CORS (browser same-origin policy), and a security checklist for production."
      nav={NAV}
      badges={["🔑 JWT tokens", "🔒 bcrypt hashing", "🛡️ FastAPI dependencies", "🌐 CORS middleware"]}
      next={{ icon: "🚀", label: "Capstone — Ship the API", href: "/python/api-project" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-auth" number="01" title="Why Auth — The Open DELETE Problem">
        <P>
          Your CRUD API from the previous topic has a <strong>catastrophic security hole</strong>:
        </P>
        <CodeBlock
          title="attacker.sh"
          runnable={false}
          code={`# Anyone on the internet can run this:
curl -X DELETE http://your-api.com/orders/7

# Response: 204 No Content
# Order 7 is GONE. No password, no API key, no permission check. Just... deleted.`}
        />
        <P>
          This is fine for localhost development. It&apos;s <em>not</em> fine for production. The moment you deploy to a public URL, attackers will:
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>Delete all orders (loop <IC>DELETE /orders/1</IC>, <IC>/orders/2</IC>, ...)</li>
          <li>Create fake orders (spam your database)</li>
          <li>Read orders they don&apos;t own (privacy violation)</li>
        </ul>
        <P>
          The fix: <strong>authentication</strong> (verify who the user is) and <strong>authorization</strong> (verify they&apos;re allowed to do this action).
        </P>
        <Callout type="mistake">
          Never deploy an API to production without auth. Even for &quot;internal&quot; tools — your company network is not a security boundary (anyone on the WiFi can hit your API). Always require authentication.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="authn-vs-authz" number="02" title="Authentication vs Authorization">
        <Table
          head={["Term", "Question it answers", "Example"]}
          rows={[
            [
              <strong key="1">Authentication</strong>,
              "Who are you?",
              "User logs in with password → server verifies → issues token. Now server knows \"you are alice\".",
            ],
            [
              <strong key="1">Authorization</strong>,
              "What are you allowed to do?",
              "Alice can read/update her own orders, but not bob's orders. Admin can delete any order.",
            ],
          ]}
        />
        <Callout type="analogy">
          You&apos;re at a nightclub. <strong>Authentication</strong> is the bouncer checking your ID at the door (are you old enough? is this ID real?). <strong>Authorization</strong> is the VIP-section rope — even with valid ID, you can&apos;t enter VIP unless you&apos;re on the list. Authentication = identity, authorization = permissions.
        </Callout>
        <P>
          This topic focuses on authentication. Authorization (role-based access control, permissions) is a layer on top, which we&apos;ll touch on but not fully implement.
        </P>
      </Section>

      {/* 03 */}
      <Section id="api-keys" number="03" title="Level 1 — API Keys (X-API-Key Header)">
        <P>
          The simplest auth: a shared secret string. The client sends it in a header; the server checks it matches.
        </P>
        <CodeBlock
          title="api_key_auth.py"
          code={`from fastapi import FastAPI, Header, HTTPException

app = FastAPI()

# Hardcoded key (in production, store in env var)
API_KEY = "brew-bean-secret-key-2024"

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.get("/orders")
def list_orders(api_key: str = Header(alias="X-API-Key")):
    verify_api_key(api_key)
    # If we reach here, key is valid
    return {"orders": [{"id": 1, "total": 360}]}`}
        />
        <CodeBlock
          title="test_api_key.sh"
          runnable={false}
          code={`# Without key → 401
curl http://127.0.0.1:8000/orders

# Response: 422 (missing required header X-API-Key)


# With wrong key → 401
curl http://127.0.0.1:8000/orders -H "X-API-Key: wrong-key"

# Response: 401 Unauthorized
# {"detail": "Invalid API key"}


# With correct key → 200
curl http://127.0.0.1:8000/orders -H "X-API-Key: brew-bean-secret-key-2024"

# Response: 200 OK
# {"orders": [{"id": 1, "total": 360}]}`}
        />
        <P>
          <strong>Pros:</strong> Simple, no user database needed. <strong>Cons:</strong> Single shared secret (if leaked, everyone is compromised), no user identity (can&apos;t tell who made the request), no expiration.
        </P>
        <P>
          API keys are fine for server-to-server communication (your backend calling a third-party API). For user-facing apps, you need per-user credentials → passwords + tokens.
        </P>
        <Callout type="note">
          401 vs 403: Use <IC>401 Unauthorized</IC> when credentials are missing/invalid (authentication failed). Use <IC>403 Forbidden</IC> when the user is authenticated but doesn&apos;t have permission (authorization failed). Example: alice tries to delete bob&apos;s order → 403.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="passwords-hashing" number="04" title="Passwords Done Right — NEVER Store Plaintext">
        <Callout type="mistake">
          <strong>NEVER store passwords in plaintext.</strong> If your database leaks (it will, eventually — data breaches happen to everyone), attackers get all passwords. Users reuse passwords across sites. One breach → compromised email, bank, social media. This is a fireable offense in any serious company.
        </Callout>
        <P>
          Instead, store a <strong>hash</strong>: a one-way cryptographic function. <IC>hash(password)</IC> → scrambled string. You can&apos;t reverse it to get the original password.
        </P>
        <CodeBlock
          title="hashing_demo.py"
          code={`import bcrypt

# User registers with password "secret123"
password = "secret123"

# Hash it (bcrypt auto-generates a salt — different hash each time)
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
print(f"Hashed: {hashed}")

# Store hashed in the database (NOT the plaintext "secret123")

# Later, user logs in with password "secret123"
login_password = "secret123"

# Check if it matches the stored hash
if bcrypt.checkpw(login_password.encode(), hashed):
    print("✅ Password correct!")
else:
    print("❌ Password wrong!")`}
          output={`Hashed: b'$2b$12$E4z.3J9KqV8l5zT1XwJgZ.Oa7fHv6K3m8pLr5nQwY2xG4bS1cD8uO'
✅ Password correct!`}
        />
        <P>
          Run it again with the same password → different hash:
        </P>
        <CodeBlock
          title="salting_demo.py"
          code={`password = "secret123"
hash1 = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
hash2 = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

print(f"Hash 1: {hash1}")
print(f"Hash 2: {hash2}")
print(f"Same password, different hashes! (bcrypt auto-salts)")`}
          output={`Hash 1: b'$2b$12$A1b2C3d4E5f6G7h8I9j0K.L1m2N3o4P5q6R7s8T9u0V1w2X3y4Z5'
Hash 2: b'$2b$12$Z9y8X7w6V5u4T3s2R1q0P.O9n8M7l6K5j4I3h2G1f0E9d8C7b6A5'
Same password, different hashes! (bcrypt auto-salts)`}
        />
        <P>
          This is <strong>salting</strong>: bcrypt adds random data before hashing, so the same password produces different hashes. This defeats rainbow-table attacks (precomputed hash dictionaries).
        </P>
        <Callout type="behind">
          Why can&apos;t you reverse a hash? Hashing is lossy: <IC>hash(&quot;secret123&quot;)</IC> and <IC>hash(&quot;secret124&quot;)</IC> produce completely different outputs, but there&apos;s no math to go backwards. It&apos;s like blending a smoothie — you can&apos;t un-blend it to get the original strawberries. When a user logs in, you hash their input and compare the hashes (not the passwords).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="jwt-intro" number="05" title="JWT — Stateless Signed Tokens">
        <P>
          <strong>JWT (JSON Web Token)</strong> is a standard for authentication tokens. After login, the server issues a JWT; the client includes it in every request. The server verifies the JWT signature to trust it.
        </P>
        <P>
          Key property: <strong>stateless</strong>. The server doesn&apos;t store a session in a database. The token itself contains the user info (username, expiry), and the signature proves it wasn&apos;t tampered with.
        </P>
        <CodeBlock
          title="jwt_demo.py"
          code={`import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-keep-it-safe"

# Create a token (login response)
payload = {
    "sub": "alice",  # subject (username)
    "exp": datetime.utcnow() + timedelta(hours=1)  # expires in 1 hour
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
print(f"Token: {token}")

# Later, verify the token (protected endpoint)
try:
    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    print(f"✅ Token valid! User: {decoded['sub']}, Expires: {decoded['exp']}")
except jwt.ExpiredSignatureError:
    print("❌ Token expired")
except jwt.InvalidTokenError:
    print("❌ Token invalid (tampered or wrong secret)")`}
          output={`Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMDAwMH0.signature_here
✅ Token valid! User: alice, Expires: 1700000000`}
        />
        <P>
          If an attacker changes <IC>&quot;alice&quot;</IC> to <IC>&quot;bob&quot;</IC> in the payload, the signature won&apos;t match (they don&apos;t have the SECRET_KEY), and <IC>jwt.decode()</IC> raises <IC>InvalidTokenError</IC>.
        </P>
      </Section>

      {/* 06 */}
      <Section id="jwt-decode" number="06" title="JWT Anatomy — Three Parts, Dot-Separated">
        <P>
          A JWT looks like: <IC>eyJhbGc...eyJzdWI...signature</IC>. It&apos;s three base64-encoded parts:
        </P>
        <CodeBlock
          title="jwt_parts.txt"
          runnable={false}
          code={`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← header (algorithm + type)
.
eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMDAwMH0   ← payload (user data + claims)
.
signature_here                                  ← signature (HMAC of header+payload with SECRET_KEY)`}
        />
        <P>
          You can decode the header and payload without the secret (it&apos;s just base64, not encrypted):
        </P>
        <CodeBlock
          title="decode_jwt.py"
          code={`import base64
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMDAwMH0.signature"

# Split by dots
header, payload, signature = token.split(".")

# Decode header (add padding if needed)
header_json = base64.urlsafe_b64decode(header + "==").decode()
print(f"Header: {header_json}")

# Decode payload
payload_json = base64.urlsafe_b64decode(payload + "==").decode()
print(f"Payload: {payload_json}")`}
          output={`Header: {"alg":"HS256","typ":"JWT"}
Payload: {"sub":"alice","exp":1700000000}`}
        />
        <Callout type="behind">
          <strong>JWTs are NOT encrypted — they&apos;re SIGNED.</strong> Anyone can decode and read the payload. The signature is what prevents tampering. Don&apos;t put secrets (passwords, credit card numbers) in JWT payloads. Only put non-sensitive identifiers (username, user_id, roles). The payload is visible; the signature proves it&apos;s authentic.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="login-flow" number="07" title="Login Flow — POST /login Returns JWT">
        <P>
          The login endpoint: client sends username + password, server verifies, returns a JWT.
        </P>
        <CodeBlock
          title="login.py"
          code={`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta

app = FastAPI()

SECRET_KEY = "your-secret-key-keep-it-safe"
ALGORITHM = "HS256"

# Fake user database (in production: SQLite/Postgres)
USERS_DB = {
    "alice": {
        "username": "alice",
        "hashed_password": bcrypt.hashpw("secret123".encode(), bcrypt.gensalt()),
    }
}

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/login", response_model=Token)
def login(credentials: LoginRequest):
    # 1. Look up user
    user = USERS_DB.get(credentials.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2. Verify password
    if not bcrypt.checkpw(credentials.password.encode(), user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Generate JWT
    payload = {
        "sub": credentials.username,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}`}
        />
        <CodeBlock
          title="test_login.sh"
          runnable={false}
          code={`# Correct credentials
curl -X POST http://127.0.0.1:8000/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "secret123"}'

# Response: 200 OK
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMzYwMH0.signature",
#   "token_type": "bearer"
# }


# Wrong password
curl -X POST http://127.0.0.1:8000/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "wrong"}'

# Response: 401 Unauthorized
# {"detail": "Invalid credentials"}`}
        />
        <P>
          The client stores the <IC>access_token</IC> (localStorage, sessionStorage, memory) and includes it in future requests.
        </P>
      </Section>

      {/* 08 */}
      <Section id="protected-routes" number="08" title="Protected Routes — FastAPI Dependencies">
        <P>
          FastAPI&apos;s <IC>Depends()</IC> system lets you extract and verify the JWT in a reusable function:
        </P>
        <CodeBlock
          title="protected.py"
          code={`from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

SECRET_KEY = "your-secret-key-keep-it-safe"
ALGORITHM = "HS256"

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Protected endpoint
@app.get("/orders")
def list_orders(current_user: str = Depends(get_current_user)):
    # If we reach here, current_user is the username from the JWT
    return {"message": f"Orders for {current_user}", "orders": []}

# Usage:
# GET /orders with header: Authorization: Bearer <token>
# → FastAPI extracts token, calls get_current_user, verifies, injects username
# → Your route handler receives current_user="alice"`}
        />
        <CodeBlock
          title="test_protected.sh"
          runnable={false}
          code={`# 1. Login to get token
TOKEN=$(curl -X POST http://127.0.0.1:8000/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "secret123"}' | jq -r .access_token)

echo "Token: $TOKEN"


# 2. Call protected endpoint WITH token
curl http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer $TOKEN"

# Response: 200 OK
# {"message": "Orders for alice", "orders": []}


# 3. Call WITHOUT token → 403 (HTTPBearer auto-rejects)
curl http://127.0.0.1:8000/orders

# Response: 403 Forbidden
# {"detail": "Not authenticated"}


# 4. Call with INVALID token
curl http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer invalid-token"

# Response: 401 Unauthorized
# {"detail": "Invalid token"}`}
        />
        <P>
          Now add per-user filtering:
        </P>
        <CodeBlock
          title="per_user_data.py"
          code={`@app.get("/orders")
def list_orders(current_user: str = Depends(get_current_user)):
    conn = get_conn()
    # Filter orders by username (assumes orders table has a 'username' column)
    rows = conn.execute("SELECT * FROM orders WHERE username = ?", (current_user,)).fetchall()
    conn.close()
    return {"orders": [dict(r) for r in rows]}

# Alice can only see alice's orders, bob can only see bob's.
# This is AUTHORIZATION (permission enforcement).`}
        />
      </Section>

      {/* 09 */}
      <Section id="cors" number="09" title="CORS — Why the Browser Blocks Your API">
        <P>
          You build a React frontend at <IC>http://localhost:3000</IC>, it calls your API at <IC>http://localhost:8000</IC>. The browser console shows:
        </P>
        <CodeBlock
          title="cors_error.txt"
          runnable={false}
          code={`Access to fetch at 'http://localhost:8000/orders' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.`}
        />
        <P>
          This is <strong>CORS (Cross-Origin Resource Sharing)</strong>. The browser&apos;s same-origin policy blocks JS on <IC>localhost:3000</IC> from calling <IC>localhost:8000</IC> (different ports = different origins).
        </P>
        <P>
          The fix: add CORS middleware to FastAPI, telling the browser &quot;it&apos;s OK for localhost:3000 to call me&quot;:
        </P>
        <CodeBlock
          title="cors.py"
          code={`from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # allow all headers (Authorization, Content-Type, etc.)
)

# Now your React app can fetch() this API without CORS errors.`}
        />
        <P>
          For production, set <IC>allow_origins</IC> to your deployed frontend URL (e.g., <IC>[&quot;https://myapp.com&quot;]</IC>). <strong>Never</strong> use <IC>allow_origins=[&quot;*&quot;]</IC> with <IC>allow_credentials=True</IC> — that disables CORS protection entirely.
        </P>
        <Callout type="note">
          CORS is a browser security feature, not a server feature. curl/Postman/Python requests don&apos;t care about CORS. Only browsers enforce it. If you&apos;re building a pure API (no browser frontend), you can skip CORS. If you have a web frontend, you need it.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="security-checklist" number="10" title="Security Hygiene — Production Checklist">
        <Table
          head={["What", "Why", "How"]}
          rows={[
            ["HTTPS only", "HTTP sends tokens in plaintext → sniffable on WiFi", "Deploy behind nginx with Let's Encrypt SSL cert, or use a platform (Render, Railway) that auto-provisions HTTPS"],
            ["SECRET_KEY in env", "Hardcoded secrets → Git leak → game over", "Use python-dotenv, load from .env file (never commit .env to Git), or platform env vars"],
            ["Rate limiting", "Attacker brute-forces /login with 10K passwords/sec", "Use slowapi middleware (pip install slowapi) or nginx rate-limit module"],
            ["Pydantic validation", "Malformed input → crashes or injection", "Already done! Pydantic auto-validates types/ranges → 422 before code runs"],
            ["Parameterized SQL", "SQL injection → DROP TABLE", "Already done! Always use ? placeholders, never f-strings in SQL"],
            ["Don't leak stack traces", "Error messages reveal file paths, library versions → attacker intel", "Set debug=False in production, return generic {\"detail\": \"Internal server error\"} for 500s"],
            ["Hash passwords", "Plaintext passwords in DB → breach = disaster", "Already done! bcrypt.hashpw on registration, bcrypt.checkpw on login"],
            ["Expire tokens", "Stolen token works forever → attacker access forever", "Already done! JWT exp claim, 1-hour expiry (adjust to use case)"],
          ]}
        />
        <Callout type="tip">
          In an interview, when asked &quot;How do you secure an API?&quot;, list: <strong>HTTPS, env secrets, JWT with expiry, bcrypt password hashing, parameterized SQL, Pydantic validation, rate limiting, no debug=True in prod, CORS for browser frontends.</strong>
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging 401 vs 403 vs 422">
        <P>
          <strong>422 Unprocessable Entity</strong> → Pydantic validation failed (wrong type, missing field, constraint violated). Check the <IC>detail</IC> array for field-level errors. Not an auth issue.
        </P>
        <P>
          <strong>401 Unauthorized</strong> → Authentication failed. Causes:
        </P>
        <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
          <li>No <IC>Authorization</IC> header → response: <IC>{`{"detail": "Not authenticated"}`}</IC> (HTTPBearer auto-rejects)</li>
          <li>Invalid token (tampered, wrong secret) → <IC>{`{"detail": "Invalid token"}`}</IC></li>
          <li>Expired token → <IC>{`{"detail": "Token expired"}`}</IC></li>
          <li>Wrong password on login → <IC>{`{"detail": "Invalid credentials"}`}</IC></li>
        </ul>
        <P>
          <strong>403 Forbidden</strong> → User is authenticated (we know who they are) but not authorized (they don&apos;t have permission). Example: alice tries to delete bob&apos;s order, or non-admin tries admin-only endpoint.
        </P>
        <P>
          <strong>Manual JWT decode trick</strong> (for debugging):
        </P>
        <CodeBlock
          title="debug_jwt.py"
          code={`import jwt

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTcwMDAwMDAwMH0.sig"

# Decode WITHOUT verification (see what's inside)
decoded = jwt.decode(token, options={"verify_signature": False})
print(decoded)

# Output: {'sub': 'alice', 'exp': 1700000000}
# Check if exp is in the past (expired), or if sub is what you expect.`}
        />
        <Callout type="note">
          Use <IC>jwt.io</IC> (website) to paste a token and see the decoded payload in your browser. Paste your SECRET_KEY in the &quot;verify signature&quot; box to check if the signature is valid. Don&apos;t paste real production secrets into public websites — only for learning/debugging with test keys.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab — Build the Full Auth System">
        <P>
          <strong>Goal:</strong> Add authentication to the orders API. Register, login, protect routes, test with expired/invalid tokens.
        </P>
        <P>
          <strong>Steps:</strong>
        </P>
        <ol className="ml-6 list-decimal space-y-2 text-sm text-slate-300">
          <li>Install dependencies: <IC>pip install pyjwt bcrypt python-multipart</IC></li>
          <li>Create a users table in SQLite: <IC>CREATE TABLE users (username TEXT PRIMARY KEY, hashed_password TEXT)</IC></li>
          <li>
            Build <IC>POST /register</IC>: accept username + password, hash with bcrypt, INSERT into users table, return 201.
          </li>
          <li>
            Build <IC>POST /login</IC>: look up user, verify password with bcrypt.checkpw, generate JWT (exp = 1 hour), return <IC>{`{"access_token": ...}`}</IC>.
          </li>
          <li>
            Add <IC>get_current_user</IC> dependency: extract JWT from Authorization header, decode, verify signature + expiry, return username.
          </li>
          <li>
            Protect <IC>POST /orders</IC>, <IC>GET /orders</IC>, <IC>PATCH /orders/{`{id}`}</IC>, <IC>DELETE /orders/{`{id}`}</IC> with <IC>Depends(get_current_user)</IC>.
          </li>
          <li>
            Add a <IC>username</IC> column to the orders table, store <IC>current_user</IC> when creating orders, filter <IC>GET /orders</IC> by <IC>current_user</IC>.
          </li>
          <li>Test the flow:</li>
        </ol>
        <CodeBlock
          title="test_auth.sh"
          runnable={false}
          code={`# 1. Register alice
curl -X POST http://127.0.0.1:8000/register \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "secret123"}'
# Response: 201 Created


# 2. Login alice
TOKEN=$(curl -X POST http://127.0.0.1:8000/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "secret123"}' | jq -r .access_token)

echo "Token: $TOKEN"


# 3. Create order WITH token (alice's order)
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 1, "qty": 2}'

# Response: 201, order created with username="alice"


# 4. Create order WITHOUT token → 403
curl -X POST http://127.0.0.1:8000/orders \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 1, "qty": 2}'

# Response: 403 Forbidden


# 5. Register bob, login bob, create bob's order
BOB_TOKEN=$(curl -X POST http://127.0.0.1:8000/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "bob", "password": "bob123"}' | jq -r .access_token)

curl -X POST http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer $BOB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"item_id": 3, "qty": 3}'


# 6. Alice lists orders (should only see alice's order, not bob's)
curl http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer $TOKEN"

# Response: {"orders": [{"id": 1, "username": "alice", ...}]}  (only alice's)


# 7. Use EXPIRED token (manually create one with exp in past, or wait 1 hour)
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTAwMDAwMDAwMH0.sig"

curl http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer $EXPIRED_TOKEN"

# Response: 401 Unauthorized, {"detail": "Token expired"}


# 8. Use TAMPERED token (change payload, signature won't match)
curl http://127.0.0.1:8000/orders \\
  -H "Authorization: Bearer invalid-token"

# Response: 401 Unauthorized, {"detail": "Invalid token"}


# ✅ Auth system complete: register, login, JWT issuance, protected routes, per-user data.`}
        />
        <ol start={9} className="ml-6 list-decimal space-y-2 text-sm text-slate-300">
          <li>
            Verify all three 401 scenarios: no token (403 from HTTPBearer), invalid token (401 Invalid token), expired token (401 Token expired).
          </li>
          <li>
            Add CORS middleware if you build a frontend (React app calling the API).
          </li>
        </ol>
      </Section>

      {/* 13 */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Authentication vs Authorization", "Authn = who are you? (verify identity). Authz = what can you do? (check permissions)."],
            ["NEVER store plaintext passwords", "Use bcrypt.hashpw(password, bcrypt.gensalt()) on register, bcrypt.checkpw(input, stored_hash) on login."],
            ["bcrypt auto-salts", "Same password → different hashes each time. Defeats rainbow tables."],
            ["JWT structure", "header.payload.signature (dot-separated base64). Payload is readable, signature prevents tampering."],
            ["JWT claims", '{sub: "username", exp: timestamp} — sub = subject (user ID), exp = expiry (Unix timestamp).'],
            ["JWT is signed, not encrypted", "Anyone can decode payload (base64). SECRET_KEY signature proves authenticity, not secrecy."],
            ["Login flow", "POST /login → verify password → jwt.encode(payload, SECRET_KEY) → return {access_token, token_type}."],
            ["Protected route pattern", "def route(user: str = Depends(get_current_user)) → FastAPI extracts/verifies JWT, injects username."],
            ["get_current_user", "Depends(HTTPBearer) → extract token → jwt.decode(SECRET_KEY) → handle ExpiredSignatureError, InvalidTokenError → return username."],
            ["CORS for browser", "app.add_middleware(CORSMiddleware, allow_origins=[frontend_url], allow_credentials=True)."],
            ["401 vs 403", "401 = auth failed (no/invalid token). 403 = authn succeeded, authz failed (no permission)."],
            ["Security checklist", "HTTPS, env SECRET_KEY, bcrypt passwords, JWT expiry, parameterized SQL, Pydantic validation, rate limiting, no debug=True."],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
