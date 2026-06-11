"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why Not Just a List?" },
  { id: "node", label: "The Node — One Box ⭐" },
  { id: "chain", label: "Chaining Nodes" },
  { id: "traverse", label: "Traversal — Walking the Chain ⭐" },
  { id: "insert", label: "Insert — Rewiring Arrows" },
  { id: "delete", label: "Delete — Skip the Node" },
  { id: "class", label: "Full LinkedList Class" },
  { id: "reverse", label: "Reverse — Interview Classic ⭐" },
  { id: "variants", label: "Doubly & Circular" },
  { id: "exceptions", label: "💥 Crashes & Traps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinkedListsPage() {
  return (
    <TopicShell
      icon="🔗"
      title="Linked Lists — Boxes and Arrows"
      gradientWord="Linked"
      subtitle="Your first hand-built data structure. A Python list is one solid shelf; a linked list is boxes scattered anywhere in memory, connected by arrows. Master the arrows here and trees & graphs become easy — they're just nodes with MORE arrows."
      nav={NAV}
      next={{ icon: "🥞", label: "Stacks & Queues", href: "/python/stacks-queues" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why Not Just Use a Python List?">
        <P>
          On the Big-O page you saw that a Python list is a <strong>contiguous shelf</strong> —
          items sit side by side in memory. That makes indexing O(1)… but inserting at the front
          O(n), because <em>everything</em> must shift:
        </P>
        <CodeBlock
          title="shelf_vs_chain.txt"
          runnable={false}
          code={`PYTHON LIST — one solid shelf            insert(0, "X") → EVERYTHING shifts

  index:   0     1     2     3              0     1     2     3     4
         ┌─────┬─────┬─────┬─────┐        ┌─────┬─────┬─────┬─────┬─────┐
         │ "a" │ "b" │ "c" │ "d" │   →    │ "X" │ "a" │ "b" │ "c" │ "d" │
         └─────┴─────┴─────┴─────┘        └─────┴─────┴─────┴─────┴─────┘
                                            ↑      →→→→ 4 items moved →→→→

LINKED LIST — boxes anywhere, arrows       insert at front → rewire ONE arrow

  head                                     head ──┐
   │                                              ▼
   ▼                                            ┌─────┬───┐
  ┌─────┬───┐   ┌─────┬───┐   ┌─────┬───┐      │ "X" │ ●─┼──▶ (old chain,
  │ "a" │ ●─┼──▶│ "b" │ ●─┼──▶│ "c" │ ✕ │      └─────┴───┘     untouched!)
  └─────┴───┘   └─────┴───┘   └─────┴───┘
   value next                 ✕ = None (end)     NOTHING shifted. O(1).`}
        />
        <Table
          head={["Operation", "Python list (shelf)", "Linked list (chain)"]}
          rows={[
            ["Read item #500", "⚡ O(1) — jump to slot", "🐌 O(n) — walk 500 arrows"],
            ["Insert/delete at FRONT", "🐌 O(n) — shift everything", "⚡ O(1) — rewire one arrow"],
            ["Insert/delete in MIDDLE (already there)", "🐌 O(n) shift", "⚡ O(1) rewire"],
            ["Append at end", "⚡ O(1)", "O(n), or O(1) with a tail pointer"],
            ["Memory layout", "one solid block", "scattered, +1 arrow per item"],
          ]}
        />
        <Callout type="analogy">
          🚂 A Python list is theatre seating — to add someone in row 1, everyone moves down one
          seat. A linked list is a <strong>train</strong> — to add a wagon at the front, you just
          re-hook one coupling. But to find wagon #500, you must walk through 499 wagons; there are
          no seat numbers.
        </Callout>
        <Callout type="note">
          Honest truth: in day-to-day Python you&apos;ll almost always use <IC>list</IC> or{" "}
          <IC>collections.deque</IC>. You learn linked lists because (1) interviews love them, and
          (2) they teach <strong>pointer surgery</strong> — the exact skill trees and graphs need.
        </Callout>
      </Section>

      {/* 02 ─ NODE */}
      <Section id="node" number="02" title="The Node — One Box With Two Compartments ⭐">
        <P>
          The entire structure is built from one tiny class. A <strong>node</strong> holds two
          things: a value, and a reference (arrow) to the next node:
        </P>
        <CodeBlock
          title="node.py"
          code={`class Node:
    def __init__(self, value):
        self.value = value     # compartment 1: the data
        self.next = None       # compartment 2: arrow to the next node (None = no arrow yet)

a = Node("a")
print(a.value)
print(a.next)`}
          output={`a
None`}
        />
        <CodeBlock
          title="one_node.txt"
          runnable={false}
          code={`a ──▶ ┌───────────┬────────┐
      │ value "a" │ next ✕ │      ✕ = None  ("the chain ends here")
      └───────────┴────────┘

That's it. That's the whole building block.
A linked list of 1000 items = 1000 of these boxes + 999 arrows.`}
        />
        <Callout type="behind">
          <IC>self.next</IC> is not magic — it&apos;s a plain attribute holding a{" "}
          <strong>reference</strong> to another Node object, exactly like the references you met in
          the mutability topic. &quot;Arrow&quot; is just how we draw &quot;variable pointing at an
          object&quot;.
        </Callout>
      </Section>

      {/* 03 ─ CHAIN */}
      <Section id="chain" number="03" title="Chaining Nodes — Building the List by Hand">
        <CodeBlock
          title="chain.py"
          code={`class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

# build three boxes
a = Node("a")
b = Node("b")
c = Node("c")

# wire the arrows
a.next = b          # a ──▶ b
b.next = c          # b ──▶ c
                    # c.next stays None: end of chain

head = a            # 'head' = the ONLY entry point we keep

print(head.value)             # a
print(head.next.value)        # follow 1 arrow  → b
print(head.next.next.value)   # follow 2 arrows → c
print(head.next.next.next)    # follow 3 arrows → None (the end)`}
          output={`a
b
c
None`}
        />
        <CodeBlock
          title="the_chain.txt"
          runnable={false}
          code={`head
 │
 ▼
┌─────┬───┐    ┌─────┬───┐    ┌─────┬───┐
│ "a" │ ●─┼───▶│ "b" │ ●─┼───▶│ "c" │ ✕ │
└─────┴───┘    └─────┴───┘    └─────┴───┘

head.value            = "a"
head.next             = the b box
head.next.next.value  = "c"
head.next.next.next   = None  ← how we KNOW we reached the end`}
        />
        <Callout type="mistake">
          The <IC>head</IC> is sacred. It&apos;s the only handle you have on the whole chain — there
          is no index, no <IC>len()</IC>, nothing. <strong>Lose head, lose the list</strong>: if you
          write <IC>head = head.next</IC> carelessly, the &quot;a&quot; box has zero references left
          and the garbage collector eats it.
        </Callout>
      </Section>

      {/* 04 ─ TRAVERSE */}
      <Section id="traverse" number="04" title="Traversal — Walking the Chain ⭐">
        <P>
          You can&apos;t do <IC>chain[2]</IC>. The only way to reach anything is to start at{" "}
          <IC>head</IC> and follow arrows. This 3-line walking loop is{" "}
          <strong>THE pattern of this whole page</strong> — print, search, count, everything uses
          it:
        </P>
        <CodeBlock
          title="traverse.py"
          code={`current = head                  # start at the entry point
while current is not None:      # None means we walked off the end
    print(current.value)
    current = current.next      # ⭐ THE step: hop along the arrow`}
          output={`a
b
c`}
        />
        <CodeBlock
          title="walk_trace.txt"
          runnable={false}
          code={`step 1: current ──▶ [a]──▶[b]──▶[c]✕     print "a", hop
step 2:        current ──▶ [b]──▶[c]✕     print "b", hop
step 3:               current ──▶ [c]✕    print "c", hop
step 4:                     current = None → loop ends. Walked off the cliff safely.

'current' is a finger sliding along the train. head never moves.`}
        />
        <P>Search and length are the same walk with a different body:</P>
        <CodeBlock
          title="walk_jobs.py"
          code={`def contains(head, target):          # search: O(n)
    current = head
    while current is not None:
        if current.value == target:
            return True
        current = current.next
    return False

def length(head):                    # count: O(n) — no free len()!
    count, current = 0, head
    while current is not None:
        count += 1
        current = current.next
    return count

print(contains(head, "b"), contains(head, "z"))
print(length(head))`}
          output={`True False
3`}
        />
        <Callout type="mistake">
          Walk with a <strong>copy</strong> (<IC>current = head</IC>), never with{" "}
          <IC>head</IC> itself. Writing <IC>head = head.next</IC> in the loop walks fine… and then
          your list is gone forever — head ends as <IC>None</IC>.
        </Callout>
        <Callout type="behind">
          Recursion fans: a linked list is a recursive shape — &quot;a node + a smaller list&quot;.
          So traversal can be the 3-question recipe from the previous page:{" "}
          <IC>def length(node): return 0 if node is None else 1 + length(node.next)</IC>. Base case
          = <IC>None</IC>, smaller problem = <IC>node.next</IC>.
        </Callout>
      </Section>

      {/* 05 ─ INSERT */}
      <Section id="insert" number="05" title="Insert — Pointer Surgery, Order Matters">
        <P>
          <strong>Insert at the front</strong> — the O(1) superpower. Two moves, in this exact
          order:
        </P>
        <CodeBlock
          title="insert_front.py"
          code={`new = Node("X")
new.next = head      # ① new box points at the old first box
head = new           # ② head now points at the new box

# chain is now: X → a → b → c`}
          output={`X a b c`}
        />
        <CodeBlock
          title="insert_front.txt"
          runnable={false}
          code={`BEFORE          head ──▶ [a]──▶[b]──▶[c]✕        [X]✕  (floating, unwired)

step ①          head ──▶ [a]──▶[b]──▶[c]✕
                          ▲
                [X]───────┘            new.next = head

step ②          head ──▶ [X]──▶[a]──▶[b]──▶[c]✕   head = new   ✅ done, O(1)

⚠️ DO IT BACKWARDS AND YOU LOSE THE LIST:
   head = new   first  →  head ──▶ [X]✕      [a]──▶[b]──▶[c]✕
   new.next = head      →  X points at... itself. a,b,c unreachable. 💀`}
        />
        <P>
          <strong>Insert in the middle</strong> (after a known node) — same two moves on different
          boxes:
        </P>
        <CodeBlock
          title="insert_middle.py"
          code={`# insert "M" after node b:        a → b → M → c
new = Node("M")
new.next = b.next     # ① M grabs b's old arrow (points at c)
b.next = new          # ② b now points at M

# Again: NEW node grabs the next-arrow FIRST, then the old node is rewired.`}
          output={`a b M c`}
        />
        <CodeBlock
          title="insert_middle.txt"
          runnable={false}
          code={`BEFORE      [a]──▶[b]────────▶[c]✕         [M]✕

step ①      [a]──▶[b]────────▶[c]✕
                        ▲
                  [M]───┘                   M.next = b.next

step ②      [a]──▶[b]──▶[M]──▶[c]✕         b.next = M    ✅

Rule of thumb: ⭐ "connect the NEW node first, break the old link last."
Nothing is ever unreachable that way.`}
        />
      </Section>

      {/* 06 ─ DELETE */}
      <Section id="delete" number="06" title="Delete — Make the Arrows Skip the Node">
        <P>
          You don&apos;t &quot;delete&quot; a node — you make the chain <strong>route around
          it</strong>. No reference left → Python&apos;s garbage collector removes it for you.
        </P>
        <CodeBlock
          title="delete.py"
          code={`# chain: a → b → M → c        goal: remove M

b.next = b.next.next    # b skips over M, points straight at c

# chain: a → b → c       M still exists for a moment...
# ...but nothing points at it → garbage collected. Gone.`}
          output={`a b c`}
        />
        <CodeBlock
          title="delete.txt"
          runnable={false}
          code={`BEFORE      [a]──▶[b]──▶[M]──▶[c]✕

            [a]──▶[b]─────┐   [M]──▶[c]      b.next = b.next.next
                          │    ▲(no one points at M anymore)
                          ▼
AFTER       [a]──▶[b]──▶[c]✕        [M] 🗑️ garbage collected`}
        />
        <P>
          To delete by <em>value</em>, walk until you stand <strong>one node BEFORE</strong> the
          victim — because you need to rewire the previous node&apos;s arrow:
        </P>
        <CodeBlock
          title="delete_by_value.py"
          code={`def delete(head, target):
    if head is None:                 # empty list: nothing to do
        return None
    if head.value == target:         # special case: victim is the FIRST node
        return head.next             # new head = second node

    current = head
    while current.next is not None:          # look AHEAD, not at yourself
        if current.next.value == target:     # next one is the victim
            current.next = current.next.next # skip it
            return head
        current = current.next
    return head                      # target not found: unchanged

head = delete(head, "b")             # a → c`}
          output={`a c`}
        />
        <Callout type="mistake">
          Why the loop checks <IC>current.next.value</IC> and not <IC>current.value</IC>: in a singly
          linked list, <strong>you cannot look backwards</strong>. If you walk until you stand ON
          the victim, it&apos;s too late — you can no longer reach the node whose arrow must change.
          Always stop one node early.
        </Callout>
      </Section>

      {/* 07 ─ CLASS */}
      <Section id="class" number="07" title="The Full LinkedList Class — Everything Assembled">
        <CodeBlock
          title="linked_list.py"
          code={`class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None                      # empty list = head is None

    def push_front(self, value):              # O(1)
        new = Node(value)
        new.next = self.head
        self.head = new

    def append(self, value):                  # O(n): must walk to the end
        new = Node(value)
        if self.head is None:                 # empty? new node IS the head
            self.head = new
            return
        current = self.head
        while current.next is not None:       # walk to the LAST node
            current = current.next
        current.next = new                    # hook the new wagon on

    def __repr__(self):                       # draw the chain
        parts, current = [], self.head
        while current is not None:
            parts.append(str(current.value))
            current = current.next
        return " -> ".join(parts) + " -> None"

ll = LinkedList()
ll.append("b"); ll.append("c")
ll.push_front("a")
print(ll)`}
          output={`a -> b -> c -> None`}
        />
        <Callout type="tip">
          Real engines keep a <IC>self.tail</IC> pointer too, so <IC>append</IC> becomes O(1)
          (rewire <IC>tail.next</IC>, update <IC>tail</IC>) — no walk needed. That&apos;s exactly
          how a queue stays fast, as you&apos;ll see on the next page.
        </Callout>
      </Section>

      {/* 08 ─ REVERSE */}
      <Section id="reverse" number="08" title="Reverse a Linked List — THE Interview Classic ⭐">
        <P>
          Asked at every company since the dawn of time. The idea: walk the chain once,{" "}
          <strong>flipping each arrow to point backwards</strong>. You need 3 fingers:{" "}
          <IC>prev</IC>, <IC>current</IC>, <IC>nxt</IC>.
        </P>
        <CodeBlock
          title="reverse.py"
          code={`def reverse(head):
    prev = None                  # nothing behind us yet
    current = head
    while current is not None:
        nxt = current.next       # ① save the rest BEFORE breaking the arrow
        current.next = prev      # ② FLIP: point backwards
        prev = current           # ③ slide prev forward
        current = nxt            # ④ slide current forward (via saved arrow)
    return prev                  # prev ends on the old LAST node = new head

head = reverse(head)             # a→b→c   becomes   c→b→a`}
          output={`c -> b -> a -> None`}
        />
        <CodeBlock
          title="reverse_trace.txt"
          runnable={false}
          code={`START        prev=✕   current=[a]──▶[b]──▶[c]✕

round 1   ① nxt=[b]   ② flip:  ✕◀──[a]   ③④ slide
             ✕◀──[a]      prev=[a]  current=[b]──▶[c]✕

round 2   ① nxt=[c]   ② flip:  [a]◀──[b]
             ✕◀──[a]◀──[b]   prev=[b]  current=[c]✕

round 3   ① nxt=✕     ② flip:  [b]◀──[c]
             ✕◀──[a]◀──[b]◀──[c]   prev=[c]  current=✕ → loop ends

RETURN prev:   head ──▶ [c]──▶[b]──▶[a]✕     reversed in place, O(n) time, O(1) space ✅`}
        />
        <Callout type="mistake">
          Step ① is the whole game: flip the arrow <em>before</em> saving <IC>current.next</IC> and
          the rest of the chain floats away unreachable. Memorize the 4-line chant:{" "}
          <strong>save → flip → slide prev → slide current</strong>.
        </Callout>
      </Section>

      {/* 09 ─ VARIANTS */}
      <Section id="variants" number="09" title="Doubly & Circular — The Same Idea With More Arrows">
        <CodeBlock
          title="variants.txt"
          runnable={false}
          code={`SINGLY (this page)        one arrow per node, walk forward only
  head ──▶ [a]──▶[b]──▶[c]✕

DOUBLY                    two arrows: next AND prev — walk both ways
         ┌──────┐ ┌──────┐
  ✕◀─[a]◀┘ [a]─▶└▶[b] ...      each node: │prev│value│next│
  head ─▶ [a]⇄[b]⇄[c] ◀─ tail
  → delete a node you're STANDING on (you can see backwards!)
  → this is Python's collections.deque & browser history

CIRCULAR                  last node points back to the first — no None!
  head ──▶ [a]──▶[b]──▶[c]──┐
            ▲───────────────┘
  → music playlist on repeat, round-robin turn-taking
  ⚠️ "while current is not None" NEVER ENDS here — loop until you see head again`}
        />
        <Table
          head={["Variant", "Arrows per node", "Superpower", "Real example"]}
          rows={[
            ["Singly", "1 (next)", "simplest, least memory", "this page"],
            ["Doubly", "2 (next + prev)", "walk backwards, O(1) delete-self", "browser back/forward, deque"],
            ["Circular", "1 or 2, tail→head", "endless cycling", "playlist repeat, round-robin scheduler"],
          ]}
        />
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Crashes & Traps">
        <P>
          <strong>Crash 1 — the empty list.</strong> Almost every linked-list bug is{" "}
          <IC>NoneType</IC> related, and the empty list is the #1 trigger:
        </P>
        <CodeBlock
          title="crash_empty.py"
          code={`ll = LinkedList()        # head is None — no boxes at all
print(ll.head.value)     # 💀 asking None for .value`}
          error
          output={`Traceback (most recent call last):
  File "crash_empty.py", line 2, in <module>
AttributeError: 'NoneType' object has no attribute 'value'

Fix: guard first →  if ll.head is not None: ...
EVERY linked-list function must survive the empty list.`}
        />
        <P>
          <strong>Crash 2 — walking one hop too far.</strong>
        </P>
        <CodeBlock
          title="crash_overshoot.py"
          code={`# find the LAST node — wrong stop condition:
current = head
while current is not None:     # walks until current IS None...
    current = current.next
print(current.value)           # 💀 current is None now!

# Correct: stop while standing ON the last node
# while current.next is not None:   → ends ON [c], not past it`}
          error
          output={`Traceback (most recent call last):
  File "crash_overshoot.py", line 5, in <module>
AttributeError: 'NoneType' object has no attribute 'value'

"is not None" → ends PAST the last node (good for visiting all)
"next is not None" → ends ON the last node (good for appending)
Pick the right one for the job.`}
        />
        <P>
          <strong>Trap 3 — an accidental cycle = infinite loop.</strong> No crash, no error… your
          program just never finishes:
        </P>
        <CodeBlock
          title="trap_cycle.py"
          code={`a.next = b
b.next = a            # 💀 oops — b points BACK at a

current = a
while current is not None:    # None never comes: a→b→a→b→a...
    print(current.value)
    current = current.next`}
          error
          output={`a
b
a
b
a
... (forever — Ctrl+C to kill it)

Interview follow-up: detect a cycle with Floyd's algorithm —
two fingers, one moving 1 hop, one moving 2 hops.
If they ever land on the same node → there's a loop. O(n), O(1) space.`}
        />
        <P>
          <strong>Trap 4 — losing the head</strong> (silent data loss, no exception):
        </P>
        <CodeBlock
          title="trap_lost_head.py"
          code={`# print the list... using head itself as the walker:
while head is not None:
    print(head.value)
    head = head.next     # 💀 head slides off the end...

print(head)              # the entire list is now unreachable`}
          error
          output={`a
b
c
None   ← head is gone. a, b, c have zero references → garbage collected.

No crash. No warning. Just gone. ALWAYS walk with a copy: current = head`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Node =", "value + next (a reference to the next Node, or None)"],
            ["head", "the only entry point — lose it, lose the whole list"],
            ["End of chain", "next is None (✕ in the diagrams)"],
            ["Traversal chant", "current = head; while current is not None: current = current.next"],
            ["Insert front", "new.next = head, THEN head = new — O(1)"],
            ["Insert order rule", "connect the NEW node first, break the old link last"],
            ["Delete", "prev.next = prev.next.next (skip it) — GC eats the orphan"],
            ["Delete by value", "stop ONE node BEFORE the victim (can't look back)"],
            ["Reverse chant", "save → flip → slide prev → slide current; return prev"],
            ["vs Python list", "list: O(1) index, O(n) front-insert · linked: opposite"],
            ["#1 crash", "AttributeError: 'NoneType' has no attribute — guard the empty list"],
            ["Cycle detection", "Floyd: slow 1-hop + fast 2-hop fingers; meet → cycle"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
