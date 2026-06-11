"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "basic", label: "Basic while" },
  { id: "anatomy", label: "The 3-Part Anatomy" },
  { id: "vs-for", label: "while vs for" },
  { id: "infinite", label: "Infinite Loops ⚠️" },
  { id: "sentinel", label: "while True + break" },
  { id: "countdown", label: "Counting Down" },
  { id: "digits", label: "Digit Tricks ⭐" },
  { id: "while-else", label: "while ... else" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function WhileLoopPage() {
  return (
    <TopicShell
      icon="⏳"
      title="while Loop"
      gradientWord="while Loop"
      subtitle="Repeat as long as a condition stays True. Sentinels, digit tricks, and how infinite loops happen — visualized step by step."
      nav={NAV}
      next={{ icon: "🚦", label: "Loop Control", href: "/python/loop-control" }}
    >
      {/* 1 ─ basic */}
      <Section id="basic" number="01" title="Basic while — Repeat While True">
        <FlowDiagram
          steps={[
            { label: "check the condition", sub: "i <= 5 ?" },
            { label: "True → run block, jump back up", sub: "print(i); i += 1 … check again" },
            { label: "False → exit loop", sub: "continue after the loop" },
          ]}
        />
        <CodeBlock
          code={`i = 1\nwhile i <= 5:\n    print(i, end=" ")\n    i += 1        # ← without this: infinite loop!\nprint("\\ndone, i is now", i)`}
          output={`1 2 3 4 5 \ndone, i is now 6`}
        />
        <Callout type="note">
          After the loop ends, <IC>i</IC> is 6 — the first value that made the condition False.
          A classic interview question.
        </Callout>
      </Section>

      {/* 2 ─ anatomy */}
      <Section id="anatomy" number="02" title="The 3-Part Anatomy">
        <Table
          head={["Part", "Where", "Example", "Forget it →"]}
          rows={[
            ["1. Initialize", "before the loop", "i = 1", "NameError"],
            ["2. Condition", "while line", "while i <= 5:", "loop never runs / never stops"],
            ["3. Update", "inside the block", "i += 1", "♾️ infinite loop"],
          ]}
        />
        <CodeBlock
          code={`# all three parts labeled\ncount = 0              # 1️⃣ initialize\nwhile count < 3:       # 2️⃣ condition\n    print("hello", count)\n    count += 1         # 3️⃣ update`}
          output={`hello 0\nhello 1\nhello 2`}
        />
      </Section>

      {/* 3 ─ vs for */}
      <Section id="vs-for" number="03" title="while vs for — Which One When?">
        <Table
          head={["Use for 🔁", "Use while ⏳"]}
          rows={[
            ["you KNOW how many times", "you DON'T know how many times"],
            ["walking a list / string / range", "waiting for a condition to change"],
            ["for i in range(10):", "while balance > 0:"],
            ["for ch in name:", "while user_input != 'quit':"],
          ]}
        />
        <CodeBlock
          code={`# same output, two styles\nfor i in range(3):\n    print("for", i)\n\ni = 0\nwhile i < 3:\n    print("while", i)\n    i += 1`}
          output={`for 0\nfor 1\nfor 2\nwhile 0\nwhile 1\nwhile 2`}
        />
        <Callout type="tip">
          Rule of thumb: <strong>known count → for, unknown count → while</strong>. If you can
          write it with for, prefer for — no update line to forget.
        </Callout>
      </Section>

      {/* 4 ─ infinite */}
      <Section id="infinite" number="04" title="Infinite Loops — The ⚠️ Case">
        <CodeBlock
          runnable={false}
          title="⚠️ never run this"
          code={`i = 1\nwhile i <= 5:\n    print(i)\n    # forgot i += 1  →  condition NEVER becomes False\n    # prints 1 forever... Ctrl+C to kill it`}
          output={`1\n1\n1\n1\n... (forever — press Ctrl+C)\nKeyboardInterrupt`}
        />
        <Table
          head={["Bug", "Why it never ends"]}
          rows={[
            ["forgot the update line", "i stays 1 forever"],
            ["update goes the wrong way (i -= 1)", "moves AWAY from the exit"],
            ["condition always True (while 1 < 2:)", "nothing inside changes it"],
            ["update outside the block (not indented)", "runs only after the loop — too late"],
          ]}
        />
        <Callout type="tip">
          Stuck in an infinite loop? Press <IC>Ctrl+C</IC> — Python raises{" "}
          <IC>KeyboardInterrupt</IC> and stops.
        </Callout>
      </Section>

      {/* 5 ─ sentinel */}
      <Section id="sentinel" number="05" title="while True + break — The Menu Pattern">
        <P>
          Deliberate infinite loop with an exit door inside — the standard shape for menus,
          games and input validation.
        </P>
        <CodeBlock
          code={`commands = ["hello", "time", "quit"]   # simulating user input\ni = 0\n\nwhile True:\n    cmd = commands[i]; i += 1     # pretend: cmd = input("> ")\n    print(">", cmd)\n    if cmd == "quit":\n        print("bye!")\n        break                     # ← the only exit\n    print("running", cmd)`}
          output={`> hello\nrunning hello\n> time\nrunning time\n> quit\nbye!`}
        />
        <FlowDiagram
          steps={[
            { label: "while True:", sub: "loop forever on purpose" },
            { label: "get input → check for the exit word", sub: 'if cmd == "quit": break' },
            { label: "break jumps OUT immediately", sub: "code after the loop runs" },
          ]}
        />
      </Section>

      {/* 6 ─ countdown */}
      <Section id="countdown" number="06" title="Counting Down & Halving">
        <CodeBlock
          code={`n = 5\nwhile n > 0:\n    print(n, end=" ")\n    n -= 1\nprint("liftoff! 🚀")`}
          output={`5 4 3 2 1 liftoff! 🚀`}
        />
        <CodeBlock
          code={`# halving — how binary search thinks\nn = 100\nsteps = 0\nwhile n > 1:\n    n //= 2\n    steps += 1\n    print(f"step {steps}: n = {n}")\nprint("halved", steps, "times")`}
          output={`step 1: n = 50\nstep 2: n = 25\nstep 3: n = 12\nstep 4: n = 6\nstep 5: n = 3\nstep 6: n = 1\nhalved 6 times`}
        />
      </Section>

      {/* 7 ─ digits */}
      <Section id="digits" number="07" title="Digit Tricks — Interview Gold ⭐">
        <P>
          The <IC>% 10</IC> / <IC>// 10</IC> combo peels digits off a number one by one — powers
          reverse-a-number, palindrome, digit-sum and Armstrong questions.
        </P>
        <CodeBlock
          code={`# sum of digits\nn = 1234\ntotal = 0\nwhile n > 0:\n    digit = n % 10      # grab last digit\n    total += digit\n    n //= 10            # chop it off\nprint("digit sum:", total)`}
          output={`digit sum: 10`}
        />
        <CodeBlock
          code={`# reverse a number — THE classic\nn = 1234\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n % 10\n    n //= 10\nprint("reversed:", rev)`}
          output={`reversed: 4321`}
        />
        <Table
          head={["Step", "n", "n % 10", "rev = rev*10 + digit"]}
          rows={[
            ["1", "1234", "4", "0*10 + 4 = 4"],
            ["2", "123", "3", "4*10 + 3 = 43"],
            ["3", "12", "2", "43*10 + 2 = 432"],
            ["4", "1", "1", "432*10 + 1 = 4321"],
          ]}
        />
        <CodeBlock
          code={`# number palindrome — combine both ideas\nn = 121\noriginal = n\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n % 10\n    n //= 10\nprint(original == rev)`}
          output={`True`}
        />
      </Section>

      {/* 8 ─ while else */}
      <Section id="while-else" number="08" title="while ... else — The Rare One">
        <P>
          The <IC>else</IC> block runs only if the loop ended <strong>naturally</strong>{" "}
          (condition became False) — it is skipped when you <IC>break</IC>.
        </P>
        <CodeBlock
          code={`i = 1\nwhile i <= 3:\n    print(i)\n    i += 1\nelse:\n    print("loop finished cleanly ✅")\n\n# with break → else is SKIPPED\nj = 1\nwhile j <= 3:\n    if j == 2:\n        break\n    print(j)\n    j += 1\nelse:\n    print("never printed")`}
          output={`1\n2\n3\nloop finished cleanly ✅\n1`}
        />
        <Callout type="note">
          Mostly used in search loops: &quot;found → break, else → not found&quot;. More on this in the
          Loop Control page.
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="NameError — forgot to initialize"
          code={`while count < 3:     # count was never created\n    print(count)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    while count < 3:\nNameError: name 'count' is not defined`}
          error
        />
        <CodeBlock
          title="KeyboardInterrupt — killing an infinite loop"
          code={`while True:\n    pass     # Ctrl+C pressed...`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    pass\nKeyboardInterrupt`}
          error
        />
        <CodeBlock
          title="TypeError — condition mixing types"
          code={`limit = "5"           # string from input()\ni = 0\nwhile i < limit:\n    i += 1`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    while i < limit:\nTypeError: '<' not supported between instances of 'int' and 'str'`}
          error
        />
        <Callout type="tip">
          <IC>input()</IC> always returns a string — convert with <IC>int(input())</IC> before
          using it in a numeric condition.
        </Callout>
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["The skeleton", "i = 0\nwhile i < n:\n    ...\n    i += 1"],
            ["Menu / game loop", "while True:\n    ...\n    if done: break"],
            ["Reverse a number", "rev = rev * 10 + n % 10\nn //= 10"],
            ["Sum of digits", "total += n % 10\nn //= 10"],
            ["Countdown", "while n > 0:\n    n -= 1"],
            ["Halving (binary search idea)", "while n > 1:\n    n //= 2"],
            ["Input validation", "while not valid:\n    ask again"],
            ["else = no break", "while ...:\n    ...\nelse:\n    print('clean finish')"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
