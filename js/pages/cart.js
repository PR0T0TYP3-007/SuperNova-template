// Cart: two separate bags, one per kitchen, shown as tabs.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag } = SN.ui;
  const host = document.querySelector('[data-cart]');
  const KS = ['crunchies', 'roots'];

  let active = SN.ui.kitchenOr(param('k')) || KS.find(k => SN.cart.count(k)) || 'crunchies';

  function render() {
    const tabs = h('div', { class: 'bagtabs', role: 'tablist', 'aria-label': 'Bags' },
      KS.map(k => {
        const n = SN.cart.count(k);
        return h('button', {
          class: 'bagtab', role: 'tab', type: 'button', id: `tab-${k}`, 'data-kitchen': k,
          'aria-selected': String(k === active), 'aria-controls': 'bag-panel', tabindex: k === active ? '0' : '-1',
          onclick: () => { active = k; history.replaceState(null, '', `?k=${k}`); render(); },
          onkeydown: e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { active = k === 'crunchies' ? 'roots' : 'crunchies'; render(); host.querySelector('[aria-selected="true"]').focus(); } }
        },
        h('span', { class: `dot dot--${k}` }),
        h('span', { class: 'bagtab__name' }, SN.KITCHENS[k].name, h('span', { class: 'bagtab__word', text: ' bag' })),
        h('span', { class: 'bagtab__n', text: String(n) }));
      }));

    host.replaceChildren(tabs, h('div', { id: 'bag-panel', role: 'tabpanel', 'aria-labelledby': `tab-${active}`, 'data-kitchen': active }, panel(active)));
  }

  function panel(k) {
    const K = SN.KITCHENS[k];
    const lines = SN.cart.lines(k);
    const other = k === 'crunchies' ? 'roots' : 'crunchies';
    const otherN = SN.cart.count(other);

    if (!lines.length) {
      return h('div', { class: 'bag-empty' },
        empty({ title: `Your ${K.name} bag is empty`, body: `${K.tagline} Go on, add something good.`, cta: `Browse ${K.name}`, href: `kitchen.html?k=${k}` }),
        otherN ? nudge(other, otherN) : null);
    }

    const t = SN.cart.totals(k);
    const list = h('ul', { class: 'lines' }, lines.map(l => {
      const it = SN.item(k, l.id);
      const opts = SN.optionsFor(k, l).map(o => o.label);
      const unit = SN.unitPrice(k, l);
      return h('li', { class: 'line' },
        h('img', { class: 'line__img', src: img(it.img), alt: '', width: 96, height: 96, loading: 'lazy' }),
        h('div', { class: 'line__info' },
          h('h3', { class: 'line__name', text: it.name }),
          opts.length ? h('p', { class: 'line__opts', text: opts.join(' · ') }) : null,
          h('p', { class: 'line__unit', text: `${money(unit)} each` })),
        h('div', { class: 'line__ctl' },
          h('div', { class: 'stepper stepper--sm', role: 'group', 'aria-label': `Quantity of ${it.name}` },
            h('button', { class: 'stepper__b', type: 'button', 'aria-label': l.qty === 1 ? `Remove ${it.name}` : 'One fewer', onclick: () => SN.cart.setQty(k, l.key, l.qty - 1) }, icon(l.qty === 1 ? 'trash' : 'minus')),
            h('output', { class: 'stepper__n', text: String(l.qty) }),
            h('button', { class: 'stepper__b', type: 'button', 'aria-label': 'One more', disabled: l.qty >= 20, onclick: () => SN.cart.setQty(k, l.key, l.qty + 1) }, icon('plus'))),
          h('p', { class: 'line__total', text: money(unit * l.qty) })));
    }));

    return h('div', { class: 'bag' },
      h('div', { class: 'bag__main' },
        h('div', { class: 'panel bag__lines' },
          h('div', { class: 'panel__head' },
            h('h2', { class: 'panel__title' }, tag(k), `${SN.cart.count(k)} item${SN.cart.count(k) === 1 ? '' : 's'}`),
            SN.outlets.get(k) ? h('a', { class: 'bag__outlet', href: `kitchen.html?k=${k}&pick=1` }, icon('pin'), `From ${SN.outlets.find(SN.outlets.get(k)).name}`) : null,
            // Two-step empty: the first tap arms it, the second clears.
            h('button', { class: 'linkish', type: 'button', onclick: e => {
              const b = e.currentTarget;
              if (b.dataset.armed) return SN.cart.clear(k);
              b.dataset.armed = '1';
              b.textContent = 'Tap again to empty';
              setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Empty bag'; } }, 3000);
            } }, 'Empty bag')),
          list,
          h('a', { class: 'addmore', href: `kitchen.html?k=${k}${SN.outlets.get(k) ? '&o=' + SN.outlets.get(k) : ''}` }, icon('plus'), `Add more from ${K.name}`)),
        otherN ? nudge(other, otherN) : null),
      h('aside', { class: 'panel summary', 'aria-label': 'Order summary' },
        h('h2', { class: 'panel__title', text: 'Summary' }),
        h('dl', { class: 'sums' },
          h('div', null, h('dt', { text: 'Subtotal' }), h('dd', { text: money(t.subtotal) })),
          h('div', null, h('dt', null, 'Delivery to your hostel'), h('dd', { text: money(t.fee) })),
          h('div', { class: 'sums__total' }, h('dt', { text: 'Total' }), h('dd', { text: money(t.total) }))),
        h('p', { class: 'summary__eta' }, icon('clock'), `Usually arrives in ${K.eta}`),
        h('a', { class: 'btn btn--loud btn--block', href: `checkout.html?k=${k}` }, `Checkout ${K.name}`, icon('arrow')),
        h('p', { class: 'summary__safe' }, icon('lock'), 'We double-check prices before you pay.')));
  }

  function nudge(k, n) {
    const K = SN.KITCHENS[k];
    return h('div', { class: 'nudge', 'data-kitchen': k },
      h('span', { class: 'nudge__icon' }, icon('bag')),
      h('p', null, h('strong', { text: `Your ${K.name} bag has ${n} item${n === 1 ? '' : 's'}.` }), ` It checks out separately.`),
      h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { active = k; history.replaceState(null, '', `?k=${k}`); render(); scrollTo({ top: 0, behavior: 'smooth' }); } }, `Open ${K.name} bag`));
  }

  render();
  SN.onChange(render);
});
