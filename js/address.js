// Shared delivery details: optional contact block (name, email), then
// university, hostel, block, room (optional) and phone. Used by food
// checkout, market runs, dry cleaning and flights so every service asks the
// same way and remembers the answers for the tab.
(() => {
  const { h, icon } = SN.ui;

  SN.addressForm = (idPrefix = '', { contact = false } = {}) => {
    const saved = SN.address.get() || {};
    const id = n => idPrefix + n;
    const err = n => h('p', { class: 'field__err', id: `${id(n)}-err`, 'aria-live': 'polite' });
    const field = (n, label, control, opts = {}) => h('div', { class: `field ${opts.wide ? 'field--wide' : ''}` },
      h('label', { for: id(n) }, label, opts.optional ? h('span', { class: 'field__opt', text: 'Optional' }) : null),
      control, opts.hint ? h('p', { class: 'field__hint', text: opts.hint }) : null, err(n));
    const select = (n, placeholder, options, value) => h('div', { class: 'select' },
      h('select', { id: id(n), name: n, 'aria-describedby': `${id(n)}-err`, required: true },
        h('option', { value: '', text: placeholder }),
        options.map(([v, t]) => h('option', { value: v, text: t, selected: v === value }))),
      icon('chev', 'i select__chev'));

    const campusSel = select('campus', 'Pick your university', SN.CAMPUSES.map(c => [c.id, c.name]), saved.campusId);
    const hostelWrap = h('div');
    const hostelOptions = cid => (SN.CAMPUSES.find(c => c.id === cid)?.hostels || []).map(x => [x, x]);
    const drawHostel = (cid, val) => {
      const s = select('hostel', cid ? 'Pick your hostel' : 'Pick a university first', hostelOptions(cid), val);
      s.querySelector('select').disabled = !cid;
      hostelWrap.replaceChildren(s);
    };
    drawHostel(saved.campusId, saved.hostel);
    campusSel.querySelector('select').addEventListener('change', e => drawHostel(e.target.value));

    const blockSel = select('block', 'Block', SN.BLOCKS.map(b => [b, `Block ${b}`]), saved.block);
    const room = h('input', { id: id('room'), name: 'room', type: 'text', inputmode: 'numeric', maxlength: 8, placeholder: 'e.g. 214', value: saved.room || '', 'aria-describedby': `${id('room')}-err` });
    const name = h('input', { id: id('name'), name: 'name', type: 'text', autocomplete: 'name', maxlength: 60, placeholder: 'e.g. Ada Okafor', value: saved.name || '', 'aria-describedby': `${id('name')}-err` });
    const email = h('input', { id: id('email'), name: 'email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@university.edu.ng', value: saved.email || '', 'aria-describedby': `${id('email')}-err` });
    const phone = h('input', { id: id('phone'), name: 'phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', placeholder: '0803 000 0000', value: saved.phone || '', 'aria-describedby': `${id('phone')}-err`, required: true });

    const el = h('div', { class: 'form-grid' },
      contact ? field('name', 'Full name', name, { wide: true }) : null,
      contact ? field('email', 'Email', email, { wide: true, hint: 'Your receipt and order updates go here.' }) : null,
      field('campus', 'University', campusSel, { wide: true }),
      field('hostel', 'Hostel', hostelWrap, { wide: true }),
      field('block', 'Block', blockSel),
      field('room', 'Room', room, { optional: true }),
      field('phone', 'Phone number', h('div', { class: 'prefix' }, h('span', { text: '+234' }), phone), { wide: true, hint: 'The rider calls this when they get to you.' }),
      h('p', { class: 'gate-note field--wide' }, icon('pin'), h('span', null, h('strong', { text: 'Heads up: ' }), "our riders come as close as your school allows. If security stops them at the gate, we'll call you to come out and collect.")));

    const get = n => document.getElementById(id(n));
    const setErr = (n, msg) => {
      get(n).setAttribute('aria-invalid', String(!!msg));
      document.getElementById(`${id(n)}-err`).textContent = msg || '';
      return !msg;
    };
    const digits = v => v.replace(/\D/g, '').replace(/^234/, '0');

    function validate() {
      const v = n => get(n).value.trim();
      const checks = [
        ...(contact ? [
          ['name', v('name').length > 1 ? '' : 'Tell us your name.'],
          ['email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) ? '' : 'That email looks off.']] : []),
        ['campus', v('campus') ? '' : 'Pick your university.'],
        ['hostel', v('hostel') ? '' : 'Pick your hostel.'],
        ['block', v('block') ? '' : 'Pick a block.'],
        ['room', !v('room') || /^[A-Za-z0-9-]{1,8}$/.test(v('room')) ? '' : 'Use letters and numbers only.'],
        ['phone', /^0?[789][01]\d{8}$/.test(digits(v('phone'))) ? '' : 'That number looks off. Try something like 0803 000 0000.']
      ];
      const bad = checks.filter(([n, msg]) => !setErr(n, msg));
      if (bad.length) get(bad[0][0]).focus();
      return !bad.length;
    }
    el.addEventListener('change', e => { if (e.target.getAttribute('aria-invalid') === 'true') validate(); });

    function value() {
      const c = SN.CAMPUSES.find(x => x.id === get('campus').value);
      const a = { campusId: c.id, campus: c.name, hostel: get('hostel').value, block: get('block').value, room: room.value.trim(), phone: digits(phone.value) };
      if (contact) Object.assign(a, { name: name.value.trim(), email: email.value.trim() });
      SN.address.set({ ...SN.address.get(), ...a });
      return a;
    }

    return { el, validate, value };
  };
})();
