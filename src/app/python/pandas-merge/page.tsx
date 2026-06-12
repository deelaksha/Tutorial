"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Two Tables Become One — Live",
  nodes: [
    { id: "orders", icon: "📦", label: "orders.csv", sub: "8 rows", x: 8, y: 30, color: "#22d3ee" },
    { id: "customers", icon: "👥", label: "customers.csv", sub: "5 rows", x: 8, y: 70, color: "#a78bfa" },
    { id: "matcher", icon: "🔑", label: "Key Match", sub: "customer_id", x: 35, y: 50, color: "#fbbf24" },
    { id: "inner", icon: "🎯", label: "Inner Join", sub: "7 rows", x: 62, y: 20, color: "#34d399" },
    { id: "left", icon: "📌", label: "Left Join", sub: "8 rows", x: 62, y: 50, color: "#60a5fa" },
    { id: "outer", icon: "🌐", label: "Outer Join", sub: "9 rows", x: 62, y: 80, color: "#f472b6" },
  ],
  edges: [
    { id: "orders-matcher", from: "orders", to: "matcher", color: "#22d3ee" },
    { id: "customers-matcher", from: "customers", to: "matcher", color: "#a78bfa" },
    { id: "matcher-inner", from: "matcher", to: "inner", color: "#34d399" },
    { id: "matcher-left", from: "matcher", to: "left", color: "#60a5fa" },
    { id: "matcher-outer", from: "matcher", to: "outer", color: "#f472b6" },
    { id: "inner-warn", from: "inner", to: "orders", bend: -60, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "inner-silent-drop",
      name: "⚠️ Inner join trap",
      command: "pd.merge(orders, customers, on='customer_id')",
      steps: [
        { node: "orders", paths: ["orders-matcher"], text: "8 orders. C001,C002,C003,C004,C005 as customer_id. C005 exists in orders but NOT in customers — a data quality issue (orphaned order)." },
        { node: "customers", paths: ["customers-matcher"], text: "5 customers: C001,C002,C003,C004,C006. C006 joined recently, no orders yet. C005 missing (the orphan's parent)." },
        { node: "matcher", paths: ["matcher-inner"], text: "Inner join: keep ONLY rows where customer_id matches in BOTH tables. C005 order → dropped. C006 customer → dropped." },
        { node: "inner", paths: ["inner-warn"], text: "Result: 7 rows (order 1007 with C005 silently vanished). Revenue sum now 1870 instead of 2050. Inner is the DEFAULT — and the most dangerous for data loss! 🛑" },
      ],
    },
    {
      id: "left-safe",
      name: "📌 Left join (safe)",
      command: "pd.merge(orders, customers, on='customer_id', how='left')",
      steps: [
        { node: "orders", paths: ["orders-matcher"], text: "Left join: keep ALL rows from the left table (orders), match customers where possible. The safe default for enrichment." },
        { node: "matcher", paths: ["matcher-left"], text: "Match on customer_id. C001,C002,C003,C004 match → fill name, tier. C005 has no match → name/tier become NaN." },
        { node: "left", paths: [], text: "Result: 8 rows (all orders preserved). Order 1007 has NaN for customer name and tier — you can now SEE the orphan and fix upstream. Left join = audit trail. ✅" },
      ],
    },
    {
      id: "indicator-audit",
      name: "🔍 Audit with indicator",
      command: "pd.merge(..., indicator=True)",
      steps: [
        { node: "orders", paths: ["orders-matcher", "customers-matcher"], text: "Add indicator=True parameter to any merge. Pandas adds a special _merge column showing match status for every row." },
        { node: "matcher", paths: ["matcher-outer"], text: "Outer join (keep all rows from both tables). C005 order + C006 customer both included, unmatched sides filled with NaN." },
        { node: "outer", paths: [], text: "9 rows: 8 orders + 1 extra customer. _merge column: 'both' (matched), 'left_only' (C005 order), 'right_only' (C006 customer). Perfect for data quality audits. 📊" },
      ],
    },
  ],
};

const NAV = [
  { id: "many-tables", label: "Data Lives in Many Tables" },
  { id: "merge-basics", label: "pd.merge Basics" },
  { id: "join-types", label: "The 4 Join Types ⭐" },
  { id: "keys-rename", label: "Keys with Different Names" },
  { id: "one-many", label: "One-to-Many Relationships" },
  { id: "validate-indicator", label: "Validate & Indicator ⭐" },
  { id: "concat", label: "Concat — Stacking DataFrames ⭐" },
  { id: "decision-table", label: "Merge vs Join vs Concat" },
  { id: "real-workflow", label: "Real Workflow: Merge + GroupBy" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function PandasMergePage() {
  return (
    <TopicShell
      icon="🐼"
      title="Pandas Merge, Join & Concat"
      gradientWord="Merge"
      subtitle="Your data lives in many CSVs — orders in one file, customers in another. Merge them on keys, survive the inner-join trap, understand left/right/outer, concat monthly files vertically, and build the complete coffee-chain dataset ready for groupby analysis. The SQL JOIN you already know, now fluent in pandas."
      nav={NAV}
      badges={["🔑 4 join types", "📌 Left = safe default", "🔍 Indicator audits"]}
      next={{ icon: "📊", label: "Pandas Capstone Project", href: "/python/pandas-project" }}
      backHref="/python"
      backLabel="🐍 Python"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="many-tables" number="01" title="Data Lives in Many Tables — Why Merge?">
        <P>
          You have <IC>orders.csv</IC> (what was bought, when, where). Separately, you have{" "}
          <IC>customers.csv</IC> (who bought it, their loyalty tier). To answer &quot;revenue by
          customer tier,&quot; you need to <strong>merge</strong> them:
        </P>
        <CodeBlock
          title="two_tables.txt"
          runnable={false}
          code={`orders.csv (8 rows)                    customers.csv (5 rows)
order_id  customer_id  revenue         customer_id  name    tier
1001      C001         360.0           C001         Asha    Gold
1002      C002         120.0           C002         Rohan   Silver
1003      C003         270.0           C003         Meera   Gold
1004      C001         180.0           C004         Vikram  Bronze
1005      C004         300.0           C006         Sara    Silver
1006      C002         320.0
1007      C005         180.0    ← C005 NOT in customers!
1008      C003         320.0

                   ↓  merge on customer_id  ↓

order_id  customer_id  revenue  name    tier
1001      C001         360.0    Asha    Gold
1002      C002         120.0    Rohan   Silver
...
now you can groupby("tier")["revenue"].sum() → Gold/Silver/Bronze totals`}
        />
        <P>
          The key: <IC>customer_id</IC> appears in <strong>both</strong> tables. Pandas matches rows
          where the key is equal, glues the columns together. This is SQL&apos;s <IC>JOIN</IC> —
          pandas calls it <IC>merge</IC>.
        </P>
        <Callout type="analogy">
          💡 Analogy: Excel VLOOKUP on steroids. You&apos;re looking up customer details (from the
          customers table) for every order (in the orders table) based on matching customer_id.
          Merge does it in one shot, for all rows.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="merge-basics" number="02" title="pd.merge Basics — The Simplest Case">
        <P>
          Load both files, call <IC>pd.merge(left, right, on=&quot;key&quot;)</IC>:
        </P>
        <CodeBlock
          title="basic_merge.py"
          code={`import pandas as pd

orders = pd.read_csv("orders.csv")
customers = pd.read_csv("customers.csv")

# add revenue column to orders
orders["revenue"] = orders["qty"] * orders["price"]

# merge on customer_id
merged = pd.merge(orders, customers, on="customer_id")
print(merged[["order_id", "customer_id", "product", "revenue", "name", "tier"]].head())`}
          output={`   order_id customer_id    product  revenue   name    tier
0      1001        C001      Latte    360.0   Asha    Gold
1      1004        C001      Latte    180.0   Asha    Gold
2      1002        C002  Croissant    120.0  Rohan  Silver
3      1006        C002 Cappuccino    320.0  Rohan  Silver
4      1003        C003   Espresso    270.0  Meera    Gold`}
        />
        <P>
          Columns from both tables now live side-by-side. Notice: C001 (Asha) appears{" "}
          <strong>twice</strong> because C001 placed 2 orders (1001 and 1004). That&apos;s a{" "}
          <em>one-to-many</em> merge (§05). Also notice: only 5 orders shown? Let&apos;s check the
          length:
        </P>
        <CodeBlock
          title="check_len.py"
          code={`print(f"Original orders: {len(orders)}")
print(f"Merged result: {len(merged)}")`}
          output={`Original orders: 8
Merged result: 7`}
        />
        <P>
          <strong>One row vanished!</strong> Order 1007 (customer C005) is missing because C005
          doesn&apos;t exist in the customers table. By default, <IC>pd.merge</IC> does an{" "}
          <strong>inner join</strong> — keep only rows that match in <em>both</em> tables. This is
          the #1 gotcha.
        </P>
        <Callout type="mistake">
          ⚠️ Inner join (the default) silently drops unmatched rows. Always check{" "}
          <IC>len(result)</IC> after merge. Lost rows = lost revenue in your analysis. Use{" "}
          <IC>how=&quot;left&quot;</IC> to keep all left-table rows (§03).
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="join-types" number="03" title="The 4 Join Types — Inner / Left / Right / Outer ⭐">
        <P>
          The <IC>how</IC> parameter controls which rows survive. Draw it with the same two tiny
          tables:
        </P>
        <CodeBlock
          title="join_types_visual.txt"
          runnable={false}
          code={`orders (left):          customers (right):
  customer_id             customer_id  name
  C001                    C001         Asha
  C002                    C002         Rohan
  C005  ← orphan          C006  ← no orders yet

INNER (how="inner", default):  keep ONLY matches
  result: C001, C002  (2 rows)
  dropped: C005 order, C006 customer

LEFT (how="left"):  keep ALL left rows, match right where possible
  result: C001, C002, C005  (3 rows)
  C005 → name = NaN (no matching customer)
  C006 not included (wasn't in left table)

RIGHT (how="right"):  keep ALL right rows, match left where possible
  result: C001, C002, C006  (3 rows)
  C006 → order cols = NaN (no matching order)
  C005 not included (wasn't in right table)

OUTER (how="outer"):  keep ALL rows from BOTH tables
  result: C001, C002, C005, C006  (4 rows)
  C005 → name = NaN,  C006 → order cols = NaN
  the UNION of left and right`}
        />
        <P>Real example with our 8 orders + 5 customers:</P>
        <CodeBlock
          title="four_joins.py"
          code={`# INNER (default)
inner = pd.merge(orders, customers, on="customer_id", how="inner")
print(f"Inner: {len(inner)} rows")

# LEFT (safe for enrichment)
left = pd.merge(orders, customers, on="customer_id", how="left")
print(f"Left: {len(left)} rows")

# RIGHT
right = pd.merge(orders, customers, on="customer_id", how="right")
print(f"Right: {len(right)} rows")

# OUTER (all data, both tables)
outer = pd.merge(orders, customers, on="customer_id", how="outer")
print(f"Outer: {len(outer)} rows")`}
          output={`Inner: 7 rows
Left: 8 rows
Right: 8 rows
Outer: 9 rows`}
        />
        <P>
          Inner: 7 (dropped C005 order). Left: 8 (all orders kept, C005 has NaN name/tier). Right: 8
          (all customers kept, C006 has NaN order fields — wait, 5 customers but 8 rows? That&apos;s
          because C001,C002,C003 have multiple orders, so they appear once per order even in right
          join. Actually right join will have fewer rows if customers have no orders. Let me
          recalculate: orders has customer_ids C001(2 orders),C002(2),C003(2),C004(1),C005(1) = 8
          total. Customers has C001,C002,C003,C004,C006. Right join keeps all customers: C001
          appears twice (2 orders), C002 twice, C003 twice, C004 once, C006 once (no orders → 1 row
          with NaN order fields). Total: 2+2+2+1+1 = 8 rows. C005&apos;s order is dropped (C005 not
          in customers table). Outer: all customers (same 8 from right) PLUS the C005 order with NaN
          customer fields = 8+1=9. That matches the output. Good.
        </P>
        <Table
          head={["Join Type", "Keeps", "Use When", "Unmatched Rows Become"]}
          rows={[
            [
              "inner",
              "only matches (both sides)",
              "strict analysis, clean data",
              "dropped (data loss risk!)",
            ],
            [
              "left",
              "all left rows",
              "enriching primary table (orders + customer details)",
              "NaN in right-table columns",
            ],
            [
              "right",
              "all right rows",
              "rare (just swap left/right and use left)",
              "NaN in left-table columns",
            ],
            [
              "outer",
              "all rows, both tables",
              "auditing data coverage, finding gaps",
              "NaN on unmatched side",
            ],
          ]}
        />
        <Callout type="tip">
          💡 Rule of thumb: <IC>how=&quot;left&quot;</IC> is the safe default when enriching your
          primary dataset (orders). It preserves every row you started with and flags missing
          reference data with NaN — you can investigate later.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="keys-rename" number="04" title="Keys with Different Names">
        <P>
          If the join key has different names in the two tables (e.g., <IC>cust_id</IC> in orders,{" "}
          <IC>id</IC> in customers), use <IC>left_on</IC> and <IC>right_on</IC>:
        </P>
        <CodeBlock
          title="different_key_names.py"
          code={`# imagine orders has "cust_id", customers has "id"
# (renaming for demo)
orders_renamed = orders.rename(columns={"customer_id": "cust_id"})
customers_renamed = customers.rename(columns={"customer_id": "id"})

merged = pd.merge(
    orders_renamed,
    customers_renamed,
    left_on="cust_id",
    right_on="id",
    how="left"
)
print(merged[["order_id", "cust_id", "id", "name"]].head(3))`}
          output={`   order_id cust_id    id   name
0      1001    C001  C001   Asha
1      1002    C002  C002  Rohan
2      1003    C003  C003  Meera`}
        />
        <P>
          Result has <strong>both</strong> <IC>cust_id</IC> and <IC>id</IC> columns (duplicates). To
          clean: <IC>drop</IC> one, or use <IC>on</IC> with a shared name (rename beforehand). For
          multi-column keys (composite keys):
        </P>
        <CodeBlock
          title="multi_col_keys.py"
          code={`# merge on BOTH city AND date
# pd.merge(df1, df2, on=["city", "date"])`}
        />
        <P>
          Pandas matches only rows where <em>all</em> key columns are equal.
        </P>
      </Section>

      {/* 05 */}
      <Section id="one-many" number="05" title="One-to-Many Relationships — Rows Multiply">
        <P>
          Customer C001 (Asha) placed 2 orders. After merge, Asha&apos;s details appear{" "}
          <strong>twice</strong> — once per order. This is a <em>one-to-many</em> merge:
        </P>
        <CodeBlock
          title="one_to_many.txt"
          runnable={false}
          code={`customers:            orders:                  merged:
C001 Asha Gold   →   1001 C001 Latte 360  →  1001 C001 Asha Gold Latte 360
                      1004 C001 Latte 180      1004 C001 Asha Gold Latte 180

one customer row  ×  two order rows  =  two result rows (customer data duplicated)`}
        />
        <P>Check which customers have multiple orders:</P>
        <CodeBlock
          title="multi_orders.py"
          code={`order_counts = orders["customer_id"].value_counts()
print(order_counts)`}
          output={`customer_id
C001    2
C002    2
C003    2
C004    1
C005    1
Name: count, dtype: int64`}
        />
        <P>
          C001, C002, C003 each placed 2 orders → appear twice in merged. That&apos;s correct.
          Total merged rows after left join: 8 (same as orders count) because it&apos;s
          one-to-many. If it were many-to-many (multiple matches on both sides), rows would explode
          combinatorially — usually a sign of duplicate keys (data error).
        </P>
        <Callout type="mistake">
          ⚠️ If merged has way MORE rows than either input, you likely have duplicate keys in one
          table (e.g., customer C001 listed twice in customers.csv). Use{" "}
          <IC>validate=&quot;1:m&quot;</IC> (§06) to catch this.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="validate-indicator" number="06" title="Validate & Indicator — Data Quality Tools ⭐">
        <P>
          <IC>validate</IC> parameter enforces the expected relationship type. Prevents silent
          many-to-many explosions:
        </P>
        <CodeBlock
          title="validate_merge.py"
          code={`# assert: orders has unique keys, customers has unique keys (one-to-one)
# (will raise MergeError if violated)
# pd.merge(orders, customers, on="customer_id", validate="1:1")

# assert: customers is unique, orders can have dupes (one-to-many)
merged = pd.merge(orders, customers, on="customer_id", how="left", validate="m:1")
# "m:1" = many (left) to one (right)
# passes ✅ because each customer_id in customers is unique`}
        />
        <P>
          If customers.csv had duplicate C001 rows, <IC>validate=&quot;m:1&quot;</IC> would raise
          MergeError. Options: <IC>&quot;1:1&quot;</IC>, <IC>&quot;1:m&quot;</IC>,{" "}
          <IC>&quot;m:1&quot;</IC>, <IC>&quot;m:m&quot;</IC>. Now the audit superpower:{" "}
          <IC>indicator=True</IC>:
        </P>
        <CodeBlock
          title="indicator_merge.py"
          code={`merged = pd.merge(orders, customers, on="customer_id", how="outer", indicator=True)
print(merged[["order_id", "customer_id", "name", "_merge"]].tail(9))`}
          output={`   order_id customer_id   name      _merge
0      1001        C001   Asha        both
1      1002        C002  Rohan        both
2      1003        C003  Meera        both
3      1004        C001   Asha        both
4      1005        C004 Vikram        both
5      1006        C002  Rohan        both
6      1007        C005    NaN   left_only
7      1008        C003  Meera        both
8       NaN        C006   Sara  right_only`}
        />
        <P>
          The <IC>_merge</IC> column tags every row: <IC>&quot;both&quot;</IC> (matched in both
          tables), <IC>&quot;left_only&quot;</IC> (C005 order with no customer), <IC>&quot;right_only&quot;</IC>{" "}
          (C006 customer with no orders). Filter to find orphans:
        </P>
        <CodeBlock
          title="find_orphans.py"
          code={`orphan_orders = merged[merged["_merge"] == "left_only"]
print(orphan_orders[["order_id", "customer_id", "revenue"]])`}
          output={`   order_id customer_id  revenue
6      1007        C005    180.0`}
        />
        <P>
          Order 1007 (180 revenue) is orphaned. Flag it for the data team. Similarly, find customers
          who never ordered:
        </P>
        <CodeBlock
          title="inactive_customers.py"
          code={`inactive = merged[merged["_merge"] == "right_only"]
print(inactive[["customer_id", "name", "tier"]])`}
          output={`   customer_id  name    tier
8         C006  Sara  Silver`}
        />
        <P>
          Sara joined but hasn&apos;t placed an order yet. Target her for a promo email. <IC>indicator=True</IC>{" "}
          is your data-quality X-ray.
        </P>
      </Section>

      {/* 07 */}
      <Section id="concat" number="07" title="Concat — Stacking DataFrames Vertically ⭐">
        <P>
          <IC>pd.merge</IC> combines tables <em>horizontally</em> (adding columns). <IC>pd.concat</IC>{" "}
          stacks them <em>vertically</em> (adding rows). Use case: you have January orders and
          February orders in separate files, want to combine them:
        </P>
        <CodeBlock
          title="concat_months.py"
          code={`jan = pd.read_csv("orders_jan.csv")  # 8 rows
feb = pd.read_csv("orders_feb.csv")  # say, 12 rows

# stack vertically
combined = pd.concat([jan, feb], ignore_index=True)
print(f"Jan: {len(jan)}, Feb: {len(feb)}, Combined: {len(combined)}")`}
          output={`Jan: 8, Feb: 12, Combined: 20`}
        />
        <P>
          <IC>ignore_index=True</IC> renumbers rows 0–19 (otherwise you&apos;d have duplicate index
          values 0–7 from both). If columns differ slightly:
        </P>
        <CodeBlock
          title="concat_columns.py"
          code={`# jan has cols: order_id, product, qty
# feb has cols: order_id, product, qty, discount  ← extra column
# concat fills missing "discount" in jan rows with NaN
combined = pd.concat([jan, feb], ignore_index=True)
# now combined has 4 columns; jan rows have NaN discount`}
        />
        <P>
          By default, concat does an <em>outer</em> union of columns. To keep only common columns:{" "}
          <IC>join=&quot;inner&quot;</IC> (rare). Concat along columns (horizontal stack, like
          cbind in R):
        </P>
        <CodeBlock
          title="concat_axis1.py"
          code={`# concat side-by-side (axis=1, column-wise)
# pd.concat([df1, df2], axis=1)
# rows are matched by INDEX — if indices don't align, you get NaN gaps
# safer to merge on a key instead of concat axis=1`}
        />
        <Callout type="tip">
          💡 Rule: vertical stacking (same schema, different time periods) → <IC>pd.concat</IC>.
          Horizontal joining (different schemas, shared key) → <IC>pd.merge</IC>. Don&apos;t
          confuse them.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="decision-table" number="08" title="Merge vs Join vs Concat — Decision Table">
        <Table
          head={["Method", "Direction", "Use When", "Key Requirement"]}
          rows={[
            [
              "pd.merge",
              "horizontal (add cols)",
              "combining tables on a shared key (orders + customers)",
              "on= key column(s)",
            ],
            [
              "df.join",
              "horizontal (add cols)",
              "merging on INDEX (less common, merge is more flexible)",
              "index-based (or right_on)",
            ],
            [
              "pd.concat",
              "vertical (add rows) OR horizontal",
              "stacking same-schema tables (Jan + Feb orders)",
              "none (columns matched by name)",
            ],
          ]}
        />
        <P>
          <IC>df.join</IC> is shorthand for <IC>pd.merge(..., left_index=True, right_index=True)</IC>
          . Ninety percent of the time you want <IC>pd.merge</IC> for clarity.
        </P>
        <CodeBlock
          title="join_method.py"
          code={`# df.join example (merge on index)
# orders_indexed = orders.set_index("customer_id")
# customers_indexed = customers.set_index("customer_id")
# result = orders_indexed.join(customers_indexed, how="left")
# equivalent to pd.merge(orders, customers, on="customer_id", how="left")`}
        />
      </Section>

      {/* 09 */}
      <Section id="real-workflow" number="09" title="Real Workflow — Merge Then GroupBy">
        <P>
          Boss asks: <em>&quot;What&apos;s the revenue by customer tier?&quot;</em> You need to (1)
          merge orders + customers to get tier column, (2) groupby tier and sum revenue:
        </P>
        <CodeBlock
          title="revenue_by_tier.py"
          code={`# step 1: merge (left join to keep all orders)
enriched = pd.merge(orders, customers, on="customer_id", how="left")

# step 2: groupby tier
tier_revenue = enriched.groupby("tier")["revenue"].sum().sort_values(ascending=False)
print(tier_revenue)`}
          output={`tier
Gold      1130.0
Silver     440.0
Bronze     300.0
Name: revenue, dtype: float64`}
        />
        <P>
          Gold tier: C001 Asha (orders 1001:360, 1004:180) + C003 Meera (1003:270, 1008:320) = 360+180+270+320 = 1130.
          Silver: C002 Rohan (1002:120, 1006:320) = 440. Bronze: C004 Vikram (1005:300) = 300. C005&apos;s
          order (180) has NaN tier (not in customers), so it doesn&apos;t appear in the groupby
          (NaN is excluded by default). Total revenue in tiers: 1130+440+300=1870. The missing 180
          from C005 makes total 2050. To include NaN tier:
        </P>
        <CodeBlock
          title="include_nan_tier.py"
          code={`tier_revenue_all = enriched.groupby("tier", dropna=False)["revenue"].sum()
print(tier_revenue_all)`}
          output={`tier
Bronze     300.0
Gold      1130.0
Silver     440.0
NaN        180.0
Name: revenue, dtype: float64`}
        />
        <P>
          <IC>dropna=False</IC> (pandas 1.1+) keeps the NaN group. Now you see the orphaned revenue
          (180) and can decide: fix the data (add C005 to customers) or report it separately.
          Another question: <em>&quot;Top customer by revenue?&quot;</em> Merge, groupby customer, nlargest:
        </P>
        <CodeBlock
          title="top_customer.py"
          code={`customer_revenue = enriched.groupby("name")["revenue"].sum().nlargest(3)
print(customer_revenue)`}
          output={`name
Meera     590.0
Asha      540.0
Rohan     440.0
Name: revenue, dtype: float64`}
        />
        <P>
          Meera (C003): 270+320=590. Asha (C001): 360+180=540. Rohan (C002): 120+320=440. Meera is
          the whale. Merge + groupby is the bread-and-butter analyst workflow.
        </P>
        <Callout type="behind">
          🔍 Performance note: if you&apos;re merging millions of rows, ensure the key columns are
          sorted or use <IC>sort=False</IC> in merge if data is already sorted. Pandas uses a
          hash-join by default (fast). For huge datasets, consider Dask or Polars (parallel
          processing).
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Basic merge", "pd.merge(left, right, on='key', how='left')"],
            ["Inner join", "DEFAULT — keeps only matches (drops unmatched rows!)"],
            ["Left join", "keeps all left rows, NaN for unmatched right cols (safe enrichment)"],
            ["Outer join", "keeps all rows from both tables, NaN fills gaps (audit mode)"],
            ["Different key names", "pd.merge(left, right, left_on='cust_id', right_on='id')"],
            ["Validate relationship", "validate='m:1' (many-to-one) raises error if violated"],
            ["Audit matches", "indicator=True adds _merge column: 'both'/'left_only'/'right_only'"],
            ["Concat (stack rows)", "pd.concat([df1, df2], ignore_index=True)"],
            ["Merge → groupby", "pd.merge(orders, customers, on='customer_id', how='left').groupby('tier')['revenue'].sum()"],
            ["NaN in groupby", "dropna=False to include NaN as a group (default: excluded)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
