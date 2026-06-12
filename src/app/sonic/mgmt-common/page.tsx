"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Inside sonic-mgmt-common: one SET request&apos;s call stack",
  nodes: [
    { id: "req", icon: "📨", label: "SetRequest", sub: "gNMI/REST", x: 6, y: 50, color: "#22d3ee" },
    { id: "translib", icon: "📚", label: "translib.go", sub: "Update()", x: 24, y: 50, color: "#a78bfa" },
    { id: "app", icon: "🧩", label: "App Module", sub: "common_app.go", x: 42, y: 22, color: "#34d399" },
    { id: "xfmr", icon: "🔁", label: "transformer/", sub: "xlate", x: 42, y: 78, color: "#fbbf24" },
    { id: "cvl", icon: "🛡️", label: "cvl/", sub: "ValidateEditConfig", x: 62, y: 50, color: "#fb923c" },
    { id: "dblayer", icon: "🔗", label: "translib/db", sub: "go-redis", x: 80, y: 22, color: "#60a5fa" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "Redis #4", x: 92, y: 62, color: "#f472b6" },
  ],
  edges: [
    { id: "req-translib", from: "req", to: "translib", color: "#a78bfa" },
    { id: "translib-app", from: "translib", to: "app", color: "#34d399" },
    { id: "translib-xfmr", from: "translib", to: "xfmr", color: "#fbbf24" },
    { id: "app-cvl", from: "app", to: "cvl", color: "#fb923c" },
    { id: "xfmr-cvl", from: "xfmr", to: "cvl", color: "#fb923c" },
    { id: "cvl-dblayer", from: "cvl", to: "dblayer", color: "#60a5fa" },
    { id: "dblayer-redis", from: "dblayer", to: "redis", color: "#f472b6" },
    { id: "cvl-translib", from: "cvl", to: "translib", bend: -30, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Update MTU",
      command: "PATCH /interfaces/Ethernet0/config/mtu → 9100",
      steps: [
        { node: "req", paths: ["req-translib"], text: "Client sends gNMI Set or REST PATCH. Payload is OpenConfig JSON: {\"mtu\": 9100}. The mgmt-framework server deserializes it and calls into translib." },
        { node: "translib", paths: ["translib-app", "translib-xfmr"], text: "translib.Update() receives SetRequest{Path,Payload}. It dispatches to the registered app (IntfApp) OR to transformer engine based on annotations." },
        { node: "app", paths: ["app-cvl"], text: "common_app.go processUpdate() runs. It marshals OpenConfig to SONiC YANG shape using ygot bindings, then sends to CVL for validation." },
        { node: "cvl", paths: ["cvl-dblayer"], text: "CVL ValidateEditConfig() checks: (1) YANG types+ranges (mtu uint16 1280-9216), (2) must constraints, (3) leafref dependencies. All pass." },
        { node: "dblayer", paths: ["dblayer-redis"], text: "translib/db layer calls redis.HSet(\"PORT|Ethernet0\", \"mtu\", \"9100\") against CONFIG_DB instance #4." },
        { node: "redis", paths: [], text: "CONFIG_DB updated. orchagent subscribes to the PORT table, consumes the change, and programs ASIC via SAI. ✅ Success." },
      ],
    },
    {
      id: "failure",
      name: "❌ CVL semantic failure",
      command: "DELETE /vlans/Vlan100 — but members still attached",
      steps: [
        { node: "req", paths: ["req-translib"], text: "Client tries to delete VLAN 100. Payload is a DELETE request for path /openconfig-network-instance:network-instances/network-instance[name=Vlan100]." },
        { node: "translib", paths: ["translib-xfmr"], text: "translib routes to VlanApp transformer. Transformer xlate maps OC path to SONiC YANG DELETE on VLAN|Vlan100." },
        { node: "xfmr", paths: ["xfmr-cvl"], text: "Transformer builds the SONiC YANG delete payload and submits to CVL for dependency check." },
        { node: "cvl", paths: ["cvl-translib"], text: "CVL checks VLAN_MEMBER table. Finds entries VLAN_MEMBER|Vlan100|Ethernet0 and Vlan100|Ethernet4 — leafref constraints violated! Returns error: \"Semantic validation failed: VLAN has members\"." },
        { node: "translib", paths: [], text: "translib bubbles the CVL error back as gRPC FAILED_PRECONDITION or HTTP 409 Conflict. Client receives detailed error JSON with CVL message. ❌ Transaction aborted." },
      ],
    },
    {
      id: "get",
      name: "🔍 GET request reverse",
      command: "GET /interfaces/Ethernet0 → read from Redis",
      steps: [
        { node: "req", paths: ["req-translib"], text: "Client sends gNMI Get or REST GET. translib.Get() invoked with path /openconfig-interfaces:interfaces/interface[name=Ethernet0]." },
        { node: "translib", paths: ["translib-app"], text: "Dispatcher finds IntfApp registered for /interfaces. Calls app.translateGet() to map OC path to SONiC YANG keys: PORT|Ethernet0, PORT_TABLE appDB counters." },
        { node: "app", paths: ["app-cvl"], text: "App reads from Redis via db layer: HGETALL PORT|Ethernet0, HGETALL COUNTERS:oid:0x1000000000001 (via COUNTERS_DB). Skips CVL on read." },
        { node: "dblayer", paths: ["dblayer-redis"], text: "go-redis client executes multi-DB read: CONFIG_DB #4 for config, APPL_DB #0 for runtime state, COUNTERS_DB #2 for statistics." },
        { node: "redis", paths: [], text: "Returns hash: {admin_status:up, mtu:9100, speed:100000, ...}. db layer deserializes into Go structs." },
        { node: "app", paths: [], text: "common_app DbToYang transformer converts SONiC schema to OpenConfig ygot structs: admin_status \"up\" → enabled true. Serializes to JSON/protobuf and returns. ✅ Client receives OpenConfig-compliant response." },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is", label: "What Is sonic-mgmt-common?" },
  { id: "repo-structure", label: "Repository Structure ⭐" },
  { id: "translib", label: "Translib — The Public API ⭐" },
  { id: "apps", label: "App Modules & Registration" },
  { id: "cvl", label: "CVL — The Validation Engine ⭐" },
  { id: "transformer", label: "Transformer — OC ↔ SONiC ⭐" },
  { id: "db-layer", label: "translib/db — Redis Go Client" },
  { id: "build", label: "Build Pipeline: YANG → Go" },
  { id: "debugging", label: "Debugging translib" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function MgmtCommonPage() {
  return (
    <TopicShell
      icon="📦"
      title="mgmt-common — Anatomy of the Brain"
      gradientWord="mgmt-common"
      subtitle="The shared Go library that powers BOTH REST and gNMI servers in SONiC. Translib routes requests, apps transform them, CVL validates them, and transformers bridge OpenConfig ↔ SONiC YANG. The call stack from API request to Redis write — dissected."
      nav={NAV}
      badges={["🧩 Translib deep dive", "🛡️ CVL validation engine", "🔁 Transformer xlate", "🗄️ Multi-DB go-redis", "🔬 Debug lab"]}
      next={{ icon: "🌳", label: "YANG Fundamentals", href: "/sonic/yang" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is" number="01" title="What Is sonic-mgmt-common?">
        <P>
          <IC>sonic-mgmt-common</IC> is the <strong>brain</strong> of SONiC&apos;s management layer — a Go library at <IC>github.com/sonic-net/sonic-mgmt-common</IC> that contains:
        </P>
        <CodeBlock
          title="what_it_is.txt"
          runnable={false}
          code={`📦 github.com/sonic-net/sonic-mgmt-common
   │
   ├─ 🧩 translib/          Go API layer: Update(), Get(), Delete()
   │                        → consumed by BOTH mgmt-framework (REST)
   │                          and sonic-gnmi (gRPC) servers
   ├─ 🛡️ cvl/              Config Validation Library: YANG semantic checks
   │                        (must/when/leafref constraints, dependency graph)
   ├─ 🔁 transformer/       OpenConfig ↔ SONiC YANG translation callbacks
   │                        + xlate engine (path mapping, value transforms)
   ├─ 🗄️ translib/db/       go-redis wrapper for CONFIG_DB/APPL_DB/etc.
   ├─ 🌳 models/yang/       all the YANGs (OpenConfig, IETF, SONiC, annotations)
   └─ 🧰 tools/             pyang plugins + codegen (YANG → ygot Go structs)

WHY IT EXISTS
1. DRY principle: REST server + gNMI server would BOTH need validation,
   DB access, OC→SONiC mapping → extract it into one library ✅
2. SONiC native model (SONiC YANG) is what Redis/orchagent speak
3. Northbound standard is OpenConfig (vendor-neutral for controllers)
   → translib bridges the gap: OC on the wire, SONiC in the DB

the call flow: client → [REST or gNMI server] → translib.Update()
  → app/transformer → CVL validate → db.Set() → Redis CONFIG_DB`}
        />
        <Callout type="analogy">
          Think of a multilingual translator at the UN. Delegates speak different languages (OpenConfig vs SONiC YANG), the translator (translib + transformer) converts between them, and the security guard (CVL) checks that the final document doesn&apos;t violate any rules before filing it (Redis write). One translator serves ALL delegates (both REST and gNMI clients).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="repo-structure" number="02" title="Repository Structure ⭐">
        <P>Let&apos;s walk the critical folders. Clone the repo to follow along:</P>
        <CodeBlock
          title="clone_mgmt_common.sh"
          code={`git clone https://github.com/sonic-net/sonic-mgmt-common.git
cd sonic-mgmt-common
tree -L 2 -d`}
          output={`sonic-mgmt-common/
├── build/                     # build artifacts, generated .go from YANG
├── cvl/                       # Config Validation Library ⭐
│   ├── schema/                # compiled .yin files (pyang output)
│   ├── testdata/              # CVL unit test fixtures
│   └── cvl.go, cvl_api.go     # main validation engine
├── models/
│   └── yang/                  # THE YANG FILES ⭐
│       ├── openconfig/        # cloned from github.com/openconfig/public
│       ├── ietf/              # IETF standard YANGs (ietf-inet-types, etc)
│       ├── sonic/             # SONiC native YANGs (CONFIG_DB schema)
│       └── annotations/       # SONiC deviation/annotation YANGs (map OC→sonic)
├── tools/
│   ├── pyang/                 # pyang plugins (yin output, annotation parser)
│   └── sonic-yangtree/        # codegen tool
├── translib/                  # THE PUBLIC API ⭐
│   ├── translib.go            # Update(), Get(), Subscribe() entry points
│   ├── app_interface.go       # app contract: initialize(), translateUpdate()
│   ├── common_app.go          # generic YANG-driven app (80% of tables use this)
│   ├── db/                    # go-redis wrapper + multi-DB helper
│   ├── ocbinds/               # generated ygot Go structs from OpenConfig YANGs
│   └── transformer/           # xlate engine + per-module xfmr_*.go callbacks
└── Makefile                   # builds: YANG→yin, YANG→ygot, go build`}
        />
        <P>
          The two stars: <IC>/models/yang</IC> contains <strong>all YANGs</strong> (OpenConfig + SONiC + glue), and <IC>/translib</IC> is the <strong>entry API</strong> consumed by servers.
        </P>
        <Callout type="behind">
          ⚙️ <strong>Build order matters:</strong> (1) pyang compiles YANGs to .yin (XML schema), (2) ygot/goyang generates Go structs from OpenConfig YANGs → <IC>translib/ocbinds/</IC>, (3) CVL loads .yin files at runtime for validation. All orchestrated by <IC>make</IC>.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="translib" number="03" title="Translib — The Public API ⭐">
        <P>
          <IC>translib/translib.go</IC> defines the functions that REST and gNMI servers call. Let&apos;s see the real Go signatures:
        </P>
        <CodeBlock
          title="translib/translib.go (excerpts)"
          code={`package translib

import "github.com/openconfig/ygot/ygot"

// SetRequest: client wants to write config (PATCH/PUT/POST or gNMI Set)
type SetRequest struct {
    Path       string            // e.g. "/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu"
    Payload    []byte            // JSON or protobuf payload
    User       UserRoles         // RBAC context
    AuthEnabled bool
    ClientVersion Version
}

type SetResponse struct {
    ErrSrc appErrorSource       // which layer failed: app/transformer/CVL/Redis
    Err    error
}

// THE ENTRY POINT for writes ⭐
func Update(req SetRequest) (SetResponse, error) {
    // 1. parse path → find registered app (IntfApp, VlanApp, ...)
    // 2. call app.translateUpdate(req) → app builds SONiC YANG payload
    // 3. CVL.ValidateEditConfig(payload) → semantic checks
    // 4. if valid: db.StartTx() → HMSET writes → db.CommitTx()
    // 5. return response
}

// GetRequest: client reads state (GET or gNMI Get)
type GetRequest struct {
    Path  string
    User  UserRoles
    // no Payload — it's a read
}

func Get(req GetRequest) (GetResponse, error) {
    // 1. find app
    // 2. app.translateGet() → Redis keys (PORT|Ethernet0, etc)
    // 3. db.GetEntry() multi-DB reads (CONFIG_DB + APPL_DB + COUNTERS_DB)
    // 4. app.DbToYang() → build OpenConfig ygot tree
    // 5. ygot.Marshal(tree) → JSON response
}

// other APIs: Replace(), Delete(), Subscribe() (streaming telemetry)`}
        />
        <P>
          Every northbound request funnels through these. The <IC>Path</IC> is an <strong>OpenConfig XPath</strong> (or SONiC YANG path if using native mode). The <IC>Payload</IC> is YANG-modeled JSON.
        </P>
        <Callout type="tip">
          💡 <strong>Interview gold:</strong> &quot;What&apos;s the difference between translib.Update() and db.SetEntry()?&quot; — translib orchestrates the full stack (app dispatch, CVL validation, transformer calls, transaction rollback on error), while db.SetEntry() is just a thin Redis HMSET wrapper. Never bypass translib in production code!
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="apps" number="04" title="App Modules & Registration">
        <P>
          Apps are <strong>per-feature Go modules</strong> that implement the <IC>appInterface</IC> contract. Each app handles a YANG subtree (e.g., IntfApp owns /interfaces, VlanApp owns /vlans). They register at init time:
        </P>
        <CodeBlock
          title="translib/app_interface.go (contract)"
          code={`type appInterface interface {
    initialize(data appData)                  // setup: load YANG, register paths
    translateCreate(d *db.DB) error           // CREATE: OC JSON → SONiC YANG
    translateUpdate(d *db.DB) error           // UPDATE: same
    translateReplace(d *db.DB) error          // REPLACE: atomic swap
    translateDelete(d *db.DB) error           // DELETE
    translateSubscribe(dbs [maxDB]*db.DB, path string) *notificationInfo
    processCreate(d *db.DB) error             // post-xlate hooks (rare)
    processUpdate(d *db.DB) error
    // ... (get/subscribe variants)
}

// registration in init()
func init() {
    register("/openconfig-interfaces:interfaces",
        &appInfo{
            appType:        reflect.TypeOf(IntfApp{}),
            isNative:       false,   // false = OpenConfig mode
            tablesToWatch: []string{"PORT"},
        })
    register("/openconfig-network-instance:network-instances/network-instance/vlans",
        &appInfo{
            appType:        reflect.TypeOf(VlanApp{}),
            isNative:       false,
            tablesToWatch: []string{"VLAN", "VLAN_MEMBER"},
        })
    // ... 20+ apps for ACL, BGP, NTP, AAA, etc.
}`}
        />
        <P>
          When a request arrives, translib does a <strong>longest-prefix match</strong> on the path to find the owning app, then calls its translate* method. Most apps use <IC>common_app.go</IC> — a generic YANG-driven implementation that auto-generates Redis writes from YANG. Custom apps (like IntfApp for complex interface logic) override the methods.
        </P>
        <CodeBlock
          title="translib/common_app.go (simplified flow)"
          code={`func (app *CommonApp) translateUpdate(d *db.DB) error {
    // 1. unmarshal OC JSON payload → ygot Go struct (ocbinds.OpenconfigInterfaces)
    ocTree := &ocbinds.Device{}
    ygot.Unmarshal(app.ygotRoot, payload)

    // 2. run annotations: OC YANG → SONiC YANG mapping
    //    (annotations are themselves YANG deviation modules)
    sonicPayload := app.annotationXlate(ocTree)

    // 3. build Redis key-value pairs from SONiC YANG
    //    e.g. /sonic-port:PORT/PORT_LIST[port_name=Ethernet0]/mtu
    //    → table=PORT, key=Ethernet0, field=mtu, value=9100
    dbWrites := app.yangToDb(sonicPayload)

    // 4. hand off to CVL + db layer
    return app.applyWithValidation(dbWrites)
}`}
        />
        <Callout type="behind">
          ⚙️ The magic is <strong>annotation YANGs</strong>: they&apos;re YANG deviation modules that declare &quot;OpenConfig leaf X maps to SONiC table Y field Z&quot;. Pyang plugin parses these at build time into Go lookup maps. More in the Transformer section.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="cvl" number="05" title="CVL — The Validation Engine ⭐">
        <P>
          <IC>cvl/</IC> is a <strong>libyang-based C library with Go bindings</strong> that validates Redis writes against SONiC YANG constraints. It catches:
        </P>
        <CodeBlock
          title="what_cvl_validates.txt"
          runnable={false}
          code={`1️⃣ SYNTACTIC (YANG type system)
   • leaf type="uint16" range="1280..9216"  → mtu=99999 ❌
   • pattern "[A-Za-z0-9_-]+"               → vlan name with spaces ❌
   • enumeration {admin_status: up | down}  → admin_status=enabled ❌

2️⃣ SEMANTIC (cross-table dependencies)
   • leafref: VLAN_MEMBER vlan_name → must exist in VLAN table
   • must constraint: ACL rule src_ip requires acl_table_type=L3
   • when conditional: if speed=100000, lane_count must be 4

3️⃣ DEPENDENCY ORDERING
   CVL builds a dependency graph of Redis tables. Deletes are checked
   in reverse order: can't delete VLAN if VLAN_MEMBER points to it.

HOW IT WORKS
 step 1: load compiled .yin schemas (cvl/schema/*.yin) at startup
 step 2: ValidateEditConfig(json_payload) called by translib
 step 3: libyang parses the JSON against SONiC YANG tree
 step 4: for each write, check leafrefs → query current Redis state
         to verify referenced keys exist
 step 5: return PASS or detailed error: "Semantic validation failed:
         Dependent entry VLAN_MEMBER|Vlan100|Ethernet0 exists"`}
        />
        <P>Real CVL code example:</P>
        <CodeBlock
          title="cvl/cvl.go (simplified API)"
          code={`package cvl

type CVL struct {
    yv *libyang.Context    // C libyang handle
    // preloaded SONiC YANG schemas
}

func (c *CVL) ValidateEditConfig(jsonEditCfg string) CVLRetCode {
    // 1. parse JSON → libyang data tree
    root := c.yv.ParseDataMem(jsonEditCfg, libyang.LYD_JSON)

    // 2. validate type constraints (built-in libyang)
    if root.Validate() != libyang.LY_SUCCESS {
        return CVL_SYNTAX_ERROR
    }

    // 3. custom SONiC checks: leafref resolution
    //    walk the tree, for each leafref node:
    for node := range root.IterNodes() {
        if node.Schema().Nodetype() == libyang.LYS_LEAF {
            leafSchema := node.Schema()
            if leafSchema.Type().Base() == libyang.LY_TYPE_LEAFREF {
                refPath := leafSchema.Type().Path()
                // resolve path in Redis: does the key exist?
                if !c.checkLeafrefExists(refPath) {
                    return CVL_SEMANTIC_ERROR  // referenced key missing
                }
            }
        }
    }

    // 4. must/when constraints (XPath eval against current + new state)
    // ...

    return CVL_SUCCESS
}`}
        />
        <P>
          CVL is the <strong>gatekeeper</strong>. No config reaches Redis without passing CVL. This prevents orchagent from seeing invalid state and crashing.
        </P>
        <Callout type="mistake">
          ⚠️ Common dev mistake: writing to CONFIG_DB directly via <IC>redis-cli</IC> in testing, bypassing CVL. The config saves, but orchagent rejects it at runtime → silent failure or crash. Always use <IC>config</IC> CLI or REST API to trigger CVL validation.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="transformer" number="06" title="Transformer — OpenConfig ↔ SONiC YANG ⭐">
        <P>
          The <IC>transformer/</IC> directory is where <strong>OpenConfig paths become SONiC Redis keys</strong>. Two mechanisms:
        </P>
        <CodeBlock
          title="transformer_mechanisms.txt"
          runnable={false}
          code={`MECHANISM 1: ANNOTATION YANGs (declarative)
   File: models/yang/annotations/sonic-*-annot.yang
   Example snippet from sonic-interface-annot.yang:

     deviation /oc-if:interfaces/oc-if:interface/oc-if:config/oc-if:mtu {
       deviate add {
         sonic-ext:table-name "PORT";
         sonic-ext:field-name "mtu";
       }
     }

   Translation: OpenConfig leaf /interfaces/interface/config/mtu
                → SONiC table PORT, field mtu
   Build time: pyang plugin parses this → generates Go map in transformer/

MECHANISM 2: CUSTOM CALLBACKS (imperative Go code)
   File: transformer/xfmr_interface.go (and 15+ other xfmr_*.go)
   When annotation is insufficient (complex logic, 1→N mapping, value transforms):

     func YangToDb_intf_enabled_xfmr(enabled bool) (string, error) {
       if enabled {
         return "up", nil      // OC enabled:true → SONiC admin_status:"up"
       }
       return "down", nil      // OC enabled:false → SONiC admin_status:"down"
     }

   Registered via xlate engine; translib calls these during translateUpdate().

FULL PIPELINE (OC → SONiC)
  OC JSON → ygot unmarshal → OC Go struct → annotation lookup OR
  custom xfmr callback → SONiC YANG struct → CVL validate → Redis HMSET`}
        />
        <P>Example: setting interface MTU end-to-end:</P>
        <CodeBlock
          title="oc_to_sonic_mtu.txt"
          runnable={false}
          code={`INPUT (OpenConfig RESTCONF PATCH)
PATCH /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config
{
  "openconfig-interfaces:config": {
    "mtu": 9100
  }
}

STEP 1: translib receives SetRequest{Path: "/openconfig-interfaces:interfaces...", Payload: ...}
STEP 2: dispatcher finds IntfApp registered for /interfaces
STEP 3: IntfApp.translateUpdate() unmarshal JSON → ocbinds.Interface struct
        ocIntf.Config.Mtu = ygot.Uint16(9100)
STEP 4: annotation lookup: /interfaces/interface/config/mtu → PORT.mtu
STEP 5: build SONiC YANG write:
        {
          "sonic-port:PORT": {
            "PORT_LIST": [
              { "port_name": "Ethernet0", "mtu": 9100 }
            ]
          }
        }
STEP 6: CVL.ValidateEditConfig(sonicYangJSON)
        → checks type: uint16 range 1280-9216 ✅
        → no leafref/must violations ✅
STEP 7: db.StartTx()
        db.SetEntry(&db.Value{Table: "PORT", Key: "Ethernet0", Field: map{"mtu": "9100"}})
        db.CommitTx()
STEP 8: Redis: HMSET PORT|Ethernet0 mtu 9100
        orchagent consumes → SAI call → ASIC programmed ✅

REVERSE (GET): read Redis PORT|Ethernet0 {mtu:9100} → DbToYang transformer
  → SONiC YANG → annotation reverse → OC ygot struct → marshal JSON →
  client receives {"mtu": 9100}`}
        />
        <Callout type="tip">
          💡 <strong>Where to find mappings:</strong> grep the annotation files: <IC>grep -r &quot;table-name.*PORT&quot; models/yang/annotations/</IC> shows all OC leaves that map to the PORT table. For complex transforms, check <IC>transformer/xfmr_*.go</IC> files.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="db-layer" number="07" title="translib/db — The Redis Go Client">
        <P>
          <IC>translib/db/</IC> wraps <IC>github.com/go-redis/redis</IC> with SONiC-specific multi-DB helpers. Key functions:
        </P>
        <CodeBlock
          title="translib/db/db.go (key APIs)"
          code={`package db

import "github.com/go-redis/redis/v7"

const (
    ApplDB     DBNum = 0   // APPL_DB: runtime state from orchagent
    CountersDB DBNum = 2   // COUNTERS_DB: interface stats, queue counters
    ConfigDB   DBNum = 4   // CONFIG_DB: persistent user config ⭐
    StateDB    DBNum = 6   // STATE_DB: transient daemon state
)

type DB struct {
    client *redis.Client   // single DB connection
    Opts   Options
    stats  Stats
}

// write a hash entry: HMSET <table>|<key> <field> <value>
func (d *DB) SetEntry(entry *Value) error {
    redisKey := entry.Table + "|" + entry.Key   // e.g. "PORT|Ethernet0"
    return d.client.HMSet(redisKey, entry.Field).Err()
}

// read: HGETALL <table>|<key>
func (d *DB) GetEntry(ts *TableSpec, key Key) (Value, error) {
    redisKey := ts.Name + "|" + string(key)
    hash := d.client.HGetAll(redisKey).Val()
    return Value{Field: hash}, nil
}

// transaction support (Redis MULTI/EXEC)
func (d *DB) StartTx(keys []string, opts *TxOptions) error {
    d.client.Watch(keys...)   // optimistic lock
    d.txPipe = d.client.TxPipeline()
    return nil
}

func (d *DB) CommitTx() error {
    _, err := d.txPipe.Exec()
    return err
}

// multi-DB helper: read from CONFIG_DB + APPL_DB + COUNTERS_DB in parallel
func NewDB(opt Options) (*DB, error) {
    addr := "localhost:6379"
    if sonic_db_config := os.Getenv("DB_CONFIG_PATH"); sonic_db_config != "" {
        // parse database_config.json for DB numbers + unix socket paths
    }
    client := redis.NewClient(&redis.Options{Addr: addr, DB: int(opt.DBNo)})
    return &DB{client: client}, nil
}`}
        />
        <P>
          Apps call <IC>db.SetEntry()</IC> after CVL passes. The transaction wrappers ensure atomicity: if CVL validation fails mid-way through a multi-table update, <IC>StartTx</IC> rollback prevents partial writes.
        </P>
        <Callout type="behind">
          ⚙️ SONiC uses <strong>pipelined writes</strong> for performance. During a large config push (e.g., 500 ACL rules), translib batches them into one Redis transaction. Redis MULTI/EXEC ensures all-or-nothing commit, and orchagent sees a consistent snapshot.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="build" number="08" title="Build Pipeline: YANG → Go">
        <P>Understanding the build is key to debugging &quot;undefined struct field&quot; errors when YANGs change:</P>
        <CodeBlock
          title="Makefile (simplified stages)"
          code={`# Stage 1: compile OpenConfig + SONiC YANGs to .yin (XML intermediate)
yin:
\t@echo "Compiling YANGs with pyang..."
\tpyang -f yin models/yang/sonic/*.yang -o cvl/schema/
\tpyang -f yin models/yang/openconfig/*.yang -o build/yin/

# Stage 2: generate ygot Go bindings from OpenConfig YANGs
# (ygot = "YANG Go Bindings" - generates type-safe structs)
go-bindings:
\tgo run github.com/openconfig/ygot/generator \\
\t  -path=models/yang \\
\t  -output_file=translib/ocbinds/ocbinds.go \\
\t  -package_name=ocbinds \\
\t  -generate_fakeroot \\
\t  models/yang/openconfig/openconfig-interfaces.yang \\
\t  models/yang/openconfig/openconfig-network-instance.yang
\t# result: ocbinds/ocbinds.go with structs like:
\t#   type OpenconfigInterfaces_Interfaces struct { ... }

# Stage 3: parse annotation YANGs → generate transformer lookup tables
annotations:
\ttools/pyang/sonic_annot_plugin.py models/yang/annotations/*.yang \\
\t  > transformer/annot_map.go
\t# generates Go map: ocPath → {table, field, customXfmr}

# Stage 4: build the Go library
build: yin go-bindings annotations
\tgo build -o build/libtranslib.so -buildmode=c-shared translib/translib.go
\t# mgmt-framework + sonic-gnmi link against this .so`}
          output={`Compiling YANGs with pyang...
models/yang/sonic/sonic-port.yang:42: warning: imported module ietf-inet-types not used
Generating ygot Go bindings...
ocbinds/ocbinds.go written (120,000 lines - it's huge!)
Parsing annotations...
transformer/annot_map.go: 487 mappings registered
Building translib...
build/libtranslib.so created ✅`}
        />
        <P>
          The <strong>ygot generator</strong> is the heavy lifter: it reads 50+ OpenConfig YANG files and produces a single massive Go file with every possible OpenConfig struct. Apps unmarshal JSON into these structs, gaining compile-time type safety.
        </P>
        <Callout type="mistake">
          ⚠️ If you edit a YANG file and don&apos;t rebuild, you&apos;ll get runtime panics: &quot;unknown YANG node&quot; or &quot;field not found in ocbinds&quot;. Always <IC>make clean &amp;&amp; make</IC> after YANG changes. In SONiC build system, this happens automatically during <IC>make target/sonic-mgmt-common.deb</IC>.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging translib">
        <P>When a REST or gNMI request fails with a cryptic error, here&apos;s how to trace it:</P>
        <CodeBlock
          title="debug_translib.sh"
          code={`# 1. Enable glog verbose logging (translib uses glog)
export GLOG_v=3          # 0=errors, 1=warnings, 2=info, 3=debug, 4=trace
export GLOG_logtostderr=1

# 2. Restart mgmt-framework (or sonic-gnmi) to pick up env vars
systemctl restart mgmt-framework

# 3. Tail the logs
tail -f /var/log/syslog | grep -E "translib|CVL"

# 4. Trigger the failing request
curl -k -u admin:password -X PATCH https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H "Content-Type: application/yang-data+json" \\
  -d '{"openconfig-interfaces:config": {"mtu": 99999}}'

# Watch the log output:
# [translib] Update() called: path=/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
# [IntfApp] translateUpdate: unmarshal OK, ocIntf.Config.Mtu=99999
# [CVL] ValidateEditConfig: parsing SONiC YANG payload
# [CVL] ERROR: Semantic validation failed: Value 99999 out of range (1280-9216)
# [translib] CVL returned error, aborting transaction`}
          output={`Jan 12 10:23:45 sonic translib[1234]: Update() path=/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
Jan 12 10:23:45 sonic translib[1234]: IntfApp.translateUpdate: mtu=99999
Jan 12 10:23:45 sonic CVL[1234]: ValidateEditConfig: sonic-port:PORT/PORT_LIST[port_name='Ethernet0']/mtu
Jan 12 10:23:45 sonic CVL[1234]: ERROR Semantic validation failed: mtu value 99999 not in range 1280..9216
Jan 12 10:23:45 sonic translib[1234]: SetResponse: ErrSrc=CVL Err="Semantic validation failed"`}
        />
        <P>Additional debug tools:</P>
        <Table
          head={["Tool", "What it shows"]}
          rows={[
            ["GLOG_v=4", "Trace-level logs: every function call, Redis key read/write"],
            ["CVL debug: CVL_DEBUG=1", "Prints libyang tree, XPath eval, leafref resolution steps"],
            ["db layer: DB_DEBUG=1", "Logs every Redis command: HMSET PORT|Eth0 mtu 9100"],
            ["pprof endpoint", "mgmt-framework exposes :6060/debug/pprof for Go profiling (CPU/mem)"],
            ["Unit tests", "cd translib && go test -v -run TestUpdateInterface — runs isolated tests against mock Redis"],
          ]}
        />
        <Callout type="tip">
          💡 <strong>CVL error messages are gold.</strong> They tell you the EXACT YANG constraint that failed and the violating value. Copy the error into your SONiC YANG file search to find the constraint definition, then fix the payload.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise — Trace a Request">
        <P>Hands-on: clone sonic-mgmt-common and trace a config update from API to Redis.</P>
        <CodeBlock
          title="lab_trace.sh"
          code={`# Step 1: Clone the repo
git clone https://github.com/sonic-net/sonic-mgmt-common.git
cd sonic-mgmt-common

# Step 2: Find the NTP annotation file
find models/yang/annotations -name "*ntp*"
# Output: models/yang/annotations/sonic-ntp-annot.yang

# Step 3: Read the annotation to understand OC → SONiC mapping
cat models/yang/annotations/sonic-ntp-annot.yang | grep -A5 "deviation.*ntp.*servers"
# Look for: table-name, field-name directives

# Step 4: Trace translib.Update() in the code
# Open translib/translib.go, find func Update(req SetRequest)
# Add comments tracing the flow:
#   - line 120: dispatcher.findApp(req.Path)
#   - line 145: app.translateUpdate(dbAccess)
#   - line 167: cvl.ValidateEditConfig(sonicPayload)
#   - line 189: dbAccess.CommitTx()

# Step 5: Find the NTP app registration
grep -r "register.*ntp" translib/
# Output: translib/ntp_app.go:34: register("/openconfig-system:system/ntp", ...)

# Step 6: Read the transformer callback (if any)
ls transformer/xfmr_ntp.go
# If exists: find YangToDb_ntp_server_xfmr() function

# Step 7: Check CVL schema
ls cvl/schema/sonic-ntp.yang.yin
pyang -f tree models/yang/sonic/sonic-ntp.yang
# See the YANG tree: NTP_SERVER list keyed by ipaddress`}
          output={`models/yang/annotations/sonic-ntp-annot.yang

deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:address {
  deviate add {
    sonic-ext:table-name "NTP_SERVER";
    sonic-ext:key-name "ipaddress";
  }
}

translib/ntp_app.go:34: register("/openconfig-system:system/ntp", &appInfo{appType: NtpApp, ...})

sonic-ntp.yang tree:
module: sonic-ntp
  +--rw sonic-ntp
     +--rw NTP_SERVER
        +--rw NTP_SERVER_LIST* [ipaddress]
           +--rw ipaddress    inet:ip-address

✅ Mapping decoded: OC /system/ntp/servers/server[address=X]/config/address
                    → SONiC NTP_SERVER|X key in Redis CONFIG_DB`}
        />
        <Callout type="note">
          📌 <strong>Lab takeaway:</strong> Every OpenConfig path has a SONiC destination. Annotations are the Rosetta Stone. If you can read the annotation YANG, you can trace any request from REST JSON to Redis HMSET.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="interview" number="11" title="Interview Questions">
        <P>Real questions from SONiC management layer interviews:</P>
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is sonic-mgmt-common and why does it exist?",
              "It's a shared Go library containing translib (API layer), CVL (validation), transformers (OC↔SONiC mapping), and db helpers. It exists to avoid duplicating validation/mapping logic between REST (mgmt-framework) and gNMI (sonic-gnmi) servers. Both consume the same translib.Update() API."
            ],
            [
              "Explain the call stack for a gNMI Set request.",
              "Client → gNMI server → translib.Update(SetRequest) → app dispatcher → IntfApp.translateUpdate() → annotation/transformer (OC→SONiC YANG) → CVL.ValidateEditConfig() → db.StartTx() → db.SetEntry() HMSET → db.CommitTx() → Redis CONFIG_DB. Orchagent subscribes and programs SAI."
            ],
            [
              "What does CVL validate?",
              "Three layers: (1) syntactic: YANG types/ranges/patterns via libyang, (2) semantic: leafref/must/when constraints by querying current Redis state, (3) dependency ordering: ensures deletes don't orphan child tables (e.g., can't delete VLAN if VLAN_MEMBER references it)."
            ],
            [
              "How does OpenConfig /interfaces/interface/config/mtu become Redis PORT|Ethernet0 mtu?",
              "Annotation YANG (sonic-interface-annot.yang) declares deviation adding sonic-ext:table-name PORT, sonic-ext:field-name mtu. Pyang plugin parses this at build time into a Go map. Translib looks up the path, retrieves table+field, builds SONiC YANG payload, passes to CVL, then writes Redis."
            ],
            [
              "Where are the YANG files in sonic-mgmt-common?",
              "models/yang/: openconfig/ (OC standard YANGs), ietf/ (ietf-inet-types etc), sonic/ (CONFIG_DB schema as YANG), annotations/ (deviation YANGs mapping OC→sonic). Build compiles these to .yin for CVL and .go structs (ygot) for type safety."
            ],
            [
              "What happens if you bypass translib and write directly to Redis?",
              "CVL validation is skipped. Invalid data can enter CONFIG_DB (e.g., MTU out of range, missing leafref target). Orchagent may reject it silently, crash, or propagate garbage to ASIC. Always use translib or SONiC CLI (which calls translib) to ensure validation."
            ],
            [
              "What's the difference between common_app.go and custom apps like IntfApp?",
              "common_app is a generic YANG-driven app: it auto-generates Redis writes from annotations with zero custom code. Works for 80% of tables. Custom apps (IntfApp, VlanApp) override translateUpdate() for complex logic: value transforms (enabled→admin_status), 1-to-N mappings, or side effects (e.g., creating default VLAN members)."
            ],
            [
              "How do you debug a CVL validation failure?",
              "Enable CVL_DEBUG=1 and GLOG_v=3, restart mgmt-framework, trigger the request, tail syslog. CVL logs show the exact YANG node, constraint (must/leafref/range), and violating value. Grep the SONiC YANG file for that constraint to see the rule."
            ],
            [
              "What is ygot and why does sonic-mgmt-common use it?",
              "ygot (YANG Go bindings) is an OpenConfig tool that generates type-safe Go structs from YANG. Apps unmarshal OC JSON into these structs (ocbinds.OpenconfigInterfaces), gaining compile-time checks. Avoids brittle string-based JSON manipulation."
            ],
            [
              "Can translib handle streaming telemetry (gNMI Subscribe)?",
              "Yes. translib.Subscribe() registers a callback, then uses Redis keyspace notifications (CONFIG_KEYSPACE_EVENTS) to detect DB changes. When orchagent updates APPL_DB or COUNTERS_DB, translib streams the delta as gNMI SubscribeResponse. Annotations define which YANG paths map to which Redis keys for subscription."
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Repo", "github.com/sonic-net/sonic-mgmt-common — brain of mgmt layer"],
            ["Core dirs", "/translib (API), /cvl (validation), /transformer (OC↔SONiC), /models/yang"],
            ["Translib entry", "Update(SetRequest) — all writes funnel here from REST + gNMI"],
            ["App contract", "appInterface: initialize, translateUpdate, processUpdate — per-feature modules"],
            ["common_app", "Generic YANG-driven app — 80% of tables, zero custom code, uses annotations"],
            ["CVL layers", "Syntactic (types), semantic (leafref/must/when), dependency ordering"],
            ["Annotation", "YANG deviation with sonic-ext:table-name/field-name — OC→SONiC map"],
            ["Transformer", "annotation lookup OR custom xfmr_*.go callback (e.g., enabled→admin_status)"],
            ["db layer", "translib/db: go-redis wrapper, HMSET/HGETALL, multi-DB, transactions"],
            ["Build pipeline", "YANG→pyang→.yin (CVL), YANG→ygot→ocbinds.go (type safety), annot→map.go"],
            ["Debug", "GLOG_v=3 CVL_DEBUG=1, tail syslog, CVL errors name exact constraint"],
            ["Bypass danger", "Writing to Redis via redis-cli skips CVL → orchagent may crash or reject"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
