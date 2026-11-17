const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { randomBytes, createHash } = require('node:crypto');
const { openDatabase } = require('../database');
const { createApp } = require('../app');

test('one Express server serves built React routes, assets, every Resource file and all APIs', async () => {
  const db = openDatabase(':memory:');
  const server = createApp({ db, authKey: randomBytes(32) }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://localhost:${server.address().port}`;
  const request = (route, options = {}) => fetch(base + route, { redirect: 'manual', ...options });
  const digest = buffer => createHash('sha256').update(buffer).digest('hex');
  try {
    for (const route of ['/', '/stav-zoo', '/stav-zoo/', '/stav-zoo/coati', '/stav-zoo/coati/']) {
      for (let load = 0; load < 2; load++) {
        const response = await request(route);
        assert.equal(response.status, 200, route);
        const html = await response.text();
        assert.ok(html.includes('<div id="root"></div>'));
        assert.ok(!html.includes('/@vite/client'));
        assert.match(html, /<script id="staff-user" type="application\/json">null<\/script>/);
        const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g), match => match[1]);
        assert.ok(assets.some(asset => asset.endsWith('.js')), 'React bundle is required');
        assert.ok(assets.some(asset => asset.endsWith('.css')), 'Original page styles are required');
        for (const filename of assets) {
          const asset = await request(filename);
          assert.equal(asset.status, 200, filename);
          assert.equal(digest(Buffer.from(await asset.arrayBuffer())), digest(readFileSync(path.resolve(__dirname, '../../Client/dist', filename.slice(1)))));
        }
      }
    }
    const resourceDirectory = path.resolve(__dirname, '../../../Resource');
    for (const filename of readdirSync(resourceDirectory)) {
      const route = `/${filename.endsWith('.mp4') ? 'videos' : 'images'}/${filename}`;
      const response = await request(route);
      assert.equal(response.status, 200, route);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(readFileSync(path.join(resourceDirectory, filename))), route);
    }
    const range = await request('/videos/coati-stream.mp4', { headers: { Range: 'bytes=0-1023' } });
    assert.equal(range.status, 206);
    assert.equal((await range.arrayBuffer()).byteLength, 1024);
    const poster = await request('/images/webcam-placeholder.jpg', { method: 'HEAD' });
    assert.equal(poster.status, 200);
    assert.match(poster.headers.get('content-type'), /^image\/jpeg/);
    for (const route of ['/api/coati', '/api/coati/info', '/api/coati/diary', '/api/coati/donations', '/api/coati/status']) {
      const response = await request(route);
      assert.equal(response.status, 200, route);
      assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
    }
    assert.equal((await request('/api/diary')).status, 401);
    const login = await request('/account/login', { method: 'POST', body: new URLSearchParams({ username: 'admin', password: 'admin2026' }) });
    assert.equal(login.status, 302);
    assert.equal(login.headers.get('location'), '/diary');
    const headers = { Cookie: login.headers.get('set-cookie').split(';')[0] };
    for (const route of ['/diary', '/diary/index', '/diary/create', '/diary/edit/1', '/diary/delete/1']) {
      const response = await request(route, { headers });
      assert.equal(response.status, 200, route);
      assert.ok((await response.text()).includes('Иван Романов'));
    }
    assert.equal((await request('/api/diary', { headers })).status, 200);
    assert.equal((await request('/api/diary/1', { headers })).status, 200);
    const donation = await request('/Zoo/Donate', { method: 'POST' });
    assert.equal(donation.status, 302);
    assert.equal(donation.headers.get('location'), 'https://pay.cloudtips.ru/p/cceba1a9');
    const logout = await request('/account/logout', { headers });
    assert.equal(logout.status, 302);
    assert.equal(logout.headers.get('location'), '/stav-zoo/coati');
    assert.equal((await request('/api/unknown')).status, 404);
    assert.equal((await request('/assets/missing.js')).status, 404);
    assert.equal((await request('/missing')).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
});
