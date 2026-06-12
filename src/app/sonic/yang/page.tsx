"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "From .yang file to validated config tree",
  nodes: [
    { id: "yang", icon: "📄", label: "module.yang", sub: "YANG source", x: 8, y: 50, color: "#22d3ee" },
    { id: "pyang", icon: "🧰", label: "pyang", sub: "compile", x: 26, y: 22, color: "#a78bfa" },
    { id: "tree", icon: "🌳", label: "Schema Tree", sub: "in-memory model", x: 44, y: 50, color: "#34d399" },
    { id: "payload", icon: "📨", label: "JSON payload", sub: "config intent", x: 26, y: 78, color: "#fbbf24" },
    { id: "validate", icon: "🛡️", label: "Validation", sub: "types · must · when", x: 64, y: 50, color: "#fb923c" },
    { id: "accept", icon: "✅", label: "Valid config", sub: "apply to system", x: 84, y: 28, color: "#34d399" },
    { id: "reject", icon: "❌", label: "Rejected", sub: "error to client", x: 84, y: 72, color: "#f87171" },
  ],
  edges: [
    { id: "yang-pyang", from: "yang", to: "pyang", color: "#a78bfa" },
    { id: "pyang-tree", from: "pyang", to: "tree", color: "#34d399" },
    { id: "payload-validate", from: "payload", to: "validate", color: "#fb923c" },
    { id: "tree-validate", from: "tree", to: "validate", color: "#fb923c" },
    { id: "validate-accept", from: "validate", to: "accept", color: "#34d399" },
    { id: "validate-reject", from: "validate", to: "reject", color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Valid VLAN config",
      command: "create VLAN 100 with member Ethernet0 tagged",
      steps: [
        { node: "yang", paths: ["yang-pyang"], text: "Developer writes sonic-vlan.yang: defines VLAN_LIST with key vlanid (type uint16 1-4094), name (pattern), members (leafref to PORT)." },
        { node: "pyang", paths: ["pyang-tree"], text: "pyang compiles YANG to schema tree: resolves imports, expands groupings, type-checks the schema itself. Outputs .yin or loads into libyang." },
        { node: "tree", paths: ["tree-validate"], text: "Schema tree in memory: /sonic-vlan:VLAN/VLAN_LIST[vlanid] with child nodes name, members. Validator ready." },
        { node: "payload", paths: ["payload-validate"], text: "Client sends JSON: {\"vlanid\": 100, \"name\": \"Vlan100\", \"members\": [\"Ethernet0\"]}. Validator parses against schema." },
        { node: "validate", paths: ["validate-accept"], text: "Checks pass: vlanid 100 in range 1-4094 ✓, name matches pattern [A-Za-z0-9_-]+ ✓, Ethernet0 exists in PORT table (leafref) ✓. All constraints satisfied." },
        { node: "accept", paths: [], text: "Config accepted. Write to CONFIG_DB: VLAN|Vlan100 {vlanid:100}, VLAN_MEMBER|Vlan100|Ethernet0 {tagging_mode:tagged}. Orchagent applies. ✅" },
      ],
    },
    {
      id: "failure",
      name: "❌ Pattern violation",
      command: "vlan name 'VLAN-abc!' with special char",
      steps: [
        { node: "payload", paths: ["payload-validate"], text: "Client sends {\"vlanid\": 100, \"name\": \"VLAN-abc!\"}. Exclamation mark violates naming pattern." },
        { node: "tree", paths: ["tree-validate"], text: "Schema defines: leaf name { type string; pattern \"[A-Za-z0-9_-]+\"; }. Validator must enforce." },
        { node: "validate", paths: ["validate-reject"], text: "Pattern check fails: 'VLAN-abc!' contains '!' which is not in [A-Za-z0-9_-]. Validator returns error: \"pattern constraint violation\"." },
        { node: "reject", paths: [], text: "Error response to client: \"Semantic validation failed: name value 'VLAN-abc!' does not match pattern [A-Za-z0-9_-]+\". Config rejected. ❌" },
      ],
    },
    {
      id: "advanced",
      name: "🔗 when/leafref advanced",
      command: "ACL rule with conditional + cross-table check",
      steps: [
        { node: "yang", paths: ["yang-pyang"], text: "ACL YANG: 'leaf src_ip' has 'when \"../acl_table_type = L3\"' (conditional node). 'leaf acl_table_name' is leafref to ACL_TABLE/name." },
        { node: "pyang", paths: ["pyang-tree"], text: "pyang compiles conditional constraints (when clauses as XPath) and leafref paths. Schema tree encodes: src_ip only valid if type=L3." },
        { node: "payload", paths: ["payload-validate"], text: "Client adds ACL rule: {\"acl_table_name\": \"SSH_ONLY\", \"acl_table_type\": \"L3\", \"src_ip\": \"10.0.0.0/8\"}." },
        { node: "validate", paths: ["tree-validate"], text: "Validator evaluates XPath: acl_table_type = L3? Yes ✓ → src_ip node allowed. Then checks leafref: does ACL_TABLE|SSH_ONLY exist in current DB?" },
        { node: "tree", paths: ["validate-accept"], text: "Queries Redis: ACL_TABLE|SSH_ONLY found ✓. Leafref satisfied. When clause true → src_ip valid. All constraints pass." },
        { node: "accept", paths: [], text: "Config accepted. Write ACL_RULE entry. If we'd sent type=L2 with src_ip, when clause would fail → reject. If SSH_ONLY didn't exist, leafref fails → reject. ✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is", label: "What Is YANG?" },
  { id: "why-yang", label: "Why YANG Exists — The Problem It Solves" },
  { id: "module", label: "Module Skeleton ⭐" },
  { id: "containers", label: "Containers & Lists" },
  { id: "leafs", label: "Leafs & Types ⭐" },
  { id: "advanced", label: "Advanced Constructs" },
  { id: "constraints", label: "Constraints: must · when · leafref ⭐" },
  { id: "config-state", label: "config vs state Split" },
  { id: "tools", label: "YANG Tools — pyang · yanglint" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function YangPage() {
  return (
    <TopicShell
      icon="🌳"
      title="YANG Fundamentals — The Data Modeling Language"
      gradientWord="YANG"
      subtitle="YANG (Yet Another Next Generation) is the schema language that defines network device configuration and state. Write the model once in YANG, and auto-generate CLI, REST APIs, validation, documentation, and client bindings. From zero to real OpenConfig and SONiC YANG trees."
      nav={NAV}
      badges={["📐 RFC 7950 spec", "🌳 Real trees", "🛡️ Built-in validation", "🔗 Cross-table refs", "🧪 pyang lab"]}
      next={{ icon: "🌐", label: "OpenConfig", href: "/sonic/openconfig" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is" number="01" title="What Is YANG?">
        <P>
          <strong>YANG</strong> = <em>Yet Another Next Generation</em> (yes, really). Defined in <strong>RFC 7950</strong>, it&apos;s a <strong>data modeling language</strong> for network management protocols like NETCONF, RESTCONF, and gNMI.
        </P>
        <CodeBlock
          title="yang_in_one_breath.txt"
          runnable={false}
          code={`YANG is to network devices what JSON Schema is to web APIs.

You write ONE .yang file describing your config/state schema:
  • data types (uint16, string, IP address, MAC, ...)
  • structure (containers, lists, leafs — think JSON objects/arrays/scalars)
  • constraints (must, when, leafref — validation rules)

From that YANG, tools AUTO-GENERATE:
  ✅ CLI parsers (SONiC 'config' commands read YANG)
  ✅ REST/gNMI servers (server knows valid paths + types)
  ✅ Validation logic (CVL in SONiC uses YANG for semantic checks)
  ✅ Client bindings (Go/Python structs, like ygot)
  ✅ Documentation (pyang -f tree renders ASCII diagrams)

One schema to rule them all. 🧙‍♂️`}
        />
        <Callout type="analogy">
          🌍 <strong>Real-world analogy:</strong> YANG is like an architectural blueprint. The blueprint (YANG file) defines room layout (containers), furniture (leafs), and rules (&quot;kitchen must have a sink&quot; = must constraint). Builders (CLI/REST/gNMI servers) construct the house following the blueprint. Inspectors (CVL validator) verify the house matches the blueprint before occupancy.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="why-yang" number="02" title="Why YANG Exists — The Problem It Solves">
        <P>Before YANG, network vendors each had proprietary config schemas:</P>
        <CodeBlock
          title="the_chaos_before_yang.txt"
          runnable={false}
          code={`Vendor A CLI:  set interface eth0 ip-address 10.0.0.1/24
Vendor B CLI:  interface Ethernet0; ip address 10.0.0.1 255.255.255.0
Vendor C SNMP: .1.3.6.1.4.1.9999.1.2.1 = 10.0.0.1  (OID hell)
Vendor D XML:  <if><name>eth0</name><ipv4>10.0.0.1</ipv4></if>

PROBLEMS
❌ No standard — can't write one controller for all vendors
❌ No machine-readable schema — parsing CLI output is brittle regex
❌ No validation — vendor A accepts MTU 999999, crashes at runtime
❌ No versioning — adding a field breaks old clients

YANG SOLVES THIS
✅ Standard schema language (RFC 7950) — vendor-neutral
✅ Machine-readable — parsers exist in every language (libyang, pyangbind)
✅ Built-in validation — types, ranges, constraints in the model
✅ Backward compatibility — augment/deviation mechanisms for extensions
✅ Multi-protocol — same YANG drives NETCONF, RESTCONF, gNMI, even CLI

Result: OpenConfig writes YANG for interfaces ONCE. Arista, Cisco, SONiC
all implement that YANG. Controllers speak one language. 🎯`}
        />
        <Callout type="tip">
          💡 <strong>Interview answer template:</strong> &quot;YANG is a data modeling language (RFC 7950) that provides a vendor-neutral, machine-readable schema for network config and state. It enables model-driven management: write the model once, auto-generate APIs, validation, and client bindings. SONiC uses YANG for both native schema (CONFIG_DB tables) and northbound OpenConfig APIs.&quot;
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="module" number="03" title="Module Skeleton ⭐">
        <P>Every YANG file is a <IC>module</IC>. Here&apos;s the minimal structure:</P>
        <CodeBlock
          title="minimal.yang"
          runnable={false}
          code={`module sonic-example {
  yang-version 1.1;              // 1.0 or 1.1 (1.1 adds action/notification)
  namespace "http://github.com/sonic-net/sonic-example";
  prefix "sonic-ex";             // short alias used in XPath references

  revision 2025-01-10 {
    description "Initial revision";
  }

  // imports — pull in types/groupings from other modules
  import ietf-inet-types {
    prefix inet;                 // now we can use inet:ipv4-address type
  }

  // your data model starts here
  container EXAMPLE_TABLE {
    description "Top-level container for examples";

    list EXAMPLE_LIST {
      key "name";                // primary key (like DB table primary key)

      leaf name {
        type string;
        description "Unique identifier";
      }

      leaf value {
        type uint32;
        description "Some integer value";
      }
    }
  }
}`}
        />
        <P>Key elements:</P>
        <Table
          head={["Element", "Purpose"]}
          rows={[
            [<IC key="1">namespace</IC>, "Globally unique URI. By convention: http://github.com/org/module-name. Prevents name collisions."],
            [<IC key="2">prefix</IC>, "Short alias (2-8 chars). Used in XPath: /sonic-ex:EXAMPLE_TABLE/..."],
            [<IC key="3">revision</IC>, "Version date (YYYY-MM-DD). Newer revisions augment/deprecate nodes. Clients check revision."],
            [<IC key="4">import</IC>, "Include another module. Common: ietf-inet-types (IP/MAC), ietf-yang-types (timestamps, counters)."],
          ]}
        />
        <Callout type="note">
          📌 SONiC YANG modules live in <IC>sonic-buildimage/src/sonic-yang-models/yang-models/</IC>. OpenConfig YANGs are in <IC>sonic-mgmt-common/models/yang/openconfig/</IC>.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="containers" number="04" title="Containers & Lists">
        <P>
          <IC>container</IC> = JSON object (named group of child nodes). <IC>list</IC> = JSON array of objects with a key.
        </P>
        <CodeBlock
          title="container_and_list.yang"
          runnable={false}
          code={`module sonic-vlan {
  namespace "http://github.com/sonic-net/sonic-vlan";
  prefix "vlan";

  container sonic-vlan {
    description "Top-level container for all VLAN config";

    container VLAN {
      description "VLAN table container";

      list VLAN_LIST {
        key "vlanid";              // single key

        leaf vlanid {
          type uint16 {
            range "1..4094";       // VLAN ID range
          }
          description "VLAN ID";
        }

        leaf name {
          type string {
            pattern "[a-zA-Z0-9_-]+";  // alphanumeric + underscore/dash
          }
          description "VLAN interface name, e.g., Vlan100";
        }
      }
    }

    container VLAN_MEMBER {
      list VLAN_MEMBER_LIST {
        key "vlanid port";         // COMPOSITE key (2 fields)

        leaf vlanid {
          type leafref {
            path "/vlan:sonic-vlan/vlan:VLAN/vlan:VLAN_LIST/vlan:vlanid";
          }
          description "Reference to parent VLAN (foreign key!)";
        }

        leaf port {
          type string;
          description "Member port, e.g., Ethernet0";
        }

        leaf tagging_mode {
          type enumeration {
            enum tagged;
            enum untagged;
          }
          default "tagged";
        }
      }
    }
  }
}`}
        />
        <P>This maps to Redis CONFIG_DB:</P>
        <CodeBlock
          title="redis_mapping.sh"
          code={`redis-cli -n 4 HGETALL "VLAN|Vlan100"
redis-cli -n 4 HGETALL "VLAN_MEMBER|Vlan100|Ethernet0"`}
          output={`1) "vlanid"
2) "100"
3) "name"
4) "Vlan100"

1) "tagging_mode"
2) "tagged"`}
        />
        <P>
          Notice the <IC>leafref</IC> on vlanid — it creates a foreign-key constraint: VLAN_MEMBER.vlanid <strong>must</strong> reference an existing VLAN_LIST entry. CVL enforces this!
        </P>
        <Callout type="behind">
          ⚙️ <strong>Multi-key lists:</strong> <IC>key &quot;vlanid port&quot;</IC> means Redis key is <IC>VLAN_MEMBER|100|Ethernet0</IC> (pipe-separated). The YANG <IC>key</IC> statement defines primary key uniqueness — no two entries can have the same vlanid+port pair.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="leafs" number="05" title="Leafs & Types ⭐">
        <P>
          <IC>leaf</IC> = scalar value (JSON primitive). YANG has a rich type system:
        </P>
        <Table
          head={["YANG type", "Example", "Constraints"]}
          rows={[
            [<IC key="1">string</IC>, <IC key="11">&quot;Ethernet0&quot;</IC>, "pattern, length"],
            [<IC key="2">uint8 / uint16 / uint32 / uint64</IC>, <IC key="12">9100</IC>, "range (e.g., 1280-9216 for MTU)"],
            [<IC key="3">int8 / int16 / int32 / int64</IC>, <IC key="13">-42</IC>, "range"],
            [<IC key="4">boolean</IC>, <IC key="14">true</IC>, "—"],
            [<IC key="5">enumeration</IC>, <IC key="15">{`enum { up; down; }`}</IC>, "one of the defined values"],
            [<IC key="6">inet:ipv4-address</IC>, <IC key="16">&quot;10.0.0.1&quot;</IC>, "dotted-quad validation (from ietf-inet-types)"],
            [<IC key="7">inet:ipv6-address</IC>, <IC key="17">&quot;2001:db8::1&quot;</IC>, "—"],
            [<IC key="8">yang:mac-address</IC>, <IC key="18">&quot;00:1a:2b:3c:4d:5e&quot;</IC>, "colon-hex format (ietf-yang-types)"],
            [<IC key="9">union</IC>, <IC key="19">uint32 | string</IC>, "either type valid"],
            [<IC key="10">leafref</IC>, <IC key="20">path &quot;../../OTHER/key&quot;</IC>, "foreign key (XPath to another leaf)"],
          ]}
        />
        <P>Real examples from SONiC YANG:</P>
        <CodeBlock
          title="sonic-port.yang (excerpts)"
          runnable={false}
          code={`leaf mtu {
  type uint16 {
    range "1280..9216";          // jumbo frames max 9216
  }
  default 9100;
  description "Maximum transmission unit in bytes";
}

leaf admin_status {
  type enumeration {
    enum up;
    enum down;
  }
  default "up";
}

leaf speed {
  type uint32;
  units "Mbps";
  description "Port speed: 1000, 10000, 25000, 40000, 100000, ...";
}

leaf lanes {
  type string {
    pattern "[0-9]+(,[0-9]+)*";  // comma-separated lane numbers: "65,66,67,68"
  }
}

leaf ipv4 {
  type inet:ipv4-prefix;         // "10.0.0.1/24" format (CIDR)
}`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common mistake:</strong> Using <IC>type string</IC> for everything. This bypasses YANG&apos;s validation! Use <IC>inet:ipv4-address</IC> for IPs, <IC>uint16</IC> with range for port numbers, <IC>enumeration</IC> for fixed choices. The more specific the type, the earlier you catch bad input (at CVL validation, not at orchagent runtime).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="advanced" number="06" title="Advanced Constructs">
        <P>
          YANG has reusable patterns: <IC>grouping</IC>, <IC>augment</IC>, <IC>deviation</IC>, <IC>choice</IC>.
        </P>
        <CodeBlock
          title="advanced.yang"
          runnable={false}
          code={`// GROUPING: reusable template (like a Go struct or C typedef)
grouping common-counters {
  leaf tx-packets {
    type yang:counter64;
  }
  leaf rx-packets {
    type yang:counter64;
  }
  leaf tx-errors {
    type yang:counter64;
  }
}

container PORT {
  list PORT_LIST {
    key "port_name";
    uses common-counters;      // inline the grouping here
  }
}

// AUGMENT: extend another module's tree (like inheritance)
// OpenConfig does this heavily
import openconfig-interfaces {
  prefix oc-if;
}

augment "/oc-if:interfaces/oc-if:interface/oc-if:config" {
  leaf sonic-extension {
    type string;
    description "Vendor-specific field added to OpenConfig";
  }
}

// DEVIATION: alter another module's constraints (vendor customization)
// SONiC annotations are deviations!
deviation "/oc-if:interfaces/oc-if:interface/oc-if:config/oc-if:mtu" {
  deviate replace {
    type uint16 {
      range "68..9216";        // narrower than OpenConfig's 0..65535
    }
  }
}

// CHOICE: mutually exclusive options (like a union, but structural)
choice address-type {
  case ipv4 {
    leaf ipv4-addr {
      type inet:ipv4-address;
    }
  }
  case ipv6 {
    leaf ipv6-addr {
      type inet:ipv6-address;
    }
  }
}
// client provides EITHER ipv4-addr OR ipv6-addr, not both`}
        />
        <Callout type="tip">
          💡 <strong>Annotations deep dive:</strong> SONiC&apos;s <IC>sonic-*-annot.yang</IC> files use <IC>deviation</IC> to attach <IC>sonic-ext:table-name</IC> metadata to OpenConfig leafs. This is how translib knows <IC>/interfaces/interface/config/mtu → PORT table mtu field</IC>. It&apos;s YANG all the way down!
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="constraints" number="07" title="Constraints: must · when · leafref ⭐">
        <P>
          These are the <strong>semantic validation</strong> backbone. CVL evaluates them at config-write time.
        </P>
        <CodeBlock
          title="constraints.yang"
          runnable={false}
          code={`// MUST: XPath boolean expression — must be true for the config to be valid
leaf src-ip {
  type inet:ipv4-address;
  must "../acl-type = 'L3'" {
    error-message "src-ip requires acl-type L3";
  }
  description "Source IP — only valid for L3 ACLs";
}
// If client sets src-ip but acl-type=L2, CVL rejects with the error-message.

// WHEN: conditional presence — node only exists if condition is true
leaf vrrp-priority {
  when "../vrrp-enabled = 'true'";
  type uint8 {
    range "1..255";
  }
  description "VRRP priority — only present if VRRP is enabled";
}
// If vrrp-enabled=false, setting vrrp-priority is invalid (node doesn't exist).

// LEAFREF: foreign key — value must match another leaf's value
leaf port {
  type leafref {
    path "/sonic-port:PORT/PORT_LIST/port_name";
  }
  description "Port name must exist in PORT table";
}
// CVL queries Redis: does PORT|<value> exist? If not → reject.

// LEAFREF ACROSS MODULES (with prefix)
import sonic-vlan {
  prefix vlan;
}

leaf vlanid {
  type leafref {
    path "/vlan:sonic-vlan/vlan:VLAN/vlan:VLAN_LIST/vlan:vlanid";
  }
}`}
        />
        <P>
          Real SONiC example: deleting a VLAN that has members. The VLAN_MEMBER leafref prevents orphans:
        </P>
        <CodeBlock
          title="leafref_enforcement.sh"
          code={`# Create VLAN 100
curl -X POST https://localhost/restconf/data/sonic-vlan:sonic-vlan/VLAN \\
  -d '{"VLAN_LIST": [{"vlanid": 100, "name": "Vlan100"}]}'

# Add member
curl -X POST https://localhost/restconf/data/sonic-vlan:sonic-vlan/VLAN_MEMBER \\
  -d '{"VLAN_MEMBER_LIST": [{"vlanid": 100, "port": "Ethernet0"}]}'

# Try to delete VLAN 100 (should FAIL — member still attached)
curl -X DELETE https://localhost/restconf/data/sonic-vlan:sonic-vlan/VLAN/VLAN_LIST=100`}
          output={`HTTP/1.1 409 Conflict
{
  "ietf-restconf:errors": {
    "error": [{
      "error-type": "application",
      "error-tag": "operation-failed",
      "error-message": "Semantic validation failed: Dependent entry VLAN_MEMBER|Vlan100|Ethernet0 exists"
    }]
  }
}

✅ CVL caught the leafref violation — can't delete parent while child exists!`}
        />
        <Callout type="behind">
          ⚙️ CVL builds a <strong>dependency graph</strong> at startup by parsing all leafrefs. When you delete VLAN 100, it walks the graph: &quot;who points to me?&quot; Finds VLAN_MEMBER → checks if any entries exist → returns error if found. This prevents DB corruption.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="config-state" number="08" title="config vs state Split">
        <P>
          OpenConfig mandates a <strong>config / state</strong> split. SONiC YANG doesn&apos;t always use this, but OC does religiously:
        </P>
        <CodeBlock
          title="openconfig-interfaces.yang (simplified)"
          runnable={false}
          code={`container interfaces {
  list interface {
    key "name";

    container config {              // INTENDED config (writable)
      leaf name   { type string; }
      leaf mtu    { type uint16; }
      leaf enabled { type boolean; }
    }

    container state {               // APPLIED + DERIVED state (read-only)
      config false;                 // "config false" = read-only

      leaf name   { type string; }
      leaf mtu    { type uint16; }
      leaf enabled { type boolean; }

      // DERIVED state (not in config)
      leaf oper-status {
        type enumeration {
          enum UP;
          enum DOWN;
        }
        description "Actual operational status from hardware";
      }

      leaf counters {
        // tx-packets, rx-packets, etc. — read-only telemetry
      }
    }
  }
}`}
        />
        <P>Why the duplication?</P>
        <CodeBlock
          title="config_vs_state_explained.txt"
          runnable={false}
          code={`CONFIG (writable)
  • What the operator WANTS: "I set mtu=9100 and enabled=true"
  • Client writes to /interfaces/interface[name=Eth0]/config/mtu
  • Stored in CONFIG_DB

STATE (read-only)
  • What the system ACTUALLY applied: "mtu is 9100, enabled is true"
  • What the hardware reports: "oper-status is UP" (cable plugged in)
  • Counters, errors, derived values
  • Client reads from /interfaces/interface[name=Eth0]/state/oper-status
  • Sourced from APPL_DB, COUNTERS_DB, orchagent state

THE MIRROR PATTERN
  config and state have IDENTICAL leaves for config fields (name, mtu, enabled)
  → this lets you compare: is config.mtu == state.mtu? (intent == reality?)
  → state ALSO has extra leaves (oper-status, counters) not in config

SONiC shortcut: native SONiC YANG often skips the split (just one container)
because CONFIG_DB is the source of truth. OpenConfig APIs add the split via
transformer mapping: config → CONFIG_DB, state → APPL_DB + COUNTERS_DB.`}
        />
        <Callout type="analogy">
          🌍 <strong>Thermostat analogy:</strong> <IC>config/temperature</IC> = you set it to 72°F (intent). <IC>state/temperature</IC> = thermostat reads the actual room temp as 71°F (reality). <IC>state/heating</IC> = derived state: heater is ON because intent &gt; reality. The split separates &quot;what you asked for&quot; from &quot;what&apos;s happening.&quot;
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="tools" number="09" title="YANG Tools — pyang · yanglint">
        <P>
          You don&apos;t write YANG blind. These tools validate and visualize:
        </P>
        <CodeBlock
          title="pyang_examples.sh"
          code={`# Install pyang (Python-based YANG validator/formatter)
pip install pyang

# Validate a YANG file (checks syntax + imports)
pyang sonic-vlan.yang
# Output: (nothing if valid, or errors like "line 42: unknown statement 'typo'")

# Render ASCII tree (THE most useful command!)
pyang -f tree sonic-vlan.yang

# Compile to .yin (XML schema — what CVL loads)
pyang -f yin sonic-vlan.yang -o sonic-vlan.yang.yin

# See all dependencies (what this module imports recursively)
pyang -f depend sonic-vlan.yang

# Check for unused imports/groupings
pyang --lint sonic-vlan.yang`}
          output={`module: sonic-vlan
  +--rw sonic-vlan
     +--rw VLAN
     |  +--rw VLAN_LIST* [vlanid]
     |     +--rw vlanid    uint16
     |     +--rw name?     string
     +--rw VLAN_MEMBER
        +--rw VLAN_MEMBER_LIST* [vlanid port]
           +--rw vlanid         -> /sonic-vlan/VLAN/VLAN_LIST/vlanid
           +--rw port           string
           +--rw tagging_mode?  enumeration

✅ Tree shows structure at a glance: * means list, ? means optional,
   -> means leafref (foreign key)`}
        />
        <P>
          For stricter validation (checks leafref targets exist in imports):
        </P>
        <CodeBlock
          title="yanglint_examples.sh"
          code={`# yanglint (libyang CLI — stricter than pyang)
apt-get install libyang-tools

# Load all dependencies + validate
yanglint -p /path/to/yang/models sonic-vlan.yang

# Validate a JSON payload against the YANG schema
yanglint -t config -p . sonic-vlan.yang vlan_config.json
# Checks: types, ranges, must, when, leafref resolution`}
          output={`libyang[0]: Leafref "/sonic-port:PORT/PORT_LIST/port_name" target not found.
err: Failed to parse data.

✅ yanglint caught a leafref to a non-existent port — CVL would reject this too.`}
        />
        <Callout type="tip">
          💡 <strong>Dev workflow:</strong> (1) Write/edit YANG, (2) <IC>pyang -f tree module.yang</IC> to visualize, (3) <IC>yanglint -t config module.yang test.json</IC> to test-validate a sample payload, (4) rebuild sonic-mgmt-common to regenerate ygot bindings.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise — Write Your Own YANG">
        <P>
          Hands-on: create a mini <IC>sonic-banner.yang</IC> module with validation, then test it.
        </P>
        <CodeBlock
          title="lab_write_yang.sh"
          code={`# Step 1: Create sonic-banner.yang
cat > sonic-banner.yang <<'YANG'
module sonic-banner {
  yang-version 1.1;
  namespace "http://github.com/sonic-net/sonic-banner";
  prefix "banner";

  revision 2025-01-12 {
    description "Login banner management";
  }

  container sonic-banner {
    container BANNER {
      list BANNER_LIST {
        key "banner_type";

        leaf banner_type {
          type enumeration {
            enum login;
            enum motd;
          }
          description "Banner type: login (pre-auth) or motd (post-auth)";
        }

        leaf message {
          type string {
            length "1..2000";
            pattern "[\\\\x20-\\\\x7E\\\\n]*";  // printable ASCII + newline
          }
          mandatory true;
          description "Banner message text";
        }

        leaf enabled {
          type boolean;
          default true;
        }
      }
    }
  }
}
YANG

# Step 2: Validate syntax
pyang sonic-banner.yang
echo "✅ Syntax valid"

# Step 3: Render tree
pyang -f tree sonic-banner.yang`}
          output={`module: sonic-banner
  +--rw sonic-banner
     +--rw BANNER
        +--rw BANNER_LIST* [banner_type]
           +--rw banner_type    enumeration
           +--rw message        string
           +--rw enabled?       boolean

✅ Tree looks good!`}
        />
        <CodeBlock
          title="lab_test_payload.sh"
          code={`# Step 4: Create valid JSON payload
cat > banner_valid.json <<'JSON'
{
  "sonic-banner:sonic-banner": {
    "BANNER": {
      "BANNER_LIST": [
        {
          "banner_type": "login",
          "message": "Unauthorized access prohibited.\\nAll activity is logged.",
          "enabled": true
        }
      ]
    }
  }
}
JSON

# Step 5: Validate payload against YANG
yanglint -t config sonic-banner.yang banner_valid.json
echo "✅ Payload is valid"

# Step 6: Test invalid payload (bad enum)
cat > banner_invalid.json <<'JSON'
{
  "sonic-banner:sonic-banner": {
    "BANNER": {
      "BANNER_LIST": [
        {
          "banner_type": "shutdown",
          "message": "Going down"
        }
      ]
    }
  }
}
JSON

yanglint -t config sonic-banner.yang banner_invalid.json`}
          output={`✅ Payload is valid

libyang[0]: Invalid enumeration value "shutdown". (path: /sonic-banner:sonic-banner/BANNER/BANNER_LIST[banner_type='shutdown']/banner_type)
err: Validation failed.

✅ yanglint caught the bad enum — 'shutdown' is not in {login, motd}!`}
        />
        <Callout type="note">
          📌 <strong>Lab takeaway:</strong> You just wrote a YANG module, validated it, and tested payloads — the same workflow SONiC developers use daily. To integrate this into SONiC: (1) add to <IC>src/sonic-yang-models/yang-models/</IC>, (2) rebuild <IC>sonic-yang-mgmt.deb</IC>, (3) CVL will auto-load it and enforce constraints.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="interview" number="11" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is YANG and why is it used in networking?",
              "YANG (RFC 7950) is a data modeling language for network management. It defines the schema (structure, types, constraints) for config and state. From one YANG file, you auto-generate CLI, REST APIs, validation, and client bindings. It enables vendor-neutral, model-driven management — controllers speak YANG (via NETCONF/RESTCONF/gNMI), not vendor-specific CLIs."
            ],
            [
              "Explain the difference between a container, list, and leaf in YANG.",
              "container = named group (JSON object). list = array of objects with a key (like a DB table). leaf = scalar value (string, uint16, IP address). Example: container VLAN { list VLAN_LIST { key vlanid; leaf vlanid; leaf name; } } → Redis VLAN|100 {vlanid:100, name:Vlan100}."
            ],
            [
              "What's a leafref and how does it differ from a regular type?",
              "leafref is a foreign-key constraint. It's a type whose value must match another leaf's value (via XPath path). Example: leaf port { type leafref { path '../../PORT/PORT_LIST/port_name'; } } means the port value must exist in the PORT table. CVL queries Redis to validate this at config-write time. Regular types (uint16, string) just check syntax."
            ],
            [
              "What's the difference between must and when constraints?",
              "must = validation rule: XPath expression must be true for the config to be valid. Example: must '../type = L3' on src_ip field → CVL rejects if type≠L3. when = conditional presence: the node only EXISTS if the when clause is true. Example: when '../enabled = true' → the leaf is invalid (doesn't exist in schema) if enabled=false."
            ],
            [
              "Why does OpenConfig split config and state into separate containers?",
              "config = intended configuration (writable, what the operator sets). state = applied + derived state (read-only, what the system reports). This separates intent from reality. Example: config/mtu=9100 (you set it) vs state/mtu=9100 + state/oper-status=UP (system confirms it applied + port is up). state has extra counters/status that aren't in config."
            ],
            [
              "What tools validate YANG files and payloads?",
              "pyang: validates syntax, renders ASCII trees (-f tree), compiles to .yin. yanglint (libyang CLI): stricter validation, checks leafref targets, validates JSON/XML payloads against schema. In SONiC: CVL uses libyang at runtime for payload validation."
            ],
            [
              "Where are YANG files stored in SONiC?",
              "SONiC native: sonic-buildimage/src/sonic-yang-models/yang-models/ (sonic-port.yang, sonic-vlan.yang, ...). OpenConfig: sonic-mgmt-common/models/yang/openconfig/ (cloned from openconfig/public). Annotations: sonic-mgmt-common/models/yang/annotations/ (sonic-*-annot.yang — map OC to SONiC)."
            ],
            [
              "How does CVL use YANG at runtime?",
              "CVL loads compiled .yin schemas at startup. When translib calls CVL.ValidateEditConfig(jsonPayload), CVL: (1) parses JSON against the YANG tree (libyang), (2) checks types/ranges/patterns (syntactic), (3) evaluates must/when (XPath), (4) resolves leafrefs by querying current Redis state (semantic). Returns PASS or detailed error."
            ],
            [
              "What's an annotation YANG in SONiC?",
              "Annotation YANGs are YANG deviation modules (sonic-*-annot.yang) that attach sonic-ext:table-name and sonic-ext:field-name metadata to OpenConfig leafs. Example: deviation /oc-if:interfaces/.../mtu { deviate add { sonic-ext:table-name 'PORT'; sonic-ext:field-name 'mtu'; } }. This tells translib: map OC /interfaces/interface/config/mtu → SONiC PORT table mtu field. Pyang plugin parses these into Go lookup maps."
            ],
            [
              "Can you write a YANG module from scratch?",
              "Yes. (1) module header: namespace, prefix, revision. (2) import ietf-inet-types for IP/MAC types. (3) define containers (config grouping) and lists (keyed collections). (4) add leafs with specific types (uint16 with range, enumeration, pattern for strings). (5) add constraints: must for validation, leafref for foreign keys. (6) validate with pyang -f tree, test payloads with yanglint."
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["What is YANG", "RFC 7950 data modeling language — schema for network config/state"],
            ["Why it exists", "Vendor-neutral, machine-readable schema → one model drives CLI/REST/gNMI/validation"],
            ["module", "Top-level unit: namespace + prefix + revision + data nodes"],
            ["container", "Named group (JSON object) — grouping of child nodes"],
            ["list", "Array of objects with key (DB table) — key defines uniqueness"],
            ["leaf", "Scalar value: string, uint16, inet:ipv4-address, enumeration, boolean"],
            ["leafref", "Foreign key: type leafref { path '...' } — value must exist in referenced leaf"],
            ["must", "Validation constraint: XPath must be true — CVL enforces at write"],
            ["when", "Conditional presence: node only exists if XPath is true"],
            ["config/state", "OC split: config = intent (writable), state = reality + counters (read-only)"],
            ["pyang -f tree", "Render ASCII tree from YANG — visualize structure at a glance"],
            ["CVL + YANG", "CVL loads .yin schemas, validates JSON via libyang + leafref Redis queries"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
