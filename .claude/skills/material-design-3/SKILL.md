---
name: material-design-3
description: "Material Design 3 (M3) design system for React + Tailwind CSS v4 projects. Provides complete M3 token system: color roles (primary/secondary/tertiary/error/surface), typography scale (display/headline/title/body/label), shape tokens, elevation, and interaction states. Use when: (1) building or styling UI components with M3 principles, (2) setting up a color/theme system, (3) user asks for 'Material Design' or 'M3' styling, (4) user needs design consistency or unified design tokens, (5) mapping M3 tokens to Tailwind CSS @theme configuration."
---

# Material Design 3 — Tailwind CSS Integration Guide

Apply M3's token system to React + Tailwind v4 projects for consistent, accessible design.

## Quick Start: 3-Step M3 Setup

### 1. Generate your color scheme

Use [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) to pick a source color. Export CSS tokens.

### 2. Map to Tailwind @theme

```css
@import "tailwindcss";

@theme {
  /* Primary */
  --color-primary: oklch(49% 0.16 275);
  --color-on-primary: oklch(100% 0 0);
  --color-primary-container: oklch(90% 0.05 275);
  --color-on-primary-container: oklch(15% 0.1 275);

  /* Surface hierarchy */
  --color-surface: oklch(98% 0.005 275);
  --color-surface-container-low: oklch(96% 0.005 275);
  --color-surface-container: oklch(94% 0.008 275);
  --color-surface-container-high: oklch(92% 0.01 275);
  --color-on-surface: oklch(12% 0.01 275);
  --color-on-surface-variant: oklch(45% 0.01 275);
  --color-outline: oklch(50% 0.01 275);
  --color-outline-variant: oklch(80% 0.008 275);

  /* Full 29-token mapping: references/color.md */
}
```

### 3. Use semantic class names

```tsx
<button className="bg-primary text-on-primary rounded-full px-6 py-2.5
                    text-sm font-medium hover:shadow-md transition-shadow">
  Action
</button>

<div className="bg-surface-container rounded-xl p-4">
  <h3 className="text-on-surface text-base font-medium">Title</h3>
  <p className="text-on-surface-variant text-sm">Description</p>
</div>
```

## Core Workflow

When building or modifying UI:

1. **Pick the right color role** — See [references/color.md](references/color.md)
2. **Use the type scale** — See [references/typography.md](references/typography.md)
3. **Apply correct elevation** — See [references/elevation-shape.md](references/elevation-shape.md)
4. **Handle interaction states** — See [references/states.md](references/states.md)
5. **Follow component patterns** — See [references/components.md](references/components.md)

## Decision Tables

### Which color role?

| Intent | Token |
|--------|-------|
| Main CTA / primary action | `primary` / `on-primary` |
| Secondary action | `secondary` / `on-secondary` |
| Accent / contrast element | `tertiary` / `on-tertiary` |
| Error / destructive | `error` / `on-error` |
| Page background | `surface` |
| Card / container | `surface-container` (low/normal/high/highest) |
| Body text | `on-surface` |
| Secondary text | `on-surface-variant` |
| Divider / border | `outline-variant` |
| Prominent border | `outline` |

### Which elevation?

| Level | Surface token | Use case |
|-------|--------------|----------|
| 0 | `surface` | Page background |
| 1 | `surface-container-low` | Cards at rest |
| 2 | `surface-container` | Menus, side sheets |
| 3 | `surface-container-high` | FABs, elevated cards |
| 4 | `surface-container-highest` | Dialogs, modals |

## Rules

- **Never hardcode colors** — Always use semantic tokens (`bg-primary`, not `bg-[#6750A4]`)
- **Never use `style={{}}` for colors** — Tailwind classes referencing `@theme` tokens only
- **Light + dark from same source** — Both themes derive from the same tonal palette
- **Accessible contrast** — Primary/on-primary pairs guarantee 4.5:1+ contrast
- **State layers via Tailwind** — Use `hover:`, `focus:`, `active:` modifiers. Never JS event handlers for hover
- **Consistent radius** — Use M3 shape scale (`rounded-sm`=4px, `rounded-lg`=12px, `rounded-xl`=16px, `rounded-full`)
