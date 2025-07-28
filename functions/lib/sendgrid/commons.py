from lib.constants import db

def get_user_email(user_id: str, user_data = None) -> str:
  if user_data == None:
    user_data = get_user_data_private(user_id)
  
  try:
    email = user_data["contactInformation"]["email"]
  except Exception as e:
    raise Exception(f"Unable to find email in user data object. userData={user_data}")
  
  return email

def get_user_data_private(user_id: str):
    maybe_user_data = db.collection("Users").document("Active").collection("Private").document(user_id).get()
    if maybe_user_data.exists:
        return maybe_user_data.to_dict()
    raise Exception(f"Unable to find user in Users/Active/Private. userId={user_id}")

def get_user_data_public(user_id: str):
    maybe_user_data = db.collection("Users").document("Active").collection("Public").document(user_id).get()
    if maybe_user_data.exists:
        return maybe_user_data.to_dict()
    raise Exception(f"Unable to find user in Users/Active/Public. userId={user_id}")

def cents_to_dollars(price_in_cents):
    return f"${price_in_cents / 100:.2f}"