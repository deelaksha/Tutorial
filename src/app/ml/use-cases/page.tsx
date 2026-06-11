"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "daily", label: "AI Before Breakfast ⭐" },
  { id: "map", label: "AI vs ML vs Deep Learning" },
  { id: "recommend", label: "Recommendations" },
  { id: "spam-fraud", label: "Spam & Fraud Detection" },
  { id: "vision", label: "Computer Vision" },
  { id: "language", label: "ChatGPT & Language" },
  { id: "industries", label: "Industry Map" },
  { id: "your-toolkit", label: "Your Toolkit → Real Products ⭐" },
  { id: "limits", label: "Where AI Fails" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function UseCasesPage() {
  return (
    <TopicShell
      icon="🌍"
      title="AI/ML in the Real World"
      gradientWord="Real World"
      subtitle="Before learning HOW models are trained, see WHERE they already run your life — and discover that every billion-dollar AI product is built from the exact concepts in this track."
      nav={NAV}
      next={{ icon: "🤖", label: "What is ML?", href: "/ml/intro" }}
    >
      {/* 01 ─ DAILY */}
      <Section id="daily" number="01" title="You Used AI 10 Times Before Breakfast ⭐">
        <P>
          AI isn&apos;t robots from movies — it&apos;s invisible software making thousands of small
          predictions around you all day. A normal morning, annotated:
        </P>
        <CodeBlock
          title="a_normal_morning.txt"
          runnable={false}
          code={`07:00  📱 Face unlock opens your phone        → computer vision
07:01  📰 Feed shows posts "for you"           → recommendation model
07:05  ⌨️  Keyboard suggests your next word     → language model
07:10  📧 Inbox is spam-free                   → spam classifier
07:15  🎵 Spotify plays a song you love        → clustering + recommendations
07:30  🗺️  Maps says "leave now, 22 min route"  → traffic prediction (regression)
07:45  💳 Card swipe approved in 200 ms        → fraud detection (classification)
08:00  📸 Camera blurs background perfectly    → image segmentation
08:15  🚗 Cab fare "surge ×1.4"                → demand prediction (regression)
08:30  🎬 "Because you watched..."             → recommendations again`}
          output={`10 AI decisions. Zero robots.
Every single one is fit() + predict() running on a server —
the exact two verbs you learned in this track.`}
        />
        <Callout type="analogy">
          ⚡ AI today is like electricity in 1920 — not a product itself, but the invisible thing
          inside every product. Nobody says &quot;I used electricity today&quot;; soon nobody will
          say &quot;I used AI today&quot; either.
        </Callout>
      </Section>

      {/* 02 ─ MAP */}
      <Section id="map" number="02" title="AI vs ML vs Deep Learning vs GenAI — The Map">
        <P>
          These words get mixed up everywhere. They&apos;re actually circles inside circles:
        </P>
        <CodeBlock
          title="the_circles.txt"
          runnable={false}
          code={`┌─ AI ──────────────────────────────────────────────────┐
│  Any machine doing "smart" tasks (incl. hand-coded     │
│  rules — a chess bot with if/else is AI!)              │
│                                                        │
│  ┌─ MACHINE LEARNING ─────────────────────────────┐    │
│  │  Smart behaviour LEARNED from data, not coded  │    │
│  │  ← everything in this track lives here         │    │
│  │                                                │    │
│  │  ┌─ DEEP LEARNING ──────────────────────────┐  │    │
│  │  │  ML using huge neural networks           │  │    │
│  │  │  (vision, speech, language)              │  │    │
│  │  │                                          │  │    │
│  │  │  ┌─ GENERATIVE AI ────────────────────┐  │  │    │
│  │  │  │  Deep learning that CREATES:       │  │  │    │
│  │  │  │  ChatGPT, image generators...      │  │  │    │
│  │  │  └────────────────────────────────────┘  │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘`}
          output={`ChatGPT is GenAI → which is deep learning → which is ML → which is AI.
A spam filter is ML and AI, but NOT deep learning.
Your gradient-descent loop is the engine of ALL inner circles.`}
        />
        <Table
          head={["Term", "One-liner", "Example"]}
          rows={[
            ["AI", "Machines doing smart tasks (any method)", "Chess engine, Maps routing"],
            ["Machine Learning", "Smartness learned from data", "Spam filter, price prediction"],
            ["Deep Learning", "ML with many-layered neural networks", "Face unlock, voice assistants"],
            ["Generative AI", "Deep learning that creates new content", "ChatGPT, image generators"],
          ]}
        />
        <Callout type="behind">
          A neural network is gradient descent (page ⛰️) with millions of w&apos;s arranged in
          layers. Same loss, same update rule <IC>w = w − lr × gradient</IC> — just more knobs.
          You already know the engine; deep learning is a bigger car.
        </Callout>
      </Section>

      {/* 03 ─ RECOMMEND */}
      <Section id="recommend" number="03" title="Recommendations — Netflix, YouTube, Spotify, Amazon">
        <P>
          The most money-making ML on Earth: <strong>predict what you&apos;ll click next</strong>.
          ~80% of Netflix watch-time comes from its recommendations.
        </P>
        <FlowDiagram
          steps={[
            { label: "Collect behaviour", sub: "watched, skipped, replayed, hour of day" },
            { label: "Find similar users", sub: "clustering — KMeans page! 🫧" },
            { label: "Score every title", sub: "P(you finish it) — classification 🚦" },
            { label: "Sort & show top 10", sub: "your homepage = sorted predictions" },
          ]}
        />
        <CodeBlock
          title="how_netflix_thinks.txt"
          runnable={false}
          code={`Deelaksha's cluster: "binge-watches thrillers at night, skips intros"

                        P(watch full movie)
  Thriller B            0.91  ████████████████████  ← shown 1st
  Crime documentary     0.84  █████████████████     ← shown 2nd
  New thriller series   0.77  ███████████████       ← shown 3rd
  Romantic comedy       0.12  ██                    ← never shown
  Cooking show          0.07  █                     ← never shown`}
          output={`Your homepage is literally predict_proba() sorted descending.
Different person → different probabilities → different homepage.
No two people see the same Netflix.`}
        />
        <Callout type="tip">
          Spot the track concepts: <strong>clustering</strong> groups similar users,{" "}
          <strong>classification</strong> scores each title, and the cold-start problem (new user,
          no data) is why every app begs you to &quot;pick 3 genres you like&quot; on signup —
          they&apos;re collecting their first X.
        </Callout>
      </Section>

      {/* 04 ─ SPAM/FRAUD */}
      <Section id="spam-fraud" number="04" title="Spam & Fraud — Classification Guarding Your Money">
        <P>
          Every email and every card swipe passes through a classifier. This is the imbalanced-data
          world from the Evaluation page — fraud is ~0.1% of transactions:
        </P>
        <CodeBlock
          title="card_swipe.txt"
          runnable={false}
          code={`💳 Swipe: ₹48,000 · 02:47 AM · electronics store · 900 km from home

Features the model sees in 200 ms:
  amount_vs_usual      = 12.0x   ← you usually spend ₹4k
  hour                 = 02:47   ← you never shop at 3 AM
  distance_from_home   = 900 km
  merchant_risk_score  = 0.7
  swipes_last_hour     = 4       ← velocity check

predict_proba → P(fraud) = 0.93  →  ❌ DECLINED + SMS sent`}
          output={`Banks tune the THRESHOLD (Logistic Regression page!):
too low  → block real shoppers  (angry customers, FP)
too high → let fraud through    (lost money, FN)
That 'Was this you?' SMS = the model asking for a label
to retrain on. You are the data-labeller.`}
        />
        <Table
          head={["Guard", "Model type", "Track page it maps to"]}
          rows={[
            ["Gmail spam filter", "Text classification", "🚦 Logistic Regression"],
            ["Card fraud blocking", "Classification on imbalanced data", "📊 Evaluation (precision/recall!)"],
            ["Fake-account detection", "Classification + clustering of bot-farms", "🫧 Clustering"],
            ["Loan approval", "P(default) with strict threshold", "🚦 Thresholds section"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Real stakes of FP vs FN: blocking your honeymoon dinner payment (FP) vs letting a
          ₹48k theft through (FN). The precision–recall trade-off isn&apos;t academic — it&apos;s
          someone&apos;s dinner and someone&apos;s savings.
        </Callout>
      </Section>

      {/* 05 ─ VISION */}
      <Section id="vision" number="05" title="Computer Vision — Machines That See">
        <P>
          To a computer an image is just a grid of numbers (pixel brightness). Vision ML = finding
          patterns in that grid — exactly like finding patterns in your CSV columns, just millions
          of columns:
        </P>
        <CodeBlock
          title="what_the_machine_sees.txt"
          runnable={false}
          code={`What you see:  😊        What the model sees:

                          [ 12  18  22  19  14 ...]
                          [ 20 220 215  35 210 ...]   ← bright = skin
                          [ 18 230  40  38 225 ...]   ← dark spots = eyes
                          [ 15 210 205 215 208 ...]
                          [ 11  25 180 190  30 ...]   ← curve = smile

                          features → classifier → "face: YES (0.98)"
                                                  "person: Deelaksha (0.96)"`}
          output={`Same skeleton as ever:
X = pixel numbers, y = label, fit, predict.
Just with deep networks instead of a forest.`}
        />
        <Table
          head={["Product", "What it predicts", "Type"]}
          rows={[
            ["📱 Face unlock", "Is this the owner's face? (yes/no)", "Classification"],
            ["🏥 X-ray / scan analysis", "Tumor present? — recall matters most (FN = missed cancer)", "Classification"],
            ["🚗 Self-driving cars", "What is each object + where will it move next?", "Classification + regression"],
            ["🌾 Crop monitoring drones", "Disease patches in fields from sky photos", "Classification"],
            ["📸 Google Photos search 'dog'", "Which photos contain dogs?", "Classification"],
          ]}
        />
        <Callout type="behind">
          Medical imaging is the purest Evaluation-page story in industry: models are tuned for{" "}
          <strong>maximum recall</strong> (never miss a tumor), accepting more false alarms — every
          flagged scan goes to a human doctor anyway. AI filters, humans decide.
        </Callout>
      </Section>

      {/* 06 ─ LANGUAGE */}
      <Section id="language" number="06" title="ChatGPT & Language — Next-Word Prediction at Scale">
        <P>
          The secret that demystifies ChatGPT: it&apos;s a model trained on one humble task —{" "}
          <strong>predict the next word</strong>. Same as your phone keyboard, scaled up a
          billion-fold:
        </P>
        <CodeBlock
          title="next_word.txt"
          runnable={false}
          code={`Input:  "The capital of France is"

Model output — a probability over every possible next word:
   "Paris"     0.92  ███████████████████
   "located"   0.03  █
   "a"         0.02  █
   "the"       0.01
   ...50,000 more words with tiny probabilities

Pick "Paris" → append → ask again:
"The capital of France is Paris" → next: "." (0.61)

Repeat word by word = an entire ChatGPT answer.`}
          output={`It's predict_proba() in a loop.
Trained with the SAME update rule you wrote from scratch:
w = w − lr × gradient ... on ~1 trillion w's, over the internet's text.`}
        />
        <Table
          head={["Everyday tool", "What's underneath"]}
          rows={[
            ["⌨️ Keyboard autocomplete", "Tiny next-word model on your phone"],
            ["🌐 Google Translate", "Predict next word — in the other language"],
            ["🗣️ Siri / Alexa", "Speech → text (vision-style model on sound waves) → language model"],
            ["💬 ChatGPT / Copilot", "Giant next-word model + training to follow instructions"],
            ["📧 Gmail Smart Reply", "Predict the 3 most likely short answers"],
          ]}
        />
        <Callout type="analogy">
          🎓 ChatGPT is the ultimate &quot;student&quot; from the Train/Test page: it read the whole
          internet as its training set. Hallucinations are its overfitting-style failure — fluent
          confidence without understanding, exactly the memorizer who fails reworded questions.
        </Callout>
      </Section>

      {/* 07 ─ INDUSTRIES */}
      <Section id="industries" number="07" title="The Industry Map — Who Uses What">
        <Table
          head={["Industry", "Use case", "ML type", "Track concept"]}
          rows={[
            ["🏦 Banking", "Fraud detection, loan default risk", "Classification", "Logistic + thresholds"],
            ["🛒 E-commerce", "Price optimization, demand forecast", "Regression", "Linear Regression"],
            ["🛒 E-commerce", "Customer segments for marketing", "Clustering", "KMeans + centroids"],
            ["🏥 Healthcare", "Disease detection from scans/vitals", "Classification", "Recall-first evaluation"],
            ["🎬 Entertainment", "What to show you next", "Recommendations", "Clustering + classification"],
            ["🚕 Transport", "ETA, surge pricing, route choice", "Regression", "Linear Regression"],
            ["🏭 Manufacturing", "Predict machine failure BEFORE it breaks", "Classification", "Imbalanced data + F1"],
            ["📡 Telecom", "Churn prediction (your project page!)", "Classification", "🏁 End-to-End Project"],
            ["🌾 Agriculture", "Yield prediction, disease spotting", "Regression + vision", "The full pipeline"],
            ["⚡ Energy", "Tomorrow's electricity demand", "Regression", "Time-based splits"],
          ]}
        />
        <Callout type="tip">
          Read the last column again: <strong>ten industries, zero new concepts</strong>. The same
          8-step pipeline from the Project page, pointed at different CSVs. That&apos;s the entire
          job of most ML engineers.
        </Callout>
      </Section>

      {/* 08 ─ TOOLKIT */}
      <Section id="your-toolkit" number="08" title="Your Toolkit → Real Products ⭐">
        <P>
          The bridge table — every card in this track, and the famous products running on that exact
          idea:
        </P>
        <Table
          head={["Track card", "The concept", "Real products built on it"]}
          rows={[
            ["📈 Linear Regression", "Predict a number from features", "Zillow home prices, Uber ETA, sales forecasts"],
            ["⛰️ Gradient Descent", "The training loop itself", "Literally everything — including ChatGPT's training"],
            ["🚦 Logistic Regression", "Yes/no with a probability", "Spam filters, ad click prediction, credit scoring"],
            ["🌳 Random Forest", "Many trees voting on tabular data", "Bank risk models, medical triage, Kaggle winners"],
            ["🫧 Clustering", "Find groups without labels", "Customer segments, Spotify taste groups, anomaly detection"],
            ["📊 Evaluation", "Precision/recall trade-offs", "Every fraud threshold, every medical screening"],
            ["🏁 The 8-step pipeline", "Raw data → shipped model", "The daily workflow of every ML team on Earth"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "This track", sub: "concepts on small CSVs" },
            { label: "Same concepts", sub: "bigger data + bigger models" },
            { label: "Deep learning", sub: "same loop, millions of w's" },
            { label: "Real products", sub: "Netflix, GPT, fraud guards" },
          ]}
        />
        <Callout type="analogy">
          🧱 You learned bricks and mortar; skyscrapers are not a different material — just more
          floors. There is no secret &quot;real AI&quot; hiding beyond this track. Scale is the only
          difference.
        </Callout>
      </Section>

      {/* 09 ─ LIMITS */}
      <Section id="limits" number="09" title="Where AI Fails — Know the Limits">
        <P>
          Honest engineers know what their tools <em>can&apos;t</em> do. Every failure below is a
          track concept misbehaving at scale:
        </P>
        <Table
          head={["Failure", "What happens", "Root cause (you know it!)"]}
          rows={[
            ["Biased hiring model", "Trained on past hires → repeats past discrimination", "Garbage in, garbage out — the model learns y, including its injustice"],
            ["Hallucinating chatbot", "Confidently invents fake facts & citations", "It predicts PLAUSIBLE next words, not TRUE ones"],
            ["Pandemic-broken forecasts", "2020: every demand model failed overnight", "Test data stopped resembling training data"],
            ["95%-accurate medical model", "Catches zero rare-disease patients", "The accuracy lie — Evaluation page, section 01"],
            ["Production model goes stale", "Great at launch, rots over months", "World drifts away from training data → retrain regularly"],
          ]}
        />
        <CodeBlock
          title="when_to_use_ml.txt"
          runnable={false}
          code={`Use ML when:                      DON'T use ML when:
✅ pattern exists in data          ❌ a simple rule works
✅ rules too complex to write      ❌ you have almost no data
   (what makes a face a face?)     ❌ wrong answers are catastrophic
✅ lots of examples available         and unexplainable
✅ occasional mistakes are OK      ❌ data is biased and unfixable`}
          output={`if amount > balance: decline   ← perfect code, no ML needed.
The best ML engineers know when NOT to reach for ML.`}
        />
        <Callout type="mistake">
          ⚠️ A model is a mirror of its training data — polished, scaled, and automated. Feed it a
          biased world and it will automate the bias with 95% accuracy. Data prep and evaluation
          aren&apos;t chores; they&apos;re the ethics layer.
        </Callout>
      </Section>

      {/* 10 ─ MEMORIZE */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["AI today is", "Invisible predictions everywhere — 10 uses before breakfast, zero robots"],
            ["The circles", "AI ⊃ Machine Learning ⊃ Deep Learning ⊃ Generative AI"],
            ["Recommendations =", "Clustering (similar users) + classification (P of you clicking) sorted"],
            ["Fraud detection =", "Imbalanced classification + a threshold tuned by FP-vs-FN cost"],
            ["Computer vision =", "Same fit/predict — X is just pixel numbers instead of CSV columns"],
            ["ChatGPT =", "Next-word predict_proba in a loop, trained with w = w − lr × gradient"],
            ["Hallucination =", "Plausible ≠ true — it predicts likely words, not facts"],
            ["Every industry runs", "The same 8-step pipeline on different CSVs"],
            ["Don't use ML when", "A simple rule works, data is tiny, or mistakes are catastrophic"],
            ["Scale is the only difference", "Between your 15-line trainer and the systems running the world"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
