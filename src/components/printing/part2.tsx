"use client";

import React from "react";
import {
  Section,
  P,
  IC,
  CodeBlock,
  MemoryDiagram,
  Callout,
  Table,
  CopyButton,
} from "../ui";
import {
  BaseConverterPlayground,
  UnpackPlayground,
  EscapePlayground,
} from "../playgrounds";

export function PrintingPart2() {
  return (
    <>
      {/* ====== 12 BINARY ====== */}
      <Section id="binary" number={12} title="Printing Binary">
        <P>Two ways — <IC>bin()</IC> keeps the <IC>0b</IC> prefix, the f-string drops it:</P>
        <CodeBlock
          code={`num = 10\n\nprint(bin(num))    # with 0b prefix\nprint(f"{num:b}")  # clean`}
          output={`0b1010\n1010`}
        />
        <P>Why 10 becomes 1010 — each slot is a power of 2:</P>
        <div className="my-4 flex flex-wrap items-end justify-center gap-1.5">
          {[
            ["8", "1", true],
            ["4", "0", false],
            ["2", "1", true],
            ["1", "0", false],
          ].map(([pw, bit, on], i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{pw}</span>
              <span
                className={`code-font flex h-11 w-11 items-center justify-center rounded-lg border text-lg font-bold ${
                  on
                    ? "border-emerald-600/60 bg-emerald-950/50 text-emerald-300 shadow-[0_0_18px_-6px_rgba(52,211,153,0.6)]"
                    : "border-slate-700 bg-slate-900 text-slate-600"
                }`}
              >
                {bit}
              </span>
            </div>
          ))}
          <span className="mx-3 self-center text-slate-500">→</span>
          <span className="code-font self-center rounded-md border border-sky-800/50 bg-sky-950/40 px-3 py-2 text-sky-200">
            8 + 2 = 10
          </span>
        </div>
        <P>Zero-pad to a fixed width — great for comparing bit patterns:</P>
        <CodeBlock
          code={`print(f"{10:08b}")\nprint(f"{255:08b}")`}
          output={`00001010\n11111111`}
        />
      </Section>

      {/* ====== 13 OCTAL ====== */}
      <Section id="octal" number={13} title="Printing Octal">
        <P>
          Base 8 — digits 0–7. <IC>10 = 1×8 + 2</IC>, so octal is <IC>12</IC>:
        </P>
        <CodeBlock code={`num = 10\n\nprint(f"{num:o}")\nprint(oct(num))`} output={`12\n0o12`} />
        <Callout type="note">
          Octal shows up in file permissions: <IC>chmod 755</IC> is octal for{" "}
          <IC>rwxr-xr-x</IC> — each digit packs 3 permission bits.
        </Callout>
      </Section>

      {/* ====== 14 HEX ====== */}
      <Section id="hexadecimal" number={14} title="Printing Hexadecimal">
        <P>
          Base 16 — digits <IC>0-9</IC> then <IC>a-f</IC>. One hex digit = exactly 4 bits, which is
          why hex is everywhere in low-level work.
        </P>
        <CodeBlock
          code={`num = 255\n\nprint(f"{num:x}")   # lowercase\nprint(f"{num:X}")   # uppercase\nprint(hex(num))     # with 0x prefix`}
          output={`ff\nFF\n0xff`}
        />
        <BaseConverterPlayground />
        <Table
          head={["Decimal", "Binary", "Octal", "Hex"]}
          rows={[
            ["10", <IC key="a">1010</IC>, <IC key="b">12</IC>, <IC key="c">a</IC>],
            ["64", <IC key="d">1000000</IC>, <IC key="e">100</IC>, <IC key="f">40</IC>],
            ["255", <IC key="g">11111111</IC>, <IC key="h">377</IC>, <IC key="i">ff</IC>],
          ]}
        />
      </Section>

      {/* ====== 15 LISTS ====== */}
      <Section id="lists" number={15} title="Printing Lists">
        <P>Printing the list directly shows its full structure — brackets and commas included:</P>
        <CodeBlock code={`nums = [1, 2, 3, 4]\n\nprint(nums)`} output={`[1, 2, 3, 4]`} />
        <P>
          Add <IC>*</IC> to <strong className="text-slate-100">unpack</strong> the list into separate
          arguments — now <IC>print()</IC> receives 4 values instead of 1 list:
        </P>
        <CodeBlock
          code={`print(*nums)            # → print(1, 2, 3, 4)\nprint(*nums, sep="-")   # unpack + custom glue`}
          output={`1 2 3 4\n1-2-3-4`}
        />
        <UnpackPlayground />
        <Callout type="mistake" title="💥 Exception case — * needs an iterable">
          Unpacking only works on iterables (lists, tuples, strings, ranges) — not plain numbers.
        </Callout>
        <CodeBlock
          code={`print(*5)`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(*5)\nTypeError: print() argument after * must be an iterable, not int`}
        />
      </Section>

      {/* ====== 16 DICTS ====== */}
      <Section id="dicts" number={16} title="Printing Dictionaries">
        <CodeBlock
          code={`student = {\n    "name": "John",\n    "age": 20\n}\n\nprint(student)`}
          output={`{'name': 'John', 'age': 20}`}
        />
        <P>Pretty line-by-line with <IC>.items()</IC>:</P>
        <CodeBlock
          code={`for key, value in student.items():\n    print(key, value)`}
          output={`name John\nage 20`}
        />
        <P>How <IC>.items()</IC> feeds the loop:</P>
        <div className="my-4 flex flex-col items-center gap-2">
          {[
            ['"name"', '"John"'],
            ['"age"', "20"],
          ].map(([k, v], i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="code-font rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-300">
                key: {k}
              </span>
              <span className="text-slate-600">·</span>
              <span className="code-font rounded-md border border-sky-800/50 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-200">
                value: {v}
              </span>
              <span className="text-slate-500">→ print(key, value) → iteration {i + 1}</span>
            </div>
          ))}
        </div>
        <Callout type="mistake" title="💥 Exception case — missing key">
          Reading a key that does not exist raises <IC>KeyError</IC>. Use{" "}
          <IC>student.get(&quot;grade&quot;)</IC> to get <IC>None</IC> safely instead.
        </Callout>
        <CodeBlock
          code={`print(student["grade"])`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(student["grade"])\nKeyError: 'grade'`}
        />
      </Section>

      {/* ====== 17 QUOTES / STR vs REPR ====== */}
      <Section id="quotes" number={17} title="Printing With / Without Quotes">
        <P>Why does a plain string print clean, but the same string inside a list shows quotes?</P>
        <CodeBlock
          code={`name = "Python"\n\nprint(name)\nprint([name])`}
          output={`Python\n['Python']`}
        />
        <P>
          Python has two string forms — <IC>str()</IC> for humans, <IC>repr()</IC> for developers.{" "}
          <IC>print()</IC> uses <IC>str()</IC> on the top-level object, but{" "}
          <strong className="text-slate-100">containers always show their elements with repr()</strong>:
        </P>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">str() — for humans</div>
            <div className="code-font mt-2 text-lg text-slate-100">Python</div>
            <div className="mt-1 text-[11px] text-slate-500">clean display, no quotes</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-400">repr() — for developers</div>
            <div className="code-font mt-2 text-lg text-slate-100">&#39;Python&#39;</div>
            <div className="mt-1 text-[11px] text-slate-500">unambiguous — shows it is a str</div>
          </div>
        </div>
        <CodeBlock
          code={`print(str("Python"))    # human view\nprint(repr("Python"))   # developer view`}
          output={`Python\n'Python'`}
        />
        <Callout type="tip">
          &quot;Why does printing a list show quotes around strings?&quot; → containers call{" "}
          <IC>repr()</IC> on elements so you can tell <IC>&#39;5&#39;</IC> (str) apart from{" "}
          <IC>5</IC> (int).
        </Callout>
      </Section>

      {/* ====== 18 PATTERNS ====== */}
      <Section id="patterns" number={18} title="Printing Patterns">
        <P>
          String multiplication: <IC>&quot;*&quot; * 3</IC> builds <IC>***</IC>. Combine with a loop
          for the classic interview pyramid:
        </P>
        <CodeBlock
          code={`for i in range(5):\n    print("*" * (i + 1))`}
          output={`*\n**\n***\n****\n*****`}
        />
        <P>Trace every iteration:</P>
        <Table
          head={["i", "i + 1", '"*" * (i+1)', "printed line"]}
          rows={[
            ["0", "1", <IC key="a">&quot;*&quot;</IC>, "*"],
            ["1", "2", <IC key="b">&quot;**&quot;</IC>, "**"],
            ["2", "3", <IC key="c">&quot;***&quot;</IC>, "***"],
            ["3", "4", <IC key="d">&quot;****&quot;</IC>, "****"],
            ["4", "5", <IC key="e">&quot;*****&quot;</IC>, "*****"],
          ]}
        />
        <P>Right-aligned pyramid — combine with width formatting:</P>
        <CodeBlock
          code={`for i in range(5):\n    print(f"{'*' * (i + 1):>5}")`}
          output={`    *\n   **\n  ***\n ****\n*****`}
        />
      </Section>

      {/* ====== 19 OLD STYLE ====== */}
      <Section id="old-style" number={19} title="Old Style Formatting — %">
        <P>
          C-style formatting — you will still meet it in legacy scripts and log modules.{" "}
          <IC>%s</IC> = string, <IC>%d</IC> = integer, <IC>%f</IC> = float.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\n\nprint("Name: %s Age: %d" % (name, age))`}
          output={`Name: Deelaksha Age: 22`}
        />
        <Callout type="mistake" title="💥 Exception case — wrong type for %d">
          <IC>%d</IC> demands a number — feeding it a string crashes.
        </Callout>
        <CodeBlock
          code={`print("Age: %d" % "twenty")`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print("Age: %d" % "twenty")\nTypeError: %d format: a real number is required, not str`}
        />
      </Section>

      {/* ====== 20 .format() ====== */}
      <Section id="format-method" number={20} title="The .format() Method">
        <P>The bridge between % and f-strings — empty braces fill in order:</P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\n\nprint("Name: {} Age: {}".format(name, age))\nprint("{1} is {0} years old".format(age, name))   # by index\nprint("{n} / {a}".format(n=name, a=age))          # by keyword`}
          output={`Name: Deelaksha Age: 22\nDeelaksha is 22 years old\nDeelaksha / 22`}
        />
        <Callout type="mistake" title="💥 Exception case — more braces than values">
          Every <IC>{"{}"}</IC> must receive a value — one short and Python raises{" "}
          <IC>IndexError</IC>.
        </Callout>
        <CodeBlock
          code={`print("{} {}".format("only-one"))`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print("{} {}".format("only-one"))\nIndexError: Replacement index 1 out of range for positional args tuple`}
        />
        <Table
          head={["Style", "Example", "Verdict"]}
          rows={[
            ["% (old)", <IC key="1">&quot;Hi %s&quot; % name</IC>, "legacy code only"],
            [".format()", <IC key="2">&quot;Hi {}&quot;.format(name)</IC>, "fine, verbose"],
            ["f-string", <IC key="3">f&quot;Hi {"{name}"}&quot;</IC>, "✅ use this"],
          ]}
        />
      </Section>

      {/* ====== 21 SPECIAL CHARS ====== */}
      <Section id="special-chars" number={21} title="Printing Special Characters">
        <P>To print a quote inside a quote, or a real backslash, escape it:</P>
        <CodeBlock code={`print("\\"Hello\\"")`} output={`"Hello"`} />
        <CodeBlock code={`print("C:\\\\Users\\\\Admin")`} output={`C:\\Users\\Admin`} />
        <EscapePlayground />
        <Callout type="mistake" title="💥 Exception case — unterminated string">
          Mismatched quotes never close the string:
        </Callout>
        <CodeBlock
          code={`print("Hello')`}
          error
          output={`  File "main.py", line 1\n    print("Hello')\n          ^\nSyntaxError: unterminated string literal (detected at line 1)`}
        />
        <Callout type="note">
          Mixing quote types avoids escaping entirely:{" "}
          <IC>print(&#39;She said &quot;hi&quot;&#39;)</IC> — single outside, double inside.
        </Callout>
      </Section>

      {/* ====== 22 INTERVIEW LOOPS ====== */}
      <Section id="interview-loops" number={22} title="Printing in Interview Problems">
        <P>Print every element of an array — the bread and butter of coding rounds:</P>
        <CodeBlock
          code={`arr = [1, 2, 3, 4]\n\nfor num in arr:\n    print(num)`}
          output={`1\n2\n3\n4`}
        />
        <P>
          Index + value with <IC>enumerate()</IC> — never use{" "}
          <IC>range(len(arr))</IC> in an interview:
        </P>
        <CodeBlock
          code={`for i, num in enumerate(arr):\n    print(i, num)`}
          output={`0 1\n1 2\n2 3\n3 4`}
        />
        <P>How enumerate pairs them up:</P>
        <div className="my-4 flex flex-wrap justify-center gap-2">
          {[
            ["0", "1"],
            ["1", "2"],
            ["2", "3"],
            ["3", "4"],
          ].map(([i, v]) => (
            <div key={i} className="flex overflow-hidden rounded-lg border border-slate-700">
              <span className="code-font bg-amber-950/50 px-3 py-1.5 text-xs text-amber-300">i={i}</span>
              <span className="code-font bg-sky-950/50 px-3 py-1.5 text-xs text-sky-200">val={v}</span>
            </div>
          ))}
        </div>
        <P>One-line patterns interviewers expect you to know cold:</P>
        <CodeBlock
          code={`print(*arr)              # 1 2 3 4   — space separated\nprint(*arr, sep="")      # 1234      — joined\nprint(*arr, sep="\\n")    # vertical  — one per line`}
          output={`1 2 3 4\n1234\n1\n2\n3\n4`}
        />
      </Section>

      {/* ====== 23 EXCEPTION RECAP ====== */}
      <Section id="exceptions" number={23} title="Exception Cases — Know Every Crash 💥">
        <P>
          Every printing error you will ever hit, in one place. Read the last line of a traceback
          first — it names the error and tells you why.
        </P>
        <div className="space-y-5">
          {[
            {
              label: "NameError — variable does not exist",
              code: `print(message)`,
              out: `Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(message)\nNameError: name 'message' is not defined`,
              fix: "Define it first, or quote it if you meant literal text.",
            },
            {
              label: "TypeError — str + int",
              code: `print("Age: " + 22)`,
              out: `Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print("Age: " + 22)\nTypeError: can only concatenate str (not "int") to str`,
              fix: 'Use f"Age: {22}" or print("Age:", 22).',
            },
            {
              label: "SyntaxError — Python 2 style print",
              code: `print "Hello"`,
              out: `  File "main.py", line 1\n    print "Hello"\n    ^^^^^^^^^^^^^\nSyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?`,
              fix: "Python 3 made print a function — parentheses are mandatory.",
            },
            {
              label: "ValueError — wrong format code",
              code: `print(f"{'abc':.2f}")`,
              out: `Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(f"{'abc':.2f}")\nValueError: Unknown format code 'f' for object of type 'str'`,
              fix: "Number specs (f, d, b, x) only work on numbers.",
            },
          ].map((e) => (
            <div key={e.label}>
              <div className="mb-1 text-sm font-bold text-rose-300">⚡ {e.label}</div>
              <CodeBlock code={e.code} error output={e.out} />
              <p className="text-xs text-slate-500">✅ Fix: {e.fix}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ====== 24 MEMORIZE ====== */}
      <Section id="memorize" number={24} title="Must Memorize for Interviews 🧠">
        <P>
          If you remember nothing else from this page, remember these eight. Copy them, type them,
          repeat until they are muscle memory.
        </P>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Blank line", "print()"],
            ["Two values", "print(a, b)"],
            ["Unpack a list", "print(*arr)"],
            ["Unpack + separator", 'print(*arr, sep=" ")'],
            ["Stay on same line", 'print("Hello", end=" ")'],
            ["f-string value", 'print(f"Value = {x}")'],
            ["Two decimals", 'print(f"{num:.2f}")'],
            ["Index + value", "for i, val in enumerate(arr):\n    print(i, val)"],
          ].map(([label, snippet]) => (
            <div key={label} className="glass flex flex-col rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">{label}</span>
                <CopyButton text={snippet} />
              </div>
              <pre className="code-font flex-1 whitespace-pre-wrap rounded-lg bg-black/40 px-3 py-2 text-[13px] text-sky-200">
                {snippet}
              </pre>
            </div>
          ))}
        </div>
        <MemoryDiagram
          vars={[
            { name: "you (before)", value: 'print("Hello World")', type: "beginner" },
            { name: "you (now)", value: 'print(*arr, sep="\\n")', type: "interview-ready" },
          ]}
          caption="End-to-end complete. Next category: Variables & Memory."
        />
      </Section>
    </>
  );
}
