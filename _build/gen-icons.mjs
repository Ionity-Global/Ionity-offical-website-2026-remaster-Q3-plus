import sharp from 'sharp';
const svg = 'assets/img/icon.svg';
const jobs = [
  ['assets/img/icon-192.png', 192],
  ['assets/img/icon-512.png', 512],
  ['assets/img/apple-touch-icon.png', 180],
  ['assets/img/icon-maskable-512.png', 512],
];
for (const [out, size] of jobs) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log('wrote', out, size);
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#05060A"/><stop offset="1" stop-color="#0A1430"/></linearGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3366FF"/><stop offset="1" stop-color="#00D2FF"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<g transform="translate(150 315)" fill="none" stroke="url(#t)">
<ellipse rx="120" ry="50" stroke-width="7" opacity="0.85" transform="rotate(28)"/>
<ellipse rx="120" ry="50" stroke-width="7" opacity="0.85" transform="rotate(-28)"/>
<circle cx="105" cy="56" r="11" fill="#00D2FF" stroke="none"/>
<circle cx="0" cy="0" r="24" fill="#00D2FF" stroke="none"/></g>
<text x="330" y="290" font-family="Arial,sans-serif" font-size="92" font-weight="800" fill="#FFFFFF">IONITY GLOBAL</text>
<text x="332" y="360" font-family="Arial,sans-serif" font-size="38" font-weight="600" fill="url(#t)">Native-AI · AIoT · Cloud · Edge · Audit &amp; Forensics</text>
<text x="332" y="430" font-family="Arial,sans-serif" font-size="28" fill="#9AA4B2">www.ionity.today — Solutionists across Mechanical, Electrical &amp; IT</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('assets/og/social-card.png');
console.log('wrote og social-card.png');
