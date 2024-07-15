from lib.constants import db
from lib.logging import Logger

CREATE_EVENT_EMAIL_TEMPLATE_ID = "d-63eb299010344bcf951af2537c42a410"
PURCHASE_EVENT_EMAIL_TEMPLATE_ID = "d-0c47c68389fe4149a9bf065e38f4a3e9"

def get_user_email(user_id: str, user_data = None) -> str:
  if user_data == None:
    maybe_user_data = db.collection("Users/Active/Private").document(user_id).get()
    if (not maybe_user_data.exists):
      raise Exception(f"Unable to find user provided in datastore to send email. userId={user_id}")

    user_data = maybe_user_data.to_dict()
  
  try:
    email = user_data["contactInformation"]["email"]
  except Exception as e:
    raise Exception(f"Unable to find email in user data object. userData={user_data}")
  
  return email
