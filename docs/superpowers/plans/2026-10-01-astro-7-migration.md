# Migración a Astro 7 + Tailwind 4 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar `gaterapia` de Astro 4.5.16 a Astro 7.3.x y de Tailwind 3 a 4, con el resto de las dependencias al día, sin cambios visibles en el sitio.

**Architecture:** Siete commits atómicos en la rama `chore/upgrade-astro-7`, cada uno con `pnpm build` verde. Primero tooling y estilos sobre Astro 4 (C1 a C3), después el salto de Astro (C4), después alineación de config (C5), whitespace `'jsx'` (C6) y docs (C7). Cada fase se verifica comparando el texto de la salida del build contra el baseline de la fase anterior con un script (`compare-dist.mjs`).

**Tech Stack:** Astro 7.3.5, Tailwind CSS 4.3.3 (`@tailwindcss/vite`), TypeScript 6.0.3, pnpm 11.22.0, Node >=22.12, Vercel (`@vercel/analytics`).

**Spec:** `docs/superpowers/specs/2026-10-01-astro-7-migration-and-improvements-design.md` (sección 4, Parte 1). El plan de las mejoras extra es `docs/superpowers/plans/2026-10-01-repo-improvements.md` y se ejecuta **después** de este.

## Global Constraints

- `engines.node`: `>=22.12.0`.
- `packageManager`: `pnpm@11.22.0` (no `12.8.1`).
- TypeScript `^6.0.3` (no 7: `@astrojs/check@0.9.10` declara `typescript: ^5.0.0 || ^6.0.0`).
- Se elimina `@astrojs/vercel` y `@astrojs/tailwind`. No se usa `pnpm dlx @astrojs/upgrade`.
- Analytics: `@vercel/analytics/astro` (`<Analytics />`) en **`BaseHead.astro` y `LinksLayout.astro`**.
- Commits: Conventional Commits con scope y emoji opcional (`feat(services): ✨ …`), en la rama `chore/upgrade-astro-7`, PR a `dev`. Cada commit termina con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Indentación: tabs en archivos `.mjs`, `.ts` y `.css` nuevos o editados, como el código existente de `src/lib` y la config; los `.astro` que ya usan 2 espacios los conservan.
- Fuera de alcance: ESLint (no se toca ni se arregla), accesibilidad, `astro:assets`, `BaseHead` en `/info-util`, rediseño.
- Los slugs de las URLs de `/servicios/*` no pueden cambiar: `reiki`, `catsitting`, `comunicacion-animal`, `registros-akashicos`, `terapia-floral-animales`, `terapia-floral-personas`.
- Los previews de Vercel pueden pedir login; la verificación en deploy se hace en la URL de `dev` configurada por el usuario.

## Review Focus

1. **Las 6 URLs de `/servicios/<slug>` siguen existiendo con el mismo slug** tras pasar de `entry.slug` a `entry.id` (el loader `glob` genera el `id` desde el nombre de archivo). Lo cubre la comparación de listado de archivos de `compare-dist.mjs` en C4 (cualquier `ONLY IN BASELINE` es un fallo).
2. **El header con `animation-timeline: scroll()` se rompe solo en el build de producción** (Lightning CSS), no en dev. Se verifica con `getComputedStyle` sobre el build, no con dev (C4).
3. **`navbar.ts` pierde sus listeners tras navegar con `ClientRouter`**: se prueba con navegación `/` → `/servicios/reiki` → `/info-util` → `/` y hover en el navbar (C4).
4. **Espacios perdidos por `compressHTML: 'jsx'` que no se ven en el diff de estructura** (texto pegado "floral(de"): el diff de texto de C6 más una revisión visual de `/` en 375 px y 1280 px.
5. **El build de Vercel falla en el install aunque el local pase** (pnpm 9 por heurística, o Node viejo): se verifica con el deploy real de `dev` antes del PR a `main` (Task 8).

---

## Convenciones de verificación (usadas en todas las tareas)

- `SCRATCH` es un directorio fuera del repo (por ejemplo el scratchpad de la sesión). Cada bloque de comandos que lo use debe empezar con `export SCRATCH=<ruta>`, porque el estado del shell no persiste entre llamadas.
- Baselines: `$SCRATCH/baselines/<nombre>` (copia de la salida del build).
- Comparación: `node $SCRATCH/tools/compare-dist.mjs <baseline> <nueva-salida>`. Sale con código 0 y `NO DIFFERENCES` si no hay diferencias; si las hay, imprime `ONLY IN BASELINE/NEW` y un `diff -u` por archivo. Ignora nombres con hash de `_astro/`, la meta `generator`, los `<pubDate>` del RSS y el whitespace.
- Salida del build: hasta C2 está en `.vercel/output/static` (la escribe el adapter); desde C2 está en `dist/`.
- Rutas de la batería de preview (`ROUTES`): `/`, `/servicios/catsitting`, `/servicios/comunicacion-animal`, `/servicios/registros-akashicos`, `/servicios/reiki`, `/servicios/terapia-floral-animales`, `/servicios/terapia-floral-personas`, `/info-util`, `/rss.xml`, `/sitemap-index.xml`, `/sitemap-0.xml`, `/robots.txt` (esperan 200) y `/nope` (espera 404).

---

### Task 0: Rama, herramientas y baseline

**Files:**
- Create (fuera del repo): `$SCRATCH/tools/compare-dist.mjs`
- Create (fuera del repo): `$SCRATCH/baselines/v4`

**Interfaces:**
- Produces: la rama `chore/upgrade-astro-7`, el script `compare-dist.mjs` y el baseline `v4`, que consumen las tareas siguientes.

- [ ] **Step 1: Crear la rama desde `dev`**

El spec y los planes viven en la rama `docs/astro-7-migration-spec`. Si ya se mergeó a `dev`, se parte de `dev`; si no, de esa rama (los docs no afectan al build).

```bash
cd /Users/italodelap/projects/gaterapia
git status --short
git branch --contains bb2c531 --list dev docs/astro-7-migration-spec
```

Expected: `?? pnpm-workspace.yaml` como único cambio sin trackear. Si `dev` aparece en la salida del segundo comando, ejecutar `git switch -c chore/upgrade-astro-7 dev`; si no, `git switch -c chore/upgrade-astro-7 docs/astro-7-migration-spec`.

- [ ] **Step 2: Crear el script de comparación**

Crear `$SCRATCH/tools/compare-dist.mjs` (directorio `tools` dentro de `$SCRATCH`) con este contenido exacto:

```js
#!/usr/bin/env node
// usage: node compare-dist.mjs <baselineDir> <newDir>
// Compares two build outputs ignoring hashed asset names, the generator meta,
// <pubDate> values and whitespace. Exit code 0 = no differences.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const [baseDir, newDir] = process.argv.slice(2);
if (!baseDir || !newDir) {
	console.error("usage: compare-dist.mjs <baselineDir> <newDir>");
	process.exit(2);
}

const walk = (root, dir = root) =>
	readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		return statSync(full).isDirectory() ? walk(root, full) : [relative(root, full)];
	});

const isHashed = (file) => file.startsWith("_astro/") || file.startsWith("_vercel/");
const isText = (file) => /\.(html|xml|txt|json|webmanifest)$/.test(file);

const normalize = (text) =>
	text
		.replace(/<meta name="generator"[^>]*>/g, "")
		.replace(/<pubDate>[^<]*<\/pubDate>/g, "<pubDate>X</pubDate>")
		.replace(/\/_astro\/[^"'\s)<]+/g, "/_astro/X")
		.replace(/\s+/g, " ")
		.replace(/></g, ">\n<")
		.trim() + "\n";

const baseFiles = walk(baseDir).filter((f) => !isHashed(f));
const newFiles = walk(newDir).filter((f) => !isHashed(f));
let differences = 0;

for (const file of baseFiles.filter((f) => !newFiles.includes(f))) {
	console.log(`ONLY IN BASELINE: ${file}`);
	differences++;
}
for (const file of newFiles.filter((f) => !baseFiles.includes(f))) {
	console.log(`ONLY IN NEW: ${file}`);
	differences++;
}

const tmp = mkdtempSync(join(tmpdir(), "compare-dist-"));
for (const file of baseFiles.filter((f) => newFiles.includes(f) && isText(f))) {
	const a = normalize(readFileSync(join(baseDir, file), "utf8"));
	const b = normalize(readFileSync(join(newDir, file), "utf8"));
	if (a === b) continue;
	differences++;
	writeFileSync(join(tmp, "a"), a);
	writeFileSync(join(tmp, "b"), b);
	console.log(`\n=== DIFF: ${file}`);
	console.log(spawnSync("diff", ["-u", join(tmp, "a"), join(tmp, "b")], { encoding: "utf8" }).stdout);
}

console.log(differences === 0 ? "NO DIFFERENCES" : `\n${differences} file(s) differ`);
process.exit(differences === 0 ? 0 : 1);
```

- [ ] **Step 3: Probar el script con un caso conocido**

```bash
export SCRATCH=<ruta>
mkdir -p $SCRATCH/t/a/x $SCRATCH/t/b/x
printf '<p>Hola\n <b>x</b></p><meta name="generator" content="Astro 4">' > $SCRATCH/t/a/x/index.html
printf '<p>Hola <b>x</b></p>\n<meta name="generator" content="Astro 7">' > $SCRATCH/t/b/x/index.html
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/t/a $SCRATCH/t/b; echo "exit=$?"
printf '<p>Hola<b>x</b></p>' > $SCRATCH/t/b/x/index.html
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/t/a $SCRATCH/t/b; echo "exit=$?"
rm -rf $SCRATCH/t
```

Expected: la primera ejecución imprime `NO DIFFERENCES` y `exit=0`; la segunda muestra un `diff` con `-<p>Hola <b>x</b>` / `+<p>Hola<b>x</b>` y `exit=1`.

- [ ] **Step 4: Tomar el baseline v4**

```bash
export SCRATCH=<ruta>
cd /Users/italodelap/projects/gaterapia
pnpm install --frozen-lockfile
pnpm run build
mkdir -p $SCRATCH/baselines && rm -rf $SCRATCH/baselines/v4
cp -R .vercel/output/static $SCRATCH/baselines/v4
ls $SCRATCH/baselines/v4/servicios
```

Expected: el build termina sin errores y `ls` lista 6 carpetas: `catsitting`, `comunicacion-animal`, `registros-akashicos`, `reiki`, `terapia-floral-animales`, `terapia-floral-personas`. No hay commit en esta tarea.

---

### Task 1: C1 — `packageManager`, `engines` y `pnpm-workspace.yaml`

**Files:**
- Modify: `package.json`
- Create (trackear): `pnpm-workspace.yaml` (ya existe sin trackear)

**Interfaces:**
- Produces: `packageManager: pnpm@11.22.0` y `engines.node: >=22.12.0`, que la CI de las mejoras (plan 2) consume.

- [ ] **Step 1: Agregar los campos a `package.json`**

Insertar después de `"version": "0.0.1",`:

```json
  "packageManager": "pnpm@11.22.0",
  "engines": {
    "node": ">=22.12.0"
  },
```

- [ ] **Step 2: Verificar que pnpm usa la versión fijada**

```bash
cd /Users/italodelap/projects/gaterapia
pnpm -v
cat pnpm-workspace.yaml
```

Expected: `11.22.0` (pnpm cambia a la versión de `packageManager` por sí solo; si imprime otra versión, ejecutar `corepack enable` y repetir) y el contenido `allowBuilds:` con `esbuild: true` y `sharp: true`.

- [ ] **Step 3: Verificar install y build**

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Expected: ambos terminan sin errores. Si `--frozen-lockfile` falla por diferencias de formato del lockfile con pnpm 11, ejecutar `pnpm install`, revisar con `git diff --stat pnpm-lock.yaml` que solo cambió metadata de formato y agregar `pnpm-lock.yaml` al commit.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml
git commit -m "$(cat <<'EOF'
chore(deps): 📌 pin packageManager, node engine and track pnpm-workspace

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: C2 — Reemplazar el adapter de Vercel por `@vercel/analytics`

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/components/BaseHead.astro`
- Modify: `src/layouts/LinksLayout.astro`
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:**
- Consumes: baseline `v4` de Task 0.
- Produces: build en `dist/` (ya no en `.vercel/output/static`); baseline `c2` copiado de `dist/`.

- [ ] **Step 1: Cambiar dependencias**

```bash
cd /Users/italodelap/projects/gaterapia
pnpm remove @astrojs/vercel
pnpm add @vercel/analytics@^2.0.1
```

Expected: `package.json` ya no tiene `@astrojs/vercel` y tiene `"@vercel/analytics": "^2.0.1"`.

- [ ] **Step 2: Editar `astro.config.mjs`**

Reemplazar todo el contenido por (todavía con la integración de Tailwind, que sale en C3):

```js
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://www.gaterapia.com",
	integrations: [tailwind(), sitemap()],
});
```

- [ ] **Step 3: Agregar `<Analytics />` en `BaseHead.astro`**

En el frontmatter, después de `import { ViewTransitions } from "astro:transitions";`, agregar:

```astro
import Analytics from "@vercel/analytics/astro";
```

Y justo antes de `<ViewTransitions />` (última línea de `<head>`), agregar:

```astro
  <Analytics />
```

- [ ] **Step 4: Agregar `<Analytics />` en `LinksLayout.astro`**

Este layout no usa `BaseHead`. Después de `import { ViewTransitions } from "astro:transitions";` agregar:

```astro
import Analytics from "@vercel/analytics/astro";
```

Y justo antes de `<ViewTransitions />` agregar (con tabs, como el resto del archivo):

```astro
		<Analytics />
```

- [ ] **Step 5: Build y verificar la nueva salida**

```bash
export SCRATCH=<ruta>
pnpm run build
ls dist/servicios
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/v4 dist
```

Expected: build sin errores, `dist/` con las 6 carpetas de servicios. La comparación solo puede mostrar diferencias en el script de analytics inyectado (`/_vercel/insights/script.js` o el custom element de `@vercel/analytics`) en `index.html`, `servicios/*/index.html` e `info-util/index.html`, y nada más. Cualquier otra diferencia es un fallo a investigar antes de continuar.

- [ ] **Step 6: Verificar que ambas páginas tienen Analytics**

```bash
grep -l "vercel" dist/index.html dist/info-util/index.html
```

Expected: ambos archivos listados. Si falta `info-util`, revisar el Step 4.

- [ ] **Step 7: Guardar baseline y commit**

```bash
export SCRATCH=<ruta>
rm -rf $SCRATCH/baselines/c2 && cp -R dist $SCRATCH/baselines/c2
git add astro.config.mjs src/components/BaseHead.astro src/layouts/LinksLayout.astro package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
refactor(analytics): ➖ replace @astrojs/vercel adapter with @vercel/analytics

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: C3 — Tailwind 4

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/assets/styles/global.css`
- Modify: `src/sections/home/services/ServicesBentoItem/ItemButtonContainer.astro:3`
- Modify: `src/sections/home/services/ServicesBentoItem/ItemButton.astro:21`
- Delete: `tailwind.config.mjs`
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:**
- Consumes: baseline `c2`.
- Produces: baseline `c3`; la config de Tailwind vive en `src/assets/styles/global.css` (`@theme`, `@plugin`, `@custom-variant`).

- [ ] **Step 1: Cambiar dependencias**

```bash
cd /Users/italodelap/projects/gaterapia
pnpm remove @astrojs/tailwind
pnpm add tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3
pnpm add -D @tailwindcss/typography@^0.5.20
```

- [ ] **Step 2: Reemplazar `astro.config.mjs`**

```js
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://www.gaterapia.com",
	integrations: [sitemap()],
	vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Reemplazar `src/assets/styles/global.css`**

Hoy contiene solo estas dos líneas (`html, body { min-height: 100vh; }` y la regla de `font-family`). Nuevo contenido completo:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@custom-variant hover (&:hover);

@theme {
	--color-cerise-red-50: #fdf2f7;
	--color-cerise-red-100: #fce7f1;
	--color-cerise-red-200: #fccee3;
	--color-cerise-red-300: #fba6cb;
	--color-cerise-red-400: #f76fa8;
	--color-cerise-red-500: #f04487;
	--color-cerise-red-600: #e1306c;
	--color-cerise-red-700: #c2144a;
	--color-cerise-red-800: #a0143d;
	--color-cerise-red-900: #851637;
	--color-cerise-red-950: #52051c;
}

html, body { min-height: 100vh; }
html { font-family: "Montserrat Variable", system-ui, sans-serif; }
```

`@custom-variant hover (&:hover);` conserva el comportamiento de Tailwind 3 (el hover aplica también en táctiles); revisar con accesibilidad/UX queda fuera de este alcance. El `sans: ["Caveat Brush", …]` del `tailwind.config.mjs` viejo estaba fuera de `fontFamily` y nunca tuvo efecto: no se migra.

- [ ] **Step 4: Eliminar la config vieja y ajustar dos clases**

```bash
git rm tailwind.config.mjs
```

En `src/sections/home/services/ServicesBentoItem/ItemButtonContainer.astro` línea 3, cambiar `backdrop-blur-sm` por `backdrop-blur-xs` (en v4 `-sm` pasó de 4 px a 8 px; `-xs` mantiene los 4 px). La línea completa queda:

```
    backdrop-blur-xs md:backdrop-blur-none
```

En `src/sections/home/services/ServicesBentoItem/ItemButton.astro` línea 21, quitar `border-1` (en v3 esa clase no existía y no hacía nada; en v4 genera 1 px). La línea era `border-1 md:border-2 md:border-white rounded-xl md:rounded-lg` y queda:

```
    md:border-2 md:border-white rounded-xl md:rounded-lg
```

- [ ] **Step 5: Build y comparar**

```bash
export SCRATCH=<ruta>
pnpm run build
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/c2 dist
```

Expected: build sin errores. La comparación debe mostrar `NO DIFFERENCES` en la estructura HTML salvo el cambio de clase `backdrop-blur-sm` → `backdrop-blur-xs` en los botones de servicios. Si hay otras diferencias en clases, investigar antes de seguir.

- [ ] **Step 6: Verificar el CSS generado**

```bash
grep -o "cerise-red-600[^;]*;" dist/_astro/*.css | head -3
grep -c "backdrop-blur-xs" dist/_astro/*.css
```

Expected: aparece `--color-cerise-red-600:#e1306c` (o equivalente) y al menos 1 coincidencia de `backdrop-blur-xs`.

- [ ] **Step 7: Verificación visual**

Usar Playwright (o `pnpm preview` y el navegador) en `/`, `/servicios/reiki` y `/info-util` a 375 px y 1280 px. Se comparan contra capturas del baseline `v4` (tomar antes con `git stash`/checkout del commit anterior si hace falta). Revisar gradientes de fondo (`bg-gradient-to-*` sigue funcionando; interpola en oklab y puede variar levemente el tono), blur de los botones y estilos `prose` de servicios. Un leve cambio de tono de gradiente es esperado; cualquier otra diferencia se investiga.

- [ ] **Step 8: Guardar baseline y commit**

```bash
export SCRATCH=<ruta>
rm -rf $SCRATCH/baselines/c3 && cp -R dist $SCRATCH/baselines/c3
git add astro.config.mjs src/assets/styles/global.css src/sections package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(styles): ⬆️ upgrade Tailwind to v4

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
git status --short
```

Expected: el `git status` final no muestra `tailwind.config.mjs` ni cambios sin commitear.

---

### Task 4: C4 — Astro 7 y migración de APIs obligatorias

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/content.config.ts`
- Delete: `src/content/config.ts`
- Modify: `src/pages/servicios/[...slug].astro`
- Modify: `src/pages/rss.xml.js`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/types.d.ts`
- Modify: `src/components/BaseHead.astro`
- Modify: `src/layouts/LinksLayout.astro`
- Modify: `astro.config.mjs`
- Modify: `src/components/header/Header.astro`

**Interfaces:**
- Consumes: baseline `c3`.
- Produces: colección `services` con `id` (sin `slug`); `FormattedService` sigue exportado con `{ slug: string } & data`; baseline `c4`.

Todo va en un solo commit porque Astro 6 elimina las colecciones legacy y `<ViewTransitions />`, y el build queda roto a mitad de camino.

- [ ] **Step 1: Subir dependencias**

```bash
cd /Users/italodelap/projects/gaterapia
pnpm add astro@^7.3.5 @astrojs/check@^0.9.10 @astrojs/rss@^4.0.19 @astrojs/sitemap@^3.7.4 typescript@^6.0.3 @fontsource-variable/montserrat@^5.3.0 @fontsource/caveat-brush@^5.3.0
astro --version 2>/dev/null || pnpm exec astro --version
```

Expected: `astro --version` imprime `7.3.5` (o una 7.3.x). Los warnings de peer dependencies de ESLint (`@typescript-eslint` con TS 6) son esperados y no se tocan.

- [ ] **Step 2: Crear `src/content.config.ts` y borrar el viejo**

```bash
git mv src/content/config.ts src/content.config.ts
```

Reemplazar el contenido de `src/content.config.ts` por:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const servicesCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	services: servicesCollection,
};
```

- [ ] **Step 3: Migrar `src/pages/servicios/[...slug].astro`**

Cambiar el import (línea 3):

```astro
import { getCollection, render } from "astro:content";
```

Cambiar `getStaticPaths` (línea 14, `params`):

```astro
    params: { slug: service.id },
```

Y reemplazar las líneas 20 a 23 (`const { Content } = await service.render();` … `const { title } = service.data;`) por:

```astro
const { Content } = await render(service);

const { id: slug } = service;
const { title } = service.data;
```

- [ ] **Step 4: Migrar `src/pages/rss.xml.js`**

Cambiar la línea del `link`:

```js
			link: `/servicios/${service.id}`,
```

- [ ] **Step 5: Migrar `src/lib/data.ts` y `src/lib/types.d.ts`**

En `src/lib/data.ts`, última función:

```ts
export async function getFormattedServices(): Promise<FormattedService[]> {
	const services = await getCollection("services");

	return services.map(({ id, data }) => ({ slug: id, ...data }));
}
```

En `src/lib/types.d.ts` línea 4:

```ts
export type FormattedService = ServiceEntry["data"] & { slug: ServiceEntry["id"] };
```

- [ ] **Step 6: `ViewTransitions` → `ClientRouter`**

En `src/components/BaseHead.astro`: línea 2 `import { ClientRouter } from "astro:transitions";` y la etiqueta final `<ClientRouter />` (reemplaza `<ViewTransitions />`; mantener `<Analytics />` justo antes).

En `src/layouts/LinksLayout.astro`: línea 5 `import { ClientRouter } from "astro:transitions";` y `<ClientRouter />` (con tabs) reemplaza `<ViewTransitions />`.

- [ ] **Step 7: `compressHTML: true` provisional en `astro.config.mjs`**

```js
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	// TODO: quitar y adoptar el default 'jsx' de Astro 7 (ver commit de whitespace)
	compressHTML: true,
	site: "https://www.gaterapia.com",
	integrations: [sitemap()],
	vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 8: Arreglar el shorthand de `animation` en `Header.astro`**

Lightning CSS minifica `animation: blur linear both; animation-timeline: scroll();` como `animation: linear both blur scroll()`, que Chrome descarta (mismo bug del commit `38f0cdf` de `italodelap.dev`). Reemplazar en el `<style>` (líneas 35 a 37):

```css
  header {
    animation-name: blur;
    animation-timing-function: linear;
    animation-fill-mode: both;
    animation-timeline: scroll();
    animation-range: 0 500px;
  }
```

- [ ] **Step 9: Verificar que no queda API vieja**

```bash
grep -rnE "ViewTransitions|\.slug|\.render\(|astro:content\"" src | grep -v "getCollection\|render }\|CollectionEntry"
```

Expected: sin resultados (las únicas coincidencias aceptables son `getCollection`, `render` importado y `CollectionEntry`).

- [ ] **Step 10: Build**

```bash
pnpm run build
```

Expected: `astro check` con 0 errors (hints/warnings de ESLint no aplican) y build completo. Si hay un error de `setInterval` por `@types/node` duplicado, correr `pnpm why @types/node` y recién ahí agregar un override en `pnpm-workspace.yaml` (`overrides: { "@types/node": "<versión de astro>" }`); si no aparece, no se agrega nada.

- [ ] **Step 11: Comparar contra `c3`**

```bash
export SCRATCH=<ruta>
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/c3 dist
```

Expected: **sin `ONLY IN BASELINE`** (los 6 servicios y todas las rutas siguen existiendo). Diferencias permitidas: ids de headings con guion final (por ejemplo `id="nuestros-conocimientos-"`, cambio de v6 por emojis al final del heading), el markup de `ClientRouter` frente a `ViewTransitions`, y el inlining de scripts de Astro 7. Cualquier cambio de texto visible, de enlaces o de clases es un fallo.

- [ ] **Step 12: Verificar el CSS del header en el build**

```bash
grep -o "animation[^;}]*;\?" dist/_astro/*.css | grep -i "scroll"
```

Expected: se ven propiedades separadas (`animation-name:blur`, `animation-timeline:scroll()`), y **no** una línea `animation:linear both blur scroll()`.

- [ ] **Step 13: Batería de preview**

```bash
pnpm exec astro preview --background --port 4399
pnpm exec astro preview status
for r in / /servicios/catsitting /servicios/comunicacion-animal /servicios/registros-akashicos /servicios/reiki /servicios/terapia-floral-animales /servicios/terapia-floral-personas /info-util /rss.xml /sitemap-index.xml /sitemap-0.xml /robots.txt /nope; do printf "%s " "$r"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4399$r"; done
```

Expected: `200` en todas salvo `/nope` con `404`. Dejarlo corriendo para el paso siguiente. (En 7.3.5 `/_astro/status` da 404 en preview; el estado se consulta con `astro preview status`.)

- [ ] **Step 14: Verificación manual en navegador (preview en `http://localhost:4399`)**

Con Playwright o navegador:
1. Hover sobre los links del navbar en `/`: el fondo (backdrop) se mueve y aparece.
2. Navegar `/` → `/servicios/reiki` → `/info-util` → `/` y repetir el hover en `/`: el backdrop sigue funcionando (`navbar.ts` escucha `astro:page-load`).
3. En `/`, `getComputedStyle(document.querySelector("header")).animationName` debe ser `blur`.

Expected: los tres puntos se cumplen. Luego detener el servidor:

```bash
pnpm exec astro preview stop
```

- [ ] **Step 15: Guardar baseline y commit**

```bash
export SCRATCH=<ruta>
rm -rf $SCRATCH/baselines/c4 && cp -R dist $SCRATCH/baselines/c4
git add -A src package.json pnpm-lock.yaml astro.config.mjs pnpm-workspace.yaml
git commit -m "$(cat <<'EOF'
chore(deps): ⬆️ upgrade astro to 7 and migrate required APIs

Also splits the header animation shorthand so Lightning CSS does not
merge it with animation-timeline.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
git status --short
```

Expected: working tree limpio.

---

### Task 5: C5 — Alinear config con Astro 7

**Files:**
- Modify: `tsconfig.json`
- Delete: `src/env.d.ts`
- Modify: `astro.config.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: baseline `c4`.

- [ ] **Step 1: Reemplazar `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  }
}
```

(`baseUrl` está deprecado en TypeScript 6; `paths` se resuelve relativo al `tsconfig.json`.)

- [ ] **Step 2: Eliminar `src/env.d.ts`**

Solo tiene `/// <reference path="../.astro/types.d.ts" />` y `/// <reference types="astro/client" />`, que ya cubre el `include`.

```bash
git rm src/env.d.ts
```

- [ ] **Step 3: `// @ts-check` en `astro.config.mjs`**

Agregar como primera línea:

```js
// @ts-check
```

- [ ] **Step 4: Quitar el script `start`**

En `package.json`, eliminar la línea `"start": "astro dev",` (duplica a `dev`; `.vscode/launch.json` invoca `astro dev` directo).

- [ ] **Step 5: Build y comparar**

```bash
export SCRATCH=<ruta>
pnpm run build
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/c4 dist
```

Expected: `astro check` con 0 errors y `NO DIFFERENCES`. Si `@/` deja de resolverse en el editor o en el check, volver a agregar `"baseUrl": "."` y revisar el error antes de continuar.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json astro.config.mjs package.json
git commit -m "$(cat <<'EOF'
refactor(config): 🔧 align config with astro 7

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
git status --short
```

Expected: el `rm` de `src/env.d.ts` ya está en el índice y entra en el commit; working tree limpio.

---

### Task 6: C6 — Whitespace `'jsx'`

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/sections/home/hero/hello/HelloDescription.astro`
- Modify: `src/sections/home/hero/hello/HelloTitle.astro`
- Modify: `src/components/footer/MadeBy.astro`

**Interfaces:**
- Consumes: baseline `c4` (idéntico a C5 por la comparación) para detectar texto pegado.

Con `compressHTML: 'jsx'` (default de Astro 7) un salto de línea entre texto y un elemento inline elimina el espacio por completo; hay que escribirlo con `{" "}` en la línea que lo necesita.

- [ ] **Step 1: Quitar `compressHTML` de `astro.config.mjs`**

Eliminar estas dos líneas (el TODO y `compressHTML: true,`).

- [ ] **Step 2: `HelloDescription.astro` — reemplazar las líneas 8 a 14 y 15 a 27**

El primer `<p>` (líneas 8 a 14) queda:

```astro
  <p>
    Soy <strong>terapeuta floral</strong>{" "}
    (de personas y animales), y me especializo en <strong>felinos</strong>. Hago{" "}
    <strong>catsitting</strong>, <strong>reiki</strong>,{" "}
    <strong>comunicación telepática</strong> con animales y{" "}
    <strong>registros akáshicos</strong> (de personas y animales).
  </p>
```

Y en el segundo `<p>` solo cambia la línea 16:

```astro
    Espero poder ayudarte{" "}
```

(el `<span class="inline-block align-bottom">…</span>` que sigue queda igual).

- [ ] **Step 3: `HelloTitle.astro` línea 15**

```astro
    Hola! Soy Juli{" "}
```

- [ ] **Step 4: `MadeBy.astro` línea 2**

```astro
  Made with ❤️ by{" "}
```

- [ ] **Step 5: Build y comparar contra `c4`**

```bash
export SCRATCH=<ruta>
pnpm run build
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/c4 dist
```

Expected: `astro check` sin errores. El diff solo puede mostrar cambios de espacios en `index.html` (y en las páginas que incluyen el footer: `MadeBy`) donde antes había un nodo de texto con espacio y ahora hay otro equivalente; **no** debe aparecer texto pegado como `floral(de`, `Hagocatsitting`, `reiki,comunicación`, `yregistros`, `Soy Juli<span`, `by@italodelap`. Verificar explícitamente:

```bash
grep -E "floral</strong>\(de|Hago<strong|reiki</strong>,<strong|animales y<strong|ayudarte<span|Juli<span|by<a" dist/index.html
```

Expected: sin resultados.

- [ ] **Step 6: Revisión visual**

En `pnpm exec astro preview --background --port 4399` revisar `/` a 375 px y 1280 px: el párrafo del hero, el título "Hola! Soy Juli" y el footer "Made with ❤️ by @italodelap" deben verse con sus espacios normales. Luego `pnpm exec astro preview stop`.

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs src
git commit -m "$(cat <<'EOF'
refactor(whitespace): 🎨 adopt astro 7 jsx whitespace handling

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: C7 — Actualizar `AGENTS.md`

**Files:**
- Modify: `AGENTS.md` (reemplazo completo)

**Interfaces:**
- Produces: las secciones `## Testing Guidelines` y `## Commit & Pull Request Guidelines` con ese texto exacto de encabezado, que el plan de mejoras (tarea de higiene) usa como anclas para agregar la sección de git workflow.

- [ ] **Step 1: Reemplazar `AGENTS.md` con este contenido**

````markdown
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

No test framework or coverage threshold is configured. For changes, run `pnpm run build` and manually inspect affected pages in `pnpm dev`. For content updates, verify frontmatter against `src/content.config.ts` and check `/servicios/<slug>`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits with scopes and optional emoji, such as `feat(services): ✨ create content for reiki` and `fix(Hero): 🐛 improve image aspect ratio`. Keep commits focused and use `feat`, `fix`, `chore`, or similar types with a meaningful scope.

Pull requests should include a short summary, affected routes or content files, validation performed, and screenshots for visible UI changes. Link related issues when available.

## Security & Configuration Tips

The canonical site URL is in `astro.config.mjs`. Do not commit local secrets or deployment tokens. Keep public assets in `public` only when they are safe to serve directly.

## Documentation

Full documentation: https://docs.astro.build. Astro also runs an MCP server with real-time access to current docs at `https://mcp.docs.astro.build/mcp`; prefer it over training data for anything API-related.
````

- [ ] **Step 2: Verificar que el contenido coincide con el repo**

```bash
grep -n "start\|vercel\|adapter" AGENTS.md
```

Expected: ninguna mención a `pnpm start` ni al adapter (salvo la frase "there is no Vercel adapter"). `grep -n "^## " AGENTS.md` debe listar `Testing Guidelines` y `Commit & Pull Request Guidelines`.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "$(cat <<'EOF'
docs(AGENTS.md): 📝 update for astro 7

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Verificación final, PR a `dev` y deploy

**Files:** ninguno.

- [ ] **Step 1: Verificación local final**

```bash
cd /Users/italodelap/projects/gaterapia
pnpm exec astro --version
pnpm why @types/node | head -20
pnpm run build
git status --short
git diff dev --stat
git log --oneline dev..HEAD
```

Expected: Astro `7.3.x`; build verde; working tree limpio; `git log` muestra los 7 commits C1 a C7 (más los commits del spec y los planes si la rama partió de `docs/astro-7-migration-spec`).

- [ ] **Step 2: Confirmar con el usuario antes de publicar**

Subir la rama y abrir el PR son acciones visibles externamente. Pedir confirmación explícita al usuario y, si la da:

```bash
git push -u origin chore/upgrade-astro-7
gh pr create --base dev --title "chore(deps): ⬆️ upgrade to astro 7 and tailwind 4" --body "$(cat <<'EOF'
## Summary
- Upgrade Astro 4.5 → 7.3 and Tailwind 3 → 4 (plus related dependencies)
- Replace `@astrojs/vercel` with `@vercel/analytics`
- Pin `packageManager` (pnpm 11.22.0) and `engines.node`
- Migrate content collections, `ClientRouter`, `astro/zod`, jsx whitespace

## Affected routes
All routes (`/`, `/servicios/*`, `/info-util`, `/rss.xml`, sitemap, robots).

## Validation
`pnpm build` green on every commit; text diff of build output against the previous phase; route battery in preview; manual check of navbar with ClientRouter and header scroll animation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Verificar el deploy de `dev` en Vercel**

Antes del merge a `dev`, el usuario confirma en Vercel (Settings → Build) que el framework preset sigue en "Astro" con output `dist`: sin el adapter ya no existe `.vercel/output`. Corepack (`ENABLE_EXPERIMENTAL_COREPACK=1`) y Node ya están configurados.

Con el MCP de Vercel o el dashboard, comprobar que el deploy de la rama `chore/upgrade-astro-7` (preview) y luego el de `dev` tras el merge terminan en `READY`. Si falla en el install, **leer los logs antes de cambiar nada** (los fallos conocidos son `packages field missing or empty`, que apunta a Corepack/pnpm, y un Node viejo). Spot-check en la URL real: `/`, `/servicios/reiki`, `/info-util`, y en producción más adelante `cache-control: public, max-age=31536000, immutable` en un `/_astro/*.css`.

- [ ] **Step 4: Promoción a `main`**

Cuando el usuario valide el pre-prod, abrir un PR de `dev` a `main` (también con confirmación explícita) y verificar el deploy de producción con el mismo spot-check.
