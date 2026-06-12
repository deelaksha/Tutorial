"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "ValidateEditConfig: three gates",
  nodes: [
    { id: "req", icon: "📨", label: "Edit request", sub: "table·key·fields", x: 6, y: 50, color: "#22d3ee" },
    { id: "syntax", icon: "🔤", label: "Syntax gate", sub: "type·range·pattern", x: 26, y: 50, color: "#a78bfa" },
    { id: "semantic", icon: "🧠", label: "Semantic gate", sub: "must · when", x: 46, y: 22, color: "#34d399" },
    { id: "dep", icon: "🔗", label: "Dependency gate", sub: "leafref lookups", x: 46, y: 78, color: "#fbbf24" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB read", sub: "cache + live", x: 66, y: 50, color: "#fb923c" },
    { id: "pass", icon: "✅", label: "CVL_SUCCESS", sub: "write allowed", x: 86, y: 25, color: "#34d399" },
    { id: "fail", icon: "❌", label: "CVL error", sub: "reject + reason", x: 86, y: 75, color: "#f87171" },
  ],
  edges: [
    { id: "req-syntax", from: "req", to: "syntax", color: "#a78bfa" },
    { id: "syntax-semantic", from: "syntax", to: "semantic", color: "#34d399" },
    { id: "syntax-dep", from: "syntax", to: "dep", color: "#fbbf24" },
    { id: "semantic-redis", from: "semantic", to: "redis", color: "#fb923c" },
    { id: "dep-redis", from: "dep", to: "redis", color: "#fb923c" },
    { id: "redis-pass", from: "redis", to: "pass", color: "#34d399" },
    { id: "syntax-fail", from: "syntax", to: "fail", color: "#f87171", bend: 15 },
    { id: "dep-fail", from: "dep", to: "fail", color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Add VLAN member — all gates pass",
      command: "CREATE VLAN_MEMBER|Vlan100|Ethernet0 tagging_mode=untagged",
      steps: [
        { node: "req", paths: ["req-syntax"], text: "Request: OP_CREATE, table=VLAN_MEMBER, key=Vlan100|Ethernet0, data={tagging_mode: untagged}. CVL starts validation." },
        { node: "syntax", paths: ["syntax-semantic", "syntax-dep"], text: "Syntax gate: Check field 'tagging_mode' exists in YANG schema, type is enum, value 'untagged' is valid enum member. PASS." },
        { node: "semantic", paths: ["semantic-redis"], text: "Semantic gate: Evaluate must/when constraints (e.g., only one untagged VLAN per port). Check XPath expressions. PASS." },
        { node: "dep", paths: ["dep-redis"], text: "Dependency gate: leafref checks. Field 'name' references VLAN table → query redis EXISTS VLAN|Vlan100. Field 'port' → EXISTS PORT|Ethernet0." },
        { node: "redis", paths: ["redis-pass"], text: "CONFIG_DB reads: VLAN|Vlan100 exists (vlanid=100). PORT|Ethernet0 exists. Both leafrefs satisfied." },
        { node: "pass", paths: [], text: "All gates passed. CVL returns CVL_SUCCESS. The write proceeds to CONFIG_DB. VLAN_MEMBER|Vlan100|Ethernet0 created." },
      ],
    },
    {
      id: "range",
      name: "❌ vlanid 5000 — range failure",
      command: "CREATE VLAN|Vlan5000 vlanid=5000",
      steps: [
        { node: "req", paths: ["req-syntax"], text: "Request: table=VLAN, key=Vlan5000, data={vlanid: 5000}. CVL loads sonic-vlan.yang schema." },
        { node: "syntax", paths: ["syntax-fail"], text: "Syntax gate: Field 'vlanid' has type uint16 range 1..4094. Value 5000 is OUT OF RANGE." },
        { node: "fail", paths: [], text: "CVL returns CVL_SYNTAX_ERROR: {TableName: VLAN, Field: vlanid, ErrCode: CVL_SYNTAX_ERROR, Msg: 'Value 5000 out of range 1..4094'}. Write REJECTED." },
      ],
    },
    {
      id: "missing-dep",
      name: "🔗 Member port missing — dependency failure",
      command: "CREATE VLAN_MEMBER|Vlan100|Ethernet999 (port doesn't exist)",
      steps: [
        { node: "req", paths: ["req-syntax"], text: "Request: VLAN_MEMBER with port=Ethernet999. CVL validates." },
        { node: "syntax", paths: ["syntax-dep"], text: "Syntax: field 'port' exists, type is leafref. Syntax OK, move to dependency gate." },
        { node: "dep", paths: ["dep-redis"], text: "Dependency gate: leafref path points to PORT table. CVL queries redis: EXISTS PORT|Ethernet999." },
        { node: "redis", paths: ["dep-fail"], text: "CONFIG_DB read: PORT|Ethernet999 does NOT exist. Leafref constraint VIOLATED." },
        { node: "fail", paths: [], text: "CVL returns CVL_SEMANTIC_DEPENDENT_DATA_MISSING: {TableName: VLAN_MEMBER, Keys: Vlan100|Ethernet999, Field: port, Msg: 'Referenced entry PORT|Ethernet999 not found'}. REJECTED." },
      ],
    },
  ],
};

const NAV = [
  { id: "what-cvl", label: "What CVL Is — The Gatekeeper" },
  { id: "api", label: "The CVL API — ValidateEditConfig" },
  { id: "syntax", label: "Syntax Layer — Type · Range · Pattern" },
  { id: "semantic", label: "Semantic Layer — must · when" },
  { id: "dependency", label: "Dependency Layer — leafref Lookups ⭐" },
  { id: "errors", label: "CVL Error Structure & Codes" },
  { id: "cache", label: "How CVL Reads CONFIG_DB — Caching" },
  { id: "walkthrough", label: "Full Example — VLAN_MEMBER Validation" },
  { id: "debugging", label: "Debugging — CVL Tracing & Logs" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function CvlPage() {
  return (
    <TopicShell
      icon="🛡️"
      title="CVL — The Gatekeeper of CONFIG_DB"
      gradientWord="CVL"
      subtitle="CVL (Common Validation Library) is the schema enforcement engine — it compiles SONiC YANG models and validates EVERY CONFIG_DB write against type constraints, ranges, patterns, must/when logic, and cross-table leafref dependencies. Without CVL, redis would accept garbage. With CVL, only valid, consistent state enters CONFIG_DB."
      nav={NAV}
      badges={["3-layer validation", "leafref = FK check", "redis cache", "Go API", "libyang engine"]}
      next={{ icon: "🔁", label: "Transformer", href: "/sonic/transformer" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-cvl" number="01" title="What CVL Is — The Gatekeeper of CONFIG_DB">
        <P>
          Redis has NO built-in schema. You can write <IC>SET foo bar</IC> and redis accepts it without
          question. CONFIG_DB is redis database 4 — without a gatekeeper, any app could write{" "}
          <IC>HSET VLAN|Vlan100 vlanid 9999</IC> (invalid), <IC>HSET VLAN_MEMBER|Vlan100|Ethernet999
          ...</IC> (port doesn&apos;t exist), or delete a VLAN while members still reference it. The
          result: orchagent crashes, SAI fails, the switch is broken.
        </P>
        <P>
          <strong>CVL is the gatekeeper</strong> — a validation library that sits BETWEEN every write
          request and CONFIG_DB. It compiles SONiC YANG models (sonic-vlan.yang, sonic-port.yang, etc.)
          into an in-memory schema, then validates every proposed write against:
        </P>
        <CodeBlock
          title="cvl_three_layers.txt"
          runnable={false}
          code={`1. SYNTAX layer:    type checks (uint16 vs string), range (1..4094),
                     pattern (regex), enum membership
2. SEMANTIC layer:  must/when XPath expressions (custom constraints)
3. DEPENDENCY layer: leafref lookups (foreign keys) — queries CONFIG_DB
                     to ensure referenced entries exist

CVL flow: request → syntax → semantic → dependency → SUCCESS or ERROR
          (all 3 layers must pass)`}
        />
        <Callout type="analogy">
          Think of CVL as a database CHECK constraint + foreign key enforcement layer for redis. Just like
          Postgres won&apos;t let you INSERT a row with a FK pointing to a non-existent parent, CVL
          won&apos;t let you write VLAN_MEMBER referencing a missing VLAN or PORT.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="api" number="02" title="The CVL API — ValidateEditConfig">
        <P>
          CVL is a Go library (<IC>sonic-mgmt-common/cvl</IC>) with a simple API. The core function:
        </P>
        <CodeBlock
          title="cvl_api.go"
          runnable={false}
          code={`import "github.com/Azure/sonic-mgmt-common/cvl"

type CVLEditConfigData struct {
    VType    cvl.CVLValidationType  // VALIDATE_ALL | VALIDATE_SYNTAX | VALIDATE_SEMANTICS
    VOp      cvl.CVLOperation       // OP_CREATE | OP_UPDATE | OP_DELETE
    Key      string                 // redis key: "VLAN|Vlan100"
    Data     map[string]string      // hash fields: {"vlanid": "100"}
}

// main validation function
func (c *CVL) ValidateEditConfig(
    sess []CVLEditSession,
    data []CVLEditConfigData,
) (CVLErrorInfo, CVLRetCode)

// return: CVL_SUCCESS or error with details`}
        />
        <P>Example call:</P>
        <CodeBlock
          title="cvl_example_call.go"
          runnable={false}
          code={`cv := cvl.ValidationSessOpen()
defer cv.ValidationSessClose()

data := []cvl.CVLEditConfigData{{
    VType: cvl.VALIDATE_ALL,
    VOp:   cvl.OP_CREATE,
    Key:   "VLAN|Vlan100",
    Data:  map[string]string{"vlanid": "100"},
}}

errObj, ret := cv.ValidateEditConfig(nil, data)
if ret != cvl.CVL_SUCCESS {
    log.Errorf("CVL failed: %v", errObj)
    // errObj has ErrCode, TableName, Keys, Field, Msg, ConstraintErrMsg
}`}
        />
        <Callout type="behind">
          ⚙️ CVL is stateless per request — you open a session, validate, close. It reads CONFIG_DB for
          dependency checks (and caches results). The Transformer (next topic) calls CVL before every
          CONFIG_DB write. If CVL returns error, the write is aborted and the error is returned to the
          REST client as a 400.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="syntax" number="03" title="Syntax Layer — Type · Range · Pattern · Enum">
        <P>The first gate: does the data match the YANG type definition?</P>
        <CodeBlock
          title="syntax_checks.txt"
          runnable={false}
          code={`CHECK                   YANG DEFINITION                   CVL ACTION
────────────────────────────────────────────────────────────────────────
type match              leaf vlanid { type uint16; }      reject if not uint16
range                   type uint16 { range 1..4094; }    reject 0, 5000, -1
pattern (regex)         type string {                     reject "VLAN100"
                          pattern 'Vlan[0-9]+';            (must be Vlan<num>)
                        }
enum membership         type enumeration {                reject "auto"
                          enum tagged;                    (only tagged|untagged)
                          enum untagged;
                        }
mandatory               leaf vlanid { mandatory true; }   reject if field missing
default value           leaf admin_status {               if omitted, CVL fills
                          type string;                    "up"
                          default "up";
                        }`}
        />
        <P>Real example from <IC>sonic-vlan.yang</IC>:</P>
        <CodeBlock
          title="sonic-vlan.yang syntax constraints"
          runnable={false}
          code={`leaf name {
  type string {
    pattern 'Vlan(409[0-4]|40[0-8][0-9]|[1-3][0-9]{3}|[1-9][0-9]{0,2})';
  }
}
// CVL will reject "VLAN100" (uppercase), "Vlan5000" (out of regex range)

leaf vlanid {
  type uint16 { range "1..4094"; }
  mandatory true;
}
// CVL will reject vlanid=0, vlanid=5000, or missing vlanid field`}
        />
        <P>CVL error for range violation:</P>
        <CodeBlock
          title="cvl error output"
          runnable={false}
          code={`CVLErrorInfo{
  ErrCode:         CVL_SYNTAX_ERROR,
  TableName:       "VLAN",
  Keys:            []string{"Vlan100"},
  Field:           "vlanid",
  Value:           "5000",
  Msg:             "Range constraint failed: value 5000 not in range 1..4094",
  ConstraintErrMsg: "vlanid must be between 1 and 4094",
}`}
        />
      </Section>

      {/* 04 */}
      <Section id="semantic" number="04" title="Semantic Layer — must · when XPath Constraints">
        <P>
          The YANG <IC>must</IC> and <IC>when</IC> statements define custom logic constraints. CVL
          evaluates them as XPath expressions against the candidate data tree.
        </P>
        <CodeBlock
          title="must_example.yang"
          runnable={false}
          code={`// Example: NTP source interface must exist in PORT table
leaf src_intf {
  type leafref { path "/sonic-port:sonic-port/sonic-port:PORT/sonic-port:PORT_LIST/sonic-port:name"; }
  must "current() = 'Management0' or starts-with(current(), 'Ethernet')" {
    error-message "NTP source interface must be Management0 or EthernetX";
  }
}

// Example: only one untagged VLAN per port
must "not(../VLAN_MEMBER_LIST[port=current()/../port and tagging_mode='untagged'])" {
  error-message "Port already has an untagged VLAN";
}`}
        />
        <P>CVL evaluates these at validation time:</P>
        <CodeBlock
          title="must_evaluation_flow.txt"
          runnable={false}
          code={`1. CVL builds an in-memory data tree from the request + existing CONFIG_DB state
2. For each 'must' constraint, CVL evaluates the XPath expression
3. If expression returns FALSE → CVL_SEMANTIC_ERROR with the error-message
4. If TRUE → continue to next constraint

Example failure:
  Request: NTP src_intf = "Loopback0"
  must: starts-with('Loopback0', 'Ethernet') → FALSE
  CVL error: CVL_SEMANTIC_ERROR, Msg="NTP source interface must be Management0 or EthernetX"`}
        />
        <Callout type="tip">
          💡 Interview insight: &quot;The must statement is like a SQL CHECK constraint but in XPath.
          CVL evaluates it in-memory against the proposed change + current state. This is how SONiC
          enforces rules like &apos;only one untagged VLAN per port&apos; — the logic lives in YANG, not
          scattered across C++ modules.&quot;
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="dependency" number="05" title="Dependency Layer — leafref Lookups (Foreign Keys) ⭐">
        <P>
          The <IC>leafref</IC> type is YANG&apos;s foreign key. A field with <IC>type leafref</IC> must
          reference an existing entry in another table. CVL enforces this by querying CONFIG_DB.
        </P>
        <CodeBlock
          title="leafref_example.yang"
          runnable={false}
          code={`// VLAN_MEMBER port field references PORT table
leaf port {
  type leafref {
    path "/sonic-port:sonic-port/sonic-port:PORT/sonic-port:PORT_LIST/sonic-port:name";
  }
}

// CVL validation logic (pseudo-code):
if field.type == leafref {
    refKey := buildRedisKey(field.leafrefPath, field.value)  // "PORT|Ethernet0"
    exists := redis.EXISTS(refKey)
    if !exists {
        return CVL_SEMANTIC_DEPENDENT_DATA_MISSING
    }
}`}
        />
        <P>Real walkthrough: adding VLAN_MEMBER with a missing port:</P>
        <CodeBlock
          title="leafref_validation_trace.txt"
          runnable={false}
          code={`Request: OP_CREATE VLAN_MEMBER|Vlan100|Ethernet999
Data: {tagging_mode: "untagged"}

CVL steps:
1. Load VLAN_MEMBER schema from sonic-vlan.yang
2. Field 'port' (from key Ethernet999) has type leafref → /PORT/PORT_LIST/name
3. CVL queries CONFIG_DB: redis-cli -n 4 EXISTS PORT|Ethernet999
4. Result: 0 (does not exist)
5. CVL returns:
   CVLErrorInfo{
     ErrCode:   CVL_SEMANTIC_DEPENDENT_DATA_MISSING,
     TableName: "VLAN_MEMBER",
     Keys:      []string{"Vlan100", "Ethernet999"},
     Field:     "port",
     Msg:       "Dependent data PORT|Ethernet999 not found in CONFIG_DB",
   }
6. Write REJECTED — VLAN_MEMBER not created`}
        />
        <P>Same for DELETE protection (reverse dependency):</P>
        <CodeBlock
          title="delete_protection.txt"
          runnable={false}
          code={`Request: OP_DELETE VLAN|Vlan100

CVL checks:
1. Are there any VLAN_MEMBER entries referencing Vlan100?
2. Query: KEYS VLAN_MEMBER|Vlan100|*
3. If results exist → CVL_SEMANTIC_ERROR: "Cannot delete VLAN with existing members"
4. User must delete VLAN_MEMBER entries first, then delete VLAN

This is the "referential integrity" layer for CONFIG_DB.`}
        />
        <Callout type="behind">
          ⚙️ CVL caches CONFIG_DB reads within a validation session to avoid repeated queries. If you
          validate 10 VLAN_MEMBER creates in one batch, CVL fetches the VLAN and PORT tables ONCE, then
          validates all 10 against the cached data.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="errors" number="06" title="CVL Error Structure & Error Codes">
        <P>CVL returns structured errors with actionable details:</P>
        <CodeBlock
          title="cvl_error_info.go"
          runnable={false}
          code={`type CVLErrorInfo struct {
    ErrCode          CVLRetCode         // error category code
    TableName        string             // table being validated
    Keys             []string           // redis key components
    Field            string             // field that failed
    Value            string             // value attempted
    Msg              string             // human-readable message
    ConstraintErrMsg string             // custom message from YANG error-message
    CVLErrDetails    []CVLErrorInfo     // nested errors (batch)
}`}
        />
        <P>Common error codes:</P>
        <Table
          head={["CVLRetCode", "Meaning", "Example trigger"]}
          rows={[
            [
              <IC key="1">CVL_SUCCESS</IC>,
              "Validation passed",
              "All gates OK, write allowed",
            ],
            [
              <IC key="2">CVL_SYNTAX_ERROR</IC>,
              "Type / range / pattern / enum violation",
              "vlanid=5000 (out of range 1..4094)",
            ],
            [
              <IC key="3">CVL_SYNTAX_INVALID_FIELD</IC>,
              "Field not defined in YANG schema",
              "VLAN|Vlan100 foo=bar (foo not in schema)",
            ],
            [
              <IC key="4">CVL_SEMANTIC_ERROR</IC>,
              "must / when constraint failed",
              "must expression returned false",
            ],
            [
              <IC key="5">CVL_SEMANTIC_DEPENDENT_DATA_MISSING</IC>,
              "leafref target does not exist",
              "VLAN_MEMBER port references missing PORT",
            ],
            [
              <IC key="6">CVL_KEY_NOT_EXIST</IC>,
              "Tried to UPDATE/DELETE non-existent key",
              "OP_UPDATE VLAN|Vlan999 (doesn't exist)",
            ],
            [
              <IC key="7">CVL_INTERNAL_UNKNOWN</IC>,
              "CVL internal error (rare)",
              "libyang crash, schema corrupt",
            ],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Common mistake: treating all CVL errors as &quot;validation failed&quot; generically. The
          ErrCode tells you WHICH layer failed — syntax errors (bad data format) vs semantic (constraint
          logic) vs dependency (missing FK). The Field and ConstraintErrMsg tell you WHAT to fix. Always
          log the full CVLErrorInfo.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="cache" number="07" title="How CVL Reads CONFIG_DB — Caching Strategy">
        <P>
          CVL queries CONFIG_DB for dependency checks (leafref, reverse lookups). To avoid performance
          hits, it caches table data within a validation session.
        </P>
        <CodeBlock
          title="cvl_cache_flow.txt"
          runnable={false}
          code={`Session starts:
  cv := cvl.ValidationSessOpen()

First leafref to PORT table:
  1. CVL: "Need to validate port=Ethernet0"
  2. CVL reads entire PORT table: KEYS PORT|* → cache all entries
  3. Lookups for this session now hit cache (no redis query)

Validation completes:
  cv.ValidationSessClose()  → cache discarded

Why this works:
  - Validation is synchronous, sub-millisecond
  - CONFIG_DB changes rarely (human-speed, not packet-speed)
  - Batch creates (e.g., 10 VLAN_MEMBERs) hit cache, not redis 10x

Cache invalidation:
  - New session = fresh cache (reads live CONFIG_DB)
  - Long-running daemons re-open session for each request`}
        />
        <Callout type="note">
          📌 CVL does NOT write to CONFIG_DB — it only validates. The caller (Transformer, or app code)
          writes to redis AFTER CVL returns CVL_SUCCESS. This separation keeps CVL stateless and
          reusable.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="walkthrough" number="08" title="Full Example — VLAN_MEMBER Validation (Go test style)">
        <P>Complete Go snippet showing CVL in action:</P>
        <CodeBlock
          title="cvl_vlan_member_test.go"
          runnable={false}
          code={`package main

import (
    "fmt"
    "github.com/Azure/sonic-mgmt-common/cvl"
)

func main() {
    // Assume CONFIG_DB already has:
    //   VLAN|Vlan100 → {vlanid: 100}
    //   PORT|Ethernet0 → {admin_status: up}

    cv := cvl.ValidationSessOpen()
    defer cv.ValidationSessClose()

    // Attempt 1: valid VLAN_MEMBER
    data1 := []cvl.CVLEditConfigData{{
        VType: cvl.VALIDATE_ALL,
        VOp:   cvl.OP_CREATE,
        Key:   "VLAN_MEMBER|Vlan100|Ethernet0",
        Data:  map[string]string{"tagging_mode": "untagged"},
    }}
    errObj, ret := cv.ValidateEditConfig(nil, data1)
    fmt.Printf("Test 1: %v (expected CVL_SUCCESS)\\n", ret)

    // Attempt 2: missing VLAN (Vlan999 doesn't exist)
    data2 := []cvl.CVLEditConfigData{{
        VType: cvl.VALIDATE_ALL,
        VOp:   cvl.OP_CREATE,
        Key:   "VLAN_MEMBER|Vlan999|Ethernet0",
        Data:  map[string]string{"tagging_mode": "tagged"},
    }}
    errObj, ret = cv.ValidateEditConfig(nil, data2)
    fmt.Printf("Test 2: %v\\n", ret)
    fmt.Printf("Error: %+v\\n", errObj)
    // Expected: CVL_SEMANTIC_DEPENDENT_DATA_MISSING
    // Field: "name" (the VLAN key), Msg: "...VLAN|Vlan999 not found"

    // Attempt 3: missing PORT
    data3 := []cvl.CVLEditConfigData{{
        VType: cvl.VALIDATE_ALL,
        VOp:   cvl.OP_CREATE,
        Key:   "VLAN_MEMBER|Vlan100|Ethernet999",
        Data:  map[string]string{"tagging_mode": "untagged"},
    }}
    errObj, ret = cv.ValidateEditConfig(nil, data3)
    fmt.Printf("Test 3: %v\\n", ret)
    fmt.Printf("Error: Field=%s, Msg=%s\\n", errObj.Field, errObj.Msg)
    // Expected: CVL_SEMANTIC_DEPENDENT_DATA_MISSING, Field="port"

    // Attempt 4: invalid tagging_mode
    data4 := []cvl.CVLEditConfigData{{
        VType: cvl.VALIDATE_ALL,
        VOp:   cvl.OP_CREATE,
        Key:   "VLAN_MEMBER|Vlan100|Ethernet0",
        Data:  map[string]string{"tagging_mode": "auto"},  // not in enum
    }}
    errObj, ret = cv.ValidateEditConfig(nil, data4)
    fmt.Printf("Test 4: %v\\n", ret)
    // Expected: CVL_SYNTAX_ERROR, Field="tagging_mode", Msg="...not in enum"
}`}
        />
        <CodeBlock
          title="expected output"
          runnable={false}
          code={`Test 1: CVL_SUCCESS (expected CVL_SUCCESS)
Test 2: CVL_SEMANTIC_DEPENDENT_DATA_MISSING
Error: CVLErrorInfo{ErrCode:CVL_SEMANTIC_DEPENDENT_DATA_MISSING TableName:"VLAN_MEMBER" Keys:["Vlan999","Ethernet0"] Field:"name" Msg:"Dependent data VLAN|Vlan999 not found"}
Test 3: CVL_SEMANTIC_DEPENDENT_DATA_MISSING
Error: Field=port, Msg=Dependent data PORT|Ethernet999 not found
Test 4: CVL_SYNTAX_ERROR`}
        />
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging — CVL Tracing & Logs">
        <P>CVL logs to syslog. Enable tracing for detailed validation steps:</P>
        <CodeBlock
          title="cvl_cfg.json (in mgmt-framework container)"
          runnable={false}
          code={`{
  "TRACE_LEVEL": "TRACE_CACHE",
  "TRACE_SYNTAX": true,
  "TRACE_SEMANTIC": true,
  "TRACE_ONERROR": true,
  "LOG_LEVEL": 4
}

// TRACE_LEVEL values:
// TRACE_CACHE      - cache hits/misses
// TRACE_LIBYANG    - libyang internals
// TRACE_YPARSER    - YANG parsing
// TRACE_CREATE, TRACE_UPDATE, TRACE_DELETE - per-operation`}
        />
        <CodeBlock
          title="viewing CVL logs"
          code={`docker exec mgmt-framework tail -f /var/log/syslog | grep CVL`}
          output={`Dec 15 10:23:45 sonic CVL[1234]: TRACE_SYNTAX: Validating field vlanid, value 100, type uint16
Dec 15 10:23:45 sonic CVL[1234]: TRACE_CACHE: Reading table PORT from CONFIG_DB
Dec 15 10:23:45 sonic CVL[1234]: TRACE_SEMANTIC: Evaluating leafref /sonic-port:PORT/PORT_LIST/name
Dec 15 10:23:45 sonic CVL[1234]: TRACE_ONERROR: Validation failed, ErrCode=CVL_SEMANTIC_DEPENDENT_DATA_MISSING`}
        />
        <P>Environment variable override:</P>
        <CodeBlock
          title="bash (inside container)"
          code={`export CVL_DEBUG=1
export CVL_SCHEMA_PATH=/usr/models/yang/sonic
# restart REST server or run test code`}
        />
        <Callout type="tip">
          💡 When debugging a mysterious CVL failure, check: 1. Is the YANG file loaded? (ls
          /usr/models/yang/sonic/sonic-&lt;table&gt;.yang) 2. Is the .yin compiled? (ls
          /usr/sbin/schema/) 3. Enable TRACE_ONERROR and grep syslog for the exact constraint that
          failed.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise — Craft Invalid Payloads">
        <P>Exercise: predict which CVL error each request triggers.</P>
        <CodeBlock
          title="lab_requests.txt"
          runnable={false}
          code={`Assume CONFIG_DB state:
  PORT|Ethernet0 → {admin_status: up}
  VLAN|Vlan100 → {vlanid: 100}

Request 1: OP_CREATE VLAN|Vlan200 {vlanid: "200"}
Request 2: OP_CREATE VLAN|Vlan50 {vlanid: "0"}
Request 3: OP_CREATE VLAN|Vlan100 {vlanid: "100"}
Request 4: OP_CREATE VLAN_MEMBER|Vlan100|Ethernet0 {tagging_mode: "untagged"}
Request 5: OP_CREATE VLAN_MEMBER|Vlan200|Ethernet0 {tagging_mode: "tagged"}
Request 6: OP_DELETE VLAN|Vlan100 (while VLAN_MEMBER|Vlan100|Ethernet0 exists)
Request 7: OP_CREATE VLAN|Vlan100 {unknown_field: "foo"}`}
        />
        <P>Answers:</P>
        <CodeBlock
          title="lab_answers.txt"
          runnable={false}
          code={`Request 1: CVL_SUCCESS (valid vlanid, unique key)
Request 2: CVL_SYNTAX_ERROR (vlanid=0 violates range 1..4094)
Request 3: CVL_KEY_ALREADY_EXIST or similar (OP_CREATE on existing key)
Request 4: CVL_SUCCESS (VLAN and PORT exist, tagging_mode valid)
Request 5: CVL_SEMANTIC_DEPENDENT_DATA_MISSING (VLAN|Vlan200 doesn't exist)
Request 6: CVL_SEMANTIC_ERROR (reverse dependency: VLAN has members, delete blocked)
Request 7: CVL_SYNTAX_INVALID_FIELD (unknown_field not in sonic-vlan.yang schema)`}
        />
        <P>Lab step: run these in a real SONiC instance via RESTCONF and observe the 400 errors.</P>
        <CodeBlock
          title="restconf test (bash)"
          code={`curl -X POST https://sonic-ip/restconf/data/sonic-vlan:sonic-vlan/VLAN/VLAN_LIST \\
  -H "Content-Type: application/yang-data+json" \\
  -d '{"sonic-vlan:VLAN_LIST": [{"name": "Vlan50", "vlanid": 0}]}' \\
  -u admin:YourPaSsWoRd -k`}
          output={`HTTP/1.1 400 Bad Request
{
  "ietf-restconf:errors": {
    "error": [{
      "error-type": "application",
      "error-tag": "invalid-value",
      "error-message": "CVL_SYNTAX_ERROR: vlanid value 0 out of range 1..4094"
    }]
  }
}`}
        />
      </Section>

      {/* 11 */}
      <Section id="interview" number="11" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is CVL and why does SONiC need it?",
              "CVL (Common Validation Library) is the schema enforcement engine for CONFIG_DB. Redis has no built-in schema, so CVL compiles SONiC YANG models and validates every write against type constraints, ranges, patterns, must/when logic, and cross-table leafref dependencies. Without CVL, CONFIG_DB would accept inconsistent data.",
            ],
            [
              "What are the three validation layers in CVL?",
              "1. Syntax layer: type, range, pattern, enum, mandatory checks. 2. Semantic layer: must/when XPath constraints (custom logic). 3. Dependency layer: leafref lookups (foreign key checks via CONFIG_DB queries). All three must pass for CVL_SUCCESS.",
            ],
            [
              "How does CVL enforce a leafref constraint?",
              "A leafref is like a foreign key. When CVL sees type leafref, it extracts the referenced table and key from the XPath, queries CONFIG_DB (e.g., EXISTS PORT|Ethernet0), and returns CVL_SEMANTIC_DEPENDENT_DATA_MISSING if the target doesn't exist. This ensures referential integrity.",
            ],
            [
              "What is CVL_SEMANTIC_DEPENDENT_DATA_MISSING?",
              "The error returned when a leafref target is missing. Example: creating VLAN_MEMBER with port=Ethernet999, but PORT|Ethernet999 doesn't exist in CONFIG_DB. CVL queries redis, finds it missing, and rejects the write with this error code.",
            ],
            [
              "How does CVL handle DELETE operations with dependencies?",
              "CVL checks reverse dependencies. If you try to delete VLAN|Vlan100 but VLAN_MEMBER entries reference it, CVL returns CVL_SEMANTIC_ERROR (or a dependency error). The user must delete dependent entries first. This is enforced via YANG must constraints or reverse leafref lookups.",
            ],
            [
              "Why does CVL cache CONFIG_DB reads?",
              "For performance. During a validation session, CVL may check dozens of leafrefs. Instead of querying redis for EVERY leafref (PORT|Ethernet0, PORT|Ethernet4, ...), CVL reads the entire PORT table ONCE and caches it. The cache is session-scoped and discarded after validation completes.",
            ],
            [
              "How does CVL differ from OpenConfig validation?",
              "CVL validates against SONiC YANG (the native CONFIG_DB schema). OpenConfig validation would validate against OC models. In the SONiC stack, the Transformer translates OC → SONiC YANG, then CVL validates the SONiC YANG data. Only SONiC YANG has the exact 1:1 mapping to redis keys/fields.",
            ],
            [
              "What happens if a YANG model is missing at CVL runtime?",
              "CVL won't have a schema for that table. Writes to that table will likely return CVL_INTERNAL_UNKNOWN or be rejected as unknown. The schema files must exist in /usr/models/yang/sonic/ and be compiled to .yin in /usr/sbin/schema/. Missing models = no validation = dangerous.",
            ],
            [
              "How would you debug a CVL_SYNTAX_ERROR for an enum field?",
              "1. Find the YANG model: cat /usr/models/yang/sonic/sonic-<table>.yang. 2. Locate the leaf definition, check the enum values. 3. Compare the rejected value — is it a typo? Case mismatch? 4. Check CVL logs (syslog with CVL_DEBUG=1) for the exact error message. The ConstraintErrMsg will tell you the allowed values.",
            ],
            [
              "Can CVL validate multiple edits in one transaction?",
              "Yes. ValidateEditConfig accepts []CVLEditConfigData. CVL validates all in one batch, building a combined candidate tree. This allows validating creates/updates/deletes together (e.g., create VLAN + create VLAN_MEMBER in one call). If any fail, the entire batch is rejected (transactional semantics).",
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["CVL purpose", "Schema enforcement for CONFIG_DB, validates all writes before commit"],
            ["3 layers", "Syntax (type/range/pattern) · Semantic (must/when) · Dependency (leafref)"],
            ["Main API", "ValidateEditConfig(sess, []CVLEditConfigData) → CVLErrorInfo, CVLRetCode"],
            ["CVLEditConfigData", "VType, VOp (CREATE/UPDATE/DELETE), Key, Data map[string]string"],
            ["leafref", "Foreign key constraint, CVL queries CONFIG_DB to verify target exists"],
            ["CVL_SUCCESS", "All 3 validation layers passed, write allowed"],
            ["CVL_SYNTAX_ERROR", "Type/range/pattern/enum violation, bad data format"],
            ["CVL_SEMANTIC_DEPENDENT_DATA_MISSING", "leafref target missing in CONFIG_DB"],
            ["Cache strategy", "Session-scoped, reads entire table once, discarded on close"],
            ["Schema location", "/usr/models/yang/sonic/*.yang (src) /usr/sbin/schema/*.yin (compiled)"],
            ["Debug tracing", "cvl_cfg.json TRACE_ONERROR=true, CVL_DEBUG=1 env var, grep syslog"],
            ["Error structure", "CVLErrorInfo: ErrCode, TableName, Keys, Field, Msg, ConstraintErrMsg"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
