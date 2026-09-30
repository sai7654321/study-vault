// Auto-categorization rules and Google Drive helper utilities

export function extractDriveId(input) {
  if (!input) {
    return "";
  }
  var cleanInput = input.trim();
  // Matches /file/d/FILE_ID or id=FILE_ID or /folders/FOLDER_ID
  var fileMatch = cleanInput.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }
  var idParamMatch = cleanInput.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }
  var folderMatch = cleanInput.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  // If it's already just the raw ID string
  if (/^[a-zA-Z0-9_-]{20,}$/.test(cleanInput)) {
    return cleanInput;
  }
  return cleanInput;
}

export function categorizeFile(fileName) {
  if (!fileName) {
    return "general";
  }
  var lower = fileName.toLowerCase();

  // 1. Python (Highest priority: Any filename containing "python", "py", or Python tools belongs in Python)
  var isPython =
    lower.indexOf("python") !== -1 ||
    lower.indexOf("py_") !== -1 ||
    lower.indexOf("_py.") !== -1 ||
    lower.indexOf("-py") !== -1 ||
    lower.indexOf(".py") !== -1 ||
    lower.indexOf("django") !== -1 ||
    lower.indexOf("flask") !== -1 ||
    lower.indexOf("fastapi") !== -1 ||
    lower.indexOf("pandas") !== -1 ||
    lower.indexOf("numpy") !== -1 ||
    lower.indexOf("matplotlib") !== -1 ||
    lower.indexOf("seaborn") !== -1 ||
    lower.indexOf("jupyter") !== -1 ||
    lower.indexOf("pytorch") !== -1 ||
    lower.indexOf("tensorflow") !== -1 ||
    lower.indexOf("scikit") !== -1 ||
    lower.indexOf("machine learning") !== -1 ||
    lower.indexOf("data science") !== -1 ||
    lower.indexOf("automation") !== -1;

  if (isPython) {
    return "python";
  }

  // 2. SQL & Databases
  if (
    lower.indexOf("sql") !== -1 ||
    lower.indexOf("database") !== -1 ||
    lower.indexOf("dbms") !== -1 ||
    lower.indexOf("rdbms") !== -1 ||
    lower.indexOf("postgres") !== -1 ||
    lower.indexOf("mysql") !== -1 ||
    lower.indexOf("oracle") !== -1 ||
    lower.indexOf("mongo") !== -1 ||
    lower.indexOf("query") !== -1 ||
    lower.indexOf("schema") !== -1
  ) {
    return "sql";
  }

  // 3. Java (Core Java, Spring Boot, Hibernate, JVM, OOPs in Java, Java Patterns)
  var isJavascript =
    lower.indexOf("javascript") !== -1 ||
    lower.indexOf(" js") !== -1 ||
    lower.indexOf(".js") !== -1;
  var hasJavaKeyword = lower.indexOf("java") !== -1 && !isJavascript;

  var isExplicitDsa =
    lower.indexOf("dsa") !== -1 ||
    lower.indexOf("leetcode") !== -1 ||
    lower.indexOf("algorithm") !== -1;

  if (
    (hasJavaKeyword && !isExplicitDsa) ||
    lower.indexOf("jvm") !== -1 ||
    lower.indexOf("jdk") !== -1 ||
    lower.indexOf("spring") !== -1 ||
    lower.indexOf("springboot") !== -1 ||
    lower.indexOf("hibernate") !== -1 ||
    lower.indexOf("servlet") !== -1 ||
    lower.indexOf("jdbc") !== -1
  ) {
    return "java";
  }

  // 4. Data Structures & Algorithms (DSA, LeetCode, patterns without python/java)
  if (
    lower.indexOf("dsa") !== -1 ||
    lower.indexOf("algorithm") !== -1 ||
    lower.indexOf("algo") !== -1 ||
    lower.indexOf("pattern") !== -1 ||
    lower.indexOf("pttern") !== -1 ||
    lower.indexOf("leetcode") !== -1 ||
    lower.indexOf("tree") !== -1 ||
    lower.indexOf("graph") !== -1 ||
    lower.indexOf("dp") !== -1 ||
    lower.indexOf("dynamic programming") !== -1 ||
    lower.indexOf("recursion") !== -1 ||
    lower.indexOf("binary") !== -1 ||
    lower.indexOf("sorting") !== -1 ||
    lower.indexOf("linkedlist") !== -1
  ) {
    return "dsa";
  }

  // 5. Full Stack & Web Development
  if (
    lower.indexOf("fullstack") !== -1 ||
    lower.indexOf("full-stack") !== -1 ||
    lower.indexOf("full stack") !== -1 ||
    lower.indexOf("react") !== -1 ||
    lower.indexOf("javascript") !== -1 ||
    lower.indexOf("frontend") !== -1 ||
    lower.indexOf("front-end") !== -1 ||
    lower.indexOf("backend") !== -1 ||
    lower.indexOf("back-end") !== -1 ||
    lower.indexOf("node") !== -1 ||
    lower.indexOf("express") !== -1 ||
    lower.indexOf("web") !== -1 ||
    lower.indexOf("html") !== -1 ||
    lower.indexOf("css") !== -1 ||
    lower.indexOf("mern") !== -1 ||
    lower.indexOf("mean") !== -1 ||
    lower.indexOf("angular") !== -1 ||
    lower.indexOf("vue") !== -1
  ) {
    return "fullstack";
  }

  // 6. Interview Prep & Aptitude
  if (
    lower.indexOf("interview") !== -1 ||
    lower.indexOf("tcs") !== -1 ||
    lower.indexOf("ninja") !== -1 ||
    lower.indexOf("aptitude") !== -1 ||
    lower.indexOf("resume") !== -1 ||
    lower.indexOf("placement") !== -1 ||
    lower.indexOf("hr") !== -1 ||
    lower.indexOf("wipro") !== -1 ||
    lower.indexOf("infosys") !== -1 ||
    lower.indexOf("accenture") !== -1 ||
    lower.indexOf("cheat") !== -1
  ) {
    return "interview";
  }

  // 7. Core Computer Science
  if (
    lower.indexOf("operating system") !== -1 ||
    lower.indexOf("os") !== -1 ||
    lower.indexOf("network") !== -1 ||
    lower.indexOf("cn") !== -1 ||
    lower.indexOf("oops") !== -1 ||
    lower.indexOf("system design") !== -1
  ) {
    return "core_cs";
  }

  return "other_files";
}

export function getCategoryDetails(key) {
  var categories = {
    all: {
      key: "all",
      name: "All Files",
      color: "#6366f1",
      rgb: "99, 102, 241",
      badgeBg: "rgba(99, 102, 241, 0.12)",
      icon: "📚",
      description: "Complete collection of resources and notes"
    },
    sql: {
      key: "sql",
      name: "SQL & Databases",
      color: "#0284c7",
      rgb: "2, 132, 199",
      badgeBg: "rgba(2, 132, 199, 0.12)",
      icon: "🗄️",
      description: "SQL queries, schema design, database optimization & DBMS notes"
    },
    java: {
      key: "java",
      name: "Java",
      color: "#ea580c",
      rgb: "234, 88, 12",
      badgeBg: "rgba(234, 88, 12, 0.12)",
      icon: "☕",
      description: "Core Java concepts, OOPs, Collections, Multithreading & Spring Boot"
    },
    fullstack: {
      key: "fullstack",
      name: "Full Stack",
      color: "#06b6d4",
      rgb: "6, 182, 212",
      badgeBg: "rgba(6, 182, 212, 0.12)",
      icon: "🌐",
      description: "Full Stack Web Development, React, Node.js, Frontend & Backend technologies"
    },
    dsa: {
      key: "dsa",
      name: "DSA & Problem Solving",
      color: "#059669",
      rgb: "5, 150, 105",
      badgeBg: "rgba(5, 150, 105, 0.12)",
      icon: "⚡",
      description: "Algorithms, patterns, data structures and LeetCode problem guides"
    },
    interview: {
      key: "interview",
      name: "Interview & Aptitude",
      color: "#db2777",
      rgb: "219, 39, 119",
      badgeBg: "rgba(219, 39, 119, 0.12)",
      icon: "🎯",
      description: "Company-specific interview guides, aptitude papers & resume tips"
    },
    python: {
      key: "python",
      name: "Python",
      color: "#2563eb",
      rgb: "37, 99, 235",
      badgeBg: "rgba(37, 99, 235, 0.12)",
      icon: "🐍",
      description: "Python programming, Django, Flask, ML, Data Science & Automation"
    },
    core_cs: {
      key: "core_cs",
      name: "Core CS",
      color: "#7c3aed",
      rgb: "124, 58, 237",
      badgeBg: "rgba(124, 58, 237, 0.12)",
      icon: "💻",
      description: "Operating Systems, Computer Networks & System Design fundamentals"
    },
    other_files: {
      key: "other_files",
      name: "Other Files",
      color: "#64748b",
      rgb: "100, 116, 139",
      badgeBg: "rgba(100, 116, 139, 0.12)",
      icon: "📁",
      description: "Miscellaneous files that don't match any specific category"
    }
  };

  if (categories[key]) {
    return categories[key];
  }
  return categories.other_files;
}

export function buildDrivePreviewUrl(fileId) {
  if (!fileId) {
    return "";
  }
  return "https://drive.google.com/file/d/" + fileId + "/preview";
}

export function buildDriveDirectDownloadUrl(fileId) {
  if (!fileId) {
    return "";
  }
  return "https://drive.google.com/uc?export=download&id=" + fileId;
}

export function buildDriveViewUrl(fileId) {
  if (!fileId) {
    return "";
  }
  return "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
}
