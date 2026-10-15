# Migración a Astro 7 + Tailwind 4 y mejoras de repo — Diseño

Fecha: 2026-10-01
Estado: pendiente de revisión del usuario

## 1. Objetivo y alcance

Llevar `gaterapia` de **Astro 4.5.16 a Astro 7.x** y de **Tailwind 3 a 4**, con el resto de las dependencias al día, replicando lo resuelto en `~/projects/italodelap.dev` (commits del 22 al 25 de agosto de 2026). Después, aplicar un conjunto acotado de mejoras de repo.

**Criterios de éxito**

- `pnpm build` (`astro check` + `astro build`) limpio en cada commit.
- Render sin regresiones: comparación de texto de `dist/` contra el baseline de la fase anterior, más revisión visual con Playwright en 375 px y 1280 px de `/`, `/servicios/reiki` y `/info-util`.
- Todas las rutas responden: `/`, `/servicios/*` (6), `/info-util`, `/rss.xml`, `/sitemap-index.xml`, `/sitemap-0.xml`, `/robots.txt`, y 404 en una ruta inexistente.
- Deploy verde en Vercel (pre-prod `dev` primero, luego `main`) y verificación en la URL real.

**Fuera de alcance (decidido por el usuario)**

- ESLint (queda como está; se anota qué rompe la migración, no se arregla).
- Accesibilidad (incluye el hover del navbar con teclado).
- Optimización de imágenes con `astro:assets`.
- `BaseHead` en `/info-util`.
- Rediseño.

## 2. Flujo de trabajo y entornos

El proyecto usa **git-flow**: `main` es producción y `dev` es pre-prod, el ambiente donde el cliente prueba antes de que algo salga a producción. Hoy `dev` y `main` apuntan al mismo commit (`2aced3e`).

- Las ramas de trabajo salen de `dev` (`chore/…`, `feat/…`, `fix/…`, `ci/…`, `docs/…`) y vuelven a `dev` por PR.
- `dev` se promueve a `main` con un PR.
- La CI corre `pnpm build` en PRs y push hacia `main` y `dev`.
- Commits: Conventional Commits con scope y emoji opcional, como en el historial.

## 3. Estado actual y objetivo

| | Hoy | Objetivo |
|---|---|---|
| astro | 4.5.16 | ^7.3.5 |
| tailwindcss | 3.4.1 + `@astrojs/tailwind` 5.1 | ^4.3.3 + `@tailwindcss/vite` |
| typescript | 5.3.3 | ^6.0.3 (techo: peer de `@astrojs/check`) |
| @astrojs/check | 0.4.1 | ^0.9.10 |
| @astrojs/rss / sitemap | 4.0.6 / 3.1.4 | ^4.0.19 / ^3.7.4 |
| @tailwindcss/typography | 0.5.12 | ^0.5.20 |
| fontsource (montserrat, caveat-brush) | 5.0.x | ^5.3.0 |
| adapter Vercel | `@astrojs/vercel` 7.5.3 (`/static`) | eliminado |
| analytics | `webAnalytics` del adapter | `@vercel/analytics` ^2.0.1 |
| Node | sin `engines` (Vercel 20.x) | `engines.node >=22.12.0` |
| pnpm | sin `packageManager` | `packageManager: pnpm@11.22.0` |

Notas de versiones:

- TypeScript 7.0.2 existe, pero `@astrojs/check@0.9.10` declara `typescript: ^5 || ^6`. Se usa 6.0.3.
- `@astrojs/upgrade` no se usa: subiría el adapter y `@astrojs/tailwind`, que se eliminan. Se instala a mano.
- Se usa `pnpm@11.22.0` porque ya está probado con Corepack en Vercel en `italodelap.dev`.

## 4. Parte 1 — Migración

Rama `chore/upgrade-astro-7` desde `dev`. Commits atómicos, un build verde en cada uno.

### Fase 0 — Baseline (sin commit)

```bash
pnpm install --frozen-lockfile && pnpm run build
cp -R .vercel/output/static "$SCRATCH/dist-baseline-v4"
```

El adapter actual escribe en `.vercel/output/static`, no en `dist/`. Se toma un baseline nuevo después de cada fase. `rss.xml` siempre difiere (`pubDate: new Date()`), y entre majors cambian los hashes de assets, así que el diff es de texto con whitespace normalizado, no un `diff -rq` crudo.

### Fase 1 — Tooling y estilos (todavía en Astro 4)

**C1** `chore(deps): 📌 pin packageManager, node engine and track pnpm-workspace`

- Commitear `pnpm-workspace.yaml` (hoy sin trackear) con `allowBuilds: { esbuild: true, sharp: true }`.
- `package.json`: `"packageManager": "pnpm@11.22.0"`, `"engines": { "node": ">=22.12.0" }`.
- Prerrequisito en Vercel: Corepack activado (`ENABLE_EXPERIMENTAL_COREPACK=1`) y Node subido. El usuario confirmó que ambos ya están hechos.

**C2** `refactor(analytics): ➖ replace @astrojs/vercel adapter with @vercel/analytics`

- `astro.config.mjs`: quitar el import del adapter y la opción `adapter`.
- `@vercel/analytics/astro`: `<Analytics />` en `<head>` de **`BaseHead.astro` y de `LinksLayout.astro`** (este layout no usa `BaseHead`; `webAnalytics` cubría ambas páginas).
- Sin adapter el build sale en `dist/` y Vercel sigue aplicando `cache-control: immutable` a `/_astro/*` (verificado en `italodelap.dev`).
- Verificación: diff de texto contra el baseline nulo, salvo el script de analytics. Nuevo baseline.

**C3** `feat(styles): ⬆️ upgrade Tailwind to v4`

- Eliminar `tailwind.config.mjs` y `@astrojs/tailwind`; agregar `tailwindcss`, `@tailwindcss/vite` y `vite: { plugins: [tailwindcss()] }` en la config.
- `src/assets/styles/global.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@custom-variant hover (&:hover);

@theme {
	--color-cerise-red-50: #fdf2f7;
	/* 100 a 950: valores tal cual del config actual */
	--color-cerise-red-950: #52051c;
}

html, body { min-height: 100vh; }
html { font-family: "Montserrat Variable", system-ui, sans-serif; }
```

- `@custom-variant hover (&:hover);` conserva el comportamiento v3 del hover en táctiles (afecta a `ItemButton.astro`); se revisa después junto con accesibilidad, fuera de este alcance.
- El `sans: ["Caveat Brush", …]` del config actual está fuera de `fontFamily` y nunca tuvo efecto: se descarta sin migrar (definir `--font-sans` cambiaría el render).
- Clases: `backdrop-blur-sm` → `backdrop-blur-xs` en `ItemButtonContainer.astro:3` (en v4 `-sm` pasó de 4 px a 8 px); quitar `border-1` en `ItemButton.astro:21` (en v3 no existía y no hacía nada). `bg-gradient-to-*` sigue funcionando (interpola en oklab, leve cambio de tono; renombrar es opcional).
- Riesgo: Tailwind 4 requiere Safari 16.4+, Chrome 111+, Firefox 128+.
- Verificación: diff de texto nulo contra el baseline de C2, más capturas con Playwright.

### Fase 2 — Astro 4 → 7

**C4** `chore(deps): ⬆️ upgrade astro to 7 and migrate required APIs`

Un solo commit, porque Astro 6 elimina las colecciones legacy y `<ViewTransitions />`.

- `src/content/config.ts` → `src/content.config.ts`:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const servicesCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
	schema: z.object({ title: z.string() }),
});
export const collections = { services: servicesCollection };
```

- `slug` → `id`: `pages/servicios/[...slug].astro` (líneas 14 y 22), `pages/rss.xml.js:14`, `lib/data.ts:26` (`({ id, data }) => ({ slug: id, ...data })`), `lib/types.d.ts:4`.
- `service.render()` → `render(service)` importado de `astro:content` (`[...slug].astro`).
- `<ViewTransitions />` → `<ClientRouter />` en `BaseHead.astro` y `LinksLayout.astro`.
- `astro.config.mjs`: `compressHTML: true` con `// TODO: adoptar el default 'jsx'` (se quita en C6).
- Fix de Lightning CSS en `Header.astro`: `animation: blur linear both; animation-timeline: scroll();` se minifica como `animation: linear both blur scroll()`, que Chrome descarta (mismo bug que `38f0cdf` en `italodelap.dev`). Se separa en `animation-name`, `animation-timing-function`, `animation-fill-mode` y `animation-timeline`.
- Dependencias de la tabla de la sección 3.
- Diferencias esperadas en `dist/`: el `generator`, el nombre del chunk CSS y los ids de headings con guion final (`nuestros-conocimientos-`, por el cambio de v6; no hay enlaces a esos anchors).
- Verificación manual: `navbar.ts` (escucha `astro:page-load`) con navegación `/` → `/servicios/x` → `/info-util` → `/`, y `getComputedStyle(header).animationName === "blur"` en el build de producción.

**C5** `refactor(config): 🔧 align config with astro 7`

- `tsconfig.json`: agregar `"include": [".astro/types.d.ts", "**/*"]` y `"exclude": ["dist"]`; quitar `baseUrl`.
- Eliminar `src/env.d.ts` (solo tenía las dos referencias que cubre el `include`).
- `// @ts-check` en `astro.config.mjs`.
- Quitar el script `start` (duplica `dev`).
- Verificación: `astro check` en 0 errores, diff vacío contra C4.

**C6** `refactor(whitespace): 🎨 adopt astro 7 jsx whitespace handling`

Quitar `compressHTML` y agregar `{" "}` donde se pierde el espacio (verificado con diff de texto):

- `HelloDescription.astro`: tras `floral</strong>`, `Hago`, `reiki</strong>,`, `y` y `ayudarte`.
- `HelloTitle.astro`: tras `Soy Juli`.
- `MadeBy.astro`: tras `by`.

En los demás componentes los nodos son hijos flex y el espacio no se ve. Verificación: diff de texto contra C5 y capturas.

**C7** `docs(AGENTS.md): 📝 update for astro 7`

Stack Astro 7 + Tailwind 4, colecciones con `content.config.ts` y `id`, modo background de `astro dev`/`astro preview` (`status`, `logs`, `stop`, `ASTRO_DEV_BACKGROUND=0`), whitespace `'jsx'`, procesador de Markdown Sätteri, analytics con `@vercel/analytics` en ambos layouts, y quitar `pnpm start`. La sección de git-flow y CI la agrega la Parte 2.

### Pasada final contra un template fresco

Ya ejecutada en el ensayo del scratchpad (`pnpm create astro@latest --template basics`, Astro 7.3.5). El scaffold confirma `engines >=22.12.0`, `tsconfig` con `include`/`exclude`, `// @ts-check` y `allowBuilds`. No se adopta `allowScripts` de `package.json`: con pnpm manda `allowBuilds`.

### Verificación de rutas

- Preview: `astro preview --background --port 4399`, `curl` a todas las rutas y `astro preview status`/`stop` al terminar. En 7.3.5 `/_astro/status` da 404 en preview (solo existe en dev).
- Dev: `astro dev --background` y la misma batería. No usar `pkill`.
- Manual: backdrop del navbar, navegación con `ClientRouter`, animación del header al hacer scroll y requests a `/_vercel/insights/*` (solo en deploy).
- Final: `astro --version`, `pnpm why @types/node`, `git diff dev --stat`, working tree limpio.

### Riesgos y su detección

- Otros shorthands `animation` con timeline: `grep -rn "animation:" src` (hoy solo `Header.astro`).
- Anidamiento HTML inválido con el compilador Rust: sin hallazgos en el grep.
- `@types/node` duplicado (20.11 y 24.19): `astro check` da 0 errores, así que no se agrega override salvo que reaparezca el error de `setInterval`.
- `/info-util` hace fetch a Google Sheets en build: si falla la red, el diff da falsos positivos.
- `pnpm@11.22.0` en Vercel: está probado en `italodelap.dev`; si el deploy falla en el install, revisar los logs antes de tocar nada.

## 5. Parte 2 — Mejoras extra

Se ejecutan **después** de la migración, cada una en su rama y PR a `dev`. Orden: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7.

### 2.1 CI (`ci/build-workflow`)

`.github/workflows/ci.yml`, job llamado `build` (es el nombre del check que se protege):

```yaml
name: CI
on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
      - name: Enable Corepack
        run: corepack enable
      - uses: actions/setup-node@v7
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build (astro check + astro build)
        run: pnpm build
```

- Node 24 es LTS activa y cumple `>=22.12`; no usar Node 25+, que ya no incluye Corepack. Alinear con la versión elegida en Vercel.
- Alternativa si falla Corepack: `pnpm/action-setup@v6`.
- Commit: `ci: 👷 add GitHub Actions workflow to run build on PRs`.

### 2.2 Higiene del repo

Un PR (o dos, `chore` y `docs`):

- `.gitignore`: agregar `.idea/`, `.vercel` y `.env*.local`.
- `CLAUDE.md` como symlink a `AGENTS.md` (`ln -s AGENTS.md CLAUDE.md`; modo git `120000`).
- `AGENTS.md`: sección `## Git workflow` con git-flow (`main` producción, `dev` pre-prod, ramas desde `dev`, promoción por PR, branch protection con el check `build`, CI en ambas ramas, deploys de Vercel) y actualizar "Testing Guidelines" con la CI.

### 2.3 Links externos robustos (`fix/links-csv`)

Hoy `src/lib/api.ts` hace `fetch` en build a un Google Sheet publicado (CSV), solo lo consume `src/pages/info-util.astro`, y tiene estos problemas:

- Las líneas del CSV real terminan en CRLF, así que cada `url` lleva un `\r` que hoy funciona por casualidad.
- Sin manejo de status ni timeout.
- Si Google devuelve 4xx/5xx o una página HTML de login, se publica basura sin error.
- `split(",")` se rompe con celdas con comas o comillas.

Diseño:

- Colección `links` con inline loader en `src/content.config.ts` (el loader `file()` no lee URLs remotas), validada con Zod (`z.url({ protocol: /^https?$/ })`).
- `src/lib/api.ts` → `src/lib/links.ts` con `fetchLinks()` y un parser CSV propio mínimo (RFC 4180, unas 20 líneas) en lugar de una dependencia.
- `fetchLinks()` usa `AbortSignal.timeout(10_000)`, valida `res.ok` y `content-type: text/csv`, recorta espacios, ignora filas totalmente vacías y falla si la hoja no tiene filas.
- `info-util.astro` usa `getCollection("links")` ordenado por `order`; `Link` en `types.d.ts` se reemplaza por `CollectionEntry<"links">["data"]`.
- Política de fallback: **fallar el build con mensaje claro** (prefijo `[links]`). Como el sitio es estático, Vercel conserva el deploy anterior como "último dato bueno". No se publican datos vacíos.
- Verificación: `dist/info-util/index.html` con 21 links y sin `\r`; forzar un 404 y un host inexistente y comprobar que el build falla con el mensaje `[links]`.
- Riesgo: un fallo puntual de Google rompe también la CI (basta re-ejecutarla). `astro check` puede correr el loader dos veces por build (no verificado).
- Commits: `refactor(links): ♻️ load links from Google Sheet via content layer` y `fix(links): 🐛 parse CSV robustly and fail build on invalid data`.

Hoy la lista solo se actualiza al redeployar. Un Deploy Hook de Vercel para publicar al cambiar la hoja queda fuera de alcance.

### 2.4 Metas legacy (`chore/head-cleanup`)

- Eliminar `<meta http-equiv="X-UA-Compatible" content="IE=edge" />` de `BaseHead.astro`.
- Eliminar la línea `apple-touch-icon` duplicada y dejar la de `sizes="180x180"`.
- No se tocan `msapplication-TileColor`, `mask-icon` ni `theme-color` (inocuos o decisión de diseño).
- Commit: `chore(BaseHead): 🔥 remove obsolete X-UA-Compatible meta`.
- Verificación: `grep -c X-UA-Compatible` en `dist/` da 0.

### 2.5 robots.txt (`fix/robots-sitemap-url`)

`public/robots.txt` apunta el sitemap a `https://gaterapia.com/...` mientras `site` es `https://www.gaterapia.com`. Se reemplaza por `src/pages/robots.txt.ts` con `new URL("/sitemap-index.xml", site)`, como en `italodelap.dev`. Se elimina `public/robots.txt`. Verificación: `/robots.txt` en preview devuelve la URL con `www`.

### 2.6 og:image correcta (`feat/og-image`)

Problemas en `BaseHead.astro`: `og:image` y `twitter:image` son rutas relativas, la imagen es un isotipo cuadrado de 800×800 con `summary_large_image`, las metas `twitter:*` usan `property` en lugar de `name`, `twitter:url` no existe como etiqueta, y falta `og:site_name`.

Cambios:

- Prop `image?: { src; alt; width; height }` con default `/og/gaterapia-og.jpg`, 1200×630, y alt "Gaterapia: terapias para animales y personas"; `Layout.astro` la acepta y la pasa.
- URL absoluta con `new URL(image.src, Astro.site)`; metas `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:site_name`, `og:url={canonicalURL}`.
- Twitter con `name=`: `twitter:card`, `twitter:image`, `twitter:image:alt`; eliminar `twitter:url`.
- `og:locale` de `es_ES` a `es_AR`.
- Una imagen global primero; imágenes por servicio quedan para después (las de `public/services/` son cuadradas).
- **Necesita del usuario**: un asset de 1200×630 en JPG o PNG, de menos de ~300 KB, en `public/og/gaterapia-og.jpg`. WebP está soportado desde fines de 2024 por los principales scrapers, pero la documentación oficial de Facebook solo lista JPEG, PNG y GIF, así que se prefiere JPG o PNG. Alternativa: componer logo o isotipo sobre el rosa de marca `#E1306C` con la foto del hero.
- Verificación: `grep -E 'og:|twitter:' dist/index.html` con URLs que empiezan por `https://www.gaterapia.com/`; después del deploy, Facebook Sharing Debugger, LinkedIn Post Inspector y una prueba real en WhatsApp. Los previews de Vercel con SSO no son accesibles para los scrapers, solo producción o un preview público.
- Commits: `feat(seo): ✨ use absolute 1200x630 og:image with dimensions and alt` y `fix(seo): 🐛 set og:locale to es_AR and use name attr for twitter tags`.
- Conflicto con 2.4 y con C2/C4 de la migración (mismo archivo): se resuelve por el orden de ejecución.

### 2.7 README (`docs/readme`)

Reescribir el README con el stack real, en inglés y con emojis como el actual: requisitos (Node >=22.12, pnpm vía `packageManager` y `corepack enable`), tabla de comandos sin `pnpm start`, estructura (`src/pages`, `src/content/services`, `src/layouts`, `src/components`, `src/sections`, `src/lib`, `public`), nota de que los links de `/info-util` vienen de un Google Sheet en build, deploy en Vercel y CI, y tech stack (Astro 7, TypeScript, Tailwind 4 con `@tailwindcss/vite`, `@astrojs/sitemap` y `@astrojs/rss`). Se quita la mención a React y a la integración de Tailwind, y a ESLint hasta que exista un script. Va al final porque refleja el resultado de 2.1, 2.3 y la migración. Commit: `docs(README): 📝 update tech stack, requirements and deploy info`.

## 6. Acciones manuales del usuario

| Acción | Estado |
|---|---|
| Activar `ENABLE_EXPERIMENTAL_COREPACK=1` en Vercel | Hecho |
| Subir Node en Vercel (hoy el proyecto tenía 20.x) | Hecho |
| Confirmar que el framework preset sigue en "Astro" con output `dist` (sin adapter ya no existe `.vercel/output`) | Pendiente, antes del merge de C2 |
| Pre-prod para el cliente: URL estable para la rama `dev` (por ejemplo un subdominio) y quitar la protección SSO de ese entorno | Pendiente, antes de que el cliente pruebe |
| Branch protection en `main` y `dev` (PR requerido, check `build`, sin force-push ni borrado) | Pendiente, después de mergear 2.1 y de que el check haya corrido una vez |
| Entregar el asset `og:image` de 1200×630 | Pendiente, para 2.6 |
| Verificar el deploy verde y `cache-control: immutable` en `/_astro/*` en producción | Después de cada promoción a `main` |

## 7. Orden global

1. Spec aprobado y plan de implementación.
2. Parte 1 (C1 a C7) en `chore/upgrade-astro-7` → PR a `dev` → validar en pre-prod → PR de `dev` a `main`.
3. Parte 2 (2.1 a 2.7), cada una por PR a `dev`, promoviendo a `main` según el criterio del usuario.

## 8. Fuentes

- https://docs.astro.build/en/guides/upgrade-to/v5/, /v6/ y /v7/
- https://docs.astro.build/en/guides/integrations-guide/vercel/
- https://docs.astro.build/en/reference/content-loader-reference/
- https://tailwindcss.com/docs/upgrade-guide
- https://developers.facebook.com/docs/sharing/webmasters/images/
- Repo `italodelap.dev`: commits `15beaee`, `1156633`, `8245f90`, `77a18b1`, `d9fe711`, `5a89620`, `45a4b22`, `8913ba0`, `725cf68`, `38f0cdf`, `834eea0`, `a9d04cd`.
- Ensayo de migración completo en el scratchpad de la sesión (Astro 7.3.5, Tailwind 4.3.3, TypeScript 6.0.3: `astro check` en 0 errores y build limpio).
