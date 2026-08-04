"""
Sync inventory into eventTicketTypes from top-level fields.

Covers:
  - All active events: Events/Active/{Public,Private} (full collection scan)
  - Inactive events with eventTicketTypes: Events/InActive/{Public,Private}
    (full scan; processes docs where eventTicketTypes is present)
  - Active recurrence templates: RecurringEvents/Active/{Public,Private}
    (writes eventData.eventTicketTypes from eventData.price/capacity/vacancy)

Direction: top-level price/capacity/vacancy -> eventTicketTypes.General Admission
Adds General Admission when missing (other ticket types are left unchanged).

Usage (after deploying with import in functions/main.py):
  Events:
    GET ?start=true&dryRun=true
    GET ?start=true&dryRun=false
  Recurrence templates:
    GET /sync_recurrence_template_ticket_types?start=true&dryRun=true
    GET /sync_recurrence_template_ticket_types?start=true&dryRun=false
"""

import json
import uuid

from firebase_functions import https_fn, options
from lib.constants import (
    ACTIVE_PRIVATE,
    ACTIVE_PUBLIC,
    ACTIVE_RECURRENCE_PRIVATE,
    ACTIVE_RECURRENCE_PUBLIC,
    INACTIVE_PRIVATE,
    INACTIVE_PUBLIC,
    db,
)
from lib.logging import Logger

GENERAL_TICKET_TYPE_NAME = "General Admission"
ACTIVE_EVENT_PATHS = [ACTIVE_PUBLIC, ACTIVE_PRIVATE]
INACTIVE_EVENT_PATHS = [INACTIVE_PUBLIC, INACTIVE_PRIVATE]
ACTIVE_RECURRENCE_TEMPLATE_PATHS = [ACTIVE_RECURRENCE_PUBLIC, ACTIVE_RECURRENCE_PRIVATE]


def _is_truthy(value: str) -> bool:
    return str(value).lower() in ["1", "true", "yes", "y"]


def _find_general_ticket_type(event_ticket_types: dict) -> tuple[str | None, dict | None]:
    """Return (type_id, type_data) for General Admission by name only."""
    if not event_ticket_types:
        return None, None

    for type_id, type_data in event_ticket_types.items():
        if isinstance(type_data, dict) and type_data.get("name") == GENERAL_TICKET_TYPE_NAME:
            return type_id, type_data

    return None, None


def _build_synced_ticket_type(
    type_id: str,
    existing: dict | None,
    price: int,
    capacity: int,
    vacancy: int,
) -> dict:
    return {
        "id": type_id,
        "name": (existing or {}).get("name") or GENERAL_TICKET_TYPE_NAME,
        "price": price,
        "capacity": capacity,
        "vacancy": vacancy,
    }


def _plan_inventory_sync(
    doc_id: str,
    collection_path: str,
    inventory_data: dict,
    *,
    id_field: str,
) -> dict:
    """Plan sync of top-level price/capacity/vacancy into eventTicketTypes."""
    price = inventory_data.get("price")
    capacity = inventory_data.get("capacity")
    vacancy = inventory_data.get("vacancy")
    event_ticket_types = inventory_data.get("eventTicketTypes") or {}

    base = {
        id_field: doc_id,
        "collectionPath": collection_path,
        "topLevel": {"price": price, "capacity": capacity, "vacancy": vacancy},
    }

    if price is None or capacity is None or vacancy is None:
        return {
            **base,
            "action": "skip_missing_top_level",
            "reason": "Missing top-level price, capacity, and/or vacancy",
        }

    type_id, existing = _find_general_ticket_type(event_ticket_types)

    created = type_id is None
    if created:
        type_id = str(uuid.uuid4())

    synced = _build_synced_ticket_type(type_id, existing, price, capacity, vacancy)
    already_in_sync = (
        not created
        and existing is not None
        and existing.get("id") == synced["id"]
        and existing.get("name") == synced["name"]
        and existing.get("price") == synced["price"]
        and existing.get("capacity") == synced["capacity"]
        and existing.get("vacancy") == synced["vacancy"]
    )

    if already_in_sync:
        return {
            **base,
            "action": "noop_already_synced",
            "ticketTypeId": type_id,
        }

    updated_map = dict(event_ticket_types)
    updated_map[type_id] = synced

    return {
        **base,
        "action": "create_ticket_type" if created else "update_ticket_type",
        "ticketTypeId": type_id,
        "before": existing,
        "after": synced,
        "eventTicketTypes": updated_map,
    }


def _plan_event_sync(event_id: str, collection_path: str, data: dict) -> dict:
    return _plan_inventory_sync(event_id, collection_path, data, id_field="eventId")


def _plan_recurrence_template_sync(template_id: str, collection_path: str, data: dict) -> dict:
    event_data = data.get("eventData")
    if not isinstance(event_data, dict):
        return {
            "recurrenceTemplateId": template_id,
            "collectionPath": collection_path,
            "action": "skip_missing_event_data",
            "reason": "Template is missing eventData map",
        }
    return _plan_inventory_sync(
        template_id, collection_path, event_data, id_field="recurrenceTemplateId"
    )


def _stream_inactive_events_with_ticket_types(collection_path: str):
    """
    Inactive events that already have an eventTicketTypes field.

    Firestore's Python client rejects != None; scan and filter in-process instead.
    """
    for doc in db.collection(collection_path).stream():
        data = doc.to_dict() or {}
        if data.get("eventTicketTypes") is not None:
            yield doc


def _process_event_document(
    doc,
    collection_path: str,
    buckets: dict,
    dry_run: bool,
    logger: Logger,
) -> None:
    event_id = doc.id
    try:
        data = doc.to_dict() or {}
        plan = _plan_event_sync(event_id, collection_path, data)
        if plan["action"] in ("create_ticket_type", "update_ticket_type") and not dry_run:
            doc.reference.update({"eventTicketTypes": plan["eventTicketTypes"]})
        _accumulate_plan(plan, buckets)
    except Exception as exc:
        logger.error(f"Failed syncing {collection_path}/{event_id}: {exc}")
        buckets["failed"].append(
            {
                "eventId": event_id,
                "collectionPath": collection_path,
                "error": str(exc),
            }
        )


def _accumulate_plan(plan: dict, buckets: dict) -> None:
    action = plan["action"]
    if action == "create_ticket_type":
        buckets["created"].append(plan)
    elif action == "update_ticket_type":
        buckets["updated"].append(plan)
    elif action == "noop_already_synced":
        buckets["noop"].append(plan)
    else:
        buckets["skipped"].append(plan)


def _require_start_flag(req: https_fn.Request, logger: Logger) -> https_fn.Response | None:
    start_param = req.args.get("start", "") if req.args else ""
    if _is_truthy(start_param):
        return None
    summary = {
        "started": False,
        "reason": "Missing start flag. Pass ?start=true to execute.",
        "dryRun": True,
    }
    logger.info(f"Sync skipped: {summary}")
    return https_fn.Response(json.dumps(summary), status=200, content_type="application/json")


def _dry_run_flag(req: https_fn.Request) -> bool:
    dry_run_param = req.args.get("dryRun", "true") if req.args else "true"
    return _is_truthy(dry_run_param)


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["get", "post"],
    ),
    region="australia-southeast1",
    timeout_sec=540,
    memory=options.MemoryOption.MB_512,
)
def sync_event_ticket_types(req: https_fn.Request) -> https_fn.Response:
    uid = str(uuid.uuid4())
    logger = Logger(f"firebase_sync_event_ticket_types_logger_{uid}")
    logger.add_tag("uuid", uid)

    skipped_response = _require_start_flag(req, logger)
    if skipped_response is not None:
        return skipped_response

    dry_run = _dry_run_flag(req)
    logger.info(
        f"Starting eventTicketTypes sync (active scan + inactive eventTicketTypes query). "
        f"dryRun={dry_run}"
    )

    buckets = {"created": [], "updated": [], "noop": [], "skipped": [], "failed": []}
    processed_keys: set[str] = set()

    for collection_path in ACTIVE_EVENT_PATHS:
        for doc in db.collection(collection_path).stream():
            processed_keys.add(f"{collection_path}/{doc.id}")
            _process_event_document(doc, collection_path, buckets, dry_run, logger)

    for collection_path in INACTIVE_EVENT_PATHS:
        for doc in _stream_inactive_events_with_ticket_types(collection_path):
            key = f"{collection_path}/{doc.id}"
            if key in processed_keys:
                continue
            processed_keys.add(key)
            _process_event_document(doc, collection_path, buckets, dry_run, logger)

    summary = {
        "started": True,
        "dryRun": dry_run,
        "activeCollections": ACTIVE_EVENT_PATHS,
        "inactiveCollectionsQueried": INACTIVE_EVENT_PATHS,
        "inactiveFilter": "eventTicketTypes is not null (client-side)",
        "processedDocumentCount": len(processed_keys),
        "counts": {key: len(value) for key, value in buckets.items()},
        **buckets,
    }
    logger.info(
        "Finished eventTicketTypes sync. "
        f"dryRun={dry_run} processed={len(processed_keys)} "
        f"created={len(buckets['created'])} updated={len(buckets['updated'])} "
        f"noop={len(buckets['noop'])} skipped={len(buckets['skipped'])} failed={len(buckets['failed'])}"
    )
    return https_fn.Response(json.dumps(summary, default=str), status=200, content_type="application/json")


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["get", "post"],
    ),
    region="australia-southeast1",
    timeout_sec=540,
    memory=options.MemoryOption.MB_512,
)
def sync_recurrence_template_ticket_types(req: https_fn.Request) -> https_fn.Response:
    """
    Seed eventData.eventTicketTypes on Active recurrence templates from
    eventData.price / capacity / vacancy.
    """
    uid = str(uuid.uuid4())
    logger = Logger(f"firebase_sync_recurrence_template_ticket_types_logger_{uid}")
    logger.add_tag("uuid", uid)

    skipped_response = _require_start_flag(req, logger)
    if skipped_response is not None:
        return skipped_response

    dry_run = _dry_run_flag(req)
    logger.info(f"Starting Active recurrence template eventTicketTypes sync. dryRun={dry_run}")

    buckets = {"created": [], "updated": [], "noop": [], "skipped": [], "failed": []}

    for collection_path in ACTIVE_RECURRENCE_TEMPLATE_PATHS:
        docs = db.collection(collection_path).stream()
        for doc in docs:
            template_id = doc.id
            try:
                data = doc.to_dict() or {}
                plan = _plan_recurrence_template_sync(template_id, collection_path, data)
                if plan["action"] in ("create_ticket_type", "update_ticket_type") and not dry_run:
                    # Nested field update keeps recurrenceData and other eventData fields intact.
                    doc.reference.update({"eventData.eventTicketTypes": plan["eventTicketTypes"]})
                _accumulate_plan(plan, buckets)
            except Exception as exc:
                logger.error(f"Failed syncing {collection_path}/{template_id}: {exc}")
                buckets["failed"].append(
                    {
                        "recurrenceTemplateId": template_id,
                        "collectionPath": collection_path,
                        "error": str(exc),
                    }
                )

    summary = {
        "started": True,
        "dryRun": dry_run,
        "collections": ACTIVE_RECURRENCE_TEMPLATE_PATHS,
        "counts": {key: len(value) for key, value in buckets.items()},
        **buckets,
    }
    logger.info(
        "Finished Active recurrence template eventTicketTypes sync. "
        f"dryRun={dry_run} created={len(buckets['created'])} updated={len(buckets['updated'])} "
        f"noop={len(buckets['noop'])} skipped={len(buckets['skipped'])} failed={len(buckets['failed'])}"
    )
    return https_fn.Response(json.dumps(summary, default=str), status=200, content_type="application/json")
