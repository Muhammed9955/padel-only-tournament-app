const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createOgImage() {
  const ogSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#022c22" />
        <stop offset="35%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>

      <!-- Emerald Teal Gradient -->
      <linearGradient id="emeraldTeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>

      <!-- Ball Gradient -->
      <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bef264" />
        <stop offset="60%" stop-color="#a3e635" />
        <stop offset="100%" stop-color="#65a30d" />
      </linearGradient>

      <!-- Glow Filters -->
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="28" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bg)" />

    <!-- Ambient Radiant Glow in Center for WhatsApp Square Crop -->
    <circle cx="600" cy="220" r="260" fill="#10b981" opacity="0.18" filter="url(#glow)" />
    <circle cx="600" cy="220" r="140" fill="#06b6d4" opacity="0.15" filter="url(#glow)" />
    <circle cx="200" cy="315" r="200" fill="#10b981" opacity="0.08" filter="url(#glow)" />
    <circle cx="1000" cy="315" r="200" fill="#06b6d4" opacity="0.08" filter="url(#glow)" />

    <!-- Padel Court Lines in Background -->
    <g stroke="#10b981" stroke-width="1.5" opacity="0.09">
      <rect x="60" y="50" width="1080" height="530" rx="24" />
      <line x1="600" y1="50" x2="600" y2="580" />
      <line x1="60" y1="315" x2="1140" y2="315" />
      <line x1="260" y1="50" x2="260" y2="580" />
      <line x1="940" y1="50" x2="940" y2="580" />
    </g>

    <!-- Outer Card Border -->
    <rect x="20" y="20" width="1160" height="590" rx="32" stroke="url(#emeraldTeal)" stroke-width="2" opacity="0.35" />

    <!-- ======================================================== -->
    <!-- CENTER SAFE ZONE (Fits 1:1 WhatsApp Square Crop Perfectly) -->
    <!-- ======================================================== -->

    <!-- Padel Racket & Ball Emblem (Centered at x=600, y=200) -->
    <g transform="translate(600, 195)">
      <!-- Background squircle -->
      <rect x="-105" y="-105" width="210" height="210" rx="52" fill="#021c17" stroke="url(#emeraldTeal)" stroke-width="3.5" opacity="0.9" filter="url(#subtleGlow)" />

      <!-- Padel Racket Handle -->
      <path d="M 24 40 L 68 84 C 74 90 74 98 68 104 C 62 110 54 110 48 104 L 4 60 Z" fill="#0f766e" stroke="#34d399" stroke-width="3" stroke-linejoin="round" />
      <line x1="24" y1="64" x2="42" y2="82" stroke="#34d399" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      <line x1="40" y1="80" x2="58" y2="98" stroke="#34d399" stroke-width="3" stroke-linecap="round" opacity="0.8" />

      <!-- Padel Racket Head (Tilted 45 deg) -->
      <ellipse cx="-12" cy="-12" rx="64" ry="74" transform="rotate(-45 -12 -12)" fill="#022c22" stroke="url(#emeraldTeal)" stroke-width="10" />
      <ellipse cx="-12" cy="-12" rx="52" ry="62" transform="rotate(-45 -12 -12)" fill="#064e3b" opacity="0.85" />

      <!-- Racket Holes -->
      <g fill="#020617" stroke="#34d399" stroke-width="1.8" opacity="0.95">
        <circle cx="-12" cy="-12" r="5" />
        <circle cx="-28" cy="-28" r="4.2" />
        <circle cx="4" cy="4" r="4.2" />
        <circle cx="4" cy="-28" r="4.2" />
        <circle cx="-28" cy="4" r="4.2" />
        <circle cx="-44" cy="-12" r="3.8" />
        <circle cx="20" cy="-12" r="3.8" />
        <circle cx="-12" cy="-44" r="3.8" />
        <circle cx="-12" cy="20" r="3.8" />
      </g>

      <!-- Optic-Lime Padel Ball -->
      <circle cx="68" cy="-48" r="30" fill="url(#ballGrad)" stroke="#facc15" stroke-width="3" filter="url(#subtleGlow)" />
      <!-- Ball Seams -->
      <path d="M 48 -62 Q 68 -48 53 -26" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.9" />
      <path d="M 88 -67 Q 70 -48 86 -29" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.9" />

      <!-- Sparkle -->
      <circle cx="104" cy="-76" r="4" fill="#34d399" opacity="0.9" />
    </g>

    <!-- Top Category Tag (Centered) -->
    <g transform="translate(600, 60)">
      <rect x="-135" y="0" width="270" height="32" rx="16" fill="#022c22" stroke="#10b981" stroke-width="1.2" opacity="0.9" />
      <circle cx="-115" cy="16" r="5" fill="#34d399" />
      <text x="-98" y="21" fill="#34d399" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">
        PADEL TOURNAMENT PLATFORM
      </text>
    </g>

    <!-- Brand Title: PadelOnly Tour (Centered at x=600, y=375) -->
    <text x="600" y="375" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="56" letter-spacing="-1">
      <tspan fill="#ffffff">PadelOnly </tspan>
      <tspan fill="url(#emeraldTeal)">Tour</tspan>
    </text>

    <!-- Subtitle (Centered at x=600, y=422) -->
    <text x="600" y="422" text-anchor="middle" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">
      Americano &amp; Mexicano Tournament Manager
    </text>

    <!-- Feature Description (Centered at x=600, y=464) -->
    <text x="600" y="464" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="16">
      Live Rotations • Dynamic Pairing • Career Hall of Fame
    </text>

    <!-- Bottom Badges Row (Centered at x=600, y=515) -->
    <g transform="translate(600, 505)">
      <!-- Badge 1: Arabiano -->
      <rect x="-245" y="0" width="155" height="36" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.2" />
      <text x="-167" y="23" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12">
        🎾 Arabiano Tour
      </text>

      <!-- Badge 2: Mexicano -->
      <rect x="-80" y="0" width="160" height="36" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2" />
      <text x="0" y="23" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12">
        🇲🇽 Mexicano Style
      </text>

      <!-- Badge 3: Leaderboard -->
      <rect x="90" y="0" width="155" height="36" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="1.2" />
      <text x="167" y="23" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12">
        🏆 Leaderboards
      </text>
    </g>

    <!-- Footer URL (Centered at x=600, y=585) -->
    <text x="600" y="585" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="1">
      PADEL-ONLY-TOURNAMENT-APP.VERCEL.APP
    </text>
  </svg>
  `;

  const ogBuffer = Buffer.from(ogSvg);
  const pngBuffer = await sharp(ogBuffer).png({ quality: 95 }).toBuffer();

  // Save to public/og-image.png and app/opengraph-image.png
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'og-image.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'opengraph-image.png'), pngBuffer);

  // Also create a square 600x600 version specifically for platforms requiring square ratio
  const squarePng = await sharp(pngBuffer)
    .extract({ left: 285, top: 0, width: 630, height: 630 })
    .png({ quality: 95 })
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'og-image-square.png'), squarePng);

  console.log('Successfully generated centered OpenGraph preview images (landscape & square)!');
}

createOgImage().catch(err => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
