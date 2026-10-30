// Admin orders: every order of every kind, filterable, with a detail drawer.
// The drawer's controls stand in for restaurant webhooks in the sandbox.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon, money, param } = SN.ui;
  const main = A.shell({ page: 'orders', title: 'Orders', sub: 'Every order across food, market runs, dry cleaning and flights', ranges: true });
  if (!main) return;

  const state = { q: '', kind: param('kind') || 'all', kitchen: 'all', status: param('status') || 'all', shown: 40 };
  const sel = (key, label, options) => h('div', { class: 'select' },
    h('select', { 'aria-label': label, onchange: e => { state[key] = e.target.value; state.shown = 40; draw(); } },
      options.map(([v, t]) => h('option', { value: v, text: t, selected: state[key] === v }))), icon('chev', 'i select__chev'));
  const search = h('input', { type: 'search', placeholder: 'Search order ID, name, hostel or item', 'aria-label': 'Search orders', oninput: e => { state.q = e.target.value.trim().toLowerCase(); state.shown = 40; draw(); } });
  const count = h('span', { class: 'muted' });
  const body = h('tbody');
  const more = h('button', { class: 'btn btn--sm adm-more', type: 'button', onclick: () => { state.shown += 40; draw(); } }, 'Show more');

  main.append(A.panel(null, h('div', { class: 'adm-grid', style: 'gap:16px' },
    h('div', { class: 'adm-filters' }, search,
      sel('kind', 'Type', [['all', 'All types'], ['food', 'Food'], ['market', 'Market runs'], ['laundry', 'Dry cleaning'], ['flight', 'Flights']]),
      sel('kitchen', 'Restaurant', [['all', 'All restaurants'], ['crunchies', 'Crunchies'], ['roots', 'Roots']]),
      sel('status', 'Status', [['all', 'Any status'], ['live', 'In progress'], ['done', 'Completed'], ['refunded', 'Refunds'], ['cancelled', 'Cancelled'], ['issue', 'Has an issue']]),
      count),
    h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
      h('thead', null, h('tr', null, ['Order', 'Placed', 'Customer', 'Type', 'From', 'Items', 'Total', 'Status'].map((c, i) => h('th', { class: i === 6 ? 'num' : null, text: c })))),
      body)),
    more)));

  function matches(o) {
    const p = SN.orders.progress(o);
    if (state.kind !== 'all' && A.kind(o) !== state.kind) return false;
    if (state.kitchen !== 'all' && o.kitchen !== state.kitchen) return false;
    if (state.status === 'live' && !(A.live(o))) return false;
    if (state.status === 'done' && p.final !== 'delivered') return false;
    if (state.status === 'refunded' && !o.refund) return false;
    if (state.status === 'cancelled' && p.final !== 'cancelled') return false;
    if (state.status === 'issue' && !o.issue) return false;
    if (state.q) {
      const text = [o.id, o.contact?.name, o.address?.hostel, o.address?.campus, ...(o.items || []).map(i => i.name), o.from, o.to].join(' ').toLowerCase();
      if (!text.includes(state.q)) return false;
    }
    return true;
  }
  const itemsText = o => A.kind(o) === 'flight' ? `${SN.ui.city(o.from)} → ${SN.ui.city(o.to)}` : (o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');
  const fromText = o => A.kind(o) === 'food' ? `${SN.KITCHENS[o.kitchen].name} ${A.outletName(o.outlet)}` : SN.ui.orderFrom(o);

  function draw() {
    const list = A.between(A.all(), A.range(A.currentRange())).filter(matches);
    count.textContent = `${list.length.toLocaleString('en-NG')} orders`;
    body.replaceChildren(...(list.length ? list.slice(0, state.shown).map(o => h('tr', { class: 'is-click', tabindex: 0, onclick: () => open(o.id), onkeydown: e => { if (e.key === 'Enter') open(o.id); } },
      h('td', null, h('b', { text: o.id }), o.real ? h('span', { class: 'spill spill--action', text: 'This browser' }) : null, o.issue && o.issue.state === 'open' ? h('span', { class: 'spill spill--off', text: 'Issue' }) : null),
      h('td', { class: 'muted', text: A.timeLabel(o.createdAt) }),
      h('td', null, o.contact?.name || '—', h('div', { class: 'muted', text: o.address?.hostel || '' })),
      h('td', null, SN.ui.orderTag(o)),
      h('td', { class: 'muted', text: fromText(o) }),
      h('td', null, h('div', { class: 'adm-trunc', text: itemsText(o) })),
      h('td', { class: 'num' }, h('b', { text: (o.total || o.quote?.total) ? money(o.total || o.quote.total) : '—' })),
      h('td', null, A.pill(o))))
      : [h('tr', null, h('td', { colspan: 8 }, h('div', { class: 'adm-empty' }, icon('search'), h('p', { text: 'No orders match those filters.' }))))]));
    more.hidden = list.length <= state.shown;
  }

  // ---- Detail drawer ------------------------------------------------------------
  function open(id) {
    const dlg = h('dialog', { class: 'adm-drawer', 'aria-labelledby': 'dr-t' });
    const render = () => {
      const o = A.get(id);
      const p = SN.orders.progress(o);
      const flow = SN.orders.flow(o);
      const last = flow.length - 1;
      const amount = h('input', { class: 'adm-input adm-input--sm', type: 'number', min: 0, step: 100, value: o.total || 0, 'aria-label': 'Refund amount' });
      const reason = h('input', { class: 'adm-input', type: 'text', placeholder: 'Reason, e.g. missing drink', 'aria-label': 'Refund reason', style: 'flex:1 1 180px' });
      const act = (label, fn, cls = '') => h('button', { class: `btn ${cls}`, type: 'button', onclick: () => { fn(); render(); draw(); } }, label);

      dlg.replaceChildren(
        h('div', { class: 'adm-drawer__head' }, h('h2', { id: 'dr-t', text: o.id }), A.pill(o),
          h('button', { class: 'sheet__x', style: 'position:static', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('x'))),
        h('div', { class: 'adm-drawer__body' },
          h('dl', { class: 'adm-kv' },
            h('dt', { text: 'Type' }), h('dd', null, SN.ui.orderTag(o)),
            h('dt', { text: 'Placed' }), h('dd', { text: A.timeLabel(o.createdAt) }),
            h('dt', { text: 'Customer' }), h('dd', { text: `${o.contact?.name || '—'} · ${o.contact?.phone || o.address?.phone || ''}` }),
            o.contact?.email ? [h('dt', { text: 'Email' }), h('dd', { text: o.contact.email })] : null,
            h('dt', { text: 'Deliver to' }), h('dd', { text: `${SN.ui.addrLine(o.address || {})}, ${o.address?.campus || ''}` }),
            A.kind(o) === 'food' ? [h('dt', { text: 'Outlet' }), h('dd', { text: `${SN.KITCHENS[o.kitchen].name} ${A.outletName(o.outlet)}` })] : null,
            h('dt', { text: 'Source' }), h('dd', { text: `${o.source || 'supernova'} · ${o.environment || 'sandbox'}` })),
          A.panel('Items', h('ul', { class: 'adm-lines' }, A.kind(o) === 'flight'
            ? [h('li', null, h('span', { text: `${SN.ui.city(o.from)} → ${SN.ui.city(o.to)}, ${o.trip}` }), h('span', { text: `${o.pax} pax` })), h('li', null, h('span', { text: `${o.depart}${o.ret ? ' – ' + o.ret : ''}` }), h('span', { text: o.concierge ? 'Concierge' : '' }))]
            : (o.items || []).map(i => h('li', null, h('span', null, `${i.qty} ${i.unit && typeof i.unit === 'string' ? i.unit : '×'} ${i.name}`), h('span', { text: i.total ? money(i.total) : '' })))),
            { aside: h('b', { text: o.total ? money(o.total) : o.quote ? `Quoted ${money(o.quote.total)}` : 'Not priced yet' }) }),
          A.panel('Progress', h('ol', { class: 'adm-steps' }, flow.map((s, i) => h('li', { class: p.index < 0 ? '' : i < p.index || (p.done && i === p.index) ? 'is-done' : i === p.index ? 'is-now' : '' }, h('span'), s.label)))),
          o.issue ? A.panel('Reported issue', h('div', { class: 'adm-card__note' }, h('b', { text: `${o.issue.type}: ` }), o.issue.note || 'No details given.', h('div', { class: 'muted', text: o.issue.state === 'open' ? 'Open' : 'Resolved' }))) : null,
          o.refund ? A.panel('Refund', h('p', { text: `${money(o.refund.amount)} · ${o.refund.reason} · ${o.refund.state}${o.refund.requestedBy ? ` · asked by ${o.refund.requestedBy}` : ''}${o.refund.approvedBy ? ` · approved by ${o.refund.approvedBy}` : ''}` })) : null,
          A.panel('Actions', h('div', { class: 'adm-grid', style: 'gap:12px' },
            A.live(o) && !p.awaitingPayment ? h('div', { class: 'adm-acts' },
              p.index < last ? act(`Move to "${flow[p.index + 1].label}"`, () => A.setStage(o.id, p.index + 1), 'btn--primary') : null,
              act(`Mark "${flow[last].label}"`, () => A.setStage(o.id, last)),
              act('Cancel order', () => { A.update(o.id, x => ({ ...x, status: 'cancelled', stage: undefined }), 'Cancelled order', 'Cancelled from the orders screen'); })) : null,
            p.awaitingPayment ? h('p', { class: 'adm-sandbox', text: 'Waiting for the customer to pay their quote or shortlist.' }) : null,
            o.total && (!o.refund || o.refund.state === 'rejected') ? h('div', { class: 'adm-acts' }, amount, reason,
              act('Refund', () => { const res = A.refund(o.id, Number(amount.value), reason.value.trim() || 'Refund from orders screen'); SN.ui.toast(res === 'pending' ? 'Sent for a second admin to approve' : 'Refunded'); }, 'btn--loud')) : null,
            h('p', { class: 'adm-sandbox', text: `Sandbox controls. Refunds over ${money(SN.settings.get().refundThreshold)} need a second admin. Every action is written to the audit log.` })))));
    };
    render();
    dlg.addEventListener('close', () => dlg.remove());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    document.body.append(dlg);
    dlg.showModal();
  }

  draw();
  if (param('id')) open(param('id'));
});
