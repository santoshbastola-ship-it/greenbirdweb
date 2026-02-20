# Greenbird Homestead UI/UX Guidelines

These guidelines ensure a uniform, premium, and responsive experience across all pages of the Greenbird Homestead application.

## 1. Color Palette

Use CSS variables defined in `globals.css` for all brand-related colors.

- **Primary Green**: `--forest-green` (#2D5A27) - Main brand color, used for primary actions and highlights.
- **Secondary Brown**: `--earthy-brown` (#5C4033) - Used for secondary actions and rustic accents.
- **Background**: `--cream` (#FCF9F1) - Main background for public pages.
- **Text**: `--foreground` (#1a1a1a) - Primary text color.

> [!IMPORTANT]
> Avoid using literal Tailwind colors like `green-600` or `emerald-500` for brand elements. Use `bg-[#2D5A27]` or the CSS variables.

## 2. Components

### Buttons
- **Shape**: Use `rounded-xl` (12px) for most buttons. Use `rounded-full` for pill-shaped elements like search bars or specialized hero buttons.
- **Style**:
    - **Primary**: Brand green background, white text.
    - **Secondary**: Brand brown background, white text.
    - **Outline**: Transparent background, brand green border and text.
- **Interactions**: Include `hover:scale-[1.02] active:scale-[0.98]` micro-interactions and smooth transitions.
- **Gradients**: generally avoided unless specifically for "Special" highlights. Standardize on flat brand colors.

### Cards
- **Shape**: `rounded-2xl` (16px).
- **Background**: White in light mode, `gray-800` or similar in dark mode.
- **Shadow**: `shadow-sm` by default, `hover:shadow-xl` on interaction.
- **Border**: `border border-gray-100` (light) or `border-gray-700` (dark).

### Inputs
- **Shape**: `rounded-xl`.
- **Focus**: `focus:ring-2 focus:ring-[#2D5A27]`.
- **Text Size**: Always `text-base` (16px) on mobile to prevent iOS auto-zoom.

## 3. Layout & Spacing

- **Public Pages**: Use generous vertical padding (`py-12 md:py-20`) to create an "airy" and premium feel.
- **Admin Pages**: Can be more compact but should maintain consistent horizontal margins (`px-4 md:px-8`).
- **Containers**: Use a consistent max-width (e.g., `max-w-7xl mx-auto`).

## 4. Typography

- **Headings**: Use `font-bold` and brand green for H1/H2 on public pages.
- **Currency**: Always prefix with "Rs. " and use tabular-nums for alignment in lists. Format: `Rs. 500`.

## 5. Responsiveness

- **Touch Targets**: Minimum 44x44px for all interactive elements.
- **Mobile First**: Design for mobile first, then scale to desktop.
- **Safe Areas**: Use `env(safe-area-inset-*)` for notched devices (already in `globals.css`).

---
*Updated: Feb 16, 2026*
