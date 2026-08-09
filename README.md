# Media SDK — take-home submission

A headless media SDK ecosystem on top of the Pexels API: a framework-agnostic
core, a thin React wrapper, an independent headless component library, and a
web app that wires them together.

## Structure

```
packages/
  media-core/       framework-agnostic SDK (Pexels client, events, cache) — zero UI
  media-react/      thin React wrapper — provider + hooks, no business logic
  media-native/     thin React Native wrapper — identical contract to media-react
  media-ui-react/   pure headless UI for Web (Grid, Lightbox, Reel Swiper) — no core imports
  media-ui-native/  pure headless UI for RN (prop-getters for FlatList, Modal) — no core imports
apps/
  web/              the only package that imports both media-react AND media-ui-react
skills/
  media-react-data-wiring/       SKILL.md for wiring data hooks
  media-ui-react-components/     SKILL.md for consuming the headless components
```

**Dependency direction is enforced by construction, not lint rules** (a real
lint boundary rule would be the next thing added, see "What I'd do with more
time" below): `media-core` has no workspace dependencies at all;
`media-react` depends only on `media-core`; `media-ui-react` depends on
neither; `apps/web` is the sole consumer of both `media-react` and
`media-ui-react` together.

## Running it

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # add a free Pexels key: https://www.pexels.com/api/
npm run dev:web
```

Every package typechecks cleanly (`npx tsc --noEmit` in each) and the app
builds cleanly (`npx vite build`) — verified as part of building this, not
just claimed.

## Scoping decisions (what I cut, and why)

Given the ~8–12 hr suggested window against the full brief, I prioritized in
the order the evaluation criteria are weighted (architecture → SDK design →
headless components → skills → judgment), and cut in this order:

1. **React Native packages — originally considered for scope reduction, but implemented.**
   `media-native` provides the React Native SDK wrapper, while
   `media-ui-native` provides React Native-specific headless hooks.
2. **Video support in the Lightbox — cut.** The task marks this "if time
   allows." Photos get the full Lightbox (keyboard nav, focus management,
   prev/next); videos are routed straight to the Reel Swiper view instead,
   which is arguably the more natural UX for video anyway.
3. **Visual polish** — Added! The consuming web app includes a polished, responsive visual treatment while keeping all UI packages genuinely headless.
4. **Deployed docs sites / live URLs** — Added! SDK and Component documentation is generated via TypeDoc and deployed directly out of the web app's `public` directory, making them accessible alongside the live application.

## AI-assisted vs hand-written

Per the brief's request to disclose this: this submission was developed with an
IDE-integrated autonomous AI coding agent (Google DeepMind) rather than a
public ChatGPT/Claude web chat.

The AI agent was used to assist with architecture, implementation, debugging,
documentation, and UI refinement. Key architectural decisions and corrections
were reviewed during development and verified by running the project's
type-check and production build.

The `ai-logs/discussion-summary.md` file documents the major AI-assisted
architecture and implementation discussions.

## What I'd do with more time

- An actual lint rule (e.g. `eslint-plugin-boundaries` or a custom
  `no-restricted-imports` config per package) enforcing the dependency
  direction automatically, instead of it being true "by construction" but
  unenforced in CI
- Unit tests for `media-core`'s cache de-dupe and pagination logic, and for
  the headless hooks' keyboard/focus behavior
- Video support inside the Lightbox itself

## Submission checklist (deploy steps)

1. `git init && git add -A && git commit -m "initial submission"`, push to a
   new GitHub repo.
2. Deploy `apps/web` to Vercel/Netlify setting the root directory empty, build command to `npm run build`, and output directory to `apps/web/dist`; add `VITE_PEXELS_API_KEY` as an environment variable in the deploy dashboard.
3. For the SDK/component "docs" deliverables: Docs are generated using `npx typedoc` and placed in `apps/web/public/docs/sdk` and `apps/web/public/docs/components`. They are deployed automatically alongside the Vercel app at `/docs/sdk` and `/docs/components`.

## Live URLs

- Web App: https://fotoowl-media-sdk-web-one.vercel.app/
- SDK Docs: https://fotoowl-media-sdk-web-one.vercel.app/docs/sdk/index.html
- Components Docs: https://fotoowl-media-sdk-web-one.vercel.app/docs/components/index.html
