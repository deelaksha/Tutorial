"use client";

import { TopicShell } from "@/components/topic-shell";
import { PrintingPart1 } from "@/components/printing/part1";
import { PrintingPart2 } from "@/components/printing/part2";

const NAV = [
  { id: "basic-print", label: "Basic Print" },
  { id: "variables", label: "Printing Variables" },
  { id: "multiple-values", label: "Multiple Values" },
  { id: "sep", label: "Separator (sep)" },
  { id: "end", label: "End (end)" },
  { id: "newline", label: "New Line \\n" },
  { id: "tab", label: "Tab Space \\t" },
  { id: "concat", label: "Concatenation" },
  { id: "f-strings", label: "f-Strings ⭐" },
  { id: "number-format", label: "Formatting Numbers" },
  { id: "percentage", label: "Percentage" },
  { id: "binary", label: "Binary" },
  { id: "octal", label: "Octal" },
  { id: "hexadecimal", label: "Hexadecimal" },
  { id: "lists", label: "Printing Lists" },
  { id: "dicts", label: "Dictionaries" },
  { id: "quotes", label: "With / Without Quotes" },
  { id: "patterns", label: "Patterns" },
  { id: "old-style", label: "Old Style %" },
  { id: "format-method", label: ".format()" },
  { id: "special-chars", label: "Special Characters" },
  { id: "interview-loops", label: "Interview Problems" },
  { id: "exceptions", label: "Exception Cases 💥" },
  { id: "memorize", label: "Must Memorize 🧠" },
];

export default function PrintingPage() {
  return (
    <TopicShell
      icon="🖨️"
      title="Printing & Output"
      gradientWord="Python Printing"
      subtitle={`All ${NAV.length} techniques with memory visuals, real outputs and every exception case. Look at the visuals, understand the concept, then write your own.`}
      nav={NAV}
      badges={["▶ Runnable outputs", "🧠 Memory diagrams", "💥 Exception cases", "🧪 5 playgrounds", "💬 Interview kit"]}
      next={{ icon: "🏷️", label: "Variables & Memory", href: "/python/variables" }}
    >
      <PrintingPart1 />
      <PrintingPart2 />
    </TopicShell>
  );
}
