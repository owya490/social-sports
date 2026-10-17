# PR #686 Firestore release gate

Reviewed application baseline: `fe6414a7d1663af4c5f26d0d4ab266e708440734`.
This change adds a dev-only release path. It does not deploy anything on merge,
and provides no production deployment job. Keep #686 out of the production
frontend release until the coordinated cutover below is approved and rehearsed.

## What requires the new rules

| Client operation | Firestore access | Dependency |
| --- | --- | --- |
| Email registration | Create own `TempUsers/{uid}` | Owner-only create is compatible with old and new clients. Firebase Auth creation and verification mail are separate operations. |
| First verified email sign-in | Read TempUsers and both profiles; atomically create missing profiles and username mapping, delete TempUsers | Needs username point reads and atomic profile/mapping permission. Failure causes email sign-in to sign out. |
| New social account / missing public-profile recovery | `createUser` → `writeMissingUserProfile`; read profile pair and candidate mappings, then atomic writes | Needs username reads, owner-only creates and `getAfter` consistency. Existing owned mappings can be reused. |
| Existing complete email/social account | Read own profile pair; optionally update private contact email | No mapping write required. Legacy accounts with missing mappings can still authenticate. |
| Missing private-profile recovery | Create only own private profile | Does not require a mapping or overwrite existing public fields. |
| Username lookup/availability | Point get on `/Usernames/{name}` | Explicit get permission; collection enumeration remains denied. |
| Rename | Create new mapping, update public username, delete old mapping if present | Must be atomic. This follow-up avoids deleting absent legacy mappings and refuses foreign ownership. |
| Delete profile | Delete mapping and profile pair atomically | Strict rules reject old sequential public-profile deletion while a mapping exists. Firebase Auth deletion remains unchanged. |
| Return destination / password reset / email verification links | Firebase Auth APIs and local navigation | No additional Firestore rules requirement by themselves; final sign-in still requires the profile operations above. |

Source: `frontend/services/src/auth/authService.ts`,
`frontend/services/src/users/usersService.ts`, and `usersUtils/usernameUtils.ts`.
Repository `master` rules have no Usernames match. That is NOT evidence of live
rules: deployed sources must be retrieved separately for both projects.

## Compatibility and order

There is no safe ordinary two-step rolling release of this exact strict ruleset:
old `createUser` commits a username reservation before creating the public
profile, which the strict rules reject; old `deleteUser` deletes the public
profile before removing its mapping. New code against repository master rules
cannot access usernames. Old browser tabs also count as old clients.

Use a coordinated cutover, rehearsed in dev, to preserve existing authentication
behavior without relaxing the ownership/consistency rules:

1. Inspect the actual active rules in each target project. Save release ID and
   complete source, review the diff against this candidate (including unrelated
   EventTeams and other rules), and audit legacy profiles for missing/invalid
   usernames, duplicate names, missing mappings, and foreign-owned mappings.
   Do not automatically backfill or overwrite records. An incomplete profile
   with no TempUsers cannot complete email promotion; malformed or conflicting
   records need an explicit repair decision. These are release blockers when
   present, not evidence that a production migration has succeeded.
2. Prepare the compatible frontend artifact from the reviewed revision. Confirm
   how the frontend is promoted/rolled back and how old clients will be stopped.
   Repository CI does not establish a frontend maintenance/session gate. If old
   clients cannot be quiesced, STOP: design a separately reviewed transitional
   rules release instead. Do not deploy the strict rules first to active users.
3. Pause affected traffic/old clients in dev, inspect its live rules using the
   workflow, then dispatch `deploy-dev` at the reviewed SHA with the inspected
   `rulesetName` and the paused-clients acknowledgement. Review the saved source
   before authorizing deployment. The workflow refuses a changed release ID and
   saves the baseline before running only `firestore:rules` on `socialsports-44162`.
   Keep other console/CLI deployers paused as well: the Firebase deploy command
   cannot make the preceding drift check and deployment atomic.
4. Deploy the compatible dev frontend, allow rules propagation, and run the
   live smoke checklist before reopening dev traffic. The source verification
   proves the published source, not propagation or successful authentication.
5. After a successful dev rehearsal, obtain explicit production approval for
   the exact rules + frontend revisions and maintenance window. Repeat snapshot,
   audit, paused-client cutover, rules-first then compatible frontend, and smoke
   verification in production. Production deployment is intentionally absent
   from this workflow. Never merge #686 assuming this dev job gates an external
   frontend hosting service automatically.

Rollback is also coordinated: keep clients paused, restore the saved frontend
and matching inspected rules source together, verify the published rules and
smoke-test before reopening. Do not roll only the frontend back under strict
rules or restore repository master rules as a substitute for the live snapshot.
Do not delete Auth users or customer data as a rollback operation.

## Workflow setup and commands

The workflow must exist on the default branch before GitHub enables manual
dispatch. Review/land the workflow first without promoting the #686 frontend;
then select the reviewed feature branch for its inspect/deploy run. A push to
master still triggers the repository's existing functions deployments: landing
must be coordinated with the operator; this workflow does not change them.
Configure the `firestore-dev` GitHub environment with required reviewers and
appropriate branch restrictions before use. The only credential reference is
`SOCIALSPORTSDEV_GCLOUD_CREDENTIALS`; do not reuse production credentials.
The account needs Rules read/deploy permissions and Firebase project access.
No credentials are used in the emulator CI job.

Local emulator checks (Node 22, Java 17):

```sh
npm ci --prefix tools/firestore-rules --ignore-scripts
tools/firestore-rules/node_modules/.bin/firebase emulators:exec --only firestore --project demo-sportshub-rules "node --test tools/firestore-rules/rules.test.cjs"
```

Read-only dev inspection with an authorized gcloud login:

```sh
python3 scripts/snapshot-firestore-rules.py --output .tmp/dev-rules-snapshot
```

For production inspection, an authorized operator can GET
`https://firebaserules.googleapis.com/v1/projects/socialsportsprod/releases/cloud.firestore`
and then GET the returned `rulesetName` under the same API. Save the JSON and
source. Do not infer deployment state from repository history or console dates.

## Live smoke checklist (required; not replaced by emulator tests)

- Existing email and Google account sign-in retains profile fields, onboarding
  state and ordinary homepage behavior; a protected organiser link retains its
  path, query and fragment.
- New email registration → verification → first sign-in; retried/interrupted
  promotion preserves fields and removes TempUsers only after successful commit.
- New Google sign-in and a controlled partial-profile fixture recover safely;
  concurrent attempts produce one consistent mapping/profile pair.
- Existing account without mapping: sign-in, private email sync, public edit,
  rename, and delete in disposable dev fixtures. Foreign mappings are refused.
- Password reset, cancelled popup, failed sign-in, navigation away and account
  switching retain current behavior. Real email continuations retain the
  production host by design; confirm the project's action handler and authorized
  domains without modifying production settings or using real customer accounts.
- Rehearse rollback and record SHA, before/after ruleset IDs, frontend deployment
  IDs, results and operator approval. Only then consider production approval.

References: [Firebase rules deployment](https://firebase.google.com/docs/rules/manage-deploy),
[atomic rules checks](https://firebase.google.com/docs/firestore/security/rules-conditions),
[Rules REST API](https://firebase.google.com/docs/reference/rules/rest).
