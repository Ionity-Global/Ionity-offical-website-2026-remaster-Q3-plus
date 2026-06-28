/* ============================================================================
   IONITY · audio.js — procedural 8-bit INDUSTRIAL soundscape (Web Audio API)
   No audio files. Everything is synthesized live: a soft industrial drone bed
   + chiptune UI blips. Off by default (respectful). User toggles via nav.
   Preference persisted. Honors prefers-reduced-motion as a hint to stay quiet.
   ========================================================================== */
(() => {
  'use strict';
  const KEY = 'ionity-audio';
  let ctx = null, master = null, bed = null, on = false, started = false;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }

  /* --- soft industrial drone bed: detuned squares + filtered noise + LFO -- */
  function buildBed() {
    if (!ctx || bed) return;
    bed = ctx.createGain();
    bed.gain.value = 0.0;
    bed.connect(master);

    // low drone (two oscillators, slightly detuned → industrial beat)
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 6;
    lp.connect(bed);

    [55, 55.4, 82.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'square';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.09;
      o.connect(g); g.connect(lp); o.start();
    });

    // slow LFO sweeping the filter → mechanical "breathing"
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain(); lfoG.gain.value = 160;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();

    // filtered noise hiss → "machine room" texture
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1200; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0.012;
    noise.connect(nf); nf.connect(ng); ng.connect(bed); noise.start();

    // periodic mechanical "tick" (industrial rhythm)
    const tick = () => {
      if (!on || !ctx) return;
      blip('tick');
      setTimeout(tick, 2400 + Math.random() * 800);
    };
    setTimeout(tick, 2000);

    bed.gain.linearRampToValueAtTime(0.36, ctx.currentTime + 2.5);
  }

  /* --- chiptune blip: short square beep ---------------------------------- */
  function blip(kind) {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    const map = { hover: 880, click: 523.25, tick: 196, ok: 1046.5 };
    o.frequency.setValueAtTime(map[kind] || 660, t);
    if (kind === 'click') o.frequency.exponentialRampToValueAtTime(784, t + 0.08);
    const peak = kind === 'tick' ? 0.05 : 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'tick' ? 0.14 : 0.16));
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
  }

  function setOn(state) {
    on = state;
    ensure();
    if (!ctx) return;
    if (on) {
      if (ctx.state === 'suspended') ctx.resume();
      buildBed();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4);
      started = true;
    } else if (master) {
      master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
    }
    localStorage.setItem(KEY, on ? 'on' : 'off');
    document.querySelectorAll('[data-audio-toggle]').forEach(b => {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      b.querySelector('.lbl') && (b.querySelector('.lbl').textContent = on ? 'Sound on' : 'Sound off');
    });
  }

  // public hook used by core.js for UI blips
  window.Ionity = window.Ionity || {};
  window.Ionity.blip = (k) => blip(k);

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-audio-toggle]').forEach(b => {
      b.addEventListener('click', () => setOn(!on));
      b.setAttribute('aria-pressed', 'false');
    });
    // restore preference — but never auto-start without a gesture (browser policy).
    // If user previously opted in, arm it to start on first interaction.
    if (localStorage.getItem(KEY) === 'on' && !reduce) {
      const arm = () => { setOn(true); removeEventListener('pointerdown', arm); removeEventListener('keydown', arm); };
      addEventListener('pointerdown', arm, { once: true });
      addEventListener('keydown', arm, { once: true });
    }
  });
})();
