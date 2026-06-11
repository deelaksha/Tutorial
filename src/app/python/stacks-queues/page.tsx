"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "two-rules", label: "Two Rules, Two Structures" },
  { id: "stack", label: "Stack — LIFO ⭐" },
  { id: "stack-uses", label: "Where Stacks Run Your Life" },
  { id: "balanced", label: "Worked: Balanced Brackets ⭐" },
  { id: "queue", label: "Queue — FIFO ⭐" },
  { id: "deque", label: "deque — The Right Tool" },
  { id: "queue-uses", label: "Where Queues Run Your Life" },
  { id: "compare", label: "Stack vs Queue Side by Side" },
  { id: "exceptions", label: "💥 Crashes & Traps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function StacksQueuesPage() {
  return (
    <TopicShell
      icon="🥞"
      title="Stacks & Queues — Order of Service"
      gradientWord="Stacks"
      subtitle="Two structures, one difference: WHICH item leaves first. Stack = last-in-first-out (plates). Queue = first-in-first-out (a line at the counter). That one rule powers undo, browser back, BFS, printers and your call stack."
      nav={NAV}
      next={{ icon: "🌳", label: "Trees", href: "/python/trees" }}
    >
      {/* 01 ─ TWO RULES */}
      <Section id="two-rules" number="01" title="Two Rules, Two Structures">
        <P>
          Both are just &quot;a pile you add to and remove from&quot;. The <em>only</em> question:
          when you remove, <strong>which end does the item come from?</strong>
        </P>
        <CodeBlock
          title="the_difference.txt"
          runnable={false}
          code={`STACK 🥞 — add & remove at the SAME end (the top)        LIFO: Last In, First Out

      push ▼   ▲ pop
            ┌─────┐
            │  c  │ ← newest — leaves FIRST
            ├─────┤
            │  b  │
            ├─────┤
            │  a  │ ← oldest — leaves LAST
            └─────┘

QUEUE 🚶 — add at the BACK, remove from the FRONT         FIFO: First In, First Out

  enqueue ▶ ┌─────┬─────┬─────┐ ▶ dequeue
   (back)   │  c  │  b  │  a  │   (front)
            └─────┴─────┴─────┘
              newest      oldest — leaves FIRST (fair!)`}
        />
        <Callout type="analogy">
          🥞 Stack = a pile of plates: you can only take the one you put down last.
          🚶 Queue = the line at a ticket counter: whoever arrived first is served first. Stack is
          &quot;most recent wins&quot;, queue is &quot;fairness&quot;.
        </Callout>
        <Callout type="note">
          Why so simple? <strong>Restrictions are the feature.</strong> By forbidding access to the
          middle, both structures guarantee every operation is O(1) — and they make code that
          <em>needs</em> a service order impossible to get wrong.
        </Callout>
      </Section>

      {/* 02 ─ STACK */}
      <Section id="stack" number="02" title="Stack — push, pop, peek ⭐">
        <P>
          In Python a stack needs zero new machinery: a plain <IC>list</IC> where you only touch{" "}
          <strong>the end</strong>. <IC>append</IC> = push, <IC>pop()</IC> = pop — both O(1) (Big-O
          cheat sheet!).
        </P>
        <CodeBlock
          title="stack.py"
          code={`stack = []

stack.append("a")     # push: a
stack.append("b")     # push: a b
stack.append("c")     # push: a b c   ← c is on TOP

print(stack[-1])      # peek: look at the top WITHOUT removing
print(stack.pop())    # pop:  removes & returns the TOP (newest)
print(stack.pop())
print(stack)`}
          output={`c
c
b
['a']`}
        />
        <CodeBlock
          title="stack_trace.txt"
          runnable={false}
          code={`push "a"     push "b"     push "c"      pop() → "c"    pop() → "b"

                            ┌─────┐
              ┌─────┐       │  c  │◀top   ┌─────┐
┌─────┐       │  b  │◀top   ├─────┤       │  b  │◀top   ┌─────┐
│  a  │◀top   ├─────┤       │  b  │       ├─────┤       │  a  │◀top
└─────┘       │  a  │       ├─────┤       │  a  │       └─────┘
              └─────┘       │  a  │       └─────┘
                            └─────┘
Only the TOP is ever touched. Bottom plate "a" waits the longest.`}
        />
        <Table
          head={["Operation", "Python", "Big-O", "Meaning"]}
          rows={[
            ["push x", "stack.append(x)", "O(1)", "new plate on top"],
            ["pop", "stack.pop()", "O(1)", "remove & return top plate"],
            ["peek", "stack[-1]", "O(1)", "look at top, leave it there"],
            ["empty?", "len(stack) == 0  (or: not stack)", "O(1)", "any plates left?"],
          ]}
        />
        <Callout type="behind">
          Sound familiar? The <strong>call stack</strong> from the Recursion page IS this exact
          structure: calling a function pushes a frame, returning pops it. Python runs your entire
          program on a stack — you&apos;ve been using one all along.
        </Callout>
      </Section>

      {/* 03 ─ STACK USES */}
      <Section id="stack-uses" number="03" title="Where Stacks Run Your Life">
        <Table
          head={["Feature", "What gets pushed", "What pop means"]}
          rows={[
            ["Ctrl+Z undo", "every edit you make", "undo the MOST RECENT edit first"],
            ["Browser back button", "every page you visit", "back = pop to the previous page"],
            ["Function calls", "each call's frame", "return = pop, resume the caller"],
            ["Editor bracket matching", "every ( [ { seen", "a closer must match the LAST opener"],
            ["DFS (Graphs page, soon)", "rooms to explore", "always go deeper into the newest room"],
          ]}
        />
        <CodeBlock
          title="undo.py"
          code={`history = []                      # the undo stack

def type_text(doc, text):
    history.append(doc)           # push the OLD state before changing
    return doc + text

doc = ""
doc = type_text(doc, "Hello")
doc = type_text(doc, " World")
doc = type_text(doc, "!!!")
print("now:", repr(doc))

doc = history.pop()               # Ctrl+Z — most recent state first
print("undo:", repr(doc))
doc = history.pop()               # Ctrl+Z again
print("undo:", repr(doc))`}
          output={`now: 'Hello World!!!'
undo: 'Hello World'
undo: 'Hello'`}
        />
      </Section>

      {/* 04 ─ BALANCED */}
      <Section id="balanced" number="04" title="Worked Example: Balanced Brackets ⭐ (Interview Favourite)">
        <P>
          &quot;Is <IC>{"([{}])"}</IC> balanced?&quot; — asked everywhere, and it&apos;s a pure
          stack problem: every closer must match the <strong>most recent</strong> unmatched opener.
          &quot;Most recent first&quot; = LIFO = stack.
        </P>
        <CodeBlock
          title="balanced.py"
          code={`def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)              # opener → push it
        elif ch in ")]}":
            if not stack:                 # closer but nothing open?
                return False
            if stack.pop() != pairs[ch]:  # top opener must MATCH
                return False
    return not stack                      # balanced only if nothing left open

print(is_balanced("([{}])"))
print(is_balanced("(]"))
print(is_balanced("((("))`}
          output={`True
False
False`}
        />
        <CodeBlock
          title="balanced_trace.txt"
          runnable={false}
          code={`input: ( [ { } ] )

char (  → push      stack: (
char [  → push      stack: ( [
char {  → push      stack: ( [ {
char }  → pop { ✓   stack: ( [        } matches { ✓
char ]  → pop [ ✓   stack: (          ] matches [ ✓
char )  → pop ( ✓   stack: (empty)    ) matches ( ✓
end: stack empty → BALANCED ✅

input: ( ]
char (  → push      stack: (
char ]  → pop ( ✗   "(" is not "[" → NOT balanced ❌`}
        />
        <Callout type="tip">
          The three fail-modes map to the three checks: wrong closer (<IC>pop mismatch</IC>),
          closer with nothing open (<IC>pop from empty</IC>), opener never closed (
          <IC>stack not empty at the end</IC>). Interviewers probe all three — the trace above shows
          each.
        </Callout>
      </Section>

      {/* 05 ─ QUEUE */}
      <Section id="queue" number="05" title="Queue — enqueue at the Back, dequeue at the Front ⭐">
        <P>
          A queue serves in arrival order. Naively that&apos;s a list with{" "}
          <IC>append</IC> + <IC>pop(0)</IC>… but remember the Big-O page:{" "}
          <IC>pop(0)</IC> shifts every remaining item — <strong>O(n), the trap!</strong>
        </P>
        <CodeBlock
          title="naive_queue.py"
          code={`queue = []
queue.append("amy")      # amy arrives
queue.append("bob")      # amy bob
queue.append("cara")     # amy bob cara

print(queue.pop(0))      # serve the FRONT — but O(n): bob & cara SHIFT left
print(queue.pop(0))
print(queue)`}
          output={`amy
bob
['cara']

(works, but every pop(0) shifts the whole line — slow for big queues)`}
        />
        <CodeBlock
          title="queue_trace.txt"
          runnable={false}
          code={`enqueue amy    enqueue bob     enqueue cara         dequeue → amy

front                                              front
 ┌─────┐      ┌─────┬─────┐   ┌─────┬─────┬─────┐   ┌─────┬─────┐
 │ amy │      │ amy │ bob │   │ amy │ bob │ cara│   │ bob │ cara│
 └─────┘      └─────┴─────┘   └─────┴─────┴─────┘   └─────┴─────┘
                       back                back      amy served first —
                                                     she arrived first. FAIR.`}
        />
      </Section>

      {/* 06 ─ DEQUE */}
      <Section id="deque" number="06" title="collections.deque — The Right Tool for Queues">
        <P>
          Python ships the fix: <IC>collections.deque</IC> (&quot;deck&quot;, double-ended queue) —
          a doubly linked chain under the hood (last page!), so <strong>both ends are O(1)</strong>.
        </P>
        <CodeBlock
          title="deque_queue.py"
          code={`from collections import deque

queue = deque()
queue.append("amy")        # enqueue at the back  — O(1)
queue.append("bob")
queue.append("cara")

print(queue.popleft())     # dequeue from the FRONT — O(1), no shifting!
print(queue.popleft())
print(queue)`}
          output={`amy
bob
deque(['cara'])`}
        />
        <Table
          head={["Operation", "list", "deque"]}
          rows={[
            ["add at back", "append — ⚡ O(1)", "append — ⚡ O(1)"],
            ["remove from front", "pop(0) — 🐌 O(n) shift!", "popleft — ⚡ O(1)"],
            ["add at front", "insert(0, x) — 🐌 O(n)", "appendleft — ⚡ O(1)"],
            ["remove from back", "pop() — ⚡ O(1)", "pop — ⚡ O(1)"],
            ["read middle [i]", "⚡ O(1)", "🐌 O(n) — it's a chain!"],
          ]}
        />
        <Callout type="tip">
          ⭐ The rule to memorize: <strong>stack → plain list. Queue → deque.</strong> A list is a
          shelf (great at the end, terrible at the front); a deque is a doubly linked chain (great
          at both ends, terrible in the middle). Same trade-off story as the whole track.
        </Callout>
        <Callout type="behind">
          Bonus: <IC>deque(maxlen=3)</IC> auto-evicts from the far end when full — a free
          &quot;last 3 items&quot; rolling buffer, used for logs and moving averages:{" "}
          <IC>deque([2,3,4], maxlen=3)</IC> after appending 1,2,3,4.
        </Callout>
      </Section>

      {/* 07 ─ QUEUE USES */}
      <Section id="queue-uses" number="07" title="Where Queues Run Your Life">
        <Table
          head={["Feature", "Who enqueues", "Why FIFO matters"]}
          rows={[
            ["Printer jobs", "every document sent", "first sent prints first — no queue-jumping"],
            ["Keyboard buffer", "each keypress", "letters must appear in typed order"],
            ["Web server requests", "each incoming user", "serve users in arrival order"],
            ["Task queues (Celery, SQS)", "background jobs", "process work in submission order"],
            ["BFS (Graphs page, soon)", "neighbouring rooms", "explore CLOSEST rooms first"],
          ]}
        />
        <CodeBlock
          title="printer.py"
          code={`from collections import deque

jobs = deque()
jobs.append("report.pdf")        # 9:00 — Deelaksha sends a report
jobs.append("photo.png")         # 9:01
jobs.append("ticket.pdf")        # 9:02

while jobs:                      # printer works through the line
    printing = jobs.popleft()    # always the OLDEST job
    print(f"🖨️ printing {printing}  (waiting: {list(jobs)})")`}
          output={`🖨️ printing report.pdf  (waiting: ['photo.png', 'ticket.pdf'])
🖨️ printing photo.png  (waiting: ['ticket.pdf'])
🖨️ printing ticket.pdf  (waiting: [])`}
        />
      </Section>

      {/* 08 ─ COMPARE */}
      <Section id="compare" number="08" title="Stack vs Queue — Side by Side">
        <Table
          head={["", "Stack 🥞", "Queue 🚶"]}
          rows={[
            ["Rule", "LIFO — newest out first", "FIFO — oldest out first"],
            ["Add", "push → top (append)", "enqueue → back (append)"],
            ["Remove", "pop ← top (pop())", "dequeue ← front (popleft)"],
            ["Python tool", "plain list", "collections.deque"],
            ["Personality", "\"most recent first\" — undo, back, calls", "\"fairness\" — printers, servers, lines"],
            ["Graph algorithm", "DFS (dive deep)", "BFS (ripple outward)"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "Need to revisit the MOST RECENT thing?", sub: "undo, matching, backtrack → STACK" },
            { label: "Need to serve in ARRIVAL order?", sub: "jobs, requests, fairness → QUEUE" },
          ]}
        />
        <CodeBlock
          title="same_input_different_order.py"
          code={`from collections import deque

for_stack = ["a", "b", "c"]
for_queue = deque(["a", "b", "c"])

stack_out = [for_stack.pop() for _ in range(3)]        # LIFO
queue_out = [for_queue.popleft() for _ in range(3)]    # FIFO

print("stack served:", stack_out)
print("queue served:", queue_out)`}
          output={`stack served: ['c', 'b', 'a']
queue served: ['a', 'b', 'c']

Same arrivals. The ONLY difference is the rule. That's the whole topic.`}
        />
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Crashes & Traps">
        <P>
          <strong>Crash 1 — pop from an empty stack/queue.</strong> The classic:
        </P>
        <CodeBlock
          title="crash_empty_pop.py"
          code={`stack = []
stack.pop()             # 💀 nothing to pop`}
          error
          output={`Traceback (most recent call last):
  File "crash_empty_pop.py", line 2, in <module>
IndexError: pop from empty list

deque version says:  IndexError: pop from an empty deque
Fix: guard first →   if stack: stack.pop()
(remember the balanced-brackets check: "if not stack: return False")`}
        />
        <P>
          <strong>Trap 2 — using pop() when you meant popleft().</strong> No crash — just silently
          wrong order:
        </P>
        <CodeBlock
          title="trap_wrong_end.py"
          code={`from collections import deque
jobs = deque(["report.pdf", "photo.png", "ticket.pdf"])

print(jobs.pop())       # 💀 served the NEWEST job — queue-jumping!
                        # wanted popleft() — the person waiting longest`}
          error
          output={`ticket.pdf

No exception. The 9:02 job printed before the 9:00 job.
Wrong-end bugs don't crash — they just betray the order rule.
pop() = back (stack behaviour) · popleft() = front (queue behaviour)`}
        />
        <P>
          <strong>Trap 3 — list.pop(0) at scale.</strong> Correct output, hidden O(n²) (the Big-O
          page&apos;s trap, live):
        </P>
        <CodeBlock
          title="trap_pop0.py"
          code={`import time
from collections import deque

n = 100_000
lst, dq = list(range(n)), deque(range(n))

t = time.time()
while lst: lst.pop(0)          # shifts ~n items EVERY pop → O(n²)
print(f"list.pop(0):    {time.time()-t:.2f}s")

t = time.time()
while dq: dq.popleft()         # O(1) each → O(n)
print(f"deque.popleft:  {time.time()-t:.2f}s")`}
          output={`list.pop(0):    1.74s
deque.popleft:  0.01s

Same result, 170× slower. The interview red flag: pop(0) in a loop.`}
        />
        <P>
          <strong>Trap 4 — mutating while iterating.</strong>
        </P>
        <CodeBlock
          title="crash_mutate_iterate.py"
          code={`from collections import deque
jobs = deque(["a", "b", "c"])

for job in jobs:          # iterating...
    jobs.popleft()        # 💀 ...while shrinking it`}
          error
          output={`Traceback (most recent call last):
  File "crash_mutate_iterate.py", line 4, in <module>
RuntimeError: deque mutated during iteration

Fix — drain with while instead:
    while jobs:
        job = jobs.popleft()`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Stack", "LIFO — Last In, First Out (plates 🥞)"],
            ["Queue", "FIFO — First In, First Out (waiting line 🚶)"],
            ["Stack in Python", "plain list: append = push, pop() = pop, [-1] = peek"],
            ["Queue in Python", "collections.deque: append = enqueue, popleft = dequeue"],
            ["NEVER for queues", "list.pop(0) — O(n) shift every time → O(n²) loops"],
            ["All core ops", "O(1) — that's the entire point of restricting access"],
            ["Stack powers", "undo, browser back, call stack, bracket matching, DFS"],
            ["Queue powers", "printers, request handling, task queues, BFS"],
            ["Balanced brackets", "openers push; closer must match pop; end = empty stack"],
            ["Empty pop", "IndexError: pop from empty list / empty deque — guard with if stack:"],
            ["Wrong-end bug", "pop() vs popleft() — no crash, silently wrong order"],
            ["Drain pattern", "while q: item = q.popleft() — never mutate inside for"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
