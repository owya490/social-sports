# Pyng organiser platform fees

Last updated: 2026-11-21 (Australia/Sydney).
Product decision owner: Brian.
Status: discovery and design; fee collection is not implemented in the inspected checkout.

## Start here

SPORTSHUB wants to collect its own 1% fee from clubs that receive Pyng ticket
payments. Weekly collection is the chosen product direction. The provider
service, division of responsibilities, payment system and price still need
confirmation before implementation.

This is the canonical project context for this initiative, not a provider
contract or an instruction to implement, send email, activate collections or
deploy. Brian has authorised research, this document and an unsent email draft.
Current task: obtain a written collection specification and quote, then review
the implementation design. No agent has sent the email below; Brian is sending
his own copy. Whether it has been sent, and any reply, is not recorded here.

## Agreed product rules

Confirmed by Brian in the project discussion, most recently 2026-11-16:

| Decision | Rule |
| --- | --- |
| Fee | 1% of the ticket amount the customer actually pays to the club, excluding other checkout fees. Use the amount after any discount that reduces that ticket payment. |
| Trigger | A successfully paid Pyng ticket sale creates the fee obligation. An abandoned or failed payment does not. |
| Refunds | Once earned, the fee remains owed. Later ticket refunds do not reverse it. Ticket-refund accounting is outside this fee calculation. |
| GST | No separate GST calculation, deduction or addition in this project calculation. This records the requested product rule, not a conclusion about either party's tax obligations. Do not reopen this as an unanswered product question. |
| Coverage | All clubs using Pyng. Stripe platform-fee exemptions do not apply. |
| Cadence | Accumulate fees and collect weekly, subject to provider confirmation. Exact weekday, cutoff and notice timing are not yet chosen. |
| Expected amounts | Brian estimates fees will be well below AUD 1,000 per club. This is an estimate, not a configured limit or provider-approved cap. |

Example: AUD 2,000 of qualifying ticket sales creates an AUD 20 SPORTSHUB fee.
Later refunds do not reduce that fee. Fractional-cent rounding remains undecided.

## Keep these money flows separate

1. **Attendee pays club:** the existing Pyng ticket checkout. The destination is
   the bank account associated with the merchant's Pyng organisation/site.
2. **Club pays SPORTSHUB:** the proposed weekly collection of SPORTSHUB's 1% fee.
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
technically prohibited; weekly is Brian's chosen direction, with provider
support and economics still to be confirmed.

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

Source baseline: commit `5ee6cc99ed99efe46797a02aacc97f74f34adb04`, tree
`67838984e23cd7c0ea6b45918e33296e7a952c33`. Code was inspected in this worktree;
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

## Proposed design, not yet approved for implementation

1. Record a fee accrual exactly once for each authoritative successful Pyng sale.
   Preserve the club/legal billing identity, sale reference, qualifying amount,
   fee rate and computed fee. Do not accrue from a browser redirect alone.
2. Aggregate outstanding eligible accruals per club into an immutable weekly
   statement with sale-level traceability. Freeze membership so rerunning a job
   cannot charge the same sale twice.
3. Collect under the club's separate valid authority, using the confirmed
   provider interface and a stable collection reference. Avoid storing bank
   details locally if the provider can host authorisation.
4. Track submitted/pending, successful, failed, returned and disputed outcomes
   independently from the ticket-sale state. Reconcile unknown outcomes before
   retrying. Retrying collection must not create a new fee obligation.
5. Keep ordinary ticket refunds out of fee reversal logic. Billing errors,
   duplicate charges and returned collections still need correction/recovery.

Use AUD integer cents for money storage, with an explicit fractional-cent rule
for the 1% calculation. Whether to round per ticket, per order or per weekly
aggregate is unresolved; these give different results for small sales. Do not
silently adopt Stripe's `ceil` behavior.

A candidate period is Monday 00:00 to the next Monday 00:00 in Australia/Sydney,
with an agreed later debit date after any required notice. This is an example,
not an accepted schedule. Account for DST and business-day holidays. If notice
requires collecting an older completed week, the collection cadence can still
remain weekly. Define treatment of late payment confirmation and avoid
reopening already issued statements without a traceable adjustment.

Per-debit charges may dominate a small club's 1% fee. Compare weekly costs with
the expected amounts before deciding any minimum collection/carry-forward rule.
Do not introduce a minimum charge to the club without a product decision.

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

### Confirm with Pyng

- Whether a suitable service is available now, what further development would
  be required, delivery timing and any minimum volume.
- BECS, PayTo or another rail; debit user/provider/sponsor, organiser authority,
  funds flow and settlement recipient.
- Variable weekly collections, maximum and aggregate limits, required notices,
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

- Rounding basis, exact weekly period/debit date, late confirmations and first
  billing period. Do not imply retrospective authorisation to debit old sales.
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
- Confirm stable sale correlation and missing-redirect recovery before relying
  on checkout data for accrual. Published session status and webhook references
  differ; requested amount must not be substituted for actual paid ticket
  amount if discounts can change it.
  [Session status](https://www.docs.app.pyng.com.au/checkout/get-session-status.html),
  [webhook](https://www.docs.app.pyng.com.au/checkout/push-transaction-status.html).
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

Generated with AI assistance.
