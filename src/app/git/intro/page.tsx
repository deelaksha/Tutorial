"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "problem", label: "The Problem Git Solves" },
  { id: "what-is-vc", label: "What Is Version Control?" },
  { id: "snapshots", label: "Git Thinks in Snapshots ⭐" },
  { id: "git-vs-github", label: "Git vs GitHub ⭐" },
  { id: "three-areas", label: "The 3 Areas — The Core Map ⭐" },
  { id: "scenarios", label: "6 Real Rescues" },
  { id: "install", label: "Install & Verify" },
  { id: "first-look", label: "Your First 60 Seconds" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GitIntroPage() {
  return (
    <TopicShell
      icon="🤔"
      title="Why Git & GitHub?"
      gradientWord="Git"
      subtitle="Before any command: WHAT problem does Git solve, what is a 'snapshot', and how is GitHub a different thing from Git? Get this mental map right and every command later becomes obvious."
      nav={NAV}
      next={{ icon: "🔧", label: "Setup — config, init, clone", href: "/git/setup" }}
    >
      {/* 01 ─ PROBLEM */}
      <Section id="problem" number="01" title="The Problem — You've Already Lived It">
        <P>
          Every programmer without version control eventually builds this folder. Be honest —
          you&apos;ve seen it:
        </P>
        <CodeBlock
          title="your_project_folder.txt"
          runnable={false}
          code={`📁 my_project/
   ├── app.py
   ├── app_old.py
   ├── app_backup.py
   ├── app_final.py
   ├── app_final_v2.py
   ├── app_final_v2_REAL.py
   ├── app_final_v2_REAL_fixed.py        ← which one actually works??
   └── app_USE_THIS_ONE_deelaksha.py     ← nobody knows anymore

and the team version of the same disaster:
   💬 "I emailed you app_v3.zip, but use the OTHER zip for utils.py"
   💬 "Wait, you both edited app.py? Whose copy wins?"
   💬 "The demo worked on Friday. SOMETHING changed. Nobody knows what."`}
        />
        <P>Four pains, one tool fixes all of them:</P>
        <Table
          head={["Pain", "What you actually want", "Git's answer"]}
          rows={[
            ["\"which version works?\"", "a labeled history of every working state", "commits with messages"],
            ["\"what changed since Friday?\"", "an exact line-by-line difference", "git diff / git log"],
            ["\"we both edited app.py\"", "automatic merging of two people's work", "branches + merge"],
            ["\"I broke it, take me back\"", "a time machine", "checkout / reset / revert"],
          ]}
        />
        <Callout type="analogy">
          🎮 Git is <strong>save points in a video game</strong>. You save before the boss fight
          (commit), try a risky strategy (edit code), and if you die — reload the save (revert).
          Without saves, every mistake means restarting the whole game.
        </Callout>
      </Section>

      {/* 02 ─ WHAT IS VC */}
      <Section id="what-is-vc" number="02" title="What Is Version Control, Precisely?">
        <P>
          A <strong>version control system (VCS)</strong> is a program that records changes to your
          files over time, so you can recall any version later, see who changed what, and merge
          work from many people. Git is simply the VCS that won — created in 2005 by Linus Torvalds
          (the Linux creator) in about two weeks, because he needed something better for managing
          Linux&apos;s thousands of contributors.
        </P>
        <CodeBlock
          title="timeline.txt"
          runnable={false}
          code={`your project's life WITHOUT git:          WITH git:

  (one folder, overwritten daily)           v1 ──▶ v2 ──▶ v3 ──▶ v4 ──▶ v5
   yesterday's code? GONE.                  │      │      │      │      │
   last month's? GONE.                      └──────┴──────┴──────┴──────┘
   who broke it? UNKNOWN.                    every version kept, forever:
                                             • jump to any of them
                                             • compare any two
                                             • see author + date + reason for each`}
        />
        <Table
          head={["Term (you'll see these everywhere)", "Meaning"]}
          rows={[
            ["repository (repo)", "your project folder + its entire recorded history"],
            ["commit", "one saved snapshot of the whole project, with a message"],
            ["branch", "an independent line of development (parallel universe)"],
            ["merge", "combining two branches back into one"],
            ["clone", "copying a whole repo (with ALL history) to your machine"],
            ["push / pull", "send your commits to a server / get others' commits from it"],
          ]}
        />
        <Callout type="note">
          Git is <strong>distributed</strong>: every developer&apos;s laptop holds the{" "}
          <em>complete history</em>, not just the latest files. If GitHub vanished tonight, any
          team member&apos;s clone could restore everything. There is no single point of failure.
        </Callout>
      </Section>

      {/* 03 ─ SNAPSHOTS */}
      <Section id="snapshots" number="03" title="Git Thinks in SNAPSHOTS, Not Diffs ⭐">
        <P>
          The #1 misconception: &quot;Git stores the changes I made&quot;. No — every commit stores
          a <strong>snapshot of the entire project</strong> at that moment. Diffs you see are{" "}
          <em>computed</em> between snapshots, not stored:
        </P>
        <CodeBlock
          title="snapshots_not_diffs.txt"
          runnable={false}
          code={`WHAT BEGINNERS IMAGINE (diffs):        WHAT GIT ACTUALLY STORES (snapshots):

  commit 1: "created app.py"             commit 1      commit 2      commit 3
  commit 2: "+2 lines in app.py"        ┌──────────┐  ┌──────────┐  ┌──────────┐
  commit 3: "-1 line, +4 lines"         │ app.py v1│  │ app.py v2│  │ app.py v3│
                                        │ utils.py │  │ utils.py │  │ utils.py │
  (history = a pile of patches          │ README   │  │ README   │  │ README v2│
   you must replay in order)            └──────────┘  └──────────┘  └──────────┘
                                          a FULL photo of the project, each time 📸

"Doesn't that waste space?!" — No. If utils.py didn't change between
commit 1 and 2, both snapshots POINT AT THE SAME stored file.
Unchanged file = stored once, referenced many times. (Internals page draws this!)`}
        />
        <Callout type="tip">
          ⭐ This is why jumping to any commit is instant: Git doesn&apos;t &quot;replay 500
          patches&quot; — it just unpacks photo #500. Keep the word <strong>snapshot</strong> in
          your head; half of Git&apos;s weirdness evaporates.
        </Callout>
        <Callout type="behind">
          The deduplication works because Git names every stored file by the{" "}
          <strong>hash of its content</strong> (SHA-1). Same content → same hash → same storage
          slot, automatically. The Internals page (2 pages ahead) opens the hood completely.
        </Callout>
      </Section>

      {/* 04 ─ GIT VS GITHUB */}
      <Section id="git-vs-github" number="04" title="Git vs GitHub — Two Different Things ⭐">
        <P>
          Interview-question-level important, and beginners mix them up daily:
        </P>
        <CodeBlock
          title="git_vs_github.txt"
          runnable={false}
          code={`GIT                                    GITHUB
────────────────────────────────       ─────────────────────────────────
a PROGRAM on your computer             a WEBSITE (owned by Microsoft)
works 100% offline                     needs internet
tracks versions of your files          HOSTS git repositories online
made by Linus Torvalds, 2005           launched 2008
free, open source                      free for most use, paid teams

         YOUR LAPTOP                          THE CLOUD
      ┌───────────────┐      git push      ┌──────────────┐
      │  git (engine) │  ───────────────▶  │    GitHub    │
      │  your repo    │  ◀───────────────  │  (parking    │
      │  full history │      git pull      │   garage for │
      └───────────────┘                    │   repos)     │
                                           └──────────────┘
GitHub ALTERNATIVES that speak the same git: GitLab, Bitbucket, Codeberg.
Git without GitHub? totally fine.  GitHub without git? meaningless.`}
        />
        <Table
          head={["...and GitHub adds on top", "What it's for"]}
          rows={[
            ["Pull Requests", "propose changes + code review before merging (its killer feature)"],
            ["Issues", "bug reports & task tracking attached to the repo"],
            ["Actions", "run tests automatically on every push (CI/CD)"],
            ["Forks & stars", "copy anyone's public repo / bookmark it"],
            ["README rendering", "your repo's front page, from README.md"],
          ]}
        />
        <Callout type="analogy">
          📷 Git is your <strong>camera</strong> — it takes the snapshots. GitHub is{" "}
          <strong>Instagram</strong> — where you upload them so others can see, comment, and
          collaborate. You can take photos without Instagram; you can&apos;t post photos you never
          took.
        </Callout>
      </Section>

      {/* 05 ─ THREE AREAS */}
      <Section id="three-areas" number="05" title="The 3 Areas — The Map Every Command Moves Through ⭐">
        <P>
          Every git command you will EVER run moves files between three places. Learn this diagram
          now and the next four pages are just &quot;which arrow does this command push files
          along?&quot;:
        </P>
        <CodeBlock
          title="three_areas.txt"
          runnable={false}
          code={` ① WORKING DIRECTORY        ② STAGING AREA              ③ REPOSITORY (.git)
    your actual files           the "photo lineup"           permanent history
    you edit here               what the NEXT commit         all snapshots, forever
                                will contain
 ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
 │  app.py  ✏️      │         │                 │         │ 📸 c3 "add login"│
 │  utils.py       │ ──────▶ │  app.py (v2)    │ ──────▶ │ 📸 c2 "fix bug"  │
 │  README.md      │ git add │                 │  git    │ 📸 c1 "start"    │
 │                 │         │                 │ commit  │                 │
 └─────────────────┘         └─────────────────┘         └─────────────────┘
        ▲                                                        │
        └────────────────────────────────────────────────────────┘
                       git checkout / restore  (time travel back)

WHY a staging area at all? CONTROL. You edited 5 files but only 2 belong
together as "fix the login bug" — you stage exactly those 2, commit them,
then stage the others as a separate, clean commit. The staging area is
where you COMPOSE the photo before pressing the shutter. 📸`}
        />
        <FlowDiagram
          steps={[
            { label: "edit", sub: "working directory — just normal file editing" },
            { label: "git add", sub: "choose what goes in the next snapshot" },
            { label: "git commit", sub: "take the photo — permanent, named, dated" },
            { label: "git push", sub: "(later) upload snapshots to GitHub" },
          ]}
        />
        <Callout type="mistake">
          Beginners fight the staging area (&quot;why TWO steps to save?!&quot;) and just run{" "}
          <IC>git add .</IC> blindly. It clicks the day you need it: one commit = one logical
          change. A commit named &quot;fix login&quot; that also sneaks in 3 unrelated edits is a
          commit nobody can safely revert.
        </Callout>
      </Section>

      {/* 06 ─ SCENARIOS */}
      <Section id="scenarios" number="06" title="6 Real Rescues — When Git Saves You">
        <P>
          Each of these is a real situation, and each maps to a page in this track. This table is
          your motivation to keep going:
        </P>
        <Table
          head={["😱 The disaster", "🦸 The git rescue", "Where you'll learn it"]}
          rows={[
            ["\"I deleted half my code and saved the file\"", "git restore app.py — back in 1 second", "Undo page"],
            ["\"It worked yesterday, now it's broken, no idea why\"", "git diff yesterday's commit — see EXACTLY what changed", "Basics page"],
            ["\"My experiment ruined everything\"", "experiments live on a branch; main never knew", "Branches page"],
            ["\"Teammate and I edited the same file\"", "git merge combines both; conflicts shown line by line", "Branches page"],
            ["\"My laptop died the night before the deadline\"", "git clone from GitHub on any machine — full history back", "Remotes page"],
            ["\"Which commit introduced this bug? There are 500\"", "git bisect finds it in ~9 steps (binary search!)", "Advanced page"],
          ]}
        />
        <CodeBlock
          title="rescue_preview.txt"
          runnable={false}
          code={`a taste of rescue #1 — the 1-second undo:

  $ rm -rf src/        # 💀 you just deleted your source folder. saved. gone.
  $ git restore .      # 🦸 ...and it's all back. Every file. As of last commit.

a taste of rescue #6 — bisect (binary search from the DSA track, ON YOUR HISTORY):

  500 commits, one of them broke the build.
  Checking all: 500 tests. git bisect: log₂(500) ≈ 9 tests. ⭐`}
        />
        <Callout type="tip">
          Notice rescue #6: <IC>git bisect</IC> is literally the <strong>binary search</strong> you
          learned on the Sorting & Searching page, applied to commits. Good ideas echo across
          tools.
        </Callout>
      </Section>

      {/* 07 ─ INSTALL */}
      <Section id="install" number="07" title="Install & Verify — One Command Per OS">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# Linux (Debian/Ubuntu)
$ sudo apt install git

# Linux (Fedora)
$ sudo dnf install git

# macOS (easiest: triggers install automatically)
$ git --version
# or with Homebrew:
$ brew install git

# Windows: download "Git for Windows" from git-scm.com
# → includes Git Bash, a Linux-style terminal. Use it for this track.`}
          output={`(after installing, verify:)

$ git --version
git version 2.43.0

Any version ≥ 2.23 is fine for this track (that's when
modern commands like 'switch' and 'restore' were added).`}
        />
        <Callout type="note">
          Already on GitHub.com? You still need git installed locally — remember section 04: the
          website and the tool are separate things.
        </Callout>
      </Section>

      {/* 08 ─ FIRST LOOK */}
      <Section id="first-look" number="08" title="Your First 60 Seconds — A Preview of the Whole Track">
        <P>
          Don&apos;t memorize anything yet — just watch a full lifecycle once, so the coming pages
          feel familiar. Five commands, one saved snapshot:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ mkdir hello-git && cd hello-git      # a fresh folder
$ git init                             # 1️⃣ turn it into a repository
$ echo "print('hi')" > app.py          # create a file
$ git status                           # 2️⃣ ask git what it sees
$ git add app.py                       # 3️⃣ stage it (area ① → ②)
$ git commit -m "first snapshot"       # 4️⃣ commit it (area ② → ③) 📸
$ git log                              # 5️⃣ view your history`}
          output={`$ git init
Initialized empty Git repository in /home/deelaksha/hello-git/.git/

$ git status
On branch main
Untracked files:
        app.py

$ git commit -m "first snapshot"
[main (root-commit) f3a9c21] first snapshot
 1 file changed, 1 insertion(+)

$ git log
commit f3a9c21d8e4b7a2c91f05e6d3b8a4c7e2d1f0a9b (HEAD -> main)
Author: Deelaksha <deelaksha@example.com>
Date:   Thu Jun 11 10:30:00 2026 +0530

    first snapshot

You now have a time machine with one save point. 🎮`}
        />
        <Callout type="behind">
          That weird <IC>f3a9c21d8e...</IC> string is the commit&apos;s <strong>SHA-1 hash</strong>{" "}
          — a fingerprint computed from the snapshot&apos;s entire content. It&apos;s how Git names
          everything internally, and it&apos;s the star of the Internals page.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Git", "a local PROGRAM that records snapshots of your project"],
            ["GitHub", "a WEBSITE that hosts git repos + adds PRs, issues, reviews"],
            ["Camera vs Instagram", "git takes the photos; GitHub is where you share them"],
            ["Commit =", "a snapshot of the ENTIRE project (not a diff!) + message + author"],
            ["Repo =", "your project folder + its full history (inside .git/)"],
            ["The 3 areas", "working dir → (add) → staging → (commit) → repository"],
            ["Why staging exists", "compose ONE logical change per commit, not 'all my edits'"],
            ["Distributed", "every clone holds the COMPLETE history — no single point of failure"],
            ["git is offline-first", "init, add, commit, branch, merge, log — zero internet needed"],
            ["First 5 commands", "init → status → add → commit -m → log"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
