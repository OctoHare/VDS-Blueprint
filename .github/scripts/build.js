const fs = require("fs");
const path = require("path");

function processIncludes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Файл не найден: ${filePath}`);
    return "";
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Очистка переносов строк
  content = content.replace(/\r\n/g, "\n");

  // 1. Находим ЛЮБОЙ комментарий, где есть слово include
  const commentRegex = /<!--[\s\S]*?include[\s\S]*?-->/gi;

  let matchCount = 0;
  content = content.replace(commentRegex, (fullComment) => {
    // 2. Достаем из этого комментария сам путь (все символы кроме пробелов, кавычек и стрелок)
    const pathMatch = fullComment.match(/include\s*:?\s*["'’`]?([^\s"':’`>]+)/i);

    if (!pathMatch || !pathMatch[1]) {
      return fullComment; // Если это был не наш инклюд, оставляем как есть
    }

    matchCount++;
    const rawPath = pathMatch[1];
    const includePath = rawPath.replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили: ${includePath}`);
      return processIncludes(fullPath);
    } else {
      console.warn(`[WARN] Файл не найден по пути: ${includePath} (абсолютный: ${fullPath})`);
      return `<!-- [ERROR: File not found: ${includePath}] -->`;
    }
  });

  if (filePath === "docs/index.md") {
    console.log(`Успешно обработано инклюдов: ${matchCount}`);
  }

  return content;
}

console.log("=== Старт сборки README.md ===");
const compiledContent = processIncludes("docs/index.md");
fs.writeFileSync("README.md", compiledContent, "utf8");
console.log("=== README.md успешно обновлен ===");
