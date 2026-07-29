const fs = require("fs");
const path = require("path");

console.log("=== Старт сборки README.md ===");

// 1. Читаем исходный index.md целиком
let content = fs.readFileSync("docs/index.md", "utf8").replace(/\r\n/g, "\n");

// 2. Всеядный поиск: ищет любой комментарий со словом include и достает оттуда путь
const commentRegex = /<!--[\s\S]*?include[\s\S]*?-->/gi;

content = content.replace(commentRegex, (fullComment) => {
  // Достаем путь из комментария (игнорируем лишние пробелы и кавычки)
  const pathMatch = fullComment.match(/include\s*:?\s*["'’`]?([^\s"':’`>]+)/i);

  if (!pathMatch || !pathMatch[1]) {
    return fullComment; // Если это не наш инклюд (например, шапка), оставляем как есть
  }

  const rawPath = pathMatch[1];
  const includePath = rawPath.replace(/\\/g, "/");
  const fullPath = path.resolve(process.cwd(), includePath);

  if (fs.existsSync(fullPath)) {
    console.log(`[OK] Подставили файл: ${includePath}`);
    return fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
  } else {
    console.warn(`[WARN] Файл не найден: ${includePath}`);
    return `<!-- [ERROR: File not found: ${includePath}] -->`;
  }
});

// 3. Формируем нашу плашку для репозитория
const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

// 4. Склеиваем плашку и обработанный текст
const finalContent = noticeBanner + content;

fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно собран со вставками! ===");
