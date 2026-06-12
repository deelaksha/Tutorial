"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The 10-step feature pipeline",
  nodes: [
    { id: "yang", icon: "📄", label: "1 · SONiC YANG", sub: "sonic-dns.yang", x: 8, y: 25, color: "#22d3ee" },
    { id: "annot", icon: "📝", label: "2 · Annotation", sub: "OC→SONiC mapping", x: 8, y: 75, color: "#60a5fa" },
    { id: "xfmr", icon: "🔁", label: "3 · Transformer", sub: "key/field xfmrs", x: 28, y: 50, color: "#a78bfa" },
    { id: "cvl", icon: "🛡️", label: "4 · CVL", sub: "auto from YANG", x: 46, y: 20, color: "#fb923c" },
    { id: "translib", icon: "📚", label: "5 · Translib", sub: "common_app auto", x: 46, y: 80, color: "#34d399" },
    { id: "host", icon: "🐍", label: "6 · hostcfgd", sub: "DnsCfg handler", x: 64, y: 50, color: "#fbbf24" },
    { id: "tmpl", icon: "🧩", label: "7 · Template", sub: "resolv.conf.j2", x: 80, y: 22, color: "#f472b6" },
    { id: "test", icon: "🧪", label: "8 · Test+Debug", sub: "curl/pytest/logs", x: 88, y: 68, color: "#10b981" },
  ],
  edges: [
    { id: "yang-cvl", from: "yang", to: "cvl", color: "#fb923c" },
    { id: "annot-xfmr", from: "annot", to: "xfmr", color: "#a78bfa" },
    { id: "xfmr-translib", from: "xfmr", to: "translib", color: "#34d399" },
    { id: "cvl-translib", from: "cvl", to: "translib", color: "#34d399" },
    { id: "translib-host", from: "translib", to: "host", color: "#fbbf24" },
    { id: "host-tmpl", from: "host", to: "tmpl", color: "#f472b6" },
    { id: "tmpl-test", from: "tmpl", to: "test", color: "#10b981" },
    { id: "test-yang", from: "test", to: "yang", bend: 28, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Happy path: DNS server → /etc/resolv.conf",
      command: "PATCH /openconfig-system:system/dns/servers/server=8.8.8.8/config",
      steps: [
        { node: "yang", paths: ["yang-cvl"], text: "sonic-dns.yang defines DNS_SERVER table with DNS_SERVER_LIST key address (type inet:ip-address). CVL auto-loads this schema." },
        { node: "annot", paths: ["annot-xfmr"], text: "openconfig-system-dns-annot.yang maps /system/dns/servers/server → table-name DNS_SERVER, key-transformer dns_server_key_xfmr, field-name NULL (keyonly)." },
        { node: "xfmr", paths: ["xfmr-translib"], text: "Transformer callback dns_server_key_xfmr extracts address from OC struct, returns '8.8.8.8' as Redis key. DbMap: {\"DNS_SERVER\": {\"8.8.8.8\": {\"NULL\":\"NULL\"}}}." },
        { node: "cvl", paths: ["cvl-translib"], text: "CVL validates OP_CREATE DNS_SERVER|8.8.8.8 against sonic-dns.yang. Type inet:ip-address check passes. Validation ✅." },
        { node: "translib", paths: ["translib-host"], text: "common_app writes to CONFIG_DB (no custom app needed — annotations route it). Redis keyspace event fires." },
        { node: "host", paths: ["host-tmpl"], text: "hostcfgd DnsCfg.dns_server_update subscribes DNS_SERVER, fires on keyspace event, calls sonic-cfggen -d -t resolv.conf.j2." },
        { node: "tmpl", paths: ["tmpl-test"], text: "resolv.conf.j2 loops {% for s in DNS_SERVER %} nameserver {{ s }} {% endfor %}. Renders 'nameserver 8.8.8.8', writes /etc/resolv.conf atomically." },
        { node: "test", paths: [], text: "Verify: 'nslookup google.com' uses 8.8.8.8. 'cat /etc/resolv.conf' shows nameserver line. redis-cli confirms key. Feature works end-to-end! 🎉" },
      ],
    },
    {
      id: "forgot-annot",
      name: "❌ Forgot annotation → 500 error",
      command: "Missing table-name → translib can't find mapping",
      steps: [
        { node: "annot", paths: ["annot-xfmr"], text: "Developer forgets to add sonic-ext:table-name deviation in annotation file. Annotation incomplete." },
        { node: "xfmr", paths: ["xfmr-translib"], text: "Transformer callback registered but translib can't find which table to write (no table-name). xlate layer returns error." },
        { node: "translib", paths: [], text: "common_app returns ERR_INTERNAL: 'no table mapping found for path /openconfig-system:system/dns/servers/server'." },
        { node: "test", paths: ["test-yang"], text: "REST returns HTTP 500 Internal Server Error. Fix: add deviation with sonic-ext:table-name 'DNS_SERVER' in annotation file, recompile YANG, restart mgmt-framework." },
        { node: "yang", paths: [], text: "After fix: annotation compiled into mgmt-framework binary. Re-test PATCH → now hits step 3 (transformer)." },
        { node: "cvl", paths: [], text: "CVL never reached — translib failed before DB write. No data corruption (safe failure mode)." },
        { node: "host", paths: [], text: "hostcfgd never fired — no CONFIG_DB write, no keyspace event. System unchanged." },
        { node: "tmpl", paths: [], text: "Template never rendered. /etc/resolv.conf still has old content. Debugging: check mgmt-framework logs for 'no table mapping'." },
      ],
    },
    {
      id: "cli",
      name: "🖥️ CLI added on top",
      command: "KLISH command 'dns-server 8.8.8.8' calls same REST path",
      steps: [
        { node: "yang", paths: [], text: "SONiC YANG already exists (from step 1). No changes needed — CLI reuses the YANG schema." },
        { node: "annot", paths: [], text: "Annotation already maps REST path to DNS_SERVER. KLISH actioner will call this path." },
        { node: "xfmr", paths: ["xfmr-translib"], text: "KLISH XML defines command: <COMMAND name='dns-server'> <PARAM name='address' type='A.B.C.D'> <ACTION> curl -X PATCH .../dns/servers/server={address}/config </ACTION>. Actioner invokes REST." },
        { node: "translib", paths: ["translib-host"], text: "REST flow identical to scenario 1 — transformer, CVL, CONFIG_DB write. KLISH is a REST client wrapper." },
        { node: "host", paths: ["host-tmpl"], text: "hostcfgd sees the same keyspace event (doesn't care if source was KLISH vs REST vs gNMI)." },
        { node: "tmpl", paths: ["tmpl-test"], text: "Template renders identically. /etc/resolv.conf updated." },
        { node: "test", paths: [], text: "User types 'dns-server 8.8.8.8' in KLISH → same result as curl. CLI is syntactic sugar over REST API. One backend, three frontends (KLISH/REST/gNMI)." },
        { node: "cvl", paths: [], text: "CVL validates the same way regardless of entry point. This is the power of layered architecture — add CLI without touching validation logic." },
      ],
    },
  ],
};

const NAV = [
  { id: "intro", label: "Building a Feature from Scratch" },
  { id: "step1", label: "Step 1: SONiC YANG Model ⭐" },
  { id: "step2", label: "Step 2: Annotation File ⭐" },
  { id: "step3", label: "Step 3: Transformer Callbacks ⭐" },
  { id: "step4", label: "Step 4: CVL Validation (Auto)" },
  { id: "step5", label: "Step 5: Translib (Auto-Routed)" },
  { id: "step6", label: "Step 6: hostcfgd Handler ⭐" },
  { id: "step7", label: "Step 7: Jinja2 Template" },
  { id: "step8", label: "Step 8: Verify CONFIG_DB" },
  { id: "step9", label: "Step 9: Testing (REST/gNMI/Unit)" },
  { id: "step10", label: "Step 10: Debugging Checklist" },
  { id: "build-deploy", label: "Build & Deploy Changes" },
  { id: "interview", label: "Interview Questions" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function NewFeaturePage() {
  return (
    <TopicShell
      icon="🏗️"
      title="Build a New Feature — DNS from Scratch"
      gradientWord="Feature"
      subtitle="You&apos;ve seen NTP end-to-end. Now build your OWN feature: DNS server configuration (static nameservers in /etc/resolv.conf). This is the 10-step recipe you&apos;ll follow for ANY new SONiC mgmt-framework feature: YANG → annotation → transformer → CVL → hostcfgd → template → test. Full file content, exact repo paths, common mistakes caught, build instructions, and the debug checklist. By the end, you&apos;ll have added openconfig-system DNS support to SONiC."
      nav={NAV}
      badges={["10-step recipe", "Full code shown", "Build & deploy", "Mistake traps"]}
      next={{ icon: "🗺️", label: "Source Code Walkthrough", href: "/sonic/source-walkthrough" }}
      backHref="/sonic"
      backLabel="🦔 SONiC"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="intro" number="01" title="Building a Feature from Scratch">
        <P>
          The worked example: <strong>DNS server configuration</strong>. OpenConfig has <IC>/openconfig-system:system/dns/servers</IC>,
          but SONiC doesn&apos;t implement it yet (as of many releases). We&apos;ll build it as if it&apos;s missing. The
          goal: <IC>config dns add 8.8.8.8</IC> writes to CONFIG_DB, renders <IC>/etc/resolv.conf</IC>, and DNS lookups
          use the new server.
        </P>
        <Callout type="note">
          This mirrors the NTP feature exactly (same table structure, same flow). By building DNS, you&apos;ll learn
          the generalizable pattern that applies to SYSLOG, SNMP, ACL, VLAN, BGP — any mgmt-framework feature.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="step1" number="02" title="Step 1: SONiC YANG Model ⭐">
        <P>
          <strong>File to create:</strong> <IC>sonic-mgmt-common/models/yang/sonic/sonic-dns.yang</IC>
        </P>
        <P>
          The SONiC YANG defines the CONFIG_DB schema. CVL will auto-load this for validation.
        </P>
        <CodeBlock
          title="sonic-dns.yang (full module)"
          runnable={false}
          code={`module sonic-dns {
  yang-version 1.1;
  namespace "http://github.com/Azure/sonic-dns";
  prefix sdns;

  import ietf-inet-types { prefix inet; }

  organization "SONiC";
  contact "SONiC";
  description "SONiC YANG model for DNS configuration";

  revision 2026-06-12 {
    description "Initial revision";
  }

  container sonic-dns {
    container DNS_SERVER {
      description "DNS nameserver configuration table";

      list DNS_SERVER_LIST {
        key "address";

        leaf address {
          type inet:ip-address;
          description "DNS server IP address (IPv4 or IPv6)";
        }
      }
    }
  }
}`}
        />
        <Callout type="behind">
          The container <IC>sonic-dns</IC> is the top-level container (convention). <IC>DNS_SERVER</IC> matches the
          CONFIG_DB table name (Redis key prefix). <IC>DNS_SERVER_LIST</IC> is the list name (arbitrary, but convention
          is TABLE_LIST). The <IC>key "address"</IC> becomes the Redis hash key.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="step2" number="03" title="Step 2: Annotation File ⭐">
        <P>
          <strong>File to create:</strong> <IC>sonic-mgmt-common/models/yang/annotations/openconfig-system-dns-annot.yang</IC>
        </P>
        <P>
          Annotations tell translib how to map OpenConfig paths to SONiC tables.
        </P>
        <CodeBlock
          title="openconfig-system-dns-annot.yang (full module)"
          runnable={false}
          code={`module openconfig-system-dns-annot {
  yang-version 1.1;
  namespace "http://github.com/Azure/sonic-openconfig-system-dns-annot";
  prefix oc-sys-dns-annot;

  import openconfig-system { prefix oc-sys; }
  import sonic-extensions { prefix sonic-ext; }

  organization "SONiC";
  description "Annotation for OpenConfig system DNS to SONiC DNS_SERVER table";

  revision 2026-06-12 {
    description "Initial revision";
  }

  // Map /system/dns/servers/server to DNS_SERVER table
  deviation /oc-sys:system/oc-sys:dns/oc-sys:servers/oc-sys:server {
    deviate add {
      sonic-ext:table-name "DNS_SERVER";
      sonic-ext:key-transformer "dns_server_key_xfmr";
    }
  }

  // Map /system/dns/servers/server/config/address to NULL (keyonly table)
  deviation /oc-sys:system/oc-sys:dns/oc-sys:servers/oc-sys:server/oc-sys:config/oc-sys:address {
    deviate add {
      sonic-ext:field-name "NULL";
    }
  }
}`}
        />
        <Callout type="tip">
          <IC>sonic-ext:table-name</IC> tells translib which CONFIG_DB table to write. <IC>sonic-ext:key-transformer</IC>
          names the Go callback that extracts the Redis key from the OC struct. <IC>sonic-ext:field-name "NULL"</IC>
          means this leaf is the key itself (no separate field in the hash).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="step3" number="04" title="Step 3: Transformer Callbacks ⭐">
        <P>
          <strong>File to edit:</strong> <IC>sonic-mgmt-common/translib/transformer/xfmr_system.go</IC> (or create new xfmr_dns.go)
        </P>
        <P>
          The key transformer extracts the DNS server address from the OpenConfig struct and returns the Redis key.
        </P>
        <CodeBlock
          title="xfmr_dns.go (new file — full content)"
          runnable={false}
          code={`package transformer

import (
	"errors"
	"fmt"
	"net"

	"github.com/Azure/sonic-mgmt-common/translib/ocbinds"
	"github.com/Azure/sonic-mgmt-common/translib/tlerr"
	log "github.com/golang/glog"
)

func init() {
	XlateFuncBind("dns_server_key_xfmr", dns_server_key_xfmr)
	XlateFuncBind("dns_server_key_xfmr_reverse", dns_server_key_xfmr_reverse)
}

// YangToDb: extract DNS server address from OC path → Redis key
var dns_server_key_xfmr KeyXfmrYangToDb = func(inParams XfmrParams) (string, error) {
	log.Info("dns_server_key_xfmr: YangToDb")

	pathInfo := NewPathInfo(inParams.uri)
	address := pathInfo.Var("address")  // from path .../server[address=8.8.8.8]

	if address == "" {
		return "", errors.New("DNS server address not found in path")
	}

	// Validate IP format (CVL also checks, but good practice)
	if net.ParseIP(address) == nil {
		return "", fmt.Errorf("invalid IP address: %s", address)
	}

	log.Infof("dns_server_key_xfmr: Redis key = %s", address)
	return address, nil
}

// DbToYang: reverse mapping for GET (Redis key → OC key)
var dns_server_key_xfmr_reverse KeyXfmrDbToYang = func(inParams XfmrParams) (map[string]interface{}, error) {
	log.Info("dns_server_key_xfmr_reverse: DbToYang")

	redisKey := inParams.key  // e.g., "8.8.8.8"
	result := make(map[string]interface{})
	result["address"] = redisKey

	log.Infof("dns_server_key_xfmr_reverse: OC key = address:%s", redisKey)
	return result, nil
}`}
        />
        <Callout type="mistake">
          Common mistake: forgetting to call <IC>XlateFuncBind</IC> in <IC>init()</IC>. The string name in the annotation
          (e.g., &quot;dns_server_key_xfmr&quot;) MUST exactly match the XlateFuncBind registration. Typo here = runtime panic.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="step4" number="05" title="Step 4: CVL Validation (Auto)">
        <P>
          <strong>No code to write!</strong> CVL auto-loads <IC>sonic-dns.yang</IC> and validates any write to DNS_SERVER
          against the <IC>inet:ip-address</IC> type constraint.
        </P>
        <CodeBlock
          title="cvl_auto_validation.txt"
          runnable={false}
          code={`When translib calls CVL with OP_CREATE DNS_SERVER|8.8.8.8:

CVL loads sonic-dns.yang schema (cached at mgmt-framework startup)
→ checks leaf address type inet:ip-address
→ inet:ip-address has pattern (IPv4: \\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}, IPv6: ::1 etc.)
→ 8.8.8.8 matches IPv4 → CVL_SUCCESS
→ 999.1.1.1 FAILS (octet >255) → CVL_SYNTAX_INVALID_VALUE

NO custom CVL code needed — the YANG type system IS the validation logic`}
        />
        <P>
          Optional: if you want to enforce constraints like &quot;max 3 DNS servers&quot;, add a <IC>must</IC> statement:
        </P>
        <CodeBlock
          title="sonic-dns.yang with must (optional enhancement)"
          runnable={false}
          code={`list DNS_SERVER_LIST {
  key "address";
  must "count(../DNS_SERVER_LIST) <= 3" {
    error-message "Maximum 3 DNS servers allowed";
  }
  leaf address {
    type inet:ip-address;
  }
}`}
        />
      </Section>

      {/* 06 */}
      <Section id="step5" number="06" title="Step 5: Translib (Auto-Routed)">
        <P>
          <strong>No custom app module needed!</strong> Because we used annotations, <IC>common_app</IC> auto-routes
          the request to CONFIG_DB. You ONLY write a custom app when you need complex business logic (e.g., multi-table
          transactions, computed fields, external API calls).
        </P>
        <CodeBlock
          title="when_to_write_custom_app.txt"
          runnable={false}
          code={`USE common_app (annotation-based, NO custom code):
  ✅ 1:1 OC leaf → SONiC field mapping
  ✅ simple key extraction (IP address, name, ID)
  ✅ keyonly tables (like NTP_SERVER, DNS_SERVER)
  → DNS, NTP, SYSLOG all use common_app

WRITE custom app module (implement AppInterface):
  ❌ multi-table writes (e.g., create VLAN → also create VLAN_MEMBER entries)
  ❌ computed fields (e.g., OC sends prefix-length, SONiC stores netmask)
  ❌ external dependencies (query lldpd, call BGP API)
  ❌ complex validation beyond YANG types (e.g., "port must be in LAG to allow this")
  → ACL, VLAN, BGP use custom app modules

For DNS: annotation + transformer is enough → common_app handles it`}
        />
      </Section>

      {/* 07 */}
      <Section id="step6" number="07" title="Step 6: hostcfgd Handler ⭐">
        <P>
          <strong>File to edit:</strong> <IC>sonic-host-services/scripts/hostcfgd</IC> (Python daemon)
        </P>
        <P>
          Add a subscriber class for DNS_SERVER that re-renders <IC>/etc/resolv.conf</IC> when keys change.
        </P>
        <CodeBlock
          title="hostcfgd (DNS handler addition, ~30 lines)"
          runnable={false}
          code={`# Add to hostcfgd imports:
from swsscommon import SubscriberStateTable

# Add DnsCfg class (similar to NtpCfg):
class DnsCfg:
    def __init__(self):
        self.dns_server_table = SubscriberStateTable(
            swsscommon.ConfigDBConnector(),
            swsscommon.CFG_DB,
            "DNS_SERVER"
        )

    def dns_server_update(self, key, op):
        """
        Called when DNS_SERVER key changes (SET or DEL).
        Re-render /etc/resolv.conf from CONFIG_DB.
        """
        syslog.syslog(syslog.LOG_INFO, f"DNS_SERVER {op}: {key}")

        # Render resolv.conf.j2 template
        os.system(
            "sonic-cfggen -d -t /usr/share/sonic/templates/resolv.conf.j2 > /tmp/resolv.conf.new"
        )
        os.rename("/tmp/resolv.conf.new", "/etc/resolv.conf")  # atomic write

        syslog.syslog(syslog.LOG_INFO, "/etc/resolv.conf updated")
        # NOTE: no daemon restart needed — glibc reads resolv.conf per-query

# In main loop (add DnsCfg to the subscriber list):
dnscfg = DnsCfg()
sel.addSelectable(dnscfg.dns_server_table)

# In the event loop:
while True:
    state, _ = sel.select(1000)
    if state == Select.OBJECT:
        # ... existing handlers (NTP, SYSLOG, etc.) ...

        # DNS handler:
        key, op, fvs = dnscfg.dns_server_table.pop()
        if key:
            dnscfg.dns_server_update(key, op)`}
        />
        <Callout type="note">
          Unlike chronyd (which needs <IC>systemctl restart</IC>), glibc&apos;s resolver reads <IC>/etc/resolv.conf</IC>
          on EVERY DNS query (or with a short cache). No restart needed — just overwrite the file atomically.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="step7" number="08" title="Step 7: Jinja2 Template">
        <P>
          <strong>File to create:</strong> <IC>/usr/share/sonic/templates/resolv.conf.j2</IC> (on the switch) or in
          sonic-buildimage <IC>files/image_config/resolv/resolv.conf.j2</IC>
        </P>
        <CodeBlock
          title="resolv.conf.j2 (full template)"
          runnable={false}
          code={`{# SONiC DNS nameserver configuration #}

{% if DNS_SERVER %}
{% for server in DNS_SERVER %}
nameserver {{ server }}
{% endfor %}
{% else %}
# No DNS servers configured — using DHCP-provided servers
{% endif %}

# SONiC default search domain (optional)
# search example.com`}
        />
        <P>
          Rendered output examples:
        </P>
        <CodeBlock
          title="/etc/resolv.conf (before — no DNS_SERVER keys)"
          runnable={false}
          code={`# No DNS servers configured — using DHCP-provided servers

# SONiC default search domain (optional)
# search example.com`}
        />
        <CodeBlock
          title="/etc/resolv.conf (after — DNS_SERVER|8.8.8.8 and DNS_SERVER|1.1.1.1)"
          runnable={false}
          code={`nameserver 8.8.8.8
nameserver 1.1.1.1

# SONiC default search domain (optional)
# search example.com`}
        />
      </Section>

      {/* 09 */}
      <Section id="step8" number="09" title="Step 8: Verify CONFIG_DB">
        <P>
          Test the full stack manually before automating tests:
        </P>
        <CodeBlock
          title="manual_verification.sh"
          code={`# Step 1: Add DNS server via REST
curl -k -X PATCH \\
  "https://sonic-switch/restconf/data/openconfig-system:system/dns/servers/server=8.8.8.8/config" \\
  -u admin:YourPaSsWoRd \\
  -H 'Content-Type: application/yang-data+json' \\
  -d '{
    "openconfig-system:config": {
      "address": "8.8.8.8"
    }
  }'

# Step 2: Check CONFIG_DB
redis-cli -n 4 HGETALL "DNS_SERVER|8.8.8.8"

# Step 3: Check hostcfgd log
journalctl -u hostcfgd -n 10 --no-pager | grep DNS

# Step 4: Check rendered file
cat /etc/resolv.conf

# Step 5: Test DNS lookup
nslookup google.com

# Step 6: Verify via REST GET (state)
curl -k -X GET \\
  "https://sonic-switch/restconf/data/openconfig-system:system/dns/servers" \\
  -u admin:YourPaSsWoRd`}
          output={`# Step 1: HTTP 204 No Content (success)

# Step 2:
1) "NULL"
2) "NULL"

# Step 3:
Jun 12 15:10:22 sonic INFO hostcfgd: DNS_SERVER SET: 8.8.8.8
Jun 12 15:10:22 sonic INFO hostcfgd: /etc/resolv.conf updated

# Step 4:
nameserver 8.8.8.8

# Step 5:
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   google.com
Address: 142.250.80.46

# Step 6: (JSON response with server list)`}
        />
      </Section>

      {/* 10 */}
      <Section id="step9" number="10" title="Step 9: Testing (REST/gNMI/Unit)">
        <P>
          Three layers of tests:
        </P>
        <CodeBlock
          title="test_dns_rest.py (pytest-style REST integration test)"
          runnable={false}
          code={`import requests
import pytest

BASE_URL = "https://sonic-switch/restconf/data"
AUTH = ("admin", "YourPaSsWoRd")

def test_dns_server_add():
    """Test adding a DNS server via REST PATCH."""
    url = f"{BASE_URL}/openconfig-system:system/dns/servers/server=8.8.8.8/config"
    payload = {"openconfig-system:config": {"address": "8.8.8.8"}}
    resp = requests.patch(url, json=payload, auth=AUTH, verify=False)
    assert resp.status_code == 204, f"Expected 204, got {resp.status_code}"

def test_dns_server_get():
    """Test retrieving DNS server via REST GET."""
    url = f"{BASE_URL}/openconfig-system:system/dns/servers/server=8.8.8.8"
    resp = requests.get(url, auth=AUTH, verify=False)
    assert resp.status_code == 200
    data = resp.json()
    assert data["openconfig-system:server"][0]["config"]["address"] == "8.8.8.8"

def test_dns_server_invalid():
    """Test CVL rejects invalid IP."""
    url = f"{BASE_URL}/openconfig-system:system/dns/servers/server=999.1.1.1/config"
    payload = {"openconfig-system:config": {"address": "999.1.1.1"}}
    resp = requests.patch(url, json=payload, auth=AUTH, verify=False)
    assert resp.status_code == 400, "CVL should reject 999.1.1.1"

def test_dns_server_delete():
    """Test deleting DNS server via REST DELETE."""
    url = f"{BASE_URL}/openconfig-system:system/dns/servers/server=8.8.8.8"
    resp = requests.delete(url, auth=AUTH, verify=False)
    assert resp.status_code == 204`}
        />
        <CodeBlock
          title="test_dns_transformer_unit.go (Go unit test for key xfmr)"
          runnable={false}
          code={`package transformer

import (
	"testing"
	"github.com/Azure/sonic-mgmt-common/translib/ocbinds"
)

func TestDnsServerKeyXfmr(t *testing.T) {
	// Mock OC struct
	server := &ocbinds.OpenconfigSystem_System_Dns_Servers_Server{}
	addr := "8.8.8.8"
	server.Config = &ocbinds.OpenconfigSystem_System_Dns_Servers_Server_Config{
		Address: &addr,
	}

	params := XfmrParams{
		uri:        "/openconfig-system:system/dns/servers/server[address=8.8.8.8]",
		ygotTarget: server,
	}

	key, err := dns_server_key_xfmr(params)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if key != "8.8.8.8" {
		t.Errorf("Expected key '8.8.8.8', got '%s'", key)
	}
}

func TestDnsServerKeyXfmrInvalid(t *testing.T) {
	server := &ocbinds.OpenconfigSystem_System_Dns_Servers_Server{}
	addr := "999.1.1.1"
	server.Config = &ocbinds.OpenconfigSystem_System_Dns_Servers_Server_Config{
		Address: &addr,
	}

	params := XfmrParams{ygotTarget: server}
	_, err := dns_server_key_xfmr(params)
	if err == nil {
		t.Error("Expected error for invalid IP 999.1.1.1, got nil")
	}
}`}
        />
        <CodeBlock
          title="test_dns_gnmi.sh (gNMI test with gnmic)"
          code={`# Add DNS server via gNMI Set
gnmic -a sonic-switch:8080 --insecure -u admin -p YourPaSsWoRd \\
  set \\
  --update-path "/openconfig-system:system/dns/servers/server[address=8.8.8.8]/config/address" \\
  --update-value "8.8.8.8"

# Get DNS servers via gNMI
gnmic -a sonic-switch:8080 --insecure -u admin -p YourPaSsWoRd \\
  get \\
  --path "/openconfig-system:system/dns/servers"`}
          output={`# Set response:
{
  "timestamp": 1735000000,
  "updates": [...]
}

# Get response:
{
  "openconfig-system:servers": {
    "server": [
      {"address": "8.8.8.8", "config": {"address": "8.8.8.8"}}
    ]
  }
}`}
        />
      </Section>

      {/* 11 */}
      <Section id="step10" number="11" title="Step 10: Debugging Checklist">
        <P>
          Symptom-based debugging table for the DNS feature:
        </P>
        <Table
          head={["Symptom", "Layer", "Debug Command", "Common Fix"]}
          rows={[
            [
              "HTTP 404 on PATCH",
              "YANG not loaded",
              "Check mgmt-framework startup logs",
              "Recompile YANG: make -C sonic-mgmt-common/models, rebuild mgmt-framework container",
            ],
            [
              "HTTP 500 'no table mapping'",
              "Annotation missing",
              "grep table-name openconfig-system-dns-annot.yang",
              "Add sonic-ext:table-name deviation, recompile YANG",
            ],
            [
              "HTTP 500 panic in xfmr",
              "Transformer crash",
              "journalctl -u rest-server | grep panic",
              "Check XlateFuncBind name matches annotation string exactly",
            ],
            [
              "HTTP 400 CVL error",
              "CVL validation",
              "Check error-message in response body",
              "Fix payload (e.g., 999.1.1.1 → 8.8.8.8) OR relax sonic-dns.yang constraints",
            ],
            [
              "204 success but no Redis key",
              "CONFIG_DB write failed",
              "redis-cli -n 4 KEYS 'DNS_SERVER|*'",
              "Check translib logs for swsscommon write errors",
            ],
            [
              "Redis key exists, resolv.conf unchanged",
              "hostcfgd not fired",
              "journalctl -u hostcfgd | grep DNS",
              "Check hostcfgd subscribes DNS_SERVER, restart hostcfgd",
            ],
            [
              "hostcfgd log shows render, file unchanged",
              "sonic-cfggen crash",
              "Run manually: sonic-cfggen -d -t resolv.conf.j2",
              "Check for UndefinedError (template refs missing key), fix template",
            ],
            [
              "resolv.conf updated, nslookup still uses old DNS",
              "Cached resolver",
              "systemd-resolve --flush-caches (if systemd-resolved)",
              "Or wait ~5s (glibc cache TTL), or restart app",
            ],
          ]}
        />
      </Section>

      {/* 12 */}
      <Section id="build-deploy" number="12" title="Build & Deploy Changes">
        <P>
          To test your changes on a SONiC switch:
        </P>
        <CodeBlock
          title="build_and_deploy.sh"
          code={`# METHOD 1: Full image rebuild (slow, production-ready)
cd sonic-buildimage
make configure PLATFORM=broadcom  # or vs, mellanox, etc.
make target/sonic-broadcom.bin

# Flash new image to switch
sonic-installer install sonic-broadcom.bin
sudo reboot

# METHOD 2: Rebuild mgmt-framework container only (faster for dev)
cd sonic-buildimage
make target/docker-sonic-mgmt-framework.gz

# Copy to switch and load
scp target/docker-sonic-mgmt-framework.gz admin@sonic-switch:/tmp/
ssh admin@sonic-switch
docker load < /tmp/docker-sonic-mgmt-framework.gz
sudo systemctl restart mgmt-framework

# METHOD 3: Dev-mount (instant, for rapid iteration — NOT for production)
# On your dev machine (sonic-mgmt-common repo):
make

# SCP built artifacts to switch:
scp build/rest_server/dist/rest_server admin@sonic-switch:/usr/sbin/
scp build/cvl/dist/libcvl.so admin@sonic-switch:/usr/lib/

# On switch:
sudo systemctl restart rest-server

# For hostcfgd changes (Python, no rebuild):
scp sonic-host-services/scripts/hostcfgd admin@sonic-switch:/usr/bin/
sudo systemctl restart hostcfgd`}
          output={`# METHOD 1: (30-60 min build time)
# METHOD 2: (~5 min build time)
# METHOD 3: (instant — just copy files)`}
        />
        <Callout type="tip">
          For learning, use METHOD 3 (dev-mount) with a SONiC VS (virtual switch) Docker container. For production
          features, always do METHOD 1 (full rebuild) to catch integration issues.
        </Callout>
      </Section>

      {/* 13 */}
      <Section id="interview" number="13" title="Interview Questions">
        <Table
          head={["Question", "Strong answer"]}
          rows={[
            [
              "What are the 10 steps to add a new mgmt-framework feature?",
              "1) SONiC YANG (CONFIG_DB schema). 2) Annotation (OC→SONiC mapping). 3) Transformer (key/field xfmrs). 4) CVL (auto from YANG). 5) Translib (common_app auto-routes). 6) hostcfgd handler (subscribe table, render template). 7) Jinja2 template (daemon config). 8) Verify CONFIG_DB (redis-cli). 9) Test (REST/gNMI/unit). 10) Debug (log triage).",
            ],
            [
              "When do you write a custom translib app vs using common_app?",
              "Use common_app (annotation-based) for simple 1:1 OC↔SONiC mappings, keyonly tables, single-table writes (DNS, NTP, SYSLOG). Write custom app for multi-table transactions (VLAN + VLAN_MEMBER), computed fields (netmask from prefix-length), external APIs (query lldpd), or complex validation beyond YANG.",
            ],
            [
              "What is the annotation file and why is it needed?",
              "Annotations are YANG deviations with sonic-ext extensions. They tell translib: (1) which SONiC table an OC path maps to (table-name), (2) which Go callback extracts keys (key-transformer), (3) which fields map to which leaves (field-name). Without annotations, translib doesn't know DNS=/system/dns → DNS_SERVER table. They bridge OC (vendor-neutral) to SONiC (implementation-specific).",
            ],
            [
              "Explain the transformer callback signature for a key xfmr.",
              "KeyXfmrYangToDb = func(inParams XfmrParams) (string, error). Input: XfmrParams has ygotTarget (OC struct), uri (REST path). Output: Redis key string (e.g., '8.8.8.8'). Reverse: KeyXfmrDbToYang returns map[string]interface{} for GET. Registered via XlateFuncBind in init().",
            ],
            [
              "Why does DNS not need a daemon restart but NTP does?",
              "glibc resolver (getaddrinfo, gethostbyname) reads /etc/resolv.conf on EVERY query (or with short cache). Overwriting the file is enough. chronyd reads chrony.conf at startup ONLY → must SIGHUP or restart. Different daemon behaviors dictate different hostcfgd actions.",
            ],
            [
              "What is CVL and what does it validate?",
              "CVL (Config Validation Library) wraps libyang to validate CONFIG_DB writes against SONiC YANG. Checks: (1) syntax (types, patterns — inet:ip-address rejects 999.1.1.1), (2) semantics (must statements, when conditionals), (3) dependencies (leafrefs, foreign keys). Runs BEFORE Redis write — invalid data never enters CONFIG_DB.",
            ],
            [
              "Annotation says key-transformer 'dns_server_key_xfmr' but you see panic 'callback not found' — why?",
              "The string in annotation MUST match XlateFuncBind first arg exactly. Typo: annotation has 'dns_server_key_xfmr', code has XlateFuncBind('dnsServerKeyXfmr', ...) → runtime panic when translib tries to invoke. Fix: ensure exact string match, recompile.",
            ],
            [
              "REST PATCH returns 204 but redis-cli shows no key — debug steps?",
              "1) Check REST response body (might be 204 but with warning). 2) Check translib logs (journalctl -u rest-server) for write errors. 3) Check CVL logs (might have passed CVL but failed swsscommon write). 4) redis-cli MONITOR during PATCH to see actual commands. 5) Check CONFIG_DB connector initialized (restart mgmt-framework).",
            ],
            [
              "How do you unit-test a transformer callback?",
              "Write Go test in transformer package: mock XfmrParams with fake ygotTarget (OC struct) and uri. Call the xfmr func, assert returned key matches expected. Test happy path (8.8.8.8 → '8.8.8.8') and error cases (999.1.1.1 → error). Run: go test -v ./transformer -run TestDnsServerKeyXfmr.",
            ],
            [
              "What is the difference between sonic-dns.yang and openconfig-system.yang (DNS part)?",
              "openconfig-system.yang is the northbound API (REST/gNMI paths, vendor-neutral, /system/dns/servers/server). sonic-dns.yang is the southbound schema (CONFIG_DB table structure, SONiC-specific, DNS_SERVER table). Annotation bridges them. CVL validates against SONiC YANG. Both are needed.",
            ],
          ]}
        />
      </Section>

      {/* 14 */}
      <Section id="memorize" number="14" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["10 steps", "YANG → annot → xfmr → CVL → translib → hostcfgd → template → DB → test → debug"],
            ["YANG location", "sonic-mgmt-common/models/yang/sonic/sonic-dns.yang"],
            ["Annotation location", "sonic-mgmt-common/models/yang/annotations/openconfig-system-dns-annot.yang"],
            ["Transformer location", "sonic-mgmt-common/translib/transformer/xfmr_dns.go"],
            ["Key xfmr signature", "KeyXfmrYangToDb = func(XfmrParams) (string, error)"],
            ["Annotation essentials", "sonic-ext:table-name, sonic-ext:key-transformer, sonic-ext:field-name"],
            ["hostcfgd handler", "SubscriberStateTable(CFG_DB, 'DNS_SERVER') → dns_server_update callback"],
            ["Template location", "/usr/share/sonic/templates/resolv.conf.j2"],
            ["Template loop", "{% for s in DNS_SERVER %} nameserver {{ s }} {% endfor %}"],
            ["Build methods", "Full rebuild (slow, prod) | container rebuild (faster) | dev-mount (instant, dev)"],
            ["Debug 404", "YANG not loaded → recompile models, rebuild mgmt-framework"],
            ["Debug 500 no table", "Missing annotation table-name → add deviation, recompile YANG"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
