"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "two-questions", label: "Two Different Questions" },
  { id: "find", label: "find — Search by NAME ⭐" },
  { id: "find-filters", label: "find — Type, Size, Time" },
  { id: "grep", label: "grep — Search CONTENTS ⭐" },
  { id: "grep-anim", label: "grep -r, Animated" },
  { id: "grep-flags", label: "The grep Flags That Matter" },
  { id: "combos", label: "find -exec & Power Combos" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxSearchPage() {
  return (
    <TopicShell
      icon="🔍"
      title="Finding Things — find & grep"
      gradientWord="Finding"
      subtitle="Two commands locate anything on a Linux machine: find searches file NAMES and properties, grep searches file CONTENTS. Master both and no file or line of code can hide from you."
      nav={NAV}
      next={{ icon: "🪈", label: "Pipes & Redirection", href: "/linux/pipes" }}
    >
      {/* 01 ─ TWO QUESTIONS */}
      <Section id="two-questions" number="01" title="Two Different Questions">
        <Table
          head={["Your question", "Tool", "Example"]}
          rows={[
            ["\u201cWhere is the file CALLED config.yaml?\u201d", <IC key="1">find</IC>, "find . -name config.yaml"],
            ["\u201cWhich files CONTAIN the word timeout?\u201d", <IC key="2">grep</IC>, "grep -r timeout ."],
            ["\u201cWhere does the ls PROGRAM live?\u201d", <IC key="3">which</IC>, "which ls → /usr/bin/ls"],
          ]}
        />
        <Callout type="analogy">
          📚 In a library: <IC>find</IC> reads the <strong>spines</strong> (titles, sizes,
          dates), <IC>grep</IC> opens every book and reads the <strong>pages</strong>. Spines are
          fast; pages find things spines can&apos;t.
        </Callout>
      </Section>

      {/* 02 ─ FIND */}
      <Section id="find" number="02" title="find — Search by Name ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`#       WHERE   WHAT
$ find  .       -name "*.log"          # *.log under here (recursive!)
$ find  /etc    -name "nginx*"         # starting from /etc
$ find  ~       -iname "*REPORT*"      # -i = ignore case`}
          output={`$ find . -name "*.log"
./app/debug.log
./app/logs/error.log        ← digs into EVERY subfolder automatically
./old/2023/access.log`}
        />
        <Callout type="mistake">
          Always quote the pattern: <IC>-name &quot;*.log&quot;</IC>. Unquoted, the{" "}
          <strong>shell</strong> expands <IC>*</IC> against the current folder before find runs,
          and you silently search for the wrong thing.
        </Callout>
      </Section>

      {/* 03 ─ FIND FILTERS */}
      <Section id="find-filters" number="03" title="find — By Type, Size, and Time">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ find . -type d                  # directories only
$ find . -type f -name "*.py"     # files only, named *.py
$ find . -size +100M              # bigger than 100MB  (disk full? start here)
$ find . -mtime -1                # modified in the last 24h ("what changed?!")
$ find . -type f -empty           # empty files`}
          output={`$ find / -size +1G 2>/dev/null    # 2>/dev/null hides "Permission denied" noise
/var/lib/docker/overlay2/.../layer.tar
/home/dee/Downloads/ubuntu.iso`}
        />
        <Table
          head={["Filter", "Matches", "Memory hook"]}
          rows={[
            [<IC key="1">-type f / -type d</IC>, "files / directories", "f-ile, d-ir"],
            [<IC key="2">-size +100M / -1G</IC>, "bigger / smaller than", "+ over, - under"],
            [<IC key="3">-mtime -1 / +30</IC>, "modified < 1 day / > 30 days ago", "- newer, + older"],
            [<IC key="4">-empty</IC>, "empty files or dirs", "—"],
          ]}
        />
        <Callout type="tip">
          The two real-life classics: disk mysteriously full →{" "}
          <IC>find / -size +1G 2&gt;/dev/null</IC>. &quot;It worked yesterday, what changed?&quot;
          → <IC>find . -mtime -1</IC>.
        </Callout>
      </Section>

      {/* 04 ─ GREP */}
      <Section id="grep" number="04" title="grep — Search INSIDE Files ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`#        PATTERN      WHERE
$ grep   "timeout"    config.yaml      # one file
$ grep   "ERROR"      app.log          # every matching LINE prints
$ grep -r "api_key"   .                # -r: every file under here ⭐`}
          output={`$ grep "ERROR" app.log
09:14:48 ERROR db timeout on /api/orders
09:15:02 ERROR retry failed (attempt 3)`}
        />
        <P>
          grep reads line by line and prints every line containing your pattern. With{" "}
          <IC>-r</IC> it does this across an entire directory tree — which is how you answer
          &quot;where in this codebase is <IC>DATABASE_URL</IC> used?&quot; in one second.
        </P>
      </Section>

      {/* 05 ─ GREP ANIM */}
      <Section id="grep-anim" number="05" title="grep -r, Animated">
        <CmdPlay
          title="grep -r sweeps the tree"
          steps={[
            {
              cmd: 'grep -rn "timeout" .',
              narrative: "grep starts walking every file under . — opening each one and scanning line by line for the pattern.",
              visualTitle: "scanning...",
              tree: [
                { id: "root", label: "./", kind: "dir" },
                { id: "cfg", label: "config.yaml", depth: 1, kind: "file", state: "active", note: "scanning..." },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "main", label: "main.py", depth: 2, kind: "file", state: "dim" },
                { id: "db", label: "db.py", depth: 2, kind: "file", state: "dim" },
                { id: "log", label: "app.log", depth: 1, kind: "file", state: "dim" },
              ],
            },
            {
              out: ["./config.yaml:12:  timeout: 30"],
              narrative: "Hit! config.yaml line 12 contains 'timeout'. The -n flag is why you see the line number — jump straight there in your editor.",
              visualTitle: "match found",
              tree: [
                { id: "root", label: "./", kind: "dir" },
                { id: "cfg", label: "config.yaml", depth: 1, kind: "file", state: "new", note: "match · line 12" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "main", label: "main.py", depth: 2, kind: "file", state: "active", note: "scanning..." },
                { id: "db", label: "db.py", depth: 2, kind: "file", state: "dim" },
                { id: "log", label: "app.log", depth: 1, kind: "file", state: "dim" },
              ],
            },
            {
              out: ["./src/db.py:8:    conn = connect(timeout=5)"],
              narrative: "main.py had nothing — skipped silently. db.py line 8 matches. grep only ever shows you the hits.",
              visualTitle: "match found",
              tree: [
                { id: "root", label: "./", kind: "dir" },
                { id: "cfg", label: "config.yaml", depth: 1, kind: "file", note: "match · line 12" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "main", label: "main.py", depth: 2, kind: "file", state: "dim", note: "no match" },
                { id: "db", label: "db.py", depth: 2, kind: "file", state: "new", note: "match · line 8" },
                { id: "log", label: "app.log", depth: 1, kind: "file", state: "active", note: "scanning..." },
              ],
            },
            {
              out: ["./app.log:201:09:14:48 ERROR db timeout on /api/orders", "", "3 files searched the whole tree in milliseconds ✓"],
              narrative: "Done: every occurrence of 'timeout' in the whole project, with file + line number. This is how you navigate ANY unfamiliar codebase.",
              visualTitle: "all matches",
              tree: [
                { id: "root", label: "./", kind: "dir" },
                { id: "cfg", label: "config.yaml", depth: 1, kind: "file", state: "new", note: "line 12" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "main", label: "main.py", depth: 2, kind: "file", state: "dim" },
                { id: "db", label: "db.py", depth: 2, kind: "file", state: "new", note: "line 8" },
                { id: "log", label: "app.log", depth: 1, kind: "file", state: "new", note: "line 201" },
              ],
            },
          ]}
        />
      </Section>

      {/* 06 ─ GREP FLAGS */}
      <Section id="grep-flags" number="06" title="The grep Flags That Matter">
        <Table
          head={["Flag", "Does", "Typical use"]}
          rows={[
            [<IC key="1">-r</IC>, "recursive — whole directory tree", "search a codebase"],
            [<IC key="2">-i</IC>, "ignore case", "Error ≡ ERROR ≡ error"],
            [<IC key="3">-n</IC>, "show line numbers", "jump there in your editor"],
            [<IC key="4">-v</IC>, "INVERT — lines NOT matching", "filter noise out of logs"],
            [<IC key="5">-c</IC>, "count matches instead of printing", "how many errors today?"],
            [<IC key="6">-l</IC>, "list matching FILES only", "which files mention X?"],
            [<IC key="7">-A 3 / -B 3</IC>, "show 3 lines After / Before", "context around a crash"],
          ]}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ grep -rin "error" logs/        # recursive + any case + line numbers
$ grep -v "DEBUG" app.log        # everything EXCEPT debug noise
$ grep -A 5 "Traceback" app.log  # the 5 lines after each crash header`}
        />
        <Callout type="tip">
          <IC>-v</IC> flips grep from a finder into a <strong>filter</strong> — and that mindset
          (keep/remove lines from a stream) is exactly what pipes are about, next lesson.
        </Callout>
      </Section>

      {/* 07 ─ COMBOS */}
      <Section id="combos" number="07" title="find -exec & Power Combos">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# run a command ON every file find discovers
#   {} = each found file · \\; = end of the command
$ find . -name "*.tmp" -exec rm {} \\;         # delete every .tmp
$ find . -name "*.sh"  -exec chmod +x {} \\;   # make all scripts executable

# find + grep: search contents of only CERTAIN files
$ find . -name "*.py" -exec grep -l "import requests" {} \\;

# where does a COMMAND live?
$ which python3`}
          output={`$ which python3
/usr/bin/python3`}
        />
        <Callout type="mistake">
          Test <IC>-exec</IC> the safe way: run it with <IC>-exec echo rm {"{}"} \\;</IC> first
          (or just <IC>find</IC> alone) to print the victims, THEN swap in the real command.
          find + rm with a wrong pattern is unrecoverable.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["find vs grep", "find = file NAMES/properties · grep = file CONTENTS"],
            ["find shape", "find WHERE -name \"PATTERN\" — quote the pattern!"],
            ["find filters", "-type f/d · -size +100M · -mtime -1 · -empty"],
            ["Disk full?", "find / -size +1G 2>/dev/null"],
            ["What changed today?", "find . -mtime -1"],
            ["grep shape", "grep \"pattern\" file · -r for whole trees"],
            ["The codebase search", "grep -rn \"thing\" . — file + line of every hit"],
            ["grep -v", "INVERT — filter lines OUT (goodbye DEBUG noise)"],
            ["find -exec cmd {} \\;", "run cmd on every result — echo-test it first"],
            ["which cmd", "where a program lives in $PATH"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
