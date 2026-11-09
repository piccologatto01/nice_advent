/**
 * Читает лист с анкетами участников Информа и отдаёт его боту в JSON.
 * Таблица остаётся закрытой: ответ получает только тот, кто знает ключ (KEY).
 *
 * Установка: Таблица → Расширения → Apps Script → вставить этот код →
 * Настройки проекта (шестерёнка) → Свойства скрипта → добавить KEY = <длинный случайный ключ> →
 * Начать развертывание → Новое развертывание → Тип «Веб-приложение»,
 * «Запуск от имени: я», «Доступ: все» → скопировать URL (…/exec).
 */

// Название листа с анкетами. Пусто — берётся первый лист.
const SHEET_NAME = '';

function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (!key || !e || !e.parameter || e.parameter.key !== key) {
    return out({ error: 'forbidden' });
  }
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME ? book.getSheetByName(SHEET_NAME) : book.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues(); // даты — как видно в таблице, например 24.04.2007
  const head = values[0].map(function (h) { return String(h).trim(); });
  const rows = values.slice(1)
    .filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); })
    .map(function (r) {
      const o = {};
      head.forEach(function (h, i) { if (h) o[h] = r[i]; });
      return o;
    });
  return out({ rows: rows });
}

function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
