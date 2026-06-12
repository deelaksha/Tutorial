"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "sonic-vlan.yang IS the CONFIG_DB schema",
  nodes: [
    { id: "yang", icon: "📄", label: "sonic-vlan.yang", sub: "YANG model", x: 8, y: 50, color: "#22d3ee" },
    { id: "container", icon: "📦", label: "container VLAN", sub: "= table", x: 28, y: 25, color: "#a78bfa" },
    { id: "list", icon: "📜", label: "list VLAN_LIST", sub: "key name", x: 28, y: 75, color: "#34d399" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "live redis", x: 52, y: 50, color: "#fb923c" },
    { id: "key", icon: "🔑", label: "VLAN|Vlan100", sub: "redis key", x: 72, y: 25, color: "#fbbf24" },
    { id: "fields", icon: "🏷️", label: "hash fields", sub: "vlanid · members", x: 72, y: 75, color: "#f472b6" },
    { id: "cvl", icon: "🛡️", label: "CVL", sub: "enforces model", x: 90, y: 50, color: "#60a5fa" },
  ],
  edges: [
    { id: "yang-container", from: "yang", to: "container", color: "#a78bfa" },
    { id: "yang-list", from: "yang", to: "list", color: "#34d399" },
    { id: "container-redis", from: "container", to: "redis", color: "#fb923c" },
    { id: "list-redis", from: "list", to: "redis", color: "#fb923c" },
    { id: "redis-key", from: "redis", to: "key", color: "#fbbf24" },
    { id: "redis-fields", from: "redis", to: "fields", color: "#f472b6" },
    { id: "fields-cvl", from: "fields", to: "cvl", color: "#60a5fa" },
  ],
  flows: [
    {
      id: "map",
      name: "🗺️ Map VLAN model to redis",
      command: "VLAN|Vlan100 → vlanid 100, members []",
      steps: [
        { node: "yang", paths: ["yang-container", "yang-list"], text: "sonic-vlan.yang defines the schema: container VLAN (table name) contains list VLAN_LIST keyed by 'name' with leaves vlanid, members." },
        { node: "container", paths: ["container-redis"], text: "container VLAN → CONFIG_DB table 'VLAN'. The container name IS the redis table." },
        { node: "list", paths: ["list-redis"], text: "list VLAN_LIST key 'name' → redis key after the '|' separator. name='Vlan100' becomes key 'VLAN|Vlan100'." },
        { node: "key", paths: ["redis-key"], text: "Redis key structure: TABLE|key-value. For VLAN_LIST name=Vlan100, key is VLAN|Vlan100." },
        { node: "fields", paths: ["redis-fields"], text: "Leaves vlanid, members become redis hash fields. HGETALL VLAN|Vlan100 → vlanid:100, members:..." },
        { node: "cvl", paths: ["fields-cvl"], text: "CVL loads the compiled .yin schema and validates every field type, range, pattern before redis write." },
      ],
    },
    {
      id: "mismatch",
      name: "❌ Key mismatch",
      command: "POST VLAN|Vlan200 but payload name='Vlan100'",
      steps: [
        { node: "yang", paths: ["yang-list"], text: "Client sends key VLAN|Vlan200 but JSON name field = 'Vlan100'. The list key is 'name'." },
        { node: "list", paths: [], text: "CVL compares the URL key component (Vlan200) with the payload name field (Vlan100) — MISMATCH." },
        { node: "cvl", paths: [], text: "CVL returns CVL_SYNTAX_ERROR: Key in URI and payload do not match. Write rejected." },
      ],
    },
    {
      id: "leafref",
      name: "🔗 leafref to PORT",
      command: "VLAN_MEMBER references sonic-port.yang PORT_LIST",
      steps: [
        { node: "yang", paths: ["yang-list"], text: "VLAN_MEMBER_LIST has leaf 'port' with type leafref path='/sonic-port/PORT/PORT_LIST/name'." },
        { node: "list", paths: ["list-redis"], text: "Creating VLAN_MEMBER|Vlan100|Ethernet0 requires port=Ethernet0 to exist in PORT table." },
        { node: "redis", paths: ["redis-key"], text: "CVL performs a redis GET on PORT|Ethernet0 to validate the dependency." },
        { node: "key", paths: ["redis-fields"], text: "If PORT|Ethernet0 exists, the leafref passes. If missing, CVL_SEMANTIC_DEPENDENT_DATA_MISSING." },
        { node: "fields", paths: ["fields-cvl"], text: "Cross-table dependencies are THE reason for SONiC YANG — plain redis has no schema enforcement." },
        { node: "cvl", paths: [], text: "All leafrefs, must/when constraints compile into CVL validation paths at build time." },
      ],
    },
  ],
};

const NAV = [
  { id: "concept", label: "What SONiC YANG Is" },
  { id: "convention", label: "The Structural Convention ⭐" },
  { id: "port", label: "sonic-port.yang — First Model" },
  { id: "vlan", label: "sonic-vlan.yang — Lists & Leafrefs" },
  { id: "interface", label: "sonic-interface.yang — Multi-key Lists" },
  { id: "ntp-system", label: "sonic-ntp / sonic-system — Global Tables" },
  { id: "leafref-must", label: "leafref + must — The Validation Magic" },
  { id: "schema-files", label: "Compiled Schemas & Annotations" },
  { id: "debugging", label: "Debugging — pyang & Finding Files" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicYangPage() {
  return (
    <TopicShell
      icon="🟦"
      title="SONiC YANG — Models That Mirror Redis"
      gradientWord="YANG"
      subtitle="SONiC YANG is the NATIVE schema — a perfect 1:1 mirror of CONFIG_DB structure. Every container is a table, every list key becomes a redis key component, every leaf is a hash field. This is the structural contract that CVL enforces and that the Transformer translates OpenConfig into."
      nav={NAV}
      badges={["1:1 CONFIG_DB mirror", "leafref = dependency", "CVL compile target", "🗺️ Table mapping", "pyang validation"]}
      next={{ icon: "🛡️", label: "CVL Engine", href: "/sonic/cvl" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="concept" number="01" title="What SONiC YANG Is — The Problem It Solves">
        <P>
          Redis has NO schema. Anyone can write arbitrary keys and fields — there&apos;s nothing stopping a
          typo <IC>VLAN|Vlan100 vlanid:5000</IC> (vlanid only goes to 4094), or a dangling reference{" "}
          <IC>VLAN_MEMBER|Vlan100|Ethernet999</IC> (port doesn&apos;t exist). The result? Inconsistent
          state, cryptic failures in orchagent, hours of debugging.
        </P>
        <P>
          <strong>SONiC YANG is the schema</strong> — a set of YANG models that define every CONFIG_DB
          table, key structure, field types, ranges, patterns, and cross-table dependencies. It is NOT a
          translation layer — it IS the native schema, mirroring redis 1:1. Every container = a table,
          every list key = a redis key component, every leaf = a hash field.
        </P>
        <CodeBlock
          title="why_sonic_yang_exists.txt"
          runnable={false}
          code={`BEFORE SONiC YANG (legacy SONiC):
  ✗ no schema enforcement — apps wrote arbitrary keys
  ✗ validation scattered across 10+ modules (portsyncd, vlanmgr, intfmgr)
  ✗ every new feature = new validation code + tests
  ✗ no machine-readable contract between CONFIG_DB and apps

AFTER SONiC YANG:
  ✓ single source of truth: sonic-*.yang files
  ✓ CVL compiles them → enforces every write
  ✓ cross-table constraints (leafref, must) compile into validation paths
  ✓ new feature = YANG + CVL schema, no hand-written validation plumbing
  ✓ machine-readable for codegen (Transformer, REST server)`}
        />
        <Callout type="analogy">
          Think of SONiC YANG as the database schema DDL for redis. Just like Postgres has CREATE TABLE
          with column types and foreign keys, SONiC YANG defines the table structure and dependencies —
          but the enforcement is in CVL, not redis itself.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="convention" number="02" title="The Structural Convention — THE Key Insight ⭐">
        <P>
          The mapping is mechanical, once you see it. Every SONiC YANG module follows this exact structure:
        </P>
        <CodeBlock
          title="sonic_yang_structure.yang"
          runnable={false}
          code={`module sonic-vlan {
  namespace "http://github.com/Azure/sonic-vlan";
  prefix svlan;

  // top container: module name
  container sonic-vlan {

    // inner container: TABLE NAME (appears in CONFIG_DB)
    container VLAN {
      description "VLAN table in CONFIG_DB";

      // list: the rows/keys
      list VLAN_LIST {
        key "name";  // redis key = VLAN|<name>

        // leaves: hash fields
        leaf name {
          type string { pattern 'Vlan(409[0-4]|40[0-8][0-9]|[1-3][0-9]{3}|[1-9][0-9]{0,2})'; }
        }
        leaf vlanid {
          type uint16 { range 1..4094; }
        }
        leaf-list members {
          type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; }
        }
      }
    }
  }
}`}
        />
        <P>The mechanical rule:</P>
        <Table
          head={["YANG element", "CONFIG_DB mapping", "Example"]}
          rows={[
            [
              <IC key="1">container VLAN</IC>,
              "Redis table name",
              <IC key="2">VLAN</IC>,
            ],
            [
              <IC key="3">list VLAN_LIST key &quot;name&quot;</IC>,
              "Key structure TABLE|key-value",
              <IC key="4">VLAN|Vlan100</IC>,
            ],
            [
              <IC key="5">leaf vlanid</IC>,
              "Hash field name",
              <IC key="6">HGET VLAN|Vlan100 vlanid → 100</IC>,
            ],
            [
              <IC key="7">leaf-list members</IC>,
              "Multi-value field (joined by comma)",
              <IC key="8">members → Ethernet0,Ethernet4</IC>,
            ],
          ]}
        />
        <Callout type="behind">
          ⚙️ Why the double nesting (sonic-vlan container → VLAN container)? The outer container is the
          YANG module namespace (prevents name collisions across modules); the INNER container is the
          CONFIG_DB table. Only the inner container name matters for redis mapping.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="port" number="03" title="sonic-port.yang — The Simplest Model">
        <P>
          Let&apos;s walk the FIRST model everyone encounters: <IC>sonic-port.yang</IC>, which defines
          the <IC>PORT</IC> table.
        </P>
        <CodeBlock
          title="sonic-port.yang (excerpt)"
          runnable={false}
          code={`container sonic-port {
  container PORT {
    list PORT_LIST {
      key "name";
      leaf name        { type string; }  // Ethernet0, Ethernet4, etc
      leaf alias       { type string; }  // etp1, etp2 (front-panel label)
      leaf lanes       { type string; }  // hardware lane IDs
      leaf speed       { type uint32; }  // 10000, 25000, 40000, 100000 (Mbps)
      leaf mtu         { type uint16 { range 1..9216; } }
      leaf admin_status { type stypes:admin_status; }  // up / down
      leaf index       { type uint16; }  // ifindex
    }
  }
}`}
        />
        <P>The redis mapping:</P>
        <CodeBlock
          title="redis-cli"
          code={`redis-cli -n 4
CONFIG_DB[4]> HGETALL PORT|Ethernet0`}
          output={`1) "alias"
2) "etp1"
3) "lanes"
4) "0,1,2,3"
5) "speed"
6) "100000"
7) "mtu"
8) "9100"
9) "admin_status"
10) "up"
11) "index"
12) "1"`}
        />
        <P>
          Notice: the list key <IC>name</IC> = <IC>Ethernet0</IC> becomes the redis key component after
          the pipe: <IC>PORT|Ethernet0</IC>. The leaves become hash fields. This is the contract.
        </P>
        <Callout type="tip">
          💡 Interview insight: &quot;SONiC YANG is the authoritative schema for CONFIG_DB. The container
          name maps to the redis table name, list keys become redis key components after &apos;|&apos;,
          and leaves are hash fields. CVL compiles these models to enforce the schema at write time.&quot;
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="vlan" number="04" title="sonic-vlan.yang — Lists with leafref">
        <P>
          VLANs demonstrate two patterns: <strong>pattern-constrained keys</strong> and{" "}
          <strong>leafref dependencies</strong>.
        </P>
        <CodeBlock
          title="sonic-vlan.yang (VLAN table)"
          runnable={false}
          code={`container VLAN {
  list VLAN_LIST {
    key "name";
    leaf name {
      type string {
        pattern 'Vlan(409[0-4]|40[0-8][0-9]|[1-3][0-9]{3}|[1-9][0-9]{0,2})';
      }
      // regex enforces Vlan1 to Vlan4094
    }
    leaf vlanid {
      type uint16 { range "1..4094"; }
      mandatory true;
    }
    leaf-list members {
      type leafref {
        path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name";
      }
      // members must reference existing ports
    }
  }
}

container VLAN_MEMBER {
  list VLAN_MEMBER_LIST {
    key "name port";  // compound key
    leaf name {
      type leafref { path "/svlan:sonic-vlan/svlan:VLAN/svlan:VLAN_LIST/svlan:name"; }
    }
    leaf port {
      type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; }
    }
    leaf tagging_mode {
      type stypes:vlan_tagging_mode;  // enum: tagged | untagged
      mandatory true;
    }
  }
}`}
        />
        <P>Redis representation:</P>
        <CodeBlock
          title="redis-cli"
          code={`HGETALL VLAN|Vlan100
HGETALL VLAN_MEMBER|Vlan100|Ethernet0`}
          output={`# VLAN|Vlan100
1) "vlanid"
2) "100"

# VLAN_MEMBER|Vlan100|Ethernet0
1) "tagging_mode"
2) "untagged"`}
        />
        <Callout type="behind">
          ⚙️ Notice the <IC>VLAN_MEMBER</IC> key: <IC>key &quot;name port&quot;</IC> becomes redis key{" "}
          <IC>VLAN_MEMBER|Vlan100|Ethernet0</IC> — multi-component keys are joined by pipes. CVL verifies
          BOTH leafrefs: Vlan100 exists in VLAN, Ethernet0 exists in PORT.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="interface" number="05" title="sonic-interface.yang — Multi-key IP Lists">
        <P>
          Interface IP addresses use a TWO-key list: interface name + IP prefix. This creates keys like{" "}
          <IC>INTERFACE|Ethernet0|10.0.0.1/31</IC>.
        </P>
        <CodeBlock
          title="sonic-interface.yang (excerpt)"
          runnable={false}
          code={`container INTERFACE {
  list INTERFACE_LIST {
    key "name";  // interface itself
    leaf name {
      type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; }
    }
  }
}

container INTERFACE_IPADDR {
  list INTERFACE_IPADDR_LIST {
    key "name ip-prefix";  // compound: intf + IP
    leaf name {
      type leafref { path "../../INTERFACE/INTERFACE_LIST/name"; }
    }
    leaf ip-prefix {
      type inet:ip-prefix;  // 10.0.0.1/31, 2001:db8::1/64
    }
    leaf scope {
      type enumeration {
        enum global;
        enum local;
      }
    }
    leaf family {
      type stypes:ip_family;  // IPv4 | IPv6
    }
  }
}`}
        />
        <CodeBlock
          title="redis-cli"
          code={`KEYS INTERFACE|Ethernet0*`}
          output={`1) "INTERFACE|Ethernet0"
2) "INTERFACE|Ethernet0|10.0.0.1/31"
3) "INTERFACE|Ethernet0|192.168.1.1/24"`}
        />
        <CodeBlock
          title="redis-cli"
          code={`HGETALL INTERFACE|Ethernet0|10.0.0.1/31`}
          output={`1) "scope"
2) "global"
3) "family"
4) "IPv4"`}
        />
        <P>
          The pattern: <IC>INTERFACE|Ethernet0</IC> (the interface itself, usually empty hash) +{" "}
          <IC>INTERFACE|Ethernet0|&lt;ip-prefix&gt;</IC> (each IP attached to it).
        </P>
      </Section>

      {/* 06 */}
      <Section id="ntp-system" number="06" title="sonic-ntp / sonic-system — Global Singleton Tables">
        <P>
          Not every table has a meaningful key. For global config (like NTP or system hostname), SONiC
          uses a singleton pattern: a list with ONE key <IC>localhost</IC> or a global container with
          leaves.
        </P>
        <CodeBlock
          title="sonic-ntp.yang"
          runnable={false}
          code={`container NTP {
  container NTP_SERVER {
    list NTP_SERVER_LIST {
      key "server_address";
      leaf server_address { type inet:host; }
    }
  }
}

container NTP_GLOBAL {
  list NTP_GLOBAL_LIST {
    key "vrf";
    leaf vrf       { type string; default "default"; }
    leaf src_intf  { type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; } }
  }
}`}
        />
        <CodeBlock
          title="redis-cli"
          code={`KEYS NTP*`}
          output={`1) "NTP_SERVER|10.1.1.1"
2) "NTP_SERVER|192.168.0.1"
3) "NTP|default"`}
        />
        <CodeBlock
          title="redis-cli"
          code={`HGETALL NTP|default`}
          output={`1) "src_intf"
2) "Management0"`}
        />
        <Callout type="note">
          📌 The <IC>NTP_SERVER</IC> table keys by server IP (multiple servers). The <IC>NTP</IC> (or
          NTP_GLOBAL) table is keyed by VRF (usually just &quot;default&quot;) and holds global settings
          like source interface.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="leafref-must" number="07" title="leafref + must — The Validation Magic">
        <P>
          SONiC YANG&apos;s power comes from YANG&apos;s built-in constraint types. Two critical ones:
        </P>
        <CodeBlock
          title="leafref_example.yang"
          runnable={false}
          code={`// 1. leafref: field must reference another table's key
leaf port {
  type leafref {
    path "/sonic-port:sonic-port/sonic-port:PORT/sonic-port:PORT_LIST/sonic-port:name";
  }
}
// When CVL sees this, it performs: EXISTS(PORT|<port-value>)

// 2. must: XPath constraint
must "current()/../tagging_mode = 'tagged' or count(../VLAN_MEMBER_LIST[tagging_mode='untagged']) <= 1" {
  error-message "Only one untagged VLAN per port allowed";
}
// CVL evaluates the XPath expression against the full tree`}
        />
        <P>Real example from <IC>sonic-vlan.yang</IC>:</P>
        <CodeBlock
          title="sonic-vlan.yang must constraint"
          runnable={false}
          code={`leaf-list members {
  type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; }
}

must "count(current()/../VLAN_MEMBER_LIST[name=current()/../name]) = count(current())" {
  error-message "VLAN members count mismatch between VLAN and VLAN_MEMBER tables";
}`}
        />
        <Callout type="behind">
          ⚙️ CVL compiles these constraints into validation functions. When you try to create{" "}
          <IC>VLAN_MEMBER|Vlan100|Ethernet999</IC>, CVL:
          <br />
          1. Reads the leafref path → queries <IC>EXISTS PORT|Ethernet999</IC>
          <br />
          2. If missing → returns <IC>CVL_SEMANTIC_DEPENDENT_DATA_MISSING</IC>
          <br />
          3. Rejects the write BEFORE it hits redis.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="schema-files" number="08" title="Compiled Schemas & Annotations">
        <P>Where the models live:</P>
        <CodeBlock
          title="sonic_yang_locations.txt"
          runnable={false}
          code={`# Source models (build-time, in sonic-buildimage repo):
sonic-buildimage/src/sonic-yang-models/yang-models/
  sonic-port.yang
  sonic-vlan.yang
  sonic-interface.yang
  sonic-ntp.yang
  sonic-device-metadata.yang
  sonic-types.yang  (common types, enums)
  sonic-extension.yang  (SONiC-specific annotations)

# Management Framework models (sonic-mgmt-common repo):
sonic-mgmt-common/models/yang/sonic/
  sonic-*.yang (copy + additional models for REST/gNMI)

# Compiled schemas (inside mgmt-framework container at runtime):
/usr/models/yang/sonic/*.yang   (source)
/usr/sbin/schema/*.yin           (CVL-compiled, YIN format)
  - CVL loads these at startup
  - pyang -f yin sonic-vlan.yang → sonic-vlan.yin`}
        />
        <P>
          The <IC>.yin</IC> files are XML representations of YANG — CVL uses them because libyang (the
          validation library) prefers YIN for fast parsing.
        </P>
        <Callout type="tip">
          💡 To verify a model is loaded: <IC>docker exec mgmt-framework ls /usr/models/yang/sonic</IC>{" "}
          and look for your YANG file. If it&apos;s missing, the REST API won&apos;t have that schema.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging — pyang & Finding Files">
        <CodeBlock
          title="validating a YANG model with pyang"
          code={`# install pyang
pip3 install pyang

# validate syntax
pyang sonic-vlan.yang

# generate tree view (THE most useful debug view)
pyang -f tree sonic-vlan.yang`}
          output={`module: sonic-vlan
  +--rw sonic-vlan
     +--rw VLAN
     |  +--rw VLAN_LIST* [name]
     |     +--rw name       string
     |     +--rw vlanid?    uint16
     |     +--rw members*   leafref
     +--rw VLAN_MEMBER
        +--rw VLAN_MEMBER_LIST* [name port]
           +--rw name            leafref
           +--rw port            leafref
           +--rw tagging_mode    vlan_tagging_mode`}
        />
        <CodeBlock
          title="find schema files in running container"
          code={`docker exec mgmt-framework ls -lh /usr/models/yang/sonic/ | grep vlan
docker exec mgmt-framework cat /usr/models/yang/sonic/sonic-vlan.yang | head -20`}
          output={`-rw-r--r-- 1 root root 4.2K Mar 15 10:23 sonic-vlan.yang

module sonic-vlan {
  namespace "http://github.com/Azure/sonic-vlan";
  prefix svlan;
  import sonic-types {
    prefix stypes;
  }
  import sonic-port {
    prefix sport;
  }
  ...`}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: editing the YANG file locally but not rebuilding the mgmt-framework container.
          YANG changes require container rebuild (or at minimum, recopying .yang files + restarting CVL).
          Always verify the container has the new file.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise — Predict the Redis Keys">
        <P>Given this YANG snippet, predict the CONFIG_DB keys and hash structure:</P>
        <CodeBlock
          title="sonic-acl.yang (simplified)"
          runnable={false}
          code={`container ACL_TABLE {
  list ACL_TABLE_LIST {
    key "name";
    leaf name    { type string; }
    leaf type    { type stypes:acl_table_type; }  // L3 | L3V6 | MIRROR
    leaf policy_desc { type string; }
    leaf-list ports {
      type leafref { path "/sport:sonic-port/sport:PORT/sport:PORT_LIST/sport:name"; }
    }
  }
}

container ACL_RULE {
  list ACL_RULE_LIST {
    key "table_name rule_name";
    leaf table_name { type leafref { path "../../ACL_TABLE/ACL_TABLE_LIST/name"; } }
    leaf rule_name  { type string; }
    leaf priority   { type uint32 { range 1..65535; } }
    leaf PACKET_ACTION { type stypes:packet_action; }  // DROP | FORWARD | REDIRECT
  }
}`}
        />
        <P>Exercise steps:</P>
        <CodeBlock
          title="lab_steps.txt"
          runnable={false}
          code={`1. What is the redis key for ACL table named "SSH_ONLY"?
2. What is the redis key for rule "RULE_1" in table "SSH_ONLY"?
3. What hash fields exist for ACL_RULE|SSH_ONLY|RULE_1?
4. If you create an ACL_RULE with table_name="MISSING_TABLE", what CVL error?
5. If you create an ACL_TABLE with ports=["Ethernet999"], what CVL error?`}
        />
        <P>Expected answers:</P>
        <CodeBlock
          title="lab_answers.txt"
          runnable={false}
          code={`1. ACL_TABLE|SSH_ONLY
   (container=ACL_TABLE, list key name="SSH_ONLY" → TABLE|key)

2. ACL_RULE|SSH_ONLY|RULE_1
   (compound key "table_name rule_name" → TABLE|key1|key2)

3. HGETALL ACL_RULE|SSH_ONLY|RULE_1 → fields: priority, PACKET_ACTION
   (the key components table_name/rule_name are NOT stored as fields, they're in the key)

4. CVL_SEMANTIC_DEPENDENT_DATA_MISSING
   (leafref to ACL_TABLE/ACL_TABLE_LIST/name fails, table doesn't exist)

5. CVL_SEMANTIC_DEPENDENT_DATA_MISSING
   (leaf-list ports has leafref to PORT table, Ethernet999 doesn't exist)`}
        />
        <P>Verify in a real SONiC instance:</P>
        <CodeBlock
          title="redis-cli verification"
          code={`redis-cli -n 4
KEYS ACL_TABLE|*
HGETALL ACL_TABLE|SSH_ONLY
KEYS ACL_RULE|SSH_ONLY|*`}
          output={`1) "ACL_TABLE|SSH_ONLY"
1) "type"
2) "L3"
3) "policy_desc"
4) "Allow SSH only"
5) "ports"
6) "Ethernet0"

1) "ACL_RULE|SSH_ONLY|RULE_1"
2) "ACL_RULE|SSH_ONLY|RULE_2"`}
        />
      </Section>

      {/* 11 */}
      <Section id="interview" number="11" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is SONiC YANG and why does SONiC need it?",
              "SONiC YANG is the native schema for CONFIG_DB. Redis itself has no schema enforcement, so SONiC YANG models define table structure, key formats, field types, ranges, and cross-table dependencies. CVL compiles these models to validate every CONFIG_DB write before it commits.",
            ],
            [
              "How does a YANG list map to a redis key?",
              "The container name becomes the redis table name. The list key (or compound keys) become the redis key components after the pipe separator. Example: container VLAN, list key 'name' = Vlan100 → redis key VLAN|Vlan100. Multi-key lists join with pipes: VLAN_MEMBER key 'name port' → VLAN_MEMBER|Vlan100|Ethernet0.",
            ],
            [
              "What is a leafref and how does CVL use it?",
              "A leafref is a YANG constraint that makes a leaf reference another table's key, like a foreign key. Example: VLAN_MEMBER port field has a leafref to PORT table. CVL enforces this by querying redis: if PORT|Ethernet0 doesn't exist, CVL returns CVL_SEMANTIC_DEPENDENT_DATA_MISSING and rejects the write.",
            ],
            [
              "Where are SONiC YANG models stored at build time vs runtime?",
              "Build: sonic-buildimage/src/sonic-yang-models/yang-models/ (platform copy) and sonic-mgmt-common/models/yang/sonic/ (mgmt framework copy). Runtime: inside the mgmt-framework container at /usr/models/yang/sonic/*.yang (source) and /usr/sbin/schema/*.yin (CVL-compiled).",
            ],
            [
              "What is the difference between sonic-vlan.yang and openconfig-vlan.yang?",
              "sonic-vlan.yang is the native SONiC schema that mirrors CONFIG_DB structure 1:1. openconfig-vlan.yang is the industry-standard model exposed via REST/gNMI. The Transformer translates between them using annotations and callbacks. CVL only validates against SONiC YANG, never OpenConfig.",
            ],
            [
              "How do you validate a YANG model before deploying it?",
              "Use pyang: pyang sonic-vlan.yang checks syntax. pyang -f tree sonic-vlan.yang shows the tree structure. Deploy to a test SONiC instance, verify the file exists in the container (docker exec mgmt-framework ls /usr/models/yang/sonic), and test a write via RESTCONF to see if CVL loads the schema.",
            ],
            [
              "What happens if you delete a VLAN that has members?",
              "CVL checks dependency constraints. If VLAN_MEMBER entries reference VLAN|Vlan100, CVL will reject the delete with CVL_SEMANTIC_ERROR or CVL_SEMANTIC_DEPENDENT_DATA_MISSING (reverse dependency). You must delete VLAN_MEMBER entries first, then delete the VLAN.",
            ],
            [
              "What is the 'must' statement in SONiC YANG?",
              "The 'must' statement is an XPath constraint evaluated by CVL. Example: must 'vlanid >= 1 and vlanid <= 4094'. CVL evaluates the expression against the candidate data tree; if false, it rejects the write with CVL_SEMANTIC_ERROR and the custom error-message.",
            ],
            [
              "Why are some SONiC YANG models compiled to .yin?",
              "CVL uses libyang for validation, which prefers YIN (XML representation of YANG) for faster parsing. At build time, pyang -f yin converts .yang to .yin. Both formats represent the same schema; .yin is just the compiled form.",
            ],
            [
              "How would you debug a CVL validation failure traced to a YANG constraint?",
              "1. Read the CVL error message for the field and constraint. 2. Find the YANG model: docker exec mgmt-framework cat /usr/models/yang/sonic/sonic-<table>.yang. 3. Locate the leaf definition, check type, range, pattern, leafref, must. 4. Verify the data you're writing: is it out of range? Does the referenced key exist? 5. Use pyang -f tree to visualize the model structure.",
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["SONiC YANG purpose", "Native schema for CONFIG_DB, 1:1 mirror, CVL compile target"],
            ["Mapping rule", "container=table · list key=redis key component · leaf=hash field"],
            ["Key structure", "TABLE|key1|key2 (pipes join compound keys)"],
            ["leafref", "Foreign key constraint, CVL queries redis to validate existence"],
            ["must", "XPath constraint, CVL evaluates expression, rejects if false"],
            ["Build location", "sonic-buildimage/src/sonic-yang-models/yang-models/"],
            ["Runtime location", "/usr/models/yang/sonic/*.yang (src) /usr/sbin/schema/*.yin (compiled)"],
            ["Validation tool", "pyang -f tree sonic-vlan.yang (shows structure)"],
            ["CVL dependency error", "CVL_SEMANTIC_DEPENDENT_DATA_MISSING (leafref target missing)"],
            ["Example: VLAN key", "container VLAN, list key 'name' Vlan100 → VLAN|Vlan100"],
            ["Example: VLAN_MEMBER", "key 'name port' → VLAN_MEMBER|Vlan100|Ethernet0"],
            ["Common types", "uint16, string, inet:ip-prefix, leafref, enum"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
