"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "problem", label: "The Problem Docker Solves" },
  { id: "what-is-container", label: "What Is a Container?" },
  { id: "vm-vs-container", label: "VMs vs Containers ⭐" },
  { id: "image-vs-container", label: "Image vs Container ⭐" },
  { id: "architecture", label: "The Docker Architecture" },
  { id: "vocabulary", label: "The 8 Words You Need" },
  { id: "scenarios", label: "5 Real Rescues" },
  { id: "first-look", label: "Your First 60 Seconds" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerIntroPage() {
  return (
    <TopicShell
      icon="🤔"
      title="Why Docker?"
      gradientWord="Docker"
      subtitle="Before any command: WHAT problem does Docker solve, what exactly is a 'container', and how is an image a different thing from a container? Get this mental map right and every command later becomes obvious."
      nav={NAV}
      next={{ icon: "🔧", label: "Install & First Container", href: "/docker/setup" }}
    >
      {/* 01 ─ PROBLEM */}
      <Section id="problem" number="01" title="The Problem — You've Already Lived It">
        <P>
          Every developer who has ever shipped code to another machine has heard (or said) these
          exact sentences:
        </P>
        <CodeBlock
          title="the_eternal_conversation.txt"
          runnable={false}
          code={`💬 "It works on my machine."
💬 "Well, we're not shipping your machine."

the classic deployment disaster:
   YOUR LAPTOP                      THE SERVER
   Python 3.12  ✅                  Python 3.8   💥 syntax error
   postgres 16  ✅                  postgres 12  💥 missing feature
   libssl 3.0   ✅                  libssl 1.1   💥 crash on import
   ENV=dev      ✅                  ENV=???      💥 config missing

   same code. different machine. different EVERYTHING. 🔥`}
        />
        <P>Four pains, one tool fixes all of them:</P>
        <Table
          head={["Pain", "What you actually want", "Docker's answer"]}
          rows={[
            ["\"works on my machine\"", "the EXACT same environment everywhere", "an image: app + deps + OS libs frozen together"],
            ["\"setup takes a whole day\"", "new teammate productive in minutes", "docker run — environment in one command"],
            ["\"app A needs Python 3.8, app B needs 3.12\"", "isolated environments that can't fight", "each container has its own filesystem"],
            ["\"the server is a fragile snowflake\"", "servers as disposable, reproducible cattle", "destroy + recreate from the image, identically"],
          ]}
        />
        <Callout type="analogy">
          🚢 Docker is named after <strong>shipping containers</strong>. Before them, loading a
          ship meant handling barrels, crates and sacks individually — slow and chaotic. The
          standardized container changed everything: pack ANYTHING inside, and every crane, truck
          and ship in the world can move it. Docker does this for software: pack any app inside,
          and any machine that runs Docker can run it.
        </Callout>
      </Section>

      {/* 02 ─ WHAT IS A CONTAINER */}
      <Section id="what-is-container" number="02" title="What Is a Container, Precisely?">
        <P>
          A <strong>container</strong> is just a normal process on your machine — but wrapped in
          isolation walls so it gets its <em>own</em> filesystem, its own network, its own process
          list. It <em>thinks</em> it&apos;s alone on a fresh Linux machine. It isn&apos;t — it
          shares your machine&apos;s kernel with every other container.
        </P>
        <CodeBlock
          title="container_anatomy.txt"
          runnable={false}
          code={`a container = process + isolation walls

   ┌─ container A ──────────┐   ┌─ container B ──────────┐
   │  python app.py         │   │  postgres               │
   │  sees: its OWN         │   │  sees: its OWN          │
   │   • filesystem (/)     │   │   • filesystem (/)      │
   │   • processes (PID 1!) │   │   • processes (PID 1!)  │
   │   • network + ports    │   │   • network + ports     │
   │   • hostname           │   │   • hostname            │
   └───────────┬────────────┘   └───────────┬────────────┘
               │      both are just processes │
   ════════════╧══════════════════════════════╧════════════
                 ONE shared Linux kernel (your machine's)

isolation is built from 2 kernel features:
  • namespaces  → what the process can SEE   (its own /, PIDs, network)
  • cgroups     → what the process can USE   (CPU/memory limits)`}
        />
        <Callout type="behind">
          Containers are <strong>not</strong> magic Docker invented — Linux namespaces and cgroups
          existed for years. Docker&apos;s 2013 breakthrough was the <em>packaging</em>: the image
          format, the registry, and a one-line CLI that made kernel wizardry usable by everyone.
        </Callout>
        <Callout type="note">
          Because a container is just a process, it starts in <strong>milliseconds</strong> and a
          laptop can run dozens of them. Keep &quot;container = isolated process&quot; in your
          head; half of Docker&apos;s weirdness evaporates.
        </Callout>
      </Section>

      {/* 03 ─ VM VS CONTAINER */}
      <Section id="vm-vs-container" number="03" title="Virtual Machines vs Containers ⭐">
        <P>
          Interview-question-level important. Both isolate apps — but at completely different
          layers, with completely different costs:
        </P>
        <CodeBlock
          title="vm_vs_container.txt"
          runnable={false}
          code={`VIRTUAL MACHINES                       CONTAINERS

 ┌─────────┐ ┌─────────┐               ┌───────┐ ┌───────┐ ┌───────┐
 │ app A   │ │ app B   │               │ app A │ │ app B │ │ app C │
 │ libs    │ │ libs    │               │ libs  │ │ libs  │ │ libs  │
 │ GUEST   │ │ GUEST   │               └───┬───┘ └───┬───┘ └───┬───┘
 │ OS 🐧   │ │ OS 🐧   │  whole OS         │   docker engine   │
 │ (GBs!)  │ │ (GBs!)  │  per app!     ════╧═════════╧═════════╧════
 └────┬────┘ └────┬────┘                      host OS kernel 🐧
 ┌────┴───────────┴────┐               ┌─────────────────────────┐
 │  hypervisor         │               │  hardware               │
 ├─────────────────────┤               └─────────────────────────┘
 │  host OS │ hardware │
 └─────────────────────┘

 boot time:   minutes                   boot time:   milliseconds
 size:        gigabytes (full OS)       size:        megabytes (app + libs)
 per machine: a handful                 per machine: dozens to hundreds
 isolation:   hardware-level (strong)   isolation:   kernel-level (good)`}
        />
        <Table
          head={["Question", "VM", "Container"]}
          rows={[
            ["What's virtualized?", "the entire HARDWARE", "just the OS view (namespaces)"],
            ["Has its own kernel?", "yes — full guest OS", "no — shares the host kernel"],
            ["Startup", "minutes", "milliseconds"],
            ["Typical size", "GBs", "MBs"],
            ["Run Windows app on Linux?", "yes", "no (shared kernel must match)"],
          ]}
        />
        <Callout type="analogy">
          🏠 A VM is a <strong>house</strong> — own foundation, plumbing, electricity. A container
          is an <strong>apartment</strong> — own locked door and rooms, but the building&apos;s
          shared foundation and pipes. Apartments are far cheaper and faster to build, and one
          building holds many of them.
        </Callout>
      </Section>

      {/* 04 ─ IMAGE VS CONTAINER */}
      <Section id="image-vs-container" number="04" title="Image vs Container — Two Different Things ⭐">
        <P>
          The #1 vocabulary confusion, and the exact same relationship as a class and an object in
          Python:
        </P>
        <CodeBlock
          title="image_vs_container.txt"
          runnable={false}
          code={`IMAGE                                  CONTAINER
────────────────────────────────       ─────────────────────────────────
a read-only TEMPLATE                   a RUNNING INSTANCE of an image
app + libs + OS files, frozen          template + a live process + a
sits on disk, does nothing             writable layer on top
built once                             started many times
shared via registries (Docker Hub)     lives and dies on one machine

            ONE image                    MANY containers
        ┌──────────────┐    docker run   ┌─────────────┐
        │  python:3.12 │ ──────────────▶ │ container 1 │  (running)
        │  (read-only  │ ──────────────▶ │ container 2 │  (running)
        │   template)  │ ──────────────▶ │ container 3 │  (stopped)
        └──────────────┘                 └─────────────┘

exactly like Python:   class Dog:  ──▶  d1 = Dog()   d2 = Dog()   d3 = Dog()
                       (image)          (containers)`}
        />
        <Callout type="analogy">
          🍪 An image is the <strong>cookie cutter</strong>; containers are the{" "}
          <strong>cookies</strong>. One cutter, unlimited identical cookies — and eating a cookie
          (deleting a container) never damages the cutter.
        </Callout>
        <Callout type="mistake">
          Beginners say &quot;I deleted the container, my image is gone!&quot; — no. Containers and
          images are stored separately. <IC>docker rm</IC> removes a container;{" "}
          <IC>docker rmi</IC> removes an image. The Images page draws exactly where each lives.
        </Callout>
      </Section>

      {/* 05 ─ ARCHITECTURE */}
      <Section id="architecture" number="05" title="The Docker Architecture — Who Talks to Whom">
        <P>
          When you type <IC>docker run</IC>, three actors cooperate. Knowing them explains every
          error message you&apos;ll ever see:
        </P>
        <DockerFlow initial="pull" />
        <Callout type="behind">
          The CLI does <strong>nothing</strong> itself — it only sends requests. The daemon does
          ALL the work: builds images, runs containers, manages networks and volumes. That&apos;s
          why Docker needs a background service running (<IC>Cannot connect to the Docker
          daemon</IC> = the engine isn&apos;t started).
        </Callout>
        <Callout type="note">
          <strong>Docker Hub</strong> (hub.docker.com) is to images what GitHub is to code: a
          public registry. <IC>python</IC>, <IC>nginx</IC>, <IC>postgres</IC>, <IC>redis</IC> —
          official, maintained images for almost everything already exist. You rarely start from
          scratch.
        </Callout>
      </Section>

      {/* 06 ─ VOCABULARY */}
      <Section id="vocabulary" number="06" title="The 8 Words You Need">
        <Table
          head={["Term (you'll see these everywhere)", "Meaning"]}
          rows={[
            ["image", "read-only template: app + dependencies + OS files"],
            ["container", "a running (or stopped) instance of an image"],
            ["Dockerfile", "text recipe that BUILDS an image, instruction by instruction"],
            ["layer", "one cached step of an image — images are stacks of layers"],
            ["registry", "server that stores images (Docker Hub = the default one)"],
            ["tag", "a label on an image version, e.g. python:3.12-slim"],
            ["volume", "persistent storage that survives container deletion"],
            ["daemon (dockerd)", "the background engine that does all the real work"],
          ]}
        />
        <Callout type="tip">
          ⭐ The whole course in one sentence: you write a <strong>Dockerfile</strong>, build it
          into an <strong>image</strong> made of <strong>layers</strong>, run it as a{" "}
          <strong>container</strong>, attach <strong>volumes</strong> for data, and push the image
          to a <strong>registry</strong> so any machine can run it.
        </Callout>
      </Section>

      {/* 07 ─ SCENARIOS */}
      <Section id="scenarios" number="07" title="5 Real Rescues — When Docker Saves You">
        <P>
          Each of these is a real situation, and each maps to a page in this track. This table is
          your motivation to keep going:
        </P>
        <Table
          head={["😱 The disaster", "🦸 The Docker rescue", "Where you'll learn it"]}
          rows={[
            ["\"new laptop, full day lost reinstalling everything\"", "docker compose up — the entire stack in one command", "Compose page"],
            ["\"I need Postgres for ONE test, not installed forever\"", "docker run postgres → test → docker rm. Machine untouched.", "Containers page"],
            ["\"prod runs Python 3.8, I developed on 3.12\"", "FROM python:3.8 — dev in EXACTLY the prod environment", "Dockerfile page"],
            ["\"two projects need conflicting library versions\"", "each project in its own container — they can't even see each other", "Containers page"],
            ["\"deploy day = sweating + prayers\"", "the SAME image you tested is what runs in prod, bit for bit", "Deploy page"],
          ]}
        />
        <CodeBlock
          title="rescue_preview.txt"
          runnable={false}
          code={`a taste of rescue #2 — disposable databases:

  $ docker run -d --name testdb -e POSTGRES_PASSWORD=pw postgres
  # 💡 a full postgres server, running, in ~2 seconds

  ...run your tests against it...

  $ docker rm -f testdb
  # 🧹 gone. nothing installed. your machine is exactly as before.`}
        />
        <Callout type="tip">
          That &quot;try anything, throw it away&quot; loop changes how you work: databases,
          message queues, even other Linux distros become as disposable as browser tabs.
        </Callout>
      </Section>

      {/* 08 ─ FIRST LOOK */}
      <Section id="first-look" number="08" title="Your First 60 Seconds — A Preview of the Whole Track">
        <P>
          Don&apos;t memorize anything yet — just watch a full lifecycle once, so the coming pages
          feel familiar. Five commands, one running web server:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker pull nginx                    # 1️⃣ download an image from Docker Hub
$ docker images                        # 2️⃣ see what's on disk
$ docker run -d -p 8080:80 nginx       # 3️⃣ start a container (web server!)
$ docker ps                            # 4️⃣ see what's running
$ docker stop $(docker ps -q)          # 5️⃣ stop it`}
          output={`$ docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
a2abf6c4d29d: Pull complete
Status: Downloaded newer image for nginx:latest

$ docker run -d -p 8080:80 nginx
7f3b2a1c9e8d...                        ← the new container's ID

$ docker ps
CONTAINER ID   IMAGE   STATUS         PORTS                  NAMES
7f3b2a1c9e8d   nginx   Up 5 seconds   0.0.0.0:8080->80/tcp   epic_turing

→ open http://localhost:8080 — a real web server is running 🎉
   you installed NOTHING. no nginx package. no config. one command.`}
        />
        <Callout type="behind">
          That weird <IC>7f3b2a1c9e8d...</IC> string is the container&apos;s <strong>ID</strong> —
          like a git commit hash, you can refer to any container by it (or by the random fun name
          Docker generates, like <IC>epic_turing</IC>).
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Docker solves", "\"works on my machine\" — same environment everywhere"],
            ["Container =", "an isolated PROCESS (namespaces + cgroups), not a mini-VM"],
            ["VM vs container", "VM virtualizes hardware + full OS; container shares the kernel"],
            ["Image =", "read-only template (cookie cutter 🍪)"],
            ["Container vs image", "container = running instance of an image (the cookie)"],
            ["Dockerfile", "the text recipe that builds an image"],
            ["Docker Hub", "GitHub for images — the default public registry"],
            ["CLI vs daemon", "docker CLI just sends requests; dockerd does all the work"],
            ["Why containers are fast", "no OS to boot — it's just a process starting"],
            ["The pipeline", "Dockerfile → build → image → run → container → push → registry"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
