# Transactional email link patches

These LMX files are static exports of the Loops published messages, with only the
reviewed link repairs applied. They await separate application in Loops; repository
changes do not synchronize or publish templates. No provider writes, sends or
production activation are included.

## Reviewed provider baselines

| File | Transactional ID | Published message ID | Content revision ID |
| --- | --- | --- | --- |
| `reminder.lmx` | `cm5dwlbsj034sasyzg1w6sg39` | `cm5dwlbtf034tasyzfmkegsjc` | `cmoj17k3v4pgv01l0965x5p0j` |
| `purchase.lmx` | `cm4r78nk301ehx79nrrxaijgl` | `cmo8kg1u302i30iz1fjekwq29` | `cmo8kh7gp0toh0izrglp3604z` |
| `pending.lmx` | `cmnd2gkqh03ja0ixlz9fx93re` | `cmr27lkym060u0i24u4jzvgns` | `cmr27lspo0wv00i3oc62pbbem` |
| `approved.lmx` | `cmqm0fa3719jx0j0fu0ksganb` | `cmr27l8in007v0j3j3je31mis` | `cmr27mtyi0ym50k39dsxg3i8s` |

All four transactional records had no draft at export. These published IDs and
revisions identify the reviewed source, not draft update targets.

## Changes and sender contract

- Reminder: the Event Name value links to
  `https://www.sportshub.net.au/event/{data.eventId}`. The ID emoji remains plain
  `🆔`, with its emojipedia link and underline removed. The reminder sender already
  supplies `eventId` in
  [`email_reminder.py`](../../functions/lib/emails/email_reminder.py).
- Purchase, pending and approved: the event name in the opening descriptive
  paragraph is `<Link href="{data.eventUrl}">{data.eventName}</Link>`.
  [`EmailService.java`](../../functions/lib/functions/src/main/java/com/functions/emails/EmailService.java)
  supplies `eventUrl` for all three, using the event document ID and the existing
  environment URL policy. Legacy Python
  [`purchase_event.py`](../../functions/lib/emails/purchase_event.py) supplies the
  production event URL to both purchase recipients. Every active sender sharing
  these templates must supply this field before publication.
- Pending: the organiser destination is
  `https://www.sportshub.net.au/user/{data.organiserId}`, removing one extra
  opening brace.

All other copy, spelling, whitespace, layout, images and links are preserved from
the provider LMX, including existing order links.

## Separate release procedure

1. Refresh each transactional record and its published message. Compare against
   the baseline IDs, revisions and content above. Merge and re-review concurrent
   provider edits instead of overwriting them with these exports.
2. Deploy the additive Java sender fields and any active legacy Python purchase
   sender first, under separate deployment approval. Verify all active purchase,
   pending and approved senders supply `eventUrl` while published templates remain
   unchanged. Reminder has no new sender dependency.
3. With explicit Loops write approval, ensure a draft exists for each intended
   template. Fetch the returned draft message IDs and current revisions. Update
   only those drafts, using each draft's `expectedRevisionId`; never use the
   published message IDs or baseline revisions as draft update targets.
4. Preview/render drafts with synthetic values. Inspect HTML and plain text event,
   organiser and order destinations, both purchase recipient copies, retained
   text, layout and images. Static LMX inspection does not establish provider
   rendering or inbox behavior.
5. Publish only after sender readiness, successful previews and explicit release
   approval. Re-fetch published message IDs and content revisions to verify the
   applied content. Inbox delivery and browser navigation require separate
   authorized verification.

For rollback, remove the templates' `eventUrl` requirement before removing the
additive sender field.
