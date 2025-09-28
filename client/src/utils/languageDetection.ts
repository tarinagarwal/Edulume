// Language detection utility for coding questions
export const detectLanguageFromQuestion = (questionText: string): string => {
  const text = questionText.toLowerCase();

  // Keywords and patterns for different languages
  const languagePatterns = {
    python: [
      "python",
      "def ",
      "import ",
      "from ",
      "__init__",
      "print(",
      "class ",
      "elif",
      "lambda",
      "self.",
      "pip install",
      "virtualenv",
      "django",
      "flask",
    ],
    javascript: [
      "javascript",
      "js",
      "function(",
      "const ",
      "let ",
      "var ",
      "console.log",
      "require(",
      "import ",
      "export",
      "node.js",
      "nodejs",
      "npm",
      "react",
      "vue",
      "angular",
    ],
    java: [
      "java",
      "public class",
      "private ",
      "public static void main",
      "extends",
      "implements",
      "package ",
      "import java",
      "system.out.println",
      "spring",
    ],
    cpp: [
      "c++",
      "cpp",
      "#include",
      "iostream",
      "std::",
      "cout",
      "cin",
      "namespace",
      "template",
      "class ",
      "struct ",
    ],
    c: [
      " c ",
      "printf(",
      "scanf(",
      "malloc(",
      "free(",
      "#include <stdio.h>",
      "int main(",
      "char *",
      "void ",
    ],
    csharp: [
      "c#",
      "csharp",
      "using system",
      "console.writeline",
      "public class",
      "namespace ",
      "var ",
      ".net",
      "string[]",
    ],
    sql: [
      "sql",
      "select ",
      "from ",
      "where ",
      "join ",
      "insert ",
      "update ",
      "delete ",
      "create table",
      "alter table",
      "database",
    ],
    html: [
      "html",
      "<div>",
      "<html>",
      "<head>",
      "<body>",
      "<script>",
      "<style>",
      "web page",
      "markup",
    ],
    css: [
      "css",
      "stylesheet",
      "color:",
      "font-size:",
      "margin:",
      "padding:",
      "display:",
      "position:",
      "flexbox",
      "grid",
    ],
    typescript: [
      "typescript",
      "ts",
      "interface ",
      "type ",
      "enum ",
      "generic",
      "angular",
      ".ts file",
    ],
    go: ["golang", "go ", "func ", "package main", 'import "', "fmt.print"],
    rust: ["rust", "fn ", "let mut", "cargo", "rustc", "&str", "vec!"],
    php: ["php", "<?php", "$_get", "$_post", "echo ", "mysql", "laravel"],
    ruby: ["ruby", "def ", "class ", "end", "puts ", "rails", ".rb"],
    swift: [
      "swift",
      "var ",
      "let ",
      "func ",
      "import foundation",
      "ios",
      "xcode",
    ],
    kotlin: ["kotlin", "fun ", "val ", "var ", "android", "jetbrains"],
  };

  // Count matches for each language
  const scores: Record<string, number> = {};

  for (const [language, patterns] of Object.entries(languagePatterns)) {
    scores[language] = 0;
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        scores[language] += 1;
      }
    }
  }

  // Find the language with highest score
  let bestLanguage = "javascript"; // default
  let bestScore = 0;

  for (const [language, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLanguage = language;
    }
  }

  // If no patterns matched, try to detect from common keywords
  if (bestScore === 0) {
    if (
      text.includes("algorithm") ||
      text.includes("function") ||
      text.includes("code")
    ) {
      return "javascript"; // Default to JavaScript for general coding questions
    }
  }

  return bestLanguage;
};

// Get Monaco editor language identifier from detected language
export const getMonacoLanguageId = (detectedLanguage: string): string => {
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    csharp: "csharp",
    sql: "sql",
    html: "html",
    css: "css",
    go: "go",
    rust: "rust",
    php: "php",
    ruby: "ruby",
    swift: "swift",
    kotlin: "kotlin",
  };

  return languageMap[detectedLanguage] || "javascript";
};

// Get language display name
export const getLanguageDisplayName = (languageId: string): string => {
  const displayNames: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    csharp: "C#",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    go: "Go",
    rust: "Rust",
    php: "PHP",
    ruby: "Ruby",
    swift: "Swift",
    kotlin: "Kotlin",
  };

  return displayNames[languageId] || "JavaScript";
};
