"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "accuracy-lie", label: "When Accuracy Lies ⭐" },
  { id: "confusion", label: "Confusion Matrix" },
  { id: "precision-recall", label: "Precision vs Recall ⭐" },
  { id: "f1", label: "F1 — One Number" },
  { id: "report", label: "classification_report" },
  { id: "regression", label: "Regression: MAE · MSE · R²" },
  { id: "cv", label: "Cross-Validation" },
  { id: "picker", label: "Which Metric When?" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function EvaluationPage() {
  return (
    <TopicShell
      icon="📊"
      title="Model Evaluation"
      gradientWord="Evaluation"
      subtitle="A model is worth exactly as much as the trust you can put in its numbers. This page is about catching the lies: accuracy that flatters, errors that hide, and the metrics that tell the truth."
      nav={NAV}
      next={{ icon: "🏁", label: "End-to-End Project", href: "/ml/project" }}
    >
      {/* 01 ─ ACCURACY LIE */}
      <Section id="accuracy-lie" number="01" title="When Accuracy Lies ⭐">
        <P>
          Accuracy = fraction of correct answers. Sounds perfect — until classes are{" "}
          <strong>imbalanced</strong>. Watch a completely useless model score 95%:
        </P>
        <CodeBlock
          title="useless_genius.py"
          code={`# 1000 patients, only 50 actually sick (5%)
import numpy as np

y_true = np.array([1]*50 + [0]*950)        # 1 = sick

# "model" that just says HEALTHY to everyone:
y_pred = np.zeros(1000, dtype=int)

accuracy = (y_true == y_pred).mean()
print(f"accuracy = {accuracy:.2%}")
print("sick patients caught:", ((y_true == 1) & (y_pred == 1)).sum(), "/ 50")`}
          output={`accuracy = 95.00%
sick patients caught: 0 / 50`}
        />
        <P>
          95% accurate. <strong>Catches zero sick patients.</strong> In a hospital this model kills
          people while its dashboard glows green. Accuracy alone cannot be trusted whenever one
          class is rare — fraud, disease, spam, machine failures… i.e. most valuable problems.
        </P>
        <Callout type="analogy">
          🌦️ A weather app that always says &quot;no rain&quot; is right ~90% of days in a dry city —
          and worthless on exactly the days you needed it. Being right often ≠ being useful.
        </Callout>
      </Section>

      {/* 02 ─ CONFUSION */}
      <Section id="confusion" number="02" title="Confusion Matrix — All 4 Outcomes Counted">
        <P>
          Every prediction lands in one of exactly four boxes. The confusion matrix counts them —
          no hiding possible:
        </P>
        <CodeBlock
          code={`                     PREDICTED
                  sick      healthy
         ┌─────────────┬─────────────┐
A   sick │  TP = 40    │  FN = 10 💀 │  ← 50 really sick
C        │  caught ✅  │  MISSED!    │
T        ├─────────────┼─────────────┤
U health │  FP = 30 😱 │  TN = 920   │  ← 950 really healthy
A        │ false alarm │  correct ✅ │
L        └─────────────┴─────────────┘`}
          output={`TP  True Positive  : said sick,    was sick     ✅
TN  True Negative  : said healthy, was healthy  ✅
FP  False Positive : said sick,    was healthy  😱 false alarm
FN  False Negative : said healthy, was sick     💀 the killer`}
        />
        <CodeBlock
          title="confusion.py"
          code={`from sklearn.metrics import confusion_matrix

cm = confusion_matrix(y_test, model.predict(X_test))
print(cm)`}
          output={`[[920  30]
 [ 10  40]]

# sklearn's layout (alphabetical classes, 0 first):
# row 0: actual healthy -> [TN=920, FP=30]
# row 1: actual sick    -> [FN=10,  TP=40]`}
        />
        <Callout type="mistake">
          ⚠️ FP and FN are not equally bad — it depends on the problem. Missing cancer (FN) ≫ a
          false alarm (FP). Deleting a real email as spam (FP) ≫ letting one spam through (FN). The
          next two metrics measure exactly these two failure modes.
        </Callout>
      </Section>

      {/* 03 ─ PRECISION RECALL */}
      <Section id="precision-recall" number="03" title="Precision vs Recall — Two Questions ⭐">
        <P>Both come straight from the matrix, each answering a different worry:</P>
        <Table
          head={["Metric", "The question it answers", "Formula", "Our value"]}
          rows={[
            ["Precision", "When the model says SICK — how often is it right?", "TP / (TP + FP)", "40 / (40+30) = 0.57"],
            ["Recall", "Of everyone actually SICK — how many did we catch?", "TP / (TP + FN)", "40 / (40+10) = 0.80"],
          ]}
        />
        <CodeBlock
          title="precision_recall.py"
          code={`from sklearn.metrics import precision_score, recall_score

y_pred = model.predict(X_test)
print("precision:", round(precision_score(y_test, y_pred), 2))
print("recall   :", round(recall_score(y_test, y_pred), 2))

# and the all-healthy "useless genius" from section 01?
print("\\nuseless model recall:", recall_score(y_true, np.zeros(1000)))`}
          output={`precision: 0.57
recall   : 0.8

useless model recall: 0.0`}
        />
        <P>
          There it is — the lie detector. The 95%-accurate do-nothing model has{" "}
          <strong>recall 0.0</strong>. One metric and the fraud is exposed.
        </P>
        <CodeBlock
          code={`The tug-of-war (remember the threshold from Logistic Regression?):

threshold 0.2  → flag almost everyone   → recall ↑ 0.98, precision ↓ 0.21
threshold 0.5  → balanced               → recall 0.80, precision 0.57
threshold 0.9  → flag only the obvious  → recall ↓ 0.40, precision ↑ 0.95`}
          output={`Push one up, the other slides down.
You CHOOSE the balance based on which mistake costs more.`}
        />
        <Callout type="analogy">
          🎣 Fishing with a net: a huge net catches all the fish (high recall) plus boots and tires
          (low precision). A spear catches only fish (high precision) but misses most of them (low
          recall).
        </Callout>
      </Section>

      {/* 04 ─ F1 */}
      <Section id="f1" number="04" title="F1 — Precision & Recall in One Number">
        <P>
          Need a single number to compare models? F1 is the <strong>harmonic mean</strong> of
          precision and recall — and unlike a normal average, it punishes imbalance brutally:
        </P>
        <CodeBlock
          title="f1.py"
          code={`from sklearn.metrics import f1_score

# F1 = 2 * (precision * recall) / (precision + recall)
p, r = 0.57, 0.80
print("our model F1:", round(2*p*r/(p+r), 2))

# the trap a normal average falls into:
p, r = 1.00, 0.02      # flags 1 patient, correct - misses the other 49
print("normal average:", (p + r) / 2)      # looks half-decent!
print("F1            :", round(2*p*r/(p+r), 2))   # tells the truth`}
          output={`our model F1: 0.67
normal average: 0.51
F1            : 0.04`}
        />
        <Table
          head={["Precision", "Recall", "Avg", "F1", "Verdict"]}
          rows={[
            ["0.80", "0.80", "0.80", "0.80", "Balanced — F1 agrees with average"],
            ["1.00", "0.02", "0.51", "0.04", "F1 exposes the near-useless model"],
            ["0.57", "0.80", "0.69", "0.67", "Our model — decent"],
            ["0.00", "anything", "—", "0.00", "Either metric at 0 → F1 is 0. No mercy."],
          ]}
        />
        <Callout type="tip">
          Rule: imbalanced classes → report <strong>F1</strong> (or precision &amp; recall
          separately), never accuracy alone.
        </Callout>
      </Section>

      {/* 05 ─ REPORT */}
      <Section id="report" number="05" title="classification_report — Everything At Once">
        <CodeBlock
          title="report.py"
          code={`from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred,
                            target_names=["healthy", "sick"]))`}
          output={`              precision    recall  f1-score   support

     healthy       0.99      0.97      0.98       950
        sick       0.57      0.80      0.67        50

    accuracy                           0.96      1000
   macro avg       0.78      0.89      0.82      1000
weighted avg       0.97      0.96      0.97      1000`}
        />
        <Table
          head={["Row / column", "How to read it"]}
          rows={[
            ["support", "How many real samples of that class (950 vs 50 — there's your imbalance)"],
            ["per-class rows", "The 'sick' row is the one that matters here — and it's the weakest"],
            ["accuracy 0.96", "The flattering headline number — now you know better"],
            ["macro avg", "Plain average over classes — treats rare 'sick' equally. Honest for imbalance"],
            ["weighted avg", "Weighted by support — dominated by 'healthy', flattering again"],
          ]}
        />
        <Callout type="tip">
          Reading order for imbalanced problems: find the <strong>rare class&apos;s row</strong>{" "}
          first, then <strong>macro avg</strong>. Ignore the big accuracy number until last.
        </Callout>
      </Section>

      {/* 06 ─ REGRESSION */}
      <Section id="regression" number="06" title="Regression Metrics — MAE · MSE · RMSE · R²">
        <P>
          Predicting numbers? There&apos;s no &quot;correct/incorrect&quot; — only{" "}
          <strong>how far off</strong>. Three flavors of distance:
        </P>
        <CodeBlock
          title="regression_metrics.py"
          code={`from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

y_true = np.array([50, 61, 75, 92, 99])     # real prices (lakhs)
y_pred = np.array([52, 60, 70, 95, 98])     # model's guesses

mae  = mean_absolute_error(y_true, y_pred)
mse  = mean_squared_error(y_true, y_pred)
rmse = np.sqrt(mse)
r2   = r2_score(y_true, y_pred)

print(f"errors: {y_pred - y_true}")
print(f"MAE  = {mae:.2f}   (avg miss in lakhs)")
print(f"MSE  = {mse:.2f}  (squared units - not readable)")
print(f"RMSE = {rmse:.2f}   (back to lakhs, outlier-sensitive)")
print(f"R²   = {r2:.3f}  (fraction of variation explained)")`}
          output={`errors: [ 2 -1 -5  3 -1]
MAE  = 2.40   (avg miss in lakhs)
MSE  = 8.00  (squared units - not readable)
RMSE = 2.83   (back to lakhs, outlier-sensitive)
R²   = 0.972  (fraction of variation explained)`}
        />
        <Table
          head={["Metric", "Personality", "Use when"]}
          rows={[
            ["MAE", "\"On average we're off by ₹2.4 lakhs\" — calm, readable", "Explaining to humans; all errors equally bad"],
            ["MSE", "Squares errors — one big miss dominates", "Training loss (gradient descent page!)"],
            ["RMSE", "MSE made readable again (√) — still hates outliers", "Reporting, when big misses are extra bad"],
            ["R²", "Scale-free 0…1 — comparable across problems", "Quick quality check (it's model.score())"],
          ]}
        />
        <Callout type="behind">
          MAE vs RMSE tells you about your errors: if RMSE ≫ MAE, a few <strong>huge</strong> misses
          are hiding among small ones (squaring amplified them). RMSE ≈ MAE → errors are uniform.
        </Callout>
      </Section>

      {/* 07 ─ CV */}
      <Section id="cv" number="07" title="Cross-Validation — Don't Trust One Lucky Split">
        <P>
          One train/test split = one exam. What if your model just got an easy test set?{" "}
          <strong>K-fold cross-validation</strong> runs the exam 5 times, each time holding out a
          different fifth of the data:
        </P>
        <CodeBlock
          code={`5-fold CV — every chunk gets one turn as the test set:

round 1:  [TEST][train][train][train][train]  -> 0.86
round 2:  [train][TEST][train][train][train]  -> 0.90
round 3:  [train][train][TEST][train][train]  -> 0.84
round 4:  [train][train][train][TEST][train]  -> 0.91
round 5:  [train][train][train][train][TEST]  -> 0.87`}
          output={`Every row is tested exactly once.
5 scores instead of 1 → you see the SPREAD, not one lucky roll.`}
        />
        <CodeBlock
          title="cross_val.py"
          code={`from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(model, X, y, cv=5)

print("fold scores:", scores.round(2))
print(f"mean = {scores.mean():.2f}  ± {scores.std():.2f}")`}
          output={`fold scores: [0.86 0.9  0.84 0.91 0.87]
mean = 0.88  ± 0.03`}
        />
        <P>
          Report <IC>0.88 ± 0.03</IC>, not a single 0.91. A small ± means the model is stable; a
          huge ± (e.g. 0.88 ± 0.15) means scores swing wildly with the data — don&apos;t trust any
          single number.
        </P>
        <Callout type="analogy">
          🎲 One exam could be luck. Five exams with different questions, averaging 88% with tiny
          spread? That student actually knows the subject.
        </Callout>
      </Section>

      {/* 08 ─ PICKER */}
      <Section id="picker" number="08" title="Which Metric When? — The Decision Table">
        <Table
          head={["Situation", "Lead metric", "Why"]}
          rows={[
            ["Balanced classes (≈50/50)", "Accuracy", "It's honest when classes are even"],
            ["Imbalanced classes", "F1 / precision + recall", "Accuracy lies (section 01)"],
            ["Missing a positive is deadly (cancer, fraud)", "Recall", "FN is the killer — catch everyone"],
            ["False alarm is costly (spam, arrests)", "Precision", "FP is the killer — be sure first"],
            ["Regression, explaining to humans", "MAE", "\"Off by ₹2.4 lakhs on average\""],
            ["Regression, big misses unacceptable", "RMSE", "Squaring punishes huge errors"],
            ["Comparing models quickly", "R² / F1 + cross-validation", "One stable, comparable number"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "Predicting numbers?", sub: "→ MAE / RMSE / R²" },
            { label: "Classes balanced?", sub: "→ accuracy is fine" },
            { label: "Imbalanced?", sub: "→ confusion matrix + F1" },
            { label: "Which mistake hurts?", sub: "FN → recall · FP → precision" },
            { label: "Always", sub: "test set only + cross-validate" },
          ]}
        />
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases & Metric Traps">
        <P>
          <strong>Case 1: Classification metric on regression output:</strong>
        </P>
        <CodeBlock
          code={`from sklearn.metrics import accuracy_score
# model is LinearRegression - predicts 74.3, 81.7, ...
accuracy_score(y_test, model.predict(X_test))`}
          error
          output={`ValueError: continuous is not supported`}
        />
        <P>
          Accuracy needs classes, not floats. Numbers → MAE/RMSE/R². Categories → accuracy/F1.
        </P>
        <P>
          <strong>Case 2: Precision when the model never says positive:</strong>
        </P>
        <CodeBlock
          code={`precision_score(y_true, np.zeros(1000))   # all-healthy model`}
          error
          output={`UndefinedMetricWarning: Precision is ill-defined and being set to 0.0 due
to no predicted samples. Use \`zero_division\` parameter to control this
behavior.`}
        />
        <P>
          TP+FP = 0 → division by zero. The warning itself is diagnostic: your model never predicts
          the positive class at all.
        </P>
        <P>
          <strong>Case 3: Swapped argument order — silent wrong numbers:</strong>
        </P>
        <CodeBlock
          code={`# signature is (y_true, y_pred) - swapped here:
print(recall_score(y_pred, y_test))     # ❌ runs fine!`}
          output={`0.57
# No crash — but that's the PRECISION value, not recall!
# Swapping y_true/y_pred transposes the confusion matrix,
# silently exchanging precision <-> recall.`}
        />
        <P>
          <strong>Case 4: Evaluating on training data — the lie that survives every metric:</strong>
        </P>
        <CodeBlock
          code={`print(classification_report(y_train, model.predict(X_train)))
# Beautiful report. F1 = 0.99 everywhere. All of it meaningless -
# every metric on this page assumes UNSEEN data. Garbage in,
# flattering garbage out.`}
          output={`Metrics don't fix a broken evaluation setup.
Test set + (ideally) cross-validation, always.`}
        />
        <Callout type="mistake">
          ⚠️ Memorize the signature: <IC>metric(y_true, y_pred)</IC> — truth first, guess second.
          Every sklearn metric follows it.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Accuracy lies when", "Classes are imbalanced — all-healthy model scores 95% catching nobody"],
            ["Confusion matrix", "TP, TN, FP (false alarm 😱), FN (missed 💀) — all 4 outcomes counted"],
            ["Precision", "TP/(TP+FP) — when we say YES, how often are we right?"],
            ["Recall", "TP/(TP+FN) — of all real YESes, how many did we catch?"],
            ["The trade-off", "Lower threshold → recall ↑ precision ↓. You pick by mistake cost"],
            ["F1", "Harmonic mean of P & R — brutally punishes imbalance (1.0 & 0.02 → 0.04)"],
            ["MAE", "Average miss in real units — the human-readable error"],
            ["RMSE ≫ MAE means", "A few HUGE misses are hiding in there"],
            ["Cross-validation", "5 splits, 5 scores → report mean ± spread, not one lucky roll"],
            ["Metric signature", "metric(y_true, y_pred) — truth first. Swapping silently lies"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
