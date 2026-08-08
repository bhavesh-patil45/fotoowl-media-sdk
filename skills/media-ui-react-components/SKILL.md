---
name: media-ui-react-components
description: How to correctly consume media-ui-react and media-ui-native headless components (Grid, Lightbox, Reel Swiper) — prop-getter usage, styling contract, and accessibility. Use this whenever building or modifying any visual surface (grid, modal, swiper) that displays photos or videos.
---

# Using headless UI components (`media-ui-react` / `media-ui-native`)

Both UI packages ship **behavior, not appearance**. Every export is a hook that returns state plus prop-getter functions — there is no CSS, no default markup, and absolutely no dependency on `media-core` or `media-react` anywhere in these packages. 

## The styling contract & Headless Rule

- **You own every style, every layout, every visual state**.
- The hooks return prop-getters (e.g. `getContainerProps()`, `getModalProps()`). You must spread these onto your own DOM elements or React Native components.
- Never write a hook like `useGrid(items)` that renders JSX internally. Headless means it returns data and callbacks, NOT markup.

## Concrete Import Rules & Dependency Restrictions
1. **Never import `media-core`, `media-react`, or `media-native`** into any UI package. The UI layer only receives data via props.
2. **No cross-platform bleeding.** `media-ui-react` may use DOM APIs (IntersectionObserver, `window`, `document`). `media-ui-native` must NEVER use browser/DOM APIs. It must use React Native idioms (`onEndReached`, `FlatList` viewability callbacks).

## Prop-getter pattern — spread, don't guess

Every hook here follows the same shape: call it, then spread whatever `getXProps()` returns onto your own element.

### Web (`media-ui-react`) Example:
```tsx
const grid = useGrid<MyItem>({ hasNextPage, loading, onLoadMore });

<div {...grid.getContainerProps()}>
  {items.map((item) => (
    <div {...grid.getItemProps(item)}>
      {/* your markup */}
    </div>
  ))}
</div>
<div ref={grid.sentinelRef} />
```

### React Native (`media-ui-native`) Example:
```tsx
const grid = useGrid({ hasNextPage, loading, onLoadMore });

<FlatList
  data={data}
  keyExtractor={grid.getKeyExtractor()}
  onEndReached={grid.getOnEndReached()}
  onEndReachedThreshold={grid.getOnEndReachedThreshold()}
/>
```

## Component-by-component notes

### `useGrid`
- **Web**: Infinite scroll is IntersectionObserver-based via `sentinelRef`.
- **Native**: Returns `onEndReached` props tailored for `FlatList`.

### `useLightbox`
- **Web**: Keyboard nav and focus management are wired in via `window.addEventListener`.
- **Native**: Designed for `Modal` with `visible`, `transparent`, and `onRequestClose` mapping.

### `useReelSwiper`
- **Web**: Active-item detection is IntersectionObserver-based.
- **Native**: Uses `onViewableItemsChanged` and `viewabilityConfig` for `FlatList` paging.

## Accessibility — don't strip what's already there

The prop-getters inject `role`/`aria-*` (web) or `accessibilityRole` (native). Do not remove them. Add extra `aria-label`s if needed, but do not break the baseline accessibility.
