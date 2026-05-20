# Kabuqina Figma Style Direction Design

## Goal

Create a new Figma design file that captures the soft lavender-pink visual direction from `UI.png` as a reusable design reference for Kabuqina. The deliverable should help validate look and feel before any React/Vite implementation work.

## Scope

The Figma file will contain one polished page named `Kabuqina Style Direction` with three sections:

1. `Style Tokens`: color swatches, typography notes, radius scale, and shadow examples.
2. `Core Components`: top navigation tab, sidebar item, primary action button, quick action button, chat bubbles, input composer, and workspace cards.
3. `Chat Home Screen`: a 1660 x 930 desktop mockup using the three-column layout from the reference image.

Out of scope for this first pass: settings screens, onboarding screens, responsive mobile variants, production React/CSS changes, and Hermes dashboard redesign.

## Visual Direction

The design should feel calm, companionable, and lightly tactile. The dominant surface is near-white with a faint lavender-pink cast, layered with translucent panels, low-contrast borders, soft purple shadows, and generous spacing.

Core palette:

- Ink: `#5A4A6A`
- Secondary text: `#8B7D9A`
- Primary lavender: `#B8A9C9`
- Pale lavender: `#E8DFF0`
- Background: `#FAF8FB`
- Optional warm accent: `#D4A574`

Typography:

- UI text uses the system sans stack.
- The hero brand title uses a serif display style similar to Georgia or Songti.
- Letter spacing stays at `0`; visual softness comes from color, spacing, and surfaces rather than stretched type.

Shape and effects:

- Main app shell radius: `20-24px`.
- Cards and controls: `8-18px`, depending on size.
- Shadows should be soft and purple-tinted, avoiding heavy contrast.
- Use subtle glass surfaces, not strong blur effects that reduce readability.

## Main Mockup Layout

The screen is a Windows desktop app view at `1660 x 930`:

- Top bar: brand avatar and `卡布奇娜` on the left, tabs for `聊天 / 向导 / 设置 / 能力`, and window controls on the right.
- Left sidebar: new chat button, grouped conversation history, and a small reminder entry near the bottom.
- Center chat: large `卡布奇娜` title, short companion tagline, quick action buttons, sample chat bubbles, and a bottom composer.
- Right workspace: current goal, materials, output, quick actions, and a quiet closing quote.

The composition should preserve the reference image's calm empty space in the center while still looking like a usable product screen.

## Component Notes

Buttons should use familiar icons where useful, but the Figma pass may use simple vector placeholders if icon library import is unavailable. Text labels should stay short and Chinese-first.

Cards should avoid nested-card styling. The right workspace cards are individual repeated items on the panel, not panels inside panels.

The visual companion asset can be represented as a soft circular avatar or cup-like placeholder. The first pass should prioritize layout, color, and component styling over detailed illustration.

## Acceptance Criteria

- A new Figma design file exists and is reachable by URL.
- The file has a clear style-token section with the agreed palette.
- The file includes reusable component examples for the main chat surface.
- The main mockup is recognizable as the provided reference style without being a pixel-perfect clone.
- Text remains legible and does not overlap at the desktop mockup size.

## Validation

After creating the Figma file, inspect the canvas through the Figma tool and capture a screenshot if available. Check that the main frame is nonblank, the three-column layout is visible, the palette is applied consistently, and no major text overlaps are present.
