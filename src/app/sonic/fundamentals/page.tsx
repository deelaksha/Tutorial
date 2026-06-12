"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "How a config change travels through SONiC",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "CLI / REST / gNMI", x: 6, y: 50, color: "#22d3ee" },
    { id: "mgmt", icon: "🧭", label: "Mgmt Framework", sub: "REST · gNMI · CLI", x: 24, y: 22, color: "#a78bfa" },
    { id: "configdb", icon: "🗄️", label: "CONFIG_DB", sub: "redis n4", x: 42, y: 50, color: "#fbbf24" },
    { id: "orch", icon: "⚙️", label: "Orchagent", sub: "swss container", x: 60, y: 22, color: "#34d399" },
    { id: "asicdb", icon: "🧬", label: "ASIC_DB", sub: "redis n1", x: 60, y: 72, color: "#fb923c" },
    { id: "syncd", icon: "🔌", label: "syncd + SAI", sub: "hardware layer", x: 78, y: 50, color: "#60a5fa" },
    { id: "asic", icon: "💎", label: "ASIC", sub: "hardware", x: 93, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "user-mgmt", from: "user", to: "mgmt", color: "#a78bfa" },
    { id: "mgmt-config", from: "mgmt", to: "configdb", color: "#fbbf24" },
    { id: "config-orch", from: "configdb", to: "orch", color: "#34d399" },
    { id: "orch-asicdb", from: "orch", to: "asicdb", color: "#fb923c" },
    { id: "asicdb-syncd", from: "asicdb", to: "syncd", color: "#60a5fa" },
    { id: "syncd-asic", from: "syncd", to: "asic", color: "#f472b6" },
    { id: "syncd-error", from: "syncd", to: "orch", bend: -30, dashed: true, color: "#f87171" },
    { id: "asic-mgmt", from: "asic", to: "mgmt", bend: 40, dashed: true, color: "#22d3ee" },
  ],
  flows: [
    {
      id: "create-vlan",
      name: "🌐 Create VLAN 100",
      command: "config vlan add 100",
      steps: [
        { node: "user", paths: ["user-mgmt"], text: "User issues CLI command: config vlan add 100. KLISH CLI is just a wrapper — it converts this to a REST call to the management framework." },
        { node: "mgmt", paths: ["mgmt-config"], text: "Mgmt Framework (REST server) validates via CVL (Config Validation Library), runs transformers, writes to CONFIG_DB redis." },
        { node: "configdb", paths: ["config-orch"], text: "CONFIG_DB (redis n=4) now has VLAN|Vlan100 entry. Orchagent subscribes via keyspace notifications and wakes up." },
        { node: "orch", paths: ["orch-asicdb"], text: "Orchagent processes the VLAN intent, creates SAI_OBJECT_TYPE_VLAN with SAI attributes, writes oid:0x26000000000xyz to ASIC_DB." },
        { node: "asicdb", paths: ["asicdb-syncd"], text: "ASIC_DB (n=1) holds SAI object representation. syncd consumes it via ProducerStateTable/ConsumerStateTable pattern." },
        { node: "syncd", paths: ["syncd-asic"], text: "syncd calls vendor libsai.so → sai_vlan_api->create_vlan(). The vendor SAI implementation programs the ASIC hardware registers." },
        { node: "asic", paths: [], text: "ASIC hardware now has VLAN 100 configured in silicon. Packets tagged 100 will be switched correctly. Config→Hardware journey complete. ✅" },
      ],
    },
    {
      id: "sai-failure",
      name: "❌ SAI failure path",
      command: "hardware resource exhausted",
      steps: [
        { node: "orch", paths: ["orch-asicdb"], text: "Orchagent attempts to create a new route, writes SAI_OBJECT_TYPE_ROUTE entry to ASIC_DB." },
        { node: "syncd", paths: ["asicdb-syncd"], text: "syncd reads the request, calls sai_route_api->create_route_entry(). Vendor SAI returns SAI_STATUS_TABLE_FULL — TCAM exhausted." },
        { node: "syncd", paths: ["syncd-error"], text: "syncd logs ERROR to syslog: 'SAI_STATUS_TABLE_FULL for route 10.1.1.0/24', sends error response back to orchagent via redis response queue." },
        { node: "orch", paths: [], text: "Orchagent receives SAI failure, logs ERROR, aborts the operation. CONFIG_DB still has the intent, but ASIC does NOT. State divergence. Admin must intervene. 🚨" },
      ],
    },
    {
      id: "telemetry-read",
      name: "📊 Telemetry gNMI read",
      command: "gnmi_get -xpath /interfaces/interface[name=Ethernet0]/state/counters",
      steps: [
        { node: "user", paths: ["user-mgmt"], text: "gNMI client sends Get RPC with xpath targeting interface counters. Request hits mgmt-framework container on port 8080." },
        { node: "mgmt", paths: ["asic-mgmt"], text: "Translib in mgmt-common translates xpath → redis COUNTERS_DB lookup. Reads COUNTERS:oid:0x1000000000002 from n=2." },
        { node: "asic", paths: ["asic-mgmt"], text: "ASIC hardware counters (SAI_PORT_STAT_IF_IN_OCTETS, IF_OUT_OCTETS, etc.) were polled by syncd flexcounter thread → published to COUNTERS_DB." },
        { node: "mgmt", paths: ["user-mgmt"], text: "Mgmt framework aggregates counter values, transforms back to YANG-compliant gNMI response (JSON_IETF encoding)." },
        { node: "user", paths: [], text: "gNMI client receives structured counter data: in-octets: 482934823, out-octets: 129384234. Telemetry pipeline can now graph/alert. 📈" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-sonic", label: "What is SONiC?" },
  { id: "why-exists", label: "Why SONiC Exists — The Problem ⭐" },
  { id: "architecture", label: "Container Architecture ⭐" },
  { id: "db-centric", label: "DB-Centric Design — The Genius" },
  { id: "sai-layer", label: "SAI — Switch Abstraction Interface" },
  { id: "north-south", label: "North→South Journey ⭐" },
  { id: "host-services", label: "Host Services (systemd)" },
  { id: "commands", label: "Essential Commands" },
  { id: "debugging", label: "Debugging SONiC" },
  { id: "lab", label: "Lab Exercise — Explore a Switch" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function SonicFundamentalsPage() {
  return (
    <TopicShell
      icon="🦔"
      title="SONiC — Architecture & Containers"
      gradientWord="SONiC"
      subtitle="Software for Open Networking in the Cloud. Microsoft's open-source network OS that powers Azure and thousands of data centers. Learn the container architecture, the DB-centric genius, the SAI abstraction layer, and how a single config command flows from CLI→Redis→ASIC silicon."
      nav={NAV}
      badges={["🐳 Container deep-dive", "🗄️ Redis pub/sub", "💎 ASIC journey", "🔧 Real commands"]}
      next={{ icon: "🗄️", label: "Redis Databases", href: "/sonic/databases" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-sonic" number="01" title="What is SONiC?">
        <P>
          <strong>SONiC</strong> = <strong>S</strong>oftware for <strong>O</strong>pen{" "}
          <strong>N</strong>etworking <strong>i</strong>n the <strong>C</strong>loud. An open-source
          network operating system based on Linux (Debian) that runs on white-box switches —
          commodity hardware from any vendor (Broadcom, Mellanox, Intel, Barefoot).
        </P>
        <P>
          Developed by Microsoft in 2016 for Azure&apos;s data center network, open-sourced the
          same year, now hosted by the Linux Foundation. Used in production by Microsoft, Alibaba,
          Tencent, LinkedIn, eBay — hundreds of deployments managing millions of ports.
        </P>
        <CodeBlock
          title="show version (on a real SONiC switch)"
          runnable={false}
          code={`admin@sonic:~$ show version
SONiC Software Version: SONiC.202311.1-8c08d87
Distribution: Debian 11.8
Kernel: 5.10.0-18-2-amd64
Build commit: 8c08d87
Build date: Thu Nov 16 14:23:00 UTC 2023
Built by: sonicbld@sonic-build-server

Platform: x86_64-accton_as7326_56x-r0
HwSKU: Accton-AS7326-56X
ASIC: broadcom
ASIC Count: 1
Serial Number: 732656X2147C001
Model Number: AS7326-56X
Hardware Revision: 0A
Uptime: 14:32:17 up 47 days, 3:12, 1 user, load average: 0.42, 0.38, 0.35

Docker images:
REPOSITORY                 TAG                   IMAGE ID       CREATED         SIZE
docker-sonic-mgmt-framework   latest              a3c45ef89d21   3 months ago    562MB
docker-syncd-brcm             latest              7f8b2c3d1a92   3 months ago    438MB
docker-orchagent              latest              6d4a91e2b8c3   3 months ago    412MB
docker-fpm-frr                latest              e9f23a8b7c1d   3 months ago    398MB
docker-database               latest              c2d83f4e5a91   3 months ago    312MB
docker-lldp                   latest              8a3c74d2e6f1   3 months ago    298MB`}
        />
        <Callout type="analogy">
          Think of SONiC as the Linux of networking. Just as Linux broke OS lock-in (no more &quot;must
          buy Sun servers to run Solaris&quot;), SONiC breaks switch lock-in (no more &quot;must buy Cisco
          hardware + NX-OS as a bundle&quot;). Hardware is a commodity. The OS is open source. You
          control the stack.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="why-exists" number="02" title="Why SONiC Exists — The Problem It Solved ⭐">
        <P>Before SONiC, data center networking was a vendor lock-in nightmare:</P>
        <CodeBlock
          title="the_old_world.txt"
          runnable={false}
          code={`PROBLEM: Monolithic vendor stacks
 ┌───────────────────────────────────────┐
 │  Cisco NX-OS (closed source)          │
 │  ↓ MUST run on Cisco Nexus hardware   │  💰 $50K/switch
 │  ↓ CLI is vendor-specific             │  🔒 locked in
 │  ↓ Automation via fragile expect()    │  😱 "screen scraping"
 │  ↓ Upgrades break your scripts        │
 │  ↓ No container isolation → one crash │
 │    takes down BGP + LLDP + everything │
 └───────────────────────────────────────┘

CLOUD SCALE REALITY:
Microsoft Azure: 100,000+ switches
Every 1% efficiency = millions of dollars
Vendor upgrade cycles: 18-24 months
Cloud needs: weekly deploys, chaos engineering, custom features
→ The old model CANNOT SCALE to cloud ops 🚫`}
        />
        <P>SONiC&apos;s solution: <strong>disaggregation</strong>. Break the monolith into layers:</P>
        <CodeBlock
          title="the_sonic_model.txt"
          runnable={false}
          code={`LAYER SEPARATION:
┌──────────────────────────────────────┐
│ 🧭 Management Layer                  │  Open APIs (REST, gNMI, NETCONF)
│    REST/gNMI/CLI → one brain         │  YANG models (OpenConfig)
├──────────────────────────────────────┤
│ 🗄️ Database Layer (Redis)            │  Single source of truth
│    All state in key-value DB         │  Pub/sub notifications
│    NO daemon-to-daemon coupling      │  ← THE GENIUS ✨
├──────────────────────────────────────┤
│ ⚙️ Application Layer (Docker)        │  Each protocol in a container:
│    BGP · LLDP · SNMP · Telemetry     │   - crash isolation
│    Orchagent (control plane)         │   - independent restart
├──────────────────────────────────────┤
│ 🔌 SAI (Switch Abstraction Interface)│  Vendor-neutral C API
│    libsai.so ← vendor implements     │  Broadcom/Mellanox/Intel plug in
├──────────────────────────────────────┤
│ 💎 ASIC (any vendor hardware)        │  Commodity Tomahawk / Spectrum / Tofino
└──────────────────────────────────────┘

BUSINESS WIN:
Hardware: $8K white-box (vs. $50K branded)
Software: open source + your customizations
Ops: GitOps, CI/CD, A/B testing, canary deploys — JUST LIKE SERVERS 🎯`}
        />
        <Callout type="tip">
          Interview gold: "SONiC broke the hardware/software bundle. SAI abstracted the ASIC,
          Redis decoupled the daemons, Docker isolated the failures. Cloud operators can now treat
          switches like cattle instead of pets — exactly the same devops workflows as their
          servers."
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="architecture" number="03" title="Container Architecture ⭐">
        <P>
          SONiC runs as a collection of Docker containers on a Debian host. Each network function
          gets its own container. Let&apos;s see a real <IC>docker ps</IC> from a production switch:
        </P>
        <CodeBlock
          title="docker ps (on a live SONiC switch)"
          code={`docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"`}
          output={`NAMES                    IMAGE                              STATUS
mgmt-framework           docker-sonic-mgmt-framework:latest Up 47 days
telemetry                docker-sonic-telemetry:latest      Up 47 days
snmp                     docker-snmp:latest                 Up 47 days
dhcp_relay               docker-dhcp-relay:latest           Up 47 days
radv                     docker-router-advertiser:latest    Up 47 days
lldp                     docker-lldp:latest                 Up 47 days
pmon                     docker-platform-monitor:latest     Up 47 days
teamd                    docker-teamd:latest                Up 47 days
bgp                      docker-fpm-frr:latest              Up 47 days (FRRouting)
swss                     docker-orchagent:latest            Up 47 days (orchagent lives here)
syncd                    docker-syncd-brcm:latest           Up 47 days (talks to ASIC)
database                 docker-database:latest             Up 47 days (redis server)`}
        />
        <P>Key containers and their roles:</P>
        <Table
          head={["Container", "Purpose", "Key processes"]}
          rows={[
            [<strong key="db">database</strong>, "Redis server (6 database instances: CONFIG_DB, APPL_DB, ASIC_DB, STATE_DB, COUNTERS_DB, FLEX_COUNTER_DB)", "redis-server (7 instances with unix sockets)"],
            [<strong key="mgmt">mgmt-framework</strong>, "REST/gNMI/CLI server — the northbound API gateway", "rest_server (Go), sonic-cli (KLISH), CVL, translib"],
            [<strong key="swss">swss</strong>, "Switch State Service — the orchestration brain. Reads CONFIG_DB, writes ASIC_DB.", "orchagent, portsyncd, neighsyncd, vlanmgrd, intfmgrd, buffermgrd, vrfmgrd"],
            [<strong key="syncd">syncd</strong>, "Sync daemon — reads ASIC_DB, calls vendor SAI library, programs hardware", "syncd, SAI (libsai.so from Broadcom/Mellanox/etc.)"],
            [<strong key="bgp">bgp</strong>, "BGP routing daemon (FRRouting fork)", "bgpd, zebra, staticd, bfdd (FRR suite)"],
            [<strong key="teamd">teamd</strong>, "Link aggregation (LAG / port-channel)", "teamd, teamsyncd"],
            [<strong key="lldp">lldp</strong>, "Link Layer Discovery Protocol", "lldpd, lldp_syncd"],
            [<strong key="pmon">pmon</strong>, "Platform monitoring — fans, PSUs, thermals, transceivers", "xcvrd, psud, thermalctld, ledd"],
            [<strong key="tele">telemetry</strong>, "gNMI telemetry server (separate from mgmt-framework)", "telemetry (gNMI Subscribe RPCs, streaming counters)"],
            [<strong key="snmp">snmp</strong>, "SNMP agent (legacy northbound)", "snmpd with SONiC AgentX subagents"],
          ]}
        />
        <Callout type="behind">
          Why containers? Isolation. If SNMP crashes (it will — SNMP is fragile), BGP keeps running.
          You can restart <IC>docker restart lldp</IC> without affecting routing. You can upgrade
          the telemetry stack independently. Blast radius = 1 container, not the whole switch.
          That&apos;s the cloud operational model applied to networking.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="db-centric" number="04" title="DB-Centric Design — The Genius ⭐">
        <P>
          Traditional network OS: daemons talk to each other via IPC, sockets, shared memory — a
          tangled mess. SONiC: <strong>NO daemon-to-daemon communication</strong>. Everything goes
          through Redis. This is the architectural breakthrough.
        </P>
        <CodeBlock
          title="the_redis_hub_model.txt"
          runnable={false}
          code={`TRADITIONAL NOS (the nightmare):
  CLI ──┬──> BGPd ──┬──> Zebra ──┬──> Kernel ──> Hardware
        │           │            │
        └──> LLDPd ─┴──> SNMPd ──┘  (every arrow is a different IPC mechanism)
        😱 Each daemon has bespoke APIs. Upgrade one, break three.

SONIC (the genius):
                    ┌─────────────────────────────┐
                    │   🗄️ REDIS (database container) │
                    │   All state, all the time    │
                    └──────────┬──────────────────┘
                               │ pub/sub keyspace notifications
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
   📝 CONFIG_DB           📮 APPL_DB            🧬 ASIC_DB
   (intent/config)     (processed state)   (SAI objects)
        ▲                      ▲                      ▲
        │                      │                      │
   CLI/REST writes       Orchagent writes       syncd writes
   CVL validates         after processing       after SAI calls
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                    ALL DAEMONS READ/WRITE REDIS ONLY
                    NO DIRECT COUPLING ✅

WHY THIS IS GENIUS:
1. Observability: \`redis-cli monitor\` shows EVERY state change in real-time
2. Debuggability: \`redis-cli -n 4 hgetall "PORT|Ethernet0"\` shows config at any moment
3. Transactional: Redis is ACID for network state
4. Language-agnostic: Python/C++/Go daemons all speak Redis protocol
5. Replay/testing: Record redis commands → replay in lab → reproduce prod issues
6. Decoupling: Swap orchagent implementation, BGP stays untouched (they never met)`}
        />
        <Callout type="tip">
          This is the #1 interview talking point. "SONiC uses Redis as the single source of truth
          for all switch state. Daemons communicate via pub/sub on keyspace notifications, never
          directly. This decouples components, enables real-time observability, and makes the
          system transactional and testable." Interviewers eat this up. 🎯
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="sai-layer" number="05" title="SAI — Switch Abstraction Interface">
        <P>
          <strong>SAI</strong> = Switch Abstraction Interface. A vendor-neutral C API for
          programming switch ASICs. Every chip vendor (Broadcom, Mellanox/Nvidia, Intel, Marvell,
          Barefoot/Intel) provides a <IC>libsai.so</IC> that implements the SAI spec.
        </P>
        <CodeBlock
          title="sai_concept.txt"
          runnable={false}
          code={`SAI API (header files from OCP SAI repo):
┌────────────────────────────────────────────────────────┐
│ sai_port_api_t      — create/remove ports, set speed  │
│ sai_vlan_api_t      — create VLANs, add members       │
│ sai_route_api_t     — install routes in FIB           │
│ sai_next_hop_api_t  — create next-hop groups (ECMP)   │
│ sai_acl_api_t       — install ACL rules (TCAM)        │
│ sai_buffer_api_t    — configure queue/buffer pools    │
│ sai_qos_api_t       — QoS maps, policers, schedulers  │
│ ...80+ APIs covering every ASIC feature                │
└────────────────────────────────────────────────────────┘
                             ↓
            VENDOR IMPLEMENTS (closed source .so)
                             ↓
┌──────────────┬──────────────┬───────────────┬──────────┐
│ libsai.so    │ libsai.so    │ libsai.so     │ libsai.so│
│ Broadcom SDK │ Mellanox SDK │ Intel SAI     │ Barefoot │
│ (Tomahawk,   │ (Spectrum)   │ (Tofino)      │ (Tofino) │
│  Trident)    │              │               │          │
└──────────────┴──────────────┴───────────────┴──────────┘
                             ↓
                    💎 ASIC SILICON 💎

SONiC's syncd calls libsai.so functions:
  sai_vlan_api->create_vlan(&vlan_oid, switch_id, attr_count, attr_list)
  sai_route_api->create_route_entry(&route_entry, attr_count, attr_list)
→ The VENDOR .so translates to chip-specific register writes
→ The ASIC hardware is now programmed ✅

BUSINESS VALUE:
Write SONiC code once → runs on ANY vendor ASIC that has SAI
(Just swap the libsai.so, same SONiC binary)
→ TRUE VENDOR PORTABILITY 🎯`}
        />
        <Callout type="behind">
          SAI objects get <strong>oids</strong> (object IDs). When you create a VLAN, SAI returns
          an oid like <IC>0x2600000000001a</IC>. Orchagent stores that oid in ASIC_DB. Later when
          you add a port to the VLAN, you reference that oid. It&apos;s like a pointer in hardware —
          the database of silicon state.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="north-south" number="06" title="The Full North→South Journey ⭐">
        <P>
          Let&apos;s trace one command from human typing to electrons in silicon. Example:{" "}
          <IC>config interface startup Ethernet0</IC> (bring up a port).
        </P>
        <CodeBlock
          title="the_full_journey.txt"
          runnable={false}
          code={`NORTH (user) → SOUTH (hardware):

┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ USER TYPES                                                   │
│    admin@sonic:~$ config interface startup Ethernet0           │
│    (KLISH CLI / or REST PATCH / or gNMI Set)                    │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ MGMT FRAMEWORK (mgmt-framework container)                    │
│    • CLI actioner calls REST API internally                     │
│    • OR: direct REST/gNMI from external client hits rest_server │
│    • Translib processes the request                             │
│    • CVL validates: is "Ethernet0" a valid port?                │
│    • Transformer converts YANG → Redis schema                   │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ CONFIG_DB (redis n=4 in database container)                  │
│    HSET "PORT|Ethernet0" "admin_status" "up"                    │
│    (was "down", now "up")                                       │
│    → keyspace notification published: __keyspace@4__:PORT|*     │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ ORCHAGENT (swss container)                                   │
│    • PortsOrch subscribes to PORT table in CONFIG_DB            │
│    • Receives notification, reads new admin_status=up           │
│    • Calls doPortTask() → processes the change                  │
│    • Prepares SAI attributes:                                   │
│        sai_attribute_t attr;                                    │
│        attr.id = SAI_PORT_ATTR_ADMIN_STATE;                     │
│        attr.value.booldata = true;                              │
│    • Writes to APPL_DB first (PORT_TABLE:Ethernet0)             │
│    • Then writes SAI call to ASIC_DB:                           │
│        ASIC_STATE:SAI_OBJECT_TYPE_PORT:oid:0x1000000000002      │
│        HSET ... "SAI_PORT_ATTR_ADMIN_STATE" "true"              │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5️⃣ ASIC_DB (redis n=1)                                          │
│    Now holds the SAI intent: "port oid 0x1000000000002 admin=up"│
│    → syncd is subscribed via ConsumerStateTable, wakes up       │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6️⃣ SYNCD (syncd container)                                      │
│    • Reads ASIC_DB entry                                        │
│    • Translates to SAI API call:                                │
│        sai_port_api->set_port_attribute(                        │
│            port_oid,  /* 0x1000000000002 */                     │
│            &attr      /* SAI_PORT_ATTR_ADMIN_STATE = true */    │
│        );                                                        │
│    • This calls vendor libsai.so (Broadcom/Mellanox/Intel)      │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7️⃣ VENDOR SAI (libsai.so — closed source)                       │
│    • Broadcom SAI: translates to BCM SDK calls                  │
│        bcm_port_enable_set(unit, port, 1);                      │
│    • BCM SDK writes to ASIC registers via PCIe                  │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8️⃣ ASIC HARDWARE (Broadcom Tomahawk / Mellanox Spectrum chip)   │
│    • MAC on port Ethernet0 powered up                           │
│    • PHY enabled, TX/RX circuits active                         │
│    • Link up (if cable connected), LED turns green 💚           │
│    • Packets can now flow ✅                                     │
└─────────────────────────────────────────────────────────────────┘

FEEDBACK PATH (south → north):
  • Link comes up → pmon detects via sysfs → writes STATE_DB
  • STATE_DB: PORT_TABLE|Ethernet0 netdev_oper_status=up
  • "show interface status" reads STATE_DB → displays "up" ✅

TOTAL LATENCY: ~50-200ms from CLI keystroke to ASIC register write
(most of it is validation + Redis roundtrips, SAI call is <5ms)`}
        />
        <Callout type="tip">
          Interview scenario: "Walk me through what happens when you configure a VLAN." This
          north→south journey is your answer script. Hit the keywords: CLI→REST, CVL validation,
          CONFIG_DB write, keyspace notification, orchagent processes, ASIC_DB, syncd, SAI call,
          hardware programmed. Bonus points for mentioning STATE_DB feedback loop. 🎯
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="host-services" number="07" title="Host Services (systemd)">
        <P>
          SONiC containers run on a Debian host. The host has systemd services that glue everything
          together:
        </P>
        <CodeBlock
          title="systemctl list-units 'sonic*' --no-pager"
          code={`systemctl list-units 'sonic*' --type=service --no-pager | grep -E "UNIT|sonic"`}
          output={`UNIT                          LOAD   ACTIVE SUB     DESCRIPTION
sonic.target                  loaded active active  SONiC System
sonic-delayed.target          loaded active active  SONiC delayed services
database.service              loaded active running SONiC Database container
swss.service                  loaded active running SONiC Switch State Service
syncd.service                 loaded active running SONiC Syncd container
bgp.service                   loaded active running SONiC BGP container
teamd.service                 loaded active running SONiC Teamd container
lldp.service                  loaded active running SONiC LLDP container
pmon.service                  loaded active running SONiC Platform Monitor
mgmt-framework.service        loaded active running SONiC Management Framework
telemetry.service             loaded active running SONiC Telemetry
snmp.service                  loaded active running SONiC SNMP container
dhcp_relay.service            loaded active running SONiC DHCP Relay
radv.service                  loaded active running SONiC Router Advertiser
sonic-host-services.service   loaded active running SONiC host services (hostcfgd, caclmgrd)
sonic-config-engine.service   loaded active exited  Generate SONiC configuration`}
        />
        <P>Key host-level daemons (run on host, not in containers):</P>
        <Table
          head={["Daemon", "What it does"]}
          rows={[
            [<IC key="hcfg">hostcfgd</IC>, "Host config daemon — applies host-level config from CONFIG_DB (NTP, syslog, DNS, AAA, hostname). Runs on host, subscribes to CONFIG_DB, writes /etc/ntp.conf, /etc/rsyslog.conf, restarts services."],
            [<IC key="cacl">caclmgrd</IC>, "Control-plane ACL manager — generates iptables rules from CONFIG_DB ACL_TABLE to protect the CPU (rate-limit SSH, SNMP, BGP)."],
            [<IC key="proc">procdockerstatsd</IC>, "Monitors docker container health, publishes to STATE_DB (used by show system-health)."],
          ]}
        />
        <Callout type="behind">
          Why some things run on host instead of containers? They bootstrap the system. For
          example, hostcfgd sets up DNS/NTP — if DNS was in a container, how would that container
          resolve docker registry URLs to pull its own image? Chicken-egg problem. Host services
          break the cycle.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="commands" number="08" title="Essential Commands">
        <CodeBlock
          title="day_1_commands.sh"
          code={`# Show SONiC version, platform, ASIC type
show version

# List all docker containers
docker ps

# Show interface status (up/down, speed, VLAN, description)
show interfaces status

# Show IP interfaces
show ip interfaces

# Show VLANs
show vlan brief

# Show BGP summary
show ip bgp summary

# Show running config (CONFIG_DB dump in JSON)
show runningconfiguration all

# Save config to /etc/sonic/config_db.json (persist across reboots)
config save -y

# Reload config from file
config reload

# Enter config shell (KLISH CLI if mgmt-framework enabled)
sonic-cli

# Enter Linux shell with privileges (from KLISH)
# (in KLISH CLI) do bash

# Show logs from a container
docker logs swss --tail 100 --follow
docker logs syncd --tail 50
docker logs mgmt-framework

# Exec into a container
docker exec -it database bash
docker exec -it swss bash

# Access redis from host
redis-cli -n 4   # CONFIG_DB
redis-cli -n 0   # APPL_DB
redis-cli -n 1   # ASIC_DB

# Show platform info (fans, PSU, temps)
show platform summary
show platform psustatus
show platform temperature

# Show ASIC health
show system-health summary`}
        />
      </Section>

      {/* 09 */}
      <Section id="debugging" number="09" title="Debugging SONiC">
        <P>When things break, here&apos;s your debugging ladder:</P>
        <CodeBlock
          title="debugging_ladder.sh"
          code={`# 1. Check container health
docker ps   # all should be "Up X days", not "Restarting"

# 2. Check syslog
tail -f /var/log/syslog | grep -E "ERR|WARN|orchagent|syncd"

# 3. Inspect container logs
docker logs swss --tail 200 | grep -i error
docker logs syncd --tail 200 | grep -i sai

# 4. Check redis connectivity from host
redis-cli -n 4 ping   # should return PONG
redis-cli -n 4 dbsize # how many keys in CONFIG_DB

# 5. Monitor redis in real-time (see every write)
redis-cli -n 4 monitor
# (in another terminal, run a config command, watch keys appear)

# 6. Inspect a specific config
redis-cli -n 4 hgetall "PORT|Ethernet0"
redis-cli -n 4 hgetall "VLAN|Vlan100"

# 7. Check STATE_DB for oper status
redis-cli -n 6 hgetall "PORT_TABLE|Ethernet0"
# look for netdev_oper_status: up/down

# 8. Exec into swss container, attach gdb to orchagent
docker exec -it swss bash
gdb -p \$(pidof orchagent)
# (set breakpoints, inspect state — production debug!)

# 9. Enable verbose SAI logging
docker exec -it syncd bash
vi /etc/supervisor/conf.d/supervisord.conf
# add -d to syncd command line (debug mode)
supervisorctl restart syncd

# 10. Reproduce in testbed
# sonic-mgmt test framework: pytest --testbed=vms-kvm-t0
# Lab: https://github.com/sonic-net/sonic-mgmt`}
        />
        <Callout type="mistake">
          Common mistake: running <IC>config reload</IC> to &quot;fix&quot; a problem without understanding
          root cause. That wipes your running state and reloads /etc/sonic/config_db.json — you
          just lost your unsaved config AND the evidence. Always <IC>config save</IC> first, and
          check logs before reload. 🚨
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="lab" number="10" title="Lab Exercise — Explore a Switch">
        <P>Hands-on: Spin up a SONiC VM or connect to a test switch. Execute the following:</P>
        <CodeBlock
          title="lab_steps.sh"
          code={`# Step 1: Verify SONiC version and platform
show version
# Expected: SONiC version, Debian base, ASIC type (broadcom/mellanox/vs for virtual)

# Step 2: List containers
docker ps --format "table {{.Names}}\\t{{.Status}}"
# Expected: database, swss, syncd, bgp, lldp, mgmt-framework all "Up"

# Step 3: Check redis databases
docker exec -it database bash
redis-cli -n 4 keys '*' | head -20
# Expected: PORT|*, VLAN|*, DEVICE_METADATA|*, etc.

# Step 4: Inspect Ethernet0 config
redis-cli -n 4 hgetall "PORT|Ethernet0"
# Expected fields: alias, lanes, speed, mtu, admin_status

# Step 5: Add a VLAN, watch it propagate
exit  # back to host
redis-cli -n 4 monitor &  # background monitor
config vlan add 200
# Expected in monitor output: HSET VLAN|Vlan200 vlanid 200

# Step 6: Check VLAN in APPL_DB
redis-cli -n 0 keys 'VLAN*'
redis-cli -n 0 hgetall "VLAN_TABLE:Vlan200"
# Expected: same vlanid

# Step 7: Check swss logs for orchagent processing
docker logs swss --tail 50 | grep -i vlan
# Expected: "Create VLAN Vlan200", "SAI_OBJECT_TYPE_VLAN oid:0x26..."

# Step 8: Verify in hardware (show command)
show vlan brief
# Expected: Vlan200 appears in the table

# Step 9: Remove VLAN, watch deletion
config vlan del 200
redis-cli -n 4 keys 'VLAN*'
# Expected: VLAN|Vlan200 gone

# Step 10: Check systemd services
systemctl status sonic.target
# Expected: active, all sub-services loaded`}
          output={`# Sample outputs:

admin@sonic:~$ redis-cli -n 4 hgetall "PORT|Ethernet0"
1) "alias"
2) "Eth1/1"
3) "lanes"
4) "25,26,27,28"
5) "speed"
6) "100000"
7) "index"
8) "1"
9) "mtu"
10) "9100"
11) "admin_status"
12) "up"

admin@sonic:~$ config vlan add 200
(monitor shows): 1678901234.567890 [4 lua] "HSET" "VLAN|Vlan200" "vlanid" "200"

admin@sonic:~$ docker logs swss --tail 5
:- doTask: Create VLAN Vlan200 vid:200
:- VlanMgr: Created VLAN Vlan200 with SAI_OBJECT_TYPE_VLAN oid:0x2600000000001c
:- VlanMgr: VLAN Vlan200 successfully created ✅`}
        />
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["SONiC acronym", "Software for Open Networking in the Cloud"],
            ["Origin", "Microsoft 2016 for Azure, open-sourced, now Linux Foundation"],
            ["Base OS", "Debian Linux"],
            ["Key insight", "DB-centric: all state in Redis, no daemon-to-daemon coupling"],
            ["SAI", "Switch Abstraction Interface — vendor-neutral ASIC API (libsai.so)"],
            ["Containers", "database, swss (orchagent), syncd, bgp, mgmt-framework, telemetry, lldp, pmon, teamd, snmp, dhcp_relay"],
            ["Orchestration brain", "orchagent in swss container — reads CONFIG_DB, writes ASIC_DB"],
            ["Hardware layer", "syncd reads ASIC_DB, calls SAI, programs ASIC via vendor .so"],
            ["Config flow", "CLI/REST → mgmt-framework → CONFIG_DB → orchagent → ASIC_DB → syncd → SAI → ASIC"],
            ["Host services", "hostcfgd (NTP/syslog/DNS), caclmgrd (iptables for control-plane ACL)"],
            ["Save config", "config save (persists to /etc/sonic/config_db.json)"],
            ["Debug redis", "redis-cli -n 4 monitor (watch all CONFIG_DB writes live)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
