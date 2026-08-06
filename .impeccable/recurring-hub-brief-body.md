# Organiser v2 recurring template hub

## Scope & mode
Operate. Single recurrence-template hub at `/organiser/v2/event/recurring-events/[id]`. Extends event hub world — not a new identity.

## Audience & job
Organisers from v2 recurring list. First job: scan/edit template Details like a single event. Second: manage Past events and Recurrence schedule. Settings for payment/waitlist prefs.

## Direction
Approved Comp A overview twin. Quiet chrome (← Recurring, title, Weekly · location meta, Template chip, Pause). Tabs: Details · Past events · Recurrence · Settings. Images fold into Details Change photo panel. Reuse EventHubListing / EventHubPanel / EventHubEditForm grammar.

## Confirmed choices
- Tabs: mirror-plus-series (Details · Past events · Recurrence · Settings)
- Details composition: overview-twin (Comp A)
- Images in Details panels, not a peer tab

## Approved comps
- Details overview: `.impeccable/mocks/recurring-hub-comp-a-overview-twin.png`

## Memorable moment
Open template → same two-column Details preview as event hub → Edit details / Change photo panels; Recurrence tab for schedule.

## Unresolved
None blocking. Public `/event/[id]` URL for templates may not resolve — hide Event page CTA; Template chip is non-interactive.

## Implementation fidelity inventory
| Ingredient | Medium |
|---|---|
| Quiet chrome | HTML/CSS (RecurringHubChrome) |
| Peer tabs | HTML tabs (RecurringHubNav) |
| Details overview twin | Reuse EventHubListing |
| Past events list | HTML table / flush rows |
| Recurrence schedule | Restyle existing form into EventHubStage |
| Settings flush switches | EventHubPreferenceRow pattern |
| Yellow primary | Save / Update only |
