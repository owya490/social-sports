# Pyng organiser platform fees

Last updated: 2026-11-23 (Australia/Sydney).
Product decision owner: Brian.
Status: fees are calculated from Pyng tickets with a monthly query (2026-11-23,
superseding per-sale fee records). Step zero (session hardening) is in review.
The collection method is not chosen.

## Start here

SPORTSHUB wants to collect its own 1% fee from clubs that receive Pyng ticket
payments. Pyng offered manual monthly direct debit, which needs a signed
agreement from each club; Brian does not want that sign-up flow for clubs. The
collection method is open (see [Collection method](#collection-method)). The fee
amount comes from Pyng tickets either way.

This is the canonical project context for this initiative, not a provider
contract. It does not authorise sending email, activating collections or
deploying.
Current task: merge step zero (checkout session hardening), close browser
creates on `Tickets` and `Orders`, then choose the collection method.

## Agreed product rules

Confirmed by Brian in the project discussion, most recently 2026-11-16:

| Decision | Rule |
| --- | --- |
| Fee | 1% of the ticket amount the customer actually pays to the club, excluding other checkout fees. Use the amount after any discount that reduces that ticket payment. |
| Trigger | A successfully paid Pyng ticket sale creates the fee obligation. An abandoned or failed payment does not. |
| Refunds | Once earned, the fee remains owed. Later ticket refunds do not reverse it. Ticket-refund accounting is outside this fee calculation. |
| Chargebacks and reversals | A payment undone after Settled (for example a card chargeback) does not reverse the fee either, matching Stripe today: SPORTSHUB's Stripe application fee is not refunded on refunds or disputes (no fee-refund or dispute handling in the codebase as of 2026-11-22). |
| GST | No separate GST calculation, deduction or addition in this project calculation. This records the requested product rule, not a conclusion about either party's tax obligations. Do not reopen this as an unanswered product question. |
| Coverage | All clubs using Pyng. Stripe platform-fee exemptions do not apply. |
| Cadence | Monthly, one statement per club per calendar month (2026-11-23, superseding weekly). The cutoff day is not chosen. |
| Expected amounts | Brian estimates fees will be well below AUD 1,000 per club. This is an estimate, not a configured limit or provider-approved cap. |
| Rounding | Round up once per statement: `feeCents = ceil(sum(ticket price cents) / 100)`. Not per ticket, so a club pays at most 1 cent extra per statement. Brian confirmed neither Pyng payment method adds a surcharge, so the ticket price is what the buyer paid. |
| Rollout | No backfill. The first statement covers the first full month after collection starts. |

Example: AUD 2,000 of qualifying ticket sales creates an AUD 20 SPORTSHUB fee.
Later refunds do not reduce that fee.

## Keep these money flows separate

1. **Attendee pays club:** the existing Pyng ticket checkout. The destination is
   the bank account associated with the merchant's Pyng organisation/site.
2. **Club pays SPORTSHUB:** the proposed monthly collection of SPORTSHUB's 1% fee.
   Receiving ticket proceeds does not itself authorise these debits.
3. **SPORTSHUB or club pays Pyng:** Pyng's own commercial charges. Monthly
   language in those charges is not evidence of a monthly restriction on flow 2.

There is no verified public Pyng checkout split/application-fee feature that
performs flow 2 automatically during flow 1. Do not route all ticket proceeds
through SPORTSHUB as an assumed workaround.

## Publication scope

This public document contains SPORTSHUB product decisions, repository findings
and public-source research. Private correspondence, mailbox links and
negotiated commercial terms are intentionally excluded. Do not interpret their
absence as evidence that no private discussions exist. Obtain current written
provider confirmation before selecting a collection interface.

## Public documentation findings

All 20 pages in Pyng's public developer index and relevant public terms were
reviewed on 2026-11-15/16. No published BECS/DDR onboarding endpoint, platform-fee
split field, or specification for SPORTSHUB weekly fee collection was found. This is
a bounded documentation finding, not proof private capabilities do not exist.

| Surface | Verified documentation | Limit of the evidence |
| --- | --- | --- |
| Hosted checkout | One amount and site; order reference, return target and opaque metadata. No allocation/application-fee field. | Metadata does not implement a split. [Create session](https://www.docs.app.pyng.com.au/checkout/create-session.html). |
| B2B receivables | Invite customers, link their Pyng agreements, submit debit batches and query outcomes. | A documented product; suitability and access for this use case require confirmation. [Overview](https://www.docs.app.pyng.com.au/billing/index.html). |
| B2B onboarding | Invitation takes a customer reference; customer listing exposes link state and timestamps. | Published schemas do not establish bank eligibility, mandate frequency or maximum debit. [Invite](https://www.docs.app.pyng.com.au/billing/invite-customer.html), [customers](https://www.docs.app.pyng.com.au/billing/list-customers.html). |
| B2B batches | 1-1,000 rows, positive integer AUD cents, 90-day batch-reference idempotency. Row reference uniqueness is within a batch. Status includes per-row outcomes; a terminal batch does not mean every row succeeded. Documented processing window is up to 24 hours, polling no more frequently than every 30 seconds. | These guarantees apply to B2B; do not assume they cover another collection arrangement. [Submit](https://www.docs.app.pyng.com.au/billing/submit-batch.html), [status](https://www.docs.app.pyng.com.au/billing/get-batch-status.html). |
| Merchant terms §8(d) | Pyng may debit merchants for its own fees on the fifth business day monthly. Privacy policy mentions an unnamed third-party direct-debit processor. | Does not authorise SPORTSHUB collection, confirm BECS, or impose a weekly/monthly rule on SPORTSHUB. [Terms](https://www.pyng.com.au/merchant-terms), [privacy](https://www.pyng.com.au/privacy-policy-new). |
| Versioning | Billing versions says v1 Current; global history labels B2B 1.3.0-draft. | Confirm production availability instead of inferring it from public documentation. [Billing versions](https://www.docs.app.pyng.com.au/billing/versions.html), [history](https://www.docs.app.pyng.com.au/version-history.html). |

No source reviewed establishes a restriction to a particular number of
SPORTSHUB fee collections per month. Per-sale collection is not established as
technically prohibited. Brian chose monthly on 2026-11-23.

## BECS and PayTo

- **BECS** is the Bulk Electronic Clearing System used for traditional Australian
  direct debits. The payer gives a Direct Debit Request (DDR) and associated
  authority; a financial institution/provider submits debits. It is not an app
  clubs must install. Weekly variable collections are possible in principle.
  [AusPayNet](https://auspaynet.com.au/network/direct-debit-electronic-transfers),
  [NAB explanation](https://www.nab.com.au/business/payments-and-merchants/merchant-support-centre/direct-debit-how-it-works),
  [ASIC Moneysmart](https://moneysmart.gov.au/banking/direct-debits).
- **PayTo** uses payment agreements authorised through the payer's banking
  service. It can support recurring/variable payments within agreement terms;
  supported bank accounts and provider products vary. There is no general
  PayTo-only-monthly rule established here.
  [Australian Payments Plus FAQs](https://www.auspayplus.com.au/solutions/payto-faqs).
- Direct debit does not identify a specific provider or payment system. Confirm
  the rail, debit user, processor, authority and beneficiary before designing
  an integration.
- BECS processing is not equivalent to immediate, irreversible payment. Failed
  debits, later disputes and authority cancellation need explicit handling.
  The provider's notice, cutoff, holiday and settlement rules matter.

The reviewed [BECS Procedures E072, effective 1 October 2026](https://auspaynet.com.au/sites/default/files/2026-10/BECS%20Procedures%20-%20Version%20E072%20-%20Effective%201%20October%202026%20-%20public_0.pdf)
require authority/service-agreement arrangements and cover cancellations,
returns and record retention. Their 30-day notice provision for unfavourable
arrangement changes is not a universal 30-day notice before each variable
weekly debit. Obtain the sponsor/provider's applicable terms rather than
hard-coding a general notice period from this research.

## Current implementation evidence

Source baseline: commit `bd3d0013ff6f5c794388b06e33638435dccbda1f`, tree
`6942eb2e1849af48bea07e5a6f7a639642db821d` (rechecked 2026-11-22). Code was inspected in this worktree;
this does not prove deployment state, production configuration or bank receipts.
Recheck these symbols if implementing against a different revision.

Paths below are relative links for portability across clones:

- [PyngService.java](../../functions/lib/functions/src/main/java/com/functions/fulfilment/pyng/PyngService.java):
  organiser private `pyngSiteId` selects the merchant; checkout amount is built
  from ticket price and quantity. There is no organiser fee split in this path.
- [PyngCheckoutClient.java](../../functions/lib/functions/src/main/java/com/functions/fulfilment/pyng/PyngCheckoutClient.java):
  sends the hosted-checkout request. Provider `transactionId` is logged in the
  inspected status path, rather than forming a dedicated fee-reconciliation record.
- [PyngMetadata.java](../../functions/lib/functions/src/main/java/com/functions/fulfilment/models/fulfilmentSession/PyngMetadata.java):
  retains checkout/session/site/status information; it is not a fee ledger or
  collection authority model.
- [CheckoutService.java](../../functions/lib/functions/src/main/java/com/functions/stripe/services/CheckoutService.java):
  Stripe uses `applicationFeeAmount`, calculated with upward cent rounding on
  its base ticket total, and has exemptions. Do not inherit either its exemption
  policy or its rounding/discount calculation without an explicit Pyng decision.
- [WebhookService.java](../../functions/lib/functions/src/main/java/com/functions/stripe/services/WebhookService.java):
  `Order.applicationFees` is populated from Stripe shipping/customer-surcharge
  data. It is not a trustworthy record of SPORTSHUB's 1% receivable.

The reviewed implementation has no organiser platform-fee ledger, weekly
collection batch, debit authority lifecycle or fee-collection reconciliation
implementation. Persisted orders/fulfilment data are useful inputs, not proof
that collecting fees is implemented.

## Agreed design

Agreed with Brian on 2026-11-23. It supersedes the 2026-11-22 design of per-sale
fee records (`PlatformFeeAccruals`) written at Pyng settlement. With manual
monthly collection from a few clubs, a monthly query over Pyng tickets is
enough. Revisit per-sale records if collection is automated or volume grows.

### Principles

- Never overcharge a club. Bill only tickets the backend minted for a settled
  Pyng checkout.
- A ticket's status does not change the fee. A ticket the organiser later
  rejects still counts, matching the refund rule.
- Fees depend on tickets only after browsers can no longer create `Tickets` or
  `Orders` (step one).
- Each ticket is billed once: a statement covers one club and one calendar
  month, and a club-month is billed once.

### Where the fee comes from

After Pyng reports Settled, the fulfilment processor mints tickets in
`FulfilmentSessionTicketWriter.mintAndComplete`, through
`EventTicketPurchaseService.fulfillCompletedEventTicketPurchase`. Each ticket of
a Pyng sale stores:

| Ticket field | Value for a Pyng sale | Fee use |
| --- | --- | --- |
| `paymentProvider` | `PYNG` (`FulfilmentSessionTicketWriter.paymentProvider`) | Selects Pyng sales. |
| `type` | `GENERAL`. Tickets an organiser adds are `MANUAL` with no provider, even inside a paid order (`AttendeeService.setAttendeeTickets`). | Excludes organiser-added tickets. |
| `price` | The session's ticket price in cents, the same amount `PyngService` charges per ticket. Pyng checkouts apply no discount. | The fee base. |
| `status` | `APPROVED`; an organiser can later set `REJECTED`. | Ignored. |
| `purchaseDate` | Mint time. | Assigns the ticket to a month. |
| `eventId` | The event. | Leads to the event's `organiserId`, the club billed. |

A month's fee for a club is 1% of the sum of `price` over its tickets with
`paymentProvider == PYNG` and `type == GENERAL` and `purchaseDate` in that
month (Australia/Sydney), rounded up once.

Known gaps, accepted for manual monthly collection:

- The amount is the ticket price, not Pyng's reported `amountPaid`. They match
  while Pyng adds no surcharge and checkouts apply no discount. Revisit if
  either changes (Pyng changelog 1.1.0 added discount support).
- A paid sale whose tickets fail to mint (dead-lettered and never replayed)
  bills nothing; the buyer also received nothing.
- A ticket minted after its month's statement, for example a late dead-letter
  replay, is missed. Run each month's statement a few days after month end.

`FulfilmentSessions` must be closed to browser reads and writes so checkout
state comes only from the backend (step zero). The frontend has not accessed
that collection directly since its commented-out client code was deleted in
June 2025 (`7e3c8f46e`); only the collection-name constant remains. Partner and
Syrio integrations call the backend over HTTP and are unaffected. Merging to
`master` deploys Firestore rules to dev and prod in parallel
(`sportshub_cloud_functions_deploy_ci.yml`, job `deploy-firestore-rules`), at
the same time as functions, so test rules with the emulator before merging.

### Statements

Provisional; depends on the collection method.

- `PlatformFeeStatements/{organiserId}_{YYYY-MM}`: `organiserId`, `month`,
  `ticketCount`, `ticketTotalCents`, `feeCents`, `createdAt`. Created with
  `DocumentReference.create()`, so a club-month cannot be billed twice. Written
  by a backend job or CLI command, never edited. Admin SDK only, with an
  explicit client deny rule.
- `feeCents = (ticketTotalCents + 99) / 100` in `long` arithmetic, summed with
  `Math.addExact`.
- Payment tracking is added once the collection method is chosen.

Gates before statements ship:

- Organisers control `organiserId` on events through client rules. Make it
  server-controlled, or verify it, before billing depends on it.
- Decide whether SPORTSHUB's own organiser account, which is on the Pyng
  allowlist, is billed.

Deliberately left out: per-sale fee records, write-offs, adjustments, backfill
and a stored fee rate (1% is fixed in code; add a rate field if it changes).

### Step zero: checkout session hardening (ships first, separately)

A security and correctness fix to the existing Pyng checkout, independent of
fees. [owya490/social-sports#758](https://github.com/owya490/social-sports/pull/758)
is in review.

1. Firestore rules: close `FulfilmentSessions` to browser reads and writes.
   Verify with the emulator before merging, since merging deploys rules.
2. `refresh`/`settle` always confirm a terminal status with a live Pyng poll and
   act only on it; a live non-terminal status publishes nothing. Delete the
   uncalled `PyngService.refreshCheckout`/`recordTerminalStatus` path.
3. Session cleanup keeps a Pyng session it cannot read instead of deleting it
   (`FulfilmentService.shouldRetainPyngCheckout`).
4. Tests: a stored terminal status triggers a live poll; a live PENDING
   publishes nothing; cleanup keeps an unreadable Pyng session.

Keep the public pull request description at this level of detail.

### Step one: close browser writes to tickets and orders

1. Firestore rules: deny browser `create` on `Tickets` and `Orders`. Only the
   backend creates them; no frontend code writes either collection (checked
   2026-11-23). Reads stay as they are. Verify with the emulator before merging.
2. Then build the monthly statement query and its tests: Pyng `GENERAL` tickets
   count, `MANUAL` and Stripe tickets do not, `REJECTED` tickets still count,
   month boundaries, rounding and a second run for the same club-month.

Per-debit charges may dominate a small club's 1% fee. Compare costs with the
expected amounts before deciding any minimum or carry-forward rule. Do not
introduce a minimum charge to the club without a product decision.

### Cost terms to keep distinct

- **Failed-payment charge:** a fee the provider may charge SPORTSHUB when a
  club's debit fails, for example insufficient funds or invalid account details.
  Retries may be charged separately. It does not change the fee the club owes.
  Providers differ: Pinch's public pricing listed a $5 failed-payment fee for
  BECS direct debit when checked on 2026-11-21. Assume neither a charge nor its
  absence for Pyng. [Pinch pricing](https://getpinch.com.au/pricing).
- **Dishonour fee:** a fee the club's own bank may charge the club for a
  dishonoured debit. It is separate from any provider charge to SPORTSHUB and
  varies by bank.
- **Minimum commitment:** a SPORTSHUB-level minimum to use the service, such as
  a minimum number of clubs, debits, monthly collected value or monthly spend.
- **Minimum debit amount:** a limit on how small a single weekly collection can
  be. It affects carry-forward rules for low-volume clubs, unlike a minimum
  commitment.

## Open decisions and delivery gates

### Collection method

Brian does not want clubs to go through a direct-debit sign-up flow for Pyng.
Options, best club experience first:

1. **Deduct at payment through Pyng**, like Stripe's application fee. Not
   offered in Pyng's reply and not in its public docs; ask directly.
2. **Stripe-hosted monthly invoice.** SPORTSHUB invoices each club from its own
   Stripe account; the club pays by card or bank debit, optionally saving a
   card for automatic payment. A platform can debit a connected account's Stripe
   balance only where the platform is liable for its negative balance; Stripe
   recommends Billing for the others. SPORTSHUB creates Standard accounts
   (`functions/lib/stripe/create_account.py`), whose negative balances the
   platform is not liable for, so their Stripe balance cannot be debited.
   [Stripe account debits](https://docs.stripe.com/connect/account-debits).
3. **Monthly invoice paid by bank transfer**, outside any provider.
4. **Pyng manual monthly direct debit**, as Pyng offered: a signed agreement
   per club.
5. **Do not bill Pyng clubs yet**; calculate what would be owed.

Options 1 to 4 need step one and the statement query.

### Confirm with Pyng

- Whether Pyng can deduct SPORTSHUB's 1% at payment (collection option 1).
- If direct debit is used: what does each debit cost, what happens and costs
  when one fails, what monthly format and deadline Pyng needs, and how it
  confirms which debits succeeded.
- Whether a suitable service is available now, what further development would
  be required, delivery timing and any minimum volume.
- BECS, PayTo or another rail; debit user/provider/sponsor, organiser authority,
  funds flow and settlement recipient.
- Variable monthly collections, maximum and aggregate limits, required notices,
  submission cutoffs and holiday behavior.
- Hosted club onboarding, account eligibility, authorised signatories,
  authority evidence, revocation and bank-account changes.
- API, file or managed/manual interface, specification and sandbox; amount and
  reference submission, duplicate protection, status/settlement reports,
  failure/dispute signals and retry/cancellation rules.
- Setup, monthly, successful-debit, failed-debit, retry, dispute and minimum
  charges. Existing checkout pricing does not answer these questions.
- Both a minimum commitment and a minimum debit amount, if either applies. The
  email draft asks only about minimum commitments.

### Decide internally after provider confirmation

- Debit day and retry policy (maximum attempts and spacing), once Pyng's
  failed-debit charges and retry rules are known.
- Map club, organiser user, legal billing entity and authority: one person can
  administer multiple clubs, and changing ownership must not misassign debts.
- What happens before authority is active, after cancellation, or after a failed
  collection: reminders, retries, carry-forward and any restriction on new sales.
- Low-balance economics and collection thresholds, if needed.
- Evidence and reconciliation expectations before pilot, then staged rollout.

### Adjacent integration issues, separate from fee policy

- Pyng merchant terms describe refunds using a merchant PayTo agreement. Clubs
  unable to authorise PayTo may need another supported attendee-refund route.
  This does not change the agreed non-reversal of SPORTSHUB's fee and is not a
  requirement to implement ticket-refund accounting in this initiative.
- Pyng's B2B docs (checked 2026-11-22): `batchReference` is unique per partner
  with 90-day idempotency, and `rowReference` is unique within a batch. Ask
  Pyng the format, maximum length and allowed characters, which are not
  documented, for whatever collection service it offers.
- Pyng documents `Expired` as final ("no longer payable"). Ask whether a
  `Declined` checkout can still become `Settled`.
- Pyng's merchant restriction policy excludes payment processors collecting on
  behalf of merchants. Confirm the partner arrangement if funds flow changes;
  do not infer permission to pool ticket proceeds in SPORTSHUB's account.
  [Restriction policy](https://www.pyng.com.au/merchant-transaction-restriction-policy).

## Email draft - not sent by an agent

Brian's copy has a personalised greeting and opening that are left out here.

Subject: Weekly collection of SPORTSHUB's 1% platform fee

Hi Pyng team,

We'd like to collect SPORTSHUB's 1% fee on successful ticket sales from each
club weekly, excluding other checkout fees. Ticket payments would continue
going directly to clubs through Pyng.

Could you confirm:

1. **Responsibilities:** What would Pyng handle, and what would we need to
   build or operate? In particular, club authorisation, supplying fee amounts,
   collecting payments and reporting outcomes. Is this service available now?
2. **Weekly collection:** Can it support a different amount per club each week,
   and are there any limits or notice requirements?
3. **Costs:** What setup, ongoing, per-debit or failed-payment charges and
   minimum commitments would apply?

Any documentation or a brief outline of the proposed flow would be helpful.

Thanks,
Brian

## Pyng's reply

Received by 2026-11-23 (private correspondence, summarised): Pyng would need a
separate direct-debit agreement signed by each club, would process debits
manually once a month at first, would consider automating with enough clubs,
and will send a template agreement. Costs, failed-debit handling and the
monthly data format were not covered.

## Maintenance and handoff

- Read this document at the start of work on Pyng fees. Treat agreed product
  rules as the baseline; revalidate dated code/provider evidence when relevant.
- Update this same file when Brian makes a decision or related behavior ships.
  Record date, public source, status and consequence. Provider responses may be
  private: obtain publication approval before including their contents here.
  Do not promote a proposed design to a confirmed capability without evidence.
- Keep a short decision history below. Mark superseded decisions explicitly;
  remove resolved questions from the active list and record the answer/source.
- Once implementation is approved, add its plan/PR links, tested revision and
  deployment evidence here. Code/tests describe behavior; this file preserves
  intent, constraints and unresolved questions. A merged PR alone is not bank
  settlement proof.
- Keep credentials, bank details, private email content and links, negotiated
  commercial terms and unnecessary personal information out of this public
  repository, including commit history. Keep private source material in an
  access-controlled location; reference public evidence here.
- Keep task-by-task scratch notes in `.tmp/`; keep enduring decisions here.
  Split out an ADR only when a substantial architecture choice needs its own
  rationale, and link it here rather than duplicating the rules.
- Local changes survive sessions in this checkout. Sharing across machines or
  fresh clones requires an approved commit/push/merge. No such publication is
  implied by creating this document.

### Decision history

| Date | Decision or evidence | Status |
| --- | --- | --- |
| 2026-11-15/16 | Public docs and source inspected; no public split field or SPORTSHUB weekly collection specification found. | Research baseline; provider details require confirmation. |
| 2026-11-16 | Brian confirmed 1% of paid ticket amount, no separate GST calculation, no reversal for ticket refunds, all Pyng clubs and weekly cadence preference. | Accepted product rules; schedule mechanics remain open. |
| 2026-11-16 | Brian requested a persistent repo knowledge base and an unsent Pyng email draft. | Documentation authorised; sending and implementation are not authorised by this request. |
| 2026-11-16 | Brian approved a public documentation PR with private correspondence details removed. | Publication authorised for this version; no email sending or implementation authorised. |
| 2026-11-16 | [owya490/social-sports#743](https://github.com/owya490/social-sports/pull/743) merged. Brian took the email to send himself. | Next gate: Pyng's reply on responsibilities, weekly support and costs. |
| 2026-11-19/21 | Clarified failed-payment, dishonour, minimum-commitment and minimum-debit terms; checked Pinch's public BECS pricing. | Reference only; Pyng's charges remain unconfirmed. |
| 2026-11-22 | Brian agreed the fee data model after two independent reviews: immutable per-sale fee records created at Pyng settlement, claim-based statements, derived status; no backfill, write-offs or adjustments; round up once per statement; close `FulfilmentSessions` to the browser. | Superseded on 2026-11-23 by ticket-based fees. |
| 2026-11-23 | Pyng replied offering manual monthly direct debit with a signed agreement per club. | Recorded in summary. |
| 2026-11-23 | Brian chose to calculate fees from Pyng tickets with a monthly query, superseding per-sale fee records, and declined a club direct-debit sign-up flow. Stripe account debits ruled out for Standard accounts. | Collection method open; next: close browser ticket and order creates. |
| 2026-11-22 | Final adversarial review: always re-verify status with Pyng, record the fee before the purchaser check, never bill `amountPaid` above the requested amount, keep unreadable Pyng sessions during cleanup, and gate statements on the billing key and client-writable organiser and site fields. Corrected: merging deploys Firestore rules. | Step one spec updated. |

Generated with AI assistance.
