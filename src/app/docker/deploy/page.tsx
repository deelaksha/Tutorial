"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "big-picture", label: "The Ship-It Pipeline ⭐" },
  { id: "push", label: "tag & push to Docker Hub" },
  { id: "server-run", label: "Pull & Run on the Server" },
  { id: "restart", label: "Restart Policies" },
  { id: "prod-compose", label: "Production compose.yaml" },
  { id: "update", label: "Shipping an Update" },
  { id: "hygiene", label: "Server Hygiene & Logs" },
  { id: "cheatsheet", label: "🗺️ The Giant Cheat Sheet" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerDeployPage() {
  return (
    <TopicShell
      icon="☁️"
      title="Registry & Deploy — End to End"
      gradientWord="Deploy"
      subtitle="The final mile: push your image to a registry, pull it on a server, keep it alive with restart policies, and ship updates by swapping tags. Plus the all-commands cheat sheet for the whole track."
      nav={NAV}
      next={{ icon: "🐳", label: "Back to all Docker topics", href: "/docker" }}
    >
      {/* 01 ─ BIG PICTURE */}
      <Section id="big-picture" number="01" title="The Ship-It Pipeline — How Images Travel ⭐">
        <P>
          You never copy code to a server again. The <strong>image</strong> is the deployment
          artifact, and the <strong>registry</strong> is how it travels:
        </P>
        <CodeBlock
          title="pipeline.txt"
          runnable={false}
          code={`  YOUR LAPTOP                 REGISTRY                  THE SERVER
                            (Docker Hub)
 ┌─────────────┐   push    ┌─────────────┐   pull    ┌─────────────┐
 │ docker build│ ────────▶ │ deelaksha/  │ ────────▶ │ docker run  │
 │ myapp:1.0   │           │ myapp:1.0   │           │ myapp:1.0   │
 └─────────────┘           └─────────────┘           └─────────────┘
   "it works here"           layers stored             bit-for-bit the
                             & versioned               SAME thing runs ⭐

 the EXACT bytes you tested are the bytes in production.
 no "but the server has a different python" — the image IS the environment.`}
        />
        <DockerFlow initial="push" />
        <Callout type="note">
          Docker Hub is the default, but the workflow is identical for GitHub Container Registry
          (<IC>ghcr.io</IC>), AWS ECR, Google Artifact Registry, or a self-hosted one — only the
          image name&apos;s prefix changes.
        </Callout>
      </Section>

      {/* 02 ─ PUSH */}
      <Section id="push" number="02" title="tag & push — Publishing Your Image">
        <P>
          Registries are namespaced by username — so your local <IC>myapp:1.0</IC> needs a second
          name, <IC>username/myapp:1.0</IC>, before Hub will accept it:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker login                              # once (free account on hub.docker.com)
$ docker tag myapp:1.0 deelaksha/myapp:1.0  # add the namespaced name
$ docker push deelaksha/myapp:1.0`}
          output={`The push refers to repository [docker.io/deelaksha/myapp]
5f70bf18a086: Pushed              ← your code + deps layers: uploaded
a3ed95caeb02: Mounted from library/python   ← ⭐ base layers Hub ALREADY has:
e2eb06d8af82: Mounted from library/python      not re-uploaded. layers again!
1.0: digest: sha256:9b8e7f6a... size: 1573

→ anyone (or any server) can now: docker pull deelaksha/myapp:1.0`}
        />
        <Callout type="behind">
          <IC>docker tag</IC> copies nothing — it adds a second name pointing at the same image ID
          (like a git branch on a commit). And notice <IC>Mounted from library/python</IC>: the
          registry deduplicates layers exactly like your disk does.
        </Callout>
        <Callout type="mistake">
          Public Hub repos are <strong>public</strong> — every layer readable by anyone. Before
          pushing, re-check the Dockerfile page rule: no <IC>.env</IC>, no keys, no tokens ever
          COPYed in. (Private repos exist, but the discipline should hold anyway.)
        </Callout>
      </Section>

      {/* 03 ─ SERVER RUN */}
      <Section id="server-run" number="03" title="Pull & Run on the Server">
        <CodeBlock
          title="terminal — on the server (any Linux box with Docker)"
          runnable={false}
          code={`$ ssh me@myserver.com
me@server $ docker pull deelaksha/myapp:1.0
me@server $ docker run -d --name api \\
    -p 80:5000 \\
    -e DATABASE_URL=postgres://postgres:pw@db:5432/postgres \\
    --restart unless-stopped \\
    deelaksha/myapp:1.0`}
          output={`1.0: Pulling from deelaksha/myapp
Status: Downloaded newer image for deelaksha/myapp:1.0
f7e6d5c4b3a2...

$ curl http://myserver.com/
{"message": "Hello from inside a container!"}     🌍 LIVE ON THE INTERNET

what you did NOT do on this server:
  ✗ install python        ✗ install pip packages
  ✗ copy code             ✗ configure anything
  the image carried it all.`}
        />
        <Callout type="tip">
          <IC>-p 80:5000</IC> — host port 80 (what browsers hit) to the container&apos;s 5000.
          Same flag as day one, now doing production duty. (Real setups put a reverse proxy like
          nginx/caddy/traefik on 80/443 for HTTPS — same pattern, one more container.)
        </Callout>
      </Section>

      {/* 04 ─ RESTART */}
      <Section id="restart" number="04" title="Restart Policies — Surviving Crashes & Reboots">
        <P>
          A laptop container that dies is an oops; a production container that stays dead is an
          outage. The <IC>--restart</IC> flag makes the daemon your night-shift operator:
        </P>
        <Table
          head={["Policy", "Crash?", "Server reboot?", "You ran docker stop?"]}
          rows={[
            [<IC key="no">no (default)</IC>, "stays dead", "stays dead", "stays stopped"],
            [<IC key="oc">on-failure[:5]</IC>, "restarts (≤5 tries)", "stays dead", "stays stopped"],
            [<IC key="us">unless-stopped ⭐</IC>, "restarts", "comes back up", "stays stopped (respects you)"],
            [<IC key="al">always</IC>, "restarts", "comes back up", "comes back on daemon restart!"],
          ]}
        />
        <CodeBlock
          title="terminal — watching it work"
          runnable={false}
          code={`$ docker run -d --name api --restart unless-stopped deelaksha/myapp:1.0
$ docker exec api kill 1        # 💣 murder the main process (simulate a crash)
$ sleep 2 && docker ps --filter name=api`}
          output={`CONTAINER ID   IMAGE                 STATUS         NAMES
f7e6d5c4b3a2   deelaksha/myapp:1.0   Up 2 seconds   api
                                     ─────┬──────
                          back already — the daemon restarted it ⭐

(a crash-LOOPING container shows "Restarting (1) 3 seconds ago" in
 docker ps — that's your cue to read docker logs, not to restart harder.)`}
        />
        <Callout type="tip">
          ⭐ Default for everything serious: <IC>unless-stopped</IC> — survives crashes and
          reboots, but still respects a deliberate <IC>docker stop</IC>. This plus healthchecks is
          90% of &quot;keeping it alive&quot; before you need real orchestrators (Kubernetes).
        </Callout>
      </Section>

      {/* 05 ─ PROD COMPOSE */}
      <Section id="prod-compose" number="05" title="Production compose.yaml — The Full Stack, Deployed">
        <P>
          Real servers run Compose too. The same file as last page, with production switches —
          this is a complete, deployable stack:
        </P>
        <CodeBlock
          title="compose.yaml  (on the server)"
          runnable={false}
          code={`services:
  api:
    image: deelaksha/myapp:1.0      # ⭐ pull the pushed image — no build: in prod
    ports:
      - "80:5000"
    environment:
      DATABASE_URL: postgres://postgres:\${DB_PASSWORD}@db:5432/postgres
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - dbdata:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10
      # ⭐ note: NO ports: on db — internal only, invisible to the internet

volumes:
  dbdata:`}
          output={`me@server $ docker compose up -d
 ✔ Container app-db-1   Healthy
 ✔ Container app-api-1  Started

the whole track in one file: images (pushed), networking (service DNS,
front door only), volumes (data survives), healthchecks, restart policies. 🧩`}
        />
        <Callout type="note">
          The dev/prod difference is tiny and deliberate: dev uses <IC>build: .</IC> + bind mounts
          + <IC>--debug</IC>; prod uses a pushed <IC>image:</IC> + no mounts +{" "}
          <IC>restart:</IC>. Compose supports splitting these into override files
          (<IC>compose.override.yaml</IC>) when you&apos;re ready.
        </Callout>
      </Section>

      {/* 06 ─ UPDATE */}
      <Section id="update" number="06" title="Shipping an Update — The Loop You'll Repeat Forever">
        <CodeBlock
          title="terminal — version 1.1 goes live"
          runnable={false}
          code={`# on your laptop:
$ docker build -t deelaksha/myapp:1.1 .       # new code, new tag
$ docker push deelaksha/myapp:1.1

# on the server: edit compose.yaml →  image: deelaksha/myapp:1.1
$ docker compose up -d`}
          output={`[+] Running 2/2
 ✔ Container app-db-1   Running        ← untouched (its config didn't change)
 ✔ Container app-api-1  Recreated      ← old container out, 1.1 in

seconds of downtime, one-line change. and because images are immutable:

ROLLBACK = edit the tag back to 1.0 → docker compose up -d. that's it. ⭐`}
        />
        <Callout type="tip">
          ⭐ Version tags (<IC>1.0</IC>, <IC>1.1</IC>) are what make rollback trivial — every
          version still sits in the registry, runnable forever. This is why the Images page said
          &quot;never deploy <IC>:latest</IC>&quot;: you can&apos;t roll back to a tag that
          silently moved.
        </Callout>
        <Callout type="behind">
          CI/CD is just this loop automated: push to GitHub → Actions runs{" "}
          <IC>build</IC> + <IC>push</IC> → server pulls the new tag. The commands are exactly the
          ones you now know — a robot types them instead of you.
        </Callout>
      </Section>

      {/* 07 ─ HYGIENE */}
      <Section id="hygiene" number="07" title="Server Hygiene — Disk, Logs, Health">
        <CodeBlock
          title="terminal — the monthly five minutes"
          runnable={false}
          code={`$ docker system df               # where is the disk going?
$ docker image prune -a          # old image versions pile up after updates!
$ docker logs --tail 100 -t app-api-1     # spot-check the app
$ docker stats --no-stream       # anyone eating CPU/RAM?`}
          output={`$ docker system df
TYPE      TOTAL   ACTIVE   SIZE     RECLAIMABLE
Images    9       2        3.8GB    3.1GB (81%)   ← 1.0, 1.1, 1.2... add up
Containers 2      2        12MB     0B
Local Volumes 1   1        420MB    0B

$ docker image prune -a
Total reclaimed space: 3.1GB     🧹 (active images are never touched)`}
        />
        <Callout type="mistake">
          The classic 3am production incident: <strong>disk full of old image versions</strong>{" "}
          after months of updates. <IC>docker image prune -a</IC> on a schedule prevents it. Also
          cap log growth in compose: <IC>logging: {"{"} options: {"{"} max-size: &quot;10m&quot;,
          max-file: &quot;3&quot; {"}"} {"}"}</IC> — container logs grow forever by default.
        </Callout>
      </Section>

      {/* 08 ─ CHEAT SHEET */}
      <Section id="cheatsheet" number="08" title="🗺️ The Giant Cheat Sheet — The Whole Track">
        <CodeBlock
          title="docker_cheatsheet.txt"
          runnable={false}
          code={`── IMAGES ──────────────────────────────────────────────────
docker pull IMG:TAG              download from registry
docker images                    list local images
docker history IMG               layer-by-layer x-ray
docker rmi IMG                   delete image
docker build -t name:tag .       build from Dockerfile
docker tag SRC USER/NAME:TAG     add registry name
docker push USER/NAME:TAG        upload to registry

── CONTAINERS ──────────────────────────────────────────────
docker run -d --name X -p H:C IMG    create + start (server)
docker run -it --rm IMG sh           throwaway interactive shell
docker ps  /  ps -a                  running / ALL containers
docker logs -f X                     follow stdout/stderr
docker exec -it X sh                 shell into a RUNNING container
docker stop X / start X / restart X  lifecycle
docker rm X   /  rm -f X             delete (stopped / force-running)
docker stats --no-stream             CPU/RAM snapshot
docker cp X:/path ./                 copy files out/in

── DATA & NETWORK ──────────────────────────────────────────
-v name:/path                    named volume (databases)
-v $(pwd):/path                  bind mount (live code)  · append :ro
docker volume ls / inspect / rm / prune
docker network create NET        user network → DNS by container name
--network NET                    join it · -p HOST:CONTAINER to publish

── COMPOSE (in the project folder) ─────────────────────────
docker compose up -d [--build]   create/update the stack
docker compose down [-v]         tear down (-v also deletes volumes ☠️)
docker compose ps / logs -f / exec SVC sh / restart SVC
docker compose config            final YAML after .env substitution

── CLEANUP ─────────────────────────────────────────────────
docker system df                 disk usage report
docker container prune           delete all stopped containers
docker image prune [-a]          dangling [all unused] images
docker system prune              the big broom (read its prompt!)`}
        />
        <Callout type="tip">
          Bookmark this section — it&apos;s the whole course compressed. If a command here feels
          unfamiliar, its page is one click up the breadcrumb.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["The artifact", "you deploy IMAGES, never code — registry moves them"],
            ["Publish flow", "build → tag USER/NAME:TAG → push"],
            ["docker tag", "adds a name to the same image — copies nothing"],
            ["Server flow", "pull → compose up -d. no python, no pip, no setup"],
            ["Registry dedup", "'Mounted from' = base layers never re-uploaded"],
            ["--restart unless-stopped ⭐", "survives crashes + reboots, respects manual stop"],
            ["Prod compose", "image: (not build:) · restart: · healthcheck · no ports: on db"],
            ["Update", "push new tag → edit compose → up -d (recreates only changes)"],
            ["Rollback", "edit the tag back → up -d. immutable images make it trivial"],
            ["Never deploy :latest", "a moved tag is a rollback you can't make"],
            ["Disk-full incident", "old images pile up — schedule docker image prune -a"],
            ["CI/CD", "= this exact loop, typed by a robot"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
