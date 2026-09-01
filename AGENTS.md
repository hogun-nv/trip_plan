# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- This folder implements Version 2, “Cinematic City Diary”, from `design/reference-option-2.png`.
- Preserve the canonical `src/data/trip-data.json` byte-for-byte from Version 1: five plans, 35 days, 198 stops, 15 hotels, and 30 food recommendations.
- Version 1 and the original standalone HTML must remain untouched. This is a separate GitHub-ready Vite project.
- Desktop uses a left chapter masthead, asymmetric photographic spread, horizontal storyboard, fold-out map with place dossier, and contact sheet.
- Mobile is an on-trip photo/itinerary/map mode with bottom navigation and one-hand controls.
- Use only canonical source images and their credit URLs. Do not add placeholders, emoji, CSS art, custom SVG, or uncredited photography.
- Preserve all planner behaviors, keyboard support, reduced motion, printing, local state, query state, and GitHub Pages/Sites packaging.
