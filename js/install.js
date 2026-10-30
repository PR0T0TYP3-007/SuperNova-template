// "Add to home screen": registers the service worker and shows an install
// card on phones. Android/Chrome gets a real install button (via the
// beforeinstallprompt event); iOS has no install API, so it gets the
// Share → Add to Home Screen steps instead.
//
// Never shown once installed, never on cart/checkout, and "Not now" keeps it
// away for a week. Preview it anywhere with ?install=ios or ?install=android.
(() => {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  const { h, icon } = SN.ui;
  const KEY = 'sn.install.later';
  const WEEK = 7 * 864e5;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iphone|ipod/i.test(ua);
  const isMobile = isIOS || /android|mobi/i.test(ua);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const force = new URLSearchParams(location.search).get('install');
  const quietPage = document.body.dataset.page === 'cart';

  const snoozed = () => { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK; } catch { return false; } };
  const snooze = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} };

  let deferred = null;
  let card = null;
  let timer = null;

  function hide(remember) {
    if (remember) snooze();
    if (!card) return;
    const c = card;
    card = null;
    c.classList.add('is-leaving');
    setTimeout(() => c.remove(), 260);
  }

  function show(mode) {
    if (card) return;
    const close = h('button', { class: 'install__x', type: 'button', 'aria-label': 'Close', onclick: () => hide(true) }, icon('x'));
    const head = h('div', { class: 'install__head' },
      h('img', { class: 'install__icon', src: 'assets/icons/icon-192.png', alt: '', width: 56, height: 56 }),
      h('div', null,
        h('p', { class: 'install__title', id: 'install-t' }, 'Put Supernova on your ', h('em', { text: 'home screen' })),
        h('p', { class: 'install__sub', text: 'Opens like an app. No app store, no download.' })));

    let body;
    if (mode === 'ios') {
      body = [
        h('ol', { class: 'install__steps' },
          h('li', null, h('span', { class: 'install__n', text: '1' }), h('span', null, 'Tap the ', h('b', { text: 'Share' }), ' button'), h('span', { class: 'install__glyph' }, icon('share'))),
          h('li', null, h('span', { class: 'install__n', text: '2' }), h('span', null, 'Scroll down, tap ', h('b', { text: 'Add to Home Screen' })), h('span', { class: 'install__glyph' }, icon('plussq'))),
          h('li', null, h('span', { class: 'install__n', text: '3' }), h('span', null, 'Tap ', h('b', { text: 'Add' }), '. That\'s it!'))),
        h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => hide(true) }, 'Got it')
      ];
    } else {
      body = [h('div', { class: 'install__acts' },
        h('button', { class: 'btn btn--quiet', type: 'button', onclick: () => hide(true) }, 'Not now'),
        h('button', { class: 'btn btn--loud', type: 'button', onclick: install }, icon('plussq'), 'Add to home screen'))];
    }

    card = h('div', { class: `install install--${mode}`, role: 'dialog', 'aria-labelledby': 'install-t' }, close, head, ...body,
      mode === 'ios' && isIPhone ? h('span', { class: 'install__arrow', 'aria-hidden': 'true' }) : null);
    document.body.append(card);
  }

  async function install() {
    if (!deferred) {
      // Preview mode or a browser without the prompt: point to the menu.
      SN.ui.toast('Open your browser menu and tap "Install app" or "Add to Home screen".');
      hide(false);
      return;
    }
    deferred.prompt();
    const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' }));
    deferred = null;
    hide(outcome !== 'accepted');
    if (outcome === 'accepted') SN.ui.toast('Supernova is on your home screen. Life Sweet.');
  }

  const schedule = mode => {
    if (timer || card || standalone || quietPage || snoozed()) return;
    timer = setTimeout(() => show(mode), 4000);
  };

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    if (isMobile) schedule('android');
  });
  addEventListener('appinstalled', () => { deferred = null; hide(true); });

  if (force === 'ios' || force === 'android') { addEventListener('load', () => show(force)); return; }
  if (isIOS) schedule('ios');
})();
