// Checkout: structured hostel address, delivery time, then payment on the
// provider's page (simulated in this sandbox template).
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag } = SN.ui;
  const host = document.querySelector('[data-checkout]');
  const k = SN.ui.kitchenOr(param('k'));
  if (!k) { location.replace('cart.html'); return; }
  const K = SN.KITCHENS[k];
  document.body.dataset.kitchen = k;

  if (!SN.cart.lines(k).length) {
    host.append(empty({ title: `Your ${K.name} bag is empty`, body: 'Add something to your bag before checking out.', cta: `Browse ${K.name}`, href: `kitchen.html?k=${k}` }));
    return;
  }

  const saved = SN.address.get() || {};

  // ---- Fields --------------------------------------------------------------
  const err = id => h('p', { class: 'field__err', id: `${id}-err`, 'aria-live': 'polite' });
  const field = (id, label, control, opts = {}) => h('div', { class: `field ${opts.wide ? 'field--wide' : ''}` },
    h('label', { for: id }, label, opts.optional ? h('span', { class: 'field__opt', text: 'Optional' }) : null),
    control, opts.hint ? h('p', { class: 'field__hint', text: opts.hint }) : null, err(id));
  const select = (id, placeholder, options, value) => h('div', { class: 'select' },
    h('select', { id, name: id, 'aria-describedby': `${id}-err`, required: true },
      h('option', { value: '', text: placeholder }),
      options.map(([v, t]) => h('option', { value: v, text: t, selected: v === value }))),
    icon('chev', 'i select__chev'));

  const campusSel = select('campus', 'Choose your university', SN.CAMPUSES.map(c => [c.id, c.name]), saved.campusId);
  const hostelWrap = h('div');
  const hostelOptions = cid => (SN.CAMPUSES.find(c => c.id === cid)?.hostels || []).map(x => [x, x]);
  const drawHostel = (cid, val) => {
    const s = select('hostel', cid ? 'Choose your hostel' : 'Choose a university first', hostelOptions(cid), val);
    s.querySelector('select').disabled = !cid;
    hostelWrap.replaceChildren(s);
  };
  drawHostel(saved.campusId, saved.hostel);
  campusSel.querySelector('select').addEventListener('change', e => drawHostel(e.target.value));

  const blockSel = select('block', 'Block', SN.BLOCKS.map(b => [b, `Block ${b}`]), saved.block);
  const room = h('input', { id: 'room', name: 'room', type: 'text', inputmode: 'numeric', maxlength: 8, placeholder: 'e.g. 214', value: saved.room || '', 'aria-describedby': 'room-err', required: true });
  const phone = h('input', { id: 'phone', name: 'phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', placeholder: '0803 000 0000', value: saved.phone || '', 'aria-describedby': 'phone-err', required: true });
  const note = h('textarea', { id: 'note', name: 'note', rows: 2, maxlength: 140, placeholder: 'e.g. Call when you reach the porter\'s lodge' });

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
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '1' }), h('div', null, h('h2', { class: 'panel__title', id: 'co-where', text: 'Where should we bring it?' }), h('p', { class: 'co__sub', text: 'Pick from the lists so the rider finds you first time.' }))),
      h('div', { class: 'form-grid' },
        field('campus', 'University', campusSel, { wide: true }),
        field('hostel', 'Hostel', hostelWrap, { wide: true }),
        field('block', 'Block', blockSel),
        field('room', 'Room', room),
        field('phone', 'Phone number', h('div', { class: 'prefix' }, h('span', { text: '+234' }), phone), { wide: true, hint: 'The rider calls this number when they arrive.' }),
        field('note', 'Note for the rider', note, { wide: true, optional: true }))),
    h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-when' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '2' }), h('h2', { class: 'panel__title', id: 'co-when', text: 'When?' })),
      h('div', { class: 'rcards' },
        whenCard('now', 'As soon as possible', `Usually ${K.eta}`, true),
        whenCard('later', 'Later today', 'Pick a time slot', false)),
      slotSel),
    h('section', { class: 'panel co__sec', 'aria-labelledby': 'co-pay' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '3' }), h('h2', { class: 'panel__title', id: 'co-pay', text: 'Payment' })),
      h('div', { class: 'paynote' },
        h('span', { class: 'paynote__icon' }, icon('shield')),
        h('div', null,
          h('p', { class: 'paynote__t', text: 'You\'ll pay on our payment partner\'s secure page.' }),
          h('p', { text: 'Card, bank transfer or USSD. Supernova never sees or stores your card details, and you\'re only charged once even if you tap twice.' })))));

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
      h('div', null, h('dt', { text: 'Subtotal' }), h('dd', { text: money(t.subtotal) })),
      h('div', null, h('dt', { text: 'Delivery' }), h('dd', { text: money(t.fee) })),
      h('div', { class: 'sums__total' }, h('dt', { text: 'Total' }), h('dd', { text: money(t.total) }))),
    payBtn,
    h('p', { class: 'summary__safe' }, icon('lock'), 'By paying you agree to the terms and refund policy.'));

  host.append(h('div', { class: 'co' }, form, summary),
    h('div', { class: 'paybar' },
      h('span', { class: 'paybar__t' }, h('small', { text: `${K.name} · total` }), money(t.total)),
      h('button', { class: 'btn btn--loud', type: 'button', onclick: () => payBtn.click() }, icon('lock'), 'Pay')));

  // ---- Validation --------------------------------------------------------------
  const setErr = (id, msg) => {
    const el = document.getElementById(id);
    const e = document.getElementById(`${id}-err`);
    el.setAttribute('aria-invalid', String(!!msg));
    e.textContent = msg || '';
    return !msg;
  };
  const digits = v => v.replace(/\D/g, '').replace(/^234/, '0');
  function validate() {
    const v = id => document.getElementById(id).value.trim();
    const checks = [
      ['campus', v('campus') ? '' : 'Choose your university.'],
      ['hostel', v('hostel') ? '' : 'Choose your hostel.'],
      ['block', v('block') ? '' : 'Choose a block.'],
      ['room', /^[A-Za-z0-9-]{1,8}$/.test(v('room')) ? '' : 'Add your room number.'],
      ['phone', /^0?[789][01]\d{8}$/.test(digits(v('phone'))) ? '' : 'Enter a Nigerian mobile number, like 0803 000 0000.']
    ];
    const bad = checks.filter(([id, msg]) => !setErr(id, msg));
    if (bad.length) document.getElementById(bad[0][0]).focus();
    return !bad.length;
  }
  form.addEventListener('change', e => { if (e.target.getAttribute('aria-invalid') === 'true') validate(); });

  // ---- Pay -------------------------------------------------------------------
  payBtn.addEventListener('click', () => {
    banner.hidden = true;
    if (!validate()) return;
    const c = SN.CAMPUSES.find(x => x.id === document.getElementById('campus').value);
    const a = {
      campusId: c.id, campus: c.name,
      hostel: document.getElementById('hostel').value,
      block: document.getElementById('block').value,
      room: room.value.trim(),
      phone: digits(phone.value),
      note: note.value.trim(),
      when: form.elements.when.value === 'later' ? document.getElementById('slot').value : 'asap'
    };
    SN.address.set(a);
    openProvider(a);
  });

  // Stand-in for the provider's hosted payment page. In production the app
  // redirects there, and only the verified webhook marks the order paid.
  function openProvider(address) {
    payBtn.disabled = true;
    const body = h('div', { class: 'prov__body' });
    const dlg = h('dialog', { class: 'prov', 'aria-labelledby': 'prov-t' },
      h('div', { class: 'prov__bar' }, icon('lock'), h('span', { text: 'Secure payment' }), h('span', { class: 'prov__test', text: 'Sandbox' })),
      body);
    let busy = false;
    const done = ok => {
      if (busy) return;
      if (!ok) {
        dlg.close();
        banner.replaceChildren(icon('alert'), h('div', null, h('strong', { text: 'Payment didn\'t go through.' }), ' Nothing was charged and your bag is still here. Try again when you\'re ready.'));
        banner.hidden = false;
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      busy = true;
      body.replaceChildren(h('div', { class: 'prov__wait' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('p', { class: 'prov__t', id: 'prov-t', text: 'Confirming your payment…' }), h('p', { text: 'Don\'t close this page.' })));
      setTimeout(() => {
        const order = SN.orders.place(k, address);
        location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
      }, 1400);
    };
    body.append(
      h('p', { class: 'prov__merchant', text: `Supernova · ${K.name} order` }),
      h('p', { class: 'prov__amt', id: 'prov-t', text: money(t.total) }),
      h('p', { class: 'prov__note', text: 'This box stands in for the payment provider\'s page while Supernova runs in sandbox mode. No real money moves.' }),
      h('div', { class: 'prov__acts' },
        h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => done(true) }, icon('check'), 'Simulate successful payment'),
        h('button', { class: 'btn btn--block', type: 'button', onclick: () => done(false) }, 'Simulate failed payment'),
        h('button', { class: 'linkish', type: 'button', onclick: () => done(false) }, 'Cancel and go back')));
    dlg.addEventListener('cancel', e => { e.preventDefault(); done(false); });
    dlg.addEventListener('close', () => { payBtn.disabled = false; dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  }
});
