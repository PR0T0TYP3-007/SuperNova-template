// Outlets & menu: open or close outlets, switch items off per outlet, and see
// how the popularity ranking compares with seeded data.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon, money } = SN.ui;
  const main = A.shell({ page: 'menu', title: 'Outlets & menu', sub: 'What students can order, and where' });
  if (!main) return;

  const sw = (checked, label, onchange) => h('label', { class: 'adm-switch' },
    h('input', { type: 'checkbox', checked, onchange: e => onchange(e.target.checked) }), h('span', { class: 'adm-switch__ui', 'aria-hidden': 'true' }), label);
  let outletId = SN.OUTLETS.crunchies[0].id;
  const host = h('div', { class: 'adm-grid' });
  main.append(host);

  function draw() {
    const k = SN.outlets.kitchenOf(outletId);
    const sold30 = {};
    A.between(A.all(), A.range(30)).filter(o => A.kind(o) === 'food' && A.paid(o)).forEach(o => o.items.forEach(i => { sold30[i.id] = (sold30[i.id] || 0) + i.qty; }));
    const items = SN.MENU[k].items;
    const ranked = [...items].sort((a, b) => (sold30[b.id] || 0) - (sold30[a.id] || 0));

    host.replaceChildren(
      A.panel('Outlets', h('div', { class: 'adm-cards' }, Object.entries(SN.OUTLETS).flatMap(([kk]) => SN.outlets.list(kk).map(o => h('article', { class: 'adm-card', 'data-kitchen': kk },
        h('div', { class: 'adm-card__head' }, h('h3', { text: o.name }), h('span', { class: `tag tag--${kk}` }, h('span', { class: `dot dot--${kk}` }), SN.KITCHENS[kk].name)),
        h('p', { class: 'adm-card__meta' }, h('span', { text: o.area }), h('span', { text: o.hours }), h('span', { text: o.eta })),
        h('div', { class: 'adm-card__acts' },
          sw(!o.closed, o.closed ? 'Closed to new orders' : 'Taking orders', on => { SN.outlets.setClosed(o.id, !on); A.audit.log(on ? 'Opened outlet' : 'Closed outlet', o.id, `${SN.KITCHENS[kk].name} ${o.name}`); draw(); }),
          h('button', { class: `btn btn--sm ${o.id === outletId ? 'btn--primary' : ''}`, type: 'button', onclick: () => { outletId = o.id; draw(); } }, 'Edit menu'))))))),
      h('div', { class: 'adm-grid adm-3' },
        A.panel(`Menu at ${SN.KITCHENS[k].name} ${A.outletName(outletId)}`, h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
          h('thead', null, h('tr', null, ['Item', 'Category', 'Price', 'Available here'].map((c, i) => h('th', { class: i === 2 ? 'num' : null, text: c })))),
          h('tbody', null, items.map(it => h('tr', null,
            h('td', null, h('b', { text: it.name })),
            h('td', { class: 'muted', text: SN.MENU[k].categories.find(c => c.id === it.cat)?.name }),
            h('td', { class: 'num', text: money(it.price) }),
            h('td', null, sw(SN.outlets.available(k, outletId, it.id), '', on => { SN.outlets.setAvailable(outletId, it.id, on); A.audit.log(on ? 'Item back on' : 'Item sold out', outletId, `${it.name} at ${A.outletName(outletId)}`); draw(); }))))))),
          { aside: h('span', { class: 'muted', text: 'Changes show on the student menu straight away.' }) }),
        A.panel('Popularity ranking', h('div', null,
          h('p', { class: 'adm-sandbox', style: 'margin-bottom:10px' }, 'The menu opens with the most-ordered items. Seeded counts come from Crunchies Group history; Supernova counts are the last 30 days.'),
          h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
            h('thead', null, h('tr', null, ['#', 'Item', 'Seeded', 'Supernova'].map((c, i) => h('th', { class: i > 1 ? 'num' : null, text: c })))),
            h('tbody', null, ranked.slice(0, 10).map((it, i) => h('tr', null, h('td', { text: String(i + 1) }), h('td', { text: it.name }), h('td', { class: 'num', text: it.orders.toLocaleString('en-NG') }), h('td', { class: 'num' }, h('b', { text: (sold30[it.id] || 0).toLocaleString('en-NG') })))))))))));
  }
  draw();
});
