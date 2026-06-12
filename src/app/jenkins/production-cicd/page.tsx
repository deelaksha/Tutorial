"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The Production Pipeline — Live",
  nodes: [
    { id: "git", icon: "🐙", label: "Git Push", sub: "main branch", x: 7, y: 35, color: "#a78bfa" },
    { id: "ci-stages", icon: "🧪", label: "CI Stages", sub: "test + build", x: 25, y: 20, color: "#22d3ee" },
    { id: "registry", icon: "📦", label: "Registry", sub: "image:v1.2.3", x: 43, y: 35, color: "#34d399" },
    { id: "staging", icon: "🎭", label: "Staging", sub: "deploy + smoke", x: 60, y: 18, color: "#fbbf24" },
    { id: "approval-gate", icon: "✋", label: "Manual Gate", sub: "PM approves", x: 75, y: 40, color: "#fb923c" },
    { id: "prod", icon: "🏭", label: "Production", sub: "live deploy", x: 88, y: 20, color: "#f472b6" },
    { id: "rollback", icon: "⏮️", label: "Rollback", sub: "revert to v1.2.2", x: 88, y: 70, color: "#f87171" },
  ],
  edges: [
    { id: "git-ci", from: "git", to: "ci-stages", color: "#22d3ee" },
    { id: "ci-registry", from: "ci-stages", to: "registry", color: "#34d399" },
    { id: "registry-staging", from: "registry", to: "staging", color: "#fbbf24" },
    { id: "staging-gate", from: "staging", to: "approval-gate", color: "#fb923c" },
    { id: "gate-prod", from: "approval-gate", to: "prod", color: "#f472b6" },
    { id: "staging-fail", from: "staging", to: "git", bend: -60, dashed: true, color: "#f87171" },
    { id: "prod-rollback", from: "prod", to: "rollback", color: "#f87171" },
  ],
  flows: [
    {
      id: "happy-path",
      name: "✅ Full deploy",
      command: "git push → staging → approval → prod (18 min total)",
      steps: [
        { node: "git", paths: ["git-ci"], text: "Developer pushes to main. Webhook triggers multibranch pipeline." },
        { node: "ci-stages", paths: ["ci-registry"], text: "Parallel: unit tests (3min) + lint (2min) + integration (5min) → max 5min. Then: Go build + docker build (3min)." },
        { node: "registry", paths: ["registry-staging"], text: "Image myapp:v1.2.3 + myapp:latest pushed to registry. Tagged with git SHA + semver." },
        { node: "staging", paths: ["staging-gate"], text: "Deploy to staging k8s namespace. Smoke test: curl /health → 200 OK. Staging build passes (2min)." },
        { node: "approval-gate", paths: ["gate-prod"], text: "Pipeline pauses: input(message: 'Deploy to prod?'). PM clicks Proceed in Jenkins UI (5min wait)." },
        { node: "prod", paths: [], text: "Deploy to prod namespace: rolling update, 3 replicas → new image. Health checks pass. Total: 18 min push-to-prod. 🚀" },
      ],
    },
    {
      id: "staging-fail",
      name: "🔴 Smoke test fails",
      command: "staging smoke test 500 → never reaches approval gate",
      steps: [
        { node: "ci-stages", paths: ["ci-registry"], text: "CI stages pass: tests green, image built and pushed (v1.2.4)." },
        { node: "staging", paths: ["staging-fail"], text: "Deploy to staging. Smoke test: curl /health → 500 Internal Server Error. Stage fails." },
        { node: "git", paths: [], text: "Pipeline STOPS. Approval gate never reached — prod is safe, still on v1.2.3. Slack alert: staging broken. 🚨" },
      ],
    },
    {
      id: "prod-rollback",
      name: "⏮️ Prod deploy fails",
      command: "prod deployment error → automatic rollback to v1.2.2",
      steps: [
        { node: "staging", paths: ["staging-gate", "gate-prod"], text: "Staging passed, PM approved, deploy to prod starts (v1.2.3)." },
        { node: "prod", paths: ["prod-rollback"], text: "Kubectl apply fails: CrashLoopBackOff — new image has runtime bug. post { failure } block triggers." },
        { node: "rollback", paths: [], text: "Automatic rollback: kubectl set image deployment/myapp myapp=myapp:v1.2.2 (last known good). Prod recovers in 90s. Incident logged. 🔁" },
      ],
    },
  ],
};

const NAV = [
  { id: "shared-libraries", label: "Shared Libraries ⭐" },
  { id: "library-structure", label: "Library Structure — vars/ & src/" },
  { id: "capstone-pipeline", label: "The Capstone Pipeline ⭐" },
  { id: "stage-breakdown", label: "Stage-by-Stage Breakdown" },
  { id: "approval-gates", label: "Manual Approval Gates" },
  { id: "rollback", label: "Automatic Rollback" },
  { id: "best-practices", label: "Production Best Practices ⭐" },
  { id: "backup-jcasc", label: "Backup & Config-as-Code" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsProductionCICDPage() {
  return (
    <TopicShell
      icon="🎩"
      title="Jenkins: Production CI/CD — Capstone"
      gradientWord="Production"
      subtitle="Shared libraries (reusable pipeline code), the full production pipeline assembled stage by stage (checkout → test → build → docker → staging → approval → prod → rollback), and the best practices that make it bulletproof."
      nav={NAV}
      badges={["📚 Shared libs", "🏭 Full pipeline", "⏮️ Auto rollback"]}
      next={{ icon: "☸️", label: "Kubernetes course", href: "/kubernetes" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="shared-libraries" number="01" title="Shared Libraries — DRY Your Pipelines ⭐">
        <CodeBlock
          title="the_repetition_problem.txt"
          runnable={false}
          code={`you have 20 microservices, each with a Jenkinsfile:

service-a/Jenkinsfile:
  stage('Test') { sh 'go test ./...' }
  stage('Build') { sh 'go build -o app' }
  stage('Docker') { docker.build("service-a:\${BUILD_NUMBER}") }

service-b/Jenkinsfile:
  stage('Test') { sh 'go test ./...' }   ← SAME
  stage('Build') { sh 'go build -o app' } ← SAME
  stage('Docker') { docker.build("service-b:\${BUILD_NUMBER}") }

20 Jenkinsfiles × 15 lines of duplicated pipeline code = 300 lines
to update when you change the pattern 🚨

SHARED LIBRARY = reusable pipeline functions in a git repo

create a repo: jenkins-shared-library
  ├── vars/
  │   ├── buildGoApp.groovy      ← pipeline function
  │   └── deployToK8s.groovy
  └── src/
      └── com/company/Utils.groovy  ← helper classes

Jenkinsfile becomes:
@Library('my-shared-lib') _  // ← import the library
buildGoApp(imageName: 'service-a')  // ← call the function

1 line replaces 15. Change the pattern? Update the library,
all 20 services inherit the fix automatically ✨`}
        />
        <Callout type="analogy">
          🧩 Shared libraries are like npm packages for Jenkins — write the build logic once, import
          it everywhere. Your Jenkinsfiles become declarations, not scripts.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="library-structure" number="02" title="Library Structure — vars/ & src/">
        <CodeBlock
          title="shared_library_repo.txt"
          runnable={false}
          code={`jenkins-shared-library/  (git repo)
├── vars/
│   ├── buildGoApp.groovy         ← pipeline FUNCTIONS (the common ones)
│   ├── deployToK8s.groovy
│   └── notifySlack.groovy
├── src/
│   └── com/
│       └── company/
│           └── Utils.groovy      ← helper CLASSES (advanced)
└── resources/
    └── templates/
        └── Dockerfile.template   ← shared config files

vars/ = global functions callable from Jenkinsfile
  • filename = function name (buildGoApp.groovy → buildGoApp())
  • receives parameters as a Map
  • uses standard pipeline steps (sh, docker, etc.)

src/ = Groovy classes for complex logic
  • standard Java package structure
  • imported with @Library and import com.company.Utils

resources/ = static files (templates, scripts)
  • accessed with: libraryResource('templates/Dockerfile.template')`}
        />
        <CodeBlock
          title="vars/buildGoApp.groovy"
          code={`// jenkins-shared-library/vars/buildGoApp.groovy
def call(Map config) {
  // config = [imageName: 'myapp', registry: 'my-registry.com']
  pipeline {
    agent any
    environment {
      IMAGE_NAME = "\${config.registry}/\${config.imageName}"
      IMAGE_TAG = "\${env.BUILD_NUMBER}"
    }
    stages {
      stage('Test') {
        steps {
          sh 'go test -v ./...'
        }
      }
      stage('Build') {
        steps {
          sh 'go build -o app .'
        }
      }
      stage('Docker Build') {
        steps {
          script {
            docker.build("\${IMAGE_NAME}:\${IMAGE_TAG}")
          }
        }
      }
      stage('Docker Push') {
        steps {
          script {
            docker.withRegistry("https://\${config.registry}", 'docker-creds') {
              def img = docker.image("\${IMAGE_NAME}:\${IMAGE_TAG}")
              img.push()
              img.push('latest')
            }
          }
        }
      }
    }
    post {
      success {
        notifySlack(status: 'SUCCESS', color: 'good')
      }
      failure {
        notifySlack(status: 'FAILED', color: 'danger')
      }
    }
  }
}

// now ANY Jenkinsfile can use this:
// @Library('my-shared-lib') _
// buildGoApp(imageName: 'service-a', registry: 'my-registry.com')`}
        />
        <CodeBlock
          title="configure_shared_library.txt"
          runnable={false}
          code={`add library to Jenkins:
  Manage Jenkins → System → Global Pipeline Libraries
    Name: my-shared-lib
    Default version: main  (or tag: v1.2.3 for stability)
    Retrieval method: Modern SCM → Git
      Project Repository: https://github.com/mycompany/jenkins-shared-library
      Credentials: <github-token>
    ✅ Load implicitly (optional: auto-load for all pipelines)

use in Jenkinsfile:
@Library('my-shared-lib') _  // underscore = no specific import, just load
buildGoApp(imageName: 'my-app', registry: 'my-registry.com')

or version-pinned:
@Library('my-shared-lib@v1.2.3') _  // locked to tag v1.2.3
buildGoApp(...)

or load specific functions:
@Library('my-shared-lib') import com.company.Utils
def utils = new Utils()
utils.doSomething()`}
        />
      </Section>

      {/* 03 */}
      <Section id="capstone-pipeline" number="03" title="The Capstone Pipeline — Assembled ⭐">
        <P>
          This is the culmination: a production-grade pipeline for a Go microservice, from checkout
          to deployed in prod, with gates and rollback. Read it end-to-end.
        </P>
        <CodeBlock
          title="Jenkinsfile (production)"
          code={`@Library('my-shared-lib') _

pipeline {
  agent { label 'linux && docker' }

  environment {
    APP_NAME = 'payment-service'
    REGISTRY = '123456789012.dkr.ecr.us-west-2.amazonaws.com'
    IMAGE_NAME = "\${REGISTRY}/\${APP_NAME}"
    GIT_TAG = sh(script: 'git describe --tags --always', returnStdout: true).trim()
    IMAGE_TAG = "\${GIT_TAG}-\${BUILD_NUMBER}"  // e.g., v1.2.3-42
  }

  options {
    timeout(time: 30, unit: 'MINUTES')  // kill if > 30min
    timestamps()  // prefix logs with timestamps
    disableConcurrentBuilds()  // no parallel builds of same job
  }

  stages {
    // ────────────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm  // git clone (scm = source from multibranch config)
        sh 'git log -1 --oneline'  // show last commit
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Tests') {
      parallel {
        stage('Unit Tests') {
          steps {
            sh 'go test -v -coverprofile=coverage.out ./...'
            sh 'go tool cover -func=coverage.out'
          }
        }
        stage('Lint') {
          steps {
            sh 'golangci-lint run --timeout 5m'
          }
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Build Binary') {
      steps {
        sh '''
          CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \\
            go build -ldflags="-s -w" -o \${APP_NAME} .
        '''
        sh 'ls -lh \${APP_NAME}'  // verify binary exists
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Docker Build & Push') {
      steps {
        script {
          // ECR login
          sh '''
            aws ecr get-login-password --region us-west-2 | \\
              docker login --username AWS --password-stdin \${REGISTRY}
          '''

          // build + push
          def img = docker.build("\${IMAGE_NAME}:\${IMAGE_TAG}")
          img.push()
          img.push('latest')  // also update :latest
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Deploy to Staging') {
      steps {
        script {
          sh """
            kubectl set image deployment/\${APP_NAME} \\
              \${APP_NAME}=\${IMAGE_NAME}:\${IMAGE_TAG} \\
              --namespace=staging
            kubectl rollout status deployment/\${APP_NAME} -n staging --timeout=3m
          """
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Smoke Test Staging') {
      steps {
        script {
          retry(3) {  // retry up to 3 times
            sleep(time: 5, unit: 'SECONDS')  // wait for pods to be ready
            sh '''
              STAGING_URL=https://payment-staging.company.com
              curl -f -s \${STAGING_URL}/health | grep -q '"status":"ok"'
            '''
          }
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Manual Approval Gate') {
      when {
        branch 'main'  // only on main branch (not PRs)
      }
      steps {
        script {
          timeout(time: 15, unit: 'MINUTES') {  // auto-abort if no response in 15min
            input(
              message: "Deploy \${IMAGE_TAG} to PRODUCTION?",
              ok: 'Deploy',
              submitter: 'prod-deploy-team',  // only these users can approve
              parameters: [
                string(name: 'APPROVER', description: 'Your name', defaultValue: '')
              ]
            )
          }
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Deploy to Production') {
      when {
        branch 'main'
      }
      steps {
        script {
          // record the PREVIOUS image tag for rollback
          env.PREVIOUS_IMAGE = sh(
            script: """
              kubectl get deployment/\${APP_NAME} -n production \\
                -o jsonpath='{.spec.template.spec.containers[0].image}'
            """,
            returnStdout: true
          ).trim()

          echo "Previous prod image: \${PREVIOUS_IMAGE}"
          echo "Deploying new image: \${IMAGE_NAME}:\${IMAGE_TAG}"

          sh """
            kubectl set image deployment/\${APP_NAME} \\
              \${APP_NAME}=\${IMAGE_NAME}:\${IMAGE_TAG} \\
              --namespace=production --record
            kubectl rollout status deployment/\${APP_NAME} -n production --timeout=5m
          """
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    stage('Verify Production') {
      when {
        branch 'main'
      }
      steps {
        script {
          retry(3) {
            sleep(time: 10, unit: 'SECONDS')
            sh '''
              PROD_URL=https://payment.company.com
              curl -f -s \${PROD_URL}/health | grep -q '"status":"ok"'
            '''
          }
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────
  post {
    success {
      echo "✅ Pipeline SUCCESS: \${IMAGE_TAG} deployed to production"
      notifySlack(
        channel: '#deployments',
        color: 'good',
        message: "✅ \${APP_NAME} \${IMAGE_TAG} deployed to prod by \${env.BUILD_USER}"
      )
    }

    failure {
      echo "❌ Pipeline FAILED — initiating rollback if prod was affected"
      script {
        if (env.PREVIOUS_IMAGE && env.STAGE_NAME == 'Deploy to Production') {
          // rollback to previous image
          sh """
            kubectl set image deployment/\${APP_NAME} \\
              \${APP_NAME}=\${PREVIOUS_IMAGE} \\
              --namespace=production
            kubectl rollout status deployment/\${APP_NAME} -n production --timeout=3m
          """
          echo "⏮️ Rolled back production to: \${PREVIOUS_IMAGE}"
        }
      }
      notifySlack(
        channel: '#alerts',
        color: 'danger',
        message: "🚨 \${APP_NAME} pipeline FAILED at stage: \${env.STAGE_NAME}"
      )
    }

    unstable {
      notifySlack(
        channel: '#alerts',
        color: 'warning',
        message: "⚠️ \${APP_NAME} build UNSTABLE (flaky tests?)"
      )
    }

    always {
      // archive test results
      junit '**/test-results/*.xml'  // if you generate JUnit XML
      // clean workspace to save disk
      cleanWs()
    }
  }
}`}
          output={`[Checkout] ✅ commit abc123: fix payment timeout
[Unit Tests] ✅ 127 tests passed (coverage: 84.3%)
[Lint] ✅ No issues found
[Build Binary] ✅ payment-service (8.2 MB)
[Docker Build & Push] ✅ image pushed: v1.2.3-42, latest
[Deploy to Staging] ✅ rollout complete (3/3 pods ready)
[Smoke Test Staging] ✅ /health → {"status":"ok"}
[Manual Approval Gate] ⏸️ waiting for approval...
  (PM clicks "Deploy" in Jenkins UI)
[Deploy to Production] ✅ rollout complete (5/5 pods ready)
[Verify Production] ✅ /health → {"status":"ok"}
✅ Pipeline SUCCESS: v1.2.3-42 deployed to production (18m 32s)`}
        />
        <Callout type="tip">
          💡 This pipeline is the <em>template</em> — copy it, adjust for your language/framework
          (Node/Python/Java), and you have a production CI/CD pipeline in 10 minutes. The patterns
          are universal.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="stage-breakdown" number="04" title="Stage-by-Stage Breakdown">
        <Table
          head={["Stage", "What it does", "Why it matters", "Typical duration"]}
          rows={[
            [
              "Checkout",
              "git clone + checkout commit",
              "Gets the code — scm auto-configured in multibranch",
              "10–20s",
            ],
            [
              "Tests (parallel)",
              "Unit + lint in parallel",
              "Fail fast if code is broken — before wasting time on build",
              "2–5min",
            ],
            [
              "Build Binary",
              "Compile Go (or npm build, etc.)",
              "Produces the artifact — if this fails, no point in Docker step",
              "1–3min",
            ],
            [
              "Docker Build & Push",
              "docker build + push to registry",
              "Creates deployable image — tagged with version + build number",
              "2–4min",
            ],
            [
              "Deploy to Staging",
              "kubectl set image in staging namespace",
              "Real environment test — catch integration issues before prod",
              "1–2min",
            ],
            [
              "Smoke Test Staging",
              "curl /health, check response",
              "Automated gate — if staging is broken, stop here",
              "10–30s",
            ],
            [
              "Manual Approval",
              "input() pauses pipeline, waits for human",
              "Final safety — human reviews staging, approves prod deploy",
              "0–15min",
            ],
            [
              "Deploy to Production",
              "kubectl set image in prod namespace",
              "The actual release — rolling update, zero downtime",
              "2–5min",
            ],
            [
              "Verify Production",
              "curl /health on prod URL",
              "Sanity check — prod is alive after deploy",
              "10–30s",
            ],
          ]}
        />
        <Callout type="note">
          📌 Total happy-path time: ~10–18 minutes (excluding approval wait). Parallel tests save
          ~3 minutes vs serial. Every stage has a <IC>timeout</IC> — no infinite hangs.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="approval-gates" number="05" title="Manual Approval Gates — The Human Step">
        <CodeBlock
          title="input_gate_patterns.groovy"
          code={`// PATTERN 1: simple yes/no gate
stage('Approve') {
  steps {
    input(message: 'Deploy to prod?', ok: 'Proceed')
  }
}
// Jenkins pauses, shows "Proceed" or "Abort" buttons in UI
// any authenticated user can click

// PATTERN 2: restrict approvers
stage('Approve') {
  steps {
    input(
      message: 'Deploy to prod?',
      ok: 'Deploy',
      submitter: 'alice,bob,prod-deploy-team'  // comma-separated users/groups
    )
  }
}
// only alice, bob, or members of prod-deploy-team can approve

// PATTERN 3: collect parameters from approver
stage('Approve') {
  steps {
    script {
      def userInput = input(
        message: 'Deploy to prod?',
        parameters: [
          string(name: 'APPROVER_NAME', description: 'Your name'),
          choice(name: 'ENVIRONMENT', choices: ['prod-us', 'prod-eu'], description: 'Which prod?')
        ]
      )
      echo "Approved by: \${userInput.APPROVER_NAME} for \${userInput.ENVIRONMENT}"
    }
  }
}

// PATTERN 4: timeout — auto-abort if no response
stage('Approve') {
  steps {
    timeout(time: 10, unit: 'MINUTES') {
      input(message: 'Deploy to prod?')
    }
  }
}
// if no one clicks in 10 min → build aborts (don't block queue forever)`}
          output={`(Jenkins UI shows during input):
┌──────────────────────────────────────────────────┐
│ Deploy v1.2.3-42 to PRODUCTION?                 │
│                                                  │
│ [Deploy]  [Abort]                               │
│                                                  │
│ Paused for input from: prod-deploy-team         │
│ Waiting since: 2:34 PM (5 minutes ago)          │
└──────────────────────────────────────────────────┘

(PM clicks "Deploy" → pipeline continues to prod stage)`}
        />
        <Callout type="behind">
          🔍 Under the hood: <IC>input()</IC> holds the executor (the agent is still locked).
          Alternative: use <IC>milestone</IC> + external approval systems (Slack button → Jenkins
          API) to free the executor during long waits.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="rollback" number="06" title="Automatic Rollback — When Prod Deploy Fails">
        <CodeBlock
          title="rollback_pattern.groovy"
          code={`// before deploying to prod, SAVE the current image:
stage('Deploy to Production') {
  steps {
    script {
      // query current image from k8s
      env.PREVIOUS_IMAGE = sh(
        script: """
          kubectl get deployment/myapp -n production \\
            -o jsonpath='{.spec.template.spec.containers[0].image}'
        """,
        returnStdout: true
      ).trim()

      echo "Saving rollback point: \${PREVIOUS_IMAGE}"

      // now deploy new image
      sh """
        kubectl set image deployment/myapp \\
          myapp=myapp:\${IMAGE_TAG} -n production
        kubectl rollout status deployment/myapp -n production --timeout=5m
      """
    }
  }
}

// in post { failure } block — rollback if ANY stage after deploy fails:
post {
  failure {
    script {
      if (env.PREVIOUS_IMAGE && env.STAGE_NAME =~ /Production|Verify/) {
        echo "🚨 Production deploy failed — rolling back"
        sh """
          kubectl set image deployment/myapp \\
            myapp=\${PREVIOUS_IMAGE} -n production
          kubectl rollout status deployment/myapp -n production --timeout=3m
        """
        echo "⏮️ Rollback complete: \${PREVIOUS_IMAGE}"

        // notify oncall
        notifySlack(
          channel: '#incidents',
          color: 'danger',
          message: "@oncall Production deploy FAILED — auto-rolled back to \${PREVIOUS_IMAGE}"
        )
      }
    }
  }
}

// the logic: if prod deploy OR verify stage fails → revert`}
        />
        <CodeBlock
          title="rollback_scenario.txt"
          runnable={false}
          code={`scenario: new image has a bug

14:30  Deploy to Production starts
       previous image: myapp:v1.2.2-41 (saved)
       new image: myapp:v1.2.3-42

14:31  kubectl set image → rolling update begins
       pod 1/5 → new image
       pod 1/5 → CrashLoopBackOff (app crashes on start)

14:32  kubectl rollout status times out (pods not ready)
       stage FAILS

14:32  post { failure } block executes
       checks: env.STAGE_NAME == "Deploy to Production"? YES
       rollback: kubectl set image → myapp:v1.2.2-41

14:33  rolling update BACK to v1.2.2-41
       pods: 5/5 ready (old image stable)

14:34  Slack: "@oncall Production deploy FAILED — auto-rolled back"
       Prod is SAFE — users saw no downtime (partial rollout)

total incident duration: 4 minutes (not 2 hours) 🛡️

the power: rollback is AUTOMATIC, not manual — no oncall
scramble, no "oh god what was the last good tag?"`}
        />
        <Callout type="tip">
          💡 Rollback works because Kubernetes keeps the previous ReplicaSet. For non-k8s deploys,
          save the previous binary/image tag to a file or Jenkins env var, then redeploy it on
          failure.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="best-practices" number="07" title="Production Best Practices — The Checklist ⭐">
        <Table
          head={["Practice", "Implementation", "Why it matters"]}
          rows={[
            [
              "Small stages",
              "10–15 stages, each 1–3 steps",
              "Easier to debug, logs show WHICH stage failed, rerun single stage",
            ],
            [
              "Timeouts everywhere",
              "options { timeout(time: 30, unit: 'MINUTES') } + per-stage timeouts",
              "Prevent infinite hangs (network issues, stuck kubectl, zombie processes)",
            ],
            [
              "Retry flaky steps",
              "retry(3) { sh 'curl ...' }",
              "Transient network failures don't fail the build — resilience",
            ],
            [
              "Stash/unstash",
              "stash(name: 'binary', includes: 'app') → unstash('binary')",
              "Share artifacts between stages/agents without rebuilding (e.g., build on one agent, deploy from another)",
            ],
            [
              "Parallel where possible",
              "parallel { stage('Unit')... stage('Lint')... }",
              "Cut total pipeline time by 30–50% — faster feedback",
            ],
            [
              "Fail fast",
              "Tests BEFORE build, smoke test BEFORE approval",
              "Don't waste 10 min building if tests fail in 2 min",
            ],
            [
              "Immutable tags",
              "image:v1.2.3-42 (version + build number), NOT just :latest",
              "Rollback needs precise tags; :latest is ambiguous (what WAS latest yesterday?)",
            ],
            [
              "Audit trail",
              "echo who/what/when, archive logs, Slack notifications",
              "\"Who deployed v1.2.3 to prod?\" → check Slack or Jenkins build #42",
            ],
          ]}
        />
        <CodeBlock
          title="stash_unstash_example.groovy"
          code={`// use case: build binary on Linux, deploy from Mac agent
pipeline {
  agent none
  stages {
    stage('Build') {
      agent { label 'linux' }
      steps {
        sh 'go build -o myapp .'
        stash(name: 'binary', includes: 'myapp')  // save artifact
      }
    }
    stage('Deploy') {
      agent { label 'mac' }  // different agent!
      steps {
        unstash('binary')  // retrieve artifact from Build stage
        sh 'scp myapp deploy@mac-server:/opt/app/'
      }
    }
  }
}

// stash is internal to Jenkins (stored in controller) — use for
// small artifacts (<100MB). For large artifacts, use S3/Artifactory.`}
        />
      </Section>

      {/* 08 */}
      <Section id="backup-jcasc" number="08" title="Backup & Configuration-as-Code">
        <CodeBlock
          title="backup_jenkins_home.sh"
          code={`#!/bin/bash
# daily backup of JENKINS_HOME (run as cron job on controller)

BACKUP_DIR=/backups/jenkins
JENKINS_HOME=/var/jenkins_home
DATE=\$(date +%Y%m%d)

# stop Jenkins (optional — or use Thin Backup plugin for hot backups)
# systemctl stop jenkins

# tar critical directories
tar -czf "\${BACKUP_DIR}/jenkins-\${DATE}.tar.gz" \\
  --exclude="\${JENKINS_HOME}/workspace/*" \\
  --exclude="\${JENKINS_HOME}/builds/*/archive" \\
  "\${JENKINS_HOME}/jobs" \\
  "\${JENKINS_HOME}/credentials.xml" \\
  "\${JENKINS_HOME}/secrets" \\
  "\${JENKINS_HOME}/config.xml" \\
  "\${JENKINS_HOME}/plugins"

# upload to S3
aws s3 cp "\${BACKUP_DIR}/jenkins-\${DATE}.tar.gz" \\
  s3://company-backups/jenkins/

# keep last 30 days locally
find "\${BACKUP_DIR}" -name "jenkins-*.tar.gz" -mtime +30 -delete

# restart Jenkins
# systemctl start jenkins

echo "✅ Backup complete: jenkins-\${DATE}.tar.gz"

# restore: extract tar, restart Jenkins, done`}
          output={`✅ Backup complete: jenkins-20261203.tar.gz (2.3 GB)
Uploaded to s3://company-backups/jenkins/jenkins-20261203.tar.gz`}
        />
        <CodeBlock
          title="jcasc_intro.txt"
          runnable={false}
          code={`CONFIGURATION AS CODE (JCasC) = Jenkins config in YAML, not UI

problem: you configure Jenkins via web UI → click 200 buttons
         → settings are in XML files, not version-controlled
         → new Jenkins? repeat 200 clicks 😫

solution: jenkins.yaml defines EVERYTHING

install: Configuration as Code plugin

jenkins.yaml:
jenkins:
  systemMessage: "Production Jenkins — managed by JCasC"
  numExecutors: 0  # no builds on controller
  securityRealm:
    ldap:
      server: ldap.company.com
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Administer:admin-team"
        - "Overall/Read:authenticated"

credentials:
  system:
    domainCredentials:
      - credentials:
        - usernamePassword:
            scope: GLOBAL
            id: docker-creds
            username: deploy-bot
            password: \${DOCKER_PASSWORD}  # from env var, not hardcoded

unclassified:
  location:
    url: https://jenkins.company.com
  slackNotifier:
    teamDomain: mycompany
    tokenCredentialId: slack-token

load config:
  Manage Jenkins → Configuration as Code → Apply new configuration
  (or set CASC_JENKINS_CONFIG=/etc/jenkins/jenkins.yaml env var on start)

now: Jenkins config is in git, reproducible, auditable ✅
new Jenkins? docker run + mount jenkins.yaml → instant config`}
        />
        <Callout type="note">
          📌 JCasC + Docker + shared libraries = the holy trinity of Jenkins reproducibility. Your
          entire CI/CD setup becomes: <IC>git clone</IC> + <IC>docker-compose up</IC> → production
          Jenkins in 5 minutes.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Shared library", "vars/ = functions, src/ = classes, resources/ = templates"],
            ["Library usage", "@Library('name') _ then call function: buildGoApp(...)"],
            ["Capstone stages", "test → build → docker → staging → gate → prod → verify"],
            ["Parallel tests", "parallel { stage('Unit')... stage('Lint')... } — cut time 30–50%"],
            ["Approval gate", "input(message: '...', submitter: 'team') — human gate"],
            ["Timeout on input", "timeout(time: 10, unit: 'MINUTES') { input(...) }"],
            ["Rollback", "save PREVIOUS_IMAGE, post{failure} → kubectl set image to old tag"],
            ["Stash/unstash", "stash(name: 'bin', includes: 'app') → share artifact between agents"],
            ["Retry", "retry(3) { sh 'curl ...' } — resilience for flaky steps"],
            ["Fail fast", "tests BEFORE build, smoke BEFORE approval — don't waste time"],
            ["Immutable tags", "image:v1.2.3-42 (version + build) — precise rollback"],
            ["JCasC", "jenkins.yaml = config-as-code, reproducible Jenkins setup"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
