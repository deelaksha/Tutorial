"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Anatomy of a strong SONiC answer",
  nodes: [
    { id: "q", icon: "❓", label: "Question", sub: "interviewer asks", x: 6, y: 50, color: "#22d3ee" },
    { id: "layer", icon: "🧭", label: "Name the layers", sub: "north→south", x: 24, y: 22, color: "#60a5fa" },
    { id: "artifact", icon: "🧾", label: "Cite artifacts", sub: "tables·files·paths", x: 24, y: 78, color: "#a78bfa" },
    { id: "flow", icon: "🔀", label: "Walk the flow", sub: "REST→...→daemon", x: 46, y: 50, color: "#34d399" },
    { id: "debug", icon: "🐛", label: "Debug angle", sub: "how I&apos;d verify", x: 66, y: 22, color: "#fb923c" },
    { id: "tradeoff", icon: "⚖️", label: "Trade-offs", sub: "why this design", x: 66, y: 78, color: "#f472b6" },
    { id: "hire", icon: "✅", label: "Hire signal", sub: "depth + breadth", x: 88, y: 50, color: "#10b981" },
  ],
  edges: [
    { id: "q-layer", from: "q", to: "layer", color: "#60a5fa" },
    { id: "q-artifact", from: "q", to: "artifact", color: "#a78bfa" },
    { id: "layer-flow", from: "layer", to: "flow", color: "#34d399" },
    { id: "artifact-flow", from: "artifact", to: "flow", color: "#34d399" },
    { id: "flow-debug", from: "flow", to: "debug", color: "#fb923c" },
    { id: "flow-tradeoff", from: "flow", to: "tradeoff", color: "#f472b6" },
    { id: "debug-hire", from: "debug", to: "hire", color: "#10b981" },
    { id: "tradeoff-hire", from: "tradeoff", to: "hire", color: "#10b981" },
    { id: "q-hire", from: "q", to: "hire", bend: -40, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "model",
      name: "✅ Model answer — PATCH NTP",
      command: "Q: Walk me through what happens when you PATCH an NTP server via REST",
      steps: [
        { node: "q", paths: ["q-layer", "q-artifact"], text: "Interviewer asks: 'What happens when you PATCH /openconfig-system:system/ntp/servers/server=10.1.1.1/config?' — probing for depth across all layers." },
        { node: "layer", paths: ["layer-flow"], text: "STRONG candidate: 'The request flows through 4 layers: northbound (REST/ygot), middleware (translib/CVL), southbound (CONFIG_DB), orchestration (hostcfgd→chronyd). Each layer has a distinct job.' Interviewer nods — you named the stack." },
        { node: "artifact", paths: ["artifact-flow"], text: "You cite specifics: 'openconfig-system.yang defines the path, openconfig-system-annot.yang maps to NTP_SERVER table, sonic-ntp.yang validates type inet:ip-address. Translib writes to CONFIG_DB key NTP_SERVER|10.1.1.1 with NULL field.' Real file names = real experience." },
        { node: "flow", paths: ["flow-debug", "flow-tradeoff"], text: "You walk the flow: 'REST→ygot unmarshal→translib calls ntp_server_key_xfmr→CVL validates→HSET to Redis DB 4→keyspace event→hostcfgd NtpCfg→sonic-cfggen renders chrony.conf.j2→systemctl restart chrony→chronyd syncs.' Every hop named." },
        { node: "debug", paths: ["debug-hire"], text: "Debug angle: 'To verify, I'd check redis-cli -n 4 HGETALL NTP_SERVER|10.1.1.1 for the key, journalctl -u hostcfgd for the handler log, grep 10.1.1.1 /etc/chrony/chrony.conf for the render, chronyc sources for reach=377. If broken at any hop, I know where to dig.' You just described a 4-command triage." },
        { node: "tradeoff", paths: ["tradeoff-hire"], text: "Trade-off question: 'Why keyspace notifications instead of polling?' You answer: 'Redis pub/sub delivers <1ms latency vs polling every N seconds. Trade-off: requires persistent subscriber daemons (hostcfgd), more complex than cron. But instant propagation wins for control-plane changes.' Depth + design thinking." },
        { node: "hire", paths: [], text: "Interviewer sees: layers named, artifacts cited, flow traced, debug commands ready, design trade-offs understood. Strong hire signal — you've BUILT this, not just read about it. 🎯" },
      ],
    },
    {
      id: "vague",
      name: "❌ Vague answer — weak signal",
      command: "Same question, but candidate skips artifacts and debug",
      steps: [
        { node: "q", paths: ["q-layer"], text: "Same question: 'What happens when you PATCH an NTP server?' Candidate starts well: 'The REST API handles it...'" },
        { node: "layer", paths: ["layer-flow"], text: "Candidate: 'The request goes through some middleware layer, then to the database, then to the NTP daemon.' Layers named vaguely — no translib, no CVL, no CONFIG_DB mentioned. Interviewer's interest drops." },
        { node: "flow", paths: ["flow-debug"], text: "Candidate: 'It updates the config file and restarts NTP.' True but surface-level. No mention of transformer, keyspace events, hostcfgd, Jinja2. No file paths. Red flag: sounds like reading docs, not doing work." },
        { node: "debug", paths: ["debug-hire"], text: "Interviewer probes: 'How would you debug if NTP config didn't apply?' Candidate: 'Um, check logs I guess?' No specific commands, no hop-by-hop checklist. Weak signal — can't operationalize knowledge." },
        { node: "artifact", paths: [], text: "NEVER REACHED — candidate didn't cite a single file name, table name, or YANG model. Interviewer can't distinguish this from someone who skimmed a blog post." },
        { node: "tradeoff", paths: [], text: "NEVER REACHED — no design discussion. Candidate treated the question as trivia, not architecture." },
        { node: "hire", paths: [], text: "Weak hire signal — surface knowledge, no operational depth. Interviewer moves to next candidate. ❌" },
      ],
    },
    {
      id: "architect",
      name: "🏗️ Architect probe — deep dive",
      command: "Interviewer pushes on design: Why Redis? Why annotations?",
      steps: [
        { node: "q", paths: ["q-layer", "q-artifact"], text: "Follow-up: 'Why does SONiC use Redis instead of etcd or SQL? Why the two-YANG-model strategy?' — probing for architectural reasoning." },
        { node: "layer", paths: ["layer-flow"], text: "Candidate: 'Redis was chosen for sub-millisecond read latency (GET <0.5ms) critical for dataplane lookups. APPL_DB reads by orchagent are in the forwarding hot path. etcd's consensus overhead (Raft) adds 10-50ms. SQL is overkill for key-value schema.'" },
        { node: "artifact", paths: ["artifact-flow"], text: "You continue: 'The dual-YANG model (OpenConfig northbound, SONiC southbound) decouples vendor-neutral APIs from implementation. OpenConfig /interfaces/interface maps to PORT vs PORTCHANNEL vs VLAN via transformer logic. Lets SONiC evolve CONFIG_DB schema without breaking northbound contracts.'" },
        { node: "flow", paths: ["flow-tradeoff"], text: "You add: 'Annotations (sonic-ext:table-name, key-transformer) avoid hardcoding mappings in code. When we add a new OpenConfig feature, we write YANG deviation + xfmr function. No REST server changes needed — common_app handles all annotated paths generically.' Design elegance explained." },
        { node: "tradeoff", paths: ["tradeoff-hire"], text: "Trade-off deep dive: 'Subtree transformers are powerful (NTP is simple, but ACL transforms OC rule lists to SONiC RULE|table|seq keys) but increase complexity. Every xfmr is a custom translation layer — bugs here = data corruption. CVL mitigates by validating post-transform. Trade-off: flexibility vs debuggability.'" },
        { node: "debug", paths: ["debug-hire"], text: "You offer: 'For transformer bugs, I'd enable translib debug logs (TRACE_LEVEL), compare ygot struct → dbmap → CVL input. If xfmr returns wrong key, redis-cli shows misnamed key. If xfmr panics, mgmt-framework crashes (check coredump). I've debugged this pattern before.' War stories = credibility." },
        { node: "hire", paths: [], text: "Interviewer is impressed — you understand not just WHAT (the flow) but WHY (the design choices) and WHEN IT BREAKS (the failure modes). This is senior/staff-level reasoning. Strong hire. 🚀" },
      ],
    },
  ],
};

const NAV = [
  { id: "how-to-answer", label: "How to Answer — The Framework ⭐" },
  { id: "beginner", label: "Beginner Questions (25) ⭐" },
  { id: "intermediate", label: "Intermediate Questions (25) ⭐" },
  { id: "advanced", label: "Advanced Questions (25)" },
  { id: "architect", label: "Architect Questions (15)" },
  { id: "scenarios", label: "Debugging Scenarios (8) ⭐" },
  { id: "rapid-fire", label: "Rapid-Fire Facts (20)" },
  { id: "day-prep", label: "48-Hour Interview Prep" },
  { id: "lab", label: "Mock Interview Lab" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function InterviewPrepPage() {
  return (
    <TopicShell
      icon="🎤"
      title="Interview Preparation — 100+ SONiC Questions"
      gradientWord="Interview"
      subtitle="You've learned the SONiC management framework — now convert that knowledge into offers. This page arms you with 100+ real interview questions (beginner to architect), a proven answer framework (layers→artifacts→flow→debug→trade-offs), 8 production debugging scenarios, and a 48-hour prep plan. Practice the model answers here, then walk into your SONiC interview with the confidence of someone who's BUILT these systems."
      nav={NAV}
      badges={["100+ questions", "Answer framework", "8 debug scenarios", "Mock interview lab"]}
      next={{ icon: "📂", label: "Production Case Studies", href: "/sonic/case-studies" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="how-to-answer" number="01" title="How to Answer — The Framework ⭐">
        <P>
          Every strong SONiC answer hits 5 beats (watch the diagram above):
        </P>
        <CodeBlock
          title="the_answer_framework.txt"
          runnable={false}
          code={`1. NAME THE LAYERS     north→south stack (REST / translib / CVL / Redis / daemons)
2. CITE ARTIFACTS      file names, table names, YANG models (proof you've touched code)
3. WALK THE FLOW       REST→ygot→xfmr→CVL→CONFIG_DB→subscriber→template→daemon
4. DEBUG ANGLE         "to verify I'd run X, Y, Z" (shows operational thinking)
5. TRADE-OFFS          why this design? what breaks at scale? (architect-level)

weak answer: "the API updates the database and restarts the service"
strong answer: ALL FIVE BEATS in <90 seconds`}
        />
        <P>
          Here&apos;s a fully worked model answer to <strong>&quot;What happens when you PATCH an NTP server?&quot;</strong>:
        </P>
        <Callout type="tip">
          <strong>LAYER (beat 1):</strong> &quot;The request flows through 4 layers: northbound (REST+ygot), middleware
          (translib+CVL), southbound (CONFIG_DB in Redis), orchestration (hostcfgd→chronyd). Each has a distinct job.&quot;
        </Callout>
        <Callout type="tip">
          <strong>ARTIFACTS (beat 2):</strong> &quot;openconfig-system.yang defines the /system/ntp/servers/server path.
          openconfig-system-annot.yang maps it to NTP_SERVER table with key-transformer ntp_server_key_xfmr.
          sonic-ntp.yang validates the server_address field as inet:ip-address. CONFIG_DB key is NTP_SERVER|10.1.1.1.&quot;
        </Callout>
        <Callout type="tip">
          <strong>FLOW (beat 3):</strong> &quot;REST server ygot-unmarshals JSON to Go struct → translib common_app invokes
          the key xfmr to map OC address to Redis key → CVL calls ValidateEditConfig against sonic-ntp.yang (e.g., 999.1.1.1
          fails here with CVL_SYNTAX_INVALID_VALUE) → on pass, HSET to CONFIG_DB → keyspace event fires → hostcfgd
          SubscriberStateTable triggers NtpCfg handler → sonic-cfggen renders chrony.conf.j2 → systemctl restart chrony.&quot;
        </Callout>
        <Callout type="tip">
          <strong>DEBUG (beat 4):</strong> &quot;To verify: redis-cli -n 4 HGETALL NTP_SERVER|10.1.1.1 (hop 6), journalctl
          -u hostcfgd | grep NTP (hop 7), grep 10.1.1.1 /etc/chrony/chrony.conf (hop 8), chronyc sources for reach=377
          (hop 9). If it breaks, I know which hop failed.&quot;
        </Callout>
        <Callout type="tip">
          <strong>TRADE-OFF (beat 5):</strong> &quot;Why keyspace notifications vs polling? Redis pub/sub is &lt;1ms vs polling
          every N seconds. Trade-off: requires persistent subscriber daemons (complexity), but instant propagation wins for
          control-plane. Why NULL field in NTP_SERVER? Keyonly table (IP is the config), but Redis HSET needs a field-value
          pair — NULL is the placeholder.&quot;
        </Callout>
        <P>
          That answer took 80 seconds to speak. Interviewer reaction: hire signal. Practice this framework on EVERY question below.
        </P>
      </Section>

      {/* 02 */}
      <Section id="beginner" number="02" title="Beginner Questions (25) ⭐">
        <Table
          head={["#", "Question", "Strong answer"]}
          rows={[
            ["1", "What is SONiC?", "Software for Open Networking in the Cloud — Linux-based NOS running on commodity switches (Broadcom, Mellanox, Barefoot ASICs). Disaggregates hardware from software, uses containers (database, swss, bgp, syncd), and exposes northbound APIs (REST, gNMI, KLISH CLI)."],
            ["2", "What is SAI?", "Switch Abstraction Interface — C API that abstracts ASIC-specific SDKs. orchagent writes to SAI (sai_route_api, sai_port_api), syncd translates to vendor SDK (Broadcom SAI → opennsl, Mellanox SAI → SX SDK). Lets one SONiC codebase run on multiple chipsets."],
            ["3", "List the core SONiC containers.", "database (Redis 6 DBs), swss (orchagent+syncd), bgp (FRR), teamd (LAG), lldp, snmp, telemetry, radv, dhcp_relay, mgmt-framework (REST+gNMI). docker ps shows them all."],
            ["4", "What is CONFIG_DB?", "Redis DB 4. Stores intended configuration (user-facing config). Key format: TABLE|key with HSET fields. Example: VLAN|Vlan100 has vlanid=100. Written by mgmt-framework, read by orchagent + host daemons."],
            ["5", "What are the 6 Redis DBs?", "0=APPL_DB, 1=ASIC_DB, 2=COUNTERS_DB, 3=(reserved), 4=CONFIG_DB, 5=STATE_DB, 6=SNMP_OVERLAY_DB (historical; modern uses 0-5)."],
            ["6", "Explain key separators: | vs :", "Pipe | separates table from key (CONFIG_DB: NTP_SERVER|10.1.1.1). Colon : separates key parts (APPL_DB: ROUTE_TABLE:10.0.0.0/24). Transformers and orchagent enforce these conventions."],
            ["7", "How do you inspect CONFIG_DB?", "redis-cli -n 4 KEYS * (all keys), redis-cli -n 4 HGETALL 'TABLE|key' (one entry), show runningconfiguration all (KLISH), config save → cat /etc/sonic/config_db.json (persisted JSON)."],
            ["8", "What is YANG in SONiC?", "YANG models define schemas. OpenConfig YANG = northbound API paths (REST/gNMI). SONiC YANG = CONFIG_DB schema + CVL validation rules. Two models, bridged by transformer annotations."],
            ["9", "OpenConfig vs SONiC YANG?", "OpenConfig: vendor-neutral, /openconfig-interfaces:interfaces/interface, industry-standard. SONiC YANG: implementation-specific, sonic-port.yang → PORT table, CVL enforces. Translib maps OC to SONiC."],
            ["10", "What is RESTCONF?", "IETF standard (RFC 8040) for YANG-based REST APIs. SONiC mgmt-framework exposes /restconf/data/{yang-path}. Supports GET (read), PATCH (update), POST (create), DELETE. Uses HTTP + JSON/XML."],
            ["11", "What is gNMI?", "gRPC Network Management Interface (OpenConfig standard). Supports Get (read), Set (write), Subscribe (streaming telemetry). SONiC gNMI server (port 8080) shares translib backend with REST. Preferred for automation."],
            ["12", "What is KLISH?", "Cisco-like CLI shell in SONiC. SSH to switch → KLISH prompt. Commands (configure terminal, show running-config) internally call REST API via actioner scripts. User-friendly wrapper over mgmt-framework."],
            ["13", "What does 'config save' do?", "Persists CONFIG_DB (Redis DB 4) to /etc/sonic/config_db.json. Without this, changes are lost on reboot. config reload loads the JSON back into Redis. Always save after changes in production."],
            ["14", "What are 'show' commands?", "KLISH/CLI read-only commands (show interfaces status, show ip bgp summary, show ntp). Backend: transformer GET paths query APPL_DB/STATE_DB, return ygot-serialized JSON → CLI formats as table. No DB writes."],
            ["15", "What is orchagent?", "Orchestration agent (C++, in swss container). Subscribes to APPL_DB (ProducerStateTable writes), translates to SAI calls (sai_create_route_entry), writes results to ASIC_DB. Core dataplane config daemon."],
            ["16", "What is syncd?", "Syncd (sync daemon) reads ASIC_DB, calls vendor SAI library (libsai.so). Translates ASIC_DB entries to hardware: ASIC_DB ROUTE_ENTRY → sai_route_api→create → Broadcom SDK → ASIC registers. Bridges Redis ↔ silicon."],
            ["17", "Explain APPL_DB vs CONFIG_DB.", "CONFIG_DB (DB 4) = intended config, written by mgmt-framework, human-friendly (VLAN|Vlan100). APPL_DB (DB 0) = operational state + orchagent input, written by host services (routeorch writes ROUTE_TABLE:prefix). orchagent reads APPL_DB, ignores CONFIG_DB."],
            ["18", "What is STATE_DB?", "Redis DB 5. Read-only runtime state (not config). Example: TRANSCEIVER_INFO (SFP details), PORT_TABLE (oper status up/down). Populated by pmon (platform monitor), read by show commands + telemetry. GET-only from northbound."],
            ["19", "What is a transformer?", "Go code in sonic-mgmt-common/translib/transformer. Maps OpenConfig YANG paths to SONiC CONFIG_DB tables. Key transformers convert OC keys to Redis keys. Field transformers map OC leaf names to SONiC field names. Subtree transformers handle complex restructuring."],
            ["20", "What is CVL?", "Config Validation Library (libyang-based, in Go). Validates all CONFIG_DB writes against SONiC YANG models BEFORE Redis write. Checks syntax (types, patterns), semantics (must statements), dependencies (leafrefs). Returns CVLErrorInfo on failure → HTTP 400."],
            ["21", "What is translib?", "Transaction library (sonic-mgmt-common/translib). Go framework that routes northbound requests (REST/gNMI) to app modules. common_app handles annotated OpenConfig paths. Calls transformer → CVL → Redis write → returns success/error."],
            ["22", "Repo: sonic-mgmt-framework", "Container mgmt-framework runs REST server (port 443), gNMI server (port 8080), translib. Handles all northbound API traffic. Depends on sonic-mgmt-common (translib, CVL, transformer)."],
            ["23", "Repo: sonic-buildimage", "Top-level build repo. Submodules include sonic-swss, sonic-sairedis, FRR. make target/sonic-broadcom.bin builds entire SONiC image. Contains docker/ for container definitions, files/ for config templates."],
            ["24", "What is ygot?", "YANG Go Tools — code generator. Compiles OpenConfig YANG to Go structs (ocbinds package). REST server unmarshals JSON to ygot structs, translib reads struct fields. Auto-generated, do not hand-edit."],
            ["25", "What is sonic-cfggen?", "Python script (sonic-buildimage/src/sonic-config-engine). Renders Jinja2 templates using CONFIG_DB as context. Example: sonic-cfggen -d -t chrony.conf.j2 → /etc/chrony/chrony.conf. Used by hostcfgd for daemon configs."],
          ]}
        />
      </Section>

      {/* 03 */}
      <Section id="intermediate" number="03" title="Intermediate Questions (25) ⭐">
        <Table
          head={["#", "Question", "Strong answer"]}
          rows={[
            ["26", "What is translib's role?", "Translib is the routing + transaction layer. It receives REST/gNMI requests, dispatches to app modules (common_app for annotated paths, app-specific for custom handlers like ACL app), orchestrates transformer (OC→SONiC map), CVL (validation), and Redis write. Returns unified error codes."],
            ["27", "Transformer vs hand-written apps?", "Transformer (common_app) is generic — works for any table with annotations (NTP, SYSLOG, VLAN_MEMBER). Hand-written apps (e.g., ACL app, BGP app) have complex logic (multi-table transactions, stateful validation). Use transformer for simple tables, custom app for complex features."],
            ["28", "What is an annotation?", "YANG deviation in *-annot.yang files (e.g., openconfig-system-annot.yang). Declares sonic-ext:table-name, key-transformer, field-transformer, subtree-transformer. Tells translib how to map OpenConfig path to CONFIG_DB. Without annotation, common_app can't handle the path."],
            ["29", "CVL's three validation layers?", "1) Syntax: types, patterns, ranges (inet:ip-address, uint16, string length). 2) Semantics: must statements, when conditions (e.g., must 'vlan exists' before adding member). 3) Dependencies: leafref checks (reference must exist in another table). All checked before CONFIG_DB write."],
            ["30", "What is a leafref?", "YANG type that references another leaf (like a foreign key). Example: VLAN_MEMBER's vlan field is leafref to VLAN table's vlanid. CVL validates referenced VLAN exists when you create a member. Delete VLAN with members → CVL returns dependency error."],
            ["31", "What are keyspace notifications?", "Redis pub/sub feature. CONFIG_DB writes (HSET, DEL) publish events to __keyspace@4__:TABLE|key channel. SubscriberStateTable (swsscommon) subscribes, delivers events to daemons (hostcfgd, orchagent). Enables event-driven config propagation, <1ms latency."],
            ["32", "What is hostcfgd?", "Python daemon (sonic-host-services). Subscribes to CONFIG_DB tables (NTP_SERVER, SYSLOG_SERVER, TACPLUS, etc.). On keyspace event, handlers re-render Jinja2 templates (chrony.conf, rsyslog.conf, pam config) and restart services. Host config orchestrator."],
            ["33", "Jinja2 in SONiC — what for?", "Template engine for daemon configs. Templates live in /usr/share/sonic/templates/. sonic-cfggen -d -t template.j2 pulls CONFIG_DB context, renders {{variables}} and {% for %} loops. Output written to /etc/, then daemon restarted. Keeps configs in sync with CONFIG_DB."],
            ["34", "APPL_DB write flow (not config)?", "Example: FRR bgpd learns route → zebra writes to APPL_DB ROUTE_TABLE:prefix via swsscommon ProducerStateTable → routeorch (C++ in swss) ConsumerStateTable pops entry → orchagent calls sai_create_route_entry → syncd → ASIC. Dataplane flow, bypasses CONFIG_DB."],
            ["35", "CONFIG_DB → APPL_DB — how?", "Two-phase: 1) mgmt-framework writes CONFIG_DB. 2) Config daemons (intfmgrd, vlanmgrd, portmgrd — C++ in swss) subscribe to CONFIG_DB, translate to APPL_DB. Example: CONFIG_DB VLAN|Vlan100 → vlanmgrd writes APPL_DB VLAN_TABLE:Vlan100 → orchagent reads APPL_DB. Decouples northbound API from orchagent."],
            ["36", "What is intfmgrd?", "Interface manager daemon (C++, swss). Subscribes CONFIG_DB INTERFACE table, writes APPL_DB INTF_TABLE. Example: CONFIG_DB INTERFACE|Ethernet0|10.0.0.1/24 → intfmgrd → APPL_DB INTF_TABLE:Ethernet0:10.0.0.1/24 → intfsorch → SAI creates IP2ME route."],
            ["37", "What is vlanmgrd?", "VLAN manager (C++, swss). CONFIG_DB VLAN|Vlan100 → APPL_DB VLAN_TABLE:Vlan100. CONFIG_DB VLAN_MEMBER|Vlan100|Ethernet4 → APPL_DB VLAN_MEMBER_TABLE:Vlan100:Ethernet4 → vlanorch calls sai_create_vlan_member. Handles tagged/untagged logic."],
            ["38", "Two-phase translate (config mgrs)?", "Phase 1: mgmt-framework writes CONFIG_DB (user intent). Phase 2: config managers (intfmgrd, vlanmgrd, portmgrd) translate CONFIG_DB → APPL_DB (orchagent input). orchagent is decoupled from northbound API changes — only reads APPL_DB. Design pattern for extensibility."],
            ["39", "What is ygot/ocbinds?", "ygot compiles OpenConfig YANG to Go structs (package ocbinds). Example: OpenconfigInterfaces_Interfaces_Interface_Config struct has Name, Type, Mtu fields. REST server unmarshals JSON payload to these structs, translib reads fields. Strongly-typed, compile-time checked."],
            ["40", "FEATURE table in CONFIG_DB?", "Defines which features/containers run. Keys: swss, bgp, teamd, mgmt-framework. Fields: state (enabled/disabled), auto_restart (true/false). hostcfgd reads this, calls systemctl enable/disable for docker-{feature}. Controls container lifecycle."],
            ["41", "SubscriberStateTable vs ProducerStateTable?", "swsscommon classes. Producer writes to Redis (ProducerStateTable.set(key, fields)). Subscriber reads keyspace events (SubscriberStateTable.pops()). Example: intfmgrd subscribes CONFIG_DB (Consumer), writes APPL_DB (Producer). orchagent subscribes APPL_DB, writes ASIC_DB."],
            ["42", "gNMI Subscribe vs GET?", "GET: one-time read (like REST GET). Subscribe: streaming (STREAM mode = push updates on change, ONCE = dump then close, POLL = on-demand). SONiC gNMI server uses Redis keyspace events for ON_CHANGE updates. Telemetry clients use Subscribe for real-time monitoring."],
            ["43", "What is sonic-utilities?", "Python CLI tools repo. Contains 'config' command (config vlan add, config interface ip add) and 'show' commands (show vlan brief). These scripts call KLISH actioner or directly manipulate CONFIG_DB via swsscommon. User-facing CLI, not daemon code."],
            ["44", "What is swsscommon?", "C++ library (sonic-swss-common). Provides Redis wrappers (Table, ProducerStateTable, ConsumerStateTable, SubscriberStateTable), schema, logger. Every daemon (orchagent, vlanmgrd, hostcfgd Python bindings) uses swsscommon to talk to Redis. Core SONiC library."],
            ["45", "Redis transaction — MULTI/EXEC?", "SONiC uses Redis transactions for atomic multi-key writes. Example: create VLAN + 3 members in one transaction (MULTI, HSET VLAN|X, HSET MEMBER|X|p1, HSET MEMBER|X|p2, EXEC). Ensures all-or-nothing. CVL validates entire transaction before EXEC."],
            ["46", "How does CVL check dependencies against live DB?", "CVL opens a Redis connection, queries existing keys when validating leafrefs and must statements. Example: adding VLAN_MEMBER, CVL does redis-cli -n 4 EXISTS VLAN|Vlan100. If missing, validation fails with CVL_SEMANTIC_DEPENDENT_DATA_MISSING. Checks happen in ValidateEditConfig call."],
            ["47", "Transformer key-transformer signature?", "func(args XfmrParams) (string, error). Receives ygot struct in args.ygotTarget, extracts key fields, returns Redis key string. Example: ntp_server_key_xfmr extracts address field, validates IP format, returns '10.1.1.1'. Reverse: KeyXfmrDbToYang(args) returns map[string]interface{} for GET."],
            ["48", "Subtree transformer — when needed?", "When OC structure doesn't map 1:1 to SONiC tables. Example: OpenConfig ACL has rules as a list; SONiC uses ACL_RULE|table|seq keys. Subtree xfmr iterates OC list, generates multiple Redis keys. Also for aggregation (multiple SONiC tables → one OC subtree in GET)."],
            ["49", "CVL error codes — name 3", "CVL_SUCCESS (validation passed), CVL_SYNTAX_INVALID_VALUE (type/pattern mismatch, e.g., 999.1.1.1 for IP), CVL_SEMANTIC_DEPENDENT_DATA_MISSING (leafref target doesn't exist), CVL_SEMANTIC_KEY_ALREADY_EXIST (duplicate key on CREATE). Translib maps these to HTTP 400/409."],
            ["50", "Locking in translib?", "Translib acquires a Redis lock (SETNX) per table during writes to prevent concurrent modification races. Example: two clients PATCH same VLAN → first locks, writes, unlocks; second waits. Timeout: 30s. Lock key: _config_lock_{table}. Prevents split-brain CONFIG_DB corruption."],
          ]}
        />
      </Section>

      {/* 04 */}
      <Section id="advanced" number="04" title="Advanced Questions (25)">
        <Table
          head={["#", "Question", "Strong answer"]}
          rows={[
            ["51", "Key xfmr signatures — YangToDb vs DbToYang", "YangToDb: func(XfmrParams) (string, error) — args.ygotTarget is OC struct, return Redis key. DbToYang (reverse for GET): func(XfmrParams) (map[string]interface{}, error) — args.key is Redis key, return OC key components as map. Bidirectional mapping for CRUD."],
            ["52", "Subtree xfmr — when NOT to use?", "Avoid for simple 1:1 mappings (use field annotations). Subtree xfmrs add complexity: custom Go code (bug surface), harder to debug (can't trace via annotation alone). Use only when OC list ↔ multiple SONiC keys OR aggregation across tables. Most features DON'T need subtree."],
            ["53", "CVL checks against live DB — race?", "Translib locks the table before CVL validation, holds lock through Redis write. Between CVL check (EXISTS key) and HSET, no other writer can modify. If CVL validated but another process deleted the dependency before lock, EXEC fails → translib returns 500. Rare, requires tight timing."],
            ["54", "Transaction MULTI/EXEC — rollback?", "Redis MULTI/EXEC is atomic BUT no rollback on app-level failure. If orchagent fails to apply ASIC_DB entry (SAI error), the CONFIG_DB write already committed. SONiC has no distributed transaction across Redis + ASIC. Recovery: user must DELETE the bad config. This is a known design trade-off."],
            ["55", "CVL error → HTTP status code mapping?", "CVL_SYNTAX_* → 400 Bad Request. CVL_SEMANTIC_KEY_ALREADY_EXIST → 409 Conflict. CVL_SEMANTIC_DEPENDENT_DATA_MISSING → 400 (some map to 424 Failed Dependency, inconsistent). Translib maps CVLErrorInfo.ErrCode to ietf-restconf:errors JSON. Check mgmt-framework/translib/common_app.go for table."],
            ["56", "Annotation db-name — what for?", "sonic-ext:db-name 'STATE_DB' or 'COUNTERS_DB' on GET-only paths. Example: /interfaces/interface/state/counters → annotated with db-name='COUNTERS_DB', table-name='COUNTERS_PORT_NAME_MAP'. Transformer queries DB 2 instead of CONFIG_DB. For read-only operational data."],
            ["57", "GET depth and content query params?", "RESTCONF params: depth=N (limit tree depth, 1=direct children), content=config|nonconfig|all (filter config vs state leaves). SONiC REST supports these. Example: GET /interfaces?depth=1&content=config. Transformer logic honors depth by pruning ygot tree before serialization."],
            ["58", "Table transformer — PORT vs PORTCHANNEL?", "Single OC path /interfaces/interface can map to multiple SONiC tables. Table transformer (e.g., intf_table_xfmr) inspects interface type: if name matches Ethernet* → PORT table, PortChannel* → PORTCHANNEL, Vlan* → VLAN. Dynamic routing to different Redis tables based on key pattern."],
            ["59", "Annotation NULL field trick?", "For keyonly tables (NTP_SERVER, SYSLOG_SERVER), annotation declares field-name='NULL' for the OC leaf. Transformer writes {\"NULL\":\"NULL\"} to Redis (satisfies HSET requirement). Template {% for server in NTP_SERVER %} iterates keys, ignores NULL field. Hack for Redis data model constraint."],
            ["60", "YANG compile pipeline — .yang to what?", "1) .yang → pyang → .yin (XML intermediate). 2) .yin → ygot generator → Go ocbinds structs (northbound). 3) .yang → CVL libyang → YangNode tree (southbound validation). Build system (sonic-mgmt-common/Makefile) automates this. Output: ocbinds/*.go and CVL schema cache."],
            ["61", "gNMI vs REST — shared backend?", "Yes, both call translib. gNMI server (mgmt-framework/gnmi_server/) translates gnmi.SetRequest to translib.SetRequest, gnmi.GetRequest to translib.Get. Transformer and CVL are shared. Difference: gNMI uses Protobuf (gnmi.TypedValue), REST uses JSON. Same CONFIG_DB writes."],
            ["62", "Translib app vs common_app?", "common_app is generic (annotation-driven, no custom code). App modules (ACL app, BGP app in translib/app_interface.go registry) have custom Init/Get/Set methods. Example: ACL app implements complex rule ordering logic (RULE|table|seq key generation). Use app when annotation can't express logic."],
            ["63", "How to register a new transformer?", "1) Write xfmr function in translib/transformer/xfmr_*.go (e.g., xfmr_system.go). 2) Call XlateFuncBind('xfmr_name', funcPtr) in init(). 3) Reference in annotation: sonic-ext:key-transformer 'xfmr_name'. Build, install CVL schema + ocbinds, restart mgmt-framework. No REST server code change."],
            ["64", "CVL must statement — example?", "sonic-vlan.yang: must statement 'vlanid >= 1 and vlanid <= 4094'. CVL evaluates XPath expression on ValidateEditConfig. If user tries vlanid=5000, CVL returns CVL_SEMANTIC_CONSTRAINT_VIOLATED. Another: must 'tagging_mode = tagged or untagged' (enum validation via must)."],
            ["65", "YANG deviation vs augment?", "deviation (in annot.yang): restricts/replaces base YANG (used for SONiC annotations: deviate add sonic-ext:*). augment: extends base YANG with new nodes (SONiC uses sparingly). Annotations are deviations because they ADD SONiC-specific extensions without modifying upstream OpenConfig repo."],
            ["66", "Translib debug — TRACE_LEVEL?", "Export TRACE_LEVEL=5 before starting REST server (or set in supervisord env). Enables verbose logs: transformer input/output, CVL dbmap, Redis commands. Logs to /var/log/syslog. Example: you'll see 'Transformer: ygot struct: {Address:10.1.1.1}, dbmap: {NTP_SERVER:{10.1.1.1:{NULL:NULL}}}'. Essential for xfmr debugging."],
            ["67", "Transformer cache — what is it?", "Translib maintains an in-process cache of CONFIG_DB reads during a single request to avoid duplicate Redis queries. Example: GET /interfaces reads PORT table once, caches, reuses for all interface entries. Cleared after response. Trade-off: faster GET, but stale if CONFIG_DB changes mid-request (rare)."],
            ["68", "gNMI ON_CHANGE implementation?", "gNMI Subscribe with mode=ON_CHANGE. Server subscribes to Redis keyspace events (psubscribe __keyspace@*__:*), filters by gNMI path, sends gnmi.Notification on HSET/DEL. Challenge: mapping Redis key back to gNMI path (reverse transformer). Implemented for common tables (VLAN, PORT), not all."],
            ["69", "Why CONFIG_DB uses pipe | delimiter?", "Historical: Redis KEYS pattern matching. TABLE|* glob returns all keys for table. Colon : is used in APPL_DB for multi-part keys (ROUTE_TABLE:prefix:nexthop). CONFIG_DB has single-part keys after table, so pipe separates namespace. Inconsistency is technical debt from early SONiC design."],
            ["70", "SONiC warm restart — mgmt impact?", "Warm restart freezes orchagent/syncd, keeps dataplane forwarding, restarts control-plane. CONFIG_DB persists (Redis RDB snapshot). Mgmt-framework container MAY restart (depends on FEATURE table auto_restart). Client connections drop, but config survives. After warm-boot, config reload not needed — already in Redis."],
            ["71", "CVL session — why open/close?", "CVL ValidationSessOpen() creates a libyang context (parses all YANG models, ~50ms overhead). Session holds validation state across multiple ValidateEditConfig calls (e.g., transaction with 10 keys). Close releases memory. One session per translib request. Reusing session across requests = stale schema if models updated."],
            ["72", "Annotation subtree-transformer vs post-transformer?", "subtree-transformer: replaces entire subtree translation (OC tree → dbmap). post-transformer: runs AFTER common_app's default translation, modifies dbmap. Use post- for small tweaks (e.g., add computed field), subtree for full custom logic. post- is less invasive, preferred when possible."],
            ["73", "Error propagation: SAI fail → user?", "SAI failure (e.g., sai_create_route returns error) logged by orchagent, written to syslog. BUT CONFIG_DB write already committed (two-phase: config write, then orchagent apply). User sees HTTP 204 success. Actual failure discovered via 'show' command (state doesn't match config) or syslog. Async error model — known SONiC design issue."],
            ["74", "Translib transaction ID?", "Translib assigns a txid (transaction ID) per request, logs it. Useful for tracing a single request across transformer → CVL → Redis. Grep syslog for txid to see full flow. Not exposed to REST client (internal only). Used for debugging multi-step failures."],
            ["75", "How does transformer handle OC default values?", "ygot structs have pointers for optional leaves (*string, *uint32). If client omits a leaf, pointer is nil. Transformer checks nil, doesn't write field to CONFIG_DB (Redis doesn't support null — omission = default). On GET, transformer reads CONFIG_DB, if field missing, ygot defaults apply (per YANG default statement). Lazy defaults."],
          ]}
        />
      </Section>

      {/* 05 */}
      <Section id="architect" number="05" title="Architect Questions (15)">
        <Table
          head={["#", "Question", "Strong answer"]}
          rows={[
            ["76", "Why DB-centric architecture vs API-first mesh?", "SONiC chose Redis as the central store — all components (mgmt, swss, orchagent, host daemons) read/write DBs. Pros: simple async model (pub/sub), sub-ms latency, no gRPC overhead between daemons. Cons: schema in code (not self-documenting), no distributed transaction, debugging requires Redis inspection. Trade-off: performance + simplicity over strict consistency."],
            ["77", "Why Redis specifically (vs etcd, SQL)?", "Redis: in-memory, <0.5ms GET (critical for orchagent dataplane hot-path reads from APPL_DB). etcd: Raft consensus adds 10-50ms (overkill for single-node switch). SQL: too heavy for key-value schema, requires ORM. Redis pub/sub (keyspace notifications) is core to event-driven design. Downside: no multi-key transactions across tables, no schema enforcement (CVL patches this)."],
            ["78", "SONiC consistency model — what guarantees?", "Eventual consistency. CONFIG_DB write commits immediately, but orchagent applies asynchronously (ms-seconds later). If orchagent crashes mid-apply, CONFIG_DB has intent, ASIC_DB may be incomplete. No rollback. User must reconcile via 'show' commands. Strong consistency would require 2PC (two-phase commit) — SONiC prioritizes availability over strict consistency (AP in CAP theorem)."],
            ["79", "Why OpenConfig northbound + SONiC YANG southbound?", "Decouples vendor-neutral API (OpenConfig — portable across vendors, used by automation) from implementation (SONiC CONFIG_DB schema evolves independently). Allows SONiC to optimize internal tables (e.g., split PORT vs PORTCHANNEL) without breaking northbound contracts. Transformer absorbs impedance mismatch. Dual model = flexibility at cost of translation complexity."],
            ["80", "CVL placement — why in translib, not Redis?", "CVL validates BEFORE Redis write (pre-flight gate). If validation was post-write (e.g., Redis module trigger), invalid data would briefly exist in CONFIG_DB → orchagent might read it → race. Pre-write validation ensures CONFIG_DB is always valid. Trade-off: translib has schema knowledge (tighter coupling), but safer than relying on external validator."],
            ["81", "Upgrade/rollback — mgmt-framework impact?", "Image upgrade (sonic_installer install) may have new YANG models, annotations, transformers. After upgrade, config reload applies old config_db.json to new schema. Risk: old keys deprecated (transformer ignores), new mandatory fields missing (CVL rejects → boot fails). Mitigation: config migration scripts, backward-compat annotations. Rollback: boot old image, old schema. No automated config migration in SONiC (manual)."],
            ["82", "Scaling gNMI subscriptions — 100 clients?", "Each gNMI Subscribe client holds a goroutine + Redis psubscribe. 100 clients = 100 Redis connections, 100 keyspace subscriptions. Redis handles this (tested to 10K connections), but CPU cost: every CONFIG_DB write fires 100 notifications. Bottleneck: transformer reverse-xfmr CPU (mapping Redis key → gNMI path for each client). Mitigation: use SAMPLE mode (periodic) instead of ON_CHANGE, or aggregate clients via telemetry proxy."],
            ["83", "Security surface — PAM, TLS, RBAC?", "REST/gNMI require HTTPS (TLS 1.2+), client certs optional (mutual TLS supported). Auth: PAM (Linux users, TACACS+ backend via hostcfgd-generated pam.d config). RBAC: YANG-based (sonic-ext:rbac-role annotation — under development, not fully enforced). Attack surface: mgmt-framework container exposed to network, CVL bugs = code exec. Hardening: restrict mgmt VRF, fail2ban, audit logs."],
            ["84", "Design a new feature — steps?", "1) Upstream OpenConfig YANG (if exists) or define custom. 2) SONiC YANG for CONFIG_DB schema. 3) Annotation (table-name, key-xfmr). 4) Transformer xfmr functions. 5) CVL must/leafref. 6) Config daemon (hostcfgd handler or new C++ mgrd) subscribes CONFIG_DB, writes APPL_DB or renders template. 7) Orchagent orch (if dataplane change). 8) Unit tests (translib tests, CVL tests). 9) sonic-mgmt integration test. 10) PR to 4 repos (mgmt-common, mgmt-framework, buildimage, swss)."],
            ["85", "Technical debt — subtree transformers?", "Subtree xfmrs are powerful but: 1) Custom Go code = bugs (crash = mgmt-framework down). 2) Hard to debug (opaque translation, can't inspect via annotation). 3) Tight coupling (xfmr embeds CONFIG_DB schema knowledge). Better: push complexity to YANG (use OC extensions) or config daemons. Debt: many subtree xfmrs (ACL, QoS) that should be refactored to table xfmrs + post-processing. Migration cost high."],
            ["86", "Why not GraphQL / gRPC for northbound?", "RESTCONF + gNMI are industry standards (OpenConfig, IETF). GraphQL = custom schema (non-standard). gRPC for config writes = no YANG enforcement (Protobuf ≠ YANG). SONiC prioritizes interoperability (multi-vendor automation). Trade-off: RESTCONF is verbose (XML/JSON + HTTP overhead vs binary gRPC), but tooling ecosystem (Ansible, Terraform providers) expects REST. gNMI is gRPC-based, covers perf-sensitive telemetry."],
            ["87", "Multi-tenancy in CONFIG_DB?", "None. CONFIG_DB is global per switch. No namespace isolation (unlike k8s). RBAC can restrict which users modify which tables, but all config shares one Redis instance. Multi-ASIC switches have separate CONFIG_DBs per ASIC namespace (docker netns), but that's hardware multi-instance, not tenant isolation. Not designed for multi-tenant (SONiC targets single-admin switches)."],
            ["88", "Failure domains — mgmt-framework crash?", "If mgmt-framework container crashes: REST/gNMI APIs down (can't configure), but dataplane unaffected (orchagent, syncd, bgp run independently). CONFIG_DB persists (Redis in database container). KLISH may still work (if it's CLI-only mode, not REST-backed). Auto-restart: FEATURE table auto_restart=true → supervisord restarts container in ~5s. Impact: brief config API outage, no traffic loss."],
            ["89", "Why Jinja2 templates vs code-generated configs?", "Jinja2: 1) Human-readable templates (ops can audit /usr/share/sonic/templates/). 2) No recompile to change format (edit .j2, restart daemon). 3) Familiar to Python/Ansible users. Cons: runtime errors (UndefinedError if CONFIG_DB missing key), no type safety, testing requires end-to-end render. Alternative (code-gen in Go/C++): type-safe, but opaque to ops. SONiC prioritizes operational transparency."],
            ["90", "How would you improve SONiC mgmt today?", "1) Transactional semantics: rollback on orchagent SAI failure (requires 2PC or intent/status split). 2) Unified schema: merge OC + SONiC YANG (eliminate transformer). 3) Telemetry-first: gNMI Subscribe as primary API, deprecate KLISH (reduce surface). 4) Formal migration tool: config_db.json v1 → v2 with schema diffs. 5) CVL perf: cache validation results for idempotent writes. All have trade-offs (complexity, backward compat). Prioritize based on prod pain (e.g., rollback > schema merge)."],
          ]}
        />
      </Section>

      {/* 06 */}
      <Section id="scenarios" number="06" title="Debugging Scenarios (8) ⭐">
        <P>
          Each scenario: situation → diagnosis path → root cause → the proof command.
        </P>

        <Callout type="note">
          <strong>Scenario 1: REST 204 OK but chrony.conf unchanged</strong><br />
          Situation: You PATCH /openconfig-system:system/ntp/servers/server=10.1.1.1/config, get HTTP 204 No Content (success), but
          /etc/chrony/chrony.conf has no line for 10.1.1.1. chronyd not syncing.<br />
          Diagnosis: CONFIG_DB write succeeded (REST 204), but hostcfgd didn&apos;t re-render template. Check hostcfgd logs.<br />
          Root cause: hostcfgd crashed or NtpCfg subscriber not registered. Or sonic-cfggen UndefinedError (template refs missing var).<br />
          Proof: <IC>journalctl -u hostcfgd -n 50 | grep NTP</IC> shows no &quot;NTP_SERVER SET&quot; log → hostcfgd didn&apos;t see event.
          Check <IC>systemctl status hostcfgd</IC> → active? If crashed, restart fixes. If running but no log → subscriber bug.
        </Callout>

        <Callout type="note">
          <strong>Scenario 2: 400 Bad Request on valid-looking VLAN payload</strong><br />
          Situation: PATCH /openconfig-network-instance:network-instances/network-instance=Vlan100 with valid JSON → 400 error:
          &quot;invalid-value&quot;. VLAN 100 is valid (1-4094 range).<br />
          Diagnosis: CVL rejected. Check error message details (ietf-restconf:errors JSON) for field name and constraint.<br />
          Root cause: CVL error message says &quot;vlanid must be unique&quot; → VLAN|Vlan100 already exists in CONFIG_DB (duplicate key).
          CVL OP_CREATE on existing key → CVL_SEMANTIC_KEY_ALREADY_EXIST.<br />
          Proof: <IC>redis-cli -n 4 KEYS &quot;VLAN|Vlan100&quot;</IC> returns the key. Use DELETE first, or PATCH (update) instead of POST (create).
        </Callout>

        <Callout type="note">
          <strong>Scenario 3: gNMI ON_CHANGE subscription silent after config change</strong><br />
          Situation: gNMI Subscribe with ON_CHANGE to /interfaces/interface, mode=STREAM. You config interface ip add Ethernet0 10.0.0.1/24,
          but no gnmi.Notification received.<br />
          Diagnosis: ON_CHANGE requires Redis keyspace event → gNMI server → path match. Check if table supports ON_CHANGE.<br />
          Root cause: INTERFACE table in CONFIG_DB writes NTP_SERVER|10.1.1.1 (example from earlier). gNMI ON_CHANGE implemented only for
          subset of tables (VLAN, PORT, ACL). INTERFACE may not have reverse-xfmr for gNMI path mapping.<br />
          Proof: Check sonic-mgmt-common/translib/transformer/xfmr_intf.go for Subscribe callback. If missing, ON_CHANGE unsupported.
          Workaround: use SAMPLE mode (periodic poll) or REST GET.
        </Callout>

        <Callout type="note">
          <strong>Scenario 4: mgmt-framework container restart loop</strong><br />
          Situation: After image upgrade, mgmt-framework container crashes every 10 seconds (docker ps shows repeated restarts). REST API down.<br />
          Diagnosis: Check container logs: <IC>docker logs mgmt-framework</IC>.<br />
          Root cause: CVL schema load failure. New SONiC YANG model has syntax error (e.g., missing semicolon, invalid must XPath).
          libyang fails to parse → CVL init panics → Go runtime exits → supervisord restarts container.<br />
          Proof: Log shows &quot;libyang[0]: Module sonic-vlan parsing failed.&quot; Fix: revert YANG file or patch syntax. Image rollback as last resort.
        </Callout>

        <Callout type="note">
          <strong>Scenario 5: config reload lost a feature (syslog servers gone)</strong><br />
          Situation: After <IC>config reload</IC>, all SYSLOG servers missing (<IC>show syslog</IC> empty). Before reload, 3 servers configured.<br />
          Diagnosis: config reload loads /etc/sonic/config_db.json → Redis. Check JSON file.<br />
          Root cause: User ran <IC>config syslog add ...</IC> but never ran <IC>config save</IC>. Changes only in Redis (volatile). Reload
          wiped Redis, restored old JSON (no syslog entries).<br />
          Proof: <IC>cat /etc/sonic/config_db.json | jq .SYSLOG_SERVER</IC> → null or empty. Lesson: ALWAYS config save after changes.
        </Callout>

        <Callout type="note">
          <strong>Scenario 6: CVL passes but orchagent ignores entry</strong><br />
          Situation: config vlan member add Vlan100 Ethernet8 → REST 204, CONFIG_DB has key, CVL passed, but <IC>show vlan brief</IC>
          shows Ethernet8 NOT in Vlan100. Bridge forwarding doesn&apos;t include port.<br />
          Diagnosis: CONFIG_DB write succeeded, but orchagent (vlanorch) didn&apos;t apply. Check APPL_DB and orchagent logs.<br />
          Root cause: vlanmgrd (config daemon) crashed or not running. CONFIG_DB → APPL_DB translation didn&apos;t happen. APPL_DB has no
          VLAN_MEMBER_TABLE:Vlan100:Ethernet8 entry → orchagent never saw it.<br />
          Proof: <IC>redis-cli -n 0 KEYS &quot;VLAN_MEMBER_TABLE:Vlan100:*&quot;</IC> → empty. Check <IC>docker exec -it swss supervisorctl status vlanmgrd</IC>
          → FATAL (crashed). Restart swss container to recover.
        </Callout>

        <Callout type="note">
          <strong>Scenario 7: REST returns 401 Unauthorized after image upgrade</strong><br />
          Situation: curl to REST API worked before upgrade, now returns 401. Username/password unchanged.<br />
          Diagnosis: Auth failure. Check PAM config and user DB.<br />
          Root cause: Image upgrade reset /etc/passwd (local users lost) OR TACACS+ config lost (AAA table missing in config_db.json if
          not saved). mgmt-framework expects Linux user or TACACS+ backend.<br />
          Proof: <IC>id admin</IC> → user exists? <IC>redis-cli -n 4 HGETALL &apos;AAA|authentication&apos;</IC> → login method = tacacs+ but
          TACPLUS_SERVER table empty → no server configured. Fix: re-add TACACS server OR use local user (passwd admin).
        </Callout>

        <Callout type="note">
          <strong>Scenario 8: Key written with wrong delimiter (pipe vs colon)</strong><br />
          Situation: Custom script writes to CONFIG_DB: <IC>redis-cli -n 4 HSET &quot;NTP_SERVER:10.1.1.1&quot; NULL NULL</IC> (note colon).
          show ntp command shows nothing. hostcfgd silent.<br />
          Diagnosis: Key delimiter mismatch. CONFIG_DB uses pipe |, APPL_DB uses colon :.<br />
          Root cause: Script used wrong delimiter. Redis has key NTP_SERVER:10.1.1.1, but hostcfgd subscribes to pattern NTP_SERVER|*.
          Keyspace event fired but pattern didn&apos;t match → subscriber didn&apos;t pop.<br />
          Proof: <IC>redis-cli -n 4 KEYS &quot;NTP_SERVER*&quot;</IC> → shows NTP_SERVER:10.1.1.1. Delete it, rewrite with pipe:
          <IC>DEL &quot;NTP_SERVER:10.1.1.1&quot;</IC>, <IC>HSET &quot;NTP_SERVER|10.1.1.1&quot; NULL NULL</IC>. Lesson: always use pipe in CONFIG_DB.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="rapid-fire" number="07" title="Rapid-Fire Facts (20)">
        <Table
          head={["Fact", "Value"]}
          rows={[
            ["CONFIG_DB number", "Redis DB 4"],
            ["APPL_DB number", "Redis DB 0"],
            ["STATE_DB number", "Redis DB 5"],
            ["COUNTERS_DB number", "Redis DB 2"],
            ["CONFIG_DB delimiter", "TABLE|key (pipe)"],
            ["APPL_DB delimiter", "TABLE:key1:key2 (colon for multi-part)"],
            ["Default REST port", "443 (HTTPS)"],
            ["Default gNMI port", "8080 (gRPC + TLS)"],
            ["Transformer repo", "sonic-mgmt-common/translib/transformer/"],
            ["CVL code location", "sonic-mgmt-common/cvl/"],
            ["Annotation files", "*-annot.yang in sonic-mgmt-common/models/yang/annotations/"],
            ["SONiC YANG location", "sonic-mgmt-common/models/yang/sonic/"],
            ["OpenConfig YANG", "sonic-mgmt-common/models/yang/openconfig/ (submodule)"],
            ["hostcfgd script", "sonic-host-services/scripts/hostcfgd (Python)"],
            ["Jinja2 templates", "/usr/share/sonic/templates/ (chrony/, rsyslog/, etc.)"],
            ["config save output", "/etc/sonic/config_db.json"],
            ["Key xfmr pattern", "XlateFuncBind in init(), signature: func(XfmrParams) (string, error)"],
            ["CVL session open", "cvl.ValidationSessOpen() in Go, defer Close()"],
            ["ygot package", "github.com/openconfig/ygot/ygot + ocbinds generated structs"],
            ["orchagent location", "sonic-swss/orchagent/ (C++, in swss container)"],
          ]}
        />
      </Section>

      {/* 08 */}
      <Section id="day-prep" number="08" title="48-Hour Interview Prep">
        <P>
          Two days before your SONiC interview, run this checklist:
        </P>
        <CodeBlock
          title="48h_prep_checklist.txt"
          runnable={false}
          code={`DAY 1 (evening before interview):
 1. RE-TRACE the NTP flow on a SONiC VM (GNS3 or virtual switch):
    config ntp add 10.1.1.1, verify all 9 hops (§12 of NTP flow page).
    Capture the redis-cli, journalctl, chronyc outputs — have them READY.
 2. RE-READ xfmr_intf.go or xfmr_system.go (pick one transformer file).
    Understand one key-xfmr function deeply — be ready to whiteboard it.
 3. PRACTICE the answer framework ALOUD: pick 3 questions from §02-§05,
    speak the 5-beat answer (layers→artifacts→flow→debug→trade-offs).
    Time yourself — 90 seconds per answer.
 4. RE-MEMORIZE the rapid-fire table (§07): DB numbers, file paths,
    delimiters. Interviewer WILL ask "what's CONFIG_DB?" — instant answer.

DAY 2 (morning of interview):
 5. REVIEW the 8 debugging scenarios (§06). Read each root cause aloud.
    Interviewer loves "tell me about a time you debugged X" — scenarios
    are your war stories (even if you haven't hit them, you STUDIED them).
 6. SKIM the architect questions (§05) — you won't memorize answers, but
    RECOGNIZE the themes (why Redis? why dual YANG? trade-offs). Shows
    you think about design, not just mechanics.
 7. DRY-RUN: stand in front of mirror, answer "walk me through config
    vlan add" using the framework. If you stumble, you're not ready.
 8. PRINT or screenshot the verification table (§11 of NTP flow page) —
    hop-by-hop debug commands. Glance at it 10 min before interview.

1 HOUR BEFORE:
 9. CALM: you've traced real flows, read real code, practiced real answers.
    You're in the top 5% of SONiC candidates (most have only read docs).
10. MINDSET: "I've BUILT this" (even if in a lab, you RAN the commands).
    Confidence shows. Let's go. 🎯`}
        />
        <Callout type="mistake">
          <strong>Red flags interviewers watch for:</strong>
          <ul>
            <li>Vague answers with no file names / table names (sounds like you read a blog, didn&apos;t touch code).</li>
            <li>Can&apos;t name verification commands (you don&apos;t operationalize knowledge).</li>
            <li>Describing flows but skipping CVL (the validation layer is CRITICAL — omitting it = incomplete understanding).</li>
            <li>Confusing CONFIG_DB vs APPL_DB (shows surface-level grasp of architecture).</li>
            <li>Saying &quot;it just updates the config&quot; without naming the daemon (hostcfgd, vlanmgrd, intfmgrd — NAME THEM).</li>
          </ul>
          Fix: use the 5-beat framework on EVERY answer. Interviewers will notice the structure.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="lab" number="09" title="Mock Interview Lab">
        <P>
          Record yourself (phone video or audio) answering these 5 questions using the framework. Then self-score with the rubric.
        </P>
        <CodeBlock
          title="5_mock_questions.txt"
          runnable={false}
          code={`Q1. What happens when you run 'config vlan add 100'? (beginner)
Q2. How does CVL prevent invalid config from reaching the dataplane? (intermediate)
Q3. Explain the difference between a key transformer and a subtree transformer. (advanced)
Q4. Why does SONiC use Redis instead of etcd or a SQL database? (architect)
Q5. You PATCH an interface IP via REST, get 204 OK, but 'show ip interfaces'
    doesn't show it. Walk me through your debugging steps. (scenario)

RULES:
- Speak aloud (not just think). Pretend interviewer is in the room.
- Time limit: 90 seconds per question (set a timer).
- Use the 5-beat framework (layers, artifacts, flow, debug, trade-offs).
  Not every question needs all 5, but hit at least 3.`}
        />
        <Table
          head={["Rubric", "Weak (1-2)", "Good (3-4)", "Strong (5)"]}
          rows={[
            ["Beat 1: Layers", "Vague ('the system processes it')", "Names 2-3 layers (REST, Redis, daemon)", "Names full stack + role of each (northbound/middleware/southbound/orch)"],
            ["Beat 2: Artifacts", "No file/table names", "1-2 names (CONFIG_DB, mgmt-framework)", "3+ specific names (VLAN|Vlan100, vlanmgrd, sonic-vlan.yang, CVL)"],
            ["Beat 3: Flow", "Surface only ('updates DB, restarts')", "Describes 4-5 hops with some detail", "End-to-end 9-hop trace with technical terms (ygot, xfmr, HSET, keyspace event)"],
            ["Beat 4: Debug", "No commands ('check logs')", "1-2 commands (journalctl, redis-cli)", "4+ hop-specific commands (redis-cli HGETALL, journalctl -u X | grep Y, show cmd)"],
            ["Beat 5: Trade-offs", "Skipped or 'it's better'", "One trade-off mentioned (speed vs complexity)", "Design rationale + failure mode (why this choice, what breaks, alternatives)"],
          ]}
        />
        <P>
          Score yourself 1-5 on each beat per question. Total 25 per question. Target: 20+ = strong hire signal. 15-19 = good, polish beats 2&4. &lt;15 = re-practice with notes.
        </P>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["5-beat framework", "layers → artifacts → flow → debug → trade-offs (every strong answer)"],
            ["DB numbers", "CONFIG_DB=4, APPL_DB=0, STATE_DB=5, COUNTERS_DB=2"],
            ["Delimiters", "CONFIG_DB: TABLE|key (pipe), APPL_DB: TABLE:key (colon)"],
            ["9-hop NTP flow", "REST→ygot→translib→CVL→Redis→hostcfgd→Jinja2→chronyd→verify"],
            ["CVL validates", "BEFORE Redis write — syntax, must, leafref — rejects 999.1.1.1"],
            ["Transformer types", "key-xfmr (OC key→Redis key), field-xfmr (leaf map), subtree-xfmr (full subtree)"],
            ["Annotation location", "sonic-mgmt-common/models/yang/annotations/*-annot.yang"],
            ["hostcfgd role", "Subscribes CONFIG_DB, renders Jinja2, restarts daemons (host config orch)"],
            ["ygot/ocbinds", "Auto-gen Go structs from OC YANG, REST unmarshals JSON to these structs"],
            ["Config vs APPL", "CONFIG_DB=intent (mgmt writes), APPL_DB=orch input (config daemons translate)"],
            ["Debug scenario pattern", "In Redis? → File updated? → Daemon reloaded? → Network reachable? (4-step triage)"],
            ["Red flag: vague", "No file names, no commands, no CVL mention = sounds like blog reading, not building"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
