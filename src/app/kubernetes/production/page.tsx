"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "GitOps Loop — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "Developer", sub: "git push", x: 8, y: 40, color: "#22d3ee" },
    { id: "git", icon: "📦", label: "Git Repo", sub: "single source of truth", x: 28, y: 40, color: "#a78bfa" },
    { id: "argocd", icon: "🔄", label: "Argo CD", sub: "watches repo", x: 50, y: 20, color: "#60a5fa" },
    { id: "cluster", icon: "☸️", label: "K8s Cluster", sub: "live state", x: 72, y: 40, color: "#34d399" },
    { id: "app", icon: "🚀", label: "App", sub: "running pods", x: 90, y: 40, color: "#fbbf24" },
    { id: "drift", icon: "⚠️", label: "Drift Detection", sub: "manual change", x: 50, y: 65, color: "#f87171" },
  ],
  edges: [
    { id: "dev-git", from: "dev", to: "git", color: "#a78bfa" },
    { id: "git-argocd", from: "git", to: "argocd", color: "#60a5fa" },
    { id: "argocd-cluster", from: "argocd", to: "cluster", color: "#34d399" },
    { id: "cluster-app", from: "cluster", to: "app", color: "#fbbf24" },
    { id: "cluster-drift", from: "cluster", to: "drift", color: "#f87171" },
    { id: "drift-argocd", from: "drift", to: "argocd", bend: 30, dashed: true, color: "#f87171" },
    { id: "argocd-fix", from: "argocd", to: "cluster", bend: -40, dashed: true, color: "#fb923c" },
  ],
  flows: [
    {
      id: "deploy",
      name: "🚀 Merge → auto-deploy",
      command: "git push → Argo syncs new version",
      steps: [
        { node: "git", paths: ["dev-git"], text: "Developer merges PR: image tag v1.2.3 → v1.2.4 in deployment.yaml. Pushed to main branch." },
        { node: "argocd", paths: ["git-argocd"], text: "Argo CD polls repo every 3 min (or webhook instant). Detects drift: desired=v1.2.4, live=v1.2.3. 🔍" },
        { node: "cluster", paths: ["argocd-cluster", "cluster-app"], text: "Argo applies the diff: kubectl apply deployment.yaml. Rolling update v1.2.3→v1.2.4. Declarative sync. ✅" },
      ],
    },
    {
      id: "drift",
      name: "⚠️ Manual hack → reverted",
      command: "kubectl edit → Argo detects drift → auto-corrects",
      steps: [
        { node: "drift", paths: ["cluster-drift"], text: "SRE runs 'kubectl edit deployment' in prod, changes replicas 5→10 (manual hotfix, not in git). 🔧" },
        { node: "argocd", paths: ["drift-argocd"], text: "Argo compares: git says replicas=5, cluster has 10. Drift detected. OutOfSync status. ⚠️" },
        { node: "cluster", paths: ["argocd-fix"], text: "Auto-sync enabled → Argo reverts to 5 replicas (git wins). Manual change erased. Git = single source of truth. 🔁" },
      ],
    },
    {
      id: "rollback",
      name: "⏪ Bad release → git revert",
      command: "v1.2.4 crashes → git revert → instant rollback",
      steps: [
        { node: "app", paths: [], text: "v1.2.4 deployed but crashes (CrashLoopBackOff). Production down. 🔴" },
        { node: "git", paths: ["dev-git", "git-argocd"], text: "Developer runs 'git revert HEAD' → reverts deployment.yaml to v1.2.3. Pushes to main." },
        { node: "cluster", paths: ["argocd-cluster", "cluster-app"], text: "Argo syncs within seconds. Rollback v1.2.4→v1.2.3. Pods restart with old image. Production restored. ⏪✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "observability", label: "Observability Stack ⭐" },
  { id: "troubleshooting", label: "Troubleshooting Flowchart ⭐" },
  { id: "gitops", label: "GitOps — The Declarative Way ⭐" },
  { id: "gitops-vs-ci", label: "GitOps vs Push CI/CD" },
  { id: "argocd", label: "Argo CD in Practice" },
  { id: "managed-k8s", label: "Managed K8s Comparison" },
  { id: "capstone", label: "Capstone: Deploy the Go API ⭐" },
  { id: "checklist", label: "Production Readiness Checklist" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sProductionPage() {
  return (
    <TopicShell
      icon="🚀"
      title="Kubernetes Production & GitOps — Capstone"
      gradientWord="Production"
      subtitle="You've learned the pieces — this is how they fit together in production. Observability stack (logs, metrics, traces), the troubleshooting flowchart (Pending? ImagePullBackOff? CrashLoop?), GitOps with Argo CD (git as single source of truth, drift auto-corrected), managed K8s comparison (EKS/GKE/AKS), and the capstone: deploying the Go REST API from the /golang course with Deployment+Service+Ingress+HPA. The production checklist that separates hobbyist clusters from the real thing."
      nav={NAV}
      badges={["📊 Observability", "🔍 Troubleshooting", "🔄 GitOps"]}
      next={{ icon: "☁️", label: "AWS course", href: "/aws" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="observability" number="01" title="Observability Stack — Logs, Metrics, Traces ⭐">
        <P>
          Production Kubernetes needs <strong>three pillars of observability</strong>:
        </P>
        <CodeBlock
          title="observability_three_pillars.txt"
          runnable={false}
          code={`1. LOGS (what happened — debug failures)
   pod stdout/stderr → log agent → storage → search UI
   ┌─────────────────────────────────────────────────────┐
   │ pod: app                                            │
   │   container logs to stdout: "ERROR: db timeout"     │
   └────────────┬────────────────────────────────────────┘
                │ kubelet captures
                ▼
   ┌─────────────────────────────────────────────────────┐
   │ log agent (Fluent Bit, Fluentd, Promtail)           │
   │   reads /var/log/pods/*, ships to backend           │
   └────────────┬────────────────────────────────────────┘
                │ sends
                ▼
   ┌─────────────────────────────────────────────────────┐
   │ storage (Loki, Elasticsearch, CloudWatch Logs)      │
   │   indexed, searchable by pod/namespace/time         │
   └────────────┬────────────────────────────────────────┘
                │ query
                ▼
   ┌─────────────────────────────────────────────────────┐
   │ UI (Grafana, Kibana, CloudWatch Insights)           │
   │   search: "ERROR" in namespace=prod last 1h         │
   └─────────────────────────────────────────────────────┘

2. METRICS (how much — dashboards, alerts)
   Prometheus scrapes /metrics → stores → Grafana visualizes
   ┌─────────────────────────────────────────────────────┐
   │ pod: api                                            │
   │   exposes /metrics endpoint (Prometheus format)     │
   │   http_requests_total{status="200"} 12345           │
   └────────────┬────────────────────────────────────────┘
                │ scrape every 15s
                ▼
   ┌─────────────────────────────────────────────────────┐
   │ Prometheus (time-series DB)                         │
   │   stores metrics + labels, retention 15-30 days     │
   │   PromQL: rate(http_requests_total[5m])             │
   └────────────┬────────────────────────────────────────┘
                │ query
                ▼
   ┌─────────────────────────────────────────────────────┐
   │ Grafana dashboards                                  │
   │   charts: CPU/mem, request rate, error rate         │
   │   alerts: if error_rate > 5% → page SRE             │
   └─────────────────────────────────────────────────────┘

3. TRACES (where time was spent — debug latency)
   OpenTelemetry → Jaeger/Tempo → trace spans
   request → frontend (50ms) → api (200ms) → db (150ms)
   total latency: 400ms — trace shows db was the bottleneck`}
        />
        <Callout type="analogy">
          🔍 <strong>Debugging analogy</strong>: Logs = detailed narrative (&quot;what happened step-by-step&quot;). Metrics = vital signs (heart rate, blood pressure — is the patient healthy?). Traces = X-ray (where exactly is the blockage in the request path?).
        </Callout>
        <P>
          Standard production stack (open-source):
        </P>
        <Table
          head={["Pillar", "Tool", "Install via"]}
          rows={[
            ["Logs", "Loki + Promtail", <IC key="1">helm install loki grafana/loki-stack</IC>],
            ["Metrics", "Prometheus + Grafana", <IC key="2">helm install prom prometheus-community/kube-prometheus-stack</IC>],
            ["Traces", "Tempo / Jaeger", <IC key="3">helm install tempo grafana/tempo</IC>],
          ]}
        />
        <CodeBlock
          title="kubectl logs (basic log access)"
          output={`# view logs of a pod
$ kubectl logs api-7f8d9c-abc12
2026-06-12T10:15:32Z INFO  server listening on :8080
2026-06-12T10:16:45Z ERROR database timeout after 5s

# follow logs (tail -f)
$ kubectl logs -f api-7f8d9c-abc12

# logs from previous crashed container (debug CrashLoopBackOff)
$ kubectl logs api-7f8d9c-abc12 --previous
panic: nil pointer dereference   ← found the crash cause!

# logs from all replicas (deployment)
$ kubectl logs -l app=api --tail=50`}
          code={`kubectl logs api-7f8d9c-abc12
kubectl logs -f api-7f8d9c-abc12
kubectl logs api-7f8d9c-abc12 --previous`}
        />
      </Section>

      {/* 02 */}
      <Section id="troubleshooting" number="02" title="Troubleshooting Flowchart — The Decision Tree ⭐">
        <P>
          When a pod breaks, follow this flowchart:
        </P>
        <CodeBlock
          title="troubleshooting_flowchart.txt"
          runnable={false}
          code={`kubectl get pods → see STATUS

STATUS: Pending
  ├─ kubectl describe pod <name>
  │  Events: "0/3 nodes available: insufficient cpu"
  │  → FIX: add nodes (Cluster Autoscaler) or lower requests
  │
  │  Events: "0/3 nodes available: node(s) had taints"
  │  → FIX: add toleration or remove taint
  │
  │  Events: "pod has unbound PVC"
  │  → FIX: create PV or check StorageClass provisioner

STATUS: ImagePullBackOff / ErrImagePull
  ├─ kubectl describe pod <name>
  │  Events: "Failed to pull image: unauthorized"
  │  → FIX: check image name, create imagePullSecret for private registry
  │
  │  Events: "manifest not found" or "image not found"
  │  → FIX: typo in image tag or image doesn't exist

STATUS: CrashLoopBackOff
  ├─ kubectl logs <pod> --previous   ← logs from crashed container
  │  panic / segfault / exit code → FIX: app bug, fix code
  │
  │  "connection refused: db:5432" → FIX: db not ready, add readinessProbe
  │
  │  "permission denied" → FIX: securityContext runAsUser conflict
  │
  ├─ kubectl describe pod <name>
  │  Last State: Terminated (exit code 1)
  │  Liveness probe failed → FIX: tune probe (initialDelaySeconds too low)

STATUS: Running but not Ready (0/1)
  ├─ kubectl describe pod <name>
  │  Readiness probe failed (timeout / 503)
  │  → FIX: app slow to start (increase initialDelaySeconds)
  │       or app broken (check logs)

STATUS: Running and Ready but no traffic
  ├─ kubectl get svc → check Service
  │  kubectl get endpoints <svc> → should list pod IPs
  │  empty endpoints? → selector mismatch (svc selector ≠ pod labels)
  │
  ├─ kubectl describe ingress
  │  backend: <none> → Ingress controller not installed
  │  503 errors → Service name typo in Ingress spec

STATUS: Error / Unknown
  ├─ node died → pod status stale
  │  → kubectl get nodes (check node NotReady)
  │  → drain node, delete pod (reschedule elsewhere)

GENERIC DEBUG COMMANDS
  kubectl describe pod <name>     ← Events section is gold
  kubectl logs <pod> --previous   ← crashed container logs
  kubectl exec -it <pod> -- sh    ← shell into running container
  kubectl get events --sort-by=.metadata.creationTimestamp
  kubectl top pod <name>          ← check CPU/mem (OOMKilled?)`}
        />
        <Callout type="tip">
          💡 <strong>80% of issues</strong> show up in <IC>kubectl describe pod</IC> Events section. Always check Events first — it tells you exactly what the kubelet/scheduler tried and why it failed.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="gitops" number="03" title="GitOps — Git as Single Source of Truth ⭐">
        <P>
          <strong>GitOps</strong> is a deployment model where the <em>git repository</em> is the single source of truth for infrastructure and app state. Instead of running <IC>kubectl apply</IC> from CI/CD, a GitOps operator watches the repo and syncs the cluster to match it.
        </P>
        <CodeBlock
          title="gitops_principles.txt"
          runnable={false}
          code={`FOUR GITOPS PRINCIPLES
1. DECLARATIVE
   Entire system state described declaratively in git (YAML manifests,
   Helm charts, Kustomize, Terraform). No imperative scripts.

2. VERSIONED AND IMMUTABLE
   Git commits = audit trail. Every change is a commit. Rollback = git revert.

3. PULLED AUTOMATICALLY
   Operator (Argo CD, Flux) runs IN the cluster, pulls from git,
   applies changes. No external push from CI (firewalls stay closed).

4. CONTINUOUSLY RECONCILED
   Operator detects drift (manual kubectl changes) and auto-corrects
   to match git. Git always wins. Self-healing.

FLOW
┌─────────────────────────────────────────────────────────────┐
│ 1. Developer: edit deployment.yaml, git commit + push       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Git repo (GitHub/GitLab): main branch updated            │
└────────────┬────────────────────────────────────────────────┘
             │ Argo CD polls every 3min (or webhook)
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Argo CD: compares git state vs cluster state             │
│    git: image=v2.0, replicas=5                              │
│    cluster: image=v1.9, replicas=5                          │
│    → OutOfSync detected                                     │
└────────────┬────────────────────────────────────────────────┘
             │ auto-sync enabled
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Argo CD: kubectl apply the diff → rolling update         │
│    cluster now matches git ✅                               │
└─────────────────────────────────────────────────────────────┘

benefits:
  ✅ audit trail (git blame shows who changed replicas and when)
  ✅ easy rollback (git revert = instant cluster rollback)
  ✅ self-healing (manual hacks auto-reverted)
  ✅ multi-cluster (one git repo → many clusters)
  ✅ security (no kubectl credentials in CI/CD, operator pulls)`}
        />
      </Section>

      {/* 04 */}
      <Section id="gitops-vs-ci" number="04" title="GitOps vs Push CI/CD — The Key Difference">
        <Table
          head={["Aspect", "Push CI/CD (traditional)", "GitOps (pull)"]}
          rows={[
            ["Who deploys?", "CI/CD pipeline (Jenkins, GitHub Actions) runs kubectl", "Operator in cluster (Argo CD, Flux) pulls from git"],
            ["Credentials", "CI needs kubeconfig with admin access (⚠️ credential leak risk)", "Operator already in cluster (no external creds needed) ✅"],
            ["Drift handling", "manual kubectl change persists until next deploy", "auto-corrected within minutes (git always wins)"],
            ["Rollback", "re-run pipeline with old version", "git revert (instant, no pipeline re-run)"],
            ["Audit", "CI logs (may be lost)", "git history (permanent, immutable)"],
            ["Multi-cluster", "CI must connect to N clusters (N×credentials)", "N operators pull from same repo (one source of truth)"],
            ["Failure mode", "pipeline fails → no deploy → stale cluster", "operator retries automatically (reconcile loop)"],
          ]}
        />
        <Callout type="behind">
          🔧 <strong>Best practice combo</strong>: CI/CD builds the Docker image and pushes to registry. GitOps deploys it. CI updates the git repo with the new image tag (git commit) → Argo sees the change → rolling update. CI builds, GitOps deploys. Separation of concerns. ✅
        </Callout>
        <CodeBlock
          title="cicd_plus_gitops.txt"
          runnable={false}
          code={`WORKFLOW: CI builds image, updates git → GitOps deploys

1. Developer: git push app code
2. GitHub Actions (CI):
     - docker build -t myapp:v1.2.4
     - docker push myapp:v1.2.4
     - update k8s/deployment.yaml: image: myapp:v1.2.4
     - git commit + push to infra repo   ← CI writes to git
3. Argo CD (GitOps):
     - detects change in infra repo
     - kubectl apply deployment.yaml
     - rolling update to v1.2.4 ✅

CI = build artifact (immutable image)
GitOps = deploy artifact (declarative sync)
git = glue (image tag written by CI, read by GitOps)`}
        />
      </Section>

      {/* 05 */}
      <Section id="argocd" number="05" title="Argo CD in Practice — Setup & Sync">
        <CodeBlock
          title="install_argocd.sh"
          output={`# 1. install Argo CD
$ kubectl create namespace argocd
$ kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. wait for pods
$ kubectl get pods -n argocd
NAME                                  READY   STATUS
argocd-server-xyz                     1/1     Running
argocd-repo-server-abc                1/1     Running
argocd-application-controller-def     1/1     Running   ← the reconciler

# 3. access UI (port-forward or Ingress)
$ kubectl port-forward svc/argocd-server -n argocd 8080:443
Forwarding from 127.0.0.1:8080 -> 8080

# 4. get initial password
$ kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d
xyz123abc   ← login as "admin" with this password

# 5. open https://localhost:8080, login, create first app ✅`}
          code={`kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`}
        />
        <CodeBlock
          title="argocd_application.yaml"
          runnable={false}
          code={`# define an Argo CD Application (CRD)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests
    targetRevision: main   # branch
    path: apps/myapp       # subdirectory with YAML files
  destination:
    server: https://kubernetes.default.svc   # deploy to same cluster
    namespace: production
  syncPolicy:
    automated:
      prune: true       # delete resources removed from git
      selfHeal: true    # auto-correct drift (manual kubectl changes)
    syncOptions:
    - CreateNamespace=true`}
        />
        <CodeBlock
          title="kubectl apply argocd application"
          output={`$ kubectl apply -f argocd_application.yaml
application.argoproj.io/myapp created

# Argo CD starts syncing
$ kubectl get applications -n argocd
NAME    SYNC STATUS   HEALTH STATUS
myapp   Synced        Healthy   ← cluster matches git ✅

# view in UI: https://localhost:8080/applications/myapp
  shows: git commit SHA, sync time, resource tree (Deployment→ReplicaSet→Pods)

# make a change in git:
  edit apps/myapp/deployment.yaml: replicas 3 → 5
  git commit + push

# Argo detects within 3min (or instant with webhook)
$ kubectl get applications -n argocd
NAME    SYNC STATUS   HEALTH STATUS
myapp   OutOfSync     Healthy   ← drift detected

# auto-sync triggers (syncPolicy.automated)
$ kubectl get applications -n argocd
NAME    SYNC STATUS   HEALTH STATUS
myapp   Synced        Healthy   ← synced to replicas=5 ✅`}
          code={`kubectl apply -f argocd_application.yaml
kubectl get applications -n argocd`}
        />
        <Callout type="tip">
          💡 Enable <IC>selfHeal: true</IC> in production. This auto-reverts manual <IC>kubectl</IC> changes within minutes. If someone runs <IC>kubectl scale</IC> as a hotfix, Argo will revert it — forcing them to make the change in git (proper audit trail).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="managed-k8s" number="06" title="Managed Kubernetes — EKS / GKE / AKS Comparison">
        <P>
          Running your own K8s control plane (kubeadm, kops) is hard. Managed services handle control-plane upgrades, etcd backups, HA for you.
        </P>
        <Table
          head={["Feature", "AWS EKS", "Google GKE", "Azure AKS"]}
          rows={[
            ["Control plane cost", "$0.10/hr per cluster (~$73/mo)", "free (standard) / $0.10/hr (Autopilot)", "free"],
            ["Node cost", "EC2 on-demand / Spot / Reserved", "GCE instances (preemptible for Spot)", "Azure VMs (Spot available)"],
            ["K8s versions", "~3 versions behind latest", "latest + N-2 (fastest updates)", "latest + N-2"],
            ["Autoscaling", "Cluster Autoscaler (addon)", "built-in node auto-provisioning", "Cluster Autoscaler (addon)"],
            ["Networking", "VPC CNI (AWS-native IPs)", "GKE native (alias IPs)", "Azure CNI or kubenet"],
            ["Monitoring", "CloudWatch Container Insights", "Cloud Monitoring (formerly Stackdriver)", "Azure Monitor"],
            ["GitOps", "install Argo CD / Flux manually", "Config Sync (built-in GitOps)", "install Argo CD / Flux manually"],
            ["IAM integration", "IRSA (IAM Roles for Service Accounts)", "Workload Identity", "AAD Pod Identity / Workload Identity"],
          ]}
        />
        <Callout type="note">
          📌 <strong>Cost tip</strong>: control plane is cheap ($73/mo on EKS), nodes are expensive. Use Spot instances for non-critical workloads (70% cheaper), reserved/savings plans for baseline capacity. A 3-node cluster with t3.medium instances (~$100/mo) + EKS control plane = ~$175/mo before traffic.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="capstone" number="07" title="Capstone Project — Deploy the Go REST API ⭐">
        <P>
          Let&apos;s deploy the Go REST API from the <IC>/golang</IC> course (the one with <IC>/users</IC> CRUD endpoints) to Kubernetes with full production setup: Deployment, Service, Ingress, HPA, observability.
        </P>
        <CodeBlock
          title="Dockerfile (from Go course)"
          runnable={false}
          code={`# multi-stage build
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o api ./cmd/api

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/api /api
EXPOSE 8080
USER 1000:1000
CMD ["/api"]`}
        />
        <CodeBlock
          title="k8s/deployment.yaml"
          runnable={false}
          code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-api
  namespace: production
  labels:
    app: go-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-api
  template:
    metadata:
      labels:
        app: go-api
      annotations:
        prometheus.io/scrape: "true"   # Prometheus auto-discovery
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: go-api-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: api
        image: myregistry/go-api:v1.0.0   # ← GitOps updates this tag
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: go-api-secrets
              key: database-url
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL`}
        />
        <CodeBlock
          title="k8s/service.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: go-api
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: go-api
  ports:
  - port: 80
    targetPort: 8080
    name: http`}
        />
        <CodeBlock
          title="k8s/ingress.yaml"
          runnable={false}
          code={`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: go-api
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod   # auto SSL
    nginx.ingress.kubernetes.io/rate-limit: "100"      # 100 req/s per IP
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: go-api-tls   # cert-manager creates this
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: go-api
            port:
              number: 80`}
        />
        <CodeBlock
          title="k8s/hpa.yaml"
          runnable={false}
          code={`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: go-api
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: go-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60`}
        />
        <CodeBlock
          title="k8s/secrets.yaml (base64 encoded)"
          runnable={false}
          code={`apiVersion: v1
kind: Secret
metadata:
  name: go-api-secrets
  namespace: production
type: Opaque
data:
  database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGI6NTQzMi9hcGk=
  # postgres://user:pass@db:5432/api (base64 encoded)
  # in production: use Sealed Secrets or External Secrets Operator`}
        />
        <CodeBlock
          title="Deploy with GitOps"
          output={`# 1. Build & push image (CI/CD)
$ docker build -t myregistry/go-api:v1.0.0 .
$ docker push myregistry/go-api:v1.0.0

# 2. Commit manifests to git
$ git add k8s/
$ git commit -m "Deploy go-api v1.0.0"
$ git push origin main

# 3. Argo CD detects change and syncs
$ kubectl get applications -n argocd
NAME     SYNC STATUS   HEALTH STATUS
go-api   Synced        Healthy   ← deployed ✅

# 4. Verify deployment
$ kubectl get pods -n production
NAME                      READY   STATUS
go-api-7f8d9c-abc12       1/1     Running
go-api-7f8d9c-def34       1/1     Running
go-api-7f8d9c-ghi56       1/1     Running   ← 3 replicas

$ curl https://api.example.com/users
[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]   ← live! 🚀

# 5. Trigger HPA (load test)
$ kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh
  while true; do wget -q -O- https://api.example.com/users; done

# watch HPA scale up
$ kubectl get hpa -n production -w
NAME     REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS
go-api   Deployment/go-api  15%/70%   3         20        3
go-api   Deployment/go-api  85%/70%   3         20        3   ← CPU spike
go-api   Deployment/go-api  85%/70%   3         20        5   ← scaled up ✅`}
          code={`docker build -t myregistry/go-api:v1.0.0 .
git add k8s/ && git commit -m "Deploy go-api v1.0.0" && git push
kubectl get pods -n production`}
        />
        <Callout type="tip">
          💡 <strong>Observability integration</strong>: The <IC>prometheus.io/scrape</IC> annotation tells Prometheus to scrape <IC>/metrics</IC>. Implement this endpoint in your Go app (use <IC>promhttp</IC> library) to export request counts, latencies, errors — the RED metrics (Rate, Errors, Duration).
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="checklist" number="08" title="Production Readiness Checklist — The Final Audit">
        <CodeBlock
          title="production_checklist.txt"
          runnable={false}
          code={`INFRASTRUCTURE
□ managed K8s (EKS/GKE/AKS) with control-plane HA (multi-AZ)
□ 3+ nodes across availability zones (anti-affinity for critical apps)
□ Cluster Autoscaler enabled (scale nodes on demand)
□ metrics-server installed (kubectl top + HPA)
□ Ingress controller (nginx / ALB / Traefik) with TLS (cert-manager)
□ StorageClass with dynamic provisioning (gp3 EBS / GCE-PD)

WORKLOADS
□ all Deployments have: requests, limits, replicas ≥ 2
□ HPA configured (min 2, max 10-20, target 70% CPU)
□ liveness + readiness + startup probes on all pods
□ PodDisruptionBudget (minAvailable: 1) for critical apps
□ resource quotas per namespace (prevent runaway pods)

SECURITY
□ RBAC: dedicated ServiceAccounts, no cluster-admin except admins
□ NetworkPolicies: default-deny ingress + explicit allow rules
□ securityContext: runAsNonRoot, readOnlyRootFilesystem, drop ALL caps
□ Pod Security Standards: enforce "restricted" in prod namespaces
□ Secrets: external vault (Sealed Secrets / ESO) or encrypt etcd
□ image scanning (Trivy in CI), signed images (cosign + admission webhook)

OBSERVABILITY
□ logs: Loki/ELK/CloudWatch, retention 30+ days
□ metrics: Prometheus + Grafana, retention 15-30 days
□ traces: Tempo/Jaeger for latency debugging
□ alerts: CPU/mem >80%, pod crash rate, persistent volume full
□ dashboards: golden signals (latency, traffic, errors, saturation)

GITOPS
□ Argo CD / Flux installed, auto-sync enabled
□ all manifests in git (no manual kubectl apply in prod)
□ selfHeal: true (drift auto-corrected)
□ separate repos or branches: dev / staging / prod
□ Argo CD RBAC (not everyone can sync prod)

DISASTER RECOVERY
□ etcd backups automated (daily snapshots to S3/GCS)
□ PV backups (Velero snapshots)
□ RTO/RPO defined (e.g., RTO 30min, RPO 1hr)
□ runbook: how to restore from backup, tested quarterly

CI/CD
□ CI builds image, scans for CVEs, runs tests
□ CI updates git repo with new image tag (GitOps)
□ no kubectl credentials in CI (GitOps pulls, not pushes)
□ immutable tags (not :latest — use :v1.2.3 or commit SHA)

COST
□ right-size requests (VPA recommendations)
□ use Spot/preemptible for batch jobs (70% savings)
□ cluster autoscaler scale-down (delete idle nodes)
□ monitoring unused PVs (orphaned claims cost $$$)

DOCUMENTATION
□ architecture diagram (Deployment → Service → Ingress → users)
□ runbooks: how to deploy, rollback, scale, troubleshoot
□ on-call playbook: "pod CrashLoop → check logs, events, rollback"

if every box is checked, you have a production-grade cluster ✅`}
        />
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Observability pillars", "logs (what) · metrics (how much) · traces (where time spent)"],
            ["Log stack", "pod stdout → Fluent Bit → Loki/ELK → Grafana/Kibana"],
            ["Metric stack", "pod /metrics → Prometheus scrape → PromQL → Grafana dashboards"],
            ["kubectl logs", "kubectl logs <pod> --previous (crashed container logs for CrashLoop debug)"],
            ["Troubleshoot Pending", "kubectl describe pod → Events: insufficient cpu / taints / unbound PVC"],
            ["Troubleshoot ImagePull", "Events: unauthorized (imagePullSecret) or manifest not found (typo)"],
            ["Troubleshoot CrashLoop", "kubectl logs --previous → panic/exit code → app bug or missing dependency"],
            ["GitOps definition", "git = single source of truth · operator pulls & syncs · auto-corrects drift"],
            ["GitOps vs push CI/CD", "push: CI runs kubectl (creds risk) · pull: operator in cluster (no external creds)"],
            ["Argo CD sync", "polls repo → compares git vs cluster → kubectl apply diff → self-heal drift"],
            ["Argo selfHeal", "auto-reverts manual kubectl changes within minutes (git always wins)"],
            ["Rollback in GitOps", "git revert HEAD → Argo syncs → instant rollback (no pipeline re-run)"],
            ["Managed K8s cost", "EKS $73/mo control plane + EC2 nodes · GKE free control + GCE nodes · AKS free + VMs"],
            ["Production must-haves", "HPA · probes · PDB · RBAC · NetworkPolicy · GitOps · observability · backups"],
            ["Capstone stack", "Deployment (3 replicas) + Service + Ingress (TLS) + HPA (3-20) + Secrets + probes"],
            ["Final test", "can you deploy, scale, troubleshoot, rollback without panic? then you're ready. 🚀"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
