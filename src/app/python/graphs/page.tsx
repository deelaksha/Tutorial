"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table, FlowDiagram } from "@/components/ui";

const NAV = [
  { id: "what", label: "What Is a Graph?" },
  { id: "vocab", label: "Graph Vocabulary" },
  { id: "represent", label: "Adjacency List ⭐" },
  { id: "bfs", label: "BFS — The Ripple ⭐" },
  { id: "bfs-trace", label: "BFS — Full Trace" },
  { id: "dfs", label: "DFS — The Maze Walker ⭐" },
  { id: "shortest", label: "Shortest Path with BFS" },
  { id: "bfs-vs-dfs", label: "BFS vs DFS — When Which?" },
  { id: "weighted", label: "Weighted Graphs & Beyond" },
  { id: "exceptions", label: "💥 Crashes & Traps" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GraphsPage() {
  return (
    <TopicShell
      icon="🕸️"
      title="Graphs — Everything Is Connected"
      gradientWord="Graphs"
      subtitle="Trees had one rule: no loops, one parent. Remove the rules and you get a graph — friends, maps, the internet. Two traversals (BFS with a queue, DFS with a stack) answer almost every question. Both are drawn here step by step."
      nav={NAV}
      next={{ icon: "🔀", label: "Sorting & Searching", href: "/python/sorting-searching" }}
    >
      {/* 01 ─ WHAT */}
      <Section id="what" number="01" title="What Is a Graph? The Most Real-World Structure of All">
        <P>
          A graph is just <strong>things + connections</strong>: dots (nodes) joined by lines
          (edges). Unlike a tree, anything may connect to anything — cycles allowed, no root, no
          parent/child:
        </P>
        <CodeBlock
          title="graphs_everywhere.txt"
          runnable={false}
          code={`FRIENDSHIPS                      A CITY MAP                  THE WEB

   amy ─── bob                  Airport ──── Mall          page A ──▶ page B
    │    ╱   │                     │            │             │          │
    │   ╱    │                     │            │             ▼          ▼
   cara ─── dan ─── eve         Station ──── Park ── Zoo   page C ──▶ page D
                                                              ▲──────────┘
amy knows bob & cara;           roads connect places;      links have DIRECTION
cara knows everyone but eve     you can drive in loops     (A→B doesn't mean B→A)

Also graphs: flight routes, LinkedIn, Git commits, recipe dependencies,
your brain's neurons, the ML pipelines from the ML track. EVERYTHING. 🕸️`}
        />
        <P>
          And here&apos;s the family secret of the whole DSA track:
        </P>
        <CodeBlock
          title="family_tree_of_structures.txt"
          runnable={false}
          code={`linked list  =  a graph where each node has ≤1 outgoing edge (a chain)
tree         =  a graph with no cycles and one way in (a hierarchy)
graph        =  no rules. The general case.        ⭐

[a]→[b]→[c]         A            amy ─── bob
                   / \\            │    ╱   │
                  B   C          cara ─── dan

You already know how to store nodes and follow arrows.
Graphs just have MORE arrows — and one new danger: going in circles.`}
        />
        <Callout type="tip">
          ⭐ The one new idea this page adds to everything you&apos;ve learned:{" "}
          <strong>a <IC>visited</IC> set</strong>. Trees couldn&apos;t loop, so you never revisited
          a node. Graphs CAN loop — so every traversal carries a set of &quot;places I&apos;ve
          already been&quot;. That&apos;s genuinely the only upgrade.
        </Callout>
      </Section>

      {/* 02 ─ VOCAB */}
      <Section id="vocab" number="02" title="Graph Vocabulary — 6 Words">
        <Table
          head={["Word", "Meaning", "Example"]}
          rows={[
            ["node / vertex", "a dot — one thing", "amy, Airport, page A"],
            ["edge", "a line — one connection", "amy ── bob (they're friends)"],
            ["neighbors", "nodes one edge away", "amy's neighbors: bob, cara"],
            ["undirected", "edges go both ways", "friendship: amy─bob means bob─amy"],
            ["directed", "edges are one-way arrows", "Instagram follow, web link A→B"],
            ["cycle", "a path that loops back to its start", "amy → bob → dan → cara → amy"],
            ["connected", "you can reach every node from every node", "one friend circle vs two separate ones"],
          ]}
        />
        <CodeBlock
          title="directed_vs_undirected.txt"
          runnable={false}
          code={`UNDIRECTED (friendship)              DIRECTED (Instagram follows)

   amy ───── bob                        amy ────▶ bob
   "edge {amy, bob}"                    "edge (amy → bob)"
   both can see each other             amy follows bob...
                                       bob does NOT follow amy back 💔

If the relationship is mutual → undirected.
If it has a direction (follows, links, depends-on) → directed.`}
        />
      </Section>

      {/* 03 ─ REPRESENT */}
      <Section id="represent" number="03" title="Storing a Graph in Python — The Adjacency List ⭐">
        <P>
          No new class needed! The standard representation is a plain <strong>dict</strong>:{" "}
          <IC>{`{node: [its neighbors]}`}</IC> — called an <strong>adjacency list</strong>:
        </P>
        <CodeBlock
          title="adjacency.py"
          code={`#    amy ─── bob
#     │    ╱   │
#    cara ─── dan ─── eve

graph = {
    "amy":  ["bob", "cara"],
    "bob":  ["amy", "cara", "dan"],
    "cara": ["amy", "bob", "dan"],
    "dan":  ["bob", "cara", "eve"],
    "eve":  ["dan"],
}
# undirected → every edge appears TWICE: amy lists bob, bob lists amy

print(graph["amy"])                  # neighbors: one O(1) dict lookup
print("dan" in graph["amy"])         # are amy & dan friends directly?
print(len(graph["cara"]))            # cara's friend count`}
          output={`['bob', 'cara']
False
3`}
        />
        <CodeBlock
          title="adjacency_drawn.txt"
          runnable={false}
          code={`THE PICTURE                 THE DICT (same information!)

   amy ─── bob              "amy"  ──▶ [bob, cara]
    │    ╱   │              "bob"  ──▶ [amy, cara, dan]
    │   ╱    │              "cara" ──▶ [amy, bob, dan]
   cara ─── dan ── eve      "dan"  ──▶ [bob, cara, eve]
                            "eve"  ──▶ [dan]

Each row = one node and its direct neighbors.
Drawing ⇄ dict is a skill: practice converting both directions.`}
        />
        <Callout type="behind">
          The alternative — an <strong>adjacency matrix</strong> (a grid of 0/1, row=from,
          col=to) — answers &quot;is there an edge?&quot; in O(1) but costs O(n²) memory even for
          sparse graphs. Real social networks: billions of users, ~hundreds of friends each → lists
          win overwhelmingly. Default to the dict-of-lists.
        </Callout>
        <Callout type="mistake">
          For a <em>directed</em> graph, the edge appears only ONCE:{" "}
          <IC>{`{"amy": ["bob"]}`}</IC> means amy→bob, full stop. The most common graph-building bug
          is mixing this up — adding both directions for follows, or forgetting the reverse for
          friendships.
        </Callout>
      </Section>

      {/* 04 ─ BFS */}
      <Section id="bfs" number="04" title="BFS — Breadth-First Search: The Ripple ⭐">
        <P>
          The big question for any graph: <strong>starting at X, what can I reach?</strong> BFS
          answers it like a stone dropped in water — visit all neighbors first (distance 1), then
          THEIR neighbors (distance 2), rippling outward. The engine: the{" "}
          <strong>queue + visited set</strong>:
        </P>
        <CodeBlock
          title="bfs.py"
          code={`from collections import deque

def bfs(graph, start):
    visited = {start}              # places we've already been ⭐
    queue = deque([start])         # places waiting to be explored

    while queue:
        node = queue.popleft()     # FIFO: oldest waiter = CLOSEST node
        print(node, end=" ")

        for neighbor in graph[node]:
            if neighbor not in visited:    # never queue a place twice!
                visited.add(neighbor)
                queue.append(neighbor)

bfs(graph, "amy")`}
          output={`amy bob cara dan eve `}
        />
        <Callout type="analogy">
          🦠 Gossip spreading: amy tells her direct friends today (distance 1), they tell{" "}
          <em>their</em> friends tomorrow (distance 2)… The queue is &quot;people who just
          heard&quot;; the visited set is &quot;people who already know&quot; — you don&apos;t tell
          someone twice.
        </Callout>
        <Callout type="behind">
          This is level-order from the Trees page, plus the visited set. Identical loop. Trees
          didn&apos;t need <IC>visited</IC> because no cycles meant no re-visits; graphs need it or
          the loop runs forever (see 💥 section).
        </Callout>
      </Section>

      {/* 05 ─ BFS TRACE */}
      <Section id="bfs-trace" number="05" title="BFS From amy — Every Loop Iteration, Drawn">
        <CodeBlock
          title="bfs_trace.txt"
          runnable={false}
          code={`graph:   amy ─── bob          start: visited={amy}  queue=[amy]
          │    ╱   │
         cara ─── dan ── eve

──────────────────────────────────────────────────────────────────────
serve amy   neighbors bob,cara — both new → mark + line up
            visited={amy,bob,cara}        queue=[bob,cara]     out: amy
──────────────────────────────────────────────────────────────────────
serve bob   neighbors amy(✓seen), cara(✓seen), dan(new!)
            visited={amy,bob,cara,dan}    queue=[cara,dan]     out: amy bob
──────────────────────────────────────────────────────────────────────
serve cara  neighbors amy✓ bob✓ dan✓ — nothing new
            queue=[dan]                                        out: amy bob cara
──────────────────────────────────────────────────────────────────────
serve dan   neighbors bob✓ cara✓ eve(new!)
            visited={...,eve}             queue=[eve]          out: amy bob cara dan
──────────────────────────────────────────────────────────────────────
serve eve   neighbor dan✓ — nothing new   queue=[] → DONE      out: amy bob cara dan eve

THE RIPPLE:  distance 0: amy │ distance 1: bob, cara │ distance 2: dan │ distance 3: eve
FIFO guarantees closer nodes are ALWAYS served before farther ones. ⭐`}
        />
        <Callout type="tip">
          Watch the ✓-skips in the trace — that&apos;s the visited set earning its keep three
          separate times (amy↔bob↔cara form a triangle = a cycle!). Without it, amy would re-enter
          the queue from bob, then bob from amy… forever.
        </Callout>
      </Section>

      {/* 06 ─ DFS */}
      <Section id="dfs" number="06" title="DFS — Depth-First Search: The Maze Walker ⭐">
        <P>
          The other strategy: <strong>pick a direction and go as deep as possible</strong>; only
          when stuck, backtrack and try the next branch. Like walking a maze with one hand on the
          wall. Two implementations, same result:
        </P>
        <CodeBlock
          title="dfs_recursive.py"
          code={`def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    if node in visited:            # base case: already explored this room
        return
    visited.add(node)
    print(node, end=" ")
    for neighbor in graph[node]:   # dive into each neighbor, one at a time
        dfs(graph, neighbor, visited)

dfs(graph, "amy")`}
          output={`amy bob cara dan eve `}
        />
        <CodeBlock
          title="dfs_trace.txt"
          runnable={false}
          code={`dfs(amy)              visit amy            path so far: amy
│ dfs(bob)            visit bob (amy's 1st neighbor — DIVE, don't wait!)
│ │ dfs(amy)          ✓ seen → return        path: amy bob
│ │ dfs(cara)         visit cara             path: amy bob cara
│ │ │ dfs(amy)        ✓ seen → return
│ │ │ dfs(bob)        ✓ seen → return
│ │ │ dfs(dan)        visit dan              path: amy bob cara dan
│ │ │ │ dfs(bob)      ✓ seen → return
│ │ │ │ dfs(cara)     ✓ seen → return
│ │ │ │ dfs(eve)      visit eve              path: amy bob cara dan eve
│ │ │ │ │ dfs(dan)    ✓ seen → return
│ │ │ │ └ done eve  → BACKTRACK ↩
│ │ │ └ done dan    → BACKTRACK ↩
│ │ └ done cara     → BACKTRACK ↩
│ └ done bob        → BACKTRACK ↩
│ dfs(cara)           ✓ seen → return   (amy's 2nd neighbor, already covered)
└ done.   amy → bob → cara → dan → eve : ONE deep path, then unwound.

Compare BFS: amy │ bob cara │ dan │ eve   (rippled by distance)
DFS:         amy → bob → cara → dan → eve (dove down one tunnel)`}
        />
        <P>
          The iterative twin — <strong>swap BFS&apos;s queue for a stack</strong> and you get DFS.
          One word changes (<IC>popleft</IC> → <IC>pop</IC>):
        </P>
        <CodeBlock
          title="dfs_stack.py"
          code={`def dfs_iterative(graph, start):
    visited = set()
    stack = [start]                   # a stack now, not a queue!
    while stack:
        node = stack.pop()            # LIFO: NEWEST discovery first → dive!
        if node in visited:
            continue
        visited.add(node)
        print(node, end=" ")
        for neighbor in graph[node]:
            if neighbor not in visited:
                stack.append(neighbor)

dfs_iterative(graph, "amy")`}
          output={`amy cara dan eve bob `}
        />
        <Callout type="behind">
          ⭐ The punchline promised two pages ago: <strong>BFS and DFS are the SAME algorithm</strong>{" "}
          with a different to-do pile. Queue (FIFO) → explore closest-first → BFS. Stack (LIFO) →
          explore newest-first → DFS. And the recursive DFS? Its &quot;stack&quot; is the call stack
          from the Recursion page. Everything on this track just connected.
        </Callout>
      </Section>

      {/* 07 ─ SHORTEST PATH */}
      <Section id="shortest" number="07" title="Shortest Path — BFS's Superpower">
        <P>
          Because BFS ripples outward by distance, <strong>the first time it reaches a node, it
          got there by a shortest route</strong>. Track each node&apos;s &quot;who discovered
          me&quot; and you can rebuild the path — this is maps, &quot;degrees of separation&quot;,
          and word-ladder puzzles:
        </P>
        <CodeBlock
          title="shortest_path.py"
          code={`from collections import deque

def shortest_path(graph, start, goal):
    parent = {start: None}            # who discovered each node
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node == goal:              # first arrival = shortest! rebuild:
            path = []
            while node is not None:
                path.append(node)
                node = parent[node]   # walk the discovery chain backwards
            return path[::-1]
        for neighbor in graph[node]:
            if neighbor not in parent:        # parent doubles as 'visited'
                parent[neighbor] = node
                queue.append(neighbor)
    return None                       # goal unreachable

print(shortest_path(graph, "amy", "eve"))
print(shortest_path(graph, "eve", "amy"))`}
          output={`['amy', 'bob', 'dan', 'eve']
['eve', 'dan', 'bob', 'amy']`}
        />
        <CodeBlock
          title="parent_chain.txt"
          runnable={false}
          code={`discovery chain built during BFS:        rebuilding amy→eve:

  amy ◀── bob ◀── dan ◀── eve            start at eve
   ▲                                     eve's parent: dan
   └────── cara                          dan's parent: bob
                                         bob's parent: amy
  parent = {amy: None, bob: amy,         amy's parent: None → stop
            cara: amy, dan: bob,
            eve: dan}                    reverse: amy → bob → dan → eve ✅
                                         3 hops — and NO shorter route exists.`}
        />
        <Callout type="mistake">
          DFS can <em>find</em> a path but not necessarily the <em>shortest</em> one — it commits
          to a tunnel and reports whatever it stumbles into. For shortest-anything with equal-cost
          edges, it&apos;s always BFS. Interviewers love asking why: &quot;because FIFO order
          guarantees nodes are first reached at minimal distance.&quot;
        </Callout>
      </Section>

      {/* 08 ─ BFS VS DFS */}
      <Section id="bfs-vs-dfs" number="08" title="BFS vs DFS — Choosing in Interviews">
        <Table
          head={["", "BFS 🌊", "DFS 🕳️"]}
          rows={[
            ["To-do pile", "queue (FIFO)", "stack / recursion (LIFO)"],
            ["Explores", "closest first, ripples outward", "one tunnel to the end, backtrack"],
            ["Shortest path (unweighted)", "✅ guaranteed", "❌ finds A path, maybe long"],
            ["Memory", "wide graphs: queue grows large", "deep graphs: stack grows deep"],
            ["Crash risk", "none", "RecursionError on deep graphs (~1000)"],
            ["Classic uses", "shortest route, degrees of separation, level-by-level", "cycle detection, maze solving, topological sort, 'does ANY path exist'"],
          ]}
        />
        <FlowDiagram
          steps={[
            { label: "Need SHORTEST / closest / fewest hops?", sub: "→ BFS (queue)" },
            { label: "Need ANY path / explore everything / detect cycles?", sub: "→ DFS (recursion)" },
          ]}
        />
        <Callout type="tip">
          Both visit every node and every edge once: <strong>O(V + E)</strong> time (V nodes, E
          edges) — say that in interviews instead of O(n). The visited set is what makes it true:
          without it, complexity is infinite, literally.
        </Callout>
      </Section>

      {/* 09 ─ WEIGHTED */}
      <Section id="weighted" number="09" title="Weighted Graphs & What Comes After This Page">
        <P>
          Real maps don&apos;t have equal edges — roads have <strong>lengths</strong>. Store a cost
          with each neighbor and you have a <strong>weighted graph</strong>:
        </P>
        <CodeBlock
          title="weighted.py"
          code={`# city map with distances (km)
roads = {
    "Airport": [("Mall", 5), ("Station", 2)],
    "Mall":    [("Airport", 5), ("Park", 3)],
    "Station": [("Airport", 2), ("Park", 9)],
    "Park":    [("Mall", 3), ("Station", 9)],
}

# BFS says Airport→Park fastest is Airport→Station→Park (2 hops)...
# but that's 2+9 = 11 km. Airport→Mall→Park is 3 hops BUT 5+3 = 8 km!
# Fewest HOPS is no longer fewest KILOMETERS. BFS isn't enough.`}
          output={`(BFS counts hops, not kilometers — weighted graphs need Dijkstra)`}
        />
        <CodeBlock
          title="whats_next.txt"
          runnable={false}
          code={`the graph ladder — you are HERE:
                                              ┌────────────────────────┐
  BFS / DFS (this page) ✅                    │ Dijkstra = BFS where    │
      │                                       │ the queue always serves │
      ▼                                       │ the CHEAPEST-so-far     │
  Dijkstra  — shortest path with weights  ◀───│ node (a priority queue) │
      │       (Google Maps' grandfather)      └────────────────────────┘
      ▼
  A*        — Dijkstra + "which way is the goal?" hint (game pathfinding)
      ▼
  Topological sort — ordering tasks with dependencies (build systems, courses)

Each is a small twist on what you now know. BFS/DFS is 80% of
graph interview questions; the rest name-drop these.`}
        />
        <Callout type="note">
          You don&apos;t need Dijkstra memorized for this track — you need the <em>sentence</em>:
          &quot;BFS finds fewest hops; for weighted edges you upgrade the queue to a priority queue
          and it becomes Dijkstra.&quot; That sentence passes interviews.
        </Callout>
      </Section>

      {/* 10 ─ EXCEPTIONS */}
      <Section id="exceptions" number="10" title="💥 Crashes & Traps">
        <P>
          <strong>Trap 1 — forgetting the visited set = infinite loop.</strong> THE graph bug:
        </P>
        <CodeBlock
          title="trap_no_visited.py"
          code={`from collections import deque

def bfs_broken(graph, start):
    queue = deque([start])          # no visited set...
    while queue:
        node = queue.popleft()
        print(node, end=" ")
        for neighbor in graph[node]:
            queue.append(neighbor)  # 💀 re-queues amy from bob, bob from amy...

bfs_broken(graph, "amy")`}
          error
          output={`amy bob cara amy cara dan amy bob dan amy bob dan bob cara eve ...
... (forever — the queue GROWS faster than it drains. Ctrl+C)

Trees forgave you (no cycles). Graphs never do.
visited = {start} BEFORE the loop; check before every append.`}
        />
        <P>
          <strong>Crash 2 — node missing from the dict.</strong>
        </P>
        <CodeBlock
          title="crash_keyerror.py"
          code={`graph = {
    "amy": ["bob"],          # 💀 bob is listed as a neighbor...
}                            #    but bob has no row of his own!

for neighbor in graph["bob"]:
    print(neighbor)`}
          error
          output={`Traceback (most recent call last):
  File "crash_keyerror.py", line 5, in <module>
KeyError: 'bob'

Every node that APPEARS anywhere needs its own key — even leaves:
"bob": []. Or walk defensively: graph.get(node, []).
Best builder: graph = defaultdict(list) — missing keys auto-become [].`}
        />
        <P>
          <strong>Crash 3 — recursive DFS on a huge graph.</strong> Old friend, new costume:
        </P>
        <CodeBlock
          title="crash_deep_dfs.py"
          code={`# a 5000-node chain: 0─1─2─...─4999  (a "graph" shaped like a list)
chain = {i: [i + 1] for i in range(4999)}
chain[4999] = []

dfs(chain, 0)        # 💀 5000 nested calls — limit is ~1000`}
          error
          output={`Traceback (most recent call last):
  File "dfs.py", line 9, in dfs
  [Previous line repeated 996 more times]
RecursionError: maximum recursion depth exceeded

Fix: use dfs_iterative (section 06) — an explicit stack has no
~1000 limit. Same algorithm, crash-proof. This is WHY both versions exist.`}
        />
        <P>
          <strong>Trap 4 — one-way friendship (asymmetric undirected graph).</strong> Silent wrong
          answers:
        </P>
        <CodeBlock
          title="trap_asymmetric.py"
          code={`graph = {
    "amy":  ["bob"],
    "bob":  [],          # 💀 forgot bob's side of the friendship
}

print(shortest_path(graph, "amy", "bob"))
print(shortest_path(graph, "bob", "amy"))   # can't get back!`}
          error
          output={`['amy', 'bob']
None

No exception — the graph is just lying. amy→bob works, bob→amy doesn't.
When building undirected graphs, ALWAYS add both directions:
    graph[a].append(b)
    graph[b].append(a)     ← the line everyone forgets`}
        />
      </Section>

      {/* MEMORIZE */}
      <Section id="memorize" number="11" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Graph =", "nodes + edges; cycles allowed, no root — the general structure"],
            ["Adjacency list", "{node: [neighbors]} — a plain dict, the default representation"],
            ["Undirected edge", "stored TWICE: a lists b AND b lists a"],
            ["The one new idea", "visited set — graphs have cycles, never revisit"],
            ["BFS", "QUEUE → ripples outward by distance (gossip 🌊)"],
            ["DFS", "STACK/recursion → one tunnel deep, then backtrack (maze 🕳️)"],
            ["BFS vs DFS code diff", "literally popleft() vs pop() — same loop"],
            ["Shortest path (unweighted)", "BFS — first arrival is provably shortest; rebuild via parent{}"],
            ["Complexity", "O(V + E) — every node and edge touched once"],
            ["Weighted shortest path", "BFS + priority queue = Dijkstra"],
            ["Forgot visited →", "infinite loop (queue grows forever)"],
            ["Deep graph + recursive DFS →", "RecursionError — switch to the explicit-stack version"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
