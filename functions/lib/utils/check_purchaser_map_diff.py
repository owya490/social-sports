import json

from lib.constants import EVENT_METADATA, db

# Hardcode this as needed.
EVENT_ID = "REPLACE_WITH_EVENT_ID"


def check_purchaser_map_diff_for_event(event_id: str) -> dict:
    """
    Compare purchaserMap totals against Orders/Tickets for one event.
    """
    metadata_doc = db.collection(EVENT_METADATA).document(event_id).get()
    if not metadata_doc.exists:
        return {
            "eventId": event_id,
            "exists": False,
            "error": "Event metadata not found",
        }

    metadata = metadata_doc.to_dict() or {}
    purchaser_map = metadata.get("purchaserMap") or {}
    order_ids = metadata.get("orderIds") or []

    expected_total = sum(
        purchaser.get("totalTicketCount", 0) for purchaser in purchaser_map.values()
    )
    expected_by_email = {}
    for purchaser in purchaser_map.values():
        purchaser_email = purchaser.get("email", "")
        purchaser_count = purchaser.get("totalTicketCount", 0)
        expected_by_email[purchaser_email] = (
            expected_by_email.get(purchaser_email, 0) + purchaser_count
        )

    actual_total_from_orders = 0
    existing_ticket_doc_count_from_orders = 0
    missing_order_ids = []
    missing_ticket_ids = []
    actual_by_email = {}

    for order_id in order_ids:
        order_doc = db.collection("Orders").document(order_id).get()
        if not order_doc.exists:
            missing_order_ids.append(order_id)
            continue

        order_data = order_doc.to_dict() or {}
        ticket_ids = order_data.get("tickets") or []
        order_email = order_data.get("email", "")
        actual_total_from_orders += len(ticket_ids)
        actual_by_email[order_email] = actual_by_email.get(order_email, 0) + len(ticket_ids)

        for ticket_id in ticket_ids:
            ticket_doc = db.collection("Tickets").document(ticket_id).get()
            if ticket_doc.exists:
                existing_ticket_doc_count_from_orders += 1
            else:
                missing_ticket_ids.append(ticket_id)

    tickets_by_event_count = len(
        db.collection("Tickets").where("eventId", "==", event_id).get()
    )
    purchaser_emails = sorted(set(expected_by_email.keys()) | set(actual_by_email.keys()))
    purchaser_diffs = [
        {
            "email": email,
            "expectedFromPurchaserMap": expected_by_email.get(email, 0),
            "actualFromOrders": actual_by_email.get(email, 0),
            "deltaActualMinusExpected": actual_by_email.get(email, 0)
            - expected_by_email.get(email, 0),
        }
        for email in purchaser_emails
    ]

    return {
        "eventId": event_id,
        "exists": True,
        "expectedFromPurchaserMap": expected_total,
        "actualFromOrderTicketLists": actual_total_from_orders,
        "actualExistingTicketDocsFromOrders": existing_ticket_doc_count_from_orders,
        "actualTicketDocsByEventIdQuery": tickets_by_event_count,
        "deltaOrderListsMinusPurchaserMap": actual_total_from_orders - expected_total,
        "deltaExistingTicketDocsMinusPurchaserMap": (
            existing_ticket_doc_count_from_orders - expected_total
        ),
        "deltaTicketsByEventQueryMinusPurchaserMap": tickets_by_event_count
        - expected_total,
        "orderIdsCount": len(order_ids),
        "missingOrderIds": missing_order_ids,
        "missingTicketIds": missing_ticket_ids,
        "purchaserDiffs": purchaser_diffs,
    }


if __name__ == "__main__":
    report = check_purchaser_map_diff_for_event(EVENT_ID)
    print(json.dumps(report, indent=2, default=str))
