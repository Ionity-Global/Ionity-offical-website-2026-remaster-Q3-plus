/* ============================================================================
   IONITY · sensor-node.js — "your browser is an edge sensor node"
   Live REAL device sensors, visualised on-device (nothing transmitted):
     • accelerometer (DeviceMotion) — real acceleration magnitude
     • gyro / tilt + compass (DeviceOrientation) — real beta/gamma/alpha
     • ambient light (AmbientLightSensor) — real lux, where exposed
     • microphone sound level (getUserMedia + AnalyserNode) — real RMS dB
   This is exactly what an Ionity edge node does in the field — here it runs in
   your hand. Permissions are requested on tap; declines degrade gracefully.
   ========================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('sensor');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const startBtn = $('#snStart'), statusEl = $('#snStatus');
  const elTilt = $('#snTilt'), elHeading = $('#snHeading'), elAccel = $('#snAccel'),
        elSound = $('#snSound'), elLight = $('#snLight');
  const bubble = $('#snBubble');
  const accelBar = $('#snAccelBar'), soundBar = $('#snSoundBar'),
        tiltBar = $('#snTiltBar'), headingBar = $('#snHeadingBar'), lightBar = $('#snLightBar');
  const horizon = $('#snHorizon');
  const setBar = (el, pct) => { if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%'; };
  const setStatus = (t, k) => { if (statusEl) { statusEl.textContent = t; statusEl.dataset.kind = k || ''; } };
  let running = false;

  function onOrient(e) {
    const beta = e.beta || 0, gamma = e.gamma || 0, alpha = e.alpha;
    if (elTilt) elTilt.textContent = `${beta.toFixed(0)}° / ${gamma.toFixed(0)}°`;
    if (elHeading) elHeading.textContent = (alpha != null) ? `${alpha.toFixed(0)}°` : 'n/a';
    // bars: tilt = combined lean (0–135° → 0–100%), compass = heading round the dial
    setBar(tiltBar, (Math.abs(beta) + Math.abs(gamma)) / 135 * 100);
    if (alpha != null) setBar(headingBar, alpha / 360 * 100);
    if (horizon) horizon.style.transform = `rotate(${(-gamma).toFixed(1)}deg) translateY(${(beta).toFixed(0)}px)`;
    if (bubble) { bubble.style.left = `calc(50% + ${Math.max(-46, Math.min(46, gamma)) }px)`; bubble.style.top = `calc(50% + ${Math.max(-46, Math.min(46, beta - 0)) }px)`; }
  }
  function onMotion(e) {
    const a = e.accelerationIncludingGravity || e.acceleration || {};
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    if (elAccel) elAccel.textContent = m.toFixed(2) + ' m/s²';
    setBar(accelBar, m / 20 * 100);
  }

  async function enableMotion() {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
        const p = await DeviceMotionEvent.requestPermission(); if (p !== 'granted') throw 0;
      }
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        try { await DeviceOrientationEvent.requestPermission(); } catch {}
      }
      window.addEventListener('deviceorientation', onOrient);
      window.addEventListener('devicemotion', onMotion);
      return true;
    } catch { return false; }
  }

  async function enableSound() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        const db = 20 * Math.log10(rms || 1e-7);            // real relative dB
        const pct = Math.max(0, Math.min(100, (db + 60) / 60 * 100));
        if (elSound) elSound.textContent = (db <= -60 ? '−∞' : db.toFixed(0)) + ' dBFS';
        setBar(soundBar, pct);
        if (running) requestAnimationFrame(loop);
      };
      loop(); return true;
    } catch { return false; }
  }

  function enableLight() {
    try {
      if ('AmbientLightSensor' in window) {
        const s = new AmbientLightSensor();
        s.addEventListener('reading', () => { if (elLight) elLight.textContent = Math.round(s.illuminance) + ' lux'; setBar(lightBar, Math.log10((s.illuminance || 0) + 1) / 3 * 100); });
        s.addEventListener('error', () => { if (elLight) elLight.textContent = 'blocked'; });
        s.start(); return true;
      }
    } catch {}
    if (elLight) elLight.textContent = 'not exposed';
    return false;
  }

  async function start() {
    if (running) return; running = true;
    startBtn && (startBtn.disabled = true, startBtn.textContent = 'Sensing…');
    setStatus('● ACTIVATING', 'live');
    const m = await enableMotion();
    const s = await enableSound();
    enableLight();
    const live = m || s;
    setStatus(live ? '● LIVE · SENSING' : 'LIMITED · DESKTOP', live ? 'live' : 'idle');
    if (!m && elTilt) { elTilt.textContent = 'n/a (desktop)'; elAccel && (elAccel.textContent = 'n/a'); }
    window.Ionity && window.Ionity.blip && window.Ionity.blip('ok');
    startBtn && (startBtn.disabled = false, startBtn.textContent = 'Sensors live');
  }
  startBtn && startBtn.addEventListener('click', start);
})();
