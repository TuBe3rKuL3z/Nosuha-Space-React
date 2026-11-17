const { createCipheriv, createDecipheriv, randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { Router } = require('express');

const cookieName = '.AspNetCore.Cookies';
const lifetime = 8 * 60 * 60 * 1000;

function loadAuthKey(filename = path.join(__dirname, '.auth-key')) {
  // Persist the encryption key, just as ASP.NET persists its data-protection keys.
  if (!existsSync(filename)) writeFileSync(filename, randomBytes(32), { flag: 'wx', mode: 0o600 });
  const key = readFileSync(filename);
  if (key.length !== 32) throw new Error('Ключ cookie авторизации должен содержать 32 байта.');
  return key;
}

function localReturnUrl(value) {
  if (typeof value !== 'string') return null;
  const url = value.startsWith('~/') ? value.slice(1) : value;
  return url.startsWith('/') && !/^\/[\\/]/.test(url) && !/[\u0000-\u001f\u007f]/.test(url) ? url : null;
}

function createAuth(db, key, sendPage) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Не задан корректный ключ авторизации.');
  const cookieOptions = req => ({ httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });

  function issueCookie(req, res, user) {
    const issued = Date.now();
    const expires = issued + lifetime;
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    const payload = Buffer.concat([cipher.update(JSON.stringify({ user, issued, expires }), 'utf8'), cipher.final()]);
    const value = Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString('base64url');
    res.cookie(cookieName, value, { ...cookieOptions(req), expires: new Date(expires) });
  }

  function authenticate(req, res, next) {
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim());
    const cookie = cookies.find(value => value.startsWith(`${cookieName}=`));
    if (!cookie) return next();
    try {
      const encoded = cookie.slice(cookieName.length + 1);
      if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Некорректная кодировка cookie.');
      const data = Buffer.from(encoded, 'base64url');
      if (data.length <= 28) throw new Error('Некорректная длина cookie.');
      const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
      decipher.setAuthTag(data.subarray(12, 28));
      const ticket = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
      if (!Number.isFinite(ticket.issued) || !Number.isFinite(ticket.expires) || ticket.expires <= Date.now()) {
        throw new Error('Срок действия авторизации истёк.');
      }
      if (!ticket.user || ['Username', 'FullName', 'Role', 'Position'].some(field => typeof ticket.user[field] !== 'string')) {
        throw new Error('Некорректные данные авторизации.');
      }
      req.user = ticket.user;
      // CookieAuthentication renews a ticket after half its lifetime (SlidingExpiration).
      if (Date.now() - ticket.issued > ticket.expires - Date.now()) issueCookie(req, res, ticket.user);
      next();
    } catch (cause) {
      res.clearCookie(cookieName, cookieOptions(req));
      const error = new Error('Недействительная или просроченная авторизация. Войдите повторно.', { cause });
      error.status = 401;
      next(error);
    }
  }

  function requireAdmin(req, res, next) {
    const api = req.originalUrl.startsWith('/api/');
    if (!req.user) return api ? res.status(401).json({ error: 'Необходима авторизация сотрудника.' })
      : sendPage(req, res, 401, { View: 'login', ReturnUrl: req.originalUrl });
    if (req.user.Role !== 'Admin') return api ? res.status(403).json({ error: 'Доступ ограничен.' })
      : sendPage(req, res, 403, { View: 'denied' });
    next();
  }

  const router = Router();
  router.all('/logout', (req, res) => {
    res.clearCookie(cookieName, cookieOptions(req));
    res.redirect('/stav-zoo/coati');
  });
  router.use(authenticate);
  router.get(['/', '/login'], (req, res) => {
    if (req.user) return res.redirect('/diary');
    return sendPage(req, res, 200, { View: 'login', ReturnUrl: typeof req.query.returnUrl === 'string' ? req.query.returnUrl : '' });
  });
  router.post(['/', '/login'], (req, res) => {
    const { username, password, returnUrl } = req.body || {};
    const destination = typeof returnUrl === 'string' ? returnUrl : '';
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return sendPage(req, res, 400, { View: 'login', ReturnUrl: destination, ErrorMessage: 'Пожалуйста, введите логин и пароль сотрудника.' });
    }
    const user = db.prepare('SELECT * FROM StaffUsers WHERE Username = ? AND Password = ? LIMIT 1').get(username, password);
    if (!user || user.Role !== 'Admin') {
      return sendPage(req, res, 401, { View: 'login', ReturnUrl: destination, ErrorMessage: 'Неверный логин или пароль администратора.' });
    }
    const { Username, FullName, Role, Position } = user;
    issueCookie(req, res, { Username, FullName, Role, Position });
    res.redirect(localReturnUrl(destination) || '/diary');
  });
  router.get('/denied', (req, res) => sendPage(req, res, 403, { View: 'denied' }));

  return { router, authenticate, requireAdmin };
}

module.exports = { createAuth, loadAuthKey };
