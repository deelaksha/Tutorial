"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why Speed Matters" },
  { id: "counting", label: "Count Steps, Not Seconds ⭐" },
  { id: "big-o", label: "Big-O Notation" },
  { id: "o1", label: "O(1) — Instant" },
  { id: "on", label: "O(n) — Linear" },
  { id: "on2", label: "O(n²) — The Trap ⭐" },
  { id: "logn", label: "O(log n) — The Magic" },
  { id: "cheatsheet", label: "Python Built-ins Cheat Sheet" },
  { id: "exceptions", label: "💥 Gotchas" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function BigOPage() {
  return (
    <TopicShell
      icon="⏱️"
      title="Big-O — How Fast Is Your Code?"
      gradientWord="Big-O"
      subtitle="Before learning data structures you need ONE measuring tape: Big-O. It answers 'what happens to my code when the data gets 1000× bigger?' — the question behind every DSA interview."
      nav={NAV}
      next={{ icon: "🌀", label: "Recursion — From Zero", href: "/python/recursion" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why Speed Matters — The Same Job, Two Ways">
        <P>
          Two programs check if a name is in a phone book of 1 million entries. Both are
          &quot;correct&quot;. One answers instantly, one makes the user stare at a spinner:
        </P>
        <CodeBlock
          title="two_ways.py"
          code={`names_list = load_million_names()      # a list
names_set  = set(names_list)           # same names, in a set

# Way 1: list
"Deelaksha" in names_list   # checks names one... by... one...

# Way 2: set
"Deelaksha" in names_set    # jumps straight to the answer`}
          output={`list lookup:  ~0.012 seconds   (500,000 checks on average)
set  lookup:  ~0.00000008 s    (1 check)

150,000x faster. Same data. Same Python.
The only difference: the DATA STRUCTURE.`}
        />
        <Callout type="analogy">
          📖 Finding &quot;Deelaksha&quot; by reading a phone book page by page (list) vs flipping
          straight to &quot;D&quot; (set/dict). Data structures are not academic — they are the
          difference between page-by-page and straight-to-D.
        </Callout>
        <Callout type="note">
          This whole DSA track is one story: <strong>each structure makes some operations cheap and
          others expensive</strong>. Big-O is how we write down &quot;cheap&quot; and
          &quot;expensive&quot; precisely.
        </Callout>
      </Section>

      {/* 02 ─ COUNTING */}
      <Section id="counting" number="02" title="Count Steps, Not Seconds ⭐">
        <P>
          Seconds depend on your laptop. <strong>Steps</strong> don&apos;t. We measure: &quot;how
          many steps does the code take when the input has <IC>n</IC> items?&quot;
        </P>
        <CodeBlock
          title="count_steps.py"
          code={`def find(items, target):
    for item in items:        # how many loops?
        if item == target:
            return True
    return False

# n = 5 items, target is LAST:
find([3, 7, 1, 9, 4], 4)`}
          output={`step 1: is 3 == 4?  no
step 2: is 7 == 4?  no
step 3: is 1 == 4?  no
step 4: is 9 == 4?  no
step 5: is 4 == 4?  YES → 5 steps for n=5

n=5     → 5 steps      (worst case)
n=1000  → 1000 steps
n=10⁶   → 10⁶ steps    ← steps grow WITH n. That's the pattern we record.`}
        />
        <Table
          head={["Input size n", "Steps for find()", "Pattern"]}
          rows={[
            ["10", "10", "steps = n"],
            ["1,000", "1,000", "steps = n"],
            ["1,000,000", "1,000,000", "steps = n"],
          ]}
        />
        <Callout type="behind">
          We always count the <strong>worst case</strong> (target at the end, or missing). Why?
          Because users remember the slow day, not the lucky one — and interviews ask for it.
        </Callout>
      </Section>

      {/* 03 ─ BIG O */}
      <Section id="big-o" number="03" title="Big-O Notation — Writing the Pattern Down">
        <P>
          Big-O is shorthand for &quot;how steps grow with n&quot;, <strong>ignoring small
          details</strong>. <IC>3n + 5</IC> steps? We just say <IC>O(n)</IC> — for huge n, the 3 and
          the 5 stop mattering.
        </P>
        <Table
          head={["Big-O", "Name", "If n doubles, steps…", "Feel"]}
          rows={[
            ["O(1)", "Constant", "stay the SAME", "⚡ instant"],
            ["O(log n)", "Logarithmic", "grow by +1", "🔍 magic-fast"],
            ["O(n)", "Linear", "double", "🚶 fair"],
            ["O(n log n)", "Linearithmic", "a bit more than double", "🏃 good sorting"],
            ["O(n²)", "Quadratic", "QUADRUPLE", "🐌 danger zone"],
            ["O(2ⁿ)", "Exponential", "SQUARE!", "💀 unusable past n≈30"],
          ]}
        />
        <CodeBlock
          title="growth.txt"
          runnable={false}
          code={`steps (for n = 1,000):

O(1)        1                |
O(log n)    10               |
O(n)        1,000            |█
O(n log n)  10,000           |██████
O(n²)       1,000,000        |████████████████████████████████
O(2ⁿ)       a number with    |██████████████████████████████████...
            301 digits        (the universe ends first)`}
          output={`Same n = 1000. The gap between rows IS computer science.
Every algorithm choice is choosing a row of this chart.`}
        />
        <Callout type="tip">
          Reading code → Big-O, the quick rules: no loop = O(1) · one loop over n = O(n) · loop
          inside a loop = O(n²) · halving each step = O(log n).
        </Callout>
      </Section>

      {/* 04 ─ O(1) */}
      <Section id="o1" number="04" title="O(1) — Same Speed at Any Size">
        <CodeBlock
          title="o1.py"
          code={`menu = ["idli", "dosa", "vada", "poha"]
prices = {"idli": 30, "dosa": 50, "vada": 25}

menu[2]              # jump straight to slot 2       → O(1)
prices["dosa"]       # hash jumps straight to value  → O(1)
menu.append("puri")  # add at the END               → O(1)
len(menu)            # Python stores the count       → O(1)`}
          output={`'vada'
50
None  (menu is now 5 items)
5

Whether menu has 4 items or 4 million —
each of these takes the SAME number of steps.`}
        />
        <Callout type="behind">
          Why is <IC>menu[2]</IC> instant? A list is a row of equally-sized boxes in memory. Address
          of slot 2 = start + 2 × box size — one multiplication, no searching. Why is{" "}
          <IC>prices[&quot;dosa&quot;]</IC> instant? Hashing (the Dicts page!) converts the key
          straight into a slot number.
        </Callout>
      </Section>

      {/* 05 ─ O(n) */}
      <Section id="on" number="05" title="O(n) — Touch Everything Once">
        <CodeBlock
          title="on.py"
          code={`marks = [62, 87, 45, 91, 78]

total = sum(marks)        # must touch all n      → O(n)
big   = max(marks)        # must check all n      → O(n)
45 in marks               # may check all n       → O(n)  ← list 'in' is SLOW
marks.insert(0, 100)      # shifts EVERYTHING right → O(n)`}
          output={`363
91
True
[100, 62, 87, 45, 91, 78]

insert(0, ...) visual — every element must move:
before: [62][87][45][91][78]
        ↘   ↘   ↘   ↘   ↘     n shifts!
after : [100][62][87][45][91][78]`}
        />
        <Callout type="mistake">
          ⚠️ The two famous hidden O(n)s: <IC>x in my_list</IC> (scans!) and{" "}
          <IC>my_list.insert(0, x)</IC> / <IC>my_list.pop(0)</IC> (shifts everything!). Need fast
          membership → <IC>set</IC>. Need fast pops from both ends → <IC>deque</IC> (Stacks &amp;
          Queues page).
        </Callout>
      </Section>

      {/* 06 ─ O(n²) */}
      <Section id="on2" number="06" title="O(n²) — The Nested-Loop Trap ⭐">
        <P>
          A loop inside a loop multiplies: n outer × n inner = n² steps. Classic interview task —
          find duplicates:
        </P>
        <CodeBlock
          title="duplicates_slow.py"
          code={`names = ["amit", "sara", "john", "sara", "ravi"]

# ❌ O(n²): every name compared with every other name
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        if names[i] == names[j]:
            print("duplicate:", names[i])`}
          output={`duplicate: sara

pairs checked (n=5): 10        fine.
pairs checked (n=10,000): 49,995,000   ← 50 MILLION for 10k names!`}
        />
        <CodeBlock
          title="duplicates_fast.py"
          code={`# ✅ O(n): one pass + a set (O(1) lookups)
seen = set()
for name in names:
    if name in seen:           # set 'in' → O(1)
        print("duplicate:", name)
    seen.add(name)`}
          output={`duplicate: sara

steps for n=10,000:  ~10,000  (vs 50,000,000)
The most common interview optimization on Earth:
nested loop  →  one loop + set/dict.`}
        />
        <Callout type="analogy">
          🤝 n people all shaking hands with each other = n² handshakes. n people signing one
          guest register = n signatures. Same room, wildly different effort.
        </Callout>
      </Section>

      {/* 07 ─ LOG N */}
      <Section id="logn" number="07" title="O(log n) — The Halving Magic">
        <P>
          If each step <strong>halves</strong> the remaining work, even huge inputs die fast. Guess
          my number (1–100), and I say higher/lower:
        </P>
        <CodeBlock
          title="guessing.txt"
          runnable={false}
          code={`secret = 73, range 1-100

guess 50 → "higher"   remaining: 51-100   (100 → 50 left)
guess 75 → "lower"    remaining: 51-74    (50 → 24 left)
guess 62 → "higher"   remaining: 63-74    (24 → 12 left)
guess 68 → "higher"   remaining: 69-74    (12 → 6 left)
guess 71 → "higher"   remaining: 72-74    (6 → 3 left)
guess 73 → "CORRECT!"                     6 guesses, not 100.`}
          output={`Each guess kills HALF the possibilities.

n = 100        → 7 guesses max
n = 1,000,000  → 20 guesses max
n = 10⁹ (every Google search?) → 30 guesses max

That's log₂(n) — and it's why "sorted + halving" (binary
search, Sorting page) and trees (Trees page) are fast.`}
        />
        <Callout type="tip">
          Spot-the-log trick: if the code does <IC>n = n // 2</IC> (or splits the problem in half)
          each iteration → it&apos;s O(log n). Doubling n costs just <strong>one</strong> extra
          step.
        </Callout>
      </Section>

      {/* 08 ─ CHEATSHEET */}
      <Section id="cheatsheet" number="08" title="Python Built-ins — The Big-O Cheat Sheet">
        <Table
          head={["Operation", "list", "set / dict", "Note"]}
          rows={[
            ["x in collection", "O(n) 🐌", "O(1) ⚡", "THE reason sets exist"],
            ["collection[i] / [key]", "O(1)", "O(1)", "Both instant"],
            ["append / add", "O(1)", "O(1)", "End of list is cheap"],
            ["insert(0,x) / pop(0)", "O(n) 🐌", "—", "Shifts everything → use deque"],
            ["pop() (end)", "O(1)", "O(1)", "End is always cheap"],
            ["sort()", "O(n log n)", "—", "Python's Timsort"],
            ["min / max / sum", "O(n)", "O(n)", "Must touch everything"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "Need fast 'in' checks?", sub: "set / dict" },
            { label: "Need order + index?", sub: "list" },
            { label: "Add/remove both ends?", sub: "deque" },
            { label: "Key → value?", sub: "dict" },
          ]}
        />
        <Callout type="note">
          This table is the punchline of the whole page — screenshot-worthy. Every structure in the
          coming pages (stacks, trees, graphs) exists to turn some 🐌 cell into a ⚡ cell.
        </Callout>
      </Section>

      {/* 09 ─ GOTCHAS */}
      <Section id="exceptions" number="09" title="💥 Gotchas — Where Big-O Bites Silently">
        <P>
          <strong>Gotcha 1: Hidden loop inside a loop.</strong> No nested <IC>for</IC> visible — but
          it&apos;s still O(n²):
        </P>
        <CodeBlock
          code={`# looks like one loop...
for name in names:
    if name in all_names:     # ❌ 'in' on a LIST is itself a loop!
        matches.append(name)

# n names x n-step lookups = O(n²) wearing a disguise.
# Fix: all_names = set(all_names) before the loop → O(n).`}
          output={`Rule: 'in' on list/str inside a loop = hidden n².
       'in' on set/dict inside a loop  = fine.`}
        />
        <P>
          <strong>Gotcha 2: String concatenation in a loop:</strong>
        </P>
        <CodeBlock
          code={`s = ""
for word in words:          # strings are immutable -
    s = s + word            # each + COPIES everything built so far!

# n words → 1+2+3+...+n copies → O(n²)
# Fix: "".join(words)  → O(n)`}
          output={`10,000 short words:
loop with +   : ~2.1 s
"".join(words): ~0.0004 s`}
        />
        <P>
          <strong>Gotcha 3: Trusting Big-O for tiny n.</strong> For n = 10, an O(n²) solution can
          beat a &quot;clever&quot; O(n) one (less setup work). Big-O is about <em>growth</em>, not
          a stopwatch for small inputs. Write the simple thing first; reach for Big-O when n gets
          real.
        </P>
        <Callout type="mistake">
          ⚠️ Interview phrasing matters: say &quot;time complexity is O(n)&quot; (steps) and
          &quot;space complexity is O(1)&quot; (extra memory). The duplicate-finder with a set
          traded space (O(n) for the set) to win time (n² → n). Trade-offs, always.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Big-O answers", "What happens to steps when n gets 1000× bigger?"],
            ["We count", "Worst-case STEPS, not seconds — laptops vary, growth doesn't"],
            ["O(1)", "Same speed at any size: list[i], dict[key], append, len"],
            ["O(n)", "Touch everything once: sum, max, 'in' on a LIST"],
            ["O(n²)", "Loop in a loop — n=10k means 50M pair-checks"],
            ["O(log n)", "Halving each step — a billion items in 30 steps"],
            ["The #1 optimization", "nested loop → one loop + set/dict"],
            ["Hidden O(n) traps", "x in list · insert(0) · pop(0) · s = s + word in a loop"],
            ["set vs list 'in'", "O(1) vs O(n) — the 150,000× phone book demo"],
            ["Every data structure", "Exists to turn some slow operation into a fast one"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
