/* ============================================================================
   IONITY · ui-sound.js — restrained, professional interface audio
   ----------------------------------------------------------------------------
   Replaces the former 8-bit / game-clip sound layer (mario.js + audio.js).
   • No audio files. Two short, soft cues are synthesised with the Web Audio
     API: a muted "tap" on click and a gentle two-note "confirm" on primary
     actions. No hover sounds, no ambient bed.
   • OFF by default. One toggle in the header ([data-sound-toggle]).
     Preference persisted in localStorage as `ionity-sound` = on | off.
   • AudioContext is created only after a user gesture (autoplay policy).
   • Public API kept for existing callers: window.Ionity.blip(kind)
       kind ∈ hover | click | ok | confirm | soft  (hover is intentionally silent)
   Policy 986 AED · © 2018–2026 Ionity (Pty) Ltd
   ========================================================================== */
(() => {
  'use strict';
  const KEY = 'ionity-sound';
  const AC  = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  let ctx = null, master = null;
  let enabled = localStorage.getItem(KEY) === 'on';     // default OFF
  let lastAt = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;                             // overall trim — quiet by design
    // soft high-shelf roll-off keeps every cue warm rather than piercing
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf'; shelf.frequency.value = 3200; shelf.gain.value = -9;
    master.connect(shelf); shelf.connect(ctx.destination);
  }

  /* one sine voice with an exponential envelope */
  function voice(freq, t0, dur, peak, glideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const CUES = {
    click:   (t) => voice(640, t, 0.07, 0.9, 520),                       // muted tap
    soft:    (t) => voice(640, t, 0.07, 0.9, 520),
    ok:      (t) => { voice(660, t, 0.16, 0.7); voice(990, t + 0.09, 0.22, 0.6); }, // two-note confirm
    confirm: (t) => { voice(660, t, 0.16, 0.7); voice(990, t + 0.09, 0.22, 0.6); },
    hover:   () => {},                                                   // silent on purpose
  };

  function blip(kind) {
    if (!enabled || !ctx) return;
    const cue = CUES[kind] || CUES.click;
    const now = performance.now();
    if (kind !== 'ok' && kind !== 'confirm' && now - lastAt < 60) return;  // de-bounce rapid taps
    lastAt = now;
    if (ctx.state === 'suspended') ctx.resume();
    cue(ctx.currentTime);
  }

  /* legacy data-sfx names from the previous layer map to the two cues */
  const SFX_MAP = { coin: 'click', jump: 'click', stomp: 'click', pipe: 'click', bump: 'click',
                    powerup: 'confirm', appear: 'confirm', '1up': 'confirm', oneup: 'confirm',
                    click: 'click', soft: 'click', confirm: 'confirm', ok: 'confirm' };

  const INTERACTIVE = 'a.btn,button.btn,[data-sfx],.nav-links a,.aedi-fab,.portal-skip';

  function onClick(e) {
    ensure();
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el.hasAttribute('data-sound-toggle')) return;
    blip(SFX_MAP[el.getAttribute('data-sfx')] || 'click');
  }

  function paint() {
    document.querySelectorAll('[data-sound-toggle]').forEach(b => {
      b.classList.toggle('on', enabled);
      b.setAttribute('aria-pressed', String(enabled));
      b.setAttribute('title', enabled ? 'Interface sound: on' : 'Interface sound: off');
    });
  }

  function setEnabled(state) {
    enabled = !!state;
    // persist only if the visitor allowed the "Preferences" cookie category
    const okToPersist = !!(window.IonityConsent && window.IonityConsent.allows('preferences'));
    try { okToPersist ? localStorage.setItem(KEY, enabled ? 'on' : 'off') : localStorage.removeItem(KEY); } catch (_) {}
    paint();
    if (enabled) { ensure(); blip('confirm'); }
  }

  window.Ionity = window.Ionity || {};
  window.Ionity.blip = blip;
  window.IonitySound = { setEnabled, isOn: () => enabled, blip };

  document.addEventListener('click', onClick, true);
  addEventListener('pointerdown', ensure, { once: true, passive: true });
  addEventListener('keydown', ensure, { once: true });

  document.addEventListener('DOMContentLoaded', () => {
    paint();
    document.querySelectorAll('[data-sound-toggle]').forEach(b =>
      b.addEventListener('click', (e) => { e.preventDefault(); setEnabled(!enabled); }));
  });
})();
