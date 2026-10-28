# ROYO interface design

The redesign uses a quiet workshop-journal direction: plum navigation, purple actions, warm neutral surfaces, editorial headings, and clear motorcycle context. Decorative gradients and simulated diagnosis content were removed from the running applications.

## Screen inventory

The Figma exploration contains fourteen editable screen concepts: assistant, garage, service logbook, conversation history, sign in, registration, and add motorcycle, each in desktop and phone form. Library button and input instances are used alongside product palette variables and Plus Jakarta Sans typography. The implementation refines these concepts into working screens and dialogs.

Reference: https://www.figma.com/design/ePiS6cXkBaMmZIk6wgEo2R

## Layout rules

| Available width | Web | Native |
|---|---|---|
| Under 600 | Bottom navigation, compact header, bounded chat with an internally scrolling welcome/history and visible composer | Bottom tabs, keyboard-aware forms and chat |
| 600–839 | Navigation rail, stacked assistant, two supporting panels | Navigation rail, wider content |
| 840–1199 | Navigation rail, stacked assistant and supporting panels | Navigation rail and split assistant/context |
| 1200+ | Sidebar and assistant/context columns | Wider split content within a bounded content width |

Layout follows window width, allowing resizing and landscape use. Chat drafts live outside page presentation so changing tabs or width does not discard them. Desktop and phone presentations intentionally differ.

## Shared styling

- `packages/theme/src/tokens.json`: shared palette and width thresholds.
- `scripts/generate-theme.mjs`: emits `packages/theme/assets/css/variables.css`; `--check` detects drift.
- `packages/theme/assets/css/`: global web base, shell, assistant, forms, and garage/logbook styles.
- `apps/mobile/src/styles.ts`: native presentation styles consuming the same tokens.
- `packages/theme/src/breakpoints.ts`: shared width classification consumes the token values.

React Native does not interpret browser CSS files. Sharing CSS directly would require adopting a CSS-to-native system or changing the rendering stack. This implementation shares tokens and feature logic while keeping browser CSS and native StyleSheet presentation separate. The older exported DOM component package still contains legacy inline styles; those components are no longer used by the running web or native screens.

## Logo

`packages/theme/assets/images/royo-wordmark.svg` is the editable master. `royo-wordmark.png` is a transparent, twice-resolution export used by both apps. The wordmark has uppercase italic script lettering, a small cursive tagline, and a gear containing a wrench. `node scripts/export-logo.mjs` reproduces the PNG on the design workstation; the checked-in PNG keeps platform rendering consistent. The SVG uses Segoe Script with cursive fallbacks, so re-exporting on another OS can change the lettering unless the same font is installed.

The same export produces `royo-symbol.png` from the gear artwork for the tablet navigation rail, avoiding cropped lettering.

## Accessibility and evidence

Native buttons have touch-sized targets and accessible labels/states. Web uses landmarks, labels, visible keyboard focus, native modal focus management, reduced-motion support, and honest empty/loading/error states. Automated axe scans cover the assistant and sign-in dialog at phone/tablet/desktop widths in light mode and the assistant in dark mode. Automated checks supplement manual review; they do not replace screen-reader and physical-device testing.

Reviewed browser captures are in `docs/screenshots/`. Responsive tests verify navigation, horizontal overflow, navigation overlap, dialog bounds, theme changes, and draft preservation. They are representative viewport checks, not a claim that every possible device and dimension has been tested.
