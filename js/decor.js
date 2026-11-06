/* Графика для заставки-коробочки, ёлки и игрушек.
   Палитра: ruby #9e2117 · maraschino #d7240c · blush #f6e7d4 · envy #d7edd2 · spruce #75956f
   + тёмная хвоя #344b2f, розовый #f6e7d4, жёлтый блеск #f6e7d4, голубая лента #d7240c */
(function () {
  const P = {
    ruby: '#9e2117', red: '#d7240c', blush: '#f6e7d4', envy: '#d7edd2', spruce: '#75956f',
    pine: '#344b2f',
  };

  function starPath(cx, cy, R, r, n = 5) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const rad = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1);
    }
    return d + 'Z';
  }

  // четырёхлучевая искорка, как на референсе
  const sparkle = (cx, cy, r) =>
    `M${cx} ${cy - r} Q${cx + r * 0.16} ${cy - r * 0.16} ${cx + r} ${cy} Q${cx + r * 0.16} ${cy + r * 0.16} ${cx} ${cy + r} Q${cx - r * 0.16} ${cy + r * 0.16} ${cx - r} ${cy} Q${cx - r * 0.16} ${cy - r * 0.16} ${cx} ${cy - r}Z`;

  /* ---------- мятая бумага (фон заставки) ---------- */
  const paper = `<svg class="paper" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <filter id="crumple" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".013" numOctaves="5" seed="11" result="n"/>
      <feDiffuseLighting in="n" lighting-color="${P.envy}" surfaceScale="3.2" result="l">
        <feDistantLight azimuth="235" elevation="58"/>
      </feDiffuseLighting>
    </filter>
    <rect width="400" height="800" filter="url(#crumple)"/>
    <rect width="400" height="800" fill="${P.envy}" opacity=".35"/>
  </svg>`;

  /* ---------- коробочка-заставка ---------- */
  function introBox(label) {
    const top = label.top || '', bottom = label.bottom || '';
    const [l1, l2] = label.title || ['Адвент', 'календарь'];
    return `<svg class="giftbox" viewBox="0 0 320 340" aria-hidden="true">
      <defs>
        <linearGradient id="gbFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="${P.blush}"/></linearGradient>
        <linearGradient id="gbSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P.envy}"/><stop offset="1" stop-color="#d7edd2"/></linearGradient>
        <radialGradient id="gbGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6e7d4"/><stop offset=".45" stop-color="${P.blush}" stop-opacity=".7"/><stop offset="1" stop-color="${P.blush}" stop-opacity="0"/></radialGradient>
        <filter id="gbShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#344b2f" flood-opacity=".22"/></filter>
      </defs>

      <!-- свечение изнутри -->
      <g class="giftbox__glow">
        <g class="giftbox__rays" fill="${P.blush}" opacity=".55">
          ${Array.from({ length: 12 }, (_, i) => `<path d="M150 112 L${(150 + Math.cos((i * Math.PI) / 6) * 210).toFixed(0)} ${(112 + Math.sin((i * Math.PI) / 6) * 210).toFixed(0)} L${(150 + Math.cos((i * Math.PI) / 6 + 0.12) * 210).toFixed(0)} ${(112 + Math.sin((i * Math.PI) / 6 + 0.12) * 210).toFixed(0)}Z"/>`).join('')}
        </g>
        <ellipse cx="150" cy="112" rx="150" ry="120" fill="url(#gbGlow)"/>
      </g>

      <g filter="url(#gbShadow)">
        <!-- корпус -->
        <path d="M244 112 L276 86 V286 L244 316Z" fill="url(#gbSide)"/>
        <rect x="40" y="112" width="204" height="204" rx="10" fill="url(#gbFront)"/>
        <rect x="54" y="140" width="176" height="162" rx="3" fill="none" stroke="${P.red}" stroke-width="3"/>
        <path d="M252 132 L268 119 V280 L252 294Z" fill="none" stroke="${P.red}" stroke-width="2" opacity=".6"/>

        <!-- этикетка -->
        <g class="giftbox__label" fill="${P.red}" text-anchor="middle">
          <g fill="none" stroke="${P.red}" stroke-width="1.4" stroke-linecap="round" opacity=".85">
            <path d="M68 186 q12 -10 26 -3 q-8 6 -16 1 M68 186 q10 4 18 -1"/>
            <path d="M216 186 q-12 -10 -26 -3 q8 6 16 1 M216 186 q-10 4 -18 -1"/>
            <path d="M142 166 q-7 -9 0 -15 q7 6 0 15 M133 162 q9 -5 18 0"/>
            <path d="M112 286 q15 -9 30 0 q15 9 30 0"/>
          </g>
          <text x="142" y="191" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="600" font-size="15">${top}</text>
          <text x="142" y="224" font-family="Manrope, sans-serif" font-weight="800" font-size="25" letter-spacing=".5">${l1.toUpperCase()}</text>
          <text x="142" y="251" font-family="Manrope, sans-serif" font-weight="800" font-size="${l2.length > 9 ? 22 : 25}" letter-spacing=".5">${l2.toUpperCase()}</text>
          <text x="142" y="272" font-family="Manrope, sans-serif" font-weight="700" font-size="8" letter-spacing="1.6">${bottom.toUpperCase()}</text>
        </g>

        <!-- крышка -->
        <g class="giftbox__lid">
          <path d="M34 112 L68 84 H282 L248 112Z" fill="#f6e7d4"/>
          <path d="M60 106 L78 91 H262 L244 106Z" fill="none" stroke="${P.red}" stroke-width="2"/>
          <rect x="34" y="106" width="214" height="32" rx="6" fill="url(#gbFront)"/>
          <path d="M248 106 L282 80 V108 L248 138Z" fill="url(#gbSide)"/>
          <line x1="40" y1="138" x2="244" y2="138" stroke="#d7edd2" stroke-width="2"/>
          <!-- бант -->
          <g class="giftbox__bow">
            <path class="tail tail--l" d="M152 98 C120 112 86 132 66 176 C80 150 112 126 150 104Z" fill="${P.red}"/>
            <path class="tail tail--r" d="M156 98 C200 104 248 106 284 132 C246 116 204 112 158 104Z" fill="${P.ruby}"/>
            <path class="loop loop--l" d="M152 96 C120 54 92 62 104 86 C112 100 136 100 152 96Z" fill="${P.red}"/>
            <path class="loop loop--r" d="M156 96 C186 50 220 60 206 86 C198 100 172 100 156 96Z" fill="${P.red}"/>
            <path d="M152 96 C128 74 110 72 110 84" fill="none" stroke="${P.ruby}" stroke-width="2.5" opacity=".7"/>
            <path d="M156 96 C182 72 202 72 200 84" fill="none" stroke="${P.ruby}" stroke-width="2.5" opacity=".7"/>
            <ellipse cx="154" cy="97" rx="10" ry="8" fill="${P.ruby}"/>
          </g>
        </g>
      </g>
    </svg>`;
  }

  const introSparkles = [
    [14, 22, 28], [80, 12, 22], [86, 66, 26], [16, 78, 22], [70, 88, 14], [30, 8, 12],
  ].map(([x, y, s], i) => `<svg class="spark" style="left:${x}%;top:${y}%;width:${s}px;animation-delay:${-i * 0.37}s" viewBox="0 0 20 20"><path d="${sparkle(10, 10, 10)}" fill="${P.red}"/></svg>`).join('');

  /* ---------- ёлка (viewBox 0 0 320 420) ---------- */
  const CX = 160;
  const TIERS = [ // apex y, base y, полуширина — снизу вверх рисуются в обратном порядке
    { ay: 62, by: 160, hw: 74 },
    { ay: 112, by: 252, hw: 112 },
    { ay: 186, by: 352, hw: 148 },
  ];

  function tierPath({ ay, by, hw }) {
    const h = by - ay, cx = CX;
    return `M${cx} ${ay}
      C${cx - hw * 0.22} ${ay + h * 0.45} ${cx - hw * 0.7} ${by - h * 0.22} ${cx - hw} ${by - 6}
      Q${cx - hw - 7} ${by + 8} ${cx - hw + 16} ${by + 10}
      Q${cx - hw * 0.45} ${by + 2} ${cx - hw * 0.05} ${by + 14}
      Q${cx + hw * 0.45} ${by + 28} ${cx + hw - 16} ${by + 14}
      Q${cx + hw + 7} ${by + 8} ${cx + hw} ${by - 8}
      C${cx + hw * 0.72} ${by - h * 0.24} ${cx + hw * 0.2} ${ay + h * 0.42} ${cx} ${ay}Z`;
  }

  function tree() {
    const tiers = TIERS.slice().reverse().map((t, i) => {
      const k = 2 - i;
      return `<g class="tier">
        <ellipse cx="${CX + 6}" cy="${t.by + 16}" rx="${t.hw * 0.9}" ry="12" fill="#344b2f" opacity=".35" filter="url(#trBlur)"/>
        <path d="${tierPath(t)}" fill="url(#trBody)"/>
        <path d="${tierPath(t)}" fill="url(#trShine)"/>
        <path d="M${CX - 4} ${t.ay + 14} C${CX - t.hw * 0.25} ${t.ay + (t.by - t.ay) * 0.45} ${CX - t.hw * 0.62} ${t.by - (t.by - t.ay) * 0.25} ${CX - t.hw * 0.86} ${t.by - 6}"
          fill="none" stroke="#f6e7d4" stroke-opacity="${0.55 - k * 0.08}" stroke-width="5" stroke-linecap="round" filter="url(#trSoft)"/>
        <path d="M${CX - t.hw * 0.7} ${t.by + 8} Q${CX - t.hw * 0.2} ${t.by + 4} ${CX + t.hw * 0.1} ${t.by + 15}" fill="none" stroke="#f6e7d4" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    }).join('');

    // гирлянда с огоньками
    const halfAt = ({ ay, by, hw }, y) => ((y - ay) / (by - ay)) * hw * 0.9;
    const garland = (tier, n, off) => {
      const y1 = tier.by - 10, y2 = tier.by - 34;
      const x1 = CX - halfAt(tier, y1), x2 = CX + halfAt(tier, y2);
      const qx = CX, qy = (y1 + y2) / 2 + 24;
      const d = `M${x1.toFixed(1)} ${y1} Q${qx} ${qy} ${x2.toFixed(1)} ${y2}`;
      let dots = '';
      for (let i = 1; i < n; i++) {
        const t = i / n, x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * qx + t * t * x2;
        const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * qy + t * t * y2;
        dots += `<circle class="light" style="animation-delay:${-((i + off) % 4) * 0.45}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${P.blush}"/>`;
      }
      return `<path d="${d}" fill="none" stroke="${P.blush}" stroke-opacity=".75" stroke-width="1.4" stroke-dasharray="1 4" stroke-linecap="round"/>${dots}`;
    };

    const gift = (x, y, w, h, body, ribbon) => `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${body}"/>
      <rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="${ribbon}"/>
      <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="9" rx="3" fill="${body}" opacity=".9"/>
      <path d="M${x + w / 2} ${y - 1} q-12 -14 -14 -4 q2 6 14 4 q12 -14 14 -4 q-2 6 -14 4" fill="${ribbon}"/>
    </g>`;

    return `<svg class="tree__svg" viewBox="0 0 320 420" role="img" aria-label="Новогодняя ёлка">
      <defs>
        <linearGradient id="trBody" x1="0" y1="0" x2="1" y2=".25">
          <stop offset="0" stop-color="${P.envy}"/><stop offset=".32" stop-color="${P.spruce}"/><stop offset="1" stop-color="${P.pine}"/>
        </linearGradient>
        <radialGradient id="trShine" cx=".32" cy=".35" r=".55">
          <stop offset="0" stop-color="#f6e7d4" stop-opacity=".22"/><stop offset="1" stop-color="#f6e7d4" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="trStarGlow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#f6e7d4" stop-opacity=".95"/><stop offset=".4" stop-color="${P.blush}" stop-opacity=".45"/><stop offset="1" stop-color="${P.blush}" stop-opacity="0"/>
        </radialGradient>
        <filter id="trBlur" x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="trSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
      </defs>
      <ellipse cx="${CX}" cy="400" rx="150" ry="12" fill="#344b2f" opacity=".35"/>
      ${tiers}
      <g class="garland">${garland(TIERS[0], 6, 0)}${garland(TIERS[1], 9, 2)}${garland(TIERS[2], 12, 1)}</g>
      <g class="ornaments" id="ornLayer"></g>
      <g class="tree__gifts">
        ${gift(70, 362, 48, 34, P.blush, P.red)}${gift(196, 356, 58, 40, P.red, P.envy)}${gift(124, 374, 36, 24, P.blush, P.ruby)}
      </g>
      <g class="tree__star">
        <circle cx="${CX}" cy="44" r="46" fill="url(#trStarGlow)"/>
        <path d="${starPath(CX, 46, 24, 10.5)}" fill="#f6e7d4" stroke="#f6e7d4" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="${starPath(CX, 46, 10, 4.5)}" fill="#f6e7d4" opacity=".8"/>
      </g>
    </svg>`;
  }

  // можно ли повесить игрушку в точку (x, y) в координатах viewBox ёлки
  function onBranch(x, y) {
    return TIERS.some(({ ay, by, hw }) => {
      if (y < ay + 22 || y > by + 2) return false;
      const half = ((y - ay) / (by - ay)) * hw * 0.86;
      return Math.abs(x - CX) <= half - 9;
    });
  }

  /* ---------- 10 шаблонов игрушек (центр в 0,0, радиус ≈ 12) ---------- */
  const cap = (y = -12) => `<rect x="-3.6" y="${y - 3.5}" width="7.2" height="4.5" rx="1.2" fill="#f6e7d4"/><circle cx="0" cy="${y - 6}" r="2.4" fill="none" stroke="#f6e7d4" stroke-width="1.3"/>`;
  const gloss = (r = 12) => `<ellipse cx="${-r * 0.36}" cy="${-r * 0.4}" rx="${r * 0.3}" ry="${r * 0.18}" fill="#f6e7d4" opacity=".55" transform="rotate(-35 ${-r * 0.36} ${-r * 0.4})"/>`;

  const ornamentDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <radialGradient id="oRuby" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d7240c"/><stop offset="1" stop-color="${P.ruby}"/></radialGradient>
    <radialGradient id="oRed" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d7240c"/><stop offset="1" stop-color="#d7240c"/></radialGradient>
    <radialGradient id="oBlush" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="#f6e7d4"/></radialGradient>
    <radialGradient id="oEnvy" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="#d7edd2"/></radialGradient>
    <radialGradient id="oPink" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="#d7240c"/></radialGradient>
    <radialGradient id="oGold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6e7d4"/><stop offset="1" stop-color="#9e2117"/></radialGradient>
    <radialGradient id="oBlue" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d7240c"/><stop offset="1" stop-color="${P.ruby}"/></radialGradient>
    <clipPath id="oBall"><circle r="12"/></clipPath>
  </defs></svg>`;

  const ORNAMENTS = [
    { name: 'Рубиновый шар', svg: `${cap()}<circle r="12" fill="url(#oRuby)"/>${gloss()}` },
    { name: 'Шар в полоску', svg: `${cap()}<circle r="12" fill="url(#oRed)"/><g clip-path="url(#oBall)" fill="${P.blush}"><rect x="-13" y="-5" width="26" height="3.2"/><rect x="-13" y="2" width="26" height="3.2"/></g>${gloss()}` },
    { name: 'Шар в горошек', svg: `${cap()}<circle r="12" fill="url(#oBlush)"/><g fill="${P.red}"><circle cx="-5" cy="-3" r="2"/><circle cx="4" cy="-6" r="1.6"/><circle cx="5" cy="3" r="2.2"/><circle cx="-3" cy="6" r="1.7"/><circle cx="-9" cy="3" r="1.3"/><circle cx="10" cy="-1" r="1.2"/></g>${gloss()}` },
    { name: 'Мятный шар', svg: `${cap()}<circle r="12" fill="url(#oEnvy)"/><g clip-path="url(#oBall)"><path d="M-13 1 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" fill="none" stroke="${P.spruce}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-13 7 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" fill="none" stroke="${P.red}" stroke-width="1.4" stroke-linejoin="round"/></g>${gloss()}` },
    { name: 'Розовый шар со снежинкой', svg: `${cap()}<circle r="12" fill="url(#oPink)"/><g stroke="#f6e7d4" stroke-width="1.4" stroke-linecap="round">${[0, 60, 120].map((a) => `<line x1="0" y1="-7" x2="0" y2="7" transform="rotate(${a})"/>`).join('')}${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M-2 -5 L0 -3 L2 -5" fill="none" transform="rotate(${a})"/>`).join('')}</g>${gloss()}` },
    { name: 'Звёздочка', svg: `<line x1="0" y1="-18" x2="0" y2="-11" stroke="#f6e7d4" stroke-width="1.2"/><path d="${starPath(0, 0, 13, 5.6)}" fill="url(#oGold)" stroke="#f6e7d4" stroke-width=".8" stroke-linejoin="round"/>` },
    { name: 'Леденец', svg: `<path d="M3 13 V-6 a6 6 0 0 0 -12 0" fill="none" stroke="${P.blush}" stroke-width="5" stroke-linecap="round"/><path d="M3 13 V-6 a6 6 0 0 0 -12 0" fill="none" stroke="${P.red}" stroke-width="5" stroke-dasharray="3 3.5"/>` },
    { name: 'Сосулька', svg: `${cap(-13)}<path d="M-8 -12 H8 Q9 -2 3 8 L0 16 L-3 8 Q-9 -2 -8 -12Z" fill="url(#oEnvy)"/><g fill="${P.ruby}"><path d="M-8.4 -7 H8.4 L8 -4 H-8Z"/><path d="M-5.5 3 H5.5 L4.4 6 H-4.4Z"/></g><ellipse cx="-3.5" cy="-8" rx="1.6" ry="4" fill="#f6e7d4" opacity=".6"/>` },
    { name: 'Сердечко', svg: `<line x1="0" y1="-16" x2="0" y2="-7" stroke="#f6e7d4" stroke-width="1.2"/><path d="M0 12 C-14 2 -14 -10 -6 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 6 -10 C14 -10 14 2 0 12Z" fill="url(#oRed)"/><ellipse cx="-6" cy="-5" rx="3" ry="1.8" fill="#f6e7d4" opacity=".5" transform="rotate(-30 -6 -5)"/>` },
    { name: 'Бантик', svg: `<path d="M0 0 C-6 -10 -15 -9 -13 -1 C-12 4 -5 3 0 0Z M0 0 C6 -10 15 -9 13 -1 C12 4 5 3 0 0Z" fill="url(#oBlue)"/><path d="M-1 1 L-7 13 L-3 11 L-1 14Z M1 1 L7 13 L3 11 L1 14Z" fill="${P.ruby}"/><circle r="3" fill="${P.ruby}"/>` },
  ];

  const ornament = (t) => ORNAMENTS[((t % ORNAMENTS.length) + ORNAMENTS.length) % ORNAMENTS.length].svg;
  const ornamentIcon = (t) => `<svg viewBox="-17 -22 34 38">${ornament(t)}</svg>`;

  window.DECOR = { P, paper, introBox, introSparkles, tree, onBranch, ornamentDefs, ornament, ornamentIcon, ORNAMENTS, sparkle };
})();
