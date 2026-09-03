# Greek Mastery A1–A2 • v0.4.2

An offline-first Modern Greek learning app built around a fixed grammar-led A1→A2 pathway.

## A1 foundation batch 1

- Today screen with one clear next action
- Compact Course button with a focused unit-and-worksheet drawer, including a direct return to Unit 1
- Deep-blue gradient visual system with high-contrast dark text
- Fixed course path and locked future lessons
- Five grammar-led units with 100 sequential worksheets and 1,000 validated exercises
- Unit 1: articles and noun gender
- Unit 2: είμαι and personal pronouns
- Unit 3: affirmative statements, negation and yes–no questions
- Unit 4: regular present-tense verbs
- Unit 5: high-frequency verbs έχω, πάω, λέω and θέλω
- Immediate correction loop and first-attempt scoring
- Mastery gate requiring 10/10 corrected and at least 9/10 on first attempt
- Three-word vocabulary ceiling for the first worksheet, with gradual cumulative growth
- Explicit rules, ending clues, article contrasts, exceptions, listening and controlled sentence frames
- Generated deterministic curriculum data with unique exercise IDs
- Review state and 1/3/7/21/60-day rhythm
- Local progress persistence
- Search and in-app system check
- Explicit loading-safe error screen
- Responsive desktop and mobile navigation
- Installable PWA files and offline cache

## Language rules

- Standard Modern Greek spelling and accents
- Full written forms such as `Και εγώ`
- Nouns taught with article, gender, plural and contextual use
- No random phrase collection: vocabulary supports the grammar pathway

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run generate:curriculum
npm run build:github
npm run dev
```

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Upload this project or push it to the `main` branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. The included workflow builds and publishes `dist-github` automatically.

The app uses relative asset paths so it works from a GitHub project-page URL.

## Checks

```bash
npm run lint
npm run build:github
node --test tests/greek-mastery-foundation.test.mjs
```

The automated checks protect navigation destinations, completion gates, Greek orthography and offline metadata.
