import { formatEventDate } from './diary-api.js';

// The source filter intentionally has no separate button for «Уборка».
const categories = ['Все', 'Кормление', 'Медосмотр', 'Спаривание', 'Потомство', 'Активность'];

export function DiaryList({ data, user, message, onDismiss }) {
  const query = new URLSearchParams(window.location.search);
  const currentFilter = query.get('filterType') ?? 'Все';
  function categoryUrl(category) {
    const parameters = new URLSearchParams({ filterType: category });
    for (const field of ['dateFrom', 'dateTo']) {
      if (query.get(field)) parameters.set(field, query.get(field));
    }
    parameters.set('author', query.get('author') ?? 'Все');
    return `/diary?${parameters}`;
  }
  return <>
    <div className="d-flex justify-content-between align-items-center flex-wrap mb-4 pb-2 border-bottom">
      <div>
        <h2 className="fw-bold text-dark mb-1">Журнал наблюдений: Носуха «Хахатуха»</h2>
        <span className="text-secondary small">Администратор: <strong>{user.FullName}</strong></span>
      </div>
      <div className="d-flex gap-2 mt-2 mt-md-0">
        <a href="/diary/create" className="btn btn-success shadow-sm">Добавить запись</a>
        <a href="/stav-zoo/coati" className="btn btn-outline-secondary">На страницу носухи</a>
      </div>
    </div>
    {message && <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
      {message}<button type="button" className="btn-close" aria-label="Close" onClick={onDismiss}></button>
    </div>}
    <div className="card shadow-sm border mb-4 bg-white"><div className="card-body p-3">
      <form method="get" action="/diary">
        <div className="d-flex align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <span className="fw-semibold text-dark small me-2">Категория:</span>
          {categories.map(category => <a key={category} href={categoryUrl(category)} className={`btn btn-sm ${category === currentFilter ? 'btn-dark' : 'btn-outline-secondary'}`}>{category}</a>)}
          <input type="hidden" name="filterType" value={currentFilter} />
        </div>
        <div className="row g-2 align-items-end">
          <div className="col-sm-6 col-md-3">
            <label htmlFor="dateFrom" className="form-label small fw-semibold text-dark mb-1">Дата от:</label>
            <input id="dateFrom" type="date" name="dateFrom" defaultValue={query.get('dateFrom') ?? ''} className="form-control form-control-sm" />
          </div>
          <div className="col-sm-6 col-md-3">
            <label htmlFor="dateTo" className="form-label small fw-semibold text-dark mb-1">Дата до:</label>
            <input id="dateTo" type="date" name="dateTo" defaultValue={query.get('dateTo') ?? ''} className="form-control form-control-sm" />
          </div>
          <div className="col-sm-8 col-md-4">
            <label htmlFor="author" className="form-label small fw-semibold text-dark mb-1">Сотрудник:</label>
            <select id="author" name="author" defaultValue={query.get('author') ?? 'Все'} className="form-select form-select-sm">
              <option value="Все">Все сотрудники</option>
              {data.Authors.map(author => <option key={author} value={author}>{author}</option>)}
            </select>
          </div>
          <div className="col-sm-4 col-md-2 d-flex gap-1">
            <button type="submit" className="btn btn-sm btn-dark w-100">Применить</button>
            <a href="/diary" className="btn btn-sm btn-outline-secondary">Сброс</a>
          </div>
        </div>
      </form>
    </div></div>
    {!data.Entries.length ? <div className="alert alert-light border text-center py-4 text-secondary">
      По заданным критериям фильтрации записей не найдено. Нажмите «Сброс», чтобы отобразить все записи.
    </div> : <div className="card shadow-sm border overflow-hidden bg-white"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light"><tr>
          <th style={{ width: '140px' }}>Дата и время</th>
          <th style={{ width: '130px' }}>Категория</th>
          <th>Тема и содержание события</th>
          <th style={{ width: '170px' }}>Сотрудник</th>
          <th style={{ width: '220px' }} className="text-end">Действия</th>
        </tr></thead>
        <tbody>{data.Entries.map(entry => <tr key={entry.Id}>
          <td><span className="fw-semibold text-dark">{formatEventDate(entry.EventDate, false)}</span><div className="small text-secondary">{entry.EventDate.slice(11, 16)}</div></td>
          <td><span className="badge bg-light text-dark border px-2 py-1">{entry.EventType}</span></td>
          <td><div className="fw-semibold text-dark mb-1">{entry.Title}</div><div className="text-secondary small">{entry.Description}</div></td>
          <td><span className="small text-dark">{entry.Author}</span></td>
          <td className="text-end">
            <a href={`/diary/edit/${entry.Id}`} className="btn btn-outline-primary btn-sm me-1">Редактировать</a>{' '}
            <a href={`/diary/delete/${entry.Id}`} className="btn btn-outline-danger btn-sm">Удалить</a>
          </td>
        </tr>)}</tbody>
      </table>
    </div></div>}
  </>;
}
