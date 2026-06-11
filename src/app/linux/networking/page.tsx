"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "ping", label: "ping — Is It Alive?" },
  { id: "dns", label: "dig & ip — Names and Addresses" },
  { id: "curl", label: "curl — Talk to APIs ⭐" },
  { id: "wget", label: "wget — Download Files" },
  { id: "ssh", label: "ssh — Control Remote Machines ⭐" },
  { id: "ssh-keys", label: "SSH Keys — No More Passwords ⭐" },
  { id: "scp", label: "scp & rsync — Copy Across" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxNetworkingPage() {
  return (
    <TopicShell
      icon="📡"
      title="Network — ping · curl · ssh · scp"
      gradientWord="Network"
      subtitle="The remote-work toolkit: check if a machine is reachable, talk to any API from the terminal, control servers across the world with ssh, and move files between machines."
      nav={NAV}
      next={{ icon: "📦", label: "Software & Archives + Cheat Sheet", href: "/linux/packages" }}
    >
      {/* 01 ─ PING */}
      <Section id="ping" number="01" title="ping — Is It Alive? Is the Path OK?">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ping -c 4 google.com      # -c 4: send 4 probes, then stop`}
          output={`PING google.com (142.250.74.46) 56 bytes of data.
64 bytes from 142.250.74.46: icmp_seq=1 ttl=117 time=8.31 ms
64 bytes from 142.250.74.46: icmp_seq=2 ttl=117 time=8.12 ms

--- google.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss
                                   ↑ THE number: 0% = path is healthy`}
        />
        <Callout type="tip">
          The classic &quot;is it me or them?&quot; ladder: <IC>ping 1.1.1.1</IC> works but{" "}
          <IC>ping google.com</IC> fails → your <strong>DNS</strong> is broken, not your
          internet. Both fail → your connection/router. Both work → the problem is the specific
          service, not the network.
        </Callout>
      </Section>

      {/* 02 ─ DNS */}
      <Section id="dns" number="02" title="dig & ip — Names and Addresses">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ dig +short example.com     # what IP does this name point to?
93.184.215.14

$ ip addr                    # MY addresses (the modern ifconfig)
$ ip route                   # which gateway do I exit through?
$ curl ifconfig.me           # my PUBLIC IP (as the internet sees me)`}
        />
        <Callout type="behind">
          Your machine usually has a private address (<IC>192.168.x.x</IC>, <IC>10.x.x.x</IC>)
          and hides behind your router&apos;s public one — that&apos;s why <IC>ip addr</IC> and{" "}
          <IC>curl ifconfig.me</IC> disagree. Port-mapping in Docker will feel familiar after
          this.
        </Callout>
      </Section>

      {/* 03 ─ CURL */}
      <Section id="curl" number="03" title="curl — Talk to Any API From the Terminal ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ curl https://api.github.com/users/torvalds     # GET (default)
$ curl -i https://example.com                     # -i: include headers
$ curl -o page.html https://example.com           # save to a file

# the API developer's daily bread:
$ curl -X POST https://api.myapp.dev/users \\
       -H "Content-Type: application/json" \\
       -d '{"name": "dee"}'

$ curl -s https://api.github.com/users/torvalds | grep '"name"'`}
          output={`$ curl -s https://api.github.com/users/torvalds | grep '"name"'
  "name": "Linus Torvalds",`}
        />
        <Table
          head={["Flag", "Meaning"]}
          rows={[
            [<IC key="1">-X POST/PUT/DELETE</IC>, "HTTP method (GET is default)"],
            [<IC key="2">-H &quot;Header: val&quot;</IC>, "add a header (auth tokens, content-type)"],
            [<IC key="3">-d &apos;{"{...}"}&apos;</IC>, "request body"],
            [<IC key="4">-i / -s</IC>, "show headers / silent (no progress bar — for pipes)"],
            [<IC key="5">-o file / -O</IC>, "save as file / keep original name"],
          ]}
        />
        <Callout type="tip">
          ⭐ &quot;Is my server up?&quot; — <IC>curl -s -o /dev/null -w &quot;%{"{http_code}"}&quot; localhost:8080</IC>{" "}
          prints just the status code (200 = healthy). This exact one-liner powers countless
          health checks and CI scripts.
        </Callout>
      </Section>

      {/* 04 ─ WGET */}
      <Section id="wget" number="04" title="wget — The Downloader">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ wget https://example.com/big-dataset.zip     # download, keep name
$ wget -c https://example.com/big-dataset.zip  # -c: RESUME a broken download ⭐`}
          output={`big-dataset.zip   43%[=======>          ]  1.2G  24MB/s  eta 51s`}
        />
        <Callout type="note">
          curl vs wget: <IC>curl</IC> for <strong>talking</strong> to APIs (headers, methods,
          bodies, pipes), <IC>wget</IC> for <strong>fetching files</strong> (progress bar,
          resume, recursive mirroring). Overlap is huge — knowing one well is enough.
        </Callout>
      </Section>

      {/* 05 ─ SSH */}
      <Section id="ssh" number="05" title="ssh — A Terminal on Another Machine ⭐">
        <CmdPlay
          title="ssh — crossing to the server"
          steps={[
            {
              cmd: "ssh dee@203.0.113.7",
              narrative: "ssh reaches out to port 22 on the server. First contact ever? It shows the server's fingerprint and asks you to trust it (it's then saved — you won't be asked again).",
              visualTitle: "the connection",
              boxes: [
                { id: "laptop", label: "your laptop", sub: "ssh client", icon: "💻", state: "active" },
                { id: "net", label: "the internet", sub: "encrypted tunnel forming...", icon: "🔐", state: "dim" },
                { id: "server", label: "203.0.113.7", sub: "sshd listening on :22", icon: "🖥️", state: "dim" },
              ],
            },
            {
              out: ["The authenticity of host '203.0.113.7' can't be established.", "Are you sure you want to continue connecting? yes", "dee@203.0.113.7's password: ●●●●●●●●"],
              narrative: "You authenticate (password for now — keys in the next section). Everything from here on travels through an encrypted tunnel: keystrokes one way, screen output the other.",
              visualTitle: "the connection",
              boxes: [
                { id: "laptop", label: "your laptop", sub: "keystrokes →", icon: "💻", state: "done" },
                { id: "net", label: "encrypted tunnel", sub: "nobody on the path can read it", icon: "🔐", state: "active" },
                { id: "server", label: "203.0.113.7", sub: "← screen output", icon: "🖥️", state: "dim" },
              ],
            },
            {
              out: ["Welcome to Ubuntu 24.04.1 LTS", "dee@webserver:~$  ← THIS PROMPT IS THE SERVER"],
              narrative: "A shell starts ON THE SERVER. Every command you type now — ls, ps, rm — runs THERE, on that machine's disk. The prompt's user@host is your only reminder of where you are.",
              visualTitle: "the connection",
              boxes: [
                { id: "laptop", label: "your laptop", sub: "just a window now", icon: "💻", state: "done" },
                { id: "net", label: "encrypted tunnel", sub: "live", icon: "🔐", state: "done" },
                { id: "server", label: "203.0.113.7", sub: "your shell runs HERE", icon: "🖥️", state: "active" },
              ],
            },
            {
              cmd: "exit",
              out: ["logout", "Connection to 203.0.113.7 closed.", "you@laptop:~$  ← home again"],
              narrative: "exit closes the remote shell and the tunnel. Everything you learned in this track — files, pipes, permissions, processes — works identically through ssh. That's WHY you learned it.",
              visualTitle: "the connection",
              boxes: [
                { id: "laptop", label: "your laptop", sub: "back to the local shell ✓", icon: "💻", state: "active" },
                { id: "net", label: "tunnel", sub: "closed", icon: "🔐", state: "dim" },
                { id: "server", label: "203.0.113.7", sub: "still running your services", icon: "🖥️", state: "dim" },
              ],
            },
          ]}
        />
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ssh dee@203.0.113.7               # user @ server
$ ssh dee@myserver.com -p 2222      # non-default port
$ ssh dee@myserver.com "df -h"      # run ONE command remotely, come back`}
        />
        <Callout type="mistake">
          The deadliest mix-up in ops: forgetting <strong>which machine your terminal is
          on</strong>. Before any <IC>rm</IC>, <IC>reboot</IC> or <IC>kill</IC>, glance at the
          prompt&apos;s <IC>user@hostname</IC>. Production and laptop look identical otherwise.
        </Callout>
      </Section>

      {/* 06 ─ SSH KEYS */}
      <Section id="ssh-keys" number="06" title="SSH Keys — Stronger Than Passwords, Zero Typing ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# 1. generate a key PAIR on your laptop (once, ever)
$ ssh-keygen -t ed25519
Your identification: ~/.ssh/id_ed25519        ← PRIVATE: never leaves, never share
Your public key:     ~/.ssh/id_ed25519.pub    ← PUBLIC: hand out freely

# 2. install the PUBLIC half on the server
$ ssh-copy-id dee@myserver.com
(types your password one last time...)

# 3. forever after:
$ ssh dee@myserver.com         # no password — instant ✓`}
        />
        <Callout type="behind">
          The lock-and-key model: the public key is a <strong>padlock</strong> you can hang on
          any server; the private key opens it. The server challenges your laptop to prove it
          holds the private key — nothing secret ever crosses the network. This same key pair is
          how GitHub knows it&apos;s you when you <IC>git push</IC>.
        </Callout>
        <Callout type="mistake">
          Permissions matter here (remember 600?): ssh <strong>refuses</strong> to use a private
          key that other users can read. If keys mysteriously fail:{" "}
          <IC>chmod 700 ~/.ssh &amp;&amp; chmod 600 ~/.ssh/id_ed25519</IC>.
        </Callout>
      </Section>

      {/* 07 ─ SCP */}
      <Section id="scp" number="07" title="scp & rsync — Move Files Between Machines">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`# scp: cp with an ssh address on either side
$ scp report.pdf dee@server:/home/dee/          # laptop → server
$ scp dee@server:/var/log/app.log .             # server → laptop
$ scp -r ./website dee@server:/var/www/         # whole folder

# rsync: the smarter mover — only sends what CHANGED ⭐
$ rsync -avz ./website/ dee@server:/var/www/site/
#       -a archive (perms+times)  -v verbose  -z compress`}
          output={`$ rsync -avz ./website/ dee@server:/var/www/site/
sending incremental file list
index.html          ← only the 2 files you edited transfer,
style.css              not all 500
sent 8.1K  total size 14.2M  speedup 1753x`}
        />
        <Callout type="tip">
          First deploy: scp or rsync, same thing. Every redeploy after: <IC>rsync</IC> wins —
          it compares checksums and ships only the diff. Watch the trailing slashes:{" "}
          <IC>src/</IC> = the <em>contents</em>, <IC>src</IC> = the folder itself.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["ping -c 4 host", "alive? 0% loss = healthy path"],
            ["Me-or-them ladder", "ping 1.1.1.1 ok + name fails = DNS problem"],
            ["dig +short / ip addr", "name→IP · my interfaces (curl ifconfig.me = public)"],
            ["curl API recipe", "-X POST -H 'Content-Type: ...' -d '{json}'"],
            ["curl -s | ...", "silent mode for pipes · -o saves to file"],
            ["wget -c", "resume a broken download"],
            ["ssh user@host", "a shell ON the server — check the prompt before rm!"],
            ["ssh keys", "keygen → ssh-copy-id → never type passwords again"],
            ["Private key = 600", "ssh refuses keys others can read"],
            ["scp vs rsync", "simple copy vs only-the-diff (-avz) — redeploys want rsync"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
