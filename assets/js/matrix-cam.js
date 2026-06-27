/* ============================================================================
   IONITY · matrix-cam.js — live camera rendered as blue "matrix" digits.
   100% on-device: getUserMedia frames are drawn straight to a canvas as glyphs
   and discarded. Nothing is recorded or uploaded. Permission-gated, honest
   fallbacks (denied / no-camera / insecure-context). Pauses when tab hidden.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('mxStage');
  if (!stage) return;                       // section not on this page

  const video  = $('mxVideo');
  const canvas = $('mxCanvas');
  const startB = $('mxStart');
  const stopB  = $('mxStop');
  const statusEl = $('mxStatus');
  const offEl  = $('mxOff');
  const presEl = $('mxPresence');
  const motBar = $('mxMotion');
  const note   = $('mxNote');
  const ctx = canvas.getContext('2d', { alpha: false });

  // grid: glyph cells across the canvas
  const CELL = 9;
  let cols = Math.floor(canvas.width / CELL);
  let rows = Math.floor(canvas.height / CELL);

  // tiny offscreen canvas to downsample the video to one pixel per cell
  const sample = document.createElement('canvas');
  sample.width = cols; sample.height = rows;
  const sctx = sample.getContext('2d', { willReadFrequently: true });

  const GLYPHS = '0123456789';
  const drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
  let prev = null, stream = null, raf = 0, running = false, lastT = 0;

  function setStatus(text, kind) {
    if (statusEl) { statusEl.textContent = text; statusEl.dataset.kind = kind || 'idle'; }
  }

  function draw(t) {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    if (t - lastT < 40) return;             // ~25fps cap
    lastT = t;
    if (video.readyState < 2) return;

    // downsample current frame, mirrored (selfie view)
    sctx.save();
    sctx.scale(-1, 1);
    sctx.drawImage(video, -cols, 0, cols, rows);
    sctx.restore();
    let px;
    try { px = sctx.getImageData(0, 0, cols, rows).data; } catch (e) { return; }

    // fade the canvas slightly for a trailing-rain feel
    ctx.fillStyle = 'rgba(7,8,13,0.30)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${CELL + 1}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    let motion = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        // luminance 0..1
        const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
        if (prev) motion += Math.abs(lum - prev[y * cols + x]);
        if (lum < 0.12) continue;           // skip dark cells (cheap + matrix look)
        const head = drops[x] === y;
        const g = GLYPHS[(Math.random() * 10) | 0];
        if (head) {
          ctx.fillStyle = `rgba(210,245,255,${0.85 * lum + 0.15})`;   // bright cyan-white head
        } else {
          // blue → cyan with brightness; alpha tracks luminance
          const cy = Math.min(255, 120 + lum * 160);
          ctx.fillStyle = `rgba(0,${Math.round(cy)},255,${0.25 + lum * 0.7})`;
        }
        ctx.fillText(g, x * CELL, y * CELL);
      }
    }

    // advance the rain
    for (let x = 0; x < cols; x++) {
      drops[x] = (drops[x] + 1) % (rows + 4);
    }

    // motion / presence readouts
    const m = Math.min(1, motion / (cols * rows * 0.18));
    if (motBar) motBar.style.width = Math.round(m * 100) + '%';
    if (presEl) presEl.textContent = m > 0.06 ? 'ACTIVE' : 'STILL';
    prev = new Float32Array(cols * rows);
    for (let k = 0; k < cols * rows; k++) {
      const i = k * 4;
      prev[k] = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
    }
  }

  async function start() {
    if (running) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('UNSUPPORTED', 'bad');
      if (note) note.textContent = 'Your browser blocks camera access here (it needs a secure https context). The matrix view can\'t start.';
      return;
    }
    setStatus('REQUESTING…', 'idle');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      running = true;
      stage.classList.add('on');
      if (offEl) offEl.hidden = true;
      if (startB) startB.hidden = true;
      if (stopB) stopB.hidden = false;
      setStatus('LIVE · ON-DEVICE', 'good');
      lastT = 0; prev = null;
      raf = requestAnimationFrame(draw);
    } catch (e) {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      const none = e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError');
      setStatus(denied ? 'DENIED' : none ? 'NO CAMERA' : 'UNAVAILABLE', 'bad');
      if (note) note.textContent = denied
        ? 'Camera permission was declined — the matrix view stays off. Allow camera access and tap again to try.'
        : 'No camera was available on this device, so the matrix view can\'t run here.';
    }
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    video.srcObject = null;
    ctx.fillStyle = '#07080D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stage.classList.remove('on');
    if (offEl) offEl.hidden = false;
    if (stopB) stopB.hidden = true;
    if (startB) startB.hidden = false;
    setStatus('CAMERA OFF', 'idle');
  }

  if (startB) startB.addEventListener('click', start);
  if (stopB) stopB.addEventListener('click', stop);

  // pause the loop while the tab is hidden (battery); resume if still running
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { lastT = 0; raf = requestAnimationFrame(draw); }
  });

  // paint the idle "off" background
  ctx.fillStyle = '#07080D';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
})();
