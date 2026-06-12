"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Every case study follows the same spine",
  nodes: [
    { id: "ticket", icon: "🎫", label: "Change ticket", sub: "ops requirement", x: 6, y: 50, color: "#22d3ee" },
    { id: "north", icon: "🚪", label: "Northbound op", sub: "REST/CLI/gNMI", x: 24, y: 50, color: "#60a5fa" },
    { id: "db", icon: "🗄️", label: "CONFIG_DB diff", sub: "before/after keys", x: 42, y: 22, color: "#a78bfa" },
    { id: "south", icon: "🐍", label: "Service reaction", sub: "hostcfgd/container", x: 42, y: 78, color: "#34d399" },
    { id: "file", icon: "📝", label: "Generated file", sub: "daemon config", x: 62, y: 50, color: "#fb923c" },
    { id: "verify", icon: "✅", label: "Verification", sub: "show + health check", x: 80, y: 22, color: "#10b981" },
    { id: "rollback", icon: "↩️", label: "Rollback plan", sub: "DELETE or restore", x: 80, y: 78, color: "#f472b6" },
  ],
  edges: [
    { id: "ticket-north", from: "ticket", to: "north", color: "#60a5fa" },
    { id: "north-db", from: "north", to: "db", color: "#a78bfa" },
    { id: "north-south", from: "north", to: "south", color: "#34d399" },
    { id: "db-file", from: "db", to: "file", color: "#fb923c" },
    { id: "south-file", from: "south", to: "file", color: "#fb923c" },
    { id: "file-verify", from: "file", to: "verify", color: "#10b981" },
    { id: "file-rollback", from: "file", to: "rollback", color: "#f472b6" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Clean run — add syslog",
      command: "Add remote syslog 10.0.0.5 to 40 switches",
      steps: [
        { node: "ticket", paths: ["ticket-north"], text: "Ops ticket: 'Forward all switch logs to centralized syslog server 10.0.0.5 UDP 514.' Requirement clear: apply to 40 ToR switches, verify logs arrive." },
        { node: "north", paths: ["north-db", "north-south"], text: "Ansible playbook: config syslog add 10.0.0.5 (loops 40 hosts). Or REST PATCH /openconfig-system:system/logging/remote-servers/remote-server=10.0.0.5. Automation-friendly." },
        { node: "db", paths: ["db-file"], text: "CONFIG_DB before: SYSLOG_SERVER table empty. After: HSET SYSLOG_SERVER|10.0.0.5 NULL NULL. redis-cli -n 4 HGETALL confirms key. config save persists to config_db.json." },
        { node: "south", paths: ["south-file"], text: "Keyspace event fires → hostcfgd SyslogCfg.syslog_server_update(key='10.0.0.5', op='SET'). journalctl -u hostcfgd shows handler invoked. sonic-cfggen renders rsyslog.conf.j2." },
        { node: "file", paths: ["file-verify"], text: "Generated /etc/rsyslog.conf diff: added line '*.* @10.0.0.5:514'. Atomic write (render to /tmp, mv). systemctl restart rsyslog. rsyslogd reads new config." },
        { node: "verify", paths: [], text: "Verification: logger 'test from switch1' on switch → tcpdump -i any udp port 514 on 10.0.0.5 shows packet arrive with 'test from switch1'. Green signal: logs flowing. ✅" },
      ],
    },
    {
      id: "cvl",
      name: "❌ CVL rejects — bad payload",
      command: "Typo in IP address → change bounced at validation",
      steps: [
        { node: "ticket", paths: ["ticket-north"], text: "Same ticket, but ops engineer types wrong IP in automation script: '10.0.0.999' (999 invalid octet)." },
        { node: "north", paths: ["north-db"], text: "Ansible calls REST PATCH with address=10.0.0.999. REST server ygot-unmarshals (Go string accepts it), passes to translib." },
        { node: "db", paths: [], text: "CONFIG_DB NEVER touched. Translib calls CVL ValidateEditConfig → sonic-syslog.yang type inet:ip-address pattern check fails. CVL returns CVL_SYNTAX_INVALID_VALUE. HTTP 400 Bad Request returned to Ansible." },
        { node: "south", paths: [], text: "NEVER REACHED — no keyspace event (nothing written to Redis). hostcfgd silent. rsyslog.conf unchanged. CVL protected the system from invalid data. 🛡️" },
        { node: "file", paths: [], text: "NEVER REACHED — file not re-rendered (hostcfgd didn't run). /etc/rsyslog.conf has previous valid state." },
        { node: "verify", paths: [], text: "Ansible playbook fails with error message from REST API: 'invalid-value: 10.0.0.999 does not match type inet:ip-address'. Ops fixes typo to 10.0.0.5, re-runs. This time: green." },
      ],
    },
    {
      id: "rollback",
      name: "↩️ Rollback — verification failed",
      command: "Logs arrive but daemon misbehaves → DELETE walks spine backwards",
      steps: [
        { node: "ticket", paths: ["ticket-north"], text: "Change applied, but syslog server 10.0.0.5 is overwhelmed (100K msgs/sec from 40 switches). Server drops logs, ops needs to rollback FAST." },
        { node: "north", paths: ["north-db", "north-south"], text: "Rollback command: config syslog del 10.0.0.5. Or REST DELETE /openconfig-system:system/logging/remote-servers/remote-server=10.0.0.5. Same northbound API, different verb." },
        { node: "db", paths: ["db-file"], text: "CONFIG_DB: DEL SYSLOG_SERVER|10.0.0.5. Key removed. Keyspace event: __keyspace@4__:SYSLOG_SERVER|10.0.0.5 del. config save updates JSON (key gone)." },
        { node: "south", paths: ["south-file"], text: "hostcfgd SyslogCfg.syslog_server_update(key='10.0.0.5', op='DEL') fires. Handler re-renders rsyslog.conf.j2 (loop now skips 10.0.0.5, no entries left)." },
        { node: "file", paths: ["file-verify"], text: "Generated /etc/rsyslog.conf: line '*.* @10.0.0.5:514' REMOVED. File shows default config (local /var/log only). systemctl restart rsyslog." },
        { node: "verify", paths: [], text: "Verification: tcpdump on 10.0.0.5 → no more packets from switches. Switch logs now local-only (/var/log/syslog). Rollback complete in <10 seconds across 40 switches. ↩️✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "spine", label: "The Universal Change Spine ⭐" },
  { id: "case-ntp", label: "Case 1: Add NTP Server" },
  { id: "case-dhcp", label: "Case 2: Add DHCP Relay" },
  { id: "case-syslog", label: "Case 3: Add Remote Syslog ⭐" },
  { id: "case-aaa", label: "Case 4: Point Login at TACACS+ ⭐" },
  { id: "case-newfeature", label: "Case 5: Ship OpenConfig DNS Feature" },
  { id: "postmortems", label: "Postmortems — 6 Failure Patterns ⭐" },
  { id: "runbook", label: "Copy-Paste Runbook Template" },
  { id: "lab", label: "Lab: Execute Case Syslog End-to-End" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function CaseStudiesPage() {
  return (
    <TopicShell
      icon="📂"
      title="Production Case Studies — Five Real Changes"
      gradientWord="Case"
      subtitle="You've learned the theory — now see how SONiC changes actually run in production. This page walks through 5 real operational changes (add NTP server, add DHCP relay, add syslog, switch to TACACS+ login, ship a new OpenConfig feature), tracing each through the full spine: northbound command → CONFIG_DB diff → service reaction → generated file → verification. Every case includes the exact commands (curl AND CLI), before/after Redis keys, daemon logs, config file diffs, and a production twist (what went wrong + how to fix). Plus 6 real-world postmortems and a copy-paste runbook for any table."
      nav={NAV}
      badges={["5 real changes", "Every artifact shown", "Failure twists", "Runbook template"]}
      next={{ icon: "🐹", label: "Learn Go — the language of translib", href: "/golang" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="spine" number="01" title="The Universal Change Spine ⭐">
        <P>
          Every production config change in SONiC follows this 7-artifact spine (see diagram above):
        </P>
        <CodeBlock
          title="the_7_artifact_spine.txt"
          runnable={false}
          code={`1. TICKET          ops requirement (what + why)
2. NORTHBOUND OP   exact curl/CLI command (REST PATCH or config X add Y)
3. CONFIG_DB DIFF  redis-cli HGETALL before/after (what changed in DB 4)
4. SERVICE REACT   journalctl log showing daemon woke up (hostcfgd or mgrd)
5. GENERATED FILE  diff of /etc/daemon.conf before/after render
6. VERIFICATION    show command + health check (prove it works end-to-end)
7. ROLLBACK PLAN   DELETE command or restore from backup (undo path)

every case study below captures ALL 7 artifacts — this is your template
for documenting ANY change in production (and your interview answer format)`}
        />
        <P>
          ASCII runbook checklist (print this, fill in per change):
        </P>
        <CodeBlock
          title="change_checklist_template.txt"
          runnable={false}
          code={`CHANGE: _______________ (add NTP / add VLAN / etc.)
DATE: __________  SWITCHES: ______ (count or list)

☐ 1. BASELINE captured
     redis-cli -n 4 KEYS "TABLE|*"  → saved to baseline.txt
     cat /etc/daemon.conf            → saved to baseline_daemon.conf
☐ 2. CHANGE applied via: [ ] CLI  [ ] REST  [ ] Ansible
     command: ___________________________________________
☐ 3. CONFIG_DB verified
     redis-cli -n 4 HGETALL "TABLE|key"  → key exists ✓
☐ 4. Service log captured
     journalctl -u DAEMON -n 10 → handler fired ✓
☐ 5. Generated file diff captured
     diff baseline_daemon.conf /etc/daemon.conf → new lines ✓
☐ 6. Verification PASSED
     show command: ____________ → expected output ✓
     health check: ____________ → green ✓
☐ 7. config save run (if not auto-saved)
☐ 8. ROLLBACK tested (delete or restore)
     command: ___________________________________________
     verified undo: ✓

NOTES (what went wrong, how fixed):
_______________________________________________`}
        />
        <Callout type="tip">
          This is your production change template. Fill it out for EVERY config push. In interviews, when asked &quot;walk me
          through a change you made,&quot; the spine is your answer structure — you&apos;ll sound like you&apos;ve done this 100 times.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="case-ntp" number="02" title="Case 1: Add NTP Server 10.20.30.40">
        <P>
          <strong>Requirement:</strong> Point all ToR switches at internal NTP server 10.20.30.40 (currently using default pool.ntp.org).
        </P>

        <CodeBlock
          title="1_northbound_command.sh"
          code={`# METHOD 1: CLI
config ntp add 10.20.30.40

# METHOD 2: REST
curl -k -X PATCH \\
  "https://sonic-switch/restconf/data/openconfig-system:system/ntp/servers/server=10.20.30.40/config" \\
  -u admin:YourPaSsWoRd \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{
    "openconfig-system:config": {
      "address": "10.20.30.40"
    }
  }'`}
          output={`# CLI: (returns to prompt, no output)

# REST: HTTP/1.1 204 No Content`}
        />

        <CodeBlock
          title="2_config_db_diff.sh"
          code={`# BEFORE:
redis-cli -n 4 KEYS "NTP_SERVER|*"

# AFTER add:
redis-cli -n 4 KEYS "NTP_SERVER|*"
redis-cli -n 4 HGETALL "NTP_SERVER|10.20.30.40"`}
          output={`# BEFORE:
(empty array)

# AFTER:
1) "NTP_SERVER|10.20.30.40"

# HGETALL:
1) "NULL"
2) "NULL"`}
        />

        <CodeBlock
          title="3_service_reaction.sh"
          code={`journalctl -u hostcfgd -n 10 --no-pager | grep NTP`}
          output={`Jun 12 15:20:10 sonic INFO hostcfgd: NTP_SERVER SET: 10.20.30.40
Jun 12 15:20:10 sonic INFO hostcfgd: chronyd restarted`}
        />

        <CodeBlock
          title="4_generated_file_diff.txt"
          runnable={false}
          code={`--- /etc/chrony/chrony.conf.BEFORE
+++ /etc/chrony/chrony.conf.AFTER
@@ -1,4 +1,4 @@
-pool 2.debian.pool.ntp.org iburst
+server 10.20.30.40 iburst

 driftfile /var/lib/chrony/drift
 logdir /var/log/chrony`}
        />

        <CodeBlock
          title="5_verification.sh"
          code={`# SONiC show command:
show ntp

# chronyd health:
chronyc sources -v

# check sync status:
chronyc tracking`}
          output={`# show ntp:
NTP Servers
-------------
10.20.30.40

# chronyc sources:
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^* 10.20.30.40                   2   6   377     5   +200us[ +180us] +/-  1ms

(Reach=377 = 8/8 polls succeeded → healthy sync)

# chronyc tracking:
Reference ID    : 0A141E28 (10.20.30.40)
Stratum         : 3
System time     : 0.000180 seconds fast of NTP time`}
        />

        <Callout type="mistake">
          <strong>Production twist — what went wrong:</strong> Server 10.20.30.40 is unreachable from ToR switches (firewall blocks
          UDP 123 at core). Config applied cleanly, chronyd restarted, but Reach stays 0 (no polls succeed). Stratum shows 16 (unsynced).
          <br /><br />
          <strong>How to prove it&apos;s network, not SONiC:</strong> <IC>ping 10.20.30.40</IC> succeeds (ICMP OK), but
          <IC>tcpdump -i any udp port 123</IC> on switch shows NTP requests sent, zero replies. Root cause: firewall ACL on core router.
          <strong>Fix:</strong> Networking team adds permit for UDP 123 from ToR subnet. Within 64 seconds (next poll), Reach → 377. Config
          was correct all along — this was infrastructure, not SONiC.
        </Callout>

        <CodeBlock
          title="6_rollback.sh"
          code={`# ROLLBACK: remove the server
config ntp del 10.20.30.40

# verify removal:
redis-cli -n 4 KEYS "NTP_SERVER|*"
grep "10.20.30.40" /etc/chrony/chrony.conf
chronyc sources`}
          output={`# redis-cli: (empty)
# grep: (no match)
# chronyc sources: (10.20.30.40 no longer listed, reverts to pool.ntp.org)`}
        />
      </Section>

      {/* 03 */}
      <Section id="case-dhcp" number="03" title="Case 2: Add DHCP Relay Server to Vlan100">
        <P>
          <strong>Requirement:</strong> Vlan100 (10.100.0.1/24) hosts DHCP clients. Forward DHCP requests to DHCP server at 10.5.5.5.
        </P>

        <CodeBlock
          title="1_northbound_command.sh"
          code={`# CLI:
config interface ip dhcp-relay add Vlan100 10.5.5.5

# verify command accepted:
echo $?`}
          output={`0  (success)`}
        />

        <CodeBlock
          title="2_config_db_diff.sh"
          code={`# BEFORE:
redis-cli -n 4 HGETALL "DHCP_RELAY|Vlan100"

# AFTER:
redis-cli -n 4 HGETALL "DHCP_RELAY|Vlan100"`}
          output={`# BEFORE:
(empty or existing servers)

# AFTER:
1) "dhcp_servers@"
2) "10.5.5.5"

(@ suffix means list field; value is comma-separated if multiple servers)`}
        />

        <CodeBlock
          title="3_service_reaction.sh"
          code={`# DHCP relay runs in dhcp_relay container (not hostcfgd)
docker exec -it dhcp_relay supervisorctl status dhcrelay

# check container logs:
docker logs dhcp_relay --tail 20 | grep "10.5.5.5"`}
          output={`dhcrelay                         RUNNING   pid 142, uptime 0:00:05
(container restarted with new -a args)

INFO: dhcrelay started with servers: 10.5.5.5 on Vlan100`}
        />

        <CodeBlock
          title="4_generated_file_diff.txt"
          runnable={false}
          code={`DHCP relay doesn't use a config FILE — it's launched via supervisord
with command-line args. Check supervisord config:

/etc/supervisor/conf.d/dhcrelay.conf (generated by dhcp_relay mgrd):

--- BEFORE
+++ AFTER
-command=/usr/sbin/dhcrelay -d -m discard -a %%h:%%p %%P --name-alias-map-file /tmp/port-name-alias-map.txt -i Vlan100
+command=/usr/sbin/dhcrelay -d -m discard -a %%h:%%p %%P --name-alias-map-file /tmp/port-name-alias-map.txt -i Vlan100 -a 10.5.5.5

(note the added -a 10.5.5.5 flag)`}
        />

        <CodeBlock
          title="5_verification.sh"
          code={`# SONiC show command:
show dhcp_relay ipv4 helper

# test with a DHCP client on Vlan100:
# (on a host in Vlan100, run dhclient and tcpdump)
# on switch:
tcpdump -i Vlan100 -n udp port 67 or udp port 68`}
          output={`# show dhcp_relay:
Interface    DHCP Relay Address
-----------  --------------------
Vlan100      10.5.5.5

# tcpdump:
15:30:45.123 IP 10.100.0.10.68 > 255.255.255.255.67: BOOTREQUEST
15:30:45.124 IP 10.100.0.1.67 > 10.5.5.5.67: BOOTREQUEST (relayed)
15:30:45.130 IP 10.5.5.5.67 > 10.100.0.1.67: BOOTREPLY
15:30:45.131 IP 10.100.0.1.67 > 10.100.0.10.68: BOOTREPLY

(request relayed TO 10.5.5.5, reply relayed back → working)`}
        />

        <Callout type="mistake">
          <strong>Production twist:</strong> DHCP relay added, tcpdump shows requests forwarded to 10.5.5.5, but clients still fail to get IPs
          (DHCPDISCOVER → no DHCPOFFER). Root cause: <strong>DHCP server 10.5.5.5 scope misconfiguration</strong> — server has no pool
          defined for 10.100.0.0/24 subnet. Relay is working (you see packets arrive at server via server-side tcpdump), but server replies
          with DHCPNAK (no available addresses). <strong>Fix:</strong> ISC dhcpd.conf on 10.5.5.5 needs
          <IC>subnet 10.100.0.0 netmask 255.255.255.0 {`{range 10.100.0.100 10.100.0.200;}`}</IC>. After adding scope, clients get IPs.
          Lesson: DHCP relay config on switch was correct — failure was upstream infrastructure.
        </Callout>

        <CodeBlock
          title="6_rollback.sh"
          code={`config interface ip dhcp-relay del Vlan100 10.5.5.5

# verify:
show dhcp_relay ipv4 helper
redis-cli -n 4 HGETALL "DHCP_RELAY|Vlan100"`}
          output={`# show: (Vlan100 line removed or dhcp_servers field empty)
# redis: (empty or other servers if multiple were configured)`}
        />
      </Section>

      {/* 04 */}
      <Section id="case-syslog" number="04" title="Case 3: Add Remote Syslog 10.0.0.5 ⭐">
        <P>
          <strong>Requirement:</strong> Forward all syslog messages to centralized log collector at 10.0.0.5:514 (UDP).
        </P>

        <CodeBlock
          title="1_northbound_command.sh"
          code={`config syslog add 10.0.0.5`}
          output={`(no output, returns to prompt)`}
        />

        <CodeBlock
          title="2_config_db_diff.sh"
          code={`redis-cli -n 4 KEYS "SYSLOG_SERVER|*"
redis-cli -n 4 HGETALL "SYSLOG_SERVER|10.0.0.5"`}
          output={`1) "SYSLOG_SERVER|10.0.0.5"

1) "NULL"
2) "NULL"`}
        />

        <CodeBlock
          title="3_service_reaction.sh"
          code={`journalctl -u hostcfgd -n 10 --no-pager | grep -i syslog`}
          output={`Jun 12 16:05:22 sonic INFO hostcfgd: SYSLOG_SERVER SET: 10.0.0.5
Jun 12 16:05:22 sonic INFO hostcfgd: rsyslogd restarted`}
        />

        <CodeBlock
          title="4_generated_file_diff.txt"
          runnable={false}
          code={`--- /etc/rsyslog.conf.BEFORE
+++ /etc/rsyslog.conf.AFTER
@@ -18,6 +18,9 @@
 # Include all config files in /etc/rsyslog.d/
 \$IncludeConfig /etc/rsyslog.d/*.conf

+# SONiC remote syslog servers
+*.* @10.0.0.5:514
+
 ###############
 # RULES
 ###############

(line added: *.* @10.0.0.5:514 means forward all facilities/priorities
 to 10.0.0.5 UDP port 514 — @ means UDP, @@ would be TCP)`}
        />

        <CodeBlock
          title="5_verification.sh"
          code={`# on SONiC switch:
logger "TEST MESSAGE FROM SWITCH $(hostname)"

# on log server 10.0.0.5, listen:
tcpdump -i any -n udp port 514 -A | grep "TEST MESSAGE"`}
          output={`# tcpdump on 10.0.0.5:
16:06:10.555 IP 10.1.2.3.38472 > 10.0.0.5.514: SYSLOG, length: 78
<13>Jun 12 16:06:10 sonic admin: TEST MESSAGE FROM SWITCH sonic

(packet arrives with correct hostname and message → verified)`}
        />

        <Callout type="mistake">
          <strong>Production twist:</strong> Logs arrive at 10.0.0.5, but <strong>hostname is missing</strong> — syslog server sees messages as
          &quot;&lt;13&gt;Jun 12 16:06:10 : admin: TEST MESSAGE&quot; (no hostname field). Root cause: rsyslog.conf template format.
          Default template doesn&apos;t include FQDN or short hostname in forwarded messages.<br /><br />
          <strong>Fix:</strong> Edit /usr/share/sonic/templates/rsyslog/rsyslog.conf.j2 to use RFC5424 format or add
          <IC>\$ActionForwardDefaultTemplate RSYSLOG_ForwardFormat</IC> before the <IC>*.* @10.0.0.5:514</IC> line. Re-render:
          <IC>sonic-cfggen -d -t /usr/share/sonic/templates/rsyslog/rsyslog.conf.j2 &gt; /etc/rsyslog.conf</IC>, then
          <IC>systemctl restart rsyslog</IC>. Now logs include hostname. This is a template customization, not a CONFIG_DB issue.
        </Callout>

        <CodeBlock
          title="6_rollback.sh"
          code={`config syslog del 10.0.0.5

# verify:
redis-cli -n 4 KEYS "SYSLOG_SERVER|*"
grep "10.0.0.5" /etc/rsyslog.conf
# (should have no match after rollback)`}
          output={`(empty)
(no match)`}
        />
      </Section>

      {/* 05 */}
      <Section id="case-aaa" number="05" title="Case 4: Point Login at TACACS+ Server ⭐">
        <P>
          <strong>Requirement:</strong> Switch SSH login to use TACACS+ server 10.9.9.9 for auth, fallback to local if TACACS down.
        </P>

        <CodeBlock
          title="1_northbound_commands.sh"
          code={`# Step 1: Add TACACS+ server
config tacacs add 10.9.9.9
config tacacs passkey YourTacacsSecret

# Step 2: Set AAA auth method (tacacs+ first, then local fallback)
config aaa authentication login tacacs+ local

# verify:
show tacacs
show aaa`}
          output={`TACPLUS global passkey <EMPTY_STRING>

TACPLUS_SERVER  address    priority  tcp_port  timeout  auth_type  vrf
--------------  ---------  --------  --------  -------  ---------  -----
10.9.9.9        10.9.9.9   1         49        5        pap        mgmt

AAA authentication login tacacs+ local (default)
AAA authentication failthrough False (default)`}
        />

        <CodeBlock
          title="2_config_db_diff.sh"
          code={`# BEFORE:
redis-cli -n 4 HGETALL "TACPLUS_SERVER|10.9.9.9"
redis-cli -n 4 HGETALL "AAA|authentication"

# AFTER:
redis-cli -n 4 HGETALL "TACPLUS_SERVER|10.9.9.9"
redis-cli -n 4 HGETALL "AAA|authentication"`}
          output={`# BEFORE TACPLUS_SERVER: (empty)
# BEFORE AAA: login = "local" (or empty, defaults local)

# AFTER TACPLUS_SERVER:
1) "priority"
2) "1"
3) "tcp_port"
4) "49"
5) "timeout"
6) "5"
7) "passkey"
8) "YourTacacsSecret"

# AFTER AAA:
1) "login"
2) "tacacs+,local"`}
        />

        <CodeBlock
          title="3_service_reaction.sh"
          code={`journalctl -u hostcfgd -n 20 --no-pager | grep -E "(TACPLUS|AAA)"`}
          output={`Jun 12 17:10:05 sonic INFO hostcfgd: TACPLUS_SERVER SET: 10.9.9.9
Jun 12 17:10:05 sonic INFO hostcfgd: Updating PAM configuration
Jun 12 17:10:06 sonic INFO hostcfgd: AAA authentication SET: login=tacacs+,local
Jun 12 17:10:06 sonic INFO hostcfgd: nsswitch.conf updated`}
        />

        <CodeBlock
          title="4_generated_files_diff.txt"
          runnable={false}
          code={`--- /etc/pam.d/common-auth-sonic.BEFORE
+++ /etc/pam.d/common-auth-sonic.AFTER
@@ -1,5 +1,6 @@
 # SONiC PAM configuration (managed by hostcfgd)
-auth    [success=1 default=ignore]  pam_unix.so nullok_secure
+auth    [success=2 default=ignore]  pam_tacplus.so server=10.9.9.9:49 secret=YourTacacsSecret login=pap timeout=5
+auth    [success=1 default=ignore]  pam_unix.so nullok_secure try_first_pass
 auth    requisite                   pam_deny.so
 auth    required                    pam_permit.so

--- /etc/nsswitch.conf.BEFORE
+++ /etc/nsswitch.conf.AFTER
@@ -5,7 +5,7 @@
-passwd:         compat
-group:          compat
+passwd:         tacplus compat
+group:          tacplus compat

(pam_tacplus.so added BEFORE pam_unix.so → TACACS tried first.
 try_first_pass on pam_unix means if TACACS fails, Unix local auth is fallback.
 nsswitch.conf adds 'tacplus' to passwd/group lookups for username resolution.)`}
        />

        <CodeBlock
          title="5_verification.sh"
          code={`# Test SSH login with TACACS+ user (not in local /etc/passwd):
ssh tacacs-user@sonic-switch
# (enter TACACS password, should succeed)

# on switch, check PAM debug (optional):
tail -f /var/log/auth.log`}
          output={`# auth.log on successful TACACS login:
Jun 12 17:15:10 sonic sshd[5432]: pam_tacplus: connected to 10.9.9.9:49
Jun 12 17:15:10 sonic sshd[5432]: pam_tacplus: Authentication succeeded for tacacs-user
Jun 12 17:15:10 sonic sshd[5432]: Accepted password for tacacs-user from 10.1.2.3 port 55123 ssh2

(TACACS auth successful → user logged in without existing in /etc/passwd)`}
        />

        <Callout type="mistake">
          <strong>Production twist — DISASTER scenario:</strong> TACACS+ server 10.9.9.9 goes down (network outage). Admins try to SSH
          to switch → TACACS times out (5 seconds), then falls back to local... BUT all admin accounts were TACACS-only (no local
          password set). <strong>Everyone locked out.</strong><br /><br />
          <strong>Why fallback didn&apos;t save them:</strong> &quot;tacacs+ local&quot; means try TACACS first, IF TACACS explicitly
          rejects (bad password), fall back to local. But if TACACS server is <em>unreachable</em> (timeout), PAM may not fall back
          cleanly depending on pam_tacplus.so config. Some versions treat timeout as hard failure.<br /><br />
          <strong>Emergency recovery:</strong> Console access (serial or IPMI SOL) → boot into single-user mode → mount filesystem →
          edit /etc/pam.d/common-auth-sonic, comment out pam_tacplus line, reboot. OR: have at least one local admin account with
          password set (passwd admin) BEFORE enabling TACACS. <strong>Lesson:</strong> ALWAYS test TACACS fallback by unplugging
          server, verify local login works. Production networks keep one break-glass local account.
        </Callout>

        <CodeBlock
          title="6_rollback.sh"
          code={`# ROLLBACK: revert to local-only auth
config aaa authentication login local
config tacacs delete 10.9.9.9

# verify:
show aaa
cat /etc/pam.d/common-auth-sonic | grep tacplus`}
          output={`AAA authentication login local

(no match — pam_tacplus line removed, back to pam_unix only)`}
        />
      </Section>

      {/* 06 */}
      <Section id="case-newfeature" number="06" title="Case 5: Ship OpenConfig DNS Search-Domain Feature">
        <P>
          <strong>Requirement:</strong> Add support for /openconfig-system:system/dns/config/search (DNS search domain, e.g., example.com),
          writing to /etc/resolv.conf. Currently SONiC doesn&apos;t support this OC leaf.
        </P>
        <P>
          This is a <strong>feature development</strong> case (not just config change). Condensed 10-step recipe:
        </P>

        <CodeBlock
          title="10_step_feature_recipe.txt"
          runnable={false}
          code={`STEP 1: Upstream YANG (already exists)
  openconfig-system.yang has /system/dns/config/search (leaf-list of domains).

STEP 2: SONiC YANG schema
  Create sonic-dns.yang (or extend sonic-system.yang):
    container DNS {
      list DNS_SEARCH_DOMAIN {
        key "domain";
        leaf domain { type string; }
      }
    }
  Or simpler: DNS table with search_domains@ field (list).

STEP 3: Annotation
  openconfig-system-annot.yang:
    deviation /oc-sys:system/oc-sys:dns/oc-sys:config/oc-sys:search {
      deviate add {
        sonic-ext:table-name "DNS";
        sonic-ext:field-name "search_domains@";  // @ = list field
      }
    }

STEP 4: Transformer (if needed)
  If annotation alone suffices (simple field map), NO custom xfmr needed.
  Common_app will handle it. If complex (e.g., multiple tables), write xfmr.

STEP 5: CVL validation
  sonic-dns.yang: pattern constraint on domain (valid DNS label regex).
  CVL auto-validates during translib write.

STEP 6: hostcfgd handler
  hostcfgd (Python): subscribe to DNS table:
    class DnsCfg:
      def dns_update(self, key, op):
        # render /etc/resolv.conf via sonic-cfggen
        os.system("sonic-cfggen -d -t resolv.conf.j2 > /etc/resolv.conf")

STEP 7: Jinja2 template
  /usr/share/sonic/templates/dns/resolv.conf.j2:
    {% if DNS.search_domains %}
    search {{ DNS.search_domains | join(' ') }}
    {% endif %}
    {% for ns in DNS_NAMESERVER %}
    nameserver {{ ns }}
    {% endfor %}

STEP 8: Unit tests
  sonic-mgmt-common/translib/test/: test_dns_search.go
    - PATCH /system/dns/config/search = ["example.com", "corp.local"]
    - verify CONFIG_DB: DNS table has search_domains@="example.com,corp.local"
    - verify CVL rejects invalid domain "invalid..domain"
  cvl/testdata/: add DNS schema test case

STEP 9: Integration test
  sonic-mgmt/tests/: write test_dns_search.py
    - apply config via REST
    - cat /etc/resolv.conf on DUT → verify "search example.com corp.local"
    - nslookup short-name → verify search domain appended

STEP 10: PR workflow
  File PRs to 4 repos (assume feature branches, CI/CD):
    1. sonic-mgmt-common: YANG, annotation, transformer (if any), tests
    2. sonic-mgmt-framework: (usually no change, unless REST server tweak)
    3. sonic-buildimage: templates (resolv.conf.j2), hostcfgd update
    4. sonic-mgmt: integration test
  Reviewers: mgmt-framework maintainers, YANG experts, test team.
  After approval + merge, feature ships in next SONiC release (e.g., 202411).

ROLLOUT to production:
  - Image build includes new code.
  - Deploy to canary switch (test ENV), verify DNS search works.
  - Gradual rollout to fleet (10% → 50% → 100% over 2 weeks).
  - Monitor: no regressions in DNS resolution (Prometheus metrics).`}
        />

        <Callout type="tip">
          This 10-step recipe is your answer to &quot;how would you design a new feature in SONiC?&quot; in architect-level interviews.
          You just demonstrated: YANG modeling, annotation-driven mapping, CVL validation, event-driven orchestration (hostcfgd),
          template rendering, test pyramid (unit + integration), and production rollout. This is end-to-end SONiC feature delivery.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="postmortems" number="07" title="Postmortems — 6 Real-World Failure Patterns ⭐">
        <Table
          head={["Failure pattern", "Symptom", "Root cause", "Prevention"]}
          rows={[
            [
              "Config in Redis but service never notified",
              "CONFIG_DB has key, show command reflects it, but daemon unchanged (e.g., /etc/chrony.conf missing NTP server). No restart happened.",
              "hostcfgd or config daemon (vlanmgrd, intfmgrd) crashed or not subscribed to table. Keyspace event fired but no listener. OR subscriber pattern mismatch (table name typo).",
              "1) ALWAYS check journalctl -u hostcfgd (or daemon) after change. 2) Supervisord auto-restart for critical daemons. 3) Unit test: mock Redis, verify subscriber pops event.",
            ],
            [
              "Double-restart storms from flapping handlers",
              "systemctl restart DAEMON runs in loop (10+ times/min). Daemon never stabilizes. CONFIG_DB unchanged but handler keeps firing.",
              "Handler re-writes CONFIG_DB as side-effect (e.g., buggy script does config save inside handler), triggers own keyspace event → infinite loop. OR template render fails, handler retries forever.",
              "1) Handlers must be idempotent, NEVER write to CONFIG_DB (read-only). 2) Rate-limit restarts (systemd RestartSec=5s). 3) Circuit-breaker: if restart fails 3x, alert and stop (manual intervention).",
            ],
            [
              "CVL dependency deadlock on delete order",
              "DELETE VLAN fails with 'dependency exists' (VLAN_MEMBER references it). User deletes members first, THEN VLAN → works. But Ansible playbook deletes in wrong order → fails.",
              "CVL leafref validation: VLAN_MEMBER.vlan → VLAN table. Deleting VLAN while members exist violates constraint. CVL correctly rejects. But no auto-cascade delete (not implemented).",
              "1) Document delete order in runbooks (members before parent). 2) Translib could batch-delete (MULTI/EXEC with dep-sorted order), but not implemented. 3) Automation scripts must toposort deletes.",
            ],
            [
              "Template rendered empty, wiping daemon config",
              "/etc/daemon.conf becomes 0 bytes or minimal (missing all entries). Daemon starts but has no config → service broken. Previous config lost.",
              "sonic-cfggen UndefinedError: template refs CONFIG_DB key that doesn't exist (e.g., {% for server in NTP_SERVER %} but NTP_SERVER table is empty AND template has no {% if NTP_SERVER %} guard). Jinja2 fails mid-render, partial file written (or empty if it crashes early).",
              "1) Templates MUST have defensive {% if TABLE %} checks. 2) sonic-cfggen should write to /tmp, validate (non-zero size, syntax check), THEN mv to /etc (atomic). 3) Keep backup of last-known-good config (/etc/daemon.conf.bak).",
            ],
            [
              "gNMI subscription leak (memory grows until OOM)",
              "mgmt-framework container memory grows 10MB/hour. After days, OOM killer kills container. gNMI clients see disconnect, reconnect, repeat.",
              "gNMI Subscribe clients disconnect without UNSUBSCRIBE (network drop, client crash). Server goroutine + Redis psubscribe kept alive (leak). 100 clients over 1 week = 100 leaked goroutines + connections.",
              "1) Server-side timeout: if no data sent to client for 5min, close stream. 2) Redis connection pooling with max-age. 3) Monitor: Prometheus metric for active subscriptions, alert on anomaly. 4) Graceful restart of mgmt-framework weekly (clear leaks).",
            ],
            [
              "config reload vs warm-restart surprises",
              "'config reload' wipes running config, applies config_db.json. BUT user had uncommitted changes (config vlan add, no config save). After reload, VLANs gone. Traffic outage.",
              "config reload = destructive (Redis FLUSHDB, load JSON). If user didn't 'config save', changes lost. Warm-restart is supposed to preserve state, but mgmt-framework container may restart (FEATURE table auto_restart=true) → same loss.",
              "1) Enforce 'config save' via commit workflow (e.g., require save before reload). 2) Pre-reload diff: show running vs config_db.json, prompt user. 3) Auto-save on every write (trade-off: disk wear, but safer). 4) Backup config_db.json with timestamp before reload.",
            ],
          ]}
        />
        <P>
          Each of these patterns has happened in real SONiC deployments. Knowing them = you debug faster AND design safer changes.
        </P>
      </Section>

      {/* 08 */}
      <Section id="runbook" number="08" title="Copy-Paste Production Change Runbook">
        <CodeBlock
          title="generic_sonic_change_runbook.sh"
          code={`#!/bin/bash
# SONiC Production Change Runbook (parameterized)
# USAGE: ./runbook.sh <TABLE> <KEY> <FIELD> <VALUE> <DAEMON>
# Example: ./runbook.sh NTP_SERVER 10.1.1.1 NULL NULL hostcfgd

TABLE=\${1}
KEY=\${2}
FIELD=\${3}
VALUE=\${4}
DAEMON=\${5}  # e.g., hostcfgd, vlanmgrd

echo "=== PRE-CHANGE BASELINE ==="
redis-cli -n 4 KEYS "\${TABLE}|*" > /tmp/baseline_redis.txt
cat /tmp/baseline_redis.txt

if [ -n "\${DAEMON}" ]; then
  journalctl -u "\${DAEMON}" -n 5 --no-pager > /tmp/baseline_daemon.log
fi

echo "=== APPLYING CHANGE ==="
redis-cli -n 4 HSET "\${TABLE}|\${KEY}" "\${FIELD}" "\${VALUE}"
config save -y

echo "=== POST-CHANGE VERIFICATION ==="
sleep 2  # allow propagation
redis-cli -n 4 HGETALL "\${TABLE}|\${KEY}"

if [ -n "\${DAEMON}" ]; then
  journalctl -u "\${DAEMON}" -n 10 --no-pager | grep "\${TABLE}"
fi

echo "=== VERIFICATION CHECKLIST (manual) ==="
echo "1. Check generated file (e.g., /etc/daemon.conf)"
echo "2. Run 'show' command for this feature"
echo "3. Health check (ping, tcpdump, service status)"
echo "4. If FAIL: rollback with: redis-cli -n 4 DEL '\${TABLE}|\${KEY}'; config save"

echo "=== DONE ==="`}
          runnable={false}
        />
        <P>
          Parameterize this script or adapt to Ansible. For every change, you capture baseline → apply → verify → document rollback.
        </P>
      </Section>

      {/* 09 */}
      <Section id="lab" number="09" title="Lab: Execute Case Syslog End-to-End">
        <P>
          Run this on a SONiC VM or hardware switch. Capture all 7 artifacts of the spine for SYSLOG_SERVER.
        </P>
        <CodeBlock
          title="lab_syslog_full_spine.sh"
          code={`# SETUP: you need a syslog server listening (your laptop or VM at 10.0.0.5)
# On server: nc -u -l 514  (netcat UDP listener)

# ON SONIC SWITCH:

# 1. BASELINE
redis-cli -n 4 KEYS "SYSLOG_SERVER|*" > /tmp/lab_baseline.txt
cat /etc/rsyslog.conf > /tmp/lab_rsyslog_before.conf

# 2. APPLY CHANGE
config syslog add 10.0.0.5

# 3. CAPTURE CONFIG_DB
redis-cli -n 4 HGETALL "SYSLOG_SERVER|10.0.0.5" > /tmp/lab_redis_after.txt

# 4. CAPTURE SERVICE LOG
journalctl -u hostcfgd -n 5 --no-pager | grep SYSLOG > /tmp/lab_hostcfgd.log

# 5. CAPTURE FILE DIFF
cat /etc/rsyslog.conf > /tmp/lab_rsyslog_after.conf
diff /tmp/lab_rsyslog_before.conf /tmp/lab_rsyslog_after.conf

# 6. VERIFICATION
logger "LAB TEST FROM \$(hostname) at \$(date)"
# (check nc listener on 10.0.0.5 — should see the message)

# 7. ROLLBACK
config syslog del 10.0.0.5
redis-cli -n 4 KEYS "SYSLOG_SERVER|*"
# (should be empty again)

# DELIVERABLE: tar all /tmp/lab_*.txt files, this is your proof of spine execution.
tar czf ~/sonic_syslog_lab_$(date +%F).tar.gz /tmp/lab_*`}
          output={`# Expected outputs:
baseline: (empty or existing syslog servers)
redis_after: NULL NULL
hostcfgd.log: "SYSLOG_SERVER SET: 10.0.0.5"
diff: +*.* @10.0.0.5:514
nc listener: <13>Jun 12 ... sonic admin: LAB TEST FROM sonic ...
rollback: (empty)

Tarball created: ~/sonic_syslog_lab_2026-06-12.tar.gz`}
        />
        <Callout type="note">
          If you capture these 7 artifacts cleanly, you&apos;ve proven end-to-end understanding. In an interview, describe this lab
          as &quot;a production change I executed and documented&quot; — you have the receipts.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="interview" number="10" title="Interview Case Questions">
        <Table
          head={["Question", "Strong answer (framework: ticket→command→verify→twist→fix)"]}
          rows={[
            [
              "Walk me through adding a syslog server to a SONiC switch.",
              "TICKET: forward logs to 10.0.0.5. COMMAND: config syslog add 10.0.0.5 OR REST PATCH /openconfig-system:system/logging/remote-servers/remote-server=10.0.0.5. CONFIG_DB: HSET SYSLOG_SERVER|10.0.0.5 NULL NULL. SERVICE: hostcfgd wakes, renders rsyslog.conf.j2 → /etc/rsyslog.conf adds '*.* @10.0.0.5:514', restarts rsyslog. VERIFY: logger test → tcpdump on 10.0.0.5 shows packet. TWIST: logs arrive without hostname → fix template to use RSYSLOG_ForwardFormat.",
            ],
            [
              "How do you verify an NTP change propagated correctly?",
              "After 'config ntp add X.X.X.X': (1) redis-cli -n 4 HGETALL NTP_SERVER|X.X.X.X → NULL NULL. (2) journalctl -u hostcfgd | grep NTP → 'NTP_SERVER SET' log. (3) grep X.X.X.X /etc/chrony/chrony.conf → 'server X.X.X.X iburst'. (4) chronyc sources → Reach=377 for X.X.X.X (8/8 polls succeed). If Reach=0 → network issue, not config.",
            ],
            [
              "Config applied but daemon unchanged — how do you debug?",
              "Hop-by-hop triage: (1) CONFIG_DB: redis-cli -n 4 HGETALL TABLE|key → key exists? If no, CVL rejected or translib bug. (2) hostcfgd: journalctl -u hostcfgd → handler log present? If no, daemon crashed or not subscribed. (3) File: cat /etc/daemon.conf → re-rendered? If no, sonic-cfggen UndefinedError (check syslog). (4) Daemon: systemctl status daemon → running? If crashed, config syntax error. This maps to NTP flow §11 verification table.",
            ],
            [
              "TACACS+ configured but users locked out when server down — what happened?",
              "AAA config: login=tacacs+,local. When TACACS server unreachable (timeout, not explicit reject), pam_tacplus may treat as hard failure (no fallback). OR all users were TACACS-only (no local /etc/passwd entry). RECOVERY: console access → single-user mode → edit /etc/pam.d/common-auth-sonic, comment pam_tacplus, reboot. PREVENTION: (1) test fallback by unplugging TACACS server before prod, (2) keep one break-glass local admin account with password set.",
            ],
            [
              "How would you design a runbook for a new SONiC feature?",
              "Use the 7-artifact spine: (1) Ticket (requirement), (2) Northbound command (curl + CLI), (3) CONFIG_DB diff (redis-cli before/after), (4) Service log (journalctl), (5) Generated file diff (cat /etc/ before/after), (6) Verification (show + health), (7) Rollback (DELETE + verify undo). Template this in Markdown/Ansible, parameterize TABLE/KEY/DAEMON. Every prod change follows this checklist — auditability + repeatability.",
            ],
            [
              "Production outage: config reload wiped uncommitted VLANs. How prevent?",
              "Root cause: user ran 'config vlan add' but no 'config save'. config reload does FLUSHDB + load config_db.json (destructive). PREVENTION: (1) Enforce commit workflow: require 'config save' before reload (CI check or interactive prompt). (2) Pre-reload diff: compare running config (show run) vs config_db.json, warn if divergence. (3) Auto-save on every write (trade-off: disk wear). (4) Backup config_db.json with timestamp before reload (rollback safety net).",
            ],
            [
              "CVL passed, orchagent logged success, but ASIC didn't apply. Debug flow?",
              "CONFIG_DB write succeeded (CVL validated), orchagent read from APPL_DB, called SAI, SAI returned success to orchagent. BUT ASIC hardware state wrong. SUSPECTS: (1) SAI shim bug (reported success, didn't write ASIC_DB). (2) syncd crash after orchagent write (ASIC_DB entry lost). (3) Vendor SDK bug (SAI call succeeded, SDK didn't program ASIC). DEBUG: (1) redis-cli -n 1 KEYS ASIC_STATE:* (check ASIC_DB). (2) show platform software → is syncd running? (3) bcmsh or SAI debug logs (vendor-specific). (4) Compare 'show' output vs CONFIG_DB (state mismatch = SAI/SDK issue, not SONiC mgmt).",
            ],
            [
              "Describe a SONiC change that went wrong and how you fixed it.",
              "SCENARIO: Added DHCP relay to Vlan100 (10.5.5.5). Config applied cleanly, tcpdump showed requests forwarded to server, but clients got no IPs. DEBUGGING: tcpdump on server (10.5.5.5) confirmed packets arrived, but server replied DHCPNAK. ROOT CAUSE: DHCP server scope missing for 10.100.0.0/24 subnet. FIX: ISC dhcpd.conf on server needed 'subnet 10.100.0.0 netmask 255.255.255.0 { range 10.100.0.100 10.100.0.200; }'. Added scope, clients got IPs. LESSON: SONiC config was correct — failure was upstream infrastructure. Always verify end-to-end (not just SONiC hop).",
            ],
          ]}
        />
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["7-artifact spine", "ticket → northbound → CONFIG_DB diff → service log → file diff → verify → rollback"],
            ["Case NTP key", "NTP_SERVER|10.20.30.40 → {NULL:NULL} → chrony.conf.j2 → chronyd"],
            ["Case DHCP key", "DHCP_RELAY|Vlan100 dhcp_servers@=10.5.5.5 → supervisord args -a 10.5.5.5"],
            ["Case syslog key", "SYSLOG_SERVER|10.0.0.5 → rsyslog.conf '*.* @10.0.0.5:514' → UDP 514"],
            ["Case AAA keys", "TACPLUS_SERVER|10.9.9.9 + AAA|authentication login=tacacs+,local → pam.d"],
            ["Verification triple", "redis-cli (CONFIG_DB) → journalctl (daemon log) → cat /etc/ (file) → show (CLI)"],
            ["Rollback pattern", "config X del Y OR REST DELETE → verify key gone → file re-rendered without entry"],
            ["Failure: config in DB, file unchanged", "hostcfgd didn't run → journalctl -u hostcfgd (crashed or not subscribed)"],
            ["Failure: TACACS lockout", "Server down + no local password → console recovery, edit pam.d, reboot"],
            ["Failure: config reload wipe", "No 'config save' → changes lost → enforce save workflow + backup JSON"],
            ["New feature 10 steps", "YANG → annot → xfmr → CVL → hostcfgd → template → tests → PR → rollout"],
            ["Postmortem pattern", "Template rendered empty (no {% if %} guard) → sonic-cfggen fail → 0-byte file"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
