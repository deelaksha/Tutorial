"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "A Tree = Learned if/else" },
  { id: "first-tree", label: "Train & Draw a Tree" },
  { id: "how-split", label: "How Splits Are Chosen" },
  { id: "overfit", label: "Trees Memorize ⭐" },
  { id: "depth", label: "max_depth — Pruning" },
  { id: "forest", label: "Random Forest — 100 Trees Vote ⭐" },
  { id: "importance", label: "feature_importances_" },
  { id: "vs", label: "Trees vs Linear Models" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function DecisionTreesPage() {
  return (
    <TopicShell
      icon="🌳"
      title="Decision Trees & Random Forest"
      gradientWord="Trees"
      subtitle="A model you can literally read: a flowchart of if/else questions, learned automatically from data. Then the fix for its one big weakness — let 100 slightly-different trees vote."
      nav={NAV}
      next={{ icon: "🫧", label: "Clustering — KMeans", href: "/ml/clustering" }}
    >
      {/* 01 ─ IDEA */}
      <Section id="idea" number="01" title="A Tree is Just Learned if/else">
        <P>
          You already write decision trees by hand — every time you write nested{" "}
          <IC>if/else</IC>. The only difference: here the machine picks the questions and the
          cut-off numbers <strong>by itself, from data</strong>.
        </P>
        <CodeBlock
          title="what_it_learns.py"
          code={`# A trained tree IS this code - the machine wrote it:
def predict(hours, attendance):
    if hours <= 4.5:
        if attendance <= 70:
            return "FAIL"
        else:
            return "FAIL"      # close, but still fail
    else:
        if attendance <= 40:
            return "FAIL"      # smart but never showed up
        else:
            return "PASS"`}
          output={`            [hours <= 4.5?]
             ╱           ╲
          yes             no
           ╱               ╲
   [attend <= 70?]   [attend <= 40?]
     ╱       ╲          ╱       ╲
   FAIL     FAIL      FAIL     PASS`}
        />
        <Table
          head={["Tree word", "Meaning"]}
          rows={[
            ["Root node", "The first, most important question (top of the tree)"],
            ["Internal node", "Any follow-up question"],
            ["Leaf", "A final answer — no more questions"],
            ["Depth", "Longest chain of questions from root to leaf"],
          ]}
        />
        <Callout type="analogy">
          🩺 It&apos;s exactly the game &quot;20 Questions&quot;: each question splits the
          possibilities, and a good player asks the most-splitting question first. The tree plays 20
          Questions against your data.
        </Callout>
      </Section>

      {/* 02 ─ FIRST TREE */}
      <Section id="first-tree" number="02" title="Train One & Read Its Mind">
        <P>
          Same sklearn skeleton as always — only step 6 changes. Bonus: trees can print their own
          logic:
        </P>
        <CodeBlock
          title="first_tree.py"
          code={`from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
import pandas as pd

df = pd.read_csv("students.csv")
X = df[["hours", "attendance"]]
y = df["passed"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

tree = DecisionTreeClassifier(max_depth=2, random_state=42)
tree.fit(X_train, y_train)

print(export_text(tree, feature_names=["hours", "attendance"]))
print("test accuracy:", round(tree.score(X_test, y_test), 2))`}
          output={`|--- hours <= 4.55
|   |--- attendance <= 72.50
|   |   |--- class: 0
|   |--- attendance >  72.50
|   |   |--- class: 0
|--- hours >  4.55
|   |--- attendance <= 41.00
|   |   |--- class: 0
|   |--- attendance >  41.00
|   |   |--- class: 1

test accuracy: 0.85`}
        />
        <P>
          The cut-offs <IC>4.55</IC> and <IC>72.50</IC> weren&apos;t given by anyone — the tree{" "}
          <strong>discovered</strong> them. And unlike most models, you can read exactly why any
          prediction was made.
        </P>
        <Callout type="tip">
          Two superpowers hiding here: trees need <strong>no feature scaling</strong> (a question
          like <IC>salary &lt;= 50000</IC> doesn&apos;t care about scale) and they handle{" "}
          <strong>curves &amp; weird shapes</strong> that defeat straight-line models.
        </Callout>
      </Section>

      {/* 03 ─ HOW SPLIT */}
      <Section id="how-split" number="03" title="How Does It Choose Questions? Purity.">
        <P>
          At every node the tree tries <em>all</em> possible questions and keeps the one that
          produces the <strong>purest</strong> groups — groups closest to all-PASS or all-FAIL:
        </P>
        <CodeBlock
          code={`Start: 10 students  [5 PASS, 5 FAIL]  ← maximally mixed (impure)

Candidate A: "attendance <= 50?"
   left:  [2 PASS, 3 FAIL]   still mixed 😕
   right: [3 PASS, 2 FAIL]   still mixed 😕     → weak question

Candidate B: "hours <= 4.5?"
   left:  [0 PASS, 5 FAIL]   PURE! ✅
   right: [5 PASS, 0 FAIL]   PURE! ✅           → perfect question

Tree picks B. Repeat inside each group until pure (or depth limit).`}
          output={`"Purity" is measured by gini impurity (default) or entropy.
gini = 0.0  → all one class  (perfect leaf)
gini = 0.5  → 50/50 mix      (useless split)`}
        />
        <FlowDiagram
          steps={[
            { label: "Try every feature", sub: "and every cut-off value" },
            { label: "Measure purity gain", sub: "gini before vs after" },
            { label: "Keep best question", sub: "greedy — best NOW" },
            { label: "Recurse on children", sub: "until pure or max_depth" },
          ]}
        />
        <Callout type="behind">
          The tree is <strong>greedy</strong> — it picks the best question at each step without
          looking ahead. That makes training fast, but means slightly different data can produce a
          completely different tree. Remember this; it explains forests in a minute.
        </Callout>
      </Section>

      {/* 04 ─ OVERFIT */}
      <Section id="overfit" number="04" title="The Weakness: Trees Memorize ⭐">
        <P>
          Leave a tree unlimited and it will keep asking questions until <em>every single training
          row</em> has its own private leaf — the purest memorization machine in ML:
        </P>
        <CodeBlock
          title="memorizer.py"
          code={`deep = DecisionTreeClassifier(random_state=42)   # NO depth limit
deep.fit(X_train, y_train)

print("depth grown :", deep.get_depth())
print("leaves      :", deep.get_n_leaves())
print("train score :", deep.score(X_train, y_train))
print("test  score :", deep.score(X_test, y_test))`}
          output={`depth grown : 14
leaves      : 87
train score : 1.0     ← memorized all 160 students
test  score : 0.72    ← stumbles on new ones`}
        />
        <P>
          You&apos;ve seen this exact signature on the Train/Test page: <strong>train 1.0, test
          0.72 = overfitting</strong>. The tree grew 87 leaves to explain 160 students — it learned
          the noise, not the pattern.
        </P>
        <Callout type="analogy">
          🧠 A tree with unlimited depth is the student who memorizes every past paper word-for-word
          — including the typos. Perfect on homework, lost on the real exam.
        </Callout>
      </Section>

      {/* 05 ─ DEPTH */}
      <Section id="depth" number="05" title="max_depth — Forcing It To Generalize">
        <P>Cap the questions and the tree must learn broad rules instead of trivia:</P>
        <CodeBlock
          title="depth_sweep.py"
          code={`for depth in [1, 2, 3, 5, 10, None]:
    t = DecisionTreeClassifier(max_depth=depth, random_state=42)
    t.fit(X_train, y_train)
    print(f"depth={str(depth):<5} train={t.score(X_train, y_train):.2f}"
          f"  test={t.score(X_test, y_test):.2f}")`}
          output={`depth=1     train=0.78  test=0.75   ← underfit (too simple)
depth=2     train=0.86  test=0.85
depth=3     train=0.90  test=0.88   ← sweet spot 🎯
depth=5     train=0.96  test=0.82   ← starting to memorize
depth=10    train=1.00  test=0.74
depth=None  train=1.00  test=0.72   ← full memorization`}
        />
        <P>
          Read the test column: it rises, peaks at depth 3, then <em>falls</em> while train keeps
          climbing. That peak is exactly the underfit/overfit balance from the Train/Test page,
          drawn in numbers.
        </P>
        <Table
          head={["Knob", "What it limits", "Typical values"]}
          rows={[
            ["max_depth", "Questions per chain", "3–10"],
            ["min_samples_leaf", "Smallest allowed leaf (no private leaves!)", "5–50"],
            ["min_samples_split", "Don't split tiny groups", "10–100"],
          ]}
        />
        <Callout type="tip">
          These knobs are called <strong>hyperparameters</strong> — settings YOU choose, not learned
          from data. Tuning them = trying values and watching the <em>test</em> score.
        </Callout>
      </Section>

      {/* 06 ─ FOREST */}
      <Section id="forest" number="06" title="Random Forest — Let 100 Trees Vote ⭐">
        <P>
          The genius fix for memorization: train <strong>many different trees</strong> and take a
          majority vote. Each tree sees a random sample of rows and random subsets of features — so
          each memorizes <em>different</em> noise, and the noise cancels out in the vote. The shared
          signal survives.
        </P>
        <CodeBlock
          title="forest.py"
          code={`from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(
    n_estimators=100,    # 100 trees
    random_state=42
)
forest.fit(X_train, y_train)

print("single deep tree  test:", round(deep.score(X_test, y_test), 2))
print("random forest     test:", round(forest.score(X_test, y_test), 2))
print()
print("one student, the vote:", forest.predict([[4.5, 85]]),
      forest.predict_proba([[4.5, 85]]).round(2))`}
          output={`single deep tree  test: 0.72
random forest     test: 0.90

one student, the vote: [1] [[0.23 0.77]]`}
        />
        <FlowDiagram
          steps={[
            { label: "100 random samples", sub: "each tree gets different rows" },
            { label: "100 trees trained", sub: "each also sees random features" },
            { label: "New student arrives", sub: "all 100 trees predict" },
            { label: "Vote: 77 PASS / 23 FAIL", sub: "majority wins → PASS" },
          ]}
        />
        <P>
          That <IC>[[0.23 0.77]]</IC> is literally the vote count: 77 of 100 trees said PASS.
        </P>
        <Callout type="analogy">
          🧑‍⚖️ One doctor can be biased or having a bad day. A panel of 100 doctors — each trained at
          a different hospital — voting together is far harder to fool. Wisdom of the crowd, for
          models.
        </Callout>
        <Callout type="behind">
          The price: you lose readability (you can&apos;t print 100 overlapping flowcharts) and
          predictions are ~100× slower than one tree. Usually worth it — random forest is the
          default &quot;just works&quot; model for tabular data.
        </Callout>
      </Section>

      {/* 07 ─ IMPORTANCE */}
      <Section id="importance" number="07" title="feature_importances_ — What Mattered?">
        <P>
          Forests keep one beautiful explainability feature: they report how much each column
          contributed to the decisions:
        </P>
        <CodeBlock
          title="importance.py"
          code={`import pandas as pd

X = df[["hours", "attendance", "sleep", "shoe_size"]]
forest = RandomForestClassifier(n_estimators=100, random_state=42)
forest.fit(X_train, y_train)

imp = pd.Series(forest.feature_importances_, index=X.columns)
for name, v in imp.sort_values(ascending=False).items():
    print(f"  {name:<11} {v:.2f}  " + "█" * int(v * 40))`}
          output={`  hours       0.52  ████████████████████
  attendance  0.31  ████████████
  sleep       0.14  █████
  shoe_size   0.03  █`}
        />
        <P>
          The forest just told you: studying hours dominate, attendance matters, sleep helps a
          little — and shoe size is noise (as expected!). Importances always sum to 1.0.
        </P>
        <Callout type="tip">
          Practical use: train a quick forest, check importances, <strong>drop the near-zero
          columns</strong>, retrain. Free feature selection.
        </Callout>
      </Section>

      {/* 08 ─ VS */}
      <Section id="vs" number="08" title="Trees vs Linear Models — Which Tool When?">
        <Table
          head={["", "Linear / Logistic 📏", "Tree 🌳", "Random Forest 🌲🌲🌲"]}
          rows={[
            ["Boundary shape", "Straight line only", "Rectangles (axis cuts)", "Smooth-ish rectangles"],
            ["Needs scaling?", "Yes", "No ✅", "No ✅"],
            ["Handles curves?", "No", "Yes ✅", "Yes ✅"],
            ["Explainable?", "coef_ per feature", "Print the whole flowchart ✅", "Only importances"],
            ["Overfit risk", "Low", "VERY HIGH", "Low (votes cancel noise)"],
            ["Speed", "Fastest", "Fast", "100× a tree"],
            ["Reach for it when", "Simple relations, need coefficients", "Need to SHOW the rules", "Default for tabular data 🏆"],
          ]}
        />
        <CodeBlock
          code={`# The data that breaks a line and feeds a tree:
attend                            attend
 100 | ❌ ❌ ✅ ✅ ❌ ❌            a straight boundary CANNOT
  50 | ❌ ✅ ✅ ✅ ✅ ❌            carve out the middle island
   0 | ❌ ❌ ❌ ❌ ❌ ❌            a tree does it in 4 questions:
     +----------------- hours      hours>2, hours<5,
       0  2  4  6  8 10            attend>40, attend<100  ✅`}
          output={`Rule of thumb:
straight-ish pattern  → linear/logistic (simple, explainable)
anything else tabular → random forest first`}
        />
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases & Silent Traps">
        <P>
          <strong>Case 1: Strings still crash trees</strong> — &quot;trees don&apos;t need
          scaling&quot; ≠ &quot;trees eat text&quot;:
        </P>
        <CodeBlock
          code={`X = df[["hours", "city"]]      # city = "Bangalore"...
tree.fit(X, y)`}
          error
          output={`ValueError: could not convert string to float: 'Bangalore'`}
        />
        <P>Encoding is still required (Data Prep page). Only <em>scaling</em> is optional.</P>
        <P>
          <strong>Case 2: The no-limits tree — silent overfit:</strong>
        </P>
        <CodeBlock
          code={`tree = DecisionTreeClassifier()    # all defaults
tree.fit(X_train, y_train)
print("accuracy:", tree.score(X_train, y_train))   # ❌ train score!`}
          output={`accuracy: 1.0
# No crash, no warning. Two stacked mistakes:
#   1) unlimited depth -> memorized everything
#   2) scored on TRAIN -> the lie looks perfect
# Always: set max_depth, score on TEST.`}
        />
        <P>
          <strong>Case 3: Forgetting random_state — different tree every run:</strong>
        </P>
        <CodeBlock
          code={`t1 = DecisionTreeClassifier().fit(X_train, y_train)
t2 = DecisionTreeClassifier().fit(X_train, y_train)
print(t1.score(X_test, y_test), t2.score(X_test, y_test))`}
          output={`0.82 0.79
# Tie-breaking between equally-good splits is random.
# Debugging or comparing? Always pass random_state=42.`}
        />
        <P>
          <strong>Case 4: Trees can&apos;t extrapolate (regression trees):</strong>
        </P>
        <CodeBlock
          code={`from sklearn.tree import DecisionTreeRegressor
# trained on houses 1000-2000 sqft (prices 50-99 lakhs)
r = DecisionTreeRegressor().fit(X_train, y_train)
print(r.predict([[5000]]))     # mansion, way outside training range`}
          output={`[99.]
# A tree can only answer with values it SAW in leaves.
# 5000 sqft falls into the "biggest houses" leaf -> 99. Forever.
# A linear model would extrapolate the line; a tree cannot.`}
        />
        <Callout type="mistake">
          ⚠️ Trees predict from <strong>inside their experience</strong> only. For anything outside
          the training range, they flat-line at the edge leaf.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["A decision tree is", "if/else questions LEARNED from data — readable as a flowchart"],
            ["Splits are chosen by", "Purity gain (gini): the question that best separates classes"],
            ["Trees' superpowers", "No scaling needed, handles curves, fully explainable"],
            ["Trees' weakness", "Unlimited depth = memorizes train data (train 1.0, test 0.72)"],
            ["max_depth", "The main anti-overfit knob. Sweep it, watch the TEST score peak"],
            ["Hyperparameter", "A setting YOU pick (max_depth, n_estimators) — not learned from data"],
            ["Random forest", "100 trees on random rows/features → majority vote → noise cancels"],
            ["predict_proba in forests", "Literally the vote: [[0.23 0.77]] = 77 trees said class 1"],
            ["feature_importances_", "What mattered, sums to 1.0 — free feature selection"],
            ["Default for tabular data", "RandomForestClassifier(n_estimators=100) — start here 🏆"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
