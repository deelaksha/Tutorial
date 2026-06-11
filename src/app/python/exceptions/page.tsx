"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "anatomy", label: "Traceback Anatomy" },
  { id: "try-except", label: "try / except ⭐" },
  { id: "specific", label: "Catching Specific Errors" },
  { id: "else-finally", label: "else & finally" },
  { id: "raise", label: "raise — Throw Your Own" },
  { id: "custom", label: "Custom Exceptions" },
  { id: "common-errors", label: "Error Zoo 🦁" },
  { id: "patterns", label: "Real Patterns" },
  { id: "anti-patterns", label: "Anti-Patterns ⚠️" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function ExceptionsPage() {
  return (
    <TopicShell
      icon="💥"
      title="Exception Handling"
      gradientWord="Exceptions"
      subtitle="Crashes are messages, not mysteries. Read any traceback, catch errors precisely, raise your own — and never write a bare except again."
      nav={NAV}
      next={{ icon: "📁", label: "File Handling", href: "/python/files" }}
    >
      {/* 1 ─ anatomy */}
      <Section id="anatomy" number="01" title="Traceback Anatomy — Read It Bottom-Up">
        <CodeBlock
          code={`def get_mark(marks, i):\n    return marks[i]\n\nmarks = [90, 85]\nprint(get_mark(marks, 5))`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(get_mark(marks, 5))\n  File "main.py", line 2, in get_mark\n    return marks[i]\nIndexError: list index out of range`}
          error
        />
        <FlowDiagram
          steps={[
            { label: "LAST line first: IndexError: list index out of range", sub: "WHAT went wrong" },
            { label: "line above: File main.py, line 2, in get_mark", sub: "WHERE it exploded" },
            { label: "lines above that: the call chain", sub: "HOW the program got there (line 5 called line 2)" },
          ]}
        />
        <Callout type="tip">
          Read tracebacks <strong>bottom-up</strong>: error type → message → deepest file/line.
          90% of debugging is just reading the last two lines carefully.
        </Callout>
      </Section>

      {/* 2 ─ try/except */}
      <Section id="try-except" number="02" title="try / except — Catch the Crash ⭐">
        <FlowDiagram
          steps={[
            { label: "try: risky code runs", sub: "error? → jump to except IMMEDIATELY" },
            { label: "except: handler runs", sub: "program SURVIVES, no traceback" },
            { label: "life continues after the block", sub: "no error? except is skipped entirely" },
          ]}
        />
        <CodeBlock
          code={`raw = "abc"        # imagine: raw = input("number: ")\n\ntry:\n    n = int(raw)            # 💣 risky line\n    print("you typed", n)\nexcept ValueError:\n    print("that's not a number!")\n\nprint("program still alive ✅")`}
          output={`that's not a number!\nprogram still alive ✅`}
        />
        <CodeBlock
          code={`# when nothing fails, except is skipped\ntry:\n    n = int("42")\n    print("parsed:", n)\nexcept ValueError:\n    print("never shown")\nprint("done")`}
          output={`parsed: 42\ndone`}
        />
        <Callout type="behind">
          The moment an error fires inside <IC>try</IC>, the rest of the try block is
          abandoned — execution teleports to the matching <IC>except</IC>.
        </Callout>
      </Section>

      {/* 3 ─ specific */}
      <Section id="specific" number="03" title="Catching Specific Errors">
        <CodeBlock
          code={`data = {"marks": [90, 85]}\n\ntry:\n    marks = data["marks"]\n    print(marks[5])\nexcept KeyError:\n    print("key missing")\nexcept IndexError:\n    print("index too big")        # ← this one fires\nexcept Exception as e:            # catch-all LAST\n    print("something else:", e)`}
          output={`index too big`}
        />
        <CodeBlock
          code={`# grab the error message with 'as'\ntry:\n    int("hello")\nexcept ValueError as e:\n    print("failed:", e)\n    print("type  :", type(e).__name__)`}
          output={`failed: invalid literal for int() with base 10: 'hello'\ntype  : ValueError`}
        />
        <CodeBlock
          code={`# one handler, several types\ntry:\n    x = 10 / 0\nexcept (ZeroDivisionError, ValueError) as e:\n    print("math problem:", e)`}
          output={`math problem: division by zero`}
        />
        <Callout type="mistake">
          Order matters — Python uses the <strong>first matching</strong> except. Put specific
          errors first, <IC>Exception</IC> last (or not at all).
        </Callout>
      </Section>

      {/* 4 ─ else / finally */}
      <Section id="else-finally" number="04" title="else & finally — The Full Skeleton">
        <Table
          head={["Block", "Runs when"]}
          rows={[
            ["try", "always attempted"],
            ["except", "only on matching error"],
            ["else", "only if NO error happened"],
            ["finally", "ALWAYS — error or not, even after return"],
          ]}
        />
        <CodeBlock
          code={`def divide(a, b):\n    try:\n        result = a / b\n    except ZeroDivisionError:\n        print("  ❌ cannot divide by zero")\n    else:\n        print("  ✅ result:", result)     # success-only code\n    finally:\n        print("  🧹 cleanup runs no matter what")\n\ndivide(10, 2)\ndivide(10, 0)`}
          output={`  ✅ result: 5.0\n  🧹 cleanup runs no matter what\n  ❌ cannot divide by zero\n  🧹 cleanup runs no matter what`}
        />
        <Callout type="behind">
          <IC>finally</IC> is for cleanup that must happen either way — closing files, releasing
          locks, disconnecting. It runs even if the try block <IC>return</IC>s.
        </Callout>
      </Section>

      {/* 5 ─ raise */}
      <Section id="raise" number="05" title="raise — Throw Your Own Errors">
        <CodeBlock
          code={`def set_age(age):\n    if age < 0:\n        raise ValueError("age cannot be negative")\n    print("age set to", age)\n\nset_age(22)\nset_age(-5)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    set_age(-5)\n  File "main.py", line 3, in set_age\n    raise ValueError("age cannot be negative")\nValueError: age cannot be negative`}
          error
        />
        <CodeBlock
          code={`# caller decides how to handle it\ndef set_age(age):\n    if age < 0:\n        raise ValueError("age cannot be negative")\n    return age\n\ntry:\n    set_age(-5)\nexcept ValueError as e:\n    print("rejected:", e)\n\n# re-raise after logging\ntry:\n    set_age(-1)\nexcept ValueError:\n    print("logging the problem...")\n    # raise        ← uncomment to crash upward after logging`}
          output={`rejected: age cannot be negative\nlogging the problem...`}
        />
        <Callout type="tip">
          Fail fast: validating inputs with <IC>raise</IC> at the top of a function turns silent
          data bugs into loud, fixable crashes.
        </Callout>
      </Section>

      {/* 6 ─ custom */}
      <Section id="custom" number="06" title="Custom Exceptions">
        <CodeBlock
          code={`class InsufficientFunds(Exception):\n    """Raised when a withdrawal exceeds the balance."""\n    pass\n\ndef withdraw(balance, amount):\n    if amount > balance:\n        raise InsufficientFunds(f"need {amount}, have {balance}")\n    return balance - amount\n\ntry:\n    withdraw(100, 250)\nexcept InsufficientFunds as e:\n    print("declined:", e)`}
          output={`declined: need 250, have 100`}
        />
        <Callout type="behind">
          Inherit from <IC>Exception</IC>, usually with just <IC>pass</IC> — the class{" "}
          <strong>name itself</strong> is the documentation. Catchers can target exactly your
          error without touching others.
        </Callout>
      </Section>

      {/* 7 ─ error zoo */}
      <Section id="common-errors" number="07" title="The Error Zoo 🦁 — Know Them on Sight">
        <Table
          head={["Error", "Meaning", "Classic trigger"]}
          rows={[
            ["SyntaxError", "Python can't even parse it", "missing :, unmatched ("],
            ["IndentationError", "wrong indent", "mixed tabs/spaces"],
            ["NameError", "name never defined", "typo: pritn(x)"],
            ["TypeError", "right value, wrong type", '"a" + 1'],
            ["ValueError", "right type, bad value", 'int("abc")'],
            ["IndexError", "sequence index too big", "lst[99]"],
            ["KeyError", "dict key missing", 'd["nope"]'],
            ["AttributeError", "object lacks that method", '(1,2).append(3)'],
            ["ZeroDivisionError", "divide by zero", "x / 0"],
            ["FileNotFoundError", "path doesn't exist", 'open("ghost.txt")'],
            ["ImportError / ModuleNotFoundError", "module missing", "import nonexistent"],
            ["RecursionError", "infinite recursion", "no base case"],
          ]}
        />
        <CodeBlock
          code={`# SyntaxError vs runtime errors — syntax is checked FIRST\nprint("this never prints"\n# missing ) → nothing in the file runs at all`}
          output={`  File "main.py", line 2\n    print("this never prints"\n         ^\nSyntaxError: '(' was never closed`}
          error
        />
      </Section>

      {/* 8 ─ patterns */}
      <Section id="patterns" number="08" title="Real Patterns">
        <CodeBlock
          title="retry until valid"
          code={`inputs = ["abc", "12x", "42"]      # simulated typing\n\nfor raw in inputs:\n    try:\n        n = int(raw)\n        print("accepted:", n)\n        break\n    except ValueError:\n        print(f"'{raw}' is not a number, try again")`}
          output={`'abc' is not a number, try again\n'12x' is not a number, try again\naccepted: 42`}
        />
        <CodeBlock
          title="safe dictionary / list access"
          code={`config = {"port": "8080"}\n\ntry:\n    port = int(config["port"])\n    timeout = int(config["timeout"])\nexcept KeyError as e:\n    print("missing setting:", e)\nexcept ValueError as e:\n    print("bad number:", e)`}
          output={`missing setting: 'timeout'`}
        />
        <CodeBlock
          title="EAFP — the Python philosophy"
          code={`d = {"a": 1}\n\n# LBYL: Look Before You Leap\nif "a" in d:\n    print(d["a"])\n\n# EAFP: Easier to Ask Forgiveness than Permission (pythonic)\ntry:\n    print(d["b"])\nexcept KeyError:\n    print("no b — handled")`}
          output={`1\nno b — handled`}
        />
      </Section>

      {/* 9 ─ anti-patterns */}
      <Section id="anti-patterns" number="09" title="Anti-Patterns — Don't Do These ⚠️">
        <CodeBlock
          code={`# ❌ 1. bare except — swallows EVERYTHING\ntry:\n    total = pricee * qty      # typo! NameError\nexcept:\n    print("oh well")          # bug silently hidden\n\n# even Ctrl+C gets eaten by a bare except!`}
          output={`oh well`}
        />
        <CodeBlock
          code={`# ❌ 2. except + pass — the silent killer\ntry:\n    risky = 10 / 0\nexcept Exception:\n    pass                       # error vanishes, debugging nightmare\nprint("nothing happened?!")`}
          output={`nothing happened?!`}
        />
        <Table
          head={["❌ Anti-pattern", "✅ Instead"]}
          rows={[
            ["except: (bare)", "except SpecificError:"],
            ["except Exception: pass", "log it, handle it, or let it crash"],
            ["try around 100 lines", "try around ONLY the risky line"],
            ["using exceptions for normal flow", "if-checks for expected cases"],
          ]}
        />
        <Callout type="mistake">
          A hidden error is worse than a crash — the crash tells you where the bug is, the{" "}
          <IC>except: pass</IC> ships it to production.
        </Callout>
      </Section>

      {/* 10 ─ memorize */}
      <Section id="memorize" number="10" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Basic shape", "try:\n    risky()\nexcept ValueError as e:\n    print(e)"],
            ["Full skeleton", "try / except / else / finally"],
            ["Multiple types", "except (TypeError, ValueError):"],
            ["Raise your own", 'raise ValueError("bad input")'],
            ["Custom exception", "class MyError(Exception):\n    pass"],
            ["finally = always", "even after return / crash"],
            ["Read traceback", "bottom-up: type → msg → line"],
            ["Never", "except: pass"],
          ]}
        />
        <Callout type="tip">
          Interview one-liner: &quot;else runs on success, finally runs always — and I catch the
          narrowest exception possible, never bare except.&quot;
        </Callout>
      </Section>
    </TopicShell>
  );
}
