"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What GitHub adds" },
  { id: "pr", label: "Pull Request = ask + review" },
  { id: "story", label: "Full 2-person story ⭐" },
  { id: "review", label: "Code review round" },
  { id: "merge-buttons", label: "The 3 merge buttons" },
  { id: "after", label: "After the merge — sync" },
  { id: "fork", label: "Fork — contributing to strangers" },
  { id: "upstream", label: "Keeping a fork fresh" },
  { id: "extras", label: "Issues, README, clone tricks" },
  { id: "exceptions", label: "💥 PR problems" },
  { id: "memorize", label: "Memorize" },
];

export default function GitHubPage() {
  return (
    <TopicShell
      icon="🐙"
      title="The GitHub"
      gradientWord="Workflow"
      subtitle="Fork → clone → branch → push → Pull Request → review → merge. The complete two-person story, every command and every button, end to end."
      nav={NAV}
      next={{ icon: "⚡", label: "Advanced + Cheat Sheet", href: "/git/advanced" }}
    >
      {/* 01 — what github adds */}
      <Section id="what" number="01" title="What GitHub adds on top of git">
        <P>
          Everything so far was the <IC>git</IC> program. GitHub is a website that hosts repos
          and wraps them in <b>collaboration tools</b>. The big ones:
        </P>
        <Table
          head={["Feature", "What it is", "Replaces"]}
          rows={[
            ["Hosting", "your repo, backed up, always online", "USB sticks, 'my laptop died'"],
            ["Pull Requests ⭐", "「please merge my branch」+ discussion + review", "emailing zip files"],
            ["Code review", "line-by-line comments before code lands", "「just push it, hope it works」"],
            ["Issues", "bug reports & todo list attached to the repo", "sticky notes, lost emails"],
            ["Forks", "your own server-side copy of anyone's repo", "asking strangers for push access"],
            ["Actions (CI)", "auto-run tests on every push/PR", "「works on my machine」"],
            ["Branch protection", "main can't be pushed directly — PRs only", "accidental main breakage"],
          ]}
        />
        <Callout type="analogy">
          git = the camera (takes snapshots). GitHub = the shared photo album with comments,
          albums-within-albums, and a doorbell — friends propose photos, you approve which ones
          go in. GitLab and Bitbucket are competing albums; the camera is the same.
        </Callout>
      </Section>

      {/* 02 — PR concept */}
      <Section id="pr" number="02" title="The Pull Request — the idea in one diagram">
        <P>
          On a team, nobody merges into <IC>main</IC> on their laptop. Instead you push your
          branch and open a <b>Pull Request (PR)</b>: &quot;I request that you <b>pull</b> my
          branch into main.&quot; The merge then happens <b>on GitHub</b>, after review:
        </P>
        <CodeBlock
          runnable={false}
          title="pull-request.txt"
          code={`LOCAL MERGE (solo projects):          PULL REQUEST (teams):

you, on your laptop:                  you:    push feature branch ──┐
  git switch main                                                   ▼
  git merge feature   ← no witnesses  GITHUB: ┌────────────────────────┐
                                              │ PR #42: add reviews    │
                                              │ feature-reviews → main │
                                              │ +183 −12 · 3 commits   │
                                              │ 💬 review comments     │
                                              │ ✅ tests passed (CI)    │
                                              │ [ Merge pull request ] │
                                              └────────────────────────┘
                                      teammate reviews → approves →
                                      ANYONE clicks merge → main updated
                                      ON GITHUB, with a public record.`}
        />
        <P>
          A PR is <b>not a git concept</b> — there&apos;s no <IC>git pull-request</IC> command.
          It&apos;s a GitHub feature built around a branch you pushed. The PR shows the diff,
          hosts the discussion, runs the tests, and provides the merge button.
        </P>
        <Callout type="behind">
          A PR compares <b>branches, not frozen code</b>: it always shows{" "}
          <IC>main...your-branch</IC> live. Push more commits to the same branch → the open PR
          updates automatically. That&apos;s how you respond to review feedback (section 04).
        </Callout>
      </Section>

      {/* 03 — the full story */}
      <Section id="story" number="03" title="The full story: Deelaksha & Arjun ship a feature ⭐">
        <P>
          One feature, two people, every command and click, start to finish. Setup: both have
          push access to <IC>github.com/deelaksha/shop-app</IC>; main is protected (PRs only).
        </P>
        <CodeBlock
          runnable={false}
          title="terminal — Deelaksha, Monday 10:00"
          code={`$ git switch main && git pull          # 1. start fresh
Already up to date.

$ git switch -c feature-reviews        # 2. own branch for the work
Switched to a new branch 'feature-reviews'

# ... codes for two hours ...
$ git add reviews.py
$ git commit -m "add Review model and star rating"
$ git add templates/product.html
$ git commit -m "render review list on product page"

$ git push -u origin feature-reviews   # 3. branch goes to GitHub
 * [new branch]      feature-reviews -> feature-reviews
branch 'feature-reviews' set up to track 'origin/feature-reviews'.`}
          output={`GitHub notices the new branch and even prints a shortcut link:

remote: Create a pull request for 'feature-reviews' on GitHub by visiting:
remote:   https://github.com/deelaksha/shop-app/pull/new/feature-reviews`}
        />
        <CodeBlock
          runnable={false}
          title="github.com — Deelaksha, 12:10 (browser)"
          code={`4. Open the repo → yellow banner:
   「feature-reviews had recent pushes — [Compare & pull request]」

5. The PR form:
   base: main  ◀──  compare: feature-reviews     ← direction of merge!

   Title:  Add product reviews with star ratings
   Body:   ## What
           - Review model (stars 1–5 + text)
           - Reviews shown on product page
           ## How to test
           - open any product → leave a review
           Closes #17                ← auto-closes that issue on merge!

6. Reviewers: select 「arjun」  →  [Create pull request]
   → PR #42 is born. Arjun gets a notification.`}
        />
        <FlowDiagram
          steps={[
            { label: "pull main", sub: "fresh start" },
            { label: "branch", sub: "feature-reviews" },
            { label: "commit ×2", sub: "the work" },
            { label: "push -u", sub: "to GitHub" },
            { label: "open PR", sub: "#42, ask review" },
          ]}
        />
      </Section>

      {/* 04 — review round */}
      <Section id="review" number="04" title="The review round — feedback, fix, push again">
        <CodeBlock
          runnable={false}
          title="github.com — Arjun reviews, 14:30"
          code={`Arjun opens PR #42 → 「Files changed」 tab → reads the diff.
Hovers line 23 of reviews.py → [+] → leaves a comment:

  💬 "stars = int(request.form['stars']) — this crashes
      with a 500 if stars is missing. Validate it?"

Then clicks  [Review changes] → ● Request changes → Submit.

PR #42 now shows:  🔴 arjun requested changes`}
        />
        <CodeBlock
          runnable={false}
          title="terminal — Deelaksha responds, 15:00"
          code={`# Still on (or back on) the branch — fix the issue:
$ git switch feature-reviews
# ... adds validation ...
$ git add reviews.py
$ git commit -m "validate star rating input (1-5, required)"
$ git push                            # plain push — tracking already set`}
          output={`That push lands in the OPEN PR automatically:
PR #42 now shows 3 commits, the diff is updated,
and Arjun gets pinged. No new PR. No magic command.

THE LOOP:  review comment → local fix → commit → push → repeat
until the reviewer clicks  ✅ Approve.`}
        />
        <Table
          head={["Review verdict", "Meaning"]}
          rows={[
            ["💬 Comment", "thoughts, no judgement — merge not blocked"],
            ["✅ Approve", "「good to go」 — merge unlocked"],
            ["🔴 Request changes", "「fix these first」 — merge blocked until re-review"],
          ]}
        />
        <Callout type="tip">
          Reviewing well is a skill: comment on the <b>code, never the person</b>{" "}
          (&quot;this function could…&quot; not &quot;you always…&quot;), ask questions instead
          of issuing orders, and approve enthusiastically when it&apos;s good. PRs are where
          teams teach each other.
        </Callout>
      </Section>

      {/* 05 — merge buttons */}
      <Section id="merge-buttons" number="05" title="The 3 merge buttons — what each really does">
        <CodeBlock
          runnable={false}
          title="github.com — Arjun approves, 16:00"
          code={`Arjun:  [Review changes] → ✅ Approve → "nice, ship it"
PR #42:  ✅ arjun approved   ✅ All checks have passed

The green button has a dropdown — three different merges:
  [ Merge pull request          ▾ ]
    ├─ Create a merge commit
    ├─ Squash and merge
    └─ Rebase and merge`}
        />
        <CodeBlock
          runnable={false}
          title="three-buttons-drawn.txt"
          code={`branch: 3 commits (A, B, C) → what lands on main?

① MERGE COMMIT          ──●──────────◍ merge        keeps all 3 commits
   (plain git merge)         \\ A─B─C /               + a merge bubble;
                                                     full true history

② SQUASH AND MERGE ⭐    ──●──● S                    A+B+C melted into
                                                     ONE clean commit S;
                                                     main = tidy list of
                                                     features. Most teams.

③ REBASE AND MERGE      ──●──A'─B'─C'                3 commits replayed
                                                     on top, no bubble;
                                                     straight line, new
                                                     hashes (advanced pg)`}
        />
        <CodeBlock
          runnable={false}
          title="github.com — merged!"
          code={`Arjun picks 「Squash and merge」 → confirm.

  🟣 Merged   PR #42: Add product reviews with star ratings
  「feature-reviews」 branch → [Delete branch]   ← click it. Always.

main on GitHub now has ONE new commit:
  e8d4f2a  Add product reviews with star ratings (#42)
                                                  ▲
                          PR number in the message — forever clickable
                          back to the discussion, review, and reasons.`}
        />
        <Callout type="behind">
          That <IC>(#42)</IC> suffix is gold years later: <IC>git log</IC> shows you{" "}
          <b>what</b> changed, but clicking through to the PR shows you <b>why</b> — the
          discussion, alternatives considered, who approved. Write PR descriptions for your
          future self.
        </Callout>
      </Section>

      {/* 06 — after the merge */}
      <Section id="after" number="06" title="After the merge — everyone resyncs">
        <CodeBlock
          runnable={false}
          title="terminal — both of them, 16:05"
          code={`$ git switch main
$ git pull                                # the squashed commit arrives
Updating m3e8c1a..e8d4f2a
Fast-forward
 reviews.py             | 84 ++++++++++++++
 templates/product.html | 31 ++++++

$ git branch -d feature-reviews           # local sticker: done with it
Deleted branch feature-reviews (was 7c2e9a1).

$ git fetch --prune                       # forget deleted GitHub branches
From github.com:deelaksha/shop-app
 - [deleted]         (none)     -> origin/feature-reviews`}
          output={`The full circle, one feature's life:
  branch → commits → push → PR → review → fix → approve
  → squash-merge → delete branch → pull → next feature.

This loop IS professional software development. Teams of 5 and
teams of 5,000 run this exact cycle, thousands of times a day.`}
        />
        <Callout type="note">
          With <b>squash</b> merges, <IC>git branch -d</IC> may complain the branch is
          &quot;not fully merged&quot; — technically true, since the squashed commit has a
          different hash than your A/B/C. The work IS on main; <IC>-D</IC> is safe here.
        </Callout>
      </Section>

      {/* 07 — fork */}
      <Section id="fork" number="07" title="Fork — contributing to a repo you can't push to">
        <P>
          The flow above assumed push access. But how do you contribute to{" "}
          <b>someone else&apos;s</b> project — an open-source library used by millions? You
          can&apos;t push to their repo. Enter the <b>fork</b>: your own server-side copy on
          GitHub, where you CAN push:
        </P>
        <CodeBlock
          runnable={false}
          title="fork-flow.txt"
          code={`  ① FORK (button on GitHub)
  github.com/python-corp/requests  ──▶  github.com/deelaksha/requests
        "upstream" (theirs,                 "origin" (yours,
         read-only for you)                  full push access)
                                                  │
  ② CLONE your fork                               ▼
                                            your laptop
  ③ branch → commit → push  ──▶  goes to YOUR fork
  ④ PR  FROM deelaksha/requests:fix-timeout
      TO  python-corp/requests:main        ← cross-repo PR!
  ⑤ their maintainers review & merge — your code is in the library 🎉`}
        />
        <CodeBlock
          runnable={false}
          title="terminal — the whole contribution"
          code={`# ① click "Fork" on github.com/python-corp/requests
# ② clone YOUR copy:
$ git clone git@github.com:deelaksha/requests.git
$ cd requests

# link the ORIGINAL too, for staying up to date:
$ git remote add upstream https://github.com/python-corp/requests.git
$ git remote -v
origin    git@github.com:deelaksha/requests.git (fetch/push)
upstream  https://github.com/python-corp/requests.git (fetch/push)

# ③ normal loop, pushed to YOUR fork:
$ git switch -c fix-timeout-docs
$ git add docs/timeouts.md && git commit -m "fix timeout example in docs"
$ git push -u origin fix-timeout-docs

# ④ GitHub auto-detects the fork → "Compare & pull request"
#    base: python-corp/requests main ◀ compare: deelaksha/requests fix-timeout-docs`}
          output={`Two remotes, two jobs:
  origin   = your fork     → where you PUSH
  upstream = the original  → where you FETCH updates from

This is how all open source works. Your first merged PR —
even a typo fix — is a real contribution with your name on it.`}
        />
      </Section>

      {/* 08 — keeping fork fresh */}
      <Section id="upstream" number="08" title="Keeping a fork fresh — syncing with upstream">
        <P>
          The original project moves fast; your fork doesn&apos;t move at all by itself. Before
          starting any new branch, sync your main with theirs:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch main
$ git fetch upstream                  # download the original's commits
From https://github.com/python-corp/requests
   ab12cd3..ef45ab6  main       -> upstream/main

$ git merge upstream/main             # fast-forward your main
Updating ab12cd3..ef45ab6
Fast-forward

$ git push                            # update YOUR fork on GitHub too`}
          output={`fetch upstream → merge upstream/main → push origin.
Three commands, run before every new feature branch.

(Shortcut: GitHub's fork page also has a "Sync fork" button
that does the same server-side.)`}
        />
        <Callout type="mistake">
          Branching off a <b>stale</b> fork main is the classic fork mistake — your PR arrives
          months out of date and full of conflicts. Sync first, branch second, every time.
        </Callout>
      </Section>

      {/* 09 — extras */}
      <Section id="extras" number="09" title="The supporting cast — issues, README, .github">
        <Table
          head={["Thing", "What it does", "Pro detail"]}
          rows={[
            ["Issues", "bug reports / feature requests, numbered like PRs", "「Closes #17」 in a PR body auto-closes it on merge"],
            ["README.md", "repo front page, rendered Markdown", "what it is, how to install, how to run — minimum bar"],
            [".gitignore", "committed ignore rules (basics page)", "github.com/github/gitignore has templates per language"],
            ["LICENSE", "what others may legally do with your code", "no license = all rights reserved = unusable by others"],
            ["CONTRIBUTING.md", "house rules for PRs", "read it BEFORE your first PR to any project"],
            ["Releases / tags", "versioned snapshots (v1.0, v2.1)", "git tag — advanced page"],
            ["GitHub Actions", "CI: auto-run tests on each push/PR", "the ✅/❌ checks you saw on PR #42"],
          ]}
        />
        <CodeBlock
          runnable={false}
          title="terminal — clone tricks worth knowing"
          code={`$ git clone URL my-folder-name        # choose the folder name
$ git clone --depth 1 URL             # shallow: latest snapshot only (fast)
$ git clone -b develop URL            # start on a specific branch
$ gh repo clone deelaksha/shop-app    # GitHub's official CLI ('gh') —
$ gh pr create --fill                 #   PRs from the terminal, if you
$ gh pr checkout 42                   #   ever want to skip the browser`}
        />
      </Section>

      {/* 10 — exceptions */}
      <Section id="exceptions" number="10" title="💥 PR problems and their fixes">
        <P><b>Case 1: 「This branch has conflicts that must be resolved」.</b> Main moved while your PR sat open, and it touched your lines. GitHub can&apos;t auto-merge — you resolve it locally:</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch main && git pull          # get the new main
$ git switch feature-reviews
$ git merge main                       # bring main INTO your branch
Auto-merging reviews.py
CONFLICT (content): Merge conflict in reviews.py
# ... the <<< === >>> ritual from the branches page ...
$ git add reviews.py && git commit
$ git push                             # PR turns green: "able to merge" ✅`}
        />
        <P><b>Case 2: opened the PR in the wrong direction.</b> <IC>base</IC> and <IC>compare</IC> swapped — the diff looks insane (it&apos;s trying to REMOVE your feature). Close the PR, reopen with <IC>base: main ← compare: your-branch</IC>. Direction reads: &quot;merge compare <b>into</b> base.&quot;</P>
        <P><b>Case 3: pushed to main directly — rejected by branch protection.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git push`}
          error
          output={`remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
 ! [remote rejected] main -> main (protected branch hook declined)

→ The team's rule, enforced by robots. Move your commit to a branch:
   git branch feature-thing      (sticker on your commit)
   git reset --hard origin/main  (your main = GitHub's main again)
   git switch feature-thing && git push -u origin feature-thing
   → open a PR like everyone else 😄`}
        />
        <P><b>Case 4: committed to your fork&apos;s main instead of a branch.</b> Same rescue as &quot;wrong branch&quot; (undo page): <IC>git branch fix-stuff</IC> → <IC>git reset --hard upstream/main</IC> → <IC>git switch fix-stuff</IC> → push and PR from there. Fork mains should stay identical to upstream — treat them as read-only mirrors.</P>
        <Callout type="tip">
          PR etiquette that gets PRs merged: keep them <b>small</b> (one topic, &lt;400 lines —
          reviewers are human), write the &quot;why&quot; in the description, respond to every
          comment (even just 👍 / &quot;done&quot;), and never take review feedback personally —
          it&apos;s the code being reviewed, not you.
        </Callout>
      </Section>

      <MemorizeGrid
        items={[
          ["Pull Request", "「please merge my pushed branch into main」+ review + record"],
          ["the team loop", "pull main → branch → commit → push -u → PR → review → merge"],
          ["respond to review", "fix locally → commit → push — the open PR updates itself"],
          ["3 merge buttons", "merge commit (full history) · squash ⭐ (1 clean commit) · rebase (straight line)"],
          ["Closes #17", "in a PR body — merging the PR auto-closes issue 17"],
          ["after merge", "switch main → pull → branch -d → fetch --prune"],
          ["fork", "server-side copy of a stranger's repo that YOU can push to"],
          ["origin vs upstream", "origin = your fork (push); upstream = original (fetch)"],
          ["sync a fork", "fetch upstream → merge upstream/main → push origin"],
          ["PR conflicts", "merge main into YOUR branch locally, resolve, push"],
          ["protected main", "no direct pushes — PRs only; robots enforce it"],
          ["PR etiquette", "small PRs, explain why, answer every comment"],
        ]}
      />
    </TopicShell>
  );
}
