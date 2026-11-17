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
Vite перенаправляет `/api`, `/images` и `/videos` на `http://localhost:3000`;
при смене порта сервера нужно изменить адрес в `Client/vite.config.js`.

На этапе 2 подготовлены сборка, сервер и основа публичных маршрутов.
Полное содержимое страниц, оформление, БД и API переносятся на следующих этапах.
