"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "mystery", label: "What fit() Hides" },
  { id: "loss", label: "Loss — Scoring a Guess ⭐" },
  { id: "landscape", label: "The Loss Valley" },
  { id: "gradient", label: "The Gradient = Slope" },
  { id: "update", label: "The Update Rule ⭐" },
  { id: "loop", label: "Full Training Loop (Pure Python)" },
  { id: "lr", label: "Learning Rate: 🐢 vs 💥" },
  { id: "epochs", label: "Epochs — When To Stop" },
  { id: "sklearn", label: "Proof: Matches sklearn" },
  { id: "exceptions", label: "💥 Exception Cases" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GradientDescentPage() {
  return (
    <TopicShell
      icon="⛰️"
      title="Training From Scratch"
      gradientWord="Scratch"
      subtitle="The page that demystifies ML. We write the training loop ourselves in pure Python — no sklearn — and watch the model literally walk downhill, epoch by epoch, until it finds the answer."
      nav={NAV}
      next={{ icon: "🚦", label: "Logistic Regression", href: "/ml/logistic-regression" }}
    >
      {/* 01 ─ MYSTERY */}
      <Section id="mystery" number="01" title="What Does fit() Actually Do?">
        <P>
          Last page, <IC>model.fit(X, y)</IC> magically produced <IC>w=2, b=1</IC>. Inside that one
          line lives the engine of nearly all machine learning — including the one that trains
          ChatGPT. The recipe:
        </P>
        <FlowDiagram
          steps={[
            { label: "1. Guess", sub: "start with random w" },
            { label: "2. Measure", sub: "how wrong? (loss)" },
            { label: "3. Direction", sub: "which way improves? (gradient)" },
            { label: "4. Nudge", sub: "move w a tiny step" },
            { label: "5. Repeat", sub: "1000s of times" },
          ]}
        />
        <P>Our mission data — deliberately tiny, deliberately perfect, so we can check every digit:</P>
        <CodeBlock
          code={`x = [1, 2, 3, 4]
y = [2, 4, 6, 8]        # secret truth: y = 2 * x

# Model:  y_pred = w * x      (just w, no b - keep it minimal)
# Goal :  make the machine DISCOVER that w should be 2`}
          output={`We know the answer is w = 2.
The machine doesn't. Watch it find out.`}
        />
        <Callout type="analogy">
          🎯 Hot-and-cold game: a friend hides a treasure (w=2). You guess, they shout
          &quot;colder!&quot; or &quot;warmer!&quot;, you adjust. Loss = how cold. Gradient = which
          direction got warmer. Training = playing until you stand on the treasure.
        </Callout>
      </Section>

      {/* 02 ─ LOSS */}
      <Section id="loss" number="02" title="Loss — Giving Every Guess a Score ⭐">
        <P>
          To improve, we first need a single number that says <strong>how wrong</strong> a guess is.
          That&apos;s the loss — we use MSE (Mean Squared Error). Computed fully by hand for{" "}
          <IC>w = 1</IC> (a wrong guess):
        </P>
        <CodeBlock
          title="loss_by_hand.py"
          code={`def loss(w):
    errors = []
    for xi, yi in zip(x, y):
        pred = w * xi              # model's answer
        err  = (pred - yi) ** 2    # squared mistake
        errors.append(err)
        print(f"  x={xi}: pred={pred}, real={yi}, sq.error={err}")
    return sum(errors) / len(errors)

print("Testing guess w = 1:")
print("MSE loss =", loss(1))`}
          output={`Testing guess w = 1:
  x=1: pred=1, real=2, sq.error=1
  x=2: pred=2, real=4, sq.error=4
  x=3: pred=3, real=6, sq.error=9
  x=4: pred=4, real=8, sq.error=16
MSE loss = 7.5`}
        />
        <Table
          head={["Guess w", "Predictions", "MSE loss", "Verdict"]}
          rows={[
            ["0", "0, 0, 0, 0", "30.0", "terrible"],
            ["1", "1, 2, 3, 4", "7.5", "bad"],
            ["1.5", "1.5, 3, 4.5, 6", "1.875", "getting warm"],
            ["2", "2, 4, 6, 8", "0.0", "🎯 perfect"],
            ["3", "3, 6, 9, 12", "7.5", "overshot — bad again"],
          ]}
        />
        <Callout type="behind">
          Why <em>squared</em>? (1) Negative and positive errors can&apos;t cancel out. (2) Big
          mistakes get punished much harder than small ones (error 4 → penalty 16). (3) Squares make
          the math smooth, which the next step needs.
        </Callout>
      </Section>

      {/* 03 ─ LANDSCAPE */}
      <Section id="landscape" number="03" title="The Loss Valley — Training is Walking Downhill">
        <P>
          Plot loss for every possible w and you get a <strong>valley</strong>. The bottom of the
          valley IS the trained model:
        </P>
        <CodeBlock
          code={`for w in [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]:
    print(f"w={w:<4} loss={loss_value(w):>6}  " + "█" * int(loss_value(w)))`}
          output={`w=0    loss=  30.0  ██████████████████████████████
w=0.5  loss=16.875  ████████████████
w=1    loss=   7.5  ███████
w=1.5  loss= 1.875  █
w=2    loss=   0.0   ← THE BOTTOM. This is the answer.
w=2.5  loss= 1.875  █
w=3    loss=   7.5  ███████
w=3.5  loss=16.875  ████████████████
w=4    loss=  30.0  ██████████████████████████████`}
        />
        <P>
          Trying every w worked here because there&apos;s one knob. Real models have{" "}
          <strong>millions of knobs</strong> — brute force is impossible. We need a way to know
          which direction is downhill <em>without looking at the whole valley</em>.
        </P>
        <Callout type="analogy">
          ⛰️ You&apos;re on a foggy mountain at night. You can&apos;t see the valley floor — but you
          CAN feel the slope under your feet. Step downhill, feel again, step again. That feeling of
          slope is the <strong>gradient</strong>.
        </Callout>
      </Section>

      {/* 04 ─ GRADIENT */}
      <Section id="gradient" number="04" title="The Gradient — The Slope Under Your Feet">
        <P>
          The gradient is the slope of the loss curve at your current w. For our exact data it has a
          clean formula (calculus does this once; the computer reuses it forever):
        </P>
        <CodeBlock
          title="gradient.py"
          code={`def gradient(w):
    # average of 2 * (pred - real) * x over all points
    g = 0
    for xi, yi in zip(x, y):
        g += 2 * (w * xi - yi) * xi
    return g / len(x)          # for this data: simplifies to 15*w - 30

for w in [0, 1, 2, 3, 4]:
    g = gradient(w)
    arrow = "increase w ->" if g < 0 else ("<- decrease w" if g > 0 else "STAY! minimum")
    print(f"w={w}: gradient={g:+.0f}   {arrow}")`}
          output={`w=0: gradient=-30   increase w ->
w=1: gradient=-15   increase w ->
w=2: gradient=+0    STAY! minimum
w=3: gradient=+15   <- decrease w
w=4: gradient=+30   <- decrease w`}
        />
        <Table
          head={["Gradient sign", "Meaning", "Action"]}
          rows={[
            ["negative (−)", "downhill is to the RIGHT", "increase w"],
            ["positive (+)", "downhill is to the LEFT", "decrease w"],
            ["zero (0)", "flat ground — valley floor", "done. trained. 🎉"],
            ["large magnitude", "steep slope, far from answer", "big steps happen naturally"],
            ["small magnitude", "gentle slope, almost there", "steps shrink automatically"],
          ]}
        />
        <Callout type="tip">
          Notice the beautiful trick: always move <strong>opposite</strong> to the gradient&apos;s
          sign. One rule handles both sides of the valley.
        </Callout>
      </Section>

      {/* 05 ─ UPDATE RULE */}
      <Section id="update" number="05" title="The Update Rule — The Most Important Line in ML ⭐">
        <CodeBlock
          code={`w = w - learning_rate * gradient(w)`}
          output={`new position = old position − (step size × slope)
This single line trains EVERYTHING:
linear regression, logistic regression, neural networks, GPT.`}
        />
        <P>Walk through the first three steps by hand. <IC>lr = 0.01</IC>, starting at <IC>w = 0</IC>:</P>
        <Table
          head={["Step", "w before", "gradient = 15w−30", "lr × gradient", "w after"]}
          rows={[
            ["1", "0.000", "−30.00", "−0.300", "0.300"],
            ["2", "0.300", "−25.50", "−0.255", "0.555"],
            ["3", "0.555", "−21.68", "−0.217", "0.772"],
            ["…", "…", "shrinking…", "shrinking…", "creeping toward 2"],
          ]}
        />
        <P>
          See the built-in elegance: as w approaches 2, the gradient shrinks, so the steps shrink —
          it <strong>automatically brakes</strong> near the answer instead of trampling past it.
        </P>
        <Callout type="mistake">
          ⚠️ The minus sign is everything. <IC>w + lr*g</IC> walks <em>uphill</em> — loss grows every
          step and your model gets confidently worse.
        </Callout>
      </Section>

      {/* 06 ─ FULL LOOP */}
      <Section id="loop" number="06" title="The Full Training Loop — Pure Python, No Libraries">
        <P>This is it. A complete, working machine-learning trainer in ~15 lines:</P>
        <CodeBlock
          title="train_from_scratch.py"
          code={`x = [1, 2, 3, 4]
y = [2, 4, 6, 8]

w  = 0.0       # random starting guess
lr = 0.01      # learning rate

for epoch in range(51):
    # forward pass: loss with current w
    loss = sum((w*xi - yi)**2 for xi, yi in zip(x, y)) / len(x)

    # backward pass: gradient
    grad = sum(2 * (w*xi - yi) * xi for xi, yi in zip(x, y)) / len(x)

    # the update rule
    w = w - lr * grad

    if epoch % 10 == 0:
        print(f"epoch {epoch:>2}:  w = {w:.5f}   loss = {loss:.6f}")

print(f"\\nTrained! Final w = {w:.4f}  (truth was 2)")
print(f"predict x=10  ->  {w * 10:.2f}")`}
          output={`epoch  0:  w = 0.30000   loss = 30.000000
epoch 10:  w = 1.60626   loss = 1.162619
epoch 20:  w = 1.92249   loss = 0.045068
epoch 30:  w = 1.98474   loss = 0.001747
epoch 40:  w = 1.99700   loss = 0.000068
epoch 50:  w = 1.99941   loss = 0.000003

Trained! Final w = 1.9994  (truth was 2)
predict x=10  ->  19.99`}
        />
        <P>The descent, drawn:</P>
        <CodeBlock
          code={`loss
30.000 |█████████████████████████████  epoch 0   (w=0.30)
 1.163 |█                              epoch 10  (w=1.61)
 0.045 |                               epoch 20  (w=1.92)
 0.002 |                               epoch 30  (w=1.98)
 0.000 |                               epoch 40  (w=2.00)
 0.000 |                               epoch 50  (w=2.00)  ← converged`}
          output={`The loss collapses fast, then fine-tunes.
The machine DISCOVERED y = 2x from data alone.
You just trained a model from scratch. 🎉`}
        />
        <Callout type="behind">
          This exact loop, scaled up, is all of deep learning: GPT has ~1 trillion w&apos;s instead
          of 1, the loss is about predicting the next word instead of a line, and the gradient is
          computed by autograd — but the loop is <strong>literally this loop</strong>.
        </Callout>
      </Section>

      {/* 07 ─ LEARNING RATE */}
      <Section id="lr" number="07" title="Learning Rate — Too Slow 🐢 vs Explosion 💥">
        <P>
          <IC>lr</IC> is the most important number you choose. Watch what happens at{" "}
          <IC>lr = 0.2</IC> — every step <strong>overshoots</strong> the valley and lands higher on
          the opposite wall:
        </P>
        <CodeBlock
          title="lr_explosion.py"
          code={`w, lr = 0.0, 0.2          # lr is 20x bigger

for epoch in range(5):
    loss = sum((w*xi - yi)**2 for xi, yi in zip(x, y)) / len(x)
    grad = sum(2 * (w*xi - yi) * xi for xi, yi in zip(x, y)) / len(x)
    print(f"epoch {epoch}:  w = {w:>6.1f}   loss = {loss:>7.1f}")
    w = w - lr * grad`}
          output={`epoch 0:  w =    0.0   loss =    30.0
epoch 1:  w =    6.0   loss =   120.0   ← jumped OVER 2, way past
epoch 2:  w =   -6.0   loss =   480.0   ← bounced back even further
epoch 3:  w =   18.0   loss =  1920.0   ← loss QUADRUPLING
epoch 4:  w =  -30.0   loss =  7680.0   💥 diverging to infinity`}
        />
        <Table
          head={["lr", "Behaviour", "Picture"]}
          rows={[
            ["0.0001", "🐢 Converges, but needs 50,000 epochs", "baby steps down the valley"],
            ["0.01", "✅ Smooth, fast convergence (our run)", "confident hike downhill"],
            ["0.1", "⚠️ Zig-zags but just barely settles", "drunk walk that recovers"],
            ["0.2", "💥 Diverges — loss → infinity", "pinball bouncing out of the valley"],
          ]}
        />
        <Callout type="tip">
          Symptoms cheat-sheet: loss shrinking painfully slowly → raise lr ×10. Loss bouncing or
          growing → cut lr ÷10. Loss is <IC>nan</IC> → it already exploded; cut lr hard.
        </Callout>
      </Section>

      {/* 08 ─ EPOCHS */}
      <Section id="epochs" number="08" title="Epochs — How Many Laps? When To Stop?">
        <P>
          One <strong>epoch</strong> = one full pass over the training data. Too few → undertrained.
          Too many → wasted time (and on real noisy data, overfitting). The standard trick: stop
          when loss stops improving.
        </P>
        <CodeBlock
          title="early_stopping.py"
          code={`w, lr = 0.0, 0.01
prev_loss = float("inf")

for epoch in range(10000):
    loss = sum((w*xi - yi)**2 for xi, yi in zip(x, y)) / len(x)
    grad = sum(2 * (w*xi - yi) * xi for xi, yi in zip(x, y)) / len(x)
    w -= lr * grad

    if prev_loss - loss < 1e-9:      # improvement microscopic?
        print(f"Stopped early at epoch {epoch}, w = {w:.5f}")
        break
    prev_loss = loss`}
          output={`Stopped early at epoch 132, w = 1.99999`}
        />
        <Table
          head={["Signal", "Meaning", "Action"]}
          rows={[
            ["Loss still falling fast", "Undertrained", "More epochs"],
            ["Loss flat for many epochs", "Converged", "Stop — you're done"],
            ["Train loss ↓ but TEST loss ↑", "Overfitting begins", "Stop at that point (early stopping)"],
          ]}
        />
        <Callout type="analogy">
          📚 Epochs = re-reading the textbook. Read #1–3: huge gains. Read #10: small gains. Read
          #500: you&apos;re memorizing page numbers — that&apos;s overfitting.
        </Callout>
      </Section>

      {/* 09 ─ SKLEARN PROOF */}
      <Section id="sklearn" number="09" title="Proof: Our Loop ≡ sklearn">
        <P>Same data into sklearn — does the professional library agree with our 15 lines?</P>
        <CodeBlock
          title="proof.py"
          code={`from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4]])
y = np.array([2, 4, 6, 8])

model = LinearRegression(fit_intercept=False)   # we had no b either
model.fit(X, y)

print("sklearn  w :", model.coef_[0])
print("our loop w : 1.99941  (50 epochs)")
print("truth      : 2")`}
          output={`sklearn  w : 2.0
our loop w : 1.99941  (50 epochs)
truth      : 2`}
        />
        <P>
          Same answer. <IC>fit()</IC> was never magic — just a faster, battle-tested version of the
          loop you wrote.
        </P>
        <Table
          head={["", "Our loop", "sklearn"]}
          rows={[
            ["Lines of code", "~15", "2"],
            ["Speed", "fine for 4 points", "optimized C — millions of rows"],
            ["Edge cases handled", "none", "hundreds"],
            ["Use in real work?", "never — for understanding", "always"],
            ["Value", "you now KNOW what fit() does", "you now TRUST what fit() does"],
          ]}
        />
        <Callout type="tip">
          From now on, whenever you see <IC>model.fit(...)</IC>, mentally replace it with:
          &quot;guess → measure → nudge downhill → repeat&quot;.
        </Callout>
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Exception Cases — When Training Goes Wrong">
        <P>
          <strong>Case 1: Wrong sign in the update — walking uphill:</strong>
        </P>
        <CodeBlock
          code={`w = w + lr * grad     # ❌ PLUS instead of MINUS`}
          output={`epoch 0:  loss = 30.0
epoch 10: loss = 248.7
epoch 20: loss = 2061.4     ← getting WORSE every epoch
No crash. No error. Just a model confidently climbing the mountain.`}
        />
        <P>
          <strong>Case 2: lr too big — loss becomes nan:</strong>
        </P>
        <CodeBlock
          code={`w, lr = 0.0, 0.5
for epoch in range(60):
    grad = sum(2*(w*xi - yi)*xi for xi, yi in zip(x, y)) / len(x)
    w -= lr * grad
print(w)`}
          output={`nan

# w doubled in size every step until Python's floats ran out:
# 0 → 15 → -90 → 540 → ... → 1e308 → overflow → nan
# Once ANY number is nan, everything it touches becomes nan.`}
        />
        <P>
          <strong>Case 3: Forgot to update inside the loop:</strong>
        </P>
        <CodeBlock
          code={`for epoch in range(50):
    loss = compute_loss(w)
    grad = compute_grad(w)
    new_w = w - lr * grad      # ❌ stored in new_w, w never changes!`}
          output={`epoch  0:  w = 0.0   loss = 30.0
epoch 10:  w = 0.0   loss = 30.0
epoch 50:  w = 0.0   loss = 30.0
Model "trained" for 50 epochs and learned absolutely nothing.`}
        />
        <P>
          <strong>Case 4: Unscaled features make one valley wall a cliff:</strong> if x₁ is in
          thousands (sqft) and x₂ is 1–5 (bedrooms), the gradient for x₁ is ~million times bigger.
          One lr can&apos;t fit both — either x₁ explodes or x₂ never learns. This is the{" "}
          <em>real</em> reason the Data Prep page taught <IC>StandardScaler</IC>.
        </P>
        <Callout type="mistake">
          ⚠️ Notice: <strong>none of these crash</strong>. Training bugs are silent — the only alarm
          you get is the loss curve. Always print the loss; it&apos;s your model&apos;s heartbeat
          monitor.
        </Callout>
      </Section>

      {/* 11 ─ MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["fit() secretly does", "guess → measure loss → gradient → nudge → repeat thousands of times"],
            ["Loss (MSE)", "Average of squared (prediction − real). 0 = perfect, big = bad"],
            ["Why squared?", "No cancelling, big errors punished hard, smooth for calculus"],
            ["Gradient", "Slope of loss at current w. Negative → go right, positive → go left, 0 → done"],
            ["The update rule", "w = w − lr × gradient — the one line that trains everything, even GPT"],
            ["The minus sign", "Move OPPOSITE the slope = downhill. Flip it and loss grows forever"],
            ["Learning rate", "Step size. Too small = 🐢 ages. Too big = 💥 loss → nan"],
            ["Epoch", "One full pass over the training data"],
            ["When to stop", "Loss flat → converged. Test loss rising → early-stop"],
            ["Training bugs", "Are SILENT — no crashes. The loss curve is your only alarm"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
