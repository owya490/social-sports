import os

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
LOOP_API_KEY = os.environ.get("LOOP_API_KEY")

CREATE_EVENT_EMAIL_TEMPLATE_ID = "d-63eb299010344bcf951af2537c42a410"
PURCHASE_EVENT_EMAIL_TEMPLATE_ID = "d-0c47c68389fe4149a9bf065e38f4a3e9"
DELETE_EVENT_ORGANISER_EMAIL_TEMPLATE_ID = "d-8fc8e99241ae4cd2b85b125a52ef36be"
DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID ="d-99836bca99f44c30a36d2d3b3a64c754"
SENDGRID_UNSUBSCRIBE_GROUP_ID = 26983
