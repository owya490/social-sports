import json
import time

import requests
from lib.emails.constants import LOOPS_API_KEY, LOOPS_REJECT_BOOKING_EMAIL_TEMPLATE_ID
from lib.logging import Logger


def send_reject_booking_email(
    logger: Logger,
    email: str,
    name: str,
    event_name: str,
    organiser_id: str,
    order_id: str,
    ticket_count: int,
    start_date: str,
    end_date: str,
    location: str,
) -> bool:
    """
    Send reject-booking email to the customer via Loops.
    Returns True if successful, False otherwise.
    """
    if not LOOPS_REJECT_BOOKING_EMAIL_TEMPLATE_ID:
        logger.warning(
            "LOOPS_REJECT_BOOKING_EMAIL_TEMPLATE_ID not configured. Skipping email."
        )
        return False

    headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
    body = {
        "transactionalId": LOOPS_REJECT_BOOKING_EMAIL_TEMPLATE_ID,
        "email": email,
        "dataVariables": {
            "name": name,
            "eventName": event_name,
            "organiserId": organiser_id,
            "orderId": order_id,
            "ticketCount": str(ticket_count),
            "startDate": start_date,
            "endDate": end_date,
            "location": location,
        },
    }

    try:
        response = requests.post(
            "https://app.loops.so/api/v1/transactional",
            data=json.dumps(body),
            headers=headers,
        )

        if response.status_code == 429:
            time.sleep(1)
            response = requests.post(
                "https://app.loops.so/api/v1/transactional",
                data=json.dumps(body),
                headers=headers,
            )

        if response.status_code != 200:
            logger.error(
                f"Failed to send reject booking email for orderId={order_id}, body={response.text}"
            )
            return False

        logger.info(
            f"Successfully sent reject booking email to {email} for order {order_id}"
        )
        return True

    except Exception as e:
        logger.error(f"Exception sending reject booking email to {email}: {e}")
        return False
