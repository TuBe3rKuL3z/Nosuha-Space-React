import { useState } from 'react';

export function Layout({ children, user }) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <header>
      <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom shadow-sm mb-4 py-3">
        <div className="container">
          <a className="navbar-brand fw-bold text-success fs-5" href="https://zoostav.ru/">Ставропольский зоопарк</a>
          <button className="navbar-toggler" type="button" aria-controls="navbarSupportedContent"
            aria-expanded={expanded} aria-label="Toggle navigation" onClick={() => setExpanded(!expanded)}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="navbarSupportedContent" className={`navbar-collapse collapse d-md-inline-flex justify-content-between${expanded ? ' show' : ''}`}>
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item"><a className="nav-link text-dark fw-medium px-3" href="/stav-zoo">Главная зоопарка</a>ё</li>
              <li className="nav-item"><a className="nav-link text-success fw-semibold px-3" href="/stav-zoo/coati">Носуха Хахатуха</a></li>
              <li className="nav-item"><a className="nav-link text-dark fw-medium px-3" href="/stav-zoo/coati#webcam-section">Камера наблюдения</a></li>
              <li className="nav-item"><a className="nav-link text-dark fw-medium px-3" href="/stav-zoo/coati#donation-section">Поддержка питомца</a></li>
              {user && <li className="nav-item"><a className="nav-link text-primary fw-semibold px-3" href="/diary">Панель администратора</a></li>}
            </ul>
            <ul className="navbar-nav align-items-center">
              {user && <>
                <li className="nav-item me-2"><span className="text-dark small fw-medium">Администратор: {user.FullName}</span></li>
                <li className="nav-item"><a className="btn btn-outline-danger btn-sm px-3" href="/account/logout">Выйти</a></li>
              </>}
            </ul>
          </div>
        </div>
      </nav>
    </header>
    <div className="container"><main role="main" className="pb-3">{children}</main></div>
    <footer className="border-top py-4 bg-white mt-auto">
      <div className="container d-flex flex-wrap justify-content-between align-items-center">
        <div className="text-secondary small">© 2026 Ставропольский зоопарк. Сектор «Южная Америка». Все права защищены.</div>
        <div className="d-flex flex-wrap gap-4 small">
          <a href="https://zoostav.ru/" className="text-decoration-none text-secondary">О зоопарке</a>
          <a href="/stav-zoo/coati" className="text-decoration-none text-secondary">Носуха Хахатуха</a>
          <a href="/account/login" className="text-decoration-none text-secondary">Вход для администратора</a>
        </div>
      </div>
    </footer>
  </>;
}
