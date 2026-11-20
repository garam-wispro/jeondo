/* 카페24 쇼핑몰 전용: 상품 상세 화면을 pen.html 과 같은 모양으로 바꾼다.
   카페24 기본 화면의 구매·수량·장바구니 기능은 그대로 두고(숨긴 원래 버튼을 대신 눌러 준다), 보이는 부분만 우리 모양으로 다시 짠다.
   상품별 사진·설명·규격은 아래 DETAIL 에 적는다(카페24 상품 번호 기준). 없는 상품은 카페24에 등록한 사진·요약 설명으로 채운다. */
(() => {
  'use strict';
  const root = document.querySelector('.xans-product-detail');
  if (!root) return;
  const BASE = 'https://garam-wispro.github.io/jeondo/';
  const NOTE = '1개부터 · 수량에 관계없이 같은 가격';
  const DETAIL = {
    11: {
      tags: ['1개부터 제작'],
      lead: '16가지 색 볼펜에 교회 이름이나 말씀 한 구절을 원하는 색으로 인쇄해 드려요.',
      note: NOTE,
      spec: [['심 굵기', '0.7mm'], ['방식', '노크식'], ['볼펜 색', '16가지'], ['인쇄', '컬러 인쇄 · 문구 한 줄'], ['인쇄 영역', '가로 100 × 세로 4mm']],
      photos: [
        ['assets/products/pen-16.webp', '16가지 색 볼펜에 저마다 다른 문구를 컬러로 인쇄한 모습', 1800, 760],
        ['assets/products/pen-lineup.webp', '볼펜 16가지 색을 나란히 세워 놓은 모습', 1800, 1200],
        ['assets/products/pen-tip.webp', '볼펜 앞부분을 가까이서 본 모습', 1800, 1200],
      ],
      editor: ['https://garam-wispro.github.io/pen-editor/', '볼펜 직접 디자인하기 ▶'],
    },
    12: {
      tags: ['1개부터 제작'],
      lead: '통통한 미니 볼펜에 교회 이름이나 말씀을 한 줄 또는 두 줄로 인쇄해 드려요.',
      note: NOTE,
      spec: [['길이', '117mm'], ['방식', '노크식'], ['볼펜 색', '14가지'], ['인쇄', '컬러 인쇄 · 한 줄 또는 두 줄'], ['인쇄 영역', '가로 46 × 세로 7mm']],
      photos: [
        ['assets/products/minipen-wide.webp', '미니 볼펜 14가지 색에 문구를 인쇄한 모습을 그린 그림', 1800, 760],
        ['assets/products/minipen-zone.webp', '미니 볼펜 뒤쪽 몸통의 인쇄 영역에 문구가 들어간 모습을 그린 그림', 1800, 520],
      ],
      editor: ['https://garam-wispro.github.io/pen-editor-2/', '미니 볼펜 직접 디자인하기 ▶'],
    },
    13: {   // 미니 줄자: 판매가가 정해질 때까지 '가격 준비 중'(soon) 으로 보이고 구매 버튼은 없다
      tags: ['색 5가지'],
      tagGreen: '줄자 길이 1.5m',
      lead: '손바닥에 쏙 들어오는 동그란 미니 줄자예요. 1.5m까지 잴 수 있어요.',
      soon: '곧 판매를 시작해요.',
      spec: [['크기', '지름 5cm · 두께 1cm'], ['줄자 길이', '1.5m'], ['눈금', 'cm 숫자 · 1mm 간격'], ['소재', '플라스틱'], ['색', '5가지'], ['포장', '1개씩 개별 포장']],
      photos: [
        ['assets/products/tape-lineup.webp', '미니 줄자 5가지 색을 나란히 세워 놓은 모습', 1800, 1200],
        ['assets/products/tape-square.webp', '미니 줄자 5가지 색을 위에서 본 모습', 1200, 1200],
        ['assets/products/tape-detail.webp', '미니 줄자 세 개를 세워 놓고 가까이에서 본 모습', 1800, 1200],
        ['assets/products/tape-scale.webp', '뽑아 놓은 흰 줄자에 cm 숫자와 눈금이 보이는 모습', 1800, 1200],
        ['assets/products/tape-hand.webp', '손바닥 위에 미니 줄자 두 개를 올려놓은 모습', 1800, 1200],
        ['assets/products/tape-button.webp', '가운데 버튼을 눌러 줄자를 감는 모습', 1800, 1200],
      ],
    },
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const no = Number(window.iProductNo || new URLSearchParams(location.search).get('product_no') || (location.pathname.match(/\/(\d+)\/?$/) || [])[1]);
  const info = root.querySelector('.infoArea'), imgArea = root.querySelector('.imgArea');
  if (!info || !imgArea) return;
  const rowText = (label) => {
    const tr = [...root.querySelectorAll('.xans-product-detaildesign tr')].find((r) => r.querySelector('th') && r.querySelector('th').textContent.trim() === label);
    return tr && tr.querySelector('td') ? tr.querySelector('td').textContent.replace(/\s+/g, ' ').trim() : '';
  };
  const name = (root.querySelector('.headingArea h1, .headingArea h2') || {}).textContent || document.title;
  const priceEl = root.querySelector('#span_product_price_text');
  const d = DETAIL[no] || {};
  const price = !d.soon && priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : '';
  const cate = [...document.querySelectorAll('.xans-product-headcategory a')].filter((x) => x.textContent.trim() && x.textContent.trim() !== '홈').pop();   // 가장 안쪽 분류
  const nativeImg = imgArea.querySelector('img.BigImage, .thumbnail img, img');
  const photos = (d.photos || []).map(([src, alt, w, h]) => [BASE + src, alt, w, h]);
  if (!photos.length && nativeImg) photos.push([nativeImg.src, name.trim() + ' 사진', nativeImg.naturalWidth || 1200, nativeImg.naturalHeight || 1200]);
  const lead = d.lead || rowText('상품요약정보');
  const spec = (d.spec || []).slice();
  const ship = rowText('배송비');
  if (ship && !d.soon) spec.push(['배송비', ship]);

  document.body.classList.add('jd-detail');
  if (d.soon) document.body.classList.add('jd-soon');   // 수량·합계·구매 줄은 detail.css 가 숨긴다

  /* 현재 위치 */
  const crumb = document.createElement('div');
  crumb.className = 'jd jd-pd-crumb';
  crumb.innerHTML = `<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a><span>▶</span><a href="${cate && cate.getAttribute('href') ? esc(cate.getAttribute('href')) : '/#items'}">${esc(cate ? cate.textContent.trim() : '전도용품')}</a><span>▶</span><strong>${esc(name.trim())}</strong></nav>`;
  root.parentNode.insertBefore(crumb, root);

  /* 사진 */
  if (photos.length) {
    const g = document.createElement('div');
    g.className = 'jd';
    g.innerHTML = `<div class="pd-gallery">
      <div class="pd-gallery__main box"><img id="pd-main" src="${esc(photos[0][0])}" alt="${esc(photos[0][1])}" width="${photos[0][2]}" height="${photos[0][3]}"></div>
      ${photos.length > 1 ? `<ul class="pd-gallery__thumbs" id="pd-thumbs">${photos.map(([src, alt], i) => `<li><button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="${esc(alt)}"><img src="${esc(src)}" alt="" loading="lazy"></button></li>`).join('')}</ul>` : ''}
    </div>`;
    imgArea.appendChild(g);
    const main = g.querySelector('#pd-main'), thumbs = g.querySelector('#pd-thumbs');
    if (thumbs) thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const p = photos[+b.dataset.i];
      main.src = p[0]; main.alt = p[1]; main.width = p[2]; main.height = p[3];
      thumbs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
    });
  }

  /* 이름 · 가격 · 규격 */
  const head = document.createElement('div');
  head.className = 'jd';
  head.innerHTML = `<div class="pd-info">
    <p class="pd-info__tags">${(d.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}${price ? `<span class="chip chip--green">개당 ${Number(price).toLocaleString('ko-KR')}원</span>` : d.tagGreen ? `<span class="chip chip--green">${esc(d.tagGreen)}</span>` : ''}</p>
    <h1>${esc(name.trim())}</h1>
    ${lead ? `<p class="pd-info__lead">${esc(lead)}</p>` : ''}
    ${price ? `<p class="pd-one"><span>개당</span><b>${Number(price).toLocaleString('ko-KR')}</b>원${d.note ? `<small>${esc(d.note)}</small>` : ''}</p>` : d.soon ? `<p class="pd-one"><b class="pd-one__soon">가격 준비 중</b><small>${esc(d.soon)}</small></p>` : ''}
    ${spec.length ? `<ul class="pd-spec">${spec.map(([k, v]) => `<li><b>${esc(k)}</b>${esc(v)}</li>`).join('')}</ul>` : ''}
  </div>`;
  info.insertBefore(head, info.firstChild);

  /* 구매 버튼: 보이는 버튼이 카페24의 원래 버튼을 대신 눌러 준다 */
  const action = info.querySelector('.xans-product-action:not(#orderFixArea)');
  const nBuy = action && action.querySelector('.action_button a.btnSubmit'), nCart = action && action.querySelector('.action_button .actionCart');
  if (action && nBuy && !d.soon) {
    const cta = document.createElement('div');
    cta.className = 'jd';
    cta.innerHTML = `<div class="pd-cta">
      <button type="button" class="btn" data-act="buy">구매하기</button>
      ${nCart ? '<button type="button" class="btn btn--ghost" data-act="cart">장바구니</button>' : ''}
      ${d.editor ? `<span class="pd-cta__br"></span><a class="btn btn--ghost pd-cta__editor" href="${esc(d.editor[0])}" target="_blank" rel="noopener">${esc(d.editor[1])}</a>` : ''}
    </div>`;
    action.parentNode.insertBefore(cta, action);
    cta.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) (b.dataset.act === 'buy' ? nBuy : nCart).click();
    });
  }

  /* 결제·배송·교환 안내 탭은 뺀다(안내 영역 자체는 detail.css 가 숨긴다) */
  document.querySelectorAll('.detail_tab a[href="#guide"], #tabProduct a[href="#prdInfo"]').forEach((x) => { const li = x.closest('li'); if (li) li.remove(); });

  /* 영어로 된 기본 문구를 우리말로 */
  const say = (el, t) => { if (el) el.textContent = t; };
  const title = root.querySelector('#totalPrice .title');
  if (title) title.innerHTML = '합계 <span class="qty">(수량)</span>';
  document.querySelectorAll('#orderFixArea a.btnSubmit #actionBuy, #orderFixArea a.btnSubmit span:not(.displaynone)').forEach((el) => { if (/BUY/i.test(el.textContent)) say(el, '구매하기'); });
  document.querySelectorAll('#orderFixArea .actionCart').forEach((el) => say(el, '장바구니'));
  document.querySelectorAll('#prdReview .board_title h2').forEach((el) => say(el, '상품후기'));
  document.querySelectorAll('#prdQnA .board_title h2').forEach((el) => say(el, '상품문의'));
  document.querySelectorAll('#prdReview .board_title a, #prdQnA .board_title a').forEach((el) => {
    const t = el.textContent.trim().toUpperCase();
    if (t === 'LIST') say(el, '목록'); else if (t === 'WRITE') say(el, '글쓰기');
  });
})();
