/* ============================================================================
   IONITY GLOBAL — backdrop.js
   Signature Three.js WebGL hero/background — a faithful port of the legacy
   "portal" backdrop (3D drifting clouds, exponential fog, UnrealBloom,
   cyan underlighting, a sweeping "lighthouse" light, mouse-reactive parallax)
   re-coloured for the 2026 remaster palette.

   No build step. Pure ES module. Assumes the HTML <head> provides an
   importmap mapping "three" and "three/addons/" to the jsDelivr CDN:

     <script type="importmap">
     { "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
     }}
     </script>

   PERF / RESPECT GUARDS — WebGL is *never* started (and html.no3d is set so the
   CSS image fallback covers the page) when ANY of these hold:
     • prefers-reduced-motion: reduce
     • navigator.hardwareConcurrency <= 4   (low-core / likely low-power device)
     • screen width < 760                   (phones / small tablets)
     • WebGL is unavailable
   devicePixelRatio is capped at 1.5; rAF pauses while the tab is hidden.
   ========================================================================== */

/* -------------------------------------------------------------- PALETTE --- */
/* 2026 remaster brand tokens (NOT the legacy #3366FF). Hex → 0xRRGGBB. */
const C = {
  blue:     0x0079E3,
  blueDeep: 0x0A51AB,
  cyan:     0x00D2FF,
  orange:   0xFF9500,
  amber:    0xFFB23E,
  live:     0xFF2828,
  bg:       0x07080D,
};

/* ------------------------------------------------------- CAPABILITY GATE --- */
/** Quick, allocation-free WebGL probe. Returns true if a context can be made. */
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (_) {
    return false;
  }
}

/** Decide whether we are allowed to run the heavy WebGL scene. */
function shouldRun() {
  const reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowCore = (navigator.hardwareConcurrency || 8) <= 4;
  const small = (window.screen && window.screen.width || window.innerWidth) < 760;
  return !reduce && !lowCore && !small && webglOK();
}

/* If we bail, flag the document so CSS can paint the static fallback image. */
if (!shouldRun()) {
  document.documentElement.classList.add('no3d');
} else {
  // Defer the heavy import until we've decided to run, so low-end devices
  // never even fetch the Three.js bundle. Retry once after a short delay so a
  // transient cold-CDN miss on first paint doesn't rob the visitor of the scene.
  boot()
    .catch(() => new Promise((r) => setTimeout(r, 900)).then(boot))
    .catch((err) => {
      console.warn('[backdrop] init failed after retry, using CSS fallback:', err);
      document.documentElement.classList.add('no3d');
    });
}

/* ============================================================ MAIN BOOT === */
async function boot() {
  const THREE = await import('three');

  /* ---------------------------------------------------------- CANVAS ----- */
  // Reuse an existing #bg3d if the page already provides one, else create it.
  let canvas = document.getElementById('bg3d');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'bg3d';
    document.body.appendChild(canvas);
  }
  // Style it as a fixed, full-viewport, click-through layer that sits BEHIND
  // #main (which carries its own z-index/background). z-index:-2 matches the
  // CSS .bg-field it visually replaces; .bg-grid (-1) overlays on top of it.
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '-2',
    pointerEvents: 'none',
    display: 'block',
  });

  /* ---------------------------------------------------------- SCENE ------ */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  // Exponential dark fog — same character as the legacy FogExp2, tuned to the
  // darker #07080D backdrop so depth fades cleanly to black.
  scene.fog = new THREE.FogExp2(C.bg, 0.00065);

  const camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 1, 5000,
  );
  camera.position.z = 1200;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Cap DPR at 1.5 for performance (legacy used 2.0).
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  // ACESFilmic tonemapping + generous exposure for the bright, blooming look.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 3.4;

  /* ----------------------------------------------------- POST-PROCESS ---- */
  // EffectComposer + UnrealBloomPass, WRAPPED in try/catch. If the addons fail
  // to load (CDN/CSP), we fall back to a plain renderer.render — never a blank
  // screen.
  let composer = null;
  let bloomPass = null;
  try {
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');

    const renderScene = new RenderPass(scene, camera);
    // Same UnrealBloomPass signature as the legacy scene: (resolution, strength,
    // radius, threshold) = (1.5, 0.4, 0.85) then overridden below.
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85,
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.4;
    bloomPass.radius = 0.5;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
  } catch (err) {
    console.warn('[backdrop] bloom addons unavailable, plain render:', err);
    composer = null; // signal: use renderer.render
  }

  /* ---------------------------------------------------------- LIGHTS ----- */
  // Low ambient for high contrast.
  scene.add(new THREE.AmbientLight(0x404048, 0.6));

  // Strong CYAN directional underlighting — the signature "from below" glow.
  const bottomLight = new THREE.DirectionalLight(C.cyan, 2.4);
  bottomLight.position.set(0, -500, 200);
  scene.add(bottomLight);

  // Cyan deep-glow point light, animated in the loop.
  const deepGlow = new THREE.PointLight(C.cyan, 3.2, 1200, 1.5);
  deepGlow.position.set(0, -200, 200);
  scene.add(deepGlow);

  // A touch of ORANGE from the opposite side — warm rim to balance the cyan,
  // matching the IONITY-blue / GLOBAL-orange brand pairing.
  const warmGlow = new THREE.PointLight(C.orange, 1.6, 1400, 1.6);
  warmGlow.position.set(350, 250, 150);
  scene.add(warmGlow);

  // Occasional cyan/blue lightning flash.
  const flash = new THREE.PointLight(C.cyan, 0, 0, 1.7);
  scene.add(flash);

  // The sweeping "lighthouse" — a bright point light that tracks across the
  // scene on an interval, raking the clouds with light.
  const lighthouseLight = new THREE.PointLight(0xffffff, 0, 4000, 1.5);
  lighthouseLight.position.set(-2500, 0, 600);
  scene.add(lighthouseLight);

  /* ------------------------------------------------------ CLOUD TEXTURE -- */
  // Soft radial puff drawn to a canvas — additively blended for that glowing,
  // volumetric haze. Re-tinted very slightly cool to sit in the palette.
  function createCloudTexture() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0.0, 'rgba(235, 245, 255, 0.80)');
    g.addColorStop(0.3, 'rgba(190, 220, 255, 0.40)');
    g.addColorStop(0.7, 'rgba(150, 195, 255, 0.14)');
    g.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  }

  /* ----------------------------------------------------------- CLOUDS ---- */
  const CLOUD_COUNT = 32;
  const cloudParticles = [];
  const cloudGeo = new THREE.PlaneGeometry(800, 800);
  const cloudMat = new THREE.MeshLambertMaterial({
    map: createCloudTexture(),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.set(
      Math.random() * 2000 - 1000,
      Math.random() * 800 - 400,
      Math.random() * 2000 - 1500,
    );
    cloud.rotation.z = Math.random() * Math.PI;
    cloud.scale.setScalar(0.8 + Math.random());
    scene.add(cloud);
    cloudParticles.push({ mesh: cloud, speed: (Math.random() - 0.5) * 0.0009 });
  }

  /* ------------------------------------------------------------- GRID ---- */
  // Faint perspective grid drifting toward the camera — cyan lines on deep
  // blue, additively blended, sitting low under the clouds.
  const gridHelper = new THREE.GridHelper(4000, 80, C.cyan, C.blueDeep);
  gridHelper.position.y = -600;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.18;
  gridHelper.material.blending = THREE.AdditiveBlending;
  scene.add(gridHelper);

  /* ---------------------------------------------------- ACCENT DIAMONDS -- */
  // Small glinting octahedra drifting across — emissive cyan with an orange
  // catch when the lighthouse rakes past, for sparkle without heavy cost.
  const DIAMOND_COUNT = 22;
  const diamonds = [];
  const diamondGeo = new THREE.OctahedronGeometry(15, 0);
  for (let i = 0; i < DIAMOND_COUNT; i++) {
    // Per-instance material so emissive can be modulated individually.
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.15,
      emissive: C.cyan,
      emissiveIntensity: 0.25,
    });
    const d = new THREE.Mesh(diamondGeo, mat);
    d.position.set(
      Math.random() * 3000 - 1500,
      Math.random() * 1000 - 500,
      Math.random() * 800 - 200,
    );
    d.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    scene.add(d);
    diamonds.push({
      mesh: d,
      rotX: (Math.random() - 0.5) * 0.01,
      rotY: (Math.random() - 0.5) * 0.01,
      drift: Math.random() * 0.2 + 0.05,
    });
  }

  /* ---------------------------------------------------------- POINTERS --- */
  // Mouse drives gentle camera parallax. We track normalised device coords and
  // a raycaster-projected world point (kept for parity / future hooks).
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouseWorld = new THREE.Vector3();

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  /* ------------------------------------------------------- LIGHTHOUSE ---- */
  const LIGHTHOUSE_INTERVAL = 10000; // ms between sweeps
  let lighthouseActive = false;
  let lighthouseX = -2500;
  const lighthouseTimer = setInterval(() => {
    lighthouseActive = true;
    lighthouseX = -2500;
  }, LIGHTHOUSE_INTERVAL);
  // Kick off the first sweep shortly after load.
  setTimeout(() => { lighthouseActive = true; lighthouseX = -2500; }, 1800);

  const LIGHTNING_CHANCE = 0.004;

  /* --------------------------------------------------------- RESIZE ------ */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      if (bloomPass) bloomPass.setSize(window.innerWidth, window.innerHeight);
    }
  }
  window.addEventListener('resize', onResize);

  /* ------------------------------------------------------- ANIMATE ------- */
  let rafId = 0;
  let running = true;

  function animate() {
    if (!running) return;
    rafId = requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(mousePlane, mouseWorld);

    // Slow grid drift toward camera.
    gridHelper.position.z += 0.1;
    if (gridHelper.position.z > 50) gridHelper.position.z = 0;

    // Clouds slowly rotate in place.
    for (const c of cloudParticles) {
      c.mesh.rotation.z += c.speed;
    }

    // Diamonds rotate + drift, wrapping across the field.
    for (const d of diamonds) {
      d.mesh.rotation.x += d.rotX;
      d.mesh.rotation.y += d.rotY;
      d.mesh.position.x += d.drift;
      if (d.mesh.position.x > 1500) d.mesh.position.x = -1500;
    }

    // Sweeping lighthouse: tracks left→right, intensity peaks at centre.
    if (lighthouseActive) {
      lighthouseX += 45;
      lighthouseLight.position.x = lighthouseX;
      const dist = Math.abs(lighthouseX);
      const range = 1000;
      let intensity = 0;
      if (dist < range) {
        const norm = 1 - dist / range;
        intensity = norm * norm * 55;
      }
      lighthouseLight.intensity = intensity;
      // Diamonds catch a warm glint as the beam passes.
      for (const d of diamonds) {
        const near = Math.abs(d.mesh.position.x - lighthouseX) < 400;
        d.mesh.material.emissive.setHex(near ? C.amber : C.cyan);
        d.mesh.material.emissiveIntensity = near ? 1.8 : 0.25;
      }
      if (lighthouseX > 2500) {
        lighthouseActive = false;
        lighthouseLight.intensity = 0;
      }
    } else {
      lighthouseLight.intensity = 0;
    }

    // Occasional cyan/blue lightning flash, then decay.
    if (Math.random() < LIGHTNING_CHANCE) {
      flash.position.set(
        Math.random() * 800 - 400,
        Math.random() * 400 - 200,
        Math.random() * 600 - 300,
      );
      flash.intensity = 40 + Math.random() * 90;
      flash.color.setHex(Math.random() < 0.5 ? C.cyan : C.blue);
    } else {
      flash.intensity *= 0.85;
    }

    // Animate the deep cyan glow — gentle breathing pulse.
    const t = Date.now() * 0.001;
    deepGlow.intensity = 2.0 + Math.sin(t) * 0.5;
    deepGlow.position.y = -200 + Math.cos(t * 0.5) * 50;
    // Warm orange glow drifts subtly on the opposite phase.
    warmGlow.intensity = 1.3 + Math.sin(t * 0.8 + 1.5) * 0.4;

    // Gentle mouse parallax on the camera (eased toward target).
    camera.position.x += (mouse.x * 60 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 60 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Render: bloom composer if available, else plain render. Either path is
    // wrapped so a per-frame error can never blank the page silently.
    try {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    } catch (err) {
      console.warn('[backdrop] render error, dropping to plain render:', err);
      composer = null;
      renderer.render(scene, camera);
    }
  }

  // Pause rAF when the tab is hidden; resume when visible.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!running) {
      running = true;
      animate();
    }
  });

  animate();
}
