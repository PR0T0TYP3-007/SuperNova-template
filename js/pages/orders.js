// Orders: current and previous orders.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag, when, toast } = SN.ui;
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
    return h('span', { class: 'spill spill--live' }, h('span', { class: 'spill__pulse' }), p.step.label);
  };

  const card = o => {
    const p = SN.orders.progress(o);
    const live = !p.done && p.index >= 0;
    const summary = o.items.map(i => `${i.qty > 1 ? i.qty + '× ' : ''}${i.name}`).join(', ');
    return h('article', { class: `ocard ${live ? 'ocard--live' : ''}`, 'data-kitchen': o.kitchen, 'data-reveal': first },
      h('div', { class: 'ocard__thumbs', 'aria-hidden': 'true' }, o.items.slice(0, 3).map(i => h('img', { src: img(i.img), alt: '', width: 64, height: 64, loading: 'lazy' }))),
      h('div', { class: 'ocard__main' },
        h('div', { class: 'ocard__top' }, tag(o.kitchen), pill(o, p), o.issue ? h('span', { class: 'spill spill--off', text: 'Problem in review' }) : null),
        h('h2', { class: 'ocard__title' }, h('a', { href: `order.html?id=${encodeURIComponent(o.id)}`, text: summary })),
        h('p', { class: 'ocard__meta' }, h('span', { text: o.id }), h('span', { text: when(o.createdAt) }), h('span', { text: `${o.address.hostel}, Block ${o.address.block}` })),
        live ? h('div', { class: 'ocard__bar', style: `--p:${p.index / (SN.STATUS_FLOW.length - 1)}`, role: 'progressbar', 'aria-label': 'Order progress', 'aria-valuemin': 0, 'aria-valuemax': SN.STATUS_FLOW.length - 1, 'aria-valuenow': p.index }, h('span')) : null),
      h('div', { class: 'ocard__side' },
        h('p', { class: 'ocard__total', text: money(o.total) }),
        live
          ? h('a', { class: 'btn btn--primary btn--sm', href: `order.html?id=${encodeURIComponent(o.id)}` }, 'Track', icon('arrow'))
          : h('div', { class: 'ocard__acts' },
            h('button', { class: 'btn btn--sm', type: 'button', onclick: () => {
              const n = SN.orders.reorder(o.id);
              if (n) { SN.ui.bump(); toast(`${n} item${n === 1 ? '' : 's'} added to your ${SN.KITCHENS[o.kitchen].name} bag`, { href: `cart.html?k=${o.kitchen}`, label: 'View bag' }); }
              else toast('Those items aren\'t available right now');
            } }, icon('refresh'), 'Reorder'),
            h('a', { class: 'linkish', href: `order.html?id=${encodeURIComponent(o.id)}` }, 'Receipt'))));
  };

  function render() {
    const all = SN.orders.all();
    const isLive = o => { const p = SN.orders.progress(o); return !p.done && p.index >= 0; };
    const current = all.filter(isLive);
    const past = all.filter(o => !isLive(o));
    const list = tab === 'current' ? current : past;
    const spent = past.filter(o => o.status !== 'refunded').reduce((s, o) => s + o.total, 0);

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
          h('div', null, h('dt', { text: 'In progress' }), h('dd', { text: String(current.length) })),
          h('div', null, h('dt', { text: 'Spent' }), h('dd', { text: money(spent) })))),
      h('div', { class: 'otabs', role: 'tablist', 'aria-label': 'Order lists' }, tabBtn('current', 'In progress', current.length), tabBtn('past', 'Past orders', past.length)),
      h('div', { class: 'olist', role: 'tabpanel' },
        list.length ? list.map(card)
          : tab === 'current'
            ? empty({ title: 'Nothing on the way', body: 'When you place an order, you can follow it here from the kitchen to your room.', cta: 'Order food', href: 'food.html', art: 'bike' })
            : empty({ title: 'No past orders yet', body: 'Your delivered orders will show up here, ready to reorder in one tap.', cta: 'Order food', href: 'food.html', art: 'receipt' })));
    SN.ui.reveal(host);
    first = false;

    clearTimeout(timer);
    if (current.length) timer = setTimeout(render, 5000);
  }

  render();
  SN.onChange(render);
});
