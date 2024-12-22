const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Путь к сгенерированным HTML-файлам
const distDir = path.resolve(__dirname, 'dist');

// Находим все HTML-файлы в папке `dist`
const htmlFiles = fs.readdirSync(distDir).filter((file) => file.endsWith('.html'));

// Создаём массив HtmlWebpackPlugin для каждого HTML-файла
const HtmlWebpackPlugins = htmlFiles.map((file) => {
  return new HtmlWebpackPlugin({
    template: path.join(distDir, file), // Путь к существующему HTML
    filename: file,                    // Название выходного файла
    minify: false,                     // Отключаем минификацию
  });
});

module.exports = {
  entry: './src/scripts/main.js', // Основной JS-файл
  output: {
   
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'], // Для SCSS
      },
      {
        test: /\.json$/,
        type: 'asset/resource', // Для JSON
      },
    ],
  },
  plugins: [
    ...HtmlWebpackPlugins, // Подключаем плагины для всех HTML
  ],
  devServer: {
    static: distDir, // Папка для сервера разработки
  },
};
