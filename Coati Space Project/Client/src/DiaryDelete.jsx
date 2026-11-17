import { useState } from 'react';
import { formatEventDate, saveEntry } from './diary-api.js';

export function DiaryDelete({ entry, onSaved }) {
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      onSaved(await saveEntry(`/api/diary/${entry.Id}`, 'DELETE', { Id: entry.Id }));
    } catch (error) {
      setError(error.message);
    }
  }
  return <div className="row justify-content-center"><div className="col-lg-6">
    <div className="card shadow-sm border-danger bg-white">
      <div className="card-header bg-danger text-white py-3"><h4 className="mb-0 fw-bold text-white">Подтверждение удаления записи</h4></div>
      <div className="card-body p-4">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <p className="text-danger fw-semibold">Вы уверены, что хотите удалить данное событие из журнала наблюдений?</p>
        <div className="p-3 bg-light rounded border mb-4">
          <div className="mb-2"><strong className="text-dark">ID:</strong> #{entry.Id}</div>
          <div className="mb-2"><strong className="text-dark">Дата:</strong> {formatEventDate(entry.EventDate)}</div>
          <div className="mb-2"><strong className="text-dark">Категория:</strong> <span className="badge bg-light text-dark border">{entry.EventType}</span></div>
          <div className="mb-2"><strong className="text-dark">Тема:</strong> {entry.Title}</div>
          <div className="mb-2"><strong className="text-dark">Описание:</strong> {entry.Description}</div>
          <div><strong className="text-dark">Автор:</strong> {entry.Author}</div>
        </div>
        <form action={`/diary/delete/${entry.Id}`} method="post" onSubmit={submit}>
          <input type="hidden" name="Id" value={entry.Id} />
          <div className="d-flex justify-content-between align-items-center">
            <a href="/diary" className="btn btn-outline-secondary">Отмена</a>
            <button type="submit" className="btn btn-danger px-4 fw-bold">Удалить запись</button>
          </div>
        </form>
      </div>
    </div>
  </div></div>;
}
