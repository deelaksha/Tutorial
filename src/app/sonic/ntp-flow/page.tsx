"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "config ntp add 10.1.1.1 — the complete journey",
  nodes: [
    { id: "client", icon: "🌐", label: "REST PATCH", sub: "curl / gNMI / KLISH", x: 5, y: 50, color: "#22d3ee" },
    { id: "rest", icon: "🚪", label: "REST server", sub: "mgmt-framework", x: 19, y: 22, color: "#60a5fa" },
    { id: "translib", icon: "📚", label: "Translib", sub: "+ Transformer", x: 33, y: 50, color: "#a78bfa" },
    { id: "cvl", icon: "🛡️", label: "CVL", sub: "schema validation", x: 47, y: 22, color: "#fb923c" },
    { id: "redis", icon: "🗄️", label: "CONFIG_DB", sub: "NTP_SERVER|10.1.1.1", x: 61, y: 50, color: "#34d399" },
    { id: "hostcfgd", icon: "🐍", label: "hostcfgd", sub: "NtpCfg handler", x: 75, y: 22, color: "#fbbf24" },
    { id: "jinja", icon: "🧩", label: "chrony.conf.j2", sub: "template render", x: 75, y: 78, color: "#f472b6" },
    { id: "chronyd", icon: "⏰", label: "chronyd", sub: "NTP daemon", x: 91, y: 50, color: "#10b981" },
  ],
  edges: [
    { id: "client-rest", from: "client", to: "rest", color: "#60a5fa" },
    { id: "rest-translib", from: "rest", to: "translib", color: "#a78bfa" },
    { id: "translib-cvl", from: "translib", to: "cvl", color: "#fb923c" },
    { id: "cvl-redis", from: "cvl", to: "redis", color: "#34d399" },
    { id: "redis-hostcfgd", from: "redis", to: "hostcfgd", color: "#fbbf24" },
    { id: "hostcfgd-jinja", from: "hostcfgd", to: "jinja", color: "#f472b6" },
    { id: "jinja-chronyd", from: "jinja", to: "chronyd", color: "#10b981" },
    { id: "cvl-client", from: "cvl", to: "client", bend: -35, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Add NTP server 10.1.1.1",
      command: "config ntp add 10.1.1.1 (or REST PATCH or gNMI set)",
      steps: [
        { node: "client", paths: ["client-rest"], text: "User runs 'config ntp add 10.1.1.1' (KLISH) OR curl REST PATCH /openconfig-system:system/ntp/servers/server=10.1.1.1/config OR gNMI Set. All converge to REST." },
        { node: "rest", paths: ["rest-translib"], text: "REST server (mgmt-framework) parses path, ygot unmarshals JSON payload into Go struct (ocbinds.OpenconfigSystem_System_Ntp_Servers_Server)." },
        { node: "translib", paths: ["translib-cvl"], text: "Translib routes to common_app. Transformer annotation maps /openconfig-system:system/ntp to SONiC table NTP_SERVER. Key xfmr ntp_server_key_xfmr returns '10.1.1.1'. DbMap: {\"NTP_SERVER\": {\"10.1.1.1\": {\"NULL\":\"NULL\"}}}." },
        { node: "cvl", paths: ["cvl-redis"], text: "CVL validates: OP_CREATE on NTP_SERVER|10.1.1.1. Checks sonic-ntp.yang: address type inet:ip-address → pattern OK. Validation passes ✅." },
        { node: "redis", paths: ["redis-hostcfgd"], text: "CONFIG_DB write: HSET NTP_SERVER|10.1.1.1 NULL NULL. Redis keyspace event: __keyspace@4__:NTP_SERVER|10.1.1.1 hset. config save → config_db.json updated." },
        { node: "hostcfgd", paths: ["hostcfgd-jinja"], text: "hostcfgd subscribed to NTP_SERVER. SubscriberStateTable fires NtpCfg.ntp_server_update(key='10.1.1.1', op='SET'). Handler runs sonic-cfggen -d -t chrony.conf.j2." },
        { node: "jinja", paths: ["jinja-chronyd"], text: "Template {% for server in NTP_SERVER %} iterates: 10.1.1.1. Renders 'server 10.1.1.1 iburst'. Atomic write to /etc/chrony/chrony.conf." },
        { node: "chronyd", paths: [], text: "systemctl restart chrony. chronyd reads /etc/chrony/chrony.conf, starts syncing with 10.1.1.1. 'chronyc sources' shows reach=377 🎯. NTP configured end-to-end!" },
      ],
    },
    {
      id: "invalid",
      name: "❌ Invalid address 999.1.1.1",
      command: "config ntp add 999.1.1.1 → CVL rejects → NOTHING downstream happens",
      steps: [
        { node: "client", paths: ["client-rest"], text: "User attempts 'config ntp add 999.1.1.1' → KLISH sends REST PATCH with address=999.1.1.1." },
        { node: "rest", paths: ["rest-translib"], text: "REST server unmarshals payload. ygot might accept it (Go string type), passes to translib." },
        { node: "translib", paths: ["translib-cvl"], text: "Transformer maps to NTP_SERVER|999.1.1.1. Sends to CVL for validation BEFORE writing to CONFIG_DB." },
        { node: "cvl", paths: ["cvl-client"], text: "CVL checks sonic-ntp.yang type inet:ip-address pattern. 999 is invalid octet (>255). CVLErrorInfo: SYNTAX_ERROR, field: address. HTTP 400 Bad Request returned 🚫." },
        { node: "redis", paths: [], text: "CONFIG_DB NEVER touched — CVL validation is a pre-flight gate. Redis has NO entry for 999.1.1.1." },
        { node: "hostcfgd", paths: [], text: "No keyspace event fired (nothing written to Redis). hostcfgd never invoked." },
        { node: "jinja", paths: [], text: "Template NEVER rendered — hostcfgd handler didn't run. /etc/chrony/chrony.conf unchanged." },
        { node: "chronyd", paths: [], text: "chronyd oblivious — no restart, no config change. System remains in previous valid state. CVL protected the dataplane 🛡️." },
      ],
    },
    {
      id: "delete",
      name: "🗑️ Delete the server",
      command: "config ntp del 10.1.1.1 → same path, OP_DELETE, key removed, template re-rendered",
      steps: [
        { node: "client", paths: ["client-rest"], text: "User runs 'config ntp del 10.1.1.1' → REST DELETE /openconfig-system:system/ntp/servers/server=10.1.1.1." },
        { node: "rest", paths: ["rest-translib"], text: "REST server parses DELETE operation, calls translib.Delete(path)." },
        { node: "translib", paths: ["translib-cvl"], text: "Transformer maps to NTP_SERVER|10.1.1.1. OP_DELETE operation. (CVL validation is lighter for deletes — key must exist)." },
        { node: "cvl", paths: ["cvl-redis"], text: "CVL validates OP_DELETE: checks no dependencies (e.g., no other config referencing this NTP server). Validation passes." },
        { node: "redis", paths: ["redis-hostcfgd"], text: "CONFIG_DB: DEL NTP_SERVER|10.1.1.1. Keyspace event: __keyspace@4__:NTP_SERVER|10.1.1.1 del. config save updates config_db.json (key removed)." },
        { node: "hostcfgd", paths: ["hostcfgd-jinja"], text: "NtpCfg.ntp_server_update(key='10.1.1.1', op='DEL'). Handler re-renders template (NTP_SERVER now has one fewer key)." },
        { node: "jinja", paths: ["jinja-chronyd"], text: "Template loop iterates remaining NTP_SERVER keys (10.1.1.1 is GONE). Rendered file has NO line for 10.1.1.1. Atomic write." },
        { node: "chronyd", paths: [], text: "systemctl restart chrony. chronyd reads updated config, stops querying 10.1.1.1. 'chronyc sources' shows it removed ✅." },
      ],
    },
  ],
};

const NAV = [
  { id: "overview", label: "The 9-Hop Journey — Overview" },
  { id: "request", label: "Hop 1: The Request (REST / gNMI / KLISH) ⭐" },
  { id: "yang", label: "Hop 2: YANG Model Layer" },
  { id: "rest-server", label: "Hop 3: REST Server (mgmt-framework)" },
  { id: "translib", label: "Hop 4: Translib + Transformer ⭐" },
  { id: "cvl", label: "Hop 5: CVL Validation ⭐" },
  { id: "config-db", label: "Hop 6: CONFIG_DB Write (Redis)" },
  { id: "hostcfgd", label: "Hop 7: hostcfgd Event Handler" },
  { id: "jinja-render", label: "Hop 8: Jinja2 Template Render" },
  { id: "chronyd", label: "Hop 9: chronyd Consumes Config" },
  { id: "verification", label: "Verification & Debugging at Every Hop ⭐" },
  { id: "lab", label: "Lab: Full Add→Verify→Delete Cycle" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function NtpFlowPage() {
  return (
    <TopicShell
      icon="⏰"
      title="NTP — One Feature, Every Layer, End to End"
      gradientWord="NTP"
      subtitle="This is the most detailed walkthrough in the course. You&apos;ll follow a SINGLE config command — 'config ntp add 10.1.1.1' — through all 9 hops: REST→Translib→CVL→Redis→hostcfgd→Jinja2→chronyd. You&apos;ll see the exact artifact at each hop (YANG snippet, Go struct, Redis key, template output, daemon log), the failure mode when CVL rejects 999.1.1.1, and the delete flow. After this page, you&apos;ll understand every layer of the SONiC management framework by heart."
      nav={NAV}
      badges={["9 hops traced", "3 scenarios", "Every artifact shown", "Full debug map"]}
      next={{ icon: "🏗️", label: "Build a New Feature", href: "/sonic/new-feature" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="overview" number="01" title="The 9-Hop Journey — Overview">
        <P>
          When you run <IC>config ntp add 10.1.1.1</IC>, here&apos;s what happens under the hood:
        </P>
        <CodeBlock
          title="9_hop_summary.txt"
          runnable={false}
          code={`1. REQUEST       KLISH / REST / gNMI all converge to REST PATCH
2. YANG          openconfig-system.yang /system/ntp/servers/server
3. REST server   ygot unmarshal into Go ocbinds struct
4. Translib      common_app + transformer annotation → SONiC table
                 ntp_server_key_xfmr maps OC key to Redis key
5. CVL           ValidateEditConfig checks sonic-ntp.yang type/pattern
                 → 999.1.1.1 FAILS here (400), 10.1.1.1 passes
6. CONFIG_DB     HSET NTP_SERVER|10.1.1.1 NULL NULL
                 → keyspace event __keyspace@4__:NTP_SERVER|...
7. hostcfgd      SubscriberStateTable fires NtpCfg.ntp_server_update
8. Jinja2        sonic-cfggen renders chrony.conf.j2 → /etc/chrony/chrony.conf
9. chronyd       systemctl restart, daemon reads config, syncs

total latency: ~200-500ms (REST to NTP sync start)`}
        />
        <Callout type="tip">
          This is THE reference flow for understanding SONiC&apos;s management stack. Every other feature (SYSLOG, ACL,
          VLAN, BGP) follows the same 9 hops with different table names and daemons. Master NTP, master them all.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="request" number="02" title="Hop 1: The Request (REST / gNMI / KLISH) ⭐">
        <P>
          Three management interfaces, one destination:
        </P>
        <CodeBlock
          title="three_ways_to_add_ntp.sh"
          code={`# METHOD 1: KLISH CLI (SSH to switch, type commands)
sonic# configure terminal
sonic(config)# ntp server 10.1.1.1
sonic(config)# exit

# METHOD 2: REST API (mgmt-framework)
curl -k -X PATCH \\
  "https://sonic-switch/restconf/data/openconfig-system:system/ntp/servers/server=10.1.1.1/config" \\
  -u admin:YourPaSsWoRd \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{
    "openconfig-system:config": {
      "address": "10.1.1.1"
    }
  }'

# METHOD 3: gNMI (gnmic CLI or Python client)
gnmic -a sonic-switch:8080 --insecure -u admin -p YourPaSsWoRd \\
  set \\
  --update-path "/openconfig-system:system/ntp/servers/server[address=10.1.1.1]/config/address" \\
  --update-value "10.1.1.1"`}
          output={`# KLISH: (no output, just prompt returns)

# REST: HTTP 204 No Content (success)

# gNMI:
{
  "timestamp": 1735000000,
  "prefix": "",
  "update": [...]
}`}
        />
        <Callout type="behind">
          KLISH internally calls the same REST API (actioner scripts invoke curl). gNMI server translates Set to REST.
          All three converge at the REST endpoint — the &quot;front door&quot; is unified.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="yang" number="03" title="Hop 2: YANG Model Layer">
        <P>
          The REST path <IC>/openconfig-system:system/ntp/servers/server=10.1.1.1/config</IC> is defined by OpenConfig YANG:
        </P>
        <CodeBlock
          title="openconfig-system.yang (NTP subtree excerpt)"
          runnable={false}
          code={`module openconfig-system {
  // ...
  container system {
    container ntp {
      description "NTP configuration and state";

      container servers {
        list server {
          key "address";
          leaf address {
            type leafref { path "../config/address"; }
          }
          container config {
            leaf address {
              type oc-inet:ip-address;
              description "IP address or hostname of NTP server";
            }
          }
          container state {
            config false;
            // ... read-only leaves
          }
        }
      }
    }
  }
}`}
        />
        <P>
          SONiC also has its <strong>native YANG model</strong> (used by CVL for validation):
        </P>
        <CodeBlock
          title="sonic-ntp.yang (simplified)"
          runnable={false}
          code={`module sonic-ntp {
  container sonic-ntp {
    container NTP_SERVER {
      list NTP_SERVER_LIST {
        key "server_address";
        leaf server_address {
          type inet:ip-address;
          description "NTP server IP address";
        }
      }
    }
  }
}`}
        />
        <Callout type="note">
          <strong>OpenConfig YANG</strong> is the northbound API (REST/gNMI paths). <strong>SONiC YANG</strong> is the
          southbound schema (CONFIG_DB validation). The transformer bridges them.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="rest-server" number="04" title="Hop 3: REST Server (mgmt-framework)">
        <P>
          The REST server in <IC>sonic-mgmt-framework</IC> (Go code) handles the PATCH:
        </P>
        <CodeBlock
          title="rest_server_flow.go (pseudocode)"
          runnable={false}
          code={`// mgmt-framework/rest/server/server.go

func HandlePatch(req *http.Request) {
  path := req.URL.Path
  // "/restconf/data/openconfig-system:system/ntp/servers/server=10.1.1.1/config"

  // ygot (YANG Go bindings) unmarshals JSON into Go struct
  var payload ocbinds.OpenconfigSystem_System_Ntp_Servers_Server_Config
  json.Unmarshal(req.Body, &payload)
  // payload.Address = "10.1.1.1"

  // call translib
  resp := translib.Update(translib.SetRequest{
    Path:    path,
    Payload: payload,
  })

  if resp.ErrSrc == translib.CVLErrorSrc {
    return http.StatusBadRequest  // 400
  }
  return http.StatusNoContent  // 204
}`}
        />
        <P>
          The <IC>ocbinds</IC> struct is auto-generated from openconfig-system.yang by ygot:
        </P>
        <CodeBlock
          title="ocbinds_struct.go (generated code excerpt)"
          runnable={false}
          code={`type OpenconfigSystem_System_Ntp_Servers_Server_Config struct {
  Address *string \`path:"address"\`
  // SONiC doesn't implement these OC leaves:
  // Port, Version, Prefer, etc. (ignored by transformer)
}`}
        />
      </Section>

      {/* 05 */}
      <Section id="translib" number="05" title="Hop 4: Translib + Transformer ⭐">
        <P>
          Translib routes the request to <IC>common_app</IC> (the default handler for annotated OpenConfig paths).
          The <strong>annotation file</strong> tells it how to map OC to SONiC:
        </P>
        <CodeBlock
          title="openconfig-system-annot.yang (NTP excerpt)"
          runnable={false}
          code={`module openconfig-system-annot {
  import openconfig-system { prefix oc-sys; }
  import sonic-extensions { prefix sonic-ext; }

  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server {
    deviate add {
      sonic-ext:table-name "NTP_SERVER";
      sonic-ext:key-transformer "ntp_server_key_xfmr";
    }
  }
  deviation /oc-sys:system/oc-sys:ntp/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:address {
    deviate add {
      sonic-ext:field-name "NULL";  // keyonly table, no field
    }
  }
}`}
        />
        <P>
          The <strong>key transformer</strong> in Go (translib/transformer/xfmr_system.go):
        </P>
        <CodeBlock
          title="xfmr_system.go (ntp_server_key_xfmr)"
          runnable={false}
          code={`func init() {
  XlateFuncBind("ntp_server_key_xfmr", ntp_server_key_xfmr)
}

var ntp_server_key_xfmr KeyXfmrYangToDb = func(args XfmrParams) (string, error) {
  // extract address from OC key
  // path: /openconfig-system:system/ntp/servers/server[address=10.1.1.1]
  // ygotTarget is the Server struct
  server := args.ygotTarget.(*ocbinds.OpenconfigSystem_System_Ntp_Servers_Server)
  address := *server.Config.Address
  // validate IP format (redundant with CVL, but good hygiene)
  if net.ParseIP(address) == nil {
    return "", fmt.Errorf("invalid IP address: %s", address)
  }
  return address, nil  // Redis key = "10.1.1.1"
}

// reverse transformer (DbToYang) for GET:
var ntp_server_key_xfmr_reverse KeyXfmrDbToYang = func(args XfmrParams) (map[string]interface{}, error) {
  // args.key = "10.1.1.1" from Redis
  return map[string]interface{}{"address": args.key}, nil
}`}
        />
        <P>
          The result: <strong>dbmap</strong> (internal data structure sent to CVL and CONFIG_DB):
        </P>
        <CodeBlock
          title="dbmap_output.json"
          runnable={false}
          code={`{
  "NTP_SERVER": {
    "10.1.1.1": {
      "NULL": "NULL"
    }
  }
}`}
        />
        <Callout type="behind">
          Why <IC>{`{"NULL":"NULL"}`}</IC>? NTP_SERVER is a <em>keyonly table</em> — the key (server IP) IS the data.
          SONiC legacy uses a NULL hash field to satisfy Redis HSET (which requires at least one field-value pair).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="cvl" number="06" title="Hop 5: CVL Validation ⭐">
        <P>
          CVL (Config Validation Library) validates the dbmap against <IC>sonic-ntp.yang</IC> <strong>before</strong> writing to CONFIG_DB:
        </P>
        <CodeBlock
          title="cvl_validation.go (pseudocode)"
          runnable={false}
          code={`import "github.com/Azure/sonic-mgmt-common/cvl"

func validateAndWrite(dbmap map[string]interface{}) error {
  cv := cvl.ValidationSessOpen()
  defer cv.ValidationSessClose()

  cvlEditCfg := cvl.CVLEditConfigData{
    VType: cvl.VALIDATE_ALL,
    VOp:   cvl.OP_CREATE,
    Key:   "NTP_SERVER|10.1.1.1",
    Data:  map[string]string{"NULL": "NULL"},
  }

  ret := cv.ValidateEditConfig([]cvl.CVLEditConfigData{cvlEditCfg})
  if ret != cvl.CVL_SUCCESS {
    // example failure for 999.1.1.1:
    // CVLErrorInfo{
    //   ErrCode: CVL_SYNTAX_INVALID_VALUE,
    //   TableName: "NTP_SERVER",
    //   Keys: "999.1.1.1",
    //   Field: "server_address",
    //   Msg: "Value does not match pattern (inet:ip-address)"
    // }
    return errors.New("CVL validation failed")
  }
  // validation passed → proceed to Redis write
  return nil
}`}
        />
        <P>
          What happens when you try <IC>config ntp add 999.1.1.1</IC>:
        </P>
        <CodeBlock
          title="cvl_failure_999.1.1.1.txt"
          runnable={false}
          code={`CVL checks sonic-ntp.yang:
  leaf server_address {
    type inet:ip-address;  // pattern: valid IPv4 or IPv6
  }

999.1.1.1 has octet 999 > 255 → INVALID
→ CVLErrorInfo returned to translib
→ translib returns ErrSrc=CVLErrorSrc to REST server
→ REST server returns HTTP 400 Bad Request:
{
  "ietf-restconf:errors": {
    "error": [{
      "error-type": "application",
      "error-tag": "invalid-value",
      "error-message": "Invalid value for address: 999.1.1.1 does not match type inet:ip-address"
    }]
  }
}

CONFIG_DB is NEVER touched — CVL is the pre-flight gate 🛡️`}
        />
        <Callout type="tip">
          CVL is your friend in interviews: &quot;How does SONiC prevent invalid config from reaching the dataplane?&quot;
          Answer: CVL validates all writes against SONiC YANG before touching Redis. Invalid data never enters CONFIG_DB.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="config-db" number="07" title="Hop 6: CONFIG_DB Write (Redis)">
        <P>
          CVL passed → translib writes to Redis DB 4 (CONFIG_DB):
        </P>
        <CodeBlock
          title="redis_write.sh"
          code={`# monitor Redis keyspace events in real-time:
redis-cli -n 4 --csv psubscribe '__key*__:*'

# (in another terminal, run: config ntp add 10.1.1.1)

# the HSET command:
redis-cli -n 4 HSET "NTP_SERVER|10.1.1.1" "NULL" "NULL"

# verify:
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"

# check all NTP servers:
redis-cli -n 4 KEYS "NTP_SERVER|*"

# config save persists to /etc/sonic/config_db.json:
config save -y
cat /etc/sonic/config_db.json | jq .NTP_SERVER`}
          output={`# psubscribe output (keyspace event):
"pmessage","__key*__:*","__keyspace@4__:NTP_SERVER|10.1.1.1","hset"

# HGETALL output:
1) "NULL"
2) "NULL"

# KEYS output:
1) "NTP_SERVER|10.1.1.1"

# config_db.json:
{
  "NTP_SERVER": {
    "10.1.1.1": {}
  }
}`}
        />
        <Callout type="behind">
          The keyspace event <IC>__keyspace@4__:NTP_SERVER|10.1.1.1 hset</IC> is what wakes up hostcfgd. Redis pub/sub
          (via swsssdk SubscriberStateTable) delivers this event to all subscribers instantly.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="hostcfgd" number="08" title="Hop 7: hostcfgd Event Handler">
        <P>
          <IC>hostcfgd</IC> (Python daemon in sonic-host-services) subscribes to NTP_SERVER:
        </P>
        <CodeBlock
          title="hostcfgd_ntp.py (simplified from sonic-host-services/scripts/hostcfgd)"
          runnable={false}
          code={`from swsscommon import SubscriberStateTable, Select

class NtpCfg:
    def __init__(self):
        self.ntp_server_table = SubscriberStateTable(
            swsscommon.ConfigDBConnector(),
            swsscommon.CFG_DB,
            "NTP_SERVER"
        )

    def ntp_server_update(self, key, op):
        # op = "SET" or "DEL"
        # key = "10.1.1.1"
        syslog.syslog(syslog.LOG_INFO, f"NTP_SERVER {op}: {key}")

        # render chrony.conf.j2
        os.system("sonic-cfggen -d -t /usr/share/sonic/templates/chrony/chrony.conf.j2 > /tmp/chrony.conf.new")
        os.rename("/tmp/chrony.conf.new", "/etc/chrony/chrony.conf")  # atomic

        # restart chrony
        os.system("systemctl restart chrony")
        syslog.syslog(syslog.LOG_INFO, "chronyd restarted")

# main loop:
ntpcfg = NtpCfg()
sel = Select()
sel.addSelectable(ntpcfg.ntp_server_table)

while True:
    state, _ = sel.select(1000)  # 1s timeout
    if state == Select.OBJECT:
        key, op, fvs = ntpcfg.ntp_server_table.pop()
        ntpcfg.ntp_server_update(key, op)`}
        />
        <P>
          Check hostcfgd logs to confirm it ran:
        </P>
        <CodeBlock
          title="hostcfgd_logs.sh"
          code={`journalctl -u hostcfgd -n 20 --no-pager`}
          output={`Jun 12 14:32:15 sonic INFO hostcfgd: NTP_SERVER SET: 10.1.1.1
Jun 12 14:32:15 sonic INFO hostcfgd: chronyd restarted`}
        />
      </Section>

      {/* 09 */}
      <Section id="jinja-render" number="09" title="Hop 8: Jinja2 Template Render">
        <P>
          <IC>sonic-cfggen</IC> renders <IC>chrony.conf.j2</IC>:
        </P>
        <CodeBlock
          title="chrony.conf.j2 (from /usr/share/sonic/templates/chrony/)"
          runnable={false}
          code={`{% if NTP_SERVER %}
{% for server in NTP_SERVER %}
server {{ server }} iburst
{% endfor %}
{% else %}
pool 2.debian.pool.ntp.org iburst
{% endif %}

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <P>
          Before adding 10.1.1.1 (no NTP_SERVER keys in CONFIG_DB):
        </P>
        <CodeBlock
          title="/etc/chrony/chrony.conf (BEFORE)"
          runnable={false}
          code={`pool 2.debian.pool.ntp.org iburst

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <P>
          After adding 10.1.1.1 (NTP_SERVER has key "10.1.1.1"):
        </P>
        <CodeBlock
          title="/etc/chrony/chrony.conf (AFTER)"
          runnable={false}
          code={`server 10.1.1.1 iburst

driftfile /var/lib/chrony/drift
logdir /var/log/chrony
maxupdateskew 100.0
rtcsync
makestep 1 3`}
        />
        <Callout type="note">
          The atomic write (render to /tmp, then mv to /etc) ensures chronyd never reads a half-written config.
          If sonic-cfggen crashes mid-render (e.g., UndefinedError), the old config remains untouched.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="chronyd" number="10" title="Hop 9: chronyd Consumes Config">
        <P>
          <IC>systemctl restart chrony</IC> sends SIGTERM to chronyd, then starts a new process:
        </P>
        <CodeBlock
          title="chronyd_verify.sh"
          code={`# check chronyd status
systemctl status chrony

# query NTP sources (chronyc is the chrony CLI)
chronyc sources -v

# check sync status
chronyc tracking`}
          output={`# systemctl status (excerpt):
● chrony.service - chrony, an NTP client/server
   Loaded: loaded (/lib/systemd/system/chrony.service; enabled)
   Active: active (running) since Thu 2026-06-12 14:32:16 UTC; 5s ago

# chronyc sources:
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^* 10.1.1.1                      2   6   377     3   +123us[ +145us] +/-   2ms

(* = currently selected source, 377 octal = all 8 polls successful)

# chronyc tracking:
Reference ID    : 0A010101 (10.1.1.1)
Stratum         : 3
Leap status     : Normal
System time     : 0.000145 seconds fast of NTP time`}
        />
        <P>
          Also check via SONiC CLI:
        </P>
        <CodeBlock
          title="sonic_ntp_cli.sh"
          code={`show ntp`}
          output={`NTP Servers
-------------
10.1.1.1`}
        />
        <Callout type="tip">
          Reach=377 (octal) means the last 8 NTP polls succeeded (binary 11111111). This is your green light that
          the config propagated correctly all the way to chronyd&apos;s network queries.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="verification" number="11" title="Verification & Debugging at Every Hop ⭐">
        <P>
          Here&apos;s the hop-by-hop verification and failure triage table:
        </P>
        <Table
          head={["Hop / Layer", "Verification Command", "Healthy Output", "If Broken"]}
          rows={[
            [
              "1. Request",
              "curl (check HTTP status)",
              "204 No Content",
              "4xx/5xx → check auth, path syntax, payload JSON",
            ],
            [
              "2. YANG",
              "REST GET same path",
              "Returns current value",
              "404 → YANG model not loaded or path typo",
            ],
            [
              "3. REST server",
              "journalctl -u rest-server",
              "No errors",
              "Crash logs → ygot unmarshal failure (malformed JSON)",
            ],
            [
              "4. Translib/Xfmr",
              "Check mgmt-framework logs",
              "Key=10.1.1.1 in trace",
              "500 error → xfmr panic, annotation missing (no table-name)",
            ],
            [
              "5. CVL",
              "(automatic on write)",
              "CVL_SUCCESS",
              "400 + CVLErrorInfo → invalid value, check sonic YANG constraints",
            ],
            [
              "6. CONFIG_DB",
              "redis-cli -n 4 HGETALL NTP_SERVER|10.1.1.1",
              '1) "NULL" 2) "NULL"',
              "Key missing → CVL rejected OR translib didn't write (check logs)",
            ],
            [
              "7. hostcfgd",
              "journalctl -u hostcfgd",
              '"NTP_SERVER SET: 10.1.1.1"',
              "No log → hostcfgd not subscribed OR crashed (check hostcfgd status)",
            ],
            [
              "8. Jinja render",
              "cat /etc/chrony/chrony.conf",
              "server 10.1.1.1 iburst",
              "Missing line → UndefinedError in syslog, check template syntax",
            ],
            [
              "9. chronyd",
              "chronyc sources",
              "Reach=377 for 10.1.1.1",
              "Reach=0 → network unreachable, ACL blocking UDP 123, or wrong IP",
            ],
          ]}
        />
        <P>
          Failure triage ASCII flowchart:
        </P>
        <CodeBlock
          title="triage_flowchart.txt"
          runnable={false}
          code={`config ntp add X.X.X.X → command succeeds but chronyd unchanged

Q1: Is X.X.X.X in CONFIG_DB?
    redis-cli -n 4 KEYS "NTP_SERVER|X.X.X.X"
    → NO: CVL rejected (400 error should have been shown) OR translib bug
          check: REST response status, mgmt-framework logs
    → YES: go to Q2

Q2: Is /etc/chrony/chrony.conf updated?
    grep X.X.X.X /etc/chrony/chrony.conf
    → NO: hostcfgd didn't re-render
          check: journalctl -u hostcfgd | grep "NTP_SERVER"
                 (if no log → hostcfgd subscribe bug)
                 (if log + error → sonic-cfggen crash, UndefinedError)
    → YES: go to Q3

Q3: Does chronyd see it?
    chronyc sources | grep X.X.X.X
    → NO: chronyd didn't reload config
          check: systemctl status chrony (running?)
                 journalctl -u chrony (syntax error in config?)
    → YES but Reach=0: network issue (ACL, firewall, server down)
                       check: ping X.X.X.X, tcpdump port 123`}
        />
      </Section>

      {/* 12 */}
      <Section id="lab" number="12" title="Lab: Full Add→Verify→Delete Cycle">
        <P>
          Run this on a SONiC switch (or VM) to trace the entire flow:
        </P>
        <CodeBlock
          title="lab_full_cycle.sh"
          code={`# BASELINE: check current NTP state
show ntp
redis-cli -n 4 KEYS "NTP_SERVER|*"
cat /etc/chrony/chrony.conf

# ADD: new NTP server
config ntp add 10.1.1.1

# VERIFY HOP 6: CONFIG_DB
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"

# VERIFY HOP 7: hostcfgd log
journalctl -u hostcfgd -n 5 --no-pager | grep NTP

# VERIFY HOP 8: rendered config file
grep "10.1.1.1" /etc/chrony/chrony.conf

# VERIFY HOP 9: chronyd
sleep 5  # give chronyd time to poll
chronyc sources -v | grep "10.1.1.1"

# VERIFY CLI: SONiC state
show ntp

# DELETE: remove the server
config ntp del 10.1.1.1

# VERIFY REMOVAL: all hops in reverse
redis-cli -n 4 HGETALL "NTP_SERVER|10.1.1.1"  # should be empty
grep "10.1.1.1" /etc/chrony/chrony.conf       # should have no match
chronyc sources | grep "10.1.1.1"             # should be gone`}
          output={`# Baseline:
NTP Servers
-------------
(empty or existing servers)

# After ADD:
1) "NULL"
2) "NULL"

Jun 12 14:32:15 sonic INFO hostcfgd: NTP_SERVER SET: 10.1.1.1

server 10.1.1.1 iburst

^* 10.1.1.1                      2   6   377     3   +123us[ +145us] +/-   2ms

NTP Servers
-------------
10.1.1.1

# After DELETE:
(empty)
(no match)
(no match)`}
        />
        <Callout type="note">
          Expected: after ADD, all 9 hops show the server; after DELETE, all 9 hops show it removed. Latency: ~500ms
          from config command to chronyc sources showing reach. This proves end-to-end config propagation.
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "Walk me through what happens when you run 'config ntp add 10.1.1.1' — every step.",
              "1) KLISH calls REST PATCH /openconfig-system:system/ntp/servers/server=10.1.1.1/config. 2) REST server ygot-unmarshals to Go struct. 3) Translib common_app + transformer annotation maps to NTP_SERVER table, key xfmr extracts 10.1.1.1. 4) CVL validates against sonic-ntp.yang inet:ip-address type. 5) CONFIG_DB: HSET NTP_SERVER|10.1.1.1 NULL NULL, keyspace event fires. 6) hostcfgd SubscriberStateTable receives event, NtpCfg handler runs. 7) sonic-cfggen renders chrony.conf.j2 → /etc/chrony/chrony.conf atomic write. 8) systemctl restart chrony. 9) chronyd reads config, syncs to 10.1.1.1. Total: ~300ms.",
            ],
            [
              "What prevents invalid IP 999.1.1.1 from reaching chronyd?",
              "CVL validates the dbmap against sonic-ntp.yang BEFORE writing to CONFIG_DB. The leaf server_address has type inet:ip-address with pattern constraints. 999.1.1.1 fails the pattern (octet >255). CVL returns CVL_SYNTAX_INVALID_VALUE → translib returns 400 to REST → user sees error. CONFIG_DB never touched, chronyd never restarted. CVL is the pre-flight gate.",
            ],
            [
              "How does the transformer know to map /openconfig-system:system/ntp to NTP_SERVER?",
              "The annotation file openconfig-system-annot.yang has a deviation on /system/ntp/servers/server with sonic-ext:table-name 'NTP_SERVER' and sonic-ext:key-transformer 'ntp_server_key_xfmr'. Translib reads annotations at startup, binds the key xfmr callback. When common_app processes the path, it invokes the xfmr to convert OC key (address=10.1.1.1) to Redis key (10.1.1.1).",
            ],
            [
              "Why is the NTP_SERVER value {\"NULL\":\"NULL\"}?",
              "NTP_SERVER is a keyonly table — the IP address IS the config (no additional fields like port or version in SONiC NTP). Redis HSET requires at least one field-value pair, so SONiC uses NULL as a placeholder. The template {% for server in NTP_SERVER %} iterates keys only (ignores values).",
            ],
            [
              "What is hostcfgd and what triggers it?",
              "hostcfgd is a Python daemon (sonic-host-services) that subscribes to CONFIG_DB tables via swsscommon SubscriberStateTable. When a CONFIG_DB key changes (keyspace event __keyspace@4__:TABLE|key), the subscriber fires a callback. For NTP_SERVER, NtpCfg.ntp_server_update re-renders chrony.conf.j2 and restarts chrony. It's the auto-render + auto-restart daemon.",
            ],
            [
              "Config is in CONFIG_DB but /etc/chrony/chrony.conf is unchanged — debug steps?",
              "1) Check hostcfgd logs: journalctl -u hostcfgd | grep NTP. If no log → hostcfgd didn't subscribe or crashed. 2) If log exists but file unchanged → sonic-cfggen crashed. Check for UndefinedError in syslog (template refs missing key). 3) Manual test: sonic-cfggen -d -t chrony.conf.j2 → does it render or crash? 4) Check file mtime: ls -l /etc/chrony/chrony.conf (old mtime = no write). 5) If file IS new but chronyd unchanged → systemctl status chrony (daemon crash? syntax error?).",
            ],
            [
              "How do REST, gNMI, and KLISH all converge?",
              "KLISH actioner scripts internally call curl to the REST API. gNMI server (in mgmt-framework) translates gNMI Set RPCs to REST PATCH requests. All three hit the same Go REST server endpoint → ygot unmarshal → translib. REST is the unified front door; KLISH and gNMI are facades.",
            ],
            [
              "What is the difference between OpenConfig YANG and SONiC YANG?",
              "OpenConfig YANG defines the northbound API (REST/gNMI paths, e.g., /openconfig-system:system/ntp). SONiC YANG defines the southbound schema (CONFIG_DB table structure, e.g., NTP_SERVER with server_address leaf). CVL validates against SONiC YANG. Transformer annotations bridge OpenConfig paths to SONiC tables. OpenConfig is vendor-neutral, SONiC is implementation-specific.",
            ],
            [
              "What is CVL and when does it run?",
              "CVL (Config Validation Library) is a libyang-based validator that checks CONFIG_DB writes against SONiC YANG schemas. It runs in translib BEFORE the Redis write (ValidateEditConfig call). It checks syntax (types, patterns), semantics (must statements), and dependencies (leafrefs). Only valid data reaches CONFIG_DB — CVL is the pre-commit gate.",
            ],
            [
              "Explain the delete flow for NTP.",
              "'config ntp del 10.1.1.1' → REST DELETE → translib OP_DELETE → CVL validates no dependencies → CONFIG_DB: DEL NTP_SERVER|10.1.1.1 → keyspace event del → hostcfgd NtpCfg handler fires → re-render chrony.conf.j2 (loop now skips 10.1.1.1) → systemctl restart chrony → chronyc sources shows it removed. Same 9 hops, OP_DELETE instead of OP_CREATE.",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["9 hops", "REST → ygot → Translib → CVL → Redis → hostcfgd → Jinja2 → daemon → verify"],
            ["OpenConfig YANG", "Northbound API (REST/gNMI paths) — vendor-neutral"],
            ["SONiC YANG", "Southbound schema (CONFIG_DB tables + CVL validation) — SONiC-specific"],
            ["Transformer role", "Bridges OC YANG ↔ SONiC YANG via annotations + key/field xfmrs"],
            ["CVL validates", "BEFORE CONFIG_DB write — syntax, types, must, leafref — rejects 999.1.1.1"],
            ["Keyspace event", "__keyspace@4__:TABLE|key hset → wakes up SubscriberStateTable subscribers"],
            ["hostcfgd", "Python daemon, subscribes CONFIG_DB tables, triggers template render + service restart"],
            ["NTP_SERVER shape", "{\"10.1.1.1\": {\"NULL\":\"NULL\"}} — keyonly table, template loops keys"],
            ["chrony.conf.j2 loop", "{% for server in NTP_SERVER %} server {{ server }} iburst {% endfor %}"],
            ["Verify hop 6", "redis-cli -n 4 HGETALL NTP_SERVER|10.1.1.1 → NULL NULL"],
            ["Verify hop 9", "chronyc sources → Reach=377 for 10.1.1.1 (8/8 polls success)"],
            ["Debug flowchart", "In Redis? → File updated? → Daemon reloaded? → Network reachable? (Q1→Q2→Q3)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
