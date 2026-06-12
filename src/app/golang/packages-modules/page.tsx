"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "Module Resolution — Live",
  nodes: [
    { id: "app", icon: "📱", label: "your-app", sub: "main.go", x: 8, y: 35, color: "#22d3ee" },
    { id: "gomod", icon: "📋", label: "go.mod", sub: "dependencies list", x: 30, y: 20, color: "#fbbf24" },
    { id: "proxy", icon: "🌐", label: "proxy.golang.org", sub: "module mirror", x: 55, y: 15, color: "#a78bfa" },
    { id: "cache", icon: "💾", label: "module cache", sub: "~/.go/pkg/mod", x: 55, y: 50, color: "#34d399" },
    { id: "build", icon: "🔨", label: "Build", sub: "compiler", x: 30, y: 70, color: "#fb923c" },
    { id: "internal", icon: "🔒", label: "internal/", sub: "blocked import", x: 82, y: 65, color: "#f87171" },
  ],
  edges: [
    { id: "app-gomod", from: "app", to: "gomod", color: "#fbbf24" },
    { id: "gomod-proxy", from: "gomod", to: "proxy", color: "#a78bfa" },
    { id: "proxy-cache", from: "proxy", to: "cache", color: "#34d399" },
    { id: "cache-build", from: "cache", to: "build", color: "#fb923c" },
    { id: "app-build", from: "app", to: "build", color: "#fb923c" },
    { id: "build-internal", from: "build", to: "internal", dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "tidy",
      name: "🔍 go mod tidy",
      command: "go mod tidy — fetch & pin dependencies",
      steps: [
        { node: "app", paths: ["app-gomod"], text: "Scans imports in .go files, updates go.mod with required modules." },
        { node: "gomod", paths: ["gomod-proxy"], text: "go.mod lists: require github.com/foo/bar v1.2.3. Fetches from proxy (or direct if unavailable)." },
        { node: "cache", paths: ["proxy-cache"], text: "Downloads to ~/.go/pkg/mod, writes checksums to go.sum. Cached forever (immutable versions). 💾" },
      ],
    },
    {
      id: "upgrade",
      name: "⬆️ Version upgrade",
      command: "go get github.com/foo/bar@v2.0.0",
      steps: [
        { node: "gomod", paths: ["gomod-proxy"], text: "go get updates go.mod to v2.0.0. Semantic import versioning: v2+ needs /v2 in import path!" },
        { node: "cache", paths: ["proxy-cache", "cache-build"], text: "Fetches new version, updates go.sum. go build pulls from cache — no re-download." },
        { node: "build", paths: ["app-build"], text: "Compiles with new version. If breaking changes → compilation fails (caught early). ⬆️" },
      ],
    },
    {
      id: "internal-block",
      name: "🔒 internal/ import blocked",
      command: "import \"other-project/internal/foo\" — compile error",
      steps: [
        { node: "app", paths: ["app-build"], text: "Tries to import github.com/other/project/internal/foo from outside that module." },
        { node: "internal", paths: ["build-internal"], text: "internal/ is special: only parent module + children can import. Compiler rejects external imports." },
        { node: "build", paths: [], text: "Error: use of internal package not allowed. internal/ enforces encapsulation at compile time. 🔒" },
      ],
    },
  ],
};

const NAV = [
  { id: "packages", label: "Package = Directory ⭐" },
  { id: "exported", label: "Capitalized = Exported" },
  { id: "gomod", label: "go.mod & go.sum ⭐" },
  { id: "semver", label: "Semantic Import Versioning" },
  { id: "layout", label: "Standard Project Layout ⭐" },
  { id: "testing", label: "go test & Table-Driven Tests" },
  { id: "benchmarks", label: "Benchmarks" },
  { id: "tooling", label: "Tooling — vet, staticcheck, gofmt" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoPackagesModulesPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Packages & Modules"
      gradientWord="Packages"
      subtitle="Packages are directories, Capitalized names export, go.mod tracks dependencies with semantic versioning. Standard layout: cmd/ for binaries, internal/ for private code, pkg/ for libraries. go test runs tests, table-driven tests are idiomatic, and vet/staticcheck catch bugs before runtime."
      nav={NAV}
      badges={["📦 Modules", "🧪 Table tests", "🔧 Tooling"]}
      next={{ icon: "🌐", label: "Build a REST API", href: "/golang/web-api" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="packages" number="01" title="Package = Directory — The Go Unit of Code ⭐">
        <CodeBlock
          title="package_structure.txt"
          runnable={false}
          code={`myproject/
├─ main.go           package main  ← entry point
├─ math/
│  ├─ add.go         package math
│  └─ multiply.go    package math  ← same package!
└─ utils/
   └─ logger.go      package utils

RULES:
• all .go files in a directory = same package name
• directory name usually = package name (but not enforced)
• package main + func main() = executable
• any other package = library (imported by others) 📦`}
        />
        <CodeBlock
          title="math/add.go"
          code={`package math

func Add(a, b int) int {  // Capitalized = exported
    return a + b
}

func subtract(a, b int) int {  // lowercase = private to package
    return a - b
}`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "myproject/math"  // import by module-path/package
)

func main() {
    sum := math.Add(10, 5)
    fmt.Println(sum)
    // math.subtract(10, 5)  // compile error: unexported
}`}
          output={`15`}
        />
        <Callout type="tip">
          💡 One directory = one package. Split large packages into subdirectories with their own
          package names. <IC>package main</IC> is special: it builds an executable. Everything else
          is a library.
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="exported" number="02" title="Capitalized = Exported — Go&apos;s Public/Private">
        <CodeBlock
          title="visibility.txt"
          runnable={false}
          code={`Capitalized → exported (public)
lowercase   → unexported (private to package)

┌──────────────────────────────────────┐
│ package foo                          │
│                                      │
│ var Count int        ← exported     │
│ var internal string  ← NOT exported │
│                                      │
│ type User struct {                  │
│   Name string    ← exported field   │
│   age  int       ← unexported field │
│ }                                    │
│                                      │
│ func DoThing() { … }  ← exported    │
│ func helper() { … }   ← NOT exported│
└──────────────────────────────────────┘

No 'public' keyword — JUST capitalization. Simple. 🔤`}
        />
        <CodeBlock
          title="user/user.go"
          code={`package user

type User struct {
    Name  string  // exported
    Email string  // exported
    password string  // unexported — can't access outside package
}

func NewUser(name, email, password string) *User {
    return &User{Name: name, Email: email, password: password}
}

func (u *User) CheckPassword(pwd string) bool {
    return u.password == pwd  // package can access own unexported fields
}`}
        />
        <CodeBlock
          title="main.go"
          code={`package main

import (
    "fmt"
    "myproject/user"
)

func main() {
    u := user.NewUser("Alice", "alice@example.com", "secret123")
    fmt.Println(u.Name, u.Email)
    // fmt.Println(u.password)  // compile error: u.password undefined
    fmt.Println("password ok:", u.CheckPassword("secret123"))
}`}
          output={`Alice alice@example.com
password ok: true`}
        />
      </Section>

      {/* 03 */}
      <Section id="gomod" number="03" title="go.mod & go.sum — Dependency Management ⭐">
        <CodeBlock
          title="go.mod"
          code={`module github.com/yourname/myapp

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/stretchr/testify v1.8.4
)

require (
    // indirect dependencies (pulled by gin)
    github.com/bytedance/sonic v1.9.1 // indirect
    github.com/json-iterator/go v1.1.12 // indirect
)`}
        />
        <CodeBlock
          title="init_module.sh"
          code={`# initialize a new module
go mod init github.com/yourname/myapp

# add dependencies (scans imports, updates go.mod)
go mod tidy

# upgrade a dependency
go get github.com/gin-gonic/gin@v1.10.0

# download all dependencies to module cache
go mod download`}
          output={`go: creating new go.mod: module github.com/yourname/myapp
go: finding module for package github.com/gin-gonic/gin
go: downloading github.com/gin-gonic/gin v1.9.1
go: added github.com/gin-gonic/gin v1.9.1`}
        />
        <P>
          <IC>go.mod</IC> lists your direct dependencies + Go version. <IC>go.sum</IC> is a lockfile
          with checksums (detects tampering). <IC>go mod tidy</IC> adds missing, removes unused.
          Dependencies live in <IC>$GOPATH/pkg/mod</IC> (cached, immutable).
        </P>
        <Table
          head={["Command", "Action"]}
          rows={[
            ["go mod init <module>", "create go.mod for new project"],
            ["go mod tidy", "add missing deps, remove unused, update go.sum"],
            ["go get <pkg>@<version>", "add or upgrade a dependency"],
            ["go mod download", "pre-download all deps (useful in CI)"],
            ["go mod vendor", "copy deps into vendor/ (optional, for hermetic builds)"],
          ]}
        />
      </Section>

      {/* 04 */}
      <Section id="semver" number="04" title="Semantic Import Versioning — v2+ in Path">
        <CodeBlock
          title="semver_rule.txt"
          runnable={false}
          code={`Go modules enforce semantic versioning:
┌─────────────────────────────────────────────┐
│ v0.x.x, v1.x.x  → same import path          │
│   import "github.com/foo/bar"               │
│                                             │
│ v2.x.x+         → /v2 suffix REQUIRED       │
│   import "github.com/foo/bar/v2"            │
│                                             │
│ v3.x.x+         → /v3, etc.                 │
└─────────────────────────────────────────────┘

Breaking change? Bump major version AND update import path.
Go enforces this at compile time — prevents diamond dependency
hell. ✅`}
        />
        <CodeBlock
          title="go.mod"
          code={`module myapp

require (
    github.com/foo/bar v1.5.2       // v1 import path
    github.com/foo/bar/v2 v2.3.0    // v2 different path!
)

// both can coexist in the same binary — different import paths`}
        />
        <Callout type="tip">
          💡 If you publish a library and make breaking changes, tag v2.0.0 AND add <IC>/v2</IC> to
          the module path in go.mod. Users can migrate incrementally — import both v1 and v2 in the
          same app.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="layout" number="05" title="Standard Project Layout — cmd/, internal/, pkg/ ⭐">
        <CodeBlock
          title="project_structure.txt"
          runnable={false}
          code={`myproject/
├─ go.mod
├─ go.sum
├─ README.md
├─ cmd/                   ← binaries (entry points)
│  ├─ server/
│  │  └─ main.go          package main
│  └─ worker/
│     └─ main.go          package main
├─ internal/              ← private code (can't be imported externally)
│  ├─ config/
│  │  └─ config.go
│  └─ database/
│     └─ db.go
├─ pkg/                   ← public libraries (can be imported by others)
│  └─ api/
│     └─ client.go
├─ api/                   ← OpenAPI specs, proto files
├─ web/                   ← static files, templates
├─ scripts/               ← build/deploy scripts
└─ testdata/              ← test fixtures

cmd/      = multiple main packages, one per binary
internal/ = enforced privacy (compiler blocks external imports)
pkg/      = public, reusable libraries
testdata/ = test inputs (ignored by go build) 🗂️`}
        />
        <Callout type="tip">
          💡 <IC>internal/</IC> is special: Go&apos;s compiler forbids imports of{" "}
          <IC>github.com/you/app/internal/foo</IC> from OUTSIDE your module. Use it for code you
          don&apos;t want to commit to as public API. <IC>pkg/</IC> is the opposite — explicitly
          public.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="testing" number="06" title="go test & Table-Driven Tests — The Interview Classic">
        <CodeBlock
          title="math/add.go"
          code={`package math

func Add(a, b int) int {
    return a + b
}`}
        />
        <CodeBlock
          title="math/add_test.go"
          code={`package math

import "testing"

// test function: Test<Name>(t *testing.T)
func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}

// TABLE-DRIVEN TEST (idiomatic Go) ⭐
func TestAddTable(t *testing.T) {
    tests := []struct {
        name string
        a, b int
        want int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -1, -2},
        {"zero", 0, 0, 0},
        {"mixed", 10, -5, 5},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.want {
                t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, got, tt.want)
            }
        })
    }
}`}
        />
        <CodeBlock
          title="run_tests.sh"
          code={`go test ./...         # test all packages
go test -v ./math     # verbose output
go test -run TestAdd  # run specific test`}
          output={`ok      myproject/math  0.002s
--- PASS: TestAdd (0.00s)
--- PASS: TestAddTable (0.00s)
    --- PASS: TestAddTable/positive (0.00s)
    --- PASS: TestAddTable/negative (0.00s)
    --- PASS: TestAddTable/zero (0.00s)
    --- PASS: TestAddTable/mixed (0.00s)
PASS`}
        />
        <Callout type="analogy">
          📋 Table-driven tests are Go&apos;s bread and butter. Define a slice of test cases (inputs
          + expected output), loop over them with <IC>t.Run</IC> for subtests. ONE test function,
          MANY cases — DRY, readable, easy to add new cases. This pattern appears in EVERY Go
          interview.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="benchmarks" number="07" title="Benchmarks — Measuring Performance">
        <CodeBlock
          title="math/add_test.go"
          code={`package math

import "testing"

// benchmark: Benchmark<Name>(b *testing.B)
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {  // b.N adjusted automatically
        Add(10, 20)
    }
}

func BenchmarkAddTable(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(123, 456)
    }
}`}
        />
        <CodeBlock
          title="run_benchmarks.sh"
          code={`go test -bench=. ./math
go test -bench=BenchmarkAdd -benchmem  # show memory allocations`}
          output={`goos: linux
goarch: amd64
pkg: myproject/math
BenchmarkAdd-8          1000000000               0.25 ns/op
BenchmarkAddTable-8     1000000000               0.25 ns/op
PASS
ok      myproject/math  0.512s`}
        />
        <P>
          Benchmarks measure nanoseconds per operation. <IC>b.N</IC> is auto-tuned to run long
          enough for stable results. <IC>-benchmem</IC> adds memory allocation stats. Use to compare
          algorithms, find hotspots, validate optimizations.
        </P>
      </Section>

      {/* 08 */}
      <Section id="tooling" number="08" title="Tooling — vet, staticcheck, gofmt">
        <Table
          head={["Tool", "Purpose", "Example"]}
          rows={[
            ["gofmt", "auto-format code (standard style)", "gofmt -w . (write back)"],
            ["go vet", "static analysis (suspects, not errors)", "go vet ./... (catches Printf mismatches)"],
            ["staticcheck", "advanced linter (go install)", "staticcheck ./... (unused vars, bugs)"],
            ["golangci-lint", "meta-linter (runs 50+ linters)", "golangci-lint run (CI standard)"],
            ["go mod tidy", "cleanup dependencies", "removes unused, adds missing"],
          ]}
        />
        <CodeBlock
          title="vet_example.go"
          code={`package main

import "fmt"

func main() {
    fmt.Printf("%d\\n", "oops")  // wrong type for %d
}`}
        />
        <CodeBlock
          title="vet_output.sh"
          code={`go vet .`}
          output={`# myproject
./main.go:6:2: Printf format %d has arg "oops" of wrong type string`}
          error={true}
        />
        <CodeBlock
          title="staticcheck_example.go"
          code={`package main

func main() {
    x := 10
    // x is unused
}`}
        />
        <CodeBlock
          title="staticcheck_output.sh"
          code={`staticcheck .`}
          output={`main.go:4:2: x declared but not used (U1000)`}
          error={true}
        />
        <Callout type="tip">
          💡 CI checklist: <IC>gofmt -d . | grep . && exit 1</IC> (fail if unformatted),{" "}
          <IC>go vet ./...</IC>, <IC>staticcheck ./...</IC>, <IC>go test -race ./...</IC>. Catches
          most bugs before code review. gofmt is non-negotiable — Go culture is zero-tolerance for
          unformatted code.
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="memorize" number="09" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Package", "one directory = one package · all .go files same package name"],
            ["Exported", "Capitalized = public · lowercase = private to package"],
            ["go.mod", "module name + dependencies · go mod tidy adds/removes"],
            ["Semantic versioning", "v2+ requires /v2 in import path — enforced by compiler"],
            ["Project layout", "cmd/ binaries · internal/ private · pkg/ public libs"],
            ["Test file", "*_test.go in same package · func Test<Name>(t *testing.T)"],
            ["Table-driven", "tests := []struct{…}; for _, tt := range tests { t.Run(…) }"],
            ["Benchmark", "func Benchmark<Name>(b *testing.B) { for i := 0; i < b.N; i++ {…} }"],
            ["go vet", "go vet ./... — static analysis for common mistakes"],
            ["gofmt", "gofmt -w . — auto-format (non-negotiable in Go culture)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
