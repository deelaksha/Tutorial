"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why Hide Data?" },
  { id: "levels", label: "3 Privacy Levels ⭐" },
  { id: "protected", label: "_protected" },
  { id: "private", label: "__private & Mangling" },
  { id: "getset", label: "Getters & Setters" },
  { id: "property", label: "@property ⭐" },
  { id: "setter", label: "@x.setter Validation" },
  { id: "bank", label: "Full Example: Bank" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function OopEncapsulationPage() {
  return (
    <TopicShell
      icon="🔒"
      title="Encapsulation"
      gradientWord="Encapsulation"
      subtitle="Bundle data with the methods that guard it. Public, _protected, __private, and @property — every privacy level drawn and crashed on purpose."
      nav={NAV}
      next={{ icon: "🎭", label: "Abstraction", href: "/python/oop-abstraction" }}
    >
      {/* 1 ─ why */}
      <Section id="why" number="01" title="Why Hide Data? The Problem">
        <CodeBlock
          title="everything public — anyone can break the rules"
          code={`class BankAccount:\n    def __init__(self, balance):\n        self.balance = balance\n\nacc = BankAccount(500)\nacc.balance = -99999          # 😱 nothing stops this\nprint(acc.balance)`}
          output={`-99999`}
        />
        <P>
          <strong>Encapsulation</strong> = keep the data and the rules that protect it{" "}
          <strong>in one capsule</strong>. Outsiders interact through methods (the
          counter), never by reaching into the vault directly.
        </P>
        <FlowDiagram
          steps={[
            { label: "outside code", sub: "wants to change balance" },
            { label: "deposit() / withdraw()", sub: "the guarded doors" },
            { label: "rules checked ✅", sub: "amount > 0? enough funds?" },
            { label: "__balance updated", sub: "data stays valid" },
          ]}
        />
        <Callout type="analogy">
          An <strong>ATM</strong> 🏧: you never touch the cash vault. You press buttons
          (methods), the machine enforces rules (PIN, balance), and only then the vault
          changes. Encapsulation is building the ATM around your data.
        </Callout>
      </Section>

      {/* 2 ─ levels */}
      <Section id="levels" number="02" title="Python's 3 Privacy Levels ⭐">
        <Table
          head={["Spelling", "Level", "Meaning", "Enforced?"]}
          rows={[
            ["self.name", "public", "anyone may read/write", "—"],
            ["self._salary", "protected (convention)", "\u201cinternal — please don't touch\u201d", "❌ honor system"],
            ["self.__pin", "private (mangled)", "hidden from outside access", "✅ name mangling"],
          ]}
        />
        <CodeBlock
          code={`class Employee:\n    def __init__(self):\n        self.name = "Deelaksha"      # public\n        self._salary = 50000          # protected by convention\n        self.__pin = 4321             # private — name-mangled\n\ne = Employee()\nprint(e.name)          # ✅ fine\nprint(e._salary)       # ⚠️ works, but you broke the convention\nprint(e.__pin)         # 💥`}
          output={`Deelaksha\n50000\nTraceback (most recent call last):\n  File "main.py", line 10, in <module>\n    print(e.__pin)\nAttributeError: 'Employee' object has no attribute '__pin'`}
          error
        />
        <Callout type="behind">
          Unlike Java/C++, Python has no <IC>private</IC> keyword. It uses{" "}
          <strong>convention</strong> (<IC>_x</IC>) and <strong>name mangling</strong>{" "}
          (<IC>__x</IC>). The philosophy: &quot;we&apos;re all consenting adults&quot; —
          signs, not locked doors.
        </Callout>
      </Section>

      {/* 3 ─ protected */}
      <Section id="protected" number="03" title="_protected — The Polite Warning">
        <CodeBlock
          code={`class Engine:\n    def __init__(self):\n        self._temperature = 90        # internal detail\n\n    def status(self):\n        return "OK" if self._temperature < 120 else "OVERHEAT"\n\ncar = Engine()\nprint(car.status())          # ✅ the intended door\n\n# Python won't stop you...\ncar._temperature = 500        # ⚠️ you CAN, but you SHOULDN'T\nprint(car.status())`}
          output={`OK\nOVERHEAT`}
        />
        <Callout type="tip">
          One underscore = a <strong>signal to other developers</strong>: &quot;this is an
          internal detail, it may change, don&apos;t depend on it.&quot; Linters and IDEs
          warn about it; <IC>from module import *</IC> even skips <IC>_names</IC>. Inside
          the class and its children, using <IC>self._x</IC> is perfectly normal.
        </Callout>
      </Section>

      {/* 4 ─ private */}
      <Section id="private" number="04" title="__private — Name Mangling Revealed">
        <CodeBlock
          code={`class Account:\n    def __init__(self):\n        self.__pin = 4321\n\n    def check(self, attempt):         # inside the class: normal access\n        return attempt == self.__pin\n\nacc = Account()\nprint(acc.check(4321))\nprint(acc.check(1111))\n\nprint(acc.__dict__)                   # 🔍 where did __pin go?`}
          output={`True\nFalse\n{'_Account__pin': 4321}`}
        />
        <P>
          The X-ray reveals the trick: Python <strong>renamed</strong>{" "}
          <IC>__pin</IC> to <IC>_Account__pin</IC>. That&apos;s{" "}
          <strong>name mangling</strong> — the attribute exists, just under a class-prefixed
          name, which is why <IC>acc.__pin</IC> can&apos;t find it.
        </P>
        <FlowDiagram
          steps={[
            { label: "self.__pin", sub: "what you write" },
            { label: "_Account__pin", sub: "what Python stores" },
            { label: "acc.__pin → AttributeError", sub: "outside lookup fails" },
            { label: "acc._Account__pin", sub: "the (rude) backdoor" },
          ]}
        />
        <CodeBlock
          title="the backdoor exists — mangling is privacy, not security"
          code={`print(acc._Account__pin)      # works... but never do this`}
          output={`4321`}
        />
        <Callout type="behind">
          Mangling&apos;s real purpose is preventing <strong>accidental clashes in
          subclasses</strong>: a child class&apos;s <IC>__pin</IC> becomes{" "}
          <IC>_Child__pin</IC> — a different name, so it can&apos;t silently overwrite the
          parent&apos;s. It is not encryption.
        </Callout>
      </Section>

      {/* 5 ─ getters/setters */}
      <Section id="getset" number="05" title="Getters & Setters — Guarded Doors">
        <CodeBlock
          code={`class Student:\n    def __init__(self, age):\n        self.__age = age\n\n    def get_age(self):                # getter — read access\n        return self.__age\n\n    def set_age(self, value):         # setter — write WITH rules\n        if value < 0 or value > 120:\n            raise ValueError(f"impossible age: {value}")\n        self.__age = value\n\ns = Student(22)\nprint(s.get_age())\n\ns.set_age(23)\nprint(s.get_age())\n\ns.set_age(-5)                         # 💥 the guard works`}
          output={`22\n23\nTraceback (most recent call last):\n  File "main.py", line 17, in <module>\n    s.set_age(-5)\n  File "main.py", line 10, in set_age\n    raise ValueError(f"impossible age: {value}")\nValueError: impossible age: -5`}
          error
        />
        <Callout type="note">
          This Java-style <IC>get_x()</IC> / <IC>set_x()</IC> works, but it&apos;s not
          Pythonic — callers must remember parentheses everywhere. Python&apos;s upgrade:{" "}
          <IC>@property</IC>, next section.
        </Callout>
      </Section>

      {/* 6 ─ property */}
      <Section id="property" number="06" title="@property — Method Disguised as Attribute ⭐">
        <CodeBlock
          code={`class Student:\n    def __init__(self, age):\n        self.__age = age\n\n    @property\n    def age(self):                    # getter, but called WITHOUT ()\n        return self.__age\n\ns = Student(22)\nprint(s.age)              # looks like an attribute — runs a method!\n\ns.age = 99                # 💥 read-only unless you add a setter`}
          output={`22\nTraceback (most recent call last):\n  File "main.py", line 11, in <module>\n    s.age = 99\nAttributeError: property 'age' of 'Student' object has no setter`}
          error
        />
        <CodeBlock
          title="computed properties — always fresh, no () needed"
          code={`class Rectangle:\n    def __init__(self, w, h):\n        self.w, self.h = w, h\n\n    @property\n    def area(self):\n        return self.w * self.h        # computed on every access\n\nr = Rectangle(4, 5)\nprint(r.area)\nr.w = 10\nprint(r.area)             # auto-updates — no stale value!`}
          output={`20\n50`}
        />
        <Callout type="tip">
          <IC>@property</IC> gives you clean syntax <strong>and</strong> control: callers
          write <IC>r.area</IC> like a plain attribute, while you keep the power to compute,
          validate, or log behind the scenes — and you can add that power{" "}
          <em>later</em> without changing any caller code.
        </Callout>
      </Section>

      {/* 7 ─ setter */}
      <Section id="setter" number="07" title="@x.setter — Validation on Assignment">
        <CodeBlock
          code={`class Student:\n    def __init__(self, age):\n        self.age = age            # ✅ even THIS goes through the setter!\n\n    @property\n    def age(self):\n        return self.__age\n\n    @age.setter\n    def age(self, value):\n        if value < 0 or value > 120:\n            raise ValueError(f"impossible age: {value}")\n        self.__age = value\n\ns = Student(22)\ns.age = 23                    # plain assignment → setter runs\nprint(s.age)\n\ns.age = 999                   # 💥 caught\n`}
          output={`23\nTraceback (most recent call last):\n  File "main.py", line 18, in <module>\n    s.age = 999\n  File "main.py", line 12, in age\n    raise ValueError(f"impossible age: {value}")\nValueError: impossible age: 999`}
          error
        />
        <FlowDiagram
          steps={[
            { label: "s.age = 23", sub: "looks like plain assignment" },
            { label: "@age.setter runs", sub: "rules checked" },
            { label: "self.__age = 23", sub: "real storage updated" },
            { label: "s.age", sub: "@property getter returns it" },
          ]}
        />
        <Callout type="behind">
          Notice <IC>__init__</IC> writes <IC>self.age = age</IC> (no underscores) — so even
          the constructor passes through the setter. <strong>One validation gate guards
          every write</strong>, including birth.
        </Callout>
      </Section>

      {/* 8 ─ bank */}
      <Section id="bank" number="08" title="Full Example — A Properly Sealed Bank Account">
        <CodeBlock
          code={`class BankAccount:\n    def __init__(self, owner, opening=0):\n        self.owner = owner                  # public — fine\n        self.__balance = opening            # private — guarded\n\n    @property\n    def balance(self):                      # read: open\n        return self.__balance\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError("deposit must be positive")\n        self.__balance += amount\n\n    def withdraw(self, amount):\n        if amount > self.__balance:\n            raise ValueError("insufficient funds")\n        self.__balance -= amount\n\nacc = BankAccount("Deelaksha", 500)\nacc.deposit(300)\nacc.withdraw(200)\nprint(acc.balance)\n\nacc.withdraw(5000)`}
          output={`600\nTraceback (most recent call last):\n  File "main.py", line 24, in <module>\n    acc.withdraw(5000)\n  File "main.py", line 16, in withdraw\n    raise ValueError("insufficient funds")\nValueError: insufficient funds`}
          error
        />
        <Table
          head={["Member", "Visibility", "Why"]}
          rows={[
            ["owner", "public", "no rules needed"],
            ["__balance", "private", "must never be set directly"],
            ["balance", "@property (read-only)", "anyone may LOOK"],
            ["deposit / withdraw", "public methods", "the only doors that WRITE"],
          ]}
        />
        <Callout type="tip">
          This is the interview definition in code: <strong>&quot;Encapsulation is bundling
          data with the methods that operate on it, and restricting direct access to keep
          the data valid.&quot;</strong>
        </Callout>
      </Section>

      {/* 9 ─ exceptions */}
      <Section id="exceptions" number="09" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="AttributeError — __private from outside"
          code={`class A:\n    def __init__(self):\n        self.__secret = 42\n\nprint(A().__secret)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(A().__secret)\nAttributeError: 'A' object has no attribute '__secret'`}
          error
        />
        <CodeBlock
          title="AttributeError — property without setter"
          code={`class A:\n    @property\n    def x(self):\n        return 1\n\na = A()\na.x = 5`}
          output={`Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    a.x = 5\nAttributeError: property 'x' of 'A' object has no setter`}
          error
        />
        <CodeBlock
          title="RecursionError — setter that calls itself"
          code={`class A:\n    @property\n    def x(self):\n        return self.x          # ❌ should be self.__x\n\nprint(A().x)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 6, in <module>\n    print(A().x)\n  File "main.py", line 4, in x\n    return self.x\n  [Previous line repeated 996 more times]\nRecursionError: maximum recursion depth exceeded`}
          error
        />
        <Table
          head={["Error", "Cause", "Fix"]}
          rows={[
            ["AttributeError: no attribute '__x'", "private accessed from outside", "use the method / property door"],
            ["property ... has no setter", "assigned to a read-only property", "add @x.setter, or don't assign"],
            ["RecursionError in property", "getter returns self.x (itself)", "store under a different name: self.__x"],
            ["mangled name surprise", "expecting obj.__x to exist", "it's stored as _Class__x"],
          ]}
        />
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Definition", "data + guarding methods\nin one capsule"],
            ["Public / protected / private", "x   _x   __x"],
            ["_x means", "convention: internal, hands off"],
            ["__x becomes", "_ClassName__x  (name mangling)"],
            ["Read-only property", "@property\ndef age(self):\n    return self.__age"],
            ["Validated write", "@age.setter\ndef age(self, v):\n    if v < 0: raise ValueError(...)"],
            ["Pythonic rule", "start public; add @property\nonly when rules appear"],
            ["Mangling is", "privacy by convention,\nNOT security"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
