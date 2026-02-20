# M3 Interaction States — Complete Reference

## Table of Contents

1. [State Layer System](#state-layer-system)
2. [Opacity Values](#opacity-values)
3. [Tailwind Implementation](#tailwind-implementation)
4. [Focus Indicators](#focus-indicators)

---

## State Layer System

M3 uses **state layers** — semi-transparent overlays on top of a component's base color — to indicate interaction states. The state layer color matches the component's "on" color.

Example: A `primary` button uses `on-primary` as its state layer color.

### State priority (highest to lowest)

1. **Dragged** — Currently being dragged
2. **Pressed** — Actively being pressed/tapped
3. **Focus** — Has keyboard or accessibility focus
4. **Hover** — Cursor is over the element

States do NOT stack. Only the highest-priority active state is shown.

---

## Opacity Values

| State | Opacity | Description |
|-------|---------|-------------|
| **Enabled** | 0% | Default, no overlay |
| **Hover** | 8% | Mouse cursor over element |
| **Focus** | 10% | Keyboard/accessibility focus |
| **Pressed** | 10% | Active press/tap |
| **Dragged** | 16% | Being dragged |
| **Disabled** | Container 12%, content 38% | Non-interactive |

### State layer color selection

| Component fill | State layer color |
|---------------|-------------------|
| `primary` | `on-primary` |
| `primary-container` | `on-primary-container` |
| `secondary-container` | `on-secondary-container` |
| `surface` | `on-surface` |
| `surface-container` | `on-surface` |

---

## Tailwind Implementation

### Hover (8% opacity)

```tsx
// Primary button hover
<button className="bg-primary text-on-primary
                    hover:bg-primary/[0.92]   /* or use a separate overlay */
                    transition-colors">

// Alternative: overlay approach (more M3-correct)
<button className="relative bg-primary text-on-primary overflow-hidden">
  <span className="absolute inset-0 bg-on-primary opacity-0 hover:opacity-8 transition-opacity" />
  <span className="relative">Label</span>
</button>

// Surface item hover — simplest approach
<div className="hover:bg-on-surface/8 transition-colors rounded-lg px-4 py-3">
  List item
</div>
```

### Focus (10% opacity)

```tsx
// Focus with state layer + focus ring
<button className="bg-primary text-on-primary
                    focus-visible:bg-primary/[0.90]
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                    transition-colors">
  Action
</button>

// Surface item focus
<div className="focus-visible:bg-on-surface/10 rounded-lg"
     tabIndex={0}>
  Focusable item
</div>
```

### Pressed (10% opacity)

```tsx
<button className="bg-primary text-on-primary
                    active:bg-primary/[0.90]
                    transition-colors">
  Action
</button>
```

### Disabled (12% container, 38% content)

```tsx
<button className="disabled:bg-on-surface/12 disabled:text-on-surface/38
                    disabled:cursor-not-allowed disabled:shadow-none"
        disabled>
  Disabled
</button>
```

### Combined states pattern

```tsx
// Standard M3 interactive element
<button className="
  bg-primary text-on-primary
  hover:shadow-elevation-1
  focus-visible:outline-2 focus-visible:outline-primary
  active:shadow-none
  disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none disabled:cursor-not-allowed
  transition-all
">
  M3 Button
</button>

// Standard M3 surface item (list, nav)
<div className="
  px-4 py-3 rounded-full cursor-pointer
  text-on-surface-variant
  hover:bg-on-surface/8
  focus-visible:bg-on-surface/10
  active:bg-on-surface/10
  transition-colors
">
  Navigation Item
</div>
```

---

## Focus Indicators

M3 requires visible focus indicators for accessibility. Two approaches:

### 1. Focus ring (default for buttons)

```tsx
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
```

### 2. State layer only (for surface items)

```tsx
<div className="focus-visible:bg-on-surface/10 rounded-lg" tabIndex={0}>
```

### Important rules

- Always use `focus-visible:` (not `focus:`) to avoid showing focus on click
- Never use `outline-none` without providing an alternative focus indicator
- Focus ring color should match the component's primary color role
