"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "The Idea" },
  { id: "builtin", label: "You Already Use It" },
  { id: "override", label: "Method Overriding ⭐" },
  { id: "one-loop", label: "One Loop, Many Behaviors ⭐" },
  { id: "duck", label: "Duck Typing 🦆" },
  { id: "operator", label: "Operator Overloading" },
  { id: "dunders", label: "More Dunders: ==, len" },
  { id: "abc-combo", label: "With Abstract Classes" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopPolymorphismPage() {
  return (
    <TopicShell
      icon="🦆"
      title="Polymorphism"
      gradientWord="Polymorphism"
      subtitle="One name, many forms. The same method call behaves differently per object — the trick that deletes every if-elif ladder in your code."
      nav={NAV}
      next={{ icon: "🧩", label: "Modules & pip", href: "/python/modules" }}
    >
      {/* 1 ─ idea */}
      <Section id="idea" number="01" title="The Idea — One Name, Many Forms">
        <P>
          <strong>Poly</strong> = many, <strong>morph</strong> = forms. The{" "}
          <em>same call</em> — <IC>obj.speak()</IC> — produces different behavior depending
          on <em>which object</em> receives it. The caller doesn&apos;t check types; the
          object itself knows what to do.
        </P>
        <FlowDiagram
          steps={[
            { label: "speak()", sub: "one name" },
            { label: "Dog → woof!", sub: "form 1" },
            { label: "Cat → meow!", sub: "form 2" },
            { label: "Cow → moo!", sub: "form 3" },
          ]}
        />
        <Callout type="analogy">
          The word <strong>&quot;drive&quot;</strong> 🚗🚲✈️ — one word, but drive a car,
          drive a bike, drive a plane: each performer interprets it their own way. Same
          instruction, different execution.
        </Callout>
      </Section>

      {/* 2 ─ builtin */}
      <Section id="builtin" number="02" title="You Already Use It Every Day">
        <CodeBlock
          code={`# + is polymorphic\nprint(2 + 3)                  # numbers → add\nprint("Dee" + "laksha")       # strings → join\nprint([1, 2] + [3])           # lists  → concatenate\n\n# len() is polymorphic\nprint(len("Deelaksha"))       # characters\nprint(len([10, 20, 30]))      # items\nprint(len({"a": 1, "b": 2}))  # keys`}
          output={`5\nDeelaksha\n[1, 2, 3]\n9\n3\n2`}
        />
        <Callout type="behind">
          One operator <IC>+</IC>, one function <IC>len()</IC> — but int, str, list and dict
          each bring their <strong>own implementation</strong>. Python&apos;s built-ins are
          polymorphism in production. Today you learn to give your own classes that power.
        </Callout>
      </Section>

      {/* 3 ─ override */}
      <Section id="override" number="03" title="Method Overriding — Child Replaces Parent ⭐">
        <CodeBlock
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} makes a sound"     # default form\n\nclass Dog(Animal):\n    def speak(self):                             # OVERRIDE — same name!\n        return f"{self.name} says woof!"\n\nclass Cat(Animal):\n    def speak(self):\n        return f"{self.name} says meow!"\n\nclass Cow(Animal):\n    pass                                          # keeps the default\n\nprint(Dog("Tommy").speak())\nprint(Cat("Kitty").speak())\nprint(Cow("Gauri").speak())`}
          output={`Tommy says woof!\nKitty says meow!\nGauri makes a sound`}
        />
        <Callout type="behind">
          Remember the lookup path: <strong>child class first, then parent</strong>.
          Dog defines its own <IC>speak</IC> → search stops there, parent&apos;s version
          never runs. Cow doesn&apos;t → search continues up and finds Animal&apos;s.
          Overriding is just &quot;winning the lookup race.&quot;
        </Callout>
        <CodeBlock
          title="override + reuse: super() inside the new form"
          code={`class Puppy(Dog):\n    def speak(self):\n        return super().speak() + " ...but tiny 🐶"\n\nprint(Puppy("Coco").speak())`}
          output={`Coco says woof! ...but tiny 🐶`}
        />
      </Section>

      {/* 4 ─ one loop */}
      <Section id="one-loop" number="04" title="The Payoff — One Loop, Many Behaviors ⭐">
        <CodeBlock
          title="❌ the type-checking ladder polymorphism deletes"
          runnable={false}
          code={`for a in animals:\n    if isinstance(a, Dog):\n        print(a.name, "says woof!")\n    elif isinstance(a, Cat):\n        print(a.name, "says meow!")\n    elif isinstance(a, Cow):\n        ...\n    # every NEW animal = edit this ladder again 😩`}
        />
        <CodeBlock
          title="✅ polymorphic loop — never edited again"
          code={`animals = [Dog("Tommy"), Cat("Kitty"), Cow("Gauri"), Dog("Rex")]\n\nfor a in animals:\n    print(a.speak())          # each object answers its OWN way`}
          output={`Tommy says woof!\nKitty says meow!\nGauri makes a sound\nRex says woof!`}
        />
        <FlowDiagram
          steps={[
            { label: "a.speak()", sub: "caller asks, doesn't check" },
            { label: "Python looks at type(a)", sub: "at runtime" },
            { label: "that class's speak runs", sub: "dynamic dispatch" },
          ]}
        />
        <Callout type="tip">
          Interview gold: &quot;Polymorphism moves the <IC>if-elif</IC> ladder{" "}
          <strong>into the classes</strong>. Adding a new type means adding a new class —
          zero changes to existing loops.&quot; (That&apos;s the Open/Closed Principle.)
        </Callout>
      </Section>

      {/* 5 ─ duck typing */}
      <Section id="duck" number="05" title="Duck Typing — No Family Tree Needed 🦆">
        <P>
          &quot;If it walks like a duck and quacks like a duck, it&apos;s a duck.&quot;
          Python doesn&apos;t require a shared parent class — <strong>having the method is
          enough</strong>.
        </P>
        <CodeBlock
          code={`class Duck:\n    def speak(self):\n        return "quack!"\n\nclass Robot:                       # NOT an Animal, no shared parent\n    def speak(self):\n        return "BEEP BOOP"\n\nclass Human:\n    def speak(self):\n        return "hello!"\n\nfor thing in [Duck(), Robot(), Human()]:\n    print(thing.speak())           # works — they all 'quack'`}
          output={`quack!\nBEEP BOOP\nhello!`}
        />
        <Table
          head={["", "Java-style polymorphism", "Python duck typing"]}
          rows={[
            ["Requirement", "must share a parent/interface", "just have the method"],
            ["Checked", "at compile time", "at runtime, on the call"],
            ["Motto", "\u201cis it an Animal?\u201d", "\u201ccan it speak()?\u201d"],
          ]}
        />
        <Callout type="mistake">
          The flip side: pass an object <em>without</em> the method and nothing complains
          until the call explodes mid-loop with <IC>AttributeError</IC>. When you need a
          guarantee, that&apos;s exactly what abstract base classes are for (previous topic).
        </Callout>
      </Section>

      {/* 6 ─ operator overloading */}
      <Section id="operator" number="06" title="Operator Overloading — Teach + to Your Class">
        <CodeBlock
          title="💥 before — Python has no idea how to + your objects"
          code={`class Money:\n    def __init__(self, rupees):\n        self.rupees = rupees\n\ntotal = Money(500) + Money(300)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    total = Money(500) + Money(300)\nTypeError: unsupported operand type(s) for +: 'Money' and 'Money'`}
          error
        />
        <CodeBlock
          title="✅ define __add__ — now + has a Money form"
          code={`class Money:\n    def __init__(self, rupees):\n        self.rupees = rupees\n\n    def __add__(self, other):              # m1 + m2 → m1.__add__(m2)\n        return Money(self.rupees + other.rupees)\n\n    def __str__(self):\n        return f"₹{self.rupees}"\n\ntotal = Money(500) + Money(300)\nprint(total)\nprint(Money(100) + Money(50) + Money(25))   # chains too!`}
          output={`₹800\n₹175`}
        />
        <FlowDiagram
          steps={[
            { label: "m1 + m2", sub: "what you write" },
            { label: "m1.__add__(m2)", sub: "what Python calls" },
            { label: "Money(800)", sub: "your method's return" },
          ]}
        />
        <Callout type="behind">
          Every operator is secretly a dunder method: <IC>+</IC> →{" "}
          <IC>__add__</IC>, <IC>-</IC> → <IC>__sub__</IC>, <IC>*</IC> →{" "}
          <IC>__mul__</IC>, <IC>&lt;</IC> → <IC>__lt__</IC>. That&apos;s exactly how{" "}
          <IC>&quot;a&quot; + &quot;b&quot;</IC> works — <IC>str</IC> defines its own{" "}
          <IC>__add__</IC>.
        </Callout>
      </Section>

      {/* 7 ─ more dunders */}
      <Section id="dunders" number="07" title="More Dunders — ==, len() and Friends">
        <CodeBlock
          title="💥 default == compares ADDRESSES, not values"
          code={`class Point:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\nprint(Point(2, 3) == Point(2, 3))      # same values...`}
          output={`False`}
        />
        <CodeBlock
          title="✅ __eq__ and __len__ give your class real behavior"
          code={`class Playlist:\n    def __init__(self, songs):\n        self.songs = songs\n\n    def __len__(self):                     # len(p)\n        return len(self.songs)\n\n    def __eq__(self, other):               # p1 == p2\n        return self.songs == other.songs\n\n    def __contains__(self, song):          # song in p\n        return song in self.songs\n\np = Playlist(["song A", "song B", "song C"])\nprint(len(p))\nprint(p == Playlist(["song A", "song B", "song C"]))\nprint("song B" in p)`}
          output={`3\nTrue\nTrue`}
        />
        <Table
          head={["You write", "Python calls", "Default without it"]}
          rows={[
            ["a == b", "a.__eq__(b)", "compares identity (is)"],
            ["len(a)", "a.__len__()", "💥 TypeError"],
            ["x in a", "a.__contains__(x)", "💥 TypeError"],
            ["a < b", "a.__lt__(b)", "💥 TypeError"],
            ["print(a)", "a.__str__()", "<object at 0x...>"],
          ]}
        />
      </Section>

      {/* 8 ─ abc combo */}
      <Section id="abc-combo" number="08" title="Polymorphism + Abstract Classes = Safe Plugins">
        <CodeBlock
          code={`from abc import ABC, abstractmethod\n\nclass Notifier(ABC):\n    @abstractmethod\n    def send(self, msg): ...\n\nclass Email(Notifier):\n    def send(self, msg):\n        return f"📧 emailing: {msg}"\n\nclass SMS(Notifier):\n    def send(self, msg):\n        return f"📱 texting: {msg}"\n\nclass Push(Notifier):\n    def send(self, msg):\n        return f"🔔 pushing: {msg}"\n\n# this function is FROZEN FOREVER — yet supports future notifiers\ndef alert_all(notifiers, msg):\n    for n in notifiers:\n        print(n.send(msg))\n\nalert_all([Email(), SMS(), Push()], "Server down!")`}
          output={`📧 emailing: Server down!\n📱 texting: Server down!\n🔔 pushing: Server down!`}
        />
        <Callout type="tip">
          The full OOP picture: <strong>abstraction</strong> defines the contract
          (<IC>send</IC>), <strong>inheritance</strong> shares it,{" "}
          <strong>polymorphism</strong> runs the right form, and{" "}
          <strong>encapsulation</strong> hides each notifier&apos;s internals. Four pillars,
          one tiny program.
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="AttributeError — duck typing's bill comes due"
          code={`class Dog:\n    def speak(self):\n        return "woof"\n\nclass Statue:\n    pass                          # can't speak\n\nfor thing in [Dog(), Statue()]:\n    print(thing.speak())`}
          output={`woof\nTraceback (most recent call last):\n  File "main.py", line 9, in <module>\n    print(thing.speak())\nAttributeError: 'Statue' object has no attribute 'speak'`}
          error
        />
        <CodeBlock
          title="TypeError — operator without its dunder"
          code={`class Point:\n    def __init__(self, x):\n        self.x = x\n\nprint(Point(1) < Point(2))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(Point(1) < Point(2))\nTypeError: '<' not supported between instances of 'Point' and 'Point'`}
          error
        />
        <CodeBlock
          title="Silent bug — typo means you ADDED a method, not overrode one"
          code={`class Animal:\n    def speak(self):\n        return "generic sound"\n\nclass Dog(Animal):\n    def speek(self):              # ❌ typo! speak NOT overridden\n        return "woof"\n\nprint(Dog().speak())              # parent's version runs silently`}
          output={`generic sound`}
        />
        <Table
          head={["Error / Bug", "Cause", "Fix"]}
          rows={[
            ["AttributeError mid-loop", "object missing the method (duck typing)", "ABC contract, or hasattr() check"],
            ["unsupported operand for +", "no __add__ defined", "implement __add__"],
            ["'<' not supported", "no __lt__ defined", "implement __lt__ (sorting needs it)"],
            ["override never runs", "method name typo in child", "match the parent's name exactly"],
            ["== always False", "default __eq__ compares identity", "implement __eq__"],
          ]}
        />
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Definition", "one interface, many forms —\nsame call, per-type behavior"],
            ["Overriding", "child redefines parent's method\n(same name, child wins lookup)"],
            ["The payoff", "for a in animals:\n    a.speak()   # no isinstance ladder"],
            ["Duck typing", "no parent needed —\nhaving the method is enough"],
            ["Operator overloading", "def __add__(self, other):\n    return Money(self.r + other.r)"],
            ["Equality", "def __eq__(self, other):\n    return self.x == other.x"],
            ["a + b really is", "a.__add__(b)"],
            ["Extend an override", "super().speak() + extra"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
