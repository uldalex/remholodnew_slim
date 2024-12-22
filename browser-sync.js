const browserSync = require('browser-sync').create();

browserSync.init({
  server: 'dist',         // Указываем папку, откуда сервер будет обслуживать файлы
  files: 'dist/**/*',     // Слежение за всеми изменениями в папке dist
  open: true,            // Не открывать браузер автоматически
  port: 3000,             // Порт для сервера
  middleware: [
    function(req, res, next) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
      next();
    }
  ]
});