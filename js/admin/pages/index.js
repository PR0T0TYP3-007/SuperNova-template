// Admin overview: headline numbers vs the previous period, what needs doing,
// live orders by step, sales trend, busy hours, top items, outlets, hostels.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, V = SN.viz, { h, icon, money } = SN.ui;
  const main = A.shell({ page: 'overview', title: 'Overview', sub: 'How Supernova is doing, at a glance', ranges: true });
  if (!main) return;

  const r = A.range(A.currentRange());
  const all = A.all();
  const cur = A.between(all, r);
  const S = A.summarize(cur), P = A.summarize(A.between(all, A.previous(r)));
  const days = A.byDay(cur, r, l => l);
  const series = fn => days.map(d => fn(A.summarize(d.v)));
  const food = cur.filter(o => A.kind(o) === 'food');

  // ---- KPI row ----
  main.append(h('div', { class: 'adm-kpis' },
    A.tile({ label: 'Orders', value: S.orders.toLocaleString('en-NG'), delta: A.change(S.orders, P.orders), spark: V.spark(series(x => x.orders)) }),
    A.tile({ label: 'Gross sales', value: A.compact(S.gross), delta: A.change(S.gross, P.gross), spark: V.spark(series(x => x.gross)) }),
    A.tile({ label: 'Net after refunds', value: A.compact(S.net), delta: A.change(S.net, P.net), spark: V.spark(series(x => x.net)) }),
    A.tile({ label: 'Average food order', value: money(S.aov), delta: A.change(S.aov, P.aov), spark: V.spark(series(x => x.aov)) }),
    A.tile({ label: 'Refund rate', value: A.pct(S.refundRate), delta: A.change(S.refundRate, P.refundRate), good: 'down', hint: `${money(S.refunds)} refunded` }),
    A.tile({ label: 'Avg food delivery', value: `${Math.round(S.delivery)} min`, delta: A.change(S.delivery, P.delivery), good: 'down', hint: 'Order to doorstep' }),
    A.tile({ label: 'Customers', value: S.customers.toLocaleString('en-NG'), delta: A.change(S.customers, P.customers), hint: 'Ordered at least once' })));

  // ---- Needs attention + live now (admins only) ----
  if (A.can()) {
    const liveFood = all.filter(o => A.kind(o) === 'food' && A.live(o));
    const late = liveFood.filter(o => Date.now() - o.createdAt > 60 * 6e4);
    const todo = [
      ['basket', 'Market quotes to send', all.filter(o => A.kind(o) === 'market' && !o.quote && !o.paidAt && !o.status).length, 'requests.html?tab=market'],
      ['plane', 'Flight shortlists to send', all.filter(o => A.kind(o) === 'flight' && !o.options && !o.paidAt && !o.status).length, 'requests.html?tab=flight'],
      ['shirt', 'Laundry pickups to collect', all.filter(o => A.kind(o) === 'laundry' && A.live(o) && (o.stage ?? 0) < 1).length, 'requests.html?tab=laundry'],
      ['alert', 'Open issues', all.filter(o => o.issue && o.issue.state === 'open').length, 'support.html'],
      ['shield', 'Refunds waiting for approval', all.filter(o => o.refund && o.refund.state === 'pending').length, 'support.html#refunds'],
      ['clock', 'Food orders running late (60+ min)', late.length, 'orders.html?status=live&kind=food']
    ];
    const flow = SN.FLOWS.food;
    const byStage = flow.slice(0, -1).map((s, i) => [s.label, liveFood.filter(o => SN.orders.progress(o).index === i).length]);
    main.append(h('div', { class: 'adm-grid adm-2' },
      A.panel('Needs attention', h('ul', { class: 'adm-list' }, todo.map(([ic, label, n, href]) => h('li', null,
        h('a', { href }, h('span', { class: 'adm-ico' }, icon(ic)), h('b', { text: label }), h('span', { class: `adm-count ${n ? 'is-hot' : ''}`, text: String(n) })))))),
      A.panel('Food orders live right now', h('div', null,
        h('div', { class: 'adm-stages' }, byStage.map(([label, n]) => h('div', { class: 'adm-stage' }, h('b', { text: String(n) }), h('span', { text: label })))),
        h('p', { class: 'adm-sandbox', style: 'margin-top:12px' }, `${liveFood.length} in progress · ${late.length} running late`)),
        { aside: h('a', { class: 'linkish', href: 'orders.html?status=live' }, 'Open orders') })));
  }

  // ---- Sales by day, by restaurant ----
  const C = V.COLORS;
  const salesBy = k => days.map(d => d.v.filter(o => A.kind(o) === 'food' && o.kitchen === k).reduce((s, o) => s + A.value(o) - A.refunded(o), 0));
  main.append(A.panel(null, V.stacked({
    title: 'Food sales by day', sub: 'Net of refunds, by restaurant',
    cats: days.map(d => d.t), catLabel: A.dayLabel, format: A.compact,
    series: [{ name: 'Crunchies', color: C.crunchies, values: salesBy('crunchies') }, { name: 'Roots', color: C.roots, values: salesBy('roots') }]
  })));

  // ---- Orders trend + service mix ----
  const svc = [['food', 'Food'], ['market', 'Market runs'], ['laundry', 'Dry cleaning'], ['flight', 'Flights']]
    .map(([k, label]) => { const l = cur.filter(o => A.kind(o) === k); const v = l.reduce((s, o) => s + A.value(o), 0); return { label, value: v, sub: `${l.filter(A.paid).length} orders`, extra: [['Share', S.gross ? A.pct(v / S.gross) : '0%']] }; });
  main.append(h('div', { class: 'adm-grid adm-3' },
    A.panel(null, V.area({ title: 'Orders per day', sub: 'All services', name: 'Orders', points: series(x => x.orders).map((v, i) => ({ t: days[i].t, v })), xLabel: A.dayLabel, format: v => Math.round(v).toLocaleString('en-NG') })),
    A.panel(null, V.bars({ title: 'Sales by service', sub: 'Gross value', name: 'Sales', rows: svc, format: A.compact }))));

  // ---- Busy hours + top items ----
  const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heat = WD.map(() => Array(24).fill(0));
  food.filter(A.paid).forEach(o => { const d = new Date(o.createdAt); heat[(d.getDay() + 6) % 7][d.getHours()]++; });
  const itemCount = {};
  food.filter(A.paid).forEach(o => o.items.forEach(i => { const key = `${o.kitchen}:${i.name}`; itemCount[key] = (itemCount[key] || 0) + i.qty; }));
  const topItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([key, n]) => { const [k, name] = key.split(':'); return { label: name, sub: SN.KITCHENS[k].name, value: n }; });
  main.append(h('div', { class: 'adm-grid adm-2' },
    A.panel(null, V.heatmap({ title: 'Busy hours', sub: 'Food orders by weekday and hour', rows: WD, cols: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`), values: heat, format: v => String(v) })),
    A.panel(null, V.bars({ title: 'Top items', sub: 'Portions sold', name: 'Portions', rows: topItems, format: v => v.toLocaleString('en-NG') }))));

  // ---- Outlets table + hostels ----
  const outlets = Object.entries(SN.OUTLETS).flatMap(([k, list]) => list.map(o => {
    const l = food.filter(x => x.outlet === o.id);
    const s = A.summarize(l);
    const prep = l.filter(x => x.timings);
    return { k, o, s, prep: prep.length ? prep.reduce((a, x) => a + x.timings.prep, 0) / prep.length : 0 };
  })).sort((a, b) => b.s.net - a.s.net);
  const hostels = {};
  cur.filter(A.paid).forEach(o => { const key = `${o.address?.hostel}|${o.address?.campus}`; hostels[key] = (hostels[key] || 0) + 1; });
  const topHostels = Object.entries(hostels).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, n]) => { const [hn, c] = key.split('|'); return { label: hn, sub: c, value: n }; });

  main.append(h('div', { class: 'adm-grid adm-3' },
    A.panel('Outlet performance', h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
      h('thead', null, h('tr', null, ['Outlet', 'Orders', 'Net sales', 'Avg order', 'Avg prep', 'Refunds'].map((c, i) => h('th', { class: i ? 'num' : null, text: c })))),
      h('tbody', null, outlets.map(({ k, o, s, prep }) => h('tr', null,
        h('td', null, h('span', { class: `tag tag--${k}` }, h('span', { class: `dot dot--${k}` }), SN.KITCHENS[k].name), ' ', h('b', { text: o.name }), SN.outlets.list(k).find(x => x.id === o.id)?.closed ? h('span', { class: 'spill spill--off', text: 'Closed' }) : null),
        h('td', { class: 'num', text: s.orders.toLocaleString('en-NG') }),
        h('td', { class: 'num', text: A.compact(s.net) }),
        h('td', { class: 'num', text: money(s.aov) }),
        h('td', { class: 'num', text: `${Math.round(prep)} min` }),
        h('td', { class: 'num', text: A.pct(s.refundRate) }))))))),
    A.panel(null, V.bars({ title: 'Busiest hostels', sub: 'Orders delivered there', name: 'Orders', rows: topHostels, format: v => String(v) }))));
});
