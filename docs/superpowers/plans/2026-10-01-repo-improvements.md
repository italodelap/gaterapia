# Mejoras de repo post-migración — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar siete mejoras acotadas al repo `gaterapia` ya migrado a Astro 7: CI, higiene del repo, links externos robustos, limpieza de metas, `robots.txt`, `og:image` y README.

**Architecture:** Cada tarea es una rama y un PR independiente hacia `dev`, en el orden indicado. La única pieza con lógica nueva es la carga de links desde Google Sheets (colección de content layer con un parser CSV propio y tests con `node:test`). El resto son cambios de config, metadatos y documentación.

**Tech Stack:** Astro 7 (content layer, `astro/zod`), Zod 4 (`z.url`), GitHub Actions, Node 24, pnpm 11.22.0.

**Spec:** `docs/superpowers/specs/2026-10-01-astro-7-migration-and-improvements-design.md` (sección 5, Parte 2). **Precondición:** el plan `docs/superpowers/plans/2026-10-01-astro-7-migration.md` está completo y mergeado a `dev` (usa `src/content.config.ts`, `ClientRouter`, `@tailwindcss/vite`, `engines` y `packageManager`).

## Global Constraints

- Git-flow: las ramas salen de `dev` y vuelven a `dev` por PR; `dev` es pre-prod y se promueve a `main` por PR. Nombres: `ci/…`, `chore/…`, `fix/…`, `feat/…`, `docs/…`.
- Commits: Conventional Commits con scope y emoji opcional, terminados con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Node `>=22.12.0` y `packageManager: pnpm@11.22.0` (ya en `package.json`); en la CI usar Node `24` (LTS activa; no usar Node 25 o superior, que ya no incluye Corepack).
- Fuera de alcance: accesibilidad, `astro:assets`, ESLint, `BaseHead` en `/info-util`, rediseño.
- Indentación: tabs en `.ts` y `.mjs`; los `.astro` conservan la indentación del archivo que editan.
- Una tarea no se considera terminada hasta que `pnpm run build` pasa en su rama.
- Subir ramas, abrir PRs y tocar la configuración de GitHub o Vercel son acciones visibles externamente: pedir confirmación explícita al usuario antes de cada una.

## Review Focus

1. **El CSV de la hoja termina con salto de línea, tiene filas vacías, celdas con comas/comillas o líneas CRLF** (el CSV real usa CRLF): los tests de `parseCsv` los cubren y `fetchLinks` ignora filas vacías (Task 3).
2. **Google responde 4xx/5xx o una página HTML de login** (hoja despublicada): hoy se publica basura; con el cambio el build falla con mensaje `[links]` (Task 3, verificación de modos de falla).
3. **Una fila con URL inválida** (`javascript:…`, texto suelto): Zod rechaza la entrada y el build falla indicando la fila (Task 3).
4. **Scrapers que no soportan WebP o requieren URL absoluta** para `og:image`: el asset es JPG/PNG y la URL se construye con `Astro.site` (Task 6).
5. **`/robots.txt` en producción apunta al dominio sin `www`**: el endpoint usa `site` y se verifica el contenido en el build (Task 5).

---

## Convenciones

- Los comandos asumen `cd /Users/italodelap/projects/gaterapia` y la rama de la tarea creada desde `dev` actualizada (`git switch dev && git pull`).
- Para comparar salidas de build, usar `compare-dist.mjs` (ver Task 0 del plan de migración): `node $SCRATCH/tools/compare-dist.mjs <baseline> dist`. Si el archivo no existe, recrearlo desde ese plan.
- Preview para verificar: `pnpm exec astro preview --background --port 4399`, `curl` a la ruta, y `pnpm exec astro preview stop` al terminar.

---

### Task 1: CI de GitHub Actions (`ci/build-workflow`)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: un job llamado **`build`**, que es el nombre del check requerido para la branch protection.

- [ ] **Step 1: Crear la rama**

```bash
git switch dev && git pull && git switch -c ci/build-workflow
```

- [ ] **Step 2: Crear `.github/workflows/ci.yml`**

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
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Enable Corepack
        run: corepack enable

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: "24"
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build (astro check + astro build)
        run: pnpm build
```

Si en el primer run falla el paso de Corepack o el cache de pnpm, la alternativa es reemplazar `Enable Corepack` por `pnpm/action-setup@v6` (lee `packageManager`) antes de `setup-node`.

- [ ] **Step 3: Validar el YAML localmente**

```bash
node -e "const y=require('node:fs').readFileSync('.github/workflows/ci.yml','utf8'); if(!y.includes('build:')||!y.includes('branches: [main, dev]')) process.exit(1); console.log('ok')"
pnpm run build
```

Expected: `ok` y build verde.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: 👷 add GitHub Actions workflow to run build on PRs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: PR y verificación del check (con confirmación del usuario)**

Con confirmación, `git push -u origin ci/build-workflow` y `gh pr create --base dev --title "ci: 👷 add GitHub Actions workflow to run build on PRs"`. Expected: el check `build` aparece en el PR y termina en verde. **Acción manual posterior del usuario** (después de mergear y de que el check haya corrido una vez): en GitHub → Settings → Branches (o Rulesets) para `main` y `dev`, exigir PR, exigir el check `build` y bloquear force-push y borrado.

---

### Task 2: Higiene del repo (`chore/repo-hygiene`)

**Files:**
- Modify: `.gitignore`
- Create: `CLAUDE.md` (symlink a `AGENTS.md`)
- Modify: `AGENTS.md`

- [ ] **Step 1: Crear la rama**

```bash
git switch dev && git pull && git switch -c chore/repo-hygiene
```

- [ ] **Step 2: Actualizar `.gitignore`**

Agregar al final del archivo (que termina en `.DS_Store`):

```
# jetbrains setting folder
.idea/

# Vercel
.vercel
.env*.local
```

Verificar:

```bash
touch .env.local && mkdir -p .vercel && git check-ignore .env.local .vercel; rm -rf .env.local .vercel
```

Expected: imprime `.env.local` y `.vercel` (ambos ignorados).

- [ ] **Step 3: Crear el symlink**

```bash
ln -s AGENTS.md CLAUDE.md
git add CLAUDE.md
git ls-files -s CLAUDE.md
```

Expected: el modo es `120000` (symlink).

- [ ] **Step 4: Agregar la sección de git workflow a `AGENTS.md`**

Insertar justo antes de la línea `## Commit & Pull Request Guidelines`:

```markdown
## Git Workflow

This project follows **git-flow**: `main` is production and `dev` is the pre-production environment where the client reviews changes before they go live. Short-lived branches (`feat/x`, `fix/x`, `chore/x`, `ci/x`, `docs/x`) branch off `dev` and merge back into `dev` via PR; `dev` is promoted to `main` via PR.

- **Branch protection** (`main` and `dev`): PR required to merge, the `build` status check must pass, force-pushes and deletion are disabled.
- **CI** (`.github/workflows/ci.yml`): runs `pnpm build` on every PR and push targeting `main` or `dev`.
- **Deploys**: Vercel auto-deploys `main` to production and `dev` to the pre-production URL, and creates a preview per branch/PR.

```

Y en `## Testing Guidelines`, agregar al final del párrafo: ` CI runs `pnpm run build` on every PR.`

- [ ] **Step 5: Verificar y commitear**

```bash
grep -n "^## " AGENTS.md
pnpm run build
git add .gitignore AGENTS.md CLAUDE.md
git commit -m "$(cat <<'EOF'
chore(repo): 🔧 ignore vercel files, symlink CLAUDE.md and document git workflow

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

Expected: `## Git Workflow` aparece antes de `## Commit & Pull Request Guidelines`; build verde.

---

### Task 3: Links externos robustos (`fix/links-csv`)

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/lib/csv.test.ts`
- Create: `src/lib/links.ts`
- Modify: `src/content.config.ts`
- Modify: `src/pages/info-util.astro`
- Modify: `src/lib/types.d.ts`
- Modify: `tsconfig.json`
- Modify: `package.json`
- Delete: `src/lib/api.ts`

**Interfaces:**
- Produces: `parseCsv(text: string): string[][]` en `src/lib/csv.ts`; `fetchLinks(): Promise<{ id: string; order: number; link: string; url: string }[]>` en `src/lib/links.ts`; colección `links` con data `{ order: number; link: string; url: string }`.
- Spec deviation (menor): se agrega el script `"test": "node --test src/lib/csv.test.ts"` para poder ejecutar los tests; el spec no lo mencionaba.

- [ ] **Step 1: Crear la rama y tomar un baseline**

```bash
export SCRATCH=<ruta>
git switch dev && git pull && git switch -c fix/links-csv
pnpm run build
rm -rf $SCRATCH/baselines/links-before && cp -R dist $SCRATCH/baselines/links-before
grep -o 'rel="noopener noreferrer"' dist/info-util/index.html | wc -l
```

Expected: el build pasa. Anotar el número impreso (links de redes sociales más links de la hoja); se compara después.

- [ ] **Step 2: Escribir el test que falla**

Crear `src/lib/csv.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsv } from "./csv.ts";

describe("parseCsv", () => {
	it("parses simple rows", () => {
		assert.deepEqual(parseCsv("nombre,Url\nA,https://a.com\nB,https://b.com"), [
			["nombre", "Url"],
			["A", "https://a.com"],
			["B", "https://b.com"],
		]);
	});

	it("handles CRLF line endings without leaving \\r in cells", () => {
		assert.deepEqual(parseCsv("nombre,Url\r\nA,https://a.com\r\n"), [
			["nombre", "Url"],
			["A", "https://a.com"],
		]);
	});

	it("does not create an extra row for a trailing newline", () => {
		assert.deepEqual(parseCsv("a,b\n1,2\n"), [
			["a", "b"],
			["1", "2"],
		]);
	});

	it("keeps commas inside quoted cells", () => {
		assert.deepEqual(parseCsv('"Hola, mundo",https://a.com'), [["Hola, mundo", "https://a.com"]]);
	});

	it("unescapes doubled quotes inside quoted cells", () => {
		assert.deepEqual(parseCsv('"Dijo ""hola""",x'), [['Dijo "hola"', "x"]]);
	});

	it("keeps newlines inside quoted cells", () => {
		assert.deepEqual(parseCsv('"linea 1\nlinea 2",x'), [["linea 1\nlinea 2", "x"]]);
	});

	it("returns an empty cell for a blank line so callers can filter it", () => {
		assert.deepEqual(parseCsv("a,b\n\nc,d"), [["a", "b"], [""], ["c", "d"]]);
	});

	it("returns no rows for empty input", () => {
		assert.deepEqual(parseCsv(""), []);
	});
});
```

- [ ] **Step 3: Ejecutar el test y ver que falla**

```bash
node --test src/lib/csv.test.ts
```

Expected: FAIL con `Cannot find module` / `ERR_MODULE_NOT_FOUND` para `./csv.ts`.

- [ ] **Step 4: Implementar `src/lib/csv.ts`**

```ts
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cell += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && text[i + 1] === "\n") {
				i++;
			}
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else {
			cell += char;
		}
	}

	if (cell !== "" || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}

	return rows;
}
```

- [ ] **Step 5: Ejecutar los tests y ver que pasan**

```bash
node --test src/lib/csv.test.ts
```

Expected: 8 tests passing, 0 failing.

- [ ] **Step 6: Excluir los tests del type-check y agregar el script `test`**

En `tsconfig.json`, cambiar `"exclude": ["dist"]` por:

```json
  "exclude": ["dist", "src/**/*.test.ts"],
```

En `package.json`, agregar a `scripts` (después de `"preview"`):

```json
    "test": "node --test src/lib/csv.test.ts",
```

Verificar: `pnpm test` → 8 tests passing.

- [ ] **Step 7: Crear `src/lib/links.ts`**

```ts
import { parseCsv } from "./csv";

const SHEET_URL =
	"https://docs.google.com/spreadsheets/d/e/2PACX-1vTERcp_hbkB3Ww-OzdjfVvUDDojYjT-LlqI1ZY5FcYtYTGMAi4zKOGPrgjpVk0psEBe4xlggAqq1qVJ/pub?output=csv";

export async function fetchLinks() {
	const response = await fetch(SHEET_URL, { signal: AbortSignal.timeout(10_000) });

	if (!response.ok) {
		throw new Error(`[links] Google Sheet respondió ${response.status}`);
	}

	if (!response.headers.get("content-type")?.includes("text/csv")) {
		throw new Error("[links] La respuesta no es CSV (¿la hoja fue despublicada?)");
	}

	const [, ...rows] = parseCsv(await response.text());

	const links = rows
		.map(([link = "", url = ""], order) => ({
			id: String(order),
			order,
			link: link.trim(),
			url: url.trim(),
		}))
		.filter(({ link, url }) => link !== "" || url !== "");

	if (links.length === 0) {
		throw new Error("[links] La hoja no tiene filas");
	}

	return links;
}
```

- [ ] **Step 8: Agregar la colección `links` a `src/content.config.ts`**

Reemplazar el archivo por:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { fetchLinks } from "./lib/links";

const servicesCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
	schema: z.object({
		title: z.string(),
	}),
});

const linksCollection = defineCollection({
	loader: fetchLinks,
	schema: z.object({
		order: z.number(),
		link: z.string().min(1),
		url: z.url({ protocol: /^https?$/ }),
	}),
});

export const collections = {
	services: servicesCollection,
	links: linksCollection,
};
```

- [ ] **Step 9: Usar la colección en `src/pages/info-util.astro`**

Reemplazar las líneas 8 a 10 (`import { api } …` y `const links = …`) por:

```astro
const links = (await getCollection("links")).sort((a, b) => a.data.order - b.data.order);
```

Agregar al frontmatter, junto a los imports (después de `import { Image } from "astro:assets";`):

```astro
import { getCollection } from "astro:content";
```

Y en el cuerpo, reemplazar el `links.map((link) => (` por `links.map(({ data }) => (` y dentro: `href={data.url}` y `{data.link}` (en lugar de `link.url` y `link.link`).

- [ ] **Step 10: Quitar `Link` de `src/lib/types.d.ts` y borrar `api.ts`**

En `src/lib/types.d.ts` eliminar el bloque `export interface Link { … }` (líneas 6 a 9) y la línea en blanco anterior.

```bash
git rm src/lib/api.ts
grep -rnw "Link\|api" src | grep -v "ServiceLink\|NavbarLink\|SocialNetworkLink"
```

Expected: el `grep` no muestra referencias a `lib/api` ni al tipo `Link`.

- [ ] **Step 11: Build y comparar contra el baseline**

```bash
export SCRATCH=<ruta>
pnpm run build
node $SCRATCH/tools/compare-dist.mjs $SCRATCH/baselines/links-before dist
grep -c $'\r' dist/info-util/index.html
grep -o 'rel="noopener noreferrer"' dist/info-util/index.html | wc -l
```

Expected: el build pasa. La comparación solo muestra diferencias en `info-util/index.html`, y únicamente por el espacio/`\r` final de los `href` y por títulos sin espacios finales (por ejemplo `Bolsa primordial felina `). El conteo de `\r` es `0` y el conteo de `rel="noopener noreferrer"` es igual al anotado en el Step 1.

- [ ] **Step 12: Commit**

```bash
git add src tsconfig.json package.json
git commit -m "$(cat <<'EOF'
fix(links): 🐛 load links via content layer with a robust CSV parser

Fails the build with a clear message when the Google Sheet is
unreachable, is not CSV, is empty or contains an invalid URL.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 13: Verificar los modos de falla (cada cambio se descarta con `git checkout`)**

Para cada caso, editar temporalmente `src/lib/links.ts` y correr el build capturando la salida:

```bash
export SCRATCH=<ruta>
# a) HTTP 404
sed -i '' 's#/pub?output=csv#/pub-no-existe?output=csv#' src/lib/links.ts
pnpm run build > $SCRATCH/links-404.txt 2>&1; echo "exit=$?"; grep -n "\[links\]" $SCRATCH/links-404.txt
git checkout -- src/lib/links.ts

# b) respuesta que no es CSV (HTML)
sed -i '' 's#"https://docs.google.com/spreadsheets/[^"]*"#"https://www.gaterapia.com/"#' src/lib/links.ts
pnpm run build > $SCRATCH/links-html.txt 2>&1; echo "exit=$?"; grep -n "\[links\]" $SCRATCH/links-html.txt
git checkout -- src/lib/links.ts

# c) host inexistente
sed -i '' 's#docs.google.com#docs.google.invalid#' src/lib/links.ts
pnpm run build > $SCRATCH/links-host.txt 2>&1; echo "exit=$?"; tail -5 $SCRATCH/links-host.txt
git checkout -- src/lib/links.ts
git status --short
```

Expected: en a) y b) `exit` distinto de 0 y una línea con `[links] Google Sheet respondió 404` y `[links] La respuesta no es CSV` respectivamente; en c) `exit` distinto de 0 con el error de red de `fetch`. Si algún caso no hace fallar el build, el cambio no está funcionando: corregir antes de seguir. `git status` final limpio.

Para el caso de URL inválida (Review Focus 3): agregar temporalmente una fila con `javascript:alert(1)` es imposible sin tocar la hoja, así que se cubre con este chequeo del esquema:

```bash
node -e "import('astro/zod').then(({z})=>{const s=z.url({protocol:/^https?\$/});console.log(s.safeParse('javascript:alert(1)').success, s.safeParse('https://a.com').success)})"
```

Expected: `false true`.

---

### Task 4: Limpieza de metas legacy (`chore/head-cleanup`)

**Files:**
- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: Crear la rama**

```bash
git switch dev && git pull && git switch -c chore/head-cleanup
```

- [ ] **Step 2: Eliminar la meta `X-UA-Compatible`**

Borrar esta línea de `src/components/BaseHead.astro`:

```astro
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
```

- [ ] **Step 3: Eliminar el `apple-touch-icon` duplicado**

Borrar la línea sin `sizes` y dejar la de `180x180`:

```astro
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

Debe quedar solo:

```astro
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

No se tocan `msapplication-TileColor`, `mask-icon`, `meta name="title"` ni `theme-color` (inocuos o decisión de diseño).

- [ ] **Step 4: Build y verificar**

```bash
pnpm run build
grep -rc "X-UA-Compatible" dist --include=*.html | grep -v ":0" ; echo "restantes: $?"
grep -c 'rel="apple-touch-icon"' dist/index.html
```

Expected: el `grep` de `X-UA-Compatible` no imprime archivos (el `echo` muestra `restantes: 1`, que es "ninguna coincidencia") y `apple-touch-icon` aparece 1 vez.

- [ ] **Step 5: Commit**

```bash
git add src/components/BaseHead.astro
git commit -m "$(cat <<'EOF'
chore(BaseHead): 🔥 remove obsolete X-UA-Compatible meta and duplicated icon link

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `robots.txt` con la URL del sitemap correcta (`fix/robots-sitemap-url`)

**Files:**
- Create: `src/pages/robots.txt.ts`
- Delete: `public/robots.txt`

`public/robots.txt` apunta a `https://gaterapia.com/sitemap-index.xml` (sin `www`) mientras `site` es `https://www.gaterapia.com`.

- [ ] **Step 1: Crear la rama**

```bash
git switch dev && git pull && git switch -c fix/robots-sitemap-url
```

- [ ] **Step 2: Crear `src/pages/robots.txt.ts`**

```ts
import type { APIRoute } from "astro";

const getRobotsFileContent = (sitemapUrl: URL) => `User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
`;

export const GET: APIRoute = ({ site }) => {
	const sitemapUrl = new URL("/sitemap-index.xml", site);

	return new Response(getRobotsFileContent(sitemapUrl), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
```

- [ ] **Step 3: Borrar el archivo estático**

```bash
git rm public/robots.txt
```

- [ ] **Step 4: Build y verificar el contenido**

```bash
pnpm run build
cat dist/robots.txt
```

Expected: el contenido es exactamente

```
User-agent: *
Allow: /

Sitemap: https://www.gaterapia.com/sitemap-index.xml
```

- [ ] **Step 5: Verificar en preview y commit**

```bash
pnpm exec astro preview --background --port 4399
curl -s -i http://localhost:4399/robots.txt | head -12
pnpm exec astro preview stop
git add src/pages/robots.txt.ts public/robots.txt
git commit -m "$(cat <<'EOF'
fix(robots): 🐛 point sitemap to the canonical www domain

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

Expected: respuesta `200` con el mismo contenido y `content-type: text/plain`.

---

### Task 6: `og:image` correcta (`feat/og-image`)

**Files:**
- Create (aportado por el usuario): `public/og/gaterapia-og.jpg`
- Modify: `src/lib/types.d.ts`
- Modify: `src/components/BaseHead.astro`
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Produces: `OgImage` (`{ src: string; alt: string; width: number; height: number }`) exportado desde `src/lib/types.d.ts`; prop opcional `image?: OgImage` en `BaseHead` y `Layout`.

- [ ] **Step 1: Gate — el asset de 1200×630 debe existir**

El usuario aporta `public/og/gaterapia-og.jpg` (JPG o PNG, de menos de ~300 KB). Alternativa: componer el logo o el isotipo sobre el rosa de marca `#E1306C` con la foto del hero en Figma o Canva. Sin el asset, no se continúa.

```bash
git switch dev && git pull && git switch -c feat/og-image
ls -l public/og/
sips -g pixelWidth -g pixelHeight public/og/gaterapia-og.jpg
```

Expected: `pixelWidth: 1200`, `pixelHeight: 630` y tamaño menor a ~300 KB. Si el usuario entrega un PNG, usar `gaterapia-og.png` y reemplazar la extensión en el Step 3.

- [ ] **Step 2: Agregar el tipo `OgImage` a `src/lib/types.d.ts`**

```ts
export interface OgImage {
	src: string;
	alt: string;
	width: number;
	height: number;
}
```

- [ ] **Step 3: Editar el frontmatter de `BaseHead.astro`**

Reemplazar el bloque de props por (conservando los imports existentes y agregando el de `OgImage`):

```astro
import type { OgImage } from "@/lib/types";

interface Props {
  title: string;
  description?: string;
  image?: OgImage;
}

const DEFAULT_OG_IMAGE: OgImage = {
  src: "/og/gaterapia-og.jpg",
  alt: "Gaterapia: terapias para animales y personas",
  width: 1200,
  height: 630,
};

const {
  title,
  description = getServicesDescriptionForSeo(),
  image = DEFAULT_OG_IMAGE,
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL(image.src, Astro.site);
```

- [ ] **Step 4: Reemplazar los bloques Open Graph y Twitter en `BaseHead.astro`**

Reemplazar desde `<!-- Open Graph / Facebook -->` hasta las dos líneas comentadas de `twitter:site`/`twitter:creator` (inclusive las del comentario `<!-- <meta name="twitter:site" … /> -->`, que se conservan) por:

```astro
  <!-- Open Graph / Facebook -->
  <meta property="og:locale" content="es_AR" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Gaterapia" />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImageURL} />
  <meta property="og:image:width" content={String(image.width)} />
  <meta property="og:image:height" content={String(image.height)} />
  <meta property="og:image:alt" content={image.alt} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImageURL} />
  <meta name="twitter:image:alt" content={image.alt} />
  <!-- <meta name="twitter:site" content="@gaterapia" /> -->
  <!-- <meta name="twitter:creator" content="@gaterapia" /> -->
```

(Se eliminan `twitter:url`, que no es una etiqueta reconocida, y el uso de `property=` en las metas de Twitter, que lleva `name=`.)

- [ ] **Step 5: Aceptar y pasar `image` en `Layout.astro`**

En `src/layouts/Layout.astro`:

```astro
import type { OgImage } from "@/lib/types";

interface Props {
	title: string;
	image?: OgImage;
}

const { title, image } = Astro.props;
```

Y reemplazar `<BaseHead title={title} />` por `<BaseHead title={title} image={image} />`.

- [ ] **Step 6: Build y verificar las metas**

```bash
pnpm run build
grep -oE '<meta (property|name)="(og|twitter):[^>]*>' dist/index.html
grep -c 'twitter:url' dist/index.html
```

Expected: `og:image` y `twitter:image` con `https://www.gaterapia.com/og/gaterapia-og.jpg`, `og:image:width` `1200`, `og:image:height` `630`, `og:locale` `es_AR`, todas las de Twitter con `name=`, y `0` coincidencias de `twitter:url`. Repetir `grep` en `dist/servicios/reiki/index.html`.

- [ ] **Step 7: Commit**

```bash
git add public/og src
git commit -m "$(cat <<'EOF'
feat(seo): ✨ use absolute 1200x630 og:image with dimensions and alt

Also sets og:locale to es_AR, uses name= for twitter tags and drops
the unrecognized twitter:url tag.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: Verificación posterior al deploy (acción del usuario)**

Con el sitio en producción o en un preview público (los previews con login de Vercel no son accesibles para los scrapers): Facebook Sharing Debugger, LinkedIn Post Inspector y una prueba real en WhatsApp con `https://www.gaterapia.com/`. Si Facebook sigue mostrando la imagen vieja, el cache se invalida cambiando la URL del asset.

---

### Task 7: README (`docs/readme`)

**Files:**
- Modify: `README.md` (reemplazo completo)

Se hace al final porque refleja el resultado de la migración, la CI y los links.

- [ ] **Step 1: Crear la rama**

```bash
git switch dev && git pull && git switch -c docs/readme
```

- [ ] **Step 2: Reemplazar `README.md`**

````markdown
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

| Command            | Action                                              |
| :----------------- | :-------------------------------------------------- |
| `pnpm install`     | Installs dependencies                               |
| `pnpm dev`         | Starts local dev server at `localhost:4321`         |
| `pnpm build`       | Type-checks (`astro check`) and builds to `./dist/` |
| `pnpm preview`     | Previews the production build locally               |
| `pnpm test`        | Runs the unit tests (`node --test`)                 |
| `pnpm astro ...`   | Runs Astro CLI commands, like `astro check`         |

## 🗂️ Structure

- `src/pages`: routes (`/`, `/servicios/[slug]`, `/info-util`, `/rss.xml`, `/robots.txt`)
- `src/content/services`: Markdown for each service (collection defined in `src/content.config.ts`)
- `src/layouts`, `src/components`, `src/sections`: page shells and UI
- `src/lib`: shared helpers
- `public`: static assets (favicons, images, manifest, Open Graph image)

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
````

- [ ] **Step 3: Contrastar con `package.json` y los scripts reales**

```bash
node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).join(','), p.engines.node, p.packageManager)"
grep -n "react\|eslint" README.md
```

Expected: los scripts son `dev,build,preview,test,astro` (si Task 3 no se mergeó, quitar la fila `pnpm test`), `engines` y `packageManager` coinciden con lo escrito, y `grep` no muestra menciones a React ni a ESLint.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(README): 📝 update tech stack, requirements and deploy info

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Cierre

- [ ] **Step 1: Verificar el estado de `dev`**

Tras mergear todos los PRs a `dev`: `git switch dev && git pull && pnpm run build && pnpm test`. Expected: build verde y 8 tests passing.

- [ ] **Step 2: Promoción a `main` (con confirmación del usuario)**

Abrir un PR de `dev` a `main`, esperar el check `build` y verificar el deploy de producción: `/`, `/servicios/reiki`, `/info-util`, `/robots.txt` (con `www`) y las metas `og:` en la página real.
