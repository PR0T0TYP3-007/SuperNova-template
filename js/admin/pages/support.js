// Admin issues & refunds: problems students report, refunds waiting for a
// second admin, recent refunds and payment disputes.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon, money } = SN.ui;
  const main = A.shell({ page: 'support', title: 'Issues & refunds', sub: 'Problems students report, and the money that goes back' });
  if (!main) return;
  const host = h('div', { class: 'adm-grid' });
  main.append(host);

  // Sample chargebacks, standing in for payment-provider dispute events.
  const DISPUTES_KEY = 'sn.admin.disputes';
  const disputes = () => SN.store.local.get(DISPUTES_KEY, null) || [
    { id: 'DSP-2041', order: 'SN-1187', amount: 9800, reason: 'Customer says they didn\'t make this payment', due: Date.now() + 4 * A.DAY, state: 'Evidence needed' },
    { id: 'DSP-2033', order: 'SN-1092', amount: 6300, reason: 'Order not received', due: Date.now() + 9 * A.DAY, state: 'Evidence needed' }
  ];

  function draw() {
    const all = A.all();
    const issues = all.filter(o => o.issue && o.issue.state === 'open');
    const waiting = all.filter(o => o.refund && o.refund.state === 'pending');
    const recent = all.filter(o => o.refund && o.refund.state === 'approved').sort((a, b) => (b.refund.at || 0) - (a.refund.at || 0)).slice(0, 15);
    const me = A.user().name;

    const issueCard = o => {
      const amount = h('input', { class: 'adm-input adm-input--sm', type: 'number', min: 0, step: 100, value: A.kind(o) === 'food' ? (o.items?.[0]?.total || o.total) : o.total, 'aria-label': 'Refund amount' });
      const reply = h('input', { class: 'adm-input', type: 'text', placeholder: 'Note to the student (optional)', 'aria-label': 'Note', style: 'flex:1 1 200px' });
      const close = (refundIt) => {
        if (refundIt) A.refund(o.id, Number(amount.value), `${o.issue.type}${reply.value ? ': ' + reply.value : ''}`);
        A.update(o.id, x => ({ ...x, issue: { ...x.issue, state: 'resolved', resolvedBy: me, reply: reply.value.trim() } }), 'Resolved issue', `${o.id} · ${refundIt ? 'with refund' : 'no refund'}`);
        draw();
      };
      return h('article', { class: 'adm-card' },
        h('div', { class: 'adm-card__head' }, h('h3', { text: o.issue.type }), SN.ui.orderTag(o), h('a', { class: 'linkish', href: `orders.html?id=${o.id}&range=60`, text: o.id })),
        h('p', { class: 'adm-card__meta' }, h('span', { text: o.contact?.name || '—' }), h('span', { text: o.address?.hostel || '' }), h('span', { text: `Reported ${A.timeLabel(o.issue.at || o.createdAt)}` }), h('span', { text: `Paid ${money(o.total || 0)}` })),
        h('p', { class: 'adm-card__note', text: o.issue.note || 'No details given.' }),
        h('ul', { class: 'adm-lines' }, (o.items || []).slice(0, 4).map(i => h('li', null, h('span', { text: `${i.qty}× ${i.name}` }), h('span', { text: i.total ? money(i.total) : '' })))),
        h('div', { class: 'adm-card__acts' }, reply),
        h('div', { class: 'adm-card__acts' }, 'Refund ₦', amount,
          h('button', { class: 'btn', type: 'button', onclick: () => close(false) }, 'Resolve, no refund'),
          h('button', { class: 'btn btn--loud', type: 'button', onclick: () => close(true) }, 'Refund and resolve')));
    };

    host.replaceChildren(
      A.panel(`Open issues (${issues.length})`, issues.length ? h('div', { class: 'adm-cards' }, issues.map(issueCard)) : h('div', { class: 'adm-empty' }, icon('check'), h('p', { text: 'No open issues. Nice.' }))),
      h('section', { id: 'refunds' }, A.panel(`Refunds waiting for a second admin (${waiting.length})`, waiting.length ? h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
        h('thead', null, h('tr', null, ['Order', 'Amount', 'Reason', 'Asked by', ''].map((c, i) => h('th', { class: i === 1 ? 'num' : null, text: c })))),
        h('tbody', null, waiting.map(o => h('tr', null,
          h('td', null, h('b', { text: o.id })), h('td', { class: 'num' }, h('b', { text: money(o.refund.amount) })), h('td', { text: o.refund.reason }), h('td', { text: o.refund.requestedBy }),
          h('td', null, o.refund.requestedBy === me
            ? h('span', { class: 'muted', text: 'Needs a different admin. Switch account to approve.' })
            : h('div', { class: 'adm-acts' },
              h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { A.decideRefund(o.id, false); draw(); } }, 'Reject'),
              h('button', { class: 'btn btn--sm btn--loud', type: 'button', onclick: () => { A.decideRefund(o.id, true); SN.ui.toast('Refund approved'); draw(); } }, 'Approve'))))))))
        : h('div', { class: 'adm-empty' }, h('p', { text: `Nothing waiting. Refunds over ${money(SN.settings.get().refundThreshold)} land here for a second admin.` })))),
      A.panel('Recent refunds', h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
        h('thead', null, h('tr', null, ['Order', 'When', 'Amount', 'Reason', 'Approved by'].map((c, i) => h('th', { class: i === 2 ? 'num' : null, text: c })))),
        h('tbody', null, recent.map(o => h('tr', null, h('td', null, h('b', { text: o.id })), h('td', { class: 'muted', text: A.timeLabel(o.refund.at || o.createdAt) }), h('td', { class: 'num', text: money(o.refund.amount) }), h('td', { text: o.refund.reason }), h('td', { text: o.refund.approvedBy || 'System' }))))))),
      A.panel('Payment disputes', h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
        h('thead', null, h('tr', null, ['Dispute', 'Order', 'Amount', 'Reason', 'Evidence due', 'Status', ''].map((c, i) => h('th', { class: i === 2 ? 'num' : null, text: c })))),
        h('tbody', null, disputes().map((d, i) => h('tr', null, h('td', null, h('b', { text: d.id })), h('td', { text: d.order }), h('td', { class: 'num', text: money(d.amount) }), h('td', { text: d.reason }), h('td', { class: 'muted', text: A.dayLabel(d.due) }),
          h('td', null, h('span', { class: `spill ${d.state === 'Evidence sent' ? 'spill--done' : 'spill--action'}`, text: d.state })),
          h('td', null, d.state === 'Evidence sent' ? null : h('button', { class: 'btn btn--sm', type: 'button', onclick: () => {
            const list = disputes(); list[i] = { ...d, state: 'Evidence sent' }; SN.store.local.set(DISPUTES_KEY, list);
            A.audit.log('Sent dispute evidence', d.id, `${d.order} · order, items, status history and delivery time`); draw();
          } }, 'Send evidence'))))))),
        { aside: h('span', { class: 'muted', text: 'Refunds on a disputed payment are frozen until it closes.' }) }));
  }
  draw();
});
