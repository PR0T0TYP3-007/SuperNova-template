// Attribution report: the business Supernova sends Crunchies Group, by day,
// restaurant and outlet, net of refunds, with CSV export. Viewers can see it.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, V = SN.viz, { h, icon, money } = SN.ui;
  const main = A.shell({ page: 'reports', title: 'Attribution report', sub: 'Food orders Supernova sent to Crunchies and Roots', ranges: true });
  if (!main) return;

  const r = A.range(A.currentRange());
  const food = A.between(A.all(), r).filter(o => A.kind(o) === 'food');
  const prev = A.between(A.all(), A.previous(r)).filter(o => A.kind(o) === 'food');
  const S = A.summarize(food), P = A.summarize(prev);
  const days = A.byDay(food, r, l => l);
  const net = l => l.reduce((s, o) => s + A.value(o) - A.refunded(o), 0);

  main.append(
    h('div', { class: 'adm-note' }, icon('shield'), h('span', null, 'Every order placed on Supernova carries ', h('b', { text: 'source: supernova' }), ' when it is sent to the Crunchies and Roots systems, so each one can be matched in their own reports.')),
    h('div', { class: 'adm-kpis' },
      A.tile({ label: 'Supernova orders', value: S.orders.toLocaleString('en-NG'), delta: A.change(S.orders, P.orders) }),
      A.tile({ label: 'Gross order value', value: A.compact(S.gross), delta: A.change(S.gross, P.gross) }),
      A.tile({ label: 'Refunds', value: A.compact(S.refunds), delta: A.change(S.refunds, P.refunds), good: 'down' }),
      A.tile({ label: 'Net value', value: A.compact(S.net), delta: A.change(S.net, P.net) }),
      A.tile({ label: 'Customers', value: S.customers.toLocaleString('en-NG'), delta: A.change(S.customers, P.customers) })),
    A.panel(null, V.stacked({
      title: 'Net value by day', sub: 'After refunds, by restaurant', cats: days.map(d => d.t), catLabel: A.dayLabel, format: A.compact,
      series: ['crunchies', 'roots'].map(k => ({ name: SN.KITCHENS[k].name, color: V.COLORS[k], values: days.map(d => net(d.v.filter(o => o.kitchen === k))) }))
    })));

  // By restaurant and outlet.
  const rows = Object.entries(SN.OUTLETS).flatMap(([k, list]) => list.map(o => ({ k, name: o.name, s: A.summarize(food.filter(x => x.outlet === o.id)) })));
  const totals = k => A.summarize(food.filter(o => o.kitchen === k));
  const tr = (cells, cls) => h('tr', { class: cls }, cells.map((c, i) => h('td', { class: i ? 'num' : null }, c)));
  main.append(A.panel('By restaurant and outlet', h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
    h('thead', null, h('tr', null, ['Outlet', 'Orders', 'Gross', 'Refunds', 'Net', 'Avg order'].map((c, i) => h('th', { class: i ? 'num' : null, text: c })))),
    h('tbody', null, ['crunchies', 'roots'].map(k => {
      const t = totals(k);
      return [tr([h('b', { text: SN.KITCHENS[k].name }), h('b', { text: t.orders.toLocaleString('en-NG') }), h('b', { text: money(t.gross) }), h('b', { text: money(t.refunds) }), h('b', { text: money(t.net) }), h('b', { text: money(t.aov) })]),
        ...rows.filter(x => x.k === k).map(x => tr([`  ${x.name}`, x.s.orders.toLocaleString('en-NG'), money(x.s.gross), money(x.s.refunds), money(x.s.net), money(x.s.aov)]))];
    }).flat(), tr([h('b', { text: 'Total' }), h('b', { text: S.orders.toLocaleString('en-NG') }), h('b', { text: money(S.gross) }), h('b', { text: money(S.refunds) }), h('b', { text: money(S.net) }), h('b', { text: money(S.aov) })])))),
    { aside: h('div', { class: 'adm-acts' },
      h('button', { class: 'btn btn--sm', type: 'button', onclick: () => exportDaily() }, icon('download'), 'Daily summary CSV'),
      h('button', { class: 'btn btn--sm btn--primary', type: 'button', onclick: () => exportOrders() }, icon('download'), 'Order list CSV')) }));

  const stamp = () => new Date().toISOString().slice(0, 10);
  function exportDaily() {
    const out = [['Date', 'Restaurant', 'Orders', 'Gross (NGN)', 'Refunds (NGN)', 'Net (NGN)']];
    days.forEach(d => ['crunchies', 'roots'].forEach(k => { const s = A.summarize(d.v.filter(o => o.kitchen === k)); out.push([new Date(d.t).toISOString().slice(0, 10), SN.KITCHENS[k].name, s.orders, s.gross, s.refunds, s.net]); }));
    A.csv(out, `supernova-attribution-daily-${stamp()}.csv`);
    A.audit.log('Exported report', 'attribution', `Daily summary, last ${r.days} days`);
  }
  function exportOrders() {
    const out = [['Order ID', 'Placed', 'Restaurant', 'Outlet', 'Status', 'Gross (NGN)', 'Refund (NGN)', 'Net (NGN)', 'Source']];
    food.forEach(o => out.push([o.id, new Date(o.createdAt).toISOString(), SN.KITCHENS[o.kitchen].name, A.outletName(o.outlet), A.statusOf(o)[1], A.value(o), A.refunded(o), A.value(o) - A.refunded(o), o.source || 'supernova']));
    A.csv(out, `supernova-attribution-orders-${stamp()}.csv`);
    A.audit.log('Exported report', 'attribution', `Order list, ${food.length} orders`);
  }
});
