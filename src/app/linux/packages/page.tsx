"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "managers", label: "Package Managers" },
  { id: "apt-anim", label: "apt install, Animated ⭐" },
  { id: "apt", label: "The apt Verbs" },
  { id: "update-upgrade", label: "update vs upgrade ⭐" },
  { id: "tar", label: "tar — Finally Memorable ⭐" },
  { id: "zip", label: "zip · gzip" },
  { id: "env", label: "Env Vars & $PATH" },
  { id: "cheatsheet", label: "🗺️ The Giant Cheat Sheet ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxPackagesPage() {
  return (
    <TopicShell
      icon="📦"
      title="Software & Archives + The Cheat Sheet"
      gradientWord="Software"
      subtitle="Install anything with one command (and understand what that command does), untangle tar/zip forever — then the grand finale: every command from this whole track on one sheet."
      nav={NAV}
      next={{ icon: "🐧", label: "Back to Linux overview", href: "/linux" }}
    >
      {/* 01 ─ MANAGERS */}
      <Section id="managers" number="01" title="Package Managers — The App Store, But Better">
        <P>
          On Linux you don&apos;t hunt for installers on sketchy websites. A{" "}
          <strong>package manager</strong> downloads software from your distro&apos;s curated,
          signed repositories — and tracks every file so removal and updates are clean.
        </P>
        <Table
          head={["Distro family", "Manager", "Install command"]}
          rows={[
            ["Ubuntu / Debian", <IC key="1">apt</IC>, "sudo apt install htop"],
            ["Fedora / RHEL", <IC key="2">dnf</IC>, "sudo dnf install htop"],
            ["Arch", <IC key="3">pacman</IC>, "sudo pacman -S htop"],
            ["Alpine (Docker images!)", <IC key="4">apk</IC>, "apk add htop"],
          ]}
        />
        <Callout type="note">
          Same concepts everywhere, different spelling. This page uses <IC>apt</IC>{" "}
          (Ubuntu/Debian — the most common); check <IC>cat /etc/os-release</IC> on an unfamiliar
          machine to know which dialect to speak.
        </Callout>
      </Section>

      {/* 02 ─ APT ANIM */}
      <Section id="apt-anim" number="02" title="What apt install ACTUALLY Does ⭐">
        <CmdPlay
          title="sudo apt install htop"
          steps={[
            {
              cmd: "sudo apt install htop",
              narrative: "apt consults its LOCAL index (a cached catalog of the repos) — finds htop, computes what else it needs (dependencies), and shows the plan.",
              visualTitle: "the install pipeline",
              boxes: [
                { id: "index", label: "local package index", sub: "htop 3.3.0 found · needs libnl", icon: "🗂️", state: "active" },
                { id: "repo", label: "repository (online)", sub: "signed package archive", icon: "☁️", state: "dim" },
                { id: "verify", label: "verify signatures", sub: "is this really from Ubuntu?", icon: "🔏", state: "dim" },
                { id: "install", label: "unpack to /usr/bin", sub: "files placed, registered", icon: "📦", state: "dim" },
              ],
            },
            {
              out: ["The following NEW packages will be installed:", "  htop libnl-3-200", "Need to get 412 kB. Continue? [Y/n] y", "Get:1 http://archive.ubuntu.com ... htop 3.3.0 [398 kB]"],
              narrative: "You approve, apt downloads the package files (.deb) — htop AND its dependency — from the repository mirrors.",
              visualTitle: "the install pipeline",
              boxes: [
                { id: "index", label: "local package index", sub: "plan ready ✓", icon: "🗂️", state: "done" },
                { id: "repo", label: "repository (online)", sub: "downloading 412 kB...", icon: "☁️", state: "active" },
                { id: "verify", label: "verify signatures", sub: "is this really from Ubuntu?", icon: "🔏", state: "dim" },
                { id: "install", label: "unpack to /usr/bin", sub: "files placed, registered", icon: "📦", state: "dim" },
              ],
            },
            {
              narrative: "Every package is cryptographically signed by the distro. apt verifies the signature before touching your system — a tampered mirror gets caught here.",
              visualTitle: "the install pipeline",
              boxes: [
                { id: "index", label: "local package index", sub: "plan ready ✓", icon: "🗂️", state: "done" },
                { id: "repo", label: "repository (online)", sub: "downloaded ✓", icon: "☁️", state: "done" },
                { id: "verify", label: "verify signatures", sub: "authentic ✓ untampered ✓", icon: "🔏", state: "active" },
                { id: "install", label: "unpack to /usr/bin", sub: "files placed, registered", icon: "📦", state: "dim" },
              ],
            },
            {
              out: ["Unpacking htop (3.3.0) ...", "Setting up htop (3.3.0) ...", "$ htop   ← just works ✓"],
              narrative: "Files unpack into place (/usr/bin/htop, man pages, configs) and every path is RECORDED — which is why apt remove can cleanly undo all of this later.",
              visualTitle: "the install pipeline",
              boxes: [
                { id: "index", label: "local package index", sub: "plan ready ✓", icon: "🗂️", state: "done" },
                { id: "repo", label: "repository (online)", sub: "downloaded ✓", icon: "☁️", state: "done" },
                { id: "verify", label: "verify signatures", sub: "authentic ✓", icon: "🔏", state: "done" },
                { id: "install", label: "unpack to /usr/bin", sub: "htop installed & registered ✓", icon: "📦", state: "active" },
              ],
            },
          ]}
        />
      </Section>

      {/* 03 ─ APT VERBS */}
      <Section id="apt" number="03" title="The apt Verbs">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sudo apt update              # refresh the local index (catalog)
$ apt search markdown          # find packages by keyword
$ apt show htop                # details before installing
$ sudo apt install htop        # install
$ sudo apt remove htop         # uninstall (config files kept)
$ sudo apt purge htop          # uninstall + configs
$ sudo apt autoremove          # sweep out orphaned dependencies
$ sudo apt upgrade             # upgrade everything installed`}
        />
        <Callout type="tip">
          The monthly hygiene line:{" "}
          <IC>sudo apt update &amp;&amp; sudo apt upgrade &amp;&amp; sudo apt autoremove</IC> —
          refresh, upgrade, sweep. (Notice the <IC>&amp;&amp;</IC> from the pipes lesson: each
          step only runs if the previous succeeded.)
        </Callout>
      </Section>

      {/* 04 ─ UPDATE VS UPGRADE */}
      <Section id="update-upgrade" number="04" title="update vs upgrade — Not What They Sound Like ⭐">
        <Table
          head={["Command", "What it touches", "Analogy"]}
          rows={[
            [<IC key="1">apt update</IC>, "ONLY the catalog — no software changes", "fetch the new menu"],
            [<IC key="2">apt upgrade</IC>, "the actual installed packages", "order the new dishes"],
          ]}
        />
        <Callout type="mistake">
          The day-1 trap: <IC>apt install thing</IC> fails with <IC>404 Not Found</IC> on a
          fresh machine because your local catalog is stale or empty.{" "}
          <strong>Always <IC>apt update</IC> first</strong> — that&apos;s also why every
          Dockerfile says <IC>RUN apt update &amp;&amp; apt install -y ...</IC> as one line.
        </Callout>
      </Section>

      {/* 05 ─ TAR */}
      <Section id="tar" number="05" title="tar — Finally Memorable ⭐">
        <P>
          Half the software and datasets on the internet ship as <IC>.tar.gz</IC> — a folder
          tree <strong>tar</strong>red into one file, then g<strong>z</strong>ipped. Two
          commands cover 95% of life:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# PACK:    Compress Zee Files!
$ tar -czf backup.tar.gz my_folder/

# UNPACK:  eXtract Zee Files!
$ tar -xzf backup.tar.gz

# peek inside WITHOUT extracting:
$ tar -tzf backup.tar.gz | head
# extract somewhere specific:
$ tar -xzf backup.tar.gz -C /tmp/restore/`}
        />
        <Table
          head={["Flag", "Mnemonic", "Means"]}
          rows={[
            [<IC key="c">c</IC>, "Create", "pack an archive"],
            [<IC key="x">x</IC>, "eXtract", "unpack an archive"],
            [<IC key="z">z</IC>, "Zip", "gzip compression (the .gz part)"],
            [<IC key="f">f</IC>, "File", "next word is the filename — keep f LAST"],
            [<IC key="t">t</IC>, "lisT", "show contents without extracting"],
            [<IC key="v">v</IC>, "Verbose", "print each file as it goes"],
          ]}
        />
        <Callout type="tip">
          ⭐ Burn in the two phrases: <strong>Compress Zee Files</strong> (<IC>-czf</IC>) and{" "}
          <strong>eXtract Zee Files</strong> (<IC>-xzf</IC>). You will never google
          &quot;how to untar&quot; again.
        </Callout>
      </Section>

      {/* 06 ─ ZIP */}
      <Section id="zip" number="06" title="zip · gzip — The Other Archives">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ zip -r project.zip project/     # make a .zip (Windows-friendly!)
$ unzip project.zip               # extract
$ unzip -l project.zip            # list contents first

$ gzip huge.log                   # → huge.log.gz (REPLACES the original!)
$ gunzip huge.log.gz              # back to normal
$ zcat huge.log.gz | grep ERROR   # search WITHOUT decompressing ⭐`}
        />
        <Callout type="note">
          Sending to Windows folks → <IC>zip</IC>. Linux-to-Linux → <IC>tar.gz</IC> (it
          preserves permissions and owners; zip mangles them). Rotated logs (<IC>app.log.1.gz</IC>)
          → read in place with <IC>zcat</IC>/<IC>zless</IC>.
        </Callout>
      </Section>

      {/* 07 ─ ENV */}
      <Section id="env" number="07" title="Env Vars & $PATH — Closing the Loop">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ echo $HOME                  # variables the shell carries
/home/dee
$ echo $PATH                  # the folder list from lesson 1!
/usr/local/bin:/usr/bin:/bin

$ export API_KEY=abc123       # set for THIS shell + its children
$ echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc   # make it permanent
$ source ~/.bashrc            # reload without re-login`}
        />
        <Callout type="behind">
          Full circle: in lesson 1 you learned the shell finds programs via <IC>$PATH</IC>. Now
          you can <strong>extend</strong> it — drop your own scripts in <IC>~/bin</IC>, add it to
          PATH in <IC>~/.bashrc</IC>, and your commands feel built-in. Exported vars are also how
          apps get config (<IC>DATABASE_URL</IC>, <IC>API_KEY</IC>) — in dev, in Docker, in CI.
        </Callout>
      </Section>

      {/* 08 ─ CHEAT SHEET */}
      <Section id="cheatsheet" number="08" title="🗺️ The Giant Cheat Sheet — The Whole Track">
        <P>Every command from all 13 lessons, grouped the way you learned them:</P>
        <CodeBlock
          title="linux_cheatsheet.txt"
          runnable={false}
          code={`# ─── ORIENT ─────────────────────────────────────────────
pwd                       where am I?
whoami · hostname         who am I? which machine?
man cmd · cmd --help      help (q quits man)
history · Ctrl+R          past commands · search them

# ─── MOVE & LOOK ────────────────────────────────────────
cd dir · cd .. · cd -     enter · up · bounce back
ls -lah                   list: long + hidden + human sizes
find . -name "*.log"      find files by name
grep -rn "text" .         search INSIDE files (file:line)

# ─── FILES ──────────────────────────────────────────────
mkdir -p a/b/c            create folder chain
touch f · cp -r s d       create file · copy (dirs need -r)
mv old new                move AND rename
rm -rf dir/               delete forever (pwd + ls first!)

# ─── READ ───────────────────────────────────────────────
cat f · less f            dump small · scroll big (q quits)
head -n5 · tail -n5       first / last lines
tail -f app.log           follow a log LIVE
wc -l                     count lines

# ─── PIPES & TEXT ───────────────────────────────────────
cmd1 | cmd2               stdout → stdin
> · >> · 2>/dev/null      write · append · silence errors
a && b · a || b           if-success · if-failed
sort -n | uniq -c         order · count duplicates
cut -d',' -f2             CSV column 2
sed 's/old/new/g'         find & replace
awk '{print $1}'          whitespace column 1
... | sort -nr | head     the top-N recipe

# ─── PERMISSIONS & USERS ────────────────────────────────
ls -l                     -rwxr-xr-x = owner/group/others
chmod +x f · chmod 600 f  make runnable · owner-only
chown -R user:grp dir     change owner
sudo cmd · sudo -i        one root cmd · root shell (exit!)
adduser sam · groups      create user · my groups

# ─── PROCESSES ──────────────────────────────────────────
ps aux | grep app         find a process
top / htop                live dashboard (q quits)
kill PID → kill -9 PID    polite → force (in that order)
cmd & · jobs · fg         background · list · foreground
nohup cmd > log 2>&1 &    survive logout
lsof -i :8080             who holds that port?

# ─── SYSTEM HEALTH ──────────────────────────────────────
df -h · du -sh * | sort -h   disk full? what filled it?
free -h                      memory (read "available"!)
systemctl status/restart x   service control
systemctl enable --now x     start now AND at boot
journalctl -u x -n 50        service logs

# ─── NETWORK ────────────────────────────────────────────
ping -c4 host             reachable?
curl -X POST -d '{}' url  talk to APIs
ssh user@host             remote shell (check the prompt!)
ssh-keygen → ssh-copy-id  passwordless logins
scp f user@host:path      copy across machines
rsync -avz src/ host:dst  sync only the diff

# ─── SOFTWARE & ARCHIVES ────────────────────────────────
sudo apt update           refresh catalog FIRST
sudo apt install x        install · remove · autoremove
tar -czf out.tgz dir/     Compress Zee Files
tar -xzf in.tgz           eXtract Zee Files
zip -r / unzip            Windows-friendly archives
export VAR=val            env vars · echo $PATH`}
        />
        <Callout type="tip">
          You now hold the complete daily vocabulary of Linux. The path from here is muscle
          memory: use a real terminal for everything you can — and when a command surprises you,
          you know how to interrogate it (<IC>man</IC>, <IC>--help</IC>, and a safe experiment
          in <IC>/tmp</IC>).
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Package manager", "curated, signed, tracked — apt (Debian) · dnf (Fedora)"],
            ["update vs upgrade", "refresh the CATALOG vs upgrade the SOFTWARE"],
            ["Fresh machine rule", "apt update FIRST, then install (404 fix)"],
            ["Hygiene line", "apt update && apt upgrade && apt autoremove"],
            ["remove vs purge", "keep configs vs delete configs too"],
            ["tar pack", "-czf — Compress Zee Files"],
            ["tar unpack", "-xzf — eXtract Zee Files (·-tzf peeks first)"],
            ["zip vs tar.gz", "for Windows vs for Linux (keeps permissions)"],
            ["zcat log.gz | grep", "search compressed logs without extracting"],
            ["export + ~/.bashrc", "env vars now · permanently (source to reload)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
