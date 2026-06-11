"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "arithmetic", label: "Arithmetic" },
  { id: "division", label: "/, //, % — The Trio ⭐" },
  { id: "comparison", label: "Comparison" },
  { id: "logical", label: "Logical and/or/not" },
  { id: "short-circuit", label: "Short-Circuit Magic" },
  { id: "assignment-ops", label: "Assignment Ops (+=)" },
  { id: "identity-membership", label: "is & in" },
  { id: "precedence", label: "Precedence" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OperatorsPage() {
  return (
    <TopicShell
      icon="➗"
      title="Operators"
      gradientWord="Python Operators"
      subtitle="Arithmetic, comparison, logical, identity, membership — with precedence rules, short-circuit behavior, and every crash case."
      nav={NAV}
      next={{ icon: "🔀", label: "if / elif / else", href: "/python/if-else" }}
    >
      {/* 1 ─ arithmetic */}
      <Section id="arithmetic" number="01" title="Arithmetic Operators">
        <CodeBlock
          code={`a, b = 10, 3\nprint(a + b)    # add\nprint(a - b)    # subtract\nprint(a * b)    # multiply\nprint(a / b)    # divide (always float)\nprint(a // b)   # floor divide\nprint(a % b)    # modulo (remainder)\nprint(a ** b)   # power`}
          output={`13\n7\n30\n3.3333333333333335\n3\n1\n1000`}
        />
        <CodeBlock
          code={`# operators work on strings & lists too!\nprint("ab" + "cd")     # concatenate\nprint("ha" * 3)        # repeat\nprint([1, 2] + [3])    # join lists\nprint([0] * 4)         # repeat list`}
          output={`abcd\nhahaha\n[1, 2, 3]\n[0, 0, 0, 0]`}
        />
      </Section>

      {/* 2 ─ division trio */}
      <Section id="division" number="02" title="/, //, % — The Interview Trio ⭐">
        <Table
          head={["Operator", "Name", "10 ? 3", "Result type"]}
          rows={[
            ["/", "true division", "3.3333…", "always float"],
            ["//", "floor division", "3", "int (floors DOWN)"],
            ["%", "modulo / remainder", "1", "sign follows divisor"],
          ]}
        />
        <CodeBlock
          code={`print(7 // 2)     # 3\nprint(-7 // 2)    # -4  😮 floors DOWN, not toward zero\nprint(7 % 2)      # 1\nprint(-7 % 2)     # 1   😮 result has divisor's sign\nprint(7 % -2)     # -1`}
          output={`3\n-4\n1\n1\n-1`}
        />
        <Callout type="behind">
          Python floors toward <strong>negative infinity</strong> (C/Java truncate toward zero).
          Invariant kept: <IC>a == (a // b) * b + (a % b)</IC> — always.
        </Callout>
        <CodeBlock
          code={`# % superpowers\nprint(10 % 2 == 0)   # even check\nprint(135 % 10)      # last digit\nprint(135 // 10)     # drop last digit\nprint(27 % 12)       # clock wrap: 27:00 → 3 o'clock`}
          output={`True\n5\n13\n3`}
        />
      </Section>

      {/* 3 ─ comparison */}
      <Section id="comparison" number="03" title="Comparison Operators">
        <CodeBlock
          code={`a, b = 10, 3\nprint(a == b)   # equal\nprint(a != b)   # not equal\nprint(a > b, a < b)\nprint(a >= 10, b <= 2)\n\n# ⭐ chaining — unique to Python\nage = 22\nprint(18 <= age <= 60)     # one expression!\n\n# strings compare alphabetically\nprint("apple" < "banana")\nprint("Zebra" < "apple")   # CAPITALS come first (ASCII)`}
          output={`False\nTrue\nTrue False\nTrue False\nTrue\nTrue\nTrue`}
        />
        <Callout type="tip">
          <IC>18 &lt;= age &lt;= 60</IC> reads like math and is the Pythonic way — no{" "}
          <IC>and</IC> needed.
        </Callout>
        <CodeBlock
          code={`# 💥 different types can't be ordered\nprint(5 < "10")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(5 < "10")\nTypeError: '<' not supported between instances of 'int' and 'str'`}
          error
        />
      </Section>

      {/* 4 ─ logical */}
      <Section id="logical" number="04" title="Logical — and, or, not">
        <Table
          head={["Expression", "Result", "Rule"]}
          rows={[
            ["True and True", "True", "and → True only if BOTH true"],
            ["True and False", "False", ""],
            ["True or False", "True", "or → True if ANY true"],
            ["False or False", "False", ""],
            ["not True", "False", "not → flips"],
          ]}
        />
        <CodeBlock
          code={`age = 22\nhas_id = True\n\nif age >= 18 and has_id:\n    print("entry allowed")\n\nday = "sunday"\nif day == "saturday" or day == "sunday":\n    print("weekend!")\n\nlogged_in = False\nif not logged_in:\n    print("please log in")`}
          output={`entry allowed\nweekend!\nplease log in`}
        />
      </Section>

      {/* 5 ─ short circuit */}
      <Section id="short-circuit" number="05" title="Short-Circuit Magic">
        <P>
          <IC>and</IC>/<IC>or</IC> don&apos;t return True/False — they return{" "}
          <strong>one of the operands</strong>, and stop evaluating as soon as the answer is
          known.
        </P>
        <FlowDiagram
          steps={[
            { label: "x or y", sub: "x is truthy? return x (y never runs) — else return y" },
            { label: "x and y", sub: "x is falsy? return x (y never runs) — else return y" },
            { label: "Use it for guards & defaults", sub: 'name = user_input or "Guest"' },
          ]}
        />
        <CodeBlock
          code={`# default values with or\nname = "" or "Guest"\nprint(name)\n\nprint(0 or 42)        # 0 falsy → 42\nprint("hi" and 99)    # "hi" truthy → 99\n\n# guard pattern — prevents the crash!\nnums = []\nif nums and nums[0] > 10:     # nums is falsy → second part SKIPPED\n    print("big first item")\nelse:\n    print("safe: empty list never indexed")`}
          output={`Guest\n42\n99\nsafe: empty list never indexed`}
        />
        <Callout type="tip">
          <IC>if nums and nums[0] &gt; 10</IC> is the classic guard: the right side only runs
          when the list is non-empty, so no IndexError is possible.
        </Callout>
      </Section>

      {/* 6 ─ assignment ops */}
      <Section id="assignment-ops" number="06" title="Assignment Operators (+= family)">
        <CodeBlock
          code={`score = 10\nscore += 5;  print(score)   # score = score + 5\nscore -= 3;  print(score)\nscore *= 2;  print(score)\nscore //= 4; print(score)\nscore **= 3; print(score)\nscore %= 7;  print(score)`}
          output={`15\n12\n24\n6\n216\n6`}
        />
        <CodeBlock
          code={`# 💥 Python has NO ++ / --\nx = 5\nx++`}
          output={`  File "main.py", line 3\n    x++\n       ^\nSyntaxError: invalid syntax`}
          error
        />
        <Callout type="mistake">
          Coming from C/Java? <IC>x++</IC> doesn&apos;t exist. Use <IC>x += 1</IC>. (Fun trap:{" "}
          <IC>++x</IC> &quot;works&quot; but does nothing — it&apos;s just double unary plus.)
        </Callout>
      </Section>

      {/* 7 ─ identity & membership */}
      <Section id="identity-membership" number="07" title="Identity (is) & Membership (in)">
        <CodeBlock
          code={`a = [1, 2, 3]\nb = [1, 2, 3]\nc = a\n\nprint(a == b)    # values equal → True\nprint(a is b)    # different objects → False\nprint(a is c)    # same object → True\n\nprint(2 in a)\nprint(9 not in a)\nprint("ee" in "Deelaksha")\nprint("name" in {"name": "Dee", "age": 22})   # checks KEYS`}
          output={`True\nFalse\nTrue\nTrue\nTrue\nTrue\nTrue`}
        />
        <Callout type="mistake">
          <IC>in</IC> on a dict checks <strong>keys</strong>, not values. For values:{" "}
          <IC>22 in d.values()</IC>.
        </Callout>
      </Section>

      {/* 8 ─ precedence */}
      <Section id="precedence" number="08" title="Precedence — Who Goes First?">
        <Table
          head={["Priority", "Operators", "Example"]}
          rows={[
            ["1 (highest)", "()", "(2 + 3) * 4"],
            ["2", "**", "2 ** 3 ** 2 = 512 (right-to-left!)"],
            ["3", "unary -x, +x", "-3 ** 2 = -9 (** binds first)"],
            ["4", "*, /, //, %", "2 + 3 * 4 = 14"],
            ["5", "+, -", ""],
            ["6", "==, !=, <, >, <=, >=, is, in", "comparisons"],
            ["7", "not", "not x == y → not (x == y)"],
            ["8", "and", ""],
            ["9 (lowest)", "or", "a or b and c → a or (b and c)"],
          ]}
        />
        <CodeBlock
          code={`print(2 + 3 * 4)        # 14, not 20\nprint(2 ** 3 ** 2)      # 512 — ** is RIGHT to left: 2**(3**2)\nprint(-3 ** 2)          # -9 — ** before unary minus\nprint((-3) ** 2)        # 9\nprint(True or False and False)   # True — and binds tighter`}
          output={`14\n512\n-9\n9\nTrue`}
        />
        <Callout type="tip">
          Don&apos;t memorize the whole ladder — when in doubt, add parentheses. Readers will thank
          you.
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="ZeroDivisionError — all three division ops"
          code={`print(10 / 0)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(10 / 0)\nZeroDivisionError: division by zero`}
          error
        />
        <CodeBlock
          title="ZeroDivisionError — modulo too"
          code={`print(10 % 0)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(10 % 0)\nZeroDivisionError: integer modulo by zero`}
          error
        />
        <CodeBlock
          title="TypeError — mixed-type math"
          code={`print("5" + 3)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print("5" + 3)\nTypeError: can only concatenate str (not "int") to str`}
          error
        />
        <CodeBlock
          title="TypeError — ordering mixed types"
          code={`print([1, 2] < "abc")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print([1, 2] < "abc")\nTypeError: '<' not supported between instances of 'list' and 'str'`}
          error
        />
        <Callout type="note">
          Surprise: <IC>&quot;5&quot; * 3</IC> does NOT crash — it repeats: <IC>555</IC>. Only{" "}
          <IC>+</IC> between str and int crashes.
        </Callout>
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Even / odd", "n % 2 == 0   # even"],
            ["Last digit / drop it", "n % 10\nn // 10"],
            ["Range check (chained)", "18 <= age <= 60"],
            ["Default with or", 'name = user_input or "Guest"'],
            ["Guard with and", "if nums and nums[0] > 10:"],
            ["Floor vs true division", "7 / 2   # 3.5\n7 // 2  # 3\n-7 // 2 # -4 (!)"],
            ["Power is right-assoc", "2 ** 3 ** 2   # 512"],
            ["No ++ in Python", "x += 1"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
