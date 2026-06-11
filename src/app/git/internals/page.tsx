"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "hash", label: "SHA-1 — Content Fingerprints ⭐" },
  { id: "objects", label: "The Object Database" },
  { id: "blob", label: "Blob — File Content" },
  { id: "tree", label: "Tree — Folder Snapshot" },
  { id: "commit-obj", label: "Commit Object ⭐" },
  { id: "full-picture", label: "One Commit, Fully Drawn ⭐" },
  { id: "dedup", label: "Why Snapshots Are Cheap" },
  { id: "head-refs", label: "HEAD, Branches & refs ⭐" },
  { id: "plumbing", label: "Inspect It Yourself" },
  { id: "exceptions", label: "💥 Corruptions & Confusions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GitInternalsPage() {
  return (
    <TopicShell
      icon="🧬"
      title="How Git Stores — .git Internals"
      gradientWord="Internals"
      subtitle="Open the hood: Git is a tiny database of 3 object types (blob, tree, commit) named by content hashes, plus a few text files pointing at them. Once you SEE this, commands stop being spells and become obvious moves."
      nav={NAV}
      next={{ icon: "📸", label: "status · add · commit · log", href: "/git/basics" }}
    >
      {/* 01 ─ HASH */}
      <Section id="hash" number="01" title="SHA-1 — Everything Is Named by Its Fingerprint ⭐">
        <P>
          Git&apos;s one foundational trick: it names every piece of data by the{" "}
          <strong>hash of its content</strong> — a 40-character fingerprint computed with SHA-1.
          Same content → same name, always. Different content → wildly different name:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# ask git to hash some content (this is the exact function it uses):
$ echo "hello" | git hash-object --stdin
$ echo "hello" | git hash-object --stdin     # same content again
$ echo "hello!" | git hash-object --stdin    # ONE character added`}
          output={`ce013625030ba8dba906f756967f9e9ca394464a
ce013625030ba8dba906f756967f9e9ca394464a   ← identical. deterministic.
6ad36e551cb16fa472350b25a85b1adfa54cdde8   ← tiny change, totally new name

content IS the address. Git never asks "where is this file stored?"
— it computes WHERE from WHAT.`}
        />
        <CodeBlock
          title="hash_consequences.txt"
          runnable={false}
          code={`naming by content-hash gives git superpowers for free:

  1. DEDUPLICATION   same file in 100 commits → same hash → stored ONCE
  2. INTEGRITY       one flipped bit anywhere → hash mismatch → git screams
                     (history is tamper-evident: changing an old commit
                      changes its hash, which changes every later hash) 🔒
  3. SPEED           "are these identical?" = compare 2 hashes, not 2 files
  4. DISTRIBUTION    your f3a9c21 and my f3a9c21 are PROVABLY the same
                     commit — no central server needed to agree`}
        />
        <Callout type="behind">
          This idea has a name — <strong>content-addressable storage</strong> — and it&apos;s the
          same trick behind dict keys hashing in Python (Big-O page!) and BitTorrent/IPFS. Everyone
          abbreviates the 40 chars to the first 7 (<IC>f3a9c21</IC>); git accepts any unique prefix.
        </Callout>
      </Section>

      {/* 02 ─ OBJECTS */}
      <Section id="objects" number="02" title="The Object Database — .git/objects">
        <P>
          Remember <IC>.git/objects/</IC> from the init page? That folder is a tiny key-value
          database: <strong>key = hash, value = compressed content</strong>. And it holds only{" "}
          <strong>three types of object</strong>:
        </P>
        <CodeBlock
          title="object_zoo.txt"
          runnable={false}
          code={`THE ENTIRE GIT DATA MODEL — 3 object types. That's all. ⭐

  🟦 BLOB     file CONTENT (just the bytes — no filename, no path!)
  🟩 TREE     one FOLDER: a list of (name → blob/tree hash) entries
  🟨 COMMIT   one SNAPSHOT: points at a tree + parent commit + author + message

how they stack:

  🟨 commit ──▶ 🟩 tree (project root) ──▶ 🟦 blob  app.py's content
                       │                └▶ 🟦 blob  README's content
                       └───────▶ 🟩 tree (src/) ──▶ 🟦 blob  utils.py's content

storage on disk — hash split as folder/file:
  hash ce013625030b...  →  .git/objects/ce/013625030ba8dba906f75...
                                         ▲▲ first 2 chars = subfolder`}
        />
        <Callout type="analogy">
          🍱 A commit is a <strong>bento box photo</strong>: the commit object is the label (date,
          chef, note), the tree is the box layout (which compartment holds what), the blobs are the
          actual food. Two photos of the same rice compartment? The rice is stored once.
        </Callout>
      </Section>

      {/* 03 ─ BLOB */}
      <Section id="blob" number="03" title="🟦 Blob — File Content, Nothing Else">
        <P>
          A blob is the raw bytes of one file, compressed. Crucially:{" "}
          <strong>no filename, no permissions, no path</strong> — pure content:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ echo "print('hi shop')" > app.py
$ git add app.py                      # add creates the blob immediately!

# find it and look inside (cat-file = git's x-ray machine):
$ git cat-file -t 7f8b2a1            # -t: what TYPE is this object?
$ git cat-file -p 7f8b2a1            # -p: pretty-print its content`}
          output={`$ git cat-file -t 7f8b2a1
blob

$ git cat-file -p 7f8b2a1
print('hi shop')

That's the whole object. Where's the name "app.py"?
NOT HERE — names live one level up, in the tree. ⭐`}
        />
        <CodeBlock
          title="blob_no_name.txt"
          runnable={false}
          code={`why blobs are nameless — the payoff:

  app.py        ┐
  backup/app.py ├──▶  identical content ──▶  ONE blob 🟦 7f8b2a1
  old_app.py    ┘

  rename app.py → main.py?  content unchanged → SAME blob.
  git stores a rename as "tree now maps a different name to the
  same hash" — practically free. 1000 copies of one file = 1 blob.`}
        />
      </Section>

      {/* 04 ─ TREE */}
      <Section id="tree" number="04" title="🟩 Tree — A Folder, As a Table of Pointers">
        <P>
          A tree object is one folder&apos;s listing: each line maps a <strong>name</strong> to a
          blob (file) or another tree (subfolder). This is where filenames live:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# project:    app.py, README.md, src/utils.py   — committed.
# print the ROOT tree of the latest commit:
$ git cat-file -p HEAD^{tree}`}
          output={`100644 blob 7f8b2a1d4e6c8a0b2f4d6e8a0c2e4f6a8b0d2e4f    app.py
100644 blob 9c1d3e5f7a9b1d3f5e7a9c1e3f5a7b9d1f3e5a7c    README.md
040000 tree 4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c    src
  ▲      ▲                    ▲                          ▲
 mode   type                hash                       name ⭐

and the src tree, one level down:
$ git cat-file -p 4a6c8e0
100644 blob 2e4f6a8c0b2d4e6f8a0c2e4f6b8d0a2c4e6f8b0d    utils.py`}
        />
        <CodeBlock
          title="tree_drawn.txt"
          runnable={false}
          code={`            🟩 root tree 1b7e3c9
            ┌──────────────────────────────┐
            │ app.py    → 🟦 7f8b2a1        │
            │ README.md → 🟦 9c1d3e5        │
            │ src/      → 🟩 4a6c8e0 ───────┼────┐
            └──────────────────────────────┘    │
                                                ▼
                                    🟩 src tree 4a6c8e0
                                    ┌──────────────────────┐
                                    │ utils.py → 🟦 2e4f6a8 │
                                    └──────────────────────┘

a tree of trees of blobs = your whole folder structure, frozen.
Recognize the shape? It's the TREES page from the DSA track — for real. 🌳`}
        />
        <Callout type="behind">
          The tree&apos;s own hash is computed from its entries — so if{" "}
          <IC>utils.py</IC> changes, the src tree&apos;s hash changes, which changes the root
          tree&apos;s hash, which changes the commit&apos;s hash. One edited byte ripples all the
          way up: that&apos;s the tamper-evidence from section 01, mechanically explained.
        </Callout>
      </Section>

      {/* 05 ─ COMMIT OBJ */}
      <Section id="commit-obj" number="05" title="🟨 Commit — Five Lines of Text ⭐">
        <P>
          The famous &quot;commit&quot; is embarrassingly small — a few lines pointing at a root
          tree and the previous commit:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ git cat-file -p HEAD          # x-ray the latest commit`}
          output={`tree 1b7e3c9d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e
parent 8d2e4b7a9c1f3e5d7b9a1c3f5e7d9b1a3c5f7e9d
author Deelaksha <deelaksha@example.com> 1781161200 +0530
committer Deelaksha <deelaksha@example.com> 1781161200 +0530

add login form

read it line by line:
  tree    → THE snapshot (root folder, → everything, section 04)
  parent  → the commit before this one  ⭐ THIS LINK CREATES "HISTORY"
  author  → who wrote it + when (the config you set on the Setup page!)
  message → why this snapshot exists

That's a commit. Five lines. The first commit has no parent line;
a merge commit has TWO parent lines (Branches page).`}
        />
        <CodeBlock
          title="history_is_a_linked_list.txt"
          runnable={false}
          code={`each commit points at its PARENT — history is literally a linked list:

  🟨 c3 "add login"          🟨 c2 "fix navbar"         🟨 c1 "start"
  ┌──────────────┐  parent   ┌──────────────┐  parent   ┌──────────────┐
  │ tree → 🟩 v3 │ ────────▶ │ tree → 🟩 v2 │ ────────▶ │ tree → 🟩 v1 │
  └──────────────┘           └──────────────┘           └──────────────┘
                                                          (no parent:
                                                           root commit)

arrows point BACKWARD in time — each commit only knows where it came from.
"git log" = the traversal loop from the Linked Lists page:
   current = newest; while current: print; current = current.parent  ⭐`}
        />
      </Section>

      {/* 06 ─ FULL PICTURE */}
      <Section id="full-picture" number="06" title="One Edit → One Commit — The Whole Machine, Drawn ⭐">
        <P>
          The complete picture: you edit ONLY <IC>app.py</IC> and commit. Watch exactly which
          objects get created and which get <strong>reused</strong>:
        </P>
        <CodeBlock
          title="full_machine.txt"
          runnable={false}
          code={`BEFORE (commit c1)                      AFTER editing app.py → commit c2

🟨 c1                                   🟨 c2  ── parent ──▶ 🟨 c1
 │                                       │
 ▼                                       ▼
🟩 root v1                              🟩 root v2                 NEW (1 entry changed)
 ├─ app.py    → 🟦 A1                    ├─ app.py    → 🟦 A2      NEW (content changed)
 ├─ README.md → 🟦 R1                    ├─ README.md → 🟦 R1  ◀── REUSED ✅
 └─ src/      → 🟩 S1                    └─ src/      → 🟩 S1  ◀── REUSED ✅
     └─ utils.py → 🟦 U1                     └─ utils.py → 🟦 U1   (untouched subtree:
                                                                    not even looked at)

objects created for this commit:  1 blob + 1 tree + 1 commit = 3 tiny objects
objects reused:                   everything else in the project

THIS is how "every commit is a full snapshot" costs almost nothing:
a snapshot is just a new set of POINTERS, mostly at old objects. 📌`}
        />
        <Callout type="tip">
          ⭐ Say this in interviews: &quot;Git commits are full snapshots, implemented as trees of
          content-addressed objects — unchanged files dedupe to the same blob, so a commit only
          stores what changed plus a handful of pointer objects.&quot; That sentence is this entire
          page.
        </Callout>
      </Section>

      {/* 07 ─ DEDUP */}
      <Section id="dedup" number="07" title="Why Snapshots Stay Cheap — Numbers & Packfiles">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# count objects and their disk usage in any repo:
$ git count-objects -vH

# git also periodically compresses objects into PACKFILES:
$ git gc                      # "garbage collect": pack + prune unreachable
$ ls .git/objects/pack/`}
          output={`$ git count-objects -vH
count: 47
size: 196.00 KiB
in-pack: 1284
size-pack: 2.31 MiB           ← 1284 objects squeezed into one pack

$ git gc
Enumerating objects: 1331, done.
Compressing objects: 100% (1290/1331), done.

$ ls .git/objects/pack/
pack-a1b2c3d4....pack         ← one file holding ~all objects
pack-a1b2c3d4....idx          ← its index for fast lookup`}
        />
        <CodeBlock
          title="packfiles.txt"
          runnable={false}
          code={`two storage layers, both invisible to you:

  LOOSE objects     one compressed file per object  (young objects)
       │  git gc (automatic, occasionally)
       ▼
  PACKFILE          many objects in one file, delta-compressed:
                    similar blobs stored as "v1 + tiny diff to v2"

wait — "git stores snapshots, not diffs"?! Both true: ⭐
  the DATA MODEL is snapshots (what you reason about),
  the PACKFILE may use diffs as a compression detail (what disk sees).
  Model: snapshots. Compression: whatever's smallest. Never confuse layers.`}
        />
        <Callout type="behind">
          Real numbers: the entire Linux kernel — 1.3M+ commits, 20 years of history by thousands
          of people — packs into a few GB. Snapshot model + content dedup + delta packing is
          absurdly effective.
        </Callout>
      </Section>

      {/* 08 ─ HEAD & REFS */}
      <Section id="head-refs" number="08" title="HEAD & Branches — Just Sticky Notes on Commits ⭐">
        <P>
          Final piece. Hashes are unreadable — so git keeps human names in tiny text files called{" "}
          <strong>refs</strong>. Read what&apos;s inside and the illusion collapses:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cat .git/refs/heads/main         # the branch "main" is... a file
$ cat .git/HEAD                     # and HEAD is... also a file`}
          output={`$ cat .git/refs/heads/main
f3a9c21d8e4b7a2c91f05e6d3b8a4c7e2d1f0a9b
        ▲ a branch is ONE LINE: the hash of its latest commit. That's ALL. ⭐

$ cat .git/HEAD
ref: refs/heads/main
        ▲ HEAD = "which branch are you on right now". One line. Again.`}
        />
        <CodeBlock
          title="refs_drawn.txt"
          runnable={false}
          code={`               🟨 c1 ◀── 🟨 c2 ◀── 🟨 c3
                                     ▲
                                     │
                          main ──────┘        (refs/heads/main: "c3")
                           ▲
                           │
                 HEAD ─────┘                  (HEAD: "ref: refs/heads/main")

now every "mysterious" operation is just moving stickers:

  new commit c4?      → c4 created, main's file rewritten to "c4". Done.
  create branch dev?  → write ONE 41-byte file refs/heads/dev. Instant! 🌿
  switch to dev?      → rewrite HEAD to "ref: refs/heads/dev". Instant!
  "detached HEAD"?    → HEAD contains a raw hash instead of a ref: line
                        (you checked out a commit, not a branch)

THIS is why git branches are free and instant, while old systems
copied the whole project folder per branch. A branch is a sticky note. 📌`}
        />
        <Callout type="tip">
          The Branches page builds entirely on this picture. If you remember one thing from
          internals: <strong>a branch is a 41-byte file containing a commit hash; HEAD points at a
          branch</strong>. Every merge/rebase/reset diagram is just these stickers moving.
        </Callout>
      </Section>

      {/* 09 ─ PLUMBING */}
      <Section id="plumbing" number="09" title="Inspect It Yourself — The X-Ray Toolkit">
        <P>
          Git calls user commands <strong>porcelain</strong> (the polished sink) and internal ones{" "}
          <strong>plumbing</strong> (the pipes). You&apos;ve met the pipes — here&apos;s the kit on
          one card:
        </P>
        <Table
          head={["Plumbing command", "What it shows"]}
          rows={[
            ["git cat-file -t <hash>", "object's type: blob / tree / commit"],
            ["git cat-file -p <hash>", "object's content, pretty-printed"],
            ["git hash-object <file>", "the hash git WOULD give this content"],
            ["git ls-files -s", "the staging area's contents (name + blob hash per file)"],
            ["git ls-tree HEAD", "root tree of the latest commit"],
            ["git rev-parse HEAD", "resolve any name (HEAD, main, tag) to its full hash"],
            ["git count-objects -vH", "object count + disk usage"],
            ["git fsck", "verify the whole object database's integrity"],
          ]}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# the 5-minute self-tour of any repo — run these in order:
$ git rev-parse HEAD                  # where am I?
$ git cat-file -p HEAD                # read that commit
$ git cat-file -p HEAD^{tree}         # read its root tree
$ git cat-file -p <some blob hash>    # read an actual file's content
$ git ls-files -s                     # what's staged right now

# follow the pointers by hand ONCE — git demystified forever.`}
          output={`(each command's output feeds the next — you are walking
 commit → tree → blob exactly like git itself does)`}
        />
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Corruptions & Confusions">
        <P>
          <strong>Confusion 1 — &quot;detached HEAD&quot; panic.</strong> Not an error! Just HEAD
          holding a raw hash:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git checkout f3a9c21        # checking out a COMMIT, not a branch`}
          output={`Note: switching to 'f3a9c21'.

You are in 'detached HEAD' state. You can look around, make
experimental changes and commit them, and you can discard any
commits you make in this state without impacting any branches...

Translation: HEAD points at a commit directly (no branch sticker).
Sightseeing is safe. But commits made here belong to NO branch —
leave without saving them and they're orphaned.
Escape:   git switch main          (just go back)
Keep work: git switch -c rescue    (put a branch sticker here first)`}
        />
        <P>
          <strong>Confusion 2 — short hash suddenly ambiguous.</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git show f3a9`}
          output={`error: short object ID f3a9 is ambiguous
hint: The candidates are:
hint:   f3a9c21 commit 2026-06-11 - add login form
hint:   f3a94d0 blob

Two objects start with f3a9 — git refuses to guess.
Use more characters: f3a9c21. (Large repos: 7 chars usually enough,
the kernel uses 12.)`}
        />
        <P>
          <strong>Corruption 3 — actual damage (rare, but know the alarm):</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ git fsck`}
          output={`error: object file .git/objects/7f/8b2a1... is empty
error: 7f8b2a1d4e6c8a0b2f4d6e8a0c2e4f6a8b0d2e4f: object corrupt or missing

Usually: disk died mid-write or .git was half-copied.
Recovery options, in order:
  1. another clone exists (teammate / GitHub)?  → re-clone. Done. ⭐
     (distributed design = everyone's copy is a full backup)
  2. git fsck --lost-found  → salvage reachable objects
NEVER hand-edit files inside .git/objects — hashes make any
edit detectable AND fatal.`}
        />
        <P>
          <strong>Confusion 4 — &quot;I deleted .git by accident&quot;.</strong>
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          error
          code={`$ rm -rf .git
$ git status`}
          output={`fatal: not a git repository (or any of the parent directories): .git

Your working files are untouched (remember: code lives OUTSIDE .git).
But history, branches, stash — gone with the folder.
  pushed to GitHub before?  git clone <url> → full history returns ✅
  never pushed?             the history is genuinely gone.
  The lesson writes itself: push early, push often.`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Everything is named by", "SHA-1 hash of its content (content-addressable storage)"],
            ["Only 3 object types", "blob (file bytes) · tree (folder listing) · commit (snapshot label)"],
            ["Blobs are nameless", "filenames live in TREES — renames & copies are nearly free"],
            ["A commit object is", "tree + parent + author + message — ~5 lines of text"],
            ["History is", "a linked list of commits via parent pointers (DSA, applied!)"],
            ["Snapshots are cheap because", "unchanged files → same hash → same blob, reused"],
            ["Edit 1 file, commit", "creates ~3 objects: new blob, new root tree, new commit"],
            ["A branch is", "a 41-byte file: refs/heads/<name> containing a commit hash 📌"],
            ["HEAD is", "a 1-line file pointing at the current branch (or raw hash = detached)"],
            ["X-ray any object", "git cat-file -p <hash> · type with -t"],
            ["Snapshots vs packfile diffs", "model = snapshots; disk compression = deltas. Different layers"],
            ["Integrity check / panic button", "git fsck · corrupted? re-clone from any other copy"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
