/* ============================================================================
   IONITY · cookies.js — real, granular cookie & consent manager
   GDPR/POPIA-style: opt-in, granular categories, durable record, re-openable.
   Sets a genuine `ionity_consent` cookie + localStorage mirror, and fires
   `ionity:consent` so downstream scripts (analytics etc.) can gate themselves.
   ========================================================================== */
(() => {
  'use strict';
  const VERSION = 1;
  const LS = 'ionity-consent';
  const CATS = [
    { id: 'necessary',   name: 'Strictly necessary', locked: true,  desc: 'Security, consent state, and core site function. Always on.' },
    { id: 'preferences', name: 'Preferences',        locked: false, desc: 'Remembers choices like sound on/off and theme.' },
    { id: 'analytics',   name: 'Analytics',          locked: false, desc: 'Anonymous, aggregated usage to improve the experience.' },
    { id: 'marketing',   name: 'Marketing',          locked: false, desc: 'Not used today — reserved, off by default.' },
  ];

  const read = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch { return null; } };
  function write(state) {
    const payload = { v: VERSION, ts: new Date().toISOString(), ...state };
    localStorage.setItem(LS, JSON.stringify(payload));
    const max = 60 * 60 * 24 * 180; // 180 days
    document.cookie = `ionity_consent=${encodeURIComponent(JSON.stringify(payload))};path=/;max-age=${max};SameSite=Lax`;
    document.dispatchEvent(new CustomEvent('ionity:consent', { detail: payload }));
  }

  const banner   = document.getElementById('cookie');
  if (!banner) return;
  const togglesEl = banner.querySelector('#cookieToggles');

  // build granular toggles
  if (togglesEl) {
    togglesEl.innerHTML = CATS.map(c => `
      <div class="cookie-toggle">
        <span><strong>${c.name}</strong><br><span class="muted" style="font-size:.72em">${c.desc}</span></span>
        <label class="switch">
          <input type="checkbox" data-cat="${c.id}" ${c.locked ? 'checked disabled' : ''}>
          <span class="sl"></span>
        </label>
      </div>`).join('');
  }

  const show = () => banner.classList.add('show');
  const hide = () => banner.classList.remove('show');

  function apply(all) {
    const state = { categories: {} };
    CATS.forEach(c => {
      const box = togglesEl && togglesEl.querySelector(`[data-cat="${c.id}"]`);
      state.categories[c.id] = c.locked ? true : (all === true ? true : all === false ? false : (box ? box.checked : false));
    });
    write(state);
    hide();
  }

  banner.querySelector('#ckAccept') ?.addEventListener('click', () => apply(true));
  banner.querySelector('#ckReject') ?.addEventListener('click', () => apply(false));
  banner.querySelector('#ckSave')   ?.addEventListener('click', () => apply('custom'));
  banner.querySelector('#ckCustomize')?.addEventListener('click', () => {
    const d = banner.querySelector('#cookieDetails');
    d?.removeAttribute('hidden');
    const save = banner.querySelector('#ckSave');
    if (save) save.style.display = 'inline-flex';
  });

  // public API: reopen from footer "Cookie settings"
  window.IonityConsent = {
    open() {
      const cur = read();
      if (cur && togglesEl) CATS.forEach(c => {
        const box = togglesEl.querySelector(`[data-cat="${c.id}"]`);
        if (box && !c.locked) box.checked = !!(cur.categories && cur.categories[c.id]);
      });
      banner.querySelector('#cookieDetails')?.removeAttribute('hidden');
      show();
    },
    get: read,
    allows: (cat) => { const s = read(); return !!(s && s.categories && s.categories[cat]); },
  };

  // first visit → show after a tick; returning visitor with valid record → stay hidden
  const cur = read();
  if (!cur || cur.v !== VERSION) setTimeout(show, 900);
  else document.dispatchEvent(new CustomEvent('ionity:consent', { detail: cur }));

  document.querySelectorAll('[data-cookie-open]').forEach(b =>
    b.addEventListener('click', (e) => { e.preventDefault(); window.IonityConsent.open(); }));
})();
