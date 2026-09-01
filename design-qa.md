# Design QA — Version 3 · Fold-out Map Field Guide

## Visual truth and comparison

- Source: `design/reference-option-3.png` (`1487 × 1058`)
- Matching implementation state: `?plan=classic&day=3`
- Matching implementation capture: `design/qa/reference-state-1487x1058.png`
- Full side-by-side: `design/qa/comparison-source-vs-implementation.png`
- Focused comparisons: `design/qa/comparison-focus-map-itinerary.png`, `design/qa/comparison-focus-sheet-atlas.png`
- Required viewports: `design/qa/desktop-1440x900.png`, `design/qa/mobile-itinerary-390x844.png`, `design/qa/mobile-map-390x844.png`

The source and implementation were compared at the same viewport and selected-day state. The implementation retains the source's map-first hierarchy while rendering the canonical itinerary and interactive Leaflet route.

## Iteration record

1. Reconstructed the `22% / 48% / 30%` fold-out field-guide layout with chapter rail, map stage, operational itinerary, place sheet, and visual atlas.
2. Reduced duplicate photo postcards to compact numbered pins and kept the selected location photo-led; mobile now shows one selected photo pin with the remaining route as scannable numbered stops.
3. Fixed a 12px mobile map overflow, removed the duplicated sticky action bar, and preserved the selected-place command above the one-hand bottom navigation.
4. Muted the basemap so the route and numbered stops lead, replaced duplicate dossier imagery with a distinct contextual photo, and raised non-selected mobile pins above the selected postcard where routes cluster.
5. Separated atlas labels from the images, improved image brightness, and kept restrained category labels for faster visual scanning.
6. Reviewed Korean operational copy and clarified `선택 일정`, `다음 일정`, `선택한 플랜`, booking guidance, and travel-notice headings.

## Verification

- Playwright regression: `10 / 10` checks passed (`design/qa/qa-results.json`)
- 5 plans × 7 days: all 35 day/marker matrices passed
- List ↔ marker ↔ dossier synchronized selection passed
- Expand, favorite, complete, reservation copy, keyboard tabs, focus trap, Escape, theme, URL, and localStorage passed
- Responsive checks passed at `1440×900`, `1024×768`, `390×844`, and `320×844`
- No horizontal overflow, broken visible images, console errors, or page errors
- Mobile primary controls meet the 44px minimum target
- `npm run build` and `npm run test:sites` passed
- Canonical itinerary data hash remains `685a440d4d4b09eb8350a80c49c4bf127747a59f6f7d20c0f1960ec02cefe84b`, byte-identical to Version 1

final result: passed
