from lib.constants import db


MICROSOFT_EMAIL_LIST = [
  "@live.com",
  "@live.com.au",
  "@outlook.com", 
  "@hotmail.com", 
  "@outlook.com.au"
]

SPORTSHUB_GMAIL_EMAIL = "team.sportshub@gmail.com"
SPORTSHUB_OUTLOOK_EMAIL = "team.sportshub@outlook.com"


def get_user_email(user_id: str, user_data = None) -> str:
  if user_data == None:
    user_data = get_user_data(user_id)
  
  try:
    email = user_data["contactInformation"]["email"]
  except Exception as e:
    raise Exception(f"Unable to find email in user data object. userData={user_data}")
  
  return email


def get_user_data(user_id: str):
  maybe_user_data = db.collection("Users/Active/Private").document(user_id).get()
  if (not maybe_user_data.exists):
    raise Exception(f"Unable to find user provided in datastore to send email. userId={user_id}")

  return maybe_user_data.to_dict()

def get_sender_email(to_email_address: str) -> str:
  is_email_microsoft = True if True in [email in to_email_address for email in MICROSOFT_EMAIL_LIST] else False
  return MICROSOFT_EMAIL_LIST if is_email_microsoft else SPORTSHUB_GMAIL_EMAIL