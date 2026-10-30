// Food: choose a kitchen.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img } = SN.ui;
  const host = document.querySelector('[data-picker]');

  const card = k => {
    const K = SN.KITCHENS[k];
    const top = [...SN.MENU[k].items].sort((a, b) => b.orders - a.orders).slice(0, 3);
    const count = SN.cart.count(k);

    return h('article', { class: 'kcard', 'data-kitchen': k, 'data-reveal': true },
      h('div', { class: 'kcard__media' },
        h('img', { src: K.hero, alt: K.alt, width: 1100, height: 733 }),
        h('span', { class: 'kcard__plate' }, h('span', { class: `dot dot--${k}` }), K.name),
        count ? h('a', { class: 'kcard__bag', href: `cart.html?k=${k}` }, icon('bag'), `${count} in your bag · ${money(SN.cart.totals(k).subtotal)}`) : null),
      h('div', { class: 'kcard__body' },
        h('h2', { class: 'kcard__name' }, K.name),
        h('p', { class: 'kcard__tag', text: K.tagline }),
        h('p', { class: 'kcard__blurb', text: K.blurb }),
        h('ul', { class: 'meta-row' },
          h('li', null, icon('clock'), K.eta),
          h('li', null, icon('bike'), `${money(K.fee)} delivery`),
          h('li', null, icon('star'), `Open ${K.hours}`)),
        h('div', { class: 'kcard__top' },
          h('p', { class: 'kcard__top-k', text: 'Most ordered' }),
          h('ol', null, top.map((it, i) => h('li', null,
            h('span', { class: 'kcard__rank', text: `#${i + 1}` }),
            h('img', { src: img(it.img), alt: '', width: 48, height: 48, loading: 'lazy' }),
            h('span', { class: 'kcard__item', text: it.name }),
            h('span', { class: 'kcard__price', text: money(it.price) }))))),
        h('a', { class: 'btn btn--loud btn--block kcard__cta', href: `kitchen.html?k=${k}` }, `Order from ${K.name}`, icon('arrow'))));
  };

  host.append(card('crunchies'), card('roots'));
  SN.ui.reveal(host);
});
