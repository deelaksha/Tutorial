"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The triage ladder: where did the request die?",
  nodes: [
    { id: "client", icon: "🌐", label: "Client 4xx/5xx?", sub: "curl -v → status code", x: 6, y: 50, color: "#22d3ee" },
    { id: "rest", icon: "🚪", label: "REST logs", sub: "/var/log/syslog", x: 22, y: 22, color: "#fb923c" },
    { id: "translib", icon: "📚", label: "Translib trace", sub: "glog -v=5", x: 38, y: 50, color: "#a78bfa" },
    { id: "cvl", icon: "🛡️", label: "CVL error?", sub: "CVLErrorInfo", x: 54, y: 22, color: "#fbbf24" },
    { id: "redis", icon: "🗄️", label: "Redis MONITOR", sub: "db 4 writes", x: 62, y: 65, color: "#34d399" },
    { id: "host", icon: "🐍", label: "hostcfgd journal", sub: "journalctl -u hostcfgd", x: 78, y: 30, color: "#60a5fa" },
    { id: "file", icon: "📝", label: "/etc file + daemon", sub: "final state", x: 90, y: 65, color: "#f472b6" },
  ],
  edges: [
    { id: "client-rest", from: "client", to: "rest", color: "#fb923c" },
    { id: "rest-translib", from: "rest", to: "translib", color: "#a78bfa" },
    { id: "translib-cvl", from: "translib", to: "cvl", color: "#fbbf24" },
    { id: "translib-redis", from: "translib", to: "redis", color: "#34d399" },
    { id: "redis-host", from: "redis", to: "host", color: "#60a5fa" },
    { id: "host-file", from: "host", to: "file", color: "#f472b6" },
    { id: "cvl-rest", from: "cvl", to: "rest", bend: -25, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "healthy",
      name: "✅ Healthy trace",
      command: "PATCH interface mtu=9100 — follow the evidence",
      steps: [
        { node: "client", paths: ["client-rest"], text: "curl -v → 204 No Content. Good so far. Now verify the change actually applied..." },
        { node: "rest", paths: ["rest-translib"], text: "tail -f /var/log/syslog | grep rest_server → 'PATCH /openconfig-interfaces:... 204 (89ms)'. REST layer OK." },
        { node: "translib", paths: ["translib-cvl", "translib-redis"], text: "glog trace: 'Path=/openconfig-interfaces:interfaces/interface[name=Eth0]/config/mtu' → 'CVL validation: PASS' → evidence at translib." },
        { node: "redis", paths: ["redis-host"], text: "redis-cli -n 4 HGETALL 'INTERFACE|Ethernet0' → shows mtu:9100. Redis write confirmed." },
        { node: "host", paths: ["host-file"], text: "journalctl -u hostcfgd -n 20 → 'Updating interface Ethernet0 mtu=9100'. hostcfgd processed the event." },
        { node: "file", paths: [], text: "ip link show Ethernet0 → mtu 9100. Final state matches request. Full success! 🎯" },
      ],
    },
    {
      id: "cvlfail",
      name: "💥 400 at CVL",
      command: "PATCH with invalid VLAN ID 5000 (max 4094)",
      steps: [
        { node: "client", paths: ["client-rest"], text: "curl -v → 400 Bad Request. Payload rejected. Triage starts: why?" },
        { node: "rest", paths: ["rest-translib"], text: "syslog: 'rest_server: CVL validation failed: range-violation'. REST received error from translib." },
        { node: "translib", paths: ["translib-cvl"], text: "glog -v=5 shows: 'CVL error: vlan_id 5000 out of range 1-4094'. CVL rejected before Redis write." },
        { node: "cvl", paths: ["cvl-rest"], text: "CVL returned CVLErrorInfo: {ErrCode: CVL_SYNTAX_ERROR, Field: 'vlan_id', Msg: 'exceeds max 4094'}. This is the root cause." },
        { node: "redis", paths: [], text: "redis-cli KEYS '*VLAN*' → no new keys. Translib never reached the write phase. Correctly stopped at validation. ✅ (failure, but clean)" },
      ],
    },
    {
      id: "silent",
      name: "🕵️ Silent failure",
      command: "204 OK but daemon didn't apply config",
      steps: [
        { node: "client", paths: ["client-rest"], text: "curl → 204 No Content. Client assumes success. But did it REALLY work?" },
        { node: "rest", paths: ["rest-translib"], text: "syslog: '204 (45ms)'. REST and translib happy. Keep digging..." },
        { node: "redis", paths: ["redis-host"], text: "redis-cli HGETALL 'NTP_SERVER|10.0.0.1' → key exists, data looks correct. Redis has it. So why isn't NTP using it?" },
        { node: "host", paths: [], text: "journalctl -u hostcfgd -f → NO new log lines when we write the key. hostcfgd didn't see the event! 🚨" },
        { node: "host", paths: [], text: "redis-cli CONFIG GET notify-keyspace-events → returns ''. Keyspace notifications DISABLED! hostcfgd can't subscribe. Root cause found." },
        { node: "file", paths: [], text: "Fix: redis-cli CONFIG SET notify-keyspace-events AKE; systemctl restart hostcfgd. Now events fire. NTP config applies. 🛠️" },
      ],
    },
  ],
};

const NAV = [
  { id: "golden-rule", label: "The Golden Rule: Binary Search ⭐" },
  { id: "redis-debug", label: "Redis Debugging Toolkit ⭐" },
  { id: "rest-debug", label: "REST/RESTCONF Layer" },
  { id: "translib-debug", label: "Translib & Transformers" },
  { id: "cvl-debug", label: "CVL Validation Errors" },
  { id: "gnmi-debug", label: "gNMI Telemetry Path" },
  { id: "docker-systemd", label: "Docker & systemd Issues" },
  { id: "logs-map", label: "Logs Map: Where to Look ⭐" },
  { id: "end-to-end", label: "End-to-End Request Trace ⭐" },
  { id: "perf", label: "Memory & Performance" },
  { id: "lab", label: "Lab: 3 Intentional Failures" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DebuggingPage() {
  return (
    <TopicShell
      icon="🐛"
      title="Debugging Masterclass — Trace Any Request"
      gradientWord="Debugging"
      subtitle="Your PATCH returned 500. Or worse: 204 but nothing changed. Where did it break? A systematic playbook: binary-search the pipeline, read the evidence at each layer (REST → translib → CVL → Redis → hostcfgd → Linux), and triangulate the root cause in under 5 minutes."
      nav={NAV}
      badges={["🔍 Layer-by-layer triage", "🚨 Silent failure detection", "📊 Live trace timelines", "💡 Redis monitor tricks"]}
      next={{ icon: "🎤", label: "Interview Preparation", href: "/sonic/interview-prep" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="golden-rule" number="01" title="The Golden Rule: Binary Search the Pipeline ⭐">
        <P>
          A SONiC management request flows through <strong>6 layers</strong>: Client → REST → translib → CVL → Redis → hostcfgd → Linux. When it fails, the symptom appears at layer N, but the <em>cause</em> is at the <strong>last layer with evidence</strong>. Your job: binary-search to find that layer.
        </P>
        <CodeBlock
          title="triage_decision_tree.txt"
          runnable={false}
          code={`SYMPTOM                          FIRST COMMAND TO RUN
═══════════════════════════════════════════════════════════════════════
❌ 4xx/5xx HTTP error            curl -v (read response body JSON)
                                 → if 400: likely CVL or payload format
                                 → if 401: auth (check PAM, password)
                                 → if 404: YANG path wrong or feature not compiled
                                 → if 500: translib panic or Redis down

✅ 204 but config didn't apply   redis-cli -n 4 HGETALL <key>
                                 → if key missing: translib bug (didn't write)
                                 → if key exists: hostcfgd or daemon issue

🐌 Request hangs / timeout       docker ps (is mgmt-framework running?)
                                 redis-cli PING (is Redis up?)
                                 netstat -tlnp | grep 443 (REST port open?)

📉 gNMI path returns empty       redis-cli -n 6 KEYS * (STATE_DB populated?)
                                 gNMI reads state — if daemons didn't write
                                 telemetry, DB is empty (not a gNMI bug)

🔁 Config reverts after reboot   Redis persistence off? (CONFIG GET save)
                                 Check config_db.json written by hostcfgd

General strategy:
  1. Start at the CLIENT (curl -v, read status + body)
  2. Jump to REDIS (is the key there with correct value?)
  3. Binary search between them:
       key exists → problem is AFTER Redis (hostcfgd/daemon)
       key missing → problem is BEFORE Redis (REST/translib/CVL)`}
        />
        <Callout type="tip">
          🎯 <strong>Interview answer template:</strong> &quot;First, I&apos;d check if Redis has the key with <IC>redis-cli HGETALL</IC>. If yes, the write succeeded — problem is in hostcfgd or the application daemon. If no, I&apos;d check REST logs for errors, then enable translib verbose logging with glog -v=5 to see where it stopped. It&apos;s a binary search: find the last layer with evidence.&quot;
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="redis-debug" number="02" title="Redis Debugging Toolkit ⭐">
        <P>
          Redis is the <strong>source of truth</strong>. If the key isn&apos;t in Redis, translib didn&apos;t write it. If it IS in Redis but Linux doesn&apos;t match, hostcfgd or the daemon failed. Master these commands:
        </P>
        <CodeBlock
          title="redis_debug_commands.sh"
          output={`# 1. Live monitoring (see every Redis command in real-time)
admin@sonic:~$ redis-cli -n 4 monitor | grep INTERFACE
OK
1686234567.123456 [4 "HSET" "INTERFACE|Ethernet0" "admin_status" "up"]
1686234567.234567 [4 "HSET" "INTERFACE|Ethernet0" "mtu" "9100"]
# Pro tip: add '| ts' (moreutils package) to add timestamps

# 2. Find all keys matching a pattern
admin@sonic:~$ redis-cli -n 4 KEYS 'VLAN*'
1) "VLAN|Vlan100"
2) "VLAN_MEMBER|Vlan100|Ethernet4"

# 3. Inspect a hash (most CONFIG_DB keys are hashes)
admin@sonic:~$ redis-cli -n 4 HGETALL "INTERFACE|Ethernet0"
1) "admin_status"
2) "up"
3) "mtu"
4) "9100"

# 4. Check if keyspace events are enabled (critical for hostcfgd!)
admin@sonic:~$ redis-cli CONFIG GET notify-keyspace-events
1) "notify-keyspace-events"
2) "AKE"
# "AKE" = All keys, Keyspace events, Expired events (needed)
# If empty: hostcfgd WON'T see changes!

# 5. Subscribe to keyspace events manually (debug what hostcfgd sees)
admin@sonic:~$ redis-cli --csv psubscribe '__key*__:*'
Reading messages... (press Ctrl-C to quit)
"psubscribe","__key*__:*",1
"pmessage","__key*__:*","__keyspace@4__:INTERFACE|Ethernet0","hset"
# Each line = an event hostcfgd receives

# 6. Dump entire DB to JSON (compare before/after)
admin@sonic:~$ redis-dump -d 4 -y > config_before.json
# (make change)
admin@sonic:~$ redis-dump -d 4 -y > config_after.json
admin@sonic:~$ diff config_before.json config_after.json

# 7. Check which DB number you need
CONFIG_DB = 4   (YANG-modeled config, written by translib)
APPL_DB   = 0   (orchagent-consumed, written by *mgrd daemons)
STATE_DB  = 6   (operational state, read by gNMI/REST GET)
ASIC_DB   = 1   (syncd ↔ SAI, low-level)

admin@sonic:~$ redis-cli -n 6 KEYS 'PORT_TABLE*' | head -3
PORT_TABLE:Ethernet0
PORT_TABLE:Ethernet4
PORT_TABLE:Ethernet8`}
          code={`# Essential Redis debugging commands

# 1. Monitor all Redis commands in real-time (filter with grep)
redis-cli -n 4 monitor | grep INTERFACE

# 2. Find keys (supports glob patterns)
redis-cli -n 4 KEYS 'VLAN*'
redis-cli -n 4 --scan --pattern 'ACL*'  # safer for prod (non-blocking)

# 3. Read a hash key (most common)
redis-cli -n 4 HGETALL "INTERFACE|Ethernet0"

# 4. Check keyspace event config (hostcfgd depends on this!)
redis-cli CONFIG GET notify-keyspace-events
# Should return "AKE" (All Keyspace Events)
# If empty, hostcfgd can't subscribe → silent failures!

# 5. Subscribe to events (see what hostcfgd sees)
redis-cli --csv psubscribe '__key*__:*'

# 6. Dump DB to file (before/after comparison)
redis-dump -d 4 -y > snapshot.json

# 7. Common pitfalls:
# - Wrong DB number (CONFIG_DB=4, APPL_DB=0, STATE_DB=6)
# - Key separator confusion: INTERFACE|Ethernet0 not INTERFACE:Ethernet0
# - Case sensitivity: "Vlan100" ≠ "VLAN100"`}
        />
        <Callout type="mistake">
          ⚠️ <strong>The silent killer: keyspace events disabled.</strong> If <IC>CONFIG GET notify-keyspace-events</IC> returns empty string, hostcfgd will never receive CONFIG_DB change notifications. Redis writes succeed, but nothing applies to Linux. Symptoms: 204 OK, redis-cli shows correct data, but <IC>ip link show</IC> unchanged. Fix: <IC>redis-cli CONFIG SET notify-keyspace-events AKE</IC> and restart hostcfgd.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="rest-debug" number="03" title="REST/RESTCONF Layer">
        <CodeBlock
          title="rest_debugging.sh"
          output={`# Verbose curl reveals the full HTTP conversation
admin@sonic:~$ curl -kv -u admin:YourPaSsWoRd -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"mtu": 15000}'

*   Trying 127.0.0.1:443...
* Connected to localhost (127.0.0.1) port 443 (#0)
* TLS handshake...
* Server certificate: CN=sonic
> PATCH /restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config HTTP/1.1
> Authorization: Basic YWRtaW46...
> Content-Type: application/yang-data+json
>
< HTTP/1.1 400 Bad Request
< Content-Type: application/yang-data+json
<
{
  "ietf-restconf:errors": {
    "error": [{
      "error-type": "application",
      "error-tag": "invalid-value",
      "error-message": "range-violation: mtu exceeds platform max 9216"
    }]
  }
}
# Clear diagnosis: CVL range check failed (mtu too high)

# Check REST server logs (aggregated in syslog)
admin@sonic:~$ tail -f /var/log/syslog | grep rest_server
Jun 12 10:15:34.567 sonic rest_server[1234]: PATCH /openconfig-interfaces:... 400 (12ms) CVL_SYNTAX_ERROR
Jun 12 10:16:01.123 sonic rest_server[1234]: GET /restconf/data/sonic-device... 200 (5ms)

# Enable verbose glog in the container (add -v=5 to rest_server args)
admin@sonic:~$ docker exec -it sonic-mgmt-framework bash
root@sonic:/# ps aux | grep rest_server
root  1234  /usr/sbin/rest_server -port=443 -v=2
# To increase verbosity: edit /etc/sonic/mgmt_framework.conf, add -v=5, restart container

# Common HTTP status codes and what they mean:
200 OK              GET succeeded
201 Created         POST created new resource
204 No Content      PATCH/PUT/DELETE succeeded (SONiC standard for updates)
400 Bad Request     CVL validation fail OR malformed JSON
401 Unauthorized    PAM auth failed (wrong password, user not in 'sudo' group)
404 Not Found       YANG path doesn't exist (typo or feature not compiled)
405 Method Not Allowed   tried POST on a read-only YANG node
409 Conflict        resource already exists (POST duplicate)
415 Unsupported Media Type   forgot Content-Type header
500 Internal Server Error   translib panic, Redis connection fail, or unhandled exception`}
          code={`# REST debugging workflow

# STEP 1: Use curl -v (verbose) to see full request + response
curl -kv -u admin:password -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"enabled": true}'

# STEP 2: Read the JSON error body (SONiC returns RESTCONF error format)
# Look for: error-tag (operation-failed, invalid-value, etc.)
#           error-message (human-readable diagnosis)

# STEP 3: Grep REST logs in syslog
tail -f /var/log/syslog | grep rest_server

# STEP 4: If 500 or unclear, enable verbose glog
docker exec sonic-mgmt-framework sed -i 's/-v=2/-v=5/' /etc/supervisord.conf
docker restart sonic-mgmt-framework
# Now logs show every translib call, payload, and DB map

# STEP 5: Common fixes by status code
# 401 → check: id admin (are you in sudo group?), /etc/pam.d/login config
# 404 → verify YANG path: GET /restconf/data/yang-library-version (list available models)
# 500 → docker logs sonic-mgmt-framework --tail 100 (look for Go panic stack trace)`}
        />
        <Table
          head={["HTTP Status", "Likely cause", "First debug step"]}
          rows={[
            ["400", "CVL validation fail or JSON syntax error", "Read error-message in response body, check CVL logs"],
            ["401", "PAM auth failed (password, permissions)", "Verify: id <user>, check /var/log/auth.log"],
            ["404", "YANG path not found", "Verify path with GET /restconf/data (list top-level), check YANG compiled"],
            ["409", "Resource already exists (POST duplicate)", "Try PATCH instead of POST, or DELETE first"],
            ["415", "Missing or wrong Content-Type header", "Add: -H 'Content-Type: application/yang-data+json'"],
            ["500", "Translib panic, Redis down, or internal bug", "docker logs sonic-mgmt-framework (look for stack trace)"],
            ["503", "Service unavailable (container not ready)", "docker ps (is mgmt-framework up?), check docker logs"],
          ]}
        />
      </Section>

      {/* 04 */}
      <Section id="translib-debug" number="04" title="Translib & Transformers">
        <P>
          Translib runs inside the mgmt-framework container. It uses <strong>glog</strong> for logging (not syslog directly — logs go to container stdout, then rsyslog aggregates to /var/log/syslog).
        </P>
        <CodeBlock
          title="translib_debug.sh"
          output={`# Enable glog verbosity level 5 (most verbose)
admin@sonic:~$ docker exec sonic-mgmt-framework \\
  sed -i 's/rest_server -v=2/rest_server -v=5/' /usr/bin/rest_server_start.sh
admin@sonic:~$ docker restart sonic-mgmt-framework

# Now watch the logs (live tail)
admin@sonic:~$ docker logs -f sonic-mgmt-framework | grep -E "translib|Path="

I0612 10:23:45.678901  1234 translib.go:123] Set: Path=/openconfig-interfaces:interfaces/interface[name=Ethernet0]/config/mtu
I0612 10:23:45.679234  1234 xfmr_intf.go:87] YangToDb_intf_mtu_xfmr: ifName=Ethernet0 mtu=9100
I0612 10:23:45.679567  1234 db_access.go:234] SetEntry: table=INTERFACE key=Ethernet0 field=mtu value=9100
I0612 10:23:45.680123  1234 cvl.go:456] ValidateEditConfig: PASS
I0612 10:23:45.680456  1234 translib.go:234] Set: SUCCESS (2ms)

# Common glog patterns to grep for:
"Path="              YANG path being processed
"YangToDb"           Transformer callback invoked
"DbToYang"           Read transformer (GET request)
"CVL"                Validation stage
"SetEntry"           Redis write about to happen
"panic"              Crash (followed by Go stack trace)

# Example of a panic (transformer bug):
E0612 10:25:12.345678  1234 translib.go:345] panic: runtime error: invalid memory address
goroutine 42 [running]:
github.com/Azure/sonic-mgmt-common/translib/transformer.YangToDb_acl_rule_xfmr(...)
    /build/mgmt-common/translib/transformer/xfmr_acl.go:234
# Line 234 in xfmr_acl.go tried to dereference nil pointer

# Debug a specific transformer: add print statements
# (requires rebuilding translib, see source-walkthrough §10)
admin@sonic:~$ docker exec -it sonic-mgmt-framework bash
root@sonic:/# vim /usr/src/sonic-mgmt-common/translib/transformer/xfmr_intf.go
# Add: glog.Infof("DEBUG: inParams=%+v", inParams)
# Rebuild, docker cp .so, restart`}
          code={`# Translib debugging with glog

# STEP 1: Increase glog verbosity (-v flag)
# Edit inside container or rebuild with higher -v
docker exec sonic-mgmt-framework \\
  bash -c 'echo "rest_server -v=5" > /tmp/override && supervisorctl restart rest_server'

# STEP 2: Watch translib logs (container stdout → syslog)
docker logs -f sonic-mgmt-framework | grep "translib\\|Path="

# STEP 3: Key log markers to search for
# "Path=/openconfig-..."     which YANG path
# "YangToDb_*_xfmr"          transformer callback start
# "SetEntry table=X key=Y"   about to write Redis
# "CVL validation: PASS/FAIL" validation result
# "panic:"                   crash (read stack trace below)

# STEP 4: Common translib panics and causes
# "nil pointer dereference"       transformer accessed map[key] without checking existence
# "index out of range"            array access bug in transformer
# "assignment to entry in nil map" forgot to initialize dbMapOut
# Fix: edit xfmr_*.go, add nil checks, rebuild translib

# STEP 5: Manually test a transformer (unit test)
docker exec sonic-mgmt-framework bash
cd /usr/src/sonic-mgmt-common/translib/transformer
go test -v -run TestIntfMtuTransformer
# Faster than full REST round-trip for debugging callbacks`}
        />
        <Callout type="behind">
          ⚙️ <strong>Why glog instead of syslog?</strong> Translib is Go code. glog is the Go community standard (used by Kubernetes, etcd, etc.). It supports verbosity levels (-v=0 errors only, -v=5 debug everything), structured logging, and automatic line numbers. The Docker container captures glog stdout and forwards to syslog via rsyslog, so you get the best of both worlds.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="cvl-debug" number="05" title="CVL Validation Errors">
        <CodeBlock
          title="cvl_errors.txt"
          runnable={false}
          code={`CVL returns structured errors (CVLErrorInfo):

type CVLErrorInfo struct {
    ErrCode            CVLRetCode       // CVL_SYNTAX_ERROR, CVL_SEMANTIC_ERROR, etc.
    TableName          string           // which Redis table
    Keys               []string         // which key(s)
    Field              string           // which field failed
    Value              string           // the rejected value
    ConstraintErrMsg   string           // human-readable: "range 1-4094", "must condition: mtu <= 9216"
    ErrAppTag          string           // YANG error-app-tag (for RESTCONF error response)
}

Common CVL error codes:
┌────────────────────────────────────────────────────────────────┐
│ CVL_SYNTAX_ERROR         type/range/pattern/enum mismatch     │
│ CVL_SEMANTIC_ERROR       must/when/leafref violation          │
│ CVL_SYNTAX_MISSING_FIELD required leaf not provided           │
│ CVL_SYNTAX_INVALID_FIELD unknown field (not in YANG)          │
└────────────────────────────────────────────────────────────────┘

Example error decoding:
{
  "ErrCode": "CVL_SYNTAX_ERROR",
  "TableName": "VLAN",
  "Keys": ["Vlan5000"],
  "Field": "vlanid",
  "Value": "5000",
  "ConstraintErrMsg": "range violation: valid range 1..4094",
  "ErrAppTag": "range-out-of-bounds"
}

Translation: User tried to create VLAN 5000, but sonic-vlan.yang defines:
  leaf vlanid { type uint16 { range "1..4094"; } }
CVL checked the range BEFORE writing to Redis — correct behavior.

Debugging CVL failures:
1. Read the ConstraintErrMsg (usually tells you exactly what's wrong)
2. Find the YANG file: models/yang/sonic/sonic-<table>.yang or openconfig/...
3. Search for the Field name in YANG → see the constraint (range, must, pattern)
4. Fix payload OR fix YANG (if constraint is wrong) → rebuild`}
        />
        <CodeBlock
          title="cvl_trace_enable.sh"
          code={`# Enable CVL detailed tracing (for must/when XPath debugging)
admin@sonic:~$ docker exec sonic-mgmt-framework bash
root@sonic:/# cat > /etc/cvl_cfg.json <<'EOF'
{
  "TRACE_CACHE": "true",
  "TRACE_SYNTAX": "true",
  "TRACE_SEMANTIC": "true",
  "TRACE_ONERROR": "true"
}
EOF
root@sonic:/# export CVL_CFG_FILE=/etc/cvl_cfg.json
root@sonic:/# supervisorctl restart rest_server

# Now CVL logs every step (warning: VERY verbose)
admin@sonic:~$ docker logs sonic-mgmt-framework | grep CVL
CVL[SYNTAX]: Checking leaf 'mtu' type uint16
CVL[SYNTAX]: Range check: 9100 in [68..9216] → PASS
CVL[SEMANTIC]: Evaluating must: current()/../mtu <= /platform/max-mtu
CVL[SEMANTIC]: XPath result: true → PASS

# To reproduce a CVL error with minimal Redis state:
# 1. Export current DB to JSON
redis-dump -d 4 -y > test_db.json
# 2. Start a local Redis (docker run -p 6380:6379 redis)
# 3. Load test_db.json into local Redis
# 4. Run CVL validate against local DB (isolates the check)
# (This is how CVL unit tests work: translib/cvl/testdata/)`}
        />
      </Section>

      {/* 06 */}
      <Section id="gnmi-debug" number="06" title="gNMI Telemetry Path">
        <CodeBlock
          title="gnmi_debug.sh"
          output={`# Check if gNMI server is running
admin@sonic:~$ docker ps | grep telemetry
abc123  sonic-telemetry  "/usr/bin/supervisord"  Up 2 hours

# View gNMI server logs
admin@sonic:~$ docker logs sonic-telemetry --tail 50
I0612 10:30:12 gnmi_server.go:123] Server listening on :8080 (insecure) and :50051 (TLS)

# Test gNMI Get (gnmi_get tool or gnmic)
admin@sonic:~$ gnmi_get -insecure -target_addr localhost:8080 \\
  -xpath /openconfig-interfaces:interfaces/interface[name=Ethernet0]/state/oper-status

path: "/openconfig-interfaces:interfaces/interface[name=Ethernet0]/state/oper-status"
value: "UP"

# If path returns empty:
# → Check STATE_DB has the data
admin@sonic:~$ redis-cli -n 6 HGETALL "PORT_TABLE:Ethernet0"
1) "oper_status"
2) "up"
# Data exists → gNMI transformer issue

# → Enable gNMI verbose logs (same glog as translib)
admin@sonic:~$ docker exec sonic-telemetry \\
  bash -c 'kill -USR1 \$(pidof gnmi_server)'  # toggle glog verbosity
admin@sonic:~$ docker logs -f sonic-telemetry | grep "DbToYang"

# Common gNMI issues:
# 1. ON_CHANGE subscription not firing
#    → Check keyspace events: redis-cli CONFIG GET notify-keyspace-events
#    → Should be "AKE" (if empty, ON_CHANGE never triggers)
# 2. TLS cert errors
#    → Use -insecure for testing, or check /etc/sonic/credentials/
# 3. Path not found (404)
#    → Verify with gnmi_capabilities: lists all supported paths`}
          code={`# gNMI debugging commands

# 1. Check gNMI container status
docker ps | grep telemetry
docker logs sonic-telemetry --tail 50

# 2. Test with gnmi_get (install from github.com/openconfig/gnmi)
gnmi_get -insecure -target_addr localhost:8080 \\
  -xpath /openconfig-interfaces:interfaces/interface[name=Ethernet0]/state

# 3. List all supported paths (capabilities)
gnmi_capabilities -insecure -target_addr localhost:8080

# 4. Debug ON_CHANGE subscriptions (if not firing)
# Check Redis keyspace events enabled
redis-cli CONFIG GET notify-keyspace-events
# Must return "AKE" (All Keyspace Events)

# 5. Subscribe and watch events
gnmi_get -insecure -target_addr localhost:8080 -streaming_type ON_CHANGE \\
  -xpath /openconfig-interfaces:interfaces/interface[name=Ethernet0]/state/oper-status
# Make a change (admin down/up) → see update stream in real-time

# 6. If path returns empty but redis-cli shows data:
# → gNMI DbToYang transformer not mapping STATE_DB correctly
# → Check sonic-gnmi code (same translib as REST, but different entry point)`}
        />
      </Section>

      {/* 07 */}
      <Section id="docker-systemd" number="07" title="Docker & systemd Issues">
        <CodeBlock
          title="docker_systemd_debug.sh"
          output={`# Check all SONiC containers
admin@sonic:~$ docker ps --format "table {{.Names}}\\t{{.Status}}"
NAMES                  STATUS
sonic-mgmt-framework   Up 3 hours
sonic-telemetry        Up 3 hours
sonic-database         Up 3 hours
sonic-swss             Up 3 hours

# If mgmt-framework is missing or restarting:
admin@sonic:~$ docker ps -a | grep mgmt-framework
sonic-mgmt-framework   Restarting (1) 2 seconds ago
# Status "Restarting" = crash loop (exits immediately)

# Read container logs (last 100 lines)
admin@sonic:~$ docker logs sonic-mgmt-framework --tail 100
2024-06-12 10:15:23 CRIT Supervisor is running as root.
2024-06-12 10:15:23 INFO supervisord started with pid 1
2024-06-12 10:15:24 INFO spawned: 'rest_server' with pid 12
2024-06-12 10:15:24 FATAL rest_server: can't find file '/usr/sbin/rest_server'
# Missing binary! Rebuild the container or check Dockerfile

# Enter a running container (debug interactively)
admin@sonic:~$ docker exec -it sonic-mgmt-framework bash
root@sonic:/# ps aux | grep rest_server
root  12  0.3  1.2  /usr/sbin/rest_server -v=2 -port=443
root@sonic:/# ls -la /usr/sbin/rest_server
-rwxr-xr-x 1 root root 42M Jun 12 10:00 /usr/sbin/rest_server

# Check systemd services (host daemons, not containers)
admin@sonic:~$ systemctl status hostcfgd.service
● hostcfgd.service - SONiC Host Config Daemon
   Loaded: loaded (/lib/systemd/system/hostcfgd.service; enabled)
   Active: active (running) since Wed 2024-06-12 09:00:12 UTC; 1h ago
   Main PID: 1234 (python3)
   CGroup: /system.slice/hostcfgd.service
           └─1234 python3 /usr/bin/hostcfgd

# Watch hostcfgd logs live (journalctl)
admin@sonic:~$ journalctl -u hostcfgd -f
Jun 12 10:45:23 sonic hostcfgd[1234]: Updating interface Ethernet0: admin_status=up
Jun 12 10:45:24 sonic hostcfgd[1234]: Command succeeded: ip link set Ethernet0 up

# If hostcfgd is inactive:
admin@sonic:~$ systemctl status hostcfgd
● hostcfgd.service - SONiC Host Config Daemon
   Loaded: loaded
   Active: inactive (dead)
admin@sonic:~$ systemctl start hostcfgd
admin@sonic:~$ journalctl -u hostcfgd -n 50
# Read why it failed to start (Python import error, Redis connection fail, etc.)`}
          code={`# Docker & systemd debugging

# 1. List all containers (check for restarts/crashes)
docker ps -a

# 2. View container logs (stdout/stderr from supervisord)
docker logs <container_name> --tail 100

# 3. If container is restarting:
docker logs <container_name> | grep -E "FATAL|ERROR|panic"
# Common causes: missing binary, port already in use, Redis unreachable

# 4. Enter container for interactive debug
docker exec -it <container_name> bash
# Check: ps aux, ls /usr/sbin, netstat -tlnp

# 5. Restart a container
docker restart sonic-mgmt-framework

# 6. Check systemd services (hostcfgd, hostservicesd)
systemctl status hostcfgd
systemctl status hostservicesd

# 7. Watch systemd journal live
journalctl -u hostcfgd -f

# 8. If hostcfgd not starting:
journalctl -u hostcfgd -n 100 --no-pager
# Look for: ImportError (Python deps), redis.exceptions.ConnectionError

# 9. Restart hostcfgd
sudo systemctl restart hostcfgd`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Don&apos;t confuse container logs and host logs!</strong> <IC>docker logs sonic-mgmt-framework</IC> shows REST server / translib output (runs in container). <IC>journalctl -u hostcfgd</IC> shows hostcfgd output (runs on host OS). They both write to /var/log/syslog (aggregated), but if you need real-time streaming, use the right tool: <IC>docker logs -f</IC> for containers, <IC>journalctl -f</IC> for host services.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="logs-map" number="08" title="Logs Map: Where to Look ⭐">
        <Table
          head={["Component", "Log location", "How to view it live"]}
          rows={[
            [
              "REST server (mgmt-framework container)",
              "/var/log/syslog (aggregated via rsyslog) + docker logs",
              <IC key="1">docker logs -f sonic-mgmt-framework | grep rest_server</IC>,
            ],
            [
              "translib / CVL (Go code in container)",
              "docker logs (glog to stdout) → syslog",
              <IC key="2">docker logs -f sonic-mgmt-framework | grep translib</IC>,
            ],
            [
              "gNMI server (telemetry container)",
              "docker logs sonic-telemetry",
              <IC key="3">docker logs -f sonic-telemetry</IC>,
            ],
            [
              "hostcfgd (host OS service)",
              "journalctl -u hostcfgd + /var/log/syslog",
              <IC key="4">journalctl -u hostcfgd -f</IC>,
            ],
            [
              "Redis (database container)",
              "docker logs sonic-database (rarely needed)",
              <IC key="5">redis-cli MONITOR</IC>,
            ],
            [
              "orchagent / syncd (SWSS pipeline)",
              "/var/log/swss/sairedis.rec (low-level SAI calls)",
              <IC key="6">tail -f /var/log/swss/*.log</IC>,
            ],
            [
              "Kernel / Linux networking",
              "dmesg, /var/log/syslog (kernel ring buffer)",
              <IC key="7">dmesg -w</IC>,
            ],
          ]}
        />
        <CodeBlock
          title="centralized_syslog_grep.sh"
          code={`# /var/log/syslog aggregates EVERYTHING (containers + host services)
# Pro tip: use multi-grep to correlate timestamps across layers

# Find a request by timestamp (trace across all layers)
grep "10:23:45" /var/log/syslog | grep -E "rest_server|translib|hostcfgd"

# Output example:
# Jun 12 10:23:45 sonic rest_server[1234]: PATCH /openconfig-interfaces:... → translib.Set()
# Jun 12 10:23:45 sonic translib[1234]: Set: Path=/openconfig-interfaces:interfaces/interface[name=Eth0]
# Jun 12 10:23:45 sonic translib[1234]: SetEntry: table=INTERFACE key=Ethernet0 field=mtu value=9100
# Jun 12 10:23:45 sonic hostcfgd[5678]: CONFIG_DB event: INTERFACE|Ethernet0 hset mtu 9100
# Jun 12 10:23:45 sonic hostcfgd[5678]: Executing: ip link set Ethernet0 mtu 9100
# Jun 12 10:23:45 sonic kernel: [ 1234.567] eth0: mtu changed to 9100

# This tells the FULL story in 6 lines! 🎯`}
        />
      </Section>

      {/* 09 */}
      <Section id="end-to-end" number="09" title="End-to-End Request Trace — The Masterclass ⭐">
        <P>
          Open <strong>four terminal windows</strong>. Fire one request. Watch the evidence cascade through every layer in real-time. This is the gold standard for debugging.
        </P>
        <CodeBlock
          title="4_terminal_trace.sh"
          runnable={false}
          code={`TERMINAL 1: Redis monitor (see the write)
───────────────────────────────────────────────────────────
admin@sonic:~$ redis-cli -n 4 monitor | grep INTERFACE
OK
(waiting for events...)


TERMINAL 2: hostcfgd journal (see the event + Linux command)
───────────────────────────────────────────────────────────
admin@sonic:~$ journalctl -u hostcfgd -f
-- Logs begin at Wed 2024-06-12 09:00:00 UTC. --
(waiting for events...)


TERMINAL 3: REST + translib logs (see the request)
───────────────────────────────────────────────────────────
admin@sonic:~$ tail -f /var/log/syslog | grep -E "rest_server|translib"
(waiting for logs...)


TERMINAL 4: Fire the request
───────────────────────────────────────────────────────────
admin@sonic:~$ curl -kv -u admin:YourPaSsWoRd -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"mtu": 9100}'


──────────────────────────────────────────────────────────────────────
NOW WATCH THE TIMELINE (annotated with timestamps):
──────────────────────────────────────────────────────────────────────

[T+0ms]   TERMINAL 4 (curl):
          > PATCH /restconf/data/openconfig-interfaces:...
          > Authorization: Basic ...

[T+8ms]   TERMINAL 3 (syslog):
          rest_server[1234]: Received PATCH /openconfig-interfaces:interfaces/interface[name=Ethernet0]/config
          translib[1234]: Set: Path=/openconfig-interfaces:interfaces/interface[name=Eth0]/config/mtu
          translib[1234]: CVL validation: PASS

[T+12ms]  TERMINAL 1 (redis-cli monitor):
          1686234567.012345 [4 "HSET" "INTERFACE|Ethernet0" "mtu" "9100"]

[T+15ms]  TERMINAL 2 (journalctl hostcfgd):
          Jun 12 10:23:45 sonic hostcfgd[5678]: CONFIG_DB keyspace event: INTERFACE|Ethernet0 hset mtu
          Jun 12 10:23:45 sonic hostcfgd[5678]: Updating interface Ethernet0: mtu=9100
          Jun 12 10:23:45 sonic hostcfgd[5678]: Executing: ip link set dev Ethernet0 mtu 9100
          Jun 12 10:23:45 sonic hostcfgd[5678]: Command succeeded

[T+18ms]  TERMINAL 3 (syslog):
          translib[1234]: Set: SUCCESS (18ms)
          rest_server[1234]: PATCH /openconfig-interfaces:... 204 (18ms)

[T+20ms]  TERMINAL 4 (curl):
          < HTTP/1.1 204 No Content
          * Connection #0 to host localhost left intact

──────────────────────────────────────────────────────────────────────
TOTAL TIME: 20ms. EVIDENCE AT ALL 6 LAYERS:
  ✅ Client received 204
  ✅ REST logged success
  ✅ translib validated + wrote
  ✅ Redis has the key
  ✅ hostcfgd saw the event
  ✅ Linux applied the MTU (verify: ip link show Ethernet0)
──────────────────────────────────────────────────────────────────────`}
        />
        <Callout type="tip">
          🎯 <strong>Interview gold:</strong> &quot;I&apos;d open four terminals: redis-cli monitor, journalctl -f for hostcfgd, tail syslog for REST, and curl to fire the request. Watching the cascade in real-time shows me exactly where the request is stuck. If Redis monitor sees the write but journalctl is silent, hostcfgd isn&apos;t subscribed — keyspace events are off. If translib logs stop before the Redis write, CVL rejected it — check syslog for CVLErrorInfo. It&apos;s a 20-second diagnosis.&quot;
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="perf" number="10" title="Memory & Performance">
        <CodeBlock
          title="perf_debug.sh"
          output={`# Check container resource usage (CPU, memory)
admin@sonic:~$ docker stats --no-stream
CONTAINER              CPU %   MEM USAGE / LIMIT     MEM %
sonic-mgmt-framework   1.2%    128MiB / 2GiB         6.4%
sonic-telemetry        0.5%    64MiB / 2GiB          3.2%
sonic-database         0.8%    256MiB / 2GiB        12.8%

# If mgmt-framework memory is climbing:
# → REST server might be leaking (rare, but possible in long-lived conns)
# → Check: docker exec sonic-mgmt-framework ps aux
#   If rest_server RSS > 500MB, consider restart (should be ~100-200MB)

# Redis memory usage
admin@sonic:~$ redis-cli INFO memory | grep human
used_memory_human:42.73M
used_memory_peak_human:58.12M

# Redis slow queries (operations taking > threshold)
admin@sonic:~$ redis-cli SLOWLOG GET 10
1) 1) (integer) 123
   2) (timestamp) 1686234567
   3) (microseconds) 15234
   4) 1) "KEYS"
      2) "VLAN*"
# KEYS command took 15ms (pattern scan on large keyspace)
# Fix: use SCAN instead of KEYS in production

# If REST requests are slow (> 100ms):
# 1. Enable translib profiling (if compiled with pprof support)
docker exec sonic-mgmt-framework curl http://localhost:6060/debug/pprof/profile?seconds=10 > profile.pb
# 2. Analyze with: go tool pprof profile.pb
# (requires Go toolchain on dev machine)

# 3. Check if Redis is the bottleneck
redis-cli --latency-history
# Shows per-second latency. If spikes correlate with slow REST, Redis is the issue
# (unlikely unless disk I/O is saturated)`}
          code={`# Performance & memory debugging

# 1. Container resource usage
docker stats --no-stream

# 2. Redis memory info
redis-cli INFO memory | grep used_memory_human

# 3. Redis slow query log
redis-cli SLOWLOG GET 10
# Look for KEYS commands (slow on large keyspaces)
# Fix: use SCAN instead

# 4. REST request latency (from logs)
grep "rest_server.*204" /var/log/syslog | awk '{print \$NF}'
# Prints response times: (12ms), (45ms), etc.

# 5. If translib is slow (CPU profiling with pprof)
# Requires rest_server built with: go build -tags pprof
docker exec sonic-mgmt-framework curl -o /tmp/cpu.prof \\
  http://localhost:6060/debug/pprof/profile?seconds=10
# Download /tmp/cpu.prof, analyze with: go tool pprof cpu.prof

# 6. Check for memory leaks (heap dump)
docker exec sonic-mgmt-framework curl -o /tmp/heap.prof \\
  http://localhost:6060/debug/pprof/heap
# go tool pprof -http=:8080 heap.prof (visualize in browser)`}
        />
      </Section>

      {/* 11 */}
      <Section id="lab" number="11" title="Lab: 3 Intentional Failures — Diagnose Each">
        <P>
          <strong>Goal:</strong> Break NTP config in 3 different ways. Use the playbook to diagnose each in under 2 minutes.
        </P>
        <CodeBlock
          title="lab_break_ntp.sh"
          output={`────────────────────────────────────────────────────────────
BREAK #1: Invalid payload (CVL syntax error)
────────────────────────────────────────────────────────────
admin@sonic:~$ curl -kv -u admin:YourPaSsWoRd -X POST \\
  https://localhost/restconf/data/openconfig-system:system/ntp/servers \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"server": [{"address": "not-an-ip", "config": {"address": "not-an-ip"}}]}'

< HTTP/1.1 400 Bad Request
{
  "ietf-restconf:errors": {
    "error": [{
      "error-message": "pattern-violation: address must be valid IPv4/IPv6"
    }]
  }
}

DIAGNOSIS:
  ✅ 400 → payload rejected
  ✅ Error mentions "pattern-violation" → CVL syntax check
  ✅ redis-cli KEYS '*NTP*' → no keys (translib never wrote)
  ROOT CAUSE: Invalid IP address format, caught by CVL
  TIME: 30 seconds

────────────────────────────────────────────────────────────
BREAK #2: Fake annotation typo (translib panic)
────────────────────────────────────────────────────────────
(Simulate by editing sonic-system-annot.yang to reference non-existent table)
# In real scenario: developer pushes YANG with wrong db-name annotation

admin@sonic:~$ curl -X PATCH ... (same NTP request)
< HTTP/1.1 500 Internal Server Error

admin@sonic:~$ docker logs sonic-mgmt-framework --tail 30 | grep panic
panic: runtime error: invalid memory address or nil pointer dereference
github.com/Azure/sonic-mgmt-common/translib/transformer.getNtpServer(...)
    /build/translib/transformer/xfmr_system.go:123

DIAGNOSIS:
  ✅ 500 → internal error
  ✅ docker logs shows Go panic + stack trace
  ✅ Line 123: tried to access dbMap["NTP_SERVR"] (typo: missing E)
  ROOT CAUSE: Annotation db-name typo → transformer nil map access
  TIME: 1 minute (read stack trace)

────────────────────────────────────────────────────────────
BREAK #3: Disable hostcfgd (silent failure)
────────────────────────────────────────────────────────────
admin@sonic:~$ sudo systemctl stop hostcfgd

admin@sonic:~$ curl -X PATCH ... (valid NTP request)
< HTTP/1.1 204 No Content
# Client thinks it worked!

admin@sonic:~$ redis-cli -n 4 HGETALL "NTP_SERVER|10.0.0.1"
1) "address"
2) "10.0.0.1"
# Redis has the data!

admin@sonic:~$ cat /etc/ntp.conf | grep 10.0.0.1
# (nothing — file unchanged)

admin@sonic:~$ journalctl -u hostcfgd -n 5
-- No entries --
# hostcfgd didn't log anything!

admin@sonic:~$ systemctl status hostcfgd
● hostcfgd.service
   Active: inactive (dead)
# AH-HA! hostcfgd is stopped.

DIAGNOSIS:
  ✅ 204 + Redis has key → write succeeded
  ✅ /etc/ntp.conf unchanged → daemon didn't apply
  ✅ journalctl silent → hostcfgd not running
  ✅ systemctl status → confirms it's stopped
  ROOT CAUSE: hostcfgd service down (systemctl start hostcfgd fixes it)
  TIME: 90 seconds

────────────────────────────────────────────────────────────
LAB SUMMARY: 3 failures, 3 different layers, all diagnosed
with the playbook. Total time: <4 minutes. 🏆
────────────────────────────────────────────────────────────`}
          code={`# Lab: intentionally break NTP config 3 ways, diagnose each

# SETUP: ensure NTP feature is available (some SONiC builds exclude it)
# If missing, use INTERFACE or VLAN instead (same principles apply)

# ────────────────────────────────────────────────────────────
# BREAK #1: Send invalid IP address (trigger CVL syntax error)
# ────────────────────────────────────────────────────────────
curl -kv -u admin:password -X POST \\
  https://localhost/restconf/data/openconfig-system:system/ntp/servers \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"server": [{"address": "not-an-ip", "config": {"address": "not-an-ip"}}]}'

# EXPECTED: 400 Bad Request with "pattern-violation"
# DIAGNOSIS STEPS:
# 1. curl -v shows 400 → read error body
# 2. Error mentions CVL pattern check
# 3. redis-cli KEYS '*NTP*' → no keys (translib aborted before write)
# CONCLUSION: CVL working correctly, rejected bad input

# ────────────────────────────────────────────────────────────
# BREAK #2: Simulate transformer bug (requires code edit, OR...)
# WORKAROUND: trigger a different 500 by corrupting Redis manually
# ────────────────────────────────────────────────────────────
# (Simpler version: just cause a 500 by stopping Redis temporarily)
docker stop sonic-database
curl -X PATCH https://localhost/restconf/data/... (any request)
# EXPECTED: 500 or timeout
# DIAGNOSIS: docker ps shows database down, docker logs shows Redis conn error
docker start sonic-database

# ────────────────────────────────────────────────────────────
# BREAK #3: Stop hostcfgd (silent failure scenario)
# ────────────────────────────────────────────────────────────
sudo systemctl stop hostcfgd

curl -kv -u admin:password -X PATCH \\
  https://localhost/restconf/data/openconfig-interfaces:interfaces/interface=Ethernet0/config \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{"mtu": 1500}'

# EXPECTED: 204 No Content (success!)
# BUT: ip link show Ethernet0 → MTU unchanged

# DIAGNOSIS STEPS:
# 1. redis-cli HGETALL "INTERFACE|Ethernet0" → mtu:1500 (data is there!)
# 2. journalctl -u hostcfgd -n 10 → no recent logs
# 3. systemctl status hostcfgd → inactive (dead)
# CONCLUSION: hostcfgd stopped, config in Redis but not applied

# FIX:
sudo systemctl start hostcfgd
# Now journalctl shows: "Updating interface Ethernet0: mtu=1500"
# ip link show Ethernet0 → mtu 1500 ✅`}
        />
      </Section>

      {/* 12 */}
      <Section id="memorize" number="12" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Golden rule", "Binary search the pipeline: find LAST layer with evidence (Redis is the pivot)"],
            ["Redis pivot", "redis-cli -n 4 HGETALL <key> → if exists: problem AFTER (hostcfgd/daemon); if missing: BEFORE (REST/CVL)"],
            ["Keyspace events", "redis-cli CONFIG GET notify-keyspace-events → must return 'AKE' or hostcfgd never fires"],
            ["Redis monitor", "redis-cli -n 4 monitor | grep <table> → see every write in real-time"],
            ["REST status codes", "400=CVL/payload · 401=auth · 404=YANG path · 500=translib panic · 204=success"],
            ["CVL errors", "CVLErrorInfo: read ConstraintErrMsg (range, must, leafref) → find YANG constraint, fix payload"],
            ["Translib glog", "docker logs sonic-mgmt-framework | grep 'Path=' → see YANG path + transformer callbacks"],
            ["hostcfgd logs", "journalctl -u hostcfgd -f → see CONFIG_DB events + Linux commands executed"],
            ["4-terminal trace", "redis monitor + journalctl + syslog tail + curl → watch cascade across all layers"],
            ["gNMI silent fail", "ON_CHANGE not firing → keyspace events disabled (same fix as hostcfgd)"],
            ["Logs map", "REST=docker logs mgmt-framework · hostcfgd=journalctl -u · aggregated=/var/log/syslog"],
            ["Common panic", "nil pointer in transformer → forgot to check map[key] existence → add if val, ok := check"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
