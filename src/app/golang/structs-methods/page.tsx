"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Receivers: Copy or Same Box? — Live",
  nodes: [
    { id: "caller", icon: "📞", label: "Caller", sub: "p := Person{...}", x: 10, y: 50, color: "#22d3ee" },
    { id: "valuecopy", icon: "📦", label: "Value Copy", sub: "func (p Person)", x: 35, y: 20, color: "#a78bfa" },
    { id: "pointer", icon: "📌", label: "Pointer", sub: "func (p *Person)", x: 35, y: 75, color: "#fb923c" },
    { id: "original", icon: "🗃️", label: "Original", sub: "in memory", x: 65, y: 50, color: "#34d399" },
    { id: "lost", icon: "❌", label: "Lost!", sub: "mutation discarded", x: 85, y: 20, color: "#f87171" },
    { id: "mutated", icon: "✅", label: "Mutated", sub: "same box changed", x: 85, y: 75, color: "#fbbf24" },
  ],
  edges: [
    { id: "caller-value", from: "caller", to: "valuecopy", color: "#a78bfa" },
    { id: "caller-pointer", from: "caller", to: "pointer", color: "#fb923c" },
    { id: "valuecopy-original", from: "valuecopy", to: "original", dashed: true, color: "#f87171" },
    { id: "pointer-original", from: "pointer", to: "original", color: "#34d399" },
    { id: "valuecopy-lost", from: "valuecopy", to: "lost", color: "#f87171" },
    { id: "pointer-mutated", from: "pointer", to: "mutated", color: "#fbbf24" },
  ],
  flows: [
    {
      id: "value-receiver",
      name: "📦 Value receiver",
      command: "func (p Person) Greet() { p.Age++ }",
      steps: [
        { node: "valuecopy", paths: ["caller-value"], text: "Method with value receiver receives a COPY of the struct. The copy lives in the method's stack frame." },
        { node: "original", paths: ["valuecopy-original"], text: "The method can read p.Name, p.Age — but it's reading the COPY, not the original. The original is untouched." },
        { node: "lost", paths: ["valuecopy-lost"], text: "If the method does p.Age++, the COPY is modified. When the method returns, the copy is discarded. The original is unchanged. ❌" },
      ],
    },
    {
      id: "pointer-receiver",
      name: "📌 Pointer receiver",
      command: "func (p *Person) Birthday() { p.Age++ }",
      steps: [
        { node: "pointer", paths: ["caller-pointer"], text: "Method with pointer receiver receives a POINTER to the struct. It points to the SAME box in memory (the original)." },
        { node: "original", paths: ["pointer-original"], text: "The method accesses the original struct through the pointer. Go auto-dereferences: p.Age is shorthand for (*p).Age." },
        { node: "mutated", paths: ["pointer-mutated"], text: "p.Age++ modifies the ORIGINAL struct. The mutation persists after the method returns. ✅ This is how you mutate state." },
      ],
    },
    {
      id: "embedding",
      name: "🧩 Embedded promotion",
      command: "type Manager struct { Person; dept string }",
      steps: [
        { node: "caller", paths: [], text: "Embedding Person in Manager promotes Person's fields (Name, Age) and methods (Greet, Birthday) to Manager." },
        { node: "valuecopy", paths: ["caller-value"], text: "m.Greet() calls the embedded Person.Greet() method. If the embedded type has a pointer receiver, Go takes &m.Person automatically." },
        { node: "mutated", paths: ["pointer-original", "pointer-mutated"], text: "Embedding = composition. Manager HAS-A Person, not IS-A. No inheritance, no virtual dispatch — just syntactic sugar for m.Person.Greet(). 🧩" },
      ],
    },
  ],
};

const NAV = [
  { id: "structs", label: "Struct Basics" },
  { id: "literals", label: "Struct Literals & Tags" },
  { id: "embedding", label: "Embedding — Composition ⭐" },
  { id: "methods", label: "Methods — Functions on Types" },
  { id: "receivers", label: "Value vs Pointer Receivers ⭐" },
  { id: "constructors", label: "Constructor Convention" },
  { id: "method-sets", label: "Method Sets" },
  { id: "patterns", label: "Idiomatic Patterns" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoStructsMethodsPage() {
  return (
    <TopicShell
      icon="🏗️"
      title="Structs & Methods"
      gradientWord="Structs"
      subtitle="Struct definition & literals, struct tags for JSON marshaling, embedding = composition (drawn against inheritance), methods attached to types, pointer vs value receivers drawn (copy vs same box — the crucial choice), constructor convention NewX, and method sets for interfaces."
      nav={NAV}
      badges={["🏗️ Composition", "📌 Receivers", "🧩 Methods"]}
      next={{ icon: "🧩", label: "Interfaces", href: "/golang/interfaces" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="structs" number="01" title="Struct Basics — Custom Data Types">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

type Person struct {
\tName string
\tAge  int
}

func main() {
\t// zero-valued struct
\tvar p1 Person
\tfmt.Println(p1)  // {Name:"" Age:0}
\t
\t// field assignment
\tp1.Name = "Alice"
\tp1.Age = 30
\tfmt.Println(p1)
\t
\t// struct literal
\tp2 := Person{Name: "Bob", Age: 25}
\tfmt.Println(p2)
\t
\t// positional (fragile, avoid!)
\tp3 := Person{"Charlie", 35}
\tfmt.Println(p3)
}`}
          output={`{ 0}
{Alice 30}
{Bob 25}
{Charlie 35}`}
        />
        <CodeBlock
          title="struct_syntax.txt"
          runnable={false}
          code={`type Name struct {
    Field1 Type1
    Field2 Type2
}

Capitalized fields → EXPORTED (public to other packages)
lowercase fields  → unexported (private to this package)

type Config struct {
    Host string      ← exported
    port int         ← unexported (only this package can access)
}

structs are VALUE types:
  p1 := Person{Name: "A"}
  p2 := p1             ← COPIES the struct
  p2.Name = "B"
  fmt.Println(p1.Name) // still "A" (p1 is unchanged)`}
        />
      </Section>

      {/* 02 */}
      <Section id="literals" number="02" title="Struct Literals & Tags — JSON Marshaling">
        <CodeBlock
          title="main.go"
          code={`package main

import (
\t"encoding/json"
\t"fmt"
)

type User struct {
\tID       int    \`json:"id"\`
\tUsername string \`json:"username"\`
\tEmail    string \`json:"email,omitempty"\`
\tpassword string // unexported, not marshaled
}

func main() {
\tu := User{
\t\tID:       42,
\t\tUsername: "gopher",
\t\tEmail:    "",
\t\tpassword: "secret",
\t}
\t
\tdata, _ := json.Marshal(u)
\tfmt.Println(string(data))
}`}
          output={`{"id":42,"username":"gopher"}`}
        />
        <CodeBlock
          title="struct_tags.txt"
          runnable={false}
          code={`type User struct {
    Name string \`json:"name"\`              ← map to "name" in JSON
    Age  int    \`json:"age,omitempty"\`     ← omit if zero value
    pwd  string                             ← unexported, ignored
}

tags are string literals after the field (backticks!)
MUST escape backticks in code: \\\`json:"name"\\\`

common tag keys:
  json:"fieldname,omitempty"     ← encoding/json
  xml:"fieldname"                ← encoding/xml
  db:"column_name"               ← database libs (gorm, sqlx)
  validate:"required,email"      ← validation libs

reading tags at runtime → reflect package (advanced)`}
        />
        <Callout type="tip">
          Struct tags are <strong>metadata</strong> for libraries. The <IC>json</IC> tag controls JSON
          field names and omission. Always use backticks for tags: <IC>`json:&quot;id&quot;`</IC>. Escape
          them in string literals as <IC>\`json:&quot;id&quot;\`</IC>.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="embedding" number="03" title="Embedding — Composition Over Inheritance ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

type Person struct {
\tName string
\tAge  int
}

type Employee struct {
\tPerson       // embedded (anonymous field)
\tEmployeeID int
}

func main() {
\te := Employee{
\t\tPerson:     Person{Name: "Alice", Age: 30},
\t\tEmployeeID: 1001,
\t}
\t
\t// promoted fields
\tfmt.Println(e.Name)       // same as e.Person.Name
\tfmt.Println(e.Age)        // same as e.Person.Age
\tfmt.Println(e.EmployeeID)
}`}
          output={`Alice
30
1001`}
        />
        <CodeBlock
          title="embedding_vs_inheritance.txt"
          runnable={false}
          code={`Go has NO inheritance. Embedding is NOT inheritance.

type Base struct { X int }
type Derived struct {
    Base  ← embedded (anonymous field)
    Y int
}

d := Derived{Base: Base{X: 10}, Y: 20}
d.X        ← promoted from d.Base.X (syntactic sugar)
d.Base.X   ← explicit access (same thing)

┌─────────────────────────────────────────────────────┐
│ EMBEDDING (Go)            INHERITANCE (Java/C++)    │
├─────────────────────────────────────────────────────┤
│ HAS-A relationship        IS-A relationship         │
│ no polymorphism           virtual methods, overrides│
│ explicit (d.Base.X)       implicit (super.x)        │
│ fields promoted           fields inherited          │
│ methods promoted          methods overridden        │
│ no "super" keyword        super / base access       │
└─────────────────────────────────────────────────────┘

Use case: reuse fields & methods without inheritance hierarchy.
For polymorphism → interfaces (next topic). 🧩`}
        />
        <Callout type="analogy">
          Embedding is like a <strong>laptop with a built-in webcam</strong>. The laptop HAS-A webcam (you
          can access webcam.TakePicture), but the laptop IS NOT a webcam. Inheritance would make the laptop
          a subclass of Camera (weird!). Composition is cleaner.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="methods" number="04" title="Methods — Functions Attached to Types">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

type Rectangle struct {
\tWidth, Height float64
}

// method with value receiver
func (r Rectangle) Area() float64 {
\treturn r.Width * r.Height
}

// method with pointer receiver
func (r *Rectangle) Scale(factor float64) {
\tr.Width *= factor
\tr.Height *= factor
}

func main() {
\trect := Rectangle{Width: 10, Height: 5}
\tfmt.Println("Area:", rect.Area())
\t
\trect.Scale(2)
\tfmt.Println("After scale:", rect.Width, rect.Height)
}`}
          output={`Area: 50
After scale: 20 10`}
        />
        <CodeBlock
          title="method_syntax.txt"
          runnable={false}
          code={`func (receiver Type) MethodName(params) returnType {
    // receiver is like "this" or "self"
}

func (r Rectangle) Area() float64 { ... }
  ↑ value receiver (copy)

func (r *Rectangle) Scale(f float64) { ... }
  ↑ pointer receiver (mutates)

calling:
  rect.Area()      ← value receiver
  rect.Scale(2)    ← pointer receiver (Go auto-takes &rect)

methods vs functions:
  • method: tied to a type, called on instances
  • function: standalone

methods can be defined on ANY type (not just structs):
  type MyInt int
  func (m MyInt) Double() int { return int(m) * 2 }`}
        />
      </Section>

      {/* 05 */}
      <Section id="receivers" number="05" title="Value vs Pointer Receivers — The Crucial Choice ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

type Counter struct {
\tCount int
}

// value receiver → COPY
func (c Counter) IncrementValue() {
\tc.Count++  // modifies the COPY
}

// pointer receiver → SAME BOX
func (c *Counter) IncrementPointer() {
\tc.Count++  // modifies the ORIGINAL
}

func main() {
\tc := Counter{Count: 0}
\t
\tc.IncrementValue()
\tfmt.Println("After value receiver:", c.Count)  // still 0
\t
\tc.IncrementPointer()
\tfmt.Println("After pointer receiver:", c.Count) // now 1
}`}
          output={`After value receiver: 0
After pointer receiver: 1`}
        />
        <CodeBlock
          title="receiver_rules.txt"
          runnable={false}
          code={`VALUE RECEIVER (copy)           POINTER RECEIVER (same box)
────────────────────────────────────────────────────────────
func (r Type) Method()          func (r *Type) Method()

receiver is a COPY              receiver is a POINTER
mutations are LOST              mutations PERSIST
safe for concurrency            needs sync if concurrent
works on values & pointers      works on pointers & values
                                (Go auto-takes address)

When to use pointer receiver?
✅ method needs to MUTATE the receiver
✅ receiver is LARGE (copying is expensive)
✅ consistency: if ONE method uses *, ALL should (method set)

When to use value receiver?
✅ receiver is SMALL (int, small structs)
✅ method is READ-ONLY
✅ receiver is immutable by design

Convention: be CONSISTENT per type (all * or all value).`}
        />
        <Table
          head={["Code", "Receiver Type", "Effect"]}
          rows={[
            [<IC key="1">func (p Person) Greet()</IC>, "Value (copy)", "Can't mutate p, cheap for small types"],
            [<IC key="2">func (p *Person) SetAge(a int)</IC>, "Pointer", "CAN mutate p, works for large types"],
            [<IC key="3">p.Greet()</IC>, "Auto", "Go calls with value OR &p automatically"],
            [<IC key="4">(&p).Greet()</IC>, "Explicit", "You can be explicit, but Go does it for you"],
          ]}
        />
        <Callout type="mistake">
          Mixing receivers on the same type is confusing. If <IC>SetAge</IC> uses <IC>*Person</IC>, make ALL
          methods use <IC>*Person</IC> — even read-only ones. This ensures the <strong>method set</strong>{" "}
          is consistent for interfaces (§07).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="constructors" number="06" title="Constructor Convention — NewX()">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

type Server struct {
\tHost string
\tPort int
\trunning bool  // unexported
}

// constructor (by convention: NewTypeName)
func NewServer(host string, port int) *Server {
\treturn &Server{
\t\tHost: host,
\t\tPort: port,
\t\trunning: false,
\t}
}

func (s *Server) Start() {
\ts.running = true
\tfmt.Printf("Server started on %s:%d\\n", s.Host, s.Port)
}

func main() {
\tsrv := NewServer("localhost", 8080)
\tsrv.Start()
}`}
          output={`Server started on localhost:8080`}
        />
        <CodeBlock
          title="constructor_pattern.txt"
          runnable={false}
          code={`Go has no constructors (no special syntax).
Convention: function named NewTypeName() or New()

func NewPerson(name string, age int) *Person {
    return &Person{
        Name: name,
        Age:  age,
    }
}

Why return a pointer?
  • caller gets a mutable reference
  • common for "objects" that hold state
  • works with pointer-receiver methods

validation in constructors:
  func NewUser(email string) (*User, error) {
      if !isValidEmail(email) {
          return nil, errors.New("invalid email")
      }
      return &User{Email: email}, nil
  }

exported constructor + unexported fields = encapsulation ✅`}
        />
      </Section>

      {/* 07 */}
      <Section id="method-sets" number="07" title="Method Sets — Value vs Pointer Rules">
        <CodeBlock
          title="method_set_rules.txt"
          runnable={false}
          code={`Given:
  type T struct { ... }
  func (t T) ValueMethod() { }
  func (t *T) PointerMethod() { }

METHOD SET of T (value):
  • ValueMethod ✅

METHOD SET of *T (pointer):
  • ValueMethod ✅ (promoted)
  • PointerMethod ✅

┌───────────────────────────────────────────────────┐
│ Value T can only call value-receiver methods     │
│ Pointer *T can call BOTH value and pointer       │
└───────────────────────────────────────────────────┘

Why it matters: INTERFACES (next topic)
  If an interface requires PointerMethod(),
  only *T satisfies the interface, NOT T.

Example:
  var t T
  var p *T = &t

  t.ValueMethod()     ✅
  t.PointerMethod()   ✅ (Go auto-takes &t)

  p.ValueMethod()     ✅ (Go auto-dereferences)
  p.PointerMethod()   ✅

But for interface satisfaction:
  type Doer interface { PointerMethod() }

  var d Doer
  d = t   ❌ T does not implement Doer (missing PointerMethod in value set)
  d = p   ✅ *T implements Doer`}
        />
        <Callout type="behind">
          Go <strong>automatically</strong> takes addresses and dereferences when calling methods. But
          interfaces are strict: the method set must match. A value <IC>T</IC> can&apos;t satisfy an
          interface requiring a pointer-receiver method.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="patterns" number="08" title="Idiomatic Patterns">
        <Table
          head={["Pattern", "Code Example"]}
          rows={[
            ["Constructor", <IC key="1">func NewServer(...) *Server {"{"} return &Server{"{"} ... {"}"} {"}"}</IC>],
            ["Pointer receivers", <IC key="2">func (s *Server) Start() — mutate or large structs</IC>],
            ["Value receivers", <IC key="3">func (p Point) Distance() — immutable or small</IC>],
            ["Embedding", <IC key="4">type Manager struct {"{"} Person; dept string {"}"}</IC>],
            ["Validation", <IC key="5">func NewUser(...) (*User, error) — return err if invalid</IC>],
            ["Getters/Setters?", <IC key="6">Rare! Export fields or use methods when logic is needed</IC>],
          ]}
        />
        <P>
          Go culture: <strong>no getters/setters by default</strong>. If a field needs logic (validation,
          side effects), add a method. Otherwise, export the field directly. Simple &gt; ceremony.
        </P>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Struct", "type Name struct { Field Type } — Capitalized = exported"],
            ["Zero value", "all fields zero-valued: int=0, string=\"\", pointer=nil"],
            ["Struct literal", "Person{Name: \"Alice\", Age: 30} — named fields (safe)"],
            ["Struct tags", "Field Type `json:\"name\"` — metadata for libs (escape backticks!)"],
            ["Embedding", "type Manager struct { Person; dept string } — HAS-A, not IS-A"],
            ["Method", "func (r Type) Name() — value receiver (copy)"],
            ["Pointer receiver", "func (r *Type) Name() — mutates original, use for state changes"],
            ["Receiver choice", "Mutate or large? Use *Type. Immutable or small? Use Type."],
            ["Constructor", "func NewType(...) *Type — validation, init, return pointer"],
            ["Method set", "Value T: value methods only. Pointer *T: both (matters for interfaces)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
