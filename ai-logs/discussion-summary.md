# AI Development Discussion Log

*Note: This project was built using a local, IDE-integrated autonomous AI agent (Google Deepmind) rather than a public web-based chat UI like ChatGPT or Claude. As a result, there is no public URL for the chat transcript. This document serves as a summarized log of the key architectural discussions and decisions made between the developer and the AI during the development process.*

## Discussion 1: Enforcing Strict Architectural Boundaries
**Developer:** The assignment requires that `media-ui-react` remains completely headless and has absolutely no dependency on `media-core` or `media-react`. How do we enforce this?
**AI:** We will enforce this by construction in the monorepo. `media-ui-react` will be a pure React hook library exposing prop-getters (e.g. `getContainerProps`, `getItemProps`). It will accept raw generic data types (`T`) rather than SDK-specific types like `MediaPhoto` or `MediaVideo`. This ensures it knows nothing about the Pexels API. The wiring will happen exclusively in `apps/web/src/components/MediaGrid.tsx`, which acts as the consumer bridge between `media-react` (data) and `media-ui-react` (presentation).

## Discussion 2: Resolving the Headless UI Inline Styles Conflict
**Developer:** I noticed `useReelSwiper.ts` in `media-ui-react` is returning `style: { scrollSnapType: "y mandatory" }` in its `getContainerProps` getter. The assignment says the UI library must be purely functional and consumer apps must own the styling. Isn't returning inline styles a violation?
**AI:** That is a great catch. While `scroll-snap` is technically functional behavior required for the hook to work properly, passing it as inline CSS crosses the boundary of a strictly headless library. We will remove the inline style object completely from the `useReelSwiper` hook. Instead, we will rely on the consumer app (`apps/web/src/styles.css`) to define `.reels-container` and `.reel-item` with the appropriate `scroll-snap-type` and `scroll-snap-align` rules. 

## Discussion 3: React Native Peer Dependency Conflicts (ERESOLVE)
**Developer:** When deploying to Vercel, the build fails at `npm install` because of an `ERESOLVE` conflict between `react-native` (which requires React 19 in its latest version) and the rest of the workspace using React 18.
**AI:** Since Vercel runs a standard `npm install` by default, it throws a strict peer dependency error. Locally, we solved this by running `npm install --legacy-peer-deps`. To fix this permanently on Vercel without altering the build scripts manually in the UI, we will create an `.npmrc` file in the root of the project containing `legacy-peer-deps=true`. This will instruct Vercel to install the workspace correctly.

## Discussion 4: Vercel Monorepo Deployment
**Developer:** The Vercel build is failing with `Cannot find module 'media-react'` because we set the Vercel Root Directory to `apps/web`. Vercel is skipping the monorepo root and the workspace symlinks aren't being created.
**AI:** Correct. In a standard npm workspace, if you point Vercel's Root Directory to a subfolder without a root `package-lock.json` configuration, it isolates the install. To fix this, we will leave the Vercel Root Directory blank (so it installs from the monorepo root and links all packages) and instead override the Build Command to `npm run build` and the Output Directory to `apps/web/dist`. This ensures all five packages are built correctly before serving the web app.

## Discussion 5: Generating SDK and Component Documentation
**Developer:** The assignment explicitly asks for deployed URLs of the SDK docs and Component docs. How do we deploy these without setting up separate hosting or GitHub Pages branches?
**AI:** The most efficient way is to generate the TypeDoc output directly into the `apps/web` public folder before pushing. We will run `npx typedoc --out apps/web/public/docs/sdk packages/media-core/src/index.ts` and similarly for `media-ui-react`. Vite automatically copies the `public` folder to the `dist` folder during the build process, meaning Vercel will host the documentation perfectly alongside the live web app at `/docs/sdk` and `/docs/components`.
