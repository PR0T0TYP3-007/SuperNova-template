// Settings: sandbox autopilot, refund approval limit, fees, demo reset.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon, money } = SN.ui;
  const main = A.shell({ page: 'settings', title: 'Settings', sub: 'How the sandbox behaves' });
  if (!main) return;
  const s = SN.settings.get();

  const auto = h('input', { type: 'checkbox', checked: s.autopilot, onchange: e => { SN.settings.set({ autopilot: e.target.checked }); A.audit.log('Changed setting', 'autopilot', e.target.checked ? 'On' : 'Off'); SN.ui.toast(`Autopilot ${e.target.checked ? 'on' : 'off'}`); } });
  const limit = h('input', { class: 'adm-input adm-input--sm', type: 'number', min: 0, step: 1000, value: s.refundThreshold, 'aria-label': 'Refund approval limit' });
  const reset = h('button', { class: 'btn', type: 'button', onclick: e => {
    const b = e.currentTarget;
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Tap again to reset everything'; return; }
    ['sn.admin.patches', 'sn.admin.audit', 'sn.admin.disputes', 'sn.outlets.state', 'sn.menu.off', 'sn.settings'].forEach(k => localStorage.removeItem(k));
    location.reload();
  } }, icon('refresh'), 'Reset admin demo data');

  main.append(
    A.panel('Sandbox autopilot', h('div', { class: 'adm-grid', style: 'gap:10px' },
      h('label', { class: 'adm-switch' }, auto, h('span', { class: 'adm-switch__ui', 'aria-hidden': 'true' }), 'Advance orders and answer requests automatically'),
      h('p', { class: 'adm-sandbox', text: 'On: food and laundry orders move along on timers, and market quotes and flight shortlists appear by themselves. Off: nothing moves until someone acts in Orders or Requests. Sandbox only; in production restaurant webhooks drive food orders.' }))),
    A.panel('Refund approvals', h('div', { class: 'adm-acts', style: 'align-items:center' },
      'Refunds above ₦', limit, 'need a second admin.',
      h('button', { class: 'btn btn--sm btn--primary', type: 'button', onclick: () => { SN.settings.set({ refundThreshold: Number(limit.value) || 0 }); A.audit.log('Changed setting', 'refund limit', money(Number(limit.value) || 0)); SN.ui.toast('Saved'); } }, 'Save'))),
    A.panel('Fees (placeholders)', h('ul', { class: 'adm-lines' },
      h('li', null, h('span', { text: 'Food delivery, Crunchies' }), h('b', { text: money(SN.KITCHENS.crunchies.fee) })),
      h('li', null, h('span', { text: 'Food delivery, Roots' }), h('b', { text: money(SN.KITCHENS.roots.fee) })),
      h('li', null, h('span', { text: 'Market run service fee + delivery' }), h('b', { text: `${money(SN.MARKET_FEES.service)} + ${money(SN.MARKET_FEES.delivery)}` })),
      h('li', null, h('span', { text: 'Laundry pickup, express extra' }), h('b', { text: `${money(SN.LAUNDRY_FEES.pickup)}, +${money(SN.LAUNDRY_FEES.express)}` })),
      h('li', null, h('span', { text: 'Flight concierge pick-up' }), h('b', { text: money(SN.CONCIERGE_FEE) }))),
      { aside: h('span', { class: 'muted', text: 'Edit in js/data.js' }) }),
    A.panel('Demo data', h('div', { class: 'adm-grid', style: 'gap:10px' },
      h('p', { class: 'adm-sandbox', text: 'Clears admin changes, the audit log, outlet and menu switches, and settings. Orders placed on the customer site are kept.' }), h('div', null, reset))));
});
