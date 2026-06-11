"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "Branch = sticky note" },
  { id: "why", label: "Why branch? (scenario)" },
  { id: "branch-cmd", label: "git branch — all variants" },
  { id: "switch", label: "switch vs checkout" },
  { id: "moving", label: "Commits move the sticker" },
  { id: "ff", label: "Fast-forward merge" },
  { id: "threeway", label: "3-way merge" },
  { id: "conflict", label: "Conflicts — line by line" },
  { id: "cleanup", label: "Deleting & renaming" },
  { id: "workflow", label: "Real team workflow" },
  { id: "exceptions", label: "💥 When it goes wrong" },
  { id: "memorize", label: "Memorize" },
];

export default function GitBranchesPage() {
  return (
    <TopicShell
      icon="🌿"
      title="Branches &"
      gradientWord="Merging"
      subtitle="A branch is a 41-byte text file with a hash in it. Once you see that, branching stops being scary — create one for every idea, merge the good ones, delete the rest."
      nav={NAV}
      next={{ icon: "🧯", label: "Undo Anything", href: "/git/undo" }}
    >
      {/* 01 — what a branch really is */}
      <Section id="what" number="01" title="A branch is just a sticky note on a commit">
        <P>
          On the <IC>internals</IC> page you saw it with your own eyes:{" "}
          <IC>.git/refs/heads/main</IC> is a <b>one-line text file containing a commit hash</b>.
          That file IS the branch. Nothing else. A branch is not a copy of your code, not a
          folder, not a parallel universe — it&apos;s a <b>named pointer</b> (a sticky note) stuck
          on one commit.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ cat .git/refs/heads/main
4e7d9a2c91b3f5a8d2e6c4b7a9f1d3e5c8b2a4f6

$ git branch feature-cart        # create a new branch (sticky note)

$ cat .git/refs/heads/feature-cart
4e7d9a2c91b3f5a8d2e6c4b7a9f1d3e5c8b2a4f6   ← SAME hash!`}
          output={`Creating a branch = writing 41 bytes to a file.
That's why it's instant, even on a repo with 1 million files.`}
        />
        <CodeBlock
          runnable={false}
          title="branch-anatomy.txt"
          code={`         f3a9c21 ◀── 8d2e4b7 ◀── 4e7d9a2
         (first)     (header)    (login form)
                                    ▲  ▲
                                    │  │
                       main ────────┘  │      ← sticky note #1
                       feature-cart ───┘      ← sticky note #2

                       HEAD → main            ← "you are here" arrow

Two branches, ONE history. Zero files copied.
The commits are shared — only the sticky notes differ.`}
        />
        <Callout type="analogy">
          Think of your commit history as a string of beads (a linked list — same picture as the
          DSA page). A branch is a <b>paper tag tied to one bead</b> with a name written on it.
          <IC>HEAD</IC> is your finger pointing at one of the tags. Moving tags around is free;
          the beads never move.
        </Callout>
        <Callout type="behind">
          This is why Git branches are famous. In older systems (SVN), a branch literally copied
          the whole project folder on the server — slow and heavy, so people avoided branching.
          In Git it&apos;s a 41-byte file, so the entire workflow culture changed: <b>branch for
          everything</b>, even a 10-minute experiment.
        </Callout>
      </Section>

      {/* 02 — why */}
      <Section id="why" number="02" title="The scenario: half-done work + urgent bug">
        <P>
          Tuesday, 4pm. Deelaksha is halfway through rewriting the cart logic in{" "}
          <IC>shop-app</IC> — the code doesn&apos;t even run yet. Suddenly: <b>&quot;Production
          bug! Login is broken for all users — fix it NOW.&quot;</b> Her working directory is full
          of broken cart code. What now?
        </P>
        <CodeBlock
          runnable={false}
          title="without-branches.txt"
          code={`WITHOUT branches (panic mode):
  1. Copy broken files somewhere safe?  cart_backup_FINAL/  😱
  2. Try to undo cart changes by hand, hope you remember them
  3. Fix the bug in a dirty, half-broken project
  4. Restore your cart code... did you miss a file? who knows!

WITH branches (calm mode):
  main ────────●  ← always stable, always shippable
                \\
  feature-cart   ●──●  ← messy experiments live HERE

  Urgent bug? switch to main → it's clean! → branch off → fix
  → merge → switch back to feature-cart. Cart work untouched.`}
        />
        <P>
          That&apos;s the whole philosophy: <b><IC>main</IC> stays clean and shippable at all
          times</b>. Every piece of work — features, bug fixes, experiments — happens on its own
          branch and only merges into <IC>main</IC> when it&apos;s done. The rest of this page is
          the full command toolkit for that workflow.
        </P>
        <FlowDiagram
          steps={[
            { label: "🌱 branch", sub: "new sticky note" },
            { label: "🔀 switch", sub: "work on it" },
            { label: "📸 commit", sub: "sticker moves" },
            { label: "🤝 merge", sub: "bring into main" },
            { label: "🗑️ branch -d", sub: "remove sticker" },
          ]}
        />
      </Section>

      {/* 03 — git branch variants */}
      <Section id="branch-cmd" number="03" title="git branch — every variant">
        <P>
          <IC>git branch</IC> manages the sticky notes: list them, create them, rename them,
          delete them. (Switching between them is a different command — next section.)
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git branch                    # list local branches
  feature-cart
* main                          ← * marks where HEAD is

$ git branch -v                 # list + last commit on each
  feature-cart 4e7d9a2 add login form
* main         4e7d9a2 add login form

$ git branch fix-login          # create branch (but DON'T move to it)

$ git branch -a                 # list ALL: local + remote-tracking
  feature-cart
  fix-login
* main
  remotes/origin/main

$ git branch --merged           # branches already merged into HEAD
$ git branch --no-merged        # branches with unmerged work`}
          output={`Tip: 'git branch <name>' creates the note where HEAD is now,
but leaves you standing on the old branch. Most of the time you
want create + move in one step: 'git switch -c <name>'.`}
        />
        <Table
          head={["Command", "What it does", "When you use it"]}
          rows={[
            ["git branch", "list local branches", "「where am I? what exists?」"],
            ["git branch -v", "list + last commit each", "quick overview of all work"],
            ["git branch <name>", "create at HEAD (no switch)", "bookmark this spot for later"],
            ["git branch <name> <hash>", "create at a specific commit", "branch off an old commit"],
            ["git branch -m old new", "rename a branch", "typo in the name"],
            ["git branch -d <name>", "delete (safe — refuses if unmerged)", "cleanup after merging"],
            ["git branch -D <name>", "delete (force — even unmerged)", "abandon an experiment"],
            ["git branch --merged", "show branches safe to delete", "monthly cleanup"],
            ["git branch -a", "include remote-tracking branches", "see what's on GitHub too"],
          ]}
        />
        <Callout type="tip">
          Branch names: lowercase with dashes, describing the work — <IC>fix-login-crash</IC>,{" "}
          <IC>feature-cart</IC>, <IC>experiment-new-db</IC>. Many teams prefix them:{" "}
          <IC>feature/cart</IC>, <IC>bugfix/login</IC>, <IC>deelaksha/try-redis</IC>.
        </Callout>
      </Section>

      {/* 04 — switch vs checkout */}
      <Section id="switch" number="04" title="git switch vs git checkout — moving between branches">
        <P>
          Switching branches means two things happen at once: ① <IC>HEAD</IC> now points at the
          other branch, and ② your <b>working directory files are rewritten</b> to match that
          branch&apos;s snapshot. Your folder literally transforms.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch feature-cart        # move HEAD to existing branch
Switched to branch 'feature-cart'

$ git switch -c fix-login        # CREATE + switch in one step ⭐
Switched to a new branch 'fix-login'

$ git switch -                   # jump back to previous branch
Switched to branch 'feature-cart'

$ git switch -c old-state 8d2e4b7   # new branch starting at old commit
Switched to a new branch 'old-state'`}
          output={`'git switch -c' is the command you'll type 10 times a day.
'-' works like 'cd -' in the shell: bounce between two branches.`}
        />
        <P>
          You will also see <IC>git checkout</IC> everywhere in older tutorials. It&apos;s the
          old all-in-one command that did <b>three unrelated jobs</b>, which confused everyone —
          so in 2019 Git split it into two clearer commands:
        </P>
        <Table
          head={["Old way (checkout)", "New way (2019+)", "Job"]}
          rows={[
            ["git checkout main", "git switch main", "move to a branch"],
            ["git checkout -b fix", "git switch -c fix", "create + move"],
            ["git checkout -- app.py", "git restore app.py", "discard file changes (undo page)"],
            ["git checkout 8d2e4b7", "git switch --detach 8d2e4b7", "visit an old commit (detached HEAD)"],
          ]}
        />
        <CodeBlock
          runnable={false}
          title="what-switching-does.txt"
          code={`Before:  HEAD → main → 4e7d9a2          folder shows main's files
                                          (cart.py does NOT exist)

$ git switch feature-cart

After:   HEAD → feature-cart → 9f1c3b5   folder TRANSFORMS:
                                          cart.py appears!
                                          app.py reverts to cart-branch version

Git rewrites your working directory from the snapshot.
Files unique to the other branch appear; files that don't
belong vanish (they're safe inside .git, not deleted).`}
        />
        <Callout type="mistake">
          Switching with <b>uncommitted changes</b>? Git tries to carry them over. If they would
          be overwritten by the target branch, it <b>refuses</b> with{" "}
          <IC>error: Your local changes would be overwritten</IC>. Your options: commit them,
          or <IC>git stash</IC> them (undo page). Git never silently destroys your edits.
        </Callout>
      </Section>

      {/* 05 — commits move the sticker */}
      <Section id="moving" number="05" title="Committing moves YOUR sticker — drawn step by step">
        <P>
          Here&apos;s the rule that makes everything click: <b>when you commit, only the branch
          HEAD points to moves forward</b>. All other sticky notes stay where they are. Watch
          Deelaksha fix the login bug:
        </P>
        <CodeBlock
          runnable={false}
          title="step-by-step.txt"
          code={`STEP 0 — start: both notes on the same commit
      ──●──●──● 4e7d9a2
               ▲
        main, fix-login, HEAD → fix-login

STEP 1 — fix the bug, commit on fix-login
$ git commit -am "fix login crash on empty password"

      ──●──●──● 4e7d9a2 ◀── ● b5e8d1f
               ▲              ▲
             main          fix-login ← moved! HEAD here
                                       main DIDN'T move

STEP 2 — switch back to main
$ git switch main            → folder reverts: bug is BACK here
                               (main doesn't have b5e8d1f yet)

STEP 3 — meanwhile, commit on feature-cart too
      ──●──●──● 4e7d9a2 ◀── ● b5e8d1f   (fix-login)
               ▲    ▲
             main   └─────── ● 9f1c3b5   (feature-cart)

HISTORY DIVERGED: two lines of work from one starting point.
This is the moment merging exists for.`}
        />
        <Callout type="behind">
          Each commit stores its <b>parent hash</b> (internals page), so the &quot;graph&quot;
          you see in diagrams is just commits pointing backwards at their parents — a linked
          list that forked into two. <IC>git log --graph --all</IC> draws it for you:
        </Callout>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git log --oneline --graph --all
* 9f1c3b5 (feature-cart) start cart logic
| * b5e8d1f (fix-login) fix login crash on empty password
|/
* 4e7d9a2 (HEAD -> main) add login form
* 8d2e4b7 add header
* f3a9c21 first commit: app skeleton`}
          output={`Read it bottom-up: shared history, then a fork into two lines.
The | and / characters draw the parent pointers.
This command is so useful most people alias it:  git lg`}
        />
      </Section>

      {/* 06 — fast-forward */}
      <Section id="ff" number="06" title="Merge type 1: fast-forward — just slide the sticker">
        <P>
          The login fix is done and tested. Time to get it into <IC>main</IC>. You always merge{" "}
          <b>standing on the branch that should receive the changes</b>:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch main                # stand on the receiver
Switched to branch 'main'

$ git merge fix-login            # pull fix-login's commits in
Updating 4e7d9a2..b5e8d1f
Fast-forward
 login.py | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)`}
          output={`"Fast-forward" — the simplest merge there is.
No new commit was created. Nothing was combined.`}
        />
        <CodeBlock
          runnable={false}
          title="fast-forward-drawn.txt"
          code={`BEFORE: main is a direct ANCESTOR of fix-login.
        There is nothing on main that fix-login doesn't have.

      ──●──● 4e7d9a2 ◀── ● b5e8d1f
            ▲               ▲
          main           fix-login

MERGE = Git notices: "I can just slide main's sticker forward."

      ──●──● 4e7d9a2 ◀── ● b5e8d1f
                            ▲   ▲
                         main  fix-login     ← both here now!

No new commit. No combining. Just a sticker slide —
because the history never actually diverged.`}
        />
        <Callout type="analogy">
          Fast-forward is like catching up on a series your friend is ahead on. You both watched
          episodes 1–4; they watched 5. &quot;Merging&quot; just means <b>you watch episode 5
          too</b> — nothing needs combining, you simply move forward to where they are.
        </Callout>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git merge --no-ff fix-login    # force a merge commit even if ff possible
$ git merge --ff-only fix-login  # only merge IF fast-forward works, else stop`}
          output={`--no-ff:    some teams want a merge commit as a visible record
            that "a feature landed here" (GitHub does this on PRs).
--ff-only:  safety check — "don't create surprise merge commits."`}
        />
      </Section>

      {/* 07 — 3-way merge */}
      <Section id="threeway" number="07" title="Merge type 2: 3-way merge — when history really diverged">
        <P>
          Now merge <IC>feature-cart</IC>. But <IC>main</IC> has moved since the cart branch was
          created (it got the login fix) — the histories <b>diverged</b>. No sticker slide
          possible. Git must actually <b>combine two snapshots</b>, and it does it by comparing{" "}
          <b>three</b> commits:
        </P>
        <CodeBlock
          runnable={false}
          title="three-way-merge-drawn.txt"
          code={`              ② yours (main, has login fix)
                    ● b5e8d1f
                   /         \\
   ──●──● 4e7d9a2             ● c7a2f9e  ← NEW merge commit
        ①  base    \\         /    has TWO parents!
       (common      ● 9f1c3b5
        ancestor)  ③ theirs (feature-cart)

Git compares THREE snapshots:
  ① base   — last commit both sides share  (4e7d9a2)
  ② yours  — tip of main                   (b5e8d1f)
  ③ theirs — tip of feature-cart           (9f1c3b5)

Rules, file by file:
  changed only in ②  → take ②     (login.py: keep the fix)
  changed only in ③  → take ③     (cart.py: take the new file)
  changed in BOTH, same lines → ⚠️ CONFLICT (next section)`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch main
$ git merge feature-cart
Merge made by the 'ort' strategy.
 cart.py | 42 ++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 42 insertions(+)

$ git log --oneline --graph
*   c7a2f9e (HEAD -> main) Merge branch 'feature-cart'
|\\
| * 9f1c3b5 (feature-cart) start cart logic
* | b5e8d1f fix login crash on empty password
|/
* 4e7d9a2 add login form`}
          output={`A 3-way merge creates a real MERGE COMMIT (c7a2f9e).
It's a normal commit object except it has TWO parent lines —
remember the commit anatomy from the internals page:

  tree   8c1f4e6...
  parent b5e8d1f...   ← parent #1 (main)
  parent 9f1c3b5...   ← parent #2 (feature-cart)

Two parents = "these two histories joined here."`}
        />
        <Callout type="behind">
          Why &quot;3-way&quot; and not just compare the two tips? Because without the base you
          can&apos;t tell <b>who changed what</b>. If line 7 says <IC>timeout=30</IC> on main and{" "}
          <IC>timeout=60</IC> on the branch, which wins? Check the base: it said{" "}
          <IC>timeout=30</IC> — so main didn&apos;t touch it and the branch changed it →
          the branch&apos;s <IC>60</IC> wins automatically. The base is the tiebreaker.
        </Callout>
      </Section>

      {/* 08 — conflicts */}
      <Section id="conflict" number="08" title="Merge conflicts — resolved line by line, zero panic">
        <P>
          A conflict happens when <b>both branches changed the same lines of the same file</b>.
          Git refuses to guess which version you want — it stops, marks the spot, and asks{" "}
          <b>you</b> to decide. That&apos;s not an error. It&apos;s a question.
        </P>
        <P>
          Scenario: both Deelaksha (on <IC>main</IC>) and the cart branch edited the price line
          in <IC>config.py</IC>:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git merge feature-discount
Auto-merging config.py
CONFLICT (content): Merge conflict in config.py
Automatic merge failed; fix conflicts and then commit the result.

$ git status
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   config.py`}
          output={`Git is PAUSED mid-merge, waiting for you.
Status even tells you the two exits:
  → fix + add + commit   (finish the merge)
  → git merge --abort    (cancel everything, back to before)`}
        />
        <P>Open the file. Git has written <b>both versions</b> into it with markers:</P>
        <CodeBlock
          runnable={false}
          title="config.py (with conflict markers)"
          code={`SHIPPING = 49

<<<<<<< HEAD
TAX_RATE = 0.18          # ← YOUR side (main, where HEAD is)
=======
TAX_RATE = 0.18
DISCOUNT = 0.10          # ← THEIR side (feature-discount)
>>>>>>> feature-discount

CURRENCY = "INR"`}
          output={`Read the markers:
  <<<<<<< HEAD ........ start of YOUR version
  ======= ............. divider
  >>>>>>> branch ...... end of THEIR version

Everything outside the markers merged fine on its own.`}
        />
        <P>
          Resolving = <b>edit the file into the final form you want</b>, deleting all three
          marker lines. You can keep yours, keep theirs, keep both, or write something entirely
          new:
        </P>
        <CodeBlock
          runnable={false}
          title="config.py (resolved by hand)"
          code={`SHIPPING = 49

TAX_RATE = 0.18
DISCOUNT = 0.10          # kept their new line — it's good!

CURRENCY = "INR"`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git add config.py           # add = "this conflict is resolved" ✅
$ git status
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

$ git commit                  # opens editor with prefilled message:
                              #   "Merge branch 'feature-discount'"
[main d4f8a3c] Merge branch 'feature-discount'`}
          output={`The full conflict ritual — memorize these 4 steps:
  1. git merge <branch>     → CONFLICT
  2. open file, edit, remove <<<< ==== >>>> markers
  3. git add <file>         → mark resolved
  4. git commit             → merge commit created. Done!

Panic button at ANY point before step 4:
  $ git merge --abort       → like the merge never happened`}
        />
        <Callout type="tip">
          Helpers while resolving: <IC>git diff</IC> shows remaining conflicted hunks,{" "}
          <IC>git log --merge --oneline</IC> shows only the commits that touch the conflicted
          files, and <IC>git checkout --ours config.py</IC> / <IC>--theirs config.py</IC> takes
          one whole side of a file in bulk. VS Code shows clickable
          &quot;Accept Current / Incoming / Both&quot; buttons over each marker — same edit,
          nicer UI.
        </Callout>
        <Callout type="mistake">
          The #1 conflict mistake: committing the file <b>with the markers still inside</b>.
          Your code now contains <IC>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</IC> and crashes with a
          SyntaxError. Always search the file for <IC>&lt;&lt;&lt;</IC> before{" "}
          <IC>git add</IC>.
        </Callout>
      </Section>

      {/* 09 — cleanup */}
      <Section id="cleanup" number="09" title="After the merge: delete & rename branches">
        <P>
          Once merged, the branch sticker is useless — the commits are in <IC>main</IC> forever
          (merging never deletes commits). Peeling off the sticker keeps your branch list clean:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git branch --merged            # who is safe to delete?
  fix-login
  feature-cart
* main

$ git branch -d fix-login        # -d = safe delete
Deleted branch fix-login (was b5e8d1f).

$ git branch -d feature-cart
Deleted branch feature-cart (was 9f1c3b5).

$ git branch -m experiment try-redis    # rename: -m old new`}
          output={`Deleting a branch deletes the 41-byte sticker file.
The commits stay in the repo — they're reachable from main.`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git branch -d experiment-ai
error: the branch 'experiment-ai' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D experiment-ai'

$ git branch -D experiment-ai    # -D = force. "Yes, abandon this work."
Deleted branch experiment-ai (was a8c3e7f).`}
          error
          output={`-d refuses if the branch has commits main can't reach —
that's Git protecting you from losing work. -D overrides it.
(Even then the commits survive ~30 days via reflog — undo page.)`}
        />
      </Section>

      {/* 10 — workflow */}
      <Section id="workflow" number="10" title="The complete real-world loop — every command in order">
        <P>
          Here&apos;s a full day with branches, start to finish — this exact loop is how
          millions of developers work, and it&apos;s the local half of the GitHub Pull Request
          flow you&apos;ll learn two pages from now:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal — one complete feature, end to end"
          code={`$ git switch main                 # 1. always start from main
$ git pull                        # 2. get latest (remotes page)
$ git switch -c feature-wishlist  # 3. new branch for the idea

# ... edit wishlist.py, app.py ...
$ git add wishlist.py app.py      # 4. stage
$ git commit -m "add wishlist model and routes"
# ... more edits ...
$ git commit -am "wire wishlist button into product page"

$ git switch main                 # 5. back to the receiver
$ git merge feature-wishlist      # 6. land it
$ git branch -d feature-wishlist  # 7. peel the sticker off
$ git log --oneline --graph -5    # 8. admire`}
          output={`branch → work → commit → merge → delete.
One feature = one branch = one clean unit of work.
If the feature turns out bad? git branch -D and main never knew.`}
        />
        <FlowDiagram
          steps={[
            { label: "main", sub: "start clean" },
            { label: "switch -c", sub: "own branch" },
            { label: "commit ×N", sub: "mess freely" },
            { label: "merge", sub: "land on main" },
            { label: "branch -d", sub: "cleanup" },
          ]}
        />
        <Callout type="note">
          The urgent-bug scenario from section 02, solved: you&apos;re mid-feature →{" "}
          <IC>git stash</IC> (or commit) → <IC>git switch main</IC> →{" "}
          <IC>git switch -c hotfix-login</IC> → fix → commit → <IC>git switch main</IC> →{" "}
          <IC>git merge hotfix-login</IC> → <IC>git switch feature-cart</IC> → continue like
          nothing happened. Total detour: 5 minutes, zero risk.
        </Callout>
      </Section>

      {/* 11 — exceptions */}
      <Section id="exceptions" number="11" title="💥 When branching goes wrong">
        <P><b>Case 1: switching with changes that would be overwritten.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch feature-cart`}
          error
          output={`error: Your local changes to the following files would be overwritten by checkout:
	app.py
Please commit your changes or stash them before you switch.
Aborting

→ Git refuses to destroy your uncommitted edits. Three ways out:
   git commit -am "wip"        (commit, even if messy)
   git stash                   (pocket the changes — undo page)
   git restore app.py          (throw the edits away on purpose)`}
        />
        <P>
          <b>Case 2: merged the wrong branch / merge went bad.</b> If you haven&apos;t committed
          the resolution yet, <IC>git merge --abort</IC> rewinds perfectly. If the merge commit
          already exists, <IC>git reset --hard HEAD~1</IC> (undo page) removes it — only safe if
          you haven&apos;t pushed.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git merge feature-experimental
CONFLICT (content): Merge conflict in app.py
CONFLICT (content): Merge conflict in db.py
CONFLICT (content): Merge conflict in config.py

$ git merge --abort              # nope nope nope
$ git status
On branch main
nothing to commit, working tree clean   ← like it never happened ✅`}
        />
        <P><b>Case 3: committed on the wrong branch</b> (you forgot to switch — everyone does this weekly).</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`# Meant to commit on feature-cart... but you were on main 😬
$ git log --oneline -1
e2f7b9d (HEAD -> main) half-finished cart experiment

# Fix: put a sticker here, then pull main back one commit
$ git branch feature-cart        # sticker on the misplaced commit
$ git reset --hard HEAD~1        # move main back (undo page explains)
$ git switch feature-cart        # commit is safe over here ✅`}
          output={`main:          ──●──●            (clean again)
                       \\
feature-cart:           ● e2f7b9d  (your experiment, rescued)`}
        />
        <P><b>Case 4: detached HEAD after checking out a raw commit.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git checkout 8d2e4b7`}
          error
          output={`Note: switching to '8d2e4b7'.

You are in 'detached HEAD' state. You can look around, make
experimental changes and commit them, and you can discard any
commits you make in this state without impacting any branches...

→ HEAD points at a COMMIT instead of a branch sticker.
  Commits made here belong to no branch and get garbage-collected.
  Just looking?         git switch -        (go back, all fine)
  Want to keep work?    git switch -c rescue-branch   ⭐`}
        />
        <Callout type="tip">
          Notice the pattern across every &quot;disaster&quot;: <b>commits are almost never
          lost</b> — only the stickers move. As long as something points at a commit (a branch,
          HEAD, or the reflog), it&apos;s safe. The next page is entirely about exploiting that.
        </Callout>
      </Section>

      <MemorizeGrid
        items={[
          ["branch =", "41-byte file holding a commit hash — a named sticky note"],
          ["git switch -c name", "create branch + move to it (daily driver)"],
          ["git switch -", "bounce back to previous branch"],
          ["commit moves...", "only the branch HEAD points to; others stay put"],
          ["fast-forward", "receiver is an ancestor → just slide the sticker, no new commit"],
          ["3-way merge", "base + yours + theirs → new merge commit with 2 parents"],
          ["conflict =", "both sides edited the same lines; Git asks, you decide"],
          ["conflict ritual", "edit file → remove <<< === >>> → git add → git commit"],
          ["panic button", "git merge --abort — rewind to before the merge"],
          ["git branch -d / -D", "-d safe delete (merged only), -D force delete"],
          ["wrong branch commit?", "git branch save-it → git reset --hard HEAD~1"],
          ["golden rule", "main stays shippable; all work happens on branches"],
        ]}
      />
    </TopicShell>
  );
}
