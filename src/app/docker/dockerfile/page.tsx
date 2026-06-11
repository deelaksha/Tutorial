"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "what", label: "The Recipe File" },
  { id: "first", label: "Your First Dockerfile ⭐" },
  { id: "build", label: "docker build, Traced" },
  { id: "instructions", label: "The Instruction Set" },
  { id: "cmd-entrypoint", label: "CMD vs ENTRYPOINT ⭐" },
  { id: "cache", label: "Layer Caching — Order Matters ⭐" },
  { id: "dockerignore", label: ".dockerignore" },
  { id: "multistage", label: "Multi-Stage Builds" },
  { id: "best", label: "The Checklist" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerfilePage() {
  return (
    <TopicShell
      icon="📜"
      title="Dockerfile — Build Your Own Image"
      gradientWord="Dockerfile"
      subtitle="Stop running other people's images — build yours. A real Python web app containerized line by line, plus the two ideas that separate beginners from pros: CMD vs ENTRYPOINT, and cache-friendly instruction order."
      nav={NAV}
      next={{ icon: "💾", label: "Volumes — Persistent Data", href: "/docker/volumes" }}
    >
      {/* 01 ─ WHAT */}
      <Section id="what" number="01" title="The Recipe File">
        <P>
          A <strong>Dockerfile</strong> is a plain text file of instructions. <IC>docker build</IC>{" "}
          executes them top to bottom, and each filesystem-changing instruction becomes one{" "}
          <strong>layer</strong> of the final image — the exact layers you X-rayed with{" "}
          <IC>docker history</IC>:
        </P>
        <CodeBlock
          title="the_idea.txt"
          runnable={false}
          code={`  Dockerfile (recipe)        docker build         image (frozen dish)
  ┌──────────────────┐                          ┌──────────────────┐
  │ FROM python:3.12 │ ───────────────────────▶ │ layer: base      │
  │ COPY app.py .    │      each instruction    │ layer: app.py    │
  │ RUN pip install  │      = one layer         │ layer: packages  │
  │ CMD ["python"...]│                          │ metadata: cmd    │
  └──────────────────┘                          └──────────────────┘

 the Dockerfile lives IN YOUR REPO, version-controlled with your code.
 environment-as-code: review it, diff it, roll it back — like any file.`}
        />
        <Callout type="analogy">
          🍰 Image = cake, container = a slice being eaten... and the Dockerfile is the{" "}
          <strong>written recipe</strong>. Anyone with the recipe bakes a bit-for-bit identical
          cake — that&apos;s the whole &quot;works on every machine&quot; promise, made
          reproducible.
        </Callout>
      </Section>

      {/* 02 ─ FIRST */}
      <Section id="first" number="02" title="Your First Dockerfile — A Real Python App ⭐">
        <P>The app we&apos;ll carry through the rest of the course — a tiny Flask API:</P>
        <CodeBlock
          title="app.py"
          code={`from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "Hello from inside a container!"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)`}
          runnable={false}
        />
        <CodeBlock
          title="requirements.txt"
          runnable={false}
          code={`flask==3.0.3`}
        />
        <CodeBlock
          title="Dockerfile  (no extension, capital D, next to app.py)"
          runnable={false}
          code={`FROM python:3.12-slim              # 1️⃣ start from this base image

WORKDIR /app                       # 2️⃣ cd (and mkdir) inside the image

COPY requirements.txt .            # 3️⃣ copy deps list in first (cache! §06)
RUN pip install -r requirements.txt  # 4️⃣ run a command, bake result into a layer

COPY . .                           # 5️⃣ now copy the rest of the source

EXPOSE 5000                        # 6️⃣ document the port (docs only!)

CMD ["python", "app.py"]           # 7️⃣ default command when a container starts`}
        />
        <Callout type="mistake">
          <IC>host=&quot;0.0.0.0&quot;</IC> in app.py is not optional. Flask&apos;s default{" "}
          <IC>127.0.0.1</IC> means &quot;only accept connections from inside this container&quot; —
          your <IC>-p</IC> mapping will connect and instantly drop. Servers in containers must
          listen on <IC>0.0.0.0</IC>. This bug costs every beginner an afternoon; you just saved
          yours.
        </Callout>
      </Section>

      {/* 03 ─ BUILD */}
      <Section id="build" number="03" title="docker build, Traced">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker build -t myapp:1.0 .
#                ──┬───────  ┬
#                  │         └─ build CONTEXT: "send this folder to the daemon"
#                  └─ tag the result (name:version)`}
          output={`[+] Building 12.4s (10/10) FINISHED
 => [1/5] FROM docker.io/library/python:3.12-slim       2.1s
 => [2/5] WORKDIR /app                                  0.1s
 => [3/5] COPY requirements.txt .                       0.1s
 => [4/5] RUN pip install -r requirements.txt           9.8s  ← the slow one
 => [5/5] COPY . .                                      0.1s
 => exporting to image                                  0.2s
 => => naming to docker.io/library/myapp:1.0

$ docker run -d --name api -p 5000:5000 myapp:1.0
$ curl localhost:5000
{"message":"Hello from inside a container!"}     🎉 YOUR app, YOUR image`}
        />
        <DockerFlow initial="build" />
        <Callout type="note">
          That trailing <IC>.</IC> is the <strong>build context</strong> — the folder shipped to
          the daemon, and the world <IC>COPY</IC> can see. Files outside it don&apos;t exist as far
          as the build is concerned.
        </Callout>
      </Section>

      {/* 04 ─ INSTRUCTIONS */}
      <Section id="instructions" number="04" title="The Instruction Set — What Each One Does">
        <Table
          head={["Instruction", "What it does", "Layer?"]}
          rows={[
            [<IC key="from">FROM img:tag</IC>, "the base image to build on — always line 1", "inherits its layers"],
            [<IC key="wd">WORKDIR /app</IC>, "mkdir + cd for all following instructions", "metadata"],
            [<IC key="copy">COPY src dst</IC>, "copy files from build context into the image", "yes"],
            [<IC key="run">RUN cmd</IC>, "execute at BUILD time, bake the result in", "yes"],
            [<IC key="env">ENV K=V</IC>, "environment variable (build + runtime)", "metadata"],
            [<IC key="expose">EXPOSE 5000</IC>, "document the port — does NOT publish it", "metadata"],
            [<IC key="cmd">CMD [\"...\"]</IC>, "default command at RUN time (one per file)", "metadata"],
            [<IC key="ep">ENTRYPOINT [\"...\"]</IC>, "the fixed executable (see §05)", "metadata"],
            [<IC key="user">USER appuser</IC>, "drop root for whatever follows", "metadata"],
          ]}
        />
        <Callout type="mistake">
          The classic confusion — <IC>RUN</IC> vs <IC>CMD</IC>: <IC>RUN</IC> executes{" "}
          <strong>once at build time</strong> (install things, compile things);{" "}
          <IC>CMD</IC> executes <strong>every time a container starts</strong> (start the app).
          &quot;RUN bakes the cake, CMD serves it.&quot;
        </Callout>
        <Callout type="mistake">
          <IC>EXPOSE</IC> publishes nothing — it&apos;s documentation. Reaching the port still
          requires <IC>-p 5000:5000</IC> at run time. Two different jobs.
        </Callout>
      </Section>

      {/* 05 ─ CMD VS ENTRYPOINT */}
      <Section id="cmd-entrypoint" number="05" title="CMD vs ENTRYPOINT — Who Controls the Command ⭐">
        <P>
          Both define &quot;what runs at start&quot; — the difference is what happens when the user
          passes extra words after the image name:
        </P>
        <CodeBlock
          title="cmd_vs_entrypoint.txt"
          runnable={false}
          code={`CMD = a DEFAULT, fully replaced by user args:
   Dockerfile:  CMD ["python", "app.py"]
   docker run myapp            → python app.py        (default used)
   docker run myapp bash       → bash                 (CMD thrown away!)

ENTRYPOINT = FIXED, user args are APPENDED:
   Dockerfile:  ENTRYPOINT ["python", "app.py"]
   docker run myapp            → python app.py
   docker run myapp --debug    → python app.py --debug   (appended ✅)

THE PRO PATTERN — combine them:
   ENTRYPOINT ["python", "app.py"]   ← the program (fixed)
   CMD ["--port", "5000"]            ← default ARGS (replaceable)

   docker run myapp                  → python app.py --port 5000
   docker run myapp --port 9000      → python app.py --port 9000`}
        />
        <Callout type="analogy">
          🎮 ENTRYPOINT is the <strong>game console</strong> — bolted down, always what turns on.
          CMD is the <strong>game cartridge in the slot</strong> — there&apos;s a default, but the
          player can swap it.
        </Callout>
        <Callout type="behind">
          Always use the <strong>JSON array form</strong> <IC>CMD [&quot;python&quot;,
          &quot;app.py&quot;]</IC>, not <IC>CMD python app.py</IC>. The string form wraps your app
          in <IC>/bin/sh -c</IC>, and the shell — not your app — becomes PID 1, eating the SIGTERM
          that <IC>docker stop</IC> sends. Result: every stop waits the full 10s and ends in
          SIGKILL.
        </Callout>
      </Section>

      {/* 06 ─ CACHE */}
      <Section id="cache" number="06" title="Layer Caching — Why Instruction ORDER Matters ⭐">
        <P>
          On rebuild, Docker reuses a cached layer if the instruction (and the files it copies) are
          unchanged — but the <strong>first changed step invalidates everything after it</strong>:
        </P>
        <CodeBlock
          title="cache_rules.txt"
          runnable={false}
          code={`you edit app.py and rebuild. what re-runs?

❌ NAIVE ORDER                          ✅ SMART ORDER (our Dockerfile)
FROM python:3.12-slim    cached         FROM python:3.12-slim     cached
WORKDIR /app             cached         WORKDIR /app              cached
COPY . .                 CHANGED! 💥    COPY requirements.txt .   cached ✅
RUN pip install -r ...   re-runs 😱     RUN pip install -r ...    cached ✅⭐
                         (9.8s every                              (deps didn't change!)
                          single edit)  COPY . .                  CHANGED 💥 (0.1s)

rule: COPY . . grabs app.py → any code edit changes that layer
      → everything BELOW it must re-run.

⭐ THE PATTERN: order instructions from least → most frequently changing.
   deps list changes monthly; code changes every minute.
   that's why requirements.txt is copied ALONE, first.`}
        />
        <CodeBlock
          title="terminal — rebuild after editing app.py"
          runnable={false}
          code={`$ docker build -t myapp:1.1 .`}
          output={` => CACHED [2/5] WORKDIR /app
 => CACHED [3/5] COPY requirements.txt .
 => CACHED [4/5] RUN pip install -r requirements.txt   ← the 9.8s step: FREE
 => [5/5] COPY . .                                      0.1s

[+] Building 0.4s — from 12.4s down to half a second ⭐`}
        />
        <Callout type="tip">
          ⭐ This one idea — <strong>copy the dependency manifest first, install, then copy the
          code</strong> — is the highest-value Dockerfile trick in existence. Same pattern in
          every language: <IC>package.json</IC> (Node), <IC>go.mod</IC> (Go), <IC>pom.xml</IC>{" "}
          (Java).
        </Callout>
      </Section>

      {/* 07 ─ DOCKERIGNORE */}
      <Section id="dockerignore" number="07" title=".dockerignore — Keep Junk Out of the Context">
        <P>
          <IC>COPY . .</IC> copies <em>everything</em> in the context — including your virtualenv,
          git history and secrets, unless you say otherwise. Same idea as{" "}
          <IC>.gitignore</IC>:
        </P>
        <CodeBlock
          title=".dockerignore"
          runnable={false}
          code={`.git
.venv
__pycache__/
*.pyc
.env             # ← secrets NEVER belong inside an image
Dockerfile
README.md`}
        />
        <Callout type="mistake">
          Forgetting <IC>.dockerignore</IC> hurts twice: a bloated slow build context (a{" "}
          <IC>.venv</IC> can be hundreds of MB), and worse — <strong>cache busts</strong>: any
          file change inside <IC>.git/</IC> invalidates the <IC>COPY . .</IC> layer even though
          your code didn&apos;t change.
        </Callout>
        <Callout type="note">
          Secrets (<IC>.env</IC>, keys, tokens) must never be COPYed in — image layers are
          permanent and anyone who pulls the image can read every layer. Pass secrets at{" "}
          <em>run time</em> with <IC>-e</IC> or env files (Compose page).
        </Callout>
      </Section>

      {/* 08 ─ MULTISTAGE */}
      <Section id="multistage" number="08" title="Multi-Stage Builds — Big Kitchen, Small Plate">
        <P>
          Building often needs heavy tools (compilers, dev headers) that the final app never uses
          at run time. Multi-stage = build in a fat image, then copy <em>only the result</em> into
          a clean one:
        </P>
        <CodeBlock
          title="Dockerfile  (multi-stage, React frontend example)"
          runnable={false}
          code={`# ---- stage 1: the BUILDER (heavy, disposable) ----
FROM node:22 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build              # produces /app/dist (static files)

# ---- stage 2: the RUNNER (tiny, what ships) ----
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
#      ─────┬─────
#  reach into stage 1 and take ONLY the built files

# node_modules (400MB), npm, node itself: left behind in the builder 💨`}
          output={`$ docker images
REPOSITORY   TAG      SIZE
frontend     1.0      52MB    ← final image
node         22       1.1GB   ← what a single-stage build would have shipped

20× smaller: faster pulls, faster deploys, less attack surface.`}
        />
        <Callout type="analogy">
          🍽️ The builder stage is the <strong>messy kitchen</strong> — flour everywhere, every
          gadget out. The final stage is the <strong>plate served to the table</strong>: only the
          finished dish leaves the kitchen.
        </Callout>
      </Section>

      {/* 09 ─ BEST PRACTICES */}
      <Section id="best" number="09" title="The Checklist — Every Production Dockerfile">
        <Table
          head={["Rule", "Why"]}
          rows={[
            ["Pin the base tag (python:3.12-slim, never :latest)", "rebuilds stay reproducible"],
            ["Prefer -slim / -alpine bases", "10× smaller, 10× fewer CVEs to patch"],
            ["Manifest first, install, THEN copy code", "the §06 cache pattern — fast rebuilds"],
            ["Always ship a .dockerignore", "small context, no secrets, no cache busts"],
            ["JSON form for CMD/ENTRYPOINT", "your app gets the signals (clean shutdown)"],
            ["USER appuser near the end", "don't run as root — defense in depth"],
            ["Multi-stage when build tools are heavy", "ship the plate, not the kitchen"],
            ["One process per container", "scale, restart and debug each part alone"],
          ]}
        />
        <Callout type="tip">
          Want graded feedback? <IC>docker run --rm -i hadolint/hadolint &lt; Dockerfile</IC> —
          a linter for Dockerfiles, itself running from a container. Very Docker.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Dockerfile", "text recipe; docker build turns it into an image"],
            ["Each instruction", "≈ one layer (FROM/COPY/RUN change files; rest is metadata)"],
            ["RUN vs CMD", "RUN at BUILD time (bake) · CMD at START time (serve)"],
            ["CMD", "default command — fully REPLACED by docker run args"],
            ["ENTRYPOINT", "fixed program — run args get APPENDED"],
            ["Pro pattern", "ENTRYPOINT = program · CMD = default flags"],
            ["Cache golden rule ⭐", "copy manifest → install deps → THEN copy code"],
            ["Cache invalidation", "first changed step re-runs everything below it"],
            ["EXPOSE", "documentation only — publishing still needs -p"],
            ["0.0.0.0", "servers in containers must bind 0.0.0.0, not 127.0.0.1"],
            ["Secrets", "never COPY into an image — layers are readable forever"],
            ["Multi-stage", "build in a fat stage, COPY --from into a tiny final stage"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
