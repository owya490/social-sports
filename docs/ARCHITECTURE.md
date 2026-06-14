# SPORTSHUB Architecture

## System Shape

SPORTSHUB combines a Next.js web application with two serverless backend generations:

- `frontend/` owns the user and organiser UI, Firebase client integration, and frontend service contracts.
- `functions/` contains legacy and supporting Python Firebase Functions.
- `functions/lib/functions/` contains the primary Java backend, including HTTP controllers, handlers, services, repositories, models, and Firestore transactions.
- `sportshub-blogs-docs/` is the Hugo source for blogs and documentation. Its build script copies generated output into tracked directories under `frontend/public/`.
- `sportshub-cli/` is an independent TypeScript operational CLI.

## Runtime And Deployment Boundaries

- Frontend changes are checked with lint, Jest, and Next.js build jobs.
- Java functions are checked with Maven and deployed as Google Cloud Functions.
- Python functions are deployed through Firebase.
- A push to `master` triggers `.github/workflows/sportshub_cloud_functions_deploy_ci.yml`, which deploys both development and production backends. Changes must land through a reviewed PR.

## High-Risk Cross-Layer Contracts

- Authentication and authorization span frontend function callers, Java controllers, endpoint metadata, and handlers. Trace the entire request path before changing access rules.
- TypeScript frontend types and Java request/model classes represent shared domain contracts. Update both sides when the wire contract changes.
- Stripe checkout and webhook flows cross controllers, handlers, Firestore state, and external Stripe state. Preserve idempotency and ownership checks.
- Hugo source lives in `sportshub-blogs-docs/`; its generated frontend assets are outputs, not source.
