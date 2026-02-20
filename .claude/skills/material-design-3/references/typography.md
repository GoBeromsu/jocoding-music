# M3 Typography Scale — Complete Reference

## Table of Contents

1. [Type Scale Overview](#type-scale-overview)
2. [Token Values](#token-values)
3. [Tailwind Mapping](#tailwind-mapping)
4. [Usage Guidelines](#usage-guidelines)

---

## Type Scale Overview

M3 defines **5 type roles** x **3 sizes** = 15 type tokens.

| Role | Purpose |
|------|---------|
| **Display** | Hero text, large decorative headers |
| **Headline** | Section headers, prominent titles |
| **Title** | Subsections, card titles |
| **Body** | Paragraph text, long-form content |
| **Label** | Buttons, chips, tabs, captions |

---

## Token Values

### Display

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `display-large` | 57px | 64px | 400 | -0.25px |
| `display-medium` | 45px | 52px | 400 | 0px |
| `display-small` | 36px | 44px | 400 | 0px |

### Headline

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `headline-large` | 32px | 40px | 400 | 0px |
| `headline-medium` | 28px | 36px | 400 | 0px |
| `headline-small` | 24px | 32px | 400 | 0px |

### Title

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `title-large` | 22px | 28px | 400 | 0px |
| `title-medium` | 16px | 24px | 500 | 0.15px |
| `title-small` | 14px | 20px | 500 | 0.1px |

### Body

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `body-large` | 16px | 24px | 400 | 0.5px |
| `body-medium` | 14px | 20px | 400 | 0.25px |
| `body-small` | 12px | 16px | 400 | 0.4px |

### Label

| Token | Size | Line Height | Weight | Tracking |
|-------|------|-------------|--------|----------|
| `label-large` | 14px | 20px | 500 | 0.1px |
| `label-medium` | 12px | 16px | 500 | 0.5px |
| `label-small` | 11px | 16px | 500 | 0.5px |

---

## Tailwind Mapping

### Option A: Custom utility classes (recommended)

```css
@layer components {
  /* Display */
  .type-display-large  { @apply text-[57px] leading-[64px] font-normal tracking-[-0.25px]; }
  .type-display-medium { @apply text-[45px] leading-[52px] font-normal tracking-normal; }
  .type-display-small  { @apply text-[36px] leading-[44px] font-normal tracking-normal; }

  /* Headline */
  .type-headline-large  { @apply text-[32px] leading-[40px] font-normal tracking-normal; }
  .type-headline-medium { @apply text-[28px] leading-[36px] font-normal tracking-normal; }
  .type-headline-small  { @apply text-[24px] leading-[32px] font-normal tracking-normal; }

  /* Title */
  .type-title-large  { @apply text-[22px] leading-[28px] font-normal tracking-normal; }
  .type-title-medium { @apply text-base leading-6 font-medium tracking-[0.15px]; }
  .type-title-small  { @apply text-sm leading-5 font-medium tracking-[0.1px]; }

  /* Body */
  .type-body-large  { @apply text-base leading-6 font-normal tracking-[0.5px]; }
  .type-body-medium { @apply text-sm leading-5 font-normal tracking-[0.25px]; }
  .type-body-small  { @apply text-xs leading-4 font-normal tracking-[0.4px]; }

  /* Label */
  .type-label-large  { @apply text-sm leading-5 font-medium tracking-[0.1px]; }
  .type-label-medium { @apply text-xs leading-4 font-medium tracking-[0.5px]; }
  .type-label-small  { @apply text-[11px] leading-4 font-medium tracking-[0.5px]; }
}
```

### Option B: Inline Tailwind classes

When utility classes are overkill, use inline equivalents:

```tsx
// Headline Small
<h2 className="text-2xl leading-8 font-normal">Section</h2>

// Title Medium
<h3 className="text-base leading-6 font-medium tracking-[0.15px]">Card Title</h3>

// Body Medium
<p className="text-sm leading-5 tracking-[0.25px]">Content</p>

// Label Large (buttons, chips)
<span className="text-sm leading-5 font-medium tracking-[0.1px]">Button</span>

// Label Small (badges, captions)
<span className="text-[11px] leading-4 font-medium tracking-[0.5px]">Caption</span>
```

---

## Usage Guidelines

### Which type role for what?

| UI Element | M3 Type Token | Tailwind Equivalent |
|------------|--------------|---------------------|
| App bar title | `title-large` | `text-[22px] leading-7` |
| Card title | `title-medium` | `text-base font-medium` |
| List item primary text | `body-large` | `text-base` |
| List item secondary text | `body-medium` | `text-sm` |
| Button text | `label-large` | `text-sm font-medium` |
| Chip text | `label-large` | `text-sm font-medium` |
| Tab label | `label-large` | `text-sm font-medium` |
| Caption / metadata | `label-small` | `text-[11px] font-medium` |
| Section header | `title-small` | `text-sm font-medium` |
| Error message | `body-small` | `text-xs` |
| Tooltip | `body-small` | `text-xs` |

### Font family

M3 defaults to Roboto. For custom fonts:

```css
@theme {
  --font-sans: 'Inter', 'Roboto', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'DM Serif Display', Georgia, serif;  /* optional display font */
}
```

- Use `--font-sans` for body, label, title
- Use `--font-display` (if defined) only for display and headline roles

### Don't use arbitrary pixel sizes

Instead of `text-[13px]` or `text-[9px]`, map to the nearest M3 token:

| Bad | Good | M3 Token |
|-----|------|----------|
| `text-[9px]` | `text-[11px] font-medium` | label-small |
| `text-[10px]` | `text-xs` (12px) | body-small / label-medium |
| `text-[13px]` | `text-sm` (14px) | body-medium / label-large |
