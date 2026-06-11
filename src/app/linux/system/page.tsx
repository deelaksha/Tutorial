"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "checkup", label: "The 60-Second Checkup ⭐" },
  { id: "df", label: "df — Disk Space" },
  { id: "du", label: "du — WHO Ate the Disk? ⭐" },
  { id: "free", label: "free — Memory" },
  { id: "uname", label: "uname · uptime · hostname" },
  { id: "systemctl", label: "systemctl — Services ⭐" },
  { id: "journal", label: "journalctl — Service Logs" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxSystemPage() {
  return (
    <TopicShell
      icon="📊"
      title="System Health — df · du · free · systemctl"
      gradientWord="Health"
      subtitle="The server-checkup toolkit: how full are the disks, who ate the space, is memory okay, and is the service actually running — plus systemctl, the remote control for everything that runs at boot."
      nav={NAV}
      next={{ icon: "📡", label: "Network — ping · curl · ssh", href: "/linux/networking" }}
    >
      {/* 01 ─ CHECKUP */}
      <Section id="checkup" number="01" title="The 60-Second Server Checkup ⭐">
        <CodeBlock
          title="checkup.sh"
          runnable={false}
          code={`$ uptime          # how loaded? how long since reboot?
$ df -h           # disks full?
$ free -h         # memory left?
$ top             # what's eating CPU/RAM right now? (q to quit)
$ systemctl --failed   # any services crashed?`}
        />
        <P>
          Five commands, one minute, and you know if a sick server&apos;s problem is CPU, disk,
          memory, or a dead service. Everything else in this lesson drills into one of these.
        </P>
        <Callout type="analogy">
          🩺 It&apos;s a doctor&apos;s vitals check: pulse (load), lungs (memory), stomach
          (disk), and &quot;any organs offline?&quot; (failed services) — before any deep
          diagnosis.
        </Callout>
      </Section>

      {/* 02 ─ DF */}
      <Section id="df" number="02" title="df — Disk Free, Per Drive">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ df -h        # -h: human sizes (always use it)`}
          output={`Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       228G  211G  5.4G  98% /          ← 🚨 trouble
/dev/sdb1       916G  402G  468G  47% /data
tmpfs           7.8G  1.2M  7.8G   1% /tmp`}
        />
        <Callout type="mistake">
          A 100%-full root filesystem breaks things in WEIRD ways — apps crash with
          &quot;No space left on device&quot;, databases corrupt, you can&apos;t even ssh in
          properly. Treat 90%+ on <IC>/</IC> as an emergency, not a warning.
        </Callout>
      </Section>

      {/* 03 ─ DU */}
      <Section id="du" number="03" title="du — Hunt the Space Eater ⭐">
        <P>
          <IC>df</IC> says &quot;the disk is full&quot;; <IC>du</IC> answers{" "}
          <strong>what filled it</strong>. The hunt is a drill-down — watch:
        </P>
        <CmdPlay
          title="drilling down to the space hog"
          steps={[
            {
              cmd: "df -h",
              out: ["/dev/sda2  228G  211G  5.4G  98% /   🚨"],
              narrative: "df raises the alarm: root disk 98% full. But WHERE? df only knows totals per drive — time to drill down with du.",
              visualTitle: "the hunt",
              tree: [
                { id: "root", label: "/", kind: "dir", state: "active", note: "211G used — but where?" },
              ],
            },
            {
              cmd: "sudo du -sh /* 2>/dev/null | sort -h | tail -4",
              out: ["2.1G  /usr", "4.8G  /home", "183G  /var   ← there!"],
              narrative: "du -sh /* sizes every top-level folder; sort -h ranks them. /var holds 183 of the 211GB. Descend!",
              visualTitle: "the hunt",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "usr", label: "usr/  — 2.1G", depth: 1, kind: "dir", state: "dim" },
                { id: "home", label: "home/  — 4.8G", depth: 1, kind: "dir", state: "dim" },
                { id: "var", label: "var/  — 183G", depth: 1, kind: "dir", state: "active", note: "← the trail" },
              ],
            },
            {
              cmd: "sudo du -sh /var/* | sort -h | tail -3",
              out: ["1.2G  /var/cache", "178G  /var/log   ← THERE!"],
              narrative: "Repeat one level deeper: /var/log has 178GB. A runaway app has been screaming into a log file for months.",
              visualTitle: "the hunt",
              tree: [
                { id: "root", label: "/", kind: "dir" },
                { id: "var", label: "var/", depth: 1, kind: "dir" },
                { id: "cache", label: "cache/  — 1.2G", depth: 2, kind: "dir", state: "dim" },
                { id: "log", label: "log/  — 178G", depth: 2, kind: "dir", state: "active", note: "found it" },
                { id: "app", label: "app.log  — 177G 😱", depth: 3, kind: "file", state: "new" },
              ],
            },
            {
              cmd: "sudo truncate -s 0 /var/log/app.log && df -h",
              out: ["/dev/sda2  228G  34G  183G  16% /   ✓"],
              narrative: "Empty the monster (truncate keeps the file but drops its content — safer than rm while an app holds it open). 98% → 16%. Then fix the real cause: log rotation.",
              visualTitle: "the hunt",
              tree: [
                { id: "root", label: "/", kind: "dir", state: "active", note: "16% used ✓" },
                { id: "var", label: "var/", depth: 1, kind: "dir" },
                { id: "log", label: "log/", depth: 2, kind: "dir" },
                { id: "app", label: "app.log  — 0 bytes", depth: 3, kind: "file", state: "new", note: "emptied" },
              ],
            },
          ]}
        />
        <CodeBlock
          title="the_recipe.sh"
          runnable={false}
          code={`sudo du -sh /* 2>/dev/null | sort -h | tail   # rank top-level dirs
# then repeat one level deeper, following the biggest number:
sudo du -sh /var/* | sort -h | tail`}
        />
        <Callout type="behind">
          Why <IC>truncate</IC> instead of <IC>rm</IC>? If a running app still has the file
          open, <IC>rm</IC> removes the NAME but the data stays allocated until the app closes
          it — disk stays full and now you can&apos;t even see why. Truncate empties it in
          place.
        </Callout>
      </Section>

      {/* 04 ─ FREE */}
      <Section id="free" number="04" title="free — Memory (and the Misleading Column)">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ free -h`}
          output={`               total   used   free  buff/cache  available
Mem:            15Gi   6.2Gi  912Mi      8.4Gi       8.9Gi
Swap:          2.0Gi   0.2Gi  1.8Gi          ↑           ↑
                                     disk cache    THE number to read`}
        />
        <Callout type="mistake">
          &quot;free is only 912M — I&apos;m out of RAM!&quot; No: Linux deliberately fills idle
          RAM with disk cache (<IC>buff/cache</IC>) and hands it back the instant programs need
          it. Read <strong>available</strong>, ignore <strong>free</strong>. Real trouble looks
          like: available near zero AND swap heavily used.
        </Callout>
      </Section>

      {/* 05 ─ UNAME */}
      <Section id="uname" number="05" title="uname · uptime · hostname — Quick Identity">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ uname -a            # kernel + architecture (x86_64? arm64?)
$ uptime              # since when, and load averages
$ hostname            # which machine IS this? (multi-ssh sanity check)
$ cat /etc/os-release | head -2   # which distro + version?`}
          output={`$ uptime
 09:31:02 up 147 days,  4:12,  2 users,  load average: 0.52, 0.41, 0.30

$ cat /etc/os-release | head -2
PRETTY_NAME="Ubuntu 24.04.1 LTS"`}
        />
        <Callout type="tip">
          First three commands on ANY unfamiliar ssh session: <IC>hostname</IC> (am I where I
          think I am?), <IC>uptime</IC> (is it struggling?), <IC>cat /etc/os-release</IC> (apt
          or dnf?).
        </Callout>
      </Section>

      {/* 06 ─ SYSTEMCTL */}
      <Section id="systemctl" number="06" title="systemctl — The Remote Control for Services ⭐">
        <P>
          nginx, postgres, docker, ssh — long-running programs are managed as{" "}
          <strong>services</strong> by systemd (that PID 1 you met). <IC>systemctl</IC> is its
          remote control:
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ systemctl status nginx        # is it running? since when? recent logs
$ sudo systemctl restart nginx  # stop + start (after config changes)
$ sudo systemctl stop nginx     # stop now
$ sudo systemctl start nginx    # start now
$ sudo systemctl enable nginx   # auto-start at BOOT ⭐
$ sudo systemctl disable nginx  # don't start at boot
$ systemctl --failed            # list crashed services`}
          output={`$ systemctl status nginx
● nginx.service - A high performance web server
     Active: active (running) since Mon 09:02:11; 3 days ago
   Main PID: 893 (nginx)
     Memory: 38.2M`}
        />
        <Callout type="mistake">
          <IC>start</IC> ≠ <IC>enable</IC> — the eternal confusion. <IC>start</IC> = run NOW
          (until reboot). <IC>enable</IC> = run at every BOOT (not now!). A service that
          &quot;mysteriously disappeared after the server rebooted&quot; was started but never
          enabled. You usually want both: <IC>sudo systemctl enable --now nginx</IC>.
        </Callout>
      </Section>

      {/* 07 ─ JOURNAL */}
      <Section id="journal" number="07" title="journalctl — The Service Log Viewer">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ journalctl -u nginx              # all logs for one service
$ journalctl -u nginx -n 50        # last 50 lines
$ journalctl -u nginx -f           # FOLLOW live (tail -f for services) ⭐
$ journalctl -u nginx --since "10 min ago"
$ journalctl -p err -b             # all ERRORS since boot`}
        />
        <Callout type="tip">
          Service won&apos;t start? The debugging pair, always together:{" "}
          <IC>systemctl status app</IC> for the headline,{" "}
          <IC>journalctl -u app -n 50</IC> for the story. The actual error (missing file, bad
          config line, port taken) is in the journal.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["60-sec checkup", "uptime · df -h · free -h · top · systemctl --failed"],
            ["df -h", "per-disk fullness — 90%+ on / is an emergency"],
            ["du drill-down", "du -sh /* | sort -h | tail → repeat into the biggest"],
            ["Full log file fix", "truncate -s 0 (rm doesn't free it while app holds it open)"],
            ["free -h", "read AVAILABLE, not free — buff/cache is reclaimable"],
            ["Real RAM trouble", "available ≈ 0 AND swap heavily used"],
            ["New ssh ritual", "hostname · uptime · cat /etc/os-release"],
            ["systemctl verbs", "status · start/stop/restart · enable (= at boot)"],
            ["start ≠ enable", "now vs every boot — enable --now does both"],
            ["Service debugging", "systemctl status x + journalctl -u x -n 50"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
