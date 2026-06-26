/* ============================================================================
   IONITY · mario.js — 8-bit "power-up" UI SFX (Web Audio, no files)
   Classic coin (B5→E6) on hover, jump sweep on click/interaction.
   On by default; mutable (persisted). Auto-armed on first user gesture so it
   complies with browser autoplay policy. Honors prefers-reduced-motion only as
   a hint (sounds still allowed — the user explicitly asked for them).
   ========================================================================== */
(() => {
  'use strict';
  const KEY = 'ionity-sfx';
  let ctx = null, sfx = null, armed = false;
  let enabled = localStorage.getItem(KEY) !== 'off';   // default ON
  let lastHover = 0, lastEl = null;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  function ensure() {
    if (ctx) return;
    ctx = new AC();
    sfx = ctx.createGain();
    sfx.gain.value = 0.5;            // master SFX trim
    sfx.connect(ctx.destination);
  }

  function arm() {
    if (armed) return;
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    armed = true;
  }

  /* one square-wave voice with an attack/decay envelope */
  function voice(freq, t0, dur, peak, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfx);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }

  /* the iconic Super-Mario coin: B5 blip → sustained E6 */
  function coin(vol = 0.08) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    voice(987.77, t, 0.09, vol, 'square');           // B5
    voice(1318.51, t + 0.075, 0.36, vol, 'square');  // E6 (sustained)
  }

  /* small-jump pitch sweep up */
  function jump(vol = 0.07) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(1245, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.24);
  }

  /* power-up arpeggio for big moments (data-sfx="powerup") */
  function powerup(vol = 0.07) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    [392, 523.25, 659.25, 784, 1046.5].forEach((f, i) =>
      voice(f, t + i * 0.06, 0.12, vol, 'square'));
  }

  const INTERACTIVE = 'a,button,.card,.btn,[data-sfx],input[type=submit],.nav-links a,.tag';

  /* hover → coin (throttled, deduped per element) */
  function onOver(e) {
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el === lastEl) return;
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now; lastEl = el;
    arm();
    coin(0.055);
  }
  function onOut(e) {
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (el === lastEl) lastEl = null;
  }

  /* click → jump (or powerup / coin per data-sfx) */
  function onClick(e) {
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el) { arm(); return; }
    arm();
    const kind = el.getAttribute('data-sfx');
    if (kind === 'powerup') powerup();
    else if (kind === 'coin') coin();
    else jump();
  }

  /* public toggle + nav wiring */
  function setEnabled(state) {
    enabled = state;
    localStorage.setItem(KEY, state ? 'on' : 'off');
    document.querySelectorAll('[data-sfx-toggle]').forEach(b => {
      b.classList.toggle('on', state);
      b.setAttribute('aria-pressed', String(state));
    });
    if (state) { arm(); coin(0.08); }
  }
  window.IonityMario = { coin, jump, powerup, setEnabled, isOn: () => enabled };

  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  document.addEventListener('click', onClick, true);
  // first gesture arms the context
  addEventListener('pointerdown', arm, { once: true });
  addEventListener('keydown', arm, { once: true });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-sfx-toggle]').forEach(b => {
      b.classList.toggle('on', enabled);
      b.setAttribute('aria-pressed', String(enabled));
      b.addEventListener('click', () => setEnabled(!enabled));
    });
  });
})();
