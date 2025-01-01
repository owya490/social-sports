import json
import uuid
from dataclasses import dataclass

import stripe
from apiclient import discovery
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from httplib2 import Http
# from lib.logging import Logger
# from lib.stripe.commons import ERROR_URL
from oauth2client import client, file, tools
from googleapiclient.discovery import build
from google.auth import default, iam
from google.auth.transport import requests
from google.oauth2 import service_account

TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
SCOPES = ['https://www.googleapis.com/auth/drive']
GSUITE_ADMIN_USER = 'firebase-adminsdk-wplmk@socialsports-44162.iam.gserviceaccount.com'

@dataclass
class CreateFormRequest:
  organiser: str
  
  def __post_init__(self):
    if not isinstance(self.organiser, str):
      raise ValueError("Organiser Id must be provided as a string.")

def delegated_credentials(credentials, subject, scopes):
    try:
        # If we are using service account credentials from json file
        # this will work
        updated_credentials = credentials.with_subject(subject).with_scopes(scopes)
    except AttributeError:
        # This exception is raised if we are using GCE default credentials

        request = requests.Request()

        # Refresh the default credentials. This ensures that the information
        # about this account, notably the email, is populated.
        credentials.refresh(request)

        # Create an IAM signer using the default credentials.
        signer = iam.Signer(
            request,
            credentials,
            credentials.service_account_email
        )

        # Create OAuth 2.0 Service Account credentials using the IAM-based
        # signer and the bootstrap_credential's service account email.
        updated_credentials = service_account.Credentials(
            signer,
            credentials.service_account_email,
            TOKEN_URI,
            scopes=scopes,
            subject=subject
        )
    except Exception:
        raise

    return updated_credentials




# @https_fn.on_call(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
def create_form(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  # logger = Logger(f"stripe_create_form_logger_{uid}")
  # logger.add_tag("uuid", uid)
  # body_data = req.data
  body_data = {
    "organiser": "Owen"
  }

  # Security Check to see if user is authenticated
  # if (req.auth.uid == None):
  #   pass
    # return https_fn.Response(status=401, body_data=json.dumps({"url": ERROR_URL}))


  # Validate the incoming request to contain the necessary fields
  try:
    request_data = CreateFormRequest(**body_data)
  except ValueError as v:
    pass
    # logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
    # return json.dumps({"url": ERROR_URL})

  # logger.add_tag("organiser", request_data.organiser)

  SCOPES = "https://www.googleapis.com/auth/drive"
  DISCOVERY_DOC = "https://forms.googleapis.com/$discovery/rest?version=v1"

  store = file.Storage("token.json")
  creds, project = default()
  creds = delegated_credentials(creds, GSUITE_ADMIN_USER, SCOPES) 
  # if not creds or creds.invalid:
  #   flow = client.flow_from_clientsecrets("./client_secret.json", SCOPES)
  #   args = tools.argparser.parse_args()
  #   args.noauth_local_webserver = True

  #   creds = tools.run_flow(flow, store, flags=args)

  form_service = discovery.build(
      "forms",
      "v1",
      # http=creds.authorize(Http()),
      credentials=creds,
      discoveryServiceUrl=DISCOVERY_DOC,
      static_discovery=False,
  )

  form = {
      "info": {
          "title": "My new form",
          "documentTitle": f"{request_data.organiser}_{uid}"
      },
  }
  # Prints the details of the sample form
  result = form_service.forms().create(body=form).execute()
  print(result)

create_form(None)
  
#   {
#   "data": {
#     "organiser": "owen"
#   }
# })

