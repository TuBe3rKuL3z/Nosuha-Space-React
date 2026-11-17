import { useEffect, useState } from 'react';
import { usePathname } from './router.jsx';
import { getPublicData } from './api.js';
import { Layout } from './Layout.jsx';
import { ZooPage } from './ZooPage.jsx';
import { CoatiPage } from './CoatiPage.jsx';
import './styles.css';

export function App() {
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mediaErrors, setMediaErrors] = useState([]);
  const [user] = useState(() => JSON.parse(document.getElementById('staff-user').textContent));
  const isPublicPage = ['/', '/stav-zoo', '/stav-zoo/coati'].includes(pathname);

  useEffect(() => {
    document.title = `${pathname === '/stav-zoo' ? 'Главная' : 'Носуха Хахатуха'} - Ставропольский зоопарк`;
    if (!isPublicPage) return;
    const controller = new AbortController();
    getPublicData(controller.signal).then(setData).catch(error => {
      // Unmount/StrictMode cancellation is intentional, not a failed API request.
      if (!controller.signal.aborted) setError(error.message);
    });
    return () => controller.abort();
  }, [pathname, isPublicPage]);

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

  return <Layout user={user}>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {mediaErrors.map(message => <div className="alert alert-danger" role="alert" key={message}>{message}</div>)}
    {!isPublicPage ? <h1>Страница не найдена</h1> : !error && (
      data ? (pathname === '/stav-zoo'
        ? <ZooPage onMediaError={onMediaError} />
        : <CoatiPage {...data} onMediaError={onMediaError} />)
        : <p role="status">Загрузка…</p>
    )}
  </Layout>;
}
