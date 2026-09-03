# Greek Mastery v0.6.0 — UX lock audit

## Primary navigation

- PASS — Desktop and mobile navigation expose the same five learner destinations.
- PASS — The active destination is communicated visually and semantically.
- PASS — Curriculum quality controls no longer occupy learner navigation.
- PASS — Unit selection stays inside the Course drawer until the learner deliberately opens a worksheet or unit path.
- PASS — Previously completed and unlocked worksheets remain reachable.

## Lesson journey

- PASS — The four stages use one vocabulary everywhere: Learn, Notice, Practice, Master.
- PASS — Lesson progress and Save and leave remain visible while scrolling.
- PASS — Completed stages can be revisited; future stages cannot be skipped.
- PASS — Incorrect answers require correction before progression.
- PASS — Leaving a worksheet preserves local progress.
- PASS — Mastery unlocks the next worksheet and schedules review.

## Responsive layout

- PASS — Wide screens use a 1,600-pixel workspace rather than a narrow centered island.
- PASS — Desktop retains the persistent course navigation rail.
- PASS — Tablet removes the rail and keeps Course access in the header.
- PASS — The lesson and progress stack below 760 pixels.
- PASS — Mobile retains a five-destination bottom navigation and compact lesson-stage markers.

## Accessibility and interface resilience

- PASS — Keyboard focus is visibly indicated on controls.
- PASS — Current pages and steps use `aria-current`.
- PASS — Vocabulary search has an accessible label.
- PASS — The quality dialog has dialog semantics, a labelled close action, and Escape-to-close behavior.
- PASS — Reduced-motion preferences remain respected.

## Regression protection

- PASS — Five units, 100 worksheets, and 1,000 exercises remain intact.
- PASS — Mastery gates, spaced review, persistence, Greek audio, and PWA installation remain intact.
- PASS — Standard Greek accents and full written forms remain protected.

## Lock decision

The visual system, navigation model, responsive breakpoints, and four-stage lesson journey are now locked for Phase 1. Future phases may fix genuine usability defects, but should not redesign these foundations while A1 content is being refined.
