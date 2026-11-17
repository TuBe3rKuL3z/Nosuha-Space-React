const express = require('express');
const path = require('node:path');
const { coatiApi } = require('./coati-api');
const { createAuth } = require('./auth');
const { readFile } = require('node:fs/promises');
const { renderClientHtml } = require('./client-html');
const { diaryApi } = require('./diary-api');

const resourceDirectory = path.resolve(__dirname, '../../Resource');
const clientDirectory = path.resolve(__dirname, '../Client/dist');

function createApp({ db, authKey }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  async function sendPage(req, res, status = 200, page = {}) {
    const html = await readFile(path.join(clientDirectory, 'index.html'), 'utf8');
    res.status(status).set('Cache-Control', 'no-store').type('html').send(renderClientHtml(html, req.user, page));
  }

  const auth = createAuth(db, authKey, sendPage);
  app.use('/account', auth.router);
  app.use('/api/diary', auth.authenticate, auth.requireAdmin, diaryApi(db));
  app.use('/diary', auth.authenticate, auth.requireAdmin);
  app.get(['/diary', '/diary/index', '/diary/create', '/diary/edit/:id', '/diary/delete/:id'], (req, res) => {
    if (req.params.id !== undefined) {
      const id = Number(req.params.id);
      if (!/^\d+$/.test(req.params.id) || !Number.isInteger(id) || id < 1 || id > 2147483647) {
        return sendPage(req, res, 400, { View: 'error', ErrorMessage: 'Некорректный ID записи.' });
      }
      if (!db.prepare('SELECT Id FROM DiaryEntries WHERE Id=?').get(id)) {
        return sendPage(req, res, 404, { View: 'error', ErrorMessage: 'Запись дневника не найдена.' });
      }
    }
    return sendPage(req, res);
  });
  app.use('/api/coati', coatiApi(db));
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Маршрут API не найден.' });
  });

  // Keep the original media URLs while serving files from the root Resource folder.
  app.use('/images', express.static(resourceDirectory, { index: false, fallthrough: false }));
  app.use('/videos', express.static(resourceDirectory, { index: false, fallthrough: false }));
  app.use(express.static(clientDirectory, { index: false }));

  app.post('/Zoo/Donate', (req, res) => res.redirect('https://pay.cloudtips.ru/p/cceba1a9'));

  app.get(['/', '/stav-zoo', '/stav-zoo/coati'], auth.authenticate, (req, res) => sendPage(req, res));

  app.use((req, res) => {
    res.status(404).type('text').send('Страница не найдена.');
  });

  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    const message = error.type === 'entity.parse.failed'
      ? 'Некорректный JSON в теле запроса.'
      : status === 401 ? error.message
      : status === 404 ? 'Файл не найден.' : 'Внутренняя ошибка сервера.';
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return res.status(status).json({ error: message });
    }
    res.status(status).type('text').send(message);
  });

  return app;
}

module.exports = { createApp };
