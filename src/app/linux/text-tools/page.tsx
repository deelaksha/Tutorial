"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "toolbox", label: "The Toolbox" },
  { id: "sort", label: "sort — Order Lines" },
  { id: "uniq", label: "uniq — Dedupe & Count ⭐" },
  { id: "cut", label: "cut — Slice Columns" },
  { id: "tr", label: "tr — Swap Characters" },
  { id: "sed", label: "sed — Find & Replace ⭐" },
  { id: "awk", label: "awk — Column Superpowers ⭐" },
  { id: "oneliner", label: "Build a Real One-Liner ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxTextToolsPage() {
  return (
    <TopicShell
      icon="🔪"
      title="Text Surgery — sort · uniq · cut · sed · awk"
      gradientWord="Surgery"
      subtitle="Logs, CSVs, configs — servers speak in text. These six tools slice, dedupe, transform and summarize any text stream, and with pipes they combine into one-liners that replace whole scripts."
      nav={NAV}
      next={{ icon: "🛡️", label: "Permissions — chmod · chown · sudo", href: "/linux/permissions" }}
    >
      {/* 01 ─ TOOLBOX */}
      <Section id="toolbox" number="01" title="The Toolbox — One Job Each">
        <Table
          head={["Tool", "One job", "Example"]}
          rows={[
            [<IC key="1">sort</IC>, "order lines", "sort names.txt"],
            [<IC key="2">uniq</IC>, "collapse repeated neighbors (+count)", "uniq -c"],
            [<IC key="3">cut</IC>, "extract columns by delimiter", "cut -d',' -f2"],
            [<IC key="4">tr</IC>, "swap/delete characters", "tr 'a-z' 'A-Z'"],
            [<IC key="5">sed</IC>, "find & replace in a stream", "sed 's/old/new/g'"],
            [<IC key="6">awk</IC>, "column-aware mini-language", "awk '{print $1}'"],
          ]}
        />
        <Callout type="tip">
          None of these edit your file by default — they read a stream, transform it, and print
          the result. Your original is safe until you redirect (<IC>&gt;</IC>) or use
          sed&apos;s <IC>-i</IC>.
        </Callout>
      </Section>

      {/* 02 ─ SORT */}
      <Section id="sort" number="02" title="sort — Put Lines in Order">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sort names.txt           # alphabetical
$ sort -r names.txt        # reverse
$ sort -n sizes.txt        # NUMERIC — 9 before 10 ⭐
$ sort -h sizes.txt        # human sizes: 4.0K < 2M < 1G
$ sort -t',' -k2 data.csv  # CSV: sort by column 2`}
          output={`$ cat sizes.txt | sort      # alphabetical: WRONG for numbers!
10
130
9                          ← "9" > "1", string-wise

$ cat sizes.txt | sort -n   # numeric: right
9
10
130`}
        />
        <Callout type="mistake">
          Default sort is <strong>alphabetical even for numbers</strong> — 10 lands before 9.
          Numbers need <IC>-n</IC>; <IC>du</IC>-style sizes (4.0K, 2M) need <IC>-h</IC>.
        </Callout>
      </Section>

      {/* 03 ─ UNIQ */}
      <Section id="uniq" number="03" title="uniq — Dedupe & Count ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sort visitors.txt | uniq        # unique lines
$ sort visitors.txt | uniq -c     # count each ⭐
$ sort visitors.txt | uniq -d     # show ONLY duplicates`}
          output={`$ sort visitors.txt | uniq -c
     14 alice
     89 bob
      3 carol        ← instant frequency table`}
        />
        <Callout type="mistake">
          uniq only collapses <strong>adjacent</strong> repeats — unsorted input slips
          duplicates straight past it. The phrase to burn in: it&apos;s always{" "}
          <IC>sort | uniq</IC>, never bare <IC>uniq</IC> on raw data.
        </Callout>
      </Section>

      {/* 04 ─ CUT */}
      <Section id="cut" number="04" title="cut — Slice Out Columns">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# -d = delimiter, -f = field number(s)
$ cut -d',' -f1 users.csv        # column 1 of a CSV
$ cut -d',' -f1,3 users.csv      # columns 1 and 3
$ cut -d':' -f1 /etc/passwd      # all usernames on the system`}
          output={`$ cut -d',' -f2 users.csv
age
34
28        ← one column, ready for sort | uniq -c`}
        />
      </Section>

      {/* 05 ─ TR */}
      <Section id="tr" number="05" title="tr — Translate Characters">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ echo "hello" | tr 'a-z' 'A-Z'      # → HELLO
$ tr -d '\\r' < windows.txt > unix.txt # delete Windows \\r line endings ⭐
$ echo "a b   c" | tr -s ' '          # squeeze repeated spaces to one`}
        />
        <Callout type="tip">
          <IC>tr -d &apos;\r&apos;</IC> fixes the classic &quot;my script fails with{" "}
          <IC>bad interpreter ^M</IC>&quot; — a file edited on Windows carries invisible{" "}
          <IC>\r</IC> characters that Linux chokes on.
        </Callout>
      </Section>

      {/* 06 ─ SED */}
      <Section id="sed" number="06" title="sed — Find & Replace in a Stream ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`#        s/FIND/REPLACE/FLAGS
$ sed 's/http:/https:/'   urls.txt     # first match per line
$ sed 's/http:/https:/g'  urls.txt     # g = ALL matches per line ⭐
$ sed -i 's/debug/info/g' config.yaml  # -i = edit the FILE in place ⚠️
$ sed -i.bak 's/x/y/g'    config.yaml  # in place + keep a .bak backup
$ sed '/^#/d' config.yaml              # delete comment lines
$ sed -n '5,10p' big.log               # print only lines 5–10`}
          output={`$ echo "dev mode: dev db, dev cache" | sed 's/dev/prod/g'
prod mode: prod db, prod cache`}
        />
        <Callout type="mistake">
          Two classic stumbles: forgetting <IC>g</IC> (only the first match per line changes),
          and running <IC>-i</IC> without a test run. Ritual: run the sed WITHOUT{" "}
          <IC>-i</IC>, eyeball the output, then add <IC>-i.bak</IC>.
        </Callout>
      </Section>

      {/* 07 ─ AWK */}
      <Section id="awk" number="07" title="awk — When Columns Get Serious ⭐">
        <P>
          awk sees every line pre-split into <IC>$1 $2 $3...</IC> (whitespace-separated, ANY
          amount — no -d fiddling). It can filter, compute and reformat:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ awk '{print $1}' access.log            # column 1 (the IP)
$ awk '{print $1, $9}' access.log        # IP + status code
$ ps aux | awk '$3 > 50'                 # rows where col 3 (CPU%) > 50 ⭐
$ awk -F',' '{print $2}' users.csv       # custom delimiter: -F
$ awk '{sum += $5} END {print sum}' log  # total of column 5`}
          output={`$ ps aux | awk '$3 > 50 {print $11, $3"%"}'
chrome 87.3%
ffmpeg 64.0%          ← filter + reformat, one command`}
        />
        <Callout type="tip">
          cut vs awk: <IC>cut</IC> for single-character delimiters like CSV commas; <IC>awk</IC>{" "}
          for messy whitespace (ps, ls, df output) and ANY math/conditions. When cut feels
          cramped, jump to awk.
        </Callout>
      </Section>

      {/* 08 ─ ONE-LINER */}
      <Section id="oneliner" number="08" title="Build a Real One-Liner, Stage by Stage ⭐">
        <P>
          The job interview classic: <strong>&quot;top 3 IPs hitting our server&quot;</strong> —
          built one pipe at a time from a 50,000-line access log:
        </P>
        <CmdPlay
          title="log analysis pipeline"
          steps={[
            {
              cmd: "awk '{print $1}' access.log",
              out: ["203.0.113.9", "198.51.100.4", "203.0.113.9", "... (50,000 lines)"],
              narrative: "Stage 1 — isolate. awk slices out just column 1: the IP address of every request. 50,000 messy lines become 50,000 clean IPs.",
              visualTitle: "pipeline so far",
              boxes: [
                { id: "log", label: "access.log", sub: "50,000 raw request lines", icon: "📄", state: "done" },
                { id: "awk", label: "awk '{print $1}'", sub: "→ just the IP column", icon: "🔪", state: "active" },
              ],
            },
            {
              cmd: "awk '{print $1}' access.log | sort",
              out: ["198.51.100.4", "198.51.100.4", "203.0.113.9", "203.0.113.9", "..."],
              narrative: "Stage 2 — group. sort lines up identical IPs next to each other — exactly what uniq needs to do its job.",
              visualTitle: "pipeline so far",
              boxes: [
                { id: "log", label: "access.log", sub: "50,000 lines", icon: "📄", state: "done" },
                { id: "awk", label: "awk '{print $1}'", sub: "IPs only", icon: "🔪", state: "done" },
                { id: "sort", label: "| sort", sub: "identical IPs now adjacent", icon: "🗂️", state: "active" },
              ],
            },
            {
              cmd: "... | sort | uniq -c",
              out: ["  12041 198.51.100.4", "  31755 203.0.113.9", "   6204 192.0.2.55"],
              narrative: "Stage 3 — count. uniq -c collapses each group into one line with its count. 50,000 rows → one row per unique IP.",
              visualTitle: "pipeline so far",
              boxes: [
                { id: "log", label: "access.log", sub: "50,000 lines", icon: "📄", state: "done" },
                { id: "awk", label: "awk '{print $1}'", sub: "IPs only", icon: "🔪", state: "done" },
                { id: "sort", label: "| sort", sub: "grouped", icon: "🗂️", state: "done" },
                { id: "uniq", label: "| uniq -c", sub: "count per IP", icon: "🧮", state: "active" },
              ],
            },
            {
              cmd: "... | sort -nr | head -3",
              out: ["  31755 203.0.113.9   ← suspicious!", "  12041 198.51.100.4", "   6204 192.0.2.55"],
              narrative: "Stage 4 — rank. sort -nr orders by count (numeric, reversed), head -3 keeps the podium. 50,000 lines → 3-line answer. That top IP might be an attacker worth blocking.",
              visualTitle: "the full pipeline",
              boxes: [
                { id: "log", label: "access.log", sub: "50,000 lines", icon: "📄", state: "done" },
                { id: "awk", label: "awk '{print $1}'", sub: "IPs only", icon: "🔪", state: "done" },
                { id: "sort", label: "| sort", sub: "grouped", icon: "🗂️", state: "done" },
                { id: "uniq", label: "| uniq -c", sub: "counted", icon: "🧮", state: "done" },
                { id: "rank", label: "| sort -nr | head -3", sub: "top 3 — done ✓", icon: "🏆", state: "active" },
              ],
            },
          ]}
        />
        <CodeBlock
          title="the_finished_oneliner.sh"
          runnable={false}
          code={`awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -3`}
        />
        <Callout type="tip">
          ⭐ The pattern <IC>sort | uniq -c | sort -nr | head</IC> is the universal
          &quot;top N&quot; recipe — top IPs, top error messages, top URLs, most-used commands
          (<IC>history | awk &apos;{"{print $2}"}&apos; | sort | uniq -c | sort -nr | head</IC>).
          Memorize it as one chunk.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["sort -n / -h / -r", "numeric / human-sizes / reverse"],
            ["uniq needs sort", "it only collapses ADJACENT repeats — sort | uniq, always"],
            ["uniq -c", "instant frequency table"],
            ["cut -d',' -f2", "column 2 of a CSV"],
            ["tr 'a-z' 'A-Z' / -d '\\r'", "uppercase / fix Windows line endings"],
            ["sed 's/old/new/g'", "replace everywhere — don't forget the g"],
            ["sed -i.bak", "edit in place WITH a backup — test without -i first"],
            ["awk '{print $1}'", "column 1, any whitespace — no delimiter fuss"],
            ["awk '$3 > 50'", "filter rows by a column's VALUE"],
            ["Top-N recipe", "... | sort | uniq -c | sort -nr | head"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
