# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**STATE** is a static Next.js portfolio website for a Tokyo-based interior renovation contractor. It uses MicroCMS as its headless CMS, with bundled demo data as a fallback when CMS credentials are not configured.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Static export to /out directory
npm run lint     # Run ESLint (next lint)
```

There is no test suite. TypeScript checking runs implicitly during build; to run it standalone:

```bash
npx tsc --noEmit
```

## Architecture

### Static Export

`next.config.js` sets `output: 'export'`, so this is a fully static site. `npm run build` produces the `/out` directory with plain HTML/CSS/JS — no Node.js server is needed to host it. As a consequence, Next.js Image optimization is disabled (`images: { unoptimized: true }`).

### Server / Client Component Split

The home route demonstrates the pattern used throughout:

- `app/page.tsx` — Server Component. Fetches Works and News from MicroCMS at build time and passes them as props.
- `app/HomeClient.tsx` — Client Component (`'use client'`). Owns all interactive state: modal open/close, mobile menu toggle, contact form fields.

Other pages (`/company`, `/recruit`) are entirely static Server Components with no data fetching. The news detail page (`/news/[id]/page.tsx`) uses `generateStaticParams()` to pre-render all article pages at build time.

### CMS Integration & Fallback

`lib/microcms.ts` is the single data layer. It reads two environment variables:

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`

If either is missing, or if the API call fails, every function silently returns the bundled `demoWorks` / `demoNews` arrays. This means the site builds and runs correctly with no CMS configuration.

**Content types:**
- `Work` — portfolio projects (title, category, location, area, duration, year, optional thumbnail)
- `NewsItem` — blog posts (title, body as HTML string, category, publishedAt)

### Styling Conventions

Tailwind CSS with a custom dark theme. Custom tokens defined in `tailwind.config.ts`:

| Token | Value |
|---|---|
| `bg` | `#0a0a0a` |
| `text` | `#f0ede8` |
| `accent` | `#4a7fc1` |
| `text-muted` | `#8a8580` |
| `border` | `#1e1e1e` |

Three font families are loaded in `app/layout.tsx` as CSS variables and referenced in Tailwind as `font-bebas`, `font-barlow`, and `font-noto`. Use `font-bebas` for headings/labels, `font-noto` for Japanese body copy.

CMS-rendered HTML (news article body) is displayed with `dangerouslySetInnerHTML` inside a `div` that carries the `.rich-text` class, which is styled in `app/globals.css`.

### Path Alias

`@/*` resolves to the repo root. Use `@/lib/microcms` (not relative paths) when importing from `lib/`.
