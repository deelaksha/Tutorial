"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { DockerFlow } from "@/components/docker/flow";

const NAV = [
  { id: "install", label: "Install — One Path Per OS" },
  { id: "verify", label: "Verify the Engine" },
  { id: "sudo-fix", label: "Linux: Lose the sudo" },
  { id: "hello-world", label: "hello-world, Traced ⭐" },
  { id: "run-anatomy", label: "Anatomy of docker run ⭐" },
  { id: "interactive", label: "An Interactive Ubuntu" },
  { id: "cleanup", label: "Look Around & Clean Up" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DockerSetupPage() {
  return (
    <TopicShell
      icon="🔧"
      title="Install & First Container"
      gradientWord="Container"
      subtitle="Get the engine running on your OS, verify it, then run your first containers and trace EXACTLY what happens behind each command — client → daemon → registry → running process."
      nav={NAV}
      next={{ icon: "📦", label: "Images & Layers", href: "/docker/images" }}
    >
      {/* 01 ─ INSTALL */}
      <Section id="install" number="01" title="Install — One Path Per OS">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# Linux (Ubuntu/Debian) — the official convenience script
$ curl -fsSL https://get.docker.com -o get-docker.sh
$ sudo sh get-docker.sh

# Linux (Fedora)
$ sudo dnf install docker-ce docker-ce-cli containerd.io

# macOS & Windows: install "Docker Desktop" from docker.com
#  → bundles the engine + a GUI. On Windows it uses WSL2
#    (a real Linux kernel inside Windows) under the hood.`}
        />
        <Table
          head={["OS", "What you install", "How the Linux kernel is provided"]}
          rows={[
            ["Linux", "Docker Engine (just the daemon + CLI)", "it IS Linux — native, fastest"],
            ["macOS", "Docker Desktop", "a hidden lightweight Linux VM"],
            ["Windows", "Docker Desktop + WSL2", "WSL2's real Linux kernel"],
          ]}
        />
        <Callout type="behind">
          Remember from the intro: containers <strong>share the host&apos;s Linux kernel</strong>.
          macOS and Windows don&apos;t have one — so Docker Desktop quietly runs a tiny Linux VM
          and puts all your containers inside it. That&apos;s why Docker feels native on Linux and
          slightly heavier elsewhere.
        </Callout>
      </Section>

      {/* 02 ─ VERIFY */}
      <Section id="verify" number="02" title="Verify the Engine">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker --version          # is the CLI installed?
$ docker info               # can the CLI reach the DAEMON?`}
          output={`$ docker --version
Docker version 27.3.1, build ce12230

$ docker info
Client:
 Version:    27.3.1
Server:                       ← if you see "Server:", the daemon is alive ✅
 Containers: 0
 Images: 0
 Server Version: 27.3.1
 Storage Driver: overlay2`}
        />
        <Callout type="mistake">
          The most common day-1 error: <IC>Cannot connect to the Docker daemon at
          unix:///var/run/docker.sock</IC>. The CLI is fine — the <strong>engine isn&apos;t
          running</strong>. Fix: start Docker Desktop (mac/Windows) or{" "}
          <IC>sudo systemctl start docker</IC> (Linux).
        </Callout>
      </Section>

      {/* 03 ─ SUDO FIX */}
      <Section id="sudo-fix" number="03" title="Linux Only: Lose the sudo">
        <P>
          Fresh Linux installs require <IC>sudo docker ...</IC> for every command, because the
          daemon&apos;s socket is owned by the <IC>docker</IC> group. Add yourself to it once:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sudo usermod -aG docker $USER   # add your user to the docker group
$ newgrp docker                   # apply without logging out (or just re-login)
$ docker ps                       # ✅ works without sudo now`}
          output={`$ docker ps
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
(empty list — but no permission error. you're in.)`}
        />
        <Callout type="note">
          Membership in the <IC>docker</IC> group is effectively root-level power on that machine
          (containers can mount any path). Fine for your laptop — a real consideration on shared
          servers.
        </Callout>
      </Section>

      {/* 04 ─ HELLO WORLD */}
      <Section id="hello-world" number="04" title="hello-world — The Most Educational 1KB Image ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker run hello-world`}
          output={`Unable to find image 'hello-world:latest' locally   ← ① not on disk
latest: Pulling from library/hello-world            ← ② so pull from Hub
c1ec31eb5944: Pull complete
Status: Downloaded newer image for hello-world:latest

Hello from Docker!                                  ← ③ container ran!
This message shows that your installation appears
to be working correctly.
                                                    ← ④ process ended,
                                                       container stopped`}
        />
        <P>
          That one command exercised the ENTIRE architecture from the intro page — watch the
          request travel (try the <IC>docker run</IC> tab too):
        </P>
        <DockerFlow initial="run" />
        <Callout type="tip">
          ⭐ Last step is a core rule: <strong>a container runs exactly as long as its main
          process</strong>. hello-world prints and exits → container stops instantly. nginx serves
          forever → container runs forever. This explains 90% of &quot;why did my container
          stop?&quot; questions.
        </Callout>
      </Section>

      {/* 05 ─ RUN ANATOMY */}
      <Section id="run-anatomy" number="05" title="Anatomy of docker run ⭐">
        <P>
          You&apos;ll type <IC>docker run</IC> thousands of times. Learn to read it as four slots:
        </P>
        <CodeBlock
          title="run_anatomy.txt"
          runnable={false}
          code={`docker run  [OPTIONS]   IMAGE[:TAG]   [COMMAND]
            ─────────   ───────────   ─────────
             how to       what to       override what
             run it       run           runs inside (optional)

$ docker run  -d -p 8080:80 --name web   nginx:1.27      nginx -g 'daemon off;'
              └────────┬──────────────┘  └────┬────┘     └───────┬──────────┘
                  OPTIONS                  IMAGE:TAG        COMMAND (optional —
   -d        detached (background)      :1.27 pins the      images ship a default,
   -p 8080:80  laptop port → container  version. no tag     so you usually omit it)
   --name web  human-friendly name      = :latest`}
        />
        <Table
          head={["Flag", "Meaning", "You'll use it..."]}
          rows={[
            [<IC key="d">-d</IC>, "detached — run in the background, print the ID", "for servers (nginx, postgres)"],
            [<IC key="it">-it</IC>, "interactive + terminal — attach your keyboard", "for shells (bash, python REPL)"],
            [<IC key="p">-p H:C</IC>, "publish — host port H → container port C", "for anything you browse/connect to"],
            [<IC key="name">--name x</IC>, "name it yourself instead of epic_turing", "always — names beat IDs"],
            [<IC key="rm">--rm</IC>, "auto-delete the container when it stops", "for throwaway experiments"],
            [<IC key="e">-e K=V</IC>, "set an environment variable inside", "for config (passwords, modes)"],
          ]}
        />
        <Callout type="mistake">
          <IC>-d</IC> and <IC>-it</IC> answer the same question (&quot;where does this run?&quot;)
          in opposite ways. Background server → <IC>-d</IC>. Shell you type into →{" "}
          <IC>-it</IC>. Using neither runs in the foreground, hogging your terminal — fine for a
          quick look, confusing otherwise.
        </Callout>
      </Section>

      {/* 06 ─ INTERACTIVE */}
      <Section id="interactive" number="06" title="An Interactive Ubuntu — A Whole OS in 2 Seconds">
        <P>
          Now the mind-bending one: run a different Linux distribution as a disposable shell,
          using <IC>-it</IC>:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker run -it --rm ubuntu bash`}
          output={`root@9f8e7d6c5b4a:/#                ← you are INSIDE the container
root@9f8e7d6c5b4a:/# cat /etc/os-release | head -2
PRETTY_NAME="Ubuntu 24.04.1 LTS"   ← real Ubuntu (even if your host is Fedora/mac!)
root@9f8e7d6c5b4a:/# ls
bin  boot  dev  etc  home  lib  ... ← its OWN filesystem, not yours
root@9f8e7d6c5b4a:/# touch /i_was_here
root@9f8e7d6c5b4a:/# exit          ← main process (bash) ends...
$                                  ← container stopped, and --rm deleted it.
                                     /i_was_here is gone FOREVER. 💨`}
        />
        <Callout type="tip">
          That vanished file is your first taste of a crucial rule: <strong>container filesystems
          are ephemeral</strong>. Anything written inside dies with the container. Databases would
          be useless this way — that&apos;s exactly what the Volumes page fixes.
        </Callout>
        <Callout type="analogy">
          🏨 A container&apos;s filesystem is a <strong>hotel room</strong>: live in it, mess it
          up — at checkout it&apos;s reset for the next guest. Your permanent stuff belongs in
          your own storage (volumes), not the room.
        </Callout>
      </Section>

      {/* 07 ─ CLEANUP */}
      <Section id="cleanup" number="07" title="Look Around & Clean Up">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ docker ps              # running containers
$ docker ps -a           # ALL containers (including stopped ones!)
$ docker images          # images downloaded to disk
$ docker rm <name|id>    # delete a stopped container
$ docker rmi hello-world # delete an image`}
          output={`$ docker ps -a
CONTAINER ID   IMAGE         STATUS                     NAMES
3c2b1a098f7e   hello-world   Exited (0) 5 minutes ago   vibrant_kepler

← surprise: stopped containers STICK AROUND until you rm them.
   (the ubuntu one is missing because --rm auto-deleted it ✅)

$ docker rm vibrant_kepler
vibrant_kepler
$ docker rmi hello-world
Untagged: hello-world:latest`}
        />
        <Callout type="mistake">
          <IC>docker ps</IC> showing nothing does <strong>not</strong> mean nothing is there —
          stopped containers hide until <IC>ps -a</IC>. They accumulate silently for months.
          Habit: <IC>--rm</IC> for experiments, and an occasional{" "}
          <IC>docker container prune</IC> (deletes all stopped ones).
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Verify install", "docker --version (CLI) then docker info (daemon alive?)"],
            ["Daemon not running?", "start Docker Desktop / sudo systemctl start docker"],
            ["Linux no-sudo fix", "sudo usermod -aG docker $USER, then re-login"],
            ["docker run =", "pull (if needed) → create → start, in one command"],
            ["Golden rule", "container lives EXACTLY as long as its main process"],
            ["-d vs -it", "-d background server · -it interactive shell"],
            ["-p 8080:80", "host port 8080 → container port 80 (host first!)"],
            ["--rm", "auto-delete container on exit — default for experiments"],
            ["Filesystems are ephemeral", "files written inside die with the container (→ volumes)"],
            ["See everything", "docker ps -a (containers) · docker images (images)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
