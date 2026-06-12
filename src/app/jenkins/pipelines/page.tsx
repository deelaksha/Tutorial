"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Declarative Pipeline Run — Live",
  nodes: [
    { id: "jenkinsfile", icon: "📜", label: "Jenkinsfile", sub: "in Git repo", x: 7, y: 50, color: "#a78bfa" },
    { id: "checkout", icon: "🔱", label: "Checkout", sub: "SCM stage", x: 22, y: 25, color: "#60a5fa" },
    { id: "build", icon: "🔨", label: "Build", sub: "compile + package", x: 38, y: 65, color: "#fb923c" },
    { id: "test", icon: "🧪", label: "Test", sub: "run test suite", x: 55, y: 30, color: "#34d399" },
    { id: "deploy", icon: "🚀", label: "Deploy", sub: "to staging", x: 72, y: 70, color: "#f472b6" },
    { id: "post", icon: "📬", label: "Post", sub: "notifications", x: 90, y: 50, color: "#fbbf24" },
  ],
  edges: [
    { id: "jenkinsfile-checkout", from: "jenkinsfile", to: "checkout", color: "#60a5fa" },
    { id: "checkout-build", from: "checkout", to: "build", color: "#fb923c" },
    { id: "build-test", from: "build", to: "test", color: "#34d399" },
    { id: "test-deploy", from: "test", to: "deploy", color: "#f472b6" },
    { id: "deploy-post", from: "deploy", to: "post", color: "#fbbf24" },
    { id: "test-post", from: "test", to: "post", bend: 50, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ All stages green",
      command: "checkout → build → test → deploy → post success",
      steps: [
        { node: "checkout", paths: ["jenkinsfile-checkout"], text: "Pipeline starts. Jenkins reads Jenkinsfile from the repo, clones code into workspace. Checkout stage = implicit (you don't write it). ✅" },
        { node: "build", paths: ["checkout-build"], text: "Build stage: npm ci, npm run build. Exit 0, stage succeeds, green checkmark in stage view. Proceeds to next stage. 🔨" },
        { node: "test", paths: ["build-test"], text: "Test stage: npm test. All 89 tests pass. Stage green. ✅" },
        { node: "deploy", paths: ["test-deploy"], text: "Deploy stage: scp dist/ to staging server, restart service. Health check passes. Stage green. 🚀" },
        { node: "post", paths: ["deploy-post"], text: "Post 'success' block runs: Slack notification &apos;Build #42 deployed to staging ✅&apos;. Pipeline complete, all stages green. 🎉" },
      ],
    },
    {
      id: "fail",
      name: "❌ Test fails",
      command: "build OK → tests FAIL → deploy skipped, post failure runs",
      steps: [
        { node: "build", paths: ["jenkinsfile-checkout", "checkout-build"], text: "Checkout + Build stages succeed. npm run build completes, dist/ created. Build stage green. ✅" },
        { node: "test", paths: ["build-test"], text: "Test stage: npm test. Test #47 (payment logic) FAILS. npm exits 1. Stage marked FAILURE (red ❌). Pipeline STOPS — deploy stage is SKIPPED." },
        { node: "post", paths: ["test-post"], text: "Post 'failure' block runs: Slack posts &apos;@dev-team Build #42 FAILED in Test stage — payment.test.ts:42&apos;. GitHub status check = red, PR merge blocked. Fix → push → re-run. 🔁" },
      ],
    },
    {
      id: "conditional",
      name: "🌿 Feature branch",
      command: "when{} skips deploy on non-main branch",
      steps: [
        { node: "test", paths: ["jenkinsfile-checkout", "checkout-build", "build-test"], text: "Developer pushes to feature/add-payment. Webhook triggers pipeline. Checkout, Build, Test stages all run normally. All green. ✅" },
        { node: "deploy", paths: [], text: "Deploy stage has when { branch 'main' }. Current branch = feature/add-payment. Condition = false. Deploy stage SKIPPED (gray, not run). 🚫" },
        { node: "post", paths: ["test-post"], text: "Post 'success' runs (build succeeded overall). Slack: &apos;Build #43 on feature/add-payment — tests passed, deploy skipped (not main)&apos;. Safe PR workflow. 🌿✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-pipeline", label: "Why Pipeline-as-Code? ⭐" },
  { id: "jenkinsfile", label: "The Jenkinsfile Lives in Git" },
  { id: "declarative-skeleton", label: "Declarative Pipeline Skeleton ⭐" },
  { id: "stages-steps", label: "Stages & Steps Dissected" },
  { id: "post", label: "Post Conditions (always/success/failure)" },
  { id: "environment", label: "Environment & Credentials" },
  { id: "parameters", label: "Parameters (User Input)" },
  { id: "when", label: "when {} — Conditional Stages ⭐" },
  { id: "scripted-vs-declarative", label: "Scripted vs Declarative" },
  { id: "replay", label: "Replay & Restart from Stage" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsPipelinesPage() {
  return (
    <TopicShell
      icon="📜"
      title="Pipelines as Code"
      gradientWord="Pipelines"
      subtitle="Why pipeline-as-code beats freestyle (Jenkinsfile lives in Git = version control + code review). The declarative pipeline skeleton dissected line by line, post conditions, environment & credentials, parameters, when{} conditionals, stage view visualization, scripted vs declarative compared, and replay & restart-from-stage features. This is the real Jenkins."
      nav={NAV}
      badges={["📜 Jenkinsfile", "🎯 Declarative syntax", "🔀 Stages visualized"]}
      next={{ icon: "🤖", label: "Agents & Distributed Builds", href: "/jenkins/agents-distributed" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-pipeline" number="01" title="Why Pipeline-as-Code? ⭐">
        <P>
          Freestyle jobs store configuration in the Jenkins database (clicks in the UI). <IC>Pipeline
          jobs</IC> store configuration in a <IC>Jenkinsfile</IC> — a text file in your Git repo,
          version-controlled alongside your code. This changes everything.
        </P>
        <CodeBlock
          title="freestyle_vs_pipeline.txt"
          runnable={false}
          code={`FREESTYLE JOB                      PIPELINE JOB (Jenkinsfile)
─────────────────────────────────────────────────────────────
config stored in Jenkins DB   ←→  config stored in Git repo ✅
configured via UI clicks      ←→  written as code (Groovy DSL)
no version history            ←→  full Git history (blame, diff, revert)
no code review                ←→  PR review the CI config ✅
disaster recovery = backup    ←→  disaster recovery = git clone ✅
hard to replicate (click 50x) ←→  copy Jenkinsfile to new repo, done
no stages (flat steps)        ←→  stages visualized in UI 📊
can't reuse logic easily      ←→  shared libraries (DRY) ✅
weak conditionals             ←→  if/else, when{}, try/catch
no parallelism                ←→  parallel stages ✅

THE KILLER FEATURE:
  Your app code + your CI/CD config live in the SAME commit.
  → deploy v1.2.3 of your app? Jenkins uses the Jenkinsfile
    FROM THAT TAG (not the latest pipeline config from main).
  → bisect a broken build? git log Jenkinsfile shows WHO changed
    the pipeline and WHEN.
  → onboard new dev? git clone, read Jenkinsfile, you know the
    entire build/test/deploy flow. No "ask Bob how CI works." 🎯

If you take one thing from this course: USE PIPELINES, NOT FREESTYLE.`}
        />
        <Callout type="analogy">
          🏗️ Freestyle = building a house by telling the foreman what to do verbally each day. Pipeline =
          handing the foreman blueprints (Jenkinsfile). The blueprints can be reviewed, versioned,
          improved, and reused for the next house. Which would you trust for a 50-story building?
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="jenkinsfile" number="02" title="The Jenkinsfile Lives in Git">
        <P>
          A <IC>Jenkinsfile</IC> is a plain text file (no extension, or <IC>.groovy</IC>) at the root of
          your repo. Jenkins reads it when the pipeline runs. Let&apos;s create one:
        </P>
        <CodeBlock
          title="Terminal (in your Git repo)"
          code={`# Create the simplest possible Jenkinsfile
cat > Jenkinsfile << 'EOF'
pipeline {
    agent any
    stages {
        stage('Hello') {
            steps {
                echo 'Hello from Jenkinsfile!'
            }
        }
    }
}
EOF

git add Jenkinsfile
git commit -m "Add Jenkinsfile"
git push`}
          output={`[main a3f9c2d] Add Jenkinsfile
 1 file changed, 10 insertions(+)
 create mode 100644 Jenkinsfile`}
        />
        <CodeBlock
          title="jenkins_create_pipeline_job.txt"
          runnable={false}
          code={`CREATING A PIPELINE JOB (Jenkins UI)

Dashboard → New Item
┌──────────────────────────────────────────────┐
│ Enter an item name: my-pipeline              │
│ ○ Freestyle project                          │
│ ● Pipeline            ← SELECT THIS          │
│ ○ Multibranch Pipeline (advanced, later)     │
└──────────────────────────────────────────────┘
[OK]

Configuration page → Pipeline section:
┌─ Pipeline ───────────────────────────────────┐
│ Definition: [Pipeline script from SCM ▼]     │
│                                              │
│ SCM: [Git ▼]                                 │
│   Repository URL: https://github.com/you/... │
│   Credentials: (none for public repos)       │
│   Branch: */main                             │
│                                              │
│ Script Path: Jenkinsfile  ← default, keep it │
│              (or path/to/Jenkinsfile if      │
│               in a subdirectory)             │
└──────────────────────────────────────────────┘

[Save]

NOW: Jenkins will:
1. Clone your repo (the Jenkinsfile is IN the repo ✅)
2. Read the Jenkinsfile
3. Execute the pipeline defined in it
4. EVERY time the pipeline runs, it uses the Jenkinsfile
   FROM THAT COMMIT (version-controlled pipeline!)

Build Now → check Console Output:
...
Checking out Revision a3f9c2d (origin/main)
 > git checkout -f a3f9c2d
...
Loading Pipeline script Jenkinsfile
[Pipeline] Start of Pipeline
[Pipeline] node
[Pipeline] {
[Pipeline] stage (Hello)
[Pipeline] { (Hello)
[Pipeline] echo
Hello from Jenkinsfile!
[Pipeline] }
[Pipeline] }
[Pipeline] End of Pipeline
Finished: SUCCESS

✅ Your first pipeline-as-code! The Jenkinsfile in Git defines it.`}
        />
      </Section>

      {/* 03 */}
      <Section id="declarative-skeleton" number="03" title="Declarative Pipeline Skeleton ⭐">
        <P>
          Jenkins has TWO pipeline syntaxes: <IC>declarative</IC> (structured, recommended for 95% of
          use cases) and <IC>scripted</IC> (Groovy code, more flexible but complex). Let&apos;s learn
          declarative — here&apos;s the skeleton you&apos;ll copy 1000 times:
        </P>
        <CodeBlock
          title="Jenkinsfile (declarative template)"
          code={`pipeline {
    agent any  // run on any available agent (or specify label/docker)

    environment {
        // define env vars available to ALL stages
        APP_NAME = 'my-app'
        VERSION = "\${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                echo "Building \${APP_NAME} version \${VERSION}..."
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to staging...'
                sh './deploy.sh staging'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished (success or failure)'
        }
        success {
            echo 'Build succeeded! 🎉'
        }
        failure {
            echo 'Build failed 😭'
        }
    }
}`}
        />
        <CodeBlock
          title="skeleton_dissection.txt"
          runnable={false}
          code={`DECLARATIVE PIPELINE ANATOMY (line by line)

pipeline {              ← REQUIRED root block (declarative pipelines MUST start with this)
    agent any           ← WHERE to run? "any" = any available executor
                          (or: agent { label 'linux' }, agent { docker 'node:18' })

    environment {       ← OPTIONAL: define variables for all stages
        KEY = 'value'     (available as \${KEY} or env.KEY in steps)
    }

    stages {            ← REQUIRED: container for all stage{} blocks
        stage('Build') {  ← ONE stage (shows as column in Stage View UI)
            steps {         ← REQUIRED: the actual commands
                echo '...'    (declarative step: simple command)
                sh 'cmd'      (run shell command)
            }
        }
        stage('Test') { steps { ... } }
        stage('Deploy') { steps { ... } }
        // you can have 2-20 stages (build, test, lint, scan, deploy, smoke-test…)
    }

    post {              ← OPTIONAL: runs AFTER all stages (cleanup, notifications)
        always { }        run no matter what (success or failure)
        success { }       run only if pipeline succeeded
        failure { }       run only if pipeline failed
        unstable { }      run if tests failed but build succeeded (yellow)
    }
}

STAGE VIEW IN UI (after running the pipeline):
┌───────────────────────────────────────────────────────────┐
│  my-pipeline #42                                          │
│  ────────────────────────────────────────────────────────  │
│  Stage View:                                              │
│  ┌────────┬────────┬────────┬────────┐                   │
│  │ Build  │  Test  │ Deploy │  Post  │                   │
│  │   ✅   │   ✅   │   ✅   │   ✅   │  (4 green checks) │
│  │  2m 4s │  34s   │  1m 2s │   1s   │  (duration each)  │
│  └────────┴────────┴────────┴────────┘                   │
│  Overall: SUCCESS     Duration: 3m 41s                    │
└───────────────────────────────────────────────────────────┘

VS FREESTYLE (no stage view, just one big log):
  Build #42: SUCCESS (3m 41s)  ← no breakdown, no visual progress

STAGE VIEW = you instantly see WHERE a failure happened (Test stage red? fix tests)
             you can RESTART from that stage (don't re-run Build) ⭐`}
        />
      </Section>

      {/* 04 */}
      <Section id="stages-steps" number="04" title="Stages & Steps Dissected">
        <P>
          <IC>Stages</IC> are the columns in the stage view (Build, Test, Deploy). <IC>Steps</IC> are
          the individual commands inside a stage. Let&apos;s see the available step types:
        </P>
        <CodeBlock
          title="common_steps.groovy"
          code={`stage('Build') {
    steps {
        // 1. SHELL COMMAND (Linux/Mac)
        sh 'echo "Building..."'
        sh 'npm ci'
        sh '''
            # multi-line shell script (triple quotes)
            npm run build
            ls -lh dist/
        '''

        // 2. WINDOWS BATCH (if running on Windows agent)
        bat 'echo "Building on Windows"'
        bat 'call mvn clean install'

        // 3. POWERSHELL (Windows)
        powershell 'Write-Host "Building..."'

        // 4. ECHO (simple message to console)
        echo "Build completed at \${new Date()}"

        // 5. ERROR (fail the build intentionally)
        error('Stopping build due to critical issue')

        // 6. SCRIPT BLOCK (run arbitrary Groovy code)
        script {
            def version = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
            echo "Git SHA: \${version}"
            env.GIT_SHORT_SHA = version  // set env var dynamically
        }

        // 7. RETRY (retry a flaky step up to N times)
        retry(3) {
            sh './flaky-integration-test.sh'
        }

        // 8. TIMEOUT (kill step if it takes too long)
        timeout(time: 5, unit: 'MINUTES') {
            sh 'npm test'
        }

        // 9. DIR (run steps in a subdirectory)
        dir('frontend') {
            sh 'npm ci'
            sh 'npm run build'
        }

        // 10. ARCHIVE ARTIFACTS
        archiveArtifacts artifacts: 'dist/**/*.js', fingerprint: true

        // 11. PUBLISH TEST RESULTS
        junit 'target/surefire-reports/*.xml'
    }
}`}
        />
        <Callout type="tip">
          💡 The <IC>script {}</IC> block is your escape hatch — inside it you can write full Groovy code
          (variables, loops, if/else, function calls). Use sparingly (keep pipelines declarative), but
          it&apos;s there for complex logic.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="post" number="05" title="Post Conditions (always/success/failure)">
        <P>
          The <IC>post</IC> section runs <em>after</em> all stages finish. You define blocks for
          different outcomes. This is where notifications, cleanup, and final artifact publishing live.
        </P>
        <CodeBlock
          title="post_conditions_example.groovy"
          code={`pipeline {
    agent any
    stages {
        stage('Build') { steps { sh 'npm run build' } }
        stage('Test')  { steps { sh 'npm test' } }
    }
    post {
        always {
            // runs NO MATTER WHAT (success, failure, aborted)
            echo 'Cleaning up workspace...'
            deleteDir()  // wipe workspace to save disk
        }
        success {
            // runs ONLY if all stages succeeded ✅
            echo 'All stages passed!'
            slackSend(channel: '#builds', color: 'good',
                      message: "Build #\${BUILD_NUMBER} succeeded")
        }
        failure {
            // runs ONLY if any stage failed ❌
            echo 'Build failed!'
            slackSend(channel: '#builds', color: 'danger',
                      message: "@here Build #\${BUILD_NUMBER} FAILED - check console")
            emailext(
                to: 'dev-team@example.com',
                subject: "Jenkins FAILURE: \${JOB_NAME} #\${BUILD_NUMBER}",
                body: "Check console: \${BUILD_URL}console"
            )
        }
        unstable {
            // runs if tests failed but build steps succeeded (yellow ⚠️)
            echo 'Tests failed but build succeeded (unstable)'
        }
        aborted {
            // runs if user clicked "Abort" or timeout killed it
            echo 'Build was aborted'
        }
        changed {
            // runs if build status CHANGED from last build
            // (e.g., last build failed, this one succeeded)
            echo 'Build status changed!'
        }
    }
}`}
        />
        <Table
          head={["Post Condition", "When It Runs", "Common Use"]}
          rows={[
            ["always", "every build (success or failure)", "cleanup: deleteDir(), archive logs"],
            ["success", "all stages green ✅", "Slack success message, deploy artifact to registry"],
            ["failure", "any stage red ❌", "email/Slack alert, create JIRA ticket, notify on-call"],
            ["unstable", "tests failed, build succeeded ⚠️", "notify QA team, mark as flaky"],
            ["aborted", "user/timeout killed the build", "log the abort reason"],
            ["changed", "status ≠ last build (red→green or vice versa)", "\"build is fixed!\" message"],
          ]}
        />
        <Callout type="note">
          📘 You can define <IC>post</IC> at the pipeline level (runs once at the end) OR at the stage
          level (runs after that stage). Stage-level post is rare but useful for per-stage cleanup.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="environment" number="06" title="Environment & Credentials">
        <P>
          The <IC>environment</IC> block defines variables. Credentials (passwords, API keys, SSH keys)
          are injected securely via the <IC>credentials()</IC> helper — Jenkins replaces them with
          <IC>****</IC> in logs.
        </P>
        <CodeBlock
          title="environment_and_credentials.groovy"
          code={`pipeline {
    agent any
    environment {
        // simple string variables
        APP_NAME = 'my-app'
        DEPLOY_ENV = 'staging'

        // use Jenkins env vars
        VERSION = "\${env.BUILD_NUMBER}"
        GIT_SHA = "\${env.GIT_COMMIT?.take(7)}"  // first 7 chars of commit hash

        // CREDENTIALS (stored in Jenkins Credentials manager)
        // Jenkins replaces the actual value with **** in console output 🔐
        DOCKER_CREDS = credentials('docker-hub-credentials')  // username:password
        AWS_ACCESS_KEY = credentials('aws-access-key-id')     // secret text
        SSH_KEY = credentials('deploy-ssh-key')               // SSH private key file
    }
    stages {
        stage('Build Docker Image') {
            steps {
                // DOCKER_CREDS expands to username:password
                // Jenkins auto-creates DOCKER_CREDS_USR and DOCKER_CREDS_PSW
                sh '''
                    echo "\${DOCKER_CREDS_PSW}" | docker login -u "\${DOCKER_CREDS_USR}" --password-stdin
                    docker build -t \${APP_NAME}:\${VERSION} .
                    docker push \${APP_NAME}:\${VERSION}
                '''
            }
        }
        stage('Deploy') {
            steps {
                // SSH_KEY is a file path (Jenkins wrote the key to a temp file)
                sh '''
                    ssh -i "\${SSH_KEY}" deploy@staging.example.com \\
                        "docker pull \${APP_NAME}:\${VERSION} && docker restart app"
                '''
            }
        }
    }
}`}
        />
        <CodeBlock
          title="how_to_add_credentials.txt"
          runnable={false}
          code={`ADDING CREDENTIALS IN JENKINS UI

Manage Jenkins → Credentials → (global) → Add Credentials

┌─ Add Credentials ────────────────────────────────────────┐
│ Kind: [Username with password ▼]  ← or Secret text, SSH, etc.
│ Scope: Global (can be used by any job)                  │
│ Username: [your-docker-username]                         │
│ Password: [your-docker-password-or-PAT]                  │
│ ID: [docker-hub-credentials]  ← YOU reference this in Jenkinsfile
│ Description: Docker Hub login                            │
└──────────────────────────────────────────────────────────┘
[OK]

NOW in your Jenkinsfile:
  environment {
      DOCKER_CREDS = credentials('docker-hub-credentials')
  }

Jenkins will:
1. Fetch the credential from its encrypted store
2. Inject it as an environment variable (string or file path)
3. MASK IT in console output (shows **** instead of the real value) 🔐
4. Clean it up after the build (temp files deleted)

CREDENTIAL TYPES:
• Username with password → expands to USR and PSW vars
• Secret text            → single string (API key, token)
• Secret file            → file path (kubeconfig, .env file)
• SSH Username with private key → file path to private key
• Certificate            → .p12 file + password

⚠️ NEVER commit secrets to Git (no passwords in Jenkinsfile!)
   ALWAYS use credentials() + Jenkins credential store`}
        />
      </Section>

      {/* 07 */}
      <Section id="parameters" number="07" title="Parameters (User Input)">
        <P>
          <IC>Parameters</IC> let you prompt the user for input when they click &quot;Build with
          Parameters&quot;. Useful for choosing deploy targets, toggling features, or passing version
          numbers.
        </P>
        <CodeBlock
          title="parameterized_pipeline.groovy"
          code={`pipeline {
    agent any
    parameters {
        // 1. STRING parameter (free-text input)
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version to deploy')

        // 2. CHOICE parameter (dropdown)
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'],
               description: 'Deploy target')

        // 3. BOOLEAN parameter (checkbox)
        booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run test suite?')

        // 4. TEXT parameter (multi-line input)
        text(name: 'CHANGELOG', defaultValue: '', description: 'Release notes')
    }
    stages {
        stage('Build') {
            steps {
                echo "Building version \${params.VERSION} for \${params.ENVIRONMENT}"
            }
        }
        stage('Test') {
            when {
                expression { params.RUN_TESTS == true }  // conditional stage
            }
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                script {
                    if (params.ENVIRONMENT == 'production') {
                        echo '🚀 DEPLOYING TO PRODUCTION'
                        input message: 'Are you SURE?', ok: 'Deploy to Prod'  // manual gate
                    }
                    sh "./deploy.sh \${params.ENVIRONMENT} \${params.VERSION}"
                }
            }
        }
        stage('Changelog') {
            steps {
                echo "Release notes:\\n\${params.CHANGELOG}"
            }
        }
    }
}`}
        />
        <CodeBlock
          title="build_with_parameters_ui.txt"
          runnable={false}
          code={`WHEN YOU HAVE parameters {}, THE UI CHANGES:

Job page:
┌──────────────────────────────────────────────────────────┐
│ my-pipeline                                              │
│ ────────────────────────────────────────────────────────  │
│ ⚙️ Build with Parameters  ← NEW button (not "Build Now")│
└──────────────────────────────────────────────────────────┘

Click it → parameter form appears:
┌─ Build with Parameters ──────────────────────────────────┐
│ VERSION:                                                 │
│ ┌────────────────────────┐                               │
│ │ 1.0.0                  │  ← default value, editable    │
│ └────────────────────────┘                               │
│ ENVIRONMENT:                                             │
│ [staging ▼]  ← dropdown (dev, staging, production)       │
│                                                          │
│ ☑️ RUN_TESTS  ← checkbox, checked by default             │
│                                                          │
│ CHANGELOG:                                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Fixed payment bug, added dark mode                   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│                                      [Build] button      │
└──────────────────────────────────────────────────────────┘

User fills in values → clicks Build → Jenkins runs pipeline with:
  params.VERSION = '1.0.0'
  params.ENVIRONMENT = 'staging'
  params.RUN_TESTS = true
  params.CHANGELOG = 'Fixed payment bug, added dark mode'

USE CASE: manual deployments (pick prod/staging), feature toggles,
          version pinning, any workflow that needs human input 🖱️`}
        />
      </Section>

      {/* 08 */}
      <Section id="when" number="08" title="when {} — Conditional Stages ⭐">
        <P>
          The <IC>when</IC> directive skips a stage if a condition is false. Common use: only deploy to
          production from the <IC>main</IC> branch, skip tests if user unchecked the parameter, or run
          nightly jobs only at 2 AM.
        </P>
        <CodeBlock
          title="when_conditions.groovy"
          code={`pipeline {
    agent any
    stages {
        stage('Build') {
            steps { sh 'npm run build' }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'  // only run on main branch
            }
            steps {
                sh './deploy.sh staging'
            }
        }

        stage('Deploy to Production') {
            when {
                allOf {  // ALL conditions must be true
                    branch 'main'
                    expression { params.DEPLOY_TO_PROD == true }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Yes, deploy'
                sh './deploy.sh production'
            }
        }

        stage('Nightly Full Test Suite') {
            when {
                expression { env.BUILD_TIMESTAMP ==~ /.*02:00.*/ }  // regex match
                // or use triggeredBy 'TimerTrigger' if cron-triggered
            }
            steps {
                sh 'npm run test:e2e'  // slow E2E tests, only nightly
            }
        }

        stage('Tag Release') {
            when {
                tag pattern: 'v\\\\d+\\\\.\\\\d+\\\\.\\\\d+', comparator: 'REGEXP'
                // only if Git tag matches v1.2.3 format
            }
            steps {
                echo "Tagging release \${env.TAG_NAME}"
                sh 'docker tag myapp:latest myapp:\${TAG_NAME}'
            }
        }

        stage('Windows-specific') {
            when {
                expression { isUnix() == false }  // only on Windows agents
            }
            steps {
                bat 'build.bat'
            }
        }
    }
}`}
        />
        <Table
          head={["when Condition", "Example", "Use Case"]}
          rows={[
            ["branch", "branch 'main'", "deploy only from main branch"],
            ["expression", "expression { params.SKIP == false }", "user toggled a parameter"],
            ["environment", "environment name: 'DEPLOY', value: 'true'", "env var check"],
            ["tag", "tag 'v*'", "run on Git tags only (release builds)"],
            ["changelog", "changelog '.*\\\\[deploy\\\\].*'", "commit message contains [deploy]"],
            ["allOf", "allOf { branch 'main'; expression {...} }", "AND logic (all true)"],
            ["anyOf", "anyOf { branch 'main'; branch 'develop' }", "OR logic (any true)"],
            ["not", "not { branch 'main' }", "inverse (NOT main)"],
          ]}
        />
        <Callout type="tip">
          💡 The stage view shows skipped stages in gray with a message &quot;Skipped due to when
          condition&quot;. They don&apos;t count as failures — the pipeline can still succeed overall.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="scripted-vs-declarative" number="09" title="Scripted vs Declarative">
        <P>
          Jenkins has TWO pipeline syntaxes. You&apos;ve been learning <IC>declarative</IC> (the
          structured, opinionated syntax). The older <IC>scripted</IC> syntax is pure Groovy code. Most
          teams use declarative — but you&apos;ll see scripted in legacy Jenkinsfiles.
        </P>
        <Table
          head={["", "Declarative Pipeline", "Scripted Pipeline"]}
          rows={[
            ["Syntax", "structured DSL (pipeline { agent stages post })", "Groovy code (node { stage { ... } })"],
            ["Start keyword", "pipeline {", "node {"],
            ["Stages", "stages { stage('X') { steps {...} } }", "stage('X') { ... } (no container)"],
            ["Error handling", "post { failure {...} }", "try { } catch (e) { }"],
            ["Conditionals", "when { branch 'main' }", "if (env.BRANCH_NAME == 'main') { }"],
            ["Learning curve", "low (guided structure)", "high (need Groovy knowledge)"],
            ["Flexibility", "medium (can use script{} for Groovy)", "high (it IS Groovy)"],
            ["Recommended?", "YES (95% of use cases) ⭐", "only if you need extreme flexibility"],
          ]}
        />
        <CodeBlock
          title="same_pipeline_both_syntaxes.groovy"
          code={`// DECLARATIVE (recommended)
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
    }
    post {
        failure {
            echo 'Build failed!'
        }
    }
}

// SCRIPTED (legacy)
node {
    try {
        stage('Build') {
            sh 'npm run build'
        }
        stage('Test') {
            sh 'npm test'
        }
    } catch (e) {
        echo 'Build failed!'
        throw e
    }
}`}
        />
        <Callout type="note">
          📘 If you need advanced logic (loops, complex conditionals, calling external Groovy functions),
          you can mix them: use declarative pipeline, but inside a <IC>steps</IC> block add <IC>script
          {}</IC> for a chunk of Groovy. Best of both worlds.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="replay" number="10" title="Replay & Restart from Stage">
        <P>
          Two killer features for debugging pipelines: <IC>Replay</IC> (edit the Jenkinsfile inline
          without committing) and <IC>Restart from Stage</IC> (re-run only the failed stage, not the
          whole pipeline).
        </P>
        <CodeBlock
          title="replay_feature.txt"
          runnable={false}
          code={`REPLAY — edit Jenkinsfile in UI, test without committing

Scenario: build #42 failed in the Deploy stage. You suspect a typo
          in the sh command. You DON'T want to commit 5 times to test.

1. Build #42 page → left sidebar → [Replay] button
2. Jenkins shows the Jenkinsfile in a text editor (in the browser)
3. You edit line 47: change ./deploy.sh to ./deploy-staging.sh
4. Click [Run] → Jenkins runs build #43 with YOUR EDITED VERSION
   (the edit is NOT committed to Git — it's ephemeral)
5. Build #43 succeeds → you copy the fix to your local Jenkinsfile,
   commit, push. Future builds use the committed version. ✅

USE CASE: debugging Jenkinsfile syntax errors, testing Slack message
          formats, tweaking retry counts — NO Git pollution 🧪

⚠️ Replay edits are LOST after the build — they're for testing only,
   not permanent changes (commit the fix when it works)`}
        />
        <CodeBlock
          title="restart_from_stage.txt"
          runnable={false}
          code={`RESTART FROM STAGE — re-run failed stage without re-running green stages

Scenario: 6-stage pipeline (Checkout → Build → Test → Lint → Deploy → Smoke)
          Checkout (2 min) + Build (8 min) + Test (5 min) all passed ✅
          Lint stage FAILED (30 sec) ❌ — you forgot to install eslint

WITHOUT restart-from-stage:
  • fix the Jenkinsfile (add npm install eslint)
  • commit, push, trigger new build
  • Checkout (2 min) + Build (8 min) + Test (5 min) run AGAIN 😭
  • then Lint → finally green
  • WASTED 15 MINUTES re-running stages you KNOW work

WITH restart-from-stage:
  • fix the Jenkinsfile, commit, push
  • Build #42 page → stage view → click the RED "Lint" box
  • dropdown appears: [Restart from Stage]
  • Jenkins SKIPS Checkout/Build/Test (they're green, immutable)
  • re-runs Lint → Deploy → Smoke with the NEW code
  • 1 minute total 🚀

LIMITATIONS:
  • only works if you didn't change EARLIER stages
    (if you edit the Build stage, you MUST re-run from Build)
  • workspace must still exist (if wiped, need full re-run)
  • some plugins don't support it (complex matrix builds)

WHEN TO USE:
  ✅ late-stage failures (deploy, smoke tests, notifications)
  ✅ flaky tests (re-run the Test stage, keep the build artifacts)
  ❌ build failures (need to re-run from scratch)

Pro tip: design pipelines so expensive stages (build, compile) are
         EARLY, cheap stages (lint, scan, deploy) are LATE. Then
         restart-from-stage saves MASSIVE time on deploy tweaks. ⏱️`}
        />
        <Callout type="tip">
          💡 Replay is your debugging friend. Restart-from-stage is your time-saver. Together they make
          pipeline iteration 10x faster than committing blind changes and waiting 15 min per build.
        </Callout>
      </Section>

      {/* 11 */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Jenkinsfile", "pipeline definition in Git repo (version-controlled ✅)"],
            ["Declarative start", "pipeline { agent any stages { stage {...} } post {...} }"],
            ["agent any", "run on any available executor (or label/docker for specific agents)"],
            ["stages", "container for stage{} blocks (each = column in stage view UI)"],
            ["steps", "the actual commands (sh, echo, script{}, archiveArtifacts…)"],
            ["post always", "runs after all stages, every build (cleanup, logs)"],
            ["post success", "runs only if all stages green ✅ (notifications, deploy)"],
            ["post failure", "runs only if any stage red ❌ (alerts, JIRA ticket)"],
            ["environment", "define vars (APP_NAME='x') or credentials (credentials('id'))"],
            ["credentials()", "inject secrets as **** in logs (username+password, SSH key, token) 🔐"],
            ["parameters", "prompt user for input (string, choice, boolean) — Build with Parameters"],
            ["when { branch }", "conditional stage — only run on main branch (or tag, or env var)"],
            ["Replay", "edit Jenkinsfile in UI, test without committing (ephemeral, debug only)"],
            ["Restart from stage", "re-run failed stage, skip green stages (saves time ⏱️)"],
            ["Scripted vs Declarative", "declarative = structured DSL · scripted = Groovy code (use declarative)"],
            ["Stage view", "visual columns (Build → Test → Deploy) with ✅❌ per stage 📊"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
