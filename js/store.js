// Supernova template state: carts, orders and the saved delivery address.
//
// This is a stand-in for the API so the template works on its own. Each
// function maps to an endpoint in the design document (PUT /cart,
// POST /checkout, GET /orders). When the backend exists, replace the bodies
// and keep the signatures. Note the server must re-price every cart; the
// totals here are for display only.
(() => {
  const mem = {};
  const box = (area) => ({
    get(key, fallback) {
      try { const v = window[area].getItem(key); return v == null ? fallback : JSON.parse(v); }
      catch { return key in mem ? mem[key] : fallback; }
    },
    set(key, value) {
      try { window[area].setItem(key, JSON.stringify(value)); }
      catch { mem[key] = value; }
    }
  });
  const local = box('localStorage');
  // Personal details stay in the tab only, never in long-lived storage.
  const session = box('sessionStorage');

  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn());
  addEventListener('storage', e => { if (e.key && e.key.startsWith('sn.')) emit(); });

  // ---- Menu lookups ------------------------------------------------------
  const item = (k, id) => SN.MENU[k]?.items.find(i => i.id === id);
  const optionsFor = (k, line) => {
    const it = item(k, line.id);
    if (!it) return [];
    return (it.groups || []).flatMap(g => g.options.filter(o => line.opts.includes(`${g.id}:${o.id}`)));
  };
  const unitPrice = (k, line) => {
    const it = item(k, line.id);
    return it ? it.price + optionsFor(k, line).reduce((s, o) => s + o.price, 0) : 0;
  };

  // ---- Carts: one per kitchen. Crunchies and Roots never share a cart. ----
  const KEY_CARTS = 'sn.carts';
  const carts = () => {
    const c = local.get(KEY_CARTS, {});
    return { crunchies: c.crunchies || [], roots: c.roots || [] };
  };
  const saveCarts = c => { local.set(KEY_CARTS, c); emit(); };
  const lineKey = (id, opts) => [id, ...[...opts].sort()].join('|');

  const cart = {
    lines: k => carts()[k],
    add(k, id, opts = [], qty = 1) {
      const it = item(k, id);
      if (!it || it.soldOut) return false;
      const c = carts();
      const key = lineKey(id, opts);
      const found = c[k].find(l => l.key === key);
      if (found) found.qty = Math.min(found.qty + qty, 20);
      else c[k].push({ key, id, opts: [...opts], qty });
      saveCarts(c);
      return true;
    },
    setQty(k, key, qty) {
      const c = carts();
      c[k] = qty <= 0 ? c[k].filter(l => l.key !== key) : c[k].map(l => l.key === key ? { ...l, qty: Math.min(qty, 20) } : l);
      saveCarts(c);
    },
    clear(k) { const c = carts(); c[k] = []; saveCarts(c); },
    count: k => carts()[k].reduce((s, l) => s + l.qty, 0),
    countAll: () => cart.count('crunchies') + cart.count('roots'),
    totals(k) {
      const subtotal = carts()[k].reduce((s, l) => s + unitPrice(k, l) * l.qty, 0);
      const fee = subtotal ? SN.KITCHENS[k].fee : 0;
      return { subtotal, fee, total: subtotal + fee };
    }
  };

  // ---- Orders ------------------------------------------------------------
  // Four kinds share one list: `food` (a kitchen order), `market` (a
  // shopping list priced by a quote), `laundry` (a dry-cleaning pickup) and
  // `flight` (a trip request answered with a shortlist of deals).
  const KEY_ORDERS = 'sn.orders';
  const all = () => local.get(KEY_ORDERS, []);
  const save = list => { local.set(KEY_ORDERS, list); emit(); };
  const patch = (id, fn) => save(all().map(o => o.id === id ? fn(o) : o));
  const newId = () => 'SN-' + Math.floor(1000 + Math.random() * 9000) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const kindOf = o => o.kind || 'food';
  // Kinds that pause after step two until the student picks and pays.
  const quoted = o => kindOf(o) === 'market' || kindOf(o) === 'flight';

  const snapshot = (k, lines) => lines.map(l => {
    const it = item(k, l.id);
    const unit = unitPrice(k, l);
    return { id: l.id, name: it.name, img: it.img, qty: l.qty, unit, opts: optionsFor(k, l).map(o => o.label), total: unit * l.qty };
  });

  // Sandbox quote: a rough per-unit estimate, standing in for the partner
  // vendor's real prices on the day.
  const estimate = line => {
    const known = SN.STAPLES.find(([n]) => n.toLowerCase() === line.name.toLowerCase());
    return Math.round(((known ? known[2] : 2500) * line.qty) / 50) * 50;
  };
  const laundryItem = id => SN.LAUNDRY.flatMap(g => g.items).find(i => i.id === id);

  const orders = {
    all: () => all().sort((a, b) => b.createdAt - a.createdAt),
    get: id => all().find(o => o.id === id),
    kind: kindOf,

    place(k, address) {
      const lines = cart.lines(k);
      if (!lines.length) return null;
      const t = cart.totals(k);
      const order = {
        id: newId(), kind: 'food', kitchen: k, items: snapshot(k, lines),
        subtotal: t.subtotal, fee: t.fee, total: t.total,
        address, createdAt: Date.now(), source: 'supernova', environment: 'sandbox'
      };
      save([order, ...all()]);
      cart.clear(k);
      return order;
    },

    // POST /market-requests. No money moves until the quote is approved.
    requestMarket({ items, budget, when, note, address }) {
      const order = {
        id: newId(), kind: 'market', items, budget: budget || null, when, note, address,
        fees: { ...SN.MARKET_FEES }, createdAt: Date.now(), source: 'supernova', environment: 'sandbox'
      };
      save([order, ...all()]);
      return order;
    },
    // The quote appears once the sandbox reaches "Quote ready".
    quote(o) {
      if (kindOf(o) !== 'market') return null;
      if (o.quote) return o.quote;
      if (orders.progress(o).index < 1) return null;
      const lines = o.items.map(l => ({ ...l, price: estimate(l) }));
      const items = lines.reduce((s, l) => s + l.price, 0);
      return { lines, items, service: o.fees.service, delivery: o.fees.delivery, total: items + o.fees.service + o.fees.delivery };
    },
    approveQuote(id) {
      const o = orders.get(id);
      const q = o && orders.quote(o);
      if (!q) return;
      patch(id, x => ({ ...x, quote: q, total: q.total, paidAt: Date.now() }));
    },

    // POST /laundry-bookings. Priced after the rider counts the items.
    bookLaundry({ items, express, slot, note, address }) {
      const lines = items.map(([id, qty]) => { const it = laundryItem(id); return { id, name: it.name, qty, unit: it.price, total: it.price * qty }; });
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const fee = SN.LAUNDRY_FEES.pickup + (express ? SN.LAUNDRY_FEES.express : 0);
      const order = {
        id: newId(), kind: 'laundry', items: lines, express, slot, note, address,
        subtotal, fee, total: subtotal + fee, createdAt: Date.now(), source: 'supernova', environment: 'sandbox'
      };
      save([order, ...all()]);
      return order;
    },

    // POST /flight-requests. The travel team answers with a shortlist.
    requestFlight({ trip, from, to, depart, ret, pax, airline, concierge, note, address }) {
      const order = {
        id: newId(), kind: 'flight', trip, from, to, depart, ret: trip === 'return' ? ret : null, pax, airline, concierge, note, address,
        createdAt: Date.now(), source: 'supernova', environment: 'sandbox'
      };
      save([order, ...all()]);
      return order;
    },
    // Sandbox shortlist: three made-up options, stable per order, standing in
    // for the travel team's real picks.
    flightOptions(o) {
      if (kindOf(o) !== 'flight') return null;
      if (o.options) return o.options;
      if (orders.progress(o).index < 1) return null;
      const domestic = SN.DOMESTIC.includes(o.from) && SN.DOMESTIC.includes(o.to);
      const pool = SN.AIRLINES[domestic ? 'domestic' : 'international'];
      const preferred = o.airline && o.airline !== 'any' ? [o.airline] : [];
      let seed = [...o.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
      const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
      const base = domestic ? 85000 : 780000;
      const legs = o.trip === 'return' ? 2 : 1;
      const opts = [0, 1, 2].map(i => {
        const airline = preferred[0] && i < 2 ? preferred[0] : pool[Math.floor(rnd() * pool.length)];
        const h = 6 + Math.floor(rnd() * 13);
        const m = [0, 15, 30, 45][Math.floor(rnd() * 4)];
        const dur = domestic ? 55 + Math.floor(rnd() * 40) : 360 + Math.floor(rnd() * 600);
        const fare = Math.round((base * (0.85 + rnd() * 0.5) * legs) / 500) * 500;
        const usual = Math.round((fare * (1.18 + rnd() * 0.2)) / 500) * 500;
        const stops = domestic ? 0 : Math.floor(rnd() * 2);
        return { airline, depart: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, duration: dur, stops, fare: fare * o.pax, usual: usual * o.pax };
      }).sort((a, b) => a.fare - b.fare);
      // Label after sorting: cheapest first, then the quickest of the rest.
      const quickest = opts.slice(1).reduce((q, x) => (x.duration < q.duration ? x : q), opts[1]);
      return opts.map((x, i) => ({ ...x, tag: i === 0 ? 'Best price' : x === quickest ? 'Fastest' : 'Good timing' }));
    },
    chooseFlight(id, index) {
      const o = orders.get(id);
      const opts = o && orders.flightOptions(o);
      if (!opts) return;
      const pick = opts[index];
      const extra = o.concierge ? SN.CONCIERGE_FEE : 0;
      patch(id, x => ({ ...x, options: opts, choice: index, total: pick.fare + extra, paidAt: Date.now() }));
    },

    flow: o => SN.FLOWS[kindOf(o)],
    // A fixed `status` wins (past demo orders, refunds); otherwise the sandbox
    // advances it on a timer, standing in for partner webhooks. Market runs
    // pause at "Quote ready" until the student pays.
    progress(o) {
      const flow = orders.flow(o);
      const last = flow.length - 1;
      if (o.status === 'cancelled' || o.status === 'refunded') return { index: -1, step: null, done: true, final: o.status };
      if (o.status === 'delivered') return { index: last, step: flow[last], done: true, final: 'delivered' };
      const since = t => (Date.now() - t) / 1000;
      let index = 0;
      if (quoted(o)) {
        if (!o.paidAt) index = since(o.createdAt) >= flow[1].at ? 1 : 0;
        else { index = 2; for (let i = 3; i <= last; i++) if (since(o.paidAt) >= flow[i].at) index = i; }
      } else {
        flow.forEach((s, i) => { if (since(o.createdAt) >= s.at) index = i; });
      }
      const done = index === last;
      return { index, step: flow[index], done, final: done ? 'delivered' : null, awaitingPayment: quoted(o) && index === 1 && !o.paidAt };
    },
    // When each step happened (or will), for the tracker's timestamps.
    stepTime(o, i) {
      const flow = orders.flow(o);
      if (quoted(o)) return i < 2 ? o.createdAt + flow[i].at * 1000 : o.paidAt ? o.paidAt + flow[i].at * 1000 : null;
      return o.createdAt + flow[i].at * 1000;
    },
    report(id, issue) {
      patch(id, o => ({ ...o, issue: { ...issue, at: Date.now(), state: 'in_review' } }));
    },
    reorder(id) {
      const o = orders.get(id);
      if (!o || kindOf(o) !== 'food') return 0;
      let added = 0;
      o.items.forEach(i => { if (cart.add(o.kitchen, i.id, [], i.qty)) added += i.qty; });
      return added;
    },
    // A few past orders so the Orders page has something to show on a fresh
    // template. Marked `demo` so they're easy to strip out.
    seedDemo() {
      if (local.get('sn.seeded3', false)) return;
      const day = 864e5;
      const addr = { campus: 'Northgate University', hostel: 'Cedar Hall', block: 'C', room: '214' };
      const food = (k, ids, daysAgo, status, extra = {}) => {
        const lines = ids.map(([id, qty]) => ({ key: id, id, opts: [], qty }));
        const items = snapshot(k, lines);
        const subtotal = items.reduce((s, i) => s + i.total, 0);
        return { id: newId(), kind: 'food', kitchen: k, items, subtotal, fee: 800, total: subtotal + 800, status, demo: true, address: addr, createdAt: Date.now() - daysAgo * day, ...extra };
      };
      const mItems = SN.MARKET_PACKS[0].items.map(([name, qty, unit]) => ({ name, qty, unit }));
      const market = { id: newId(), kind: 'market', items: mItems, when: 'Saturday', address: addr, fees: { ...SN.MARKET_FEES }, status: 'delivered', demo: true, createdAt: Date.now() - 4 * day };
      market.quote = orders.quote({ ...market, status: undefined, createdAt: 0 });
      market.total = market.quote.total;
      market.paidAt = market.createdAt + 36e5;
      const laundry = { id: newId(), kind: 'laundry', items: [{ id: 'wash-fold', name: 'Wash & fold', qty: 2, unit: 3500, total: 7000 }, { id: 'native', name: 'Native wear / agbada', qty: 1, unit: 3000, total: 3000 }],
        express: false, slot: 'Tomorrow, morning', address: addr, subtotal: 10000, fee: 1000, total: 11000, status: 'delivered', demo: true, createdAt: Date.now() - 7 * day };
      const trip = { id: newId(), kind: 'flight', trip: 'return', from: 'PHC', to: 'LOS', depart: 'Fri 19 Dec', ret: 'Sun 11 Jan', pax: 1, airline: 'any', concierge: true,
        address: addr, status: 'delivered', demo: true, createdAt: Date.now() - 12 * day };
      trip.options = orders.flightOptions({ ...trip, status: undefined, createdAt: 0 });
      trip.choice = 0;
      trip.total = trip.options[0].fare + SN.CONCIERGE_FEE;
      trip.paidAt = trip.createdAt + 5 * 36e5;
      save([
        ...all().filter(o => !o.demo),
        food('roots', [['jollof-skewers', 1], ['smoothie', 1]], 2, 'delivered'),
        market,
        food('crunchies', [['crunchy-3', 2], ['fries', 1], ['shake-oreo', 1]], 5, 'delivered'),
        laundry,
        food('roots', [['egusi', 1]], 9, 'refunded', { refundNote: 'Refunded ₦7,800. The kitchen closed early.' }),
        trip
      ]);
      local.set('sn.seeded3', true);
    }
  };

  const address = {
    get: () => session.get('sn.address', null),
    set: a => session.set('sn.address', a)
  };

  Object.assign(SN, { item, unitPrice, optionsFor, cart, orders, address, onChange: fn => listeners.add(fn) });
})();
