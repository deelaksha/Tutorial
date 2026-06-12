"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "EC2 Lifecycle — Live",
  nodes: [
    { id: "users", icon: "👥", label: "Internet Users", sub: "HTTPS traffic", x: 8, y: 35, color: "#22d3ee" },
    { id: "ami", icon: "📀", label: "AMI", sub: "machine template", x: 12, y: 80, color: "#a78bfa" },
    { id: "sg", icon: "🛡️", label: "Security Group", sub: "stateful firewall", x: 36, y: 35, color: "#fbbf24" },
    { id: "ec2", icon: "🖥️", label: "EC2 Instance", sub: "t3.micro · AZ-a", x: 64, y: 50, color: "#fb923c" },
    { id: "ebs", icon: "💾", label: "EBS Volume", sub: "persistent disk", x: 88, y: 80, color: "#34d399" },
  ],
  edges: [
    { id: "users-sg", from: "users", to: "sg", color: "#22d3ee" },
    { id: "sg-ec2", from: "sg", to: "ec2", color: "#fbbf24" },
    { id: "ami-ec2", from: "ami", to: "ec2", bend: 25, dashed: true, color: "#a78bfa" },
    { id: "ec2-ebs", from: "ec2", to: "ebs", color: "#34d399" },
  ],
  flows: [
    {
      id: "launch",
      name: "🚀 Launch",
      command: "aws ec2 run-instances --image-id ami-123 --instance-type t3.micro",
      steps: [
        { node: "ami", paths: ["ami-ec2"], text: "You pick an AMI — a frozen snapshot of an OS + software. AWS copies it onto fresh hardware in ~60 seconds." },
        { node: "ec2", paths: ["ec2-ebs"], text: "An EBS root volume is created from the AMI and attached. Your instance boots from it like a laptop from its SSD." },
        { node: "ec2", paths: ["sg-ec2"], text: "The Security Group wraps the instance. State: running. Billing starts — per second, only while it runs. 🚀" },
      ],
    },
    {
      id: "serve",
      name: "🌐 Serve traffic",
      command: "GET https://3.91.x.x/ (port 443)",
      steps: [
        { node: "users", paths: ["users-sg"], text: "A user hits the instance's public IP on port 443. The packet must pass the Security Group first." },
        { node: "sg", paths: ["sg-ec2"], text: "SG rule check: \"Allow TCP 443 from 0.0.0.0/0\" → match! Packet passes. (SGs are stateful — reply traffic is auto-allowed.)" },
        { node: "ec2", paths: ["ec2-ebs"], text: "Nginx on the instance reads the page from its EBS volume and responds. Round trip done. 🌐" },
      ],
    },
    {
      id: "blocked",
      name: "⛔ SSH blocked",
      command: "ssh root@3.91.x.x (port 22 from internet)",
      steps: [
        { node: "users", paths: ["users-sg"], text: "An attacker scans the internet and tries SSH (port 22) on your public IP." },
        { node: "sg", paths: [], text: "SG check: no inbound rule for port 22 from 0.0.0.0/0. The packet is DROPPED silently — the attacker sees nothing, not even a rejection. ⛔" },
        { node: "ec2", paths: [], text: "The instance never even saw the packet. This is why you only open the exact ports you need." },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-ec2", label: "What Is EC2?" },
  { id: "launch", label: "Launching — The 7 Decisions ⭐" },
  { id: "instance-types", label: "Instance Types Decoded" },
  { id: "ami-ebs", label: "AMI & EBS Volumes" },
  { id: "sg-keys", label: "Security Groups & Key Pairs ⭐" },
  { id: "user-data", label: "User Data — Boot Scripts" },
  { id: "eip-placement", label: "Elastic IP & Placement Groups" },
  { id: "pricing", label: "Pricing Models ⭐" },
  { id: "scaling-lb", label: "Auto Scaling + LB Preview" },
  { id: "other-compute", label: "Lambda · ECS · EKS · Beanstalk" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsComputePage() {
  return (
    <TopicShell
      icon="🖥️"
      title="Compute — EC2"
      gradientWord="EC2"
      subtitle="EC2 is renting virtual machines by the second. Walk the launch wizard decision by decision — AMI, instance type, key pair, security group, user data — then map the whole compute family: Lambda, ECS, EKS, Fargate, Beanstalk, Batch."
      nav={NAV}
      badges={["🖥️ Launch drawn step-by-step", "💰 Pricing decoded", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🪣", label: "Storage — S3 & Family", href: "/aws/storage" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-ec2" number="01" title="What Is EC2, Precisely?">
        <P>
          <strong>EC2 (Elastic Compute Cloud)</strong> = virtual machines for rent. You pick the
          size, the OS image and the network rules; AWS finds physical hardware in your chosen AZ
          and boots your VM on it — usually in under a minute.
        </P>
        <CodeBlock
          title="ec2_anatomy.txt"
          runnable={false}
          code={`one EC2 instance = 5 parts snapped together:

        ┌──────────────────────────────────┐
        │  🖥️ EC2 INSTANCE  (i-0abc123...)  │
        │                                  │
 what   │  📀 AMI         the OS image     │
 it     │  📏 TYPE        CPU + RAM size   │
 is     │  💾 EBS         its hard disk(s) │
        │                                  │
 how    │  🧱 SECURITY    the firewall     │
 you    │     GROUP                        │
 reach  │  🔑 KEY PAIR    SSH login key    │
 it     └──────────────────────────────────┘
              lives in ONE subnet, ONE AZ`}
        />
        <Callout type="analogy">
          🏨 EC2 is a <strong>hotel for servers</strong>: pick the room size (instance type), how
          it&apos;s furnished (AMI), get a door key (key pair), tell reception who may visit
          (security group) — and check out whenever you want, paying by the second.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="launch" number="02" title="Launching an Instance — The 7 Decisions ⭐">
        <P>
          The console wizard is just seven questions. Know what each one means and you can launch
          (or read someone&apos;s Terraform) with total confidence:
        </P>
        <CodeBlock
          title="launch_wizard_flow.txt"
          runnable={false}
          code={`EC2 → "Launch instance"
 │
 ├ 1️⃣ NAME            my-web-server         (just a tag)
 ├ 2️⃣ AMI             which OS image?       Amazon Linux / Ubuntu...
 ├ 3️⃣ INSTANCE TYPE   how big?              t3.micro = 2 vCPU, 1GB
 ├ 4️⃣ KEY PAIR        SSH key for login     download .pem ONCE!
 ├ 5️⃣ NETWORK         which VPC/subnet?     + security group rules
 ├ 6️⃣ STORAGE         root EBS volume       8GB gp3 default
 └ 7️⃣ USER DATA       boot script           (advanced, optional)
        │
        ▼  Launch 🚀
 pending ──▶ running ──▶ (stopping ⇄ stopped) ──▶ terminated 💀
              │ billed       stopped = not billed     gone forever
              ▼              (but EBS disk still is)
 $ ssh -i key.pem ec2-user@<public-ip>   ← you're in ✅`}
        />
        <Table
          head={["Lifecycle state", "CPU billed?", "EBS billed?", "Can come back?"]}
          rows={[
            ["running", "✅ yes", "✅ yes", "—"],
            ["stopped", "❌ no", "✅ yes (disk persists)", "✅ start again (public IP changes!)"],
            ["terminated", "❌ no", "❌ root disk deleted by default", "💀 never"],
          ]}
        />
        <Callout type="mistake">
          Stop vs terminate: <strong>stop</strong> = pause (disk kept, restart later);{" "}
          <strong>terminate</strong> = destroy. And a stopped instance usually gets a{" "}
          <em>different public IP</em> on restart — the Elastic IP section fixes that.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="instance-types" number="03" title="Instance Types — Decoding t3.micro">
        <CodeBlock
          title="instance_type_decoder.txt"
          runnable={false}
          code={`        t  3  .  micro
        │  │       │
        │  │       └── SIZE: nano→micro→small→medium→large→xlarge→...
        │  │           each step ≈ doubles CPU + RAM (and price)
        │  └── GENERATION: 3rd gen of this family (newer = better/cheaper)
        └── FAMILY: what it's optimized FOR

 the families that matter:
 ┌────────┬──────────────────────┬───────────────────────────┐
 │ t, m   │ ⚖️ general purpose    │ web servers, dev, most    │
 │ c      │ 🧮 compute optimized  │ batch, encoding, gaming   │
 │ r, x   │ 🧠 memory optimized   │ big caches, in-mem DBs    │
 │ i, d   │ 💾 storage optimized  │ high-IO databases         │
 │ p, g   │ 🎮 GPU / accelerated  │ ML training, graphics     │
 └────────┴──────────────────────┴───────────────────────────┘`}
        />
        <Table
          head={["Type", "vCPU", "RAM", "~On-demand $/hr", "Good for"]}
          rows={[
            [<IC key="1">t3.micro</IC>, "2", "1 GB", "$0.0104 (free tier)", "learning, tiny sites"],
            [<IC key="2">t3.medium</IC>, "2", "4 GB", "$0.0416", "small apps"],
            [<IC key="3">m5.large</IC>, "2", "8 GB", "$0.096", "general production"],
            [<IC key="4">c5.xlarge</IC>, "4", "8 GB", "$0.17", "CPU-heavy work"],
            [<IC key="5">r5.large</IC>, "2", "16 GB", "$0.126", "memory-hungry apps"],
          ]}
        />
        <Callout type="behind">
          The <IC>t</IC> family is <strong>burstable</strong>: you earn CPU credits while idle
          and spend them in bursts. Great for spiky workloads (websites), terrible for sustained
          100% CPU — credits run out and you get throttled.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="ami-ebs" number="04" title="AMI & EBS — The Image and the Disk">
        <P>
          An <strong>AMI (Amazon Machine Image)</strong> is the template the instance boots from:
          OS + pre-installed software + disk snapshot. An <strong>EBS volume</strong> is the
          network-attached hard disk it runs on:
        </P>
        <CodeBlock
          title="ami_and_ebs.txt"
          runnable={false}
          code={`AMI (template)            launch          INSTANCE + EBS (live)
 ┌────────────────┐      ──────▶          ┌─────────────┐
 │ Ubuntu 24.04   │                       │ 🖥️ i-0abc    │
 │ + nginx        │      one AMI,         │   │attached  │
 │ + your app     │      many             │   ▼          │
 │ (frozen disk   │      instances        │ 💾 EBS vol   │
 │  snapshot)     │                       │ (the disk)   │
 └────────────────┘                       └─────────────┘
        ▲                                        │
        └────────── "create image" ◀─────────────┘
            golden AMI: configure once, stamp out clones

 EBS facts:
 • network-attached → survives instance stop, can detach/re-attach
 • locked to ONE AZ → move via snapshot (stored in S3)
 • snapshot = incremental backup → restore / copy across AZ+region`}
        />
        <Table
          head={["EBS type", "What", "Use"]}
          rows={[
            [<IC key="1">gp3</IC>, "general purpose SSD (the default)", "almost everything"],
            [<IC key="2">io2</IC>, "provisioned-IOPS SSD", "critical databases"],
            [<IC key="3">st1</IC>, "throughput HDD", "big sequential data, logs"],
            [<IC key="4">sc1</IC>, "cold HDD (cheapest)", "rarely-accessed archives"],
          ]}
        />
        <Callout type="tip">
          The &quot;golden AMI&quot; pattern: configure one perfect instance → create AMI → Auto
          Scaling launches identical clones in seconds. This is how fleets stay consistent.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="sg-keys" number="05" title="Security Groups & Key Pairs ⭐">
        <P>
          A <strong>security group</strong> is a virtual firewall wrapped around the instance.
          Rules say who may connect, on which port:
        </P>
        <CodeBlock
          title="security_group.txt"
          runnable={false}
          code={`            INBOUND rules (who may come IN)
 ┌──────────────────────────────────────────────────┐
 │ port 22 (SSH)    ← only MY IP   203.0.113.5/32   │
 │ port 80 (HTTP)   ← anyone       0.0.0.0/0        │
 │ port 443 (HTTPS) ← anyone       0.0.0.0/0        │
 │ everything else  ← ⛔ blocked (default deny)     │
 │                                                  │
 │              🖥️ EC2 instance                     │
 │                                                  │
 │ OUTBOUND: everything allowed (default)           │
 └──────────────────────────────────────────────────┘

 ⭐ security groups are STATEFUL:
 inbound request allowed → its response is auto-allowed out
 (no need to write a matching outbound rule)`}
        />
        <Table
          head={["Fact", "Detail"]}
          rows={[
            ["Default inbound", "deny ALL — you open ports explicitly"],
            ["ALLOW rules only", "no deny rules (NACLs do deny — VPC topic)"],
            ["Source can be", "an IP/CIDR — or another security group (powerful!)"],
            ["Stateful", "responses auto-allowed back"],
            ["Attach", "many SGs per instance, one SG on many instances"],
          ]}
        />
        <CodeBlock
          title="key_pair.txt"
          runnable={false}
          code={`KEY PAIR — how you SSH in without a password:

 create key pair → AWS keeps PUBLIC key 🔓 → baked into instance
                 → YOU download PRIVATE key 🔑 my-key.pem (ONLY ONCE!)

 $ chmod 400 my-key.pem                       # private = readable by you only
 $ ssh -i my-key.pem ec2-user@54.23.11.8      # cryptographic handshake ✅

 lose the .pem? AWS does NOT have a copy. (recovery = painful disk surgery)`}
        />
        <Callout type="mistake">
          Opening SSH (22) to <IC>0.0.0.0/0</IC> = the whole internet can knock. Bots brute-force
          public port 22 within minutes. Always restrict SSH to your IP — or skip SSH entirely
          with SSM Session Manager.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="user-data" number="06" title="User Data — The Script That Runs at First Boot">
        <P>
          <strong>User data</strong> is a script you paste at launch; the instance runs it as
          root on first boot. It turns &quot;launch, then SSH in and install things by hand&quot;
          into &quot;launch a finished server&quot;:
        </P>
        <CodeBlock
          title="user_data.sh"
          runnable={false}
          code={`#!/bin/bash
# runs ONCE, as root, on first boot
dnf update -y
dnf install -y nginx
echo "<h1>Hello from $(hostname -f)</h1>" > /usr/share/nginx/html/index.html
systemctl enable --now nginx`}
          output={`timeline:
 0:00  Launch clicked
 0:40  instance running, user-data executing...
 1:30  ✅ http://<public-ip> serves the page
       no SSH. no manual steps. born configured.`}
        />
        <Callout type="behind">
          User data is read through the <strong>instance metadata service</strong> at{" "}
          <IC>http://169.254.169.254</IC> — the same magic endpoint where attached IAM roles hand
          out temporary credentials. Auto Scaling depends on user data: every auto-launched
          instance must configure itself, because nobody will SSH into it.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="eip-placement" number="07" title="Elastic IP & Placement Groups">
        <CodeBlock
          title="elastic_ip.txt"
          runnable={false}
          code={`PROBLEM: stop → start = NEW public IP 😱 (DNS now points nowhere)

 without EIP:                      with ELASTIC IP:
 mon: 54.23.11.8                   📌 3.220.10.5 — yours until released
 tue: 18.205.7.77  (changed!)         survives stop/start
 wed: 35.170.2.41  (again!)           can re-map to a REPLACEMENT
                                      instance in seconds (failover!)

 pricing irony: in use = pennies · allocated but UNUSED = billed idle
 (AWS wants IPv4 addresses back — release what you don't use)`}
        />
        <Table
          head={["Placement group", "Layout", "For", "Trade-off"]}
          rows={[
            [<strong key="c">Cluster</strong>, "packed tightly, same rack(s), one AZ", "HPC, lowest latency", "one hardware failure hits many"],
            [<strong key="s">Spread</strong>, "each instance on distinct hardware", "critical small fleets (max 7/AZ)", "limited size"],
            [<strong key="p">Partition</strong>, "groups on separate racks", "Kafka, Hadoop, Cassandra", "you manage partition awareness"],
          ]}
        />
        <Callout type="note">
          Most apps never need placement groups — the default spread AWS gives you is fine.
          They appear in interviews as &quot;how do you get the lowest network latency between
          instances?&quot; → cluster placement group.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="pricing" number="08" title="Pricing Models — The Same VM, 4 Prices ⭐">
        <CodeBlock
          title="pricing_models.txt"
          runnable={false}
          code={`the same m5.large, four ways to pay:

 ON-DEMAND        $0.096/hr   no commitment, start/stop anytime
    │                         → spiky, unknown, short-term work
    ▼
 SAVINGS PLAN /   ~40% off    commit 1 or 3 years of usage
 RESERVED            │        → steady 24/7 workloads (that web app)
    ▼                ▼
 SPOT             up to 90%   bid on SPARE capacity...
                  off 🤑      ⚠️ AWS can reclaim with 2-min warning!
                              → batch, CI, rendering — interruptible
 DEDICATED HOST   $$$$        a whole physical server for you alone
                              → license / compliance requirements

 real fleet pattern:
   baseline (always on)  → reserved/savings plan
   daily peaks           → on-demand
   batch / experiments   → spot`}
        />
        <Table
          head={["Model", "Discount", "Catch"]}
          rows={[
            ["On-Demand", "0%", "most expensive per hour"],
            ["Reserved / Savings Plans", "up to ~72%", "1-3 year commitment"],
            ["Spot", "up to ~90%", "2-minute reclaim warning"],
            ["Dedicated Host", "negative 😄", "pay for the whole box"],
          ]}
        />
        <Callout type="tip">
          Exam keyword-matching: &quot;fault-tolerant batch processing, lowest cost&quot; →{" "}
          <strong>Spot</strong>. &quot;steady-state 24/7 for 3 years&quot; →{" "}
          <strong>Reserved/Savings Plan</strong>. &quot;server-bound license&quot; →{" "}
          <strong>Dedicated Host</strong>.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="scaling-lb" number="09" title="Auto Scaling & Load Balancing — The 30-Second Preview">
        <P>
          One instance is a single point of failure. The production pattern — covered in full in
          its own topic — is a <strong>fleet behind a load balancer that grows and shrinks</strong>:
        </P>
        <CodeBlock
          title="the_production_pattern.txt"
          runnable={false}
          code={`                 🌐 users
                    │
              ┌─────▼─────┐
              │    ELB    │  spreads traffic, health-checks
              └─────┬─────┘
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   🖥️ EC2 (1a)  🖥️ EC2 (1b)  🖥️ EC2 (1a)...
   └────────── AUTO SCALING GROUP ──────────┘
    min: 2   desired: 3   max: 10
    CPU > 70%? → launch more (from golden AMI + user data)
    CPU < 30%? → terminate extras
    instance dies? → replaced automatically 🪄`}
        />
        <Callout type="note">
          Notice how the pieces you just learned snap together: <strong>AMI</strong> +{" "}
          <strong>user data</strong> let clones self-configure; <strong>security groups</strong>{" "}
          let the LB reach them; <strong>multi-AZ</strong> placement survives outages. Full deep
          dive in the Load Balancing &amp; Auto Scaling topic.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="other-compute" number="10" title="The Rest of the Compute Family">
        <CodeBlock
          title="compute_decision_flow.txt"
          runnable={false}
          code={`"where should my code run?" — the flowchart:

 need full OS control / long-running custom anything?
   └─ yes → 🖥️ EC2 (you've just learned it)
 short event-driven functions (<15 min)?
   └─ yes → λ Lambda — zero servers, pay per ms (own topic)
 app is in containers?
   ├─ want AWS-simple orchestration → 📦 ECS
   ├─ need Kubernetes / portability → ☸️ EKS
   └─ either way, who runs the nodes?
        ├─ EC2     → you manage the instances
        └─ Fargate → serverless containers, no nodes 🪄
 "just deploy my web app, set it up for me"?
   └─ yes → 🌱 Elastic Beanstalk — PaaS (it creates EC2+LB+ASG for you)
 1000s of queued batch jobs?
   └─ yes → 🧮 AWS Batch — schedules them on EC2/Spot/Fargate`}
        />
        <Table
          head={["Service", "One-liner", "You manage"]}
          rows={[
            ["EC2", "rent VMs", "OS and everything above"],
            ["Lambda", "run functions on events", "just code"],
            ["ECS", "AWS-native container orchestrator", "containers + (EC2 nodes unless Fargate)"],
            ["EKS", "managed Kubernetes", "k8s objects + nodes (unless Fargate)"],
            ["Fargate", "serverless engine FOR ECS/EKS", "container specs only"],
            ["Elastic Beanstalk", "PaaS — upload code, get a running stack", "code + config knobs"],
            ["Batch", "managed batch job scheduler", "job definitions"],
          ]}
        />
        <Callout type="tip">
          Fargate confuses everyone: it&apos;s not an orchestrator — it&apos;s a{" "}
          <strong>launch type</strong> (the compute under ECS or EKS), removing node management.
          Containers get their own full topic later.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["EC2", "virtual machines by the second, in one AZ"],
            ["Launch decisions", "AMI · type · key pair · SG · storage · user data"],
            ["t3.micro decoded", "family t · gen 3 · size micro (burstable)"],
            ["stop vs terminate", "stop = pause (disk kept) · terminate = gone"],
            ["AMI", "boot template; golden AMI = configure once, clone"],
            ["EBS", "network disk, single-AZ, snapshot to move/backup"],
            ["Security group", "stateful firewall, allow-only, default deny in"],
            ["Key pair", ".pem downloaded ONCE — AWS keeps no copy"],
            ["User data", "root script at first boot — self-configuring servers"],
            ["Elastic IP", "static public IP; billed when sitting unused"],
            ["Pricing", "on-demand · reserved/savings · spot (-90%, 2-min warn)"],
            ["Compute picker", "VM→EC2 · function→Lambda · container→ECS/EKS (+Fargate) · PaaS→Beanstalk"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
