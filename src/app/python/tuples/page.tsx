"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";

const NAV = [
  { id: "create", label: "Creating Tuples" },
  { id: "single", label: "The 1-Item Trap ⭐" },
  { id: "access", label: "Access & Slice" },
  { id: "immutable", label: "Immutability" },
  { id: "unpack", label: "Unpacking ⭐" },
  { id: "vs-list", label: "Tuple vs List" },
  { id: "uses", label: "Where Tuples Shine" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function TuplesPage() {
  return (
    <TopicShell
      icon="📦"
      title="Tuples"
      gradientWord="Python Tuples"
      subtitle="A list that promised never to change. Lighter, hashable, perfect for fixed data — plus the one-item comma trap everyone falls into."
      nav={NAV}
      next={{ icon: "🗂️", label: "Dictionaries", href: "/python/dicts" }}
    >
      {/* 1 ─ create */}
      <Section id="create" number="01" title="Creating Tuples">
        <CodeBlock
          code={`point = (3, 4)\nperson = ("Deelaksha", 22, "Bangalore")\nempty = ()\nno_parens = 1, 2, 3        # parentheses optional!\nfrom_list = tuple([1, 2, 3])\n\nprint(point)\nprint(no_parens, type(no_parens))\nprint(from_list)`}
          output={`(3, 4)\n(1, 2, 3) <class 'tuple'>\n(1, 2, 3)`}
        />
        <Callout type="behind">
          It&apos;s the <strong>comma</strong> that makes a tuple, not the parentheses.{" "}
          <IC>1, 2, 3</IC> is already a tuple — the <IC>( )</IC> just make it readable.
        </Callout>
      </Section>

      {/* 2 ─ single */}
      <Section id="single" number="02" title="The 1-Item Trap ⭐">
        <CodeBlock
          code={`a = (5)        # ❌ just the number 5 in parentheses!\nprint(type(a))\n\nb = (5,)       # ✅ the comma makes it a tuple\nprint(type(b))\n\nc = 5,         # ✅ also works\nprint(type(c))`}
          output={`<class 'int'>\n<class 'tuple'>\n<class 'tuple'>`}
        />
        <Callout type="mistake">
          <IC>(5)</IC> is just <IC>5</IC> — math parentheses. A single-item tuple{" "}
          <strong>needs the trailing comma</strong>: <IC>(5,)</IC>. Top-3 Python gotcha.
        </Callout>
      </Section>

      {/* 3 ─ access */}
      <Section id="access" number="03" title="Access & Slice — Same as Lists">
        <CodeBlock
          code={`person = ("Deelaksha", 22, "Bangalore", "Python")\n\nprint(person[0])\nprint(person[-1])\nprint(person[1:3])\nprint(len(person))\nprint("Python" in person)\nprint(person.count(22))\nprint(person.index("Bangalore"))`}
          output={`Deelaksha\n22\n(22, 'Bangalore')\n4\nTrue\n1\n2`}
        />
        <Callout type="note">
          Tuples have exactly <strong>two methods</strong>: <IC>count()</IC> and{" "}
          <IC>index()</IC>. No append, no remove, no sort — that&apos;s the whole point.
        </Callout>
      </Section>

      {/* 4 ─ immutable */}
      <Section id="immutable" number="04" title="Immutability — The Whole Point">
        <CodeBlock
          code={`# 💥 cannot change an item\npoint = (3, 4)\npoint[0] = 99`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    point[0] = 99\nTypeError: 'tuple' object does not support item assignment`}
          error
        />
        <CodeBlock
          code={`# 💥 no append either\npoint = (3, 4)\npoint.append(5)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    point.append(5)\nAttributeError: 'tuple' object has no attribute 'append'`}
          error
        />
        <CodeBlock
          code={`# "changing" = building a NEW tuple\npoint = (3, 4)\npoint = point + (5,)        # new object!\nprint(point)\n\n# the nested-mutable surprise 😮\ntricky = (1, [2, 3])\ntricky[1].append(4)         # the LIST inside can change\nprint(tricky)`}
          output={`(3, 4, 5)\n(1, [2, 3, 4])`}
        />
        <Callout type="behind">
          A tuple freezes <strong>which objects it holds</strong>, not the objects themselves.
          A mutable item inside (like a list) can still be modified — favorite trick question.
        </Callout>
      </Section>

      {/* 5 ─ unpack */}
      <Section id="unpack" number="05" title="Unpacking — Where Tuples Earn Their Keep ⭐">
        <CodeBlock
          code={`person = ("Deelaksha", 22, "Bangalore")\nname, age, city = person          # one name per item\nprint(name)\nprint(age)\nprint(city)\n\n# star grabs the rest\nfirst, *rest = (1, 2, 3, 4, 5)\nprint(first, rest)\n\n# swap = tuple packing + unpacking\na, b = 10, 20\na, b = b, a\nprint(a, b)`}
          output={`Deelaksha\n22\nBangalore\n1 [2, 3, 4, 5]\n20 10`}
        />
        <CodeBlock
          code={`# functions "return two values" via a tuple\ndef min_max(nums):\n    return min(nums), max(nums)    # packs into a tuple\n\nlow, high = min_max([4, 9, 1, 7])  # unpacks\nprint(low, high)`}
          output={`1 9`}
        />
        <CodeBlock
          code={`# 💥 wrong number of names\nx, y = (1, 2, 3)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    x, y = (1, 2, 3)\nValueError: too many values to unpack (expected 2)`}
          error
        />
      </Section>

      {/* 6 ─ vs list */}
      <Section id="vs-list" number="06" title="Tuple vs List — When to Use Which">
        <Table
          head={["", "list 📋", "tuple 📦"]}
          rows={[
            ["Mutable", "✅ yes", "❌ no"],
            ["Syntax", "[1, 2]", "(1, 2)"],
            ["Methods", "11+ (append, sort…)", "2 (count, index)"],
            ["Speed / memory", "heavier", "lighter, faster"],
            ["Dict key / set item", "❌ unhashable", "✅ allowed"],
            ["Meaning", "collection that grows", "fixed record (x, y), (name, age)"],
          ]}
        />
        <CodeBlock
          code={`# tuples can be dict keys — lists cannot\ndistances = {(0, 0): "origin", (3, 4): "point A"}\nprint(distances[(3, 4)])\n\nimport sys\nprint(sys.getsizeof([1, 2, 3]), "bytes (list)")\nprint(sys.getsizeof((1, 2, 3)), "bytes (tuple)")`}
          output={`point A\n88 bytes (list)\n64 bytes (tuple)`}
        />
        <CodeBlock
          code={`# 💥 list as a dict key\nbad = {[0, 0]: "origin"}`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    bad = {[0, 0]: "origin"}\nTypeError: unhashable type: 'list'`}
          error
        />
      </Section>

      {/* 7 ─ uses */}
      <Section id="uses" number="07" title="Where Tuples Shine in Real Code">
        <CodeBlock
          code={`# 1) fixed records\nstudent = ("Deelaksha", 22)\n\n# 2) multiple return values\ndef divide(a, b):\n    return a // b, a % b\nq, r = divide(17, 5)\nprint(q, r)\n\n# 3) looping pairs (enumerate & items give tuples!)\nfor pair in enumerate(["a", "b"]):\n    print(pair, type(pair).__name__)\n\n# 4) constant data nobody should edit\nWEEKDAYS = ("Mon", "Tue", "Wed", "Thu", "Fri")\nprint(WEEKDAYS[0])`}
          output={`3 2\n(0, 'a') tuple\n(1, 'b') tuple\nMon`}
        />
        <Callout type="tip">
          You&apos;ve been using tuples all along — <IC>enumerate</IC>, <IC>dict.items()</IC>,{" "}
          <IC>divmod()</IC> and every multi-value <IC>return</IC> hand you tuples.
        </Callout>
      </Section>

      {/* 8 ─ exceptions */}
      <Section id="exceptions" number="08" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["TypeError", "t[0] = x (item assignment)", "build a new tuple"],
            ["AttributeError", "t.append / t.sort", "convert: list(t), edit, tuple back"],
            ["ValueError", "unpack count mismatch", "match names to length, or use *rest"],
            ["IndexError", "t[99]", "check len(t) first"],
            ["TypeError", "{[1,2]: ...} list as key", "use a tuple key: {(1,2): ...}"],
          ]}
        />
        <CodeBlock
          title="the edit-via-list escape hatch"
          code={`t = (1, 2, 3)\ntemp = list(t)      # tuple → list\ntemp[0] = 99        # edit freely\nt = tuple(temp)     # back to tuple\nprint(t)`}
          output={`(99, 2, 3)`}
        />
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["1-item tuple", "t = (5,)   # comma required!"],
            ["Unpack", "name, age = (\"Dee\", 22)"],
            ["Star unpack", "first, *rest = (1, 2, 3, 4)"],
            ["Swap", "a, b = b, a"],
            ["Return two values", "return min(x), max(x)"],
            ["Tuple as dict key", "d[(row, col)] = value"],
            ["Edit workaround", "t = tuple(list(t) edited)"],
            ["Why tuple?", "fixed data · hashable · faster"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
