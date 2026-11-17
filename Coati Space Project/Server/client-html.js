function renderClientHtml(html, user, page = {}) {
  const marker = '<script id="staff-user" type="application/json">null</script>';
  if (!html.includes(marker)) throw new Error('В HTML клиента отсутствует место для данных авторизации.');
  const json = JSON.stringify(user || null).replaceAll('<', '\\u003c');
  const pageMarker = '<script id="page-data" type="application/json">{}</script>';
  if (!html.includes(pageMarker)) throw new Error('В HTML клиента отсутствует место для данных страницы.');
  return html.replace(marker, () => `<script id="staff-user" type="application/json">${json}</script>`)
    .replace(pageMarker, () => `<script id="page-data" type="application/json">${JSON.stringify(page).replaceAll('<', '\\u003c')}</script>`);
}

module.exports = { renderClientHtml };
