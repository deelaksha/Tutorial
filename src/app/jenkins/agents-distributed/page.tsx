"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Build Dispatch — Live",
  nodes: [
    { id: "controller", icon: "🎛️", label: "Controller", sub: "schedules only", x: 10, y: 30, color: "#a78bfa" },
    { id: "queue", icon: "📋", label: "Build Queue", sub: "waiting jobs", x: 30, y: 18, color: "#fbbf24" },
    { id: "linux", icon: "🐧", label: "Linux Agent", sub: "label: linux", x: 55, y: 15, color: "#34d399" },
    { id: "docker", icon: "🐳", label: "Docker Agent", sub: "ephemeral", x: 55, y: 50, color: "#22d3ee" },
    { id: "windows", icon: "🪟", label: "Windows Agent", sub: "label: windows", x: 55, y: 82, color: "#fb923c" },
    { id: "result", icon: "✅", label: "Build Complete", x: 85, y: 30, color: "#f472b6" },
  ],
  edges: [
    { id: "ctrl-queue", from: "controller", to: "queue", color: "#fbbf24" },
    { id: "q-linux", from: "queue", to: "linux", color: "#34d399" },
    { id: "q-docker", from: "queue", to: "docker", color: "#22d3ee" },
    { id: "q-windows", from: "queue", to: "windows", color: "#fb923c" },
    { id: "linux-result", from: "linux", to: "result", color: "#34d399" },
    { id: "docker-result", from: "docker", to: "result", color: "#22d3ee" },
    { id: "windows-result", from: "windows", to: "result", color: "#fb923c" },
    { id: "q-reroute", from: "queue", to: "linux", bend: -30, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "label-routing",
      name: "🏷️ Label routing",
      command: "agent { label 'linux' } — job finds its agent",
      steps: [
        { node: "controller", paths: ["ctrl-queue"], text: "Pipeline triggers: agent{label 'linux'} in Jenkinsfile. Controller never builds — it queues the job." },
        { node: "queue", paths: ["q-linux"], text: "Queue matches label 'linux' → dispatches to the Linux agent (not Windows, not Docker)." },
        { node: "linux", paths: ["linux-result"], text: "Linux agent checks out code, runs the pipeline stages, reports back to controller." },
        { node: "result", paths: [], text: "Build #42 success. Controller stored logs/artifacts — agent is clean for next job. 🎯" },
      ],
    },
    {
      id: "agent-offline",
      name: "🔴 Agent offline",
      command: "target agent disconnected — queue waits, then reroutes",
      steps: [
        { node: "queue", paths: [], text: "Job needs label 'windows', but Windows agent just went offline. Queue holds the job." },
        { node: "queue", paths: ["q-reroute"], text: "Timeout or admin intervention: reroute to a secondary agent with same label, or wait for reconnect." },
        { node: "linux", paths: ["linux-result"], text: "Fallback: label expanded to 'linux || windows' — Linux agent picks it up instead." },
      ],
    },
    {
      id: "parallel",
      name: "⚡ Parallel stages",
      command: "parallel { stage('A')… stage('B')… stage('C')… }",
      steps: [
        { node: "queue", paths: ["q-linux", "q-docker", "q-windows"], text: "Pipeline declares parallel{} with 3 stages. Controller queues 3 executors simultaneously." },
        { node: "linux", paths: [], text: "Stage A → Linux agent. Stage B → Docker agent. Stage C → Windows agent. All running at once." },
        { node: "result", paths: ["linux-result", "docker-result", "windows-result"], text: "All 3 finish → pipeline merges results. Total time = slowest stage, not sum. Fan-out win. ⚡" },
      ],
    },
  ],
};

const NAV = [
  { id: "one-machine-wall", label: "The One-Machine Wall" },
  { id: "controller-agent", label: "Controller vs Agent ⭐" },
  { id: "executors", label: "Executors — Concurrency Slots" },
  { id: "connecting", label: "Connecting Agents ⭐" },
  { id: "labels", label: "Labels & Targeting" },
  { id: "docker-agents", label: "Docker Agents — Clean Rooms ⭐" },
  { id: "parallel", label: "Parallel Stages — Fan-Out ⭐" },
  { id: "queue-throttle", label: "Queue & Throttling" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsAgentsDistributedPage() {
  return (
    <TopicShell
      icon="🎩"
      title="Jenkins: Agents & Distributed Builds"
      gradientWord="Agents"
      subtitle="Why one machine doesn&apos;t scale, how Jenkins splits controller (brain) from agents (muscle), labels, Docker agents that spawn clean rooms per build, and parallel stages that turn 30 minutes into 8."
      nav={NAV}
      badges={["🐧🪟🐳 Multi-platform", "⚡ Parallel builds", "🏷️ Label routing"]}
      next={{ icon: "🔌", label: "Integrations", href: "/jenkins/integrations" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="one-machine-wall" number="01" title="The One-Machine Wall">
        <CodeBlock
          title="the_bottleneck.txt"
          runnable={false}
          code={`scenario: 10 teams, 1 Jenkins server, 1 machine

team A pushes → build #1 starts (node.js tests: 8 min)
team B pushes → queued… waiting for #1
team C pushes → queued… waiting for #1, #2
team D pushes → queued…
builds 5-10 → all queued

by 9am: 27 jobs in queue, avg wait time: 41 minutes 🚨

the problem:
┌─────────────────┐
│  Jenkins        │  ← 1 CPU doing EVERYTHING:
│  controller     │     • serving web UI
│  = the server   │     • running git clone
│                 │     • running tests
│                 │     • running npm build
│                 │     • zipping artifacts
└─────────────────┘     • the ACTUAL work

solution: split BRAIN (schedule) from MUSCLE (build) ⚡`}
        />
        <Callout type="analogy">
          🏭 A factory foreman (controller) doesn&apos;t also operate the 10 machines on the floor —
          they assign jobs to workers (agents). Jenkins scales the same way: controller delegates.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="controller-agent" number="02" title="Controller vs Agent — The Split ⭐">
        <CodeBlock
          title="controller_agent_roles.txt"
          runnable={false}
          code={`CONTROLLER (the brain) 🧠              AGENT (the muscle) 💪
┌──────────────────────────┐          ┌─────────────────────────┐
│ • serves web UI          │          │ • receives job from     │
│ • stores job configs     │ ───────▶ │   controller            │
│ • schedules builds       │          │ • clones git repo       │
│ • holds build history    │          │ • runs shell/scripts    │
│ • manages queue          │          │ • executes tests        │
│ • triggers webhooks      │          │ • sends logs back       │
│ • keeps artifacts        │          │ • DISPOSABLE — can      │
│ • NO building (ideally)  │          │   crash, wipe, restart  │
└──────────────────────────┘          └─────────────────────────┘
         |                                      |
         └──────────────────┬───────────────────┘
                            ▼
           CONTROLLER SHOULD BUILD **NOTHING**
           (set # of executors = 0 on controller)

agents connect TO controller via:
  • SSH (controller initiates)
  • JNLP (agent initiates — for firewalls/cloud)
  • Kubernetes pods (ephemeral, auto-scaled) 🐳`}
        />
        <P>
          The golden rule: <IC>controller = stateful + precious</IC>, <IC>agents = stateless +
          cattle</IC>. Agents can die; the controller must not. Backups go to the controller&apos;s{" "}
          <IC>JENKINS_HOME</IC>.
        </P>
      </Section>

      {/* 03 */}
      <Section id="executors" number="03" title="Executors — Concurrency Slots">
        <CodeBlock
          title="executors.txt"
          runnable={false}
          code={`executor = 1 concurrent build slot

agent with 4 executors:
┌────────────────────────────┐
│  Agent: linux-builder-01   │
│  ┌──────┐ ┌──────┐         │  4 executors = 4 builds
│  │ exec │ │ exec │         │  running at once
│  │  #1  │ │  #2  │         │
│  └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐         │
│  │ exec │ │ exec │         │
│  │  #3  │ │  #4  │         │
│  └──────┘ └──────┘         │
└────────────────────────────┘

if 5th build arrives → queued until a slot frees

rule of thumb: # executors ≈ # CPU cores
(but: I/O-bound jobs can oversubscribe 2x)

controller executors: SET TO ZERO ⚠️
  Manage Jenkins → Nodes → Built-In Node → Configure
  # of executors: 0  ← force all builds to agents`}
        />
        <Callout type="mistake">
          ⚠️ Leaving controller executors &gt; 0 is the #1 accidental-bloat mistake. Builds fill
          the controller disk, slow the UI, and crash Jenkins. Always zero.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="connecting" number="04" title="Connecting Agents — SSH vs JNLP ⭐">
        <CodeBlock
          title="agent_connection_flow.txt"
          runnable={false}
          code={`TWO modes:

1️⃣  SSH (controller → agent)
    ┌────────────┐               ┌──────────────┐
    │ controller │─── SSH ───▶   │ agent (sshd) │
    └────────────┘  port 22       └──────────────┘
                    controller     Linux/Mac box
                    initiates      with SSH server

    pros: standard SSH key auth, works for on-prem VMs
    cons: controller must reach agent (firewall pain)

2️⃣  JNLP / inbound agent (agent → controller)
    ┌──────────────┐             ┌────────────┐
    │ agent starts │─── HTTPS ──▶│ controller │
    │ agent.jar    │  port 443/50000└────────────┘
    └──────────────┘   agent
                       initiates

    pros: works through firewalls, NAT, cloud VPCs
    cons: need to run agent.jar on agent box

setup JNLP agent:
  Manage Jenkins → Nodes → New Node → Permanent Agent
  → Launch method: "Launch agent by connecting it to controller"
  → copy the secret + command, run on agent:

    java -jar agent.jar \\
      -url https://jenkins.company.com \\
      -secret abc123... \\
      -name linux-agent-01 \\
      -workDir /var/jenkins

  (or use Docker: jenkins/inbound-agent image 🐳)`}
        />
        <Table
          head={["Method", "Direction", "Use when…", "Auth"]}
          rows={[
            ["SSH", "Controller → Agent", "Agents are on-prem VMs, controller can reach them", "SSH key"],
            ["JNLP (inbound)", "Agent → Controller", "Agents behind firewall / cloud / dynamic IPs", "Secret token"],
            ["Kubernetes", "Controller ↔ Pods", "Cloud-native, auto-scale, ephemeral agents", "K8s RBAC"],
          ]}
        />
      </Section>

      {/* 05 */}
      <Section id="labels" number="05" title="Labels & Targeting — Routing Builds">
        <CodeBlock
          title="labels.txt"
          runnable={false}
          code={`labels = tags on agents, used by pipelines to pick where to run

agent setup (Manage Jenkins → Nodes → node → Configure):
  Name: linux-builder-02
  Labels: linux docker x64
          ───┬─── ───┬─── ──┬──
             │       │      └─ custom tag
             │       └──────── has Docker installed
             └──────────────── OS family

Jenkinsfile:
pipeline {
  agent { label 'linux && docker' }  // AND logic
  stages {
    stage('Build') {
      steps {
        sh 'docker build -t app:latest .'
      }
    }
  }
}

controller sees "linux && docker" → dispatches to agents
matching BOTH labels (linux-builder-02 ✅, windows-agent ❌)

you can also do per-stage agents:
pipeline {
  agent none  // no default
  stages {
    stage('Build') {
      agent { label 'linux' }
      steps { sh 'go build' }
    }
    stage('Test Windows') {
      agent { label 'windows' }
      steps { bat 'run_tests.bat' }
    }
  }
}

each stage runs on its SPECIFIC agent 🎯`}
        />
        <Callout type="tip">
          💡 Use labels for OS (linux/windows/mac), tools (docker/kubernetes/golang), and
          environment (staging/prod) — not server names. Labels = capability tags, not inventory.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="docker-agents" number="06" title="Docker Agents — Clean Rooms per Build ⭐">
        <CodeBlock
          title="docker_agent.groovy"
          code={`pipeline {
  agent {
    docker {
      image 'golang:1.22'
      args '-v /tmp:/tmp'  // optional: mount host volumes
    }
  }
  stages {
    stage('Build') {
      steps {
        sh '''
          go version        # Go 1.22 from the image
          go build -o app .
        '''
      }
    }
  }
}

# what happens under the hood:
# 1. Jenkins finds an agent with Docker + label match
# 2. Agent runs: docker run -d golang:1.22 cat  (keeps container alive)
# 3. Agent runs build commands INSIDE the container
# 4. Build finishes → agent runs: docker rm -f <container>
# 5. Next build = brand new container, zero leftover state ✨

the win: every build gets a CLEAN environment — no:
  "works on my machine" / stale deps / version drift / cross-job pollution`}
          output={`[Pipeline] node (allocates agent)
[Pipeline] docker.image('golang:1.22').inside
$ docker run -d --rm golang:1.22 cat
abc123def456 (container started)
[Build] running in abc123def456
+ go version
go version go1.22.0 linux/amd64
+ go build -o app .
✅ Build successful
$ docker rm -f abc123def456
[Pipeline] End of Pipeline`}
        />
        <CodeBlock
          title="docker_agent_matrix.txt"
          runnable={false}
          code={`the pattern — test on 3 Go versions in parallel:

pipeline {
  agent none
  stages {
    stage('Test Matrix') {
      matrix {
        axes {
          axis {
            name 'GO_VERSION'
            values '1.20', '1.21', '1.22'
          }
        }
        agent {
          docker {
            image "golang:\${GO_VERSION}"  // ← escaped!
          }
        }
        stages {
          stage('Test') {
            steps {
              sh 'go test ./...'
            }
          }
        }
      }
    }
  }
}

result: 3 containers, 3 parallel test runs, 3 Go versions ⚡
(if you have 3 agents/executors — otherwise queued)`}
        />
        <Callout type="behind">
          🔍 Behind the scenes: Jenkins uses the Docker Pipeline plugin to run{" "}
          <IC>docker.image().inside &#123;...&#125;</IC> blocks. The agent needs Docker installed +
          Jenkins user added to the <IC>docker</IC> group. Cloud agents often come
          Docker-pre-baked.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="parallel" number="07" title="Parallel Stages — Fan-Out ⭐">
        <CodeBlock
          title="parallel_stages.groovy"
          code={`pipeline {
  agent { label 'linux' }
  stages {
    stage('Tests') {
      parallel {
        stage('Unit') {
          steps {
            sh 'npm run test:unit'  // 5 min
          }
        }
        stage('Lint') {
          steps {
            sh 'npm run lint'       // 2 min
          }
        }
        stage('Integration') {
          steps {
            sh 'npm run test:integration'  // 8 min
          }
        }
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'  // runs AFTER all 3 parallel stages finish
      }
    }
  }
}

# serial: 5 + 2 + 8 = 15 minutes
# parallel: max(5, 2, 8) = 8 minutes ⚡

requirement: you need 3 executors available
(1 agent with 3 executors, or 3 agents with 1 each)`}
          output={`[Pipeline] parallel
[Unit] npm run test:unit
[Lint] npm run lint
[Integration] npm run test:integration
(all 3 running simultaneously)
[Unit] ✅ 127 tests passed (5m 03s)
[Lint] ✅ No issues (2m 11s)
[Integration] ✅ 34 tests passed (8m 07s)
[Pipeline] stage('Build')
[Build] npm run build
✅ Build complete`}
        />
        <CodeBlock
          title="parallel_fan_out_ascii.txt"
          runnable={false}
          code={`visual: parallel stages with failFast

         ┌─────────────┐
         │ Checkout    │
         └──────┬──────┘
                │
       ┌────────┴─────────┐
       │  parallel {      │
       │   failFast true  │ ← stop all if ANY fails
       │  }               │
       └─┬──────┬────────┬┘
         │      │        │
    ┌────▼───┐ │  ┌─────▼────┐
    │ Unit   │ │  │ E2E      │
    │ Tests  │ │  │ Tests    │
    └────┬───┘ │  └─────┬────┘
         │  ┌──▼───┐    │
         │  │ Lint │    │
         │  └──┬───┘    │
         └─────┼────────┘
               │
         ┌─────▼──────┐
         │ Build      │  ← waits for ALL parallel to finish
         └────────────┘

failFast: true → if Lint fails at 2min, Jenkins kills Unit+E2E immediately
failFast: false → all 3 run to completion, then pipeline fails (see all errors)`}
        />
        <Callout type="tip">
          💡 Parallel is ideal for: testing on multiple platforms (Linux + Windows + Mac), linting
          + tests, or deploying to multiple regions. Just ensure stages are INDEPENDENT — no shared
          state.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="queue-throttle" number="08" title="Queue & Throttling — Preventing Overload">
        <CodeBlock
          title="queue_mechanics.txt"
          runnable={false}
          code={`the build queue (Jenkins UI → Build Queue sidebar)

waiting jobs:
┌─────────────────────────────────────┐
│ #47 my-app (waiting for executor)  │  ← no agents/executors free
│ #48 my-app (waiting for executor)  │
│ #49 other-job (offline: no agent   │  ← label 'windows' but windows
│                 matching linux)     │     agent is offline
└─────────────────────────────────────┘

Jenkins picks jobs FIFO (first in, first out) by default
BUT: you can set priorities, throttle per-job, or use folders

THROTTLE plugin (install from Plugin Manager):
  limits HOW MANY builds of the SAME job run concurrently

pipeline {
  options {
    throttle(['my-app-throttle'])  // category name
  }
  agent any
  stages { ... }
}

in Jenkins global config:
  Throttle Concurrent Builds → Add Category
  Category: my-app-throttle
  Max concurrent per node: 1
  Max concurrent total: 3

result: even if 10 devs push at once, only 3 builds
of my-app run simultaneously (prevents resource storms) 🌊`}
        />
        <Table
          head={["Problem", "Solution", "Example"]}
          rows={[
            ["Too many builds queued", "Add more agents / executors", "Scale from 2 agents → 5 agents"],
            ["One job hogging all executors", "Throttle category", "Max 2 concurrent per job type"],
            ["Builds waiting for specific label", "Add agent with that label, or broaden label logic", "'windows' → 'windows || linux'"],
            ["Agent offline", "Auto-retry or notification plugin", "Slack alert when agent goes offline"],
          ]}
        />
        <Callout type="note">
          📌 The queue is visible in the Jenkins UI and via the REST API (<IC>/queue/api/json</IC>).
          Monitoring queue length is a key SRE metric — sustained queue = under-provisioned agents.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Controller role", "schedule, queue, UI, store — NEVER build (executors = 0)"],
            ["Agent role", "clone, run, test — stateless & disposable"],
            ["Executors", "concurrent build slots per agent (≈ # CPU cores)"],
            ["SSH connection", "controller → agent (needs network reach)"],
            ["JNLP connection", "agent → controller (works through firewalls)"],
            ["Labels", "agent { label 'linux && docker' } — tags for routing"],
            ["Docker agent", "agent { docker { image 'golang:1.22' } } — clean room per build"],
            ["Parallel stages", "parallel { stage('A')… } — fan-out, requires N executors"],
            ["failFast", "parallel { failFast true } — kill all if any fails"],
            ["Throttle", "options { throttle(['category']) } — limit concurrent same-job builds"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
