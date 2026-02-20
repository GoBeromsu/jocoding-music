# M3 Color System — Complete Reference

## Table of Contents

1. [Key Colors & Tonal Palettes](#key-colors--tonal-palettes)
2. [Color Roles — Light Theme Tone Mapping](#color-roles--light-theme)
3. [Color Roles — Dark Theme Tone Mapping](#color-roles--dark-theme)
4. [Surface Container Hierarchy](#surface-container-hierarchy)
5. [Tailwind @theme Full Mapping](#tailwind-theme-full-mapping)

---

## Key Colors & Tonal Palettes

M3 generates the entire color system from **5 key colors**:

| Key Color | What it generates | Purpose |
|-----------|------------------|---------|
| **Primary** | Primary tonal palette | Brand, main actions, active states |
| **Secondary** | Secondary tonal palette | Supporting UI, less prominent actions |
| **Tertiary** | Tertiary tonal palette | Contrast accents, complementary elements |
| **Error** | Error tonal palette | Error states, destructive actions |
| **Neutral** | Neutral + Neutral-variant palettes | Surfaces, backgrounds, text, outlines |

Each key color generates a **tonal palette**: 13 tones from 0 (black) to 100 (white).

```
Tones: 0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100
```

Use [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) to generate palettes from a source color.

---

## Color Roles — Light Theme

| Role | Palette | Tone | Usage |
|------|---------|------|-------|
| `primary` | Primary | 40 | Main actions, active indicators |
| `on-primary` | Primary | 100 | Text/icons on primary |
| `primary-container` | Primary | 90 | Subtle primary backgrounds |
| `on-primary-container` | Primary | 10 | Text on primary-container |
| `secondary` | Secondary | 40 | Less prominent actions |
| `on-secondary` | Secondary | 100 | Text/icons on secondary |
| `secondary-container` | Secondary | 90 | Filter chips, nav items |
| `on-secondary-container` | Secondary | 10 | Text on secondary-container |
| `tertiary` | Tertiary | 40 | Accent, complementary |
| `on-tertiary` | Tertiary | 100 | Text/icons on tertiary |
| `tertiary-container` | Tertiary | 90 | Tertiary backgrounds |
| `on-tertiary-container` | Tertiary | 10 | Text on tertiary-container |
| `error` | Error | 40 | Error, destructive |
| `on-error` | Error | 100 | Text on error |
| `error-container` | Error | 90 | Error backgrounds |
| `on-error-container` | Error | 10 | Text on error-container |
| `surface-dim` | Neutral | 87 | Dimmed surface |
| `surface` | Neutral | 98 | Default background |
| `surface-bright` | Neutral | 98 | Bright surface |
| `surface-container-lowest` | Neutral | 100 | Lowest container |
| `surface-container-low` | Neutral | 96 | Cards at rest |
| `surface-container` | Neutral | 94 | Menus, side sheets |
| `surface-container-high` | Neutral | 92 | FABs, search bars |
| `surface-container-highest` | Neutral | 90 | Dialogs |
| `on-surface` | Neutral | 10 | Body text |
| `on-surface-variant` | Neutral-variant | 30 | Secondary text, icons |
| `outline` | Neutral-variant | 50 | Important boundaries |
| `outline-variant` | Neutral-variant | 80 | Subtle dividers |
| `inverse-surface` | Neutral | 20 | Snackbar background |
| `inverse-on-surface` | Neutral | 95 | Text on snackbar |
| `inverse-primary` | Primary | 80 | Links on snackbar |

---

## Color Roles — Dark Theme

| Role | Palette | Tone |
|------|---------|------|
| `primary` | Primary | **80** |
| `on-primary` | Primary | **20** |
| `primary-container` | Primary | **30** |
| `on-primary-container` | Primary | **90** |
| `secondary` | Secondary | **80** |
| `on-secondary` | Secondary | **20** |
| `secondary-container` | Secondary | **30** |
| `on-secondary-container` | Secondary | **90** |
| `tertiary` | Tertiary | **80** |
| `on-tertiary` | Tertiary | **20** |
| `tertiary-container` | Tertiary | **30** |
| `on-tertiary-container` | Tertiary | **90** |
| `error` | Error | **80** |
| `on-error` | Error | **20** |
| `error-container` | Error | **30** |
| `on-error-container` | Error | **90** |
| `surface-dim` | Neutral | **6** |
| `surface` | Neutral | **6** |
| `surface-bright` | Neutral | **24** |
| `surface-container-lowest` | Neutral | **4** |
| `surface-container-low` | Neutral | **10** |
| `surface-container` | Neutral | **12** |
| `surface-container-high` | Neutral | **17** |
| `surface-container-highest` | Neutral | **22** |
| `on-surface` | Neutral | **90** |
| `on-surface-variant` | Neutral-variant | **80** |
| `outline` | Neutral-variant | **60** |
| `outline-variant` | Neutral-variant | **30** |
| `inverse-surface` | Neutral | **90** |
| `inverse-on-surface` | Neutral | **20** |
| `inverse-primary` | Primary | **40** |

**Pattern**: Light theme uses tone 40 for main color, 90 for container. Dark theme flips: tone 80 for main, 30 for container.

---

## Surface Container Hierarchy

M3 replaces shadow-based elevation with **tonal elevation** — surfaces get progressively lighter/darker instead of adding shadows.

```
Light theme (neutral tones):
surface(98) → container-lowest(100) → container-low(96) → container(94) → container-high(92) → container-highest(90)

Dark theme (neutral tones):
surface(6) → container-lowest(4) → container-low(10) → container(12) → container-high(17) → container-highest(22)
```

### When to use which surface:

| Surface | Use case | Example |
|---------|----------|---------|
| `surface` | Page background | `<body>` |
| `surface-container-lowest` | Deeply recessed areas | Empty state backgrounds |
| `surface-container-low` | Default cards, list items | Track list row |
| `surface-container` | Standard containers | Side panel, dropdown |
| `surface-container-high` | Prominent elements | Search bar, FAB |
| `surface-container-highest` | Top-layer elements | Dialog, modal |

---

## Tailwind @theme Full Mapping

Complete `@theme` block with all 29 M3 color roles. Replace oklch values with your generated palette.

```css
@import "tailwindcss";

@theme {
  /* ── Primary ─────────────────────────── */
  --color-primary: oklch(49% 0.16 275);
  --color-on-primary: oklch(100% 0 0);
  --color-primary-container: oklch(90% 0.05 275);
  --color-on-primary-container: oklch(15% 0.1 275);

  /* ── Secondary ───────────────────────── */
  --color-secondary: oklch(48% 0.06 275);
  --color-on-secondary: oklch(100% 0 0);
  --color-secondary-container: oklch(90% 0.04 275);
  --color-on-secondary-container: oklch(15% 0.05 275);

  /* ── Tertiary ────────────────────────── */
  --color-tertiary: oklch(49% 0.12 330);
  --color-on-tertiary: oklch(100% 0 0);
  --color-tertiary-container: oklch(90% 0.06 330);
  --color-on-tertiary-container: oklch(15% 0.08 330);

  /* ── Error ───────────────────────────── */
  --color-error: oklch(51% 0.2 27);
  --color-on-error: oklch(100% 0 0);
  --color-error-container: oklch(93% 0.04 27);
  --color-on-error-container: oklch(18% 0.1 27);

  /* ── Surface ─────────────────────────── */
  --color-surface-dim: oklch(88% 0.005 275);
  --color-surface: oklch(98% 0.005 275);
  --color-surface-bright: oklch(98% 0.005 275);
  --color-surface-container-lowest: oklch(100% 0 0);
  --color-surface-container-low: oklch(96% 0.005 275);
  --color-surface-container: oklch(94% 0.008 275);
  --color-surface-container-high: oklch(92% 0.01 275);
  --color-surface-container-highest: oklch(90% 0.012 275);

  /* ── On-surface / Outline ────────────── */
  --color-on-surface: oklch(12% 0.01 275);
  --color-on-surface-variant: oklch(45% 0.01 275);
  --color-outline: oklch(50% 0.01 275);
  --color-outline-variant: oklch(80% 0.008 275);

  /* ── Inverse ─────────────────────────── */
  --color-inverse-surface: oklch(20% 0.01 275);
  --color-inverse-on-surface: oklch(95% 0.005 275);
  --color-inverse-primary: oklch(80% 0.1 275);
}

/* Dark theme override */
.dark {
  --color-primary: oklch(80% 0.1 275);
  --color-on-primary: oklch(25% 0.12 275);
  --color-primary-container: oklch(35% 0.14 275);
  --color-on-primary-container: oklch(90% 0.05 275);

  --color-secondary: oklch(80% 0.04 275);
  --color-on-secondary: oklch(25% 0.05 275);
  --color-secondary-container: oklch(35% 0.05 275);
  --color-on-secondary-container: oklch(90% 0.04 275);

  --color-tertiary: oklch(80% 0.08 330);
  --color-on-tertiary: oklch(25% 0.1 330);
  --color-tertiary-container: oklch(35% 0.1 330);
  --color-on-tertiary-container: oklch(90% 0.06 330);

  --color-error: oklch(80% 0.1 27);
  --color-on-error: oklch(25% 0.15 27);
  --color-error-container: oklch(35% 0.15 27);
  --color-on-error-container: oklch(90% 0.04 27);

  --color-surface-dim: oklch(6% 0.005 275);
  --color-surface: oklch(6% 0.005 275);
  --color-surface-bright: oklch(24% 0.01 275);
  --color-surface-container-lowest: oklch(4% 0.003 275);
  --color-surface-container-low: oklch(10% 0.005 275);
  --color-surface-container: oklch(12% 0.006 275);
  --color-surface-container-high: oklch(17% 0.008 275);
  --color-surface-container-highest: oklch(22% 0.01 275);

  --color-on-surface: oklch(90% 0.005 275);
  --color-on-surface-variant: oklch(80% 0.008 275);
  --color-outline: oklch(60% 0.01 275);
  --color-outline-variant: oklch(30% 0.008 275);

  --color-inverse-surface: oklch(90% 0.005 275);
  --color-inverse-on-surface: oklch(20% 0.01 275);
  --color-inverse-primary: oklch(49% 0.16 275);
}
```

Usage in components:

```tsx
// Primary button
<button className="bg-primary text-on-primary rounded-full px-6 py-2.5">

// Card
<div className="bg-surface-container-low rounded-xl border border-outline-variant">

// Error state
<p className="text-error text-sm">

// Chip
<span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 text-xs">
```
