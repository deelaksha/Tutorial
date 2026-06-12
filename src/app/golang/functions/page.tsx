"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Closures Capture Variables — Live",
  nodes: [
    { id: "outer", icon: "⚙️", label: "counter()", sub: "outer function", x: 10, y: 50, color: "#22d3ee" },
    { id: "env", icon: "📦", label: "Environment", sub: "count := 0", x: 35, y: 25, color: "#a78bfa" },
    { id: "closure", icon: "🔗", label: "Closure", sub: "returned func", x: 60, y: 50, color: "#fb923c" },
    { id: "call1", icon: "1️⃣", label: "Call 1", sub: "count++", x: 82, y: 25, color: "#34d399" },
    { id: "call2", icon: "2️⃣", label: "Call 2", sub: "count++", x: 90, y: 65, color: "#fbbf24" },
  ],
  edges: [
    { id: "outer-env", from: "outer", to: "env", color: "#a78bfa" },
    { id: "env-closure", from: "env", to: "closure", color: "#fb923c" },
    { id: "closure-call1", from: "closure", to: "call1", color: "#34d399" },
    { id: "closure-call2", from: "closure", to: "call2", color: "#fbbf24" },
    { id: "call1-env", from: "call1", to: "env", bend: -50, dashed: true, color: "#a78bfa" },
    { id: "call2-env", from: "call2", to: "env", bend: 50, dashed: true, color: "#a78bfa" },
  ],
  flows: [
    {
      id: "capture",
      name: "🎯 Closure captures",
      command: "inc := counter()  // inc remembers count",
      steps: [
        { node: "env", paths: ["outer-env"], text: "counter() creates a local variable count := 0. Normally, it would die when the function returns." },
        { node: "closure", paths: ["env-closure"], text: "But counter() returns a function (closure) that references count. The environment stays ALIVE — count persists! 🔗" },
        { node: "call1", paths: ["closure-call1", "call1-env"], text: "Each call to inc() accesses the SAME count variable. Call 1: count becomes 1. The closure remembers its environment." },
      ],
    },
    {
      id: "independent",
      name: "🆕 Two closures",
      command: "c1 := counter(); c2 := counter()",
      steps: [
        { node: "outer", paths: ["outer-env"], text: "You call counter() twice → two SEPARATE environments created, each with its own count variable." },
        { node: "closure", paths: ["env-closure"], text: "c1 and c2 are independent closures. c1's count and c2's count are different memory locations. 📦📦" },
        { node: "call1", paths: ["closure-call1", "call1-env", "closure-call2", "call2-env"], text: "c1() increments c1's count. c2() increments c2's count. They don't interfere — separate closures, separate environments." },
      ],
    },
    {
      id: "loop-bug",
      name: "⚠️ Loop capture bug",
      command: "for i := range ... { defer func() { print(i) } }",
      steps: [
        { node: "env", paths: ["outer-env"], text: "Loop variable i is ONE variable, reassigned each iteration. All closures capture the SAME i reference." },
        { node: "closure", paths: ["env-closure"], text: "You defer 5 closures. They all point to the same i. When defers run, i has its final value (4 or 5). 🐛" },
        { node: "call1", paths: ["closure-call1", "call1-env"], text: "FIX: capture i in a new variable: j := i; defer func() { print(j) }. Each closure gets its own j. ✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "basics", label: "Function Basics" },
  { id: "multi-return", label: "Multiple Return Values ⭐" },
  { id: "named-returns", label: "Named Returns" },
  { id: "variadic", label: "Variadic Parameters" },
  { id: "first-class", label: "Functions as Values" },
  { id: "closures", label: "Closures — Capture Environments ⭐" },
  { id: "recursion", label: "Recursion" },
  { id: "defer-return", label: "defer + Named Returns" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoFunctionsPage() {
  return (
    <TopicShell
      icon="⚙️"
      title="Functions"
      gradientWord="Functions"
      subtitle="Function declarations, multiple return values (THE Go signature move — errors as values), named returns, variadic parameters, functions as first-class values, closures capturing environments (drawn box-by-box), recursion, and the defer + named return interplay."
      nav={NAV}
      badges={["📤 Multi-return", "🔗 Closures", "⚙️ First-class"]}
      next={{ icon: "📚", label: "Collections", href: "/golang/collections" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="basics" number="01" title="Function Basics — Signature Anatomy">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

// func name(param type, ...) returnType { body }
func add(a int, b int) int {
\treturn a + b
}

// consecutive params of same type → shorthand
func multiply(a, b int) int {
\treturn a * b
}

// no return value
func greet(name string) {
\tfmt.Println("Hello,", name)
}

func main() {
\tsum := add(3, 5)
\tprod := multiply(4, 6)
\tfmt.Println(sum, prod)
\tgreet("Go")
}`}
          output={`8 24
Hello, Go`}
        />
        <CodeBlock
          title="anatomy.txt"
          runnable={false}
          code={`func name(param1 type1, param2 type2) returnType {
    return value
}

func add(x, y int) int       ← x and y both int (shorthand)
func process(s string)       ← no return type = returns nothing (void)
func getData() int           ← no params

visibility:
  func DoThing()     ← Capitalized = EXPORTED (public)
  func helper()      ← lowercase = unexported (private to package)

Go has no:
  • function overloading (same name, different signatures)
  • default parameters
  • optional parameters
→ explicitness over magic ✅`}
        />
      </Section>

      {/* 02 */}
      <Section id="multi-return" number="02" title="Multiple Return Values — The Go Signature Move ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
\t"fmt"
\t"errors"
)

func divide(a, b float64) (float64, error) {
\tif b == 0 {
\t\treturn 0, errors.New("division by zero")
\t}
\treturn a / b, nil
}

func main() {
\tresult, err := divide(10, 2)
\tif err != nil {
\t\tfmt.Println("Error:", err)
\t\treturn
\t}
\tfmt.Println("Result:", result)
\t
\t// ignore return values with _
\t_, err2 := divide(10, 0)
\tif err2 != nil {
\t\tfmt.Println("Error:", err2)
\t}
}`}
          output={`Result: 5
Error: division by zero`}
        />
        <CodeBlock
          title="multi_return_pattern.txt"
          runnable={false}
          code={`func doThing() (ResultType, error) {
    if problem {
        return zeroValue, errors.New("what went wrong")
    }
    return actualResult, nil
}

result, err := doThing()
if err != nil {
    // handle error
}
// use result

Go's error-handling philosophy:
  ❌ NO exceptions (no try/catch/throw)
  ✅ errors are VALUES (returned explicitly)
  ✅ you MUST check them (compiler doesn't force it, but
     tooling like errcheck does)

Why multiple returns?
  • no need for "out parameters" or Result<T, E> wrappers
  • error handling is visible in the call chain
  • hard to accidentally ignore errors (they're right there)`}
        />
        <Callout type="analogy">
          Multiple returns in Go are like a <strong>vending machine</strong> that gives you the item AND the
          receipt (or error slip). In Java, you&apos;d throw an exception (alarm goes off, whole building
          stops). In Go, you get both outputs and decide what to do.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="named-returns" number="03" title="Named Returns — Pre-declared Variables">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func split(sum int) (x, y int) {
\tx = sum * 4 / 9
\ty = sum - x
\treturn  // naked return (returns x and y)
}

func main() {
\ta, b := split(17)
\tfmt.Println(a, b)
}`}
          output={`7 10`}
        />
        <CodeBlock
          title="named_returns.txt"
          runnable={false}
          code={`func example() (result int, err error) {
    // result and err are PRE-DECLARED (zero-valued)
    result = 42
    err = nil
    return  // "naked return" — returns result and err implicitly
}

equivalent to:
func example() (int, error) {
    result := 0   // manual zero-init
    err := error(nil)
    result = 42
    return result, err  // explicit return
}

naked returns: readable for SHORT functions, confusing for long ones
(you forget what's being returned). Use sparingly. 📏`}
        />
        <Callout type="tip">
          Named returns are useful for documentation and for defer (see §08). But naked returns in long
          functions are a code smell — prefer explicit <IC>return x, err</IC> for clarity.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="variadic" number="04" title="Variadic Parameters — ...T">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func sum(nums ...int) int {
\ttotal := 0
\tfor _, n := range nums {
\t\ttotal += n
\t}
\treturn total
}

func main() {
\tfmt.Println(sum(1, 2, 3))
\tfmt.Println(sum(10, 20, 30, 40, 50))
\t
\t// spread a slice with ...
\tvalues := []int{5, 10, 15}
\tfmt.Println(sum(values...))
}`}
          output={`6
150
30`}
        />
        <CodeBlock
          title="variadic.txt"
          runnable={false}
          code={`func name(params ...Type) {
    // params is a SLICE []Type inside the function
}

sum(1, 2, 3)           → nums = []int{1, 2, 3}
sum()                  → nums = []int{} (empty slice, not nil)

spread a slice:
  values := []int{1, 2, 3}
  sum(values...)       → unpacks the slice into arguments

variadic param MUST be last:
  func log(level string, msgs ...string)  ✅
  func bad(msgs ...string, level string)  ❌ (won't compile)

fmt.Println is variadic: fmt.Println(a, b, c, ...)`}
        />
      </Section>

      {/* 05 */}
      <Section id="first-class" number="05" title="Functions as Values — First-Class Citizens">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func applyOp(a, b int, op func(int, int) int) int {
\treturn op(a, b)
}

func main() {
\tadd := func(x, y int) int { return x + y }
\tmul := func(x, y int) int { return x * y }
\t
\tfmt.Println(applyOp(5, 3, add))
\tfmt.Println(applyOp(5, 3, mul))
\t
\t// inline anonymous function
\tresult := applyOp(10, 2, func(x, y int) int {
\t\treturn x - y
\t})
\tfmt.Println(result)
}`}
          output={`8
15
8`}
        />
        <CodeBlock
          title="first_class.txt"
          runnable={false}
          code={`functions are VALUES:
  • assign to variables
  • pass as arguments
  • return from functions

type signature:
  func(int, int) int       ← function type (2 ints → 1 int)

anonymous functions (lambdas):
  func(x int) int { return x * 2 }

storing in a variable:
  double := func(x int) int { return x * 2 }
  fmt.Println(double(5))  // 10

higher-order functions:
  func map(f func(int) int, nums []int) []int {
      result := make([]int, len(nums))
      for i, v := range nums {
          result[i] = f(v)
      }
      return result
  }`}
        />
      </Section>

      {/* 06 */}
      <Section id="closures" number="06" title="Closures — Functions That Capture Their Environment ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func counter() func() int {
\tcount := 0  // local variable
\treturn func() int {
\t\tcount++  // closure CAPTURES count
\t\treturn count
\t}
}

func main() {
\tinc := counter()
\tfmt.Println(inc())  // 1
\tfmt.Println(inc())  // 2
\tfmt.Println(inc())  // 3
\t
\t// independent closure
\tinc2 := counter()
\tfmt.Println(inc2()) // 1 (separate count!)
}`}
          output={`1
2
3
1`}
        />
        <CodeBlock
          title="closure_explained.txt"
          runnable={false}
          code={`func outer() func() int {
    x := 10           ← local variable in outer
    return func() int {
        x++           ← inner function CAPTURES x
        return x
    }
}                     ← outer returns, but x STAYS ALIVE

f := outer()
f()  // x is now 11
f()  // x is now 12  ← same x, persists across calls!

┌─────────────────────────────────────────────┐
│ Environment (heap-allocated)                │
├─────────────────────────────────────────────┤
│  x: 12  ← shared by closure                 │
└─────────────────────────────────────────────┘
      ↑
      │ referenced by
      │
  [closure f]

Each call to outer() creates a NEW environment.
Each returned closure is INDEPENDENT. 🔗`}
        />
        <Callout type="behind">
          Normally, local variables live on the stack and die when the function returns. But when a closure
          captures them, Go moves them to the <strong>heap</strong> — they survive as long as the closure
          exists. The compiler handles this automatically (escape analysis).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="recursion" number="07" title="Recursion — Functions Calling Themselves">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func factorial(n int) int {
\tif n == 0 {
\t\treturn 1  // base case
\t}
\treturn n * factorial(n-1)
}

func fibonacci(n int) int {
\tif n <= 1 {
\t\treturn n
\t}
\treturn fibonacci(n-1) + fibonacci(n-2)
}

func main() {
\tfmt.Println("5! =", factorial(5))
\tfmt.Println("fib(7) =", fibonacci(7))
}`}
          output={`5! = 120
fib(7) = 13`}
        />
        <Callout type="tip">
          Go does NOT have tail-call optimization (TCO). Deep recursion can overflow the stack (~1MB default
          on 64-bit). For large N, use iteration or memoization instead.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="defer-return" number="08" title="defer + Named Returns — The Tricky Interplay">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func example() (result int) {
\tdefer func() {
\t\tresult++  // modifies the NAMED return variable!
\t}()
\tresult = 5
\treturn  // naked return: returns result (which is 5)
}            // defer runs: result becomes 6

func main() {
\tfmt.Println(example())  // 6, not 5!
}`}
          output={`6`}
        />
        <CodeBlock
          title="defer_modifies_return.txt"
          runnable={false}
          code={`func example() (x int) {
    defer func() { x = 100 }()
    return 42  // sets x = 42, then defer runs, x = 100
}
// returns 100, not 42!

Why? Named returns are VARIABLES in the function scope.
defer runs AFTER return assigns to them, but BEFORE the
function actually exits.

Order:
  1. return expression evaluated → x = 42
  2. defer runs → x = 100
  3. function exits → return value is x (100)

Use case: wrapping errors, logging return values, etc.`}
        />
        <Callout type="mistake">
          This behavior is subtle and can cause bugs. If you <IC>defer</IC> something that modifies a named
          return, be VERY explicit. Most Go code avoids this pattern for clarity.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Signature", "func name(p1 T1, p2 T2) ReturnType { }"],
            ["Multi-return", "func divide(a, b int) (int, error) — errors as values ⭐"],
            ["Named returns", "func split() (x, y int) { return } — naked return"],
            ["Variadic", "func sum(nums ...int) — nums is a slice, must be last param"],
            ["Spread slice", "sum(values...) — unpacks slice into args"],
            ["First-class", "f := func(x int) int { return x*2 } — funcs are values"],
            ["Closure", "inner func captures outer's variables → environment persists"],
            ["Closure pitfall", "loop var i captured by reference → all closures see final i"],
            ["Recursion", "no tail-call optimization → stack overflow risk for deep calls"],
            ["defer + named", "defer can modify named return vars before function exits"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
