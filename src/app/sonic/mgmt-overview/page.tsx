"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "A RESTCONF PATCH enters the system",
  nodes: [
    { id: "client", icon: "🌐", label: "REST / gNMI client", sub: "curl / gNMI tool", x: 6, y: 50, color: "#22d3ee" },
    { id: "rest", icon: "🚪", label: "REST Server", sub: ":443 · Go", x: 22, y: 22, color: "#fb923c" },
    { id: "klish", icon: "⌨️", label: "KLISH CLI", sub: "sonic-cli", x: 22, y: 78, color: "#fbbf24" },
    { id: "translib", icon: "📚", label: "Translib", sub: "YANG brain", x: 42, y: 50, color: "#a78bfa" },
    { id: "xfmr", icon: "🔁", label: "Transformer", sub: "YANG↔Redis", x: 60, y: 22, color: "#34d399" },
    { id: "cvl", icon: "🛡️", label: "CVL", sub: "validation", x: 60, y: 78, color: "#60a5fa" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "redis n=4", x: 82, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "client-rest", from: "client", to: "rest", color: "#fb923c" },
    { id: "client-klish", from: "client", to: "klish", color: "#fbbf24" },
    { id: "rest-translib", from: "rest", to: "translib", color: "#a78bfa" },
    { id: "klish-translib", from: "klish", to: "translib", color: "#a78bfa" },
    { id: "translib-xfmr", from: "translib", to: "xfmr", color: "#34d399" },
    { id: "translib-cvl", from: "translib", to: "cvl", color: "#60a5fa" },
    { id: "xfmr-redis", from: "xfmr", to: "redis", color: "#f472b6" },
    { id: "cvl-redis", from: "cvl", to: "redis", dashed: true, color: "#60a5fa" },
    { id: "cvl-translib", from: "cvl", to: "translib", bend: -25, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "patch-ntp",
      name: "✅ PATCH NTP server",
      command: "curl -X PATCH .../ntp/servers/server=10.1.1.1/config",
      steps: [
        { node: "client", paths: ["client-rest"], text: "External client sends RESTCONF PATCH to https://switch-ip/restconf/data/openconfig-system:system/ntp/servers/server=10.1.1.1/config with JSON body." },
        { node: "rest", paths: ["rest-translib"], text: "REST server (Go, runs in mgmt-framework container) parses URL, unmarshals JSON via ygot (YANG-generated Go structs), routes to translib." },
        { node: "translib", paths: ["translib-xfmr", "translib-cvl"], text: "Translib receives Update RPC. Calls app module (ntp.go), which invokes transformer to convert YANG path → Redis schema, and CVL to validate." },
        { node: "xfmr", paths: [], text: "Transformer maps openconfig-system:system/ntp/servers/server[address=10.1.1.1] → CONFIG_DB key NTP_SERVER|10.1.1.1 (SONiC schema)." },
        { node: "cvl", paths: ["cvl-redis"], text: "CVL validates: YANG constraints (address is valid IP? ✅), semantic checks (max servers? ✅). Validation passes. Proceeds to DB write." },
        { node: "redis", paths: [], text: "CONFIG_DB gets HSET NTP_SERVER|10.1.1.1. hostcfgd (host daemon) subscribes, wakes up, writes /etc/ntp.conf, restarts ntpd. NTP server configured. ✅ REST returns 204 No Content." },
      ],
    },
    {
      id: "cvl-reject",
      name: "❌ CVL rejects invalid VLAN",
      command: "curl -X PATCH .../vlans/vlan=5000/config",
      steps: [
        { node: "client", paths: ["client-rest"], text: "Client tries to create VLAN 5000 (invalid — 802.1Q range is 1-4094)." },
        { node: "rest", paths: ["rest-translib"], text: "REST server unmarshals, routes to translib vlan app module." },
        { node: "translib", paths: ["translib-cvl"], text: "Translib calls CVL.ValidateEditConfig() with the proposed change." },
        { node: "cvl", paths: ["cvl-translib"], text: "CVL loads YANG model (openconfig-vlan.yang), sees 'range 1..4094' constraint. 5000 is OUT OF RANGE. Validation FAILS. 🚨" },
        { node: "translib", paths: [], text: "Translib receives CVL error, aborts DB write, returns gRPC error to REST server." },
        { node: "rest", paths: [], text: "REST server translates to HTTP 400 Bad Request: {'error': 'VLAN ID 5000 out of range 1-4094'}. CONFIG_DB unchanged. System protected. 🛡️" },
      ],
    },
    {
      id: "cli-is-rest",
      name: "🔁 KLISH CLI is REST too",
      command: "sonic-cli: ntp server 10.1.1.1",
      steps: [
        { node: "client", paths: ["client-klish"], text: "User types 'ntp server 10.1.1.1' in KLISH CLI (sonic-cli command). This is NOT legacy expect-scripting — it's REST under the hood." },
        { node: "klish", paths: ["klish-translib"], text: "KLISH XML command tree (CLI/clitree/ntp.xml) maps the command to Python actioner script (CLI/actioner/sonic_cli_ntp.py)." },
        { node: "translib", paths: ["translib-xfmr", "translib-cvl"], text: "Actioner constructs the SAME YANG path + JSON payload that the REST client would, calls translib.Update() directly (in-process Go call, no HTTP). EXACT same code path as REST. 🔁" },
        { node: "xfmr", paths: ["xfmr-redis"], text: "Transformer converts to NTP_SERVER|10.1.1.1, CVL validates, writes CONFIG_DB." },
        { node: "redis", paths: [], text: "hostcfgd processes, updates /etc/ntp.conf. CLI shows 'Success'. The genius: CLI, REST, gNMI all hit the SAME translib brain — one validation logic, one transformation, zero duplication. 🎯" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-mgmt", label: "What is sonic-mgmt-framework? ⭐" },
  { id: "why-exists", label: "Why It Exists — The Problem Solved" },
  { id: "three-doors", label: "The Three Northbound Doors ⭐" },
  { id: "restconf", label: "RESTCONF — HTTP + YANG ⭐" },
  { id: "gnmi", label: "gNMI — Google's Telemetry Protocol" },
  { id: "klish-cli", label: "KLISH CLI — REST in Disguise" },
  { id: "repo-map", label: "Repository Map" },
  { id: "request-lifecycle", label: "Request Lifecycle ⭐" },
  { id: "translib", label: "Translib — The Brain" },
  { id: "cvl", label: "CVL — Config Validation Library" },
  { id: "transformer", label: "Transformer — YANG ↔ Redis" },
  { id: "auth", label: "Authentication & Authorization" },
  { id: "debugging", label: "Debugging the Mgmt Framework" },
  { id: "lab", label: "Lab Exercise — Send REST Requests" },
  { id: "interview", label: "Interview Questions ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicMgmtOverviewPage() {
  return (
    <TopicShell
      icon="🧭"
      title="Management Framework — The Northbound Door"
      gradientWord="Management"
      subtitle="sonic-mgmt-framework is SONiC's modern northbound interface: REST, gNMI, and CLI all powered by the same YANG-driven brain. Learn the three doors, the request lifecycle (REST→translib→transformer→CVL→redis), the repo structure, real curl commands, and how KLISH CLI is just REST in disguise."
      nav={NAV}
      badges={["🚪 3 northbound APIs", "🧠 Translib internals", "🔒 CVL validation", "🌐 Real REST calls"]}
      next={{ icon: "📦", label: "mgmt-common Deep Dive", href: "/sonic/mgmt-common" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-mgmt" number="01" title="What is sonic-mgmt-framework? ⭐">
        <P>
          <strong>sonic-mgmt-framework</strong> is SONiC&apos;s modern management interface. It
          provides three northbound APIs — <strong>RESTCONF</strong> (HTTP/JSON), <strong>gNMI</strong>{" "}
          (gRPC telemetry), and <strong>KLISH CLI</strong> (interactive shell) — all driven by the
          same underlying <strong>YANG models</strong> and validation logic.
        </P>
        <P>Key components:</P>
        <Table
          head={["Component", "What it is"]}
          rows={[
            [<strong key="rest">REST server</strong>, "Go HTTP server (main.go in sonic-mgmt-framework/rest) that implements RESTCONF (RFC 8040). Listens on port 443 (HTTPS). Handles GET/PATCH/POST/DELETE for YANG-modeled resources."],
            [<strong key="klish">KLISH CLI</strong>, "Interactive CLI (sonic-cli command). XML-driven command trees (CLI/clitree/*.xml) that parse user input, call Python actioner scripts, which in turn call the REST API internally. CLI is just a REST client."],
            [<strong key="translib">Translib</strong>, "The brain (in sonic-mgmt-common repo). Go library that receives YANG paths + data, validates via CVL, transforms via transformer, writes to Redis CONFIG_DB. Shared by REST and gNMI."],
            [<strong key="cvl">CVL</strong>, "Config Validation Library (C++ in sonic-mgmt-common). Loads YANG models, validates semantic/syntactic constraints, checks cross-key dependencies (e.g. can't delete a VLAN that has members)."],
            [<strong key="xfmr">Transformer</strong>, "YANG ↔ Redis schema translator (Go in sonic-mgmt-common). Maps OpenConfig YANG paths (e.g. /interfaces/interface[name=Ethernet0]/config/mtu) to SONiC Redis keys (PORT|Ethernet0 field mtu)."],
            [<strong key="yang">YANG models</strong>, "Schema definitions (models/yang/*.yang). SONiC uses OpenConfig models (openconfig-interfaces.yang, openconfig-vlan.yang, etc.) plus SONiC-specific extensions (sonic-port.yang)."],
          ]}
        />
        <Callout type="analogy">
          Think of sonic-mgmt-framework as the <strong>front desk</strong> of a hotel. Three doors
          (REST, gNMI, CLI) all lead to the same concierge (translib). The concierge speaks the
          hotel&apos;s language (YANG), checks your request against the rulebook (CVL), translates it
          to the internal system (transformer → Redis), and makes it happen. One brain, three
          interfaces. 🏨
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="why-exists" number="02" title="Why It Exists — The Problem It Solved">
        <P>Before sonic-mgmt-framework, SONiC had three separate management paths:</P>
        <CodeBlock
          title="the_old_world.txt"
          runnable={false}
          code={`BEFORE sonic-mgmt-framework (SONiC pre-2019):

1️⃣ LEGACY CLI (click, Python scripts)
   • Python scripts that directly write CONFIG_DB
   • No YANG models, no validation
   • Every command is bespoke code
   • Changes break backward compat

2️⃣ RESTFUL API (sonic-rest-server)
   • Different code path from CLI
   • Different validation logic
   • Different schema (Swagger, not YANG)
   • Maintained separately → drift

3️⃣ SNMP (read-only, mostly)
   • MIB-based, different schema again
   • Limited writes (SNMP SET is fragile)

THE NIGHTMARE:
 • 3 implementations of "add VLAN"
 • 3 sets of validation bugs
 • 3 schemas to keep in sync
 • API changes break CLI, or vice versa
 • YANG compliance? Zero. (Cloud operators wanted OpenConfig)

THE FIX: sonic-mgmt-framework (2019-2020)
 ✅ ONE YANG-driven brain (translib)
 ✅ THREE interfaces (REST, gNMI, CLI) all call translib
 ✅ ONE validation layer (CVL)
 ✅ ONE schema (OpenConfig YANG + SONiC extensions)
 ✅ ZERO code duplication for northbound logic
 ✅ Industry-standard APIs (RESTCONF RFC 8040, gNMI gRPC)

RESULT:
 • CLI command "vlan add 100" → calls REST API → calls translib
 • REST PATCH /vlans/vlan=100 → calls translib
 • gNMI Set /vlans/vlan[vlan-id=100] → calls translib
 → SAME code validates, transforms, writes CONFIG_DB 🎯`}
        />
        <Callout type="tip">
          Interview gold: "SONiC&apos;s mgmt-framework unified three management interfaces (CLI, REST,
          gNMI) under one YANG-driven translib brain. Before this, each interface had separate
          validation and schema, causing drift and bugs. Now KLISH CLI literally calls the REST API
          internally — they share the exact same code path. This is the DevOps dream: one source of
          truth, OpenConfig compliance, and model-driven automation." 🎯
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="three-doors" number="03" title="The Three Northbound Doors ⭐">
        <CodeBlock
          title="the_three_doors.txt"
          runnable={false}
          code={`┌────────────────────────────────────────────────────────────────┐
│                    NORTHBOUND INTERFACES                       │
├──────────────────┬──────────────────┬──────────────────────────┤
│  1️⃣ RESTCONF     │  2️⃣ gNMI          │  3️⃣ KLISH CLI            │
│  (RFC 8040)      │  (gRPC)          │  (interactive shell)     │
├──────────────────┼──────────────────┼──────────────────────────┤
│ Protocol         │ Protocol         │ Protocol                 │
│  HTTP/HTTPS      │  gRPC            │  SSH → bash → sonic-cli  │
│  JSON/XML body   │  protobuf        │  command parser          │
│                  │                  │                          │
│ Port             │ Port             │ Port                     │
│  443 (HTTPS)     │  8080 (insecure) │  22 (SSH)                │
│  rest_server     │  9339 (secure)   │                          │
│                  │                  │                          │
│ Container        │ Container        │ Container                │
│  mgmt-framework  │  telemetry       │  mgmt-framework          │
│                  │  (separate!)     │  (sonic-cli binary)      │
│                  │                  │                          │
│ Use case         │ Use case         │ Use case                 │
│  Automation      │  Streaming       │  Human operators         │
│  Ansible/Python  │  telemetry       │  Interactive config      │
│  CI/CD pipelines │  Prometheus      │  Troubleshooting         │
│  3rd-party tools │  Real-time       │                          │
│                  │  observability   │                          │
│                  │                  │                          │
│ Example          │ Example          │ Example                  │
│  curl -X PATCH   │  gnmi_set -xpath │  sonic-cli               │
│  .../interfaces  │  /interfaces/... │  (config)# vlan 100      │
└──────────────────┴──────────────────┴──────────────────────────┘
                            ↓
              ┌─────────────────────────────┐
              │   📚 TRANSLIB (the brain)   │
              │   YANG + CVL + Transformer  │
              └─────────────┬───────────────┘
                            ↓
                   🗄️ CONFIG_DB (Redis)

ALL THREE DOORS → ONE BRAIN → ONE DATABASE ✅`}
        />
      </Section>

      {/* 04 */}
      <Section id="restconf" number="04" title="RESTCONF — HTTP + YANG ⭐">
        <P>
          <strong>RESTCONF</strong> (RFC 8040) is REST for YANG models. URLs are YANG paths, HTTP
          methods map to CRUD operations, JSON payloads follow YANG schema.
        </P>
        <P>Base URL: <IC>https://&lt;switch-ip&gt;/restconf/data/</IC></P>
        <CodeBlock
          title="restconf_url_structure.txt"
          runnable={false}
          code={`RESTCONF URL anatomy:

https://<switch-ip>/restconf/data/<yang-module>:<top-container>/<path>

Examples:
GET  /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/state
  → Read operational state of Ethernet0

PATCH /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config
  → Update config of Ethernet0 (e.g. set MTU, admin status)

POST /restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans
  → Create a new VLAN (list entry)

DELETE /restconf/data/openconfig-system:system/ntp/servers/server=10.1.1.1
  → Delete NTP server 10.1.1.1

HTTP methods:
  GET     — read (state or config)
  PATCH   — update (merge semantics, doesn't delete unmentioned fields)
  PUT     — replace (overwrites entire resource)
  POST    — create (list entries)
  DELETE  — remove
  OPTIONS — YANG schema introspection (CORS, metadata)

Response codes:
  200 OK         — GET succeeded
  201 Created    — POST succeeded
  204 No Content — PATCH/DELETE succeeded (no body returned)
  400 Bad Request — validation failed (CVL error)
  404 Not Found  — resource doesn't exist
  500 Internal Server Error — translib/redis crashed

Content-Type: application/yang-data+json (RFC 8040)
  (or application/yang-data+xml for XML fans)`}
        />
        <P>Real example: Configure NTP server via RESTCONF</P>
        <CodeBlock
          title="curl_restconf_ntp.sh"
          code={`# Add NTP server 10.1.1.1
curl -k -X PATCH \\
  "https://10.0.0.1/restconf/data/openconfig-system:system/ntp/servers/server=10.1.1.1/config" \\
  -H "Content-Type: application/yang-data+json" \\
  -u admin:YourPaSsWoRd \\
  -d '{
    "openconfig-system:config": {
      "address": "10.1.1.1"
    }
  }'

# Response: 204 No Content (success)

# Verify: GET the NTP config
curl -k -X GET \\
  "https://10.0.0.1/restconf/data/openconfig-system:system/ntp/servers" \\
  -u admin:YourPaSsWoRd | jq .`}
          output={`{
  "openconfig-system:servers": {
    "server": [
      {
        "address": "10.1.1.1",
        "config": {
          "address": "10.1.1.1"
        },
        "state": {
          "address": "10.1.1.1",
          "stratum": 3,
          "root-delay": 12,
          "root-dispersion": 23,
          "offset": -2
        }
      }
    ]
  }
}`}
        />
        <P>Configure port Ethernet0 admin status and MTU:</P>
        <CodeBlock
          title="curl_restconf_port.sh"
          code={`# Bring up Ethernet0 and set MTU to 9000
curl -k -X PATCH \\
  "https://10.0.0.1/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config" \\
  -H "Content-Type: application/yang-data+json" \\
  -u admin:YourPaSsWoRd \\
  -d '{
    "openconfig-interfaces:config": {
      "enabled": true,
      "mtu": 9000
    }
  }'

# Response: 204 No Content

# Verify in CONFIG_DB:
# (on switch) redis-cli -n 4 hgetall "PORT|Ethernet0"`}
          output={`1) "admin_status"
2) "up"
3) "mtu"
4) "9000"
5) "alias"
6) "Eth1/1"
7) "lanes"
8) "25,26,27,28"
9) "speed"
10) "100000"`}
        />
        <Callout type="note">
          The <IC>-k</IC> flag in curl disables TLS certificate verification (fine for lab/dev,
          NEVER in production — use proper certs). Authentication is HTTP Basic (username:password
          in -u flag). SONiC also supports JWT tokens and client certificates (configured in
          REST_SERVER table in CONFIG_DB).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="gnmi" number="05" title="gNMI — Google&apos;s Network Management Interface">
        <P>
          <strong>gNMI</strong> (gRPC Network Management Interface) is Google&apos;s protocol for
          network telemetry and config. It runs in the <strong>telemetry</strong> container
          (separate from mgmt-framework), uses gRPC (not HTTP), and shares the same translib +
          YANG backend.
        </P>
        <CodeBlock
          title="gnmi_basics.txt"
          runnable={false}
          code={`gNMI PROTOCOL:
  Transport: gRPC (HTTP/2 + protobuf)
  Ports: 8080 (insecure), 9339 (TLS)
  RPCs:
    Get       — read config/state (like RESTCONF GET)
    Set       — write config (like RESTCONF PATCH)
    Subscribe — streaming telemetry (UNIQUE to gNMI — push model)

SONIC CONTAINER: telemetry (NOT mgmt-framework!)
  • sonic-gnmi binary (Go, wraps translib)
  • Subscribes to redis COUNTERS_DB, STATE_DB
  • Streams updates to gNMI clients (Prometheus, Telegraf, etc.)

PATHS: YANG xpaths, same as RESTCONF
  /openconfig-interfaces:interfaces/interface[name=Ethernet0]/state/counters/in-octets
  /openconfig-system:system/ntp/servers

TOOLS:
  gnmi_get   — read (like curl GET)
  gnmi_set   — write (like curl PATCH)
  gnmi_cli   — interactive gNMI shell`}
        />
        <P>Example: Get interface counters via gNMI</P>
        <CodeBlock
          title="gnmi_get_counters.sh"
          code={`# Get Ethernet0 counters
gnmi_get \\
  -target_addr 10.0.0.1:8080 \\
  -insecure \\
  -username admin \\
  -password YourPaSsWoRd \\
  -xpath '/openconfig-interfaces:interfaces/interface[name=Ethernet0]/state/counters'`}
          output={`{
  "notification": [
    {
      "timestamp": 1678901234567890000,
      "update": [
        {
          "path": {
            "elem": [
              {"name": "openconfig-interfaces:interfaces"},
              {"name": "interface", "key": {"name": "Ethernet0"}},
              {"name": "state"},
              {"name": "counters"}
            ]
          },
          "val": {
            "json_ietf_val": "{
              \\"in-octets\\": \\"482934823947\\",
              \\"in-unicast-pkts\\": \\"1293842342\\",
              \\"in-broadcast-pkts\\": \\"123456\\",
              \\"in-multicast-pkts\\": \\"234234\\",
              \\"in-discards\\": \\"0\\",
              \\"in-errors\\": \\"0\\",
              \\"out-octets\\": \\"129384234234\\",
              \\"out-unicast-pkts\\": \\"892374234\\",
              \\"out-discards\\": \\"0\\",
              \\"out-errors\\": \\"0\\"
            }"
          }
        }
      ]
    }
  ]
}`}
        />
        <P>Example: Set port admin status via gNMI</P>
        <CodeBlock
          title="gnmi_set_port.sh"
          code={`# Shutdown Ethernet0
gnmi_set \\
  -target_addr 10.0.0.1:8080 \\
  -insecure \\
  -username admin \\
  -password YourPaSsWoRd \\
  -update '/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/enabled:false'`}
          output={`{
  "response": [
    {
      "path": {
        "elem": [
          {"name": "openconfig-interfaces:interfaces"},
          {"name": "interface", "key": {"name": "Ethernet0"}},
          {"name": "config"},
          {"name": "enabled"}
        ]
      },
      "op": "UPDATE"
    }
  ]
}
# Port is now admin down`}
        />
        <P>gNMI Subscribe (streaming telemetry):</P>
        <CodeBlock
          title="gnmi_subscribe.sh"
          code={`# Stream Ethernet0 counters every 10 seconds
gnmi_cli -a 10.0.0.1:8080 \\
  -logtostderr \\
  -insecure \\
  -username admin \\
  -password YourPaSsWoRd \\
  -q 'subscribe(sample(10s), /interfaces/interface[name=Ethernet0]/state/counters)' \\
  -streaming_type SAMPLE`}
          output={`# Live stream (Ctrl-C to stop):
timestamp: 1678901234567890000
update: {
  path: { elem: [... /counters/in-octets] }
  val: { uint_val: 482934823947 }
}
timestamp: 1678901244567890000  # +10s
update: {
  path: { elem: [... /counters/in-octets] }
  val: { uint_val: 482947238912 }  # counter increased
}
# This is real-time telemetry — Prometheus scrapes this 📊`}
        />
        <Callout type="behind">
          gNMI Subscribe is the killer feature. Traditional SNMP = pull (poller asks every 30s,
          wastes CPU, misses spikes). gNMI Subscribe = push (switch streams updates as they
          happen). The telemetry container subscribes to COUNTERS_DB redis pub/sub (via flex
          counters), converts to gNMI Notifications, streams to clients. Sub-second observability,
          zero polling overhead. 🚀
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="klish-cli" number="06" title="KLISH CLI — REST in Disguise 🎭">
        <P>
          <strong>KLISH</strong> is SONiC&apos;s interactive CLI (the <IC>sonic-cli</IC> command). It
          looks like a traditional network CLI (Cisco-like syntax), but under the hood it&apos;s just
          calling the REST API. Zero duplicate logic.
        </P>
        <CodeBlock
          title="klish_architecture.txt"
          runnable={false}
          code={`KLISH ARCHITECTURE:

┌────────────────────────────────────────────────────────────┐
│ 1️⃣ User types command                                      │
│    sonic-cli> configure                                    │
│    sonic-cli(config)> interface Ethernet 0                 │
│    sonic-cli(config-if-Ethernet0)> mtu 9000                │
│    sonic-cli(config-if-Ethernet0)> no shutdown             │
└────────────────┬───────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 2️⃣ KLISH XML command tree parses input                     │
│    File: CLI/clitree/cli-xml/interface.xml                 │
│    <COMMAND name="mtu" help="Set MTU">                     │
│      <PARAM name="mtu-val" ptype="RANGE_MTU_1280_9216"/>   │
│      <ACTION>python \$SONIC_CLI_ROOT/sonic_cli_if.py patch_openconfig_if_ethernet_config_mtu mtu=\${mtu-val} if_name=\${iface}</ACTION>
│    </COMMAND>                                              │
└────────────────┬───────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 3️⃣ Python actioner script                                  │
│    CLI/actioner/sonic_cli_if.py:                           │
│    def patch_openconfig_if_ethernet_config_mtu(mtu, if_name):
│        path = f"/restconf/data/openconfig-interfaces:interfaces/interface={if_name}/config"
│        body = {"openconfig-interfaces:config": {"mtu": int(mtu)}}
│        response = invoke_rest_api("PATCH", path, body)     │
│        return response                                     │
│    → THIS IS A REST CLIENT! 🔁                             │
└────────────────┬───────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 4️⃣ invoke_rest_api() calls rest_server (in-process)        │
│    Because sonic-cli and rest_server both run in           │
│    mgmt-framework container, the "REST call" is actually   │
│    an in-process Go function call (no HTTP overhead).      │
│    But the CODE PATH is identical to external curl! 🎯     │
└────────────────┬───────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 5️⃣ Translib → CVL → Transformer → CONFIG_DB               │
│    (same flow as section 08)                               │
└────────────────────────────────────────────────────────────┘

WHY THIS IS GENIUS:
  • Zero CLI-specific validation logic (CVL does it)
  • Zero CLI-specific schema (YANG does it)
  • CLI command = syntactic sugar over REST call
  • Fix a bug in translib → CLI and REST both fixed 🎯
  • CLI can be GENERATED from YANG models (SONiC does this!)`}
        />
        <P>Real KLISH CLI session:</P>
        <CodeBlock
          title="klish_session.txt"
          code={`# Enter KLISH CLI
sonic-cli

# Configure mode
sonic> enable
sonic# configure terminal

# Add VLAN 100
sonic(config)# vlan 100
sonic(config-vlan-100)# exit

# Add port to VLAN
sonic(config)# interface Ethernet 0
sonic(config-if-Ethernet0)# switchport access vlan 100
sonic(config-if-Ethernet0)# exit

# Save config
sonic(config)# write memory

# Exit
sonic(config)# exit
sonic# exit`}
          output={`sonic-cli
sonic> enable
sonic# configure terminal
sonic(config)# vlan 100
Success
sonic(config-vlan-100)# exit
sonic(config)# interface Ethernet 0
sonic(config-if-Ethernet0)# switchport access vlan 100
Success
sonic(config-if-Ethernet0)# write memory
Success
# Behind the scenes, each command sent REST calls:
# POST /restconf/data/.../vlans → vlan 100
# PATCH /restconf/data/.../vlan-members → add Ethernet0`}
        />
        <Callout type="tip">
          Interview insight: "KLISH CLI is not a legacy CLI with expect scripts. Every command is
          defined in XML (CLI/clitree/*.xml), mapped to a Python actioner that constructs a YANG
          path + JSON payload, and calls the REST API (in-process, no HTTP overhead). This means
          CLI, REST, and gNMI share the EXACT same validation and transformation logic. One brain,
          three syntaxes. That&apos;s the mgmt-framework genius." 🎯
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="repo-map" number="07" title="Repository Map">
        <P>sonic-mgmt-framework spans two GitHub repos:</P>
        <Table
          head={["Repo", "What it contains"]}
          rows={[
            [<strong key="fw">sonic-mgmt-framework</strong>, "REST server (rest/main/main.go), KLISH CLI (CLI/clitree, CLI/actioner), build system. This is the 'frontend' — the three northbound doors."],
            [<strong key="common">sonic-mgmt-common</strong>, "Translib (translib/*.go), CVL (cvl/*.go, C++), Transformer (transformer/*.go), YANG models (models/yang/*.yang). This is the 'backend' — the brain. Shared by REST and gNMI."],
            [<strong key="gnmi">sonic-gnmi</strong>, "gNMI server (gnmi_server/server.go), telemetry daemon. Runs in telemetry container, imports sonic-mgmt-common/translib."],
          ]}
        />
        <P>Key directories in sonic-mgmt-framework:</P>
        <CodeBlock
          title="sonic-mgmt-framework_tree.txt"
          runnable={false}
          code={`sonic-mgmt-framework/
├── rest/
│   ├── main/
│   │   └── main.go               # REST server entry point
│   ├── server/
│   │   ├── router.go             # URL routing (YANG path → handler)
│   │   ├── handler.go            # HTTP request processing
│   │   └── auth.go               # PAM, JWT, cert auth
│   └── ocbinds/                  # ygot-generated Go structs from YANG
├── CLI/
│   ├── clitree/                  # KLISH XML command trees
│   │   ├── cli-xml/interface.xml
│   │   ├── cli-xml/vlan.xml
│   │   └── cli-xml/ntp.xml
│   ├── actioner/                 # Python scripts (REST clients)
│   │   ├── sonic_cli_if.py       # interface commands
│   │   ├── sonic_cli_vlan.py     # VLAN commands
│   │   └── sonic_cli_ntp.py      # NTP commands
│   └── klish/                    # KLISH binary + libs
└── build/
    └── rest_server/              # Docker build artifacts`}
        />
        <P>Key directories in sonic-mgmt-common:</P>
        <CodeBlock
          title="sonic-mgmt-common_tree.txt"
          runnable={false}
          code={`sonic-mgmt-common/
├── translib/                     # The brain
│   ├── translib.go               # Public API (Create, Update, Replace, Delete, Get, Subscribe)
│   ├── app_interface.go          # App module interface
│   ├── db/                       # Redis client wrappers
│   └── tlerr/                    # Error types
├── translib/transformer/         # YANG ↔ Redis
│   ├── transformer.go            # Core transformer logic
│   ├── xlate_*.go                # YANG path translators (per module)
│   └── xfmr_*.go                 # Custom transformers
├── cvl/                          # Config Validation Library (C++)
│   ├── cvl.go                    # Go wrapper (cgo)
│   ├── cvl.cc                    # C++ implementation
│   ├── cvl_api.h                 # Public API
│   └── schema/                   # YANG schema cache
├── models/yang/                  # YANG models
│   ├── openconfig-interfaces.yang
│   ├── openconfig-vlan.yang
│   ├── openconfig-system.yang
│   ├── sonic-port.yang           # SONiC extensions
│   └── sonic-vlan.yang
└── build/
    ├── cvl/libcvl.so             # CVL shared library
    └── rest_server/              # Build output`}
        />
      </Section>

      {/* 08 */}
      <Section id="request-lifecycle" number="08" title="Request Lifecycle — REST → Redis ⭐">
        <P>
          Let&apos;s trace one RESTCONF PATCH through the full stack. Example:{" "}
          <IC>PATCH /interfaces/interface=Ethernet0/config {"{"}"mtu": 9000{"}"}</IC>
        </P>
        <CodeBlock
          title="request_lifecycle.txt"
          runnable={false}
          code={`REQUEST: PATCH /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config
BODY: {"openconfig-interfaces:config": {"mtu": 9000}}

┌────────────────────────────────────────────────────────────────┐
│ 1️⃣ HTTP server receives request (rest/main/main.go)            │
│    • TLS termination (HTTPS port 443)                          │
│    • HTTP Basic Auth or JWT validation                         │
│    • Extract: method=PATCH, path=/restconf/data/..., body=JSON │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 2️⃣ Router maps URL to handler (rest/server/router.go)          │
│    • Parse YANG path:                                          │
│      module: openconfig-interfaces                             │
│      container: interfaces                                     │
│      list: interface (key: name=Ethernet0)                     │
│      leaf: config/mtu                                          │
│    • Route to handler: ProcessUpdate()                         │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 3️⃣ Unmarshal JSON → Go struct (ygot, rest/ocbinds/)            │
│    • ygot validates JSON schema matches YANG                   │
│    • Constructs: OpenconfigInterfaces_Interfaces_Interface{    │
│        Name: "Ethernet0",                                      │
│        Config: &OpenconfigInterfaces_Interfaces_Interface_Config{│
│          Mtu: ygot.Uint16(9000),                               │
│        }                                                       │
│      }                                                         │
│    • Type-safe Go struct → no typos in field names ✅          │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 4️⃣ Call Translib.Update() (translib/translib.go)               │
│    req := SetRequest{                                          │
│      Path: "/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu",
│      Payload: []byte("{\\"mtu\\": 9000}"),                       │
│    }                                                           │
│    resp := translib.Update(req)                                │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 5️⃣ Translib routes to app module (translib/app_interface.go)   │
│    • Parses YANG path, identifies module: openconfig-interfaces│
│    • Loads app: IntfApp (defined in translib/intf_app.go)      │
│    • Calls: IntfApp.processUpdate(path, payload)               │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 6️⃣ Transformer converts YANG → Redis (transformer/*.go)        │
│    • Input: /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu = 9000
│    • Transformer logic:                                        │
│      xpath_to_db_map:                                          │
│        "/openconfig-interfaces:interfaces/interface/config/mtu"│
│         → db: CONFIG_DB                                        │
│         → table: PORT                                          │
│         → key: {interface name}  (e.g. "Ethernet0")            │
│         → field: "mtu"                                         │
│    • Output: CONFIG_DB key="PORT|Ethernet0" field="mtu" value="9000"
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 7️⃣ CVL validates (cvl/cvl.cc, C++)                             │
│    • Loads YANG model (openconfig-interfaces.yang cached)      │
│    • Checks YANG constraints:                                  │
│      - mtu type: uint16 (range 0-65535) ✅                     │
│      - SONiC extension: range 1280-9216 ✅ (9000 in range)     │
│    • Semantic validation:                                      │
│      - Does PORT|Ethernet0 exist? (read CONFIG_DB) ✅          │
│      - Any cross-key dependencies? (e.g. port in LAG?) Check ✅│
│    • Validation PASSES → proceed                              │
│    • (If failed, CVL returns error → translib aborts → REST returns 400)
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 8️⃣ Write to CONFIG_DB (translib/db/db.go → redis)              │
│    redis-cli -n 4 HSET "PORT|Ethernet0" "mtu" "9000"           │
│    → Keyspace notification published: __keyspace@4__:PORT|Ethernet0
│    → Orchagent wakes up, reads new mtu, cascades to ASIC_DB   │
└────────────────┬───────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 9️⃣ Return success to REST server                               │
│    • Translib returns: {ErrCode: 0} (success)                  │
│    • REST server translates to: HTTP 204 No Content            │
│    • No body returned (RESTCONF spec for PATCH success)        │
└────────────────────────────────────────────────────────────────┘

TOTAL LATENCY: ~20-50ms
  HTTP routing: <1ms
  ygot unmarshal: ~2ms
  Translib + Transformer: ~5ms
  CVL validation: ~10ms (YANG parsing, semantic checks)
  Redis write: <1ms
  HTTP response: <1ms`}
        />
        <Callout type="tip">
          Interview deep-dive: "When a RESTCONF PATCH hits the switch, the REST server unmarshals
          JSON into a ygot-generated Go struct (type-safe YANG binding), calls translib.Update()
          with the YANG path. Translib routes to the appropriate app module (e.g. IntfApp for
          interfaces), which calls the transformer to map the YANG path to a Redis key (e.g.
          /interfaces/interface[name=Ethernet0]/config/mtu → CONFIG_DB PORT|Ethernet0 field mtu).
          Then CVL validates: YANG constraints (type, range) AND semantic checks (does the port
          exist? cross-key deps?). If valid, translib writes CONFIG_DB, orchagent picks it up via
          pub/sub, cascades to ASIC. REST returns 204. The key insight: transformer and CVL are
          SHARED by REST, gNMI, and CLI — one validation logic for all three doors." 🎯
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="translib" number="09" title="Translib — The Brain">
        <P>
          <strong>Translib</strong> is the core library that processes YANG-based requests. It&apos;s
          written in Go (sonic-mgmt-common/translib/), used by REST server and gNMI server.
        </P>
        <P>Public API (the functions external clients call):</P>
        <CodeBlock
          title="translib_api.go (simplified)"
          runnable={false}
          code={`package translib

// Create: Add a new resource (POST)
func Create(req SetRequest) (SetResponse, error)

// Update: Modify an existing resource (PATCH)
func Update(req SetRequest) (SetResponse, error)

// Replace: Overwrite a resource (PUT)
func Replace(req SetRequest) (SetResponse, error)

// Delete: Remove a resource (DELETE)
func Delete(req SetRequest) (SetResponse, error)

// Get: Read config or state (GET)
func Get(req GetRequest) (GetResponse, error)

// Subscribe: Stream updates (gNMI Subscribe)
func Subscribe(req SubscribeRequest) ([]*IsSubscribeResponse, error)

// Types:
type SetRequest struct {
    Path    string          // YANG path, e.g. "/openconfig-interfaces:interfaces/..."
    Payload []byte          // JSON body
    User    UserRoles       // Auth context
}

type GetRequest struct {
    Path       string
    User       UserRoles
    GetContent int          // CONFIG, STATE, or ALL
}

type SetResponse struct {
    ErrCode int             // 0 = success, non-zero = error code
    Payload []byte          // Response body (if any)
}

// Under the hood, translib:
//  1. Parses YANG path → determines app module
//  2. Calls app module (e.g. IntfApp, VlanApp, NtpApp)
//  3. App module invokes Transformer (YANG → Redis)
//  4. App module invokes CVL (validate)
//  5. App module writes CONFIG_DB via db client
//  6. Returns response`}
        />
        <P>App modules are registered in a table:</P>
        <CodeBlock
          title="translib_app_registry.txt"
          runnable={false}
          code={`App registry (translib/app_interface.go):

appMap := map[string]func() AppInterface{
    "openconfig-interfaces":      NewIntfApp,
    "openconfig-network-instance": NewNIApp,  // VLANs, VRFs
    "openconfig-system":          NewSysApp,  // NTP, DNS, hostname
    "openconfig-acl":             NewAclApp,
    "openconfig-platform":        NewPlatformApp,
    "sonic-port":                 NewIntfApp,  // SONiC extension
    ...
}

// When a request comes in with path "/openconfig-interfaces:interfaces/...",
// translib looks up "openconfig-interfaces" → calls NewIntfApp() → IntfApp.processUpdate()`}
        />
      </Section>

      {/* 10 */}
      <Section id="cvl" number="10" title="CVL — Config Validation Library 🛡️">
        <P>
          <strong>CVL</strong> (Config Validation Library) is the gatekeeper. Written in C++
          (sonic-mgmt-common/cvl/), wrapped in Go via cgo. It validates EVERY config change before
          it touches CONFIG_DB.
        </P>
        <P>What CVL checks:</P>
        <Table
          head={["Check type", "Example"]}
          rows={[
            [<strong key="yang">YANG syntax</strong>, "Field type: mtu must be uint16. String \"abc\" rejected."],
            [<strong key="range">YANG constraints</strong>, "Range: VLAN ID 1-4094. 5000 rejected. Enum: fec must be \"rs\", \"fc\", or \"none\". \"xyz\" rejected."],
            [<strong key="mand">YANG mandatory</strong>, "openconfig-interfaces:config/name is mandatory. Missing → rejected."],
            [<strong key="exists">Key existence</strong>, "Can't add VLAN_MEMBER|Vlan100|Ethernet0 if VLAN|Vlan100 doesn't exist. Rejected."],
            [<strong key="deps">Cross-key deps</strong>, "Can't delete PORT|Ethernet0 if it's a member of LAG PortChannel1. Rejected."],
            [<strong key="must">YANG 'must' statements</strong>, "openconfig-vlan.yang: 'vlan-id must be in range 1..4094'. CVL evaluates XPath expressions."],
            [<strong key="when">YANG 'when' conditionals</strong>, "If interface type=ethernetCsmacd, then auto-negotiate leaf is allowed. If type=other, auto-negotiate is forbidden."],
          ]}
        />
        <P>CVL API (from Go):</P>
        <CodeBlock
          title="cvl_go_api.go (simplified)"
          runnable={false}
          code={`package cvl

// ValidateEditConfig: Validate a proposed config change
func (c *CVL) ValidateEditConfig(jsonData []byte) (CVLRetCode, CVLErrorInfo) {
    // jsonData is the full edit (e.g. {"PORT": {"Ethernet0": {"mtu": "9000"}}})
    // CVL:
    //  1. Loads cached YANG schema (openconfig-interfaces.yang, sonic-port.yang)
    //  2. Parses JSON, maps to YANG tree
    //  3. Validates types, ranges, enums, mandatory fields
    //  4. Reads current CONFIG_DB to check key existence, cross-key deps
    //  5. Evaluates YANG must/when expressions (XPath evaluation in libyang)
    //  6. Returns: CVL_SUCCESS or CVL_FAILURE + detailed error
}

// CVLRetCode enum:
CVL_SUCCESS                = 0
CVL_SYNTAX_ERROR           = 1  // Invalid JSON
CVL_SEMANTIC_ERROR         = 2  // YANG constraint violated
CVL_SYNTAX_MISSING_FIELD   = 3  // Mandatory field missing
CVL_SYNTAX_INVALID_FIELD   = 4  // Unknown field
CVL_SEMANTIC_KEY_NOT_EXIST = 5  // Referenced key doesn't exist
CVL_SEMANTIC_DEPENDENT_DATA_EXIST = 6  // Can't delete (has dependents)

// CVLErrorInfo:
type CVLErrorInfo struct {
    ErrCode    CVLRetCode
    TableName  string   // e.g. "PORT"
    Keys       []string // e.g. ["Ethernet0"]
    Field      string   // e.g. "mtu"
    Value      string   // e.g. "9000"
    Msg        string   // Human-readable error
    ConstraintErrMsg string // YANG constraint details
}`}
        />
        <P>Under the hood, CVL uses <strong>libyang</strong> (C library for YANG parsing):</P>
        <CodeBlock
          title="cvl_internals.txt"
          runnable={false}
          code={`CVL INTERNALS:

1. On startup, CVL loads all YANG models from models/yang/*.yang
   → Parses with libyang → builds schema tree → caches in memory

2. When ValidateEditConfig() is called:
   a. Parse JSON → build data tree (libyang lyd_parse_mem)
   b. Validate data tree against schema tree (lyd_validate_all)
      → Checks: types, ranges, enums, mandatory, must, when
   c. For each CONFIG_DB key in the edit:
      - Read current CONFIG_DB (redis HGETALL)
      - Check if dependencies exist (e.g. VLAN exists before adding member)
      - Check if dependents exist (e.g. can't delete port if in LAG)
   d. Return validation result

EXAMPLE FAILURE:
  JSON: {"VLAN": {"Vlan5000": {"vlanid": "5000"}}}
  CVL loads openconfig-vlan.yang:
    leaf vlan-id { type uint16 { range "1..4094"; } }
  CVL evaluates: 5000 > 4094 → RANGE VIOLATION
  CVL returns:
    CVL_SEMANTIC_ERROR
    TableName: VLAN
    Field: vlanid
    Value: 5000
    ConstraintErrMsg: "vlan-id must be in range 1..4094"

  Translib aborts → REST server returns HTTP 400:
    {"error": "VLAN ID 5000 out of range 1-4094"}`}
        />
        <Callout type="behind">
          CVL is the reason SONiC can safely accept YANG-based config from untrusted sources.
          Before CVL, a bad CLI command could write invalid config to CONFIG_DB, orchagent would
          choke, and you&apos;d have to manually fix redis. With CVL, invalid config NEVER reaches
          CONFIG_DB. The database is always valid. That&apos;s infrastructure hygiene. 🛡️
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="transformer" number="11" title="Transformer — YANG ↔ Redis 🔁">
        <P>
          <strong>Transformer</strong> maps between two schemas: <strong>YANG</strong> (northbound,
          OpenConfig-compliant) and <strong>Redis</strong> (southbound, SONiC-specific).
        </P>
        <P>The mapping problem:</P>
        <CodeBlock
          title="the_mapping_problem.txt"
          runnable={false}
          code={`YANG (OpenConfig standard):
  /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu
   ↕️  MUST MAP TO  ↕️
REDIS (SONiC schema):
  CONFIG_DB database 4
  key: PORT|Ethernet0
  field: mtu

CHALLENGES:
1. Path syntax differs:
   YANG uses xpaths with predicates [name=Ethernet0]
   Redis uses keys with separators PORT|Ethernet0

2. Key structure differs:
   YANG lists use 'name' leaf as key
   Redis uses composite keys (table|key1|key2)

3. Field names differ:
   YANG: 'enabled' (bool) → Redis: 'admin_status' ("up"/"down" string)
   YANG: 'mtu' (uint16)   → Redis: 'mtu' (string, because redis values are strings)

4. Nested structures:
   YANG has containers: config { mtu, enabled, ... }
   Redis flattens: PORT|Ethernet0 { mtu, admin_status, speed, ... }

5. List vs. separate keys:
   YANG: vlan-members is a list inside vlan
   Redis: VLAN_MEMBER|Vlan100|Ethernet0 is a separate top-level key

TRANSFORMER'S JOB:
  Northbound (YANG → Redis): decompose YANG path, map to redis table/key/field
  Southbound (Redis → YANG): aggregate redis keys, reconstruct YANG tree`}
        />
        <P>Transformer configuration (xlate maps in transformer/*.go):</P>
        <CodeBlock
          title="transformer_xlate_map.go (excerpt)"
          runnable={false}
          code={`var interfaceXlateMap = map[string]XlateEntry{
    "/openconfig-interfaces:interfaces/interface/config/mtu": {
        DbNum:     CONFIG_DB,
        TableName: "PORT",
        KeyXpath:  "/openconfig-interfaces:interfaces/interface/name",  // Extract "Ethernet0"
        FieldName: "mtu",
        XfmrFunc:  nil,  // Direct mapping, no custom logic
    },
    "/openconfig-interfaces:interfaces/interface/config/enabled": {
        DbNum:     CONFIG_DB,
        TableName: "PORT",
        KeyXpath:  "/openconfig-interfaces:interfaces/interface/name",
        FieldName: "admin_status",
        XfmrFunc:  xlateAdminStatus,  // Custom: true→"up", false→"down"
    },
}

func xlateAdminStatus(value interface{}) (string, error) {
    enabled := value.(bool)
    if enabled {
        return "up", nil
    } else {
        return "down", nil
    }
}`}
        />
        <P>Transformer in action (YANG → Redis):</P>
        <CodeBlock
          title="transformer_example.txt"
          runnable={false}
          code={`INPUT (YANG):
  PATCH /openconfig-interfaces:interfaces/interface=Ethernet0/config
  Body: {"enabled": true, "mtu": 9000}

TRANSFORMER PROCESSING:
  Step 1: Parse path, extract key
    interface name = "Ethernet0"

  Step 2: For each field in body:
    a. "enabled": true
       → Lookup xlate map: /interfaces/interface/config/enabled
       → Table: PORT, Key: Ethernet0, Field: admin_status
       → XfmrFunc: xlateAdminStatus(true) → "up"
       → Redis: HSET PORT|Ethernet0 admin_status "up"

    b. "mtu": 9000
       → Lookup xlate map: /interfaces/interface/config/mtu
       → Table: PORT, Key: Ethernet0, Field: mtu
       → Direct map: 9000 → "9000" (redis values are strings)
       → Redis: HSET PORT|Ethernet0 mtu "9000"

OUTPUT (Redis commands):
  redis-cli -n 4 HSET "PORT|Ethernet0" "admin_status" "up"
  redis-cli -n 4 HSET "PORT|Ethernet0" "mtu" "9000"`}
        />
        <P>Transformer in reverse (Redis → YANG, for GET requests):</P>
        <CodeBlock
          title="transformer_reverse.txt"
          runnable={false}
          code={`INPUT (GET request):
  GET /openconfig-interfaces:interfaces/interface=Ethernet0/config

TRANSFORMER PROCESSING:
  Step 1: Identify redis keys to read
    → Table: PORT, Key: Ethernet0
    → redis-cli -n 4 HGETALL "PORT|Ethernet0"

  Step 2: Read redis:
    {"alias": "Eth1/1", "lanes": "25,26,27,28", "speed": "100000",
     "mtu": "9100", "admin_status": "up", "fec": "rs"}

  Step 3: For each redis field, reverse-map to YANG:
    a. "mtu": "9100"
       → YANG leaf: /interfaces/interface/config/mtu
       → Type: uint16 → convert string "9100" to int 9100

    b. "admin_status": "up"
       → YANG leaf: /interfaces/interface/config/enabled
       → XfmrFunc reverse: "up" → true (bool)

OUTPUT (YANG JSON):
  {
    "openconfig-interfaces:config": {
      "name": "Ethernet0",
      "type": "iana-if-type:ethernetCsmacd",
      "mtu": 9100,
      "enabled": true,
      "description": ""
    }
  }`}
        />
        <Callout type="tip">
          Interview insight: "The transformer decouples SONiC&apos;s internal Redis schema from the
          northbound YANG schema. This means SONiC can change its internal database layout without
          breaking the OpenConfig API. For example, if SONiC decides to store MTU differently in
          Redis, we update the transformer mapping — REST clients see zero change. The YANG API is
          stable; the Redis schema can evolve. This is the adapter pattern at infrastructure
          scale." 🎯
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="auth" number="12" title="Authentication & Authorization">
        <P>
          The REST server and gNMI server support multiple auth mechanisms:
        </P>
        <Table
          head={["Method", "How it works"]}
          rows={[
            [<strong key="pam">PAM (Linux users)</strong>, "Default. HTTP Basic Auth with Linux username/password. REST server calls PAM library (same as SSH). User must exist in /etc/passwd. RBAC via Linux groups (admin, operator)."],
            [<strong key="jwt">JWT tokens</strong>, "Enable via CONFIG_DB REST_SERVER table: jwt_valid_duration, jwt_secret. Client POSTs /authenticate with user/pass → gets JWT token → includes in Authorization: Bearer header. Token expires after N seconds."],
            [<strong key="cert">Client certificates</strong>, "Mutual TLS. REST server configured with CA cert (rest_server --client-auth). Client sends X.509 cert signed by CA. Username extracted from cert CN field."],
            [<strong key="tacacs">TACACS+</strong>, "Enterprise AAA. SONiC forwards auth to remote TACACS+ server (configured in CONFIG_DB TACPLUS_SERVER). Server returns permit/deny + privilege level."],
          ]}
        />
        <P>RBAC (Role-Based Access Control):</P>
        <CodeBlock
          title="rbac.txt"
          runnable={false}
          code={`SONiC RBAC (simplified):

ROLES:
  admin    — full read/write (can do anything)
  operator — read-only + safe writes (e.g. clear counters, NOT delete VLANs)

MAPPING:
  Linux group → SONiC role
  /etc/group:
    sudo:x:27:admin       # 'admin' user is in sudo group → SONiC role 'admin'
    operator:x:1001:ops   # 'ops' user is in operator group → SONiC role 'operator'

AUTHORIZATION CHECK (in translib):
  Every translib API call includes UserRoles in the request:
    req := SetRequest{
        Path: "/interfaces/...",
        User: UserRoles{Name: "ops", Roles: []string{"operator"}},
    }

  Translib checks:
    if operation == DELETE && user.Role != "admin":
        return ErrForbidden  // 403 Forbidden

REST SERVER INTEGRATION:
  • On HTTP request, REST server extracts username (from Basic Auth / JWT / cert)
  • Looks up user's role via PAM/TACACS+
  • Passes UserRoles to translib
  • translib enforces RBAC (some paths are admin-only)
  • If denied, translib returns error → REST returns 403 Forbidden

EXAMPLE:
  User 'ops' (operator role) tries:
    DELETE /restconf/data/.../vlan=100
  → Translib checks: DELETE requires admin role
  → ops is operator → DENIED
  → REST returns: 403 Forbidden {"error": "Insufficient privileges"}`}
        />
      </Section>

      {/* 13 */}
      <Section id="debugging" number="13" title="Debugging the Mgmt Framework">
        <CodeBlock
          title="debugging_mgmt_framework.sh"
          code={`# 1. Check if mgmt-framework container is running
docker ps | grep mgmt-framework
# Should show: Up X days

# 2. Check REST server logs
docker logs mgmt-framework --tail 100 --follow | grep -E "ERROR|WARN|rest_server"

# 3. Check REST server process
docker exec -it mgmt-framework ps aux | grep rest_server
# Should show: /usr/sbin/rest_server

# 4. Test REST endpoint with curl -v (verbose)
curl -k -v -X GET \\
  "https://10.0.0.1/restconf/data/openconfig-system:system" \\
  -u admin:YourPaSsWoRd
# Look for HTTP response code, TLS handshake, auth headers

# 5. Check syslog for translib/CVL errors
tail -f /var/log/syslog | grep -E "translib|CVL|rest_server"

# 6. Enable debug logging (add to CONFIG_DB)
redis-cli -n 4 hset "REST_SERVER|default" "log_level" "trace"
docker restart mgmt-framework
# Now logs are VERY verbose (every HTTP request, translib call)

# 7. Check CVL schema cache
docker exec -it mgmt-framework ls -lh /usr/models/yang/
# Should show .yang files + .yin compiled schemas

# 8. Test with gnmi_cli (if gNMI is the issue)
gnmi_cli -a 10.0.0.1:8080 -logtostderr -insecure \\
  -username admin -password YourPaSsWoRd \\
  -q 'capabilities'
# Returns: supported YANG models (if server is healthy)

# 9. Manually trigger CVL validation (advanced)
docker exec -it mgmt-framework bash
cd /tmp
cat > test.json <<EOF
{"PORT": {"Ethernet0": {"mtu": "99999"}}}
EOF
cvl-validate test.json
# Should fail: mtu 99999 out of range

# 10. Check transformer mappings (if wrong Redis key)
docker exec -it mgmt-framework bash
cd /usr/sbin/
strings rest_server | grep -i "openconfig-interfaces"
# Hacky but sometimes reveals if model is loaded`}
        />
      </Section>

      {/* 14 */}
      <Section id="lab" number="14" title="Lab Exercise — Send REST Requests">
        <CodeBlock
          title="lab_rest_requests.sh"
          code={`# Prerequisites: SONiC switch with mgmt-framework running, IP 10.0.0.1

# Step 1: Get system info (hostname, version)
curl -k -X GET \\
  "https://10.0.0.1/restconf/data/openconfig-system:system/config" \\
  -u admin:YourPaSsWoRd | jq .

# Expected: {"openconfig-system:config": {"hostname": "sonic", ...}}

# Step 2: Create VLAN 200
curl -k -X POST \\
  "https://10.0.0.1/restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans" \\
  -H "Content-Type: application/yang-data+json" \\
  -u admin:YourPaSsWoRd \\
  -d '{
    "openconfig-network-instance:vlan": [
      {
        "vlan-id": 200,
        "config": {
          "vlan-id": 200,
          "name": "Data_VLAN"
        }
      }
    ]
  }'

# Expected: 201 Created (or 204 if already exists)

# Step 3: Verify in CONFIG_DB
ssh admin@10.0.0.1 "redis-cli -n 4 hgetall 'VLAN|Vlan200'"
# Expected: vlanid = 200

# Step 4: Add Ethernet0 to VLAN 200 (untagged)
curl -k -X POST \\
  "https://10.0.0.1/restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans/vlan=200/members" \\
  -H "Content-Type: application/yang-data+json" \\
  -u admin:YourPaSsWoRd \\
  -d '{
    "openconfig-network-instance:member": [
      {
        "interface": "Ethernet0",
        "config": {
          "interface": "Ethernet0"
        }
      }
    ]
  }'

# Expected: 201 Created

# Step 5: Get VLAN config via REST
curl -k -X GET \\
  "https://10.0.0.1/restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans/vlan=200" \\
  -u admin:YourPaSsWoRd | jq .

# Expected: shows vlan-id: 200, members: ["Ethernet0"]

# Step 6: Try to create VLAN 5000 (should fail CVL validation)
curl -k -X POST \\
  "https://10.0.0.1/restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans" \\
  -H "Content-Type: application/yang-data+json" \\
  -u admin:YourPaSsWoRd \\
  -d '{
    "openconfig-network-instance:vlan": [
      {
        "vlan-id": 5000,
        "config": {"vlan-id": 5000}
      }
    ]
  }'

# Expected: 400 Bad Request
# {"error": "VLAN ID 5000 out of range 1-4094"}

# Step 7: Delete VLAN 200
curl -k -X DELETE \\
  "https://10.0.0.1/restconf/data/openconfig-network-instance:network-instances/network-instance=default/vlans/vlan=200" \\
  -u admin:YourPaSsWoRd

# Expected: 204 No Content

# Step 8: Verify deletion in redis
ssh admin@10.0.0.1 "redis-cli -n 4 keys 'VLAN*' | grep 200"
# Expected: no output (VLAN 200 deleted)`}
          output={`# Sample output for Step 1:
{
  "openconfig-system:config": {
    "hostname": "sonic",
    "login-banner": "SONiC switch",
    "motd-banner": ""
  }
}

# Sample output for Step 6 (validation failure):
{
  "ietf-restconf:errors": {
    "error": [
      {
        "error-type": "application",
        "error-tag": "invalid-value",
        "error-message": "VLAN ID 5000 out of range 1-4094"
      }
    ]
  }
}
# CVL caught it! 🛡️`}
        />
      </Section>

      {/* 15 */}
      <Section id="interview" number="15" title="Interview Questions ⭐">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["What is sonic-mgmt-framework and why does SONiC need it?", "sonic-mgmt-framework is SONiC's modern northbound interface, providing RESTCONF (HTTP/JSON), gNMI (gRPC telemetry), and KLISH CLI. Before it, SONiC had separate code paths for CLI, REST, and SNMP — different validation, different schemas, maintenance nightmare. mgmt-framework unified them under one YANG-driven brain (translib), so CLI/REST/gNMI share the same validation (CVL), transformation (transformer), and database writes. OpenConfig compliance, zero duplication, model-driven config."],
            ["Explain the three northbound doors and which one you'd use when.", "RESTCONF (port 443, mgmt-framework container): automation, Ansible, CI/CD pipelines. gNMI (port 8080/9339, telemetry container): streaming telemetry, Prometheus scraping, real-time observability. KLISH CLI (sonic-cli via SSH): human operators, interactive troubleshooting. All three call translib internally, so they share validation logic. KLISH CLI literally constructs REST calls under the hood — it's REST in disguise."],
            ["Walk me through the lifecycle of a RESTCONF PATCH request.", "Client sends HTTPS PATCH to /restconf/data/.../interface=Ethernet0/config with JSON body. REST server (Go) unmarshals JSON via ygot (YANG-generated struct), validates schema match. Calls translib.Update() with YANG path. Translib routes to app module (IntfApp), which calls transformer to map YANG path → Redis key (PORT|Ethernet0 field mtu). Calls CVL to validate (YANG constraints + semantic checks). If valid, writes CONFIG_DB via redis client. Returns success → REST returns 204. Orchagent picks up via pub/sub, cascades to ASIC. Total ~20-50ms."],
            ["What is CVL and what does it validate?", "CVL is the Config Validation Library (C++ with Go wrapper, uses libyang). It validates EVERY config change before it touches CONFIG_DB. Checks: YANG syntax (types, ranges, enums), YANG constraints (must/when expressions, mandatory fields), semantic checks (does the referenced key exist? are there cross-key dependencies like 'can't delete VLAN with members'?). If CVL rejects, translib aborts, REST returns 400, CONFIG_DB unchanged. This keeps the database always valid — no garbage in."],
            ["What does the transformer do?", "Transformer maps between two schemas: YANG (northbound, OpenConfig standard, e.g. /interfaces/interface[name=Ethernet0]/config/mtu) and Redis (southbound, SONiC internal, e.g. CONFIG_DB PORT|Ethernet0 field mtu). It has xlate maps that define the mapping, plus custom XfmrFuncs for conversions (e.g. YANG 'enabled' bool → Redis 'admin_status' string \"up\"/\"down\"). This decouples the northbound API from the internal database, so SONiC can change Redis schema without breaking clients."],
            ["How is KLISH CLI implemented? Is it like Cisco IOS?", "No, it's not legacy expect scripts. KLISH uses XML command trees (CLI/clitree/*.xml) that parse user input. Each command maps to a Python actioner script (CLI/actioner/*.py) that constructs a YANG path + JSON payload and calls the REST API (in-process, no HTTP overhead — it's a direct Go function call to translib). So 'vlan 100' in CLI becomes the same translib.Update() call that a curl PATCH would make. CLI, REST, gNMI share EXACT same code path — one brain, three syntaxes."],
            ["What's the difference between sonic-mgmt-framework and sonic-mgmt-common?", "sonic-mgmt-framework is the frontend (REST server, KLISH CLI — the three northbound doors). sonic-mgmt-common is the backend (translib, CVL, transformer, YANG models — the brain). sonic-gnmi (gNMI server in telemetry container) imports sonic-mgmt-common/translib. So mgmt-common is a shared library used by both REST and gNMI. The separation keeps the core logic (validation, transformation) reusable."],
            ["How does authentication work in the REST server?", "Default is PAM (Linux users, HTTP Basic Auth). REST server calls PAM to check user/password, same as SSH. RBAC via Linux groups: sudo group → admin role (full access), operator group → operator role (read-only + safe writes). Also supports JWT tokens (client POSTs /authenticate → gets token → includes in Authorization: Bearer header) and client certificates (mutual TLS, username from cert CN). TACACS+ for enterprise AAA. Auth context (UserRoles) passed to translib, which enforces RBAC (e.g. DELETE requires admin)."],
            ["What happens if CVL validation fails?", "CVL returns an error code (CVL_SEMANTIC_ERROR, CVL_SYNTAX_ERROR, etc.) plus details (table, key, field, constraint message). Translib aborts the DB write, returns the error to REST server. REST server translates to HTTP 400 Bad Request with JSON error body. CONFIG_DB is NOT touched — the bad config never enters the system. Example: VLAN 5000 out of range → CVL fails → REST returns 400 '{\"error\": \"VLAN ID 5000 out of range 1-4094\"}'. User fixes, retries. This is fail-fast validation."],
            ["Why does gNMI run in a separate container (telemetry) instead of mgmt-framework?", "Historical + operational separation. gNMI Subscribe does streaming telemetry (subscribes to COUNTERS_DB, pushes updates to clients) — high throughput, different resource profile than REST (which is request/response). Keeping them separate allows independent scaling and restart. You can restart mgmt-framework (REST/CLI) without breaking telemetry streams. Both import sonic-mgmt-common/translib, so they share the brain, just different containers for ops flexibility."],
          ]}
        />
      </Section>

      {/* 16 */}
      <Section id="memorize" number="16" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Three doors", "RESTCONF (443, HTTP), gNMI (8080/9339, gRPC), KLISH CLI (sonic-cli)"],
            ["One brain", "Translib — YANG + CVL + Transformer → all three doors call it"],
            ["RESTCONF base URL", "/restconf/data/<yang-module>:<container>/<path>"],
            ["REST methods", "GET (read), PATCH (update), POST (create), DELETE (remove), PUT (replace)"],
            ["gNMI unique feature", "Subscribe — streaming telemetry (push model, not pull)"],
            ["KLISH secret", "CLI commands → Python actioner → REST API call → translib (not expect scripts)"],
            ["Translib API", "Create, Update, Replace, Delete, Get, Subscribe (Go funcs in translib.go)"],
            ["CVL validates", "YANG syntax, constraints, must/when, key existence, cross-key deps"],
            ["Transformer maps", "YANG path ↔ Redis table|key field (xlate maps in transformer/*.go)"],
            ["Auth default", "PAM (Linux users), HTTP Basic Auth, RBAC via groups (admin/operator)"],
            ["CVL fail → REST", "CVL error → translib aborts → REST returns 400 Bad Request"],
            ["Repos", "sonic-mgmt-framework (REST/CLI), sonic-mgmt-common (translib/CVL), sonic-gnmi (gNMI)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
