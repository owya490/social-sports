# Frontend Agent Guide

Read the root `AGENTS.md` first.

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Lint: `npm run lint`
- Test all: `npm test -- --runInBand`
- Test one: `npm test -- services/tests/eventsCrud.test.ts --runInBand`
- Build: `npm run build`

## Conventions

- Follow strict TypeScript and nearby Next.js App Router patterns.
- Prefer existing service-layer APIs over direct Firebase access from components.
- Reuse definitions from `interfaces/`; update backend contracts when request or response shapes change.
- Follow nearby Jest tests and augment an existing test file when it cleanly covers the behavior.
- Do not commit environment files or fabricate build credentials.

## Generated Content

Do not directly edit tracked Hugo output under:

- `public/blogs/`
- `public/docs/`
- `public/css/`
- `public/js/`
- `public/tags/`

Edit `../sportshub-blogs-docs/` instead. Its `scripts/build-hugo.sh` rewrites tracked frontend assets and must only be run when the task requires those generated changes.
The script also merges Hugo images and selected top-level files into `public/`; before editing those shared locations, inspect the script and confirm which tree owns the source file.
