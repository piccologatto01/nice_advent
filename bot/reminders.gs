/**
 * Напоминания о дедлайнах по контент-плану СММ.
 *
 * Каждое утро бот проходит по листам контент-плана (там, где есть «Стадия работы»), находит задачи
 * «Текст» / «Вычитка» / «Дизайн» с дедлайном через 3 дня, завтра или сегодня и присылает админам
 * (REMIND_ADMINS) готовые сообщения — по одному на человека, чтобы их было удобно переслать.
 *
 * Свойства скрипта:
 *   SMM_SHEET_ID    — ID Google-таблицы контент-плана (из её адреса …/spreadsheets/d/<ID>/edit)   (обязательно)
 *   REMIND_ADMINS   — ники админов через запятую (по умолчанию mol0ko000,sspinozza)
 *   REMIND_HOUR     — во сколько присылать, час по Москве (по умолчанию 10)
 *
 * Запустите один раз из редактора функцию setupReminders: она создаст ежедневный запуск и лист
 * «Ники для напоминаний» (имя как в контент-плане → Telegram-ник) в таблице анкет.
 * Админы должны хотя бы раз написать боту (/start), иначе он не сможет им писать.
 * Команда в личке с ботом (для админов): «!напоминания» — прислать сегодняшние сейчас,
 * «!напоминания завтра» — посмотреть, что придёт завтра.
 */

const REMIND_TZ = 'Europe/Moscow';
const ALIAS_SHEET = 'Ники для напоминаний';
const ROLES_ = [
  { head: 'текст', nom: 'текст', dat: 'тексту', acc: 'текст' },
  { head: 'вычитка', nom: 'вычитка', dat: 'вычитке', acc: 'вычитку' },
  { head: 'дизайн', nom: 'диз', dat: 'дизу', acc: 'диз' },
];
const OFFSETS_ = [3, 1, 0]; // за сколько дней напоминать

/* ===================== настройка ===================== */

function setupReminders() {
  const P = PropertiesService.getScriptProperties();
  if (!P.getProperty('SMM_SHEET_ID')) throw new Error('Добавьте свойство скрипта SMM_SHEET_ID — ID таблицы контент-плана');
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t);
  });
  const hour = Number(P.getProperty('REMIND_HOUR') || 10);
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(hour).inTimezone(REMIND_TZ).create();
  Logger.log('Ежедневные напоминания: каждый день около ' + hour + ':00 по Москве');

  // лист с никами: дописываем имена из плана, которых бот не нашёл
  const sheet = aliasSheet_();
  const known = aliases_();
  const members = loadMembers_(true);
  const missing = {};
  planTasks_().forEach(function (t) {
    t.people.forEach(function (name) {
      if (!resolveNick_(name, members, known)) missing[name] = true;
    });
  });
  const add = Object.keys(missing).filter(function (n) { return !(norm_(n) in known); });
  if (add.length) sheet.getRange(sheet.getLastRow() + 1, 1, add.length, 2).setValues(add.map(function (n) { return [n, '']; }));
  Logger.log('Не нашла ник для: ' + (Object.keys(missing).join(', ') || 'всех нашла 🎉') +
    (add.length ? '\nДобавила их в лист «' + ALIAS_SHEET + '» — впишите ники во второй столбец.' : ''));
  Logger.log('Админы, которые уже писали боту: ' + (adminChats_().map(function (a) { return '@' + a.nick; }).join(', ') || 'пока никто'));
}

/* ===================== рассылка ===================== */

// Запускается триггером каждое утро
function sendReminders() {
  const msgs = buildReminders_(0);
  if (!msgs.items.length && !msgs.unknown.length) return;
  adminChats_().forEach(function (a) { sendDigest_(a.chat, msgs, 0); });
}

function sendDigest_(chatId, msgs, dayShift) {
  const dd = addDays_(today_(), dayShift);
  const day = dd.getUTCDate() + ' ' + MONTHS_GEN_[dd.getUTCMonth()];
  if (!msgs.items.length) {
    tg_('sendMessage', { chat_id: chatId, text: (dayShift ? 'На ' + day : 'На сегодня') + ' дедлайнов в контент-плане нет 🎉' });
  } else {
    tg_('sendMessage', {
      chat_id: chatId, parse_mode: 'HTML',
      text: '📋 <b>Напоминания на ' + day + '</b> — ' + msgs.items.length + ' ' + plural_(msgs.items.length, 'сообщение', 'сообщения', 'сообщений') +
        '\nПерешли их активистам 👇',
    });
    msgs.items.forEach(function (it) { tg_('sendMessage', { chat_id: chatId, text: it.text, disable_web_page_preview: true }); });
  }
  if (msgs.unknown.length) {
    tg_('sendMessage', {
      chat_id: chatId, parse_mode: 'HTML',
      text: '⚠️ Не нашла Telegram-ник для: ' + msgs.unknown.map(esc_).join(', ') +
        '\nВпиши их в лист «' + ALIAS_SHEET + '» в таблице анкет — в сообщениях выше они без @.',
    });
  }
}

// Команда «!напоминания» в личке от админа
function onRemindCommand_(msg, arg) {
  const shift = /завтра/i.test(arg) ? 1 : 0;
  let msgs;
  try { msgs = buildReminders_(shift); } catch (err) {
    return tg_('sendMessage', { chat_id: msg.chat.id, text: 'Не получилось открыть контент-план: ' + err.message });
  }
  return sendDigest_(msg.chat.id, msgs, shift);
}

/* ===================== админы ===================== */

function remindAdmins_() {
  return String(PropertiesService.getScriptProperties().getProperty('REMIND_ADMINS') || 'mol0ko000,sspinozza')
    .split(',').map(handle_).filter(String);
}

function isRemindAdmin_(user) {
  return !!(user && user.username && remindAdmins_().indexOf(user.username.toLowerCase()) !== -1);
}

// Запоминаем чат админа, когда он пишет боту (бот не может написать первым)
function rememberAdmin_(msg) {
  if (msg.chat.type !== 'private' || !isRemindAdmin_(msg.from)) return;
  const P = PropertiesService.getScriptProperties();
  const key = 'ADMIN_CHAT_' + msg.from.username.toLowerCase();
  if (P.getProperty(key) !== String(msg.chat.id)) P.setProperty(key, String(msg.chat.id));
}

function adminChats_() {
  const P = PropertiesService.getScriptProperties();
  return remindAdmins_().map(function (nick) { return { nick: nick, chat: P.getProperty('ADMIN_CHAT_' + nick) }; })
    .filter(function (a) { return a.chat; });
}

/* ===================== контент-план ===================== */

// Все задачи из листов контент-плана: { topic, role, deadline: 'yyyy-MM-dd', people: [имена] }
function planTasks_() {
  const id = PropertiesService.getScriptProperties().getProperty('SMM_SHEET_ID');
  const book = SpreadsheetApp.openById(id);
  const tz = book.getSpreadsheetTimeZone() || REMIND_TZ;
  const out = [];
  book.getSheets().forEach(function (sheet) {
    const last = sheet.getLastRow(), cols = sheet.getLastColumn();
    if (last < 3 || cols < 3) return;
    const values = sheet.getRange(1, 1, last, cols).getValues();
    // строка заголовков — та, где есть «Стадия работы»
    let h = -1;
    for (let i = 0; i < Math.min(5, values.length); i++) {
      if (values[i].some(function (c) { return norm_(c) === 'стадия работы'; })) { h = i; break; }
    }
    if (h < 0) return;
    const head = values[h].map(norm_);
    const col = function (name) { return head.indexOf(name); };
    const cStage = col('стадия работы'), cTopic = col('тема');
    const roles = ROLES_.map(function (r) { return { role: r, c: col(r.head) }; }).filter(function (r) { return r.c >= 0 && r.c + 1 < cols; });
    if (cTopic < 0 || !roles.length) return;
    for (let i = h + 1; i < values.length; i++) {
      const row = values[i];
      const stage = norm_(row[cStage]);
      const topic = String(row[cTopic] || '').trim();
      if (!topic || /^(выложили|умер|умерло|в отложке|отложено|отменили|отмена)$/.test(stage)) continue;
      roles.forEach(function (r) {
        if (stage === 'на плашках' && r.role.head !== 'дизайн') return;      // текст и вычитка уже готовы
        if (stage === 'на вычитке' && r.role.head === 'текст') return;
        const d = row[r.c + 1];
        if (!(d instanceof Date) || isNaN(d)) return;
        const people = String(row[r.c] || '').split(/[,;\/+&\n]|\sи\s/).map(function (s) { return s.trim(); })
          .filter(function (s) { return s && s !== '-' && s !== '—'; });
        if (!people.length) return;
        out.push({ topic: topic, role: r.role, deadline: Utilities.formatDate(d, tz, 'yyyy-MM-dd'), people: people });
      });
    }
  });
  return out;
}

// Сообщения на день (dayShift: 0 — сегодня, 1 — завтра). Одно сообщение на человека.
function buildReminders_(dayShift) {
  const base = addDays_(today_(), dayShift || 0);
  const dayKey = function (n) { return Utilities.formatDate(addDays_(base, n), REMIND_TZ, 'yyyy-MM-dd'); };
  const when = {};
  OFFSETS_.forEach(function (n) { when[dayKey(n)] = n; });

  const members = loadMembers_();
  const known = aliases_();
  const byPerson = {};
  const unknown = {};
  planTasks_().forEach(function (t) {
    if (!(t.deadline in when)) return;
    t.people.forEach(function (name) {
      const nick = resolveNick_(name, members, known);
      if (!nick) unknown[name] = true;
      const key = nick ? '@' + nick : name;
      (byPerson[key] = byPerson[key] || []).push({ topic: t.topic, role: t.role, days: when[t.deadline] });
    });
  });

  const items = Object.keys(byPerson).map(function (who) {
    const tasks = byPerson[who].sort(function (a, b) { return a.days - b.days; });
    return { who: who, text: reminderText_(who, tasks) };
  }).sort(function (a, b) { return a.who.localeCompare(b.who); });
  return { items: items, unknown: Object.keys(unknown) };
}

/* ===================== шаблоны ===================== */

const GREETS_ = ['прив!', 'привет!', 'приветик!', 'добр утро!', 'доброе утро ☀️', 'хэй!'];

const ONE_ = {
  3: [
    '{who} {hi} загляни в смм 👀 у тебя ддл по {dat} через три дня по посту «{topic}»',
    '{who} {hi} через три дня ддл по {dat} по посту «{topic}», загляни в смм, когда будет минутка',
    '{who} {hi} напоминалочка 📌 ддл по {dat} к посту «{topic}» — через три дня',
  ],
  1: [
    '{who} {hi} загляни в смм, у тебя ддл по {dat} уже завтра по посту «{topic}»',
    '{who} {hi} завтра ддл по {dat} — пост «{topic}» ⏳',
    '{who} {hi} напоминаю: завтра сдаём {acc} к посту «{topic}»',
  ],
  0: [
    '{who} {hi} сегодня ддл по {dat} по посту «{topic}» 🔥 загляни в смм',
    '{who} {hi} у тебя сегодня ддл по {dat} — «{topic}». ждём! 💪',
    '{who} {hi} день икс ✨ сегодня сдаём {acc} к посту «{topic}»',
  ],
};
const MANY_ = [
  '{who} {hi} загляни в смм 👀 у тебя ддлы:\n{list}',
  '{who} {hi} напоминалочка по смм 📌\n{list}',
];
const WHEN_ = { 3: 'через три дня', 1: 'завтра', 0: 'сегодня' };

function reminderText_(who, tasks) {
  const hi = pick_(GREETS_);
  if (tasks.length === 1) {
    const t = tasks[0];
    return fill_(pick_(ONE_[t.days]), { who: who, hi: hi, dat: t.role.dat, acc: t.role.acc, topic: t.topic });
  }
  const list = tasks.map(function (t) { return '• ' + t.role.nom + ' — «' + t.topic + '» — ' + WHEN_[t.days]; }).join('\n');
  return fill_(pick_(MANY_), { who: who, hi: hi, list: list });
}

function fill_(tpl, v) { return tpl.replace(/\{(\w+)\}/g, function (_, k) { return v[k] == null ? '' : v[k]; }); }
function pick_(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ===================== имена → ники ===================== */

function aliasSheet_() {
  const book = book_();
  let sheet = book.getSheetByName(ALIAS_SHEET);
  if (!sheet) {
    sheet = book.insertSheet(ALIAS_SHEET);
    sheet.getRange(1, 1, 1, 2).setValues([['Как в контент-плане', 'Телеграм']]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// { 'плышевский леша': 'lyosha_p', … } из листа «Ники для напоминаний»
function aliases_() {
  const sheet = book_().getSheetByName(ALIAS_SHEET);
  const out = {};
  if (!sheet || sheet.getLastRow() < 2) return out;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues().forEach(function (r) {
    if (String(r[0]).trim()) out[norm_(r[0])] = handle_(r[1]);
  });
  return out;
}

// Ник по имени из контент-плана: сначала лист «Ники…», потом таблица анкет по фамилии (и имени, если фамилия не уникальна)
function resolveNick_(name, members, known) {
  const n = norm_(name);
  if (known[n]) return known[n];
  const words = n.split(/\s+/);
  let found = members.filter(function (m) { return !empty_(m.telegram) && m.last && words.indexOf(norm_(m.last)) !== -1; });
  if (found.length > 1) {
    found = found.filter(function (m) {
      const f = norm_(m.first).slice(0, 3);
      return f && words.some(function (w) { return w !== norm_(m.last) && w.slice(0, 3) === f; });
    });
  }
  if (found.length === 1) return handle_(found[0].telegram);
  // по нику из анкеты (например, «Молоко» = @mol0ko000)
  const byNick = members.filter(function (m) { return !empty_(m.telegram) && words.indexOf(handle_(m.telegram)) !== -1; });
  return byNick.length === 1 ? handle_(byNick[0].telegram) : '';
}

/* ===================== даты и мелочи ===================== */

function today_() {
  const s = Utilities.formatDate(new Date(), REMIND_TZ, 'yyyy-MM-dd').split('-');
  return new Date(Date.UTC(+s[0], +s[1] - 1, +s[2], 12));   // полдень UTC, чтобы сдвиг дней не зависел от часового пояса
}
function addDays_(d, n) { return new Date(d.getTime() + n * 86400000); }
function norm_(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' '); }
function plural_(n, a, b, c) { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m > 1 && m < 5 ? b : m === 1 ? a : c; }
const MONTHS_GEN_ = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
