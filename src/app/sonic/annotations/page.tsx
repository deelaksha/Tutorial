"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "How the xlate engine consults annotations",
  nodes: [
    { id: "uri", icon: "🧭", label: "OC URI", sub: "/system/ntp/servers", x: 6, y: 50, color: "#22d3ee" },
    { id: "engine", icon: "🧮", label: "xlate engine", sub: "needs mapping", x: 24, y: 50, color: "#fb923c" },
    { id: "annotfile", icon: "📝", label: "*-annot.yang", sub: "deviations", x: 44, y: 20, color: "#a78bfa" },
    { id: "tablename", icon: "🏷️", label: "table-name", sub: "NTP_SERVER", x: 64, y: 14, color: "#34d399" },
    { id: "keyxfmr", icon: "🔑", label: "key-transformer", sub: "callback name", x: 64, y: 42, color: "#f472b6" },
    { id: "fieldname", icon: "🏷️", label: "field-name", sub: "redis key", x: 64, y: 68, color: "#fbbf24" },
    { id: "subtree", icon: "🧩", label: "subtree-xfmr", sub: "manual mode", x: 44, y: 82, color: "#60a5fa" },
    { id: "dbmap", icon: "🗺️", label: "DB map", sub: "ready for redis", x: 86, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "uri-engine", from: "uri", to: "engine", color: "#fb923c" },
    { id: "engine-annot", from: "engine", to: "annotfile", color: "#a78bfa" },
    { id: "annot-table", from: "annotfile", to: "tablename", color: "#34d399" },
    { id: "annot-key", from: "annotfile", to: "keyxfmr", color: "#f472b6" },
    { id: "annot-field", from: "annotfile", to: "fieldname", color: "#fbbf24" },
    { id: "annot-subtree", from: "annotfile", to: "subtree", color: "#60a5fa" },
    { id: "table-dbmap", from: "tablename", to: "dbmap", color: "#34d399" },
    { id: "key-dbmap", from: "keyxfmr", to: "dbmap", color: "#34d399" },
    { id: "field-dbmap", from: "fieldname", to: "dbmap", color: "#34d399" },
    { id: "subtree-dbmap", from: "subtree", to: "dbmap", color: "#60a5fa" },
    { id: "engine-error", from: "engine", to: "engine", bend: -30, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "ntp-patch",
      name: "🟢 NTP server PATCH",
      command: "PATCH /openconfig/system/ntp/servers/server[address=10.1.1.1]",
      steps: [
        { node: "uri", paths: ["uri-engine"], text: "REST server receives PATCH to OC NTP URI. Path: /openconfig-system:system/ntp/servers/server[address='10.1.1.1']/config" },
        { node: "engine", paths: ["engine-annot"], text: "xlate engine sees this path, needs to learn: which Redis table? what key format? Consults annotation registry." },
        { node: "annotfile", paths: ["annot-table", "annot-key", "annot-field"], text: "openconfig-system-annot.yang loaded. Finds deviation for /system/ntp/servers/server with sonic-ext metadata." },
        { node: "tablename", paths: ["table-dbmap"], text: "Annotation declares: sonic-ext:table-name 'NTP_SERVER'; — engine knows the CONFIG_DB table now." },
        { node: "keyxfmr", paths: ["key-dbmap"], text: "sonic-ext:key-transformer 'ntp_server_key_xfmr'; — calls Go function to build Redis key from address leaf." },
        { node: "fieldname", paths: ["field-dbmap"], text: "Child leaf /config/address → sonic-ext:field-name 'NULL'; (key-only table pattern). Other leaves map to field names." },
        { node: "dbmap", paths: [], text: "Engine builds complete dbmap: {NTP_SERVER|10.1.1.1: {associaton-type: server, iburst: enable}}. Ready for CVL + SET." },
      ],
    },
    {
      id: "missing",
      name: "🔴 Missing annotation",
      command: "PATCH /openconfig/some-new-feature — no annotation exists",
      steps: [
        { node: "uri", paths: ["uri-engine"], text: "REST request arrives for a new OpenConfig module that SONiC supports but annotation is missing." },
        { node: "engine", paths: ["engine-annot"], text: "xlate engine looks up the YANG path in annotation registry — no deviation found for this path." },
        { node: "annotfile", paths: ["engine-error"], text: "No table-name annotation found. Engine cannot proceed without knowing the Redis table mapping." },
        { node: "engine", paths: ["engine-error"], text: "xlate returns error: 'No DB mapping found for path /openconfig-foo:...'. HTTP 500 back to client." },
        { node: "engine", paths: [], text: "Fix: developer must write a deviation in a *-annot.yang file, register table-name + transformers, rebuild translib." },
      ],
    },
    {
      id: "subtree",
      name: "🔵 Subtree takeover",
      command: "GET /openconfig/interfaces/interface[name=Ethernet0]/state/counters",
      steps: [
        { node: "uri", paths: ["uri-engine"], text: "GET request for interface state counters. Path: /oc-if:interfaces/interface[name='Ethernet0']/state/counters" },
        { node: "engine", paths: ["engine-annot"], text: "xlate engine consults openconfig-interfaces-annot.yang for the /state/counters container annotation." },
        { node: "annotfile", paths: ["annot-subtree"], text: "Annotation declares: sonic-ext:subtree-transformer 'intf_state_counters_xfmr'; — means full subtree handled by one Go function." },
        { node: "subtree", paths: ["subtree-dbmap"], text: "Engine skips leaf-by-leaf mapping. Calls intf_state_counters_xfmr(GET, /counters) in transformers/intf_xfmr.go." },
        { node: "dbmap", paths: [], text: "Transformer function queries COUNTERS_DB directly (Ethernet0 key), builds entire counters subtree, returns structured data." },
        { node: "subtree", paths: [], text: "Common for state data (read-only, comes from non-CONFIG_DB, needs custom logic). annotation + subtree-xfmr = full control." },
      ],
    },
  ],
};

const NAV = [
  { id: "problem", label: "The Wiring Problem" },
  { id: "what-are", label: "What Are Annotation Files?" },
  { id: "location", label: "Where They Live" },
  { id: "anatomy", label: "Anatomy of an Annotation File ⭐" },
  { id: "ntp-full", label: "Full Example: NTP Annotations ⭐" },
  { id: "catalog", label: "Every sonic-ext Annotation ⭐" },
  { id: "loading", label: "How Annotations Are Loaded" },
  { id: "pairing", label: "Annotation → Go Callback Pairing" },
  { id: "debugging", label: "Debugging Annotation Issues" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicAnnotationsPage() {
  return (
    <TopicShell
      icon="📝"
      title="Annotation Files — Wiring OpenConfig to Redis"
      gradientWord="Annotation"
      subtitle="The transformer engine is generic, but it must learn WHERE each OpenConfig node lives in Redis. Annotation files are that wiring — written as standard YANG deviation statements with sonic-extensions, they map OC paths to CONFIG_DB tables, field names, and custom transformers."
      nav={NAV}
      badges={["📂 Real file paths", "🧩 Full NTP example", "🔗 sonic-ext catalog", "🐛 Debug tactics"]}
      next={{ icon: "📚", label: "Translib", href: "/sonic/translib" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="problem" number="01" title="The Wiring Problem">
        <P>
          SONiC&apos;s management framework is built on a powerful idea: <strong>transformer functions</strong> translate
          between OpenConfig YANG models (the standardized interface) and Redis CONFIG_DB entries (the SONiC-specific
          backend). The transformer code itself is generic — it walks the YANG tree, calls registered callbacks.
        </P>
        <P>
          But here&apos;s the gap: <em>how does the transformer know</em> that <IC>/openconfig-system:system/ntp/servers/server</IC>{" "}
          maps to the <IC>NTP_SERVER</IC> Redis table? Or that the <IC>address</IC> leaf is the key, not a field?
        </P>
        <CodeBlock
          title="the_wiring_gap.txt"
          runnable={false}
          code={`OpenConfig YANG (standard)            Redis CONFIG_DB (SONiC-specific)
────────────────────────────          ────────────────────────────────
/system/ntp/servers/server            NTP_SERVER|10.1.1.1
  [address=10.1.1.1]
  config/
    address   "10.1.1.1"        ┐
    association-type "SERVER"  ├──→   {association-type: server,
    iburst   true               │      iburst: enable}
    ...                         ┘

WHO makes this connection? → ANNOTATION FILES 📝`}
        />
        <Callout type="analogy">
          Think of annotations as the &quot;Rosetta Stone&quot; between two languages. OpenConfig speaks in
          <IC>/system/ntp/servers</IC>, Redis speaks in <IC>NTP_SERVER|key</IC>. Annotations are the bilingual
          dictionary that lets transformers translate fluently.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-are" number="02" title="What Are Annotation Files?">
        <P>
          Annotation files are <strong>YANG deviation modules</strong> that augment standard OpenConfig models with
          SONiC-specific metadata. They use the <IC>sonic-extension</IC> YANG module to declare:
        </P>
        <CodeBlock
          title="what_annotations_declare.txt"
          runnable={false}
          code={`For each OpenConfig path:
  ✓ Which Redis table stores this data (sonic-ext:table-name)
  ✓ How to build the Redis key (sonic-ext:key-transformer callback)
  ✓ Which Redis field each leaf maps to (sonic-ext:field-name)
  ✓ Optional: custom transformer for a leaf (sonic-ext:field-transformer)
  ✓ Optional: take over an entire subtree (sonic-ext:subtree-transformer)
  ✓ Which database (CONFIG_DB, APPL_DB, STATE_DB, COUNTERS_DB, ...)

Format: standard YANG "deviation" statements
Location: sonic-mgmt-common/models/yang/annotations/
Naming: <module>-annot.yang (e.g., openconfig-system-annot.yang)`}
        />
        <P>
          The beauty: deviations are a standard YANG mechanism (RFC 7950 §7.20.3). SONiC didn&apos;t invent a custom
          format — it reused YANG&apos;s built-in feature for &quot;this implementation differs from the standard&quot;.
        </P>
      </Section>

      {/* 03 */}
      <Section id="location" number="03" title="Where They Live">
        <CodeBlock
          title="find_annotations.sh"
          code={`ls sonic-mgmt-common/models/yang/annotations/`}
          output={`openconfig-acl-annot.yang
openconfig-interfaces-annot.yang
openconfig-network-instance-annot.yang
openconfig-system-annot.yang
openconfig-platform-annot.yang
openconfig-qos-annot.yang
sonic-vlan-annot.yang
... (20+ files, one per major OC module or SONiC native model)`}
        />
        <P>
          Each file annotates one (or a related group of) OpenConfig module. For example:
        </P>
        <Table
          head={["Annotation file", "Annotates which OC module(s)", "Covers features"]}
          rows={[
            ["openconfig-system-annot.yang", "openconfig-system", "NTP, syslog, hostname, DNS, AAA"],
            ["openconfig-interfaces-annot.yang", "openconfig-interfaces", "Ethernet, PortChannel, VLAN, enabled/mtu/speed"],
            ["openconfig-network-instance-annot.yang", "openconfig-network-instance", "VRF, BGP, OSPF routing"],
            ["openconfig-acl-annot.yang", "openconfig-acl", "ACL rules, binding to interfaces"],
            ["openconfig-platform-annot.yang", "openconfig-platform", "Components, transceivers, sensors (state data)"],
          ]}
        />
        <Callout type="note">
          Some SONiC native models (sonic-vlan, sonic-port) also have annotation files, even though they&apos;re not
          OpenConfig. This keeps the annotation pattern uniform across all YANG-driven config.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="anatomy" number="04" title="Anatomy of an Annotation File ⭐">
        <P>
          Every annotation file follows this structure:
        </P>
        <CodeBlock
          title="annotation_skeleton.yang"
          runnable={false}
          code={`module openconfig-foo-annot {
  yang-version 1.1;
  namespace "http://github.com/Azure/sonic-mgmt-common/annot/openconfig-foo";
  prefix oc-foo-annot;

  import openconfig-foo { prefix oc-foo; }           // the OC module being annotated
  import sonic-extensions { prefix sonic-ext; }      // SONiC annotation vocabulary

  organization "SONiC";
  description
    "Annotation for openconfig-foo to map to SONiC CONFIG_DB.";

  // ─────────────────────────────────────────────────────────────────
  // DEVIATION BLOCKS (the meat)
  // ─────────────────────────────────────────────────────────────────

  deviation /oc-foo:foo/oc-foo:bars/oc-foo:bar {
    deviate add {
      sonic-ext:table-name "FOO_BAR";                // Redis table
      sonic-ext:key-transformer "foo_bar_key_xfmr";  // Go callback to build key
    }
  }

  deviation /oc-foo:foo/oc-foo:bars/oc-foo:bar/oc-foo:config/oc-foo:name {
    deviate add {
      sonic-ext:field-name "NULL";   // special: means "this is the key, not a field"
    }
  }

  deviation /oc-foo:foo/oc-foo:bars/oc-foo:bar/oc-foo:config/oc-foo:enabled {
    deviate add {
      sonic-ext:field-name "admin_status";         // leaf → Redis field mapping
      sonic-ext:field-transformer "foo_enabled_xfmr";  // optional custom logic
    }
  }

  // ... more deviations for every path that needs mapping
}`}
        />
        <P>
          Key patterns:
        </P>
        <CodeBlock
          title="deviation_patterns.txt"
          runnable={false}
          code={`1. CONTAINER/LIST-level annotation:
   deviation /path/to/list-node {
     deviate add {
       sonic-ext:table-name "REDIS_TABLE";
       sonic-ext:key-transformer "callback_name";
     }
   }
   → tells engine: "this list maps to this table, call this function to build key"

2. LEAF-level annotation (field mapping):
   deviation /path/to/leaf {
     deviate add {
       sonic-ext:field-name "redis_field";  // or "NULL" if it's the key
     }
   }
   → 1:1 mapping of leaf name → Redis hash field

3. LEAF with custom logic:
   deviation /path/to/leaf {
     deviate add {
       sonic-ext:field-transformer "callback_name";
     }
   }
   → "don't just copy the value, call this Go function to transform it"

4. SUBTREE takeover (for state data or complex logic):
   deviation /path/to/container {
     deviate add {
       sonic-ext:subtree-transformer "callback_name";
       sonic-ext:db-name "STATE_DB";  // or COUNTERS_DB
     }
   }
   → "I'll handle the entire subtree myself, query this DB"`}
        />
      </Section>

      {/* 05 */}
      <Section id="ntp-full" number="05" title="Full Example: NTP Annotations ⭐">
        <P>
          Let&apos;s walk through the <strong>complete annotation</strong> for NTP servers in{" "}
          <IC>openconfig-system-annot.yang</IC>:
        </P>
        <CodeBlock
          title="openconfig-system-annot.yang (NTP excerpt)"
          runnable={false}
          code={`module openconfig-system-annot {
  yang-version 1.1;
  namespace "http://github.com/Azure/sonic-mgmt-common/annot/openconfig-system";
  prefix oc-sys-annot;

  import openconfig-system { prefix oc-sys; }
  import sonic-extensions { prefix sonic-ext; }

  // ─────────────────────────────────────────────────────────────────
  // NTP global config
  // ─────────────────────────────────────────────────────────────────
  deviation /oc-sys:system/oc-sys:ntp/oc-sys:config {
    deviate add {
      sonic-ext:table-name "NTP";      // singleton table NTP|global
      sonic-ext:key-transformer "ntp_global_key_xfmr";
    }
  }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:config/oc-sys:enabled {
    deviate add {
      sonic-ext:field-name "admin_status";  // OC "enabled" → SONiC "admin_status"
      sonic-ext:field-transformer "ntp_enabled_xfmr";  // bool→enable/disable
    }
  }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:config/oc-sys:ntp-source-address {
    deviate add {
      sonic-ext:field-name "src_intf";  // OC uses IP, SONiC uses interface name
      sonic-ext:field-transformer "ntp_src_addr_xfmr";
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // NTP server list
  // ─────────────────────────────────────────────────────────────────
  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server {
    deviate add {
      sonic-ext:table-name "NTP_SERVER";
      sonic-ext:key-transformer "ntp_server_key_xfmr";
    }
  }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:address {
    deviate add {
      sonic-ext:field-name "NULL";  // "address" IS the key, not a field
    }
  }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:association-type {
    deviate add {
      sonic-ext:field-name "association_type";  // direct map (with case conversion)
    }
  }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:iburst {
    deviate add {
      sonic-ext:field-name "iburst";
      sonic-ext:field-transformer "ntp_iburst_xfmr";  // true→"on", false→"off"
    }
  }

  // ... more for prefer, minpoll, maxpoll, etc.
}`}
        />
        <P>
          What this achieves:
        </P>
        <CodeBlock
          title="ntp_translation_in_action.txt"
          runnable={false}
          code={`OpenConfig request:
  PATCH /openconfig-system:system/ntp/servers/server[address="10.1.1.1"]/config
  {
    "address": "10.1.1.1",
    "association-type": "SERVER",
    "iburst": true
  }

Annotation tells xlate engine:
  1. Table: NTP_SERVER (from deviation on /servers/server)
  2. Key: call ntp_server_key_xfmr("10.1.1.1") → returns "10.1.1.1"
  3. Fields:
     - address: field-name=NULL → skip (it's the key)
     - association-type → field "association_type" (underscore)
     - iburst: call ntp_iburst_xfmr(true) → "on"

Redis write:
  HSET CONFIG_DB:NTP_SERVER|10.1.1.1 association_type server iburst on`}
        />
        <Callout type="behind">
          The <IC>field-name &quot;NULL&quot;</IC> pattern is how SONiC handles key-only Redis tables. Many SONiC
          tables are just <IC>TABLE|key</IC> with no fields — the existence of the key is the data. The annotation
          says &quot;this leaf is the key, don&apos;t write it as a field.&quot;
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="catalog" number="06" title="Every sonic-ext Annotation ⭐">
        <P>
          Here is the <strong>complete catalog</strong> of sonic-extension annotations you&apos;ll see in annotation files:
        </P>
        <Table
          head={["Annotation", "Scope", "Purpose", "Example value"]}
          rows={[
            [
              <IC key="1">sonic-ext:table-name</IC>,
              "container/list",
              "Declares the Redis table for this path",
              <IC key="2">&quot;NTP_SERVER&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:key-transformer</IC>,
              "container/list",
              "Go callback to build Redis key from YANG list keys",
              <IC key="2">&quot;ntp_server_key_xfmr&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:field-name</IC>,
              "leaf",
              "Maps OC leaf to Redis field name (or &apos;NULL&apos; for key)",
              <IC key="2">&quot;admin_status&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:field-transformer</IC>,
              "leaf",
              "Go callback for custom value conversion (e.g., bool→enable/disable)",
              <IC key="2">&quot;intf_enabled_xfmr&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:table-transformer</IC>,
              "container/list",
              "Fully custom logic for the entire table (rare, most use subtree-xfmr instead)",
              <IC key="2">&quot;acl_table_xfmr&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:subtree-transformer</IC>,
              "container",
              "Hands the entire subtree to one Go function (common for state data)",
              <IC key="2">&quot;intf_state_xfmr&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:db-name</IC>,
              "any",
              "Which Redis DB (default: CONFIG_DB; state often uses STATE_DB, COUNTERS_DB)",
              <IC key="2">&quot;COUNTERS_DB&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:key-delimiter</IC>,
              "list",
              "Separator for composite keys (default: &apos;|&apos;)",
              <IC key="2">&quot;:&quot;</IC>,
            ],
            [
              <IC key="1">sonic-ext:virtual-table</IC>,
              "container/list",
              "Marks this as computed/virtual, no direct Redis table (transformer synthesizes data)",
              <IC key="2">&quot;true&quot;</IC>,
            ],
          ]}
        />
        <P>
          Let&apos;s see <strong>real-world usage</strong> of the less-common ones:
        </P>
        <CodeBlock
          title="interface_state_counters_annotation.yang"
          runnable={false}
          code={`// Interface state counters: read-only, from COUNTERS_DB, custom logic
deviation /oc-if:interfaces/oc-if:interface/oc-if:state/oc-if:counters {
  deviate add {
    sonic-ext:subtree-transformer "intf_state_counters_xfmr";
    sonic-ext:db-name "COUNTERS_DB";  // NOT CONFIG_DB
  }
}

// Platform component state: virtual table (no Redis, synthesized from platform API)
deviation /oc-plat:components/oc-plat:component/oc-plat:state {
  deviate add {
    sonic-ext:virtual-table "true";
    sonic-ext:subtree-transformer "platform_component_state_xfmr";
  }
}

// ACL rule with composite key: ACL_TABLE_NAME:RULE_NAME
deviation /oc-acl:acl/oc-acl:acl-sets/oc-acl:acl-set/oc-acl:acl-entries/oc-acl:acl-entry {
  deviate add {
    sonic-ext:table-name "ACL_RULE";
    sonic-ext:key-transformer "acl_rule_key_xfmr";
    sonic-ext:key-delimiter ":";  // produces ACL_RULE|TABLE:10
  }
}`}
        />
        <Callout type="tip">
          <strong>Interview insight:</strong> &quot;How does SONiC handle state data (read-only counters, sensor values)?&quot;{" "}
          → Annotations declare <IC>db-name &quot;COUNTERS_DB&quot;</IC> or <IC>&quot;STATE_DB&quot;</IC>, plus{" "}
          <IC>subtree-transformer</IC> that queries the right DB and builds the response. The pattern is uniform for
          config and state — only the DB and transformer differ.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="loading" number="07" title="How Annotations Are Loaded">
        <CodeBlock
          title="annotation_loading_sequence.txt"
          runnable={false}
          code={`Build time:
  1. pyang compiles all .yang files (OC models + SONiC models + annotations)
  2. ygot generates Go structs (ocbinds/)
  3. Annotation metadata embedded in the YANG schema tree

Runtime (translib startup):
  1. YANG schema loaded (includes deviation statements)
  2. xlate engine walks the schema, indexes every sonic-ext annotation by path
  3. Creates internal registry: map[yangPath] → {table, key-xfmr, field-map, ...}
  4. Transformers register their callbacks via XlateFuncBind (more in §08)

On each request:
  1. REST/gNMI → translib → common_app → xlate engine
  2. Engine looks up request path in annotation registry
  3. Finds table-name, calls key-transformer, maps fields
  4. Calls field-transformers if annotated
  5. Returns dbmap: { "TABLE|key": {"field": "value", ...} }
  6. CVL validates, DB layer writes to Redis`}
        />
        <P>
          The annotation registry is built <strong>once at startup</strong>. Every subsequent request is a fast map lookup.
        </P>
        <Callout type="behind">
          Why deviations instead of a custom JSON config? YANG tooling (pyang, ygot) already understands deviations.
          By reusing that mechanism, SONiC gets schema validation, IDE autocomplete, and compile-time checks for free.
          The annotation data lives in the same YANG schema tree that drives the rest of the system.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="pairing" number="08" title="Annotation → Go Callback Pairing">
        <P>
          An annotation declares a callback <em>name</em> (e.g., <IC>&quot;ntp_server_key_xfmr&quot;</IC>). The actual
          Go function must be <strong>registered</strong> in the transformer code. This happens in{" "}
          <IC>sonic-mgmt-common/translib/transformer/</IC>:
        </P>
        <CodeBlock
          title="transformers/xfmr_ntp.go"
          runnable={false}
          code={`package transformer

import (
    "translib/db"
    "translib/ocbinds"
    "github.com/openconfig/ygot/ygot"
)

func init() {
    // Register all NTP transformer callbacks
    XlateFuncBind("ntp_server_key_xfmr", ntp_server_key_xfmr)
    XlateFuncBind("ntp_enabled_xfmr", ntp_enabled_xfmr)
    XlateFuncBind("ntp_iburst_xfmr", ntp_iburst_xfmr)
    // ... more
}

// Key transformer: builds Redis key from YANG list key
var ntp_server_key_xfmr KeyXfmrFunc = func(inParams XfmrParams) (string, error) {
    // inParams.key is the YANG list key: {address: "10.1.1.1"}
    addr := inParams.key["address"]
    // SONiC uses the address as-is for the key
    return addr, nil  // returns "10.1.1.1"
}

// Field transformer: OC bool → SONiC "enable"/"disable"
var ntp_enabled_xfmr FieldXfmrFunc = func(inParams XfmrParams) (map[string]string, error) {
    result := make(map[string]string)

    if inParams.oper == GET {
        // Redis → OC: "enable" → true
        val := inParams.value  // e.g., "enable"
        if val == "enable" {
            result["enabled"] = "true"
        } else {
            result["enabled"] = "false"
        }
    } else {
        // OC → Redis: true → "enable"
        enabled := inParams.param.(*ocbinds.OpenconfigSystem_System_Ntp_Config).Enabled
        if *enabled {
            result["admin_status"] = "enable"
        } else {
            result["admin_status"] = "disable"
        }
    }
    return result, nil
}

// ... more transformers`}
        />
        <P>
          The pairing:
        </P>
        <CodeBlock
          title="annotation_to_go_binding.txt"
          runnable={false}
          code={`annotation file declares:        Go code registers:
────────────────────────────    ────────────────────────────────
sonic-ext:key-transformer   →   XlateFuncBind("ntp_server_key_xfmr",
  "ntp_server_key_xfmr"                        ntp_server_key_xfmr)

sonic-ext:field-transformer →   XlateFuncBind("ntp_enabled_xfmr",
  "ntp_enabled_xfmr"                           ntp_enabled_xfmr)

sonic-ext:subtree-transformer → XlateFuncBind("intf_state_xfmr",
  "intf_state_xfmr"                            intf_state_xfmr)

At runtime:
  xlate engine sees annotation "ntp_server_key_xfmr"
    → looks up in registry → calls the Go function pointer`}
        />
        <Callout type="mistake">
          <strong>Common mistake:</strong> typo in the callback name. Annotation says{" "}
          <IC>&quot;ntp_server_key_xfmer&quot;</IC> (typo: xfmer), but Go registers <IC>&quot;ntp_server_key_xfmr&quot;</IC>.
          Result: runtime error &quot;transformer function not found&quot;. Always grep the transformers/ dir to verify
          the name exists before writing an annotation.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging Annotation Issues">
        <P>
          When a PATCH fails with &quot;No DB mapping found&quot; or a transformer doesn&apos;t run:
        </P>
        <CodeBlock
          title="debug_annotations.sh"
          code={`# 1. Verify the annotation file exists and is compiled
ls sonic-mgmt-common/models/yang/annotations/ | grep system
# openconfig-system-annot.yang ✓

# 2. Grep for the exact YANG path in annotation files
grep -r "/ntp/servers/server" sonic-mgmt-common/models/yang/annotations/
# openconfig-system-annot.yang: deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server

# 3. Check the deviation depth matches the request path
# BAD: deviation on /system/ntp, request to /system/ntp/servers/server → mismatch
# GOOD: deviation on /system/ntp/servers/server → exact match

# 4. Verify transformer callback is registered
grep -r "XlateFuncBind.*ntp_server_key_xfmr" sonic-mgmt-common/translib/transformer/
# xfmr_ntp.go:  XlateFuncBind("ntp_server_key_xfmr", ntp_server_key_xfmr)

# 5. Enable transformer trace logs (needs translib debug build)
# In rest_server or gnmi_server, set glog verbosity:
docker exec -it mgmt-framework bash
glog -v=5  # (rebuild required for this, or use existing verbose logs)

# Logs show:
#   [xlate] found annotation for /system/ntp/servers/server: table=NTP_SERVER
#   [xlate] calling key-transformer: ntp_server_key_xfmr
#   [xlate] key result: "10.1.1.1"
#   [xlate] field map: {association_type: server, iburst: on}`}
          output={`openconfig-system-annot.yang
  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server
xfmr_ntp.go:  XlateFuncBind("ntp_server_key_xfmr", ntp_server_key_xfmr)`}
        />
        <Callout type="tip">
          <strong>Debug tactic:</strong> If you&apos;re adding a new feature, copy an existing annotation file as a
          template. The <IC>openconfig-system-annot.yang</IC> file is well-structured and has examples of every
          pattern (singleton tables, list tables, field-transformers, state subtrees).
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise">
        <P>
          <strong>Goal:</strong> Read the real NTP annotation file, understand every deviation, and predict the Redis
          writes for a 2-server NTP config.
        </P>
        <CodeBlock
          title="lab_steps.sh"
          code={`# Step 1: Read the annotation file
cat sonic-mgmt-common/models/yang/annotations/openconfig-system-annot.yang | grep -A5 "deviation.*ntp"

# Step 2: List every deviation for the /system/ntp subtree
# You should find:
#   - /system/ntp/config → table NTP, key-xfmr ntp_global_key_xfmr
#   - /system/ntp/servers/server → table NTP_SERVER, key-xfmr ntp_server_key_xfmr
#   - /config/enabled → field admin_status, field-xfmr ntp_enabled_xfmr
#   - /config/address → field NULL (key-only)
#   - /config/iburst → field iburst, field-xfmr ntp_iburst_xfmr

# Step 3: Predict Redis for this config:
# PATCH /openconfig-system:system/ntp
# {
#   "config": { "enabled": true },
#   "servers": {
#     "server": [
#       {"address": "10.1.1.1", "config": {"association-type": "SERVER", "iburst": true}},
#       {"address": "192.168.1.10", "config": {"association-type": "PEER"}}
#     ]
#   }
# }

# Step 4: Your prediction (write it down before checking):
# Table: NTP, key: global, fields: ?
# Table: NTP_SERVER, keys: ?, fields: ?

# Step 5: Verify with redis-cli
docker exec -it database redis-cli -n 4
HGETALL "NTP|global"
HGETALL "NTP_SERVER|10.1.1.1"
HGETALL "NTP_SERVER|192.168.1.10"`}
          output={`# Expected Redis output:
CONFIG_DB:NTP|global
  admin_status: enable

CONFIG_DB:NTP_SERVER|10.1.1.1
  association_type: server
  iburst: on

CONFIG_DB:NTP_SERVER|192.168.1.10
  association_type: peer

# (iburst field absent for second server because it wasn't in config → defaults handled elsewhere)`}
        />
        <Callout type="note">
          If your prediction matched Redis output, you&apos;ve mastered annotation reading. If not, re-check: did you
          map <IC>enabled</IC> to <IC>admin_status</IC>? Did you catch <IC>iburst: true → &quot;on&quot;</IC>? These
          are the transformers in action.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="interview" number="11" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What problem do annotation files solve?",
              "The transformer engine is generic — it walks OpenConfig YANG. But SONiC stores data in Redis tables with SONiC-specific names. Annotations are the wiring: they map each OC path to a Redis table, declare how to build keys, and map leaves to field names. Without them, the transformer has no idea where /system/ntp/servers should go.",
            ],
            [
              "Why use YANG deviations instead of JSON config?",
              "Deviations are a standard YANG feature (RFC 7950). By reusing it, SONiC gets pyang validation, ygot code generation, and IDE support for free. The annotation metadata lives in the same schema tree as the models, compiled together at build time.",
            ],
            [
              <>What does <IC>sonic-ext:field-name &quot;NULL&quot;</IC> mean?</>,
              "It marks a leaf as the Redis key, not a field in the hash. SONiC has many key-only tables like VLAN|Vlan100 with no fields — the key's existence is the data. NULL tells the transformer 'skip this leaf in the field map, it's already the key.'",
            ],
            [
              "How does a subtree-transformer differ from field-transformer?",
              "field-transformer handles one leaf (e.g., bool → enable/disable). subtree-transformer takes over an entire container or list — common for state data that comes from COUNTERS_DB or is computed. The transformer queries the DB, builds the whole subtree, returns it as a struct. Saves writing 20 field annotations for complex state.",
            ],
            [
              "Walk me through NTP server PATCH → Redis.",
              "1) REST receives PATCH /system/ntp/servers/server[10.1.1.1]. 2) Translib → xlate engine looks up /servers/server in annotation registry. 3) Finds table-name NTP_SERVER, calls ntp_server_key_xfmr('10.1.1.1') → '10.1.1.1'. 4) Maps config/association-type → field association_type, config/iburst → calls ntp_iburst_xfmr(true) → 'on'. 5) Builds dbmap {NTP_SERVER|10.1.1.1: {association_type: server, iburst: on}}. 6) CVL validates, db.SetEntry writes to CONFIG_DB.",
            ],
            [
              "How do you debug 'No DB mapping found'?",
              "Means no annotation for that path. 1) grep annotations dir for the YANG path. 2) Check deviation depth — if annotation is on /system/ntp but request is /system/ntp/servers, mismatch. 3) Verify annotation file is in the build (listed in models/yang/Makefile). 4) Check xlate logs (glog -v=5) to see what the engine found.",
            ],
            [
              "Can one YANG leaf map to multiple Redis fields?",
              "Yes, via a field-transformer. Example: OC /interfaces/interface/config/name might write to both PORT|Ethernet0 (key) AND INTERFACE|Ethernet0 (for IP config). The transformer returns a map with multiple table|key entries. Rare but powerful for denormalized SONiC schemas.",
            ],
            [
              "Where is COUNTERS_DB annotated?",
              <>State paths like <IC>/interfaces/interface/state/counters</IC> have <IC>sonic-ext:db-name &quot;COUNTERS_DB&quot;</IC> plus <IC>subtree-transformer</IC>. The transformer queries COUNTERS_DB:Ethernet0, extracts in-octets/out-octets/etc., builds the OC counters container, returns it. No field-by-field annotation needed.</>,
            ],
            [
              "How are SONiC native models annotated?",
              "Same pattern. sonic-vlan.yang has sonic-vlan-annot.yang that maps to VLAN table. Even though it's not OpenConfig, the transformer is uniform. Some native models skip annotations if they're 1:1 with Redis (same names), but most still annotate for consistency.",
            ],
            [
              "What happens if a transformer callback name has a typo?",
              "Runtime error: 'transformer function not found'. The annotation declares 'ntp_server_key_xfmer', but XlateFuncBind registered 'ntp_server_key_xfmr'. The engine tries to look it up in the registry, fails, returns error to REST client. Fix: correct the spelling in the annotation, rebuild the YANG.",
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Purpose", "Map OpenConfig YANG paths → SONiC Redis tables/fields"],
            ["Format", "YANG deviation modules with sonic-ext annotations"],
            ["Location", "sonic-mgmt-common/models/yang/annotations/*.yang"],
            ["Naming", "<module>-annot.yang (e.g., openconfig-system-annot.yang)"],
            ["sonic-ext:table-name", "Which Redis table stores this path (e.g., NTP_SERVER)"],
            ["sonic-ext:key-transformer", "Go callback name to build Redis key from YANG list keys"],
            ["sonic-ext:field-name", "Leaf → Redis field mapping (or 'NULL' if it's the key)"],
            ["sonic-ext:field-transformer", "Custom Go callback for value conversion (e.g., bool → enable)"],
            ["sonic-ext:subtree-transformer", "Entire subtree handled by one Go function (common for state)"],
            ["sonic-ext:db-name", "Which DB: CONFIG_DB (default), STATE_DB, COUNTERS_DB, APPL_DB"],
            ["NULL field pattern", "Marks a leaf as the Redis key, not a field (key-only tables)"],
            ["Registration", "XlateFuncBind('callback_name', go_func) in transformers/*.go init()"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
