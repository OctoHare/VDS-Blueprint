const fs = require("fs");
const path = require("path");

function processIncludes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Файл не найден: ${filePath}`);
    return "";
  }

  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/\r\n/g, "\n");

  // Отладка: покажем начало файла
  if (filePath === "docs/index.md") {
    console.log("=== НАЧАЛО ТЕКСТА ИЗ index.md ===");
    console.log(content.substring(0, 300));
    console.log("==================================");
  }

  const commentRegex = /<!--[\s\S]*?include[\s\S]*?-->/gi;

  return content.replace(commentRegex, (fullComment) => {
    const pathMatch = fullComment.match(/include\s*:?\s*["'’`]?([^\s"':’`>]+)/i);

    if (!pathMatch || !pathMatch[1]) {
      return fullComment;
    }

    const rawPath = pathMatch[1];
    const includePath = rawPath.replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили: ${includePath}`);
      return processIncludes(fullPath);
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath}`);
      return `<!-- [ERROR: File not found: ${includePath}] -->`;
    }
  });
}

console.log("=== Старт сборки README.md ===");
const compiledBody = processIncludes("docs/index.md");

const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

const finalContent = noticeBanner + compiledBody;
fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно обновлен с плашкой ===");
