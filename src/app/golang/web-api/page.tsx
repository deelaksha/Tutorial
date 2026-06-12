"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Request Through the Stack — Live",
  nodes: [
    { id: "client", icon: "🌐", label: "Client", sub: "curl/browser", x: 5, y: 40, color: "#22d3ee" },
    { id: "mux", icon: "🎛️", label: "ServeMux", sub: "router", x: 22, y: 40, color: "#fbbf24" },
    { id: "logmw", icon: "📝", label: "Logging MW", sub: "wraps next", x: 38, y: 20, color: "#a78bfa" },
    { id: "authmw", icon: "🔐", label: "Auth MW", sub: "checks token", x: 55, y: 20, color: "#fb923c" },
    { id: "handler", icon: "⚙️", label: "Handler", sub: "business logic", x: 72, y: 40, color: "#34d399" },
    { id: "store", icon: "💾", label: "Store", sub: "in-memory DB", x: 88, y: 40, color: "#60a5fa" },
    { id: "reject", icon: "🚫", label: "401 Reject", sub: "unauthorized", x: 55, y: 65, color: "#f87171" },
  ],
  edges: [
    { id: "client-mux", from: "client", to: "mux", color: "#fbbf24" },
    { id: "mux-logmw", from: "mux", to: "logmw", color: "#a78bfa" },
    { id: "logmw-authmw", from: "logmw", to: "authmw", color: "#fb923c" },
    { id: "authmw-handler", from: "authmw", to: "handler", color: "#34d399" },
    { id: "handler-store", from: "handler", to: "store", color: "#60a5fa" },
    { id: "store-handler", from: "store", to: "handler", dashed: true, color: "#60a5fa" },
    { id: "authmw-reject", from: "authmw", to: "reject", color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ GET happy path",
      command: "curl -H 'Authorization: Bearer token' /tasks",
      steps: [
        { node: "mux", paths: ["client-mux", "mux-logmw"], text: "ServeMux routes GET /tasks to the handler chain. Logging middleware wraps it — starts a timer." },
        { node: "authmw", paths: ["logmw-authmw"], text: "Auth middleware checks Authorization header. Token valid → calls next handler in chain." },
        { node: "handler", paths: ["authmw-handler", "handler-store", "store-handler"], text: "Handler fetches tasks from store, marshals to JSON, writes 200 response. Logging MW logs duration. ✅" },
      ],
    },
    {
      id: "reject",
      name: "🚫 Auth middleware rejects",
      command: "curl /tasks — no token → 401",
      steps: [
        { node: "mux", paths: ["client-mux", "mux-logmw", "logmw-authmw"], text: "Request reaches auth middleware. No Authorization header → invalid token." },
        { node: "reject", paths: ["authmw-reject"], text: "Auth MW writes 401 Unauthorized, returns. Handler NEVER runs — middleware short-circuits the chain." },
        { node: "logmw", paths: [], text: "Logging MW still logs the request (401 response). Middleware onion unwinds. 🚫" },
      ],
    },
    {
      id: "shutdown",
      name: "🛑 Graceful shutdown",
      command: "SIGINT → server.Shutdown(ctx) drains in-flight",
      steps: [
        { node: "mux", paths: [], text: "Server receives SIGINT (Ctrl+C). Stops accepting NEW requests, waits for in-flight to finish." },
        { node: "handler", paths: ["handler-store"], text: "Ongoing requests complete normally. Context with timeout ensures we don't wait forever (30s max)." },
        { node: "client", paths: [], text: "Server closes cleanly. No dropped requests, no half-written responses. Kubernetes-ready shutdown. 🛑" },
      ],
    },
  ],
};

const NAV = [
  { id: "http-handler", label: "net/http Handler Interface ⭐" },
  { id: "servemux", label: "ServeMux Routing (Go 1.22+)" },
  { id: "json", label: "JSON Encode/Decode + Struct Tags ⭐" },
  { id: "crud", label: "Full CRUD — /tasks API ⭐" },
  { id: "middleware", label: "Middleware Chain ⭐" },
  { id: "shutdown", label: "Graceful Shutdown" },
  { id: "docker", label: "Dockerfile — Multi-stage Build" },
  { id: "test", label: "Testing with curl" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoWebApiPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Build a REST API in Go"
      gradientWord="REST API"
      subtitle="CAPSTONE: net/http from zero. ServeMux routes, JSON marshal/unmarshal with struct tags, full CRUD for /tasks, middleware onion (logging + auth), graceful shutdown with context, and a multi-stage Dockerfile for a 10MB static binary. This is the Go backend interview."
      nav={NAV}
      badges={["🌐 net/http", "🔗 Middleware", "🐳 Docker"]}
      next={{ icon: "🎩", label: "Jenkins — CI/CD", href: "/jenkins" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="http-handler" number="01" title="net/http Handler Interface — The Foundation ⭐">
        <CodeBlock
          title="handler_interface.txt"
          runnable={false}
          code={`http.Handler interface (stdlib):
┌───────────────────────────────────────────────┐
│ type Handler interface {                      │
│   ServeHTTP(ResponseWriter, *Request)         │
│ }                                             │
└───────────────────────────────────────────────┘

ANY type with ServeHTTP() is a handler.
ResponseWriter: write response (headers + body)
*Request: read request (method, URL, headers, body)

HandlerFunc adapter: turns func into Handler (syntactic sugar). 🎯`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "net/http"
)

// method 1: implement Handler interface
type HelloHandler struct{}

func (h HelloHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

// method 2: use HandlerFunc (easier for simple handlers)
func greet(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hi from HandlerFunc")
}

func main() {
    mux := http.NewServeMux()
    mux.Handle("/hello/", HelloHandler{})
    mux.HandleFunc("/greet", greet)  // wraps func as Handler

    http.ListenAndServe(":8080", mux)
}`}
        />
        <Callout type="tip">
          💡 <IC>http.HandlerFunc(f)</IC> adapts a function to the Handler interface. So{" "}
          <IC>mux.HandleFunc("/path", f)</IC> is shorthand for{" "}
          <IC>mux.Handle("/path", http.HandlerFunc(f))</IC>. Use HandleFunc for simple handlers,
          implement ServeHTTP for stateful ones.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="servemux" number="02" title="ServeMux Routing — Go 1.22 Method + Path Patterns">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Go 1.22+: method + path patterns
    mux.HandleFunc("GET /tasks", listTasks)
    mux.HandleFunc("POST /tasks", createTask)
    mux.HandleFunc("GET /tasks/{id}", getTask)      // path parameter
    mux.HandleFunc("DELETE /tasks/{id}", deleteTask)

    http.ListenAndServe(":8080", mux)
}

func listTasks(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "list all tasks")
}

func createTask(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "create task")
}

func getTask(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")  // extract {id} from path
    fmt.Fprintf(w, "get task %s", id)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "delete task %s", id)
}`}
        />
        <Table
          head={["Pattern", "Matches", "r.PathValue"]}
          rows={[
            ["GET /tasks", "GET /tasks exactly", "N/A"],
            ["POST /tasks", "POST /tasks (method-specific)", "N/A"],
            ["GET /tasks/{id}", "GET /tasks/123, /tasks/abc", "id = \"123\" or \"abc\""],
            ["/tasks/{id...}", "/tasks/a/b/c (wildcard)", "id = \"a/b/c\""],
          ]}
        />
        <Callout type="tip">
          💡 Before Go 1.22: no method routing, no path params — people used{" "}
          <IC>chi</IC>/<IC>gorilla/mux</IC>. Since 1.22: ServeMux has built-in method + param
          support. For complex routing (regex, middleware per-route), libraries still help, but
          stdlib is now viable for most APIs.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="json" number="03" title="JSON Encode/Decode + Struct Tags ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
)

type Task struct {
    ID        int    \`json:"id"\`           // ESCAPE backticks in JSX!
    Title     string \`json:"title"\`
    Completed bool   \`json:"completed"\`
    private   string // unexported — NOT in JSON
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /tasks", getTasks)
    mux.HandleFunc("POST /tasks", createTask)
    http.ListenAndServe(":8080", mux)
}

func getTasks(w http.ResponseWriter, r *http.Request) {
    tasks := []Task{
        {ID: 1, Title: "Learn Go", Completed: false},
        {ID: 2, Title: "Build API", Completed: true},
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tasks)  // marshal + write
}

func createTask(w http.ResponseWriter, r *http.Request) {
    var task Task
    if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    defer r.Body.Close()

    task.ID = 3  // simulate DB insert
    log.Printf("created: %+v", task)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(task)
}`}
        />
        <CodeBlock
          title="curl_test.sh"
          code={`# GET /tasks
curl http://localhost:8080/tasks

# POST /tasks
curl -X POST http://localhost:8080/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Write tests","completed":false}'`}
          output={`[{"id":1,"title":"Learn Go","completed":false},{"id":2,"title":"Build API","completed":true}]

{"id":3,"title":"Write tests","completed":false}`}
        />
        <Callout type="tip">
          💡 Struct tags control JSON keys: <IC>\`json:"id"\`</IC> maps to <IC>"id"</IC> in JSON.{" "}
          <IC>\`json:"title,omitempty"\`</IC> omits if zero value. <IC>\`json:"-"\`</IC> never
          includes. Tags also work for <IC>xml</IC>, <IC>yaml</IC>, <IC>db</IC> (with ORMs).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="crud" number="04" title="Full CRUD — /tasks API Incrementally Built ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "encoding/json"
    "net/http"
    "strconv"
    "sync"
)

type Task struct {
    ID        int    \`json:"id"\`
    Title     string \`json:"title"\`
    Completed bool   \`json:"completed"\`
}

// in-memory store (replace with DB in production)
var (
    tasks  = make(map[int]Task)
    nextID = 1
    mu     sync.RWMutex  // guard concurrent access
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /tasks", listTasks)
    mux.HandleFunc("POST /tasks", createTask)
    mux.HandleFunc("GET /tasks/{id}", getTask)
    mux.HandleFunc("PUT /tasks/{id}", updateTask)
    mux.HandleFunc("DELETE /tasks/{id}", deleteTask)
    http.ListenAndServe(":8080", mux)
}

func listTasks(w http.ResponseWriter, r *http.Request) {
    mu.RLock()
    list := make([]Task, 0, len(tasks))
    for _, t := range tasks {
        list = append(list, t)
    }
    mu.RUnlock()
    respondJSON(w, http.StatusOK, list)
}

func createTask(w http.ResponseWriter, r *http.Request) {
    var task Task
    if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    mu.Lock()
    task.ID = nextID
    nextID++
    tasks[task.ID] = task
    mu.Unlock()
    respondJSON(w, http.StatusCreated, task)
}

func getTask(w http.ResponseWriter, r *http.Request) {
    id, _ := strconv.Atoi(r.PathValue("id"))
    mu.RLock()
    task, ok := tasks[id]
    mu.RUnlock()
    if !ok {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    respondJSON(w, http.StatusOK, task)
}

func updateTask(w http.ResponseWriter, r *http.Request) {
    id, _ := strconv.Atoi(r.PathValue("id"))
    var task Task
    if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    mu.Lock()
    task.ID = id
    tasks[id] = task
    mu.Unlock()
    respondJSON(w, http.StatusOK, task)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
    id, _ := strconv.Atoi(r.PathValue("id"))
    mu.Lock()
    delete(tasks, id)
    mu.Unlock()
    w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}`}
        />
      </Section>

      {/* 05 */}
      <Section id="middleware" number="05" title="Middleware Chain — Logging + Auth Onion ⭐">
        <CodeBlock
          title="middleware.txt"
          runnable={false}
          code={`middleware = handler wrapper (onion layers):
┌─────────────────────────────────────────────┐
│ logging MW                                  │
│   ├─ start timer                            │
│   ├─ call next handler ────┐                │
│   │   auth MW               │                │
│   │     ├─ check token      │                │
│   │     ├─ call next ─────┐ │                │
│   │     │   your handler  │ │                │
│   │     │     └─ respond  │ │                │
│   │     └─ (return) ◀─────┘ │                │
│   └─ log duration ◀──────────┘               │
└─────────────────────────────────────────────┘
middleware wraps handlers, can:
• inspect/modify request
• short-circuit (return early)
• inspect/modify response (via ResponseWriter wrapper) 🧅`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "log"
    "net/http"
    "time"
)

// middleware signature: takes handler, returns handler
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)  // call the next handler
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token != "Bearer secret" {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return  // short-circuit — next handler NOT called
        }
        next.ServeHTTP(w, r)
    })
}

func chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
    for i := len(mws) - 1; i >= 0; i-- {
        h = mws[i](h)
    }
    return h
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /tasks", listTasks)

    // wrap mux with middleware chain
    handler := chain(mux, loggingMiddleware, authMiddleware)
    http.ListenAndServe(":8080", handler)
}

func listTasks(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("[tasks]"))
}`}
        />
        <CodeBlock
          title="curl_test.sh"
          code={`# no auth → 401
curl http://localhost:8080/tasks

# with auth → 200
curl -H 'Authorization: Bearer secret' http://localhost:8080/tasks`}
          output={`unauthorized

[tasks]`}
        />
      </Section>

      {/* 06 */}
      <Section id="shutdown" number="06" title="Graceful Shutdown — Context-Driven Drain">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(2 * time.Second)  // simulate slow handler
        w.Write([]byte("done"))
    })

    srv := &http.Server{Addr: ":8080", Handler: mux}

    // channel for shutdown signal
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

    // run server in background
    go func() {
        log.Println("server starting on :8080")
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    <-stop  // block until signal (Ctrl+C)
    log.Println("shutting down gracefully...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("shutdown error:", err)
    }
    log.Println("server stopped")
}`}
        />
        <P>
          <IC>srv.Shutdown(ctx)</IC> stops accepting new requests, waits for in-flight to finish (up
          to ctx timeout). SIGINT/SIGTERM trigger shutdown — Kubernetes sends SIGTERM before killing
          pods. This pattern ensures zero dropped requests during deploy/restart.
        </P>
      </Section>

      {/* 07 */}
      <Section id="docker" number="07" title="Dockerfile — Multi-stage Build for Tiny Image">
        <CodeBlock
          title="Dockerfile"
          code={`# stage 1: build the binary
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api .

# stage 2: minimal runtime image
FROM scratch
COPY --from=builder /app/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]`}
        />
        <CodeBlock
          title="build_run.sh"
          code={`# build image
docker build -t go-api .

# run container
docker run -p 8080:8080 go-api

# check size
docker images go-api`}
          output={`[+] Building 12.3s (14/14) FINISHED
 => [builder 1/6] FROM golang:1.21-alpine
 ...
 => exporting to image                                          0.1s
Successfully tagged go-api:latest

REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
go-api       latest    abc123def456   10 seconds ago   8.2MB`}
        />
        <Callout type="tip">
          💡 Multi-stage Dockerfile: first stage (golang:alpine) builds the binary, second stage
          (scratch — empty image) copies ONLY the binary. Result: 8-10MB image vs 300MB+ with full
          Go toolchain. <IC>CGO_ENABLED=0</IC> makes a fully static binary (no libc dependency).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="test" number="08" title="Testing the API with curl — Full CRUD Flow">
        <CodeBlock
          title="test_api.sh"
          code={`# 1. create task
curl -X POST http://localhost:8080/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Learn Go","completed":false}'

# 2. list tasks
curl http://localhost:8080/tasks

# 3. get task by ID
curl http://localhost:8080/tasks/1

# 4. update task
curl -X PUT http://localhost:8080/tasks/1 \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Learn Go","completed":true}'

# 5. delete task
curl -X DELETE http://localhost:8080/tasks/1

# 6. verify deletion
curl http://localhost:8080/tasks/1`}
          output={`{"id":1,"title":"Learn Go","completed":false}

[{"id":1,"title":"Learn Go","completed":false}]

{"id":1,"title":"Learn Go","completed":false}

{"id":1,"title":"Learn Go","completed":true}

(empty 204 response)

not found`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["http.Handler", "interface { ServeHTTP(ResponseWriter, *Request) } — core contract"],
            ["ServeMux 1.22+", "mux.HandleFunc(\"GET /path/{id}\", fn) · r.PathValue(\"id\")"],
            ["JSON struct tags", "\\`json:\"field\"\\` maps to JSON key · ,omitempty skips zero values"],
            ["CRUD pattern", "GET list · POST create · GET {id} · PUT {id} update · DELETE {id}"],
            ["Middleware", "func(Handler) Handler wrapper — logging, auth, metrics onion"],
            ["Graceful shutdown", "srv.Shutdown(ctx) drains in-flight, respects context timeout"],
            ["Dockerfile multi-stage", "builder stage + scratch = <10MB static binary, no deps"],
            ["respondJSON helper", "w.Header().Set + w.WriteHeader + json.Encode — DRY pattern"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
