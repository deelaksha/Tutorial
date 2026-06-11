"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "no-labels", label: "Learning Without Labels ⭐" },
  { id: "idea", label: "KMeans: The Idea" },
  { id: "algorithm", label: "The Algorithm, Step by Step" },
  { id: "first", label: "First Clustering" },
  { id: "centroids", label: "Centroids = Group Personalities" },
  { id: "k", label: "Choosing k — The Elbow ⭐" },
  { id: "scaling", label: "Scaling is LIFE or DEATH Here" },
  { id: "limits", label: "Where KMeans Fails" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ClusteringPage() {
  return (
    <TopicShell
      icon="🫧"
      title="Clustering — KMeans"
      gradientWord="Clustering"
      subtitle="Everything so far had answer labels. Now we remove them. Unsupervised learning: hand the machine raw customers and ask 'find the natural groups yourself.'"
      nav={NAV}
      next={{ icon: "📊", label: "Model Evaluation", href: "/ml/evaluation" }}
    >
      {/* 01 ─ NO LABELS */}
      <Section id="no-labels" number="01" title="Learning Without Labels ⭐">
        <P>
          Every model until now needed <IC>y</IC> — the answer column. Clustering has{" "}
          <strong>no y at all</strong>. There is nothing to predict; the job is to{" "}
          <strong>discover structure</strong> hiding in X.
        </P>
        <Table
          head={["", "Supervised (so far)", "Unsupervised (this page)"]}
          rows={[
            ["Data", "X + y (answers included)", "X only — no answers exist"],
            ["Goal", "Predict y for new rows", "Find natural groups in the rows"],
            ["fit call", "fit(X, y)", "fit(X)  ← no y!"],
            ["\"Right answer\"?", "Yes — compare to y_test", "No — judge by usefulness"],
            ["Example", "Will this customer churn?", "What TYPES of customers do we have?"],
          ]}
        />
        <CodeBlock
          code={`# Mall customer data — NO label column anywhere:
#    income  spending_score
#      15        39
#      16        81
#      78        17
#      85        90
#      ...
# Question: are there natural "types" of shoppers in here?`}
          output={`Nobody tagged these customers. No y exists.
Yet there ARE hidden groups — watch the machine find them.`}
        />
        <Callout type="analogy">
          🧦 Supervised = sorting laundry with labeled bins (&quot;shirts&quot;, &quot;socks&quot;).
          Unsupervised = being handed a stranger&apos;s laundry and told &quot;make sensible
          piles&quot;. You don&apos;t know the categories — you invent them from similarity.
        </Callout>
      </Section>

      {/* 02 ─ IDEA */}
      <Section id="idea" number="02" title="KMeans: The Idea in One Picture">
        <P>
          KMeans groups points by distance: points close together belong together. You pick{" "}
          <IC>k</IC> (how many groups), and it finds the best k <strong>centroids</strong> — center
          points of each group.
        </P>
        <CodeBlock
          code={`spending
 100 |  ● ●●        ▲▲ ▲          k = 4 clusters found:
  80 |  ●●  ✛        ▲ ✛▲         ● low income, big spender
  60 |                            ▲ high income, big spender
  40 |  ■ ■                       ■ low income, careful
  20 |  ■✛ ■■        ◆ ✛◆         ◆ high income, careful
   0 |               ◆◆ ◆
     +---------------------- income
        20   40   60   80

 ✛ = centroid (the "center of gravity" of each group)`}
          output={`KMeans answers ONE question:
"which centroid is this point closest to?"
Every point joins its nearest centroid's club.`}
        />
        <Callout type="behind">
          The &quot;K&quot; in KMeans is just the number of clusters you ask for. The
          &quot;Means&quot; is because each centroid is the <em>mean</em> (average position) of its
          members. K averages → KMeans.
        </Callout>
      </Section>

      {/* 03 ─ ALGORITHM */}
      <Section id="algorithm" number="03" title="The Algorithm — 4 Steps, Repeated">
        <FlowDiagram
          steps={[
            { label: "1. Drop k random centroids", sub: "blind guesses to start" },
            { label: "2. Assign", sub: "each point joins nearest centroid" },
            { label: "3. Move", sub: "centroid jumps to mean of its members" },
            { label: "4. Repeat 2-3", sub: "until centroids stop moving" },
          ]}
        />
        <CodeBlock
          title="kmeans_by_hand.py"
          code={`# 1D demo - exam marks, k=2, watch it converge:
marks = [10, 12, 15, 80, 85, 90]

# round 0: random centroids at 15 and 20  (terrible start!)
# assign:  near 15 -> [10, 12, 15]    near 20 -> [80, 85, 90]
# move:    c1 = mean(10,12,15) = 12.3   c2 = mean(80,85,90) = 85.0

# round 1: centroids now 12.3 and 85.0
# assign:  [10, 12, 15] -> 12.3        [80, 85, 90] -> 85.0
# move:    c1 = 12.3 (unchanged)       c2 = 85.0 (unchanged)

# centroids stopped moving -> CONVERGED in 2 rounds`}
          output={`Found groups: "strugglers" around 12, "toppers" around 85.
Nobody told it these groups existed. It discovered them
purely from distances.`}
        />
        <Callout type="analogy">
          🍕 Opening k pizza shops in a city: place shops randomly → every house orders from its
          nearest shop → relocate each shop to the center of its customers → houses re-pick nearest
          shop → repeat. Shops stop moving = optimal locations found.
        </Callout>
      </Section>

      {/* 04 ─ FIRST */}
      <Section id="first" number="04" title="First Clustering with sklearn">
        <CodeBlock
          title="first_kmeans.py"
          code={`from sklearn.cluster import KMeans
import pandas as pd

df = pd.read_csv("customers.csv")        # 200 mall customers
X = df[["income", "spending_score"]]     # NOTE: no y anywhere!

km = KMeans(n_clusters=4, random_state=42, n_init=10)
km.fit(X)                                # fit(X) — no labels passed

df["cluster"] = km.labels_               # group number per customer
print(df.head(6))
print()
print(df["cluster"].value_counts().sort_index())`}
          output={`   income  spending_score  cluster
0      15              39        2
1      16              81        0
2      17               6        2
3      18              77        0
4      19              40        2
5      20              76        0

cluster
0    39
1    58
2    45
3    58
Name: count, dtype: int64`}
        />
        <P>New customers can be assigned to existing groups instantly:</P>
        <CodeBlock
          code={`new_customer = [[60, 85]]      # income 60k, loves spending
print("belongs to cluster:", km.predict(new_customer)[0])`}
          output={`belongs to cluster: 1`}
        />
        <Callout type="mistake">
          ⚠️ Cluster numbers are <strong>arbitrary names</strong>, not rankings. Cluster 3 is not
          &quot;better&quot; than cluster 0 — and re-running with a different{" "}
          <IC>random_state</IC> can shuffle which group gets which number.
        </Callout>
      </Section>

      {/* 05 ─ CENTROIDS */}
      <Section id="centroids" number="05" title="Centroids — Reading Each Group's Personality">
        <P>
          The centroids are the &quot;average member&quot; of each group — read them and the
          clusters tell you their story:
        </P>
        <CodeBlock
          title="personalities.py"
          code={`centers = pd.DataFrame(
    km.cluster_centers_, columns=["income", "spending_score"]
).round(1)
print(centers)`}
          output={`   income  spending_score
0    25.7            79.4
1    86.5            82.1
2    26.3            20.9
3    55.3            49.5`}
        />
        <Table
          head={["Cluster", "Avg income", "Avg spending", "The story you'd tell marketing"]}
          rows={[
            ["0", "25.7k", "79.4", "💳 Young big-spenders — target with offers, watch credit risk"],
            ["1", "86.5k", "82.1", "👑 Premium customers — VIP program, retain at all costs"],
            ["2", "26.3k", "20.9", "🪙 Budget-conscious — discount campaigns"],
            ["3", "55.3k", "49.5", "😐 Average middle — standard treatment"],
          ]}
        />
        <Callout type="tip">
          This last step — turning centroid numbers into <strong>names and actions</strong> — is the
          human&apos;s job. KMeans finds the groups; you give them meaning. That&apos;s what
          &quot;no right answer, judge by usefulness&quot; means in practice.
        </Callout>
      </Section>

      {/* 06 ─ ELBOW */}
      <Section id="k" number="06" title="Choosing k — The Elbow Method ⭐">
        <P>
          KMeans can&apos;t pick k for you — ask for 10 groups and it WILL slice your data into 10,
          meaningful or not. The trick: try many k&apos;s and plot <strong>inertia</strong> (total
          squared distance of points to their centroid — &quot;cluster tightness&quot;, lower =
          tighter):
        </P>
        <CodeBlock
          title="elbow.py"
          code={`for k in range(1, 9):
    km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
    print(f"k={k}:  inertia = {km.inertia_:>9.0f}  "
          + "█" * int(km.inertia_ / 6000))`}
          output={`k=1:  inertia =    269981  ████████████████████████████████████████████
k=2:  inertia =    181363  ██████████████████████████████
k=3:  inertia =    106348  █████████████████
k=4:  inertia =     73679  ████████████   ← bend!
k=5:  inertia =     44448  ███████        ← the ELBOW 🎯
k=6:  inertia =     40825  ██████
k=7:  inertia =     37233  ██████
k=8:  inertia =     34011  █████`}
        />
        <P>
          Inertia <em>always</em> decreases as k grows (more centroids = everyone is closer to
          one). You&apos;re not looking for the minimum — you&apos;re looking for the{" "}
          <strong>elbow</strong>: the k where improvements suddenly become tiny. Here: big drops
          until k=5, then almost flat → choose <IC>k=5</IC>.
        </P>
        <Callout type="analogy">
          💪 The plot looks like a bent arm. Steep upper arm → forearm flattening out. The joint —
          the elbow — is where adding clusters stops paying for itself.
        </Callout>
        <Callout type="mistake">
          ⚠️ k = number of rows gives inertia 0 (every point its own cluster) — a &quot;perfect&quot;
          score and a completely useless model. Lowest inertia is NOT the goal; the elbow is.
        </Callout>
      </Section>

      {/* 07 ─ SCALING */}
      <Section id="scaling" number="07" title="Scaling is LIFE or DEATH for KMeans">
        <P>
          KMeans = distances, and distances are dominated by the biggest-range feature. Income in
          rupees (30,000–90,000) vs age (22–60): income differences are ~1000× larger, so age{" "}
          <strong>literally stops existing</strong>:
        </P>
        <CodeBlock
          title="scaling_matters.py"
          code={`from sklearn.preprocessing import StandardScaler

# Distance, unscaled:
# A = (age 25, income 50000),  B = (age 60, income 51000)
# diff:  age 35  vs  income 1000
# dist = sqrt(35² + 1000²) = sqrt(1225 + 1000000) ≈ 1000.6
# age contributed 0.1%. A 25-yr-old and 60-yr-old look IDENTICAL.

X_scaled = StandardScaler().fit_transform(X)   # both now mean 0, std 1

km_bad  = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
km_good = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X_scaled)`}
          output={`unscaled clusters: split ONLY by income — age ignored
scaled clusters  : real groups (young-rich, old-careful, ...)

Same data. Same algorithm. Different universe.`}
        />
        <Table
          head={["Model family", "Scaling needed?", "Why"]}
          rows={[
            ["KMeans / distance-based", "🚨 MANDATORY", "Distances are the entire algorithm"],
            ["Linear/Logistic + gradient descent", "Strongly recommended", "Lopsided loss valley converges badly"],
            ["Trees / Random Forest", "Not needed", "Questions like x <= 5 ignore scale"],
          ]}
        />
        <Callout type="behind">
          Full pipeline for clustering is therefore: <IC>StandardScaler().fit_transform(X)</IC> →
          elbow on scaled X → <IC>KMeans(k)</IC> → but report centroids in{" "}
          <em>original units</em> via <IC>scaler.inverse_transform(km.cluster_centers_)</IC> so
          humans can read them.
        </Callout>
      </Section>

      {/* 08 ─ LIMITS */}
      <Section id="limits" number="08" title="Where KMeans Fails">
        <CodeBlock
          code={`Works great 🎯              Fails 💥

  ●●●      ▲▲▲             ●●●●●●●●●●        ring around
 ●●●●●    ▲▲▲▲▲            ●          ●      a blob:
  ●●●      ▲▲▲             ●   ▲▲▲    ●      kmeans slices it
                            ●   ▲▲▲    ●      like a pizza 🍕
 round, similar-size,       ●          ●      instead of
 well-separated blobs        ●●●●●●●●●●       ring vs center`}
          output={`KMeans assumes clusters are ROUND and similar in size.
Rings, moons, snakes, very unequal groups -> wrong cuts.`}
        />
        <Table
          head={["Limitation", "Consequence", "Escape hatch"]}
          rows={[
            ["Assumes round clusters", "Slices rings/moons wrongly", "DBSCAN (density-based clustering)"],
            ["You must choose k", "Wrong k = forced, fake groups", "Elbow method, domain knowledge"],
            ["Random start", "Can converge to a bad layout", "n_init=10 (10 restarts, keep best) — default"],
            ["Outliers drag centroids", "One billionaire warps a cluster", "Remove outliers in data prep"],
          ]}
        />
        <Callout type="note">
          KMeans is still the first tool to reach for — it&apos;s fast, simple, and most real
          customer/measurement data forms roughly round blobs. Know its blind spots; use it anyway.
        </Callout>
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases">
        <P>
          <strong>Case 1: Passing y out of habit:</strong>
        </P>
        <CodeBlock
          code={`km = KMeans(n_clusters=4)
km.fit(X, y)         # y is silently IGNORED, not used!
                      # (sklearn accepts it for API compatibility)`}
          output={`No crash — worse: silent confusion.
Clustering NEVER uses labels. If you have y, you probably
wanted a classifier, not clustering.`}
        />
        <P>
          <strong>Case 2: More clusters than data points:</strong>
        </P>
        <CodeBlock
          code={`X_tiny = [[1, 2], [3, 4], [5, 6]]     # 3 points
km = KMeans(n_clusters=8).fit(X_tiny)  # 8 groups from 3 points?!`}
          error
          output={`ValueError: n_samples=3 should be >= n_clusters=8.`}
        />
        <P>
          <strong>Case 3: NaN in the data:</strong>
        </P>
        <CodeBlock
          code={`km.fit(X)        # one customer's income is NaN`}
          error
          output={`ValueError: Input X contains NaN.
KMeans does not accept missing values encoded as NaN natively.`}
        />
        <P>Data Prep page strikes again: <IC>fillna</IC> before clustering.</P>
        <P>
          <strong>Case 4: Comparing cluster numbers across runs — silent bug:</strong>
        </P>
        <CodeBlock
          code={`km1 = KMeans(n_clusters=3, n_init=10).fit(X)   # no random_state
km2 = KMeans(n_clusters=3, n_init=10).fit(X)
print(km1.labels_[:8])
print(km2.labels_[:8])`}
          output={`[0 2 0 1 2 1 0 2]
[1 0 1 2 0 2 1 0]
# SAME groups, DIFFERENT numbering! Cluster "0" in run 1
# is cluster "1" in run 2. Never hardcode cluster ids -
# identify groups by their CENTROIDS, not their numbers.`}
        />
        <Callout type="mistake">
          ⚠️ The classic report-breaker: you label cluster 2 as &quot;VIP customers&quot; on Monday,
          re-run the notebook on Tuesday, and cluster 2 is now the budget shoppers. Pin{" "}
          <IC>random_state</IC> and always sanity-check centroids.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Unsupervised means", "No y, no answers — fit(X) discovers structure by itself"],
            ["KMeans groups by", "Distance — each point joins its NEAREST centroid"],
            ["The loop", "assign to nearest → move centroid to mean → repeat until still"],
            ["Centroid", "Average position of a cluster's members — the group's 'personality'"],
            ["k", "Number of clusters — YOU choose it, KMeans can't"],
            ["Inertia", "Total squared distance to centroids. Lower = tighter. Always falls as k grows"],
            ["Elbow method", "Plot inertia vs k — pick the bend where improvement flattens"],
            ["Scaling for KMeans", "MANDATORY — biggest-range feature otherwise owns all distances"],
            ["Cluster numbers", "Arbitrary names, can shuffle between runs — identify groups by centroids"],
            ["KMeans assumes", "Round, similar-size blobs. Rings/moons → use DBSCAN instead"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
