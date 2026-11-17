const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { createApp } = require('../app');
const { openDatabase } = require('../database');
const { renderClientHtml } = require('../client-html');

test('React reads the existing text API and reflects database changes without seed substitutes', async t => {
  const { getPublicData, parseInfo, parseDiary } = await import('../../Client/src/api.js');
  const db = openDatabase(':memory:');
  const server = createApp({ db, authKey: randomBytes(32) }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const fetchOriginal = globalThis.fetch;
  const base = `http://localhost:${server.address().port}`;
  t.mock.method(globalThis, 'fetch', (url, options) => fetchOriginal(new URL(url, base), options));
  try {
    const data = await getPublicData();
    assert.equal(data.coati.Name, 'Хахатуха');
    assert.equal(data.coati.BirthDate, '14.05.2021');
    assert.equal(data.entries.length, 4);
    assert.equal(data.entries[0].Author, 'Зоолог Мария');
    assert.equal(data.entries[3].EventDate, '20.09.2026 10:30');
    db.prepare('UPDATE Coatis SET Name=?, Biography=?').run('Изменённое имя', 'История\nс продолжением');
    db.prepare('UPDATE DiaryEntries SET Description=? WHERE Id=4').run('Первая строка\nВторая строка');
    const changed = await getPublicData();
    assert.equal(changed.coati.Name, 'Изменённое имя');
    assert.equal(changed.coati.Biography, 'История\nс продолжением');
    assert.equal(changed.entries[0].Description, 'Первая строка\nВторая строка');
    db.exec('DELETE FROM DiaryEntries');
    assert.deepEqual((await getPublicData()).entries, []);
    db.exec('DELETE FROM Coatis');
    await assert.rejects(getPublicData(), /HTTP 404.*Данные о носухе/);
    assert.throws(() => parseInfo('<html>Ошибка прокси</html>'), /формат/);
    assert.throws(() => parseDiary('Повреждённый отчёт'), /формат/);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(getPublicData(controller.signal), { name: 'AbortError' });
  } finally {
    t.mock.restoreAll();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});

test('public HTML carries only the staff claims and escapes script boundaries', () => {
  const html = '<div id="root"></div><script id="staff-user" type="application/json">null</script>';
  const user = { Username: 'admin', FullName: '</script><script>alert(1)</script>', Role: 'Admin', Position: 'Администратор' };
  const rendered = renderClientHtml(html, user);
  assert.equal(rendered.split('</script>').length, 2);
  assert.deepEqual(JSON.parse(rendered.match(/type="application\/json">([^<]+)</)[1]), user);
  assert.equal(renderClientHtml(html, undefined), html);
  assert.throws(() => renderClientHtml('<html></html>', user), /отсутствует/);
});

test('donation preserves the original POST redirect and does not write a donation', async () => {
  const db = openDatabase(':memory:');
  const server = createApp({ db, authKey: randomBytes(32) }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://localhost:${server.address().port}/Zoo/Donate`, { method: 'POST', redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), 'https://pay.cloudtips.ru/p/cceba1a9');
    assert.equal(db.prepare('SELECT count(*) AS count FROM Donations').get().count, 2);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});
