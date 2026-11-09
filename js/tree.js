/* Общая ёлка: каждый пользователь может повесить до 3 игрушек.
   Хранилище:
   - если в config.js заполнен tree.firebaseUrl — игрушки хранятся в Firebase Realtime Database
     и видны всем пользователям (данные: /ornaments/<userId>/<0|1|2>);
   - иначе — локально на устройстве (видны только самому пользователю). */
(function () {
  'use strict';

  const CFG = window.ADVENT_CONFIG.tree || {};
  const UI = window.ADVENT_UI;
  const D = window.DECOR;
  const $ = (s) => document.querySelector(s);
  const MAX = CFG.maxPerUser || 3;
  const POLL_MS = 20000;
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- кто я ---------- */
  const tgUser = UI.tg && UI.tg.initDataUnsafe && UI.tg.initDataUnsafe.user;
  const me = (() => {
    if (tgUser && tgUser.id) return { id: 'tg' + tgUser.id, name: tgUser.first_name || 'Гость' };
    let id;
    try { id = localStorage.getItem('advent_uid'); } catch (e) {}
    if (!id) {
      id = 'web' + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem('advent_uid', id); } catch (e) {}
    }
    return { id, name: 'Гость' };
  })();

  /* ---------- хранилище ---------- */
  const base = (CFG.firebaseUrl || '').replace(/\/+$/, '');
  const shared = !!base;
  const LOCAL_KEY = 'advent_tree_local';

  // запрос с таймаутом, чтобы ёлка не «висела», если база недоступна
  function fetchT(url, opts, ms = 8000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    return fetch(url, { ...(opts || {}), signal: ctl.signal }).finally(() => clearTimeout(t));
  }

  const store = shared
    ? {
        async load() {
          const r = await fetchT(`${base}/ornaments.json`, { cache: 'no-store' });
          if (!r.ok) throw new Error('load ' + r.status);
          return flatten(await r.json());
        },
        async put(slot, o) {
          const r = await fetchT(`${base}/ornaments/${encodeURIComponent(me.id)}/${slot}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o),
          });
          if (!r.ok) throw new Error('put ' + r.status);
        },
      }
    : {
        async load() {
          try { return flatten(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')); } catch (e) { return []; }
        },
        async put(slot, o) {
          let all = {};
          try { all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {}; } catch (e) {}
          all[me.id] = all[me.id] || {};
          all[me.id][slot] = o;
          localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
        },
      };

  // { uid: {0: {...}, 2: {...}} | [..] } → [{uid, slot, t, x, y, n, ts}]
  function flatten(data) {
    const out = [];
    if (!data || typeof data !== 'object') return out;
    for (const uid of Object.keys(data)) {
      const slots = data[uid];
      if (!slots || typeof slots !== 'object') continue;
      for (const slot of Object.keys(slots)) {
        const o = slots[slot];
        if (!o || typeof o !== 'object') continue;
        const t = Number(o.t), x = Number(o.x), y = Number(o.y);
        if (!Number.isFinite(t) || !Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (!D.onBranch(x, y)) continue;
        out.push({ uid, slot: Number(slot), t: Math.round(t), x, y, n: String(o.n || '').slice(0, 40), ts: Number(o.ts) || 0 });
      }
    }
    return out.sort((a, b) => a.ts - b.ts);
  }

  /* ---------- состояние ---------- */
  let items = [];
  let picked = null; // выбранный шаблон
  let busy = false;
  const mine = () => items.filter((o) => o.uid === me.id);
  const left = () => Math.max(0, MAX - mine().length);
  const freeSlot = () => [0, 1, 2].slice(0, MAX).find((s) => !mine().some((o) => o.slot === s));

  /* ---------- разметка ---------- */
  document.body.insertAdjacentHTML('afterbegin', D.ornamentDefs);
  const stage = $('#treeStage');
  stage.innerHTML = D.tree();
  const layer = $('#ornLayer');
  const svg = stage.querySelector('svg');

  $('#tray').innerHTML = D.ORNAMENTS.map((o, i) =>
    `<button class="tray__item" data-t="${i}" aria-label="${o.name}" aria-pressed="false">${D.ornamentIcon(i)}</button>`).join('');

  function ornNode(o, fresh) {
    const own = o.uid === me.id;
    return `<g class="orn${own ? ' orn--mine' : ''}" data-uid="${esc(o.uid)}" data-slot="${o.slot}" transform="translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})">
      <g class="orn__drop${fresh ? ' is-new' : ''}"><g class="orn__sway" style="animation-delay:${-((o.x + o.y) % 30) / 10}s">
        ${D.ornament(o.t)}
      </g></g></g>`;
  }

  function render(freshKey) {
    layer.innerHTML = items.map((o) => ornNode(o, freshKey === o.uid + ':' + o.slot)).join('');
    renderStatus();
  }

  function renderStatus() {
    const n = left();
    const total = items.length;
    $('#treeCount').textContent = total
      ? `${total} ${UI.plural(total, 'игрушка', 'игрушки', 'игрушек')} на ёлке`
      : 'Ёлка ждёт первую игрушку';
    let text;
    if (picked !== null) text = 'Теперь нажми на ветку, куда повесить ✨';
    else if (n === 0) text = 'Ты повесил(а) все свои игрушки. Спасибо! 🎄';
    else text = `Выбери игрушку — можно повесить ещё ${n} ${UI.plural(n, 'штуку', 'штуки', 'штук')}`;
    $('#treeStatus').textContent = text;
    document.querySelectorAll('.tray__item').forEach((b) => {
      b.disabled = n === 0;
      b.setAttribute('aria-pressed', String(+b.dataset.t === picked));
    });
    $('#tray').classList.toggle('is-done', n === 0);
    stage.classList.toggle('placing', picked !== null);
    $('#treeLocal').hidden = shared || !UI.DEMO;
  }

  /* ---------- взаимодействие ---------- */
  $('#tray').addEventListener('click', (e) => {
    const b = e.target.closest('.tray__item');
    if (!b || b.disabled) return;
    const t = +b.dataset.t;
    picked = picked === t ? null : t;
    UI.haptic.impact('light');
    renderStatus();
  });

  function toSvg(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  stage.addEventListener('click', async (e) => {
    const hit = e.target.closest('.orn');
    if (hit && picked === null) {
      const o = items.find((it) => it.uid === hit.dataset.uid && it.slot === +hit.dataset.slot);
      if (o) {
        UI.haptic.impact('light');
        UI.toast(o.uid === me.id ? 'Это твоя игрушка 💫' : `Эту игрушку повесил(а) ${o.n || 'кто-то'} 🎄`);
        const sway = hit.querySelector('.orn__sway');
        sway.classList.remove('jingle'); void sway.getBoundingClientRect(); sway.classList.add('jingle');
      }
      return;
    }
    if (picked === null) {
      if (left() > 0) {
        UI.toast('Сначала выбери игрушку внизу 👇');
        $('#tray').classList.remove('nudge'); void $('#tray').offsetWidth; $('#tray').classList.add('nudge');
      }
      return;
    }
    if (busy) return;

    const p = toSvg(e);
    if (!D.onBranch(p.x, p.y)) { UI.haptic.notify('error'); UI.toast('Повесь игрушку на ветку 🌲'); return; }
    if (items.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 20)) { UI.haptic.notify('error'); UI.toast('Здесь уже висит игрушка — выбери другое место'); return; }
    const slot = freeSlot();
    if (slot === undefined) { picked = null; renderStatus(); return; }

    const o = { t: picked, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, n: me.name.slice(0, 40), ts: Date.now() };
    const item = { uid: me.id, slot, ...o };
    items.push(item);
    picked = null;
    render(me.id + ':' + slot);
    UI.haptic.notify('success');
    busy = true;
    try {
      await store.put(slot, o);
      if (left() === 0) UI.toast('Все три игрушки на ёлке! 🎉');
    } catch (err) {
      items = items.filter((it) => it !== item);
      render();
      UI.toast('Не получилось повесить игрушку, попробуй ещё раз');
    } finally { busy = false; }
  });

  /* ---------- загрузка и обновление ---------- */
  async function refresh() {
    if (busy) return;
    try {
      const fresh = await store.load();
      // не теряем свои игрушки, которые ещё сохраняются
      items = fresh;
      render();
    } catch (e) {
      $('#treeStatus').textContent = 'Не удалось загрузить ёлку. Проверь интернет.';
    }
  }

  refresh();
  if (shared) {
    setInterval(() => { if (!document.hidden && picked === null) refresh(); }, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  } else {
    console.info('[advent] Ёлка работает локально. Чтобы игрушки видели все, укажите tree.firebaseUrl в js/config.js');
  }
})();
