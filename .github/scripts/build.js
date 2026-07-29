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

  // Находим и заменяем инклюды
  const commentRegex = /<!--[\s\S]*?include[\s\S]*?-->/gi;

  let matchCount = 0;
  content = content.replace(commentRegex, (fullComment) => {
    const pathMatch = fullComment.match(/include\s*:?\s*["'’`]?([^\s"':’`>]+)/i);

    if (!pathMatch || !pathMatch[1]) {
      return fullComment;
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

// 1. Собираем весь текст из index.md (вместе с тем, что было до первого инклюда)
const compiledBody = processIncludes("docs/index.md");

// 2. Формируем плашку для верхней части README.md
const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

// 3. Объединяем плашку и тело документа
const finalContent = noticeBanner + compiledBody;

fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно обновлен с плашкой ===");
