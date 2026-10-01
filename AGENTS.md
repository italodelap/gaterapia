# Repository Guidelines

## Project Structure & Module Organization

This is an Astro 7 static site styled with Tailwind CSS v4. Route files live in `src/pages`, including the home page, RSS endpoint, and dynamic service pages under `src/pages/servicios`. Shared page shells are in `src/layouts`, reusable UI is in `src/components`, and page-specific sections are in `src/sections`. Service Markdown lives in `src/content/services`, with its collection defined in `src/content.config.ts` (`glob` loader, entries are identified by `id`). Shared TypeScript helpers are in `src/lib`. Icons and global styles live in `src/assets`; static files such as favicons and manifests live in `public`.

## Build, Test, and Development Commands

- `pnpm dev`: run the Astro dev server at `localhost:4321`.
- `pnpm run build`: run `astro check` and build the production site to `dist/`.
- `pnpm run preview`: serve the built site locally for final verification.
- `pnpm run astro -- check`: run Astro diagnostics without producing a build.

Requirements: Node `>=22.12.0` and pnpm `11.22.0` (pinned via `packageManager`; run `corepack enable`).

There is no dedicated test script currently; use `pnpm run build` as the primary validation command.

### Background dev server (AI agents)

Astro 7 starts `astro dev` (and, since 7.2, `astro preview`) as a detached **background** process when it detects an AI coding agent, and writes a lock file (`.astro/dev.json` or `.astro/preview.json`) with the server URL, port and PID. Manage it with:

```bash
astro dev status           # is a server running, and its URL/PID/uptime
astro dev logs [--follow]  # logs from the background server
astro dev stop             # SIGTERM, escalating to SIGKILL after 5s
```

The same subcommands exist for `astro preview`. In dev, `/_astro/status` returns `{"ok": true}` when ready; in preview use `astro preview status`. To opt out of background mode set `ASTRO_DEV_BACKGROUND=0` / `ASTRO_PREVIEW_BACKGROUND=0`.

## Coding Style & Naming Conventions

Use TypeScript and Astro components with strict Astro TS settings. Follow the existing tab indentation in config and source files. Prefer the `@/*` path alias when imports become long, for example `@/lib/data`. Name Astro components in PascalCase (`ServiceHeading.astro`) and utility modules in camelCase or descriptive lowercase (`navbar.ts`, `api.ts`). Keep Tailwind classes close to the markup and reuse shared components before duplicating section markup.

Tailwind v4 is configured in CSS (`src/assets/styles/global.css`: `@theme` for the `cerise-red` palette, `@plugin` for typography) through `@tailwindcss/vite`; there is no `tailwind.config.mjs`. The `hover` variant is overridden with `@custom-variant hover (&:hover);` to keep the Tailwind 3 behavior on touch devices.

Whitespace between inline elements: `compressHTML` uses Astro 7's default (`'jsx'`), so a line break between text and an inline element removes the space entirely. Add `{" "}` on the line that needs the space (see `HelloDescription.astro`, `HelloTitle.astro`, `MadeBy.astro`) and check the result visually.

Markdown renders with Astro's built-in Sätteri processor (the default since Astro 7), not remark/rehype. Heading ids end with a hyphen when the heading ends in an emoji.

Analytics uses `@vercel/analytics/astro` (`<Analytics />`) in both `BaseHead.astro` and `LinksLayout.astro`; there is no Vercel adapter because the site is fully static.

CSS minifier note: avoid the `animation` shorthand together with `animation-timeline`; Lightning CSS merges them into a shorthand Chrome rejects. Use longhand properties (see `Header.astro`).

ESLint is configured through `eslint-config-codely/typescript`, but no lint script is defined and the setup is outdated (ESLint 8). If adding one, keep it pnpm-based and document it here.

## Testing Guidelines

No test framework or coverage threshold is configured. For changes, run `pnpm run build` and manually inspect affected pages in `pnpm dev`. For content updates, verify frontmatter against `src/content.config.ts` and check `/servicios/<slug>`. CI runs `pnpm run build` on every PR.

## Git Workflow

This project follows **git-flow**: `main` is production and `dev` is the pre-production environment where the client reviews changes before they go live. Short-lived branches (`feat/x`, `fix/x`, `chore/x`, `ci/x`, `docs/x`) branch off `dev` and merge back into `dev` via PR; `dev` is promoted to `main` via PR.

- **Branch protection** (`main` and `dev`): PR required to merge, the `build` status check must pass, force-pushes and deletion are disabled.
- **CI** (`.github/workflows/ci.yml`): runs `pnpm build` on every PR and push targeting `main` or `dev`.
- **Deploys**: Vercel auto-deploys `main` to production and `dev` to the pre-production URL, and creates a preview per branch/PR.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits with scopes and optional emoji, such as `feat(services): ✨ create content for reiki` and `fix(Hero): 🐛 improve image aspect ratio`. Keep commits focused and use `feat`, `fix`, `chore`, or similar types with a meaningful scope.

Pull requests should include a short summary, affected routes or content files, validation performed, and screenshots for visible UI changes. Link related issues when available.

## Security & Configuration Tips

The canonical site URL is in `astro.config.mjs`. Do not commit local secrets or deployment tokens. Keep public assets in `public` only when they are safe to serve directly.

## Documentation

Full documentation: https://docs.astro.build. Astro also runs an MCP server with real-time access to current docs at `https://mcp.docs.astro.build/mcp`; prefer it over training data for anything API-related.
