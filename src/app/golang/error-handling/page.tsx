"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Error Bubble vs Panic Unwind — Live",
  nodes: [
    { id: "main", icon: "🎯", label: "main()", sub: "top of stack", x: 10, y: 20, color: "#22d3ee" },
    { id: "service", icon: "⚙️", label: "Service", sub: "business logic", x: 35, y: 30, color: "#a78bfa" },
    { id: "repo", icon: "📦", label: "Repository", sub: "data layer", x: 60, y: 45, color: "#fbbf24" },
    { id: "db", icon: "🗄️", label: "Database", sub: "I/O boundary", x: 85, y: 60, color: "#34d399" },
    { id: "errchain", icon: "🔗", label: "Error Chain", sub: "wrapped context", x: 50, y: 80, color: "#fb923c" },
    { id: "panic", icon: "💥", label: "Panic!", sub: "stack unwinding", x: 10, y: 75, color: "#f87171" },
  ],
  edges: [
    { id: "main-service", from: "main", to: "service", color: "#a78bfa" },
    { id: "service-repo", from: "service", to: "repo", color: "#fbbf24" },
    { id: "repo-db", from: "repo", to: "db", color: "#34d399" },
    { id: "db-errchain", from: "db", to: "errchain", color: "#fb923c" },
    { id: "errchain-repo", from: "errchain", to: "repo", dashed: true, color: "#fb923c" },
    { id: "errchain-service", from: "errchain", to: "service", dashed: true, bend: -30, color: "#fb923c" },
    { id: "errchain-main", from: "errchain", to: "main", dashed: true, bend: -40, color: "#fb923c" },
    { id: "panic-unwind", from: "db", to: "panic", color: "#f87171" },
  ],
  flows: [
    {
      id: "bubble",
      name: "🔗 Error wrapped & bubbled",
      command: "db fails → wrap context at each layer → handle at top",
      steps: [
        { node: "db", paths: ["repo-db"], text: "DB connection fails: sql.ErrConnDone. This is a VALUE, not an exception — returned normally." },
        { node: "repo", paths: ["db-errchain", "errchain-repo"], text: "Repo wraps: fmt.Errorf(\"fetch user %d: %w\", id, err). The %w preserves the original for errors.Is checks later." },
        { node: "service", paths: ["errchain-service"], text: "Service wraps: fmt.Errorf(\"login failed: %w\", err). Each layer adds its OWN context. The chain grows." },
        { node: "main", paths: ["errchain-main"], text: "main() checks errors.Is(err, sql.ErrConnDone) — finds the sentinel DEEP in the chain. Logs full context, returns 503. 🔗" },
      ],
    },
    {
      id: "is-check",
      name: "🔍 errors.Is finds sentinel",
      command: "errors.Is walks the %w chain to find the root cause",
      steps: [
        { node: "errchain", paths: ["db-errchain"], text: "Error chain: 'login failed: fetch user 42: connection done'. Three layers of wrapping." },
        { node: "errchain", paths: [], text: "errors.Is(err, sql.ErrConnDone) unwraps: login → fetch → connection. Compares each. Match found!" },
        { node: "main", paths: ["errchain-main"], text: "Decision: if DB error → retry with backoff. If auth error → 401. errors.Is/As let you branch on ROOT cause, not string parsing. 🔍" },
      ],
    },
    {
      id: "panic-recover",
      name: "💥 Panic + recover",
      command: "panic() unwinds stack → defer+recover catches it",
      steps: [
        { node: "db", paths: ["panic-unwind"], text: "Unrecoverable: out-of-bounds, nil deref, or explicit panic(). Stack unwinds — NO normal returns." },
        { node: "panic", paths: [], text: "Deferred functions run during unwind (LIFO). A defer with recover() can CATCH the panic like try/catch." },
        { node: "main", paths: [], text: "defer in main(): if r := recover(); r != nil { log fatal, exit gracefully }. Panic = programmer error OR truly unrecoverable. 💥" },
      ],
    },
  ],
};

const NAV = [
  { id: "values", label: "Errors Are Values ⭐" },
  { id: "ritual", label: "The if err != nil Ritual" },
  { id: "create", label: "Creating Errors" },
  { id: "sentinel", label: "Sentinel Errors" },
  { id: "wrapping", label: "Wrapping with %w ⭐" },
  { id: "is-as", label: "errors.Is & errors.As ⭐" },
  { id: "panic", label: "Panic & Recover" },
  { id: "when", label: "When to Panic vs Return" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoErrorHandlingPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Error Handling"
      gradientWord="Error Handling"
      subtitle="Go has no try/catch — errors are VALUES returned explicitly. The 'if err != nil' ritual is verbose but honest. Wrapping chains errors with context, errors.Is/As decode them, and panic is reserved for the truly unrecoverable. It&apos;s not exceptions, it&apos;s contracts."
      nav={NAV}
      badges={["⚠️ Values not throws", "🔗 Error chains", "💥 Panic = rare"]}
      next={{ icon: "🔀", label: "Goroutines & Channels", href: "/golang/goroutines-channels" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="values" number="01" title="Errors Are Values — Not Exceptions ⭐">
        <CodeBlock
          title="errors_vs_exceptions.txt"
          runnable={false}
          code={`Java/Python world            Go world
┌────────────────┐           ┌────────────────┐
│ try {          │           │ result, err := │
│   doThing()    │           │   doThing()    │
│ } catch (E e) {│           │ if err != nil {│
│   handle(e)    │           │   handle(err)  │
│ }              │           │ }              │
└────────────────┘           └────────────────┘
   invisible!                  explicit contract
   control flow                part of signature
   jumps to catch              caller MUST check

Go philosophy: errors are EXPECTED outcomes, not exceptional.
File-not-found? That's normal — return an error VALUE.
The caller decides what to do (retry, log, wrap, ignore).
No hidden control flow, no stack unwinding (except panic). ✅`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "os"
)

func main() {
    // Open returns (*File, error) — a PAIR, not a throw
    f, err := os.Open("missing.txt")
    if err != nil {
        fmt.Println("error:", err)  // handle it explicitly
        return
    }
    defer f.Close()
    fmt.Println("file opened")
}`}
          output={`error: open missing.txt: no such file or directory`}
        />
        <Callout type="analogy">
          🚦 Think traffic lights vs car crashes. Exceptions are crashes: rare, disruptive, unwind
          everything. Go errors are red lights: expected, handled in the flow. You don&apos;t THROW
          a red light — you see it, stop, and proceed accordingly.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="ritual" number="02" title="The if err != nil Ritual — Why It Exists">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "strconv"
)

func main() {
    // the pattern: every error-returning call checks immediately
    s := "42"
    n, err := strconv.Atoi(s)
    if err != nil {
        fmt.Println("parse error:", err)
        return
    }
    fmt.Println("parsed:", n)

    // chaining: next operation uses n only if no error
    doubled := n * 2
    fmt.Println("doubled:", doubled)
}`}
          output={`parsed: 42
doubled: 84`}
        />
        <CodeBlock
          title="error_at_each_step.go"
          code={`package main

import (
    "fmt"
    "os"
    "strconv"
)

func Process(filename string) error {
    data, err := os.ReadFile(filename)
    if err != nil {
        return err  // bubble up immediately
    }

    n, err := strconv.Atoi(string(data))
    if err != nil {
        return err  // another check, another return
    }

    fmt.Println("number:", n)
    return nil  // explicit success
}

func main() {
    if err := Process("number.txt"); err != nil {
        fmt.Println("failed:", err)
    }
}`}
          output={`failed: open number.txt: no such file or directory`}
        />
        <P>
          Yes, it&apos;s verbose. That&apos;s the point — error paths are VISIBLE. No hidden
          exceptions five frames up the stack. Every <IC>if err != nil</IC> is a decision point:
          wrap? log? retry? ignore? The explicitness is Go&apos;s philosophy: boring is reliable.
        </P>
        <Callout type="tip">
          💡 Idiomatic shorthand: <IC>if err := doThing(); err != nil &#123; … &#125;</IC> — declare
          and check in one line. The err variable is scoped to the if block, keeping the happy path
          clean.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="create" number="03" title="Creating Errors — errors.New & fmt.Errorf">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "errors"
    "fmt"
)

func Divide(a, b int) (int, error) {
    if b == 0 {
        // simple error: static string
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func Sqrt(x float64) (float64, error) {
    if x < 0 {
        // formatted error with context
        return 0, fmt.Errorf("sqrt of negative: %.2f", x)
    }
    return 0, nil  // dummy
}

func main() {
    _, err := Divide(10, 0)
    fmt.Println(err)

    _, err = Sqrt(-4.5)
    fmt.Println(err)
}`}
          output={`division by zero
sqrt of negative: -4.50`}
        />
        <Callout type="tip">
          💡 <IC>errors.New("msg")</IC> for static strings. <IC>fmt.Errorf("fmt %v", val)</IC> for
          dynamic context. The error interface is just <IC>type error interface &#123; Error()
          string &#125;</IC> — any type with that method IS an error.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="sentinel" number="04" title="Sentinel Errors — Predefined Constants">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "errors"
    "fmt"
    "io"
)

// sentinel: predefined error for specific conditions
var ErrNotFound = errors.New("item not found")

func Get(id int) (string, error) {
    if id == 0 {
        return "", ErrNotFound  // return the sentinel
    }
    return fmt.Sprintf("item-%d", id), nil
}

func main() {
    _, err := Get(0)
    if err == ErrNotFound {  // direct comparison works
        fmt.Println("handle not-found case specially")
    }

    // stdlib sentinels
    fmt.Println("io.EOF:", io.EOF)
    fmt.Println("os.ErrNotExist:", errors.New("file does not exist"))  // example
}`}
          output={`handle not-found case specially
io.EOF: EOF
os.ErrNotExist: file does not exist`}
        />
        <P>
          Sentinels are package-level <IC>var Errxxx = errors.New("…")</IC> constants. Callers check{" "}
          <IC>if err == ErrNotFound</IC> to branch on specific errors. Examples:{" "}
          <IC>io.EOF</IC>, <IC>os.ErrNotExist</IC>, <IC>sql.ErrNoRows</IC>. But wrapping breaks{" "}
          <IC>==</IC> — that&apos;s where <IC>errors.Is</IC> comes in (§06).
        </P>
      </Section>

      {/* 05 */}
      <Section id="wrapping" number="05" title="Wrapping Errors with %w — Building Context Chains ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "errors"
    "fmt"
)

var ErrDatabase = errors.New("database error")

func queryDB() error {
    return ErrDatabase  // low-level error
}

func fetchUser(id int) error {
    err := queryDB()
    if err != nil {
        // %w: wrap the original error, preserving it for errors.Is
        return fmt.Errorf("fetch user %d: %w", id, err)
    }
    return nil
}

func Login(user int) error {
    err := fetchUser(user)
    if err != nil {
        return fmt.Errorf("login failed: %w", err)  // wrap again
    }
    return nil
}

func main() {
    err := Login(42)
    if err != nil {
        fmt.Println(err)  // prints the full chain
        fmt.Println("unwrapped:", errors.Unwrap(err))
    }
}`}
          output={`login failed: fetch user 42: database error
unwrapped: fetch user 42: database error`}
        />
        <CodeBlock
          title="wrapping_chain.txt"
          runnable={false}
          code={`error wrapping builds a linked list:

┌─────────────────────────────────┐
│ "login failed: ..."             │  ← top-level context
│   wrapped: ──────────────┐      │
└──────────────────────────│──────┘
                           ▼
         ┌─────────────────────────────────┐
         │ "fetch user 42: ..."            │  ← middle layer
         │   wrapped: ──────────────┐      │
         └──────────────────────────│──────┘
                                    ▼
                  ┌─────────────────────────────────┐
                  │ ErrDatabase (sentinel)          │  ← root cause
                  └─────────────────────────────────┘

errors.Unwrap() walks the chain backward.
errors.Is() searches the chain for a specific sentinel. 🔗`}
        />
        <Callout type="tip">
          💡 <IC>%w</IC> vs <IC>%v</IC>: <IC>fmt.Errorf("msg: %w", err)</IC> wraps the error
          (preserves it for Is/As). <IC>%v</IC> just formats it as a string (loses the link). ALWAYS
          use <IC>%w</IC> when bubbling errors up — context without breaking the chain.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="is-as" number="06" title="errors.Is & errors.As — Unwrapping with Intelligence ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "errors"
    "fmt"
    "os"
)

var ErrRetryable = errors.New("retryable error")

func DoWork() error {
    err := ErrRetryable
    return fmt.Errorf("work failed: %w", err)  // wrapped
}

func main() {
    err := DoWork()

    // errors.Is: checks if err's chain contains ErrRetryable
    if errors.Is(err, ErrRetryable) {
        fmt.Println("retrying...")
    }

    // errors.As: extracts a specific error TYPE from the chain
    _, err2 := os.Open("missing")
    var pathErr *os.PathError
    if errors.As(err2, &pathErr) {
        fmt.Printf("path error: op=%s path=%s\\n", pathErr.Op, pathErr.Path)
    }
}`}
          output={`retrying...
path error: op=open path=missing`}
        />
        <Table
          head={["Function", "Use when", "Returns"]}
          rows={[
            ["errors.Is(err, target)", "checking for a sentinel (var Errxxx)", "true if target is in the chain"],
            ["errors.As(err, &var)", "extracting a custom error type", "true + fills var with the concrete type"],
            ["errors.Unwrap(err)", "manually walking the chain (rare)", "the wrapped error, or nil if none"],
          ]}
        />
        <CodeBlock
          title="custom_error_type.go"
          code={`package main

import (
    "errors"
    "fmt"
)

type ValidationError struct {
    Field string
    Issue string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Issue)
}

func Validate(age int) error {
    if age < 0 {
        err := &ValidationError{"age", "must be positive"}
        return fmt.Errorf("validation: %w", err)
    }
    return nil
}

func main() {
    err := Validate(-5)
    var vErr *ValidationError
    if errors.As(err, &vErr) {
        fmt.Printf("field %q failed: %s\\n", vErr.Field, vErr.Issue)
    }
}`}
          output={`field "age" failed: must be positive`}
        />
        <Callout type="tip">
          💡 errors.Is for sentinels (values), errors.As for custom types (structs). Is walks the
          chain with <IC>==</IC>, As walks with type assertions. Both make wrapped errors usable —
          you get the context AND the root cause.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="panic" number="07" title="Panic & Recover — Go&apos;s Emergency Brake">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func Crash() {
    panic("something is very wrong")  // unwinds the stack
}

func Safe() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered from:", r)
        }
    }()
    Crash()  // panics, but defer+recover catches it
    fmt.Println("this won't print")
}

func main() {
    Safe()
    fmt.Println("program continues")
}`}
          output={`recovered from: something is very wrong
program continues`}
        />
        <CodeBlock
          title="panic_without_recover.go"
          code={`package main

func main() {
    arr := []int{1, 2}
    _ = arr[10]  // out-of-bounds panic
    println("never reached")
}`}
          output={`panic: runtime error: index out of range [10] with length 2

goroutine 1 [running]:
main.main()
    main.go:5 +0x1c
exit status 2`}
          error={true}
        />
        <P>
          Panic stops normal execution and unwinds the stack, running deferred functions in LIFO
          order. <IC>recover()</IC> in a defer can catch it (like catch). But panics are for
          PROGRAMMER ERRORS (nil deref, out-of-bounds) or truly unrecoverable states — not business
          logic.
        </P>
      </Section>

      {/* 08 */}
      <Section id="when" number="08" title="When to Panic vs Return Error — The Decision Tree">
        <CodeBlock
          title="panic_vs_error.txt"
          runnable={false}
          code={`use PANIC when:                   use ERROR when:
✅ programmer mistake (bug)       ✅ expected failure (file missing)
✅ precondition violated          ✅ user input invalid
✅ can't proceed AT ALL           ✅ operation might fail normally
   (corrupted data structure)        (network timeout)
✅ library initialization fails   ✅ caller can decide to retry
   (must-have config missing)        or handle differently

examples:
  panic: accessing nil pointer, array out-of-bounds, type assertion
         failure (without comma-ok), init() failure, impossible state
  error: file not found, JSON parse failure, DB query timeout, auth
         rejection, validation failure

rule: panics cross API boundaries are rude. libraries should
      return errors; only main() or top-level handlers recover.`}
        />
        <Callout type="mistake">
          ⚠️ Don&apos;t panic for &quot;user entered bad email&quot; — that&apos;s an error. DO
          panic for &quot;invariant violated: queue length is negative&quot; — that&apos;s a bug
          that should crash immediately to prevent corruption.
        </Callout>
        <CodeBlock
          title="panic_in_init.go"
          code={`package main

import (
    "fmt"
    "os"
)

var config string

func init() {
    config = os.Getenv("REQUIRED_CONFIG")
    if config == "" {
        panic("REQUIRED_CONFIG not set")  // acceptable in init
    }
}

func main() {
    fmt.Println("config:", config)
}`}
          output={`panic: REQUIRED_CONFIG not set

goroutine 1 [running]:
main.init()
    main.go:12 +0x5c
exit status 2`}
          error={true}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Errors are values", "returned explicitly, not thrown — part of the function signature"],
            ["The ritual", "if err != nil { return err } — check immediately, bubble or handle"],
            ["errors.New", "errors.New(\"msg\") — simple static error"],
            ["fmt.Errorf", "fmt.Errorf(\"context: %w\", err) — wrap with %w to preserve chain"],
            ["Sentinel errors", "var ErrNotFound = errors.New(\"…\") — package constants for =="],
            ["errors.Is", "errors.Is(err, ErrRetryable) — finds sentinel in wrapped chain"],
            ["errors.As", "errors.As(err, &customErr) — extracts custom type from chain"],
            ["panic", "unwinds stack, runs defers — for bugs/unrecoverable, NOT business logic"],
            ["recover", "recover() in defer catches panic — use sparingly, top-level only"],
            ["panic vs error", "error = expected failure · panic = programmer mistake or impossible state"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
