"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why Sorting Matters" },
  { id: "linear", label: "Linear Search" },
  { id: "binary", label: "Binary Search ⭐" },
  { id: "binary-trace", label: "Binary Search — Full Trace" },
  { id: "bubble", label: "Bubble Sort — Learn the Idea" },
  { id: "selection-insertion", label: "Selection & Insertion" },
  { id: "merge", label: "Merge Sort — Divide & Conquer ⭐" },
  { id: "builtin", label: "Python's sorted() ⭐" },
  { id: "key", label: "The key= Superpower" },
  { id: "exceptions", label: "💥 Crashes & Traps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SortingSearchingPage() {
  return (
    <TopicShell
      icon="🔀"
      title="Sorting & Searching — Order Out of Chaos"
      gradientWord="Sorting"
      subtitle="The grand finale of the DSA track: why sorted data unlocks O(log n) search, how the classic sorts actually move items (drawn pass by pass), and why in real Python you'll call sorted() — but must still explain merge sort in interviews."
      nav={NAV}
      next={{ icon: "🐍", label: "All Python Topics", href: "/python" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why Sorting Matters — It's a Search Accelerator">
        <P>
          Nobody sorts for beauty. You sort because <strong>sorted data unlocks faster
          everything</strong> — the dictionary trick: nobody could find words in a dictionary with
          shuffled pages:
        </P>
        <CodeBlock
          title="sorted_unlocks.txt"
          runnable={false}
          code={`UNSORTED  [38, 7, 92, 14, 55, 21, 70]      find 55? check one by one. O(n).

SORTED    [7, 14, 21, 38, 55, 70, 92]      find 55? jump to the middle,
                                           discard half each time. O(log n)!

what sorted data unlocks:
  • binary search          O(n) → O(log n)      (this page)
  • min / max              first & last element  O(1)
  • duplicates             equal items sit side by side
  • median / percentiles   the middle element
  • "closest value to X"   neighbors of where X would be

Sort once: O(n log n).  Then search 1000 times at O(log n) each.
That trade is the whole reason sorting is a famous problem.`}
        />
        <Callout type="note">
          This page closes the loop with the Big-O page: there you <em>used</em> the claim
          &quot;binary search is O(log n)&quot;. Today you build it, trace it, and meet the sorts
          that make it possible.
        </Callout>
      </Section>

      {/* 02 ─ LINEAR */}
      <Section id="linear" number="02" title="Linear Search — The Honest Baseline">
        <CodeBlock
          title="linear_search.py"
          code={`def linear_search(items, target):
    for i, item in enumerate(items):   # check every box, left to right
        if item == target:
            return i                   # found: report the position
    return -1                          # checked everything: not here

nums = [38, 7, 92, 14, 55, 21, 70]
print(linear_search(nums, 55))
print(linear_search(nums, 99))`}
          output={`4
-1`}
        />
        <CodeBlock
          title="linear_trace.txt"
          runnable={false}
          code={`find 55:   [38, 7, 92, 14, 55, 21, 70]
            ❌  ❌  ❌  ❌  ✅            5 checks

find 99:    ❌  ❌  ❌  ❌  ❌  ❌  ❌    7 checks — must touch EVERYTHING
                                        to prove absence. O(n).`}
        />
        <Callout type="tip">
          Linear search is not &quot;bad&quot; — it&apos;s the only option for{" "}
          <strong>unsorted</strong> data, it&apos;s what <IC>in</IC> does on a list, and for small
          n it beats everything. It becomes wrong only when the data is sorted (use binary) or
          searched repeatedly (use a set).
        </Callout>
      </Section>

      {/* 03 ─ BINARY */}
      <Section id="binary" number="03" title="Binary Search — Halve Until Found ⭐">
        <P>
          Requirement: <strong>data must be sorted</strong>. Strategy: look at the middle. Too
          small? The whole left half is useless — discard it. Repeat on the survivor half:
        </P>
        <CodeBlock
          title="binary_search.py"
          code={`def binary_search(items, target):    # items MUST be sorted!
    lo, hi = 0, len(items) - 1       # the search window: [lo .. hi]
    while lo <= hi:                  # while the window isn't empty
        mid = (lo + hi) // 2         # middle of the window
        if items[mid] == target:
            return mid               # 🎯 found
        elif items[mid] < target:
            lo = mid + 1             # too small → discard LEFT half
        else:
            hi = mid - 1             # too big   → discard RIGHT half
    return -1                        # window shrank to nothing: absent

nums = [7, 14, 21, 38, 55, 70, 92]
print(binary_search(nums, 55))
print(binary_search(nums, 8))`}
          output={`4
-1`}
        />
        <Table
          head={["Items", "Linear (worst)", "Binary (worst)"]}
          rows={[
            ["7", "7 checks", "3 checks"],
            ["1,000", "1,000", "10"],
            ["1,000,000", "1,000,000", "20"],
            ["1,000,000,000", "1,000,000,000", "30 ⭐"],
          ]}
        />
        <Callout type="analogy">
          🎲 The number-guessing game from the Big-O page, now as code: &quot;guess my number,
          1–100&quot; → you say 50, not 1. <IC>lo</IC> and <IC>hi</IC> are the &quot;it&apos;s
          between…&quot; bounds shrinking after every &quot;higher/lower&quot;.
        </Callout>
      </Section>

      {/* 04 ─ BINARY TRACE */}
      <Section id="binary-trace" number="04" title="Binary Search, Drawn — Watch the Window Shrink">
        <CodeBlock
          title="binary_trace.txt"
          runnable={false}
          code={`find 55 in [7, 14, 21, 38, 55, 70, 92]

round 1:   lo=0           mid=3            hi=6
           [ 7   14   21   38   55   70   92 ]
                           ▲
           38 < 55 → target is RIGHT → lo = mid+1 = 4
           [ 🗑️   🗑️   🗑️   🗑️   55   70   92 ]   half the list: gone in 1 check!

round 2:   lo=4  mid=5  hi=6
           [  .    .    .    .   55   70   92 ]
                                      ▲
           70 > 55 → target is LEFT → hi = mid-1 = 4

round 3:   lo=4  mid=4  hi=4
           [  .    .    .    .   55 ]
                                  ▲
           55 == 55 → return 4 ✅      3 checks total (linear took 5)

find 8 (absent):  mid=38→left · mid=14→left · mid=7→right
                  now lo=1 > hi=0 → window EMPTY → return -1
                  absence proven in 3 checks, not 7. ⭐`}
        />
        <Callout type="mistake">
          The classic off-by-one farm: use <IC>lo &lt;= hi</IC> (not <IC>&lt;</IC>) or you skip
          1-element windows; move to <IC>mid + 1</IC> / <IC>mid - 1</IC> (not <IC>mid</IC>) or the
          window stops shrinking → infinite loop. When in doubt, hand-trace a 2-element list — it
          exposes both bugs instantly.
        </Callout>
        <Callout type="behind">
          Python ships it: <IC>import bisect; bisect.bisect_left(nums, 55)</IC> → the index where 55
          lives (or would belong). Use that in real code; write the loop in interviews.
        </Callout>
      </Section>

      {/* 05 ─ BUBBLE */}
      <Section id="bubble" number="05" title="Bubble Sort — The Teaching Sort, Pass by Pass">
        <P>
          Now the other side: <em>producing</em> sorted data. Bubble sort is the simplest idea:
          walk the list, <strong>swap any neighbors that are out of order</strong>, repeat until a
          pass makes no swaps. Big values &quot;bubble up&quot; to the end:
        </P>
        <CodeBlock
          title="bubble.py"
          code={`def bubble_sort(items):
    n = len(items)
    for p in range(n - 1):                  # up to n-1 passes
        swapped = False
        for i in range(n - 1 - p):          # walk the unsorted part
            if items[i] > items[i + 1]:     # neighbors out of order?
                items[i], items[i + 1] = items[i + 1], items[i]   # swap!
                swapped = True
        if not swapped:                     # full pass, zero swaps → done early
            break
    return items

print(bubble_sort([38, 7, 92, 14, 55]))`}
          output={`[7, 14, 38, 55, 92]`}
        />
        <CodeBlock
          title="bubble_trace.txt"
          runnable={false}
          code={`PASS 1  [38,  7, 92, 14, 55]   compare 38,7  → swap   [7, 38, 92, 14, 55]
        [7, 38, 92, 14, 55]    compare 38,92 → ok
        [7, 38, 92, 14, 55]    compare 92,14 → swap   [7, 38, 14, 92, 55]
        [7, 38, 14, 92, 55]    compare 92,55 → swap   [7, 38, 14, 55, 92]
                                       92 bubbled to the END — its final home 🔒

PASS 2  [7, 38, 14, 55 │ 92]   38,14 swap → [7, 14, 38, 55 │ 92]
                               38,55 ok → 55 locked 🔒

PASS 3  [7, 14, 38 │ 55, 92]   no swaps at all → ALREADY SORTED, stop early ✅

Each pass: one more big value locked at the end, one shorter walk.
n passes × n comparisons = O(n²) — the Big-O trap, on purpose this time.`}
        />
        <Callout type="note">
          Nobody ships bubble sort. You learn it because (1) it&apos;s the gentlest introduction to
          &quot;sorts move items by comparing&quot;, and (2) &quot;why is bubble sort O(n²)?&quot;
          is a warm-up interview question — the answer is the nested loop you can now see.
        </Callout>
      </Section>

      {/* 06 ─ SELECTION & INSERTION */}
      <Section id="selection-insertion" number="06" title="Selection & Insertion — Two More O(n²) Personalities">
        <P>
          Same speed class as bubble, different strategies — and insertion sort hides a real-world
          superpower:
        </P>
        <CodeBlock
          title="selection_insertion.txt"
          runnable={false}
          code={`SELECTION SORT — "find the smallest, put it first, repeat"

  [38, 7, 92, 14, 55]   scan all → smallest 7  → swap to front  [7 │ 38, 92, 14, 55]
  [7 │ 38, 92, 14, 55]  scan rest → smallest 14 → swap          [7, 14 │ 92, 38, 55]
  [7, 14 │ 92, 38, 55]  smallest 38 → swap                      [7, 14, 38 │ 92, 55]
  [7, 14, 38 │ 92, 55]  smallest 55 → swap                      [7, 14, 38, 55 │ 92] ✅
   sorted part grows from the LEFT; n scans of the rest = O(n²) always.

INSERTION SORT — "like sorting cards in your hand 🃏"

  [38 │ 7, 92, 14, 55]   take 7  → slide left past 38           [7, 38 │ 92, 14, 55]
  [7, 38 │ 92, 14, 55]   take 92 → already in place             [7, 38, 92 │ 14, 55]
  [7, 38, 92 │ 14, 55]   take 14 → slide past 92, 38            [7, 14, 38, 92 │ 55]
  [7, 14, 38, 92 │ 55]   take 55 → slide past 92                [7, 14, 38, 55, 92] ✅
   each new card slides LEFT into its spot in the sorted hand.`}
        />
        <Table
          head={["Sort", "Strategy", "Worst", "Already-sorted input", "Notable"]}
          rows={[
            ["Bubble", "swap bad neighbors, repeat", "O(n²)", "O(n) with early-exit", "teaching only"],
            ["Selection", "repeatedly pick the minimum", "O(n²)", "O(n²) — scans anyway 🐌", "fewest swaps (n)"],
            ["Insertion", "slide each item into the sorted part", "O(n²)", "⚡ O(n) — nothing slides!", "great on nearly-sorted data"],
          ]}
        />
        <Callout type="behind">
          That last column is why insertion sort survives in production:{" "}
          <strong>real data is often nearly sorted</strong> (yesterday&apos;s list + a few new
          rows). Python&apos;s built-in sort (Timsort) literally uses insertion sort for small/
          nearly-sorted runs — your toy sort lives inside CPython.
        </Callout>
      </Section>

      {/* 07 ─ MERGE */}
      <Section id="merge" number="07" title="Merge Sort — Divide & Conquer, O(n log n) ⭐">
        <P>
          The leap from O(n²) to O(n log n) needs a new idea — and it&apos;s the Recursion page&apos;s
          recipe: <strong>split the list in half, sort each half (recursively!), then merge two
          sorted halves</strong> — which is easy, like zipping two sorted card piles:
        </P>
        <CodeBlock
          title="merge_sort.py"
          code={`def merge_sort(items):
    if len(items) <= 1:                  # base case: 0/1 items = already sorted
        return items
    mid = len(items) // 2
    left = merge_sort(items[:mid])       # trust: left comes back sorted
    right = merge_sort(items[mid:])      # trust: right comes back sorted
    return merge(left, right)            # combine two sorted lists

def merge(a, b):                         # zip two SORTED lists into one
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:                 # take the smaller front card
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:])                    # one side ran out: dump the rest
    out.extend(b[j:])
    return out

print(merge_sort([38, 7, 92, 14, 55, 21, 70, 3]))`}
          output={`[3, 7, 14, 21, 38, 55, 70, 92]`}
        />
        <CodeBlock
          title="merge_sort_tree.txt"
          runnable={false}
          code={`SPLIT (recursion going down)              MERGE (answers coming back up)

[38, 7, 92, 14, 55, 21, 70, 3]            [3, 7, 14, 21, 38, 55, 70, 92] ✅
       /             \\                          ▲              ▲
[38, 7, 92, 14]  [55, 21, 70, 3]          [7, 14, 38, 92]  [3, 21, 55, 70]
   /      \\         /      \\                 ▲       ▲       ▲       ▲
[38, 7] [92, 14] [55, 21] [70, 3]         [7, 38] [14, 92] [21, 55] [3, 70]
  /  \\    /  \\     /  \\    /  \\              ▲       ▲       ▲       ▲
[38] [7] [92][14] [55][21] [70][3]         single cards: base case, sorted by definition

WHY O(n log n):   log n levels (8→4→2→1: 3 halvings)
                × O(n) merge work per level
                = n log n.   For n=1,000,000: 20 million steps, not a TRILLION (n²).`}
        />
        <CodeBlock
          title="merge_zip.txt"
          runnable={false}
          code={`merging [7, 38] and [14, 92]:        two sorted piles, take the smaller top:

  a:[7, 38]  b:[14, 92]   7 < 14  → take 7    out: [7]
  a:[38]     b:[14, 92]   38 > 14 → take 14   out: [7, 14]
  a:[38]     b:[92]       38 < 92 → take 38   out: [7, 14, 38]
  a:[]       b:[92]       a empty → dump b    out: [7, 14, 38, 92] ✅
  each item touched once → merge is O(n)`}
        />
        <Callout type="tip">
          ⭐ Interview script: &quot;Merge sort splits in half log n times; each level merges n
          items; total O(n log n) — and it&apos;s <em>stable</em> (equal items keep their order).
          Trade-off: O(n) extra memory for the merge lists.&quot; Those three sentences cover 90%
          of merge-sort questions.
        </Callout>
      </Section>

      {/* 08 ─ BUILTIN */}
      <Section id="builtin" number="08" title="Real Python: sorted() and .sort() ⭐">
        <P>
          In actual code you write none of the above. Python&apos;s built-in{" "}
          <strong>Timsort</strong> (merge sort + insertion sort hybrid, invented for Python) is
          O(n log n), stable, and brutally optimized in C:
        </P>
        <CodeBlock
          title="builtin.py"
          code={`nums = [38, 7, 92, 14, 55]

print(sorted(nums))              # NEW sorted list — original untouched
print(nums)                      # still scrambled!

nums.sort()                      # in-place: modifies nums itself...
print(nums)
print(nums.sort())               # ⚠️ ...and returns None! (classic gotcha)

print(sorted(nums, reverse=True))           # descending
print(sorted("deelaksha"))                  # any iterable → always a LIST`}
          output={`[7, 14, 38, 55, 92]
[38, 7, 92, 14, 55]
[7, 14, 38, 55, 92]
None
[92, 55, 38, 14, 7]
['a', 'a', 'd', 'e', 'e', 'h', 'k', 'l', 's']`}
        />
        <Table
          head={["", "sorted(x)", "x.sort()"]}
          rows={[
            ["Returns", "a NEW list", "None — sorts in place"],
            ["Original", "untouched", "modified"],
            ["Works on", "any iterable (str, set, dict, generator)", "lists only"],
            ["Use when", "you need to keep the original / not a list", "big list, don't need the original (saves memory)"],
          ]}
        />
        <Callout type="mistake">
          The #1 sorting bug in beginner Python: <IC>nums = nums.sort()</IC> → nums is now{" "}
          <IC>None</IC>, and the next line explodes with{" "}
          <IC>TypeError: &apos;NoneType&apos; object is not subscriptable</IC>. Either{" "}
          <IC>nums.sort()</IC> alone, or <IC>nums = sorted(nums)</IC>. Never mixed.
        </Callout>
      </Section>

      {/* 09 ─ KEY */}
      <Section id="key" number="09" title="The key= Superpower — Sort Anything by Anything">
        <P>
          <IC>key=</IC> takes a function; Python sorts by <strong>what the function returns</strong>{" "}
          instead of the items themselves. This one parameter replaces entire comparator classes in
          other languages:
        </P>
        <CodeBlock
          title="key.py"
          code={`words = ["banana", "Fig", "apple", "Date"]
print(sorted(words))                     # ⚠️ capitals first ('F' < 'a' in Unicode)
print(sorted(words, key=str.lower))      # case-insensitive: compare lowercased
print(sorted(words, key=len))            # shortest first

students = [("deelaksha", 92), ("amy", 78), ("bob", 92), ("cara", 85)]
print(sorted(students, key=lambda s: s[1], reverse=True))   # by score, high→low

# STABLE sort bonus: bob & deelaksha both have 92 —
# they keep their original relative order. Sort by score, ties stay fair.`}
          output={`['Date', 'Fig', 'apple', 'banana']
['apple', 'banana', 'Date', 'Fig']
['Fig', 'Date', 'apple', 'banana']
[('deelaksha', 92), ('bob', 92), ('cara', 85), ('amy', 78)]`}
        />
        <CodeBlock
          title="multi_key.py"
          code={`# sort by score DESC, then name ASC for ties — tuple keys do both at once:
print(sorted(students, key=lambda s: (-s[1], s[0])))

# tuples compare element by element: first -score (so 92 beats 85),
# then name alphabetically for equal scores. ⭐ The interview one-liner.`}
          output={`[('bob', 92), ('deelaksha', 92), ('cara', 85), ('amy', 78)]`}
        />
        <Callout type="behind">
          The key function is called <strong>once per item</strong> (n calls), the results cached,
          then comparisons run on the cache — so even an expensive key is paid only n times, not
          n log n times. This is the &quot;decorate-sort-undecorate&quot; pattern, built in.
        </Callout>
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Crashes & Traps">
        <P>
          <strong>Crash 1 — mixed types.</strong> Sorting needs every pair comparable:
        </P>
        <CodeBlock
          title="crash_mixed.py"
          code={`sorted([3, "ten", 1])     # 💀 is "ten" < 3 ?`}
          error
          output={`Traceback (most recent call last):
  File "crash_mixed.py", line 1, in <module>
TypeError: '<' not supported between instances of 'str' and 'int'

Same crash family as the BST page — comparisons power everything.
Fix: convert first (key=str), or clean your data (the ML data-prep lesson!).`}
        />
        <P>
          <strong>Trap 2 — binary search on UNSORTED data.</strong> No crash — confidently wrong
          answers:
        </P>
        <CodeBlock
          title="trap_unsorted_binary.py"
          code={`nums = [38, 7, 92, 14, 55]        # NOT sorted!
print(binary_search(nums, 55))    # 💀 mid=92 → "55 < 92, go left" → wrong half
print(binary_search(nums, 38))    # sometimes it works by luck — worse!`}
          error
          output={`-1
-1

55 IS in the list. Binary search's halving logic assumes order;
on unsorted data its 'discards' throw away the target.
The precondition is YOUR job: sort first, or use 'in' / linear search.`}
        />
        <P>
          <strong>Trap 3 — nums = nums.sort().</strong> The None ambush, one line later:
        </P>
        <CodeBlock
          title="crash_sort_none.py"
          code={`nums = [38, 7, 92]
nums = nums.sort()       # .sort() returns None!
print(nums[0])           # 💀`}
          error
          output={`Traceback (most recent call last):
  File "crash_sort_none.py", line 3, in <module>
TypeError: 'NoneType' object is not subscriptable

nums.sort()  → in place, returns None — never assign it.
nums = sorted(nums)  → returns the list — assign away.`}
        />
        <P>
          <strong>Trap 4 — sorting a dict sorts only its keys.</strong>
        </P>
        <CodeBlock
          title="trap_dict_sort.py"
          code={`scores = {"deelaksha": 92, "amy": 78, "cara": 85}

print(sorted(scores))             # ⚠️ just the KEYS, alphabetically!

# what you usually want — items sorted BY VALUE:
print(sorted(scores.items(), key=lambda kv: kv[1], reverse=True))`}
          error
          output={`['amy', 'cara', 'deelaksha']
[('deelaksha', 92), ('cara', 85), ('amy', 78)]

Iterating a dict yields keys — so sorted(dict) is sorted keys.
Leaderboards need .items() + key=lambda kv: kv[1].`}
        />
        <P>
          <strong>Trap 5 — believing O(n log n) is always worth it.</strong>
        </P>
        <CodeBlock
          title="trap_sort_for_max.py"
          code={`nums = list(range(1_000_000))

biggest = sorted(nums)[-1]     # 💀 O(n log n) work...
biggest = max(nums)            # ...for an O(n) question!

# Same smell:  sorted(nums)[0]      → min(nums)
#              sorted(nums)[:3]     → heapq.nsmallest(3, nums)
# Sorting answers "give me EVERYTHING in order".
# If you only need ONE thing, there's usually an O(n) tool.`}
          output={`(both give 999999 — one does 20× the work)`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Why sort?", "sorted data unlocks O(log n) search, O(1) min/max, adjacent dupes"],
            ["Linear search", "O(n) — only option on unsorted data; what 'in' does on lists"],
            ["Binary search", "sorted only! lo/hi window, halve via mid — O(log n)"],
            ["Binary off-by-ones", "while lo <= hi; move to mid±1 (or: infinite loop)"],
            ["1 billion items", "binary search: ~30 checks"],
            ["Bubble/Selection/Insertion", "O(n²) — but insertion is O(n) on nearly-sorted data"],
            ["Merge sort", "split in half, recurse, zip-merge — O(n log n), stable, O(n) extra space"],
            ["Why n log n", "log n levels of splitting × O(n) merging per level"],
            ["sorted(x) vs x.sort()", "new list vs in-place-returning-None (never assign .sort()!)"],
            ["Python's engine", "Timsort = merge + insertion hybrid, O(n log n), stable"],
            ["key= tricks", "key=str.lower, key=len, key=lambda s: (-s[1], s[0]) for multi-sort"],
            ["Only need min/max/top-k?", "max(), min(), heapq — don't sort everything"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
