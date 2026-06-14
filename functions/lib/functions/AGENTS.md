# Java Functions Agent Guide

Read the root `AGENTS.md` and `functions/AGENTS.md` first.

## Commands

- Verify all: `mvn clean verify`
- Run tests: `mvn clean test`
- Run one test: `mvn -Dtest=RecurringEventsServiceTest test`

## Architecture And Conventions

- Organize code by domain under `src/main/java/com/functions/`.
- Controllers own HTTP decoding/routing; handlers and services own business behavior; repositories own Firestore access.
- Authenticate and enforce ownership on the server. Never authorize using only client-supplied organiser identifiers.
- Treat Firestore transaction callbacks as retryable. Keep them deterministic and avoid irreversible external side effects inside them.
- Preserve the existing structured request and transaction logging patterns. Log useful identifiers and outcomes without secrets.
- Prefer explicit failures for unexpected states. Use `Optional` only for truly optional values.
- Java models and request objects may form contracts with TypeScript types in `frontend/interfaces/`; inspect both sides before changing a shape.
- Use Loops for new email behavior; SendGrid is legacy.

## Tests And Deployment

- Inspect and extend the nearest JUnit test before adding a new test class.
- Deployment requires explicit operator approval.
- For an approved single-function deployment, use `./deployFunctionsToGCloud.sh <dev|prod> <function_name>`.
