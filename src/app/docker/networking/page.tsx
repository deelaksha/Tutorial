"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";

const NAV = [
  { id: "ports", label: "-p Port Mapping, Drawn ⭐" },
  { id: "localhost", label: "The localhost Trap ⭐" },
  { id: "bridge", label: "The Default Bridge Network" },
  { id: "user-networks", label: "User Networks + DNS ⭐" },
  { id: "two-containers", label: "App ↔ Database, Wired" },
  { id: "inspect-debug", label: "Inspect & Debug" },
  { id: "other-drivers", label: "host · none — Other Drivers" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerNetworkingPage() {
  return (
    <TopicShell
      icon="🌐"
      title="Networking & Ports"
      gradientWord="Networking"
      subtitle="Why -p 8080:80 works, why localhost betrays you inside a container, and the one feature that makes multi-container apps click: containers on the same network find each other BY NAME."
      nav={NAV}
      next={{ icon: "🧩", label: "Docker Compose", href: "/docker/compose" }}
    >
      {/* 01 ─ PORTS */}
      <Section id="ports" number="01" title="-p Port Mapping, Finally Drawn ⭐">
        <P>
          Each container gets its own isolated network stack — its own IP, its own ports. Nothing
          inside is reachable from your machine until you <strong>publish</strong> a port:
        </P>
        <CodeBlock
          title="port_mapping.txt"
          runnable={false}
          code={`            -p 8080:80   reads as   HOST:CONTAINER

  YOUR LAPTOP (host)
 ┌────────────────────────────────────────────────┐
 │  browser → localhost:8080                      │
 │                 │                              │
 │            port 8080 (host)                    │
 │                 │ docker forwards              │
 │                 ▼                              │
 │   ┌─ container "web" ──────────┐               │
 │   │  port 80                   │               │
 │   │  nginx listening on 80     │               │
 │   │  own IP: 172.17.0.2        │               │
 │   └────────────────────────────┘               │
 └────────────────────────────────────────────────┘

 -p 8080:80     host 8080 → container 80   (the usual)
 -p 80:80       same number both sides is fine too
 -p 5432:5432 -p 8080:80     several mappings, one container
 -P             auto-publish every EXPOSEd port to random host ports`}
        />
        <Callout type="mistake">
          The order trips everyone: <strong>HOST first, CONTAINER second</strong> — &quot;outside:
          inside&quot;. <IC>-p 80:8080</IC> and <IC>-p 8080:80</IC> are very different commands.
          And if the host port is taken you&apos;ll see{" "}
          <IC>bind: address already in use</IC> — pick another host port; the container side
          stays whatever the app listens on.
        </Callout>
      </Section>

      {/* 02 ─ LOCALHOST */}
      <Section id="localhost" number="02" title="The localhost Trap ⭐">
        <P>
          The single most common Docker networking bug. Inside a container,{" "}
          <IC>localhost</IC> means <em>that container</em> — not your laptop, not other
          containers:
        </P>
        <CodeBlock
          title="localhost_trap.txt"
          runnable={false}
          code={`   ┌─ container "api" ──────┐      ┌─ container "db" ───────┐
   │                        │      │                        │
   │  connect("localhost")  │  ✗   │  postgres on port 5432 │
   │     = MYSELF. there's  │ ───▶ │                        │
   │     no postgres here!  │      │                        │
   └────────────────────────┘      └────────────────────────┘

 each box has its OWN localhost. three different "localhost"s here:
   • on your laptop      → the laptop
   • inside api          → api only
   • inside db           → db only

 so how DOES api reach db?  → next sections: a shared network + db's NAME`}
        />
        <Callout type="mistake">
          The symptom: app works on your machine, then in a container dies with{" "}
          <IC>Connection refused: localhost:5432</IC>. The app is connecting to{" "}
          <em>itself</em> looking for a database that lives elsewhere. Fix = connect to the other
          container&apos;s <strong>name</strong> (§04), never <IC>localhost</IC>.
        </Callout>
        <Callout type="note">
          Escape hatch for dev: <IC>host.docker.internal</IC> is a special DNS name that points
          from inside a container to your host machine (built into Docker Desktop; on Linux add{" "}
          <IC>--add-host=host.docker.internal:host-gateway</IC>).
        </Callout>
      </Section>

      {/* 03 ─ BRIDGE */}
      <Section id="bridge" number="03" title="The Default Bridge — Where Containers Land">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker network ls`}
          output={`NETWORK ID     NAME      DRIVER    SCOPE
9f8e7d6c5b4a   bridge    bridge    local     ← the default — every container
b1a2c3d4e5f6   host      host      local        joins this unless told otherwise
0a1b2c3d4e5f   none      null      local

the default "bridge" is a virtual switch:

      ┌──────────┐   ┌──────────┐   ┌──────────┐
      │ web      │   │ api      │   │ db       │
      │172.17.0.2│   │172.17.0.3│   │172.17.0.4│
      └────┬─────┘   └────┬─────┘   └────┬─────┘
      ─────┴──────────────┴──────────────┴─────  docker0 bridge
                          │
                     your host NIC → internet ✅ (outbound just works)`}
        />
        <Callout type="mistake">
          Containers on the default bridge can reach each other <strong>only by IP</strong> — and
          container IPs change on every restart, so hardcoding <IC>172.17.0.4</IC> breaks
          tomorrow. The default bridge has <strong>no name-based discovery</strong>. That&apos;s
          why real setups always create their own network — next section.
        </Callout>
      </Section>

      {/* 04 ─ USER NETWORKS */}
      <Section id="user-networks" number="04" title="User-Defined Networks — Containers Find Each Other BY NAME ⭐">
        <P>
          Create your own network and Docker adds the killer feature: <strong>built-in DNS</strong>.
          Every container&apos;s name becomes a hostname on that network:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker network create mynet
$ docker run -d --name db  --network mynet -e POSTGRES_PASSWORD=pw postgres:16
$ docker run -d --name api --network mynet myapp:1.0

# from inside api, the hostname "db" simply works:
$ docker exec -it api python -c "import socket; print(socket.gethostbyname('db'))"`}
          output={`172.18.0.2          ← Docker's internal DNS resolved the NAME "db"
                       to the db container's current IP. restart db, IP
                       changes, the NAME still resolves. ⭐

so in your app's config:
  ❌ DATABASE_URL=postgres://postgres:pw@localhost:5432/postgres
  ✅ DATABASE_URL=postgres://postgres:pw@db:5432/postgres
                                          ─┬─
                              the container NAME as hostname`}
        />
        <Callout type="analogy">
          📞 The default bridge is a party where nobody wears name tags — you must memorize
          seat numbers (IPs) that reshuffle hourly. A user-defined network hands out{" "}
          <strong>name tags</strong>: just call out &quot;db!&quot; and the right container
          answers, wherever it&apos;s sitting.
        </Callout>
        <Callout type="tip">
          ⭐ Burn this in: <strong>same user-defined network → reachable by container name</strong>.
          It&apos;s the foundation Compose is built on — there, <IC>db</IC>, <IC>redis</IC>,{" "}
          <IC>api</IC> resolve automatically because Compose makes such a network for you.
        </Callout>
      </Section>

      {/* 05 ─ TWO CONTAINERS */}
      <Section id="two-containers" number="05" title="App ↔ Database — The Full Wiring, End to End">
        <CodeBlock
          title="the_full_picture.txt"
          runnable={false}
          code={`  YOUR LAPTOP
 ┌───────────────────────────────────────────────────────────┐
 │ browser ──▶ localhost:5000                                │
 │                  │  -p 5000:5000  (published: world → api)│
 │   ┌──────────────▼──────────── network "mynet" ────────┐  │
 │   │  ┌─ api ──────────┐         ┌─ db ──────────────┐  │  │
 │   │  │ flask :5000    │ ──────▶ │ postgres :5432    │  │  │
 │   │  └────────────────┘ "db":   └───────────────────┘  │  │
 │   │                     5432                           │  │
 │   └─────────────────────────────────────────────────── ┘  │
 └───────────────────────────────────────────────────────────┘

 ⭐ note: db has NO -p flag. the browser can't reach it — only
    containers on mynet can. your database is not on the internet. 🛡️`}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker network create mynet
$ docker run -d --name db --network mynet \\
    -e POSTGRES_PASSWORD=pw postgres:16          # ← no -p: internal only
$ docker run -d --name api --network mynet \\
    -p 5000:5000 \\
    -e DATABASE_URL=postgres://postgres:pw@db:5432/postgres \\
    myapp:1.0

$ curl localhost:5000/users
{"users": ["deelaksha"]}      🎉 browser → api → db, fully wired`}
        />
        <Callout type="tip">
          The security pattern is free: <strong>publish only the front door</strong> (<IC>-p</IC>{" "}
          on the api), keep databases unpublished — reachable by other containers, invisible to
          the network. Exposing port 5432 publicly is how databases end up on hacker news.
        </Callout>
      </Section>

      {/* 06 ─ INSPECT/DEBUG */}
      <Section id="inspect-debug" number="06" title="Inspect & Debug — When Packets Won't Flow">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker network inspect mynet      # who's on this network? what IPs?
$ docker port api                   # what's published on this container?
$ docker exec -it api sh            # then test from INSIDE:`}
          output={`$ docker network inspect mynet
"Containers": {
   "8a2f...": { "Name": "db",  "IPv4Address": "172.18.0.2/16" },
   "3c4d...": { "Name": "api", "IPv4Address": "172.18.0.3/16" }
}
$ docker port api
5000/tcp -> 0.0.0.0:5000

# inside the api container — the debugging ladder:
/app # getent hosts db              # 1️⃣ does the NAME resolve?
172.18.0.2      db
/app # python -c "import socket; socket.create_connection(('db',5432)); print('open')"
open                                # 2️⃣ does the PORT answer?`}
        />
        <Table
          head={["Symptom", "Likely cause", "Check"]}
          rows={[
            ["name doesn't resolve", "containers on different networks (or default bridge)", "docker network inspect — both listed?"],
            ["resolves, connection refused", "app inside listening on 127.0.0.1, or wrong port", "its Dockerfile/docs: bind 0.0.0.0"],
            ["works in container, not from laptop", "no -p, or wrong order (container:host)", "docker port NAME"],
            ["bind: address already in use", "host port taken by something else", "change the HOST side of -p"],
          ]}
        />
      </Section>

      {/* 07 ─ OTHER DRIVERS */}
      <Section id="other-drivers" number="07" title="host · none — The Other Drivers">
        <Table
          head={["Network", "What it does", "When"]}
          rows={[
            [<IC key="b">bridge (user-defined)</IC>, "isolated switch + name-based DNS", "⭐ the default choice for everything"],
            [<IC key="h">--network host</IC>, "NO isolation — container uses the host's network directly (no -p needed, Linux only)", "max performance, or apps needing raw host networking"],
            [<IC key="n">--network none</IC>, "no network at all — fully sealed box", "batch jobs, security-sensitive processing"],
          ]}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker run -d --network host nginx     # nginx directly on host port 80
$ docker run --rm --network none alpine ping -c1 google.com`}
          output={`$ docker run --rm --network none alpine ping -c1 google.com
ping: bad address 'google.com'     ← sealed. no DNS, no packets, nothing.`}
        />
        <Callout type="note">
          You&apos;ll use user-defined bridges 95% of the time. Just recognize the other two so
          server configs don&apos;t surprise you.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["-p 8080:80", "HOST:CONTAINER — outside first, inside second"],
            ["No -p?", "nothing on the host can reach the container's ports"],
            ["localhost in a container", "= that container ITSELF — never your laptop, never other containers"],
            ["Reach the host from inside", "host.docker.internal (dev escape hatch)"],
            ["Default bridge", "IP-only, no name discovery — don't build on it"],
            ["User-defined network ⭐", "docker network create X → containers resolve each other BY NAME"],
            ["DB connection string", "@db:5432 (container name), not @localhost:5432"],
            ["Security freebie", "publish the front door only — no -p on databases"],
            ["Debug ladder", "name resolves? → port answers? → published correctly?"],
            ["host / none drivers", "host = no isolation (Linux) · none = sealed box"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
