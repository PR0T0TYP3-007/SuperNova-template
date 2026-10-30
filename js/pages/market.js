// Market runs: pick a market, build a shopping list (or start from a pack),
// send it. Partners quote it; nothing is charged until the quote is approved.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, toast, reveal } = SN.ui;

  // ---- Market day photos (atmosphere only) ---------------------------------
  document.querySelector('[data-markets]').append(...SN.MARKET_PHOTOS.map(m => h('figure', { class: 'mcard', 'data-reveal': true },
    h('div', { class: 'mcard__media' }, h('img', { src: img(m.img), alt: m.caption, loading: 'lazy' })),
    h('figcaption', { class: 'mcard__body' },
      h('span', { class: 'mcard__name', text: m.caption }),
      h('a', { class: 'mcard__credit', href: m.creditUrl, target: '_blank', rel: 'noopener', text: m.credit })))));

  // ---- List state ----------------------------------------------------------
  let rows = [];
  const again = param('again') && SN.orders.get(param('again'));
  if (again && SN.orders.kind(again) === 'market') rows = again.items.map(i => ({ ...i }));
  if (!rows.length) rows = [{ name: '', qty: 1, unit: 'kg' }];
  const filled = () => rows.filter(r => r.name.trim() && r.qty > 0);

  // ---- Packs ---------------------------------------------------------------
  document.querySelector('[data-packs]').append(...SN.MARKET_PACKS.map(p => h('article', { class: 'pack', 'data-reveal': true },
    h('div', { class: 'pack__media' }, h('img', { src: img(p.img), alt: '', loading: 'lazy' })),
    h('div', { class: 'pack__body' },
      h('h3', { class: 'pack__name', text: p.name }),
      h('p', { class: 'pack__blurb', text: p.blurb }),
      h('ul', { class: 'pack__items' },
        p.items.slice(0, 4).map(([n, q, u]) => h('li', { text: `${q} ${u} ${n.toLowerCase()}` })),
        p.items.length > 4 ? h('li', { class: 'pack__more', text: `+${p.items.length - 4} more` }) : null),
      h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => usePack(p) }, icon('plus'), 'Use this pack')))));

  function usePack(p) {
    const kept = filled();
    p.items.forEach(([name, qty, unit]) => {
      const same = kept.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (same) same.qty = qty; else kept.push({ name, qty, unit });
    });
    rows = kept;
    drawRows();
    document.getElementById('list').scrollIntoView({ behavior: 'smooth' });
    toast(`${p.name} added to your list`);
  }

  // ---- Builder -------------------------------------------------------------
  const builder = document.querySelector('[data-builder]');
  const datalist = h('datalist', { id: 'staples' }, SN.STAPLES.map(([n]) => h('option', { value: n })));
  const rowsEl = h('ul', { class: 'mrows' });
  const quickEl = h('div', { class: 'quick' });
  const rowsErr = h('p', { class: 'field__err', 'aria-live': 'polite' });

  const unitSel = r => h('div', { class: 'select' },
    h('select', { 'aria-label': 'Unit', onchange: e => { r.unit = e.target.value; drawSummary(); } },
      SN.MARKET_UNITS.map(u => h('option', { value: u, text: u, selected: u === r.unit }))), icon('chev', 'i select__chev'));

  function drawRows() {
    rowsEl.replaceChildren(...rows.map((r, i) => h('li', { class: 'mrow' },
      h('input', { class: 'mrow__name', type: 'text', list: 'staples', placeholder: 'e.g. Rice', value: r.name, 'aria-label': `Item ${i + 1}`,
        oninput: e => {
          r.name = e.target.value;
          const known = SN.STAPLES.find(([n]) => n.toLowerCase() === r.name.trim().toLowerCase());
          if (known && r.unit !== known[1]) { r.unit = known[1]; e.target.closest('.mrow').querySelector('select').value = known[1]; }
          drawSummary(); drawQuick();
        } }),
      h('input', { class: 'mrow__qty', type: 'number', min: '0.5', step: '0.5', inputmode: 'decimal', value: r.qty, 'aria-label': `Quantity of item ${i + 1}`,
        oninput: e => { r.qty = parseFloat(e.target.value) || 0; drawSummary(); } }),
      unitSel(r),
      h('button', { class: 'mrow__x', type: 'button', 'aria-label': `Remove ${r.name || 'item ' + (i + 1)}`,
        onclick: () => { rows.splice(i, 1); if (!rows.length) rows.push({ name: '', qty: 1, unit: 'kg' }); drawRows(); } }, icon('x')))));
    drawQuick();
    drawSummary();
  }

  function addRow(name = '', unit = 'kg', qty = 1) {
    const blank = rows.find(r => !r.name.trim());
    if (name && blank) Object.assign(blank, { name, unit, qty }); else rows.push({ name, qty, unit });
    drawRows();
    const inputs = rowsEl.querySelectorAll('.mrow__name');
    if (!name) inputs[inputs.length - 1].focus();
  }

  function drawQuick() {
    const have = new Set(rows.map(r => r.name.trim().toLowerCase()));
    quickEl.replaceChildren(h('span', { class: 'quick__k', text: 'Quick add' }),
      ...SN.STAPLES.filter(([n]) => !have.has(n.toLowerCase())).slice(0, 10)
        .map(([n, u]) => h('button', { class: 'chip chip--sm', type: 'button', onclick: () => addRow(n, u) }, icon('plus'), n)));
  }

  const days = (() => {
    const d = new Date(); const out = [];
    for (let i = 1; i <= 5; i++) { d.setDate(d.getDate() + 1); out.push(i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })); }
    return out;
  })();
  const daySel = h('div', { class: 'select' }, h('select', { id: 'm-day' }, days.map(d => h('option', { value: d, text: d }))), icon('chev', 'i select__chev'));
  const budget = h('input', { id: 'm-budget', type: 'number', inputmode: 'numeric', min: '0', step: '500', placeholder: 'e.g. 30000' });
  const note = h('textarea', { id: 'm-note', rows: 2, maxlength: 200, placeholder: 'e.g. Big yams only, ripe plantain please' });
  const addr = SN.addressForm('m-');

  const form = h('form', { class: 'co__form', novalidate: true },
    h('section', { class: 'panel co__sec' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '1' }), h('div', null, h('h3', { class: 'panel__title', text: 'What do you need?' }), h('p', { class: 'co__sub', text: 'Item, how much, and the unit. Market units like paint and derica are fine.' }))),
      h('div', { class: 'mrows__head', 'aria-hidden': 'true' }, h('span', { text: 'Item' }), h('span', { text: 'Qty' }), h('span', { text: 'Unit' })),
      rowsEl, datalist, rowsErr,
      h('button', { class: 'addmore', type: 'button', onclick: () => addRow() }, icon('plus'), 'Add another item'),
      quickEl),
    h('section', { class: 'panel co__sec' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '2' }), h('h3', { class: 'panel__title', text: 'When and where?' })),
      h('div', { class: 'form-grid' },
        h('div', { class: 'field' }, h('label', { for: 'm-day' }, 'Delivery day'), daySel),
        h('div', { class: 'field' }, h('label', { for: 'm-budget' }, 'Budget (₦)', h('span', { class: 'field__opt', text: 'Optional' })), budget)),
      h('div', { class: 'co__addr' }, addr.el),
      h('div', { class: 'form-grid co__note' },
        h('div', { class: 'field field--wide' }, h('label', { for: 'm-note' }, 'Anything else?', h('span', { class: 'field__opt', text: 'Optional' })), note))));

  const sendBtn = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, 'Send my list', icon('arrow'));
  const sumList = h('ul', { class: 'sumlist' });
  const sumCount = h('span', { class: 'muted' });
  const summary = h('aside', { class: 'panel summary co__summary', 'aria-label': 'List summary' },
    h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title', text: 'Your list' }), sumCount),
    sumList,
    h('dl', { class: 'sums' },
      h('div', null, h('dt', { text: 'Items' }), h('dd', { text: 'In your quote' })),
      h('div', null, h('dt', { text: 'Service fee' }), h('dd', { text: money(SN.MARKET_FEES.service) })),
      h('div', null, h('dt', { text: 'Delivery' }), h('dd', { text: money(SN.MARKET_FEES.delivery) })),
      h('div', { class: 'sums__total' }, h('dt', { text: 'Pay now' }), h('dd', { text: money(0) }))),
    h('p', { class: 'summary__eta' }, icon('clock'), 'Quotes usually land within the hour.'),
    sendBtn,
    h('p', { class: 'summary__safe' }, icon('shield'), 'Market prices move, so you approve the total before anything is charged.'));

  function drawSummary() {
    const f = filled();
    sumCount.textContent = `${f.length} item${f.length === 1 ? '' : 's'}`;
    sumList.replaceChildren(...(f.length
      ? f.slice(0, 8).map(r => h('li', null, h('span', { text: r.name }), h('span', { class: 'muted', text: `${r.qty} ${r.unit}` })))
      : [h('li', { class: 'sumlist__empty', text: 'Nothing yet. Add an item or pick a pack.' })]),
      f.length > 8 ? h('li', { class: 'muted', text: `+${f.length - 8} more` }) : '');
  }

  builder.append(h('div', { class: 'co' }, form, summary),
    h('div', { class: 'paybar' },
      h('span', { class: 'paybar__t' }, h('small', { text: 'Pay nothing now' }), 'Your list'),
      h('button', { class: 'btn btn--loud', type: 'button', onclick: () => sendBtn.click() }, 'Send list')));
  SN.ui.barFollows(builder.querySelector('.paybar'), builder);
  drawRows();
  reveal();

  sendBtn.addEventListener('click', () => {
    const f = filled();
    rowsErr.textContent = f.length ? '' : 'Add at least one item to your list.';
    if (!f.length) { rowsEl.querySelector('.mrow__name').focus(); return; }
    if (!addr.validate()) return;
    sendBtn.disabled = true;
    const order = SN.orders.requestMarket({
      items: f.map(r => ({ name: r.name.trim(), qty: r.qty, unit: r.unit })),
      budget: parseInt(budget.value, 10) || null,
      when: document.getElementById('m-day').value,
      note: note.value.trim(),
      address: addr.value()
    });
    location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
  });
});
