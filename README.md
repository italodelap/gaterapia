<h1 align="center">
  🌻 Gaterapia
</h1>

<p align="center">
  Gaterapia's website (<a href="https://www.gaterapia.com">gaterapia.com</a>) built with Astro and Tailwind CSS ⚛️
</p>

## 📋 Requirements

- Node.js `>=22.12` (see `engines` in `package.json`)
- pnpm (version pinned via `packageManager`; run `corepack enable`)

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command          | Action                                              |
| :--------------- | :-------------------------------------------------- |
| `pnpm install`   | Installs dependencies                               |
| `pnpm dev`       | Starts local dev server at `localhost:4321`         |
| `pnpm build`     | Type-checks (`astro check`) and builds to `./dist/` |
| `pnpm preview`   | Previews the production build locally               |
| `pnpm test`      | Runs the unit tests once with Vitest                |
| `pnpm astro ...` | Runs Astro CLI commands, like `astro check`         |

## 🗂️ Structure

- `src/pages`: routes (`/`, `/servicios/[slug]`, `/info-util`, `/rss.xml`, `/robots.txt`)
- `src/content/services`: Markdown for each service (collection defined in `src/content.config.ts`)
- `src/layouts`, `src/components`, `src/sections`: page shells and UI
- `src/lib`: shared helpers
- `public`: static assets (favicons, images, manifest)

The links on `/info-util` are fetched at build time from a published Google Sheet (CSV); the build fails if the sheet is unreachable or contains invalid data.

## 🚀 Deploy & CI

- Static site deployed on Vercel: `main` is production and `dev` is the pre-production environment.
- GitHub Actions runs `pnpm build` on every PR and push to `main` and `dev`.

## 🌈 Tech Stack

- [Astro](https://astro.build/) 7
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite) v4 via `@tailwindcss/vite`, plus `@tailwindcss/typography`
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) and [`@astrojs/rss`](https://docs.astro.build/en/recipes/rss/)
- [Vercel Web Analytics](https://vercel.com/docs/analytics)
