const fs = require("fs");
const path = require("path");

console.log("=== Старт сборки README.md (построчно) ===");

if (!fs.existsSync("docs/index.md")) {
  console.error("[ERROR] Файл docs/index.md не найден!");
  process.exit(1);
}

const rawIndex = fs.readFileSync("docs/index.md", "utf8");
const lines = rawIndex.replace(/\r\n/g, "\n").split("\n");

let outputLines = [];

for (let line of lines) {
  // Убираем лишние пробелы для проверки
  const trimmed = line.trim();
  
  // Ищем строку вида <!-- include: путь/к/файлу.md -->
  // Поддерживаем разные варианты написания с пробелами
  const match = trimmed.match(/^<!--\s*include:\s*([^\s-->]+)\s*-->$/i);

  if (match) {
    const includePath = match[1].replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили файл: ${includePath}`);
      const includedContent = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
      outputLines.push(includedContent);
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath}`);
      outputLines.push(`<!-- [ERROR: File not found: ${includePath}] -->`);
    }
  } else {
    // Обычная строка из index.md — оставляем как есть
    outputLines.push(line);
  }
}

// Собираем всё тело документа обратно
const compiledBody = outputLines.join("\n");

// Добавляем плашку наверх
const noticeBanner = `<!-- 
Данный документ из репозитория
https://github.com/OctoHare/VDS-Blueprint
-->\n\n`;

const finalContent = noticeBanner + compiledBody;

fs.writeFileSync("README.md", finalContent, "utf8");
console.log("=== README.md успешно собран построчно! ===");
