# Python Firebase Functions Agent Guide

Read the root `AGENTS.md` first.

## Commands

- Create the local environment: `python3.11 -m venv venv`
- Install dependencies: `venv/bin/pip install -r requirements.txt`
- Run tests: `venv/bin/python -m unittest discover -s tests`
- Run one test: `venv/bin/python -m unittest tests.test_create_account`

## Conventions

- Python functions are legacy/supporting backend code; prefer Java for new backend endpoints unless explicitly requested.
- Keep Firebase exports in `main.py` and business logic in `lib/`.
- Validate and authenticate requests before business operations.
- Mock external Stripe, Firebase, email, and network boundaries in unit tests.
- Never commit `.env*`, `functions_key*.json`, or service-account credentials.
- Tests currently initialize Firestore during import, so they require the untracked `functions_key.json` and local environment configuration. Do not fabricate credentials to make them run.

## Deployment

Deployment requires explicit operator approval. For an approved single-function deployment, use:

`./deployFunctionToFirebase.sh <dev|prod> <function_name>`

Do not run a broad `firebase deploy`; deploying an incomplete function set can delete other functions.
