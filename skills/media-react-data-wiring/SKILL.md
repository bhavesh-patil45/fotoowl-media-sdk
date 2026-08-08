---
name: media-react-data-wiring
description: How to correctly wire up media-react (or media-native) when building a UI on top of the media SDK. Use this whenever adding a screen, component, or feature that needs to fetch, search, or track photos/videos from the media platform.
---

# Wiring data with `media-react` and `media-native`

`media-react` (and its React Native twin `media-native`) are thin wrappers around `media-core`. They own exactly one job: getting Pexels-backed data and events into React state. They have **zero UI** — if you're rendering pixels, you're in the wrong package.

## The one rule that matters most

**`MediaProvider` is the only place the API key is ever touched.** Every other file in the app reads data through hooks that pull the client off context. If you find yourself importing `createMediaClient` or touching `config.apiKey` anywhere outside `main.tsx` / the app's root, stop — that's the wrong layer.

```tsx
// app root — the ONLY place this happens
import { MediaProvider } from "media-react"; // or "media-native"

<MediaProvider config={{ apiKey: import.meta.env.VITE_PEXELS_API_KEY }}>
  <App />
</MediaProvider>
```

## Concrete Import Rules & Dependency Restrictions
1. **Never call Pexels directly from application components.** Always use the SDK hooks.
2. **Never import `media-core` in UI components.** Only wrappers (`media-react`, `media-native`) depend on core. Re-export types if needed.
3. **No cross-platform bleeding.** Web components import from `media-react`. RN components import from `media-native`.

## Fetching data: pick the right hook

| Situation | Hook |
|---|---|
| User has typed a search query | `useMediaSearch(query, { kind: "photo" \| "video" })` |
| No query yet — show a default/trending feed | `useMediaFeed(kind)` |
| You need the raw client for manual operations | `useMediaClient()` |

Both `useMediaSearch` and `useMediaFeed` return the **same shape** on purpose:

```ts
{ items, loading, isInitialLoading, error, hasNextPage, loadMore }
```

## Firing events

`media-core` emits `download` and `view` events; the wrapper exposes them:

- `useMediaClient().trackView(item, source)` / `.trackDownload(item, source)` — call these from the UI layer when something actually happens (e.g. `onPress` or `onClick`).
- `useMediaEvent(eventName, handler)` — use this to **listen**, not fire.

## What NOT to do here

- Don't add loading/error state by hand if a hook already tracks it — every data hook here already exposes `loading`/`isInitialLoading`/`error`.
- Never bypass the Provider for auth.

