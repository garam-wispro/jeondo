/* 말씀 볼펜 상세: 사진 전환, 볼펜 색 16가지(실제 볼펜 뒷부분 사진) 표시 */
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

  /* 볼펜 색 16가지: 이름 순서는 볼펜 제작 에디터와 같다. 사진은 assets/products/pens/<id>.webp */
  const PEN_COLORS = [
    ['red', '레드'], ['orange', '오렌지'], ['yellow', '옐로우'], ['green', '그린'], ['blue', '블루'], ['navy', '네이비'],
    ['purple', '퍼플'], ['pink', '핑크'], ['black', '블랙'], ['ppink', '파스텔핑크'], ['pyellow', '파스텔옐로우'], ['pgreen', '파스텔그린'],
    ['mint', '파스텔민트'], ['pblue', '파스텔블루'], ['ppurple', '파스텔퍼플'], ['white', '화이트'],
  ];
  $('pd-pens').innerHTML = PEN_COLORS.map(([id, ko]) =>
    `<li><span><img src="assets/products/pens/${id}.webp" alt="${ko} 볼펜 뒷부분" width="160" height="544" loading="lazy"></span><b>${ko.replace('파스텔', '파스텔<br>')}</b></li>`).join('');
})();
