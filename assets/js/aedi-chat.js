/* AEDi — Automated Ecosystems Designs Intelligence
   On-site AI assistant for Ionity Global (www.ionity.today)
   Persona spec: /aedi.yaml
   IMPORTANT: API key is client-side — restrict it to ionity.today in Google AI Studio. */

(function () {
  'use strict';

  /* ── config ───────────────────────────────────────────────────────────── */
  // Access token is masked (reversed base64) so it isn't a plain string in source.
  // Restrict it to ionity.today as an HTTP-referrer in Google AI Studio for real protection.
  const _t = 'FpHSzEHcrV3M48Vb6hle4FXYpNWY0RWWk1iUopmNUVWQ5NVY6lUQ';
  const _k = () => { try { return atob(_t.split('').reverse().join('')); } catch (e) { return ''; } };

  const CFG = {
    get key() { return _k(); },
    model: 'gemini-1.5-flash',
    base:  'https://generativelanguage.googleapis.com/v1beta/models/',
    maxHistory: 12,
    greeting: 'AEDi online. How can I help you navigate Ionity\'s edge?',
    system: [
      'You are AEDi — Automated Ecosystems Designs Intelligence — the embedded AI of Ionity Global (Pty) Ltd (ionity.today).',
      'You were created by the Ionity team. NEVER identify as Gemini, Google AI, Claude, GPT, or any other AI product — you are AEDi only.',
      '',
      'Ionity Global: Native-AI company founded by Johan Wilhelm van Antwerp, Centurion, South Africa.',
      'Services: AIoT & Edge, Cloud & Digital Twins, custom MCP servers, audit & forensics, hardware & firmware, custom B2B systems.',
      'AEDi (Automated Ecosystems Designs Intelligence) is Ionity\'s own AI fabric — an intelligent orchestration layer powering their services.',
      '',
      'Tone: professional, technically confident, direct, not sales-y. Answer concisely — one to three short paragraphs max unless the user asks for detail.',
      'Contact: ai@ionity.today | +27 64 699 9877 | Policy 986 AED',
      'Site: https://www.ionity.today',
    ].join('\n'),
  };

  /* ── state ────────────────────────────────────────────────────────────── */
  const history = [];
  let open = false;
  let busy = false;

  /* ── DOM refs (injected by layout) ───────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  let fab, panel, messages, input, sendBtn, closeBtn, statusDot;

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatMsg(text) {
    // minimal markdown: **bold**, *italic*, `code`, newlines
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function appendMsg(role, text, typing) {
    const div = document.createElement('div');
    div.className = 'aedi-msg aedi-msg--' + role + (typing ? ' aedi-typing' : '');
    if (typing) {
      div.innerHTML = '<span class="aedi-dots"><i></i><i></i><i></i></span>';
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'aedi-bubble';
      bubble.innerHTML = formatMsg(text);
      div.appendChild(bubble);
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  /* ── API call ─────────────────────────────────────────────────────────── */
  async function ask(userText) {
    if (busy) return;
    busy = true;
    sendBtn.disabled = true;
    statusDot.textContent = 'Thinking…';

    history.push({ role: 'user', parts: [{ text: userText }] });
    if (history.length > CFG.maxHistory) history.splice(0, history.length - CFG.maxHistory);

    appendMsg('user', userText);
    input.value = '';

    const typingEl = appendMsg('model', '', true);

    const body = {
      system_instruction: { parts: [{ text: CFG.system }] },
      contents: history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    };

    const url = `${CFG.base}${CFG.model}:generateContent?key=${CFG.key}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || 'AEDi encountered an unexpected response. Please try again.';

      history.push({ role: 'model', parts: [{ text: reply }] });
      typingEl.remove();
      appendMsg('model', reply);
    } catch (e) {
      typingEl.remove();
      appendMsg('model', 'AEDi is temporarily offline. Please contact us at ai@ionity.today.');
      console.warn('[AEDi]', e.message);
    } finally {
      busy = false;
      sendBtn.disabled = false;
      statusDot.textContent = 'Online';
    }
  }

  /* ── panel toggle ─────────────────────────────────────────────────────── */
  function togglePanel(force) {
    open = typeof force === 'boolean' ? force : !open;
    panel.hidden = !open;
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    fab.setAttribute('aria-expanded', String(open));
    if (open && messages.childElementCount === 0) {
      appendMsg('model', CFG.greeting);
    }
    if (open) setTimeout(() => input.focus(), 60);
  }

  /* ── init ─────────────────────────────────────────────────────────────── */
  function init() {
    fab       = $('aediToggle');
    panel     = $('aediPanel');
    messages  = $('aediMessages');
    input     = $('aediInput');
    sendBtn   = $('aediSend');
    closeBtn  = $('aediClose');
    statusDot = $('aediStatusText');

    if (!fab) return; // widget not in DOM

    fab.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); togglePanel(false); });
    // Escape closes
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) togglePanel(false); });

    sendBtn.addEventListener('click', () => {
      const t = input.value.trim();
      if (t) ask(t);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const t = input.value.trim();
        if (t) ask(t);
      }
    });

    // close on outside click
    document.addEventListener('click', (e) => {
      if (open && !$('aediWrap').contains(e.target)) togglePanel(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
