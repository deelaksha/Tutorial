"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "The Idea" },
  { id: "problem", label: "The Problem It Solves" },
  { id: "abc", label: "ABC & @abstractmethod ⭐" },
  { id: "cannot", label: "Can't Instantiate 💥" },
  { id: "children", label: "Children Must Implement" },
  { id: "mixed", label: "Abstract + Concrete Mix" },
  { id: "real", label: "Real Example: Payments" },
  { id: "vs", label: "Abstraction vs Encapsulation" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopAbstractionPage() {
  return (
    <TopicShell
      icon="🎭"
      title="Abstraction"
      gradientWord="Abstraction"
      subtitle="Show WHAT an object can do, hide HOW it does it. Abstract base classes turn 'every child must have this method' from a hope into a law."
      nav={NAV}
      next={{ icon: "🧬", label: "Inheritance", href: "/python/oop-inheritance" }}
    >
      {/* 1 ─ idea */}
      <Section id="idea" number="01" title="The Idea — WHAT, not HOW">
        <P>
          <strong>Abstraction</strong> = expose a simple interface, hide the messy
          machinery. You drive a car with 3 pedals and a wheel — you don&apos;t manage fuel
          injection timing. The pedals are the <em>abstraction</em>.
        </P>
        <FlowDiagram
          steps={[
            { label: "you press brake 🦶", sub: "the simple interface" },
            { label: "??? hidden machinery", sub: "hydraulics, ABS, sensors" },
            { label: "car stops", sub: "all you care about" },
          ]}
        />
        <CodeBlock
          code={`# you use abstraction every day already:\nnums = [5, 2, 9]\nnums.sort()              # WHAT: sort. HOW: Timsort internals? hidden.\nprint(nums)\n\nlen("Deelaksha")         # WHAT: count. HOW: C-level counter? hidden.\nprint(len("Deelaksha"))`}
          output={`[2, 5, 9]\n9`}
        />
        <Callout type="analogy">
          A <strong>TV remote</strong> 📺: 20 buttons hiding a million transistors. Good
          abstraction means users press <IC>volume_up()</IC> and never learn what a
          transistor is.
        </Callout>
      </Section>

      {/* 2 ─ problem */}
      <Section id="problem" number="02" title="The Problem Abstract Classes Solve">
        <CodeBlock
          title="without enforcement — a hope, not a rule"
          code={`class Shape:\n    pass                          # "every shape should have area()..."\n\nclass Circle(Shape):\n    def area(self):\n        return 3.14159 * 5 ** 2\n\nclass Triangle(Shape):\n    pass                          # 😴 developer forgot area()\n\nshapes = [Circle(), Triangle()]\nfor s in shapes:\n    print(s.area())               # 💥 crashes at RUNTIME, mid-loop`}
          output={`78.53975\nTraceback (most recent call last):\n  File "main.py", line 13, in <module>\n    print(s.area())\nAttributeError: 'Triangle' object has no attribute 'area'`}
          error
        />
        <P>
          The comment &quot;every shape should have area()&quot; is invisible to Python.
          The bug hides until production. An <strong>abstract base class</strong> makes the
          rule <em>executable</em>: forget <IC>area()</IC> → can&apos;t even create the
          object.
        </P>
        <Callout type="tip">
          Rule of thumb: when you catch yourself writing &quot;every subclass{" "}
          <strong>must</strong> have method X&quot; in a comment — that&apos;s the signal to
          reach for <IC>ABC</IC>.
        </Callout>
      </Section>

      {/* 3 ─ abc */}
      <Section id="abc" number="03" title="ABC & @abstractmethod — The Contract ⭐">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass Shape(ABC):                    # 1. inherit from ABC\n    @abstractmethod                  # 2. mark required methods\n    def area(self):\n        pass                         # no body — children provide it\n\n    @abstractmethod\n    def perimeter(self):\n        pass\n\nclass Circle(Shape):                 # 3. child signs the contract\n    def __init__(self, r):\n        self.r = r\n    def area(self):\n        return 3.14159 * self.r ** 2\n    def perimeter(self):\n        return 2 * 3.14159 * self.r\n\nc = Circle(5)\nprint(c.area())\nprint(c.perimeter())`}
          output={`78.53975\n31.4159`}
        />
        <FlowDiagram
          steps={[
            { label: "class Shape(ABC)", sub: "the contract" },
            { label: "@abstractmethod area()", sub: "clause: must implement" },
            { label: "class Circle(Shape)", sub: "signs the contract" },
            { label: "Circle() ✅", sub: "all clauses met → allowed" },
          ]}
        />
        <Callout type="behind">
          Two ingredients, both required: inherit <IC>ABC</IC>{" "}
          <em>and</em> decorate with <IC>@abstractmethod</IC>. ABC alone does nothing;
          the decorator alone (without ABC) is silently ignored.
        </Callout>
      </Section>

      {/* 4 ─ cannot instantiate */}
      <Section id="cannot" number="04" title="Abstract Classes Can't Be Instantiated 💥">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self):\n        pass\n\ns = Shape()        # ❌ a contract is not a thing you can hold`}
          output={`Traceback (most recent call last):\n  File "main.py", line 8, in <module>\n    s = Shape()\nTypeError: Can't instantiate abstract class Shape without an implementation for abstract method 'area'`}
          error
        />
        <Callout type="analogy">
          You can&apos;t drive &quot;<strong>Vehicle</strong>&quot; out of a showroom — only
          a Car or a Bike. <em>Vehicle</em> is an idea; abstract classes are ideas that
          refuse to become objects.
        </Callout>
        <Callout type="behind">
          This is a feature, not a limitation: the crash happens <strong>at creation
          time</strong>, at the exact line of the mistake — not later inside some loop in
          production.
        </Callout>
      </Section>

      {/* 5 ─ children must implement */}
      <Section id="children" number="05" title="Children Must Implement EVERY Abstract Method">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self): pass\n    @abstractmethod\n    def perimeter(self): pass\n\nclass Triangle(Shape):\n    def area(self):                  # implemented area...\n        return 0.5 * 10 * 6\n    # ...but FORGOT perimeter\n\nt = Triangle()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 14, in <module>\n    t = Triangle()\nTypeError: Can't instantiate abstract class Triangle without an implementation for abstract method 'perimeter'`}
          error
        />
        <P>
          Implement only some clauses → the child is <strong>still abstract</strong>. The
          error message names exactly which method is missing — Python does the code review
          for you.
        </P>
        <CodeBlock
          title="fix: implement everything"
          code={`class Triangle(Shape):\n    def area(self):\n        return 0.5 * 10 * 6\n    def perimeter(self):\n        return 10 + 6 + 11.66\n\nt = Triangle()                       # ✅ contract fulfilled\nprint(t.area(), t.perimeter())`}
          output={`30.0 27.66`}
        />
      </Section>

      {/* 6 ─ mixed */}
      <Section id="mixed" number="06" title="Abstract + Concrete — Classes Can Mix Both">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self):                   # abstract — children differ\n        pass\n\n    def describe(self):               # concrete — shared by ALL\n        print(f"I am a {type(self).__name__}, area = {self.area()}")\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n    def area(self):\n        return self.side ** 2\n\nclass Circle(Shape):\n    def __init__(self, r):\n        self.r = r\n    def area(self):\n        return 3.14159 * self.r ** 2\n\nSquare(4).describe()\nCircle(5).describe()`}
          output={`I am a Square, area = 16\nI am a Circle, area = 78.53975`}
        />
        <Callout type="tip">
          This is the power pattern: the parent writes the <strong>shared logic
          once</strong> (<IC>describe</IC>) and calls <IC>self.area()</IC> — trusting that
          every living child has it, because the contract guarantees it. (Framework authors
          call this the <em>template method</em> pattern.)
        </Callout>
      </Section>

      {/* 7 ─ real */}
      <Section id="real" number="07" title="Real Example — Payment Methods">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass PaymentMethod(ABC):\n    @abstractmethod\n    def pay(self, amount):\n        pass\n\nclass UPI(PaymentMethod):\n    def pay(self, amount):\n        return f"Paid ₹{amount} via UPI ✅"\n\nclass Card(PaymentMethod):\n    def pay(self, amount):\n        return f"Paid ₹{amount} via Card 💳"\n\nclass Wallet(PaymentMethod):\n    def pay(self, amount):\n        return f"Paid ₹{amount} from Wallet 👛"\n\n# checkout code knows ONLY the abstraction:\ndef checkout(method: PaymentMethod, amount):\n    print(method.pay(amount))         # WHAT, never HOW\n\nfor m in [UPI(), Card(), Wallet()]:\n    checkout(m, 499)`}
          output={`Paid ₹499 via UPI ✅\nPaid ₹499 via Card 💳\nPaid ₹499 from Wallet 👛`}
        />
        <Callout type="behind">
          <IC>checkout()</IC> never changes when you add{" "}
          <IC>class Crypto(PaymentMethod)</IC> tomorrow. Code that depends on the{" "}
          <strong>abstraction</strong> instead of concrete classes is open for extension,
          closed for modification — the &quot;O&quot; in SOLID.
        </Callout>
      </Section>

      {/* 8 ─ vs encapsulation */}
      <Section id="vs" number="08" title="Abstraction vs Encapsulation — Interview Favorite">
        <Table
          head={["", "Abstraction 🎭", "Encapsulation 🔒"]}
          rows={[
            ["Hides", "implementation complexity", "the data itself"],
            ["Focus", "design level — WHAT to expose", "code level — HOW to protect"],
            ["Tools", "ABC, @abstractmethod", "_x, __x, @property"],
            ["Question it answers", "\u201cwhich methods exist?\u201d", "\u201cwho may touch this data?\u201d"],
            ["Car analogy", "pedals & wheel (interface)", "sealed engine bay (protection)"],
          ]}
        />
        <Callout type="tip">
          One-line answer: <strong>&quot;Abstraction hides complexity behind an interface;
          encapsulation hides data behind methods. Abstraction is about design,
          encapsulation is about protection.&quot;</strong>
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="TypeError — instantiating the abstract class"
          code={`from abc import ABC, abstractmethod\n\nclass Animal(ABC):\n    @abstractmethod\n    def sound(self): pass\n\na = Animal()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    a = Animal()\nTypeError: Can't instantiate abstract class Animal without an implementation for abstract method 'sound'`}
          error
        />
        <CodeBlock
          title="Silent bug — forgot to inherit ABC"
          code={`from abc import abstractmethod\n\nclass Animal:                      # ❌ plain class, no ABC\n    @abstractmethod\n    def sound(self): pass\n\na = Animal()                       # no protection — creates fine!\na.sound()                          # contract was never enforced\nprint("nothing stopped us 😬")`}
          output={`nothing stopped us 😬`}
        />
        <CodeBlock
          title="Silent bug — typo creates a NEW method instead of implementing"
          code={`from abc import ABC, abstractmethod\n\nclass Animal(ABC):\n    @abstractmethod\n    def sound(self): pass\n\nclass Dog(Animal):\n    def sounds(self):              # ❌ typo: sounds ≠ sound\n        return "woof"\n\nd = Dog()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 11, in <module>\n    d = Dog()\nTypeError: Can't instantiate abstract class Dog without an implementation for abstract method 'sound'`}
          error
        />
        <Table
          head={["Error / Bug", "Cause", "Fix"]}
          rows={[
            ["Can't instantiate abstract class X", "X has unimplemented abstract methods", "implement ALL of them in the child"],
            ["abstract class created fine", "forgot to inherit from ABC", "class X(ABC):"],
            ["decorator ignored", "@abstractmethod without ABC parent", "both ingredients required"],
            ["child still abstract", "method name typo (sounds vs sound)", "match the contract name exactly"],
          ]}
        />
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["The imports", "from abc import ABC, abstractmethod"],
            ["The skeleton", "class Shape(ABC):\n    @abstractmethod\n    def area(self): pass"],
            ["Abstract class =", "contract — cannot be instantiated"],
            ["Child rule", "implement EVERY abstract method\nor stay abstract"],
            ["Definition", "show WHAT, hide HOW"],
            ["vs Encapsulation", "abstraction hides complexity,\nencapsulation hides data"],
            ["When to use", "\u201cevery subclass MUST have X\u201d"],
            ["Mixing allowed", "abstract + concrete methods\nin the same ABC"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
