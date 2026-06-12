"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "The Cleaning Pipeline — Live",
  nodes: [
    { id: "dirty", icon: "🗑️", label: "Dirty CSV", sub: "NaNs, dupes, mess", x: 8, y: 40, color: "#f87171" },
    { id: "missing", icon: "❓", label: "Handle Missing", sub: "dropna / fillna", x: 22, y: 20, color: "#fbbf24" },
    { id: "dtypes", icon: "🏷️", label: "Fix dtypes", sub: "to_datetime, astype", x: 38, y: 55, color: "#22d3ee" },
    { id: "dupes", icon: "👥", label: "Drop Duplicates", sub: "keep='first'", x: 54, y: 20, color: "#fb923c" },
    { id: "strings", icon: "✂️", label: "Clean Strings", sub: "strip, title, replace", x: 70, y: 55, color: "#a78bfa" },
    { id: "clean", icon: "✨", label: "Clean DF", sub: "ready for analysis", x: 88, y: 35, color: "#34d399" },
  ],
  edges: [
    { id: "dirty-missing", from: "dirty", to: "missing", color: "#fbbf24" },
    { id: "missing-dtypes", from: "missing", to: "dtypes", bend: 40, color: "#22d3ee" },
    { id: "dtypes-dupes", from: "dtypes", to: "dupes", bend: -40, color: "#fb923c" },
    { id: "dupes-strings", from: "dupes", to: "strings", bend: 40, color: "#a78bfa" },
    { id: "strings-clean", from: "strings", to: "clean", color: "#34d399" },
    { id: "missing-dirty", from: "missing", to: "dirty", bend: -70, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "full",
      name: "✅ Full pipeline",
      command: "orders_dirty.csv → clean in 8 lines",
      steps: [
        { node: "dirty", paths: ["dirty-missing"], text: "Raw CSV: missing prices (NaN), duplicate row, messy strings ('  latte '), date as string, qty as float64 instead of int." },
        { node: "missing", paths: ["dirty-missing", "missing-dtypes"], text: "Handle missing: dropna(subset=['price']) drops rows with NaN price. Or fillna(df.groupby('category')['price'].transform('median')) fills with category median." },
        { node: "dtypes", paths: ["missing-dtypes", "dtypes-dupes"], text: "Fix dtypes: pd.to_datetime(df['date']), df['qty'].astype(int), pd.to_numeric(df['price'], errors='coerce') for dirty numbers." },
        { node: "dupes", paths: ["dtypes-dupes", "dupes-strings"], text: "Drop duplicates: df.drop_duplicates(subset=['order_id'], keep='first') removes the duplicate row." },
        { node: "strings", paths: ["dupes-strings", "strings-clean"], text: "Clean strings: df['product'].str.strip().str.title() → '  latte ' becomes 'Latte'. Chain .str methods." },
        { node: "clean", paths: ["strings-clean"], text: "Result: clean DataFrame ready for groupby/merge/plot. No NaNs, correct types, no dupes, consistent strings. ✨" },
      ],
    },
    {
      id: "dtype-trap",
      name: "❌ String-as-number trap",
      command: "df['price'].mean() → NaN (silently!)",
      steps: [
        { node: "dirty", paths: ["dirty-missing"], text: "CSV has price column, looks like numbers: '180.0', '120.0'. But one row has '₹150' — pandas reads the WHOLE column as dtype object (string)." },
        { node: "dtypes", paths: ["missing-dtypes"], text: "You call df['price'].mean() expecting 142.5. You get NaN — because mean() on strings returns NaN, no error! 😱" },
        { node: "clean", paths: [], text: "Fix: pd.to_numeric(df['price'], errors='coerce') converts to float, turns '₹150' → NaN (which you can then fill or drop). ALWAYS check df.info() after loading! 🔍" },
      ],
    },
    {
      id: "fillna-smart",
      name: "⚡ Smart fillna by group",
      command: "fill missing price with category median",
      steps: [
        { node: "missing", paths: ["dirty-missing"], text: "Some prices are missing. Filling with the global median (df['price'].median()) is crude — Drinks and Food have different price ranges." },
        { node: "dtypes", paths: ["missing-dtypes", "dtypes-dupes"], text: "Smart fill: df['price'].fillna(df.groupby('category')['price'].transform('median')) — fills Drink NaNs with Drink median, Food NaNs with Food median." },
        { node: "clean", paths: ["strings-clean"], text: "Result: missing Latte price filled with ₹180 (Drink median), missing Muffin with ₹100 (Food median). Much better than one-size-fits-all! 🎯" },
      ],
    },
  ],
};

const NAV = [
  { id: "reality", label: "Real Data is Dirty" },
  { id: "finding", label: "Finding Missing Data" },
  { id: "dropna-fillna", label: "dropna vs fillna ⭐" },
  { id: "fixing-dtypes", label: "Fixing dtypes ⭐" },
  { id: "duplicates", label: "Handling Duplicates" },
  { id: "strings", label: "String Cleanup" },
  { id: "renaming", label: "Renaming & Reordering Columns" },
  { id: "custom", label: "apply/map/lambda for Custom Transforms" },
  { id: "pipeline", label: "The Standard Cleaning Pipeline ⭐" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function PandasCleaningPage() {
  return (
    <TopicShell
      icon="🧹"
      title="Cleaning Real-World Data"
      gradientWord="Cleaning"
      subtitle="The unglamorous truth: 80% of data work is cleaning. Missing values, wrong dtypes, duplicates, messy strings — this is what real CSVs look like. The toolkit: dropna, fillna, astype, to_datetime, drop_duplicates, .str methods, and the standard pipeline that chains it all."
      nav={NAV}
      badges={["❓ Missing data", "🏷️ dtype fixes", "✂️ String cleanup"]}
      next={{ icon: "🧮", label: "GroupBy & Aggregation", href: "/python/pandas-groupby" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="reality" number="01" title="Real Data is Dirty">
        <P>
          The coffee dataset we&apos;ve used so far was pristine — 8 perfect rows. Real CSVs are never like that. They have missing values, duplicate rows, inconsistent capitalization, wrong data types, trailing spaces, and data-entry typos. Cleaning is the <strong>first</strong> step, not an afterthought.
        </P>
        <CodeBlock
          title="orders_dirty.csv (the REAL raw data)"
          runnable={false}
          code={`order_id,date,city,product,category,qty,price,customer_id
1001,2024-01-05,Bengaluru,  latte ,Drink,2.0,180.0,C001
1002,2024-01-05,Mumbai,Croissant,Food,1.0,,C002
1003,2024-01-06,Bengaluru,ESPRESSO,Drink,3.0,90.0,C003
1004,2024-01-06,Delhi,Latte,Drink,1.0,180.0,C001
1004,2024-01-06,Delhi,Latte,Drink,1.0,180.0,C001
1005,2024-01-07,Mumbai,Sandwich,Food,2.0,150.0,C004
1006,2024-01-07,Delhi,Cappuccino,Drink,2.0,160.0,C002
1007,2024-01-08,Bengaluru,Latte,Drink,1.0,180.0,C005
1008,2024-01-08,Mumbai,  Muffin,Food,4.0,80.0,C003

PROBLEMS:
  - row 2: price is MISSING (empty cell → NaN)
  - rows 4-5: DUPLICATE (order 1004 appears twice, exact copy)
  - row 1: product is '  latte ' (leading/trailing spaces, lowercase)
  - row 3: product is 'ESPRESSO' (all caps, inconsistent)
  - row 9: product is '  Muffin' (leading space)
  - date column: stored as STRING (dtype object), not datetime
  - qty column: stored as FLOAT (2.0, 1.0) when it should be int

this is MILD compared to real-world data (wait till you see Excel exports...) 😅`}
        />
        <Callout type="analogy">
          🎯 Think of data cleaning like washing vegetables before cooking. You <em>could</em> skip it, but your analysis will taste like dirt. Garbage in, garbage out — clean data is the foundation of every insight.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="finding" number="02" title="Finding Missing Data">
        <P>
          Missing data shows up as <IC>NaN</IC> (Not a Number) in pandas. Find it with <IC>.isna()</IC> or <IC>.isnull()</IC> (same thing), then decide: drop the rows, or fill the gaps.
        </P>
        <CodeBlock
          title="finding_missing.py"
          code={`import pandas as pd
import numpy as np

# Simulate the dirty CSV
df = pd.DataFrame({
    'order_id': [1001, 1002, 1003, 1004],
    'product': ['Latte', 'Croissant', 'Espresso', 'Sandwich'],
    'price': [180.0, np.nan, 90.0, 150.0],  # row 1 is missing
    'qty': [2, 1, 3, np.nan]  # row 3 is missing
})

# Check for missing values
print("MISSING VALUES per column:")
print(df.isna().sum())  # count NaNs in each column

print("\\nROWS with ANY missing value:")
print(df[df.isna().any(axis=1)])  # axis=1 means check across columns

print("\\nROWS with ALL values missing:")
print(df[df.isna().all(axis=1)])  # (none in this example)`}
          output={`MISSING VALUES per column:
order_id    0
product     0
price       1
qty         1
dtype: int64

ROWS with ANY missing value:
   order_id    product  price  qty
1      1002  Croissant    NaN  1.0
3      1004   Sandwich  150.0  NaN

ROWS with ALL values missing:
Empty DataFrame
Columns: [order_id, product, price, qty]
Index: []`}
        />
        <Callout type="tip">
          💡 <IC>.isna().sum()</IC> is your first diagnostic after loading any CSV. It shows you which columns have gaps and how many. Zero NaNs? Suspicious — double-check with <IC>.info()</IC> to make sure dtypes are correct (wrong dtype can hide problems).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="dropna-fillna" number="03" title="dropna vs fillna ⭐">
        <P>
          Two strategies for missing data: <strong>drop</strong> the rows/columns, or <strong>fill</strong> the gaps with a value (mean, median, forward-fill, etc.).
        </P>
        <CodeBlock
          title="dropna_examples.py"
          code={`import pandas as pd
import numpy as np

df = pd.DataFrame({
    'order_id': [1001, 1002, 1003, 1004],
    'price': [180.0, np.nan, 90.0, 150.0],
    'qty': [2, 1, np.nan, 2]
})

# DROP any row with ANY NaN
print("dropna() — drop rows with any NaN:")
print(df.dropna())

# DROP only if a SPECIFIC column is NaN
print("\\ndropna(subset=['price']) — drop only if price is NaN:")
print(df.dropna(subset=['price']))

# DROP columns (axis=1) that have any NaN
print("\\ndropna(axis=1) — drop COLUMNS with any NaN:")
print(df.dropna(axis=1))`}
          output={`dropna() — drop rows with any NaN:
   order_id  price  qty
0      1001  180.0  2.0
3      1004  150.0  2.0

dropna(subset=['price']) — drop only if price is NaN:
   order_id  price  qty
0      1001  180.0  2.0
2      1003   90.0  NaN
3      1004  150.0  2.0

dropna(axis=1) — drop COLUMNS with any NaN:
   order_id
0      1001
1      1002
2      1003
3      1004`}
        />
        <CodeBlock
          title="fillna_examples.py"
          code={`import pandas as pd
import numpy as np

df = pd.DataFrame({
    'order_id': [1001, 1002, 1003, 1004],
    'category': ['Drink', 'Food', 'Drink', 'Food'],
    'price': [180.0, np.nan, 90.0, np.nan]
})

# FILL with a fixed value
print("fillna(0) — replace NaN with 0:")
print(df['price'].fillna(0))

# FILL with column mean
print("\\nfillna(mean) — replace NaN with column mean:")
print(df['price'].fillna(df['price'].mean()))

# FILL with GROUP median (Drink vs Food)
print("\\nfillna(group median) — Drink NaNs get Drink median, Food NaNs get Food median:")
df['price'] = df['price'].fillna(df.groupby('category')['price'].transform('median'))
print(df)`}
          output={`fillna(0) — replace NaN with 0:
0    180.0
1      0.0
2     90.0
3      0.0
Name: price, dtype: float64

fillna(mean) — replace NaN with column mean:
0    180.0
1    135.0
2     90.0
3    135.0
Name: price, dtype: float64

fillna(group median) — Drink NaNs get Drink median, Food NaNs get Food median:
   order_id category  price
0      1001    Drink  180.0
1      1002     Food  135.0
2      1003    Drink   90.0
3      1004     Food  135.0`}
        />
        <CodeBlock
          title="dropna_vs_fillna_drawn.txt"
          runnable={false}
          code={`ORIGINAL (4 rows, 2 have NaNs):
   order_id  price  qty
0      1001  180.0  2.0
1      1002    NaN  1.0  ← price missing
2      1003   90.0  NaN  ← qty missing
3      1004  150.0  2.0

DROPNA() — drop rows with ANY NaN:
   order_id  price  qty
0      1001  180.0  2.0
3      1004  150.0  2.0
→ 2 rows survive (rows 1,2 deleted)

FILLNA(df['price'].mean()) — fill NaN with column mean (140):
   order_id  price  qty
0      1001  180.0  2.0
1      1002  140.0  1.0  ← filled
2      1003   90.0  NaN
3      1004  150.0  2.0
→ 4 rows kept, NaN replaced (qty still has NaN — we only filled price!)

WHEN TO DROP vs FILL:
  drop: if < 5% of rows have NaN, or if the NaN is in a KEY column
        (order_id missing → row is useless)
  fill: if NaN is in a VALUE column and you can estimate it
        (price missing → fill with category median, NOT zero!)
        forward-fill (ffill) for time-series (use previous row's value)`}
        />
        <Callout type="mistake">
          ⚠️ <strong>Never</strong> fill with 0 unless 0 is a meaningful value in your domain. Filling missing prices with 0 will wreck your averages. Use median (robust to outliers) or mean (if data is normal) or group-specific values.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="fixing-dtypes" number="04" title="Fixing dtypes ⭐">
        <P>
          The silent killer: a column that <em>looks</em> like numbers but is dtype <IC>object</IC> (string). Math on it returns NaN. Dates stored as strings can&apos;t be sorted by month. Fix it with <IC>astype()</IC>, <IC>pd.to_datetime()</IC>, and <IC>pd.to_numeric()</IC>.
        </P>
        <CodeBlock
          title="dtype_disaster.py"
          code={`import pandas as pd

# Simulate a CSV where price is stored as string
df = pd.DataFrame({
    'product': ['Latte', 'Croissant', 'Espresso'],
    'price': ['180.0', '120.0', '90.0'],  # strings, not numbers!
    'qty': [2, 1, 3]
})

print("DTYPES:")
print(df.dtypes)
print("\\nMean price (WRONG — returns NaN because price is a string):")
print(df['price'].mean())`}
          output={`DTYPES:
product    object
price      object
qty         int64
dtype: object

Mean price (WRONG — returns NaN because price is a string):
nan`}
        />
        <CodeBlock
          title="dtype_fixes.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'order_id': ['1001', '1002', '1003'],  # string
    'date': ['2024-01-05', '2024-01-06', '2024-01-07'],  # string
    'price': ['180.0', '120.0', 'MISSING'],  # string with a mess
    'qty': [2.0, 1.0, 3.0]  # float, should be int
})

print("BEFORE:")
print(df.dtypes)

# FIX 1: convert string to int
df['order_id'] = df['order_id'].astype(int)

# FIX 2: convert string to datetime
df['date'] = pd.to_datetime(df['date'])

# FIX 3: convert string to float, coerce errors to NaN
df['price'] = pd.to_numeric(df['price'], errors='coerce')

# FIX 4: convert float to int (after fixing NaN!)
df['qty'] = df['qty'].astype(int)

print("\\nAFTER:")
print(df.dtypes)
print("\\nDataFrame:")
print(df)`}
          output={`BEFORE:
order_id    object
date        object
price       object
qty        float64
dtype: object

AFTER:
order_id             int64
date        datetime64[ns]
price              float64
qty                  int64
dtype: object

DataFrame:
   order_id       date  price  qty
0      1001 2024-01-05  180.0    2
1      1002 2024-01-06  120.0    1
2      1003 2024-01-07    NaN    3`}
        />
        <Table
          head={["Function", "Use case", "Example"]}
          rows={[
            [<IC>astype(dtype)</IC>, "Convert to a specific dtype (raises error if impossible)", <IC>df['qty'].astype(int)</IC>],
            [<IC>pd.to_numeric(s, errors='coerce')</IC>, "Convert to number, turn unparseable values to NaN", <IC>pd.to_numeric(df['price'], errors='coerce')</IC>],
            [<IC>pd.to_datetime(s)</IC>, "Convert to datetime64[ns]", <IC>pd.to_datetime(df['date'])</IC>],
            [<IC>pd.to_datetime(s, format='%Y-%m-%d')</IC>, "Parse with explicit format (faster for large data)", <IC>pd.to_datetime(df['date'], format='%Y-%m-%d')</IC>],
          ]}
        />
        <Callout type="tip">
          💡 <IC>errors='coerce'</IC> is your safety net: it turns bad values into NaN instead of crashing. Always check <IC>df.isna().sum()</IC> after coercion to see what got NaN&apos;d (those are your data-quality problems).
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="duplicates" number="05" title="Handling Duplicates">
        <P>
          Duplicate rows happen from double-entry, repeated imports, or buggy ETL. Find them with <IC>.duplicated()</IC>, remove them with <IC>.drop_duplicates()</IC>.
        </P>
        <CodeBlock
          title="duplicates_example.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'order_id': [1001, 1002, 1003, 1002],  # 1002 appears twice!
    'product': ['Latte', 'Croissant', 'Espresso', 'Croissant'],
    'price': [180, 120, 90, 120]
})

# FIND duplicates (True = duplicate)
print("Duplicates (default: marks ALL occurrences after the first):")
print(df.duplicated())

# FIND duplicates based on a SUBSET of columns
print("\\nDuplicates based on order_id only:")
print(df.duplicated(subset=['order_id']))

# DROP duplicates (default: keep first occurrence)
print("\\nAfter drop_duplicates():")
print(df.drop_duplicates())`}
          output={`Duplicates (default: marks ALL occurrences after the first):
0    False
1    False
2    False
3     True
dtype: bool

Duplicates based on order_id only:
0    False
1    False
2    False
3     True
dtype: bool

After drop_duplicates():
   order_id    product  price
0      1001      Latte    180
1      1002  Croissant    120
2      1003   Espresso     90`}
        />
        <CodeBlock
          title="drop_duplicates_options.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'order_id': [1001, 1002, 1002, 1003],
    'timestamp': ['10:00', '10:05', '10:10', '10:15']
})

# keep='first' (default) — keep the FIRST occurrence
print("keep='first':")
print(df.drop_duplicates(subset=['order_id'], keep='first'))

# keep='last' — keep the LAST occurrence (useful for "latest state")
print("\\nkeep='last':")
print(df.drop_duplicates(subset=['order_id'], keep='last'))

# keep=False — DROP ALL duplicates (even the first one)
print("\\nkeep=False (drop ALL occurrences):")
print(df.drop_duplicates(subset=['order_id'], keep=False))`}
          output={`keep='first':
   order_id timestamp
0      1001     10:00
1      1002     10:05
3      1003     10:15

keep='last':
   order_id timestamp
0      1001     10:00
2      1002     10:10
3      1003     10:15

keep=False (drop ALL occurrences):
   order_id timestamp
0      1001     10:00
3      1003     10:15`}
        />
        <Callout type="note">
          📌 <IC>keep='last'</IC> is the move when your duplicates represent updates — like a customer&apos;s latest address in a log. <IC>keep=False</IC> is for when duplicates indicate data corruption (drop everything suspicious).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="strings" number="06" title="String Cleanup">
        <P>
          Strings are chaos: leading/trailing spaces, inconsistent case, special characters. Use the <IC>.str</IC> accessor to apply string methods to entire columns.
        </P>
        <CodeBlock
          title="string_methods.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'product': ['  latte ', 'ESPRESSO', 'Cappuccino  ', '  croissant']
})

print("BEFORE:")
print(df)

# CHAIN .str methods
df['product_clean'] = df['product'].str.strip().str.title()

print("\\nAFTER .strip().title():")
print(df)

# REPLACE substrings
df['product_clean'] = df['product_clean'].str.replace('Espresso', 'Espresso Shot')

print("\\nAfter .replace():")
print(df)`}
          output={`BEFORE:
        product
0       latte
1      ESPRESSO
2  Cappuccino
3    croissant

AFTER .strip().title():
        product  product_clean
0       latte         Latte
1      ESPRESSO      Espresso
2  Cappuccino    Cappuccino
3    croissant     Croissant

After .replace():
        product    product_clean
0       latte           Latte
1      ESPRESSO   Espresso Shot
2  Cappuccino      Cappuccino
3    croissant       Croissant`}
        />
        <Table
          head={["Method", "What it does", "Example"]}
          rows={[
            [<IC>.str.strip()</IC>, "Remove leading/trailing whitespace", <IC>df['product'].str.strip()</IC>],
            [<IC>.str.lower() / .upper() / .title()</IC>, "Change case (title = Title Case)", <IC>df['product'].str.title()</IC>],
            [<IC>.str.replace(old, new)</IC>, "Replace substring (NOT regex by default)", <IC>df['city'].str.replace('Bengaluru', 'Bangalore')</IC>],
            [<IC>.str.contains('pattern')</IC>, "Boolean mask (True if substring found)", <IC>df[df['product'].str.contains('atte')]</IC>],
            [<IC>.str.split('delim')</IC>, "Split into list", <IC>df['name'].str.split(' ')</IC>],
          ]}
        />
        <Callout type="tip">
          💡 Always chain .str methods from left to right: <IC>df['col'].str.strip().str.lower().str.replace('old', 'new')</IC>. Each returns a Series, so you can keep chaining.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="renaming" number="07" title="Renaming & Reordering Columns">
        <P>
          Column names from CSVs are often terrible: <IC>Order ID</IC> (spaces), <IC>PRODUCT_NAME</IC> (screaming case), <IC>p</IC> (cryptic). Rename them, then reorder for readability.
        </P>
        <CodeBlock
          title="renaming_columns.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'Order ID': [1001, 1002],
    'PRODUCT_NAME': ['Latte', 'Croissant'],
    'p': [180, 120]
})

print("BEFORE:")
print(df.columns.tolist())

# RENAME with a dict
df = df.rename(columns={'Order ID': 'order_id', 'PRODUCT_NAME': 'product', 'p': 'price'})

print("\\nAFTER rename:")
print(df.columns.tolist())

# REORDER columns
df = df[['order_id', 'product', 'price']]  # specify order explicitly

print("\\nDataFrame:")
print(df)`}
          output={`BEFORE:
['Order ID', 'PRODUCT_NAME', 'p']

AFTER rename:
['order_id', 'product', 'price']

DataFrame:
   order_id    product  price
0      1001      Latte    180
1      1002  Croissant    120`}
        />
        <Callout type="note">
          📌 Use snake_case (lowercase, underscores) for column names — it matches Python variable naming, avoids the <IC>df['Order ID']</IC> quote nightmare, and plays nicely with <IC>.query()</IC>.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="custom" number="08" title="apply/map/lambda for Custom Transforms">
        <P>
          Sometimes you need a transformation pandas doesn&apos;t have built-in. Use <IC>.apply(func)</IC> to apply a function to each element (or row/column), or <IC>.map(dict)</IC> to substitute values.
        </P>
        <CodeBlock
          title="apply_lambda.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'product': ['Latte', 'Croissant', 'Espresso'],
    'price': [180, 120, 90]
})

# LAMBDA — create a price tier column
df['tier'] = df['price'].apply(lambda x: 'Premium' if x >= 150 else 'Standard')

print(df)

# MAP — replace category codes with labels
df2 = pd.DataFrame({'category': ['D', 'F', 'D']})
df2['category_name'] = df2['category'].map({'D': 'Drink', 'F': 'Food'})
print("\\n", df2)`}
          output={`     product  price      tier
0      Latte    180   Premium
1  Croissant    120  Standard
2   Espresso     90  Standard

   category category_name
0        D         Drink
1        F          Food
2        D         Drink`}
        />
        <Callout type="tip">
          💡 <IC>.apply()</IC> is SLOW for large datasets (loops in Python). For numeric operations, use vectorized pandas/numpy functions (like <IC>df['price'] * 1.1</IC>). But for complex logic (if/elif chains, string parsing), <IC>.apply(lambda)</IC> is the escape hatch.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="pipeline" number="09" title="The Standard Cleaning Pipeline ⭐">
        <P>
          Put it all together: a single cell that reads a dirty CSV and outputs a clean DataFrame. This is the recipe you&apos;ll use on every real dataset.
        </P>
        <CodeBlock
          title="cleaning_pipeline.py"
          code={`import pandas as pd

# READ dirty CSV
df = pd.read_csv('orders_dirty.csv')

# 1. FIX DTYPES
df['date'] = pd.to_datetime(df['date'])
df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['qty'] = df['qty'].fillna(0).astype(int)  # fill NaN qty with 0, then int

# 2. HANDLE MISSING in price (fill with category median)
df['price'] = df['price'].fillna(df.groupby('category')['price'].transform('median'))

# 3. DROP DUPLICATES (based on order_id)
df = df.drop_duplicates(subset=['order_id'], keep='first')

# 4. CLEAN STRINGS
df['product'] = df['product'].str.strip().str.title()
df['city'] = df['city'].str.strip().str.title()

# 5. RENAME COLUMNS (if needed)
# df = df.rename(columns={'old_name': 'new_name'})

# 6. REORDER COLUMNS
df = df[['order_id', 'date', 'city', 'product', 'category', 'qty', 'price', 'customer_id']]

# 7. RESET INDEX (after dropping rows)
df = df.reset_index(drop=True)

print("CLEAN DATAFRAME:")
print(df.info())
print("\\n", df)`}
          output={`CLEAN DATAFRAME:
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 8 entries, 0 to 7
Data columns (total 8 columns):
 #   Column       Non-Null Count  Dtype
---  ------       --------------  -----
 0   order_id     8 non-null      int64
 1   date         8 non-null      datetime64[ns]
 2   city         8 non-null      object
 3   product      8 non-null      object
 4   category     8 non-null      object
 5   qty          8 non-null      int64
 6   price        8 non-null      float64
 7   customer_id  8 non-null      object
dtypes: datetime64[ns](1), float64(1), int64(2), object(4)
memory usage: 640.0+ bytes

   order_id       date       city     product category  qty  price customer_id
0      1001 2024-01-05  Bengaluru       Latte    Drink    2  180.0        C001
1      1002 2024-01-05     Mumbai   Croissant     Food    1  135.0        C002
2      1003 2024-01-06  Bengaluru    Espresso    Drink    3   90.0        C003
3      1004 2024-01-06      Delhi       Latte    Drink    1  180.0        C001
4      1005 2024-01-07     Mumbai   Sandwich     Food    2  150.0        C004
5      1006 2024-01-07      Delhi  Cappuccino    Drink    2  160.0        C002
6      1007 2024-01-08  Bengaluru       Latte    Drink    1  180.0        C005
7      1008 2024-01-08     Mumbai      Muffin     Food    4   80.0        C003`}
        />
        <CodeBlock
          title="pipeline_checklist.txt"
          runnable={false}
          code={`THE CLEANING PIPELINE — run EVERY time you load new data:

1. 🏷️  FIX DTYPES
   - dates → pd.to_datetime()
   - numbers → pd.to_numeric(errors='coerce')
   - integers → .astype(int) AFTER filling NaNs

2. ❓ HANDLE MISSING
   - .isna().sum() — how many per column?
   - .dropna(subset=['key_col']) — drop if critical column is NaN
   - .fillna(median/mean/ffill) — fill if you can estimate

3. 👥 DROP DUPLICATES
   - .duplicated(subset=['id']).sum() — how many dupes?
   - .drop_duplicates(subset=['id'], keep='first')

4. ✂️ CLEAN STRINGS
   - .str.strip() — remove spaces
   - .str.lower() / .title() — normalize case
   - .str.replace() — fix typos

5. 🏗️ RENAME & REORDER
   - .rename(columns={...}) — snake_case names
   - df = df[['col1', 'col2', ...]] — logical order

6. 🔄 RESET INDEX
   - .reset_index(drop=True) — after dropping rows, re-label 0,1,2...

7. ✅ VALIDATE
   - df.info() — dtypes correct? no NaNs in key columns?
   - df.describe() — ranges sane? outliers?
   - df.head() + df.tail() — spot-check

copy this as a notebook cell template — you'll use it on EVERY dataset 📋`}
        />
        <Callout type="analogy">
          🎯 The cleaning pipeline is like a car wash: raw data goes in dirty, comes out shiny and ready to drive. Skip it and you&apos;re driving a muddy car — technically it works, but good luck seeing where you&apos;re going.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Find missing", "df.isna().sum() — count NaNs per column"],
            ["Drop missing", "df.dropna(subset=['col']) — drop rows where col is NaN"],
            ["Fill missing", "df['col'].fillna(value) — replace NaN with value/mean/median"],
            ["Smart fill", "df['col'].fillna(df.groupby('cat')['col'].transform('median'))"],
            ["Fix dtypes", "pd.to_datetime() · pd.to_numeric(errors='coerce') · .astype(int)"],
            ["Find duplicates", "df.duplicated(subset=['id']).sum()"],
            ["Drop duplicates", "df.drop_duplicates(subset=['id'], keep='first')"],
            ["Clean strings", "df['col'].str.strip().str.title().str.replace(old, new)"],
            ["Rename columns", "df.rename(columns={'Old Name': 'new_name'})"],
            ["Pipeline order", "dtypes → missing → dupes → strings → rename → reset_index → validate"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
