# M3 Component Patterns — React + Tailwind

## Table of Contents

1. [Buttons](#buttons)
2. [Cards](#cards)
3. [Navigation](#navigation)
4. [Dialogs](#dialogs)
5. [Text Fields](#text-fields)
6. [Chips](#chips)
7. [Lists](#lists)
8. [App Bars](#app-bars)
9. [FAB](#fab)
10. [Snackbar](#snackbar)

---

## Buttons

### Filled button (primary CTA)

```tsx
<button className="bg-primary text-on-primary rounded-full px-6 py-2.5
                    text-sm font-medium tracking-[0.1px]
                    hover:shadow-elevation-1
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                    active:shadow-none
                    disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none
                    transition-all">
  Label
</button>
```

### Outlined button

```tsx
<button className="border border-outline text-primary rounded-full px-6 py-2.5
                    text-sm font-medium tracking-[0.1px]
                    hover:bg-primary/8
                    focus-visible:bg-primary/10
                    active:bg-primary/10
                    disabled:border-on-surface/12 disabled:text-on-surface/38
                    transition-all">
  Label
</button>
```

### Text button

```tsx
<button className="text-primary rounded-full px-3 py-2.5
                    text-sm font-medium tracking-[0.1px]
                    hover:bg-primary/8
                    focus-visible:bg-primary/10
                    active:bg-primary/10
                    disabled:text-on-surface/38
                    transition-colors">
  Label
</button>
```

### Tonal button (filled tonal)

```tsx
<button className="bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5
                    text-sm font-medium tracking-[0.1px]
                    hover:shadow-elevation-1
                    active:shadow-none
                    disabled:bg-on-surface/12 disabled:text-on-surface/38
                    transition-all">
  Label
</button>
```

### Icon button

```tsx
<button className="w-10 h-10 flex items-center justify-center rounded-full
                    text-on-surface-variant
                    hover:bg-on-surface-variant/8
                    focus-visible:bg-on-surface-variant/10
                    active:bg-on-surface-variant/10
                    transition-colors">
  <Icon size={24} />
</button>
```

---

## Cards

### Filled card

```tsx
<div className="bg-surface-container-highest rounded-xl p-4">
  <h3 className="text-on-surface text-base font-medium tracking-[0.15px]">Title</h3>
  <p className="text-on-surface-variant text-sm mt-1">Subhead</p>
  <p className="text-on-surface-variant text-sm mt-4">
    Supporting text for the card.
  </p>
</div>
```

### Elevated card

```tsx
<div className="bg-surface-container-low shadow-elevation-1 rounded-xl p-4
                hover:shadow-elevation-2 transition-shadow">
  <h3 className="text-on-surface text-base font-medium">Title</h3>
  <p className="text-on-surface-variant text-sm mt-1">Content</p>
</div>
```

### Outlined card

```tsx
<div className="bg-surface border border-outline-variant rounded-xl p-4">
  <h3 className="text-on-surface text-base font-medium">Title</h3>
  <p className="text-on-surface-variant text-sm mt-1">Content</p>
</div>
```

---

## Navigation

### Navigation rail item

```tsx
<button className="flex flex-col items-center gap-1 w-full py-3">
  {/* Active indicator */}
  <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors
    ${active
      ? 'bg-secondary-container text-on-secondary-container'
      : 'text-on-surface-variant hover:bg-on-surface/8'
    }`}>
    <Icon size={24} />
  </div>
  <span className={`text-xs font-medium tracking-[0.5px]
    ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
    Label
  </span>
</button>
```

### Navigation drawer item

```tsx
<button className={`w-full flex items-center gap-3 px-4 py-4 rounded-full text-sm font-medium
  transition-colors
  ${active
    ? 'bg-secondary-container text-on-secondary-container'
    : 'text-on-surface-variant hover:bg-on-surface/8'
  }`}>
  <Icon size={24} />
  <span>Label</span>
</button>
```

---

## Dialogs

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Scrim */}
  <div className="absolute inset-0 bg-black/32" onClick={onClose} />

  {/* Dialog */}
  <div className="relative bg-surface-container-highest rounded-3xl p-6
                  shadow-elevation-3 min-w-[280px] max-w-[560px]">
    {/* Icon (optional) */}
    <div className="flex justify-center mb-4">
      <Icon size={24} className="text-secondary" />
    </div>

    {/* Title */}
    <h2 className="text-on-surface text-2xl leading-8 text-center">
      Dialog Title
    </h2>

    {/* Content */}
    <p className="text-on-surface-variant text-sm mt-4">
      Supporting text explaining the dialog's purpose.
    </p>

    {/* Actions */}
    <div className="flex justify-end gap-2 mt-6">
      <button className="text-primary rounded-full px-3 py-2.5
                          text-sm font-medium hover:bg-primary/8 transition-colors"
              onClick={onClose}>
        Cancel
      </button>
      <button className="text-primary rounded-full px-3 py-2.5
                          text-sm font-medium hover:bg-primary/8 transition-colors"
              onClick={onConfirm}>
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Text Fields

### Outlined text field

```tsx
<div className="relative">
  <input
    type="text"
    placeholder=" "
    className="peer w-full px-4 py-4 rounded bg-transparent
               border border-outline text-on-surface text-base
               focus:outline-none focus:border-primary focus:border-2
               placeholder-transparent transition-colors"
  />
  <label className="absolute left-3 -top-2.5 px-1 bg-surface
                     text-on-surface-variant text-xs font-normal
                     peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                     peer-placeholder-shown:text-on-surface-variant
                     peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary
                     transition-all">
    Label
  </label>
</div>
```

### Filled text field

```tsx
<div className="relative">
  <input
    type="text"
    placeholder=" "
    className="peer w-full px-4 pt-6 pb-2 rounded-t
               bg-surface-container-highest text-on-surface text-base
               border-b-2 border-on-surface-variant
               focus:outline-none focus:border-primary
               placeholder-transparent transition-colors"
  />
  <label className="absolute left-4 top-2
                     text-on-surface-variant text-xs
                     peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                     peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary
                     transition-all">
    Label
  </label>
</div>
```

---

## Chips

### Assist chip

```tsx
<button className="inline-flex items-center gap-2 px-4 h-8
                    border border-outline rounded-lg
                    text-on-surface text-sm font-medium tracking-[0.1px]
                    hover:bg-on-surface/8 transition-colors">
  <Icon size={18} />
  Label
</button>
```

### Filter chip (selected/unselected)

```tsx
<button className={`inline-flex items-center gap-2 px-4 h-8 rounded-lg
  text-sm font-medium tracking-[0.1px] transition-all
  ${selected
    ? 'bg-secondary-container text-on-secondary-container'
    : 'border border-outline text-on-surface-variant hover:bg-on-surface/8'
  }`}>
  {selected && <Check size={18} />}
  Label
</button>
```

---

## Lists

### Standard list item

```tsx
<div className="flex items-center px-4 py-3 gap-4
                hover:bg-on-surface/8 transition-colors cursor-pointer">
  {/* Leading */}
  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
    <Icon size={24} className="text-on-primary-container" />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-on-surface text-base truncate">Headline</p>
    <p className="text-on-surface-variant text-sm truncate">Supporting text</p>
  </div>

  {/* Trailing */}
  <span className="text-on-surface-variant text-xs font-medium shrink-0">Meta</span>
</div>
```

---

## App Bars

### Top app bar (small)

```tsx
<header className="flex items-center h-16 px-4 gap-1 bg-surface">
  <button className="w-12 h-12 flex items-center justify-center rounded-full
                      text-on-surface hover:bg-on-surface/8 transition-colors">
    <Menu size={24} />
  </button>
  <h1 className="text-on-surface text-[22px] leading-7 font-normal ml-1 flex-1">
    Title
  </h1>
  <button className="w-12 h-12 flex items-center justify-center rounded-full
                      text-on-surface-variant hover:bg-on-surface-variant/8 transition-colors">
    <MoreVert size={24} />
  </button>
</header>
```

---

## FAB

### Standard FAB

```tsx
<button className="w-14 h-14 flex items-center justify-center
                    bg-primary-container text-on-primary-container
                    rounded-2xl shadow-elevation-3
                    hover:shadow-elevation-4
                    active:shadow-elevation-3
                    transition-all">
  <Plus size={24} />
</button>
```

### Extended FAB

```tsx
<button className="flex items-center gap-3 h-14 px-4
                    bg-primary-container text-on-primary-container
                    rounded-2xl shadow-elevation-3
                    hover:shadow-elevation-4
                    text-sm font-medium tracking-[0.1px]
                    transition-all">
  <Plus size={24} />
  Create
</button>
```

---

## Snackbar

```tsx
<div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-[560px]
                bg-inverse-surface text-inverse-on-surface
                rounded-sm px-4 py-3 shadow-elevation-3
                flex items-center gap-2">
  <p className="text-sm flex-1">Message text</p>
  <button className="text-inverse-primary text-sm font-medium
                      hover:opacity-80 transition-opacity shrink-0">
    Action
  </button>
</div>
```
