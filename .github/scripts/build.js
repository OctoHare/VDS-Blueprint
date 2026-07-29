const fs = require("fs");
const path = require("path");

console.log("=== Старт сборки README.md ===");

const indexPath = path.resolve(process.cwd(), "docs/index.md");
if (!fs.existsSync(indexPath)) {
  console.error("[ERROR] Файл docs/index.md не найден!");
  process.exit(1);
}

const rawIndex = fs.readFileSync(indexPath, "utf8");
const lines = rawIndex.replace(/\r\n/g, "\n").split("\n");

let outputLines = [];

for (let line of lines) {
  const cleanLine = line.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");
  
  // Идем строго по шаблону: ловим путь между include: и дефисами закрытия комментария -->
  const match = cleanLine.match(/include\s*:\s*([^>\s]+)/i);

  if (match) {
    let includePath = match[1].replace(/["'’`]/g, "").trim();
    includePath = includePath.replace(/\\/g, "/");
    
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили файл: ${includePath}`);
      const includedContent = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
      outputLines.push(includedContent);
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath} (путь: ${fullPath})`);
      outputLines.push(`<!-- [ERROR: File not found: ${includePath}] -->`);
    }
  } else {
    outputLines.push(line);
  }
}

const compiledBody = outputLines.join("\n");

const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

const finalContent = noticeBanner + compiledBody;

fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно собран со всеми вставками! ===");
