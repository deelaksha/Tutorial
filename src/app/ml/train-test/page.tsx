"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why Split At All?" },
  { id: "exam", label: "The Exam Analogy ⭐" },
  { id: "split", label: "train_test_split" },
  { id: "random-state", label: "random_state" },
  { id: "cheat", label: "The Cheating Demo ⭐" },
  { id: "overfit", label: "Overfitting vs Underfitting" },
  { id: "leakage", label: "Data Leakage" },
  { id: "stratify", label: "stratify (classification)" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function TrainTestPage() {
  return (
    <TopicShell
      icon="✂️"
      title="Train / Test Split"
      gradientWord="Split"
      subtitle="The single most important habit in ML: hide some data from your model, then grade it on what it has NEVER seen. Skip this and every accuracy number you report is a lie."
      nav={NAV}
      next={{ icon: "📈", label: "Linear Regression", href: "/ml/linear-regression" }}
    >
      {/* 01 ─ WHY */}
      <Section id="why" number="01" title="Why Split At All?">
        <P>
          A model&apos;s job is to work on <strong>future data it has never seen</strong>. So the only
          honest way to measure it is to test it on data it has never seen. If you test on the same
          rows it trained on, the model can just <strong>memorize</strong> the answers.
        </P>
        <FlowDiagram
          steps={[
            { label: "All data (100%)", sub: "every row you have" },
            { label: "Train set (80%)", sub: "model LEARNS from this" },
            { label: "Test set (20%)", sub: "model is GRADED on this" },
            { label: "Score on test", sub: "the only number you trust" },
          ]}
        />
        <Callout type="analogy">
          🎓 A student who sees the exam paper the night before scores 100%. Did they learn the
          subject? No idea — the score is meaningless. Same with a model tested on its training
          data.
        </Callout>
        <Callout type="behind">
          Typical splits: <IC>80/20</IC> or <IC>75/25</IC>. Big datasets (millions of rows) can use
          99/1 — the test set just needs enough rows to give a stable score.
        </Callout>
      </Section>

      {/* 02 ─ EXAM ANALOGY */}
      <Section id="exam" number="02" title="The Exam Analogy ⭐">
        <P>Burn this table into your brain — it maps every ML word to school life:</P>
        <Table
          head={["ML term", "School equivalent", "What happens"]}
          rows={[
            ["Training set", "Textbook + homework problems", "Student studies these, sees the answers"],
            ["Test set", "Final exam (sealed envelope)", "Never seen before — measures real learning"],
            ["fit(X_train, y_train)", "Studying", "Model adjusts itself using train data"],
            ["predict(X_test)", "Writing the exam", "Model answers unseen questions"],
            ["score on test", "Exam grade", "The honest number"],
            ["score on train", "Grading your own homework", "Always looks great — don't report this!"],
            ["Overfitting", "Memorizing answers word-for-word", "Aces homework, fails exam"],
            ["Data leakage", "Exam questions leaked into homework", "Fake high score, real-world failure"],
          ]}
        />
        <Callout type="tip">
          One rule covers everything: <strong>the test set is sacred</strong>. The model must never
          see it — not during training, not during scaling, not during feature selection.
        </Callout>
      </Section>

      {/* 03 ─ train_test_split */}
      <Section id="split" number="03" title="train_test_split — One Line Does It">
        <P>
          sklearn gives you one function. It shuffles the rows, then cuts them into 4 pieces:
          <IC>X_train</IC>, <IC>X_test</IC>, <IC>y_train</IC>, <IC>y_test</IC> — always in that
          order.
        </P>
        <CodeBlock
          title="split.py"
          code={`from sklearn.model_selection import train_test_split
import pandas as pd

df = pd.read_csv("students.csv")     # 100 rows

X = df[["hours", "attendance"]]      # features
y = df["passed"]                     # label

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,       # 20% goes to test
    random_state=42      # same shuffle every run
)

print("Total rows :", len(df))
print("X_train    :", X_train.shape)
print("X_test     :", X_test.shape)
print("y_train    :", y_train.shape)
print("y_test     :", y_test.shape)`}
          output={`Total rows : 100
X_train    : (80, 2)
X_test     : (20, 2)
y_train    : (80,)
y_test     : (20,)`}
        />
        <P>Visually, the 100 shuffled rows get cut like this:</P>
        <FlowDiagram
          steps={[
            { label: "100 rows", sub: "X and y together" },
            { label: "🔀 shuffle", sub: "rows mixed randomly" },
            { label: "✂️ cut at 80%", sub: "test_size=0.2" },
            { label: "80 train / 20 test", sub: "X and y stay paired" },
          ]}
        />
        <Callout type="mistake">
          ⚠️ The return order is <strong>X_train, X_test, y_train, y_test</strong> — X&apos;s first,
          then y&apos;s. Swapping them is a classic silent bug: your code runs, your scores are
          garbage.
        </Callout>
        <Callout type="behind">
          Rows are shuffled <em>before</em> cutting because data files are often sorted (all
          &quot;passed&quot; students first, all &quot;failed&quot; last). Cutting a sorted file
          without shuffling would put all of one class in train and the other in test.
        </Callout>
      </Section>

      {/* 04 ─ random_state */}
      <Section id="random-state" number="04" title="random_state — Same Shuffle Every Time">
        <P>
          The shuffle is random — so every run gives a different split, and a different score.
          <IC>random_state</IC> freezes the shuffle so results are <strong>reproducible</strong>.
        </P>
        <CodeBlock
          title="random_state_demo.py"
          code={`# WITHOUT random_state — different rows every run
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
print("Run A first test row:", X_test.index[0])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
print("Run B first test row:", X_test.index[0])

# WITH random_state — identical every run, forever
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Run C first test row:", X_test.index[0])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Run D first test row:", X_test.index[0])`}
          output={`Run A first test row: 17
Run B first test row: 64
Run C first test row: 83
Run D first test row: 83`}
        />
        <Table
          head={["Question", "Answer"]}
          rows={[
            ["Does 42 mean anything special?", "No — any fixed number works. 42 is just tradition."],
            ["Does it change model quality?", "No. It only fixes WHICH rows land in test."],
            ["When do I need it?", "Tutorials, debugging, comparing two models fairly."],
            ["When to drop it?", "Final production checks — verify results hold across splits."],
          ]}
        />
        <Callout type="tip">
          Comparing model A vs model B? Use the <strong>same random_state</strong> so both face the
          exact same exam. Otherwise one model might just get an easier test set.
        </Callout>
      </Section>

      {/* 05 ─ CHEATING DEMO */}
      <Section id="cheat" number="05" title="The Cheating Demo — Test-on-Train Inflated Score ⭐">
        <P>
          Watch the lie happen. Same model, two ways of grading — one honest, one cheating:
        </P>
        <CodeBlock
          title="cheating_demo.py"
          code={`from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = DecisionTreeClassifier()     # trees can memorize perfectly
model.fit(X_train, y_train)          # learn from train ONLY

print("Score on TRAIN data:", model.score(X_train, y_train))
print("Score on TEST  data:", model.score(X_test, y_test))`}
          output={`Score on TRAIN data: 1.0
Score on TEST  data: 0.75`}
        />
        <P>
          <strong>1.0 on train</strong> — the tree memorized all 80 rows it studied. The real grade
          is <strong>0.75</strong>: on unseen students it&apos;s right only 3 times out of 4.
        </P>
        <Table
          head={["Score", "What it tells you", "Report it?"]}
          rows={[
            ["score(X_train, y_train) = 1.0", "Model memorized homework", "❌ Never"],
            ["score(X_test, y_test) = 0.75", "Real skill on unseen data", "✅ Always"],
            ["train ≫ test gap (1.0 vs 0.75)", "Overfitting alarm 🚨", "Investigate"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ &quot;My model is 100% accurate!&quot; is almost always this bug — scoring on training
          data. If your accuracy looks too good to be true, it is.
        </Callout>
      </Section>

      {/* 06 ─ OVERFIT / UNDERFIT */}
      <Section id="overfit" number="06" title="Overfitting vs Underfitting">
        <P>
          The train/test gap diagnoses your model. There are exactly three situations:
        </P>
        <Table
          head={["", "Underfitting 😴", "Just right ✅", "Overfitting 🤯"]}
          rows={[
            ["Train score", "Low (0.60)", "Good (0.88)", "Perfect (1.00)"],
            ["Test score", "Low (0.58)", "Good (0.85)", "Bad (0.70)"],
            ["Gap", "Tiny", "Small", "HUGE"],
            ["Student version", "Didn't study at all", "Understood the subject", "Memorized, understood nothing"],
            ["Model is…", "Too simple", "Balanced", "Too complex"],
            ["Fix", "Bigger model, better features", "Ship it 🚀", "Simpler model, more data"],
          ]}
        />
        <CodeBlock
          title="diagnose.py"
          code={`train_score = model.score(X_train, y_train)
test_score  = model.score(X_test, y_test)

print(f"train={train_score:.2f}  test={test_score:.2f}  gap={train_score - test_score:.2f}")

if train_score < 0.7 and test_score < 0.7:
    print("Diagnosis: UNDERFITTING -> model too simple")
elif train_score - test_score > 0.15:
    print("Diagnosis: OVERFITTING  -> model memorized train data")
else:
    print("Diagnosis: looks healthy")`}
          output={`train=1.00  test=0.75  gap=0.25
Diagnosis: OVERFITTING  -> model memorized train data`}
        />
        <Callout type="analogy">
          🎯 Underfitting = a student who skimmed one page. Overfitting = a student who memorized
          the textbook word-for-word but panics at a reworded question. You want the one who
          understood the <em>ideas</em>.
        </Callout>
      </Section>

      {/* 07 ─ LEAKAGE */}
      <Section id="leakage" number="07" title="Data Leakage — The Silent Score Inflator">
        <P>
          Leakage = information from the test set (or from the future) sneaking into training. The
          model looks brilliant in your notebook and falls apart in production.
        </P>
        <CodeBlock
          title="leakage_scaling.py"
          code={`from sklearn.preprocessing import StandardScaler

# ❌ WRONG — scaler sees ALL rows, including test rows
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)            # test stats leaked in!
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)

# ✅ RIGHT — split FIRST, fit scaler on train ONLY
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)     # learn mean/std from train
X_test_s  = scaler.transform(X_test)          # APPLY only - no fitting!`}
          output={`(no output - but the order of these lines decides
 whether your test score is honest or inflated)`}
        />
        <Table
          head={["Leak", "How it happens", "Fix"]}
          rows={[
            ["Scaling before splitting", "Scaler learns test-set mean/std", "Split first, fit_transform on train, transform on test"],
            ["Label hiding in X", "X contains 'passed' or 'total_marks'", "Drop label-like columns from X"],
            ["Duplicate rows", "Same row in both train and test", "df.drop_duplicates() before split"],
            ["Future information", "Using next month's data to predict this month", "Split by time for time-based data"],
          ]}
        />
        <Callout type="behind">
          The golden order: <strong>split → fit on train → transform both</strong>. The test set must
          be treated exactly like future data — because that&apos;s what it is pretending to be.
        </Callout>
      </Section>

      {/* 08 ─ STRATIFY */}
      <Section id="stratify" number="08" title="stratify — Fair Splits for Classification">
        <P>
          Imagine 90 passed / 10 failed students. Random shuffling might put <strong>all 10 failed
          students in train</strong> — the test set would have zero failures and couldn&apos;t
          measure them at all. <IC>stratify=y</IC> keeps class proportions identical in both pieces.
        </P>
        <CodeBlock
          title="stratify.py"
          code={`import pandas as pd

print("Whole dataset:")
print(y.value_counts(normalize=True))

# without stratify — proportions drift
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=7)
print("\\nTest set WITHOUT stratify:")
print(y_te.value_counts(normalize=True))

# with stratify — proportions preserved
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, random_state=7, stratify=y
)
print("\\nTest set WITH stratify:")
print(y_te.value_counts(normalize=True))`}
          output={`Whole dataset:
passed
1    0.9
0    0.1
Name: proportion, dtype: float64

Test set WITHOUT stratify:
passed
1    0.95
0    0.05
Name: proportion, dtype: float64

Test set WITH stratify:
passed
1    0.9
0    0.1
Name: proportion, dtype: float64`}
        />
        <Callout type="tip">
          Rule of thumb: doing <strong>classification</strong>? Add <IC>stratify=y</IC>. Doing
          regression (predicting a number)? Leave it out — it only works with category labels.
        </Callout>
      </Section>

      {/* 09 ─ EXCEPTIONS */}
      <Section id="exceptions" number="09" title="💥 Exception Cases — When Splitting Bites">
        <P>
          <strong>Case 1: Wrong unpacking order — silent disaster.</strong> Runs fine, scores are
          nonsense:
        </P>
        <CodeBlock
          code={`# ❌ y_train and X_test swapped!
X_train, y_train, X_test, y_test = train_test_split(X, y, test_size=0.2)

model.fit(X_train, y_train)   # 'y_train' is actually X_test!`}
          error
          output={`ValueError: Found input variables with inconsistent numbers of samples: [80, 20]`}
        />
        <P>
          You got lucky — the row counts clashed (80 vs 20) so it crashed. With certain shapes it
          can run silently. Memorize the order: <strong>X_train, X_test, y_train, y_test</strong>.
        </P>
        <P>
          <strong>Case 2: X and y have different lengths:</strong>
        </P>
        <CodeBlock
          code={`X = df[["hours", "attendance"]]        # 100 rows
y = df["passed"].dropna()              # 97 rows - dropped NaNs from y only!

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)`}
          error
          output={`ValueError: Found input variables with inconsistent numbers of samples: [100, 97]`}
        />
        <P>
          Fix: clean the <em>whole DataFrame</em> first (<IC>df = df.dropna()</IC>), then carve out
          X and y — so rows stay paired.
        </P>
        <P>
          <strong>Case 3: test_size too big for tiny data:</strong>
        </P>
        <CodeBlock
          code={`# only 4 rows, asking for 20% test = 0.8 rows!
X_train, X_test, y_train, y_test = train_test_split(
    X_tiny, y_tiny, test_size=0.2
)
print(X_test.shape)`}
          output={`(1, 2)   # sklearn rounds up to at least 1 row - a 1-row exam is meaningless`}
        />
        <P>
          <strong>Case 4: stratify with a class that has only 1 member:</strong>
        </P>
        <CodeBlock
          code={`# label 'distinction' appears in just 1 row
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y)`}
          error
          output={`ValueError: The least populated class in y has only 1 member,
which is too few. The minimum number of groups for any class
cannot be less than 2.`}
        />
        <P>
          A class needs at least 2 rows to put one in each side. Fix: collect more data for that
          class, or merge it into a similar class.
        </P>
        <Callout type="mistake">
          ⚠️ Biggest non-crash bug of all: calling <IC>fit</IC> with test data anywhere in your
          pipeline. Python won&apos;t complain — your inflated score will, three weeks later, in
          production.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Why split?", "Models must be graded on data they've NEVER seen — otherwise they just memorize"],
            ["Return order", "X_train, X_test, y_train, y_test — X's first, then y's"],
            ["test_size=0.2", "20% test, 80% train — the standard starting point"],
            ["random_state=42", "Freezes the shuffle → same split every run (42 = tradition, any number works)"],
            ["score on train", "Grading your own homework — NEVER report this number"],
            ["Overfitting", "train=1.0, test=0.75 → memorized, didn't learn. Gap = alarm 🚨"],
            ["Underfitting", "Both scores low → model too simple"],
            ["Leakage golden order", "split → fit scaler on train → transform both"],
            ["stratify=y", "Keeps class proportions equal in train & test (classification only)"],
            ["Test set is sacred", "Touch it once, at the very end, only to report the final score"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
