// Home page behaviour. Header, footer, toast and scroll reveal come from ui.js.
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Kitchen filter.
  const chips = $$('[data-filter]');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const f = chip.dataset.filter;
    $$('[data-menu] .card').forEach(card => { card.hidden = f !== 'all' && card.dataset.vendor !== f; });
  }));

  // "Add" puts the item straight into that kitchen's own bag, with the first
  // choice picked for any required option (spice level, swallow, flavour).
  $$('[data-add]').forEach(btn => btn.addEventListener('click', () => {
    const [k, id] = btn.dataset.add.split(':');
    const it = SN.item(k, id);
    if (!it) return;
    // No outlet picked yet: choose one first, then the item opens on its menu.
    if (!SN.outlets.get(k)) { location.href = `kitchen.html?k=${k}&item=${encodeURIComponent(id)}`; return; }
    const opts = (it.groups || []).filter(g => g.type === 'one').map(g => `${g.id}:${g.options[0].id}`);
    if (!SN.cart.add(k, id, opts, 1)) return;
    SN.ui.bump();
    SN.ui.toast(`${it.name} added to your ${SN.KITCHENS[k].name} bag`, { href: `cart.html?k=${k}`, label: 'View bag' });
  }));

  // Waitlist forms. Validates here; wire `submit` to the API when it exists.
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  $$('[data-waitlist]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('.inline-form__msg', form);
    let bad = null;
    $$('input', form).forEach(input => {
      const v = input.value.trim();
      const ok = input.type === 'email' ? emailOk(v) : v.length > 1;
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !bad) bad = input;
    });
    if (bad) {
      msg.textContent = bad.type === 'email' ? 'That email looks off. Mind checking it?' : 'Tell us which university.';
      msg.style.color = 'var(--berry)';
      bad.focus();
      return;
    }
    msg.style.color = '';
    msg.textContent = form.dataset.waitlist === 'flights'
      ? "You're on the list. We'll email you the day flights open."
      : "Got it. We'll let you know when Supernova reaches your campus.";
    form.reset();
    $$('input', form).forEach(i => i.removeAttribute('aria-invalid'));
  }));
});
