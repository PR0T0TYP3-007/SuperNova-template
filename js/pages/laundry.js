// Dry cleaning: count items from the price list, pick a pickup slot, book.
// The total is an estimate; the rider confirms it after counting.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money } = SN.ui;
  const host = document.querySelector('[data-booking]');
  const qty = {};
  const allItems = SN.LAUNDRY.flatMap(g => g.items);

  // ---- Price list with steppers --------------------------------------------
  const stepper = it => {
    const out = h('output', { class: 'stepper__n', text: '0' });
    const minus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': `One fewer ${it.name}`, disabled: true, onclick: () => set(-1) }, icon('minus'));
    const plus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': `One more ${it.name}`, onclick: () => set(1) }, icon('plus'));
    function set(d) {
      qty[it.id] = Math.max(0, Math.min(30, (qty[it.id] || 0) + d));
      out.textContent = String(qty[it.id]);
      minus.disabled = !qty[it.id];
      out.closest('.lrow').classList.toggle('is-on', !!qty[it.id]);
      drawSummary();
    }
    return h('div', { class: 'stepper stepper--sm', role: 'group', 'aria-label': `How many ${it.name}` }, minus, out, plus);
  };

  const list = h('div', { class: 'co__form' }, SN.LAUNDRY.map(g => h('section', { class: 'panel co__sec' },
    h('h3', { class: 'panel__title lgroup', text: g.name }),
    h('ul', { class: 'lrows' }, g.items.map(it => h('li', { class: 'lrow' },
      h('div', { class: 'lrow__info' }, h('span', { class: 'lrow__name', text: it.name }), it.note ? h('span', { class: 'lrow__note', text: it.note }) : null),
      h('span', { class: 'lrow__price', text: money(it.price) }),
      stepper(it)))))));

  // ---- Pickup + address ------------------------------------------------------
  const days = ['Today', 'Tomorrow', (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toLocaleDateString('en-NG', { weekday: 'long' }); })()];
  const windows = [['morning', 'Morning', '8 – 11am'], ['afternoon', 'Afternoon', '12 – 3pm'], ['evening', 'Evening', '4 – 7pm']];
  const chipGroup = (name, opts, first) => h('div', { class: 'chips', role: 'radiogroup', 'aria-label': name },
    opts.map(([v, t, s], i) => h('label', { class: 'chip chip--radio' }, h('input', { type: 'radio', name, value: v, checked: i === first }), h('span', null, t, s ? h('small', { text: ` ${s}` }) : null))));
  const express = h('input', { type: 'checkbox', id: 'l-express' });
  express.addEventListener('change', () => drawSummary());
  const note = h('textarea', { id: 'l-note', rows: 2, maxlength: 200, placeholder: 'e.g. White shirts separate, please' });
  const addr = SN.addressForm('l-');

  list.append(h('section', { class: 'panel co__sec' },
    h('h3', { class: 'panel__title lgroup', text: 'Pickup' }),
    h('p', { class: 'co__sub', text: 'Which day?' }), chipGroup('day', days.map(d => [d, d]), 1),
    h('p', { class: 'co__sub', text: 'What time?' }), chipGroup('window', windows, 0),
    h('label', { class: 'opt lexpress' }, express, h('span', { class: 'opt__box', 'aria-hidden': 'true' }, icon('check')),
      h('span', { class: 'opt__label' }, 'Express, back in 24 hours'), h('span', { class: 'opt__price', text: `+${money(SN.LAUNDRY_FEES.express)}` })),
    h('div', { class: 'co__addr' }, addr.el),
    h('div', { class: 'form-grid co__note' },
      h('div', { class: 'field field--wide' }, h('label', { for: 'l-note' }, 'Notes for the cleaner', h('span', { class: 'field__opt', text: 'Optional' })), note))));

  // ---- Summary -----------------------------------------------------------------
  const bookBtn = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, 'Book my pickup', icon('arrow'));
  const sumList = h('ul', { class: 'sumlist' });
  const sums = h('dl', { class: 'sums' });
  const err = h('p', { class: 'field__err', 'aria-live': 'polite' });
  const barTotal = h('span', { class: 'paybar__t' });
  const summary = h('aside', { class: 'panel summary co__summary', 'aria-label': 'Booking summary' },
    h('h3', { class: 'panel__title', text: 'Your pickup' }), sumList, sums, err, bookBtn,
    h('p', { class: 'summary__safe' }, icon('shield'), 'Pay after pickup, once we\'ve counted everything.'));

  const picked = () => allItems.filter(it => qty[it.id]).map(it => [it, qty[it.id]]);
  function totals() {
    const sub = picked().reduce((s, [it, n]) => s + it.price * n, 0);
    const fee = SN.LAUNDRY_FEES.pickup + (express.checked ? SN.LAUNDRY_FEES.express : 0);
    return { sub, fee, total: sub + fee };
  }
  function drawSummary() {
    const p = picked();
    const t = totals();
    sumList.replaceChildren(...(p.length
      ? p.map(([it, n]) => h('li', null, h('span', { text: `${n}× ${it.name}` }), h('span', { text: money(it.price * n) })))
      : [h('li', { class: 'sumlist__empty', text: 'Nothing in the bag yet.' })]));
    sums.replaceChildren(
      h('div', null, h('dt', { text: 'Items' }), h('dd', { text: money(t.sub) })),
      h('div', null, h('dt', { text: express.checked ? 'Pickup + express' : 'Pickup & delivery' }), h('dd', { text: money(t.fee) })),
      h('div', { class: 'sums__total' }, h('dt', { text: 'Estimate' }), h('dd', { text: money(p.length ? t.total : 0) })));
    barTotal.replaceChildren(h('small', { text: 'Estimate · pay later' }), money(p.length ? t.total : 0));
    if (p.length) err.textContent = '';
  }

  host.append(h('div', { class: 'co' }, list, summary),
    h('div', { class: 'paybar' }, barTotal, h('button', { class: 'btn btn--loud', type: 'button', onclick: () => bookBtn.click() }, 'Book')));
  SN.ui.barFollows(host.querySelector('.paybar'), host);
  drawSummary();

  bookBtn.addEventListener('click', () => {
    const p = picked();
    if (!p.length) { err.textContent = 'Add at least one item so we know what to bring a bag for.'; list.querySelector('.stepper__b:not(:disabled)').focus(); return; }
    if (!addr.validate()) return;
    bookBtn.disabled = true;
    const f = list.closest('[data-booking]');
    const day = f.querySelector('input[name=day]:checked').value;
    const win = windows.find(w => w[0] === f.querySelector('input[name=window]:checked').value);
    const order = SN.orders.bookLaundry({
      items: p.map(([it, n]) => [it.id, n]),
      express: express.checked,
      slot: `${day}, ${win[1].toLowerCase()} (${win[2]})`,
      note: note.value.trim(),
      address: addr.value()
    });
    location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
  });
});
