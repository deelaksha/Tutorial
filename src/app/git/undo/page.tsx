"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "map", label: "The undo map" },
  { id: "restore", label: "restore — file mistakes" },
  { id: "amend", label: "amend — fix last commit" },
  { id: "reset", label: "reset — soft/mixed/hard ⭐" },
  { id: "revert", label: "revert — safe public undo" },
  { id: "stash", label: "stash — pocket your work" },
  { id: "clean", label: "clean — untracked junk" },
  { id: "reflog", label: "reflog — the safety net ⭐" },
  { id: "scenarios", label: "「Oh no」 → command table" },
  { id: "exceptions", label: "💥 When undo goes wrong" },
  { id: "memorize", label: "Memorize" },
];

export default function GitUndoPage() {
  return (
    <TopicShell
      icon="🧯"
      title="Undo"
      gradientWord="Anything"
      subtitle="Every 「oh no」 has a matching command. restore, reset, revert, stash, reflog — learn which one fits which disaster, and you become impossible to scare."
      nav={NAV}
      next={{ icon: "☁️", label: "Remotes — push & pull", href: "/git/remotes" }}
    >
      {/* 01 — the map */}
      <Section id="map" number="01" title="The undo map — which command for which area">
        <P>
          Mistakes happen in different <b>places</b>: the working directory, the staging area,
          the last commit, or deep history. Each place has its own undo tool. This one diagram
          organizes the entire page:
        </P>
        <CodeBlock
          runnable={false}
          title="undo-map.txt"
          code={`WHERE is the mistake?            THE TOOL

📝 Working directory             git restore <file>
   (edited a file, regret it)    「rewind the file to last commit」

📦 Staging area                  git restore --staged <file>
   (added the wrong file)        「un-add, keep the edits」

📸 Last commit                   git commit --amend
   (typo in msg / forgot file)   「redo the last commit」

📚 Local commits (not pushed)    git reset --soft / --mixed / --hard
   (wrong commits, undo them)    「move the branch sticker back」

☁️ Pushed/public commits         git revert <hash>
   (others already have them)    「new commit that cancels the old one」

🧳 Half-done work in the way     git stash
   (need a clean slate, briefly) 「pocket changes, bring back later」

🗑️ Untracked junk files          git clean -fd
   (build output, temp files)    「delete files git never knew」

🆘 「I destroyed everything」     git reflog
   (lost commits after reset)    「the security camera — find & recover」`}
        />
        <Callout type="tip">
          One rule decides half of this page: <b>has it been pushed?</b> Local-only history is
          yours to rewrite (<IC>reset</IC>, <IC>amend</IC>). Pushed history is shared — never
          rewrite it; add a cancelling commit instead (<IC>revert</IC>).
        </Callout>
        <FlowDiagram
          steps={[
            { label: "Mistake?", sub: "don't panic" },
            { label: "Locate it", sub: "which area?" },
            { label: "Pushed?", sub: "yes → revert" },
            { label: "Local?", sub: "restore/reset" },
            { label: "Lost?", sub: "reflog 🆘" },
          ]}
        />
      </Section>

      {/* 02 — restore */}
      <Section id="restore" number="02" title="git restore — undo file-level mistakes">
        <P>
          <b>Scenario A:</b> Deelaksha experiments in <IC>app.py</IC> for an hour. It&apos;s a
          dead end — she wants the file back exactly as it was at the last commit.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git status -s
 M app.py                        ← modified, not staged

$ git restore app.py             # ⚠️ edits gone FOREVER (not in any commit)

$ git status
nothing to commit, working tree clean    ← file rewound ✅`}
          output={`restore copies the file OUT of the last commit's snapshot,
overwriting your working copy. The hour of edits is gone —
this is one of the few git commands that truly destroys work.
Hesitating? git stash instead (section 06) — reversible.`}
        />
        <P>
          <b>Scenario B:</b> she ran <IC>git add .</IC> and accidentally staged{" "}
          <IC>notes.txt</IC>. The edits are fine — they just shouldn&apos;t be in this commit.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git restore --staged notes.txt   # un-add. Edits stay in the file!

$ git status -s
 M notes.txt                     ← back to "modified, unstaged" ✅

# Want the file as it was 3 commits ago? restore can time-travel:
$ git restore --source HEAD~3 app.py
$ git restore --source 8d2e4b7 app.py     # or any hash`}
          output={`Two different jobs, one command:
  git restore <file>            wipes WORKING DIR edits   (destructive!)
  git restore --staged <file>   only un-stages            (100% safe)`}
        />
        <CodeBlock
          runnable={false}
          title="restore-drawn.txt"
          code={`        ① working dir      ② staging       ③ last commit
              │                │                 │
   restore ◀──┴── copies ③ → ① │                 │
              (your edits overwritten)           │
                               │                 │
   restore --staged ◀──────────┴── copies ③ → ②  │
              (staging matches commit again;
               working dir untouched)`}
        />
        <Callout type="behind">
          Old tutorials use <IC>git checkout -- app.py</IC> for job A and{" "}
          <IC>git reset HEAD app.py</IC> for job B. Both still work — <IC>restore</IC> (2019)
          is just the clearer replacement for exactly these two moves.
        </Callout>
      </Section>

      {/* 03 — amend */}
      <Section id="amend" number="03" title="git commit --amend — redo the last commit">
        <P>
          You commit, and <b>one second later</b> spot the problem: a typo in the message, or a
          file you forgot to add. Don&apos;t make a shameful <IC>fix typo</IC> commit —
          amend swaps the last commit for a corrected one.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git commit -m "add paymnet form"          # ...paymnet 🤦
[main 3c9d7f2] add paymnet form

$ git commit --amend -m "add payment form"  # fix message only
[main 5b1e8a4] add payment form              ← NEW hash!

# Forgot a file? stage it, then amend without changing the message:
$ git add payment_utils.py
$ git commit --amend --no-edit
[main 9a4c2e7] add payment form`}
          output={`Note the hash changed: 3c9d7f2 → 5b1e8a4 → 9a4c2e7.
Amend doesn't EDIT a commit (commits are immutable — internals
page). It builds a REPLACEMENT commit and moves the sticker:

  before:  ──●──● 4e7d9a2 ◀── ● 3c9d7f2 (typo)
  after:   ──●──● 4e7d9a2 ◀── ● 9a4c2e7 (fixed) ← main
                          ╲── ● 3c9d7f2 (abandoned, reflog keeps it)`}
        />
        <Callout type="mistake">
          <b>Never amend a pushed commit.</b> Your replacement has a different hash, so your
          history no longer matches GitHub&apos;s — your next push gets rejected and teammates
          get conflicts. Amend = local-only tool. Already pushed? Just make a normal follow-up
          commit.
        </Callout>
      </Section>

      {/* 04 — reset */}
      <Section id="reset" number="04" title="git reset — soft / mixed / hard, drawn ⭐">
        <P>
          <IC>reset</IC> is the big one. It <b>moves your branch sticker backwards</b> to an
          older commit. The three modes differ only in what happens to the other two areas
          (staging + working dir) afterwards:
        </P>
        <CodeBlock
          runnable={false}
          title="reset-modes-drawn.txt"
          code={`Start: 3 commits, undo the last one.   ──●──●──● C3  ← main, HEAD
                                              ▲
$ git reset <mode> HEAD~1                     └─ sticker moves here (C2)

What happens to C3's changes?

              ③ history    ② staging      ① working dir
--soft        rewound ✅    KEEPS C3       KEEPS C3
              「un-commit」  (still staged) (files unchanged)

--mixed       rewound ✅    cleared        KEEPS C3
(default)     「un-commit    (unstaged)    (files unchanged)
               + un-add」

--hard        rewound ✅    cleared        WIPED ⚠️
              「erase it     (matches C2)  (files match C2)
               completely」

Gentleness scale:  soft 🧸 ──── mixed 😐 ──── hard 💀`}
        />
        <P><b>--soft — &quot;wrong split, redo the commit&quot;:</b> Deelaksha made 3 tiny messy commits and wants them as one clean commit.</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git log --oneline -3
e7c2f1a (HEAD -> main) oops forgot import
b3d8e5c actually fix it
1f6a9d4 try cart fix

$ git reset --soft HEAD~3        # rewind 3 commits; all changes stay STAGED
$ git status -s
M  cart.py
M  app.py                        ← everything staged, ready to re-commit

$ git commit -m "fix cart total rounding bug"
[main 7d3b9f8] fix cart total rounding bug    ← 3 messy → 1 clean ✅`}
        />
        <P><b>--mixed (the default) — &quot;un-commit AND un-stage, let me rethink&quot;:</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reset HEAD~1               # same as --mixed
$ git status -s
 M cart.py
 M app.py                        ← changes back in working dir, UNstaged

# now re-stage selectively, maybe split into two commits:
$ git add cart.py    && git commit -m "fix cart rounding"
$ git add app.py     && git commit -m "update cart route"`}
        />
        <P><b>--hard — &quot;these commits AND their changes: erase&quot;:</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reset --hard HEAD~2
HEAD is now at 4e7d9a2 add login form

$ git status
nothing to commit, working tree clean     ← as if the 2 commits never happened`}
          output={`⚠️ --hard also wipes any UNCOMMITTED edits in tracked files —
those are unrecoverable (they were never in a commit).
The reset COMMITS themselves are recoverable via reflog (sec 08).

Rule before every --hard: run 'git status' first.
Clean tree → safe-ish. Dirty tree → stash or commit first.`}
        />
        <Callout type="behind">
          Why is <IC>reset</IC> dangerous on pushed commits but fine locally? It moves the
          sticker backwards, so the abandoned commits vanish from history. If GitHub already has
          them, your histories disagree → rejected push, confused teammates. Local-only?
          Nobody&apos;s seen them — rewrite freely.
        </Callout>
      </Section>

      {/* 05 — revert */}
      <Section id="revert" number="05" title="git revert — the safe undo for pushed commits">
        <P>
          <b>Scenario:</b> yesterday&apos;s commit <IC>b5e8d1f</IC> broke checkout in
          production. It&apos;s pushed — teammates have it, so <IC>reset</IC> is forbidden.{" "}
          <IC>revert</IC> doesn&apos;t delete anything: it creates a <b>new commit that applies
          the exact opposite changes</b>.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git revert b5e8d1f
[main f2a7c4e] Revert "switch to new payment provider"
 1 file changed, 12 insertions(+), 31 deletions(-)

$ git log --oneline -3
f2a7c4e (HEAD -> main) Revert "switch to new payment provider"
c7a2f9e Merge branch 'feature-cart'
b5e8d1f switch to new payment provider    ← still here! history honest`}
          output={`reset:   ──●──●──✗           (commit erased — rewrites history)
revert:  ──●──●──●──◍        (anti-commit added — history grows)
              bad    undo-of-bad

The bad commit stays visible forever. The revert commit adds
lines the bad one deleted and deletes lines it added.
Safe to push immediately — it's just a normal new commit.`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git revert --no-edit b5e8d1f     # skip the message editor
$ git revert HEAD                   # undo the most recent commit
$ git revert HEAD~3..HEAD           # revert the last 3, one anti-commit each
$ git revert -m 1 c7a2f9e           # revert a MERGE commit (-m 1 = keep parent 1)
$ git revert --abort                # bail out if the revert conflicts`}
          output={`Yes — a revert can hit conflicts (if later commits touched the
same lines). Same ritual as merging: edit → add → git revert --continue.`}
        />
        <Table
          head={["", "git reset", "git revert"]}
          rows={[
            ["What it does", "moves sticker back, drops commits", "adds a new cancelling commit"],
            ["History", "rewritten (commits vanish)", "preserved (grows by one)"],
            ["Pushed commits", "❌ never", "✅ designed for it"],
            ["Local commits", "✅ perfect", "works, but reset is cleaner"],
            ["Team impact", "breaks teammates", "zero — it's a normal commit"],
          ]}
        />
      </Section>

      {/* 06 — stash */}
      <Section id="stash" number="06" title="git stash — pocket your half-done work">
        <P>
          The branches page promised this: you&apos;re mid-feature with broken, uncommittable
          code, and you need a clean working directory <b>right now</b> (urgent bug, quick
          branch switch, a pull). <IC>stash</IC> sweeps all uncommitted changes into a pocket
          and gives you a clean tree:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git status -s
 M cart.py
 M app.py                          ← half-done, doesn't even run

$ git stash
Saved working directory and index state WIP on feature-cart: 9f1c3b5 start cart logic

$ git status
nothing to commit, working tree clean    ← clean! go fix that bug

# ... switch, hotfix, merge, switch back ...

$ git stash pop                    # bring it back + remove from pocket
On branch feature-cart
Changes not staged for commit:
	modified:   cart.py
	modified:   app.py
Dropped refs/stash@{0}             ← exactly where you left off ✅`}
        />
        <P>The full stash toolkit — it&apos;s a stack (LIFO — your DSA stacks page in the wild):</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git stash push -m "cart WIP, half-done totals"   # named stash ⭐
$ git stash list
stash@{0}: On feature-cart: cart WIP, half-done totals
stash@{1}: WIP on main: 4e7d9a2 add login form

$ git stash show -p stash@{1}      # peek at a stash's diff
$ git stash apply stash@{1}        # restore but KEEP in pocket
$ git stash pop                    # restore newest + remove (apply + drop)
$ git stash drop stash@{1}         # throw one away
$ git stash clear                  # empty the whole pocket ⚠️
$ git stash -u                     # include UNTRACKED files too
$ git stash branch try-idea        # turn a stash into a fresh branch`}
          output={`stash@{0} is always the NEWEST (top of the stack — LIFO).
Default stash skips untracked files; -u includes them.
apply vs pop: apply = copy out, pop = take out.`}
        />
        <Callout type="mistake">
          Stashes are easy to forget — three weeks later: &quot;where did my cart code go?!&quot;
          It&apos;s been in <IC>git stash list</IC> the whole time. Habits: always{" "}
          <IC>push -m &quot;message&quot;</IC>, and treat stash as a <b>minutes-to-hours</b>
          pocket. Overnight? Make a real <IC>wip</IC> commit on your branch instead.
        </Callout>
      </Section>

      {/* 07 — clean */}
      <Section id="clean" number="07" title="git clean — delete untracked junk">
        <P>
          <IC>restore</IC> and <IC>reset</IC> only touch <b>tracked</b> files. But your folder
          collects untracked junk: build output, generated files, an unzipped download.{" "}
          <IC>git clean</IC> deletes files Git never knew about:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git clean -n                  # -n = DRY RUN: show, delete nothing ⭐
Would remove debug.log
Would remove test_output.json

$ git clean -nd                 # include directories in the preview
Would remove build/
Would remove debug.log
Would remove test_output.json

$ git clean -fd                 # -f force (required) + -d directories
Removing build/
Removing debug.log
Removing test_output.json`}
          output={`ALWAYS -n first. clean deletes real files with no undo —
they were never committed, so git has NO copy of them.

-x additionally deletes .gitignore'd files (node_modules, .env!)
   → only for "give me a factory-fresh checkout" moments. ⚠️`}
        />
        <Callout type="tip">
          The full scorched-earth combo — <IC>git reset --hard</IC> (tracked files → last
          commit) + <IC>git clean -fd</IC> (untracked files → gone) — returns the folder to a
          pristine checkout. Useful; double-check <IC>status</IC> and <IC>clean -n</IC> first.
        </Callout>
      </Section>

      {/* 08 — reflog */}
      <Section id="reflog" number="08" title="git reflog — the safety net that saves careers ⭐">
        <P>
          The big secret of this page: <b><IC>git reset --hard</IC> doesn&apos;t delete
          commits.</b> It only moves the sticker; the commit objects stay in{" "}
          <IC>.git/objects</IC> for ~30+ days (internals page). The problem is that nothing
          points to them anymore... except the <b>reflog</b>: Git&apos;s private security camera
          that records <b>every single place HEAD has ever been</b>.
        </P>
        <P><b>The disaster, in full:</b> Deelaksha hard-resets and instantly realizes she destroyed two days of work.</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reset --hard HEAD~2          # 😱 NO WAIT, I needed those!
HEAD is now at 4e7d9a2 add login form

$ git log --oneline                 # they're gone from history...
4e7d9a2 (HEAD -> main) add login form
8d2e4b7 add header
f3a9c21 first commit: app skeleton

$ git reflog                        # ...but the camera saw everything
4e7d9a2 HEAD@{0}: reset: moving to HEAD~2     ← the disaster
d8f3c7b HEAD@{1}: commit: add invoice download   ← there it is!
a2e9f5c HEAD@{2}: commit: add order history page
4e7d9a2 HEAD@{3}: commit: add login form

$ git reset --hard d8f3c7b          # move the sticker BACK forward
HEAD is now at d8f3c7b add invoice download

$ git log --oneline -2
d8f3c7b (HEAD -> main) add invoice download    ← resurrected ✅
a2e9f5c add order history page`}
          output={`Total time to recover: 30 seconds.
Total work lost: zero.
The reflog records every HEAD move: commits, switches, merges,
resets, rebases — typically kept for 90 days.`}
        />
        <CodeBlock
          runnable={false}
          title="reflog-drawn.txt"
          code={`After the bad reset:
                            ┌── a2e9f5c ◀── d8f3c7b   ← "lost" commits
                            │              (no sticker → invisible
  ──●──●──● 4e7d9a2 ────────┘               to git log, but ALIVE
           ▲                                in .git/objects)
         main, HEAD
                            reflog remembers d8f3c7b's address →
After the rescue:           reset --hard d8f3c7b re-points the sticker:

  ──●──●──● ◀── a2e9f5c ◀── d8f3c7b
                               ▲
                            main, HEAD     everything reachable again ✅`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reflog                        # HEAD's full diary
$ git reflog show feature-cart      # one branch's diary
$ git log --oneline HEAD@{5}        # what history looked like 5 moves ago
$ git branch rescue d8f3c7b         # alternative rescue: sticker, no reset
$ git checkout HEAD@{2} -- app.py   # grab ONE file from a reflog state`}
        />
        <Callout type="behind">
          Reflog limits: it&apos;s <b>local-only</b> (never pushed, gone if you delete the
          folder) and can&apos;t recover things that were <b>never committed</b> — edits wiped
          by <IC>restore</IC>/<IC>reset --hard</IC>, or files removed by <IC>clean</IC>. Hence
          the deepest habit in Git: <b>commit early, commit often</b>. Anything committed even
          once is nearly indestructible for a month.
        </Callout>
      </Section>

      {/* 09 — scenarios */}
      <Section id="scenarios" number="09" title="The 「oh no」 dictionary — every disaster → exact command">
        <P>Bookmark this table. Left column is the sentence in your head; right column is the fix.</P>
        <Table
          head={["「Oh no...」", "The fix", "Safe?"]}
          rows={[
            ["ruined a file, want last committed version", "git restore app.py", "⚠️ kills edits"],
            ["added a file I didn't mean to", "git restore --staged file", "✅ 100%"],
            ["typo in last commit message", "git commit --amend -m \"...\"", "✅ if unpushed"],
            ["forgot a file in last commit", "git add f && git commit --amend --no-edit", "✅ if unpushed"],
            ["last commit is wrong, keep the changes", "git reset --soft HEAD~1", "✅ keeps all"],
            ["3 messy commits should be 1", "git reset --soft HEAD~3 && commit", "✅ keeps all"],
            ["last 2 commits + changes: erase all", "git reset --hard HEAD~2", "⚠️ wipes edits"],
            ["pushed commit broke production", "git revert <hash>", "✅ team-safe"],
            ["need clean tree NOW, work half-done", "git stash → later git stash pop", "✅ 100%"],
            ["committed on the wrong branch", "git branch save && git reset --hard HEAD~1", "✅ rescued"],
            ["untracked junk everywhere", "git clean -n → git clean -fd", "⚠️ no undo"],
            ["hard-reset destroyed my commits 😱", "git reflog → git reset --hard <hash>", "✅ hero move"],
            ["detached HEAD, made commits", "git switch -c rescue-branch", "✅ 100%"],
            ["merge going badly, abort mission", "git merge --abort", "✅ 100%"],
          ]}
        />
        <Callout type="analogy">
          Three escalation levels, like medicine: <b>restore</b> = band-aid (one file),{" "}
          <b>reset/revert</b> = surgery (commits), <b>reflog</b> = the emergency room (anything
          with a hash). Start small; you almost never need the ER.
        </Callout>
      </Section>

      {/* 10 — exceptions */}
      <Section id="exceptions" number="10" title="💥 When the undo itself goes wrong">
        <P><b>Case 1: reset --hard with uncommitted work in the tree.</b> The one true data-loss trap.</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git status -s
 M cart.py            ← 4 hours of UNCOMMITTED work
$ git reset --hard HEAD~1`}
          error
          output={`HEAD is now at 4e7d9a2 add login form

No error message — git did exactly what you asked. But cart.py's
4 uncommitted hours were overwritten and NO commit contains them.
reflog can't help: it tracks commits, and these edits never were one.

→ The ritual: ALWAYS 'git status' before --hard.
  Dirty tree? 'git stash' first — now you're covered either way.`}
        />
        <P><b>Case 2: reset on a pushed branch → push rejected.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reset --hard HEAD~1      # but that commit was already pushed...
$ git push`}
          error
          output={`To github.com:deelaksha/shop-app.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'github.com:deelaksha/shop-app.git'
hint: Updates were rejected because the tip of your current branch is behind

→ GitHub has a commit your local history no longer contains.
  Right fix: stop rewriting — 'git pull' to resync, then 'git revert'
  the bad commit instead. (force-push exists but breaks teammates —
  remotes page covers when it's ever acceptable.)`}
        />
        <P><b>Case 3: stash pop hits a conflict.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git stash pop`}
          error
          output={`Auto-merging cart.py
CONFLICT (content): Merge conflict in cart.py
The stash entry is kept in case you need it again.

→ The branch changed the same lines while your work was pocketed.
  Same ritual as a merge conflict: edit cart.py, remove <<< === >>>,
  git add cart.py. Note: pop FAILED so the stash was KEPT —
  after resolving, clean up with: git stash drop`}
        />
        <P><b>Case 4: revert a commit that later commits built upon.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git revert 1a4b8c3`}
          error
          output={`Auto-merging payment.py
CONFLICT (content): Merge conflict in payment.py
error: could not revert 1a4b8c3... add coupon support
hint: After resolving the conflicts, run "git revert --continue"

→ Later commits edited the same lines, so the anti-patch doesn't
  apply cleanly. Resolve like any conflict, then:
    git revert --continue      (finish)
    git revert --abort         (never mind)`}
        />
      </Section>

      <MemorizeGrid
        items={[
          ["wrong file edits", "git restore <file> — rewind to last commit (destructive!)"],
          ["wrong git add", "git restore --staged <file> — un-add, edits kept"],
          ["wrong last commit", "git commit --amend (new hash → unpushed only)"],
          ["reset --soft", "un-commit; changes stay STAGED (perfect for squashing)"],
          ["reset --mixed", "default; un-commit + un-stage; edits kept in files"],
          ["reset --hard", "erase commits AND edits ⚠️ (status check first!)"],
          ["pushed mistake", "git revert <hash> — anti-commit, never rewrites history"],
          ["reset vs revert", "reset rewrites (local), revert appends (public)"],
          ["git stash / pop", "pocket uncommitted work; LIFO stack; push -m to name"],
          ["git clean -fd", "delete untracked files; ALWAYS -n dry-run first"],
          ["git reflog", "diary of every HEAD move — recovers 「deleted」 commits"],
          ["golden rule", "committed once = recoverable for ~90 days; uncommitted = fragile"],
        ]}
      />
    </TopicShell>
  );
}
