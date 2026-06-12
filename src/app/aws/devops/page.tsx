"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "CI/CD Pipeline — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "git push", sub: "feature → main", x: 8, y: 50, color: "#22d3ee" },
    { id: "build", icon: "🔨", label: "CodeBuild", sub: "build + unit tests", x: 30, y: 18, color: "#fb923c" },
    { id: "staging", icon: "🧪", label: "Staging", sub: "auto-deployed", x: 52, y: 66, color: "#a78bfa" },
    { id: "approve", icon: "👍", label: "Approval", sub: "human gate", x: 70, y: 18, color: "#fbbf24" },
    { id: "prod", icon: "🚀", label: "Production", sub: "blue/green", x: 90, y: 60, color: "#34d399" },
  ],
  edges: [
    { id: "dev-build", from: "dev", to: "build", color: "#fb923c" },
    { id: "build-staging", from: "build", to: "staging", color: "#a78bfa" },
    { id: "staging-approve", from: "staging", to: "approve", dashed: true, color: "#fbbf24" },
    { id: "approve-prod", from: "approve", to: "prod", color: "#34d399" },
    { id: "prod-staging", from: "prod", to: "staging", bend: 25, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "ship",
      name: "🚀 Happy path",
      command: "git push origin main → pipeline #482",
      steps: [
        { node: "dev", paths: ["dev-build"], text: "A merge to main triggers the pipeline. The Source stage hands the commit to CodeBuild." },
        { node: "build", paths: ["dev-build"], text: "buildspec.yml runs: install deps → unit tests → build the image → push artifact. Green in 4 minutes." },
        { node: "staging", paths: ["build-staging"], text: "CodeDeploy automatically ships it to Staging where integration tests run against real services." },
        { node: "approve", paths: ["staging-approve"], text: "Pipeline PAUSES at the manual approval gate. The lead reviews staging and clicks Approve." },
        { node: "prod", paths: ["approve-prod"], text: "Blue/green deploy: new (green) fleet comes up, traffic shifts over, old (blue) kept warm for instant rollback. 🚀" },
      ],
    },
    {
      id: "failfast",
      name: "🧨 Test fails",
      command: "FAIL src/cart.test.ts — 1 of 214 tests",
      steps: [
        { node: "dev", paths: ["dev-build"], text: "Another push — but this commit has a bug in the cart logic." },
        { node: "build", paths: [], text: "Unit tests catch it. The Build stage goes RED and the pipeline STOPS dead. Staging and prod are never touched. 🧨" },
        { node: "dev", paths: ["dev-build"], text: "The dev gets a notification, fixes the test, pushes again. Broken code physically cannot reach production." },
      ],
    },
    {
      id: "rollback",
      name: "⏪ Auto-rollback",
      command: "CloudWatch alarm: 5xx rate > 1% post-deploy",
      steps: [
        { node: "prod", paths: ["approve-prod"], text: "A deploy passes all tests but causes 5xx errors under real traffic. The post-deploy alarm fires." },
        { node: "prod", paths: ["prod-staging"], text: "CodeDeploy auto-rolls back: traffic shifts to the old (blue) fleet that was kept running. Outage: ~90 seconds." },
        { node: "dev", paths: ["dev-build"], text: "The bad build is marked failed and the team investigates calmly — prod is already healthy again. ⏪" },
      ],
    },
  ],
};

const NAV = [
  { id: "what-is-cicd", label: "CI/CD — The Idea ⭐" },
  { id: "code-family", label: "The Code* Family Map ⭐" },
  { id: "codebuild", label: "CodeBuild — buildspec.yml" },
  { id: "codedeploy", label: "CodeDeploy — Deploy Strategies ⭐" },
  { id: "codepipeline", label: "CodePipeline — Gluing It Together" },
  { id: "what-is-iac", label: "Infrastructure as Code ⭐" },
  { id: "cloudformation", label: "CloudFormation — Templates & Stacks" },
  { id: "cdk", label: "CDK — IaC in Real Code" },
  { id: "terraform", label: "Terraform — The Multi-Cloud Option" },
  { id: "full-pipeline", label: "A Real Pipeline, End to End" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsDevopsPage() {
  return (
    <TopicShell
      icon="🔁"
      title="DevOps on AWS"
      gradientWord="DevOps"
      subtitle="Two superpowers in one topic: CI/CD (code ships itself — CodeBuild, CodeDeploy, CodePipeline) and Infrastructure as Code (your whole cloud written in files — CloudFormation, CDK, Terraform). After this, clicking in the console feels wrong."
      nav={NAV}
      badges={["🔁 Pipelines drawn", "📜 IaC compared", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "📨", label: "Messaging — SQS, SNS & EventBridge", href: "/aws/messaging" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="what-is-cicd" number="01" title="CI/CD — The Idea ⭐">
        <P>
          <strong>CI (Continuous Integration)</strong>: every push is automatically built and
          tested. <strong>CD (Continuous Delivery/Deployment)</strong>: every passing build is
          automatically shipped. The goal — turn deployment from a scary monthly event into a
          boring daily non-event.
        </P>
        <CodeBlock
          title="before_vs_after.txt"
          runnable={false}
          code={`WITHOUT CI/CD                        WITH CI/CD
─────────────                        ──────────
"deploy day" (every 3 weeks):        every git push:
 1. Dave builds on HIS laptop         1. pipeline builds in a clean env
 2. copies a zip over SSH 😬          2. unit tests run automatically
 3. runs migration by hand            3. deploys to STAGING
 4. something breaks                  4. smoke tests pass
 5. "works on my machine"             5. deploys to PROD, gradually
 6. rollback = restore backup?        6. errors spike → auto-rollback
 ⏱️ 4 hours, sweaty                   ⏱️ 12 minutes, nobody watching

CI/CD = small changes, shipped constantly, by a robot that never
        skips steps because it's Friday at 5pm.`}
        />
        <Callout type="analogy">
          🏭 Hand deployment is a craftsman assembling each car personally — slow, and every car
          slightly different. CI/CD is the assembly line: identical steps, every time, with a
          quality check at each station that stops the line on a defect.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="code-family" number="02" title="The Code* Family Map ⭐">
        <P>
          AWS named its DevOps tools literally — each <IC>Code*</IC> service is one station of
          the assembly line:
        </P>
        <CodeBlock
          title="code_family.txt"
          runnable={false}
          code={`SOURCE          BUILD + TEST       DEPLOY            ORCHESTRATE ALL
──────          ────────────       ──────            ───────────────
📚 CodeCommit   🔨 CodeBuild       🚀 CodeDeploy     🔁 CodePipeline
git repos       runs buildspec     pushes to EC2/    the conveyor belt
on AWS          in containers,     Lambda/ECS with   connecting every
                produces            blue-green or     stage, with
(⚠️ closed to   artifacts           canary            approvals & gates
 new customers
 since 2024 —   pay per build      free (EC2/onprem) pay per pipeline
 GitHub/GitLab  minute             $0.02/Lambda or   (~$1/mo each)
 are the usual                     ECS update
 source now)

artifacts between stages travel via S3 🪣`}
        />
        <Table
          head={["Stage", "AWS service", "Popular alternative"]}
          rows={[
            ["Source", "CodeCommit (legacy) / GitHub connection", "GitHub, GitLab, Bitbucket"],
            ["Build & test", "CodeBuild", "GitHub Actions, Jenkins, GitLab CI"],
            ["Deploy", "CodeDeploy", "Spinnaker, Argo CD, plain scripts"],
            ["Orchestration", "CodePipeline", "GitHub Actions workflows, Jenkins"],
          ]}
        />
        <Callout type="note">
          📝 Real-world note: many AWS shops keep source in GitHub and use GitHub Actions for
          CI, then CodeDeploy/CodePipeline for the AWS-side deployment. Knowing the Code*
          family is still exam-essential and common in enterprises.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="codebuild" number="03" title="CodeBuild — buildspec.yml">
        <P>
          <strong>CodeBuild</strong> spins up a fresh container, runs the commands in your{" "}
          <IC>buildspec.yml</IC>, saves the outputs (artifacts), and tears everything down. No
          Jenkins server to feed and patch.
        </P>
        <CodeBlock
          title="buildspec.yml"
          runnable={false}
          code={`version: 0.2

phases:
  install:                      # set up the toolbox
    runtime-versions:
      python: 3.12
  pre_build:                    # login / fetch deps
    commands:
      - pip install -r requirements.txt
      - aws ecr get-login-password | docker login --username AWS \\
          --password-stdin $ECR_URL
  build:                        # the actual work
    commands:
      - pytest tests/                          # ❌ fail → pipeline stops
      - docker build -t $ECR_URL/myapp:$CODEBUILD_RESOLVED_SOURCE_VERSION .
  post_build:
    commands:
      - docker push $ECR_URL/myapp:$CODEBUILD_RESOLVED_SOURCE_VERSION

artifacts:                      # files passed to the next stage (via S3)
  files:
    - appspec.yml
    - taskdef.json`}
        />
        <Callout type="behind">
          🔧 Every build starts from a clean image — that is the point. &quot;Works on my
          machine&quot; dies because there is no machine: dependencies must be declared in the
          buildspec or the build fails, honestly, every time.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="codedeploy" number="04" title="CodeDeploy — The Deploy Strategies ⭐">
        <P>
          Getting new code onto running infrastructure without dropping requests is the hard
          part. The strategies, drawn:
        </P>
        <CodeBlock
          title="deploy_strategies.txt"
          runnable={false}
          code={`1️⃣ IN-PLACE / ROLLING — replace a few at a time
   [v1] [v1] [v1] [v1]
   [v2] [v1] [v1] [v1]   ← update 1, health check, continue
   [v2] [v2] [v2] [v2]
   ✅ no extra servers   ❌ mixed versions live together, slow rollback

2️⃣ BLUE-GREEN — build a parallel world, flip traffic
   BLUE  [v1][v1][v1] ◀── 100% traffic
   GREEN [v2][v2][v2]     (deployed, tested, idle)
                ──flip──▶
   BLUE  [v1][v1][v1]     (kept warm for instant rollback)
   GREEN [v2][v2][v2] ◀── 100% traffic
   ✅ instant rollback   ❌ 2× infra during deploy

3️⃣ CANARY — let a small % test the water
   [v2] ◀── 10% of traffic, watch CloudWatch alarms 10 min
   [v1][v1][v1] ◀── 90%
   alarms quiet? → shift 100%    alarms fire? → auto-rollback 🐤
   ✅ blast radius = 10%  (Lambda aliases do this natively!)

4️⃣ LINEAR — like canary but stepped: 10% every N minutes`}
        />
        <Table
          head={["Target", "How CodeDeploy ships it"]}
          rows={[
            ["EC2 / on-prem", "Agent on instance runs hooks from appspec.yml (stop app → copy files → start → validate)"],
            ["Lambda", "Shifts alias traffic between versions (canary/linear) — pure config, no agent"],
            ["ECS", "Blue-green: new task set behind a test listener, then swap target groups"],
          ]}
        />
        <Callout type="tip">
          💡 Interview gold: &quot;how do you deploy with zero downtime?&quot; → name blue-green
          for instant rollback, canary for limited blast radius, and mention CloudWatch alarms
          wired to automatic rollback. That trio is the whole answer.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="codepipeline" number="05" title="CodePipeline — Gluing It Together">
        <CodeBlock
          title="pipeline_anatomy.txt"
          runnable={false}
          code={`PIPELINE  =  ordered STAGES  =  each stage has ACTIONS

┌─ Stage: Source ────────────────────────────────┐
│  GitHub push on branch main  → grabs the code  │
└───────────────┬────────────────────────────────┘
                ▼ artifact (zip in S3)
┌─ Stage: Build ─────────────────────────────────┐
│  CodeBuild: test + docker build + push to ECR  │
└───────────────┬────────────────────────────────┘
                ▼
┌─ Stage: Deploy-Staging ────────────────────────┐
│  CodeDeploy → staging ECS service              │
└───────────────┬────────────────────────────────┘
                ▼
┌─ Stage: Approve ───────────────────────────────┐
│  ✋ MANUAL APPROVAL — a human clicks "Approve"  │
│     (SNS email to the team lead)               │
└───────────────┬────────────────────────────────┘
                ▼
┌─ Stage: Deploy-Prod ───────────────────────────┐
│  CodeDeploy → prod, canary 10% → 100%          │
└────────────────────────────────────────────────┘

any stage fails ❌ → pipeline stops → nothing later runs`}
        />
        <Callout type="analogy">
          🚦 A pipeline is a row of locked doors. Code can only walk forward, and each door only
          opens if the test/check at that door passes. Production is behind the last door — by
          the time code reaches it, it has been built once and promoted, never rebuilt.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="what-is-iac" number="06" title="Infrastructure as Code — The Other Half ⭐">
        <P>
          <strong>IaC</strong>: instead of clicking infrastructure together in the console, you{" "}
          <em>describe</em> it in files. A tool reads the file and makes reality match.
        </P>
        <CodeBlock
          title="why_iac.txt"
          runnable={false}
          code={`CLICKING (\"ClickOps\")                 IaC
──────────────────────                ───
😰 prod built by hand 2 years ago     📜 entire env described in files
   — nobody remembers how             ✅ git history = who changed what, when
😰 staging ≠ prod (drift)             ✅ same template → identical envs
😰 new region = weeks of clicking     ✅ new region = run template, ☕ 20 min
😰 \"who opened port 22 to the        ✅ code review BEFORE infra changes
    world?!\" — no audit trail         ✅ disaster recovery = re-run template

golden rule: if it's not in code, it doesn't exist.
console = read-only viewing gallery 👀`}
        />
        <Callout type="analogy">
          🏗️ ClickOps is building a house from memory; IaC is the architect&apos;s blueprint.
          Lose the house (region outage)? With a blueprint you rebuild an identical one. Want a
          second house (staging)? Print the blueprint twice.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="cloudformation" number="07" title="CloudFormation — Templates & Stacks">
        <P>
          <strong>CloudFormation (CFN)</strong> is AWS&apos;s native IaC engine. You write a
          YAML/JSON <strong>template</strong>; deploying it creates a <strong>stack</strong> —
          the live set of resources CFN manages as one unit.
        </P>
        <CodeBlock
          title="template.yaml"
          runnable={false}
          code={`Parameters:                       # inputs — same template, many envs
  EnvName:
    Type: String
    AllowedValues: [staging, prod]

Resources:                        # the actual infrastructure ⭐
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "myapp-\${EnvName}-assets"
      VersioningConfiguration: { Status: Enabled }

  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      SecurityGroupIds: [!Ref WebSG]   # !Ref = wire resources together

  WebSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0 }

Outputs:                          # values exported for humans/other stacks
  BucketName:
    Value: !Ref AppBucket`}
        />
        <CodeBlock
          title="stack_lifecycle.txt"
          runnable={false}
          code={`create-stack  → CFN builds everything IN DEPENDENCY ORDER
                (SG before EC2 — it figured that out from !Ref)
                ❌ anything fails → automatic ROLLBACK of the whole stack

update-stack  → 1. generate CHANGE SET — "here's what I would change:
                   ~ modify WebServer (instance type)
                   - DELETE AppBucket ⚠️ replace!"
                2. human reviews 👀 → execute

delete-stack  → tears down every resource the stack created
                (DeletionPolicy: Retain protects data like buckets/DBs)`}
        />
        <Callout type="mistake">
          ⚠️ Always read the change set before executing. Some property changes (like renaming a
          bucket or changing an RDS identifier) mean <em>replace</em> — CFN deletes the old
          resource and creates a new one. On a database, that is data loss.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="cdk" number="08" title="CDK — IaC in Real Code">
        <P>
          The <strong>CDK (Cloud Development Kit)</strong> lets you write infrastructure in
          TypeScript/Python/Java. It <em>compiles to CloudFormation</em> — same engine, vastly
          better ergonomics:
        </P>
        <CodeBlock
          title="cdk_stack.ts"
          runnable={false}
          code={`// 500 lines of YAML becomes ~15 lines of TypeScript:
const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });   // subnets, routes,
                                                        // NAT, IGW: FREE 🤯
const cluster = new ecs.Cluster(this, "Cluster", { vpc });

new ecsPatterns.ApplicationLoadBalancedFargateService(this, "Web", {
  cluster,
  desiredCount: 3,
  taskImageOptions: {
    image: ecs.ContainerImage.fromAsset("./app"),  // builds Dockerfile!
  },
});
// ↑ creates ALB + target group + service + task def + roles + SGs
//   with sane defaults — loops, ifs, unit tests, autocomplete included

$ cdk synth    # → emits the CloudFormation template
$ cdk diff     # → like a change set, in your terminal
$ cdk deploy   # → deploys via CloudFormation`}
        />
        <Callout type="behind">
          🔧 CDK&apos;s killer feature is <strong>constructs</strong> — L2/L3 components that
          bundle best practices. <IC>new ec2.Vpc(...)</IC> generates ~40 CloudFormation
          resources correctly wired. You operate at the level of intent, not plumbing.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="terraform" number="09" title="Terraform — The Multi-Cloud Option">
        <P>
          <strong>Terraform</strong> (HashiCorp) is the most widely used IaC tool overall. Its
          own language (HCL), its own engine, works on every cloud:
        </P>
        <CodeBlock
          title="main.tf"
          runnable={false}
          code={`resource "aws_s3_bucket" "assets" {
  bucket = "myapp-prod-assets"
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.al2023.id
  instance_type = "t3.micro"
  vpc_security_group_ids = [aws_security_group.web.id]
}

# the workflow — three commands, forever:
# terraform plan    → "+ create 2, ~ change 1, - destroy 0"  (review!)
# terraform apply   → makes reality match the files
# terraform destroy → tears it all down`}
        />
        <Table
          head={["", "CloudFormation", "CDK", "Terraform"]}
          rows={[
            ["Language", "YAML/JSON", "TypeScript, Python...", "HCL"],
            ["Engine", "AWS-managed", "Compiles → CFN", "Terraform core"],
            ["State lives", "Inside AWS (stack)", "Inside AWS (stack)", "State file — YOU store it (S3 + locking)"],
            ["Clouds", "AWS only", "AWS only", "AWS, GCP, Azure, GitHub, Datadog..."],
            ["Pick when", "AWS-only, want zero extra tools", "AWS-only, team loves real code ⭐", "Multi-cloud / industry-standard skills ⭐"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Terraform&apos;s <strong>state file</strong> is sacred — it maps your code to real
          resource IDs. Lose it and Terraform forgets it owns anything; two people applying at
          once corrupts it. Production setup: state in S3 with locking, day one.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="full-pipeline" number="10" title="A Real Pipeline, End to End">
        <CodeBlock
          title="everything_together.txt"
          runnable={false}
          code={`            👩‍💻 git push (app code AND infra code — same review flow)
                 │
   ┌─────────────┴──────────────┐
   ▼                            ▼
APP PIPELINE                INFRA PIPELINE
🔨 CodeBuild:               📜 terraform plan / cdk diff
   pytest ✅                    │ human reviews the diff ✋
   docker build+push → ECR      ▼
   │                        terraform apply / cdk deploy
   ▼                            (VPC, ALB, ECS cluster, RDS,
🚀 CodeDeploy → staging          alarms — ALL from files)
   smoke tests ✅
   ✋ manual approval
   ▼
🚀 prod: canary 10% ── CloudWatch alarms quiet? ──▶ 100% 🎉
                └─ alarm fires ──▶ auto-rollback to v1 🛟

result: laptop → production with zero SSH, zero console clicks,
        full audit trail in git + CloudTrail`}
        />
        <Callout type="tip">
          💡 The cultural definition of DevOps hiding in this diagram: the people who write the
          code also own deploying and running it — and they can, safely, because every step is
          automated, reviewed, and reversible.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["CI vs CD", "CI = every push built+tested · CD = every pass shipped"],
            ["CodeBuild", "clean container runs buildspec.yml → artifacts"],
            ["CodeDeploy", "ships to EC2/Lambda/ECS with rolling/blue-green/canary"],
            ["CodePipeline", "the conveyor: source → build → deploy + approvals"],
            ["Blue-green", "parallel env, flip traffic, instant rollback"],
            ["Canary", "10% first, watch alarms, then 100% — small blast radius"],
            ["IaC", "infra described in files — git review, repeatable envs"],
            ["CloudFormation", "YAML template → stack · review CHANGE SET first"],
            ["CDK", "real code (TS/Python) that compiles to CloudFormation"],
            ["Terraform", "HCL, multi-cloud · plan → apply · guard the state file"],
            ["Replace danger", "some updates DELETE+recreate resources — read the diff"],
            ["Golden rule", "not in code = doesn't exist · console is read-only"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
