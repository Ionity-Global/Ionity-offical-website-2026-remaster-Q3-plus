/* ============================================================================
   IONITY · edge-forge.js — "Edge Forge": a generative AIoT-blueprint engine.
   The visitor names a scenario → AEDi (the same on-device-keyed Gemini fabric
   that powers the chat) returns a sensor → edge → AI → cloud topology → the
   canvas animates the nodes in with flowing blue→cyan data-pulses.
   • No backend, no new permissions — pure text-in / canvas-out.
   • Always renders: on any model/parse failure it falls to a bundled
     reference blueprint so the visitor never sees a dead box.
   • Honours prefers-reduced-motion; rAF pauses when off-screen.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('forgeStage');
  if (!stage) return;                                 // section not on this page

  const canvas   = $('forgeCanvas');
  const input    = $('forgeInput');
  const runBtn   = $('forgeRun');
  const titleEl  = $('forgeTitle');
  const rationEl = $('forgeRationale');
  const noteEl   = $('forgeNote');
  const chips    = [...document.querySelectorAll('.forge-chip')];
  if (!canvas) return;
  const cx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Gemini (same masked key + model fallback as AEDi chat) ─────────────── */
  const _t = 'FpHSzEHcrV3M48Vb6hle4FXYpNWY0RWWk1iUopmNUVWQ5NVY6lUQ';
  const KEY = () => { try { return atob(_t.split('').reverse().join('')); } catch (_) { return ''; } };
  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const SYS = [
    'You are AEDi, the Native-AI engineering intelligence of Ionity Global (Pty) Ltd — AIoT, Edge, Cloud and on-device AI; NOT the EV-charging network.',
    'Given a real-world scenario, design a concise AIoT solution architecture as a flow of nodes across exactly four layers: "sensor" (field sensing/edge I/O), "edge" (Ionity edge nodes / on-site compute & control), "ai" (models — on-device or cloud inference), "cloud" (dashboards, twins, storage, integration).',
    'Centre it on Ionity edge hardware + on-device AI where sensible.',
    'Return STRICT JSON only, no prose, no code fences:',
    '{"title": "<=46 chars", "rationale": "<=240 chars, one or two sentences", "nodes": [{"id":"n1","label":"<=22 chars","layer":"sensor|edge|ai|cloud"}], "edges": [["n1","n2"]]}',
    'Use 6 to 10 nodes spanning all four layers, with edges forming a left-to-right flow sensor→edge→ai→cloud. ids must be short and unique.',
  ].join('\n');

  /* ── bundled reference blueprints (instant + graceful fallback) ─────────── */
  const REFERENCE = {
    default: {
      title: 'Edge AIoT reference blueprint',
      rationale: 'A reference Ionity topology: field sensing → on-site edge inference & control → model layer → cloud twin and dashboards.',
      nodes: [
        { id: 's1', label: 'Field sensors', layer: 'sensor' },
        { id: 's2', label: 'Camera / vision', layer: 'sensor' },
        { id: 'e1', label: 'Ionity edge node', layer: 'edge' },
        { id: 'e2', label: 'Local control', layer: 'edge' },
        { id: 'a1', label: 'On-device model', layer: 'ai' },
        { id: 'a2', label: 'Anomaly detection', layer: 'ai' },
        { id: 'c1', label: 'Digital twin', layer: 'cloud' },
        { id: 'c2', label: 'Dashboard / alerts', layer: 'cloud' },
      ],
      edges: [['s1', 'e1'], ['s2', 'e1'], ['e1', 'e2'], ['e1', 'a1'], ['a1', 'a2'], ['a2', 'c1'], ['e2', 'c1'], ['c1', 'c2']],
    },
  };

  /* ── render model ───────────────────────────────────────────────────────── */
  const LAYERS = ['sensor', 'edge', 'ai', 'cloud'];
  const LAYER_LABEL = { sensor: 'SENSE', edge: 'EDGE', ai: 'AI', cloud: 'CLOUD' };
  // band tint blue→cyan
  const BAND = ['#0a3a78', '#0d5fb0', '#0e87d6', '#10b4e6'];
  const NODE = ['#0079E3', '#1f8fe6', '#19b2ec', '#00d2ff'];

  let model = null;         // {title, rationale, laid:[{...node, x,y,w,h,band,t0}], edges:[{a,b}]}
  let raf = 0, t0 = 0, onScreen = true, dpr = 1;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, r.width) * dpr;
    canvas.height = Math.max(240, r.height) * dpr;
    if (model) layout(model);
  }

  function layout(m) {
    const W = canvas.width, H = canvas.height, pad = 18 * dpr;
    const colW = (W - pad * 2) / 4;
    const byLayer = { sensor: [], edge: [], ai: [], cloud: [] };
    m.nodes.forEach((n) => (byLayer[n.layer] || byLayer.edge).push(n));
    const laid = [];
    LAYERS.forEach((layer, ci) => {
      const list = byLayer[layer];
      const cxx = pad + colW * ci + colW / 2;
      const nh = 34 * dpr, gap = 16 * dpr;
      const total = list.length * nh + Math.max(0, list.length - 1) * gap;
      let y = (H - total) / 2 + nh / 2 + 14 * dpr;
      list.forEach((n) => {
        const w = Math.min(colW - 16 * dpr, 150 * dpr);
        laid.push({ ...n, band: ci, x: cxx, y, w, h: nh });
        y += nh + gap;
      });
    });
    m.laid = laid;
    m.byId = Object.fromEntries(laid.map((n) => [n.id, n]));
    m.edgePairs = (m.edges || []).map(([a, b]) => ({ a: m.byId[a], b: m.byId[b] }))
      .filter((e) => e.a && e.b);
    laid.forEach((n, i) => (n.t0 = reduce ? 0 : i * 90));
  }

  function roundRect(x, y, w, h, r) {
    cx.beginPath();
    cx.moveTo(x - w / 2 + r, y - h / 2);
    cx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
    cx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
    cx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
    cx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
    cx.closePath();
  }

  function frame(now) {
    raf = onScreen ? requestAnimationFrame(frame) : 0;
    if (!model) return;
    if (!t0) t0 = now;
    const el = now - t0;
    const W = canvas.width, H = canvas.height;
    cx.clearRect(0, 0, W, H);

    // layer bands + headings
    const pad = 18 * dpr, colW = (W - pad * 2) / 4;
    LAYERS.forEach((layer, ci) => {
      const x = pad + colW * ci;
      cx.fillStyle = BAND[ci]; cx.globalAlpha = 0.10;
      cx.fillRect(x + 4 * dpr, 8 * dpr, colW - 8 * dpr, H - 16 * dpr);
      cx.globalAlpha = 1;
      cx.fillStyle = 'rgba(160,210,255,0.55)';
      cx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
      cx.textAlign = 'center'; cx.textBaseline = 'top';
      cx.fillText(LAYER_LABEL[layer], x + colW / 2, 12 * dpr);
    });

    // edges (animated flow)
    (model.edgePairs || []).forEach((e, i) => {
      const a = e.a, b = e.b;
      cx.strokeStyle = 'rgba(0,210,255,0.45)';
      cx.lineWidth = 1.4 * dpr;
      if (!reduce) { cx.setLineDash([6 * dpr, 6 * dpr]); cx.lineDashOffset = -(el * 0.04) % (12 * dpr); }
      cx.beginPath();
      const mx = (a.x + b.x) / 2;
      cx.moveTo(a.x + a.w / 2, a.y);
      cx.bezierCurveTo(mx, a.y, mx, b.y, b.x - b.w / 2, b.y);
      cx.stroke();
      cx.setLineDash([]);
      // travelling pulse
      if (!reduce) {
        const p = ((el * 0.00018) + i * 0.13) % 1;
        const t = p, it = 1 - t;
        const px = it * it * (a.x + a.w / 2) + 2 * it * t * mx + t * t * (b.x - b.w / 2);
        const py = it * it * a.y + 2 * it * t * b.y + t * t * b.y;
        cx.beginPath(); cx.fillStyle = '#bdeeff';
        cx.shadowColor = '#00d2ff'; cx.shadowBlur = 8 * dpr;
        cx.arc(px, py, 2.4 * dpr, 0, Math.PI * 2); cx.fill(); cx.shadowBlur = 0;
      }
    });

    // nodes (spring in)
    (model.laid || []).forEach((n) => {
      const k = reduce ? 1 : Math.max(0, Math.min(1, (el - n.t0) / 460));
      const e = 1 - Math.pow(1 - k, 3);            // easeOutCubic
      if (e <= 0) return;
      cx.globalAlpha = e;
      const s = 0.85 + 0.15 * e;
      const w = n.w * s, h = n.h * s;
      roundRect(n.x, n.y, w, h, 8 * dpr);
      cx.fillStyle = 'rgba(7,12,24,0.92)'; cx.fill();
      cx.lineWidth = 1.4 * dpr; cx.strokeStyle = NODE[n.band];
      cx.shadowColor = NODE[n.band]; cx.shadowBlur = 10 * dpr * e; cx.stroke(); cx.shadowBlur = 0;
      cx.fillStyle = '#eaf6ff';
      cx.font = `${11 * dpr}px "Chakra Petch","JetBrains Mono",sans-serif`;
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      let label = n.label || '';
      while (cx.measureText(label).width > w - 12 * dpr && label.length > 4) label = label.slice(0, -2);
      cx.fillText(label === n.label ? label : label + '…', n.x, n.y);
      cx.globalAlpha = 1;
    });

    if (reduce) cancelAnimationFrame(raf);          // one static frame is enough
  }

  function render(m) {
    model = m;
    if (titleEl) titleEl.textContent = m.title || 'Blueprint';
    if (rationEl) rationEl.textContent = m.rationale || '';
    layout(m);
    t0 = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  /* ── generate via AEDi, with graceful fallback ──────────────────────────── */
  function clean(txt) {
    return (txt || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  function validate(o) {
    if (!o || !Array.isArray(o.nodes) || !o.nodes.length || !Array.isArray(o.edges)) return null;
    o.nodes = o.nodes.filter((n) => n && n.id && n.label && LAYERS.includes(n.layer)).slice(0, 12);
    if (!o.nodes.length) return null;
    o.title = String(o.title || 'Blueprint').slice(0, 60);
    o.rationale = String(o.rationale || '').slice(0, 280);
    return o;
  }

  async function callModel(modelName, prompt) {
    const body = {
      system_instruction: { parts: [{ text: SYS }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 700, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
      safetySettings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };
    const res = await fetch(`${BASE}${modelName}:generateContent?key=${KEY()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join('').trim();
    try { return validate(JSON.parse(clean(text))); } catch (_) { return null; }
  }

  let busy = false;
  async function forge(prompt) {
    if (busy || !prompt) return;
    busy = true;
    if (runBtn) { runBtn.disabled = true; }
    if (noteEl) noteEl.textContent = 'AEDi is forging a blueprint…';
    let out = null;
    for (const m of MODELS) {
      try { out = await callModel(m, prompt); } catch (_) { out = null; }
      if (out) break;
    }
    if (out) {
      render(out);
      if (noteEl) noteEl.innerHTML = 'AI-generated illustration, not final engineering · <a href="contact.html">Start a real project ↗</a>';
    } else {
      render(REFERENCE.default);
      if (noteEl) noteEl.innerHTML = 'Showing a reference design — AEDi is busy; try again shortly. · <a href="contact.html">Start a real project ↗</a>';
    }
    busy = false;
    if (runBtn) runBtn.disabled = false;
  }

  /* ── wire UI ────────────────────────────────────────────────────────────── */
  chips.forEach((c) => c.addEventListener('click', () => {
    const p = c.dataset.prompt || c.textContent.trim();
    if (input) input.value = p;
    forge(p);
  }));
  if (runBtn) runBtn.addEventListener('click', () => forge((input && input.value.trim()) || 'A smart factory line that predicts machine failure'));
  if (input) input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); forge(input.value.trim()); }
  });

  // resize-aware + pause when off-screen
  if ('ResizeObserver' in window) new ResizeObserver(() => size()).observe(canvas);
  else addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      onScreen = es.some((e) => e.isIntersecting);
      if (onScreen && model && !raf) { t0 = 0; raf = requestAnimationFrame(frame); }
    }, { threshold: 0.05 }).observe(canvas);
  }

  // first paint: instant reference blueprint so the box is alive before any AI call
  size();
  render(REFERENCE.default);
})();
