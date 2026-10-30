// Supernova shared UI: icon sprite, DOM helper, header, footer, toast,
// scroll reveal. Nothing here uses innerHTML on dynamic data; every string
// reaches the page through textContent or attributes.
document.documentElement.classList.add('js');

(() => {
  // ---- Icon sprite. Static markup authored here, parsed once. ---------------
  const S = (id, body) => `<symbol id="i-${id}" viewBox="0 0 24 24">${body}</symbol>`;
  const st = d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${S('star', '<path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5Z" fill="currentColor"/>')}
    ${S('nova', '<path d="M12.00 1.00 L13.38 8.67 L17.66 6.34 L15.33 10.62 L23.00 12.00 L15.33 13.38 L17.66 17.66 L13.38 15.33 L12.00 23.00 L10.62 15.33 L6.34 17.66 L8.67 13.38 L1.00 12.00 L8.67 10.62 L6.34 6.34 L10.62 8.67Z" fill="currentColor" stroke="#1b0b2b" stroke-width="1.4" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.2" fill="#fff5e1" stroke="#1b0b2b" stroke-width="1.2"/>')}
    ${S('bag',st('M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z') + st('M9 10V6.5a3 3 0 0 1 6 0V10'))}
    ${S('plus', st('M12 5v14M5 12h14'))}
    ${S('minus', st('M5 12h14'))}
    ${S('x', st('M6 6l12 12M18 6 6 18'))}
    ${S('arrow', st('M5 12h14M13 6l6 6-6 6'))}
    ${S('back', st('M19 12H5M11 6l-6 6 6 6'))}
    ${S('chev', st('m6 9 6 6 6-6'))}
    ${S('check', st('m5 12.5 4.5 4.5L19 7.5'))}
    ${S('trash', st('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'))}
    ${S('clock', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/>' + st('M12 7v5l3 2'))}
    ${S('receipt', st('M6 3h12v18l-3-2-3 2-3-2-3 2V3Z') + st('M9 8h6M9 12h6'))}
    ${S('plane', st('M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z'))}
    ${S('shield', st('M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z') + st('m9 12 2 2 4-4'))}
    ${S('lock', '<rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/>' + st('M8 11V7a4 4 0 0 1 8 0v4'))}
    ${S('pin', st('M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z') + '<circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2.2"/>')}
    ${S('chart', st('M4 20V10M10 20V4M16 20v-7M22 20H2'))}
    ${S('menu', st('M4 7h16M4 12h16M4 17h16'))}
    ${S('share', st('M12 3v12M8 7l4-4 4 4') + st('M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1'))}
    ${S('plussq', '<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/>' + st('M12 8v8M8 12h8'))}
    ${S('basket',st('M3 10h18l-2 10H5L3 10Z') + st('M8 10l3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3'))}
    ${S('shirt', st('M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0Z'))}
    ${S('search','<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/>' + st('m20 20-4-4'))}
    ${S('flame', st('M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7Z'))}
    ${S('leaf', st('M5 19c0-9 6-14 15-14 0 9-5 15-14 15') + st('M5 19c3-4 6-6 9-8'))}
    ${S('alert', st('M12 3 2 20h20L12 3Z') + st('M12 10v4M12 17h.01'))}
    ${S('bike', '<circle cx="5.5" cy="17.5" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="18.5" cy="17.5" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2"/>' + st('M15 6h2l3 11.5M5.5 17.5 9 10h7l-3.5 7.5H5.5'))}
    ${S('refresh', st('M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4'))}
    ${S('phone', st('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z'))}
  </defs></svg>`;
  document.body.prepend(new DOMParser().parseFromString(sprite, 'image/svg+xml').documentElement);

  // ---- DOM helper -----------------------------------------------------------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'data') Object.entries(v).forEach(([dk, dv]) => { el.dataset[dk] = dv; });
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c instanceof Node ? c : String(c)); });
    return el;
  }
  function icon(name, cls = 'i') {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }
  const money = n => '₦' + Math.round(n).toLocaleString('en-NG');
  const img = name => `assets/img/${name}.webp`;
  const param = k => new URLSearchParams(location.search).get(k);
  const kitchenOr = k => (SN.KITCHENS[k] ? k : null);
  const when = ts => {
    const d = new Date(ts), now = new Date();
    const time = d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) + `, ${time}`;
  };
  const tag = k => h('span', { class: `tag tag--${k}` }, h('span', { class: `dot dot--${k}` }), SN.KITCHENS[k].name);

  // ---- Logo: burst tile + "Super" display / "nova" serif wordmark ------------
  const logo = cls => h('a', { class: cls, href: 'index.html', 'aria-label': 'Supernova home' },
    h('span', { class: 'mark__tile', 'aria-hidden': 'true' }, icon('nova', '')),
    h('span', { class: 'mark__word', 'aria-hidden': 'true' }, 'Super', h('em', { text: 'nova' })));

  // ---- Header ---------------------------------------------------------------
  const page = document.body.dataset.page;
  const NAV = [['home', 'index.html', 'Home'], ['food', 'food.html', 'Food'], ['market', 'market.html', 'Market runs'], ['laundry', 'laundry.html', 'Dry cleaning'], ['flights', 'flights.html', 'Flights'], ['orders', 'orders.html', 'Orders']];
  const navLinks = () => NAV.map(([id, href, label]) => h('a', { href, 'aria-current': id === page ? 'page' : null, text: label }));

  function renderChrome() {
    const host = document.querySelector('[data-chrome]');
    if (!host) return;
    const n = h('span', { class: 'basket__n', 'data-basket-n': true, 'data-zero': 'true', text: '0' });
    const basket = h('a', { class: 'basket', href: 'cart.html', 'data-basket': true, 'aria-current': page === 'cart' ? 'page' : null },
      icon('bag'), h('span', { class: 'basket__word', text: 'Bag' }), n);
    const burger = h('details', { class: 'burger' },
      h('summary', { 'aria-label': 'Open menu' }, icon('menu')),
      h('div', { class: 'burger__panel' }, navLinks(), h('a', { href: 'cart.html', text: 'Your bag' }), h('a', { href: '#', text: 'Log in' })));
    host.append(h('div', { class: 'wrap chrome__in' },
      logo('mark'),
      h('nav', { class: 'nav', 'aria-label': 'Main' }, navLinks()),
      h('div', { class: 'chrome__end' }, h('a', { class: 'btn btn--sm btn--quiet chrome__login', href: '#', text: 'Log in' }), basket, burger)));

    const sync = () => {
      const c = SN.cart.countAll();
      n.textContent = String(c);
      n.dataset.zero = String(c === 0);
      basket.setAttribute('aria-label', `Your bags, ${c} item${c === 1 ? '' : 's'}`);
    };
    sync();
    SN.onChange(sync);

    burger.querySelectorAll('a').forEach(a => a.addEventListener('click', () => burger.removeAttribute('open')));
    document.addEventListener('click', e => { if (burger.open && !burger.contains(e.target)) burger.removeAttribute('open'); });
    const onScroll = () => { host.dataset.scrolled = String(scrollY > 8); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function bump() {
    const b = document.querySelector('[data-basket]');
    if (!b) return;
    b.classList.remove('is-bumped');
    void b.offsetWidth;
    b.classList.add('is-bumped');
  }

  // ---- Footer ---------------------------------------------------------------
  function renderFoot() {
    const host = document.querySelector('[data-foot]');
    if (!host) return;
    const col = (title, links) => h('div', null, h('h3', { text: title }), links.map(([href, t]) => h('a', { href, text: t })));
    host.append(
      h('div', { class: 'wrap foot__in' },
        h('div', { class: 'foot__brand' },
          logo('mark mark--foot'),
          h('p', { text: 'Food, market runs, dry cleaning and flights for uni students. Life Sweet.' })),
        h('nav', { class: 'foot__cols', 'aria-label': 'Footer' },
          col('Supernova', [['food.html', 'Food'], ['market.html', 'Market runs'], ['laundry.html', 'Dry cleaning'], ['flights.html', 'Flights'], ['orders.html', 'Your orders']]),
          col('Help', [['index.html#faq', 'Questions'], ['#', 'Refund policy'], ['#', 'Contact us']]),
          col('Legal', [['#', 'Privacy policy'], ['#', 'Terms of use']]))),
      h('div', { class: 'wrap foot__base' },
        h('p', { text: `© ${new Date().getFullYear()} Supernova, a 3Projects company. Crunchies and Roots are trademarks of their owners.` })));
  }

  // ---- Toast ------------------------------------------------------------------
  let toastTimer;
  function toast(msg, link) {
    let t = document.querySelector('[data-toast]');
    if (!t) { t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite', 'data-toast': true }); document.body.append(t); }
    t.replaceChildren(icon('check'), h('span', { text: msg }), ...(link ? [h('a', { href: link.href, text: link.label })] : []));
    t.hidden = false;
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---- Reveal on scroll -------------------------------------------------------
  function reveal(root = document) {
    const items = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.filter(en => en.isIntersecting).forEach((en, i) => {
        en.target.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  }

  // ---- Empty state --------------------------------------------------------------
  function empty({ title, body, cta, href, art = 'bag' }) {
    return h('div', { class: 'empty' },
      h('span', { class: 'empty__art', 'aria-hidden': 'true' }, icon(art), h('span', { class: 'empty__spark' }, icon('star', ''))),
      h('h2', { class: 'h3', text: title }),
      h('p', { text: body }),
      cta ? h('a', { class: 'btn btn--primary', href }, cta, icon('arrow')) : null);
  }

  // ---- Payment stand-in -----------------------------------------------------
  // Stands in for the payment provider's hosted page. In production the app
  // redirects there, and only the verified webhook marks anything paid.
  function pay({ amount, label, busy, onSuccess, onFail }) {
    if (busy) busy.disabled = true;
    let locked = false;
    const body = h('div', { class: 'prov__body' });
    const dlg = h('dialog', { class: 'prov', 'aria-labelledby': 'prov-t' },
      h('div', { class: 'prov__bar' }, icon('lock'), h('span', { text: 'Secure payment' }), h('span', { class: 'prov__test', text: 'Sandbox' })),
      body);
    const done = ok => {
      if (locked) return;
      if (!ok) { dlg.close(); onFail && onFail(); return; }
      locked = true;
      body.replaceChildren(h('div', { class: 'prov__wait' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('p', { class: 'prov__t', id: 'prov-t', text: 'Confirming your payment…' }), h('p', { text: 'Hang tight, this takes a second.' })));
      setTimeout(() => { onSuccess(); if (dlg.open) dlg.close(); }, 1400);
    };
    body.append(
      h('p', { class: 'prov__merchant', text: label }),
      h('p', { class: 'prov__amt', id: 'prov-t', text: money(amount) }),
      h('p', { class: 'prov__note', text: 'This box stands in for the payment provider\'s page while Supernova is in sandbox mode. No real money moves.' }),
      h('div', { class: 'prov__acts' },
        h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => done(true) }, icon('check'), 'Simulate successful payment'),
        h('button', { class: 'btn btn--block', type: 'button', onclick: () => done(false) }, 'Simulate failed payment'),
        h('button', { class: 'linkish', type: 'button', onclick: () => done(false) }, 'Cancel and go back')));
    dlg.addEventListener('cancel', e => { e.preventDefault(); done(false); });
    dlg.addEventListener('close', () => { if (busy) busy.disabled = false; dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  }

  // ---- Order type helpers -----------------------------------------------------
  // Each order kind gets an accent (via data-kitchen), a tag and a source.
  const KIND = {
    market: { name: 'Market run', icon: 'basket' },
    laundry: { name: 'Dry cleaning', icon: 'shirt' },
    flight: { name: 'Flight', icon: 'plane' }
  };
  const city = code => (SN.AIRPORTS.find(([c]) => c === code) || [code, code])[1];
  const accentOf = o => (SN.orders.kind(o) === 'food' ? o.kitchen : SN.orders.kind(o));
  const orderTag = o => {
    const k = SN.orders.kind(o);
    if (k === 'food') return tag(o.kitchen);
    return h('span', { class: `tag tag--${k}` }, icon(KIND[k].icon), KIND[k].name);
  };
  const orderFrom = o => ({ food: () => SN.KITCHENS[o.kitchen].name, market: () => 'Partners', laundry: () => 'Cleaners', flight: () => city(o.from) })[SN.orders.kind(o)]();
  const orderThumbs = o => ({
    food: () => o.items.slice(0, 3).map(i => img(i.img)),
    market: () => [img('market-tomatoes-basket'), img('market-peppers')],
    laundry: () => [img('laundry-folded'), img('laundry-suits')],
    flight: () => [img('plane-window'), img('plane-sky')]
  })[SN.orders.kind(o)]();
  const orderTitle = o => {
    const k = SN.orders.kind(o);
    if (k === 'market') return `${o.items.length} item${o.items.length === 1 ? '' : 's'} from our partners`;
    if (k === 'flight') return `${city(o.from)} to ${city(o.to)}, ${o.trip === 'return' ? 'return' : 'one way'}`;
    return o.items.map(i => `${i.qty > 1 ? i.qty + '× ' : ''}${i.name}`).join(', ');
  };
  // "Cedar Hall, Block C, Room 214" (room is optional).
  const addrLine = a => [a.hostel, a.block && `Block ${a.block}`, a.room && `Room ${a.room}`].filter(Boolean).join(', ');

  // Show a mobile pay bar only while its form is on screen.
  function barFollows(bar, target) {
    if (!('IntersectionObserver' in window)) return;
    bar.hidden = true;
    new IntersectionObserver(([en]) => { bar.hidden = !en.isIntersecting; }, { rootMargin: '0px 0px -30% 0px' }).observe(target);
  }

  SN.ui = { barFollows, h, icon, money, img, param, kitchenOr, when, tag, toast, bump, reveal, empty, pay, accentOf, orderTag, orderFrom, orderThumbs, orderTitle, addrLine, city };

  renderChrome();
  renderFoot();
  document.addEventListener('DOMContentLoaded', () => reveal());
})();
