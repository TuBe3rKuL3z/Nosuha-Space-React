const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, createCipheriv } = require('node:crypto');
const { openDatabase } = require('../database');
const { createApp } = require('../app');

async function fixture(run) {
  const db = openDatabase(':memory:');
  const authKey = randomBytes(32);
  const server = createApp({ db, authKey }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://localhost:${server.address().port}`;
  try {
    const login = await fetch(base + '/account/login', { method: 'POST', redirect: 'manual', body: new URLSearchParams({ username: 'admin', password: 'admin2026' }) });
    assert.equal(login.status, 302);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const request = (url, options = {}) => fetch(base + url, { redirect: 'manual', ...options, headers: { Cookie: cookie, ...options.headers } });
    await run({ db, request, base, authKey });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
}
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const entry = { CoatiId: 1, EventDate: '2026-10-05T23:59:59.9999999', EventType: 'Уборка', Title: 'Проверка записи', Description: 'Описание\nс новой строкой', Author: 'Тестовый сотрудник' };

test('diary CRUD preserves fields and original success messages', async () => fixture(async ({ db, request }) => {
  const response = await request('/api/diary', json('POST', { ...entry, CoatiId: 0 }));
  assert.equal(response.status, 201);
  const { Id, SuccessMessage } = await response.json();
  assert.equal(SuccessMessage, 'Событие «Проверка записи» успешно добавлено в журнал!');
  assert.equal(response.headers.get('location'), `/api/diary/${Id}`);
  const saved = await (await request(`/api/diary/${Id}`)).json();
  assert.deepEqual(saved, { ...entry, Id, CoatiId: 1, EventDate: '2026-10-05 23:59:59.9999999' });
  const updated = { ...saved, EventType: 'Потомство', Title: 'Изменённая запись', Author: 'Другой сотрудник' };
  const edit = await request(`/api/diary/${Id}`, json('PUT', updated));
  assert.equal(edit.status, 200);
  assert.equal((await edit.json()).SuccessMessage, `Событие #${Id} успешно обновлено!`);
  assert.deepEqual(await (await request(`/api/diary/${Id}`)).json(), updated);
  const deleted = await request(`/api/diary/${Id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.equal((await deleted.json()).SuccessMessage, `Событие #${Id} удалено из журнала наблюдений.`);
  assert.equal((await request(`/api/diary/${Id}`)).status, 404);
  assert.equal(db.prepare('SELECT count(*) AS count FROM DiaryEntries').get().count, 4);
}));

test('category, inclusive dates, employee, sorting and unfiltered distinct employees match the source', async () => fixture(async ({ db, request }) => {
  for (const EventDate of ['2026-10-04T23:59:59.9999999', '2026-10-05T00:00:00', '2026-10-05T23:59:59.9999999', '2026-10-06T00:00:00']) {
    assert.equal((await request('/api/diary', json('POST', { ...entry, EventDate }))).status, 201);
  }
  const filter = new URLSearchParams({ filterType: 'Уборка', dateFrom: '2026-10-05', dateTo: '2026-10-05', author: entry.Author });
  const response = await request(`/api/diary?${filter}`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.Entries.map(row => row.EventDate), ['2026-10-05 23:59:59.9999999', '2026-10-05 00:00:00']);
  assert.deepEqual(data.Authors, ['Ветврач Елена', 'Зоолог Мария', 'Кипер Алексей', 'Тестовый сотрудник']);
  const all = await (await request('/api/diary?filterType=Все&author=Все')).json();
  assert.equal(all.Entries.length, 8);
  assert.equal(all.Entries[0].EventDate, '2026-10-06 00:00:00');
  const empty = await (await request('/api/diary?filterType=НетТакойКатегории')).json();
  assert.deepEqual(empty.Entries, []);
  assert.deepEqual(empty.Authors, data.Authors);
  assert.deepEqual((await (await request('/api/diary?dateFrom=2026-10-06&dateTo=2026-10-05')).json()).Entries, []);
  db.prepare('INSERT INTO DiaryEntries (CoatiId,EventDate,EventType,Title,Description,Author) VALUES (?,?,?,?,?,?)').run(1, '2026-01-01 00:00:00', 'Кормление', 'Без автора', 'Описание', '');
  assert.deepEqual((await (await request('/api/diary')).json()).Authors, data.Authors);
}));

test('all diary operations enforce Admin authorization and return explicit 401/403', async () => fixture(async ({ request, base, authKey }) => {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', authKey, nonce);
  const payload = Buffer.concat([cipher.update(JSON.stringify({ user: { Username: 'keeper', FullName: 'Кипер', Role: 'Keeper', Position: 'Кипер' }, issued: Date.now(), expires: Date.now() + 10000 })), cipher.final()]);
  const forbiddenCookie = '.AspNetCore.Cookies=' + Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString('base64url');
  for (const [method, route] of [['GET', '/api/diary'], ['GET', '/api/diary/1'], ['POST', '/api/diary'], ['PUT', '/api/diary/1'], ['DELETE', '/api/diary/1']]) {
    const guest = await fetch(base + route, { method });
    assert.equal(guest.status, 401);
    assert.equal((await guest.json()).error, 'Необходима авторизация сотрудника.');
    const forbidden = await request(route, { method, headers: { Cookie: forbiddenCookie } });
    assert.equal(forbidden.status, 403);
  }
  const guestPage = await fetch(base + '/diary/create');
  assert.equal(guestPage.status, 401);
  assert.ok((await guestPage.text()).includes('"ReturnUrl":"/diary/create"'));
}));

test('validation, missing records and database errors never silently change data', async () => fixture(async ({ db, request }) => {
  const invalid = await request('/api/diary', json('POST', { ...entry, Title: ' ', Description: '', EventDate: '2026-02-30T12:00' }));
  assert.equal(invalid.status, 400);
  const errors = (await invalid.json()).errors;
  assert.deepEqual(errors.Title, ['The Title field is required.', 'Укажите заголовок события.']);
  assert.deepEqual(errors.Description, ['The Description field is required.', 'Укажите описание события.']);
  assert.ok(errors.EventDate);
  for (const query of ['dateFrom=2026-02-30', 'dateTo=wrong', 'dateTo=9999-12-31', 'author=x&author=y']) {
    assert.equal((await request('/api/diary?' + query)).status, 400);
  }
  assert.equal((await request('/api/diary/abc')).status, 400);
  assert.equal((await request('/api/diary/999999')).status, 404);
  assert.equal((await request('/diary/edit/999999')).status, 404);
  assert.equal((await request('/api/diary/999999', json('PUT', entry))).status, 404);
  assert.equal((await request('/api/diary/999999', { method: 'DELETE' })).status, 404);
  assert.equal((await request('/api/diary/1', json('PUT', { ...entry, Id: 2 }))).status, 400);
  assert.equal(db.prepare('SELECT count(*) AS count FROM DiaryEntries').get().count, 4);
  const injection = await (await request('/api/diary?author=' + encodeURIComponent("' OR 1=1 --"))).json();
  assert.deepEqual(injection.Entries, []);
  db.exec('DROP TABLE DiaryEntries');
  assert.equal((await request('/api/diary')).status, 500);
}));
