const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть целым числом от 1 до 65535.');
}

const server = createApp().listen(port, () => {
  console.log(`Сайт доступен по адресу http://localhost:${port}/stav-zoo`);
});

server.on('error', (error) => {
  console.error('Не удалось запустить сервер:', error);
  process.exitCode = 1;
});
