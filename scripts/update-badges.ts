import fs from "node:fs";
import path from "node:path";

const getCoverage = (appPath: string): string => {
  try {
    const summaryPath = path.join(
      process.cwd(),
      "apps",
      appPath,
      "coverage",
      "coverage-summary.json",
    );
    if (!fs.existsSync(summaryPath)) {
      return "0";
    }
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
    return Math.floor(summary.total.lines.pct).toString();
  } catch (e) {
    return "0";
  }
};

const updateReadme = () => {
  const apiPct = getCoverage("api");
  const workerPct = getCoverage("worker");

  const readmePath = path.join(process.cwd(), "README.md");
  let content = fs.readFileSync(readmePath, "utf-8");

  // Helper to get color based on percentage
  const getColor = (pct: string) => {
    const p = Number.parseInt(pct, 10);
    if (p >= 95) {
      return "brightgreen";
    }
    if (p >= 80) {
      return "green";
    }
    if (p >= 60) {
      return "yellow";
    }
    return "red";
  };

  // Update Coverage Badges
  content = content.replace(
    /!\[Coverage API\]\(https:\/\/img\.shields\.io\/badge\/Coverage%20\(API\)-\d+%25-\w+\)/g,
    `![Coverage API](https://img.shields.io/badge/Coverage%20(API)-${apiPct}%25-${getColor(apiPct)})`,
  );
  content = content.replace(
    /!\[Coverage Worker\]\(https:\/\/img\.shields\.io\/badge\/Coverage%20\(Worker\)-\d+%25-\w+\)/g,
    `![Coverage Worker](https://img.shields.io/badge/Coverage%20(Worker)-${workerPct}%25-${getColor(workerPct)})`,
  );

  fs.writeFileSync(readmePath, content);
  // biome-ignore lint/suspicious/noConsole: appropriate for CI
  console.log(`✅ Updated badges - API: ${apiPct}%, Worker: ${workerPct}%`);
};

updateReadme();
