"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "sonic-cfggen: CONFIG_DB + template = config file",
  nodes: [
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "Redis DB 4", x: 8, y: 30, color: "#22d3ee" },
    { id: "json", icon: "📄", label: "config_db.json", sub: "persistent backup", x: 8, y: 72, color: "#60a5fa" },
    { id: "cfggen", icon: "🧮", label: "sonic-cfggen", sub: "-d -t", x: 32, y: 50, color: "#a78bfa" },
    { id: "tmpl", icon: "🧩", label: "chrony.conf.j2", sub: "/usr/share/sonic/templates", x: 32, y: 14, color: "#fb923c" },
    { id: "render", icon: "📝", label: "Rendered file", sub: "/etc/chrony/chrony.conf", x: 58, y: 50, color: "#34d399" },
    { id: "daemon", icon: "⏰", label: "chronyd", sub: "consumes config", x: 78, y: 28, color: "#fbbf24" },
    { id: "verify", icon: "✅", label: "chronyc sources", sub: "verify result", x: 92, y: 60, color: "#f472b6" },
  ],
  edges: [
    { id: "redis-cfggen", from: "redis", to: "cfggen", color: "#22d3ee" },
    { id: "json-cfggen", from: "json", to: "cfggen", color: "#60a5fa", dashed: true },
    { id: "tmpl-cfggen", from: "tmpl", to: "cfggen", color: "#fb923c" },
    { id: "cfggen-render", from: "cfggen", to: "render", color: "#34d399" },
    { id: "render-daemon", from: "render", to: "daemon", color: "#fbbf24" },
    { id: "daemon-verify", from: "daemon", to: "verify", color: "#f472b6" },
  ],
  flows: [
    {
      id: "happy",
      name: "🎯 Render NTP config",
      command: "sonic-cfggen -d -t chrony.conf.j2 -a '{\"ntp\":true}' > /etc/chrony/chrony.conf",
      steps: [
        { node: "redis", paths: ["redis-cfggen"], text: "sonic-cfggen connects to Redis DB 4 (CONFIG_DB) and reads NTP_SERVER table keys: 10.1.1.1, 192.168.1.10." },
        { node: "tmpl", paths: ["tmpl-cfggen"], text: "Jinja2 template chrony.conf.j2 loops over NTP_SERVER keys with {% for server in NTP_SERVER %}." },
        { node: "cfggen", paths: ["cfggen-render"], text: "Renderer evaluates {{ server }} for each iteration, produces 'server 10.1.1.1 iburst' + 'server 192.168.1.10 iburst'." },
        { node: "render", paths: ["render-daemon"], text: "Output written to /etc/chrony/chrony.conf atomically — old file replaced only after complete render." },
        { node: "daemon", paths: ["daemon-verify"], text: "systemctl restart chrony reads new config, chronyd attempts sync with both servers." },
        { node: "verify", paths: [], text: "chronyc sources shows both NTP servers with reach=377 (sync successful). Config render complete!" },
      ],
    },
    {
      id: "failure",
      name: "❌ Undefined variable",
      command: "template references missing key → jinja2.exceptions.UndefinedError",
      steps: [
        { node: "redis", paths: ["redis-cfggen"], text: "CONFIG_DB has NTP_SERVER but template also references {{ TIMEZONE }} which does NOT exist in Redis." },
        { node: "tmpl", paths: ["tmpl-cfggen"], text: "Jinja2 encounters {{ TIMEZONE }} — Python's jinja2.Environment is strict by default (no undefined allowed)." },
        { node: "cfggen", paths: [], text: "Renderer crashes: jinja2.exceptions.UndefinedError: 'TIMEZONE' is undefined. Stack trace logged to syslog." },
        { node: "render", paths: [], text: "NO file written — atomic write ensures /etc/chrony/chrony.conf remains untouched (old config still valid)." },
        { node: "daemon", paths: [], text: "chronyd never restarted because hostcfgd render step failed. System keeps running with previous config." },
        { node: "verify", paths: [], text: "Debugging: check 'journalctl -u hostcfgd | grep UndefinedError' → fix template or add missing key to CONFIG_DB." },
      ],
    },
    {
      id: "preview",
      name: "🔍 Preview mode (dry-run)",
      command: "sonic-cfggen -d -t template.j2 | diff - /etc/actual.conf",
      steps: [
        { node: "redis", paths: ["redis-cfggen"], text: "Same data pull from CONFIG_DB, but no output file specified → sonic-cfggen will print to stdout instead." },
        { node: "tmpl", paths: ["tmpl-cfggen"], text: "Template renders identically (all {% for %} and {{ var }} logic executes the same)." },
        { node: "cfggen", paths: [], text: "Rendered output streams to stdout instead of a file — perfect for piping to diff or visual inspection." },
        { node: "render", paths: [], text: "NO write happens (preview-only). Use 'diff <(sonic-cfggen -d -t tpl.j2) /live/file.conf' to compare before applying." },
        { node: "daemon", paths: [], text: "No restart triggered — this is a read-only preview. Safe to run anytime without affecting running services." },
        { node: "verify", paths: [], text: "Review diff output: lines prefixed + are additions, - are deletions. Approve changes, then re-run WITH output file." },
      ],
    },
  ],
};

const NAV = [
  { id: "why-templates", label: "Why Templates — The Problem Solved" },
  { id: "renderer", label: "The Renderer: sonic-cfggen ⭐" },
  { id: "jinja-crash", label: "Jinja2 Crash Course ⭐" },
  { id: "real-examples", label: "4 Real Template Examples ⭐" },
  { id: "ntp", label: "Example 1: NTP (chrony)" },
  { id: "syslog", label: "Example 2: SYSLOG (rsyslog)" },
  { id: "snmp", label: "Example 3: SNMP" },
  { id: "dhcp-relay", label: "Example 4: DHCP Relay (supervisord)" },
  { id: "locations", label: "Template Locations in SONiC" },
  { id: "render-chain", label: "Render-on-Event Chain" },
  { id: "debugging", label: "Debugging Template Failures ⭐" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JinjaTemplatesPage() {
  return (
    <TopicShell
      icon="🧩"
      title="Jinja Templates — Rendering Linux Config from Redis"
      gradientWord="Jinja"
      subtitle="SONiC stores intent once in CONFIG_DB and renders dozens of Linux daemon configs via Jinja2 templates. This is how NTP servers, SYSLOG targets, SNMP community strings, and interface configs materialize from Redis keys into /etc files. You&apos;ll see the render pipeline, Jinja2 patterns, 4 real template walkthroughs with before/after outputs, and how to debug UndefinedErrors."
      nav={NAV}
      badges={["🧮 sonic-cfggen", "📄 Real templates", "🔍 Debug flows", "🧪 Live lab"]}
      next={{ icon: "⏰", label: "NTP End-to-End Flow", href: "/sonic/ntp-flow" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-templates" number="01" title="Why Templates — The Problem Solved">
        <P>
          SONiC manages dozens of Linux daemons, each with its own config syntax: chronyd wants <IC>server X iburst</IC>,
          rsyslog wants <IC>*.* @host:port</IC>, SNMP wants <IC>rocommunity public</IC>, interfaces want <IC>iface eth0 inet static</IC>.
          <strong> The same NTP server IP might need to appear in 3 different formats across 3 files.</strong>
        </P>
        <CodeBlock
          title="the_nightmare_without_templates.txt"
          runnable={false}
          code={`WITHOUT templates — manual duplication:
/etc/chrony/chrony.conf:     server 10.1.1.1 iburst
/etc/ntp.conf:               server 10.1.1.1
/some/app/config.yaml:       ntp_servers: ["10.1.1.1"]

change the IP? → hunt down 3 files, error-prone, out-of-sync bugs

WITH templates — single source of truth:
CONFIG_DB: NTP_SERVER|10.1.1.1 = {}     ← the ONE truth
chrony.conf.j2 renders it as:   server {{ server }} iburst
ntp.conf.j2 renders it as:      server {{ server }}
config.yaml.j2 renders it as:   - {{ server }}

change the IP → update CONFIG_DB once, re-render all templates
(or templates auto-render on Redis keyspace event — zero manual steps)`}
        />
        <Callout type="analogy">
          Think mail-merge: Word template + CSV data = personalized letters. Here: Jinja2 template + CONFIG_DB keys = daemon configs.
          The CSV is Redis, the template is <IC>.j2</IC>, the merge tool is <IC>sonic-cfggen</IC>.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="renderer" number="02" title="The Renderer: sonic-cfggen ⭐">
        <P>
          <IC>sonic-cfggen</IC> is SONiC&apos;s config file generator. It pulls data from CONFIG_DB (or JSON files),
          loads a Jinja2 template, and writes the rendered output. Here are the key flags:
        </P>
        <Table
          head={["Flag", "Meaning"]}
          rows={[
            ["-d", "Load data from CONFIG_DB (Redis DB 4) — most common for live system"],
            ["-j file.json", "Load data from a JSON file instead (e.g., config_db.json)"],
            ["-t template.j2", "Render this Jinja2 template (searches /usr/share/sonic/templates/)"],
            ["-a '{\"key\":\"val\"}'", "Additional JSON data merged into context (ad-hoc overrides)"],
            ["> output.conf", "Write rendered output to file (or stdout if omitted for preview)"],
          ]}
        />
        <CodeBlock
          title="sonic-cfggen_examples.sh"
          code={`# render NTP config from CONFIG_DB
sonic-cfggen -d -t chrony.conf.j2 > /etc/chrony/chrony.conf

# render from saved JSON (e.g., at boot before Redis is up)
sonic-cfggen -j /etc/sonic/config_db.json -t interfaces.j2 > /etc/network/interfaces

# preview mode (stdout, no file write)
sonic-cfggen -d -t rsyslog.conf.j2

# merge additional data (override or add key)
sonic-cfggen -d -t snmpd.conf.j2 -a '{"SNMP_LOCATION":"DC1"}' > /etc/snmp/snmpd.conf`}
          output={`# no output shown (these are operational commands)
# run on SONiC switch to see actual rendered files`}
        />
        <Callout type="behind">
          <IC>sonic-cfggen</IC> is a Python script (sonic-buildimage/src/sonic-config-engine/sonic-cfggen). It uses
          the <IC>jinja2</IC> library and SONiC&apos;s <IC>SonicV2Connector</IC> to query Redis. The template context
          is a Python dict where keys = CONFIG_DB table names, values = table contents (nested dicts or lists).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="jinja-crash" number="03" title="Jinja2 Crash Course ⭐">
        <P>
          Jinja2 syntax in 60 seconds (enough to read SONiC templates):
        </P>
        <CodeBlock
          title="jinja2_cheatsheet.j2"
          runnable={false}
          code={`{# COMMENT — ignored, not in output #}

{{ variable }}                    ← substitute value (e.g., {{ NTP_SERVER }})

{% for item in list %}            ← loop over list/dict.keys()
  server {{ item }}
{% endfor %}

{% if condition %}                ← conditional
  # enabled
{% else %}
  # disabled
{% endif %}

{{ var | default("fallback") }}   ← filter (use "fallback" if var is undefined)
{{ ip | ipaddr }}                 ← SONiC-specific filter (validates IP format)

ACCESSING CONFIG_DB SHAPES:
  NTP_SERVER is a dict:  {"10.1.1.1": {}, "192.168.1.10": {}}
  → loop with:  {% for server in NTP_SERVER %}  (iterates keys)
  PORT is a dict of dicts: {"Ethernet0": {"alias": "Eth1/1"}}
  → access:  {{ PORT["Ethernet0"]["alias"] }}`}
        />
        <Callout type="tip">
          SONiC templates assume CONFIG_DB table names are variables (NTP_SERVER, SYSLOG_SERVER, PORT, etc.).
          When sonic-cfggen loads the template, it passes a Python dict like <IC>{`{"NTP_SERVER": {...}, "PORT": {...}}`}</IC>
          as the Jinja2 context. So <IC>{`{% for s in NTP_SERVER %}`}</IC> literally iterates <IC>NTP_SERVER.keys()</IC>.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="real-examples" number="04" title="4 Real Template Examples ⭐">
        <P>
          Let&apos;s walk through 4 actual SONiC templates. For each, we&apos;ll show: (a) CONFIG_DB input (Redis dump),
          (b) template source, (c) rendered output before/after a config change.
        </P>
      </Section>

      {/* 05 */}
      <Section id="ntp" number="05" title="Example 1: NTP (chrony.conf.j2)">
        <P>
          <strong>File:</strong> <IC>/usr/share/sonic/templates/chrony/chrony.conf.j2</IC> (in host OS, not container)
        </P>
        <CodeBlock
          title="redis_before.sh"
          code={`redis-cli -n 4 KEYS "NTP_SERVER|*"
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"
redis-cli -n 4 HGETALL "NTP_SERVER|192.168.1.10"`}
          output={`1) "NTP_SERVER|10.1.1.1"
2) "NTP_SERVER|192.168.1.10"

1) "NULL"
2) "NULL"

1) "NULL"
2) "NULL"`}
        />
        <P>
          The template (simplified — real template has more lines for defaults):
        </P>
        <CodeBlock
          title="chrony.conf.j2"
          runnable={false}
          code={`{# SONiC NTP configuration for chrony #}

{% if NTP_SERVER %}
{% for server in NTP_SERVER %}
server {{ server }} iburst
{% endfor %}
{% else %}
# No NTP servers configured, using pool defaults
pool 2.debian.pool.ntp.org iburst
{% endif %}

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <CodeBlock
          title="rendered_chrony.conf (before)"
          runnable={false}
          code={`server 10.1.1.1 iburst
server 192.168.1.10 iburst

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <P>
          Now add a third NTP server via <IC>config ntp add 203.0.113.5</IC> → CONFIG_DB gets NTP_SERVER|203.0.113.5,
          hostcfgd re-renders:
        </P>
        <CodeBlock
          title="rendered_chrony.conf (after)"
          runnable={false}
          code={`server 10.1.1.1 iburst
server 192.168.1.10 iburst
server 203.0.113.5 iburst

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <Callout type="note">
          The loop <IC>{`{% for server in NTP_SERVER %}`}</IC> iterates the <em>keys</em> of the NTP_SERVER table. The values are
          all <IC>{`{"NULL":"NULL"}`}</IC> (SONiC legacy quirk for keyonly tables). Only the keys (server IPs) matter.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="syslog" number="06" title="Example 2: SYSLOG (rsyslog.conf.j2)">
        <P>
          <strong>File:</strong> <IC>/usr/share/sonic/templates/rsyslog/rsyslog.conf.j2</IC>
        </P>
        <CodeBlock
          title="redis_syslog.sh"
          code={`redis-cli -n 4 HGETALL "SYSLOG_SERVER|10.0.0.5"`}
          output={`1) "NULL"
2) "NULL"`}
        />
        <CodeBlock
          title="rsyslog.conf.j2 (excerpt)"
          runnable={false}
          code={`{# Forward logs to remote syslog servers #}

{% if SYSLOG_SERVER %}
{% for server in SYSLOG_SERVER %}
*.* @{{ server }}:514
{% endfor %}
{% endif %}

# local file logging
*.info;mail.none;authpriv.none;cron.none /var/log/messages`}
        />
        <CodeBlock
          title="rendered /etc/rsyslog.conf (excerpt)"
          runnable={false}
          code={`*.* @10.0.0.5:514

# local file logging
*.info;mail.none;authpriv.none;cron.none /var/log/messages`}
        />
        <Callout type="tip">
          <IC>@host:port</IC> is rsyslog syntax for UDP forwarding. If you wanted TCP, template would use <IC>@@host:port</IC>.
          SONiC uses UDP by default. The template could be extended to read a SYSLOG_SERVER field for protocol choice.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="snmp" number="07" title="Example 3: SNMP (snmpd.conf.j2 / snmp.yml.j2)">
        <P>
          SNMP has TWO config files rendered from the same CONFIG_DB tables: <IC>snmpd.conf</IC> (classic Net-SNMP) and
          <IC>snmp.yml</IC> (for snmp-agent container). Here&apos;s the CONFIG_DB shape:
        </P>
        <CodeBlock
          title="redis_snmp.sh"
          code={`redis-cli -n 4 HGETALL "SNMP|LOCATION"
redis-cli -n 4 HGETALL "SNMP_COMMUNITY|public"`}
          output={`1) "Location"
2) "Seattle DC1 Rack 42"

1) "type"
2) "RO"`}
        />
        <CodeBlock
          title="snmpd.conf.j2 (simplified)"
          runnable={false}
          code={`agentAddress udp:161

{% if SNMP and SNMP.LOCATION %}
sysLocation {{ SNMP.LOCATION.Location }}
{% endif %}

{% if SNMP_COMMUNITY %}
{% for community, data in SNMP_COMMUNITY.items() %}
{% if data.type == "RO" %}
rocommunity {{ community }}
{% else %}
rwcommunity {{ community }}
{% endif %}
{% endfor %}
{% endif %}`}
        />
        <CodeBlock
          title="rendered /etc/snmp/snmpd.conf"
          runnable={false}
          code={`agentAddress udp:161

sysLocation Seattle DC1 Rack 42

rocommunity public`}
        />
        <Callout type="behind">
          Note <IC>{`{% for community, data in SNMP_COMMUNITY.items() %}`}</IC> — this iterates the dict as key-value pairs
          (Python dict.items()). Each community string is the key, data is the nested dict with <IC>type: RO/RW</IC>.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="dhcp-relay" number="08" title="Example 4: DHCP Relay (supervisord args)">
        <P>
          DHCP Relay runs inside the <IC>dhcp-relay</IC> container. Its supervisord config is templated to generate
          CLI args for <IC>dhcrelay</IC> based on CONFIG_DB entries.
        </P>
        <CodeBlock
          title="redis_dhcp_relay.sh"
          code={`redis-cli -n 4 HGETALL "DHCP_RELAY|Vlan100"`}
          output={`1) "dhcpv4_servers"
2) "192.168.10.10,192.168.10.11"
3) "dhcpv4_option"
4) ""`}
        />
        <CodeBlock
          title="dhcrelay.conf.j2 (supervisord format)"
          runnable={false}
          code={`[program:dhcrelay]
command=/usr/sbin/dhcrelay -d -m discard -a %%h:%%p %%P --name-alias-map-file /tmp/port-name-alias-map.txt {% for vlan, data in DHCP_RELAY.items() %}-i {{ vlan }} {% for srv in data.dhcpv4_servers.split(',') %}{{ srv }} {% endfor %}{% endfor %}
priority=3
autostart=false
autorestart=false
stdout_logfile=syslog
stderr_logfile=syslog`}
        />
        <CodeBlock
          title="rendered /etc/supervisor/conf.d/dhcrelay.conf"
          runnable={false}
          code={`[program:dhcrelay]
command=/usr/sbin/dhcrelay -d -m discard -a %h:%p %P --name-alias-map-file /tmp/port-name-alias-map.txt -i Vlan100 192.168.10.10 192.168.10.11
priority=3
autostart=false
autorestart=false
stdout_logfile=syslog
stderr_logfile=syslog`}
        />
        <Callout type="mistake">
          Notice <IC>{`data.dhcpv4_servers.split(',')`}</IC> — the Redis field is a comma-separated string, NOT a JSON array.
          The template splits it into a Python list to iterate. This is a quirk of YANG-to-Redis mapping for leaf-list types.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="locations" number="09" title="Template Locations in SONiC">
        <Table
          head={["Template location", "Purpose"]}
          rows={[
            [
              "/usr/share/sonic/templates/",
              "Host OS templates (NTP, SYSLOG, interfaces, ports rendered at boot)",
            ],
            [
              "/usr/share/sonic/templates/docker/<name>/",
              "Per-container templates (mounted into Docker at /usr/share/sonic/templates/)",
            ],
            [
              "sonic-buildimage/files/image_config/<svc>/*.j2",
              "Source repo for host templates (copied into image at build time)",
            ],
            [
              "sonic-buildimage/dockers/docker-<name>/*.j2",
              "Source repo for container templates (COPY into Dockerfile)",
            ],
          ]}
        />
        <CodeBlock
          title="template_search_example.sh"
          code={`# on a SONiC switch, list all templates:
find /usr/share/sonic/templates -name "*.j2"

# in source repo:
find sonic-buildimage/files/image_config -name "*.j2"
find sonic-buildimage/dockers -name "*.j2"`}
          output={`# example output (partial):
/usr/share/sonic/templates/interfaces.j2
/usr/share/sonic/templates/ports.json.j2
/usr/share/sonic/templates/chrony/chrony.conf.j2
/usr/share/sonic/templates/rsyslog/rsyslog.conf.j2`}
        />
      </Section>

      {/* 10 */}
      <Section id="render-chain" number="10" title="Render-on-Event Chain">
        <P>
          Templates are rendered in two scenarios: <strong>(1) boot-time</strong> (static config from JSON) and{" "}
          <strong>(2) run-time</strong> (dynamic re-render when CONFIG_DB changes via hostcfgd event handler).
        </P>
        <CodeBlock
          title="render_scenarios.txt"
          runnable={false}
          code={`BOOT-TIME (once):
  rc.local / systemd service → sonic-cfggen -j config_db.json -t interfaces.j2
                             → writes /etc/network/interfaces
                             → ifup -a (bring up ports)

RUN-TIME (on Redis keyspace event):
  user runs: config ntp add 10.1.1.1
  → CONFIG_DB: HSET NTP_SERVER|10.1.1.1 NULL NULL
  → Redis keyspace event: __keyspace@4__:NTP_SERVER|10.1.1.1 hset
  → hostcfgd subscribed to NTP_SERVER table
  → NtpCfg.ntp_server_update() callback fires
  → Python code: run_command("sonic-cfggen -d -t chrony.conf.j2 > /tmp/chrony.conf")
  → atomic move: mv /tmp/chrony.conf /etc/chrony/chrony.conf
  → systemctl restart chrony
  → chronyd reads new config, syncs to 10.1.1.1`}
        />
        <Callout type="behind">
          hostcfgd (sonic-host-services/scripts/hostcfgd) is a Python daemon that subscribes to CONFIG_DB tables
          via SubscriberStateTable. When a key changes, it triggers a callback that re-renders the template and
          restarts the relevant service. This is the auto-magic behind &quot;config change → daemon updated.&quot;
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging Template Failures ⭐">
        <P>
          Template rendering can fail silently (old config remains) or loudly (daemon crash). Here&apos;s the triage flowchart:
        </P>
        <CodeBlock
          title="debug_flowchart.txt"
          runnable={false}
          code={`Symptom: config command succeeds but daemon behavior unchanged

Step 1: check CONFIG_DB — is the key actually there?
  redis-cli -n 4 KEYS "TABLE|*"
  → if MISSING: mgmt framework bug (CVL/translib/transformer didn't write)
  → if PRESENT: go to step 2

Step 2: check rendered file mtime
  ls -l /etc/chrony/chrony.conf
  → if OLD timestamp (before config change): hostcfgd didn't re-render
     check: journalctl -u hostcfgd | grep -i error
            look for UndefinedError, TemplateNotFound, or Python traceback
  → if NEW timestamp: file rendered, daemon didn't reload — go to step 3

Step 3: manual render test
  sonic-cfggen -d -t chrony.conf.j2
  → if crashes with UndefinedError: template references key not in CONFIG_DB
     fix: add missing key OR change template to use | default("fallback")
  → if renders OK: hostcfgd render succeeded but service restart failed
     check: systemctl status chrony
            journalctl -u chrony  (daemon syntax error in config?)

Step 4: diff rendered vs expected
  diff <(sonic-cfggen -d -t chrony.conf.j2) /etc/chrony/chrony.conf
  → if DIFFERENT: atomicity bug (rare) or manual edit to /etc file
  → if SAME but daemon ignores: daemon caching or not watching file`}
        />
        <Callout type="tip">
          The most common failure: template has <IC>{`{{ SOME_KEY }}`}</IC> but CONFIG_DB doesn&apos;t have SOME_KEY table.
          Fix: either populate the key OR change template to <IC>{`{{ SOME_KEY | default({}) }}`}</IC> for graceful fallback.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <P>
          <strong>Goal:</strong> Manually add a fake SYSLOG_SERVER entry, render the rsyslog template, observe output,
          remove the entry, and confirm the rendered file reverts.
        </P>
        <CodeBlock
          title="lab_steps.sh"
          code={`# Step 1: baseline — check current syslog servers
redis-cli -n 4 KEYS "SYSLOG_SERVER|*"

# Step 2: add a fake syslog server (Redis direct write)
redis-cli -n 4 HSET "SYSLOG_SERVER|192.0.2.99" "NULL" "NULL"

# Step 3: render rsyslog.conf manually (preview mode)
sonic-cfggen -d -t /usr/share/sonic/templates/rsyslog/rsyslog.conf.j2

# Step 4: write rendered output to temp file
sonic-cfggen -d -t /usr/share/sonic/templates/rsyslog/rsyslog.conf.j2 > /tmp/rsyslog_test.conf

# Step 5: check the rendered line
grep "192.0.2.99" /tmp/rsyslog_test.conf

# Step 6: remove the fake entry
redis-cli -n 4 DEL "SYSLOG_SERVER|192.0.2.99"

# Step 7: re-render and confirm the line is GONE
sonic-cfggen -d -t /usr/share/sonic/templates/rsyslog/rsyslog.conf.j2 | grep "192.0.2.99"

# Step 8: (optional) trigger hostcfgd re-render via config CLI
config syslog add 192.0.2.99
show syslog
config syslog del 192.0.2.99`}
          output={`# Step 1: (empty list or existing servers)
(empty array)

# Step 3 output (partial):
*.* @192.0.2.99:514

# Step 5:
*.* @192.0.2.99:514

# Step 7: (no output — line removed)

# Step 8: show syslog output:
SERVER IP
-----------
192.0.2.99`}
        />
        <Callout type="note">
          Expected results: Step 3 shows the new line <IC>*.* @192.0.2.99:514</IC>. Step 7 shows NO match (line gone).
          This proves the template dynamically adapts to CONFIG_DB state without touching template source code.
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is sonic-cfggen and when is it used?",
              "sonic-cfggen is SONiC's config file renderer. It pulls data from CONFIG_DB or JSON, loads a Jinja2 template, and outputs Linux daemon config files. Used at boot (rendering from config_db.json) and at runtime (hostcfgd re-renders on CONFIG_DB changes).",
            ],
            [
              "How does SONiC avoid config duplication across dozens of daemons?",
              "Single source of truth: CONFIG_DB stores intent (e.g., NTP_SERVER keys). Each daemon's config is a Jinja2 template that reads the SAME keys but renders daemon-specific syntax. Change the IP once in Redis → all templates re-render automatically.",
            ],
            [
              "What happens if a Jinja2 template references an undefined CONFIG_DB key?",
              "jinja2.exceptions.UndefinedError crash. The rendered file is NOT written (atomic write aborted), old config remains valid. Logged to syslog. Fix: add missing key to CONFIG_DB OR use Jinja2 filter {{ KEY | default('fallback') }}.",
            ],
            [
              "Explain the render-on-event chain for NTP.",
              "'config ntp add 10.1.1.1' → CONFIG_DB write → Redis keyspace event → hostcfgd NtpCfg handler → sonic-cfggen renders chrony.conf.j2 → atomic write to /etc/chrony/chrony.conf → systemctl restart chrony → chronyd reads new config.",
            ],
            [
              "Where are SONiC templates stored?",
              "Host: /usr/share/sonic/templates/ (boot templates like interfaces.j2). Containers: /usr/share/sonic/templates/ inside docker (mounted). Source: sonic-buildimage/files/image_config/<svc>/*.j2 (host) and dockers/docker-<name>/*.j2 (container).",
            ],
            [
              "How do you preview a template render without writing the file?",
              "Run sonic-cfggen -d -t template.j2 with NO output redirect (prints to stdout). Pipe to diff to compare: diff <(sonic-cfggen -d -t tpl.j2) /etc/actual.conf. This is a safe dry-run.",
            ],
            [
              "What is the NTP_SERVER table shape and how does the template loop it?",
              "NTP_SERVER is a dict of dicts: {\"10.1.1.1\": {\"NULL\":\"NULL\"}, ...}. Template uses {% for server in NTP_SERVER %} which iterates KEYS. Values are ignored (legacy keyonly table quirk). Each server becomes a 'server {{ server }} iburst' line.",
            ],
            [
              "Config is in CONFIG_DB but rendered file didn't update — debug steps?",
              "(1) Check file mtime (ls -l) — if old, hostcfgd didn't re-render. (2) journalctl -u hostcfgd | grep error → UndefinedError? (3) Manual render: sonic-cfggen -d -t template.j2 → does it crash? (4) diff rendered vs actual file. (5) Check service restart: systemctl status daemon.",
            ],
            [
              "Why does DHCP_RELAY template use .split(',') on dhcpv4_servers?",
              "The CONFIG_DB field dhcpv4_servers is stored as a comma-separated STRING (e.g., \"192.168.10.10,192.168.10.11\") due to YANG leaf-list → Redis mapping. Template splits it into a Python list to iterate with {% for srv in ... %}.",
            ],
            [
              "What is hostcfgd's role in template rendering?",
              "hostcfgd subscribes to CONFIG_DB tables (NTP_SERVER, SYSLOG_SERVER, etc.) via SubscriberStateTable. On keyspace events, it triggers callbacks that re-render the relevant template and restart the daemon. It's the auto-render daemon for runtime config changes.",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["sonic-cfggen flags", "-d (CONFIG_DB) -j file.json -t template.j2 -a '{\"extra\":\"data\"}' > out"],
            ["Jinja2 variable", "{{ var }} — substitute value"],
            ["Jinja2 loop", "{% for x in list %} ... {% endfor %} — iterates keys if dict"],
            ["Jinja2 conditional", "{% if cond %} ... {% else %} ... {% endif %}"],
            ["Default filter", "{{ var | default('fallback') }} — prevents UndefinedError"],
            ["Host templates", "/usr/share/sonic/templates/ (interfaces.j2, ports.json.j2, chrony.conf.j2)"],
            ["Container templates", "/usr/share/sonic/templates/ inside docker (mounted from host)"],
            ["Render on event", "CONFIG_DB change → keyspace event → hostcfgd handler → sonic-cfggen → file write → systemctl restart"],
            ["UndefinedError", "Template refs missing key → crash, NO file write, old config safe, logged to syslog"],
            ["Preview mode", "sonic-cfggen -d -t tpl.j2 (no output file) → stdout for diff/inspection"],
            ["NTP template loop", "{% for server in NTP_SERVER %} server {{ server }} iburst {% endfor %}"],
            ["Debug mismatch", "ls -l file (mtime), journalctl -u hostcfgd (errors), manual sonic-cfggen (test render), diff output vs actual"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
