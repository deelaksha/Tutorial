"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Push → Deployed Image — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "Developer", sub: "git push", x: 8, y: 40, color: "#60a5fa" },
    { id: "github", icon: "🐙", label: "GitHub", sub: "receives push", x: 25, y: 20, color: "#a78bfa" },
    { id: "webhook", icon: "📡", label: "Webhook", sub: "POST to Jenkins", x: 42, y: 15, color: "#fbbf24" },
    { id: "jenkins", icon: "🎩", label: "Jenkins", sub: "triggers build", x: 58, y: 40, color: "#fb923c" },
    { id: "docker-build", icon: "🐳", label: "Docker Build", sub: "image created", x: 75, y: 25, color: "#22d3ee" },
    { id: "registry", icon: "📦", label: "Registry", sub: "image pushed", x: 90, y: 50, color: "#34d399" },
  ],
  edges: [
    { id: "dev-github", from: "dev", to: "github", color: "#a78bfa" },
    { id: "github-webhook", from: "github", to: "webhook", color: "#fbbf24" },
    { id: "webhook-jenkins", from: "webhook", to: "jenkins", color: "#fb923c" },
    { id: "jenkins-docker", from: "jenkins", to: "docker-build", color: "#22d3ee" },
    { id: "docker-registry", from: "docker-build", to: "registry", color: "#34d399" },
    { id: "jenkins-github", from: "jenkins", to: "github", bend: 40, dashed: true, color: "#a78bfa" },
    { id: "poll-fallback", from: "jenkins", to: "github", bend: -50, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy-path",
      name: "✅ Push to main",
      command: "git push origin main → webhook → image: app:build-42",
      steps: [
        { node: "dev", paths: ["dev-github"], text: "Developer: git push origin main. GitHub receives the commit." },
        { node: "github", paths: ["github-webhook"], text: "GitHub sends webhook POST to https://jenkins.company.com/github-webhook/ within 1 second." },
        { node: "jenkins", paths: ["webhook-jenkins", "jenkins-docker"], text: "Jenkins receives webhook, triggers multibranch pipeline for 'main' branch, checks out code." },
        { node: "docker-build", paths: ["docker-registry"], text: "Pipeline: docker.build('app:build-42').push('latest') → image tagged + pushed to registry." },
        { node: "registry", paths: [], text: "Image app:build-42 and app:latest now in registry, ready for deployment. Total time: push to deployed in ~3 min. 🚀" },
      ],
    },
    {
      id: "pr-build",
      name: "🔀 PR opened",
      command: "pull request #123 → build + status check back to GitHub",
      steps: [
        { node: "github", paths: ["github-webhook"], text: "Developer opens PR #123. GitHub webhook fires with action: pull_request opened." },
        { node: "jenkins", paths: ["webhook-jenkins", "jenkins-docker"], text: "Multibranch pipeline auto-discovers PR-123 branch, starts build. PR shows 'pending' status check." },
        { node: "docker-build", paths: ["jenkins-github"], text: "Build completes (tests pass). Jenkins calls GitHub API: set commit status = success ✅." },
        { node: "github", paths: [], text: "PR page shows green checkmark. GitHub branch protection can now require Jenkins check before merge. 🔒" },
      ],
    },
    {
      id: "webhook-miss",
      name: "🔁 Webhook missed",
      command: "webhook lost → fallback poll catches commit after 2 min",
      steps: [
        { node: "dev", paths: ["dev-github"], text: "Developer pushes. GitHub tries webhook but Jenkins was restarting → webhook POST fails (502)." },
        { node: "jenkins", paths: ["poll-fallback"], text: "Fallback: Jenkins polls GitHub every 2 min (H/2 * * * * cron). Next poll detects new commit." },
        { node: "jenkins", paths: ["jenkins-docker"], text: "Build triggers (2 min late instead of instant). Docker build proceeds as normal." },
        { node: "registry", paths: ["docker-registry"], text: "Image pushed. Webhooks are fast; polling is the safety net when webhooks fail. 🛡️" },
      ],
    },
  ],
};

const NAV = [
  { id: "github-webhook", label: "GitHub Webhook End-to-End ⭐" },
  { id: "multibranch", label: "Multibranch Pipelines ⭐" },
  { id: "pr-checks", label: "PR Status Checks" },
  { id: "docker-push", label: "Building & Pushing Docker Images ⭐" },
  { id: "notifications", label: "Notifications — Slack & Email" },
  { id: "polling-vs-webhook", label: "Polling vs Webhooks" },
  { id: "other-integrations", label: "Other Integrations" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsIntegrationsPage() {
  return (
    <TopicShell
      icon="🎩"
      title="Jenkins: Git, Docker & Integrations"
      gradientWord="Integrations"
      subtitle="The GitHub webhook end-to-end (every hop drawn), multibranch pipelines that auto-discover PRs, building & pushing Docker images with credentials, and Slack/email notifications — Jenkins as the hub of your CI/CD ecosystem."
      nav={NAV}
      badges={["🐙 GitHub webhooks", "🐳 Docker push", "📬 Slack/email"]}
      next={{ icon: "🔐", label: "Credentials & Security", href: "/jenkins/credentials-security" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="github-webhook" number="01" title="GitHub Webhook End-to-End ⭐">
        <CodeBlock
          title="webhook_journey.txt"
          runnable={false}
          code={`the whole path: git push → deployed image

1️⃣  Developer machine
    $ git commit -m "fix bug"
    $ git push origin main
    ───────────────▼

2️⃣  GitHub.com
    • receives push
    • triggers webhook (repo Settings → Webhooks)
      Payload URL: https://jenkins.company.com/github-webhook/
      Content type: application/json
      Events: push, pull_request
    • sends POST:
      {
        "ref": "refs/heads/main",
        "commits": [{"id": "abc123", "message": "fix bug"}],
        "repository": {"clone_url": "https://github.com/co/repo"}
      }
    ───────────────▼

3️⃣  Jenkins (GitHub plugin receives POST at /github-webhook/)
    • parses payload
    • finds jobs with matching repo URL
    • triggers multibranch pipeline: scan repo
    ───────────────▼

4️⃣  Jenkins agent
    • checks out main branch (git clone + checkout abc123)
    • reads Jenkinsfile from repo root
    • executes stages: test → build → docker build → push
    ───────────────▼

5️⃣  Docker Registry (ECR / Docker Hub / Harbor)
    • receives docker push app:build-42
    • stores image layers
    ───────────────▼

6️⃣  Kubernetes / ECS / target environment
    • pulls new image
    • deploys (manual trigger or GitOps tool watches registry)

total time: push → deployed image available ≈ 2-5 minutes ⚡`}
        />
        <CodeBlock
          title="github_webhook_setup.sh"
          code={`# GitHub side (repo → Settings → Webhooks → Add webhook):
Payload URL: https://jenkins.company.com/github-webhook/
Content type: application/json
Secret: <leave blank or set a secret for HMAC validation>
Events: ✅ Just the push event
        ✅ Pull requests  (for PR builds)

# Jenkins side (install GitHub plugin):
# Manage Jenkins → Plugins → Available → "GitHub Integration"
# then: Manage Jenkins → System → GitHub
#   Add GitHub Server:
#     API URL: https://api.github.com
#     Credentials: <GitHub personal access token>
#       token scopes: repo, admin:repo_hook
#   ✅ Manage hooks

# Jenkinsfile (declarative, in repo root):
pipeline {
  agent any
  triggers {
    githubPush()  // ← enables webhook trigger
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install && npm run build'
      }
    }
  }
}`}
          output={`✅ Webhook configured
GitHub → webhook POST every push
Jenkins → auto-triggers on matching repo
(check Jenkins logs: /log/all for webhook events)`}
        />
        <Callout type="behind">
          🔍 The <IC>/github-webhook/</IC> endpoint is provided by the GitHub plugin. It&apos;s
          public (no auth by default) — GitHub&apos;s source IP ranges + optional HMAC secret
          provide security. Jenkins never polls GitHub in webhook mode — GitHub pushes TO Jenkins.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="multibranch" number="02" title="Multibranch Pipelines — Auto-Discovery ⭐">
        <CodeBlock
          title="multibranch_magic.txt"
          runnable={false}
          code={`problem: 10 developers, 10 feature branches — do you
create 10 Jenkins jobs manually? NO. 🚫

MULTIBRANCH PIPELINE = 1 Jenkins job that auto-discovers
ALL branches + pull requests with a Jenkinsfile

create: New Item → Multibranch Pipeline
  Branch Sources: GitHub
    Repository HTTPS URL: https://github.com/mycompany/myapp
    Credentials: <GitHub token>
  Build Configuration:
    Mode: by Jenkinsfile
    Script Path: Jenkinsfile  (default: root of repo)
  Scan Multibranch Pipeline Triggers:
    ✅ Periodically if not otherwise run: 2 minutes
    ✅ Scan by webhook (via GitHub hook)

what happens:
┌────────────────────────────────────────┐
│  GitHub repo: myapp                   │
│  ├── main              (Jenkinsfile)  │  ← Jenkins creates job "main"
│  ├── feature/login     (Jenkinsfile)  │  ← Jenkins creates job "feature/login"
│  ├── PR-42             (Jenkinsfile)  │  ← Jenkins creates job "PR-42"
│  └── hotfix/security   (Jenkinsfile)  │  ← Jenkins creates job "hotfix/security"
└────────────────────────────────────────┘
         every branch with a Jenkinsfile = auto job

branch merged or deleted? → Jenkins auto-deletes the job ✨`}
        />
        <CodeBlock
          title="multibranch_jenkinsfile.groovy"
          code={`// Jenkinsfile (same file in every branch, behavior varies)
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Deploy to Staging') {
      when {
        branch 'main'  // ← only runs on main branch
      }
      steps {
        sh 'kubectl apply -f k8s/staging/'
      }
    }
    stage('Deploy to Prod') {
      when {
        branch 'release/*'  // ← only release branches
      }
      steps {
        input message: 'Deploy to prod?'  // manual gate
        sh 'kubectl apply -f k8s/prod/'
      }
    }
  }
}`}
          output={`Branch: main
  ✅ Build → ✅ Deploy to Staging (auto)
Branch: feature/login
  ✅ Build → ⏭️ Deploy to Staging (skipped — not main)
Branch: release/v2.0
  ✅ Build → 🛑 Deploy to Prod (waiting for manual approval)`}
        />
        <Callout type="tip">
          💡 Multibranch pipelines eliminate &quot;Jenkins job sprawl.&quot; One multibranch job
          replaces 50+ manual jobs. Developers create a branch → Jenkins job appears automatically.
          Zero Jenkins UI clicks. 🎯
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="pr-checks" number="03" title="PR Status Checks — Build Gates">
        <CodeBlock
          title="pr_status_check_flow.txt"
          runnable={false}
          code={`the GitHub PR → Jenkins → GitHub status loop

1. Developer opens PR #123 (feature → main)
2. GitHub webhook → Jenkins
3. Jenkins multibranch discovers PR-123 branch, starts build
4. Jenkins sets commit status via GitHub API:
     state: pending
     context: "jenkins/pr-build"
     description: "Build started"
   → PR shows: ⏳ jenkins/pr-build — Build started

5. Build runs: tests, lint, docker build
6. Build finishes:
   ✅ success → Jenkins sets state: success
   ❌ failure → Jenkins sets state: failure

7. GitHub PR shows:
   ✅ All checks have passed (green checkmark)
   or
   ❌ Some checks failed (red X)

8. GitHub branch protection (repo Settings → Branches → main):
   ✅ Require status checks to pass before merging
      Status checks: jenkins/pr-build
   → PR cannot merge until Jenkins says success 🔒

the power: no human needs to check "did it build?"
GitHub blocks the merge button until Jenkins approves ⚡`}
        />
        <CodeBlock
          title="pr_status_jenkinsfile.groovy"
          code={`// Jenkins auto-sets GitHub commit status, but you can customize:
pipeline {
  agent any
  options {
    // set GitHub commit status with custom context
    githubProjectProperty(displayName: 'My App PR Build')
  }
  stages {
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
  }
  post {
    success {
      // optional: custom notification
      echo 'All tests passed — PR ready to merge ✅'
    }
    failure {
      // Jenkins already set commit status = failure
      echo 'Tests failed — PR blocked ❌'
    }
  }
}

// GitHub sees:
// Commit abc123
//   ✅ jenkins/pr-build — Build #47 passed
//   ⏳ jenkins/deploy — waiting...
// (you can have multiple status contexts per commit)`}
        />
        <Callout type="note">
          📌 GitHub treats each <IC>context</IC> name as a separate check. You can run multiple
          Jenkins jobs (lint, test, security scan) and require ALL to pass before merge — defense
          in depth.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="docker-push" number="04" title="Building & Pushing Docker Images ⭐">
        <CodeBlock
          title="docker_build_push.groovy"
          code={`pipeline {
  agent any
  environment {
    DOCKER_REGISTRY = 'my-registry.com'
    IMAGE_NAME = 'myapp'
    IMAGE_TAG = "\${env.BUILD_NUMBER}"  // ← escaped \${
  }
  stages {
    stage('Build Image') {
      steps {
        script {
          // docker.build returns an image object
          def img = docker.build("\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${IMAGE_TAG}")

          // equivalent to:
          // docker build -t my-registry.com/myapp:42 .
        }
      }
    }
    stage('Push Image') {
      steps {
        script {
          docker.withRegistry("https://\${DOCKER_REGISTRY}", 'docker-registry-creds') {
            // 'docker-registry-creds' = Jenkins credential ID
            def img = docker.image("\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${IMAGE_TAG}")
            img.push()           // pushes :42
            img.push('latest')   // also tag + push :latest
          }
        }
      }
    }
  }
}

// credentials setup (Manage Jenkins → Credentials):
// ID: docker-registry-creds
// Kind: Username with password
//   Username: myuser
//   Password: <registry token>
// (or use AWS ECR login, Harbor robot account, etc.)`}
          output={`[Build Image] docker build -t my-registry.com/myapp:42 .
Step 1/5 : FROM golang:1.22
Step 5/5 : CMD ["./app"]
Successfully built abc123
Successfully tagged my-registry.com/myapp:42

[Push Image] docker login my-registry.com (using credentials)
The push refers to repository [my-registry.com/myapp]
42: digest: sha256:abc123... size: 1234
latest: digest: sha256:abc123... size: 1234
✅ Images pushed: my-registry.com/myapp:42, myapp:latest`}
        />
        <CodeBlock
          title="aws_ecr_push.groovy"
          code={`// pushing to AWS ECR (Elastic Container Registry)
pipeline {
  agent any
  environment {
    AWS_REGION = 'us-west-2'
    ECR_REPO = '123456789012.dkr.ecr.us-west-2.amazonaws.com/myapp'
  }
  stages {
    stage('Build & Push to ECR') {
      steps {
        script {
          // get ECR login token (requires AWS CLI + IAM role or creds)
          sh '''
            aws ecr get-login-password --region \${AWS_REGION} | \\
              docker login --username AWS \\
                --password-stdin \${ECR_REPO}
          '''

          def img = docker.build("\${ECR_REPO}:\${BUILD_NUMBER}")
          img.push()
          img.push('latest')
        }
      }
    }
  }
}

// Jenkins agent needs:
//   1. AWS CLI installed
//   2. IAM role (if on EC2) with ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability, ecr:PutImage
//   or
//   3. AWS credentials in Jenkins (AWS Credentials Plugin)`}
        />
        <Callout type="mistake">
          ⚠️ Common error: <IC>docker.withRegistry</IC> requires the <IC>https://</IC> protocol in
          the URL. <IC>docker.withRegistry(&quot;my-registry.com&quot;, ...)</IC> fails —
          use <IC>&quot;https://my-registry.com&quot;</IC>.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="notifications" number="05" title="Notifications — Slack & Email">
        <CodeBlock
          title="slack_notification.groovy"
          code={`// install Slack Notification plugin
// Slack setup: create Jenkins app in Slack, get webhook URL

pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }
  post {
    success {
      slackSend(
        channel: '#ci-alerts',
        color: 'good',
        message: "✅ Build #\${env.BUILD_NUMBER} SUCCESS: \${env.JOB_NAME} (<\${env.BUILD_URL}|Open>)"
      )
    }
    failure {
      slackSend(
        channel: '#ci-alerts',
        color: 'danger',
        message: "❌ Build #\${env.BUILD_NUMBER} FAILED: \${env.JOB_NAME} (<\${env.BUILD_URL}|Open>)"
      )
    }
    unstable {
      slackSend(
        channel: '#ci-alerts',
        color: 'warning',
        message: "⚠️ Build #\${env.BUILD_NUMBER} UNSTABLE (tests flaky?)"
      )
    }
  }
}

// Slack integration setup:
// Manage Jenkins → System → Slack
//   Workspace: <your-workspace>
//   Credential: <Slack token>
//   Default channel: #ci-alerts
//   Test Connection → "Success" ✅`}
        />
        <CodeBlock
          title="email_notification.groovy"
          code={`pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        sh 'kubectl apply -f deploy.yaml'
      }
    }
  }
  post {
    failure {
      emailext(
        subject: "DEPLOY FAILED: \${env.JOB_NAME} #\${env.BUILD_NUMBER}",
        body: """
          Build failed: \${env.BUILD_URL}

          Last commit: \${env.GIT_COMMIT}
          Branch: \${env.GIT_BRANCH}

          Console output:
          \${BUILD_LOG, maxLines=50}
        """,
        to: 'devops-team@company.com',
        attachLog: true  // attach full console log
      )
    }
  }
}

// email setup (Manage Jenkins → System → E-mail Notification):
//   SMTP server: smtp.gmail.com
//   Use SMTP Authentication: ✅
//     User: noreply@company.com
//     Password: <app password>
//   Use SSL: ✅
//   SMTP Port: 465
//   Test configuration: send test email ✅`}
          output={`(Slack message in #ci-alerts)
Jenkins BOT  10:34 AM
✅ Build #42 SUCCESS: myapp/main (Open)

(Email to devops-team@company.com)
Subject: DEPLOY FAILED: myapp/main #43
Build failed: https://jenkins.company.com/job/myapp/43/
Last commit: abc123
Branch: main
[console log attached]`}
        />
        <Callout type="tip">
          💡 Notification fatigue is real. Use <IC>post &#123; changed &#123; ... &#125; &#125;</IC>{" "}
          to only notify when build status CHANGES (success → failure or vice versa), not on every
          build.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="polling-vs-webhook" number="06" title="Polling vs Webhooks — Speed & Reliability">
        <Table
          head={["Method", "How it works", "Speed", "GitHub load", "Use when…"]}
          rows={[
            [
              "Webhook",
              "GitHub POSTs to Jenkins on every push",
              "Instant (< 1s)",
              "Zero (GitHub pushes)",
              "Normal setup — fastest, recommended ⭐",
            ],
            [
              "Polling (SCM poll)",
              "Jenkins GETs GitHub every N minutes",
              "0–N min delay",
              "High (constant polling)",
              "Webhook blocked by firewall / Jenkins not public",
            ],
            [
              "Hybrid",
              "Webhook primary + poll H/15 * * * * as backup",
              "Instant or 15min",
              "Low",
              "Production safety — poll catches missed webhooks",
            ],
          ]}
        />
        <CodeBlock
          title="polling_setup.groovy"
          code={`// SCM polling (in Jenkinsfile or job config)
pipeline {
  agent any
  triggers {
    pollSCM('H/5 * * * *')  // poll every 5 min (H = hash for spread)
    // 'H' prevents all jobs polling at :00 — spreads load
  }
  stages {
    stage('Build') {
      steps {
        sh 'go build'
      }
    }
  }
}

// Jenkins checks: "is there a new commit since last build?"
//   YES → trigger build
//   NO  → skip (no build, just a GET request to GitHub)

// cron syntax:
// H/5 * * * *  = every 5 min (H-distributed)
// H/15 * * * * = every 15 min
// H 2 * * *    = once a day at ~2am (exact minute hashed per job)

// webhook + poll hybrid:
pipeline {
  triggers {
    githubPush()           // webhook (instant)
    pollSCM('H/15 * * * *') // safety poll every 15min
  }
  // result: webhook works 99% of the time (instant),
  // poll catches the 1% when webhook is missed (max 15min delay)`}
        />
        <Callout type="note">
          📌 Why <IC>H/5</IC> instead of <IC>*/5</IC>? <IC>H</IC> hashes the job name to spread
          polling times. If 100 jobs all poll <IC>*/5</IC>, they all hit GitHub at :00, :05, :10…
          — spike. <IC>H/5</IC> spreads them across the 5-minute window.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="other-integrations" number="07" title="Other Integrations — Plugin Ecosystem">
        <CodeBlock
          title="common_integrations.txt"
          runnable={false}
          code={`Jenkins has 1800+ plugins — popular integrations:

🧪 TEST & QUALITY
   • JUnit — parse test XML, show trends
   • Cobertura / JaCoCo — code coverage graphs
   • SonarQube — static analysis, code quality gates

☸️ DEPLOY
   • Kubernetes — kubectl, Helm, K8s credential management
   • AWS Steps — S3 upload, ECS deploy, CloudFormation
   • Terraform — plan + apply in pipeline

🔐 SECRETS
   • HashiCorp Vault — dynamic secrets
   • AWS Secrets Manager — pull secrets at runtime
   • Azure Key Vault

📊 OBSERVABILITY
   • Prometheus — scrape /prometheus metrics endpoint
   • Datadog — push build events, metrics
   • Grafana — visualize Jenkins metrics

🎟️ TICKETING
   • Jira — auto-comment on tickets, transition status
   • ServiceNow — create change requests

📦 ARTIFACT STORES
   • Artifactory / Nexus — publish Maven/npm packages
   • S3 — upload build artifacts

install: Manage Jenkins → Plugins → Available → search`}
        />
        <CodeBlock
          title="jira_integration.groovy"
          code={`// Jira Integration plugin — auto-comment on tickets
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }
  post {
    success {
      // extract Jira ticket from commit message or branch name
      script {
        def jiraIssue = env.BRANCH_NAME.tokenize('/')[0]  // "PROJ-123/feature" → "PROJ-123"
        jiraComment(
          issueKey: jiraIssue,
          body: "Build #\${env.BUILD_NUMBER} deployed to staging: \${env.BUILD_URL}"
        )
        // optionally transition ticket:
        // jiraTransitionIssue issueKey: jiraIssue, input: [transition: [id: '31']]  // 31 = "In Review"
      }
    }
  }
}

// Jira sees:
// PROJ-123 comments:
//   Jenkins BOT added a comment - 2 minutes ago
//   Build #42 deployed to staging: https://jenkins.../42/`}
        />
      </Section>

      {/* 08 */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Webhook endpoint", "https://jenkins.../github-webhook/ (GitHub plugin)"],
            ["Webhook speed", "< 1 second (GitHub POSTs to Jenkins on push)"],
            ["Multibranch pipeline", "1 job auto-discovers ALL branches + PRs with Jenkinsfile"],
            ["PR status check", "Jenkins sets GitHub commit status → blocks merge if failed"],
            ["Docker build", "docker.build('repo/image:tag') in Jenkinsfile"],
            ["Docker push", "docker.withRegistry('https://...', 'cred-id') { img.push() }"],
            ["ECR login", "aws ecr get-login-password | docker login --password-stdin"],
            ["Slack notification", "slackSend(channel: '#ci', color: 'good', message: '...')"],
            ["Polling syntax", "pollSCM('H/5 * * * *') — every 5 min, H-distributed"],
            ["Webhook + poll", "githubPush() + pollSCM('H/15 * * * *') — instant + safety net"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
