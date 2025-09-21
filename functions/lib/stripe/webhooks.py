###############################
# STRIPE WEBHOOKS INTEGRATION #
###############################

import hashlib
import json
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from lib.constants import IS_PROD, db
from lib.emails.purchase_event import PurchaseEventRequest, send_email_on_purchase_event
from lib.logging import Logger
from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET
from stripe import Event, LineItem, ListObject


@dataclass
class SessionMetadata:
    eventId: str
    isPrivate: bool

    def __init__(self, eventId, isPrivate):
        self.eventId = eventId
        if isinstance(isPrivate, str):
            self.isPrivate = isPrivate.lower() == "true"
        else:
            self.isPrivate = isPrivate

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")
        if not isinstance(self.isPrivate, bool):
            raise ValueError("Is Private must be provided as a boolean.")


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


def add_stripe_event_and_checkout_tags(logger: Logger, event: Event):
    logger.add_tags(
        {
            "eventType": event["type"],
            "eventId": event.id,
            "checkoutSessionId": event["data"]["object"]["id"],
            "stripeAccount": event["account"],
        }
    )


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
) -> str | None:  # Typing of customer is customer details
    # Update the event to include the new attendees
    private_path = "Private" if is_private else "Public"
    event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
    event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

    maybe_event = event_ref.get(transaction=transaction)

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
        }
    else:
        purchaser["attendees"][full_name] = {
            "phone": phone_number,
            "ticketCount": purchaser["attendees"][full_name]["ticketCount"]
            + item.quantity,
        }

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
    for i in range(item.quantity):
        tickets_id_ref = db.collection("Tickets").document()
        transaction.create(
            tickets_id_ref,
            {
                "eventId": event_id,
                "orderId": order_id_ref.id,
                "price": item.price.unit_amount,
                "purchaseDate": purchase_time,
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


@firestore.transactional
def restock_tickets_after_expired_checkout(
    transaction: Transaction,
    checkout_session_id: str,
    event_id: str,
    is_private: bool,
    line_items,
):
    private_path = "Private" if is_private else "Public"
    event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
    event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

    item = line_items["data"][
        0
    ]  # we only offer one item type per checkout (can buy multiple quantities)

    transaction.update(event_ref, {"vacancy": firestore.Increment(item.quantity)})

    # Add current checkout session to the processed list
    transaction.update(
        event_metadata_ref,
        {
            "completedStripeCheckoutSessionIds": firestore.ArrayUnion(
                [checkout_session_id]
            )
        },
    )


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
    )
    if orderId == None:
        logger.error(
            f"Fulfillment of event ticket purchase was unsuccessful. session={checkout_session_id}, eventId={event_id}, line_items={line_items}, customer={customer_details.email}"
        )
        return https_fn.Response(status=500)

    # Send email to purchasing consumer. Retry sending email 3 times, before exiting and completing order. If email breaks, its not the end of the world.
    for i in range(3):
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

    if not success:
        logger.warning(
            f"Was unable to send email to {customer_details.email}. orderId={orderId}"
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
        cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]
    ),
    region="australia-southeast1",
)
def stripe_webhook_checkout_fulfilment(req: https_fn.Request) -> https_fn.Response:
    # Generate a UUID for each incoming request for easier tracing throughout the lifecycle of this event
    uid = str(uuid.uuid4())
    logger = Logger(f"stripe_webhook_logger_{uid}")
    logger.add_tag("uuid", uid)

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
    ignored_event_ids = []
    if event["id"] in ignored_event_ids:
        logger.info(f"Ignoring event. event={event}")
        return https_fn.Response(status=200)

    SPORTSHUB_URL = "sportshub"
    # If we are in prod, we only want to process events from SPORTSHUB_URL
    if (
        IS_PROD
        and SPORTSHUB_URL not in event["data"]["object"]["cancel_url"]
        and SPORTSHUB_URL not in event["data"]["object"]["success_url"]
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
                        full_name = field.text.value
                    case "attendeePhone":
                        phone_number = field.text.value
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

        # Default case
        case _:
            logger.error(
                f"Stripe sent a webhook request which does not match to any of our handled events. event={event} webhook_request={req}"
            )
            return https_fn.Response(status=500)
