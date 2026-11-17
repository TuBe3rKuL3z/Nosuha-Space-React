# Nosuha-Space-React
Веб-приложение на React и NodeJS про носуху, созданное в учебных целях.

## Запуск

Команды PowerShell из корня репозитория (зависимости уже установлены):

```powershell
Set-Location 'Coati Space Project/Client'
npm run build
Set-Location ../Server
npm start
```

Сайт: http://localhost:3000/stav-zoo. Сервер раздаёт сборку `Client/dist`
и ресурсы из корневой папки `Resource` по исходным адресам `/images` и `/videos`.
Порт сервера можно задать переменной окружения `PORT`.

## Разработка

В первом терминале из папки `Coati Space Project/Server` запустить `npm run dev`,
во втором из `Coati Space Project/Client` — `npm run dev`.
Открыть адрес Vite, указанный во втором терминале, с путём `/stav-zoo`.
Vite перенаправляет `/api`, `/account`, `/images` и `/videos` на `http://localhost:3000`;
при смене порта сервера нужно изменить адрес в `Client/vite.config.js`.

На этапе 3 перенесены SQLite, начальные данные, авторизация и текстовые API.
Полное содержимое React-страниц, оформление и CRUD дневника переносятся на следующих этапах.

## База данных и авторизация

Требуется Node.js с встроенным `node:sqlite` (в текущем окружении — 26.13.0).
При первом запуске сервер создаёт `Server/coati.db` с исходными таблицами
`Coatis`, `DiaryEntries`, `Donations`, `StaffUsers` и начальными данными оригинала.
Повторный запуск сохраняет изменения и не восстанавливает удалённые seed-записи.
Ключ шифрования cookie хранится в `Server/.auth-key`; база и ключ исключены из Git.
Ошибка открытия/инициализации базы или чтения ключа прерывает запуск.

Исходная учётная запись: `admin` / `admin2026`, роль `Admin`.
Форма входа: `GET /account/login`; вход: `POST /account/login`
с полями `username`, `password`, `returnUrl` (URL-encoded форма).
Успешный вход устанавливает HttpOnly-cookie на 8 часов и возвращает 302
на локальный `returnUrl` либо `/diary`; выход `/account/logout` удаляет cookie
и перенаправляет на `/stav-zoo/coati`.
Отсутствующие поля дают 400, неверные данные или недействительная cookie — 401,
отсутствие прав администратора — 403. Тексты ошибок сохранены из оригинала.
Серверные формы входа и отказа используют исходную разметку; интеграция оформления
и клиентского интерфейса выполняется на этапе переноса страниц.

Текстовые API оригинала (`text/plain; charset=utf-8`):
`GET /api/coati`, `/api/coati/info`, `/api/coati/diary`,
`/api/coati/donations`, `/api/coati/status`.
При отсутствии особи `/api/coati` и `/api/coati/info` возвращают 404
с исходным сообщением об отсутствии данных.
