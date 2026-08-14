<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

> Whatever action you can do yourself, Please do yourself, this includes starting apps and verification.
> Do not use the Sites skill for design or implementation in this repository.
> After every completed implementation step, create a local git commit containing only that step's changes.

## Project Structure & Module Organization

Keep routes in `src/app/`, UI in `src/components/`, WebGL scenes in `src/components/three/`, and project content in `src/data/projects.ts`. Store assets under `public/`. Unit tests use `*.test.ts(x)`; browser flows belong in `tests/e2e/`.

## Build, Test, and Development Commands

- `npm install` — install the locked dependency set.
- `npm run dev` — start the local development server.
- `npm run lint` — run repository ESLint checks.
- `npm run typecheck` — validate strict TypeScript without emitting files.
- `npm test` — execute Vitest tests once.
- `npm run build` — create the production bundle.
- `npm run verify` — run every required quality gate in sequence.

Use repository scripts so local and CI behavior match.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and Server Components by default. Add `"use client"` only for browser-dependent code. Use PascalCase components, `use`-prefixed hooks, camelCase utilities, and lowercase kebab-case routes. Preserve reduced-motion and non-WebGL fallbacks.

## Testing Guidelines

Use Vitest and Testing Library. Cover navigation, controls, reduced motion, and fallbacks. Visual changes require desktop and mobile checks. Lint, typecheck, tests, and production build must pass.

## Commit & Pull Request Guidelines

Follow the Lore protocol: an intent-first subject with useful trailers such as `Confidence:`, `Scope-risk:`, and `Tested:`. Pull requests need a summary, verification evidence, linked issues when applicable, and screenshots for visual changes.

## Security & Asset Hygiene

Keep secrets in `.env.local`; commit only documented placeholders. Compress large media and 3D assets, record licenses, and exclude generated output such as `.next/`.
