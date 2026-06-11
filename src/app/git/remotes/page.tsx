"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "picture", label: "Local ↔ remote picture" },
  { id: "remote-cmd", label: "git remote — all variants" },
  { id: "push", label: "git push & -u tracking" },
  { id: "fetch", label: "git fetch — safe download" },
  { id: "pull", label: "git pull = fetch + merge" },
  { id: "rejected", label: "Rejected push — drawn ⭐" },
  { id: "branches-remote", label: "Remote branches & sync" },
  { id: "force", label: "force push — the danger zone" },
  { id: "daily", label: "The daily sync routine" },
  { id: "exceptions", label: "💥 When sync goes wrong" },
  { id: "memorize", label: "Memorize" },
];

export default function GitRemotesPage() {
  return (
    <TopicShell
      icon="☁️"
      title="Remotes — push, pull"
      gradientWord="& fetch"
      subtitle="Until now everything lived in your .git folder. A remote is simply another copy of the repo on another machine — and three commands keep the two copies in sync."
      nav={NAV}
      next={{ icon: "🐙", label: "GitHub Workflow — PRs", href: "/git/github" }}
    >
      {/* 01 — the picture */}
      <Section id="picture" number="01" title="The big picture: two full repos, three sync commands">
        <P>
          Git is <b>distributed</b>: your laptop holds a complete repo (all commits, all
          history), and GitHub holds a complete repo. Neither is &quot;the database&quot; — they
          are equals that exchange commits. Three commands move commits between them:
        </P>
        <CodeBlock
          runnable={false}
          title="local-vs-remote.txt"
          code={`     YOUR LAPTOP                          GITHUB ("origin")
  ┌──────────────────────┐            ┌──────────────────────┐
  │ 📝 working directory │            │                      │
  │ 📦 staging area      │            │   shop-app.git       │
  │ 📸 .git (full repo)  │            │   (full repo)        │
  └──────────┬───────────┘            └──────────┬───────────┘
             │                                   │
             │   git push ────────────────────▶  │  upload my new commits
             │   ◀──────────────────── git fetch │  download their commits
             │                                   │  (look, don't touch)
             │   ◀───────────────────── git pull │  download AND merge in
             │                                   │
  add/commit/branch/merge work       GitHub adds: web UI, Pull
  100% OFFLINE — sync is a           Requests, issues, backups,
  separate, explicit step            access control (next page)`}
        />
        <Callout type="analogy">
          Think of two notebooks: yours and one in a shared locker. You write in yours all day
          (commits work offline). <IC>push</IC> = photocopy your new pages into the locker
          notebook. <IC>fetch</IC> = photocopy their new pages and put them in your bag to read.{" "}
          <IC>pull</IC> = photocopy their pages <b>and</b> glue them into your notebook.
        </Callout>
        <FlowDiagram
          steps={[
            { label: "commit", sub: "local, offline" },
            { label: "push", sub: "upload commits" },
            { label: "fetch", sub: "download info" },
            { label: "pull", sub: "download + merge" },
          ]}
        />
      </Section>

      {/* 02 — git remote */}
      <Section id="remote-cmd" number="02" title="git remote — managing the address book">
        <P>
          A &quot;remote&quot; is just a <b>saved URL with a nickname</b>. The default nickname
          is <IC>origin</IC> — nothing magical, it&apos;s simply what <IC>git clone</IC> names
          the place you cloned from. Every variant:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git remote                          # list nicknames
origin

$ git remote -v                       # list with URLs ⭐
origin	git@github.com:deelaksha/shop-app.git (fetch)
origin	git@github.com:deelaksha/shop-app.git (push)

$ git remote add origin git@github.com:deelaksha/shop-app.git
                                      # link an init'd repo to GitHub

$ git remote show origin              # full report: branches, sync status
$ git remote rename origin gh         # rename the nickname
$ git remote set-url origin NEW_URL   # repo moved / switch HTTPS→SSH
$ git remote remove old-server        # delete a nickname`}
          output={`Where does this live? It's just lines in .git/config:

  [remote "origin"]
      url = git@github.com:deelaksha/shop-app.git
      fetch = +refs/heads/*:refs/remotes/origin/*

A remote = config entry. Nothing more.`}
        />
        <Callout type="note">
          Two ways repos get connected: <b>clone</b> (GitHub first → <IC>origin</IC> set up
          automatically — setup page) or <b>init then add</b> (local first →{" "}
          <IC>git remote add origin URL</IC> by hand). You can have several remotes — e.g.{" "}
          <IC>origin</IC> (your fork) + <IC>upstream</IC> (the original project), which the
          GitHub page uses.
        </Callout>
      </Section>

      {/* 03 — push */}
      <Section id="push" number="03" title="git push — upload commits, and what -u really does">
        <P>
          <b>Scenario:</b> Deelaksha created <IC>shop-app</IC> locally with <IC>git init</IC>,
          made 3 commits, then created an empty repo on GitHub. Time for the first push:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git remote add origin git@github.com:deelaksha/shop-app.git

$ git push -u origin main             # first push: -u sets up tracking ⭐
Enumerating objects: 9, done.
Counting objects: 100% (9/9), done.
Writing objects: 100% (9/9), 1.2 KiB | 1.2 MiB/s, done.
To github.com:deelaksha/shop-app.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.

# from now on, forever:
$ git push                            # that's it — no arguments needed`}
          output={`Anatomy:  git push <remote> <branch>
                    origin   main
          "send my main branch's new commits to origin"

-u (--set-upstream) links local main ↔ origin/main ONCE.
After that, plain 'git push' / 'git pull' know where to go.`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git push origin fix-login        # push a different branch
$ git push -u origin feature-cart  # first push of a new branch (track it)
$ git push origin --delete old-exp # delete a branch ON GITHUB
$ git push --all origin            # push every local branch
$ git push --tags                  # push tags too (advanced page)
$ git push --dry-run               # rehearse: show what WOULD happen`}
        />
        <CodeBlock
          runnable={false}
          title="what-push-moves.txt"
          code={`Before push:
  LAPTOP   ──●──●──● 4e7d9a2 ◀── ● b5e8d1f ◀── ● d8f3c7b   main
  GITHUB   ──●──●──● 4e7d9a2                               main

$ git push      → uploads the two missing COMMIT OBJECTS
                  (+ their blobs & trees — internals page),
                  then moves GitHub's main sticker forward:

  LAPTOP   ──●──●──●──●──● d8f3c7b   main
  GITHUB   ──●──●──●──●──● d8f3c7b   main      ← in sync ✅

Push only works if GitHub's sticker can FAST-FORWARD to yours
(same rule as merging!). If GitHub has commits you don't → rejected
(section 06).`}
        />
      </Section>

      {/* 04 — fetch */}
      <Section id="fetch" number="04" title="git fetch — download without touching your work">
        <P>
          <IC>fetch</IC> downloads everything new from the remote and updates your{" "}
          <b>remote-tracking branches</b> (like <IC>origin/main</IC>) — bookmarks of
          &quot;where GitHub&apos;s stickers were, last time I checked.&quot; Your own
          branches and files are <b>not touched at all</b>. It&apos;s 100% safe, always.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git fetch origin
remote: Enumerating objects: 5, done.
Unpacking objects: 100% (5/5), 1.1 KiB | 1.1 MiB/s, done.
From github.com:deelaksha/shop-app
   d8f3c7b..e4a9c2d  main       -> origin/main

$ git status
Your branch is behind 'origin/main' by 2 commits,
  and can be fast-forwarded.            ← now git can TELL you this

$ git log --oneline main..origin/main   # what did they add? ⭐
e4a9c2d add product search
c3b7f1e fix image upload size limit

$ git diff main origin/main             # see the actual code changes
$ git merge origin/main                 # adopt them when YOU choose`}
          output={`fetch = "check the mailbox, stack the letters on the desk."
Nothing about YOUR branches changed. You inspect first
(log/diff), merge second. fetch + merge = a pull in slow motion.`}
        />
        <CodeBlock
          runnable={false}
          title="fetch-drawn.txt"
          code={`Before fetch:                       After fetch:
  main         ──●──● A               main         ──●──● A   ← unmoved!
  origin/main  ──●──● A  (stale)      origin/main  ──●──●──●──● C
                                                        new commits
GITHUB actually at:                                 downloaded into
  main         ──●──●──●──● C                       .git, bookmark
                                                    updated. Your files:
                                                    UNTOUCHED.`}
        />
        <Callout type="tip">
          <IC>git fetch --all</IC> checks every remote; <IC>git fetch --prune</IC> deletes your
          stale <IC>origin/*</IC> bookmarks for branches teammates deleted on GitHub. Many
          people set <IC>git config --global fetch.prune true</IC> and never think about it
          again.
        </Callout>
      </Section>

      {/* 05 — pull */}
      <Section id="pull" number="05" title="git pull — fetch + merge in one move">
        <P>
          <IC>git pull</IC> is literally two commands glued together:{" "}
          <IC>git fetch</IC> followed by <IC>git merge origin/main</IC> into your current
          branch. Everything you know about merges applies — including fast-forwards and
          conflicts.
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git pull
remote: Enumerating objects: 5, done.
From github.com:deelaksha/shop-app
   d8f3c7b..e4a9c2d  main       -> origin/main
Updating d8f3c7b..e4a9c2d
Fast-forward                          ← you had nothing new: sticker slide
 search.py | 28 ++++++++++++++++++++
 1 file changed, 28 insertions(+)`}
          output={`pull = fetch (download) + merge (into your checked-out branch).

If you HAD local commits too → it's a 3-way merge, possibly
with conflicts → exact same <<< === >>> ritual as the branches
page. A "pull conflict" is just a merge conflict.`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git pull --rebase             # replay MY commits on top of theirs
                                 # → straight-line history, no merge bubble
$ git pull --ff-only            # only pull if fast-forward; else stop

# Fresh git asks you to pick a default policy the first time:
$ git config --global pull.rebase false   # merge (default, beginner-safe)
$ git config --global pull.rebase true    # rebase (tidy history)
$ git config --global pull.ff only        # refuse non-ff pulls (strict)`}
          output={`merge pull:    ──●──●──◍   (merge bubble records the join)
                    \\    /
                     ●──●    their commits

rebase pull:   ──●──●──●'─●'  (your commits replayed on top —
                               straight line, new hashes)
Rebase mechanics → advanced page. Until then, default merge is fine.`}
        />
        <Callout type="mistake">
          <b>pull with uncommitted changes</b> in files the pull would update → Git aborts:{" "}
          <IC>error: Your local changes would be overwritten by merge</IC>. Same medicine as
          branch switching: commit or <IC>stash → pull → stash pop</IC>.
        </Callout>
      </Section>

      {/* 06 — rejected push */}
      <Section id="rejected" number="06" title="The rejected push — everyone's first remote error, drawn ⭐">
        <P>
          <b>Scenario:</b> Deelaksha and her teammate Arjun both cloned <IC>shop-app</IC> this
          morning. Arjun pushed a commit at 2pm. At 3pm Deelaksha — who doesn&apos;t have
          Arjun&apos;s commit — tries to push hers:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git push`}
          error
          output={`To github.com:deelaksha/shop-app.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'github.com:deelaksha/shop-app.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.`}
        />
        <CodeBlock
          runnable={false}
          title="why-rejected-drawn.txt"
          code={`               ┌── ● a7c3e9f (Arjun's 2pm commit)
GITHUB   ──●──●┘
               └── ● f9d2b4e (Deelaksha's commit — only on her laptop)
LAPTOP   ──●──●┘

If GitHub accepted her push, its sticker would jump to f9d2b4e
and Arjun's a7c3e9f would fall off history — DATA LOSS.
So git refuses: "the remote contains work that you do not have."

THE FIX — pull (merge his + yours), then push:

$ git pull               → fetch a7c3e9f, 3-way merge with f9d2b4e
GITHUB   ──●──●── a7c3e9f ──◍ m3e8c1a    after push: both commits
LAPTOP   ──●──●─┬ a7c3e9f ─┬─◍ m3e8c1a   + a merge commit. Nobody's
                └ f9d2b4e ─┘             work lost. ✅`}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git pull                      # download + merge Arjun's work
Merge made by the 'ort' strategy.
$ git push                      # now GitHub can fast-forward ✅
To github.com:deelaksha/shop-app.git
   a7c3e9f..m3e8c1a  main -> main`}
          output={`The eternal rhythm of teamwork:
    rejected push → pull → (resolve conflicts if any) → push
You will do this hundreds of times. It's normal, not an error
in your workflow — it just means a teammate was faster today.`}
        />
      </Section>

      {/* 07 — remote branches */}
      <Section id="branches-remote" number="07" title="Remote-tracking branches — origin/* explained">
        <P>
          After fetching, your repo holds <b>three kinds</b> of branch pointers. Confusing them
          causes most remote headaches, so here&apos;s the lineup:
        </P>
        <Table
          head={["Pointer", "Lives", "Moves when...", "You can commit on it?"]}
          rows={[
            ["main", "your laptop (.git/refs/heads/)", "YOU commit", "✅ yes"],
            ["origin/main", "your laptop (.git/refs/remotes/)", "you fetch/pull/push", "❌ read-only bookmark"],
            ["main on GitHub", "GitHub's servers", "anyone pushes", "❌ only via push"],
          ]}
        />
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git branch -a                     # all three kinds at once
* main
  feature-cart
  remotes/origin/main
  remotes/origin/feature-search     ← Arjun pushed this branch

# Work on a teammate's branch: one command does everything
$ git switch feature-search
branch 'feature-search' set up to track 'origin/feature-search'.
Switched to a new branch 'feature-search'

$ git branch -vv                    # show tracking links + ahead/behind ⭐
* feature-search a1b2c3d [origin/feature-search] add search bar
  main           m3e8c1a [origin/main: ahead 1] merge arjun's work
  feature-cart   9f1c3b5             ← no [..] = not tracking anything`}
          output={`'ahead 1'  = you have 1 commit to push
'behind 2' = run git pull
'ahead 1, behind 2' = both — pull first, then push.
git status says the same thing in words.`}
        />
        <Callout type="behind">
          <IC>origin/main</IC> is itself just a file —{" "}
          <IC>.git/refs/remotes/origin/main</IC>, one hash line, exactly like a local branch
          (internals page). The only difference: <b>git moves it for you</b> during
          fetch/push, and refuses to let you commit on it directly.
        </Callout>
      </Section>

      {/* 08 — force push */}
      <Section id="force" number="08" title="git push --force — the danger zone, handled responsibly">
        <P>
          Sometimes you <b>meant</b> to rewrite history — you amended or rebased commits on{" "}
          <b>your own feature branch</b> that you&apos;d already pushed. Now push is rejected
          (your history legitimately disagrees with GitHub&apos;s). Force push says
          &quot;GitHub, take MY version, discard yours&quot;:
        </P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`# ❌ the blunt hammer — overwrites NO MATTER WHAT:
$ git push --force

# ✅ the safe(r) version — ALWAYS prefer this:
$ git push --force-with-lease
To github.com:deelaksha/shop-app.git
 + 3c9d7f2...9a4c2e7 feature-cart -> feature-cart (forced update)`}
          output={`--force-with-lease = "overwrite ONLY IF the remote is still
where I last saw it." If a teammate pushed meanwhile, it refuses —
protecting their work. Plain --force overwrites blindly.

Rules of force pushing:
  ✅ your own feature branch nobody else uses    → fine
  ❌ main / any shared branch                    → never
(GitHub repos usually enable "branch protection" to make
 force-pushing main physically impossible.)`}
        />
        <Callout type="mistake">
          If you&apos;re force-pushing to <b>fix a mistake on main</b>, stop — that&apos;s what{" "}
          <IC>git revert</IC> is for (undo page). Force push on shared branches deletes
          teammates&apos; commits from the remote, and their next pull becomes a mess.
        </Callout>
      </Section>

      {/* 09 — daily routine */}
      <Section id="daily" number="09" title="The daily sync routine — every command in order">
        <CodeBlock
          runnable={false}
          title="terminal — a normal team day"
          code={`# ── morning ──────────────────────────────────────────
$ git switch main
$ git pull                          # start in sync with the team
$ git switch -c feature-reviews     # today's work, own branch

# ── during the day ───────────────────────────────────
$ git add . && git commit -m "add review model"
$ git commit -am "render stars on product page"
$ git push -u origin feature-reviews    # backup + visible to team
$ git push                              # after each commit batch

# ── before merging / end of day ──────────────────────
$ git switch main && git pull           # main moved? get latest
$ git switch feature-reviews
$ git merge main                        # bring main INTO your branch:
                                        # resolve conflicts HERE, not on main
$ git push                              # branch is now conflict-free
# → open a Pull Request on GitHub      (next page!)`}
          output={`Two habits that prevent 90% of remote pain:
  1. pull main every morning — small frequent syncs,
     small frequent conflicts (easy), never a monster merge.
  2. push your branch daily — laptop dies? work's on GitHub.`}
        />
        <FlowDiagram
          steps={[
            { label: "pull main", sub: "morning sync" },
            { label: "branch", sub: "own lane" },
            { label: "commit + push", sub: "all day" },
            { label: "merge main in", sub: "stay current" },
            { label: "PR", sub: "next page" },
          ]}
        />
      </Section>

      {/* 10 — exceptions */}
      <Section id="exceptions" number="10" title="💥 When sync goes wrong">
        <P><b>Case 1: push with no upstream set.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git switch -c feature-reviews
$ git push`}
          error
          output={`fatal: The current branch feature-reviews has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature-reviews

→ New local branch — GitHub has never heard of it. Git even prints
  the fix. Run it once (-u is the short form); afterwards plain
  'git push' works. Want this automated forever?
  git config --global push.autoSetupRemote true`}
        />
        <P><b>Case 2: divergent branches warning on pull.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git pull`}
          error
          output={`hint: You have divergent branches and need to specify how to reconcile them.
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
fatal: Need to specify how to reconcile divergent branches.

→ Both you AND GitHub have new commits, and you never told git
  your pull policy. One-time fix (the beginner-safe choice):
    git config --global pull.rebase false
  Then 'git pull' again → normal merge.`}
        />
        <P><b>Case 3: clone/push auth failures.</b></P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git push`}
          error
          output={`git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

→ SSH key checklist (setup page): key exists? added to GitHub?
  test with: ssh -T git@github.com

Or over HTTPS:
remote: Support for password authentication was removed on August 13, 2021.
→ GitHub doesn't accept account passwords — you need a Personal
  Access Token (Settings → Developer settings) or, easier, switch
  the remote to SSH:
  git remote set-url origin git@github.com:deelaksha/shop-app.git`}
        />
        <P><b>Case 4: pulled into the wrong branch.</b> You meant to pull main but were standing on <IC>feature-cart</IC> — now there&apos;s a surprise merge commit.</P>
        <CodeBlock
          runnable={false}
          title="terminal"
          code={`$ git log --oneline -1
9e2c7b1 (HEAD -> feature-cart) Merge branch 'main' into feature-cart  😬

# Just merged, nothing else done since → rewind the sticker:
$ git reset --hard HEAD~1          # undo page move; merge commit gone
# (reflog has your back if you rewind too far)`}
        />
        <Callout type="tip">
          Meta-lesson: almost every remote &quot;error&quot; is Git <b>refusing to lose
          someone&apos;s commits</b> — yours or a teammate&apos;s — and the hint text literally
          contains the fix. Read the hints; they&apos;re the best error messages in all of
          software.
        </Callout>
      </Section>

      <MemorizeGrid
        items={[
          ["remote =", "saved URL with a nickname; origin = default name from clone"],
          ["git remote -v", "list remotes with URLs — first debug step always"],
          ["git push -u origin main", "first push: upload + link local↔remote tracking"],
          ["git fetch", "download + update origin/* bookmarks; NEVER touches your work"],
          ["git pull", "fetch + merge into current branch (conflicts possible)"],
          ["pull --rebase", "fetch + replay your commits on top — straight history"],
          ["rejected push", "remote has commits you lack → pull, then push"],
          ["origin/main", "read-only local bookmark of GitHub's main (moves on fetch)"],
          ["git branch -vv", "see tracking + ahead/behind counts per branch"],
          ["--force-with-lease", "the only acceptable force push (own branches only)"],
          ["daily rhythm", "morning pull → branch → commit+push all day → merge main in"],
          ["auth errors", "ssh -T git@github.com to test; HTTPS needs a token, not password"],
        ]}
      />
    </TopicShell>
  );
}
