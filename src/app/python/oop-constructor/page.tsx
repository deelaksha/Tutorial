"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram, MemoryDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why __init__?" },
  { id: "first", label: "Your First Constructor ⭐" },
  { id: "flow", label: "What Happens Step by Step" },
  { id: "params", label: "Parameters & Defaults" },
  { id: "computed", label: "Computed & Extra Attributes" },
  { id: "validate", label: "Validation in __init__" },
  { id: "str", label: "__str__ & __repr__ ⭐" },
  { id: "objects-in-objects", label: "Objects Inside Objects" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopConstructorPage() {
  return (
    <TopicShell
      icon="🔧"
      title="Constructor — __init__"
      gradientWord="The Constructor"
      subtitle="__init__ runs automatically the moment an object is born — so every object starts life complete, validated, and ready to use."
      nav={NAV}
      next={{ icon: "🔒", label: "Encapsulation", href: "/python/oop-encapsulation" }}
    >
      {/* 1 ─ why */}
      <Section id="why" number="01" title="Why __init__? The Problem It Solves">
        <CodeBlock
          title="without a constructor — fragile"
          code={`class Student:\n    pass\n\ns = Student()\ns.name = "Deelaksha"\n# forgot s.age!  ...100 lines later:\nprint(s.age)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    print(s.age)\nAttributeError: 'Student' object has no attribute 'age'`}
          error
        />
        <P>
          Setting attributes by hand means you can <strong>forget one</strong> — and the crash
          happens far away from the mistake. The constructor forces every object to be born
          with all its data, or not be born at all.
        </P>
        <Callout type="analogy">
          <IC>__init__</IC> is the <strong>hospital birth checklist</strong> 🏥 — name,
          weight, blood group recorded <em>at birth</em>. No baby leaves incomplete.
        </Callout>
      </Section>

      {/* 2 ─ first */}
      <Section id="first" number="02" title="Your First Constructor ⭐">
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age):\n        self.name = name          # save params INTO the object\n        self.age = age\n        print("born:", name)\n\ns1 = Student("Deelaksha", 22)     # __init__ runs automatically!\ns2 = Student("Maya", 21)\n\nprint(s1.name, s1.age)\nprint(s2.name, s2.age)`}
          output={`born: Deelaksha\nborn: Maya\nDeelaksha 22\nMaya 21`}
        />
        <MemoryDiagram
          vars={[
            { name: "s1.name", value: "'Deelaksha'", type: "str" },
            { name: "s1.age", value: "22", type: "int" },
            { name: "s2.name", value: "'Maya'", type: "str" },
            { name: "s2.age", value: "21", type: "int" },
          ]}
          caption="Student('Deelaksha', 22) → __init__ fills the new object's pockets"
        />
        <Callout type="tip">
          Read <IC>self.name = name</IC> as: &quot;take the parameter <IC>name</IC> and{" "}
          <strong>store it inside this object</strong> under the label <IC>name</IC>.&quot;
          Left side = object&apos;s pocket, right side = incoming value.
        </Callout>
        <Callout type="mistake">
          It&apos;s <IC>__init__</IC> — <strong>two underscores on each side</strong>{" "}
          (&quot;dunder&quot;). Write <IC>_init_</IC> or misspell <IC>__int__</IC> and Python
          treats it as a normal method: no error, it just <strong>never runs</strong>, and
          you get AttributeError later.
        </Callout>
      </Section>

      {/* 3 ─ flow */}
      <Section id="flow" number="03" title="What Happens Step by Step">
        <FlowDiagram
          steps={[
            { label: 'Student("Deelaksha", 22)', sub: "you call the class" },
            { label: "Python allocates empty object", sub: "fresh memory" },
            { label: '__init__(self, "Deelaksha", 22)', sub: "self = the new object" },
            { label: "self.name / self.age set", sub: "pockets filled" },
            { label: "object returned → s1", sub: "ready to use" },
          ]}
        />
        <CodeBlock
          code={`class Demo:\n    def __init__(self):\n        print("2. __init__ runs, self is", id(self))\n\nprint("1. before creation")\nd = Demo()\nprint("3. after — d is        ", id(d))   # SAME object!`}
          output={`1. before creation\n2. __init__ runs, self is 139872345678416\n3. after —  d is         139872345678416`}
        />
        <Callout type="behind">
          You never call <IC>__init__</IC> yourself and you never <IC>return</IC> from it —
          Python creates the object (via <IC>__new__</IC>), hands it to{" "}
          <IC>__init__</IC> as <IC>self</IC> to fill in, then gives it back to you.
        </Callout>
      </Section>

      {/* 4 ─ params */}
      <Section id="params" number="04" title="Parameters & Defaults">
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age=18, city="Bangalore"):\n        self.name = name\n        self.age = age\n        self.city = city\n\na = Student("Deelaksha", 22, "Mysore")   # all positional\nb = Student("Maya")                       # defaults kick in\nc = Student("Ravi", city="Delhi")         # keyword skip\n\nprint(a.name, a.age, a.city)\nprint(b.name, b.age, b.city)\nprint(c.name, c.age, c.city)`}
          output={`Deelaksha 22 Mysore\nMaya 18 Bangalore\nRavi 18 Delhi`}
        />
        <CodeBlock
          title="⚠️ the mutable default trap lives here too"
          code={`class Playlist:\n    def __init__(self, songs=[]):          # ❌ ONE shared list!\n        self.songs = songs\n\np1 = Playlist(); p1.songs.append("song A")\np2 = Playlist()\nprint(p2.songs)                            # p2 born with p1's song 😱`}
          output={`['song A']`}
        />
        <CodeBlock
          code={`class Playlist:\n    def __init__(self, songs=None):        # ✅ the fix\n        self.songs = songs if songs is not None else []\n\np1 = Playlist(); p1.songs.append("song A")\np2 = Playlist()\nprint(p1.songs)\nprint(p2.songs)                            # fresh and empty`}
          output={`['song A']\n[]`}
        />
        <Callout type="mistake">
          Default values are created <strong>once</strong>, at <IC>def</IC> time — every
          object made with the default shares the <em>same</em> list. Rule:{" "}
          <IC>songs=None</IC> → create the fresh list inside.
        </Callout>
      </Section>

      {/* 5 ─ computed */}
      <Section id="computed" number="05" title="Computed & Extra Attributes">
        <P>
          <IC>__init__</IC> isn&apos;t limited to copying parameters — it can{" "}
          <strong>compute</strong> attributes and create state the caller never passed.
        </P>
        <CodeBlock
          code={`class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n        self.area = 3.14159 * radius ** 2     # computed\n        self.id_tag = f"CIR-{radius}"          # derived\n        self.clicks = 0                         # internal state\n\nc = Circle(5)\nprint(c.radius)\nprint(c.area)\nprint(c.id_tag)\nprint(c.clicks)`}
          output={`5\n78.53975\nCIR-5\n0`}
        />
        <CodeBlock
          code={`class BankAccount:\n    def __init__(self, owner, opening=0):\n        self.owner = owner\n        self.balance = opening\n        self.history = []                 # every account gets its OWN log\n\n    def deposit(self, amt):\n        self.balance += amt\n        self.history.append(f"+{amt}")\n\nacc = BankAccount("Deelaksha", 500)\nacc.deposit(200)\nacc.deposit(100)\nprint(acc.balance)\nprint(acc.history)`}
          output={`800\n['+200', '+100']`}
        />
        <Callout type="tip">
          Interview rule of thumb: <strong>all attributes an object will ever have should be
          created in __init__</strong> — even if just <IC>self.history = []</IC>. Readers
          then see the object&apos;s full shape in one place.
        </Callout>
      </Section>

      {/* 6 ─ validate */}
      <Section id="validate" number="06" title="Validation — Refuse Bad Objects at Birth">
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age):\n        if not name:\n            raise ValueError("name cannot be empty")\n        if age < 0 or age > 120:\n            raise ValueError(f"impossible age: {age}")\n        self.name = name\n        self.age = age\n\ns = Student("Deelaksha", 22)\nprint("created:", s.name)\n\nbad = Student("Ghost", -5)          # 💥 never gets created\nprint("you will never see this")`}
          output={`created: Deelaksha\nTraceback (most recent call last):\n  File "main.py", line 13, in <module>\n    bad = Student("Ghost", -5)\n  File "main.py", line 6, in __init__\n    raise ValueError(f"impossible age: {age}")\nValueError: impossible age: -5`}
          error
        />
        <Callout type="behind">
          If <IC>__init__</IC> raises, the assignment <IC>bad = ...</IC> never happens — the
          half-built object is thrown away. <strong>Invalid objects can&apos;t exist</strong>,
          so the rest of your code never has to re-check.
        </Callout>
      </Section>

      {/* 7 ─ str/repr */}
      <Section id="str" number="07" title="__str__ & __repr__ — Make print() Beautiful ⭐">
        <CodeBlock
          title="before — useless print"
          code={`class Student:\n    def __init__(self, name, age):\n        self.name, self.age = name, age\n\ns = Student("Deelaksha", 22)\nprint(s)`}
          output={`<__main__.Student object at 0x7f3a1c2b4e50>`}
        />
        <CodeBlock
          title="after — __str__ defines what print() shows"
          code={`class Student:\n    def __init__(self, name, age):\n        self.name, self.age = name, age\n\n    def __str__(self):\n        return f"Student({self.name}, {self.age})"\n\n    def __repr__(self):                    # for debugging / lists\n        return f"Student(name={self.name!r}, age={self.age})"\n\ns = Student("Deelaksha", 22)\nprint(s)                  # uses __str__\nprint([s, s])             # containers use __repr__!`}
          output={`Student(Deelaksha, 22)\n[Student(name='Deelaksha', age=22), Student(name='Deelaksha', age=22)]`}
        />
        <Table
          head={["Dunder", "Used by", "Audience"]}
          rows={[
            ["__str__", "print(obj), f\"{obj}\"", "end users — pretty"],
            ["__repr__", "REPL, lists, debugger", "developers — precise"],
            ["fallback", "no __str__? print uses __repr__", "define __repr__ at minimum"],
          ]}
        />
        <Callout type="mistake">
          <IC>__str__</IC> must <strong>return</strong> a string — using{" "}
          <IC>print()</IC> inside it returns <IC>None</IC> and crashes with{" "}
          <IC>TypeError: __str__ returned non-string (type NoneType)</IC>.
        </Callout>
      </Section>

      {/* 8 ─ objects in objects */}
      <Section id="objects-in-objects" number="08" title="Objects Inside Objects — Composition">
        <CodeBlock
          code={`class Address:\n    def __init__(self, city, pincode):\n        self.city = city\n        self.pincode = pincode\n\nclass Student:\n    def __init__(self, name, address):\n        self.name = name\n        self.address = address           # an object as attribute!\n\nhome = Address("Bangalore", 560001)\ns = Student("Deelaksha", home)\n\nprint(s.name)\nprint(s.address.city)                    # chain the dots\nprint(s.address.pincode)`}
          output={`Deelaksha\nBangalore\n560001`}
        />
        <FlowDiagram
          steps={[
            { label: "s", sub: "Student object" },
            { label: "s.address", sub: "→ Address object" },
            { label: "s.address.city", sub: "→ 'Bangalore'" },
          ]}
        />
        <Callout type="analogy">
          This is <strong>composition</strong> — &quot;has-a&quot;. A Student{" "}
          <em>has an</em> Address; a Car <em>has an</em> Engine. Real programs are objects
          built from smaller objects, dots all the way down.
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="TypeError — missing required argument"
          code={`class Student:\n    def __init__(self, name, age):\n        self.name, self.age = name, age\n\ns = Student("Deelaksha")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    s = Student("Deelaksha")\nTypeError: Student.__init__() missing 1 required positional argument: 'age'`}
          error
        />
        <CodeBlock
          title="TypeError — __init__ must return None"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name\n        return self                     # ❌ never return from __init__\n\ns = Student("Deelaksha")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    s = Student("Deelaksha")\nTypeError: __init__() should return None, not 'Student'`}
          error
        />
        <CodeBlock
          title="Silent bug — misspelled dunder never runs"
          code={`class Student:\n    def _init_(self, name):       # ❌ single underscores\n        self.name = name\n\ns = Student("Deelaksha")          # no error here!\nprint(s.name)                     # 💥 crash far away`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    print(s.name)\nAttributeError: 'Student' object has no attribute 'name'`}
          error
        />
        <Table
          head={["Error", "Cause", "Fix"]}
          rows={[
            ["missing N required positional arguments", "didn't pass what __init__ needs", "Student('Dee', 22)"],
            ["__init__() should return None", "return value from constructor", "just set self.x; no return"],
            ["AttributeError after creation", "_init_ misspelled / __int__", "exactly __init__"],
            ["all objects share one list", "mutable default songs=[]", "songs=None → [] inside"],
          ]}
        />
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["The skeleton", "class Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age"],
            ["Create", 's = Student("Dee", 22)'],
            ["__init__ is", "auto-called at object creation"],
            ["self.x = x means", "store param x inside the object"],
            ["Never", "return a value from __init__"],
            ["Mutable default fix", "def __init__(self, items=None):\n    self.items = items or []"],
            ["Pretty print", 'def __str__(self):\n    return f"Student({self.name})"'],
            ["Validate at birth", 'if age < 0:\n    raise ValueError("bad age")'],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
