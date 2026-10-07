const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://annachazova985-oss.github.io/Portfolio/';
const IMAGES_DIR = 'images';
const OUTPUT_FILE = 'sitemap.xml';
const TITLES_FILE = 'scripts/image-titles.json';

// Файлы, которые НЕ нужно добавлять в карту сайта (иконки для браузеров)
const EXCLUDE = new Set([
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
]);

// Загружаем красивые подписи, если файл есть
let customTitles = {};
try {
  customTitles = JSON.parse(fs.readFileSync(TITLES_FILE, 'utf-8'));
} catch (e) {
  console.warn('Файл с подписями не найден, используем стандартные.');
}

// Читаем папку с картинками
const files = fs.readdirSync(IMAGES_DIR)
  .filter(file => !EXCLUDE.has(file))
  .filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
  .sort();

// Формируем записи для карты сайта
const imageEntries = files.map(file => {
  const title = customTitles[file] || 'Фото проекта — студия «Среда»';
  const loc = SITE_URL + IMAGES_DIR + '/' + file;
  return `    <image:image>
      <image:loc>${loc}</image:loc>
      <image:title>${title}</image:title>
    </image:image>`;
}).join('\n\n');

// Дата — сегодня
const today = new Date().toISOString().split('T')[0];

// Собираем итоговый XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>

${imageEntries}

  </url>
</urlset>
`;

fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');
console.log(`✅ Sitemap сгенерирован: ${files.length} картинок.`);