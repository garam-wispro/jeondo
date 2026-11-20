/* 상품 목록: 여기에 항목을 추가하면 메인 화면 카드가 늘어난다.
   thumb 는 정사각 실사 사진(assets/products/), price 는 개당 최저가(원) 또는 null(준비 중).
   priceNote 는 가격 옆에 붙는 짧은 조건, href 는 상세 페이지 주소(없으면 '준비 중' 안내). */
window.PRODUCTS = [
  {
    id: 'pen-01',
    name: '말씀 볼펜',
    spec: '16가지 색 · 컬러 인쇄 · 0.7mm',
    desc: '고른 색 볼펜에 교회 이름이나 말씀 한 구절을 원하는 색으로 인쇄해요.',
    thumb: 'assets/products/pen-16.webp',
    badge: '1개부터 제작',
    wide: true,   // 카드 두 칸 · 가로 사진
    colors: ['#c82525', '#f9760f', '#fde600', '#7fe041', '#3ebaf4', '#264080', '#7e57c7', '#f44fbd', '#2a2d28',
      '#f9cfdc', '#fbf3a0', '#b5f0d2', '#bdeeee', '#a9cdf3', '#dcc4ee', '#f7f6f4'],
    price: 330,   // 수량에 관계없이 개당 330원 (2026-11-20 대표 지정. 300 → 350 → 330)
    priceFlat: true,
    priceNote: '1개부터 · 수량에 관계없이 같은 가격',
    href: 'pen.html',
    store: 'https://smartstore.naver.com/selectgoods/products/11920761979',
  },
  {
    id: 'minipen-01',
    name: '말씀 미니 볼펜',
    spec: '14가지 색 · 컬러 인쇄 · 길이 117mm',
    desc: '통통한 미니 볼펜에 교회 이름이나 말씀을 한 줄 또는 두 줄로 인쇄해요.',
    thumb: 'assets/products/minipen-square.webp',   // 볼펜 에디터 2가 그린 그림(실물 사진이 생기면 바꾼다)
    badge: '1개부터 제작',
    colors: ['#38373c', '#43b5ec', '#9abb49', '#854f44', '#feda66', '#818181', '#e5cecd', '#d7b5d2', '#eef0f5',
      '#9cbf4a', '#ffde6c', '#dcb9d7', '#e2c9c8', '#814c40'],
    price: 400,   // 수량에 관계없이 개당 400원 (2026-11-18 대표 지정)
    priceFlat: true,
    priceNote: '1개부터 · 수량에 관계없이 같은 가격',
    href: 'https://prtromance.cafe24.com/product/detail.html?product_no=12',   // 카페24 상품 페이지(따로 만든 상세 화면 없음)
  },
  {
    id: 'tape-01',
    name: '미니 줄자',
    spec: '색 5가지 · 지름 5cm · 줄자 1.5m',
    desc: '손바닥에 쏙 들어오는 동그란 미니 줄자예요. 1.5m까지 잴 수 있어요.',
    thumb: 'assets/products/tape-square.webp',   // tools/tape_art.html 로 그린 그림(실물 사진이 생기면 바꾼다)
    colors: ['#e6a497', '#f2b4c6', '#f0edf4', '#bfe3c7', '#b8c8d5'],
    price: null,   // 판매가 미정(2026-11-20). 정해지면 숫자를 넣는다
    href: 'https://garam-wispro.github.io/jeondo/tape.html',   // 카페24 메인에서도 열리도록 전체 주소
  },
];

(() => {
  'use strict';
  const list = document.getElementById('goods');
  if (!list) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const won = (n) => n.toLocaleString('ko-KR') + '원';
  const cols = Number(list.dataset.slots) || 4;
  /* 카페24 등 다른 주소에 얹을 때: 그림이 있는 곳(JEONDO_BASE)과 상품별 상세 주소(JEONDO_HREF)를 바깥에서 정한다 */
  const BASE = window.JEONDO_BASE || '';
  const HREF = window.JEONDO_HREF || {};
  const link = (p) => (p.id in HREF ? HREF[p.id] : p.href);   // 빈 값이면 '준비 중' 안내

  const cards = window.PRODUCTS.map((p) => `
    <li${p.wide ? ' class="is-wide"' : ''}>
      <a class="good box" href="${esc(link(p) || '#items')}" data-id="${esc(p.id)}"${link(p) ? '' : ' data-soon'}>
        <span class="good__photo">
          <img src="${esc(BASE + p.thumb)}" alt="${esc(p.name)} 실제 사진" width="${p.wide ? 1800 : 1200}" height="${p.wide ? 760 : 1200}" loading="lazy" decoding="async">
          ${p.badge ? `<span class="good__badge">${esc(p.badge)}</span>` : ''}
        </span>
        <strong class="good__name">${esc(p.name)}</strong>
        ${p.spec ? `<span class="good__spec">${esc(p.spec)}</span>` : ''}
        ${p.colors ? `<span class="good__colors" aria-label="색 ${p.colors.length}가지">${p.colors.map((c) => `<i style="--c:${esc(c)}"></i>`).join('')}</span>` : ''}
        ${p.desc ? `<span class="good__desc">${esc(p.desc)}</span>` : ''}
        <span class="good__foot">
          <span class="good__price${p.price == null ? ' is-soon' : ''}">${p.price == null ? '가격 준비 중' : `<small>개당</small> ${won(p.price)}${p.priceFlat ? '' : '<small>~</small>'}`}</span>
          <span class="good__go">보러 가기 ▶</span>
        </span>
        ${p.priceNote ? `<span class="good__note">${esc(p.priceNote)}</span>` : ''}
      </a>
    </li>`);
  // 빈 칸은 '준비 중' 자리로 채워 줄을 맞춘다
  const used = window.PRODUCTS.reduce((n, p) => n + (p.wide ? 2 : 1), 0);
  const empty = (cols - (used % cols)) % cols || (used ? 0 : cols);
  for (let i = 0; i < empty; i++) cards.push(`
    <li aria-hidden="true">
      <div class="good good--empty box">
        <span class="good__photo"><span class="good__q">?</span></span>
        <strong class="good__name">상품 준비 중</strong>
        <span class="good__desc">곧 채워질 자리예요.</span>
      </div>
    </li>`);
  list.innerHTML = cards.join('');

  // 상세 페이지가 아직 없는 상품은 안내만 띄운다
  let toast, timer;
  list.addEventListener('click', (e) => {
    const a = e.target.closest('a.good[data-soon]');
    if (!a) return;
    e.preventDefault();
    if (!toast) {
      toast = document.createElement('p');
      toast.className = 'toast box';
      toast.setAttribute('role', 'status');
      (list.closest('.jd') || document.body).appendChild(toast);
    }
    toast.textContent = '상세 페이지는 준비 중이에요.';
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  });
})();
