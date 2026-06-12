"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "PVC → Bound Disk — Live",
  nodes: [
    { id: "pod", icon: "🎯", label: "Pod", sub: "web-1", x: 8, y: 20, color: "#22d3ee" },
    { id: "pvc", icon: "📋", label: "PVC", sub: "claim 10Gi", x: 28, y: 20, color: "#a78bfa" },
    { id: "sc", icon: "⚙️", label: "StorageClass", sub: "fast-ssd", x: 50, y: 12, color: "#fbbf24" },
    { id: "provisioner", icon: "🏭", label: "Provisioner", sub: "cloud driver", x: 72, y: 12, color: "#fb923c" },
    { id: "pv", icon: "💽", label: "PV", sub: "bound vol", x: 50, y: 50, color: "#34d399" },
    { id: "disk", icon: "💾", label: "Cloud Disk", sub: "EBS/GCE-PD", x: 90, y: 50, color: "#f472b6" },
    { id: "node", icon: "🖥️", label: "Node B", sub: "after reschedule", x: 8, y: 75, color: "#60a5fa" },
  ],
  edges: [
    { id: "pod-pvc", from: "pod", to: "pvc", color: "#a78bfa" },
    { id: "pvc-sc", from: "pvc", to: "sc", color: "#fbbf24" },
    { id: "sc-provisioner", from: "sc", to: "provisioner", color: "#fb923c" },
    { id: "provisioner-disk", from: "provisioner", to: "disk", color: "#f472b6" },
    { id: "disk-pv", from: "disk", to: "pv", bend: -30, color: "#34d399" },
    { id: "pv-pvc", from: "pv", to: "pvc", bend: 30, color: "#34d399" },
    { id: "pvc-pod", from: "pvc", to: "pod", dashed: true, color: "#22d3ee" },
    { id: "node-pv", from: "node", to: "pv", color: "#60a5fa" },
  ],
  flows: [
    {
      id: "dynamic",
      name: "🚀 Dynamic provision",
      command: "kubectl apply -f pvc.yaml",
      steps: [
        { node: "pvc", paths: ["pvc-sc"], text: "PVC created requesting 10Gi fast storage. No PV exists yet — StorageClass triggers dynamic provisioning." },
        { node: "provisioner", paths: ["sc-provisioner", "provisioner-disk"], text: "Cloud provisioner (AWS EBS CSI) receives the request and creates a real disk in the cloud." },
        { node: "pv", paths: ["disk-pv", "pv-pvc"], text: "PV object auto-created, bound to the PVC. Pod mounts it. Data persists beyond pod lifecycle. 🎯" },
      ],
    },
    {
      id: "reschedule",
      name: "🔄 Pod reschedules",
      command: "node-A fails → pod moves to node-B",
      steps: [
        { node: "pod", paths: ["pod-pvc"], text: "Pod crashes or node dies. Kubernetes reschedules the pod to a different node." },
        { node: "pv", paths: ["pv-pvc"], text: "The PVC → PV → cloud-disk binding is preserved. The same disk is reattached." },
        { node: "node", paths: ["node-pv", "pv-pvc", "pvc-pod"], text: "Pod on Node B mounts the SAME volume. Data intact — this is why we use PVs, not local directories. 💾" },
      ],
    },
    {
      id: "statefulset",
      name: "🔢 StatefulSet 3 replicas",
      command: "volumeClaimTemplates: 3 pods → 3 disks",
      steps: [
        { node: "pvc", paths: [], text: "StatefulSet with 3 replicas + volumeClaimTemplates creates 3 separate PVCs: web-0-pvc, web-1-pvc, web-2-pvc." },
        { node: "provisioner", paths: ["sc-provisioner", "provisioner-disk"], text: "Each PVC triggers its own disk. No sharing — web-1 keeps its disk across restarts, even if the pod dies." },
        { node: "pv", paths: ["disk-pv", "pv-pvc", "pvc-pod"], text: "Ordered rollout: web-0 → web-1 → web-2. Each pod gets stable name + dedicated persistent storage. 🔢" },
      ],
    },
  ],
};

const NAV = [
  { id: "ephemeral", label: "The Ephemeral Problem ⭐" },
  { id: "volume-types", label: "Volume Types Tour" },
  { id: "pv-pvc", label: "PV/PVC Abstraction ⭐" },
  { id: "dynamic", label: "Dynamic Provisioning ⭐" },
  { id: "access-reclaim", label: "Access Modes & Reclaim Policies" },
  { id: "statefulsets", label: "StatefulSets in Depth ⭐" },
  { id: "use-cases", label: "When to Use What" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function K8sStoragePage() {
  return (
    <TopicShell
      icon="💾"
      title="Kubernetes Storage & StatefulSets"
      gradientWord="Storage"
      subtitle="Pods are ephemeral — by default when they die, all their data dies with them. This topic teaches the PV/PVC abstraction that lets disks outlive pods, dynamic provisioning with StorageClasses, and StatefulSets: the way to run databases with stable names and dedicated persistent volumes."
      nav={NAV}
      badges={["💽 PV/PVC model", "🏭 Dynamic provision", "🔢 StatefulSets"]}
      next={{ icon: "🎯", label: "Scheduling & Health", href: "/kubernetes/scheduling-health" }}
      backHref="/kubernetes"
      backLabel="☸️ Kubernetes"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="ephemeral" number="01" title="The Ephemeral Problem ⭐">
        <P>
          By default, a pod&apos;s filesystem is <IC>ephemeral</IC>: every file written inside a container disappears when the pod dies. This is fine for stateless apps (web servers, APIs), but catastrophic for databases, file uploads, or any data you need to keep.
        </P>
        <CodeBlock
          title="ephemeral_death.txt"
          runnable={false}
          code={`pod lifecycle                    filesystem fate
┌──────────────┐                 ┌────────────────┐
│  pod starts  │────────────────▶│ fresh empty FS │
└──────────────┘                 └────────────────┘
       │                                  │
       │ app writes /data/db.sqlite       │
       ▼                                  ▼
┌──────────────┐                 ┌────────────────┐
│  pod running │────────────────▶│   data exists  │
└──────────────┘                 └────────────────┘
       │                                  │
       │ crash / kubectl delete pod       │
       ▼                                  ▼
┌──────────────┐                 ┌────────────────┐
│   pod dies   │────────────────▶│  💀 GONE 💀    │
└──────────────┘                 └────────────────┘
       │                                  │
       │ new pod scheduled                │
       ▼                                  ▼
┌──────────────┐                 ┌────────────────┐
│ pod starts 2 │────────────────▶│ EMPTY FS again │
└──────────────┘                 └────────────────┘

the database file? obliterated. the uploaded images? gone.`}
        />
        <Callout type="analogy">
          🏨 Think of pods like hotel guests. When they check out, housekeeping throws away
          everything left in the room. If you want your stuff to survive checkout, you need a
          <em>storage locker</em> outside the room — that&apos;s what volumes are.
        </Callout>
        <P>
          Kubernetes solves this with <strong>volumes</strong>: storage that lives <em>outside</em> the pod lifecycle. The simplest version is just mounting a directory from the host node into the pod — but that breaks when the pod reschedules to a different node. The real solution is <strong>network-attached storage</strong> (cloud disks, NFS) that any node can mount.
        </P>
      </Section>

      {/* 02 */}
      <Section id="volume-types" number="02" title="Volume Types Tour">
        <P>
          Kubernetes supports ~30 volume types. You declare a volume in the pod spec, then mount it into containers. Here are the most common types:
        </P>
        <Table
          head={["Type", "Lifespan", "Use case"]}
          rows={[
            [<IC key="1">emptyDir</IC>, "pod lifetime", "scratch space, shared cache between containers in same pod"],
            [<IC key="2">hostPath</IC>, "forever (on that node)", "⚠️ dangerous: ties pod to one node, breaks portability"],
            [<IC key="3">nfs</IC>, "forever (external)", "shared ReadWriteMany storage across many pods"],
            [<IC key="4">awsElasticBlockStore</IC>, "forever (cloud)", "AWS EBS disk — survives pod, but node-locked until unmounted"],
            [<IC key="5">gcePersistentDisk</IC>, "forever (cloud)", "GCE Persistent Disk — same idea"],
            [<IC key="6">persistentVolumeClaim</IC>, "forever (abstracted)", "⭐ THE ONE TO USE — lets K8s pick the backing storage"],
          ]}
        />
        <CodeBlock
          title="pod_with_emptyDir.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Pod
metadata:
  name: cache-demo
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: cache-vol
      mountPath: /cache
  volumes:
  - name: cache-vol
    emptyDir: {}   # created when pod starts, deleted when pod dies`}
        />
        <Callout type="mistake">
          ⚠️ Never use <IC>hostPath</IC> for production data. It hardcodes a path on one physical node — your pod can only run there, breaking the whole &quot;schedule anywhere&quot; promise of Kubernetes. Use it only for read-only node data (like <IC>/var/log</IC> for log shippers).
        </Callout>
        <CodeBlock
          title="hostPath_example.yaml (anti-pattern for data)"
          runnable={false}
          code={`volumes:
- name: data
  hostPath:
    path: /mnt/data  # ⚠️ only exists on node-1 → pod stuck there forever`}
        />
      </Section>

      {/* 03 */}
      <Section id="pv-pvc" number="03" title="The PV/PVC Abstraction ⭐">
        <P>
          Hardcoding cloud disk IDs in pod YAMLs is brittle (and leaks infra details to app teams). Kubernetes solves this with a <strong>two-layer abstraction</strong>:
        </P>
        <CodeBlock
          title="pv_pvc_model.txt"
          runnable={false}
          code={`┌─────────────────────────────────────────────────────────────┐
│  POD (what app teams write)                                 │
│  "I need 10Gi of fast storage"                              │
│  volumeMounts: - name: data → /var/lib/mysql                │
└────────────────────────┬────────────────────────────────────┘
                         │ references
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PVC = PersistentVolumeClaim (the request)                  │
│  apiVersion: v1                                             │
│  kind: PersistentVolumeClaim                                │
│  spec:                                                      │
│    accessModes: [ReadWriteOnce]                             │
│    resources: { requests: { storage: 10Gi } }               │
│    storageClassName: fast-ssd  ← optional filter            │
└────────────────────────┬────────────────────────────────────┘
                         │ binds to (1:1 forever)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PV = PersistentVolume (the actual resource)                │
│  apiVersion: v1                                             │
│  kind: PersistentVolume                                     │
│  spec:                                                      │
│    capacity: { storage: 15Gi }  ← must be ≥ claim          │
│    accessModes: [ReadWriteOnce]                             │
│    awsElasticBlockStore:  ← the REAL backing disk           │
│      volumeID: vol-0abc123                                  │
└────────────────────────┬────────────────────────────────────┘
                         │ mounts
                         ▼
                    ☁️ AWS EBS disk vol-0abc123 (20GB, gp3)`}
        />
        <Callout type="analogy">
          🏨 <strong>Hotel room analogy</strong>: PVC = &quot;I need a room with a king bed and wifi&quot; (the request). PV = room 305, which matches those requirements (the allocated resource). Once you check in, room 305 is <em>yours</em> until you check out — no one else can claim it. The front desk (K8s scheduler) did the matching.
        </Callout>
        <P>
          The <strong>binding</strong> is permanent and exclusive: once a PVC binds to a PV, no other PVC can use that PV. The pod references the PVC by name, never the PV directly.
        </P>
        <CodeBlock
          title="pvc_static_example.yaml"
          runnable={false}
          code={`# 1. create the PV (usually done by cluster admin)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-manual
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  awsElasticBlockStore:
    volumeID: vol-0a1b2c3d  # pre-created EBS disk
    fsType: ext4
---
# 2. create the PVC (app team)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
# 3. use it in a pod
apiVersion: v1
kind: Pod
metadata:
  name: mysql
spec:
  containers:
  - name: mysql
    image: mysql:8
    volumeMounts:
    - name: data
      mountPath: /var/lib/mysql
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: mysql-pvc   # ← references the PVC, not PV`}
        />
        <CodeBlock
          title="kubectl apply + check binding"
          output={`persistentvolume/pv-manual created
persistentvolumeclaim/mysql-pvc created
pod/mysql created

$ kubectl get pv,pvc
NAME                        CAPACITY   ACCESS   STATUS   CLAIM
persistentvolume/pv-manual  10Gi       RWO      Bound    default/mysql-pvc

NAME                              STATUS   VOLUME      CAPACITY
persistentvolumeclaim/mysql-pvc   Bound    pv-manual   10Gi

the STATUS=Bound means PVC found a matching PV ✅`}
          code={`kubectl apply -f pvc_static_example.yaml
kubectl get pv,pvc`}
        />
        <Callout type="tip">
          💡 If <IC>kubectl get pvc</IC> shows <IC>STATUS=Pending</IC>, it means no PV matches the claim&apos;s requirements (size, accessMode, storageClass). Either create a matching PV manually, or use dynamic provisioning (next section).
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="dynamic" number="04" title="Dynamic Provisioning with StorageClass ⭐">
        <P>
          Creating PVs manually is tedious and doesn&apos;t scale. <strong>Dynamic provisioning</strong> lets Kubernetes create cloud disks on-demand when a PVC is created. The magic ingredient: <IC>StorageClass</IC>.
        </P>
        <CodeBlock
          title="dynamic_provisioning_flow.txt"
          runnable={false}
          code={`1. cluster admin creates StorageClass (one-time setup)
   ┌────────────────────────────────────────────────┐
   │ StorageClass: fast-ssd                         │
   │ provisioner: ebs.csi.aws.com  ← cloud driver   │
   │ parameters: { type: gp3, iops: 3000 }          │
   └────────────────────────────────────────────────┘

2. app team creates PVC referencing the StorageClass
   ┌────────────────────────────────────────────────┐
   │ PVC: my-claim                                  │
   │ storageClassName: fast-ssd                     │
   │ requests: 50Gi                                 │
   └────────────────────────────────────────────────┘
              │
              ▼ K8s sees no existing PV → triggers provisioner
   ┌────────────────────────────────────────────────┐
   │ AWS EBS CSI driver creates vol-xyz (50GB gp3)  │
   └────────────────────────────────────────────────┘
              │
              ▼ driver creates PV object automatically
   ┌────────────────────────────────────────────────┐
   │ PV: pvc-abc123 (auto-generated name)           │
   │ capacity: 50Gi                                 │
   │ awsElasticBlockStore: { volumeID: vol-xyz }    │
   └────────────────────────────────────────────────┘
              │
              ▼ binds to the PVC
   PVC status: Bound → pod can mount it ✅`}
        />
        <CodeBlock
          title="storageclass_aws_example.yaml"
          runnable={false}
          code={`apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com   # AWS EBS CSI driver
parameters:
  type: gp3           # EBS volume type
  iopsPerGB: "50"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer  # don't create disk until pod scheduled
allowVolumeExpansion: true               # allow resizing later`}
        />
        <CodeBlock
          title="pvc_dynamic.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd   # ← references StorageClass
  resources:
    requests:
      storage: 100Gi`}
        />
        <CodeBlock
          title="kubectl apply → watch dynamic provision"
          output={`$ kubectl apply -f pvc_dynamic.yaml
persistentvolumeclaim/postgres-pvc created

$ kubectl get pvc -w
NAME           STATUS    VOLUME   CAPACITY   STORAGECLASS
postgres-pvc   Pending                       fast-ssd
postgres-pvc   Pending   pvc-9f8e7d6c         fast-ssd    # ← provisioning...
postgres-pvc   Bound     pvc-9f8e7d6c   100Gi   fast-ssd   # ✅ done!

$ kubectl get pv
NAME            CAPACITY   ACCESS   RECLAIM   STATUS   CLAIM
pvc-9f8e7d6c    100Gi      RWO      Delete    Bound    default/postgres-pvc

the PV was created automatically with name = pvc-<uuid> 🎉`}
          code={`kubectl apply -f pvc_dynamic.yaml
kubectl get pvc -w`}
        />
        <Callout type="behind">
          🔧 <strong>How it works</strong>: The StorageClass&apos;s <IC>provisioner</IC> field names a CSI (Container Storage Interface) driver. When a PVC references that class, the K8s controller calls the driver&apos;s <IC>CreateVolume</IC> API → driver talks to the cloud → disk created → driver returns volumeID → K8s creates PV object → binds to PVC. All automatic. 🏭
        </Callout>
        <P>
          Most managed Kubernetes clusters come with a <strong>default StorageClass</strong> (check with <IC>kubectl get sc</IC>). If your PVC omits <IC>storageClassName</IC>, it uses the default.
        </P>
      </Section>

      {/* 05 */}
      <Section id="access-reclaim" number="05" title="Access Modes & Reclaim Policies">
        <P>
          Two critical PV/PVC properties: how many pods can use it, and what happens to the disk when the PVC is deleted.
        </P>
        <Table
          head={["Access Mode", "Abbreviation", "Meaning", "Example use"]}
          rows={[
            [<IC key="1">ReadWriteOnce</IC>, <IC key="2">RWO</IC>, "one pod, read-write (most common)", "database disk — only one pod writes at a time"],
            [<IC key="3">ReadOnlyMany</IC>, <IC key="4">ROX</IC>, "many pods, read-only", "shared config, static website assets"],
            [<IC key="5">ReadWriteMany</IC>, <IC key="6">RWX</IC>, "many pods, read-write", "shared media uploads (needs NFS/EFS, not EBS)"],
            [<IC key="7">ReadWriteOncePod</IC>, <IC key="8">RWOP</IC>, "only ONE pod ever (1.27+)", "exclusive lock for single-writer apps"],
          ]}
        />
        <Callout type="note">
          📌 <IC>ReadWriteOnce</IC> does NOT mean &quot;one pod total&quot; — it means one <em>node</em>. Multiple pods on the <strong>same</strong> node can share an RWO volume (though this is rare). Cloud block storage (EBS, GCE-PD) is usually RWO-only. For RWX you need a network filesystem like NFS, EFS, or Azure Files.
        </Callout>
        <P>
          <strong>Reclaim policies</strong> control what happens to the PV (and the backing disk) when the PVC is deleted:
        </P>
        <Table
          head={["Policy", "Behavior", "Use when"]}
          rows={[
            [<IC key="1">Delete</IC>, "PV + cloud disk deleted (⚠️ data GONE)", "dev/test, stateless apps, disposable data"],
            [<IC key="2">Retain</IC>, "PV released but not deleted — manual cleanup", "prod data you want to back up / inspect before deleting"],
            [<IC key="3">Recycle</IC>, "deprecated — do not use", "—"],
          ]}
        />
        <CodeBlock
          title="reclaim_comparison.yaml"
          runnable={false}
          code={`# default for dynamic PVs: Delete
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ephemeral
provisioner: ebs.csi.aws.com
reclaimPolicy: Delete   # kubectl delete pvc → disk deleted ⚠️
---
# production: Retain
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: production
provisioner: ebs.csi.aws.com
reclaimPolicy: Retain   # PVC deleted → PV stays, admin must clean up manually`}
        />
        <Callout type="mistake">
          ⚠️ The default reclaim policy for dynamically provisioned PVs is <IC>Delete</IC>. This means <IC>kubectl delete pvc my-db</IC> <strong>destroys the cloud disk and all data</strong>. For production databases, either use <IC>Retain</IC> policy or take snapshots before deleting PVCs.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="statefulsets" number="06" title="StatefulSets in Depth ⭐">
        <P>
          Deployments treat all replicas as identical and interchangeable — perfect for stateless apps. But databases need <strong>stable identity</strong>: each replica keeps the same name, IP, and storage across restarts. That&apos;s what <IC>StatefulSet</IC> provides.
        </P>
        <CodeBlock
          title="deployment_vs_statefulset.txt"
          runnable={false}
          code={`DEPLOYMENT (stateless)           STATEFULSET (stateful)
┌─────────────────────────┐      ┌─────────────────────────┐
│ replicas: 3             │      │ replicas: 3             │
│ pods get random names:  │      │ pods get STABLE names:  │
│  web-7f8d9c-abc12       │      │  web-0  (first, always) │
│  web-7f8d9c-def34       │      │  web-1  (second)        │
│  web-7f8d9c-ghi56       │      │  web-2  (third)         │
│ pod dies → new random   │      │ web-1 dies → new web-1  │
│ all share same PVC      │      │ EACH has its OWN PVC    │
│ rolling update: random  │      │ ordered: 2→1→0 (newest→oldest)
│ scale down: random      │      │ scale down: 2→1 (highest first)
└─────────────────────────┘      └─────────────────────────┘

use Deployment for:              use StatefulSet for:
  web servers, APIs                databases, Kafka, ZooKeeper`}
        />
        <P>
          The three guarantees of StatefulSets:
        </P>
        <CodeBlock
          title="statefulset_guarantees.txt"
          runnable={false}
          code={`1. STABLE NETWORK IDENTITY
   pod name = <statefulset-name>-<ordinal>
   web-0, web-1, web-2 — same name after restart
   + headless service → each pod gets DNS:
     web-0.web-svc.default.svc.cluster.local

2. STABLE STORAGE
   volumeClaimTemplates → each pod gets its OWN PVC
   web-0 → web-0-pvc
   web-1 → web-1-pvc
   web-2 → web-2-pvc
   pod dies → new pod with SAME name mounts SAME PVC → data intact

3. ORDERED DEPLOYMENT/SCALING
   create: 0 → 1 → 2 (sequential, waits for Ready)
   delete: 2 → 1 → 0 (reverse order)
   rollout: 2 → 1 → 0 (newest first, like canary)`}
        />
        <CodeBlock
          title="statefulset_mysql.yaml"
          runnable={false}
          code={`apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None   # ← headless service (no loadbalancing)
  selector:
    app: mysql
  ports:
  - port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless   # ← must match headless service
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: secret
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:   # ← creates PVC per pod
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi`}
        />
        <CodeBlock
          title="kubectl apply → watch ordered creation"
          output={`$ kubectl apply -f statefulset_mysql.yaml
service/mysql-headless created
statefulset.apps/mysql created

$ kubectl get pods -w
NAME      READY   STATUS
mysql-0   0/1     Pending
mysql-0   0/1     ContainerCreating
mysql-0   1/1     Running      ← waits for 0 to be Ready
mysql-1   0/1     Pending
mysql-1   0/1     ContainerCreating
mysql-1   1/1     Running      ← then creates 1
mysql-2   0/1     Pending
mysql-2   0/1     ContainerCreating
mysql-2   1/1     Running      ← finally 2 ✅

$ kubectl get pvc
NAME           STATUS   VOLUME          CAPACITY   STORAGECLASS
data-mysql-0   Bound    pvc-abc123      50Gi       fast-ssd
data-mysql-1   Bound    pvc-def456      50Gi       fast-ssd
data-mysql-2   Bound    pvc-ghi789      50Gi       fast-ssd

three separate disks — mysql-1 keeps its data across restarts 🔢`}
          code={`kubectl apply -f statefulset_mysql.yaml
kubectl get pods -w
kubectl get pvc`}
        />
        <Callout type="tip">
          💡 The <IC>serviceName</IC> field is mandatory and must reference a <strong>headless service</strong> (<IC>clusterIP: None</IC>). This gives each pod a DNS entry: <IC>&lt;pod&gt;.&lt;service&gt;.&lt;namespace&gt;.svc.cluster.local</IC>. For example, <IC>mysql-1.mysql-headless.default.svc.cluster.local</IC> always resolves to the same pod, even after restarts.
        </Callout>
        <P>
          When you delete a StatefulSet pod, the PVC is <strong>not deleted</strong> — it&apos;s preserved so the replacement pod can reattach to the same disk. To fully clean up, you must delete the PVCs manually:
        </P>
        <CodeBlock
          title="kubectl delete statefulset + cleanup"
          output={`$ kubectl delete statefulset mysql
statefulset.apps "mysql" deleted

$ kubectl get pods
No resources found.   ← pods gone

$ kubectl get pvc
NAME           STATUS   VOLUME          CAPACITY
data-mysql-0   Bound    pvc-abc123      50Gi   ← PVCs still exist!
data-mysql-1   Bound    pvc-def456      50Gi
data-mysql-2   Bound    pvc-ghi789      50Gi

to delete data: kubectl delete pvc data-mysql-0 data-mysql-1 data-mysql-2`}
          code={`kubectl delete statefulset mysql
kubectl get pvc`}
        />
      </Section>

      {/* 07 */}
      <Section id="use-cases" number="07" title="When to Use What — Decision Table">
        <Table
          head={["Scenario", "Storage solution", "Why"]}
          rows={[
            ["Scratch space / cache (dies with pod OK)", <IC key="1">emptyDir</IC>, "simple, fast, no cloud cost"],
            ["Stateless app logs (node-local OK)", <IC key="2">hostPath</IC>, "log shipper reads /var/log from node"],
            ["Database on ONE pod", <IC key="3">PVC (RWO)</IC>, "data survives pod restart, reschedulable"],
            ["Database with 3 replicas", <IC key="4">StatefulSet + volumeClaimTemplates</IC>, "each replica needs its own disk + stable name"],
            ["Shared config files (read-only)", <IC key="5">ConfigMap</IC>, "not a volume type, but simpler than PVC for config"],
            ["Shared media uploads (many writers)", <IC key="6">PVC (RWX) + NFS/EFS</IC>, "block storage (EBS) can&apos;t do RWX"],
            ["Dev/test ephemeral DB", <IC key="7">emptyDir</IC>, "or PVC with Delete reclaim — data loss OK"],
            ["Production DB", <IC key="8">PVC (RWO) + Retain policy</IC>, "snapshot before deleting PVC"],
          ]}
        />
        <Callout type="analogy">
          🏗️ <strong>Construction analogy</strong>: <IC>emptyDir</IC> = scaffolding (torn down after the job). <IC>hostPath</IC> = foundation of the building (permanent, but location-locked). <IC>PVC</IC> = rented storage unit (portable, survives you leaving the job site). <IC>StatefulSet</IC> = each worker gets their own labeled locker that follows them around.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="memorize" number="08" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Ephemeral problem", "pod dies → filesystem deleted — volumes persist beyond pod"],
            ["emptyDir", "pod-lifetime scratch space — empty on creation, deleted on pod death"],
            ["hostPath", "⚠️ node-local path — breaks portability, use only for read-only node data"],
            ["PV/PVC model", "PV=resource, PVC=request — binds 1:1, pod mounts PVC not PV"],
            ["Dynamic provisioning", "PVC → StorageClass → provisioner → cloud disk → PV auto-created"],
            ["Access modes", "RWO=one node, ROX=many read-only, RWX=many read-write (needs NFS)"],
            ["Reclaim policy", "Delete=disk deleted with PVC ⚠️ · Retain=manual cleanup"],
            ["StatefulSet names", "<name>-0, <name>-1 — stable across restarts"],
            ["volumeClaimTemplates", "each pod gets its OWN PVC — data-mysql-0, data-mysql-1, data-mysql-2"],
            ["StatefulSet order", "create 0→1→2 sequential · delete 2→1→0 reverse · update newest-first"],
            ["Headless service", "clusterIP: None → DNS per pod: mysql-0.mysql-svc.default.svc.cluster.local"],
            ["Delete StatefulSet", "pods deleted, PVCs KEPT — must delete PVCs manually to reclaim disks"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
