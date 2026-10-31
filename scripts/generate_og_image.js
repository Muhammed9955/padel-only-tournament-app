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
        <stop offset="40%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>

      <!-- Emerald Teal Gradient -->
      <linearGradient id="emeraldTeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>

      <!-- Amber Gradient -->
      <linearGradient id="amberGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>

      <!-- Ball Gradient -->
      <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bef264" />
        <stop offset="60%" stop-color="#a3e635" />
        <stop offset="100%" stop-color="#65a30d" />
      </linearGradient>

      <!-- Glow Filters -->
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="30" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bg)" />

    <!-- Ambient Glowing Orbs -->
    <circle cx="250" cy="315" r="280" fill="#10b981" opacity="0.12" filter="url(#glow)" />
    <circle cx="950" cy="200" r="220" fill="#06b6d4" opacity="0.10" filter="url(#glow)" />
    <circle cx="800" cy="500" r="180" fill="#f59e0b" opacity="0.08" filter="url(#glow)" />

    <!-- Stylized Geometric Padel Court Grid in Background -->
    <g stroke="#10b981" stroke-width="1.5" opacity="0.08">
      <rect x="80" y="60" width="1040" height="510" rx="20" />
      <line x1="600" y1="60" x2="600" y2="570" />
      <line x1="80" y1="315" x2="1120" y2="315" />
      <line x1="280" y1="60" x2="280" y2="570" />
      <line x1="920" y1="60" x2="920" y2="570" />
    </g>

    <!-- Outer Card Border -->
    <rect x="24" y="24" width="1152" height="582" rx="32" stroke="url(#emeraldTeal)" stroke-width="2.5" opacity="0.3" />

    <!-- LEFT SIDE: Big Brand Padel Racket & Ball Emblem -->
    <g transform="translate(180, 315)">
      <!-- Background squircle -->
      <rect x="-130" y="-130" width="260" height="260" rx="64" fill="#031b15" stroke="url(#emeraldTeal)" stroke-width="4" opacity="0.8" filter="url(#subtleGlow)" />

      <!-- Padel Racket Handle -->
      <path d="M 30 50 L 85 105 C 92 112 92 122 85 129 C 78 136 68 136 61 129 L 6 74 Z" fill="#0f766e" stroke="#34d399" stroke-width="4" stroke-linejoin="round" />
      <line x1="30" y1="80" x2="52" y2="102" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />
      <line x1="50" y1="100" x2="72" y2="122" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />

      <!-- Padel Racket Head (Tilted 45 deg) -->
      <ellipse cx="-15" cy="-15" rx="80" ry="92" transform="rotate(-45 -15 -15)" fill="#022c22" stroke="url(#emeraldTeal)" stroke-width="12" />
      <ellipse cx="-15" cy="-15" rx="65" ry="77" transform="rotate(-45 -15 -15)" fill="#064e3b" opacity="0.85" />

      <!-- Racket Holes -->
      <g fill="#020617" stroke="#34d399" stroke-width="2" opacity="0.95">
        <circle cx="-15" cy="-15" r="6" />
        <circle cx="-35" cy="-35" r="5" />
        <circle cx="5" cy="5" r="5" />
        <circle cx="5" cy="-35" r="5" />
        <circle cx="-35" cy="5" r="5" />
        <circle cx="-55" cy="-15" r="4.5" />
        <circle cx="25" cy="-15" r="4.5" />
        <circle cx="-15" cy="-55" r="4.5" />
        <circle cx="-15" cy="25" r="4.5" />
      </g>

      <!-- Optic-Lime Padel Ball -->
      <circle cx="85" cy="-60" r="38" fill="url(#ballGrad)" stroke="#facc15" stroke-width="3.5" filter="url(#subtleGlow)" />
      <!-- Ball Seams -->
      <path d="M 60 -78 Q 85 -60 66 -32" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9" />
      <path d="M 110 -84 Q 88 -60 108 -36" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9" />

      <!-- Sparkle -->
      <circle cx="130" cy="-95" r="4.5" fill="#34d399" opacity="0.9" />
    </g>

    <!-- RIGHT SIDE: Text Branding & Highlights -->
    <g transform="translate(420, 140)">
      <!-- Top Pill Badge -->
      <rect x="0" y="0" width="340" height="38" rx="19" fill="#022c22" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
      <circle cx="20" cy="19" r="6" fill="#34d399" />
      <text x="36" y="24" fill="#34d399" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" letter-spacing="1">
        PADEL TOURNAMENT PLATFORM 2026
      </text>

      <!-- Big Title: PadelOnly Tour -->
      <text x="0" y="115" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" letter-spacing="-1.5">
        <tspan fill="#ffffff">PadelOnly </tspan>
        <tspan fill="url(#emeraldTeal)">Tour</tspan>
      </text>

      <!-- Subtitle -->
      <text x="0" y="165" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="24">
        Americano &amp; Mexicano Tournament Manager
      </text>

      <!-- Description Paragraph -->
      <text x="0" y="210" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="18">
        Live automated rotations • Fair partner pairing • Career leaderboards
      </text>
      <text x="0" y="238" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="18">
        Permanent match history archives with cloud synchronization.
      </text>

      <!-- Feature Pill Badges -->
      <g transform="translate(0, 290)">
        <!-- Badge 1: Arabiano -->
        <rect x="0" y="0" width="180" height="42" rx="14" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
        <text x="18" y="26" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">
          🎾 Arabiano Tour
        </text>

        <!-- Badge 2: Mexicano -->
        <rect x="195" y="0" width="190" height="42" rx="14" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />
        <text x="213" y="26" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">
          🇲🇽 Mexicano Style
        </text>

        <!-- Badge 3: Leaderboard -->
        <rect x="400" y="0" width="195" height="42" rx="14" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5" />
        <text x="418" y="26" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">
          🏆 Hall of Fame
        </text>
      </g>
    </g>

    <!-- Bottom Footer Brand URL -->
    <text x="600" y="580" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" letter-spacing="1">
      PADEL-ONLY-TOURNAMENT-APP.VERCEL.APP
    </text>
  </svg>
  `;

  const ogBuffer = Buffer.from(ogSvg);
  const pngBuffer = await sharp(ogBuffer).png({ quality: 95 }).toBuffer();

  // Save to public/og-image.png and app/opengraph-image.png
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'og-image.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'opengraph-image.png'), pngBuffer);

  console.log('Successfully generated 1200x630 OpenGraph social preview images!');
}

createOgImage().catch(err => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
