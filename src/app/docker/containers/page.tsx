"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "lifecycle", label: "The Lifecycle Map ⭐" },
  { id: "run-name", label: "run — Detached & Named" },
  { id: "ps", label: "ps — Run It Constantly" },
  { id: "logs", label: "logs — The Container's stdout" },
  { id: "exec", label: "exec — A Shell Inside ⭐" },
  { id: "stop-start", label: "stop · start · restart" },
  { id: "rm", label: "rm — Throw It Away" },
  { id: "stats-cp", label: "stats · cp — Quick Tools" },
  { id: "workflow", label: "The Daily Loop, End to End" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerContainersPage() {
  return (
    <TopicShell
      icon="🚢"
      title="Container Lifecycle"
      gradientWord="Lifecycle"
      subtitle="run · ps · logs · exec · stop · rm — the handful of commands you'll type every single day, organized around one state diagram. Learn the map once and every command is just an arrow on it."
      nav={NAV}
      next={{ icon: "📜", label: "Dockerfile — Build Your Own", href: "/docker/dockerfile" }}
    >
      {/* 01 ─ LIFECYCLE */}
      <Section id="lifecycle" number="01" title="The Lifecycle Map — Every Command Is an Arrow ⭐">
        <CodeBlock
          title="lifecycle.txt"
          runnable={false}
          code={`                         docker run
        ┌────────────────────────────────────────────┐
        │                                            ▼
   ┌─────────┐      docker create   ┌─────────┐  docker start   ┌─────────┐
   │  IMAGE  │ ───────────────────▶ │ CREATED │ ──────────────▶ │ RUNNING │
   └─────────┘                      └─────────┘                 └────┬────┘
                                                  docker stop ▲      │
                                                  (or process │      │
        ┌─────────┐     docker rm                  exits)     │      ▼
        │ DELETED │ ◀──────────────────────────────────┌───────────┐
        └─────────┘                                    │  STOPPED  │
              ▲                                        │ (Exited)  │
              └── docker rm -f ── (RUNNING, forced) ───└───────────┘
                                                       docker start ↻ (back to RUNNING)

 docker run  = create + start in one step (what you almost always use)
 stopped containers keep their writable layer → restartable, data intact
 ONLY docker rm destroys the container (and its writable layer) forever`}
        />
        <Callout type="tip">
          ⭐ Stopped ≠ deleted. A stopped container is a paused machine you can{" "}
          <IC>start</IC> again with all its files intact. Deletion only happens when YOU say{" "}
          <IC>rm</IC> (or used <IC>--rm</IC>).
        </Callout>
      </Section>

      {/* 02 ─ RUN */}
      <Section id="run-name" number="02" title="run — Detached & Named, the Real-World Form">
        <P>
          From here on we&apos;ll keep one real container running as our lab rat — an nginx web
          server:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker run -d --name web -p 8080:80 nginx:1.27`}
          output={`Unable to find image 'nginx:1.27' locally
1.27: Pulling from library/nginx
Status: Downloaded newer image for nginx:1.27
e4b2c1f09a8d7...        ← detached mode prints the ID and returns your terminal

→ http://localhost:8080 now serves the nginx welcome page 🎉`}
        />
        <Callout type="mistake">
          Run the same command twice and you get{" "}
          <IC>Conflict. The container name &quot;/web&quot; is already in use</IC> — names are
          unique, and the OLD stopped container still owns it. Fix:{" "}
          <IC>docker rm web</IC> first, or pick a new name. This error will greet you weekly;
          now you know why.
        </Callout>
      </Section>

      {/* 03 ─ PS */}
      <Section id="ps" number="03" title="docker ps — Run It Constantly, It's Free">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker ps              # running only
$ docker ps -a           # + stopped (the full truth)
$ docker ps -q           # just IDs (for scripting: docker stop $(docker ps -q))`}
          output={`$ docker ps
CONTAINER ID   IMAGE        STATUS         PORTS                  NAMES
e4b2c1f09a8d   nginx:1.27   Up 2 minutes   0.0.0.0:8080->80/tcp   web

read the STATUS column like a doctor:
  Up 2 minutes              healthy, running
  Exited (0) 5 minutes ago  finished NORMALLY (exit code 0)
  Exited (1) 5 minutes ago  💥 CRASHED — exit code ≠ 0, go read the logs
  Restarting (1) ...        💥💥 crash-looping under a restart policy`}
        />
        <Callout type="tip">
          The exit code in <IC>Exited (N)</IC> is the main process&apos;s exit code — same
          convention as every shell: 0 = success, anything else = failure. It&apos;s your first
          diagnostic, before even reading logs.
        </Callout>
      </Section>

      {/* 04 ─ LOGS */}
      <Section id="logs" number="04" title="docker logs — The Container's stdout, Recorded">
        <P>
          A detached container&apos;s output doesn&apos;t vanish — Docker records everything the
          main process prints, fetchable any time:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker logs web            # everything so far
$ docker logs -f web         # follow live (Ctrl+C to detach — container keeps running)
$ docker logs --tail 20 web  # last 20 lines
$ docker logs -t web         # with timestamps`}
          output={`192.168.1.5 - - [11/Jun/2026:10:30:01 +0000] "GET / HTTP/1.1" 200 615
192.168.1.5 - - [11/Jun/2026:10:30:02 +0000] "GET /favicon.ico HTTP/1.1" 404 153

← every request nginx served. for a crashed container,
   the LAST lines are almost always the stack trace you need.`}
        />
        <Callout type="behind">
          Containerized apps log to <strong>stdout/stderr</strong>, not to files — that&apos;s the
          convention. Docker captures the streams and stores them as JSON on the host. It&apos;s
          why <IC>print()</IC>/<IC>console.log</IC> is genuinely the right way to log in a
          container.
        </Callout>
        <Callout type="tip">
          Debugging ritual, in order: <IC>docker ps -a</IC> (did it exit? what code?) →{" "}
          <IC>docker logs name</IC> (what did it say before dying?). This solves most container
          mysteries without anything fancier.
        </Callout>
      </Section>

      {/* 05 ─ EXEC */}
      <Section id="exec" number="05" title="docker exec — Open a Shell Inside Anything ⭐">
        <P>
          <IC>exec</IC> runs an <em>extra</em> process inside an already-running container. With{" "}
          <IC>-it bash</IC>, that process is your shell — you&apos;re standing inside the box:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker exec -it web bash`}
          output={`root@e4b2c1f09a8d:/# ls /usr/share/nginx/html
50x.html  index.html                  ← the files nginx is serving

root@e4b2c1f09a8d:/# echo "<h1>hacked by me</h1>" > /usr/share/nginx/html/index.html
root@e4b2c1f09a8d:/# exit

→ refresh http://localhost:8080 — your text! you live-edited
   a running container. (and one-off, no shell needed:)

$ docker exec web nginx -v
nginx version: nginx/1.27.0
$ docker exec web cat /etc/nginx/nginx.conf | head -3
user  nginx;
worker_processes  auto;`}
        />
        <Table
          head={["run vs exec", "What it does"]}
          rows={[
            [<IC key="r">docker run -it IMG bash</IC>, "NEW container whose main process is your shell"],
            [<IC key="e">docker exec -it CTR bash</IC>, "extra shell inside an EXISTING running container"],
          ]}
        />
        <Callout type="mistake">
          <IC>exec</IC> needs a <strong>running</strong> container — on a stopped one you get{" "}
          <IC>container ... is not running</IC>. And unlike the main process, exiting an exec
          shell never stops the container. Also: slim images may lack <IC>bash</IC> — try{" "}
          <IC>sh</IC>, which always exists.
        </Callout>
      </Section>

      {/* 06 ─ STOP/START */}
      <Section id="stop-start" number="06" title="stop · start · restart — Pause and Resume">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker stop web      # polite: SIGTERM, 10s grace, then SIGKILL
$ docker start web     # bring a stopped container back (same files!)
$ docker restart web   # stop + start (the classic "turn it off and on")
$ docker kill web      # impatient: SIGKILL immediately`}
          output={`$ docker stop web
web
$ docker ps -a --filter name=web
CONTAINER ID   IMAGE        STATUS                      NAMES
e4b2c1f09a8d   nginx:1.27   Exited (0) 10 seconds ago   web

$ docker start web
web                       ← same container, same writable layer —
                             your "hacked" index.html is still there ✅`}
        />
        <Callout type="behind">
          <IC>stop</IC> sends <strong>SIGTERM</strong> (&quot;please shut down cleanly&quot;),
          waits 10 seconds, then <strong>SIGKILL</strong>. Well-behaved servers (nginx, postgres)
          use the grace period to finish requests and flush data — which is why{" "}
          <IC>stop</IC> is right and <IC>kill</IC> is the last resort.
        </Callout>
      </Section>

      {/* 07 ─ RM */}
      <Section id="rm" number="07" title="docker rm — Throw the Container Away">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker rm web              # delete a STOPPED container
$ docker rm -f web           # force: stop + delete a RUNNING one
$ docker container prune     # delete ALL stopped containers
$ docker rm -f $(docker ps -aq)   # ☢️ wipe every container on the machine`}
          output={`$ docker rm web
Error response from daemon: cannot remove container "web":
container is running: stop the container before removing or force remove

$ docker rm -f web
web                         ← stopped AND deleted. writable layer gone.
                               the nginx:1.27 IMAGE is still on disk —
                               docker run can recreate "web" in 1 second.`}
        />
        <Callout type="analogy">
          🐄 The container mindset: <strong>cattle, not pets</strong>. You never nurse a sick
          container back to health — you <IC>rm</IC> it and <IC>run</IC> a fresh one from the
          image. Anything that must survive that (data!) belongs in a volume — next-next page.
        </Callout>
      </Section>

      {/* 08 ─ STATS/CP */}
      <Section id="stats-cp" number="08" title="stats · cp — Two Quick Tools Worth Knowing">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker stats --no-stream       # CPU/RAM right now (like 'top' for containers)
$ docker cp web:/etc/nginx/nginx.conf ./nginx.conf   # copy OUT of a container
$ docker cp ./index.html web:/usr/share/nginx/html/  # copy INTO a container`}
          output={`$ docker stats --no-stream
CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT   MEM %
e4b2c1f09a8d   web    0.02%   8.2MiB / 7.6GiB     0.11%

← 8 MB for a full web server. THIS is why containers beat VMs
   for density: a VM idles at hundreds of MB.`}
        />
        <Callout type="note">
          <IC>docker cp</IC> is for inspection and quick hacks. For real workflows (live code
          editing, config injection) the proper tool is a <strong>bind mount</strong> — Volumes
          page, two stops ahead.
        </Callout>
      </Section>

      {/* 09 ─ WORKFLOW */}
      <Section id="workflow" number="09" title="The Daily Loop, End to End">
        <P>
          First, see everything <IC>docker run</IC> actually wires together — image, container,
          network, volume — in motion:
        </P>
        <DockerFlow initial="run" />
        <CodeBlock
          title="terminal — a real 2-minute postgres session"
          runnable={false}
          code={`$ docker run -d --name db -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
$ docker ps                                   # Up ✅
$ docker logs db --tail 1                     # "ready to accept connections" ✅
$ docker exec -it db psql -U postgres         # a SQL prompt INSIDE the container
postgres=# CREATE TABLE users(id int);
CREATE TABLE
postgres=# \\q
$ docker rm -f db                             # experiment over, machine clean 🧹`}
        />
        <Callout type="tip">
          Five commands cover ~95% of daily container work: <IC>run</IC>, <IC>ps</IC>,{" "}
          <IC>logs</IC>, <IC>exec</IC>, <IC>rm</IC>. Everything else is seasoning.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Lifecycle", "created → running → stopped → deleted (rm only!)"],
            ["docker run", "= create + start. -d server · -it shell · --name always"],
            ["Stopped ≠ deleted", "files intact, docker start resumes it"],
            ["docker ps -a", "the full truth — stopped containers hide from plain ps"],
            ["Exited (0) vs (1)", "0 = finished fine · non-zero = crashed, read the logs"],
            ["docker logs -f NAME", "recorded stdout/stderr — first stop for any crash"],
            ["docker exec -it NAME sh", "extra shell inside a RUNNING container"],
            ["run vs exec", "run = NEW container · exec = into an EXISTING one"],
            ["docker stop", "SIGTERM + 10s grace, then SIGKILL — polite by default"],
            ["Cattle, not pets", "never repair a container — rm it, run a fresh one"],
            ["Name conflict error", "old stopped container owns the name → docker rm it"],
            ["The daily 5", "run · ps · logs · exec · rm"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
