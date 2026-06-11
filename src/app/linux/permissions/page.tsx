"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "why", label: "Why Permissions Exist" },
  { id: "decode", label: "Decoding rwxr-xr-x ⭐" },
  { id: "numbers", label: "The Numbers — 755, 644 ⭐" },
  { id: "chmod", label: "chmod — Change Permissions" },
  { id: "anim", label: "Permission Denied → Fixed ⭐" },
  { id: "chown", label: "chown — Change the Owner" },
  { id: "sudo", label: "sudo — Borrow Root Power" },
  { id: "dirs", label: "x on Directories (Weird!)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxPermissionsPage() {
  return (
    <TopicShell
      icon="🛡️"
      title="Permissions — chmod · chown · sudo"
      gradientWord="Permissions"
      subtitle="The rwxr-xr-x wall, finally decoded: who may read, write and run every file. Plus chmod in both letter and number styles, chown, and what sudo ACTUALLY does."
      nav={NAV}
      next={{ icon: "👥", label: "Users & Groups", href: "/linux/users" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why Permissions Exist">
        <P>
          Linux was born multi-user: one machine, many people. Permissions are the rules that
          stop user <IC>sam</IC> from reading your mail, and stop a hacked web app from
          rewriting system files. Every single file carries three questions × three audiences:
          <strong> who</strong> may <strong>read / write / execute</strong>?
        </P>
        <Callout type="analogy">
          🏢 An office building: your office (your files), the team room (group files), the
          lobby (public). Permissions are the keycard rules — and root is building security, who
          opens every door.
        </Callout>
      </Section>

      {/* 02 ─ DECODE */}
      <Section id="decode" number="02" title="Decoding rwxr-xr-x ⭐">
        <CodeBlock
          title="decode.txt"
          runnable={false}
          code={`-  rwx  r-x  r--    deploy.sh   dee  dev
│  ─┬─  ─┬─  ─┬─                ─┬─  ─┬─
│   │    │    └─ OTHERS: read only │    └─ the file's GROUP
│   │    └─ GROUP (dev): read + execute └─ the file's OWNER
│   └─ OWNER (dee): read + write + execute
└─ type: - file · d directory · l link

r = read it    w = change it    x = RUN it    - = not allowed`}
        />
        <P>
          Always three triplets: <strong>owner → group → others</strong>. When you access a
          file, Linux checks which audience you are (in that order) and applies{" "}
          <strong>that triplet only</strong>.
        </P>
        <Table
          head={["Letter", "On a FILE means", "On a DIRECTORY means"]}
          rows={[
            [<IC key="r">r</IC>, "read the contents", "list what's inside (ls)"],
            [<IC key="w">w</IC>, "modify it", "create/delete files inside"],
            [<IC key="x">x</IC>, "execute it as a program", "ENTER it (cd) — see §08"],
          ]}
        />
      </Section>

      {/* 03 ─ NUMBERS */}
      <Section id="numbers" number="03" title="The Numbers — Why 755 Means rwxr-xr-x ⭐">
        <CodeBlock
          title="numbers.txt"
          runnable={false}
          code={`each triplet is a 3-bit number:   r=4   w=2   x=1   (just add them!)

rwx = 4+2+1 = 7        rwxr-xr-x  →  7 5 5
r-x = 4+1   = 5        rw-r--r--  →  6 4 4
rw- = 4+2   = 6        rwx------  →  7 0 0
r-- = 4     = 4        rw-rw-r--  →  6 6 4`}
        />
        <Table
          head={["Number", "Meaning", "Typical for"]}
          rows={[
            [<IC key="1">755</IC>, "owner: all · everyone else: read+run", "scripts, programs, directories"],
            [<IC key="2">644</IC>, "owner: read+write · others: read", "normal files, configs, web pages"],
            [<IC key="3">600</IC>, "owner only, no execute", "secrets, SSH keys, .env files"],
            [<IC key="4">777</IC>, "EVERYONE can do EVERYTHING", "almost never — a code smell 🚩"],
          ]}
        />
        <Callout type="mistake">
          When something fails with permission errors, Stack Overflow loves suggesting{" "}
          <IC>chmod 777</IC>. It &quot;works&quot; the way removing your front door
          &quot;fixes&quot; losing your key. Find the real owner/permission problem — and know
          that ssh outright <strong>refuses</strong> keys that aren&apos;t 600.
        </Callout>
      </Section>

      {/* 04 ─ CHMOD */}
      <Section id="chmod" number="04" title="chmod — Change Permissions (Two Dialects)">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# LETTER style: who (u/g/o/a) + add/remove (+/-) + what (r/w/x)
$ chmod +x deploy.sh        # everyone may execute — THE classic
$ chmod u+w notes.txt       # owner may write
$ chmod o-r secrets.txt     # others may NOT read
$ chmod g+rw shared.txt     # group gets read+write

# NUMBER style: set all three triplets at once
$ chmod 755 deploy.sh
$ chmod 600 ~/.ssh/id_ed25519
$ chmod -R 644 docs/        # -R: recursive (careful!)`}
        />
        <Callout type="tip">
          Letters to <strong>tweak</strong> one thing (<IC>+x</IC>), numbers to{" "}
          <strong>set</strong> a known-good state (<IC>600</IC>). Both dialects appear constantly
          in docs — you need to read both.
        </Callout>
      </Section>

      {/* 05 ─ ANIM */}
      <Section id="anim" number="05" title="Permission Denied → Fixed, Animated ⭐">
        <CmdPlay
          title="the chmod +x ritual"
          steps={[
            {
              cmd: "./deploy.sh",
              out: ["bash: ./deploy.sh: Permission denied ✗"],
              narrative: "You wrote a script, you try to run it — DENIED. Look at the x column: nobody has execute permission. New files are never executable by default.",
              visualTitle: "the file's permissions",
              tree: [
                { id: "f", label: "deploy.sh", kind: "file", icon: "📜", state: "active", note: "-rw-r--r--  ← no x anywhere!" },
              ],
            },
            {
              cmd: "ls -l deploy.sh",
              out: ["-rw-r--r-- 1 dee dev 412 Jan 11 10:02 deploy.sh"],
              narrative: "Diagnose before fixing: ls -l confirms it. Owner can read+write (rw-), but the x slot is a dash in all three triplets.",
              visualTitle: "the file's permissions",
              tree: [
                { id: "f", label: "deploy.sh", kind: "file", icon: "📜", note: "rw- r-- r--" },
                { id: "o", label: "owner dee:  rw-  (no x)", depth: 1, icon: "👤", state: "active" },
                { id: "g", label: "group dev:  r--", depth: 1, icon: "👥", state: "dim" },
                { id: "x", label: "others:     r--", depth: 1, icon: "🌍", state: "dim" },
              ],
            },
            {
              cmd: "chmod +x deploy.sh",
              narrative: "chmod +x flips the execute bit ON for owner, group and others. Watch the dashes become x's — the file's content didn't change one byte, only its metadata.",
              visualTitle: "the file's permissions",
              tree: [
                { id: "f", label: "deploy.sh", kind: "file", icon: "📜", note: "rwx r-x r-x" },
                { id: "o", label: "owner dee:  rwx  ✓", depth: 1, icon: "👤", state: "new" },
                { id: "g", label: "group dev:  r-x  ✓", depth: 1, icon: "👥", state: "new" },
                { id: "x", label: "others:     r-x  ✓", depth: 1, icon: "🌍", state: "new" },
              ],
            },
            {
              cmd: "./deploy.sh",
              out: ["deploying...", "done ✓"],
              narrative: "Same command that failed 10 seconds ago now runs. The full ritual: try → Permission denied → ls -l to diagnose → chmod → retry. You'll do this hundreds of times.",
              visualTitle: "the file's permissions",
              tree: [
                { id: "f", label: "deploy.sh", kind: "file", icon: "📜", state: "active", note: "-rwxr-xr-x  → runs! ✓" },
              ],
            },
          ]}
        />
      </Section>

      {/* 06 ─ CHOWN */}
      <Section id="chown" number="06" title="chown — Change Who Owns It">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sudo chown sam report.txt          # new owner
$ sudo chown sam:dev report.txt      # owner AND group
$ sudo chown -R www-data:www-data /var/www/app   # the deploy classic ⭐`}
        />
        <Callout type="behind">
          That last line is real-life: you upload a website as <IC>dee</IC>, but the web server
          runs as user <IC>www-data</IC> — so it can&apos;t write uploads or logs into your
          folder. <IC>chown -R</IC> hands the whole tree to the server&apos;s user. (Changing
          owners affects others, so chown itself needs <IC>sudo</IC>.)
        </Callout>
      </Section>

      {/* 07 ─ SUDO */}
      <Section id="sudo" number="07" title="sudo — Borrow Root, One Command at a Time">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cat /etc/shadow            # the password-hash file
cat: /etc/shadow: Permission denied

$ sudo cat /etc/shadow       # run THIS ONE command as root
[sudo] password for dee: ●●●●●●●●
root:$6$xyz...               # works — you were root for one command

$ sudo -i                    # become root until you type exit  (careful)
$ whoami                     # check who you currently are`}
        />
        <Table
          head={["Command", "Effect", "Risk level"]}
          rows={[
            [<IC key="1">sudo cmd</IC>, "one command as root", "low — surgical"],
            [<IC key="2">sudo -i</IC>, "a full root shell (# prompt)", "high — every keystroke is root"],
            [<IC key="3">su sam</IC>, "switch to another user", "needs THEIR password"],
          ]}
        />
        <Callout type="mistake">
          Reflexively prefixing everything with sudo is how systems get wrecked — a typo&apos;d{" "}
          <IC>sudo rm -rf</IC> has no safety net, and sudo-created files end up root-owned,
          causing the NEXT permission error. Rule: try without sudo first; add it only when
          denied <strong>and</strong> you understand why.
        </Callout>
      </Section>

      {/* 08 ─ DIRS */}
      <Section id="dirs" number="08" title="x on Directories — The Weird One">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ls -ld secret_dir/         # -d: show the DIR itself, not contents
drw-r--r-- 2 dee dev 4096 Jan 11 secret_dir
  ↑ has r, but NO x...

$ ls secret_dir/             # r lets you LIST names...
plans.txt
$ cd secret_dir/             # ...but x is needed to ENTER
bash: cd: secret_dir/: Permission denied
$ cat secret_dir/plans.txt   # or to reach files THROUGH it
cat: secret_dir/plans.txt: Permission denied`}
        />
        <Callout type="analogy">
          🚪 On a directory, <IC>r</IC> is reading the name plate list on the door;{" "}
          <IC>x</IC> is the key that lets you <strong>walk through</strong> it. That&apos;s why
          directories are 755 not 644 — without x, nobody (including you) can reach anything
          inside.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Three triplets", "owner · group · others — each gets rwx slots"],
            ["r w x", "read · write · execute (dirs: list · create/delete · ENTER)"],
            ["The math", "r=4 w=2 x=1 → rwx=7 · r-x=5 · rw-=6"],
            ["755 / 644 / 600", "scripts+dirs · normal files · secrets (ssh demands 600)"],
            ["chmod +x script.sh", "THE classic — new files are never executable"],
            ["777", "🚩 code smell — never the real fix"],
            ["The ritual", "run → denied → ls -l → chmod → retry"],
            ["chown -R user:group", "hand a tree to another user (deploys: www-data)"],
            ["sudo cmd vs sudo -i", "one root command vs full root shell — prefer surgical"],
            ["Dirs need x", "no x = can't cd in or reach files through it"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
