// Flights coming soon: route interest chips and the early-access form.
document.addEventListener('DOMContentLoaded', () => {
  const chips = [...document.querySelectorAll('[data-routes] .chip')];
  const code = document.querySelector('[data-fl-code]');
  const city = document.querySelector('[data-fl-city]');

  // The boarding pass follows the last place you tapped.
  chips.forEach(c => c.addEventListener('click', () => {
    const on = c.getAttribute('aria-pressed') !== 'true';
    c.setAttribute('aria-pressed', String(on));
    const last = on ? c : chips.filter(x => x.getAttribute('aria-pressed') === 'true').pop();
    code.textContent = last ? last.dataset.code : 'ABV';
    city.textContent = last ? last.textContent : 'Abuja';
  }));

  // Validates only; send to the waitlist endpoint when it exists.
  const form = document.querySelector('[data-fl-form]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.elements.email;
    const msg = form.querySelector('.inline-form__msg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) { msg.textContent = 'That email looks off. Mind checking it?'; msg.dataset.state = 'bad'; input.focus(); return; }
    const picked = chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.textContent);
    msg.dataset.state = 'ok';
    msg.textContent = picked.length
      ? `You're on the list. We'll tell you first, especially about ${picked.slice(0, 2).join(' and ')}.`
      : "You're on the list. We'll email you the day flights open.";
    form.reset();
    input.removeAttribute('aria-invalid');
  });
});
