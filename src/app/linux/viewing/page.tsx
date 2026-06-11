"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "pick", label: "Pick the Right Tool" },
  { id: "cat", label: "cat — Dump It All" },
  { id: "less", label: "less — Scroll Big Files ⭐" },
  { id: "head-tail", label: "head & tail — The Edges" },
  { id: "tail-f", label: "tail -f — Live Logs ⭐" },
  { id: "wc", label: "wc — Count Things" },
  { id: "file", label: "file & stat — What IS This?" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxViewingPage() {
  return (
    <TopicShell
      icon="👀"
      title="Reading Files"
      gradientWord="Reading"
      subtitle="Five tools, one decision: how big is the file and which part do you want? cat for small, less for big, head/tail for the edges, tail -f for logs that are still being written."
      nav={NAV}
      next={{ icon: "🔍", label: "Finding Things — find & grep", href: "/linux/search" }}
    >
      {/* 01 ─ PICK */}
      <Section id="pick" number="01" title="Pick the Right Tool — The Decision Table">
        <Table
          head={["Situation", "Tool", "Why"]}
          rows={[
            ["small file (< 1 screen)", <IC key="1">cat file</IC>, "dump it all, done"],
            ["big file — read/scroll", <IC key="2">less file</IC>, "pages, searches, doesn't load it all"],
            ["just the beginning", <IC key="3">head file</IC>, "first 10 lines (headers, format check)"],
            ["just the end", <IC key="4">tail file</IC>, "last 10 lines (newest log entries)"],
            ["file STILL BEING WRITTEN", <IC key="5">tail -f file</IC>, "live stream — the debugging king"],
            ["how big is it?", <IC key="6">wc -l file</IC>, "count lines before opening"],
          ]}
        />
        <Callout type="mistake">
          <IC>cat</IC> on a 2GB log floods your terminal for minutes (Ctrl+C to escape!). Rule of
          thumb: unknown size → <IC>less</IC>, never <IC>cat</IC>. less only reads what it shows,
          so it opens gigabyte files instantly.
        </Callout>
      </Section>

      {/* 02 ─ CAT */}
      <Section id="cat" number="02" title="cat — Dump It All">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cat config.yaml            # print whole file
$ cat -n script.sh           # with line numbers
$ cat a.txt b.txt            # multiple files, back to back
$ cat a.txt b.txt > both.txt # ...that's why it's called conCATenate`}
          output={`$ cat -n script.sh
     1  #!/bin/bash
     2  echo "deploying..."
     3  ./run.sh`}
        />
        <Callout type="behind">
          cat&apos;s real job is <strong>concatenating</strong> files into one stream — viewing
          a single file is just the side effect everyone uses. The stream part becomes huge in the
          Pipes lesson.
        </Callout>
      </Section>

      {/* 03 ─ LESS */}
      <Section id="less" number="03" title="less — Scroll Through Anything ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ less /var/log/syslog`}
          output={`(opens fullscreen — the file doesn't flood your terminal)

NAVIGATION — same keys as man pages (man literally uses less!):
  Space / b      page down / page up
  ↑ ↓            line by line
  g / G          jump to TOP / BOTTOM
  /error         search forward for "error"
  n / N          next / previous match
  q              quit`}
        />
        <Callout type="tip">
          ⭐ The killer combo for logs: <IC>less +G app.log</IC> opens already scrolled to the
          bottom (newest entries), then <IC>?error</IC> searches <strong>backwards</strong> —
          newest error first.
        </Callout>
      </Section>

      {/* 04 ─ HEAD & TAIL */}
      <Section id="head-tail" number="04" title="head & tail — Just the Edges">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ head data.csv           # first 10 lines (default)
$ head -n 3 data.csv      # first 3
$ tail -n 5 app.log       # last 5
$ tail -n +2 data.csv     # everything EXCEPT line 1 (skip CSV header!)`}
          output={`$ head -n 3 data.csv
name,age,city          ← perfect for checking a file's FORMAT
alice,34,oslo
bob,28,kyoto`}
        />
        <Callout type="tip">
          head answers &quot;what does this file look like?&quot; — tail answers &quot;what
          happened last?&quot; Logs append at the bottom, so <IC>tail</IC> = the newest events.
        </Callout>
      </Section>

      {/* 05 ─ TAIL -F */}
      <Section id="tail-f" number="05" title="tail -f — Watch Logs LIVE ⭐">
        <P>
          <IC>-f</IC> (follow) doesn&apos;t exit — it waits and prints new lines the moment
          they&apos;re written. This is THE debugging tool: watch your server log live while you
          click around your app:
        </P>
        <CmdPlay
          title="tail -f — a live log stream"
          steps={[
            {
              cmd: "tail -f /var/log/app.log",
              out: ["09:14:02 INFO  server started on :8080", "09:14:05 INFO  connected to database"],
              narrative: "tail prints the last lines... and then DOESN'T exit. It sits there, following the file, waiting for more.",
              boxes: [
                { id: "app", label: "your app", sub: "writing log lines as it works", icon: "🟢", state: "active" },
                { id: "file", label: "/var/log/app.log", sub: "file keeps growing", icon: "📄", state: "dim" },
                { id: "tail", label: "tail -f", sub: "watching for new bytes...", icon: "👀", state: "dim" },
                { id: "screen", label: "your terminal", sub: "live feed", icon: "📺", state: "dim" },
              ],
            },
            {
              out: ["09:14:31 INFO  GET /api/users 200 (12ms)"],
              narrative: "Someone hits the API → app writes a line → tail -f sees the file grow and prints it INSTANTLY. No refresh, no re-open.",
              boxes: [
                { id: "app", label: "your app", sub: "handled GET /api/users", icon: "🟢", state: "done" },
                { id: "file", label: "/var/log/app.log", sub: "+1 line appended", icon: "📄", state: "active" },
                { id: "tail", label: "tail -f", sub: "new bytes detected!", icon: "👀", state: "active" },
                { id: "screen", label: "your terminal", sub: "line appears live", icon: "📺", state: "done" },
              ],
            },
            {
              out: ["09:14:48 ERROR db timeout on /api/orders ✗", "^C  (Ctrl+C to stop following)"],
              narrative: "An error scrolls past the moment it happens — you see the crash AS the user experiences it. Ctrl+C stops following.",
              boxes: [
                { id: "app", label: "your app", sub: "ERROR: db timeout!", icon: "🔴", state: "active" },
                { id: "file", label: "/var/log/app.log", sub: "error line appended", icon: "📄", state: "done" },
                { id: "tail", label: "tail -f", sub: "streamed it instantly", icon: "👀", state: "done" },
                { id: "screen", label: "your terminal", sub: "you saw it live → go fix it", icon: "📺", state: "active" },
              ],
            },
          ]}
        />
        <Callout type="tip">
          The pro setup: two terminals side by side — left one runs <IC>tail -f app.log</IC>,
          right one runs your tests/clicks. Cause on the right, effect on the left, in real time.
        </Callout>
      </Section>

      {/* 06 ─ WC */}
      <Section id="wc" number="06" title="wc — Count Lines, Words, Bytes">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ wc report.txt          # lines, words, bytes — all three
$ wc -l access.log       # just LINES (the one you'll use 95% of the time)
$ ls | wc -l             # count files in this folder ← sneak peek of pipes!`}
          output={`$ wc -l access.log
48213 access.log

$ ls | wc -l
17`}
        />
        <Callout type="behind">
          <IC>ls | wc -l</IC> is your first pipe: ls&apos;s output becomes wc&apos;s input, so
          wc counts <strong>lines of output</strong> instead of lines of a file. The entire next
          group of lessons is built on this trick.
        </Callout>
      </Section>

      {/* 07 ─ FILE & STAT */}
      <Section id="file" number="07" title="file & stat — What IS This Thing?">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ file mystery          # identifies content by READING it (not the extension)
$ stat notes.txt        # full metadata: size, perms, every timestamp`}
          output={`$ file mystery
mystery: PNG image data, 1920 x 1080, 8-bit/color RGB
          ↑ extensions are decoration in Linux — file checks the bytes

$ stat notes.txt
  Size: 2348      Blocks: 8     regular file
Access: 2025-01-11 08:30:01     ← last read
Modify: 2025-01-11 08:12:44     ← last content change`}
        />
        <Callout type="behind">
          Linux ignores file extensions — a PNG named <IC>photo.txt</IC> is still a PNG.{" "}
          <IC>file</IC> reads the first bytes (&quot;magic numbers&quot;) to identify content,
          which is also great for &quot;is this log plain text or gzipped?&quot;
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Tool choice", "small→cat · big→less · start→head · end→tail · live→tail -f"],
            ["Never cat big files", "unknown size → less (loads only what it shows)"],
            ["less keys", "Space/b page · /search · n next · G bottom · q quit"],
            ["less +G file", "open at the END — newest log lines first"],
            ["head -n 3 / tail -n 5", "first 3 / last 5 lines"],
            ["tail -n +2", "skip line 1 — drops a CSV header"],
            ["tail -f", "follow a growing file live · Ctrl+C stops"],
            ["wc -l", "count lines — works on files AND piped output"],
            ["ls | wc -l", "count files in a folder (your first pipe)"],
            ["file x / stat x", "identify by content / full metadata"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
