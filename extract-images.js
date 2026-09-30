// extract-images.js
// Находит data:image/...;base64,... в index.html, сохраняет как отдельные файлы,
// заменяет в HTML на ссылки. Создаёт бэкап index.html.bak

const fs = require('fs');
const path = require('path');

const HTML_FILE = 'index.html';
const OUT_DIR = 'images';

if (!fs.existsSync(HTML_FILE)) {
  console.error(`❌ Не найден файл ${HTML_FILE} в текущей папке.`);
  console.error(`   Убедись, что запускаешь скрипт в C:\\Projects\\Portfolio`);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR);
  console.log(`📁 Создана папка ${OUT_DIR}/`);
}

// Бэкап
const backupName = HTML_FILE + '.bak';
if (!fs.existsSync(backupName)) {
  fs.copyFileSync(HTML_FILE, backupName);
  console.log(`💾 Создан бэкап: ${backupName}`);
} else {
  console.log(`💾 Бэкап уже существует: ${backupName} (не перезаписываю)`);
}

let html = fs.readFileSync(HTML_FILE, 'utf8');

// Ищем все data:image/<type>;base64,<данные>
const regex = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=\s]+)/g;

const seen = new Map(); // base64 -> имя файла, чтобы не дублировать одинаковые картинки
let counter = 0;
let replaced = 0;

html = html.replace(regex, (match, ext, base64Data) => {
  // SVG может быть многострочным — убираем пробелы/переносы
  const cleanData = base64Data.replace(/\s+/g, '');

  // Если такую картинку уже сохраняли — используем тот же файл
  if (seen.has(cleanData)) {
    replaced++;
    return `images/${seen.get(cleanData)}`;
  }

  counter++;
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = `img-${String(counter).padStart(2, '0')}.${safeExt}`;
  const filePath = path.join(OUT_DIR, fileName);

  fs.writeFileSync(filePath, Buffer.from(cleanData, 'base64'));
  const sizeKB = (cleanData.length * 0.75 / 1024).toFixed(1);
  console.log(`  ✅ images/${fileName}  (${sizeKB} КБ)`);

  seen.set(cleanData, fileName);
  replaced++;
  return `images/${fileName}`;
});

if (replaced === 0) {
  console.log(`\n🤷 Картинок в base64 не найдено. Файл не изменён.`);
  process.exit(0);
}

fs.writeFileSync(HTML_FILE, html, 'utf8');

console.log(`\n🎉 Готово!`);
console.log(`   Найдено и сохранено картинок: ${counter}`);
console.log(`   Заменено в HTML: ${replaced}`);
console.log(`   Файлы лежат в папке: ${OUT_DIR}/`);
console.log(`   Бэкап оригинала: ${backupName}`);
console.log(`\nОткрой index.html и проверь, что всё на месте.`);