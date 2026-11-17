const { createApp } = require('./app');
const { openDatabase } = require('./database');
const { loadAuthKey } = require('./auth');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть целым числом от 1 до 65535.');
}

const authKey = loadAuthKey();
const db = openDatabase();
const server = createApp({ db, authKey }).listen(port, () => {
  console.log(`Сайт доступен по адресу http://localhost:${port}/stav-zoo`);
});

server.on('error', (error) => {
  console.error('Не удалось запустить сервер:', error);
  db.close();
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close((error) => {
    db.close();
    if (error) {
      console.error('Не удалось остановить сервер:', error);
      process.exitCode = 1;
    }
  }));
}
