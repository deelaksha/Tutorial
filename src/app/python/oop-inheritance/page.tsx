"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "The Idea" },
  { id: "basic", label: "Basic Inheritance ⭐" },
  { id: "init", label: "super().__init__ ⭐" },
  { id: "extend", label: "Adding & Extending" },
  { id: "lookup", label: "Attribute Lookup Path" },
  { id: "multilevel", label: "Multilevel Inheritance" },
  { id: "multiple", label: "Multiple Inheritance & MRO" },
  { id: "checks", label: "isinstance & issubclass" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopInheritancePage() {
  return (
    <TopicShell
      icon="🧬"
      title="Inheritance"
      gradientWord="Inheritance"
      subtitle="Write the common code once in a parent, get it free in every child. super(), the lookup path, multilevel chains and MRO — all drawn."
      nav={NAV}
      next={{ icon: "🦆", label: "Polymorphism", href: "/python/oop-polymorphism" }}
    >
      {/* 1 ─ idea */}
      <Section id="idea" number="01" title="The Idea — Don't Repeat the Common Parts">
        <CodeBlock
          title="the pain without inheritance — copy-paste classes"
          runnable={false}
          code={`class Dog:\n    def __init__(self, name): self.name = name\n    def eat(self):   print(self.name, "eats")      # duplicated\n    def sleep(self): print(self.name, "sleeps")    # duplicated\n    def bark(self):  print("woof!")\n\nclass Cat:\n    def __init__(self, name): self.name = name     # duplicated\n    def eat(self):   print(self.name, "eats")      # duplicated\n    def sleep(self): print(self.name, "sleeps")    # duplicated\n    def meow(self):  print("meow!")\n\n# 10 animals later → 10 copies of eat/sleep 😩`}
        />
        <FlowDiagram
          steps={[
            { label: "Animal (parent)", sub: "eat, sleep — written ONCE" },
            { label: "Dog(Animal)", sub: "inherits both + adds bark" },
            { label: "Cat(Animal)", sub: "inherits both + adds meow" },
          ]}
        />
        <Callout type="analogy">
          <strong>Family inheritance</strong> 👨‍👩‍👧: children automatically get the family
          surname and house — and add their own talents on top. They don&apos;t re-earn
          what the parent already built.
        </Callout>
      </Section>

      {/* 2 ─ basic */}
      <Section id="basic" number="02" title="Basic Inheritance ⭐">
        <CodeBlock
          code={`class Animal:                       # parent / base class\n    def __init__(self, name):\n        self.name = name\n    def eat(self):\n        print(self.name, "is eating")\n    def sleep(self):\n        print(self.name, "is sleeping")\n\nclass Dog(Animal):                  # child(Parent) — that's the syntax\n    def bark(self):\n        print(self.name, "says woof!")\n\nd = Dog("Tommy")\nd.eat()                             # inherited — free!\nd.sleep()                           # inherited — free!\nd.bark()                            # Dog's own`}
          output={`Tommy is eating\nTommy is sleeping\nTommy says woof!`}
        />
        <P>
          <IC>class Dog(Animal)</IC> reads as &quot;Dog <strong>is an</strong> Animal&quot;.
          Dog didn&apos;t define <IC>__init__</IC>, <IC>eat</IC> or <IC>sleep</IC> — it
          inherited all three, including the constructor.
        </P>
        <Table
          head={["Term", "Also called", "In the example"]}
          rows={[
            ["Parent class", "base / super class", "Animal"],
            ["Child class", "derived / sub class", "Dog"],
            ["Relationship", "\u201cis-a\u201d", "a Dog IS An Animal"],
            ["Composition (contrast)", "\u201chas-a\u201d", "a Dog HAS A Collar"],
          ]}
        />
        <Callout type="tip">
          Quick test before inheriting: say it out loud. &quot;Dog is an Animal&quot; ✅
          inherit. &quot;Car is an Engine&quot; ❌ — a car <em>has</em> an engine →
          composition (attribute), not inheritance.
        </Callout>
      </Section>

      {/* 3 ─ super().__init__ */}
      <Section id="init" number="03" title="Child __init__ + super().__init__ ⭐">
        <CodeBlock
          title="💥 the classic trap — child __init__ REPLACES the parent's"
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, name, breed):\n        self.breed = breed            # ❌ forgot the parent's part!\n\nd = Dog("Tommy", "Labrador")\nprint(d.breed)\nprint(d.name)                         # parent's setup never ran`}
          output={`Labrador\nTraceback (most recent call last):\n  File "main.py", line 11, in <module>\n    print(d.name)\nAttributeError: 'Dog' object has no attribute 'name'`}
          error
        />
        <CodeBlock
          title="✅ the fix — call the parent's constructor first"
          code={`class Animal:\n    def __init__(self, name):\n        print("Animal.__init__ runs")\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, name, breed):\n        super().__init__(name)        # parent sets up name\n        self.breed = breed            # then add Dog's extras\n\nd = Dog("Tommy", "Labrador")\nprint(d.name, "|", d.breed)`}
          output={`Animal.__init__ runs\nTommy | Labrador`}
        />
        <FlowDiagram
          steps={[
            { label: 'Dog("Tommy", "Labrador")', sub: "create child" },
            { label: "Dog.__init__", sub: "child constructor starts" },
            { label: "super().__init__(name)", sub: "parent fills self.name" },
            { label: "self.breed = breed", sub: "child fills the rest" },
          ]}
        />
        <Callout type="behind">
          Defining <IC>__init__</IC> in the child <strong>overrides</strong> the
          parent&apos;s — Python won&apos;t call both automatically.{" "}
          <IC>super()</IC> means &quot;my parent class&quot;; calling{" "}
          <IC>super().__init__(...)</IC> is you explicitly running the parent&apos;s setup
          on the same object. Memorize the order: <strong>super first, extras after</strong>.
        </Callout>
      </Section>

      {/* 4 ─ extend */}
      <Section id="extend" number="04" title="Adding & Extending Behavior">
        <CodeBlock
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n    def describe(self):\n        return f"{self.name} the animal"\n\nclass Dog(Animal):\n    def __init__(self, name, breed):\n        super().__init__(name)\n        self.breed = breed\n\n    def describe(self):                       # EXTEND, don't rewrite:\n        base = super().describe()             # reuse parent's work\n        return base + f" ({self.breed})"\n\nprint(Animal("Generic").describe())\nprint(Dog("Tommy", "Labrador").describe())`}
          output={`Generic the animal\nTommy the animal (Labrador)`}
        />
        <Callout type="tip">
          Three options for any inherited method: <strong>inherit</strong> it untouched,{" "}
          <strong>override</strong> it completely (just redefine), or{" "}
          <strong>extend</strong> it — call <IC>super().method()</IC> and add to the result.
          Extending keeps parent logic in ONE place.
        </Callout>
      </Section>

      {/* 5 ─ lookup */}
      <Section id="lookup" number="05" title="Attribute Lookup — The Search Path">
        <P>
          When you write <IC>d.eat()</IC>, Python searches in a fixed order and uses the{" "}
          <strong>first match</strong>:
        </P>
        <FlowDiagram
          steps={[
            { label: "1. the object d", sub: "instance attributes" },
            { label: "2. class Dog", sub: "child methods" },
            { label: "3. class Animal", sub: "parent methods" },
            { label: "4. object (built-in root)", sub: "else AttributeError 💥" },
          ]}
        />
        <CodeBlock
          code={`class Animal:\n    def sound(self):\n        return "generic sound"\n\nclass Dog(Animal):\n    pass\n\nd = Dog()\nprint(d.sound())            # not on d, not on Dog → found on Animal\n\nd.sound = lambda: "instance wins!"   # plant one on the OBJECT\nprint(d.sound())                      # instance beats every class`}
          output={`generic sound\ninstance wins!`}
        />
        <Callout type="behind">
          Every class in Python silently inherits from <IC>object</IC> — that&apos;s where
          default <IC>__str__</IC>, <IC>__eq__</IC> etc. come from. The full path is
          visible: <IC>Dog.__mro__</IC>.
        </Callout>
      </Section>

      {/* 6 ─ multilevel */}
      <Section id="multilevel" number="06" title="Multilevel — Grandparent → Parent → Child">
        <CodeBlock
          code={`class Animal:\n    def breathe(self):\n        print("breathing")\n\nclass Dog(Animal):\n    def bark(self):\n        print("woof")\n\nclass Puppy(Dog):                    # inherits from Dog, which inherits Animal\n    def whine(self):\n        print("wheee")\n\np = Puppy()\np.breathe()        # from grandparent\np.bark()           # from parent\np.whine()          # own\n\nprint([c.__name__ for c in Puppy.__mro__])`}
          output={`breathing\nwoof\nwheee\n['Puppy', 'Dog', 'Animal', 'object']`}
        />
        <Callout type="mistake">
          Deep chains (4+ levels) become unreadable — &quot;where is this method
          defined?!&quot;. Real-world guideline: prefer <strong>shallow hierarchies</strong>;
          if a chain grows deep, consider composition instead.
        </Callout>
      </Section>

      {/* 7 ─ multiple */}
      <Section id="multiple" number="07" title="Multiple Inheritance & MRO">
        <CodeBlock
          code={`class Camera:\n    def click(self):\n        return "photo taken 📸"\n    def power(self):\n        return "Camera power"\n\nclass Phone:\n    def call(self):\n        return "calling... 📞"\n    def power(self):\n        return "Phone power"\n\nclass SmartPhone(Camera, Phone):     # TWO parents\n    pass\n\ns = SmartPhone()\nprint(s.click())\nprint(s.call())\nprint(s.power())                     # both parents have it — who wins?\nprint([c.__name__ for c in SmartPhone.__mro__])`}
          output={`photo taken 📸\ncalling... 📞\nCamera power\n['SmartPhone', 'Camera', 'Phone', 'object']`}
        />
        <P>
          The <strong>MRO</strong> (Method Resolution Order) settles conflicts:
          left-to-right as listed in the parentheses. <IC>Camera</IC> comes first, so its{" "}
          <IC>power()</IC> wins.
        </P>
        <Callout type="tip">
          Interview answer: &quot;Python resolves multiple inheritance with the{" "}
          <strong>C3 linearization (MRO)</strong> — check it with{" "}
          <IC>ClassName.__mro__</IC> or <IC>ClassName.mro()</IC>. First class in the list
          that has the method wins.&quot;
        </Callout>
      </Section>

      {/* 8 ─ checks */}
      <Section id="checks" number="08" title="isinstance & issubclass">
        <CodeBlock
          code={`class Animal: pass\nclass Dog(Animal): pass\n\nd = Dog()\n\nprint(isinstance(d, Dog))        # exact class → True\nprint(isinstance(d, Animal))     # parent counts too! → True\nprint(isinstance(d, str))\n\nprint(issubclass(Dog, Animal))   # class-to-class question\nprint(issubclass(Animal, Dog))   # not the other way\n\nprint(type(d) is Dog)            # type() is EXACT — no parents\nprint(type(d) is Animal)`}
          output={`True\nTrue\nFalse\nTrue\nFalse\nTrue\nFalse`}
        />
        <Table
          head={["Check", "Question", "Counts parents?"]}
          rows={[
            ["isinstance(obj, C)", "is obj a C?", "✅ yes — the usual choice"],
            ["issubclass(A, B)", "is class A a kind of B?", "✅ yes"],
            ["type(obj) is C", "is obj EXACTLY a C?", "❌ no"],
          ]}
        />
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="AttributeError — child __init__ skipped super()"
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    def __init__(self, breed):\n        self.breed = breed         # no super().__init__\n\nprint(Dog("Lab").name)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 9, in <module>\n    print(Dog("Lab").name)\nAttributeError: 'Dog' object has no attribute 'name'`}
          error
        />
        <CodeBlock
          title="TypeError — parent constructor still wants its arguments"
          code={`class Animal:\n    def __init__(self, name):\n        self.name = name\n\nclass Dog(Animal):\n    pass                           # inherits Animal.__init__\n\nd = Dog()                          # ❌ name is required!`}
          output={`Traceback (most recent call last):\n  File "main.py", line 8, in <module>\n    d = Dog()\nTypeError: Animal.__init__() missing 1 required positional argument: 'name'`}
          error
        />
        <CodeBlock
          title="TypeError — impossible MRO"
          code={`class A: pass\nclass B(A): pass\n\nclass C(A, B):       # A before its own child B — contradiction\n    pass`}
          output={`Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n    class C(A, B):\nTypeError: Cannot create a consistent method resolution order (MRO) for bases A, B`}
          error
        />
        <Table
          head={["Error", "Cause", "Fix"]}
          rows={[
            ["AttributeError on parent attr", "child __init__ without super()", "super().__init__(...) first line"],
            ["missing N required arguments", "inherited __init__ needs args", "pass them: Dog('Tommy')"],
            ["Cannot create consistent MRO", "parent listed before its child", "order bases child-first: C(B, A)"],
            ["RecursionError", "self.method() instead of super().method() in override", "use super() to reach the parent version"],
          ]}
        />
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Syntax", "class Dog(Animal):"],
            ["Child constructor", "def __init__(self, name, breed):\n    super().__init__(name)\n    self.breed = breed"],
            ["Extend a method", "base = super().describe()\nreturn base + extra"],
            ["Lookup order", "instance → child → parent → object"],
            ["See the path", "Dog.__mro__"],
            ["Multiple parents", "class C(A, B):  # A wins ties"],
            ["Type checks", "isinstance(d, Animal)  # parents count\ntype(d) is Dog         # exact only"],
            ["is-a vs has-a", "is-a → inherit\nhas-a → attribute (composition)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
