import { Link, usePathname } from './router.jsx';

// The public page content and original styles are transferred in stage 4.
function ZooPage() {
  return (
    <main>
      <h1>Интерактивный портал обитателей зоопарка</h1>
      <Link href="/stav-zoo/coati">Перейти к странице носухи</Link>
    </main>
  );
}

function CoatiPage() {
  return (
    <main>
      <Link href="/stav-zoo">Главная зоопарка</Link>
      <h1>Носуха «Хахатуха»</h1>
    </main>
  );
}

const routes = {
  '/': CoatiPage,
  '/stav-zoo': ZooPage,
  '/stav-zoo/coati': CoatiPage,
};

export function App() {
  const pathname = usePathname();
  const Page = routes[pathname.replace(/\/$/, '') || '/'];
  return Page ? <Page /> : <main><h1>Страница не найдена</h1></main>;
}
