###############################
# STRIPE WEBHOOKS INTEGRATION #
###############################

import hashlib
import json
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlparse

import requests
import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from lib.constants import IS_PROD, db
from lib.emails.cancel_event import send_cancellation_email
from lib.emails.purchase_event import (PurchaseEventRequest,
                                       send_email_on_purchase_event)
from lib.logging import Logger
from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET
from stripe import Event, LineItem, ListObject


@dataclass
class SessionMetadata:
    eventId: str
    isPrivate: bool
    completeFulfilmentSession: bool
    fulfilmentSessionId: str
    endFulfilmentEntityId: str

    def __init__(
        self,
        eventId,
        isPrivate,
        fulfilmentSessionId,
        completeFulfilmentSession,
        endFulfilmentEntityId,
    ):
        self.eventId = eventId
        if isinstance(isPrivate, str):
            self.isPrivate = isPrivate.lower() == "true"
        else:
            self.isPrivate = isPrivate

        if isinstance(completeFulfilmentSession, str):
            self.completeFulfilmentSession = completeFulfilmentSession.lower() == "true"
        else:
            self.completeFulfilmentSession = completeFulfilmentSession
        self.fulfilmentSessionId = fulfilmentSessionId
        self.endFulfilmentEntityId = endFulfilmentEntityId

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")
        if not isinstance(self.isPrivate, bool):
            raise ValueError("Is Private must be provided as a boolean.")
        if not isinstance(self.completeFulfilmentSession, bool):
            raise ValueError(
                "Complete Fulfilment Session must be provided as a boolean."
            )
        if self.fulfilmentSessionId is not None and not isinstance(
            self.fulfilmentSessionId, str
        ):
            raise ValueError(
                "Fulfilment Session Id must be provided as a string or None."
            )
        if not isinstance(self.endFulfilmentEntityId, str):
            raise ValueError("End Fulfilment Entity Id must be provided as a string.")


def get_form_response_ids_from_fulfilment_session(
    logger: Logger, fulfilment_session_id: str, transaction: Transaction
) -> list[str]:
    """
    Retrieve form response IDs from a fulfilment session on a best-effort basis.
    Returns an empty list if the session is not found or has no form entities.
    """
    if not fulfilment_session_id:
        return []

    try:
        fulfilment_session_ref = db.collection("FulfilmentSessions").document(
            fulfilment_session_id
        )
        fulfilment_session_snapshot = fulfilment_session_ref.get(
            transaction=transaction
        )

        if not fulfilment_session_snapshot.exists:
            logger.error(
                f"Fulfilment session not found: {fulfilment_session_id}. Skipping form response IDs."
            )
            return []

        fulfilment_session_data = fulfilment_session_snapshot.to_dict()
        fulfilment_entity_map = fulfilment_session_data.get("fulfilmentEntityMap", {})

        form_response_ids = []
        for entity_data in fulfilment_entity_map.values():
            if entity_data.get("type") == "FORMS":
                form_response_id = entity_data.get("formResponseId")
                if form_response_id:
                    form_response_ids.append(form_response_id)

        if form_response_ids:
            logger.info(
                f"Retrieved {form_response_ids} form response IDs from fulfilment session {fulfilment_session_id}"
            )
        else:
            logger.info(
                f"No form response IDs found in fulfilment session {fulfilment_session_id}"
            )

        return form_response_ids

    except Exception as e:
        logger.warning(
            f"Failed to retrieve form response IDs from fulfilment session {fulfilment_session_id}: {e}. Continuing without form responses."
        )
        return []


@firestore.transactional
def check_if_session_has_been_processed_already(
    transaction: Transaction, logger: Logger, checkout_session_id: str, event_id: str
) -> bool:
    maybe_event_metadata = (
        db.collection(f"EventsMetadata").document(event_id).get(transaction=transaction)
    )

    if not maybe_event_metadata.exists:
        logger.error(
            f"Unable to find event provided in datastore to fulfill purchase. eventId={event_id}"
        )
        return False

    event_metadata = maybe_event_metadata.to_dict()

    if None is event_metadata.get("completedStripeCheckoutSessionIds"):
        return False

    if checkout_session_id in event_metadata.get("completedStripeCheckoutSessionIds"):
        return True

    return False


def check_if_payment_intent_has_been_processed_already(
    transaction: Transaction, logger: Logger, payment_intent_id: str, event_id: str
) -> bool:
    """
    Check if a payment intent has already been processed by checking EventMetadata.
    Returns True if already processed, False otherwise.
    """
    maybe_event_metadata = (
        db.collection(f"EventsMetadata").document(event_id).get(transaction=transaction)
    )

    if not maybe_event_metadata.exists:
        logger.error(f"Unable to find event metadata in datastore. eventId={event_id}")
        return False

    event_metadata = maybe_event_metadata.to_dict()

    completed_payment_intent_ids = event_metadata.get("completedStripePaymentIntentIds")
    if completed_payment_intent_ids is None:
        return False

    if payment_intent_id in completed_payment_intent_ids:
        return True

    return False


def query_order_by_payment_intent_id(
    logger: Logger, payment_intent_id: str
) -> dict | None:
    """
    Query the Orders collection to find an order associated with the given payment intent ID.
    Returns the order document data if found, None otherwise.
    """
    try:
        orders_query = (
            db.collection("Orders")
            .where("stripePaymentIntentId", "==", payment_intent_id)
            .limit(1)
            .get()
        )

        if len(orders_query) == 0:
            logger.warning(
                f"No order found with payment intent ID: {payment_intent_id}"
            )
            return None

        order_doc = orders_query[0]
        order_data = order_doc.to_dict()
        order_data["orderId"] = order_doc.id
        logger.info(
            f"Found order {order_doc.id} for payment intent {payment_intent_id}"
        )
        return order_data

    except Exception as e:
        logger.error(
            f"Error querying order by payment intent ID {payment_intent_id}: {e}"
        )
        return None


def add_stripe_event_and_checkout_tags(logger: Logger, event: Event):
    logger.add_tags(
        {
            "eventType": event["type"],
            "eventId": event.id,
            "checkoutSessionId": event["data"]["object"]["id"],
            "stripeAccount": event["account"],
        }
    )


def resolve_order_and_ticket_status(capture_method: str) -> str:
    if capture_method == "manual":
        return "PENDING"
    else:
        return "APPROVED"


# Will return orderId for email to pick up and read order information. If this function fails, either logic error or transactions fail, it will return None
@firestore.transactional
def fulfill_completed_event_ticket_purchase(
    transaction: Transaction,
    logger: Logger,
    checkout_session_id: str,
    event_id: str,
    is_private: bool,
    line_items: ListObject[LineItem],
    customer,
    full_name: str,
    phone_number: str,
    payment_details: stripe.checkout.Session.TotalDetails,
    fulfilment_session_id: str,
    payment_intent_id: str,
    capture_method: str,
) -> str | None:  # Typing of customer is customer details
    # Update the event to include the new attendees
    private_path = "Private" if is_private else "Public"
    event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
    event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

    maybe_event = event_ref.get(transaction=transaction)

    # Retrieve form response IDs before starting transaction (best effort)
    form_response_ids = get_form_response_ids_from_fulfilment_session(
        logger, fulfilment_session_id, transaction
    )

    if not maybe_event.exists:
        logger.error(
            f"Unable to find event provided in datastore to fulfill purchase. eventId={event_id}, isPrivate={is_private}"
        )
        return None

    event = maybe_event.to_dict()

    try:
        # For data shape, @see https://docs.stripe.com/api/checkout/sessions/line_items
        item = line_items.data[
            0
        ]  # we only offer one item type per checkout (can buy multiple quantities)
    except IndexError as e:
        logger.error(
            f"Unable to access the first index of the line_items raising error {e}. It is probably empty... line_items={line_items}"
        )
        return None

    # We want to hash the email first as firestore doesn't like @ or . as characters in keys
    email_hash = str(
        int(hashlib.md5(str(customer.email).encode("utf-8")).hexdigest(), 16)
    )

    maybe_event_metadata = event_metadata_ref.get(transaction=transaction)
    event_metadata = {
        "organiserId": event["organiserId"],
        "purchaserMap": {},
        "completedStripeCheckoutSessionIds": [],
    }
    # If event metadata already exists, use the exisitng data and increment
    if maybe_event_metadata.exists:
        event_metadata = maybe_event_metadata.to_dict()

    logger.info(f"event-metadata {event_metadata}")

    if event_metadata.get("purchaserMap") == None:
        event_metadata["purchaserMap"] = {}

    # If the purchaser doesn't exist, add base template so we don't null pointer
    if event_metadata["purchaserMap"].get(email_hash) == None:
        event_metadata["purchaserMap"][email_hash] = {
            "email": "",
            "attendees": {},
            "totalTicketCount": 0,
        }

    # Get names and phones already added, if it doesn't exist, start new list
    purchaser = event_metadata["purchaserMap"][email_hash]
    purchaser["email"] = customer.email
    purchaser["totalTicketCount"] += item.quantity
    maybe_current_attendee = event_metadata["purchaserMap"][email_hash][
        "attendees"
    ].get(full_name)
    if maybe_current_attendee == None:
        purchaser["attendees"][full_name] = {
            "phone": phone_number,
            "ticketCount": item.quantity,
            "formResponseIds": form_response_ids if form_response_ids else [],
        }
    else:
        # Merge form response IDs if they exist
        existing_form_responses = purchaser["attendees"][full_name].get(
            "formResponseIds", []
        )
        all_form_responses = list(
            dict.fromkeys(existing_form_responses + form_response_ids)
        )

        attendee_data = {
            "phone": phone_number,
            "ticketCount": purchaser["attendees"][full_name]["ticketCount"]
            + item.quantity,
            "formResponseIds": all_form_responses if all_form_responses else [],
        }
        purchaser["attendees"][full_name] = attendee_data

    body = {
        f"purchaserMap.{email_hash}": purchaser,
        "completeTicketCount": firestore.Increment(item.quantity),
    }

    if maybe_event_metadata.exists:
        transaction.update(event_metadata_ref, body)
    else:
        transaction.set(event_metadata_ref, body)

    logger.info(
        f"Updated attendee list to reflect newly purchased tickets. email={customer.email}, name={full_name}"
    )

    # We to update EventsMetadata with the unique order object containing ticket objects for this purchase
    purchase_time = datetime.now()
    order_id_ref = db.collection("Orders").document()

    application_fees = 0
    discounts = 0
    if payment_details is not None:
        application_fees = (
            0
            if payment_details.amount_shipping is None
            else payment_details.amount_shipping
        )
        discounts = payment_details.amount_discount

    ticket_list = []
    # Create Tickets for each individual ticket
    if item.quantity is None:
        logger.error(f"Item quantity is None, cannot create tickets. item={item}")
        return None

    for item_index in range(item.quantity):
        tickets_id_ref = db.collection("Tickets").document()

        # Check if price and unit_amount exist
        if item.price is None or item.price.unit_amount is None:
            logger.error(f"Item price or unit_amount is None. item.price={item.price}")
            return None

        transaction.create(
            tickets_id_ref,
            {
                "eventId": event_id,
                "orderId": order_id_ref.id,
                "price": item.price.unit_amount,
                "purchaseDate": purchase_time,
                "status": resolve_order_and_ticket_status(capture_method),
                "formResponseId": (
                    form_response_ids[item_index]
                    if form_response_ids and item_index < len(form_response_ids)
                    else None
                ),
            },
        )
        ticket_list.append(tickets_id_ref.id)

    # Create new unique order object for this order
    transaction.set(
        order_id_ref,
        {
            "datePurchased": purchase_time,
            "email": customer.email,
            "fullName": full_name,
            "phone": phone_number,
            "applicationFees": application_fees,
            "discounts": discounts,
            "tickets": ticket_list,
            "stripePaymentIntentId": payment_intent_id,
            "status": resolve_order_and_ticket_status(capture_method),
        },
    )

    # Update the array to contain a union of this order object and all previous ones
    transaction.update(
        event_metadata_ref, {"orderIds": firestore.ArrayUnion([order_id_ref.id])}
    )

    # Lastly, we want to record the checkout session id of this webhook event, so we have an idempotency in our operations
    transaction.update(
        event_metadata_ref,
        {
            "completedStripeCheckoutSessionIds": firestore.ArrayUnion(
                [checkout_session_id]
            )
        },
    )

    return order_id_ref.id


@firestore.transactional
def record_checkout_session_by_customer_email(
    transaction: Transaction, event_id: str, checkout_session, customer
):
    # We want to hash the email first as firestore doesn't like @ or . as characters in keys
    email_hash = int(hashlib.md5(str(customer.email).encode("utf-8")).hexdigest(), 16)

    # Update our table for Attendees by email with the new checkout session details.
    attendee_ref = db.collection(f"Attendees/emails/{email_hash}").document(event_id)
    transaction.set(
        attendee_ref,
        {"checkout_sessions": firestore.ArrayUnion([checkout_session])},
        merge=True,
    )


def restock_tickets(
    transaction: Transaction,
    event_id: str,
    is_private: bool,
    ticket_count: int,
):
    """
    Restock tickets by incrementing the vacancy count for an event.
    This is a transactional function that can be reused across different workflows.
    """
    private_path = "Private" if is_private else "Public"
    event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
    transaction.update(event_ref, {"vacancy": firestore.Increment(ticket_count)})


def update_tickets_status_to_rejected(
    transaction: Transaction,
    logger: Logger,
    ticket_ids: list[str],
):
    """
    Update the status of multiple tickets to REJECTED.
    """
    for ticket_id in ticket_ids:
        ticket_ref = db.collection("Tickets").document(ticket_id)
        transaction.update(ticket_ref, {"status": "REJECTED"})
        logger.info(f"Updated ticket {ticket_id} status to REJECTED")


def update_order_status_to_rejected(
    transaction: Transaction,
    logger: Logger,
    order_id: str,
):
    """
    Update the status of an order to REJECTED.
    """
    order_ref = db.collection("Orders").document(order_id)
    transaction.update(order_ref, {"status": "REJECTED"})
    logger.info(f"Updated order {order_id} status to REJECTED")


def handle_payment_intent_cancellation(
    transaction: Transaction,
    logger: Logger,
    payment_intent_id: str,
    event_id: str,
    is_private: bool,
    ticket_count: int,
    order_id: str,
    ticket_ids: list[str],
):
    """
    Handle payment intent cancellation workflow:
    1. Restock tickets
    2. Update ticket statuses to REJECTED
    3. Update order status to REJECTED
    4. Add payment intent ID to completedStripePaymentIntentIds list in EventMetadata
    """
    event_metadata_ref = db.collection("EventsMetadata").document(event_id)

    # Restock tickets
    restock_tickets(transaction, event_id, is_private, ticket_count)

    # Update ticket statuses to REJECTED
    update_tickets_status_to_rejected(transaction, logger, ticket_ids)

    # Update order status to REJECTED
    update_order_status_to_rejected(transaction, logger, order_id)

    # Add payment intent ID to the processed list
    transaction.update(
        event_metadata_ref,
        {"completedStripePaymentIntentIds": firestore.ArrayUnion([payment_intent_id])},
    )
    logger.info(
        f"Added payment intent {payment_intent_id} to completedStripePaymentIntentIds for event {event_id}"
    )


@firestore.transactional
def restock_tickets_after_expired_checkout(
    transaction: Transaction,
    checkout_session_id: str,
    event_id: str,
    is_private: bool,
    line_items,
):
    event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

    item = line_items["data"][
        0
    ]  # we only offer one item type per checkout (can buy multiple quantities)

    restock_tickets(transaction, event_id, is_private, item.quantity)

    # Add current checkout session to the processed list
    transaction.update(
        event_metadata_ref,
        {
            "completedStripeCheckoutSessionIds": firestore.ArrayUnion(
                [checkout_session_id]
            )
        },
    )


def complete_fulfilment_session_request(
    logger: Logger, fulfilment_session_id: str, fulfilment_entity_id: str
) -> None:
    """Complete fulfilment session by calling the Java cloud function."""
    logger.info(
        f"complete_fulfilment_session: Completing fulfilment session with ID: {fulfilment_session_id} and entity ID: {fulfilment_entity_id}"
    )

    prod_url = "https://australia-southeast1-socialsportsprod.cloudfunctions.net"
    dev_url = "https://australia-southeast1-socialsports-44162.cloudfunctions.net"

    # Determine the correct URL based on environment
    base_url = prod_url if IS_PROD else dev_url
    url = f"{base_url}/globalAppController"

    request_data = {
        "endpointType": "COMPLETE_FULFILMENT_SESSION",
        "data": {
            "fulfilmentSessionId": fulfilment_session_id,
            "fulfilmentEntityId": fulfilment_entity_id,
        },
    }

    # Retry 3 times with 2s backoff between each
    max_retries = 3
    backoff_seconds = 2

    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                json=request_data,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10,
            )

            if not response.ok:
                error_response = response.json()
                error_message = error_response.get(
                    "errorMessage", f"HTTP {response.status_code}"
                )
                logger.error(
                    f"complete_fulfilment_session: Cloud function error: Failed to complete fulfilment session: {error_message}"
                )
                raise Exception(f"complete_fulfilment_session: {error_message}")

            logger.info(
                f"complete_fulfilment_session: Successfully completed fulfilment session with ID: {fulfilment_session_id} and entity ID: {fulfilment_entity_id}"
            )
            return  # Success, exit the retry loop

        except Exception as error:
            attempt_num = attempt + 1
            logger.error(
                f"complete_fulfilment_session: Attempt {attempt_num}/{max_retries} failed to complete fulfilment session with ID {fulfilment_session_id} and entity ID {fulfilment_entity_id}: {error}"
            )

            if attempt_num == max_retries:
                logger.error(
                    f"complete_fulfilment_session: All {max_retries} attempts failed. Giving up."
                )
            else:
                logger.info(
                    f"complete_fulfilment_session: Retrying in {backoff_seconds} seconds..."
                )
                time.sleep(backoff_seconds)


def fulfilment_workflow_on_ticket_purchase(
    transaction: Transaction,
    logger: Logger,
    checkout_session_id: str,
    event_id: str,
    is_private: bool,
    line_items: ListObject[LineItem],
    customer_details,
    checkout_session: stripe.checkout.Session,
    full_name: str,
    phone_number: str,
    complete_fulfilment_session: bool,
    fulfilment_session_id: str,
    end_fulfilment_entity_id: str,
    payment_intent_id: str,
    capture_method: str,
):
    # Check if this checkout_session_id has already been processed.
    if check_if_session_has_been_processed_already(
        transaction, logger, checkout_session_id, event_id
    ):
        logger.info(
            f"Current webhook event checkout session has been already processed. Returning early. session={checkout_session_id}"
        )
        return https_fn.Response(status=200)

    orderId = fulfill_completed_event_ticket_purchase(
        transaction,
        logger,
        checkout_session_id,
        event_id,
        is_private,
        line_items,
        customer_details,
        full_name,
        phone_number,
        checkout_session.total_details,
        fulfilment_session_id,
        payment_intent_id,
        capture_method,
    )
    if orderId == None:
        logger.error(
            f"Fulfillment of event ticket purchase was unsuccessful. session={checkout_session_id}, eventId={event_id}, line_items={line_items}, customer={customer_details.email}"
        )
        return https_fn.Response(status=500)

    if (
        complete_fulfilment_session
        and fulfilment_session_id
        and end_fulfilment_entity_id
    ):
        complete_fulfilment_session_request(
            logger, fulfilment_session_id, end_fulfilment_entity_id
        )

    # Send email to purchasing consumer. Retry sending email 3 times with exponential backoff, before exiting and completing order. If email breaks, its not the end of the world.
    success = False
    max_retries = 3
    for attempt in range(max_retries):
        success = send_email_on_purchase_event(
            PurchaseEventRequest(
                event_id,
                "Private" if is_private else "Public",
                customer_details.email,
                full_name,
                orderId,
            )
        )
        if success:
            break
        
        # Exponential backoff: wait 1s, 2s between retries
        if attempt < max_retries - 1:
            delay = 2 ** attempt  # 1, 2 seconds
            logger.info(
                f"Email send failed for orderId={orderId}, retrying in {delay}s (attempt {attempt + 1}/{max_retries})"
            )
            time.sleep(delay)

    if not success:
        logger.warning(
            f"Was unable to send email to {customer_details.email} after {max_retries} attempts. orderId={orderId}"
        )

    record_checkout_session_by_customer_email(
        transaction, event_id, checkout_session, customer_details
    )
    logger.info(
        f"Successfully handled checkout.session.completed webhook event. session={checkout_session_id}"
    )
    return https_fn.Response(status=200)


def fulfilment_workflow_on_expired_session(
    transaction: Transaction,
    logger: Logger,
    checkout_session_id: str,
    event_id: str,
    is_private: bool,
    line_items,
):
    # Check if this checkout_session_id has already been processed.
    if check_if_session_has_been_processed_already(
        transaction, logger, checkout_session_id, event_id
    ):
        logger.info(
            f"Current webhook event checkout session has been already processed. Returning early. session={checkout_session_id}"
        )
        return https_fn.Response(status=200)

    restock_tickets_after_expired_checkout(
        transaction, checkout_session_id, event_id, is_private, line_items
    )

    logger.info(
        f"Successfully handled checkout.session.expired webhook event. session={checkout_session_id}"
    )
    return https_fn.Response(status=200)


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["localhost", "www.sportshub.net.au", "*"],
        cors_methods=["post", "get"],
    ),
    region="australia-southeast1",
)
def stripe_webhook_checkout_fulfilment(req: https_fn.Request) -> https_fn.Response:
    # Generate a UUID for each incoming request for easier tracing throughout the lifecycle of this event
    uid = str(uuid.uuid4())
    logger = Logger(f"stripe_webhook_logger_{uid}")
    logger.add_tag("uuid", uid)

    # Handle GET requests (health checks from GCP/Firebase) - log warning and return early
    if req.method == "GET":
        logger.warning(
            "Received GET request to webhook endpoint. Returning 200 without processing."
        )
        return https_fn.Response(status=200)

    payload = req.data

    try:
        sig_header = req.headers.get("Stripe-Signature")
    except:
        logger.error(
            f"Request headers did not contain Stripe Signature. headers={req.headers}"
        )
        return https_fn.Response(status=400)
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_ENDPOINT_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(
            f"Invalid Paylod provided error={e}. payload={payload}, returned 400."
        )
        return https_fn.Response(status=400)
    except stripe.SignatureVerificationError as e:
        # Invalid signature
        logger.error(
            f"Invalid Signature provided error={e}. payload={payload} signature={sig_header}, returned 400."
        )
        return https_fn.Response(status=400)

    # TODO: Remove this once we have a better way to handle these events
    ignored_event_ids = ["evt_1SAvvn05pkiJLNbsHt1mHThW"]
    if event["id"] in ignored_event_ids:
        logger.info(f"Ignoring event. event={event}")
        return https_fn.Response(status=200)

    SPORTSHUB_URL = "sportshub"
    # If we are in prod, we only want to process events from SPORTSHUB_URL
    if (
        IS_PROD
        and SPORTSHUB_URL not in str(event["data"]["object"]["cancel_url"]).lower()
        and SPORTSHUB_URL not in str(event["data"]["object"]["success_url"]).lower()
    ):
        logger.info(
            f"Ignoring event as it is not a SPORTSHUB event. event={event} success_url={event['data']['object']['success_url']} cancel_url={event['data']['object']['cancel_url']}"
        )
        return https_fn.Response(status=200)

    match event["type"]:
        # Handle the checkout.session.completed event
        case "checkout.session.completed":
            add_stripe_event_and_checkout_tags(logger, event)
            logger.info(
                f"Processing webhook event of checkout.session.completed for {event.id}."
            )

            # Retrieve the completed session
            checkout_session_id = event["data"]["object"]["id"]
            connected_account_id = event["account"]
            session = stripe.checkout.Session.retrieve(
                checkout_session_id,
                expand=["line_items"],
                stripe_account=connected_account_id,
            )

            if session is None:
                logger.error(
                    f"Unable to retrieve stripe checkout session from webhook event. event={event}"
                )
                return https_fn.Response(status=500)

            if session.metadata is None:
                logger.error(
                    f"Unable to retrieve session metadata from session, returned none. session={session.id}"
                )
                return https_fn.Response(status=400)

            try:
                session_metadata = SessionMetadata(**session.metadata)
                logger.info(
                    f"Completed session_metadata for event id {session_metadata.eventId} fulfilment session {session_metadata.fulfilmentSessionId}: {session_metadata}. Original Stripe session metadata: {session.metadata}"
                )
            except ValueError as v:
                logger.error(
                    f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}"
                )
                return https_fn.Response(status=400)

            if session.custom_fields is None:
                logger.error(
                    f"Unable to retrieve custom fields from session, returned none. session={session.id}"
                )
                return https_fn.Response(status=400)

            full_name = None
            phone_number = None

            for field in session.custom_fields:
                match (field.key):
                    case "attendeeFullName":
                        if field.text is not None and field.text.value is not None:
                            full_name = field.text.value
                        else:
                            logger.error(
                                f"attendeeFullName field text or value is None. field={field}"
                            )
                            return https_fn.Response(status=400)
                    case "attendeePhone":
                        if field.text is not None and field.text.value is not None:
                            phone_number = field.text.value
                        else:
                            logger.error(
                                f"attendeePhone field text or value is None. field={field}"
                            )
                            return https_fn.Response(status=400)
                    case _:
                        logger.error(
                            f"Encountered custom field that is not registered. custom_field={field}"
                        )
                        return https_fn.Response(status=400)

            if full_name is None or phone_number is None:
                logger.error(
                    f"Either name or phone number is not present. full_name={full_name} phone_number={phone_number}"
                )
                return https_fn.Response(status=400)

            line_items = session.line_items
            customer_details = session.customer_details
            payment_intent_id = session.payment_intent
            try:
                capture_method = stripe.PaymentIntent.retrieve(
                    payment_intent_id,
                    stripe_account=connected_account_id,
                ).capture_method
            except Exception as e:
                logger.error(
                    f"Unable to obtain capture method from payment intent. payment_intent_id={payment_intent_id} connected_account_id={connected_account_id} error={e}"
                )
                return https_fn.Response(status=500)

            if line_items is None:
                logger.error(
                    f"Unable to obtain line_items from session. session={session.id}"
                )
                return https_fn.Response(status=500)

            if customer_details is None:
                logger.error(
                    f"Unable to obtain customer from session. session={session.id}"
                )
                return https_fn.Response(status=500)

            if payment_intent_id is None:
                logger.error(
                    f"Unable to obtain payment intent id from session. session={session.id}"
                )
                return https_fn.Response(status=500)

            if capture_method is None:
                logger.error(
                    f"Unable to obtain capture method from session. session={session.id}"
                )
                return https_fn.Response(status=500)

            logger.info(
                f"Attempting to fulfill completed event ticket purchase. session={session.id}, eventId={session_metadata.eventId}, line_items={line_items}, customer={customer_details.email}"
            )
            transaction = db.transaction()

            return fulfilment_workflow_on_ticket_purchase(
                transaction,
                logger,
                checkout_session_id,
                session_metadata.eventId,
                session_metadata.isPrivate,
                line_items,
                customer_details,
                session,
                full_name,
                phone_number,
                session_metadata.completeFulfilmentSession,
                session_metadata.fulfilmentSessionId,
                session_metadata.endFulfilmentEntityId,
                payment_intent_id,
                capture_method,
            )

        # Handle the checkout.session.expired event
        case "checkout.session.expired":
            add_stripe_event_and_checkout_tags(logger, event)
            logger.info(
                f"Processing webhook event of checkout.session.expired for {event.id}."
            )
            # Retrieve the expired session
            checkout_session_id = event["data"]["object"]["id"]
            account = event["account"]
            logger.info(f"checkout_session: {checkout_session_id}  account: {account}")
            session = stripe.checkout.Session.retrieve(
                checkout_session_id,
                expand=["line_items"],
                stripe_account=event["account"],
            )

            if session is None:
                logger.error(
                    f"Unable to retrieve stripe checkout session from webhook event. event={event}"
                )
                return https_fn.Response(status=500)

            if session.metadata is None:
                logger.error(
                    f"Unable to retrieve session metadata from session, returned none. session={session.id}"
                )
                return https_fn.Response(status=400)

            try:
                session_metadata = SessionMetadata(**session.metadata)
                logger.info(
                    f"Expired session metadata for event id {session_metadata.eventId} fulfilment session {session_metadata.fulfilmentSessionId}: {session_metadata}. Original Stripe session metadata: {session.metadata}"
                )
            except ValueError as v:
                logger.error(
                    f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}"
                )
                return https_fn.Response(status=400)

            line_items = session.line_items

            if line_items is None:
                logger.error(
                    f"Unable to obtain line_items from session. session={session.id}"
                )
                return https_fn.Response(status=500)

            transaction = db.transaction()
            return fulfilment_workflow_on_expired_session(
                transaction,
                logger,
                checkout_session_id,
                session_metadata.eventId,
                session_metadata.isPrivate,
                line_items,
            )
        case "payment_intent.canceled":
            logger.add_tags(
                {
                    "eventType": event["type"],
                    "eventId": event.id,
                    "paymentIntentId": event["data"]["object"]["id"],
                    "stripeAccount": event["account"],
                }
            )
            logger.info(
                f"Processing webhook event of payment_intent.canceled for {event.id}."
            )

            # Get payment intent ID from the event
            payment_intent_id = event["data"]["object"]["id"]
            if not payment_intent_id:
                logger.error(
                    f"Unable to retrieve payment intent ID from webhook event. event={event}"
                )
                return https_fn.Response(status=400)

            # Query Orders collection to find the order associated with this payment intent
            order_data = query_order_by_payment_intent_id(logger, payment_intent_id)
            if order_data is None:
                logger.error(
                    f"No order found for payment intent {payment_intent_id}. Returning 200 to acknowledge webhook."
                )
                return https_fn.Response(status=200)

            order_id = order_data.get("orderId")
            ticket_ids = order_data.get("tickets", [])
            email = order_data.get("email")
            full_name = order_data.get("fullName", "")
            ticket_count = len(ticket_ids)

            if not order_id:
                logger.error(f"Order data incomplete. orderId={order_id}")
                return https_fn.Response(status=500)

            # Get event information from the order's tickets
            # We need to get the eventId and isPrivate from one of the tickets
            try:
                first_ticket_ref = db.collection("Tickets").document(ticket_ids[0])
                first_ticket = first_ticket_ref.get()
                if not first_ticket.exists:
                    logger.error(
                        f"First ticket {ticket_ids[0]} not found for order {order_id}"
                    )
                    return https_fn.Response(status=500)

                ticket_data = first_ticket.to_dict()
                event_id = ticket_data.get("eventId")
                if not event_id:
                    logger.error(f"Event ID not found in ticket {ticket_ids[0]}")
                    return https_fn.Response(status=500)

                # Determine if event is private by checking both paths
                private_event_ref = db.collection("Events/Active/Private").document(
                    event_id
                )
                public_event_ref = db.collection("Events/Active/Public").document(
                    event_id
                )

                private_event = private_event_ref.get()
                public_event = public_event_ref.get()

                if not private_event.exists and not public_event.exists:
                    logger.error(
                        f"Event {event_id} not found in either Private or Public collections"
                    )
                    return https_fn.Response(status=500)

                is_private = private_event.exists

            except Exception as e:
                logger.error(
                    f"Error retrieving event information for order {order_id}: {e}"
                )
                return https_fn.Response(status=500)

            # Check if payment intent has already been processed
            transaction = db.transaction()
            if check_if_payment_intent_has_been_processed_already(
                transaction, logger, payment_intent_id, event_id
            ):
                logger.info(
                    f"Payment intent {payment_intent_id} has already been processed. Returning early."
                )
                return https_fn.Response(status=200)

            # Handle the cancellation workflow
            try:
                handle_payment_intent_cancellation(
                    transaction,
                    logger,
                    payment_intent_id,
                    event_id,
                    is_private,
                    ticket_count,
                    order_id,
                    ticket_ids,
                )
            except Exception as e:
                logger.error(
                    f"Error handling payment intent cancellation for {payment_intent_id}: {e}"
                )
                return https_fn.Response(status=500)
            
            transaction.commit()

            # Get event name for email
            try:
                private_path = "Private" if is_private else "Public"
                event_ref = db.collection(f"Events/Active/{private_path}").document(
                    event_id
                )
                event_doc = event_ref.get()
                if not event_doc.exists:
                    logger.error(
                        f"Event {event_id} not found when trying to send cancellation email"
                    )
                    event_name = "Event"
                else:
                    event_data = event_doc.to_dict()
                    event_name = event_data.get("name", "Event")
            except Exception as e:
                logger.error(f"Error retrieving event name for cancellation email: {e}")
                event_name = "Event"

            # Send cancellation email to customer
            if email:
                success = False
                for _ in range(3):
                    success = send_cancellation_email(
                        logger,
                        email,
                        full_name,
                        event_name,
                        order_id,
                        ticket_count,
                    )
                    if success:
                        break

                if not success:
                    logger.warning(
                        f"Was unable to send cancellation email to {email}. orderId={order_id}"
                    )
            else:
                logger.warning(
                    f"No email found in order {order_id} to send cancellation email"
                )

            logger.info(
                f"Successfully handled payment_intent.canceled webhook event. paymentIntentId={payment_intent_id}, orderId={order_id}"
            )
            return https_fn.Response(status=200)
        # Default case
        case _:
            logger.error(
                f"Stripe sent a webhook request which does not match to any of our handled events. event={event} webhook_request={req}"
            )
            return https_fn.Response(status=500)
