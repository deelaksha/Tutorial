"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Where the code lives and who calls whom",
  nodes: [
    { id: "mgmtfw", icon: "🚪", label: "sonic-mgmt-framework", sub: "REST + CLI", x: 15, y: 22, color: "#22d3ee" },
    { id: "gnmi", icon: "📡", label: "sonic-gnmi", sub: "telemetry", x: 15, y: 78, color: "#60a5fa" },
    { id: "common", icon: "📦", label: "sonic-mgmt-common", sub: "translib·cvl·yang", x: 42, y: 50, color: "#a78bfa" },
    { id: "hostsvc", icon: "🐍", label: "sonic-host-services", sub: "hostcfgd", x: 68, y: 22, color: "#34d399" },
    { id: "buildimage", icon: "🏗️", label: "sonic-buildimage", sub: "templates·build", x: 68, y: 78, color: "#fb923c" },
    { id: "switch", icon: "🦔", label: "Running switch", sub: "CONFIG_DB+files", x: 90, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "mgmt-common", from: "mgmtfw", to: "common", color: "#a78bfa" },
    { id: "gnmi-common", from: "gnmi", to: "common", color: "#a78bfa" },
    { id: "common-switch", from: "common", to: "switch", color: "#f472b6" },
    { id: "host-switch", from: "hostsvc", to: "switch", color: "#f472b6" },
    { id: "build-switch", from: "buildimage", to: "switch", color: "#fb923c" },
    { id: "mgmt-host", from: "mgmtfw", to: "hostsvc", bend: 20, color: "#34d399" },
  ],
  flows: [
    {
      id: "patch",
      name: "🔀 Follow a PATCH",
      command: "curl -X PATCH /restconf/data/openconfig-interfaces:interfaces",
      steps: [
        { node: "mgmtfw", paths: ["mgmt-common"], text: "User sends PATCH → rest_server.go receives it, extracts YANG path, calls translib.Set()." },
        { node: "common", paths: ["mgmt-common"], text: "translib (in mgmt-common) validates payload via CVL, maps YANG→Redis via transformer callbacks (xfmr_intf.go)." },
        { node: "common", paths: ["common-switch"], text: "translib writes to CONFIG_DB (Redis DB 4): INTERFACE|Ethernet0 → state:up. The write succeeds." },
        { node: "hostsvc", paths: ["host-switch"], text: "hostcfgd (python daemon in host-services) subscribes to CONFIG_DB keyspace events, sees INTERFACE change." },
        { node: "switch", paths: [], text: "hostcfgd renders /etc/network/interfaces via Jinja template (from buildimage), runs 'ifup Ethernet0'. Interface is UP. ✅" },
      ],
    },
    {
      id: "buildfail",
      name: "💥 Build break",
      command: "git push YANG change, container not rebuilt",
      steps: [
        { node: "common", paths: [], text: "Developer adds new openconfig-system.yang leaf in sonic-mgmt-common, pushes the commit. YANG is now in the repo." },
        { node: "mgmtfw", paths: ["mgmt-common"], text: "Developer rebuilds sonic-mgmt-framework container WITHOUT rebuilding mgmt-common (stale go.mod points to old commit)." },
        { node: "mgmtfw", paths: [], text: "REST server starts, serves OLD YANG schema — new leaf missing from OpenAPI spec. Client 404s. Build break. 🔴" },
        { node: "buildimage", paths: ["build-switch"], text: "Fix: update mgmt-common git hash in sonic-buildimage rules/sonic-mgmt-common.mk, rebuild both containers." },
      ],
    },
    {
      id: "gnmipath",
      name: "📡 gNMI telemetry path",
      command: "gnmi_get -xpath /openconfig-interfaces:interfaces/interface[name=Ethernet0]/state",
      steps: [
        { node: "gnmi", paths: ["gnmi-common"], text: "gNMI client sends Get RPC → gnmi_server in telemetry container receives it, parses YANG path." },
        { node: "common", paths: ["gnmi-common"], text: "gnmi_server calls the SAME translib.Get() (shared code!) — translib is the single source of truth for YANG → DB mapping." },
        { node: "common", paths: ["common-switch"], text: "transformer reads STATE_DB + APPL_DB for interface oper-state, aggregates counters, returns YANG-modeled JSON." },
        { node: "gnmi", paths: [], text: "gnmi_server encodes response as gNMI GetResponse protobuf, streams to client. Both REST and gNMI use the SAME backend. 🎯" },
      ],
    },
  ],
};

const NAV = [
  { id: "overview", label: "The Three-Repo Structure" },
  { id: "mgmt-common", label: "sonic-mgmt-common — The Core ⭐" },
  { id: "translib-internals", label: "Inside Translib: Call Flow ⭐" },
  { id: "cvl-deep", label: "CVL: Schema Validation Engine" },
  { id: "mgmt-framework", label: "sonic-mgmt-framework — REST + CLI" },
  { id: "rest-flow", label: "REST Request Journey" },
  { id: "klish-cli", label: "CLI (klish) Architecture" },
  { id: "host-services", label: "sonic-host-services — hostcfgd ⭐" },
  { id: "build-system", label: "Build System & Dependencies" },
  { id: "dev-workflow", label: "Developer Workflow" },
  { id: "lab", label: "Lab: Source Code Treasure Hunt" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SourceWalkthroughPage() {
  return (
    <TopicShell
      icon="🗺️"
      title="Source Code Walkthrough — The Three Repos"
      gradientWord="Source"
      subtitle="Where does the REST handler live? Which file validates YANG? How does a Jinja template end up as /etc config? A guided tour through sonic-mgmt-common (translib+CVL+YANG), sonic-mgmt-framework (REST+CLI), sonic-host-services (hostcfgd), and the build glue that ties them together."
      nav={NAV}
      badges={["🗂️ File-by-file map", "🔀 Call graphs", "🛠️ Dev workflow", "🧪 Real paths"]}
      next={{ icon: "🐛", label: "Debugging Masterclass", href: "/sonic/debugging" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="overview" number="01" title="The Three-Repo Structure">
        <P>
          The SONiC Management Framework spans <strong>three GitHub repos</strong>. Each has a distinct role, but they compile into a unified system running in Docker containers. Here&apos;s the map:
        </P>
        <Table
          head={["Repository", "What it contains", "Who imports it"]}
          rows={[
            [
              <IC key="1">sonic-net/sonic-mgmt-common</IC>,
              "translib (Go business logic), CVL (YANG validator), YANG models, DB schema, transformer callbacks (xfmr_*.go, xlate_*.go)",
              "mgmt-framework, gnmi — both import as Go module",
            ],
            [
              <IC key="2">sonic-net/sonic-mgmt-framework</IC>,
              "REST server (rest/main/main.go, rest/server/), CLI frontend (klish XML + Python actioners), OpenAPI codegen, TLS+PAM auth",
              "runs in mgmt-framework container, imports mgmt-common",
            ],
            [
              <IC key="3">sonic-net/sonic-host-services</IC>,
              "hostcfgd (Python daemon), D-Bus helpers (reboot, showtech), config-engine plugins (Jinja template renderer)",
              "runs on host OS, subscribes to CONFIG_DB changes",
            ],
          ]}
        />
        <CodeBlock
          title="supporting_cast.txt"
          runnable={false}
          code={`SUPPORTING REPOS (you'll reference these too):
┌─────────────────────────────────────────────────────────────┐
│ sonic-gnmi        telemetry container: gNMI server that    │
│                   imports translib (same backend as REST)  │
│ sonic-buildimage  SONiC's master build system: Makefiles,  │
│                   Docker recipes, /etc templates (Jinja),  │
│                   dependency pinning (rules/*.mk)          │
│ sonic-swss-common RedisDB C++ helpers (swsssdk in Python)  │
└─────────────────────────────────────────────────────────────┘

dependency flow: buildimage orchestrates → builds mgmt-common
                 → links it into mgmt-framework + gnmi containers
                 → installs host-services .deb on host`}
        />
        <Callout type="tip">
          💡 <strong>Reading order for newcomers:</strong> (1) mgmt-common/translib/README → understand app_interface.go. (2) Pick ONE transformer (xfmr_intf.go is simplest) → see YANG↔DB mapping. (3) Follow a REST request in mgmt-framework/rest/server/router.go. (4) Trace hostcfgd handling a CONFIG_DB write. That 4-step loop covers 80% of the framework.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="mgmt-common" number="02" title="sonic-mgmt-common — The Core ⭐">
        <P>
          This is the <strong>single source of truth</strong>. Both REST and gNMI call into the same translib code. If you fix a bug here, both APIs get the fix.
        </P>
        <CodeBlock
          title="mgmt-common_tree.txt"
          runnable={false}
          code={`github.com/sonic-net/sonic-mgmt-common/
├── translib/               ← Go business logic layer
│   ├── translib.go         entry points: Create/Get/Replace/Update/Delete/Subscribe
│   ├── app_interface.go    interface every "app" must implement
│   ├── common_app.go       generic app (no custom code, pure YANG↔DB)
│   ├── db/                 RedisDB client wrappers (ConfigDB, ApplDB, StateDB...)
│   ├── transformer/        YANG ↔ Redis mapping callbacks
│   │   ├── xfmr_intf.go       interfaces (Ethernet*, PortChannel*)
│   │   ├── xfmr_acl.go        ACL rules
│   │   ├── xfmr_bgp.go        BGP config
│   │   ├── xlate_*.go         table-level transformers
│   │   └── xfmr_common.go     utilities (keyXlate, dbToYang helpers)
│   └── ocbinds/            auto-generated Go structs (ygot) from YANG
├── cvl/                    ← Config Validation Library (YANG syntax+semantics)
│   ├── cvl.go              main API: ValidateConfig(), ValidateEditConfig()
│   ├── cvl_syntax.go       YANG syntax checks (leaf types, ranges)
│   ├── cvl_semantics.go    must/when/leafref validation (XPath via antlr4)
│   └── schema/             compiled .yin cache (from YANG)
├── models/yang/            ← YANG models
│   ├── sonic/              SONiC-native YANG (sonic-interface.yang, etc.)
│   ├── openconfig/         OpenConfig models (oc-interfaces.yang, oc-bgp.yang...)
│   ├── ietf/               IETF standards (ietf-yang-types.yang)
│   └── annotations/        SONiC deviation files (map OC → SONiC Redis tables)
└── tools/pyang/            pyang plugins for code generation`}
        />
        <Callout type="behind">
          ⚙️ <strong>Why annotations?</strong> OpenConfig YANG describes ideal vendor-neutral config. SONiC&apos;s Redis schema uses table names like <IC>INTERFACE|Ethernet0</IC>. The annotation files (e.g., <IC>sonic-interface-annot.yang</IC>) tell translib: &quot;when user writes /openconfig-interfaces:interfaces/interface[name=Eth0]/config/enabled → write CONFIG_DB key INTERFACE|Ethernet0 field admin_status.&quot; This is the <strong>glue</strong> between the two worlds.
        </Callout>
        <P>
          <strong>Key files you&apos;ll read first:</strong>
        </P>
        <Table
          head={["File", "Role", "Start here"]}
          rows={[
            [
              <IC key="1">translib/translib.go</IC>,
              "Public API: Create, Get, Set, Delete, Subscribe — the 5 RESTCONF verbs",
              "Read the function signatures, trace one Set() call",
            ],
            [
              <IC key="2">translib/app_interface.go</IC>,
              "Interface definition: every app (IntfApp, AclApp, BgpApp) implements initialize, translateCreate, translateUpdate, etc.",
              "Understand the contract — apps are plugins",
            ],
            [
              <IC key="3">translib/common_app.go</IC>,
              "Generic app: handles YANG paths with NO custom Go code (uses only annotations + ygot reflection). 70% of SONiC config goes through this.",
              "See how it dispatches to transformer callbacks",
            ],
            [
              <IC key="4">transformer/xfmr_intf.go</IC>,
              "Interface transformer: XlateFuncBind map, subtree callbacks (YangToDb_intf_name, DbToYang_intf_state_get_xfmr)",
              "Search for 'XlateFuncBind' — callbacks registered here",
            ],
            [
              <IC key="5">cvl/cvl.go</IC>,
              "Entry point for validation: ValidateEditConfig(jsonPayload, cvl.OP_CREATE) → bool + CVLErrorInfo",
              "See the public functions, then dig into syntax/semantics",
            ],
          ]}
        />
      </Section>

      {/* 03 */}
      <Section id="translib-internals" number="03" title="Inside Translib: Call Flow ⭐">
        <P>
          When a REST PATCH arrives, here&apos;s the internal journey through translib (simplified to 9 steps):
        </P>
        <CodeBlock
          title="translib_set_flow.txt"
          runnable={false}
          code={`SET request (PATCH/PUT/POST)
═══════════════════════════════════════════════════════════
 1  rest_server.go receives HTTP request
         ↓
 2  translib.Set(SetRequest{Path, Payload}) called
         ↓
 3  path parsing: "/openconfig-interfaces:interfaces/interface[name=Eth0]/config"
         → uri2DbMap: which app handles this? → IntfApp
         ↓
 4  app.initialize() → IntfApp loads YANG schema, prepares ygot
         ↓
 5  CVL.ValidateEditConfig(payload) → syntax + semantics check
         → if fail: return 400 + CVLErrorInfo
         ↓
 6  app.translateUpdate() → calls transformer callbacks
         → xfmr_intf.go: YangToDb_intf_enabled_xfmr()
         → produces: {table:"INTERFACE", key:"Ethernet0", field:"admin_status", value:"up"}
         ↓
 7  translib/db layer: write to CONFIG_DB (redis HSET)
         → CONFIG_DB.HSET("INTERFACE|Ethernet0", "admin_status", "up")
         ↓
 8  Redis keyspace notification fires (if enabled: notify-keyspace-events AKE)
         → hostcfgd receives event (subscribed to __keyspace@4__:*)
         ↓
 9  hostcfgd applies config to Linux (see §08)

GET request flow is similar but reversed:
  DbToYang transformers read Redis → populate ygot structs → marshal JSON`}
        />
        <Callout type="note">
          📌 <strong>The XlateFuncBind map</strong> in each xfmr_*.go file is the router: it maps YANG paths to Go callback functions. Example from <IC>xfmr_intf.go</IC>:<br/><br/>
          <IC>{`var XlateFuncBind = map[string]interface{}{`}</IC><br/>
          <IC>&nbsp;&nbsp;{`"/openconfig-interfaces:interfaces/interface/config/enabled": YangToDb_intf_enabled_xfmr,`}</IC><br/>
          <IC>&nbsp;&nbsp;{`"/openconfig-interfaces:interfaces/interface/state": DbToYang_intf_state_get_xfmr,`}</IC><br/>
          <IC>{`}`}</IC><br/><br/>
          When translib needs to convert YANG leaf &quot;enabled&quot; → it looks up this map, finds the callback, calls it with (db, yangNode) args.
        </Callout>
        <CodeBlock
          title="get_flow_ascii.txt"
          runnable={false}
          code={`GET request (simplified)
═══════════════════════════════════════════════════════════
 REST /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/state
   ↓
 translib.Get(GetRequest{Path, DepthLevel})
   ↓
 IntfApp.translateGet() → DbToYang transformer
   ↓
 Redis HGETALL APPL_DB:PORT_TABLE:Ethernet0 + STATE_DB:PORT_TABLE:Ethernet0
   ↓
 transformer merges oper-state + counters → ygot struct
   ↓
 ygot.Marshal() → JSON
   ↓
 200 OK + JSON body`}
        />
      </Section>

      {/* 04 */}
      <Section id="cvl-deep" number="04" title="CVL: Schema Validation Engine">
        <P>
          CVL (Config Validation Library) is the gatekeeper. Before any write reaches Redis, CVL checks: (1) <strong>syntax</strong> — does the JSON match YANG types/ranges? (2) <strong>semantics</strong> — do &apos;must&apos; constraints, leafrefs, and &apos;when&apos; conditions hold?
        </P>
        <CodeBlock
          title="cvl_stages.txt"
          runnable={false}
          code={`CVL validation pipeline (3 stages):
┌────────────────────────────────────────────────────────┐
│ STAGE 1: SYNTAX (cvl_syntax.go)                       │
│  • JSON unmarshal → check leaf is correct type        │
│  • range/length checks (e.g., VLAN ID 1-4094)         │
│  • pattern regex (e.g., IP address format)            │
│  • enum membership                                     │
│  • if fail → CVLRetCode syntax error                  │
└────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────┐
│ STAGE 2: SEMANTICS (cvl_semantics.go)                 │
│  • leafref: does this key exist in another table?     │
│  • must expressions (XPath) via antlr4 parser         │
│  • when conditions (conditional leaves)               │
│  • unique constraints                                  │
│  • if fail → CVLRetCode semantic error + XPath trace  │
└────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────┐
│ STAGE 3: CUSTOM VALIDATION (platform-specific)        │
│  • some apps add Go validation callbacks              │
│  • e.g., BgpApp checks AS number isn't in use         │
└────────────────────────────────────────────────────────┘
         ↓
      PASS → translib proceeds to DB write
      FAIL → return CVLErrorInfo (errCode, tableName, keys, field, msg)`}
        />
        <CodeBlock
          title="cvl_example.go"
          code={`// Typical CVL call in translib (simplified)
import "github.com/Azure/sonic-mgmt-common/cvl"

payload := \`{"admin_status": "up", "mtu": 9100}\`
op := cvl.OP_UPDATE

cv, _ := cvl.ValidationSessOpen()
defer cv.ValidationSessClose()

ret := cv.ValidateEditConfig([]byte(payload))
if ret.RetCode != cvl.CVL_SUCCESS {
    // ret.ErrAppTag = "must-violation" or "leafref-invalid" etc.
    // ret.ConstraintErrMsg = "MTU exceeds platform max 9216"
    return errors.New(ret.ConstraintErrMsg)
}
// validation passed → proceed to Redis write`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Common confusion:</strong> CVL checks YANG <em>schema</em> constraints (must, leafref), but it does NOT check Linux-kernel-level feasibility (e.g., whether a bond interface name is reserved). That second check happens in hostcfgd or the app daemon. If CVL passes but the daemon fails, you get a Redis entry with no real effect — this is the &quot;silent failure&quot; scenario (see debugging page).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="mgmt-framework" number="05" title="sonic-mgmt-framework — REST + CLI">
        <CodeBlock
          title="mgmt-framework_tree.txt"
          runnable={false}
          code={`github.com/sonic-net/sonic-mgmt-framework/
├── rest/
│   ├── main/
│   │   └── main.go            server bootstrap: TLS setup, router init, PAM auth middleware
│   └── server/
│       ├── router.go          mux routes: /restconf → handler, /ui → Swagger UI
│       ├── handler_common.go  HTTP method dispatch (GET/POST/PATCH/DELETE → translib verbs)
│       ├── handler_data.go    /restconf/data handler (YANG instance paths)
│       ├── handler_operations.go  /restconf/operations (RPC calls)
│       └── auth.go            PAM + JWT token validation
├── CLI/
│   ├── clitree/cli-xml/       klish XML command trees (show_*.xml, config_*.xml)
│   ├── actioner/              Python scripts that render klish → REST calls
│   │   └── sonic_cli_if.py    main actioner: parses XML params, calls REST API
│   └── renderer/              Jinja2 templates for 'show' command output formatting
│       └── templates/
│           └── show_interface.j2
└── build/
    ├── rest_server/           Dockerfile + supervisord.conf
    └── codegen/               pyang plugins: YANG → OpenAPI spec generator`}
        />
        <P>
          <strong>rest/main/main.go</strong> is the entry point. It:
        </P>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>Loads TLS certificates (<IC>/etc/sonic/credentials/</IC>)</li>
          <li>Initializes translib (loads YANG, connects to Redis)</li>
          <li>Sets up Gorilla mux router (<IC>/restconf/data/*</IC>, <IC>/restconf/operations/*</IC>)</li>
          <li>Wraps handlers in PAM auth middleware (checks <IC>/etc/passwd</IC>, <IC>/etc/tacacs+</IC>)</li>
          <li>Starts HTTPS listener on port 443 (or 8080 in dev mode)</li>
        </ol>
      </Section>

      {/* 06 */}
      <Section id="rest-flow" number="06" title="REST Request Journey">
        <CodeBlock
          title="rest_request_trace.txt"
          runnable={false}
          code={`Example: PATCH /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config
         Body: {"enabled": true, "mtu": 9100}

STEP-BY-STEP TRACE:
─────────────────────────────────────────────────────────────
 1  Client → HTTPS request arrives at rest_server container (port 443)
         File: rest/main/main.go → http.ListenAndServeTLS()

 2  TLS handshake + cert validation
         Cert: /etc/sonic/credentials/restapiserver.crt

 3  Router matches path → calls handler_data.go:handleDataRequest()
         Method: PATCH → dispatchUpdate()

 4  Auth middleware: PAM checks username/password or JWT token
         File: rest/server/auth.go → authenticateUser()
         On fail: 401 Unauthorized

 5  Extract YANG path + JSON payload
         Path: /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
         Payload: unmarshaled into translib.SetRequest struct

 6  Call translib.Set(req) → [jumps to mgmt-common code, see §03]
         Returns: SetResponse{ErrSrc, Err}

 7  If translib error:
         CVL fail (400) / not found (404) / internal panic (500)
         Return HTTP error + JSON body: {"ietf-restconf:errors": {...}}

 8  If success:
         204 No Content (PATCH standard for successful update with no response body)

 9  glog writes to /var/log/syslog:
         "rest_server[1234]: PATCH /openconfig-interfaces:... 204 (123ms)"`}
        />
        <Callout type="tip">
          🎯 <strong>Interview gold:</strong> &quot;The REST server is just a thin HTTP-to-translib adapter. The real logic lives in mgmt-common. This design means gNMI, REST, and future protocols (NETCONF?) all share one tested backend — no duplicate bugs.&quot;
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="klish-cli" number="07" title="CLI (klish) Architecture">
        <P>
          SONiC&apos;s CLI is <strong>klish</strong> (fork of clish), configured via XML files. When you type <IC>config interface Ethernet0 mtu 9100</IC>, here&apos;s what happens:
        </P>
        <CodeBlock
          title="cli_flow.txt"
          runnable={false}
          code={`CLI command lifecycle:
═══════════════════════════════════════════════════════════
 1  User types command in SONiC shell (connected via SSH)
         → klish parser (C binary) running in mgmt-framework container

 2  klish loads XML tree: CLI/clitree/cli-xml/sonic-clish.xml
         <COMMAND name="mtu" help="Set MTU">
           <ACTION>python $SONIC_CLI_ROOT/actioner/sonic_cli_if.py patch ...

 3  klish executes <ACTION> → calls Python actioner script
         Script: CLI/actioner/sonic_cli_if.py
         Args: ["patch", "openconfig-interfaces:interfaces", "Ethernet0", "mtu=9100"]

 4  Actioner constructs REST API call
         Method: PATCH
         URL: https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config
         Body: {"mtu": 9100}
         Auth: uses local Unix socket (bypasses HTTPS for localhost)

 5  REST server handles it (see §06) → translib → CONFIG_DB

 6  Response comes back:
         204 → actioner returns success, klish prints nothing (silent success)
         4xx/5xx → actioner parses JSON error, klish prints:
           "Error: MTU exceeds platform maximum 9216"

For SHOW commands (not config):
  klish → Python actioner → REST GET → translib → Redis GET
  → JSON response → Jinja2 renderer (CLI/renderer/templates/show_*.j2)
  → formatted table output to terminal`}
        />
        <CodeBlock
          title="cli_xml_snippet.xml"
          runnable={false}
          code={`<!-- Example: CLI/clitree/cli-xml/interface.xml -->
<COMMAND name="mtu"
         help="Configure MTU"
         ptype="SUBCOMMAND"
         mode="subcommand">
  <PARAM name="mtu-val" help="MTU (68-9216)" ptype="RANGE_MTU"/>
  <ACTION>
    python \${SONIC_CLI_ROOT}/actioner/sonic_cli_if.py patch \\
      openconfig-interfaces:interfaces/interface \\
      \${iface} config/mtu=\${mtu-val}
  </ACTION>
</COMMAND>

<!-- When user types: (config-if-Ethernet0)# mtu 9100
     klish substitutes: \${iface}=Ethernet0, \${mtu-val}=9100
     calls: python sonic_cli_if.py patch ... config/mtu=9100 -->`}
        />
      </Section>

      {/* 08 */}
      <Section id="host-services" number="08" title="sonic-host-services — hostcfgd ⭐">
        <P>
          <IC>hostcfgd</IC> is the Python daemon running on the <strong>host OS</strong> (not in a container). It subscribes to CONFIG_DB changes and applies them to Linux.
        </P>
        <CodeBlock
          title="hostcfgd_flow.txt"
          runnable={false}
          code={`hostcfgd runtime (simplified):
═══════════════════════════════════════════════════════════
 1  systemd starts: systemctl start hostcfgd.service
         File: /usr/bin/hostcfgd (Python)
         Repo: sonic-host-services/scripts/hostcfgd

 2  hostcfgd connects to Redis CONFIG_DB (db 4)
         Uses: swsssdk.ConfigDBConnector
         Subscribes to keyspace notifications: __keyspace@4__:*

 3  Redis event fires: HSET INTERFACE|Ethernet0 admin_status up
         hostcfgd callback: handle_interface_config_change()

 4  hostcfgd reads full key: CONFIG_DB.get_all("INTERFACE|Ethernet0")
         Returns: {"admin_status": "up", "mtu": "9100"}

 5  Renders Jinja template (from sonic-buildimage):
         Template: files/image_config/interfaces/interfaces.j2
         Produces: /etc/network/interfaces snippet:
           auto Ethernet0
           iface Ethernet0 inet manual
             mtu 9100
             pre-up ip link set dev Ethernet0 up

 6  Calls Linux command: ifup Ethernet0
         Kernel applies: MTU set, link up

 7  If command fails (e.g., invalid MTU):
         hostcfgd logs error to journalctl -u hostcfgd
         Redis key stays (stale!), but Linux unchanged (see debugging §11)`}
        />
        <Callout type="behind">
          ⚙️ <strong>Why not apply config in translib?</strong> Translib runs in a Docker container with limited privileges. The host OS owns <IC>/etc</IC>, kernel networking, systemd services. hostcfgd bridges the gap: it has root privileges on the host, reads CONFIG_DB (shared with containers via Redis TCP), and executes the privileged commands. This separation = containers can&apos;t accidentally break the switch.
        </Callout>
        <CodeBlock
          title="hostcfgd_handlers.py"
          code={`# Simplified excerpt from sonic-host-services/scripts/hostcfgd
from swsssdk import ConfigDBConnector

db = ConfigDBConnector()
db.connect()
db.subscribe('INTERFACE', lambda table, key, data: handle_interface(key, data))

def handle_interface(key, data):
    # key = "Ethernet0", data = {"admin_status": "up", "mtu": "9100"}
    iface = key.split('|')[-1]
    if data.get('admin_status') == 'up':
        os.system(f'ip link set dev {iface} up')
    mtu = data.get('mtu')
    if mtu:
        os.system(f'ip link set dev {iface} mtu {mtu}')
    # real code: uses Jinja2 + templates, not raw os.system

db.listen()  # blocking event loop`}
        />
      </Section>

      {/* 09 */}
      <Section id="build-system" number="09" title="Build System & Dependencies">
        <P>
          <IC>sonic-buildimage</IC> orchestrates everything. It clones the three repos, compiles Go binaries, builds Docker images, and assembles the final SONiC image (.bin).
        </P>
        <CodeBlock
          title="build_deps.txt"
          runnable={false}
          code={`Key build files in sonic-buildimage:
┌──────────────────────────────────────────────────────────┐
│ rules/sonic-mgmt-common.mk                               │
│   defines: GIT_COMMIT hash, Go build flags              │
│   output: libswsscommon.so, translib Go pkg             │
│                                                          │
│ rules/sonic-mgmt-framework.mk                            │
│   depends: sonic-mgmt-common (links translib)           │
│   builds: rest_server binary, CLI XML trees             │
│   output: Docker image sonic-mgmt-framework             │
│                                                          │
│ rules/sonic-gnmi.mk                                      │
│   depends: sonic-mgmt-common (same translib!)           │
│   builds: gnmi_server binary                            │
│   output: Docker image sonic-telemetry                  │
│                                                          │
│ files/image_config/                                      │
│   Jinja templates: interfaces.j2, frr.conf.j2, etc.     │
│   consumed by: hostcfgd at runtime                      │
│                                                          │
│ rules/sonic-host-services.mk                             │
│   builds: Python .deb package (hostcfgd + D-Bus modules)│
│   installs: /usr/bin/hostcfgd on host OS                │
└──────────────────────────────────────────────────────────┘

Dependency graph (simplified):
   sonic-buildimage (master)
        ├─ clones sonic-mgmt-common @ commit abc123
        │    └─ builds translib.a
        ├─ clones sonic-mgmt-framework @ commit def456
        │    └─ imports translib, builds rest_server
        ├─ clones sonic-gnmi @ commit 789abc
        │    └─ imports same translib, builds gnmi_server
        └─ packages sonic-host-services .deb`}
        />
        <CodeBlock
          title="go_mod_deps.txt"
          runnable={false}
          code={`# sonic-mgmt-framework/go.mod (excerpt)
module github.com/Azure/sonic-mgmt-framework/rest

require (
    github.com/Azure/sonic-mgmt-common/translib v0.0.0  // pinned to specific commit
    github.com/openconfig/ygot v0.29.0                  // YANG → Go struct codegen
    github.com/openconfig/goyang v1.2.0                 // YANG parser
    github.com/go-redis/redis/v8 v8.11.5                // Redis client
    github.com/gorilla/mux v1.8.0                       // HTTP router
    golang.org/x/crypto v0.14.0                         // TLS
)

# CVL uses antlr4 for XPath parsing (must expressions in YANG)
# sonic-mgmt-common/cvl/go.mod:
require github.com/antlr/antlr4/runtime/Go/antlr v1.4.10`}
        />
        <Callout type="note">
          📌 <strong>Common build break:</strong> Developer pushes YANG change to mgmt-common but forgets to update the <IC>GIT_COMMIT</IC> hash in <IC>sonic-buildimage/rules/sonic-mgmt-common.mk</IC>. The mgmt-framework container rebuilds with OLD translib code. New YANG leaf is missing. REST returns 404. Fix: bump the hash, rebuild <strong>both</strong> mgmt-common and mgmt-framework.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="dev-workflow" number="10" title="Developer Workflow">
        <P>
          You don&apos;t need to rebuild the entire SONiC image for every code change. Here&apos;s the fast dev loop:
        </P>
        <CodeBlock
          title="dev_loop.sh"
          code={`#!/bin/bash
# Fast development workflow (on a running SONiC switch or VM)

# STEP 1: Clone the repo you're modifying (example: translib change)
git clone https://github.com/sonic-net/sonic-mgmt-common.git
cd sonic-mgmt-common/translib

# STEP 2: Make your code change (e.g., edit xfmr_intf.go)
vim transformer/xfmr_intf.go

# STEP 3: Build translib locally (requires Go 1.19+)
make

# STEP 4: Run unit tests (before deploying)
go test ./... -v
# Look for PASS on all transformer tests

# STEP 5: Copy modified binary into the container (dev mount)
# Option A: docker cp (quick but not persistent across restarts)
docker cp translib/libtranslib.so sonic-mgmt-framework:/usr/lib/
docker restart sonic-mgmt-framework

# Option B: bind-mount during development (edit docker-compose)
# Add to /etc/sonic/docker_config.json:
#   "volumes": ["/home/admin/sonic-mgmt-common:/mnt/mgmt-common:ro"]
# Then symlink the .so inside the container

# STEP 6: Test your change
curl -k -u admin:YourPaSsWoRd -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"enabled": true}'

# STEP 7: Check logs for your debug prints (glog)
docker logs sonic-mgmt-framework --tail 50 | grep -i "your_debug_marker"

# For YANG changes:
# 1. Edit models/yang/sonic/sonic-your-feature.yang
# 2. Regenerate ygot bindings: make generate
# 3. Rebuild container (no shortcut here — YANG bakes into OpenAPI spec)`}
        />
        <Callout type="tip">
          💡 <strong>Faster iteration:</strong> For pure transformer logic changes (no YANG edits), you can modify the Go code, rebuild just translib, and docker cp the .so into the running container. For YANG schema changes, you must rebuild the container (because OpenAPI spec + CVL cache need regeneration). Use <IC>make target/docker-sonic-mgmt-framework.gz</IC> in sonic-buildimage (builds one container, not the whole image).
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="lab" number="11" title="Lab: Source Code Treasure Hunt">
        <P>
          <strong>Goal:</strong> Map 3 YANG paths to their transformer callbacks and count how many Redis keys they touch.
        </P>
        <CodeBlock
          title="lab_steps.sh"
          output={`$ git clone https://github.com/sonic-net/sonic-mgmt-common.git
Cloning into 'sonic-mgmt-common'...
done.

$ cd sonic-mgmt-common

$ grep -r "XlateFuncBind" translib/transformer | wc -l
24

$ grep -A5 "XlateFuncBind.*xfmr_intf" translib/transformer/xfmr_intf.go
var XlateFuncBind = map[string]interface{}{
    "/openconfig-interfaces:interfaces/interface/config/enabled": YangToDb_intf_enabled_xfmr,
    "/openconfig-interfaces:interfaces/interface/config/name":    YangToDb_intf_name_xfmr,
    "/openconfig-interfaces:interfaces/interface/state":          DbToYang_intf_state_get_xfmr,
}

$ vim translib/transformer/xfmr_intf.go
# Search for 'YangToDb_intf_enabled_xfmr' function definition:
# func YangToDb_intf_enabled_xfmr(inParams XfmrParams) (map[string]string, error) {
#     // line 87: reads inParams.uri, extracts interface name
#     // line 102: writes to dbMapOut["INTERFACE"][ifName]["admin_status"] = "up"/"down"
#     // line 110: also writes to APPL_DB PORT_TABLE for some platforms
#     // Answer: touches 2 Redis keys (CONFIG_DB INTERFACE + APPL_DB PORT)
# }

$ cat translib/app_interface.go | grep "type.*interface"
type appInterface interface {
    initialize(data appData)
    translateCreate(d *db.DB) ([]db.WatchKeys, error)
    translateUpdate(d *db.DB) ([]db.WatchKeys, error)
    translateReplace(d *db.DB) ([]db.WatchKeys, error)
    translateDelete(d *db.DB) ([]db.WatchKeys, error)
    translateGet(dbs [db.MaxDB]*db.DB) error
    translateSubscribe(req translateSubRequest) (translateSubResponse, error)
    processCreate(d *db.DB) (SetResponse, error)
    processUpdate(d *db.DB) (SetResponse, error)
    // ... every "app" plugin implements these 12 methods
}

─────────────────────────────────────────────────────────
Lab completed! Key findings:
1. 24 XlateFuncBind maps across all transformers (one per feature area)
2. intf_enabled_xfmr touches 2 Redis keys (CONFIG_DB + APPL_DB)
3. Every app implements 12 interface methods (the plugin contract)`}
          code={`# TASK 1: Count transformer binding maps
git clone https://github.com/sonic-net/sonic-mgmt-common.git
cd sonic-mgmt-common
grep -r "XlateFuncBind" translib/transformer | wc -l
# Expected: ~20-30 (one per xfmr_*.go file)

# TASK 2: Find the interface 'enabled' callback
grep -A5 "XlateFuncBind.*xfmr_intf" translib/transformer/xfmr_intf.go
# Look for: "/openconfig-interfaces:interfaces/interface/config/enabled"
# Maps to: YangToDb_intf_enabled_xfmr

# TASK 3: Open that transformer, count Redis keys it writes
vim translib/transformer/xfmr_intf.go
# Jump to YangToDb_intf_enabled_xfmr function
# Count: how many dbMapOut["TABLE_NAME"] writes?
# Answer: 2 (INTERFACE in CONFIG_DB, PORT in APPL_DB for some features)

# TASK 4: Trace the app_interface contract
cat translib/app_interface.go | grep "type.*interface"
# See the 12 methods every app must implement

# BONUS: Run a transformer unit test
go test ./translib/transformer -v -run TestIntfTransformer
# Watch it mock Redis, call the xfmr, verify DB writes`}
        />
        <P>
          <strong>Questions to answer after the lab:</strong>
        </P>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>Which file contains the ACL transformer? (Hint: <IC>xfmr_acl.go</IC>)</li>
          <li>How many YANG modules are in <IC>models/yang/openconfig/</IC>? (<IC>ls -1 | wc -l</IC>)</li>
          <li>What happens if a transformer returns an error? (translib aborts, returns 500 to REST, Redis unchanged)</li>
        </ol>
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["3 core repos", "mgmt-common (translib+CVL+YANG), mgmt-framework (REST+CLI), host-services (hostcfgd)"],
            ["translib entry", "translib.go: Create/Get/Set/Delete/Subscribe — 5 RESTCONF verbs"],
            ["Transformer map", "XlateFuncBind in xfmr_*.go: YANG path → YangToDb/DbToYang callback"],
            ["CVL stages", "syntax (types/ranges) → semantics (must/leafref XPath) → custom validation"],
            ["REST flow", "rest_server.go → auth → translib.Set() → CVL → transformer → Redis → hostcfgd"],
            ["CLI flow", "klish XML → Python actioner → REST API (localhost) → same translib backend"],
            ["hostcfgd role", "Subscribes CONFIG_DB keyspace events, renders Jinja templates, applies to Linux (ifup, systemctl, etc.)"],
            ["Build deps", "buildimage clones repos, pins git commits in rules/*.mk, builds Docker images + host .deb"],
            ["go.mod key deps", "ygot (YANG→Go), goyang (parser), redis client, gorilla/mux (router), antlr4 (CVL XPath)"],
            ["Dev loop", "Edit code → go test → docker cp .so into container → curl test → check logs"],
            ["gNMI shares translib", "sonic-gnmi imports same mgmt-common/translib — one backend, two protocols"],
            ["Reading order", "translib/README → app_interface.go → one xfmr_*.go → REST router.go → hostcfgd"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
