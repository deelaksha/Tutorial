"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "identity", label: "Identity — name & email ⭐" },
  { id: "config-levels", label: "The 3 Config Levels" },
  { id: "essential-config", label: "Essential Config Set" },
  { id: "aliases", label: "Aliases — Your Shortcuts" },
  { id: "init", label: "git init — Anatomy ⭐" },
  { id: "clone", label: "git clone — Both Styles ⭐" },
  { id: "ssh", label: "SSH Keys — Passwordless Push" },
  { id: "help", label: "git help — Built-in Manual" },
  { id: "exceptions", label: "💥 Setup Failures" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GitSetupPage() {
  return (
    <TopicShell
      icon="🔧"
      title="Setup — config, init, clone"
      gradientWord="Setup"
      subtitle="Everything you run ONCE per machine (config, SSH keys) and the two ways every project starts: git init (born locally) or git clone (copied from a server). Every command here is copy-paste ready."
      nav={NAV}
      next={{ icon: "🧬", label: "How Git Stores — Internals", href: "/git/internals" }}
    >
      {/* 01 ─ IDENTITY */}
      <Section id="identity" number="01" title="Identity — The 2 Commands You Must Run First ⭐">
        <P>
          Every commit is stamped with an author. Git refuses to guess who you are — so before your
          first commit, tell it (once per machine):
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git config --global user.name "Deelaksha"
$ git config --global user.email "deelaksha@example.com"

# verify what you set:
$ git config user.name
$ git config user.email`}
          output={`Deelaksha
deelaksha@example.com

Skip this and your first commit greets you with:
  fatal: unable to auto-detect email address
  *** Please tell me who you are. ***`}
        />
        <Callout type="tip">
          Use the <strong>same email as your GitHub account</strong> — that&apos;s how GitHub links
          commits to your profile (and your green contribution squares 🟩). Different email = your
          own commits show up as a gray stranger.
        </Callout>
        <Callout type="behind">
          This stamp is metadata, not authentication — git happily lets you claim any name
          (that&apos;s why serious projects sign commits with{" "}
          <IC>git commit -S</IC> / GPG keys). Authentication happens later, at push time (SSH
          section).
        </Callout>
      </Section>

      {/* 02 ─ CONFIG LEVELS */}
      <Section id="config-levels" number="02" title="The 3 Config Levels — Where Settings Live">
        <CodeBlock
          title="config_levels.txt"
          runnable={false}
          code={`git reads config from 3 files, NARROWER WINS on conflicts:

  --system   /etc/gitconfig               every user on this machine
     ▲           (rarely touched)
  --global   ~/.gitconfig                 YOU, all your repos      ← 95% of use
     ▲           (your personal defaults)
  --local    my_project/.git/config       this ONE repo only
                 (the winner if set)

example: global email = personal@gmail.com
         work repo's local email = deelaksha@company.com
         → commits in the work repo use the company email. ✅`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# set a per-repo override (run INSIDE that repo, no --global):
$ git config user.email "deelaksha@company.com"

# list every setting git currently sees, and WHERE each came from:
$ git config --list --show-origin

# read one value:
$ git config user.email

# remove a setting:
$ git config --global --unset user.email

# edit the file directly in your editor:
$ git config --global --edit`}
          output={`$ git config --list --show-origin
file:/home/deelaksha/.gitconfig         user.name=Deelaksha
file:/home/deelaksha/.gitconfig         user.email=personal@gmail.com
file:.git/config                        user.email=deelaksha@company.com
                                        ▲ local wins for this repo`}
        />
      </Section>

      {/* 03 ─ ESSENTIAL CONFIG */}
      <Section id="essential-config" number="03" title="The Essential Config Set — Copy-Paste Block">
        <P>
          Beyond identity, these five settings prevent 90% of beginner annoyances. Run them all
          once:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# 1. default branch name for NEW repos: main (instead of old 'master')
$ git config --global init.defaultBranch main

# 2. the editor git opens for commit messages (pick ONE):
$ git config --global core.editor "nano"            # easiest in terminal
$ git config --global core.editor "code --wait"     # VS Code
$ git config --global core.editor "vim"             # if you can exit it 😉

# 3. colored output (usually on already, make sure):
$ git config --global color.ui auto

# 4. line endings — prevents phantom "every line changed" diffs:
$ git config --global core.autocrlf input    # Linux / macOS
$ git config --global core.autocrlf true     # Windows

# 5. nicer default for git pull (no surprise merge commits):
$ git config --global pull.rebase false      # explicit default; revisit on Remotes page`}
          output={`(no output = success. Verify the lot:)

$ git config --global --list
user.name=Deelaksha
user.email=deelaksha@example.com
init.defaultbranch=main
core.editor=nano
color.ui=auto
core.autocrlf=input
pull.rebase=false`}
        />
        <Callout type="mistake">
          Skipping #2 is the classic trap: your first <IC>git commit</IC> (without{" "}
          <IC>-m</IC>) throws you into <strong>vim</strong>, and you can&apos;t get out. (For the
          record: <IC>Esc</IC> then <IC>:wq</IC> then Enter.) Set nano or VS Code now and never
          live that meme.
        </Callout>
      </Section>

      {/* 04 ─ ALIASES */}
      <Section id="aliases" number="04" title="Aliases — Teach Git Your Shortcuts">
        <P>
          <IC>git config alias.X &quot;Y&quot;</IC> makes <IC>git X</IC> run <IC>git Y</IC>. The
          four every developer ends up with:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git config --global alias.st "status -sb"
$ git config --global alias.co "checkout"
$ git config --global alias.cm "commit -m"
$ git config --global alias.lg "log --oneline --graph --all --decorate"

# now:
$ git st            # short, branch-aware status
$ git cm "fix bug"  # commit in one breath
$ git lg            # the famous pretty history graph:`}
          output={`$ git lg
* f3a9c21 (HEAD -> main) add login form
* 8d2e4b7 fix navbar overlap
| * 2c5f9a1 (feature/search) try fuzzy search
|/
* 1a4b8c3 first snapshot

'git lg' alone is worth this whole section — you'll run it
50 times a day once branches enter the picture.`}
        />
        <Callout type="note">
          Aliases live in <IC>~/.gitconfig</IC> like any other setting — peek with{" "}
          <IC>git config --global --edit</IC> and you&apos;ll see an <IC>[alias]</IC> block you can
          edit by hand.
        </Callout>
      </Section>

      {/* 05 ─ INIT */}
      <Section id="init" number="05" title="git init — What ACTUALLY Happens ⭐">
        <P>
          <IC>git init</IC> turns any folder into a repository. It feels magical; it&apos;s
          actually just: <strong>create one hidden folder</strong>:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ mkdir shop-app && cd shop-app
$ git init

# proof there's no magic — look what appeared:
$ ls -A
$ ls .git/`}
          output={`Initialized empty Git repository in /home/deelaksha/shop-app/.git/

$ ls -A
.git          ← the ONLY thing init created

$ ls .git/
HEAD  config  description  hooks/  info/  objects/  refs/

your files stay 100% untouched. git init NEVER modifies your code.`}
        />
        <CodeBlock
          title="dot_git_map.txt"
          runnable={false}
          code={`📁 .git/                       ← "the repository" IS this folder
   ├── HEAD                      "which branch am I on?" (a 1-line text file!)
   ├── config                    the --local settings from section 02
   ├── objects/                  ⭐ THE DATABASE — every snapshot lives here
   │                                (next page is entirely about this)
   ├── refs/
   │   └── heads/                one tiny file per branch (just a commit hash)
   ├── hooks/                    scripts git runs on events (pre-commit etc.)
   ├── info/                     repo-local ignore rules
   └── description               only used by old web UIs — ignore it

DELETE .git/  →  your files survive, but ALL history is gone.
                 The project becomes "just a folder" again.
MOVE the folder anywhere → history moves with it. It's self-contained.`}
        />
        <Callout type="mistake">
          Never run <IC>git init</IC> in your home directory (<IC>cd ~ && git init</IC>) — git
          will start tracking <em>everything you own</em>, and every repo inside becomes a
          confusing &quot;repo in a repo&quot;. One project folder = one init. If you did it by
          accident: <IC>rm -rf ~/.git</IC> undoes it harmlessly.
        </Callout>
      </Section>

      {/* 06 ─ CLONE */}
      <Section id="clone" number="06" title="git clone — Copy a Whole Repo (History Included) ⭐">
        <P>
          The other birth story: the project already exists (on GitHub, a teammate&apos;s server…)
          and you copy it — <strong>all files + all history + remote connection</strong>, in one
          command:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# style 1 — HTTPS (works everywhere, asks for credentials on push):
$ git clone https://github.com/torvalds/linux.git

# style 2 — SSH (passwordless after key setup, the daily-driver):
$ git clone git@github.com:torvalds/linux.git

# useful flags:
$ git clone <url> my-folder        # clone INTO a custom folder name
$ git clone --depth 1 <url>        # shallow: latest snapshot only (huge repos, CI)
$ git clone -b dev <url>           # start on branch 'dev' instead of main`}
          output={`$ git clone https://github.com/deelaksha/shop-app.git
Cloning into 'shop-app'...
remote: Enumerating objects: 1284, done.
remote: Counting objects: 100% (1284/1284), done.
Receiving objects: 100% (1284/1284), 2.31 MiB | 4.20 MiB/s, done.
Resolving deltas: 100% (642/642), done.

$ cd shop-app && git log --oneline | head -3
f3a9c21 add login form
8d2e4b7 fix navbar overlap
1a4b8c3 first snapshot          ← the FULL history came along ⭐`}
        />
        <CodeBlock
          title="clone_diagram.txt"
          runnable={false}
          code={`            GITHUB                              YOUR LAPTOP
   ┌──────────────────────┐    git clone    ┌──────────────────────┐
   │ shop-app             │ ──────────────▶ │ shop-app/            │
   │  📸📸📸 all commits   │                 │  📸📸📸 all commits   │
   │  🌿 all branches      │                 │  🌿 all branches      │
   └──────────────────────┘                 │  + remote bookmark:  │
                                            │    origin = that URL │ ⭐
                                            └──────────────────────┘
clone = init + full download + automatic "origin" remote, in one move.
This is also disaster recovery: laptop dies → clone again → nothing lost.`}
        />
        <Table
          head={["", "git init", "git clone"]}
          rows={[
            ["When", "brand-new project, born on your machine", "project already exists on a server"],
            ["Creates", "empty .git/, zero commits", ".git/ pre-filled with full history"],
            ["Remote set up?", "no — you add one later (Remotes page)", "yes — 'origin' points at the URL automatically"],
            ["Typical user", "project creator (once)", "every teammate (and you, on new machines)"],
          ]}
        />
      </Section>

      {/* 07 ─ SSH */}
      <Section id="ssh" number="07" title="SSH Keys — Push Without Typing Passwords">
        <P>
          GitHub no longer accepts account passwords from the command line. Your two options: HTTPS
          + a personal access token, or — what everyone actually uses — an{" "}
          <strong>SSH key pair</strong>: a private key on your laptop, public key uploaded to
          GitHub:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# 1. generate a key pair (Enter through the prompts; passphrase optional):
$ ssh-keygen -t ed25519 -C "deelaksha@example.com"

# 2. show the PUBLIC key and copy it:
$ cat ~/.ssh/id_ed25519.pub

# 3. paste it on GitHub:
#    github.com → Settings → SSH and GPG keys → New SSH key → paste → save

# 4. test the connection:
$ ssh -T git@github.com`}
          output={`$ ssh-keygen -t ed25519 -C "deelaksha@example.com"
Generating public/private ed25519 key pair.
Your identification has been saved in /home/deelaksha/.ssh/id_ed25519
Your public key has been saved in /home/deelaksha/.ssh/id_ed25519.pub

$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK7... deelaksha@example.com

$ ssh -T git@github.com
Hi deelaksha! You've successfully authenticated, but GitHub
does not provide shell access.        ← this message = SUCCESS ✅`}
        />
        <CodeBlock
          title="keypair.txt"
          runnable={false}
          code={`  YOUR LAPTOP                              GITHUB
  ~/.ssh/id_ed25519        🔑 PRIVATE      Settings → SSH keys
     never leaves your machine,           id_ed25519.pub  🔓 PUBLIC
     never shared, ever                      safe to share anywhere

  on every push: github sends a challenge only your private key
  can answer. No passwords cross the network. 🔐`}
        />
        <Callout type="mistake">
          The <IC>.pub</IC> suffix is everything: share <IC>id_ed25519.pub</IC> freely, but if the
          file WITHOUT <IC>.pub</IC> ever leaves your machine, anyone holding it can push as you.
          If that happens, delete the key on GitHub and generate a new pair.
        </Callout>
      </Section>

      {/* 08 ─ HELP */}
      <Section id="help" number="08" title="git help — The Manual Is Built In">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git help commit          # full manual page for a command
$ git commit --help        # exactly the same thing
$ git commit -h            # SHORT flag summary — the daily one ⭐
$ git help -a              # list every git command that exists
$ git help -g              # list concept guides (tutorials inside git!)`}
          output={`$ git commit -h
usage: git commit [-a | --interactive | --patch] [-s] [-v] [-u<mode>]
                  [--amend] [--squash=<commit>] [--fixup=<commit>]
                  [-F <file> | -m <msg>] ...

-h fits on one screen. --help opens the full book.
Forgot a flag mid-work? -h, always -h.`}
        />
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Setup Failures — Reading the Errors">
        <P>
          <strong>Failure 1 — committing before identity is set:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git commit -m "first try"`}
          output={`*** Please tell me who you are.

Run
  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

fatal: unable to auto-detect email address (got 'deelaksha@laptop.(none)')

The fix is literally printed in the error. Git's errors are
unusually helpful — train yourself to actually read them.`}
        />
        <P>
          <strong>Failure 2 — running git commands outside any repo:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ cd /tmp
$ git status`}
          output={`fatal: not a git repository (or any of the parent directories): .git

git looked for a .git/ folder here, then in every parent folder
up to /. Found none. You're simply in the wrong directory —
cd into your project (or git init if it's truly new).`}
        />
        <P>
          <strong>Failure 3 — cloning a typo&apos;d or private URL:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git clone https://github.com/deelaksha/shop-ap.git`}
          output={`Cloning into 'shop-ap'...
remote: Repository not found.
fatal: repository 'https://github.com/deelaksha/shop-ap.git/' not found

Two possible truths behind this ONE message:
  1. the URL has a typo (here: shop-ap vs shop-app)
  2. the repo is PRIVATE and you're not authenticated —
     GitHub says "not found" instead of "no permission" on purpose,
     so outsiders can't probe which private repos exist. 🕵️`}
        />
        <P>
          <strong>Failure 4 — SSH key never added to GitHub:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git clone git@github.com:deelaksha/shop-app.git`}
          output={`git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Checklist, in order:
  1. does a key exist?         ls ~/.ssh/id_ed25519.pub
  2. is it added on GitHub?    Settings → SSH keys
  3. test the handshake:       ssh -T git@github.com
Until "Hi <username>!" appears, every SSH clone/push will fail.`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["First 2 commands ever", "git config --global user.name / user.email"],
            ["Config levels", "system < global (~/.gitconfig) < local (.git/config) — narrower wins"],
            ["See all config + origins", "git config --list --show-origin"],
            ["Default branch = main", "git config --global init.defaultBranch main"],
            ["Escape the vim trap", "set core.editor first (nano / code --wait)"],
            ["git init does ONE thing", "creates .git/ — your files are never touched"],
            ["The repo IS", ".git/ — delete it, history gone; move it, history moves"],
            ["git clone =", "init + full history download + 'origin' remote, automatically"],
            ["Shallow clone", "git clone --depth 1 — latest snapshot only (CI, huge repos)"],
            ["SSH rule", ".pub file = shareable; the other one = never leaves your laptop"],
            ["Test GitHub SSH", "ssh -T git@github.com → 'Hi username!' = working"],
            ["Stuck on a command?", "git <cmd> -h (summary) · git help <cmd> (full manual)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
