/* Векторная графика: крышки коробочек и встроенные иллюстрации.
   Всё нарисовано в SVG, поэтому шаблон работает без внешних картинок. */
(function () {
  const C = { gold: '#d6b26e', gold2: '#b98f45', cream: '#f4eedf', red: '#e2262a', red2: '#c3161b', green: '#1d8a57', green2: '#0e5e3d' };

  function starPoints(cx, cy, n, R, r, rot = -Math.PI / 2) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n;
      const rad = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return pts.join(' ');
  }

  /* ---------- крышки коробочек (viewBox 100×100) ---------- */
  const covers = {
    bell: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c487"/><stop offset="1" stop-color="${C.gold2}"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#e2cfa4"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <path d="M14 24 H86 Q84 48 60 55 L71 100 H29 L40 55 Q16 48 14 24Z" fill="url(#${id}c)" opacity=".95"/>
      <circle cx="50" cy="14" r="7" fill="#fbf6ea"/>
      <circle cx="80" cy="66" r="3" fill="#fbf6ea" opacity=".8"/>`,

    ornament: (id) => `
      <defs><radialGradient id="${id}r" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#f0443f"/><stop offset="1" stop-color="${C.red2}"/></radialGradient></defs>
      <rect width="100" height="100" fill="${C.cream}"/>
      <circle cx="51" cy="46" r="38" fill="url(#${id}r)"/>
      <path d="M17 76 q-6 4 -2 10 q4 4 8 -1" fill="none" stroke="#8a6a2e" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="16" y="71" width="9" height="7" rx="2" fill="${C.gold}" transform="rotate(-38 20 74)"/>
      <ellipse cx="37" cy="30" rx="9" ry="5" fill="#fff" opacity=".25" transform="rotate(-35 37 30)"/>`,

    mitten: (id) => {
      let rays = '';
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        rays += `<line x1="${(52 + Math.cos(a) * 3).toFixed(1)}" y1="${(40 + Math.sin(a) * 3).toFixed(1)}" x2="${(52 + Math.cos(a) * 13).toFixed(1)}" y2="${(40 + Math.sin(a) * 13).toFixed(1)}"/>`;
      }
      return `
      <defs><linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e7c9"/><stop offset="1" stop-color="${C.gold}"/></linearGradient></defs>
      <rect width="100" height="100" fill="${C.red}"/>
      <path d="M33 70 V40 Q33 16 52 16 Q71 16 71 40 V70Z M33 46 Q20 44 22 57 Q24 66 33 64Z" fill="url(#${id}m)"/>
      <rect x="29" y="66" width="46" height="11" rx="5" fill="${C.cream}"/>
      <g stroke="#fff" stroke-width="1.6" stroke-linecap="round">${rays}</g>
      <path d="M60 77 q2 6 4 9 M68 77 q4 4 8 6" stroke="${C.cream}" stroke-width="1.2" fill="none"/>
      <circle cx="64" cy="88" r="4" fill="${C.cream}"/><circle cx="77" cy="84" r="4" fill="${C.cream}"/>`;
    },

    gift: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.green2}"/><stop offset="1" stop-color="#26a466"/></linearGradient>
      <filter id="${id}b"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <rect x="43" y="0" width="13" height="100" fill="${C.red}"/>
      <rect x="0" y="40" width="100" height="13" fill="${C.red}"/>
      <g fill="${C.red}" filter="url(#${id}b)">
        <ellipse cx="49" cy="32" rx="9" ry="13"/><ellipse cx="49" cy="61" rx="9" ry="13"/>
        <ellipse cx="34" cy="46" rx="13" ry="9"/><ellipse cx="64" cy="46" rx="13" ry="9"/>
        <circle cx="49" cy="46" r="11" fill="#ff3b3b"/></g>`,

    star: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0c084"/><stop offset="1" stop-color="${C.gold2}"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <polygon points="${starPoints(50, 42, 8, 36, 17)}" fill="${C.cream}" stroke="${C.cream}" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${starPoints(50, 42, 8, 12, 8, 0)}" fill="${C.gold}"/>
      <circle cx="50" cy="42" r="5" fill="${C.cream}"/>
      <circle cx="16" cy="18" r="2.6" fill="#fbf6ea" opacity=".8"/>`,

    deer: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.green2}"/><stop offset="1" stop-color="#22a062"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <g fill="none" stroke="${C.red}" stroke-width="4.5" stroke-linecap="round">
        <path d="M30 34 Q14 22 16 2 M22 22 Q8 18 6 8 M25 27 Q30 12 28 2"/>
        <path d="M70 34 Q86 22 84 2 M78 22 Q92 18 94 8 M75 27 Q70 12 72 2"/></g>
      <circle cx="50" cy="62" r="32" fill="${C.gold}"/>
      <circle cx="50" cy="83" r="12" fill="${C.red}"/>`,

    sparkle: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2aa86d"/><stop offset="1" stop-color="#0b4a35"/></linearGradient></defs>
      <rect width="100" height="100" fill="${C.red}"/>
      <path d="M50 6 Q55 45 94 50 Q55 55 50 94 Q45 55 6 50 Q45 45 50 6Z" fill="url(#${id}g)"/>
      <circle cx="14" cy="14" r="3" fill="#fff" opacity=".7"/>`,
  };

  function cover(name, id) {
    const f = covers[name] || covers.gift;
    return `<svg class="cover" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${f(id)}</svg>`;
  }

  /* ---------- «гифка»: ёлка с гирляндой и снегом ---------- */
  function treeScene() {
    let flakes = '';
    for (let i = 0; i < 34; i++) {
      const x = Math.round(Math.random() * 400);
      const r = (1.5 + Math.random() * 3).toFixed(1);
      const d = (4 + Math.random() * 6).toFixed(1);
      const delay = (-Math.random() * 10).toFixed(1);
      flakes += `<circle class="fall" cx="${x}" cy="0" r="${r}" fill="#fff" opacity=".85" style="animation-duration:${d}s;animation-delay:${delay}s"/>`;
    }
    const lights = [
      [178, 150, C.red, 'b1'], [222, 158, C.gold, 'b2'], [200, 175, '#ffffff', 'b3'],
      [160, 208, C.gold, 'b2'], [205, 214, C.red, 'b1'], [242, 205, '#fff', 'b3'],
      [150, 258, C.red, 'b3'], [190, 262, '#fff', 'b1'], [232, 258, C.gold, 'b2'], [262, 250, C.red, 'b1'],
    ].map(([x, y, c, b]) => `<circle class="blink ${b}" cx="${x}" cy="${y}" r="7" fill="${c}"/>`).join('');
    return `<svg viewBox="0 0 400 400">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b3a2d"/><stop offset="1" stop-color="#1c6b4d"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#sky)"/>
      <circle cx="330" cy="70" r="30" fill="${C.cream}" opacity=".9"/><circle cx="342" cy="62" r="28" fill="#0f4434" opacity=".35"/>
      <ellipse cx="200" cy="400" rx="300" ry="80" fill="${C.cream}"/>
      <g class="sway">
        <rect x="190" y="300" width="20" height="30" rx="3" fill="#7a4e2a"/>
        <polygon points="200,90 260,190 140,190" fill="${C.green}"/>
        <polygon points="200,130 280,240 120,240" fill="#178050"/>
        <polygon points="200,175 300,305 100,305" fill="#13724a"/>
        ${lights}
        <polygon class="star-top" points="${starPoints(200, 86, 5, 20, 8)}" fill="${C.gold}"/>
      </g>
      <rect x="112" y="300" width="44" height="36" rx="4" fill="${C.red}"/><rect x="130" y="300" width="8" height="36" fill="${C.gold}"/>
      <rect x="250" y="310" width="38" height="28" rx="4" fill="${C.gold}"/><rect x="265" y="310" width="8" height="28" fill="${C.red}"/>
      ${flakes}
    </svg>`;
  }

  /* ---------- «милая картинка»: олень в шарфике ---------- */
  function deerPic() {
    return `<svg viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f6ead2"/>
      <g fill="#fff">${[[40,60],[340,90],[70,300],[350,320],[300,40],[110,150],[300,200]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
      <g fill="none" stroke="#8a5a2b" stroke-width="12" stroke-linecap="round">
        <path d="M150 120 Q110 80 120 30 M128 85 Q90 80 78 55"/><path d="M250 120 Q290 80 280 30 M272 85 Q310 80 322 55"/></g>
      <ellipse cx="118" cy="160" rx="34" ry="18" fill="#c48a52" transform="rotate(-25 118 160)"/>
      <ellipse cx="282" cy="160" rx="34" ry="18" fill="#c48a52" transform="rotate(25 282 160)"/>
      <ellipse cx="200" cy="200" rx="92" ry="98" fill="#d39a5f"/>
      <ellipse cx="200" cy="250" rx="58" ry="46" fill="#f3dcc0"/>
      <g class="eyes"><circle cx="165" cy="190" r="15" fill="#2b1a10"/><circle cx="235" cy="190" r="15" fill="#2b1a10"/>
        <circle cx="170" cy="184" r="5" fill="#fff"/><circle cx="240" cy="184" r="5" fill="#fff"/></g>
      <ellipse cx="140" cy="228" rx="16" ry="10" fill="#ef8f8a" opacity=".7"/><ellipse cx="260" cy="228" rx="16" ry="10" fill="#ef8f8a" opacity=".7"/>
      <circle cx="200" cy="236" r="20" fill="${C.red}"/><circle cx="194" cy="229" r="6" fill="#fff" opacity=".6"/>
      <path d="M186 268 Q200 280 214 268" stroke="#2b1a10" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M110 300 Q200 340 290 300 L292 330 Q200 372 108 330Z" fill="${C.red}"/>
      <rect x="236" y="320" width="30" height="62" rx="10" fill="${C.red2}" transform="rotate(-10 250 350)"/>
      <g stroke="#fff" stroke-width="5" opacity=".8"><line x1="140" y1="318" x2="140" y2="345"/><line x1="200" y1="330" x2="200" y2="356"/><line x1="260" y1="318" x2="260" y2="345"/></g>
    </svg>`;
  }

  /* ---------- кассета ---------- */
  function cassette(title) {
    const reel = (cx) => `<g class="reel"><circle cx="${cx}" cy="98" r="22" fill="#f4eedf"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="${cx - 2.5}" y="80" width="5" height="11" rx="2" fill="#2a2a2a" transform="rotate(${a} ${cx} 98)"/>`).join('')}
      <circle cx="${cx}" cy="98" r="7" fill="#2a2a2a"/></g>`;
    const safe = String(title || '').replace(/[<>&"]/g, '');
    return `<svg viewBox="0 0 320 200" role="button" aria-label="Включить музыку">
      <rect x="6" y="6" width="308" height="188" rx="16" fill="${C.red}"/>
      <rect x="6" y="6" width="308" height="188" rx="16" fill="none" stroke="#a90f14" stroke-width="3"/>
      <rect x="28" y="24" width="264" height="120" rx="10" fill="${C.cream}"/>
      <rect x="28" y="24" width="264" height="26" rx="10" fill="${C.gold}"/>
      <text x="160" y="43" text-anchor="middle" font-family="Unbounded, Arial" font-weight="800" font-size="14" fill="#fff">${safe}</text>
      <rect x="70" y="70" width="180" height="56" rx="28" fill="#3b2a20"/>
      <path d="M100 120 Q160 132 220 120" stroke="#5a3d2c" stroke-width="10" fill="none"/>
      ${reel(110)}${reel(210)}
      <rect x="132" y="88" width="56" height="20" rx="3" fill="#6b4a36" opacity=".8"/>
      <path d="M70 194 L88 158 H232 L250 194Z" fill="#b8161b"/>
      ${[[90, 176], [230, 176]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#7d0d10"/>`).join('')}
      ${[[20, 20], [300, 20], [20, 180], [300, 180]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#a90f14"/>`).join('')}
    </svg>`;
  }

  /* ---------- снежный шар ---------- */
  function globe(src, year) {
    const inner = src
      ? `<image href="${src}" x="25" y="25" width="250" height="250" preserveAspectRatio="xMidYMid slice" clip-path="url(#gclip)"/>`
      : `<g clip-path="url(#gclip)">
          <rect x="25" y="25" width="250" height="250" fill="url(#gsky)"/>
          <circle cx="215" cy="80" r="20" fill="${C.cream}" opacity=".9"/>
          ${[[70,70],[110,50],[160,90],[245,135],[60,130],[190,45]].map(([x,y])=>`<circle class="blink b${(x%3)+1}" cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join('')}
          <ellipse cx="150" cy="270" rx="150" ry="60" fill="${C.cream}"/>
          <g transform="translate(80 150)">
            <rect x="0" y="40" width="64" height="48" fill="${C.red}"/><polygon points="-8,42 32,8 72,42" fill="#fff"/>
            <rect x="24" y="58" width="16" height="30" fill="#5a3218"/>
            <rect x="6" y="52" width="13" height="13" fill="#ffd77a" class="blink b2"/><rect x="45" y="52" width="13" height="13" fill="#ffd77a"/></g>
          <g transform="translate(190 120)">
            <rect x="15" y="98" width="12" height="16" fill="#7a4e2a"/>
            <polygon points="21,0 52,48 -10,48" fill="${C.green}"/><polygon points="21,28 60,84 -18,84" fill="#178050"/>
            <polygon points="21,58 66,104 -24,104" fill="#13724a"/>
            <polygon class="star-top" points="${starPoints(21, -2, 5, 10, 4)}" fill="${C.gold}"/>
            <circle cx="8" cy="72" r="4" fill="${C.red}" class="blink"/><circle cx="34" cy="88" r="4" fill="${C.gold}" class="blink b2"/><circle cx="20" cy="45" r="4" fill="#fff" class="blink b3"/></g>
        </g>`;
    return `<svg viewBox="0 0 300 354">
      <defs>
        <clipPath id="gclip"><circle cx="150" cy="150" r="125"/></clipPath>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2f3f"/><stop offset=".7" stop-color="#1b5a4e"/></linearGradient>
        <radialGradient id="gglass" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#bfe8ff" stop-opacity=".25"/></radialGradient>
        <linearGradient id="gbase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}"/><stop offset="1" stop-color="#8e0c10"/></linearGradient>
      </defs>
      ${inner}
      <circle cx="150" cy="150" r="125" fill="url(#gglass)"/>
      <circle cx="150" cy="150" r="125" fill="none" stroke="#e8f6ff" stroke-opacity=".55" stroke-width="3"/>
      <path d="M70 70 Q95 42 135 36" stroke="#fff" stroke-opacity=".6" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M58 262 H242 L264 334 Q150 352 36 334Z" fill="url(#gbase)"/>
      <rect x="50" y="256" width="200" height="14" rx="7" fill="${C.gold}"/>
      <rect x="44" y="318" width="212" height="8" rx="4" fill="${C.gold}" opacity=".85"/>
      <text x="150" y="304" text-anchor="middle" font-family="Unbounded, Arial" font-weight="900" font-size="24" fill="${C.cream}">${year || ''}</text>
    </svg>`;
  }

  const fortuneIcon = `<svg viewBox="0 0 100 100"><polygon points="${starPoints(50, 50, 8, 46, 22)}" fill="${C.cream}"/><circle cx="50" cy="50" r="12" fill="${C.gold}"/></svg>`;

  window.ART = { cover, treeScene, deerPic, cassette, globe, fortuneIcon };
})();
