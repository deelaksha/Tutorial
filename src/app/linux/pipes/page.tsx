"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "streams", label: "The Three Streams" },
  { id: "redirect", label: "> and >> — Into Files" },
  { id: "stderr", label: "2> — Redirecting Errors" },
  { id: "pipe", label: "| — The Pipe ⭐" },
  { id: "pipe-anim", label: "A Pipeline, Animated ⭐" },
  { id: "input", label: "< and xargs — Into Commands" },
  { id: "chains", label: "&& and || — Chaining" },
  { id: "tee", label: "tee — Split the Stream" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxPipesPage() {
  return (
    <TopicShell
      icon="🪈"
      title="Pipes & Redirection"
      gradientWord="Pipes"
      subtitle="THE idea that makes the shell powerful: every command reads a stream and writes a stream, and you can plug them into each other like LEGO. Small tools + pipes = anything."
      nav={NAV}
      next={{ icon: "🔪", label: "Text Surgery — sort · sed · awk", href: "/linux/text-tools" }}
    >
      {/* 01 ─ STREAMS */}
      <Section id="streams" number="01" title="Every Command Has Three Streams">
        <CodeBlock
          title="streams.txt"
          runnable={false}
          code={`              ┌─────────────┐
 stdin (0) ──▶│   command   │──▶ stdout (1)   normal output
 (input)      │             │──▶ stderr (2)   error messages
              └─────────────┘

# by default: stdin = your keyboard, stdout & stderr = your screen.
# redirection and pipes just RE-PLUG these hoses.`}
        />
        <Table
          head={["Stream", "Number", "Default", "Carries"]}
          rows={[
            [<IC key="0">stdin</IC>, "0", "keyboard", "input the command reads"],
            [<IC key="1">stdout</IC>, "1", "screen", "normal results"],
            [<IC key="2">stderr</IC>, "2", "screen", "errors & warnings (separate hose!)"],
          ]}
        />
        <Callout type="analogy">
          🔌 Think of every command as an appliance with one input hose and two output hoses
          (results + errors). The shell&apos;s superpower is letting you re-plug those hoses —
          into files, into other commands — without the appliance ever knowing.
        </Callout>
      </Section>

      {/* 02 ─ REDIRECT */}
      <Section id="redirect" number="02" title="> and >> — Send Output Into Files">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls -l > listing.txt        # > : write stdout to a file (REPLACES it!)
$ echo "line 2" >> notes.txt # >>: APPEND to the end
$ ls -l                      # nothing on screen — it went to the file
$ cat listing.txt            # there it is`}
          output={`$ echo "backup done" >> deploy.log
$ cat deploy.log
deploy started
backup done            ← appended, old content kept`}
        />
        <Callout type="mistake">
          <IC>&gt;</IC> <strong>truncates first</strong> — <IC>ls &gt; important.txt</IC> wipes
          the file before writing, even if ls then fails. One vs two characters:{" "}
          <IC>&gt;</IC> replace, <IC>&gt;&gt;</IC> append. Logs almost always want{" "}
          <IC>&gt;&gt;</IC>.
        </Callout>
      </Section>

      {/* 03 ─ STDERR */}
      <Section id="stderr" number="03" title="2> — Errors Travel in Their Own Hose">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ find / -name "*.conf" > found.txt
Permission denied        ← still on screen! > only grabbed stdout (1)

$ find / -name "*.conf" > found.txt 2> errors.txt   # split the hoses
$ find / -name "*.conf" > all.txt 2>&1              # merge errors INTO stdout
$ find / -name "*.conf" 2> /dev/null                # THROW errors away ⭐`}
        />
        <Table
          head={["Syntax", "Meaning"]}
          rows={[
            [<IC key="1">2&gt; file</IC>, "send errors to a file"],
            [<IC key="2">2&gt;/dev/null</IC>, "discard errors (the noise-cancel button)"],
            [<IC key="3">2&gt;&amp;1</IC>, "merge errors into stdout (\u201cput hose 2 into hose 1\u201d)"],
            [<IC key="4">&amp;&gt; file</IC>, "both streams to one file (shorthand)"],
          ]}
        />
        <Callout type="behind">
          <IC>/dev/null</IC> is a real (fake) file: a black hole that accepts anything and
          stores nothing. <IC>2&gt;/dev/null</IC> = &quot;errors, into the void&quot; — the
          standard fix for find&apos;s <IC>Permission denied</IC> spam.
        </Callout>
      </Section>

      {/* 04 ─ PIPE */}
      <Section id="pipe" number="04" title="| — The Pipe: Plug Commands Together ⭐">
        <P>
          Redirection plugs a command into a <strong>file</strong>. The pipe <IC>|</IC> plugs a
          command into <strong>another command</strong>: stdout of the left becomes stdin of the
          right.
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls | wc -l                      # count files
$ history | grep "docker"         # search your own history
$ cat access.log | grep "500"     # only the error responses
$ du -sh * | sort -h | tail -3    # 3 biggest things in this folder`}
          output={`$ du -sh * | sort -h | tail -3
312M    Downloads
1.2G    Videos
4.7G    docker-images        ← found the disk hog, three small tools`}
        />
        <Callout type="analogy">
          🏭 An assembly line: each command is one station doing ONE job — produce, filter,
          count, sort. The pipe is the conveyor belt. Linux ships hundreds of tiny single-purpose
          stations precisely BECAUSE the belt exists.
        </Callout>
      </Section>

      {/* 05 ─ PIPE ANIM */}
      <Section id="pipe-anim" number="05" title="A Real Pipeline, Animated ⭐">
        <P>
          The classic: <IC>ps aux | grep python | wc -l</IC> — &quot;how many python processes
          are running?&quot; Watch the data shrink as it flows:
        </P>
        <CmdPlay
          title="data flowing through a pipeline"
          steps={[
            {
              cmd: "ps aux | grep python | wc -l",
              narrative: "Station 1: ps aux dumps EVERY running process — hundreds of lines pour out of its stdout into the first pipe.",
              visualTitle: "the pipeline",
              boxes: [
                { id: "ps", label: "ps aux", sub: "emits 214 lines (all processes)", icon: "🏭", state: "active" },
                { id: "grep", label: "| grep python", sub: "waiting for input...", icon: "🧹", state: "dim" },
                { id: "wc", label: "| wc -l", sub: "waiting for input...", icon: "🧮", state: "dim" },
                { id: "screen", label: "your screen", sub: "...", icon: "📺", state: "dim" },
              ],
            },
            {
              narrative: "Station 2: grep reads those 214 lines from ITS stdin and lets through only lines containing 'python'. 214 → 3. The rest evaporate.",
              visualTitle: "the pipeline",
              boxes: [
                { id: "ps", label: "ps aux", sub: "214 lines → pipe ✓", icon: "🏭", state: "done" },
                { id: "grep", label: "| grep python", sub: "filters: 214 in → 3 out", icon: "🧹", state: "active" },
                { id: "wc", label: "| wc -l", sub: "waiting for input...", icon: "🧮", state: "dim" },
                { id: "screen", label: "your screen", sub: "...", icon: "📺", state: "dim" },
              ],
            },
            {
              narrative: "Station 3: wc -l doesn't care what the lines SAY — it just counts them. 3 lines in, the single character '3' out.",
              visualTitle: "the pipeline",
              boxes: [
                { id: "ps", label: "ps aux", sub: "214 lines → pipe ✓", icon: "🏭", state: "done" },
                { id: "grep", label: "| grep python", sub: "3 lines → pipe ✓", icon: "🧹", state: "done" },
                { id: "wc", label: "| wc -l", sub: "counts: 3 in → \u00223\u0022 out", icon: "🧮", state: "active" },
                { id: "screen", label: "your screen", sub: "...", icon: "📺", state: "dim" },
              ],
            },
            {
              out: ["3"],
              narrative: "Only the LAST command's stdout reaches your screen. 214 lines of raw data became one perfect answer — and no temp files were ever created.",
              visualTitle: "the pipeline",
              boxes: [
                { id: "ps", label: "ps aux", sub: "214 lines ✓", icon: "🏭", state: "done" },
                { id: "grep", label: "| grep python", sub: "3 lines ✓", icon: "🧹", state: "done" },
                { id: "wc", label: "| wc -l", sub: "\u00223\u0022 ✓", icon: "🧮", state: "done" },
                { id: "screen", label: "your screen", sub: "3 python processes running", icon: "📺", state: "active" },
              ],
            },
          ]}
        />
        <Callout type="behind">
          All three commands run <strong>simultaneously</strong> — the kernel passes data
          between them through an in-memory buffer as it&apos;s produced. That&apos;s why you can
          pipe a 100GB file through grep without 100GB of RAM: it streams, chunk by chunk.
        </Callout>
      </Section>

      {/* 06 ─ INPUT */}
      <Section id="input" number="06" title="< and xargs — Feeding Commands">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ wc -l < notes.txt          # < : file becomes stdin
$ sort < names.txt > sorted.txt

# xargs: turn a STREAM into ARGUMENTS for the next command
$ find . -name "*.tmp" | xargs rm          # delete everything find found
$ cat urls.txt | xargs -n1 curl -O         # download every URL, one by one`}
        />
        <Callout type="behind">
          Why xargs? <IC>rm</IC> doesn&apos;t read stdin — it wants filenames as{" "}
          <strong>arguments</strong>. <IC>xargs</IC> is the adapter: it collects the incoming
          stream and bolts it onto the next command as arguments. Pipe for stream-readers, xargs
          for argument-takers.
        </Callout>
      </Section>

      {/* 07 ─ CHAINS */}
      <Section id="chains" number="07" title="&& and || — Chaining With Conditions">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cmd1 ;  cmd2     # run both, no matter what
$ cmd1 && cmd2     # cmd2 ONLY IF cmd1 succeeded  ⭐
$ cmd1 || cmd2     # cmd2 ONLY IF cmd1 FAILED (fallback)

$ mkdir -p out && cd out            # only enter it if it was created
$ npm test && git push              # never push broken code
$ ping -c1 server || echo "DOWN!"   # alert on failure`}
        />
        <Callout type="behind">
          How does <IC>&amp;&amp;</IC> know? Every command exits with a hidden{" "}
          <strong>exit code</strong>: 0 = success, anything else = failure (check the last one
          with <IC>echo $?</IC>). <IC>&amp;&amp;</IC> and <IC>||</IC> simply read that number.
          CI/CD pipelines are built on this exact mechanism.
        </Callout>
        <Callout type="mistake">
          <IC>|</IC> moves <strong>data</strong>; <IC>&amp;&amp;</IC> chains{" "}
          <strong>execution</strong>. <IC>ls | cd dir</IC> is nonsense (cd reads no stdin);{" "}
          <IC>ls &amp;&amp; cd dir</IC> means &quot;if ls works, then cd.&quot;
        </Callout>
      </Section>

      {/* 08 ─ TEE */}
      <Section id="tee" number="08" title="tee — Watch AND Save at Once">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ./deploy.sh | tee deploy.log        # see it live AND keep a copy
$ ./deploy.sh | tee -a deploy.log     # -a appends, like >>
$ ps aux | grep nginx | tee nginx.txt | wc -l   # tap a pipeline mid-flow`}
        />
        <Callout type="analogy">
          A <strong>T-shaped pipe fitting</strong> (hence the name): the stream splits — one
          branch to your screen, one to a file. Perfect for long deploys: watch live, debug from
          the file later.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Three streams", "stdin(0) in · stdout(1) results · stderr(2) errors"],
            ["> vs >>", "replace vs append — logs want >>"],
            ["2>/dev/null", "throw errors into the void (kills Permission denied spam)"],
            ["2>&1", "merge errors into stdout"],
            ["The pipe |", "stdout of left → stdin of right — commands as LEGO"],
            ["Pipes stream", "all commands run at once; 100GB needs no 100GB RAM"],
            ["xargs", "adapter: stream → ARGUMENTS (find ... | xargs rm)"],
            ["&& vs ||", "run if success vs run if failed (exit code 0 = success)"],
            ["| vs &&", "| moves DATA · && chains EXECUTION"],
            ["tee", "split the stream: screen + file at the same time"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
