const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { randomBytes, createCipheriv } = require('node:crypto');
const { openDatabase } = require('../database');
const { createApp } = require('../app');
const { loadAuthKey } = require('../auth');

async function fixture(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'coati-server-'));
  const filename = path.join(directory, 'coati.db');
  const db = openDatabase(filename);
  const authKey = loadAuthKey(path.join(directory, '.auth-key'));
  const server = createApp({ db, authKey }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const request = (url, options) => fetch(`http://localhost:${server.address().port}${url}`, { redirect: 'manual', ...options });
  try {
    await run({ db, filename, directory, request, authKey });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
    rmSync(directory, { recursive: true });
  }
}

const form = fields => ({ method: 'POST', body: new URLSearchParams(fields) });
const login = { username: 'admin', password: 'admin2026' };

test('original tables and seeds persist without reinserting deleted rows', async () => fixture(async ({ db, filename, directory, authKey }) => {
  for (const [table, count] of Object.entries({ Coatis: 1, DiaryEntries: 4, Donations: 2, StaffUsers: 1 })) {
    assert.equal(db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count, count);
  }
  assert.equal(db.prepare('SELECT BirthDate FROM Coatis').get().BirthDate, '2021-05-14');
  assert.equal(db.prepare('SELECT Amount FROM Donations WHERE Id=2').get().Amount, '1000');
  db.exec("UPDATE Coatis SET Name='Проверка сохранения'; DELETE FROM DiaryEntries WHERE Id=1");
  const reopened = openDatabase(filename);
  try {
    assert.equal(reopened.prepare('SELECT Name FROM Coatis').get().Name, 'Проверка сохранения');
    assert.equal(reopened.prepare('SELECT count(*) AS count FROM DiaryEntries').get().count, 3);
  } finally { reopened.close(); }
  assert.deepEqual(loadAuthKey(path.join(directory, '.auth-key')), authKey);
  const invalidKey = path.join(directory, 'invalid-key');
  writeFileSync(invalidKey, 'invalid');
  assert.throws(() => loadAuthKey(invalidKey), /32 байта/);
  const corrupt = path.join(directory, 'corrupt.db');
  writeFileSync(corrupt, 'not a SQLite database');
  assert.throws(() => openDatabase(corrupt), /not a database/);
}));

test('original text APIs: content type, report format, dates, ordering and empty database', async () => fixture(async ({ db, request }) => {
  const response = await request('/api/coati');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/plain; charset=utf-8$/);
  const text = await response.text();
  assert.equal(await (await request('/api/coati/info')).text(), text);
  assert.ok(text.startsWith('==================================================\r\nИНФОРМАЦИОННАЯ СВОДКА ЗООПАРКА: НОСУХА ХАХАТУХА\r\n'));
  assert.ok(text.endsWith('==================================================\r\n'));
  assert.ok(text.includes('Дата рождения:      14.05.2021\r\n'));
  assert.ok(text.includes('Кличка:             Хахатуха\r\n'));
  const diary = await (await request('/api/coati/diary')).text();
  assert.ok(diary.includes('Всего записей в журнале: 4\r\n\r\nЗапись #1 от 05.10.2026 11:00\r\n'));
  assert.ok(diary.includes('Запись #4 от 20.09.2026 10:30\r\n'));
  const donations = await (await request('/api/coati/donations')).text();
  assert.ok(donations.includes('Общая сумма сборов: 1\u00a0500 рублей\r\nКоличество взносов: 2\r\n'));
  assert.ok(donations.indexOf('Студенты СКФУ') < donations.indexOf('Семья Кузнецовых'));
  assert.ok(donations.includes('Пожелание: «На радость пушистому любопытному носу!»\r\n'));
  const status = await (await request('/api/coati/status')).text();
  assert.ok(status.includes('Температура в вольере:  +24.5 °C\n'));
  assert.ok(!status.includes('\r'));
  assert.ok(!status.endsWith('\n'));
  db.exec('DELETE FROM Coatis; DELETE FROM DiaryEntries; DELETE FROM Donations');
  assert.equal((await request('/api/coati/info')).status, 404);
  assert.equal(await (await request('/api/coati')).text(), 'Данные о носухе в базе данных пока отсутствуют.');
  assert.equal(await (await request('/api/coati/diary')).text(), 'В дневнике наблюдений пока нет зафиксированных событий.');
  assert.ok((await (await request('/api/coati/donations')).text()).includes('Общая сумма сборов: 0 рублей'));
  assert.equal((await request('/api/unknown')).status, 404);
}));

test('login validation, original redirects, cookie properties, logout and access control', async () => fixture(async ({ db, request, authKey }) => {
  const page = await request('/account/login?returnUrl=%22%3E%3Cscript%3E');
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes('action="/account/login"'));
  assert.ok(html.includes('&quot;&gt;&lt;script&gt;'));
  assert.equal((await request('/account/login', form({}))).status, 400);
  const invalid = await request('/account/login', form({ username: 'admin', password: 'wrong' }));
  assert.equal(invalid.status, 401);
  assert.ok((await invalid.text()).includes('Неверный логин или пароль администратора.'));
  assert.equal((await request('/account/login', form({ username: "' OR 1=1 --", password: 'x' }))).status, 401);
  db.exec("UPDATE StaffUsers SET Role='Keeper'");
  assert.equal((await request('/account/login', form(login))).status, 401);
  db.exec("UPDATE StaffUsers SET Role='Admin'");
  const response = await request('/account/login', form({ ...login, returnUrl: '/diary/edit/1' }));
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/diary/edit/1');
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  const expires = Date.parse(setCookie.match(/Expires=([^;]+)/)[1]);
  assert.ok(Math.abs(expires - Date.now() - 8 * 60 * 60 * 1000) < 2000);
  const cookie = setCookie.split(';')[0];
  const headers = { Cookie: cookie };
  assert.equal((await request('/account/login', { headers })).headers.get('location'), '/diary');
  assert.equal((await request('/diary')).status, 401);
  // The diary CRUD routes are intentionally implemented in stage 5.
  assert.equal((await request('/diary', { headers })).status, 404);
  assert.equal((await request('/account/denied')).status, 403);
  const logout = await request('/account/logout', { headers });
  assert.equal(logout.headers.get('location'), '/stav-zoo/coati');
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  for (const returnUrl of ['https://example.com', '//example.com', '/\\example.com', '/\nexample.com']) {
    assert.equal((await request('/account/login', form({ ...login, returnUrl }))).headers.get('location'), '/diary');
  }
  assert.equal((await request('/account/login', form({ ...login, returnUrl: '~/diary' }))).headers.get('location'), '/diary');
  function ticketCookie(role, issued, expires) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', authKey, nonce);
    const payload = Buffer.concat([cipher.update(JSON.stringify({ user: { Username: 'keeper', FullName: 'Кипер', Role: role, Position: 'Кипер' }, issued, expires })), cipher.final()]);
    return '.AspNetCore.Cookies=' + Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString('base64url');
  }
  const keeperCookie = ticketCookie('Keeper', Date.now(), Date.now() + 10000);
  assert.equal((await request('/diary', { headers: { Cookie: keeperCookie } })).status, 403);
  const oldCookie = ticketCookie('Admin', Date.now() - 5 * 60 * 60 * 1000, Date.now() + 3 * 60 * 60 * 1000);
  assert.ok((await request('/account/login', { headers: { Cookie: oldCookie } })).headers.get('set-cookie'));
  const expiredCookie = ticketCookie('Admin', Date.now() - 10000, Date.now() - 1);
  assert.equal((await request('/account/login', { headers: { Cookie: expiredCookie } })).status, 401);
  const tampered = cookie.slice(0, -8) + 'AAAAAAAA';
  assert.equal((await request('/account/login', { headers: { Cookie: tampered } })).status, 401);
}));

test('malformed requests, damaged cookies and database failures have explicit error statuses', async () => fixture(async ({ db, request }) => {
  const response = await request('/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal(await response.text(), 'Некорректный JSON в теле запроса.');
  assert.equal((await request('/account/login', { headers: { Cookie: '.AspNetCore.Cookies=broken' } })).status, 401);
  db.exec('DROP TABLE Coatis');
  const failed = await request('/api/coati/info');
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: 'Внутренняя ошибка сервера.' });
}));
