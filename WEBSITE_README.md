# Buddy website

The canonical static website lives in `Buddy website/` so it can be moved into a dedicated GitHub Pages repository later without changing the app project:

- `index.html` — landing page, Try Buddy demo, pricing, releases, and About page
- `styles.css` — responsive Buddy UI and app preview styling
- `app.js` — navigation, 10-message local chat demo, voice mode, and deployment config
- `assets/buddy-mark.png` — Buddy artwork copied from the desktop app

Keep the folder together when previewing or deploying it. The desktop app source remains outside this folder.

## GitHub Pages

For GitHub Pages, either use `Buddy website/` as the root of the Pages repository or copy its contents into the root of a dedicated site repository. Because this is plain HTML/CSS/JS, no install or build command is needed.

If the repository is deployed as a project site, change `SITE_CONFIG.BASE_PATH` near the top of `app.js` to the repository path (for example `"/Buddy"`). A custom domain can use an empty base path. The public GitHub and future-domain values are kept in that same config object for an easy later switch.

## Demo behavior

The Try Buddy page is intentionally a front-end preview: it has a hard limit of 10 user messages, uses local sample replies, and supports browser speech recognition/speech synthesis when available. Connecting the real Buddy backend later only requires replacing `sendMessage()` in `app.js` with the API call while keeping the same UI and limit guard.
