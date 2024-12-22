const fs = require('fs');
const path = require('path');

// Получаем имя компонента из аргумента командной строки
const componentName = process.argv[2];

if (!componentName) {
  console.log('Ошибка: название компонента не указано.');
  process.exit(1);
}

const componentPath = path.resolve(__dirname, 'src', 'components', componentName);

if (fs.existsSync(componentPath)) {
  console.log(`Компонент ${componentName} уже существует.`);
  return;
}
// Путь к main.scss
const mainScssPath = path.resolve(__dirname, 'src', 'styles', 'main.scss');

function addStylesToMainScss(componentName) {
  const importStatement = `@import "../components/${componentName}/${componentName}.scss";\n`;

  // Проверяем, есть ли уже импорт стилей для компонента
  const currentContent = fs.existsSync(mainScssPath) ? fs.readFileSync(mainScssPath, 'utf8') : '';
  if (!currentContent.includes(importStatement)) {
    fs.appendFileSync(mainScssPath, importStatement);
    console.log(`Стили для компонента ${componentName} добавлены в main.scss.`);
  } else {
    console.log(`Стили для компонента ${componentName} уже подключены.`);
  }
}

module.exports = { addStylesToMainScss };
// Создаём директорию для компонента
fs.mkdirSync(componentPath, { recursive: true });

// Шаблон SCSS
const scssContent = `// Стили для блока ${componentName}`;
fs.writeFileSync(path.join(componentPath, `${componentName}.scss`), scssContent);
addStylesToMainScss(componentName);
// Шаблон JS
const jsContent = `// Скрипты для блока ${componentName}`;
fs.writeFileSync(path.join(componentPath, `${componentName}.js`), jsContent);

// Шаблон JSON
const jsonContent = `{ "block": "${componentName}" }`;
fs.writeFileSync(path.join(componentPath, `${componentName}.json`), jsonContent);

// Шаблон Slim (если нужно)
const slimContent = `div.${componentName}\n  h2 ${componentName}`;
fs.writeFileSync(path.join(componentPath, `${componentName}.slim`), slimContent);

console.log(`Компонент ${componentName} успешно создан!`);