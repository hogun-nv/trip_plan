# Design QA — Version 2 · Cinematic City Diary

## Visual truth and comparison

- Source: `design/reference-option-2.png` (`1487 × 1058`)
- Matching implementation state: `?plan=classic&day=4`
- Matching implementation capture: `design/qa/reference-state-1487x1058.png`
- Full side-by-side: `design/qa/comparison-source-vs-implementation.png`
- Focused comparisons: `design/qa/comparison-focus-gallery.png`, `design/qa/comparison-focus-map.png`
- Required viewports: `design/qa/desktop-1440x900.png`, `design/qa/mobile-itinerary-390x844.png`, `design/qa/mobile-map-390x844.png`, `design/qa/mobile-photos-390x844.png`

The source and implementation were compared at the same viewport and selected-day state. The implementation intentionally uses the canonical itinerary's real place photos and live route map instead of copying the mock's illustrative content.

## Iteration record

1. Restored the cinematic rail, asymmetric photo spread, compact day rail, horizontal itinerary storyboard, map+dossier fold, and visual atlas from the selected reference.
2. Replaced the generic note overlay with a useful day cover showing date, route title, subtitle, walking estimate, and rest guidance.
3. Fixed the desktop storyboard so every time, stop number, place name, category, image, and selection state remains visible.
4. Compressed the 1440×900 composition without shrinking touch targets so the photo atlas remains in the first viewport and the document has no overflow at that size.
5. Replaced the selected-place secondary image with a distinct nearby place image, reduced blank space, and preserved the mobile photo / itinerary / map / atlas switching model.
6. Reviewed Korean operational copy and clarified labels such as `선택 일정`, `다음 일정`, `무료 취소 호텔`, and `여행 개요`.

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
