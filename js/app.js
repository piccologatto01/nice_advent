(function () {
  'use strict';

  const CFG = window.ADVENT_CONFIG;
  const tg = window.Telegram && window.Telegram.WebApp;
  const $ = (s) => document.querySelector(s);
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const STORE_KEY = 'advent_state_' + CFG.startDate;

  const params = new URLSearchParams(location.search);
  const DEMO = !!CFG.demo || params.has('demo') || (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param === 'demo');

  /* ---------------- Telegram ---------------- */
  const inTelegram = !!(tg && tg.initData);
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
        tg.setHeaderColor('#f6e7d4');
        tg.setBackgroundColor('#24361f');
      }
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    } catch (e) { /* вне Telegram — игнорируем */ }
  }
  const haptic = {
    impact: (s = 'medium') => { try { tg.HapticFeedback.impactOccurred(s); } catch (e) {} },
    notify: (t) => { try { tg.HapticFeedback.notificationOccurred(t); } catch (e) {} },
  };

  /* ---------------- хранилище: CloudStorage Telegram → localStorage → память ---------------- */
  const mem = {};
  const cloudOk = () => inTelegram && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9');
  const storage = {
    get(key) {
      return new Promise((resolve) => {
        if (cloudOk()) {
          const t = setTimeout(() => resolve(localGet(key)), 1500);
          tg.CloudStorage.getItem(key, (err, val) => { clearTimeout(t); resolve(err ? localGet(key) : val || localGet(key)); });
        } else resolve(localGet(key));
      });
    },
    set(key, val) {
      try { localStorage.setItem(key, val); } catch (e) { mem[key] = val; }
      if (cloudOk()) try { tg.CloudStorage.setItem(key, val); } catch (e) {}
    },
  };
  function localGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return mem[key] || null; }
  }

  let state = { opened: {} };
  const save = () => storage.set(STORE_KEY, JSON.stringify(state));

  /* ---------------- даты ---------------- */
  const [sy, sm, sd] = CFG.startDate.split('-').map(Number);
  const dayDate = (i) => new Date(sy, sm - 1, sd + i);
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const isUnlocked = (i) => DEMO || today() >= dayDate(i);
  const fmt = (d) => d.getDate() + ' ' + MONTHS[d.getMonth()];
  const N = CFG.days.length;
  const newYear = () => { const l = dayDate(N - 1); return l.getMonth() === 11 ? l.getFullYear() + 1 : l.getFullYear(); };

  /* ---------------- главная ---------------- */
  function renderHeader() {
    $('#title').innerHTML = CFG.title.map((t) => `<span>${t}</span>`).join('');
    $('#subtitle').textContent = CFG.subtitle;
    $('#footSub').textContent = CFG.subtitle;
    document.title = CFG.title.join(' ');
    if (DEMO) $('#reset').hidden = false;
  }

  function infoCard() {
    const a = dayDate(0), b = dayDate(N - 1);
    const sameMonth = a.getMonth() === b.getMonth();
    const range = sameMonth ? `${a.getDate()}–${b.getDate()}` : `${a.getDate()}.${a.getMonth() + 1}–${b.getDate()}.${b.getMonth() + 1}`;
    return `<div class="info">
      <span class="info__pill">${WD[a.getDay()]}–${WD[b.getDay()]}</span>
      <span class="info__range">${range}</span>
      <span class="info__month">${sameMonth ? MONTHS[b.getMonth()] : ''}</span>
    </div>`;
  }

  function renderGrid() {
    const grid = $('#grid');
    const tiles = CFG.days.map((d, i) => {
      const date = dayDate(i);
      const opened = !!state.opened[i];
      const cls = !isUnlocked(i) ? 'locked' : opened ? 'opened' : 'ready';
      return `<button class="tile ${cls}" data-i="${i}" aria-label="Коробочка ${fmt(date)}">
        ${ART.cover(d.cover, 't' + i)}
        <span class="tile__num">${date.getDate()}</span>
        ${opened ? '<span class="tile__badge">✓</span>' : ''}
      </button>`;
    });
    // как на постере: 3 коробочки, 1 + карточка с датами, остальные
    tiles.splice(Math.min(4, tiles.length), 0, infoCard());
    grid.innerHTML = tiles.join('');
    renderHint();
  }

  function renderHint() {
    const t = today();
    let text;
    const openedCount = Object.keys(state.opened).length;
    if (openedCount >= N) text = 'Все коробочки открыты. С наступающим! 🎄';
    else if (!DEMO && t < dayDate(0)) {
      const days = Math.round((dayDate(0) - t) / 864e5);
      text = `До первой коробочки ${days} ${plural(days, 'день', 'дня', 'дней')} ⏳`;
    } else {
      const idx = CFG.days.findIndex((_, i) => isUnlocked(i) && !state.opened[i]);
      text = idx >= 0 ? 'Тебя ждёт новая коробочка — нажми на неё 🎁' : 'Возвращайся завтра за новым сюрпризом ✨';
    }
    $('#hint').textContent = text;
  }

  function plural(n, a, b, c) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b;
    return c;
  }

  $('#grid').addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const i = +tile.dataset.i;

    if (!isUnlocked(i)) {
      tile.classList.remove('shake'); void tile.offsetWidth; tile.classList.add('shake');
      haptic.notify('error');
      toast(`Эта коробочка откроется ${fmt(dayDate(i))} ✨`);
      return;
    }
    if (state.opened[i]) { haptic.impact('light'); openModal(i, false); return; }

    haptic.impact('heavy');
    tile.classList.add('opening');
    setTimeout(() => {
      state.opened[i] = true;
      save();
      openModal(i, true);
      renderGrid();
    }, 520);
  });

  $('#reset').addEventListener('click', () => {
    state = { opened: {} };
    save();
    renderGrid();
    toast('Прогресс сброшен');
  });

  /* ---------------- модалка ---------------- */
  let cleanup = null;
  const modal = $('#modal');

  function openModal(i, fresh) {
    const d = CFG.days[i];
    $('#sheetDay').textContent = fmt(dayDate(i));
    const body = $('#sheetBody');
    body.className = 'sheet__body reveal';
    body.innerHTML = '';
    cleanup = (RENDER[d.type] || RENDER.wish)(body, d, i) || null;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    $('.sheet').scrollTop = 0;
    if (tg && tg.BackButton) try { tg.BackButton.show(); } catch (e) {}
    if (fresh) { confetti(); haptic.notify('success'); }
  }

  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (cleanup) { cleanup(); cleanup = null; }
    if (tg && tg.BackButton) try { tg.BackButton.hide(); } catch (e) {}
    renderHint();
  }

  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  if (tg && tg.BackButton) try { tg.BackButton.onClick(closeModal); } catch (e) {}

  /* ---------------- содержимое коробочек ---------------- */
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const RENDER = {
    wish(body, d) {
      body.innerHTML = `<div class="wish">
        <h2 class="c-title">${esc(d.title)}</h2>
        <p class="c-text">${esc(d.text)}</p></div>`;
    },

    gif(body, d) {
      body.innerHTML = `<div class="frame">${d.src ? `<img src="${esc(d.src)}" alt="">` : ART.treeScene()}</div>
        ${d.caption ? `<p class="caption">${esc(d.caption)}</p>` : ''}`;
      fallbackImg(body, ART.treeScene);
    },

    image(body, d) {
      body.innerHTML = `<div class="frame">${d.src ? `<img src="${esc(d.src)}" alt="">` : ART.deerPic()}</div>
        ${d.caption ? `<p class="caption">${esc(d.caption)}</p>` : ''}`;
      fallbackImg(body, ART.deerPic);
    },

    music(body, d) {
      body.innerHTML = `<div class="tape">${ART.cassette(d.songTitle)}
          <div class="eq"><i></i><i></i><i></i><i></i><i></i></div>
          <button class="play">▶ Включить</button></div>
        ${d.caption ? `<p class="caption">${esc(d.caption)}</p>` : ''}`;
      const tape = body.querySelector('.tape');
      const btn = body.querySelector('.play');
      const player = d.src ? fileAudio(d.src) : jingle;
      let playing = false;
      const toggle = () => {
        playing = !playing;
        haptic.impact('medium');
        if (playing) player.play(); else player.stop();
        tape.classList.toggle('playing', playing);
        btn.textContent = playing ? '❚❚ Пауза' : '▶ Включить';
      };
      tape.querySelector('svg').addEventListener('click', toggle);
      btn.addEventListener('click', toggle);
      return () => player.stop();
    },

    fortune(body, d, i) {
      let pick = state.opened[i] && state.opened[i].f;
      if (typeof pick !== 'number') {
        pick = Math.floor(Math.random() * d.items.length);
        state.opened[i] = { f: pick };
        save();
      }
      body.innerHTML = `<div class="fortune"><div class="fortune__card">
          <div class="fortune__face fortune__front">${ART.fortuneIcon}<b>Предсказание на новый год</b><span style="margin-top:6px;opacity:.9">нажми, чтобы узнать</span></div>
          <div class="fortune__face fortune__back"><span class="eyebrow">Тебя ждёт</span><p class="c-text">${esc(d.items[pick])}</p></div>
        </div></div>`;
      const card = body.querySelector('.fortune__card');
      card.addEventListener('click', () => { card.classList.toggle('flipped'); haptic.impact('light'); });
    },

    globe(body, d) {
      body.innerHTML = `<div class="globe">
          <div class="globe__wrap">${ART.globe(d.src, newYear())}<canvas class="globe__snow"></canvas></div>
          <h2 class="globe__title">${esc(d.title || 'С Новым годом!')}</h2>
          <p class="c-text">${esc(d.text)}</p></div>`;
      const wrap = body.querySelector('.globe__wrap');
      const stop = globeSnow(body.querySelector('.globe__snow'));
      wrap.addEventListener('click', () => {
        wrap.classList.remove('shaking'); void wrap.offsetWidth; wrap.classList.add('shaking');
        haptic.impact('heavy');
        stop.shake();
      });
      setTimeout(() => stop.shake(), 600);
      return stop;
    },
  };

  function fallbackImg(body, artFn) {
    const img = body.querySelector('.frame img');
    if (img) img.onerror = () => { img.parentNode.innerHTML = artFn(); };
  }

  /* ---------------- музыка ---------------- */
  function fileAudio(src) {
    const a = new Audio(src);
    a.loop = true;
    return {
      play: () => a.play().catch(() => toast('Не получилось включить музыку')),
      stop: () => { a.pause(); },
    };
  }

  // встроенная мелодия «Jingle Bells» (народная, общественное достояние) на Web Audio
  const SONG = (() => {
    const A = [['E',1],['E',1],['E',2],['E',1],['E',1],['E',2],['E',1],['G',1],['C',1.5],['D',.5],['E',4]];
    const B1 = [['F',1],['F',1],['F',1.5],['F',.5],['F',1],['E',1],['E',1],['E',.5],['E',.5],['E',1],['D',1],['D',1],['E',1],['D',2],['G',2]];
    const B2 = [['F',1],['F',1],['F',1.5],['F',.5],['F',1],['E',1],['E',1],['E',.5],['E',.5],['G',1],['G',1],['F',1],['D',1],['C',4]];
    return [...A, ...B1, ...A, ...B2];
  })();
  const FREQ = { C: 523.25, D: 587.33, E: 659.25, F: 698.46, G: 783.99 };

  const jingle = {
    ctx: null, master: null, nodes: [], timer: null, playing: false,
    play() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return toast('Браузер не поддерживает звук');
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      this.ctx.resume();
      this.playing = true;
      this.loop();
    },
    loop() {
      const ctx = this.ctx, beat = 0.34;
      const start = ctx.currentTime + 0.08;
      let t = start;
      SONG.forEach(([n, d], k) => {
        this.note(FREQ[n], t, d * beat, 1);
        if (k % 4 === 0) this.note(FREQ.C / 4 * (n === 'G' || n === 'D' ? 1.5 : 1), t, beat * 2, 0.5); // мягкий бас
        t += d * beat;
      });
      this.timer = setTimeout(() => { if (this.playing) this.loop(); }, (t - start) * 1000);
    },
    note(f, t, dur, vol) {
      const ctx = this.ctx;
      [[f, 'sine', 0.22], [f * 2, 'sine', 0.06], [f / 2, 'triangle', 0.08]].forEach(([fr, type, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = fr;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v * vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.3) + 0.4);
        o.connect(g).connect(this.master);
        o.start(t); o.stop(t + dur + 0.8);
        this.nodes.push(o);
        o.onended = () => { const k = this.nodes.indexOf(o); if (k >= 0) this.nodes.splice(k, 1); };
      });
    },
    stop() {
      this.playing = false;
      clearTimeout(this.timer);
      this.nodes.forEach((o) => { try { o.stop(); } catch (e) {} });
      this.nodes = [];
    },
  };

  /* ---------------- снег внутри шара ---------------- */
  function globeSnow(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, R, raf, alive = true;
    const flakes = [];
    function size() {
      W = canvas.clientWidth; R = W / 2;
      canvas.width = W * dpr; canvas.height = W * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    for (let k = 0; k < 90; k++) {
      flakes.push({ x: Math.random() * W, y: R + Math.random() * R * 0.9, vx: 0, vy: 0, r: 0.8 + Math.random() * 2.2, ph: Math.random() * 6 });
    }
    function frame() {
      if (!alive) return;
      ctx.clearRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#fff';
      for (const f of flakes) {
        f.ph += 0.03;
        f.vx *= 0.97; f.vy = f.vy * 0.97 + 0.012;
        f.x += f.vx + Math.sin(f.ph) * 0.25;
        f.y += f.vy + 0.15;
        const dx = f.x - R, dy = f.y - R, dist = Math.hypot(dx, dy);
        const floor = R * 0.92;
        if (dist > floor) { // осели у стекла
          f.x = R + (dx / dist) * floor; f.y = R + (dy / dist) * floor;
          f.vx *= -0.3; f.vy = Math.min(f.vy, 0) * 0.3;
          if (dy < 0) f.vy = 0.5;
        }
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      raf = requestAnimationFrame(frame);
    }
    frame();
    const api = () => { alive = false; cancelAnimationFrame(raf); };
    api.shake = () => {
      for (const f of flakes) { f.vx = (Math.random() - 0.5) * 7; f.vy = -2 - Math.random() * 5; }
    };
    return api;
  }

  /* ---------------- конфетти ---------------- */
  function confetti() {
    const canvas = $('#confetti');
    const sheet = $('.sheet');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = sheet.clientWidth, H = sheet.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#d7240c', '#9e2117', '#f6e7d4', '#d7edd2', '#75956f', '#f2cd5c', '#f6c1c0'];
    const parts = Array.from({ length: 120 }, () => ({
      x: W / 2, y: 70, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10 - 3,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    let n = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (++n < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------------- фоновый снег ---------------- */
  (function bgSnow() {
    const c = $('#snow'), ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, flakes = [];
    function size() {
      W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = Array.from({ length: Math.round(W / 9) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 2, s: 0.3 + Math.random() * 0.8, p: Math.random() * 6 }));
    }
    size(); addEventListener('resize', size);
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (const f of flakes) {
        f.y += f.s; f.p += 0.01; f.x += Math.sin(f.p) * 0.3;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  })();

  /* ---------------- тост ---------------- */
  let toastT;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2400);
  }


  /* ---------------- заставка: календарь появляется из коробочки ---------------- */
  function intro() {
    const el = $('#intro');
    if (!el) return;
    const D = window.DECOR;
    const lbl = Object.assign({
      top: `${N} ${plural(N, 'сюрприз', 'сюрприза', 'сюрпризов')}`,
      title: ['Адвент', 'календарь'],
      bottom: 'то, что тебе нужно',
    }, CFG.intro || {});
    el.querySelector('.intro__paper').innerHTML = D.paper;
    el.querySelector('.intro__sparks').innerHTML = D.introSparkles;
    el.querySelector('.intro__box').innerHTML = D.introBox(lbl);
    if (CFG.intro && CFG.intro.hint) el.querySelector('.intro__hint').textContent = CFG.intro.hint;
    document.body.classList.add('is-intro');
    if (tg) try { tg.setHeaderColor('#f6e7d4'); } catch (e) {}

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      clearTimeout(auto);
      haptic.impact('heavy');
      el.classList.add('is-opening');
      setTimeout(() => haptic.notify('success'), reduce ? 0 : 900);
      setTimeout(() => {
        document.body.classList.remove('is-intro');
        document.body.classList.add('is-revealing');
        if (tg) try { tg.setHeaderColor('#34492f'); } catch (e) {}
      }, reduce ? 50 : 1250);
      setTimeout(() => {
        el.remove();
        document.body.classList.remove('is-revealing');
      }, reduce ? 400 : 2400);
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });
    const auto = setTimeout(open, (CFG.intro && CFG.intro.autoOpenMs) || 6000);
  }

  /* ---------------- старт ---------------- */
  window.ADVENT_UI = { tg, haptic, toast, plural, DEMO };
  intro();
  renderHeader();
  renderGrid();
  storage.get(STORE_KEY).then((raw) => {
    try { if (raw) state = JSON.parse(raw) || state; } catch (e) {}
    if (!state.opened) state.opened = {};
    renderGrid();
  });

  // если пользователь держит приложение открытым после полуночи — обновить коробочки
  let lastDay = today().getTime();
  setInterval(() => {
    const t = today().getTime();
    if (t !== lastDay) { lastDay = t; renderGrid(); }
  }, 60 * 1000);
})();
