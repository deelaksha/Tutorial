"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "helm upgrade — Live",
  nodes: [
    { id: "chart", icon: "📦", label: "Chart", sub: "templates + values", x: 8, y: 30, color: "#a78bfa" },
    { id: "values", icon: "⚙️", label: "values.yaml", sub: "image.tag: v2", x: 8, y: 65, color: "#fbbf24" },
    { id: "helm", icon: "🎯", label: "Helm", sub: "CLI / engine", x: 30, y: 48, color: "#22d3ee" },
    { id: "manifests", icon: "📄", label: "Rendered Manifests", sub: "final YAML", x: 52, y: 30, color: "#60a5fa" },
    { id: "apiserver", icon: "☸️", label: "API Server", sub: "applies to cluster", x: 75, y: 30, color: "#34d399" },
    { id: "history", icon: "📜", label: "Release History", sub: "rev 1, 2, 3…", x: 52, y: 65, color: "#f472b6" },
  ],
  edges: [
    { id: "chart-helm", from: "chart", to: "helm", color: "#a78bfa" },
    { id: "values-helm", from: "values", to: "helm", color: "#fbbf24" },
    { id: "helm-manifests", from: "helm", to: "manifests", color: "#60a5fa" },
    { id: "manifests-apiserver", from: "manifests", to: "apiserver", color: "#34d399" },
    { id: "helm-history", from: "helm", to: "history", bend: 30, dashed: true, color: "#f472b6" },
    { id: "history-helm", from: "history", to: "helm", bend: -30, dashed: true, color: "#fb923c" },
  ],
  flows: [
    {
      id: "install",
      name: "📦 Install v1",
      command: "helm install myapp ./mychart",
      steps: [
        { node: "helm", paths: ["chart-helm", "values-helm"], text: "Helm reads chart templates + values.yaml. Renders {{ .Values.image.tag }} → v1." },
        { node: "manifests", paths: ["helm-manifests", "manifests-apiserver"], text: "Generated manifests applied to cluster. Deployment, Service, Ingress created. 🚀" },
        { node: "history", paths: ["helm-history"], text: "Release 'myapp' revision 1 stored in Secret (release history). Status: deployed. ✅" },
      ],
    },
    {
      id: "upgrade",
      name: "🔄 Upgrade to v2",
      command: "helm upgrade myapp ./mychart --set image.tag=v2",
      steps: [
        { node: "values", paths: ["values-helm"], text: "New values: image.tag=v2 (overrides values.yaml). Helm re-renders templates with new tag." },
        { node: "apiserver", paths: ["helm-manifests", "manifests-apiserver"], text: "Deployment updated: rolling update v1→v2. Service unchanged (same selector). 🔄" },
        { node: "history", paths: ["helm-history"], text: "Revision 2 saved. History: rev 1 (v1), rev 2 (v2, current). Can rollback anytime. 📜" },
      ],
    },
    {
      id: "rollback",
      name: "⏪ Rollback to rev 1",
      command: "helm rollback myapp 1",
      steps: [
        { node: "history", paths: ["history-helm"], text: "Helm fetches revision 1 manifests from history. No re-templating — uses stored YAML." },
        { node: "apiserver", paths: ["helm-manifests", "manifests-apiserver"], text: "Deployment downgraded: v2→v1. Instant rollback (pods restart with old image). ⏪" },
        { node: "history", paths: ["helm-history"], text: "Revision 3 created (copy of rev 1). History: 1, 2, 3 (current = 1 manifests). 🔁" },
      ],
    },
  ],
};

const NAV = [
  { id: "problem", label: "The Copy-Paste Hell ⭐" },
  { id: "what-is-helm", label: "What is Helm?" },
  { id: "chart-anatomy", label: "Chart Anatomy ⭐" },
  { id: "templating", label: "Templating Engine Deep Dive" },
  { id: "lifecycle", label: "Install / Upgrade / Rollback Lifecycle ⭐" },
  { id: "values", label: "Values Precedence" },
  { id: "repos", label: "Helm Repos & Public Charts" },
  { id: "debugging", label: "Debugging Charts" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sHelmPage() {
  return (
    <TopicShell
      icon="📦"
      title="Kubernetes Helm"
      gradientWord="Helm"
      subtitle="Managing 12 YAML files × 3 environments = 36 nearly-identical manifests is copy-paste hell. Helm is Kubernetes&apos; package manager + templating engine: define once, deploy everywhere with different values. This topic teaches chart structure, the templating syntax, install/upgrade/rollback lifecycle, values overrides, public repos (bitnami), and how to debug when templates break."
      nav={NAV}
      badges={["📦 Charts", "🔄 Releases", "🎯 Templating"]}
      next={{ icon: "🚀", label: "Production & GitOps", href: "/kubernetes/production" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="problem" number="01" title="The Copy-Paste Hell — Why Helm Exists ⭐">
        <P>
          You built an app. It has a Deployment, Service, Ingress, ConfigMap, Secret, HPA — 6 YAML files. Now you need to deploy it to <strong>dev, staging, prod</strong> environments with different:
        </P>
        <CodeBlock
          title="multi_env_problem.txt"
          runnable={false}
          code={`DIFFERENCES PER ENVIRONMENT
  image tag:   dev → :latest    staging → :v1.2.3-rc1    prod → :v1.2.3
  replicas:    dev → 1          staging → 2              prod → 5
  domain:      dev.app.com      staging.app.com          app.com
  resources:   tiny             medium                   large
  secrets:     dev-db-secret    staging-db-secret        prod-db-secret

NAIVE APPROACH: copy-paste 6 files × 3 envs = 18 YAML files
┌────────────────────────────────────────────────────────────┐
│ manifests/                                                 │
│   dev/                                                     │
│     deployment.yaml    ← image: myapp:latest, replicas: 1 │
│     service.yaml                                           │
│     ingress.yaml       ← host: dev.app.com                 │
│     ...                                                    │
│   staging/                                                 │
│     deployment.yaml    ← image: myapp:v1.2.3-rc1, replicas: 2
│     service.yaml       ← 99% identical to dev/service.yaml│
│     ingress.yaml       ← host: staging.app.com             │
│     ...                                                    │
│   prod/                                                    │
│     deployment.yaml    ← image: myapp:v1.2.3, replicas: 5 │
│     ...                                                    │
└────────────────────────────────────────────────────────────┘

PROBLEMS:
❌ change Service port? edit 3 files
❌ add a label? edit 18 files
❌ human error: prod accidentally has dev image tag 💀
❌ no version control of "which version is deployed where"

SOLUTION: HELM — define ONCE with placeholders, inject values`}
        />
        <Callout type="analogy">
          📋 <strong>Mail merge analogy</strong>: You have one letter template with <IC>{`{{name}}`}</IC>, <IC>{`{{address}}`}</IC> placeholders. You don&apos;t write 100 separate letters — you run mail merge with a CSV of names/addresses. Helm is mail merge for Kubernetes manifests.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="what-is-helm" number="02" title="What is Helm?">
        <P>
          <strong>Helm</strong> is two things:
        </P>
        <CodeBlock
          title="helm_definition.txt"
          runnable={false}
          code={`1. PACKAGE MANAGER (like apt/yum for K8s)
   • install complex apps in one command:
     helm install postgres bitnami/postgresql
     (no need to find 5 YAML files — chart bundles them)
   • discover public charts: bitnami, jetstack, prometheus-community

2. TEMPLATING ENGINE (like Jinja/Go templates for YAML)
   • write manifests with {{ .Values.image.tag }} placeholders
   • render with different values → dev/staging/prod
   • manage releases: install, upgrade, rollback (with history)`}
        />
        <P>
          Key concepts:
        </P>
        <Table
          head={["Term", "Meaning"]}
          rows={[
            [<IC key="1">Chart</IC>, "a Helm package — directory with templates/ + values.yaml + Chart.yaml"],
            [<IC key="2">Release</IC>, "an installed instance of a chart (myapp-dev, myapp-prod = 2 releases)"],
            [<IC key="3">Repository</IC>, "a server hosting chart packages (like npm registry or Docker Hub)"],
            [<IC key="4">Values</IC>, "config data injected into templates (image tag, replicas, domain)"],
            [<IC key="5">Template</IC>, "YAML with {{ }} placeholders — rendered by Helm into final manifests"],
          ]}
        />
      </Section>

      {/* 03 */}
      <Section id="chart-anatomy" number="03" title="Chart Anatomy — Directory Structure ⭐">
        <P>
          A Helm chart is just a directory with a specific layout:
        </P>
        <CodeBlock
          title="chart_structure.txt"
          runnable={false}
          code={`mychart/                      ← chart root directory
├── Chart.yaml                ← metadata (name, version, description)
├── values.yaml               ← default values (dev overrides this)
├── charts/                   ← dependencies (sub-charts)
├── templates/                ← K8s manifests with {{ }} templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl          ← reusable template snippets ({{ include "mychart.name" . }})
│   └── NOTES.txt             ← printed after helm install (instructions)
└── .helmignore               ← files to ignore (like .gitignore)

Chart.yaml example:
  apiVersion: v2
  name: mychart
  version: 1.0.0   # chart version (not app version)
  appVersion: "2.5.1"   # the app's version

values.yaml example:
  replicaCount: 1
  image:
    repository: myapp
    tag: "latest"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80`}
        />
        <Callout type="behind">
          🔧 <strong>Chart version vs app version</strong>: <IC>version</IC> in Chart.yaml is the chart&apos;s schema version (bump when you change templates). <IC>appVersion</IC> is the software version you&apos;re deploying (displayed by <IC>helm list</IC>). They&apos;re independent — you can release chart v2.0.0 deploying app v1.5.0.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="templating" number="04" title="Templating Engine Deep Dive — Go Templates">
        <P>
          Helm uses <strong>Go text/template</strong> syntax. Here are the essentials:
        </P>
        <CodeBlock
          title="templates/deployment.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app   # ← inject release name
  labels:
    app: {{ .Chart.Name }}         # ← chart name from Chart.yaml
    version: {{ .Chart.AppVersion | quote }}   # ← quote filter
spec:
  replicas: {{ .Values.replicaCount }}   # ← from values.yaml
  selector:
    matchLabels:
      app: {{ .Chart.Name }}
  template:
    metadata:
      labels:
        app: {{ .Chart.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 8080
        {{- if .Values.resources }}   # ← conditional (if resources set)
        resources:
{{ toYaml .Values.resources | indent 10 }}   # ← convert map to YAML, indent
        {{- end }}`}
        />
        <P>
          Template variables (the <IC>.</IC> root object):
        </P>
        <Table
          head={["Variable", "Value", "Example"]}
          rows={[
            [<IC key="1">.Release.Name</IC>, "the release name (from helm install)", <IC key="2">myapp-dev</IC>],
            [<IC key="3">.Release.Namespace</IC>, "namespace where release is installed", <IC key="4">prod</IC>],
            [<IC key="5">.Chart.Name</IC>, "chart name from Chart.yaml", <IC key="6">mychart</IC>],
            [<IC key="7">.Chart.Version</IC>, "chart version", <IC key="8">1.0.0</IC>],
            [<IC key="9">.Values</IC>, "merged values from values.yaml + overrides", <IC key="10">{`{replicaCount: 3, image: {...}}`}</IC>],
            [<IC key="11">.Capabilities.KubeVersion</IC>, "Kubernetes version of target cluster", <IC key="12">1.28.0</IC>],
          ]}
        />
        <P>
          Common template functions:
        </P>
        <CodeBlock
          title="template_functions.yaml"
          runnable={false}
          code={`# quote (wrap in "")
value: {{ .Values.name | quote }}   → value: "myapp"

# default (fallback if value not set)
replicas: {{ .Values.replicas | default 1 }}   → replicas: 1 (if not set)

# toYaml (convert Go map/array to YAML)
resources:
{{ toYaml .Values.resources | indent 2 }}

# indent (add leading spaces)
{{ .Values.config | indent 4 }}

# if/else
{{- if eq .Values.env "prod" }}
  replicas: 5
{{- else }}
  replicas: 1
{{- end }}

# range (loop over array)
{{- range .Values.hosts }}
  - {{ . }}   # ← "." is current item in loop
{{- end }}

# include (reuse template snippet from _helpers.tpl)
labels:
{{ include "mychart.labels" . | indent 2 }}`}
        />
        <Callout type="tip">
          💡 The <IC>-</IC> in <IC>{`{{-`}</IC> and <IC>{`-}}`}</IC> trims whitespace (left/right). Use it to avoid extra blank lines in rendered YAML. Example: <IC>{`{{- if ... }}`}</IC> (no blank line before the if block).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="lifecycle" number="05" title="Install / Upgrade / Rollback Lifecycle ⭐">
        <P>
          Helm manages the full lifecycle of an app deployment:
        </P>
        <CodeBlock
          title="helm install"
          output={`$ helm install myapp ./mychart
NAME: myapp
NAMESPACE: default
STATUS: deployed
REVISION: 1
NOTES:   ← content from templates/NOTES.txt
Your app is now running!
Access it at http://myapp.example.com

$ helm list
NAME    NAMESPACE  REVISION  STATUS    CHART          APP VERSION
myapp   default    1         deployed  mychart-1.0.0  2.5.1

$ kubectl get pods
NAME                          READY   STATUS
myapp-app-7f8d9c-abc12        1/1     Running   ← created by Helm`}
          code={`helm install myapp ./mychart
helm list`}
        />
        <P>
          Helm stores the release state in a <IC>Secret</IC> (default) or <IC>ConfigMap</IC> in the release namespace. This tracks revision history.
        </P>
        <CodeBlock
          title="helm upgrade (change values)"
          output={`# upgrade with new image tag
$ helm upgrade myapp ./mychart --set image.tag=v2.0.0
Release "myapp" has been upgraded. Happy Helming!
REVISION: 2   ← incremented

$ helm list
NAME    REVISION  STATUS    CHART          APP VERSION
myapp   2         deployed  mychart-1.0.0  2.5.1

$ kubectl get pods
NAME                          READY   STATUS
myapp-app-9a8b7c-xyz12        1/1     Running   ← new pod (rolling update)
myapp-app-7f8d9c-abc12        0/1     Terminating   ← old pod terminating

the Deployment was updated → rolling update triggered automatically ✅`}
          code={`helm upgrade myapp ./mychart --set image.tag=v2.0.0
helm list`}
        />
        <CodeBlock
          title="helm history + rollback"
          output={`$ helm history myapp
REVISION  UPDATED                   STATUS      CHART          DESCRIPTION
1         Mon Jun 10 10:00:00 2026  superseded  mychart-1.0.0  Install complete
2         Mon Jun 12 14:30:00 2026  deployed    mychart-1.0.0  Upgrade complete

# rollback to revision 1
$ helm rollback myapp 1
Rollback was a success! Happy Helming!

$ helm history myapp
REVISION  UPDATED                   STATUS      CHART          DESCRIPTION
1         Mon Jun 10 10:00:00 2026  superseded  mychart-1.0.0  Install complete
2         Mon Jun 12 14:30:00 2026  superseded  mychart-1.0.0  Upgrade complete
3         Mon Jun 12 15:00:00 2026  deployed    mychart-1.0.0  Rollback to 1

rollback creates a NEW revision (3) that is a copy of rev 1 ⏪`}
          code={`helm history myapp
helm rollback myapp 1`}
        />
        <Callout type="behind">
          🔧 <strong>How rollback works</strong>: Helm doesn&apos;t revert the cluster state directly. It fetches the manifests from revision 1 (stored in the Secret) and applies them again. This is why rollback is instant — no re-templating, just replay stored YAML.
        </Callout>
        <CodeBlock
          title="helm uninstall (delete everything)"
          output={`$ helm uninstall myapp
release "myapp" uninstalled

$ kubectl get pods
No resources found.   ← all resources created by the chart are deleted

# to keep history for potential re-install:
$ helm uninstall myapp --keep-history
(release deleted but helm history myapp still works)`}
          code={`helm uninstall myapp
kubectl get pods`}
        />
      </Section>

      {/* 06 */}
      <Section id="values" number="06" title="Values Precedence — Overriding Defaults">
        <P>
          Values can come from multiple sources. Helm merges them with this precedence (later wins):
        </P>
        <CodeBlock
          title="values_precedence.txt"
          runnable={false}
          code={`LOWEST PRIORITY (overridden by everything)
  1. values.yaml in the chart (defaults)
     replicaCount: 1

  2. values file from parent chart (if using dependencies)

  3. -f / --values file (custom values)
     helm install myapp ./mychart -f prod-values.yaml
     replicaCount: 5   ← overrides values.yaml

  4. --set flag (command-line override)
     helm install myapp ./mychart --set replicaCount=10
     replicaCount: 10   ← overrides everything above
HIGHEST PRIORITY (wins all conflicts)

example:
  values.yaml:       replicaCount: 1, image.tag: latest
  prod-values.yaml:  replicaCount: 5, image.tag: v1.0.0
  --set:             image.tag=v1.0.1

  final merged values:
    replicaCount: 5         (from prod-values.yaml)
    image.tag: v1.0.1       (from --set, highest priority)`}
        />
        <CodeBlock
          title="prod-values.yaml"
          runnable={false}
          code={`# override file for production
replicaCount: 5
image:
  tag: "v1.2.3"   # pin production version (not :latest)
  pullPolicy: Always
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2
    memory: 2Gi
ingress:
  enabled: true
  host: app.example.com
  tls:
    enabled: true
    secretName: app-tls`}
        />
        <CodeBlock
          title="helm install with multiple value sources"
          output={`$ helm install myapp ./mychart \\
  -f prod-values.yaml \\
  --set image.tag=v1.2.4 \\
  --set ingress.host=newapp.example.com

final values:
  replicaCount: 5   (from prod-values.yaml)
  image.tag: v1.2.4   (from --set, overrides prod-values.yaml)
  ingress.host: newapp.example.com   (from --set)
  resources: { ... }   (from prod-values.yaml)

pattern: base values.yaml → env-specific file → hotfix with --set ✅`}
          code={`helm install myapp ./mychart -f prod-values.yaml --set image.tag=v1.2.4`}
        />
        <Callout type="tip">
          💡 <strong>Best practice</strong>: keep <IC>values.yaml</IC> as dev/default config. Create <IC>values-prod.yaml</IC>, <IC>values-staging.yaml</IC> for environments. Use <IC>--set</IC> only for one-off overrides (image tag in CI/CD). Commit the values files to git for auditability.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="repos" number="07" title="Helm Repos & Public Charts — Install Postgres in 10 Seconds">
        <P>
          You don&apos;t need to write charts for common software. Public repos host thousands of pre-made charts:
        </P>
        <CodeBlock
          title="helm repo add + install"
          output={`# add the bitnami repo (most popular public charts)
$ helm repo add bitnami https://charts.bitnami.com/bitnami
"bitnami" has been added to your repositories

# search for postgresql
$ helm search repo postgresql
NAME                       CHART VERSION  APP VERSION  DESCRIPTION
bitnami/postgresql         15.5.20        17.0.0       PostgreSQL database
bitnami/postgresql-ha      14.2.10        17.0.0       HA PostgreSQL with replication

# install postgres with one command (no YAML writing!)
$ helm install my-db bitnami/postgresql \\
  --set auth.postgresPassword=secret123

NAME: my-db
NAMESPACE: default
STATUS: deployed
NOTES:
PostgreSQL is now running!
To get the password: kubectl get secret my-db-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d

$ kubectl get pods
NAME                          READY   STATUS
my-db-postgresql-0            1/1     Running   ← StatefulSet created automatically

$ kubectl get pvc
NAME                   STATUS   VOLUME          CAPACITY
data-my-db-postgresql-0   Bound    pvc-abc123      8Gi   ← PVC created ✅

one command → full production-ready PostgreSQL with persistence 🎉`}
          code={`helm repo add bitnami https://charts.bitnami.com/bitnami
helm search repo postgresql
helm install my-db bitnami/postgresql --set auth.postgresPassword=secret123`}
        />
        <P>
          Popular public repos:
        </P>
        <Table
          head={["Repo", "URL", "What it has"]}
          rows={[
            ["bitnami", "https://charts.bitnami.com/bitnami", "databases (postgres, mysql, redis), nginx, kafka, wordpress"],
            ["prometheus-community", "https://prometheus-community.github.io/helm-charts", "Prometheus, Grafana, Alertmanager stack"],
            ["jetstack", "https://charts.jetstack.io", "cert-manager (Let's Encrypt SSL automation)"],
            ["ingress-nginx", "https://kubernetes.github.io/ingress-nginx", "NGINX Ingress Controller"],
            ["hashicorp", "https://helm.releases.hashicorp.com", "Vault, Consul"],
          ]}
        />
        <CodeBlock
          title="helm show values (see all config options)"
          output={`$ helm show values bitnami/postgresql | head -40
## @param auth.postgresPassword Password for the "postgres" user
auth:
  postgresPassword: ""
  username: ""
  password: ""
  database: ""

## @param primary.persistence.size PVC size
primary:
  persistence:
    enabled: true
    size: 8Gi
    storageClass: ""

## @param primary.resources.requests Resource requests
primary:
  resources:
    requests:
      cpu: 250m
      memory: 256Mi

# copy the values you want to override into your own values file`}
          code={`helm show values bitnami/postgresql | head -40`}
        />
        <Callout type="note">
          📌 <strong>Helmfile</strong> and <strong>umbrella charts</strong>: when you need to deploy 10 charts together (postgres + redis + app + monitoring), use Helmfile (declarative multi-chart manager) or an umbrella chart (chart with dependencies). Both solve &quot;how do I version a full stack?&quot;
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="debugging" number="08" title="Debugging Charts — helm template & --dry-run">
        <P>
          Template syntax errors break at render time. Here&apos;s how to debug:
        </P>
        <CodeBlock
          title="helm template (render locally, don't install)"
          output={`# render templates to stdout (no cluster needed)
$ helm template myapp ./mychart
---
# Source: mychart/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-app   ← rendered value
  labels:
    app: mychart
spec:
  replicas: 1   ← from values.yaml
  ...

use this to inspect what YAML will be generated before applying ✅`}
          code={`helm template myapp ./mychart`}
        />
        <CodeBlock
          title="helm install --dry-run (simulate install)"
          output={`$ helm install myapp ./mychart --dry-run
NAME: myapp
NAMESPACE: default
STATUS: pending-install
REVISION: 1
HOOKS:
MANIFEST:
---
# Source: mychart/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
...

(shows full rendered manifests + does NOT actually install) 🧪`}
          code={`helm install myapp ./mychart --dry-run`}
        />
        <CodeBlock
          title="helm lint (check for common errors)"
          output={`$ helm lint ./mychart
==> Linting ./mychart
[ERROR] templates/deployment.yaml: unable to parse YAML
  error converting YAML to JSON: yaml: line 12: did not find expected key

[WARNING] Chart.yaml: icon is recommended

1 chart(s) linted, 1 chart(s) failed ❌

fix the YAML error in deployment.yaml before installing`}
          code={`helm lint ./mychart`}
        />
        <P>
          Common template mistakes:
        </P>
        <CodeBlock
          title="common_mistakes.yaml"
          runnable={false}
          code={`❌ BAD: forgot to quote
  name: {{ .Values.name }}
  if .Values.name = "myapp-prod" → YAML breaks (- is special)
✅ GOOD:
  name: {{ .Values.name | quote }}   → name: "myapp-prod"

❌ BAD: wrong indentation
resources:
{{ toYaml .Values.resources }}   ← not indented, breaks YAML
✅ GOOD:
resources:
{{ toYaml .Values.resources | indent 2 }}

❌ BAD: accessing undefined value
replicas: {{ .Values.replicaCount }}
  if replicaCount not set → ERROR: nil pointer
✅ GOOD:
replicas: {{ .Values.replicaCount | default 1 }}

❌ BAD: Helm syntax inside {{ }} (it's Go templates, not Helm-specific)
  {{ helm.values.image.tag }}   ← wrong, no "helm." object
✅ GOOD:
  {{ .Values.image.tag }}`}
        />
        <Callout type="mistake">
          ⚠️ If <IC>helm upgrade</IC> fails mid-rollout (bad YAML), the release stays in <IC>pending-upgrade</IC> state. Fix the chart, then run <IC>helm upgrade</IC> again (it retries). Or <IC>helm rollback</IC> to last working revision.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Helm = ", "package manager (like apt) + templating engine (like Jinja)"],
            ["Chart", "package (dir with templates/ + values.yaml + Chart.yaml)"],
            ["Release", "installed instance of chart (myapp-prod = 1 release)"],
            ["Values precedence", "values.yaml → -f file → --set (highest priority)"],
            ["Template syntax", "{{ .Values.image.tag }} · {{ .Release.Name }} · {{ .Chart.Version }}"],
            ["Filters", "| quote | default 1 | indent 2 | toYaml"],
            ["helm install", "helm install <release> <chart> → creates revision 1"],
            ["helm upgrade", "helm upgrade <release> <chart> → increments revision, rolling update"],
            ["helm rollback", "helm rollback <release> <rev> → restores old manifests from history"],
            ["helm history", "shows all revisions (1, 2, 3…) with status"],
            ["helm uninstall", "deletes all resources created by chart (add --keep-history to preserve)"],
            ["helm template", "render locally (no install) — debug templates"],
            ["helm lint", "check for YAML/template errors before install"],
            ["Public repos", "bitnami, prometheus-community, jetstack — helm repo add <name> <url>"],
            ["Install postgres", "helm install db bitnami/postgresql --set auth.postgresPassword=secret"],
            ["Chart.yaml", "version=chart schema · appVersion=app being deployed (independent)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
