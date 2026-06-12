"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "First Boot — Live",
  nodes: [
    { id: "you", icon: "👨‍💻", label: "You", sub: "run docker command", x: 7, y: 50, color: "#22d3ee" },
    { id: "docker", icon: "🐳", label: "Docker", sub: "container runtime", x: 25, y: 25, color: "#60a5fa" },
    { id: "jenkins", icon: "🎩", label: "Jenkins", sub: "running on :8080", x: 50, y: 50, color: "#fb923c" },
    { id: "volume", icon: "💾", label: "Volume", sub: "jenkins_home data", x: 50, y: 82, color: "#fbbf24" },
    { id: "browser", icon: "🌐", label: "Browser", sub: "localhost:8080", x: 75, y: 25, color: "#a78bfa" },
    { id: "plugins", icon: "🔌", label: "Plugins", sub: "Git, Pipeline…", x: 92, y: 60, color: "#34d399" },
  ],
  edges: [
    { id: "you-docker", from: "you", to: "docker", color: "#60a5fa" },
    { id: "docker-jenkins", from: "docker", to: "jenkins", color: "#fb923c" },
    { id: "jenkins-volume", from: "jenkins", to: "volume", color: "#fbbf24", dashed: true },
    { id: "you-browser", from: "you", to: "browser", color: "#a78bfa" },
    { id: "browser-jenkins", from: "browser", to: "jenkins", color: "#fb923c" },
    { id: "jenkins-plugins", from: "jenkins", to: "plugins", color: "#34d399" },
  ],
  flows: [
    {
      id: "boot",
      name: "🚀 First boot",
      command: "docker run → unlock → plugins",
      steps: [
        { node: "docker", paths: ["you-docker", "docker-jenkins"], text: "You run the Docker command. Jenkins image pulls (685 MB), container starts, Jenkins boots inside it. Logs stream: &apos;Jenkins initial setup is required...&apos;" },
        { node: "jenkins", paths: ["jenkins-volume"], text: "Jenkins generates secrets/initialAdminPassword, writes it to the named volume jenkins_home. This volume persists your data (jobs, builds, config) even if you delete the container. 💾" },
        { node: "browser", paths: ["you-browser", "browser-jenkins"], text: "You open localhost:8080, see the unlock screen. Copy the password from docker logs, paste, unlock. The setup wizard begins. 🎩" },
        { node: "plugins", paths: ["jenkins-plugins"], text: "You click &apos;Install suggested plugins&apos; → 20 essential plugins install (Git, Pipeline, GitHub, JUnit…). 2 minutes. First admin user created. Jenkins is ready. ✅" },
      ],
    },
    {
      id: "recovery",
      name: "🔓 Lost password",
      command: "exec into container → edit config.xml",
      steps: [
        { node: "docker", paths: ["you-docker"], text: "Forgot the admin password? No panic. You docker exec -it <container> bash, gaining shell access inside the running Jenkins container." },
        { node: "jenkins", paths: ["docker-jenkins", "jenkins-volume"], text: "Edit /var/jenkins_home/config.xml, set <useSecurity>false</useSecurity>, restart. Jenkins unlocked. Create new admin, re-enable security. (Or restore from volume backup.)" },
        { node: "volume", paths: [], text: "THIS is why the named volume matters — your config.xml, jobs/, secrets/ persist. Lose the volume = lose everything. Back it up. 💾🔐" },
      ],
    },
    {
      id: "upgrade",
      name: "⬆️ Upgrade LTS",
      command: "pull new image, run with same volume — data survives",
      steps: [
        { node: "docker", paths: ["you-docker"], text: "New Jenkins LTS released. You docker pull jenkins/jenkins:lts-jdk17 (new image), stop old container, start new one with THE SAME volume mount." },
        { node: "volume", paths: ["jenkins-volume"], text: "Volume = persistent. New container boots, reads jenkins_home, migrates config if needed. Your 50 jobs, 1200 builds, all settings — intact. Zero data loss. 🎉" },
        { node: "jenkins", paths: ["docker-jenkins", "jenkins-plugins"], text: "Jenkins detects new version on first run, may prompt to update plugins for compatibility. This is why Docker + named volumes = safe, reproducible Jenkins upgrades. ✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "docker-run", label: "Run Jenkins with Docker ⭐" },
  { id: "unlock", label: "The Unlock Ritual" },
  { id: "plugins", label: "Suggested Plugins Install" },
  { id: "first-admin", label: "Create First Admin User" },
  { id: "ui-tour", label: "UI Tour — Dashboard to Console ⭐" },
  { id: "jenkins-home", label: "JENKINS_HOME Anatomy" },
  { id: "backup", label: "Backup Basics" },
  { id: "other-installs", label: "Other Install Methods (apt, war, K8s)" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function JenkinsInstallationPage() {
  return (
    <TopicShell
      icon="🛠️"
      title="Install & First Run"
      gradientWord="Installation"
      subtitle="Get Jenkins running in 5 minutes with Docker, unlock it with the secret password, install the essential plugins, create your first admin user, and tour the UI from dashboard to build console. Plus: JENKINS_HOME structure, backup strategy, and alternative install methods for production."
      nav={NAV}
      badges={["🐳 Docker install", "🔓 Unlock ritual", "🏠 JENKINS_HOME"]}
      next={{ icon: "🧱", label: "Freestyle Jobs", href: "/jenkins/freestyle-jobs" }}
      backHref="/jenkins"
      backLabel="🎩 Jenkins"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="docker-run" number="01" title="Run Jenkins with Docker ⭐">
        <P>
          The fastest, cleanest way to run Jenkins locally: <IC>Docker</IC>. One command, no system
          pollution, easy to destroy and recreate. If you already have Docker installed, you&apos;re 5
          minutes from a running Jenkins.
        </P>
        <CodeBlock
          title="Terminal"
          code={`docker run -d \\
  --name jenkins \\
  -p 8080:8080 \\
  -p 50000:50000 \\
  -v jenkins_home:/var/jenkins_home \\
  jenkins/jenkins:lts-jdk17`}
          output={`Unable to find image 'jenkins/jenkins:lts-jdk17' locally
lts-jdk17: Pulling from jenkins/jenkins
...
Status: Downloaded newer image for jenkins/jenkins:lts-jdk17
f3c4d8a12e7b9a... ← container ID
`}
        />
        <CodeBlock
          title="what_this_command_does.txt"
          runnable={false}
          code={`DISSECTING THE COMMAND

docker run -d
  ↳ -d = detached (runs in background, doesn't block terminal)

--name jenkins
  ↳ name the container "jenkins" (easier than random hash)
  ↳ you can now: docker logs jenkins, docker stop jenkins, etc.

-p 8080:8080
  ↳ publish port: host:container
  ↳ Jenkins web UI runs on container port 8080
  ↳ map it to YOUR machine's port 8080
  ↳ → access at http://localhost:8080

-p 50000:50000
  ↳ agent communication port (agents connect to controller here)
  ↳ not needed for local experimentation, but standard config

-v jenkins_home:/var/jenkins_home
  ↳ CRITICAL: named volume mount
  ↳ jenkins_home = Docker-managed volume (survives container deletion)
  ↳ /var/jenkins_home = where Jenkins stores EVERYTHING inside container:
      jobs/, workspace/, builds/, secrets/, plugins/, config.xml
  ↳ delete the container? volume persists → data safe 💾
  ↳ NO -v flag? data is lost when container is deleted ❌

jenkins/jenkins:lts-jdk17
  ↳ official Jenkins image, LTS (Long Term Support) release
  ↳ jdk17 = includes Java 17 (required for modern Jenkins)
  ↳ lts = stable, updated every ~3 months (vs weekly releases)
  ↳ image size: ~685 MB`}
        />
        <Callout type="tip">
          💡 Check if it&apos;s running: <IC>docker ps</IC> — you should see jenkins/jenkins with status
          &quot;Up&quot;. Check logs: <IC>docker logs -f jenkins</IC> — watch it boot, look for
          &quot;Jenkins is fully up and running&quot;.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="unlock" number="02" title="The Unlock Ritual">
        <P>
          Open <IC>http://localhost:8080</IC>. You&apos;ll hit the <em>unlock screen</em> — Jenkins
          won&apos;t let you in without the secret password it generated on first boot. This is a
          security feature: only someone with access to the server (or container logs) can set up Jenkins.
        </P>
        <CodeBlock
          title="unlock_screen.txt"
          runnable={false}
          code={`┌────────────────────────────────────────────────────────┐
│                  🎩 Unlock Jenkins                     │
│                                                        │
│  To ensure Jenkins is securely set up by the admin,   │
│  a password has been written to the log and this file:│
│                                                        │
│    /var/jenkins_home/secrets/initialAdminPassword     │
│                                                        │
│  Please copy the password from either location and    │
│  paste it below.                                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [paste password here]                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                 [Continue] button     │
└────────────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="Terminal"
          code={`docker logs jenkins 2>&1 | grep -A 2 "initialAdminPassword"`}
          output={`*************************************************************

Jenkins initial setup is required. An admin user has been created
and a password generated.
Please use the following password to proceed to installation:

a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9

This may also be found at: /var/jenkins_home/secrets/initialAdminPassword

*************************************************************`}
        />
        <P>
          Copy that gibberish password (<IC>a3f9c2d7e1b8f4a6c9e2d5b8a1f3c6e9</IC> in this example),
          paste it into the unlock screen, click Continue. You&apos;re in. 🎉
        </P>
        <Callout type="note">
          📘 Alternative: <IC>docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword</IC> —
          directly print the password file. After unlock, this file is deleted (you&apos;ll create a real
          admin user next).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="plugins" number="03" title="Suggested Plugins Install">
        <P>
          After unlock, the setup wizard asks: <IC>Customize Jenkins</IC>. You have two options:
        </P>
        <CodeBlock
          title="plugin_choice.txt"
          runnable={false}
          code={`┌──────────────────────────────────────────────────────────┐
│            Customize Jenkins                             │
│                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐ │
│  │ Install suggested      │  │ Select plugins to      │ │
│  │ plugins                │  │ install                │ │
│  │                        │  │                        │ │
│  │  📦 Git                │  │  (expert mode —        │ │
│  │  📦 Pipeline           │  │   pick from 1800+      │ │
│  │  📦 GitHub             │  │   manually)            │ │
│  │  📦 Docker             │  │                        │ │
│  │  📦 Credentials        │  │  ⚠️ not recommended    │ │
│  │  + 15 more essential   │  │     for first install) │ │
│  └────────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

ADVICE: click "Install suggested plugins" (left option)
↳ installs ~20 battle-tested plugins everyone needs
↳ takes 2-3 minutes, automatic, zero choices
↳ you can install more plugins later (Manage Jenkins → Plugins)`}
        />
        <P>
          Click <IC>Install suggested plugins</IC>. Watch the progress screen as Jenkins downloads and
          installs Git, Pipeline, GitHub, Docker, Credentials, JUnit, Email Extension, LDAP, Matrix
          Authorization, SSH, and a dozen others. When it finishes (green checkmarks), the wizard
          continues to user creation.
        </P>
        <Callout type="mistake">
          ⚠️ Don&apos;t skip plugins. Clicking &quot;Start using Jenkins&quot; without installing ANY
          plugins leaves you with a bare engine — no Git integration, no pipeline syntax, painful to fix
          later. Take the 2 minutes.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="first-admin" number="04" title="Create First Admin User">
        <P>
          Next screen: <IC>Create First Admin User</IC>. You could skip this (Jenkins would use the
          initial password forever), but DON&apos;T — create a real admin account:
        </P>
        <CodeBlock
          title="admin_user_form.txt"
          runnable={false}
          code={`┌──────────────────────────────────────────────────────┐
│  Create First Admin User                             │
│                                                      │
│  Username:  [admin]                                  │
│  Password:  [your-strong-password]                   │
│  Confirm:   [your-strong-password]                   │
│  Full name: [Your Name]                              │
│  Email:     [you@example.com]                        │
│                                                      │
│             [Save and Continue]                      │
└──────────────────────────────────────────────────────┘

WHAT HAPPENS:
✅ the gibberish initialAdminPassword is deleted
✅ this user becomes the admin (full permissions)
✅ you log in with this username/password from now on
✅ email is used for build notifications (if configured)

⚠️ REMEMBER THIS PASSWORD — losing it requires editing config.xml
   inside the container (see diagram scenario #2 above)`}
        />
        <P>
          Click <IC>Save and Continue</IC>, confirm the Jenkins URL (<IC>http://localhost:8080/</IC>),
          click <IC>Save and Finish</IC>, then <IC>Start using Jenkins</IC>. You&apos;re at the main
          dashboard. Jenkins is ready. 🎩✅
        </P>
      </Section>

      {/* 05 */}
      <Section id="ui-tour" number="05" title="UI Tour — Dashboard to Console ⭐">
        <P>
          The Jenkins UI is function-over-form (it&apos;s been the same since 2011). Let&apos;s draw the
          navigation hierarchy:
        </P>
        <CodeBlock
          title="jenkins_ui_map.txt"
          runnable={false}
          code={`JENKINS WEB UI NAVIGATION (5 levels deep)

┌─────────────────────────────────────────────────────────────┐
│  LEVEL 1: DASHBOARD  http://localhost:8080/                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🎩 Jenkins                           admin ▼  ⚙️       │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  + New Item    People    Build History    Manage       │ │
│  │                                                         │ │
│  │  ┌─ All Jobs ────────────────────────────────────────┐ │ │
│  │  │  Name            Last Success  Last Failure  ...   │ │
│  │  │  my-first-job    #12 (2m ago)  #8 (1h ago)        │ │
│  │  │  backend-tests   #45 (5m ago)  never              │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│    ↓ click a job name                                       │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: JOB PAGE  http://localhost:8080/job/my-first-job/ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  my-first-job                                          │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  ▶️ Build Now    Configure    Delete    Workspace      │ │
│  │                                                         │ │
│  │  Build History        Permalinks                       │ │
│  │  ─────────────        ─────────────                    │ │
│  │  #12  5m ago  ✅      Last successful build: #12       │ │
│  │  #11  1h ago  ❌      Last failed build: #8            │ │
│  │  #10  2h ago  ✅                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│    ↓ click a build number                                   │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 3: BUILD PAGE  .../job/my-first-job/12/              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  my-first-job #12                           ✅ SUCCESS │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Console Output    Changes    Tests    Artifacts       │ │
│  │                                                         │ │
│  │  Started by user admin                                 │ │
│  │  Duration: 2 min 34 sec                                │ │
│  │  Revision: a3f9c2d (origin/main)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│    ↓ click Console Output (THE most important tab)         │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 4: CONSOLE OUTPUT (the build log — raw text) 🔍     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Started by user admin                                 │ │
│  │  Running as SYSTEM                                     │ │
│  │  Building in workspace /var/jenkins_home/workspace/... │ │
│  │  [my-first-job] $ /bin/sh -xe /tmp/jenkins123.sh       │ │
│  │  + echo 'Hello from Jenkins!'                          │ │
│  │  Hello from Jenkins!                                   │ │
│  │  Finished: SUCCESS                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│    ↑ THIS is where you debug failures — read every line    │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 5: MANAGE JENKINS  .../manage/                      │
│  (admin settings — plugins, security, nodes, credentials)  │
│  ↳ covered in later topics 🔐🤖                             │
└─────────────────────────────────────────────────────────────┘

NAVIGATION RHYTHM:
Dashboard → click job → click build number → click Console Output
repeat 1000 times — you'll do this path in your sleep 😴`}
        />
        <Callout type="tip">
          💡 Bookmark <IC>http://localhost:8080/console</IC> — it jumps straight to the latest build
          console for the last-run job. Power user shortcut.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="jenkins-home" number="06" title="JENKINS_HOME Anatomy">
        <P>
          Everything Jenkins knows lives in <IC>/var/jenkins_home</IC> (inside the container), mapped to
          the Docker volume <IC>jenkins_home</IC> (on your host). Let&apos;s inspect the directory tree:
        </P>
        <CodeBlock
          title="Terminal"
          code={`docker exec jenkins ls -F /var/jenkins_home`}
          output={`config.xml          ← main config (security, agents, global settings)
fingerprints/       ← artifact checksums (for traceability)
identity.key.enc    ← Jenkins instance ID (encrypted)
jobs/               ← ALL YOUR JOBS (config + builds) 📂 CRITICAL
logs/               ← Jenkins system logs
nodes/              ← agent configurations (if you add build agents)
plugins/            ← installed plugin .jpi files + dependencies
secret.key          ← master encryption key 🔑 CRITICAL
secrets/            ← initialAdminPassword, other generated secrets
updates/            ← plugin update metadata
userContent/        ← files you want served at /userContent/ URL
users/              ← user account data (admin, etc.)
war/                ← Jenkins web app itself (from the .war file)
workspace/          ← build workspaces (Git checkouts, build artifacts)
workflow-libs/      ← shared pipeline libraries (advanced)`}
        />
        <CodeBlock
          title="jobs_directory_structure.txt"
          runnable={false}
          code={`jobs/ ← the heart of JENKINS_HOME
 │
 ├─ my-first-job/
 │   ├─ config.xml           ← job definition (SCM, triggers, steps)
 │   ├─ builds/
 │   │   ├─ 1/               ← build #1
 │   │   │   ├─ build.xml    ← build metadata (result, duration, user)
 │   │   │   ├─ log          ← console output (the raw text)
 │   │   │   └─ changelog.xml ← Git changes for this build
 │   │   ├─ 2/
 │   │   ├─ 3/
 │   │   ...
 │   ├─ nextBuildNumber      ← simple counter (next build will be #N)
 │   └─ workspace/           ← Git checkout lives here during build
 │
 ├─ backend-tests/
 │   └─ ... (same structure)
 │
 └─ deploy-prod/
     └─ ...

workspace/ ← Git clones, build outputs (separate from jobs/)
 ├─ my-first-job/        ← Git repo checked out here when building
 ├─ backend-tests/
 └─ ...

KEY FILES TO BACKUP:
✅ jobs/            (lose this = lose all job configs + build history)
✅ config.xml       (lose this = lose security, global settings)
✅ secrets/         (lose this = can't decrypt credentials)
⚠️ workspace/ is TRANSIENT — can be recreated by re-running builds`}
        />
      </Section>

      {/* 07 */}
      <Section id="backup" number="07" title="Backup Basics">
        <P>
          Jenkins has no built-in &quot;Export All&quot; button. Backup = copy the Docker volume (or
          JENKINS_HOME directory if installed directly). Here&apos;s the pragmatic strategy:
        </P>
        <CodeBlock
          title="Terminal"
          code={`# Quick backup: tar the entire jenkins_home volume
docker run --rm \\
  -v jenkins_home:/source \\
  -v \$(pwd):/backup \\
  alpine tar czf /backup/jenkins-backup-\$(date +%Y%m%d).tar.gz -C /source .`}
          output={`jenkins-backup-20260612.tar.gz created (342 MB)`}
        />
        <CodeBlock
          title="backup_restore_strategy.txt"
          runnable={false}
          code={`BACKUP STRATEGIES (pick based on importance)

1️⃣ MINIMAL (for learning/dev environments)
   └─ back up jobs/ directory only
      docker exec jenkins tar czf /tmp/jobs.tar.gz -C /var/jenkins_home jobs
      docker cp jenkins:/tmp/jobs.tar.gz ./jenkins-jobs-backup.tar.gz
   ✅ restore job configs fast
   ❌ lose global settings, secrets, build history

2️⃣ FULL VOLUME BACKUP (recommended for production)
   └─ snapshot the entire jenkins_home volume
      • docker volume backup (method shown above)
      • OR use volume plugin (e.g., docker-volume-backup)
      • OR if on cloud, snapshot the disk/EBS volume
   ✅ complete point-in-time restore (config + jobs + builds + secrets)
   ⚠️ large size (GB) if you keep 1000s of build logs

3️⃣ CONFIGURATION AS CODE (advanced, best practice)
   └─ store job definitions in Git (Jenkinsfile = pipeline-as-code)
      + use Configuration as Code plugin (JCasC) for global settings
   ✅ reproducible, version-controlled, disaster recovery = git clone
   ✅ jobs/ becomes disposable (can recreate from Git)
   ⚠️ build HISTORY is still lost (but history < config reproducibility)

RESTORE:
1. stop Jenkins container:  docker stop jenkins
2. delete old volume:       docker volume rm jenkins_home
3. create new volume:       docker volume create jenkins_home
4. extract backup into it:  docker run --rm -v jenkins_home:/target \\
                              -v \$(pwd):/backup alpine \\
                              tar xzf /backup/jenkins-backup-YYYYMMDD.tar.gz -C /target
5. start Jenkins:           docker start jenkins (or re-run docker run...)

frequency: nightly cron for production, weekly for dev, never for local learning 🤷`}
        />
        <Callout type="tip">
          💡 The #1 thing to version-control: <IC>Jenkinsfile</IC> (your pipeline code). If your job
          definitions live in Git with your app code, losing Jenkins is annoying but not catastrophic —
          you can recreate jobs by pointing at the repo again.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="other-installs" number="08" title="Other Install Methods (apt, war, K8s)">
        <P>
          Docker is the easiest for learning. Production teams use these alternatives:
        </P>
        <Table
          head={["Method", "Use Case", "Pros / Cons"]}
          rows={[
            ["Docker (shown above)", "dev, small prod, easy start", "✅ clean, portable, easy upgrade · ❌ need Docker knowledge"],
            ["apt/yum package", "Ubuntu/Debian/CentOS servers", "✅ systemd service, familiar ops · ❌ OS-coupled, harder to upgrade"],
            [".war file", "existing Tomcat/Jetty", "✅ integrate with existing Java app server · ❌ rare, complex"],
            ["Kubernetes (Helm chart)", "cloud-native, auto-scaling", "✅ HA, dynamic agents as pods · ❌ high complexity, overkill for <100 jobs"],
            ["Managed service (CloudBees)", "enterprise, support contract", "✅ pro features, official support · ❌ expensive ($$$)"],
          ]}
        />
        <CodeBlock
          title="apt_install_snippet.sh"
          code={`# Install on Ubuntu (if you prefer apt over Docker)
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \\
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \\
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \\
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins

# JENKINS_HOME is /var/lib/jenkins (owned by jenkins user)
# Access at http://localhost:8080 (same unlock ritual)
# Managed by systemd: sudo systemctl status jenkins`}
          output={`jenkins.service - Jenkins Continuous Integration Server
   Loaded: loaded (/lib/systemd/system/jenkins.service; enabled)
   Active: active (running) since ...`}
        />
        <Callout type="note">
          📘 Recommendation: start with Docker for this course. If you later move to production on
          Kubernetes, the concepts (jobs, pipelines, agents) transfer 100% — only the orchestration layer
          changes.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Run Jenkins (Docker)", "docker run -d -p 8080:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17"],
            ["Unlock password", "docker logs jenkins 2>&1 | grep initialAdminPassword (or cat the file)"],
            ["First setup wizard", "unlock → install suggested plugins → create admin user → start"],
            ["UI navigation", "Dashboard → Job → Build # → Console Output (the debug path)"],
            ["JENKINS_HOME", "/var/jenkins_home — jobs/, config.xml, secrets/, plugins/, workspace/"],
            ["Volume purpose", "named volume = data persists across container recreation 💾"],
            ["Backup essentials", "tar jenkins_home volume (or just jobs/ for quick config backup)"],
            ["Config-as-Code", "store Jenkinsfile in Git = job definitions are version-controlled ✅"],
            ["Lost admin password", "docker exec → edit config.xml <useSecurity>false → restart → reset"],
            ["Upgrade Jenkins", "docker pull new image, run with SAME volume mount → data migrates"],
            ["Ports", "8080 = web UI · 50000 = agent communication"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
