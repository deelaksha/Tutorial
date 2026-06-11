"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "create", label: "touch & mkdir — Create" },
  { id: "animated", label: "Watch Files Move ⭐" },
  { id: "cp", label: "cp — Copy" },
  { id: "mv", label: "mv — Move AND Rename ⭐" },
  { id: "rm", label: "rm — Delete (No Trash!)" },
  { id: "wildcards", label: "Wildcards — * and ?" },
  { id: "danger", label: "The rm -rf Safety Briefing" },
  { id: "editors", label: "Quick Edits — nano & vim" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxFilesPage() {
  return (
    <TopicShell
      icon="✏️"
      title="Create · Copy · Move · Delete"
      gradientWord="Files"
      subtitle="The CRUD of the filesystem: touch, mkdir, cp, mv, rm — each one animated against a live folder tree so you SEE what changes, plus the safety briefing that keeps rm from ruining your week."
      nav={NAV}
      next={{ icon: "👀", label: "Reading Files", href: "/linux/viewing" }}
    >
      {/* 01 ─ CREATE */}
      <Section id="create" number="01" title="touch & mkdir — Create Files and Folders">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ touch notes.txt            # create an empty file (or update its timestamp)
$ mkdir projects             # create a folder
$ mkdir -p app/src/utils     # -p: create the WHOLE chain at once ⭐
$ touch app/src/main.py      # paths work everywhere — no cd needed`}
          output={`$ ls -R app
app:
src
app/src:
main.py  utils`}
        />
        <Callout type="mistake">
          <IC>mkdir app/src/utils</IC> fails with <IC>No such file or directory</IC> if{" "}
          <IC>app</IC> doesn&apos;t exist yet — plain mkdir only creates the LAST piece.{" "}
          <IC>-p</IC> (parents) builds the whole chain and never complains. Most people just
          always type <IC>mkdir -p</IC>.
        </Callout>
      </Section>

      {/* 02 ─ ANIMATED */}
      <Section id="animated" number="02" title="Watch Files Move ⭐">
        <P>
          The whole lesson in one animation — create, copy, move, rename, delete, against a live
          tree:
        </P>
        <CmdPlay
          title="file CRUD, animated"
          steps={[
            {
              cmd: "mkdir -p app/src && touch app/notes.txt",
              narrative: "mkdir -p builds the folder chain, touch creates an empty file. Green = just created.",
              tree: [
                { id: "app", label: "app/", kind: "dir", state: "new" },
                { id: "src", label: "src/", depth: 1, kind: "dir", state: "new" },
                { id: "notes", label: "notes.txt", depth: 1, kind: "file", state: "new" },
              ],
            },
            {
              cmd: "cp app/notes.txt app/notes_backup.txt",
              narrative: "cp DUPLICATES: the original stays put, an independent copy appears. Editing one never touches the other.",
              tree: [
                { id: "app", label: "app/", kind: "dir" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "notes", label: "notes.txt", depth: 1, kind: "file", state: "active" },
                { id: "backup", label: "notes_backup.txt", depth: 1, kind: "file", state: "new" },
              ],
            },
            {
              cmd: "mv app/notes.txt app/src/",
              narrative: "mv RELOCATES: the file vanishes from app/ and appears inside src/. One file, new address — nothing was copied.",
              tree: [
                { id: "app", label: "app/", kind: "dir" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "notes2", label: "notes.txt", depth: 2, kind: "file", state: "new" },
                { id: "backup", label: "notes_backup.txt", depth: 1, kind: "file" },
              ],
            },
            {
              cmd: "mv app/notes_backup.txt app/old.txt",
              narrative: "Same command, same folder = RENAME. Linux has no separate rename command — mv does both jobs.",
              tree: [
                { id: "app", label: "app/", kind: "dir" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "notes2", label: "notes.txt", depth: 2, kind: "file" },
                { id: "old", label: "old.txt  (was notes_backup.txt)", depth: 1, kind: "file", state: "new" },
              ],
            },
            {
              cmd: "rm app/old.txt",
              out: ["(no output. no confirmation. no trash.)"],
              narrative: "rm deletes — instantly and silently. There is NO trash bin in the terminal. Gone means gone.",
              tree: [
                { id: "app", label: "app/", kind: "dir" },
                { id: "src", label: "src/", depth: 1, kind: "dir" },
                { id: "notes2", label: "notes.txt", depth: 2, kind: "file" },
                { id: "old", label: "old.txt", depth: 1, kind: "file", state: "gone" },
              ],
            },
          ]}
        />
      </Section>

      {/* 03 ─ CP */}
      <Section id="cp" number="03" title="cp — Copy Files & Folders">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cp source.txt dest.txt        # copy file → new name
$ cp source.txt backups/        # copy file → into a folder (name kept)
$ cp -r projects/ projects_bak/ # folders NEED -r (recursive) ⭐
$ cp -i a.txt b.txt             # -i: ask before overwriting`}
          output={`$ cp projects/ bak/
cp: -r not specified; omitting directory 'projects/'
          ↑ the classic error — folders require -r`}
        />
        <Callout type="mistake">
          <IC>cp a.txt b.txt</IC> when <IC>b.txt</IC> already exists <strong>silently
          overwrites it</strong> — no warning, old contents gone. On anything important, use{" "}
          <IC>cp -i</IC> or check with <IC>ls</IC> first.
        </Callout>
      </Section>

      {/* 04 ─ MV */}
      <Section id="mv" number="04" title="mv — Move AND Rename (Same Command!) ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ mv report.txt archive/          # MOVE: different folder
$ mv draft.txt final.txt          # RENAME: same folder, new name
$ mv old_dir/ new_dir/            # works on folders too — no -r needed!
$ mv *.log logs/                  # move all .log files at once`}
        />
        <Table
          head={["Pattern", "What mv does"]}
          rows={[
            [<IC key="1">mv file dir/</IC>, "move (destination is an existing folder)"],
            [<IC key="2">mv file newname</IC>, "rename (destination is a new name)"],
            [<IC key="3">mv file dir/newname</IC>, "move AND rename in one shot"],
          ]}
        />
        <Callout type="behind">
          Why doesn&apos;t mv need <IC>-r</IC> for folders, while cp does? Because mv doesn&apos;t
          actually move data — it just rewrites the <strong>directory entry</strong> (the file&apos;s
          address tag). That&apos;s also why mv of a 50GB folder on the same disk is instant.
        </Callout>
      </Section>

      {/* 05 ─ RM */}
      <Section id="rm" number="05" title="rm — Delete (There Is No Trash)">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ rm notes.txt              # delete a file. instantly. forever.
$ rm -i notes.txt           # ask first (y/n)
$ rm -r old_project/        # folders need -r (recursive)
$ rmdir empty_dir/          # safer: only works if ALREADY empty
$ rm -rf build/             # -f: don't ask, don't complain  ⚠️`}
        />
        <Callout type="mistake">
          Desktop habits lie to you here: there is <strong>no undo and no trash bin</strong>.{" "}
          <IC>rm</IC> doesn&apos;t move files anywhere — it releases their disk space immediately.
          Before any <IC>rm -r</IC>, run <IC>ls</IC> on the same path to SEE what&apos;s about to
          die.
        </Callout>
      </Section>

      {/* 06 ─ WILDCARDS */}
      <Section id="wildcards" number="06" title="Wildcards — * and ? Multiply Your Commands">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls *.txt              # every file ending in .txt
$ rm *.log              # delete every .log file
$ cp report_* backups/  # everything starting with report_
$ ls data?.csv          # ? = exactly ONE character: data1.csv, dataX.csv`}
          output={`$ ls *.txt
notes.txt  todo.txt  draft.txt`}
        />
        <Callout type="behind">
          The <strong>shell</strong> expands wildcards before the command even runs:{" "}
          <IC>rm *.log</IC> becomes <IC>rm a.log b.log c.log</IC> — rm never sees the star. Test
          any destructive wildcard by running <IC>ls *.log</IC> first: ls shows you{" "}
          <strong>exactly</strong> the list rm would receive.
        </Callout>
      </Section>

      {/* 07 ─ DANGER */}
      <Section id="danger" number="07" title="The rm -rf Safety Briefing">
        <CodeBlock
          title="danger.txt"
          runnable={false}
          code={`rm -rf  =  recursive + force: delete everything below, ask nothing

# the legendary disasters — one character each:
rm -rf /          # tries to delete THE ENTIRE SYSTEM
rm -rf ~          # deletes your whole home folder
rm -rf dir /      # ← stray SPACE: deletes dir... and then /
rm -rf $UNSET/    # empty variable → expands to "rm -rf /"

# the safe ritual, every time:
$ pwd             # 1. where am I?
$ ls target/      # 2. what exactly will die?
$ rm -rf target/  # 3. only now`}
        />
        <Callout type="tip">
          Modern rm refuses bare <IC>rm -rf /</IC> (needs{" "}
          <IC>--no-preserve-root</IC>), but it will happily eat your home folder or a stray-space
          path. The 3-step ritual — <IC>pwd</IC>, <IC>ls</IC>, then <IC>rm</IC> — takes five
          seconds and has saved countless careers.
        </Callout>
      </Section>

      {/* 08 ─ EDITORS */}
      <Section id="editors" number="08" title="Quick Edits — nano (easy) & vim (everywhere)">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ nano notes.txt    # beginner-friendly: edit, Ctrl+O save, Ctrl+X exit
$ vim notes.txt     # on EVERY server. minimum survival kit:
                    #   i        → insert mode (now you can type)
                    #   Esc      → back to command mode
                    #   :wq      → write & quit
                    #   :q!      → quit WITHOUT saving (the escape hatch)`}
        />
        <Callout type="analogy">
          ✏️ nano is a notepad; vim is a fighter jet. You don&apos;t need to fly the jet yet —
          but you WILL get stuck inside it someday (<IC>git commit</IC> opens it by default!), so
          memorize the ejector seat: <IC>Esc :q!</IC>.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["touch / mkdir -p", "create file · create folder chain (always use -p)"],
            ["cp src dest", "duplicate — original stays; folders need -r"],
            ["mv = move AND rename", "destination folder → move · new name → rename"],
            ["mv needs no -r", "it rewrites the address tag, not the data — instant"],
            ["rm has NO trash", "instant, silent, permanent — there is no undo"],
            ["rm -r / rm -rf", "recursive delete · + force (ask nothing) ⚠️"],
            ["The rm ritual", "pwd → ls target/ → only then rm -rf target/"],
            ["* and ?", "* = anything · ? = one char — shell expands them"],
            ["Test wildcards with ls", "ls *.log shows exactly what rm *.log would kill"],
            ["vim escape hatch", "Esc then :q! — leave without saving"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
