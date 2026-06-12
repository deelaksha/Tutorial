"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "CSV → DataFrame — Live",
  nodes: [
    { id: "csv", icon: "📄", label: "orders.csv", sub: "comma-separated text", x: 8, y: 40, color: "#a78bfa" },
    { id: "read", icon: "🔍", label: "pd.read_csv()", sub: "parse & infer types", x: 28, y: 25, color: "#22d3ee" },
    { id: "df", icon: "📊", label: "DataFrame", sub: "index + columns + values", x: 50, y: 40, color: "#34d399" },
    { id: "index", icon: "🔢", label: "Index", sub: "row labels 0,1,2...", x: 68, y: 18, color: "#fbbf24" },
    { id: "cols", icon: "📋", label: "Columns", sub: "order_id, date, price...", x: 68, y: 50, color: "#fb923c" },
    { id: "dtypes", icon: "🏷️", label: "dtypes", sub: "int64, float64, object", x: 88, y: 35, color: "#f472b6" },
  ],
  edges: [
    { id: "csv-read", from: "csv", to: "read", color: "#22d3ee" },
    { id: "read-df", from: "read", to: "df", color: "#34d399" },
    { id: "df-index", from: "df", to: "index", color: "#fbbf24" },
    { id: "df-cols", from: "df", to: "cols", color: "#fb923c" },
    { id: "df-dtypes", from: "df", to: "dtypes", color: "#f472b6" },
    { id: "read-csv", from: "read", to: "csv", bend: -60, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "happy",
      name: "📥 Read & inspect",
      command: "pd.read_csv('orders.csv')",
      steps: [
        { node: "csv", paths: ["csv-read"], text: "Start with a CSV file — plain text, rows of comma-separated values. Each row is an order, columns are order_id, date, city, product, etc." },
        { node: "read", paths: ["csv-read", "read-df"], text: "pd.read_csv() parses the file: splits on commas, uses the first row as column names, infers dtypes (numbers become int64/float64, text becomes object)." },
        { node: "df", paths: ["df-index", "df-cols", "df-dtypes"], text: "You get a DataFrame: a 2D table with an Index (row labels 0-7), Columns (order_id, date, city...), and typed values. Call df.head() and df.info() to inspect. ✅" },
      ],
    },
    {
      id: "fail",
      name: "❌ Wrong separator",
      command: "sep=',' but file uses ';'",
      steps: [
        { node: "csv", paths: ["csv-read"], text: "File uses semicolons instead of commas (European locale). pd.read_csv() defaults to sep=','." },
        { node: "read", paths: ["read-csv"], text: "Result: one mangled column with the entire row as a string. df.columns shows ['order_id;date;city;product;...'] — everything stuck together." },
        { node: "read", paths: ["read-df"], text: "Fix: pd.read_csv('file.csv', sep=';'). Or sep=None to auto-detect. Always check df.head() after loading! 🔍" },
      ],
    },
    {
      id: "power",
      name: "⚡ Power read",
      command: "parse_dates + index_col",
      steps: [
        { node: "read", paths: ["csv-read"], text: "By default, dates are read as strings (dtype: object). You want real datetime64 for date math." },
        { node: "df", paths: ["read-df", "df-index", "df-dtypes"], text: "Power move: pd.read_csv('orders.csv', parse_dates=['date'], index_col='order_id'). The date column becomes datetime64, and order_id becomes the Index." },
        { node: "dtypes", paths: ["df-dtypes"], text: "Result: df.index is Int64Index (1001, 1002...), date column is datetime64[ns], ready for df['date'].dt.day_name(). One line, production-ready. 🚀" },
      ],
    },
  ],
};

const NAV = [
  { id: "why", label: "Why Pandas?" },
  { id: "install", label: "Install & Import" },
  { id: "series", label: "Series — The Building Block" },
  { id: "dataframe", label: "DataFrame Anatomy ⭐" },
  { id: "building", label: "Building DataFrames" },
  { id: "reading", label: "Reading CSV — The Real Start ⭐" },
  { id: "first-look", label: "First-Look Toolkit ⭐" },
  { id: "columns-series", label: "Columns as Series" },
  { id: "dtypes", label: "dtypes & Memory" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function PandasIntroPage() {
  return (
    <TopicShell
      icon="🐼"
      title="Pandas — Series & DataFrames"
      gradientWord="Pandas"
      subtitle="The library that turns Python into a data-analysis powerhouse. What would take 30 lines of loops becomes one line of pandas. This is the foundation: Series, DataFrames, reading CSV files, and the first-look toolkit you&apos;ll use on every dataset."
      nav={NAV}
      badges={["📊 Series & DataFrames", "📂 CSV reading", "🔍 Inspection toolkit"]}
      next={{ icon: "🎯", label: "Selecting & Filtering", href: "/python/pandas-selection" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why" number="01" title="Why Pandas?">
        <P>
          Pandas is <strong>the</strong> standard library for data manipulation in Python. If you&apos;ve ever wrestled with Excel formulas, written SQL queries, or looped through rows to calculate totals — pandas does all of it, faster and in fewer lines.
        </P>
        <CodeBlock
          title="the_old_way_vs_pandas.py"
          runnable={false}
          code={`# WITHOUT PANDAS — 30 lines of loops, ifs, and lists
data = []
with open('orders.csv') as f:
    header = f.readline().strip().split(',')
    for line in f:
        row = line.strip().split(',')
        data.append(dict(zip(header, row)))

total = 0
count = 0
for row in data:
    if row['city'] == 'Bengaluru' and row['category'] == 'Drink':
        total += float(row['price']) * int(row['qty'])
        count += 1
avg = total / count if count else 0

# WITH PANDAS — 3 lines
import pandas as pd
df = pd.read_csv('orders.csv')
mask = (df['city'] == 'Bengaluru') & (df['category'] == 'Drink')
avg = (df[mask]['price'] * df[mask]['qty']).mean()

# same answer, 90% less code — and pandas is VECTORIZED (C-speed underneath) 🚀`}
        />
        <Callout type="analogy">
          🎯 Think of pandas as Excel + SQL + Python loops — all in one library. DataFrame = spreadsheet, but you write formulas as code instead of dragging cells.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install & Import">
        <CodeBlock
          title="terminal"
          code={`pip install pandas`}
        />
        <CodeBlock
          title="your_script.py"
          code={`import pandas as pd  # the universal convention — ALWAYS "as pd"

print(pd.__version__)  # check it installed`}
          output={`2.2.0`}
        />
        <P>
          The <IC>as pd</IC> is not optional etiquette — every pandas tutorial, StackOverflow answer, and colleague&apos;s code uses <IC>pd</IC>. Deviate and you&apos;ll confuse everyone (including yourself in 3 months).
        </P>
      </Section>

      {/* 03 */}
      <Section id="series" number="03" title="Series — The Building Block">
        <P>
          A <strong>Series</strong> is a one-dimensional labeled array — think of it as a single column (or row) with superpowers. Each element has an <strong>index</strong> (a label, not just position).
        </P>
        <CodeBlock
          title="series_anatomy.py"
          code={`import pandas as pd

prices = pd.Series([180, 120, 90, 180, 150],
                    index=['Latte', 'Croissant', 'Espresso', 'Latte2', 'Sandwich'])

print(prices)
print("\\nAccess by label:", prices['Espresso'])
print("Math works:", prices.mean())`}
          output={`Latte        180
Croissant    120
Espresso      90
Latte2       180
Sandwich     150
dtype: int64

Access by label: 90
Math works: 144.0`}
        />
        <CodeBlock
          title="series_drawn.txt"
          runnable={false}
          code={`┌───────────┬────────┐
│  INDEX    │ VALUES │  ← a Series has TWO arrays
├───────────┼────────┤
│ Latte     │  180   │
│ Croissant │  120   │
│ Espresso  │   90   │  ← you can access by label OR by position
│ Latte2    │  180   │     prices['Espresso'] → 90
│ Sandwich  │  150   │     prices[2] → 90 (both work!)
└───────────┴────────┘
         dtype: int64   ← every Series has a dtype (data type)

A Series is like a Python list + dict hybrid:
  - ordered (positions 0,1,2...)
  - labeled (keys: Latte, Croissant...)
  - typed (all int64 here)
  - vectorized (prices * 1.1 multiplies EVERY element, no loop) ⚡`}
        />
        <Callout type="note">
          📌 A DataFrame is just a bunch of Series glued together as columns. Master Series, master pandas.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="dataframe" number="04" title="DataFrame Anatomy ⭐">
        <P>
          A <strong>DataFrame</strong> is the main data structure: a 2D labeled table. Rows have an <strong>Index</strong>, columns have names, every column is a Series, and each column has a <strong>dtype</strong>.
        </P>
        <CodeBlock
          title="dataframe_example.py"
          code={`import pandas as pd

df = pd.DataFrame({
    'product': ['Latte', 'Croissant', 'Espresso'],
    'category': ['Drink', 'Food', 'Drink'],
    'price': [180, 120, 90]
})

print(df)`}
          output={`     product category  price
0      Latte    Drink    180
1  Croissant     Food    120
2   Espresso    Drink     90`}
        />
        <CodeBlock
          title="dataframe_anatomy_drawn.txt"
          runnable={false}
          code={`                ┌──── COLUMNS (df.columns) ────┐
                │  product  category  price  │  ← column names
┌─ INDEX ─┐   ├─────────────────────────────┤
│    0     │   │  Latte     Drink      180   │  ← row 0
│    1     │   │  Croissant Food       120   │  ← row 1
│    2     │   │  Espresso  Drink       90   │  ← row 2
└──────────┘   └─────────────────────────────┘
  (df.index)          VALUES (df.values — a 2D NumPy array)
                          ↓
                    each COLUMN is a Series:
                    df['price'] → Series([180, 120, 90])
                    df['product'] → Series(['Latte', 'Croissant', ...])

KEY ATTRIBUTES:
  df.index       → RangeIndex(start=0, stop=3) — row labels
  df.columns     → Index(['product', 'category', 'price'])
  df.values      → 2D NumPy array [[...], [...], [...]]
  df.dtypes      → product: object, category: object, price: int64
  df.shape       → (3, 3) — 3 rows × 3 columns

Think of it: DataFrame = spreadsheet where you can write Python instead of clicking 🐍`}
        />
      </Section>

      {/* 05 */}
      <Section id="building" number="05" title="Building DataFrames">
        <P>
          You can create DataFrames from dictionaries, lists of lists, or other DataFrames. Most common: <strong>dict of lists</strong> (keys become columns).
        </P>
        <CodeBlock
          title="build_from_dict.py"
          code={`import pandas as pd

# Dict of lists — keys = column names, lists = column values
df = pd.DataFrame({
    'order_id': [1001, 1002, 1003],
    'city': ['Bengaluru', 'Mumbai', 'Bengaluru'],
    'price': [180.0, 120.0, 90.0]
})

print(df)
print("\\nColumns:", df.columns.tolist())
print("Index:", df.index.tolist())`}
          output={`   order_id       city  price
0      1001  Bengaluru  180.0
1      1002     Mumbai  120.0
2      1003  Bengaluru   90.0

Columns: ['order_id', 'city', 'price']
Index: [0, 1, 2]`}
        />
        <CodeBlock
          title="build_from_list_of_lists.py"
          code={`import pandas as pd

# List of lists (row-oriented) — you provide column names separately
data = [
    [1001, 'Bengaluru', 180.0],
    [1002, 'Mumbai', 120.0],
    [1003, 'Bengaluru', 90.0]
]

df = pd.DataFrame(data, columns=['order_id', 'city', 'price'])
print(df)`}
          output={`   order_id       city  price
0      1001  Bengaluru  180.0
1      1002     Mumbai  120.0
2      1003  Bengaluru   90.0`}
        />
        <Callout type="tip">
          💡 Dict-of-lists is easier when columns come from different sources. List-of-lists is natural when you&apos;re parsing rows one by one (like from a file or API).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="reading" number="06" title="Reading CSV — The Real Start ⭐">
        <P>
          In practice, you rarely build DataFrames by hand — you <strong>read</strong> them from files. CSV (comma-separated values) is the universal data interchange format, and <IC>pd.read_csv()</IC> is the workhorse function.
        </P>
        <CodeBlock
          title="orders.csv (the dataset we&apos;ll use for the entire series)"
          runnable={false}
          code={`order_id,date,city,product,category,qty,price,customer_id
1001,2024-01-05,Bengaluru,Latte,Drink,2,180.0,C001
1002,2024-01-05,Mumbai,Croissant,Food,1,120.0,C002
1003,2024-01-06,Bengaluru,Espresso,Drink,3,90.0,C003
1004,2024-01-06,Delhi,Latte,Drink,1,180.0,C001
1005,2024-01-07,Mumbai,Sandwich,Food,2,150.0,C004
1006,2024-01-07,Delhi,Cappuccino,Drink,2,160.0,C002
1007,2024-01-08,Bengaluru,Latte,Drink,1,180.0,C005
1008,2024-01-08,Mumbai,Muffin,Food,4,80.0,C003`}
        />
        <CodeBlock
          title="read_csv_basic.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')
print(df)`}
          output={`   order_id        date       city     product category  qty  price customer_id
0      1001  2024-01-05  Bengaluru       Latte    Drink    2  180.0        C001
1      1002  2024-01-05     Mumbai   Croissant     Food    1  120.0        C002
2      1003  2024-01-06  Bengaluru    Espresso    Drink    3   90.0        C003
3      1004  2024-01-06      Delhi       Latte    Drink    1  180.0        C001
4      1005  2024-01-07     Mumbai   Sandwich     Food    2  150.0        C004
5      1006  2024-01-07      Delhi  Cappuccino    Drink    2  160.0        C002
6      1007  2024-01-08  Bengaluru       Latte    Drink    1  180.0        C005
7      1008  2024-01-08     Mumbai      Muffin     Food    4   80.0        C003`}
        />
        <P>
          That&apos;s it. One line. Pandas inferred the column names from the first row, created a default integer index (0-7), and guessed dtypes (order_id is int64, price is float64, date is object because it&apos;s a string).
        </P>
        <CodeBlock
          title="read_csv_power_options.py"
          code={`import pandas as pd

# POWER READ: parse dates + set order_id as the index
df = pd.read_csv('orders.csv',
                 parse_dates=['date'],      # convert 'date' column to datetime64
                 index_col='order_id')      # use order_id as the Index

print(df.head(3))
print("\\nIndex:", df.index.tolist()[:3])
print("Date dtype:", df['date'].dtype)`}
          output={`               date       city     product category  qty  price customer_id
order_id
1001     2024-01-05  Bengaluru       Latte    Drink    2  180.0        C001
1002     2024-01-05     Mumbai   Croissant     Food    1  120.0        C002
1003     2024-01-06  Bengaluru    Espresso    Drink    3   90.0        C003

Index: [1001, 1002, 1003]
Date dtype: datetime64[ns]`}
        />
        <Callout type="tip">
          💡 Always use <IC>parse_dates</IC> for date columns — it unlocks <IC>.dt</IC> accessors (day, month, year, day_name()). Always check the result with <IC>.head()</IC> and <IC>.dtypes</IC> — garbage in, garbage out!
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="first-look" number="07" title="First-Look Toolkit ⭐">
        <P>
          You just loaded a CSV. Before doing ANY analysis, run these five commands — they are your X-ray vision into the data:
        </P>
        <CodeBlock
          title="first_look.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# 1. HEAD — first 5 rows (default)
print("HEAD (first 5):")
print(df.head())

# 2. TAIL — last 3 rows
print("\\nTAIL (last 3):")
print(df.tail(3))

# 3. SHAPE — (rows, columns)
print("\\nSHAPE:", df.shape)

# 4. INFO — column names, dtypes, non-null counts, memory
print("\\nINFO:")
df.info()

# 5. DESCRIBE — stats for numeric columns
print("\\nDESCRIBE:")
print(df.describe())`}
          output={`HEAD (first 5):
   order_id        date       city     product category  qty  price customer_id
0      1001  2024-01-05  Bengaluru       Latte    Drink    2  180.0        C001
1      1002  2024-01-05     Mumbai   Croissant     Food    1  120.0        C002
2      1003  2024-01-06  Bengaluru    Espresso    Drink    3   90.0        C003
3      1004  2024-01-06      Delhi       Latte    Drink    1  180.0        C001
4      1005  2024-01-07     Mumbai   Sandwich     Food    2  150.0        C004

TAIL (last 3):
   order_id        date       city   product category  qty  price customer_id
5      1006  2024-01-07      Delhi  Cappuccino    Drink    2  160.0        C002
6      1007  2024-01-08  Bengaluru       Latte    Drink    1  180.0        C005
7      1008  2024-01-08     Mumbai    Muffin     Food    4   80.0        C003

SHAPE: (8, 8)

INFO:
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 8 entries, 0 to 7
Data columns (total 8 columns):
 #   Column       Non-Null Count  Dtype
---  ------       --------------  -----
 0   order_id     8 non-null      int64
 1   date         8 non-null      object
 2   city         8 non-null      object
 3   product      8 non-null      object
 4   category     8 non-null      object
 5   qty          8 non-null      int64
 6   price        8 non-null      float64
 7   customer_id  8 non-null      object
dtypes: float64(1), int64(2), object(5)
memory usage: 640.0+ bytes

DESCRIBE:
       order_id   qty   price
count       8.0   8.0     8.0
mean     1004.5   2.0  142.5
std         2.4   1.1   40.4
min      1001.0   1.0   80.0
25%      1002.8   1.2  105.0
50%      1004.5   2.0  155.0
75%      1006.2   2.8  180.0
max      1008.0   4.0  180.0`}
        />
        <Table
          head={["Command", "What it tells you", "When to use it"]}
          rows={[
            [<IC>df.head(n)</IC>, "First n rows (default 5)", "Sanity check: did the CSV load correctly? Are column names right?"],
            [<IC>df.tail(n)</IC>, "Last n rows", "Check if file was truncated, spot patterns at the end"],
            [<IC>df.shape</IC>, "(rows, columns) tuple", "How big is this dataset? (8, 8) = 8 rows, 8 columns"],
            [<IC>df.info()</IC>, "Column names, dtypes, non-null counts, memory", "Missing data? Wrong dtypes (date stored as object)? Memory hog?"],
            [<IC>df.describe()</IC>, "Count, mean, std, min, quartiles, max for numeric cols", "Spot outliers, check ranges (negative prices?), understand scale"],
          ]}
        />
        <Callout type="mistake">
          ⚠️ Skipping <IC>.info()</IC> is the #1 beginner mistake. You think you have numbers, but the column is dtype <IC>object</IC> (string) because one cell had a typo — and your math silently fails or gives NaN. Always. Check. Dtypes.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="columns-series" number="08" title="Columns as Series">
        <P>
          Every column in a DataFrame is a Series. When you select a single column, you get a Series. When you select multiple columns, you get a smaller DataFrame.
        </P>
        <CodeBlock
          title="columns_selection.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

# ONE column → Series
price_series = df['price']
print("Type:", type(price_series))
print(price_series)

print("\\nMean price:", price_series.mean())

# MULTIPLE columns → DataFrame (note the double brackets)
subset = df[['product', 'price']]
print("\\nType:", type(subset))
print(subset)`}
          output={`Type: <class 'pandas.core.series.Series'>
0    180.0
1    120.0
2     90.0
3    180.0
4    150.0
5    160.0
6    180.0
7     80.0
Name: price, dtype: float64

Mean price: 142.5

Type: <class 'pandas.core.frame.DataFrame'>
      product  price
0       Latte  180.0
1   Croissant  120.0
2    Espresso   90.0
3       Latte  180.0
4    Sandwich  150.0
5  Cappuccino  160.0
6       Latte  180.0
7      Muffin   80.0`}
        />
        <Table
          head={["Syntax", "Returns", "Use case"]}
          rows={[
            [<IC>df['price']</IC>, "Series", "Work with one column: math, filtering, plotting"],
            [<IC>df[['price']]</IC>, "DataFrame (1 column)", "Keep it as a DataFrame (rare — usually you want the Series)"],
            [<IC>df[['product', 'price']]</IC>, "DataFrame (2+ columns)", "Subset of columns for analysis or export"],
          ]}
        />
        <Callout type="note">
          📌 Confusion magnet: <IC>df['price']</IC> (one bracket) is a Series. <IC>df[['price']]</IC> (double brackets) is a DataFrame. The double brackets mean &quot;list of column names&quot; — even if it&apos;s a list of one.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="dtypes" number="09" title="dtypes & Memory">
        <P>
          Every column has a <strong>dtype</strong> (data type). This matters for memory usage, math operations, and avoiding silent bugs.
        </P>
        <CodeBlock
          title="dtypes_check.py"
          code={`import pandas as pd

df = pd.read_csv('orders.csv')

print("DTYPES:")
print(df.dtypes)
print("\\nMemory usage:")
print(df.memory_usage(deep=True))`}
          output={`DTYPES:
order_id         int64
date            object
city            object
product         object
category        object
qty              int64
price          float64
customer_id     object
dtype: object

Memory usage:
Index            128
order_id          64
date             512
city             512
product          512
category         512
qty               64
price             64
customer_id      512
dtype: int64`}
        />
        <Table
          head={["dtype", "What it stores", "Examples"]}
          rows={[
            [<IC>int64</IC>, "Integers (whole numbers)", "order_id: 1001, qty: 2"],
            [<IC>float64</IC>, "Floating-point (decimals)", "price: 180.0, 90.5"],
            [<IC>object</IC>, "Strings (or mixed types — expensive!)", "product: 'Latte', date: '2024-01-05' (should be datetime!)"],
            [<IC>datetime64[ns]</IC>, "Dates/times (nanosecond precision)", "2024-01-05 → after parse_dates"],
            [<IC>bool</IC>, "True/False", "Masks (next topic)"],
            [<IC>category</IC>, "Limited unique values (saves memory)", "city: Bengaluru, Mumbai, Delhi (3 unique → store as codes)"],
          ]}
        />
        <Callout type="tip">
          💡 If a column has few unique values (city, category), convert it to <IC>category</IC> dtype to save memory: <IC>df['city'] = df['city'].astype('category')</IC>. Can cut memory 50%+ on large datasets.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Import convention", "import pandas as pd"],
            ["Series", "1D labeled array: values + index + dtype"],
            ["DataFrame", "2D table: index + columns + values (each column is a Series)"],
            ["Read CSV", "pd.read_csv('file.csv', parse_dates=['date'], index_col='id')"],
            ["First look", "df.head() · df.tail() · df.shape · df.info() · df.describe()"],
            ["One column", "df['price'] → Series"],
            ["Multiple columns", "df[['product', 'price']] → DataFrame (double brackets!)"],
            ["Check dtypes", "df.dtypes — object means string (or mixed mess)"],
            ["Key dtypes", "int64 · float64 · object · datetime64[ns] · bool · category"],
            ["Memory saver", "df['city'].astype('category') for low-cardinality strings"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
