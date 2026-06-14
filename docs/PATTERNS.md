# SPORTSHUB Critical Patterns

## General

- Follow nearby code and tests before introducing new patterns.
- Comments explain why a decision exists, not what the following code does.
- Keep secrets in environment or credential files that remain untracked.
- Prefer focused changes; do not migrate adjacent legacy code unless it is required for correctness.

## Frontend And Shared Contracts

- TypeScript is strict. Avoid `any`; preserve branded/domain-specific types where already used.
- Components use PascalCase; variables and functions use camelCase.
- Shared domain types live under `frontend/interfaces/` and are re-exported where established.
- Test user-visible or service behavior and mock external Firebase/API boundaries.
- When changing a function request or response, inspect the corresponding backend controller, handler, and model.

## Backend

- Java is the primary direction for backend work; do not add new Python functions unless explicitly requested.
- Java HTTP controllers decode and route requests; handlers/services implement business behavior; repositories own Firestore access.
- Treat authentication and organiser ownership as server-side responsibilities. Do not trust client-supplied organiser identifiers.
- Fail fast for critical business logic. Use `Optional` only when absence is semantically expected.
- Use Loops for new email work; SendGrid code is legacy.
- Preserve structured request and transaction logging in Java. Include useful context without logging secrets or unnecessary personal data.
- Firestore transaction callbacks may retry. Keep transaction work deterministic and avoid irreversible external side effects inside callbacks.

## Deployment

- Deployments are external, production-affecting operations and always require explicit approval.
- Python single-function deployment uses `functions/deployFunctionToFirebase.sh <dev|prod> <function_name>`.
- Java single-function deployment uses `functions/lib/functions/deployFunctionsToGCloud.sh <dev|prod> <function_name>`.
- Never run broad Firebase deployment commands casually; an incomplete function list can delete deployed functions.
