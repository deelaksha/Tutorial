"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "why", label: "Why 80% of ML Is Cleaning" },
  { id: "load", label: "Load & Inspect ⭐" },
  { id: "missing", label: "Missing Values ⭐" },
  { id: "encoding", label: "Text → Numbers (Encoding)" },
  { id: "scaling", label: "Feature Scaling" },
  { id: "xy", label: "Split into X and y ⭐" },
  { id: "checklist", label: "The Cleaning Checklist" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function MlDataPrepPage() {
  return (
    <TopicShell
      icon="🧹"
      title="Data Preparation"
      gradientWord="Data Prep"
      subtitle="Models eat only clean numbers. Loading, missing values, encoding text, scaling — the 80% of ML nobody shows in movies."
      nav={NAV}
      next={{ icon: "✂️", label: "Train / Test Split", href: "/ml/train-test" }}
    >
      {/* 1 ─ why */}
      <Section id="why" number="01" title="Why 80% of ML Is Cleaning">
        <P>
          Real data is a mess: missing ages, &quot;Bangalore&quot; spelled 4 ways, prices
          as text, salaries in one column from ₹10k to ₹10cr. Models are just math —{" "}
          <strong>they crash on text and lie on dirty numbers</strong>.
        </P>
        <FlowDiagram
          steps={[
            { label: "raw CSV 🗑️", sub: "NaNs, text, weird scales" },
            { label: "clean 🧹", sub: "fill/drop missing" },
            { label: "encode 🔢", sub: "text → numbers" },
            { label: "scale ⚖️", sub: "comparable ranges" },
            { label: "model-ready ✅", sub: "pure numeric table" },
          ]}
        />
        <Callout type="analogy">
          Cooking 🍳: the chef&apos;s knife work (washing, peeling, chopping) takes longer
          than the actual frying. <IC>model.fit()</IC> is the 30-second fry; data prep is
          everything before it.
        </Callout>
      </Section>

      {/* 2 ─ load */}
      <Section id="load" number="02" title="Load & Inspect — Meet Your Data ⭐">
        <CodeBlock
          title="students.csv → pandas DataFrame"
          code={`import pandas as pd\n\ndf = pd.read_csv("students.csv")\nprint(df.head())              # first 5 rows — ALWAYS look first`}
          output={`       name  hours  attendance      city  passed\n0  Deelaksha    5.0          92  Bangalore     yes\n1       John    NaN          61     Mysore      no\n2       Maya    7.5          98  Bangalore     yes\n3       Ravi    2.0          45        NaN      no\n4       Sara    6.0          88      Delhi     yes`}
        />
        <CodeBlock
          title="the 3 inspection commands you run on EVERY dataset"
          code={`print(df.shape)               # (rows, columns)\nprint(df.info())              # types + missing counts\nprint(df.describe())          # stats for numeric columns`}
          output={`(5, 5)\n<class 'pandas.core.frame.DataFrame'>\nRangeIndex: 5 entries, 0 to 4\n #   Column      Non-Null Count  Dtype  \n---  ------      --------------  -----  \n 0   name        5 non-null      object \n 1   hours       4 non-null      float64\n 2   attendance  5 non-null      int64  \n 3   city        4 non-null      object \n 4   passed      5 non-null      object \n\n            hours  attendance\ncount    4.000000    5.000000\nmean     5.125000   76.800000\nstd      2.286737   22.130296\nmin      2.000000   45.000000\nmax      7.500000   98.000000`}
        />
        <Callout type="tip">
          Read <IC>info()</IC> like a doctor reads an X-ray: <IC>hours 4 non-null</IC> out
          of 5 rows = 1 missing. <IC>object</IC> dtype = text that models can&apos;t eat
          yet. Two problems found in two seconds.
        </Callout>
      </Section>

      {/* 3 ─ missing */}
      <Section id="missing" number="03" title="Missing Values — Drop or Fill ⭐">
        <CodeBlock
          title="find the holes"
          code={`print(df.isnull().sum())      # missing count per column`}
          output={`name          0\nhours         1\nattendance    0\ncity          1\npassed        0\ndtype: int64`}
        />
        <CodeBlock
          title="option 1 — drop rows with holes (when data is plentiful)"
          code={`dropped = df.dropna()\nprint(dropped.shape)          # lost 2 of 5 rows!`}
          output={`(3, 5)`}
        />
        <CodeBlock
          title="option 2 — fill the holes (when every row is precious)"
          code={`df["hours"] = df["hours"].fillna(df["hours"].median())   # number → median\ndf["city"]  = df["city"].fillna(df["city"].mode()[0])     # text → most common\n\nprint(df[["name", "hours", "city"]])`}
          output={`       name  hours       city\n0  Deelaksha   5.00  Bangalore\n1       John   5.50     Mysore\n2       Maya   7.50  Bangalore\n3       Ravi   2.00  Bangalore\n4       Sara   6.00      Delhi`}
        />
        <Table
          head={["Strategy", "When", "Code"]}
          rows={[
            ["dropna()", "few missing rows, lots of data", "df.dropna()"],
            ["fill median", "numeric column with outliers", "fillna(df.col.median())"],
            ["fill mean", "numeric, no big outliers", "fillna(df.col.mean())"],
            ["fill mode", "categorical (text) column", "fillna(df.col.mode()[0])"],
            ["fill 0 / 'unknown'", "missing MEANS something", "fillna(0)"],
          ]}
        />
        <Callout type="mistake">
          Median beats mean for things like salary — one billionaire in the column drags
          the <strong>mean</strong> to nonsense, while the <strong>median</strong>{" "}
          doesn&apos;t move. Default to median when unsure.
        </Callout>
      </Section>

      {/* 4 ─ encoding */}
      <Section id="encoding" number="04" title="Encoding — Text → Numbers">
        <CodeBlock
          title="💥 what happens if you skip this"
          code={`from sklearn.linear_model import LinearRegression\n\nX = df[["hours", "city"]]          # city is text!\ny = df["attendance"]\nLinearRegression().fit(X, y)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    LinearRegression().fit(X, y)\nValueError: could not convert string to float: 'Bangalore'`}
          error
        />
        <CodeBlock
          title="binary labels → simple map"
          code={`df["passed"] = df["passed"].map({"yes": 1, "no": 0})\nprint(df["passed"].tolist())`}
          output={`[1, 0, 1, 0, 1]`}
        />
        <CodeBlock
          title="multi-category → one-hot encoding (get_dummies)"
          code={`encoded = pd.get_dummies(df, columns=["city"], dtype=int)\nprint(encoded[["name", "city_Bangalore", "city_Delhi", "city_Mysore"]])`}
          output={`       name  city_Bangalore  city_Delhi  city_Mysore\n0  Deelaksha               1           0            0\n1       John               0           0            1\n2       Maya               1           0            0\n3       Ravi               1           0            0\n4       Sara               0           1            0`}
        />
        <Callout type="behind">
          Why not just Bangalore=0, Delhi=1, Mysore=2? Because the model would believe{" "}
          <strong>Mysore = 2 × Delhi</strong> — fake math on fake order. One-hot gives each
          city its own 0/1 column: no order invented. (Label-numbers are fine for the{" "}
          <em>target</em> y, and for truly ordered things like S&lt;M&lt;L.)
        </Callout>
      </Section>

      {/* 5 ─ scaling */}
      <Section id="scaling" number="05" title="Feature Scaling — Make Columns Comparable">
        <P>
          <IC>salary</IC> runs 20,000–200,000 while <IC>age</IC> runs 20–60. Distance-based
          models (KNN, KMeans) and gradient descent see salary as 1000× more important —{" "}
          <strong>purely because of its units</strong>. Scaling fixes the playing field.
        </P>
        <CodeBlock
          code={`from sklearn.preprocessing import StandardScaler, MinMaxScaler\nimport numpy as np\n\nX = np.array([[25, 30000], [35, 60000], [45, 90000], [55, 120000]])\n\nstd = StandardScaler().fit_transform(X)      # mean 0, std 1\nprint(std.round(2))\n\nmm = MinMaxScaler().fit_transform(X)         # squeeze to 0..1\nprint(mm.round(2))`}
          output={`[[-1.34 -1.34]\n [-0.45 -0.45]\n [ 0.45  0.45]\n [ 1.34  1.34]]\n[[0.   0.  ]\n [0.33 0.33]\n [0.67 0.67]\n [1.   1.  ]]`}
        />
        <Table
          head={["Scaler", "Formula", "Result", "Use when"]}
          rows={[
            ["StandardScaler", "(x − mean) / std", "mean 0, std 1", "default choice"],
            ["MinMaxScaler", "(x − min) / (max − min)", "0 to 1", "need bounded values"],
            ["No scaling", "—", "—", "tree models (they don't care)"],
          ]}
        />
        <Callout type="mistake">
          Fit the scaler on <strong>training data only</strong>, then{" "}
          <IC>transform</IC> the test data with it. Fitting on everything leaks test-set
          information into training — the &quot;data leakage&quot; sin (full demo in the
          train/test topic).
        </Callout>
      </Section>

      {/* 6 ─ X y */}
      <Section id="xy" number="06" title="The Final Step — Split into X and y ⭐">
        <CodeBlock
          code={`# after cleaning + encoding, separate question from answer:\nfeature_cols = ["hours", "attendance", "city_Bangalore", "city_Delhi", "city_Mysore"]\n\nX = encoded[feature_cols]     # the INPUTS  (capital X = table)\ny = encoded["passed"]         # the ANSWER  (small y = one column)\n\nprint(X.shape)\nprint(y.shape)\nprint(X.dtypes.unique())      # every column numeric → model-ready ✅`}
          output={`(5, 5)\n(5,)\n[dtype('float64') dtype('int64')]`}
        />
        <FlowDiagram
          steps={[
            { label: "clean table", sub: "all numeric" },
            { label: "X = feature columns", sub: "what the model SEES" },
            { label: "y = target column", sub: "what it must PREDICT" },
            { label: "model.fit(X, y)", sub: "ready for the next topic" },
          ]}
        />
        <Callout type="mistake">
          Never let the answer hide inside X! If <IC>passed</IC> sneaks into the features,
          the model &quot;predicts&quot; with 100% accuracy by just reading the answer
          column — and is useless on real data where the answer doesn&apos;t exist yet.
        </Callout>
      </Section>

      {/* 7 ─ checklist */}
      <Section id="checklist" number="07" title="The Cleaning Checklist — Run Every Time">
        <Table
          head={["#", "Check", "Command"]}
          rows={[
            ["1", "Peek at it", "df.head()"],
            ["2", "Size & types", "df.shape, df.info()"],
            ["3", "Missing values", "df.isnull().sum()"],
            ["4", "Fill or drop", "fillna() / dropna()"],
            ["5", "Duplicates", "df.duplicated().sum() → drop_duplicates()"],
            ["6", "Text → numbers", "map() / get_dummies()"],
            ["7", "Scale if needed", "StandardScaler()"],
            ["8", "Separate", "X = features, y = target"],
          ]}
        />
        <CodeBlock
          title="bonus: spot duplicates"
          code={`print(df.duplicated().sum())\ndf = df.drop_duplicates()\nprint(df.shape)`}
          output={`0\n(5, 6)`}
        />
      </Section>

      {/* 8 ─ exceptions */}
      <Section id="exceptions" number="08" title="Exception Cases — Recap 💥">
        <CodeBlock
          title="KeyError — column name typo (or invisible spaces!)"
          code={`print(df["Hours"])         # column is 'hours', lowercase`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    print(df["Hours"])\nKeyError: 'Hours'`}
          error
        />
        <CodeBlock
          title="ValueError — text reached the model"
          code={`LinearRegression().fit(df[["city"]], y)`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    LinearRegression().fit(df[["city"]], y)\nValueError: could not convert string to float: 'Bangalore'`}
          error
        />
        <CodeBlock
          title="FileNotFoundError — wrong path / wrong folder"
          code={`df = pd.read_csv("studnets.csv")`}
          output={`Traceback (most recent call last):\n  File "main.py", line 1, in <module>\n    df = pd.read_csv("studnets.csv")\nFileNotFoundError: [Errno 2] No such file or directory: 'studnets.csv'`}
          error
        />
        <Table
          head={["Error", "Real meaning", "Fix"]}
          rows={[
            ["KeyError: 'col'", "typo or hidden spaces in header", "print(df.columns.tolist())"],
            ["could not convert string to float", "un-encoded text column in X", "map() / get_dummies() first"],
            ["Input contains NaN", "missing values reached the model", "fillna() / dropna() first"],
            ["FileNotFoundError", "wrong filename or folder", "check path, os.getcwd()"],
          ]}
        />
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["Load + first look", 'df = pd.read_csv("data.csv")\ndf.head(); df.info()'],
            ["Count holes", "df.isnull().sum()"],
            ["Fill numeric / text", "fillna(df.col.median())\nfillna(df.col.mode()[0])"],
            ["Binary encode", 'df.passed.map({"yes":1, "no":0})'],
            ["One-hot encode", 'pd.get_dummies(df, columns=["city"])'],
            ["Why one-hot?", "label numbers invent fake order"],
            ["Scale", "StandardScaler().fit_transform(X)"],
            ["Finish line", "X = features, y = target\nall numeric, no NaN"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
