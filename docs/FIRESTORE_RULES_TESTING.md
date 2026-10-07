# Event partition security rules

Run the credential-free emulator tests from the repository root with Python 3.11,
Java 21, and Firebase CLI 14.11.1 installed:

```bash
firebase emulators:exec --only firestore --project demo-event-rule-security --config firebase.rules-test.json "python3.11 -m unittest discover -s tests/firestore"
```

The tests use an isolated local demo project and simulated authentication. They
cover organiser-owned event creation, partition collisions, duplicate IDs within
a batch, normal organiser edits, public access counts, and Admin archival.
Branch CI runs the same checks without production credentials.

Clients can create only fresh Active events belonging to the signed-in organiser.
Inactive event creation remains an Admin operation. Deleted-event tombstones
reserve their IDs, including within a batch. Existing conflicting records
are preserved for operator investigation; the scheduler does not overwrite them.
Applying these rules to a deployed database is a separate deployment.
