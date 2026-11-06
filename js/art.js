/* Векторная графика: крышки коробочек и встроенные иллюстрации.
   Всё нарисовано в SVG, поэтому шаблон работает без внешних картинок. */
(function () {
  const C = { gold: '#f6e7d4', gold2: '#9e2117', cream: '#f6e7d4', red: '#d7240c', red2: '#9e2117', green: '#75956f', green2: '#344b2f', mint: '#d7edd2', pink: '#f6e7d4' };

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
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}"/><stop offset="1" stop-color="${C.red2}"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="#f6e7d4"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <path d="M14 24 H86 Q84 48 60 55 L71 100 H29 L40 55 Q16 48 14 24Z" fill="url(#${id}c)" opacity=".95"/>
      <circle cx="50" cy="14" r="7" fill="#f6e7d4"/>
      <circle cx="80" cy="66" r="3" fill="#f6e7d4" opacity=".8"/>`,

    ornament: (id) => `
      <defs><radialGradient id="${id}r" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#d7240c"/><stop offset="1" stop-color="${C.red2}"/></radialGradient></defs>
      <rect width="100" height="100" fill="${C.cream}"/>
      <circle cx="51" cy="46" r="38" fill="url(#${id}r)"/>
      <path d="M17 76 q-6 4 -2 10 q4 4 8 -1" fill="none" stroke="#9e2117" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="16" y="71" width="9" height="7" rx="2" fill="${C.gold}" transform="rotate(-38 20 74)"/>
      <ellipse cx="37" cy="30" rx="9" ry="5" fill="#f6e7d4" opacity=".25" transform="rotate(-35 37 30)"/>`,

    mitten: (id) => {
      let rays = '';
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        rays += `<line x1="${(52 + Math.cos(a) * 3).toFixed(1)}" y1="${(40 + Math.sin(a) * 3).toFixed(1)}" x2="${(52 + Math.cos(a) * 13).toFixed(1)}" y2="${(40 + Math.sin(a) * 13).toFixed(1)}"/>`;
      }
      return `
      <defs><linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="${C.gold}"/></linearGradient></defs>
      <rect width="100" height="100" fill="${C.red}"/>
      <path d="M33 70 V40 Q33 16 52 16 Q71 16 71 40 V70Z M33 46 Q20 44 22 57 Q24 66 33 64Z" fill="url(#${id}m)"/>
      <rect x="29" y="66" width="46" height="11" rx="5" fill="${C.cream}"/>
      <g stroke="#f6e7d4" stroke-width="1.6" stroke-linecap="round">${rays}</g>
      <path d="M60 77 q2 6 4 9 M68 77 q4 4 8 6" stroke="${C.cream}" stroke-width="1.2" fill="none"/>
      <circle cx="64" cy="88" r="4" fill="${C.cream}"/><circle cx="77" cy="84" r="4" fill="${C.cream}"/>`;
    },

    gift: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.green2}"/><stop offset="1" stop-color="#75956f"/></linearGradient>
      <filter id="${id}b"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <rect x="43" y="0" width="13" height="100" fill="${C.red}"/>
      <rect x="0" y="40" width="100" height="13" fill="${C.red}"/>
      <g fill="${C.red}" filter="url(#${id}b)">
        <ellipse cx="49" cy="32" rx="9" ry="13"/><ellipse cx="49" cy="61" rx="9" ry="13"/>
        <ellipse cx="34" cy="46" rx="13" ry="9"/><ellipse cx="64" cy="46" rx="13" ry="9"/>
        <circle cx="49" cy="46" r="11" fill="#d7240c"/></g>`,

    star: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.green}"/><stop offset="1" stop-color="${C.green2}"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <polygon points="${starPoints(50, 42, 8, 36, 17)}" fill="${C.cream}" stroke="${C.cream}" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${starPoints(50, 42, 8, 12, 8, 0)}" fill="${C.gold}"/>
      <circle cx="50" cy="42" r="5" fill="${C.cream}"/>
      <circle cx="16" cy="18" r="2.6" fill="#f6e7d4" opacity=".8"/>`,

    deer: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.green2}"/><stop offset="1" stop-color="#75956f"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id}g)"/>
      <g fill="none" stroke="${C.red}" stroke-width="4.5" stroke-linecap="round">
        <path d="M30 34 Q14 22 16 2 M22 22 Q8 18 6 8 M25 27 Q30 12 28 2"/>
        <path d="M70 34 Q86 22 84 2 M78 22 Q92 18 94 8 M75 27 Q70 12 72 2"/></g>
      <circle cx="50" cy="62" r="32" fill="${C.gold}"/>
      <circle cx="50" cy="83" r="12" fill="${C.red}"/>`,

    sparkle: (id) => `
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#75956f"/><stop offset="1" stop-color="#344b2f"/></linearGradient></defs>
      <rect width="100" height="100" fill="${C.red}"/>
      <path d="M50 6 Q55 45 94 50 Q55 55 50 94 Q45 55 6 50 Q45 45 50 6Z" fill="url(#${id}g)"/>
      <circle cx="14" cy="14" r="3" fill="#f6e7d4" opacity=".7"/>`,
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
      flakes += `<circle class="fall" cx="${x}" cy="0" r="${r}" fill="#f6e7d4" opacity=".85" style="animation-duration:${d}s;animation-delay:${delay}s"/>`;
    }
    const lights = [
      [178, 150, C.red, 'b1'], [222, 158, C.gold, 'b2'], [200, 175, '#f6e7d4', 'b3'],
      [160, 208, C.gold, 'b2'], [205, 214, C.red, 'b1'], [242, 205, '#f6e7d4', 'b3'],
      [150, 258, C.red, 'b3'], [190, 262, '#f6e7d4', 'b1'], [232, 258, C.gold, 'b2'], [262, 250, C.red, 'b1'],
    ].map(([x, y, c, b]) => `<circle class="blink ${b}" cx="${x}" cy="${y}" r="7" fill="${c}"/>`).join('');
    return `<svg viewBox="0 0 400 400">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#344b2f"/><stop offset="1" stop-color="#75956f"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#sky)"/>
      <circle cx="330" cy="70" r="30" fill="${C.cream}" opacity=".9"/><circle cx="342" cy="62" r="28" fill="#344b2f" opacity=".35"/>
      <ellipse cx="200" cy="400" rx="300" ry="80" fill="${C.cream}"/>
      <g class="sway">
        <rect x="190" y="300" width="20" height="30" rx="3" fill="#9e2117"/>
        <polygon points="200,90 260,190 140,190" fill="${C.green}"/>
        <polygon points="200,130 280,240 120,240" fill="#75956f"/>
        <polygon points="200,175 300,305 100,305" fill="#75956f"/>
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
      <rect width="400" height="400" fill="#f6e7d4"/>
      <g fill="#f6e7d4">${[[40,60],[340,90],[70,300],[350,320],[300,40],[110,150],[300,200]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
      <g fill="none" stroke="#9e2117" stroke-width="12" stroke-linecap="round">
        <path d="M150 120 Q110 80 120 30 M128 85 Q90 80 78 55"/><path d="M250 120 Q290 80 280 30 M272 85 Q310 80 322 55"/></g>
      <ellipse cx="118" cy="160" rx="34" ry="18" fill="#9e2117" transform="rotate(-25 118 160)"/>
      <ellipse cx="282" cy="160" rx="34" ry="18" fill="#9e2117" transform="rotate(25 282 160)"/>
      <ellipse cx="200" cy="200" rx="92" ry="98" fill="#d7240c"/>
      <ellipse cx="200" cy="250" rx="58" ry="46" fill="#f6e7d4"/>
      <g class="eyes"><circle cx="165" cy="190" r="15" fill="#344b2f"/><circle cx="235" cy="190" r="15" fill="#344b2f"/>
        <circle cx="170" cy="184" r="5" fill="#f6e7d4"/><circle cx="240" cy="184" r="5" fill="#f6e7d4"/></g>
      <ellipse cx="140" cy="228" rx="16" ry="10" fill="#d7240c" opacity=".7"/><ellipse cx="260" cy="228" rx="16" ry="10" fill="#d7240c" opacity=".7"/>
      <circle cx="200" cy="236" r="20" fill="${C.red}"/><circle cx="194" cy="229" r="6" fill="#f6e7d4" opacity=".6"/>
      <path d="M186 268 Q200 280 214 268" stroke="#344b2f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M110 300 Q200 340 290 300 L292 330 Q200 372 108 330Z" fill="${C.red}"/>
      <rect x="236" y="320" width="30" height="62" rx="10" fill="${C.red2}" transform="rotate(-10 250 350)"/>
      <g stroke="#f6e7d4" stroke-width="5" opacity=".8"><line x1="140" y1="318" x2="140" y2="345"/><line x1="200" y1="330" x2="200" y2="356"/><line x1="260" y1="318" x2="260" y2="345"/></g>
    </svg>`;
  }

  /* ---------- кассета ---------- */
  function cassette(title) {
    const reel = (cx) => `<g class="reel"><circle cx="${cx}" cy="98" r="22" fill="#f6e7d4"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="${cx - 2.5}" y="80" width="5" height="11" rx="2" fill="#344b2f" transform="rotate(${a} ${cx} 98)"/>`).join('')}
      <circle cx="${cx}" cy="98" r="7" fill="#344b2f"/></g>`;
    const safe = String(title || '').replace(/[<>&"]/g, '');
    return `<svg viewBox="0 0 320 200" role="button" aria-label="Включить музыку">
      <rect x="6" y="6" width="308" height="188" rx="16" fill="${C.red}"/>
      <rect x="6" y="6" width="308" height="188" rx="16" fill="none" stroke="#9e2117" stroke-width="3"/>
      <rect x="28" y="24" width="264" height="120" rx="10" fill="${C.cream}"/>
      <rect x="28" y="24" width="264" height="26" rx="10" fill="${C.gold}"/>
      <text x="160" y="43" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="800" font-size="14" fill="#f6e7d4">${safe}</text>
      <rect x="70" y="70" width="180" height="56" rx="28" fill="#344b2f"/>
      <path d="M100 120 Q160 132 220 120" stroke="#344b2f" stroke-width="10" fill="none"/>
      ${reel(110)}${reel(210)}
      <rect x="132" y="88" width="56" height="20" rx="3" fill="#9e2117" opacity=".8"/>
      <path d="M70 194 L88 158 H232 L250 194Z" fill="#d7240c"/>
      ${[[90, 176], [230, 176]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#9e2117"/>`).join('')}
      ${[[20, 20], [300, 20], [20, 180], [300, 180]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#9e2117"/>`).join('')}
    </svg>`;
  }

  /* ---------- снежный шар ---------- */
  function globe(src, year) {
    const inner = src
      ? `<image href="${src}" x="25" y="25" width="250" height="250" preserveAspectRatio="xMidYMid slice" clip-path="url(#gclip)"/>`
      : `<g clip-path="url(#gclip)">
          <rect x="25" y="25" width="250" height="250" fill="url(#gsky)"/>
          <circle cx="215" cy="80" r="20" fill="${C.cream}" opacity=".9"/>
          ${[[70,70],[110,50],[160,90],[245,135],[60,130],[190,45]].map(([x,y])=>`<circle class="blink b${(x%3)+1}" cx="${x}" cy="${y}" r="2" fill="#f6e7d4"/>`).join('')}
          <ellipse cx="150" cy="270" rx="150" ry="60" fill="${C.cream}"/>
          <g transform="translate(80 150)">
            <rect x="0" y="40" width="64" height="48" fill="${C.red}"/><polygon points="-8,42 32,8 72,42" fill="#f6e7d4"/>
            <rect x="24" y="58" width="16" height="30" fill="#344b2f"/>
            <rect x="6" y="52" width="13" height="13" fill="#f6e7d4" class="blink b2"/><rect x="45" y="52" width="13" height="13" fill="#f6e7d4"/></g>
          <g transform="translate(190 120)">
            <rect x="15" y="98" width="12" height="16" fill="#9e2117"/>
            <polygon points="21,0 52,48 -10,48" fill="${C.green}"/><polygon points="21,28 60,84 -18,84" fill="#75956f"/>
            <polygon points="21,58 66,104 -24,104" fill="#75956f"/>
            <polygon class="star-top" points="${starPoints(21, -2, 5, 10, 4)}" fill="${C.gold}"/>
            <circle cx="8" cy="72" r="4" fill="${C.red}" class="blink"/><circle cx="34" cy="88" r="4" fill="${C.gold}" class="blink b2"/><circle cx="20" cy="45" r="4" fill="#f6e7d4" class="blink b3"/></g>
        </g>`;
    return `<svg viewBox="0 0 300 354">
      <defs>
        <clipPath id="gclip"><circle cx="150" cy="150" r="125"/></clipPath>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#344b2f"/><stop offset=".7" stop-color="#75956f"/></linearGradient>
        <radialGradient id="gglass" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#f6e7d4" stop-opacity=".22"/><stop offset=".6" stop-color="#f6e7d4" stop-opacity=".04"/><stop offset="1" stop-color="#d7edd2" stop-opacity=".25"/></radialGradient>
        <linearGradient id="gbase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}"/><stop offset="1" stop-color="#9e2117"/></linearGradient>
      </defs>
      ${inner}
      <circle cx="150" cy="150" r="125" fill="url(#gglass)"/>
      <circle cx="150" cy="150" r="125" fill="none" stroke="#d7edd2" stroke-opacity=".55" stroke-width="3"/>
      <path d="M70 70 Q95 42 135 36" stroke="#f6e7d4" stroke-opacity=".6" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M58 262 H242 L264 334 Q150 352 36 334Z" fill="url(#gbase)"/>
      <rect x="50" y="256" width="200" height="14" rx="7" fill="${C.gold}"/>
      <rect x="44" y="318" width="212" height="8" rx="4" fill="${C.gold}" opacity=".85"/>
      <text x="150" y="304" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="900" font-size="24" fill="${C.cream}">${year || ''}</text>
    </svg>`;
  }

  const fortuneIcon = `<svg viewBox="0 0 100 100"><polygon points="${starPoints(50, 50, 8, 46, 22)}" fill="${C.cream}"/><circle cx="50" cy="50" r="12" fill="${C.gold}"/></svg>`;

  window.ART = { cover, treeScene, deerPic, cassette, globe, fortuneIcon };
})();
