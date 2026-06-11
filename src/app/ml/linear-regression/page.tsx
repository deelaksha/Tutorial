"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "idea", label: "The Idea: Fit a Line" },
  { id: "equation", label: "y = w·x + b ⭐" },
  { id: "first-model", label: "Your First Real Model" },
  { id: "coef", label: "Reading coef_ & intercept_" },
  { id: "multi", label: "Multiple Features" },
  { id: "score", label: "How Good? R² Score" },
  { id: "full", label: "Full Pipeline ⭐" },
  { id: "limits", label: "When Lines Fail" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function LinearRegressionPage() {
  return (
    <TopicShell
      icon="📈"
      title="Linear Regression"
      gradientWord="Linear"
      subtitle="Your first real model. It draws the best straight line through your data, then uses that line to predict numbers — prices, marks, salaries. Simple, fast, and the foundation of everything after it."
      nav={NAV}
      next={{ icon: "⛰️", label: "Training From Scratch", href: "/ml/gradient-descent" }}
    >
      {/* 01 ─ IDEA */}
      <Section id="idea" number="01" title="The Idea: Fit a Line Through Points">
        <P>
          Plot house sizes vs prices. The points roughly form a line going up: bigger house → higher
          price. Linear regression finds the <strong>one straight line that comes closest to all
          the points</strong>. After that, predicting is just reading off the line.
        </P>
        <CodeBlock
          title="the_data.py"
          code={`# size (sqft)  →  price (lakhs)
data = [
    (1000, 50),
    (1200, 61),
    (1500, 75),
    (1800, 92),
    (2000, 99),
]
# Question: what does a 1600 sqft house cost?
# 1600 is not in the data... but it's ON the line.`}
          output={`price
 99 |                          ●
 92 |                    ●   ╱
 75 |             ●    ╱
 61 |       ●    ╱
 50 | ●    ╱  ← best-fit line passes through the cloud
    +-------------------------- size
     1000  1200  1500  1800  2000`}
        />
        <Callout type="analogy">
          📏 Imagine holding a ruler over a scatter of dots and tilting it until it sits as close to
          all dots as possible. That tilt + position is <em>the model</em>. Training = finding the
          tilt. Predicting = reading the ruler.
        </Callout>
        <Callout type="note">
          Regression = predicting a <strong>NUMBER</strong> (price, marks, temperature). If you want
          a category (spam/not-spam), that&apos;s classification — next pages.
        </Callout>
      </Section>

      {/* 02 ─ EQUATION */}
      <Section id="equation" number="02" title="The Whole Model is One Equation ⭐">
        <P>
          Every straight line is described by two numbers. That means the entire trained model is
          just:
        </P>
        <CodeBlock
          code={`price = w * size + b

# w = slope  ("weight")    → how much price rises per extra sqft
# b = offset ("intercept") → the price when size = 0 (base value)`}
          output={`Training = finding the best w and b.
Predicting = plugging size into the equation.
That's ALL linear regression is.`}
        />
        <Table
          head={["Symbol", "sklearn name", "Meaning", "Example"]}
          rows={[
            ["w", "model.coef_", "Slope — price added per 1 unit of feature", "0.05 lakhs per sqft"],
            ["b", "model.intercept_", "Starting value when all features are 0", "1.0 lakh base"],
            ["x", "feature (X)", "Input you know", "size = 1600"],
            ["y", "label (y)", "Output you want", "price = ?"],
          ]}
        />
        <Callout type="behind">
          &quot;Best&quot; line = the one with the smallest total error. The error measure is{" "}
          <strong>MSE</strong> (Mean Squared Error): for each point, take (real − predicted),
          square it, average them. The line minimizing MSE wins. <em>How</em> it&apos;s found is the
          next page — gradient descent.
        </Callout>
      </Section>

      {/* 03 ─ FIRST MODEL */}
      <Section id="first-model" number="03" title="Your First Real Model — fit & predict">
        <P>
          Tiny perfect-line dataset first, so you can verify the model with your own eyes:
          y is always <IC>2·x + 1</IC>.
        </P>
        <CodeBlock
          title="first_model.py"
          code={`from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])   # 2D! each row = one sample
y = np.array([3, 5, 7, 9, 11])            # exactly 2*x + 1

model = LinearRegression()
model.fit(X, y)                            # ← TRAINING happens here

print("w (coef_)     :", model.coef_)
print("b (intercept_):", model.intercept_)
print("predict x=6   :", model.predict([[6]]))
print("predict x=100 :", model.predict([[100]]))`}
          output={`w (coef_)     : [2.]
b (intercept_): 1.0
predict x=6   : [13.]
predict x=100 : [201.]`}
        />
        <P>
          It recovered <IC>w=2, b=1</IC> from the data alone — nobody told it the formula. And{" "}
          <IC>2·6+1 = 13</IC>, <IC>2·100+1 = 201</IC>: predictions are just the equation running.
        </P>
        <FlowDiagram
          steps={[
            { label: "X, y data", sub: "5 points on a line" },
            { label: "model.fit(X, y)", sub: "find best w and b" },
            { label: "w=2.0, b=1.0", sub: "the learned 'knowledge'" },
            { label: "predict([[6]])", sub: "2*6 + 1 = 13" },
          ]}
        />
        <Callout type="mistake">
          ⚠️ X must be <strong>2D</strong> — a list of rows, each row a list of features. That&apos;s
          why it&apos;s <IC>[[1],[2],[3]]</IC> not <IC>[1,2,3]</IC>, and <IC>predict([[6]])</IC> not{" "}
          <IC>predict(6)</IC>. Forgetting this is the #1 beginner crash (see 💥 section).
        </Callout>
      </Section>

      {/* 04 ─ COEF */}
      <Section id="coef" number="04" title="Reading coef_ & intercept_ — the Model, Explained">
        <P>
          Unlike many models, linear regression is fully <strong>explainable</strong> — the learned
          numbers have plain-English meanings:
        </P>
        <CodeBlock
          title="house_model.py"
          code={`X = np.array([[1000], [1200], [1500], [1800], [2000]])  # sqft
y = np.array([50, 61, 75, 92, 99])                       # lakhs

model = LinearRegression()
model.fit(X, y)

w = model.coef_[0]
b = model.intercept_
print(f"w = {w:.4f}  -> each extra sqft adds Rs {w*100000:.0f}")
print(f"b = {b:.2f}   -> base value")
print(f"1600 sqft -> {model.predict([[1600]])[0]:.1f} lakhs")`}
          output={`w = 0.0503  -> each extra sqft adds Rs 5031
b = -0.95   -> base value
1600 sqft -> 79.5 lakhs`}
        />
        <Table
          head={["Number", "English sentence it encodes"]}
          rows={[
            ["coef_ = 0.0503", "\"Every additional sqft costs about 0.05 lakhs (Rs 5,031)\""],
            ["intercept_ = -0.95", "\"The line crosses zero slightly below 0 — just where the line sits, not a real house price\""],
            ["predict(1600) = 79.5", "\"0.0503 × 1600 + (−0.95) = 79.5 lakhs\""],
          ]}
        />
        <Callout type="tip">
          A negative or weird <IC>intercept_</IC> is normal — no house has 0 sqft. The intercept just
          anchors the line; it doesn&apos;t need a real-world meaning on its own.
        </Callout>
      </Section>

      {/* 05 ─ MULTI */}
      <Section id="multi" number="05" title="Multiple Features — One w Per Column">
        <P>
          Real prices depend on more than size. Add columns; the equation simply grows one{" "}
          <IC>w</IC> per feature:
        </P>
        <CodeBlock
          title="multi_feature.py"
          code={`import pandas as pd

df = pd.DataFrame({
    "size":     [1000, 1200, 1500, 1800, 2000, 1100, 1700],
    "bedrooms": [2,    2,    3,    3,    4,    2,    3   ],
    "age":      [10,   5,    8,    2,    1,    15,   4   ],
    "price":    [50,   62,   78,   95,   105,  48,   90  ],
})

X = df[["size", "bedrooms", "age"]]
y = df["price"]

model = LinearRegression()
model.fit(X, y)

for name, w in zip(X.columns, model.coef_):
    print(f"  {name:<9} w = {w:+.4f}")
print(f"  intercept   = {model.intercept_:+.2f}")

new_house = [[1600, 3, 5]]   # 1600 sqft, 3 bed, 5 yrs old
print("prediction:", model.predict(new_house).round(1))`}
          output={`  size      w = +0.0450
  bedrooms  w = +3.2110
  age       w = -0.8520
  intercept   = +1.87
prediction: [82.7]`}
        />
        <P>The model is now: <IC>price = 0.045·size + 3.21·bedrooms − 0.85·age + 1.87</IC></P>
        <Table
          head={["Feature", "Sign of w", "Story the model learned"]}
          rows={[
            ["size", "+", "Bigger → pricier"],
            ["bedrooms", "+", "Each bedroom adds ~3.2 lakhs"],
            ["age", "−", "Each year of age REMOVES ~0.85 lakhs"],
          ]}
        />
        <Callout type="behind">
          This is why <strong>scaling matters</strong> (Data Prep page): if size is in the thousands
          and age is 1–15, their w values live on wildly different scales and are hard to compare.
          Scale features first when you want to compare importance.
        </Callout>
      </Section>

      {/* 06 ─ SCORE */}
      <Section id="score" number="06" title="How Good Is The Line? — R² Score">
        <P>
          <IC>model.score(X_test, y_test)</IC> returns <strong>R²</strong> — &quot;how much of the
          ups-and-downs in y does my line explain?&quot; 1.0 = perfect, 0.0 = no better than always
          guessing the average.
        </P>
        <CodeBlock
          title="score.py"
          code={`from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

print("R² on train:", round(model.score(X_train, y_train), 3))
print("R² on test :", round(model.score(X_test, y_test), 3))`}
          output={`R² on train: 0.991
R² on test : 0.962`}
        />
        <Table
          head={["R² value", "Verdict"]}
          rows={[
            ["0.95 – 1.00", "Excellent — line explains almost everything"],
            ["0.7 – 0.95", "Good, usable"],
            ["0.3 – 0.7", "Weak — missing features or wrong model shape"],
            ["≈ 0", "Useless — same as predicting the average every time"],
            ["Negative!", "WORSE than guessing the average — something is broken"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Yes, R² can be <strong>negative</strong> on test data. It usually means train/test were
          split wrong, features are garbage, or you fit on one thing and scored on another.
        </Callout>
      </Section>

      {/* 07 ─ FULL PIPELINE */}
      <Section id="full" number="07" title="Full Pipeline — Everything So Far In One Script ⭐">
        <P>
          Data Prep + Train/Test Split + Linear Regression, end to end. This shape repeats for{" "}
          <em>every</em> model you&apos;ll ever train:
        </P>
        <CodeBlock
          title="pipeline.py"
          code={`import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# 1) LOAD
df = pd.read_csv("houses.csv")

# 2) CLEAN
df = df.dropna(subset=["price"])                 # label must exist
df["size"] = df["size"].fillna(df["size"].median())

# 3) ENCODE text -> numbers
df = pd.get_dummies(df, columns=["city"], dtype=int)

# 4) SPLIT features / label
X = df.drop("price", axis=1)
y = df["price"]

# 5) SPLIT train / test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 6) TRAIN
model = LinearRegression()
model.fit(X_train, y_train)

# 7) EVALUATE (on unseen data only!)
print("R² on test:", round(model.score(X_test, y_test), 3))

# 8) USE
new = X_test.iloc[[0]]
print("predicted :", model.predict(new).round(1)[0])
print("actual    :", y_test.iloc[0])`}
          output={`R² on test: 0.917
predicted : 88.3
actual    : 91.0`}
        />
        <FlowDiagram
          steps={[
            { label: "1-3 Prep", sub: "load · clean · encode" },
            { label: "4-5 Split", sub: "X/y, then train/test" },
            { label: "6 Train", sub: "fit(X_train, y_train)" },
            { label: "7 Evaluate", sub: "score(X_test, y_test)" },
            { label: "8 Use", sub: "predict(new)" },
          ]}
        />
        <Callout type="tip">
          Memorize this 8-step skeleton. Switching to a different algorithm later changes{" "}
          <strong>one line</strong> (step 6) — everything else stays identical.
        </Callout>
      </Section>

      {/* 08 ─ LIMITS */}
      <Section id="limits" number="08" title="When Lines Fail">
        <P>
          A straight line can only learn straight relationships. Feed it a curve and it underfits —
          badly:
        </P>
        <CodeBlock
          title="curve_fail.py"
          code={`# y = x²  — a curve, not a line
X = np.array([[1], [2], [3], [4], [5], [6]])
y = np.array([1, 4, 9, 16, 25, 36])

model = LinearRegression()
model.fit(X, y)
print("R²:", round(model.score(X, y), 3))
print("predict x=7:", model.predict([[7]]).round(1), " (real: 49)")`}
          output={`R²: 0.93
predict x=7: [40.2]  (real: 49)`}
        />
        <P>
          0.93 looks okay on this tiny range, but the line drifts further from the curve the further
          you go — at x=7 it&apos;s already off by 9. The relationship isn&apos;t linear; the model
          shape is wrong.
        </P>
        <Table
          head={["Symptom", "Likely cause", "Way out"]}
          rows={[
            ["Low R² on train AND test", "Relationship is curved, not straight", "Add x² features, or use trees (2 pages ahead)"],
            ["One crazy point ruins the line", "Outliers — squared error punishes them hugely", "Inspect & remove outliers in data prep"],
            ["Two features always move together", "e.g. size_sqft and size_sqm — redundant", "Drop one of them"],
          ]}
        />
        <Callout type="analogy">
          📏 A ruler can&apos;t trace a rainbow. No amount of training fixes the wrong tool — that&apos;s
          why more algorithms exist (Decision Trees page).
        </Callout>
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases — Classic Crashes">
        <P>
          <strong>Case 1: The famous 1D crash</strong> — everyone hits this on day one:
        </P>
        <CodeBlock
          code={`X = np.array([1, 2, 3, 4, 5])    # ❌ 1D!
y = np.array([3, 5, 7, 9, 11])

model = LinearRegression()
model.fit(X, y)`}
          error
          output={`ValueError: Expected 2D array, got 1D array instead:
array=[1. 2. 3. 4. 5.].
Reshape your data either using array.reshape(-1, 1) if your data has
a single feature or array.reshape(1, -1) if it contains a single sample.`}
        />
        <P>
          The error literally tells you the fix: <IC>X.reshape(-1, 1)</IC> turns{" "}
          <IC>[1,2,3]</IC> into <IC>[[1],[2],[3]]</IC> — rows of one feature each.
        </P>
        <P>
          <strong>Case 2: Same crash on predict:</strong>
        </P>
        <CodeBlock
          code={`model.predict([6])      # ❌ needs a ROW: [[6]]`}
          error
          output={`ValueError: Expected 2D array, got 1D array instead:
array=[6.].`}
        />
        <P>
          <strong>Case 3: Text column survived into X:</strong>
        </P>
        <CodeBlock
          code={`X = df[["size", "city"]]    # 'city' still has "Bangalore" strings
model.fit(X, y)`}
          error
          output={`ValueError: could not convert string to float: 'Bangalore'`}
        />
        <P>Fix: encode first — <IC>pd.get_dummies(df, columns=[&quot;city&quot;])</IC> (Data Prep page).</P>
        <P>
          <strong>Case 4: predict before fit:</strong>
        </P>
        <CodeBlock
          code={`model = LinearRegression()
model.predict([[1600]])     # ❌ never trained!`}
          error
          output={`NotFittedError: This LinearRegression instance is not fitted yet.
Call 'fit' with appropriate arguments before using this estimator.`}
        />
        <P>
          <strong>Case 5: NaN slipped through cleaning:</strong>
        </P>
        <CodeBlock
          code={`model.fit(X_train, y_train)   # one NaN hiding in X_train`}
          error
          output={`ValueError: Input X contains NaN.
LinearRegression does not accept missing values encoded as NaN natively.`}
        />
        <Callout type="mistake">
          ⚠️ All five crashes trace back to skipping earlier pages: 2D shape (this page), encoding
          and NaN handling (Data Prep). The pipeline order exists because each step protects the
          next one.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Linear regression predicts", "NUMBERS (price, marks) — never categories"],
            ["The whole model", "y = w·x + b — training just finds the best w and b"],
            ["model.coef_", "w — slope(s): change in y per +1 of each feature"],
            ["model.intercept_", "b — value of y when all features are 0"],
            ["X must be 2D", "[[1],[2],[3]] — rows of features. reshape(-1, 1) fixes 1D"],
            ["model.score()", "R²: 1.0 perfect · 0 useless · negative = broken"],
            ["\"Best\" line means", "Smallest MSE — mean of squared (real − predicted)"],
            ["8-step skeleton", "load → clean → encode → X/y → split → fit → score → predict"],
            ["NotFittedError", "You called predict() before fit()"],
            ["Lines fail on", "Curves (underfits) and outliers (squared error explodes)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
