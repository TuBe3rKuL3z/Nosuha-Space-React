import { useEffect, useState } from 'react';
import { usePathname } from './router.jsx';
import { getPublicData } from './api.js';
import { Layout } from './Layout.jsx';
import { ZooPage } from './ZooPage.jsx';
import { CoatiPage } from './CoatiPage.jsx';
import { LoginPage } from './LoginPage.jsx';
import { DeniedPage } from './DeniedPage.jsx';
import { DiaryPage } from './DiaryPage.jsx';
import './styles.css';

export function App() {
  const pathname = usePathname().replace(/\/$/, '').toLowerCase() || '/';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mediaErrors, setMediaErrors] = useState([]);
  const [user] = useState(() => JSON.parse(document.getElementById('staff-user').textContent));
  const [page] = useState(() => JSON.parse(document.getElementById('page-data').textContent));
  const [successMessage, setSuccessMessage] = useState('');
  const isPublicPage = ['/', '/stav-zoo', '/stav-zoo/coati'].includes(pathname);
  const isDiaryPage = /^\/diary(?:\/(?:index|create|(?:edit|delete)\/[^/]+))?$/.test(pathname);
  const isLoginPage = page.View === 'login' || ['/account', '/account/login'].includes(pathname);
  const isDeniedPage = page.View === 'denied' || pathname === '/account/denied';

  useEffect(() => {
    let title = pathname === '/stav-zoo' ? 'Главная' : 'Носуха Хахатуха';
    if (isLoginPage) title = 'Авторизация администратора';
    else if (isDeniedPage) title = 'Доступ ограничен';
    else if (isDiaryPage) {
      title = pathname === '/diary/create' ? 'Новая запись в журнал'
        : pathname.startsWith('/diary/edit/') ? `Редактирование записи #${pathname.split('/').at(-1)}`
        : pathname.startsWith('/diary/delete/') ? `Удаление события #${pathname.split('/').at(-1)}`
        : 'Журнал наблюдений за носухой';
    }
    document.title = `${title} - Ставропольский зоопарк`;
    if (!isPublicPage) return;
    const controller = new AbortController();
    getPublicData(controller.signal).then(setData).catch(error => {
      // Unmount/StrictMode cancellation is intentional, not a failed API request.
      if (!controller.signal.aborted) setError(error.message);
    });
    return () => controller.abort();
  }, [pathname, isPublicPage, isLoginPage, isDeniedPage, isDiaryPage]);

  useEffect(() => {
    if (data && window.location.hash) {
      const id = window.location.hash.slice(1);
      document.getElementById(id)?.scrollIntoView();
    }
  }, [data, pathname]);

  function onMediaError(event) {
    const source = event.currentTarget.src || event.currentTarget.currentSrc;
    const message = `Не удалось загрузить медиафайл: ${source}`;
    setMediaErrors(errors => errors.includes(message) ? errors : [...errors, message]);
  }

  function onSaved(message) {
    setSuccessMessage(message);
    window.history.pushState(null, '', '/diary');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  }

  return <Layout user={user}>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {mediaErrors.map(message => <div className="alert alert-danger" role="alert" key={message}>{message}</div>)}
    {page.View === 'error' ? <div className="alert alert-danger" role="alert">{page.ErrorMessage}</div>
    : isLoginPage ? <LoginPage page={page} /> : isDeniedPage ? <DeniedPage /> : isDiaryPage && user ? (
      <DiaryPage key={pathname + window.location.search} pathname={pathname} user={user} onSaved={onSaved} message={successMessage} onDismiss={() => setSuccessMessage('')} />
    ) : !isPublicPage ? <h1>Страница не найдена</h1> : !error && (
      data ? (pathname === '/stav-zoo'
        ? <ZooPage onMediaError={onMediaError} />
        : <CoatiPage {...data} onMediaError={onMediaError} />)
        : <p role="status">Загрузка…</p>
    )}
  </Layout>;
}
