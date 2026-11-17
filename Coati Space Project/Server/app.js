const express = require('express');
const path = require('node:path');

const resourceDirectory = path.resolve(__dirname, '../../Resource');
const clientDirectory = path.resolve(__dirname, '../Client/dist');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // API handlers are registered here before the API 404 handler in stage 3.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Маршрут API не найден.' });
  });

  // Keep the original media URLs while serving files from the root Resource folder.
  app.use('/images', express.static(resourceDirectory, { index: false, fallthrough: false }));
  app.use('/videos', express.static(resourceDirectory, { index: false, fallthrough: false }));
  app.use(express.static(clientDirectory, { index: false }));

  app.get(['/', '/stav-zoo', '/stav-zoo/coati'], (req, res, next) => {
    res.sendFile(path.join(clientDirectory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });

  app.use((req, res) => {
    res.status(404).type('text').send('Страница не найдена.');
  });

  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    const message = error.type === 'entity.parse.failed'
      ? 'Некорректный JSON в теле запроса.'
      : status === 404 ? 'Файл не найден.' : 'Внутренняя ошибка сервера.';
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return res.status(status).json({ error: message });
    }
    res.status(status).type('text').send(message);
  });

  return app;
}

module.exports = { createApp };
