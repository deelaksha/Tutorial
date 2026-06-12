"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Duck Typing — Live",
  nodes: [
    { id: "file", icon: "📄", label: "File", sub: "os.File", x: 8, y: 25, color: "#22d3ee" },
    { id: "net", icon: "🌐", label: "NetworkConn", sub: "net.Conn", x: 8, y: 75, color: "#60a5fa" },
    { id: "buffer", icon: "📦", label: "Buffer", sub: "bytes.Buffer", x: 25, y: 50, color: "#a78bfa" },
    { id: "reader", icon: "🔌", label: "io.Reader", sub: "Read([]byte) int,err", x: 50, y: 50, color: "#fbbf24" },
    { id: "readall", icon: "⚙️", label: "ReadAll", sub: "func(io.Reader)", x: 80, y: 30, color: "#34d399" },
    { id: "nil", icon: "❌", label: "nil interface", sub: "type=nil value=nil", x: 80, y: 70, color: "#f87171" },
  ],
  edges: [
    { id: "file-reader", from: "file", to: "reader", color: "#22d3ee" },
    { id: "net-reader", from: "net", to: "reader", color: "#60a5fa" },
    { id: "buffer-reader", from: "buffer", to: "reader", color: "#a78bfa" },
    { id: "reader-readall", from: "reader", to: "readall", color: "#34d399" },
    { id: "reader-nil", from: "reader", to: "nil", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "any-reader",
      name: "🔌 Any Reader works",
      command: "io.ReadAll(anything) — if it has Read() it fits",
      steps: [
        { node: "file", paths: ["file-reader"], text: "File implements Read() → satisfies io.Reader implicitly, no 'implements' keyword needed." },
        { node: "buffer", paths: ["buffer-reader"], text: "Buffer has Read() too → plugs into the same socket. Duck typing: 'if it walks like a duck…'" },
        { node: "reader", paths: ["reader-readall"], text: "ReadAll accepts ANY io.Reader — file, network, memory buffer, all work. The interface is the contract. 🔌" },
      ],
    },
    {
      id: "nil-panic",
      name: "❌ Nil interface trap",
      command: "var r io.Reader; r.Read() → panic",
      steps: [
        { node: "nil", paths: ["reader-nil"], text: "Uninitialized interface variable: type=nil, value=nil. Calling methods → runtime panic." },
        { node: "nil", paths: [], text: "But: var r io.Reader = (*os.File)(nil) — type=*os.File, value=nil. r == nil is FALSE (gotcha!)." },
        { node: "nil", paths: [], text: "Always check 'if r == nil' before use — or initialize properly. Nil-interface panics are Go's NullPointerException. ❌" },
      ],
    },
    {
      id: "type-switch",
      name: "🔀 Type switch dispatch",
      command: "switch v := r.(type) { … } — dynamic dispatch",
      steps: [
        { node: "reader", paths: ["file-reader", "net-reader", "buffer-reader"], text: "Type switch examines the concrete type inside the interface at runtime." },
        { node: "file", paths: ["file-reader"], text: "case *os.File: v.Name() — concrete File methods available. Type assertion extracts the underlying value safely." },
        { node: "reader", paths: ["reader-readall"], text: "Polymorphism: write once (io.Reader), run on many. Type switches for custom fast-paths when needed. 🔀" },
      ],
    },
  ],
};

const NAV = [
  { id: "implicit", label: "Implicit Satisfaction ⭐" },
  { id: "small", label: "Small Interfaces Philosophy" },
  { id: "under-hood", label: "Interface Values Under the Hood ⭐" },
  { id: "empty", label: "Empty Interface & any" },
  { id: "assertions", label: "Type Assertions & Switches ⭐" },
  { id: "nil-gotcha", label: "The Nil Interface Gotcha" },
  { id: "vs-generics", label: "Generics vs Interfaces" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoInterfacesPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Interfaces"
      gradientWord="Interfaces"
      subtitle="Go&apos;s interface system is radically different: NO implements keyword, NO inheritance, just implicit satisfaction. Small interfaces compose into large behaviors. It&apos;s duck typing with compile-time safety — and the nil-interface gotcha that trips everyone once."
      nav={NAV}
      badges={["🔌 Duck typing", "🪶 Small is beautiful", "⚠️ Nil trap"]}
      next={{ icon: "⚠️", label: "Error Handling", href: "/golang/error-handling" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="implicit" number="01" title="Implicit Satisfaction — No &apos;implements&apos; Keyword ⭐">
        <CodeBlock
          title="implicit_interface.txt"
          runnable={false}
          code={`Java/C# world               Go world
┌──────────────┐            ┌──────────────┐
│ interface I  │            │ interface I  │
│   method()   │            │   method()   │
└──────────────┘            └──────────────┘
       ▲                            ▲
       │                            │ (implicit — if T has
       │                            │  method(), it IS an I)
       │ implements                 │
       │ (explicit keyword)         │
┌──────────────┐            ┌──────────────┐
│  class T     │            │  type T      │
│    method()  │            │    method()  │
└──────────────┘            └──────────────┘

Go: if it has the methods, it satisfies the interface — PERIOD.
No declarations, no inheritance, no coupling. The plug fits if
the pins match. 🔌`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

// interface defined by the consumer, not the producer
type Speaker interface {
    Speak() string
}

// Dog doesn't "know" about Speaker — no implements keyword
type Dog struct{ Name string }

func (d Dog) Speak() string {
    return "woof"
}

type Robot struct{ ID int }

func (r Robot) Speak() string {
    return "beep boop"
}

func Announce(s Speaker) {
    fmt.Println(s.Speak())
}

func main() {
    Announce(Dog{"Buddy"})  // implicitly satisfies Speaker
    Announce(Robot{42})     // so does Robot — no common base class
}`}
          output={`woof
beep boop`}
        />
        <Callout type="analogy">
          🔌 Think USB ports: the port (interface) defines the shape. Any device with matching pins
          works — the device doesn&apos;t need to declare &quot;I am a USB device&quot;, it just
          IS by having the right connectors. Go interfaces are structural, not nominal.
        </Callout>
        <P>
          This decoupling is radical: the standard library defines <IC>io.Reader</IC> and{" "}
          <IC>io.Writer</IC>, but YOU can make your types satisfy them without importing or
          declaring anything. The interface is just a contract — any type with the right methods
          fits.
        </P>
      </Section>

      {/* 02 */}
      <Section id="small" number="02" title="Small Interfaces Philosophy — The One-Method Rule">
        <P>
          Go culture: interfaces should be SMALL — often one method. Many methods? You&apos;re
          probably doing inheritance badly. Compose small interfaces into larger ones instead.
        </P>
        <CodeBlock
          title="stdlib_tiny_interfaces.go"
          code={`package main

import (
    "fmt"
    "io"
)

// actual stdlib interfaces — tiny!
type Reader interface {
    Read(p []byte) (n int, err error)  // 1 method
}

type Writer interface {
    Write(p []byte) (n int, err error) // 1 method
}

// composition, not inheritance
type ReadWriter interface {
    Reader  // embed small interfaces
    Writer
}

type Closer interface {
    Close() error
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer  // 3 embedded = 3 methods, but built from atoms
}

func main() {
    fmt.Println("io.Reader: 1 method")
    fmt.Println("io.Writer: 1 method")
    fmt.Println("io.ReadWriteCloser: 3 methods via composition")
}`}
          output={`io.Reader: 1 method
io.Writer: 1 method
io.ReadWriteCloser: 3 methods via composition`}
        />
        <Table
          head={["Interface", "Method(s)", "Philosophy"]}
          rows={[
            ["io.Reader", "Read([]byte) (int, error)", "anything you can pull bytes FROM"],
            ["io.Writer", "Write([]byte) (int, error)", "anything you can push bytes TO"],
            ["io.Closer", "Close() error", "anything with cleanup"],
            ["fmt.Stringer", "String() string", "anything with a string repr"],
            ["error", "Error() string", "anything that IS an error"],
            ["http.Handler", "ServeHTTP(ResponseWriter, *Request)", "anything that handles HTTP"],
          ]}
        />
        <Callout type="tip">
          💡 Rob Pike&apos;s rule: &quot;The bigger the interface, the weaker the abstraction.&quot;
          One-method interfaces are ultra-reusable — your File can be a Reader, a Writer, a Closer,
          all independently. Fat interfaces (10 methods) lock you in.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="under-hood" number="03" title="Interface Values Under the Hood ⭐">
        <CodeBlock
          title="interface_internals.txt"
          runnable={false}
          code={`an interface value is a (type, value) pair:

┌─────────────────────────────┐
│  interface variable         │
├─────────────────────────────┤
│  type:  *os.File  ────────┐ │
│  value: 0x104a3c0  ───┐   │ │
└────────────────────│──│───┘ │
                     │  │     │
                     │  └─────┼─▶ pointer to method table
                     │        │
                     └────────┼─▶ pointer to actual data
                              │
when you call r.Read(), Go:    │
1. looks up Read in the vtable │
2. calls it with value ptr     │

r == nil iff BOTH parts are nil (type=nil AND value=nil)`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "os"
)

func main() {
    var r interface{}  // type=nil, value=nil
    fmt.Printf("r == nil: %v\\n", r == nil)

    var f *os.File     // typed nil pointer
    r = f              // r now: type=*os.File, value=nil
    fmt.Printf("r == nil: %v (GOTCHA!)\\n", r == nil)

    // why? type is NOT nil anymore, even though value is
    fmt.Printf("type: %T, value: %v\\n", r, r)
}`}
          output={`r == nil: true
r == nil: false (GOTCHA!)
type: *os.File, value: <nil>`}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: returning a typed nil. <IC>func Open() io.Reader</IC> that returns{" "}
          <IC>(*os.File)(nil)</IC> looks nil, but the interface is NOT nil (type is set). The
          caller&apos;s <IC>if r == nil</IC> fails. Return <IC>return nil</IC> (untyped) instead, or
          check before wrapping.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="empty" number="04" title="Empty Interface & any — The Universal Container">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

// before Go 1.18: interface{}
// after Go 1.18: alias 'any' (same thing)
func Print(v any) {  // accepts ANYTHING
    fmt.Printf("type=%T value=%v\\n", v, v)
}

func main() {
    Print(42)
    Print("hello")
    Print([]int{1, 2, 3})
    Print(struct{ X int }{99})

    // storage: []any is like Java's ArrayList<Object>
    var things []any
    things = append(things, 10, "x", true)
    fmt.Println(things)
}`}
          output={`type=int value=42
type=string value=hello
type=[]int value=[1 2 3]
type=struct { X int } value={99}
[10 x true]`}
        />
        <P>
          <IC>interface&#123;&#125;</IC> / <IC>any</IC> has zero methods → every type satisfies it.
          It&apos;s Go&apos;s escape hatch when you truly don&apos;t know the type (JSON parsing,
          reflection, generic containers pre-1.18). But you lose type safety — need assertions to
          get the value back out.
        </P>
        <Callout type="tip">
          💡 Use <IC>any</IC> sparingly. With generics (Go 1.18+), prefer{" "}
          <IC>func Print[T any](v T)</IC> for type-safe generic code. Reserve <IC>any</IC> for truly
          dynamic cases (unmarshaling JSON into <IC>map[string]any</IC>, plugins, reflection).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="assertions" number="05" title="Type Assertions & Type Switches ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "io"
    "os"
)

func Describe(r io.Reader) {
    // type assertion: extract the concrete type
    f, ok := r.(*os.File)  // "comma-ok" idiom — safe
    if ok {
        fmt.Printf("It's a File: %s\\n", f.Name())
    } else {
        fmt.Println("Not a file")
    }

    // without ok: panics if wrong type
    // f := r.(*os.File)  // ⚠️ panic if r is not *os.File
}

func DescribeAny(v any) {
    // type switch: dispatch on concrete type
    switch val := v.(type) {
    case int:
        fmt.Printf("int: %d doubled = %d\\n", val, val*2)
    case string:
        fmt.Printf("string: %q (len %d)\\n", val, len(val))
    case []int:
        fmt.Printf("slice: %v sum=%d\\n", val, sum(val))
    case nil:
        fmt.Println("nil!")
    default:
        fmt.Printf("unknown type: %T\\n", val)
    }
}

func sum(nums []int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

func main() {
    f, _ := os.Open("go.mod")
    defer f.Close()
    Describe(f)

    DescribeAny(42)
    DescribeAny("hello")
    DescribeAny([]int{1, 2, 3})
}`}
          output={`It's a File: go.mod
int: 42 doubled = 84
string: "hello" (len 5)
slice: [1 2 3] sum=6`}
        />
        <Callout type="tip">
          💡 Type assertions are Go&apos;s safe downcast. Always use the comma-ok form{" "}
          <IC>v, ok := i.(T)</IC> unless you&apos;re 100% certain of the type. The panic form is a
          code smell outside of tests.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="nil-gotcha" number="06" title="The Nil Interface Gotcha — The Interview Classic">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func Return() error {
    var e *MyError = nil  // typed nil pointer
    return e  // ⚠️ GOTCHA: interface is NOT nil now
}

type MyError struct{ Msg string }

func (e *MyError) Error() string {
    if e == nil {
        return "no error"
    }
    return e.Msg
}

func main() {
    err := Return()
    fmt.Printf("err == nil: %v\\n", err == nil)  // false!
    fmt.Printf("type: %T, value: %v\\n", err, err)

    // calling methods on nil receiver works IF method handles it
    fmt.Println(err.Error())  // "no error" — lucky, method is nil-safe

    // but: interface wrapping typed nil is still non-nil
    // fix: return nil (untyped) instead of typed-nil pointer
}`}
          output={`err == nil: false
type: *main.MyError, value: <nil>
no error`}
        />
        <CodeBlock
          title="the_fix.go"
          code={`package main

import "fmt"

func ReturnFixed() error {
    var e *MyError = nil
    if e != nil {
        return e
    }
    return nil  // ✅ untyped nil — interface will be truly nil
}

type MyError struct{ Msg string }

func (e *MyError) Error() string { return e.Msg }

func main() {
    err := ReturnFixed()
    fmt.Printf("err == nil: %v\\n", err == nil)  // true!
}`}
          output={`err == nil: true`}
        />
        <Callout type="mistake">
          ⚠️ The interview question: &quot;Why is my nil error not nil?&quot; Answer: because
          returning a typed-nil pointer <IC>(*T)(nil)</IC> sets the interface&apos;s type field. The
          interface is only nil if BOTH type and value are nil. Always return <IC>nil</IC> directly,
          not a nil-pointer-to-concrete-type.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="vs-generics" number="07" title="Generics vs Interfaces — When to Use Which">
        <CodeBlock
          title="interfaces_for_behavior.go"
          code={`package main

import "fmt"

// interface: polymorphism, different TYPES, same behavior
type Shape interface {
    Area() float64
}

type Circle struct{ Radius float64 }

func (c Circle) Area() float64 { return 3.14 * c.Radius * c.Radius }

type Square struct{ Side float64 }

func (s Square) Area() float64 { return s.Side * s.Side }

func PrintArea(s Shape) {
    fmt.Printf("area: %.2f\\n", s.Area())
}

func main() {
    PrintArea(Circle{5})
    PrintArea(Square{4})
}`}
          output={`area: 78.50
area: 16.00`}
        />
        <CodeBlock
          title="generics_for_containers.go"
          code={`package main

import "fmt"

// generics: same ALGORITHM, different types (type-safe containers)
func Map[T any, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

func main() {
    nums := []int{1, 2, 3}
    doubled := Map(nums, func(x int) int { return x * 2 })
    fmt.Println(doubled)

    words := []string{"a", "bb", "ccc"}
    lengths := Map(words, func(s string) int { return len(s) })
    fmt.Println(lengths)
}`}
          output={`[2 4 6]
[1 2 3]`}
        />
        <Table
          head={["Use case", "Choose", "Why"]}
          rows={[
            ["Different types, common behavior", "Interface", "Circle/Square both have Area() — polymorphism"],
            ["Same algorithm, many types", "Generics", "Map/Filter/Sort work on any slice — no interface needed"],
            ["Unknown type at compile time", "Interface (any)", "JSON unmarshal, reflection, plugins"],
            ["Type-safe container/function", "Generics", "List[T], Optional[T] — checked at compile time"],
            ["Method dispatch", "Interface", "http.Handler, io.Reader — behavior contract"],
          ]}
        />
        <Callout type="tip">
          💡 Rule of thumb: interfaces are for WHAT (behavior contract), generics are for HOW (type
          parameters). If you&apos;re writing a library that works on &quot;anything with
          Read()&quot; → interface. If you&apos;re writing a Min function that works on any
          comparable type → generics.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Implicit satisfaction", "if T has methods, it IS the interface — no 'implements' keyword"],
            ["Small is beautiful", "one-method interfaces (io.Reader, io.Writer) compose better"],
            ["Interface internals", "(type, value) pair — both must be nil for i == nil to be true"],
            ["Empty interface", "interface{} / any — zero methods, accepts everything, loses type safety"],
            ["Type assertion safe", "v, ok := i.(T) — comma-ok prevents panic"],
            ["Type switch", "switch v := i.(type) { case T: ... } — dispatch on concrete type"],
            ["Nil-interface gotcha", "return (*T)(nil) → interface NOT nil (type is set). Return nil directly."],
            ["Generics vs interfaces", "interfaces = behavior contract · generics = type parameters for algorithms"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
