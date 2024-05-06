import os

from firebase_functions import https_fn

BEARER_TOKEN = os.environ.get("BEARER_TOKEN")

def get_token_from_request_headers(req: https_fn.Request) -> str:
  authorization = req.headers.get('Authorization')
  print(authorization)
  if authorization == None:
    return ""
  
  print(authorization.split("Bearer ")[1])
  try:
    token = authorization.split('Bearer ')[1]
  except Exception as e:
    print(e)
    return ""
  return token

def verify_access_token_from_http_request(id_token: str) -> bool:
  if id_token == BEARER_TOKEN:
    return True
  else:
    return False