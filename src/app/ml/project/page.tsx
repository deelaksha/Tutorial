"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "mission", label: "The Mission" },
  { id: "explore", label: "Step 1 — Explore" },
  { id: "clean", label: "Step 2 — Clean & Encode" },
  { id: "split", label: "Step 3 — Split" },
  { id: "baseline", label: "Step 4 — Baseline First ⭐" },
  { id: "compare", label: "Step 5 — Compare Models" },
  { id: "tune", label: "Step 6 — Tune" },
  { id: "evaluate", label: "Step 7 — Final Evaluation" },
  { id: "save", label: "Step 8 — Save & Reuse ⭐" },
  { id: "script", label: "The Whole Script" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function ProjectPage() {
  return (
    <TopicShell
      icon="🏁"
      title="End-to-End Project"
      gradientWord="Project"
      subtitle="Everything from the previous 9 cards, combined into one real project: predict which customers will cancel their subscription — from raw CSV to a saved model answering live questions."
      nav={NAV}
      next={{ icon: "🤖", label: "All ML Topics", href: "/ml" }}
    >
      {/* 01 ─ MISSION */}
      <Section id="mission" number="01" title="The Mission — Churn Prediction">
        <P>
          A streaming company hands you <IC>churn.csv</IC>: 1,000 customers, and whether they
          cancelled (&quot;churned&quot;) last month. Goal: <strong>predict who will cancel
          next</strong>, so the retention team can call them first.
        </P>
        <CodeBlock
          code={`churn.csv — 1000 rows:

   age  monthly_fee  months_active  support_calls  plan      churned
0   34        499            26              0     premium   0
1   22        199             3              4     basic     1
2   45        499            48              1     premium   0
3   27        199             5              6     basic     1
4   31        299            14              2     standard  0
...`}
          output={`Label:    churned (1 = cancelled)  → CLASSIFICATION
Features: everything else
Plan:     the 7-step workflow from the Intro page,
          now with real muscle behind every step.`}
        />
        <FlowDiagram
          steps={[
            { label: "Explore", sub: "know your data" },
            { label: "Clean + Encode", sub: "data-prep page" },
            { label: "Split", sub: "train-test page" },
            { label: "Baseline → Models", sub: "logistic, forest" },
            { label: "Tune + Evaluate", sub: "evaluation page" },
            { label: "Save + Predict", sub: "ship it 🚀" },
          ]}
        />
        <Callout type="tip">
          Notice which page each step comes from. Nothing on this page is new — that&apos;s the
          point. Real ML is the same 8 moves, every single time.
        </Callout>
      </Section>

      {/* 02 ─ EXPLORE */}
      <Section id="explore" number="02" title="Step 1 — Explore Before You Touch">
        <CodeBlock
          title="explore.py"
          code={`import pandas as pd

df = pd.read_csv("churn.csv")

print(df.shape)
print(df["churned"].value_counts())
print(df.isnull().sum())`}
          output={`(1000, 6)

churned
0    800
1    200
Name: count, dtype: int64

age               0
monthly_fee       0
months_active    23
support_calls     0
plan             12
churned           0
dtype: int64`}
        />
        <P>Three discoveries in ten seconds, each changing the plan:</P>
        <Table
          head={["Finding", "Consequence"]}
          rows={[
            ["800 vs 200 — imbalanced (20% churn)", "Accuracy will lie → we'll judge by F1/recall, and stratify the split"],
            ["months_active has 23 NaNs", "fillna with median (it's a number)"],
            ["plan has 12 NaNs + is text", "fillna with mode, then one-hot encode"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Skipping exploration is how people end up reporting 80% accuracy on a dataset where
          guessing &quot;no churn&quot; scores 80% for free. Always check{" "}
          <IC>value_counts()</IC> on the label first.
        </Callout>
      </Section>

      {/* 03 ─ CLEAN */}
      <Section id="clean" number="03" title="Step 2 — Clean & Encode (Data Prep Page)">
        <CodeBlock
          title="clean.py"
          code={`# 1) missing numbers -> median
df["months_active"] = df["months_active"].fillna(df["months_active"].median())

# 2) missing categories -> most common value
df["plan"] = df["plan"].fillna(df["plan"].mode()[0])

# 3) text -> numbers (one-hot)
df = pd.get_dummies(df, columns=["plan"], dtype=int)

print(df.isnull().sum().sum(), "NaNs remain")
print(df.columns.tolist())`}
          output={`0 NaNs remain
['age', 'monthly_fee', 'months_active', 'support_calls',
 'churned', 'plan_basic', 'plan_premium', 'plan_standard']`}
        />
        <P>
          <IC>plan</IC> became three 0/1 columns — no fake ordering invented, exactly like the Data
          Prep page warned. The table is now 100% numeric and NaN-free: model-ready.
        </P>
        <Callout type="behind">
          We&apos;ll use a Random Forest as the main model, so <strong>no scaling needed</strong>{" "}
          (trees ignore scale). If we end up shipping Logistic Regression we&apos;ll scale inside
          its own pipeline — fit on train only.
        </Callout>
      </Section>

      {/* 04 ─ SPLIT */}
      <Section id="split" number="04" title="Step 3 — Split (Train/Test Page)">
        <CodeBlock
          title="split.py"
          code={`from sklearn.model_selection import train_test_split

X = df.drop("churned", axis=1)
y = df["churned"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y          # imbalanced -> keep 20% churn in BOTH halves
)

print("train:", X_train.shape, " churn rate:", y_train.mean())
print("test :", X_test.shape, " churn rate:", y_test.mean())`}
          output={`train: (800, 7)  churn rate: 0.2
test : (200, 7)  churn rate: 0.2`}
        />
        <P>
          <IC>stratify=y</IC> kept exactly 20% churners on both sides. From this line on, the test
          set is <strong>sealed</strong> — we won&apos;t touch it until step 7.
        </P>
      </Section>

      {/* 05 ─ BASELINE */}
      <Section id="baseline" number="05" title="Step 4 — Baseline First ⭐">
        <P>
          Before any clever model, ask: <strong>what score does a brain-dead strategy get?</strong>{" "}
          Every real model must beat this number to justify existing:
        </P>
        <CodeBlock
          title="baseline.py"
          code={`from sklearn.dummy import DummyClassifier
from sklearn.metrics import f1_score

dummy = DummyClassifier(strategy="most_frequent")   # always says "no churn"
dummy.fit(X_train, y_train)

print("baseline accuracy:", dummy.score(X_test, y_test))
print("baseline F1      :", f1_score(y_test, dummy.predict(X_test)))`}
          output={`baseline accuracy: 0.8
baseline F1      : 0.0`}
        />
        <P>
          There&apos;s the trap, quantified: <strong>80% accuracy is free</strong> on this data.
          Any model bragging about 80% accuracy has learned nothing. F1 = 0.0 is the honest
          baseline to beat.
        </P>
        <Callout type="analogy">
          🏃 A race time means nothing until you know what walking scores. The dummy classifier is
          &quot;walking&quot; — your model only impresses by the distance it beats it.
        </Callout>
      </Section>

      {/* 06 ─ COMPARE */}
      <Section id="compare" number="06" title="Step 5 — Compare Models (Cross-Validation)">
        <P>
          Two candidates from earlier pages. Compare with cross-validation on the{" "}
          <em>training</em> set only — the test set stays sealed:
        </P>
        <CodeBlock
          title="compare.py"
          code={`from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

models = {
    "logistic": make_pipeline(StandardScaler(), LogisticRegression()),
    "forest":   RandomForestClassifier(n_estimators=100, random_state=42),
}

for name, m in models.items():
    scores = cross_val_score(m, X_train, y_train, cv=5, scoring="f1")
    print(f"{name:<9} F1 = {scores.mean():.2f} ± {scores.std():.2f}")`}
          output={`logistic  F1 = 0.61 ± 0.04
forest    F1 = 0.74 ± 0.03`}
        />
        <P>
          Forest wins clearly (0.74 vs 0.61) and is stable (±0.03). Note the logistic entry used a{" "}
          <IC>pipeline</IC> so scaling happens <em>inside</em> each CV fold — fit on that fold&apos;s
          train part only. That&apos;s the leakage rule, automated.
        </P>
        <Callout type="tip">
          <IC>scoring=&quot;f1&quot;</IC> because accuracy lies here. cross_val_score can rank
          models by whatever metric actually matters for your problem.
        </Callout>
      </Section>

      {/* 07 ─ TUNE */}
      <Section id="tune" number="07" title="Step 6 — Tune the Winner">
        <P>
          Sweep the forest&apos;s main knobs, still with CV, still without touching the test set:
        </P>
        <CodeBlock
          title="tune.py"
          code={`from sklearn.model_selection import GridSearchCV

grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid={
        "n_estimators":     [100, 300],
        "max_depth":        [5, 10, None],
        "min_samples_leaf": [1, 5, 20],
    },
    scoring="f1",
    cv=5,
)
grid.fit(X_train, y_train)     # tries all 2*3*3 = 18 combos x 5 folds

print("best params:", grid.best_params_)
print("best CV F1 :", round(grid.best_score_, 2))
model = grid.best_estimator_   # the tuned forest, refit on all of train`}
          output={`best params: {'max_depth': 10, 'min_samples_leaf': 5, 'n_estimators': 300}
best CV F1 : 0.78`}
        />
        <P>
          0.74 → 0.78 from tuning. <IC>min_samples_leaf=5</IC> and <IC>max_depth=10</IC> are doing
          exactly what the Trees page taught: blocking memorization.
        </P>
        <Callout type="behind">
          GridSearchCV = three earlier ideas glued together: hyperparameters (Trees page) ×
          cross-validation (Evaluation page) × a fair metric (F1). 90 model fits, one line.
        </Callout>
      </Section>

      {/* 08 ─ EVALUATE */}
      <Section id="evaluate" number="08" title="Step 7 — Break the Seal: Final Evaluation">
        <P>
          Now — and only now — the sealed test set comes out. One shot, full honesty:
        </P>
        <CodeBlock
          title="final_eval.py"
          code={`from sklearn.metrics import classification_report, confusion_matrix

y_pred = model.predict(X_test)

print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred, target_names=["stays", "churns"]))`}
          output={`[[152   8]
 [ 12  28]]

              precision    recall  f1-score   support

       stays       0.93      0.95      0.94       160
      churns       0.78      0.70      0.74        40

    accuracy                           0.90       200
   macro avg       0.85      0.82      0.84       200`}
        />
        <Table
          head={["Number", "Plain English for the retention team"]}
          rows={[
            ["recall (churns) = 0.70", "We catch 28 of every 40 customers about to cancel"],
            ["precision (churns) = 0.78", "When we flag someone, we're right ~4 times out of 5"],
            ["FP = 8", "8 happy customers get an unnecessary retention call — cheap mistake"],
            ["FN = 12", "12 churners slip away uncalled — the costly mistake"],
            ["vs baseline F1 0.0", "The model earns its keep: 0.74 vs 0.0"],
          ]}
        />
        <Callout type="tip">
          Want to catch more churners? Lower the threshold via{" "}
          <IC>predict_proba</IC> (Logistic page) — recall rises, precision drops, and a retention
          call is cheap. <strong>That&apos;s a business call, made with model numbers.</strong>
        </Callout>
      </Section>

      {/* 09 ─ SAVE */}
      <Section id="save" number="09" title="Step 8 — Save & Reuse the Model ⭐">
        <P>
          Training took minutes; you don&apos;t retrain every time someone wants a prediction. Save
          the trained model to a file with <IC>joblib</IC>:
        </P>
        <CodeBlock
          title="save_model.py"
          code={`import joblib

joblib.dump(model, "churn_model.joblib")
joblib.dump(X.columns.tolist(), "feature_order.joblib")  # column order matters!
print("saved.")`}
          output={`saved.`}
        />
        <P>Days later, a different script — no training, instant answers:</P>
        <CodeBlock
          title="use_model.py"
          code={`import joblib
import pandas as pd

model = joblib.load("churn_model.joblib")
cols  = joblib.load("feature_order.joblib")

# new customer arrives from the website:
new = pd.DataFrame([{
    "age": 24, "monthly_fee": 199, "months_active": 4,
    "support_calls": 5, "plan_basic": 1, "plan_premium": 0,
    "plan_standard": 0,
}])[cols]                          # enforce same column order!

print("will churn?  ", model.predict(new)[0])
print("probability :", model.predict_proba(new)[0][1].round(2))`}
          output={`will churn?   1
probability : 0.83

# -> retention team calls this customer TODAY. 📞`}
        />
        <Callout type="mistake">
          ⚠️ New data must pass through the <strong>exact same prep</strong>: same columns, same
          order, same encoding (and same scaler, if you used one — save it too). A model fed
          differently-shaped data either crashes or, worse, predicts garbage silently.
        </Callout>
      </Section>

      {/* 10 ─ SCRIPT */}
      <Section id="script" number="10" title="The Whole Project — One Readable Script">
        <CodeBlock
          title="churn_project.py — the full pipeline"
          code={`import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 1-2) LOAD + CLEAN + ENCODE
df = pd.read_csv("churn.csv")
df["months_active"] = df["months_active"].fillna(df["months_active"].median())
df["plan"] = df["plan"].fillna(df["plan"].mode()[0])
df = pd.get_dummies(df, columns=["plan"], dtype=int)

# 3) SPLIT (test set sealed from here on)
X, y = df.drop("churned", axis=1), df["churned"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# 4-6) TUNE the model with cross-validation, on train only
grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    {"n_estimators": [100, 300], "max_depth": [5, 10, None],
     "min_samples_leaf": [1, 5, 20]},
    scoring="f1", cv=5)
grid.fit(X_train, y_train)
model = grid.best_estimator_

# 7) FINAL honest evaluation - one shot
print(classification_report(y_test, model.predict(X_test)))

# 8) SHIP
joblib.dump(model, "churn_model.joblib")`}
          output={`~25 lines. Every line is a card from this track:
prep · split · baseline thinking · CV · tuning ·
honest metrics · persistence.

You can now train a model from scratch to end. 🏁🎉`}
        />
        <Callout type="analogy">
          🧗 Look back at the Intro page&apos;s 7-step workflow diagram — you just climbed it for
          real. Every future project, whatever the data, is this same ladder with different rungs
          painted on.
        </Callout>
      </Section>

      {/* 11 ─ MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This — The Project Checklist">
        <MemorizeGrid
          items={[
            ["1. Explore first", "shape, value_counts on label, isnull().sum() — 10 seconds, saves hours"],
            ["2. Clean + encode", "fillna (median/mode), get_dummies — table fully numeric"],
            ["3. Split & seal", "train_test_split(stratify=y), then the test set is UNTOUCHABLE"],
            ["4. Baseline", "DummyClassifier — the free score every model must beat"],
            ["5. Compare with CV", "cross_val_score(scoring='f1') on TRAIN only"],
            ["6. Tune", "GridSearchCV = hyperparameters × CV × your metric"],
            ["7. Final eval, one shot", "Break the seal: confusion matrix + classification_report"],
            ["8. Save everything", "joblib.dump model + feature order (+ scaler if any)"],
            ["New data rule", "Must get the EXACT same prep as training data"],
            ["The big secret", "Every ML project is these same 8 moves — only the data changes"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
