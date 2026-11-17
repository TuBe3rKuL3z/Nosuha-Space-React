import { useEffect, useState } from 'react';
import { diaryRequest, assertEntry, newEntry } from './diary-api.js';
import { DiaryList } from './DiaryList.jsx';
import { DiaryForm } from './DiaryForm.jsx';
import { DiaryDelete } from './DiaryDelete.jsx';

export function DiaryPage({ pathname, user, onSaved, message, onDismiss }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const creating = pathname === '/diary/create';
  const record = pathname.match(/^\/diary\/(edit|delete)\/([^/]+)$/);

  useEffect(() => {
    if (creating) { setData(newEntry(user)); return; }
    const controller = new AbortController();
    const endpoint = record ? `/api/diary/${encodeURIComponent(record[2])}` : `/api/diary${window.location.search}`;
    diaryRequest(endpoint, { signal: controller.signal }).then(data => {
      if (record) assertEntry(data);
      else {
        if (!Array.isArray(data.Entries) || !Array.isArray(data.Authors) || data.Authors.some(author => typeof author !== 'string')) {
          throw new Error('Сервер вернул некорректный список записей или сотрудников.');
        }
        data.Entries.forEach(assertEntry);
      }
      setData(data);
    }).catch(error => {
      if (!controller.signal.aborted) {
        const details = error.fields ? Object.values(error.fields).join(' ') : '';
        setError(`${error.message}${details ? ` ${details}` : ''}`);
      }
    });
    return () => controller.abort();
  }, [pathname, creating, user]);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!data) return <p role="status">Загрузка…</p>;
  if (creating || record?.[1] === 'edit') return <DiaryForm entry={data} editing={!creating} onSaved={onSaved} />;
  if (record?.[1] === 'delete') return <DiaryDelete entry={data} onSaved={onSaved} />;
  return <DiaryList data={data} user={user} message={message} onDismiss={onDismiss} />;
}
