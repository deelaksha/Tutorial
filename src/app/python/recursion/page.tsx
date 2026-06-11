"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What Even Is Recursion?" },
  { id: "stack", label: "The Call Stack ⭐" },
  { id: "base-case", label: "The Base Case — Stop Sign ⭐" },
  { id: "countdown", label: "countdown(3) — Full Trace" },
  { id: "factorial", label: "factorial(4) — Both Directions ⭐" },
  { id: "sum-list", label: "Sum a List Recursively" },
  { id: "think", label: "How to THINK Recursively" },
  { id: "fibonacci", label: "Fibonacci — The Tree 🌳" },
  { id: "memo", label: "Memoization — The Fix ⭐" },
  { id: "vs-loop", label: "Recursion vs Loop" },
  { id: "exceptions", label: "💥 RecursionError" },
  { id: "patterns", label: "Classic Patterns" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function RecursionPage() {
  return (
    <TopicShell
      icon="🌀"
      title="Recursion — From Absolute Zero"
      gradientWord="Recursion"
      subtitle="A function that calls itself sounds like black magic until you SEE the call stack. This page draws every frame, every call, every return — assuming you know nothing. By the end, recursion will feel mechanical, not magical."
      nav={NAV}
      next={{ icon: "🔗", label: "Linked Lists", href: "/python/linked-lists" }}
    >
      {/* 01 ─ WHAT */}
      <Section id="what" number="01" title="What Even Is Recursion? (Start Here If You Know Nothing)">
        <P>
          You already know a function can call <em>another</em> function:
        </P>
        <CodeBlock
          title="normal.py"
          code={`def make_tea():
    boil_water()      # one function calling ANOTHER function
    add_tea_leaves()

make_tea()`}
          output={`(water boils, leaves added — nothing weird here)`}
        />
        <P>
          Recursion is just one tiny twist on that: <strong>a function that calls itself</strong>.
        </P>
        <CodeBlock
          title="recursion.py"
          code={`def greet():
    print("hello")
    greet()        # ← the function calls ITSELF

greet()`}
          output={`hello
hello
hello
... (forever — well, almost. We'll crash soon. Keep reading.)`}
          error
        />
        <Callout type="analogy">
          🪞 Stand between two mirrors: you see yourself, holding a mirror, showing yourself,
          holding a mirror… Recursion is a function whose body contains a smaller copy of the same
          job. The mirrors go &quot;forever&quot; — code can&apos;t, which is why we&apos;ll need a{" "}
          <strong>stop sign</strong> (section 03).
        </Callout>
        <Callout type="behind">
          There is NO special Python keyword for recursion. <IC>greet()</IC> inside{" "}
          <IC>greet</IC> is treated exactly like any other function call. Python doesn&apos;t even
          notice it&apos;s &quot;the same&quot; function — it just calls whatever name you wrote.
          That&apos;s the whole secret: recursion is ordinary function calls, nothing more.
        </Callout>
        <P>
          Why would anyone want this? Because many problems are naturally{" "}
          <strong>&quot;a big thing made of a smaller copy of itself&quot;</strong>:
        </P>
        <Table
          head={["Problem", "The smaller copy hiding inside it"]}
          rows={[
            ["Folders on your computer", "a folder contains... folders (which contain folders...)"],
            ["factorial(5) = 5×4×3×2×1", "it's just 5 × factorial(4)"],
            ["Sum of [3,1,4,1,5]", "it's just 3 + sum of [1,4,1,5]"],
            ["A family tree", "each person's tree = their own two parents' trees"],
            ["Russian matryoshka doll 🪆", "open it: a smaller identical doll inside"],
          ]}
        />
      </Section>

      {/* 02 ─ CALL STACK */}
      <Section id="stack" number="02" title="The Call Stack — Where Recursion Actually Lives ⭐">
        <P>
          To understand recursion you must first see what Python does on <em>every</em> function
          call (recursive or not). Python keeps a pile of &quot;sticky notes&quot; called the{" "}
          <strong>call stack</strong>. Each call gets its own note (a <strong>frame</strong>) with
          its own variables.
        </P>
        <CodeBlock
          title="three_calls.py"
          code={`def a():
    print("a starts")
    b()                 # a PAUSES here, waits for b
    print("a ends")

def b():
    print("b starts")
    c()                 # b PAUSES here, waits for c
    print("b ends")

def c():
    print("c runs")

a()`}
          output={`a starts
b starts
c runs
b ends
a ends`}
        />
        <CodeBlock
          title="the_stack_growing.txt"
          runnable={false}
          code={`Time →   call a()      a calls b()     b calls c()     c finishes    b finishes

          ┌───────┐     ┌───────┐       ┌───────┐
          │       │     │       │       │ c()   │ ← top runs,
          │       │     ├───────┤       ├───────┤   others WAIT
          │       │     │ b()   │       │ b()⏸  │       ┌───────┐
          ├───────┤     ├───────┤       ├───────┤       │ b()   │ ← resumes  ┌───────┐
          │ a()   │     │ a()⏸  │       │ a()⏸  │       ├───────┤            │ a()   │ ← resumes
          └───────┘     └───────┘       └───────┘       │ a()⏸  │            └───────┘
                                                        └───────┘
          stack grows DOWN→UP when calling, shrinks UP→DOWN when returning`}
        />
        <Callout type="analogy">
          🥞 A stack of plates. New call = new plate ON TOP. Only the TOP plate is &quot;running&quot;
          — every plate below it is frozen mid-sentence, waiting. When the top plate finishes, you
          remove it, and the plate below <strong>resumes exactly where it paused</strong>.
        </Callout>
        <Callout type="tip">
          ⭐ Here is the entire trick of recursion in one sentence:{" "}
          <strong>
            when a function calls itself, Python simply puts ANOTHER plate on the stack — a second,
            completely independent copy with its own variables.
          </strong>{" "}
          The two copies don&apos;t share anything. <IC>n</IC> in one frame and <IC>n</IC> in another
          frame are different sticky notes.
        </Callout>
      </Section>

      {/* 03 ─ BASE CASE */}
      <Section id="base-case" number="03" title="The Base Case — The Stop Sign ⭐">
        <P>
          Our <IC>greet()</IC> from section 01 stacked plates forever and crashed. Every working
          recursive function needs exactly two ingredients:
        </P>
        <FlowDiagram
          steps={[
            { label: "1. Base case", sub: "the SMALLEST input, answered directly — NO self-call" },
            { label: "2. Recursive case", sub: "shrink the problem + call yourself on the smaller piece" },
          ]}
        />
        <CodeBlock
          title="anatomy.py"
          code={`def countdown(n):
    if n == 0:              # ① BASE CASE: the stop sign.
        print("Liftoff!")   #    Answer directly, do NOT call yourself.
        return

    print(n)                # ② RECURSIVE CASE:
    countdown(n - 1)        #    do a tiny bit of work, then call yourself
                            #    on a SMALLER problem (n-1, not n!)

countdown(3)`}
          output={`3
2
1
Liftoff!`}
        />
        <Callout type="mistake">
          The recursive call must move <strong>toward</strong> the base case.{" "}
          <IC>countdown(n - 1)</IC> shrinks n → eventually hits 0 → stops.{" "}
          <IC>countdown(n)</IC> (forgot the -1) never shrinks → infinite plates → 💥{" "}
          <IC>RecursionError</IC>. Always ask: &quot;does each call get CLOSER to the base
          case?&quot;
        </Callout>
        <Callout type="analogy">
          🪆 Matryoshka dolls again: &quot;open the doll&quot; = recursive case. The tiny solid doll
          at the center that doesn&apos;t open = base case. No solid doll at the center → you&apos;d
          be opening dolls forever.
        </Callout>
      </Section>

      {/* 04 ─ COUNTDOWN TRACE */}
      <Section id="countdown" number="04" title="countdown(3) — Every Single Step, Drawn">
        <P>
          Let&apos;s run <IC>countdown(3)</IC> in slow motion and draw the stack at every moment.
          Read this until it&apos;s boring — that&apos;s how you know you got it.
        </P>
        <CodeBlock
          title="trace_phase1_calling.txt"
          runnable={false}
          code={`PHASE 1 — CALLS (stack grows, plates pile up)

step 1: countdown(3)            step 2: 3 printed,        step 3: 2 printed,
        n=3, prints 3,                  countdown(2)              countdown(1)
        calls countdown(2)              calls countdown(1)        calls countdown(0)

   ┌──────────────┐               ┌──────────────┐          ┌──────────────┐
   │ countdown(3) │               │ countdown(2) │          │ countdown(1) │
   │ n = 3   ⏸    │               │ n = 2   ⏸    │          │ n = 1   ⏸    │
   └──────────────┘               ├──────────────┤          ├──────────────┤
                                  │ countdown(3) │          │ countdown(2) │
                                  │ n = 3   ⏸    │          │ n = 2   ⏸    │
                                  └──────────────┘          ├──────────────┤
                                                            │ countdown(3) │
   printed so far: 3              printed: 3 2              │ n = 3   ⏸    │
                                                            └──────────────┘
                                                            printed: 3 2 1`}
        />
        <CodeBlock
          title="trace_phase2_returning.txt"
          runnable={false}
          code={`step 4: countdown(0) — BASE CASE HIT          PHASE 2 — RETURNS (plates removed)

   ┌──────────────┐ ← n==0 → prints           countdown(0) returns → plate off
   │ countdown(0) │   "Liftoff!" and          countdown(1) resumes... but it has
   │ n = 0  BASE! │   returns. NO new          nothing after the call → returns
   ├──────────────┤   call!                   countdown(2) same → returns
   │ countdown(1) │                           countdown(3) same → returns
   │ n = 1   ⏸    │
   ├──────────────┤                                  ┌──────────────┐
   │ countdown(2) │                                  │ countdown(3) │ → gone
   │ n = 2   ⏸    │                                  └──────────────┘
   ├──────────────┤                                  stack empty. Program done.
   │ countdown(3) │
   │ n = 3   ⏸    │      FINAL OUTPUT:  3  2  1  Liftoff!
   └──────────────┘`}
        />
        <Callout type="behind">
          Four separate frames existed, each with its <strong>own</strong> <IC>n</IC> (3, 2, 1, 0)
          at the same time. They never overwrote each other. Maximum stack height was 4 plates =
          why we say countdown uses <strong>O(n) space</strong> — recursion isn&apos;t free, every
          pending call holds memory (you met space complexity on the Big-O page).
        </Callout>
        <Callout type="tip">
          Try it yourself: move <IC>print(n)</IC> to <strong>after</strong> the recursive call and
          you get <IC>1 2 3</IC> instead of <IC>3 2 1</IC> — because the prints now happen during
          Phase 2 (unwinding) instead of Phase 1 (calling). Work <em>before</em> the self-call runs
          on the way down; work <em>after</em> it runs on the way back up.
        </Callout>
        <CodeBlock
          title="countup.py"
          code={`def countup(n):
    if n == 0:
        print("Ignition!")
        return
    countup(n - 1)   # ← go ALL the way down first...
    print(n)         # ← ...then print while coming back UP

countup(3)`}
          output={`Ignition!
1
2
3`}
        />
      </Section>

      {/* 05 ─ FACTORIAL */}
      <Section id="factorial" number="05" title="factorial(4) — Values Going Down, Answers Bubbling Up ⭐">
        <P>
          Countdown only printed. Real recursion usually <strong>returns values</strong> — each
          frame hands its answer to the frame below it. The classic: factorial.{" "}
          <IC>4! = 4×3×2×1 = 24</IC>. The insight: <IC>4! = 4 × 3!</IC> — a smaller copy of itself.
        </P>
        <CodeBlock
          title="factorial.py"
          code={`def factorial(n):
    if n == 1:                      # base case: 1! is just 1
        return 1
    return n * factorial(n - 1)     # n! = n × (n-1)!

print(factorial(4))`}
          output={`24`}
        />
        <CodeBlock
          title="factorial_trace.txt"
          runnable={false}
          code={`PHASE 1 — going DOWN (each call waits for the one above)

factorial(4)  = 4 * factorial(3)        ← waiting for factorial(3)...
                    factorial(3) = 3 * factorial(2)        ← waiting...
                                       factorial(2) = 2 * factorial(1)   ← waiting...
                                                          factorial(1) = 1   BASE CASE!

PHASE 2 — answers bubble back UP (each waiter gets its number)

                                                          factorial(1) returns 1
                                       factorial(2) = 2 * 1  → returns 2
                    factorial(3) = 3 * 2  → returns 6
factorial(4)  = 4 * 6  → returns 24   ✅

The multiplication 4 * ... could not happen until the inner call finished.
Every frame was frozen at the * sign, holding its own n, waiting.`}
        />
        <CodeBlock
          title="factorial_stack.txt"
          runnable={false}
          code={`deepest moment:                 unwinding:

┌────────────────────┐
│ factorial(1) → 1   │──┐
├────────────────────┤  │ returns 1
│ factorial(2)       │◀─┘
│ n=2, paused at     │──┐
│ "2 * ___"          │  │ returns 2*1 = 2
├────────────────────┤  │
│ factorial(3)       │◀─┘
│ n=3, paused at     │──┐
│ "3 * ___"          │  │ returns 3*2 = 6
├────────────────────┤  │
│ factorial(4)       │◀─┘
│ n=4, paused at     │────▶ returns 4*6 = 24  →  print(24)
│ "4 * ___"          │
└────────────────────┘`}
        />
        <Callout type="mistake">
          #1 beginner bug: writing <IC>n * factorial(n - 1)</IC> but forgetting the{" "}
          <IC>return</IC>. Without <IC>return</IC>, the frame computes the value and throws it
          away, handing back <IC>None</IC> — and you get{" "}
          <IC>TypeError: unsupported operand type(s) for *: &apos;int&apos; and &apos;NoneType&apos;</IC>.
          Every path in a value-returning recursive function must <IC>return</IC>.
        </Callout>
        <Callout type="behind">
          Trust exercise: when writing <IC>factorial(4)</IC>, do NOT mentally simulate all 4 frames.
          Just trust that <IC>factorial(3)</IC> &quot;somehow&quot; gives 6, and ask: &quot;is{" "}
          <IC>4 * 6</IC> the right answer? Yes.&quot; This is called the{" "}
          <strong>recursive leap of faith</strong> — verify the base case + verify one step, and the
          stack handles the rest.
        </Callout>
      </Section>

      {/* 06 ─ SUM LIST */}
      <Section id="sum-list" number="06" title="Sum a List Recursively — Shrinking Data Instead of a Number">
        <P>
          So far we shrank a <em>number</em> (n → n-1). You can also shrink <em>data</em>: a list
          gets smaller by slicing off its first element.
        </P>
        <CodeBlock
          title="sum_list.py"
          code={`def total(nums):
    if nums == []:                    # base case: empty list sums to 0
        return 0
    return nums[0] + total(nums[1:])  # first item + sum of THE REST

print(total([3, 1, 4, 1, 5]))`}
          output={`14`}
        />
        <CodeBlock
          title="sum_trace.txt"
          runnable={false}
          code={`total([3, 1, 4, 1, 5])
 = 3 + total([1, 4, 1, 5])
       = 1 + total([4, 1, 5])
             = 4 + total([1, 5])
                   = 1 + total([5])
                         = 5 + total([])
                               = 0          ← base case!
                         = 5 + 0 = 5
                   = 1 + 5     = 6
             = 4 + 6           = 10
       = 1 + 10                = 11
 = 3 + 11                      = 14  ✅`}
        />
        <Callout type="note">
          The recursive recipe is always the same sentence:{" "}
          <strong>&quot;answer = (one piece) combined with (recursion on the rest)&quot;</strong>.
          Factorial: n × rest. Sum: first + rest. Length: 1 + rest. Max:{" "}
          <IC>max(first, rest)</IC>. Once you see the sentence, you can write dozens of these.
        </Callout>
        <Callout type="behind">
          Honest Big-O note (from the previous page!): <IC>nums[1:]</IC>{" "}
          <strong>copies</strong> the rest of the list — O(n) per call → O(n²) total. Fine for
          learning; in production you&apos;d pass an index (<IC>total(nums, i+1)</IC>) or just use{" "}
          <IC>sum(nums)</IC>. Recursion here is for understanding, not speed.
        </Callout>
      </Section>

      {/* 07 ─ HOW TO THINK */}
      <Section id="think" number="07" title="How to THINK Recursively — The 3-Question Recipe">
        <P>
          Stop trying to imagine the whole stack. Professionals write recursion by answering three
          questions, in this order:
        </P>
        <FlowDiagram
          steps={[
            { label: "Q1: smallest input?", sub: "n==0? empty list? one node? → return its answer directly" },
            { label: "Q2: one step smaller?", sub: "n-1, list[1:], node.next, left/right child..." },
            { label: "Q3: combine?", sub: "how do I build MY answer from the smaller answer?" },
          ]}
        />
        <CodeBlock
          title="recipe_applied.py"
          code={`# Goal: count the digits of a number, e.g. 5049 → 4

# Q1 smallest input?   a single digit (n < 10) → answer is 1
# Q2 one step smaller? n // 10 chops off the last digit (5049 → 504)
# Q3 combine?          my answer = 1 + answer for the chopped number

def digits(n):
    if n < 10:                  # Q1
        return 1
    return 1 + digits(n // 10)  # Q3 ( Q2 inside )

print(digits(5049))
print(digits(7))`}
          output={`4
1`}
        />
        <Callout type="tip">
          ⭐ Then verify with the <strong>leap of faith</strong>: base case right? (7 → 1 ✓). One
          step right, assuming the inner call works? (digits(5049) = 1 + digits(504); if
          digits(504)=3 then 1+3=4 ✓). Done — you never traced the stack, and the function is
          correct. Tracing (sections 04–06) is for <em>understanding</em>; the 3 questions are for{" "}
          <em>writing</em>.
        </Callout>
      </Section>

      {/* 08 ─ FIBONACCI */}
      <Section id="fibonacci" number="08" title="Fibonacci — When One Function Calls Itself TWICE 🌳">
        <P>
          Fibonacci numbers: each number is the sum of the previous two.{" "}
          <IC>0, 1, 1, 2, 3, 5, 8, 13, 21...</IC> The definition is born recursive — but with{" "}
          <strong>two</strong> self-calls, the stack picture becomes a <strong>tree</strong>:
        </P>
        <CodeBlock
          title="fib.py"
          code={`def fib(n):
    if n <= 1:                       # base cases: fib(0)=0, fib(1)=1
        return n
    return fib(n - 1) + fib(n - 2)   # TWO recursive calls!

print([fib(i) for i in range(8)])`}
          output={`[0, 1, 1, 2, 3, 5, 8, 13]`}
        />
        <CodeBlock
          title="fib5_call_tree.txt"
          runnable={false}
          code={`                          fib(5)
                        /        \\
                  fib(4)          fib(3)
                 /      \\        /      \\
            fib(3)     fib(2)  fib(2)   fib(1)=1
           /     \\     /    \\   /    \\
       fib(2)  fib(1) f(1) f(0) f(1) f(0)
       /    \\    =1    =1   =0   =1   =0
    fib(1) fib(0)
      =1     =0

Count the calls: fib(5) triggers 15 calls.
fib(3) is computed 2 times. fib(2): 3 times. fib(1): 5 times!
Same question, answered again and again and again.`}
        />
        <Table
          head={["n", "number of calls fib(n) makes", "feels like"]}
          rows={[
            ["10", "177", "instant"],
            ["20", "21,891", "instant"],
            ["30", "2,692,537", "~0.3 s — noticeable"],
            ["35", "29,860,703", "~3 s — annoying"],
            ["50", "~40,730,022,147", "~hours 💀"],
          ]}
        />
        <Callout type="mistake">
          This is <strong>O(2ⁿ)</strong> — the bottom row of the Big-O page&apos;s table, the one
          marked &quot;run away&quot;. Each level of the tree roughly doubles the calls. The
          algorithm isn&apos;t wrong, it&apos;s <em>wasteful</em>: it re-solves the same
          subproblems millions of times.
        </Callout>
      </Section>

      {/* 09 ─ MEMOIZATION */}
      <Section id="memo" number="09" title="Memoization — Remember Answers, Kill the Tree ⭐">
        <P>
          The fix is almost embarrassing: <strong>write answers down</strong>. Before computing,
          check a dict: &quot;did I already solve fib(30)?&quot; If yes, return it instantly —
          O(1) dict lookup (Big-O page, cheat sheet row 2).
        </P>
        <CodeBlock
          title="fib_memo.py"
          code={`memo = {}                       # our notebook: {n: answer}

def fib(n):
    if n in memo:               # already solved? just look it up
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n - 1) + fib(n - 2)   # solve ONCE, write it down
    return memo[n]

print(fib(50))
print(fib(500))   # would take longer than the universe without memo`}
          output={`12586269025
139423224561697880139724382870407283950070256587697307264108962948325571622863290691557658876222521294125`}
        />
        <CodeBlock
          title="memo_tree.txt"
          runnable={false}
          code={`The tree COLLAPSES into a line:

  fib(5)
    └ fib(4)
        └ fib(3)
            └ fib(2)
                └ fib(1)=1, fib(0)=0     ← real work happens once per n
            fib(1) → memo hit ✓
        fib(2) → memo hit ✓              ← right branches become instant
    fib(3) → memo hit ✓                    dictionary lookups

calls for fib(5):  15  →  9   (and only 6 do real work)
calls for fib(50): 40 billion → 99.        O(2ⁿ) → O(n)  🚀`}
        />
        <CodeBlock
          title="fib_cached.py"
          code={`from functools import lru_cache   # Python's built-in memo notebook

@lru_cache(maxsize=None)          # one decorator line = automatic memoization
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(300))`}
          output={`222232244629420445529739893461909967206666939096499764990979600`}
        />
        <Callout type="tip">
          ⭐ Interview gold: &quot;naive fib is O(2ⁿ); add memoization and it becomes O(n) because
          each subproblem is solved exactly once.&quot; Memoization is step 1 of{" "}
          <strong>dynamic programming</strong> — if you understood this section, you&apos;ve already
          started DP.
        </Callout>
      </Section>

      {/* 10 ─ VS LOOP */}
      <Section id="vs-loop" number="10" title="Recursion vs Loop — When to Use Which">
        <P>
          Anything a loop can do, recursion can do, and vice-versa. So when does each win?
        </P>
        <CodeBlock
          title="same_job.py"
          code={`# factorial as a LOOP            # factorial as RECURSION
def fact_loop(n):
    result = 1                    # def fact_rec(n):
    for i in range(2, n + 1):     #     if n == 1:
        result *= i               #         return 1
    return result                 #     return n * fact_rec(n - 1)

print(fact_loop(5))   # 120 — same answer, same O(n) time`}
          output={`120`}
        />
        <Table
          head={["", "Loop", "Recursion"]}
          rows={[
            ["Memory", "O(1) — one variable", "O(n) — one stack frame per call"],
            ["Speed", "faster (no call overhead)", "slower per step (frame setup)"],
            ["Crash risk", "none", "RecursionError past ~1000 deep"],
            ["Flat data (list, range)", "✅ natural", "possible but pointless"],
            ["Nested data (trees, folders, JSON)", "painful — manual stack needed", "✅ natural — the code mirrors the shape"],
            ["Interviews", "fine", "expected for trees/graphs/backtracking"],
          ]}
        />
        <Callout type="tip">
          Rule of thumb: <strong>flat → loop, nested → recursion</strong>. Counting to a million?
          Loop. Walking a folder tree of unknown depth, or the Trees page coming up next? Recursion
          — because the data itself is recursive, the recursive code is 3 lines where the loop
          version is 20.
        </Callout>
        <Callout type="behind">
          Some languages optimize tail recursion into a loop automatically.{" "}
          <strong>Python deliberately does NOT</strong> — Guido chose honest stack traces over
          tail-call optimization. So in Python, deep flat recursion really does cost frames.
        </Callout>
      </Section>

      {/* 11 ─ EXCEPTIONS */}
      <Section id="exceptions" number="11" title="💥 RecursionError — Every Way It Breaks">
        <P>
          <strong>Crash 1 — no base case at all.</strong> The plates never stop stacking. Python
          gives up at ~1000 frames:
        </P>
        <CodeBlock
          title="crash_no_base.py"
          code={`def greet():
    print("hello")
    greet()          # no stop sign anywhere

greet()`}
          error
          output={`hello
hello
... (≈1000 hellos later)
Traceback (most recent call last):
  File "crash_no_base.py", line 5, in <module>
  File "crash_no_base.py", line 3, in greet
  File "crash_no_base.py", line 3, in greet
  [Previous line repeated 996 more times]
RecursionError: maximum recursion depth exceeded`}
        />
        <P>
          <strong>Crash 2 — base case exists but is never reached.</strong> The sneaky one: you{" "}
          <em>wrote</em> a stop sign, but the input steps over it:
        </P>
        <CodeBlock
          title="crash_unreachable.py"
          code={`def countdown(n):
    if n == 0:          # stop sign at exactly 0...
        return
    print(n)
    countdown(n - 1)

countdown(2.5)          # 2.5 → 1.5 → 0.5 → -0.5 → ... never EQUALS 0!`}
          error
          output={`2.5
1.5
0.5
-0.5
-1.5
...
RecursionError: maximum recursion depth exceeded

Fix: write the base case as  if n <= 0:  — a net, not a tightrope.`}
        />
        <P>
          <strong>Crash 3 — the problem never shrinks.</strong>
        </P>
        <CodeBlock
          title="crash_no_shrink.py"
          code={`def total(nums):
    if nums == []:
        return 0
    return nums[0] + total(nums)   # 💀 passed the SAME list, not nums[1:]

total([1, 2, 3])`}
          error
          output={`RecursionError: maximum recursion depth exceeded

Every call got [1, 2, 3] again. Same problem, forever.
The recursive call MUST receive a smaller input.`}
        />
        <P>
          <strong>Not a crash, but a head-scratcher — forgetting return:</strong>
        </P>
        <CodeBlock
          title="bug_no_return.py"
          code={`def factorial(n):
    if n == 1:
        return 1
    n * factorial(n - 1)    # 💀 computed... then thrown away. No return!

print(factorial(4))`}
          error
          output={`Traceback (most recent call last):
  File "bug_no_return.py", line 6, in <module>
  File "bug_no_return.py", line 4, in factorial
TypeError: unsupported operand type(s) for *: 'int' and 'NoneType'

factorial(1) returned 1 fine, but factorial(2) returned None
(no return statement) → factorial(3) tried  3 * None  → boom.`}
        />
        <P>
          <strong>The depth limit itself</strong> — even <em>correct</em> recursion crashes if the
          data is too deep:
        </P>
        <CodeBlock
          title="depth_limit.py"
          code={`import sys
print(sys.getrecursionlimit())     # Python's default plate limit

def countdown(n):
    if n <= 0:
        return
    countdown(n - 1)

countdown(998)      # fine — fits under the limit
countdown(5000)     # correct code, but too many plates!`}
          error
          output={`1000
Traceback (most recent call last):
  ...
RecursionError: maximum recursion depth exceeded

Escape hatches:
  sys.setrecursionlimit(10000)   # raise the limit (risky: real crash if RAM runs out)
  ...or rewrite as a loop        # the professional fix for deep FLAT recursion`}
        />
        <Callout type="behind">
          The ~1000 limit is a <strong>safety net, not a wall</strong>. Python could stack far more
          frames, but a runaway recursion would then eat gigabytes before dying. Capping at 1000
          turns &quot;my laptop froze&quot; into a clean, readable <IC>RecursionError</IC> in
          milliseconds. Note the traceback even tells you:{" "}
          <IC>[Previous line repeated 996 more times]</IC> — Python pointing at your missing stop
          sign.
        </Callout>
      </Section>

      {/* 12 ─ PATTERNS */}
      <Section id="patterns" number="12" title="Classic Patterns You'll Reuse in Trees & Graphs">
        <P>
          <strong>Pattern 1 — transform &amp; combine</strong> (reverse a string):
        </P>
        <CodeBlock
          title="reverse.py"
          code={`def reverse(s):
    if s == "":                      # base: empty string reversed is itself
        return ""
    return reverse(s[1:]) + s[0]     # reverse the REST, stick first char at the END

print(reverse("stack"))

# reverse("stack") = reverse("tack") + "s"
#                  = (reverse("ack") + "t") + "s"
#                  = ((reverse("ck") + "a") + "t") + "s"
#                  = ... = "kcat" + "s"`}
          output={`kcats`}
        />
        <P>
          <strong>Pattern 2 — recursion on NESTED data</strong> — this is where loops give up and
          recursion shines. Sum a list that contains lists that contain lists…:
        </P>
        <CodeBlock
          title="nested_sum.py"
          code={`def deep_sum(item):
    if isinstance(item, int):          # base: a plain number IS the answer
        return item
    return sum(deep_sum(x) for x in item)   # a list: deep_sum every element

data = [1, [2, 3], [4, [5, [6]]], 7]
print(deep_sum(data))

# A loop can't do this cleanly — you don't know the nesting depth!
# Recursion doesn't care: each level is just "the same problem, smaller".`}
          output={`28`}
        />
        <P>
          <strong>Pattern 3 — explore all choices</strong> (a taste of backtracking — every subset
          of a list):
        </P>
        <CodeBlock
          title="subsets.py"
          code={`def subsets(items):
    if items == []:
        return [[]]                       # one subset of nothing: the empty set
    rest = subsets(items[1:])             # all subsets WITHOUT the first item
    return rest + [[items[0]] + r for r in rest]   # ...plus all WITH it

print(subsets([1, 2, 3]))`}
          output={`[[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]]`}
        />
        <Callout type="note">
          These three patterns power the rest of the DSA track: the Trees page is pattern 2 (a tree
          node contains... smaller trees), graph DFS is pattern 3 (explore every road). If recursion
          clicked here, those pages will feel like reruns.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Recursion =", "a function that calls itself on a SMALLER problem"],
            ["2 required parts", "base case (stop sign) + recursive case (shrink & self-call)"],
            ["Call stack", "each call = new plate with its OWN variables; only top runs"],
            ["Base case missing/unreachable", "RecursionError: maximum recursion depth exceeded"],
            ["Default depth limit", "~1000 frames (sys.getrecursionlimit / setrecursionlimit)"],
            ["Work before self-call", "happens on the way DOWN (countdown: 3 2 1)"],
            ["Work after self-call", "happens on the way UP (countup: 1 2 3)"],
            ["Forgot return →", "TypeError: int * NoneType"],
            ["3-question recipe", "smallest input? one step smaller? how to combine?"],
            ["Naive fib(n)", "O(2ⁿ) — call tree doubles; recomputes same answers"],
            ["Memoization", "dict of solved answers → O(2ⁿ) becomes O(n); @lru_cache"],
            ["Loop vs recursion", "flat data → loop; nested data (trees/folders) → recursion"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
