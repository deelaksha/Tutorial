"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "loop", label: "The Daily Loop ⭐" },
  { id: "status", label: "git status — Your Compass" },
  { id: "add", label: "git add — Every Variant ⭐" },
  { id: "commit", label: "git commit — Every Variant ⭐" },
  { id: "diff", label: "git diff — The 3 Comparisons ⭐" },
  { id: "log", label: "git log — Reading History" },
  { id: "show", label: "git show — Inspect One Commit" },
  { id: "rm-mv", label: "git rm & git mv" },
  { id: "gitignore", label: ".gitignore" },
  { id: "exceptions", label: "💥 Daily-Loop Mistakes" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GitBasicsPage() {
  return (
    <TopicShell
      icon="📸"
      title="status · add · commit · log"
      gradientWord="commit"
      subtitle="The loop you'll run thousands of times: check status, stage exactly what belongs together, commit with a clear message, read the history back. Every command, every flag that matters, every state drawn on the 3-areas map."
      nav={NAV}
      next={{ icon: "🌿", label: "Branches & Merging", href: "/git/branches" }}
    >
      {/* 01 ─ LOOP */}
      <Section id="loop" number="01" title="The Daily Loop — One Diagram to Rule This Page ⭐">
        <CodeBlock
          title="daily_loop.txt"
          runnable={false}
          code={`        ① WORKING DIR              ② STAGING               ③ REPOSITORY
        (your files)               (next photo)            (history)

  edit ✏️ ──┐
           │   files are now "modified"
           ▼
        app.py*  ──── git add app.py ────▶  app.py  ─── git commit ───▶ 📸 c4
                                                                          │
        ◀──────────────── git restore (undo, later page) ◀───────────────┘

  every file is always in ONE of these states:
    untracked   git has never seen it          (brand-new file)
    modified    changed since last commit      (in ①, not yet in ②)
    staged      chosen for the next commit     (in ②, waiting)
    committed   safely in history              (in ③)

  the loop:  edit → status → add → status → commit → log.  Repeat forever.`}
        />
        <P>
          Scenario for this whole page: Deelaksha is building <IC>shop-app</IC> — adding a login
          feature while a half-finished payments experiment also sits in the folder. Watch how
          staging keeps those two stories separate.
        </P>
      </Section>

      {/* 02 ─ STATUS */}
      <Section id="status" number="02" title="git status — Run It Constantly, It's Free">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git status            # the full report
$ git status -s         # short form: 2 columns (staged | unstaged)
$ git status -sb        # short + current branch on top  ← the daily favorite`}
          output={`$ git status
On branch main
Changes to be committed:                    ← area ② staged
        modified:   login.py
Changes not staged for commit:              ← area ① modified
        modified:   app.py
Untracked files:                            ← area ① brand new
        payments.py

$ git status -s
M  login.py        ← M in COLUMN 1 = staged change
 M app.py          ← M in COLUMN 2 = unstaged change
?? payments.py     ← ?? = untracked
▲▲
column 1 = staging area · column 2 = working dir`}
        />
        <Callout type="tip">
          A file can be in BOTH columns: stage <IC>app.py</IC>, then edit it again →{" "}
          <IC>MM app.py</IC>. The staged version is what you added (frozen); the new edit waits
          unstaged. <IC>git status</IC> is the only command that keeps you sane here — run it
          before and after everything.
        </Callout>
      </Section>

      {/* 03 ─ ADD */}
      <Section id="add" number="03" title="git add — Every Variant You'll Meet ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git add login.py             # one file
$ git add login.py auth.py     # several files
$ git add src/                 # a whole folder, recursively
$ git add '*.py'               # by pattern
$ git add .                    # everything in current dir (new + modified)
$ git add -A                   # everything in the WHOLE repo
$ git add -u                   # only files git already tracks (no untracked)
$ git add -p                   # ⭐ interactive: approve each change HUNK by HUNK`}
          output={`$ git add -p app.py
diff --git a/app.py b/app.py
@@ -10,4 +10,5 @@
 def homepage():
+    show_login_button()        ← hunk 1: belongs to the login feature
(1/2) Stage this hunk [y,n,q,a,d,s,e,?]? y
@@ -30,2 +31,4 @@
+def begin_payment():           ← hunk 2: the half-done experiment!
+    pass
(2/2) Stage this hunk [y,n,q,a,d,s,e,?]? n

ONE file, TWO stories — add -p staged only the login part. ⭐
The payments experiment stays out of the login commit.`}
        />
        <CodeBlock
          title="add_unstage.txt"
          runnable={false}
          code={`what add does on the map (and its exact opposite):

   ① working dir                      ② staging
   app.py (edited)  ── git add ────▶  app.py snapshot taken NOW
                    ◀─ git restore --staged ──  (unstage: remove from ②,
                                                 your edits in ① untouched)

⭐ add copies the file's CURRENT content into the staging area.
   Edit the file again afterwards → the staged copy does NOT update.
   You must add again to stage the newer edit. (Internals page: add
   literally creates the blob at that moment.)`}
        />
        <Table
          head={["Command", "Stages", "When"]}
          rows={[
            ["git add <file>", "exactly that file", "default habit — deliberate and safe"],
            ["git add -p", "hand-picked hunks", "mixed edits in one file ⭐"],
            ["git add -u", "tracked modified/deleted only", "\"commit my edits, ignore new junk files\""],
            ["git add .", "everything below current dir", "fine for tiny repos; risky habit"],
            ["git add -A", "everything, repo-wide", "same risk — review status first!"],
          ]}
        />
      </Section>

      {/* 04 ─ COMMIT */}
      <Section id="commit" number="04" title="git commit — Every Variant ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git commit -m "add login form"        # the standard: message inline
$ git commit                            # opens your editor for a longer message
$ git commit -m "add login" -m "uses session cookies, expires in 7 days"
                                        # second -m = body paragraph
$ git commit -am "quick fix"            # -a = auto-add ALL TRACKED modified files
                                        #     (skips staging; ignores untracked!)
$ git commit --amend -m "add login form (with validation)"
                                        # replace the LAST commit (details: Undo page)
$ git commit --allow-empty -m "trigger CI"   # commit with zero changes (niche but real)`}
          output={`$ git commit -m "add login form"
[main 4e7d9a2] add login form
 2 files changed, 48 insertions(+), 3 deletions(-)
  ▲      ▲                ▲
branch  new hash      the stats: what this snapshot changed`}
        />
        <CodeBlock
          title="good_messages.txt"
          runnable={false}
          code={`commit messages — the convention the whole industry follows:

  ✅ "add login form"                     imperative mood ("add", not "added")
  ✅ "fix navbar overlap on mobile"       says WHAT changed and WHERE
  ✅ subject ≤ 50 chars; details go in the body (second -m)

  ❌ "update"          update WHAT?
  ❌ "asdfgh"          future-you will hate present-you
  ❌ "fixed stuff, also tried payments thing, also typo"
                       → 3 stories = should've been 3 commits

litmus test: the message should complete the sentence
  "If applied, this commit will ___"  →  "...add login form" ✅`}
        />
        <Callout type="mistake">
          <IC>git commit -am</IC> feels like a shortcut to skip staging — but it (1) ignores{" "}
          <strong>untracked</strong> files silently, and (2) shovels every tracked edit into one
          commit, killing the &quot;one logical change&quot; principle. Fine for solo quick fixes;
          a bad default habit.
        </Callout>
      </Section>

      {/* 05 ─ DIFF */}
      <Section id="diff" number="05" title="git diff — The 3 Comparisons, Mapped to the 3 Areas ⭐">
        <CodeBlock
          title="diff_map.txt"
          runnable={false}
          code={`  ① WORKING DIR         ② STAGING            ③ LAST COMMIT
        │                    │                     │
        └─── git diff ───────┘                     │
             "what have I edited but NOT staged?"  │
                             │                     │
                             └── git diff --staged ┘
                                 "what WILL the next commit contain?" ⭐
        │                                          │
        └────────────── git diff HEAD ─────────────┘
                        "everything changed since last commit (both)"`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git diff                      # ① vs ②  unstaged edits
$ git diff --staged             # ② vs ③  what's about to be committed ⭐
$ git diff HEAD                 # ① vs ③  all changes since last snapshot
$ git diff HEAD~2 HEAD          # between two commits (2-back vs latest)
$ git diff main feature/login   # between two branches
$ git diff HEAD -- app.py       # limit any diff to one file
$ git diff --stat HEAD          # numbers only, no line detail`}
          output={`$ git diff --staged
diff --git a/login.py b/login.py
index 9c1d3e5..7f8b2a1 100644          ← old blob hash → new blob hash!
--- a/login.py                          (the Internals page, visible here)
+++ b/login.py
@@ -12,6 +12,9 @@ def login(user, password):
     if not user:
         return None
+    if len(password) < 8:               ← + line: added
+        raise ValueError("too short")
-    return check(user, password)        ← - line: removed
+    return check(user, password.strip())

@@ -12,6 +12,9 @@ means: old file from line 12 (6 lines shown),
new file from line 12 (9 lines shown). Each block = one "hunk" —
the same hunks add -p let you pick from. It all connects. 🧩`}
        />
        <Callout type="tip">
          ⭐ Make <IC>git diff --staged</IC> a pre-commit ritual: it shows <em>exactly</em> what the
          commit will contain — your last chance to catch a stray debug print or password before it
          enters history forever.
        </Callout>
      </Section>

      {/* 06 ─ LOG */}
      <Section id="log" number="06" title="git log — Reading History Like a Pro">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git log                        # full detail, newest first
$ git log --oneline              # one line per commit ⭐ daily driver
$ git log --oneline -5           # only the last 5
$ git log --oneline --graph --all --decorate    # the famous branch picture
$ git log -p                     # with full diffs (what each commit changed)
$ git log --stat                 # with file-change summaries
$ git log --author="Deelaksha"   # filter by author
$ git log --since="2 weeks ago"  # by time
$ git log --grep="login"         # search commit MESSAGES
$ git log -S "check_password"    # ⭐ "pickaxe": commits that ADDED/REMOVED this code
$ git log -- login.py            # only commits touching this file
$ git log --follow -- login.py   # ...even across renames`}
          output={`$ git log --oneline
4e7d9a2 (HEAD -> main) add login form
8d2e4b7 fix navbar overlap
f3a9c21 set up project skeleton
1a4b8c3 first snapshot

$ git log --oneline --graph --all
* 4e7d9a2 (HEAD -> main) add login form
| * 2c5f9a1 (feature/search) try fuzzy search
|/
* 8d2e4b7 fix navbar overlap
* f3a9c21 set up project skeleton

graph reading: each * is a commit, lines are parent links —
you are literally looking at the linked list from the Internals page.`}
        />
        <Callout type="behind">
          The rescue scenario from the intro page, solved: &quot;it worked Friday&quot; →{" "}
          <IC>git log --since=friday --stat</IC> lists every commit since, with files touched.
          &quot;Who wrote this weird function?&quot; → <IC>git log -S &quot;weird_function&quot;</IC>{" "}
          finds the commit that introduced it, message and author included.
        </Callout>
      </Section>

      {/* 07 ─ SHOW */}
      <Section id="show" number="07" title="git show — X-Ray One Commit (or Anything)">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git show                      # the latest commit: message + full diff
$ git show 8d2e4b7              # any commit by hash
$ git show HEAD~1               # one commit before HEAD (~2 = two back...)
$ git show 8d2e4b7 --stat       # just the file list
$ git show 8d2e4b7:app.py       # ⭐ a FILE's full content AT that commit
$ git show main:app.py          # same, by branch name`}
          output={`$ git show 8d2e4b7:app.py
print('hi shop')
def homepage():
    render("home.html")

That's app.py EXACTLY as it was at commit 8d2e4b7 — printed,
not restored. Time-travel reading, zero risk to your files. ⭐
(Compare today's: git diff 8d2e4b7 HEAD -- app.py)`}
        />
        <Table
          head={["Notation", "Means"]}
          rows={[
            ["HEAD", "the commit you're standing on"],
            ["HEAD~1 (or HEAD~)", "its parent (1 back)"],
            ["HEAD~3", "3 commits back (great-grandparent)"],
            ["abc1234", "any commit by (prefix of) its hash"],
            ["main / feature-x", "the commit a branch sticker points at"],
            ["<commit>:<path>", "a specific file inside that snapshot"],
          ]}
        />
      </Section>

      {/* 08 ─ RM & MV */}
      <Section id="rm-mv" number="08" title="git rm & git mv — Delete and Rename, Tracked">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# DELETE a tracked file (removes from disk AND stages the deletion):
$ git rm old_styles.css
$ git commit -m "remove unused stylesheet"

# stop tracking but KEEP the file on disk (e.g. config you now ignore):
$ git rm --cached secrets.env

# RENAME / move:
$ git mv app.py main.py
$ git commit -m "rename app.py to main.py"`}
          output={`$ git rm old_styles.css
rm 'old_styles.css'

$ git status -s
D  old_styles.css          ← D = deletion, already staged

$ git mv app.py main.py && git status -s
R  app.py -> main.py       ← R = rename, staged in one move`}
        />
        <Callout type="behind">
          <IC>git mv</IC> is literally <IC>mv</IC> + <IC>git rm</IC> + <IC>git add</IC> in one. And
          if you renamed with plain <IC>mv</IC>? No problem — after you <IC>git add -A</IC>, git
          detects &quot;deleted + added with identical content&quot; and reports it as a rename
          anyway. Remember Internals: content has the same blob hash, the tree just maps a new name
          to it.
        </Callout>
        <Callout type="mistake">
          Deleting with plain <IC>rm file</IC> is fine — but the deletion sits{" "}
          <em>unstaged</em> until you <IC>git add -u</IC>. Beginners then wonder why the
          &quot;deleted&quot; file returns on checkout. <IC>git rm</IC> deletes AND stages in one
          step.
        </Callout>
      </Section>

      {/* 09 ─ GITIGNORE */}
      <Section id="gitignore" number="09" title=".gitignore — Teach Git What to Never See">
        <P>
          Some files must never enter history: secrets, virtualenvs, build junk, 2GB of{" "}
          <IC>node_modules</IC>. List them in a file named <IC>.gitignore</IC> at the repo root:
        </P>
        <CodeBlock
          title=".gitignore"
          runnable={false}
          code={`# comments start with #
__pycache__/          # a folder, anywhere in the repo
*.pyc                 # by extension
.env                  # the secrets file — THE most important line
venv/
node_modules/
build/
*.log
!important.log        # ! = exception: DO track this one
docs/*.pdf            # pattern limited to a path
.DS_Store             # macOS litter`}
          output={`$ git status -s        # before: ?? noise everywhere
?? __pycache__/
?? .env
?? app.py

(create .gitignore with the lines above)

$ git status -s        # after: only what matters
?? .gitignore
?? app.py

ignored files become INVISIBLE to status/add. The .gitignore file
itself gets committed — the whole team shares the same blindspots.`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# "I committed it BEFORE adding it to .gitignore — now it won't ignore!"
# rule: .gitignore only affects UNTRACKED files. Untrack it first:
$ git rm --cached .env
$ git commit -m "stop tracking .env"
# (now the .gitignore line works; the file stays on your disk)

# debug why a file is/isn't ignored:
$ git check-ignore -v .env`}
          output={`$ git check-ignore -v .env
.gitignore:3:.env       .env
   ▲ file : line : pattern that matched — mystery solved.`}
        />
        <Callout type="mistake">
          If a secret was ever <em>committed</em>, removing it now does NOT erase it from history —
          every old snapshot still contains it (that&apos;s the whole point of snapshots!). Treat
          the key as leaked: rotate it. Scrubbing history is possible (<IC>git filter-repo</IC>)
          but painful — prevention via <IC>.gitignore</IC> on day one is the real fix.
        </Callout>
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Daily-Loop Mistakes">
        <P>
          <strong>Mistake 1 — empty commit attempt (forgot to add):</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git commit -m "add login"`}
          output={`On branch main
Changes not staged for commit:
        modified:   login.py
no changes added to commit (use "git add" and/or "git commit -a")

Not an error — a refusal. The staging area was EMPTY (you edited
but never added). Git won't photograph an empty lineup.
Fix: git add login.py && git commit -m "add login"`}
        />
        <P>
          <strong>Mistake 2 — staged, then edited again, commit misses the new edit:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git add login.py          # staged version A
$ echo "# more" >> login.py # edited again → version B exists only in ①
$ git commit -m "login"     # commits version A!
$ git status -s`}
          output={`[main 4e7d9a2] login
 M login.py        ← still modified AFTER committing?!

Yes — add froze version A; your B edit never entered the photo.
This confuses every beginner exactly once. The cure is ritual:
status → add → STATUS AGAIN → commit.`}
        />
        <P>
          <strong>Mistake 3 — committed to history what should never be there:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git add .                          # blind add, no review
$ git commit -m "done"
$ git log --stat -1`}
          output={`[main 9f1c3b5] done
 .env             |   4 ++++       ← 💀 secrets, in history
 node_modules/... | 48211 ++++     ← 💀 48k lines of dependencies
 debug.log        |  312 ++++

'git add .' without 'git status' first = this, eventually.
Immediate fix (nothing pushed yet): git reset HEAD~1  → Undo page.
Long-term fix: .gitignore BEFORE the first add; review with status.`}
        />
        <P>
          <strong>Mistake 4 — multiline message gone wrong:</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git commit -m "add login    ← opened quote, pressed Enter...
> fix typo
> "`}
          output={`(the > prompts mean the SHELL is waiting for your closing quote —
 you're now writing a 3-line commit message by accident)

Escape an open quote: Ctrl+C, start over.
Want a real multiline message? Use TWO -m flags:
  git commit -m "subject" -m "body details here"
or just 'git commit' alone → your editor opens.`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["The loop", "edit → status → add → status → commit → log"],
            ["4 file states", "untracked → modified → staged → committed"],
            ["status -s columns", "left = staged, right = unstaged, ?? = untracked"],
            ["add freezes content", "edit after add? the new edit is NOT staged — add again"],
            ["Surgical staging", "git add -p — approve hunk by hunk ⭐"],
            ["3 diffs", "diff (①vs②) · diff --staged (②vs③) · diff HEAD (①vs③)"],
            ["Pre-commit ritual", "git diff --staged — your last look before history"],
            ["Message style", "imperative, ≤50 chars: 'add login form' (not 'added stuff')"],
            ["History one-liner", "git log --oneline --graph --all --decorate"],
            ["Find code's origin", "git log -S \"that_function\" (pickaxe search)"],
            ["File from the past", "git show <commit>:path/file.py — read without touching"],
            ["Already-committed secret?", ".gitignore won't help — git rm --cached + rotate the key"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
