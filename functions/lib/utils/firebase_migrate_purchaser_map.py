import uuid
from datetime import datetime

from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud.firestore import Transaction
from lib.constants import (
    ACTIVE_PRIVATE,
    ACTIVE_PUBLIC,
    EVENT_METADATA,
    INACTIVE_PRIVATE,
    INACTIVE_PUBLIC,
    db,
)
from lib.logging import Logger


def _is_truthy(value: str) -> bool:
    return str(value).lower() in ["1", "true", "yes", "y"]


def _get_event_price(event_id: str) -> int:
    """Look up event price from Active/InActive Private/Public. Returns 0 if not found."""
    for path in [ACTIVE_PRIVATE, ACTIVE_PUBLIC, INACTIVE_PRIVATE, INACTIVE_PUBLIC]:
        doc = db.collection(path).document(event_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data and "price" in data:
                return data["price"]
    return 0


@firestore.transactional
def _create_backfill_order_and_tickets(
    transaction: Transaction,
    event_id: str,
    missing_count: int,
    price: int,
    event_metadata_ref,
) -> str:
    """Create one backfill Order and missing_count Tickets. Returns new order_id."""
    purchase_time = datetime.now()
    order_ref = db.collection("Orders").document()
    ticket_ids = []

    for _ in range(missing_count):
        ticket_ref = db.collection("Tickets").document()
        transaction.set(
            ticket_ref,
            {
                "eventId": event_id,
                "orderId": order_ref.id,
                "price": price,
                "purchaseDate": purchase_time,
                "status": "APPROVED",
                "type": "MANUAL",
                "formResponseId": None,
            },
        )
        ticket_ids.append(ticket_ref.id)

    transaction.set(
        order_ref,
        {
            "datePurchased": purchase_time,
            "email": "info@sportshub.net.au",
            "fullName": "Manual Backfill",
            "phone": "",
            "applicationFees": 0,
            "discounts": 0,
            "tickets": ticket_ids,
            "stripePaymentIntentId": "",
            "status": "APPROVED",
            "type": "MANUAL",
        },
    )

    transaction.update(
        event_metadata_ref,
        {
            "orderIds": firestore.ArrayUnion([order_ref.id]),
        },
    )
    return order_ref.id


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["get", "post"],
    ),
    region="australia-southeast1",
)
def migrate_purchaser_map(req: https_fn.Request) -> https_fn.Response:
    uid = str(uuid.uuid4())
    logger = Logger(f"firebase_migrate_purchaser_map_logger_{uid}")
    logger.add_tag("uuid", uid)

    # Safety gate: Firebase may ping this endpoint during deployment.
    start_param = req.args.get("start", "") if req.args else ""
    start = _is_truthy(start_param)
    if not start:
        summary = {
            "started": False,
            "reason": "Missing start flag. Pass ?start=true to execute.",
            "dryRun": True,
        }
        logger.info(f"Migration skipped: {summary}")
        return https_fn.Response(str(summary), status=200)

    # Safe default: run in dry mode unless explicitly disabled.
    dry_run_param = req.args.get("dryRun", "true") if req.args else "true"
    dry_run = _is_truthy(dry_run_param)
    logger.info(f"Starting purchaser map migration. dryRun={dry_run}")

    events_metadata_ref = db.collection(EVENT_METADATA)
    metadata_docs = events_metadata_ref.stream()

    backfilled_events = []
    excess_events = []
    failed_events = []

    for doc in metadata_docs:
        event_id = doc.id
        try:
            data = doc.to_dict() or {}
            purchaser_map = data.get("purchaserMap") or {}
            order_ids = data.get("orderIds") or []

            if not purchaser_map:
                continue

            expected_total = sum(
                p.get("totalTicketCount", 0) for p in purchaser_map.values()
            )

            actual_total = 0
            for order_id in order_ids:
                order_doc = db.collection("Orders").document(order_id).get()
                if order_doc.exists:
                    order_data = order_doc.to_dict() or {}
                    tickets = order_data.get("tickets") or []
                    actual_total += len(tickets)

            if actual_total > expected_total:
                delta = actual_total - expected_total
                logger.info(
                    f"Excess tickets: eventId={event_id} expected={expected_total} actual={actual_total} delta={delta}"
                )
                excess_events.append({"eventId": event_id, "delta": delta})

            elif actual_total < expected_total:
                missing_count = expected_total - actual_total
                price = _get_event_price(event_id)
                if dry_run:
                    logger.info(
                        f"Dry run backfill: eventId={event_id} expected={expected_total} actual={actual_total} "
                        f"missing={missing_count} price={price}"
                    )
                    backfilled_events.append(
                        {
                            "eventId": event_id,
                            "missingCount": missing_count,
                            "orderId": None,
                            "dryRun": True,
                        }
                    )
                else:
                    event_metadata_ref_doc = db.collection(EVENT_METADATA).document(
                        event_id
                    )

                    transaction = db.transaction()
                    new_order_id = _create_backfill_order_and_tickets(
                        transaction,
                        event_id,
                        missing_count,
                        price,
                        event_metadata_ref_doc,
                    )

                    logger.info(
                        f"Backfilled: eventId={event_id} expected={expected_total} actual={actual_total} "
                        f"missing={missing_count} newOrderId={new_order_id}"
                    )
                    backfilled_events.append(
                        {
                            "eventId": event_id,
                            "missingCount": missing_count,
                            "orderId": new_order_id,
                            "dryRun": False,
                        }
                    )
        except Exception as e:
            error_message = f"Failed to process eventId={event_id}: {e}"
            logger.error(error_message)
            failed_events.append({"eventId": event_id, "error": str(e)})

    summary = {
        "backfilledCount": len(backfilled_events),
        "excessCount": len(excess_events),
        "failedCount": len(failed_events),
        "started": True,
        "dryRun": dry_run,
        "backfilledEvents": backfilled_events,
        "excessEvents": excess_events,
        "failedEvents": failed_events,
    }
    logger.info(f"Migration complete: {summary}")
    return https_fn.Response(str(summary), status=200)
