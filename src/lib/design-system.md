# CRx7 Design System

## Core Principles
- **Modern & Attractive**: Clean, contemporary design with subtle animations
- **Minimal Complexity**: Simple user flows, clear actions
- **Accessible**: Large touch targets, good contrast
- **Consistent**: Unified design language using shadcn-svelte

## Color Palette
```css
/* Primary - Orange theme */
--primary: #f97316 (orange-500)
--primary-hover: #ea580c (orange-600)
--primary-light: #fed7aa (orange-200)
--primary-dark: #c2410c (orange-700)

/* Background */
--bg-main: #ffffff (white)
--bg-secondary: #fafafa (neutral-50)
--bg-accent: #fff7ed (orange-50)

/* Text */
--text-primary: #18181b (zinc-900)
--text-secondary: #71717a (zinc-500)
--text-muted: #a1a1aa (zinc-400)

/* Status */
--success: #16a34a (green-600)
--error: #dc2626 (red-600)
--warning: #eab308 (yellow-500)

/* Borders */
--border: #e4e4e7 (zinc-200)
--border-light: #f4f4f5 (zinc-100)
```

## Typography
- **Font**: System font stack (no custom fonts)
- **Headings**: Bold, minimal sizes
  - h1: 2rem (32px) - Page titles only
  - h2: 1.5rem (24px) - Section headers
  - h3: 1.125rem (18px) - Subsections
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)

## Spacing
- Use consistent 8px grid: 8, 16, 24, 32, 48, 64
- Page padding: 24px mobile, 48px desktop
- Component spacing: 16px between elements

## Components

### Buttons
- Primary: Black bg, white text, no border radius
- Secondary: White bg, black border, black text
- Size: Min height 48px for touch
- States: Default, hover (slight opacity), disabled (gray)

### Cards
- White background
- 1px light gray border
- No shadows
- 16px padding

### Forms
- Labels above inputs
- Large inputs (48px height)
- 1px gray border
- Clear error states below

### Layout
- Max width: 1200px centered
- Mobile first
- Single column on mobile
- Simple grid on desktop

## Animation
- Minimal to none
- Only for loading states
- No decorative animations

## Examples

### Page Layout
```
[Header - fixed, white bg, bottom border]
[Main content - max-width container]
[Footer - if needed, minimal]
```

### Admin Dashboard
```
Title
[Stats cards - simple numbers]
[Action button - black, prominent]
[Data table - clean lines]
```

### Lottery Wheel
- Simple circle divided into 7
- Black lines for divisions
- Winner highlighted in black
- No gradients or shadows