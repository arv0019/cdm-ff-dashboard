# OPEX Dashboard

*Last updated: Aug 15, 2026 (Central US)*

## Structure

```
cdm-ff-dashboard/
├── index.html          → personal dashboard (Fighting TBDs) — loads at the site root
├── league.html          → shared dashboard for all league owners (placeholder for now)
├── assets/
│   ├── styles.css       → shared design system — colors, fonts, card/table/chart styling
│   └── models.js        → shared logic — win-probability math, market/network lookup
└── README.md            → this file
```

## Why split this way

`index.html` and `league.html` will share most of their visual language (dark
console theme, Big Shoulders Display + IBM Plex fonts) and some logic (win
probability model, DFW/Houston/OKC/Waco broadcast lookup). Keeping that in
`/assets` means a fix or tweak — like a font-size adjustment — only has to
happen once, instead of drifting apart across two copy-pasted files.

`index.html` is the personal Fighting TBDs console and deliberately sits at
the bare site root (shortest URL: `yourusername.github.io/cdm-ff-dashboard/`)
since that's the primary use case. `league.html` is a placeholder for the
all-owners view — swap which one is `index.html` if that priority flips
later (just rename the files and fix the two `site-nav` links).

## assets/models.js — what's reusable vs. page-specific

`models.js` only contains **DOM-independent** logic: the win-probability math
(`POSITION_VARIANCE`, `erf`, `normalCDF`, `teamStats`, `winProbability`) and
the market/network lookup table + `applyMarketTags()`. It doesn't know about
any specific page's dropdown IDs or score elements.

Each page's own inline `<script>` block handles the DOM-specific parts:
sample/real player data, writing computed values into that page's specific
elements, and wrapping `applyMarketTags()` with a `renderMarket()` that syncs
that page's own `<select>` elements. See `index.html`'s inline script for the
pattern to copy when building out `league.html`.

## Updating

See `github-pages-setup.md` (kept alongside this repo, not committed to it)
for the full publishing workflow, including the optional Claude Code
push-based workflow and ESPN credential-safety notes.

## Change log

- Aug 15, 2026 — Confirmed repo name: `cdm-ff-dashboard`. Updated example
  URLs in this README accordingly.
- Aug 15, 2026 — Restructured into `index.html` / `league.html` / `assets/`
  from a single-file dashboard, ahead of building out the league-wide view.
