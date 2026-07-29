const fs = require("fs");
const path = require("path");

console.log("=== Старт сборки README.md ===");

// 1. Читаем исходный index.md целиком
let content = fs.readFileSync("docs/index.md", "utf8").replace(/\r\n/g, "\n");

// 2. Точечно ищем только те комментарии, в которых есть слово include
const includeRegex = /<!--\s*include:\s*([^\s-->]+)\s*-->/gi;

content = content.replace(includeRegex, (match, rawIncludePath) => {
  const includePath = rawIncludePath.replace(/\\/g, "/");
  const fullPath = path.resolve(process.cwd(), includePath);

  if (fs.existsSync(fullPath)) {
    console.log(`[OK] Подставили: ${includePath}`);
    // Возвращаем содержимое включаемого файла
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

// 4. Склеиваем плашку и обработанный текст index.md (сохраняя всё, что было до инклюдов)
const finalContent = noticeBanner + content;

fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно собран! ===");
