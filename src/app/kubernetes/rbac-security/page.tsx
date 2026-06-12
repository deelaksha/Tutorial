"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Request Through the Gates — Live",
  nodes: [
    { id: "user", icon: "👤", label: "User", sub: "dev@example", x: 8, y: 30, color: "#22d3ee" },
    { id: "authn", icon: "🔑", label: "Authentication", sub: "who are you?", x: 25, y: 15, color: "#60a5fa" },
    { id: "rbac", icon: "🛡️", label: "RBAC", sub: "what can you do?", x: 45, y: 15, color: "#a78bfa" },
    { id: "admission", icon: "✅", label: "Admission", sub: "is it allowed?", x: 65, y: 15, color: "#fbbf24" },
    { id: "etcd", icon: "💾", label: "etcd", sub: "cluster data", x: 85, y: 30, color: "#34d399" },
    { id: "pod", icon: "🎯", label: "Pod", sub: "workload", x: 45, y: 55, color: "#f472b6" },
    { id: "netpol", icon: "🔒", label: "NetworkPolicy", sub: "firewall", x: 70, y: 70, color: "#fb923c" },
  ],
  edges: [
    { id: "user-authn", from: "user", to: "authn", color: "#60a5fa" },
    { id: "authn-rbac", from: "authn", to: "rbac", color: "#a78bfa" },
    { id: "rbac-admission", from: "rbac", to: "admission", color: "#fbbf24" },
    { id: "admission-etcd", from: "admission", to: "etcd", color: "#34d399" },
    { id: "pod-netpol", from: "pod", to: "netpol", color: "#fb923c" },
    { id: "authn-user", from: "authn", to: "user", bend: 40, dashed: true, color: "#f87171" },
    { id: "rbac-user", from: "rbac", to: "user", bend: 50, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "allowed",
      name: "✅ Dev lists pods in dev ns",
      command: "kubectl get pods -n dev",
      steps: [
        { node: "authn", paths: ["user-authn"], text: "API server checks certificate: CN=dev@example → authenticated as user 'dev@example'. Gate 1 passed. 🔑" },
        { node: "rbac", paths: ["authn-rbac"], text: "RBAC check: RoleBinding 'dev-reader' grants Role 'read-pods' to 'dev@example' in namespace 'dev'. Allowed. 🛡️" },
        { node: "etcd", paths: ["rbac-admission", "admission-etcd"], text: "Admission webhooks pass (no policy violations). Request reaches etcd. Returns pod list. ✅" },
      ],
    },
    {
      id: "denied",
      name: "🚫 Dev deletes in prod → 403",
      command: "kubectl delete pod web-0 -n prod",
      steps: [
        { node: "authn", paths: ["user-authn", "authn-rbac"], text: "Authenticated as 'dev@example'. Gate 1 passed." },
        { node: "rbac", paths: ["rbac-user"], text: "RBAC check: no RoleBinding grants delete permission in namespace 'prod' to this user. DENIED. 🚫" },
        { node: "user", paths: [], text: "Error from server (Forbidden): pods 'web-0' is forbidden: User 'dev@example' cannot delete resource 'pods' in namespace 'prod'. 403. 🔴" },
      ],
    },
    {
      id: "netpol",
      name: "🔒 NetworkPolicy blocks traffic",
      command: "frontend → db blocked, only api → db allowed",
      steps: [
        { node: "pod", paths: ["pod-netpol"], text: "Frontend pod tries to connect to db:5432. Packet hits NetworkPolicy firewall." },
        { node: "netpol", paths: [], text: "Policy: only allow ingress from pods with label 'app=api'. Frontend has 'app=frontend' → DROP. 🚫" },
        { node: "netpol", paths: ["pod-netpol"], text: "API pod (label 'app=api') connects to db:5432. Policy allows it. Database traffic isolated. 🔒✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "namespaces", label: "Namespaces as Virtual Clusters" },
  { id: "gates", label: "The Three Security Gates ⭐" },
  { id: "serviceaccounts", label: "ServiceAccounts — Pod Identity" },
  { id: "rbac", label: "RBAC — The Four Objects ⭐" },
  { id: "rbac-examples", label: "RBAC Examples & Patterns" },
  { id: "networkpolicy", label: "NetworkPolicies ⭐" },
  { id: "security-context", label: "Security Contexts" },
  { id: "pod-security", label: "Pod Security Standards" },
  { id: "checklist", label: "Least-Privilege Checklist" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sRbacSecurityPage() {
  return (
    <TopicShell
      icon="🔒"
      title="Kubernetes RBAC & Security"
      gradientWord="RBAC"
      subtitle="By default, Kubernetes trusts everything. This topic locks it down: namespaces to isolate teams, RBAC to control who can do what (Role/RoleBinding/ClusterRole/ClusterRoleBinding), ServiceAccounts for pod identity, NetworkPolicies as firewalls, and securityContext for least-privilege containers. The production security checklist that keeps your cluster from becoming the next breach headline."
      nav={NAV}
      badges={["🛡️ RBAC", "🔒 NetworkPolicy", "🔐 Pod Security"]}
      next={{ icon: "📦", label: "Helm", href: "/kubernetes/helm" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="namespaces" number="01" title="Namespaces — Virtual Clusters Within a Cluster">
        <P>
          A <strong>namespace</strong> is a virtual partition of a Kubernetes cluster. Resources in different namespaces are isolated (names can overlap, RBAC can differ, quotas separate).
        </P>
        <CodeBlock
          title="namespace_isolation.txt"
          runnable={false}
          code={`cluster = 1 physical K8s cluster
namespaces = virtual sub-clusters

┌────────────────────────────────────────────────────────────┐
│ CLUSTER                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ default      │  │ dev          │  │ prod         │     │
│  │  pod: web    │  │  pod: web    │  │  pod: web    │     │
│  │  svc: web    │  │  svc: web    │  │  svc: web    │     │
│  │ (same names  │  │ (isolated!)  │  │ (isolated!)  │     │
│  │  OK across   │  └──────────────┘  └──────────────┘     │
│  │  namespaces) │                                          │
│  └──────────────┘                                          │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ kube-system  │  │ kube-public  │                       │
│  │  (K8s core)  │  │ (public cfg) │                       │
│  └──────────────┘  └──────────────┘                       │
└────────────────────────────────────────────────────────────┘

use cases:
• multi-tenancy: team-a, team-b namespaces (RBAC isolation)
• environments: dev, staging, prod (separate quotas)
• apps: frontend, backend, data (logical grouping)`}
        />
        <CodeBlock
          title="kubectl namespaces"
          output={`# list namespaces
$ kubectl get namespaces
NAME              STATUS   AGE
default           Active   10d
kube-system       Active   10d   ← K8s control plane pods
kube-public       Active   10d
kube-node-lease   Active   10d
dev               Active   2d
prod              Active   2d

# create namespace
$ kubectl create namespace staging
namespace/staging created

# resources are namespace-scoped by default
$ kubectl get pods -n dev
NAME      READY   STATUS
web-0     1/1     Running
api-xyz   1/1     Running

$ kubectl get pods -n prod
NAME      READY   STATUS
web-0     1/1     Running   ← different pod, same name (isolated) ✅`}
          code={`kubectl get namespaces
kubectl create namespace staging
kubectl get pods -n dev`}
        />
        <CodeBlock
          title="namespace_in_yaml.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Namespace
metadata:
  name: dev
  labels:
    env: development
---
apiVersion: v1
kind: Pod
metadata:
  name: web
  namespace: dev   # ← explicit namespace (omit = "default")
spec:
  containers:
  - name: nginx
    image: nginx`}
        />
        <Callout type="tip">
          💡 Set your default namespace for kubectl: <IC>kubectl config set-context --current --namespace=dev</IC>. Now <IC>kubectl get pods</IC> defaults to the <IC>dev</IC> namespace (no <IC>-n</IC> flag needed).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="gates" number="02" title="The Three Security Gates — AuthN, AuthZ, Admission ⭐">
        <P>
          Every API request (kubectl, pod, external client) passes through <strong>three gates</strong>:
        </P>
        <CodeBlock
          title="three_gates.txt"
          runnable={false}
          code={`REQUEST → gate 1 → gate 2 → gate 3 → API server
           ↓        ↓        ↓
      AUTHENTICATION  AUTHORIZATION  ADMISSION
      "who are you?"  "allowed?"      "safe?"

┌────────────────────────────────────────────────────────────┐
│ GATE 1: AUTHENTICATION (authN)                             │
│  proves identity via:                                      │
│   • X.509 client certificates (kubectl, kubelets)          │
│   • bearer tokens (ServiceAccount tokens, OIDC)            │
│   • basic auth (deprecated, don't use)                     │
│  result: request tagged with username + groups             │
│  fail → 401 Unauthorized                                   │
└────────────────────────────────────────────────────────────┘
           ↓ authenticated user = "dev@example", groups = [devs]
┌────────────────────────────────────────────────────────────┐
│ GATE 2: AUTHORIZATION (authZ) — RBAC                       │
│  checks: does this user/group have permission for this     │
│          action (verb) on this resource?                   │
│  example: can "dev@example" DELETE pods in namespace prod? │
│  result: allow or deny                                     │
│  fail → 403 Forbidden                                      │
└────────────────────────────────────────────────────────────┘
           ↓ allowed
┌────────────────────────────────────────────────────────────┐
│ GATE 3: ADMISSION CONTROL                                  │
│  mutating webhooks: modify request (inject sidecars, etc)  │
│  validating webhooks: enforce policies (no :latest tag,    │
│    no privileged containers, image signed, etc)            │
│  result: admit or reject                                   │
│  fail → 400 Bad Request or custom message                  │
└────────────────────────────────────────────────────────────┘
           ↓ admitted
         etcd (request executed) ✅`}
        />
        <Callout type="analogy">
          🏢 <strong>Office building analogy</strong>: Gate 1 (authN) = badge scanner — proves you are who you say. Gate 2 (authZ/RBAC) = elevator access control — your badge works for floors 1-5 but not 6-10. Gate 3 (admission) = fire marshal — even if you&apos;re allowed in, the marshal can block you if you&apos;re carrying something dangerous.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="serviceaccounts" number="03" title="ServiceAccounts — Identity for Pods">
        <P>
          <strong>Users</strong> are humans (kubectl). <strong>ServiceAccounts</strong> are machine identities for pods. Every pod runs as a ServiceAccount (default: <IC>default</IC> SA in the pod&apos;s namespace).
        </P>
        <CodeBlock
          title="serviceaccount_model.txt"
          runnable={false}
          code={`pod → mounts ServiceAccount token → calls K8s API → authN as that SA

┌────────────────────────────────────────────────────────────┐
│ ServiceAccount: my-app                                     │
│  namespace: dev                                            │
│  secret: auto-created token (JWT)                          │
└────────────────────────────────────────────────────────────┘
                         │ mounted into pod
                         ▼
┌────────────────────────────────────────────────────────────┐
│ Pod                                                        │
│  serviceAccountName: my-app                                │
│  volumeMounts:                                             │
│   /var/run/secrets/kubernetes.io/serviceaccount/token      │
│                          ↑ JWT token, auto-injected        │
└────────────────────────────────────────────────────────────┘
                         │ app reads token, calls API
                         ▼
              API server sees request from SA "my-app"
              → RBAC checks: does "my-app" have permission? 🛡️`}
        />
        <CodeBlock
          title="serviceaccount_example.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: dev
---
apiVersion: v1
kind: Pod
metadata:
  name: app
  namespace: dev
spec:
  serviceAccountName: my-app   # ← use this SA (omit = "default")
  containers:
  - name: app
    image: myapp:v1
    # token auto-mounted at /var/run/secrets/kubernetes.io/serviceaccount/`}
        />
        <CodeBlock
          title="kubectl get serviceaccounts"
          output={`$ kubectl get sa -n dev
NAME      SECRETS   AGE
default   1         10d   ← every namespace has a "default" SA
my-app    1         2d

$ kubectl describe sa my-app -n dev
Name:                my-app
Namespace:           dev
Mountable secrets:   my-app-token-xyz
Tokens:              my-app-token-xyz`}
          code={`kubectl get sa -n dev
kubectl describe sa my-app -n dev`}
        />
        <Callout type="mistake">
          ⚠️ The <IC>default</IC> ServiceAccount in most clusters has NO permissions (can&apos;t even list pods). Don&apos;t assume your pod can talk to the API — create a dedicated SA with proper RBAC.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="rbac" number="04" title="RBAC — The Four Objects ⭐">
        <P>
          <strong>RBAC</strong> (Role-Based Access Control) is Kubernetes&apos; authZ system. It uses <strong>four object types</strong>:
        </P>
        <Table
          head={["Object", "Scope", "Purpose"]}
          rows={[
            [<IC key="1">Role</IC>, "namespace", "defines permissions (verbs + resources) in ONE namespace"],
            [<IC key="2">ClusterRole</IC>, "cluster-wide", "defines permissions across ALL namespaces or for cluster-scoped resources"],
            [<IC key="3">RoleBinding</IC>, "namespace", "grants a Role to users/groups/SAs in ONE namespace"],
            [<IC key="4">ClusterRoleBinding</IC>, "cluster-wide", "grants a ClusterRole to users/groups/SAs cluster-wide"],
          ]}
        />
        <CodeBlock
          title="rbac_model.txt"
          runnable={false}
          code={`ROLE (what permissions)            BINDING (who gets them)
┌────────────────────────┐         ┌────────────────────────┐
│ Role: read-pods        │◀────────│ RoleBinding: dev-reader│
│  namespace: dev        │   grants│  binds Role to:        │
│  rules:                │         │   user: dev@example    │
│   - verbs: [get,list]  │         │  namespace: dev        │
│     resources: [pods]  │         └────────────────────────┘
└────────────────────────┘
  namespaced = works in ONE namespace only

CLUSTERROLE (cluster-wide)         CLUSTERROLEBINDING
┌────────────────────────┐         ┌────────────────────────┐
│ ClusterRole: admin     │◀────────│ ClusterRoleBinding:    │
│  (no namespace)        │   grants│  cluster-admin-binding │
│  rules:                │         │  binds ClusterRole to: │
│   - verbs: [*]         │         │   user: admin@example  │
│     resources: [*]     │         └────────────────────────┘
└────────────────────────┘
  cluster-scoped = works everywhere + on cluster resources
  (nodes, PVs, namespaces, etc)`}
        />
        <P>
          The <strong>rules</strong> in a Role/ClusterRole specify permissions via <IC>verbs</IC> (actions) and <IC>resources</IC> (what to act on):
        </P>
        <Table
          head={["Verbs (actions)", "Examples"]}
          rows={[
            ["get, list, watch", "read operations — view pods, follow logs"],
            ["create", "create new resources — deploy a pod"],
            ["update, patch", "modify existing resources — edit deployment"],
            ["delete, deletecollection", "delete resources — kubectl delete pod"],
            ["*", "wildcard — all verbs (admin)"],
          ]}
        />
      </Section>

      {/* 05 */}
      <Section id="rbac-examples" number="05" title="RBAC Examples & Patterns">
        <CodeBlock
          title="role_readonly.yaml"
          runnable={false}
          code={`# Role: read-only access to pods and logs in "dev" namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
- apiGroups: [""]   # "" = core API group (pods, services, etc)
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
# RoleBinding: grant this Role to user "dev@example"
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-reader
  namespace: dev
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader   # ← references the Role above
subjects:
- kind: User
  name: dev@example   # ← the user (from cert CN or OIDC)
  apiGroup: rbac.authorization.k8s.io`}
        />
        <CodeBlock
          title="kubectl auth can-i (test RBAC)"
          output={`# test as current user
$ kubectl auth can-i get pods -n dev
yes

$ kubectl auth can-i delete pods -n dev
no

# test as different user (requires admin)
$ kubectl auth can-i get pods -n dev --as dev@example
yes

$ kubectl auth can-i delete pods -n prod --as dev@example
no   ← no RoleBinding in prod namespace`}
          code={`kubectl auth can-i get pods -n dev
kubectl auth can-i delete pods -n dev --as dev@example`}
        />
        <CodeBlock
          title="clusterrole_nodes.yaml"
          runnable={false}
          code={`# ClusterRole: view nodes (cluster-scoped resource, no namespace)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list"]
---
# ClusterRoleBinding: grant to ServiceAccount "monitoring" in kube-system
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: monitoring-nodes
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: node-reader
subjects:
- kind: ServiceAccount
  name: monitoring
  namespace: kube-system   # ← SA is namespaced, but binding is cluster-wide`}
        />
        <P>
          You can also bind a <strong>ClusterRole</strong> with a <strong>RoleBinding</strong> (limits the ClusterRole to one namespace):
        </P>
        <CodeBlock
          title="clusterrole_with_rolebinding.yaml"
          runnable={false}
          code={`# ClusterRole: edit (pre-defined by K8s)
# (allows create/update/delete of most resources)

# RoleBinding: grant "edit" ClusterRole in "dev" namespace only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-editors
  namespace: dev
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit   # ← built-in ClusterRole
subjects:
- kind: Group
  name: devs   # ← all users in group "devs" (from OIDC/AD)
  apiGroup: rbac.authorization.k8s.io
# result: "devs" group can edit resources in "dev" namespace only ✅`}
        />
        <Callout type="tip">
          💡 Kubernetes has pre-defined ClusterRoles: <IC>view</IC> (read-only), <IC>edit</IC> (modify, no RBAC changes), <IC>admin</IC> (full control in namespace), <IC>cluster-admin</IC> (god mode). Use them instead of writing custom roles for common cases.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="networkpolicy" number="06" title="NetworkPolicies — Firewalls for Pods ⭐">
        <P>
          By default, <strong>all pods can talk to all pods</strong> (no network isolation). A <IC>NetworkPolicy</IC> is a firewall rule that restricts ingress/egress traffic based on pod labels, namespaces, and ports.
        </P>
        <CodeBlock
          title="default_vs_networkpolicy.txt"
          runnable={false}
          code={`DEFAULT (no NetworkPolicy)
┌──────────────────────────────────────────────────────────┐
│ frontend pod  ────────▶  database pod   (allowed)        │
│ api pod       ────────▶  database pod   (allowed)        │
│ random pod    ────────▶  database pod   (allowed) ⚠️     │
│                                                          │
│ ALL traffic allowed — like a network with no firewall   │
└──────────────────────────────────────────────────────────┘

WITH NetworkPolicy on database pod
┌──────────────────────────────────────────────────────────┐
│ frontend pod  ──────X▶  database pod   (BLOCKED) 🚫      │
│ api pod       ────────▶  database pod   (ALLOWED) ✅      │
│ random pod    ──────X▶  database pod   (BLOCKED) 🚫      │
│                                                          │
│ policy: only allow ingress from pods with app=api       │
└──────────────────────────────────────────────────────────┘`}
        />
        <CodeBlock
          title="networkpolicy_db.yaml"
          runnable={false}
          code={`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-firewall
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: database   # ← this policy applies to database pods
  policyTypes:
  - Ingress   # firewall ingress (incoming traffic)
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api   # ← only allow traffic from pods with app=api
    ports:
    - protocol: TCP
      port: 5432   # only port 5432 (PostgreSQL)
# result: frontend (app=frontend) → db BLOCKED
#         api (app=api) → db:5432 ALLOWED ✅`}
        />
        <Callout type="note">
          📌 NetworkPolicies require a <strong>CNI plugin</strong> that supports them (Calico, Cilium, Weave). The default kubenet on some clusters does NOT enforce NetworkPolicies — check your cluster&apos;s CNI first.
        </Callout>
        <P>
          Once a NetworkPolicy selects a pod, that pod becomes <strong>isolated</strong> (default-deny). You must explicitly allow traffic:
        </P>
        <CodeBlock
          title="deny_all_then_allow.yaml"
          runnable={false}
          code={`# 1. deny ALL ingress (empty ingress rules = block everything)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: prod
spec:
  podSelector: {}   # ← matches ALL pods in namespace
  policyTypes:
  - Ingress
  # no ingress rules → blocks all traffic ⚠️
---
# 2. allow specific traffic (e.g., frontend → api)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: api   # applies to api pods
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
# pattern: default-deny + explicit-allow = zero-trust networking 🔒`}
        />
        <P>
          You can also restrict <strong>egress</strong> (outbound traffic):
        </P>
        <CodeBlock
          title="networkpolicy_egress.yaml"
          runnable={false}
          code={`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-egress
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database   # api can only talk to database pods
    ports:
    - protocol: TCP
      port: 5432
  - to:   # also allow DNS (kube-dns in kube-system)
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
# api pod CAN'T call external APIs (blocked) — airgap security 🔒`}
        />
        <Callout type="mistake">
          ⚠️ If you apply a NetworkPolicy with <IC>policyTypes: [Egress]</IC> and forget to allow DNS (port 53 to kube-system), your pods won&apos;t resolve domain names — everything breaks silently. Always whitelist DNS in egress policies.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="security-context" number="07" title="Security Contexts — Container Hardening">
        <P>
          A <IC>securityContext</IC> controls how a container runs: user ID, capabilities, read-only filesystem, privilege escalation. Set at pod or container level.
        </P>
        <CodeBlock
          title="securitycontext_example.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:   # ← pod-level (applies to all containers)
    runAsNonRoot: true   # forbid running as root (UID 0)
    runAsUser: 1000      # run as UID 1000
    fsGroup: 2000        # mounted volumes owned by GID 2000
  containers:
  - name: app
    image: myapp:v1
    securityContext:   # ← container-level (overrides pod-level)
      allowPrivilegeEscalation: false   # can't gain root via setuid
      readOnlyRootFilesystem: true      # / is read-only (immutable)
      capabilities:
        drop:
        - ALL   # drop all Linux capabilities (minimalist)
        add:
        - NET_BIND_SERVICE   # re-add only what's needed (bind port <1024)
    volumeMounts:
    - name: data
      mountPath: /data   # writable (readOnlyRootFilesystem applies to /)
  volumes:
  - name: data
    emptyDir: {}`}
        />
        <Table
          head={["Field", "Purpose", "Why"]}
          rows={[
            [<IC key="1">runAsNonRoot: true</IC>, "block root containers", "root = full node access if container escapes"],
            [<IC key="2">readOnlyRootFilesystem: true</IC>, "immutable container", "prevents malware writing to disk, log tampering"],
            [<IC key="3">allowPrivilegeEscalation: false</IC>, "block setuid binaries", "prevents gaining root via suid exploits"],
            [<IC key="4">capabilities: drop: [ALL]</IC>, "minimal Linux capabilities", "default container has 14 caps — drop unneeded ones"],
          ]}
        />
        <Callout type="tip">
          💡 <strong>Best practice</strong>: start with this template for all production containers. Add back capabilities only if the app breaks. Most apps need ZERO capabilities.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="pod-security" number="08" title="Pod Security Standards — Cluster-Wide Policies">
        <P>
          <strong>Pod Security Standards</strong> (PSS) are pre-defined security profiles enforced cluster-wide or per-namespace via <IC>PodSecurity</IC> admission controller (replaced the deprecated PodSecurityPolicy).
        </P>
        <Table
          head={["Level", "Restrictions", "Use case"]}
          rows={[
            [<IC key="1">Privileged</IC>, "no restrictions (anything goes)", "trusted admin workloads, CNI plugins"],
            [<IC key="2">Baseline</IC>, "minimal restrictions (blocks known escalations)", "default for most apps"],
            [<IC key="3">Restricted</IC>, "strict hardening (follows best practices)", "high-security apps, multi-tenant clusters"],
          ]}
        />
        <CodeBlock
          title="pod_security_labels.yaml"
          runnable={false}
          code={`# enforce "restricted" policy in "prod" namespace
apiVersion: v1
kind: Namespace
metadata:
  name: prod
  labels:
    pod-security.kubernetes.io/enforce: restricted   # ← blocks non-compliant pods
    pod-security.kubernetes.io/audit: restricted     # logs violations (doesn't block)
    pod-security.kubernetes.io/warn: restricted      # warns user on kubectl apply
# now any pod in "prod" namespace MUST comply with "restricted" profile:
#  - runAsNonRoot: true
#  - readOnlyRootFilesystem: true
#  - drop ALL capabilities
#  - no hostPath, hostNetwork, hostPID, privileged, etc`}
        />
        <CodeBlock
          title="kubectl apply non-compliant pod"
          output={`$ kubectl apply -f privileged-pod.yaml -n prod
Error from server (Forbidden): pods "bad-pod" is forbidden:
violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false,
runAsNonRoot != true, seccompProfile must be set

the admission controller BLOCKS the pod ✅ (prod stays secure)`}
          code={`kubectl apply -f privileged-pod.yaml -n prod`}
        />
        <Callout type="note">
          📌 Pod Security Standards are <strong>enabled by default in K8s 1.25+</strong>. Check with <IC>kubectl get ns -o yaml | grep pod-security</IC> — if labels are missing, the namespace defaults to <IC>privileged</IC> (no enforcement).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="checklist" number="09" title="Least-Privilege Production Checklist">
        <CodeBlock
          title="security_checklist.txt"
          runnable={false}
          code={`✅ NAMESPACES
   □ isolate teams/apps in separate namespaces (dev, prod, team-a)
   □ set ResourceQuotas per namespace (prevent noisy neighbor)

✅ RBAC
   □ never give cluster-admin except to admins (no blanket god mode)
   □ create ServiceAccounts per app (not "default")
   □ grant minimal verbs (get/list, not delete unless needed)
   □ use RoleBindings (namespace-scoped) over ClusterRoleBindings
   □ test with kubectl auth can-i

✅ NETWORKPOLICIES
   □ default-deny ingress in all namespaces (deny-all + explicit allow)
   □ limit pod-to-pod traffic by label (only api→db, not frontend→db)
   □ allow DNS egress (port 53 to kube-system)
   □ block egress to internet if not needed (airgap)

✅ SECURITYCONTEXT
   □ runAsNonRoot: true (all pods)
   □ readOnlyRootFilesystem: true (where possible)
   □ allowPrivilegeEscalation: false
   □ capabilities: drop: [ALL]

✅ POD SECURITY STANDARDS
   □ enforce "baseline" or "restricted" in prod namespaces
   □ audit mode in dev (warn but allow violations for debugging)

✅ SECRETS
   □ never hardcode secrets in YAML (use Secrets or external vault)
   □ encrypt etcd at rest (cloud provider default or manual)
   □ rotate ServiceAccount tokens regularly

✅ IMAGE SECURITY
   □ scan images for CVEs (Trivy, Snyk, cloud-native scanners)
   □ use distroless/minimal base images (less attack surface)
   □ never pull :latest in prod (pin tags or digests)
   □ sign images (cosign + admission webhook validation)

✅ AUDIT
   □ enable audit logs (who did what when — CloudTrail/Stackdriver)
   □ monitor for privilege escalations, SA token exfil
   □ alert on kubectl exec to prod pods (suspicious)`}
        />
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Namespaces", "virtual clusters — isolate teams/envs, same names OK across NS"],
            ["Three gates", "authN (who?) → authZ/RBAC (allowed?) → admission (safe?) → etcd"],
            ["ServiceAccount", "pod identity — token mounted at /var/run/secrets/kubernetes.io/serviceaccount/"],
            ["RBAC objects", "Role (NS perms) + RoleBinding (grant) · ClusterRole + ClusterRoleBinding"],
            ["Role verbs", "get, list, watch (read) · create, update, delete (write) · * (all)"],
            ["kubectl auth can-i", "kubectl auth can-i delete pods -n prod --as user@example"],
            ["Built-in roles", "view (read) · edit (modify) · admin (NS full) · cluster-admin (god mode)"],
            ["NetworkPolicy default", "⚠️ allow-all by default — apply policy → isolated (default-deny)"],
            ["Deny-all pattern", "podSelector: {} + policyTypes: [Ingress] + no rules = block everything"],
            ["Egress DNS", "⚠️ egress policy must allow port 53 to kube-system (or DNS breaks)"],
            ["securityContext", "runAsNonRoot · readOnlyRootFilesystem · allowPrivilegeEscalation: false"],
            ["Pod Security levels", "privileged (any) · baseline (minimal) · restricted (strict)"],
            ["PSS enforcement", "namespace label: pod-security.kubernetes.io/enforce: restricted"],
            ["Least privilege", "dedicated SA · minimal RBAC verbs · NetworkPolicy deny-all + allow · no root"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
