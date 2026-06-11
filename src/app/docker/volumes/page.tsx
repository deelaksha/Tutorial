"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";

const NAV = [
  { id: "problem", label: "The Disappearing Data Problem" },
  { id: "two-kinds", label: "Volumes vs Bind Mounts ⭐" },
  { id: "named", label: "Named Volumes — Databases" },
  { id: "manage", label: "Managing Volumes" },
  { id: "bind", label: "Bind Mounts — Live Code ⭐" },
  { id: "readonly", label: "Read-Only & Multiple Mounts" },
  { id: "choose", label: "Which One When?" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerVolumesPage() {
  return (
    <TopicShell
      icon="💾"
      title="Volumes — Persistent Data"
      gradientWord="Volumes"
      subtitle="Containers are disposable; your data must not be. Two tools — named volumes and bind mounts — drawn side by side, with the two workflows they unlock: databases that survive, and code that live-reloads."
      nav={NAV}
      next={{ icon: "🌐", label: "Networking & Ports", href: "/docker/networking" }}
    >
      {/* 01 ─ PROBLEM */}
      <Section id="problem" number="01" title="The Disappearing Data Problem">
        <P>
          You&apos;ve seen this twice now: the writable layer dies with the container. Watch it
          destroy something that matters:
        </P>
        <CodeBlock
          title="terminal — the disaster, reproduced"
          runnable={false}
          code={`$ docker run -d --name db -e POSTGRES_PASSWORD=pw postgres:16
$ docker exec -it db psql -U postgres -c "CREATE TABLE users(name text);"
CREATE TABLE
$ docker exec -it db psql -U postgres -c "INSERT INTO users VALUES ('deelaksha');"
INSERT 0 1

# ...container crashes, or you upgrade postgres, or the server reboots...
$ docker rm -f db
$ docker run -d --name db -e POSTGRES_PASSWORD=pw postgres:16

$ docker exec -it db psql -U postgres -c "SELECT * FROM users;"`}
          output={`ERROR:  relation "users" does not exist        💀

the table, the data, EVERYTHING — it lived in the old container's
writable layer, and docker rm took it to the grave.`}
        />
        <Callout type="tip">
          The fix is to store data <strong>outside</strong> the container, in a place Docker keeps
          safe, and <em>mount</em> it into the container&apos;s filesystem. Container dies → data
          stays → next container mounts the same data and carries on.
        </Callout>
      </Section>

      {/* 02 ─ TWO KINDS */}
      <Section id="two-kinds" number="02" title="The Two Tools — Volumes vs Bind Mounts ⭐">
        <CodeBlock
          title="two_kinds_of_mounts.txt"
          runnable={false}
          code={`     NAMED VOLUME                          BIND MOUNT
"Docker, manage a data box for me"    "mount MY folder into the container"

 ┌─ container ────────┐               ┌─ container ────────┐
 │  /var/lib/postgresql│               │  /app              │
 │        ▲           │               │    ▲               │
 └────────┼───────────┘               └────┼───────────────┘
          │ mounted                        │ mounted
 ┌────────┴───────────┐               ┌────┴───────────────┐
 │ volume "dbdata"    │               │ ~/projects/myapp   │
 │ Docker-managed     │               │ YOUR normal folder │
 │ (/var/lib/docker/  │               │ — you edit it in   │
 │   volumes/...)     │               │   VS Code!         │
 └────────────────────┘               └────────────────────┘

 -v dbdata:/var/lib/postgresql/data    -v $(pwd):/app
    ──┬───                                ──┬───
 a NAME → named volume                 a PATH → bind mount
 best for: databases, app data         best for: live code in dev`}
        />
        <Callout type="analogy">
          🏦 A named volume is a <strong>bank vault</strong> — Docker manages it, you just use the
          name. A bind mount is a <strong>window between two rooms</strong> — your real folder and
          the container see the same files, instantly, both directions.
        </Callout>
      </Section>

      {/* 03 ─ NAMED */}
      <Section id="named" number="03" title="Named Volumes — The Database That Survives">
        <P>Same disaster scenario as section 01 — now with one extra flag:</P>
        <CodeBlock
          title="terminal — the fix"
          runnable={false}
          code={`$ docker run -d --name db \\
    -e POSTGRES_PASSWORD=pw \\
    -v dbdata:/var/lib/postgresql/data \\
    postgres:16
#      ──┬───  ──────────┬─────────────
#   volume name    where postgres keeps its files (from its docs)

$ docker exec -it db psql -U postgres -c "CREATE TABLE users(name text);"
$ docker exec -it db psql -U postgres -c "INSERT INTO users VALUES ('deelaksha');"

# 💣 kill it again
$ docker rm -f db

# new container, SAME volume:
$ docker run -d --name db -e POSTGRES_PASSWORD=pw \\
    -v dbdata:/var/lib/postgresql/data postgres:16

$ docker exec -it db psql -U postgres -c "SELECT * FROM users;"`}
          output={`   name
-----------
 deelaksha          ← 🎉 SURVIVED. the data lives in the volume,
(1 row)                containers come and go.`}
        />
        <Callout type="behind">
          First use of <IC>-v dbdata:...</IC> auto-creates the volume. Where do apps keep their
          data? It&apos;s in each image&apos;s docs: postgres →{" "}
          <IC>/var/lib/postgresql/data</IC>, mysql → <IC>/var/lib/mysql</IC>, mongo →{" "}
          <IC>/data/db</IC>.
        </Callout>
        <Callout type="tip">
          ⭐ This pattern is also how you <strong>upgrade</strong> a database:{" "}
          <IC>rm -f</IC> the postgres:16 container, start a postgres:17 one on the same volume.
          Cattle containers, vaulted data.
        </Callout>
      </Section>

      {/* 04 ─ MANAGE */}
      <Section id="manage" number="04" title="Managing Volumes">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker volume ls                # all volumes
$ docker volume create mydata     # create explicitly (run -v does it implicitly)
$ docker volume inspect dbdata    # details (incl. real path on host)
$ docker volume rm dbdata         # ☠️ delete a volume AND ITS DATA
$ docker volume prune             # delete all volumes no container references`}
          output={`$ docker volume inspect dbdata
[ { "Name": "dbdata",
    "Mountpoint": "/var/lib/docker/volumes/dbdata/_data",
    "Driver": "local" } ]
       ← the actual host directory Docker manages for you

$ docker volume rm dbdata
Error response from daemon: volume is in use - [8a2f...(container id)]
       ← protected while ANY container (even stopped) references it`}
        />
        <Callout type="mistake">
          <IC>docker rm</IC> of a container <strong>never</strong> deletes its named volumes —
          they outlive everything by design. The flip side: orphaned volumes pile up silently.
          Check with <IC>docker system df</IC>; clean with <IC>volume prune</IC> —{" "}
          <strong>carefully</strong>, prune deletes data forever.
        </Callout>
      </Section>

      {/* 05 ─ BIND */}
      <Section id="bind" number="05" title="Bind Mounts — Live Code Editing in Dev ⭐">
        <P>
          The second workflow: stop rebuilding the image on every code change. Mount your source
          folder <em>over</em> the image&apos;s copy:
        </P>
        <CodeBlock
          title="terminal — dev mode for our Flask app"
          runnable={false}
          code={`$ cd ~/projects/myapp
$ docker run -d --name dev \\
    -p 5000:5000 \\
    -v $(pwd):/app \\
    myapp:1.0 python app.py --debug
#   ───┬─────────
#   bind mount: your real folder ON TOP of the image's /app

$ curl localhost:5000
{"message": "Hello from inside a container!"}

# now edit app.py in your editor: "Hello" → "Bonjour" ... just save:
$ curl localhost:5000`}
          output={`{"message": "Bonjour from inside a container!"}   ← ⭐ no rebuild!

the container sees your edit INSTANTLY (it's literally the same file),
and Flask's --debug auto-reloader restarted the server on save.`}
        />
        <Callout type="tip">
          ⭐ This is the standard dev setup: <strong>bind mount for code + the app&apos;s own
          hot-reload</strong> (Flask --debug, nodemon, vite). Edit on your machine with your tools;
          execute in the container with prod&apos;s exact environment. Best of both worlds.
        </Callout>
        <Callout type="mistake">
          The mount <strong>covers</strong> whatever the image had at that path — including
          things you may need, like a <IC>node_modules/</IC> built into the image. Classic Node
          fix: an extra anonymous volume to &quot;hole-punch&quot; it:{" "}
          <IC>-v $(pwd):/app -v /app/node_modules</IC>.
        </Callout>
      </Section>

      {/* 06 ─ READONLY */}
      <Section id="readonly" number="06" title="Read-Only Mounts & Combining Several">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# :ro = the container can read but never write the mount
$ docker run -d --name web -p 8080:80 \\
    -v $(pwd)/site:/usr/share/nginx/html:ro \\
    nginx:1.27

$ docker exec web touch /usr/share/nginx/html/hack.txt`}
          output={`touch: cannot touch '/usr/share/nginx/html/hack.txt':
Read-only file system                  ← 🛡️ even root inside is blocked

mix-and-match is normal — one container, three mounts:
  -v $(pwd)/config:/etc/myapp:ro     bind, read-only   (config in)
  -v appdata:/var/lib/myapp          named volume      (data out)
  -v $(pwd)/logs:/var/log/myapp      bind, writable    (logs out)`}
        />
        <Callout type="note">
          <IC>:ro</IC> is cheap insurance whenever the container only needs to <em>read</em>{" "}
          (configs, static sites, certificates): a compromised or buggy app can&apos;t corrupt
          the source files.
        </Callout>
      </Section>

      {/* 07 ─ CHOOSE */}
      <Section id="choose" number="07" title="Which One When?">
        <Table
          head={["Situation", "Use", "Why"]}
          rows={[
            ["database files (postgres, mysql, mongo)", "named volume", "Docker-managed, survives everything, fast"],
            ["live-editing code during development", "bind mount", "your editor + container see the same files"],
            ["injecting a config file / certs", "bind mount :ro", "exact file from your repo, write-protected"],
            ["app-generated data in production", "named volume", "no host-path coupling, easy backup"],
            ["scratch space a container only needs while alive", "nothing!", "the writable layer is fine for throwaway files"],
          ]}
        />
        <CodeBlock
          title="decision.txt"
          runnable={false}
          code={`one-line decision rule:

  WHO owns the files?
   ├── ME, in my project folder (code, configs)   → BIND MOUNT
   └── THE APP, at runtime (db files, uploads)    → NAMED VOLUME

syntax reminder:   -v NAME:/path        → named volume
                   -v /host/path:/path  → bind mount (it's a path!)
                   append :ro           → read-only either way`}
        />
        <Callout type="behind">
          Docker decides which one you meant by the part before the colon: contains a{" "}
          <IC>/</IC> → bind mount; plain name → named volume. A typo&apos;d relative path can
          silently become an (empty) named volume — if your mount &quot;has no files&quot;, check
          this first.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Why volumes exist", "the writable layer dies with the container — data must live outside"],
            ["Named volume", "-v name:/path — Docker-managed vault, best for databases"],
            ["Bind mount", "-v /host/path:/path — your real folder, best for live code"],
            ["How Docker tells them apart", "starts with / → bind mount · plain name → volume"],
            ["Postgres pattern", "-v dbdata:/var/lib/postgresql/data — survives rm -f"],
            ["DB upgrade trick", "new container version + same volume = data carried over"],
            ["Dev loop ⭐", "bind mount code + app hot-reload = edit → save → live, no rebuild"],
            [":ro", "read-only mount — even root inside can't write it"],
            ["rm vs volumes", "docker rm NEVER deletes named volumes; only volume rm/prune does"],
            ["Mount covers image path", "bind mount hides what the image had there (node_modules trap)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
