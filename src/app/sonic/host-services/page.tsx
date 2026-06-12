"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "hostcfgd: the CONFIG_DB-to-systemd bridge",
  nodes: [
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "NTP_SERVER table", x: 8, y: 50, color: "#22d3ee" },
    { id: "notif", icon: "📣", label: "keyspace notify", sub: "pub/sub event", x: 26, y: 50, color: "#fb923c" },
    { id: "hostcfgd", icon: "🐍", label: "hostcfgd", sub: "python daemon", x: 44, y: 50, color: "#a78bfa" },
    { id: "handler", icon: "🧩", label: "NtpCfg handler", sub: "table subscriber", x: 62, y: 20, color: "#34d399" },
    { id: "jinja", icon: "🧩", label: "Jinja render", sub: "chrony.conf.j2", x: 62, y: 80, color: "#60a5fa" },
    { id: "systemd", icon: "🔧", label: "systemctl", sub: "restart chrony", x: 80, y: 50, color: "#fbbf24" },
    { id: "daemon", icon: "⏰", label: "chronyd", sub: "syncs time", x: 93, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "redis-notif", from: "redis", to: "notif", color: "#fb923c" },
    { id: "notif-hostcfgd", from: "notif", to: "hostcfgd", color: "#a78bfa" },
    { id: "hostcfgd-handler", from: "hostcfgd", to: "handler", color: "#34d399" },
    { id: "hostcfgd-jinja", from: "hostcfgd", to: "jinja", color: "#60a5fa" },
    { id: "handler-systemd", from: "handler", to: "systemd", color: "#fbbf24" },
    { id: "jinja-systemd", from: "jinja", to: "systemd", color: "#fbbf24" },
    { id: "systemd-daemon", from: "systemd", to: "daemon", color: "#34d399" },
    { id: "jinja-err", from: "jinja", to: "hostcfgd", bend: 20, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "ntp-add",
      name: "🟢 NTP server added",
      command: "config ntp add 10.1.1.1  OR  REST PATCH /system/ntp/servers/...",
      steps: [
        { node: "redis", paths: ["redis-notif"], text: "CONFIG_DB write: HSET NTP_SERVER|10.1.1.1 association_type server iburst on. Redis publishes keyspace notification to __keyspace@4__:NTP_SERVER|*" },
        { node: "notif", paths: ["notif-hostcfgd"], text: "Redis pub/sub: notification arrives at all subscribers. hostcfgd has a ConfigDBConnector() subscribed to NTP_SERVER table." },
        { node: "hostcfgd", paths: ["hostcfgd-handler", "hostcfgd-jinja"], text: "hostcfgd event loop receives notification. Looks up handler for NTP_SERVER → NtpCfg class. Calls ntp_server_handler(key='10.1.1.1', data={...})." },
        { node: "handler", paths: ["handler-systemd"], text: "NtpCfg reads ENTIRE NTP + NTP_SERVER tables from CONFIG_DB (not just the changed key — full state needed for template)." },
        { node: "jinja", paths: ["jinja-systemd"], text: "Jinja2 renders /usr/share/sonic/templates/chrony.conf.j2 with servers=[10.1.1.1, ...]. Writes /etc/chrony/chrony.conf (or ntp.conf if ntp mode)." },
        { node: "systemd", paths: ["systemd-daemon"], text: "os.system('systemctl restart ntp-config.service') — triggers chronyd to reload config. (ntp-config is a oneshot unit that restarts chrony)." },
        { node: "daemon", paths: [], text: "chronyd reads /etc/chrony/chrony.conf, sees 'server 10.1.1.1 iburst', starts syncing. chronyc sources shows new server. ✅" },
      ],
    },
    {
      id: "template-fail",
      name: "🔴 Template render fails",
      command: "Bad data in CONFIG_DB (e.g., malformed IP in NTP_SERVER key)",
      steps: [
        { node: "redis", paths: ["redis-notif"], text: "CONFIG_DB: HSET NTP_SERVER|not-an-ip ... (CVL should have caught this, but hypothetically it slipped through or was set via redis-cli directly)." },
        { node: "notif", paths: ["notif-hostcfgd"], text: "Keyspace notification arrives. hostcfgd wakes up, calls NtpCfg handler." },
        { node: "handler", paths: ["hostcfgd-jinja"], text: "NtpCfg reads NTP_SERVER|not-an-ip. Tries to pass to Jinja template." },
        { node: "jinja", paths: ["jinja-err"], text: "Jinja renders 'server not-an-ip iburst' into chrony.conf (Jinja doesn't validate IPs, just substitutes). File written but INVALID." },
        { node: "hostcfgd", paths: [], text: "systemctl restart ntp-config fails (chronyd rejects the config, systemd reports failure). Exception logged to syslog. hostcfgd continues (doesn't crash)." },
        { node: "daemon", paths: [], text: "chronyd still running with OLD config (systemd restart failed, so old chronyd process kept). No new server added. User must check syslog + fix CONFIG_DB." },
      ],
    },
    {
      id: "feature-toggle",
      name: "🔵 Feature enable/disable",
      command: "config feature state lldp enabled  (or disabled)",
      steps: [
        { node: "redis", paths: ["redis-notif"], text: "CONFIG_DB: HSET FEATURE|lldp state enabled auto_restart enabled. (FEATURE table controls which Docker containers run)." },
        { node: "notif", paths: ["notif-hostcfgd"], text: "Keyspace notification on FEATURE table. hostcfgd has FeatureHandler subscribed." },
        { node: "hostcfgd", paths: ["hostcfgd-handler"], text: "FeatureHandler.feature_state_handler('lldp', {state: enabled, auto_restart: enabled, ...}). Reads desired state." },
        { node: "handler", paths: ["handler-systemd"], text: "If state=enabled: systemctl enable lldp.service && systemctl start lldp.service. If disabled: systemctl stop lldp && systemctl disable lldp." },
        { node: "systemd", paths: ["systemd-daemon"], text: "systemd starts docker-lldp.service → docker start lldp container. lldpd daemon now running inside container." },
        { node: "daemon", paths: [], text: "lldp container UP. show lldp neighbors works. If state was 'disabled', container stopped, show lldp returns empty. ✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "gap", label: "The Gap: CONFIG_DB → Linux Daemons" },
  { id: "what", label: "What Is sonic-host-services?" },
  { id: "how-works", label: "How hostcfgd Works ⭐" },
  { id: "ntp", label: "NTP: NTP_SERVER → chrony ⭐" },
  { id: "syslog", label: "Syslog: SYSLOG_SERVER → rsyslog" },
  { id: "snmp", label: "SNMP: SNMP tables → snmpd" },
  { id: "aaa", label: "AAA/TACACS: → PAM + NSS" },
  { id: "dhcp-relay", label: "DHCP Relay: DHCP_RELAY → container" },
  { id: "feature", label: "Feature Control: FEATURE table → systemd" },
  { id: "full-chain", label: "Full Chain Diagram ⭐" },
  { id: "debugging", label: "Debugging hostcfgd" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicHostServicesPage() {
  return (
    <TopicShell
      icon="🛠️"
      title="Host Services — From CONFIG_DB to Linux Daemons"
      gradientWord="Host"
      subtitle="CONFIG_DB holds the desired state, but chronyd, rsyslog, snmpd, PAM are plain Linux services that read /etc files. Who connects them? sonic-host-services: a Python daemon (hostcfgd) that subscribes to CONFIG_DB changes, renders Jinja templates, writes /etc configs, and restarts systemd units. The bridge between SONiC and the host OS."
      nav={NAV}
      badges={["🐍 Real Python patterns", "🧩 Jinja templates", "📋 Every major service", "🔍 journalctl tactics"]}
      next={{ icon: "🧩", label: "Jinja Templates", href: "/sonic/jinja-templates" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="gap" number="01" title="The Gap: CONFIG_DB → Linux Daemons">
        <P>
          SONiC stores all configuration in Redis <IC>CONFIG_DB</IC>. REST/gNMI writes go there. But the host OS runs
          standard Linux daemons — <IC>chronyd</IC> (NTP), <IC>rsyslogd</IC>, <IC>snmpd</IC>, <IC>sshd</IC> — that
          know nothing about Redis. They read <IC>/etc/chrony/chrony.conf</IC>, <IC>/etc/rsyslog.conf</IC>, etc.
        </P>
        <CodeBlock
          title="the_gap.txt"
          runnable={false}
          code={`The problem:
  CONFIG_DB:NTP_SERVER|10.1.1.1  {association_type: server, iburst: on}
      ↓
      ??? who writes this to /etc/chrony/chrony.conf ???
      ↓
  /etc/chrony/chrony.conf:
    server 10.1.1.1 iburst
      ↓
  chronyd reads config, syncs time

Without a bridge:
  - You PATCH /system/ntp/servers via REST → CONFIG_DB updated
  - chronyd sees nothing, keeps old servers
  - User must manually run "systemctl restart chrony" → fragile, not automated

The solution: hostcfgd (host config daemon)
  - Python daemon running on the HOST (not in a container)
  - Subscribes to CONFIG_DB tables via Redis pub/sub
  - On change: renders Jinja template → writes /etc file → restarts systemd unit
  - Daemon-agnostic pattern: same for NTP, syslog, SNMP, AAA, DHCP relay, ...`}
        />
        <Callout type="analogy">
          Think of hostcfgd as a &quot;config file butler.&quot; CONFIG_DB is the master ledger, /etc files are the
          servant copies. Whenever the ledger changes, the butler re-writes the copies and tells the staff (daemons)
          to reload. The staff never see the ledger directly.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what" number="02" title="What Is sonic-host-services?">
        <P>
          <strong>sonic-host-services</strong> is the repo (github.com/sonic-net/sonic-host-services) that contains:
        </P>
        <CodeBlock
          title="sonic_host_services_tree.txt"
          runnable={false}
          code={`sonic-host-services/
├── scripts/
│   └── hostcfgd          ← THE daemon (Python, ~2000 lines)
├── host_modules/         ← D-Bus services for gNOI (reboot, showtech, image install)
└── systemd/
    └── hostcfgd.service  ← systemd unit for hostcfgd

Installed on SONiC host:
  /usr/bin/hostcfgd       (the Python script)
  /lib/systemd/system/hostcfgd.service

Runtime:
  systemctl status hostcfgd
    Active: active (running) since boot
  ps aux | grep hostcfgd
    /usr/bin/python3 /usr/bin/hostcfgd`}
        />
        <P>
          <IC>hostcfgd</IC> is a <strong>single-threaded Python daemon</strong> that runs on the SONiC host (the base
          Debian OS, not inside any Docker container). It starts at boot via systemd.
        </P>
      </Section>

      {/* 03 */}
      <Section id="how-works" number="03" title="How hostcfgd Works ⭐">
        <P>
          The pattern is <strong>table subscriber + handler classes</strong>:
        </P>
        <CodeBlock
          title="hostcfgd_skeleton.py"
          runnable={false}
          code={`#!/usr/bin/env python3
# Simplified structure of /usr/bin/hostcfgd

from swsscommon import ConfigDBConnector, Select, SubscriberStateTable
import subprocess
import jinja2
import syslog

# ────────────────────────────────────────────────────────────────
# Handler classes (one per feature area)
# ────────────────────────────────────────────────────────────────

class NtpCfg:
    """Handles NTP and NTP_SERVER tables → /etc/chrony/chrony.conf"""
    def __init__(self):
        self.db = ConfigDBConnector()
        self.db.connect()

    def ntp_server_handler(self, key, data):
        """Called when NTP_SERVER table changes"""
        syslog.syslog(syslog.LOG_INFO, f"NTP_SERVER changed: {key}")

        # Read FULL state from CONFIG_DB (not just the changed key)
        ntp_global = self.db.get_entry('NTP', 'global')      # {admin_status: enable, src_intf: ...}
        ntp_servers = self.db.get_table('NTP_SERVER')        # {10.1.1.1: {...}, 192.168.1.10: {...}}

        # Render Jinja template
        template = jinja2.Template(open('/usr/share/sonic/templates/chrony.conf.j2').read())
        config = template.render(servers=ntp_servers, global_cfg=ntp_global)

        # Write to /etc
        with open('/etc/chrony/chrony.conf', 'w') as f:
            f.write(config)

        # Restart the service
        subprocess.run(['systemctl', 'restart', 'ntp-config.service'], check=True)
        syslog.syslog(syslog.LOG_INFO, "chronyd restarted")

class AaaCfg:
    """Handles AAA, TACPLUS, TACPLUS_SERVER, RADIUS, LDAP → PAM configs"""
    def aaa_handler(self, key, data):
        # Similar: read tables, render /etc/pam.d/common-auth-sonic, nsswitch.conf
        # systemctl restart sshd (to pick up new PAM stack)
        pass

class FeatureHandler:
    """Handles FEATURE table → systemd enable/disable/start/stop"""
    def feature_state_handler(self, key, data):
        """key=feature name (e.g., 'lldp'), data={state: enabled/disabled, ...}"""
        state = data.get('state')
        service = f"{key}.service"  # e.g., lldp.service
        if state == 'enabled':
            subprocess.run(['systemctl', 'enable', service])
            subprocess.run(['systemctl', 'start', service])
        elif state == 'disabled':
            subprocess.run(['systemctl', 'stop', service])
            subprocess.run(['systemctl', 'disable', service])
        syslog.syslog(f"Feature {key} → {state}")

# ────────────────────────────────────────────────────────────────
# Main event loop
# ────────────────────────────────────────────────────────────────

def main():
    db = ConfigDBConnector()
    db.connect()

    # Instantiate handlers
    ntp = NtpCfg()
    aaa = AaaCfg()
    feature = FeatureHandler()

    # Subscribe to CONFIG_DB tables (using swsscommon pub/sub)
    sel = Select()
    ntp_tbl = SubscriberStateTable(db, 'NTP_SERVER')
    aaa_tbl = SubscriberStateTable(db, 'AAA')
    feature_tbl = SubscriberStateTable(db, 'FEATURE')

    sel.addSelectable(ntp_tbl)
    sel.addSelectable(aaa_tbl)
    sel.addSelectable(feature_tbl)

    syslog.syslog("hostcfgd started, subscribed to CONFIG_DB tables")

    # Event loop (blocking forever)
    while True:
        state, c = sel.select(timeout=1000)  # wait for notification
        if state == Select.OBJECT:
            # Figure out which table changed
            if c == ntp_tbl:
                key, op, fvs = ntp_tbl.pop()  # key=server IP, op=SET/DEL, fvs=fields
                data = dict(fvs)
                ntp.ntp_server_handler(key, data)
            elif c == aaa_tbl:
                key, op, fvs = aaa_tbl.pop()
                aaa.aaa_handler(key, dict(fvs))
            elif c == feature_tbl:
                key, op, fvs = feature_tbl.pop()
                feature.feature_state_handler(key, dict(fvs))

if __name__ == '__main__':
    main()`}
        />
        <P>
          The real <IC>/usr/bin/hostcfgd</IC> has ~10 handler classes (NtpCfg, SyslogCfg, SnmpCfg, AaaCfg,
          KdumpCfg, FeatureHandler, ...), but the pattern is identical for all:
        </P>
        <CodeBlock
          title="handler_pattern.txt"
          runnable={false}
          code={`For each CONFIG_DB table that affects a host service:
  1. Subscribe via SubscriberStateTable(db, 'TABLE_NAME')
  2. On notification:
     a. Read FULL table state from CONFIG_DB (get_table())
     b. Render Jinja template with that state
     c. Write /etc/<daemon>.conf
     d. systemctl restart <daemon>.service
  3. Log to syslog

The handler doesn't store state — CONFIG_DB is the source of truth.
Every notification = re-render the entire config from current DB state.`}
        />
        <Callout type="behind">
          Why re-render the entire config instead of incremental updates? Because /etc config files are declarative
          (not a transaction log). If NTP has 3 servers and you delete one, the new config must list 2 servers total,
          not &quot;previous state minus one.&quot; Easier to re-render from scratch than diff.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="ntp" number="04" title="NTP: NTP_SERVER → chrony ⭐">
        <P>
          Let&apos;s trace the <strong>full flow</strong> for NTP (the most common example):
        </P>
        <CodeBlock
          title="ntp_full_chain.txt"
          runnable={false}
          code={`User action:
  config ntp add 10.1.1.1
  OR
  curl -X PATCH /restconf/data/openconfig-system:system/ntp/servers/server[10.1.1.1]/config

Step 1: CONFIG_DB write
  redis-cli -n 4
  HSET NTP_SERVER|10.1.1.1 association_type server iburst on
  → Redis publishes keyspace notification to __keyspace@4__:NTP_SERVER|10.1.1.1

Step 2: hostcfgd wakes up
  SubscriberStateTable for NTP_SERVER receives notification
  ntp_tbl.pop() → key="10.1.1.1", data={association_type: server, iburst: on}

Step 3: NtpCfg.ntp_server_handler()
  # Read full NTP state
  ntp_servers = db.get_table('NTP_SERVER')
    → {10.1.1.1: {association_type: server, iburst: on},
       192.168.1.10: {association_type: peer}}

  ntp_global = db.get_entry('NTP', 'global')
    → {admin_status: enable, src_intf: Loopback0}

Step 4: Jinja render
  template = /usr/share/sonic/templates/chrony.conf.j2:
    # SONiC generated chrony config
    {% for addr, cfg in servers.items() %}
    server {{ addr }} {% if cfg.iburst == 'on' %}iburst{% endif %}
    {% endfor %}
    {% if global_cfg.src_intf %}
    bindaddress {{ src_intf_to_ip(global_cfg.src_intf) }}
    {% endif %}

  Output → /etc/chrony/chrony.conf:
    server 10.1.1.1 iburst
    server 192.168.1.10
    bindaddress 1.1.1.1

Step 5: Restart daemon
  systemctl restart ntp-config.service
  → ntp-config is a oneshot unit that:
      1. Stops chronyd
      2. Copies /etc/chrony/chrony.conf
      3. Starts chronyd
  chronyd reads new config, starts syncing to 10.1.1.1

Step 6: Verify
  chronyc sources
    MS Name/IP address         Stratum Poll Reach LastRx Last sample
    ^* 10.1.1.1                      2   6   377    23   +123us[ +456us] +/-   12ms
    ^- 192.168.1.10                  3   6   377    25   +890us[+1012us] +/-   45ms

  show ntp (SONiC CLI)
    NTP Servers:
      10.1.1.1 (reachable)
      192.168.1.10 (reachable)`}
        />
        <P>
          The <strong>Redis tables</strong> involved:
        </P>
        <CodeBlock
          title="ntp_redis_state.sh"
          code={`redis-cli -n 4

# NTP global config (singleton table)
HGETALL "NTP|global"
# admin_status enable
# src_intf Loopback0
# vrf mgmt

# NTP server list (one key per server)
KEYS "NTP_SERVER|*"
# NTP_SERVER|10.1.1.1
# NTP_SERVER|192.168.1.10

HGETALL "NTP_SERVER|10.1.1.1"
# association_type server
# iburst on
# minpoll 6
# maxpoll 10

HGETALL "NTP_SERVER|192.168.1.10"
# association_type peer`}
          output={`NTP|global
  admin_status enable
  src_intf Loopback0

NTP_SERVER|10.1.1.1
  association_type server
  iburst on

NTP_SERVER|192.168.1.10
  association_type peer`}
        />
        <Callout type="tip">
          <strong>Interview question:</strong> &quot;How does SONiC apply NTP config?&quot; → CONFIG_DB holds
          NTP_SERVER entries. hostcfgd subscribes to that table, on change it renders chrony.conf.j2 with all servers,
          writes /etc/chrony/chrony.conf, restarts ntp-config.service. chronyd picks up the new config. The user never
          touches /etc files directly.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="syslog" number="05" title="Syslog: SYSLOG_SERVER → rsyslog">
        <CodeBlock
          title="syslog_chain.txt"
          runnable={false}
          code={`CONFIG_DB tables:
  SYSLOG_CONFIG|global        {admin_status: enabled}
  SYSLOG_SERVER|10.0.0.5      {source: Loopback0, port: 514, vrf: mgmt}
  SYSLOG_SERVER|192.168.1.20  {}

hostcfgd handler:
  class SyslogCfg:
      def syslog_handler(self, key, data):
          servers = db.get_table('SYSLOG_SERVER')
          # Render /etc/rsyslog.conf with remote servers
          template = jinja2.Template(RSYSLOG_TEMPLATE)
          config = template.render(servers=servers)
          with open('/etc/rsyslog.conf', 'w') as f:
              f.write(config)
          subprocess.run(['systemctl', 'restart', 'rsyslog'])

Jinja template (/usr/share/sonic/templates/rsyslog.conf.j2):
  {% for addr, cfg in servers.items() %}
  *.* @{{ addr }}:{{ cfg.port | default(514) }}
  {% endfor %}

Output /etc/rsyslog.conf:
  *.* @10.0.0.5:514
  *.* @192.168.1.20:514

Result:
  rsyslogd forwards all syslog messages to those two remote servers.
  tail -f /var/log/syslog on the remote server shows SONiC logs arriving.`}
        />
      </Section>

      {/* 06 */}
      <Section id="snmp" number="06" title="SNMP: SNMP tables → snmpd">
        <CodeBlock
          title="snmp_chain.txt"
          runnable={false}
          code={`CONFIG_DB tables:
  SNMP|LOCATION           {Location: "Rack 42, DC1"}
  SNMP|CONTACT            {Contact: "admin@example.com"}
  SNMP_COMMUNITY|public   {TYPE: RO}
  SNMP_COMMUNITY|private  {TYPE: RW}

hostcfgd handler:
  class SnmpCfg:
      def snmp_handler(self, key, data):
          snmp_global = db.get_all(db.CONFIG_DB, 'SNMP|*')
          communities = db.get_table('SNMP_COMMUNITY')
          # Render snmpd.conf
          config = render('snmpd.conf.j2', global=snmp_global, communities=communities)
          # SNMP runs inside 'snmp' container, so write to shared volume
          with open('/etc/sonic/snmp.yml', 'w') as f:  # snmp container mounts /etc/sonic
              f.write(config)
          # Restart snmp container (or signal it to reload)
          subprocess.run(['docker', 'restart', 'snmp'])

Template → /etc/sonic/snmp.yml (consumed by snmpd inside container):
  location: "Rack 42, DC1"
  contact: "admin@example.com"
  communities:
    - name: public
      type: RO
    - name: private
      type: RW

snmpd inside container:
  Reads snmp.yml → generates /etc/snmp/snmpd.conf
  Listens on UDP 161
  SNMP walk from client shows sysLocation = "Rack 42, DC1"`}
        />
        <Callout type="note">
          SNMP is a special case: the daemon runs <strong>inside the snmp Docker container</strong>, not on the host.
          But the pattern is the same — hostcfgd writes to a shared volume (<IC>/etc/sonic/</IC>), the container
          mounts it, reads the config. hostcfgd then restarts the container to apply changes.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="aaa" number="07" title="AAA/TACACS: → PAM + NSS">
        <P>
          AAA (authentication, authorization, accounting) is the most complex, because it touches the Linux PAM stack
          and NSS (name service switch):
        </P>
        <CodeBlock
          title="aaa_chain.txt"
          runnable={false}
          code={`CONFIG_DB tables:
  AAA|authentication      {login: tacacs+,local}
  TACPLUS|global          {auth_type: pap, timeout: 5, passkey: <secret>}
  TACPLUS_SERVER|10.0.1.5 {priority: 1, tcp_port: 49}
  TACPLUS_SERVER|10.0.1.6 {priority: 2, tcp_port: 49}
  RADIUS|global           {...}  (similar for RADIUS)
  LDAP|global             {bind_dn: ..., ...}

hostcfgd handler:
  class AaaCfg:
      def aaa_handler(self, key, data):
          aaa = db.get_entry('AAA', 'authentication')
          tacplus_global = db.get_entry('TACPLUS', 'global')
          tacplus_servers = db.get_table('TACPLUS_SERVER')  # {10.0.1.5: {...}, 10.0.1.6: {...}}
          radius_global = db.get_entry('RADIUS', 'global')
          radius_servers = db.get_table('RADIUS_SERVER')
          ldap = db.get_entry('LDAP', 'global')

          # Render PAM config
          pam_cfg = render('common-auth-sonic.j2', aaa=aaa, tacplus=tacplus_global, servers=tacplus_servers, ...)
          with open('/etc/pam.d/common-auth-sonic', 'w') as f:
              f.write(pam_cfg)

          # Render NSS config
          nss_cfg = render('nsswitch.conf.j2', aaa=aaa, ldap=ldap)
          with open('/etc/nsswitch.conf', 'w') as f:
              f.write(nss_cfg)

          # Restart sshd to pick up new PAM stack
          subprocess.run(['systemctl', 'restart', 'ssh'])

Templates:
  /etc/pam.d/common-auth-sonic (Jinja):
    # SONiC AAA
    {% if 'tacacs+' in aaa.login %}
    auth [success=done new_authtok_reqd=done default=ignore] pam_tacplus.so server={{ tacplus_servers|join(',') }} secret={{ tacplus_global.passkey }}
    {% endif %}
    {% if 'local' in aaa.login %}
    auth requisite pam_unix.so nullok_secure
    {% endif %}

  /etc/nsswitch.conf:
    passwd: compat {% if ldap_enabled %}ldap{% endif %}
    group:  compat {% if ldap_enabled %}ldap{% endif %}

Result:
  SSH login attempts:
    1. PAM tries TACACS+ first (queries 10.0.1.5, 10.0.1.6)
    2. If TACACS+ fails, falls back to local /etc/shadow
  User lookup (id user123):
    NSS queries LDAP if enabled, else /etc/passwd

Verify:
  ssh admin@sonic-switch
    (authenticates against TACACS+ server 10.0.1.5)
  journalctl -u ssh -f
    pam_tacplus: connected to 10.0.1.5
    pam_tacplus: user admin authenticated`}
        />
      </Section>

      {/* 08 */}
      <Section id="dhcp-relay" number="08" title="DHCP Relay: DHCP_RELAY → container">
        <CodeBlock
          title="dhcp_relay_chain.txt"
          runnable={false}
          code={`CONFIG_DB table:
  DHCP_RELAY|Vlan100     {dhcp_servers: 192.168.1.10,192.168.1.11}

hostcfgd handler:
  class DhcpRelayCfg:
      def dhcp_relay_handler(self, key, data):
          # key = interface (e.g., Vlan100)
          servers = data['dhcp_servers'].split(',')
          # DHCP relay runs inside 'dhcp_relay' container
          # Pass servers as container environment vars or config file
          # (implementation varies, but pattern is same)
          with open('/etc/sonic/dhcp_relay.conf', 'w') as f:
              f.write(f"SERVERS={','.join(servers)}\\n")
          subprocess.run(['docker', 'restart', 'dhcp_relay'])

dhcp_relay container:
  Reads /etc/sonic/dhcp_relay.conf
  Runs dhcrelay -i Vlan100 -s 192.168.1.10 -s 192.168.1.11
  (or isc-dhcp-relay daemon with equivalent config)

Result:
  DHCP requests arriving on Vlan100 are relayed to 192.168.1.10 and 192.168.1.11.
  Client gets IP from DHCP server in different subnet.`}
        />
      </Section>

      {/* 09 */}
      <Section id="feature" number="09" title="Feature Control: FEATURE table → systemd">
        <P>
          The <IC>FEATURE</IC> table controls which Docker containers (SONiC calls them &quot;features&quot;) are
          enabled/disabled:
        </P>
        <CodeBlock
          title="feature_table.txt"
          runnable={false}
          code={`CONFIG_DB:FEATURE table schema:
  key: feature name (e.g., "lldp", "bgp", "snmp", "telemetry")
  fields:
    state:          enabled | disabled | always_enabled
    auto_restart:   enabled | disabled
    high_mem_alert: enabled | disabled
    set_owner:      local | kube  (for multi-asic / k8s deployments)

Example:
  HGETALL FEATURE|lldp
    state enabled
    auto_restart enabled
    high_mem_alert disabled

  HGETALL FEATURE|telemetry
    state disabled
    auto_restart disabled`}
        />
        <CodeBlock
          title="feature_handler.py"
          runnable={false}
          code={`class FeatureHandler:
    def feature_state_handler(self, feature_name, feature_cfg):
        """Called when FEATURE|<name> changes"""
        state = feature_cfg.get('state')
        auto_restart = feature_cfg.get('auto_restart')

        service = f"{feature_name}.service"  # e.g., lldp.service, bgp.service

        if state == 'enabled':
            subprocess.run(['systemctl', 'unmask', service])  # in case it was masked
            subprocess.run(['systemctl', 'enable', service])  # enable at boot
            subprocess.run(['systemctl', 'start', service])   # start now
            syslog.syslog(f"Feature {feature_name} enabled and started")
        elif state == 'disabled':
            subprocess.run(['systemctl', 'stop', service])
            subprocess.run(['systemctl', 'disable', service])
            syslog.syslog(f"Feature {feature_name} disabled and stopped")
        elif state == 'always_enabled':
            # Cannot be disabled by user
            subprocess.run(['systemctl', 'enable', service])
            subprocess.run(['systemctl', 'start', service])

        # Handle auto_restart (configures systemd Restart=)
        if auto_restart == 'enabled':
            # systemd override: set Restart=always
            override = f"[Service]\\nRestart=always\\n"
            override_dir = f"/etc/systemd/system/{service}.d/"
            os.makedirs(override_dir, exist_ok=True)
            with open(f"{override_dir}/override.conf", 'w') as f:
                f.write(override)
            subprocess.run(['systemctl', 'daemon-reload'])
            subprocess.run(['systemctl', 'restart', service])

# Usage:
# config feature state lldp enabled
#   → sets FEATURE|lldp state=enabled
#   → hostcfgd receives notification
#   → systemctl enable lldp && systemctl start lldp
#   → docker ps shows lldp container running`}
        />
        <Callout type="behind">
          SONiC features are Docker containers managed by systemd. Each feature has a <IC>&lt;feature&gt;.service</IC>{" "}
          unit (e.g., <IC>lldp.service</IC> runs <IC>docker start lldp</IC>). hostcfgd translates FEATURE table changes
          into systemctl commands. This is how &quot;config feature&quot; CLI works under the hood.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="full-chain" number="10" title="Full Chain Diagram ⭐">
        <CodeBlock
          title="full_chain_ascii.txt"
          runnable={false}
          code={`User/Client                              SONiC Switch (host + containers)
───────────────────────────────────────────────────────────────────────────────

curl -X PATCH /system/ntp/...  ─┐
  OR                             │
config ntp add 10.1.1.1  ────────┤
                                 ↓
                           ┌─────────────┐
                           │ REST/gNMI   │
                           │   server    │
                           └──────┬──────┘
                                  ↓
                           ┌─────────────┐
                           │  translib   │  (sonic-mgmt-common)
                           │ + transformers │
                           └──────┬──────┘
                                  ↓
                        ┌──────────────────┐
                        │  CONFIG_DB       │  Redis DB 4
                        │  NTP_SERVER|10.1.1.1: {iburst: on, ...}
                        └────────┬─────────┘
                                 │ (keyspace notification)
                                 ↓
                        ┌──────────────────┐
                        │   hostcfgd       │  Python daemon on HOST
                        │  (sonic-host-services/scripts/hostcfgd)
                        └────────┬─────────┘
                                 ↓
                   ┌─────────────┴─────────────┐
                   │  NtpCfg.ntp_server_handler()
                   │  1. Read CONFIG_DB tables
                   │  2. Render Jinja template
                   └────────┬──────────────────┘
                            ↓
                  ┌──────────────────────────┐
                  │  /etc/chrony/chrony.conf │  (on host filesystem)
                  │  server 10.1.1.1 iburst  │
                  └──────────┬───────────────┘
                             ↓
                  ┌──────────────────────────┐
                  │  systemctl restart       │
                  │  ntp-config.service      │
                  └──────────┬───────────────┘
                             ↓
                  ┌──────────────────────────┐
                  │      chronyd             │  (NTP daemon on host)
                  │  reads chrony.conf       │
                  │  syncs time with 10.1.1.1 │
                  └──────────────────────────┘
                             ↓
                        ✅ NTP working

Same pattern for:
  SYSLOG_SERVER → rsyslog
  SNMP|* → snmpd (in snmp container)
  AAA|* → PAM /etc/pam.d/, nsswitch.conf
  FEATURE|lldp → systemctl start lldp.service
  DHCP_RELAY|Vlan100 → dhcp_relay container args`}
        />
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging hostcfgd">
        <CodeBlock
          title="debug_hostcfgd.sh"
          code={`# 1. Check if hostcfgd is running
systemctl status hostcfgd
# Active: active (running) since ...

ps aux | grep hostcfgd
# root  1234  0.5  0.3  /usr/bin/python3 /usr/bin/hostcfgd

# 2. Watch hostcfgd logs in real-time
journalctl -u hostcfgd -f
# Lines logged via syslog.syslog() in Python appear here

# Alternatively, tail syslog (hostcfgd writes to syslog facility)
tail -f /var/log/syslog | grep hostcfgd

# 3. Trigger a change and watch logs
config ntp add 10.2.2.2
# Immediately check journalctl:
# hostcfgd[1234]: NTP_SERVER changed: 10.2.2.2
# hostcfgd[1234]: Rendering chrony.conf with 2 servers
# hostcfgd[1234]: chronyd restarted

# 4. Verify the rendered config file
cat /etc/chrony/chrony.conf
# server 10.1.1.1 iburst
# server 10.2.2.2 iburst
# (check that the new server appears)

# 5. Check if the daemon actually restarted
systemctl status ntp-config.service
# ntp-config is a oneshot unit, so it shows "inactive (dead)" after running
# But check chronyd:
systemctl status chrony
# Active: active (running) since 2 seconds ago  ← restart timestamp recent

chronyc sources
# ^* 10.1.1.1  ...
# ^- 10.2.2.2  ...  ← new server visible

# 6. If hostcfgd is stuck / not responding:
systemctl restart hostcfgd
# (kills the Python process, systemd restarts it)
# Watch journalctl for "hostcfgd started, subscribed to CONFIG_DB tables"

# 7. Enable Python debug logging (edit /usr/bin/hostcfgd, add at top):
# import logging
# logging.basicConfig(level=logging.DEBUG)
# Then restart: systemctl restart hostcfgd
# (produces verbose Python tracebacks in journalctl)

# 8. Check for exceptions in syslog
grep -i "exception\\|error\\|traceback" /var/log/syslog | grep hostcfgd
# If Jinja render fails or systemctl command fails, exception logged here`}
          output={`hostcfgd[1234]: NTP_SERVER changed: 10.2.2.2
hostcfgd[1234]: Rendering chrony.conf with 2 servers
hostcfgd[1234]: chronyd restarted

/etc/chrony/chrony.conf:
  server 10.1.1.1 iburst
  server 10.2.2.2 iburst

chronyc sources:
  ^* 10.1.1.1  2  6  377   12  +100us[+200us]
  ^- 10.2.2.2  2  6  377   15  +300us[+400us]`}
        />
        <Callout type="tip">
          <strong>Debug tactic:</strong> If a config change doesn&apos;t take effect, the flow is: check CONFIG_DB (is
          the entry there?) → check hostcfgd logs (did it see the notification?) → check /etc file (was it rendered
          correctly?) → check systemctl status (did the daemon restart?) → check daemon&apos;s own logs (did it accept
          the config?). Five checkpoints.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <P>
          <strong>Goal:</strong> Add an NTP server via CLI, watch hostcfgd react, verify the chain from CONFIG_DB to
          chronyd.
        </P>
        <CodeBlock
          title="lab_ntp_full_trace.sh"
          code={`# Step 1: Start log watcher in one terminal
journalctl -u hostcfgd -f &

# Step 2: Add NTP server
config ntp add 10.1.1.1

# Expected log output:
#   hostcfgd: NTP_SERVER changed: 10.1.1.1
#   hostcfgd: chronyd restarted

# Step 3: Verify CONFIG_DB
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"
# association_type server
# iburst on

# Step 4: Check rendered config
cat /etc/chrony/chrony.conf
# server 10.1.1.1 iburst

# Step 5: Check chronyd status
systemctl status chrony
# Active: active (running) since 5 seconds ago  (recent restart)

chronyc sources
# MS Name/IP address         Stratum Poll Reach LastRx Last sample
# ^* 10.1.1.1                      2   6   377     8   +100us[+200us]

# Step 6: Remove the server and watch again
config ntp del 10.1.1.1

# Expected:
#   hostcfgd: NTP_SERVER deleted: 10.1.1.1
#   hostcfgd: chronyd restarted

cat /etc/chrony/chrony.conf
# (server 10.1.1.1 line GONE)

chronyc sources
# (empty or only default servers)

# Deliverable: screenshot showing:
#   1. journalctl log lines for NTP_SERVER changed + chronyd restarted
#   2. /etc/chrony/chrony.conf with the new server
#   3. chronyc sources showing the server syncing
# = proof the full chain worked ✅`}
          output={`journalctl:
  hostcfgd: NTP_SERVER changed: 10.1.1.1
  hostcfgd: chronyd restarted

/etc/chrony/chrony.conf:
  server 10.1.1.1 iburst

chronyc sources:
  ^* 10.1.1.1  2  6  377  8  +100us[+200us]`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What problem does hostcfgd solve?",
              "CONFIG_DB holds SONiC's desired state, but host daemons (chronyd, rsyslog, snmpd) read /etc files. hostcfgd bridges the gap: it subscribes to CONFIG_DB tables, and when they change, it renders Jinja templates → writes /etc files → restarts systemd units. Automates config propagation from Redis to Linux services.",
            ],
            [
              "Where does hostcfgd run?",
              "On the SONiC host OS (the base Debian layer), NOT in a Docker container. It's installed as /usr/bin/hostcfgd, managed by systemd (hostcfgd.service). Runs as root, single-threaded Python daemon.",
            ],
            [
              "How does hostcfgd know when CONFIG_DB changes?",
              "Uses swsscommon SubscriberStateTable() to subscribe to specific tables (NTP_SERVER, SYSLOG_SERVER, AAA, FEATURE, etc.). Redis keyspace notifications trigger the subscriber. hostcfgd's event loop (Select.select()) wakes up, pops the notification, calls the appropriate handler.",
            ],
            [
              "Walk me through NTP config update.",
              "1) config ntp add 10.1.1.1 → CONFIG_DB: HSET NTP_SERVER|10.1.1.1. 2) Redis publishes keyspace notification. 3) hostcfgd's NtpCfg handler wakes up, reads FULL NTP_SERVER table from CONFIG_DB. 4) Renders chrony.conf.j2 with all servers. 5) Writes /etc/chrony/chrony.conf. 6) systemctl restart ntp-config.service → chronyd reloads config. 7) chronyc sources shows new server.",
            ],
            [
              "Why re-render the entire config instead of incremental edits?",
              "/etc config files are declarative snapshots, not transaction logs. If you have 3 NTP servers and delete one, the file must list 2 total, not 'previous minus one'. Re-rendering from CONFIG_DB state is simpler than diffing. CONFIG_DB is the source of truth; /etc files are derived artifacts.",
            ],
            [
              "How does the FEATURE table control Docker containers?",
              "FEATURE table has one entry per container (FEATURE|lldp, FEATURE|bgp, ...) with fields {state: enabled/disabled, auto_restart: ...}. hostcfgd's FeatureHandler translates: state=enabled → systemctl enable lldp.service && systemctl start lldp. Each feature has a systemd unit that runs 'docker start <container>'. hostcfgd is the systemd API for SONiC features.",
            ],
            [
              "How does AAA config (TACACS+/RADIUS) get applied?",
              "hostcfgd's AaaCfg handler reads AAA, TACPLUS, TACPLUS_SERVER, RADIUS, LDAP tables. Renders /etc/pam.d/common-auth-sonic (PAM stack for SSH login) and /etc/nsswitch.conf (user lookup). Restarts sshd. PAM modules (pam_tacplus.so, pam_radius.so) query the TACACS+/RADIUS servers. NSS queries LDAP if configured.",
            ],
            [
              "What Jinja templates are involved?",
              "Templates live in /usr/share/sonic/templates/. Examples: chrony.conf.j2 (NTP), rsyslog.conf.j2 (syslog), snmpd.conf.j2 (SNMP), common-auth-sonic.j2 (PAM). Each handler loads the relevant template, passes CONFIG_DB data as context, renders to /etc/<daemon>.conf.",
            ],
            [
              "How do you debug if a config change doesn't apply?",
              "5 checkpoints: 1) CONFIG_DB: is the entry there? (redis-cli HGETALL). 2) hostcfgd logs: did it see the notification? (journalctl -u hostcfgd). 3) /etc file: was it rendered? (cat /etc/chrony/chrony.conf). 4) systemd: did the service restart? (systemctl status <daemon>). 5) daemon logs: did it accept the config? (journalctl -u chrony).",
            ],
            [
              "Can hostcfgd crash and break the system?",
              "If hostcfgd crashes, CONFIG_DB changes won't propagate to /etc files until it restarts. But existing daemons keep running with their last config. systemd auto-restarts hostcfgd (Restart=always in hostcfgd.service). If it crashes mid-render, worst case: /etc file is half-written, daemon restart fails, but systemd keeps the old daemon process running. Fix: systemctl restart hostcfgd.",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Purpose", "Bridge CONFIG_DB → /etc files → Linux daemons (NTP, syslog, SNMP, AAA, ...)"],
            ["Location", "sonic-host-services repo, installed as /usr/bin/hostcfgd (Python)"],
            ["Runs where", "SONiC host OS (not in container), managed by systemd (hostcfgd.service)"],
            ["Pattern", "Subscribe to CONFIG_DB table → render Jinja → write /etc → systemctl restart"],
            ["Subscription", "swsscommon SubscriberStateTable() + Select.select() event loop"],
            ["NTP chain", "NTP_SERVER table → chrony.conf.j2 → /etc/chrony/chrony.conf → restart ntp-config → chronyd"],
            ["Syslog chain", "SYSLOG_SERVER → rsyslog.conf.j2 → /etc/rsyslog.conf → restart rsyslog"],
            ["SNMP chain", "SNMP|* tables → snmpd.conf.j2 → /etc/sonic/snmp.yml → restart snmp container"],
            ["AAA chain", "AAA/TACPLUS/RADIUS → common-auth-sonic.j2, nsswitch.conf → restart ssh → PAM"],
            ["FEATURE table", "FEATURE|<name> state=enabled/disabled → systemctl enable/start or stop/disable <name>.service"],
            ["Templates", "/usr/share/sonic/templates/*.j2 (Jinja2 format)"],
            ["Debug", "journalctl -u hostcfgd, check /etc files, systemctl status <daemon>, daemon logs"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
