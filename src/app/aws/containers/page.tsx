"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "ECS on Fargate — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "Developer", sub: "docker push", x: 8, y: 50, color: "#22d3ee" },
    { id: "ecr", icon: "📦", label: "ECR", sub: "image registry", x: 32, y: 18, color: "#fb923c" },
    { id: "ecs", icon: "🎼", label: "ECS Service", sub: "desired count: 2", x: 50, y: 60, color: "#a78bfa" },
    { id: "t1", icon: "🐳", label: "Task 1", sub: "Fargate · AZ-a", x: 82, y: 22, color: "#34d399" },
    { id: "t2", icon: "🐳", label: "Task 2", sub: "Fargate · AZ-b", x: 82, y: 78, color: "#34d399" },
  ],
  edges: [
    { id: "dev-ecr", from: "dev", to: "ecr", color: "#22d3ee" },
    { id: "ecr-ecs", from: "ecr", to: "ecs", dashed: true, color: "#fb923c" },
    { id: "ecs-t1", from: "ecs", to: "t1", color: "#34d399" },
    { id: "ecs-t2", from: "ecs", to: "t2", color: "#34d399" },
    { id: "ecr-t1", from: "ecr", to: "t1", bend: -25, dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "ship",
      name: "🚢 Push & deploy",
      command: "docker push …amazonaws.com/myapp:v2",
      steps: [
        { node: "dev", paths: ["dev-ecr"], text: "You build the image locally and push myapp:v2 to ECR — AWS's private Docker registry." },
        { node: "ecs", paths: ["ecr-ecs"], text: "You update the task definition to :v2 and tell the ECS service to deploy. ECS plans a rolling replacement." },
        { node: "t1", paths: ["ecr-t1", "ecs-t1"], text: "Fargate provisions micro-VMs (no EC2 to manage!), pulls the image from ECR, and starts fresh tasks. 🚢" },
      ],
    },
    {
      id: "rolling",
      name: "🔄 Rolling update",
      command: "deployment: minimumHealthy 100%, maximum 200%",
      steps: [
        { node: "ecs", paths: ["ecs-t1"], text: "ECS starts NEW v2 tasks alongside the old v1 tasks — capacity temporarily goes to 200%." },
        { node: "t1", paths: ["ecs-t1"], text: "v2 tasks pass ALB health checks. Only then does ECS start draining connections from v1 tasks." },
        { node: "t2", paths: ["ecs-t2"], text: "Old tasks stop. Deploy complete with ZERO downtime. Bad version? It never passes health checks and ECS rolls back. 🔄" },
      ],
    },
    {
      id: "heal",
      name: "💥 Self-healing",
      command: "Task 2 OOM-killed (exit 137)",
      steps: [
        { node: "t2", paths: ["ecs-t2"], text: "💥 Task 2 runs out of memory and dies. Running count drops to 1 — below the desired count of 2." },
        { node: "ecs", paths: ["ecs-t2"], text: "The ECS service control loop notices within seconds: desired 2 ≠ running 1 → schedule a replacement." },
        { node: "t2", paths: ["ecr-t1", "ecs-t2"], text: "A fresh task pulls the image and joins the load balancer. Nobody got paged — orchestration is a thermostat. 💥→🐳" },
      ],
    },
  ],
};

const NAV = [
  { id: "docker-recap", label: "Docker in 5 Minutes ⭐" },
  { id: "why-orchestrate", label: "Why Orchestration?" },
  { id: "aws-map", label: "The AWS Container Map ⭐" },
  { id: "ecr", label: "ECR — Image Registry" },
  { id: "ecs", label: "ECS — Task & Service ⭐" },
  { id: "fargate", label: "Fargate vs EC2 Launch Type ⭐" },
  { id: "eks", label: "EKS — Managed Kubernetes" },
  { id: "ecs-vs-eks", label: "ECS vs EKS — Decision" },
  { id: "full-flow", label: "Code → Container → Cloud" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsContainersPage() {
  return (
    <TopicShell
      icon="📦"
      title="Containers on AWS"
      gradientWord="Containers"
      subtitle="A 5-minute Docker recap, then the full AWS container map: ECR stores images, ECS or EKS decides what runs where, EC2 or Fargate actually runs it. One flowchart settles the eternal ECS-vs-EKS debate."
      nav={NAV}
      badges={["📦 Docker recap", "🔀 Decision flowcharts", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🔁", label: "DevOps — CI/CD & IaC", href: "/aws/devops" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="docker-recap" number="01" title="Docker in 5 Minutes — The Recap ⭐">
        <P>
          A <strong>container</strong> packages your app + its dependencies (runtime, libraries,
          config) into one portable unit that runs identically everywhere. Four words to keep
          straight:
        </P>
        <CodeBlock
          title="docker_vocabulary.txt"
          runnable={false}
          code={`📄 Dockerfile     the recipe        "FROM python:3.12, COPY app, RUN pip..."
        │ docker build
        ▼
📦 Image          the frozen meal    read-only snapshot, versioned with tags
        │ docker run                 (myapp:1.0, myapp:latest)
        ▼
🏃 Container      the served dish    a RUNNING instance of an image
                                     (one image → many containers)

💾 Volume         the doggy bag      data that survives container restarts
🕸️ Network        the table          how containers talk to each other`}
        />
        <CodeBlock
          title="the_four_commands.sh"
          runnable={false}
          code={`docker build -t myapp:1.0 .        # Dockerfile → image
docker run -d -p 80:8000 myapp:1.0 # image → running container
docker ps                          # what is running?
docker push myrepo/myapp:1.0       # upload image to a registry`}
        />
        <Callout type="analogy">
          🚢 Containers are shipping containers. The crane (Docker) does not care if the box
          holds bananas or BMWs — every box has the same shape, so any ship, truck or port can
          handle it. Your Python app and a Java app become identical boxes to AWS.
        </Callout>
        <Callout type="note">
          🐳 VM vs container: a VM ships a whole guest OS (GBs, minutes to boot). A container
          shares the host kernel and ships only your app layer (MBs, milliseconds to start).
          That is why one EC2 instance can run dozens of containers.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="why-orchestrate" number="02" title="Why Orchestration? — One Container Is Easy">
        <P>
          <IC>docker run</IC> on one machine is trivial. Production is not one container on one
          machine — it is fifty containers on twenty machines, and machines die:
        </P>
        <CodeBlock
          title="questions_docker_alone_cannot_answer.txt"
          runnable={false}
          code={`❓ container crashed at 3am          → who restarts it?
❓ traffic doubled                   → who starts 10 more copies?
❓ EC2 host died                     → who moves containers elsewhere?
❓ deploying v2                      → who rolls it out with zero downtime,
                                       and rolls BACK if it breaks?
❓ 50 containers, 20 hosts           → which container goes on which host?
                                       (bin-packing CPU + memory)
❓ service A needs to call service B → who keeps track of B's IPs?

  the answer to ALL of these = an ORCHESTRATOR
  on AWS: ECS (Amazon's own) or EKS (Kubernetes)`}
        />
        <Callout type="analogy">
          🎼 The name is literal: containers are musicians, the orchestrator is the conductor.
          Each musician can play alone, but the conductor decides who plays, when, how loud,
          and replaces anyone who faints mid-concert.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="aws-map" number="03" title="The AWS Container Map — 4 Services, 3 Jobs ⭐">
        <P>
          Every AWS container conversation involves four names. They do <strong>three</strong>{" "}
          different jobs — keep the jobs separate and the names stop being confusing:
        </P>
        <CodeBlock
          title="container_map.txt"
          runnable={false}
          code={`JOB 1: STORE images          JOB 2: ORCHESTRATE           JOB 3: RUN (compute)
"where do images live?"      "what runs, where, how many?" "whose CPUs?"

┌────────────────┐           ┌────────────────┐            ┌────────────────┐
│  📦 ECR        │  pulled   │  🚢 ECS        │  places    │  🖥️ EC2        │
│  Elastic       │ ───────▶  │  AWS-native    │  tasks on  │  you manage    │
│  Container     │           │  orchestrator  │ ─────────▶ │  the instances │
│  Registry      │           ├────────────────┤            ├────────────────┤
│                │           │  ☸️ EKS        │            │  ✨ Fargate    │
│  (private      │           │  managed       │            │  serverless —  │
│   Docker Hub)  │           │  Kubernetes    │            │  no instances  │
└────────────────┘           └────────────────┘            └────────────────┘

mix & match:  ECS on EC2 │ ECS on Fargate │ EKS on EC2 │ EKS on Fargate
most common starting point → ECS on Fargate (least to manage)`}
        />
        <Table
          head={["Service", "Job", "One-liner"]}
          rows={[
            ["ECR", "Store", "Private Docker registry — docker push lives here"],
            ["ECS", "Orchestrate", "Amazon's own scheduler — simple, deeply AWS-integrated"],
            ["EKS", "Orchestrate", "Managed Kubernetes — industry standard, portable"],
            ["Fargate", "Run", "Serverless compute for containers — no EC2 to patch"],
            ["EC2 launch type", "Run", "Your own instances — more control, more chores"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ &quot;Fargate vs ECS&quot; is a category error people make in interviews. They are
          not rivals — ECS/EKS decide <em>what</em> runs (orchestration), Fargate/EC2 decide{" "}
          <em>where the CPU comes from</em> (launch type). You always pick one from each column.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="ecr" number="04" title="ECR — Your Private Image Registry">
        <P>
          <strong>ECR (Elastic Container Registry)</strong> is Docker Hub inside your AWS
          account: private by default, IAM-controlled, encrypted, and in the same network as
          your compute (fast pulls, no Docker Hub rate limits).
        </P>
        <CodeBlock
          title="push_to_ecr.sh"
          runnable={false}
          code={`# 1. authenticate docker to ECR (token valid 12h)
aws ecr get-login-password --region us-east-1 \\
  | docker login --username AWS \\
    --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. tag image with the full ECR address
docker tag myapp:1.0 \\
  123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0
#  └─account──┘     └─region──┘               └repo┘└tag┘

# 3. push
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0`}
        />
        <CodeBlock
          title="ecr_features.txt"
          runnable={false}
          code={`🔍 image scanning      → finds CVEs in your layers (basic = free)
🏷️ tag immutability    → nobody can silently overwrite :1.0
🧹 lifecycle policies  → "keep last 10 images, delete the rest"
                          (images cost ~$0.10/GB-month — old ones pile up!)
🌍 cross-region replication → same image auto-copied to other regions`}
        />
        <Callout type="tip">
          💡 In production, nothing should pull from Docker Hub at deploy time — Hub rate-limits
          and outages have broken many 3am deployments. Mirror base images into ECR and pull
          everything from there.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="ecs" number="05" title="ECS — Task Definition, Task, Service ⭐">
        <P>
          ECS has exactly three nouns. Learn them in this order and the whole console makes
          sense:
        </P>
        <CodeBlock
          title="ecs_three_nouns.txt"
          runnable={false}
          code={`📄 TASK DEFINITION   the blueprint (like a Dockerfile for *running*)
   "image myapp:1.0, 0.5 vCPU, 1GB RAM, port 8000,
    env vars, log to CloudWatch, this IAM role"
        │
        │  "run 1 copy of this"
        ▼
🏃 TASK              one running copy (= 1+ containers placed somewhere)
        │
        │  "no — keep 3 copies alive, always"
        ▼
🔁 SERVICE           the babysitter:
   • desired count = 3 → one crashes → starts a replacement
   • registers tasks into the ALB target group
   • rolling deploys: start new v2 task, drain old v1, repeat

🌐 CLUSTER           the box it all lives in (a logical grouping
                     of services + the EC2/Fargate capacity)`}
        />
        <CodeBlock
          title="task_definition_essentials.json"
          runnable={false}
          code={`{
  "family": "myapp",
  "cpu": "512",                  // 0.5 vCPU
  "memory": "1024",              // 1 GB
  "executionRoleArn": "...",     // ECS uses this to PULL from ECR + write logs
  "taskRoleArn": "...",          // YOUR CODE uses this to call S3/DynamoDB
  "containerDefinitions": [{
    "name": "web",
    "image": "1234....ecr.....amazonaws.com/myapp:1.0",
    "portMappings": [{ "containerPort": 8000 }],
    "environment": [{ "name": "ENV", "value": "prod" }]
  }]
}`}
        />
        <Callout type="behind">
          🔧 Two roles, always confused: <strong>execution role</strong> = permissions ECS
          itself needs (pull image, push logs). <strong>task role</strong> = permissions your
          application code gets (read S3, query DynamoDB). Classic exam question.
        </Callout>
        <Callout type="analogy">
          🎬 Task definition = the movie script. Task = one live performance. Service = the
          theatre manager guaranteeing &quot;three showings running at all times — if an actor
          collapses, the understudy goes on.&quot;
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="fargate" number="06" title="Fargate vs EC2 Launch Type ⭐">
        <P>
          Once ECS (or EKS) decides a task should run, <strong>something</strong> must supply
          CPU and memory. That choice is the launch type:
        </P>
        <CodeBlock
          title="launch_type_drawn.txt"
          runnable={false}
          code={`EC2 LAUNCH TYPE                      FARGATE LAUNCH TYPE
"bring your own servers"             "serverless containers"

┌─ your ECS cluster ─────────┐       ┌─ your ECS cluster ─────────┐
│ ┌─ EC2 #1 ──┐ ┌─ EC2 #2 ──┐│       │                            │
│ │ [task][task]│ │ [task]   ││       │  [task]  [task]  [task]    │
│ │            │ │ (wasted   ││       │     ▲ each task gets its   │
│ │            │ │  space 💸)││       │       own right-sized      │
│ └────────────┘ └───────────┘│       │       slice of AWS compute │
│  you: patch OS, scale the   │       │  you: nothing. no SSH,     │
│  fleet, bin-pack, AMIs      │       │  no patching, no fleet     │
└─────────────────────────────┘       └────────────────────────────┘

pay for: instances (even idle)        pay for: vCPU+GB × seconds the
                                               task actually runs`}
        />
        <Table
          head={["", "EC2 launch type", "Fargate"]}
          rows={[
            ["You manage", "AMIs, patching, scaling the instance fleet", "Nothing below the task"],
            ["Pricing", "Per instance-hour (idle space wasted)", "Per task vCPU + GB per second"],
            ["Cheapest when", "High, steady utilization (+ Spot/RIs)", "Spiky, low, or unpredictable load"],
            ["GPU / special hw", "✅ yes", "❌ no GPUs"],
            ["Daemon/host access", "✅ daemonsets, privileged mode", "❌ limited"],
            ["Default advice", "Big stable fleets, cost-tuned", "⭐ Start here"],
          ]}
        />
        <Callout type="tip">
          💡 Decision in one line: <strong>start with Fargate</strong>; move to EC2 launch type
          only when the bill proves a steady, dense workload would be cheaper on reserved
          instances — or when you need GPUs.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="eks" number="07" title="EKS — Managed Kubernetes">
        <P>
          <strong>EKS (Elastic Kubernetes Service)</strong> runs the Kubernetes{" "}
          <em>control plane</em> for you — the brain (API server, etcd, scheduler) is AWS&apos;s
          problem; the worker nodes and everything on them are yours.
        </P>
        <CodeBlock
          title="eks_split_of_labor.txt"
          runnable={false}
          code={`┌─ CONTROL PLANE — AWS manages ($0.10/hr/cluster) ────────────┐
│  API server · etcd (cluster state) · scheduler              │
│  multi-AZ, patched, backed up — you never see these servers │
└──────────────────────────────┬───────────────────────────────┘
                               │ schedules pods onto...
┌─ DATA PLANE — your choice ───▼───────────────────────────────┐
│  • managed node groups  → EC2s AWS helps patch/scale  ⭐     │
│  • self-managed nodes   → raw EC2s, all yours                │
│  • Fargate profiles     → per-pod serverless, no nodes       │
└──────────────────────────────────────────────────────────────┘

same kubectl / YAML / Helm as anywhere:
  kubectl apply -f deployment.yaml
  Deployment ≈ ECS service │ Pod ≈ ECS task │ kubelet ≈ ECS agent`}
        />
        <CodeBlock
          title="why_teams_pick_eks.txt"
          runnable={false}
          code={`✅ portability      same YAML runs on-prem / GCP / Azure (no lock-in)
✅ ecosystem        Helm charts, ArgoCD, Istio, operators — huge toolbox
✅ hiring           "Kubernetes" is a transferable, searchable skill
✅ already on k8s   migrating an existing k8s estate → EKS is natural

❌ the price        k8s is a COMPLEX system: upgrades every ~year,
                    networking add-ons, RBAC, observability stack...
                    someone on the team must own it`}
        />
        <Callout type="behind">
          🔧 &quot;Managed&quot; ≠ &quot;maintenance-free&quot;. AWS upgrades the control plane
          when <em>you</em> ask; Kubernetes versions are supported ~14 months, so EKS clusters
          need a deliberate upgrade cycle — a real, recurring engineering cost ECS does not have.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="ecs-vs-eks" number="08" title="ECS vs EKS — The Decision Flowchart">
        <CodeBlock
          title="ecs_vs_eks_flow.txt"
          runnable={false}
          code={`"we are containerizing — ECS or EKS?"
 │
 ├─ already running Kubernetes elsewhere? ──── yes ─▶ EKS (lift it over)
 │
 ├─ need multi-cloud / on-prem portability? ── yes ─▶ EKS
 │
 ├─ need the k8s ecosystem (Helm, Istio,
 │  operators, service mesh)? ──────────────── yes ─▶ EKS
 │
 ├─ small team, all-in on AWS,
 │  want simplest path to production? ──────── yes ─▶ ECS (+ Fargate) ⭐
 │
 └─ honestly just one container, low traffic? ─────▶ maybe neither:
                                                     App Runner / Lambda
                                                     (container image up
                                                      to 10GB) / Beanstalk`}
        />
        <Table
          head={["", "ECS", "EKS"]}
          rows={[
            ["Who made it", "AWS proprietary", "Open-source Kubernetes, AWS-managed"],
            ["Learning curve", "Days", "Months"],
            ["Control plane cost", "Free", "$0.10/hour per cluster (~$73/mo)"],
            ["AWS integration", "Native (IAM, ALB, CloudWatch built-in)", "Via add-ons/controllers"],
            ["Portability", "AWS only", "Runs anywhere"],
            ["Best for", "AWS-first teams shipping fast", "k8s shops, multi-cloud, big platform teams"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Choosing EKS &quot;because Kubernetes is the standard&quot; is the most common
          over-engineering move in cloud. If nobody on the team has run k8s and you only deploy
          to AWS, ECS+Fargate ships the same containers with 10% of the operational load.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="full-flow" number="09" title="Code → Container → Cloud — The Full Flow">
        <P>The end-to-end picture you should be able to draw on a whiteboard:</P>
        <CodeBlock
          title="full_container_pipeline.txt"
          runnable={false}
          code={`👩‍💻 git push
   │
   ▼
🔁 CI pipeline (CodePipeline / GitHub Actions)        ← next topic!
   │  docker build -t myapp:42 .
   │  docker push  ...ecr.../myapp:42
   ▼
📦 ECR  (image :42 stored, scanned for CVEs)
   │
   │  pipeline: "ECS, update service to image :42"
   ▼
🚢 ECS SERVICE (desired = 3, rolling deploy)
   │  starts new v42 tasks → health check passes →
   │  drains old v41 tasks → zero downtime ✨
   ▼
✨ FARGATE runs 3 tasks across 2+ AZs (private subnets)
   ▲
   │ traffic via target group
🌐 ALB (public subnets) ◀── users
   │
📈 scaling: CPU > 70% → service raises desired count → more tasks
📊 logs → CloudWatch │ metrics → CloudWatch │ traces → X-Ray`}
        />
        <Callout type="tip">
          💡 Notice how earlier topics snap together: VPC private subnets hold the tasks, the
          ALB from the load-balancing topic fronts them, CloudWatch watches them, IAM task
          roles scope their permissions. Containers do not replace those layers — they ride on
          them.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Image vs container", "image = frozen snapshot · container = running instance"],
            ["Orchestrator job", "restart crashed, scale copies, place on hosts, roll deploys"],
            ["ECR", "private Docker registry — store + scan images"],
            ["ECS", "AWS-native orchestrator — simple, free control plane"],
            ["EKS", "managed Kubernetes — portable, $0.10/hr, you own upgrades"],
            ["Fargate", "LAUNCH TYPE not orchestrator — serverless compute for tasks"],
            ["Task definition", "blueprint: image + CPU/RAM + ports + roles"],
            ["Task vs service", "task = 1 running copy · service = keeps N alive + LB + deploys"],
            ["Execution vs task role", "execution = ECS pulls image/logs · task = YOUR code's perms"],
            ["Default pick", "ECS on Fargate — move to EC2 type only for cost/GPU"],
            ["EKS when", "existing k8s, multi-cloud, need Helm/Istio ecosystem"],
            ["Zero-downtime deploy", "service starts new tasks → health check → drains old"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
