"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, MemoryDiagram, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why OOP At All?" },
  { id: "class-object", label: "Class vs Object" },
  { id: "init", label: "__init__ & self ⭐" },
  { id: "self-deep", label: "self — Deep Dive ⭐⭐" },
  { id: "object-memory", label: "An Object in Memory" },
  { id: "methods", label: "Methods" },
  { id: "attributes", label: "Instance vs Class Attrs" },
  { id: "str", label: "__str__ — Pretty Print" },
  { id: "inheritance", label: "Inheritance ⭐" },
  { id: "super", label: "super()" },
  { id: "override", label: "Method Overriding" },
  { id: "encapsulation", label: "Private by Convention" },
  { id: "pillars", label: "The 4 Pillars Map 🗺️" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopPage() {
  return (
    <TopicShell
      icon="🏛️"
      title="OOP & Classes — Overview"
      gradientWord="Python OOP"
      subtitle="Classes are blueprints, objects are the houses. self, __init__, inheritance and overriding — drawn in memory so it finally clicks. Then go deep with the 6 dedicated OOP topics."
      nav={NAV}
      next={{ icon: "🏗️", label: "Deep Dive: Classes & Objects", href: "/python/oop-classes" }}
    >
      {/* 0 ─ why oop */}
      <Section id="why" number="01" title="Why OOP At All? — The Problem It Solves">
        <CodeBlock
          title="without OOP — parallel variables that drift apart"
          runnable={false}
          code={`# 3 students, plain variables:\nstudent1_name = "Deelaksha"; student1_age = 22; student1_marks = [90, 85]\nstudent2_name = "John";      student2_age = 25; student2_marks = [70, 60]\nstudent3_name = "Maya";      student3_age = 21; student3_marks = [88, 92]\n\n# functions must juggle the right trio every time:\ndef average(marks): ...\naverage(student2_marks)        # pass the WRONG one? no error, wrong answer\n\n# 100 students? 300 variables. Add 'city'? edit EVERYWHERE. 😩`}
        />
        <CodeBlock
          title="with OOP — data + behavior travel together"
          code={`class Student:\n    def __init__(self, name, age, marks):\n        self.name = name\n        self.age = age\n        self.marks = marks\n\n    def average(self):\n        return sum(self.marks) / len(self.marks)\n\nstudents = [\n    Student("Deelaksha", 22, [90, 85]),\n    Student("John", 25, [70, 60]),\n    Student("Maya", 21, [88, 92]),\n]\n\nfor s in students:\n    print(s.name, "→", s.average())     # data can't get mixed up`}
          output={`Deelaksha → 87.5\nJohn → 65.0\nMaya → 90.0`}
        />
        <Table
          head={["", "Plain variables", "OOP"]}
          rows={[
            ["100 students", "300 loose variables", "one list of objects"],
            ["Add a field", "edit every function call", "one line in __init__"],
            ["Wrong-data bugs", "easy — anything can be passed", "impossible — data rides inside"],
            ["Behavior", "functions far from data", "methods live WITH the data"],
          ]}
        />
        <Callout type="analogy">
          OOP is a <strong>school bag per student</strong> 🎒 — books, ID card and lunch
          travel together as one unit. Without it you&apos;re carrying 300 loose items and
          praying you hand the right lunch to the right kid.
        </Callout>
      </Section>

      {/* 1 ─ class vs object */}
      <Section id="class-object" number="02" title="Class vs Object — Blueprint vs House">
        <CodeBlock
          code={`class Student:                 # the BLUEPRINT\n    pass\n\ns1 = Student()                 # house #1 built from it\ns2 = Student()                 # house #2 — separate!\n\nprint(type(s1))\nprint(s1 is s2)                # two different objects`}
          output={`<class '__main__.Student'>\nFalse`}
        />
        <MemoryDiagram
          caption="One class object, many independent instances"
          vars={[
            { name: "Student", value: "class (blueprint)", type: "type" },
            { name: "s1", value: "Student instance #1", type: "Student" },
            { name: "s2", value: "Student instance #2", type: "Student" },
          ]}
        />
        <Callout type="analogy">
          Class = cookie cutter 🍪 shape. Objects = the actual cookies. You bite cookies, not
          the cutter — data lives in instances.
        </Callout>
      </Section>

      {/* 2 ─ init & self */}
      <Section id="init" number="03" title="__init__ & self — Birth of an Object ⭐">
        <FlowDiagram
          steps={[
            { label: 'Student("Deelaksha", 22)', sub: "Python creates an empty object" },
            { label: "__init__(self, name, age) runs", sub: "self = that new empty object" },
            { label: "self.name = name", sub: "data gets ATTACHED to the object" },
          ]}
        />
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age):   # runs automatically on creation\n        self.name = name              # attach data to THIS object\n        self.age = age\n\ns1 = Student("Deelaksha", 22)\ns2 = Student("John", 25)\n\nprint(s1.name, s1.age)\nprint(s2.name, s2.age)               # separate data!`}
          output={`Deelaksha 22\nJohn 25`}
        />
        <Callout type="behind">
          <IC>self</IC> is just &quot;the object being worked on&quot;. <IC>s1.name</IC> works because
          during <IC>s1 = Student(...)</IC>, self <em>was</em> s1. Python passes it
          automatically — you never type it in the call.
        </Callout>
      </Section>

      {/* 3b ─ self deep dive */}
      <Section id="self-deep" number="04" title="self — The Deep Dive ⭐⭐">
        <P>
          <IC>self</IC> confuses everyone at first because it&apos;s{" "}
          <strong>invisible at the call site</strong>. The whole mystery dissolves with one
          fact: <IC>s1.greet()</IC> is pure shorthand — Python rewrites it as{" "}
          <IC>Student.greet(s1)</IC>. The object before the dot is silently passed as the
          first argument, and the parameter that catches it is named <IC>self</IC>.
        </P>
        <FlowDiagram
          steps={[
            { label: "s1.greet()", sub: "what you write — 0 arguments" },
            { label: "Student.greet(s1)", sub: "what Python runs — 1 argument!" },
            { label: "def greet(self):", sub: "self catches s1" },
            { label: "self.name", sub: "= s1.name = 'Deelaksha'" },
          ]}
        />
        <CodeBlock
          title="proof 1 — the shorthand and the long form are identical"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        print("Hi, I am", self.name)\n\ns1 = Student("Deelaksha")\ns2 = Student("Maya")\n\ns1.greet()                  # short form: self = s1\ns2.greet()                  # same method, self = s2 → different output!\nStudent.greet(s1)           # long form — EXACTLY the same call`}
          output={`Hi, I am Deelaksha\nHi, I am Maya\nHi, I am Deelaksha`}
        />
        <CodeBlock
          title="proof 2 — self IS the object (same id, same memory)"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name\n        print("inside __init__, id(self) =", id(self))\n    def whoami(self):\n        print("inside whoami,  id(self) =", id(self))\n\ns1 = Student("Deelaksha")\nprint("outside,        id(s1)   =", id(s1))\ns1.whoami()\n# all three numbers match — self and s1 are ONE object`}
          output={`inside __init__, id(self) = 139872345678416\noutside,        id(s1)   = 139872345678416\ninside whoami,  id(self) = 139872345678416`}
        />
        <CodeBlock
          title="proof 3 — self.x vs plain x are DIFFERENT worlds"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name        # saved ON the object → lives forever\n        nickname = name[:3]     # plain local → dies when __init__ ends\n\n    def show(self):\n        print(self.name)        # ✅ still there\n        print(nickname)         # 💥 never existed here\n\ns = Student("Deelaksha")\ns.show()`}
          output={`Deelaksha\nTraceback (most recent call last):\n  File "main.py", line 11, in <module>\n    s.show()\n  File "main.py", line 8, in show\n    print(nickname)\nNameError: name 'nickname' is not defined`}
          error
        />
        <Table
          head={["Question about self", "Answer"]}
          rows={[
            ["What is it?", "the object before the dot — nothing more"],
            ["Who passes it?", "Python, automatically, on every method call"],
            ["Why first parameter?", "that's the slot the auto-passed object lands in"],
            ["Is the name special?", "no — convention only, but NEVER rename it"],
            ["self.x = ...", "stores x on THIS object (permanent)"],
            ["x = ... (no self)", "local variable — gone when the method returns"],
            ["Forgot self in def?", "TypeError: takes 0 positional args but 1 was given"],
            ["Forgot self. when reading?", "NameError: name 'x' is not defined"],
          ]}
        />
        <Callout type="analogy">
          A doctor&apos;s clinic 🩺: one doctor (the method, written once in the class),
          many patients (objects). When patient s1 walks in, <IC>self</IC> is the{" "}
          <strong>file on the desk</strong> — same doctor, same procedure, but every
          prescription is written into <em>that patient&apos;s</em> file. Next patient,
          new file, same doctor.
        </Callout>
        <Callout type="tip">
          Two golden rules that prevent 90% of beginner OOP bugs:{" "}
          <strong>① every method&apos;s first parameter is self</strong> —{" "}
          <strong>② anything the object must remember gets the self. prefix</strong>{" "}
          (writing <em>and</em> reading).
        </Callout>
      </Section>

      {/* 3c ─ object in memory */}
      <Section id="object-memory" number="05" title="An Object in Memory — What Actually Exists">
        <CodeBlock
          code={`class Student:\n    school = "Visual High"            # stored ONCE, on the class\n\n    def __init__(self, name, age):\n        self.name = name              # stored on EACH object\n        self.age = age\n\ns1 = Student("Deelaksha", 22)\ns2 = Student("Maya", 21)\n\nprint(s1.__dict__)                    # X-ray of object 1\nprint(s2.__dict__)                    # X-ray of object 2\nprint(Student.school)                 # shared, on the blueprint`}
          output={`{'name': 'Deelaksha', 'age': 22}\n{'name': 'Maya', 'age': 21}\nVisual High`}
        />
        <MemoryDiagram
          caption="The class holds methods + shared data ONCE; each object holds only its own attributes"
          vars={[
            { name: "Student (class)", value: "school, __init__, methods", type: "type" },
            { name: "s1", value: "{name: 'Deelaksha', age: 22}", type: "Student" },
            { name: "s2", value: "{name: 'Maya', age: 21}", type: "Student" },
          ]}
        />
        <Callout type="behind">
          Methods are <strong>not copied</strong> into every object — they live once on the
          class, and <IC>self</IC> is how one shared method works on many objects.
          That&apos;s the whole design: <strong>code on the class, data on the
          instances, self as the bridge</strong>.
        </Callout>
      </Section>

      {/* 3 ─ methods */}
      <Section id="methods" number="06" title="Methods — Functions That Live on Objects">
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\n    def average(self):                    # method = function + self\n        return sum(self.marks) / len(self.marks)\n\n    def has_passed(self):\n        return self.average() >= 40       # methods can call methods\n\ns = Student("Deelaksha", [90, 85, 88])\nprint(s.average())\nprint(s.has_passed())`}
          output={`87.66666666666667\nTrue`}
        />
        <CodeBlock
          code={`# 💥 forgetting self in the definition\nclass Bad:\n    def hello():            # ❌ no self!\n        print("hi")\n\nBad().hello()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    Bad().hello()\nTypeError: Bad.hello() takes 0 positional arguments but 1 was given`}
          error
        />
        <Callout type="mistake">
          &quot;takes 0 positional arguments but 1 was given&quot; = <strong>you forgot self</strong>.
          The mysterious &quot;1&quot; is the object itself being auto-passed.
        </Callout>
      </Section>

      {/* 4 ─ attributes */}
      <Section id="attributes" number="07" title="Instance vs Class Attributes">
        <CodeBlock
          code={`class Student:\n    school = "ABC Academy"        # CLASS attr — shared by all\n\n    def __init__(self, name):\n        self.name = name           # INSTANCE attr — per object\n\ns1 = Student("Deelaksha")\ns2 = Student("John")\n\nprint(s1.school, "|", s2.school)   # same shared value\n\nStudent.school = "XYZ School"      # change on the CLASS → all see it\nprint(s1.school, "|", s2.school)\n\ns1.school = "Private Tutor"        # ⚠️ creates s1's OWN copy\nprint(s1.school, "|", s2.school)   # s2 still follows the class`}
          output={`ABC Academy | ABC Academy\nXYZ School | XYZ School\nPrivate Tutor | XYZ School`}
        />
        <Callout type="behind">
          Lookup order: instance first, then class. Assigning via <IC>s1.school = ...</IC>{" "}
          doesn&apos;t change the class — it shadows it with a new instance attribute. Classic
          interview trick.
        </Callout>
      </Section>

      {/* 5 ─ __str__ */}
      <Section id="str" number="08" title="__str__ — Make print() Friendly">
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\ns = Student("Deelaksha", 22)\nprint(s)        # 😕 useless default`}
          output={`<__main__.Student object at 0x7f3a2c1d4e50>`}
        />
        <CodeBlock
          code={`class Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n    def __str__(self):                       # what print() shows\n        return f"Student({self.name}, {self.age})"\n\ns = Student("Deelaksha", 22)\nprint(s)        # 😍 readable`}
          output={`Student(Deelaksha, 22)`}
        />
        <Callout type="note">
          Methods with double underscores (<IC>__init__</IC>, <IC>__str__</IC>, <IC>__len__</IC>…)
          are &quot;dunders&quot; — hooks Python calls for you at the right moments.
        </Callout>
      </Section>

      {/* 6 ─ inheritance */}
      <Section id="inheritance" number="09" title="Inheritance — Reuse the Blueprint ⭐">
        <CodeBlock
          code={`class Animal:                       # parent / base\n    def __init__(self, name):\n        self.name = name\n\n    def eat(self):\n        print(self.name, "is eating")\n\nclass Dog(Animal):                  # child inherits EVERYTHING\n    def bark(self):                 # ...and adds its own\n        print(self.name, "says woof!")\n\nd = Dog("Bruno")\nd.eat()                             # from Animal — free!\nd.bark()                            # Dog's own\n\nprint(isinstance(d, Dog), isinstance(d, Animal))\nprint(issubclass(Dog, Animal))`}
          output={`Bruno is eating\nBruno says woof!\nTrue True\nTrue`}
        />
        <FlowDiagram
          steps={[
            { label: "d.eat() — look in Dog", sub: "not found there…" },
            { label: "climb to parent: Animal", sub: "found eat() → run it with self = d" },
            { label: "this climb is the MRO", sub: "Method Resolution Order: Dog → Animal → object" },
          ]}
        />
      </Section>

      {/* 7 ─ super */}
      <Section id="super" number="10" title="super() — Call the Parent's Version">
        <CodeBlock
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, name, breed):\n        super().__init__(name)      # let parent set name\n        self.breed = breed          # child adds its part\n\nd = Dog("Bruno", "Labrador")\nprint(d.name, "-", d.breed)`}
          output={`Bruno - Labrador`}
        />
        <CodeBlock
          code={`# 💥 child __init__ WITHOUT super() loses parent setup\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, breed):     # forgot super().__init__!\n        self.breed = breed\n\nd = Dog("Labrador")\nprint(d.name)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 11, in <module>\n    print(d.name)\nAttributeError: 'Dog' object has no attribute 'name'`}
          error
        />
        <Callout type="mistake">
          Defining <IC>__init__</IC> in the child <strong>replaces</strong> the parent&apos;s —
          parent setup runs only if you call <IC>super().__init__(...)</IC> yourself.
        </Callout>
      </Section>

      {/* 8 ─ override */}
      <Section id="override" number="11" title="Method Overriding — Same Name, New Behavior">
        <CodeBlock
          code={`class Animal:\n    def speak(self):\n        print("some generic sound")\n\nclass Dog(Animal):\n    def speak(self):                # OVERRIDES the parent\n        print("woof! 🐶")\n\nclass Cat(Animal):\n    def speak(self):\n        print("meow! 🐱")\n\n# polymorphism: same call, different behavior\nfor pet in [Dog(), Cat(), Animal()]:\n    pet.speak()`}
          output={`woof! 🐶\nmeow! 🐱\nsome generic sound`}
        />
        <Callout type="tip">
          That loop is <strong>polymorphism</strong> — code calls <IC>pet.speak()</IC> without
          caring which class it got. The object itself decides what happens.
        </Callout>
      </Section>

      {/* 9 ─ encapsulation */}
      <Section id="encapsulation" number="12" title="Private by Convention — _ and __">
        <CodeBlock
          code={`class Account:\n    def __init__(self, balance):\n        self._balance = balance        # _ = "internal, please don't touch"\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError("deposit must be positive")\n        self._balance += amount\n\n    def get_balance(self):\n        return self._balance\n\nacc = Account(100)\nacc.deposit(50)\nprint(acc.get_balance())`}
          output={`150`}
        />
        <CodeBlock
          code={`# __double underscore → name mangling\nclass Vault:\n    def __init__(self):\n        self.__secret = "hidden"\n\nv = Vault()\nprint(v.__secret)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    print(v.__secret)\nAttributeError: 'Vault' object has no attribute '__secret'`}
          error
        />
        <Callout type="behind">
          Python has no true private. <IC>_x</IC> = polite warning. <IC>__x</IC> gets renamed to{" "}
          <IC>_Vault__x</IC> (name mangling) — hidden from accidents, not from determined code.
        </Callout>
      </Section>

      {/* 9b ─ pillars map */}
      <Section id="pillars" number="13" title="The 4 Pillars Map 🗺️ — Where to Go Deeper">
        <P>
          Everything above is the foundation. OOP stands on <strong>four pillars</strong> —
          each has its own dedicated deep-dive page with full exception cases and interview
          kits:
        </P>
        <Table
          head={["Pillar", "One-liner", "Deep-dive page"]}
          rows={[
            ["🏗️ Classes & Objects", "blueprint vs instance, self decoded", "/python/oop-classes"],
            ["🔧 Constructor", "__init__, defaults, validation, __str__", "/python/oop-constructor"],
            ["🔒 Encapsulation", "hide data: _x, __x, @property", "/python/oop-encapsulation"],
            ["🎭 Abstraction", "hide complexity: ABC, @abstractmethod", "/python/oop-abstraction"],
            ["🧬 Inheritance", "reuse: child(Parent), super(), MRO", "/python/oop-inheritance"],
            ["🦆 Polymorphism", "one name, many forms: overriding, dunders", "/python/oop-polymorphism"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "Encapsulation 🔒", sub: "protect the data" },
            { label: "Abstraction 🎭", sub: "expose only WHAT" },
            { label: "Inheritance 🧬", sub: "share the code" },
            { label: "Polymorphism 🦆", sub: "one call, many forms" },
          ]}
        />
        <Callout type="tip">
          Interview one-liners: Encapsulation <em>hides data</em>, Abstraction{" "}
          <em>hides complexity</em>, Inheritance <em>reuses code</em>, Polymorphism{" "}
          <em>lets one call behave many ways</em>. Learn them in that order — each builds
          on the previous.
        </Callout>
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="14" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["TypeError 'takes 0 positional…'", "forgot self in def", "def method(self, ...)"],
            ["AttributeError", "typo / attr never set", "set it in __init__"],
            ["AttributeError after inherit", "child __init__ skips parent", "super().__init__(...)"],
            ["TypeError missing args", "Student() but __init__ wants name", "pass required args"],
            ["NameError", "using Class before it's defined", "define before use"],
          ]}
        />
        <CodeBlock
          title="AttributeError — typo on attribute"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name\n\ns = Student("Deelaksha")\nprint(s.nmae)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    print(s.nmae)\nAttributeError: 'Student' object has no attribute 'nmae'. Did you mean: 'name'?`}
          error
        />
        <CodeBlock
          title="TypeError — __init__ args not supplied"
          code={`class Student:\n    def __init__(self, name):\n        self.name = name\n\ns = Student()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    s = Student()\nTypeError: Student.__init__() missing 1 required positional argument: 'name'`}
          error
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="15" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["The skeleton", "class Student:\n    def __init__(self, name):\n        self.name = name"],
            ["Method shape", "def average(self):\n    return ..."],
            ["Inheritance", "class Dog(Animal):"],
            ["Parent init", "super().__init__(name)"],
            ["Pretty print", "def __str__(self):\n    return f\"...\""],
            ["Type checks", "isinstance(d, Animal)\nissubclass(Dog, Animal)"],
            ["self =", "the current object (auto-passed)"],
            ["4 pillars", "Encapsulation · Inheritance ·\nPolymorphism · Abstraction"],
          ]}
        />
        <Callout type="tip">
          Interview one-liner: &quot;<IC>self</IC> is the instance the method was called on; Python
          passes it automatically, which is why <IC>d.speak()</IC> needs no arguments.&quot;
        </Callout>
      </Section>
    </TopicShell>
  );
}
