"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "create", label: "Creating Dicts" },
  { id: "access", label: "Access — [ ] vs get ⭐" },
  { id: "add-update", label: "Add & Update" },
  { id: "remove", label: "Removing Keys" },
  { id: "loop", label: "Looping Dicts" },
  { id: "counting", label: "Counting Pattern ⭐" },
  { id: "nested", label: "Nested Dicts" },
  { id: "comprehension", label: "Dict Comprehension" },
  { id: "keys-rules", label: "What Can Be a Key?" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

/* visual: key→value table */
function KVBoxes({ pairs }: { pairs: [string, string][] }) {
  return (
    <div className="my-5 overflow-x-auto">
      <div className="inline-flex flex-col gap-1.5">
        {pairs.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className="code-font flex h-10 w-28 items-center justify-center rounded-lg border border-sky-700/60 bg-sky-950/40 text-[12px] font-bold text-sky-300">
              {k}
            </div>
            <span className="text-slate-500">──▶</span>
            <div className="code-font flex h-10 min-w-28 items-center justify-center rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-3 text-[12px] font-bold text-emerald-300">
              {v}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-slate-500">key (hashed) ──▶ value (anything)</div>
    </div>
  );
}

export default function DictsPage() {
  return (
    <TopicShell
      icon="🗂️"
      title="Dictionaries"
      gradientWord="Python Dicts"
      subtitle="Key → value lookups in O(1). The data structure behind JSON, counting, caching — with the KeyError traps and the get() cure."
      nav={NAV}
      next={{ icon: "🎯", label: "Sets", href: "/python/sets" }}
    >
      {/* 1 ─ create */}
      <Section id="create" number="01" title="Creating Dictionaries">
        <CodeBlock
          code={`student = {\n    "name": "Deelaksha",\n    "age": 22,\n    "city": "Bangalore",\n}\nprint(student)\nprint(len(student))\n\nempty = {}\nvia_dict = dict(name="John", age=25)\nfrom_pairs = dict([("a", 1), ("b", 2)])\nprint(via_dict)\nprint(from_pairs)`}
          output={`{'name': 'Deelaksha', 'age': 22, 'city': 'Bangalore'}\n3\n{'name': 'John', 'age': 25}\n{'a': 1, 'b': 2}`}
        />
        <KVBoxes
          pairs={[
            ['"name"', '"Deelaksha"'],
            ['"age"', "22"],
            ['"city"', '"Bangalore"'],
          ]}
        />
        <Callout type="behind">
          Keys are <strong>hashed</strong> — Python computes a number from the key and jumps
          straight to the value&apos;s slot. That&apos;s why lookup is O(1): no scanning, regardless of
          size.
        </Callout>
      </Section>

      {/* 2 ─ access */}
      <Section id="access" number="02" title="Access — [ ] vs get() ⭐">
        <CodeBlock
          code={`student = {"name": "Deelaksha", "age": 22}\n\nprint(student["name"])          # crashes if missing\nprint(student.get("age"))       # same, but safe\nprint(student.get("email"))           # missing → None\nprint(student.get("email", "n/a"))    # missing → default`}
          output={`Deelaksha\n22\nNone\nn/a`}
        />
        <CodeBlock
          code={`# 💥 [ ] on a missing key\nstudent = {"name": "Deelaksha"}\nprint(student["email"])`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print(student["email"])\nKeyError: 'email'`}
          error
        />
        <Table
          head={["Way", "Missing key →", "Use when"]}
          rows={[
            ['d["k"]', "💥 KeyError", "key MUST exist (crash = good signal)"],
            ['d.get("k")', "None", "missing is normal"],
            ['d.get("k", default)', "your default", "you have a fallback"],
            ['"k" in d', "False", "just checking"],
          ]}
        />
      </Section>

      {/* 3 ─ add & update */}
      <Section id="add-update" number="03" title="Add & Update — Same Syntax">
        <CodeBlock
          code={`student = {"name": "Deelaksha"}\n\nstudent["age"] = 22          # new key → ADDED\nstudent["age"] = 23          # existing key → UPDATED\nprint(student)\n\nstudent.update({"city": "Bangalore", "age": 24})   # bulk\nprint(student)\n\n# setdefault: add only if missing\nstudent.setdefault("name", "Someone Else")   # exists → untouched\nstudent.setdefault("lang", "Python")          # missing → added\nprint(student)`}
          output={`{'name': 'Deelaksha', 'age': 23}\n{'name': 'Deelaksha', 'age': 24, 'city': 'Bangalore'}\n{'name': 'Deelaksha', 'age': 24, 'city': 'Bangalore', 'lang': 'Python'}`}
        />
        <Callout type="note">
          Duplicate keys are impossible — writing to an existing key silently overwrites. In a
          literal, the <strong>last</strong> duplicate wins: <IC>{`{"a": 1, "a": 2}`}</IC> →{" "}
          <IC>{`{"a": 2}`}</IC>.
        </Callout>
      </Section>

      {/* 4 ─ remove */}
      <Section id="remove" number="04" title="Removing Keys">
        <CodeBlock
          code={`d = {"a": 1, "b": 2, "c": 3, "d": 4}\n\nvalue = d.pop("b")        # remove AND return value\nprint(value, d)\n\nd.pop("zzz", "absent")    # default avoids the crash\n\ndel d["a"]                # remove, no return\nprint(d)\n\nlast = d.popitem()        # removes the LAST inserted pair\nprint(last, d)\n\nd.clear()\nprint(d)`}
          output={`2 {'a': 1, 'c': 3, 'd': 4}\n{'c': 3, 'd': 4}\n('d', 4) {'c': 3}\n{}`}
        />
        <CodeBlock
          code={`# 💥 del on a missing key\nd = {"a": 1}\ndel d["x"]`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    del d["x"]\nKeyError: 'x'`}
          error
        />
      </Section>

      {/* 5 ─ loop */}
      <Section id="loop" number="05" title="Looping Dictionaries">
        <CodeBlock
          code={`student = {"name": "Deelaksha", "age": 22, "city": "Bangalore"}\n\nfor key in student:                 # keys (default)\n    print(key, end=" ")\nprint()\n\nfor v in student.values():\n    print(v, end=" ")\nprint()\n\nfor key, value in student.items():  # ⭐ the usual way\n    print(f"{key:>5} : {value}")`}
          output={`name age city \nDeelaksha 22 Bangalore \n name : Deelaksha\n  age : 22\n city : Bangalore`}
        />
        <CodeBlock
          code={`# sort by value — interview favorite\nscores = {"Dee": 92, "John": 85, "Maya": 97}\n\nfor name, score in sorted(scores.items(), key=lambda kv: kv[1], reverse=True):\n    print(name, score)`}
          output={`Maya 97\nDee 92\nJohn 85`}
        />
      </Section>

      {/* 6 ─ counting */}
      <Section id="counting" number="06" title="The Counting Pattern ⭐">
        <FlowDiagram
          steps={[
            { label: "see an item", sub: '"a" appears' },
            { label: "freq.get(item, 0) + 1", sub: "current count (or 0 if first time) + 1" },
            { label: "store it back", sub: "freq[item] = new count" },
          ]}
        />
        <CodeBlock
          code={`word = "deelaksha"\nfreq = {}\nfor ch in word:\n    freq[ch] = freq.get(ch, 0) + 1\nprint(freq)`}
          output={`{'d': 1, 'e': 2, 'l': 1, 'a': 2, 'k': 1, 's': 1, 'h': 1}`}
        />
        <CodeBlock
          code={`# the shortcut everyone uses at work\nfrom collections import Counter\n\nvotes = ["py", "js", "py", "go", "py", "js"]\nc = Counter(votes)\nprint(c)\nprint(c.most_common(1))`}
          output={`Counter({'py': 3, 'js': 2, 'go': 1})\n[('py', 3)]`}
        />
        <Callout type="tip">
          Interviews: write the <IC>get(ch, 0) + 1</IC> loop by hand first, then mention{" "}
          <IC>Counter</IC> as the production shortcut. Shows both depth and practicality.
        </Callout>
      </Section>

      {/* 7 ─ nested */}
      <Section id="nested" number="07" title="Nested Dicts — Mini JSON">
        <CodeBlock
          code={`students = {\n    "s1": {"name": "Deelaksha", "marks": [90, 85]},\n    "s2": {"name": "John", "marks": [75, 80]},\n}\n\nprint(students["s1"]["name"])          # chain the keys\nprint(students["s2"]["marks"][1])      # then index the list\n\nfor sid, info in students.items():\n    avg = sum(info["marks"]) / len(info["marks"])\n    print(f"{sid}: {info['name']} avg={avg}")`}
          output={`Deelaksha\n80\ns1: Deelaksha avg=87.5\ns2: John avg=77.5`}
        />
        <Callout type="behind">
          This is exactly the shape of JSON from any web API — dicts inside dicts with lists.
          Master this and API data feels natural.
        </Callout>
      </Section>

      {/* 8 ─ comprehension */}
      <Section id="comprehension" number="08" title="Dict Comprehension">
        <CodeBlock
          code={`nums = [1, 2, 3, 4]\nsquares = {n: n ** 2 for n in nums}\nprint(squares)\n\n# flip keys and values\nflip = {v: k for k, v in {"a": 1, "b": 2}.items()}\nprint(flip)\n\n# filter while building\nscores = {"Dee": 92, "John": 35, "Maya": 97}\npassed = {k: v for k, v in scores.items() if v >= 40}\nprint(passed)`}
          output={`{1: 1, 2: 4, 3: 9, 4: 16}\n{1: 'a', 2: 'b'}\n{'Dee': 92, 'Maya': 97}`}
        />
      </Section>

      {/* 9 ─ key rules */}
      <Section id="keys-rules" number="09" title="What Can Be a Key?">
        <Table
          head={["✅ Hashable (immutable)", "❌ Unhashable (mutable)"]}
          rows={[
            ["str, int, float, bool", "list"],
            ["tuple (of immutables)", "dict"],
            ["frozenset, None", "set"],
          ]}
        />
        <CodeBlock
          code={`ok = {("x", "y"): "tuple key works", 42: "int key", None: "even None"}\nprint(ok[("x", "y")])`}
          output={`tuple key works`}
        />
        <CodeBlock
          code={`# 💥 mutable key\nbad = {["x", "y"]: "nope"}`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    bad = {["x", "y"]: "nope"}\nTypeError: unhashable type: 'list'`}
          error
        />
        <Callout type="behind">
          Keys must be hashable because the hash decides the storage slot. If a key could
          mutate, its hash would change and the value would be lost in the wrong slot. Values
          have no such rule — anything goes.
        </Callout>
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Safe alternative"]}
          rows={[
            ["KeyError", 'd["missing"]', 'd.get("missing", default)'],
            ["KeyError", 'del d["missing"] / d.pop("missing")', 'd.pop("missing", None)'],
            ["TypeError", "list/dict/set as a key", "use tuple or str"],
            ["RuntimeError", "add/remove keys while looping", "loop over list(d) or build new dict"],
          ]}
        />
        <CodeBlock
          title="RuntimeError — resizing during iteration"
          code={`d = {"a": 1, "b": 2}\nfor k in d:\n    if k == "a":\n        del d[k]      # ❌ mutating while looping`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    for k in d:\nRuntimeError: dictionary changed size during iteration`}
          error
        />
        <CodeBlock
          title="✅ fix — loop over a snapshot"
          code={`d = {"a": 1, "b": 2}\nfor k in list(d):       # list() freezes the keys first\n    if k == "a":\n        del d[k]\nprint(d)`}
          output={`{'b': 2}`}
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Safe lookup", 'd.get("key", default)'],
            ["Counting pattern", "freq[x] = freq.get(x, 0) + 1"],
            ["Loop pairs", "for k, v in d.items():"],
            ["Sort by value", "sorted(d.items(), key=lambda kv: kv[1])"],
            ["Flip dict", "{v: k for k, v in d.items()}"],
            ["Key exists?", 'if "k" in d:'],
            ["Merge dicts", "c = {**a, **b}   # or a | b (3.9+)"],
            ["Counter shortcut", "from collections import Counter\nCounter(items).most_common(1)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
