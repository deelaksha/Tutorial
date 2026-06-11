"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, MemoryDiagram, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "overview", label: "The Type Map" },
  { id: "int", label: "int — Whole Numbers" },
  { id: "float", label: "float — Decimals" },
  { id: "bool", label: "bool — True / False" },
  { id: "str-type", label: "str — Text" },
  { id: "none", label: "None — Nothing" },
  { id: "collections", label: "Collection Types" },
  { id: "conversion", label: "Type Conversion" },
  { id: "truthiness", label: "Truthiness" },
  { id: "float-trap", label: "The 0.1 + 0.2 Trap" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function DataTypesPage() {
  return (
    <TopicShell
      icon="🧬"
      title="Data Types"
      gradientWord="Data Types"
      subtitle="Every value in Python is an object with a type. Learn the built-in types, how to convert between them, and every conversion crash."
      nav={NAV}
      next={{ icon: "🧵", label: "Strings", href: "/python/strings" }}
    >
      {/* 1 ─ overview */}
      <Section id="overview" number="01" title="The Type Map">
        <P>
          <IC>type()</IC> reveals what kind of object a name points to. Everything — even
          numbers and functions — is an object with a type.
        </P>
        <CodeBlock
          code={`print(type(22))          # int\nprint(type(3.14))        # float\nprint(type("Deelaksha")) # str\nprint(type(True))        # bool\nprint(type(None))        # NoneType\nprint(type([1, 2]))      # list\nprint(type((1, 2)))      # tuple\nprint(type({"a": 1}))    # dict\nprint(type({1, 2}))      # set`}
          output={`<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>\n<class 'NoneType'>\n<class 'list'>\n<class 'tuple'>\n<class 'dict'>\n<class 'set'>`}
        />
        <Table
          head={["Category", "Types", "Mutable?"]}
          rows={[
            ["Numbers", "int, float, complex", "❌ immutable"],
            ["Text", "str", "❌ immutable"],
            ["Boolean", "bool (True / False)", "❌ immutable"],
            ["Nothing", "NoneType (None)", "❌ immutable"],
            ["Sequences", "list ✏️, tuple 🧊", "list yes, tuple no"],
            ["Mappings", "dict", "✅ mutable"],
            ["Sets", "set ✏️, frozenset 🧊", "set yes, frozenset no"],
          ]}
        />
      </Section>

      {/* 2 ─ int */}
      <Section id="int" number="02" title="int — Whole Numbers (Unlimited!)">
        <P>
          Python ints have <strong>no maximum size</strong> — no overflow, ever. They grow as
          big as your RAM allows.
        </P>
        <CodeBlock
          code={`age = 22\nbig = 2 ** 100          # no overflow in Python!\nprint(big)\n\nprint(10 // 3)          # floor division → int\nprint(10 % 3)           # remainder\nprint(divmod(10, 3))    # both at once`}
          output={`1267650600228229401496703205376\n3\n1\n(3, 1)`}
        />
        <CodeBlock
          code={`# readable big numbers with _\nsalary = 1_200_000\nprint(salary)`}
          output={`1200000`}
        />
        <Callout type="behind">
          In C/Java an <IC>int</IC> overflows at ~2.1 billion. Python switches to big-integer
          arithmetic automatically — that&apos;s why <IC>2 ** 100</IC> just works.
        </Callout>
      </Section>

      {/* 3 ─ float */}
      <Section id="float" number="03" title="float — Decimal Numbers">
        <CodeBlock
          code={`pi = 3.14159\nprint(pi)\nprint(type(pi))\n\nprint(7 / 2)        # / ALWAYS gives float\nprint(type(7 / 2))\n\nprint(1.5e3)        # scientific notation\nprint(float("inf") > 10**100)   # infinity`}
          output={`3.14159\n<class 'float'>\n3.5\n<class 'float'>\n1500.0\nTrue`}
        />
        <Callout type="mistake">
          <IC>/</IC> returns float even for <IC>10 / 2</IC> → <IC>5.0</IC>. Need an int? Use{" "}
          <IC>10 // 2</IC> → <IC>5</IC>.
        </Callout>
      </Section>

      {/* 4 ─ bool */}
      <Section id="bool" number="04" title="bool — True / False (secretly numbers)">
        <P>
          <IC>bool</IC> is a subclass of <IC>int</IC>: <IC>True == 1</IC> and{" "}
          <IC>False == 0</IC>. This enables clever interview tricks.
        </P>
        <CodeBlock
          code={`print(True + True)        # 2 😮\nprint(True * 10)          # 10\n\nvotes = [True, False, True, True]\nprint(sum(votes))         # count the Trues!\n\nprint(isinstance(True, int))`}
          output={`2\n10\n3\nTrue`}
        />
        <Callout type="tip">
          Interview favorite: count matches with <IC>sum(condition for x in data)</IC> — works
          because each <IC>True</IC> adds 1.
        </Callout>
      </Section>

      {/* 5 ─ str */}
      <Section id="str-type" number="05" title="str — Text">
        <CodeBlock
          code={`name = "Deelaksha"\nprint(len(name))\nprint(name[0])        # indexing\nprint(name * 2)       # repetition\nprint("eek" in name)  # membership`}
          output={`9\nD\nDeelakshaDeelaksha\nTrue`}
        />
        <P>
          Strings get a full category of their own — see the <strong>Strings</strong> page for
          slicing, methods and immutability end-to-end.
        </P>
      </Section>

      {/* 6 ─ None */}
      <Section id="none" number="06" title="None — The Absence of a Value">
        <P>
          <IC>None</IC> means &quot;nothing here yet&quot;. It is a <strong>singleton</strong> — exactly one
          None object exists in the whole program, which is why <IC>is None</IC> is the correct
          check.
        </P>
        <CodeBlock
          code={`result = None\n\nif result is None:        # ✅ the right way\n    print("no result yet")\n\n# functions without return give None\ndef greet():\n    print("hi")\n\nx = greet()\nprint(x)`}
          output={`no result yet\nhi\nNone`}
        />
        <MemoryDiagram
          caption="Every None in your program is THE same single object"
          vars={[
            { name: "result", value: "None", type: "NoneType" },
            { name: "x", value: "↳ same None object", type: "NoneType" },
          ]}
        />
        <Callout type="mistake">
          <IC>print()</IC> returns <IC>None</IC> — so <IC>x = print(&quot;hi&quot;)</IC> stores None, not
          &quot;hi&quot;. Classic beginner trap.
        </Callout>
      </Section>

      {/* 7 ─ collections preview */}
      <Section id="collections" number="07" title="Collection Types at a Glance">
        <CodeBlock
          code={`marks  = [90, 85, 88]            # list  — ordered, mutable\npoint  = (3, 4)                  # tuple — ordered, immutable\nstudent = {"name": "Deelaksha"}  # dict  — key → value\nuniq   = {1, 2, 2, 3}            # set   — unique, unordered\n\nprint(marks, point, student, uniq)`}
          output={`[90, 85, 88] (3, 4) {'name': 'Deelaksha'} {1, 2, 3}`}
        />
        <Table
          head={["Type", "Brackets", "Ordered", "Mutable", "Duplicates"]}
          rows={[
            ["list", "[ ]", "✅", "✅", "✅"],
            ["tuple", "( )", "✅", "❌", "✅"],
            ["dict", "{k: v}", "✅ (3.7+)", "✅", "keys ❌"],
            ["set", "{ }", "❌", "✅", "❌"],
          ]}
        />
        <Callout type="note">
          Note the set printed <IC>{`{1, 2, 3}`}</IC> — the duplicate 2 vanished automatically.
          Each collection has its own full page later in the course.
        </Callout>
      </Section>

      {/* 8 ─ conversion */}
      <Section id="conversion" number="08" title="Type Conversion (Casting)">
        <FlowDiagram
          steps={[
            { label: 'input() gives str  →  "22"', sub: "everything from input is text" },
            { label: 'int("22")  →  22', sub: "convert before doing math" },
            { label: "str(22)  →  \"22\"", sub: "convert back to join with text" },
          ]}
        />
        <CodeBlock
          code={`print(int("42"))        # str → int\nprint(int(3.99))        # float → int (TRUNCATES, no rounding!)\nprint(float("3.14"))    # str → float\nprint(str(22) + " yrs") # int → str\nprint(bool(0), bool(""), bool([]))   # falsy values\nprint(list("abc"))      # str → list of chars\nprint(int("ff", 16))    # hex string → int`}
          output={`42\n3\n3.14\n22 yrs\nFalse False False\n['a', 'b', 'c']\n255`}
        />
        <Callout type="mistake">
          <IC>int(3.99)</IC> gives <IC>3</IC>, not 4 — it chops the decimals. For real rounding
          use <IC>round(3.99)</IC> → <IC>4</IC>.
        </Callout>
        <CodeBlock
          code={`# 💥 not every string converts\nint("hello")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    int("hello")\nValueError: invalid literal for int() with base 10: 'hello'`}
          error
        />
        <CodeBlock
          code={`# 💥 even "3.14" fails for int() directly\nint("3.14")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    int("3.14")\nValueError: invalid literal for int() with base 10: '3.14'`}
          error
        />
        <Callout type="tip">
          To get an int from <IC>&quot;3.14&quot;</IC>: <IC>int(float(&quot;3.14&quot;))</IC> → 3. Two hops.
        </Callout>
      </Section>

      {/* 9 ─ truthiness */}
      <Section id="truthiness" number="09" title="Truthiness — What Counts as False?">
        <P>
          Every object can act as a condition. Only a small &quot;falsy club&quot; evaluates to{" "}
          <IC>False</IC> — everything else is truthy.
        </P>
        <Table
          head={["Falsy ❌ (only these!)", "Truthy ✅ (everything else)"]}
          rows={[
            ["False, None", "True"],
            ["0, 0.0", "any non-zero number, even -1"],
            ['"" (empty string)', '"0", " " (space!), "False"'],
            ["[], (), {}, set()", "[0], (None,), {'a': 1}"],
          ]}
        />
        <CodeBlock
          code={`cart = []\nif cart:\n    print("checkout")\nelse:\n    print("cart is empty")     # [] is falsy\n\nname = "Deelaksha"\nif name:                       # non-empty str is truthy\n    print(f"hello {name}")`}
          output={`cart is empty\nhello Deelaksha`}
        />
        <Callout type="mistake">
          <IC>&quot;False&quot;</IC> (the string) and <IC>[0]</IC> (list holding zero) are{" "}
          <strong>truthy</strong> — the container isn&apos;t empty, so it passes.
        </Callout>
      </Section>

      {/* 10 ─ float trap */}
      <Section id="float-trap" number="10" title="The Famous 0.1 + 0.2 Trap">
        <CodeBlock
          code={`print(0.1 + 0.2)\nprint(0.1 + 0.2 == 0.3)   # 😱`}
          output={`0.30000000000000004\nFalse`}
        />
        <Callout type="behind">
          Floats are stored in binary. Just like 1/3 can&apos;t be written exactly in decimal
          (0.3333…), 0.1 can&apos;t be written exactly in binary — so tiny errors creep in. This is
          IEEE-754, not a Python bug. Same in C, Java, JS.
        </Callout>
        <CodeBlock
          code={`import math\nfrom decimal import Decimal\n\n# Fix 1 — compare with tolerance\nprint(math.isclose(0.1 + 0.2, 0.3))\n\n# Fix 2 — round before comparing\nprint(round(0.1 + 0.2, 2) == 0.3)\n\n# Fix 3 — exact decimal math (money!)\nprint(Decimal("0.1") + Decimal("0.2"))`}
          output={`True\nTrue\n0.3`}
        />
        <Callout type="tip">
          Interview answer: &quot;Never compare floats with <IC>==</IC>. Use{" "}
          <IC>math.isclose()</IC>, or <IC>Decimal</IC> for money.&quot;
        </Callout>
      </Section>

      {/* 11 ─ exceptions */}
      <Section id="exceptions" number="11" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="TypeError — mixing types"
          code={`print("age: " + 22)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print("age: " + 22)\nTypeError: can only concatenate str (not "int") to str`}
          error
        />
        <CodeBlock
          title="ValueError — bad conversion"
          code={`int("twenty two")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    int("twenty two")\nValueError: invalid literal for int() with base 10: 'twenty two'`}
          error
        />
        <CodeBlock
          title="TypeError — None has no length"
          code={`x = None\nprint(len(x))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(len(x))\nTypeError: object of type 'NoneType' has no len()`}
          error
        />
        <CodeBlock
          title="ZeroDivisionError"
          code={`print(10 / 0)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(10 / 0)\nZeroDivisionError: division by zero`}
          error
        />
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["TypeError", "operation on wrong type", "convert with str()/int() first"],
            ["ValueError", "right type, bad value", "validate / try-except"],
            ["ZeroDivisionError", "x / 0, x % 0", "check divisor before dividing"],
            ["OverflowError", "float too large (math.exp(1000))", "ints never overflow; floats can"],
          ]}
        />
      </Section>

      {/* 12 ─ memorize */}
      <Section id="memorize" number="12" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Check a type", "type(x)\nisinstance(x, (int, float))"],
            ["str → number", 'int("42")\nfloat("3.14")'],
            ["Truncate vs round", "int(3.99)    # 3\nround(3.99)  # 4"],
            ["The falsy club", '0  0.0  ""  []  ()  {}  set()  None  False'],
            ["bool is an int", "True + True   # 2\nsum([True, False, True])  # 2"],
            ["Float compare", "import math\nmath.isclose(0.1 + 0.2, 0.3)"],
            ["Money math", 'from decimal import Decimal\nDecimal("0.1") + Decimal("0.2")'],
            ["/ vs //", "7 / 2    # 3.5 (float)\n7 // 2   # 3   (int)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
