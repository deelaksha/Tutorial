"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "break", label: "break — Exit Now" },
  { id: "continue", label: "continue — Skip One" },
  { id: "pass", label: "pass — Do Nothing" },
  { id: "compare", label: "break vs continue vs pass" },
  { id: "for-else", label: "for ... else (Search)" },
  { id: "nested-break", label: "Breaking Nested Loops" },
  { id: "real-patterns", label: "Real Patterns" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function LoopControlPage() {
  return (
    <TopicShell
      icon="🚦"
      title="Loop Control"
      gradientWord="break · continue · pass"
      subtitle="The traffic signals of loops: stop completely, skip one round, or do nothing. Plus for-else search and escaping nested loops."
      nav={NAV}
      next={{ icon: "📋", label: "Lists", href: "/python/lists" }}
    >
      {/* 1 ─ break */}
      <Section id="break" number="01" title="break — Exit the Loop Now">
        <FlowDiagram
          steps={[
            { label: "loop running normally", sub: "1, 2, 3 …" },
            { label: "hit break", sub: "loop ends INSTANTLY — rest of block skipped" },
            { label: "jump to first line AFTER the loop", sub: "remaining items never visited" },
          ]}
        />
        <CodeBlock
          code={`for i in range(1, 10):\n    if i == 5:\n        print("found 5 — stopping")\n        break\n    print(i, end=" ")\nprint("\\nafter the loop")`}
          output={`1 2 3 4 \nfound 5 — stopping\nafter the loop`}
        />
        <CodeBlock
          code={`# search a list — stop at first match\nnames = ["John", "Maya", "Deelaksha", "Ravi"]\nfor name in names:\n    if name.startswith("D"):\n        print("first D-name:", name)\n        break       # Ravi is never checked — efficient!`}
          output={`first D-name: Deelaksha`}
        />
        <Callout type="analogy">
          <strong>break = emergency exit 🚪</strong> — you leave the building immediately, no
          matter how many floors were left.
        </Callout>
      </Section>

      {/* 2 ─ continue */}
      <Section id="continue" number="02" title="continue — Skip This Round Only">
        <FlowDiagram
          steps={[
            { label: "hit continue", sub: "rest of THIS round is skipped" },
            { label: "jump back to the top", sub: "loop continues with the NEXT item" },
            { label: "loop still finishes normally", sub: "only some rounds were shortened" },
          ]}
        />
        <CodeBlock
          code={`for i in range(1, 8):\n    if i % 2 == 0:\n        continue        # skip even numbers\n    print(i, end=" ")    # only odd reach here`}
          output={`1 3 5 7 `}
        />
        <CodeBlock
          code={`# skip bad data, process the rest\nmarks = [90, -5, 85, 200, 78]\nfor m in marks:\n    if m < 0 or m > 100:\n        print("skipping invalid:", m)\n        continue\n    print("valid mark:", m)`}
          output={`valid mark: 90\nskipping invalid: -5\nvalid mark: 85\nskipping invalid: 200\nvalid mark: 78`}
        />
        <Callout type="analogy">
          <strong>continue = skip this song ⏭️</strong> — the playlist keeps playing, you just
          jumped to the next track.
        </Callout>
      </Section>

      {/* 3 ─ pass */}
      <Section id="pass" number="03" title="pass — Placeholder That Does Nothing">
        <P>
          Python forbids empty blocks. <IC>pass</IC> fills the hole so the file runs while
          you&apos;re still writing the real code.
        </P>
        <CodeBlock
          code={`# 💥 an empty block is a SyntaxError\nif True:\n\nprint("hi")`}
          output={`  File "main.py", line 3\n    print("hi")\n    ^\nIndentationError: expected an indented block after 'if' statement on line 2`}
          error
        />
        <CodeBlock
          code={`# ✅ pass fills the gap\nfor i in range(3):\n    pass            # TODO: handle later\n\ndef coming_soon():\n    pass            # function exists, does nothing yet\n\nclass Draft:\n    pass\n\nprint("everything runs fine")`}
          output={`everything runs fine`}
        />
        <Callout type="mistake">
          <IC>pass</IC> does NOT skip anything — it literally does nothing and the loop keeps
          going. Don&apos;t confuse it with <IC>continue</IC>.
        </Callout>
      </Section>

      {/* 4 ─ compare */}
      <Section id="compare" number="04" title="break vs continue vs pass — Side by Side">
        <CodeBlock
          code={`for i in range(1, 6):\n    if i == 3: break\n    print(i, end=" ")\nprint("← break: stops at 3")\n\nfor i in range(1, 6):\n    if i == 3: continue\n    print(i, end=" ")\nprint("← continue: skips 3")\n\nfor i in range(1, 6):\n    if i == 3: pass\n    print(i, end=" ")\nprint("← pass: changes nothing")`}
          output={`1 2 ← break: stops at 3\n1 2 4 5 ← continue: skips 3\n1 2 3 4 5 ← pass: changes nothing`}
        />
        <Table
          head={["Keyword", "Effect on loop", "Analogy"]}
          rows={[
            ["break", "ends the WHOLE loop", "emergency exit 🚪"],
            ["continue", "skips THIS round only", "skip the song ⏭️"],
            ["pass", "nothing at all", "blank tile 🧱 (placeholder)"],
          ]}
        />
      </Section>

      {/* 5 ─ for else */}
      <Section id="for-else" number="05" title="for ... else — The Search Idiom">
        <P>
          <IC>else</IC> after a loop runs only when the loop finished{" "}
          <strong>without break</strong>. Perfect for &quot;searched everything, found nothing&quot;.
        </P>
        <CodeBlock
          code={`names = ["John", "Maya", "Ravi"]\ntarget = "Deelaksha"\n\nfor name in names:\n    if name == target:\n        print("found!")\n        break\nelse:                          # ← belongs to FOR, not if!\n    print(target, "not found")`}
          output={`Deelaksha not found`}
        />
        <CodeBlock
          code={`# prime check — the textbook use\nn = 13\nfor i in range(2, n):\n    if n % i == 0:\n        print(n, "is NOT prime, divisible by", i)\n        break\nelse:\n    print(n, "is prime ✅")`}
          output={`13 is prime ✅`}
        />
        <Callout type="behind">
          Read it as &quot;<strong>else = no break happened</strong>&quot;. Without for-else you&apos;d need a{" "}
          <IC>found = False</IC> flag variable — this idiom deletes it.
        </Callout>
      </Section>

      {/* 6 ─ nested break */}
      <Section id="nested-break" number="06" title="Breaking Out of Nested Loops">
        <P>
          <IC>break</IC> only exits <strong>one</strong> level — the innermost loop it lives in.
        </P>
        <CodeBlock
          code={`for i in range(1, 4):\n    for j in range(1, 4):\n        if j == 2:\n            break          # exits INNER loop only\n        print(f"i={i} j={j}")\nprint("outer loop ran all 3 times")`}
          output={`i=1 j=1\ni=2 j=1\ni=3 j=1\nouter loop ran all 3 times`}
        />
        <CodeBlock
          code={`# escape BOTH loops — flag + break\nfound = False\nfor i in range(1, 4):\n    for j in range(1, 4):\n        if i * j == 6:\n            print(f"hit: {i} x {j} = 6")\n            found = True\n            break\n    if found:\n        break`}
          output={`hit: 2 x 3 = 6`}
        />
        <CodeBlock
          code={`# ✅ cleaner: wrap in a function and return\ndef find_pair():\n    for i in range(1, 4):\n        for j in range(1, 4):\n            if i * j == 6:\n                return i, j      # exits EVERYTHING at once\n\nprint(find_pair())`}
          output={`(2, 3)`}
        />
        <Callout type="tip">
          Interview answer: &quot;Python has no labeled break. Use a flag, or better — put the loops
          in a function and <IC>return</IC>.&quot;
        </Callout>
      </Section>

      {/* 7 ─ real patterns */}
      <Section id="real-patterns" number="07" title="Real Patterns You'll Reuse">
        <CodeBlock
          title="retry with limit"
          code={`attempts = ["wrong", "wrong", "secret123"]   # simulated inputs\n\nfor attempt in range(3):\n    pwd = attempts[attempt]\n    if pwd == "secret123":\n        print("✅ logged in")\n        break\n    print("❌ wrong, try again")\nelse:\n    print("🔒 account locked")`}
          output={`❌ wrong, try again\n❌ wrong, try again\n✅ logged in`}
        />
        <CodeBlock
          title="first match wins"
          code={`nums = [7, 14, 9, 28, 5]\nfor n in nums:\n    if n % 2 == 0:\n        print("first even:", n)\n        break`}
          output={`first even: 14`}
        />
        <CodeBlock
          title="filter + early stop combined"
          code={`logs = ["ok", "ok", "skip", "ok", "FATAL", "ok"]\nfor line in logs:\n    if line == "skip":\n        continue\n    if line == "FATAL":\n        print("stopping at fatal error")\n        break\n    print("processing", line)`}
          output={`processing ok\nprocessing ok\nprocessing ok\nstopping at fatal error`}
        />
      </Section>

      {/* 8 ─ exceptions */}
      <Section id="exceptions" number="08" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="SyntaxError — break outside a loop"
          code={`x = 5\nif x == 5:\n    break        # not inside any loop!`}
          output={`  File "main.py", line 3\n    break\n    ^^^^^\nSyntaxError: 'break' outside loop`}
          error
        />
        <CodeBlock
          title="SyntaxError — continue outside a loop"
          code={`def f():\n    continue`}
          output={`  File "main.py", line 2\n    continue\n    ^^^^^^^^\nSyntaxError: 'continue' not properly in loop`}
          error
        />
        <Callout type="mistake">
          <IC>break</IC>/<IC>continue</IC> work only inside <IC>for</IC>/<IC>while</IC>. An{" "}
          <IC>if</IC> block alone doesn&apos;t count — the if must be <em>inside</em> a loop.
        </Callout>
        <CodeBlock
          title="Logic bug — unreachable code after break"
          code={`for i in range(3):\n    break\n    print("never printed")   # dead code — no error, no output\nprint("loop did nothing visible")`}
          output={`loop did nothing visible`}
        />
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Stop at first match", "for x in items:\n    if match(x):\n        break"],
            ["Skip invalid items", "for x in items:\n    if bad(x):\n        continue\n    process(x)"],
            ["Searched, not found", "for x in items:\n    if x == target:\n        break\nelse:\n    print('not found')"],
            ["Prime check", "for i in range(2, n):\n    if n % i == 0:\n        break\nelse:\n    print('prime')"],
            ["Escape nested loops", "def find():\n    for ...:\n        for ...:\n            return answer"],
            ["Placeholder body", "def todo():\n    pass"],
            ["Retry 3 times", "for attempt in range(3):\n    ...\nelse:\n    print('locked')"],
            ["The difference", "break    # exit loop\ncontinue # next round\npass     # nothing"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
