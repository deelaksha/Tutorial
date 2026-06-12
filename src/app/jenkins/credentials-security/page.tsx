"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Secret&apos;s Journey — Live",
  nodes: [
    { id: "jenkinsfile", icon: "📄", label: "Jenkinsfile", sub: "credentials('id')", x: 10, y: 40, color: "#a78bfa" },
    { id: "cred-store", icon: "🔐", label: "Cred Store", sub: "encrypted vault", x: 30, y: 20, color: "#fbbf24" },
    { id: "pipeline-env", icon: "🔧", label: "Pipeline Env", sub: "PASSWORD=***", x: 50, y: 40, color: "#22d3ee" },
    { id: "shell-step", icon: "⚙️", label: "Shell Step", sub: "uses $PASSWORD", x: 70, y: 25, color: "#34d399" },
    { id: "console-log", icon: "📋", label: "Console Log", sub: "shows ****", x: 88, y: 50, color: "#f472b6" },
  ],
  edges: [
    { id: "jf-store", from: "jenkinsfile", to: "cred-store", color: "#fbbf24" },
    { id: "store-env", from: "cred-store", to: "pipeline-env", color: "#22d3ee" },
    { id: "env-shell", from: "pipeline-env", to: "shell-step", color: "#34d399" },
    { id: "shell-log", from: "shell-step", to: "console-log", color: "#f472b6" },
    { id: "leak-path", from: "jenkinsfile", to: "console-log", bend: -60, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "safe-path",
      name: "✅ Masked correctly",
      command: "credentials() → env var → Jenkins masks in logs",
      steps: [
        { node: "jenkinsfile", paths: ["jf-store"], text: "Jenkinsfile: environment { PASSWORD = credentials('db-password') }. Never hardcoded." },
        { node: "cred-store", paths: ["store-env"], text: "Jenkins decrypts 'db-password' from credential store (encrypted at rest with master.key)." },
        { node: "pipeline-env", paths: ["env-shell"], text: "Injects PASSWORD=secretvalue into pipeline environment. Marks it as sensitive." },
        { node: "shell-step", paths: ["shell-log"], text: "Shell: curl -u admin:$PASSWORD ... — Jenkins intercepts and masks the value in output." },
        { node: "console-log", paths: [], text: "Console log shows: curl -u admin:**** — secret never visible. Automatic masking. 🛡️" },
      ],
    },
    {
      id: "naive-leak",
      name: "🚨 Naive echo leaks",
      command: "echo $PASSWORD → visible in logs (caught by audit)",
      steps: [
        { node: "jenkinsfile", paths: ["leak-path"], text: "Developer writes: sh 'echo Debug: PASSWORD=$PASSWORD'. Innocent debugging... but a leak." },
        { node: "console-log", paths: [], text: "Console log shows: Debug: PASSWORD=secretvalue — the mask FAILED because echo bypasses interception. 🚨" },
        { node: "console-log", paths: [], text: "Security scan (regex: PASSWORD=) flags it. PR rejected. Leak caught before production. Defense in depth." },
      ],
    },
    {
      id: "rbac-block",
      name: "🔒 Folder RBAC",
      command: "dev can build, cannot read prod credentials",
      steps: [
        { node: "cred-store", paths: [], text: "Credentials scoped: 'prod-db-password' lives in /prod folder, not global. RBAC: prod-deploy role only." },
        { node: "jenkinsfile", paths: [], text: "Dev tries: credentials('prod-db-password') in /dev folder → Jenkins denies access (403)." },
        { node: "console-log", paths: [], text: "Build fails: 'Credentials prod-db-password not found'. Dev cannot see or use prod secrets. Folder isolation works. 🔐" },
      ],
    },
  ],
};

const NAV = [
  { id: "never-hardcode", label: "Never Hardcode Secrets ⭐" },
  { id: "credential-kinds", label: "Credential Types" },
  { id: "using-credentials", label: "Using Credentials in Pipelines ⭐" },
  { id: "log-masking", label: "Automatic Log Masking ⭐" },
  { id: "rbac", label: "RBAC — Folder Permissions" },
  { id: "common-mistakes", label: "Common Mistakes" },
  { id: "agent-security", label: "Agent-to-Controller Security" },
  { id: "audit", label: "Audit & Compliance" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsCredentialsSecurityPage() {
  return (
    <TopicShell
      icon="🎩"
      title="Jenkins: Credentials & Security"
      gradientWord="Security"
      subtitle="Why secrets never go in Jenkinsfiles (leak path drawn), the credential store, automatic ★★★ masking, RBAC with folder-scoped permissions, and the audit trail — building pipelines that pass security review."
      nav={NAV}
      badges={["🔐 Credential store", "🛡️ Auto-masking", "👮 RBAC"]}
      next={{ icon: "🏭", label: "Production CI/CD", href: "/jenkins/production-cicd" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="never-hardcode" number="01" title="Never Hardcode Secrets — The Leak Path ⭐">
        <CodeBlock
          title="the_leak.txt"
          runnable={false}
          code={`❌ WRONG — hardcoded in Jenkinsfile:
pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        sh 'kubectl create secret generic db --from-literal=password=hunter2'
           ─────────────────────────────────────────────────────────────────┬─
                                                                            │
                                     this is now in git history FOREVER 🚨  │
      }                                                                     │
    }                                                                       │
  }                                                                         │
}                                                                           │
  │                                                                         │
  ▼                                                                         │
commit 123abc "add deploy step"                                            │
  │                                                                         │
  ▼                                                                         │
pushed to GitHub public repo ─────────────────────────────────────────────┘
  │
  ▼
scraped by secret-scanning bots within minutes
  │
  ▼
credential compromised, database owned, $2M breach 💀

THE RULE: secrets live in Jenkins credential store,
          referenced by ID in Jenkinsfile, NEVER the value

✅ CORRECT:
environment {
  DB_PASSWORD = credentials('prod-db-password')  // ← ID, not value
}
sh 'kubectl create secret generic db --from-literal=password=\${DB_PASSWORD}'

now Jenkinsfile is safe to commit — the secret is in Jenkins,
not git. Rotate the secret? Update Jenkins cred store, no code change.`}
        />
        <Callout type="analogy">
          🏦 A Jenkinsfile is a blueprint; credentials are the vault key. You don&apos;t write the
          key ON the blueprint — you write &quot;use key #42 from the vault.&quot; The vault
          (Jenkins) controls who can open it.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="credential-kinds" number="02" title="Credential Types — The Store">
        <P>
          Jenkins credential store (Manage Jenkins → Credentials) supports multiple types,
          encrypted at rest with <IC>master.key</IC> (in JENKINS_HOME/secrets/).
        </P>
        <Table
          head={["Kind", "Use case", "What Jenkins stores", "How pipeline uses it"]}
          rows={[
            [
              "Username + Password",
              "DB login, Docker registry, Artifactory",
              "user + password (encrypted)",
              "credentials('id') → env.USER, env.PASS",
            ],
            [
              "Secret text",
              "API token, webhook secret, single value",
              "text string (encrypted)",
              "credentials('id') → single env var",
            ],
            [
              "SSH Username + Private Key",
              "Git SSH, VM login",
              "username + private key PEM",
              "sshagent(['key-id']) { sh 'git clone' }",
            ],
            [
              "Secret file",
              "kubeconfig, GCP service account JSON, .env file",
              "file content (encrypted)",
              "withCredentials([file(...)]) { sh 'use $FILE' }",
            ],
            [
              "Certificate",
              "TLS client cert, code signing",
              "keystore + password",
              "rarely direct — plugins use it (e.g., Docker TLS)",
            ],
          ]}
        />
        <CodeBlock
          title="adding_credentials.txt"
          runnable={false}
          code={`add credential (web UI):
  Manage Jenkins → Credentials → (global) → Add Credentials
    Kind: Username with password
    Scope: Global (any job) or System (Jenkins + nodes only)
    Username: deploy-bot
    Password: ●●●●●●●●
    ID: docker-registry-creds  ← this is what Jenkinsfile uses
    Description: Docker Hub deploy bot

scope matters:
  • Global: any job can use
  • System: only Jenkins internals (node connections, plugins)
  (folder-scoped credentials come later — §05)

credentials are encrypted at rest:
  $JENKINS_HOME/credentials.xml  ← encrypted blobs
  $JENKINS_HOME/secrets/master.key ← the encryption key
  BACK UP BOTH or lose access to credentials on restore 🚨`}
        />
      </Section>

      {/* 03 */}
      <Section id="using-credentials" number="03" title="Using Credentials in Pipelines ⭐">
        <CodeBlock
          title="credentials_binding.groovy"
          code={`// METHOD 1: environment{} block (declarative, simple)
pipeline {
  agent any
  environment {
    // username+password credential → 2 env vars
    DOCKER_CREDS = credentials('docker-registry-creds')
    // creates: DOCKER_CREDS_USR, DOCKER_CREDS_PSW
  }
  stages {
    stage('Push') {
      steps {
        sh '''
          echo "\${DOCKER_CREDS_PSW}" | docker login -u "\${DOCKER_CREDS_USR}" --password-stdin
          docker push myapp:latest
        '''
      }
    }
  }
}

// METHOD 2: withCredentials{} block (scripted, flexible)
pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'db-creds',
            usernameVariable: 'DB_USER',
            passwordVariable: 'DB_PASS'
          )
        ]) {
          sh '''
            mysql -u "\${DB_USER}" -p"\${DB_PASS}" < schema.sql
          '''
        }
      }
    }
  }
}

// secret text (single value):
withCredentials([string(credentialsId: 'api-token', variable: 'API_TOKEN')]) {
  sh 'curl -H "Authorization: Bearer \${API_TOKEN}" ...'
}

// secret file (kubeconfig):
withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
  sh 'kubectl --kubeconfig=\${KUBECONFIG} apply -f deploy.yaml'
}

// SSH key:
sshagent(['ssh-deploy-key']) {
  sh '''
    git clone git@github.com:private/repo.git
    scp app.tar.gz deploy@prod-server:/opt/app/
  '''
}`}
          output={`[Pipeline] withCredentials (masking password)
+ docker login -u deploy-bot --password-stdin
Login Succeeded
+ docker push myapp:latest
✅ pushed

(console log shows **** for DOCKER_CREDS_PSW automatically)`}
        />
        <Callout type="tip">
          💡 Prefer <IC>environment&#123;&#125;</IC> for simple cases (one credential, entire
          pipeline). Use <IC>withCredentials&#123;&#125;</IC> when you need MULTIPLE credentials or
          want scoping (credential only available in one stage, then cleared).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="log-masking" number="04" title="Automatic Log Masking — ★★★ in Logs ⭐">
        <CodeBlock
          title="masking_demo.txt"
          runnable={false}
          code={`Jenkins automatically masks credentials in console output

Jenkinsfile:
environment {
  SECRET = credentials('api-secret')  // value: "super-secret-key-abc123"
}
steps {
  sh 'echo "Token: \${SECRET}"'
  sh 'curl -H "X-Token: \${SECRET}" https://api.example.com/deploy'
}

console output:
+ echo 'Token: ****'
Token: ****
+ curl -H 'X-Token: ****' https://api.example.com/deploy
✅ deployed

the masking is TEXTUAL REPLACEMENT — Jenkins scans output
for the secret string and replaces with **** before showing it

works for:
  ✅ sh/bat command echoes
  ✅ curl/http output that includes the token
  ✅ error messages referencing the secret

does NOT work for:
  ❌ secrets transformed (base64, hashed) before output
  ❌ secrets written to files that are later archived
  ❌ secrets sent to external APIs (Jenkins can't mask remote logs)

rule: masking is defense, not invincibility — still treat
      secrets carefully (don't echo, don't log, don't debug-print)`}
        />
        <CodeBlock
          title="masking_failure_example.groovy"
          code={`// ❌ MASKING BYPASSED (anti-pattern):
pipeline {
  agent any
  environment {
    PASSWORD = credentials('db-password')  // value: "hunter2"
  }
  stages {
    stage('Debug') {
      steps {
        // MISTAKE 1: direct echo
        sh 'echo "Password is: \${PASSWORD}"'
        // output: Password is: ****  ← masked, OK

        // MISTAKE 2: base64 encode
        sh 'echo -n "\${PASSWORD}" | base64'
        // output: aHVudGVyMg==  ← NOT masked! transformed 🚨

        // MISTAKE 3: write to file, archive it
        sh 'echo "PASSWORD=\${PASSWORD}" > .env'
        archiveArtifacts '.env'
        // .env artifact contains plaintext secret 🚨

        // MISTAKE 4: set -x (shell debug mode)
        sh 'set -x; curl -u admin:\${PASSWORD} ...'
        // output: + curl -u admin:hunter2 ...  ← NOT masked! 🚨
      }
    }
  }
}

// FIX: never echo, never transform, never set -x with secrets`}
        />
        <Callout type="mistake">
          ⚠️ The #1 leak: <IC>sh &apos;set -x; ...&apos;</IC> (bash debug mode). It prints EVERY
          command with substitutions BEFORE Jenkins can mask. Always avoid <IC>set -x</IC> / <IC>
            set -v
          </IC> in stages using credentials.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="rbac" number="05" title="RBAC — Matrix Auth & Folder Permissions">
        <CodeBlock
          title="rbac_model.txt"
          runnable={false}
          code={`Jenkins RBAC = who can do what, at which scope

INSTALL: Matrix Authorization Strategy plugin
  Manage Jenkins → Security → Authorization
    ✅ Matrix-based security

GLOBAL permissions (Jenkins-wide):
┌────────────────────────────────────────────────────────┐
│ User/Group     | Administer | Read | Job/Build | ... │
├────────────────────────────────────────────────────────┤
│ admin          |     ✅     |  ✅  |    ✅     |     │
│ dev-team       |     ❌     |  ✅  |    ✅     |     │
│ viewer         |     ❌     |  ✅  |    ❌     |     │
│ anonymous      |     ❌     |  ❌  |    ❌     |     │
└────────────────────────────────────────────────────────┘

FOLDER-SCOPED (the power move):
  create folders: New Item → Folder → "prod"
  Folder "prod" → Configure → ✅ Enable project-based security
    prod-deploy-team: Job/Build, Job/Read
    dev-team: (nothing) ← cannot even see jobs in /prod

  credentials scoped to folder:
    /prod folder → Credentials → Add
      Scope: this folder only
      ID: prod-db-password
    → dev jobs CANNOT access this credential 🔒

hierarchy:
Jenkins root
 ├── dev/ (folder)
 │    ├── credentials: dev-db-password
 │    └── jobs: anyone in dev-team can build
 └── prod/ (folder)
      ├── credentials: prod-db-password ← dev-team cannot read
      └── jobs: only prod-deploy-team can build

the pattern: LEAST PRIVILEGE via folders — every team
gets their folder + scoped credentials + minimal permissions`}
        />
        <CodeBlock
          title="rbac_example_failure.txt"
          runnable={false}
          code={`scenario: dev tries to use prod credentials

Jenkinsfile in /dev folder:
pipeline {
  agent any
  environment {
    DB = credentials('prod-db-password')  // ← credential in /prod folder
  }
  stages {
    stage('Test') {
      steps {
        sh 'echo \${DB}'
      }
    }
  }
}

build result:
[Pipeline] Start
ERROR: Credentials 'prod-db-password' is not available.
Available credentials (in /dev scope):
  - dev-db-password
  - shared-api-token
Build failed: java.lang.IllegalArgumentException: Credentials not found

WHY: folder RBAC — /dev jobs cannot see /prod credentials,
even if the user running the build has higher permissions.
Scope = job's folder, not user's role. 🔐

the design: credentials follow least-privilege by default`}
        />
        <Callout type="note">
          📌 ServiceAccount pattern: create a Jenkins user per team (e.g., <IC>svc-dev-ci</IC>),
          grant minimal permissions, use API token for that user in external triggers. Never share
          the admin account.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="common-mistakes" number="06" title="Common Mistakes — The Leak Checklist">
        <Table
          head={["Mistake", "Why it leaks", "Fix"]}
          rows={[
            [
              "sh 'echo $PASSWORD'",
              "Direct echo — visible in logs (masked, but bad practice)",
              "Don't echo secrets, even for debugging",
            ],
            [
              "sh 'set -x; deploy.sh'",
              "Shell debug mode prints substituted commands BEFORE masking",
              "Never use set -x / set -v with credentials",
            ],
            [
              "echo \"PASSWORD=$PASSWORD\" > .env && archiveArtifacts '.env'",
              "Artifact file contains plaintext secret, downloadable from Jenkins UI",
              "Never write secrets to archived files",
            ],
            [
              "Hardcoded in Jenkinsfile / committed to git",
              "Secret in version control = leaked forever (even if you delete the commit)",
              "Use credentials('id'), never literal values",
            ],
            [
              "echo $PASSWORD | base64",
              "Transformed secret not recognized by masking regex",
              "Avoid transforming secrets in shell (do it in Jenkins/plugin)",
            ],
            [
              "Sending secret to external API that logs it",
              "Jenkins can't mask logs on remote servers",
              "Ensure external systems also mask/redact secrets",
            ],
          ]}
        />
        <CodeBlock
          title="leak_audit_regex.sh"
          code={`# audit your Jenkinsfiles for potential leaks (git pre-commit hook):

#!/bin/bash
# .git/hooks/pre-commit

# check for common leak patterns in Jenkinsfiles
git diff --cached --name-only | grep Jenkinsfile | while read file; do
  if git diff --cached "\$file" | grep -E '(password|secret|token|key)\\s*=\\s*["\x27]'; then
    echo "🚨 Potential hardcoded secret in \$file"
    echo "   Secrets must use credentials('id'), not literal values"
    exit 1
  fi

  if git diff --cached "\$file" | grep -E 'set -x'; then
    echo "🚨 'set -x' detected in \$file"
    echo "   Shell debug mode can leak credentials — remove it"
    exit 1
  fi
done

echo "✅ No obvious credential leaks detected"
exit 0`}
          output={`(if commit contains hardcoded secret)
🚨 Potential hardcoded secret in Jenkinsfile
   Secrets must use credentials('id'), not literal values
(commit blocked)`}
        />
      </Section>

      {/* 07 */}
      <Section id="agent-security" number="07" title="Agent-to-Controller Security">
        <CodeBlock
          title="agent_controller_trust.txt"
          runnable={false}
          code={`the threat: compromised agent attacks controller

scenario:
  1. attacker gains shell on Jenkins agent (VM or container)
  2. agent has network access to controller
  3. attacker tries to:
     • read JENKINS_HOME (credentials, job configs)
     • execute arbitrary code on controller
     • escalate privileges

JENKINS DEFENSE: agent-to-controller security subsystem
  (enabled by default since Jenkins 2.326+)

Manage Jenkins → Security → Agent → Controller Security
  ✅ Enable Agent → Controller Access Control

allowed operations (whitelist):
  agents CAN:
    • send build logs to controller
    • report build status
    • request workspace files
    • download job config (read-only)
  agents CANNOT:
    • read credentials.xml
    • execute Groovy scripts on controller
    • access other jobs' workspaces
    • modify job configurations

file access rules:
  /var/jenkins_home/jobs/*/workspace → OK (agent's own job)
  /var/jenkins_home/credentials.xml  → BLOCKED
  /var/jenkins_home/secrets/         → BLOCKED

if agent tries forbidden operation:
  java.lang.SecurityException: agent may not read /var/jenkins_home/credentials.xml
  → build fails, controller logs the attempt 🚨

the model: ZERO TRUST — agents are untrusted executors,
controller is the only authority`}
        />
        <Callout type="behind">
          🔍 Under the hood: Jenkins uses the Remoting library for agent ↔ controller
          communication. The security layer intercepts every remoting call and checks against the
          whitelist (defined in <IC>FilePath</IC> rules). Modern setups use{" "}
          <IC>WebSocket</IC> transport (encrypted).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="audit" number="08" title="Audit & Compliance — Who Did What">
        <CodeBlock
          title="audit_trail.txt"
          runnable={false}
          code={`compliance need: "who accessed prod-db-password on Dec 3?"

INSTALL: Audit Trail plugin
  Manage Jenkins → Plugins → Audit Trail

configure (Manage Jenkins → System → Audit Trail):
  ✅ Log file: /var/log/jenkins/audit.log
  ✅ Log rotation: 30 days
  Events to log:
    ✅ Job started/stopped
    ✅ Credentials accessed
    ✅ Configuration changed
    ✅ User logged in/out

audit.log sample:
Dec  3 14:23:01 user=alice job=/prod/deploy-app credentials=prod-db-password action=used
Dec  3 14:25:33 user=bob job=/dev/test credentials=dev-db-password action=used
Dec  3 16:40:12 user=admin job=(none) credentials=prod-db-password action=viewed
Dec  5 09:12:45 user=eve job=/prod/deploy-app credentials=prod-db-password action=FAILED (permission denied)
                                                                                     ─────────────┬────────
                                                                                  caught an intrusion attempt 🚨

search the log:
  grep 'prod-db-password' /var/log/jenkins/audit.log
  → every access attempt, success or failure

send logs to SIEM (Splunk / ELK / Datadog):
  Audit Trail plugin → Syslog logger → forward to central logging

the power: tamper-evident trail — even admins can't hide
their actions if logs are shipped off-box in real time`}
        />
        <CodeBlock
          title="compliance_checklist.txt"
          runnable={false}
          code={`security checklist for Jenkins in prod:

🔐 SECRETS
   ✅ no hardcoded secrets in Jenkinsfiles (use credentials store)
   ✅ credentials.xml + master.key backed up + encrypted at rest
   ✅ folder-scoped credentials (prod secrets in /prod folder only)
   ✅ rotate credentials quarterly (or on any suspected leak)

👮 ACCESS CONTROL
   ✅ matrix auth enabled (not "anyone can do anything")
   ✅ folder-based RBAC (dev-team cannot touch /prod)
   ✅ LDAP/SSO integration (no local users except break-glass admin)
   ✅ API tokens expire / rotate (not indefinite)

🛡️ AGENT SECURITY
   ✅ agent → controller access control ON
   ✅ agents are ephemeral (containers) or hardened VMs
   ✅ controller executors = 0 (never build on controller)

📊 AUDIT
   ✅ audit trail plugin logs credential access
   ✅ logs shipped to SIEM (not just on Jenkins disk)
   ✅ weekly review of failed access attempts

🔒 NETWORK
   ✅ HTTPS only (HTTP disabled)
   ✅ CSRF protection enabled (default since 2.x)
   ✅ Jenkins not exposed to public internet (VPN or IP whitelist)

pass this checklist → pass security review → deploy to prod ✅`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Golden rule", "credentials('id') in Jenkinsfile, NEVER hardcoded values"],
            ["Credential storage", "encrypted in credentials.xml with master.key (back up both)"],
            ["Username+password", "credentials('id') → _USR and _PSW env vars"],
            ["Secret text", "string(credentialsId: 'id', variable: 'VAR')"],
            ["Secret file", "file(credentialsId: 'id', variable: 'FILE')"],
            ["SSH key", "sshagent(['key-id']) { sh 'git clone' }"],
            ["Log masking", "automatic **** replacement in console output"],
            ["Masking bypass", "set -x, base64, archiveArtifacts .env — all leak secrets"],
            ["Folder RBAC", "credentials scoped to folder — /dev jobs cannot use /prod creds"],
            ["Agent security", "agent → controller access control blocks credential.xml reads"],
            ["Audit trail", "logs every credential access + who + when (compliance)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
