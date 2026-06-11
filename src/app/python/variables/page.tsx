"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, MemoryDiagram, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "name-tag", label: "Variables = Name Tags" },
  { id: "assignment", label: "Assignment & Rebinding" },
  { id: "identity", label: "id() — Memory Address" },
  { id: "multi-assign", label: "Multiple Assignment" },
  { id: "swap", label: "Swapping Variables" },
  { id: "dynamic", label: "Dynamic Typing" },
  { id: "aliasing", label: "Aliasing — is vs ==" },
  { id: "mutability", label: "Mutable vs Immutable" },
  { id: "copy", label: "copy vs deepcopy" },
  { id: "del", label: "del & Garbage Collection" },
  { id: "naming", label: "Naming Rules" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function VariablesPage() {
  return (
    <TopicShell
      icon="🏷️"
      title="Variables & Memory"
      gradientWord="Variables & Memory"
      subtitle="A variable is NOT a box — it is a name tag stuck on an object living in memory. See assignment, aliasing, mutability and garbage collection drawn live."
      nav={NAV}
      next={{ icon: "🧬", label: "Data Types", href: "/python/datatypes" }}
    >
      {/* 1 ─ name tag */}
      <Section id="name-tag" number="01" title="A Variable is a Name Tag, not a Box">
        <P>
          In many languages a variable is a <em>box</em> that holds a value. In Python it is a{" "}
          <strong>name tag tied to an object</strong>. The object lives somewhere in memory; the
          name just points at it.
        </P>
        <CodeBlock
          code={`name = "Deelaksha"\nage = 22\nprint(name)\nprint(age)`}
          output={`Deelaksha\n22`}
        />
        <MemoryDiagram
          caption="Two name tags → two separate objects in memory"
          vars={[
            { name: "name", value: '"Deelaksha"', type: "str" },
            { name: "age", value: "22", type: "int" },
          ]}
        />
        <Callout type="analogy">
          Think of a luggage tag. The suitcase (object) sits in the airport (memory). The tag
          (variable) just has a string attached to it. You can move the tag to another suitcase —
          the old suitcase doesn&apos;t change.
        </Callout>
      </Section>

      {/* 2 ─ assignment */}
      <Section id="assignment" number="02" title="Assignment & Rebinding">
        <P>
          <IC>=</IC> does not copy a value into a box — it <strong>binds a name to an object</strong>.
          Assigning again simply moves the tag to a new object. The old object is abandoned.
        </P>
        <CodeBlock
          code={`x = 10        # x ──▶ 10\nprint(x)\nx = "hello"   # x moves to a NEW object\nprint(x)`}
          output={`10\nhello`}
        />
        <FlowDiagram
          steps={[
            { label: 'x = 10', sub: "name x is tied to int object 10" },
            { label: 'x = "hello"', sub: "tag is UNTIED from 10, retied to str object" },
            { label: "10 has no names left", sub: "Python garbage-collects it automatically" },
          ]}
        />
        <Callout type="behind">
          Rebinding never modifies the old object. <IC>10</IC> stays <IC>10</IC> forever — only
          the name moved. That is why integers and strings feel &quot;changeable&quot; even though they are
          immutable.
        </Callout>
      </Section>

      {/* 3 ─ id */}
      <Section id="identity" number="03" title="id() — See the Memory Address">
        <P>
          Every object has a unique identity (its memory address in CPython). <IC>id(x)</IC> lets
          you literally watch where a name points.
        </P>
        <CodeBlock
          code={`x = 10\nprint(id(x))      # address of object 10\n\nx = 20\nprint(id(x))      # DIFFERENT address — new object\n\ny = 20\nprint(id(y))      # same as x! small ints are cached`}
          output={`140711693455944\n140711693456264\n140711693456264`}
        />
        <Table
          head={["Expression", "Meaning"]}
          rows={[
            ["id(x)", "memory address of the object x points to"],
            ["x is y", "True if id(x) == id(y) — same object"],
            ["x == y", "True if values are equal — may be different objects"],
          ]}
        />
        <Callout type="behind">
          CPython pre-creates integers <IC>-5</IC> to <IC>256</IC> at startup (small-int cache),
          so every <IC>20</IC> in your program is the <em>same</em> object. Bigger numbers get
          fresh objects each time.
        </Callout>
        <Callout type="mistake">
          Never rely on <IC>is</IC> for numbers/strings comparison — the caching is an
          implementation detail. Use <IC>==</IC> for values, <IC>is</IC> only for{" "}
          <IC>None</IC>.
        </Callout>
      </Section>

      {/* 4 ─ multiple assignment */}
      <Section id="multi-assign" number="04" title="Multiple Assignment">
        <P>Bind several names in one line — two flavors:</P>
        <CodeBlock
          code={`# 1) Unpacking: each name gets its own value\nname, age, city = "Deelaksha", 22, "Bangalore"\nprint(name, age, city)\n\n# 2) Chained: ALL names point to the SAME object\na = b = c = 100\nprint(a, b, c)\nprint(id(a) == id(b) == id(c))`}
          output={`Deelaksha 22 Bangalore\n100 100 100\nTrue`}
        />
        <MemoryDiagram
          caption="Chained assignment: three tags on ONE object"
          vars={[
            { name: "a", value: "100", type: "int" },
            { name: "b", value: "↳ same object as a", type: "int" },
            { name: "c", value: "↳ same object as a", type: "int" },
          ]}
        />
        <CodeBlock
          code={`# 💥 count mismatch crashes\nx, y = 1, 2, 3`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    x, y = 1, 2, 3\nValueError: too many values to unpack (expected 2)`}
          error
        />
      </Section>

      {/* 5 ─ swap */}
      <Section id="swap" number="05" title="Swapping — the Interview Classic">
        <P>
          Other languages need a <IC>temp</IC> variable. Python swaps in one line because the
          right side is packed into a tuple first, then unpacked.
        </P>
        <CodeBlock
          code={`a = 5\nb = 10\n\na, b = b, a   # ✨ one-line swap\n\nprint("a =", a)\nprint("b =", b)`}
          output={`a = 10\nb = 5`}
        />
        <FlowDiagram
          steps={[
            { label: "Right side evaluated FIRST", sub: "(b, a) → tuple (10, 5) is created" },
            { label: "Then unpacked left to right", sub: "a ← 10, b ← 5" },
            { label: "Tags swapped, objects untouched", sub: "no temp variable needed" },
          ]}
        />
        <Callout type="tip">
          Interview answer: &quot;Python evaluates the right-hand side into a tuple before any
          assignment happens — that&apos;s why <IC>a, b = b, a</IC> works without a temp.&quot;
        </Callout>
      </Section>

      {/* 6 ─ dynamic typing */}
      <Section id="dynamic" number="06" title="Dynamic Typing">
        <P>
          The <strong>name has no type — the object does</strong>. The same name can point to an
          int now and a list later. <IC>type()</IC> always reports the current object&apos;s type.
        </P>
        <CodeBlock
          code={`x = 10\nprint(type(x))\n\nx = "Deelaksha"\nprint(type(x))\n\nx = [1, 2, 3]\nprint(type(x))`}
          output={`<class 'int'>\n<class 'str'>\n<class 'list'>`}
        />
        <Callout type="behind">
          That&apos;s why Python needs no declarations like <IC>int x;</IC> — typing lives on the
          object, checked at <em>runtime</em>. Flexible, but typos create new variables silently
          instead of erroring at compile time.
        </Callout>
        <CodeBlock
          code={`# 💥 dynamic typing trap — type changes mid-program\ntotal = 100\ntotal = "100"      # oops, now a string\nprint(total + 50)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n    print(total + 50)\nTypeError: can only concatenate str (not "int") to str`}
          error
        />
      </Section>

      {/* 7 ─ aliasing */}
      <Section id="aliasing" number="07" title="Aliasing — Two Names, One Object">
        <P>
          Assigning one variable to another does <strong>NOT copy</strong> the object — it adds a
          second name tag to the <em>same</em> object. With mutable objects this causes the
          most famous Python bug.
        </P>
        <CodeBlock
          code={`marks = [90, 85, 88]\nbackup = marks          # ❌ NOT a copy — an alias!\n\nbackup.append(100)\n\nprint("marks :", marks)   # 😱 changed too!\nprint("backup:", backup)\nprint(marks is backup)`}
          output={`marks : [90, 85, 88, 100]\nbackup: [90, 85, 88, 100]\nTrue`}
        />
        <MemoryDiagram
          caption="One list object — two tags. Mutating through either tag is visible from both."
          vars={[
            { name: "marks", value: "[90, 85, 88, 100]", type: "list" },
            { name: "backup", value: "↳ SAME object", type: "list" },
          ]}
        />
        <Table
          head={["Check", "Question it answers", "Example"]}
          rows={[
            ["==", "Do they hold equal values?", "[1,2] == [1,2] → True"],
            ["is", "Are they the SAME object?", "[1,2] is [1,2] → False"],
            ["is None", "The ONLY correct None check", "if x is None:"],
          ]}
        />
        <Callout type="mistake">
          <IC>backup = marks</IC> never protects your data. To actually copy a list use{" "}
          <IC>marks.copy()</IC>, <IC>list(marks)</IC> or <IC>marks[:]</IC>.
        </Callout>
      </Section>

      {/* 8 ─ mutability */}
      <Section id="mutability" number="08" title="Mutable vs Immutable">
        <P>
          Immutable objects can never change after creation — &quot;modifying&quot; them secretly creates a
          new object. Mutable objects change <em>in place</em>, keeping the same id.
        </P>
        <Table
          head={["Immutable 🧊 (new object on change)", "Mutable 🔥 (changes in place)"]}
          rows={[
            ["int, float, bool", "list"],
            ["str", "dict"],
            ["tuple", "set"],
            ["frozenset, bytes", "bytearray, custom objects"],
          ]}
        />
        <CodeBlock
          code={`# str is immutable — id CHANGES\ns = "hi"\nprint(id(s))\ns += "!"           # builds a NEW string\nprint(id(s))       # different!\n\n# list is mutable — id STAYS\nnums = [1, 2]\nprint(id(nums))\nnums.append(3)     # modified in place\nprint(id(nums))    # same!`}
          output={`140399521115312\n140399520314672\n140399520941376\n140399520941376`}
        />
        <CodeBlock
          code={`# 💥 immutables refuse item assignment\ns = "Deelaksha"\ns[0] = "X"`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    s[0] = "X"\nTypeError: 'str' object does not support item assignment`}
          error
        />
        <CodeBlock
          code={`# 💥 same trap with tuples\npoint = (3, 4)\npoint[0] = 99`}
          output={`Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    point[0] = 99\nTypeError: 'tuple' object does not support item assignment`}
          error
        />
        <Callout type="tip">
          Interview one-liner: &quot;Mutability decides aliasing risk. Sharing an immutable is always
          safe; sharing a mutable means every alias sees every change.&quot;
        </Callout>
      </Section>

      {/* 9 ─ copy */}
      <Section id="copy" number="09" title="copy vs deepcopy">
        <P>
          A <strong>shallow copy</strong> copies only the outer object — inner objects are still
          shared. A <strong>deep copy</strong> clones everything recursively.
        </P>
        <CodeBlock
          code={`import copy\n\nteam = [["Deelaksha", 90], ["John", 85]]\n\nshallow = team.copy()          # outer list copied, inner lists SHARED\ndeep    = copy.deepcopy(team)  # everything cloned\n\nteam[0][1] = 99                # mutate an INNER list\n\nprint("team   :", team)\nprint("shallow:", shallow)     # 😱 inner change leaked!\nprint("deep   :", deep)        # ✅ fully safe`}
          output={`team   : [['Deelaksha', 99], ['John', 85]]\nshallow: [['Deelaksha', 99], ['John', 85]]\ndeep   : [['Deelaksha', 90], ['John', 85]]`}
        />
        <FlowDiagram
          steps={[
            { label: "alias  →  b = a", sub: "0 objects copied — same tag target" },
            { label: "shallow →  a.copy()", sub: "1 outer object copied, inners shared" },
            { label: "deepcopy → copy.deepcopy(a)", sub: "entire tree cloned, zero sharing" },
          ]}
        />
        <Callout type="mistake">
          Shallow copy is enough for flat lists like <IC>[1, 2, 3]</IC>. The moment you nest
          (lists of lists, dicts of lists) and mutate inners, you need <IC>deepcopy</IC>.
        </Callout>
      </Section>

      {/* 10 ─ del / gc */}
      <Section id="del" number="10" title="del & Garbage Collection">
        <P>
          <IC>del x</IC> deletes the <strong>name tag</strong>, not the object. An object dies
          only when its <em>last</em> tag is removed — then Python&apos;s reference counter frees it
          automatically.
        </P>
        <CodeBlock
          code={`import sys\n\ndata = [1, 2, 3]\nalias = data\nprint(sys.getrefcount(data))   # tags pointing at the list (+1 temp)\n\ndel data                       # remove ONE tag — object survives\nprint(alias)                   # still alive via 'alias'\n\ndel alias                      # last tag gone → object freed`}
          output={`3\n[1, 2, 3]`}
        />
        <CodeBlock
          code={`# 💥 using a deleted name\nx = 10\ndel x\nprint(x)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n    print(x)\nNameError: name 'x' is not defined`}
          error
        />
        <Callout type="behind">
          CPython keeps a <strong>reference count</strong> on every object. Hit zero → memory
          freed instantly. A cycle detector (the &quot;gc&quot; module) handles objects that reference
          each other in loops.
        </Callout>
      </Section>

      {/* 11 ─ naming */}
      <Section id="naming" number="11" title="Naming Rules & Conventions">
        <Table
          head={["Rule", "✅ Valid", "❌ Invalid"]}
          rows={[
            ["Start with letter or _", "name, _temp", "2name"],
            ["Letters, digits, _ only", "user_2", "user-2, my name"],
            ["Case sensitive", "Age ≠ age", "—"],
            ["No keywords", "klass, type_", "class, for, if"],
          ]}
        />
        <CodeBlock
          code={`# 💥 keyword as a variable name\nclass = "CS101"`}
          output={`  File "main.py", line 2\n    class = "CS101"\n          ^\nSyntaxError: invalid syntax`}
          error
        />
        <Table
          head={["Convention", "Used for", "Example"]}
          rows={[
            ["snake_case", "variables & functions", "student_name"],
            ["UPPER_CASE", "constants", "MAX_RETRIES = 3"],
            ["PascalCase", "classes", "class StudentRecord:"],
            ["_leading", "internal / private hint", "_cache"],
          ]}
        />
        <Callout type="note">
          Python has no true constants — <IC>UPPER_CASE</IC> is a promise to other humans, not
          to the interpreter.
        </Callout>
      </Section>

      {/* 12 ─ exceptions recap */}
      <Section id="exceptions" number="12" title="Exception Cases — Recap 💥">
        <P>Every way variables crash, in one place:</P>
        <CodeBlock
          title="NameError"
          code={`print(salary)        # never assigned`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(salary)\nNameError: name 'salary' is not defined`}
          error
        />
        <CodeBlock
          title="UnboundLocalError"
          code={`count = 0\n\ndef bump():\n    count += 1      # assignment makes 'count' LOCAL\n                    # ...but it's read before assignment\nbump()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    bump()\n  File "main.py", line 4, in bump\n    count += 1\nUnboundLocalError: cannot access local variable 'count' where it is not associated with a value`}
          error
        />
        <Callout type="behind">
          Any assignment inside a function makes that name <strong>local for the whole
          function</strong> — even on lines above the assignment. Fix with{" "}
          <IC>global count</IC> (or better: pass &amp; return values).
        </Callout>
        <CodeBlock
          title="TypeError — immutable item assignment"
          code={`s = "hello"\ns[0] = "H"`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    s[0] = "H"\nTypeError: 'str' object does not support item assignment`}
          error
        />
        <CodeBlock
          title="ValueError — unpack mismatch"
          code={`a, b = [1, 2, 3]`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    a, b = [1, 2, 3]\nValueError: too many values to unpack (expected 2)`}
          error
        />
      </Section>

      {/* 13 ─ memorize */}
      <Section id="memorize" number="13" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["One-line swap", "a, b = b, a"],
            ["Identity vs equality", "x is y   # same object\nx == y   # same value"],
            ["Safe None check", "if x is None:"],
            ["Real list copy", "b = a.copy()   # or a[:]"],
            ["Deep copy nested data", "import copy\nb = copy.deepcopy(a)"],
            ["Chained = shares object", "a = b = []   # ONE list, two tags"],
            ["Unpack with star", "first, *rest = [1, 2, 3, 4]"],
            ["Check type at runtime", "type(x)\nisinstance(x, int)"],
          ]}
        />
        <Callout type="tip">
          The single most asked question: <em>&quot;Why did modifying my copied list change the
          original?&quot;</em> Answer: <IC>b = a</IC> creates an alias, not a copy — both names point
          to the same object in memory.
        </Callout>
      </Section>
    </TopicShell>
  );
}
