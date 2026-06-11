"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "tree", label: "The Filesystem is a Tree" },
  { id: "pwd", label: "pwd — Where Am I?" },
  { id: "paths", label: "Absolute vs Relative Paths ⭐" },
  { id: "cd", label: "cd — Walking the Tree ⭐" },
  { id: "ls", label: "ls — Look Around" },
  { id: "ls-l", label: "Reading ls -l Output" },
  { id: "tour", label: "Tour: / Top-Level Folders" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxNavigationPage() {
  return (
    <TopicShell
      icon="🧭"
      title="Navigation — pwd · cd · ls"
      gradientWord="Navigation"
      subtitle="The filesystem is one giant tree and you are always standing somewhere inside it. Learn to know where you are, move anywhere, and look around — the three skills every other command builds on."
      nav={NAV}
      next={{ icon: "✏️", label: "Create · Copy · Move · Delete", href: "/linux/files" }}
    >
      {/* 01 ─ TREE */}
      <Section id="tree" number="01" title="The Filesystem is ONE Tree">
        <P>
          No <IC>C:</IC> drive, no <IC>D:</IC> drive. Linux has exactly one tree, and it starts at{" "}
          <IC>/</IC> — called <strong>root</strong>. Every file on every disk, USB stick and
          network share is grafted somewhere onto this one tree:
        </P>
        <CodeBlock
          title="the_tree.txt"
          runnable={false}
          code={`/                      ← root: the top of EVERYTHING
├── home/              ← all users' personal folders live here
│   └── dee/           ← YOUR kingdom (aka ~ )
│       ├── projects/
│       │   └── app/
│       └── notes.txt
├── etc/               ← system configuration files
├── var/log/           ← log files
└── usr/bin/           ← the programs themselves (ls lives here!)`}
        />
        <Callout type="analogy">
          🏢 The filesystem is an office building: <IC>/</IC> is the front door, folders are
          rooms inside rooms, and a path like <IC>/home/dee/projects</IC> is walking directions:
          &quot;front door → home wing → dee&apos;s office → projects cabinet.&quot;
        </Callout>
      </Section>

      {/* 02 ─ PWD */}
      <Section id="pwd" number="02" title="pwd — Where Am I?">
        <P>
          Your shell always has a <strong>current working directory</strong> — the spot in the
          tree where you&apos;re standing. Every relative command acts from there.{" "}
          <IC>pwd</IC> (print working directory) tells you where that is:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ pwd`}
          output={`/home/dee/projects`}
        />
        <Callout type="tip">
          Lost? <IC>pwd</IC>. About to delete something? <IC>pwd</IC> first. It&apos;s the
          &quot;you are here&quot; dot on the mall map — free to check, saves disasters.
        </Callout>
      </Section>

      {/* 03 ─ PATHS */}
      <Section id="paths" number="03" title="Absolute vs Relative Paths ⭐">
        <CodeBlock
          title="paths.txt"
          runnable={false}
          code={`ABSOLUTE — starts with /, works from ANYWHERE (full address)
  /home/dee/projects/app

RELATIVE — starts from where you're STANDING (walking directions)
  (standing in /home/dee)
  projects/app          → /home/dee/projects/app

THE SHORTCUTS — these three appear in every command you'll ever read:
  .     this directory               (cp file .   = copy HERE)
  ..    the parent (one level UP)    (cd ..       = go up)
  ~     YOUR home (/home/dee)        (cd ~/notes  = from anywhere)`}
        />
        <Table
          head={["You type", "Standing in /home/dee/projects", "Resolves to"]}
          rows={[
            [<IC key="1">cd app</IC>, "go down into app", "/home/dee/projects/app"],
            [<IC key="2">cd ..</IC>, "go UP one level", "/home/dee"],
            [<IC key="3">cd ../..</IC>, "up TWO levels", "/home"],
            [<IC key="4">cd ~</IC>, "jump home from anywhere", "/home/dee"],
            [<IC key="5">cd /etc</IC>, "absolute — ignores where you are", "/etc"],
          ]}
        />
        <Callout type="mistake">
          <IC>No such file or directory</IC> usually means a correct path used from the{" "}
          <strong>wrong place</strong>. <IC>projects/app</IC> works from <IC>~</IC> but fails from{" "}
          <IC>/etc</IC>. Fix: check <IC>pwd</IC>, or use an absolute path.
        </Callout>
      </Section>

      {/* 04 ─ CD */}
      <Section id="cd" number="04" title="cd — Walking the Tree ⭐">
        <P>Watch the 📍 marker move as each <IC>cd</IC> runs:</P>
        <CmdPlay
          title="cd — watch yourself move"
          steps={[
            {
              cmd: "pwd",
              out: ["/home/dee"],
              narrative: "Start at home (~). The highlighted node is your current working directory — where every relative path begins.",
              visualTitle: "the tree — 📍 you are here",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "home", label: "home/", depth: 1, kind: "dir" },
                { id: "dee", label: "dee/  📍", depth: 2, kind: "dir", state: "active" },
                { id: "proj", label: "projects/", depth: 3, kind: "dir" },
                { id: "app", label: "app/", depth: 4, kind: "dir", state: "dim" },
                { id: "notes", label: "notes.txt", depth: 3, kind: "file", state: "dim" },
                { id: "etc", label: "etc/", depth: 1, kind: "dir", state: "dim" },
              ],
            },
            {
              cmd: "cd projects/app",
              narrative: "A RELATIVE path: from /home/dee, walk down into projects, then into app. Two levels in one command.",
              visualTitle: "the tree — 📍 you are here",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "home", label: "home/", depth: 1, kind: "dir" },
                { id: "dee", label: "dee/", depth: 2, kind: "dir" },
                { id: "proj", label: "projects/", depth: 3, kind: "dir" },
                { id: "app", label: "app/  📍", depth: 4, kind: "dir", state: "active" },
                { id: "notes", label: "notes.txt", depth: 3, kind: "file", state: "dim" },
                { id: "etc", label: "etc/", depth: 1, kind: "dir", state: "dim" },
              ],
            },
            {
              cmd: "cd ../..",
              narrative: ".. means parent. ../.. climbs TWO levels: app → projects → dee. You're back home.",
              visualTitle: "the tree — 📍 you are here",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "home", label: "home/", depth: 1, kind: "dir" },
                { id: "dee", label: "dee/  📍", depth: 2, kind: "dir", state: "active" },
                { id: "proj", label: "projects/", depth: 3, kind: "dir" },
                { id: "app", label: "app/", depth: 4, kind: "dir", state: "dim" },
                { id: "notes", label: "notes.txt", depth: 3, kind: "file", state: "dim" },
                { id: "etc", label: "etc/", depth: 1, kind: "dir", state: "dim" },
              ],
            },
            {
              cmd: "cd /etc",
              narrative: "An ABSOLUTE path (starts with /): it doesn't matter where you were standing — you teleport straight to /etc.",
              visualTitle: "the tree — 📍 you are here",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "home", label: "home/", depth: 1, kind: "dir", state: "dim" },
                { id: "dee", label: "dee/", depth: 2, kind: "dir", state: "dim" },
                { id: "proj", label: "projects/", depth: 3, kind: "dir", state: "dim" },
                { id: "etc", label: "etc/  📍", depth: 1, kind: "dir", state: "active" },
              ],
            },
            {
              cmd: "cd",
              out: ["(no argument = go home)"],
              narrative: "cd with no argument always jumps to ~. And cd - bounces back to wherever you JUST were. The two fastest moves in the shell.",
              visualTitle: "the tree — 📍 you are here",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "home", label: "home/", depth: 1, kind: "dir" },
                { id: "dee", label: "dee/  📍", depth: 2, kind: "dir", state: "active" },
                { id: "proj", label: "projects/", depth: 3, kind: "dir" },
                { id: "etc", label: "etc/", depth: 1, kind: "dir", state: "dim" },
              ],
            },
          ]}
        />
        <Table
          head={["Command", "Where you end up"]}
          rows={[
            [<IC key="1">cd folder</IC>, "down into folder (relative)"],
            [<IC key="2">cd ..</IC>, "up one level"],
            [<IC key="3">cd</IC>, "home (~) — no argument needed"],
            [<IC key="4">cd -</IC>, "back to your PREVIOUS location (toggle!)"],
            [<IC key="5">cd /any/path</IC>, "teleport — absolute paths work from anywhere"],
          ]}
        />
      </Section>

      {/* 05 ─ LS */}
      <Section id="ls" number="05" title="ls — Look Around">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls               # names only
$ ls -l            # long: permissions, owner, size, date
$ ls -a            # ALL — include hidden .files
$ ls -lah          # the everyday combo: long + all + human sizes
$ ls projects/     # peek inside a folder WITHOUT cd-ing there`}
          output={`$ ls
notes.txt  projects

$ ls -a
.  ..  .bashrc  .ssh  notes.txt  projects
       ↑ hidden files start with a DOT — config lives here`}
        />
        <Callout type="behind">
          &quot;Hidden&quot; is barely hiding: any filename starting with <IC>.</IC> is skipped by
          plain <IC>ls</IC>, that&apos;s all. Tool configs (<IC>.bashrc</IC>, <IC>.gitconfig</IC>,{" "}
          <IC>.ssh/</IC>) use this to stay out of your way — <IC>-a</IC> reveals them.
        </Callout>
      </Section>

      {/* 06 ─ LS -L */}
      <Section id="ls-l" number="06" title="Reading ls -l — Every Column Decoded">
        <CodeBlock
          title="ls_l_decoded.txt"
          runnable={false}
          code={`$ ls -lah
drwxr-xr-x  3 dee dev 4.0K Jan 10 09:14 projects
-rw-r--r--  1 dee dev 2.3K Jan 11 08:30 notes.txt
│└───┬───┘  │ └┬┘ └┬┘ └─┬┘ └────┬─────┘ └───┬───┘
│ permissions │ owner group size  modified    name
│ (next      │
│  lesson!)  └─ link count (ignore for now)
└─ first char: d = directory · - = regular file · l = link`}
        />
        <Callout type="tip">
          For now you only need the <strong>first character</strong> (<IC>d</IC> = folder) and
          the last four columns (size, date, name). The <IC>rwx</IC> wall gets its own full
          lesson — Permissions.
        </Callout>
      </Section>

      {/* 07 ─ TOUR */}
      <Section id="tour" number="07" title="Tour: What Lives at the Top of /">
        <Table
          head={["Folder", "What's inside", "You'll go there for"]}
          rows={[
            [<IC key="1">/home</IC>, "users' personal folders", "your stuff (~)"],
            [<IC key="2">/etc</IC>, "system config files (text!)", "editing app/server settings"],
            [<IC key="3">/var/log</IC>, "log files", "debugging — why did it crash?"],
            [<IC key="4">/usr/bin</IC>, "installed programs", "where commands live ($PATH)"],
            [<IC key="5">/tmp</IC>, "scratch space, wiped on reboot", "temporary experiments"],
            [<IC key="6">/root</IC>, "root user's home (NOT /)", "admin's personal folder"],
            [<IC key="7">/dev, /proc</IC>, "devices & live kernel info as files", "advanced spelunking"],
          ]}
        />
        <Callout type="behind">
          &quot;Everything is a file&quot; is Linux&apos;s deepest design idea: your disk is{" "}
          <IC>/dev/sda</IC>, running-process info is <IC>/proc/4302/</IC>, even random numbers
          come from <IC>/dev/random</IC>. One tree, one set of tools for everything.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["One tree", "everything starts at / — no drive letters"],
            ["pwd", "print where you're standing — check before destructive cmds"],
            ["Absolute vs relative", "starts with / = from root · else = from HERE"],
            [". .. ~", "here · parent · your home — used everywhere"],
            ["cd / cd - / cd ..", "home · back to previous · up one level"],
            ["ls -lah", "the everyday ls: long + hidden + human sizes"],
            ["Hidden files", "names starting with . — ls -a reveals them"],
            ["ls -l first char", "d = directory · - = file · l = link"],
            ["/etc /var/log /usr/bin", "config · logs · programs — the big three"],
            ["No such file or directory", "right path, wrong place — pwd, then retry"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
