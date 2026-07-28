const fs = require("fs");
const path = require("path");

function processIncludes(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Главный файл не найден: ${filePath}`);
    return "";
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Очищаем неразрывные пробелы и нормализуем переносы
  content = content.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");

  if (filePath === "docs/index.md") {
    console.log("--- СОДЕРЖИМОЕ docs/index.md ---");
    console.log(content);
    console.log("---------------------------------");
  }

  // Регулярка для вытаскивания путей
  const includeRegex = /<!--\s*include:?\s*["'’`]?([^"'’`\s-->]+)["'’`]?\s*-->/gi;

  let matchCount = 0;
  content = content.replace(includeRegex, (match, rawIncludePath) => {
    matchCount++;
    const includePath = rawIncludePath.replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), includePath);

    if (fs.existsSync(fullPath)) {
      console.log(`[OK] Подставили файл: ${includePath}`);
      return processIncludes(fullPath);
    } else {
      console.warn(`[WARN] Файл не найден: ${includePath} (искали в: ${fullPath})`);
      return `<!-- [ERROR: File not found: ${includePath}] -->`;
    }
  });

  if (filePath === "docs/index.md") {
    console.log(`Найдено совпадений include: ${matchCount}`);
  }

  return content;
}

console.log("=== Старт сборки README.md ===");
const compiledContent = processIncludes("docs/index.md");
fs.writeFileSync("README.md", compiledContent, "utf8");
console.log("=== README.md успешно обновлен ===");
