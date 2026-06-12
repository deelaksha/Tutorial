"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Channel Rendezvous — Live",
  nodes: [
    { id: "main", icon: "🎯", label: "main", sub: "spawns goroutines", x: 10, y: 30, color: "#22d3ee" },
    { id: "ga", icon: "🔵", label: "goroutine A", sub: "sender", x: 30, y: 15, color: "#60a5fa" },
    { id: "gb", icon: "🟢", label: "goroutine B", sub: "receiver", x: 30, y: 65, color: "#34d399" },
    { id: "chan", icon: "📬", label: "channel", sub: "typed pipe", x: 55, y: 40, color: "#fbbf24" },
    { id: "sched", icon: "⚙️", label: "scheduler", sub: "M:N multiplexer", x: 82, y: 25, color: "#a78bfa" },
    { id: "block", icon: "⏸️", label: "BLOCKED", sub: "waiting…", x: 82, y: 70, color: "#f87171" },
  ],
  edges: [
    { id: "main-ga", from: "main", to: "ga", color: "#60a5fa" },
    { id: "main-gb", from: "main", to: "gb", color: "#34d399" },
    { id: "ga-chan", from: "ga", to: "chan", color: "#fbbf24" },
    { id: "chan-gb", from: "chan", to: "gb", color: "#34d399" },
    { id: "ga-sched", from: "ga", to: "sched", dashed: true, color: "#a78bfa" },
    { id: "gb-sched", from: "gb", to: "sched", dashed: true, color: "#a78bfa" },
    { id: "chan-block", from: "chan", to: "block", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "unbuffered",
      name: "📬 Unbuffered handoff",
      command: "ch := make(chan int) — blocks until both ready",
      steps: [
        { node: "ga", paths: ["main-ga", "ga-chan"], text: "Goroutine A sends: ch <- 42. No buffer → blocks until someone receives." },
        { node: "gb", paths: ["main-gb", "chan-gb"], text: "Goroutine B receives: val := <-ch. Takes the value — A unblocks. Rendezvous!" },
        { node: "chan", paths: [], text: "Unbuffered = synchronization point. Both goroutines MEET at the channel. Like a baton handoff. 📬" },
      ],
    },
    {
      id: "buffered",
      name: "📦 Buffered queue",
      command: "ch := make(chan int, 3) — capacity 3",
      steps: [
        { node: "ga", paths: ["ga-chan"], text: "A sends 3 values: ch <- 1; ch <- 2; ch <- 3. All fit in buffer → A doesn't block." },
        { node: "chan", paths: ["chan-block"], text: "4th send: ch <- 4 → buffer full, A BLOCKS. Waiting for space…" },
        { node: "gb", paths: ["chan-gb"], text: "B receives one: <-ch. Buffer has space → A unblocks, sends 4. Queue behavior. 📦" },
      ],
    },
    {
      id: "deadlock",
      name: "💀 Deadlock — all blocked",
      command: "fatal error: all goroutines are asleep",
      steps: [
        { node: "main", paths: ["main-ga"], text: "main() sends on unbuffered channel: ch <- 10. No receiver yet → main blocks." },
        { node: "block", paths: ["chan-block"], text: "No other goroutines running. main is blocked, waiting for… no one. Deadlock detected!" },
        { node: "block", paths: [], text: "Runtime panics: 'fatal error: all goroutines are asleep - deadlock!'. This is a BUG caught at runtime. 💀" },
      ],
    },
  ],
};

const NAV = [
  { id: "goroutines", label: "Goroutines — Lightweight Threads ⭐" },
  { id: "channels", label: "Channels — Typed Pipes ⭐" },
  { id: "unbuffered", label: "Unbuffered = Rendezvous" },
  { id: "buffered", label: "Buffered Channels" },
  { id: "close-range", label: "Close & Range Over Channels" },
  { id: "comma-ok", label: "Comma-ok Receive" },
  { id: "deadlock", label: "Deadlock Anatomy ⭐" },
  { id: "directional", label: "Directional Channels" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoGoroutinesChannelsPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Goroutines & Channels"
      gradientWord="Goroutines"
      subtitle="Goroutines are 2KB stacklets multiplexed onto OS threads by Go&apos;s M:N scheduler. Channels are typed pipes for safe communication. Unbuffered channels synchronize, buffered ones queue. The 'go' keyword spawns, close() signals done, and deadlock detection saves you from hung programs."
      nav={NAV}
      badges={["🔀 M:N scheduler", "📬 CSP model", "💀 Deadlock detection"]}
      next={{ icon: "🎭", label: "Concurrency Patterns", href: "/golang/concurrency-patterns" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="goroutines" number="01" title="Goroutines — Lightweight Threads ⭐">
        <CodeBlock
          title="os_thread_vs_goroutine.txt"
          runnable={false}
          code={`OS Thread                    Goroutine
┌──────────────────┐         ┌──────────────────┐
│ 1-2 MB stack     │         │ 2 KB initial     │
│ (fixed)          │         │ (grows to ~1GB)  │
├──────────────────┤         ├──────────────────┤
│ kernel managed   │         │ Go runtime mgmt  │
│ context switch   │         │ cheap switch     │
│ ~1-10 µs         │         │ ~200 ns          │
├──────────────────┤         ├──────────────────┤
│ 1:1 mapping to   │         │ M:N — many       │
│ hardware thread  │         │ goroutines on    │
│                  │         │ few OS threads   │
└──────────────────┘         └──────────────────┘

You can spawn 100k goroutines on a laptop. Try that with
pthreads and watch the OOM killer. Go's scheduler magic. ✨`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "time"
)

func say(s string) {
    for i := 0; i < 3; i++ {
        time.Sleep(100 * time.Millisecond)
        fmt.Println(s, i)
    }
}

func main() {
    go say("world")  // spawns a goroutine — runs concurrently
    say("hello")     // main goroutine continues
    time.Sleep(500 * time.Millisecond)  // wait for goroutine to finish
}`}
          output={`hello 0
world 0
hello 1
world 1
hello 2
world 2`}
        />
        <Callout type="tip">
          💡 The <IC>go</IC> keyword spawns a goroutine. It&apos;s just{" "}
          <IC>go functionCall()</IC> — the call runs asynchronously. But: if main() exits, ALL
          goroutines die immediately, even if they&apos;re mid-work. Channels and sync.WaitGroup
          (next topic) coordinate lifetimes.
        </Callout>
        <Callout type="mistake">
          ⚠️ Beginner trap: <IC>go say("hi"); println("done")</IC> → &quot;done&quot; prints, main
          exits, goroutine never runs. main() is not special — if it returns, the process ends. Use
          channels or WaitGroup to wait.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="channels" number="02" title="Channels — Typed Pipes for Goroutine Communication ⭐">
        <CodeBlock
          title="channel_basics.txt"
          runnable={false}
          code={`channel = typed, thread-safe queue
┌─────────────────────────────────────────┐
│  goroutine A            goroutine B     │
│      │                       ▲          │
│      │ ch <- value           │          │
│      └─────────▶ [chan] ─────┘          │
│                   ╲ ╱                   │
│                    ╳  type-safe pipe    │
│                   ╱ ╲  (int, string…)   │
└─────────────────────────────────────────┘

send:    ch <- value
receive: value := <-ch  (or just <-ch to discard)
make:    ch := make(chan Type)       unbuffered
         ch := make(chan Type, cap)  buffered

"Don't communicate by sharing memory; share memory by
communicating." — Go proverb 📬`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func sum(nums []int, result chan int) {
    total := 0
    for _, n := range nums {
        total += n
    }
    result <- total  // send to channel
}

func main() {
    nums := []int{1, 2, 3, 4, 5, 6}
    ch := make(chan int)

    go sum(nums[:3], ch)  // [1,2,3]
    go sum(nums[3:], ch)  // [4,5,6]

    x, y := <-ch, <-ch  // receive twice
    fmt.Println("sums:", x, y, "total:", x+y)
}`}
          output={`sums: 6 15 total: 21`}
        />
        <P>
          Channels solve the data race problem: instead of both goroutines mutating a shared
          variable (needs locks), one sends, the other receives. The channel itself is thread-safe.
          Clean concurrency with no explicit mutexes.
        </P>
      </Section>

      {/* 03 */}
      <Section id="unbuffered" number="03" title="Unbuffered Channels = Synchronization Point">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "time"
)

func worker(done chan bool) {
    fmt.Println("working...")
    time.Sleep(1 * time.Second)
    fmt.Println("done")
    done <- true  // send: blocks until main receives
}

func main() {
    done := make(chan bool)  // unbuffered
    go worker(done)
    <-done  // receive: blocks until worker sends
    fmt.Println("main exits")
}`}
          output={`working...
done
main exits`}
        />
        <CodeBlock
          title="unbuffered_sync.txt"
          runnable={false}
          code={`unbuffered channel: sender & receiver MEET

time ──▶
worker:  ────────[working]────────┐ send blocks
                                  ▼
                              ch <- true  ⏸️ waiting…
main:    ────────[spawned]─────────────┐
                                       ▼
                                   <-ch  ✅ receives, both unblock

It's a HANDOFF. Neither proceeds until both are ready.
Like passing a baton in a relay race. 🤝`}
        />
        <Callout type="analogy">
          🤝 Unbuffered channel = phone call. You say something (send), the other person must be
          listening (receive) RIGHT NOW, or you both wait. Buffered = voicemail (messages queue up).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="buffered" number="04" title="Buffered Channels — Asynchronous Queue">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
    ch := make(chan int, 2)  // buffer capacity = 2

    ch <- 1  // doesn't block (buffer has space)
    ch <- 2  // still doesn't block (buffer full now)

    fmt.Println(<-ch)  // 1
    fmt.Println(<-ch)  // 2

    // ch <- 3 would block here (receiver must drain first)
}`}
          output={`1
2`}
        />
        <CodeBlock
          title="buffered_behavior.txt"
          runnable={false}
          code={`capacity = 3:  ch := make(chan int, 3)
┌───────────────────────────────────┐
│ sends:  ch <- 1                   │ ✅ no block
│         ch <- 2                   │ ✅ no block
│         ch <- 3                   │ ✅ buffer full now
│         ch <- 4  ⏸️ BLOCKS        │ ← waits for receive
└───────────────────────────────────┘
receiver drains one: <-ch  → sender unblocks, sends 4

buffered = decoupling. sender can dump N items and keep going.
useful for: producer-consumer, bursty traffic smoothing. 📦`}
        />
        <Table
          head={["Channel type", "Send blocks when", "Receive blocks when"]}
          rows={[
            ["Unbuffered", "no receiver ready", "no sender ready"],
            ["Buffered (cap N)", "buffer full (N items)", "buffer empty"],
          ]}
        />
      </Section>

      {/* 05 */}
      <Section id="close-range" number="05" title="Close & Range Over Channels">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func produce(ch chan int) {
    for i := 1; i <= 5; i++ {
        ch <- i
    }
    close(ch)  // signal: no more values coming
}

func main() {
    ch := make(chan int, 2)
    go produce(ch)

    // range: receives until channel is closed
    for val := range ch {
        fmt.Println("received:", val)
    }
    fmt.Println("channel closed, loop exited")
}`}
          output={`received: 1
received: 2
received: 3
received: 4
received: 5
channel closed, loop exited`}
        />
        <P>
          <IC>close(ch)</IC> marks the channel as done — no more sends allowed (panic if you try).
          Receivers get remaining values, then receive the zero value forever. <IC>range</IC> exits
          when the channel closes. Only the SENDER should close (receiver doesn&apos;t know if more
          senders exist).
        </P>
        <Callout type="mistake">
          ⚠️ Closing a channel twice panics. Sending on a closed channel panics. Receiving is safe —
          you get zero values. Rule: close() is the sender&apos;s responsibility, and only when done
          sending.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="comma-ok" number="06" title="Comma-ok Receive — Detecting Closed Channels">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
    ch := make(chan int, 2)
    ch <- 10
    ch <- 20
    close(ch)

    // comma-ok: second return = channel open?
    val, ok := <-ch
    fmt.Printf("val=%d open=%v\\n", val, ok)  // 10, true

    val, ok = <-ch
    fmt.Printf("val=%d open=%v\\n", val, ok)  // 20, true

    val, ok = <-ch
    fmt.Printf("val=%d open=%v\\n", val, ok)  // 0, false (closed)
}`}
          output={`val=10 open=true
val=20 open=true
val=0 open=false`}
        />
        <P>
          <IC>val, ok := &lt;-ch</IC> — if <IC>ok</IC> is false, the channel is closed and{" "}
          <IC>val</IC> is the zero value. Use when you can&apos;t <IC>range</IC> (e.g., select on
          multiple channels). <IC>range</IC> does this check internally.
        </P>
      </Section>

      {/* 07 */}
      <Section id="deadlock" number="07" title="Deadlock Anatomy — When All Goroutines Block ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

func main() {
    ch := make(chan int)  // unbuffered
    ch <- 42  // ⏸️ blocks waiting for receiver… but main is the only goroutine!
}`}
          output={`fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan send]:
main.main()
    main.go:5 +0x34
exit status 2`}
          error={true}
        />
        <CodeBlock
          title="deadlock_two_goroutines.go"
          code={`package main

func main() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    go func() {
        <-ch2  // waits for ch2
        ch1 <- 1
    }()

    go func() {
        <-ch1  // waits for ch1
        ch2 <- 2
    }()

    // both goroutines waiting for each other → deadlock
    select {}  // block forever (to trigger detection)
}`}
          output={`fatal error: all goroutines are asleep - deadlock!

goroutine 1 [select (no cases)]:
main.main()
    main.go:17 +0x78
exit status 2`}
          error={true}
        />
        <P>
          Go&apos;s runtime detects deadlock: if all goroutines are blocked (chan send/recv, select,
          mutex wait), the program panics. It&apos;s a safety net — better than silently hanging.
          Common causes: unbuffered send with no receiver, circular channel waits, forgetting to
          spawn goroutines.
        </P>
        <Callout type="tip">
          💡 Fix deadlocks by ensuring: (1) every send has a receive (or buffer space), (2) every
          receive has a send (or close), (3) no circular dependencies. Use buffered channels to
          decouple, or spawn enough goroutines.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="directional" number="08" title="Directional Channels — Send-only & Receive-only">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

// send-only channel (can only send, not receive)
func produce(ch chan<- int) {
    for i := 1; i <= 3; i++ {
        ch <- i
    }
    close(ch)
    // val := <-ch  // compile error: can't receive from send-only
}

// receive-only channel
func consume(ch <-chan int) {
    for val := range ch {
        fmt.Println("consumed:", val)
    }
    // ch <- 99  // compile error: can't send to receive-only
}

func main() {
    ch := make(chan int)  // bidirectional
    go produce(ch)        // implicitly converts to chan<- int
    consume(ch)           // implicitly converts to <-chan int
}`}
          output={`consumed: 1
consumed: 2
consumed: 3`}
        />
        <P>
          Directional channels enforce roles at compile time: <IC>chan&lt;- T</IC> is send-only,{" "}
          <IC>&lt;-chan T</IC> is receive-only. You make a bidirectional <IC>chan T</IC> and pass it
          to functions with restricted types. Prevents accidental misuse (e.g., consumer trying to
          send).
        </P>
        <Table
          head={["Type", "Operations", "Use case"]}
          rows={[
            ["chan T", "send & receive", "creation, internal logic"],
            ["chan<- T", "send only", "producer function signatures"],
            ["<-chan T", "receive only", "consumer function signatures"],
          ]}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Goroutine spawn", "go funcCall() — 2KB stack, M:N scheduled, dies if main exits"],
            ["Channel make", "make(chan T) unbuffered · make(chan T, N) buffered"],
            ["Send/receive", "ch <- val (send) · val := <-ch (receive)"],
            ["Unbuffered", "send & receive synchronize — both block until handoff"],
            ["Buffered", "send blocks when full, receive blocks when empty — queue"],
            ["close(ch)", "sender signals done — receivers get remaining + zero values, range exits"],
            ["Comma-ok", "val, ok := <-ch — ok=false if closed, val=zero"],
            ["Deadlock", "all goroutines blocked → runtime panic (safety net)"],
            ["Directional", "chan<- T send-only · <-chan T receive-only — compile-time safety"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
