/* 사도행전 여행 스트립: 예루살렘에서 로마까지, 작은 캐릭터들이 사건을 반복한다.
   배경 타일과 캐릭터 그림은 assets/ 에 있고, 좌표·크기는 assets/data.js(tools/ 로 생성)에서 읽는다. */
(() => {
  'use strict';
  const cv = document.getElementById('acts-canvas');
  const D = window.ACTS_DATA;
  if (!cv || !D) return;
  const screen = cv.parentElement;
  const g = cv.getContext('2d');
  const W = D.world, H = W.h, worldW = W.w;
  const G = 478;                 // 길 위 발 기준선
  const B = 0.42 / D.k;          // 캐릭터 기본 크기(아틀라스 px → 월드 px)
  const RAD = Math.PI / 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let T = 0;

  const atlas = new Image();
  atlas.src = D.atlas;
  const tiles = W.tiles.map((t) => ({ x: t.x, w: t.w, src: t.src, img: null }));
  const tileImg = (i) => { const t = tiles[i]; if (!t.img) { t.img = new Image(); t.img.src = t.src; } return t.img; };
  const ready = (im) => im.complete && im.naturalWidth > 0;

  /* ---------- 도구 ---------- */
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);
  const between = (t, a, b) => t >= a && t < b;
  const fr = (t, fps) => Math.floor(t * fps);
  const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const A = (a, fn) => { const p = g.globalAlpha; g.globalAlpha = p * clamp(a); fn(); g.globalAlpha = p; };

  // 스프라이트: (x, y) = 발밑 가운데
  function spr(name, x, y, o) {
    const a = D.spr[name];
    if (!a || !ready(atlas)) return;
    o = o || {};
    const s = B * (o.s || 1), w = a[2] * s, h = a[3] * s;
    const breathe = o.still ? 1 : 1 + Math.sin(T * 3 + a[0] * 0.37 + a[1]) * 0.012;
    const vis = o.cut ? clamp(1 - o.cut / h) : 1;   // 아래쪽 cut px 숨김(물속·난간 뒤)
    if (vis <= 0) return;
    g.save();
    g.translate(x, y);
    if (o.rot) {
      if (o.mid) { g.translate(0, -h / 2); g.rotate(o.rot * RAD); g.translate(0, h / 2); }
      else g.rotate(o.rot * RAD);
    }
    g.scale(o.flip ? -1 : 1, breathe * (o.sy || 1));
    if (o.a != null) g.globalAlpha *= clamp(o.a);
    g.drawImage(atlas, a[0], a[1], a[2], a[3] * vis, -w / 2, -h, w, h * vis);
    g.restore();
  }
  // 총총 걷기
  function walker(name, x, y, t, o) {
    const sp = (o && o.sp) || 9;
    spr(name, x, y - Math.abs(Math.sin(t * sp)) * 5, { ...o, rot: Math.sin(t * sp) * 3 });
  }
  const act = (name, x, y, walking, t, o) => (walking ? walker(name, x, y, t, o) : spr(name, x, y, o));
  // 배경 일부를 다시 덮어 그리기(차꼬·물결을 캐릭터 앞에 두거나, 건물을 흔들 때)
  function bgSlice(ti, sx, sy, sw, sh, dx, dy) {
    const im = tileImg(ti);
    if (ready(im)) g.drawImage(im, sx, sy, sw, sh, dx == null ? sx : dx, dy == null ? sy : dy, sw, sh);
  }

  /* ---------- 픽셀 효과 ---------- */
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function fx(x, y, u, fn) { g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(u, u); fn(); g.restore(); }
  const INK = '#3b2a26', PAPER = '#fffdf5';
  const GL = {
    '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '....#', '..##.', '.....', '..#..'],
    h: ['.#.#.', '#####', '#####', '.###.', '..#..'],
    n: ['..##.', '..#.#', '..#..', '.##..', '.##..'],
    '.': ['.....', '.....', '.....', '.....', '#.#.#'],
    '+': ['..#..', '.###.', '..#..', '..#..', '..#..'],
    z: ['####.', '..#..', '.#...', '####.', '.....'],
  };
  const GLC = { '!': '#e0603c', '?': '#3f6fb5', h: '#e0603c', n: INK, '.': INK, '+': '#b5483a', z: '#6b7a99' };
  function glyph(x, y, k, c) {
    const m = GL[k];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (m[j][i] === '#') R(x + i, y + j, 1, 1, c);
  }
  // 말풍선: (cx, top) = 머리 위 가운데
  function emote(cx, top, k) {
    fx(cx - 22, top - 50, 4, () => {
      R(1, 0, 9, 11, INK); R(-1, 2, 13, 7, INK); R(0, 1, 11, 9, INK);
      R(1, 1, 9, 9, PAPER); R(0, 2, 11, 7, PAPER);
      R(4, 10, 1, 1, PAPER); R(4, 11, 1, 1, INK);
      glyph(3, 3, k, GLC[k]);
    });
  }
  // 떠다니는 기호(음표·z): 흰 테두리
  function floaty(x, y, k, a, c) {
    A(a, () => fx(x, y, 4, () => {
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([i, j]) => glyph(i, j, k, '#ffffff'));
      glyph(0, 0, k, c || GLC[k]);
    }));
  }
  function sparkle(x, y, s) {
    const f = (Math.floor(T * 6) + (s || 0)) % 4;
    if (f === 3) return;
    fx(x, y, 4, () => {
      const c = '#fff3a8';
      R(0, 0, 1, 1, '#ffffff');
      if (f >= 1) { R(-1, 0, 1, 1, c); R(1, 0, 1, 1, c); R(0, -1, 1, 1, c); R(0, 1, 1, 1, c); }
      if (f === 2) { R(-2, 0, 1, 1, c); R(2, 0, 1, 1, c); R(0, -2, 1, 1, c); R(0, 2, 1, 1, c); }
    });
  }
  function flame(x, y, i, s) {
    spr('flame', x, y, { s: s || 0.3, flip: (fr(T, 7) + i) & 1, sy: 1 + 0.12 * Math.sin(T * 14 + i * 2), still: true });
  }
  // 위에서 내려오는 빛기둥
  function beam(cx, y0, y1, w, a) {
    const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    gr.addColorStop(0, 'rgba(255,246,190,0)'); gr.addColorStop(0.3, `rgba(255,248,205,${a})`);
    gr.addColorStop(0.5, `rgba(255,255,255,${Math.min(1, a * 1.5)})`);
    gr.addColorStop(0.7, `rgba(255,248,205,${a})`); gr.addColorStop(1, 'rgba(255,246,190,0)');
    g.fillStyle = gr; g.fillRect(cx - w / 2, y0, w, y1 - y0);
  }
  function glow(cx, cy, r, a, c) {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, `rgba(${c || '255,236,170'},${a})`); gr.addColorStop(1, `rgba(${c || '255,236,170'},0)`);
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  function ripple(x, y, w) {
    const p = (T * 0.8) % 1;
    g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - p)})`; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y, w * (0.5 + p * 0.5), 6 + p * 4, 0, 0, Math.PI * 2); g.stroke();
  }
  let darkCloud = null;
  function cloudDark(x, y, s, a) {
    const c = D.spr.cloud;
    if (!ready(atlas)) return;
    if (!darkCloud) {
      darkCloud = document.createElement('canvas'); darkCloud.width = c[2]; darkCloud.height = c[3];
      const d = darkCloud.getContext('2d');
      d.drawImage(atlas, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]);
      d.globalCompositeOperation = 'source-atop'; d.fillStyle = 'rgba(58,66,88,0.62)'; d.fillRect(0, 0, c[2], c[3]);
    }
    const w = c[2] * B * s, h = c[3] * B * s;
    A(a, () => g.drawImage(darkCloud, x - w / 2, y - h, w, h));
  }

  /* ---------- 장면 ---------- */
  const S = [
    {
      n: '1', chip: '행 1장', title: '승천', tile: 0, x0: 0, x1: 790, p: 10, still: 4.6,
      desc: '구름이 예수님을 가리고, 제자들은 하늘을 쳐다봅니다. “땅 끝까지 내 증인이 되리라.”',
      draw(t) {
        const k = seg(t, 2, 6.6), e = ease(k), jy = lerp(338, 62, e);
        const ca = seg(t, 0.6, 2) * (1 - seg(t, 8.4, 9.8));
        if (k > 0 && k < 1) beam(420, jy - 20, 340, 70, 0.4 * (1 - e));
        if (k < 1) spr('jesus', 420, jy, { s: 0.95, a: 1 - seg(jy, 205, 115) });
        spr('cloud', 420 + Math.sin(T * 0.5) * 6, 170, { s: 1.15, a: ca, still: true });
        if (between(t, 5.6, 9)) { sparkle(338, 100, 0); sparkle(505, 122, 2); sparkle(420, 62, 1); }
        const look = between(t, 2, 7.6), tilt = look ? -5 : 0;
        spr(look ? 'peter_joy' : 'peter', 150, G, { rot: tilt });
        spr(look ? 'john_joy' : 'john', 238, G, { rot: tilt });
        spr('look_up', 578, G, { flip: true, rot: -tilt });
        spr('shocked', 658, G, { flip: true });
        spr(look ? 'd4_joy' : 'd4_pray', 738, G, { flip: true });
        if (between(t, 2.3, 3.8)) emote(238, G - 128, '!');
        if (between(t, 7.6, 9.9)) {
          const a = seg(t, 7.6, 8) * (1 - seg(t, 9.5, 9.9));
          spr('angel', 338, G - 4 + Math.sin(T * 3) * 2, { a }); spr('angel_side', 480, G - 4 + Math.cos(T * 3) * 2, { a, flip: true });
          sparkle(300, G - 120, 1); sparkle(520, G - 110, 3);
        }
      },
    },
    {
      n: '2', chip: '행 2장', title: '오순절', tile: 0, x0: 790, x1: 1443, p: 10, still: 6,
      desc: '급하고 강한 바람 소리, 불의 혀 같은 것이 각 사람 위에. 성령이 임하셨어요.',
      draw(t) {
        const wind = between(t, 1.8, 4.4), up = t > 4.4;
        const xs = [1050, 1112, 1174, 1236, 1298, 1356];
        const pray = ['peter_pray', 'john', 'd1_pray', 'd2_pray', 'd3_pray', 'd4_pray'];
        const joy = ['peter_joy', 'john_joy', 'd1_joy', 'd2_joy', 'd3_joy', 'd4_joy'];
        // 뒷줄(짝수)부터 그려 앞줄이 겹치게
        [0, 2, 4, 1, 3, 5].forEach((i) => {
          const y = 300 + (i & 1 ? 4 : 0) + (up ? -Math.abs(Math.sin(t * 5 + i)) * 4 : 0);
          spr(up ? joy[i] : pray[i], xs[i], y, { s: 0.8, rot: wind ? Math.sin(t * 9 + i) * 3 : 0, flip: !up && i >= 3 });
        });
        xs.forEach((x, i) => { if (t > 3.6 + i * 0.15 && t < 9.7) flame(x, up ? 190 : 196, i); });
        if (between(t, 5, 9.4)) { const i = Math.floor((t - 5) / 0.9) % 6; emote(xs[i], 168, ['n', 'h', '+', 'n', '!', 'h'][i]); }
        if (wind) A(0.8, () => {
          g.fillStyle = '#ffffff';
          for (let i = 0; i < 7; i++) {
            const x = 760 + (((t - 1.8) * 420 + i * 137) % 760), y = [50, 105, 215, 255, 335, 390, 160][i];
            g.fillRect(x, y, 78, 5); g.fillRect(x + 22, y + 8, 40, 4);
          }
        });
        if (t > 5) {
          const k = seg(t, 5, 7);
          act('puzzled', lerp(700, 842, k), G, k < 1, t + 0.5);
          act('traveler', lerp(760, 925, k), G, k < 1, t);
          if (between(t, 7.1, 8.4)) emote(842, G - 128, '?');
          if (between(t, 8.4, 9.7)) emote(925, G - 128, '!');
        }
      },
    },
    {
      n: '3', chip: '행 3장', title: '미문 앞에서', tile: 1, x0: 0, x1: 740, p: 10, still: 6,
      desc: '은과 금은 없지만! 베드로의 손을 잡고 일어난 사람이 걷고 뛰며 찬송합니다.',
      draw(t) {
        const lv = seg(t, 8.6, 10), going = t >= 8.6, walk = t < 2.6 || going, joy = between(t, 4.6, 8.6);
        const xp = going ? lerp(240, 385, lv) : lerp(-60, 240, seg(t, 0, 2.6));
        const xj = going ? lerp(152, 335, lv) : xp - 88;
        const y = going ? lerp(G, 356, ease(lv)) : G, o = going ? { s: lerp(1, 0.8, lv), a: 1 - seg(lv, 0.75, 1) } : {};
        act(joy ? 'john_joy' : 'john', xj, y, walk, t + 0.4, o);
        if (between(t, 2.6, 4.2)) spr('peter_reach', 246, G);
        else act(joy ? 'peter_joy' : 'peter', xp, y, walk, t, o);
        if (between(t, 3, 4.2)) emote(246, G - 124, '+');
        if (t < 4.2) spr('beggar_sit', 338, G + 2, { flip: true });
        else if (!going) {
          const q = t - 4.2, jx = 425 + Math.sin(q * 1.4) * 125, jy = G - Math.abs(Math.sin(q * 5)) * 28;
          spr('beggar_leap', jx, jy, { flip: Math.cos(q * 1.4) < 0, rot: Math.sin(q * 5) * 6 });
          if (between(t, 5.4, 7.8)) emote(jx, jy - 120, fr(t, 1.2) & 1 ? 'n' : 'h');
        } else walker('beggar_leap', lerp(410, 430, lv), y, t + 0.2, o);
      },
    },
    {
      n: '8', chip: '행 8장', title: '빌립과 에티오피아 내시', tile: 1, x0: 740, x1: 1437, p: 12, still: 7.2,
      desc: '수레에 올라 복음을 전하고, 길가 물에서 세례를 줍니다. 내시는 기쁘게 길을 갑니다.',
      draw(t) {
        const cxAt = (u) => lerp(790, 1040, seg(u, 0, 5.5));
        const cx = t < 5.5 ? cxAt(t) : t < 10 ? 1040 : lerp(1040, 1600, seg(t, 10, 12) ** 2);
        const moving = t < 5.5 || t >= 10, cb = moving ? Math.sin(t * 18) * 1.5 : 0;
        // 못가의 두 사람(수레보다 뒤)
        if (between(t, 5.5, 10)) {
          const k = seg(t, 5.5, 6.8), back = seg(t, 9.2, 10);
          if (t < 9.2) {
            const px = lerp(960, 1212, k), py = lerp(G, 380, k), d = 30 * seg(k, 0.8, 1);
            act('philip', px, py + d, k < 1, t, { cut: d });
            if (d > 0) ripple(px, py, 46);
          } else if (t < 9.9) { sparkle(1212, 330, 0); sparkle(1235, 300, 2); sparkle(1190, 290, 1); }
          const ex = t < 9.2 ? lerp(1012, 1288, k) : lerp(1288, 1012, back), ey = t < 9.2 ? lerp(G, 382, k) : lerp(382, G, back);
          const inw = t < 9.2 ? seg(k, 0.8, 1) : 1 - seg(back, 0, 0.25);
          const d = 30 * inw + (between(t, 7.5, 8.2) ? 62 : 0);
          act(t < 8.2 ? 'eth_pray' : 'eth_joy', ex, ey + d, (k < 1 && t < 6.8) || t >= 9.2, t, { cut: d, flip: t >= 9.2 && t < 8.2 });
          if (inw > 0) ripple(ex, ey, 46);
          if (between(t, 8.2, 8.7)) {
            const q = (t - 8.2) * 2;
            g.fillStyle = '#e8f8ff';
            [-34, -16, 6, 24, 40].forEach((dx, i) => g.fillRect(ex + dx, ey - 10 - Math.sin(q * Math.PI) * (26 + (i % 3) * 12), 6, 6));
          }
          if (between(t, 8.2, 9.2)) { sparkle(ex - 30, ey - 120, 0); sparkle(ex + 34, ey - 100, 2); }
        }
        spr('chariot', cx, G + cb, { still: true, rot: moving ? Math.sin(t * 9) * 0.8 : 0 });
        if (moving) {
          spr(t >= 10 ? 'eth_joy' : 'eth_read', cx - 52, G - 44 + cb, { s: 0.5, cut: 10 });
          if (between(t, 3.2, 5.5)) spr('philip', cx - 104, G - 6 + cb, { s: 0.82, rot: Math.sin(t * 9) * 2 });
          if (between(t, 1, 3)) emote(cx - 52, G - 128, '?');
          if (between(t, 3.6, 5.3)) emote(cx - 104, G - 112, '+');
          if (between(t, 10.2, 11.6)) emote(cx - 52, G - 128, 'n');
        }
        if (between(t, 0.6, 3.2)) walker('philip_run', lerp(690, cxAt(3.2) - 104, seg(t, 0.6, 3.2)), G, t, { sp: 14 });
      },
    },
    {
      n: '9', chip: '행 9장', title: '다메섹 길', tile: 2, x0: 0, x1: 770, p: 10, still: 4.6,
      desc: '하늘에서 쏟아진 빛에 사울이 엎드러집니다. 박해자가 전도자가 되는 순간.',
      draw(t) {
        const PATH = [[455, 478], [505, 446], [470, 388], [520, 336], [598, 304], [634, 292]];
        const along = (u) => {
          if (u <= 0) return [455 + u * 320, 478];
          const f = Math.min(0.9999, u) * (PATH.length - 1), i = Math.floor(f), q = f - i;
          return [lerp(PATH[i][0], PATH[i + 1][0], q), lerp(PATH[i][1], PATH[i + 1][1], q)];
        };
        if (between(t, 3.2, 6.8)) {
          beam(412, 0, G + 6, 170, 0.68 + 0.12 * Math.sin(t * 18));
          sparkle(372, 120, 0); sparkle(455, 260, 2); sparkle(380, 370, 1);
        }
        if (t < 3.2) {
          const xs = lerp(-70, 400, seg(t, 0, 3.2));
          walker('look_up', xs - 190, G, t + 0.3); walker('traveler', xs - 100, G, t + 0.6); walker('saul_walk', xs, G, t);
        } else if (t < 6.8) {
          spr('look_up', 210, G, { rot: -4 }); spr('traveler', 300, G, { rot: Math.sin(t * 30) * 1.5 });
          spr('saul_fall', 418, G + 4);
          if (t < 5.2) emote(300, G - 128, '!');
          if (between(t, 4.6, 6.6)) emote(210, G - 128, '?');
        } else {
          const u = t < 7.4 ? 0 : seg(t, 7.4, 10) * 1.02, pre = seg(t, 6.8, 7.4);
          const who = [['traveler', t < 7.4 ? lerp(-0.485, 0, pre) : u], ['saul_blind', u - 0.125], ['look_up', t < 7.4 ? lerp(-0.766, -0.3, pre) : u - 0.3]];
          who.slice().sort((a, b) => b[1] - a[1]).forEach(([name, uu]) => {
            const [x, y] = along(uu), c = clamp(uu);
            const mv = name === 'saul_blind' ? t >= 7.4 : true;
            act(name, x, y, mv, t + uu * 9, { s: 1 - 0.62 * c ** 1.1, a: 1 - seg(uu, 0.88, 1) });
          });
        }
        if (between(t, 3.2, 3.5)) A(0.7 * (1 - seg(t, 3.2, 3.5)), () => beam(412, 0, 500, 700, 1));
      },
    },
    {
      n: '10', chip: '행 10장', title: '욥바의 환상', tile: 2, x0: 770, x1: 1446, p: 10, still: 4.6,
      desc: '지붕 위에서 기도하던 베드로에게 큰 보자기가 내려옵니다. 복음에는 경계가 없어요.',
      draw(t) {
        const dn = ease(seg(t, 1.5, 3.5)), up = seg(t, 6, 7.4);
        const sy = lerp(lerp(-50, 150, dn), -50, up * up);
        if (t > 1.5 && t < 7.4) {
          g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(1172, 0); g.lineTo(1172, sy - 84); g.moveTo(1282, 0); g.lineTo(1282, sy - 84); g.stroke();
          spr('sheet', 1227, sy, { s: 0.72, rot: Math.sin(T * 1.6) * 2, still: true });
        }
        const down = t > 8;
        spr(down ? 'peter' : 'peter_pray', 1078, 194, { s: 0.8, flip: down });
        if (between(t, 3.6, 5.6)) emote(1078, 194 - 92, '?');
        if (between(t, 8.2, 9.7)) emote(1078, 194 - 102, '!');
        if (t > 6.4) {
          const k = seg(t, 6.4, 9);
          ['puzzled', 'msg_servant', 'msg_soldier'].forEach((n, i) => act(n, lerp(650 + i * 85, 760 + i * 85, k), G, k < 1, t + i * 0.4));
        }
      },
    },
    {
      n: '12', chip: '행 12장', title: '옥에서 나온 베드로', tile: 3, x0: 0, x1: 720, p: 10, still: 5.2,
      desc: '천사가 깨우자 쇠사슬이 풀리고, 쇠문이 저절로 열립니다. 파수꾼은 아직 꿈나라.',
      draw(t) {
        const FL = 394, fy = (x) => lerp(FL, G, seg(x, 600, 690));
        let ax = 440, px = 352;
        if (t >= 4.2) { const k = seg(t, 4.2, 6.4), k2 = seg(t, 7.1, 8.8); ax = lerp(lerp(440, 548, k), 775, k2); px = lerp(lerp(352, 468, k), 692, k2); }
        const mv = between(t, 4.2, 6.4) || between(t, 7.1, 8.8);
        if (between(t, 2, 8.8)) glow(ax, fy(ax) - 70, 150, 0.4 * seg(t, 2, 2.4));
        // 쇠문이 저절로 열림
        const open = seg(t, 6.4, 7.1) * (1 - seg(t, 9.6, 10));
        if (open > 0) {
          g.save(); g.beginPath(); g.rect(560, 400 - 196 * open, 104, 196 * open); g.clip();
          g.fillStyle = '#1f1b24'; g.beginPath(); g.moveTo(566, 400); g.lineTo(566, 253); g.arc(611, 253, 45, Math.PI, 0); g.lineTo(656, 400); g.closePath(); g.fill();
          g.restore();
        }
        spr('guard_sleep', 250, FL, { s: 0.95, rot: Math.sin(T * 1.5) * 1.5 });
        spr('guard_sleep', 470, FL, { s: 0.95, flip: true, rot: -Math.sin(T * 1.5 + 1) * 1.5 });
        for (let i = 0; i < 2; i++) { const ph = (T * 0.4 + i * 0.5) % 1, gx = i ? 470 : 250; floaty(gx + 18 + ph * 22, FL - 122 - ph * 36, 'z', 1 - ph); }
        if (t < 3.4) spr('peter_sleep', 352, FL + 2, { s: 0.95 });
        else act('peter', px, fy(px), mv, t, { s: 0.95 });
        if (between(t, 2, 8.8)) {
          spr(t < 4.2 ? 'angel_side' : 'angel', ax, fy(ax) - 6 + Math.sin(T * 3) * 2, { s: 0.95, a: seg(t, 2, 2.4) * (1 - seg(t, 8.5, 8.8)) });
          if (t < 2.8) { sparkle(ax - 40, FL - 130, 0); sparkle(ax + 44, FL - 90, 2); }
        } else if (between(t, 8.8, 9.6)) { sparkle(770, G - 60, 0); sparkle(745, G - 110, 2); sparkle(800, G - 95, 1); }
        if (between(t, 3.4, 3.9)) { sparkle(300, FL - 20, 1); sparkle(405, FL - 24, 3); }
        if (between(t, 3.4, 4.2) || between(t, 9, 10)) emote(px, fy(px) - 122, '!');
      },
    },
    {
      n: '16', chip: '행 16장', title: '빌립보 감옥', tile: 3, x0: 720, x1: 1434, p: 10, still: 3,
      desc: '한밤중의 찬송, 그리고 큰 지진. 옥문이 열리고 간수와 온 집이 믿게 됩니다.',
      draw(t) {
        const quake = between(t, 4.2, 5.6);
        const jx = quake ? (fr(t, 20) & 1 ? 3 : -3) : 0, jy = quake ? (fr(t, 13) & 1 ? 2 : -1) : 0;
        if (quake) bgSlice(3, 850, 70, 584, 372, 850 + jx, 70 + jy);
        glow(1212, 215, 90 + Math.sin(T * 11) * 8, 0.3, '255,190,90');
        const stand = t > 5.9, sing = t < 4.2 || t > 9.2;
        spr('silas_sing', 1163 + jx, 378 + jy, { rot: sing ? Math.sin(T * 4 + 1) * 4 : 0 });
        if (!stand) spr('paul_sing', 1088 + jx, 378 + jy, { rot: sing ? Math.sin(T * 4) * 4 : 0 });
        bgSlice(3, 1030, 318, 182, 82, 1030 + jx, 318 + jy);   // 차꼬를 두 사람 앞에
        if (stand) spr(between(t, 8.2, 9.2) ? 'paul_preach' : t > 9.2 ? 'paul_pray' : 'paul', 1078, 404);
        if (quake) { g.fillStyle = '#d8d0c4'; for (let i = 0; i < 10; i++) g.fillRect(990 + i * 30, 185 + (((t - 4.2) * 150 + i * 37) % 190), 5, 5); }
        if (sing) for (let i = 0; i < 3; i++) {
          const ph = (T * 0.4 + i / 3) % 1;
          floaty(1105 + i * 30 + Math.sin(ph * 7 + i) * 10, 262 - ph * 150, 'n', 1 - ph * 0.7);
        }
        if (t > 5.6) {
          const k = seg(t, 5.6, 6.9), x = lerp(1470, 1262, k), y = lerp(404, G, seg(x, 1290, 1400));
          if (k < 1) walker('jailer_run', x, y, t, { flip: true, sp: 14 });
          else spr('jailer_kneel', 1262 + (t < 9.2 && fr(t, 14) & 1 ? 2 : 0), 406);
          if (between(t, 7, 8.2)) emote(1262, 406 - 116, '?');
          if (t > 9.2) emote(1262, 406 - 116, 'h');
        }
        if (between(t, 8.2, 9.2)) emote(1078, 404 - 124, '+');
      },
    },
    {
      n: '17', chip: '행 17장', title: '아덴에서', tile: 4, x0: 0, x1: 900, p: 10, still: 4.4,
      desc: '“알지 못하는 신에게”라고 새긴 단 앞에서, 바울이 참 하나님을 전합니다.',
      draw(t) {
        const pointing = t < 3;
        fx(120, 302, 6, () => glyph(0, 0, '?', pointing && fr(t, 3) & 1 ? '#e0603c' : '#9a9488'));
        spr(t >= 7.6 ? 'paul_pray' : 'paul_preach', 300, 350, { flip: pointing, rot: !pointing && t < 7.6 ? Math.sin(t * 9) * 2.5 : 0 });
        if (between(t, 3.4, 6)) emote(300, 350 - 126, '+');
        const fwd = ease(seg(t, 6.5, 7.6)), glad = t > 8;
        const hopY = (i) => (glad ? -Math.abs(Math.sin(t * 6 + i)) * 8 : 0);
        const m1 = t > 6 ? (t - 6) * 70 : 0, m2 = t > 6.6 ? (t - 6.6) * 70 : 0;
        act('phil_mock', 770 + m1, G, m1 > 0, t, { a: 1 - seg(770 + m1, 880, 960) });
        act('phil_skeptic', 690 + m2, G, m2 > 0, t + 0.3, { flip: m2 === 0, a: 1 - seg(690 + m2, 880, 960) });
        spr('phil_think', 608, G, { rot: Math.sin(T * 1.2) * 2 });
        act('damaris_joy', lerp(525, 500, fwd), G + hopY(1), fwd > 0 && fwd < 1, t, { flip: true });
        act('dion_joy', lerp(445, 412, fwd), G + hopY(0), fwd > 0 && fwd < 1, t + 0.4);
        if (between(t, 1, 2.6)) emote(608, G - 128, '?');
        if (between(t, 4, 5.6)) emote(690, G - 128, '.');
        if (between(t, 8, 9.7)) emote(412, G - 132, 'h');
      },
    },
    {
      n: '20', chip: '행 20장', title: '창가의 유두고', tile: 4, x0: 900, x1: 1449, p: 11, still: 2,
      desc: '설교가 길어져 창가에서 졸다 떨어진 청년. 바울이 안아 일으키자 살아납니다.',
      draw(t) {
        g.save(); g.beginPath(); g.rect(1100, 92, 196, 91); g.clip();
        if (t < 4.8) spr(t < 3.2 ? 'paul_preach' : 'paul', 1240, 214, { s: 0.85, rot: t < 3.2 ? Math.sin(t * 9) * 2.5 : 0 });
        g.restore();
        if (t < 3.2) {
          spr('euty_sleep', 1130, 190, { s: 0.72, rot: t > 1 ? Math.sin(t * 2.4) * 7 - 5 : 0 });
          if (t > 1.2) for (let i = 0; i < 2; i++) { const ph = (T * 0.45 + i * 0.5) % 1; floaty(1085 - ph * 26, 96 - ph * 40, 'z', 1 - ph); }
        } else if (t < 4.2) {
          const k = seg(t, 3.2, 4.2);
          spr('euty_lie', lerp(1105, 1002, k), lerp(175, G + 4, k * k), { rot: -k * 350, mid: true });
        } else if (t < 6.2) spr('euty_lie', 1000, G + 4);
        if (between(t, 4.2, 4.8)) { const q = (t - 4.2) / 0.6; g.fillStyle = `rgba(240,228,200,${1 - q})`; [-70, -40, 40, 70].forEach((dx) => g.fillRect(1000 + dx * (1 + q * 0.4), G - 8 - q * 26, 9, 9)); }
        if (between(t, 3.3, 4.8)) emote(1240, 150, '!');
        if (t > 4.8) {
          const k = seg(t, 4.8, 5.8), joy = t > 7.6, a = seg(k, 0, 0.2);
          act(joy ? 'd1_joy' : 'd1_pray', lerp(1320, 1295, k), lerp(446, G, k), k < 1, t, { flip: !joy, a });
          act('shocked', lerp(1320, 1205, k), lerp(446, G, k), k < 1, t + 0.4, { flip: true, a });
          if (between(t, 5, 6.2)) emote(1205, G - 128, '!');
        }
        if (t > 5.2) {
          const k = seg(t, 5.2, 6.2);
          if (k < 1) walker('paul', lerp(1320, 1112, k), lerp(446, G, seg(k, 0, 0.35)), t, { flip: true, a: seg(k, 0, 0.15) });
          else if (t < 7.4) spr('paul_hug', 1042, G + 3, { flip: true });
          else spr('paul_pray', 1102, G);
        }
        if (t >= 7.4) {
          const hopv = t > 7.8 ? Math.abs(Math.sin((t - 7.8) * 5)) * 12 : 0;
          spr('euty_joy', 1002, G - hopv);
          if (between(t, 8.2, 10.4)) emote(1002, G - hopv - 126, 'h');
        }
        if (between(t, 6.8, 8.2)) { sparkle(960, G - 100, 0); sparkle(1050, G - 140, 2); sparkle(1005, G - 170, 1); }
      },
    },
    {
      n: '27', chip: '행 27장', title: '풍랑 속의 배', tile: 5, x0: 0, x1: 1452, p: 10, still: 4.4,
      desc: '유라굴로 광풍 속에서도 “안심하라”. 배에 탄 276명이 모두 구조됩니다.',
      draw(t) {
        const s = reduce ? 0.7 : seg(t, 1, 2.6) * (1 - seg(t, 7.4, 9));
        const bob = Math.sin(T * 2.1) * (3 + 8 * s), rot = Math.sin(T * 1.5 + 1) * (1.5 + 4 * s);
        const sx = 800, sy = 448 + bob, panic = s > 0.3;
        g.save(); g.translate(sx, sy); g.rotate(rot * RAD);
        spr('ship', 0, 0, { s: 1.9, still: true });
        const cy = (i) => -56 - (panic ? Math.abs(Math.sin(t * 9 + i)) * 4 : 0);
        spr('sailor2', -108, cy(0), { s: 0.62, cut: 24 });
        spr('sailor1', -56, cy(1), { s: 0.62, cut: 24 });
        spr(between(t, 2.6, 5.8) ? 'paul_pray' : t >= 7.4 ? 'paul_preach' : 'paul', 64, -56, { s: 0.62, cut: 24, flip: t >= 7.4 });
        if (between(t, 5.8, 7.4)) {
          spr('angel_side', 128, -76 + Math.sin(T * 3) * 2, { s: 0.62, a: seg(t, 5.8, 6.1) * (1 - seg(t, 7.1, 7.4)) });
          sparkle(150, -170, 0); sparkle(92, -182, 2);
        }
        g.restore();
        bgSlice(5, 610, 430, 390, 70);   // 물결을 선체 앞에
        if (s > 0) {
          const gr = g.createLinearGradient(200, 0, 1400, 0), c = `rgba(38,50,84,${0.5 * s})`;
          gr.addColorStop(0, 'rgba(38,50,84,0)'); gr.addColorStop(0.25, c); gr.addColorStop(0.75, c); gr.addColorStop(1, 'rgba(38,50,84,0)');
          g.fillStyle = gr; g.fillRect(200, 0, 1200, 500);
          cloudDark(540, 128, 1.5, s); cloudDark(1080, 136, 1.5, s); cloudDark(805, 104, 1.9, s);
          g.strokeStyle = `rgba(214,236,246,${0.7 * s})`; g.lineWidth = 3; g.beginPath();
          for (let i = 0; i < 70; i++) {
            const x = 320 + ((((rnd(i) * 960 - T * 150) % 960) + 960) % 960), y = 110 + ((rnd(i + 9) * 380 + T * 520) % 380);
            g.moveTo(x, y); g.lineTo(x - 8, y + 26);
          }
          g.stroke();
        }
        if (between(t, 3.4, 3.62) || between(t, 5.6, 5.8)) {
          const lx = t < 5 ? 640 : 1010;
          g.strokeStyle = '#fff6a8'; g.lineWidth = 7; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(lx, 120);
          [[-22, 170], [8, 215], [-18, 262], [14, 305], [-6, 352]].forEach(([dx, y]) => g.lineTo(lx + dx, y));
          g.stroke();
          A(0.25, () => beam(lx, 0, 500, 900, 1));
        }
        if (between(t, 7.6, 9.4)) emote(sx + 64, sy - 56 - 78, 'h');
      },
    },
    {
      n: '28', chip: '행 28장', title: '멜리데 섬', tile: 6, x0: 0, x1: 760, p: 10, still: 4.2,
      desc: '모닥불에서 나온 독사가 손에 매달려도, 털어 버린 바울은 멀쩡합니다.',
      draw(t) {
        const big = between(t, 6.2, 6.9), joy = t > 8;
        glow(402, G - 30, 110 + Math.sin(T * 10) * 8, 0.25, '255,180,80');
        spr('isl_sit', 305, G + 2, { rot: joy ? Math.sin(t * 8) * 3 : 0 });
        spr('campfire', 402, G + 6, { s: big ? 0.66 : 0.54, flip: fr(T, 7) & 1, sy: 1 + 0.05 * Math.sin(T * 13), still: true });
        if (t < 2.6) walker('paul_wood', lerp(735, 492, seg(t, 0, 2.6)), G, t, { flip: true });
        else if (between(t, 3.2, 5.9)) spr('paul_snake', 492, G, { flip: true, rot: t > 5.4 ? Math.sin(t * 40) * 6 : 0 });
        else spr('paul', 492, G, { flip: true });
        if (between(t, 5.9, 6.3)) { const k = seg(t, 5.9, 6.3); spr('snake', lerp(445, 402, k), G - 50 - Math.sin(k * Math.PI) * 46, { s: 0.3, rot: k * 320, mid: true, still: true }); }
        spr('isl_shock', 592, G, { rot: between(t, 3.4, 5.9) ? Math.sin(t * 30) * 2 : 0 });
        if (between(t, 3.6, 5)) emote(592, G - 128, '!');
        if (between(t, 6.6, 7.9)) emote(592, G - 128, '?');
        if (between(t, 8.2, 9.7)) emote(305, G - 100, 'h');
      },
    },
    {
      n: '28', chip: '행 28장', title: '로마에서', tile: 6, x0: 760, x1: 2238, p: 10, still: 5.6,
      desc: '셋집에서 두 해 동안, 담대하게 거침없이 하나님 나라를 전합니다.',
      draw(t) {
        const FL = 392, teach = between(t, 3, 7.5);
        spr('soldier_sit', 1212, FL + 2);
        g.fillStyle = '#c9ced6'; for (let i = 0; i < 5; i++) g.fillRect(1132 + i * 10, FL - 46 + (i & 1) * 4, 6, 6);
        spr('paul_scroll', 1102, FL, { rot: teach ? Math.sin(t * 9) * 2.5 : 0 });
        [['d2', 968], ['d4', 1030]].forEach(([n, seat], i) => {
          const out = 7.5 + i * 0.5, joy = between(t, 6.2, out);
          if (t < out) {
            const k = seg(t, i * 0.8, 2.6 + i * 0.6), x = lerp(790, seat, k);
            act(n + (joy ? '_joy' : '_pray'), x, lerp(G, FL + 2 + i * 3, seg(x, 850, 935)), k < 1, t + i);
          } else {
            const x = lerp(seat, 1330, seg(t, out, out + 2));
            walker(n + '_joy', x, FL + 2, t + i, { a: 1 - seg(x, 1240, 1320) });
          }
        });
        if (between(t, 3.2, 5)) emote(1102, FL - 124, '+');
        if (between(t, 5.2, 6.4)) emote(968, FL - 124, 'h');
        if (between(t, 6.8, 7.8)) emote(1212, FL - 118, '!');
        // 로마 거리: 소식은 계속 길을 떠난다
        ['d3_joy', 'traveler'].forEach((n, i) => {
          const ph = (T / 18 + i * 0.5) % 1, x = 1337 + lerp(-30, 900, ph), a = Math.min(seg(ph, 0, 0.06), 1 - seg(ph, 0.9, 1));
          walker(n, x, 472, T + i, { a });
          if (i === 0 && a === 1 && fr(T, 0.5) & 1) emote(x, 472 - 128, 'n');
        });
      },
    },
  ];
  S.forEach((s) => { s.x = tiles[s.tile].x + s.x0; s.w = s.x1 - s.x0; });
  const mod = (v) => ((v % worldW) + worldW) % worldW;

  /* ---------- 카메라 · 루프 ---------- */
  const SPEED = 38;
  let scale = 0.6, dpr = 1, viewW = 1200, cssH = 300;
  let cam = 0, tween = null, drag = null, hover = -1, userPaused = reduce, holdUntil = 0, focus = -1, onScreen = true;
  const dbg = { i: -1, t: 0 };

  function draw() {
    const k = dpr * scale, camS = Math.round(cam * k) / k, wx = mod(camS);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#74bfe6'; g.fillRect(0, 0, cv.width, cv.height);
    const offs = [-worldW, 0, worldW];
    for (const o of offs) tiles.forEach((t, i) => {
      const x = t.x + o - wx;
      if (x >= viewW + 400 || x + t.w <= -400) return;       // 가까워지면 미리 불러 둠
      const im = tileImg(i);
      if (x >= viewW || x + t.w <= 0 || !ready(im)) return;
      g.setTransform(k, 0, 0, k, x * k, 0);
      g.drawImage(im, 0, 0, t.w + 1, H);
    });
    for (const o of offs) S.forEach((s, i) => {
      const x = s.x + o - wx;
      if (x >= viewW + 200 || x + s.w <= -200 || !ready(tileImg(s.tile))) return;
      g.setTransform(k, 0, 0, k, (tiles[s.tile].x + o - wx) * k, 0);
      g.globalAlpha = 1;
      s.draw(dbg.i === i || dbg.i === 'all' ? dbg.t : reduce ? s.still : (T + i * 1.7) % s.p);
    });
  }

  const sceneAtWorld = (wx) => { wx = mod(wx); for (let i = S.length - 1; i >= 0; i--) if (wx >= S[i].x) return i; return 0; };
  const sceneAtClient = (cx) => sceneAtWorld(cam + (cx - screen.getBoundingClientRect().left) / scale);
  const centerScene = () => sceneAtWorld(cam + viewW / 2);
  const centerOf = (s) => s.x + Math.min(s.w, 1452) / 2;

  const $ = (id) => document.getElementById(id);
  const chip = $('acts-chip'), title = $('acts-title'), desc = $('acts-desc'), map = $('acts-map'), pauseBtn = $('acts-pause');
  const dots = S.map((s, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = s.n; b.setAttribute('aria-label', `${s.chip} ${s.title}`);
    b.addEventListener('click', () => jump(i));
    li.appendChild(b); map.appendChild(li);
    return b;
  });
  function setFocus(i) {
    if (i === focus) return;
    focus = i;
    chip.textContent = S[i].chip; title.textContent = S[i].title; desc.textContent = S[i].desc;
    dots.forEach((b, n) => b.setAttribute('aria-current', n === i ? 'true' : 'false'));
  }
  function jump(i) {
    i = (i + S.length) % S.length;
    let d = mod(centerOf(S[i]) - viewW / 2 - cam);
    if (d > worldW / 2) d -= worldW;
    holdUntil = performance.now() + 8000;
    if (reduce) { cam += d; tween = null; } else tween = { a: cam, b: cam + d, t: 0, d: Math.min(1.4, 0.4 + Math.abs(d) / 3000) };
  }
  $('acts-prev').addEventListener('click', () => jump(centerScene() - 1));
  $('acts-next').addEventListener('click', () => jump(centerScene() + 1));
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.textContent = userPaused ? '계속' : '멈춤';
  });
  if (reduce) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.textContent = '계속'; }

  screen.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, cam, moved: false }; tween = null;
    screen.setPointerCapture(e.pointerId); screen.classList.add('is-drag');
  });
  screen.addEventListener('pointermove', (e) => {
    if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; cam = drag.cam - dx / scale; }
    else if (e.pointerType === 'mouse') hover = sceneAtClient(e.clientX);
  });
  const endDrag = (e) => {
    if (!drag) return;
    if (!drag.moved && e.type === 'pointerup') jump(sceneAtClient(e.clientX));
    else holdUntil = performance.now() + 4000;
    drag = null; screen.classList.remove('is-drag');
  };
  screen.addEventListener('pointerup', endDrag);
  screen.addEventListener('pointercancel', endDrag);
  screen.addEventListener('pointerleave', () => { hover = -1; });

  function resize() {
    const cw = screen.clientWidth, mid = cam + viewW / 2;
    cssH = cw >= 700 ? 300 : 210;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    scale = cssH / H; viewW = cw / scale;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cw + 'px'; cv.style.height = cssH + 'px';
    cam = mid - viewW / 2;
    draw();
  }
  cam = centerOf(S[0]) - viewW / 2;
  addEventListener('resize', resize);
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; }).observe(screen);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (onScreen && !document.hidden) {
      if (!reduce) T += dt;
      if (tween) {
        tween.t += dt / tween.d;
        cam = lerp(tween.a, tween.b, ease(clamp(tween.t)));
        if (tween.t >= 1) tween = null;
      } else if (!drag && !userPaused && hover < 0 && now > holdUntil) cam += SPEED * dt;
      setFocus(hover >= 0 && !drag ? hover : centerScene());
      draw();
    }
    requestAnimationFrame(frame);
  }
  resize();
  atlas.onload = draw;
  requestAnimationFrame(frame);

  // 점검용: __acts.freeze(장면번호|'all', 초), __acts.freeze(-1)로 해제, __acts.shot(장면번호, [초...])
  window.__acts = {
    jump, freeze(i, t) { dbg.i = i; dbg.t = t || 0; },
    shot(i, ts, sc) {
      const s = S[i], k = sc || 0.5, wv = Math.min(s.w, 1500);
      const c = document.getElementById('dbg-sheet') || document.createElement('canvas');
      const cols = wv * k * 2 <= 1010 ? 2 : 1;
      c.id = 'dbg-sheet'; c.width = wv * k * cols; c.height = H * k * Math.ceil(ts.length / cols);
      const x = c.getContext('2d'), keep = [cam, dbg.i, dbg.t, viewW];
      ts.forEach((t, n) => {
        cam = s.x; dbg.i = i; dbg.t = t; draw();
        x.drawImage(cv, 0, 0, wv * dpr * scale, cv.height, (n % cols) * wv * k, Math.floor(n / cols) * H * k, wv * k, H * k);
      });
      [cam, dbg.i, dbg.t] = keep; draw();
      c.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#000';
      document.body.appendChild(c);
    },
  };
})();
