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
      ['/api', '/account', '/Zoo', '/images', '/videos'].map((path) => [path, 'http://localhost:3000']),
    ),
  },
});
