"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "name-trap", label: "The Name Trap ⭐" },
  { id: "why-not-line", label: "Why a Line Can't Classify" },
  { id: "sigmoid", label: "Sigmoid — The S-Curve" },
  { id: "first-model", label: "First Classifier" },
  { id: "proba", label: "predict_proba ⭐" },
  { id: "boundary", label: "The Decision Boundary" },
  { id: "threshold", label: "Moving the Threshold" },
  { id: "multi", label: "Multiple Features & Classes" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LogisticRegressionPage() {
  return (
    <TopicShell
      icon="🚦"
      title="Logistic Regression"
      gradientWord="Logistic"
      subtitle="Worst-named algorithm in ML: it says 'regression' but it CLASSIFIES — pass/fail, spam/ham, sick/healthy. It answers yes-or-no questions with a probability attached."
      nav={NAV}
      next={{ icon: "🌳", label: "Decision Trees & Forests", href: "/ml/decision-trees" }}
    >
      {/* 01 ─ NAME TRAP */}
      <Section id="name-trap" number="01" title="The Name Trap — It's a CLASSIFIER ⭐">
        <P>
          Interview favorite: <em>&quot;Is logistic regression regression or classification?&quot;</em>{" "}
          Answer: <strong>classification</strong>. The name is a historical accident (it&apos;s built
          on top of linear regression internally).
        </P>
        <Table
          head={["", "Linear Regression 📈", "Logistic Regression 🚦"]}
          rows={[
            ["Predicts", "a NUMBER (75.3 marks)", "a CATEGORY (pass / fail)"],
            ["Output range", "−∞ to +∞", "probability: 0 to 1"],
            ["Question shape", "\"how much?\"", "\"which one?\" / \"yes or no?\""],
            ["Examples", "price, temperature, salary", "spam?, churn?, disease?"],
            ["sklearn class", "LinearRegression", "LogisticRegression"],
          ]}
        />
        <P>Our running example — predicting pass/fail from hours studied:</P>
        <CodeBlock
          code={`hours  = [1, 2, 3, 4, 5, 6, 7, 8]
passed = [0, 0, 0, 0, 1, 1, 1, 1]    # 0 = fail, 1 = pass

# Deelaksha studied 4.5 hours. Pass or fail?`}
          output={`Notice y is only ever 0 or 1.
That's the fingerprint of classification.`}
        />
        <Callout type="mistake">
          ⚠️ If your y column is categories (0/1, yes/no, cat/dog) and you reach for{" "}
          <IC>LinearRegression</IC> — stop. Wrong tool. That mistake is the whole next section.
        </Callout>
      </Section>

      {/* 02 ─ WHY NOT LINE */}
      <Section id="why-not-line" number="02" title="Why a Straight Line Can't Classify">
        <P>Try forcing linear regression onto the pass/fail data and watch it embarrass itself:</P>
        <CodeBlock
          title="wrong_tool.py"
          code={`from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array(hours).reshape(-1, 1)
y = np.array(passed)

line = LinearRegression().fit(X, y)

for h in [1, 4.5, 8, 12]:
    print(f"hours={h:>4}: line predicts {line.predict([[h]])[0]:.2f}")`}
          output={`hours=   1: line predicts -0.04
hours= 4.5: line predicts  0.50
hours=   8: line predicts  1.04
hours=  12: line predicts  1.66`}
        />
        <Table
          head={["Output", "Problem"]}
          rows={[
            ["-0.04", "Probability of −4%?? Probabilities can't be negative"],
            ["1.04", "104% sure?? Can't exceed 100%"],
            ["1.66", "166%?! The line keeps climbing forever"],
          ]}
        />
        <P>
          We need something that takes the line&apos;s output and <strong>squashes it into 0…1</strong>{" "}
          — so it always reads as a valid probability. Enter the sigmoid.
        </P>
        <Callout type="analogy">
          🚪 A line is a ramp going to infinity. A probability is a door — it&apos;s somewhere
          between fully closed (0) and fully open (1). We need a function that turns ramps into
          doors.
        </Callout>
      </Section>

      {/* 03 ─ SIGMOID */}
      <Section id="sigmoid" number="03" title="Sigmoid — The S-Curve That Squashes Everything">
        <P>
          The sigmoid takes ANY number and squashes it into (0, 1). That&apos;s the entire trick:
          logistic regression = <strong>linear regression + sigmoid on top</strong>.
        </P>
        <CodeBlock
          title="sigmoid.py"
          code={`import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

for z in [-10, -4, -2, 0, 2, 4, 10]:
    s = sigmoid(z)
    print(f"z = {z:>4}  ->  sigmoid = {s:.3f}  " + "█" * int(s * 20))`}
          output={`z =  -10  ->  sigmoid = 0.000
z =   -4  ->  sigmoid = 0.018
z =   -2  ->  sigmoid = 0.119  ██
z =    0  ->  sigmoid = 0.500  ██████████
z =    2  ->  sigmoid = 0.881  █████████████████
z =    4  ->  sigmoid = 0.982  ███████████████████
z =   10  ->  sigmoid = 1.000  ████████████████████`}
        />
        <CodeBlock
          code={`1.0 |                    ________
    |                 ╱
0.5 | - - - - - - ●  ← z=0 gives exactly 0.5
    |           ╱
0.0 |________ ╱
    +---------------------------- z
        -4     0      +4`}
          output={`The S-curve:
• very negative z  → almost 0  (confident NO)
• z = 0            → 0.5       (coin flip)
• very positive z  → almost 1  (confident YES)`}
        />
        <FlowDiagram
          steps={[
            { label: "x (hours = 4.5)", sub: "input feature" },
            { label: "z = w·x + b", sub: "the linear part (a ramp)" },
            { label: "sigmoid(z)", sub: "squash into 0…1" },
            { label: "p = 0.62", sub: "62% chance of passing" },
            { label: "p ≥ 0.5 → class 1", sub: "final answer: PASS" },
          ]}
        />
        <Callout type="behind">
          Training still uses gradient descent from last page — same loop, same update rule. Only
          the loss changes (log-loss instead of MSE, because it plays nicer with probabilities).
        </Callout>
      </Section>

      {/* 04 ─ FIRST MODEL */}
      <Section id="first-model" number="04" title="Your First Classifier — 4 Lines">
        <CodeBlock
          title="first_classifier.py"
          code={`from sklearn.linear_model import LogisticRegression
import numpy as np

X = np.array([1, 2, 3, 4, 5, 6, 7, 8]).reshape(-1, 1)   # hours
y = np.array([0, 0, 0, 0, 1, 1, 1, 1])                  # fail/pass

model = LogisticRegression()
model.fit(X, y)

for h in [2, 4, 4.5, 5, 8]:
    pred = model.predict([[h]])[0]
    print(f"{h} hours -> {'PASS ✅' if pred == 1 else 'FAIL ❌'}")`}
          output={`2 hours -> FAIL ❌
4 hours -> FAIL ❌
4.5 hours -> PASS ✅
5 hours -> PASS ✅
8 hours -> PASS ✅`}
        />
        <P>
          Identical workflow to linear regression — <IC>fit</IC>, then <IC>predict</IC> — but the
          answers are <strong>classes</strong> (0/1), not numbers. The skeleton from the pipeline
          page didn&apos;t change at all; only step 6 swapped algorithms.
        </P>
        <Callout type="tip">
          This is sklearn&apos;s superpower: every model speaks the same{" "}
          <IC>fit / predict / score</IC> language. Learn it once, use it for every algorithm
          forever.
        </Callout>
      </Section>

      {/* 05 ─ PROBA */}
      <Section id="proba" number="05" title="predict_proba — The Confidence Behind the Answer ⭐">
        <P>
          <IC>predict()</IC> gives the verdict. <IC>predict_proba()</IC> shows the model&apos;s
          actual confidence — and that&apos;s often the more useful number:
        </P>
        <CodeBlock
          title="proba.py"
          code={`for h in [1, 3, 4.4, 4.6, 6, 8]:
    p_fail, p_pass = model.predict_proba([[h]])[0]
    verdict = model.predict([[h]])[0]
    print(f"{h:>4} hrs:  P(fail)={p_fail:.2f}  P(pass)={p_pass:.2f}"
          f"  ->  {'PASS' if verdict else 'FAIL'}")`}
          output={` 1.0 hrs:  P(fail)=0.98  P(pass)=0.02  ->  FAIL
 3.0 hrs:  P(fail)=0.82  P(pass)=0.18  ->  FAIL
 4.4 hrs:  P(fail)=0.54  P(pass)=0.46  ->  FAIL
 4.6 hrs:  P(fail)=0.46  P(pass)=0.54  ->  PASS
 6.0 hrs:  P(fail)=0.08  P(pass)=0.92  ->  PASS
 8.0 hrs:  P(fail)=0.00  P(pass)=1.00  ->  PASS`}
        />
        <Table
          head={["Row", "What it reveals"]}
          rows={[
            ["1 hr → 0.98 fail", "Model is near-certain. Trust it."],
            ["4.4 vs 4.6 hrs", "Verdict flips, but both are ~50/50 coin-flips — DON'T treat them as confident"],
            ["8 hrs → 1.00 pass", "Maximum confidence"],
            ["Each row sums to 1.0", "0.46 + 0.54 = 1 — it's a proper probability split"],
          ]}
        />
        <Callout type="analogy">
          🏥 A doctor saying &quot;you&apos;re fine&quot; could mean 51% fine or 99.9% fine — you&apos;d
          want to know which! <IC>predict</IC> is the verdict; <IC>predict_proba</IC> is the
          doctor&apos;s honesty.
        </Callout>
      </Section>

      {/* 06 ─ BOUNDARY */}
      <Section id="boundary" number="06" title="The Decision Boundary — Where the Flip Happens">
        <P>
          Somewhere between 4.4 and 4.6 hours, P(pass) crosses 0.5 and the verdict flips. That
          crossing point is the <strong>decision boundary</strong> — the model&apos;s entire
          worldview drawn as one cut:
        </P>
        <CodeBlock
          code={`hours:   1    2    3    4  ┊ 4.5┊  5    6    7    8
truth:   ❌   ❌   ❌   ❌  ┊    ┊  ✅   ✅   ✅   ✅
P(pass): .02  .07  .18  .38 ┊ .50┊ .62  .92  .98  .99
                            ┊    ┊
              FAIL zone  ←  boundary  →  PASS zone`}
          output={`The model compressed 8 rows of data into ONE rule:
"the line w·x + b crosses zero near x ≈ 4.5"
Everything left of it → class 0. Right of it → class 1.`}
        />
        <P>With 2 features, the boundary becomes a line cutting the plane:</P>
        <CodeBlock
          code={`attendance
 100 | ✅  ✅   ✅  ✅
  80 | ❌   ╲   ✅  ✅
  60 | ❌    ╲   ✅      ← the boundary line:
  40 | ❌  ❌  ╲  ✅        one side = pass
  20 | ❌  ❌   ╲ ❌        other side = fail
     +------------------ hours
       1   3    5   7`}
          output={`Logistic regression always draws a STRAIGHT boundary.
If your classes curl around each other, it can't separate
them - that's when you need trees (next page).`}
        />
        <Callout type="behind">
          &quot;Linear model&quot; for a classifier means: the <em>boundary</em> is a straight
          line/plane. The S-curve is only about converting distance-from-boundary into probability.
        </Callout>
      </Section>

      {/* 07 ─ THRESHOLD */}
      <Section id="threshold" number="07" title="Moving the Threshold — Not Everything is 0.5">
        <P>
          <IC>predict()</IC> uses 0.5 by default. But mistakes aren&apos;t always equally bad — a
          missed cancer is worse than a false alarm. You can shift the cut yourself:
        </P>
        <CodeBlock
          title="custom_threshold.py"
          code={`p_pass = model.predict_proba(X_new)[:, 1]   # column 1 = P(class 1)

default  = (p_pass >= 0.5).astype(int)   # standard
cautious = (p_pass >= 0.3).astype(int)   # flag more positives
strict   = (p_pass >= 0.8).astype(int)   # only when very sure

print("P(pass)  :", p_pass.round(2))
print("@0.5     :", default)
print("@0.3     :", cautious)
print("@0.8     :", strict)`}
          output={`P(pass)  : [0.18 0.46 0.62 0.92]
@0.5     : [0 0 1 1]
@0.3     : [0 1 1 1]   ← borderline 0.46 now counts as pass
@0.8     : [0 0 0 1]   ← only the 0.92 survives`}
        />
        <Table
          head={["Scenario", "Costly mistake", "Threshold direction"]}
          rows={[
            ["Disease screening", "Missing a sick patient", "LOWER (0.2-0.3) — catch everyone, confirm later"],
            ["Spam filter", "Deleting a real email", "HIGHER (0.8-0.9) — only obvious spam goes"],
            ["Loan approval", "Approving a defaulter", "HIGHER — be sure before approving"],
            ["No special cost", "—", "Keep 0.5"],
          ]}
        />
        <Callout type="tip">
          The model gives probabilities; <strong>the threshold is a business decision</strong>, not
          a math one. Precision/recall (Evaluation page) measure exactly this trade-off.
        </Callout>
      </Section>

      {/* 08 ─ MULTI */}
      <Section id="multi" number="08" title="Multiple Features & Multiple Classes">
        <P>Real version — two features, plus the train/test discipline from earlier pages:</P>
        <CodeBlock
          title="real_classifier.py"
          code={`import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("students.csv")          # 200 rows

X = df[["hours", "attendance"]]
y = df["passed"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = LogisticRegression()
model.fit(X_train, y_train)

print("accuracy on test:", round(model.score(X_test, y_test), 2))
print("Deelaksha (4.5h, 85%):", model.predict([[4.5, 85]]),
      model.predict_proba([[4.5, 85]]).round(2))`}
          output={`accuracy on test: 0.88
Deelaksha (4.5h, 85%): [1] [[0.27 0.73]]`}
        />
        <P>
          More than 2 classes? Nothing changes in your code — sklearn handles it automatically:
        </P>
        <CodeBlock
          title="three_classes.py"
          code={`# y has 3 classes: 0=fail, 1=pass, 2=distinction
model = LogisticRegression()
model.fit(X_train, y_train3)

print(model.predict([[7.5, 95]]))
print(model.predict_proba([[7.5, 95]]).round(2))`}
          output={`[2]
[[0.02 0.31 0.67]]   ← three probabilities now, still sum to 1`}
        />
        <Callout type="note">
          For classification, <IC>model.score()</IC> returns <strong>accuracy</strong> (fraction
          correct), not R². Same method name, different meaning — and accuracy has traps of its own
          (Evaluation page).
        </Callout>
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases — Classifier Crashes">
        <P>
          <strong>Case 1: Continuous y fed to a classifier:</strong>
        </P>
        <CodeBlock
          code={`y = df["marks"]              # 67.5, 81.2, 45.9... continuous!
model = LogisticRegression()
model.fit(X_train, y_train)`}
          error
          output={`ValueError: Unknown label type: continuous. Maybe you are trying to fit a
classifier, which expects discrete classes on a regression target with
continuous values.`}
        />
        <P>
          Predicting marks (a number)? Use <IC>LinearRegression</IC>. Predicting pass/fail? Make y
          discrete: <IC>y = (df[&quot;marks&quot;] &gt;= 50).astype(int)</IC>.
        </P>
        <P>
          <strong>Case 2: Only one class in y_train:</strong>
        </P>
        <CodeBlock
          code={`# tiny split got unlucky - y_train is all 1s
model.fit(X_train, y_train)`}
          error
          output={`ValueError: This solver needs samples of at least 2 classes in the data,
but the data contains only one class: 1`}
        />
        <P>
          A classifier can&apos;t learn &quot;pass vs fail&quot; from only passes. Fix:{" "}
          <IC>stratify=y</IC> in your split (Train/Test page!), or get more data.
        </P>
        <P>
          <strong>Case 3: The convergence warning (not a crash, but everyone meets it):</strong>
        </P>
        <CodeBlock
          code={`model = LogisticRegression()
model.fit(X_train, y_train)     # features unscaled: hours 1-8, salary 30000-90000`}
          error
          output={`ConvergenceWarning: lbfgs failed to converge (status=1):
STOP: TOTAL NO. of ITERATIONS REACHED LIMIT.
Increase the number of iterations (max_iter) or scale the data.`}
        />
        <P>
          Gradient descent ran out of steps before reaching the valley floor — usually because
          unscaled features made the valley a canyon. Fixes, best first:{" "}
          <IC>StandardScaler</IC> on X, or <IC>LogisticRegression(max_iter=1000)</IC>.
        </P>
        <P>
          <strong>Case 4: Reading predict_proba columns wrong — silent bug:</strong>
        </P>
        <CodeBlock
          code={`p = model.predict_proba([[8, 95]])[0][0]   # ❌ column 0 = P(class 0) = P(FAIL)
print(f"Probability of passing: {p:.2f}")`}
          output={`Probability of passing: 0.01   # ← actually the FAIL probability!
# Columns follow model.classes_ order: [0, 1] -> [P(fail), P(pass)]
# P(pass) is [0][1], or use: model.predict_proba(X)[:, 1]`}
        />
        <Callout type="mistake">
          ⚠️ Check <IC>model.classes_</IC> when in doubt — it tells you exactly which column is
          which class.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Logistic regression is", "CLASSIFICATION — despite the name. Interview classic."],
            ["The recipe", "linear part (w·x + b) → sigmoid squash → probability 0…1"],
            ["sigmoid(0)", "= 0.5 exactly. Negative z → near 0, positive z → near 1"],
            ["predict()", "The verdict: class 0 or 1 (cuts at probability 0.5)"],
            ["predict_proba()", "The confidence: [P(class 0), P(class 1)] — rows sum to 1"],
            ["P(class 1) lives at", "predict_proba(X)[:, 1] — column order follows model.classes_"],
            ["Decision boundary", "Where P = 0.5 — always a STRAIGHT line/plane for logistic"],
            ["Threshold", "0.5 is default, but it's a business choice — lower to catch more, raise to be surer"],
            ["score() here means", "Accuracy (fraction correct) — not R²"],
            ["ConvergenceWarning", "Scale your features (StandardScaler) or raise max_iter"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
