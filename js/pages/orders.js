// Orders: current and previous orders of every kind.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, param, empty, when, toast } = SN.ui;
  const host = document.querySelector('[data-orders]');
  SN.orders.seedDemo();

  let tab = param('tab') === 'past' ? 'past' : 'current';
  let timer;
  // Only the first paint animates in; the 5s refresh must not replay it.
  let first = true;

  const pill = (o, p) => {
    if (p.final === 'refunded') return h('span', { class: 'spill spill--refund', text: 'Refunded' });
    if (p.final === 'cancelled') return h('span', { class: 'spill spill--off', text: 'Cancelled' });
    if (p.done) return h('span', { class: 'spill spill--done' }, icon('check'), 'Delivered');
    if (p.awaitingPayment) return h('span', { class: 'spill spill--action' }, icon('alert'), SN.orders.kind(o) === 'flight' ? 'Options ready' : 'Quote ready');
    return h('span', { class: 'spill spill--live' }, h('span', { class: 'spill__pulse' }), p.step.label);
  };

  const card = o => {
    const kind = SN.orders.kind(o);
    const p = SN.orders.progress(o);
    const live = !p.done && p.index >= 0;
    const href = `order.html?id=${encodeURIComponent(o.id)}`;
    const quote = SN.orders.quote(o);
    const total = kind === 'market' ? (quote ? money(quote.total) : 'Quote pending')
      : kind === 'flight' ? (o.total ? money(o.total) : p.awaitingPayment ? 'Pick a flight' : 'Deals pending')
      : money(o.total);
    const flowLen = SN.orders.flow(o).length;

    const again = kind === 'food'
      ? h('button', { class: 'btn btn--sm', type: 'button', onclick: () => {
          const n = SN.orders.reorder(o.id);
          if (n) { SN.ui.bump(); toast(`${n} item${n === 1 ? '' : 's'} added to your ${SN.KITCHENS[o.kitchen].name} bag`, { href: `cart.html?k=${o.kitchen}`, label: 'View bag' }); }
          else toast('Those items aren\'t available right now');
        } }, icon('refresh'), 'Reorder')
      : kind === 'market' ? h('a', { class: 'btn btn--sm', href: `market.html?again=${encodeURIComponent(o.id)}#list` }, icon('refresh'), 'Send again')
      : kind === 'flight' ? h('a', { class: 'btn btn--sm', href: 'flights.html#request' }, icon('plane'), 'New trip')
      : h('a', { class: 'btn btn--sm', href: 'laundry.html#book' }, icon('refresh'), 'Book again');

    return h('article', { class: `ocard ${live ? 'ocard--live' : ''}`, 'data-kitchen': SN.ui.accentOf(o), 'data-reveal': first },
      h('div', { class: 'ocard__thumbs', 'aria-hidden': 'true' }, SN.ui.orderThumbs(o).map(src => h('img', { src, alt: '', width: 64, height: 64, loading: 'lazy' }))),
      h('div', { class: 'ocard__main' },
        h('div', { class: 'ocard__top' }, SN.ui.orderTag(o), pill(o, p), o.issue ? h('span', { class: 'spill spill--off', text: 'Problem in review' }) : null),
        h('h2', { class: 'ocard__title' }, h('a', { href, text: SN.ui.orderTitle(o) })),
        h('p', { class: 'ocard__meta' }, h('span', { text: o.id }), h('span', { text: when(o.createdAt) }), h('span', { text: kind === 'flight' ? (o.ret ? `${o.depart} – ${o.ret}` : o.depart) : `${o.address.hostel}, Block ${o.address.block}` })),
        live ? h('div', { class: 'ocard__bar', style: `--p:${p.index / (flowLen - 1)}`, role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': 0, 'aria-valuemax': flowLen - 1, 'aria-valuenow': p.index }, h('span')) : null),
      h('div', { class: 'ocard__side' },
        h('p', { class: 'ocard__total', text: total }),
        live
          ? h('a', { class: `btn ${p.awaitingPayment ? 'btn--loud' : 'btn--primary'} btn--sm`, href }, p.awaitingPayment ? (kind === 'flight' ? 'See options' : 'See quote') : 'Track', icon('arrow'))
          : h('div', { class: 'ocard__acts' }, again, h('a', { class: 'linkish', href }, 'Receipt'))));
  };

  function render() {
    const all = SN.orders.all();
    const isLive = o => { const p = SN.orders.progress(o); return !p.done && p.index >= 0; };
    const current = all.filter(isLive);
    const past = all.filter(o => !isLive(o));
    const list = tab === 'current' ? current : past;
    const spent = past.filter(o => o.status !== 'refunded' && o.total).reduce((s, o) => s + o.total, 0);

    const tabBtn = (id, label, n) => h('button', {
      class: 'otab', role: 'tab', type: 'button', 'aria-selected': String(tab === id), tabindex: tab === id ? '0' : '-1',
      onclick: () => { tab = id; history.replaceState(null, '', id === 'past' ? '?tab=past' : location.pathname); render(); }
    }, label, h('span', { class: 'otab__n', text: String(n) }));

    host.replaceChildren(
      h('div', { class: 'page-head page-head--row' },
        h('div', null,
          h('p', { class: 'eyebrow' }, icon('receipt'), 'Orders'),
          h('h1', { class: 'h1' }, 'Your ', h('em', { text: 'orders' }))),
        h('dl', { class: 'ostats' },
          h('div', null, h('dt', { text: 'Orders' }), h('dd', { text: String(all.length) })),
          h('div', null, h('dt', { text: 'On the way' }), h('dd', { text: String(current.length) })),
          h('div', null, h('dt', { text: 'Spent' }), h('dd', { text: money(spent) })))),
      h('div', { class: 'otabs', role: 'tablist', 'aria-label': 'Order lists' }, tabBtn('current', 'In progress', current.length), tabBtn('past', 'Past orders', past.length)),
      h('div', { class: 'olist', role: 'tabpanel' },
        list.length ? list.map(card)
          : tab === 'current'
            ? empty({ title: 'Nothing on the way', body: 'Order food, send a market list, book a pickup or plan a trip, and you can follow it here.', cta: 'Order food', href: 'food.html', art: 'bike' })
            : empty({ title: 'No past orders yet', body: 'Finished orders land here, ready to repeat in one tap.', cta: 'Order food', href: 'food.html', art: 'receipt' })));
    SN.ui.reveal(host);
    first = false;

    clearTimeout(timer);
    if (current.length) timer = setTimeout(render, 5000);
  }

  render();
  SN.onChange(render);
});
