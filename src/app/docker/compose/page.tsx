"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "problem", label: "The Flag-Soup Problem" },
  { id: "first-file", label: "Your First compose.yaml ⭐" },
  { id: "up-down", label: "up · down — The Lifecycle" },
  { id: "anatomy", label: "Anatomy of a Service" },
  { id: "depends", label: "depends_on & Healthchecks" },
  { id: "env", label: "Environment & .env Files" },
  { id: "dev-loop", label: "The Dev Loop — watch & rebuild" },
  { id: "commands", label: "The Daily Compose Commands" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerComposePage() {
  return (
    <TopicShell
      icon="🧩"
      title="Docker Compose"
      gradientWord="Compose"
      subtitle="Last page you wired app + database with five long commands. Compose replaces all of it with one YAML file and one command: docker compose up. Your whole stack, declared, versioned, reproducible."
      nav={NAV}
      next={{ icon: "☁️", label: "Registry & Deploy — End to End", href: "/docker/deploy" }}
    >
      {/* 01 ─ PROBLEM */}
      <Section id="problem" number="01" title="The Flag-Soup Problem">
        <P>
          Here&apos;s the &quot;app + db&quot; setup from the Networking page. Now imagine typing
          this every morning — and emailing it to teammates:
        </P>
        <CodeBlock
          title="the_old_way.sh"
          runnable={false}
          code={`docker network create mynet
docker volume create dbdata
docker run -d --name db --network mynet \\
  -e POSTGRES_PASSWORD=pw \\
  -v dbdata:/var/lib/postgresql/data postgres:16
docker run -d --name api --network mynet -p 5000:5000 \\
  -e DATABASE_URL=postgres://postgres:pw@db:5432/postgres \\
  --restart unless-stopped myapp:1.0

# problems:
#  😱 5 commands, 12 flags, exact ORDER matters
#  😱 lives in your shell history, not your repo
#  😱 "did you remember the volume flag?" — different on every machine
#  😱 add redis tomorrow = another command to document somewhere`}
        />
        <Callout type="analogy">
          🎼 Running containers by hand is conducting each musician individually. Compose is the{" "}
          <strong>sheet music</strong>: the whole orchestra described in one document — anyone can
          conduct an identical performance with a single downbeat (<IC>up</IC>).
        </Callout>
      </Section>

      {/* 02 ─ FIRST FILE */}
      <Section id="first-file" number="02" title="Your First compose.yaml — The Same Stack, Declared ⭐">
        <CodeBlock
          title="compose.yaml  (in your project root)"
          runnable={false}
          code={`services:
  api:
    build: .                  # build from the Dockerfile in this folder
    ports:
      - "5000:5000"           # same -p, as YAML
    environment:
      DATABASE_URL: postgres://postgres:pw@db:5432/postgres
    depends_on:
      - db                    # start db first

  db:
    image: postgres:16        # pull, don't build
    environment:
      POSTGRES_PASSWORD: pw
    volumes:
      - dbdata:/var/lib/postgresql/data

volumes:
  dbdata:                     # declare the named volume`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker compose up -d`}
          output={`[+] Running 4/4
 ✔ Network myapp_default   Created     ← network: made FOR you
 ✔ Volume  myapp_dbdata    Created     ← volume: made FOR you
 ✔ Container myapp-db-1    Started
 ✔ Container myapp-api-1   Started

$ curl localhost:5000/users
{"users": ["deelaksha"]}        🎉 the entire stack. one command.`}
        />
        <DockerFlow initial="compose" />
        <Callout type="tip">
          ⭐ Notice what you did NOT write: no <IC>docker network create</IC>, no{" "}
          <IC>--network</IC> flags. Compose puts all services on a shared network automatically —
          and the service names (<IC>api</IC>, <IC>db</IC>) become hostnames, exactly the DNS
          magic from the Networking page.
        </Callout>
        <Callout type="note">
          The file is <IC>compose.yaml</IC> (modern) — you&apos;ll also see{" "}
          <IC>docker-compose.yml</IC> (legacy, still works). The command is{" "}
          <IC>docker compose</IC> (a space — the old <IC>docker-compose</IC> binary with a hyphen
          is the deprecated v1).
        </Callout>
      </Section>

      {/* 03 ─ UP/DOWN */}
      <Section id="up-down" number="03" title="up · down — The Whole-Stack Lifecycle">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker compose up -d       # create + start everything (idempotent!)
$ docker compose ps          # status of THIS project's services
$ docker compose down        # stop + remove containers & network
$ docker compose down -v     # ...AND delete the volumes ☠️ (data gone)`}
          output={`$ docker compose ps
NAME           IMAGE         STATUS         PORTS
myapp-api-1    myapp-api     Up 2 minutes   0.0.0.0:5000->5000/tcp
myapp-db-1     postgres:16   Up 2 minutes   5432/tcp

$ docker compose down
[+] Running 3/3
 ✔ Container myapp-api-1  Removed
 ✔ Container myapp-db-1   Removed
 ✔ Network myapp_default  Removed
   ← note: the VOLUME survived. data is safe across down/up cycles ✅`}
        />
        <Callout type="behind">
          <IC>up</IC> is <strong>idempotent</strong>: it diffs the file against reality and only
          touches what changed. Edited one service&apos;s config? <IC>up -d</IC> recreates just
          that container. This &quot;declare the goal, let the tool reconcile&quot; mindset is the
          same one Kubernetes scales up later.
        </Callout>
        <Callout type="mistake">
          <IC>down -v</IC> deletes named volumes — your database. People type it to &quot;clean up
          properly&quot; and erase their dev data. Plain <IC>down</IC> is the daily command;{" "}
          <IC>-v</IC> only when you truly want a factory reset.
        </Callout>
      </Section>

      {/* 04 ─ ANATOMY */}
      <Section id="anatomy" number="04" title="Anatomy of a Service — Every Flag Has a YAML Home">
        <P>
          A service block is just <IC>docker run</IC> flags in YAML clothing. The translation
          table:
        </P>
        <Table
          head={["docker run flag", "compose.yaml key"]}
          rows={[
            [<IC key="1">-p 5000:5000</IC>, <IC key="1y">ports: [&quot;5000:5000&quot;]</IC>],
            [<IC key="2">-e KEY=value</IC>, <IC key="2y">environment:</IC>],
            [<IC key="3">-v dbdata:/path</IC>, <IC key="3y">volumes:</IC>],
            [<IC key="4">--name web</IC>, <IC key="4y">the service name itself</IC>],
            [<IC key="5">--restart unless-stopped</IC>, <IC key="5y">restart: unless-stopped</IC>],
            [<IC key="6">myapp:1.0 (image)</IC>, <IC key="6y">image: — or build: to make it</IC>],
            [<IC key="7">--network mynet</IC>, <IC key="7y">(automatic — free DNS included)</IC>],
          ]}
        />
        <CodeBlock
          title="compose.yaml — a fuller service, annotated"
          runnable={false}
          code={`services:
  api:
    build: .                       # OR image: myapp:1.0 — build vs pull
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
    volumes:
      - ./config:/etc/myapp:ro     # bind mounts work here too
    restart: unless-stopped        # auto-restart on crash/reboot
    depends_on:
      - db`}
        />
        <Callout type="tip">
          Already know <IC>docker run</IC>? Then you already know Compose — it&apos;s the same
          model, written down instead of typed out. Nothing new to learn, just a new place to put
          it: <strong>in your repo, under version control</strong>.
        </Callout>
      </Section>

      {/* 05 ─ DEPENDS_ON */}
      <Section id="depends" number="05" title="depends_on & Healthchecks — Start Order Done Right">
        <P>
          Plain <IC>depends_on</IC> only orders <em>startup</em> — but postgres takes a few
          seconds to be <em>ready</em>. Your api can start, connect too early, and crash. The real
          fix is a <strong>healthcheck</strong>:
        </P>
        <CodeBlock
          title="compose.yaml — wait until ACTUALLY ready"
          runnable={false}
          code={`services:
  api:
    build: .
    depends_on:
      db:
        condition: service_healthy   # ⭐ wait for the CHECK, not just the start

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: pw
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s      # run the probe every 2s
      timeout: 2s
      retries: 10       # unhealthy after 10 failures`}
          output={`$ docker compose up -d
 ✔ Container myapp-db-1   Healthy     ← waited for pg_isready to pass
 ✔ Container myapp-api-1  Started     ← only THEN did api start

no more "connection refused" race on startup ✅`}
        />
        <Callout type="mistake">
          &quot;Started&quot; ≠ &quot;ready&quot; is a classic distributed-systems lesson in
          miniature: the container running doesn&apos;t mean the database inside is accepting
          connections. <IC>depends_on</IC> alone = started; <IC>condition: service_healthy</IC> =
          ready.
        </Callout>
      </Section>

      {/* 06 ─ ENV */}
      <Section id="env" number="06" title="Environment & .env Files — Config Without Secrets in YAML">
        <P>
          Hardcoding <IC>POSTGRES_PASSWORD: pw</IC> in a file you commit is bad. Compose reads a{" "}
          <IC>.env</IC> file next to <IC>compose.yaml</IC> and substitutes variables:
        </P>
        <CodeBlock
          title=".env   (git-ignored! never committed)"
          runnable={false}
          code={`DB_PASSWORD=s3cretp4ss
API_PORT=5000`}
        />
        <CodeBlock
          title="compose.yaml — using the variables"
          runnable={false}
          code={`services:
  api:
    build: .
    ports:
      - "\${API_PORT}:5000"            # substituted from .env
    environment:
      DATABASE_URL: postgres://postgres:\${DB_PASSWORD}@db:5432/postgres

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD}`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker compose config     # ⭐ print the file with everything substituted`}
          output={`services:
  api:
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgres://postgres:s3cretp4ss@db:5432/postgres
...
← exactly what compose will run. the #1 tool for debugging YAML+env issues.`}
        />
        <Callout type="note">
          The pattern: <IC>compose.yaml</IC> is committed (structure), <IC>.env</IC> is
          git-ignored (secrets), and a committed <IC>.env.example</IC> documents which variables
          teammates must fill in. Same discipline as any twelve-factor app.
        </Callout>
      </Section>

      {/* 07 ─ DEV LOOP */}
      <Section id="dev-loop" number="07" title="The Dev Loop — Bind Mounts & Rebuilds in Compose">
        <CodeBlock
          title="compose.yaml — dev-friendly api service"
          runnable={false}
          code={`services:
  api:
    build: .
    command: python app.py --debug   # override CMD for dev
    ports:
      - "5000:5000"
    volumes:
      - .:/app                       # bind mount: live code (Volumes page!)
    depends_on:
      db:
        condition: service_healthy`}
        />
        <CodeBlock
          title="terminal — the three-speed workflow"
          runnable={false}
          code={`# code change (app.py)?          → nothing! bind mount + --debug reload it
# dependency change (requirements.txt)?
$ docker compose up -d --build       # rebuild the image, recreate the service
# follow what's happening:
$ docker compose logs -f api`}
          output={`api-1  |  * Running on http://0.0.0.0:5000
api-1  |  * Detected change in '/app/app.py', reloading ⭐
db-1   |  database system is ready to accept connections

← logs of EVERY service, interleaved and prefixed. -f follows live.`}
        />
        <Callout type="tip">
          Everything from earlier pages composes (pun intended): bind mounts for live code,
          healthchecks for ordering, named volumes for data — all declared once, started with one
          command, identical on every teammate&apos;s machine.
        </Callout>
      </Section>

      {/* 08 ─ COMMANDS */}
      <Section id="commands" number="08" title="The Daily Compose Commands">
        <Table
          head={["Command", "What it does"]}
          rows={[
            [<IC key="1">docker compose up -d</IC>, "create/update the whole stack (idempotent)"],
            [<IC key="2">docker compose up -d --build</IC>, "rebuild images first (after dep changes)"],
            [<IC key="3">docker compose down</IC>, "stop + remove containers/network (volumes survive)"],
            [<IC key="4">docker compose ps</IC>, "status of this project's services"],
            [<IC key="5">docker compose logs -f [svc]</IC>, "follow logs — all services or one"],
            [<IC key="6">docker compose exec api sh</IC>, "shell into a running service (by service name)"],
            [<IC key="7">docker compose restart api</IC>, "restart one service"],
            [<IC key="8">docker compose config</IC>, "print the final, substituted YAML"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "git clone && cd project", sub: "compose.yaml is in the repo" },
            { label: "cp .env.example .env", sub: "fill in local secrets" },
            { label: "docker compose up -d", sub: "entire stack running" },
            { label: "code · logs -f · exec", sub: "the daily loop" },
            { label: "docker compose down", sub: "end of day — data safe in volumes" },
          ]}
        />
        <Callout type="tip">
          That flow is the payoff of the whole track so far: <strong>new teammate to running
          full stack in under five minutes</strong>, on any OS, with nothing installed but Docker.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Compose =", "the whole stack declared in compose.yaml, run with one command"],
            ["docker compose up -d", "create/update everything — idempotent, only diffs"],
            ["down vs down -v", "down keeps volumes · -v DELETES data — careful"],
            ["Service name", "= container's hostname on the auto-created network"],
            ["Network & DNS", "automatic — no network create, no --network flags"],
            ["build: vs image:", "build from local Dockerfile vs pull from registry"],
            ["depends_on", "start ORDER only — 'started' is not 'ready'"],
            ["service_healthy ⭐", "depends_on + healthcheck = wait until actually ready"],
            ["Secrets", "\\${VARS} from a git-ignored .env, + committed .env.example"],
            ["docker compose config", "prints final substituted YAML — debug tool #1"],
            ["Dep changed?", "docker compose up -d --build"],
            ["Onboarding flow", "clone → cp .env.example .env → up -d. five minutes."],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
