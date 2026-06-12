"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "One Update() end to end inside translib",
  nodes: [
    { id: "api", icon: "📨", label: "translib.Update()", sub: "public API", x: 6, y: 50, color: "#22d3ee" },
    { id: "acquire", icon: "🔒", label: "Lock + ygot", sub: "unmarshal JSON", x: 24, y: 22, color: "#fb923c" },
    { id: "getapp", icon: "🧩", label: "getAppModule()", sub: "registry lookup", x: 24, y: 78, color: "#a78bfa" },
    { id: "translate", icon: "🔁", label: "translateUpdate()", sub: "build dbmap", x: 46, y: 50, color: "#34d399" },
    { id: "cvl", icon: "🛡️", label: "CVL validate", sub: "schema check", x: 66, y: 22, color: "#fbbf24" },
    { id: "process", icon: "⚙️", label: "processUpdate()", sub: "db.SetEntry", x: 66, y: 78, color: "#f472b6" },
    { id: "resp", icon: "✅", label: "SetResponse", sub: "success/error", x: 88, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "api-acquire", from: "api", to: "acquire", color: "#fb923c" },
    { id: "api-getapp", from: "api", to: "getapp", color: "#a78bfa" },
    { id: "acquire-translate", from: "acquire", to: "translate", color: "#34d399" },
    { id: "getapp-translate", from: "getapp", to: "translate", color: "#34d399" },
    { id: "translate-cvl", from: "translate", to: "cvl", color: "#fbbf24" },
    { id: "translate-process", from: "translate", to: "process", color: "#f472b6" },
    { id: "cvl-resp", from: "cvl", to: "resp", color: "#34d399" },
    { id: "process-resp", from: "process", to: "resp", color: "#34d399" },
    { id: "cvl-err", from: "cvl", to: "resp", bend: 20, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "update-mtu",
      name: "🟢 Update MTU (happy path)",
      command: "PATCH /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config {mtu: 9100}",
      steps: [
        { node: "api", paths: ["api-acquire", "api-getapp"], text: "REST server calls translib.Update(SetRequest{Path: '/oc-if:...', Payload: '{mtu:9100}'}). Translib entry point." },
        { node: "acquire", paths: ["acquire-translate"], text: "Config lock acquired (prevents concurrent writes). ygot.Unmarshal JSON → OpenconfigInterfaces Go struct. Typed tree in memory." },
        { node: "getapp", paths: ["getapp-translate"], text: "Path '/oc-if:interfaces' → registry lookup → common_app (transformer-driven app for most OC paths)." },
        { node: "translate", paths: ["translate-cvl", "translate-process"], text: "common_app.translateUpdate() calls XlateToDb(ygot struct, UPDATE). Transformer engine consults annotations, builds dbmap: {PORT|Ethernet0: {mtu: '9100'}}." },
        { node: "cvl", paths: ["cvl-resp"], text: "CVL.ValidateEditConfig(dbmap). Checks: PORT table schema allows mtu field? Value 9100 in range? Cross-table constraints OK? ✓ Pass." },
        { node: "process", paths: ["process-resp"], text: "common_app.processUpdate(dbmap). For each table|key → db.SetEntry(CONFIG_DB, 'PORT', 'Ethernet0', {mtu:'9100'}). HMSET to Redis." },
        { node: "resp", paths: [], text: "SetResponse{} returned. HTTP 204 No Content to client. MTU applied. 🎉" },
      ],
    },
    {
      id: "cvl-veto",
      name: "🔴 CVL rejects invalid data",
      command: "PATCH /interfaces/interface[name=Ethernet0]/config {mtu: 50000} — out of range",
      steps: [
        { node: "api", paths: ["api-acquire", "api-getapp"], text: "translib.Update() called with mtu: 50000 (SONiC max is ~9216 depending on platform)." },
        { node: "acquire", paths: ["acquire-translate"], text: "Lock acquired, ygot.Unmarshal succeeds (ygot doesn't enforce range constraints from SONiC YANG, only OC)." },
        { node: "translate", paths: ["translate-cvl"], text: "translateUpdate() builds dbmap: {PORT|Ethernet0: {mtu: '50000'}}. Looks valid to transformer (it's just a field map)." },
        { node: "cvl", paths: ["cvl-err"], text: "CVL.ValidateEditConfig(dbmap). Checks sonic-port.yang range constraint: 'mtu must-be-in 1280..9216'. VIOLATION. ❌" },
        { node: "resp", paths: [], text: "CVL returns error. Translib aborts transaction (no db.SetEntry called). SetResponse{ErrSrc: CVL, Err: 'mtu out of range'}. HTTP 400 Bad Request." },
      ],
    },
    {
      id: "get-depth",
      name: "🔵 GET with depth (state query)",
      command: "GET /interfaces/interface[name=Ethernet0]/state?depth=unbounded",
      steps: [
        { node: "api", paths: ["api-getapp"], text: "translib.Get(GetRequest{Path: '.../state', QueryParams: {depth: unbounded, content: all}}). Read path, no lock needed." },
        { node: "getapp", paths: ["getapp-translate"], text: "Path → common_app. GET flow: no ygot unmarshal (no input payload), no CVL (read-only)." },
        { node: "translate", paths: ["translate-process"], text: "common_app.translateGet() calls XlateFromDb(path, GET). Transformer reads annotations: /state → db-name APPL_DB, subtree-xfmr for counters from COUNTERS_DB." },
        { node: "process", paths: ["process-resp"], text: "processGet() calls db.GetEntry() for PORT|Ethernet0 (APPL_DB), COUNTERS:Ethernet0 (COUNTERS_DB). Transformers build ygot state struct." },
        { node: "resp", paths: [], text: "ygot.Marshal(state struct) → JSON. GetResponse{Payload: '{oper-status:UP, counters:{in-pkts:1234567, ...}}'}. HTTP 200 with full subtree." },
      ],
    },
  ],
};

const NAV = [
  { id: "what", label: "What Is Translib?" },
  { id: "api-surface", label: "The Public API Surface ⭐" },
  { id: "app-registry", label: "The App Registry" },
  { id: "app-interface", label: "The appInterface Contract ⭐" },
  { id: "two-phase", label: "Two-Phase Design (Why translate + process)" },
  { id: "sequence-get", label: "Sequence: GET Request" },
  { id: "sequence-patch", label: "Sequence: PATCH Request ⭐" },
  { id: "sequence-delete", label: "Sequence: DELETE Request" },
  { id: "db-layer", label: "The DB Layer (translib/db)" },
  { id: "errors", label: "Error Mapping (CVL → HTTP)" },
  { id: "debugging", label: "Debugging Translib Flows" },
  { id: "lab", label: "Lab Exercise" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicTranslibPage() {
  return (
    <TopicShell
      icon="📚"
      title="Translib — The Request Orchestrator"
      gradientWord="Translib"
      subtitle="Translib is the orchestration layer inside sonic-mgmt-common that both REST and gNMI servers call for every config/state operation. It decodes requests, routes to app modules, drives transformers, validates with CVL, executes DB writes, and returns typed responses. One API, two protocols, zero direct Redis access."
      nav={NAV}
      badges={["🎯 Full CRUD flow", "📐 Two-phase design", "🔁 ASCII sequences", "🔍 glog tracing"]}
      next={{ icon: "🛠️", label: "Host Services", href: "/sonic/host-services" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what" number="01" title="What Is Translib?">
        <P>
          <strong>Translib</strong> (transaction library) is the core orchestrator in{" "}
          <IC>sonic-mgmt-common/translib/</IC>. It sits between the protocol servers (REST, gNMI) and the lower layers
          (transformers, CVL, Redis). Every config change and state query flows through translib.
        </P>
        <CodeBlock
          title="translib_position_in_stack.txt"
          runnable={false}
          code={`Client (curl / gnmic)
    ↓
REST server (rest_server container)  OR  gNMI server (telemetry container)
    ↓
════════════════════════════════════════════════════════════════
    TRANSLIB — the orchestrator (sonic-mgmt-common/translib/)
════════════════════════════════════════════════════════════════
    ↓                ↓                  ↓
App modules    Transformer engine    CVL validator
(common_app,     (XlateToDb/FromDb)   (config validation)
 ocyang_app)
    ↓                ↓                  ↓
════════════════════════════════════════════════════════════════
    DB layer (translib/db) — Redis client wrapper
════════════════════════════════════════════════════════════════
    ↓
CONFIG_DB / APPL_DB / STATE_DB / COUNTERS_DB (Redis instances)`}
        />
        <P>
          Why does it exist? Without translib, REST and gNMI would each implement their own CRUD logic, duplicate
          validation, and talk to Redis differently. Translib provides <strong>one unified API</strong> for both.
        </P>
        <Callout type="analogy">
          Think of translib as the &quot;request dispatcher&quot; in a web framework. REST and gNMI are routes, translib
          is the middleware stack that decodes, validates, calls business logic (transformers), and commits to the DB.
          Every request goes through the same pipeline.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="api-surface" number="02" title="The Public API Surface ⭐">
        <P>
          Translib exports <strong>six main functions</strong> in <IC>translib/translib.go</IC>:
        </P>
        <CodeBlock
          title="translib_public_api.go"
          runnable={false}
          code={`package translib

// ────────────────────────────────────────────────────────────────
// CRUD operations (the big 5)
// ────────────────────────────────────────────────────────────────

func Create(req SetRequest) (SetResponse, error)
  // POST: create new resource (fails if exists)

func Update(req SetRequest) (SetResponse, error)
  // PATCH: update existing resource (merges, creates if missing)

func Replace(req SetRequest) (SetResponse, error)
  // PUT: replace entire resource (deletes unspecified fields)

func Delete(req SetRequest) (SetResponse, error)
  // DELETE: remove resource

func Get(req GetRequest) (GetResponse, error)
  // GET: retrieve config or state data

// ────────────────────────────────────────────────────────────────
// Extras
// ────────────────────────────────────────────────────────────────

func Action(req ActionRequest) (ActionResponse, error)
  // RPC: for operations like "clear counters", "reboot"

func Subscribe(req SubscribeRequest) ([]*IsSubscribeResponse, error)
  // gNMI ON_CHANGE streaming (uses Redis keyspace notifications)

// ────────────────────────────────────────────────────────────────
// Request/Response structs
// ────────────────────────────────────────────────────────────────

type SetRequest struct {
    Path         string            // YANG path (e.g., /openconfig-interfaces:interfaces/...)
    Payload      []byte            // JSON or IETF-JSON encoded config
    User         UserRoles         // RBAC info
    AuthEnabled  bool
    ClientVersion Version
}

type SetResponse struct {
    ErrSrc  int    // where the error came from (app, transformer, CVL, DB)
    Err     error  // nil on success
}

type GetRequest struct {
    Path         string
    User         UserRoles
    ClientVersion Version
    // Query parameters:
    Depth        int      // 0=immediate children, unbounded=-1
    Content      string   // "config" | "state" | "all" | "operational"
    Fields       []string // field selectors (partial GET)
}

type GetResponse struct {
    Payload   []byte  // JSON response
    ErrSrc    int
    Err       error
}`}
        />
        <P>
          REST server calls these directly:
        </P>
        <CodeBlock
          title="rest_server_calls_translib.go"
          runnable={false}
          code={`// In rest_server/server/server.go (simplified)

func handlePatch(c *gin.Context) {
    path := c.Param("path")  // /restconf/data/openconfig-interfaces:interfaces/...
    body, _ := c.GetRawData()

    req := translib.SetRequest{
        Path:    path,
        Payload: body,
        User:    getUserFromContext(c),
    }

    resp, err := translib.Update(req)  // ← THE CALL

    if err != nil || resp.Err != nil {
        c.JSON(mapErrorToHTTP(resp.ErrSrc, resp.Err), gin.H{"error": resp.Err.Error()})
        return
    }
    c.Status(204)  // No Content
}`}
        />
        <Callout type="tip">
          <strong>Interview insight:</strong> &quot;How does gNMI Set differ from REST PATCH at the translib layer?&quot;{" "}
          → Both call <IC>translib.Update()</IC> with the same <IC>SetRequest</IC> struct. The only difference is the
          payload encoding (gNMI uses protobuf → JSON conversion happens in gnmi_server before calling translib). Once
          in translib, the flow is identical.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="app-registry" number="03" title="The App Registry">
        <P>
          Translib doesn&apos;t hardcode how to handle every YANG path. Instead, it uses an <strong>app registry</strong>{" "}
          that maps path prefixes to <strong>app modules</strong>:
        </P>
        <CodeBlock
          title="translib_app_registry.go"
          runnable={false}
          code={`// In translib/app_interface.go (simplified)

var appRegistry = map[string]appInterface{
    "/openconfig-interfaces:":       &CommonApp{},
    "/openconfig-system:":           &CommonApp{},
    "/openconfig-network-instance:": &CommonApp{},
    "/openconfig-platform:":         &CommonApp{},
    "/sonic-vlan:":                  &CommonApp{},

    // Legacy/native apps (bypass transformers):
    "/sonic-db:":        &DbApp{},      // direct Redis CRUD (used by legacy CLIs)
    "/sonic-events:":    &EventApp{},   // event log queries
}

func getAppModule(path string) appInterface {
    // Find longest matching prefix
    for prefix, app := range appRegistry {
        if strings.HasPrefix(path, prefix) {
            return app
        }
    }
    return nil  // unsupported path → 404
}`}
        />
        <P>
          The <strong>CommonApp</strong> is the star: it handles ~95% of OpenConfig paths using the transformer engine.
          It lives in <IC>translib/common_app.go</IC>. Legacy apps like DbApp exist for backward compatibility (old
          sonic-py-swsssdk scripts).
        </P>
      </Section>

      {/* 04 */}
      <Section id="app-interface" number="04" title="The appInterface Contract ⭐">
        <P>
          Every app module implements the <IC>appInterface</IC> (defined in <IC>translib/app_interface.go</IC>):
        </P>
        <CodeBlock
          title="app_interface_contract.go"
          runnable={false}
          code={`type appInterface interface {
    initialize(data appData)

    // Two-phase design: translate = build DB requests, process = execute
    translateCreate(d *db.DB) ([]db.WatchKeys, error)
    translateUpdate(d *db.DB) ([]db.WatchKeys, error)
    translateReplace(d *db.DB) ([]db.WatchKeys, error)
    translateDelete(d *db.DB) ([]db.WatchKeys, error)
    translateGet(dbs []*db.DB) error
    translateSubscribe(dbs []*db.DB, path string) (*notificationOpts, *notificationInfo, error)
    translateAction(dbs []*db.DB) error

    processCreate(d *db.DB) (SetResponse, error)
    processUpdate(d *db.DB) (SetResponse, error)
    processReplace(d *db.DB) (SetResponse, error)
    processDelete(d *db.DB) (SetResponse, error)
    processGet(dbs []*db.DB) (GetResponse, error)
    processAction(dbs []*db.DB) (ActionResponse, error)
}

// The appData passed to initialize():
type appData struct {
    path    string       // request YANG path
    payload []byte       // JSON body (for Set operations)
    ygotRoot *ygot.GoStruct  // unmarshaled ygot tree
    // ... other metadata
}`}
        />
        <P>
          For <strong>CommonApp</strong> (the transformer-driven app), here&apos;s what each method does:
        </P>
        <Table
          head={["Method", "Phase", "What it does"]}
          rows={[
            [
              <IC key="1">translateUpdate()</IC>,
              "Phase 1",
              "Calls XlateToDb(ygot tree, UPDATE). Transformer engine consults annotations, builds dbmap: {TABLE|key: {field: value}}. Returns it (doesn't write yet).",
            ],
            [
              <IC key="1">processUpdate()</IC>,
              "Phase 2",
              "For each entry in dbmap: d.SetEntry(db, table, key, fields). Writes to Redis via MULTI/EXEC transaction. Commits the change.",
            ],
            [
              <IC key="1">translateGet()</IC>,
              "Phase 1",
              "Calls XlateFromDb(path, GET). Transformer determines which Redis tables/keys to read (from annotations). Builds a read plan.",
            ],
            [
              <IC key="1">processGet()</IC>,
              "Phase 2",
              "Executes the read plan: d.GetEntry() for each table|key. Transformers convert Redis data → ygot struct. Marshal to JSON, return.",
            ],
            [
              <IC key="1">translateDelete()</IC>,
              "Phase 1",
              "XlateToDb(ygot tree, DELETE). Identifies which Redis keys to remove. Returns dbmap with tombstones.",
            ],
            [
              <IC key="1">processDelete()</IC>,
              "Phase 2",
              "d.DeleteEntry(db, table, key). DEL from Redis.",
            ],
          ]}
        />
        <Callout type="behind">
          The two-phase design (translate → process) exists because <strong>CVL validation happens between them</strong>.
          translate builds the proposed changes as a dbmap (in-memory), CVL checks it, then process executes only if
          valid. This way, invalid configs never touch Redis.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="two-phase" number="05" title="Two-Phase Design (Why translate + process)">
        <CodeBlock
          title="why_two_phases.txt"
          runnable={false}
          code={`Single-phase (naive):
  REST → translib → app.update() → writes to Redis immediately
  Problem: what if CVL rejects it AFTER writing? Rollback is hard.

Two-phase (actual):
  Phase 1 (translate): build the change in memory (dbmap)
    - XlateToDb() walks ygot tree, consults annotations
    - Returns: { "PORT|Ethernet0": {"mtu": "9100"}, "INTERFACE|Ethernet0": {...} }
    - NO Redis write yet

  ────── CVL validation happens here ──────
    CVL.ValidateEditConfig(dbmap)
    - Checks sonic-*.yang constraints (range, must statements, leafrefs)
    - If invalid → abort, return error, Redis unchanged ✅

  Phase 2 (process): execute the change
    - Loop dbmap: d.SetEntry(db, table, key, fields)
    - MULTI / HMSET ... / EXEC (atomic transaction)
    - Redis now updated

Benefits:
  ✓ Validation before mutation (no partial writes)
  ✓ Transaction semantics (all-or-nothing via MULTI/EXEC)
  ✓ Easier testing (can inspect dbmap before committing)
  ✓ Config session support (future: dbmap can be staged, committed later)`}
        />
      </Section>

      {/* 06 */}
      <Section id="sequence-get" number="06" title="Sequence: GET Request">
        <CodeBlock
          title="get_sequence.txt"
          runnable={false}
          code={`Client: GET /restconf/data/openconfig-interfaces:interfaces/interface[name=Ethernet0]/state

1. rest_server
     ↓ parseURI() → path="/oc-if:interfaces/interface[name='Ethernet0']/state"
     ↓ translib.Get(GetRequest{path, depth=unbounded, content=all})

2. translib.go::Get()
     ↓ app := getAppModule(path)  → CommonApp
     ↓ app.initialize(appData{path, ...})
     ↓ dbs := openDBs([CONFIG_DB, APPL_DB, STATE_DB, COUNTERS_DB])  // read needs all DBs
     ↓ app.translateGet(dbs)

3. common_app.go::translateGet()
     ↓ XlateFromDb(path, GET, dbs)  → transformer engine
     ↓ Transformer consults openconfig-interfaces-annot.yang:
         /state → db-name APPL_DB (oper-status, etc.)
         /state/counters → db-name COUNTERS_DB, subtree-xfmr intf_state_counters_xfmr
     ↓ Returns read plan: {APPL_DB: [PORT|Ethernet0], COUNTERS_DB: [COUNTERS:Ethernet0]}

4. common_app.go::processGet()
     ↓ For each DB entry in read plan:
         d.GetEntry(APPL_DB, "PORT", "Ethernet0") → {oper_status: "up", mtu: "9100", ...}
         d.GetEntry(COUNTERS_DB, "COUNTERS", "Ethernet0") → {SAI_..._IN_PKTS: "1234567", ...}
     ↓ Transformers convert Redis → ygot struct:
         intf_state_counters_xfmr builds OpenconfigInterfaces_Interface_State_Counters
     ↓ ygot.Marshal(state struct) → JSON

5. translib.go::Get() returns GetResponse{Payload: <JSON>, Err: nil}

6. rest_server
     ↓ c.JSON(200, payload)

Client receives:
  {
    "openconfig-interfaces:state": {
      "oper-status": "UP",
      "admin-status": "UP",
      "counters": { "in-pkts": 1234567, "out-octets": 987654321, ... }
    }
  }`}
        />
      </Section>

      {/* 07 */}
      <Section id="sequence-patch" number="07" title="Sequence: PATCH Request ⭐">
        <CodeBlock
          title="patch_sequence.txt"
          runnable={false}
          code={`Client: PATCH /restconf/data/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
        {"mtu": 9100}

1. rest_server
     ↓ parseURI(), read body
     ↓ translib.Update(SetRequest{path="/oc-if:.../config", payload='{"mtu":9100}'})

2. translib.go::Update()
     ↓ acquireConfigLock()  // global write lock (prevents concurrent PATCHes)
     ↓ app := getAppModule(path) → CommonApp
     ↓ ygot.Unmarshal(payload, &ocbinds.OpenconfigInterfaces) → typed Go struct
     ↓ app.initialize(appData{path, payload, ygotRoot: struct})
     ↓ d := db.NewDB(ConfigDB)
     ↓ app.translateUpdate(d)

3. common_app.go::translateUpdate()
     ↓ XlateToDb(ygotRoot, UPDATE, d)  → transformer engine
     ↓ Transformer walks ygot tree for /interface[Ethernet0]/config/mtu
     ↓ Consults openconfig-interfaces-annot.yang:
         /interface → table-name "PORT", key-xfmr intf_key_xfmr
         /config/mtu → field-name "mtu"
     ↓ Calls intf_key_xfmr("Ethernet0") → "Ethernet0"
     ↓ Builds dbmap: { "PORT|Ethernet0": {"mtu": "9100"} }
     ↓ Returns dbmap (NOT written yet)

4. translib.go::Update() [continued]
     ↓ CVL.ValidateEditConfig(dbmap, d)
         - Loads sonic-port.yang: leaf mtu { type uint16; range 1280..9216; }
         - Checks: 9100 in range? ✓
         - Cross-table checks: none for this field
         - Result: VALID ✓

     ↓ app.processUpdate(d)

5. common_app.go::processUpdate()
     ↓ d.StartTx()  // Redis MULTI
     ↓ For each entry in dbmap:
         d.SetEntry(CONFIG_DB, "PORT", "Ethernet0", {"mtu": "9100"})
           → HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100
     ↓ d.CommitTx()  // Redis EXEC
     ↓ Returns SetResponse{Err: nil}

6. translib.go::Update() returns SetResponse{Err: nil}
     ↓ releaseConfigLock()

7. rest_server
     ↓ c.Status(204)  // No Content

Client receives: 204 (success, no body)

Redis state (verify):
  CONFIG_DB:PORT|Ethernet0
    mtu: 9100
    lanes: ...
    speed: ...`}
        />
        <Callout type="tip">
          This is THE sequence to memorize for interviews. It shows: protocol agnostic entry (REST/gNMI both hit
          translib.Update), ygot typing, app registry, two-phase, CVL validation, and Redis transaction.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="sequence-delete" number="08" title="Sequence: DELETE Request">
        <CodeBlock
          title="delete_sequence.txt"
          runnable={false}
          code={`Client: DELETE /restconf/data/openconfig-system:system/ntp/servers/server[address=10.1.1.1]

1. rest_server → translib.Delete(SetRequest{path="/oc-sys:.../server[address='10.1.1.1']"})

2. translib.go::Delete()
     ↓ acquireConfigLock()
     ↓ app := getAppModule(path) → CommonApp
     ↓ ygot: build struct with just the key (address=10.1.1.1), mark for deletion
     ↓ app.initialize()
     ↓ app.translateDelete(d)

3. common_app.go::translateDelete()
     ↓ XlateToDb(ygotRoot, DELETE, d)
     ↓ Transformer consults openconfig-system-annot.yang:
         /ntp/servers/server → table "NTP_SERVER", key-xfmr ntp_server_key_xfmr
     ↓ Calls ntp_server_key_xfmr("10.1.1.1") → "10.1.1.1"
     ↓ Builds dbmap for deletion: { "NTP_SERVER|10.1.1.1": <TOMBSTONE> }
     ↓ Returns dbmap

4. translib.go::Delete()
     ↓ CVL.ValidateEditConfig(dbmap, DELETE)
         - Checks: deleting this key breaks any must/leafref? No.
         - Result: VALID ✓
     ↓ app.processDelete(d)

5. common_app.go::processDelete()
     ↓ d.StartTx()
     ↓ d.DeleteEntry(CONFIG_DB, "NTP_SERVER", "10.1.1.1")
         → DEL CONFIG_DB:NTP_SERVER|10.1.1.1
     ↓ d.CommitTx()
     ↓ Returns SetResponse{Err: nil}

6. translib.go::Delete() → releaseConfigLock() → SetResponse

7. rest_server → HTTP 204

Redis: NTP_SERVER|10.1.1.1 key GONE ✓`}
        />
      </Section>

      {/* 09 */}
      <Section id="db-layer" number="09" title="The DB Layer (translib/db)">
        <P>
          Translib never calls Redis commands directly. It uses <IC>translib/db</IC>, a wrapper that provides:
        </P>
        <CodeBlock
          title="translib_db_api.go"
          runnable={false}
          code={`package db

type DB struct {
    client   *redis.Client
    Opts     Options
    stats    Stats
    txCache  map[string]map[string]db.Value  // in-flight transaction cache
}

type Options struct {
    DBNo          int   // CONFIG_DB=4, APPL_DB=0, STATE_DB=6, COUNTERS_DB=2, ...
    InitIndicator string
    TableNameSeparator string  // default "|"
    KeySeparator       string  // default ":"
}

// ────────────────────────────────────────────────────────────────
// Core API
// ────────────────────────────────────────────────────────────────

func NewDB(opt Options) (*DB, error)
  // Opens Redis connection to the specified DB number

func (d *DB) SetEntry(ts *TableSpec, key Key, data Value) error
  // HMSET <table><sep><key>  <field> <value> ...
  // (or queued in txCache if transaction active)

func (d *DB) GetEntry(ts *TableSpec, key Key) (Value, error)
  // HGETALL <table>|<key>
  // Returns map[string]string

func (d *DB) DeleteEntry(ts *TableSpec, key Key) error
  // DEL <table>|<key>

func (d *DB) GetKeys(ts *TableSpec) ([]Key, error)
  // KEYS <table>|*
  // (used for list queries: GET /interfaces — lists all PORT keys)

// ────────────────────────────────────────────────────────────────
// Transaction support (MULTI/EXEC)
// ────────────────────────────────────────────────────────────────

func (d *DB) StartTx(keys []WatchKeys) error
  // Begin transaction, optionally WATCH keys (optimistic locking)

func (d *DB) CommitTx() error
  // Flush txCache to Redis via MULTI / HMSET ... / DEL ... / EXEC

func (d *DB) AbortTx() error
  // DISCARD, clear txCache

// ────────────────────────────────────────────────────────────────
// Example usage
// ────────────────────────────────────────────────────────────────

d, _ := db.NewDB(db.Options{DBNo: db.ConfigDB})  // ConfigDB = 4

ts := &db.TableSpec{Name: "PORT"}
key := db.Key{Comp: []string{"Ethernet0"}}
data := db.Value{Field: map[string]string{"mtu": "9100", "speed": "100000"}}

d.StartTx(nil)
d.SetEntry(ts, key, data)  // queued
d.CommitTx()               // MULTI / HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100 speed 100000 / EXEC`}
        />
        <P>
          Why wrap Redis instead of calling HMSET directly? <strong>Transaction batching</strong>: multiple SetEntry
          calls in one request are accumulated, then committed atomically with MULTI/EXEC. Also: abstraction for future
          backends (gNOI might replace Redis someday).
        </P>
        <Callout type="note">
          The <IC>WatchKeys</IC> parameter in <IC>StartTx()</IC> is for optimistic locking (Redis WATCH). If another
          client changes a watched key before EXEC, the transaction fails. SONiC uses this for config sessions (future
          feature) to prevent conflicts.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="errors" number="10" title="Error Mapping (CVL → HTTP)">
        <P>
          SetResponse and GetResponse have an <IC>ErrSrc</IC> field that tells <em>where</em> the error came from:
        </P>
        <CodeBlock
          title="error_sources.go"
          runnable={false}
          code={`// translib/tlerr/tlerr.go

const (
    ErrSrcApp        = 1  // App module error (logic bug in transformer)
    ErrSrcTransformer = 2  // Transformer error (e.g., key function failed)
    ErrSrcCVL        = 3  // CVL validation rejection
    ErrSrcDB         = 4  // Redis connection error
)

// rest_server maps ErrSrc → HTTP status:

func mapErrorToHTTP(errSrc int, err error) int {
    if err == nil {
        return 200
    }
    switch errSrc {
    case tlerr.ErrSrcCVL:
        // CVL rejection = client sent bad data
        return 400  // Bad Request
    case tlerr.ErrSrcTransformer:
        // Transformer failed = unsupported path or internal error
        if isNotFound(err) {
            return 404  // Not Found
        }
        return 500  // Internal Server Error
    case tlerr.ErrSrcDB:
        return 503  // Service Unavailable (Redis down)
    default:
        return 500
    }
}

// CVL error detail example:
SetResponse{
    ErrSrc: tlerr.ErrSrcCVL,
    Err:    errors.New("Validation failed: mtu value 50000 exceeds max 9216"),
}
→ REST returns: 400 {"ietf-restconf:errors": {"error": [{"error-message": "Validation failed: ..."}]}}`}
        />
      </Section>

      {/* 11 */}
      <Section id="debugging" number="11" title="Debugging Translib Flows">
        <CodeBlock
          title="debug_translib.sh"
          code={`# 1. Enable verbose logging (requires rebuilding rest_server or gnmi_server with GODEBUG)
# In Dockerfile or debug build:
docker exec -it mgmt-framework bash
export GLOG_v=5  # or edit /usr/bin/rest_server to pass -v=5 to glog
systemctl restart rest-server

# 2. Watch syslog for translib traces
tail -f /var/log/syslog | grep -E "translib|common_app|XlateToDb"

# Sample log output for PATCH /interfaces/.../config {mtu: 9100}:
# [translib] Update() called, path=/oc-if:interfaces/interface[name='Ethernet0']/config
# [common_app] translateUpdate: calling XlateToDb
# [transformer] XlateToDb: processing /interfaces/interface/config/mtu
# [transformer] found annotation: table=PORT, field-name=mtu
# [transformer] built dbmap: {PORT|Ethernet0: {mtu: 9100}}
# [CVL] ValidateEditConfig: checking PORT|Ethernet0
# [CVL] sonic-port.yang: mtu range check PASS
# [common_app] processUpdate: calling db.SetEntry(PORT, Ethernet0, {mtu:9100})
# [db] HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100
# [translib] Update() success

# 3. Add request ID to trace a single request through logs
# (rest_server attaches UUID to context, logged with every line)

# 4. Check CVL validation details
cat /var/log/syslog | grep CVL
# [CVL] ValidateConfig: loaded 15 YANG modules
# [CVL] Dependency check: PORT.mtu has no leafrefs
# [CVL] Range check: 9100 in [1280..9216] PASS

# 5. Inspect Redis to verify the write
docker exec -it database redis-cli -n 4
HGETALL "PORT|Ethernet0"
# 1) "mtu"
# 2) "9100"
# 3) "lanes"
# 4) "65,66,67,68"
# ...`}
          output={`[translib] Update() called, path=/oc-if:interfaces/interface[name='Ethernet0']/config
[common_app] translateUpdate: calling XlateToDb
[transformer] built dbmap: {PORT|Ethernet0: {mtu: 9100}}
[CVL] sonic-port.yang: mtu range check PASS
[db] HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100
[translib] Update() success`}
        />
        <Callout type="behind">
          The <IC>glog</IC> package (google glog) is Go&apos;s standard verbose logger. <IC>-v=N</IC> sets verbosity:
          1=errors, 3=warnings, 5=info, 7=debug. SONiC uses <IC>glog.V(5).Infof(&quot;...&quot;)</IC> for trace logs.
          Production builds default to v=1 (errors only); dev builds use v=5 to see every translib step.
        </Callout>
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab Exercise">
        <P>
          <strong>Goal:</strong> Follow one PATCH in logs from rest_server → translib → CVL → Redis MONITOR. Trace the
          entire two-phase flow.
        </P>
        <CodeBlock
          title="lab_trace_patch.sh"
          code={`# Setup: enable verbose logging (if not already)
docker exec -it mgmt-framework bash
# (if you can rebuild, add -v=5 to rest_server flags; else use existing logs)

# Step 1: Start log tail in one terminal
tail -f /var/log/syslog | grep -E "translib|XlateToDb|CVL|processUpdate" &

# Step 2: Start Redis MONITOR in another terminal
docker exec -it database redis-cli -n 4 MONITOR &

# Step 3: Send a PATCH
curl -X PATCH https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H "Content-Type: application/yang-data+json" \\
  -d '{"openconfig-interfaces:config": {"mtu": 9100}}' \\
  -u admin:YourPaSsWoRd -k

# Step 4: Watch the logs flow (you should see):
# [translib] Update() called, path=...
# [common_app] translateUpdate start
# [XlateToDb] processing /config/mtu, annotation found: table=PORT, field=mtu
# [XlateToDb] dbmap built: {PORT|Ethernet0: {mtu: 9100}}
# [CVL] ValidateEditConfig({PORT|Ethernet0: {mtu: 9100}})
# [CVL] PASS
# [processUpdate] calling db.SetEntry
# [db] Redis: HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100

# Step 5: Redis MONITOR shows:
# 1678901234.567 [4 172.17.0.5:12345] "HMSET" "PORT|Ethernet0" "mtu" "9100"

# Step 6: Verify final state
redis-cli -n 4 HGETALL "PORT|Ethernet0" | grep -A1 mtu
# mtu
# 9100

# Deliverable: screenshot or copy-paste showing:
#   - translib.Update() log line
#   - XlateToDb dbmap
#   - CVL PASS
#   - Redis HMSET command
# = proof you traced the full flow ✅`}
          output={`[translib] Update() called, path=/oc-if:interfaces/interface[name='Ethernet0']/config
[XlateToDb] dbmap built: {PORT|Ethernet0: {mtu: 9100}}
[CVL] ValidateEditConfig PASS
[db] Redis: HMSET CONFIG_DB:PORT|Ethernet0 mtu 9100

Redis MONITOR:
1678901234.567 [4 172.17.0.5:12345] "HMSET" "PORT|Ethernet0" "mtu" "9100"`}
        />
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What is translib?",
              "Translib is the orchestration layer in sonic-mgmt-common that both REST and gNMI call for all CRUD operations. It provides a unified API (Create, Update, Replace, Delete, Get, Action, Subscribe), routes requests to app modules, drives transformers, validates with CVL, and commits to Redis. One implementation, two protocols.",
            ],
            [
              "Why does translib use a two-phase design (translate → process)?",
              "Phase 1 (translate) builds the change as an in-memory dbmap without writing to Redis. CVL validates this dbmap. If invalid, we abort before touching Redis — no rollback needed. Phase 2 (process) executes the write only if CVL passed. This gives transaction semantics and prevents partial/invalid writes.",
            ],
            [
              "Walk me through a PATCH /interfaces/.../config {mtu: 9100}.",
              "1) REST server calls translib.Update(SetRequest). 2) Translib acquires config lock, unmarshals JSON to ygot struct. 3) getAppModule() → CommonApp. 4) translateUpdate() calls XlateToDb → transformer consults annotations, builds dbmap {PORT|Ethernet0: {mtu:9100}}. 5) CVL validates sonic-port.yang range. 6) processUpdate() calls db.SetEntry, HMSET to CONFIG_DB. 7) Lock released, HTTP 204 returned.",
            ],
            [
              "How does translib handle GET requests for state data?",
              "translib.Get() → CommonApp.translateGet() → XlateFromDb builds a read plan (which DBs/tables/keys to query, based on annotations). processGet() executes: db.GetEntry() from APPL_DB, COUNTERS_DB, etc. Transformers convert Redis data → ygot struct. ygot.Marshal → JSON. Returned as GetResponse.Payload.",
            ],
            [
              "What is the app registry?",
              "A map[pathPrefix] → appInterface. translib uses it to route requests: /openconfig-interfaces → CommonApp (transformer-driven), /sonic-db → DbApp (direct Redis for legacy). CommonApp handles ~95% of OC paths. The registry is built at init() time.",
            ],
            [
              "What is CommonApp?",
              "The main app module (translib/common_app.go) that implements appInterface for OpenConfig paths. It calls the transformer engine (XlateToDb/FromDb) to map OC ↔ Redis. It's 'common' because it handles all standard OC modules generically — no hardcoded logic per feature.",
            ],
            [
              "How does CVL fit into the translib flow?",
              "After translateUpdate() builds dbmap, translib calls CVL.ValidateEditConfig(dbmap). CVL loads sonic-*.yang schemas, checks range constraints, must statements, leafrefs, cross-table dependencies. If PASS, processUpdate() writes to Redis. If FAIL, translib returns SetResponse{ErrSrc: CVL, Err: ...}, no Redis write.",
            ],
            [
              "What does translib/db provide?",
              "A Redis client wrapper with: NewDB(dbNum), SetEntry/GetEntry/DeleteEntry (table, key, fields), transaction support (StartTx/CommitTx wraps MULTI/EXEC), key enumeration (GetKeys for list queries). It batches multiple Set/Del calls into one MULTI/EXEC for atomicity.",
            ],
            [
              "How are translib errors mapped to HTTP status codes?",
              "SetResponse.ErrSrc tells where the error came from. rest_server maps: CVL error → 400 Bad Request (client sent invalid data), transformer 'not found' → 404, DB error → 503, app error → 500. The error message is serialized as IETF RESTCONF JSON error format.",
            ],
            [
              "Can translib handle gNMI Subscribe (streaming telemetry)?",
              "Yes, translib.Subscribe() uses Redis keyspace notifications. When CONFIG_DB changes, Redis publishes to __keyspace@4__:*, translib catches it, calls translateGet() for the changed path, streams the new value as a gNMI SubscribeResponse. It's ON_CHANGE mode (not SAMPLE).",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Location", "sonic-mgmt-common/translib/"],
            ["Public API", "Create, Update, Replace, Delete, Get, Action, Subscribe"],
            ["Who calls it", "rest_server (RESTCONF) and gnmi_server (gNMI) both call translib"],
            ["App registry", "map[pathPrefix] → appInterface; routes /oc-if → CommonApp"],
            ["CommonApp", "Transformer-driven app for ~95% of OpenConfig paths (translib/common_app.go)"],
            ["Two phases", "Phase 1: translate (build dbmap), Phase 2: process (write Redis)"],
            ["Why two-phase", "CVL validates BETWEEN phases → invalid configs never touch Redis"],
            ["SetRequest", "{Path, Payload (JSON), User, AuthEnabled}"],
            ["SetResponse", "{ErrSrc (app/transformer/CVL/DB), Err}"],
            ["GetRequest", "{Path, Depth, Content (config/state/all), Fields}"],
            ["DB layer", "translib/db: SetEntry/GetEntry/DeleteEntry + MULTI/EXEC transactions"],
            ["Error mapping", "CVL→400, transformer not-found→404, DB→503, app→500"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
