// Checkout: hostel address, delivery time, then payment on the provider's
// page (simulated in this sandbox template).
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag } = SN.ui;
  const host = document.querySelector('[data-checkout]');
  const k = SN.ui.kitchenOr(param('k'));
  if (!k) { location.replace('cart.html'); return; }
  const K = SN.KITCHENS[k];
  document.body.dataset.kitchen = k;

  if (!SN.cart.lines(k).length) {
    host.append(empty({ title: `Your ${K.name} bag is empty`, body: 'Nothing to check out yet. Go pick something tasty.', cta: `Browse ${K.name}`, href: `kitchen.html?k=${k}` }));
    return;
  }

  const addr = SN.addressForm();
  const note = h('textarea', { id: 'note', name: 'note', rows: 2, maxlength: 140, placeholder: 'e.g. Call me when you get to the porter\'s lodge' });

  // Delivery time: ASAP, or a slot later today.
  const slots = (() => {
    const out = [];
    const d = new Date();
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
    d.setHours(d.getHours() + 1);
    for (let i = 0; i < 6; i++) { out.push(d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })); d.setMinutes(d.getMinutes() + 30); }
    return out;
  })();
  const slotSel = h('div', { class: 'select select--inline', hidden: true },
    h('select', { id: 'slot', 'aria-label': 'Delivery time' }, slots.map(s => h('option', { value: s, text: s }))), icon('chev', 'i select__chev'));
  const whenCard = (val, title, sub, checked) => h('label', { class: 'rcard' },
    h('input', { type: 'radio', name: 'when', value: val, checked, onchange: () => { slotSel.hidden = val !== 'later'; } }),
    h('span', { class: 'rcard__dot', 'aria-hidden': 'true' }),
    h('span', { class: 'rcard__t', text: title }), h('span', { class: 'rcard__s', text: sub }));

  const banner = h('div', { class: 'alert', role: 'alert', hidden: true });

  const form = h('form', { class: 'co__form', novalidate: true },
    banner,
    h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-where' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '1' }), h('div', null, h('h2', { class: 'panel__title', id: 'co-where', text: 'Where are we dropping it?' }), h('p', { class: 'co__sub', text: 'Pick from the lists and the rider finds you first time.' }))),
      addr.el,
      h('div', { class: 'form-grid co__note' },
        h('div', { class: 'field field--wide' }, h('label', { for: 'note' }, 'Note for the rider', h('span', { class: 'field__opt', text: 'Optional' })), note))),
    h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-when' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '2' }), h('h2', { class: 'panel__title', id: 'co-when', text: 'When do you want it?' })),
      h('div', { class: 'rcards' },
        whenCard('now', 'Right now, please', `Usually ${K.eta}`, true),
        whenCard('later', 'Later today', 'Pick a time')),
      slotSel),
    h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-pay' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '3' }), h('h2', { class: 'panel__title', id: 'co-pay', text: 'Paying' })),
      h('div', { class: 'paynote' },
        h('span', { class: 'paynote__icon' }, icon('shield')),
        h('div', null,
          h('p', { class: 'paynote__t', text: 'You pay on our payment partner\'s secure page.' }),
          h('p', { text: 'Card, transfer or USSD. We never see your card details, and tapping twice won\'t charge you twice.' })))));

  // ---- Summary ---------------------------------------------------------------
  const t = SN.cart.totals(k);
  const payBtn = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, icon('lock'), `Pay ${money(t.total)}`);
  const summary = h('aside', { class: 'panel summary co__summary', 'aria-label': 'Order summary' },
    h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title', text: 'Your order' }), tag(k)),
    h('ul', { class: 'mini' }, SN.cart.lines(k).map(l => {
      const it = SN.item(k, l.id);
      const opts = SN.optionsFor(k, l).map(o => o.label);
      return h('li', null,
        h('img', { src: img(it.img), alt: '', width: 48, height: 48 }),
        h('span', { class: 'mini__q', text: `${l.qty}×` }),
        h('span', { class: 'mini__n' }, it.name, opts.length ? h('small', { text: opts.join(' · ') }) : null),
        h('span', { class: 'mini__p', text: money(SN.unitPrice(k, l) * l.qty) }));
    })),
    h('a', { class: 'linkish', href: `cart.html?k=${k}` }, 'Edit bag'),
    h('dl', { class: 'sums' },
      h('div', null, h('dt', { text: 'Food' }), h('dd', { text: money(t.subtotal) })),
      h('div', null, h('dt', { text: 'Delivery' }), h('dd', { text: money(t.fee) })),
      h('div', { class: 'sums__total' }, h('dt', { text: 'Total' }), h('dd', { text: money(t.total) }))),
    payBtn,
    h('p', { class: 'summary__safe' }, icon('lock'), 'By paying you agree to our terms and refund policy.'));

  host.append(h('div', { class: 'co' }, form, summary),
    h('div', { class: 'paybar' },
      h('span', { class: 'paybar__t' }, h('small', { text: `${K.name} · total` }), money(t.total)),
      h('button', { class: 'btn btn--loud', type: 'button', onclick: () => payBtn.click() }, icon('lock'), 'Pay')));

  // ---- Pay -------------------------------------------------------------------
  payBtn.addEventListener('click', () => {
    banner.hidden = true;
    if (!addr.validate()) return;
    const a = { ...addr.value(), note: note.value.trim(), when: form.elements.when.value === 'later' ? document.getElementById('slot').value : 'asap' };
    SN.ui.pay({
      amount: t.total,
      label: `Supernova · ${K.name} order`,
      busy: payBtn,
      onFail: () => {
        banner.replaceChildren(icon('alert'), h('div', null, h('strong', { text: 'That payment didn\'t go through.' }), ' Nothing was charged and your bag is still here. Try again whenever you\'re ready.'));
        banner.hidden = false;
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onSuccess: () => {
        const order = SN.orders.place(k, a);
        location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
      }
    });
  });
});
