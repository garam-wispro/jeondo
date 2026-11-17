/* 말씀 볼펜 상세: 사진 전환, 볼펜 색 · 글씨 색 견본 표시.
   색 목록은 '볼펜 제작 에디터'의 상품 설정과 같은 값이다. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  /* 사진 전환 */
  const main = $('pd-main'), thumbs = $('pd-thumbs');
  thumbs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    main.src = b.dataset.src; main.alt = b.dataset.alt;
    thumbs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
  });

  /* 볼펜 색 16가지 */
  const PEN_COLORS = [
    ['레드', '#c82525'], ['오렌지', '#f9760f'], ['옐로우', '#fde600'], ['그린', '#7fe041'], ['블루', '#3ebaf4'], ['네이비', '#264080'],
    ['퍼플', '#7e57c7'], ['핑크', '#f44fbd'], ['블랙', '#2a2d28'], ['파스텔핑크', '#f9cfdc'], ['파스텔옐로우', '#fbf3a0'], ['파스텔그린', '#b5f0d2'],
    ['파스텔민트', '#bdeeee'], ['파스텔블루', '#a9cdf3'], ['파스텔퍼플', '#dcc4ee'], ['화이트', '#f7f6f4'],
  ];
  $('pd-colors').innerHTML = PEN_COLORS.map((c) => `<li><span style="--c:${c[1]}"></span>${c[0]}</li>`).join('');

  /* 글씨 색 50가지 + 그라데이션 10종 */
  const HUES = [
    ['#111111', '#4a4a4a', '#8a8a8a', '#c4c4c4', '#fffffa'], ['#7f1d1d', '#c81e1e', '#ef4444', '#f87171', '#fecaca'],
    ['#9d174d', '#db2777', '#f472b6', '#f9a8d4', '#fce7f3'], ['#9a3412', '#ea580c', '#fb923c', '#fdba74', '#ffedd5'],
    ['#a16207', '#eab308', '#facc15', '#fde047', '#fef9c3'], ['#14532d', '#16a34a', '#4ade80', '#86efac', '#dcfce7'],
    ['#134e4a', '#0d9488', '#2dd4bf', '#5eead4', '#ccfbf1'], ['#1e3a8a', '#2563eb', '#60a5fa', '#93c5fd', '#dbeafe'],
    ['#4c1d95', '#7c3aed', '#a78bfa', '#c4b5fd', '#ede9fe'], ['#5b3a1e', '#8b5a2b', '#b08050', '#d2b48c', '#efe1cc'],
  ];
  const GRADS = [
    ['#ff9ecf', '#9ad8ff'], ['#ff9ecf', '#c4a5ff', '#9ad8ff'], ['#ff9a9e', '#fecfef'], ['#ff5f6d', '#ffc371'], ['#f9f586', '#84fab0'],
    ['#5ee7df', '#b490ca'], ['#2193b0', '#6dd5ed'], ['#a18cd1', '#fbc2eb'], ['#ff4d4d', '#ff9f1c', '#ffd600', '#3ccf4e', '#2d9cff', '#9b5cff'], ['#b8860b', '#ffe08a', '#b8860b'],
  ];
  const cells = [];
  for (let r = 0; r < 5; r++) HUES.forEach((h) => cells.push(h[r]));
  GRADS.forEach((g) => cells.push(`linear-gradient(90deg,${g.join(',')})`));
  $('pd-inks').innerHTML = cells.map((c) => `<i style="--c:${c}"></i>`).join('');
})();
