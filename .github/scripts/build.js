const fs = require("fs");
const path = require("path");

function processIncludes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Файл не найден: ${filePath}`);
    return "";
  }

  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/\r\n/g, "\n");

  const commentRegex = /<!--[\s\S]*?include[\s\S]*?-->/gi;

  // Заменяем инклюды внутри текущего файла
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
      // Рекурсивно читаем вложенный файл и возвращаем его содержимое
      return fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath}`);
      return `<!-- [ERROR: File not found: ${includePath}] -->`;
    }
  });
}

console.log("=== Старт сборки README.md ===");

// 1. Читаем чистый index.md (вместе со вступлением)
let compiledBody = fs.readFileSync("docs/index.md", "utf8").replace(/\r\n/g, "\n");

// 2. Раскрываем все инклюды внутри него
compiledBody = processIncludes("docs/index.md");

// 3. Добавляем нашу плашку наверх
const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

const finalContent = noticeBanner + compiledBody;
fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно обновлен с плашкой и началом! ===");
