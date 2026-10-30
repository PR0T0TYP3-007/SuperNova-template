// Kitchen menu: pick an outlet first, then browse that outlet's menu. Items
// go only into this kitchen's bag, and the bag belongs to the chosen outlet.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, toast, bump, reveal } = SN.ui;
  const k = SN.ui.kitchenOr(param('k'));
  if (!k) { location.replace('food.html'); return; }

  const K = SN.KITCHENS[k];
  const M = SN.MENU[k];
  const other = k === 'crunchies' ? 'roots' : 'crunchies';
  const O = SN.KITCHENS[other];
  document.body.dataset.kitchen = k;
  document.title = `${K.name} — Supernova`;

  // ---- Outlet gate -----------------------------------------------------------
  const outlet = SN.outlets.list(k).find(x => x.id === param('o') && !x.closed);
  const deepItem = param('item');
  if (!outlet || param('pick')) { pickOutlet(); return; }
  const saved = SN.outlets.get(k);
  if (saved !== outlet.id) {
    // Switching outlets with a full bag empties it: each outlet cooks its own.
    if (saved && SN.cart.count(k)) { pickOutlet(); confirmSwitch(outlet.id); return; }
    SN.outlets.set(k, outlet.id);
  }
  const avail = id => SN.outlets.available(k, outlet.id, id);

  const ranked = M.items.filter(i => avail(i.id)).sort((a, b) => b.orders - a.orders);
  const rankOf = id => ranked.findIndex(i => i.id === id) + 1;
  const defaults = it => (it.groups || []).filter(g => g.type === 'one').map(g => `${g.id}:${g.options[0].id}`);

  // ---- Adding --------------------------------------------------------------
  const bar = document.querySelector('[data-bagbar]');
  function added(it, qty) {
    toast(`${qty > 1 ? qty + ' × ' : ''}${it.name} added to your ${K.name} bag`, { href: `cart.html?k=${k}`, label: 'View bag' });
    bump();
    bar.classList.remove('is-bumped');
    void bar.offsetWidth;
    bar.classList.add('is-bumped');
  }
  function quickAdd(it) {
    if (it.groups && it.groups.length) return openSheet(it);
    if (SN.cart.add(k, it.id, [], 1)) added(it, 1);
  }

  // ---- Outlet picker -----------------------------------------------------------
  function goTo(id) {
    location.href = `kitchen.html?k=${k}&o=${id}${deepItem ? `&item=${encodeURIComponent(deepItem)}` : ''}`;
  }
  function choose(id) {
    const current = SN.outlets.get(k);
    if (current && current !== id && SN.cart.count(k)) return confirmSwitch(id);
    SN.outlets.set(k, id);
    goTo(id);
  }
  function confirmSwitch(id) {
    const from = SN.outlets.find(SN.outlets.get(k));
    const to = SN.outlets.find(id);
    const n = SN.cart.count(k);
    const dlg = h('dialog', { class: 'sheet sheet--plain', 'aria-labelledby': 'sw-t', 'data-kitchen': k },
      h('div', { class: 'report' },
        h('h2', { class: 'h3', id: 'sw-t' }, 'Switch to ', h('em', { text: to.name }), '?'),
        h('p', { class: 'muted', text: `Your ${K.name} bag has ${n} item${n === 1 ? '' : 's'} from ${from.name}. Each outlet cooks its own orders, so switching empties the bag.` }),
        h('div', { class: 'report__acts' },
          h('button', { class: 'btn btn--quiet', type: 'button', onclick: () => { dlg.close(); goTo(from.id); } }, `Keep ${from.name}`),
          h('button', { class: 'btn btn--loud', type: 'button', onclick: () => { SN.cart.clear(k); SN.outlets.set(k, id); goTo(id); } }, 'Empty bag and switch'))));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  }
  function pickOutlet() {
    document.querySelector('[data-catnav]').hidden = true;
    document.querySelector('[data-menu]').hidden = true;
    const current = SN.outlets.get(k);
    const campus = SN.address.get()?.campusId;
    const list = SN.outlets.list(k).sort((a, b) => (b.campuses.includes(campus) - a.campuses.includes(campus)));
    const card = o => {
      const near = campus && o.campuses.includes(campus);
      const mine = current === o.id && SN.cart.count(k);
      return h('article', { class: `ocard2 ${o.closed ? 'is-closed' : ''}`, 'data-reveal': true },
        h('div', { class: 'ocard2__top' },
          h('span', { class: 'ocard2__pin' }, icon('pin')),
          near ? h('span', { class: 'spill spill--done' }, icon('check'), 'Closest to you') : null,
          mine ? h('span', { class: 'spill spill--live' }, icon('bag'), 'Your bag is here') : null,
          o.closed ? h('span', { class: 'spill spill--off', text: 'Closed now' }) : null),
        h('h2', { class: 'ocard2__name', text: o.name }),
        h('p', { class: 'ocard2__area', text: o.area }),
        h('ul', { class: 'meta-row' }, h('li', null, icon('clock'), o.eta), h('li', null, icon('star'), o.hours)),
        h('button', { class: `btn ${o.closed ? '' : 'btn--loud'} btn--block`, type: 'button', disabled: o.closed, onclick: () => choose(o.id) },
          o.closed ? 'Closed right now' : mine ? 'Back to my bag' : 'Order from here', o.closed ? null : icon('arrow')));
    };
    const hero = document.querySelector('[data-khero]');
    hero.classList.add('khero--pick');
    hero.replaceChildren(
      h('div', { class: 'khero__sky', 'aria-hidden': 'true' }),
      h('div', { class: 'khero__copy' },
        h('a', { class: 'back', href: 'food.html' }, icon('back'), 'All kitchens'),
        h('p', { class: 'khero__kicker' }, h('span', { class: `dot dot--${k}` }), `${K.name} · step 1 of 2`),
        h('h1', { class: 'khero__name khero__name--sm' }, 'Which ', h('em', { text: K.name }), '?'),
        h('p', { class: 'khero__tag', text: 'Pick the outlet closest to you. Each one cooks and sends its own orders.' })),
      h('figure', { class: 'frame khero__frame' }, h('img', { src: K.hero, alt: K.alt, width: 1100, height: 733 })));
    const grid = h('section', { class: 'wrap opick', 'aria-label': `${K.name} outlets` }, list.map(card));
    hero.closest('section').after(grid);
    reveal(grid);
  }

  // ---- Hero ----------------------------------------------------------------
  document.querySelector('[data-khero]').append(
    h('div', { class: 'khero__sky', 'aria-hidden': 'true' }),
    h('div', { class: 'khero__copy' },
      h('a', { class: 'back', href: 'food.html' }, icon('back'), 'All kitchens'),
      h('p', { class: 'khero__kicker' }, h('span', { class: `dot dot--${k}` }), 'You\'re ordering from'),
      h('h1', { class: 'khero__name', text: K.name }),
      h('p', { class: 'khero__outlet' }, icon('pin'), h('span', null, h('b', { text: outlet.name }), ` · ${outlet.area}`),
        h('a', { href: `kitchen.html?k=${k}&pick=1` }, 'Change')),
      h('p', { class: 'khero__tag', text: K.tagline }),
      h('ul', { class: 'meta-row meta-row--light' },
        h('li', null, icon('clock'), outlet.eta),
        h('li', null, icon('bike'), `${money(K.fee)} delivery`),
        h('li', null, icon('star'), `Open ${outlet.hours}`)),
      h('a', { class: 'switch', href: `kitchen.html?k=${other}` }, `Switch to ${O.name}`, icon('arrow'))),
    h('figure', { class: 'frame khero__frame' }, h('img', { src: K.hero, alt: K.alt, width: 1100, height: 733 })),
    h('p', { class: 'khero__note' }, icon('bag'), `${K.name} has its own bag. Anything from ${O.name} goes in a separate one.`));

  // ---- Category nav --------------------------------------------------------
  const sections = [{ id: 'top', name: 'Most ordered' }, ...M.categories];
  const chips = sections.map(s => h('a', { class: 'chip', href: `#cat-${s.id}`, 'data-for': s.id, text: s.name }));
  const search = h('input', { type: 'search', class: 'catnav__search', placeholder: `Search ${K.name}`, 'aria-label': `Search the ${K.name} menu`, autocomplete: 'off' });
  document.querySelector('[data-catnav]').append(h('div', { class: 'wrap catnav__in' },
    h('div', { class: 'catnav__chips' }, chips),
    h('label', { class: 'catnav__find' }, icon('search'), search)));

  // ---- Menu ----------------------------------------------------------------
  const menu = document.querySelector('[data-menu]');

  const topCard = (it, i) => h('article', { class: 'topcard', 'data-reveal': true },
    h('button', { class: 'hit', type: 'button', 'aria-label': `${it.name}, ${money(it.price)}. Choose options`, onclick: () => openSheet(it) }),
    h('span', { class: 'topcard__rank', 'aria-hidden': 'true', text: `${i + 1}` }),
    h('div', { class: 'topcard__media' }, h('img', { src: img(it.img), alt: '', width: 800, height: 533, loading: i ? 'lazy' : null })),
    h('div', { class: 'topcard__body' },
      h('h3', { class: 'topcard__name', text: it.name }),
      h('p', { class: 'topcard__desc', text: it.desc }),
      h('div', { class: 'topcard__foot' },
        h('span', { class: 'price', text: money(it.price) }),
        h('button', { class: 'add', type: 'button', 'aria-label': `Add ${it.name}`, onclick: () => quickAdd(it) }, icon('plus')))));

  const row = it => {
    const r = rankOf(it.id);
    const sold = !avail(it.id);
    return h('article', { class: 'irow', 'data-reveal': true, 'data-sold': sold ? 'true' : null, 'data-search': `${it.name} ${it.desc}`.toLowerCase() },
      sold ? null : h('button', { class: 'hit', type: 'button', 'aria-label': `${it.name}, ${money(it.price)}. Choose options`, onclick: () => openSheet(it) }),
      h('div', { class: 'irow__text' },
        r && r <= 5 ? h('span', { class: 'irow__pop' }, icon('flame'), `Popular · #${r}`) : null,
        h('h3', { class: 'irow__name', text: it.name }),
        h('p', { class: 'irow__desc', text: it.desc }),
        h('p', { class: 'price', text: money(it.price) })),
      h('div', { class: 'irow__media' },
        h('img', { src: img(it.img), alt: '', width: 300, height: 300, loading: 'lazy' }),
        sold
          ? h('span', { class: 'irow__sold', text: 'Sold out here today' })
          : h('button', { class: 'add', type: 'button', 'aria-label': `Add ${it.name}`, onclick: () => quickAdd(it) }, icon('plus'))));
  };

  menu.append(
    h('section', { class: 'msec', id: 'cat-top', 'data-sec': 'top', 'aria-labelledby': 'h-top' },
      h('div', { class: 'msec__head' },
        h('h2', { class: 'h3', id: 'h-top' }, 'Most ordered at ', h('em', { text: K.name })),
        h('p', { class: 'msec__note' }, icon('chart'), 'Ranked by how often students order them')),
      h('div', { class: 'tops' }, ranked.slice(0, 3).map(topCard))),
    ...M.categories.map(c => {
      const items = M.items.filter(i => i.cat === c.id);
      return h('section', { class: 'msec', id: `cat-${c.id}`, 'data-sec': c.id, 'aria-labelledby': `h-${c.id}` },
        h('div', { class: 'msec__head' },
          h('h2', { class: 'h3', id: `h-${c.id}`, text: c.name }),
          h('span', { class: 'msec__count', text: `${items.length} items` })),
        h('div', { class: 'irows' }, items.map(row)));
    }),
    h('p', { class: 'nomatch', hidden: true, 'data-nomatch': true, text: 'Nothing matches that. Try "chicken" or "rice".' }));
  reveal(menu);

  // Search filters rows and hides sections left empty.
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let any = false;
    menu.querySelectorAll('.msec').forEach(sec => {
      if (sec.dataset.sec === 'top') { sec.hidden = !!q; return; }
      let shown = 0;
      sec.querySelectorAll('.irow').forEach(r => { const ok = !q || r.dataset.search.includes(q); r.hidden = !ok; if (ok) shown++; });
      sec.hidden = shown === 0;
      if (shown) any = true;
    });
    menu.querySelector('[data-nomatch]').hidden = any;
  });

  // Scroll spy for the category chips.
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      chips.forEach(c => c.setAttribute('aria-current', String(c.dataset.for === en.target.dataset.sec)));
      const on = chips.find(c => c.dataset.for === en.target.dataset.sec);
      on && on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  menu.querySelectorAll('.msec').forEach(s => spy.observe(s));

  // ---- Item sheet ----------------------------------------------------------
  function openSheet(it) {
    if (!avail(it.id)) return;
    const sel = new Set(defaults(it));
    let qty = 1;
    const addBtn = h('button', { class: 'btn btn--loud btn--block', type: 'submit' });
    const qtyOut = h('output', { class: 'stepper__n', 'aria-live': 'polite' });
    const update = () => {
      const unit = SN.unitPrice(k, { id: it.id, opts: [...sel] });
      qtyOut.textContent = String(qty);
      addBtn.replaceChildren(icon('bag'), `Add to bag · ${money(unit * qty)}`);
      minus.disabled = qty <= 1;
    };
    const minus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': 'One fewer', onclick: () => { qty = Math.max(1, qty - 1); update(); } }, icon('minus'));
    const plus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': 'One more', onclick: () => { qty = Math.min(20, qty + 1); update(); } }, icon('plus'));

    const groups = (it.groups || []).map(g => h('fieldset', { class: 'opts' },
      h('legend', null, g.name, h('span', { class: 'opts__req', text: g.type === 'one' ? 'Pick one' : 'Optional' })),
      g.options.map(o => {
        const val = `${g.id}:${o.id}`;
        const input = h('input', { type: g.type === 'one' ? 'radio' : 'checkbox', name: `${it.id}-${g.id}`, value: val, checked: sel.has(val) });
        input.addEventListener('change', () => {
          if (g.type === 'one') g.options.forEach(x => sel.delete(`${g.id}:${x.id}`));
          input.checked ? sel.add(val) : sel.delete(val);
          update();
        });
        return h('label', { class: 'opt' }, input, h('span', { class: 'opt__box', 'aria-hidden': 'true' }, icon('check')),
          h('span', { class: 'opt__label', text: o.label }), o.price ? h('span', { class: 'opt__price', text: `+${money(o.price)}` }) : null);
      })));

    const form = h('form', { class: 'sheet__form', method: 'dialog' },
      h('div', { class: 'sheet__scroll' },
      h('div', { class: 'sheet__media' }, h('img', { src: img(it.img), alt: it.name, width: 800, height: 533 })),
      h('div', { class: 'sheet__body' },
        h('p', { class: 'sheet__kitchen' }, h('span', { class: `dot dot--${k}` }), K.name, rankOf(it.id) <= 5 ? h('span', { class: 'irow__pop' }, icon('flame'), `#${rankOf(it.id)} most ordered`) : null),
        h('h2', { class: 'sheet__title', id: 'sheet-t', text: it.name }),
        h('p', { class: 'sheet__desc', text: it.desc }),
        h('p', { class: 'price price--lg', text: money(it.price) }),
        groups)),
      h('div', { class: 'sheet__foot' },
        h('div', { class: 'stepper', role: 'group', 'aria-label': 'Quantity' }, minus, qtyOut, plus),
        addBtn));

    const dlg = h('dialog', { class: 'sheet', 'aria-labelledby': 'sheet-t', 'data-kitchen': k },
      h('button', { class: 'sheet__x', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('x')),
      form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (SN.cart.add(k, it.id, [...sel], qty)) added(it, qty);
      dlg.close();
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => dlg.remove());
    update();
    document.body.append(dlg);
    dlg.showModal();
    addBtn.focus();
  }

  // ---- Bag bar -------------------------------------------------------------
  const renderBar = () => {
    const n = SN.cart.count(k);
    bar.hidden = n === 0;
    if (!n) return;
    bar.replaceChildren(h('a', { class: 'bagbar__in wrap', href: `cart.html?k=${k}`, 'data-kitchen': k },
      h('span', { class: 'bagbar__n', text: String(n) }),
      h('span', { class: 'bagbar__k' }, h('small', { text: `Your bag · ${outlet.name}` }), `${K.name}`),
      h('span', { class: 'bagbar__t', text: money(SN.cart.totals(k).subtotal) }),
      h('span', { class: 'bagbar__go' }, 'View bag', icon('arrow'))));
  };
  renderBar();
  SN.onChange(renderBar);

  // Deep link from the home page: kitchen.html?k=roots&item=egusi
  const deep = param('item') && SN.item(k, param('item'));
  if (deep) openSheet(deep);
});
