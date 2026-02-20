# M3 Elevation & Shape — Complete Reference

## Table of Contents

1. [Elevation System](#elevation-system)
2. [Tonal Elevation (M3 default)](#tonal-elevation)
3. [Shadow Elevation](#shadow-elevation)
4. [Shape Scale](#shape-scale)
5. [Tailwind Mapping](#tailwind-mapping)

---

## Elevation System

M3 uses **tonal elevation** (not shadow) as the primary depth indicator. Surfaces get lighter/darker tints of the primary color instead of drop shadows.

### 6 Elevation Levels

| Level | dp | Surface Token (Light) | Tone (Light) | Tone (Dark) |
|-------|----|-----------------------|------|------|
| 0 | 0dp | `surface` | 98 | 6 |
| 1 | 1dp | `surface-container-low` | 96 | 10 |
| 2 | 3dp | `surface-container` | 94 | 12 |
| 3 | 6dp | `surface-container-high` | 92 | 17 |
| 4 | 8dp | `surface-container-highest` | 90 | 22 |
| 5 | 12dp | (custom) | 87 | 24 |

---

## Tonal Elevation

M3 default: color tint replaces shadow. Higher elevation = more primary tint overlay.

| Elevation dp | Surface Tint Opacity |
|-------------|---------------------|
| 0dp | 0% |
| 1dp | 5% |
| 2dp | 8% |
| 3dp | 11% |
| 6dp | 12% |
| 8dp | 14% |
| 12dp | 14% |

### Tailwind implementation

Use the surface container tokens directly — they already encode the correct tonal elevation:

```tsx
// Level 0 — page background
<main className="bg-surface">

// Level 1 — card at rest
<div className="bg-surface-container-low rounded-xl">

// Level 2 — menu, sheet
<div className="bg-surface-container rounded-xl">

// Level 3 — FAB, search
<div className="bg-surface-container-high rounded-2xl">

// Level 4 — dialog, modal
<div className="bg-surface-container-highest rounded-3xl">
```

---

## Shadow Elevation

Some components combine tonal elevation with shadow (e.g., FABs, elevated buttons). M3 shadow values:

| Level | Shadow |
|-------|--------|
| 0 | none |
| 1 | `0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)` |
| 2 | `0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)` |
| 3 | `0 1px 3px 0 rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15)` |
| 4 | `0 2px 3px 0 rgb(0 0 0 / 0.3), 0 6px 10px 4px rgb(0 0 0 / 0.15)` |
| 5 | `0 4px 4px 0 rgb(0 0 0 / 0.3), 0 8px 12px 6px rgb(0 0 0 / 0.15)` |

### Tailwind @theme shadow tokens

```css
@theme {
  --shadow-elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);
  --shadow-elevation-2: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  --shadow-elevation-3: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15);
  --shadow-elevation-4: 0 2px 3px 0 rgb(0 0 0 / 0.3), 0 6px 10px 4px rgb(0 0 0 / 0.15);
  --shadow-elevation-5: 0 4px 4px 0 rgb(0 0 0 / 0.3), 0 8px 12px 6px rgb(0 0 0 / 0.15);
}
```

Usage:

```tsx
// FAB — tonal + shadow
<button className="bg-surface-container-high shadow-elevation-3 hover:shadow-elevation-4 transition-shadow">

// Elevated card
<div className="bg-surface-container-low shadow-elevation-1">
```

---

## Shape Scale

M3 defines a shape scale for corner radius:

| Token | Value | Tailwind | Use case |
|-------|-------|----------|----------|
| `shape-none` | 0px | `rounded-none` | Full-bleed images |
| `shape-extra-small` | 4px | `rounded` or `rounded-sm` | Checkboxes, text fields |
| `shape-small` | 8px | `rounded-lg` | Chips, small buttons |
| `shape-medium` | 12px | `rounded-xl` | Cards, dialogs |
| `shape-large` | 16px | `rounded-2xl` | FAB, nav drawer |
| `shape-extra-large` | 28px | `rounded-3xl` | Large sheets |
| `shape-full` | 9999px | `rounded-full` | Circular buttons, pills |

### Tailwind @theme shape tokens

```css
@theme {
  --radius-xs: 4px;    /* shape-extra-small */
  --radius-sm: 8px;    /* shape-small */
  --radius-md: 12px;   /* shape-medium */
  --radius-lg: 16px;   /* shape-large */
  --radius-xl: 28px;   /* shape-extra-large */
}
```

### Component-to-shape mapping

| Component | M3 Shape | Tailwind |
|-----------|----------|----------|
| Text field | extra-small | `rounded` |
| Chip | small | `rounded-lg` |
| Card | medium | `rounded-xl` |
| Dialog | extra-large | `rounded-3xl` |
| FAB | large | `rounded-2xl` |
| Button (filled) | full | `rounded-full` |
| Icon button | full | `rounded-full` |
| Badge | full | `rounded-full` |
| Bottom sheet | extra-large (top only) | `rounded-t-3xl` |
| Navigation drawer | large (end only) | `rounded-r-2xl` |
| Search bar | full | `rounded-full` |
