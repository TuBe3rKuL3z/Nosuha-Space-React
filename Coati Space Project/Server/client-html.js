function renderClientHtml(html, user) {
  const marker = '<script id="staff-user" type="application/json">null</script>';
  if (!html.includes(marker)) throw new Error('В HTML клиента отсутствует место для данных авторизации.');
  const json = JSON.stringify(user || null).replaceAll('<', '\\u003c');
  return html.replace(marker, () => `<script id="staff-user" type="application/json">${json}</script>`);
}

module.exports = { renderClientHtml };
