import { useState } from 'react';
import { saveEntry } from './diary-api.js';

const categories = [
  ['Кормление', 'Кормление (рацион / лакомства)'], ['Медосмотр', 'Медосмотр (ветеринарный осмотр / вес)'],
  ['Спаривание', 'Спаривание (знакомство / адаптация)'], ['Потомство', 'Потомство (наблюдение / уход)'],
  ['Активность', 'Активность (поведение / игры)'], ['Уборка', 'Уборка и обустройство вольера'],
];

export function DiaryForm({ entry, editing, onSaved }) {
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    setErrors({});
    try {
      const message = await saveEntry(editing ? `/api/diary/${entry.Id}` : '/api/diary', editing ? 'PUT' : 'POST', fields);
      onSaved(message);
    } catch (error) {
      setError(error.message);
      if (error.fields) setErrors(error.fields);
    }
  }
  return <div className="row justify-content-center">
    <div className="col-lg-8"><div className="card shadow-sm border bg-white">
      <div className="card-header bg-dark text-white py-3">
        <h4 className="mb-0 fw-bold text-white">{editing ? `Редактирование записи #${entry.Id}` : 'Новая запись: Журнал наблюдений за носухой'}</h4>
      </div>
      <div className="card-body p-4">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form action={editing ? `/diary/edit/${entry.Id}` : '/diary/create'} method="post" onSubmit={submit}>
          {editing && <input type="hidden" name="Id" value={entry.Id} />}
          <input type="hidden" name="CoatiId" value={entry.CoatiId} />
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label htmlFor="EventDate" className="form-label fw-semibold text-dark">{editing ? 'Дата и время:' : 'Дата и время фиксации:'}</label>
              <input id="EventDate" name="EventDate" type="datetime-local" className="form-control" defaultValue={entry.EventDate.slice(0, 16).replace(' ', 'T')} required />
              <span className="text-danger small">{errors.EventDate}</span>
            </div>
            <div className="col-md-6">
              <label htmlFor="EventType" className="form-label fw-semibold text-dark">{editing ? 'Категория:' : 'Категория события:'}</label>
              <select id="EventType" name="EventType" className="form-select" defaultValue={entry.EventType} required>
                {categories.map(([value, label]) => <option key={value} value={value}>{editing ? value : label}</option>)}
              </select>
              <span className="text-danger small">{errors.EventType}</span>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="Title" className="form-label fw-semibold text-dark">Тема события:</label>
            <input id="Title" name="Title" className="form-control" defaultValue={entry.Title} placeholder={editing ? undefined : 'Например: Утренний осмотр или Кормление фруктами'} required />
            <span className="text-danger small">{errors.Title}</span>
          </div>
          <div className="mb-3">
            <label htmlFor="Description" className="form-label fw-semibold text-dark">{editing ? 'Подробное описание:' : 'Описание наблюдения:'}</label>
            <textarea id="Description" name="Description" className="form-control" rows="4" defaultValue={entry.Description} placeholder={editing ? undefined : 'Опишите поведение питомца, состояние или проведённую процедуру...'} required></textarea>
            <span className="text-danger small">{errors.Description}</span>
          </div>
          <div className="mb-4">
            <label htmlFor="Author" className="form-label fw-semibold text-dark">{editing ? 'Автор записи:' : 'Сотрудник, зафиксировавший запись:'}</label>
            <input id="Author" name="Author" className="form-control" defaultValue={entry.Author} required />
            <span className="text-danger small">{errors.Author}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center pt-3 border-top">
            <a href="/diary" className="btn btn-outline-secondary">{editing ? 'Отмена' : 'Назад к списку'}</a>
            <button type="submit" className={`btn ${editing ? 'btn-primary' : 'btn-success'} px-4 fw-semibold shadow-sm`}>{editing ? 'Сохранить изменения' : 'Сохранить запись'}</button>
          </div>
        </form>
      </div>
    </div></div>
  </div>;
}
