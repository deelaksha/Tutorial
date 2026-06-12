"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "YangToDb: a PATCH becomes hash fields",
  nodes: [
    { id: "payload", icon: "📨", label: "OC JSON", sub: "ygot tree", x: 6, y: 50, color: "#22d3ee" },
    { id: "xlate", icon: "🧮", label: "xlate engine", sub: "walks schema", x: 24, y: 50, color: "#a78bfa" },
    { id: "annot", icon: "📝", label: "Annotations", sub: "table/key hints", x: 44, y: 20, color: "#34d399" },
    { id: "cb", icon: "🧩", label: "xfmr callbacks", sub: "YangToDb_*", x: 44, y: 80, color: "#fbbf24" },
    { id: "dbmap", icon: "🗺️", label: "DB map", sub: "table→key→fields", x: 64, y: 50, color: "#fb923c" },
    { id: "cvl", icon: "🛡️", label: "CVL", sub: "validates", x: 80, y: 25, color: "#60a5fa" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "write", x: 92, y: 60, color: "#f472b6" },
  ],
  edges: [
    { id: "payload-xlate", from: "payload", to: "xlate", color: "#a78bfa" },
    { id: "xlate-annot", from: "xlate", to: "annot", color: "#34d399" },
    { id: "xlate-cb", from: "xlate", to: "cb", color: "#fbbf24" },
    { id: "annot-dbmap", from: "annot", to: "dbmap", color: "#fb923c" },
    { id: "cb-dbmap", from: "cb", to: "dbmap", color: "#fb923c" },
    { id: "dbmap-cvl", from: "dbmap", to: "cvl", color: "#60a5fa" },
    { id: "cvl-redis", from: "cvl", to: "redis", color: "#f472b6" },
  ],
  flows: [
    {
      id: "mtu",
      name: "📝 MTU PATCH — annotation-only",
      command: "PATCH /interfaces/interface[name=Ethernet0]/config/mtu 9000",
      steps: [
        { node: "payload", paths: ["payload-xlate"], text: "OpenConfig JSON: {interface: {name: Ethernet0, config: {mtu: 9000}}}. REST server unmarshals to ygot tree." },
        { node: "xlate", paths: ["xlate-annot"], text: "Transformer walks the ygot tree. Finds /interfaces/interface/config/mtu node." },
        { node: "annot", paths: ["annot-dbmap"], text: "Annotation file maps OC path → SONiC table=PORT, key from /name, field=mtu. No callback needed (direct map)." },
        { node: "dbmap", paths: ["dbmap-cvl"], text: "DB map built: {PORT: {Ethernet0: {mtu: \"9000\"}}}. Ready for validation." },
        { node: "cvl", paths: ["cvl-redis"], text: "CVL validates: mtu field exists in sonic-port.yang, type uint16, range check. CVL_SUCCESS." },
        { node: "redis", paths: [], text: "CONFIG_DB write: HSET PORT|Ethernet0 mtu 9000. portsyncd picks it up, orchagent applies to SAI." },
      ],
    },
    {
      id: "enabled",
      name: "🔁 enabled:true — field transformer",
      command: "PATCH /interfaces/interface[name=Ethernet0]/config/enabled true",
      steps: [
        { node: "payload", paths: ["payload-xlate"], text: "OC JSON: {enabled: true}. This is a boolean in OpenConfig." },
        { node: "xlate", paths: ["xlate-cb"], text: "Annotation says: field 'enabled' needs field_xfmr YangToDb_intf_enabled_xfmr (custom logic required)." },
        { node: "cb", paths: ["cb-dbmap"], text: "Callback YangToDb_intf_enabled_xfmr(true) → SONiC field admin_status='up'. (false → 'down'). Returns transformed value." },
        { node: "dbmap", paths: ["dbmap-cvl"], text: "DB map: {PORT: {Ethernet0: {admin_status: \"up\"}}}. OC→SONiC translation complete." },
        { node: "cvl", paths: ["cvl-redis"], text: "CVL validates admin_status field (enum: up/down in sonic-port.yang). PASS." },
        { node: "redis", paths: [], text: "HSET PORT|Ethernet0 admin_status up. Port goes admin-up." },
      ],
    },
    {
      id: "get",
      name: "🔙 GET interface — DbToYang reverse",
      command: "GET /interfaces/interface[name=Ethernet0]/state",
      steps: [
        { node: "redis", paths: [], text: "Transformer reads CONFIG_DB: HGETALL PORT|Ethernet0 → {alias: etp1, mtu: 9000, admin_status: up, ...}." },
        { node: "dbmap", paths: ["cb-dbmap"], text: "Reverse direction: DB map from redis. DbToYang callbacks fire for fields needing translation." },
        { node: "cb", paths: ["xlate-cb"], text: "DbToYang_intf_enabled_xfmr('up') → enabled: true (SONiC admin_status → OC enabled boolean)." },
        { node: "xlate", paths: ["annot-dbmap"], text: "Annotations guide assembly: mtu maps directly, alias → description (if annotated), etc." },
        { node: "annot", paths: ["payload-xlate"], text: "xlate engine builds ygot tree: {interface: {name: Ethernet0, state: {mtu: 9000, enabled: true, ...}}}." },
        { node: "payload", paths: [], text: "REST server marshals ygot → OC JSON response. Client receives OpenConfig-compliant data." },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Transformer Exists — The Old Way" },
  { id: "concept", label: "What Transformer Is — Generic Engine" },
  { id: "yangtodb", label: "YangToDb — SET Flow (OC → redis) ⭐" },
  { id: "dbtoyang", label: "DbToYang — GET Flow (redis → OC)" },
  { id: "callbacks", label: "Callback Taxonomy — 4 Transformer Types ⭐" },
  { id: "key-xfmr", label: "Key Transformer — Example: NTP Server" },
  { id: "field-xfmr", label: "Field Transformer — Example: enabled ↔ admin_status" },
  { id: "table-xfmr", label: "Table Transformer — Choosing PORT vs PORTCHANNEL" },
  { id: "subtree-xfmr", label: "Subtree Transformer — Full Manual Control" },
  { id: "registration", label: "Callback Registration & XlateFuncBind" },
  { id: "debugging", label: "Debugging — glog Traces & Common Panics" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function TransformerPage() {
  return (
    <TopicShell
      icon="🔁"
      title="Transformer — OpenConfig ⇄ Redis Translation Engine"
      gradientWord="Transformer"
      subtitle="Transformer is the GENERIC translation engine that converts OpenConfig YANG trees to CONFIG_DB writes (and vice versa). Driven by annotation files + small Go callbacks, it replaces hundreds of hand-written app modules with declarative mappings. Every RESTCONF/gNMI request flows through Transformer before hitting CVL and redis."
      nav={NAV}
      badges={["OC ↔ SONiC bridge", "4 xfmr types", "annotation-driven", "glog traces", "XfmrParams"]}
      next={{ icon: "📝", label: "Annotation Files", href: "/sonic/annotations" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Transformer Exists — The Problem It Solves">
        <P>
          Before Transformer, every SONiC feature needed a hand-written <strong>app module</strong> (e.g.,{" "}
          <IC>intf_app.go</IC>, <IC>vlan_app.go</IC>, <IC>acl_app.go</IC>). Each module: 1. Parsed
          OpenConfig JSON from REST requests. 2. Validated fields. 3. Mapped OC paths to CONFIG_DB keys
          and fields manually. 4. Called redis. 5. Reversed the process for GETs.
        </P>
        <CodeBlock
          title="the_old_way.txt"
          runnable={false}
          code={`BEFORE Transformer (legacy):
  ✗ Every feature = 300-500 lines of plumbing code
  ✗ OC path parsing scattered across 20+ app modules
  ✗ Field mapping hard-coded (enabled → admin_status in intf_app.go,
    repeated in other modules)
  ✗ No reuse — ACL app, VLAN app, Interface app all reinvent the wheel
  ✗ Adding a new YANG node = edit app code, recompile, test
  ✗ Bugs in parsing logic, nil-map panics, missing error handling

AFTER Transformer (current SONiC):
  ✓ ONE generic engine handles ALL OpenConfig models
  ✓ Annotation files (YAML) declare the OC→SONiC mapping
  ✓ Small Go callbacks (xfmr functions) handle ONLY non-trivial transforms
  ✓ New feature = add YANG + annotation + 3-10 lines of callback (if needed)
  ✓ The engine handles traversal, validation dispatch (CVL), redis writes
  ✓ Reusable, testable, maintainable — 90% reduction in plumbing code`}
        />
        <Callout type="analogy">
          Think of Transformer as an ORM for SONiC. Just like SQLAlchemy maps Python objects to SQL rows
          with declarative mappings + occasional custom methods, Transformer maps OpenConfig trees to
          redis hashes with annotations + callbacks. The engine does the heavy lifting; you just tell it
          the mapping rules.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="concept" number="02" title="What Transformer Is — The Generic Engine">
        <P>Location: <IC>sonic-mgmt-common/translib/transformer/</IC></P>
        <P>
          Transformer is a Go library that sits between the REST/gNMI server and CONFIG_DB. It has TWO
          main flows:
        </P>
        <CodeBlock
          title="transformer_flows.txt"
          runnable={false}
          code={`1. YangToDb (SET path):
   RESTCONF PATCH → ygot tree (OpenConfig structs) → Transformer
   → DB map (table → key → fields, SONiC schema) → CVL → CONFIG_DB

2. DbToYang (GET path):
   RESTCONF GET → Transformer → CONFIG_DB reads → DB map
   → ygot tree (OpenConfig) → JSON response

Input/output types:
  YangToDb:  ygot.GoStruct → map[string]map[string]db.Value
  DbToYang:  map[string]map[string]db.Value → ygot.GoStruct

The magic: Transformer WALKS the OpenConfig tree recursively, consulting
annotations + firing callbacks to build the DB map. No hard-coded paths.`}
        />
      </Section>

      {/* 03 */}
      <Section id="yangtodb" number="03" title="YangToDb — The SET Flow (OC → redis) ⭐">
        <P>When a client does <IC>PATCH /interfaces/interface[name=Ethernet0]/config/mtu 9000</IC>:</P>
        <CodeBlock
          title="yangtodb_flow.txt"
          runnable={false}
          code={`Step 1: REST server unmarshals JSON → ygot tree
  ygot struct: &oc.Interface{Name: "Ethernet0", Config: &oc.Interface_Config{Mtu: 9000}}

Step 2: translib calls Transformer YangToDb
  xlate.YangToDbXfmr(inParams XfmrParams) → dbDataMap

Step 3: Transformer recursively walks the tree
  - Visits /interfaces node → checks annotation
  - Visits /interfaces/interface → checks annotation (table hint?)
  - Visits /interfaces/interface/config → checks annotation
  - Visits /interfaces/interface/config/mtu → LEAF node → map to field

Step 4: For each node, Transformer:
  a. Reads annotation (YAML file for this OC model)
  b. If annotation says "table: PORT, field: mtu" → direct map
  c. If annotation says "field_xfmr: YangToDb_intf_mtu_xfmr" → call callback
  d. Callback returns transformed value → add to DB map

Step 5: Build DB map structure
  dbDataMap = map[string]map[string]db.Value{
    "PORT": {
      "Ethernet0": {Field: map[string]string{"mtu": "9000"}},
    },
  }

Step 6: Return to translib → CVL validation → redis write`}
        />
        <P>Key insight: annotations tell Transformer WHAT to do, callbacks tell it HOW (when logic is needed).</P>
        <Callout type="behind">
          ⚙️ The <IC>XfmrParams</IC> struct is the context object passed to every callback. It has:
          <IC>d *db.DB</IC> (CONFIG_DB handle), <IC>ygRoot</IC> (full ygot tree), <IC>uri</IC> (the OC
          path being processed), <IC>oper</IC> (CREATE/UPDATE/DELETE), <IC>key</IC> (redis key hint),
          <IC>dbDataMap</IC> (accumulator for results). Callbacks read/write these fields.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="dbtoyang" number="04" title="DbToYang — The GET Flow (redis → OC)">
        <P>Reverse direction: client does <IC>GET /interfaces/interface[name=Ethernet0]/state</IC>:</P>
        <CodeBlock
          title="dbtoyang_flow.txt"
          runnable={false}
          code={`Step 1: translib calls Transformer DbToYang
  xlate.DbToYangXfmr(inParams XfmrParams) → ygot tree

Step 2: Transformer determines which CONFIG_DB tables to read
  - Annotation for /interfaces/interface says "table: PORT"
  - Transformer queries: HGETALL PORT|Ethernet0

Step 3: DB map populated from redis
  dbDataMap = {
    "PORT": {
      "Ethernet0": {Field: {"admin_status": "up", "mtu": "9100", "alias": "etp1", ...}},
    },
  }

Step 4: Walk the OC schema in REVERSE
  - For each OC leaf (mtu, enabled, description), check annotation
  - If direct map: mtu ← PORT.mtu
  - If field_xfmr: enabled ← DbToYang_intf_enabled_xfmr(admin_status)
    - Callback reads "up" → returns true (boolean)

Step 5: Populate ygot tree
  ygot.Interface{
    Name:  "Ethernet0",
    State: &oc.Interface_State{
      Mtu:     9100,
      Enabled: true,
      ...
    },
  }

Step 6: REST server marshals ygot → JSON → response`}
        />
        <P>
          The symmetry: YangToDb callbacks transform OC→SONiC, DbToYang callbacks transform SONiC→OC. Same
          annotation file, opposite direction.
        </P>
      </Section>

      {/* 05 */}
      <Section id="callbacks" number="05" title="Callback Taxonomy — 4 Transformer Types ⭐">
        <P>Transformer has 4 callback types, each for a different translation need:</P>
        <Table
          head={["Transformer type", "When to use", "Signature example"]}
          rows={[
            [
              <IC key="1">key_xfmr</IC>,
              "OC key format differs from SONiC key",
              <IC key="2">func YangToDb_ntp_server_key_xfmr(inParams XfmrParams) (string, error)</IC>,
            ],
            [
              <IC key="3">field_xfmr</IC>,
              "Field value needs translation (bool↔enum, unit conversion)",
              <IC key="4">func YangToDb_intf_enabled_xfmr(inParams XfmrParams) (map[string]string, error)</IC>,
            ],
            [
              <IC key="5">table_xfmr</IC>,
              "Dynamically choose table (PORT vs PORTCHANNEL, multiple tables)",
              <IC key="6">func intf_table_xfmr(inParams XfmrParams) ([]string, error)</IC>,
            ],
            [
              <IC key="7">subtree_xfmr</IC>,
              "Full manual control over a subtree (complex nested logic)",
              <IC key="8">func YangToDb_acl_subtree_xfmr(inParams XfmrParams) (map[string]map[string]db.Value, error)</IC>,
            ],
          ]}
        />
        <P>
          Rule of thumb: use the LEAST powerful transformer that solves the problem. Most fields are
          direct maps (no callback). If a field needs translation, use field_xfmr. Only use subtree_xfmr
          for truly gnarly cases (like ACL rules with 20+ optional fields).
        </P>
      </Section>

      {/* 06 */}
      <Section id="key-xfmr" number="06" title="Key Transformer — Example: NTP Server">
        <P>
          OpenConfig NTP model uses <IC>/system/ntp/servers/server[address=10.1.1.1]</IC>. SONiC
          CONFIG_DB uses <IC>NTP_SERVER|10.1.1.1</IC>. The key is the same (the IP), but the transformer
          needs to extract it.
        </P>
        <CodeBlock
          title="xfmr_system.go (excerpt)"
          runnable={false}
          code={`// YangToDb direction: extract IP from OC key
func YangToDb_ntp_server_key_xfmr(inParams XfmrParams) (string, error) {
    // inParams.key has the OC key map: {"address": "10.1.1.1"}
    // We return just the IP string for SONiC redis key
    address, ok := inParams.key["address"]
    if !ok {
        return "", fmt.Errorf("NTP server address key missing")
    }
    return address, nil  // returns "10.1.1.1"
}

// DbToYang direction: reverse (redis key → OC key map)
func DbToYang_ntp_server_key_xfmr(inParams XfmrParams) (map[string]interface{}, error) {
    // inParams.key is "10.1.1.1" (from NTP_SERVER|10.1.1.1)
    // Return OC key map
    return map[string]interface{}{
        "address": inParams.key,
    }, nil
}

// Registration in init()
func init() {
    XlateFuncBind("YangToDb_ntp_server_key_xfmr", YangToDb_ntp_server_key_xfmr)
    XlateFuncBind("DbToYang_ntp_server_key_xfmr", DbToYang_ntp_server_key_xfmr)
}`}
        />
        <P>Annotation file references it:</P>
        <CodeBlock
          title="openconfig-system-annot.yaml (excerpt)"
          runnable={false}
          code={`/openconfig-system:system/ntp/servers/server:
  table: NTP_SERVER
  key_xfmr: YangToDb_ntp_server_key_xfmr
  reverse_key_xfmr: DbToYang_ntp_server_key_xfmr`}
        />
      </Section>

      {/* 07 */}
      <Section id="field-xfmr" number="07" title="Field Transformer — Example: enabled ↔ admin_status">
        <P>
          OpenConfig uses <IC>enabled: true/false</IC> (boolean). SONiC uses{" "}
          <IC>admin_status: up/down</IC> (string enum). Field transformer translates.
        </P>
        <CodeBlock
          title="xfmr_intf.go (excerpt)"
          runnable={false}
          code={`// YangToDb: OC enabled (bool) → SONiC admin_status (string)
func YangToDb_intf_enabled_xfmr(inParams XfmrParams) (map[string]string, error) {
    result := make(map[string]string)

    // Extract the 'enabled' field from ygot tree
    intfObj := inParams.ygRoot.(*oc.Device).Interface[inParams.key["name"]]
    if intfObj == nil || intfObj.Config == nil {
        return result, nil
    }

    enabled := intfObj.Config.Enabled
    if enabled != nil {
        if *enabled {
            result["admin_status"] = "up"
        } else {
            result["admin_status"] = "down"
        }
    }
    return result, nil
}

// DbToYang: SONiC admin_status → OC enabled (bool)
func DbToYang_intf_enabled_xfmr(inParams XfmrParams) (map[string]interface{}, error) {
    result := make(map[string]interface{})

    // Read from dbDataMap (populated from CONFIG_DB)
    portEntry := inParams.dbDataMap["PORT"][inParams.key]
    adminStatus, exists := portEntry.Field["admin_status"]

    if exists {
        result["enabled"] = (adminStatus == "up")  // "up" → true, else false
    }
    return result, nil
}

func init() {
    XlateFuncBind("YangToDb_intf_enabled_xfmr", YangToDb_intf_enabled_xfmr)
    XlateFuncBind("DbToYang_intf_enabled_xfmr", DbToYang_intf_enabled_xfmr)
}`}
        />
        <P>Annotation:</P>
        <CodeBlock
          title="openconfig-interfaces-annot.yaml"
          runnable={false}
          code={`/openconfig-interfaces:interfaces/interface/config/enabled:
  field: admin_status
  field_xfmr: YangToDb_intf_enabled_xfmr
  reverse_field_xfmr: DbToYang_intf_enabled_xfmr`}
        />
      </Section>

      {/* 08 */}
      <Section id="table-xfmr" number="08" title="Table Transformer — Choosing PORT vs PORTCHANNEL">
        <P>
          OpenConfig <IC>/interfaces/interface</IC> could map to PORT (Ethernet0) OR PORTCHANNEL
          (PortChannel10). The table transformer decides at runtime based on the interface name.
        </P>
        <CodeBlock
          title="xfmr_intf.go table_xfmr"
          runnable={false}
          code={`// YangToDb table selection
func intf_table_xfmr(inParams XfmrParams) ([]string, error) {
    intfName := inParams.key["name"]

    if strings.HasPrefix(intfName, "Ethernet") {
        return []string{"PORT"}, nil
    } else if strings.HasPrefix(intfName, "PortChannel") {
        return []string{"PORTCHANNEL"}, nil
    } else if strings.HasPrefix(intfName, "Vlan") {
        return []string{"VLAN"}, nil
    } else if strings.HasPrefix(intfName, "Loopback") {
        return []string{"LOOPBACK_INTERFACE"}, nil
    }

    return nil, fmt.Errorf("unknown interface type: %s", intfName)
}

// DbToYang: when reading, Transformer queries ALL potential tables
// (PORT, PORTCHANNEL, VLAN, LOOPBACK_INTERFACE) and merges results

func init() {
    XlateFuncBind("intf_table_xfmr", intf_table_xfmr)
}`}
        />
        <P>Annotation:</P>
        <CodeBlock
          title="openconfig-interfaces-annot.yaml"
          runnable={false}
          code={`/openconfig-interfaces:interfaces/interface:
  table_xfmr: intf_table_xfmr
  # Transformer calls this to get table name(s), no hardcoded table`}
        />
        <Callout type="behind">
          ⚙️ For GET requests, Transformer calls the table_xfmr with <IC>oper=GET</IC>. The callback can
          return MULTIPLE tables, and Transformer will KEYS * on each one, then filter by interface
          type. This is how <IC>GET /interfaces</IC> returns all interface types in one response.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="subtree-xfmr" number="09" title="Subtree Transformer — Full Manual Control">
        <P>
          For complex subtrees (like ACL rules with 20+ optional match fields), a subtree transformer
          takes full control. It processes the entire subtree and returns the complete DB map.
        </P>
        <CodeBlock
          title="xfmr_acl.go subtree_xfmr (simplified)"
          runnable={false}
          code={`// YangToDb subtree: OpenConfig ACL entry → SONiC ACL_RULE
func YangToDb_acl_entry_subtree_xfmr(inParams XfmrParams) (map[string]map[string]db.Value, error) {
    dbMap := make(map[string]map[string]db.Value)

    // Extract ACL entry from ygot tree
    aclEntry := inParams.ygRoot.(*oc.Device).Acl.AclSet[aclSetKey].AclEntry[entryKey]

    // Build SONiC ACL_RULE key: ACL_RULE|<table_name>|<rule_name>
    tableName := inParams.key["acl_set_name"]
    ruleName := inParams.key["sequence_id"]
    sonicKey := tableName + "|RULE_" + ruleName

    fields := make(map[string]string)

    // Map OC match fields → SONiC fields (many optional fields)
    if aclEntry.Ipv4 != nil && aclEntry.Ipv4.Config != nil {
        if aclEntry.Ipv4.Config.SourceAddress != nil {
            fields["SRC_IP"] = *aclEntry.Ipv4.Config.SourceAddress
        }
        if aclEntry.Ipv4.Config.DestinationAddress != nil {
            fields["DST_IP"] = *aclEntry.Ipv4.Config.DestinationAddress
        }
    }
    if aclEntry.Transport != nil && aclEntry.Transport.Config != nil {
        if aclEntry.Transport.Config.SourcePort != nil {
            fields["L4_SRC_PORT"] = fmt.Sprintf("%d", *aclEntry.Transport.Config.SourcePort)
        }
    }
    // ... 15 more optional fields

    // Map action: OC ACCEPT/DROP → SONiC FORWARD/DROP
    action := aclEntry.Actions.Config.ForwardingAction
    if action == oc.AclEntry_Actions_Config_ForwardingAction_ACCEPT {
        fields["PACKET_ACTION"] = "FORWARD"
    } else if action == oc.AclEntry_Actions_Config_ForwardingAction_DROP {
        fields["PACKET_ACTION"] = "DROP"
    }

    dbMap["ACL_RULE"] = map[string]db.Value{
        sonicKey: {Field: fields},
    }
    return dbMap, nil
}

// DbToYang subtree: reverse process (redis → ygot)
func DbToYang_acl_entry_subtree_xfmr(inParams XfmrParams) (ygot.GoStruct, error) {
    // read ACL_RULE entries, build oc.AclEntry objects
    // ... mirror logic in reverse
}

func init() {
    XlateFuncBind("YangToDb_acl_entry_subtree_xfmr", YangToDb_acl_entry_subtree_xfmr)
    XlateFuncBind("DbToYang_acl_entry_subtree_xfmr", DbToYang_acl_entry_subtree_xfmr)
}`}
        />
        <P>
          Subtree transformers are the &quot;escape hatch&quot; — when annotations + simple field xfmrs
          can&apos;t express the logic, write a subtree xfmr. But they&apos;re harder to maintain, so use
          sparingly.
        </P>
      </Section>

      {/* 10 */}
      <Section id="registration" number="10" title="Callback Registration — XlateFuncBind & init()">
        <P>
          Every transformer callback must be REGISTERED so the engine can find it by name (the annotation
          file references the function by string).
        </P>
        <CodeBlock
          title="registration_pattern.go"
          runnable={false}
          code={`// In xfmr_intf.go, xfmr_system.go, etc:

func init() {
    // Bind function name (string) to actual Go function pointer
    XlateFuncBind("YangToDb_intf_enabled_xfmr", YangToDb_intf_enabled_xfmr)
    XlateFuncBind("DbToYang_intf_enabled_xfmr", DbToYang_intf_enabled_xfmr)
    XlateFuncBind("intf_table_xfmr", intf_table_xfmr)
    XlateFuncBind("YangToDb_ntp_server_key_xfmr", YangToDb_ntp_server_key_xfmr)
    // ...
}

// XlateFuncBind is defined in xlate_utils.go
// It populates a global map: funcNameToPointer["YangToDb_intf_enabled_xfmr"] = <func ptr>

// When Transformer sees annotation "field_xfmr: YangToDb_intf_enabled_xfmr",
// it looks up the string in the map and calls the function`}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: writing a transformer callback but forgetting to call{" "}
          <IC>XlateFuncBind</IC> in <IC>init()</IC>. The annotation will reference a function name that
          doesn&apos;t exist in the registry → runtime panic: &quot;transformer function not
          found&quot;. Always grep for your function name in init().
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging — glog Traces & Common Panics">
        <P>Transformer uses <IC>glog</IC> for logging. Enable verbose traces:</P>
        <CodeBlock
          title="enable_transformer_traces.sh"
          code={`# Inside mgmt-framework container
export GLOG_v=3  # levels 0-5, higher = more verbose
export GLOG_logtostderr=1

# restart REST server (or run test)
supervisorctl restart rest-server

# tail logs
tail -f /var/log/syslog | grep transformer`}
          output={`Dec 15 10:45:12 sonic rest-server[2345]: I1215 10:45:12.123 transformer.go:234] YangToDb: Processing URI /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu
Dec 15 10:45:12 sonic rest-server[2345]: I1215 10:45:12.125 xlate_utils.go:89] Calling field_xfmr: YangToDb_intf_mtu_xfmr
Dec 15 10:45:12 sonic rest-server[2345]: I1215 10:45:12.127 transformer.go:456] DB map built: {PORT: {Ethernet0: {mtu: 9000}}}`}
        />
        <P>Common panics and fixes:</P>
        <Table
          head={["Panic message", "Cause", "Fix"]}
          rows={[
            [
              "assignment to entry in nil map",
              "dbDataMap[table] not initialized before writing",
              "Always: if dbDataMap[table] == nil { dbDataMap[table] = make(...) }",
            ],
            [
              "invalid memory address (nil pointer)",
              "Accessing ygot field without nil-check",
              "Check: if obj != nil && obj.Config != nil before obj.Config.Field",
            ],
            [
              "transformer function YangToDb_foo_xfmr not found",
              "Forgot XlateFuncBind in init()",
              "Add XlateFuncBind(\"YangToDb_foo_xfmr\", YangToDb_foo_xfmr) to init()",
            ],
            [
              "key format mismatch",
              "Annotation expects key component that doesn't exist",
              "Check OC list key definition vs annotation key_xfmr output",
            ],
          ]}
        />
        <Callout type="tip">
          💡 To trace which transformers fire for a specific path, set GLOG_v=4 and grep for the URI
          string. Transformer logs every annotation lookup and callback invocation. This is THE debug
          technique for &quot;why isn&apos;t my field mapping?&quot;
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise — Predict the DB Map">
        <P>Given this OpenConfig PATCH payload, predict the DB map that Transformer produces:</P>
        <CodeBlock
          title="oc_payload.json"
          runnable={false}
          code={`PATCH /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
{
  "openconfig-interfaces:config": {
    "mtu": 9000,
    "enabled": false,
    "description": "uplink to spine"
  }
}`}
        />
        <P>Assume these annotations and transformers exist:</P>
        <CodeBlock
          title="annotations + xfmr hints"
          runnable={false}
          code={`/interfaces/interface:
  table: PORT
  key from 'name'

/interfaces/interface/config/mtu:
  field: mtu  (direct map, no xfmr)

/interfaces/interface/config/enabled:
  field: admin_status
  field_xfmr: YangToDb_intf_enabled_xfmr  (false → "down")

/interfaces/interface/config/description:
  field: alias  (direct map)`}
        />
        <P>Exercise steps:</P>
        <CodeBlock
          title="lab_steps.txt"
          runnable={false}
          code={`1. What table does Transformer target?
2. What is the redis key?
3. What are the hash fields and their values in the DB map?
4. Which fields go through transformers vs direct map?
5. After CVL validation, what is the exact redis command executed?`}
        />
        <P>Answers:</P>
        <CodeBlock
          title="lab_answers.txt"
          runnable={false}
          code={`1. Table: PORT (from annotation /interfaces/interface table: PORT)

2. Redis key: PORT|Ethernet0 (table + '|' + interface name from [name=Ethernet0])

3. DB map:
   {
     "PORT": {
       "Ethernet0": {
         Field: {
           "mtu": "9000",           // direct map, uint converted to string
           "admin_status": "down",  // field_xfmr: enabled=false → "down"
           "alias": "uplink to spine"  // direct map: description → alias
         }
       }
     }
   }

4. Transformers:
   - mtu: direct map (no xfmr)
   - enabled: YangToDb_intf_enabled_xfmr (false → admin_status "down")
   - description: direct map to alias field (no xfmr, just field rename per annotation)

5. Redis commands (after CVL_SUCCESS):
   redis-cli -n 4
   HSET PORT|Ethernet0 mtu 9000
   HSET PORT|Ethernet0 admin_status down
   HSET PORT|Ethernet0 alias "uplink to spine"
   (or batched via HMSET)`}
        />
        <P>Verify in a SONiC instance:</P>
        <CodeBlock
          title="verify_lab.sh"
          code={`redis-cli -n 4 HGETALL PORT|Ethernet0`}
          output={`1) "lanes"
2) "0,1,2,3"
3) "alias"
4) "uplink to spine"
5) "mtu"
6) "9000"
7) "admin_status"
8) "down"
9) "speed"
10) "100000"`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is Transformer and why does SONiC use it?",
              "Transformer is the generic translation engine between OpenConfig YANG (exposed via REST/gNMI) and SONiC YANG (CONFIG_DB schema). It replaces hundreds of hand-written app modules with annotation-driven mappings + small Go callbacks. This reduces plumbing code by 90% and makes adding new features declarative.",
            ],
            [
              "What are the two main Transformer flows?",
              "1. YangToDb (SET path): OpenConfig ygot tree → DB map (SONiC schema) → CVL → CONFIG_DB write. 2. DbToYang (GET path): CONFIG_DB read → DB map → OpenConfig ygot tree → JSON response. YangToDb for PATCH/POST, DbToYang for GET.",
            ],
            [
              "What are the 4 types of transformer callbacks?",
              "1. key_xfmr: transforms OC key format to SONiC key. 2. field_xfmr: transforms field values (e.g., enabled bool → admin_status string). 3. table_xfmr: dynamically selects table (e.g., PORT vs PORTCHANNEL). 4. subtree_xfmr: full manual control over a complex subtree. Use the least powerful one that solves the problem.",
            ],
            [
              "How does a field transformer work? Give an example.",
              "A field_xfmr translates field values between OC and SONiC schemas. Example: YangToDb_intf_enabled_xfmr reads OC 'enabled: true/false' (bool) and returns SONiC 'admin_status: up/down' (string). The reverse DbToYang_intf_enabled_xfmr reads 'up'/'down' and returns true/false. Annotations reference these by name.",
            ],
            [
              "What is XfmrParams?",
              "XfmrParams is the context struct passed to every transformer callback. It contains: d (CONFIG_DB handle), ygRoot (full OpenConfig tree), uri (current OC path), oper (CREATE/UPDATE/DELETE/GET), key (redis key hint), dbDataMap (accumulator for results). Callbacks read/write these fields to perform translation.",
            ],
            [
              "How does Transformer decide which table to use for /interfaces/interface?",
              "Via a table_xfmr callback (e.g., intf_table_xfmr). The callback inspects the interface name: if it starts with 'Ethernet', return PORT; if 'PortChannel', return PORTCHANNEL; if 'Vlan', return VLAN. This runtime decision allows one OC path to map to multiple SONiC tables based on the key.",
            ],
            [
              "What happens if a transformer callback is not registered?",
              "Runtime panic: 'transformer function <name> not found'. Annotations reference callbacks by string name. If XlateFuncBind wasn't called in init() for that name, Transformer can't find it. The fix: add XlateFuncBind(\"YangToDb_foo_xfmr\", YangToDb_foo_xfmr) to the init() function.",
            ],
            [
              "How does Transformer interact with CVL?",
              "Transformer builds the DB map (table → key → fields) from the OpenConfig request. It then calls CVL.ValidateEditConfig(dbDataMap). If CVL returns CVL_SUCCESS, Transformer writes to CONFIG_DB. If CVL returns an error, Transformer aborts the write and returns a 400 to the REST client with the CVL error details.",
            ],
            [
              "When would you write a subtree transformer instead of field transformers?",
              "When a subtree has complex logic that can't be expressed via simple field mappings. Example: ACL rules with 20+ optional match fields, conditional logic based on protocol type, nested structures. A subtree_xfmr processes the entire subtree and returns the complete DB map, giving full manual control. But they're harder to maintain, so use sparingly.",
            ],
            [
              "How would you debug a Transformer issue where a field isn't being written to CONFIG_DB?",
              "1. Enable GLOG_v=3 or 4 in the container. 2. Tail syslog and grep for 'transformer' and the OC URI. 3. Check if the annotation exists for that field path. 4. If a field_xfmr is referenced, verify it's registered via XlateFuncBind. 5. Check the callback logic (nil-checks, field extraction). 6. Inspect the DB map logged before CVL — is the field present? If yes, check CVL validation. If no, the transformer logic is the issue.",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Transformer purpose", "Generic OC ↔ SONiC translation, replaces hand-written app modules"],
            ["Two flows", "YangToDb (SET: OC→redis) · DbToYang (GET: redis→OC)"],
            ["YangToDb output", "map[string]map[string]db.Value (table → key → fields)"],
            ["4 xfmr types", "key_xfmr · field_xfmr · table_xfmr · subtree_xfmr"],
            ["key_xfmr", "Transforms OC key format to SONiC key (e.g., NTP server address)"],
            ["field_xfmr", "Transforms field value (e.g., enabled bool → admin_status up/down)"],
            ["table_xfmr", "Dynamically selects table (PORT vs PORTCHANNEL by name prefix)"],
            ["subtree_xfmr", "Full manual control, complex logic, escape hatch (use sparingly)"],
            ["XfmrParams", "Context: d, ygRoot, uri, oper, key, dbDataMap"],
            ["Registration", "XlateFuncBind(\"name\", funcPtr) in init(), maps string→func"],
            ["Debug tool", "GLOG_v=3, tail syslog | grep transformer, trace annotation lookups"],
            ["Common panic", "nil map assignment → always init dbDataMap[table] before write"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
