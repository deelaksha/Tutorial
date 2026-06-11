"use client";

import React from "react";
import {
  Section,
  P,
  IC,
  CodeBlock,
  OutputBlock,
  FlowDiagram,
  MemoryDiagram,
  Callout,
  Table,
} from "../ui";
import { SepEndPlayground, FStringPlayground } from "../playgrounds";

export function PrintingPart1() {
  return (
    <>
      {/* ====== 01 BASIC PRINT ====== */}
      <Section id="basic-print" number={1} title="Basic Print Statement">
        <P>
          <IC>print()</IC> is a <strong className="text-slate-100">built-in function</strong> (not a
          keyword). It converts whatever you give it to text and ships it to the terminal through a
          stream called <IC>stdout</IC>.
        </P>
        <CodeBlock code={`print("Hello World")`} output={`Hello World`} />
        <FlowDiagram
          steps={[
            { label: '"Hello World"', sub: "str object created in memory" },
            { label: "print()", sub: "receives the object, converts with str()" },
            { label: "stdout", sub: "standard output stream" },
            { label: "Terminal", sub: "draws the characters" },
          ]}
        />
        <Callout type="analogy">
          <IC>print()</IC> is a <strong>postal service</strong>: you hand it packages (values), it
          wraps each as text, tapes them together, and delivers to one address — your terminal.
        </Callout>
        <Callout type="mistake" title="💥 Exception case — forgetting quotes">
          Without quotes Python thinks the words are variable names.
        </Callout>
        <CodeBlock
          code={`print(Hello)`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(Hello)\nNameError: name 'Hello' is not defined`}
        />
      </Section>

      {/* ====== 02 VARIABLES ====== */}
      <Section id="variables" number={2} title="Printing Variables">
        <P>
          A variable is a <strong className="text-slate-100">name tag pointing to an object</strong>,
          not a box holding it. <IC>print(name)</IC> follows the tag and prints what it finds.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\n\nprint(name)\nprint(age)`}
          output={`Deelaksha\n22`}
        />
        <MemoryDiagram
          vars={[
            { name: "name", value: '"Deelaksha"', type: "str" },
            { name: "age", value: "22", type: "int" },
          ]}
          caption="Two name tags → two objects in memory. print() follows the arrow, calls str() on the object, writes it to stdout."
        />
        <Callout type="mistake" title="💥 Quotes flip the meaning">
          <IC>print(name)</IC> → looks up the variable → <IC>Deelaksha</IC>
          <br />
          <IC>print(&quot;name&quot;)</IC> → literal text → <IC>name</IC>
        </Callout>
      </Section>

      {/* ====== 03 MULTIPLE VALUES ====== */}
      <Section id="multiple-values" number={3} title="Printing Multiple Values">
        <P>
          <IC>print()</IC> accepts <strong className="text-slate-100">any number of values</strong>{" "}
          — even mixed types. It converts each one and joins them with a space.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\n\nprint(name, age)`}
          output={`Deelaksha 22`}
        />
        <P>What Python does internally:</P>
        <FlowDiagram
          steps={[
            { label: 'str("Deelaksha") · str(22)', sub: "every value → string" },
            { label: 'join with sep=" "', sub: '"Deelaksha" + " " + "22"' },
            { label: 'append end="\\n"', sub: "invisible newline added" },
            { label: "Deelaksha 22", sub: "written to terminal" },
          ]}
        />
        <Callout type="note">
          This is why <IC>print(name, age)</IC> works with an <IC>int</IC> but{" "}
          <IC>&quot;...&quot; + age</IC> crashes — the comma lets <IC>print()</IC> do the
          conversion for you.
        </Callout>
      </Section>

      {/* ====== 04 SEP ====== */}
      <Section id="sep" number={4} title="Using Separator — sep">
        <P>
          <IC>sep</IC> is the glue placed <strong className="text-slate-100">between</strong> values.
          Default is one space.
        </P>
        <CodeBlock
          code={`print("Python", "Java", "C++", sep="-")`}
          output={`Python-Java-C++`}
        />
        <CodeBlock code={`print(1, 2, 3, sep="*")`} output={`1*2*3`} />
        <P>Visually, the join happens like this:</P>
        <div className="my-4 flex flex-wrap items-center justify-center gap-1.5">
          {["Python", "-", "Java", "-", "C++"].map((t, i) => (
            <span
              key={i}
              className={`code-font rounded-md border px-3 py-1.5 text-sm ${
                t === "-"
                  ? "border-violet-700/60 bg-violet-950/40 text-violet-300"
                  : "border-sky-800/50 bg-sky-950/40 text-sky-200"
              }`}
            >
              {t}
            </span>
          ))}
          <span className="mx-2 text-slate-500">=</span>
          <span className="code-font rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 text-sm text-emerald-300">
            Python-Java-C++
          </span>
        </div>
        <SepEndPlayground />
        <Callout type="tip">
          Print a date without concatenation: <IC>print(11, 6, 2026, sep=&quot;/&quot;)</IC> →{" "}
          <IC>11/6/2026</IC>. Interviewers love this one-liner.
        </Callout>
      </Section>

      {/* ====== 05 END ====== */}
      <Section id="end" number={5} title="Using End — end">
        <P>
          Every <IC>print()</IC> secretly appends <IC>end=&quot;\n&quot;</IC> — that is why each call
          starts a new line. Override it to stay on the same line.
        </P>
        <CodeBlock
          code={`print("Hello", end=" ")\nprint("World")`}
          output={`Hello World`}
        />
        <P>Classic loop pattern — print on one line:</P>
        <CodeBlock
          code={`for i in range(5):\n    print(i, end=" ")`}
          output={`0 1 2 3 4 `}
        />
        <P>What the stream receives with default vs custom end:</P>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              default end=&quot;\n&quot;
            </div>
            <OutputBlock label="raw stream">{`Hello\\n\nWorld\\n`}</OutputBlock>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              end=&quot; &quot;
            </div>
            <OutputBlock label="raw stream">{`Hello␣World\\n`}</OutputBlock>
          </div>
        </div>
        <Callout type="note" title="Real-world use">
          Progress output like <IC>Loading... done</IC> and pip-style progress bars are built with{" "}
          <IC>end=&quot;&quot;</IC> + <IC>flush=True</IC>.
        </Callout>
      </Section>

      {/* ====== 06 NEWLINE ====== */}
      <Section id="newline" number={6} title="Printing New Line — \n">
        <P>
          <IC>\n</IC> looks like two characters in code, but is stored as{" "}
          <strong className="text-slate-100">ONE character</strong> (newline) in memory. The terminal
          never draws it — it moves the cursor down instead.
        </P>
        <CodeBlock code={`print("Hello\\nWorld")`} output={`Hello\nWorld`} />
        <P>Characters in memory — count them:</P>
        <div className="my-4 flex flex-wrap gap-1">
          {["H", "e", "l", "l", "o", "\\n", "W", "o", "r", "l", "d"].map((c, i) => (
            <span
              key={i}
              className={`code-font flex h-9 min-w-9 items-center justify-center rounded-md border px-1 text-xs ${
                c === "\\n"
                  ? "border-rose-700/60 bg-rose-950/40 text-rose-300"
                  : "border-slate-700 bg-slate-900 text-slate-200"
              }`}
            >
              {c}
            </span>
          ))}
          <span className="ml-2 self-center text-xs text-slate-500">= 11 chars, not 12</span>
        </div>
        <CodeBlock
          code={`print(len("Hello\\nWorld"))   # \\n counts as ONE character`}
          output={`11`}
        />
        <Callout type="analogy">
          <IC>\n</IC> is the <strong>Enter key recorded inside the string</strong> — typing Hello,
          pressing Enter, typing World.
        </Callout>
      </Section>

      {/* ====== 07 TAB ====== */}
      <Section id="tab" number={7} title="Printing Tab Space — \t">
        <P>
          <IC>\t</IC> jumps the cursor to the next <strong className="text-slate-100">tab stop</strong>{" "}
          (every 8 columns in most terminals) — instant column alignment.
        </P>
        <CodeBlock
          code={`print("Name\\tAge")\nprint("John\\t25")`}
          output={`Name\tAge\nJohn\t25`}
        />
        <P>How the cursor moves:</P>
        <OutputBlock label="tab stops (every 8 columns)">{`col:     0       8       16\n         |       |       |\n         Name····Age\n         John····25      (···· = tab jump)`}</OutputBlock>
        <Callout type="mistake" title="💥 Exception case — hidden escapes in paths">
          <IC>print(&quot;C:\new\table&quot;)</IC> silently injects a newline and a tab! Fix with{" "}
          a raw string <IC>r&quot;C:\new\table&quot;</IC> or double backslashes.
        </Callout>
        <CodeBlock
          code={`print("C:\\new\\table")    # 😱 broken\nprint(r"C:\\new\\table")   # ✅ raw string`}
          output={`C:\new\table\nC:\\new\\table`}
        />
      </Section>

      {/* ====== 08 CONCATENATION ====== */}
      <Section id="concat" number={8} title="String Concatenation">
        <P>
          <IC>+</IC> on strings builds a <strong className="text-slate-100">brand-new string
          object</strong>. Strings are immutable — the originals are never touched.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\n\nprint("Hello " + name)`}
          output={`Hello Deelaksha`}
        />
        <MemoryDiagram
          vars={[
            { name: '"Hello "', value: '"Hello "', type: "str" },
            { name: "name", value: '"Deelaksha"', type: "str" },
            { name: "NEW object", value: '"Hello Deelaksha"', type: "str" },
          ]}
          caption="+ allocates a third object combining both. The two inputs remain unchanged in memory."
        />
        <Callout type="mistake" title="💥 Exception case — str + int">
          <IC>+</IC> refuses to mix types. Python never auto-converts like JavaScript does.
        </Callout>
        <CodeBlock
          code={`age = 22\nprint("Age: " + age)`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print("Age: " + age)\nTypeError: can only concatenate str (not "int") to str`}
        />
        <P>Three correct fixes:</P>
        <CodeBlock
          code={`print("Age: " + str(age))   # convert manually\nprint("Age:", age)           # let print() convert\nprint(f"Age: {age}")         # ✅ best — f-string`}
          output={`Age: 22\nAge: 22\nAge: 22`}
        />
      </Section>

      {/* ====== 09 F-STRINGS ====== */}
      <Section id="f-strings" number={9} title="f-Strings — Most Important ⭐">
        <P>
          Prefix the string with <IC>f</IC> and anything inside <IC>{"{}"}</IC> is{" "}
          <strong className="text-slate-100">evaluated as a real Python expression</strong>, converted
          to text, and spliced in. Interviewers expect this.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\n\nprint(f"My name is {name} and I am {age} years old")`}
          output={`My name is Deelaksha and I am 22 years old`}
        />
        <P>How Python assembles it:</P>
        <div className="my-4 flex flex-wrap items-center justify-center gap-1.5">
          {[
            ["My name is ", "lit"],
            ["{name}", "expr"],
            [" and I am ", "lit"],
            ["{age}", "expr"],
            [" years old", "lit"],
          ].map(([t, kind], i) => (
            <span
              key={i}
              className={`code-font rounded-md border px-2.5 py-1.5 text-xs ${
                kind === "expr"
                  ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500">
          green = evaluated at runtime · grey = copied as-is
        </p>
        <P>Braces hold full expressions — not just variable names:</P>
        <CodeBlock
          code={`x = 10\nprint(f"{x + 5}")\nprint(f"{10 * 20}")\nprint(f"{'even' if x % 2 == 0 else 'odd'}")`}
          output={`15\n200\neven`}
        />
        <FStringPlayground />
        <Callout type="mistake" title="💥 Exception case — undefined variable">
          The expression runs for real — unknown names crash exactly like normal code.
        </Callout>
        <CodeBlock
          code={`print(f"Hello {username}")`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(f"Hello {username}")\nNameError: name 'username' is not defined`}
        />
        <Callout type="tip">
          Why f-strings? 1) fastest (compiled into bytecode), 2) readable, 3) full format
          mini-language, 4) the <IC>{"f\"{x=}\""}</IC> debug trick prints{" "}
          <IC>x=10</IC> automatically.
        </Callout>
      </Section>

      {/* ====== 10 NUMBER FORMATTING ====== */}
      <Section id="number-format" number={10} title="Formatting Numbers">
        <P>
          After a colon comes the <strong className="text-slate-100">format spec</strong>:{" "}
          <IC>{"{value:spec}"}</IC>.
        </P>
        <CodeBlock code={`pi = 3.14159265\n\nprint(f"{pi:.2f}")`} output={`3.14`} />
        <P>Decode <IC>.2f</IC> symbol by symbol:</P>
        <div className="my-4 flex flex-wrap items-center justify-center gap-3">
          {[
            [".", "precision dot", "“decimal digits follow”"],
            ["2", "two digits", "round to 2 places"],
            ["f", "fixed float", "plain decimal style"],
          ].map(([sym, name, desc]) => (
            <div key={sym} className="glass rounded-xl px-5 py-3 text-center">
              <div className="code-font text-2xl font-bold text-sky-300">{sym}</div>
              <div className="mt-1 text-xs font-semibold text-slate-200">{name}</div>
              <div className="text-[10px] text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
        <Table
          head={["Spec", "Input", "Output", "Meaning"]}
          rows={[
            [<IC key="1">.2f</IC>, "3.14159", <IC key="1b">3.14</IC>, "2 decimals"],
            [<IC key="2">.0f</IC>, "3.14159", <IC key="2b">3</IC>, "no decimals"],
            [<IC key="3">,.2f</IC>, "1234567.8", <IC key="3b">1,234,567.80</IC>, "thousands commas"],
            [<IC key="4">05d</IC>, "42", <IC key="4b">00042</IC>, "zero-pad to width 5"],
            [<IC key="5">+d</IC>, "42", <IC key="5b">+42</IC>, "force sign"],
          ]}
        />
        <Callout type="mistake" title="💥 Exception case — float spec on a string">
          <IC>f</IC> only works on numbers.
        </Callout>
        <CodeBlock
          code={`name = "Deelaksha"\nprint(f"{name:.2f}")`}
          error
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(f"{name:.2f}")\nValueError: Unknown format code 'f' for object of type 'str'`}
        />
      </Section>

      {/* ====== 11 PERCENTAGE ====== */}
      <Section id="percentage" number={11} title="Printing Percentage">
        <P>Round a score to one decimal and add the <IC>%</IC> sign yourself:</P>
        <CodeBlock
          code={`score = 95.567\n\nprint(f"{score:.1f}%")`}
          output={`95.6%`}
        />
        <P>
          Or use the <IC>%</IC> format code — it <strong className="text-slate-100">multiplies by
          100 automatically</strong> (input must be a ratio):
        </P>
        <CodeBlock
          code={`ratio = 0.9557\n\nprint(f"{ratio:.1%}")`}
          output={`95.6%`}
        />
        <div className="my-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="code-font rounded-md border border-sky-800/50 bg-sky-950/40 px-3 py-1.5 text-sky-200">0.9557</span>
          <span className="text-slate-500">→ :.1% → × 100, 1 decimal, add % →</span>
          <span className="code-font rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 text-emerald-300">95.6%</span>
        </div>
        <Callout type="mistake" title="💥 Watch the double-multiply">
          <IC>f&quot;{"{95.5:.1%}"}&quot;</IC> prints <IC>9550.0%</IC> — the <IC>%</IC> code expects{" "}
          <IC>0.955</IC>, not <IC>95.5</IC>. Already have a percentage? Use <IC>.1f</IC> + manual %.
        </Callout>
      </Section>
    </>
  );
}
