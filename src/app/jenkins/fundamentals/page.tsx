"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The CI/CD Loop — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "Developer", sub: "commit + push", x: 7, y: 50, color: "#22d3ee" },
    { id: "git", icon: "🔱", label: "Git Repo", sub: "source of truth", x: 25, y: 25, color: "#a78bfa" },
    { id: "jenkins", icon: "🎩", label: "Jenkins", sub: "automation butler", x: 50, y: 50, color: "#fb923c" },
    { id: "tests", icon: "🧪", label: "Tests", sub: "verify quality", x: 68, y: 18, color: "#34d399" },
    { id: "artifact", icon: "📦", label: "Artifact", sub: "built package", x: 75, y: 75, color: "#fbbf24" },
    { id: "deploy", icon: "🚀", label: "Deploy", sub: "production", x: 92, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "dev-git", from: "dev", to: "git", color: "#a78bfa" },
    { id: "git-jenkins", from: "git", to: "jenkins", color: "#fb923c" },
    { id: "jenkins-tests", from: "jenkins", to: "tests", color: "#34d399" },
    { id: "tests-artifact", from: "tests", to: "artifact", color: "#fbbf24" },
    { id: "artifact-deploy", from: "artifact", to: "deploy", color: "#f472b6" },
    { id: "jenkins-dev", from: "jenkins", to: "dev", bend: -60, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Green build",
      command: "git push → CI passes → deploy",
      steps: [
        { node: "dev", paths: ["dev-git"], text: "Developer pushes code to main branch. The commit hook triggers Jenkins within seconds." },
        { node: "jenkins", paths: ["git-jenkins", "jenkins-tests"], text: "Jenkins pulls the latest code, spins up a clean environment, runs the test suite. All 127 tests pass. ✅" },
        { node: "artifact", paths: ["tests-artifact"], text: "Build succeeds: compile, package as .jar or Docker image, push to artifact registry." },
        { node: "deploy", paths: ["artifact-deploy"], text: "Continuous Deployment: artifact auto-deploys to production. Users get the fix in 8 minutes. 🚀" },
      ],
    },
    {
      id: "fail",
      name: "❌ Test fails",
      command: "tests fail → team notified, merge blocked",
      steps: [
        { node: "jenkins", paths: ["git-jenkins", "jenkins-tests"], text: "Jenkins detects new PR, runs tests. Test #47 fails: NullPointerException in payment logic. ❌" },
        { node: "jenkins", paths: ["jenkins-dev"], text: "Build marked RED. Slack notification fires: &apos;@alice your PR broke the build — test_payment_flow failed&apos;. GitHub status check blocks merge." },
        { node: "git", paths: [], text: "The broken code never reaches main. Developer fixes locally, pushes again, CI runs clean. THAT&apos;S Continuous Integration — catch it before merge. 🛡️" },
      ],
    },
    {
      id: "cd",
      name: "🚀 Full CD to prod",
      command: "commit → test → staging → prod (zero human clicks)",
      steps: [
        { node: "jenkins", paths: ["git-jenkins", "jenkins-tests"], text: "Pipeline triggered. Stage 1: tests pass. Stage 2: deploy to staging environment, run smoke tests." },
        { node: "artifact", paths: ["tests-artifact"], text: "Staging healthy. Pipeline automatically promotes the same artifact (immutable, already tested) to production slot." },
        { node: "deploy", paths: ["artifact-deploy"], text: "Production deployment: blue-green swap, health check passes, old version kept for 10-min rollback window. Zero downtime. That&apos;s Continuous Deployment. 🎯" },
      ],
    },
  ],
};

const NAV = [
  { id: "before-ci", label: "Life Before CI — Integration Hell ⭐" },
  { id: "what-is-ci", label: "What IS Continuous Integration?" },
  { id: "ci-cd-deploy", label: "CI vs CD vs Deployment ⭐" },
  { id: "what-is-jenkins", label: "What Jenkins Actually Is" },
  { id: "architecture", label: "Controller + Agent Architecture" },
  { id: "plugins", label: "The Plugin Ecosystem" },
  { id: "comparison", label: "Jenkins vs GitHub Actions vs GitLab CI ⭐" },
  { id: "when-jenkins", label: "When to Use Jenkins (and When Not)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsFundamentalsPage() {
  return (
    <TopicShell
      icon="🎩"
      title="CI/CD & Jenkins Fundamentals"
      gradientWord="Jenkins"
      subtitle="Before Jenkins: integration hell drawn on a timeline. What Continuous Integration, Delivery and Deployment each mean (and the critical difference). What Jenkins is (your automation butler), the controller+agent architecture, and the plugin system that makes Jenkins do everything. Let&apos;s start from zero."
      nav={NAV}
      badges={["🔁 The CI/CD loop", "🎩 Butler analogy", "🔀 CI vs CD vs Deploy"]}
      next={{ icon: "🛠️", label: "Install & First Run", href: "/jenkins/installation" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="before-ci" number="01" title="Life Before CI — Integration Hell ⭐">
        <P>
          Picture 2005. Five developers work on separate features for three weeks. On &quot;integration
          Friday&quot; they merge. The build breaks in 47 places. Nobody knows whose change caused what.
          The weekend is ruined debugging merge conflicts and broken tests. Ship date slips two weeks.
          This was <IC>integration hell</IC> — and it was normal.
        </P>
        <CodeBlock
          title="integration_hell_timeline.txt"
          runnable={false}
          code={`WATERFALL / FEATURE-BRANCH HELL (how we used to work)

Week 1-3: developers work in isolation on long-lived branches
┌─────────────────────────────────────────────┐
│  Alice: feature-payments  (650 lines changed) │
│  Bob:   feature-ui-redesign (1200 lines)     │
│  Carol: bugfix-auth  (85 lines)              │
│  Dave:  refactor-db  (340 lines)             │
│  Eve:   feature-notifications (220 lines)    │
└─────────────────────────────────────────────┘
         ↓ nobody has run tests against OTHERS' code
  Friday: "INTEGRATION DAY" — merge everything at once
         ↓
   💥 EXPLOSION 💥
   • 47 merge conflicts (Alice and Bob both renamed User → Customer)
   • Tests that passed locally now fail (Dave's DB schema broke Carol's auth)
   • Nobody knows which change broke what (no isolation)
   • Build takes 6 hours to fix (archaeology + whack-a-mole)
   • Weekend ruined, Monday demo canceled, trust broken 😭

THE FIX: integrate CONTINUOUSLY (many times per day) instead of once per month`}
        />
        <Callout type="analogy">
          🏗️ Building a house: would you have 5 crews work independently for a month (plumber, electrician,
          carpenter, roofer, painter) and THEN try to combine their work in one day? Of course not — you
          integrate continuously, checking that the pipes fit the walls before you drywall. Same with code.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-is-ci" number="02" title="What IS Continuous Integration?">
        <P>
          <IC>Continuous Integration (CI)</IC> is the practice of merging all developers&apos; working
          copies to a shared mainline <em>several times a day</em>, automatically running tests on every
          merge. The goal: detect integration problems <em>minutes</em> after they&apos;re introduced,
          when they&apos;re cheap to fix.
        </P>
        <CodeBlock
          title="ci_practice_rules.txt"
          runnable={false}
          code={`CONTINUOUS INTEGRATION — the core rules

1. ONE source repository (Git) — single source of truth
   ├─ main branch is ALWAYS in a working state
   └─ everyone pulls from it multiple times per day

2. AUTOMATE the build
   ├─ no "works on my machine" — build on a clean server
   └─ command: ./build.sh → success or failure, no ambiguity

3. Make the build SELF-TESTING
   ├─ unit tests, integration tests, linters run AUTOMATICALLY
   └─ build is only "green" if ALL tests pass ✅

4. Everyone commits to main DAILY (at minimum)
   ├─ small changes → small risk, easy to debug
   └─ long-lived feature branches = NOT continuous integration

5. EVERY commit triggers a build
   ├─ commit → push → Jenkins runs tests within ~60 sec
   └─ FAST FEEDBACK: fix it now while context is fresh 🔥

6. Keep the build FAST (<10 min for core suite)
   └─ slow build = people skip it = CI theater, not real CI

7. Test in a CLONE of production
   └─ different DB/OS/library version? not CI, it's hope

8. Make it EASY to get the latest build
   └─ artifact is always available for QA/deploy

9. EVERYONE can SEE build status
   ├─ big visible dashboard: main is 🟢 or 🔴
   └─ broken build = top priority for the team

10. AUTOMATE deployment (→ Continuous Delivery/Deployment)

If you're doing 1-9, you're doing CI. Jenkins is the butler who enforces it 24/7.`}
        />
        <Callout type="tip">
          💡 The acid test: &quot;Could you deploy main to production right now?&quot; If the answer is
          &quot;probably&quot; or &quot;let me check&quot; instead of &quot;yes, it&apos;s green&quot; —
          you&apos;re not doing CI yet.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="ci-cd-deploy" number="03" title="CI vs CD vs Deployment — The Critical Difference ⭐">
        <P>
          People use &quot;CI/CD&quot; as one term, but there are <em>two</em> different CDs — and
          the difference is a single gate: <IC>human approval</IC>. Let&apos;s draw the pipeline.
        </P>
        <CodeBlock
          title="ci_cd_deployment_pipeline.txt"
          runnable={false}
          code={`THE FULL PIPELINE (code → production)

 commit    build     test     artifact    staging     GATE?    production
   ┃         ┃        ┃          ┃           ┃         ┃           ┃
   🧑‍💻  →   🔨   →   🧪   →    📦    →     🌍     →   🚪   →      🚀
   ┃         ┃        ┃          ┃           ┃         ┃           ┃
   └─────────┴────────┴──────────┴───────────┘         │           │
           CONTINUOUS INTEGRATION                       │           │
    (always running, always tested)                     │           │
                                                        │           │
   ┌────────────────────────────────────────────────────┘           │
   │ CONTINUOUS DELIVERY: artifact is ALWAYS READY to deploy        │
   │ (but waits for a human "Deploy" button click) 🖱️ ──────────────┘
   │
   └ CONTINUOUS DEPLOYMENT: zero humans, auto-deploys if green ⚡

╔═══════════════════════════════════════════════════════════╗
║  CONTINUOUS INTEGRATION (CI)                              ║
║  ↳ every commit → build + test automatically              ║
║  ↳ GOAL: catch bugs in MINUTES                            ║
╠═══════════════════════════════════════════════════════════╣
║  CONTINUOUS DELIVERY (CD #1)                              ║
║  ↳ every green build → artifact READY to deploy           ║
║  ↳ MANUAL gate before production (human clicks "Deploy")  ║
║  ↳ GOAL: deploy ANY commit in <10 min if you want to      ║
╠═══════════════════════════════════════════════════════════╣
║  CONTINUOUS DEPLOYMENT (CD #2) — the full automation      ║
║  ↳ every green build → AUTOMATICALLY deployed to prod     ║
║  ↳ NO manual gate (trust the tests)                       ║
║  ↳ GOAL: commit-to-prod in <10 min, zero human clicks 🤖  ║
╚═══════════════════════════════════════════════════════════╝

most teams: CI + Continuous Delivery (manual prod gate)
elite teams: CI + Continuous Deployment (auto all the way) 🚀`}
        />
        <Table
          head={["Practice", "Automation Level", "Typical for..."]}
          rows={[
            ["Continuous Integration", "commit → build + test auto", "every modern team (table stakes)"],
            ["Continuous Delivery", "commit → READY to deploy (1-click)", "most SaaS companies, regulated industries"],
            ["Continuous Deployment", "commit → IN PRODUCTION auto ⚡", "Netflix, Etsy, GitHub — 10+ deploys/day"],
          ]}
        />
        <Callout type="note">
          📘 This course focuses on <IC>CI + Continuous Delivery</IC> (the most common pattern). The
          pipeline knowledge applies to full Continuous Deployment too — you just remove the manual gate.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="what-is-jenkins" number="04" title="What Jenkins Actually Is">
        <P>
          <IC>Jenkins</IC> is an open-source automation server. Think of it as your
          <strong> automation butler </strong>
          🎩 — you give it instructions once (&quot;when code is pushed, run these tests, build this
          artifact, deploy to staging&quot;), and Jenkins executes those instructions faithfully, 24/7,
          never forgetting, never getting tired, always logging every detail.
        </P>
        <CodeBlock
          title="jenkins_as_butler.txt"
          runnable={false}
          code={`THE BUTLER ANALOGY 🎩

YOU (the developer):
"Jenkins, when someone pushes to the main branch:
 1. Pull the latest code from Git
 2. Run npm install
 3. Run npm test — if ANY test fails, STOP and notify me
 4. If tests pass, build the Docker image
 5. Push the image to our registry
 6. Deploy to the staging server
 7. Run the smoke tests
 8. If smoke tests pass, post in #deployments Slack channel
 9. Keep the build logs for 30 days"

JENKINS:
"Understood, sir. I shall execute these 9 steps upon every push,
 and I shall do so at 3 AM or 3 PM with equal diligence. You may
 review my work in the console output at any time. I have logged
 372 builds to date; the current success rate is 94.3%. The last
 failure was 6 hours ago due to a flaky test in checkout.spec.js,
 which you have since fixed. Shall I run it again now? 🎩"

↑ THIS is Jenkins. A tireless automation server that:
  • watches repositories for changes (or you trigger it manually)
  • executes JOBS (sequences of steps) in isolated workspaces
  • runs on a CONTROLLER (the brain) + optional AGENTS (workers)
  • is extended by 1800+ PLUGINS (Git, Docker, Slack, AWS, K8s…)
  • keeps a full history (logs, artifacts, trends) of every run
  • has a web UI (and CLI, and REST API) to configure + monitor`}
        />
        <Callout type="analogy">
          🤖 Jenkins is to your build what cron is to scheduled tasks, but 100x more powerful: instead
          of &quot;run this script at midnight,&quot; it&apos;s &quot;watch Git, run 9 conditional steps
          in a pipeline, handle failures, send notifications, and present results in a beautiful UI.&quot;
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="architecture" number="05" title="Controller + Agent Architecture">
        <P>
          Jenkins uses a <IC>controller/agent</IC> architecture (formerly called master/slave). The
          controller is the brain; agents are the hands. You can run everything on the controller for
          small projects, or distribute work across 100 agents for massive scale.
        </P>
        <CodeBlock
          title="controller_agent_architecture.txt"
          runnable={false}
          code={`┌───────────────────────────────────────────────────────────────┐
│  JENKINS CONTROLLER 🎩 (the brain)                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Web UI  ← users configure jobs, view builds, dashboards│  │
│  │  Job Scheduler  ← decides WHEN to run builds            │  │
│  │  Build Queue    ← pending jobs waiting for an executor  │  │
│  │  Plugin Manager ← Git, Docker, Slack, AWS... 1800+      │  │
│  │  JENKINS_HOME   ← jobs/ workspace/ builds/ config/      │  │
│  └─────────────────────────────────────────────────────────┘  │
│        ↓ distributes work to ↓                                │
└────────┬──────────────────────┬──────────────────┬────────────┘
         │                      │                  │
    ┌────▼─────┐          ┌────▼─────┐      ┌────▼─────┐
    │  AGENT 1 │          │  AGENT 2 │      │  AGENT 3 │
    │  Linux   │          │  Windows │      │ Mac M1   │
    │  Node 18 │          │  .NET 6  │      │ Xcode 14 │
    │  Docker  │          │  VisStudio│      │ iOS sims │
    └──────────┘          └──────────┘      └──────────┘
      2 executors           1 executor        4 executors
         ↓                      ↓                  ↓
    runs backend          runs .NET            runs iOS
    test suite            builds               builds

WHY AGENTS?
1. PARALLELISM: run 7 builds at once (3+2+1+4 executors)
2. ISOLATION: flaky build on Agent 2 doesn't crash Agent 1
3. TOOLING: backend needs Node+Docker, frontend needs different stack
4. SCALE: controller is 2 CPU, agents can be 32-core build monsters
5. SECURITY: untrusted code runs on disposable agents, not controller

small projects: just the controller (it has 2 built-in executors)
big projects: 1 controller + 10-100 agents (auto-scale with cloud plugins)`}
        />
      </Section>

      {/* 06 */}
      <Section id="plugins" number="06" title="The Plugin Ecosystem">
        <P>
          Out of the box, Jenkins is just the orchestration engine. <IC>Plugins</IC> give it
          superpowers: talk to Git, build Docker images, deploy to Kubernetes, send Slack messages,
          integrate with 1800+ tools. The ecosystem is both Jenkins&apos;s strength and its complexity.
        </P>
        <CodeBlock
          title="essential_plugins.txt"
          runnable={false}
          code={`ESSENTIAL PLUGINS (installed by default with "suggested plugins")

📂 SOURCE CONTROL
   Git Plugin           ← clone repos, checkout branches, poll for changes
   GitHub Plugin        ← webhook triggers, PR status checks, GitHub API

🏗️ BUILD TOOLS
   Pipeline             ← Jenkinsfile support (declarative + scripted)
   Docker Pipeline      ← build/push images, run containers as build envs
   NodeJS Plugin        ← manage multiple Node versions per job

🔐 CREDENTIALS
   Credentials Plugin   ← store secrets (username/password, SSH keys, tokens)
   Credentials Binding  ← inject secrets as env vars in pipelines

📊 RESULTS & REPORTS
   JUnit Plugin         ← parse test results (XML), show pass/fail trends
   HTML Publisher       ← publish coverage reports, API docs as artifacts

🔔 NOTIFICATIONS
   Slack Notification   ← post build status to Slack channels
   Email Extension      ← rich email templates (who broke it, changelog…)

☁️ CLOUD & ORCHESTRATION
   Kubernetes Plugin    ← spin up build agents as K8s pods (ephemeral!)
   AWS Steps            ← deploy to S3, ECS, Lambda from pipelines
   Ansible Plugin       ← run playbooks as build steps

🛠️ QUALITY & SECURITY
   SonarQube Scanner    ← code quality gates (block merge if coverage <80%)
   OWASP Dependency-Check ← scan for vulnerable libraries

TOTAL AVAILABLE: 1800+ plugins at plugins.jenkins.io
⚠️ plugin sprawl risk: each plugin = maintenance + security surface`}
        />
        <Callout type="mistake">
          ❌ Mistake: installing every plugin that sounds useful. Each plugin is code that can have bugs,
          security issues, and compatibility problems. Install only what you actively use — treat plugins
          like dependencies (because they are).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="comparison" number="07" title="Jenkins vs GitHub Actions vs GitLab CI ⭐">
        <P>
          Jenkins isn&apos;t the only CI/CD tool. GitHub Actions and GitLab CI are the modern SaaS
          challengers. Here&apos;s the honest comparison:
        </P>
        <Table
          head={["", "Jenkins", "GitHub Actions", "GitLab CI"]}
          rows={[
            ["Hosting", "self-hosted (you run the server)", "SaaS (GitHub&apos;s infra) + self-hosted runners", "SaaS or self-hosted"],
            ["Config", "UI (freestyle) or Jenkinsfile (pipeline)", ".github/workflows/*.yml", ".gitlab-ci.yml in repo"],
            ["Cost", "free (you pay for servers)", "free tier (2000 min/mo) then $0.008/min", "free tier (400 min/mo) then paid"],
            ["Setup effort", "high (install, configure, maintain)", "zero (already have GitHub?)", "medium (if self-hosting)"],
            ["Flexibility", "infinite (1800 plugins, any script)", "high (actions marketplace, any Docker)", "high"],
            ["Ecosystem age", "2011 — mature, battle-tested, legacy UI", "2019 — modern, growing fast", "2012 (CI from 2015)"],
            ["Best for...", "complex pipelines, on-prem, full control", "GitHub repos, fast start, low ops", "GitLab users, integrated DevOps"],
          ]}
        />
        <Callout type="note">
          📘 The trend: new projects often start with GitHub Actions (zero setup). Jenkins dominates
          enterprises with existing infrastructure, complex needs, or on-prem requirements. All three
          are viable — the concepts (pipelines, stages, artifacts) transfer between them.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="when-jenkins" number="08" title="When to Use Jenkins (and When Not)">
        <CodeBlock
          title="decision_flowchart.txt"
          runnable={false}
          code={`"Should we use Jenkins?" — the flowchart

START
 │
 ├─ Are you already on GitHub/GitLab and need simple CI/CD?
 │   └─▶ USE GITHUB ACTIONS or GITLAB CI (zero setup wins)
 │
 ├─ Do you have complex, multi-stage pipelines with 10+ steps,
 │   matrix builds, conditional deployments, and shared logic?
 │   └─▶ JENKINS (or a pro CI/CD platform like CircleCI/Buildkite)
 │
 ├─ Must everything run on-premises (no cloud CI allowed)?
 │   └─▶ JENKINS (self-hosted = full control)
 │
 ├─ Do you already have Jenkins + 200 jobs + a team who knows it?
 │   └─▶ KEEP JENKINS (migration cost > benefit in most cases)
 │
 ├─ Do you need to orchestrate non-CI tasks (ML training,
 │   cron ETL jobs, any scheduled automation)?
 │   └─▶ JENKINS (it's a general automation server, not just CI)
 │
 └─ Startup, small team, just need test + deploy per commit?
     └─▶ GITHUB ACTIONS (or GitLab CI, or Vercel/Netlify built-in)

JENKINS WINS: complexity, on-prem, legacy, mature plugin ecosystem
GITHUB ACTIONS WINS: simplicity, SaaS, zero-setup, modern DX
BOTH ARE FINE: the CI/CD concepts are the same — learn one, you know 80% of the other`}
        />
        <Callout type="tip">
          💡 You can use BOTH: GitHub Actions for PR checks (fast feedback), Jenkins for nightly builds
          + deployments (complex orchestration). They&apos;re not mutually exclusive.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Integration Hell", "merge once/month → 47 conflicts, broken build, ruined weekend"],
            ["Continuous Integration", "merge many times/day + auto tests → catch bugs in minutes"],
            ["CI vs CD", "CI = always tested · CD = always deployable (manual gate) · Deployment = auto to prod"],
            ["Jenkins is...", "open-source automation server — your 24/7 butler for builds 🎩"],
            ["Controller", "the brain: web UI, job scheduler, plugin manager, stores config"],
            ["Agent", "the hands: workers that execute builds (parallel, isolated, specialized)"],
            ["Why agents?", "parallelism, isolation, tooling (Linux/Windows/Mac), scale"],
            ["Plugins", "1800+ extensions (Git, Docker, Slack, K8s…) — install only what you need"],
            ["Jenkinsfile", "pipeline-as-code — versioned in Git with your app (next topics!)"],
            ["vs GitHub Actions", "Jenkins = self-hosted, complex, mature · GHA = SaaS, simple, modern"],
            ["Best first step", "Docker run jenkins/jenkins — unlock — install plugins — create first job ✅"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
