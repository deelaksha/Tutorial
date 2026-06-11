"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What Is ML? ⭐" },
  { id: "vs", label: "Rules vs Learning" },
  { id: "types", label: "The 3 Types of ML" },
  { id: "vocab", label: "The Vocabulary 🗣️" },
  { id: "workflow", label: "The ML Workflow ⭐" },
  { id: "first", label: "Your First 'Model' (no libraries)" },
  { id: "tools", label: "The Toolbox" },
  { id: "mistakes", label: "Beginner Traps 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function MlIntroPage() {
  return (
    <TopicShell
      icon="🤖"
      title="What Is Machine Learning?"
      gradientWord="Machine Learning"
      subtitle="Instead of writing rules, you show examples — and the machine writes the rules itself. The whole field in one visual page."
      nav={NAV}
      next={{ icon: "🧹", label: "Data Preparation", href: "/ml/data-prep" }}
    >
      {/* 1 ─ what */}
      <Section id="what" number="01" title="What Is ML? ⭐">
        <P>
          Normal programming: <strong>you write the rules</strong>, the computer applies
          them. Machine learning: <strong>you show examples</strong> (data + correct
          answers), and the computer <em>figures out the rules</em> — those discovered
          rules are called a <strong>model</strong>.
        </P>
        <FlowDiagram
          steps={[
            { label: "Traditional", sub: "rules + data → answers" },
            { label: "Machine Learning", sub: "data + answers → RULES (the model)" },
            { label: "Then", sub: "model + new data → predicted answers" },
          ]}
        />
        <Table
          head={["", "Traditional code", "Machine learning"]}
          rows={[
            ["You provide", "if/else rules", "examples with answers"],
            ["Computer produces", "answers", "the rules (a model)"],
            ["Change behavior", "rewrite code", "retrain with new data"],
            ["Great for", "clear logic (tax = 18%)", "fuzzy patterns (is this spam?)"],
          ]}
        />
        <Callout type="analogy">
          Teaching a kid to recognize dogs 🐶: you don&apos;t say &quot;if ears floppy AND
          tail wagging AND legs == 4&quot;. You point at 50 dogs and say &quot;dog&quot;.
          The kid&apos;s brain builds the rules. ML is exactly that — with math instead of
          a brain.
        </Callout>
      </Section>

      {/* 2 ─ rules vs learning */}
      <Section id="vs" number="02" title="Rules vs Learning — See the Difference">
        <CodeBlock
          title="the rule-based way — breaks constantly"
          code={`def is_spam(email):\n    if "FREE" in email: return True\n    if "winner" in email: return True\n    if "$$$" in email: return True\n    return False\n\nprint(is_spam("You are a winner! Claim FREE prize"))\nprint(is_spam("You are a w1nner! Claim FR EE prize"))   # spammer adapts 😈`}
          output={`True\nFalse`}
        />
        <P>
          Spammers change one letter and your rules die. You&apos;d be patching{" "}
          <IC>if</IC> statements forever. The ML way: feed 10,000 labeled emails to a
          model — it learns hundreds of subtle patterns (weird spelling, sender
          reputation, link counts) and <strong>updates itself when retrained</strong>.
        </P>
        <Table
          head={["Problem", "Rules or ML?", "Why"]}
          rows={[
            ["GST = 18% of price", "Rules ✍️", "exact formula exists"],
            ["Is this email spam?", "ML 🤖", "fuzzy, adversarial, changing"],
            ["House price from size/location", "ML 🤖", "pattern hidden in past sales"],
            ["Password ≥ 8 chars?", "Rules ✍️", "crisp condition"],
            ["Will this customer leave?", "ML 🤖", "patterns across 50 columns"],
          ]}
        />
        <Callout type="tip">
          Interview check: &quot;Use ML when the rules are too complex, unknown, or
          constantly changing — and you have <strong>data with answers</strong> to learn
          from.&quot; No data → no ML.
        </Callout>
      </Section>

      {/* 3 ─ types */}
      <Section id="types" number="03" title="The 3 Types of ML">
        <FlowDiagram
          steps={[
            { label: "Supervised 👨‍🏫", sub: "data + correct answers (labels)" },
            { label: "Unsupervised 🔍", sub: "data only — find hidden groups" },
            { label: "Reinforcement 🎮", sub: "learn by trial, reward, punishment" },
          ]}
        />
        <Table
          head={["Type", "You give it", "It learns to", "Examples"]}
          rows={[
            ["Supervised", "inputs + labels", "predict the label for new inputs", "spam filter, house price"],
            ["Unsupervised", "inputs only", "find structure / groups", "customer segments, anomalies"],
            ["Reinforcement", "environment + rewards", "actions that maximize reward", "game AI, robotics"],
          ]}
        />
        <P>
          Supervised splits again into two — <strong>this distinction decides which
          algorithm you use</strong>, so burn it in:
        </P>
        <Table
          head={["Supervised task", "Predicting a…", "Example", "Algorithms"]}
          rows={[
            ["Regression 📈", "NUMBER", "house price ₹74.5 lakh", "Linear Regression"],
            ["Classification 🏷️", "CATEGORY", "spam / not-spam", "Logistic Regression, Trees, KNN"],
          ]}
        />
        <Callout type="mistake">
          #1 beginner mix-up: <strong>Logistic Regression is CLASSIFICATION</strong>, not
          regression — terrible name, everyone agrees. Number → regression. Category →
          classification.
        </Callout>
      </Section>

      {/* 4 ─ vocab */}
      <Section id="vocab" number="04" title="The Vocabulary — Speak ML in 10 Words 🗣️">
        <CodeBlock
          title="one row of a house-price dataset"
          runnable={false}
          code={`  size_sqft   bedrooms   age_years   city        price_lakh\n  ─────────   ────────   ─────────   ────        ──────────\n  1200        2          5           Bangalore   74.5\n  └────────── FEATURES (X) ─────────────────┘    └ LABEL (y)\n\n  features = the inputs the model looks at\n  label    = the answer it must learn to predict`}
        />
        <Table
          head={["Term", "Meaning", "In code"]}
          rows={[
            ["Feature", "an input column", "X (capital — it's a table)"],
            ["Label / target", "the answer column", "y (small — one column)"],
            ["Sample / row", "one example", "one house"],
            ["Model", "the learned rules", "model = LinearRegression()"],
            ["Training", "learning from examples", "model.fit(X, y)"],
            ["Prediction", "answering for new data", "model.predict(X_new)"],
            ["Parameters / weights", "the numbers the model learned", "model.coef_"],
            ["Loss", "how wrong the model is (lower = better)", "MSE, etc."],
          ]}
        />
        <Callout type="tip">
          The entire sklearn library is 3 verbs: <IC>fit</IC> (learn),{" "}
          <IC>predict</IC> (answer), <IC>score</IC> (grade). Every algorithm, same 3 verbs.
        </Callout>
      </Section>

      {/* 5 ─ workflow */}
      <Section id="workflow" number="05" title="The ML Workflow — The Map You'll Follow ⭐">
        <FlowDiagram
          steps={[
            { label: "1. Get data 📦", sub: "CSV, database, API" },
            { label: "2. Clean it 🧹", sub: "missing values, encoding" },
            { label: "3. Split ✂️", sub: "train set + test set" },
            { label: "4. Train 🏋️", sub: "model.fit(X_train, y_train)" },
            { label: "5. Evaluate 📊", sub: "score on the UNSEEN test set" },
            { label: "6. Improve 🔁", sub: "better features, other models" },
            { label: "7. Ship 🚀", sub: "save model, predict live" },
          ]}
        />
        <P>
          Every topic in this track is one box of this map: data-prep is box 2, train/test
          split is box 3, the algorithms are box 4, evaluation is box 5, and the final
          project walks all seven end-to-end.
        </P>
        <Callout type="behind">
          Reality check from industry: steps 1–2 eat <strong>~80% of the time</strong>.
          The famous quote: &quot;garbage in, garbage out&quot; — a fancy model on dirty
          data loses to a simple model on clean data, every time.
        </Callout>
      </Section>

      {/* 6 ─ first model */}
      <Section id="first" number="06" title="Your First 'Model' — No Libraries, Pure Idea">
        <P>
          Strip away the math and &quot;training&quot; is just:{" "}
          <strong>look at examples → extract a pattern → store it → use it</strong>. Watch
          a 10-line &quot;model&quot; learn the average price per sqft:
        </P>
        <CodeBlock
          code={`# training data: (size_sqft, price_lakh)\ndata = [(1000, 50), (1200, 60), (1500, 75), (2000, 100)]\n\n# --- TRAINING: find the pattern, store it as a number ---\nrates = [price / size for size, price in data]\nlearned_rate = sum(rates) / len(rates)        # the "weight"!\nprint("learned: price = size ×", learned_rate)\n\n# --- PREDICTION: apply the stored pattern to NEW data ---\ndef predict(size):\n    return size * learned_rate\n\nprint("1800 sqft →", predict(1800), "lakh")\nprint("900 sqft  →", predict(900), "lakh")`}
          output={`learned: price = size × 0.05\n1800 sqft → 90.0 lakh\n900 sqft  → 45.0 lakh`}
        />
        <FlowDiagram
          steps={[
            { label: "examples", sub: "4 (size, price) pairs" },
            { label: "training", sub: "compress them into ONE number: 0.05" },
            { label: "model", sub: "predict(size) = size × 0.05" },
            { label: "new data", sub: "1800 → 90.0 — never seen before!" },
          ]}
        />
        <Callout type="behind">
          That stored <IC>0.05</IC> is literally what ML people call a{" "}
          <strong>weight/parameter</strong>. Real models learn thousands of such numbers,
          and learn them more cleverly (gradient descent — its own topic here), but the
          skeleton is identical: <strong>data in → numbers stored → predictions out</strong>.
        </Callout>
      </Section>

      {/* 7 ─ tools */}
      <Section id="tools" number="07" title="The Toolbox — What You'll Install">
        <CodeBlock
          title="terminal — one-time setup"
          runnable={false}
          code={`pip install numpy pandas scikit-learn matplotlib`}
        />
        <Table
          head={["Library", "Job", "You'll type"]}
          rows={[
            ["numpy", "fast math on arrays", "np.array, np.mean"],
            ["pandas", "tables (load/clean CSV)", "pd.read_csv, df.dropna"],
            ["scikit-learn", "the ML algorithms", "model.fit / predict / score"],
            ["matplotlib", "plots & charts", "plt.scatter, plt.plot"],
          ]}
        />
        <CodeBlock
          code={`import numpy as np\nimport pandas as pd\nimport sklearn\n\nprint(np.__version__)\nprint(pd.__version__)\nprint(sklearn.__version__)`}
          output={`1.26.4\n2.2.2\n1.4.2`}
        />
        <Callout type="mistake">
          It&apos;s <IC>pip install scikit-learn</IC> but{" "}
          <IC>import sklearn</IC> — different names! <IC>pip install sklearn</IC> is
          deprecated and errors out.
        </Callout>
      </Section>

      {/* 8 ─ traps */}
      <Section id="mistakes" number="08" title="Beginner Traps — Know Them Before You Fall 💥">
        <Table
          head={["Trap", "What happens", "The cure (covered in this track)"]}
          rows={[
            ["Testing on training data", "fake 99% accuracy", "train/test split topic"],
            ["Dirty data", "garbage predictions", "data-prep topic"],
            ["Memorizing, not learning", "overfitting — great in training, awful live", "train/test topic"],
            ["Accuracy on imbalanced data", "99% accurate, catches 0 frauds", "evaluation topic"],
            ["Strings fed to models", "ValueError: could not convert string to float", "encoding, data-prep topic"],
            ["Wrong task type", "regression model on categories", "the number-vs-category rule"],
          ]}
        />
        <Callout type="tip">
          Don&apos;t memorize these now — just recognize them when they appear. Each one
          gets a full crash-and-fix demo in its own topic.
        </Callout>
      </Section>

      {/* 9 ─ memorize */}
      <Section id="memorize" number="09" title="Must Memorize for Interviews 🧠">
        <MemorizeGrid
          items={[
            ["ML definition", "data + answers → rules (model)\ninstead of hand-written rules"],
            ["3 types", "Supervised · Unsupervised ·\nReinforcement"],
            ["Number vs category", "number → regression\ncategory → classification"],
            ["X and y", "X = features (inputs)\ny = label (answer)"],
            ["The 3 verbs", "model.fit(X, y)\nmodel.predict(X_new)\nmodel.score(X_test, y_test)"],
            ["The workflow", "get → clean → split →\ntrain → evaluate → ship"],
            ["Golden rule", "never test on training data"],
            ["Install", "pip install scikit-learn\nimport sklearn"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
