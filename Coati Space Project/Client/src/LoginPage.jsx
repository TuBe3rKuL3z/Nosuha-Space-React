import { useState } from 'react';

export function LoginPage({ page }) {
  const [error, setError] = useState(page.ErrorMessage || '');
  return <>
<div className="row justify-content-center my-5">
    <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm border rounded-3 bg-white">
            <div className="card-header bg-dark text-white text-center py-4">
                <h4 className="mb-0 fw-bold text-white">Вход для администратора</h4>
            </div>
            <div className="card-body p-4">
                {error && <div className="alert alert-danger alert-dismissible fade show" role="alert"><strong>Ошибка:</strong> {error}<button type="button" className="btn-close" aria-label="Close" onClick={() => setError('')}></button></div>}

                <form method="post" action="/account/login">
                    <input type="hidden" name="returnUrl" value={page.ReturnUrl || ''} />

                    <div className="mb-3">
                        <label htmlFor="usernameInput" className="form-label fw-semibold text-dark">Имя пользователя:</label>
                        <input type="text" id="usernameInput" name="username" className="form-control form-control-lg" placeholder="Введите имя пользователя" required autoFocus />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="passwordInput" className="form-label fw-semibold text-dark">Пароль:</label>
                        <input type="password" id="passwordInput" name="password" className="form-control form-control-lg" placeholder="Введите пароль" required />
                    </div>

                    <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-sm">
                        Войти в систему
                    </button>
                </form>

                <div className="text-center mt-4 pt-3 border-top">
                    <a href="/stav-zoo/coati" className="text-decoration-none text-secondary small">
                        Вернуться на страницу носухи
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

  </>;
}
