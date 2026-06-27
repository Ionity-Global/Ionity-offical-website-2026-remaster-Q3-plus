/* ============================================================================
   IONITY · matrix-cam.js — live camera rendered as blue "matrix" digits,
   now with on-device computer vision overlaid (a world first for the demo).

   • Matrix render: getUserMedia frames downsampled to glyphs on #mxCanvas.
   • Vision (ADDITIVE, never breaks the matrix): COCO-SSD (TF.js) is the
     backbone — counts PEOPLE + recognises 80 OBJECT classes. MediaPipe
     tasks-vision lazily adds FACE + HAND counts when it can load.
   • 100% on-device. Nothing recorded or uploaded. Permission + HTTPS gated.
   • Models load ONLY after the user enables the camera. Detection is throttled
     (~500ms desktop / ~750ms mobile) on a timer, never per animation frame.
   • Boxes are drawn on a SECOND transparent canvas (#mxOverlay) stacked over
     #mxCanvas, so the matrix glyph render underneath is untouched.
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

  // HUD vision counters (added to visionBlock — may be absent on old markup)
  const peopleEl  = $('mxPeople');
  const facesEl   = $('mxFaces');
  const handsEl   = $('mxHands');
  const objectsEl = $('mxObjects');
  const labelsEl  = $('mxLabels');

  // ---- second, transparent overlay canvas for detection boxes -------------
  // Created in JS so no markup change beyond the metric rows is required.
  let overlay = $('mxOverlay');
  if (!overlay) {
    overlay = document.createElement('canvas');
    overlay.id = 'mxOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    // Insert directly after the matrix canvas so CSS .mx-stage canvas+canvas works.
    canvas.insertAdjacentElement('afterend', overlay);
  }
  // Internal resolution matches the matrix canvas; CSS stretches both to fill.
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  const octx = overlay.getContext('2d');

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

  const isMobile = matchMedia('(max-width: 760px)').matches ||
                   /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  function setStatus(text, kind) {
    if (statusEl) { statusEl.textContent = text; statusEl.dataset.kind = kind || 'idle'; }
  }

  /* ==========================================================================
     VISION — additive, lazy, fault-tolerant. Any failure here must NEVER stop
     the matrix render. Everything is wrapped so the worst case is "no boxes".
     ========================================================================== */
  const TFJS_URL     = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  const COCO_URL     = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
  const MP_IMPORT    = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
  const MP_WASM      = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
  const MP_FACE      = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';
  const MP_HAND      = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

  const vision = {
    cocoModel: null,        // backbone (people + objects)
    faceDet: null,          // optional
    handDet: null,          // optional
    busy: false,            // a detect pass is in flight
    timer: 0,
    started: false,         // models load kicked off
    lastDets: [],           // [{box:[x,y,w,h] in video px, label, color}]
    counts: { people: 0, faces: 0, hands: 0, objects: 0 },
    labels: new Map(),      // label -> count (non-person objects)
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // de-dupe: if a tag with this src already exists and loaded, reuse it
      const existing = document.querySelector(`script[data-mxsrc="${src}"]`);
      if (existing && existing.dataset.loaded === '1') return resolve();
      const s = existing || document.createElement('script');
      s.src = src; s.async = true; s.dataset.mxsrc = src;
      s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(); }, { once: true });
      s.addEventListener('error', () => reject(new Error('load failed: ' + src)), { once: true });
      if (!existing) document.head.appendChild(s);
    });
  }

  // Load the COCO-SSD backbone. Resolves true on success, false otherwise.
  async function loadBackbone() {
    if (vision.cocoModel) return true;        // already warmed (e.g. idle preload on landing)
    try {
      await loadScript(TFJS_URL);
      if (!window.tf) throw new Error('tf global missing');
      try { await tf.setBackend('webgl'); }
      catch (_) { /* webgl unavailable; tf will use its default (cpu) */ }
      await tf.ready();
      await loadScript(COCO_URL);
      if (!window.cocoSsd) throw new Error('cocoSsd global missing');
      // lite_mobilenet_v2 = smallest/fastest, ideal for a smooth headline demo.
      vision.cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      return true;
    } catch (e) {
      console.warn('[matrix-cam] COCO-SSD unavailable:', e && e.message);
      vision.cocoModel = null;
      return false;
    }
  }

  // Lazily add MediaPipe face + (desktop only) hand detectors. Optional.
  async function loadMediaPipe() {
    try {
      const mp = await import(MP_IMPORT);
      const fileset = await mp.FilesetResolver.forVisionTasks(MP_WASM);
      // Face is cheap — load on all devices.
      try {
        vision.faceDet = await mp.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MP_FACE, delegate: 'GPU' },
          runningMode: 'VIDEO', minDetectionConfidence: 0.5,
        });
      } catch (e) { console.warn('[matrix-cam] face model failed:', e && e.message); }
      // Hand landmarker is the heaviest — skip on small screens to protect perf.
      if (!isMobile) {
        try {
          vision.handDet = await mp.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MP_HAND, delegate: 'GPU' },
            runningMode: 'VIDEO', numHands: 2,
          });
        } catch (e) { console.warn('[matrix-cam] hand model failed:', e && e.message); }
      }
    } catch (e) {
      console.warn('[matrix-cam] MediaPipe unavailable:', e && e.message);
    }
  }

  // Kick off model loading once, after camera is live.
  async function ensureVision() {
    if (vision.started) return;
    vision.started = true;
    setStatus('LOADING VISION…', 'idle');
    const ok = await loadBackbone();
    // MediaPipe loads after backbone and is fully optional.
    loadMediaPipe();
    if (ok) {
      setStatus('LIVE · VISION ON', 'good');
      startDetectLoop();
    } else {
      // Backbone failed — matrix keeps running, just no detection.
      setStatus('LIVE · ON-DEVICE', 'good');
      if (note) note.textContent =
        'Live matrix is running on-device. The vision models could not load on this network, so people/object detection is off — the matrix view is unaffected.';
    }
  }

  function startDetectLoop() {
    clearInterval(vision.timer);
    const period = isMobile ? 750 : 500;     // throttle: NOT every frame
    vision.timer = setInterval(detectPass, period);
  }

  async function detectPass() {
    if (!running || document.hidden) return;
    if (vision.busy) return;                 // skip if previous pass still running
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    vision.busy = true;
    const dets = [];
    const labels = new Map();
    let people = 0, faces = 0, hands = 0, objects = 0;
    const tsMs = performance.now();

    try {
      // ---- backbone: COCO-SSD (people + objects) ----
      if (vision.cocoModel) {
        const preds = await vision.cocoModel.detect(video, 20, 0.5);
        for (const p of preds) {
          const isPerson = p.class === 'person';
          if (isPerson) people++; else { objects++; labels.set(p.class, (labels.get(p.class) || 0) + 1); }
          dets.push({
            box: p.bbox,                      // [x, y, w, h] in video pixels
            label: `${p.class} ${(p.score * 100) | 0}%`,
            color: isPerson ? 'rgba(0,210,255,0.95)' : 'rgba(120,200,120,0.9)',
          });
        }
      }
      // ---- optional: face count ----
      if (vision.faceDet) {
        try {
          const r = vision.faceDet.detectForVideo(video, tsMs);
          const list = (r && r.detections) || [];
          faces = list.length;
          for (const d of list) {
            const bb = d.boundingBox;
            if (bb) dets.push({
              box: [bb.originX, bb.originY, bb.width, bb.height],
              label: 'face', color: 'rgba(255,210,80,0.95)',
            });
          }
        } catch (_) {}
      }
      // ---- optional: hand count ----
      if (vision.handDet) {
        try {
          const r = vision.handDet.detectForVideo(video, tsMs);
          hands = (r && r.landmarks && r.landmarks.length) || 0;
          // derive a rough box per hand from landmark extents (video px)
          const vw = video.videoWidth, vh = video.videoHeight;
          for (const lm of (r.landmarks || [])) {
            let minX = 1, minY = 1, maxX = 0, maxY = 0;
            for (const pt of lm) { if (pt.x < minX) minX = pt.x; if (pt.y < minY) minY = pt.y; if (pt.x > maxX) maxX = pt.x; if (pt.y > maxY) maxY = pt.y; }
            dets.push({
              box: [minX * vw, minY * vh, (maxX - minX) * vw, (maxY - minY) * vh],
              label: 'hand', color: 'rgba(255,120,200,0.95)',
            });
          }
        } catch (_) {}
      }

      vision.lastDets = dets;
      vision.labels = labels;
      vision.counts = { people, faces, hands, objects };
      paintOverlay();
      updateHud();
    } catch (e) {
      console.warn('[matrix-cam] detect pass error:', e && e.message);
    } finally {
      vision.busy = false;
    }
  }

  // Draw boxes on the overlay. Video is mirrored in the matrix render, so we
  // mirror box X to match what the user sees. Coords map video px -> overlay px.
  function paintOverlay() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
    const vw = video.videoWidth || 1, vh = video.videoHeight || 1;
    const sx = overlay.width / vw, sy = overlay.height / vh;
    octx.lineWidth = 1.5;
    octx.font = '11px "JetBrains Mono", monospace';
    octx.textBaseline = 'bottom';
    for (const d of vision.lastDets) {
      let [x, y, w, h] = d.box;
      // mirror horizontally (selfie view)
      const mx = overlay.width - (x + w) * sx;
      const my = y * sy, mw = w * sx, mh = h * sy;
      octx.strokeStyle = d.color;
      octx.shadowColor = d.color; octx.shadowBlur = 6;
      octx.strokeRect(mx, my, mw, mh);
      octx.shadowBlur = 0;
      // label chip
      const tw = octx.measureText(d.label).width + 6;
      octx.fillStyle = 'rgba(7,8,13,0.78)';
      octx.fillRect(mx, Math.max(0, my - 13), tw, 13);
      octx.fillStyle = d.color;
      octx.fillText(d.label, mx + 3, Math.max(11, my - 1));
    }
  }

  function updateHud() {
    const c = vision.counts;
    if (peopleEl)  peopleEl.textContent  = String(c.people);
    if (facesEl)   facesEl.textContent   = vision.faceDet ? String(c.faces) : '—';
    if (handsEl)   handsEl.textContent   = vision.handDet ? String(c.hands) : (isMobile ? 'off' : '—');
    if (objectsEl) objectsEl.textContent = String(c.objects);
    if (labelsEl) {
      const top = [...vision.labels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([k, n]) => n > 1 ? `${k}×${n}` : k);
      labelsEl.textContent = top.length ? top.join(' · ') : '—';
    }
  }

  function resetVisionReadouts() {
    vision.lastDets = []; vision.labels = new Map();
    vision.counts = { people: 0, faces: 0, hands: 0, objects: 0 };
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if (peopleEl) peopleEl.textContent = '0';
    if (facesEl) facesEl.textContent = '—';
    if (handsEl) handsEl.textContent = '—';
    if (objectsEl) objectsEl.textContent = '0';
    if (labelsEl) labelsEl.textContent = '—';
  }

  /* ==========================================================================
     MATRIX RENDER (unchanged behaviour) — detection above is fully decoupled.
     ========================================================================== */
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
        const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
        if (prev) motion += Math.abs(lum - prev[y * cols + x]);
        if (lum < 0.12) continue;
        const head = drops[x] === y;
        const g = GLYPHS[(Math.random() * 10) | 0];
        if (head) {
          ctx.fillStyle = `rgba(210,245,255,${0.85 * lum + 0.15})`;
        } else {
          const cy = Math.min(255, 120 + lum * 160);
          ctx.fillStyle = `rgba(0,${Math.round(cy)},255,${0.25 + lum * 0.7})`;
        }
        ctx.fillText(g, x * CELL, y * CELL);
      }
    }

    for (let x = 0; x < cols; x++) {
      drops[x] = (drops[x] + 1) % (rows + 4);
    }

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
    // Bring the camera box into view + focus it the instant activation is tapped.
    try {
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => { try { stage.focus({ preventScroll: true }); } catch (_) {} }, reduceMotion ? 0 : 320);
    } catch (_) { try { stage.scrollIntoView(); } catch (_) {} }
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
      // Load + run vision AFTER camera is live (additive, non-blocking).
      ensureVision();
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
    clearInterval(vision.timer);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    video.srcObject = null;
    ctx.fillStyle = '#07080D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resetVisionReadouts();
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
    // detectPass already bails when document.hidden — timer can keep ticking cheaply.
  });

  /* Pre-warm the vision CDNs + COCO-SSD as the camera box approaches the
     viewport, so tapping "Enable camera" is instant instead of a cold ~1MB
     serial download. Fully optional + fault-tolerant: bails on save-data /
     slow links, never blocks paint, and loadBackbone() is idempotent so the
     click path reuses whatever this warmed. Worst case = today's behaviour. */
  function warmVision() {
    if (vision.started || vision.cocoModel) return;
    const c = navigator.connection || {};
    if (c.saveData || /(?:^|\b)(?:slow-2g|2g)$/.test(c.effectiveType || '')) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    loadBackbone().then((ok) => {
      if (!ok || !vision.cocoModel) return;
      // compile the WebGL kernels with a tiny synthetic frame so the first real detect is instant
      try {
        const w = document.createElement('canvas'); w.width = w.height = 64;
        const g = w.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
        vision.cocoModel.detect(w, 1, 0.9).catch(() => {});
      } catch (_) {}
    }).catch(() => {});
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); warmVision(); }
    }, { rootMargin: '1200px' });   // warm when within ~1200px of the viewport
    io.observe(stage);
  } else {
    (window.requestIdleCallback ? requestIdleCallback(warmVision, { timeout: 5000 }) : setTimeout(warmVision, 3000));
  }

  // paint the idle "off" background
  ctx.fillStyle = '#07080D';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
})();