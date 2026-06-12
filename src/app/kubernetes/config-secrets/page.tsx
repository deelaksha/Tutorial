"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Config Injection — Live",
  nodes: [
    { id: "cm", icon: "📄", label: "ConfigMap", sub: "APP_ENV=prod", x: 10, y: 25, color: "#34d399" },
    { id: "secret", icon: "🔐", label: "Secret", sub: "DB_PASS (base64)", x: 10, y: 70, color: "#f87171" },
    { id: "api", icon: "🎯", label: "API Server", sub: "stores in etcd", x: 32, y: 48, color: "#a78bfa" },
    { id: "pod-env", icon: "📦", label: "Pod (env)", sub: "env vars injected", x: 60, y: 25, color: "#22d3ee" },
    { id: "pod-vol", icon: "📦", label: "Pod (volume)", sub: "files mounted", x: 60, y: 70, color: "#fbbf24" },
    { id: "app", icon: "⚙️", label: "App Process", sub: "reads config", x: 85, y: 48, color: "#fb923c" },
  ],
  edges: [
    { id: "cm-api", from: "cm", to: "api", color: "#34d399" },
    { id: "secret-api", from: "secret", to: "api", color: "#f87171" },
    { id: "api-env", from: "api", to: "pod-env", color: "#22d3ee" },
    { id: "api-vol", from: "api", to: "pod-vol", color: "#fbbf24" },
    { id: "env-app", from: "pod-env", to: "app", color: "#fb923c" },
    { id: "vol-app", from: "pod-vol", to: "app", dashed: true, color: "#60a5fa" },
  ],
  flows: [
    {
      id: "startup",
      name: "🚀 Pod starts, config injected",
      command: "kubectl apply -f deployment.yaml",
      steps: [
        { node: "cm", paths: ["cm-api"], text: "ConfigMap and Secret exist in etcd (created before pod). Pod spec references them: envFrom configMapRef, volumeMount secretName." },
        { node: "pod-env", paths: ["api-env", "env-app"], text: "Pod starts. Kubelet fetches ConfigMap data, injects as env vars (APP_ENV=prod, LOG_LEVEL=debug). Env frozen at pod start." },
        { node: "pod-vol", paths: ["api-vol", "vol-app"], text: "Secret mounted as volume at /etc/secrets/. Files: db-password (plaintext inside pod). App reads file. Both patterns work. ✅" },
      ],
    },
    {
      id: "update",
      name: "🔄 ConfigMap edited → who sees it?",
      command: "kubectl edit configmap app-config",
      steps: [
        { node: "cm", paths: ["cm-api"], text: "You edit ConfigMap: LOG_LEVEL=debug → info. Change saved to etcd. Now what?" },
        { node: "pod-env", paths: [], text: "Pod with ENV vars: STILL sees LOG_LEVEL=debug. Env vars are FROZEN at container start — no hot reload. Must restart pod to pick up change." },
        { node: "pod-vol", paths: ["api-vol", "vol-app"], text: "Pod with VOLUME mount: file /etc/config/LOG_LEVEL updated within ~60s (kubelet sync). App can re-read file → hot config reload (if app supports it). 🔄" },
      ],
    },
    {
      id: "rbac",
      name: "🔒 Secret RBAC: who can read?",
      command: "kubectl get secret db-password -o yaml",
      steps: [
        { node: "secret", paths: ["secret-api"], text: "Secrets stored in etcd (base64, NOT encrypted by default). Anyone with kubectl access can decode: echo <base64> | base64 -d." },
        { node: "api", paths: [], text: "RBAC controls access: Role allows 'get secrets' in namespace → user can read. Least privilege: pods get secrets via serviceAccount, users shouldn't." },
        { node: "secret", paths: [], text: "Real protection: etcd encryption-at-rest (--encryption-provider-config), RBAC, external-secrets (AWS Secrets Manager/Vault). Base64 is encoding, NOT encryption. 🔒" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Config Out of Images? (12-factor) ⭐" },
  { id: "configmap", label: "ConfigMap — Non-Sensitive Config" },
  { id: "creating-cm", label: "Creating ConfigMaps (literal/file/YAML)" },
  { id: "consuming", label: "Consuming: Env Vars vs Volume Files ⭐" },
  { id: "secrets", label: "Secrets — base64 is NOT Encryption! ⭐" },
  { id: "secret-types", label: "Secret Types (Opaque, TLS, dockerconfigjson)" },
  { id: "security", label: "Real Secret Security (RBAC + encryption)" },
  { id: "external-secrets", label: "External Secrets (Vault, AWS Secrets Manager)" },
  { id: "immutable", label: "Immutable ConfigMaps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sConfigSecretsPage() {
  return (
    <TopicShell
      icon="🔧"
      title="ConfigMaps & Secrets"
      gradientWord="Config"
      subtitle="12-factor config: same Docker image, dev to prod. ConfigMaps for non-sensitive data, Secrets for credentials. Env vars vs volume files (one freezes, one hot-updates). Base64 is NOT encryption (common mistake!), RBAC + etcd encryption for real protection, and external-secrets for production."
      nav={NAV}
      badges={["📄 ConfigMaps", "🔐 Secrets", "🔄 Env vs volume"]}
      next={{ icon: "💾", label: "Storage & StatefulSets", href: "/kubernetes/storage" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Config Out of Images? — The 12-Factor Way ⭐">
        <P>
          Hardcoding config (DB URLs, API keys, feature flags) inside Docker images is an anti-pattern. You&apos;d need separate images for dev/staging/prod. The 12-factor app rule: <strong>config in the environment, code in the image</strong>.
        </P>
        <CodeBlock
          title="config_in_images_bad.txt"
          runnable={false}
          code={`BAD: config baked into image
┌────────────────────────────────────────────────┐
│ Dockerfile                                     │
│   ENV DATABASE_URL=prod-db.example.com        │ ← hardcoded
│   ENV LOG_LEVEL=info                           │
│   COPY app.jar /app/                           │
└────────────────────────────────────────────────┘

problems:
✗ need 3 images: app:dev, app:staging, app:prod
✗ config change (new DB host) → rebuild image, redeploy
✗ secrets in image layers → leaked to registry
✗ can't promote the SAME artifact dev → prod
  (defeats the point of testing — you're deploying
   a DIFFERENT image in prod than you tested in staging)

GOOD: config injected at runtime (12-factor ✅)
┌────────────────────────────────────────────────┐
│ Dockerfile (SAME for all envs)                 │
│   COPY app.jar /app/                           │
│   # no ENV lines                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Kubernetes ConfigMap (per environment)         │
│   dev:     DATABASE_URL=dev-db:5432            │
│   staging: DATABASE_URL=staging-db:5432        │
│   prod:    DATABASE_URL=prod-db.prod:5432      │
└────────────────────────────────────────────────┘

benefits:
✅ ONE image: app:v1.2.3 (tested in staging, promoted to prod)
✅ config change: edit ConfigMap, rolling-restart pods (no rebuild)
✅ secrets stay out of image layers
✅ separation of concerns: devs build images, ops configure envs`}
        />
        <Callout type="analogy">
          📦 An app image is like a shipping container of furniture. The furniture (code) is the same whether it&apos;s delivered to an apartment (dev) or a mansion (prod). The ADDRESS (config) is written on a label OUTSIDE the container, not carved into the furniture.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="configmap" number="02" title="ConfigMap — Non-Sensitive Config">
        <P>
          A <IC>ConfigMap</IC> stores key-value pairs (or files) that pods can consume as environment variables or volume files. Use for non-secret config: feature flags, URLs, log levels.
        </P>
        <CodeBlock
          title="configmap.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # key-value pairs (strings)
  APP_ENV: production
  LOG_LEVEL: info
  API_URL: https://api.example.com
  # you can also store files (multi-line values)
  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://backend;
      }
    }`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f configmap.yaml
kubectl get configmap app-config`}
          output={`configmap/app-config created

NAME         DATA   AGE
app-config   4      5s`}
        />
        <CodeBlock
          title="terminal (view the data)"
          code={`kubectl describe configmap app-config`}
          output={`Name:         app-config
Namespace:    default
Data
====
APP_ENV:
----
production
LOG_LEVEL:
----
info
API_URL:
----
https://api.example.com
nginx.conf:
----
server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}`}
        />
      </Section>

      {/* 03 */}
      <Section id="creating-cm" number="03" title="Creating ConfigMaps — 3 Ways">
        <P>You can create ConfigMaps from literals, files, or YAML:</P>
        <Table
          head={["Method", "Command", "Use case"]}
          rows={[
            [
              <IC key="1">From literal values</IC>,
              <IC key="1b">kubectl create configmap app-config --from-literal=APP_ENV=prod --from-literal=LOG_LEVEL=info</IC>,
              "Quick one-liners (dev/test)",
            ],
            [
              <IC key="2">From file(s)</IC>,
              <IC key="2b">kubectl create configmap nginx-config --from-file=nginx.conf</IC>,
              "Import existing config files (nginx.conf, app.properties)",
            ],
            [
              <IC key="3">From directory</IC>,
              <IC key="3b">kubectl create configmap configs --from-file=./config-dir/</IC>,
              "Bulk import all files in a dir",
            ],
            [
              <IC key="4">From YAML manifest</IC>,
              <IC key="4b">kubectl apply -f configmap.yaml</IC>,
              "Version-controlled, GitOps-friendly (production)",
            ],
          ]}
        />
        <CodeBlock
          title="terminal (from file example)"
          code={`echo "LOG_LEVEL=debug" > app.env
kubectl create configmap app-config --from-file=app.env
kubectl get configmap app-config -o yaml`}
          output={`apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.env: |
    LOG_LEVEL=debug`}
        />
      </Section>

      {/* 04 */}
      <Section id="consuming" number="04" title="Consuming ConfigMaps — Env Vars vs Volume Files ⭐">
        <P>
          Pods can consume ConfigMap data in TWO ways: as <IC>environment variables</IC> (frozen at start) or as <IC>volume files</IC> (can hot-update). This is a critical difference.
        </P>
        <CodeBlock
          title="env_vars_vs_volumes.txt"
          runnable={false}
          code={`METHOD 1: ENVIRONMENT VARIABLES
┌────────────────────────────────────────────────┐
│ pod starts → kubelet reads ConfigMap           │
│            → sets env vars (APP_ENV=prod)      │
│            → container process starts          │
│                                                │
│ ✅ simple: app reads os.getenv("APP_ENV")      │
│ ✅ works for any app (no file I/O)             │
│ ❌ FROZEN: edit ConfigMap → env unchanged      │
│            until pod RESTARTS                  │
└────────────────────────────────────────────────┘

METHOD 2: VOLUME FILES
┌────────────────────────────────────────────────┐
│ pod starts → kubelet mounts ConfigMap as files │
│              at /etc/config/APP_ENV (contains  │
│              "prod"), /etc/config/LOG_LEVEL    │
│                                                │
│ ✅ hot reload: edit ConfigMap → files update   │
│    within ~60s (kubelet sync period)           │
│    app can re-read file (if coded to do so)    │
│ ✅ supports binary data (files, certs)         │
│ ❌ app must read files (more code)             │
└────────────────────────────────────────────────┘

WHEN TO USE WHICH:
env vars:   config that DOESN'T change often (URLs, env name)
            OR app doesn't support hot reload
volumes:    config that DOES change (feature flags, tuning params)
            AND app re-reads files (or you restart it manually)`}
        />
        <CodeBlock
          title="pod-with-configmap-env.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: app-env
spec:
  containers:
  - name: app
    image: my-app:1.0
    envFrom:                 # inject ALL keys from ConfigMap as env vars
    - configMapRef:
        name: app-config
    # OR individual keys:
    env:
    - name: APP_ENV          # env var name in container
      valueFrom:
        configMapKeyRef:
          name: app-config   # ConfigMap name
          key: APP_ENV       # key in ConfigMap`}
        />
        <CodeBlock
          title="pod-with-configmap-volume.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: app-vol
spec:
  containers:
  - name: app
    image: my-app:1.0
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config      # files appear here
      # /etc/config/APP_ENV (contains "production")
      # /etc/config/LOG_LEVEL (contains "info")
  volumes:
  - name: config-volume
    configMap:
      name: app-config`}
        />
        <CodeBlock
          title="terminal (test hot reload)"
          code={`# create pod with volume mount
kubectl apply -f pod-with-configmap-volume.yaml
kubectl exec app-vol -- cat /etc/config/LOG_LEVEL`}
          output={`info`}
        />
        <CodeBlock
          title="terminal"
          code={`# edit ConfigMap: LOG_LEVEL info → debug
kubectl edit configmap app-config
# wait ~60 seconds
kubectl exec app-vol -- cat /etc/config/LOG_LEVEL`}
          output={`debug   ← file updated! (env var would still be "info")`}
        />
        <Callout type="tip">
          💡 For nginx/Apache/HAProxy config files, use volume mounts + a sidecar that watches the file and reloads the server (or SIGHUP). This enables zero-downtime config changes without pod restarts.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="secrets" number="05" title="Secrets — base64 is NOT Encryption! ⭐">
        <P>
          <IC>Secrets</IC> are like ConfigMaps, but for sensitive data (passwords, API keys, certs). Kubernetes stores them base64-encoded (NOT encrypted by default). This is a huge gotcha.
        </P>
        <CodeBlock
          title="secret.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque              # generic key-value (most common type)
data:
  username: YWRtaW4=      # base64("admin")
  password: cGFzczEyMzQ=  # base64("pass1234")`}
        />
        <CodeBlock
          title="terminal (create from literal — auto-encodes)"
          code={`kubectl create secret generic db-secret \\
  --from-literal=username=admin \\
  --from-literal=password=pass1234`}
          output={`secret/db-secret created`}
        />
        <CodeBlock
          title="terminal (view the secret)"
          code={`kubectl get secret db-secret -o yaml`}
          output={`apiVersion: v1
data:
  username: YWRtaW4=
  password: cGFzczEyMzQ=
kind: Secret
type: Opaque`}
        />
        <CodeBlock
          title="terminal (decode — ANYONE with kubectl can do this!)"
          code={`echo "cGFzczEyMzQ=" | base64 -d`}
          output={`pass1234`}
        />
        <Callout type="mistake">
          ⚠️ CRITICAL MISTAKE: thinking Secrets are encrypted because they&apos;re base64. Base64 is ENCODING (reversible, no key needed). Anyone with <IC>kubectl get secret</IC> permission can decode. Real encryption requires etcd encryption-at-rest + RBAC (next section).
        </Callout>
        <CodeBlock
          title="base64_is_not_encryption.txt"
          runnable={false}
          code={`BASE64 ENCODING (what Kubernetes does by default)
┌────────────────────────────────────────────────┐
│ plaintext: "password123"                       │
│      ↓ base64 encode (no key needed)           │
│ encoded: "cGFzc3dvcmQxMjM="                    │
│      ↓ base64 decode (no key needed)           │
│ plaintext: "password123"                       │
│                                                │
│ ANYONE can decode — it's not secret!           │
└────────────────────────────────────────────────┘

WHY base64?
• handles binary data (certs, keys) in YAML (which is text-only)
• NOT for security (obfuscation at best)

REAL ENCRYPTION (what you need for production)
┌────────────────────────────────────────────────┐
│ plaintext: "password123"                       │
│      ↓ encrypt with AES key (kube-apiserver   │
│        --encryption-provider-config)           │
│ ciphertext: "k8s:enc:aescbc:v1:key1:Xa92..." │
│      ↓ decrypt (needs the key from KMS/Vault)  │
│ plaintext: "password123"                       │
│                                                │
│ stored encrypted in etcd ✅                    │
│ only API server (with key) can decrypt         │
└────────────────────────────────────────────────┘`}
        />
      </Section>

      {/* 06 */}
      <Section id="secret-types" number="06" title="Secret Types">
        <P>
          Secrets have a <IC>type</IC> field that helps Kubernetes validate the structure:
        </P>
        <Table
          head={["Type", "Keys expected", "Use case"]}
          rows={[
            [<IC key="1">Opaque</IC>, "Any keys (generic)", "DB passwords, API keys (default type)"],
            [
              <IC key="2">kubernetes.io/tls</IC>,
              <IC key="2b">tls.crt, tls.key</IC>,
              "TLS certs for Ingress",
            ],
            [
              <IC key="3">kubernetes.io/dockerconfigjson</IC>,
              <IC key="3b">.dockerconfigjson</IC>,
              "Private registry credentials (imagePullSecrets)",
            ],
            [
              <IC key="4">kubernetes.io/basic-auth</IC>,
              <IC key="4b">username, password</IC>,
              "HTTP basic auth (rarely used)",
            ],
            [
              <IC key="5">kubernetes.io/ssh-auth</IC>,
              <IC key="5b">ssh-privatekey</IC>,
              "SSH keys (rarely used)",
            ],
          ]}
        />
        <CodeBlock
          title="terminal (TLS secret for Ingress)"
          code={`kubectl create secret tls my-tls-secret \\
  --cert=tls.crt \\
  --key=tls.key`}
          output={`secret/my-tls-secret created`}
        />
        <CodeBlock
          title="terminal (Docker registry secret)"
          code={`kubectl create secret docker-registry regcred \\
  --docker-server=https://index.docker.io/v1/ \\
  --docker-username=myuser \\
  --docker-password=mypass \\
  --docker-email=me@example.com`}
          output={`secret/regcred created`}
        />
        <CodeBlock
          title="pod-with-private-image.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: private-app
spec:
  imagePullSecrets:          # use Secret for registry auth
  - name: regcred
  containers:
  - name: app
    image: myregistry.com/private-app:1.0`}
        />
      </Section>

      {/* 07 */}
      <Section id="security" number="07" title="Real Secret Security — RBAC + Encryption">
        <P>
          To actually protect Secrets in production:
        </P>
        <CodeBlock
          title="secret_security_layers.txt"
          runnable={false}
          code={`LAYER 1: RBAC (who can read Secrets?)
┌────────────────────────────────────────────────┐
│ create Role that DENIES "get secrets" for     │
│ regular users — only pods' ServiceAccounts     │
│ can read (via pod spec)                        │
│                                                │
│ kubectl create role no-secrets \\              │
│   --verb=get,list \\                           │
│   --resource=pods,services (NOT secrets)      │
└────────────────────────────────────────────────┘

LAYER 2: ETCD ENCRYPTION AT REST
┌────────────────────────────────────────────────┐
│ by default: Secrets stored PLAINTEXT in etcd  │
│ (base64 is for transport, not storage)        │
│                                                │
│ enable encryption:                             │
│   kube-apiserver \\                            │
│     --encryption-provider-config=config.yaml  │
│                                                │
│ config.yaml:                                   │
│   providers:                                   │
│   - aescbc:                                    │
│       keys:                                    │
│       - name: key1                             │
│         secret: <32-byte-key>  ← rotate this!  │
│   - identity: {}  (fallback: no encryption)    │
│                                                │
│ NOW: Secrets encrypted in etcd ✅              │
│ (cloud providers: EKS/GKE/AKS do this by       │
│  default with their KMS)                       │
└────────────────────────────────────────────────┘

LAYER 3: AUDIT LOGS
┌────────────────────────────────────────────────┐
│ enable audit logging to track:                │
│ • who read which Secrets (kubectl get secret)  │
│ • when Secrets were created/modified           │
│                                                │
│ kube-apiserver --audit-log-path=/var/log/audit│
└────────────────────────────────────────────────┘

defense in depth: RBAC (access) + encryption (storage)
                  + audit (detection)`}
        />
        <Callout type="tip">
          💡 On managed Kubernetes (EKS, GKE, AKS), etcd encryption-at-rest is enabled by default using cloud KMS (AWS KMS, GCP KMS, Azure Key Vault). On self-hosted clusters, you must configure it manually.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="external-secrets" number="08" title="External Secrets — Vault, AWS Secrets Manager">
        <P>
          Best practice: don&apos;t store secrets in Kubernetes at all. Use external secret managers (Vault, AWS Secrets Manager, GCP Secret Manager), sync to K8s Secrets on-demand.
        </P>
        <CodeBlock
          title="external_secrets_pattern.txt"
          runnable={false}
          code={`PROBLEM: Secrets in Git (GitOps)
┌────────────────────────────────────────────────┐
│ git repo/                                      │
│   deployment.yaml                              │
│   secret.yaml ← base64 password in Git 😱     │
│                 (even private repos are risky) │
└────────────────────────────────────────────────┘

SOLUTION: External Secrets Operator
┌────────────────────────────────────────────────┐
│ AWS Secrets Manager (or Vault/GCP)            │
│   /prod/db-password: "real-secret-here"        │
│          ▲                                     │
│          │ (synced every 60s)                  │
│          ▼                                     │
│ ExternalSecret (K8s custom resource)          │
│   secretStoreRef: aws-secrets                  │
│   data:                                        │
│   - secretKey: password                        │
│     remoteRef:                                 │
│       key: /prod/db-password                   │
│          ▼                                     │
│ K8s Secret (auto-created/updated)              │
│   name: db-secret                              │
│   data:                                        │
│     password: <fetched-from-aws>               │
└────────────────────────────────────────────────┘

tools:
• External Secrets Operator (supports AWS/GCP/Azure/Vault)
• Sealed Secrets (encrypt Secrets for Git, decrypt in-cluster)
• Vault Agent Injector (Vault sidecar injects secrets as files)

Git stores: ExternalSecret YAML (pointer to Vault/AWS)
Vault stores: the actual secret
K8s: syncs it automatically, never checks secret into Git ✅`}
        />
        <Callout type="note">
          📝 For production: use External Secrets Operator + cloud secret manager. For learning/dev: native K8s Secrets are fine (just understand their limits).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="immutable" number="09" title="Immutable ConfigMaps & Secrets">
        <P>
          Set <IC>immutable: true</IC> to prevent accidental edits (and gain performance — kubelet doesn&apos;t watch for changes).
        </P>
        <CodeBlock
          title="immutable-configmap.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-v1
immutable: true           # cannot be edited after creation
data:
  APP_ENV: production
  VERSION: v1.2.3`}
        />
        <CodeBlock
          title="terminal"
          code={`kubectl apply -f immutable-configmap.yaml
kubectl edit configmap app-config-v1`}
          output={`Error: configmaps "app-config-v1" is immutable`}
        />
        <P>
          Use case: release-specific config (app-config-v1, app-config-v2). Pods pin to a version. To change config → create new ConfigMap, update Deployment to reference it → rolling update. Immutability prevents in-place edits that could cause inconsistent state across pods.
        </P>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["12-factor config", "config in environment, code in image (one image, many envs)"],
            ["ConfigMap", "non-sensitive key-value or files (URLs, log levels, nginx.conf)"],
            ["Secret", "sensitive data (passwords, certs) — base64 encoded, NOT encrypted by default"],
            ["Create ConfigMap", "kubectl create cm NAME --from-literal / --from-file / YAML"],
            ["Env vars", "inject with envFrom configMapRef — FROZEN at pod start, no hot reload"],
            ["Volume files", "mount with volumes configMap — files update in ~60s (hot reload possible)"],
            ["base64 != encryption", "anyone with kubectl can decode — need etcd encryption + RBAC"],
            ["Secret types", "Opaque (generic), tls (certs), dockerconfigjson (registry auth)"],
            ["etcd encryption", "kube-apiserver --encryption-provider-config (cloud: enabled by default)"],
            ["External secrets", "store in Vault/AWS Secrets Manager, sync to K8s (never check into Git)"],
            ["Immutable", "immutable: true prevents edits (version config, rollout to change)"],
            ["RBAC secrets", "deny 'get secrets' for users, allow only pod ServiceAccounts"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
