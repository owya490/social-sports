import json
import time

import requests
from lib.emails.constants import (
    LOOPS_API_KEY,
    LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID,
)
from lib.logging import Logger


def send_cancellation_email(
    logger: Logger,
    email: str,
    full_name: str,
    event_name: str,
    order_id: str,
    ticket_count: int,
) -> bool:
    """
    Send cancellation email to customer using Loops API.
    Returns True if successful, False otherwise.
    """
    if not LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID:
        logger.warning(
            "LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID not configured. Skipping email."
        )
        return False

    headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
    body = {
        "transactionalId": LOOPS_PAYMENT_CANCELLED_EMAIL_TEMPLATE_ID,
        "email": email,
        "dataVariables": {
            "name": full_name,
            "eventName": event_name,
            "orderId": order_id,
            "ticketCount": str(ticket_count),
        },
    }

    try:
        response = requests.post(
            "https://app.loops.so/api/v1/transactional",
            data=json.dumps(body),
            headers=headers,
        )

        # Retry once more on rate limit after waiting 1 second
        if response.status_code == 429:
            time.sleep(1)
            response = requests.post(
                "https://app.loops.so/api/v1/transactional",
                data=json.dumps(body),
                headers=headers,
            )

        if response.status_code != 200:
            logger.error(
                f"Failed to send cancellation email for orderId={order_id}, body={response.text}"
            )
            return False

        logger.info(
            f"Successfully sent cancellation email to {email} for order {order_id}"
        )
        return True

    except Exception as e:
        logger.error(f"Exception sending cancellation email to {email}: {e}")
        return False

