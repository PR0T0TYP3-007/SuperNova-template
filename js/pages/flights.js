// Flights: the student sends a trip request (route, dates, airline
// preference, optional concierge pick-up). The travel team answers with a
// shortlist; nothing is charged until they pick one.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money } = SN.ui;
  const host = document.querySelector('[data-request]');
  const city = SN.ui.city;

  const iso = d => d.toISOString().slice(0, 10);
  const pretty = v => v ? new Date(`${v}T12:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); })();

  // ---- Fields --------------------------------------------------------------
  const err = id => h('p', { class: 'field__err', id: `${id}-err`, 'aria-live': 'polite' });
  const airportSel = (id, value) => h('div', { class: 'select' },
    h('select', { id, 'aria-describedby': `${id}-err` },
      h('optgroup', { label: 'Nigeria' }, SN.AIRPORTS.filter(([c]) => SN.DOMESTIC.includes(c)).map(([c, n]) => h('option', { value: c, text: `${n} (${c})`, selected: c === value }))),
      h('optgroup', { label: 'International' }, SN.AIRPORTS.filter(([c]) => !SN.DOMESTIC.includes(c)).map(([c, n]) => h('option', { value: c, text: `${n} (${c})`, selected: c === value })))),
    icon('chev', 'i select__chev'));

  const fromSel = airportSel('f-from', 'PHC');
  const toSel = airportSel('f-to', 'LOS');
  const swap = h('button', { class: 'swap', type: 'button', 'aria-label': 'Swap from and to' }, icon('refresh'));
  const depart = h('input', { id: 'f-depart', type: 'date', min: tomorrow, 'aria-describedby': 'f-depart-err' });
  const ret = h('input', { id: 'f-return', type: 'date', min: tomorrow, 'aria-describedby': 'f-return-err' });
  const retField = h('div', { class: 'field' }, h('label', { for: 'f-return' }, 'Coming back'), ret, err('f-return'));

  let pax = 1;
  const paxOut = h('output', { class: 'stepper__n', text: '1' });
  const paxMinus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': 'One fewer passenger', disabled: true, onclick: () => setPax(-1) }, icon('minus'));
  const paxPlus = h('button', { class: 'stepper__b', type: 'button', 'aria-label': 'One more passenger', onclick: () => setPax(1) }, icon('plus'));
  function setPax(d) { pax = Math.max(1, Math.min(9, pax + d)); paxOut.textContent = String(pax); paxMinus.disabled = pax === 1; paxPlus.disabled = pax === 9; draw(); }

  const airline = h('div', { class: 'select' },
    h('select', { id: 'f-airline' },
      h('option', { value: 'any', text: 'No preference, just get me a deal' }),
      h('optgroup', { label: 'Nigerian airlines' }, SN.AIRLINES.domestic.map(a => h('option', { value: a, text: a }))),
      h('optgroup', { label: 'International airlines' }, SN.AIRLINES.international.map(a => h('option', { value: a, text: a })))),
    icon('chev', 'i select__chev'));

  const concierge = h('input', { type: 'checkbox', id: 'f-concierge' });
  const note = h('textarea', { id: 'f-note', rows: 2, maxlength: 200, placeholder: 'e.g. Morning flights only, I have two big bags' });
  const addr = SN.addressForm('f-');

  const tripChip = (v, label, checked) => h('label', { class: 'chip chip--radio' }, h('input', { type: 'radio', name: 'trip', value: v, checked }), h('span', { text: label }));
  const tripGroup = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Trip type' }, tripChip('return', 'Return', true), tripChip('oneway', 'One way', false));

  const form = h('form', { class: 'co__form', novalidate: true },
    h('section', { class: 'panel co__sec' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '1' }), h('h3', { class: 'panel__title', text: 'The trip' })),
      tripGroup,
      h('div', { class: 'route-pick' },
        h('div', { class: 'field' }, h('label', { for: 'f-from' }, 'Flying from'), fromSel),
        swap,
        h('div', { class: 'field' }, h('label', { for: 'f-to' }, 'Flying to'), toSel, err('f-to'))),
      h('div', { class: 'form-grid' },
        h('div', { class: 'field' }, h('label', { for: 'f-depart' }, 'Leaving'), depart, err('f-depart')),
        retField)),
    h('section', { class: 'panel co__sec' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '2' }), h('h3', { class: 'panel__title', text: 'Who and how' })),
      h('div', { class: 'form-grid' },
        h('div', { class: 'field' }, h('span', { class: 'field__lbl', text: 'Passengers' }), h('div', { class: 'stepper', role: 'group', 'aria-label': 'Passengers' }, paxMinus, paxOut, paxPlus)),
        h('div', { class: 'field' }, h('label', { for: 'f-airline' }, 'Airline preference'), airline)),
      h('label', { class: 'opt lexpress' }, concierge, h('span', { class: 'opt__box', 'aria-hidden': 'true' }, icon('check')),
        h('span', { class: 'opt__label' }, 'Concierge pick-up to the airport', h('small', { class: 'opt__sub', text: 'A driver collects you from campus.' })),
        h('span', { class: 'opt__price', text: `+${money(SN.CONCIERGE_FEE)}` })),
      h('div', { class: 'form-grid co__note' },
        h('div', { class: 'field field--wide' }, h('label', { for: 'f-note' }, 'Anything else?', h('span', { class: 'field__opt', text: 'Optional' })), note))),
    h('section', { class: 'panel co__sec' },
      h('div', { class: 'co__sechead' }, h('span', { class: 'co__n', text: '3' }), h('div', null, h('h3', { class: 'panel__title', text: 'Where can we reach you?' }), h('p', { class: 'co__sub', text: 'We send your shortlist here, and pick you up from here if you add concierge.' }))),
      addr.el));

  // ---- Summary ---------------------------------------------------------------
  const sendBtn = h('button', { class: 'btn btn--loud btn--block', type: 'button' }, 'Get my flight options', icon('arrow'));
  const sumRoute = h('div', { class: 'froute' });
  const sumList = h('ul', { class: 'sumlist' });
  const summary = h('aside', { class: 'panel summary co__summary', 'aria-label': 'Trip summary' },
    h('h3', { class: 'panel__title', text: 'Your trip' }), sumRoute, sumList,
    h('dl', { class: 'sums' }, h('div', { class: 'sums__total' }, h('dt', { text: 'Pay now' }), h('dd', { text: money(0) }))),
    h('p', { class: 'summary__eta' }, icon('clock'), 'Your shortlist lands within a few hours.'),
    sendBtn,
    h('p', { class: 'summary__safe' }, icon('shield'), 'You only pay once you pick a flight.'));

  const val = id => document.getElementById(id).value;
  const isReturn = () => form.querySelector('input[name=trip]:checked').value === 'return';

  function draw() {
    const f = val('f-from'), t = val('f-to');
    retField.hidden = !isReturn();
    sumRoute.replaceChildren(
      h('span', null, h('b', { text: f }), h('small', { text: city(f) })),
      icon('plane'),
      h('span', null, h('b', { text: t }), h('small', { text: city(t) })));
    sumList.replaceChildren(
      h('li', null, h('span', { text: 'Trip' }), h('span', { text: isReturn() ? 'Return' : 'One way' })),
      h('li', null, h('span', { text: 'Leaving' }), h('span', { text: pretty(depart.value) || 'Pick a date' })),
      isReturn() ? h('li', null, h('span', { text: 'Coming back' }), h('span', { text: pretty(ret.value) || 'Pick a date' })) : '',
      h('li', null, h('span', { text: 'Passengers' }), h('span', { text: String(pax) })),
      h('li', null, h('span', { text: 'Airline' }), h('span', { text: val('f-airline') === 'any' ? 'Any' : val('f-airline') })),
      concierge.checked ? h('li', null, h('span', { text: 'Concierge pick-up' }), h('span', { text: money(SN.CONCIERGE_FEE) })) : '');
    // The boarding pass in the hero follows along.
    document.querySelector('[data-pass-from-code]').textContent = f;
    document.querySelector('[data-pass-from]').textContent = city(f);
    document.querySelector('[data-pass-to-code]').textContent = t;
    document.querySelector('[data-pass-to]').textContent = city(t);
    document.querySelector('[data-pass-date]').textContent = pretty(depart.value) || 'Pick a date';
  }

  form.addEventListener('change', e => {
    if (e.target === depart) { ret.min = depart.value || tomorrow; if (ret.value && ret.value < depart.value) ret.value = ''; }
    // Clear a field's error as soon as it's fixed.
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value && document.getElementById(`${e.target.id}-err`)) {
      if (e.target.id !== 'f-to' || val('f-to') !== val('f-from')) setErr(e.target.id, '');
    }
    draw();
  });
  swap.addEventListener('click', () => {
    const a = document.getElementById('f-from'), b = document.getElementById('f-to');
    [a.value, b.value] = [b.value, a.value];
    draw();
  });

  host.append(h('div', { class: 'co' }, form, summary),
    h('div', { class: 'paybar' },
      h('span', { class: 'paybar__t' }, h('small', { text: 'Pay nothing now' }), 'Your trip'),
      h('button', { class: 'btn btn--loud', type: 'button', onclick: () => sendBtn.click() }, 'Get options')));
  SN.ui.barFollows(host.querySelector('.paybar'), host);
  draw();

  // ---- Validate + send -------------------------------------------------------
  const setErr = (id, msg) => {
    document.getElementById(id).setAttribute('aria-invalid', String(!!msg));
    document.getElementById(`${id}-err`).textContent = msg || '';
    return !msg;
  };
  sendBtn.addEventListener('click', () => {
    const checks = [
      ['f-to', val('f-to') === val('f-from') ? 'Pick a different destination.' : ''],
      ['f-depart', depart.value ? '' : 'When are you leaving?'],
      ['f-return', !isReturn() || ret.value ? '' : 'When are you coming back?']
    ];
    const bad = checks.filter(([id, msg]) => !setErr(id, msg));
    if (bad.length) { document.getElementById(bad[0][0]).focus(); return; }
    if (!addr.validate()) return;
    sendBtn.disabled = true;
    const order = SN.orders.requestFlight({
      trip: isReturn() ? 'return' : 'oneway',
      from: val('f-from'), to: val('f-to'),
      depart: pretty(depart.value), ret: pretty(ret.value),
      pax, airline: val('f-airline'), concierge: concierge.checked,
      note: note.value.trim(), address: addr.value()
    });
    location.href = `order.html?id=${encodeURIComponent(order.id)}&new=1`;
  });
});
