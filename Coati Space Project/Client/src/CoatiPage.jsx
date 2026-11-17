const galleryImages = Array.from({ length: 8 }, (_, index) => `/images/coati-gallery-${index + 1}.jpg`);

export function CoatiPage({ coati, entries, onMediaError }) {
  const healthStatus = !coati.HealthStatus.trim() || coati.HealthStatus.includes('Отличное') ? 'Клинически здоров' : coati.HealthStatus;
  return <>
    <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><a  href="/stav-zoo" className="text-decoration-none text-success fw-medium">← Главная страница зоопарка</a></li>
            <li className="breadcrumb-item active text-dark fw-medium" aria-current="page">Носуха ({coati.Name})</li>
        </ol>
    </nav>

    {/* Главная карточка особи носухи */}
    <div className="card shadow-sm border mb-4 overflow-hidden bg-white">
        <div className="row g-0">
            <div className="col-lg-5 position-relative">
                <img onError={onMediaError} src={coati.PhotoUrl} className="img-fluid h-100 w-100 object-fit-cover" alt={coati.Name} style={{ minHeight: "380px" }} />
                <span className="position-absolute top-0 start-0 m-3 badge bg-success px-3 py-2 fs-6 shadow-sm">
                    Обитатель зоопарка
                </span>
            </div>
            <div className="col-lg-7">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                        <div>
                            <h1 className="card-title display-6 fw-bold text-dark mb-1">{coati.Name}</h1>
                            <p className="text-secondary fst-italic mb-2">{coati.Species}</p>
                        </div>
                        <span className="badge bg-light text-success border border-success px-3 py-2 fs-6 rounded-pill">
                            {healthStatus}
                        </span>
                    </div>

                    <hr className="my-3 text-muted" />

                    <div className="row g-2 mb-3">
                        <div className="col-sm-6">
                            <strong className="text-dark">Пол:</strong> <span className="text-secondary">{coati.Gender}</span>
                        </div>
                        <div className="col-sm-6">
                            <strong className="text-dark">Дата рождения:</strong> <span className="text-secondary">{coati.BirthDate}</span>
                        </div>
                        <div className="col-sm-6">
                            <strong className="text-dark">Сектор:</strong> <span className="text-secondary">{coati.Habitat}</span>
                        </div>
                        <div className="col-sm-6">
                            <strong className="text-dark">Рацион:</strong> <span className="text-secondary">{coati.Diet}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h5 className="fw-semibold text-dark">История и характер:</h5>
                        <p className="text-secondary mb-0">
                            {coati.Biography}
                        </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2 pt-1">
                        <a href="#webcam-section" className="btn btn-dark shadow-sm">
                            Камера наблюдения
                        </a>
                        <a href="#gallery-section" className="btn btn-outline-secondary">
                            Фотогалерея
                        </a>
                        <a href="#donation-section" className="btn btn-success shadow-sm">
                            Поддержать питомца
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {/* Секция прямой трансляции (Строго одна камера, зацикленное видео, лаконичная плашка) */}
    <div className="card shadow-sm border mb-4 overflow-hidden" id="webcam-section">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h4 className="mb-0 fw-bold text-dark">Прямая трансляция из вольера</h4>
        </div>
        <div className="card-body p-0 bg-black">
            <div className="live-stream-container position-relative" style={{ minHeight: "440px", maxHeight: "600px" }}>
                <div className="live-indicator">
                    <span className="live-dot"></span>
                    <span class = "text-white">В ЭФИРЕ</span>
                </div>
                <video onError={onMediaError} id="coatiLiveVideo" className="w-100 h-100 object-fit-cover" autoPlay muted loop playsInline controls preload="auto" poster="/images/webcam-placeholder.jpg">
                    <source onError={onMediaError} src="/videos/coati-stream.mp4" type="video/mp4" />
                    Ваш браузер не поддерживает видео HTML5.
                </video>
            </div>
        </div>
    </div>

    {/* Фотогалерея (Все новые фотографии, чистая аккуратная сетка без технических подписей) */}
    <div className="card shadow-sm border mb-4 bg-white" id="gallery-section">
        <div className="card-header bg-white py-3 border-bottom">
            <h4 className="mb-0 fw-bold text-dark">Фотогалерея</h4>
        </div>
        <div className="card-body p-4">
            <div className="row g-3">
                {galleryImages.map(imgPath => (

                    <div key={imgPath} className="col-6 col-md-4 col-lg-3">
                        <div className="card h-100 border shadow-sm overflow-hidden bg-light">
                            <img onError={onMediaError} src={imgPath} className="img-fluid rounded gallery-photo" alt="Фотография Носухи Хахатухи" style={{ height: "220px", width: "100%", objectFit: "cover" }} />
                        </div>
                    </div>
    ))}
            </div>
        </div>
    </div>

    {/* Дневник наблюдений (заметки зоологов) */}
    <div className="card shadow-sm border mb-4 bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h4 className="mb-0 fw-bold text-dark">Заметки зоологов</h4>
            <span className="badge bg-light text-secondary border">Журнал куратора</span>
        </div>
        <div className="card-body">
            <div className="row g-3">
                {entries.length > 0 ? entries.slice(0, 4).map(entry => (

                        <div key={entry.key} className="col-md-6">
                            <div className="border rounded p-3 h-100 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="badge bg-secondary">{entry.EventType}</span>
                                    <small className="text-secondary">{entry.EventDate}</small>
                                </div>
                                <h6 className="fw-bold mb-1 text-dark">{entry.Title}</h6>
                                <p className="small text-secondary mb-2">{entry.Description}</p>
                                <small className="text-secondary">Сотрудник: {entry.Author}</small>
                            </div>
                        </div>
    )) : (
                    <div className="col-12 text-secondary">Записей пока нет.</div>)}
            </div>
        </div>
    </div>

    {/* Форма пожертвований */}
    <div className="card shadow-sm border mb-4 bg-white" id="donation-section">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap">
            <h4 className="mb-0 fw-bold text-dark">Поддержать носуху Хахатуху</h4>
        </div>
        <div className="card-body p-4 p-md-5">
            <p className="text-secondary fs-5 mb-3 leading-relaxed">
                Сейчас зоопарк переживает непростой период: из-за кризиса и роста цен возникли серьёзные трудности со снабжением и закупкой специализированного корма. Нашей носухе каждый день требуются свежие фрукты, перепелиные яйца, витаминные комплексы и качественное питание, и в данный момент средств на полноценное обеспечение питомца катастрофически не хватает.
            </p>
            <p className="text-secondary fs-5 mb-4 leading-relaxed">
                Мы делаем всё возможное, чтобы сохранить привычные условия для Хахатухи, но без вашей помощи нам не обойтись. Было бы просто замечательно, если бы вы поддержали нашу любимицу любой посильной суммой — каждый взнос напрямую идёт на закупку еды, лакомств и необходимый уход.
            </p>

            <form action="/Zoo/Donate" method="post">
                <button type="submit" className="btn btn-success btn-lg w-100 fw-bold shadow-sm py-3 fs-5">
                    Пожертвовать носухе
                </button>
            </form>

            <div className="text-center mt-4 pt-2">
                <p className="text-dark fs-5 fw-semibold mb-2">
                    Искренне благодарим каждого неравнодушного посетителя за отзывчивость, теплоту и помощь в трудную минуту!
                </p>
                <p className="text-secondary fs-6 mb-0">
                    Благодаря вашей поддержке Хахатуха остаётся сытой, активной и радостной. Спасибо, что не остаётесь в стороне!
                </p>
            </div>
        </div>
    </div>

  </>;
}
