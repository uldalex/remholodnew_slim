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

function preprocessTemplate(templatePath) {
  const templateName = path.basename(templatePath, '.slim');
  const outputHtmlPath = path.join(outputDir, `${templateName}.html`);
  const intermediateSlimPath = path.join(outputDir, `${templateName}.intermediate.slim`);

  const includedComponents = getIncludedComponents(templatePath);
  console.log(`Обработка шаблона: ${templateName}`);
  console.log('Найдены компоненты:', includedComponents);

  let templateSlim = fs.readFileSync(templatePath, 'utf8');

  includedComponents.forEach((componentName) => {
    const includeRegex = new RegExp(`include \\./components/${componentName}/${componentName}\\.slim`, 'g');
    const componentSlimPath = path.join(componentsDir, componentName, `${componentName}.slim`);

    if (!fs.existsSync(componentSlimPath)) {
      console.error(`Компонент "${componentName}" не найден: ${componentSlimPath}`);
      return;
    }

    const componentSlimContent = fs.readFileSync(componentSlimPath, 'utf8');
    templateSlim = templateSlim.replace(includeRegex, componentSlimContent);
  });

  fs.writeFileSync(intermediateSlimPath, templateSlim, 'utf8');
  console.log(`Промежуточный файл: ${intermediateSlimPath}`);

  try {
    const command = `slimrb  --require slim/include ${intermediateSlimPath}`;
    let renderedHtml = execSync(command, { stdio: 'pipe' }).toString();
    renderedHtml = beautify(renderedHtml, {
      indent_size: 2,
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

templateFiles.forEach((file) => {
  preprocessTemplate(file);
});

console.log('Сборка завершена.');