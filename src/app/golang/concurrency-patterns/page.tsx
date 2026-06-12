"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Worker Pool — Live",
  nodes: [
    { id: "producer", icon: "🏭", label: "Producer", sub: "generates jobs", x: 8, y: 40, color: "#22d3ee" },
    { id: "jobs", icon: "📋", label: "Jobs Queue", sub: "buffered chan", x: 28, y: 40, color: "#fbbf24" },
    { id: "w1", icon: "👷", label: "Worker 1", sub: "processing", x: 50, y: 18, color: "#60a5fa" },
    { id: "w2", icon: "👷", label: "Worker 2", sub: "idle → grabs job", x: 50, y: 42, color: "#34d399" },
    { id: "w3", icon: "👷", label: "Worker 3", sub: "processing", x: 50, y: 66, color: "#a78bfa" },
    { id: "results", icon: "✅", label: "Results", sub: "buffered chan", x: 75, y: 40, color: "#f472b6" },
    { id: "ctx", icon: "🛑", label: "Context", sub: "cancel signal", x: 28, y: 75, color: "#f87171" },
  ],
  edges: [
    { id: "prod-jobs", from: "producer", to: "jobs", color: "#fbbf24" },
    { id: "jobs-w1", from: "jobs", to: "w1", color: "#60a5fa" },
    { id: "jobs-w2", from: "jobs", to: "w2", color: "#34d399" },
    { id: "jobs-w3", from: "jobs", to: "w3", color: "#a78bfa" },
    { id: "w1-results", from: "w1", to: "results", color: "#60a5fa" },
    { id: "w2-results", from: "w2", to: "results", color: "#34d399" },
    { id: "w3-results", from: "w3", to: "results", color: "#a78bfa" },
    { id: "ctx-w1", from: "ctx", to: "w1", dashed: true, color: "#f87171" },
    { id: "ctx-w2", from: "ctx", to: "w2", dashed: true, color: "#f87171" },
    { id: "ctx-w3", from: "ctx", to: "w3", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "distribute",
      name: "📋 Jobs distributed",
      command: "producer floods queue → workers compete to grab",
      steps: [
        { node: "producer", paths: ["prod-jobs"], text: "Producer sends 100 jobs to buffered channel. First N fit in buffer, rest block until workers drain." },
        { node: "w1", paths: ["jobs-w1", "w1-results"], text: "Worker 1 grabs job #1, processes, sends result. Then loops back to grab the next job from queue." },
        { node: "w2", paths: ["jobs-w2", "w2-results"], text: "Worker 2 idle → grabs job #2. All workers compete for the same jobs channel — scheduler fairly distributes. 📋" },
      ],
    },
    {
      id: "slow-worker",
      name: "🐢 One worker slow",
      command: "worker 3 stuck on slow job → others keep draining",
      steps: [
        { node: "w3", paths: ["jobs-w3"], text: "Worker 3 gets a slow job (10s processing). Blocks on that job…" },
        { node: "w1", paths: ["jobs-w1", "w1-results"], text: "Worker 1 & 2 keep draining the queue. They don't wait for Worker 3 — concurrency wins!" },
        { node: "w3", paths: ["w3-results"], text: "Worker 3 finishes eventually, grabs the next job. Pool throughput = sum of all workers. 🐢" },
      ],
    },
    {
      id: "cancel",
      name: "🛑 Context cancel stops all",
      command: "ctx.cancel() → workers exit gracefully",
      steps: [
        { node: "ctx", paths: ["ctx-w1", "ctx-w2", "ctx-w3"], text: "Context canceled (timeout, user interrupt, etc.). Cancel signal propagates to all workers." },
        { node: "w1", paths: [], text: "Workers check ctx.Done() in their select. Receive cancel → break loop, cleanup, exit." },
        { node: "results", paths: [], text: "Main drains results channel, closes everything. Clean shutdown — no goroutine leaks. 🛑" },
      ],
    },
  ],
};

const NAV = [
  { id: "select", label: "Select — The Channel Switchboard ⭐" },
  { id: "timeout", label: "Timeouts with time.After" },
  { id: "waitgroup", label: "sync.WaitGroup ⭐" },
  { id: "worker-pool", label: "Worker Pool Pattern ⭐" },
  { id: "fan", label: "Fan-out / Fan-in" },
  { id: "mutex", label: "sync.Mutex & Race Conditions" },
  { id: "context", label: "context.Context Cancellation ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoConcurrencyPatternsPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Concurrency Patterns"
      gradientWord="Concurrency"
      subtitle="Select multiplexes channels, WaitGroup counts goroutines, worker pools parallelize work, mutexes guard shared state, and context.Context propagates cancellation. These are the building blocks of robust concurrent Go: timeouts, fan-out/fan-in, race detection with go run -race, and clean shutdown trees."
      nav={NAV}
      badges={["🎛️ Select", "👷 Worker pools", "🛑 Context trees"]}
      next={{ icon: "📦", label: "Packages & Modules", href: "/golang/packages-modules" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="select" number="01" title="Select — The Channel Switchboard ⭐">
        <CodeBlock
          title="select_basics.txt"
          runnable={false}
          code={`select is Go's channel multiplexer:
┌─────────────────────────────────────┐
│ select {                            │
│   case msg := <-ch1:  ← ready?      │
│     handle(msg)                     │
│   case ch2 <- val:    ← can send?   │
│     log("sent")                     │
│   default:            ← none ready  │
│     fallback()                      │
│ }                                   │
└─────────────────────────────────────┘
blocks until ONE case is ready. if multiple ready → random pick.
default = non-blocking (runs if all cases block). 🎛️`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "one"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "two"
    }()

    // wait for EITHER channel (whichever is ready first)
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("received:", msg1)
        case msg2 := <-ch2:
            fmt.Println("received:", msg2)
        }
    }
}`}
          output={`received: one
received: two`}
        />
        <Callout type="analogy">
          🎛️ Select is a switchboard operator: you plug into multiple lines (channels), and the
          operator connects you to whichever one rings first. Unlike if-else, select can wait on ALL
          channels simultaneously.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="timeout" number="02" title="Timeouts with time.After — Don&apos;t Wait Forever">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "time"
)

func main() {
    ch := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        ch <- "result"
    }()

    select {
    case res := <-ch:
        fmt.Println("got:", res)
    case <-time.After(1 * time.Second):  // timeout channel
        fmt.Println("timeout after 1s")
    }
}`}
          output={`timeout after 1s`}
        />
        <P>
          <IC>time.After(d)</IC> returns a channel that receives after duration <IC>d</IC>. In a
          select, it acts as a deadline: if the main channel doesn&apos;t respond in time, the
          timeout case fires. Essential for network calls, database queries, or any blocking
          operation that might hang.
        </P>
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "time"
)

func fetch(url string) <-chan string {
    ch := make(chan string)
    go func() {
        time.Sleep(500 * time.Millisecond)  // simulate network
        ch <- "data from " + url
    }()
    return ch
}

func main() {
    ch := fetch("https://api.example.com")
    select {
    case data := <-ch:
        fmt.Println(data)
    case <-time.After(1 * time.Second):
        fmt.Println("request timeout")
    }
}`}
          output={`data from https://api.example.com`}
        />
      </Section>

      {/* 03 */}
      <Section id="waitgroup" number="03" title="sync.WaitGroup — Counting Goroutines ⭐">
        <CodeBlock
          title="waitgroup_counter.txt"
          runnable={false}
          code={`WaitGroup = counter for "how many goroutines are running?"
┌───────────────────────────────┐
│ var wg sync.WaitGroup         │
│ wg.Add(1)      counter++      │
│ wg.Done()      counter--      │
│ wg.Wait()      block til 0    │
└───────────────────────────────┘
main spawns N goroutines → wg.Add(N) → wg.Wait() blocks until
all call wg.Done(). The "join" primitive. 🔢`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()  // decrement counter when done
    fmt.Printf("worker %d starting\\n", id)
    time.Sleep(time.Second)
    fmt.Printf("worker %d done\\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 3; i++ {
        wg.Add(1)  // increment counter BEFORE spawning
        go worker(i, &wg)
    }

    wg.Wait()  // blocks until counter = 0
    fmt.Println("all workers finished")
}`}
          output={`worker 3 starting
worker 1 starting
worker 2 starting
worker 1 done
worker 2 done
worker 3 done
all workers finished`}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: <IC>wg.Add(1)</IC> INSIDE the goroutine. Race condition — main might
          call <IC>wg.Wait()</IC> before the goroutine runs <IC>Add</IC>. Always <IC>Add</IC> in the
          PARENT before spawning.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="worker-pool" number="04" title="Worker Pool Pattern — Parallel Job Processing ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {  // drain jobs until channel closed
        fmt.Printf("worker %d processing job %d\\n", id, job)
        time.Sleep(500 * time.Millisecond)  // simulate work
        results <- job * 2
    }
    fmt.Printf("worker %d exiting\\n", id)
}

func main() {
    const numJobs = 5
    const numWorkers = 3

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    var wg sync.WaitGroup

    // spawn workers
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)  // signal: no more jobs

    // wait for workers to finish
    wg.Wait()
    close(results)

    // collect results
    for res := range results {
        fmt.Println("result:", res)
    }
}`}
          output={`worker 1 processing job 1
worker 2 processing job 2
worker 3 processing job 3
worker 1 processing job 4
worker 2 processing job 5
worker 1 exiting
worker 3 exiting
worker 2 exiting
result: 2
result: 4
result: 6
result: 8
result: 10`}
        />
        <CodeBlock
          title="worker_pool_flow.txt"
          runnable={false}
          code={`producer → [jobs chan] → worker1 → [results chan] → collector
                      ↓         worker2 →        ↑
                      ↓         worker3 →        ↑
                      └─────────────────────────┘

1. spawn N workers, all reading from SAME jobs channel
2. producer sends jobs, closes channel when done
3. workers compete for jobs (scheduler distributes)
4. each worker sends results to results channel
5. WaitGroup tracks workers, main waits, closes results
6. collector drains results

throughput scales with worker count (up to CPU cores). 👷`}
        />
        <Callout type="tip">
          💡 Worker pool is Go&apos;s answer to thread pools. No manual thread management — just
          spawn goroutines and let the scheduler handle it. Typical pattern: jobs channel (buffered
          or unbuffered), N workers, WaitGroup, results channel.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="fan" number="05" title="Fan-out / Fan-in — Splitting & Merging">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "sync"
)

func fanOut(input <-chan int, n int) []<-chan int {
    // fan-out: 1 input → N outputs (duplicate to N workers)
    channels := make([]<-chan int, n)
    for i := 0; i < n; i++ {
        ch := make(chan int)
        channels[i] = ch
        go func(out chan int) {
            for val := range input {
                out <- val * 2  // each worker doubles
            }
            close(out)
        }(ch)
    }
    return channels
}

func fanIn(channels []<-chan int) <-chan int {
    // fan-in: N inputs → 1 output (merge)
    out := make(chan int)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                out <- val
            }
        }(ch)
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}

func main() {
    input := make(chan int)
    go func() {
        for i := 1; i <= 5; i++ {
            input <- i
        }
        close(input)
    }()

    workers := fanOut(input, 3)  // 3 parallel processors
    merged := fanIn(workers)     // merge results

    for result := range merged {
        fmt.Println(result)
    }
}`}
          output={`2
4
6
8
10`}
        />
        <P>
          Fan-out: split one stream into N parallel workers. Fan-in: merge N streams into one.
          Together: parallelize processing (fan-out), then consolidate results (fan-in). Common in
          map-reduce, multi-stage pipelines, aggregating microservice calls.
        </P>
      </Section>

      {/* 06 */}
      <Section id="mutex" number="06" title="sync.Mutex & Race Conditions — Shared State Protection">
        <CodeBlock
          title="race_condition.go"
          code={`package main

import (
    "fmt"
    "sync"
)

var counter int  // shared variable

func increment(wg *sync.WaitGroup) {
    defer wg.Done()
    for i := 0; i < 1000; i++ {
        counter++  // ⚠️ RACE: read-modify-write not atomic
    }
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go increment(&wg)
    }
    wg.Wait()
    fmt.Println("counter:", counter)  // expected 5000, probably less
}`}
          output={`counter: 3421`}
        />
        <CodeBlock
          title="race_output.sh"
          code={`go run -race race_condition.go`}
          output={`==================
WARNING: DATA RACE
Read at 0x... by goroutine 7:
  main.increment()
      race_condition.go:12 +0x3c

Previous write at 0x... by goroutine 6:
  main.increment()
      race_condition.go:12 +0x50
==================
counter: 3189
Found 1 data race(s)`}
          error={true}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "sync"
)

var counter int
var mu sync.Mutex  // ✅ mutex protects counter

func increment(wg *sync.WaitGroup) {
    defer wg.Done()
    for i := 0; i < 1000; i++ {
        mu.Lock()
        counter++
        mu.Unlock()
    }
}

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go increment(&wg)
    }
    wg.Wait()
    fmt.Println("counter:", counter)  // always 5000
}`}
          output={`counter: 5000`}
        />
        <Callout type="tip">
          💡 <IC>go run -race</IC> enables Go&apos;s race detector — it instruments memory accesses
          and reports concurrent read/write to the same variable. ALWAYS run tests with{" "}
          <IC>-race</IC> before deploying concurrent code. Mutexes fix races, but channels are often
          cleaner (&quot;share memory by communicating&quot;).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="context" number="07" title="context.Context — Cancellation Trees ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():  // parent canceled
            fmt.Printf("worker %d canceled: %v\\n", id, ctx.Err())
            return
        default:
            fmt.Printf("worker %d working...\\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()  // always call cancel to free resources

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    time.Sleep(3 * time.Second)  // let timeout fire
    fmt.Println("main exiting")
}`}
          output={`worker 1 working...
worker 2 working...
worker 3 working...
worker 1 working...
worker 2 working...
worker 3 working...
worker 1 working...
worker 2 working...
worker 3 working...
worker 1 canceled: context deadline exceeded
worker 2 canceled: context deadline exceeded
worker 3 canceled: context deadline exceeded
main exiting`}
        />
        <CodeBlock
          title="context_tree.txt"
          runnable={false}
          code={`context forms a TREE:
┌──────────────────────────────────────┐
│ context.Background() (root)          │
│   └─ WithTimeout (2s)                │
│        ├─ worker 1                   │
│        ├─ worker 2                   │
│        └─ worker 3                   │
└──────────────────────────────────────┘
cancel the parent → all children get ctx.Done() signal.
WithTimeout: auto-cancel after duration.
WithCancel: manual cancel() call.
WithDeadline: cancel at specific time. 🛑`}
        />
        <Table
          head={["Function", "Trigger", "Use case"]}
          rows={[
            ["WithCancel(parent)", "manual cancel()", "user clicks stop, request aborted"],
            ["WithTimeout(parent, d)", "duration elapses", "API call max 5s, batch job 1h limit"],
            ["WithDeadline(parent, t)", "specific time reached", "daily report cutoff at midnight"],
            ["WithValue(parent, k, v)", "N/A (carries data)", "request ID, auth token (use sparingly)"],
          ]}
        />
        <Callout type="tip">
          💡 Context is Go&apos;s standard cancellation mechanism. Every long-running function should
          accept <IC>ctx context.Context</IC> as first param. Propagate it through layers — DB
          queries, HTTP clients, gRPC all respect ctx.Done(). Graceful shutdown = cancel root
          context.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["select", "multiplexes channels — blocks til one ready, random if multiple ready"],
            ["time.After(d)", "returns chan that receives after d — use in select for timeouts"],
            ["sync.WaitGroup", "wg.Add(1) before spawn, wg.Done() when done, wg.Wait() blocks til 0"],
            ["Worker pool", "N workers drain jobs chan, send to results chan, WaitGroup coordinates"],
            ["Fan-out/Fan-in", "fan-out: 1→N parallel workers · fan-in: N→1 merge results"],
            ["sync.Mutex", "mu.Lock() / mu.Unlock() — guards shared state, prevents races"],
            ["go run -race", "enables race detector — catches concurrent read/write bugs"],
            ["context.Context", "ctx.Done() for cancellation trees, WithTimeout/WithCancel/WithDeadline"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
