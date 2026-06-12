"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Slice Header & append — Live",
  nodes: [
    { id: "var", icon: "📝", label: "var s []int", sub: "declare slice", x: 8, y: 50, color: "#22d3ee" },
    { id: "header", icon: "📋", label: "Header", sub: "ptr·len·cap", x: 28, y: 25, color: "#a78bfa" },
    { id: "backing", icon: "📦", label: "Backing Array", sub: "[10 20 30 _ _]", x: 52, y: 50, color: "#fb923c" },
    { id: "append", icon: "➕", label: "append(s, 40)", sub: "fits in cap", x: 75, y: 25, color: "#34d399" },
    { id: "realloc", icon: "🆕", label: "New Array", sub: "cap exceeded!", x: 90, y: 70, color: "#f87171" },
  ],
  edges: [
    { id: "var-header", from: "var", to: "header", color: "#a78bfa" },
    { id: "header-backing", from: "header", to: "backing", color: "#fb923c" },
    { id: "backing-append", from: "backing", to: "append", color: "#34d399" },
    { id: "append-backing", from: "append", to: "backing", bend: -40, dashed: true, color: "#34d399" },
    { id: "backing-realloc", from: "backing", to: "realloc", color: "#f87171" },
  ],
  flows: [
    {
      id: "header",
      name: "📋 Slice header",
      command: "s := []int{10, 20, 30}",
      steps: [
        { node: "header", paths: ["var-header"], text: "A slice is a HEADER: pointer to array + length (3) + capacity (3). The slice itself is small (24 bytes on 64-bit)." },
        { node: "backing", paths: ["header-backing"], text: "The header points to a BACKING ARRAY on the heap. The array holds the actual data: [10, 20, 30]. 📦" },
        { node: "append", paths: [], text: "When you pass a slice to a function, the HEADER is copied (cheap), but both point to the SAME backing array. Mutations are visible! ⚠️" },
      ],
    },
    {
      id: "append-cap",
      name: "➕ append within cap",
      command: "s = append(s, 40)  // cap not exceeded",
      steps: [
        { node: "backing", paths: ["header-backing"], text: "Slice has len=3, cap=5. The backing array has room: [10 20 30 _ _]." },
        { node: "append", paths: ["backing-append", "append-backing"], text: "append(s, 40) writes 40 to index 3, increments len to 4. The backing array is REUSED. No allocation. ✅" },
        { node: "header", paths: [], text: "The header updates: len=4, cap=5 (unchanged), same pointer. Fast! This is why append returns the slice — len changed." },
      ],
    },
    {
      id: "realloc",
      name: "🆕 append past cap",
      command: "s = append(s, 60)  // cap exceeded!",
      steps: [
        { node: "backing", paths: ["header-backing"], text: "Slice has len=5, cap=5. The backing array is FULL. No room for another element." },
        { node: "realloc", paths: ["backing-realloc"], text: "append allocates a NEW array (cap doubles: 5 → 10), COPIES old elements, appends the new one. 🆕" },
        { node: "header", paths: [], text: "The header now points to the NEW array. Old array is garbage-collected. This is why you MUST assign: s = append(s, ...). 🔄" },
      ],
    },
  ],
};

const NAV = [
  { id: "arrays", label: "Arrays — Fixed Size" },
  { id: "slices", label: "Slices — Dynamic Arrays ⭐" },
  { id: "slice-header", label: "Slice Header Internals ⭐" },
  { id: "append", label: "append & Reallocation" },
  { id: "slicing", label: "Slicing Shares Backing Array ⚠️" },
  { id: "copy", label: "copy — Deep Copy" },
  { id: "maps", label: "Maps — Hash Tables" },
  { id: "strings-bytes", label: "strings vs []byte vs []rune" },
  { id: "iteration", label: "Iteration Patterns" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoCollectionsPage() {
  return (
    <TopicShell
      icon="📚"
      title="Collections"
      gradientWord="Collections"
      subtitle="Arrays (fixed size, value semantics) vs slices (dynamic, the Go workhorse), slice header internals drawn (ptr·len·cap), append growth & reallocation, slicing shares backing array (the gotcha!), copy for deep clones, maps (hash tables with CRUD + comma-ok), and strings vs []byte vs []rune."
      nav={NAV}
      badges={["📋 Slice header", "➕ append magic", "🗺️ Maps"]}
      next={{ icon: "🏗️", label: "Structs & Methods", href: "/golang/structs-methods" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="arrays" number="01" title="Arrays — Fixed Size, Value Semantics">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tvar arr [3]int  // array of 3 ints, zero-valued to [0 0 0]
\tarr[0] = 10
\tarr[1] = 20
\tarr[2] = 30
\tfmt.Println(arr)
\t
\t// array literal
\tprimes := [5]int{2, 3, 5, 7, 11}
\tfmt.Println(primes)
\t
\t// ... = infer length
\tauto := [...]int{1, 2, 3}
\tfmt.Println(len(auto))  // 3
}`}
          output={`[10 20 30]
[2 3 5 7 11]
3`}
        />
        <CodeBlock
          title="array_properties.txt"
          runnable={false}
          code={`[N]T                 ← array of N elements of type T
                    size is PART OF THE TYPE

[3]int ≠ [4]int      ← different types! (can't assign)

arrays are VALUES:
  a := [3]int{1, 2, 3}
  b := a             ← COPIES the array (not a reference!)
  b[0] = 99
  fmt.Println(a[0])  // still 1 (a is unchanged)

passing to functions:
  func modify(arr [3]int) {
      arr[0] = 100   ← modifies a COPY
  }

arrays are RARELY used directly in Go.
→ use SLICES instead (next section). 📏`}
        />
        <Callout type="tip">
          Arrays in Go are like <strong>value types</strong> (structs). Assigning or passing them copies all
          elements. For dynamic collections, use slices (which are references to arrays).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="slices" number="02" title="Slices — The Dynamic Array You'll Actually Use ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// slice literal
\ts := []int{10, 20, 30}  // no size → it's a slice, not array
\tfmt.Println(s, len(s), cap(s))
\t
\t// make a slice with len=5, cap=10
\tnums := make([]int, 5, 10)
\tfmt.Println(nums, len(nums), cap(nums))
\t
\t// zero-value of a slice is nil
\tvar empty []int
\tfmt.Println(empty == nil, len(empty), cap(empty))
}`}
          output={`[10 20 30] 3 3
[0 0 0 0 0] 5 10
true 0 0`}
        />
        <CodeBlock
          title="slice_vs_array.txt"
          runnable={false}
          code={`ARRAY                     SLICE
[3]int                    []int       ← no size in type
fixed size                dynamic     ← grows with append
value semantics           reference   ← points to backing array
rarely used               idiomatic   ← use this!

make([]T, len, cap)       ← create slice with initial len & cap
make([]T, len)            ← cap = len
[]T{1, 2, 3}              ← literal (cap = len = 3)

len(s)  → number of elements
cap(s)  → capacity of backing array (before realloc needed)

nil slice:
  var s []int             ← s == nil, len=0, cap=0
  safe to append to! append(nil, x) works ✅`}
        />
      </Section>

      {/* 03 */}
      <Section id="slice-header" number="03" title="Slice Header — The Three-Field Struct ⭐">
        <CodeBlock
          title="slice_internals.txt"
          runnable={false}
          code={`s := []int{10, 20, 30}

slice header (24 bytes on 64-bit):
┌──────────────────────────────────────┐
│ ptr  → points to backing array       │  8 bytes
│ len  → 3 (number of elements)        │  8 bytes
│ cap  → 3 (capacity of backing array) │  8 bytes
└──────────────────────────────────────┘
         ↓
   [10, 20, 30]  ← backing array on heap

When you pass a slice to a function:
  func modify(s []int) { s[0] = 99 }

  → the HEADER is copied (cheap: 24 bytes)
  → but the PTR still points to the SAME backing array
  → mutations are visible to the caller! ⚠️

  func caller() {
      nums := []int{1, 2, 3}
      modify(nums)
      fmt.Println(nums[0])  // 99 (mutated!)
  }`}
        />
        <Callout type="behind">
          This is why slices feel like <strong>references</strong> but are actually <strong>values</strong>.
          The header is copied, but it contains a pointer. Contrast with arrays, which copy ALL elements.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="append" number="04" title="append — Growth & Reallocation">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\ts := make([]int, 0, 3)  // len=0, cap=3
\tfmt.Printf("len=%d cap=%d %v\\n", len(s), cap(s), s)
\t
\ts = append(s, 10)  // len=1, cap=3 (fits)
\tfmt.Printf("len=%d cap=%d %v\\n", len(s), cap(s), s)
\t
\ts = append(s, 20, 30)  // len=3, cap=3 (fits)
\tfmt.Printf("len=%d cap=%d %v\\n", len(s), cap(s), s)
\t
\ts = append(s, 40)  // len=4, cap=6 (REALLOC! cap doubled)
\tfmt.Printf("len=%d cap=%d %v\\n", len(s), cap(s), s)
}`}
          output={`len=0 cap=3 []
len=1 cap=3 [10]
len=3 cap=3 [10 20 30]
len=4 cap=6 [10 20 30 40]`}
        />
        <CodeBlock
          title="append_rules.txt"
          runnable={false}
          code={`s = append(s, elem)       ← ALWAYS assign the result!

if len < cap:
  → write elem to index len, increment len
  → reuses backing array (fast ⚡)

if len == cap:
  → allocate NEW array (cap typically doubles)
  → copy old elements
  → append new elem
  → return slice pointing to new array

growth strategy (approximation):
  cap < 1024: double (2 → 4 → 8 → 16 ...)
  cap ≥ 1024: grow by 25% (1024 → 1280 → 1600 ...)

appending a slice:
  s = append(s, otherSlice...)  ← ... unpacks the slice`}
        />
        <Callout type="mistake">
          Forgetting to assign the result: <IC>append(s, x)</IC> without <IC>s =</IC> is a bug. If append
          reallocates, the original <IC>s</IC> points to the old array — the new element is lost. Always
          write <IC>s = append(s, x)</IC>. ⚠️
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="slicing" number="05" title="Slicing — Shares the Backing Array ⚠️">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\toriginal := []int{0, 1, 2, 3, 4}
\tsub := original[1:4]  // [1 2 3]
\t
\tfmt.Println("original:", original)
\tfmt.Println("sub:", sub)
\t
\t// mutate sub
\tsub[0] = 99
\tfmt.Println("after sub[0]=99:")
\tfmt.Println("original:", original)  // [0 99 2 3 4] ← mutated!
\tfmt.Println("sub:", sub)
}`}
          output={`original: [0 1 2 3 4]
sub: [1 2 3]
after sub[0]=99:
original: [0 99 2 3 4]
sub: [99 2 3]`}
        />
        <CodeBlock
          title="slicing_syntax.txt"
          runnable={false}
          code={`s[low:high]              ← from index low up to (NOT including) high
s[low:high:max]          ← also set cap = max - low (rare)

s[1:4]                   → [s[1], s[2], s[3]]  (len=3)
s[:3]                    → [s[0], s[1], s[2]]  (from start)
s[2:]                    → [s[2] ... s[len-1]] (to end)
s[:]                     → entire slice (copy header, SAME backing)

SHARES backing array:
┌──────────────────────────────────────────┐
│ original [0 1 2 3 4]                     │
│           ↑─────────↑ sub points here    │
└──────────────────────────────────────────┘
modifying sub[0] modifies original[1] ⚠️

To avoid sharing → use copy (§06)`}
        />
        <Callout type="analogy">
          Slicing is like <strong>creating a window</strong> into the same array. You see a different view,
          but you&apos;re looking at the same data. Modifying through the window changes the original.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="copy" number="06" title="copy — Deep Copy a Slice">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\toriginal := []int{1, 2, 3, 4, 5}
\tclone := make([]int, len(original))
\tcopy(clone, original)  // deep copy
\t
\tclone[0] = 99
\tfmt.Println("original:", original)  // [1 2 3 4 5] (unchanged)
\tfmt.Println("clone:", clone)        // [99 2 3 4 5]
}`}
          output={`original: [1 2 3 4 5]
clone: [99 2 3 4 5]`}
        />
        <CodeBlock
          title="copy_func.txt"
          runnable={false}
          code={`copy(dst, src)           ← copies elements from src to dst
                        returns number of elements copied
                        (min of len(dst), len(src))

dst := make([]int, len(src))
copy(dst, src)           ← full deep copy

copy(dst, src[2:5])      ← copy a sub-slice

overlapping slices are OK:
  copy(s[1:], s[:len(s)-1])  ← shift elements left

use case: when you need independent slices (no sharing)`}
        />
      </Section>

      {/* 07 */}
      <Section id="maps" number="07" title="Maps — Hash Tables (Key-Value Stores)">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\t// map literal
\tages := map[string]int{
\t\t"Alice": 30,
\t\t"Bob":   25,
\t}
\tfmt.Println(ages)
\t
\t// make a map
\tscores := make(map[string]int)
\tscores["Go"] = 100
\tscores["Python"] = 85
\t
\t// read (returns zero if missing)
\tfmt.Println(scores["Go"])      // 100
\tfmt.Println(scores["Rust"])    // 0 (not present)
\t
\t// comma-ok idiom
\tval, ok := scores["Rust"]
\tif ok {
\t\tfmt.Println("Found:", val)
\t} else {
\t\tfmt.Println("Not found")
\t}
\t
\t// delete
\tdelete(scores, "Python")
\tfmt.Println(len(scores))  // 1
}`}
          output={`map[Alice:30 Bob:25]
100
0
Not found
1`}
        />
        <CodeBlock
          title="map_operations.txt"
          runnable={false}
          code={`map[K]V                  ← K = key type, V = value type

make(map[K]V)            ← create empty map
map[K]V{ k1:v1, k2:v2 }  ← literal

m[key] = value           ← insert/update
value := m[key]          ← read (zero value if missing)
value, ok := m[key]      ← "comma-ok" idiom (ok = true if present)
delete(m, key)           ← remove key (no-op if missing)
len(m)                   ← number of keys

zero value: nil map
  var m map[string]int   ← m == nil
  m["key"] = 10          ❌ panic: assignment to nil map!
  must use make() first  ✅

iteration order is RANDOM (by design, for security):
  for k, v := range m {
      fmt.Println(k, v)
  }`}
        />
        <Callout type="mistake">
          Reading from a nil map returns the zero value (no panic). But <strong>writing</strong> to a nil
          map panics. Always <IC>make()</IC> before writing. A nil map is read-only. ⚠️
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="strings-bytes" number="08" title="strings vs []byte vs []rune">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\ts := "hello 🐹"
\t
\t// string → []byte (UTF-8 bytes)
\tb := []byte(s)
\tfmt.Println(b)  // [104 101 108 108 111 32 240 159 144 185]
\t
\t// string → []rune (Unicode code points)
\tr := []rune(s)
\tfmt.Println(r)  // [104 101 108 108 111 32 128057]
\t
\tfmt.Println("len(s):", len(s))        // 10 bytes
\tfmt.Println("len(r):", len(r))        // 7 runes (characters)
\t
\t// range over string → decodes UTF-8
\tfor i, ch := range s {
\t\tfmt.Printf("%d: %c\\n", i, ch)
\t}
}`}
          output={`[104 101 108 108 111 32 240 159 144 185]
[104 101 108 108 111 32 128057]
len(s): 10
len(r): 7
0: h
1: e
2: l
3: l
4: o
5:
6: 🐹`}
        />
        <Table
          head={["Type", "What it is", "When to use"]}
          rows={[
            [<IC key="string">string</IC>, "immutable UTF-8 byte sequence", "text you won't modify"],
            [<IC key="byte">[]byte</IC>, "mutable byte slice", "binary data, buffers, or when mutating text"],
            [<IC key="rune">[]rune</IC>, "slice of Unicode code points (int32)", "when you need to count/index by character (not byte)"],
          ]}
        />
        <Callout type="behind">
          <IC>len(string)</IC> returns <strong>byte count</strong>, not character count. Emoji like 🐹 are
          4 bytes in UTF-8. Use <IC>len([]rune(s))</IC> to count characters, or <IC>range</IC> which
          auto-decodes.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="iteration" number="09" title="Iteration Patterns">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
\tnums := []int{10, 20, 30}
\t
\t// range → index and value
\tfor i, v := range nums {
\t\tfmt.Printf("[%d]=%d ", i, v)
\t}
\tfmt.Println()
\t
\t// range → ignore value
\tfor i := range nums {
\t\tfmt.Print(i, " ")
\t}
\tfmt.Println()
\t
\t// range → ignore index
\tfor _, v := range nums {
\t\tfmt.Print(v, " ")
\t}
\tfmt.Println()
\t
\t// map iteration (random order!)
\tm := map[string]int{"a": 1, "b": 2}
\tfor k, v := range m {
\t\tfmt.Printf("%s:%d ", k, v)
\t}
}`}
          output={`[0]=10 [1]=20 [2]=30
0 1 2
10 20 30
a:1 b:2`}
        />
        <CodeBlock
          title="range_patterns.txt"
          runnable={false}
          code={`for i, v := range slice { }    ← index, value
for i := range slice { }        ← index only
for _, v := range slice { }     ← value only (ignore index with _)

for k, v := range map { }       ← key, value (RANDOM ORDER!)
for k := range map { }          ← keys only

for i, ch := range "hello" { }  ← i=byte index, ch=rune (decoded)

range COPIES the value:
  for _, item := range items {
      item.x = 10  ← modifies a COPY, not items[i]
  }
  → use index: for i := range items { items[i].x = 10 } ✅`}
        />
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Array", "[N]T — fixed size, value semantics, rarely used"],
            ["Slice", "[]T — dynamic, reference to backing array, idiomatic Go"],
            ["Slice header", "ptr (8B) + len (8B) + cap (8B) = 24 bytes on 64-bit"],
            ["make([]T, len, cap)", "create slice with initial len & cap"],
            ["append", "s = append(s, x) — ALWAYS assign! reallocs if len==cap"],
            ["Slicing", "s[1:4] SHARES backing array — mutations visible ⚠️"],
            ["copy", "copy(dst, src) — deep copy, independent slices"],
            ["Map", "map[K]V — hash table, make() before write, nil map panics on write"],
            ["comma-ok", "v, ok := m[key] — ok=true if present, false if missing"],
            ["strings", "immutable UTF-8, len()=bytes, []rune for char count, range decodes"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
