"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, MemoryDiagram, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "create", label: "Creating Lists" },
  { id: "index-slice", label: "Indexing & Slicing" },
  { id: "add", label: "Adding Items" },
  { id: "remove", label: "Removing Items" },
  { id: "update-sort", label: "Update & Sort" },
  { id: "copy-trap", label: "The Copy Trap ⭐" },
  { id: "builtins", label: "len / sum / max / min" },
  { id: "comprehension", label: "Comprehensions" },
  { id: "interview", label: "Interview Problems ⭐" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

/* visual: list slots */
function ListBoxes({ items }: { items: string[] }) {
  return (
    <div className="my-5 overflow-x-auto">
      <div className="inline-flex flex-col">
        <div className="flex">
          {items.map((_, i) => (
            <div key={i} className="code-font flex h-7 w-16 items-center justify-center text-[10px] text-sky-400">
              {i}
            </div>
          ))}
        </div>
        <div className="flex">
          {items.map((v, i) => (
            <div
              key={i}
              className="code-font flex h-11 w-16 items-center justify-center border border-slate-700 bg-slate-900/80 text-[13px] font-bold text-emerald-300 first:rounded-l-lg last:rounded-r-lg"
            >
              {v}
            </div>
          ))}
        </div>
        <div className="flex">
          {items.map((_, i) => (
            <div key={i} className="code-font flex h-7 w-16 items-center justify-center text-[10px] text-rose-400">
              {i - items.length}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        <span className="text-sky-400">forward index</span> · <span className="text-rose-400">negative index</span>
      </div>
    </div>
  );
}

export default function ListsPage() {
  return (
    <TopicShell
      icon="📋"
      title="Lists"
      gradientWord="Python Lists"
      subtitle="The workhorse of Python — ordered, mutable, holds anything. Every method, the famous copy trap, and the interview one-liners."
      nav={NAV}
      next={{ icon: "📦", label: "Tuples", href: "/python/tuples" }}
    >
      {/* 1 ─ create */}
      <Section id="create" number="01" title="Creating Lists">
        <CodeBlock
          code={`marks = [90, 85, 88]\nmixed = ["Deelaksha", 22, 3.14, True]   # any types together\nempty = []\nnested = [[1, 2], [3, 4]]\nfrom_str = list("abc")\nzeros = [0] * 5\n\nprint(mixed)\nprint(from_str)\nprint(zeros)\nprint(nested[1][0])     # row 1, column 0`}
          output={`['Deelaksha', 22, 3.14, True]\n['a', 'b', 'c']\n[0, 0, 0, 0, 0]\n3`}
        />
        <MemoryDiagram
          caption="A list is ONE object holding references to its items"
          vars={[
            { name: "marks", value: "[90, 85, 88]", type: "list" },
            { name: "nested", value: "[[1, 2], [3, 4]]", type: "list of lists" },
          ]}
        />
      </Section>

      {/* 2 ─ index & slice */}
      <Section id="index-slice" number="02" title="Indexing & Slicing">
        <ListBoxes items={["90", "85", "88", "76", "95"]} />
        <CodeBlock
          code={`marks = [90, 85, 88, 76, 95]\nprint(marks[0])      # first\nprint(marks[-1])     # last\nprint(marks[1:4])    # index 1,2,3\nprint(marks[:2])     # first two\nprint(marks[::-1])   # reversed copy\nprint(marks[::2])    # every 2nd`}
          output={`90\n95\n[85, 88, 76]\n[90, 85]\n[95, 76, 88, 85, 90]\n[90, 88, 95]`}
        />
        <Callout type="note">
          Same slice rules as strings: start included, stop excluded, slices never crash.
        </Callout>
      </Section>

      {/* 3 ─ add */}
      <Section id="add" number="03" title="Adding Items — append / insert / extend">
        <CodeBlock
          code={`team = ["Deelaksha"]\n\nteam.append("John")          # add ONE to the end\nprint(team)\n\nteam.insert(1, "Maya")       # add at position 1\nprint(team)\n\nteam.extend(["Ravi", "Sara"]) # add MANY\nprint(team)\n\nprint(team + ["Zoe"])        # + makes a NEW list\nprint(team)                  # original unchanged by +`}
          output={`['Deelaksha', 'John']\n['Deelaksha', 'Maya', 'John']\n['Deelaksha', 'Maya', 'John', 'Ravi', 'Sara']\n['Deelaksha', 'Maya', 'John', 'Ravi', 'Sara', 'Zoe']\n['Deelaksha', 'Maya', 'John', 'Ravi', 'Sara']`}
        />
        <CodeBlock
          code={`# ⭐ append vs extend — THE classic confusion\na = [1, 2]\na.append([3, 4])     # whole list goes in as ONE item\nprint(a, "← append")\n\nb = [1, 2]\nb.extend([3, 4])     # items spread in one by one\nprint(b, "← extend")`}
          output={`[1, 2, [3, 4]] ← append\n[1, 2, 3, 4] ← extend`}
        />
        <Callout type="mistake">
          <IC>append([3,4])</IC> nests the list inside; <IC>extend([3,4])</IC> merges the items.
          Interviewers love this one.
        </Callout>
      </Section>

      {/* 4 ─ remove */}
      <Section id="remove" number="04" title="Removing — remove / pop / del / clear">
        <Table
          head={["Method", "Removes by", "Returns", "Missing →"]}
          rows={[
            ["remove(x)", "VALUE (first match)", "None", "💥 ValueError"],
            ["pop()", "last position", "the item ⭐", "💥 IndexError if empty"],
            ["pop(i)", "index i", "the item", "💥 IndexError"],
            ["del lst[i]", "index i", "nothing", "💥 IndexError"],
            ["clear()", "everything", "None", "—"],
          ]}
        />
        <CodeBlock
          code={`nums = [10, 20, 30, 20, 40]\n\nnums.remove(20)        # first 20 only\nprint(nums)\n\nlast = nums.pop()      # removes AND returns\nprint(last, nums)\n\ndel nums[0]\nprint(nums)`}
          output={`[10, 30, 20, 40]\n40 [10, 30, 20]\n[30, 20]`}
        />
        <CodeBlock
          code={`# 💥 removing a value that isn't there\nnums = [1, 2, 3]\nnums.remove(99)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    nums.remove(99)\nValueError: list.remove(x): x not in list`}
          error
        />
        <Callout type="tip">
          Guard it: <IC>if 99 in nums: nums.remove(99)</IC>.
        </Callout>
      </Section>

      {/* 5 ─ update & sort */}
      <Section id="update-sort" number="05" title="Updating & Sorting">
        <CodeBlock
          code={`marks = [90, 85, 88]\nmarks[1] = 100            # lists are MUTABLE\nprint(marks)\n\nnums = [3, 1, 4, 1, 5]\nnums.sort()               # in place, returns None!\nprint(nums)\n\nnums.sort(reverse=True)\nprint(nums)\n\nwords = ["banana", "Apple", "kiwi"]\nwords.sort(key=str.lower) # case-insensitive\nprint(words)\n\nnums.reverse()            # just flips, no sorting\nprint(nums)`}
          output={`[90, 100, 88]\n[1, 1, 3, 4, 5]\n[5, 4, 3, 1, 1]\n['Apple', 'banana', 'kiwi']\n[1, 1, 3, 4, 5]`}
        />
        <CodeBlock
          code={`# ⭐ sort() vs sorted()\nnums = [3, 1, 2]\n\nresult = nums.sort()       # sorts IN PLACE\nprint(result)              # None! classic trap\nprint(nums)\n\nnums = [3, 1, 2]\nnew = sorted(nums)         # returns a NEW sorted list\nprint(new, nums)           # original untouched`}
          output={`None\n[1, 2, 3]\n[1, 2, 3] [3, 1, 2]`}
        />
        <Callout type="mistake">
          <IC>x = nums.sort()</IC> stores <IC>None</IC>! In-place methods (<IC>sort</IC>,{" "}
          <IC>append</IC>, <IC>reverse</IC>) all return None. Use <IC>sorted()</IC> when you
          need the result.
        </Callout>
      </Section>

      {/* 6 ─ copy trap */}
      <Section id="copy-trap" number="06" title="The Copy Trap ⭐">
        <CodeBlock
          code={`a = [1, 2, 3]\nb = a               # ❌ alias — SAME list, two names\nb.append(4)\nprint("a:", a)       # 😱 a changed too\n\nc = a.copy()         # ✅ real copy (or a[:] or list(a))\nc.append(99)\nprint("a:", a)       # safe now\nprint("c:", c)`}
          output={`a: [1, 2, 3, 4]\na: [1, 2, 3, 4]\nc: [1, 2, 3, 4, 99]`}
        />
        <MemoryDiagram
          caption="b = a adds a 2nd tag to the SAME object; a.copy() creates a new object"
          vars={[
            { name: "a", value: "[1, 2, 3, 4]", type: "list" },
            { name: "b", value: "↳ same object as a", type: "list" },
            { name: "c", value: "[1, 2, 3, 4, 99] (new)", type: "list" },
          ]}
        />
        <Callout type="behind">
          Full story — aliasing, shallow vs deep copy — lives in the{" "}
          <strong>Variables &amp; Memory</strong> category. Short version:{" "}
          <IC>copy()</IC> for flat lists, <IC>copy.deepcopy()</IC> for nested ones.
        </Callout>
      </Section>

      {/* 7 ─ builtins */}
      <Section id="builtins" number="07" title="len / sum / max / min / count / index">
        <CodeBlock
          code={`marks = [90, 85, 88, 85, 95]\n\nprint(len(marks))\nprint(sum(marks))\nprint(max(marks), min(marks))\nprint(sum(marks) / len(marks))   # average\nprint(marks.count(85))\nprint(marks.index(88))           # first position of 88\nprint(85 in marks)`}
          output={`5\n443\n95 85\n88.6\n2\n2\nTrue`}
        />
        <CodeBlock
          code={`# 💥 max of an empty list\nprint(max([]))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(max([]))\nValueError: max() iterable argument is empty`}
          error
        />
      </Section>

      {/* 8 ─ comprehension */}
      <Section id="comprehension" number="08" title="List Comprehensions — Build in One Line">
        <CodeBlock
          code={`nums = [3, -1, 4, -5, 9]\n\nsquares  = [n ** 2 for n in nums]\npositive = [n for n in nums if n > 0]\nflags    = ["+" if n > 0 else "-" for n in nums]\n\nprint(squares)\nprint(positive)\nprint(flags)\n\n# flatten a nested list — interview favorite\ngrid = [[1, 2], [3, 4], [5, 6]]\nflat = [x for row in grid for x in row]\nprint(flat)`}
          output={`[9, 1, 16, 25, 81]\n[3, 4, 9]\n['+', '-', '+', '-', '+']\n[1, 2, 3, 4, 5, 6]`}
        />
      </Section>

      {/* 9 ─ interview */}
      <Section id="interview" number="09" title="Interview Problems ⭐">
        <CodeBlock
          title="remove duplicates, keep order"
          code={`nums = [3, 1, 3, 2, 1, 4]\nuniq = list(dict.fromkeys(nums))\nprint(uniq)`}
          output={`[3, 1, 2, 4]`}
        />
        <CodeBlock
          title="second largest"
          code={`nums = [10, 40, 30, 40, 20]\nuniq = sorted(set(nums))\nprint(uniq[-2])`}
          output={`30`}
        />
        <CodeBlock
          title="rotate right by k"
          code={`nums = [1, 2, 3, 4, 5]\nk = 2\nprint(nums[-k:] + nums[:-k])`}
          output={`[4, 5, 1, 2, 3]`}
        />
        <CodeBlock
          title="merge two sorted lists"
          code={`a, b = [1, 3, 5], [2, 4, 6]\nprint(sorted(a + b))`}
          output={`[1, 2, 3, 4, 5, 6]`}
        />
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="IndexError"
          code={`nums = [1, 2, 3]\nprint(nums[5])`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(nums[5])\nIndexError: list index out of range`}
          error
        />
        <CodeBlock
          title="IndexError — pop on empty"
          code={`empty = []\nempty.pop()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    empty.pop()\nIndexError: pop from empty list`}
          error
        />
        <CodeBlock
          title="ValueError — remove / index missing value"
          code={`[1, 2, 3].index(99)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    [1, 2, 3].index(99)\nValueError: 99 is not in list`}
          error
        />
        <CodeBlock
          title="TypeError — sorting mixed types"
          code={`[3, "1", 2].sort()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    [3, "1", 2].sort()\nTypeError: '<' not supported between instances of 'str' and 'int'`}
          error
        />
        <Table
          head={["Error", "Guard"]}
          rows={[
            ["IndexError", "if i < len(nums):  /  use slices"],
            ["ValueError (remove/index)", "if x in nums: first"],
            ["pop from empty", "if nums: nums.pop()"],
            ["mixed-type sort", "convert first: key=str or key=int"],
          ]}
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Real copy", "b = a.copy()   # not b = a !"],
            ["Reverse copy", "a[::-1]"],
            ["sort vs sorted", "a.sort()      # in place, None\nsorted(a)     # new list"],
            ["append vs extend", "a.append([3,4]) # nests\na.extend([3,4]) # merges"],
            ["Dedupe keep order", "list(dict.fromkeys(a))"],
            ["Second largest", "sorted(set(a))[-2]"],
            ["Rotate by k", "a[-k:] + a[:-k]"],
            ["Flatten", "[x for row in grid for x in row]"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
