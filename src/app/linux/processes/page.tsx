"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "what", label: "Everything Running is a Process" },
  { id: "ps", label: "ps aux — The Snapshot ⭐" },
  { id: "top", label: "top & htop — Live View" },
  { id: "kill", label: "kill — Signals, Animated ⭐" },
  { id: "pkill", label: "pkill & killall — By Name" },
  { id: "bg", label: "& · jobs · fg — Background" },
  { id: "nohup", label: "nohup — Survive Logout" },
  { id: "port", label: "Who's Using That Port? ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxProcessesPage() {
  return (
    <TopicShell
      icon="⚙️"
      title="Processes — ps · top · kill"
      gradientWord="Processes"
      subtitle="Every running program is a process with a PID, an owner, and a parent. See them all, watch them live, send them signals — and unstick a frozen app or a hogged port like a pro."
      nav={NAV}
      next={{ icon: "📊", label: "System Health — df · free · systemctl", href: "/linux/system" }}
    >
      {/* 01 ─ WHAT */}
      <Section id="what" number="01" title="Everything Running is a Process">
        <P>
          Launch a program and the kernel creates a <strong>process</strong>: the program&apos;s
          code plus its own memory, its own <strong>PID</strong> (process ID), an owner, and a
          parent (the process that started it — usually your shell). Processes form a family
          tree rooted at PID 1.
        </P>
        <CodeBlock
          title="process_tree.txt"
          runnable={false}
          code={`systemd (PID 1)              ← the first process; everything descends from it
├── sshd (412)               ← your ssh connection lands here
│   └── bash (2001)          ← your shell is just a process too
│       └── python app.py (4302)   ← started it? you're its parent
├── nginx (893) → workers (894, 895)
└── postgres (1047)`}
        />
        <Callout type="analogy">
          🏭 The kernel is a factory manager: each process is a worker with an ID badge (PID),
          a boss (parent PID), and a payroll identity (owner). <IC>ps</IC> is the personnel
          list; <IC>kill</IC> is how the manager taps a worker on the shoulder.
        </Callout>
      </Section>

      {/* 02 ─ PS */}
      <Section id="ps" number="02" title="ps aux — The Snapshot ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ps aux              # a=everyone's  u=show owners  x=even non-terminal
$ ps aux | grep nginx # the combo you'll actually type ⭐`}
          output={`USER       PID %CPU %MEM    VSZ   RSS START   TIME COMMAND
root         1  0.0  0.1 167744  11M 09:01   0:02 /sbin/init
dee       4302 12.4  3.1 824416 251M 09:14   1:22 python app.py
www-data   893  0.2  0.4  55180  38M 09:02   0:04 nginx: worker
─┬──      ─┬── ─┬── ─┬──                          ─┬─
owner     PID  CPU% MEM%                        the command`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ps aux | grep python`}
          output={`dee   4302 12.4  3.1 python app.py
dee   4951  0.0  0.0 grep python   ← grep finds ITSELF — ignore that line
                                      (trick: grep [p]ython hides it)`}
        />
        <Callout type="tip">
          You almost never read raw <IC>ps aux</IC> — you pipe it: <IC>| grep name</IC> to find
          one app, <IC>| sort -nrk3 | head</IC> for top CPU eaters. The four columns that matter:{" "}
          <strong>USER, PID, %CPU, %MEM</strong>.
        </Callout>
      </Section>

      {/* 03 ─ TOP */}
      <Section id="top" number="03" title="top & htop — The Live Dashboard">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ top         # always installed. inside:
              #   P = sort by CPU · M = sort by memory
              #   k = kill (asks for PID) · q = quit
$ htop        # the nicer one (apt install htop): colors, mouse, F9=kill`}
          output={`top - 09:31  load average: 0.52, 0.41, 0.30
                              ↑ work waiting in line: < CPU count = healthy
MiB Mem:  15843 total,  9214 used
  PID USER   %CPU %MEM  COMMAND
 4302 dee    98.7  3.1  python app.py   ← there's your CPU hog`}
        />
        <Callout type="behind">
          <IC>load average</IC> shows 1-, 5- and 15-minute averages of &quot;how many processes
          are waiting to run.&quot; On a 4-core machine, 4.0 = fully busy, 8.0 = overloaded.
          Three numbers rising = getting worse; falling = recovering.
        </Callout>
      </Section>

      {/* 04 ─ KILL */}
      <Section id="kill" number="04" title="kill — It Sends Signals, Not Bullets ⭐">
        <P>
          <IC>kill</IC> is badly named: it sends a <strong>signal</strong> — a numbered message.
          The process can handle it gracefully... or be removed by the kernel. Watch the
          escalation:
        </P>
        <CmdPlay
          title="kill -15, then -9"
          steps={[
            {
              cmd: "ps aux | grep app",
              out: ["dee   4302 98.7  3.1 python app.py   ← frozen, eating CPU"],
              narrative: "Step 1: find the PID. The app is stuck at 98% CPU and not responding. Its process ID is 4302 — that's the address for our signal.",
              visualTitle: "running processes",
              tree: [
                { id: "init", label: "systemd (1)", icon: "⚙️" },
                { id: "bash", label: "bash (2001)", depth: 1, icon: "🐚" },
                { id: "app", label: "python app.py (4302)", depth: 2, icon: "🔥", state: "active", note: "98% CPU — frozen" },
                { id: "nginx", label: "nginx (893)", depth: 1, icon: "⚙️", state: "dim" },
              ],
            },
            {
              cmd: "kill 4302",
              out: ["(no output — signal 15/SIGTERM sent)"],
              narrative: "kill with no flag sends SIGTERM (15): 'please shut down'. The process CAN catch it — close files, save state, exit cleanly. Always try this first.",
              visualTitle: "running processes",
              tree: [
                { id: "init", label: "systemd (1)", icon: "⚙️" },
                { id: "bash", label: "bash (2001)", depth: 1, icon: "🐚" },
                { id: "app", label: "python app.py (4302)", depth: 2, icon: "📨", state: "active", note: "received SIGTERM... ignoring it" },
                { id: "nginx", label: "nginx (893)", depth: 1, icon: "⚙️", state: "dim" },
              ],
            },
            {
              cmd: "kill -9 4302",
              out: ["(signal 9/SIGKILL sent — the kernel handles this one)"],
              narrative: "Still alive? SIGKILL (9) doesn't go TO the process — the KERNEL erases it directly. Cannot be caught, cannot be ignored. No cleanup happens, so it's the last resort.",
              visualTitle: "running processes",
              tree: [
                { id: "init", label: "systemd (1)", icon: "⚙️" },
                { id: "bash", label: "bash (2001)", depth: 1, icon: "🐚" },
                { id: "app", label: "python app.py (4302)", depth: 2, icon: "💀", state: "gone", note: "erased by the kernel" },
                { id: "nginx", label: "nginx (893)", depth: 1, icon: "⚙️", state: "dim" },
              ],
            },
            {
              cmd: "ps aux | grep app",
              out: ["(nothing — PID 4302 is gone ✓)"],
              narrative: "Verify it's gone. The ladder to remember: kill PID (polite) → wait a few seconds → kill -9 PID (force). Straight to -9 risks corrupted files and lost data.",
              visualTitle: "running processes",
              tree: [
                { id: "init", label: "systemd (1)", icon: "⚙️" },
                { id: "bash", label: "bash (2001)", depth: 1, icon: "🐚" },
                { id: "nginx", label: "nginx (893)", depth: 1, icon: "⚙️" },
              ],
            },
          ]}
        />
        <Table
          head={["Signal", "Name", "Meaning"]}
          rows={[
            [<IC key="1">15</IC>, "SIGTERM", "\u201cplease exit\u201d — catchable, cleanup possible (DEFAULT)"],
            [<IC key="2">9</IC>, "SIGKILL", "kernel erases it — uncatchable, no cleanup, last resort"],
            [<IC key="3">1</IC>, "SIGHUP", "many daemons reload their config on this"],
            [<IC key="4">2</IC>, "SIGINT", "what Ctrl+C sends"],
          ]}
        />
      </Section>

      {/* 05 ─ PKILL */}
      <Section id="pkill" number="05" title="pkill & killall — Skip the PID Lookup">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ pkill -f "python app.py"   # kill by matching the command line
$ killall node               # kill EVERY process named exactly "node"
$ pkill -9 -f runaway.sh     # force, by name`}
        />
        <Callout type="mistake">
          <IC>killall node</IC> kills <strong>every</strong> node process — including the three
          other apps you forgot were running. On shared servers prefer the explicit two-step:{" "}
          <IC>ps aux | grep</IC>, read the list, then <IC>kill</IC> the exact PID.
        </Callout>
      </Section>

      {/* 06 ─ BACKGROUND */}
      <Section id="bg" number="06" title="& · jobs · fg — Background Work">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ python server.py &        # & = run in background, prompt returns
[1] 5102

$ jobs                      # what's running in THIS shell?
[1]+ Running    python server.py &

$ fg %1                     # bring job 1 to the foreground
<Ctrl+Z>                    # freeze (suspend) the foreground app
$ bg %1                     # ...and resume it in the background`}
        />
        <Callout type="tip">
          The save-yourself combo: started a long command and need your terminal back?{" "}
          <IC>Ctrl+Z</IC> (suspend) then <IC>bg</IC> (resume in background) — same result as
          having typed <IC>&amp;</IC> in the first place.
        </Callout>
      </Section>

      {/* 07 ─ NOHUP */}
      <Section id="nohup" number="07" title="nohup — Survive Your Logout">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# the trap: you ssh in, start a server with &, log out...
# → your processes get SIGHUP ("hangup") and DIE with your session.

$ nohup python server.py > app.log 2>&1 &     # immune to logout ⭐
$ exit                                        # server keeps running`}
        />
        <Callout type="behind">
          Background jobs are children of <strong>your shell</strong>; when ssh disconnects, the
          dying shell hangs up on its children (SIGHUP). <IC>nohup</IC> makes the process ignore
          that signal. For real services use <IC>systemctl</IC> (next lesson) — nohup is the
          quick-and-dirty version.
        </Callout>
      </Section>

      {/* 08 ─ PORT */}
      <Section id="port" number="08" title="Who's Using That Port?! ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ python app.py
OSError: [Errno 98] Address already in use      ← the classic

$ lsof -i :8080              # who owns port 8080?
COMMAND   PID USER   NODE NAME
python  4302  dee    TCP *:8080 (LISTEN)

$ kill 4302                  # free the port
$ python app.py              # ✓ works

# alternative: ss -tulpn | grep 8080`}
        />
        <Callout type="tip">
          ⭐ <IC>Address already in use</IC> = a previous (often crashed/zombie) copy of your own
          app still holds the port. <IC>lsof -i :PORT</IC> → <IC>kill PID</IC> → relaunch. One of
          the most-typed sequences in web development.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Process =", "running program: PID + owner + parent — tree from PID 1"],
            ["ps aux | grep x", "find a process (ignore the grep-finds-itself line)"],
            ["top keys", "P cpu · M memory · k kill · q quit (htop is nicer)"],
            ["load average", "waiting work: > CPU-core count = overloaded"],
            ["kill = signals", "default 15 SIGTERM (polite) · -9 SIGKILL (kernel erases)"],
            ["The ladder", "kill PID → wait → kill -9 PID (never start at -9)"],
            ["pkill -f / killall", "kill by name — careful, hits ALL matches"],
            ["& · jobs · fg · Ctrl+Z bg", "background toolkit of your shell"],
            ["nohup cmd > log 2>&1 &", "survives your logout (ssh sessions!)"],
            ["Port busy?", "lsof -i :8080 → kill that PID"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
