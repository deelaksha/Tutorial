"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What Is a Tree?" },
  { id: "vocab", label: "Tree Vocabulary ⭐" },
  { id: "build", label: "Build One in Python" },
  { id: "traversals", label: "The 3 Traversals ⭐" },
  { id: "traversal-trace", label: "Inorder — Full Trace" },
  { id: "level-order", label: "Level-Order (BFS)" },
  { id: "bst", label: "Binary Search Tree ⭐" },
  { id: "bst-ops", label: "BST Search & Insert" },
  { id: "balance", label: "Balanced vs Skewed" },
  { id: "exceptions", label: "💥 Crashes & Traps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function TreesPage() {
  return (
    <TopicShell
      icon="🌳"
      title="Trees — Hierarchy, Drawn"
      gradientWord="Trees"
      subtitle="A linked list node had ONE next-arrow. Give a node TWO arrows (left & right) and you get a tree — the shape behind file systems, the DOM, databases and autocompletion. Recursion finally pays off: every tree function here is 4 lines."
      nav={NAV}
      next={{ icon: "🕸️", label: "Graphs", href: "/python/graphs" }}
    >
      {/* 01 ─ WHAT */}
      <Section id="what" number="01" title="What Is a Tree? You Already Use Five Daily">
        <P>
          A tree is data with <strong>hierarchy</strong>: one item at the top, branching downward,
          no loops. You navigate trees all day without noticing:
        </P>
        <CodeBlock
          title="trees_you_know.txt"
          runnable={false}
          code={`YOUR FILE SYSTEM                      HTML (the DOM)              A COMPANY

  home/                                  <html>                       CEO
  ├── photos/                            ├── <head>                  /   \\
  │   ├── trip.jpg                       │   └── <title>          CTO     CFO
  │   └── cat.png                        └── <body>              /   \\      \\
  ├── code/                                  ├── <h1>        Dev team  Ops   Accounts
  │   └── app.py                             └── <p>
  └── notes.txt

Also: family trees, tournament brackets, JSON, the recursion call tree
from the fibonacci section — all the SAME shape.`}
        />
        <P>
          This page focuses on the <strong>binary tree</strong>: each node has at most{" "}
          <strong>two</strong> children, called <IC>left</IC> and <IC>right</IC>. It&apos;s the
          linked-list Node with one extra arrow:
        </P>
        <CodeBlock
          title="node_evolution.txt"
          runnable={false}
          code={`LINKED LIST node (last pages)         BINARY TREE node (this page)

┌───────┬──────┐                      ┌───────────────┐
│ value │ next │ → one arrow,         │     value     │
└───────┴──────┘   a chain            ├───────┬───────┤
                                      │ left  │ right │ → two arrows,
                                      └───┬───┴───┬───┘   a branching shape
                                          ▼       ▼
                                      smaller    smaller
                                       tree       tree     ← RECURSIVE! ⭐`}
        />
        <Callout type="tip">
          ⭐ The sentence that unlocks this whole page:{" "}
          <strong>&quot;a tree is a value plus two smaller trees&quot;</strong> (left and right,
          either of which may be empty/None). A recursive shape → recursive code. Every function
          here follows the Recursion page&apos;s 3-question recipe with base case{" "}
          <IC>node is None</IC>.
        </Callout>
      </Section>

      {/* 02 ─ VOCAB */}
      <Section id="vocab" number="02" title="Tree Vocabulary — The 8 Words Interviews Expect ⭐">
        <CodeBlock
          title="vocabulary.txt"
          runnable={false}
          code={`                      ┌─────┐
            ROOT ───▶  │  A  │            depth 0   ─┐
                      └──┬──┘                        │
                   ┌─────┴─────┐                     │ HEIGHT = 2
                ┌──▼──┐     ┌──▼──┐                  │ (longest path
                │  B  │     │  C  │   depth 1        │  root → leaf)
                └──┬──┘     └─────┘                  │
              ┌────┴────┐      ▲                     │
           ┌──▼──┐   ┌──▼──┐   │      depth 2       ─┘
           │  D  │   │  E  │   LEAF (no children)
           └─────┘   └─────┘
              ▲         ▲
              LEAVES (no children)

A is the PARENT of B and C.    B and C are CHILDREN of A, SIBLINGS of each other.
B is the parent of D and E.    The SUBTREE at B = {B, D, E} — itself a full tree!`}
        />
        <Table
          head={["Word", "Meaning", "In the picture"]}
          rows={[
            ["root", "the single top node — the only entry point (like head!)", "A"],
            ["parent / child", "the node above / the nodes below", "A is parent of B, C"],
            ["siblings", "children of the same parent", "B & C; D & E"],
            ["leaf", "node with NO children — where branches end", "C, D, E"],
            ["edge", "one arrow connecting parent → child", "A→B, A→C, B→D, B→E"],
            ["depth (of a node)", "edges from the root DOWN to it", "D has depth 2"],
            ["height (of the tree)", "longest root→leaf path", "2"],
            ["subtree", "any node + everything under it (a tree itself)", "{B, D, E}"],
          ]}
        />
        <Callout type="analogy">
          👪 It&apos;s literally a family tree, drawn upside-down (root at top — computer scientists
          plant trees in the ceiling). Parent, child, sibling — the names are not metaphors, they
          ARE the vocabulary.
        </Callout>
      </Section>

      {/* 03 ─ BUILD */}
      <Section id="build" number="03" title="Build One in Python — 5 Lines of Class">
        <CodeBlock
          title="build_tree.py"
          code={`class Node:
    def __init__(self, value):
        self.value = value
        self.left = None       # arrow to the left child  (None = empty)
        self.right = None      # arrow to the right child

# build this tree:        A
#                        / \\
#                       B   C
#                      / \\
#                     D   E
root = Node("A")
root.left = Node("B")
root.right = Node("C")
root.left.left = Node("D")
root.left.right = Node("E")

print(root.value)               # A
print(root.left.value)          # B  (follow the left arrow)
print(root.left.right.value)    # E  (left, then right)
print(root.right.left)          # None — C has no left child`}
          output={`A
B
E
None`}
        />
        <P>
          And the first real tree function — <strong>count the nodes</strong> — written with the
          recursion recipe (Q1 smallest input? empty tree → 0. Q2 smaller problems? left subtree,
          right subtree. Q3 combine? 1 + both counts):
        </P>
        <CodeBlock
          title="count.py"
          code={`def count(node):
    if node is None:                            # base: empty tree has 0 nodes
        return 0
    return 1 + count(node.left) + count(node.right)   # me + left team + right team

def height(node):
    if node is None:                            # empty tree: height -1 (no edges)
        return -1
    return 1 + max(height(node.left), height(node.right))

print(count(root))
print(height(root))`}
          output={`5
2`}
        />
        <Callout type="behind">
          <IC>count(root)</IC> spawns the same call tree shape as the tree itself — each node gets
          exactly one stack frame. That&apos;s why nested data + recursion fit so naturally: the
          code&apos;s execution literally traces the data&apos;s shape.
        </Callout>
      </Section>

      {/* 04 ─ TRAVERSALS */}
      <Section id="traversals" number="04" title="The 3 Depth-First Traversals — One Function, Three Print Positions ⭐">
        <P>
          &quot;Traversal&quot; = visiting every node. A list has one obvious order; a tree has
          choices. The three classics differ <strong>only in WHERE the print line sits</strong>{" "}
          relative to the two recursive calls:
        </P>
        <CodeBlock
          title="traversals.py"
          code={`def preorder(node):              # ROOT first  →  "copy the tree"
    if node is None: return
    print(node.value, end=" ")   # ① me
    preorder(node.left)          # ② my left subtree
    preorder(node.right)         # ③ my right subtree

def inorder(node):               # ROOT in the middle  →  "sorted order" (BSTs!)
    if node is None: return
    inorder(node.left)           # ① left
    print(node.value, end=" ")   # ② me
    inorder(node.right)          # ③ right

def postorder(node):             # ROOT last  →  "delete children before parent"
    if node is None: return
    postorder(node.left)         # ① left
    postorder(node.right)        # ② right
    print(node.value, end=" ")   # ③ me

preorder(root);  print()
inorder(root);   print()
postorder(root); print()`}
          output={`A B D E C
D B E A C
D E B C A `}
        />
        <CodeBlock
          title="three_orders.txt"
          runnable={false}
          code={`           A                 PREorder  = print BEFORE the calls  → A B D E C
          / \\                            (root leads its subtree)
         B   C
        / \\               INorder   = print BETWEEN the calls → D B E A C
       D   E                            (left, me, right — "in" the middle)

                          POSTorder = print AFTER the calls   → D E B C A
                                        (children handled before parent)

Memory hook: PRE/IN/POST tells you WHEN the root is printed.`}
        />
        <Callout type="note">
          Each has a job: <strong>preorder</strong> serializes/copies a tree (root first → rebuild
          top-down), <strong>inorder</strong> prints a BST in sorted order (section 07 proves it),{" "}
          <strong>postorder</strong> deletes safely (children before parent — like{" "}
          <IC>rm -rf</IC> emptying folders before removing them).
        </Callout>
      </Section>

      {/* 05 ─ TRACE */}
      <Section id="traversal-trace" number="05" title="Inorder, Traced Call by Call — No Magic Left">
        <P>
          Let&apos;s slow-motion <IC>inorder(A)</IC> with the call stack from the Recursion page.
          Rule per node: <em>finish the entire left side, print me, then the right side</em>:
        </P>
        <CodeBlock
          title="inorder_trace.txt"
          runnable={false}
          code={`inorder(A)
│  inorder(B)                  ← A pauses: "left first"
│  │  inorder(D)               ← B pauses: "left first"
│  │  │  inorder(None) → return     (D's left: empty, base case)
│  │  │  print D  ✏️                 output: D
│  │  │  inorder(None) → return     (D's right: empty)
│  │  print B  ✏️                    output: D B
│  │  inorder(E)
│  │  │  inorder(None) → return
│  │  │  print E  ✏️                 output: D B E
│  │  │  inorder(None) → return
│  print A  ✏️                       output: D B E A
│  inorder(C)
│  │  inorder(None) → return
│  │  print C  ✏️                    output: D B E A C
│  │  inorder(None) → return
done.                          FINAL: D B E A C  ✅ (matches section 04!)

Indentation = stack depth. Every "None → return" is the base case
doing its job: empty subtrees end the recursion 6 times here.`}
        />
        <Callout type="tip">
          Hand-trace ONE traversal like this once in your life, then switch to the leap of faith
          forever: &quot;inorder(B) prints B&apos;s subtree in order — I trust it — so inorder(A) =
          (B&apos;s subtree) A (C&apos;s subtree)&quot;. That one-line reasoning is how seniors read
          tree code.
        </Callout>
      </Section>

      {/* 06 ─ LEVEL ORDER */}
      <Section id="level-order" number="06" title="Level-Order — Visit Floor by Floor (a Queue Returns!)">
        <P>
          Fourth traversal: top floor, then the next floor, left to right — like reading the tree.
          No recursion this time; the tool is the <strong>queue from the last page</strong>:
        </P>
        <CodeBlock
          title="level_order.py"
          code={`from collections import deque

def level_order(root):
    queue = deque([root])              # start: root waits in line
    while queue:
        node = queue.popleft()         # serve the OLDEST waiting node
        print(node.value, end=" ")
        if node.left:                  # its children join the BACK of the line
            queue.append(node.left)
        if node.right:
            queue.append(node.right)

level_order(root)`}
          output={`A B C D E `}
        />
        <CodeBlock
          title="level_order_trace.txt"
          runnable={false}
          code={`           A          serve A → kids B,C line up      queue: [B, C]      out: A
          / \\         serve B → kids D,E line up      queue: [C, D, E]   out: A B
         B   C        serve C → no kids               queue: [D, E]      out: A B C
        / \\           serve D → no kids               queue: [E]         out: A B C D
       D   E          serve E → no kids               queue: []          out: A B C D E

FIFO guarantees floor order: B,C (depth 1) entered the line
before D,E (depth 2) — so they're all served before depth 2 starts. ⭐`}
        />
        <Callout type="behind">
          Swap the <IC>deque</IC> for a <strong>stack</strong> (pop from the same end) and this
          exact loop becomes depth-first instead of breadth-first. Queue = floor by floor, stack =
          dive deep. Keep this in your pocket — it&apos;s the punchline of the Graphs page.
        </Callout>
      </Section>

      {/* 07 ─ BST */}
      <Section id="bst" number="07" title="Binary Search Tree — One Rule Makes Search O(log n) ⭐">
        <P>
          So far values sat anywhere. Add <strong>one placement rule</strong> and the tree becomes a
          search machine. The BST rule, at <em>every</em> node:{" "}
          <strong>smaller values go left, larger go right.</strong>
        </P>
        <CodeBlock
          title="bst_rule.txt"
          runnable={false}
          code={`                 ┌────┐
                 │ 50 │           everything LEFT of 50  is < 50
                 └─┬──┘           everything RIGHT of 50 is > 50
          ┌────────┴────────┐
        ┌─▼──┐            ┌─▼──┐
        │ 30 │            │ 70 │       ...and the rule repeats at EVERY node:
        └─┬──┘            └─┬──┘       under 30: left <30, right >30 (but <50)
       ┌──┴───┐          ┌──┴───┐
     ┌─▼─┐  ┌─▼─┐      ┌─▼─┐  ┌─▼─┐
     │20 │  │40 │      │60 │  │80 │
     └───┘  └───┘      └───┘  └───┘

inorder traversal of this tree:  20 30 40 50 60 70 80  ← SORTED! Always. ⭐
(left-me-right + smaller-on-the-left = ascending order for free)`}
        />
        <P>
          Why care? Searching becomes the <strong>guessing game from the Big-O page</strong>: each
          comparison discards half the tree.
        </P>
        <CodeBlock
          title="search_72.txt"
          runnable={false}
          code={`find 60:   at 50 → 60 > 50, go RIGHT   (the whole left half: ELIMINATED 🗑️)
           at 70 → 60 < 70, go LEFT    (80 eliminated)
           at 60 → FOUND ✅            3 comparisons for 7 nodes

find 65:   50 → right, 70 → left, 60 → right... but 60.right is None
           → NOT IN THE TREE ✅  (and we proved it in 3 steps, not 7)

1,000,000 nodes, balanced → only ~20 comparisons.  O(log n). 🚀`}
        />
        <Callout type="analogy">
          📖 The BST is the phone book from the Big-O page, grown into a shape: open in the middle
          (root), decide left/right half, repeat. Binary search, frozen into a data structure.
        </Callout>
      </Section>

      {/* 08 ─ BST OPS */}
      <Section id="bst-ops" number="08" title="BST Search & Insert — The Code">
        <CodeBlock
          title="bst.py"
          code={`class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def insert(node, value):
    if node is None:                 # found an empty spot → plant here
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)     # smaller → left subtree
    elif value > node.value:
        node.right = insert(node.right, value)   # larger → right subtree
    return node                      # (equal: ignore duplicates)

def search(node, value):
    if node is None:                 # fell off the tree → not here
        return False
    if value == node.value:
        return True
    if value < node.value:
        return search(node.left, value)          # half the tree: gone
    return search(node.right, value)

root = None
for v in [50, 30, 70, 20, 40, 60, 80]:   # builds the diagram from section 07
    root = insert(root, v)

print(search(root, 60))
print(search(root, 65))

def inorder(node):
    if node is None: return
    inorder(node.left); print(node.value, end=" "); inorder(node.right)

inorder(root)   # the sorted-order proof`}
          output={`True
False
20 30 40 50 60 70 80 `}
        />
        <Callout type="mistake">
          Note <IC>node.left = insert(node.left, value)</IC> — the return value is{" "}
          <strong>reassigned</strong> back. Beginners call <IC>insert(node.left, value)</IC> without
          assigning, and the new node is created… then garbage collected, never wired in. Same
          &quot;lost reference&quot; bug as the linked-list page.
        </Callout>
        <Table
          head={["Operation", "Balanced BST", "Python list", "Python set/dict"]}
          rows={[
            ["search", "O(log n)", "O(n) (or O(log n) if kept sorted)", "O(1)"],
            ["insert (keeping order)", "O(log n)", "O(n) — shift!", "O(1) (no order)"],
            ["walk in sorted order", "O(n) inorder ⭐", "O(n) if sorted", "✗ unordered"],
          ]}
        />
        <Callout type="behind">
          &quot;Why not always use a dict then?&quot; — dicts are O(1) but{" "}
          <strong>unordered</strong>. BSTs give you sorted-order walks, &quot;closest value&quot;,
          and range queries (&quot;everything between 30 and 70&quot;). That&apos;s why databases
          index with B-trees — BSTs widened for disk pages.
        </Callout>
      </Section>

      {/* 09 ─ BALANCE */}
      <Section id="balance" number="09" title="Balanced vs Skewed — How a Tree Degrades Into a List">
        <P>
          The O(log n) promise has fine print: it requires the tree to be <strong>bushy</strong>.
          Feed a BST <em>sorted</em> input and watch the disaster:
        </P>
        <CodeBlock
          title="skewed.py"
          code={`root = None
for v in [10, 20, 30, 40, 50]:    # sorted input!
    root = insert(root, v)

# every value is bigger than the last → ALWAYS goes right...`}
          output={`(no output — but look at the shape it built ↓)`}
        />
        <CodeBlock
          title="balanced_vs_skewed.txt"
          runnable={false}
          code={`SHUFFLED input [30,10,40,20,50]        SORTED input [10,20,30,40,50]

           ┌────┐                          ┌────┐
           │ 30 │                          │ 10 │
           └─┬──┘                          └─┬──┘
        ┌────┴────┐                          └──▶ ┌────┐
      ┌─▼──┐    ┌─▼──┐                            │ 20 │
      │ 10 │    │ 40 │                            └─┬──┘
      └─┬──┘    └─┬──┘                              └──▶ ┌────┐
        └─▶┌──┐   └─▶┌──┐                                │ 30 │
           │20│      │50│                                └─┬──┘
           └──┘      └──┘                                  └──▶ ...

height ≈ log n  → search O(log n) ⚡    height = n → it's a LINKED LIST in
                                        disguise! search O(n) 🐌
                                        The whole speed promise: gone.`}
        />
        <Callout type="behind">
          Real-world fix: <strong>self-balancing trees</strong> (AVL, Red-Black) — BSTs that
          rotate nodes after each insert to stay bushy, guaranteeing O(log n) no matter the input
          order. That&apos;s what sits inside databases and language runtimes; the rotation
          mechanics are beyond this page, but &quot;sorted input skews a naive BST&quot; is the
          interview takeaway.
        </Callout>
        <Callout type="tip">
          Quick interview answer: &quot;BST operations are O(log n) <em>average</em>, O(n){" "}
          <em>worst case</em> (skewed); self-balancing variants guarantee O(log n).&quot; Saying
          those two cases out loud is what separates prepared candidates.
        </Callout>
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Crashes & Traps">
        <P>
          <strong>Crash 1 — forgetting the None base case.</strong> The #1 tree bug:
        </P>
        <CodeBlock
          title="crash_no_base.py"
          code={`def count(node):
    # forgot:  if node is None: return 0
    return 1 + count(node.left) + count(node.right)

count(root)     # 💀 recursion eventually reaches a leaf's child: None`}
          error
          output={`Traceback (most recent call last):
  File "crash_no_base.py", line 3, in count
AttributeError: 'NoneType' object has no attribute 'left'

Every leaf's children are None. The recursion ALWAYS reaches None.
First line of every tree function:  if node is None: return <something>`}
        />
        <P>
          <strong>Crash 2 — deep recursion on a skewed tree.</strong> Sections 09 + the Recursion
          page colliding:
        </P>
        <CodeBlock
          title="crash_depth.py"
          code={`root = None
for v in range(2000):        # sorted input → height-2000 "tree" (a chain)
    root = insert(root, v)   # 💀 insert recurses once per level...`}
          error
          output={`Traceback (most recent call last):
  File "crash_depth.py", line 3, in <module>
  File "crash_depth.py", line 8, in insert
  [Previous line repeated 996 more times]
RecursionError: maximum recursion depth exceeded

A balanced tree of 2000 nodes is only ~11 levels deep — no problem.
The crash isn't the recursion's fault, it's the SHAPE's fault.`}
        />
        <P>
          <strong>Trap 3 — inserting comparable-incompatible types.</strong>
        </P>
        <CodeBlock
          title="crash_types.py"
          code={`root = insert(None, 50)
root = insert(root, "apple")     # 💀 the BST must ask: "apple" < 50 ?`}
          error
          output={`Traceback (most recent call last):
  File "crash_types.py", line 2, in <module>
  File "bst.py", line 10, in insert
TypeError: '<' not supported between instances of 'str' and 'int'

A BST is built on comparisons — every value must be comparable
with every other. One type per tree.`}
        />
        <P>
          <strong>Trap 4 — breaking the BST rule by editing values in place.</strong> No crash,
          just silently wrong answers forever:
        </P>
        <CodeBlock
          title="trap_break_rule.py"
          code={`# tree from section 07, then someone "renames" a node:
root.left.value = 90      # 💀 90 now sits in the LEFT (small) half!

print(search(root, 90))   # goes RIGHT at 50... 90 isn't there
print(search(root, 30))   # 30's spot now holds 90 → also lost`}
          error
          output={`False
False

No exception — the structure LOOKS fine, but the sorted invariant
is broken, so every search that routes past that node lies.
Rule: never mutate BST values; delete + re-insert instead.`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Binary tree node", "value + left + right (two arrows instead of one)"],
            ["A tree IS", "a value plus two smaller trees → recursive shape, recursive code"],
            ["Base case (always)", "if node is None: return ... — first line of every function"],
            ["root / leaf", "the single top entry point / a node with no children"],
            ["height", "longest root→leaf path; balanced tree: ≈ log n"],
            ["Preorder", "ME, left, right → copy/serialize a tree"],
            ["Inorder", "left, ME, right → BST comes out SORTED ⭐"],
            ["Postorder", "left, right, ME → delete children before parent"],
            ["Level-order", "a QUEUE: pop a node, enqueue its kids → floor by floor"],
            ["BST rule", "smaller left, larger right — at EVERY node"],
            ["BST speeds", "O(log n) average, O(n) worst (skewed by sorted input!)"],
            ["#1 crash", "AttributeError: 'NoneType' has no attribute 'left' — missing base case"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
