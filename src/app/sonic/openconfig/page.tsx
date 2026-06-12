"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Same OpenConfig path, any switch",
  nodes: [
    { id: "ctrl", icon: "🤖", label: "Controller", sub: "vendor-neutral", x: 8, y: 50, color: "#22d3ee" },
    { id: "ocpath", icon: "🧭", label: "OC path", sub: "/interfaces/.../mtu", x: 26, y: 50, color: "#a78bfa" },
    { id: "sonic", icon: "🦔", label: "SONiC switch", sub: "translib maps", x: 50, y: 20, color: "#34d399" },
    { id: "vendorA", icon: "🅰️", label: "Vendor A NOS", sub: "native driver", x: 50, y: 50, color: "#fbbf24" },
    { id: "vendorB", icon: "🅱️", label: "Vendor B NOS", sub: "native driver", x: 50, y: 80, color: "#fb923c" },
    { id: "mapped", icon: "🔁", label: "Native mapping", sub: "PORT|Ethernet0", x: 72, y: 50, color: "#60a5fa" },
    { id: "db", icon: "🗄️", label: "CONFIG_DB", sub: "Redis / internal", x: 90, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "ctrl-ocpath", from: "ctrl", to: "ocpath", color: "#a78bfa" },
    { id: "ocpath-sonic", from: "ocpath", to: "sonic", color: "#34d399" },
    { id: "ocpath-vendorA", from: "ocpath", to: "vendorA", color: "#fbbf24" },
    { id: "ocpath-vendorB", from: "ocpath", to: "vendorB", color: "#fb923c" },
    { id: "sonic-mapped", from: "sonic", to: "mapped", color: "#60a5fa" },
    { id: "vendorA-mapped", from: "vendorA", to: "mapped", color: "#60a5fa" },
    { id: "vendorB-mapped", from: "vendorB", to: "mapped", color: "#60a5fa" },
    { id: "mapped-db", from: "mapped", to: "db", color: "#f472b6" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Set MTU on 3 vendors",
      command: "PATCH /interfaces/interface[name=Ethernet0]/config/mtu → 9100",
      steps: [
        { node: "ctrl", paths: ["ctrl-ocpath"], text: "Controller (Ansible/Terraform/custom orchestrator) sends one OpenConfig gNMI Set: path /interfaces/interface[name=Ethernet0]/config/mtu, value 9100. Same request for ALL vendors." },
        { node: "ocpath", paths: ["ocpath-sonic", "ocpath-vendorA", "ocpath-vendorB"], text: "The OpenConfig path is vendor-neutral. SONiC, Vendor A, and Vendor B all implement openconfig-interfaces.yang — they understand this path." },
        { node: "sonic", paths: ["sonic-mapped"], text: "SONiC translib: annotation maps /interfaces/interface/config/mtu → PORT table, mtu field. Transformer runs: value stays 9100 (no transform needed)." },
        { node: "vendorA", paths: ["vendorA-mapped"], text: "Vendor A native driver: OC mtu → internal CLI 'interface Ethernet0; mtu 9100' → proprietary config DB." },
        { node: "vendorB", paths: ["vendorB-mapped"], text: "Vendor B native driver: OC mtu → NETCONF RPC to internal daemon → vendor-specific table." },
        { node: "mapped", paths: ["mapped-db"], text: "All 3 vendors have MAPPED the same OC path to their native config. SONiC: PORT|Ethernet0 mtu=9100. Vendors: equivalent internal representation." },
        { node: "db", paths: [], text: "Config persisted. Orchagent/ASIC driver programs the MTU. Result: controller used ONE model, worked on THREE vendors. ✅ OpenConfig win." },
      ],
    },
    {
      id: "unsupported",
      name: "❌ Unsupported leaf",
      command: "Set hold-time (vendor A lacks this feature)",
      steps: [
        { node: "ctrl", paths: ["ctrl-ocpath"], text: "Controller tries to set /interfaces/interface/config/hold-time (a hypothetical OC leaf for link debounce timer)." },
        { node: "ocpath", paths: ["ocpath-sonic", "ocpath-vendorA", "ocpath-vendorB"], text: "OpenConfig spec defines hold-time. SONiC and Vendor B support it. Vendor A's hardware doesn't have this feature." },
        { node: "vendorA", paths: [], text: "Vendor A gNMI server returns gRPC error: code=UNIMPLEMENTED, message='Path /interfaces/interface/config/hold-time is not supported'. No config change." },
        { node: "sonic", paths: ["sonic-mapped"], text: "SONiC translib maps hold-time → PORT table hold_time field. CVL validates, writes to Redis. ✅ Works on SONiC." },
        { node: "vendorB", paths: ["mapped-db"], text: "Vendor B driver maps to native 'link-debounce' feature. ✅ Works. Controller now knows: Vendor A doesn't support this leaf (graceful degradation)." },
      ],
    },
    {
      id: "telemetry",
      name: "📡 Streaming telemetry",
      command: "gNMI Subscribe /interfaces/interface/state/counters",
      steps: [
        { node: "ctrl", paths: ["ctrl-ocpath"], text: "Controller subscribes to /interfaces/interface[name=*]/state/counters (oper-status, tx-packets, rx-packets, errors) using gNMI Subscribe STREAM mode." },
        { node: "ocpath", paths: ["ocpath-sonic", "ocpath-vendorA", "ocpath-vendorB"], text: "Same OC path, all 3 vendors. They map it to their internal telemetry sources: SONiC COUNTERS_DB, Vendor A stats daemon, Vendor B SNMP-over-internal-bus." },
        { node: "sonic", paths: ["sonic-mapped"], text: "SONiC sonic-gnmi server subscribes to Redis COUNTERS_DB keyspace notifications. Every 10s, orchagent updates COUNTERS:oid:0x1000000000001 (Ethernet0 SAI counter object)." },
        { node: "mapped", paths: ["mapped-db"], text: "SONiC transformer maps COUNTERS_DB fields (SAI_PORT_STAT_IF_IN_OCTETS) → OC /state/counters/in-octets. Streams delta as gNMI SubscribeResponse." },
        { node: "db", paths: [], text: "All 3 vendors stream SubscribeResponse messages with IDENTICAL schema: {timestamp, path, value}. Controller's telemetry collector ingests one format, works for all. 📡✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is", label: "What Is OpenConfig?" },
  { id: "the-problem", label: "The Problem OpenConfig Solves ⭐" },
  { id: "config-state", label: "config/state Pattern ⭐" },
  { id: "why-sonic", label: "Why SONiC Adopted OpenConfig" },
  { id: "mapping-interfaces", label: "Mapping: Interfaces ⭐" },
  { id: "mapping-vlan", label: "Mapping: VLANs" },
  { id: "mapping-ntp", label: "Mapping: NTP & DNS & AAA" },
  { id: "mapping-bgp", label: "Mapping: BGP (brief)" },
  { id: "transforms", label: "Value Transforms ⭐" },
  { id: "debugging", label: "Debugging OC Mappings" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function OpenConfigPage() {
  return (
    <TopicShell
      icon="🌐"
      title="OpenConfig — One Model for Every Vendor"
      gradientWord="OpenConfig"
      subtitle="OpenConfig is a vendor-neutral YANG schema for network devices, backed by Google, Microsoft, and major operators. Controllers speak OpenConfig; SONiC translates it to native CONFIG_DB tables via annotations and transformers. Same API for Arista, Cisco, SONiC — write once, run everywhere."
      nav={NAV}
      badges={["🌍 Vendor-neutral YANG", "🗺️ OC→SONiC maps", "🔁 Value transforms", "📡 Telemetry standard", "🧪 Lab roundtrip"]}
      next={{ icon: "🟦", label: "SONiC YANG", href: "/sonic/sonic-yang" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is" number="01" title="What Is OpenConfig?">
        <P>
          <strong>OpenConfig</strong> is a <strong>consortium-driven project</strong> (github.com/openconfig/public) that publishes <strong>vendor-neutral YANG models</strong> for network devices. Founded by Google, now backed by Microsoft, Facebook, AT&amp;T, and most major NOS vendors.
        </P>
        <CodeBlock
          title="openconfig_in_one_breath.txt"
          runnable={false}
          code={`WHAT IT IS
  A collection of ~50 YANG modules covering:
    • Interfaces, VLANs, LAG (openconfig-interfaces, openconfig-vlan)
    • Routing: BGP, OSPF, IS-IS (openconfig-bgp, openconfig-ospf)
    • System: NTP, DNS, AAA, logging (openconfig-system)
    • Network instances (VRFs), ACLs, QoS
    • Platform: components, fans, PSUs (openconfig-platform)

WHY IT EXISTS
  Operators (Google, Microsoft) run 10,000+ switches from 5+ vendors.
  Before OC: 5 different CLIs/APIs → 5 automation codebases.
  With OC: vendors implement the SAME YANG → ONE controller works for all.

THE CONTRACT
  Vendor MUST implement the OC YANG schema (paths, types, semantics).
  Vendor MAY deviate (mark unsupported features), but can't change semantics.
  Client (controller) sends gNMI/RESTCONF to /openconfig-interfaces:interfaces/...
  Switch translates OC → native config (SONiC: OC → CONFIG_DB via translib).

PROTOCOLS THAT USE IT
  ✅ gNMI (gRPC Network Management Interface) — Google's streaming telemetry
  ✅ RESTCONF (HTTP REST + YANG) — IETF standard
  ✅ NETCONF (XML RPC + YANG) — older, XML-based

SONiC position: northbound = OpenConfig (vendor-neutral API),
                southbound = SONiC YANG (CONFIG_DB native schema).
                translib bridges the two.`}
        />
        <Callout type="analogy">
          🌍 <strong>Analogy:</strong> OpenConfig is like USB-C. Before USB-C, every phone had a different charger (vendor-specific APIs). Now manufacturers agree on one standard (OpenConfig YANG), so one charger (controller) works for all devices. Internally, phones still use different voltages (SONiC vs vendor-native schemas), but the port adapter (translib transformer) handles the conversion.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="the-problem" number="02" title="The Problem OpenConfig Solves ⭐">
        <P>Imagine you manage a datacenter with 3 switch vendors. Pre-OpenConfig:</P>
        <CodeBlock
          title="automation_hell.txt"
          runnable={false}
          code={`TASK: Set MTU to 9100 on all edge switches

VENDOR A (CLI-based)
  ssh switch-a
  > configure terminal
  > interface Ethernet1/1
  > mtu 9100
  > exit
  > write memory

VENDOR B (NETCONF XML)
  <rpc>
    <edit-config>
      <target><candidate/></target>
      <config>
        <interfaces xmlns="http://vendor-b.com/ns">
          <interface>
            <name>Eth0</name>
            <mtu>9100</mtu>
          </interface>
        </interfaces>
      </config>
    </edit-config>
  </rpc>

VENDOR C (SONiC, pre-OC adoption)
  redis-cli -n 4 HSET "PORT|Ethernet0" mtu 9100

AUTOMATION NIGHTMARE
  • 3 different syntax styles
  • 3 different error formats
  • No semantic guarantee (Vendor A's "mtu" might mean L2 MTU,
    Vendor B's might be IP MTU + L2 overhead — undefined!)
  • Field renames between firmware versions break scripts

OPERATORS WANTED: one API to rule them all`}
        />
        <P>OpenConfig solution:</P>
        <CodeBlock
          title="openconfig_unifies.txt"
          runnable={false}
          code={`ONE gNMI Set request works on all 3 vendors:

gnmi_set \\
  --target switch-a:9339,switch-b:9339,sonic-switch:9339 \\
  --update /interfaces/interface[name=Ethernet0]/config/mtu:9100

ALL THREE SWITCHES:
  ✅ parse the SAME path: /openconfig-interfaces:interfaces/interface[name=...]/config/mtu
  ✅ validate against the SAME YANG schema (openconfig-interfaces.yang)
  ✅ translate to their native config:
     • SONiC: PORT|Ethernet0 mtu 9100 (via translib)
     • Vendor A: internal CLI command
     • Vendor B: proprietary table write

BENEFITS
  • Controller codebase shrinks 5x (one model, not N CLIs)
  • Semantic clarity: OC defines "mtu" = L2 MTU in bytes, 68-65535 range
  • Versioning: OC YANG has revisions; clients check compatibility
  • Telemetry: SAME paths for reads → unified monitoring dashboards`}
        />
        <Callout type="tip">
          💡 <strong>Interview gold:</strong> &quot;What problem does OpenConfig solve?&quot; → &quot;Multi-vendor automation. Before OC, operators needed N different automation stacks for N vendors. OpenConfig defines a vendor-neutral YANG schema; vendors implement it, controllers consume one API. SONiC adopted OC as the northbound standard while keeping SONiC YANG as the native DB schema — translib translates between them.&quot;
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="config-state" number="03" title="The config/state Pattern ⭐">
        <P>
          OpenConfig mandates a <strong>strict config/state split</strong>. Every OC module has this structure:
        </P>
        <CodeBlock
          title="openconfig-interfaces.yang (simplified)"
          runnable={false}
          code={`container interfaces {
  list interface {
    key "name";

    leaf name {
      type leafref { path "../config/name"; }
    }

    container config {              // INTENDED config (read-write)
      leaf name { type string; }
      leaf mtu { type uint16; }
      leaf enabled { type boolean; }
      leaf description { type string; }
    }

    container state {               // APPLIED state (read-only)
      config false;                 // marks this as read-only

      // MIRROR of config (what system applied)
      leaf name { type string; }
      leaf mtu { type uint16; }
      leaf enabled { type boolean; }
      leaf description { type string; }

      // DERIVED state (not in config — operational data)
      leaf oper-status {
        type enumeration { enum UP; enum DOWN; }
        description "Actual link status from hardware";
      }

      container counters {
        leaf in-octets { type yang:counter64; }
        leaf out-octets { type yang:counter64; }
        leaf in-errors { type yang:counter64; }
        // ... 20+ counter fields
      }
    }
  }
}`}
        />
        <P>How SONiC implements this split:</P>
        <Table
          head={["OpenConfig container", "SONiC data source", "Purpose"]}
          rows={[
            [<IC key="1">/interfaces/interface/config/*</IC>, "CONFIG_DB (PORT table)", "Writable: what the operator configured (mtu, admin_status, speed, ...)"],
            [<IC key="2">/interfaces/interface/state/name, mtu, enabled</IC>, "CONFIG_DB (PORT table) — mirrored", "Read-only: confirms what was applied (usually matches config unless orchagent rejected it)"],
            [<IC key="3">/interfaces/interface/state/oper-status</IC>, "APPL_DB (PORT_TABLE) — syncd writes this", "Read-only derived: actual link state from ASIC (cable plugged in? up/down)"],
            [<IC key="4">/interfaces/interface/state/counters/*</IC>, "COUNTERS_DB (COUNTERS:oid:0x...) — syncd writes", "Read-only telemetry: packet/byte/error counters from SAI stats poll"],
          ]}
        />
        <P>Example: setting MTU and reading it back:</P>
        <CodeBlock
          title="oc_config_state_roundtrip.sh"
          code={`# WRITE to config (intent)
curl -X PATCH https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -d '{
    "openconfig-interfaces:config": {
      "mtu": 9100,
      "enabled": true
    }
  }'

# SONiC translib writes to Redis:
redis-cli -n 4 HGETALL "PORT|Ethernet0"`}
          output={`1) "mtu"
2) "9100"
3) "admin_status"
4) "up"

✅ Config applied to CONFIG_DB`}
        />
        <CodeBlock
          title="read_state.sh"
          code={`# READ state (applied + derived)
curl https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/state`}
          output={`{
  "openconfig-interfaces:state": {
    "name": "Ethernet0",
    "mtu": 9100,
    "enabled": true,
    "oper-status": "UP",
    "counters": {
      "in-octets": "123456789",
      "out-octets": "987654321",
      "in-errors": "0"
    }
  }
}

✅ state/mtu mirrors config/mtu (9100 was applied)
✅ state/oper-status=UP is DERIVED (from APPL_DB, which syncd wrote after querying SAI)
✅ counters are DERIVED (from COUNTERS_DB, polled every 10s by syncd)`}
        />
        <Callout type="behind">
          ⚙️ <strong>Why the duplication?</strong> The config/state mirror lets you detect <em>drift</em>: if <IC>config/mtu=9100</IC> but <IC>state/mtu=1500</IC>, something prevented the change (orchagent rejected it, or ASIC doesn&apos;t support it). Controllers poll state to verify intent was applied. In SONiC, translib&apos;s DbToYang transformer reads CONFIG_DB for config fields and APPL_DB+COUNTERS_DB for state-only fields.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="why-sonic" number="04" title="Why SONiC Adopted OpenConfig">
        <P>
          SONiC could have exposed SONiC YANG directly as the northbound API (some early versions did). Why add OpenConfig on top?
        </P>
        <CodeBlock
          title="why_oc_northbound.txt"
          runnable={false}
          code={`OPTION 1: Expose SONiC YANG directly
  Pro: no translation layer, simpler
  Con: SONiC YANG is SONiC-specific → controllers need SONiC-aware code
  Con: SONiC YANG schema tied to CONFIG_DB layout (implementation detail)
       → can't refactor DB without breaking API

OPTION 2: Expose OpenConfig (SONiC's choice ✅)
  Pro: controllers written for Arista/Cisco OC also work on SONiC
  Pro: SONiC DB schema can evolve independently of the API
       (change CONFIG_DB table names, translib absorbs the mapping)
  Pro: OpenConfig is battle-tested by hyperscalers (Google/Meta)
  Pro: gNMI ecosystem (Prometheus exporters, Grafana dashboards) expects OC paths
  Con: translation layer adds complexity (translib + transformer)

THE TRADE-OFF
  SONiC chose: northbound API stability + vendor neutrality > simplicity.
  Result: SONiC speaks 2 languages:
    • NORTH (to controllers): OpenConfig YANG via gNMI/RESTCONF
    • SOUTH (to Redis/orchagent): SONiC YANG (CONFIG_DB native schema)
  Translib is the interpreter.`}
        />
        <Callout type="note">
          📌 <strong>Real example:</strong> Early SONiC had a table called <IC>INTERFACE</IC> for L3 configs. Later, it was split into <IC>INTERFACE</IC> (IP addresses) and <IC>PORT</IC> (L2 settings). If OC weren&apos;t the API, every controller would break. With OC: translib updated the annotation mappings, controllers saw zero change. API stability preserved.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="mapping-interfaces" number="05" title="Mapping: Interfaces ⭐">
        <P>
          The most common operation: configuring interfaces. Let&apos;s map every OC leaf to its SONiC CONFIG_DB destination.
        </P>
        <Table
          head={["OpenConfig path", "CONFIG_DB destination", "Notes"]}
          rows={[
            [
              <IC key="1">/interfaces/interface[name=Ethernet0]/config/mtu</IC>,
              <IC key="11">PORT|Ethernet0 → mtu: &quot;9100&quot;</IC>,
              "Direct mapping, no transform. MTU is uint16 in both schemas."
            ],
            [
              <IC key="2">/interfaces/interface[name=Ethernet0]/config/enabled</IC>,
              <IC key="12">PORT|Ethernet0 → admin_status: &quot;up&quot; or &quot;down&quot;</IC>,
              "VALUE TRANSFORM! OC enabled:true → SONiC admin_status:\"up\", false → \"down\""
            ],
            [
              <IC key="3">/interfaces/interface[name=Ethernet0]/config/description</IC>,
              <IC key="13">PORT|Ethernet0 → description: &quot;uplink to spine&quot;</IC>,
              "Direct mapping. Free-form string."
            ],
            [
              <IC key="4">/interfaces/interface[name=Ethernet0]/ethernet/config/port-speed</IC>,
              <IC key="14">PORT|Ethernet0 → speed: &quot;100000&quot;</IC>,
              "OC uses identityref (SPEED_100GB), SONiC uses integer Mbps. Transformer maps: SPEED_100GB → 100000."
            ],
            [
              <IC key="5">/interfaces/interface[name=Ethernet0]/subinterfaces/subinterface[index=0]/ipv4/addresses/address[ip=10.0.0.1]/config/prefix-length</IC>,
              <IC key="15">INTERFACE|Ethernet0|10.0.0.1/24 → {} (key encodes prefix)</IC>,
              "OC splits IP+prefix into separate leafs. SONiC combines into key: INTERFACE|Ethernet0|10.0.0.1/24."
            ],
            [
              <IC key="6">/interfaces/interface[name=Ethernet0]/state/oper-status</IC>,
              <IC key="16">APPL_DB: PORT_TABLE:Ethernet0 → oper_status: &quot;up&quot;</IC>,
              "READ-ONLY. Sourced from APPL_DB (orchagent writes after SAI query). Not in CONFIG_DB."
            ],
            [
              <IC key="7">/interfaces/interface[name=Ethernet0]/state/counters/in-octets</IC>,
              <IC key="17">COUNTERS_DB: COUNTERS:oid:0x1000000000001 → SAI_PORT_STAT_IF_IN_OCTETS</IC>,
              "READ-ONLY. Syncd polls SAI every 10s, writes to COUNTERS_DB. Transformer maps SAI stat name → OC counter name."
            ],
          ]}
        />
        <P>Full example: PATCH an interface config, then GET state:</P>
        <CodeBlock
          title="interface_roundtrip.sh"
          code={`# Step 1: Set config via OpenConfig RESTCONF
curl -k -u admin:password -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H "Content-Type: application/yang-data+json" \\
  -d '{
    "openconfig-interfaces:config": {
      "mtu": 9100,
      "enabled": true,
      "description": "Uplink to Spine1"
    }
  }'

# Step 2: Verify in Redis CONFIG_DB
redis-cli -n 4 HGETALL "PORT|Ethernet0"

# Step 3: GET state (includes config mirror + derived state)
curl -k -u admin:password \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/state

# Step 4: Check COUNTERS_DB (state/counters source)
redis-cli -n 2 HGETALL "COUNTERS:oid:0x1000000000001"`}
          output={`✅ Step 2 output (CONFIG_DB):
1) "mtu"
2) "9100"
3) "admin_status"
4) "up"
5) "description"
6) "Uplink to Spine1"

✅ Step 3 output (state):
{
  "openconfig-interfaces:state": {
    "name": "Ethernet0",
    "mtu": 9100,
    "enabled": true,
    "description": "Uplink to Spine1",
    "oper-status": "UP",
    "counters": {
      "in-octets": "987654321",
      "out-octets": "123456789"
    }
  }
}

✅ Step 4 output (COUNTERS_DB):
1) "SAI_PORT_STAT_IF_IN_OCTETS"
2) "987654321"
3) "SAI_PORT_STAT_IF_OUT_OCTETS"
4) "123456789"

🔁 Full circle: OC config → CONFIG_DB, OC state ← CONFIG_DB + APPL_DB + COUNTERS_DB`}
        />
      </Section>

      {/* 06 */}
      <Section id="mapping-vlan" number="06" title="Mapping: VLANs">
        <P>
          OpenConfig has <strong>two VLAN models</strong>: legacy <IC>openconfig-vlan</IC> and newer <IC>network-instances</IC> (L2 domains). SONiC supports both via different transformers.
        </P>
        <Table
          head={["OpenConfig path", "CONFIG_DB", "Notes"]}
          rows={[
            [
              <IC key="1">/vlans/vlan[vlan-id=100]/config/vlan-id</IC>,
              <IC key="11">VLAN|Vlan100 → vlanid: &quot;100&quot;</IC>,
              "Legacy OC model. SONiC key is Vlan{id}, OC uses numeric vlan-id."
            ],
            [
              <IC key="2">/vlans/vlan[vlan-id=100]/config/name</IC>,
              <IC key="12">VLAN|Vlan100 → name: &quot;Vlan100&quot;</IC>,
              "SONiC name is auto-generated \"Vlan{id}\" to match interface naming."
            ],
            [
              <IC key="3">/interfaces/interface[name=Ethernet0]/ethernet/switched-vlan/config/access-vlan</IC>,
              <IC key="13">VLAN_MEMBER|Vlan100|Ethernet0 → tagging_mode: &quot;untagged&quot;</IC>,
              "OC access-vlan (untagged) → SONiC VLAN_MEMBER with tagging_mode=untagged."
            ],
            [
              <IC key="4">/interfaces/interface[name=Ethernet0]/ethernet/switched-vlan/config/trunk-vlans</IC>,
              <IC key="14">VLAN_MEMBER|Vlan100|Ethernet0 → tagging_mode: &quot;tagged&quot;</IC>,
              "OC trunk-vlans (list) → multiple VLAN_MEMBER entries, each with tagging_mode=tagged."
            ],
            [
              <IC key="5">/network-instances/network-instance[name=Vlan100]/vlans/vlan[vlan-id=100]</IC>,
              <IC key="15">VLAN|Vlan100 + VLAN_INTERFACE|Vlan100</IC>,
              "New OC model (network-instance for L2/L3 domains). Maps to VLAN + VLAN_INTERFACE (for SVI)."
            ],
          ]}
        />
        <P>Example: creating a VLAN with tagged members via OpenConfig:</P>
        <CodeBlock
          title="vlan_create_oc.sh"
          code={`# Create VLAN 100 via legacy openconfig-vlan model
curl -X POST https://localhost/restconf/data/openconfig-vlan:vlans \\
  -d '{
    "openconfig-vlan:vlan": [{
      "vlan-id": 100,
      "config": {
        "vlan-id": 100,
        "name": "production"
      }
    }]
  }'

# Add Ethernet0 as tagged member (trunk)
curl -X PATCH https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/ethernet/switched-vlan/config \\
  -d '{
    "openconfig-vlan:config": {
      "trunk-vlans": [100]
    }
  }'

# Verify in Redis
redis-cli -n 4 HGETALL "VLAN|Vlan100"
redis-cli -n 4 HGETALL "VLAN_MEMBER|Vlan100|Ethernet0"`}
          output={`VLAN|Vlan100:
1) "vlanid"
2) "100"
3) "name"
4) "production"

VLAN_MEMBER|Vlan100|Ethernet0:
1) "tagging_mode"
2) "tagged"

✅ OpenConfig trunk-vlans:[100] → SONiC VLAN_MEMBER with tagging_mode=tagged`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Gotcha:</strong> OpenConfig uses <IC>vlan-id</IC> (numeric 100), SONiC Redis key is <IC>Vlan100</IC> (string with &quot;Vlan&quot; prefix). Transformer does the <IC>sprintf(&quot;Vlan%d&quot;, vlan_id)</IC> conversion. If you hand-craft JSON with the wrong format, CVL will reject it as a non-existent VLAN.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="mapping-ntp" number="07" title="Mapping: NTP & DNS & AAA">
        <P>
          System-level services (NTP, DNS, AAA) live under <IC>/system</IC> in OpenConfig. These map to SONiC&apos;s dedicated tables:
        </P>
        <Table
          head={["OpenConfig path", "CONFIG_DB", "Value example"]}
          rows={[
            [
              <IC key="1">/system/ntp/servers/server[address=10.1.1.1]/config/address</IC>,
              <IC key="11">NTP_SERVER|10.1.1.1 → {}</IC>,
              "Key is the IP address. SONiC stores empty hash (just the key matters)."
            ],
            [
              <IC key="2">/system/dns/servers/server[address=8.8.8.8]/config/address</IC>,
              <IC key="12">DNS_NAMESERVER|8.8.8.8 → {}</IC>,
              "Similar: key-only table. List of DNS servers."
            ],
            [
              <IC key="3">/system/dns/config/search</IC>,
              <IC key="13">DNS_SERVER| → search: &quot;example.com,corp.local&quot;</IC>,
              "OC search is leaf-list (array). SONiC stores comma-separated string in DNS_SERVER table."
            ],
            [
              <IC key="4">/system/aaa/authentication/config/authentication-method</IC>,
              <IC key="14">AAA|authentication → login: &quot;tacacs+,local&quot;</IC>,
              "OC method is ordered list: try TACACS+ first, fall back to local. SONiC: comma string."
            ],
            [
              <IC key="5">/system/aaa/server-groups/server-group[name=TACACS]/servers/server[address=10.2.2.2]/tacacs/config/secret-key</IC>,
              <IC key="15">TACPLUS_SERVER|10.2.2.2 → passkey: &quot;secret123&quot;</IC>,
              "OC nests deep. SONiC flattens to TACPLUS_SERVER table with passkey field."
            ],
          ]}
        />
        <P>Example: configuring NTP servers via OpenConfig:</P>
        <CodeBlock
          title="ntp_oc.sh"
          code={`# Add two NTP servers
curl -X POST https://localhost/restconf/data/openconfig-system:system/ntp/servers \\
  -d '{
    "openconfig-system:server": [
      { "address": "10.1.1.1", "config": {"address": "10.1.1.1"} },
      { "address": "10.1.1.2", "config": {"address": "10.1.1.2"} }
    ]
  }'

# Verify in Redis
redis-cli -n 4 KEYS "NTP_SERVER|*"
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"`}
          output={`1) "NTP_SERVER|10.1.1.1"
2) "NTP_SERVER|10.1.1.2"

NTP_SERVER|10.1.1.1:
(empty array — SONiC just stores the key)

✅ OpenConfig /system/ntp/servers → SONiC NTP_SERVER|{ip}`}
        />
      </Section>

      {/* 08 */}
      <Section id="mapping-bgp" number="08" title="Mapping: BGP (Brief)">
        <P>
          BGP in OpenConfig is <strong>deeply nested</strong>: <IC>/network-instances/network-instance/protocols/protocol[BGP]/bgp/neighbors/neighbor/...</IC>. SONiC flattens this to simpler tables.
        </P>
        <CodeBlock
          title="bgp_mapping_overview.txt"
          runnable={false}
          code={`OC PATH EXAMPLE (simplified)
/network-instances/network-instance[name=default]/
  protocols/protocol[identifier=BGP][name=bgp]/bgp/
    global/config/as → 65001
    neighbors/neighbor[neighbor-address=10.0.0.2]/config/
      peer-as → 65002
      description → "peer to spine"

SONIC CONFIG_DB
BGP_NEIGHBOR|10.0.0.2
  asn: "65002"
  name: "peer to spine"
  local_addr: "10.0.0.1"

DEVICE_METADATA|localhost
  bgp_asn: "65001"

WHY IT'S COMPLEX
  • OC models BGP as a protocol within a network-instance (VRF-aware)
  • SONiC (currently) has flat BGP tables (single global VRF in many deployments)
  • Transformer does heavy lifting: multi-level OC nesting → 2-level Redis keys

REAL-WORLD NOTE
  Many SONiC deployments use FRR CLI directly for BGP (not OC API yet).
  OC BGP support in SONiC is improving but not feature-complete for all
  advanced BGP knobs (route-maps, communities, etc.). Check release notes.`}
        />
        <Callout type="note">
          📌 For production BGP config, check if your SONiC version supports the OC BGP features you need. If not, fall back to SONiC CLI (<IC>config bgp</IC>) or FRR vtysh. The OC API is the future direction, but BGP&apos;s complexity means it&apos;s still catching up.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="transforms" number="09" title="Value Transforms ⭐">
        <P>
          Not all mappings are 1:1. Some require <strong>value transformations</strong> — OC and SONiC use different representations for the same concept.
        </P>
        <Table
          head={["OpenConfig value", "SONiC CONFIG_DB value", "Transformation logic"]}
          rows={[
            [
              <IC key="1">enabled: true / false</IC>,
              <IC key="11">admin_status: &quot;up&quot; / &quot;down&quot;</IC>,
              "Boolean → enum string. Transformer callback: if enabled { return \"up\" } else { return \"down\" }"
            ],
            [
              <IC key="2">port-speed: SPEED_100GB (identityref)</IC>,
              <IC key="12">speed: &quot;100000&quot; (Mbps integer string)</IC>,
              "OC uses YANG identity (symbolic name). SONiC uses numeric Mbps. Map: SPEED_100GB → \"100000\", SPEED_40GB → \"40000\"."
            ],
            [
              <IC key="3">ipv4 address: 10.0.0.1, prefix-length: 24</IC>,
              <IC key="13">INTERFACE|Ethernet0|10.0.0.1/24 (CIDR in key)</IC>,
              "OC splits IP and prefix into 2 leafs. SONiC combines: sprintf(\"%s/%d\", ip, prefix). Reverse: split on '/'."
            ],
            [
              <IC key="4">vlan-id: 100 (uint16)</IC>,
              <IC key="14">VLAN|Vlan100 (key string with prefix)</IC>,
              "OC: numeric. SONiC: string \"Vlan\" + number. Transformer: sprintf(\"Vlan%d\", vlan_id)."
            ],
            [
              <IC key="5">trunk-vlans: [100, 200, 300] (leaf-list)</IC>,
              <IC key="15">3 Redis keys: VLAN_MEMBER|Vlan100|Eth0, Vlan200|Eth0, Vlan300|Eth0</IC>,
              "1 OC leaf-list → N Redis entries. Transformer loops: for each vlan_id, create VLAN_MEMBER entry."
            ],
          ]}
        />
        <P>
          Where these transforms live: <IC>transformer/xfmr_interface.go</IC>, <IC>xfmr_vlan.go</IC>, etc. Example code (simplified):
        </P>
        <CodeBlock
          title="transformer/xfmr_interface.go (excerpt)"
          code={`// YangToDb_intf_enabled_xfmr: OpenConfig enabled → SONiC admin_status
func YangToDb_intf_enabled_xfmr(inParams XfmrParams) (map[string]string, error) {
    ocEnabled := inParams.value.(bool)   // OC enabled leaf (boolean)

    var sonicValue string
    if ocEnabled {
        sonicValue = "up"
    } else {
        sonicValue = "down"
    }

    return map[string]string{"admin_status": sonicValue}, nil
}

// DbToYang_intf_enabled_xfmr: reverse (SONiC admin_status → OC enabled)
func DbToYang_intf_enabled_xfmr(inParams XfmrParams) (interface{}, error) {
    sonicStatus := inParams.dbEntry["admin_status"]   // "up" or "down"

    ocEnabled := (sonicStatus == "up")   // true if "up", false if "down"

    return ocEnabled, nil
}`}
        />
        <Callout type="behind">
          ⚙️ <strong>Performance note:</strong> Transformers run on EVERY config read/write. Inefficient transforms (e.g., querying Redis in a loop for each list element) cause slowdowns. SONiC developers optimize hot paths: batch Redis reads, cache lookups. When writing custom transforms, profile with GLOG_v=4 to see per-operation latency.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="debugging" number="10" title="Debugging OC Mappings">
        <P>
          When an OpenConfig request fails or returns unexpected data, trace the mapping:
        </P>
        <CodeBlock
          title="debug_oc_mapping.sh"
          code={`# Step 1: Enable translib debug logging
export GLOG_v=3
systemctl restart mgmt-framework

# Step 2: Find the annotation for the failing OC path
# Example: /interfaces/interface/config/mtu
grep -r "openconfig-interfaces.*mtu" \\
  /usr/models/yang/annotations/

# Output: sonic-interface-annot.yang:
#   deviation /oc-if:interfaces/oc-if:interface/oc-if:config/oc-if:mtu {
#     sonic-ext:table-name "PORT";
#     sonic-ext:field-name "mtu";
#   }
# ✅ Now you know: OC mtu → PORT table mtu field

# Step 3: Check if a custom transformer is involved
grep -r "xfmr.*mtu" /usr/sbin/mgmt-framework/transformer/
# If found: xfmr_interface.go has a YangToDb_mtu_xfmr callback

# Step 4: Tail logs during a PATCH request
tail -f /var/log/syslog | grep -E "translib|transformer"

curl -X PATCH https://localhost/restconf/data/.../mtu -d '{"mtu": 9100}'

# Watch for log lines:
# [transformer] YangToDb_interface_xfmr: processing mtu=9100
# [db] SetEntry: table=PORT key=Ethernet0 field={mtu:9100}

# Step 5: If Redis write succeeded but orchagent didn't apply it:
tail -f /var/log/swss/sairedis.rec
# Check for SAI_PORT_ATTR_MTU set operation`}
          output={`Jan 12 11:00:01 sonic translib[5678]: IntfApp translateUpdate: path=/interfaces/interface[name=Ethernet0]/config
Jan 12 11:00:01 sonic transformer[5678]: YangToDb_interface_xfmr: mtu leaf, value=9100
Jan 12 11:00:01 sonic transformer[5678]: Annotation lookup: /oc-if:interfaces/.../mtu → PORT.mtu
Jan 12 11:00:01 sonic db[5678]: SetEntry: PORT|Ethernet0 mtu=9100
Jan 12 11:00:01 sonic CVL[5678]: ValidateEditConfig PASS
Jan 12 11:00:02 sonic orchagent: :- setPortMtu: Set MTU 9100 for Ethernet0
Jan 12 11:00:02 sonic syncd: SAI_PORT_ATTR_MTU set: oid=0x1000000000001 value=9100

✅ Full trace: OC → transformer → Redis → orchagent → SAI`}
        />
        <Callout type="tip">
          💡 <strong>Quick sanity check:</strong> If OC PATCH returns 200 OK but config isn&apos;t in Redis, the transformer silently dropped it (check for unimplemented leaf). If it&apos;s in Redis but not applied, orchagent rejected it (check swss logs). If both succeed but hardware isn&apos;t updated, SAI driver issue (check sairedis.rec).
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="lab" number="11" title="Lab Exercise — Full Roundtrip">
        <P>
          Hands-on: set interface MTU via OpenConfig REST, verify in Redis, read back state, check counters.
        </P>
        <CodeBlock
          title="lab_oc_roundtrip.sh"
          code={`# Prerequisites: SONiC switch with mgmt-framework running

# Step 1: SET config via OpenConfig RESTCONF
curl -k -u admin:YourPaSsWoRd -X PATCH \\
  https://192.168.1.1/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H "Content-Type: application/yang-data+json" \\
  -d '{
    "openconfig-interfaces:config": {
      "mtu": 9100,
      "enabled": true,
      "description": "Lab test interface"
    }
  }'

# Expected: HTTP 204 No Content (success)

# Step 2: Verify in CONFIG_DB (SSH to switch)
ssh admin@192.168.1.1
redis-cli -n 4 HGETALL "PORT|Ethernet0"
# Expect: mtu="9100", admin_status="up", description="Lab test interface"

# Step 3: GET the state subtree (config mirror + derived state)
curl -k -u admin:YourPaSsWoRd \\
  https://192.168.1.1/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/state \\
  | jq .

# Expect JSON with:
#   "mtu": 9100,
#   "enabled": true,
#   "oper-status": "UP",  ← derived from APPL_DB
#   "counters": { ... }   ← from COUNTERS_DB

# Step 4: Verify counters source (on switch)
redis-cli -n 2 KEYS "COUNTERS:oid:*"
# Find the OID for Ethernet0 (usually first in list)
redis-cli -n 2 HGETALL "COUNTERS:oid:0x1000000000001"
# See SAI_PORT_STAT_IF_IN_OCTETS, SAI_PORT_STAT_IF_OUT_OCTETS, etc.

# Step 5: Compare OC counter names to SAI names
# OC: in-octets, out-octets
# SAI: SAI_PORT_STAT_IF_IN_OCTETS, SAI_PORT_STAT_IF_OUT_OCTETS
# Transformer maps SAI → OC in DbToYang_counters_xfmr()`}
          output={`✅ Step 2 (CONFIG_DB):
1) "mtu"
2) "9100"
3) "admin_status"
4) "up"
5) "description"
6) "Lab test interface"

✅ Step 3 (state):
{
  "openconfig-interfaces:state": {
    "name": "Ethernet0",
    "mtu": 9100,
    "enabled": true,
    "description": "Lab test interface",
    "oper-status": "UP",
    "admin-status": "UP",
    "counters": {
      "in-octets": "12345678",
      "out-octets": "87654321",
      "in-unicast-pkts": "98765",
      "out-unicast-pkts": "56789"
    }
  }
}

✅ Step 4 (COUNTERS_DB SAI stats):
1) "SAI_PORT_STAT_IF_IN_OCTETS"
2) "12345678"
3) "SAI_PORT_STAT_IF_OUT_OCTETS"
4) "87654321"

🎯 Full circle validated: OC config → CONFIG_DB, OC state ← CONFIG_DB + APPL_DB + COUNTERS_DB`}
        />
      </Section>

      {/* 12 */}
      <Section id="interview" number="12" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is OpenConfig and why does it exist?",
              "OpenConfig is a vendor-neutral YANG schema for network devices, created by operators (Google, Microsoft, etc.) to solve multi-vendor automation. Before OC, each vendor had a different CLI/API. With OC, all vendors implement the same YANG models, so one controller codebase works for Arista, Cisco, SONiC, etc. SONiC uses OC as the northbound API (gNMI/RESTCONF) while keeping SONiC YANG as the native DB schema."
            ],
            [
              "Explain the config/state split in OpenConfig.",
              "OC mandates: config = intended configuration (writable), state = applied + derived state (read-only). Config contains what the operator sets (mtu, enabled). State mirrors config (confirms what was applied) PLUS has derived fields like oper-status (link up/down from hardware) and counters (telemetry). This separates intent from reality. In SONiC: config → CONFIG_DB, state config-mirror → CONFIG_DB, state derived → APPL_DB + COUNTERS_DB."
            ],
            [
              "How does SONiC map OpenConfig /interfaces/interface/config/mtu to Redis?",
              "Annotation YANG (sonic-interface-annot.yang) declares: deviation /oc-if:interfaces/.../mtu { sonic-ext:table-name 'PORT'; sonic-ext:field-name 'mtu'; }. Translib loads this at build time into a lookup map. On PATCH, translib finds the annotation, writes to Redis: PORT|Ethernet0 mtu=9100. No value transform needed (both are uint16)."
            ],
            [
              "What's a value transform in the OC→SONiC mapping? Give an example.",
              "A transform converts representation between OC and SONiC when types differ. Example: OC config/enabled is boolean (true/false). SONiC admin_status is enum string ('up'/'down'). Transformer callback YangToDb_intf_enabled_xfmr() does: if enabled { return 'up' } else { return 'down' }. Reverse: DbToYang reads 'up' → returns true."
            ],
            [
              "Why did SONiC choose OpenConfig northbound instead of exposing SONiC YANG directly?",
              "Two reasons: (1) Vendor neutrality — controllers written for Arista OC also work on SONiC. (2) API stability — SONiC can refactor CONFIG_DB schema internally (rename tables, split fields) without breaking the OC API. Translib absorbs the mapping changes. Exposing SONiC YANG directly would couple the API to implementation details."
            ],
            [
              "Where are the OC→SONiC mappings defined?",
              "Two places: (1) Annotation YANGs in sonic-mgmt-common/models/yang/annotations/ (declarative: sonic-ext:table-name, field-name). (2) Custom transformer callbacks in sonic-mgmt-common/translib/transformer/xfmr_*.go (imperative: complex transforms, 1→N mappings, value conversions)."
            ],
            [
              "How does SONiC handle an unsupported OpenConfig leaf?",
              "If the leaf has no annotation and no custom transformer, translib silently ignores it (no-op). If CVL validation is attempted and the leaf isn't in SONiC YANG, CVL returns error. Best practice: SONiC should return gRPC UNIMPLEMENTED for unsupported paths, but current behavior varies by leaf. Check release notes for OC feature completeness."
            ],
            [
              "What databases does an OpenConfig state read touch?",
              "CONFIG_DB (config mirror fields: mtu, admin_status), APPL_DB (derived state: oper_status from orchagent), COUNTERS_DB (telemetry: in-octets, out-octets from syncd SAI polls). Transformer queries all 3 via translib/db multi-DB API, merges into one OC state tree."
            ],
            [
              "How do you debug an OpenConfig mapping that isn't working?",
              "(1) Grep annotation files for the OC path to find the SONiC table+field. (2) Check for custom transformer (xfmr_*.go). (3) Enable GLOG_v=3, restart mgmt-framework, tail syslog during the request. (4) Verify Redis write succeeded. (5) Check orchagent logs if config didn't apply. (6) Check sairedis.rec if hardware wasn't programmed."
            ],
            [
              "Can you set a VLAN via OpenConfig and show the Redis result?",
              "Yes. POST /openconfig-vlan:vlans with {vlan-id: 100, name: 'prod'} → translib writes VLAN|Vlan100 {vlanid:100, name:prod}. PATCH /interfaces/interface[Ethernet0]/ethernet/switched-vlan/config {trunk-vlans:[100]} → writes VLAN_MEMBER|Vlan100|Ethernet0 {tagging_mode:tagged}. Transformer converts OC vlan-id (numeric) to SONiC key 'Vlan100' (string with prefix)."
            ],
          ]}
        />
      </Section>

      {/* 13 */}
      <Section id="memorize" number="13" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["What is OpenConfig", "Vendor-neutral YANG models (github.com/openconfig/public) for multi-vendor automation"],
            ["Why it exists", "Operators needed ONE API for N vendors → OC provides standard schema, vendors implement"],
            ["config/state split", "config = intent (writable), state = applied + derived (read-only, includes counters/oper-status)"],
            ["SONiC position", "Northbound = OpenConfig (gNMI/REST), southbound = SONiC YANG (CONFIG_DB), translib bridges"],
            ["Mapping: mtu", "/interfaces/interface/config/mtu → PORT|Ethernet0 mtu (direct, no transform)"],
            ["Mapping: enabled", "/config/enabled (boolean) → PORT admin_status 'up'/'down' (transform: bool→enum string)"],
            ["Mapping: VLAN", "/vlans/vlan[vlan-id=100] → VLAN|Vlan100 (transform: numeric → 'Vlan' + id string)"],
            ["Mapping: NTP", "/system/ntp/servers/server[10.1.1.1] → NTP_SERVER|10.1.1.1"],
            ["State sources", "config mirror ← CONFIG_DB, oper-status ← APPL_DB, counters ← COUNTERS_DB"],
            ["Annotations", "sonic-*-annot.yang: deviation + sonic-ext:table-name/field-name → OC→SONiC map"],
            ["Transformers", "transformer/xfmr_*.go: custom callbacks for complex mappings (1→N, value transforms)"],
            ["Debug", "Grep annotations, check xfmr, GLOG_v=3 tail syslog, verify Redis, check orchagent logs"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
