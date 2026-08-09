# Prismveil — Video Editor Portfolio

This is a black-and-gold, film-editor-themed portfolio site for **Kylle Eisen (Prismveil)**, built with React. Features a custom-controlled hero showreel, a project gallery with inline video previews, and a skills/about section styled like an editing timeline.

## Tech Stack

- React (function components + hooks)
- Plain CSS (custom properties / CSS variables for theming — no framework)
- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display serif), [Manrope](https://fonts.google.com/specimen/Manrope) (body), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (UI/mono accents), loaded via Google Fonts

## Files

| File | Purpose |
|---|---|
| `PrismveilPortfolio.jsx` | Main component — hero, gallery, about, skills, footer |
| `PrismveilPortfolio.css` | All styling, theming, and responsive breakpoints |

## Required Assets

The component references these paths — make sure they exist in your project's `public` folder (or equivalent static asset folder):

```
public/
├─ images/
│  ├─ Lololo.png     ← nav logo + favicon
│  └─ me.png         ← About section profile photo
└─ videos/
   ├─ Getting Sweeet with Sam.mp4   ← hero showreel
   ├─ BUSINESS.mp4
   ├─ FOR REELS-copy.mp4
   ├─ PERSONAL BRANDS.mp4
   └─ REELS.mp4
```

To change which videos appear in the gallery, edit the `PROJECTS` array at the top of `PrismveilPortfolio.jsx`:

```jsx
const PROJECTS = [
  { file: "BUSINESS.mp4", title: "Business", aspect: "9:16" },
  // add / remove / rename entries here
];
```

To change the skills bars, edit the `SKILLS` array the same way.

## Favicon

The favicon is set via a `<link rel="icon">` rendered inside the component (works automatically on **React 19+**, which hoists `<link>`/`<meta>`/`<title>` tags into `<head>`). If your setup isn't React 19, add this manually to `index.html` instead, inside `<head>`:

```html
<link rel="icon" type="image/png" href="/images/Lololo.png" />
```

## Notable Behavior

- **Custom video controls** — seek bar, volume, fullscreen, and time display are all custom-built (not the browser's native controls), styled to match the black-and-gold theme.
- **Mobile playback reliability** — videos on mobile can get silently paused or frozen by the browser (power saving, buffering stalls). This is handled with:
  - State that always reflects the video's real `play`/`pause` status
  - Auto-resume if a pause wasn't user-initiated
  - A watchdog that detects a frozen/stalled video and forces recovery
  - Auto-resume when the tab regains focus
- **Touch vs. hover** — gallery clips preview on hover on desktop; on touch devices, hover events are disabled to avoid conflicting with tap-to-play.
- **Fullscreen** — fullscreens the video's container (not the raw `<video>` element) so custom controls stay visible, except on iOS Safari, which only supports native fullscreen on `<video>` itself.

## Sections

1. **Nav** — logo only
2. **Hero** — headline, intro, and the showreel viewfinder
3. **Selected Work** — project gallery (9:16 clips + any 16:9 clips)
4. **About** — profile photo, bio, personal info card (Name / Age / Editing in), and the skills mixer

