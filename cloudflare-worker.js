// Запасний посередник для даних КМДА. Потрібен ЛИШЕ якщо ремонти в застосунку не вантажаться.
// Cloudflare → Workers & Pages → Create → Worker → вставити цей код → Deploy.
// Адресу виду https://назва.ваш-акаунт.workers.dev/?url= вписати в «Налаштування → Посередник».
const ALLOWED = ['gisserver.kyivcity.gov.ua'];

export default {
  async fetch(request) {
    const target = new URL(request.url).searchParams.get('url');
    const cors = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=60' };
    if (!target) return new Response('url?', { status: 400, headers: cors });
    let u;
    try { u = new URL(target); } catch { return new Response('bad url', { status: 400, headers: cors }); }
    if (!ALLOWED.includes(u.hostname)) return new Response('forbidden', { status: 403, headers: cors });
    const r = await fetch(u.toString(), { cf: { cacheTtl: 60 } });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
  }
};
