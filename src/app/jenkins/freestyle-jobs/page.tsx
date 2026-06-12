"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Anatomy of a Build — Live",
  nodes: [
    { id: "trigger", icon: "⚡", label: "Trigger", sub: "webhook/manual/cron", x: 7, y: 50, color: "#fbbf24" },
    { id: "queue", icon: "📋", label: "Build Queue", sub: "waiting...", x: 22, y: 25, color: "#a78bfa" },
    { id: "executor", icon: "⚙️", label: "Executor", sub: "runs the job", x: 40, y: 50, color: "#fb923c" },
    { id: "workspace", icon: "📁", label: "Workspace", sub: "Git checkout", x: 58, y: 18, color: "#60a5fa" },
    { id: "steps", icon: "🔨", label: "Build Steps", sub: "shell/script", x: 70, y: 70, color: "#34d399" },
    { id: "status", icon: "✅", label: "Status", sub: "SUCCESS/FAILURE", x: 90, y: 50, color: "#22d3ee" },
  ],
  edges: [
    { id: "trigger-queue", from: "trigger", to: "queue", color: "#a78bfa" },
    { id: "queue-executor", from: "queue", to: "executor", color: "#fb923c" },
    { id: "executor-workspace", from: "executor", to: "workspace", color: "#60a5fa" },
    { id: "workspace-steps", from: "workspace", to: "steps", color: "#34d399" },
    { id: "steps-status", from: "steps", to: "status", color: "#22d3ee" },
    { id: "status-trigger", from: "status", to: "trigger", bend: 70, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "manual",
      name: "🖱️ Manual build",
      command: "click Build Now → green success",
      steps: [
        { node: "trigger", paths: ["trigger-queue"], text: "You click &apos;Build Now&apos; on the job page. Jenkins creates build #1, adds it to the queue with a clock icon. ⏱️" },
        { node: "executor", paths: ["queue-executor", "executor-workspace"], text: "An executor becomes free (Jenkins has 2 by default). Build #1 leaves queue, executor claims it, creates a workspace directory, Git clones your repo into it. 📁" },
        { node: "steps", paths: ["workspace-steps"], text: "Executor runs your build steps: shell script echoes &apos;Hello Jenkins!&apos;, exits 0. All steps succeed. ✅" },
        { node: "status", paths: ["steps-status"], text: "Build finishes. Status = SUCCESS (green ball ☀️). Console output saved. Build #1 is now in history, ready to inspect. 🎉" },
      ],
    },
    {
      id: "failure",
      name: "❌ Shell exits 1",
      command: "test fails → RED build, console shows error",
      steps: [
        { node: "executor", paths: ["queue-executor", "executor-workspace", "workspace-steps"], text: "Build #2 triggered. Executor clones repo, runs shell step: npm test. Tests run... test_payment.js FAILS. npm exits code 1. ❌" },
        { node: "status", paths: ["steps-status"], text: "Shell step failed (non-zero exit) → Jenkins STOPS pipeline, marks build as FAILURE (red ball ⛔). Post-build actions (email notification) fire." },
        { node: "trigger", paths: [], text: "You read the console output (15 lines of npm test output), find the failing test, fix it locally, commit, push. Webhook triggers build #3 → green. The cycle. 🔁" },
      ],
    },
    {
      id: "webhook",
      name: "🪝 Webhook + artifact",
      command: "git push → auto build → archive .jar",
      steps: [
        { node: "trigger", paths: ["trigger-queue"], text: "Developer pushes to GitHub. Webhook fires POST to Jenkins /github-webhook/. Jenkins detects new commit on main, queues build #5. ⚡" },
        { node: "steps", paths: ["queue-executor", "executor-workspace", "workspace-steps"], text: "Executor clones repo (only changed files via Git's smart protocol), runs mvn clean package. Maven compiles, tests pass, produces target/app.jar. 📦" },
        { node: "status", paths: ["steps-status"], text: "Post-build action: &apos;Archive artifacts&apos; copies target/*.jar to build #5&apos;s permanent storage. Build succeeds, artifact downloadable from UI forever (or until deleted). ✅📦" },
      ],
    },
  ],
};

const NAV = [
  { id: "create-job", label: "Create Your First Freestyle Job ⭐" },
  { id: "what-is-build", label: "What a BUILD Actually Is" },
  { id: "scm", label: "Source Code Management (Git)" },
  { id: "triggers", label: "Build Triggers — When to Build? ⭐" },
  { id: "build-steps", label: "Build Steps — What to Run?" },
  { id: "environment", label: "Environment Variables" },
  { id: "post-build", label: "Post-Build Actions" },
  { id: "history", label: "Build History & Console Reading ⭐" },
  { id: "limitations", label: "Why Freestyle Doesn&apos;t Scale" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsFreestyleJobsPage() {
  return (
    <TopicShell
      icon="🧱"
      title="Freestyle Jobs"
      gradientWord="Freestyle"
      subtitle="Create your first Jenkins job click by click. What a BUILD actually is (workspace checkout → steps → status, drawn). Source control, triggers compared (manual, cron, poll SCM, webhook — table + drawn), build steps, environment variables, post-build actions, reading console logs, and why freestyle jobs don&apos;t scale to production pipelines."
      nav={NAV}
      badges={["🖱️ First job", "⚡ Triggers", "📋 Build anatomy"]}
      next={{ icon: "📜", label: "Pipelines as Code", href: "/jenkins/pipelines" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="create-job" number="01" title="Create Your First Freestyle Job ⭐">
        <P>
          A <IC>freestyle job</IC> is the simplest Jenkins job type — you configure it entirely through
          the web UI (no code). Let&apos;s create one step by step.
        </P>
        <CodeBlock
          title="create_job_clicks.txt"
          runnable={false}
          code={`CREATING A FREESTYLE JOB (the UI clicks)

1. Dashboard → click "+ New Item" (top left)
   ┌──────────────────────────────────────────────┐
   │ Enter an item name                           │
   │ ┌────────────────────────────────────────┐   │
   │ │ my-first-job                           │   │
   │ └────────────────────────────────────────┘   │
   │                                              │
   │ ○ Freestyle project     ← SELECT THIS       │
   │ ○ Pipeline                                   │
   │ ○ Multi-configuration project               │
   │ ○ Folder                                     │
   │                                              │
   │                              [OK] button     │
   └──────────────────────────────────────────────┘

2. Configuration page opens (5 sections):

   ┌─ General ────────────────────────────────────┐
   │ Description: [My first Jenkins job]          │
   │ ☐ Discard old builds (keep last 10)          │
   └──────────────────────────────────────────────┘

   ┌─ Source Code Management ─────────────────────┐
   │ ○ None          ← for now, select this       │
   │ ○ Git           ← we'll add this next topic  │
   └──────────────────────────────────────────────┘

   ┌─ Build Triggers ─────────────────────────────┐
   │ ☐ Build periodically (cron syntax)           │
   │ ☐ Poll SCM (check Git for changes)           │
   │ ☐ GitHub hook trigger                        │
   │ (leave all unchecked = manual trigger only)  │
   └──────────────────────────────────────────────┘

   ┌─ Build Environment ──────────────────────────┐
   │ ☐ Delete workspace before build starts       │
   │ ☐ Add timestamps to console output           │
   └──────────────────────────────────────────────┘

   ┌─ Build Steps ────────────────────────────────┐
   │ [Add build step ▼]                           │
   │   → Execute shell     ← SELECT THIS          │
   │   → Execute Windows batch                    │
   │   → Invoke Ant / Maven / Gradle              │
   │                                              │
   │ Command: ┌────────────────────────────────┐  │
   │          │ echo "Hello from Jenkins!"     │  │
   │          │ date                           │  │
   │          │ pwd                            │  │
   │          └────────────────────────────────┘  │
   └──────────────────────────────────────────────┘

   ┌─ Post-build Actions ─────────────────────────┐
   │ [Add post-build action ▼]                    │
   │   (none for now)                             │
   └──────────────────────────────────────────────┘

3. Scroll down, click [Save]

YOU ARE BACK AT THE JOB PAGE:
┌──────────────────────────────────────────────────┐
│ my-first-job                                     │
│ ────────────────────────────────────────────────  │
│ ▶️ Build Now    Configure    Delete    Workspace │
│                                                  │
│ Build History          Permalinks               │
│ ────────────────       ────────────              │
│ (no builds yet)        Last build: none          │
└──────────────────────────────────────────────────┘

4. Click ▶️ "Build Now" → build #1 appears in history
5. Click #1 → click "Console Output" → see your echo ✅`}
        />
        <Callout type="tip">
          💡 The &quot;Build Now&quot; button is your best friend for the next 10 topics. Click it
          liberally — builds are cheap, learning what broke is priceless.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-is-build" number="02" title="What a BUILD Actually Is">
        <P>
          When you click <IC>Build Now</IC> (or a trigger fires), Jenkins creates a <IC>build</IC> — a
          numbered execution of the job. Let&apos;s dissect what happens under the hood:
        </P>
        <CodeBlock
          title="build_lifecycle.txt"
          runnable={false}
          code={`THE LIFECYCLE OF BUILD #1

┌─ TRIGGER ────────────────────────────────────────────────┐
│ You click "Build Now" (or webhook/cron fires)            │
│ Jenkins assigns build number #1 (auto-increment counter) │
│ Build enters the QUEUE (gray ball, waiting for executor) │
└───────────────────────────────────────────────────────────┘
           ↓
┌─ EXECUTOR CLAIMS BUILD ──────────────────────────────────┐
│ Jenkins controller has 2 executors (configurable)        │
│ Executor #1 is free → claims build #1 from queue         │
│ Creates workspace: /var/jenkins_home/workspace/my-first-job/
│ (fresh directory, or reuses if exists)                   │
└───────────────────────────────────────────────────────────┘
           ↓
┌─ SOURCE CODE CHECKOUT (if SCM configured) ───────────────┐
│ If Git: clone (first build) or pull (subsequent builds)  │
│ Workspace now contains your repo files                   │
│ (skipped if SCM = None, like our first job)              │
└───────────────────────────────────────────────────────────┘
           ↓
┌─ BUILD STEPS EXECUTE (in order, top to bottom) ──────────┐
│ Step 1: Execute shell                                    │
│   #!/bin/sh -xe  ← Jenkins wraps your command            │
│   echo "Hello from Jenkins!"  → stdout captured          │
│   date                        → stdout captured          │
│   pwd                         → stdout captured          │
│   exit code 0 = success → continue to next step          │
│   exit code ≠ 0 = FAILURE → STOP, mark build red ❌      │
│ Step 2: (if you added more steps, they run now)          │
└───────────────────────────────────────────────────────────┘
           ↓
┌─ POST-BUILD ACTIONS (always/success/failure) ────────────┐
│ Archive artifacts, send email, publish reports...        │
│ Run even if build failed (depending on configuration)    │
└───────────────────────────────────────────────────────────┘
           ↓
┌─ FINALIZE ───────────────────────────────────────────────┐
│ Save console output to disk:                             │
│   /var/jenkins_home/jobs/my-first-job/builds/1/log       │
│ Update build status:                                     │
│   ✅ SUCCESS (blue ball ☀️, old Jenkins) or green        │
│   ❌ FAILURE (red ball ⛔)                                │
│   ⚠️ UNSTABLE (yellow, tests failed but build succeeded) │
│ Release executor (now free for next build)               │
│ Update job page: "Last Success", "Last Failure" links    │
└───────────────────────────────────────────────────────────┘

BUILD #1 IS NOW IMMUTABLE HISTORY — you can:
• view console output (the full log, timestamped)
• download artifacts (if you archived any)
• see Git changes (the commit that triggered this build)
• compare with build #2, #3... (trends, regressions)

EVERY build gets a number (auto-increment, never reused)
EVERY build gets a workspace (can be wiped between builds)
EVERY build logs EVERYTHING (stdout/stderr → console output)`}
        />
        <Callout type="analogy">
          🎬 A job is a movie script. A build is one showing of that movie. Same script, different
          audience (Git commit), possibly different outcome (tests pass or fail). The script (job config)
          is reusable; each showing (build) is a unique event in time.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="scm" number="03" title="Source Code Management (Git)">
        <P>
          Real jobs pull code from Git before building. Let&apos;s configure SCM (source code management):
        </P>
        <CodeBlock
          title="git_scm_config.txt"
          runnable={false}
          code={`CONFIGURE GIT FOR A JOB

Job page → Configure → Source Code Management section:

┌─ Source Code Management ─────────────────────────────────┐
│ ○ None                                                    │
│ ● Git  ← SELECT THIS                                     │
│                                                           │
│   Repository URL:                                        │
│   ┌───────────────────────────────────────────────────┐  │
│   │ https://github.com/your-username/your-repo.git    │  │
│   └───────────────────────────────────────────────────┘  │
│                                                           │
│   Credentials: [none] (for public repos)                 │
│                [+ Add] (for private repos → username+PAT)│
│                                                           │
│   Branches to build:                                     │
│   ┌───────────────────────────────────────────────────┐  │
│   │ */main   ← means "any repo, main branch"          │  │
│   └───────────────────────────────────────────────────┘  │
│   (change to */dev to build dev branch, or */feature/*  │
│    to build ALL feature branches — multi-branch later)   │
│                                                           │
│   Additional Behaviours: (advanced — skip for now)       │
│     • Clean before checkout (wipe workspace)             │
│     • Checkout to subdirectory                           │
│     • Sparse checkout (only some folders)                │
└───────────────────────────────────────────────────────────┘

SAVE → trigger build → check Console Output:

Started by user admin
Building in workspace /var/jenkins_home/workspace/my-first-job
Cloning the remote Git repository
Cloning repository https://github.com/your-username/your-repo.git
 > git init /var/jenkins_home/workspace/my-first-job
 > git fetch --no-tags --progress https://github.com/.../repo.git
 > git checkout -b main origin/main
Commit message: "Add README"
First time build. Skipping changelog.
 > git rev-parse HEAD  → a3f9c2d7e1b8...

[my-first-job] $ /bin/sh -xe /tmp/jenkins2847561.sh
+ echo "Building commit a3f9c2d7..."
Building commit a3f9c2d7...
Finished: SUCCESS

✅ workspace now contains your repo files!
   ls workspace/ would show: README.md, src/, package.json, ...`}
        />
        <Callout type="note">
          📘 Private repos: use a Personal Access Token (GitHub Settings → Developer settings → PAT).
          Add credentials in Jenkins (Manage Jenkins → Credentials → Add), then select from the dropdown.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="triggers" number="04" title="Build Triggers — When to Build? ⭐">
        <P>
          So far we&apos;ve clicked &quot;Build Now&quot; manually. Production jobs build
          <em> automatically </em>
          when code changes. Jenkins offers 4 trigger types:
        </P>
        <Table
          head={["Trigger", "How It Works", "Syntax / Setup", "Use Case"]}
          rows={[
            ["Manual", "you click Build Now", "n/a", "testing, one-off deployments, learning"],
            ["Build periodically", "cron schedule (time-based)", "H/5 * * * * = every 5 min", "nightly builds, reports, backups"],
            ["Poll SCM", "Jenkins asks Git every N min: new commits?", "H/2 * * * * = poll every 2 min", "legacy (webhook is better)"],
            ["GitHub hook trigger", "GitHub sends webhook on push → instant", "check box + configure webhook in GitHub repo settings", "modern CI (ms latency, best practice) ⭐"],
          ]}
        />
        <CodeBlock
          title="cron_syntax_examples.txt"
          runnable={false}
          code={`BUILD PERIODICALLY — cron syntax (5 fields)

minute  hour  day-of-month  month  day-of-week
  │      │        │           │         │
  0      2        *           *         *     = 2:00 AM daily
  H/15   *        *           *         *     = every 15 min (H = hash, spreads load)
  H      0        *           *         1-5   = nightly on weekdays (Mon-Fri)
  0      */6      *           *         *     = every 6 hours
  H      H(0-7)   *           *         1     = once on Monday morning (0-7 AM, random min+hour)

WHY "H" INSTEAD OF "0"?
If 100 jobs all say "0 2 * * *" they ALL run at 2:00:00 AM exactly
→ Jenkins controller CPU spike, queue pileup, slow 🐌

"H 2 * * *" spreads them: job A at 2:07, job B at 2:34, job C at 2:51
→ smooth load distribution ✅

POLL SCM — same syntax, but Jenkins checks Git instead of building:
  H/5 * * * *  = "every 5 min, check if origin/main has new commits"
                  if yes → trigger build
                  if no → do nothing
  ⚠️ wastes resources (polling), prefer webhooks for real projects`}
        />
        <CodeBlock
          title="github_webhook_setup.txt"
          runnable={false}
          code={`GITHUB WEBHOOK SETUP (best practice for CI) ⭐

1. JENKINS SIDE (job config):
   Build Triggers section:
   ☑️ GitHub hook trigger for GITScm polling
   (that's it — just check the box)

2. GITHUB SIDE (repo settings):
   Repo → Settings → Webhooks → Add webhook
   ┌───────────────────────────────────────────────────────┐
   │ Payload URL: http://your-jenkins.com/github-webhook/ │
   │              ⚠️ must be publicly accessible           │
   │              (localhost won't work — use ngrok for    │
   │               testing, or deploy Jenkins to cloud)    │
   │ Content type: application/json                        │
   │ Secret: (optional — for webhook signature validation)│
   │ Which events?                                         │
   │   ● Just the push event   ← SELECT THIS              │
   │   ○ Send me everything                                │
   │   ○ Let me select (PR, issues, releases...)           │
   └───────────────────────────────────────────────────────┘
   [Add webhook]

3. TEST IT:
   git commit -m "test webhook" && git push
   → GitHub fires POST to Jenkins /github-webhook/
   → Jenkins sees payload: repo=your-repo, branch=main, commit=a3f9c2d
   → Jenkins finds jobs watching that repo+branch
   → triggers build #N within 2 seconds ⚡

   Check Recent Deliveries in GitHub webhook settings for ✅ 200 OK

RESULT: code push → build starts in <5 sec (vs 5 min with poll SCM)
        latency: ms (webhook) vs minutes (poll)
        CI/CD nirvana: commit → test → deploy, all automatic 🚀`}
        />
        <Callout type="mistake">
          ❌ Using &quot;Poll SCM&quot; with H/1 * * * * (every minute) because webhooks &quot;seem
          hard&quot;. You&apos;re hammering your Git server every minute, adding latency (up to 60 sec),
          and burning Jenkins CPU. Webhooks are 3 lines of config. Do it right.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="build-steps" number="05" title="Build Steps — What to Run?">
        <P>
          Build steps are the <em>commands</em> Jenkins runs. For freestyle jobs, you add them via
          dropdowns (Execute shell, Invoke Maven, Run Docker...). Here&apos;s the common ones:
        </P>
        <CodeBlock
          title="build_step_types.txt"
          runnable={false}
          code={`BUILD STEP TYPES (Add build step dropdown)

1. Execute shell (Linux/Mac)
   ┌────────────────────────────────────────┐
   │ #!/bin/bash                            │
   │ npm install                            │
   │ npm run build                          │
   │ npm test                               │
   └────────────────────────────────────────┘
   ↳ runs in workspace directory
   ↳ exit 0 = success, continue to next step
   ↳ exit ≠ 0 = FAILURE, stop build, mark red

2. Execute Windows batch command (Windows agents)
   ┌────────────────────────────────────────┐
   │ call mvn clean install                 │
   │ if %ERRORLEVEL% NEQ 0 exit /b 1        │
   └────────────────────────────────────────┘

3. Invoke top-level Maven targets
   Goals: clean package
   POM: pom.xml
   ↳ equivalent to: mvn -f pom.xml clean package
   ↳ Jenkins parses output, shows test results in UI

4. Invoke Gradle script
   Tasks: build test
   ↳ runs ./gradlew build test

5. Execute Python script (needs Python plugin)
   ┌────────────────────────────────────────┐
   │ import sys                             │
   │ print(f"Python {sys.version}")         │
   │ # run tests, exit 1 if failed          │
   └────────────────────────────────────────┘

YOU CAN ADD MULTIPLE STEPS — they run in order:
  Step 1: Execute shell (install dependencies)
  Step 2: Invoke Maven (build + test)
  Step 3: Execute shell (docker build -t myapp .)
  Step 4: Execute shell (docker push myapp:latest)

IF ANY STEP FAILS (non-zero exit), Jenkins:
  • stops the pipeline (remaining steps DON'T run)
  • marks build as FAILURE ❌
  • runs post-build actions (notifications, cleanup)

each step's stdout/stderr → console output (view in UI)`}
        />
        <CodeBlock
          title="real_nodejs_build_example.sh"
          code={`#!/bin/bash
set -e  # exit on first error (so npm failures stop the build)

echo "=== Installing dependencies ==="
npm ci  # clean install (faster, deterministic vs npm install)

echo "=== Running linter ==="
npm run lint

echo "=== Running tests ==="
npm test -- --coverage --ci

echo "=== Building for production ==="
npm run build

echo "=== Build artifacts created in dist/ ==="
ls -lh dist/`}
          output={`=== Installing dependencies ===
added 342 packages in 8s
=== Running linter ===
✓ 47 files linted, 0 errors
=== Running tests ===
 PASS  src/components/Button.test.tsx
 PASS  src/utils/format.test.ts
Test Suites: 12 passed, 12 total
Tests:       89 passed, 89 total
Coverage:    87.3% statements
=== Building for production ===
vite v5.0.0 building for production...
✓ built in 4.32s
=== Build artifacts created in dist/ ===
-rw-r--r-- 1 jenkins jenkins  247K index.html
-rw-r--r-- 1 jenkins jenkins  1.2M assets/index-a3f9c2d7.js
Finished: SUCCESS`}
        />
      </Section>

      {/* 06 */}
      <Section id="environment" number="06" title="Environment Variables">
        <P>
          Jenkins injects dozens of <IC>environment variables</IC> into every build. Your scripts can
          read them to get build metadata (build number, Git commit, workspace path...).
        </P>
        <CodeBlock
          title="jenkins_env_vars.sh"
          code={`#!/bin/bash
echo "Build Number: \${BUILD_NUMBER}"
echo "Job Name: \${JOB_NAME}"
echo "Workspace: \${WORKSPACE}"
echo "Build URL: \${BUILD_URL}"
echo "Git Commit: \${GIT_COMMIT}"
echo "Git Branch: \${GIT_BRANCH}"
echo "Node Name: \${NODE_NAME}"  # which agent ran this
echo "Jenkins Home: \${JENKINS_HOME}"`}
          output={`Build Number: 42
Job Name: my-first-job
Workspace: /var/jenkins_home/workspace/my-first-job
Build URL: http://localhost:8080/job/my-first-job/42/
Git Commit: a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9
Git Branch: origin/main
Node Name: built-in
Jenkins Home: /var/jenkins_home`}
        />
        <Table
          head={["Variable", "Example Value", "Use Case"]}
          rows={[
            ["BUILD_NUMBER", "42", "tag Docker images: myapp:build-42"],
            ["BUILD_ID", "2026-06-12_14-23-45", "unique timestamp-based ID"],
            ["JOB_NAME", "my-first-job", "scripts that need to know which job is running"],
            ["WORKSPACE", "/var/jenkins_home/workspace/my-first-job", "cd $WORKSPACE/subdir"],
            ["GIT_COMMIT", "a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9", "tag images with commit SHA"],
            ["GIT_BRANCH", "origin/main", "conditional deploy (if main, deploy to prod)"],
            ["BUILD_URL", "http://localhost:8080/job/.../42/", "post to Slack: click here to see logs"],
          ]}
        />
        <Callout type="tip">
          💡 Print all env vars: add build step <IC>printenv | sort</IC> — you&apos;ll see 40+ variables
          Jenkins provides. Useful for debugging scripts.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="post-build" number="07" title="Post-Build Actions">
        <P>
          After build steps finish (success or failure), <IC>post-build actions</IC> run. Common uses:
          archive artifacts, send notifications, publish test reports.
        </P>
        <CodeBlock
          title="post_build_actions.txt"
          runnable={false}
          code={`POST-BUILD ACTIONS (bottom of job config)

[Add post-build action ▼]

1. Archive the artifacts
   Files to archive: dist/**/*.js, dist/**/*.css, dist/index.html
   ↳ copies matched files to:
     /var/jenkins_home/jobs/my-first-job/builds/42/archive/
   ↳ downloadable from build page forever (or until build deleted)
   ↳ USE CASE: store .jar, .zip, Docker images (as tar), release binaries

2. Publish JUnit test result report
   Test report XMLs: target/surefire-reports/*.xml
   ↳ parses XML → shows pass/fail/skip counts in UI
   ↳ trend graph (tests over time)
   ↳ marks build UNSTABLE (yellow) if tests fail but build succeeds

3. Email Notification (Email Extension plugin)
   Recipients: dev-team@example.com
   Triggers: Failure - Any, Success - 1st (only first success after failures)
   ↳ sends HTML email with build status, console snippet, Git changes

4. Slack Notification (Slack Notification plugin)
   Channel: #builds
   Message: Build #\${BUILD_NUMBER} - \${BUILD_STATUS}
   ↳ posts to Slack when build finishes

5. Build other projects (trigger downstream jobs)
   Projects to build: deploy-to-staging
   Trigger only if build is stable
   ↳ USE CASE: build → test → THEN deploy (chained jobs)
     (pipelines do this better — next topic!)

6. Delete workspace when build is done
   ↳ saves disk space (workspace can be GB for big repos)
   ↳ next build clones fresh (slower, but clean)

MULTIPLE ACTIONS RUN IN ORDER (all of them, even if build failed,
unless you configure "Run only if build succeeds")`}
        />
        <Callout type="note">
          📘 Artifacts vs workspace: <IC>workspace</IC> is transient (can be wiped). <IC>Archived
          artifacts</IC> are permanent (stored in builds/ directory). If you need it later (deploy, debug,
          audit), archive it.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="history" number="08" title="Build History & Console Reading ⭐">
        <P>
          The <IC>Console Output</IC> is your #1 debugging tool. Every build logs everything — Git
          output, shell commands (with <IC>-x</IC> flag showing each line), stdout, stderr, exit codes.
          Let&apos;s read one:
        </P>
        <CodeBlock
          title="example_console_output.txt"
          runnable={false}
          code={`Started by user admin
Running as SYSTEM
Building in workspace /var/jenkins_home/workspace/my-first-job
The recommended git tool is: NONE
using credential github-pat
Cloning the remote Git repository
Cloning repository https://github.com/yourname/yourrepo.git
 > git init /var/jenkins_home/workspace/my-first-job
 > git fetch --no-tags --progress -- https://github.com/yourname/yourrepo.git
 > git checkout -f a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9
Commit message: "Fix payment bug"
 > git rev-list --no-walk a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9
[my-first-job] $ /bin/sh -xe /tmp/jenkins8472653912847.sh
+ npm ci
added 342 packages in 8.2s
+ npm test
> yourapp@1.0.0 test
> jest --ci --coverage

 PASS  src/utils/format.test.ts
 FAIL  src/services/payment.test.ts
  ● PaymentService › processPayment › should handle null card

    expect(received).toEqual(expected)

    Expected: {error: "Invalid card"}
    Received: undefined

      at Object.<anonymous> (src/services/payment.test.ts:42:23)

Test Suites: 1 failed, 11 passed, 12 total
Tests:       1 failed, 88 passed, 89 total
npm ERR! Test failed. See above for more details.
Build step 'Execute shell' marked build as failure
Finished: FAILURE

HOW TO READ THIS:
1. "Started by user admin" ← WHO triggered it
2. Git clone output ← checkout succeeded, commit a3f9c2d7
3. "+ npm ci" ← the + means shell -x is echoing each command
4. npm output ← 342 packages installed (normal)
5. npm test output ← 1 test FAILED (payment.test.ts:42)
6. "npm ERR!" ← npm exited non-zero
7. "marked build as failure" ← Jenkins stops, no further steps
8. "Finished: FAILURE" ← final status

FIX: read line 23-26 (the assertion failure), fix payment.test.ts,
     commit, push, webhook triggers new build, tests pass ✅

The console is CHRONOLOGICAL, COMPLETE, and IMMUTABLE — your
source of truth for "what happened in build #42?"`}
        />
        <Callout type="tip">
          💡 Jenkins adds <IC>-xe</IC> to shell steps: <IC>-x</IC> = echo each command before running
          (so you see what&apos;s executing), <IC>-e</IC> = exit on first error (so build stops fast). You
          can override with <IC>#!/bin/bash</IC> as the first line if you need different flags.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="limitations" number="09" title="Why Freestyle Doesn&apos;t Scale">
        <P>
          Freestyle jobs are fine for learning and simple tasks (run a script, archive a file). But
          they have fatal flaws for production CI/CD:
        </P>
        <CodeBlock
          title="freestyle_problems.txt"
          runnable={false}
          code={`WHY FREESTYLE JOBS DON'T SCALE TO PRODUCTION

❌ CONFIGURED IN THE UI (not version-controlled)
   • job config lives in Jenkins, not Git
   • you click 50 checkboxes, hit Save — config is now in Jenkins DB
   • disaster recovery? restore from backup or recreate manually 😭
   • team collaboration? "hey can you add a build step?" → you log in, click
   • code review the CI config? IMPOSSIBLE (it's not in the repo)

❌ NO PIPELINE STAGES (just a flat list of steps)
   • can't express: "deploy to staging, THEN wait, THEN deploy to prod"
   • can't visualize progress (which stage is running?)
   • can't restart from a failed stage (all-or-nothing re-run)

❌ HARD TO REUSE LOGIC
   • you have 10 microservices, all need: npm ci → npm test → docker build
   • freestyle: copy-paste config 10 times (nightmare to update)
   • pipeline: shared library function, call it from Jenkinsfile ✅

❌ POOR CONDITIONAL LOGIC
   • "if main branch, deploy to prod; if feature branch, skip deploy"
   • freestyle: you'd need plugins + fragile regex trigger config
   • pipeline: if (env.GIT_BRANCH == 'origin/main') { ... } 🎯

❌ NO PARALLELISM
   • can't run "backend tests" and "frontend tests" in parallel
   • freestyle jobs are sequential (step 1 → step 2 → step 3)
   • pipeline: parallel { stage('backend') {...} stage('frontend') {...} }

✅ WHEN FREESTYLE IS STILL OK:
   • learning Jenkins (this topic!)
   • one-off admin tasks (backup script, cron cleanup job)
   • very simple build (clone, run 1 script, done)
   • migrating from legacy Jenkins (100 freestyle jobs already exist)

THE REPLACEMENT: PIPELINE JOBS (next topic)
   • Jenkinsfile lives in Git with your code (version-controlled ✅)
   • declarative stages (build → test → deploy, visualized in UI)
   • reusable via shared libraries
   • if/else, try/catch, loops — full programming model
   • THIS is how modern Jenkins is done 🚀`}
        />
        <Callout type="note">
          📘 You&apos;ll still see freestyle jobs in the wild (especially older Jenkins installations).
          Understanding them helps you migrate to pipelines — the concepts (triggers, workspace, build
          steps, artifacts) are identical, just expressed differently.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Freestyle job", "UI-configured job (not code) — simple but doesn't scale"],
            ["Build lifecycle", "trigger → queue → executor claims → checkout → steps → status → log saved"],
            ["Workspace", "/var/jenkins_home/workspace/<job-name>/ — Git clones here, steps run here"],
            ["Exit code 0", "success, continue to next step · non-zero = FAILURE, stop build ❌"],
            ["Triggers: manual", "click Build Now (good for testing)"],
            ["Triggers: cron", "H/5 * * * * = every 5 min (time-based, use H for load spreading)"],
            ["Triggers: poll SCM", "Jenkins asks Git every N min for changes (legacy, wasteful)"],
            ["Triggers: webhook", "GitHub POSTs to Jenkins on push (instant, best practice ⭐)"],
            ["BUILD_NUMBER", "42 (auto-increment) — use for tagging: myapp:build-42"],
            ["GIT_COMMIT", "a3f9c2d7e1b8... — tag images with commit SHA for traceability"],
            ["Archive artifacts", "post-build action — saves files to builds/<N>/archive/ (permanent)"],
            ["Console Output", "the FULL log (chronological, complete, immutable) — #1 debug tool 🔍"],
            ["Why not freestyle?", "UI-only config (not in Git), no stages, hard to reuse, no parallelism"],
            ["Next step", "Jenkinsfile (pipeline-as-code) — version-controlled, stages, reusable ✅"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
