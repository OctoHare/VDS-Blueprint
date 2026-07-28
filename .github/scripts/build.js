const fs = require("fs");
const path = require("path");

function processIncludes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Файл не найден: ${filePath}`);
    return "";
  }

  let content = fs.readFileSync(filePath, "utf8");

  // 1. ЖЕСТКАЯ ОЧИСТКА: превращаем ВСЕ невидимые/неразрывные пробелы в обычные
  content = content.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");
  content = content.replace(/\r\n/g, "\n");

  // 2. Регулярка, которой вообще пофиг на то, какие пробелы вокруг пути
  // Ищет: <!-- [любые пробелы] include: [любые пробелы] путь [любые пробелы] -->
  const includeRegex = /<!--\s*include:\s*([^\s-->]+)\s*-->/gi;

  let matchCount = 0;
  content = content.replace(includeRegex, (match, rawIncludePath) => {
    matchCount++;
    const includePath = rawIncludePath.trim().replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили: ${includePath}`);
      return processIncludes(fullPath); // Рекурсия на случай вложенных файлов
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath}`);
      return `<!-- [ERROR: File not found: ${includePath}] -->`;
    }
  });

  if (filePath === "docs/index.md") {
    console.log(`Найдено и заменено инклюдов: ${matchCount}`);
  }

  return content;
}

console.log("=== Старт сборки README.md ===");
const compiledContent = processIncludes("docs/index.md");
fs.writeFileSync("README.md", compiledContent, "utf8");
console.log("=== README.md успешно обновлен ===");
