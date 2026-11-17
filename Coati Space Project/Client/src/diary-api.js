export async function diaryRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options, headers: { Accept: 'application/json', ...options.headers },
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`HTTP ${response.status}: сервер вернул ответ в неверном формате.`);
  }
  const data = await response.json();
  if (!response.ok) {
    if (typeof data.error !== 'string') throw new Error(`HTTP ${response.status}: отсутствует описание ошибки сервера.`);
    const error = new Error(`HTTP ${response.status}: ${data.error}`);
    if (data.errors) {
      error.fields = Object.fromEntries(Object.entries(data.errors).map(([field, messages]) => [field,
        Array.isArray(messages) ? messages[0] : messages]));
    }
    throw error;
  }
  return data;
}

export function assertEntry(entry) {
  if (!entry || !Number.isInteger(entry.Id) || !Number.isInteger(entry.CoatiId) ||
      ['EventDate', 'EventType', 'Title', 'Description', 'Author'].some(field => typeof entry[field] !== 'string')) {
    throw new Error('Сервер вернул некорректные данные записи дневника.');
  }
  return entry;
}

export function formatEventDate(value, includeTime = true) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}.${month}.${year}${includeTime ? ` ${value.slice(11, 16)}` : ''}`;
}

export function newEntry(user) {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date()).replace(' ', 'T');
  return { Id: 0, CoatiId: 1, EventDate: date, EventType: 'Кормление', Title: '', Description: '', Author: user.FullName };
}

export async function saveEntry(url, method, fields) {
  const data = await diaryRequest(url, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
  });
  if (typeof data.SuccessMessage !== 'string') throw new Error('В ответе сервера отсутствует результат операции с дневником.');
  return data.SuccessMessage;
}
