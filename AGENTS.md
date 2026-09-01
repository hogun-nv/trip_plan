# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- This folder implements the first displayed Product Design concept: the three-column “Atlas Editorial Spread” with photography, itinerary, and map visible together on desktop.
- Preserve all five route plans and their underlying itinerary, hotel, restaurant, arrival-option, source, and photo-credit data from `../nyc-couple-trip-2026.html`.
- The original standalone HTML must remain untouched. This project is a separate GitHub-ready Vite application.
- Mobile is an on-trip mode: current/next action first, then reachable itinerary/map/atlas navigation. Desktop remains a simultaneous editorial spread.
- GitHub Pages is the primary requested publishing path; the bundled Sites runtime must also remain intact.
