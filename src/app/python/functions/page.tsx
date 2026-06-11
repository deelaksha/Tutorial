"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "define", label: "Defining & Calling" },
  { id: "params", label: "Parameters & Arguments" },
  { id: "return", label: "return ⭐" },
  { id: "defaults", label: "Default Values" },
  { id: "keyword-args", label: "Keyword Arguments" },
  { id: "args-kwargs", label: "*args & **kwargs ⭐" },
  { id: "scope", label: "Scope — Local vs Global" },
  { id: "mutable-default", label: "Mutable Default Trap ⚠️" },
  { id: "lambda", label: "Lambda Functions" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function FunctionsPage() {
  return (
    <TopicShell
      icon="📦"
      title="Functions"
      gradientWord="Python Functions"
      subtitle="Write once, call anywhere. Parameters, return, *args/**kwargs, scope and the mutable-default trap — the topics every interview drills."
      nav={NAV}
      next={{ icon: "💥", label: "Exception Handling", href: "/python/exceptions" }}
    >
      {/* 1 ─ define */}
      <Section id="define" number="01" title="Defining & Calling">
        <FlowDiagram
          steps={[
            { label: "def greet(): — definition", sub: "Python just MEMORIZES the recipe, runs nothing" },
            { label: "greet() — the call", sub: "NOW the body runs, top to bottom" },
            { label: "body ends → jump back", sub: "execution continues after the call site" },
          ]}
        />
        <CodeBlock
          code={`def greet():\n    print("Hello, Deelaksha!")\n    print("Welcome back.")\n\nprint("before the call")\ngreet()\ngreet()        # reuse — that's the point\nprint("after")`}
          output={`before the call\nHello, Deelaksha!\nWelcome back.\nHello, Deelaksha!\nWelcome back.\nafter`}
        />
        <Callout type="mistake">
          <IC>greet</IC> without <IC>( )</IC> doesn&apos;t run anything — it&apos;s just the function
          object. <IC>print(greet)</IC> → <IC>&lt;function greet at 0x...&gt;</IC>.
        </Callout>
      </Section>

      {/* 2 ─ params */}
      <Section id="params" number="02" title="Parameters & Arguments">
        <CodeBlock
          code={`def greet(name, age):        # parameters (placeholders)\n    print(f"{name} is {age} years old")\n\ngreet("Deelaksha", 22)       # arguments (real values)\ngreet("John", 25)`}
          output={`Deelaksha is 22 years old\nJohn is 25 years old`}
        />
        <CodeBlock
          code={`# 💥 missing argument\ndef greet(name, age):\n    print(name, age)\n\ngreet("Deelaksha")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n    greet("Deelaksha")\nTypeError: greet() missing 1 required positional argument: 'age'`}
          error
        />
        <CodeBlock
          code={`# 💥 too many arguments\ndef greet(name):\n    print(name)\n\ngreet("Deelaksha", 22)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 4, in <module>\n    greet("Deelaksha", 22)\nTypeError: greet() takes 1 positional argument but 2 were given`}
          error
        />
      </Section>

      {/* 3 ─ return */}
      <Section id="return" number="03" title="return — Send a Value Back ⭐">
        <CodeBlock
          code={`def add(a, b):\n    return a + b        # hands the result to the caller\n\nresult = add(10, 5)     # result catches it\nprint(result)\nprint(add(2, 3) * 10)   # use it in expressions\n\ndef no_return():\n    print("I print but return nothing")\n\nx = no_return()\nprint(x)                # None!`}
          output={`15\n50\nI print but return nothing\nNone`}
        />
        <Table
          head={["print()", "return"]}
          rows={[
            ["shows on screen", "hands value to the caller"],
            ["value is gone after", "value can be stored / reused"],
            ["for humans", "for the program"],
            ["function still returns None", "ends the function instantly"],
          ]}
        />
        <CodeBlock
          code={`# return ends the function IMMEDIATELY\ndef check(n):\n    if n < 0:\n        return "negative"      # early exit\n    return "positive"\n    print("never reached")     # dead code\n\nprint(check(-5))\nprint(check(9))\n\n# multiple values → tuple\ndef stats(nums):\n    return min(nums), max(nums), sum(nums)\n\nlo, hi, total = stats([4, 9, 1])\nprint(lo, hi, total)`}
          output={`negative\npositive\n1 9 14`}
        />
      </Section>

      {/* 4 ─ defaults */}
      <Section id="defaults" number="04" title="Default Values">
        <CodeBlock
          code={`def greet(name, lang="Python"):\n    print(f"{name} codes in {lang}")\n\ngreet("Deelaksha")            # default used\ngreet("John", "Java")         # default overridden`}
          output={`Deelaksha codes in Python\nJohn codes in Java`}
        />
        <CodeBlock
          code={`# 💥 defaults must come LAST\ndef f(lang="Python", name):\n    pass`}
          output={`  File "main.py", line 2\n    def f(lang="Python", name):\n                         ^^^^\nSyntaxError: parameter without a default follows parameter with a default`}
          error
        />
      </Section>

      {/* 5 ─ keyword args */}
      <Section id="keyword-args" number="05" title="Keyword Arguments — Name Them">
        <CodeBlock
          code={`def book(name, city, seats):\n    print(f"{name}: {seats} seats in {city}")\n\nbook("Deelaksha", "Bangalore", 2)                # by position\nbook(seats=2, name="Deelaksha", city="Bangalore") # by name — any order!\nbook("Deelaksha", seats=2, city="Bangalore")      # mixed`}
          output={`Deelaksha: 2 seats in Bangalore\nDeelaksha: 2 seats in Bangalore\nDeelaksha: 2 seats in Bangalore`}
        />
        <CodeBlock
          code={`# 💥 positional AFTER keyword is illegal\nbook(name="Deelaksha", "Bangalore", 2)`}
          output={`  File "main.py", line 2\n    book(name="Deelaksha", "Bangalore", 2)\n                                         ^\nSyntaxError: positional argument follows keyword argument`}
          error
        />
      </Section>

      {/* 6 ─ args kwargs */}
      <Section id="args-kwargs" number="06" title="*args & **kwargs — Accept Anything ⭐">
        <CodeBlock
          code={`def total(*args):              # extra positionals → TUPLE\n    print(args)\n    return sum(args)\n\nprint(total(1, 2))\nprint(total(1, 2, 3, 4, 5))`}
          output={`(1, 2)\n3\n(1, 2, 3, 4, 5)\n15`}
        />
        <CodeBlock
          code={`def profile(**kwargs):         # extra keywords → DICT\n    for key, value in kwargs.items():\n        print(f"{key}: {value}")\n\nprofile(name="Deelaksha", age=22, city="Bangalore")`}
          output={`name: Deelaksha\nage: 22\ncity: Bangalore`}
        />
        <CodeBlock
          code={`# the universal signature\ndef anything(*args, **kwargs):\n    print("args  :", args)\n    print("kwargs:", kwargs)\n\nanything(1, 2, name="Dee", lang="py")\n\n# unpacking on the CALL side too\nnums = [1, 2, 3]\nprint(sum(nums), max(*nums))   # *nums spreads the list`}
          output={`args  : (1, 2)\nkwargs: {'name': 'Dee', 'lang': 'py'}\n6 3`}
        />
        <Callout type="behind">
          The names <IC>args</IC>/<IC>kwargs</IC> are convention — the magic is in{" "}
          <IC>*</IC> (pack positionals into a tuple) and <IC>**</IC> (pack keywords into a
          dict). Order in a signature: <IC>def f(normal, *args, **kwargs)</IC>.
        </Callout>
      </Section>

      {/* 7 ─ scope */}
      <Section id="scope" number="07" title="Scope — Local vs Global">
        <CodeBlock
          code={`x = 10                 # global\n\ndef show():\n    y = 5              # local — born and dies inside\n    print("inside :", x, y)   # can READ global x\n\nshow()\nprint("outside:", x)`}
          output={`inside : 10 5\noutside: 10`}
        />
        <CodeBlock
          code={`# 💥 locals don't exist outside\ndef make():\n    secret = 42\n\nmake()\nprint(secret)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(secret)\nNameError: name 'secret' is not defined`}
          error
        />
        <CodeBlock
          code={`# 💥 assigning makes it local → UnboundLocalError\ncount = 0\ndef bump():\n    count += 1     # assignment ⇒ count is LOCAL here\nbump()`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    bump()\n  File "main.py", line 4, in bump\n    count += 1\nUnboundLocalError: cannot access local variable 'count' where it is not associated with a value`}
          error
        />
        <CodeBlock
          code={`# fixes\ncount = 0\ndef bump_global():\n    global count          # opt in to modifying the global\n    count += 1\n\nbump_global()\nprint(count)\n\n# ✅ better style: pass & return\ndef bump_pure(c):\n    return c + 1\n\ncount = bump_pure(count)\nprint(count)`}
          output={`1\n2`}
        />
        <Callout type="tip">
          Interview rule: <strong>reading</strong> a global is free;{" "}
          <strong>assigning</strong> needs <IC>global</IC>. Best practice: avoid globals — pass
          in, return out.
        </Callout>
      </Section>

      {/* 8 ─ mutable default */}
      <Section id="mutable-default" number="08" title="The Mutable Default Trap ⚠️">
        <CodeBlock
          code={`def add_item(item, basket=[]):     # ❌ ONE list shared by ALL calls\n    basket.append(item)\n    return basket\n\nprint(add_item("apple"))\nprint(add_item("mango"))     # 😱 apple is still there!\nprint(add_item("kiwi"))`}
          output={`['apple']\n['apple', 'mango']\n['apple', 'mango', 'kiwi']`}
        />
        <Callout type="behind">
          Defaults are evaluated <strong>once, at def time</strong> — not per call. The same
          list object lives inside the function and grows forever. Top-5 Python interview
          question.
        </Callout>
        <CodeBlock
          code={`def add_item(item, basket=None):   # ✅ the standard fix\n    if basket is None:\n        basket = []                # fresh list EVERY call\n    basket.append(item)\n    return basket\n\nprint(add_item("apple"))\nprint(add_item("mango"))`}
          output={`['apple']\n['mango']`}
        />
      </Section>

      {/* 9 ─ lambda */}
      <Section id="lambda" number="09" title="Lambda — One-Line Anonymous Functions">
        <CodeBlock
          code={`square = lambda x: x ** 2\nprint(square(5))\n\nadd = lambda a, b: a + b\nprint(add(3, 4))`}
          output={`25\n7`}
        />
        <CodeBlock
          code={`# the REAL use: as a sort/filter key\nstudents = [("Dee", 92), ("John", 85), ("Maya", 97)]\n\nstudents.sort(key=lambda s: s[1], reverse=True)\nprint(students)\n\nnums = [1, 2, 3, 4, 5, 6]\nevens   = list(filter(lambda n: n % 2 == 0, nums))\ndoubled = list(map(lambda n: n * 2, nums))\nprint(evens)\nprint(doubled)`}
          output={`[('Maya', 97), ('Dee', 92), ('John', 85)]\n[2, 4, 6]\n[2, 4, 6, 8, 10, 12]`}
        />
        <Callout type="note">
          Lambda = single expression, no statements, auto-returned. If it needs two lines, use{" "}
          <IC>def</IC>.
        </Callout>
      </Section>

      {/* 10 ─ exceptions */}
      <Section id="exceptions" number="10" title="Exception Cases — Recap 💥">
        <Table
          head={["Error", "Trigger", "Fix"]}
          rows={[
            ["TypeError missing arg", "f() with required params", "pass all args or add defaults"],
            ["TypeError too many", "extra positional args", "match the signature / *args"],
            ["NameError", "using a local outside", "return it instead"],
            ["UnboundLocalError", "assigning to a global inside", "global kw, or pass & return"],
            ["SyntaxError", "default before non-default", "defaults go last"],
            ["RecursionError", "function calls itself forever", "add a base case"],
          ]}
        />
        <CodeBlock
          title="RecursionError — no base case"
          code={`def countdown(n):\n    print(n)\n    countdown(n - 1)     # never stops!\n\ncountdown(3)`}
          output={`3\n2\n1\n0\n-1\n...\nRecursionError: maximum recursion depth exceeded`}
          error
        />
        <CodeBlock
          title="✅ recursion with a base case"
          code={`def countdown(n):\n    if n == 0:           # base case — the exit\n        print("done!")\n        return\n    print(n)\n    countdown(n - 1)\n\ncountdown(3)`}
          output={`3\n2\n1\ndone!`}
        />
      </Section>

      {/* 11 ─ memorize */}
      <Section id="memorize" number="11" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Skeleton", "def name(params):\n    return value"],
            ["Multiple returns", "return lo, hi   # tuple\nlo, hi = f()"],
            ["Variable args", "def f(*args, **kwargs):"],
            ["Mutable default fix", "def f(x, lst=None):\n    if lst is None:\n        lst = []"],
            ["Sort with lambda", "data.sort(key=lambda x: x[1])"],
            ["No return → None", "x = f_without_return()  # None"],
            ["Modify global", "global count   # or better: return"],
            ["Recursion shape", "if base_case: return\nrecurse(smaller)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
