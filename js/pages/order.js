// Order: confirmation and live tracking for one order of any kind (food,
// market run, dry cleaning).
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, when, toast } = SN.ui;
  const host = document.querySelector('[data-order]');
  const id = param('id');
  const isNew = param('new') === '1';

  if (!SN.orders.get(id)) {
    host.append(empty({ title: 'We can\'t find that order', body: 'The link might be incomplete, or it belongs to another account.', cta: 'See your orders', href: 'orders.html', art: 'receipt' }));
    return;
  }

  const PLACED = { food: 'Order placed. Thank you!', market: 'List sent. Quote coming up!', laundry: 'Pickup booked. Nice one!', flight: 'Request sent. Deals incoming!' };
  let timer;
  // Confetti only on the first paint; the 3s refresh must not replay it.
  let first = true;

  function render() {
    const o = SN.orders.get(id);
    const kind = SN.orders.kind(o);
    const flow = SN.orders.flow(o);
    const p = SN.orders.progress(o);
    const quote = SN.orders.quote(o);
    const options = SN.orders.flightOptions(o);
    document.body.dataset.kitchen = SN.ui.accentOf(o);
    document.title = `${o.id} — Supernova`;

    const finalLabel = { refunded: 'Refunded', cancelled: 'Cancelled', delivered: flow[flow.length - 1].label }[p.final];
    const heading = finalLabel || p.step.label;
    const lastAt = flow[flow.length - 1].at;
    const base = kind === 'market' || kind === 'flight' ? o.paidAt : o.createdAt;
    const remaining = p.done || !base ? 0 : Math.max(1, Math.ceil((lastAt - (Date.now() - base) / 1000) / 60));
    const sub = p.final === 'refunded' ? (o.refundNote || 'Your money is on its way back.')
      : p.final === 'cancelled' ? 'This one was cancelled before anything started.'
      : p.done && kind === 'flight' ? 'You\'re booked. Your e-ticket is in your email. Safe travels!'
      : p.done ? `Delivered. Enjoy!`
      : p.awaitingPayment && kind === 'flight' ? 'Your shortlist is here. Pick the one you like and pay to book it.'
      : p.awaitingPayment ? 'Your quote is ready. Have a look and pay to start the shopping.'
      : kind === 'flight' && !o.paidAt ? 'Our travel team is hunting for deals. You\'ll hear back within a few hours.'
      : kind === 'market' && !o.paidAt ? 'Our partners are pricing your list. Hang tight.'
      : `${p.step.note}. About ${remaining} min to go.`;
    const pct = p.index < 0 ? 0 : p.index / (flow.length - 1);

    const status = h('section', { class: 'tstatus', 'aria-live': 'polite' },
      h('div', { class: 'tstatus__sky', 'aria-hidden': 'true' }),
      isNew && !p.done ? h('div', { class: 'tstatus__yay' },
        first ? h('span', { class: 'confetti', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5, 6].map(() => icon('star', ''))) : null,
        h('p', { class: first ? 'tstatus__placed is-first' : 'tstatus__placed' }, icon('check'), PLACED[kind])) : null,
      h('p', { class: 'tstatus__kicker' }, h('span', { text: o.id }), SN.ui.orderTag(o)),
      h('h1', { class: 'tstatus__title' }, heading, p.done || p.index < 0 || p.awaitingPayment ? null : h('em', { text: '…' })),
      h('p', { class: 'tstatus__sub', text: sub }),
      p.awaitingPayment && kind === 'market' ? h('button', { class: 'btn btn--gold tstatus__cta', type: 'button', onclick: () => payQuote(o, quote) }, icon('lock'), `Pay ${money(quote.total)}`) : null,
      p.awaitingPayment && kind === 'flight' ? shortlist(o, options) : null,
      p.index >= 0 ? h('div', { class: 'route', style: `--p:${pct}`, 'aria-hidden': 'true' },
        h('span', { class: 'route__node' }, icon({ food: 'flame', market: 'basket', laundry: 'shirt', flight: 'plane' }[kind]), h('small', { text: SN.ui.orderFrom(o) })),
        h('span', { class: 'route__line' }, h('span', { class: 'route__fill' }), h('span', { class: 'route__bike' }, icon(kind === 'flight' ? 'plane' : 'bike'))),
        h('span', { class: 'route__node route__node--end' }, icon('pin'), h('small', { text: kind === 'flight' ? SN.ui.city(o.to) : o.address.hostel }))) : null,
      h('ol', { class: 'ttl' }, flow.map((s, i) => {
        const state = p.index < 0 ? (i === 0 ? 'done' : 'off') : i < p.index || (p.done && i === p.index) ? 'done' : i === p.index ? 'now' : 'todo';
        const t = SN.orders.stepTime(o, i);
        const at = t ? new Date(t).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }) : '';
        return h('li', { class: `ttl__step is-${state}` },
          h('span', { class: 'ttl__dot' }, state === 'done' ? icon('check') : null),
          h('span', { class: 'ttl__label', text: s.label }),
          h('span', { class: 'ttl__time', text: state === 'done' || state === 'now' ? at : '' }));
      })));

    host.replaceChildren(h('div', { class: 'track' }, status, details(o, kind, p, quote, options)));
    first = false;

    clearTimeout(timer);
    if (!p.done && p.index >= 0 && !p.awaitingPayment) timer = setTimeout(render, 3000);
  }

  // ---- Flight shortlist -------------------------------------------------------
  const hm = mins => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
  function shortlist(o, options) {
    const extra = o.concierge ? SN.CONCIERGE_FEE : 0;
    return h('div', { class: 'fopts' },
      h('p', { class: 'fopts__k', text: `Picked for you · ${o.pax} passenger${o.pax === 1 ? '' : 's'}${o.trip === 'return' ? ' · return' : ''}` }),
      options.map((op, i) => h('article', { class: 'fopt' },
        h('div', { class: 'fopt__main' },
          h('span', { class: 'fopt__tag', text: op.tag }),
          h('p', { class: 'fopt__airline', text: op.airline }),
          h('p', { class: 'fopt__meta', text: `Departs ${op.depart} · ${hm(op.duration)} · ${op.stops ? op.stops + ' stop' : 'Direct'}` })),
        h('div', { class: 'fopt__price' },
          h('s', { text: money(op.usual) }),
          h('strong', { text: money(op.fare) }),
          h('button', { class: 'btn btn--gold btn--sm', type: 'button', onclick: () => payFlight(o, i, op.fare + extra, op.airline) }, 'Book this')))),
      o.concierge ? h('p', { class: 'fopts__note' }, icon('bike'), `Concierge pick-up adds ${money(SN.CONCIERGE_FEE)}.`) : null);
  }

  // ---- Details panel, per kind ----------------------------------------------
  function details(o, kind, p, quote, options) {
    const a = o.address;
    const row = (thumb, q, name, sub, price) => h('li', null,
      thumb ? h('img', { src: thumb, alt: '', width: 48, height: 48 }) : h('span', { class: 'mini__dot', 'aria-hidden': 'true' }),
      h('span', { class: 'mini__q', text: q }),
      h('span', { class: 'mini__n' }, name, sub ? h('small', { text: sub }) : null),
      h('span', { class: 'mini__p', text: price }));

    let items, sums;
    if (kind === 'food') {
      items = o.items.map(i => row(img(i.img), `${i.qty}×`, i.name, i.opts && i.opts.join(' · '), money(i.total)));
      sums = [['Food', money(o.subtotal)], ['Delivery', money(o.fee)], [p.final === 'refunded' ? 'Refunded' : 'Paid', money(o.total), true]];
    } else if (kind === 'market') {
      const lines = quote ? quote.lines : o.items;
      items = lines.map(l => row(null, `${l.qty} ${l.unit}`, l.name, null, quote ? money(l.price) : '…'));
      sums = quote
        ? [['Items', money(quote.items)], ['Service fee', money(quote.service)], ['Delivery', money(quote.delivery)], [o.paidAt ? 'Paid' : 'To pay', money(quote.total), true]]
        : [['Items', 'Being priced'], ['Service fee', money(o.fees.service)], ['Delivery', money(o.fees.delivery)], ['Total', 'In your quote', true]];
    } else if (kind === 'flight') {
      const pick = options && o.choice != null ? options[o.choice] : null;
      items = [
        row(null, 'Route', `${SN.ui.city(o.from)} to ${SN.ui.city(o.to)}`, `${o.from} → ${o.to}`, ''),
        row(null, 'Depart', o.depart, null, ''),
        o.ret ? row(null, 'Return', o.ret, null, '') : null,
        row(null, 'People', `${o.pax} passenger${o.pax === 1 ? '' : 's'}`, null, ''),
        row(null, 'Airline', pick ? pick.airline : (o.airline === 'any' ? 'No preference' : o.airline), pick ? `Departs ${pick.depart}` : null, ''),
        row(null, 'Pick-up', o.concierge ? 'Concierge to the airport' : 'Not needed', null, '')
      ];
      sums = pick
        ? [['Fare', money(pick.fare)], o.concierge ? ['Concierge pick-up', money(SN.CONCIERGE_FEE)] : null, ['You saved', money(pick.usual - pick.fare)], ['Paid', money(o.total), true]].filter(Boolean)
        : [['Fares', options ? 'Pick one from your shortlist' : 'Coming within a few hours'], ['Total', 'Pay nothing yet', true]];
    } else {
      items = o.items.map(i => row(null, `${i.qty}×`, i.name, null, money(i.total)));
      sums = [['Items', money(o.subtotal)], [o.express ? 'Pickup + express' : 'Pickup & delivery', money(o.fee)], [p.done ? 'Paid' : 'Estimate', money(o.total), true]];
    }

    const extra = kind === 'market'
      ? [o.when && `Delivery: ${o.when}`, o.budget && `Budget: ${money(o.budget)}`]
      : kind === 'laundry' ? [`Pickup: ${o.slot}`, o.express && 'Express, back in 24 hours']
      : kind === 'flight' ? [o.concierge ? 'We pick you up from here' : 'We\'ll reach you here']
      : [a.when && a.when !== 'asap' && `Scheduled for ${a.when}`];

    const again = kind === 'food'
      ? h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => reorder(o) }, icon('refresh'), 'Order this again')
      : kind === 'market' ? h('a', { class: 'btn btn--primary btn--block', href: `market.html?again=${encodeURIComponent(o.id)}#list` }, icon('refresh'), 'Send this list again')
      : kind === 'flight' ? h('a', { class: 'btn btn--primary btn--block', href: 'flights.html#request' }, icon('plane'), 'Plan another trip')
      : h('a', { class: 'btn btn--primary btn--block', href: 'laundry.html#book' }, icon('refresh'), 'Book another pickup');

    return h('aside', { class: 'panel tdetail' },
      o.issue ? h('div', { class: 'alert alert--info' }, icon('alert'), h('div', null, h('strong', { text: 'Problem reported. ' }), `We're looking into your "${o.issue.type}" report and will email you within a few hours.`)) : null,
      h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title', text: 'Details' }), h('span', { class: 'muted', text: when(o.createdAt) })),
      h('div', { class: 'tdetail__addr' }, icon('pin'),
        h('div', null, h('strong', { text: SN.ui.addrLine(a) }), h('span', { text: a.campus }),
          extra.filter(Boolean).map(t => h('span', { text: t })))),
      h('ul', { class: 'mini' }, items),
      o.note ? h('p', { class: 'tdetail__note' }, h('strong', { text: 'Your note: ' }), o.note) : null,
      h('dl', { class: 'sums' }, sums.map(([dt, dd, total]) => h('div', { class: total ? 'sums__total' : null }, h('dt', { text: dt }), h('dd', { text: dd })))),
      kind === 'laundry' && !p.done ? h('p', { class: 'summary__safe' }, icon('shield'), 'You pay after pickup, once we\'ve counted everything.') : null,
      h('div', { class: 'tdetail__acts' },
        p.awaitingPayment && kind === 'market' ? h('button', { class: 'btn btn--loud btn--block', type: 'button', onclick: () => payQuote(o, quote) }, icon('lock'), `Approve and pay ${money(quote.total)}`) : null,
        p.done || p.index < 0 ? again : null,
        o.issue || p.index < 0 ? null : h('button', { class: 'btn btn--block', type: 'button', onclick: () => report(o, kind) }, icon('alert'), 'Report a problem'),
        h('a', { class: 'linkish', href: 'orders.html' }, 'All your orders')));
  }

  function payQuote(o, quote) {
    SN.ui.pay({
      amount: quote.total,
      label: 'Supernova · Market run',
      onSuccess: () => { SN.orders.approveQuote(o.id); toast('Paid. Your list is being shopped.'); render(); },
      onFail: () => toast('Payment didn\'t go through. Nothing was charged.')
    });
  }

  function payFlight(o, index, amount, airline) {
    SN.ui.pay({
      amount,
      label: `Supernova · ${airline} flight`,
      onSuccess: () => { SN.orders.chooseFlight(o.id, index); toast('Paid. We\'re booking your seat.'); render(); },
      onFail: () => toast('Payment didn\'t go through. Nothing was charged.')
    });
  }

  function reorder(o) {
    const n = SN.orders.reorder(o.id);
    if (n) { SN.ui.bump(); toast(`${n} item${n === 1 ? '' : 's'} added to your ${SN.KITCHENS[o.kitchen].name} bag`, { href: `cart.html?k=${o.kitchen}`, label: 'View bag' }); }
    else toast('Those items aren\'t available right now');
  }

  function report(o, kind) {
    const types = {
      food: ['Missing item', 'Wrong order', 'Late order', 'Something else'],
      market: ['Missing item', 'Poor quality', 'Wrong quantity', 'Something else'],
      laundry: ['Item missing', 'Damaged item', 'Not clean', 'Something else'],
      flight: ['Wrong details on ticket', 'Price changed', 'Pick-up issue', 'Something else']
    }[kind];
    const note = h('textarea', { rows: 3, maxlength: 400, placeholder: 'Tell us what happened', 'aria-label': 'Details' });
    const form = h('form', { class: 'report', method: 'dialog' },
      h('h2', { class: 'h3', id: 'rep-t', text: 'What went wrong?' }),
      h('p', { class: 'muted', text: `Order ${o.id}` }),
      h('fieldset', { class: 'rcards rcards--col' }, h('legend', { class: 'sr-only', text: 'Problem type' }),
        types.map((t, i) => h('label', { class: 'rcard' }, h('input', { type: 'radio', name: 'type', value: t, checked: i === 0 }), h('span', { class: 'rcard__dot', 'aria-hidden': 'true' }), h('span', { class: 'rcard__t', text: t })))),
      h('label', { class: 'field' }, h('span', { text: 'Details' }), note),
      h('div', { class: 'report__acts' },
        h('button', { class: 'btn btn--quiet', type: 'button', onclick: () => dlg.close() }, 'Cancel'),
        h('button', { class: 'btn btn--loud', type: 'submit' }, 'Send report')));
    const dlg = h('dialog', { class: 'sheet sheet--plain', 'aria-labelledby': 'rep-t' },
      h('button', { class: 'sheet__x', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('x')), form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      SN.orders.report(o.id, { type: form.elements.type.value, note: note.value.trim() });
      dlg.close();
      toast('Thanks for telling us. We\'re on it.');
      render();
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  }

  render();
  if (isNew) history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
});
