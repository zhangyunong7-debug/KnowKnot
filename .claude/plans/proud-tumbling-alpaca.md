# OneNote-Style UI Redesign Plan

## Context
The current blue-themed, card-heavy UI doesn't match the user's preference for a OneNote-like aesthetic. OneNote uses a distinctive purple color scheme, flatter design, paper-like backgrounds, and a unique sidebar layout.

## Core Changes (5 files)

### 1. `src/app/globals.css` — Color & Theme Overhaul
- **Primary**: Change from blue `199 89% 48%` to OneNote purple `288 38% 35%` (#80397B)
- **Background**: Warm off-white `30 20% 98%` (paper-like, not pure white)
- **Card**: Match background, remove heavy shadows
- **Border**: Slightly darker, `30 10% 90%`
- **Ring**: Match new primary
- **Muted**: Warm gray with subtle purple tint `280 10% 95%`
- **Accent**: Warm amber `45 93% 47%` (OneNote's accent)
- **Dark mode**: Dark purple-toned backgrounds
- **Border radius**: Reduce from `0.5rem` to `0.375rem` for more squared-off OneNote feel
- **Sidebar**: Add CSS variables for sidebar-specific colors (purple rail background)

### 2. `src/components/layout/Sidebar.tsx` — OneNote-Style Sidebar
- **Left rail** (when collapsed): Purple background (`bg-[#5C2D91]`), white icons, stacked vertically
- **Expanded state**: Left rail stays purple with icons, plus a middle panel (lighter bg) with text labels
- **Logo**: White "K" on purple background, simpler treatment
- **Active indicator**: Light/white highlight on the purple rail (like OneNote notebook selection)
- **Upload button**: White outlined on purple, or solid white
- **Sign out**: Muted, at bottom of rail

### 3. `src/components/layout/Header.tsx` — Purple Top Bar
- **Background**: Match purple `#5C2D91`
- **Text**: White/light
- **Search**: Translucent white input on purple background
- **Icons**: White with subtle hover states
- **Height**: Slightly shorter (`h-14` instead of `h-16`)

### 4. `src/components/layout/DashboardLayout.tsx` — Layout Tweaks
- Adjust main background to `bg-[#faf8f5]` (warm paper)
- Reduce padding slightly for denser OneNote feel

### 5. `tailwind.config.ts` — DaisyUI Config Update
- Update daisyUI theme colors to match new purple palette
- Keep plugin (minimal usage, safe to update)

## Verification
1. Start dev server on port 3001: `npx next dev -p 3001`
2. Visit `/dashboard` — verify purple sidebar, purple header, paper-like background
3. Visit `/notes` — verify note cards match new theme
4. Visit `/review` — verify tag pills and review cards fit new scheme
5. Visit `/collections` — verify collection cards & layout
6. Toggle dark mode — verify dark palette works
7. Toggle sidebar collapse/expand — verify both states look correct
