"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram, MemoryDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "Class vs Object ⭐" },
  { id: "define", label: "Defining a Class" },
  { id: "create", label: "Creating Objects" },
  { id: "attributes", label: "Instance Attributes" },
  { id: "methods", label: "Methods" },
  { id: "self", label: "self Explained ⭐" },
  { id: "many", label: "Many Independent Objects" },
  { id: "class-attrs", label: "Class Attributes" },
  { id: "inspect", label: "Inspecting Objects" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopClassesPage() {
  return (
    <TopicShell
      icon="🏗️"
      title="Classes & Objects"
      gradientWord="Classes & Objects"
      subtitle="The blueprint and the houses built from it. Define once, create many — every attribute and method drawn in memory."
      nav={NAV}
      next={{ icon: "🔧", label: "Constructor — __init__", href: "/python/oop-constructor" }}
    >
      {/* 1 ─ idea */}
      <Section id="idea" number="01" title="Class vs Object — The Core Idea ⭐">
        <P>
          A <strong>class</strong> is a blueprint. An <strong>object</strong> (instance) is a
          real thing built from that blueprint. One blueprint → unlimited houses, each with
          its own paint color.
        </P>
        <FlowDiagram
          steps={[
            { label: "class Student:", sub: "blueprint — describes, stores nothing" },
            { label: "s1 = Student()", sub: "object #1 — real data in memory" },
            { label: "s2 = Student()", sub: "object #2 — totally separate" },
          ]}
        />
        <Table
          head={["", "Class", "Object"]}
          rows={[
            ["What", "blueprint / template", "real instance built from it"],
            ["How many", "written once", "as many as you want"],
            ["Holds data?", "describes what data exists", "holds the actual values"],
            ["Analogy", "cookie cutter 🍪", "the cookies"],
            ["In code", "class Student:", "s1 = Student()"],
          ]}
        />
        <Callout type="analogy">
          <strong>Aadhaar form vs filled form.</strong> The blank form (class) defines the
          fields: name, age, city. Each filled form (object) is one real person&apos;s data —
          Deelaksha&apos;s form doesn&apos;t change when someone else fills theirs.
        </Callout>
      </Section>

      {/* 2 ─ define */}
      <Section id="define" number="02" title="Defining a Class">
        <CodeBlock
          code={`class Student:\n    pass                  # empty blueprint for now\n\nprint(Student)\nprint(type(Student))      # a class is an object too!`}
          output={`<class '__main__.Student'>\n<class 'type'>`}
        />
        <Callout type="tip">
          Naming rules: classes use <strong>PascalCase</strong> — <IC>Student</IC>,{" "}
          <IC>BankAccount</IC>, <IC>HttpServer</IC>. Variables and functions use{" "}
          <IC>snake_case</IC>. One glance tells you what&apos;s a class.
        </Callout>
        <CodeBlock
          code={`# defining ≠ running. Nothing "happens" until you create objects\nclass Dog:\n    print("class body runs ONCE, at definition")\n\nprint("---")\nd1 = Dog()\nd2 = Dog()        # body does NOT run again`}
          output={`class body runs ONCE, at definition\n---`}
        />
        <Callout type="behind">
          Python executes the class body <strong>once</strong> when it reads the{" "}
          <IC>class</IC> statement — that&apos;s how methods and class attributes get
          registered. Creating objects later doesn&apos;t re-run the body.
        </Callout>
      </Section>

      {/* 3 ─ create */}
      <Section id="create" number="03" title="Creating Objects — Calling the Class">
        <CodeBlock
          code={`class Student:\n    pass\n\ns1 = Student()        # class name + () = new object\ns2 = Student()\n\nprint(s1)\nprint(s2)\nprint(s1 is s2)       # two DIFFERENT objects\nprint(type(s1))`}
          output={`<__main__.Student object at 0x7f3a1c2b4e50>\n<__main__.Student object at 0x7f3a1c2b4f10>\nFalse\n<class '__main__.Student'>`}
        />
        <MemoryDiagram
          vars={[
            { name: "s1", value: "Student object @ 0x...e50", type: "Student" },
            { name: "s2", value: "Student object @ 0x...f10", type: "Student" },
          ]}
          caption="Each call to Student() allocates a brand-new object at a new address"
        />
        <Callout type="behind">
          That weird <IC>at 0x7f3a...</IC> is the object&apos;s memory address — proof that{" "}
          <IC>s1</IC> and <IC>s2</IC> live in different places. You&apos;ll make this print
          pretty with <IC>__str__</IC> in the constructor topic.
        </Callout>
      </Section>

      {/* 4 ─ attributes */}
      <Section id="attributes" number="04" title="Instance Attributes — Data Inside the Object">
        <CodeBlock
          code={`class Student:\n    pass\n\ns1 = Student()\ns1.name = "Deelaksha"     # attach data with dot notation\ns1.age = 22\ns1.city = "Bangalore"\n\nprint(s1.name)\nprint(s1.age, s1.city)`}
          output={`Deelaksha\n22 Bangalore`}
        />
        <MemoryDiagram
          vars={[
            { name: "s1.name", value: "'Deelaksha'", type: "str" },
            { name: "s1.age", value: "22", type: "int" },
            { name: "s1.city", value: "'Bangalore'", type: "str" },
          ]}
          caption="Attributes live INSIDE the object — like labeled pockets"
        />
        <CodeBlock
          code={`# each object's pockets are separate\ns2 = Student()\ns2.name = "Maya"\n\nprint(s1.name)        # untouched\nprint(s2.name)`}
          output={`Deelaksha\nMaya`}
        />
        <Callout type="mistake">
          Attaching attributes from outside like this works but is fragile — forget one and
          you get <IC>AttributeError</IC>. The professional way is <IC>__init__</IC> (next
          topic), which guarantees every object is born complete.
        </Callout>
      </Section>

      {/* 5 ─ methods */}
      <Section id="methods" number="05" title="Methods — Functions That Live in the Class">
        <CodeBlock
          code={`class Student:\n    def introduce(self):              # a method = def inside class\n        print("Hi, I am", self.name)\n\n    def birthday(self):\n        self.age = self.age + 1\n        print("Now I am", self.age)\n\ns = Student()\ns.name = "Deelaksha"\ns.age = 22\n\ns.introduce()         # object.method()\ns.birthday()\ns.birthday()`}
          output={`Hi, I am Deelaksha\nNow I am 23\nNow I am 24`}
        />
        <Table
          head={["Function", "Method"]}
          rows={[
            ["def outside any class", "def inside a class"],
            ["greet(s)", "s.greet()"],
            ["works on whatever you pass", "works on the object before the dot"],
            ["no self", "first parameter is always self"],
          ]}
        />
        <Callout type="analogy">
          Attributes are what an object <strong>has</strong> (name, age); methods are what it
          can <strong>do</strong> (introduce, birthday). A phone <em>has</em> a battery
          level and <em>can</em> make calls.
        </Callout>
      </Section>

      {/* 6 ─ self */}
      <Section id="self" number="06" title="self Explained — Who Is Calling? ⭐">
        <P>
          <IC>self</IC> means <strong>&quot;the object before the dot&quot;</strong>. When you
          write <IC>s1.introduce()</IC>, Python secretly translates it to{" "}
          <IC>Student.introduce(s1)</IC> — the object is passed in as the first argument.
        </P>
        <FlowDiagram
          steps={[
            { label: "s1.introduce()", sub: "what you write" },
            { label: "Student.introduce(s1)", sub: "what Python actually runs" },
            { label: "self = s1", sub: "inside the method" },
            { label: "self.name → s1.name", sub: "'Deelaksha'" },
          ]}
        />
        <CodeBlock
          code={`class Student:\n    def introduce(self):\n        print("Hi, I am", self.name)\n\ns1 = Student(); s1.name = "Deelaksha"\ns2 = Student(); s2.name = "Maya"\n\ns1.introduce()                  # self becomes s1\ns2.introduce()                  # self becomes s2\n\nStudent.introduce(s1)           # the long form — identical!`}
          output={`Hi, I am Deelaksha\nHi, I am Maya\nHi, I am Deelaksha`}
        />
        <Callout type="tip">
          <IC>self</IC> is just a naming convention — Python only cares that the{" "}
          <strong>first parameter</strong> receives the object. But never rename it;
          every Python developer expects <IC>self</IC>.
        </Callout>
        <CodeBlock
          title="💥 the #1 beginner crash — forgot self"
          code={`class Student:\n    def introduce():              # ❌ no self\n        print("hi")\n\ns = Student()\ns.introduce()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    s.introduce()\nTypeError: Student.introduce() takes 0 positional arguments but 1 was given`}
          error
        />
        <Callout type="mistake">
          &quot;takes 0 positional arguments but <strong>1 was given</strong>&quot; — the
          mysterious 1 is the object itself being auto-passed. Whenever you see this error
          on a method, the fix is: add <IC>self</IC>.
        </Callout>
      </Section>

      {/* 7 ─ many objects */}
      <Section id="many" number="07" title="Many Independent Objects">
        <CodeBlock
          code={`class Counter:\n    def start(self):\n        self.count = 0\n    def click(self):\n        self.count += 1\n\ndoor_a = Counter(); door_a.start()\ndoor_b = Counter(); door_b.start()\n\ndoor_a.click()\ndoor_a.click()\ndoor_a.click()\ndoor_b.click()\n\nprint("Door A:", door_a.count)\nprint("Door B:", door_b.count)     # untouched by A's clicks!`}
          output={`Door A: 3\nDoor B: 1`}
        />
        <Callout type="behind">
          This is the whole point of OOP: each object carries its <strong>own state</strong>.
          With plain variables you&apos;d need <IC>count_a</IC>, <IC>count_b</IC>,{" "}
          <IC>count_c</IC>… With a class, you just build another object.
        </Callout>
        <CodeBlock
          code={`# objects work inside lists, dicts, loops — like any value\npeople = []\nfor name in ["Dee", "John", "Maya"]:\n    p = Counter()\n    p.start()\n    p.name = name\n    people.append(p)\n\nfor p in people:\n    print(p.name, p.count)`}
          output={`Dee 0\nJohn 0\nMaya 0`}
        />
      </Section>

      {/* 8 ─ class attrs */}
      <Section id="class-attrs" number="08" title="Class Attributes — Shared by All">
        <CodeBlock
          code={`class Student:\n    school = "Visual High"        # CLASS attribute — one copy, shared\n\n    def set_name(self, name):\n        self.name = name          # INSTANCE attribute — per object\n\ns1 = Student(); s1.set_name("Deelaksha")\ns2 = Student(); s2.set_name("Maya")\n\nprint(s1.school, "|", s1.name)\nprint(s2.school, "|", s2.name)\n\nStudent.school = "New Campus"     # change ONCE on the class...\nprint(s1.school)\nprint(s2.school)                  # ...everyone sees it`}
          output={`Visual High | Deelaksha\nVisual High | Maya\nNew Campus\nNew Campus`}
        />
        <CodeBlock
          title="⚠️ the shadowing trap"
          code={`s1.school = "Private School"   # creates s1's OWN copy (shadow)\n\nprint(s1.school)               # personal copy wins\nprint(s2.school)               # still the shared one\nprint(Student.school)`}
          output={`Private School\nNew Campus\nNew Campus`}
        />
        <Callout type="behind">
          Attribute lookup order: <strong>object first, then class</strong>.{" "}
          <IC>s1.school = ...</IC> never modifies the class — it plants a personal copy on{" "}
          <IC>s1</IC> that shadows the shared one forever after.
        </Callout>
      </Section>

      {/* 9 ─ inspect */}
      <Section id="inspect" number="09" title="Inspecting Objects — Your X-Ray Tools">
        <CodeBlock
          code={`class Student:\n    school = "Visual High"\n\ns = Student()\ns.name = "Deelaksha"\ns.age = 22\n\nprint(s.__dict__)               # instance attributes as a dict!\nprint(type(s).__name__)\nprint(isinstance(s, Student))\nprint(hasattr(s, "name"))\nprint(hasattr(s, "marks"))\nprint(getattr(s, "marks", 0))   # safe get with default`}
          output={`{'name': 'Deelaksha', 'age': 22}\nStudent\nTrue\nTrue\nFalse\n0`}
        />
        <Table
          head={["Tool", "Answers", "Example"]}
          rows={[
            ["obj.__dict__", "what's inside this object?", "{'name': 'Deelaksha'}"],
            ["type(obj)", "which class built it?", "Student"],
            ["isinstance(obj, C)", "is it a C (or subclass)?", "True"],
            ["hasattr(obj, 'x')", "does the attribute exist?", "False"],
            ["getattr(obj, 'x', d)", "get it, or default — no crash", "0"],
            ["dir(obj)", "every attribute + method name", "long list"],
          ]}
        />
        <Callout type="tip">
          Debugging an object? <IC>print(obj.__dict__)</IC> is the fastest X-ray — it shows
          exactly which instance attributes exist right now.
        </Callout>
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="AttributeError — attribute never created"
          code={`class Student:\n    pass\n\ns = Student()\nprint(s.name)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(s.name)\nAttributeError: 'Student' object has no attribute 'name'`}
          error
        />
        <CodeBlock
          title="TypeError — forgot self in the method"
          code={`class Dog:\n    def bark():\n        print("woof")\n\nDog().bark()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    Dog().bark()\nTypeError: Dog.bark() takes 0 positional arguments but 1 was given`}
          error
        />
        <CodeBlock
          title="Forgot the () — you grabbed the class, not an object"
          code={`class Student:\n    pass\n\ns = Student          # ❌ no parentheses\ns.name = "Dee"       # you just modified the CLASS!\n\ns2 = Student()\nprint(s2.name)       # leaked into every future object 😱`}
          output={`Dee`}
        />
        <Table
          head={["Error / Bug", "Cause", "Fix"]}
          rows={[
            ["AttributeError", "used attribute before setting it", "set in __init__ (next topic)"],
            ["TypeError: takes 0 ... 1 given", "method without self", "add self as first param"],
            ["NameError: name 'self'...", "used self outside the class", "self exists only inside methods"],
            ["class modified by accident", "s = Student (no parens)", "s = Student()"],
          ]}
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Define + create", "class Student:\n    pass\ns = Student()"],
            ["Method skeleton", "def greet(self):\n    print(self.name)"],
            ["self =", "the object before the dot"],
            ["s.m() really is", "Student.m(s)"],
            ["Lookup order", "instance first, then class"],
            ["X-ray an object", "print(obj.__dict__)"],
            ["Type checks", "isinstance(s, Student)"],
            ["'takes 0 args but 1 given'", "you forgot self"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
