const fs = require("fs");
const path = require("path");

console.log("=== Старт диагностики сборки ===");
console.log("Текущая папка:", process.cwd());

const indexPath = path.resolve(process.cwd(), "docs/index.md");
if (!fs.existsSync(indexPath)) {
  console.error("[ERROR] Файл docs/index.md не найден по пути:", indexPath);
  process.exit(1);
}

const rawIndex = fs.readFileSync(indexPath, "utf8");
const lines = rawIndex.replace(/\r\n/g, "\n").split("\n");

let outputLines = [];

for (let line of lines) {
  // Выведем каждую строку для отладки
  if (line.includes("include")) {
    console.log("Нашли строку с include:", JSON.stringify(line));
  }

  // Очищаем пробелы
  const cleanLine = line.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");
  
  // Максимально лояльная регулярка: ищет include, двоеточие и любой путь до конца коммента
  const match = cleanLine.match(/include\s*:\s*([^>]+)/i);

  if (match) {
    // Вытаскиваем всё, что после двоеточия, и чистим от кавычек, пробелов и стрелочек -->
    let includePath = match[1].replace(/["'’`]/g, "").replace(/-->/g, "").trim();
    includePath = includePath.replace(/\\/g, "/");
    
    const fullPath = path.resolve(process.cwd(), includePath);
    console.log(`-> Пытаемся подключить: "${includePath}" (Полный путь: ${fullPath})`);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Успешно найдено!`);
      const includedContent = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
      outputLines.push(includedContent);
    } else {
      console.warn(`[WARN] Файл НЕ НАЙДЕН физически на диске!`);
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
console.log("=== Сборка завершена ===");
