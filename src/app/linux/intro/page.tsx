"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "why", label: "Why the Terminal?" },
  { id: "pieces", label: "Terminal vs Shell vs Kernel" },
  { id: "enter", label: "What Enter ACTUALLY Does ⭐" },
  { id: "prompt", label: "Reading the Prompt" },
  { id: "anatomy", label: "Anatomy of a Command ⭐" },
  { id: "help", label: "Getting Help — man & --help" },
  { id: "speed", label: "Speed: Tab & History" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxIntroPage() {
  return (
    <TopicShell
      icon="🐚"
      title="The Terminal & The Shell"
      gradientWord="Shell"
      subtitle="Before memorizing commands, understand the machine you're talking to: what a shell IS, what really happens when you press Enter, and how to read any command you'll ever see."
      nav={NAV}
      next={{ icon: "🧭", label: "Navigation — pwd · cd · ls", href: "/linux/navigation" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why the Terminal? (It's Not Nostalgia)">
        <P>
          Every server, every Docker container, every CI pipeline, every cloud machine you will
          ever touch is controlled through a terminal. There is no Finder on a production server.
          The terminal isn&apos;t the &quot;hard way&quot; — it&apos;s the <strong>only way</strong>{" "}
          once you leave your laptop, and the fastest way even on it.
        </P>
        <Table
          head={["GUI", "Terminal", "Winner"]}
          rows={[
            ["Click through 5 folders to find a file", <IC key="a">find . -name &quot;report*&quot;</IC>, "terminal"],
            ["Rename 300 files… one by one", "one loop, 2 seconds", "terminal"],
            ["Repeat yesterday's complex task", "press ↑, press Enter", "terminal"],
            ["Manage a server in another country", "ssh — feels local", "terminal (GUI can't)"],
            ["Browse photos", "🤝 fine, use the GUI", "GUI"],
          ]}
        />
        <Callout type="analogy">
          🚗 GUI vs terminal is automatic vs manual transmission. Automatic is friendlier, but
          the manual driver has more control, and some vehicles (servers, containers, robots)
          only come in manual.
        </Callout>
      </Section>

      {/* 02 ─ PIECES */}
      <Section id="pieces" number="02" title="Terminal vs Shell vs Kernel — Three Different Things">
        <P>
          People say &quot;the terminal&quot; for everything, but three separate programs are
          involved, and knowing which is which explains a LOT of error messages later:
        </P>
        <Table
          head={["Piece", "What it is", "Examples"]}
          rows={[
            [<strong key="t">Terminal</strong>, "the WINDOW — draws text, sends your keystrokes", "GNOME Terminal, iTerm2, Windows Terminal"],
            [<strong key="s">Shell</strong>, "the INTERPRETER — reads your command, finds the program, runs it", "bash, zsh, fish"],
            [<strong key="k">Kernel</strong>, "the OS CORE — actually touches disk, RAM, network, CPU", "Linux itself"],
          ]}
        />
        <CodeBlock
          title="layers.txt"
          runnable={false}
          code={`you type:  ls -l
              │
   ┌──────────▼──────────┐
   │  TERMINAL (window)  │  passes keystrokes along
   └──────────┬──────────┘
   ┌──────────▼──────────┐
   │  SHELL (bash/zsh)   │  parses "ls -l", finds /usr/bin/ls
   └──────────┬──────────┘
   ┌──────────▼──────────┐
   │  KERNEL (Linux)     │  runs the program, reads the disk
   └──────────┬──────────┘
              ▼
   output flows back up to your screen`}
        />
        <Callout type="analogy">
          🍽️ Restaurant: the <strong>terminal</strong> is the dining room, the{" "}
          <strong>shell</strong> is the waiter who understands your order and relays it, the{" "}
          <strong>kernel</strong> is the kitchen that actually cooks. You never enter the kitchen
          — you always go through the waiter.
        </Callout>
      </Section>

      {/* 03 ─ ENTER */}
      <Section id="enter" number="03" title="What Enter ACTUALLY Does ⭐">
        <P>
          Type <IC>ls -l /home</IC> and press Enter. In a few milliseconds, all of this happens —
          watch each stage light up:
        </P>
        <CmdPlay
          title="press Enter, trace the journey"
          steps={[
            {
              cmd: "ls -l /home",
              narrative: "The shell splits your line into words: command = ls, flag = -l, argument = /home. Just text parsing — nothing has run yet.",
              boxes: [
                { id: "type", label: "you press Enter", sub: '"ls -l /home" → the shell', icon: "⌨️", state: "active" },
                { id: "parse", label: "shell parses", sub: "cmd: ls · flag: -l · arg: /home", icon: "🐚", state: "dim" },
                { id: "path", label: "$PATH lookup", sub: "where IS the ls program?", icon: "🗺️", state: "dim" },
                { id: "kernel", label: "kernel executes", sub: "new process runs /usr/bin/ls", icon: "⚙️", state: "dim" },
                { id: "out", label: "output → screen", sub: "stdout flows back to terminal", icon: "📺", state: "dim" },
              ],
            },
            {
              narrative: "The shell hunts for a program literally named 'ls' through every folder listed in your $PATH variable — and finds it at /usr/bin/ls.",
              out: ["(shell searches $PATH...)", "found: /usr/bin/ls ✓"],
              boxes: [
                { id: "type", label: "you press Enter", sub: '"ls -l /home" → the shell', icon: "⌨️", state: "done" },
                { id: "parse", label: "shell parses", sub: "cmd: ls · flag: -l · arg: /home", icon: "🐚", state: "done" },
                { id: "path", label: "$PATH lookup", sub: "/usr/bin/ls — found it!", icon: "🗺️", state: "active" },
                { id: "kernel", label: "kernel executes", sub: "new process runs /usr/bin/ls", icon: "⚙️", state: "dim" },
                { id: "out", label: "output → screen", sub: "stdout flows back to terminal", icon: "📺", state: "dim" },
              ],
            },
            {
              narrative: "The shell asks the kernel to start a new PROCESS running that program. The kernel gives it CPU time and reads the /home directory off the disk.",
              boxes: [
                { id: "type", label: "you press Enter", sub: '"ls -l /home" → the shell', icon: "⌨️", state: "done" },
                { id: "parse", label: "shell parses", sub: "cmd: ls · flag: -l · arg: /home", icon: "🐚", state: "done" },
                { id: "path", label: "$PATH lookup", sub: "/usr/bin/ls — found it!", icon: "🗺️", state: "done" },
                { id: "kernel", label: "kernel executes", sub: "process PID 4302 reads the disk", icon: "⚙️", state: "active" },
                { id: "out", label: "output → screen", sub: "stdout flows back to terminal", icon: "📺", state: "dim" },
              ],
            },
            {
              narrative: "ls writes its results to a stream called stdout, which flows back through the terminal to your eyes. Process ends, shell prints a fresh prompt. Total time: ~5ms.",
              out: ["drwxr-xr-x 12 dee dee 4096 Jan 10 09:14 dee", "drwxr-xr-x  8 sam sam 4096 Jan  8 17:02 sam", "$ ▊  ← shell is ready again"],
              boxes: [
                { id: "type", label: "you press Enter", sub: '"ls -l /home" → the shell', icon: "⌨️", state: "done" },
                { id: "parse", label: "shell parses", sub: "cmd: ls · flag: -l · arg: /home", icon: "🐚", state: "done" },
                { id: "path", label: "$PATH lookup", sub: "/usr/bin/ls — found it!", icon: "🗺️", state: "done" },
                { id: "kernel", label: "kernel executes", sub: "process finished, exit code 0", icon: "⚙️", state: "done" },
                { id: "out", label: "output → screen", sub: "2 lines of stdout delivered ✓", icon: "📺", state: "active" },
              ],
            },
          ]}
        />
        <Callout type="behind">
          ⭐ This pipeline explains the most famous error in Linux:{" "}
          <IC>command not found</IC> simply means <strong>step 3 failed</strong> — the shell
          searched every <IC>$PATH</IC> folder and no program by that name exists (or you typo&apos;d
          it). The kernel was never even involved.
        </Callout>
      </Section>

      {/* 04 ─ PROMPT */}
      <Section id="prompt" number="04" title="Reading the Prompt — It's a Status Bar">
        <CodeBlock
          title="prompt_decoded.txt"
          runnable={false}
          code={`dee@webserver:~/projects$
─┬─ ─┬───────  ─┬───────┬
 │   │          │       └─ $ = normal user · # = root (danger mode!)
 │   │          └─ where you ARE right now (~ = your home folder)
 │   └─ which MACHINE you're on (critical when ssh'd into servers!)
 └─ who you're logged in as`}
        />
        <Callout type="mistake">
          The <IC>user@machine</IC> part saves careers: with 4 ssh tabs open, the prompt is the
          ONLY thing telling you whether <IC>rm -rf</IC> is about to run on your laptop or on{" "}
          <strong>production</strong>. Glance at it before every destructive command.
        </Callout>
        <Callout type="note">
          See <IC>#</IC> instead of <IC>$</IC>? You are <strong>root</strong> — the all-powerful
          admin user. Every command you type executes with zero safety checks. More in the
          permissions lesson.
        </Callout>
      </Section>

      {/* 05 ─ ANATOMY */}
      <Section id="anatomy" number="05" title="Anatomy of Every Command You'll Ever Type ⭐">
        <CodeBlock
          title="anatomy.txt"
          runnable={false}
          code={`  ls    -l  -a     /home/dee
  ─┬─   ─┬────     ─┬───────
COMMAND  FLAGS     ARGUMENTS
the      HOW to    WHAT to act on
program  behave    (files, folders, text...)

# flags come in two styles:
ls -l -a        # short: one dash, one letter
ls -la          # short flags can MERGE  ← you'll see this everywhere
ls --all        # long: two dashes, full word (readable, used in scripts)`}
        />
        <Table
          head={["Piece", "Rule", "Example"]}
          rows={[
            ["command", "always first — the program to run", <IC key="1">ls</IC>],
            ["flags / options", "start with - or --, modify behavior", <IC key="2">-l, -a, --all</IC>],
            ["arguments", "the targets — files, dirs, text", <IC key="3">/home/dee</IC>],
            ["merged flags", "-l -a ≡ -la (order rarely matters)", <IC key="4">ls -lah</IC>],
          ]}
        />
        <Callout type="tip">
          ⭐ This grammar is universal. <IC>git commit -m &quot;msg&quot;</IC>,{" "}
          <IC>docker run -d nginx</IC>, <IC>pip install -U flask</IC> — command, flags, arguments,
          every time. Learn to see the three slots and no command will ever look like gibberish
          again.
        </Callout>
      </Section>

      {/* 06 ─ HELP */}
      <Section id="help" number="06" title="Getting Help — Never Memorize Flags Again">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls --help        # quick: prints flags right in the terminal
$ man ls           # full MANual page (q quits, / searches, n = next match)
$ man -k copy      # don't know the command's name? search by topic`}
          output={`$ man -k copy
cp (1)        - copy files and directories
scp (1)       - secure copy (remote file copy program)
rsync (1)     - fast, versatile remote file-copying tool`}
        />
        <Table
          head={["Inside man pages", "Key", "Does"]}
          rows={[
            ["scroll", "↑/↓ or Space", "move through the page"],
            ["search", "/keyword + Enter", "jump to a word"],
            ["next match", "n", "next search result"],
            ["quit", "q", "back to the prompt"],
          ]}
        />
        <Callout type="tip">
          Pros don&apos;t memorize flags — they remember a command exists and check{" "}
          <IC>--help</IC> in 3 seconds. Memorize commands&apos; <strong>names and purposes</strong>;
          look up the spelling.
        </Callout>
      </Section>

      {/* 07 ─ SPEED */}
      <Section id="speed" number="07" title="Speed: Tab Completion & History">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cd Doc<Tab>            # → cd Documents/   (shell finishes it!)
$ cd D<Tab><Tab>         # ambiguous? double-Tab lists all options
$ <↑>                    # previous command (press again: older)
$ history                # numbered list of everything you've run
$ !!                     # re-run the LAST command
$ sudo !!                # the classic: re-run last command with sudo
$ <Ctrl+R>git pu         # SEARCH history as you type  ← life-changing
$ <Ctrl+C>               # cancel the current line / kill running program
$ <Ctrl+L>               # clear the screen`}
        />
        <Callout type="mistake">
          Typing long paths by hand is the #1 beginner time-sink AND typo source. If you
          aren&apos;t hitting Tab two or three times per command, you&apos;re doing it the hard
          way — Tab also <strong>proves the path exists</strong> before you run anything.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Three layers", "terminal = window · shell = interpreter · kernel = OS core"],
            ["Enter pipeline", "parse → $PATH lookup → kernel runs process → stdout back"],
            ["command not found", "= $PATH search failed — typo or not installed"],
            ["Prompt = status bar", "user@machine:where$ — check it before destructive cmds"],
            ["$ vs #", "$ normal user · # root (all-powerful, be careful)"],
            ["Command grammar", "COMMAND -flags arguments — universal, every tool"],
            ["Merged flags", "ls -l -a ≡ ls -la"],
            ["Help, fast", "cmd --help (quick) · man cmd (full, q to quit)"],
            ["Tab completion", "completes AND validates paths — use it constantly"],
            ["Ctrl+R", "search your command history as you type"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
