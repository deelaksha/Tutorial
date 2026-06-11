"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "rebase", label: "rebase — replay commits ⭐" },
  { id: "interactive", label: "rebase -i — edit history" },
  { id: "cherry", label: "cherry-pick — copy a commit" },
  { id: "tag", label: "tag — version labels" },
  { id: "blame", label: "blame — who wrote this line" },
  { id: "bisect", label: "bisect — binary search bugs ⭐" },
  { id: "misc", label: "worktree, archive, shortlog" },
  { id: "exceptions", label: "💥 Rebase gone wrong" },
  { id: "cheatsheet", label: "🗂️ EVERY command — cheat sheet" },
  { id: "memorize", label: "Memorize" },
];

export default function GitAdvancedPage() {
  return (
    <TopicShell
      icon="⚡"
      title="Power User +"
      gradientWord="Cheat Sheet"
      subtitle="rebase, cherry-pick, tag, blame, bisect — the precision tools. Then the grand finale: every command from the whole track on one giant reference sheet."
      nav={NAV}
      next={{ icon: "🌿", label: "Back to Git & GitHub hub", href: "/git" }}
    >
      {/* 01 — rebase */}
      <Section id="rebase" number="01" title="git rebase — replay your commits on a new base ⭐">
        <P>
          You know merge: histories diverge, a merge commit joins them. <b>Rebase is the other
          way</b> to combine diverged work: instead of joining the two lines, Git{" "}
          <b>picks your commits up and replays them on top of the other branch</b> — as if you
          had started your work from there all along. Result: a straight line, no merge bubble.
        </P>
        <CodeBlock
          runnable={false}
          title="merge-vs-rebase-drawn.txt"
          code={`START — diverged (same as the 3-way merge setup):

              ● M1 ◀── ● M2        (main got 2 new commits)
             /
  ──●──● base
             \\
              ● A ◀── ● B          (feature-cart: your 2 commits)

MERGE keeps both lines + joins them:        ● M1 ─ ● M2 ─◍ merge
                                           /             /
                                  ──●──● base ─ ● A ─ ● B

REBASE replays YOUR commits on top of main:

  ──●──● base ◀── ● M1 ◀── ● M2 ◀── ● A' ◀── ● B'
                                     ▲ copies of A and B with
                                       NEW HASHES — built on M2
                                       instead of base. The old
                                       A and B are abandoned.

Same final code either way. Different history SHAPE:
  merge  = honest braid   (shows when lines diverged/joined)
  rebase = tidy straight line (reads like one person, one flow)`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch feature-cart
$ git rebase main                  # replay my commits onto main's tip
Successfully rebased and updated refs/heads/feature-cart.

$ git log --oneline --graph --all
* 7e3a9c2 (HEAD -> feature-cart) B' wire cart into checkout
* 5c8f1d4 A' start cart logic
* e4a9c2d (main) M2 add product search
* c3b7f1e M1 fix image upload
* 4e7d9a2 base: add login form        ← one straight line ✅

# then main can fast-forward — no merge commit ever needed:
$ git switch main && git merge feature-cart
Fast-forward`}
          output={`A' and B' are NEW commit objects (new hashes!) — same diffs,
different parents. That's why THE GOLDEN RULE exists:

  ⚠️ NEVER rebase commits that are already pushed/shared.
  Teammates still have the OLD A and B → chaos on their next pull.
  Rebase your private, local, unpushed work only.

If conflicts hit during the replay: same <<< === >>> ritual, then
  git rebase --continue     (next commit in the replay)
  git rebase --skip         (drop this commit entirely)
  git rebase --abort        (undo everything, back to start) ✅`}
        />
        <Callout type="analogy">
          Merge is like stapling two diaries together with a note &quot;combined here.&quot;
          Rebase is rewriting your diary entries as if they happened <b>after</b> the other
          person&apos;s — cleaner to read later, but the pages are forgeries (new hashes), so
          only rewrite a diary nobody else has photocopied yet.
        </Callout>
      </Section>

      {/* 02 — interactive rebase */}
      <Section id="interactive" number="02" title="git rebase -i — the history editor">
        <P>
          <b>Scenario:</b> Deelaksha&apos;s feature branch works, but the history is
          embarrassing: 5 commits including <IC>oops</IC>, <IC>typo</IC>, and <IC>wip</IC>.
          Before opening the PR she wants it to read like a professional. Interactive rebase
          opens the last N commits <b>as an editable to-do list</b>:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git log --oneline -5
9c2e7f1 (HEAD -> feature-reviews) wip
4b8d3a6 fix typo in template
e7f2c9d oops forgot the import
2a6c8e4 render review list
8f1b5d7 add Review model

$ git rebase -i HEAD~5            # open the last 5 commits as a todo list`}
        />
        <CodeBlock
          runnable={false}
          title="editor — the rebase todo list (oldest FIRST!)"
          code={`pick 8f1b5d7 add Review model
pick 2a6c8e4 render review list
pick e7f2c9d oops forgot the import
pick 4b8d3a6 fix typo in template
pick 9c2e7f1 wip

# Commands:
# p, pick   = use commit as-is
# r, reword = use commit, but edit the message
# s, squash = meld into previous commit (keep both messages)
# f, fixup  = meld into previous commit (DISCARD this message)
# d, drop   = delete the commit entirely
# (also: edit = pause to amend, exec = run a command)`}
          output={`Deelaksha edits the list — fold the junk into the real commits:

  pick  8f1b5d7 add Review model
  fixup e7f2c9d oops forgot the import     ← melts into Review model
  pick  2a6c8e4 render review list
  fixup 4b8d3a6 fix typo in template       ← melts into render
  fixup 9c2e7f1 wip                        ← melts into render

(You can also REORDER lines — she moved the import-fix up
 under the commit it belongs to.) Save & close the editor...`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`Successfully rebased and updated refs/heads/feature-reviews.

$ git log --oneline -2
d3f8a1c (HEAD -> feature-reviews) render review list
6e9b2c5 add Review model`}
          output={`5 messy commits → 2 clean ones. THIS is how open-source
maintainers keep history readable.

Quick variants worth knowing:
  git commit --fixup 8f1b5d7        mark a fix for a specific commit
  git rebase -i --autosquash ...    auto-arranges the fixup lines
  git rebase -i HEAD~3              just reword/squash recent work

Same golden rule: only on UNPUSHED commits (or your own
PR branch followed by push --force-with-lease).`}
        />
      </Section>

      {/* 03 — cherry-pick */}
      <Section id="cherry" number="03" title="git cherry-pick — copy one commit anywhere">
        <P>
          <b>Scenario:</b> on her experimental branch, among 14 messy commits, there&apos;s ONE
          gem — a critical security fix. The branch isn&apos;t ready to merge, but the fix is
          needed on <IC>main</IC> today. <IC>cherry-pick</IC> copies a single commit&apos;s{" "}
          <b>diff</b> onto your current branch:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git log --oneline experiment-v2 | head -4
f4e8c2a try new layout (broken)
b9d3f7e fix SQL injection in search   ← THE gem
a2c6e1f experiment with cache
...

$ git switch main
$ git cherry-pick b9d3f7e
[main 8a5d2f9] fix SQL injection in search
 1 file changed, 4 insertions(+), 2 deletions(-)`}
          output={`experiment-v2:  ──●──● a2c6e1f ── ● b9d3f7e ── ● f4e8c2a
                                       │ (stays here too!)
                                       │ diff copied
                                       ▼
main:           ──●──●──────────── ● 8a5d2f9  ← NEW commit, new hash,
                                               same change, on main ✅`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git cherry-pick A B C            # copy several commits
$ git cherry-pick A..C             # a range (commits AFTER A through C)
$ git cherry-pick -n b9d3f7e       # apply the diff but DON'T commit yet
$ git cherry-pick -x b9d3f7e       # append "(cherry picked from b9d3f7e)"
# conflicts? same trio:  --continue / --skip / --abort`}
        />
        <Callout type="note">
          Classic real-world use: <b>backporting</b>. A bug is fixed on <IC>main</IC>, but
          customers run version 2 → <IC>git switch release-2.x && git cherry-pick
          &lt;fix&gt;</IC>. The fix lives in both histories as two different commits.
        </Callout>
      </Section>

      {/* 04 — tag */}
      <Section id="tag" number="04" title="git tag — permanent version labels">
        <P>
          A branch sticker <b>moves</b> with every commit. A <b>tag</b> is a sticker that{" "}
          <b>never moves</b> — glued to one commit forever. That&apos;s exactly what releases
          need: <IC>v1.0</IC> must mean the same code next year.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git tag -a v1.0 -m "first public release"     # annotated tag ⭐
$ git tag v1.0-rc1 8d2e4b7                       # tag an OLD commit too

$ git tag                          # list
v1.0
v1.0-rc1
$ git tag -l "v1.*"                # filter
$ git show v1.0                    # tagger, date, message + the commit

$ git push origin v1.0             # tags do NOT push automatically!
$ git push --tags                  # or push all of them

$ git switch --detach v1.0         # visit the exact v1.0 code (detached)
$ git tag -d v1.0-rc1              # delete local
$ git push origin --delete v1.0-rc1   # delete on GitHub`}
          output={`Annotated (-a) vs lightweight (no -a):
  -a creates a real tag OBJECT — tagger, date, message (use for
     releases). Lightweight is just a sticker file (quick local marks).

On GitHub, pushed tags appear under "Releases / Tags" — attach
release notes and binaries there. Semantic versioning convention:
  v MAJOR.MINOR.PATCH → v2.4.1
    breaking.feature.bugfix`}
        />
      </Section>

      {/* 05 — blame */}
      <Section id="blame" number="05" title="git blame — who wrote this line, and why?">
        <P>
          You hit a bizarre line: <IC>time.sleep(3)</IC> in the payment flow. Delete it? Who
          knows what breaks. <IC>blame</IC> shows, <b>for every line</b>, the commit, author and
          date that last touched it — and the commit message explains the <b>why</b>:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git blame payment.py
4e7d9a2 (deelaksha 2025-11-02 14:21) def charge(order):
b5e8d1f (arjun     2025-12-18 09:47)     validate(order)
1a4b8c3 (deelaksha 2026-01-15 16:03)     time.sleep(3)   # ← suspicious
4e7d9a2 (deelaksha 2025-11-02 14:21)     return gateway.pay(order)

$ git show 1a4b8c3                 # the WHY behind the line
commit 1a4b8c3...
    wait for gateway rate limit — provider throttles at 1 req/3s
    see incident #88; remove after we upgrade the plan`}
          output={`Mystery solved — the "stupid" line prevents an outage.
blame turns "who wrote this garbage?!" into
"ohh, THAT's why" about twice a week. (Half the time
the author is you.)

  git blame -L 10,20 payment.py    only lines 10–20
  git blame -w payment.py          ignore whitespace-only changes
  git log -S "sleep(3)" payment.py the pickaxe (basics page) —
                                   when was this ADDED/removed?`}
        />
      </Section>

      {/* 06 — bisect */}
      <Section id="bisect" number="06" title="git bisect — find the breaking commit by binary search ⭐">
        <P>
          <b>Scenario:</b> checkout worked last month. Today it&apos;s broken. 500 commits in
          between — which one broke it? Checking all 500 = days.{" "}
          <b>Binary search</b> (your DSA sorting-searching page!) = <IC>log₂(500) ≈ 9</IC>{" "}
          checks. <IC>git bisect</IC> drives the search for you:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git bisect start
$ git bisect bad                   # current commit: broken
$ git bisect good v1.0             # this old tag: worked
Bisecting: 250 revisions left to test after this (roughly 8 steps)
[a8c3e7f...] add coupon stacking

# git checked out the MIDDLE commit. You test the app...
$ python app.py     → checkout works here!
$ git bisect good
Bisecting: 125 revisions left to test after this (roughly 7 steps)

# test again... broken this time:
$ git bisect bad
Bisecting: 62 revisions left to test after this (roughly 6 steps)
# ... good/bad ~7 more times ...

c4f9e2b is the first bad commit
    refactor cart total calculation
    cart.py | 31 ++++++-----

$ git bisect reset                 # back to where you started`}
          output={`            500 commits
good ●────────────?────────────● bad
          test middle → good? bug is in the RIGHT half
                        bad?  bug is in the LEFT half
          → halve, repeat. 9 tests instead of 500. O(log n)!

Found c4f9e2b → read it with git show, fix forward or
git revert it. Centuries of debugging time saved by
one borrowed DSA idea.`}
        />
        <Callout type="tip">
          Have a test script that exits 0 on success?{" "}
          <IC>git bisect run python test_checkout.py</IC> — Git runs the <b>entire search by
          itself</b> and just prints the guilty commit. Go get coffee. This is the single best
          argument for small, frequent commits: bisect can only point at a commit, and a small
          commit IS the diagnosis.
        </Callout>
      </Section>

      {/* 07 — misc */}
      <Section id="misc" number="07" title="The remaining toolbox — worktree, archive, shortlog & friends">
        <Table
          head={["Command", "What it does", "Real moment it helps"]}
          rows={[
            ["git worktree add ../hotfix main", "SECOND folder, same repo, another branch", "review a PR without stashing your mess"],
            ["git archive -o v1.zip v1.0", "zip a snapshot — no .git inside", "send code to someone without history"],
            ["git shortlog -sn", "commit count per author", "instant team contribution overview"],
            ["git describe --tags", "name commit as v1.0-14-g8a5d2f9", "「which build is on this server?」"],
            ["git grep TODO", "search tracked files (fast)", "all TODOs, respecting .gitignore"],
            ["git log --oneline --graph --all", "the everything-graph", "your daily map (alias it: git lg)"],
            ["git cherry main feature", "which commits aren't merged yet?", "pre-PR sanity check"],
            ["git notes add -m \"...\"", "attach notes without changing hashes", "annotate audit info post-hoc"],
            ["git submodule add URL", "repo inside a repo (advanced!)", "vendoring a library at a pinned commit"],
            ["git gc / git fsck", "compress objects / check integrity", "internals page — maintenance duo"],
          ]}
        />
        <Callout type="note">
          You now know the full toolbox. Honest truth: 90% of real life is{" "}
          <IC>status · add · commit · push · pull · switch · merge</IC>. The rest of this page
          is what makes you the person teammates call when something&apos;s weird.
        </Callout>
      </Section>

      {/* 08 — exceptions */}
      <Section id="exceptions" number="08" title="💥 When the power tools backfire">
        <P><b>Case 1: conflict in the middle of a rebase</b> — and it can happen once per replayed commit:</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git rebase main`}
          error
          output={`Auto-merging cart.py
CONFLICT (content): Merge conflict in cart.py
error: could not apply 5c8f1d4... start cart logic
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add <file>", then run "git rebase --continue".
hint: To abort and get back to the state before "git rebase", run
hint: "git rebase --abort".

→ The replay is PAUSED at one commit. Fix the <<< === >>> markers,
  git add, then:
    git rebase --continue   → resumes with the next commit
    git rebase --abort      → total undo, branch as before ✅
  Drowning in repeated conflicts? Abort and just merge instead —
  merge resolves everything once, rebase once per commit.`}
        />
        <P><b>Case 2: rebased commits that were already pushed.</b> New hashes vs GitHub&apos;s old ones → push rejected; a plain <IC>git pull</IC> now would <b>merge your branch with its own old self</b> (duplicated commits!). On your solo feature branch the correct move is:</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git push --force-with-lease      # replace remote history with rebased one
# (remotes page: NEVER on main/shared branches — solo PR branches only)`}
        />
        <P><b>Case 3: interactive rebase went sideways — commits mangled.</b> Reflog to the rescue, as always:</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git reflog | head -3
d3f8a1c HEAD@{0}: rebase (finish): returning to refs/heads/feature-reviews
9c2e7f1 HEAD@{1}: rebase (start): checkout HEAD~5
9c2e7f1 HEAD@{2}: commit: wip            ← the world BEFORE the rebase

$ git reset --hard HEAD@{2}              # like the rebase never happened ✅`}
          output={`Every rebase records the pre-rebase state in the reflog.
You can experiment with history edits fearlessly —
the undo page's safety net covers even the power tools.`}
        />
        <P><b>Case 4: cherry-pick empty / already applied.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git cherry-pick b9d3f7e`}
          error
          output={`On branch main
You are currently cherry-picking commit b9d3f7e.
nothing to commit, working tree clean
The previous cherry-pick is now empty, possibly due to conflict resolution.

→ main already CONTAINS this change (someone merged or picked it
  before). Nothing to copy. Just:
    git cherry-pick --skip
  and verify with: git log -S "the changed code" --oneline`}
        />
      </Section>

      {/* 09 — cheat sheet */}
      <Section id="cheatsheet" number="09" title="🗂️ THE CHEAT SHEET — every command from the whole track">
        <P>
          Everything from all 9 pages, one reference. Skim the left column until it matches the
          thought in your head.
        </P>
        <P><b>⚙️ Setup & start (setup page)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git config --global user.name \"...\"", "identity on every commit"],
            ["git config --global user.email \"...\"", "match your GitHub email"],
            ["git config --global init.defaultBranch main", "new repos start on main"],
            ["git config --list --show-origin", "all settings + which file"],
            ["git init", "turn this folder into a repo (creates .git)"],
            ["git clone URL", "copy a remote repo (sets up origin)"],
            ["git clone --depth 1 URL", "shallow clone — latest only, fast"],
            ["ssh-keygen -t ed25519", "make SSH key → add .pub to GitHub"],
            ["git help <cmd> / git <cmd> -h", "full manual / quick flags"],
          ]}
        />
        <P><b>📸 Daily loop (basics page)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git status / status -s", "where am I, what changed (short form)"],
            ["git add f1 f2 / add . / add -A", "stage file(s) / everything here / everything"],
            ["git add -p", "stage hunk by hunk — y/n per change"],
            ["git commit -m \"msg\"", "snapshot the staging area"],
            ["git commit -am \"msg\"", "add all TRACKED + commit (skips new files!)"],
            ["git commit --amend --no-edit", "redo last commit (unpushed only)"],
            ["git diff / --staged / HEAD", "①vs② / ②vs③ / ①vs③ (the 3 areas)"],
            ["git log --oneline --graph --all", "the history map"],
            ["git log -p / --stat / -S \"text\"", "with diffs / file stats / pickaxe search"],
            ["git show HEAD~2 / <hash>:file", "inspect a commit / read an old file version"],
            ["git rm / rm --cached / mv", "delete / untrack-but-keep / rename"],
            ["git check-ignore -v file", "WHY is this file ignored?"],
          ]}
        />
        <P><b>🌿 Branch & merge (branches page)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git branch / -v / -a / -vv", "list / +last commit / +remotes / +tracking"],
            ["git switch -c name", "create + move (daily driver)"],
            ["git switch - ", "bounce to previous branch"],
            ["git merge name", "bring name's commits into current branch"],
            ["git merge --no-ff / --ff-only", "force merge commit / forbid it"],
            ["git merge --abort", "panic button mid-conflict"],
            ["git branch -d / -D / -m", "delete safe / force / rename"],
            ["git branch --merged", "which stickers are safe to peel"],
          ]}
        />
        <P><b>🧯 Undo (undo page)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git restore file", "file → last commit (kills edits ⚠️)"],
            ["git restore --staged file", "un-add (keeps edits ✅)"],
            ["git reset --soft HEAD~1", "un-commit, keep staged (squash trick)"],
            ["git reset HEAD~1", "un-commit + un-stage, keep edits"],
            ["git reset --hard HEAD~1", "erase commit AND edits ⚠️"],
            ["git revert <hash>", "anti-commit — the PUSHED-mistake fix"],
            ["git stash / pop / list / push -m", "pocket work / restore / inspect / name it"],
            ["git clean -n → -fd", "preview → delete untracked junk"],
            ["git reflog", "every HEAD move — the resurrection tool"],
          ]}
        />
        <P><b>☁️ Remote & GitHub (remotes + github pages)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git remote -v / add / set-url", "list / link / change remotes"],
            ["git push -u origin branch", "first push + set tracking"],
            ["git push / pull / fetch", "upload / download+merge / download only"],
            ["git pull --rebase", "replay yours on top — straight history"],
            ["git fetch --prune", "drop bookmarks of deleted remote branches"],
            ["git push origin --delete branch", "delete branch on GitHub"],
            ["git push --force-with-lease", "the ONLY acceptable force (solo branches)"],
            ["git remote add upstream URL", "fork workflow: link the original"],
            ["git fetch upstream && git merge upstream/main", "sync your fork"],
          ]}
        />
        <P><b>⚡ Power tools (this page)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git rebase main", "replay branch onto main — straight line (unpushed!)"],
            ["git rebase -i HEAD~5", "edit history: pick/reword/squash/fixup/drop"],
            ["git rebase --continue/--abort", "after conflicts / total undo"],
            ["git cherry-pick <hash>", "copy one commit's change here"],
            ["git tag -a v1.0 -m \"...\" && git push --tags", "permanent release label"],
            ["git blame file / -L 10,20", "who last touched each line / range"],
            ["git bisect start/good/bad/reset", "binary-search 500 commits in ~9 tests"],
            ["git bisect run ./test.sh", "fully automatic bug hunt"],
            ["git worktree add ../dir branch", "second folder, same repo"],
            ["git shortlog -sn / describe --tags / grep", "authors / build name / code search"],
          ]}
        />
        <P><b>🔬 Plumbing (internals page — for seeing the machine)</b></P>
        <Table
          head={["Command", "Does"]}
          rows={[
            ["git cat-file -t / -p <hash>", "object type / contents (blob, tree, commit)"],
            ["git hash-object file", "compute a content's SHA-1 address"],
            ["git ls-files -s / ls-tree HEAD", "staging area raw / a tree object"],
            ["git rev-parse HEAD / main", "resolve any name to its hash"],
            ["git count-objects -vH / gc / fsck", "object stats / compress / integrity check"],
            ["cat .git/HEAD / .git/refs/heads/main", "see for yourself: refs are text files"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "🌱 init/clone", sub: "once per project" },
            { label: "📸 add+commit", sub: "all day" },
            { label: "🌿 branch+merge", sub: "per feature" },
            { label: "☁️ push+PR", sub: "share & review" },
            { label: "🧯 undo+reflog", sub: "when needed" },
            { label: "⚡ rebase+bisect", sub: "power moves" },
          ]}
        />
        <Callout type="tip">
          That&apos;s the entire track: from <IC>final_v2_REAL.py</IC> chaos to bisecting 500
          commits in 9 steps. You&apos;ve seen <b>how Git stores everything</b> (blobs, trees,
          commits, refs), <b>every daily command</b>, and the <b>rescue for every disaster</b>.
          The last step is the one no page can do: <IC>git init</IC> something real today.
        </Callout>
      </Section>

      <MemorizeGrid
        items={[
          ["rebase", "replay commits on a new base — straight line, NEW hashes"],
          ["golden rule", "never rebase pushed/shared commits"],
          ["rebase -i", "pick/reword/squash/fixup/drop — polish before the PR"],
          ["rebase trio", "--continue / --skip / --abort (abort = full undo)"],
          ["cherry-pick <hash>", "copy ONE commit's diff to the current branch"],
          ["backport", "fix on main → cherry-pick onto the release branch"],
          ["git tag -a v1.0", "label that never moves; push --tags to publish"],
          ["git blame", "per-line: commit, author, date → git show for the WHY"],
          ["git bisect", "binary search history: 500 commits ≈ 9 tests, O(log n)"],
          ["bisect run test.sh", "git hunts the bad commit fully automatically"],
          ["rebase disaster?", "git reflog → reset --hard HEAD@{n} — always recoverable"],
          ["real life", "90% = status·add·commit·push·pull·switch·merge"],
        ]}
      />
    </TopicShell>
  );
}
