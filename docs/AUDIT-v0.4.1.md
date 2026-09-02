# Greek Mastery v0.4.1 audit

## Navigation and UX

- PASS — A persistent Course menu is visible below the top bar.
- PASS — Unit dropdown lists Units 1–5, including Unit 1 at all times.
- PASS — Worksheet dropdown lists the selected unit’s 20 worksheets.
- PASS — Locked worksheets remain visible but disabled until the preceding worksheet is mastered.
- PASS — Selecting a unit opens that unit’s Path without changing or deleting learning progress.
- PASS — Selecting an available worksheet returns to Today with that worksheet active.
- PASS — Path displays only the selected unit, avoiding a long five-unit page.
- PASS — Desktop and mobile layouts retain access to both selectors.

## Visual system and accessibility

- PASS — Sidebar and course menu use deep-blue gradients.
- PASS — Primary headings and content use dark navy/ink and bold weights.
- PASS — White controls on blue backgrounds preserve strong contrast.
- PASS — Selectors have explicit accessible names.
- PASS — Existing focus, reduced-motion, and responsive behaviors remain present.

## Curriculum and regression checks

- PASS — Five units, 100 worksheets, and 1,000 exercises remain intact.
- PASS — Mastery locking, correction loops, progress storage, audio, and spaced review remain intact.
- PASS — Standard Greek accents and the full-form restriction remain protected by automated tests.
- PASS — Production and GitHub Pages builds complete successfully.
