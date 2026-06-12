"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "One port flap through every database",
  nodes: [
    { id: "cli", icon: "⌨️", label: "CLI", sub: "admin input", x: 6, y: 50, color: "#22d3ee" },
    { id: "configdb", icon: "🗄️", label: "CONFIG_DB", sub: "n=4 · intent", x: 24, y: 22, color: "#fbbf24" },
    { id: "orch", icon: "⚙️", label: "Orchagent", sub: "swss", x: 42, y: 50, color: "#34d399" },
    { id: "appldb", icon: "📮", label: "APPL_DB", sub: "n=0 · processed", x: 24, y: 78, color: "#fb923c" },
    { id: "asicdb", icon: "🧬", label: "ASIC_DB", sub: "n=1 · SAI objects", x: 60, y: 22, color: "#a78bfa" },
    { id: "syncd", icon: "🔌", label: "syncd", sub: "SAI bridge", x: 78, y: 50, color: "#60a5fa" },
    { id: "statedb", icon: "✅", label: "STATE_DB", sub: "n=6 · feedback", x: 60, y: 78, color: "#34d399" },
  ],
  edges: [
    { id: "cli-config", from: "cli", to: "configdb", color: "#fbbf24" },
    { id: "config-orch", from: "configdb", to: "orch", color: "#34d399" },
    { id: "orch-appl", from: "orch", to: "appldb", color: "#fb923c" },
    { id: "orch-asic", from: "orch", to: "asicdb", color: "#a78bfa" },
    { id: "asic-syncd", from: "asicdb", to: "syncd", color: "#60a5fa" },
    { id: "syncd-state", from: "syncd", to: "statedb", color: "#34d399" },
    { id: "config-cli", from: "configdb", to: "cli", bend: -25, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "port-startup",
      name: "🔌 config interface startup Ethernet0",
      command: "config interface startup Ethernet0",
      steps: [
        { node: "cli", paths: ["cli-config"], text: "CLI sends admin_status=up to CONFIG_DB. Validation passes (port exists, valid state transition)." },
        { node: "configdb", paths: ["config-orch"], text: "CONFIG_DB (n=4) HSET PORT|Ethernet0 admin_status 'up'. Keyspace notification __keyspace@4__:PORT|Ethernet0 published." },
        { node: "orch", paths: ["orch-appl", "orch-asic"], text: "Orchagent PortsOrch wakes on notification, reads CONFIG_DB, writes PORT_TABLE:Ethernet0 to APPL_DB (n=0), prepares SAI_PORT_ATTR_ADMIN_STATE=true." },
        { node: "appldb", paths: [], text: "APPL_DB now has PORT_TABLE:Ethernet0 admin_status=up (processed state). Other consumers (lldp, teamd) read from here." },
        { node: "asicdb", paths: ["asic-syncd"], text: "Orchagent writes ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002 SAI_PORT_ATTR_ADMIN_STATE=true to ASIC_DB (n=1)." },
        { node: "syncd", paths: ["syncd-state"], text: "syncd reads ASIC_DB, calls sai_port_api->set_port_attribute(oid, ADMIN_STATE=true), vendor SAI programs ASIC. Link comes up. 💚" },
        { node: "statedb", paths: [], text: "pmon/portsyncd detects link up via kernel netdev events, writes STATE_DB (n=6) PORT_TABLE|Ethernet0 netdev_oper_status=up. Feedback loop complete. ✅" },
      ],
    },
    {
      id: "bad-config",
      name: "❌ Bad config rejected",
      command: "config interface speed Ethernet0 999999",
      steps: [
        { node: "cli", paths: ["cli-config"], text: "User tries to set invalid speed 999999 (not in {1000, 10000, 25000, 40000, 100000, ...})." },
        { node: "configdb", paths: ["config-cli"], text: "CONFIG_DB validation (CVL in mgmt-framework, or config CLI's own checks) REJECTS the value BEFORE writing to redis. Error returned to CLI." },
        { node: "cli", paths: [], text: "CLI shows: 'Error: Invalid speed 999999 for Ethernet0. Supported: 1000, 10000, 40000, 100000.' CONFIG_DB unchanged. System protected. 🛡️" },
      ],
    },
    {
      id: "counter-poll",
      name: "📊 Counter polling (gNMI telemetry)",
      command: "FLEX_COUNTER triggers syncd to poll ASIC",
      steps: [
        { node: "orch", paths: ["orch-asic"], text: "FlexCounter is enabled in CONFIG_DB FLEX_COUNTER_TABLE. Orchagent tells syncd (via FLEX_COUNTER_DB n=5) to poll port counters every 1s." },
        { node: "syncd", paths: ["asic-syncd"], text: "syncd flex counter thread calls sai_port_api->get_port_stats(oid, counter_ids, ...) every 1s, retrieves SAI_PORT_STAT_IF_IN_OCTETS, IF_OUT_OCTETS, etc." },
        { node: "asicdb", paths: [], text: "syncd writes COUNTERS_DB (n=2) COUNTERS:oid:0x1000000000002 with timestamped counter values. COUNTERS_PORT_NAME_MAP maps oid → Ethernet0." },
        { node: "statedb", paths: [], text: "gNMI telemetry container subscribes to COUNTERS_DB, streams updates to external collector (Prometheus, gNMI client). Real-time observability. 📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-redis", label: "Why Redis? ⭐" },
  { id: "db-map", label: "The Database Number Map ⭐" },
  { id: "config-db", label: "CONFIG_DB (n=4) — Intent ⭐" },
  { id: "appl-db", label: "APPL_DB (n=0) — Processed State" },
  { id: "asic-db", label: "ASIC_DB (n=1) — SAI Objects" },
  { id: "counters-db", label: "COUNTERS_DB (n=2) — Telemetry" },
  { id: "state-db", label: "STATE_DB (n=6) — Feedback Loop" },
  { id: "flex-counter-db", label: "FLEX_COUNTER_DB (n=5)" },
  { id: "cascade", label: "The Cascade: CONFIG→APPL→ASIC ⭐" },
  { id: "pub-sub", label: "Pub/Sub Keyspace Notifications" },
  { id: "config-file", label: "Config Files & Persistence" },
  { id: "debugging", label: "Debugging with Redis" },
  { id: "lab", label: "Lab Exercise — Trace One VLAN" },
  { id: "interview", label: "Interview Questions ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicDatabasesPage() {
  return (
    <TopicShell
      icon="🗄️"
      title="Redis Databases — SONiC&apos;s Nervous System"
      gradientWord="Databases"
      subtitle="SONiC's entire state lives in Redis — six databases, each with a purpose. CONFIG_DB holds intent, APPL_DB holds processed state, ASIC_DB holds SAI objects, COUNTERS_DB streams telemetry, STATE_DB closes the feedback loop. Master the database map, learn the key schemas, trace a config change through all six layers."
      nav={NAV}
      badges={["🗄️ 6 databases decoded", "🔑 Real redis-cli sessions", "🔁 Pub/sub internals", "🐛 Debug tactics"]}
      next={{ icon: "🧭", label: "Mgmt Framework Overview", href: "/sonic/mgmt-overview" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-redis" number="01" title="Why Redis? ⭐">
        <P>
          SONiC uses <strong>Redis</strong> (in-memory key-value store) as its central database.
          Why Redis instead of a traditional RDBMS or a custom IPC mechanism?
        </P>
        <CodeBlock
          title="why_redis.txt"
          runnable={false}
          code={`REQUIREMENTS FOR SONIC STATE STORAGE:
✅ In-memory — network state changes at microsecond scale, disk I/O is death
✅ Hash-native — network objects are {key: {field: value}} maps (PORT has speed, mtu, lanes, ...)
✅ Pub/Sub — daemons must react to changes in real-time (orchagent wakes when CONFIG_DB updates)
✅ Atomic operations — HSET must be transactional (no partial port configs)
✅ Simple protocol — C++/Python/Go daemons all need to speak it (Redis protocol is trivial)
✅ Debuggable — operators must see live state (redis-cli is a built-in observability tool)
✅ Language-agnostic — SONiC has daemons in C++ (orchagent), Python (hostcfgd), Go (rest_server)

REDIS WINS ON ALL COUNTS:
• Hashes: HSET "PORT|Ethernet0" "speed" "100000" ← perfect match for network objects
• Pub/sub: keyspace notifications __keyspace@4__:PORT|Ethernet0 ← orchagent subscribes
• Speed: ~1M ops/sec in-memory, <1ms latency ← faster than any network event
• Protocol: text-based RESP (Redis Serialization Protocol) ← any language, easy telnet debug
• Tooling: redis-cli monitor / keys / hgetall ← live introspection for free
• Battle-tested: Redis has been production-hardened since 2009, billions of deploys

ALTERNATIVE APPROACHES (why they lost):
❌ SQL database: too slow (disk I/O), wrong data model (tables ≠ hashes), heavyweight
❌ Custom shared memory: not language-agnostic, no pub/sub, hard to debug
❌ gRPC/protobuf: requires code-gen, versioning hell, no built-in observability
❌ Message queue (RabbitMQ/Kafka): overkill, no durable state (just events)

REDIS = THE GOLDILOCKS CHOICE 🎯`}
        />
        <Callout type="tip">
          Interview gold: "SONiC chose Redis because it's in-memory (fast enough for network
          events), hash-native (network objects are key-value maps), has pub/sub (keyspace
          notifications wake up subscribers in real-time), and comes with built-in observability
          (redis-cli lets you inspect live state). It's the single source of truth for the entire
          switch." 🎯
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="db-map" number="02" title="The Database Number Map ⭐">
        <P>
          Redis supports multiple logical databases (0-15 by default). SONiC uses database
          <strong> numbers</strong> to separate concerns. Here&apos;s the map you MUST memorize:
        </P>
        <Table
          head={["DB#", "Name", "Purpose", "Producer", "Consumer", "Separator"]}
          rows={[
            ["0", <strong key="appl">APPL_DB</strong>, "Application state — processed config ready for hardware", "orchagent, portsyncd, intfmgrd", "orchagent (reads its own writes), teamd, lldp", ":"],
            ["1", <strong key="asic">ASIC_DB</strong>, "SAI object state — the hardware intent layer", "orchagent (writes SAI objects)", "syncd (reads, calls vendor SAI)", ":"],
            ["2", <strong key="cntr">COUNTERS_DB</strong>, "Telemetry counters — port/queue/buffer stats", "syncd (polls ASIC via SAI)", "gNMI telemetry, SNMP, show CLI", ":"],
            ["3", <strong key="log">LOGLEVEL_DB</strong>, "Dynamic log levels for daemons (debug/info/warn/error)", "Config or CLI sets levels", "All daemons read at startup/runtime", ":"],
            ["4", <strong key="cfg">CONFIG_DB</strong>, "Configuration intent — the source of truth for admin config", "CLI, REST, gNMI (mgmt-framework writes)", "orchagent, hostcfgd, all config consumers", "|"],
            ["5", <strong key="flex">FLEX_COUNTER_DB</strong>, "Flex counter config — tells syncd what counters to poll", "orchagent (based on CONFIG_DB)", "syncd (polls ASIC, writes COUNTERS_DB)", ":"],
            ["6", <strong key="state">STATE_DB</strong>, "Operational state — runtime/hardware feedback", "pmon (transceivers), portsyncd (kernel netdev), orch (errors)", "show commands, telemetry, monitoring", "|"],
          ]}
        />
        <P>
          <strong>Key separator</strong> is critical: CONFIG_DB uses <IC>|</IC> (pipe), others use{" "}
          <IC>:</IC> (colon). Example: <IC>PORT|Ethernet0</IC> in CONFIG_DB, but{" "}
          <IC>PORT_TABLE:Ethernet0</IC> in APPL_DB. This is schema convention, NOT a Redis
          requirement — SONiC chose it for visual distinction.
        </P>
        <Callout type="behind">
          Why different separators? Historical. CONFIG_DB was designed first, used <IC>|</IC> for
          tables. APPL_DB came later, used <IC>:</IC> to distinguish "this is processed state, not
          raw config." Now it&apos;s baked into parsers, so we&apos;re stuck with it. The lesson:
          schema decisions at scale are FOREVER. 🔒
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="config-db" number="03" title="CONFIG_DB (n=4) — The Source of Truth ⭐">
        <P>
          <strong>CONFIG_DB</strong> (redis database 4) holds <em>admin intent</em> — what the
          operator wants the switch to do. It&apos;s the source of truth. Everything starts here.
        </P>
        <CodeBlock
          title="redis-cli -n 4 (CONFIG_DB exploration)"
          code={`redis-cli -n 4 keys '*' | head -20`}
          output={`DEVICE_METADATA|localhost
PORT|Ethernet0
PORT|Ethernet4
PORT|Ethernet8
VLAN|Vlan100
VLAN_MEMBER|Vlan100|Ethernet0
INTERFACE|Ethernet0
INTERFACE|Ethernet0|10.0.0.1/31
LAG|PortChannel1
PORTCHANNEL_MEMBER|PortChannel1|Ethernet4
ACL_TABLE|DATAACL
ACL_RULE|DATAACL|RULE1
NTP_SERVER|10.10.10.1
SYSLOG_SERVER|192.168.1.10
TACPLUS_SERVER|172.16.0.5
LOOPBACK_INTERFACE|Loopback0|1.1.1.1/32
BGP_NEIGHBOR|10.0.0.0|remote_asn
DEVICE_NEIGHBOR|Ethernet0
CRM|Config
FLEX_COUNTER_TABLE|PORT`}
        />
        <P>Let&apos;s inspect a real <IC>PORT</IC> entry:</P>
        <CodeBlock
          title="redis-cli -n 4 hgetall 'PORT|Ethernet0'"
          code={`redis-cli -n 4 hgetall "PORT|Ethernet0"`}
          output={`1) "alias"
2) "Eth1/1"
3) "lanes"
4) "25,26,27,28"
5) "speed"
6) "100000"
7) "index"
8) "1"
9) "mtu"
10) "9100"
11) "admin_status"
12) "up"
13) "fec"
14) "rs"
15) "autoneg"
16) "off"
17) "adv_speeds"
18) "100000"
19) "adv_interface_types"
20) "CR4"`}
        />
        <P>Field breakdown:</P>
        <Table
          head={["Field", "What it means"]}
          rows={[
            [<IC key="alias">alias</IC>, "Human-readable name (Eth1/1 — front-panel label, not Linux ifname)"],
            [<IC key="lanes">lanes</IC>, "Serdes lanes on the ASIC (Tomahawk: 4 lanes per 100G port, lanes 25-28)"],
            [<IC key="speed">speed</IC>, "Port speed in Mbps (100000 = 100G)"],
            [<IC key="index">index</IC>, "Internal SONiC port index (used in SAI oid mapping)"],
            [<IC key="mtu">mtu</IC>, "Max transmission unit in bytes (9100 = jumbo frames)"],
            [<IC key="admin">admin_status</IC>, "Admin state: 'up' (enabled) or 'down' (shutdown)"],
            [<IC key="fec">fec</IC>, "Forward error correction: 'rs' (Reed-Solomon), 'fc' (Firecode), 'none'"],
            [<IC key="auto">autoneg</IC>, "Auto-negotiation: 'on' or 'off' (usually off for 100G DAC/optics)"],
            [<IC key="adv">adv_speeds</IC>, "Advertised speeds for autoneg (if enabled)"],
          ]}
        />
        <P>Now a <IC>VLAN</IC> entry:</P>
        <CodeBlock
          title="redis-cli -n 4 hgetall 'VLAN|Vlan100'"
          code={`redis-cli -n 4 hgetall "VLAN|Vlan100"`}
          output={`1) "vlanid"
2) "100"
3) "description"
4) "Data VLAN"
5) "dhcp_servers@"
6) "10.10.10.1,10.10.10.2"`}
        />
        <P>
          VLAN members are separate keys (many-to-many relationship, so SONiC splits them):
        </P>
        <CodeBlock
          title="redis-cli -n 4 hgetall 'VLAN_MEMBER|Vlan100|Ethernet0'"
          code={`redis-cli -n 4 hgetall "VLAN_MEMBER|Vlan100|Ethernet0"`}
          output={`1) "tagging_mode"
2) "untagged"`}
        />
        <Callout type="note">
          CONFIG_DB is <strong>declarative</strong>. You write WHAT you want, not HOW to achieve
          it. "I want Ethernet0 in VLAN 100 untagged." Orchagent figures out the SAI calls to make
          that happen. This is the same philosophy as Kubernetes manifests or Terraform configs —
          intent-driven infrastructure. 🎯
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="appl-db" number="04" title="APPL_DB (n=0) — Processed State">
        <P>
          <strong>APPL_DB</strong> (database 0) holds <em>processed application state</em>.
          Orchagent reads CONFIG_DB, validates/transforms it, writes to APPL_DB. Other daemons
          (teamd, lldp) read from APPL_DB, not CONFIG_DB.
        </P>
        <CodeBlock
          title="redis-cli -n 0 (APPL_DB exploration)"
          code={`redis-cli -n 0 keys '*' | head -15`}
          output={`PORT_TABLE:Ethernet0
PORT_TABLE:Ethernet4
VLAN_TABLE:Vlan100
VLAN_MEMBER_TABLE:Vlan100:Ethernet0
LAG_TABLE:PortChannel1
LAG_MEMBER_TABLE:PortChannel1:Ethernet4
INTF_TABLE:Ethernet0
INTF_TABLE:Ethernet0:10.0.0.1/31
ROUTE_TABLE:10.1.1.0/24
NEIGH_TABLE:Ethernet0:10.0.0.0
FDB_TABLE:Vlan100:00:11:22:33:44:55
MIRROR_SESSION_TABLE:mirror1
BUFFER_POOL_TABLE:ingress_lossless_pool
BUFFER_PROFILE_TABLE:pg_lossless_100000_5m_profile
QUEUE_TABLE:Ethernet0:3`}
        />
        <P>Compare <IC>PORT_TABLE:Ethernet0</IC> (APPL_DB) vs <IC>PORT|Ethernet0</IC> (CONFIG_DB):</P>
        <CodeBlock
          title="redis-cli -n 0 hgetall 'PORT_TABLE:Ethernet0'"
          code={`redis-cli -n 0 hgetall "PORT_TABLE:Ethernet0"`}
          output={`1) "alias"
2) "Eth1/1"
3) "speed"
4) "100000"
5) "lanes"
6) "25,26,27,28"
7) "mtu"
8) "9100"
9) "admin_status"
10) "up"
11) "oper_status"
12) "up"
13) "fec"
14) "rs"`}
        />
        <P>
          Notice: APPL_DB has <IC>oper_status</IC> (operational state from hardware), which
          CONFIG_DB lacks. CONFIG_DB is pure intent; APPL_DB is intent + runtime state.
        </P>
        <Callout type="behind">
          Why the separation? Decoupling. If orchagent is the only writer to APPL_DB, then
          orchagent owns the "contract" with consumers. If teamd needs a new field, orchagent adds
          it to APPL_DB without touching CONFIG_DB schema. This prevents schema sprawl in the
          config layer. Clean boundaries = maintainability. 🧩
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="asic-db" number="05" title="ASIC_DB (n=1) — SAI Objects ⭐">
        <P>
          <strong>ASIC_DB</strong> (database 1) is the hardware intent layer. Orchagent writes{" "}
          <strong>SAI objects</strong> here. syncd reads them and calls the vendor SAI library. Keys
          are SAI object IDs (oids).
        </P>
        <CodeBlock
          title="redis-cli -n 1 (ASIC_DB exploration)"
          code={`redis-cli -n 1 keys 'ASIC_STATE:SAI_OBJECT_TYPE_PORT:*' | head -5`}
          output={`ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002
ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000003
ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000004
ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000005
ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000006`}
        />
        <P>Inspect a port object:</P>
        <CodeBlock
          title="redis-cli -n 1 hgetall 'ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002'"
          code={`redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002"`}
          output={`1) "SAI_PORT_ATTR_ADMIN_STATE"
2) "true"
3) "SAI_PORT_ATTR_SPEED"
4) "100000"
5) "SAI_PORT_ATTR_MTU"
6) "9100"
7) "SAI_PORT_ATTR_FEC_MODE"
8) "SAI_PORT_FEC_MODE_RS"
9) "SAI_PORT_ATTR_HW_LANE_LIST"
10) "4:25,26,27,28"
11) "SAI_PORT_ATTR_INTERFACE_TYPE"
12) "SAI_PORT_INTERFACE_TYPE_CR4"
13) "NULL"
14) "NULL"`}
        />
        <P>
          These are <strong>SAI attribute names</strong> from the SAI spec (sai_port.h). syncd
          translates them to vendor SDK calls. For example:
        </P>
        <CodeBlock
          title="syncd_translates_to_vendor_sdk.c"
          runnable={false}
          code={`// syncd reads ASIC_DB entry for oid:0x1000000000002
// translates SAI_PORT_ATTR_ADMIN_STATE=true to:

sai_attribute_t attr;
attr.id = SAI_PORT_ATTR_ADMIN_STATE;
attr.value.booldata = true;

sai_status_t status = sai_port_api->set_port_attribute(
    0x1000000000002,  // oid from ASIC_DB
    &attr
);

// vendor libsai.so (Broadcom/Mellanox) implements this:
// Broadcom: calls bcm_port_enable_set(unit, port, 1);
// Mellanox: calls sx_api_port_state_set(SX_PORT_ADMIN_STATUS_UP);
// → ASIC registers updated → hardware responds ✅`}
        />
        <P>VLAN object in ASIC_DB:</P>
        <CodeBlock
          title="redis-cli -n 1 hgetall 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600000000001a'"
          code={`redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600000000001a"`}
          output={`1) "SAI_VLAN_ATTR_VLAN_ID"
2) "100"`}
        />
        <P>
          VLAN members are separate objects (SAI_OBJECT_TYPE_VLAN_MEMBER) that reference both the
          VLAN oid and the port oid:
        </P>
        <CodeBlock
          title="redis-cli -n 1 hgetall 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN_MEMBER:oid:0x2700000000abcd'"
          code={`redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_VLAN_MEMBER:oid:0x2700000000abcd"`}
          output={`1) "SAI_VLAN_MEMBER_ATTR_VLAN_ID"
2) "oid:0x2600000000001a"
3) "SAI_VLAN_MEMBER_ATTR_BRIDGE_PORT_ID"
4) "oid:0x3a00000000008f"
5) "SAI_VLAN_MEMBER_ATTR_VLAN_TAGGING_MODE"
6) "SAI_VLAN_TAGGING_MODE_UNTAGGED"`}
        />
        <Callout type="tip">
          Interview deep-dive: "ASIC_DB holds SAI objects identified by oids. When you create a
          VLAN, orchagent writes SAI_OBJECT_TYPE_VLAN with VLAN_ID attribute to ASIC_DB. syncd
          reads it, calls sai_vlan_api-&gt;create_vlan(), gets back an oid from the vendor SAI,
          stores that oid. All future references (like adding ports to the VLAN) use that oid.
          It&apos;s a hardware object database." 🎯
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="counters-db" number="06" title="COUNTERS_DB (n=2) — Telemetry Gold Mine">
        <P>
          <strong>COUNTERS_DB</strong> (database 2) holds statistics polled from the ASIC. syncd
          polls hardware counters via SAI every 1 second (configurable), writes them here. gNMI
          telemetry and SNMP read from here.
        </P>
        <P>First, the mapping from oids to port names:</P>
        <CodeBlock
          title="redis-cli -n 2 hgetall 'COUNTERS_PORT_NAME_MAP'"
          code={`redis-cli -n 2 hgetall "COUNTERS_PORT_NAME_MAP"`}
          output={`1) "Ethernet0"
2) "oid:0x1000000000002"
3) "Ethernet4"
4) "oid:0x1000000000003"
5) "Ethernet8"
6) "oid:0x1000000000004"
...`}
        />
        <P>Now get counters for a specific port:</P>
        <CodeBlock
          title="redis-cli -n 2 hgetall 'COUNTERS:oid:0x1000000000002'"
          code={`redis-cli -n 2 hgetall "COUNTERS:oid:0x1000000000002" | head -30`}
          output={`1) "SAI_PORT_STAT_IF_IN_OCTETS"
2) "482934823947"
3) "SAI_PORT_STAT_IF_IN_UCAST_PKTS"
4) "1293842342"
5) "SAI_PORT_STAT_IF_IN_NON_UCAST_PKTS"
6) "234234"
7) "SAI_PORT_STAT_IF_IN_DISCARDS"
8) "0"
9) "SAI_PORT_STAT_IF_IN_ERRORS"
10) "0"
11) "SAI_PORT_STAT_IF_OUT_OCTETS"
12) "129384234234"
13) "SAI_PORT_STAT_IF_OUT_UCAST_PKTS"
14) "892374234"
15) "SAI_PORT_STAT_IF_OUT_DISCARDS"
16) "0"
17) "SAI_PORT_STAT_IF_OUT_ERRORS"
18) "0"
19) "SAI_PORT_STAT_ETHER_STATS_DROP_EVENTS"
20) "0"
21) "SAI_PORT_STAT_ETHER_RX_OVERSIZE_PKTS"
22) "0"
23) "SAI_PORT_STAT_ETHER_TX_OVERSIZE_PKTS"
24) "0"
25) "SAI_PORT_STAT_PFC_0_RX_PKTS"
26) "12342"
27) "SAI_PORT_STAT_PFC_0_TX_PKTS"
28) "5678"
...`}
        />
        <P>
          Counter names are SAI enums (from sai_port.h). These map to standard MIBs for SNMP
          (ifInOctets, ifOutOctets, etc.) and YANG paths for gNMI telemetry.
        </P>
        <Callout type="behind">
          How polling works: FLEX_COUNTER_DB (n=5) holds polling config. Orchagent writes
          FLEX_COUNTER_TABLE entries like "poll PORT counters every 1000ms". syncd&apos;s flex counter
          thread wakes every interval, calls sai_port_api-&gt;get_port_stats() for all oids, writes
          COUNTERS_DB. This is <strong>pull-based telemetry</strong>. gNMI clients subscribe to
          COUNTERS_DB changes for <strong>streaming push telemetry</strong>. Best of both worlds.
          📊
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="state-db" number="07" title="STATE_DB (n=6) — The Feedback Loop ✅">
        <P>
          <strong>STATE_DB</strong> (database 6) holds <em>operational state</em> from hardware and
          runtime feedback. This is NOT config (that&apos;s CONFIG_DB), it&apos;s "what is actually
          happening right now."
        </P>
        <CodeBlock
          title="redis-cli -n 6 (STATE_DB exploration)"
          code={`redis-cli -n 6 keys '*' | head -15`}
          output={`PORT_TABLE|Ethernet0
PORT_TABLE|Ethernet4
TRANSCEIVER_INFO|Ethernet0
TRANSCEIVER_DOM_SENSOR|Ethernet0
INTERFACE_TABLE|Ethernet0|10.0.0.1/31
LAG_TABLE|PortChannel1
NEIGH_RESTORE_TABLE|Ethernet0:10.0.0.0
WARM_RESTART_TABLE|orchagent
BFD_SESSION_TABLE|default|10.0.0.2
VXLAN_TUNNEL_TABLE|vtep1
BUFFER_MAX_PARAM_TABLE|Ethernet0
PORT_QOS_MAP|Ethernet0
FEATURE|bgp`}
        />
        <P>Check operational status of a port:</P>
        <CodeBlock
          title="redis-cli -n 6 hgetall 'PORT_TABLE|Ethernet0'"
          code={`redis-cli -n 6 hgetall "PORT_TABLE|Ethernet0"`}
          output={`1) "state"
2) "ok"
3) "netdev_oper_status"
4) "up"
5) "admin_status"
6) "up"
7) "mtu"
8) "9100"
9) "speed"
10) "100000"`}
        />
        <P>
          <IC>netdev_oper_status</IC> is the kernel&apos;s view (from /sys/class/net/Ethernet0/operstate).
          This is the <strong>feedback loop</strong>: you configure admin_status=up in CONFIG_DB →
          orchagent programs ASIC → link comes up → kernel sees it → portsyncd writes STATE_DB →{" "}
          <IC>show interface status</IC> reads STATE_DB and displays "up". Circle closed. ✅
        </P>
        <P>Transceiver (SFP/QSFP) information from pmon:</P>
        <CodeBlock
          title="redis-cli -n 6 hgetall 'TRANSCEIVER_INFO|Ethernet0'"
          code={`redis-cli -n 6 hgetall "TRANSCEIVER_INFO|Ethernet0"`}
          output={`1) "type"
2) "QSFP28"
3) "vendor_name"
4) "Mellanox"
5) "vendor_pn"
6) "MCP1600-C003"
7) "vendor_sn"
8) "MT1234X56789"
9) "connector"
10) "LC"
11) "cable_length"
12) "3m"`}
        />
        <P>Transceiver DOM (Digital Optical Monitoring) sensors (temperature, voltage, TX/RX power):</P>
        <CodeBlock
          title="redis-cli -n 6 hgetall 'TRANSCEIVER_DOM_SENSOR|Ethernet0'"
          code={`redis-cli -n 6 hgetall "TRANSCEIVER_DOM_SENSOR|Ethernet0"`}
          output={`1) "temperature"
2) "45.2"
3) "voltage"
4) "3.29"
5) "rx1power"
6) "-2.14"
7) "rx2power"
8) "-2.08"
9) "rx3power"
10) "-2.21"
11) "rx4power"
12) "-2.19"
13) "tx1bias"
14) "7.23"
15) "tx2bias"
16) "7.19"
17) "tx1power"
18) "-1.87"
19) "tx2power"
20) "-1.92"`}
        />
        <Callout type="note">
          STATE_DB is <strong>read-mostly</strong>. Show commands read from here. Telemetry reads
          from here. Operators should NEVER write to STATE_DB manually — it&apos;s owned by the daemons
          that detect hardware state (pmon, portsyncd, orchagent error paths). Think of it as a
          "hardware event log" in database form. 🗂️
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="flex-counter-db" number="08" title="FLEX_COUNTER_DB (n=5)">
        <P>
          <strong>FLEX_COUNTER_DB</strong> (database 5) holds flex counter configuration. Orchagent
          writes here to tell syncd <em>what</em> to poll and <em>how often</em>.
        </P>
        <CodeBlock
          title="redis-cli -n 5 (FLEX_COUNTER_DB)"
          code={`redis-cli -n 5 keys '*'`}
          output={`FLEX_COUNTER_GROUP_TABLE:PORT
FLEX_COUNTER_GROUP_TABLE:QUEUE
FLEX_COUNTER_GROUP_TABLE:PG
FLEX_COUNTER_GROUP_TABLE:RIF
FLEX_COUNTER_TABLE:PORT:oid:0x1000000000002
FLEX_COUNTER_TABLE:QUEUE:oid:0x1500000000001a
...`}
        />
        <CodeBlock
          title="redis-cli -n 5 hgetall 'FLEX_COUNTER_GROUP_TABLE:PORT'"
          code={`redis-cli -n 5 hgetall "FLEX_COUNTER_GROUP_TABLE:PORT"`}
          output={`1) "POLL_INTERVAL"
2) "1000"
3) "FLEX_COUNTER_STATUS"
4) "enable"
5) "STATS_MODE"
6) "STATS_MODE_READ"`}
        />
        <P>
          This tells syncd: poll all PORT counters every 1000ms (1 second). syncd reads this,
          spawns a flex counter thread, polls sai_port_api-&gt;get_port_stats() for every oid listed in
          FLEX_COUNTER_TABLE:PORT:*, writes results to COUNTERS_DB. The feedback loop that powers
          telemetry. 📡
        </P>
      </Section>

      {/* 09 */}
      <Section id="cascade" number="09" title="The Cascade: CONFIG→APPL→ASIC ⭐">
        <P>
          The genius of SONiC: config changes <strong>cascade</strong> through databases. One write
          to CONFIG_DB triggers a chain reaction.
        </P>
        <CodeBlock
          title="the_cascade.txt"
          runnable={false}
          code={`USER COMMAND: config vlan add 100

┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ CLI writes CONFIG_DB (n=4)                               │
│    HSET "VLAN|Vlan100" "vlanid" "100"                       │
│    → keyspace notification: __keyspace@4__:VLAN|Vlan100     │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ Orchagent (VlanMgr) wakes up                             │
│    • Subscribed to CONFIG_DB VLAN table                     │
│    • Reads VLAN|Vlan100, sees vlanid=100                    │
│    • Validates (VLAN ID in range 1-4094? ✅)                │
│    • Writes APPL_DB (n=0):                                  │
│      HSET "VLAN_TABLE:Vlan100" "vlanid" "100"               │
│    • Prepares SAI call for ASIC_DB...                       │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ Orchagent writes ASIC_DB (n=1)                           │
│    sai_vlan_api->create_vlan() logic translated to:         │
│    HSET "ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600abcd"   │
│         "SAI_VLAN_ATTR_VLAN_ID" "100"                       │
│    → keyspace notification: __keyspace@1__:ASIC_STATE:*     │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣ syncd wakes up                                           │
│    • Subscribed to ASIC_DB via ConsumerStateTable           │
│    • Reads new SAI_OBJECT_TYPE_VLAN entry                   │
│    • Calls vendor SAI:                                      │
│      sai_status_t s = sai_vlan_api->create_vlan(            │
│          &vlan_oid,                                         │
│          switch_id,                                         │
│          1,                                                 │
│          &attr  /* SAI_VLAN_ATTR_VLAN_ID = 100 */          │
│      );                                                     │
│    • Vendor libsai.so programs ASIC VLAN table registers    │
│    • Returns SAI_STATUS_SUCCESS + oid:0x2600abcd            │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣ ASIC hardware                                            │
│    • VLAN 100 now exists in hardware VLAN table             │
│    • Packets with 802.1Q tag 100 will be switched           │
│    • show vlan brief reads CONFIG_DB + STATE_DB → displays  │
│      "Vlan100    100    active" ✅                           │
└─────────────────────────────────────────────────────────────┘

TOTAL TIME: ~50-150ms
CONFIG_DB → APPL_DB: ~10ms (orchagent processing)
APPL_DB → ASIC_DB: ~5ms (orchagent SAI prep)
ASIC_DB → syncd → SAI call: ~20-100ms (vendor SAI + ASIC write)

ROLLBACK ON FAILURE:
If SAI returns SAI_STATUS_TABLE_FULL (VLAN table exhausted):
  → syncd logs ERROR, sends failure to orchagent
  → orchagent removes ASIC_DB entry, logs error to syslog
  → APPL_DB entry remains (intent preserved for retry)
  → CONFIG_DB unchanged (operator can see the config, know it failed)
  → show vlan brief shows "Vlan100" but STATE_DB has error flag
  → Admin must intervene (delete VLAN 100, or delete another VLAN to free space)`}
        />
        <Callout type="tip">
          Interview scenario: "Explain the database cascade when you add a VLAN." Answer: "CLI
          writes CONFIG_DB with VLAN|Vlan100. Orchagent subscribes via keyspace notifications,
          wakes up, validates the VLAN ID, writes APPL_DB for other consumers, then writes ASIC_DB
          with a SAI_OBJECT_TYPE_VLAN entry. syncd subscribes to ASIC_DB, reads the entry, calls
          sai_vlan_api-&gt;create_vlan() from the vendor library, gets back an oid, and the ASIC
          hardware is programmed. If SAI fails, syncd reports the error back up the chain, and the
          config remains in CONFIG_DB but the VLAN won&apos;t exist in hardware." 🎯
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="pub-sub" number="10" title="Pub/Sub Keyspace Notifications">
        <P>
          How do daemons know when a database changes? <strong>Redis keyspace notifications</strong>.
          SONiC enables this feature in redis.conf:
        </P>
        <CodeBlock
          title="redis.conf (in database container)"
          runnable={false}
          code={`notify-keyspace-events AKE
# A = all events (set, del, expire, ...)
# K = keyspace events (__keyspace@4__:PORT|Ethernet0 → "set")
# E = keyevent events (__keyevent@4__:set → "PORT|Ethernet0")
# SONiC uses K (keyspace) mode`}
        />
        <P>Check current setting:</P>
        <CodeBlock
          title="redis-cli -n 4 config get notify-keyspace-events"
          code={`redis-cli -n 4 config get notify-keyspace-events`}
          output={`1) "notify-keyspace-events"
2) "AKE"`}
        />
        <P>Subscribe to CONFIG_DB PORT changes (demo):</P>
        <CodeBlock
          title="redis-cli -n 4 psubscribe '__keyspace@4__:PORT*'"
          code={`# In terminal 1:
redis-cli -n 4 psubscribe '__keyspace@4__:PORT*'

# In terminal 2:
redis-cli -n 4 hset "PORT|Ethernet0" "mtu" "9000"

# Terminal 1 output:
1) "pmessage"
2) "__keyspace@4__:PORT*"
3) "__keyspace@4__:PORT|Ethernet0"
4) "hset"`}
          output={`Reading messages... (press Ctrl-C to quit)
1) "psubscribe"
2) "__keyspace@4__:PORT*"
3) (integer) 1
1) "pmessage"
2) "__keyspace@4__:PORT*"
3) "__keyspace@4__:PORT|Ethernet0"
4) "hset"`}
        />
        <P>
          SONiC daemons use <strong>ProducerStateTable</strong> / <strong>ConsumerStateTable</strong>{" "}
          C++ classes (from swss-common library) that wrap redis pub/sub:
        </P>
        <CodeBlock
          title="orchagent_subscribes.cpp (simplified)"
          runnable={false}
          code={`#include "producerstatetable.h"
#include "consumerstatetable.h"

// Orchagent subscribes to CONFIG_DB PORT table:
DBConnector configDb(CONFIG_DB, DBConnector::DEFAULT_UNIXSOCKET, 0);
ConsumerStateTable portTable(&configDb, "PORT");

while (true) {
    std::deque<KeyOpFieldsValuesTuple> entries;
    portTable.pops(entries);  // blocks until keyspace notification arrives

    for (auto& entry : entries) {
        std::string key = kfvKey(entry);   // e.g. "Ethernet0"
        std::string op = kfvOp(entry);     // "SET" or "DEL"
        auto values = kfvFieldsValues(entry);  // {{"mtu", "9000"}, ...}

        if (op == "SET") {
            // Process the port config change
            doPortTask(key, values);
        } else if (op == "DEL") {
            // Remove port
            removePort(key);
        }
    }
}

// ConsumerStateTable internally does:
// PSUBSCRIBE __keyspace@4__:PORT*
// When notification arrives, reads the full hash with HGETALL
// Delivers the key, operation, and field-value pairs to the daemon`}
        />
        <Callout type="behind">
          Why this matters: The pub/sub model makes SONiC <strong>event-driven</strong> instead of
          polling. Orchagent doesn&apos;t wake up every 100ms to check "did CONFIG_DB change?" — it
          sleeps on pops(), wakes ONLY when a notification arrives, processes the change, goes back
          to sleep. This is fast (latency &lt;10ms), efficient (low CPU), and scalable (1000
          config changes/sec, no problem). The architectural advantage of Redis. ⚡
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="config-file" number="11" title="Config Files & Persistence">
        <P>
          Redis is in-memory — power off, state is gone. How does config survive reboots? The
          <IC>/etc/sonic/config_db.json</IC> file.
        </P>
        <CodeBlock
          title="config save / reload cycle"
          code={`# Save running config to disk
config save -y

# This writes /etc/sonic/config_db.json
cat /etc/sonic/config_db.json | jq . | head -40`}
          output={`{
  "DEVICE_METADATA": {
    "localhost": {
      "hwsku": "Accton-AS7326-56X",
      "hostname": "sonic",
      "platform": "x86_64-accton_as7326_56x-r0",
      "mac": "00:e0:ec:12:34:56",
      "type": "ToRRouter"
    }
  },
  "PORT": {
    "Ethernet0": {
      "alias": "Eth1/1",
      "lanes": "25,26,27,28",
      "speed": "100000",
      "mtu": "9100",
      "admin_status": "up",
      "fec": "rs"
    },
    "Ethernet4": {
      "alias": "Eth1/2",
      "lanes": "29,30,31,32",
      "speed": "100000",
      "admin_status": "down"
    }
  },
  "VLAN": {
    "Vlan100": {
      "vlanid": "100"
    }
  },
  "VLAN_MEMBER": {
    "Vlan100|Ethernet0": {
      "tagging_mode": "untagged"
    }
  }
}`}
        />
        <P>On boot, SONiC loads this file into CONFIG_DB:</P>
        <CodeBlock
          title="boot sequence (systemd)"
          runnable={false}
          code={`1. systemd starts database.service → redis-server runs
2. systemd starts sonic-config-engine.service
   → reads /etc/sonic/config_db.json
   → pushes every key into CONFIG_DB (redis n=4)
   → loads platform-specific defaults from /usr/share/sonic/hwsku/
3. systemd starts swss.service → orchagent starts, subscribes to CONFIG_DB
4. systemd starts syncd.service → syncd starts, subscribes to ASIC_DB
5. systemd starts bgp.service, lldp.service, etc.
6. Orchagent reads CONFIG_DB, cascades to APPL_DB → ASIC_DB
7. syncd programs ASIC via SAI
8. Switch is live ✅

IMPORTANT COMMANDS:
config save        — writes current CONFIG_DB → /etc/sonic/config_db.json
config reload      — loads /etc/sonic/config_db.json → CONFIG_DB (OVERWRITES running config!)
config load_minigraph — loads /etc/sonic/minigraph.xml (legacy Azure deployment format)
show runningconfiguration all — dumps CONFIG_DB as JSON to stdout`}
        />
        <Callout type="mistake">
          Common mistake: Making config changes, testing them, they work, then rebooting — and the
          config is gone. Why? You never ran <IC>config save</IC>. Running config is in redis RAM;
          startup config is in /etc/sonic/config_db.json. Always <IC>config save -y</IC> after
          changes you want to keep. This is the same trap as Cisco IOS <IC>write memory</IC>. 🚨
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="debugging" number="12" title="Debugging with Redis">
        <P>
          Redis is a built-in observability superpower. Here&apos;s how to debug live with redis-cli:
        </P>
        <CodeBlock
          title="debugging_with_redis.sh"
          code={`# 1. Monitor ALL writes to CONFIG_DB in real-time
redis-cli -n 4 monitor
# (in another terminal, run a config command, watch it appear)

# 2. See all keys in a database
redis-cli -n 4 keys '*'
redis-cli -n 0 keys '*' | grep PORT

# 3. Count keys (how much state?)
redis-cli -n 4 dbsize
redis-cli -n 1 dbsize   # how many SAI objects in ASIC_DB?

# 4. Inspect a specific config
redis-cli -n 4 hgetall "PORT|Ethernet0"
redis-cli -n 4 hgetall "VLAN|Vlan100"

# 5. Watch for changes to a specific key
redis-cli -n 4 psubscribe '__keyspace@4__:PORT|Ethernet0'
# (change Ethernet0 config, see notifications)

# 6. Dump entire CONFIG_DB to JSON
redis-dump -d 4 -o /tmp/config_db_dump.json

# 7. Compare CONFIG_DB vs STATE_DB for a port
diff <(redis-cli -n 4 hgetall "PORT|Ethernet0") \\
     <(redis-cli -n 6 hgetall "PORT_TABLE|Ethernet0")
# Look for mismatches (admin_status vs oper_status)

# 8. Check if orchagent processed a config yet
redis-cli -n 4 hgetall "VLAN|Vlan200"   # exists?
redis-cli -n 0 hgetall "VLAN_TABLE:Vlan200"  # orchagent wrote it?
redis-cli -n 1 keys 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN*' | grep -i vlan
# If in CONFIG_DB but not ASIC_DB → orchagent stuck or errored

# 9. Find the oid for a port
redis-cli -n 2 hget "COUNTERS_PORT_NAME_MAP" "Ethernet0"
# Returns oid:0x1000000000002
redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002"

# 10. Simulate a config write (advanced — testing only!)
redis-cli -n 4 hset "PORT|Ethernet0" "mtu" "1500"
# Orchagent will wake and process it as if CLI did it
# ⚠️ Dangerous: bypasses validation. Only for debugging/testing.`}
        />
      </Section>

      {/* 13 */}
      <Section id="lab" number="13" title="Lab Exercise — Trace One VLAN Through All Databases">
        <P>Hands-on: Add VLAN 200, trace it through CONFIG_DB → APPL_DB → ASIC_DB.</P>
        <CodeBlock
          title="lab_trace_vlan.sh"
          code={`# Step 1: Monitor CONFIG_DB (terminal 1)
redis-cli -n 4 monitor &

# Step 2: Check baseline — VLAN 200 should NOT exist
redis-cli -n 4 keys 'VLAN*' | grep 200
redis-cli -n 0 keys 'VLAN*' | grep 200
redis-cli -n 1 keys '*VLAN*' | grep -i vlan
# Expected: no results

# Step 3: Add VLAN 200
config vlan add 200
# Expected in monitor: HSET "VLAN|Vlan200" "vlanid" "200"

# Step 4: Verify in CONFIG_DB
redis-cli -n 4 hgetall "VLAN|Vlan200"
# Expected: vlanid = 200

# Step 5: Wait 100ms, check APPL_DB (orchagent processed it)
sleep 0.1
redis-cli -n 0 hgetall "VLAN_TABLE:Vlan200"
# Expected: vlanid = 200

# Step 6: Find the SAI oid in ASIC_DB
redis-cli -n 1 keys 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN*'
# Look for a new oid (e.g. oid:0x2600000000001d)
redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600000000001d"
# Expected: SAI_VLAN_ATTR_VLAN_ID = 200

# Step 7: Check swss logs for orchagent processing
docker logs swss --tail 20 | grep -i vlan
# Expected: "VlanMgr: Create VLAN Vlan200", "SAI_OBJECT_TYPE_VLAN oid:0x2600..."

# Step 8: Add a port to the VLAN
config vlan member add 200 Ethernet0 --untagged

# Step 9: Check VLAN_MEMBER in CONFIG_DB
redis-cli -n 4 hgetall "VLAN_MEMBER|Vlan200|Ethernet0"
# Expected: tagging_mode = untagged

# Step 10: Check ASIC_DB for VLAN_MEMBER object
redis-cli -n 1 keys 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN_MEMBER*'
# Find the oid, inspect:
redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_VLAN_MEMBER:oid:0x27000000000xyz"
# Expected: SAI_VLAN_MEMBER_ATTR_VLAN_ID = oid:0x2600000000001d (VLAN oid)
#           SAI_VLAN_MEMBER_ATTR_TAGGING_MODE = SAI_VLAN_TAGGING_MODE_UNTAGGED

# Step 11: Verify with show command
show vlan brief
# Expected: Vlan200 appears, Ethernet0 is a member

# Step 12: Delete VLAN, watch cascade
config vlan del 200
redis-cli -n 4 keys 'VLAN*' | grep 200
redis-cli -n 0 keys 'VLAN*' | grep 200
redis-cli -n 1 keys '*VLAN*' | grep 200
# Expected: all gone`}
          output={`# Sample outputs:

admin@sonic:~$ redis-cli -n 4 hgetall "VLAN|Vlan200"
1) "vlanid"
2) "200"

admin@sonic:~$ redis-cli -n 0 hgetall "VLAN_TABLE:Vlan200"
1) "vlanid"
2) "200"

admin@sonic:~$ redis-cli -n 1 keys 'ASIC_STATE:SAI_OBJECT_TYPE_VLAN*'
ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600000000001d

admin@sonic:~$ redis-cli -n 1 hgetall "ASIC_STATE:SAI_OBJECT_TYPE_VLAN:oid:0x2600000000001d"
1) "SAI_VLAN_ATTR_VLAN_ID"
2) "200"

admin@sonic:~$ docker logs swss --tail 5
:- VlanMgr: doVlanTask: op=SET key=Vlan200
:- VlanMgr: Create VLAN Vlan200 vid:200
:- VlanMgr: VLAN Vlan200 created with SAI oid:0x2600000000001d ✅`}
        />
      </Section>

      {/* 14 */}
      <Section id="interview" number="14" title="Interview Questions ⭐">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            ["Why does SONiC use Redis instead of a SQL database?", "Redis is in-memory (fast enough for sub-millisecond network events), hash-native (network objects are key-value maps like PORT has speed/mtu/lanes), has pub/sub via keyspace notifications (daemons wake on config changes instead of polling), and provides built-in observability via redis-cli. SQL would be too slow (disk I/O) and the wrong data model (tables vs hashes)."],
            ["What are the six main Redis databases in SONiC and their purposes?", "CONFIG_DB (n=4) holds admin intent, APPL_DB (n=0) holds processed state, ASIC_DB (n=1) holds SAI objects for hardware, COUNTERS_DB (n=2) holds telemetry stats, STATE_DB (n=6) holds operational feedback from hardware/kernel, FLEX_COUNTER_DB (n=5) configures what counters syncd polls. CONFIG→APPL→ASIC is the cascade."],
            ["Explain the database cascade when you add a VLAN.", "CLI writes CONFIG_DB VLAN|Vlan100. Orchagent subscribes via keyspace notifications, wakes up, validates, writes APPL_DB VLAN_TABLE:Vlan100 for consumers, then writes ASIC_DB SAI_OBJECT_TYPE_VLAN with SAI_VLAN_ATTR_VLAN_ID=100. syncd reads ASIC_DB, calls sai_vlan_api->create_vlan(), vendor SAI programs the ASIC. Total latency ~50-150ms."],
            ["What is the key separator difference between CONFIG_DB and APPL_DB?", "CONFIG_DB uses pipe | (e.g. PORT|Ethernet0), APPL_DB uses colon : (e.g. PORT_TABLE:Ethernet0). This is a schema convention to visually distinguish intent (CONFIG) from processed state (APPL). It's not a Redis requirement, just SONiC convention."],
            ["How do SONiC daemons know when a config changes?", "Redis keyspace notifications. SONiC enables notify-keyspace-events AKE. When CONFIG_DB changes, Redis publishes __keyspace@4__:PORT|Ethernet0. Orchagent subscribes via ConsumerStateTable (wraps PSUBSCRIBE), blocks on pops(), wakes when notification arrives, reads the key, processes the change. Event-driven, not polling."],
            ["What happens if a SAI call fails (e.g. SAI_STATUS_TABLE_FULL)?", "syncd logs ERROR to syslog, sends failure response back to orchagent via redis response queue. Orchagent removes the ASIC_DB entry, logs error. CONFIG_DB still has the intent (so operator can see the config), but ASIC does NOT have the object. State divergence. Admin must intervene — delete the config or free resources."],
            ["How does SONiC persist config across reboots?", "config save writes CONFIG_DB to /etc/sonic/config_db.json (JSON file on disk). On boot, sonic-config-engine.service reads that file, loads every key into CONFIG_DB (redis n=4). Redis is in-memory, so without config save, changes are lost on reboot. Like Cisco IOS write memory."],
            ["What is COUNTERS_DB and how is it populated?", "COUNTERS_DB (n=2) holds port/queue/buffer stats. FLEX_COUNTER_DB configures polling (e.g. poll PORT counters every 1s). syncd's flex counter thread calls sai_port_api->get_port_stats() for all oids, writes COUNTERS:oid:0x1000000000002 with SAI_PORT_STAT_IF_IN_OCTETS, etc. gNMI telemetry and SNMP read from here. Streaming telemetry subscribes to COUNTERS_DB changes."],
            ["How would you debug: config vlan add 300 succeeded but 'show vlan brief' doesn't show it?", "Step 1: redis-cli -n 4 hgetall VLAN|Vlan300 — does CONFIG_DB have it? If yes, proceed. Step 2: redis-cli -n 0 hgetall VLAN_TABLE:Vlan300 — did orchagent write APPL_DB? If no, orchagent is stuck or errored — check docker logs swss. Step 3: redis-cli -n 1 keys *VLAN* — is there a SAI oid? If no, check docker logs syncd for SAI failures. Step 4: show command might be reading STATE_DB — check redis-cli -n 6."],
            ["What is ProducerStateTable / ConsumerStateTable?", "C++ classes from swss-common library that wrap Redis pub/sub. ProducerStateTable writes to a table (e.g. orchagent writes APPL_DB PORT_TABLE), ConsumerStateTable subscribes to keyspace notifications, blocks on pops() until changes arrive. This is the plumbing that makes SONiC event-driven. Daemons use these instead of raw redis-cli."],
          ]}
        />
      </Section>

      {/* 15 */}
      <Section id="memorize" number="15" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Why Redis?", "In-memory, hash-native, pub/sub keyspace notifications, built-in observability"],
            ["CONFIG_DB", "n=4, intent, separator |, written by CLI/REST, read by orchagent"],
            ["APPL_DB", "n=0, processed state, separator :, written by orchagent, read by teamd/lldp"],
            ["ASIC_DB", "n=1, SAI objects, separator :, written by orchagent, read by syncd"],
            ["COUNTERS_DB", "n=2, telemetry stats, written by syncd (polls SAI), read by gNMI/SNMP"],
            ["STATE_DB", "n=6, operational feedback, separator |, written by pmon/portsyncd, read by show"],
            ["FLEX_COUNTER_DB", "n=5, counter poll config, tells syncd what to poll and how often"],
            ["Cascade", "CONFIG_DB → orchagent → APPL_DB + ASIC_DB → syncd → SAI → ASIC"],
            ["Keyspace notify", "redis notify-keyspace-events AKE, __keyspace@4__:PORT|Ethernet0"],
            ["Persistence", "config save → /etc/sonic/config_db.json, loaded on boot by sonic-config-engine"],
            ["Debug live", "redis-cli -n 4 monitor (watch all writes in real-time)"],
            ["Key separator", "CONFIG_DB/STATE_DB use |, APPL_DB/ASIC_DB/COUNTERS use :"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
