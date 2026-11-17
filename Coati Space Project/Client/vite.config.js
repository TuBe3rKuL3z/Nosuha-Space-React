import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { createAuth, loadAuthKey } = require('../Server/auth.js');
const { renderClientHtml } = require('../Server/client-html.js');

function publicPageContext() {
  return {
    name: 'public-page-context',
    configureServer(server) {
      // Only cookie verification is needed here; account requests are proxied to Express.
      const { authenticate } = createAuth(null, loadAuthKey());
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '') || '/';
        // Keep native login POST/302 behavior while rendering source modules in Vite.
        if (/^\/(account|diary)(\/|$)/i.test(pathname)) {
          (async () => {
            const headers = {};
            if (req.headers.cookie) headers.Cookie = req.headers.cookie;
            if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
            const response = await fetch(`http://localhost:3000${req.url}`, {
              method: req.method, headers, redirect: 'manual',
              body: ['GET', 'HEAD'].includes(req.method) ? undefined : req, duplex: 'half',
            });
            res.statusCode = response.status;
            const cookies = response.headers.getSetCookie();
            if (cookies.length) res.setHeader('Set-Cookie', cookies);
            const location = response.headers.get('location');
            if (location) { res.setHeader('Location', location); res.end(); return; }
            if (req.method === 'HEAD') {
              const contentType = response.headers.get('content-type');
              if (contentType) res.setHeader('Content-Type', contentType);
              res.end();
              return;
            }
            const body = await response.text();
            if (!response.headers.get('content-type')?.includes('text/html')) {
              res.setHeader('Content-Type', response.headers.get('content-type'));
              res.end(body);
              return;
            }
            const staff = body.match(/<script id="staff-user" type="application\/json">([\s\S]*?)<\/script>/);
            const page = body.match(/<script id="page-data" type="application\/json">([\s\S]*?)<\/script>/);
            if (!staff || !page) throw new Error('Сервер не передал данные страницы авторизации или дневника.');
            const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
            const html = await server.transformIndexHtml(req.url, renderClientHtml(template, JSON.parse(staff[1]), JSON.parse(page[1])));
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(html);
          })().catch(next);
          return;
        }
        if (req.method !== 'GET' || !['/', '/stav-zoo', '/stav-zoo/coati'].includes(pathname)) return next();
        authenticate(req, res, async error => {
          if (error) return next(error);
          try {
            const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
            const html = await server.transformIndexHtml(req.url, renderClientHtml(template, req.user));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(html);
          } catch (error) {
            next(error);
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), publicPageContext()],
  server: {
    proxy: Object.fromEntries(
      ['/api', '/Zoo', '/images', '/videos'].map((path) => [path, 'http://localhost:3000']),
    ),
  },
});
