/* Сервер бота адвента — Cloudflare Worker.
 *
 * Что умеет:
 *   /start                 — приветствие и кнопка «Открыть адвент»
 *   !инфа @ник  (или /info) — карточка участника Информа из Google Таблицы
 *                            (только в личке и только для тех, кто есть в таблице или в ADMIN_IDS)
 *   GET  /card?u=ник       — HTML-страница карточки (открывается кнопкой в Telegram)
 *   POST /api/member       — данные для страницы; проверяет подпись Telegram (initData)
 *   GET  /setup?key=…      — один раз подключает webhook бота к этому воркеру
 *
 * Переменные окружения (Settings → Variables and Secrets):
 *   BOT_TOKEN       секрет — токен бота из BotFather
 *   WEBHOOK_SECRET  секрет — любая длинная случайная строка
 *   SHEET_URL       адрес веб-приложения Apps Script (…/exec)
 *   SHEET_KEY       секрет — ключ, тот же, что в свойствах Apps Script
 *   ADMIN_IDS       через запятую Telegram ID, у кого доступ всегда (необязательно)
 *   ADVENT_URL      ссылка на мини-апп, например https://piccologatto01.github.io/nice_advent/
 */

const CACHE_MS = 5 * 60 * 1000;
let cache = { at: 0, rows: null };

/* ---------------- утилиты ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const empty = (v) => v == null || String(v).trim() === '' || String(v).trim() === '-' || String(v).trim() === '—';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// «@Mol0ko000», «t.me/mol0ko000», «https://instagram.com/x/» → «mol0ko000»
function handle(v) {
  return String(v || '').trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(t\.me|telegram\.me|instagram\.com)\//i, '')
    .replace(/^@/, '').replace(/[/?#].*$/, '').toLowerCase();
}

/* ---------------- таблица ---------------- */
// заголовки столбцов таблицы → поля карточки (регистр и пробелы не важны)
const COLUMNS = {
  nick: ['ник', 'никнейм', 'прозвище'],
  role: ['роль', 'должность', 'статус'],
  last: ['фамилия'],
  first: ['имя'],
  middle: ['отчество'],
  birth: ['дата рождения', 'др', 'день рождения'],
  zodiac: ['знак зодиака', 'зодиак'],
  group: ['группа'],
  form: ['форма обучения', 'форма'],
  phone: ['телефон', 'номер телефона'],
  email: ['почта', 'email', 'e-mail'],
  instagram: ['инстаграм', 'instagram', 'инст'],
  telegram: ['телеграм', 'telegram', 'тг'],
  size: ['размер', 'размер одежды'],
  metro: ['метро', 'станция метро'],
  joined: ['дата вступления', 'вступление'],
  left: ['дата ухода', 'уход'],
  photo: ['фото', 'аватар', 'photo'],
};

function normalizeRow(raw) {
  const byHead = {};
  for (const k of Object.keys(raw)) byHead[k.trim().toLowerCase()] = raw[k];
  const out = {};
  for (const [field, names] of Object.entries(COLUMNS)) {
    const key = names.find((n) => n in byHead);
    out[field] = key ? String(byHead[key] ?? '').trim() : '';
  }
  if (empty(out.zodiac)) out.zodiac = zodiac(out.birth);
  return out;
}

async function loadMembers(env) {
  if (cache.rows && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const url = new URL(env.SHEET_URL);
  url.searchParams.set('key', env.SHEET_KEY || '');
  const r = await fetch(url.toString(), { redirect: 'follow' });
  if (!r.ok) throw new Error('sheet ' + r.status);
  const data = await r.json();
  if (data.error) throw new Error('sheet: ' + data.error);
  const rows = (data.rows || []).map(normalizeRow).filter((m) => !empty(m.telegram) || !empty(m.last));
  cache = { at: Date.now(), rows };
  return rows;
}

function findMember(rows, query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const h = handle(q);
  return rows.find((m) => handle(m.telegram) === h)
    || rows.find((m) => handle(m.instagram) === h)
    || rows.find((m) => m.nick && m.nick.toLowerCase() === q.toLowerCase())
    || rows.find((m) => m.last && m.last.toLowerCase() === q.toLowerCase())
    || null;
}

// доступ: админ по ID или человек, чей Telegram-ник есть в таблице (и он ещё не ушёл)
function canSee(env, rows, user) {
  if (!user) return false;
  const admins = String(env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (admins.includes(String(user.id))) return true;
  if (!user.username) return false;
  const me = user.username.toLowerCase();
  return rows.some((m) => handle(m.telegram) === me && empty(m.left));
}

function zodiac(date) {
  const m = String(date || '').match(/(\d{1,2})[./-](\d{1,2})/);
  if (!m) return '';
  const d = +m[1], mo = +m[2];
  const z = [[20, 'Козерог', 'Водолей'], [19, 'Водолей', 'Рыбы'], [21, 'Рыбы', 'Овен'], [20, 'Овен', 'Телец'], [21, 'Телец', 'Близнецы'], [21, 'Близнецы', 'Рак'],
    [23, 'Рак', 'Лев'], [23, 'Лев', 'Дева'], [23, 'Дева', 'Весы'], [23, 'Весы', 'Скорпион'], [22, 'Скорпион', 'Стрелец'], [22, 'Стрелец', 'Козерог']][mo - 1];
  return z ? (d < z[0] ? z[1] : z[2]) : '';
}

/* ---------------- аватарка из публичного профиля Telegram ---------------- */
const avatars = new Map();
async function tgAvatar(nick) {
  const h = handle(nick);
  if (!/^[a-z0-9_]{4,32}$/.test(h)) return '';
  const hit = avatars.get(h);
  if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.url;
  let url = '';
  try {
    const r = await fetch('https://t.me/' + h, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TelegramBot)' } });
    const html = await r.text();
    const m = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (m && !/telegram\.org\/img\/t_logo/.test(m[1])) url = m[1].replace(/&amp;/g, '&');
  } catch (e) { /* нет аватарки — покажем букву */ }
  avatars.set(h, { at: Date.now(), url });
  return url;
}

/* ---------------- ссылки ---------------- */
const tgLink = (v) => (empty(v) ? '' : 'https://t.me/' + handle(v));
const igLink = (v) => (empty(v) ? '' : 'https://instagram.com/' + handle(v));
const at = (v) => (empty(v) ? '' : '@' + handle(v));

/* ---------------- Telegram API ---------------- */
async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

function memberMessage(m) {
  const line = (icon, label, value) => (empty(value) ? '' : `${icon} <b>${label}:</b> ${value}\n`);
  const fio = [m.last, m.first, m.middle].filter((x) => !empty(x)).join(' ');
  let t = `<b>${esc(m.nick || fio || 'Участник')}</b>${empty(m.role) ? '' : ' · <i>' + esc(m.role) + '</i>'}\n`;
  if (fio && m.nick) t += `${esc(fio)}\n`;
  t += '\n';
  t += line('🎂', 'Дата рождения', esc(m.birth) + (empty(m.zodiac) ? '' : ` (${esc(m.zodiac)})`));
  t += line('🎓', 'Группа', [m.group, m.form].filter((x) => !empty(x)).map(esc).join(' · '));
  t += line('📞', 'Телефон', empty(m.phone) ? '' : esc(m.phone));
  t += line('✉️', 'Почта', empty(m.email) ? '' : esc(m.email));
  t += line('📸', 'Инстаграм', empty(m.instagram) ? '' : `<a href="${esc(igLink(m.instagram))}">${esc(at(m.instagram))}</a>`);
  t += line('✈️', 'Телеграм', empty(m.telegram) ? '' : `<a href="${esc(tgLink(m.telegram))}">${esc(at(m.telegram))}</a>`);
  t += line('👕', 'Размер', esc(m.size));
  t += line('🚇', 'Метро', esc(m.metro));
  t += line('📅', 'Дата вступления', esc(m.joined));
  t += line('👋', 'Дата ухода', esc(m.left));
  return t.trim();
}

async function onMessage(env, msg, origin) {
  const text = String(msg.text || '').trim();
  const chat = msg.chat.id;
  const reply = (body) => tg(env, 'sendMessage', { chat_id: chat, parse_mode: 'HTML', disable_web_page_preview: true, ...body });

  if (/^\/start\b/.test(text)) {
    return reply({
      text: '🎁 Привет! Здесь живёт новогодний адвент — открывай по одной коробочке каждый день.',
      reply_markup: env.ADVENT_URL ? { inline_keyboard: [[{ text: '🎄 Открыть адвент', web_app: { url: env.ADVENT_URL } }]] } : undefined,
    });
  }

  const cmd = text.match(/^(?:!инфа|!info|\/info|\/инфа)(?:@\w+)?\s*(.*)$/i);
  if (!cmd) return;
  if (msg.chat.type !== 'private') return; // в группах не отвечаем — данные только в личке

  let rows;
  try { rows = await loadMembers(env); } catch (e) { return reply({ text: 'Не получилось открыть таблицу, попробуй чуть позже.' }); }
  if (!canSee(env, rows, msg.from)) return reply({ text: '🔒 Эта команда доступна только участникам Информа.' });

  const q = cmd[1].trim();
  if (!q) return reply({ text: 'Напиши так: <code>!инфа @ник</code>' });
  const m = findMember(rows, q);
  if (!m) return reply({ text: `Не нашла <b>${esc(q)}</b> в таблице 🤔` });

  const key = handle(m.telegram) || encodeURIComponent(m.last);
  return reply({
    text: memberMessage(m),
    reply_markup: { inline_keyboard: [[{ text: '🪪 Открыть карточку', web_app: { url: `${origin}/card?u=${encodeURIComponent(key)}` } }]] },
  });
}

/* ---------------- проверка initData (подпись Telegram) ---------------- */
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? new TextEncoder().encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data)));
}
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

async function verifyInitData(env, initData, maxAgeSec = 86400) {
  const p = new URLSearchParams(initData || '');
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac('WebAppData', env.BOT_TOKEN);
  if (hex(await hmac(secret, check)) !== hash) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > maxAgeSec) return null;
  try { return JSON.parse(p.get('user') || 'null'); } catch (e) { return null; }
}

/* ---------------- роутинг ---------------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = url.origin;

    if (request.method === 'POST' && url.pathname === `/tg/${env.WEBHOOK_SECRET}`) {
      if (request.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
      const update = await request.json().catch(() => ({}));
      if (update.message) await onMessage(env, update.message, origin).catch((e) => console.error(e));
      return new Response('ok');
    }

    if (url.pathname === '/card') {
      return new Response(CARD_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    if (request.method === 'POST' && url.pathname === '/api/member') {
      const body = await request.json().catch(() => ({}));
      const user = await verifyInitData(env, body.initData);
      if (!user) return json({ error: 'auth' }, 401);
      let rows;
      try { rows = await loadMembers(env); } catch (e) { return json({ error: 'sheet' }, 502); }
      if (!canSee(env, rows, user)) return json({ error: 'forbidden' }, 403);
      const m = findMember(rows, body.u);
      if (!m) return json({ error: 'notfound' }, 404);
      const photo = empty(m.photo) ? await tgAvatar(m.telegram) : m.photo;
      return json({ member: { ...m, photo, telegramUrl: tgLink(m.telegram), instagramUrl: igLink(m.instagram) } });
    }

    if (url.pathname === '/setup') {
      if (url.searchParams.get('key') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
      const res = await tg(env, 'setWebhook', {
        url: `${origin}/tg/${env.WEBHOOK_SECRET}`, secret_token: env.WEBHOOK_SECRET, allowed_updates: ['message'],
      });
      return json(res);
    }

    return new Response('Бот адвента работает 🎄', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};

/* ---------------- HTML карточки ---------------- */
const CARD_HTML = `<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Карточка участника</title>
<script>
  (function(){function p(t){try{if(window.TelegramWebviewProxy&&window.TelegramWebviewProxy.postEvent)window.TelegramWebviewProxy.postEvent(t,'{}');else if(window.parent!==window)window.parent.postMessage(JSON.stringify({eventType:t,eventData:{}}),'*');}catch(e){}}p('web_app_ready');p('web_app_expand');})();
</script>
<script src="https://telegram.org/js/telegram-web-app.js" async></script>
<style>
  :root{--bg:#182633;--field:#28323e;--label:#8a94a0;--text:#eef1f4}
  *{box-sizing:border-box}
  html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font:500 13.5px/1.25 -apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:460px;margin:0 auto;padding:10px 8px calc(14px + env(safe-area-inset-bottom))}
  .head{display:flex;align-items:center;gap:10px;padding:2px 2px 9px}
  .ava{width:44px;height:44px;border-radius:50%;flex:none;background:#2f3c4b center/cover no-repeat;display:grid;place-items:center;font-weight:700;font-size:19px;color:var(--text)}
  .nick{font-weight:700;font-size:16px;margin:0;letter-spacing:-.01em}
  .role{margin:2px 0 0;color:var(--label);font-size:13px;font-weight:500}
  .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
  .f{grid-column:span 3;min-width:0;background:var(--field);border-radius:9px;padding:6px 6px 7px}
  .f.third{grid-column:span 2}
  .f.gap{margin-top:4px}
  .l{font-size:11.5px;color:var(--label);margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .v{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  a.v{display:block;color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
  .f.link{cursor:pointer;transition:background .15s}
  .f.link:active{background:#323d4a}
  .msg{text-align:center;padding:60px 20px;color:var(--label)}
  .msg b{display:block;font-size:18px;color:var(--text);margin-bottom:6px}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#eef1f4;color:#182633;font-weight:600;padding:10px 16px;border-radius:99px;opacity:0;transition:.25s;pointer-events:none;white-space:nowrap}
  .toast.on{opacity:1;transform:translateX(-50%)}
</style></head>
<body><div class="wrap"><div id="root" class="msg">Загружаю карточку…</div></div><div class="toast" id="toast"></div>
<script>
(function(){
  var root=document.getElementById('root');
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function emp(v){v=String(v==null?'':v).trim();return !v||v==='-'||v==='—'}
  function toast(t){var el=document.getElementById('toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('on')},1800)}
  function fail(title,text){root.className='msg';root.innerHTML='<b>'+esc(title)+'</b>'+esc(text||'')}
  function field(label,value,cls,href,kind){
    var v=emp(value)?'-':value;
    if(href&&!emp(value)) return '<div class="f link '+(cls||'')+'" data-href="1"><div class="l">'+esc(label)+'</div><a class="v" href="'+esc(href)+'" data-kind="'+kind+'" data-value="'+esc(value)+'">'+esc(v)+'</a></div>';
    return '<div class="f '+(cls||'')+'"><div class="l">'+esc(label)+'</div><div class="v">'+esc(v)+'</div></div>';
  }
  function at(v){return emp(v)?v:'@'+String(v).replace(/^.*\\//,'').replace(/^@/,'')}
  function render(m){
    var name=m.nick||[m.first,m.last].filter(Boolean).join(' ')||'Участник';
    var ava=m.photo?'<div class="ava" style="background-image:url(\\''+esc(m.photo)+'\\')"></div>':'<div class="ava">'+esc(name.charAt(0).toUpperCase())+'</div>';
    document.title=name;
    root.className='card';
    root.innerHTML='<div class="head">'+ava+'<div><p class="nick">'+esc(name)+'</p>'+(emp(m.role)?'':'<p class="role">'+esc(m.role)+'</p>')+'</div></div>'+
      '<div class="grid">'+
      field('Фамилия',m.last,'third')+field('Имя',m.first,'third')+field('Отчество',m.middle,'third')+
      field('Дата рождения',m.birth,'gap')+field('Знак зодиака',m.zodiac,'gap')+
      field('Группа',m.group)+field('Форма обучения',m.form)+
      field('Телефон',m.phone,'',emp(m.phone)?'':'tel:'+String(m.phone).replace(/[^+\\d]/g,''),'tel')+field('Почта',m.email,'','mailto:'+m.email,'mail')+
      field('Инстаграм',at(m.instagram),'',m.instagramUrl,'ig')+field('Телеграм',at(m.telegram),'',m.telegramUrl,'tg')+
      field('Размер',m.size)+field('Метро',m.metro)+
      field('Дата вступления',m.joined)+field('Дата ухода',m.left)+
      '</div>';
  }
  document.addEventListener('click',function(e){
    var box=e.target.closest('.f.link'); if(!box) return;
    var a=box.querySelector('a.v'); if(e.target!==a){ e.preventDefault(); }
    var tg=window.Telegram&&window.Telegram.WebApp, kind=a.dataset.kind, href=a.getAttribute('href');
    if(kind==='mail'||kind==='tel'){ try{navigator.clipboard.writeText(a.dataset.value);toast('Скопировано: '+a.dataset.value)}catch(_){} if(e.target!==a) location.href=href; return; }
    e.preventDefault();
    if(!tg||!tg.initData){ window.open(href,'_blank'); return; }
    if(kind==='tg'&&tg.openTelegramLink) tg.openTelegramLink(href); else if(tg.openLink) tg.openLink(href);
  });
  function start(){
    var tg=window.Telegram&&window.Telegram.WebApp;
    if(tg){try{tg.ready();tg.expand();tg.setHeaderColor('#182633');tg.setBackgroundColor('#182633')}catch(e){}}
    var initData=tg&&tg.initData;
    if(!initData) return fail('Открой карточку в Telegram','Страница работает только из бота.');
    var u=new URLSearchParams(location.search).get('u')||'';
    fetch('/api/member',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:initData,u:u})})
      .then(function(r){return r.json().then(function(d){return {s:r.status,d:d}})})
      .then(function(x){
        if(x.d.member) return render(x.d.member);
        if(x.s===403) return fail('Нет доступа','Карточки видят только участники Информа.');
        if(x.s===404) return fail('Не нашла участника','Проверь ник в таблице.');
        fail('Что-то пошло не так','Попробуй открыть ещё раз.');
      }).catch(function(){fail('Нет связи','Проверь интернет и попробуй ещё раз.')});
  }
  var n=0;(function wait(){ if((window.Telegram&&window.Telegram.WebApp)||n++>25) start(); else setTimeout(wait,100); })();
})();
</script></body></html>`;

// для тестов
export const _test = { normalizeRow, findMember, canSee, zodiac, handle, memberMessage, verifyInitData, hmac, hex };
