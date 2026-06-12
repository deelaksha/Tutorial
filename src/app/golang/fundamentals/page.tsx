"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "How Go Builds & Runs — Live",
  nodes: [
    { id: "you", icon: "👨‍💻", label: "You", sub: "write main.go", x: 8, y: 50, color: "#22d3ee" },
    { id: "source", icon: "📄", label: "Source", sub: "main.go", x: 28, y: 25, color: "#a78bfa" },
    { id: "compiler", icon: "⚙️", label: "Compiler", sub: "go build", x: 52, y: 50, color: "#fb923c" },
    { id: "binary", icon: "📦", label: "Binary", sub: "single file, no deps", x: 75, y: 25, color: "#34d399" },
    { id: "os", icon: "💻", label: "Any OS", sub: "runs instantly", x: 90, y: 70, color: "#fbbf24" },
  ],
  edges: [
    { id: "you-source", from: "you", to: "source", color: "#a78bfa" },
    { id: "source-compiler", from: "source", to: "compiler", color: "#fb923c" },
    { id: "compiler-binary", from: "compiler", to: "binary", color: "#34d399" },
    { id: "binary-os", from: "binary", to: "os", color: "#fbbf24" },
    { id: "compiler-you", from: "compiler", to: "you", bend: -60, dashed: true, color: "#f87171" },
  ],
  flows: [
    {
      id: "run",
      name: "🏃 go run",
      command: "go run main.go — instant feedback",
      steps: [
        { node: "source", paths: ["you-source"], text: "You write main.go. The source is plain text — no bytecode, no transpiling step." },
        { node: "compiler", paths: ["source-compiler"], text: "go run compiles to a temp binary under the hood and executes it immediately. Great for dev loop." },
        { node: "os", paths: ["compiler-binary", "binary-os"], text: "Your code runs. Fast compile + garbage collection + statically linked = best of both worlds." },
      ],
    },
    {
      id: "build",
      name: "🔨 go build",
      command: "GOOS=linux GOARCH=amd64 go build",
      steps: [
        { node: "compiler", paths: ["source-compiler"], text: "go build produces a standalone binary. No Go runtime needed on the target machine — the GC is compiled in." },
        { node: "binary", paths: ["compiler-binary"], text: "One file, zero dependencies. Ship this to a server, Docker image, or USB stick — it just runs." },
        { node: "os", paths: ["binary-os"], text: "Cross-compile: set GOOS=windows GOARCH=arm64 and build for ANY platform from your Mac. No cross-compiler hell." },
      ],
    },
    {
      id: "error",
      name: "❌ Compile error",
      command: "# syntax error in main.go:5",
      steps: [
        { node: "compiler", paths: ["source-compiler"], text: "Go catches errors at compile time: unused variables, type mismatches, missing returns — all compile errors, not runtime surprises." },
        { node: "you", paths: ["compiler-you"], text: "The compiler tells you EXACTLY what's wrong, line by line. Fix it, recompile in <1s, repeat. The compile-time strictness saves production pain." },
        { node: "binary", paths: [], text: "No binary is produced until the code is correct. Go's philosophy: if it compiles, it probably works. 🔒" },
      ],
    },
  ],
};

const NAV = [
  { id: "why-go", label: "Why Go Exists ⭐" },
  { id: "install", label: "Install & Toolchain" },
  { id: "hello", label: "Hello World Dissected ⭐" },
  { id: "compile-story", label: "The Compilation Story" },
  { id: "cross-compile", label: "Cross-Compilation" },
  { id: "gofmt", label: "The gofmt Philosophy" },
  { id: "workspace", label: "Workspace Anatomy" },
  { id: "why-not", label: "When NOT to Use Go" },
  { id: "next-steps", label: "What's Next" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function GoFundamentalsPage() {
  return (
    <TopicShell
      icon="🐹"
      title="Go Fundamentals"
      gradientWord="Go"
      subtitle="Why Google created Go in 2007 (compile speed, built-in concurrency, simplicity), the install-to-deploy toolchain, hello world dissected line by line, the compilation story drawn from source to static binary, cross-compilation magic, and the workspace you'll live in."
      nav={NAV}
      badges={["⚡ Fast compile", "📦 Static binary", "🧹 gofmt built-in"]}
      next={{ icon: "📦", label: "Variables & Types", href: "/golang/variables-types" }}
      backHref="/golang"
      backLabel="🐹 Go"
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="why-go" number="01" title="Why Go Exists — The 2007 Problem ⭐">
        <CodeBlock
          title="the_google_problem.txt"
          runnable={false}
          code={`2007 at Google:
┌─────────────────────────────────────────────────────────┐
│ C++: FAST runtime, but...                               │
│  • 45-minute builds for large codebases 🐢              │
│  • manual memory management → segfaults in production   │
│  • no built-in concurrency primitives                   │
├─────────────────────────────────────────────────────────┤
│ Python/Java: EASY to write, but...                      │
│  • slow startup (JVM warm-up, interpreter overhead)     │
│  • dependency hell (jars, venvs, version conflicts)     │
│  • threading in Python = GIL hell                       │
│  • Java verbosity: getters/setters everywhere           │
└─────────────────────────────────────────────────────────┘

Rob Pike, Ken Thompson & Robert Griesemer asked:
"What if we kept C's SPEED and added Python's SIMPLICITY,
 plus concurrency so easy it's actually USED?"

2009: Go 1.0 released. Google's own servers + Docker + K8s.`}
        />
        <P>
          Go was designed for <strong>server software at scale</strong>: thousands of services,
          millions of requests per second, codebases with 100+ engineers. The goals:
        </P>
        <Table
          head={["Design Goal", "How Go Achieves It"]}
          rows={[
            ["Fast builds", "No header files, imports are a DAG (no circular deps), parallel compilation"],
            ["Fast execution", "Compiled to native code, efficient GC, static linking"],
            ["Easy concurrency", "goroutines (lightweight threads) + channels (CSP model) built into the language"],
            ["Simple syntax", "25 keywords (C has 32, Java has 50+), one way to format (gofmt), no generics until Go 1.18"],
            ["Robust", "Garbage collected (no malloc/free), but no exceptions (explicit error returns)"],
            ["Deployable", "Single binary, cross-compile for any OS/arch, zero runtime dependencies"],
          ]}
        />
        <Callout type="analogy">
          Think of Go as a <strong>Toyota Camry</strong> — not flashy, but reliable, efficient, and gets
          you to production without drama. C++ is a Formula 1 car (fast but hard to drive), Python is a
          comfy SUV (easy but slow on the highway).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="install" number="02" title="Install & Toolchain">
        <CodeBlock
          title="terminal"
          code={`# macOS
brew install go

# Linux
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
export PATH=\$PATH:/usr/local/go/bin

# Windows: download installer from go.dev

# verify
go version`}
          output={`go version go1.22.0 darwin/arm64`}
        />
        <P>The Go installation gives you a complete toolchain in one binary:</P>
        <CodeBlock
          title="toolchain.txt"
          runnable={false}
          code={`go run main.go       compile + execute (dev loop)
go build             produce a binary
go test              run tests (built-in test runner!)
go fmt               auto-format your code (one true style)
go vet               catch common mistakes (unreachable code, etc.)
go mod init/tidy     manage dependencies
go get               fetch packages
go install           install binaries to \$GOPATH/bin

ALL of this ships in the 60MB go binary. No npm/pip/bundler/maven.`}
        />
        <Callout type="tip">
          Set <IC>export GOPATH=$HOME/go</IC> in your shell profile. Go will install third-party
          packages to <IC>$GOPATH/pkg</IC> and binaries to <IC>$GOPATH/bin</IC>. Add{" "}
          <IC>$GOPATH/bin</IC> to your PATH to run installed tools.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="hello" number="03" title="Hello World — Dissected Line by Line ⭐">
        <CodeBlock
          title="main.go"
          code={`package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}`}
          output={`Hello, Go!`}
        />
        <CodeBlock
          title="anatomy.txt"
          runnable={false}
          code={`package main                ← EVERY Go file starts with package.
                              "main" is special: the entry point.
                              Other packages: "fmt", "http", "mylib"

import "fmt"                ← Import standard library packages.
                              "fmt" = formatted I/O (print, scan, etc.)

func main() {               ← func = function keyword.
                              main() = THE entry point (like int main() in C)
                              { must be on the same line as func (Go style)

    fmt.Println(...)        ← fmt.Println = package.FunctionName
                              capital P = EXPORTED (public in other langs)
                              lowercase = unexported (private)

}                           ← closing brace on its own line

No semicolons! The lexer inserts them automatically.
No classes! Just packages + functions + structs (later).`}
        />
        <Callout type="mistake">
          Common beginner error: <IC>func main()</IC> with the brace on the next line. Go will insert a
          semicolon after <IC>main()</IC> and the code won&apos;t compile. The brace <strong>must</strong>{" "}
          be on the same line.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="compile-story" number="04" title="The Compilation Story">
        <CodeBlock
          title="source_to_binary.txt"
          runnable={false}
          code={`main.go (source)
    ↓
[go compiler]  ← blazing fast (1s for small programs, <10s for most)
    ↓          ← parses, type-checks, optimizes, links
    ↓          ← statically links the Go runtime (GC, scheduler)
    ↓
main (binary)  ← native machine code, ONE file
    ↓          ← no .dll, .so, or JVM needed
    ↓
runs on ANY machine with the same OS/arch
    ↓
(or cross-compile for different OS/arch!)

Contrast with:
• Python: .py → interpreter reads it every time (slow start)
• Java:   .java → .class → JVM (warm-up time, fat JARs)
• C:      .c → .o → linker → binary (similar, but no GC, manual memory)`}
        />
        <P>
          When you <IC>go build</IC>, the compiler includes the Go runtime (garbage collector, goroutine
          scheduler, type information for reflection). The result: a <strong>static binary</strong> — copy
          it anywhere and run.
        </P>
        <CodeBlock
          title="terminal"
          code={`go build main.go
ls -lh main`}
          output={`-rwxr-xr-x  1 you  staff   1.8M Jan 10 10:00 main`}
        />
        <Callout type="behind">
          Why 1.8MB for a hello-world? The Go runtime (GC, scheduler, type metadata) is included. For
          production, strip debug info with <IC>go build -ldflags=&quot;-s -w&quot;</IC> — this drops it to
          ~1.2MB. Still bigger than C (no runtime), but smaller than a JVM.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="cross-compile" number="05" title="Cross-Compilation — Any OS, Any Architecture">
        <CodeBlock
          title="terminal"
          code={`# on your Mac, build for Linux server
GOOS=linux GOARCH=amd64 go build -o myapp-linux main.go

# build for Windows from Linux
GOOS=windows GOARCH=amd64 go build -o myapp.exe main.go

# build for Raspberry Pi (ARM)
GOOS=linux GOARCH=arm GOARM=7 go build -o myapp-rpi main.go

# see all supported platforms
go tool dist list`}
          output={`aix/ppc64
android/386
android/amd64
android/arm
android/arm64
darwin/amd64
darwin/arm64
...
windows/amd64
windows/arm64
(50+ combinations)`}
        />
        <P>
          No cross-compiler toolchain, no mingw, no hassle. Just set two environment variables and Go handles
          the rest. The binary runs natively on the target platform.
        </P>
        <Callout type="analogy">
          Cross-compilation in Go is like exporting a Figma design to PNG/SVG/PDF — one click, any format.
          In C/C++, you need a different toolchain for each target (like needing Photoshop, Illustrator, and
          InDesign separately).
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="gofmt" number="06" title="The gofmt Philosophy — One True Style">
        <CodeBlock
          title="before_gofmt.go"
          code={`package main
import "fmt"
func main(){
fmt.Println( "messy spacing" )
}`}
        />
        <CodeBlock
          title="terminal"
          code={`gofmt -w main.go  # -w = write back to file`}
          output={`(file rewritten)`}
        />
        <CodeBlock
          title="after_gofmt.go"
          code={`package main

import "fmt"

func main() {
\tfmt.Println("messy spacing")
}`}
        />
        <P>
          <IC>gofmt</IC> enforces the <strong>one official Go style</strong>: tabs (not spaces), braces on
          the same line, imports sorted, alignment automatic. No debates, no config files, no prettier/eslint
          wars.
        </P>
        <Callout type="tip">
          Set your editor to run <IC>gofmt</IC> on save. VS Code: install the Go extension, it does this by
          default. Every Go project on GitHub looks identical — reading others&apos; code feels like reading
          your own.
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="workspace" number="07" title="Workspace Anatomy">
        <CodeBlock
          title="typical_go_project.txt"
          runnable={false}
          code={`myproject/
├── go.mod              ← module definition (like package.json)
├── go.sum              ← dependency lock file (like package-lock.json)
├── main.go             ← entry point (package main)
├── server/
│   ├── handler.go      ← package server
│   └── middleware.go
├── database/
│   └── db.go           ← package database
└── README.md

go.mod contains:
  module github.com/you/myproject
  go 1.22
  require (
      github.com/gorilla/mux v1.8.0
  )

Convention: one package per directory, package name = directory name.`}
        />
        <P>
          Create a new project with <IC>go mod init github.com/yourname/projectname</IC>. This creates{" "}
          <IC>go.mod</IC> and tracks dependencies. No <IC>node_modules</IC> folder — dependencies live in{" "}
          <IC>$GOPATH/pkg/mod</IC>, shared across all projects.
        </P>
      </Section>

      {/* 08 */}
      <Section id="why-not" number="08" title="When NOT to Use Go">
        <CodeBlock
          title="honest_tradeoffs.txt"
          runnable={false}
          code={`Go is GREAT for:
✅ web servers, APIs, microservices
✅ CLI tools (Docker, Kubernetes, Terraform, Hugo — all Go)
✅ network programming, distributed systems
✅ concurrent data pipelines

Go is NOT the best for:
❌ CPU-bound number crunching → Rust, C, Fortran (Go GC adds pauses)
❌ desktop GUIs → Electron, Swift, Qt (Go has no mature GUI libs)
❌ machine learning → Python (ecosystem, libraries, tooling)
❌ systems programming (OS kernels, drivers) → C, Rust
❌ highly dynamic/metaprogramming needs → Ruby, Python, Lisp

The "boring technology" choice: if you're building a web service
and need it to scale, Go is the safe bet. 🏗️`}
        />
      </Section>

      {/* 09 */}
      <Section id="next-steps" number="09" title="What's Next — The Learning Path">
        <CodeBlock
          title="the_journey.txt"
          runnable={false}
          code={`You've seen the WHY and the HELLO.
Next 11 topics:

📦 Variables & Types       ← var, :=, zero values, conversions
🔀 Control Flow            ← if, for, switch, defer (the LIFO stack!)
⚙️ Functions               ← multiple returns, closures
📚 Collections             ← slices (the Go array), maps
🏗️ Structs & Methods       ← composition over inheritance
🧩 Interfaces              ← implicit satisfaction (polymorphism)
⚠️ Error Handling          ← if err != nil (no exceptions)
⚡ Goroutines & Channels   ← concurrency (the killer feature)
🔄 Concurrency Patterns    ← worker pools, fan-out/in
📦 Packages & Modules      ← code organization
🌐 Web & API               ← http.Server, JSON, REST

by the end: you'll build a concurrent REST API from scratch. 🚀`}
        />
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Why Go?", "fast compile + GC + built-in concurrency + simple syntax"],
            ["Created by", "Google 2007 (Rob Pike, Ken Thompson, Robert Griesemer)"],
            ["Toolchain", "go run | build | test | fmt | vet | mod — all in one binary"],
            ["Entry point", "package main + func main() — braces on SAME line"],
            ["Compile output", "static binary, no runtime dependencies, cross-compile with GOOS/GOARCH"],
            ["gofmt", "one official style, run on save, zero config, no debates"],
            ["Packages", "one per directory, Capitalized = exported, lowercase = unexported"],
            ["go.mod", "module definition + dependency versions (go mod init/tidy)"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
