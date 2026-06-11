"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "open-close", label: "open() & Modes" },
  { id: "with", label: "with — The Right Way ⭐" },
  { id: "write", label: "Writing Files" },
  { id: "read", label: "Reading Files" },
  { id: "lines", label: "Line-by-Line ⭐" },
  { id: "append", label: "Appending" },
  { id: "pointer", label: "The File Pointer" },
  { id: "csv-json", label: "CSV & JSON" },
  { id: "exists", label: "Checking Existence" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function FilesPage() {
  return (
    <TopicShell
      icon="📁"
      title="File Handling"
      gradientWord="File Handling"
      subtitle="Read, write, append — with the file pointer drawn live, the with-statement habit, and every FileNotFoundError you'll ever meet."
      nav={NAV}
      next={{ icon: "🏛️", label: "OOP & Classes", href: "/python/oop" }}
    >
      {/* 1 ─ open & modes */}
      <Section id="open-close" number="01" title="open() & The Mode Table">
        <CodeBlock
          code={`f = open("notes.txt", "w")   # open returns a file object\nf.write("hello file")\nf.close()                     # MUST close — or data may not flush\nprint("written and closed")`}
          output={`written and closed`}
        />
        <Table
          head={["Mode", "Meaning", "File exists?", "File missing?"]}
          rows={[
            ['"r"', "read (default)", "reads it", "💥 FileNotFoundError"],
            ['"w"', "write", "⚠️ WIPED clean!", "created"],
            ['"a"', "append", "adds to the end", "created"],
            ['"x"', "exclusive create", "💥 FileExistsError", "created"],
            ['"r+"', "read + write", "kept", "💥 FileNotFoundError"],
            ['"rb" / "wb"', "binary read/write", "images, zips…", "—"],
          ]}
        />
        <Callout type="mistake">
          <IC>&quot;w&quot;</IC> instantly <strong>erases</strong> an existing file — before you even
          write. Adding logs? Use <IC>&quot;a&quot;</IC>.
        </Callout>
      </Section>

      {/* 2 ─ with */}
      <Section id="with" number="02" title="with — Auto-Close, The Right Way ⭐">
        <CodeBlock
          code={`with open("notes.txt", "w") as f:\n    f.write("Deelaksha was here\\n")\n    # leaving the block → f.close() runs AUTOMATICALLY\n\nprint(f.closed)     # proof: True`}
          output={`True`}
        />
        <FlowDiagram
          steps={[
            { label: "with open(...) as f:", sub: "file opens, bound to f" },
            { label: "indented block runs", sub: "read / write freely" },
            { label: "block exits → auto close", sub: "EVEN if an exception fired inside ✅" },
          ]}
        />
        <Callout type="behind">
          <IC>with</IC> is a context manager: <IC>close()</IC> is guaranteed even if the block
          crashes — the manual <IC>try/finally: f.close()</IC> written for you. Interviews
          expect this as your default style.
        </Callout>
      </Section>

      {/* 3 ─ write */}
      <Section id="write" number="03" title="Writing Files">
        <CodeBlock
          code={`lines = ["apple", "mango", "kiwi"]\n\nwith open("fruits.txt", "w") as f:\n    f.write("My Fruits\\n")          # \\n is NOT automatic!\n    for fruit in lines:\n        f.write(fruit + "\\n")\n    f.writelines(["end", "\\n"])     # writes a list (no \\n added)\n\nprint("done")`}
          output={`done`}
        />
        <CodeBlock
          title="fruits.txt (result)"
          runnable={false}
          code={`My Fruits\napple\nmango\nkiwi\nend`}
        />
        <CodeBlock
          code={`# 💥 write wants a string\nwith open("nums.txt", "w") as f:\n    f.write(42)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    f.write(42)\nTypeError: write() argument must be str, not int`}
          error
        />
        <Callout type="tip">
          Convert first: <IC>f.write(str(42))</IC> or <IC>f.write(f&quot;{`{n}`}\n&quot;)</IC>. Unlike{" "}
          <IC>print()</IC>, <IC>write()</IC> adds no newline.
        </Callout>
      </Section>

      {/* 4 ─ read */}
      <Section id="read" number="04" title="Reading Files — Three Ways">
        <CodeBlock
          code={`# fruits.txt: My Fruits / apple / mango / kiwi / end\n\nwith open("fruits.txt") as f:\n    whole = f.read()            # 1) entire file → one string\nprint(whole)\n\nwith open("fruits.txt") as f:\n    first = f.readline()        # 2) one line (keeps the \\n)\nprint(repr(first))\n\nwith open("fruits.txt") as f:\n    lines = f.readlines()       # 3) all lines → list\nprint(lines[:3])`}
          output={`My Fruits\napple\nmango\nkiwi\nend\n\n'My Fruits\\n'\n['My Fruits\\n', 'apple\\n', 'mango\\n']`}
        />
        <Table
          head={["Method", "Returns", "Best for"]}
          rows={[
            ["f.read()", "whole file as one str", "small files"],
            ["f.readline()", "next single line", "headers, first line"],
            ["f.readlines()", "list of all lines", "when you need a list"],
            ["for line in f:", "one line at a time", "⭐ big files — no memory blowup"],
          ]}
        />
      </Section>

      {/* 5 ─ line by line */}
      <Section id="lines" number="05" title="Line-by-Line — The Pro Loop ⭐">
        <CodeBlock
          code={`with open("fruits.txt") as f:\n    for line in f:                  # streams — never loads whole file\n        print(line.strip())         # strip removes the trailing \\n`}
          output={`My Fruits\napple\nmango\nkiwi\nend`}
        />
        <CodeBlock
          code={`# count lines & find a word — classic tasks\ncount = 0\nfound = False\nwith open("fruits.txt") as f:\n    for line in f:\n        count += 1\n        if "mango" in line:\n            found = True\nprint(count, "lines, mango found:", found)`}
          output={`5 lines, mango found: True`}
        />
        <Callout type="mistake">
          Forgot <IC>.strip()</IC>? You get double spacing — the line&apos;s own <IC>\n</IC> plus
          print&apos;s newline. Most common file-reading bug.
        </Callout>
      </Section>

      {/* 6 ─ append */}
      <Section id="append" number="06" title="Appending — Add Without Destroying">
        <CodeBlock
          code={`# run this 3 times — w mode would keep ONE line, a mode keeps all\nwith open("log.txt", "a") as f:\n    f.write("user logged in\\n")\n\nwith open("log.txt") as f:\n    print(f.read())`}
          output={`user logged in\nuser logged in\nuser logged in`}
        />
        <Callout type="analogy">
          <IC>&quot;w&quot;</IC> = new notebook every time 📓🗑️. <IC>&quot;a&quot;</IC> = keep writing on the next
          empty line ✍️. Log files are always <IC>&quot;a&quot;</IC>.
        </Callout>
      </Section>

      {/* 7 ─ pointer */}
      <Section id="pointer" number="07" title="The File Pointer — Why read() Twice Fails">
        <CodeBlock
          code={`with open("fruits.txt") as f:\n    print(len(f.read()))     # pointer races to the END\n    print(repr(f.read()))    # 😱 nothing left to read!\n\n    f.seek(0)                # rewind to byte 0\n    print(f.read(9))         # read 9 chars\n    print(f.tell())          # where is the pointer now?`}
          output={`31\n''\nMy Fruits\n9`}
        />
        <FlowDiagram
          steps={[
            { label: "open → pointer at 0", sub: "▮My Fruits..." },
            { label: "read() → pointer at END", sub: "My Fruits...end▮ — second read sees nothing" },
            { label: "seek(0) → rewind", sub: "▮My Fruits... — readable again" },
          ]}
        />
        <Callout type="behind">
          The file object is a cursor, not a copy. <IC>tell()</IC> shows the position,{" "}
          <IC>seek(0)</IC> rewinds. Second <IC>read()</IC> returning <IC>&quot;&quot;</IC> confuses
          everyone exactly once.
        </Callout>
      </Section>

      {/* 8 ─ csv & json */}
      <Section id="csv-json" number="08" title="CSV & JSON — Structured Files">
        <CodeBlock
          code={`import csv\n\nrows = [["name", "marks"], ["Deelaksha", 92], ["John", 85]]\nwith open("marks.csv", "w", newline="") as f:\n    csv.writer(f).writerows(rows)\n\nwith open("marks.csv") as f:\n    for row in csv.reader(f):\n        print(row)`}
          output={`['name', 'marks']\n['Deelaksha', '92']\n['John', '85']`}
        />
        <CodeBlock
          code={`import json\n\nstudent = {"name": "Deelaksha", "age": 22, "langs": ["py", "sql"]}\n\nwith open("student.json", "w") as f:\n    json.dump(student, f, indent=2)     # dict → file\n\nwith open("student.json") as f:\n    loaded = json.load(f)               # file → dict\n\nprint(loaded["langs"][0])\nprint(type(loaded))`}
          output={`py\n<class 'dict'>`}
        />
        <Callout type="note">
          CSV gives back <strong>strings</strong> (&quot;92&quot;, not 92) — convert yourself. JSON
          restores real types: dicts, lists, ints.
        </Callout>
      </Section>

      {/* 9 ─ exists */}
      <Section id="exists" number="09" title="Checking Existence">
        <CodeBlock
          code={`import os\nfrom pathlib import Path\n\nprint(os.path.exists("fruits.txt"))\nprint(Path("fruits.txt").exists())     # modern style\n\n# EAFP style — just try it\ntry:\n    with open("ghost.txt") as f:\n        print(f.read())\nexcept FileNotFoundError:\n    print("ghost.txt does not exist — handled ✅")`}
          output={`True\nTrue\nghost.txt does not exist — handled ✅`}
        />
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="FileNotFoundError"
          code={`open("does_not_exist.txt")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    open("does_not_exist.txt")\nFileNotFoundError: [Errno 2] No such file or directory: 'does_not_exist.txt'`}
          error
        />
        <CodeBlock
          title="ValueError — using a closed file"
          code={`f = open("fruits.txt")\nf.close()\nf.read()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    f.read()\nValueError: I/O operation on closed file.`}
          error
        />
        <CodeBlock
          title="io.UnsupportedOperation — wrong mode"
          code={`with open("fruits.txt", "r") as f:\n    f.write("oops")        # opened read-only!`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    f.write("oops")\nio.UnsupportedOperation: not writable`}
          error
        />
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["FileNotFoundError", 'open(missing, "r")', "try/except, or mode 'a'/'w'"],
            ["FileExistsError", 'open(existing, "x")', "use 'w' or check first"],
            ["ValueError", "read/write after close", "do everything inside with"],
            ["UnsupportedOperation", "write in 'r' / read in 'w'", "pick the right mode"],
            ["PermissionError", "no OS rights to the path", "check ownership/location"],
          ]}
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["The golden pattern", 'with open("f.txt") as f:\n    data = f.read()'],
            ["Big-file loop", "for line in f:\n    line.strip()"],
            ["Write (no auto \\n)", 'f.write(text + "\\n")'],
            ["Append, don't wipe", 'open("log.txt", "a")'],
            ["Safe open", "try: open(...)\nexcept FileNotFoundError:"],
            ["JSON save / load", "json.dump(d, f)\nd = json.load(f)"],
            ["Rewind", "f.seek(0)"],
            ["Mode killers", '"w" wipes · "x" crashes if exists'],
          ]}
        />
        <Callout type="tip">
          If your answer doesn&apos;t start with <IC>with open(...)</IC>, the interviewer is already
          frowning. Make it muscle memory.
        </Callout>
      </Section>
    </TopicShell>
  );
}
