"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What Is a Module?" },
  { id: "import", label: "3 Import Styles ⭐" },
  { id: "own", label: "Your Own Module" },
  { id: "main", label: '__name__ == "__main__" ⭐' },
  { id: "stdlib", label: "Standard Library Tour" },
  { id: "pip", label: "pip & requirements.txt" },
  { id: "venv", label: "Virtual Environments" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function ModulesPage() {
  return (
    <TopicShell
      icon="🧩"
      title="Modules & pip"
      gradientWord="Python Modules"
      subtitle="Split code into files, import anything, install the world with pip — and never be confused by ModuleNotFoundError again."
      nav={NAV}
      next={{ icon: "🐍", label: "All Python Topics", href: "/python" }}
    >
      {/* 1 ─ what */}
      <Section id="what" number="01" title="What Is a Module?">
        <P>
          A module is just a <strong>.py file</strong>. A package is a <strong>folder of .py files</strong>.
          That&apos;s it — no magic. <IC>import math</IC> simply runs the file{" "}
          <IC>math</IC> once and gives you its variables and functions.
        </P>
        <FlowDiagram
          steps={[
            { label: "import math", sub: "you ask for it" },
            { label: "Python finds math.py", sub: "searches sys.path" },
            { label: "runs the file ONCE", sub: "cached after that" },
            { label: "math.sqrt(...)", sub: "use its tools" },
          ]}
        />
        <CodeBlock
          code={`import math\n\nprint(math.sqrt(16))\nprint(math.pi)\nprint(type(math))     # a module is an object too!`}
          output={`4.0\n3.141592653589793\n<class 'module'>`}
        />
        <Callout type="analogy">
          A module is a <strong>toolbox</strong> 🧰. <IC>import math</IC> brings the whole
          toolbox to your desk; <IC>math.sqrt</IC> picks one tool out of it.
        </Callout>
      </Section>

      {/* 2 ─ import styles */}
      <Section id="import" number="02" title="3 Import Styles ⭐">
        <CodeBlock
          title="Style 1 — import module (safest)"
          code={`import math\nprint(math.sqrt(25))      # always prefixed → no name clashes`}
          output={`5.0`}
        />
        <CodeBlock
          title="Style 2 — from module import name (shortest)"
          code={`from math import sqrt, pi\nprint(sqrt(25))           # no prefix needed\nprint(pi)`}
          output={`5.0\n3.141592653589793`}
        />
        <CodeBlock
          title="Style 3 — import module as alias (the convention)"
          code={`import datetime as dt\n\ntoday = dt.date.today()\nprint(today)`}
          output={`2025-06-11`}
        />
        <Table
          head={["Style", "Call it as", "When to use"]}
          rows={[
            ["import math", "math.sqrt(x)", "default — clear where things come from"],
            ["from math import sqrt", "sqrt(x)", "you use ONE thing many times"],
            ["import numpy as np", "np.array(...)", "long names with famous aliases"],
            ["from math import *", "sqrt(x)", "❌ never — floods your namespace"],
          ]}
        />
        <Callout type="mistake">
          <IC>from module import *</IC> dumps <strong>every</strong> name into your file —
          you can silently overwrite your own variables and nobody can tell where{" "}
          <IC>sqrt</IC> came from. Interviewers flag this instantly.
        </Callout>
      </Section>

      {/* 3 ─ your own module */}
      <Section id="own" number="03" title="Creating Your Own Module">
        <P>
          Save functions in one file, import them from another —{" "}
          <strong>both files in the same folder</strong>.
        </P>
        <CodeBlock
          title="mymath.py  (the module)"
          runnable={false}
          code={`# mymath.py\nPI = 3.14159\n\ndef square(n):\n    return n * n\n\ndef cube(n):\n    return n ** 3`}
        />
        <CodeBlock
          title="main.py  (uses the module)"
          code={`import mymath\n\nprint(mymath.square(4))\nprint(mymath.cube(3))\nprint(mymath.PI)\n\nfrom mymath import square\nprint(square(10))`}
          output={`16\n27\n3.14159\n100`}
        />
        <Callout type="behind">
          The module name is just the <strong>filename without .py</strong>. Python searches:
          ① the script&apos;s own folder → ② installed packages (site-packages) → ③ the
          standard library. See the exact list with <IC>import sys; print(sys.path)</IC>.
        </Callout>
        <Callout type="mistake">
          Never name your file <IC>math.py</IC>, <IC>random.py</IC> or{" "}
          <IC>string.py</IC> — your file <strong>shadows the real module</strong> and{" "}
          <IC>import random</IC> will import… your file. Classic head-scratcher bug.
        </Callout>
      </Section>

      {/* 4 ─ __main__ */}
      <Section id="main" number="04" title='__name__ == "__main__" ⭐'>
        <P>
          Every file gets a free variable <IC>__name__</IC>. Run the file directly →{" "}
          <IC>&quot;__main__&quot;</IC>. Imported by someone else → the module&apos;s name.
          This lets one file be <strong>both a script and a library</strong>.
        </P>
        <CodeBlock
          title="mymath.py — with a test block"
          code={`def square(n):\n    return n * n\n\nprint("__name__ is:", __name__)\n\nif __name__ == "__main__":\n    # runs ONLY when executed directly\n    print("self-test:", square(5))`}
          output={`__name__ is: __main__\nself-test: 25`}
        />
        <CodeBlock
          title="main.py — importing it"
          code={`import mymath          # the if-block does NOT run\nprint(mymath.square(3))`}
          output={`__name__ is: mymath\n9`}
        />
        <FlowDiagram
          steps={[
            { label: "python mymath.py", sub: '__name__ = "__main__" → test runs' },
            { label: "import mymath", sub: '__name__ = "mymath" → test skipped' },
          ]}
        />
        <Callout type="tip">
          Interview one-liner: &quot;it guards code that should run only when the file is
          executed directly, not when it&apos;s imported.&quot;
        </Callout>
      </Section>

      {/* 5 ─ stdlib */}
      <Section id="stdlib" number="05" title="Standard Library Tour — Batteries Included">
        <CodeBlock
          title="random — games & sampling"
          code={`import random\n\nprint(random.randint(1, 6))        # dice roll (both ends included!)\nprint(random.choice(["py", "js", "go"]))\n\ncards = [1, 2, 3, 4, 5]\nrandom.shuffle(cards)              # in place\nprint(cards)`}
          output={`4\npy\n[3, 1, 5, 2, 4]`}
        />
        <CodeBlock
          title="datetime — dates & time"
          code={`from datetime import date, datetime\n\nprint(date.today())\nprint(datetime.now().strftime("%d-%m-%Y %H:%M"))\n\nbday = date(2003, 5, 14)\nage_days = (date.today() - bday).days\nprint("Deelaksha is", age_days // 365, "years old")`}
          output={`2025-06-11\n11-06-2025 14:30\nDeelaksha is 22 years old`}
        />
        <CodeBlock
          title="os & sys — talk to the system"
          code={`import os, sys\n\nprint(os.getcwd())                 # current folder\nprint(os.path.exists("data.txt"))\nprint(sys.version.split()[0])      # python version`}
          output={`/home/deelaksha/projects\nFalse\n3.12.3`}
        />
        <Table
          head={["Module", "One-liner superpower"]}
          rows={[
            ["math", "sqrt, floor, ceil, pi, factorial"],
            ["random", "randint, choice, shuffle, sample"],
            ["datetime", "today, now, date math, strftime"],
            ["os / os.path", "files, folders, paths, env vars"],
            ["sys", "argv (CLI args), path, exit"],
            ["json", "loads / dumps — APIs everywhere"],
            ["collections", "Counter, defaultdict, deque"],
            ["itertools", "permutations, combinations"],
          ]}
        />
      </Section>

      {/* 6 ─ pip */}
      <Section id="pip" number="06" title="pip — Installing the World">
        <CodeBlock
          title="terminal — not Python!"
          runnable={false}
          code={`pip install requests              # install a package\npip install requests==2.31.0      # exact version\npip install --upgrade requests    # update\npip uninstall requests\npip list                          # what's installed?\npip show requests                 # version, location, deps`}
        />
        <CodeBlock
          title="then use it like any module"
          code={`import requests\n\nr = requests.get("https://api.github.com")\nprint(r.status_code)\nprint(r.json()["current_user_url"])`}
          output={`200\nhttps://api.github.com/user`}
        />
        <CodeBlock
          title="requirements.txt — share your dependencies"
          runnable={false}
          code={`# create the list from your environment\npip freeze > requirements.txt\n\n# teammate / server installs everything in one shot\npip install -r requirements.txt`}
        />
        <Callout type="mistake">
          <IC>pip install</IC> runs in the <strong>terminal</strong>, not inside Python.
          Typing it at the <IC>&gt;&gt;&gt;</IC> prompt gives <IC>SyntaxError</IC>. Also:
          the install name can differ from the import name —{" "}
          <IC>pip install pillow</IC> → <IC>import PIL</IC>,{" "}
          <IC>pip install opencv-python</IC> → <IC>import cv2</IC>.
        </Callout>
      </Section>

      {/* 7 ─ venv */}
      <Section id="venv" number="07" title="Virtual Environments — One Project, One Box">
        <P>
          Project A needs Django 4, Project B needs Django 5 — installing globally means
          they fight. A <strong>venv</strong> gives each project its own private
          site-packages.
        </P>
        <CodeBlock
          title="the 4-command workflow"
          runnable={false}
          code={`python -m venv .venv              # 1. create (once per project)\nsource .venv/bin/activate         # 2. activate  (Windows: .venv\\Scripts\\activate)\npip install requests              # 3. installs INSIDE .venv only\ndeactivate                        # 4. leave when done`}
        />
        <FlowDiagram
          steps={[
            { label: "global Python", sub: "keep it clean" },
            { label: ".venv per project", sub: "own packages" },
            { label: "requirements.txt", sub: "recreate anywhere" },
          ]}
        />
        <Callout type="tip">
          Your prompt shows <IC>(.venv)</IC> when active — that&apos;s how you know{" "}
          <IC>pip</IC> and <IC>python</IC> now point inside the box. Add{" "}
          <IC>.venv/</IC> to <IC>.gitignore</IC>; commit{" "}
          <IC>requirements.txt</IC> instead.
        </Callout>
      </Section>

      {/* 8 ─ exceptions */}
      <Section id="exceptions" number="08" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="ModuleNotFoundError — not installed (or wrong venv!)"
          code={`import pandas`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    import pandas\nModuleNotFoundError: No module named 'pandas'`}
          error
        />
        <CodeBlock
          title="ImportError — module exists, name doesn't"
          code={`from math import sqroot`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    from math import sqroot\nImportError: cannot import name 'sqroot' from 'math'`}
          error
        />
        <CodeBlock
          title="AttributeError — your file shadowed the real module"
          code={`# you saved your script as random.py 😱\nimport random\nprint(random.randint(1, 6))`}
          output={`Traceback (most recent call last):\n  File "random.py", line 3, in <module>\n    print(random.randint(1, 6))\nAttributeError: module 'random' has no attribute 'randint'`}
          error
        />
        <CodeBlock
          title="Circular import — a imports b imports a"
          runnable={false}
          code={`# a.py\nimport b        # b.py starts loading...\n\n# b.py\nimport a        # ...but a.py isn't finished yet! 💥\n\n# ImportError: cannot import name '...' from partially\n# initialized module 'a' (most likely due to a circular import)`}
        />
        <Table
          head={["Error", "Real meaning", "Fix"]}
          rows={[
            ["ModuleNotFoundError", "pip didn't install it / wrong venv", "pip install X — with venv active"],
            ["ImportError: cannot import name", "typo, or circular import", "check spelling; restructure imports"],
            ["AttributeError on a stdlib module", "your file shadows it", "rename your file, delete its .pyc"],
            ["pip works, import fails", "install name ≠ import name", "pillow→PIL, opencv-python→cv2"],
          ]}
        />
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Standard import", "import math\nmath.sqrt(16)"],
            ["Pick one thing", "from math import sqrt"],
            ["Alias", "import numpy as np"],
            ["Script-vs-library guard", 'if __name__ == "__main__":\n    main()'],
            ["Install / freeze", "pip install requests\npip freeze > requirements.txt"],
            ["Recreate env", "pip install -r requirements.txt"],
            ["Virtual env", "python -m venv .venv\nsource .venv/bin/activate"],
            ["Where Python searches", "import sys\nprint(sys.path)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
