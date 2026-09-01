# Greek Mastery A1–A2

An offline-first Modern Greek learning app built around a fixed grammar-led A1→A2 pathway.

## Phase 0 foundation

- Today screen with one clear next action
- Fixed course path and locked future lessons
- One complete grammar lesson: Understand → Notice → Control → Use → Result
- Five controlled questions with explanatory feedback and retry
- Completion gate requiring practice mastery and personal production
- Vocabulary cards with article, plural, meaning and natural Greek use
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
