"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { CmdPlay } from "@/components/linux/cli-anim";

const NAV = [
  { id: "who", label: "whoami & id — Who Am I?" },
  { id: "passwd-file", label: "/etc/passwd Decoded ⭐" },
  { id: "switch", label: "su & sudo -i, Animated ⭐" },
  { id: "create", label: "Creating Users" },
  { id: "groups", label: "Groups — Share Access ⭐" },
  { id: "password", label: "Passwords & Locking" },
  { id: "service", label: "Service Users (www-data?)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinuxUsersPage() {
  return (
    <TopicShell
      icon="👥"
      title="Users & Groups"
      gradientWord="Users"
      subtitle="Every process and file belongs to a user. Learn who you are, how Linux stores identities, how to switch users safely, and how groups share access without sharing passwords."
      nav={NAV}
      next={{ icon: "⚙️", label: "Processes — ps · top · kill", href: "/linux/processes" }}
    >
      {/* 01 ─ WHO */}
      <Section id="who" number="01" title="whoami & id — Who Am I Right Now?">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ whoami                 # just the username
$ id                     # the full identity card
$ groups                 # which groups am I in?`}
          output={`$ whoami
dee

$ id
uid=1000(dee) gid=1000(dee) groups=1000(dee),27(sudo),998(docker)
    ↑ your number          ↑ main group    ↑ sudo & docker = real powers!

$ groups
dee sudo docker`}
        />
        <Callout type="behind">
          The kernel only knows <strong>numbers</strong> — uid 1000, gid 998. Names like{" "}
          <IC>dee</IC> are a lookup table for humans. That&apos;s why a file from a deleted user
          shows a bare number in <IC>ls -l</IC>: the name is gone, the uid remains.
        </Callout>
      </Section>

      {/* 02 ─ PASSWD FILE */}
      <Section id="passwd-file" number="02" title="/etc/passwd — Where Users Live ⭐">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ cat /etc/passwd | head -4`}
          output={`root:x:0:0:root:/root:/bin/bash
dee:x:1000:1000:Dee:/home/dee:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
sshd:x:107:65534::/run/sshd:/usr/sbin/nologin

dee : x : 1000 : 1000 : Dee : /home/dee : /bin/bash
─┬─  ─┬─  ─┬──   ─┬──   ─┬─   ─┬───────   ─┬───────
name  │   uid    gid   info   HOME dir    login SHELL
      └─ password? no! the x says "look in /etc/shadow"`}
        />
        <Table
          head={["File", "Contains", "Readable by"]}
          rows={[
            [<IC key="1">/etc/passwd</IC>, "user list: uid, home, shell (no secrets!)", "everyone"],
            [<IC key="2">/etc/shadow</IC>, "the actual password HASHES", "root only"],
            [<IC key="3">/etc/group</IC>, "group list + members", "everyone"],
          ]}
        />
        <Callout type="note">
          uid <IC>0</IC> is root — always. uids 1–999 are system/service accounts; humans start
          at 1000. And <IC>/usr/sbin/nologin</IC> as a shell means &quot;this account can own
          things but nobody can log in as it.&quot;
        </Callout>
      </Section>

      {/* 03 ─ SWITCH */}
      <Section id="switch" number="03" title="Switching Users — su & sudo -i, Animated ⭐">
        <CmdPlay
          title="who am I right now?"
          steps={[
            {
              cmd: "whoami",
              out: ["dee"],
              narrative: "You start as yourself: uid 1000, normal powers, $ prompt. Files you create belong to dee.",
              visualTitle: "current identity",
              boxes: [
                { id: "dee", label: "dee  (uid 1000)", sub: "normal user · $ prompt", icon: "👤", state: "active" },
                { id: "root", label: "root  (uid 0)", sub: "all-powerful · # prompt", icon: "👑", state: "dim" },
              ],
            },
            {
              cmd: "sudo -i",
              out: ["[sudo] password for dee: ●●●●●●", "root@server:~#  ← prompt changed!"],
              narrative: "sudo -i opens a full root shell — note $ became #. You proved YOUR password and the sudoers file said yes. Every command now runs as uid 0.",
              visualTitle: "current identity",
              boxes: [
                { id: "dee", label: "dee  (uid 1000)", sub: "waiting underneath...", icon: "👤", state: "dim" },
                { id: "root", label: "root  (uid 0)", sub: "YOU ARE HERE — careful!", icon: "👑", state: "active" },
              ],
            },
            {
              cmd: "exit",
              out: ["logout", "dee@server:~$  ← back to safety"],
              narrative: "exit drops the root shell and you're dee again. Pattern: get in, do the one admin task, GET OUT. Nobody stays root for daily work.",
              visualTitle: "current identity",
              boxes: [
                { id: "dee", label: "dee  (uid 1000)", sub: "back to normal ✓", icon: "👤", state: "active" },
                { id: "root", label: "root  (uid 0)", sub: "released", icon: "👑", state: "dim" },
              ],
            },
          ]}
        />
        <Table
          head={["Command", "Switches to", "Password asked"]}
          rows={[
            [<IC key="1">sudo -i</IC>, "root (full shell)", "YOURS (if you're in sudo group)"],
            [<IC key="2">su -</IC>, "root", "ROOT's password"],
            [<IC key="3">su - sam</IC>, "user sam", "SAM's password"],
            [<IC key="4">sudo -u sam cmd</IC>, "run one cmd as sam", "yours"],
          ]}
        />
        <Callout type="tip">
          Modern practice: root often has <strong>no password at all</strong> (locked), and all
          admin goes through <IC>sudo</IC> — which also logs <em>who</em> did <em>what</em>.
          That&apos;s why <IC>su -</IC> fails on Ubuntu but <IC>sudo -i</IC> works.
        </Callout>
      </Section>

      {/* 04 ─ CREATE */}
      <Section id="create" number="04" title="Creating Users">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sudo adduser sam            # friendly: makes home dir, asks password
Adding user 'sam' ...
Creating home directory '/home/sam' ...
New password: ●●●●●●●●

$ sudo adduser sam sudo       # grant admin: add sam to the sudo group
$ sudo deluser sam            # remove user (home dir stays)
$ sudo deluser --remove-home sam   # remove user AND their files`}
        />
        <Callout type="note">
          You may also meet <IC>useradd</IC> (no &quot;d-d&quot; friendliness): it&apos;s the
          low-level tool that creates ONLY the account — no home dir, no password — unless you
          pass flags (<IC>useradd -m -s /bin/bash sam</IC>). On Ubuntu/Debian, prefer{" "}
          <IC>adduser</IC>.
        </Callout>
      </Section>

      {/* 05 ─ GROUPS */}
      <Section id="groups" number="05" title="Groups — Sharing Without Sharing Passwords ⭐">
        <P>
          The team-folder problem: three developers need to edit <IC>/srv/project</IC>. Wrong
          answers: share one login, or chmod 777. Right answer: a group.
        </P>
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ sudo groupadd devteam               # 1. make the group
$ sudo adduser dee devteam            # 2. add each member
$ sudo adduser sam devteam
$ sudo chown -R :devteam /srv/project # 3. hand the folder to the group
$ sudo chmod -R g+rw /srv/project     # 4. let the group read+write
$ groups sam                          # verify
sam : sam devteam`}
        />
        <Callout type="mistake">
          Group changes only apply at <strong>login</strong> — after <IC>adduser sam devteam</IC>,
          sam still gets Permission denied until re-login (or <IC>newgrp devteam</IC>). The #1
          &quot;but I added them to the group!&quot; confusion — same thing you saw with the{" "}
          <IC>docker</IC> group.
        </Callout>
      </Section>

      {/* 06 ─ PASSWORD */}
      <Section id="password" number="06" title="Passwords & Locking">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ passwd                   # change YOUR password
$ sudo passwd sam          # root resets sam's (no old one needed)
$ sudo passwd -l sam       # LOCK the account (suspend without deleting)
$ sudo passwd -u sam       # unlock`}
        />
        <Callout type="tip">
          Someone leaves the company? <IC>passwd -l</IC> first — instant, reversible, keeps
          their files owned and intact for handover. Deleting is a later, calmer decision.
        </Callout>
      </Section>

      {/* 07 ─ SERVICE USERS */}
      <Section id="service" number="07" title="Service Users — Why www-data Exists">
        <CodeBlock
          title="terminal"
          runnable={false}
          code={`$ ps aux | head -5`}
          output={`USER       PID  %CPU COMMAND
root         1   0.0 /sbin/init
root       412   0.0 sshd: /usr/sbin/sshd
www-data   893   0.2 nginx: worker process     ← the web server is a USER
postgres  1047   0.1 postgres: checkpointer    ← so is the database`}
        />
        <P>
          Every program runs <strong>as some user</strong>, and services get their own locked,
          no-login accounts. If nginx is hacked, the attacker becomes{" "}
          <IC>www-data</IC> — who can read web files and… basically nothing else. The blast
          radius is the user&apos;s permissions.
        </P>
        <Callout type="behind">
          This is the permission model paying off: users + groups + rwx isn&apos;t just about
          colleagues — it&apos;s the security sandbox every service on the machine lives in.
          Docker pushes the same idea further with full containers.
        </Callout>
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["whoami / id / groups", "name · full identity · my groups"],
            ["uid 0 = root", "humans start at 1000 · 1–999 = service accounts"],
            ["/etc/passwd", "users (public) · hashes live in /etc/shadow (root only)"],
            ["nologin shell", "account can own things, nobody can log in as it"],
            ["sudo -i ⇄ exit", "enter root (# prompt), do the task, GET OUT"],
            ["su needs THEIR password", "sudo needs YOURS — that's the key difference"],
            ["adduser sam", "create (friendly) · adduser sam sudo = grant admin"],
            ["Group recipe", "groupadd → adduser members → chown :grp → chmod g+rw"],
            ["Groups need re-login", "membership applies at login (or newgrp)"],
            ["passwd -l / -u", "lock/unlock an account — offboarding step one"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
