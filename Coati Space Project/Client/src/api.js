async function getText(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'text/plain' } });
  const body = await response.text();
  if (!response.ok) {
    const message = response.headers.get('content-type')?.includes('application/json')
      ? JSON.parse(body).error : body;
    throw new Error(`${url}: HTTP ${response.status}. ${message}`);
  }
  if (!response.headers.get('content-type')?.startsWith('text/plain')) {
    throw new Error(`${url}: ожидался текстовый ответ API.`);
  }
  return body;
}

// Read the original reports without changing the server's text API contract.
export function parseInfo(text) {
  const fields = {
    Name: 'Кличка:', Species: 'Биологический вид:', Gender: 'Пол:',
    BirthDate: 'Дата рождения:', HealthStatus: 'Текущее состояние:',
    Habitat: 'Место содержания:', Diet: 'Рацион питания:',
  };
  const lines = text.split(/\r?\n/);
  const coati = {};
  if (lines[1] !== 'ИНФОРМАЦИОННАЯ СВОДКА ЗООПАРКА: НОСУХА ХАХАТУХА') {
    throw new Error('Некорректный формат информационной сводки носухи.');
  }
  for (const [field, label] of Object.entries(fields)) {
    const line = lines.find(value => value.startsWith(label));
    if (line === undefined) throw new Error(`В сводке носухи отсутствует поле «${label}».`);
    coati[field] = line.slice(label.length).trimStart();
  }
  const biographyStart = lines.indexOf('История и биография особи:');
  if (biographyStart < 0 || lines.at(-2) !== '='.repeat(50)) {
    throw new Error('В сводке носухи отсутствует история особи или конец отчёта.');
  }
  coati.Biography = lines.slice(biographyStart + 1, -2).join('\n');
  // The public views use these original resource paths.
  coati.PhotoUrl = '/images/coati-main.jpg';
  coati.VideoUrl = '/videos/coati-stream.mp4';
  return coati;
}

export function parseDiary(text) {
  if (text === 'В дневнике наблюдений пока нет зафиксированных событий.') return [];
  const normalized = text.replaceAll('\r\n', '\n');
  const header = normalized.match(/^={50}\nЖУРНАЛ НАБЛЮДЕНИЙ ЗООЛОГОВ И КИПЕРОВ \(НОСУХА Хахатуха\)\n={50}\nВсего записей в журнале: (\d+)\n\n/);
  if (!header) throw new Error('Некорректный формат журнала наблюдений.');
  // A separator inside a multiline description is still part of the note.
  // A record ends only before the next report header or the end of the report.
  const pattern = /Запись #(\d+) от (\d{2}\.\d{2}\.\d{4} \d{2}:\d{2})\nКатегория события: \[([^\n]*)\]\nТема:              ([\s\S]*?)\nСотрудник:         ([\s\S]*?)\nПодробности:       ([\s\S]*?)\n-{50}\n(?=Запись #\d+ от \d{2}\.\d{2}\.\d{4} \d{2}:\d{2}\nКатегория события:|$)/g;
  const body = normalized.slice(header[0].length);
  const entries = [];
  let consumed = 0;
  for (const match of body.matchAll(pattern)) {
    if (match.index !== consumed) throw new Error('Некорректная запись в журнале наблюдений.');
    consumed += match[0].length;
    const [, key, EventDate, EventType, Title, Author, Description] = match;
    entries.push({ key, EventDate, EventType, Title, Author, Description });
  }
  if (consumed !== body.length || entries.length !== Number(header[1])) {
    throw new Error('Количество или формат записей журнала не соответствует отчёту API.');
  }
  return entries;
}

export async function getPublicData(signal) {
  const [info, diary] = await Promise.all([
    getText('/api/coati/info', signal), getText('/api/coati/diary', signal),
  ]);
  return { coati: parseInfo(info), entries: parseDiary(diary) };
}
