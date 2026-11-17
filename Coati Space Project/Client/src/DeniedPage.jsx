export function DeniedPage() {
  return <>
<div className="row justify-content-center my-5">
    <div className="col-md-6 text-center">
        <div className="p-5 bg-light rounded-3 shadow-sm border">
            <h1 className="display-4 text-danger fw-bold">403</h1>
            <h3 className="mb-3">Доступ ограничен</h3>
            <p className="text-secondary">
                Данный раздел предназначен исключительно для сотрудников зоопарка с правами доступа к служебному дневнику наблюдений.
            </p>
            <div className="d-flex justify-content-center gap-2 mt-4">
                <a href="/account/login" className="btn btn-primary">Войти в аккаунт</a>
                <a href="/stav-zoo/coati" className="btn btn-outline-secondary">На страницу носухи</a>
            </div>
        </div>
    </div>
</div>

  </>;
}
