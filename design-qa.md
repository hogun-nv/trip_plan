# Design QA — Version 1

## Comparison target

- Source visual truth: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/reference-option-1.png`
- Source pixels: 1487 × 1058
- Implementation: `http://127.0.0.1:4174/?plan=classic&day=1`
- Implementation screenshot: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/desktop-1440x1024.png`
- Implementation pixels / CSS viewport: 1440 × 1024 at device scale factor 1
- Normalization: the source was fitted to 1440 × 1024 with Lanczos resampling. The source and implementation have nearly identical aspect ratios; no browser chrome or device frame was included.
- State: light theme, Plan 01 `첫 뉴욕 클래식`, D1, 9/18 밤 도착안, 첫 장소 selected, all timeline details collapsed.

## Evidence

- Full-view side-by-side: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/comparison-source-vs-implementation.png`
- Focused core-spread side-by-side: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/comparison-core-spread.png`
- 1440 × 900 desktop: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/desktop-1440x900.png`
- 1024 × 768 tablet: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/tablet-1024x768.png`
- 390 × 844 mobile itinerary: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/mobile-itinerary-390x844.png`
- 390 × 844 mobile map: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/mobile-map-390x844.png`
- 390 × 844 mobile atlas/overview: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/mobile-overview-390x844.png`
- Playwright measurements: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/playwright-results.json`
- 5 plans × 7 days functional matrix: `/Users/hogun/Documents/ChatGPT/ETC/nyc-couple-trip-v2-01/design/qa/functional-results.json`

## Findings

No actionable P0, P1, or P2 visual mismatch remains.

- Fonts and typography: the source’s Korean editorial serif/sans contrast is preserved with `AppleMyungjo / Noto Serif KR / Georgia` for display text and the platform sans stack for operational text. Heading scale, rust-colored time hierarchy, compact metadata, line height, wrapping, and truncation are stable at 1440, 1024, 390, and 320px. The implementation intentionally increases several source-small labels to 10–12px and all mobile action targets to 44px for outdoor readability.
- Spacing and layout rhythm: the source’s date rail, photo essay, timeline, map/dossier, and lower atlas retain the same reading order and editorial proportions. Hairline dividers replace floating cards; radius stays at 4–6px and shadows are limited to menus, dialog, toast, and the mobile sticky action bar. There is no horizontal overflow at 1440, 1024, 390, or 320px.
- Colors and tokens: warm neutral paper, dark navy text, restrained rust/olive/teal states, and desaturated map tiles match the source direction. No gradients, glassmorphism, glow, or decorative orbs are used. Light/dark semantic tokens remain legible.
- Image quality and asset fidelity: all visible travel imagery is real sourced photography with an in-image source link. The implementation intentionally substitutes licensed Wikimedia/official imagery for the concept’s generated or untraceable photography. Above-the-fold hero imagery loads eagerly; other images lazy-load and fall back without breaking layout. A generic hotel-room reference is explicitly captioned as a mood reference rather than a specific booked room.
- Copy and content: Korean labels are concise and operational. The product-specific data omitted from the visual concept—9박 10일, exact international-flight baseline, five-plan verdicts, all 35 swap notes, hotels, foods, booking notices, and sources—is preserved in the atlas and print guide without changing the source layout’s core spread.
- Icons and controls: all interface icons come from one Phosphor family. No emoji, handcrafted SVG illustration, CSS-art asset, glass control, or placeholder illustration is present. Marker numerals are route data, not decorative icons.
- Interaction and accessibility: date tabs support arrows/Home/End; multiple itinerary items expand independently; list/marker/dossier selection stays synchronized; duplicate coordinates are visually separated; direction and official-information links are distinct; favorite, complete, copy, city, arrival, theme, share, print, atlas, and mobile view switching work. The atlas has initial focus, focus trapping, Escape close, trigger focus restoration, inert background, and arrow-key tabs. Reduced-motion also disables JS pan/scroll animation.
- Responsive behavior: tablet uses a photo spread followed by two operational columns. Mobile uses compact current/next/move information, a fixed three-action thumb bar, a full-width map mode with route refit, and a sticky selected-place directions action. The map loaded 11 visible tiles and all five route markers in the checked 390 × 844 state.

## Comparison history

### Iteration 1 — blocked

Evidence: `/private/tmp/nyc-v2-current-desktop-wait.png`, `/private/tmp/nyc-v2-current-mobile-cdp.png`, `/private/tmp/nyc-v2-current-mobile-map-top-cdp.png`.

- P0: Leaflet mounted while hidden on mobile, producing a gray or clipped map. Fixed with `ResizeObserver`, `invalidateSize`, and route refit when the map becomes visible.
- P0: the visible `길찾기` action opened a place’s official website. Fixed by generating a coordinate-based Google Maps destination URL and separating `공식 정보`.
- P1: exact flights, plan verdict/metrics, 7-day overview, and daily swap advice were present in data but not discoverable. Fixed with the `여행안` atlas view, complete flight timeline, 7-day index, daily swap notes, and full print guide.
- P1: atlas declared a modal without focus management. Fixed with initial focus, focus trap, inert siblings, scroll lock, Escape handling, roving tab focus, and focus restoration.
- P2: first itinerary item was expanded by default, reducing scanability. Fixed by starting collapsed while preserving multi-item expand/collapse.
- P2: mobile frequent-action targets were 34–40px. Fixed to at least 44px and verified with Playwright.
- P2: selected markers with identical coordinates overlapped. Fixed with small coordinate offsets and selected-marker z-index priority.
- P2: fallback images could display an incorrect credit. Fixed by propagating the fallback image’s matching credit and changing it on load failure.
- P2: several microcopy/data issues remained (`SPORT`, final “next”, late-arrival progress, storage validation, clipboard fallback, note collapse). All were corrected.

### Iteration 2 — passed

Post-fix evidence: the final full-view and focused side-by-side composites listed above, plus desktop/tablet/mobile screenshots. No P0/P1/P2 issue remained after direct visual inspection.

## Primary interactions tested

- All 5 plans, all 35 days, all 198 itinerary stops, and matching map markers
- Three arrival-time choices, including the two-stop late-arrival D1
- Date and plan switching, multi-expand/collapse, marker/list synchronized selection
- Favorite, complete, reservation-copy toast, theme, city switching, and state persistence
- Atlas six-tab content, keyboard tab movement, focus containment, Escape close
- Mobile itinerary/map/atlas switching and visible coordinate-based directions action
- 320px horizontal-overflow check, 390px touch-target check, 1024px responsive layout
- Browser console and page errors: none in the final visual run
- Production build and Sites worker tests: passed

## Open questions

- None blocking Version 1. Exact hotel room photography for each recommended property would require hotel-specific usage permissions; Version 1 avoids implying that a generic room is a particular hotel.

## Follow-up polish

- P3: bundle a small curated subset of the licensed lead images as optimized WebP/AVIF files if fully offline viewing becomes a requirement. Current GitHub Pages use remains functional with remote licensed sources and resilient fallbacks.
- P3: add a hosted Korean serif webfont only if cross-platform typography must match macOS pixel-for-pixel; the present system fallback avoids another render-blocking dependency.

## Implementation checklist

- [x] Source and implementation normalized and compared side by side
- [x] Full-view and focused-region visual checks
- [x] Typography, spacing, color, imagery, copy, icons, interaction, responsive, and accessibility passes
- [x] P0/P1/P2 issues fixed and recaptured
- [x] Playwright desktop/tablet/mobile and full data matrix passed
- [x] GitHub Pages build path and deployment workflow prepared

final result: passed
