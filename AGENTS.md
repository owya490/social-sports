# SPORTSHUB Agent Guide

AGENTS.md loaded

## MOST CRITICAL NOTES

- When working below a directory that contains an `AGENTS.md`, read it first.
- Defer to existing patterns. Stop and ask before introducing a new architecture or diverging from nearby code.
- Never push directly to `master`: every push to `master` deploys both development and production functions.
- Never deploy Firebase or Google Cloud functions without explicit operator approval.
- Never edit generated Hugo output under `frontend/public/blogs`, `frontend/public/docs`, `frontend/public/css`, `frontend/public/js`, or `frontend/public/tags`. Edit `sportshub-blogs-docs/` and run its integration script only when requested.
- Do not expose or commit `.env*`, Firebase service-account files, API keys, or other credentials.

## Repository Overview

SPORTSHUB is a social-sports event discovery, booking, and organiser platform.

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js, React, TypeScript, Firebase client, and Jest tests |
| `functions/` | Python Firebase Functions and their tests |
| `functions/lib/functions/` | Primary Java Cloud Functions backend |
| `sportshub-blogs-docs/` | Hugo source copied into generated frontend public assets |
| `sportshub-cli/` | TypeScript CLI for SPORTSHUB operational workflows |
| `infrastructure/` | Infrastructure utilities |

See @docs/ARCHITECTURE.md for boundaries and data flow.

## Common Commands

Run commands from the indicated directory. Tee long-running build output to `.tmp/<name>.log`.

| Area | Command |
| --- | --- |
| Frontend install | `cd frontend && npm install` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend tests | `cd frontend && npm test -- --runInBand` |
| Frontend single test | `cd frontend && npm test -- services/tests/eventsCrud.test.ts --runInBand` |
| Frontend build | `cd frontend && npm run build` |
| Python environment | `cd functions && python3.11 -m venv venv && venv/bin/pip install -r requirements.txt` |
| Python tests | `cd functions && venv/bin/python -m unittest discover -s tests` |
| Java verification | `cd functions/lib/functions && mvn clean verify` |
| Java single test | `cd functions/lib/functions && mvn -Dtest=RecurringEventsServiceTest test` |
| CLI build | `cd sportshub-cli && npm run build` |

The CI source of truth is `.github/workflows/branch_ci.yml`.

## Local Prerequisites

- Node.js and npm for frontend and CLI work.
- Python 3.11. Create the gitignored `functions/venv/` and install `functions/requirements.txt` before running Python tests.
- Python tests currently initialize Firestore during import and require the untracked `functions/functions_key.json` plus the local environment configuration. Never create a fake credential or commit the real one.
- Java 17 and Maven for Java functions.
- Firebase and Google Cloud credentials are required only for approved deployments.
- Frontend build/runtime requires environment variables; never invent or commit credentials.

## Conventions And Critical Patterns

See @docs/PATTERNS.md. It is **MUST READ** before changing authentication, payments, function endpoints, Firestore transactions, or shared frontend/backend contracts.

## Bash And Tool Safety

- Avoid `&`, `$()`/backticks, brace expansion, and `\(` in jq format strings in agent Bash calls.
- Write temporary files to `.tmp/`, not `/tmp/`.
- Use `rg` or `rg --files` for searches. Prefix shell commands with `rtk` when its filtering will not hide required output.
- Always use `--repo owya490/social-sports` on mutating `gh` commands.
- Fetch current external-resource state before proposing an update. Obtain explicit approval before creating or changing PRs, issues, comments, gists, or other external artifacts.

## Branch And PR Rules

- Branch from `master`; Brian-authored branches use `brian2w/<feature>`.
- Keep changes focused and include the relevant quality gates.
- Use `.github/pull_request_template.md`.
- Show the final diff and obtain approval before pushing or opening a PR.
- Never post review comments or address other people on GitHub without explicit approval.

## Landing The Plane

1. Re-read the request and inspect the complete diff.
2. Run focused tests, then the relevant area-level quality gates.
3. Run `git diff --check`.
4. Confirm no secrets, generated output, or unrelated changes are included.
5. Summarize verification and any skipped checks.
6. Obtain approval before external mutations.
7. When delivery is requested, push the feature branch and confirm the working tree is clean.
