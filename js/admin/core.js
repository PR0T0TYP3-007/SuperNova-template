// Supernova admin: data layer, roles, audit log and the page shell.
//
// Data = a deterministic 60-day synthetic history (so charts have something
// to show) + the real orders placed on this browser's customer site. Admin
// edits to real orders go through SN.orders.update, so the student sees them;
// edits to synthetic orders are kept as patches. Everything maps to the
// /admin endpoints in the design document and is swapped for API calls later.
(() => {
  const { h, icon, money } = SN.ui;
  const { local } = SN.store;
  const DAY = 864e5;

  // ---- Accounts + roles ------------------------------------------------------
  // Demo accounts. In production admins sign in with 2FA and are created by
  // hand; the viewer role is read-only reports for Crunchies Group management.
  const ACCOUNTS = [
    { id: 'augustus', name: 'Augustus', role: 'admin', title: 'Admin' },
    { id: 'covenant', name: 'Covenant Chukwudi', role: 'admin', title: 'Admin' },
    { id: 'crunchies-group', name: 'Crunchies Group', role: 'viewer', title: 'Viewer · read only' }
  ];
  const user = () => ACCOUNTS.find(a => a.id === local.get('sn.admin.user', 'augustus')) || ACCOUNTS[0];
  const can = () => user().role === 'admin';

  // ---- Audit log (append-only) ---------------------------------------------------
  const audit = {
    all: () => local.get('sn.admin.audit', []),
    log(action, entity, detail) {
      const entry = { at: Date.now(), actor: user().name, role: user().role, action, entity, detail };
      local.set('sn.admin.audit', [entry, ...audit.all()].slice(0, 400));
    }
  };

  // ---- Seeded random ---------------------------------------------------------------
  const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const weighted = (r, pairs) => { const t = pairs.reduce((s, [, w]) => s + w, 0); let x = r() * t; for (const [v, w] of pairs) { if ((x -= w) <= 0) return v; } return pairs[0][0]; };

  const FIRST = ['Ada', 'Chidi', 'Tobi', 'Amaka', 'Kene', 'Zainab', 'Ife', 'Emeka', 'Bisi', 'Uche', 'Nneka', 'Dayo', 'Ifeoma', 'Musa', 'Tolu', 'Chioma', 'Femi', 'Ngozi', 'Seyi', 'Obi', 'Halima', 'Kelechi', 'Funmi', 'Yemi'];
  const LAST = ['Okafor', 'Adeyemi', 'Eze', 'Bello', 'Nwosu', 'Okoro', 'Lawal', 'Obi', 'Ibe', 'Okonkwo', 'Afolabi', 'Udeh', 'Balogun', 'Nnaji', 'Ojo', 'Musa'];
  // Hour-of-day weights: lunch, dinner, and a late-night study spike.
  const HOURS = [1, 0.5, 0.2, 0, 0, 0, 0.2, 0.6, 1.2, 1.4, 1.6, 2.5, 4.2, 4.6, 3.4, 2.2, 2.4, 3.2, 4.4, 5.2, 5, 4, 3, 2];

  let cache = null;
  function synthesize() {
    const r = rng(20261030);
    const students = Array.from({ length: 380 }, (_, i) => {
      const c = pick(r, SN.CAMPUSES);
      return { id: `STU-${String(i + 1).padStart(4, '0')}`, name: `${pick(r, FIRST)} ${pick(r, LAST)}`, phone: `080${Math.floor(10000000 + r() * 89999999)}`,
        campusId: c.id, campus: c.name, hostel: pick(r, c.hostels), block: pick(r, SN.BLOCKS), loyal: r() < 0.3 };
    });
    const out = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const itemPairs = k => SN.MENU[k].items.map(i => [i, i.orders]);
    let seq = 1000;

    for (let d = 59; d >= 0; d--) {
      const dayStart = today - d * DAY;
      const dow = new Date(dayStart).getDay();
      const growth = 0.75 + (59 - d) / 59 * 0.45;           // the platform is growing
      const weekend = dow === 5 || dow === 6 ? 1.3 : dow === 0 ? 1.1 : 1;
      const count = Math.round((34 + r() * 10) * growth * weekend);
      for (let n = 0; n < count; n++) {
        const hour = weighted(r, HOURS.map((w, i) => [i, w]));
        const createdAt = dayStart + hour * 36e5 + Math.floor(r() * 36e5);
        if (createdAt > now.getTime()) continue;
        const stu = r() < 0.55 ? pick(r, students.filter(s => s.loyal)) : pick(r, students);
        const address = { campusId: stu.campusId, campus: stu.campus, hostel: stu.hostel, block: stu.block, phone: stu.phone };
        const base = { id: `SN-${++seq}`, synthetic: true, createdAt, customer: stu.id, contact: { name: stu.name, phone: stu.phone }, address, source: 'supernova', environment: 'sandbox' };
        const ageMin = (now.getTime() - createdAt) / 6e4;
        const kind = weighted(r, [['food', 82], ['market', 8], ['laundry', 8], ['flight', 2]]);

        if (kind === 'food') {
          const k = r() < 0.56 ? 'crunchies' : 'roots';
          const outlets = SN.OUTLETS[k].filter(o => o.campuses.includes(stu.campusId));
          const outlet = (outlets.length ? pick(r, outlets) : pick(r, SN.OUTLETS[k])).id;
          const lines = Array.from({ length: 1 + Math.floor(r() * 2.4) }, () => weighted(r, itemPairs(k)));
          const items = [...new Map(lines.map(it => [it.id, it])).values()].map(it => {
            const qty = r() < 0.8 ? 1 : 2;
            return { id: it.id, name: it.name, img: it.img, qty, unit: it.price, total: it.price * qty };
          });
          const subtotal = items.reduce((s, i) => s + i.total, 0);
          const timings = { accept: 1 + Math.round(r() * 4), prep: 12 + Math.round(r() * 14 + (k === 'roots' ? 5 : 0)), ride: 10 + Math.round(r() * 15) };
          const o = { ...base, kind: 'food', kitchen: k, outlet, items, subtotal, fee: 800, total: subtotal + 800, timings };
          const roll = r();
          if (ageMin < 75) o.stage = Math.min(4, Math.floor(ageMin / 15));
          else if (roll < 0.025) { o.status = 'refunded'; o.refund = { amount: o.total, reason: pick(r, ['Kitchen rejected the order', 'Order never arrived', 'Wrong order delivered']), at: createdAt + 3 * 36e5 }; }
          else if (roll < 0.04) { o.status = 'refunded'; const it = items[0]; o.refund = { amount: it.total, partial: true, reason: `Missing item: ${it.name}`, at: createdAt + 2 * 36e5 }; o.partialRefund = true; }
          else if (roll < 0.055) o.status = 'cancelled';
          else o.status = 'delivered';
          if (o.partialRefund) { o.status = 'delivered'; delete o.partialRefund; }
          if (o.status === 'delivered' && r() < 0.012 && d < 4) { const [type, note] = pick(r, [['Missing item', 'The drink wasn\'t in the bag.'], ['Late order', 'Came 40 minutes late and cold.'], ['Wrong order', 'Got someone else\'s order.']]); o.issue = { type, note, at: createdAt + 50 * 6e4, state: 'open' }; }
          out.push(o);
        } else if (kind === 'market') {
          const pack = pick(r, SN.MARKET_PACKS);
          const items = pack.items.map(([name, qty, unit]) => ({ name, qty, unit }));
          const o = { ...base, kind: 'market', items, when: 'Tomorrow', fees: { ...SN.MARKET_FEES } };
          if (ageMin < 240) { o.stage = 0; }
          else {
            const lines = items.map(l => { const s = SN.STAPLES.find(([n]) => n === l.name); return { ...l, price: Math.round(((s ? s[2] : 2500) * l.qty * (0.9 + r() * 0.25)) / 50) * 50 }; });
            o.quote = SN.orders.buildQuote(o, lines); o.total = o.quote.total; o.paidAt = createdAt + 2 * 36e5; o.status = 'delivered';
          }
          out.push(o);
        } else if (kind === 'laundry') {
          const pool = SN.LAUNDRY.flatMap(g => g.items);
          const items = [...new Map(Array.from({ length: 1 + Math.floor(r() * 3) }, () => pick(r, pool)).map(i => [i.id, i])).values()]
            .map(i => { const qty = 1 + Math.floor(r() * 3); return { id: i.id, name: i.name, qty, unit: i.price, total: i.price * qty }; });
          const subtotal = items.reduce((s, i) => s + i.total, 0);
          const o = { ...base, kind: 'laundry', items, express: r() < 0.2, slot: 'Tomorrow, morning (8 – 11am)', subtotal, fee: 1000, total: subtotal + 1000 };
          if (o.express) { o.fee += 1500; o.total += 1500; }
          if (ageMin < 48 * 60) o.stage = Math.min(3, Math.floor(ageMin / (14 * 60))); else o.status = 'delivered';
          out.push(o);
        } else {
          const dom = r() < 0.7;
          const from = pick(r, ['PHC', 'QOW', 'ENU', 'ABV']);
          const to = dom ? pick(r, ['LOS', 'ABV'].filter(x => x !== from)) : pick(r, ['LHR', 'DXB', 'ACC', 'YYZ']);
          const o = { ...base, kind: 'flight', trip: 'return', from, to, depart: 'Fri 19 Dec', ret: 'Sun 11 Jan', pax: 1, airline: 'any', concierge: r() < 0.4 };
          if (ageMin < 360) o.stage = 0;
          else { const fare = Math.round((dom ? 180000 : 1500000) * (0.85 + r() * 0.4) / 500) * 500; o.options = SN.orders.labelOptions([{ airline: dom ? 'Air Peace' : 'Emirates', depart: '09:15', duration: dom ? 65 : 420, stops: 0, fare, usual: Math.round(fare * 1.25) }]); o.choice = 0; o.total = fare + (o.concierge ? SN.CONCIERGE_FEE : 0); o.paidAt = createdAt + 5 * 36e5; o.status = 'delivered'; }
          out.push(o);
        }
      }
    }
    return { orders: out, students };
  }

  // ---- Orders: synthetic + real, with admin patches -----------------------------
  const patches = () => local.get('sn.admin.patches', {});
  function all() {
    if (!cache) cache = synthesize();
    const p = patches();
    const synth = cache.orders.map(o => (p[o.id] ? { ...o, ...p[o.id] } : o));
    const real = SN.orders.all().map(o => ({ ...o, real: true, customer: o.customer || 'YOU', contact: o.contact || { name: 'You (this browser)', phone: o.address?.phone } }));
    return [...real, ...synth].sort((a, b) => b.createdAt - a.createdAt);
  }
  const get = id => all().find(o => o.id === id);
  // Apply a change to one order and record it in the audit log.
  function update(id, fn, action, detail) {
    const o = get(id);
    if (!o) return;
    if (o.real) SN.orders.update(id, x => fn(x));
    else { const next = fn(o); local.set('sn.admin.patches', { ...patches(), [id]: next }); }
    if (action) audit.log(action, id, detail);
  }

  // ---- Refunds --------------------------------------------------------------------------
  // Refunds above the threshold need a second admin, never the one who asked.
  // A full refund marks the order refunded; a partial one leaves it delivered.
  function refund(id, amount, reason) {
    const o = get(id);
    const limit = SN.settings.get().refundThreshold;
    const max = (o.total || 0) - (o.refund && o.refund.state !== 'pending' && o.refund.state !== 'rejected' ? o.refund.amount : 0);
    amount = Math.max(0, Math.min(Math.round(amount), max));
    if (!amount) return 'none';
    const pending = amount > limit;
    update(id, x => {
      const next = { ...x, refund: { amount, reason, at: Date.now(), requestedBy: user().name, state: pending ? 'pending' : 'approved', approvedBy: pending ? null : user().name } };
      if (!pending && amount >= (x.total || 0)) { next.status = 'refunded'; next.refundNote = `Refunded ${money(amount)}. ${reason}`; }
      return next;
    }, pending ? 'Requested refund' : 'Refunded', `${money(amount)} · ${reason}${pending ? ' · needs a second admin' : ''}`);
    return pending ? 'pending' : 'approved';
  }
  function decideRefund(id, approve) {
    update(id, x => {
      const r = { ...x.refund, state: approve ? 'approved' : 'rejected', approvedBy: user().name, decidedAt: Date.now() };
      const next = { ...x, refund: r };
      if (approve && r.amount >= (x.total || 0)) { next.status = 'refunded'; next.refundNote = `Refunded ${money(r.amount)}. ${r.reason}`; }
      return next;
    }, approve ? 'Approved refund' : 'Rejected refund', `${money(get(id).refund.amount)} requested by ${get(id).refund.requestedBy}`);
  }
  // Move an order to a step (sandbox control). The last step closes it.
  function setStage(id, index) {
    const o = get(id);
    const flow = SN.orders.flow(o);
    update(id, x => {
      const times = { ...(x.stageTimes || {}), [index]: Date.now() };
      return index >= flow.length - 1 ? { ...x, stage: undefined, status: 'delivered', stageTimes: times } : { ...x, stage: index, stageTimes: times };
    }, 'Moved order', `${flow[Math.max(0, SN.orders.progress(o).index)]?.label || 'Start'} → ${flow[Math.min(index, flow.length - 1)].label}`);
  }

  // ---- Metrics -------------------------------------------------------------------------
  const kind = o => SN.orders.kind(o);
  const paid = o => o.status !== 'cancelled' && (kind(o) === 'food' || kind(o) === 'laundry' || o.paidAt || o.status === 'delivered');
  const value = o => (paid(o) ? (o.total || 0) : 0);
  const refunded = o => (o.refund && o.refund.state !== 'pending' ? o.refund.amount : 0);
  const live = o => { const p = SN.orders.progress(o); return !p.done && p.index >= 0; };
  const range = days => { const end = Date.now(); const start = new Date(); start.setHours(0, 0, 0, 0); return { start: start.getTime() - (days - 1) * DAY, end, days }; };
  const between = (list, { start, end }) => list.filter(o => o.createdAt >= start && o.createdAt <= end);
  const previous = r => ({ start: r.start - r.days * DAY, end: r.start - 1, days: r.days });

  function summarize(list) {
    const counted = list.filter(paid);
    const gross = counted.reduce((s, o) => s + value(o), 0);
    const refunds = list.reduce((s, o) => s + refunded(o), 0);
    const food = counted.filter(o => kind(o) === 'food' && o.timings);
    return {
      orders: counted.length, gross, refunds, net: gross - refunds,
      // Average order is food only: one flight would swamp a week of jollof.
      aov: (() => { const f = counted.filter(o => kind(o) === 'food'); return f.length ? f.reduce((x, o) => x + value(o), 0) / f.length : 0; })(),
      refundRate: counted.length ? list.filter(o => refunded(o) > 0).length / counted.length : 0,
      delivery: food.length ? food.reduce((s, o) => s + o.timings.accept + o.timings.prep + o.timings.ride, 0) / food.length : 0,
      customers: new Set(counted.map(o => o.customer)).size
    };
  }
  // One bucket per day in the range.
  function byDay(list, r, fn) {
    const days = [];
    for (let t = r.start; t <= r.end; t += DAY) days.push({ t, items: [] });
    list.forEach(o => { const i = Math.floor((o.createdAt - r.start) / DAY); if (days[i]) days[i].items.push(o); });
    return days.map(d => ({ t: d.t, v: fn(d.items) }));
  }

  // ---- Formatting ------------------------------------------------------------------------
  const compact = n => (n >= 1e6 ? `₦${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}m` : n >= 1e4 ? `₦${Math.round(n / 1e3)}k` : money(n));
  const pct = n => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;
  const dayLabel = t => new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  const timeLabel = t => new Date(t).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const outletName = id => SN.outlets.find(id)?.name || '—';
  const statusOf = o => {
    const p = SN.orders.progress(o);
    if (p.final === 'refunded') return ['refund', 'Refunded'];
    if (p.final === 'cancelled') return ['off', 'Cancelled'];
    if (p.done) return ['done', SN.orders.flow(o)[SN.orders.flow(o).length - 1].label];
    if (p.awaitingPayment) return ['action', 'Awaiting payment'];
    return ['live', p.step.label];
  };
  const pill = o => { const [c, t] = statusOf(o); return h('span', { class: `spill spill--${c}` }, c === 'live' ? h('span', { class: 'spill__pulse' }) : c === 'done' ? icon('check') : null, t); };

  // ---- Shell ------------------------------------------------------------------------------
  const NAV = [
    ['overview', 'index.html', 'Overview', 'chart', true],
    ['orders', 'orders.html', 'Orders', 'receipt'],
    ['requests', 'requests.html', 'Requests', 'basket'],
    ['support', 'support.html', 'Issues & refunds', 'alert'],
    ['reports', 'reports.html', 'Attribution report', 'shield', true],
    ['menu', 'menu.html', 'Outlets & menu', 'flame'],
    ['audit', 'audit.html', 'Audit log', 'lock'],
    ['settings', 'settings.html', 'Settings', 'refresh']
  ];
  function counts() {
    const list = all();
    return {
      orders: list.filter(live).length,
      requests: list.filter(o => (kind(o) === 'market' && !o.quote && !o.paidAt && !o.status) || (kind(o) === 'flight' && !o.options && !o.paidAt && !o.status) || (kind(o) === 'laundry' && live(o) && (o.stage ?? 0) < 1)).length,
      support: list.filter(o => o.issue && o.issue.state === 'open').length + list.filter(o => o.refund && o.refund.state === 'pending').length
    };
  }

  function shell({ page, title, sub, ranges }) {
    document.body.classList.add('adm');
    const u = user();
    const c = counts();
    const allowed = can() || NAV.find(n => n[0] === page)?.[4];
    const nav = h('nav', { class: 'adm-nav', 'aria-label': 'Admin' }, NAV.filter(n => can() || n[4]).map(([id, href, label, ic]) =>
      h('a', { href, 'aria-current': id === page ? 'page' : null }, icon(ic), h('span', { text: label }), c[id] ? h('b', { class: 'adm-nav__n', text: String(c[id]) }) : null)));
    const who = h('div', { class: 'select adm-who' },
      h('select', { 'aria-label': 'Signed in as', onchange: e => { local.set('sn.admin.user', e.target.value); audit.log('Switched account', 'session', `Now ${ACCOUNTS.find(a => a.id === e.target.value).name}`); location.reload(); } },
        ACCOUNTS.map(a => h('option', { value: a.id, selected: a.id === u.id, text: `${a.name} · ${a.title}` }))), icon('chev', 'i select__chev'));
    const side = h('aside', { class: 'adm-side' },
      h('a', { class: 'mark mark--foot adm-mark', href: '../index.html', 'aria-label': 'Supernova site' },
        h('span', { class: 'mark__tile', 'aria-hidden': 'true' }, icon('nova', '')), h('span', { class: 'mark__word', 'aria-hidden': 'true' }, 'Super', h('em', { text: 'nova' }))),
      h('span', { class: 'adm-badge', text: can() ? 'Admin' : 'Viewer' }),
      nav,
      h('div', { class: 'adm-side__foot' }, h('p', { class: 'adm-env' }, h('span', { class: 'spill__pulse' }), 'Sandbox · demo data'), h('a', { href: '../index.html', class: 'adm-back' }, icon('back'), 'Back to the site')));
    const rangeSel = ranges ? h('div', { class: 'adm-range', role: 'group', 'aria-label': 'Date range' },
      [['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['60', '60 days']].map(([v, l]) => h('a', { href: `?range=${v}`, 'aria-current': String(currentRange()) === v ? 'true' : null, text: l }))) : null;
    const top = h('header', { class: 'adm-top' },
      h('details', { class: 'adm-menu' }, h('summary', { 'aria-label': 'Menu' }, icon('menu')), h('div', { class: 'adm-menu__panel' }, nav.cloneNode(true))),
      h('div', { class: 'adm-top__title' }, h('h1', { text: title }), sub ? h('p', { text: sub }) : null),
      rangeSel,
      h('div', { class: 'adm-top__who' }, h('span', { class: 'adm-avatar', text: u.name[0] }), who));
    const main = h('main', { class: 'adm-main', id: 'main' });
    document.body.prepend(h('div', { class: 'adm-wrap' }, side, h('div', { class: 'adm-body' }, top, main)));
    if (!allowed) {
      main.append(h('div', { class: 'adm-panel adm-noaccess' }, icon('lock'), h('h2', { text: 'Read-only account' }),
        h('p', { text: 'Viewer accounts can see the overview and the attribution report. Switch to an admin account to manage orders, refunds and menus.' }),
        h('a', { class: 'btn btn--primary', href: 'reports.html' }, 'Open the attribution report', icon('arrow'))));
      return null;
    }
    return main;
  }
  const currentRange = () => Number(new URLSearchParams(location.search).get('range')) || 30;

  // Small building blocks used by every page.
  const panel = (title, body, opts = {}) => h('section', { class: `adm-panel ${opts.cls || ''}` },
    title ? h('div', { class: 'adm-panel__head' }, h('h2', { text: title }), opts.aside || null) : null, body);
  const tile = ({ label, value: v, delta, good = 'up', spark, hint }) => {
    let deltaEl = null;
    if (delta != null && isFinite(delta)) {
      const up = delta >= 0;
      const isGood = (good === 'up') === up;
      deltaEl = h('span', { class: `adm-delta ${Math.abs(delta) < 0.005 ? '' : isGood ? 'is-good' : 'is-bad'}` },
        icon(up ? 'arrowup' : 'arrowdown'), `${up ? '+' : ''}${(delta * 100).toFixed(1)}%`, h('small', { text: ' vs previous' }));
    }
    return h('div', { class: 'adm-tile' }, h('p', { class: 'adm-tile__k', text: label }), h('p', { class: 'adm-tile__v', text: v }), deltaEl,
      hint ? h('p', { class: 'adm-tile__hint', text: hint }) : null, spark || null);
  };
  const change = (a, b) => (b ? (a - b) / b : null);
  const csv = (rows, name) => {
    const text = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/csv' })), download: name });
    document.body.append(a); a.click(); a.remove();
  };

  SN.admin = { ACCOUNTS, user, can, audit, all, get, update, refund, decideRefund, setStage, students: () => (cache || (cache = synthesize())).students,
    kind, paid, value, refunded, live, range, between, previous, summarize, byDay, compact, pct, dayLabel, timeLabel, outletName,
    statusOf, pill, shell, currentRange, panel, tile, change, csv, DAY };
})();
