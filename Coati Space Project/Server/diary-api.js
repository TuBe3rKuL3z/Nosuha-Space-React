const { Router } = require('express');

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return year >= 1 && year <= 9999 && date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function localNow() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date());
}

function eventDate(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,7})?)?$/);
  if (!match || !dateOnly(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] || 0) > 59) return null;
  return `${match[1]} ${match[2]}:${match[3]}:${match[4] || '00'}${match[5] || ''}`;
}

function diaryApi(db) {
  const router = Router();
  const find = id => db.prepare('SELECT * FROM DiaryEntries WHERE Id = ?').get(id);
  const notFound = res => res.status(404).json({ error: 'Запись дневника не найдена.' });

  router.get('/', (req, res) => {
    const clauses = [];
    const values = [];
    const errors = {};
    for (const field of ['filterType', 'author', 'dateFrom', 'dateTo']) {
      if (req.query[field] !== undefined && typeof req.query[field] !== 'string') errors[field] = 'Укажите одно значение фильтра.';
    }
    for (const [field, column] of [['filterType', 'EventType'], ['author', 'Author']]) {
      const value = req.query[field];
      if (typeof value === 'string' && value.trim() && value !== 'Все') {
        clauses.push(`${column} = ?`);
        values.push(value);
      }
    }
    for (const field of ['dateFrom', 'dateTo']) {
      const value = req.query[field];
      if (typeof value !== 'string' || !value.trim()) continue;
      const date = dateOnly(value);
      if (!date) { errors[field] = 'Укажите корректную дату.'; continue; }
      if (field === 'dateFrom') {
        clauses.push('EventDate >= ?');
        values.push(value);
      } else {
        if (value === '9999-12-31') { errors[field] = 'Конечная дата выходит за поддерживаемый диапазон.'; continue; }
        date.setUTCDate(date.getUTCDate() + 1);
        // Preserve all fractions of the last second, as Date.AddDays(1) does.
        clauses.push('EventDate < ?');
        values.push(date.toISOString().slice(0, 10));
      }
    }
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Проверьте параметры фильтрации.', errors });
    const Entries = db.prepare(`SELECT * FROM DiaryEntries${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY EventDate DESC`).all(...values);
    const Authors = db.prepare("SELECT DISTINCT Author FROM DiaryEntries WHERE Author <> ''").all()
      .map(row => row.Author).sort(new Intl.Collator('ru-RU').compare);
    res.json({ Entries, Authors });
  });

  router.param('id', (req, res, next, value) => {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647) {
      return res.status(400).json({ error: 'Некорректный ID записи.' });
    }
    req.entryId = Number(value);
    next();
  });

  router.get('/:id', (req, res) => {
    const entry = find(req.entryId);
    if (!entry) return notFound(res);
    res.json(entry);
  });

  function validate(req, res, editing) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Ожидались поля записи дневника.' });
      return null;
    }
    const entry = { Id: 0, CoatiId: 0, EventDate: localNow(), EventType: 'Кормление', Title: '', Description: '', Author: 'Кипер зоопарка' };
    for (const field of Object.keys(entry)) {
      if (body[field] !== undefined) entry[field] = body[field];
    }
    const errors = {};
    for (const field of ['Id', 'CoatiId']) {
      const value = entry[field];
      if (!['string', 'number'].includes(typeof value) || !/^-?\d+$/.test(String(value)) ||
          !Number.isInteger(Number(value)) || Number(value) < -2147483648 || Number(value) > 2147483647) {
        errors[field] = 'Укажите целое число.';
      } else entry[field] = Number(value);
    }
    for (const field of ['Title', 'Description', 'Author', 'EventType']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) {
        // ASP.NET binds explicit whitespace-only form values to null. Its implicit
        // required error precedes the controller's own Title/Description errors.
        const messages = [];
        if (body[field] !== undefined) messages.push(`The ${field} field is required.`);
        if (field === 'Title') messages.push('Укажите заголовок события.');
        else if (field === 'Description') messages.push('Укажите описание события.');
        errors[field] = messages;
      }
    }
    const normalized = eventDate(entry.EventDate);
    if (!normalized) errors.EventDate = 'Укажите корректные дату и время события.';
    else entry.EventDate = normalized;
    if (editing && body.Id !== undefined && entry.Id !== req.entryId) errors.Id = 'ID записи не совпадает с адресом запроса.';
    if (Object.keys(errors).length) {
      res.status(400).json({ error: 'Проверьте поля записи.', errors });
      return null;
    }
    if (!editing && entry.CoatiId === 0) entry.CoatiId = 1;
    return entry;
  }

  router.post('/', (req, res) => {
    const entry = validate(req, res, false);
    if (!entry) return;
    const columns = ['CoatiId', 'EventDate', 'EventType', 'Title', 'Description', 'Author'];
    if (entry.Id !== 0) columns.unshift('Id');
    const result = db.prepare(`INSERT INTO DiaryEntries (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
      .run(...columns.map(field => entry[field]));
    const Id = Number(result.lastInsertRowid);
    res.status(201).location(`/api/diary/${Id}`).json({ Id, SuccessMessage: `Событие «${entry.Title}» успешно добавлено в журнал!` });
  });

  router.put('/:id', (req, res) => {
    if (!find(req.entryId)) return notFound(res);
    const entry = validate(req, res, true);
    if (!entry) return;
    db.prepare('UPDATE DiaryEntries SET CoatiId=?, EventDate=?, EventType=?, Title=?, Description=?, Author=? WHERE Id=?')
      .run(entry.CoatiId, entry.EventDate, entry.EventType, entry.Title, entry.Description, entry.Author, req.entryId);
    res.json({ SuccessMessage: `Событие #${req.entryId} успешно обновлено!` });
  });

  router.delete('/:id', (req, res) => {
    if (!find(req.entryId)) return notFound(res);
    db.prepare('DELETE FROM DiaryEntries WHERE Id=?').run(req.entryId);
    res.json({ SuccessMessage: `Событие #${req.entryId} удалено из журнала наблюдений.` });
  });

  return router;
}

module.exports = { diaryApi };
