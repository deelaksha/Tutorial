"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "if", label: "Simple if" },
  { id: "if-else", label: "if / else" },
  { id: "elif", label: "elif Ladder" },
  { id: "nested", label: "Nested if" },
  { id: "ternary", label: "One-Line if (Ternary) ⭐" },
  { id: "truthy-conditions", label: "Truthy Conditions" },
  { id: "match", label: "match-case (3.10+)" },
  { id: "indentation", label: "Indentation Rules" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function IfElsePage() {
  return (
    <TopicShell
      icon="🔀"
      title="if / elif / else"
      gradientWord="if / elif / else"
      subtitle="Decision making — every branch drawn as a flow you can follow with your eyes. Plus the indentation crashes everyone hits once."
      nav={NAV}
      next={{ icon: "🔁", label: "for Loop", href: "/python/for-loop" }}
    >
      {/* 1 ─ if */}
      <Section id="if" number="01" title="Simple if — Run Only When True">
        <FlowDiagram
          steps={[
            { label: "condition?", sub: "age >= 18 → True or False" },
            { label: "True → run the indented block", sub: "False → skip it entirely" },
            { label: "continue after the block", sub: "un-indented code always runs" },
          ]}
        />
        <CodeBlock
          code={`age = 22\n\nif age >= 18:\n    print("you can vote")      # runs only if True\n    print("inside the block")\n\nprint("always runs")           # outside the if`}
          output={`you can vote\ninside the block\nalways runs`}
        />
        <Callout type="behind">
          The colon <IC>:</IC> opens a block, and <strong>indentation (4 spaces)</strong> is the
          block — Python has no <IC>{`{ }`}</IC>. Where indentation ends, the block ends.
        </Callout>
      </Section>

      {/* 2 ─ if else */}
      <Section id="if-else" number="02" title="if / else — Two Roads">
        <CodeBlock
          code={`marks = 35\n\nif marks >= 40:\n    print("PASS ✅")\nelse:\n    print("FAIL ❌")\n    print("try again")`}
          output={`FAIL ❌\ntry again`}
        />
        <CodeBlock
          code={`# even / odd — the classic\nn = 7\nif n % 2 == 0:\n    print(n, "is even")\nelse:\n    print(n, "is odd")`}
          output={`7 is odd`}
        />
        <Callout type="note">
          Exactly ONE of the two blocks runs — never both, never neither.
        </Callout>
      </Section>

      {/* 3 ─ elif */}
      <Section id="elif" number="03" title="elif Ladder — Many Roads, First Match Wins">
        <FlowDiagram
          steps={[
            { label: "if marks >= 90 → ❌", sub: "85 is not ≥ 90, move down" },
            { label: "elif marks >= 80 → ✅ STOP", sub: 'prints "Grade B" and EXITS the ladder' },
            { label: "remaining elif/else never checked", sub: "even though 85 >= 70 is also True" },
          ]}
        />
        <CodeBlock
          code={`marks = 85\n\nif marks >= 90:\n    print("Grade A")\nelif marks >= 80:\n    print("Grade B")     # ← first True wins\nelif marks >= 70:\n    print("Grade C")     # never reached (also True!)\nelse:\n    print("Grade F")`}
          output={`Grade B`}
        />
        <Callout type="mistake">
          Order matters! Put the <strong>strictest condition first</strong>. If{" "}
          <IC>marks &gt;= 70</IC> came first, a 95 would get Grade C.
        </Callout>
        <CodeBlock
          code={`# separate ifs ≠ elif ladder!\nmarks = 95\nif marks >= 90: print("A")\nif marks >= 80: print("B")   # ALSO runs — separate check\nif marks >= 70: print("C")   # ALSO runs`}
          output={`A\nB\nC`}
        />
      </Section>

      {/* 4 ─ nested */}
      <Section id="nested" number="04" title="Nested if — A Decision Inside a Decision">
        <CodeBlock
          code={`age = 22\nhas_ticket = True\n\nif age >= 18:\n    if has_ticket:\n        print("welcome in! 🎬")\n    else:\n        print("buy a ticket first")\nelse:\n    print("adults only")`}
          output={`welcome in! 🎬`}
        />
        <CodeBlock
          code={`# ✅ flatter with and — same logic, easier to read\nif age >= 18 and has_ticket:\n    print("welcome in! 🎬")`}
          output={`welcome in! 🎬`}
        />
        <Callout type="tip">
          More than 2 levels of nesting is a code smell — combine conditions with{" "}
          <IC>and</IC>/<IC>or</IC>, or return early inside functions.
        </Callout>
      </Section>

      {/* 5 ─ ternary */}
      <Section id="ternary" number="05" title="One-Line if — Ternary Expression ⭐">
        <P>
          Syntax: <IC>value_if_true if condition else value_if_false</IC> — an expression you
          can assign, print or pass.
        </P>
        <CodeBlock
          code={`age = 22\nstatus = "adult" if age >= 18 else "minor"\nprint(status)\n\nn = 8\nprint("even" if n % 2 == 0 else "odd")\n\n# inside f-strings — interview flex\nmarks = 75\nprint(f"Result: {'PASS' if marks >= 40 else 'FAIL'}")\n\n# max of two, no max()\na, b = 10, 25\nbiggest = a if a > b else b\nprint(biggest)`}
          output={`adult\neven\nResult: PASS\n25`}
        />
        <Callout type="mistake">
          Order is <IC>result if cond else other</IC> — NOT C-style <IC>cond ? a : b</IC>.
          Writing <IC>if age &gt;= 18 &quot;adult&quot;</IC> is a SyntaxError.
        </Callout>
      </Section>

      {/* 6 ─ truthy */}
      <Section id="truthy-conditions" number="06" title="Truthy Conditions — Pythonic Checks">
        <CodeBlock
          code={`name = ""\nif not name:                  # empty string is falsy\n    print("name is required")\n\ncart = [1, 2]\nif cart:                      # non-empty list is truthy\n    print(len(cart), "items in cart")\n\nresult = None\nif result is None:            # the ONLY correct None check\n    print("not computed yet")`}
          output={`name is required\n2 items in cart\nnot computed yet`}
        />
        <Table
          head={["❌ Verbose", "✅ Pythonic"]}
          rows={[
            ['if len(cart) > 0:', "if cart:"],
            ['if name != "":', "if name:"],
            ["if flag == True:", "if flag:"],
            ["if x == None:", "if x is None:"],
          ]}
        />
      </Section>

      {/* 7 ─ match */}
      <Section id="match" number="07" title="match-case — Python's switch (3.10+)">
        <CodeBlock
          code={`day = "sat"\n\nmatch day:\n    case "mon" | "tue" | "wed" | "thu" | "fri":\n        print("work day 💼")\n    case "sat" | "sun":\n        print("weekend 🎉")\n    case _:                      # default — matches anything\n        print("not a day")`}
          output={`weekend 🎉`}
        />
        <Callout type="note">
          <IC>case _:</IC> is the default branch. Unlike C, there is no fall-through — exactly
          one case runs. Needs Python 3.10 or newer.
        </Callout>
      </Section>

      {/* 8 ─ indentation */}
      <Section id="indentation" number="08" title="Indentation Rules — Where Beginners Crash">
        <CodeBlock
          code={`# 💥 forgot to indent\nif True:\nprint("hi")`}
          output={`  File "main.py", line 3\n    print("hi")\n    ^\nIndentationError: expected an indented block after 'if' statement on line 2`}
          error
        />
        <CodeBlock
          code={`# 💥 inconsistent indent inside one block\nif True:\n    print("four spaces")\n      print("six spaces??")`}
          output={`  File "main.py", line 4\n    print("six spaces??")\nIndentationError: unexpected indent`}
          error
        />
        <CodeBlock
          code={`# 💥 forgot the colon\nif True\n    print("hi")`}
          output={`  File "main.py", line 2\n    if True\n           ^\nSyntaxError: expected ':'`}
          error
        />
        <Callout type="tip">
          Pick <strong>4 spaces</strong>, never mix tabs and spaces. Any editor set to
          &quot;spaces, width 4&quot; makes these errors disappear forever.
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["IndentationError", "missing / uneven indent", "consistent 4 spaces"],
            ["SyntaxError", "missing : after if/elif/else", "always end header with :"],
            ["SyntaxError", "= instead of == in condition", "== compares, = assigns"],
            ["TypeError", 'if 5 < "10":', "compare same types only"],
            ["NameError", "condition uses undefined variable", "define before checking"],
          ]}
        />
        <CodeBlock
          title="SyntaxError — = vs =="
          code={`x = 5\nif x = 5:\n    print("five")`}
          output={`  File "main.py", line 2\n    if x = 5:\n       ^^^^^\nSyntaxError: invalid syntax. Maybe you meant '==' instead of '='?`}
          error
        />
        <Callout type="behind">
          Modern Python even suggests the fix in the error message — read tracebacks bottom-up:
          last line = what went wrong, lines above = where.
        </Callout>
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Ternary", '"adult" if age >= 18 else "minor"'],
            ["Even / odd", 'print("even" if n % 2 == 0 else "odd")'],
            ["Max of two (no max())", "big = a if a > b else b"],
            ["Empty check", "if not items:\n    print('empty')"],
            ["Range check", "if 18 <= age <= 60:"],
            ["None check", "if x is None:"],
            ["Grade ladder", "if m >= 90: ...\nelif m >= 80: ...\nelse: ..."],
            ["Ternary in f-string", "f\"{'PASS' if m >= 40 else 'FAIL'}\""],
          ]}
        />
        <Callout type="tip">
          Interview rule: <strong>first True wins</strong> in an elif ladder — order conditions
          from strictest to loosest.
        </Callout>
      </Section>
    </TopicShell>
  );
}
