"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "How a Mask Filters Rows — Live",
  nodes: [
    { id: "df", icon: "📊", label: "DataFrame", sub: "8 rows × 8 cols", x: 8, y: 40, color: "#34d399" },
    { id: "cond", icon: "🔍", label: "Condition", sub: "price > 150", x: 28, y: 25, color: "#22d3ee" },
    { id: "mask", icon: "✓✗", label: "Boolean Mask", sub: "Series of True/False", x: 50, y: 40, color: "#fbbf24" },
    { id: "filtered", icon: "📋", label: "Filtered DF", sub: "4 rows kept", x: 72, y: 25, color: "#34d399" },
    { id: "loc", icon: "⚙️", label: "loc engine", sub: "label-based indexer", x: 50, y: 70, color: "#a78bfa" },
  ],
  edges: [
    { id: "df-cond", from: "df", to: "cond", color: "#22d3ee" },
    { id: "cond-mask", from: "cond", to: "mask", color: "#fbbf24" },
    { id: "mask-filtered", from: "mask", to: "filtered", color: "#34d399" },
    { id: "df-loc", from: "df", to: "loc", color: "#a78bfa" },
    { id: "loc-filtered", from: "loc", to: "filtered", color: "#a78bfa", dashed: true },
  ],
  flows: [
    {
      id: "happy",
      name: "✅ Simple mask",
      command: "df[df['price'] > 150]",
      steps: [
        { node: "cond", paths: ["df-cond", "cond-mask"], text: "The condition df['price'] > 150 compares every price to 150, producing a Series of True/False (a boolean mask)." },
        { node: "mask", paths: ["cond-mask"], text: "The mask: [True, False, False, True, False, True, True, False] — one bool per row. True = keep, False = drop." },
        { node: "filtered", paths: ["mask-filtered"], text: "df[mask] keeps only rows where mask is True. Result: 4 rows (Latte ₹180, Latte ₹180, Sandwich ₹150, Cappuccino ₹160). ✅" },
      ],
    },
    {
      id: "error",
      name: "❌ Missing parentheses",
      command: "df['category'] == 'Drink' & df['price'] > 150",
      steps: [
        { node: "cond", paths: ["df-cond"], text: "You write: df['category'] == 'Drink' & df['price'] > 150 (trying to combine two conditions)." },
        { node: "mask", paths: [], text: "Python reads it as: df['category'] == ('Drink' & df['price']) > 150 — operator precedence! & binds tighter than ==." },
        { node: "filtered", paths: [], text: "Result: ValueError: The truth value of a Series is ambiguous. Fix: (df['category'] == 'Drink') & (df['price'] > 150) — ALWAYS wrap each condition in parentheses! ⚠️" },
      ],
    },
    {
      id: "chain",
      name: "⚠️ Chained assignment",
      command: "df[df['city'] == 'Mumbai']['price'] = 0",
      steps: [
        { node: "df", paths: ["df-loc"], text: "Chained indexing: df[...][...] = value. First bracket returns a COPY (sometimes), second bracket modifies the copy — original df unchanged!" },
        { node: "loc", paths: ["df-loc", "loc-filtered"], text: "Pandas raises SettingWithCopyWarning: you might be modifying a copy, not the original." },
        { node: "filtered", paths: ["loc-filtered"], text: "Fix: df.loc[df['city'] == 'Mumbai', 'price'] = 0 — .loc[rows, cols] modifies the original df in one step. Always use .loc for assignment! ✅" },
      ],
    },
  ],
};

const NAV = [
  { id: "four-ways", label: "The 4 Ways to Select" },
  { id: "columns", label: "Column Selection" },
  { id: "loc-iloc", label: "loc vs iloc ⭐" },
  { id: "rows-cols", label: "Rows + Columns Together" },
  { id: "boolean", label: "Boolean Masks ⭐" },
  { id: "combining", label: "Combining Conditions" },
  { id: "practical", label: "Practical Filters" },
  { id: "query", label: "query() Alternative" },
  { id: "chained", label: "SettingWithCopyWarning ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function PandasSelectionPage() {
  return (
    <TopicShell
      icon="🎯"
      title="Selecting & Filtering Data"
      gradientWord="Selecting"
      subtitle="The heart of pandas: grabbing exactly the rows and columns you need. The four selection methods ([], loc, iloc, boolean), the inclusive-end gotcha, boolean masks (the superpower), and the SettingWithCopyWarning that haunts every pandas user."
      nav={NAV}
      badges={["🔍 loc/iloc/boolean", "🎭 Masks", "⚠️ Copy warning"]}
      next={{ icon: "🧹", label: "Cleaning Data", href: "/python/pandas-cleaning" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="four-ways" number="01" title="The 4 Ways to Select">
        <P>
          Pandas gives you <strong>four</strong> ways to slice a DataFrame. Each has a specific use case:
        </P>
        <CodeBlock
          title="four_ways_map.txt"
          runnable={false}
          code={`┌─────────────────┬──────────────────────┬─────────────────────────┐
│ METHOD          │ WHAT IT DOES         │ WHEN TO USE IT          │
├─────────────────┼──────────────────────┼─────────────────────────┤
│ df[...]         │ columns OR boolean   │ quick column grab OR    │
│                 │ mask (NOT rows!)     │ filter with a mask      │
├─────────────────┼──────────────────────┼─────────────────────────┤
│ df.loc[r, c]    │ by LABEL (inclusive) │ "rows 'A' to 'C',       │
│                 │                      │  columns 'price' to     │
│                 │                      │  'qty'" ⭐ default      │
├─────────────────┼──────────────────────┼─────────────────────────┤
│ df.iloc[r, c]   │ by POSITION (0,1,2..)│ "first 3 rows, last 2   │
│                 │ (EXCLUSIVE end!)     │  columns" (Excel-think) │
├─────────────────┼──────────────────────┼─────────────────────────┤
│ df[mask]        │ boolean filter       │ "rows where price > 100"│
│                 │ (True → keep)        │ 🔥 THE WORKHORSE        │
└─────────────────┴──────────────────────┴─────────────────────────┘

golden rule: use .loc by default, .iloc when position matters,
             df[mask] for filtering, plain df[col] for columns`}
        />
      </Section>

      {/* 02 */}
      <Section id="columns" number="02" title="Column Selection">
        <P>
          We covered this in the intro: <IC>df['col']</IC> for one column (Series), <IC>df[['col1', 'col2']]</IC> for multiple (DataFrame).
        </P>
        <CodeBlock
          title="column_selection.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# One column → Series
prices = df['price']
print("Type:", type(prices))
print(prices.head(3))

# Multiple columns → DataFrame
subset = df[['product', 'price', 'qty']]
print("\\nType:", type(subset))
print(subset.head(3))`}
          output={`Type: <class 'pandas.core.series.Series'>
0    180.0
1    120.0
2     90.0
Name: price, dtype: float64

Type: <class 'pandas.core.frame.DataFrame'>
     product  price  qty
0      Latte  180.0    2
1  Croissant  120.0    1
2   Espresso   90.0    3`}
        />
        <Callout type="note">
          📌 Remember: <IC>df['price']</IC> → Series. <IC>df[['price']]</IC> → DataFrame. The double brackets mean &quot;pass a list of column names&quot;.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="loc-iloc" number="03" title="loc vs iloc ⭐">
        <P>
          <IC>.loc</IC> selects by <strong>label</strong> (index/column names). <IC>.iloc</IC> selects by <strong>integer position</strong> (0, 1, 2...). The syntax is <IC>df.loc[rows, columns]</IC> and <IC>df.iloc[rows, columns]</IC>.
        </P>
        <CodeBlock
          title="loc_vs_iloc.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# LOC — by label (index labels 0-7 here, but could be anything)
print("LOC — rows 2 to 4 (INCLUSIVE), columns 'product' to 'qty':")
print(df.loc[2:4, 'product':'qty'])

# ILOC — by position (0-indexed, EXCLUSIVE end like Python slices)
print("\\nILOC — rows 2 to 4 (EXCLUSIVE = rows 2,3), columns 3 to 6 (EXCLUSIVE = 3,4,5):")
print(df.iloc[2:4, 3:6])`}
          output={`LOC — rows 2 to 4 (INCLUSIVE), columns 'product' to 'qty':
    product category  qty
2  Espresso    Drink    3
3     Latte    Drink    1
4  Sandwich     Food    2

ILOC — rows 2 to 4 (EXCLUSIVE = rows 2,3), columns 3 to 6 (EXCLUSIVE = 3,4,5):
    product category  qty
2  Espresso    Drink    3
3     Latte    Drink    1`}
        />
        <CodeBlock
          title="loc_iloc_visual.txt"
          runnable={false}
          code={`SETUP: df with index [0, 1, 2, 3, 4] and columns ['A', 'B', 'C', 'D']

      col:  A   B   C   D      position: 0   1   2   3
index: 0 │  10  20  30  40               ↓   ↓   ↓   ↓
       1 │  11  21  31  41      iloc → [  0,  1,  2,  3 ]
       2 │  12  22  32  42
       3 │  13  23  33  43      df.iloc[1:3, 1:3]  ← Python slicing (exclusive end)
       4 │  14  24  34  44      → rows 1,2 (not 3!) · cols 1,2 (not 3!)
                                  Result:    B   C
                                         1  21  31
                                         2  22  32

      df.loc[1:3, 'B':'C']  ← label slicing (INCLUSIVE end!)
      → rows 1,2,3 (includes 3!) · cols B,C (includes C!)
        Result:    B   C
               1  21  31
               2  22  32
               3  23  33

KEY GOTCHA: loc INCLUDES the end label, iloc EXCLUDES it (like Python) ⚠️`}
        />
        <Table
          head={["Method", "Indexing type", "End behavior", "Example"]}
          rows={[
            [<IC>.loc</IC>, "By label (index/column names)", "INCLUSIVE", <IC>df.loc[2:4, 'product':'qty']</IC>],
            [<IC>.iloc</IC>, "By integer position (0, 1, 2...)", "EXCLUSIVE (Python slicing)", <IC>df.iloc[2:4, 3:6]</IC>],
          ]}
        />
        <Callout type="mistake">
          ⚠️ The #1 loc/iloc bug: forgetting <IC>.loc</IC> slices are inclusive. <IC>df.loc[0:5]</IC> gives you rows 0, 1, 2, 3, 4, <strong>5</strong> (6 rows!). <IC>df.iloc[0:5]</IC> gives you rows 0-4 (5 rows). Always remember: loc is greedy.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="rows-cols" number="04" title="Rows + Columns Together">
        <P>
          The power move: select specific rows AND specific columns in one line with <IC>.loc[rows, cols]</IC> or <IC>.iloc[rows, cols]</IC>.
        </P>
        <CodeBlock
          title="rows_and_columns.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# Get rows 1,3,5 and only columns product, price
result = df.loc[[1, 3, 5], ['product', 'price']]
print(result)

# Get first 3 rows, last 2 columns (by position)
result2 = df.iloc[0:3, -2:]
print("\\n", result2)`}
          output={`      product  price
1   Croissant  120.0
3       Latte  180.0
5  Cappuccino  160.0

    price customer_id
0  180.0        C001
1  120.0        C002
2   90.0        C003`}
        />
        <Callout type="tip">
          💡 You can mix and match: <IC>df.loc[:, 'price']</IC> means &quot;all rows, just the price column&quot;. The <IC>:</IC> is a slice meaning &quot;everything&quot;.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="boolean" number="05" title="Boolean Masks ⭐">
        <P>
          This is <strong>the</strong> pandas superpower. A <strong>boolean mask</strong> is a Series of True/False that tells pandas which rows to keep. When you write a condition like <IC>df['price'] &gt; 150</IC>, pandas compares EVERY row and returns a mask.
        </P>
        <CodeBlock
          title="boolean_mask_anatomy.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# Create a mask
mask = df['price'] > 150
print("THE MASK (True = keep, False = drop):")
print(mask)

# Apply the mask
filtered = df[mask]
print("\\nFILTERED DATAFRAME (only rows where mask is True):")
print(filtered[['order_id', 'product', 'price']])`}
          output={`THE MASK (True = keep, False = drop):
0     True
1    False
2    False
3     True
4    False
5     True
6     True
7    False
Name: price, dtype: bool

FILTERED DATAFRAME (only rows where mask is True):
   order_id     product  price
0      1001       Latte  180.0
3      1004       Latte  180.0
5      1006  Cappuccino  160.0
6      1007       Latte  180.0`}
        />
        <CodeBlock
          title="mask_visual.txt"
          runnable={false}
          code={`ORIGINAL DF (8 rows):
   order_id  product    price
0      1001    Latte    180.0  ← mask[0] = True  (180 > 150) ✅
1      1002  Croissant  120.0  ← mask[1] = False (120 ≤ 150) ❌ dropped
2      1003  Espresso    90.0  ← mask[2] = False ❌ dropped
3      1004    Latte    180.0  ← mask[3] = True ✅
4      1005  Sandwich   150.0  ← mask[4] = False ❌ dropped
5      1006  Cappuccino 160.0  ← mask[5] = True ✅
6      1007    Latte    180.0  ← mask[6] = True ✅
7      1008   Muffin     80.0  ← mask[7] = False ❌ dropped

RESULT: 4 rows kept (rows 0, 3, 5, 6)

How it works:
  1. df['price'] > 150 → Series([True, False, False, True, ...])
  2. df[mask] → keep rows where mask is True
  3. index is PRESERVED — result rows are still labeled 0,3,5,6
                          (NOT relabeled 0,1,2,3!) 🔑`}
        />
      </Section>

      {/* 06 */}
      <Section id="combining" number="06" title="Combining Conditions">
        <P>
          Real filters need multiple conditions: &quot;Drinks over ₹150 in Bengaluru&quot;. Use <IC>&amp;</IC> (AND), <IC>|</IC> (OR), <IC>~</IC> (NOT) — but you <strong>MUST</strong> wrap each condition in parentheses.
        </P>
        <CodeBlock
          title="combining_conditions.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# AND — both conditions must be True
mask = (df['category'] == 'Drink') & (df['price'] > 150)
result = df[mask]
print("Drinks over ₹150:")
print(result[['product', 'category', 'price']])

# OR — either condition can be True
mask2 = (df['city'] == 'Bengaluru') | (df['city'] == 'Delhi')
result2 = df[mask2]
print("\\nOrders from Bengaluru OR Delhi:")
print(result2[['order_id', 'city', 'product']])

# NOT — invert a mask
mask3 = ~(df['category'] == 'Food')
result3 = df[mask3]
print("\\nNOT Food (= Drinks):")
print(result3[['product', 'category']].head(3))`}
          output={`Drinks over ₹150:
      product category  price
0       Latte    Drink  180.0
3       Latte    Drink  180.0
5  Cappuccino    Drink  160.0
6       Latte    Drink  180.0

Orders from Bengaluru OR Delhi:
   order_id       city     product
0      1001  Bengaluru       Latte
2      1003  Bengaluru    Espresso
3      1004      Delhi       Latte
5      1006      Delhi  Cappuccino
6      1007  Bengaluru       Latte

NOT Food (= Drinks):
    product category
0     Latte    Drink
2  Espresso    Drink
3     Latte    Drink`}
        />
        <CodeBlock
          title="the_parentheses_trap.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# WRONG — no parentheses (operator precedence disaster)
# mask = df['category'] == 'Drink' & df['price'] > 150
# → ValueError: The truth value of a Series is ambiguous

# RIGHT — wrap EVERY condition
mask = (df['category'] == 'Drink') & (df['price'] > 150)
print("✅ Works:", len(df[mask]), "rows")`}
          output={`✅ Works: 4 rows`}
          error={true}
        />
        <Table
          head={["Operator", "Meaning", "Example"]}
          rows={[
            [<IC>&amp;</IC>, "AND (both True)", <IC>(df['price'] &gt; 100) &amp; (df['qty'] &gt; 1)</IC>],
            [<IC>|</IC>, "OR (either True)", <IC>(df['city'] == 'Mumbai') | (df['city'] == 'Delhi')</IC>],
            [<IC>~</IC>, "NOT (invert)", <IC>~(df['category'] == 'Food')</IC>],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Python&apos;s normal <IC>and</IC>/<IC>or</IC>/<IC>not</IC> keywords <strong>do not work</strong> with pandas masks! You MUST use <IC>&amp;</IC>/<IC>|</IC>/<IC>~</IC>. And you MUST use parentheses around each condition — <IC>&amp;</IC> has higher precedence than <IC>==</IC>, so without parens you get nonsense.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="practical" number="07" title="Practical Filters">
        <P>
          Real-world filter patterns using the coffee dataset:
        </P>
        <CodeBlock
          title="practical_filters.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# ISIN — match multiple values (cleaner than multiple ORs)
bengal_mumbai = df[df['city'].isin(['Bengaluru', 'Mumbai'])]
print("Bengaluru or Mumbai orders:", len(bengal_mumbai))

# BETWEEN — range check (inclusive on both ends)
mid_price = df[df['price'].between(100, 160)]
print("Price ₹100-160:", len(mid_price))

# STR.CONTAINS — substring match (case-sensitive by default)
coffee_drinks = df[df['product'].str.contains('atte')]  # Latte, Cappuccino if we had 'Flat White'
print("Products with 'atte':", coffee_drinks['product'].unique())

# Multiple conditions + column selection in one shot
result = df.loc[(df['category'] == 'Drink') & (df['city'] == 'Bengaluru') & (df['price'] > 150),
                ['order_id', 'product', 'price']]
print("\\nBengaluru Drinks > ₹150:")
print(result)`}
          output={`Bengaluru or Mumbai orders: 6
Price ₹100-160: 4
Products with 'atte': ['Latte']

Bengaluru Drinks > ₹150:
   order_id product  price
0      1001   Latte  180.0
6      1007   Latte  180.0`}
        />
        <Callout type="tip">
          💡 <IC>.isin()</IC> is your friend for &quot;city in [list]&quot; filters. <IC>.str.contains('pattern')</IC> works for substring matching (pass <IC>case=False</IC> for case-insensitive). <IC>.between()</IC> is inclusive on both ends.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="query" number="08" title="query() Alternative">
        <P>
          <IC>.query()</IC> lets you write filters as a string — more readable for complex conditions, though slightly slower. Column names without quotes, values with quotes.
        </P>
        <CodeBlock
          title="query_syntax.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# Instead of:
# result = df[(df['category'] == 'Drink') & (df['price'] > 150)]

# You can write:
result = df.query("category == 'Drink' and price > 150")
print(result[['product', 'category', 'price']])

# Use @ to reference variables
min_price = 150
result2 = df.query("category == 'Drink' and price > @min_price")
print("\\nSame with variable:", len(result2), "rows")`}
          output={`     product category  price
0      Latte    Drink  180.0
3      Latte    Drink  180.0
5  Cappuccino    Drink  160.0
6      Latte    Drink  180.0

Same with variable: 4 rows`}
        />
        <Callout type="note">
          📌 <IC>.query()</IC> uses <IC>and</IC>/<IC>or</IC>/<IC>not</IC> (English words), not <IC>&amp;</IC>/<IC>|</IC>/<IC>~</IC>. Parentheses still recommended for clarity. Use <IC>@var</IC> to reference Python variables.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="chained" number="09" title="SettingWithCopyWarning ⭐">
        <P>
          The most infamous pandas warning. It happens when you do <strong>chained indexing</strong> and try to assign a value — pandas can&apos;t tell if you&apos;re modifying the original or a temporary copy.
        </P>
        <CodeBlock
          title="the_warning.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# CHAINED INDEXING — two bracket operations in a row
# df[...][...] = value  ← DANGER ZONE
df[df['city'] == 'Mumbai']['price'] = 0  # ⚠️ SettingWithCopyWarning

# What happened:
# 1. df[df['city'] == 'Mumbai'] → returns a DataFrame (maybe a copy, maybe a view)
# 2. [...]['price'] = 0 → tries to set on that result
# 3. pandas doesn't know if step 1 returned a copy or a view → WARNING

print("Price for Mumbai (might be unchanged!):")
print(df[df['city'] == 'Mumbai'][['city', 'price']])`}
          output={`<stdin>:6: SettingWithCopyWarning:
A value is trying to be set on a copy of a slice from a DataFrame.
Try using .loc[row_indexer,col_indexer] = value instead

See the caveats in the documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#returning-a-view-versus-a-copy

Price for Mumbai (might be unchanged!):
       city  price
1    Mumbai  120.0
4    Mumbai  150.0
7    Mumbai   80.0`}
          error={true}
        />
        <CodeBlock
          title="the_fix.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# THE FIX — use .loc[rows, cols] in ONE operation
df.loc[df['city'] == 'Mumbai', 'price'] = 0

print("Price for Mumbai (ACTUALLY changed):")
print(df[df['city'] == 'Mumbai'][['city', 'price']])`}
          output={`Price for Mumbai (ACTUALLY changed):
       city  price
1    Mumbai    0.0
4    Mumbai    0.0
7    Mumbai    0.0`}
        />
        <CodeBlock
          title="chained_indexing_visual.txt"
          runnable={false}
          code={`CHAINED (bad):
  df[df['city'] == 'Mumbai']['price'] = 0
     └──── step 1 ─────┘└──── step 2 ───┘
         returns ???         modifies ???
         (copy? view?)       (copy or original df?)

  pandas can't guarantee step 2 modifies the ORIGINAL df → WARNING ⚠️

SINGLE-STEP (good):
  df.loc[df['city'] == 'Mumbai', 'price'] = 0
     └─────────── ONE operation ──────────┘
                  guaranteed to modify df directly ✅

RULE: if you're ASSIGNING (=), use .loc[rows, cols] = value
      (or .iloc for position-based assignment)`}
        />
        <Callout type="tip">
          💡 If you want to work on a subset without affecting the original, make an explicit copy: <IC>subset = df[df['city'] == 'Mumbai'].copy()</IC>. Then <IC>subset['price'] = 0</IC> is safe and warning-free.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["4 selection methods", "df[col] · df.loc[rows, cols] · df.iloc[pos] · df[mask]"],
            ["loc", "by LABEL — INCLUSIVE end: df.loc[2:4] → rows 2,3,4"],
            ["iloc", "by POSITION — EXCLUSIVE end: df.iloc[2:4] → rows 2,3"],
            ["Boolean mask", "df[df['price'] > 150] — True = keep, False = drop"],
            ["Combine conditions", "(cond1) & (cond2) | (cond3) — MUST use & | ~ and parentheses"],
            ["isin", "df[df['city'].isin(['Mumbai', 'Delhi'])]"],
            ["between", "df[df['price'].between(100, 160)] — inclusive both ends"],
            ["str.contains", "df[df['product'].str.contains('atte', case=False)]"],
            ["query", "df.query(\"category == 'Drink' and price > @min_price\")"],
            ["SettingWithCopyWarning fix", "df.loc[mask, 'col'] = value — ONE operation, not chained"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
