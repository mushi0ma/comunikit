# comunikit — Design Brainstorm

## Context
Closed student marketplace + Lost & Found + Forum for AITUC students (ages 15–20).
80% mobile traffic. Priority: speed, simplicity, intuitiveness.

---

<response>
<probability>0.07</probability>
<text>

## Idea A — "Urban Zine" (Post-Soviet Street Culture)

**Design Movement:** Neo-Brutalism meets Central Asian street aesthetic.

**Core Principles:**
1. Raw, honest layouts — no decorative chrome, every element earns its place
2. High-contrast type as the primary visual element
3. Asymmetric tension: cards tilted slightly, borders offset
4. Monochrome base with a single electric accent (neon yellow or acid green)

**Color Philosophy:** Near-black (#0f0f0f) backgrounds, off-white text, one neon accent (#CAFF00 or #00FF94). Evokes late-night study sessions and underground culture without being gimmicky.

**Layout Paradigm:** Masonry-style feed with variable card heights. Navbar is a floating pill at the bottom on mobile. Desktop uses a left rail with large type labels.

**Signature Elements:**
- Thick 2px offset borders on cards (border + shadow in same color)
- Oversized category labels in uppercase condensed font
- Dashed dividers instead of solid lines

**Interaction Philosophy:** Snappy, no-nonsense. Hover = immediate color inversion. Tap = scale 0.97 spring. No long animations.

**Animation:** Spring physics on card press. Stagger entrance on feed load (50ms delay). No looping animations.

**Typography System:** `Unbounded` (display/headings, condensed, bold) + `IBM Plex Mono` (prices, IDs, metadata) + `Manrope` (body). Hierarchy: 32px display → 18px section → 14px body → 11px meta.

</text>
</response>

<response>
<probability>0.06</probability>
<text>

## Idea B — "Soft Campus" (Friendly Institutional)

**Design Movement:** Material You × Scandinavian minimalism.

**Core Principles:**
1. Warm neutrals with a trustworthy teal/indigo primary
2. Generous whitespace — content breathes
3. Rounded but not bubbly (radius 12px max)
4. Accessibility-first: WCAG AA contrast, large tap targets

**Color Philosophy:** Warm white (#FAFAF8) base, slate-900 text, primary teal (#0D9488), secondary amber (#F59E0B) for alerts/lost items, green (#10B981) for found items. Feels safe and institutional without being sterile.

**Layout Paradigm:** Single-column mobile-first with sticky bottom nav. Desktop: 3-column (sidebar nav + main feed + context panel). Cards use subtle elevation (shadow-sm).

**Signature Elements:**
- Pill-shaped status badges with semantic color fills
- Avatar initials with gradient backgrounds (unique per user)
- Subtle grain texture on hero areas

**Interaction Philosophy:** Smooth and reassuring. Transitions at 200ms ease-out. Skeleton loaders. Haptic-like micro-bounce on successful actions.

**Animation:** Page transitions: slide-up 300ms. Cards: fade-in stagger. FAB: scale + rotate on open.

**Typography System:** `Plus Jakarta Sans` (headings, medium/bold) + `Inter` (body, regular/medium). Clean, approachable, modern without being cold.

</text>
</response>

<response>
<probability>0.08</probability>
<text>

## Idea C — "Digital Bazaar" (Vibrant Marketplace Energy) ← SELECTED

**Design Movement:** Contemporary Central Asian digital culture — bold, warm, energetic.

**Core Principles:**
1. Warm amber/orange primary that references bazaar warmth and Kazakh sun motifs
2. Dual-mode identity: light mode feels like a sunny marketplace, dark mode like a late-night dorm hustle
3. Dense information hierarchy — students want to scan fast, not read
4. Mobile-first card grid with thumb-friendly interaction zones

**Color Philosophy:**
- Primary: `#F97316` (amber-orange) — energy, warmth, marketplace vibrancy
- Secondary: `#0EA5E9` (sky blue) — trust, tech, AITUC identity
- Lost accent: `#EF4444` (red) — urgency, attention
- Found accent: `#22C55E` (green) — resolution, success
- Light bg: `#FAFAF7` (warm white), Dark bg: `#111118` (deep navy-black)
- Text: `#1C1C28` light / `#F0F0F8` dark

**Layout Paradigm:** Bottom navigation bar on mobile (5 icons). Desktop: left sidebar (collapsible) + main content area. Feed uses a 2-column card grid on mobile, 3-column on desktop. No centered hero — content starts immediately.

**Signature Elements:**
- Diagonal color stripe on listing cards (category color indicator)
- Floating action button with radial menu (expand to show sub-actions)
- Warm gradient header strip with campus name watermark

**Interaction Philosophy:** Immediate feedback. Tap states are instant (no delay). Long-press on cards reveals quick actions. Swipe-to-dismiss on notifications.

**Animation:** Cards enter with a subtle upward fade (translateY 8px → 0, opacity 0 → 1, 180ms). Tab switches: horizontal slide. Modal: scale from 0.95 + fade. FAB: rotate 45° on open.

**Typography System:**
- `Nunito` (headings, 700/800) — friendly, rounded, youthful energy
- `Nunito Sans` (body, 400/500/600) — readable, consistent with heading font family
- `JetBrains Mono` (prices, IDs, codes) — technical precision
- Scale: 28px hero → 20px section → 16px body → 13px meta → 11px badge

</text>
</response>

---

## Selected: Idea C — "Digital Bazaar"

Warm amber-orange primary, sky-blue secondary, dense card grid, bottom nav mobile, sidebar desktop, dark mode support. Nunito + Nunito Sans + JetBrains Mono.
