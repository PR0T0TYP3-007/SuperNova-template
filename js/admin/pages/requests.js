// Admin requests: the human work behind market runs, flights and laundry.
// Sending a quote or shortlist here is what the student sees on their order.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon, money, param } = SN.ui;
  const main = A.shell({ page: 'requests', title: 'Requests', sub: 'Quotes, flight shortlists and laundry pickups waiting on the team' });
  if (!main) return;

  let tab = ['market', 'flight', 'laundry'].includes(param('tab')) ? param('tab') : 'market';
  const tabsEl = h('div', { class: 'adm-tabs', role: 'tablist' });
  const body = h('div', { class: 'adm-grid' });
  const note = SN.settings.get().autopilot
    ? h('div', { class: 'adm-note' }, icon('alert'), h('span', null, h('b', { text: 'Autopilot is on. ' }), 'The sandbox also answers customer requests by itself after a short wait. Turn it off in ', h('a', { href: 'settings.html', text: 'Settings' }), ' to handle every request from here.'))
    : null;
  main.append(...[note, tabsEl, body].filter(Boolean));

  const pending = {
    market: () => A.all().filter(o => A.kind(o) === 'market' && !o.quote && !o.paidAt && !o.status),
    flight: () => A.all().filter(o => A.kind(o) === 'flight' && !o.options && !o.paidAt && !o.status),
    laundry: () => A.all().filter(o => A.kind(o) === 'laundry' && A.live(o))
  };
  const meta = o => h('p', { class: 'adm-card__meta' }, h('span', { text: o.contact?.name || '—' }), h('span', { text: `${o.address?.hostel || ''}, ${o.address?.campus || ''}` }), h('span', { text: A.timeLabel(o.createdAt) }));
  const empty = text => h('div', { class: 'adm-panel adm-empty' }, icon('check'), h('p', { text }));

  function draw() {
    const labels = { market: 'Market quotes', flight: 'Flight shortlists', laundry: 'Laundry pickups' };
    tabsEl.replaceChildren(...Object.keys(labels).map(k => {
      const n = pending[k]().length;
      return h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === k), onclick: () => { tab = k; history.replaceState(null, '', `?tab=${k}`); draw(); } }, labels[k], n ? h('b', { text: String(n) }) : null);
    }));
    const list = pending[tab]();
    body.replaceChildren(list.length ? h('div', { class: 'adm-cards' }, list.map(o => ({ market: marketCard, flight: flightCard, laundry: laundryCard })[tab](o)))
      : empty({ market: 'No market lists waiting for a quote.', flight: 'No trips waiting for a shortlist.', laundry: 'No laundry in progress.' }[tab]));
  }

  // ---- Market: price each line, send the quote --------------------------------
  function marketCard(o) {
    const inputs = o.items.map(l => {
      const s = SN.STAPLES.find(([n]) => n.toLowerCase() === l.name.toLowerCase());
      return h('input', { class: 'adm-input adm-input--sm', type: 'number', min: 0, step: 50, value: Math.round(((s ? s[2] : 2500) * l.qty) / 50) * 50, 'aria-label': `Price for ${l.name}` });
    });
    const total = h('b');
    const sync = () => { const items = inputs.reduce((s, i) => s + (Number(i.value) || 0), 0); total.textContent = money(items + o.fees.service + o.fees.delivery); };
    inputs.forEach(i => i.addEventListener('input', sync)); sync();
    return h('article', { class: 'adm-card', 'data-kitchen': 'market' },
      h('div', { class: 'adm-card__head' }, h('h3', { text: `${o.items.length} items · ${o.id}` }), o.real ? h('span', { class: 'spill spill--action', text: 'This browser' }) : null),
      meta(o),
      h('p', { class: 'adm-card__meta' }, h('span', { text: `Delivery: ${o.when || '—'}` }), o.budget ? h('span', { text: `Budget: ${money(o.budget)}` }) : null),
      o.note ? h('p', { class: 'adm-card__note', text: o.note }) : null,
      h('ul', { class: 'adm-lines' }, o.items.map((l, i) => h('li', null, h('span', null, `${l.name} `, h('small', { text: `${l.qty} ${l.unit}` })), inputs[i]))),
      h('ul', { class: 'adm-lines' }, h('li', null, h('span', { text: 'Service fee' }), h('span', { text: money(o.fees.service) })), h('li', null, h('span', { text: 'Delivery' }), h('span', { text: money(o.fees.delivery) }))),
      h('div', { class: 'adm-sum' }, h('span', null, 'Quote total ', o.budget ? h('small', { text: `budget ${money(o.budget)}` }) : null), total),
      h('div', { class: 'adm-card__acts' }, h('button', { class: 'btn btn--loud', type: 'button', onclick: () => {
        const lines = o.items.map((l, i) => ({ ...l, price: Number(inputs[i].value) || 0 }));
        A.update(o.id, x => ({ ...x, quote: SN.orders.buildQuote(x, lines), stage: 1, stageTimes: { ...(x.stageTimes || {}), 1: Date.now() } }), 'Sent market quote', `${o.id} · ${total.textContent}`);
        SN.ui.toast('Quote sent. The customer can now pay.'); draw();
      } }, icon('arrow'), 'Send quote')));
  }

  // ---- Flights: three options, send the shortlist --------------------------------
  function flightCard(o) {
    const domestic = SN.DOMESTIC.includes(o.from) && SN.DOMESTIC.includes(o.to);
    const pool = SN.AIRLINES[domestic ? 'domestic' : 'international'];
    const base = domestic ? 90000 : 820000;
    const row = i => {
      const airline = h('select', { 'aria-label': 'Airline' }, pool.map((a, j) => h('option', { value: a, text: a, selected: o.airline !== 'any' ? a === o.airline : j === i })));
      const dep = h('input', { class: 'adm-input', type: 'time', value: ['07:30', '12:15', '17:45'][i], 'aria-label': 'Departs' });
      const dur = h('input', { class: 'adm-input', type: 'number', min: 30, value: domestic ? 65 + i * 10 : 420 + i * 90, 'aria-label': 'Duration in minutes' });
      const stops = h('select', { 'aria-label': 'Stops' }, [0, 1, 2].map(n => h('option', { value: n, text: n ? `${n} stop` : 'Direct', selected: n === (domestic ? 0 : i ? 1 : 0) })));
      const fare = h('input', { class: 'adm-input', type: 'number', min: 0, step: 500, value: (base + i * base * 0.12) * (o.trip === 'return' ? 2 : 1) * o.pax, 'aria-label': 'Our fare' });
      const usual = h('input', { class: 'adm-input', type: 'number', min: 0, step: 500, value: Math.round((base + i * base * 0.12) * 1.25 * (o.trip === 'return' ? 2 : 1) * o.pax), 'aria-label': 'Usual price' });
      return { el: h('div', { class: 'adm-opt-row' }, airline, dep, dur, stops, fare, usual), read: () => ({ airline: airline.value, depart: dep.value, duration: Number(dur.value), stops: Number(stops.value), fare: Number(fare.value), usual: Number(usual.value) }) };
    };
    const rows = [0, 1, 2].map(row);
    return h('article', { class: 'adm-card', 'data-kitchen': 'flight' },
      h('div', { class: 'adm-card__head' }, h('h3', { text: `${SN.ui.city(o.from)} → ${SN.ui.city(o.to)}` }), h('span', { class: 'tag tag--flight', text: o.trip === 'return' ? 'Return' : 'One way' }), o.real ? h('span', { class: 'spill spill--action', text: 'This browser' }) : null),
      meta(o),
      h('p', { class: 'adm-card__meta' }, h('span', { text: `${o.depart}${o.ret ? ' – ' + o.ret : ''}` }), h('span', { text: `${o.pax} passenger${o.pax > 1 ? 's' : ''}` }), h('span', { text: `Airline: ${o.airline === 'any' ? 'any' : o.airline}` }), o.concierge ? h('span', { text: 'Wants concierge pick-up' }) : null),
      o.note ? h('p', { class: 'adm-card__note', text: o.note }) : null,
      h('div', { class: 'adm-opt-row adm-opt-head' }, ['Airline', 'Departs', 'Minutes', 'Stops', 'Our fare ₦', 'Usual ₦'].map(t => h('span', { text: t }))),
      rows.map(r => r.el),
      h('div', { class: 'adm-card__acts' }, h('button', { class: 'btn btn--loud', type: 'button', onclick: () => {
        const options = SN.orders.labelOptions(rows.map(r => r.read()).filter(x => x.fare > 0));
        if (!options.length) return SN.ui.toast('Add at least one fare first.');
        A.update(o.id, x => ({ ...x, options, stage: 1, stageTimes: { ...(x.stageTimes || {}), 1: Date.now() } }), 'Sent flight shortlist', `${o.id} · ${options.length} options from ${money(options[0].fare)}`);
        SN.ui.toast('Shortlist sent. The customer can now book.'); draw();
      } }, icon('plane'), 'Send shortlist')));
  }

  // ---- Laundry: count at pickup, then move through the steps ---------------------------
  function laundryCard(o) {
    const p = SN.orders.progress(o);
    const flow = SN.orders.flow(o);
    const qtys = o.items.map(i => h('input', { class: 'adm-input adm-input--sm', type: 'number', min: 0, value: i.qty, 'aria-label': `Counted ${i.name}`, disabled: p.index > 0 }));
    const next = flow[p.index + 1];
    return h('article', { class: 'adm-card', 'data-kitchen': 'laundry' },
      h('div', { class: 'adm-card__head' }, h('h3', { text: o.id }), A.pill(o), o.real ? h('span', { class: 'spill spill--action', text: 'This browser' }) : null),
      meta(o),
      h('p', { class: 'adm-card__meta' }, h('span', { text: `Pickup: ${o.slot}` }), o.express ? h('span', { text: 'Express' }) : null),
      h('ul', { class: 'adm-lines' }, o.items.map((it, i) => h('li', null, h('span', null, `${it.name} `, h('small', { text: `${money(it.unit)} each` })), qtys[i]))),
      h('div', { class: 'adm-sum' }, h('span', { text: p.index > 0 ? 'Counted total' : 'Estimate' }), h('b', { text: money(o.total) })),
      next ? h('div', { class: 'adm-card__acts' }, h('button', { class: 'btn btn--primary', type: 'button', onclick: () => {
        if (p.index === 0) {
          const items = o.items.map((it, i) => ({ ...it, qty: Number(qtys[i].value) || 0, total: it.unit * (Number(qtys[i].value) || 0) })).filter(it => it.qty);
          const subtotal = items.reduce((s, it) => s + it.total, 0);
          A.update(o.id, x => ({ ...x, items, subtotal, total: subtotal + x.fee }), 'Counted laundry', `${o.id} · ${money(subtotal + o.fee)}`);
        }
        A.setStage(o.id, p.index + 1); draw();
      } }, p.index === 0 ? 'Picked up and counted' : `Mark "${next.label}"`, icon('arrow'))) : null);
  }

  draw();
});
