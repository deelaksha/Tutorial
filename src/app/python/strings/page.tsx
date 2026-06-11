"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "creating", label: "Creating Strings" },
  { id: "indexing", label: "Indexing" },
  { id: "slicing", label: "Slicing ⭐" },
  { id: "immutable", label: "Immutability" },
  { id: "methods-case", label: "Case Methods" },
  { id: "methods-search", label: "Search & Replace" },
  { id: "methods-clean", label: "Cleaning & Checking" },
  { id: "split-join", label: "split & join ⭐" },
  { id: "reverse", label: "Reverse & Palindrome" },
  { id: "loops", label: "Looping Characters" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

/* visual: indexed character boxes */
function CharBoxes({ word }: { word: string }) {
  const chars = word.split("");
  return (
    <div className="my-5 overflow-x-auto">
      <div className="inline-flex flex-col">
        <div className="flex">
          {chars.map((c, i) => (
            <div key={i} className="code-font flex h-7 w-10 items-center justify-center text-[10px] text-sky-400">
              {i}
            </div>
          ))}
        </div>
        <div className="flex">
          {chars.map((c, i) => (
            <div
              key={i}
              className="code-font flex h-10 w-10 items-center justify-center border border-slate-700 bg-slate-900/80 text-sm font-bold text-amber-300 first:rounded-l-lg last:rounded-r-lg"
            >
              {c}
            </div>
          ))}
        </div>
        <div className="flex">
          {chars.map((_, i) => (
            <div key={i} className="code-font flex h-7 w-10 items-center justify-center text-[10px] text-rose-400">
              {i - chars.length}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        <span className="text-sky-400">blue = forward index</span> ·{" "}
        <span className="text-rose-400">red = negative index</span>
      </div>
    </div>
  );
}

export default function StringsPage() {
  return (
    <TopicShell
      icon="🧵"
      title="Strings"
      gradientWord="Python Strings"
      subtitle="Text, character by character. Indexing, slicing, every must-know method, immutability — with each crash case demonstrated."
      nav={NAV}
      next={{ icon: "➗", label: "Operators", href: "/python/operators" }}
    >
      {/* 1 ─ creating */}
      <Section id="creating" number="01" title="Creating Strings">
        <CodeBlock
          code={`a = 'single quotes'\nb = "double quotes"        # same thing\nc = "it's easy"            # mix to avoid escaping\nd = """multi\nline\nstring"""\n\nprint(c)\nprint(d)\nprint(len(d))              # \\n counts as 1 char`}
          output={`it's easy\nmulti\nline\nstring\n17`}
        />
        <Callout type="note">
          <IC>&apos;...&apos;</IC> and <IC>&quot;...&quot;</IC> are identical. Triple quotes keep real line breaks
          and are also used for docstrings.
        </Callout>
      </Section>

      {/* 2 ─ indexing */}
      <Section id="indexing" number="02" title="Indexing — One Character at a Time">
        <CharBoxes word="DEELAKSHA" />
        <CodeBlock
          code={`name = "DEELAKSHA"\nprint(name[0])     # first\nprint(name[3])\nprint(name[-1])    # last — negative counts from the end\nprint(name[-2])`}
          output={`D\nL\nA\nH`}
        />
        <CodeBlock
          code={`# 💥 index out of range\nname = "DEELAKSHA"   # len = 9, last index = 8\nprint(name[9])`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print(name[9])\nIndexError: string index out of range`}
          error
        />
        <Callout type="tip">
          Last valid index is always <IC>len(s) - 1</IC>. Or skip the math: <IC>s[-1]</IC> is
          always the last character.
        </Callout>
      </Section>

      {/* 3 ─ slicing */}
      <Section id="slicing" number="03" title="Slicing — s[start : stop : step] ⭐">
        <P>
          Slicing cuts out a piece: <strong>start is included, stop is excluded</strong>. Any
          part can be omitted.
        </P>
        <CharBoxes word="PYTHON" />
        <CodeBlock
          code={`s = "PYTHON"\nprint(s[0:3])    # index 0,1,2 — stop 3 EXCLUDED\nprint(s[2:])     # from 2 to end\nprint(s[:4])     # start to 3\nprint(s[-3:])    # last three\nprint(s[::2])    # every 2nd char\nprint(s[::-1])   # ⭐ reversed!`}
          output={`PYT\nTHON\nPYTH\nHON\nPTO\nNOHTYP`}
        />
        <Table
          head={["Slice", "Reads as", "Result for \"PYTHON\""]}
          rows={[
            ["s[0:3]", "chars 0,1,2", "PYT"],
            ["s[2:]", "from 2 to end", "THON"],
            ["s[:4]", "start up to 3", "PYTH"],
            ["s[-3:]", "last 3", "HON"],
            ["s[::2]", "every 2nd", "PTO"],
            ["s[::-1]", "reversed", "NOHTYP"],
          ]}
        />
        <Callout type="behind">
          Slices never crash! <IC>s[2:100]</IC> quietly stops at the end and{" "}
          <IC>s[50:60]</IC> returns <IC>&quot;&quot;</IC>. Only single-index access raises IndexError.
        </Callout>
      </Section>

      {/* 4 ─ immutable */}
      <Section id="immutable" number="04" title="Strings are Immutable">
        <CodeBlock
          code={`# 💥 you cannot change a character in place\nname = "deelaksha"\nname[0] = "D"`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    name[0] = "D"\nTypeError: 'str' object does not support item assignment`}
          error
        />
        <CodeBlock
          code={`# ✅ build a NEW string instead\nname = "deelaksha"\nname = "D" + name[1:]\nprint(name)\n\n# or simply\nprint("deelaksha".capitalize())`}
          output={`Deelaksha\nDeelaksha`}
        />
        <Callout type="behind">
          Every &quot;modifying&quot; method (<IC>upper()</IC>, <IC>replace()</IC>…) returns a{" "}
          <strong>new string</strong> — the original is untouched. That&apos;s why you must write{" "}
          <IC>s = s.upper()</IC>, not just <IC>s.upper()</IC>.
        </Callout>
      </Section>

      {/* 5 ─ case methods */}
      <Section id="methods-case" number="05" title="Case Methods">
        <CodeBlock
          code={`s = "deeLAKsha is LEARNING python"\nprint(s.upper())\nprint(s.lower())\nprint(s.title())\nprint(s.capitalize())\nprint(s.swapcase())`}
          output={`DEELAKSHA IS LEARNING PYTHON\ndeelaksha is learning python\nDeelaksha Is Learning Python\nDeelaksha is learning python\nDEElakSHA IS learning PYTHON`}
        />
        <CodeBlock
          code={`# the original NEVER changes\ns = "hello"\ns.upper()\nprint(s)          # still lowercase!\n\ns = s.upper()     # ✅ reassign to keep it\nprint(s)`}
          output={`hello\nHELLO`}
        />
      </Section>

      {/* 6 ─ search / replace */}
      <Section id="methods-search" number="06" title="Search & Replace">
        <CodeBlock
          code={`msg = "python is fun, python is easy"\n\nprint("python" in msg)        # membership test\nprint(msg.count("python"))\nprint(msg.find("fun"))        # index, or -1 if absent\nprint(msg.find("java"))       # -1, NO crash\nprint(msg.index("fun"))       # like find, but crashes if absent\nprint(msg.replace("python", "Python"))\nprint(msg.replace("python", "Python", 1))   # only first`}
          output={`True\n2\n10\n-1\n10\nPython is fun, Python is easy\nPython is fun, python is easy`}
        />
        <CodeBlock
          code={`# 💥 index() crashes when not found (find() returns -1)\nmsg = "python is fun"\nprint(msg.index("java"))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print(msg.index("java"))\nValueError: substring not found`}
          error
        />
        <Table
          head={["Method", "Not found →", "Use when"]}
          rows={[
            ['find("x")', "-1", "you'll handle the -1 yourself"],
            ['index("x")', "💥 ValueError", "absence is a bug worth crashing on"],
            ['"x" in s', "False", "you only need yes / no"],
          ]}
        />
      </Section>

      {/* 7 ─ cleaning & checking */}
      <Section id="methods-clean" number="07" title="Cleaning & Checking">
        <CodeBlock
          code={`raw = "   deelaksha@mail.com   "\nprint(repr(raw.strip()))     # both sides\nprint(repr(raw.lstrip()))    # left only\nprint(repr(raw.rstrip()))    # right only`}
          output={`'deelaksha@mail.com'\n'deelaksha@mail.com   '\n'   deelaksha@mail.com'`}
        />
        <CodeBlock
          code={`print("12345".isdigit())\nprint("abc".isalpha())\nprint("abc123".isalnum())\nprint("   ".isspace())\nprint("Hello World".istitle())\nprint("python".startswith("py"))\nprint("report.pdf".endswith(".pdf"))`}
          output={`True\nTrue\nTrue\nTrue\nTrue\nTrue\nTrue`}
        />
        <Callout type="tip">
          Validate user input before converting: <IC>if s.isdigit(): n = int(s)</IC> — avoids a
          ValueError crash.
        </Callout>
      </Section>

      {/* 8 ─ split / join */}
      <Section id="split-join" number="08" title="split & join — Inverse Twins ⭐">
        <FlowDiagram
          steps={[
            { label: '"a,b,c".split(",")', sub: "string → list: ['a', 'b', 'c']" },
            { label: "work on the list", sub: "filter, sort, transform…" },
            { label: `"-".join(['a','b','c'])`, sub: 'list → string: "a-b-c"' },
          ]}
        />
        <CodeBlock
          code={`csv = "Deelaksha,22,Bangalore"\nparts = csv.split(",")\nprint(parts)\n\nsentence = "python is so easy"\nwords = sentence.split()        # default: any whitespace\nprint(words)\nprint(len(words), "words")\n\nprint(" ".join(words))\nprint("-".join(words))\nprint("".join(reversed("abc")))`}
          output={`['Deelaksha', '22', 'Bangalore']\n['python', 'is', 'so', 'easy']\n4 words\npython is so easy\npython-is-so-easy\ncba`}
        />
        <CodeBlock
          code={`# 💥 join only accepts strings\nnums = [1, 2, 3]\nprint("-".join(nums))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print("-".join(nums))\nTypeError: sequence item 0: expected str instance, int found`}
          error
        />
        <Callout type="tip">
          Fix: convert first — <IC>&quot;-&quot;.join(str(n) for n in nums)</IC> → <IC>1-2-3</IC>.
        </Callout>
      </Section>

      {/* 9 ─ reverse / palindrome */}
      <Section id="reverse" number="09" title="Reverse & Palindrome — Interview Classics">
        <CodeBlock
          code={`s = "level"\n\n# reverse in one slice\nprint(s[::-1])\n\n# palindrome check — one line\nprint(s == s[::-1])\n\n# case/space-proof version\nphrase = "Never Odd Or Even"\nclean = phrase.replace(" ", "").lower()\nprint(clean == clean[::-1])`}
          output={`level\nTrue\nTrue`}
        />
        <CodeBlock
          code={`# reverse WORD ORDER (asked constantly)\ns = "python is fun"\nprint(" ".join(s.split()[::-1]))`}
          output={`fun is python`}
        />
      </Section>

      {/* 10 ─ loops */}
      <Section id="loops" number="10" title="Looping Through Characters">
        <CodeBlock
          code={`for ch in "abc":\n    print(ch)\n\n# with position\nfor i, ch in enumerate("abc"):\n    print(i, ch)`}
          output={`a\nb\nc\n0 a\n1 b\n2 c`}
        />
        <CodeBlock
          code={`# count vowels — interview staple\ns = "Deelaksha"\ncount = sum(1 for ch in s.lower() if ch in "aeiou")\nprint(count, "vowels")`}
          output={`4 vowels`}
        />
        <CodeBlock
          code={`# character frequency\ns = "deelaksha"\nfreq = {}\nfor ch in s:\n    freq[ch] = freq.get(ch, 0) + 1\nprint(freq)`}
          output={`{'d': 1, 'e': 2, 'l': 1, 'a': 2, 'k': 1, 's': 1, 'h': 1}`}
        />
      </Section>

      {/* 11 ─ exceptions */}
      <Section id="exceptions" number="11" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Safe alternative"]}
          rows={[
            ["IndexError", 's[99] past the end', "slicing s[99:] → ''"],
            ["TypeError", 's[0] = "X" (immutable)', 'build new: "X" + s[1:]'],
            ["ValueError", 's.index("missing")', 's.find() → -1, or "x" in s'],
            ["TypeError", '"-".join([1, 2])', "join(str(n) for n in nums)"],
            ["TypeError", '"age: " + 22', 'f"age: {22}"'],
          ]}
        />
        <CodeBlock
          title="all four, live"
          code={`s = "abc"\n# s[10]              → IndexError\n# s[0] = "X"         → TypeError\n# s.index("z")       → ValueError\n# "-".join([1, 2])   → TypeError\nprint("each line above crashes if uncommented")`}
          output={`each line above crashes if uncommented`}
        />
      </Section>

      {/* 12 ─ memorize */}
      <Section id="memorize" number="12" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Reverse a string", 's[::-1]'],
            ["Palindrome check", "s == s[::-1]"],
            ["Reverse word order", '" ".join(s.split()[::-1])'],
            ["Count vowels", 'sum(1 for c in s.lower() if c in "aeiou")'],
            ["Char frequency", "freq[ch] = freq.get(ch, 0) + 1"],
            ["Clean input", "s.strip().lower()"],
            ["str ⇄ list", 's.split(",")\n",".join(items)'],
            ["Last char / last 3", "s[-1]\ns[-3:]"],
          ]}
        />
        <Callout type="tip">
          If you remember only one thing: <IC>s[::-1]</IC>. Reversal powers half of all string
          interview questions.
        </Callout>
      </Section>
    </TopicShell>
  );
}
