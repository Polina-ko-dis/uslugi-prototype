# Collection drag scrolling implementation plan

**Goal:** Allow mouse dragging of service collections in variants 1, 2 and 3 on desktop and tablet; mobile uses native finger swiping only.

**Architecture:** Add delegated pointer handlers to the existing shared `proto-logic.js`, so dynamically mounted collections work without component changes. Activate dragging only after horizontal movement; preserve clicks, native touch scrolling and keyboard interaction.

**Tech stack:** Browser Pointer Events, existing static HTML runtime, Node's built-in test runner.

**Spec:** User request in this chat: hold a service card and drag horizontally to scroll, across all collection variants.

## Constraints and review focus

- No dependencies or changes to card widths, colors or layout.
- Mouse dragging is explicitly enabled on desktop/tablet pages. The mobile page installs no custom gesture handlers or drag styles.
- Dragging an image or an add button must not open a service or add it to the cart on release.
- Minor movement must remain a click; touch, non-primary buttons and modified clicks retain native behavior.
- Releasing outside the row, cancellation and window blur must end the gesture.
- Disable scroll snapping during the gesture and restore it afterward; prevent native image drag.

## One task: shared interaction

- [x] Add regression tests in `tests/collection-drag.test.cjs`, loading the real shared script and driving its pointer handlers.
- [x] Run `node --test` and observe failures for missing mouse scrolling and accidental clicks.
- [x] Implement the shared handlers and scoped cursor/selection styles in `proto-logic.js`.
- [x] Update the shared-script cache version in `Main.html`, `MainTablet.html` and `MainDesktop.html`.
- [x] Run `node --test`, `node --check proto-logic.js` and `git diff --check`.
- [x] Verify actual image dragging across all three variants and screen versions, plus ordinary card clicks and button dragging in the browser.
- [x] Review the diff and leave the completed changes available for local preview.

## Verification

- Before implementation: 7 regression failures for missing drag behavior, 7 existing-interaction checks passing.
- After implementation: all 14 tests pass; syntax and whitespace checks pass.
- Browser: image dragging moves the row in all 9 variant/device combinations without opening a dialog.
- Browser: an ordinary image click opens a service; dragging from its parameter button scrolls without opening a dialog or changing the cart; snap returns to `x mandatory` on release.
- Independent code review found no actionable correctness or regression issues.
- Follow-up: mobile is excluded from custom mouse dragging; a regression test was observed failing before adding the page opt-in. All 15 tests now pass. Browser checks confirm native scrolling and default touch behavior in all three mobile variants, while desktop retains the grab cursor and mouse drag opt-in.
