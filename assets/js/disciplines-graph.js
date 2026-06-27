/* ============================================================================
   IONITY · disciplines-graph.js — a live 3D "mindmap" of the ten disciplines.
   Canvas-rendered pseudo-3D node graph: a central IONITY hub with ten discipline
   nodes on a sphere, edges hub→node + a cross-linked ring, auto-rotating with
   perspective + drag-to-spin. No dependencies. Honors reduced-motion; pauses off
   screen / when the tab is hidden.
   ========================================================================== */
(() => {
  'use strict';
  const stage = document.getElementById('discStage');
  const canvas = document.getElementById('discCanvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LABELS = [
    'Digital Innovation', 'Internet of Things', 'AI · Offline', 'AI · Online',
    'Mechanical Engineering', 'Electrotechnics', 'Product Development',
    'Software Engineering', 'Cloud & Edge',
    'Computer-Aided Drafting (CAD)', 'AI Automation Solutions', 'Technical Advisory',
  ];
  const N = LABELS.length;

  // even points on a sphere (fibonacci) → balanced 3D layout
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;            // 1 … -1
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    nodes.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r, label: LABELS[i] });
  }
  // edges: hub→every node, plus a ring linking neighbours (the "mindmap" web)
  const ring = [];
  for (let i = 0; i < N; i++) ring.push([i, (i + 1) % N]);
  const extra = [[0, 5], [2, 7], [3, 9], [1, 6], [4, 8], [3, 10], [8, 11], [10, 6]];   // a few cross-links (incl. the new nodes)

  let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.34;
  }

  let yaw = 0.6, pitch = -0.25, dragging = false, lastX = 0, lastY = 0, vYaw = 0.0024;

  function project(n) {
    // rotate around Y (yaw) then X (pitch)
    let x = n.x, y = n.y, z = n.z;
    let cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    let x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
    let cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    let y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
    const focal = 2.6;
    const scale = focal / (focal - z2);          // perspective
    return { sx: cx + x1 * R * scale, sy: cy + y1 * R * scale, depth: z2, scale };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const pts = nodes.map(project);
    const hub = { sx: cx, sy: cy, depth: 0, scale: 1 };

    // edges first (back to front by average depth), depth → opacity
    const edges = [];
    for (let i = 0; i < N; i++) edges.push({ a: hub, b: pts[i], d: pts[i].depth, hub: true });
    ring.concat(extra).forEach(([i, j]) => edges.push({ a: pts[i], b: pts[j], d: (pts[i].depth + pts[j].depth) / 2 }));
    edges.sort((p, q) => p.d - q.d);
    edges.forEach(e => {
      const o = Math.max(0.05, (e.d + 1.1) / 2.2);
      ctx.strokeStyle = e.hub ? `rgba(0,210,255,${0.10 + o * 0.30})` : `rgba(0,121,227,${0.04 + o * 0.20})`;
      ctx.lineWidth = e.hub ? 1.1 : 0.8;
      ctx.beginPath(); ctx.moveTo(e.a.sx, e.a.sy); ctx.lineTo(e.b.sx, e.b.sy); ctx.stroke();
    });

    // hub
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fillStyle = '#FF9500';
    ctx.shadowColor = 'rgba(255,149,0,.8)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
    ctx.font = '700 13px "Chakra Petch","Space Grotesk",sans-serif';
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('IONITY', cx, cy - 14);

    // nodes back→front
    const order = pts.map((p, i) => i).sort((a, b) => pts[a].depth - pts[b].depth);
    order.forEach(i => {
      const p = pts[i]; const o = Math.max(0.18, (p.depth + 1.1) / 2.2);
      const rad = 2.5 + p.scale * 2.8;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, rad, 0, 7);
      ctx.fillStyle = `rgba(0,210,255,${o})`;
      ctx.shadowColor = 'rgba(0,210,255,.7)'; ctx.shadowBlur = 8 * o; ctx.fill(); ctx.shadowBlur = 0;
      ctx.font = `600 ${Math.round(10.5 + p.scale * 2)}px "Chakra Petch","Space Grotesk",sans-serif`;
      ctx.fillStyle = `rgba(225,240,255,${0.35 + o * 0.6})`;
      ctx.textAlign = 'center';
      ctx.fillText(nodes[i].label, p.sx, p.sy - rad - 5);   // label lives on the node, not the projected point
    });
  }

  let raf = 0;
  function tick() {
    if (!dragging && !reduce) yaw += vYaw;
    draw();
    raf = document.hidden ? 0 : requestAnimationFrame(tick);   // run whenever the tab is visible
  }

  // drag to spin
  stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.008; pitch += (e.clientY - lastY) * 0.006;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = () => { dragging = false; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => { resize(); draw(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) tick(); });

  resize();
  if (reduce) draw(); else tick();
})();
