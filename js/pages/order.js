// Order: confirmation and live tracking for one order.
document.addEventListener('DOMContentLoaded', () => {
  const { h, icon, money, img, param, empty, tag, when, toast } = SN.ui;
  const host = document.querySelector('[data-order]');
  const id = param('id');
  const isNew = param('new') === '1';

  if (!SN.orders.get(id)) {
    host.append(empty({ title: 'We couldn\'t find that order', body: 'It may belong to another account, or the link is incomplete.', cta: 'See your orders', href: 'orders.html', art: 'receipt' }));
    return;
  }

  const flow = SN.STATUS_FLOW;
  let timer;

  function render() {
    const o = SN.orders.get(id);
    const K = SN.KITCHENS[o.kitchen];
    const p = SN.orders.progress(o);
    document.body.dataset.kitchen = o.kitchen;
    document.title = `${o.id} — Supernova`;

    const finalLabel = { refunded: 'Refunded', cancelled: 'Cancelled', delivered: 'Delivered' }[p.final];
    const heading = finalLabel || p.step.label;
    const remaining = p.done ? 0 : Math.max(1, Math.ceil((flow[flow.length - 1].at - (Date.now() - o.createdAt) / 1000) / 60));
    const sub = p.final === 'refunded' ? (o.refundNote || 'Your money is on its way back.')
      : p.final === 'cancelled' ? 'This order was cancelled before the kitchen started.'
      : p.done ? `Delivered to ${o.address.hostel}, Block ${o.address.block}. Enjoy.`
      : `${p.step.note}. Arriving in about ${remaining} min.`;
    const pct = p.index < 0 ? 0 : p.index / (flow.length - 1);

    const status = h('section', { class: 'tstatus', 'aria-live': 'polite' },
      h('div', { class: 'tstatus__sky', 'aria-hidden': 'true' }),
      isNew && !p.done ? h('div', { class: 'tstatus__yay' },
        h('span', { class: 'confetti', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5, 6].map(() => icon('star', ''))),
        h('p', { class: 'tstatus__placed' }, icon('check'), 'Order placed. Thank you!')) : null,
      h('p', { class: 'tstatus__kicker' }, h('span', { text: o.id }), tag(o.kitchen)),
      h('h1', { class: 'tstatus__title' }, heading, p.done || p.index < 0 ? null : h('em', { text: '…' })),
      h('p', { class: 'tstatus__sub', text: sub }),
      p.index >= 0 ? h('div', { class: 'route', style: `--p:${pct}`, 'aria-hidden': 'true' },
        h('span', { class: 'route__node' }, icon('flame'), h('small', { text: K.name })),
        h('span', { class: 'route__line' }, h('span', { class: 'route__fill' }), h('span', { class: 'route__bike' }, icon('bike'))),
        h('span', { class: 'route__node route__node--end' }, icon('pin'), h('small', { text: o.address.hostel }))) : null,
      h('ol', { class: 'ttl' }, flow.map((s, i) => {
        const state = p.index < 0 ? (i === 0 ? 'done' : 'off') : i < p.index || (p.done && i === p.index) ? 'done' : i === p.index ? 'now' : 'todo';
        const at = new Date(o.createdAt + s.at * 1000).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
        return h('li', { class: `ttl__step is-${state}` },
          h('span', { class: 'ttl__dot' }, state === 'done' ? icon('check') : null),
          h('span', { class: 'ttl__label', text: s.label }),
          h('span', { class: 'ttl__time', text: state === 'done' || state === 'now' ? at : '' }));
      })));

    const a = o.address;
    const details = h('aside', { class: 'panel tdetail' },
      o.issue ? h('div', { class: 'alert alert--info' }, icon('alert'), h('div', null, h('strong', { text: 'Problem reported. ' }), `We're reviewing your "${o.issue.type}" report and will email you within a few hours.`)) : null,
      h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title', text: 'Order details' }), h('span', { class: 'muted', text: when(o.createdAt) })),
      h('div', { class: 'tdetail__addr' }, icon('pin'),
        h('div', null, h('strong', { text: `${a.hostel}, Block ${a.block}, Room ${a.room}` }), h('span', { text: a.campus }),
          a.when && a.when !== 'asap' ? h('span', { text: `Scheduled for ${a.when}` }) : null)),
      h('ul', { class: 'mini' }, o.items.map(i => h('li', null,
        h('img', { src: img(i.img), alt: '', width: 48, height: 48 }),
        h('span', { class: 'mini__q', text: `${i.qty}×` }),
        h('span', { class: 'mini__n' }, i.name, i.opts && i.opts.length ? h('small', { text: i.opts.join(' · ') }) : null),
        h('span', { class: 'mini__p', text: money(i.total) })))),
      h('dl', { class: 'sums' },
        h('div', null, h('dt', { text: 'Subtotal' }), h('dd', { text: money(o.subtotal) })),
        h('div', null, h('dt', { text: 'Delivery' }), h('dd', { text: money(o.fee) })),
        h('div', { class: 'sums__total' }, h('dt', { text: p.final === 'refunded' ? 'Refunded' : 'Paid' }), h('dd', { text: money(o.total) }))),
      h('div', { class: 'tdetail__acts' },
        p.done || p.index < 0 ? h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => reorder(o) }, icon('refresh'), 'Order this again') : null,
        o.issue || p.index < 0 ? null : h('button', { class: 'btn btn--block', type: 'button', onclick: () => report(o) }, icon('alert'), 'Report a problem'),
        h('a', { class: 'linkish', href: 'orders.html' }, 'All your orders')));

    host.replaceChildren(h('div', { class: 'track' }, status, details));

    clearTimeout(timer);
    if (!p.done && p.index >= 0) timer = setTimeout(render, 3000);
  }

  function reorder(o) {
    const n = SN.orders.reorder(o.id);
    if (n) { SN.ui.bump(); toast(`${n} item${n === 1 ? '' : 's'} added to your ${SN.KITCHENS[o.kitchen].name} bag`, { href: `cart.html?k=${o.kitchen}`, label: 'View bag' }); }
    else toast('Those items aren\'t available right now');
  }

  function report(o) {
    const types = ['Missing item', 'Wrong order', 'Late order', 'Something else'];
    const note = h('textarea', { rows: 3, maxlength: 400, placeholder: 'Tell us what happened', 'aria-label': 'Details' });
    const form = h('form', { class: 'report', method: 'dialog' },
      h('h2', { class: 'h3', id: 'rep-t', text: 'What went wrong?' }),
      h('p', { class: 'muted', text: `Order ${o.id} from ${SN.KITCHENS[o.kitchen].name}` }),
      h('fieldset', { class: 'rcards rcards--col' }, h('legend', { class: 'sr-only', text: 'Problem type' }),
        types.map((t, i) => h('label', { class: 'rcard' }, h('input', { type: 'radio', name: 'type', value: t, checked: i === 0 }), h('span', { class: 'rcard__dot', 'aria-hidden': 'true' }), h('span', { class: 'rcard__t', text: t })))),
      h('label', { class: 'field' }, h('span', { text: 'Details' }), note),
      h('div', { class: 'report__acts' },
        h('button', { class: 'btn btn--quiet', type: 'button', onclick: () => dlg.close() }, 'Cancel'),
        h('button', { class: 'btn btn--loud', type: 'submit' }, 'Send report')));
    const dlg = h('dialog', { class: 'sheet sheet--plain', 'aria-labelledby': 'rep-t' },
      h('button', { class: 'sheet__x', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('x')), form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      SN.orders.report(o.id, { type: form.elements.type.value, note: note.value.trim() });
      dlg.close();
      toast('Thanks. We\'re on it.');
      render();
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  }

  render();
  if (isNew) history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
});
