import sharp from 'sharp';
import fs from 'fs';

/* ============================================================================
   IONITY icon + social generator — single source of truth.
   Everything is built from the IONITY "AI" monogram:
     • favicons / PWA / apple-touch / social avatar = BLUE AI on a white tile
       (matches the brand mark on light surfaces)
     • OG social card                               = WHITE AI on the dark gradient
   Re-run with `npm run icons` after the marks change.
   ========================================================================== */

const BLUE_MARK  = 'assets/img/ai-mark.png';        // blue AI, transparent bg
const WHITE_MARK = 'assets/img/ai-mark-white.png';  // white AI, transparent bg

/* minimal .ico wrapper around a single 64px PNG */
function pngToIco(png) {
  const h = Buffer.alloc(6);  h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
  const e = Buffer.alloc(16); e.writeUInt8(64, 0);  e.writeUInt8(64, 1);  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8); e.writeUInt32LE(22, 12);
  return Buffer.concat([h, e, png]);
}

const whiteTile = (s, r) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${r}" fill="#ffffff"/></svg>`);

/* blue AI centred on a white rounded tile */
async function brandIcon(size, radiusPct = 0.2, markScale = 0.64) {
  const tile = await sharp(whiteTile(size, Math.round(size * radiusPct))).png().toBuffer();
  const m = Math.round(size * markScale);
  const mark = await sharp(BLUE_MARK).resize(m, m, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp(tile).composite([{ input: mark, gravity: 'center' }]).png().toBuffer();
}

/* favicons / PWA / apple-touch — blue AI on white tile */
for (const [out, size, rPct] of [
  ['assets/img/icon-192.png', 192, 0.2],
  ['assets/img/icon-512.png', 512, 0.2],
  ['assets/img/icon-maskable-512.png', 512, 0.2],
  ['assets/img/apple-touch-icon.png', 180, 0.2],
  ['assets/img/favicon-64.png', 64, 0.12],
  ['assets/img/favicon-32.png', 32, 0.1],
]) {
  await sharp(await brandIcon(size, rPct)).resize(size, size).png().toFile(out);
  console.log('wrote', out, size);
}

/* square social-profile avatar (LinkedIn / GitHub / Gravatar / X …) */
await sharp(await brandIcon(512, 0.2, 0.62)).png().toFile('assets/img/social-avatar.png');
console.log('wrote assets/img/social-avatar.png 512');

/* favicon.ico (64px) */
fs.writeFileSync('assets/img/favicon.ico', pngToIco(await sharp(await brandIcon(64, 0.12)).resize(64, 64).png().toBuffer()));
console.log('wrote assets/img/favicon.ico');

/* OG / Twitter social card — white AI monogram on the dark brand gradient */
const ogBg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05060A"/><stop offset="1" stop-color="#0A1430"/></linearGradient>
  <linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0079E3"/><stop offset="1" stop-color="#00D2FF"/></linearGradient>
  <radialGradient id="glow" cx="0.2" cy="0.5" r="0.55"><stop offset="0" stop-color="#0079E3" stop-opacity="0.30"/><stop offset="1" stop-color="#0079E3" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#g)"/>
<rect width="1200" height="630" fill="url(#glow)"/>
<text x="430" y="296" font-family="Arial,Helvetica,sans-serif" font-size="88" font-weight="800" fill="#FFFFFF">IONITY GLOBAL</text>
<text x="432" y="360" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="url(#t)">Native-AI · AIoT · Cloud · Edge · Audit &amp; Forensics</text>
<text x="432" y="422" font-family="Arial,Helvetica,sans-serif" font-size="27" fill="#9AA4B2">ionity.co.za — Building tomorrow, today</text>
</svg>`;
const ogBase = await sharp(Buffer.from(ogBg)).png().toBuffer();
const ogMark = await sharp(WHITE_MARK).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
await sharp(ogBase).composite([{ input: ogMark, left: 78, top: 165 }]).png().toFile('assets/og/social-card.png');
console.log('wrote assets/og/social-card.png 1200x630');
