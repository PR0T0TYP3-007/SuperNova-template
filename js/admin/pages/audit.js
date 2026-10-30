// Audit log: who did what and when. Append-only; nothing here can be edited.
document.addEventListener('DOMContentLoaded', () => {
  const A = SN.admin, { h, icon } = SN.ui;
  const main = A.shell({ page: 'audit', title: 'Audit log', sub: 'Every admin action, newest first. Nobody can edit or delete it.' });
  if (!main) return;

  let actor = 'all';
  const body = h('tbody');
  const actors = [...new Set(A.audit.all().map(e => e.actor))];
  main.append(A.panel(null, h('div', { class: 'adm-grid', style: 'gap:14px' },
    h('div', { class: 'adm-filters' }, h('div', { class: 'select' },
      h('select', { 'aria-label': 'Filter by person', onchange: e => { actor = e.target.value; draw(); } },
        h('option', { value: 'all', text: 'Everyone' }), actors.map(a => h('option', { value: a, text: a }))), icon('chev', 'i select__chev'))),
    h('div', { class: 'adm-table-wrap' }, h('table', { class: 'adm-table' },
      h('thead', null, h('tr', null, ['When', 'Who', 'Action', 'On', 'Details'].map(c => h('th', { text: c })))), body)))));

  function draw() {
    const list = A.audit.all().filter(e => actor === 'all' || e.actor === actor);
    body.replaceChildren(...(list.length ? list.map(e => h('tr', null,
      h('td', { class: 'muted', text: A.timeLabel(e.at) }),
      h('td', null, h('b', { text: e.actor }), h('div', { class: 'muted', text: e.role })),
      h('td', { text: e.action }),
      h('td', { text: e.entity || '' }),
      h('td', { text: e.detail || '' })))
      : [h('tr', null, h('td', { colspan: 5 }, h('div', { class: 'adm-empty' }, icon('lock'), h('p', { text: 'Nothing logged yet. Actions you take in admin will appear here.' }))))]));
  }
  draw();
});
