const { Router } = require('express');

const line = '==================================================';
const separator = '--------------------------------------------------';
// AppendLine uses CRLF in the original Windows application.
const report = lines => `${lines.join('\r\n')}\r\n`;
function date(value, includeTime = false) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}.${month}.${year}${includeTime ? ` ${value.slice(11, 16)}` : ''}`;
}
const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value));

function coatiApi(db) {
  const router = Router();
  router.get(['/', '/info'], (req, res) => {
    const coati = db.prepare('SELECT * FROM Coatis LIMIT 1').get();
    if (!coati) return res.status(404).type('text').send('Данные о носухе в базе данных пока отсутствуют.');
    res.type('text').send(report([
      line, 'ИНФОРМАЦИОННАЯ СВОДКА ЗООПАРКА: НОСУХА ХАХАТУХА', line,
      `Кличка:             ${coati.Name}`,
      `Биологический вид:  ${coati.Species}`,
      `Пол:                ${coati.Gender}`,
      `Дата рождения:      ${date(coati.BirthDate)}`,
      `Текущее состояние:  ${coati.HealthStatus}`,
      `Место содержания:   ${coati.Habitat}`,
      `Рацион питания:     ${coati.Diet}`,
      separator, 'История и биография особи:', coati.Biography, line,
    ]));
  });
  router.get('/diary', (req, res) => {
    const entries = db.prepare('SELECT * FROM DiaryEntries ORDER BY EventDate DESC').all();
    if (entries.length === 0) return res.type('text').send('В дневнике наблюдений пока нет зафиксированных событий.');
    const lines = [line, 'ЖУРНАЛ НАБЛЮДЕНИЙ ЗООЛОГОВ И КИПЕРОВ (НОСУХА Хахатуха)', line,
      `Всего записей в журнале: ${entries.length}`, ''];
    entries.forEach((entry, index) => lines.push(
      `Запись #${index + 1} от ${date(entry.EventDate, true)}`,
      `Категория события: [${entry.EventType}]`,
      `Тема:              ${entry.Title}`,
      `Сотрудник:         ${entry.Author}`,
      `Подробности:       ${entry.Description}`, separator,
    ));
    res.type('text').send(report(lines));
  });
  router.get('/donations', (req, res) => {
    const donations = db.prepare('SELECT * FROM Donations ORDER BY CreatedAt DESC').all();
    const total = donations.reduce((sum, donation) => sum + Number(donation.Amount), 0);
    const lines = [line, 'ОТЧЁТ О ДОБРОВОЛЬНЫХ ПОЖЕРТВОВАНИЯХ', line,
      `Общая сумма сборов: ${number(total)} рублей`, `Количество взносов: ${donations.length}`, ''];
    for (const donation of donations) {
      lines.push(`[${date(donation.CreatedAt, true)}] ${donation.DonorName} внес ${number(donation.Amount)} руб.`,
        `Цель: ${donation.Target}`);
      if (donation.Message?.trim()) lines.push(`Пожелание: «${donation.Message}»`);
      lines.push(separator);
    }
    res.type('text').send(report(lines));
  });
  router.get('/status', (req, res) => {
    res.type('text').send([
      line, 'СТАТУС ВОЛЬЕРА И ТРАНСЛЯЦИИ НОСУХИ', line,
      'Состояние веб-камеры:   ОНЛАЙН (Поток активен)',
      'Разрешение потока:      1920x1080 (Full HD, 30 FPS)',
      'Температура в вольере:  +24.5 °C',
      'Влажность воздуха:      62 %',
      'Освещение павильона:    Дневное (эмуляция тропиков)',
      'Активность носухи:      Умеренно-активное перемещение по ярусам', line,
    ].join('\n'));
  });
  return router;
}

module.exports = { coatiApi };
