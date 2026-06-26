/* ============================================================================
   IONITY · mario.js — real Super-Mario UI sound effects (Web Audio buffers)
   Plays the actual SMB .wav clips (assets/sfx/) on hover/click/interaction.
   On by default; mutable (persisted as ionity-sfx). The AudioContext is created
   and the clips decoded on the first user gesture (browser autoplay policy).
   ========================================================================== */
(() => {
  'use strict';
  const KEY = 'ionity-sfx';
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  // sound name → file. Short clips, decoded once into AudioBuffers.
  const FILES = {
    coin:    'assets/sfx/smb_coin.wav',
    jump:    'assets/sfx/smb_jump-small.wav',
    powerup: 'assets/sfx/smb_powerup.wav',
    appear:  'assets/sfx/smb_powerup_appears.wav',
    bump:    'assets/sfx/smb_bump.wav',
    stomp:   'assets/sfx/smb_stomp.wav',
    oneup:   'assets/sfx/smb_1-up.wav',
    pipe:    'assets/sfx/smb_pipe.wav',
  };

  let ctx = null, master = null, armed = false, loading = null;
  const buffers = {};
  let enabled = localStorage.getItem(KEY) !== 'off';   // default ON
  let lastHover = 0, lastEl = null;

  function loadAll() {
    if (loading) return loading;
    loading = Promise.all(Object.entries(FILES).map(([name, url]) =>
      fetch(url)
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
        .then(buf => ctx.decodeAudioData(buf))
        .then(decoded => { buffers[name] = decoded; })
        .catch(e => console.warn('[mario] load', name, e))
    ));
    return loading;
  }

  function arm() {
    if (armed) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;       // overall trim
    master.connect(ctx.destination);
    armed = true;
    loadAll();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function play(name, vol = 1) {
    if (!enabled || !armed || !ctx) return;
    const buf = buffers[name];
    if (!buf) return;              // not decoded yet / failed
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(master);
    src.start(0);
  }

  const INTERACTIVE = 'a,button,.card,.btn,[data-sfx],.nav-links a,.tag,.portal-corner,.aedi-fab';

  /* hover → coin (throttled, deduped per element) */
  function onOver(e) {
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el === lastEl) return;
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now; lastEl = el;
    arm();
    play('coin', 0.35);
  }
  function onOut(e) {
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (el === lastEl) lastEl = null;
  }

  /* click → jump, or a specific clip via data-sfx="powerup|coin|stomp|pipe|1up" */
  function onClick(e) {
    arm();
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el) return;
    const kind = el.getAttribute('data-sfx');
    if (kind === 'powerup') play('powerup', 0.55);
    else if (kind === 'coin') play('coin', 0.5);
    else if (kind === 'stomp') play('stomp', 0.6);
    else if (kind === 'pipe') play('pipe', 0.5);
    else if (kind === '1up' || kind === 'oneup') play('oneup', 0.5);
    else play('jump', 0.5);
  }

  /* public API + nav mute toggle */
  function setEnabled(state) {
    enabled = state;
    localStorage.setItem(KEY, state ? 'on' : 'off');
    document.querySelectorAll('[data-sfx-toggle]').forEach(b => {
      b.classList.toggle('on', state);
      b.setAttribute('aria-pressed', String(state));
    });
    if (state) { arm(); loadAll().then(() => play('coin', 0.5)); }
  }
  window.IonityMario = { play, setEnabled, isOn: () => enabled };

  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  document.addEventListener('click', onClick, true);
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
