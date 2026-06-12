"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The defer Stack — Live",
  nodes: [
    { id: "func", icon: "⚙️", label: "Function", sub: "starts", x: 10, y: 50, color: "#22d3ee" },
    { id: "defer1", icon: "📥", label: "defer A", sub: "pushed to stack", x: 30, y: 25, color: "#a78bfa" },
    { id: "defer2", icon: "📥", label: "defer B", sub: "pushed to stack", x: 50, y: 50, color: "#fb923c" },
    { id: "defer3", icon: "📥", label: "defer C", sub: "pushed to stack", x: 70, y: 25, color: "#34d399" },
    { id: "return", icon: "🔙", label: "Return", sub: "about to exit", x: 85, y: 50, color: "#fbbf24" },
    { id: "pop", icon: "📤", label: "Pop Stack", sub: "C → B → A (LIFO)", x: 70, y: 75, color: "#f472b6" },
  ],
  edges: [
    { id: "func-defer1", from: "func", to: "defer1", color: "#a78bfa" },
    { id: "defer1-defer2", from: "defer1", to: "defer2", color: "#fb923c" },
    { id: "defer2-defer3", from: "defer2", to: "defer3", color: "#34d399" },
    { id: "defer3-return", from: "defer3", to: "return", color: "#fbbf24" },
    { id: "return-pop", from: "return", to: "pop", color: "#f472b6" },
    { id: "pop-func", from: "pop", to: "func", bend: 60, dashed: true, color: "#22d3ee" },
  ],
  flows: [
    {
      id: "lifo",
      name: "🥞 LIFO order",
      command: "defer A; defer B; defer C → runs C, B, A",
      steps: [
        { node: "defer1", paths: ["func-defer1"], text: "defer A runs — but NOT yet. It's pushed onto a stack (like a stack of plates 🥞)." },
        { node: "defer2", paths: ["defer1-defer2"], text: "defer B pushed. Then defer C. Each defer goes on TOP of the stack." },
        { node: "pop", paths: ["defer3-return", "return-pop"], text: "Function returns → the stack pops in reverse: C (top) → B → A (bottom). Last in, first out. 🔄" },
      ],
    },
    {
      id: "cleanup",
      name: "🧹 Cleanup pattern",
      command: "f := open(file); defer f.Close()",
      steps: [
        { node: "defer1", paths: ["func-defer1"], text: "Open a file, immediately defer f.Close(). Even if the function panics or returns early, the defer runs." },
        { node: "return", paths: ["defer1-defer2", "defer2-defer3", "defer3-return"], text: "You write your logic. Multiple return paths, error checks, panics — doesn't matter." },
        { node: "pop", paths: ["return-pop"], text: "Function exits → defer fires. File ALWAYS closes. No leaked handles, no try/finally blocks needed. 🛡️" },
      ],
    },
    {
      id: "pitfall",
      name: "⚠️ Loop defer bug",
      command: "for { defer f.Close() } ← defers stack up!",
      steps: [
        { node: "defer1", paths: ["func-defer1"], text: "You call defer inside a loop. Each iteration pushes a NEW defer onto the stack — they don't run yet." },
        { node: "defer2", paths: ["defer1-defer2", "defer2-defer3"], text: "Loop runs 1000 times → 1000 defers stacked. None execute until the FUNCTION returns (not the loop iteration)." },
        { node: "pop", paths: ["return-pop", "pop-func"], text: "Function finally returns → 1000 defers pop at once. Files stay open during the loop → potential out-of-handles error. FIX: call f.Close() directly in loop, or wrap in a func. ⚠️" },
      ],
    },
  ],
};

const NAV = [
  { id: "if", label: "if with Init Statement" },
  { id: "for", label: "for — The ONLY Loop ⭐" },
  { id: "switch", label: "switch — Auto-break ⭐" },
  { id: "labels", label: "Labels & break/continue" },
  { id: "defer", label: "defer — The LIFO Stack ⭐" },
  { id: "goto", label: "goto (when appropriate)" },
  { id: "mistakes", label: "Common Mistakes" },
  { id: "patterns", label: "Idiomatic Patterns" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoControlFlowPage() {
  return (
    <TopicShell
      icon="🔀"
      title="Control Flow"
      gradientWord="Control"
      subtitle="if with init statement, for as THE only loop (classic, while-style, and range — all drawn), switch with automatic breaks, labels & break/continue, defer LIFO stack drawn step by step (the cleanup pattern you'll use everywhere), and when goto is actually appropriate."
      nav={NAV}
      badges={["🔁 One loop form", "🔀 Auto-break switch", "🥞 defer LIFO"]}
      next={{ icon: "⚙️", label: "Functions", href: "/golang/functions" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="if" number="01" title="if — With Optional Init Statement">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// classic if
\tx := 10
\tif x > 5 {
\t\tfmt.Println("x is big")
\t}
\t
\t// if with init statement (scope limited to if/else!)
\tif y := x * 2; y > 15 {
\t\tfmt.Println("y is", y)
\t} else {
\t\tfmt.Println("y is small:", y)
\t}
\t// fmt.Println(y)  ❌ undefined: y (out of scope)
}`}
          output={`x is big
y is 20`}
        />
        <CodeBlock
          title="if_anatomy.txt"
          runnable={false}
          code={`if condition { }               ← no parentheses! (unlike C/Java)
if init; condition { }         ← init runs once, var scoped to if/else
if x := fn(); x > 0 { }        ← call fn(), assign to x, check x
else if other { }              ← chain conditions
else { }                       ← default case

common pattern:
  if err := doThing(); err != nil {
      return err  // handle error immediately
  }
  // success path continues, err out of scope ✅`}
        />
        <Callout type="tip">
          The init statement keeps variables scoped tightly. <IC>if err := f(); err != nil</IC> is
          idiomatic Go — the error only exists in the error-handling block, not polluting the rest of the
          function.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="for" number="02" title="for — The ONLY Loop (Three Styles) ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// 1. classic for (init; condition; post)
\tfor i := 0; i < 5; i++ {
\t\tfmt.Print(i, " ")
\t}
\tfmt.Println()
\t
\t// 2. while-style (just condition)
\tj := 0
\tfor j < 3 {
\t\tfmt.Print(j, " ")
\t\tj++
\t}
\tfmt.Println()
\t
\t// 3. infinite loop
\tcount := 0
\tfor {
\t\tif count >= 2 { break }
\t\tfmt.Print(count, " ")
\t\tcount++
\t}
\tfmt.Println()
\t
\t// 4. range over slice (index, value)
\tnums := []int{10, 20, 30}
\tfor i, v := range nums {
\t\tfmt.Printf("[%d]=%d ", i, v)
\t}
}`}
          output={`0 1 2 3 4
0 1 2
0 1
[0]=10 [1]=20 [2]=30`}
        />
        <CodeBlock
          title="for_forms.txt"
          runnable={false}
          code={`Go has ONE loop keyword: for (no while, no do-while, no foreach)

for init; cond; post { }   ← classic C-style
for cond { }               ← while-style (no init/post)
for { }                    ← infinite loop (break to exit)
for i, v := range slice { }← range over collection (§05 collections)

all semicolons optional:
  for i := 0; i < 10; i++ { }   ✅
  for i < 10 { i++ }            ✅ (while-style)
  for { }                       ✅ (infinite)

break    → exit loop immediately
continue → skip to next iteration`}
        />
        <Callout type="analogy">
          Go&apos;s <IC>for</IC> is like a <strong>Swiss Army knife</strong> — one tool, many modes. C has
          for/while/do-while (three separate knives); Go has one blade that does all three by omitting
          parts.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="switch" number="03" title="switch — Automatic Breaks ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tday := "Monday"
\t
\tswitch day {
\tcase "Monday":
\t\tfmt.Println("Start of work week")
\t\t// no break needed! (automatic)
\tcase "Friday":
\t\tfmt.Println("TGIF")
\tcase "Saturday", "Sunday":
\t\tfmt.Println("Weekend!")
\tdefault:
\t\tfmt.Println("Midweek")
\t}
\t
\t// switch without expression (like if-else chain)
\tx := 15
\tswitch {
\tcase x < 10:
\t\tfmt.Println("small")
\tcase x < 20:
\t\tfmt.Println("medium")
\tdefault:
\t\tfmt.Println("large")
\t}
}`}
          output={`Start of work week
medium`}
        />
        <CodeBlock
          title="switch_features.txt"
          runnable={false}
          code={`switch value {              ← compare value to cases
case 1:                     ← auto-break after each case (no fallthrough!)
case 2, 3:                  ← multiple values in one case
default:                    ← optional default (like else)
}

switch {                    ← no expression = if-else chain
case x > 10:                ← any boolean expression
case y == "hello":
}

switch x := fn(); x {       ← init statement (like if)
case 0:
}

fallthrough                 ← EXPLICIT fallthrough (rare!)
                              forces next case to run (unusual in Go code)`}
        />
        <Callout type="behind">
          Why auto-break? In C/Java, forgetting <IC>break</IC> causes bugs (unintended fall-through). Go
          reverses the default: break is automatic, <IC>fallthrough</IC> is explicit. Safer by default.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="labels" number="04" title="Labels & break/continue — Multi-Level Control">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
Outer:
\tfor i := 0; i < 3; i++ {
\t\tfor j := 0; j < 3; j++ {
\t\t\tif i == 1 && j == 1 {
\t\t\t\tbreak Outer  // break out of BOTH loops
\t\t\t}
\t\t\tfmt.Printf("(%d,%d) ", i, j)
\t\t}
\t}
\tfmt.Println("\\nDone")
}`}
          output={`(0,0) (0,1) (0,2) (1,0)
Done`}
        />
        <CodeBlock
          title="labels.txt"
          runnable={false}
          code={`Label:                       ← label name (convention: Capitalized)
    for { ... }

break Label                  → exit the labeled loop
continue Label               → skip to next iteration of labeled loop

without label:
  break      → exits innermost loop/switch
  continue   → skips to next iteration of innermost loop

use case: nested loops where you need to escape the outer one`}
        />
        <Callout type="tip">
          Labels are rare in idiomatic Go — usually a sign you should refactor into separate functions. But
          for nested loops (parsing, matrix ops), they&apos;re cleaner than boolean flags.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="defer" number="05" title="defer — The LIFO Cleanup Stack ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tdefer fmt.Println("A")
\tdefer fmt.Println("B")
\tdefer fmt.Println("C")
\tfmt.Println("main body")
}`}
          output={`main body
C
B
A`}
        />
        <CodeBlock
          title="defer_mechanics.txt"
          runnable={false}
          code={`func example() {
    defer A()  // 1. pushed to stack
    defer B()  // 2. pushed to stack
    defer C()  // 3. pushed to stack

    // function body runs...

    return     // function exits
}
// NOW defers run in LIFO order: C() → B() → A()

┌────────────────────────────────────────────┐
│ defer stack (Last In, First Out)          │
├────────────────────────────────────────────┤
│  C()  ← top (runs first on return)        │
│  B()                                       │
│  A()  ← bottom (runs last)                 │
└────────────────────────────────────────────┘

defers run even if:
  • the function panics (crash)
  • early return
  • multiple return paths
→ perfect for cleanup (close files, unlock mutexes, etc.)`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func openFile(name string) {
\tfmt.Println("Opening", name)
\tdefer fmt.Println("Closing", name)  // deferred immediately
\t
\t// ... do work with file ...
\t// file.Close() runs automatically on return ✅
}

func main() {
\topenFile("data.txt")
\topenFile("log.txt")
}`}
          output={`Opening data.txt
Closing data.txt
Opening log.txt
Closing log.txt`}
        />
        <Callout type="tip">
          The <strong>open-then-defer-close</strong> pattern is idiomatic Go. Open a resource (file,
          database connection, mutex), immediately <IC>defer</IC> its cleanup. No matter how the function
          exits, the resource is released. 🧹
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="goto" number="06" title="goto — When It's Actually Appropriate">
        <CodeBlock
          title="main.go"
          code={`package main

import (
\t"fmt"
\t"errors"
)

func process() error {
\terr := step1()
\tif err != nil {
\t\tgoto cleanup
\t}
\t
\terr = step2()
\tif err != nil {
\t\tgoto cleanup
\t}
\t
\tfmt.Println("Success")
\treturn nil

cleanup:
\tfmt.Println("Cleaning up after error")
\treturn err
}

func step1() error { return nil }
func step2() error { return errors.New("step2 failed") }

func main() {
\tprocess()
}`}
          output={`Cleaning up after error`}
        />
        <CodeBlock
          title="goto_rules.txt"
          runnable={false}
          code={`goto Label       ← jump to labeled statement (same function only)

Acceptable uses:
✅ error cleanup in functions with multiple failure points
   (though defer is usually better)
✅ breaking out of deeply nested loops (though labels on break
   are cleaner)
✅ state machine implementation (rare)

Avoid:
❌ jumping backward (creates loops — use for instead)
❌ jumping into a block (compiler disallows this)
❌ spaghetti code (if you need goto, maybe refactor?)

Modern Go: defer has mostly replaced cleanup gotos. 🧹`}
        />
      </Section>

      {/* 07 */}
      <Section id="mistakes" number="07" title="Common Mistakes">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// ❌ defer in a loop (pitfall!)
\tfor i := 0; i < 3; i++ {
\t\tdefer fmt.Println(i)  // all 3 defers stack, run at END of main
\t}
\tfmt.Println("loop done")
}

// output: loop done, then 2 1 0 (LIFO order)`}
          output={`loop done
2
1
0`}
        />
        <P>The defer runs when the <strong>function</strong> returns, not when the loop iteration ends!</P>
        <CodeBlock
          title="loop_defer_fix.go"
          code={`// ✅ fix: wrap in an anonymous function
for i := 0; i < 3; i++ {
\tfunc() {
\t\tdefer fmt.Println(i)  // defers run at end of THIS func
\t}()  // call immediately
}

// OR just don't defer in loops — call cleanup directly`}
        />
        <Callout type="mistake">
          Shadowing in switch: if you declare <IC>x := ...</IC> in a case, it&apos;s scoped to that case
          only. Other cases don&apos;t see it. Use the switch init statement if you need a shared variable.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="patterns" number="08" title="Idiomatic Patterns">
        <Table
          head={["Pattern", "Code"]}
          rows={[
            ["Error check + return", <IC key="1">if err := fn(); err != nil {"{"} return err {"}"}</IC>],
            ["Range over slice", <IC key="2">for i, v := range items {"{"}...{"}"}</IC>],
            ["Range ignore index", <IC key="3">for _, v := range items {"{"}...{"}"}</IC>],
            ["Range ignore value", <IC key="4">for i := range items {"{"}...{"}"}</IC>],
            ["Infinite loop + break", <IC key="5">for {"{"} if done {"{"} break {"}"} {"}"}</IC>],
            ["Defer cleanup", <IC key="6">f := open(); defer f.Close()</IC>],
            ["Switch as if-else", <IC key="7">switch {"{"} case x &gt; 10: ... {"}"}</IC>],
          ]}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["if init; cond", "if x := fn(); x > 0 { } — x scoped to if/else block"],
            ["for forms", "init;cond;post | cond | infinite | range"],
            ["for range", "for i, v := range slice — i=index, v=value (use _ to ignore)"],
            ["switch auto-break", "no break needed, fallthrough to force next case"],
            ["switch no expr", "switch { case x>10: ... } — if-else chain"],
            ["defer LIFO", "defer A; defer B; defer C → runs C, B, A on return"],
            ["defer runs when", "function returns (panic, early return, normal) — not loop iteration!"],
            ["defer pattern", "open resource → defer close immediately (files, locks, etc.)"],
            ["break/continue", "break exits loop, continue skips to next iteration"],
            ["labels", "break Label exits labeled loop (nested loops)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
