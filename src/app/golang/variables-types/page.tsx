"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The Zero-Value Factory — Live",
  nodes: [
    { id: "declare", icon: "✍️", label: "Declare", sub: "var x int", x: 10, y: 50, color: "#22d3ee" },
    { id: "typed", icon: "📦", label: "Typed Box", sub: "int container", x: 35, y: 25, color: "#a78bfa" },
    { id: "zero", icon: "0️⃣", label: "Zero Value", sub: "injected automatically", x: 60, y: 50, color: "#34d399" },
    { id: "ready", icon: "✅", label: "Ready", sub: "safe to use", x: 85, y: 25, color: "#fbbf24" },
    { id: "error", icon: "❌", label: "Type Error", sub: "compile fails", x: 60, y: 80, color: "#f87171" },
  ],
  edges: [
    { id: "declare-typed", from: "declare", to: "typed", color: "#a78bfa" },
    { id: "typed-zero", from: "typed", to: "zero", color: "#34d399" },
    { id: "zero-ready", from: "zero", to: "ready", color: "#fbbf24" },
    { id: "typed-error", from: "typed", to: "error", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "zero-magic",
      name: "🎯 Zero-value magic",
      command: "var x int  // no = sign, no undefined!",
      steps: [
        { node: "declare", paths: ["declare-typed"], text: "You declare a variable with var. You don't assign anything — Go doesn't panic." },
        { node: "zero", paths: ["typed-zero"], text: "The compiler injects the ZERO VALUE for that type: int=0, string=\"\", bool=false, pointer=nil. No undefined, no null reference exceptions." },
        { node: "ready", paths: ["zero-ready"], text: "The variable is immediately usable. Safe by default. Every type has a meaningful zero that makes sense." },
      ],
    },
    {
      id: "type-error",
      name: "❌ Type mismatch",
      command: "var x int = \"hello\"  // won't compile",
      steps: [
        { node: "typed", paths: ["declare-typed"], text: "Go is statically typed. Once you say var x int, that box only holds integers." },
        { node: "error", paths: ["typed-error"], text: "Try to assign a string to an int → compile error. No runtime type errors, no isinstance checks, no surprises." },
        { node: "ready", paths: [], text: "Fix the type, recompile. If it compiles, the types are correct — this eliminates whole classes of bugs. 🔒" },
      ],
    },
    {
      id: "iota",
      name: "🔢 iota counter",
      command: "const ( A = iota; B; C )  // 0, 1, 2",
      steps: [
        { node: "declare", paths: [], text: "iota is a const counter that auto-increments in a const block. Start at 0, +1 for each line." },
        { node: "typed", paths: ["declare-typed"], text: "Use iota for enums: const (Sunday=iota; Monday; Tuesday…). Each name gets 0, 1, 2, 3… automatically." },
        { node: "ready", paths: ["typed-zero", "zero-ready"], text: "iota resets to 0 in each const block. Great for bit flags: 1<<iota gives 1, 2, 4, 8… (powers of 2)." },
      ],
    },
  ],
};

const NAV = [
  { id: "declarations", label: "var, :=, const ⭐" },
  { id: "basic-types", label: "Basic Types & Sizes" },
  { id: "zero-values", label: "Zero Values — No undefined! ⭐" },
  { id: "type-conv", label: "Explicit Type Conversions" },
  { id: "iota", label: "const & iota" },
  { id: "fmt-verbs", label: "fmt Verbs — Print Anything" },
  { id: "strings", label: "Strings Are Immutable" },
  { id: "mistakes", label: "Common Mistakes" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoVariablesTypesPage() {
  return (
    <TopicShell
      icon="📦"
      title="Variables & Types"
      gradientWord="Variables"
      subtitle="var, short := declaration, const + iota for auto-incrementing constants, basic types & their sizes, zero values (Go's secret weapon: no undefined!), explicit type conversions only, fmt verbs to print anything, and why strings are immutable."
      nav={NAV}
      badges={["0️⃣ Zero values", "📏 Explicit types", "🔢 iota counter"]}
      next={{ icon: "🔀", label: "Control Flow", href: "/golang/control-flow" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="declarations" number="01" title="var, :=, const — Three Ways to Declare ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// 1. var with type
\tvar age int = 25
\t
\t// 2. var with type inference
\tvar name = "Alice"  // compiler infers string
\t
\t// 3. short declaration := (only inside functions!)
\tcount := 10
\t
\t// const (immutable)
\tconst pi = 3.14159
\t
\tfmt.Println(age, name, count, pi)
}`}
          output={`25 Alice 10 3.14159`}
        />
        <CodeBlock
          title="styles.txt"
          runnable={false}
          code={`var x int = 10       ← explicit type, explicit value
var x = 10           ← inferred type (int because 10 is an int literal)
x := 10              ← short form, ONLY inside functions (not at package level)

var x int            ← declared but not initialized → ZERO VALUE (see §03)

const Pi = 3.14159   ← immutable, known at compile time
                       convention: Capitalized = exported (public)

multiple declarations:
var a, b, c int = 1, 2, 3
x, y := 10, "hello"  ← different types in one line!`}
        />
        <Callout type="mistake">
          <IC>:=</IC> only works <strong>inside functions</strong>. At package level, you must use{" "}
          <IC>var</IC> or <IC>const</IC>. Also, <IC>:=</IC> <em>declares</em> — you can&apos;t use it to
          reassign an existing variable (use <IC>=</IC> for that).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="basic-types" number="02" title="Basic Types & Sizes — The Type Palette">
        <Table
          head={["Type", "Size", "Range/Notes"]}
          rows={[
            [<IC key="bool">bool</IC>, "1 byte", "true or false"],
            [<IC key="string">string</IC>, "variable", "immutable UTF-8 byte sequence (§07)"],
            [<IC key="int">int</IC>, "32 or 64 bits", "platform-dependent (most common: use this)"],
            [<IC key="int8">int8</IC>, "1 byte", "-128 to 127"],
            [<IC key="int16">int16</IC>, "2 bytes", "-32768 to 32767"],
            [<IC key="int32">int32</IC>, "4 bytes", "-2³¹ to 2³¹-1 (alias: rune for Unicode code points)"],
            [<IC key="int64">int64</IC>, "8 bytes", "-2⁶³ to 2⁶³-1"],
            [<IC key="uint">uint</IC>, "32 or 64 bits", "unsigned, 0 to 2ⁿ-1"],
            [<IC key="uint8">uint8</IC>, "1 byte", "0 to 255 (alias: byte)"],
            [<IC key="float32">float32</IC>, "4 bytes", "IEEE-754 32-bit float"],
            [<IC key="float64">float64</IC>, "8 bytes", "IEEE-754 64-bit (default for 3.14)"],
            [<IC key="complex64">complex64</IC>, "8 bytes", "complex numbers (real + imag float32)"],
            [<IC key="complex128">complex128</IC>, "16 bytes", "complex(1.0, 2.0) → 1+2i"],
          ]}
        />
        <Callout type="tip">
          Use <IC>int</IC> and <IC>float64</IC> by default unless you have a specific reason (memory
          constraints, binary protocols). The compiler picks the right size for your platform.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="zero-values" number="03" title="Zero Values — Go's Secret Weapon ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tvar i int
\tvar f float64
\tvar b bool
\tvar s string
\t
\tfmt.Printf("int: %d, float: %f, bool: %t, string: %q\\n", i, f, b, s)
}`}
          output={`int: 0, float: 0.000000, bool: false, string: ""`}
        />
        <CodeBlock
          title="zero_value_table.txt"
          runnable={false}
          code={`Type           Zero Value        Why it's brilliant
─────────────────────────────────────────────────────────────────
int/float      0 / 0.0           safe to do math immediately
bool           false             safe in conditionals
string         ""                empty string, not null — no crashes
pointer        nil               explicit "nothing" (not garbage)
slice          nil               len=0, cap=0, safe to append to!
map            nil               reading returns zero, but DON'T write
                                 (must make() first — covered in §05)
channel        nil               send/receive blocks forever (useful!)
function       nil               calling nil func → panic (checked)
interface      nil               both type AND value are nil (tricky!)

JavaScript/Python: uninitialized → undefined/None → runtime errors
Go: uninitialized → ZERO VALUE → works, or compile error if misused 🛡️`}
        />
        <Callout type="analogy">
          Zero values are like a <strong>factory default</strong> on your phone. You don&apos;t boot into
          chaos — you get a clean, usable state. JavaScript gives you <IC>undefined</IC> (chaos); Go gives
          you 0, false, &quot;&quot;, nil (predictable starting points).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="type-conv" number="04" title="Explicit Type Conversions — No Surprises">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tvar i int = 42
\tvar f float64 = float64(i)  // MUST explicitly convert
\tvar u uint = uint(f)
\t
\tfmt.Printf("i=%d, f=%f, u=%d\\n", i, f, u)
\t
\t// this WON'T compile:
\t// var x float64 = i  ❌ cannot use i (int) as float64
}`}
          output={`i=42, f=42.000000, u=42`}
        />
        <P>
          Go has <strong>no implicit type conversions</strong> (except for untyped constants). You must
          explicitly cast: <IC>T(value)</IC>. This prevents silent overflow/truncation bugs.
        </P>
        <CodeBlock
          title="conversions.txt"
          runnable={false}
          code={`int(3.9)          → 3      (truncates, doesn't round!)
float64(10)       → 10.0
string(65)        → "A"    (interprets 65 as Unicode code point!)
[]byte("hello")   → [104 101 108 108 111]
string([]byte{72, 105}) → "Hi"

Why explicit?
  int16 x = 1000
  int8 y = int8(x)   → y = -24 (overflow, but YOU asked for it)

If conversions were implicit, this would be a silent bug. 🐛`}
        />
        <Callout type="mistake">
          <IC>string(65)</IC> gives <IC>&quot;A&quot;</IC> (rune conversion), NOT <IC>&quot;65&quot;</IC>.
          To convert int to string, use <IC>strconv.Itoa(65)</IC> → <IC>&quot;65&quot;</IC>. Import{" "}
          <IC>&quot;strconv&quot;</IC> first.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="iota" number="05" title="const & iota — Auto-Incrementing Constants">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

const (
\tSunday = iota  // 0
\tMonday         // 1
\tTuesday        // 2
\tWednesday      // 3
)

const (
\t_  = iota             // skip 0
\tKB = 1 << (10 * iota) // 1 << 10 = 1024
\tMB                     // 1 << 20 = 1048576
\tGB                     // 1 << 30
)

func main() {
\tfmt.Println("Wednesday:", Wednesday)
\tfmt.Println("1 MB =", MB, "bytes")
}`}
          output={`Wednesday: 3
1 MB = 1048576 bytes`}
        />
        <CodeBlock
          title="iota_explained.txt"
          runnable={false}
          code={`const (
    A = iota  // 0    iota starts at 0
    B         // 1    repeats the expression (implicit = iota)
    C         // 2
)

const (
    X = iota  // 0    iota resets in each const() block
    Y         // 1
)

const (
    _         = iota      // 0, discarded with blank identifier _
    ReadPerm  = 1 << iota // 1 << 1 = 2  (binary 10)
    WritePerm             // 1 << 2 = 4  (binary 100)
    ExecPerm              // 1 << 3 = 8  (binary 1000)
)
// combine with bitwise OR: ReadPerm | WritePerm = 6 (binary 110)

Use iota for enums, bit flags, unit conversions. 🔢`}
        />
      </Section>

      {/* 06 */}
      <Section id="fmt-verbs" number="06" title="fmt Verbs — Print Anything">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tname := "Go"
\tage := 15
\tpi := 3.14159
\tflag := true
\t
\tfmt.Printf("String: %s\\n", name)
\tfmt.Printf("Integer: %d (hex: %x, binary: %b)\\n", age, age, age)
\tfmt.Printf("Float: %f (compact: %g)\\n", pi, pi)
\tfmt.Printf("Bool: %t\\n", flag)
\tfmt.Printf("Type: %T, Generic: %v\\n", age, age)
\tfmt.Printf("Quoted string: %q\\n", name)
}`}
          output={`String: Go
Integer: 15 (hex: f, binary: 1111)
Float: 3.141590 (compact: 3.14159)
Bool: true
Type: int, Generic: 15
Quoted string: "Go"`}
        />
        <Table
          head={["Verb", "Meaning", "Example"]}
          rows={[
            [<IC key="v">%v</IC>, "default format (works for ANY type)", <IC key="ex">%v → 42 or "hello"</IC>],
            [<IC key="T">%T</IC>, "type of the value", <IC key="ex">%T → int or string</IC>],
            [<IC key="d">%d</IC>, "integer (decimal)", <IC key="ex">%d → 42</IC>],
            [<IC key="f">%f</IC>, "float", <IC key="ex">%f → 3.141590</IC>],
            [<IC key="s">%s</IC>, "string", <IC key="ex">%s → hello</IC>],
            [<IC key="q">%q</IC>, "quoted string (with escapes)", <IC key="ex">%q → "hello\n"</IC>],
            [<IC key="t">%t</IC>, "boolean", <IC key="ex">%t → true</IC>],
            [<IC key="x">%x</IC>, "hex (lowercase)", <IC key="ex">%x → 2a</IC>],
            [<IC key="b">%b</IC>, "binary", <IC key="ex">%b → 101010</IC>],
            [<IC key="p">%p</IC>, "pointer address", <IC key="ex">%p → 0xc000012345</IC>],
          ]}
        />
        <Callout type="tip">
          Use <IC>%v</IC> when debugging — it works for <em>everything</em> (structs, slices, maps). For
          prettier output, use <IC>%+v</IC> (struct field names) or <IC>%#v</IC> (Go-syntax representation).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="strings" number="07" title="Strings Are Immutable — Read-Only UTF-8">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\ts := "hello"
\tfmt.Println(s[0])       // 104 (ASCII 'h')
\t// s[0] = 'H'          ❌ cannot assign to s[0] (immutable!)
\t
\t// create a new string instead
\ts2 := "H" + s[1:]
\tfmt.Println(s2)         // "Hello"
\t
\t// strings are UTF-8 byte sequences
\temoji := "🐹"
\tfmt.Println(len(emoji)) // 4 bytes (not 1 character!)
}`}
          output={`104
Hello
4`}
        />
        <CodeBlock
          title="string_internals.txt"
          runnable={false}
          code={`string in Go:
┌───────────────────────────────────┐
│ pointer → byte array in memory    │  immutable!
│ length (int)                       │  (changing creates a NEW string)
└───────────────────────────────────┘

s := "hello"
s = s + " world"  ← this DOESN'T modify "hello" in place
                    it allocates a new "hello world" and updates s

indexing: s[0] returns a BYTE (uint8), not a character
len(s) returns BYTE count, not character count

for multi-byte characters (emoji, Chinese, etc.):
  use []rune(s) to get Unicode code points
  or range over the string (auto-decodes UTF-8)`}
        />
        <Callout type="behind">
          Strings are immutable for safety and performance: multiple goroutines can read the same string
          concurrently without locks. Mutating strings would require synchronization — or crashes.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="mistakes" number="08" title="Common Mistakes — Avoid These">
        <CodeBlock
          title="main.go"
          code={`package main

func main() {
\t// ❌ unused variable (compile error!)
\tx := 10
\t
\t// ❌ short := at package level
}

// count := 5  ❌ syntax error: non-declaration statement outside function body

// ✅ at package level, use var
var count = 5`}
        />
        <P>Go enforces:</P>
        <Table
          head={["Rule", "Why"]}
          rows={[
            ["No unused variables", "Forces you to clean up. Use _ to discard: _ = x"],
            ["No unused imports", "Keeps dependencies explicit. goimports auto-removes them."],
            [":= only in functions", "Package-level needs var/const for clarity."],
            ["Explicit conversions", "Prevents silent bugs (overflow, truncation)."],
          ]}
        />
        <Callout type="mistake">
          Shadowing: <IC>x := 10</IC> in an outer scope, then <IC>x := 20</IC> in an inner scope creates a
          NEW variable, not reassignment. Use <IC>x = 20</IC> to reassign. The compiler won&apos;t warn —
          be careful in nested blocks!
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["var x int = 10", "explicit type + value"],
            ["var x = 10", "type inferred (int)"],
            ["x := 10", "short form, ONLY inside functions"],
            ["const Pi = 3.14", "immutable, compile-time constant"],
            ["Zero values", "int=0, bool=false, string=\"\", pointer/slice/map=nil"],
            ["Type conversion", "T(value) — ALWAYS explicit, no implicit casts"],
            ["iota", "const counter: starts at 0, +1 per line, resets per const() block"],
            ["fmt.Printf", "%v (any), %T (type), %d (int), %f (float), %s (string), %t (bool)"],
            ["Strings", "immutable UTF-8, len()=bytes not chars, s[i]=byte not rune"],
            ["Unused var/import", "compile error — use _ to discard or remove it"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
