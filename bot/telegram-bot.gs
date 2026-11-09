/**
 * Бот адвента целиком в Google Apps Script (внутри таблицы с анкетами Информа).
 *
 *   /start          — приветствие и кнопка «Открыть адвент»
 *   !инфа @ник      — карточка участника (только в личке и только для участников из таблицы / ADMIN_IDS)
 *   кнопка карточки — открывает card.html на GitHub Pages, она берёт данные отсюда (doGet)
 *
 * Свойства скрипта (Настройки проекта → Свойства скрипта):
 *   BOT_TOKEN   — токен бота из @BotFather                         (обязательно)
 *   ADMIN_IDS   — Telegram ID через запятую, у кого доступ всегда    (необязательно)
 *   WEBAPP_URL  — адрес этого веб-приложения (…/exec)               (обязательно, после развёртывания)
 *   ADVENT_URL  — ссылка на мини-апп адвента                         (по умолчанию ниже)
 *   CARD_URL    — страница карточки                                  (по умолчанию ниже)
 *   SECRET      — создаётся сам при запуске setup()
 */

const DEFAULT_ADVENT_URL = 'https://piccologatto01.github.io/nice_advent/';
const DEFAULT_CARD_URL = 'https://piccologatto01.github.io/nice_advent/card.html';
const SHEET_NAME = ''; // пусто — первый лист

/* ===================== настройка ===================== */

// Запустите один раз из редактора (кнопка «Выполнить» с выбранной функцией setup).
function setup() {
  const P = PropertiesService.getScriptProperties();
  if (!P.getProperty('BOT_TOKEN')) throw new Error('Добавьте свойство скрипта BOT_TOKEN');
  const url = P.getProperty('WEBAPP_URL');
  if (!url || !/\/exec$/.test(url)) throw new Error('Добавьте свойство WEBAPP_URL — адрес веб-приложения, оканчивающийся на /exec');
  let secret = P.getProperty('SECRET');
  if (!secret) { secret = Utilities.getUuid().replace(/-/g, ''); P.setProperty('SECRET', secret); }
  const res = tg_('setWebhook', { url: url + '?s=' + secret, allowed_updates: ['message'], drop_pending_updates: true });
  const me = tg_('getMe', {});
  Logger.log('Webhook: ' + JSON.stringify(res));
  Logger.log('Бот: @' + (me.result && me.result.username));
  Logger.log('Участников в таблице: ' + loadMembers_(true).length);
}

/* ===================== входящие запросы ===================== */

// Telegram присылает сообщения сюда
function doPost(e) {
  const P = PropertiesService.getScriptProperties();
  if (!e || !e.parameter || e.parameter.s !== P.getProperty('SECRET')) return text_('forbidden');
  let upd;
  try { upd = JSON.parse(e.postData.contents); } catch (err) { return text_('ok'); }

  // Telegram может прислать одно и то же обновление повторно — отвечаем один раз
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  const cache = CacheService.getScriptCache();
  const key = 'upd_' + upd.update_id;
  const seen = cache.get(key);
  if (!seen) cache.put(key, '1', 21600);
  lock.releaseLock();
  if (seen) return text_('ok');

  try { if (upd.message) onMessage_(upd.message); } catch (err) { console.error(err); }
  return text_('ok');
}

// card.html запрашивает данные карточки: ?action=member&u=ник&initData=…
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'member') return text_('Бот адвента работает 🎄');
  const user = verifyInitData_(p.initData || '');
  if (!user) return json_({ error: 'auth' });
  let rows;
  try { rows = loadMembers_(); } catch (err) { return json_({ error: 'sheet' }); }
  if (!canSee_(rows, user)) return json_({ error: 'forbidden' });
  const m = findMember_(rows, p.u);
  if (!m) return json_({ error: 'notfound' });
  const photo = empty_(m.photo) ? tgAvatar_(m.telegram) : m.photo;
  return json_({ member: Object.assign({}, m, { photo: photo, telegramUrl: tgLink_(m.telegram), instagramUrl: igLink_(m.instagram) }) });
}

/* ===================== сообщения ===================== */

function onMessage_(msg) {
  const P = PropertiesService.getScriptProperties();
  const text = String(msg.text || '').trim();
  const reply = function (body) {
    return tg_('sendMessage', Object.assign({ chat_id: msg.chat.id, parse_mode: 'HTML', disable_web_page_preview: true }, body));
  };

  if (/^\/start\b/.test(text)) {
    return reply({
      text: '🎁 Привет! Здесь живёт новогодний адвент — открывай по одной коробочке каждый день.',
      reply_markup: { inline_keyboard: [[{ text: '🎄 Открыть адвент', web_app: { url: P.getProperty('ADVENT_URL') || DEFAULT_ADVENT_URL } }]] },
    });
  }

  const cmd = text.match(/^(?:!инфа|!info|\/info|\/инфа)(?:@\w+)?\s*(.*)$/i);
  if (!cmd) return;
  if (msg.chat.type !== 'private') return; // данные — только в личке

  let rows;
  try { rows = loadMembers_(); } catch (err) { return reply({ text: 'Не получилось открыть таблицу, попробуй чуть позже.' }); }
  if (!canSee_(rows, msg.from)) return reply({ text: '🔒 Эта команда доступна только участникам Информа.' });

  const q = cmd[1].trim();
  if (!q) return reply({ text: 'Напиши так: <code>!инфа @ник</code>' });
  const m = findMember_(rows, q);
  if (!m) return reply({ text: 'Не нашла <b>' + esc_(q) + '</b> в таблице 🤔' });

  const key = handle_(m.telegram) || m.last;
  const cardUrl = (P.getProperty('CARD_URL') || DEFAULT_CARD_URL) +
    '?u=' + encodeURIComponent(key) + '&api=' + encodeURIComponent(P.getProperty('WEBAPP_URL') || '');
  return reply({
    text: memberMessage_(m),
    reply_markup: { inline_keyboard: [[{ text: '🪪 Открыть карточку', web_app: { url: cardUrl } }]] },
  });
}

function memberMessage_(m) {
  const line = function (icon, label, value) { return empty_(value) ? '' : icon + ' <b>' + label + ':</b> ' + value + '\n'; };
  const fio = [m.last, m.first, m.middle].filter(function (x) { return !empty_(x); }).join(' ');
  let t = '<b>' + esc_(m.nick || fio || 'Участник') + '</b>' + (empty_(m.role) ? '' : ' · <i>' + esc_(m.role) + '</i>') + '\n';
  if (fio && m.nick) t += esc_(fio) + '\n';
  t += '\n';
  t += line('🎂', 'Дата рождения', empty_(m.birth) ? '' : esc_(m.birth) + (empty_(m.zodiac) ? '' : ' (' + esc_(m.zodiac) + ')'));
  t += line('🎓', 'Группа', [m.group, m.form].filter(function (x) { return !empty_(x); }).map(esc_).join(' · '));
  t += line('📞', 'Телефон', empty_(m.phone) ? '' : esc_(m.phone));
  t += line('✉️', 'Почта', empty_(m.email) ? '' : esc_(m.email));
  t += line('📸', 'Инстаграм', empty_(m.instagram) ? '' : '<a href="' + esc_(igLink_(m.instagram)) + '">' + esc_(at_(m.instagram)) + '</a>');
  t += line('✈️', 'Телеграм', empty_(m.telegram) ? '' : '<a href="' + esc_(tgLink_(m.telegram)) + '">' + esc_(at_(m.telegram)) + '</a>');
  t += line('👕', 'Размер', empty_(m.size) ? '' : esc_(m.size));
  t += line('🚇', 'Метро', empty_(m.metro) ? '' : esc_(m.metro));
  t += line('📅', 'Дата вступления', empty_(m.joined) ? '' : esc_(m.joined));
  t += line('👋', 'Дата ухода', empty_(m.left) ? '' : esc_(m.left));
  return t.trim();
}

/* ===================== таблица ===================== */

const COLUMNS_ = {
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

function loadMembers_(fresh) {
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const hit = cache.get('members');
    if (hit) return JSON.parse(hit);
  }
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME ? book.getSheetByName(SHEET_NAME) : book.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const head = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  const idx = {};
  Object.keys(COLUMNS_).forEach(function (f) {
    idx[f] = head.findIndex(function (h) { return COLUMNS_[f].indexOf(h) !== -1; });
  });
  const rows = values.slice(1).map(function (r) {
    const m = {};
    Object.keys(idx).forEach(function (f) { m[f] = idx[f] >= 0 ? String(r[idx[f]] || '').trim() : ''; });
    if (empty_(m.zodiac)) m.zodiac = zodiac_(m.birth);
    return m;
  }).filter(function (m) { return !empty_(m.telegram) || !empty_(m.last); });
  try { cache.put('members', JSON.stringify(rows), 300); } catch (err) { /* слишком большая таблица для кэша — не страшно */ }
  return rows;
}

function findMember_(rows, query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const h = handle_(q), lq = q.toLowerCase();
  return rows.find(function (m) { return handle_(m.telegram) === h; })
    || rows.find(function (m) { return handle_(m.instagram) === h; })
    || rows.find(function (m) { return m.nick && m.nick.toLowerCase() === lq; })
    || rows.find(function (m) { return m.last && m.last.toLowerCase() === lq; })
    || null;
}

// доступ: админ по ID или участник, чей Telegram-ник есть в таблице и нет даты ухода
function canSee_(rows, user) {
  if (!user) return false;
  const admins = String(PropertiesService.getScriptProperties().getProperty('ADMIN_IDS') || '')
    .split(',').map(function (s) { return s.trim(); }).filter(String);
  if (admins.indexOf(String(user.id)) !== -1) return true;
  if (!user.username) return false;
  const me = user.username.toLowerCase();
  return rows.some(function (m) { return handle_(m.telegram) === me && empty_(m.left); });
}

/* ===================== проверка подписи Telegram (initData) ===================== */

function verifyInitData_(initData) {
  if (!initData) return null;
  const pairs = {};
  String(initData).split('&').forEach(function (part) {
    const i = part.indexOf('=');
    if (i < 0) return;
    const dec = function (s) { return decodeURIComponent(s.replace(/\+/g, '%20')); };
    pairs[dec(part.slice(0, i))] = dec(part.slice(i + 1));
  });
  const hash = pairs.hash;
  if (!hash) return null;
  delete pairs.hash;
  const check = Object.keys(pairs).sort().map(function (k) { return k + '=' + pairs[k]; }).join('\n');
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  const secret = Utilities.computeHmacSha256Signature(Utilities.newBlob(token).getBytes(), Utilities.newBlob('WebAppData').getBytes());
  const sign = Utilities.computeHmacSha256Signature(Utilities.newBlob(check).getBytes(), secret);
  if (hex_(sign) !== hash) return null;
  if (Date.now() / 1000 - Number(pairs.auth_date || 0) > 86400) return null;
  try { return JSON.parse(pairs.user || 'null'); } catch (err) { return null; }
}

function hex_(bytes) {
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

/* ===================== утилиты ===================== */

function tg_(method, body) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  const r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  try { return JSON.parse(r.getContentText()); } catch (err) { return { ok: false }; }
}

// аватарка из публичного профиля t.me/ник (кэш 6 часов)
function tgAvatar_(nick) {
  const h = handle_(nick);
  if (!/^[a-z0-9_]{4,32}$/.test(h)) return '';
  const cache = CacheService.getScriptCache();
  const hit = cache.get('ava_' + h);
  if (hit !== null) return hit;
  let url = '';
  try {
    const html = UrlFetchApp.fetch('https://t.me/' + h, { muteHttpExceptions: true }).getContentText();
    const m = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (m && !/telegram\.org\/img\/t_logo/.test(m[1])) url = m[1].replace(/&amp;/g, '&');
  } catch (err) { /* без аватарки */ }
  cache.put('ava_' + h, url, 21600);
  return url;
}

function zodiac_(date) {
  const m = String(date || '').match(/(\d{1,2})[./-](\d{1,2})/);
  if (!m) return '';
  const d = +m[1], mo = +m[2];
  const z = [[20, 'Козерог', 'Водолей'], [19, 'Водолей', 'Рыбы'], [21, 'Рыбы', 'Овен'], [20, 'Овен', 'Телец'], [21, 'Телец', 'Близнецы'], [21, 'Близнецы', 'Рак'],
    [23, 'Рак', 'Лев'], [23, 'Лев', 'Дева'], [23, 'Дева', 'Весы'], [23, 'Весы', 'Скорпион'], [22, 'Скорпион', 'Стрелец'], [22, 'Стрелец', 'Козерог']][mo - 1];
  return z ? (d < z[0] ? z[1] : z[2]) : '';
}

function handle_(v) {
  return String(v || '').trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(t\.me|telegram\.me|instagram\.com)\//i, '')
    .replace(/^@/, '').replace(/[/?#].*$/, '').toLowerCase();
}
function empty_(v) { v = String(v == null ? '' : v).trim(); return v === '' || v === '-' || v === '—'; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function tgLink_(v) { return empty_(v) ? '' : 'https://t.me/' + handle_(v); }
function igLink_(v) { return empty_(v) ? '' : 'https://instagram.com/' + handle_(v); }
function at_(v) { return empty_(v) ? '' : '@' + handle_(v); }
function text_(s) { return ContentService.createTextOutput(s); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
