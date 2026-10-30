// Checkout in two steps, the same for Crunchies and Roots:
//   ?step=details  contact + delivery address + time   → "Continue to payment"
//   ?step=pay      review everything, pay on the provider's page (simulated)
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag } = SN.ui;
  const head = document.querySelector('[data-cohead]');
  const host = document.querySelector('[data-checkout]');
  const k = SN.ui.kitchenOr(param('k'));
  if (!k) { location.replace('cart.html'); return; }
  const K = SN.KITCHENS[k];
  const outlet = SN.outlets.find(SN.outlets.get(k));
  document.body.dataset.kitchen = k;

  if (!SN.cart.lines(k).length) {
    host.append(empty({ title: `Your ${K.name} bag is empty`, body: 'Nothing to check out yet. Go pick something tasty.', cta: `Browse ${K.name}`, href: `kitchen.html?k=${k}` }));
    return;
  }

  const saved = SN.address.get() || {};
  const ready = saved.name && saved.email && saved.campusId && saved.hostel && saved.phone;
  const step = param('step') === 'pay' && ready ? 'pay' : 'details';
  const t = SN.cart.totals(k);
  const url = s => `checkout.html?k=${k}&step=${s}`;

  // ---- Progress + heading -----------------------------------------------------
  const flowStep = (n, label, state, href) => h('li', { class: state ? `is-${state}` : null },
    h('span', null, state === 'done' ? icon('check') : String(n)), href ? h('a', { href, text: label }) : label);
  head.append(
    h('ol', { class: 'flow', 'aria-label': 'Checkout progress' },
      flowStep(1, 'Bag', 'done', `cart.html?k=${k}`),
      flowStep(2, 'Details', step === 'details' ? 'now' : 'done', step === 'pay' ? url('details') : null),
      flowStep(3, 'Payment', step === 'pay' ? 'now' : null),
      flowStep(4, 'Track', null)),
    step === 'details'
      ? h('h1', { class: 'h1' }, 'Where\'s it ', h('em', { text: 'going?' }))
      : h('h1', { class: 'h1' }, 'Last step, ', h('em', { text: 'pay.' })));

  // ---- Shared order summary ------------------------------------------------------
  const summary = action => h('aside', { class: 'panel summary co__summary', 'aria-label': 'Order summary' },
    h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title', text: 'Your order' }), tag(k)),
    outlet ? h('p', { class: 'co__outlet' }, icon('pin'), `From ${outlet.name}`) : null,
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
    action,
    h('p', { class: 'summary__safe' }, icon('lock'), step === 'pay' ? 'By paying you agree to our terms and refund policy.' : 'You won\'t be charged yet.'));

  if (step === 'details') details(); else pay();

  // ---- Step 2: details ---------------------------------------------------------------
  function details() {
    const addr = SN.addressForm('', { contact: true });
    const note = h('textarea', { id: 'note', name: 'note', rows: 2, maxlength: 140, placeholder: 'e.g. Call me when you get to the porter\'s lodge', value: saved.note || '' });
    note.value = saved.note || '';

    const slots = (() => {
      const out = [];
      const d = new Date();
      d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
      d.setHours(d.getHours() + 1);
      for (let i = 0; i < 6; i++) { out.push(d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })); d.setMinutes(d.getMinutes() + 30); }
      return out;
    })();
    const later = saved.when && saved.when !== 'asap';
    const slotSel = h('div', { class: 'select select--inline', hidden: !later },
      h('select', { id: 'slot', 'aria-label': 'Delivery time' }, slots.map(s => h('option', { value: s, text: s, selected: s === saved.when }))), icon('chev', 'i select__chev'));
    const whenCard = (val, title, sub, checked) => h('label', { class: 'rcard' },
      h('input', { type: 'radio', name: 'when', value: val, checked, onchange: () => { slotSel.hidden = val !== 'later'; } }),
      h('span', { class: 'rcard__dot', 'aria-hidden': 'true' }),
      h('span', { class: 'rcard__t', text: title }), h('span', { class: 'rcard__s', text: sub }));

    const form = h('form', { class: 'co__form', novalidate: true },
      h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-where' },
        h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '1' }), h('div', null, h('h2', { class: 'panel__title', id: 'co-where', text: 'Your details' }), h('p', { class: 'co__sub', text: 'Who it\'s for and where we\'re bringing it.' }))),
        addr.el,
        h('div', { class: 'form-grid co__note' },
          h('div', { class: 'field field--wide' }, h('label', { for: 'note' }, 'Note for the rider', h('span', { class: 'field__opt', text: 'Optional' })), note))),
      h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-when' },
        h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '2' }), h('h2', { class: 'panel__title', id: 'co-when', text: 'When do you want it?' })),
        h('div', { class: 'rcards' },
          whenCard('now', 'Right now, please', `Usually ${outlet ? outlet.eta : K.eta}`, !later),
          whenCard('later', 'Later today', 'Pick a time', later)),
        slotSel));

    const next = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, 'Continue to payment', icon('arrow'));
    host.append(h('div', { class: 'co' }, form, summary(next)),
      h('div', { class: 'paybar' },
        h('span', { class: 'paybar__t' }, h('small', { text: `${K.name} · total` }), money(t.total)),
        h('button', { class: 'btn btn--loud', type: 'button', onclick: () => next.click() }, 'Continue')));

    next.addEventListener('click', () => {
      if (!addr.validate()) return;
      const a = addr.value();
      SN.address.set({ ...SN.address.get(), ...a, note: note.value.trim(), when: form.elements.when.value === 'later' ? document.getElementById('slot').value : 'asap' });
      location.href = url('pay');
    });
  }

  // ---- Step 3: review + pay ------------------------------------------------------------
  function pay() {
    const d = SN.address.get();
    const edit = h('a', { class: 'linkish', href: url('details') }, 'Edit');
    const banner = h('div', { class: 'alert', role: 'alert', hidden: true });
    const review = (iconName, label, main, sub) => h('div', { class: 'review__row' },
      h('span', { class: 'review__icon' }, icon(iconName)),
      h('div', null, h('p', { class: 'review__k', text: label }), h('p', { class: 'review__v', text: main }), sub ? h('p', { class: 'review__s', text: sub }) : null));

    const payBtn = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, icon('lock'), `Pay ${money(t.total)}`);
    const left = h('div', { class: 'co__form' },
      banner,
      h('section', { class: 'panel co__sec', 'aria-labelledby': 'rv-h' },
        h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title', id: 'rv-h', text: 'Check your details' }), edit),
        h('div', { class: 'review' },
          review('pin', 'Delivering to', SN.ui.addrLine(d), `${d.campus}. Hostel or gate, we'll call you.`),
          review('phone', 'Contact', d.name, `${d.phone} · ${d.email}`),
          outlet ? review('flame', 'Cooked at', `${K.name} ${outlet.name}`, outlet.area) : null,
          review('clock', 'When', d.when === 'asap' ? `As soon as possible (${outlet ? outlet.eta : K.eta})` : `Today at ${d.when}`),
          d.note ? review('receipt', 'Note for the rider', d.note) : null)),
      h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-pay' },
        h('div', { class: 'co__sechead' }, h('span', { class: 'co__n' }, icon('lock')), h('h2', { class: 'panel__title', id: 'co-pay', text: 'Payment' })),
        h('div', { class: 'paynote' },
          h('span', { class: 'paynote__icon' }, icon('shield')),
          h('div', null,
            h('p', { class: 'paynote__t', text: 'You pay on our payment partner\'s secure page.' }),
            h('p', { text: 'Card, transfer or USSD. We never see your card details, and tapping twice won\'t charge you twice.' })))));

    host.append(h('div', { class: 'co' }, left, summary(payBtn)),
      h('div', { class: 'paybar' },
        h('span', { class: 'paybar__t' }, h('small', { text: `${K.name} · total` }), money(t.total)),
        h('button', { class: 'btn btn--loud', type: 'button', onclick: () => payBtn.click() }, icon('lock'), 'Pay')));

    payBtn.addEventListener('click', () => {
      banner.hidden = true;
      SN.ui.pay({
        amount: t.total,
        label: `Supernova · ${K.name} ${outlet ? outlet.name : ''}`.trim(),
        busy: payBtn,
        onFail: () => {
          banner.replaceChildren(icon('alert'), h('div', null, h('strong', { text: 'That payment didn\'t go through.' }), ' Nothing was charged and your bag is still here. Try again whenever you\'re ready.'));
          banner.hidden = false;
          banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        onSuccess: () => {
          const order = SN.orders.place(k, d);
          location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
        }
      });
    });
  }
});
