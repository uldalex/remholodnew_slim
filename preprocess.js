const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const beautify = require('js-beautify').html;

const templateFiles = glob.sync('src/*.slim');
const componentsDir = path.resolve('src', 'components');
const outputDir = path.resolve('dist');
console.log('Найдены шаблоны:', templateFiles);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function getIncludedComponents(templateFilePath) {
  const content = fs.readFileSync(templateFilePath, 'utf8');
  const includeRegex = /include\s+\.\/components\/([\w-]+)\/([\w-]+)\.slim/g;

  let match;
  const components = [];
  while ((match = includeRegex.exec(content)) !== null) {
    components.push(match[1]);
  }
  return components;
}

function extractLocalData(templateContent) {
  const localDataRegex = /- local_data\s*=\s*(\{[\s\S]*?\})/;
  const match = localDataRegex.exec(templateContent);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (err) {
      console.error('Ошибка парсинга local_data:', err.message);
    }
  }
  return {};
}

function loadComponentData(componentName) {
  const jsonPath = path.join(componentsDir, componentName, `${componentName}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      console.error(`Ошибка чтения JSON для компонента "${componentName}":`, err.message);
    }
  }
  return {};
}

function preprocessTemplate(templatePath) {
  const templateName = path.basename(templatePath, '.slim');
  const outputHtmlPath = path.join(outputDir, `${templateName}.html`);
  const intermediateSlimPath = path.join(outputDir, `${templateName}.intermediate.slim`);

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const localData = extractLocalData(templateContent);
  const includedComponents = getIncludedComponents(templatePath);

  console.log(`Обработка шаблона: ${templateName}`);
  console.log('Найдены компоненты:', includedComponents);

  let templateSlim = templateContent;

  includedComponents.forEach((componentName) => {
    const includeRegex = new RegExp(`include \\./components/${componentName}/${componentName}\\.slim`, 'g');
    const componentSlimPath = path.join(componentsDir, componentName, `${componentName}.slim`);

    if (!fs.existsSync(componentSlimPath)) {
      console.error(`Компонент "${componentName}" не найден: ${componentSlimPath}`);
      return;
    }

    // Загрузка JSON-данных для компонента
    const componentData = loadComponentData(componentName);

    let componentSlimContent = fs.readFileSync(componentSlimPath, 'utf8');

    // Объединяем данные: локальные переопределяют JSON
    const mergedData = { ...componentData, ...localData };

    // Замена плейсхолдеров в компоненте
    Object.entries(mergedData).forEach(([key, value]) => {
      const placeholderRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      componentSlimContent = componentSlimContent.replace(placeholderRegex, value);
    });

    // Вставляем обработанный компонент в шаблон
    templateSlim = templateSlim.replace(includeRegex, componentSlimContent);
  });

  fs.writeFileSync(intermediateSlimPath, templateSlim, 'utf8');
  console.log(`Промежуточный файл: ${intermediateSlimPath}`);

  try {
    const command = `slimrb --require slim/include ${intermediateSlimPath}`;
    let renderedHtml = execSync(command, { stdio: 'pipe' }).toString();
    renderedHtml = beautify(renderedHtml, {
      indent_size: 1,
      preserve_newlines: true,
      wrap_line_length: 120,
    });

    if (!renderedHtml.includes('</html>')) {
      console.error(`Некорректный HTML: ${templateName}`);
      return;
    }

    fs.writeFileSync(outputHtmlPath, renderedHtml, 'utf8');
    console.log(`HTML сохранён: ${outputHtmlPath}`);
  } catch (error) {
    console.error(`Ошибка при рендеринге ${templateName}:`, error.stderr?.toString() || error.message);
  }
}

templateFiles.forEach(preprocessTemplate);

console.log('Сборка завершена.');