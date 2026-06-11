"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";

const NAV = [
  { id: "create", label: "Creating Sets" },
  { id: "dedupe", label: "Instant Dedupe ⭐" },
  { id: "add-remove", label: "Add & Remove" },
  { id: "math", label: "Set Math — | & - ^ ⭐" },
  { id: "membership", label: "Why Sets Are Fast" },
  { id: "subset", label: "Subset & Superset" },
  { id: "frozenset", label: "frozenset" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function SetsPage() {
  return (
    <TopicShell
      icon="🎯"
      title="Sets"
      gradientWord="Python Sets"
      subtitle="Unique items only, lightning-fast membership, and real math operations: union, intersection, difference — drawn so you can see them."
      nav={NAV}
      next={{ icon: "📦", label: "Functions", href: "/python/functions" }}
    >
      {/* 1 ─ create */}
      <Section id="create" number="01" title="Creating Sets">
        <CodeBlock
          code={`langs = {"python", "java", "go"}\nprint(langs)\n\ndups = {1, 2, 2, 3, 3, 3}\nprint(dups)              # duplicates auto-removed\n\nfrom_list = set([1, 2, 2, 3])\nfrom_str  = set("deelaksha")\nprint(from_list)\nprint(from_str)          # unique chars, order random`}
          output={`{'python', 'java', 'go'}\n{1, 2, 3}\n{1, 2, 3}\n{'d', 'e', 'l', 'a', 'k', 's', 'h'}`}
        />
        <CodeBlock
          code={`# ⭐ the empty-set trap\nempty = {}            # ❌ this is a DICT!\nprint(type(empty))\n\nempty = set()         # ✅ the only way\nprint(type(empty))`}
          output={`<class 'dict'>\n<class 'set'>`}
        />
        <Callout type="mistake">
          <IC>{`{}`}</IC> creates an empty <strong>dict</strong>, never a set. Empty set ={" "}
          <IC>set()</IC>. Sets are also <strong>unordered</strong> — print order may differ
          run to run, and <IC>s[0]</IC> doesn&apos;t exist.
        </Callout>
      </Section>

      {/* 2 ─ dedupe */}
      <Section id="dedupe" number="02" title="Instant Dedupe ⭐">
        <CodeBlock
          code={`votes = ["py", "js", "py", "go", "py", "js"]\n\nunique = set(votes)\nprint(unique)\nprint(len(unique), "unique languages")\n\n# back to a list\nprint(list(set(votes)))\n\n# need to KEEP original order? use dict.fromkeys\nprint(list(dict.fromkeys(votes)))`}
          output={`{'py', 'js', 'go'}\n3 unique languages\n['py', 'js', 'go']\n['py', 'js', 'go']`}
        />
        <CodeBlock
          code={`# has the list any duplicates? one line:\nnums = [1, 2, 3, 2]\nprint(len(nums) != len(set(nums)))`}
          output={`True`}
        />
        <Callout type="tip">
          <IC>set()</IC> may scramble order. When order matters, the interview-grade answer is{" "}
          <IC>list(dict.fromkeys(items))</IC> — dicts remember insertion order.
        </Callout>
      </Section>

      {/* 3 ─ add & remove */}
      <Section id="add-remove" number="03" title="Add & Remove">
        <CodeBlock
          code={`s = {1, 2}\n\ns.add(3)\ns.add(2)              # already there → silently ignored\nprint(s)\n\ns.update([4, 5])      # add many\nprint(s)\n\ns.remove(5)           # missing → 💥 KeyError\ns.discard(99)         # missing → no problem\nprint(s)\n\nitem = s.pop()        # removes an ARBITRARY item\nprint("popped:", item)`}
          output={`{1, 2, 3}\n{1, 2, 3, 4, 5}\n{1, 2, 3, 4}\npopped: 1`}
        />
        <Table
          head={["Method", "Missing item →", "Note"]}
          rows={[
            ["remove(x)", "💥 KeyError", "strict"],
            ["discard(x)", "nothing", "forgiving"],
            ["pop()", "💥 KeyError if empty", "removes a random item (unordered!)"],
          ]}
        />
      </Section>

      {/* 4 ─ set math */}
      <Section id="math" number="04" title="Set Math — | & - ^ ⭐">
        <CodeBlock
          code={`python_devs = {"Dee", "John", "Maya"}\njava_devs   = {"John", "Ravi"}\n\nprint(python_devs | java_devs)   # union — everyone\nprint(python_devs & java_devs)   # intersection — both langs\nprint(python_devs - java_devs)   # difference — Python only\nprint(java_devs - python_devs)   # Java only (order matters!)\nprint(python_devs ^ java_devs)   # symmetric diff — exactly one lang`}
          output={`{'Dee', 'John', 'Maya', 'Ravi'}\n{'John'}\n{'Dee', 'Maya'}\n{'Ravi'}\n{'Dee', 'Maya', 'Ravi'}`}
        />
        <Table
          head={["Operator", "Method", "Reads as", "Venn"]}
          rows={[
            ["a | b", "a.union(b)", "in a OR b", "both circles"],
            ["a & b", "a.intersection(b)", "in a AND b", "the overlap"],
            ["a - b", "a.difference(b)", "in a but NOT b", "left crescent"],
            ["a ^ b", "a.symmetric_difference(b)", "in exactly one", "both crescents"],
          ]}
        />
        <CodeBlock
          code={`# real use: common elements of two lists\na = [1, 2, 3, 4]\nb = [3, 4, 5, 6]\nprint(set(a) & set(b))\n\n# items in a missing from b\nprint(set(a) - set(b))`}
          output={`{3, 4}\n{1, 2}`}
        />
      </Section>

      {/* 5 ─ membership speed */}
      <Section id="membership" number="05" title="Why Sets Are Fast — O(1) Membership">
        <CodeBlock
          code={`import time\n\nbig_list = list(range(10_000_000))\nbig_set  = set(big_list)\n\nt = time.perf_counter()\n9_999_999 in big_list            # scans EVERY item\nprint(f"list: {time.perf_counter() - t:.4f}s")\n\nt = time.perf_counter()\n9_999_999 in big_set             # one hash jump\nprint(f"set : {time.perf_counter() - t:.7f}s")`}
          output={`list: 0.0741s\nset : 0.0000004s`}
        />
        <Callout type="behind">
          Like dict keys, set items are <strong>hashed</strong> — Python jumps straight to the
          slot instead of scanning. List <IC>in</IC> is O(n); set <IC>in</IC> is O(1). Convert
          once, look up a million times.
        </Callout>
      </Section>

      {/* 6 ─ subset */}
      <Section id="subset" number="06" title="Subset & Superset">
        <CodeBlock
          code={`required = {"python", "sql"}\nskills   = {"python", "sql", "git", "linux"}\n\nprint(required <= skills)    # subset: all required present?\nprint(skills >= required)    # superset\nprint(required.issubset(skills))\n\nprint({1, 2}.isdisjoint({3, 4}))   # no overlap at all?`}
          output={`True\nTrue\nTrue\nTrue`}
        />
        <Callout type="tip">
          &quot;Does the candidate have every required skill?&quot; →{" "}
          <IC>required &lt;= skills</IC>. One operator instead of a loop.
        </Callout>
      </Section>

      {/* 7 ─ frozenset */}
      <Section id="frozenset" number="07" title="frozenset — The Immutable Set">
        <CodeBlock
          code={`fs = frozenset([1, 2, 3])\nprint(fs)\nprint(fs & {2, 3, 4})        # set math still works\n\n# hashable → usable as dict key / inside another set\ngroups = {frozenset(["a", "b"]): "team 1"}\nprint(groups[frozenset(["a", "b"])])`}
          output={`frozenset({1, 2, 3})\nfrozenset({2, 3})\nteam 1`}
        />
        <CodeBlock
          code={`# 💥 frozen means frozen\nfs = frozenset([1, 2])\nfs.add(3)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    fs.add(3)\nAttributeError: 'frozenset' object has no attribute 'add'`}
          error
        />
      </Section>

      {/* 8 ─ exceptions */}
      <Section id="exceptions" number="08" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="TypeError — sets are unordered, no indexing"
          code={`s = {10, 20, 30}\nprint(s[0])`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(s[0])\nTypeError: 'set' object is not subscriptable`}
          error
        />
        <CodeBlock
          title="KeyError — remove a missing item"
          code={`s = {1, 2}\ns.remove(99)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    s.remove(99)\nKeyError: 99`}
          error
        />
        <CodeBlock
          title="TypeError — mutable items not allowed"
          code={`s = {[1, 2], [3, 4]}`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    s = {[1, 2], [3, 4]}\nTypeError: unhashable type: 'list'`}
          error
        />
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["TypeError", "s[0] indexing", "convert: list(s)[0], or loop"],
            ["KeyError", "remove(missing)", "use discard()"],
            ["TypeError", "list/dict inside a set", "use tuples instead"],
            ["dict, not set", "empty = {}", "empty = set()"],
          ]}
        />
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Dedupe", "list(set(items))"],
            ["Dedupe keep order", "list(dict.fromkeys(items))"],
            ["Has duplicates?", "len(a) != len(set(a))"],
            ["Common elements", "set(a) & set(b)"],
            ["In a, not in b", "set(a) - set(b)"],
            ["All required present?", "required <= skills"],
            ["Empty set", "set()   # {} is a dict!"],
            ["Fast lookups", "allowed = set(big_list)\nif x in allowed:"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
