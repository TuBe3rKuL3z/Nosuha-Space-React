export function ZooPage({ onMediaError }) {
  return <>
    <div className="p-5 mb-4 bg-white rounded-3 shadow-sm border">
        <div className="container-fluid py-2">
            <span className="badge bg-success mb-2 px-3 py-2 fs-6">Ставропольский зоопарк</span>
            <h1 className="display-5 fw-bold text-dark">Интерактивный портал обитателей зоопарка</h1>
            <p className="col-md-9 fs-5 text-secondary">
                Наш зоопарк знакомит жителей и гостей региона с удивительными представителями фауны со всего мира.
                В рамках цифровой платформы зоопарка открыт специальный раздел, посвящённый нашему обаятельному обитателю сектора «Южная Америка» — носухе по кличке Хахатуха.
            </p>
            <div className="d-flex flex-wrap gap-2 mt-4">
                <a href="/stav-zoo/coati" className="btn btn-success btn-lg px-4 shadow-sm">
                    Перейти к наблюдению за носухой
                </a>
                <a href="#about-zoo" className="btn btn-outline-secondary btn-lg px-4">
                    О зоопарке
                </a>
            </div>
        </div>
    </div>

    {/* Карточка перехода на страницу носухи */}
    <div className="card shadow-sm border mb-4 bg-white overflow-hidden">
        <div className="row g-0 align-items-center">
            <div className="col-md-4">
                <img onError={onMediaError} src="/images/coati-main.jpg" className="img-fluid w-100 object-fit-cover" alt="Носуха Хахатуха" style={{ minHeight: "220px", maxHeight: "260px" }} />
            </div>
            <div className="col-md-8">
                <div className="card-body p-4">
                    <div className="text-success fw-semibold small text-uppercase mb-1">Обитатель зоопарка</div>
                    <h3 className="card-title fw-bold text-dark mb-2">Носуха «Хахатуха»</h3>
                    <p className="card-text text-secondary mb-3">
                        Познакомьтесь с нашей носухой: прямая трансляция из вольера через веб-камеру, журнал наблюдений зоологов, фотогалерея и программа заботы.
                    </p>
                    <a href="/stav-zoo/coati" className="btn btn-success px-4 fw-semibold shadow-sm">
                        Перейти к странице носухи
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div className="row align-items-md-stretch mb-4" id="about-zoo">
        <div className="col-md-6 mb-3">
            <div className="h-100 p-4 text-white bg-dark rounded-3 shadow-sm">
                <h3 className="text-white">Сектор «Южная Америка»</h3>
                <p className="text-white-50">Уникальный климатический павильон, воссоздающий атмосферу влажных лесов и саванн. Здесь вы можете в режиме реального времени наблюдать за повадками носух, их играми и исследованием среды обитания.</p>
                <a href="/stav-zoo/coati#webcam-section" className="btn btn-outline-light">Камера наблюдения</a>
            </div>
        </div>
        <div className="col-md-6 mb-3">
            <div className="h-100 p-4 bg-white border rounded-3 shadow-sm">
                <h3 className="text-success">Программа опеки и поддержки</h3>
                <p className="text-secondary">Каждый посетитель может внести свой вклад в заботу о животных: поддержать любимого питомца взносом на свежие фрукты, игрушки или лакомства.</p>
                <a href="/stav-zoo/coati#donation-section" className="btn btn-outline-success">Поддержать Хахатуху</a>
            </div>
        </div>
    </div>

  </>;
}
