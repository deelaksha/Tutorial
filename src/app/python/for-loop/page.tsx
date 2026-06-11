"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "basic", label: "Basic for Loop" },
  { id: "range", label: "range() ⭐" },
  { id: "strings-lists", label: "Loop Strings & Lists" },
  { id: "enumerate", label: "enumerate() ⭐" },
  { id: "zip", label: "zip() — Parallel Loop" },
  { id: "dict-loop", label: "Looping a Dict" },
  { id: "nested", label: "Nested Loops & Patterns" },
  { id: "accumulate", label: "Sum / Max / Count Patterns" },
  { id: "comprehension", label: "List Comprehension ⭐" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function ForLoopPage() {
  return (
    <TopicShell
      icon="🔁"
      title="for Loop"
      gradientWord="for Loop"
      subtitle="Repeat without repeating yourself. range, enumerate, zip, nested patterns and comprehensions — every iteration drawn step by step."
      nav={NAV}
      next={{ icon: "⏳", label: "while Loop", href: "/python/while-loop" }}
    >
      {/* 1 ─ basic */}
      <Section id="basic" number="01" title="Basic for Loop — Visit Every Item">
        <FlowDiagram
          steps={[
            { label: "take next item from the sequence", sub: 'fruit = "apple" → "mango" → "kiwi"' },
            { label: "run the indented block with it", sub: "print(fruit)" },
            { label: "sequence empty? → exit loop", sub: "code after the loop continues" },
          ]}
        />
        <CodeBlock
          code={`fruits = ["apple", "mango", "kiwi"]\n\nfor fruit in fruits:\n    print("I like", fruit)\n\nprint("done!")`}
          output={`I like apple\nI like mango\nI like kiwi\ndone!`}
        />
        <Callout type="analogy">
          A for loop is a conveyor belt: each item slides into the variable{" "}
          <IC>fruit</IC>, the block runs, then the next item slides in. No counters, no
          index bookkeeping.
        </Callout>
      </Section>

      {/* 2 ─ range */}
      <Section id="range" number="02" title="range() — Loop N Times ⭐">
        <Table
          head={["Call", "Produces", "Remember"]}
          rows={[
            ["range(5)", "0 1 2 3 4", "starts at 0, STOPS BEFORE 5"],
            ["range(2, 6)", "2 3 4 5", "start included, stop excluded"],
            ["range(1, 10, 2)", "1 3 5 7 9", "third value = step"],
            ["range(5, 0, -1)", "5 4 3 2 1", "negative step counts DOWN"],
          ]}
        />
        <CodeBlock
          code={`for i in range(5):\n    print(i, end=" ")\nprint()\n\nfor i in range(1, 6):\n    print(i, end=" ")\nprint()\n\n# countdown\nfor i in range(5, 0, -1):\n    print(i, end=" ")\nprint("🚀")`}
          output={`0 1 2 3 4 \n1 2 3 4 5 \n5 4 3 2 1 🚀`}
        />
        <CodeBlock
          code={`# multiplication table — interview staple\nn = 7\nfor i in range(1, 11):\n    print(f"{n} x {i:2} = {n * i}")`}
          output={`7 x  1 = 7\n7 x  2 = 14\n7 x  3 = 21\n7 x  4 = 28\n7 x  5 = 35\n7 x  6 = 42\n7 x  7 = 49\n7 x  8 = 56\n7 x  9 = 63\n7 x 10 = 70`}
        />
        <Callout type="mistake">
          <IC>range(5)</IC> never yields 5. Want 1…5 inclusive? Use <IC>range(1, 6)</IC>. The
          off-by-one is the #1 loop bug.
        </Callout>
      </Section>

      {/* 3 ─ strings & lists */}
      <Section id="strings-lists" number="03" title="Looping Strings & Lists">
        <CodeBlock
          code={`for ch in "abc":\n    print(ch, end=" ")\nprint()\n\nmarks = [90, 85, 88]\nfor m in marks:\n    print(m + 5, end=" ")     # original list unchanged!\nprint()\nprint(marks)`}
          output={`a b c \n95 90 93 \n[90, 85, 88]`}
        />
        <Callout type="mistake">
          <IC>m + 5</IC> changes the loop variable, never the list. To modify the list, loop
          with indexes: <IC>for i in range(len(marks)): marks[i] += 5</IC>.
        </Callout>
      </Section>

      {/* 4 ─ enumerate */}
      <Section id="enumerate" number="04" title="enumerate() — Index + Value Together ⭐">
        <CodeBlock
          code={`heroes = ["Iron Man", "Thor", "Hulk"]\n\n# ❌ the C-style way\nfor i in range(len(heroes)):\n    print(i, heroes[i])\n\n# ✅ the Python way\nfor i, hero in enumerate(heroes):\n    print(i, hero)\n\n# start numbering at 1\nfor rank, hero in enumerate(heroes, start=1):\n    print(f"{rank}. {hero}")`}
          output={`0 Iron Man\n1 Thor\n2 Hulk\n0 Iron Man\n1 Thor\n2 Hulk\n1. Iron Man\n2. Thor\n3. Hulk`}
        />
        <Callout type="tip">
          Interviewers watch for this: using <IC>range(len(x))</IC> when you also need the value
          marks you as a beginner. <IC>enumerate</IC> is the idiomatic answer.
        </Callout>
      </Section>

      {/* 5 ─ zip */}
      <Section id="zip" number="05" title="zip() — Two Lists in Parallel">
        <CodeBlock
          code={`names = ["Deelaksha", "John", "Maya"]\nmarks = [92, 85, 78]\n\nfor name, mark in zip(names, marks):\n    print(f"{name:<10} {mark}")\n\n# zip stops at the SHORTER list\nfor a, b in zip([1, 2, 3], ["x", "y"]):\n    print(a, b)`}
          output={`Deelaksha  92\nJohn       85\nMaya       78\n1 x\n2 y`}
        />
        <Callout type="behind">
          <IC>zip</IC> pairs items position by position like a zipper 🤐 and silently stops at
          the shortest input — no crash, but data can be silently dropped.
        </Callout>
      </Section>

      {/* 6 ─ dict loop */}
      <Section id="dict-loop" number="06" title="Looping a Dictionary">
        <CodeBlock
          code={`student = {"name": "Deelaksha", "age": 22, "city": "Bangalore"}\n\nfor key in student:               # keys by default\n    print(key, end=" ")\nprint()\n\nfor value in student.values():\n    print(value, end=" ")\nprint()\n\nfor key, value in student.items():   # ⭐ both\n    print(f"{key} → {value}")`}
          output={`name age city \nDeelaksha 22 Bangalore \nname → Deelaksha\nage → 22\ncity → Bangalore`}
        />
      </Section>

      {/* 7 ─ nested */}
      <Section id="nested" number="07" title="Nested Loops & Star Patterns">
        <P>
          Inner loop finishes <strong>completely</strong> for each single step of the outer
          loop. 3 outer × 3 inner = 9 runs.
        </P>
        <CodeBlock
          code={`for i in range(1, 4):\n    for j in range(1, 4):\n        print(f"i={i} j={j}", end="   ")\n    print()   # newline after each inner round`}
          output={`i=1 j=1   i=1 j=2   i=1 j=3   \ni=2 j=1   i=2 j=2   i=2 j=3   \ni=3 j=1   i=3 j=2   i=3 j=3   `}
        />
        <CodeBlock
          code={`# right triangle\nfor i in range(1, 6):\n    print("*" * i)`}
          output={`*\n**\n***\n****\n*****`}
        />
        <CodeBlock
          code={`# pyramid — spaces then stars\nrows = 5\nfor i in range(1, rows + 1):\n    print(" " * (rows - i) + "*" * (2 * i - 1))`}
          output={`    *\n   ***\n  *****\n *******\n*********`}
        />
        <CodeBlock
          code={`# number triangle\nfor i in range(1, 6):\n    for j in range(1, i + 1):\n        print(j, end="")\n    print()`}
          output={`1\n12\n123\n1234\n12345`}
        />
      </Section>

      {/* 8 ─ accumulate */}
      <Section id="accumulate" number="08" title="Sum / Max / Count — Accumulator Patterns">
        <FlowDiagram
          steps={[
            { label: "1. start an accumulator BEFORE the loop", sub: "total = 0  /  biggest = nums[0]  /  count = 0" },
            { label: "2. update it inside the loop", sub: "total += n  /  if n > biggest: biggest = n" },
            { label: "3. use it AFTER the loop", sub: "print(total)" },
          ]}
        />
        <CodeBlock
          code={`nums = [4, 9, 2, 9, 5]\n\ntotal = 0\nfor n in nums:\n    total += n\nprint("sum:", total)\n\nbiggest = nums[0]\nfor n in nums:\n    if n > biggest:\n        biggest = n\nprint("max:", biggest)\n\nevens = 0\nfor n in nums:\n    if n % 2 == 0:\n        evens += 1\nprint("even count:", evens)`}
          output={`sum: 29\nmax: 9\neven count: 2`}
        />
        <CodeBlock
          code={`# factorial — multiply accumulator\nn = 5\nfact = 1\nfor i in range(1, n + 1):\n    fact *= i\nprint(f"{n}! = {fact}")`}
          output={`5! = 120`}
        />
        <Callout type="tip">
          Built-ins do these in one line — <IC>sum(nums)</IC>, <IC>max(nums)</IC>,{" "}
          <IC>min(nums)</IC> — but interviews often demand the manual loop first.
        </Callout>
      </Section>

      {/* 9 ─ comprehension */}
      <Section id="comprehension" number="09" title="List Comprehension — Loops in One Line ⭐">
        <P>
          Pattern: <IC>[expression for item in sequence if condition]</IC> — builds a new list
          while looping.
        </P>
        <CodeBlock
          code={`nums = [1, 2, 3, 4, 5, 6]\n\nsquares = [n ** 2 for n in nums]\nprint(squares)\n\nevens = [n for n in nums if n % 2 == 0]\nprint(evens)\n\nlabels = ["even" if n % 2 == 0 else "odd" for n in nums]\nprint(labels)\n\nshout = [w.upper() for w in ["hi", "yo"]]\nprint(shout)`}
          output={`[1, 4, 9, 16, 25, 36]\n[2, 4, 6]\n['odd', 'even', 'odd', 'even', 'odd', 'even']\n['HI', 'YO']`}
        />
        <Table
          head={["Loop version", "Comprehension"]}
          rows={[
            ["out = []\nfor n in nums:\n    out.append(n*n)", "[n*n for n in nums]"],
            ["out = []\nfor n in nums:\n    if n % 2 == 0:\n        out.append(n)", "[n for n in nums if n % 2 == 0]"],
          ]}
        />
        <Callout type="mistake">
          Filter <IC>if</IC> goes at the END: <IC>[n for n in nums if n &gt; 2]</IC>. Choose-value{" "}
          <IC>if/else</IC> goes at the FRONT: <IC>[a if c else b for n in nums]</IC>.
        </Callout>
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="TypeError — int is not iterable"
          code={`for i in 5:\n    print(i)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    for i in 5:\nTypeError: 'int' object is not iterable`}
          error
        />
        <Callout type="tip">Fix: <IC>for i in range(5):</IC> — range turns a number into a sequence.</Callout>
        <CodeBlock
          title="IndexError — manual index off-by-one"
          code={`nums = [10, 20, 30]\nfor i in range(len(nums) + 1):   # one too far!\n    print(nums[i])`}
          output={`10\n20\n30\nTraceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print(nums[i])\nIndexError: list index out of range`}
          error
        />
        <CodeBlock
          title="RuntimeError — mutating while looping"
          code={`nums = [1, 2, 3, 4]\nfor n in nums:\n    if n % 2 == 0:\n        nums.remove(n)    # ❌ shrinks the list mid-loop\nprint(nums)               # skips items unpredictably`}
          output={`[1, 3]`}
        />
        <Callout type="mistake">
          Removing items while iterating silently <strong>skips elements</strong> (here it
          worked by luck — with <IC>[2, 2, 3]</IC> it fails). Loop over a copy:{" "}
          <IC>for n in nums[:]</IC> or build a new list with a comprehension.
        </Callout>
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Loop n times", "for i in range(n):"],
            ["1 to n inclusive", "for i in range(1, n + 1):"],
            ["Countdown", "for i in range(n, 0, -1):"],
            ["Index + value", "for i, v in enumerate(items):"],
            ["Two lists together", "for a, b in zip(xs, ys):"],
            ["Dict key + value", "for k, v in d.items():"],
            ["Squares one-liner", "[n**2 for n in nums]"],
            ["Filter one-liner", "[n for n in nums if n % 2 == 0]"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
