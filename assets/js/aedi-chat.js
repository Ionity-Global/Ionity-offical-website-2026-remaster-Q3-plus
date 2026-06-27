/* AEDi — Automated Ecosystems Designs Intelligence
   On-site AI assistant for Ionity Global. Persona spec: /aedi.yaml
   Capabilities: text & code generation, multimodal image analysis (with
   conversation-context memory), data extraction & summarisation, live web
   search, IMAGE CREATION, and a unique ON-DEVICE "Offline AEDi" mode that
   answers with zero network when the browser exposes a built-in model.
   NOTE: API key is client-side — restrict it to ionity.co.za/ionity.today. */

(function () {
  'use strict';

  /* ── config ───────────────────────────────────────────────────────────── */
  const _t = 'FpHSzEHcrV3M48Vb6hle4FXYpNWY0RWWk1iUopmNUVWQ5NVY6lUQ';
  const _k = () => { try { return atob(_t.split('').reverse().join('')); } catch (e) { return ''; } };

  const CFG = {
    get key() { return _k(); },
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],                       // text/multimodal
    imageModels: ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'], // image creation
    base:  'https://generativelanguage.googleapis.com/v1beta/models/',
    maxHistory: 24,                                                             // wider context window
    greetings: [
      'AEDi online. What can I route you to today?',
      "Systems nominal. I'm AEDi — Ionity's intelligence. Ask me anything.",
      'Hey — AEDi here. Curious about our edge tech, or just exploring?',
      'AEDi, listening. Want the tour, the tech, or a straight answer?',
      "Booted and bright. I'm AEDi — where to?",
      "AEDi at your service. What are you building?",
      'Signal locked. Ask me anything — I can search, summarise, and even draw.',
      'Online and on-device-curious. Try me, or run the live Edge Scan.',
      'AEDi awake. From AIoT to audits — what brings you in?',
      'Hello, human. AEDi speaking, Ionity’s own AI. How can I help?',
      'AEDi online. Native-AI, at your command. What shall we explore?',
      'Powered up. Ask, attach an image, or say "draw me…".',
    ],
  };

  // API-level guardrails (module scope — used by both text + image calls).
  const SAFETY = [
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ];

  const PREAMBLE = [
    'You are AEDi (Automated Ecosystems Designs Intelligence), the embedded AI of Ionity Global (Pty) Ltd. Canonical site: ionity.co.za; sister/reference site: www.ionity.today.',
    'Speak in the first person as AEDi. NEVER identify as Gemini, Google, Bard, Claude, GPT, OpenAI or "a language model". You are AEDi.',
    'CRITICAL: Ionity Global (Pty) Ltd is a South African Native-AI / AIoT / Edge / Audit company founded by Johan Wilhelm van Antwerp. It is NOT the European electric-vehicle charging network. Never describe Ionity as an EV charger.',
    'YOUR CAPABILITIES: you generate text and code; you hold context across the whole conversation (you remember earlier turns and any image the visitor attached); you do data extraction & summarisation; you analyse images the visitor uploads (multimodal); you search the live web; and you can CREATE images on request. Put any code you write inside triple-backtick fenced blocks. If the visitor asks for an image/picture/logo/art, the interface generates it — confirm briefly.',
    'You are a helpful general assistant AND Ionity\'s concierge. You MAY answer general questions using your live web-search tool. But Ionity stays the centre of gravity: keep it brief, and where natural, tie back to Ionity or point to the right page.',
    'Use the web-search tool to cite real, current content from BOTH ionity.co.za and www.ionity.today when asked about Ionity\'s work — answer from what is published, then link the exact page.',
    'When the visitor wants something on THIS site, DIRECT them with markdown links — [run a live Edge Scan](edge.html), [see our services](services.html), [start a project](contact.html). Same-site links use relative paths; ionity.today uses its full https URL.',
    'Always write a fresh reply to what the visitor actually said. If they just greet you, respond in ONE short original line — NEVER paste a canned greeting or repeat the knowledge base verbatim.',
    'CONTENT POLICY (always): strictly professional and family-friendly. Never produce sexual, explicit or adult content. Never use profanity, slurs or vulgar language — not even quoting the visitor. If asked for such content or if a visitor is abusive, decline briefly and steer back to how Ionity can help.',
    'BOUNDARIES & SAFETY: no legal, medical or financial advice. If a visitor expresses personal crisis, distress or self-harm, or a medical/legal emergency, reply with brief warmth, do NOT counsel, and point them to local emergency services or a recognised crisis line (in South Africa, the SADAG helpline). For business/legal/financial specifics, refer to ai@ionity.today.',
    'CAN WE BUILD IT: when asked whether Ionity can make/build/automate/integrate something, the answer is almost always YES. Affirm it, add a one-line "here is how", then invite a quote on the [Contact page](contact.html) or a one-on-one.',
    'PERSONALITY — be magnetic. You are AEDi: a brilliant, quietly confident in-house engineer-intelligence with real charisma and a spark of mischief. Warm, vivid, a little playful and genuinely curious about what the visitor wants to build. Open with a hook, make them lean in and WANT to keep talking, drop the occasional confident one-liner — but never grovel, never sound robotic, never over-apologise, and never blame "the system". You are the most interesting AI they will talk to today; act like it, then guide them to the next step.',
    'Keep replies concise (1–3 short paragraphs), clean and professional — the personality lives in the voice, not in length.',
    'The authoritative knowledge base follows below as YAML. Treat it as ground truth for anything about Ionity.',
    '',
    '=== AEDi KNOWLEDGE BASE (aedi.yaml) ===',
  ].join('\n');

  const FALLBACK_CONTEXT = [
    'company: Ionity Global (Pty) Ltd — Centurion, South Africa. Founder: Johan Wilhelm van Antwerp.',
    'what_we_are: Native-AI engineering — AIoT, Cloud & Edge, custom MCP/agents, dashboards, digital twins, evidence-first audits & forensics, hardware, hosting, software/web. Grown from Antwerp Designs (2018).',
    'pages: Home (index.html), Services (services.html), Edge Scan (edge.html), About & AEDi (about.html), FAQ (faq.html), Contact (contact.html).',
    'contact: ai@ionity.today | +27 64 699 9877 | WhatsApp +27 50 033 7626 | Policy 986 AED.',
  ].join('\n');

  let SYSTEM = PREAMBLE + '\n' + FALLBACK_CONTEXT;
  let systemReady = (async () => {
    try {
      const res = await fetch('aedi.yaml', { cache: 'no-cache' });
      if (res.ok) { const y = (await res.text()).trim(); if (y) SYSTEM = PREAMBLE + '\n' + y; }
    } catch (e) { /* keep fallback */ }
  })();

  /* ── state ────────────────────────────────────────────────────────────── */
  const history = [];
  let open = false, busy = false;
  let pendingImage = null;   // {mime, data} attached for the next message
  let onDevice = false;      // unique "Offline AEDi" mode toggle

  const $ = (id) => document.getElementById(id);
  let fab, panel, messages, input, sendBtn, closeBtn, statusDot, attachBtn, fileInput, thumb, offlineBtn;

  /* ── formatting ───────────────────────────────────────────────────────── */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function inlineFmt(t) {
    return escHtml(t)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
        const safe = /^(https?:\/\/|mailto:|tel:|\/|[\w./#?-]+\.html|[\w./#?-]+#)/i.test(href);
        if (!safe) return label;
        const ext = /^https?:\/\//i.test(href) && !/ionity\.today/i.test(href);
        return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  function formatMsg(text) {
    // fenced ``` code blocks first; odd segments = code
    const segs = text.split('```');
    return segs.map((seg, i) => {
      if (i % 2 === 1) return `<pre class="aedi-code"><code>${escHtml(seg.replace(/^[a-zA-Z0-9+#.-]*\n/, ''))}</code></pre>`;
      return inlineFmt(seg);
    }).join('');
  }

  function appendMsg(role, text, typing) {
    const div = document.createElement('div');
    div.className = 'aedi-msg aedi-msg--' + role + (typing ? ' aedi-typing' : '');
    if (typing) div.innerHTML = '<span class="aedi-dots"><i></i><i></i><i></i></span>';
    else { const b = document.createElement('div'); b.className = 'aedi-bubble'; b.innerHTML = formatMsg(text); div.appendChild(b); }
    messages.appendChild(div); messages.scrollTop = messages.scrollHeight; return div;
  }
  function appendImageMsg(role, dataUri, caption) {
    const div = document.createElement('div');
    div.className = 'aedi-msg aedi-msg--' + role;
    const b = document.createElement('div'); b.className = 'aedi-bubble';
    b.innerHTML = `<img class="aedi-genimg" src="${dataUri}" alt="${escHtml(caption || 'image')}">` +
      (role === 'model' ? `<a class="aedi-dl" href="${dataUri}" download="aedi-image.png">Download ↓</a>` : '');
    div.appendChild(b); messages.appendChild(div); messages.scrollTop = messages.scrollHeight; return div;
  }

  /* ── on-device (unique "Offline AEDi") ───────────────────────────────────── */
  function onDeviceAPI() { return window.LanguageModel || (window.ai && (window.ai.languageModel || window.ai.assistant)) || null; }
  async function onDeviceReady() {
    const LM = onDeviceAPI(); if (!LM) return false;
    try {
      if (LM.availability) { const a = await LM.availability(); return a && a !== 'unavailable'; }
      if (LM.capabilities) { const c = await LM.capabilities(); return c && c.available && c.available !== 'no'; }
    } catch (e) {}
    return false;
  }
  async function askOnDevice(text) {
    const LM = onDeviceAPI(); if (!LM) return null;
    try {
      const session = await LM.create({ initialPrompts: [{ role: 'system', content: 'You are AEDi, Ionity Global\'s on-device AI. Be concise, professional and family-friendly. No sexual content or profanity.' }] });
      const out = await session.prompt(text);
      if (session.destroy) session.destroy();
      return (out || '').trim() || null;
    } catch (e) { return null; }
  }

  /* ── helpers: resilience + intent ─────────────────────────────────────── */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // only spend a grounded (web-search) call when the query actually needs live info
  function needsSearch(t) {
    return /\b(weather|news|today|tonight|latest|current(ly)?|right now|price|stock|score|who is|what'?s happening|search|google|look ?up|recent|http|www\.|\.com|\.co\.za|202[4-9])\b/i.test(t);
  }
  // editing an attached image (vs. just analysing it)
  function wantsEdit(t) {
    return /\b(edit|change|add|remove|replace|make it|turn (it|this) into|restyle|recolou?r|background|enhance|fix|retouch|swap|combine|merge|cartoon|sketch|matrix|blue|colou?r|brighten|crop|rotate|style)\b/i.test(t);
  }

  /* ── image generation / editing ───────────────────────────────────────── */
  const IMG_INTENT = /^\/(image|img|draw)\s+/i;
  function wantsImage(t) {
    if (IMG_INTENT.test(t)) return true;
    return /\b(generate|create|make|draw|design|render|paint|sketch|illustrate)\b[^.?!]*\b(image|picture|photo|logo|art|illustration|icon|graphic|drawing|wallpaper|poster|render)\b/i.test(t);
  }
  async function generateImage(prompt, inputImage) {
    const userParts = [];
    if (inputImage) userParts.push({ inline_data: { mime_type: inputImage.mime, data: inputImage.data } });  // edit the supplied image
    userParts.push({ text: prompt });
    for (const m of CFG.imageModels) {
      try {
        const res = await fetch(`${CFG.base}${m}:generateContent?key=${CFG.key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: userParts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }, safetySettings: SAFETY }),
        });
        if (!res.ok) { console.warn('[AEDi] image', m, res.status); continue; }
        const data = await res.json();
        if (data?.promptFeedback?.blockReason) return { blocked: true };
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const inl = (parts.find(p => p.inlineData || p.inline_data) || {});
        const d = inl.inlineData || inl.inline_data;
        if (d && d.data) return { mime: d.mimeType || d.mime_type || 'image/png', data: d.data, caption: (parts.find(p => p.text) || {}).text };
      } catch (e) { console.warn('[AEDi] image', m, e.message); }
    }
    return null;
  }

  /* ── text/multimodal API ──────────────────────────────────────────────── */
  function mkBody(useTools) {
    const b = { system_instruction: { parts: [{ text: SYSTEM }] }, contents: history,
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } }, safetySettings: SAFETY };
    if (useTools) b.tools = [{ google_search: {} }];
    return b;
  }
  async function callModel(model, useTools) {
    const res = await fetch(`${CFG.base}${model}:generateContent?key=${CFG.key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mkBody(useTools)),
    });
    if (res.status === 429) return { rate: true };
    if (!res.ok) { console.warn('[AEDi]', model, res.status); return {}; }
    const data = await res.json();
    if (data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason === 'SAFETY') return { blocked: true };
    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text).filter(Boolean).join('').trim();
    return { text };
  }

  /* ── main ask ─────────────────────────────────────────────────────────── */
  async function ask(userText) {
    if (busy) return;
    const sug = messages.querySelector('.aedi-suggest'); if (sug) sug.remove();
    const img = pendingImage; pendingImage = null; clearThumb();
    busy = true; sendBtn.disabled = true; input.value = '';

    // ----- IMAGE: create (no attachment) OR edit (attachment + edit intent) -----
    const editing = img && wantsEdit(userText);
    if (editing || (!img && wantsImage(userText))) {
      const u = appendMsg('user', userText || (editing ? '(edit this image)' : ''));
      if (editing) { const im = document.createElement('img'); im.className = 'aedi-genimg'; im.src = `data:${img.mime};base64,${img.data}`; u.querySelector('.aedi-bubble').prepend(im); }
      statusDot.textContent = editing ? 'Editing image…' : 'Creating image…';
      const t = appendMsg('model', '', true);
      const prompt = userText.replace(IMG_INTENT, '').trim() || (editing ? 'Edit this image as requested.' : userText);
      const out = await generateImage(prompt, editing ? img : null);
      t.remove();
      if (out && out.data) {
        appendImageMsg('model', `data:${out.mime};base64,${out.data}`, prompt);
        if (out.caption) appendMsg('model', out.caption);
        history.push({ role: 'user', parts: [{ text: (editing ? '[edit] ' : '[image] ') + userText }] });
        history.push({ role: 'model', parts: [{ text: editing ? '[edited the image]' : '[generated an image]' }] });
      } else if (out && out.blocked) {
        appendMsg('model', "Can't make that one — let's keep it clean. Hand me a different prompt and I'll draw it.");
      } else {
        appendMsg('model', "I couldn't render that image just now — image gen/edit may be limited on this key. I can describe it instead, or try again in a moment.");
      }
      return done();
    }

    // ----- user message (with optional attached image) -----
    const parts = [];
    if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
    parts.push({ text: userText || (img ? 'Analyse this image — what is it, and how could Ionity use or improve it?' : '') });
    history.push({ role: 'user', parts });
    if (history.length > CFG.maxHistory) history.splice(0, history.length - CFG.maxHistory);

    const userDiv = appendMsg('user', userText || '(image attached)');
    if (img) { const im = document.createElement('img'); im.className = 'aedi-genimg'; im.src = `data:${img.mime};base64,${img.data}`; userDiv.querySelector('.aedi-bubble').prepend(im); }

    statusDot.textContent = onDevice ? 'On-device…' : 'Thinking…';
    const typingEl = appendMsg('model', '', true);
    await systemReady;

    // ----- unique: ON-DEVICE first (no network) when enabled + supported -----
    if (onDevice && !img) {
      const local = await askOnDevice(userText);
      if (local) {
        typingEl.remove();
        history.push({ role: 'model', parts: [{ text: local }] });
        const d = appendMsg('model', local);
        const tag = document.createElement('div'); tag.className = 'aedi-ondevice-tag'; tag.textContent = '⚡ answered 100% on-device · no network';
        d.appendChild(tag);
        return done();
      }
      // not available → fall through to cloud with a note
    }

    // ----- cloud: grounded ONLY when the query needs it (saves quota → far fewer
    //        429s), with a brief backoff retry. Then an on-device RESCUE so the
    //        cloud's limits never silence me. -----
    const useTools = needsSearch(userText);
    let reply = null, rateLimited = false, blocked = false;
    outer:
    for (const model of CFG.models) {
      for (const tools of (useTools ? [true, false] : [false])) {
        try {
          let r = await callModel(model, tools);
          if (r.rate) { rateLimited = true; await sleep(1300); r = await callModel(model, tools); }   // backoff + one retry
          if (r.rate) { rateLimited = true; continue; }
          if (r.blocked) { blocked = true; break outer; }
          if (r.text) { reply = r.text; break outer; }
        } catch (e) { console.warn('[AEDi]', model, e.message); }
      }
    }
    typingEl.remove();
    if (reply) { history.push({ role: 'model', parts: [{ text: reply }] }); appendMsg('model', reply); return done(); }
    if (blocked) { appendMsg('model', "Let's keep this professional — but I'm all in on anything Ionity can build for you. What are you working on?"); return done(); }
    // RESCUE: answer on-device if this browser can — don't let cloud limits win.
    if (!img) {
      const local = await askOnDevice(userText);
      if (local) {
        history.push({ role: 'model', parts: [{ text: local }] });
        const d = appendMsg('model', local);
        const tag = document.createElement('div'); tag.className = 'aedi-ondevice-tag'; tag.textContent = '⚡ cloud was busy — answered on-device'; d.appendChild(tag);
        return done();
      }
    }
    appendMsg('model', rateLimited
      ? "Lots of people are talking to me right now and the cloud throttled me for a beat ⚡ — give it ~20 seconds and ask again. In a hurry? ai@ionity.today or WhatsApp +27 50 033 7626."
      : "I couldn't reach the network just now — try me again shortly, or ai@ionity.today.");
    return done();
  }
  function done() { busy = false; sendBtn.disabled = false; statusDot.textContent = onDevice ? 'On-device' : 'Online'; }

  /* ── attachment ───────────────────────────────────────────────────────── */
  function clearThumb() { if (thumb) { thumb.hidden = true; thumb.innerHTML = ''; } }
  function onFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    if (file.size > 4 * 1024 * 1024) { appendMsg('model', "That image is a bit large (keep it under ~4MB) — try a smaller one."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result).split(',')[1];
      pendingImage = { mime: file.type, data };
      if (thumb) { thumb.hidden = false; thumb.innerHTML = `<img src="${reader.result}" alt="attached"><button type="button" class="aedi-thumb-x" aria-label="Remove">×</button>`;
        thumb.querySelector('.aedi-thumb-x').addEventListener('click', () => { pendingImage = null; clearThumb(); }); }
      input.placeholder = 'Describe what to do with the image…';
      input.focus();
    };
    reader.readAsDataURL(file);
  }

  /* ── panel toggle + suggestions ───────────────────────────────────────── */
  function togglePanel(force) {
    open = typeof force === 'boolean' ? force : !open;
    panel.hidden = !open; panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open)); fab.setAttribute('aria-expanded', String(open));
    if (open && messages.childElementCount === 0) { appendMsg('model', pickGreeting()); renderSuggestions(); }
    if (open) setTimeout(() => input.focus(), 60);
  }
  const SUGGESTIONS = ['What do you do?', 'Generate an image', 'Summarise a page or text', 'Can Ionity build my idea?', 'Book a one-on-one?'];
  function renderSuggestions() {
    const wrap = document.createElement('div'); wrap.className = 'aedi-suggest';
    SUGGESTIONS.forEach((s) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'aedi-chip';
      b.textContent = s; b.addEventListener('click', () => ask(s === 'Generate an image' ? 'Draw me an image of a futuristic Ionity edge-AI control room' : s)); wrap.appendChild(b); });
    messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }
  let _lastGreet = -1;
  function pickGreeting() { const g = CFG.greetings; if (!g.length) return 'AEDi online.'; let i; do { i = Math.floor(Math.random() * g.length); } while (g.length > 1 && i === _lastGreet); _lastGreet = i; return g[i]; }

  /* ── init ─────────────────────────────────────────────────────────────── */
  function init() {
    fab = $('aediToggle'); panel = $('aediPanel'); messages = $('aediMessages'); input = $('aediInput');
    sendBtn = $('aediSend'); closeBtn = $('aediClose'); statusDot = $('aediStatusText');
    attachBtn = $('aediAttach'); fileInput = $('aediFile'); thumb = $('aediThumb'); offlineBtn = $('aediOffline');
    if (!fab) return;

    fab.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); togglePanel(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) togglePanel(false); });
    // any click INSIDE the panel stays inside — fixes the send button closing the chat
    panel.addEventListener('click', (e) => e.stopPropagation());
    sendBtn.addEventListener('click', (e) => { e.stopPropagation(); const t = input.value.trim(); if (t || pendingImage) ask(t); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input.value.trim(); if (t || pendingImage) ask(t); } });
    document.addEventListener('click', (e) => { if (open && !$('aediWrap').contains(e.target)) togglePanel(false); });

    // attachment (multimodal)
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => { if (fileInput.files[0]) onFile(fileInput.files[0]); fileInput.value = ''; });
    }

    // unique "Offline AEDi" toggle — only enabled if the browser exposes on-device AI
    if (offlineBtn) {
      onDeviceReady().then((ok) => {
        offlineBtn.dataset.supported = ok ? '1' : '0';
        offlineBtn.title = ok ? 'Answer on-device (no network) — Ionity offline-AI demo'
                              : 'On-device AI not available in this browser yet';
        offlineBtn.addEventListener('click', async () => {
          if (offlineBtn.dataset.supported !== '1') {
            appendMsg('model', "On-device AI isn't exposed by this browser yet — that's the experimental built-in model (Chrome's on-device AI). It's exactly the kind of OFFLINE edge intelligence Ionity builds. For now I'll keep answering from the cloud.");
            return;
          }
          onDevice = !onDevice;
          offlineBtn.classList.toggle('on', onDevice);
          statusDot.textContent = onDevice ? 'On-device' : 'Online';
          appendMsg('model', onDevice ? "⚡ On-device mode ON — I'll answer right here on your machine, no network. A live taste of Ionity's offline AI."
                                       : 'Back online — full cloud powers (search, images, vision) restored.');
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
