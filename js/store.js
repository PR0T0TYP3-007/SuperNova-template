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
  const KEY_ORDERS = 'sn.orders';
  const all = () => local.get(KEY_ORDERS, []);
  const newId = () => 'SN-' + Math.floor(1000 + Math.random() * 9000) + String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const snapshot = (k, lines) => lines.map(l => {
    const it = item(k, l.id);
    const unit = unitPrice(k, l);
    return { id: l.id, name: it.name, img: it.img, qty: l.qty, unit, opts: optionsFor(k, l).map(o => o.label), total: unit * l.qty };
  });

  const orders = {
    all: () => all().sort((a, b) => b.createdAt - a.createdAt),
    get: id => all().find(o => o.id === id),
    place(k, address) {
      const lines = cart.lines(k);
      if (!lines.length) return null;
      const t = cart.totals(k);
      const order = {
        id: newId(), kitchen: k, items: snapshot(k, lines),
        subtotal: t.subtotal, fee: t.fee, total: t.total,
        address, createdAt: Date.now(), source: 'supernova', environment: 'sandbox'
      };
      local.set(KEY_ORDERS, [order, ...all()]);
      cart.clear(k);
      return order;
    },
    // A fixed `status` wins (past demo orders, cancellations); otherwise the
    // sandbox advances it on a timer, standing in for restaurant webhooks.
    progress(order) {
      const flow = SN.STATUS_FLOW;
      if (order.status === 'cancelled' || order.status === 'refunded') return { index: -1, step: null, done: true, final: order.status };
      if (order.status === 'delivered') return { index: flow.length - 1, step: flow[flow.length - 1], done: true, final: 'delivered' };
      const secs = (Date.now() - order.createdAt) / 1000;
      let index = 0;
      flow.forEach((s, i) => { if (secs >= s.at) index = i; });
      return { index, step: flow[index], done: index === flow.length - 1, final: index === flow.length - 1 ? 'delivered' : null };
    },
    report(id, issue) {
      local.set(KEY_ORDERS, all().map(o => o.id === id ? { ...o, issue: { ...issue, at: Date.now(), state: 'in_review' } } : o));
      emit();
    },
    reorder(id) {
      const o = orders.get(id);
      if (!o) return 0;
      let added = 0;
      o.items.forEach(i => { if (cart.add(o.kitchen, i.id, [], i.qty)) added += i.qty; });
      return added;
    },
    // A few past orders so the Orders page has something to show on a fresh
    // template. Marked `demo` so they're easy to strip out.
    seedDemo() {
      if (local.get('sn.seeded', false)) return;
      const day = 864e5;
      const mk = (k, ids, daysAgo, status, extra = {}) => {
        const lines = ids.map(([id, qty]) => ({ key: id, id, opts: [], qty }));
        const items = snapshot(k, lines);
        const subtotal = items.reduce((s, i) => s + i.total, 0);
        return { id: newId(), kitchen: k, items, subtotal, fee: 800, total: subtotal + 800, status, demo: true,
          address: { campus: 'Northgate University', hostel: 'Cedar Hall', block: 'C', room: '214' }, createdAt: Date.now() - daysAgo * day, ...extra };
      };
      local.set(KEY_ORDERS, [
        ...all(),
        mk('roots', [['jollof-skewers', 1], ['smoothie', 1]], 2, 'delivered'),
        mk('crunchies', [['crunchy-3', 2], ['fries', 1], ['shake-oreo', 1]], 5, 'delivered'),
        mk('roots', [['egusi', 1]], 9, 'refunded', { refundNote: 'Refunded ₦7,800: kitchen closed early' }),
        mk('crunchies', [['shawarma', 2]], 14, 'delivered')
      ]);
      local.set('sn.seeded', true);
    }
  };

  const address = {
    get: () => session.get('sn.address', null),
    set: a => session.set('sn.address', a)
  };

  Object.assign(SN, { item, unitPrice, optionsFor, cart, orders, address, onChange: fn => listeners.add(fn) });
})();
