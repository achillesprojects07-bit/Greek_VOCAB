# Greek Mastery v0.4.0 Audit

## Scope

Audit of A1 Units 1–5 before publication.

## Curriculum integrity

- 5 sequential grammar units
- 20 worksheets per unit
- 10 exercises per worksheet
- 1,000 total exercises with unique IDs
- One explicit rule and three application steps on every worksheet
- Vocabulary and forms limited to the active grammar target or prior knowledge
- 9/10 first-attempt mastery threshold and 10/10 corrected threshold
- Locked linear progression and 1/3/7/21/60-day review scheduling

## Language audit

- Standard Modern Greek spelling and accents preserved
- No optional contracted `Κι` forms
- Correct conjugation of `είμαι`
- Correct placement of `δεν` before the verb
- Greek direct questions use the semicolon-shaped question mark (`;`)
- Correct present forms generated for regular verbs
- Correct high-frequency forms for `έχω`, `πάω`, `λέω` and `θέλω`
- English glosses conjugated naturally; generator rejects malformed alternatives

## UX and reliability audit

- Current task is visible on the first screen
- Unit and worksheet identifiers are distinct (`U2–W1`)
- Future worksheets remain locked until mastery
- Incorrect answers must be corrected before continuing
- Progress persists locally under a versioned storage key
- Loading screen and app-level error boundary reduce blank-screen risk
- Desktop and mobile navigation retain all five destinations
- Listening uses browser Greek speech support with visible controls
- Offline cache version advanced for reliable installed-app updates

## Automated checks

- Curriculum generation: passed
- Lint: passed
- Curriculum and language tests: passed
- GitHub Pages production build: passed
