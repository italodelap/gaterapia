# Repository Guidelines

## Project Structure & Module Organization

This is an Astro site styled with Tailwind CSS. Route files live in `src/pages`, including the home page, RSS endpoint, and dynamic service pages under `src/pages/servicios`. Shared page shells are in `src/layouts`, reusable UI is in `src/components`, and page-specific sections are in `src/sections`. Service Markdown lives in `src/content/services`, with its schema in `src/content/config.ts`. Shared TypeScript helpers are in `src/lib`. Icons and global styles live in `src/assets`; static files such as favicons and manifests live in `public`.

## Build, Test, and Development Commands

- `pnpm dev` or `pnpm start`: run the Astro dev server at `localhost:4321`.
- `pnpm run build`: run `astro check` and build the production site to `dist/`.
- `pnpm run preview`: serve the built site locally for final verification.
- `pnpm run astro -- check`: run Astro diagnostics without producing a build.

There is no dedicated test script currently; use `pnpm run build` as the primary validation command.

## Coding Style & Naming Conventions

Use TypeScript and Astro components with strict Astro TS settings. Follow the existing tab indentation in config and source files. Prefer the `@/*` path alias when imports become long, for example `@/lib/data`. Name Astro components in PascalCase (`ServiceHeading.astro`) and utility modules in camelCase or descriptive lowercase (`navbar.ts`, `api.ts`). Keep Tailwind classes close to the markup and reuse shared components before duplicating section markup.

ESLint is configured through `eslint-config-codely/typescript`, but no lint script is defined. If adding one, keep it pnpm-based and document it here.

## Testing Guidelines

No test framework or coverage threshold is configured. For changes, run `pnpm run build` and manually inspect affected pages in `pnpm dev`. For content updates, verify frontmatter against `src/content/config.ts` and check `/servicios/<slug>`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits with scopes and optional emoji, such as `feat(services): ✨ create content for reiki` and `fix(Hero): 🐛 improve image aspect ratio`. Keep commits focused and use `feat`, `fix`, `chore`, or similar types with a meaningful scope.

Pull requests should include a short summary, affected routes or content files, validation performed, and screenshots for visible UI changes. Link related issues when available.

## Security & Configuration Tips

The canonical site URL and Vercel static adapter settings are in `astro.config.mjs`. Do not commit local secrets or deployment tokens. Keep public assets in `public` only when they are safe to serve directly.
