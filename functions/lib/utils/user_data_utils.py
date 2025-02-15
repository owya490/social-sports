import json
import uuid
from dataclasses import dataclass

from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from lib.constants import db
from lib.logging import Logger
from lib.move_inactive_events import ACTIVE_PRIVATE, INACTIVE_PRIVATE
from lib.stripe.commons import ERROR_URL


# Function to update documents in /Users/Active/Public
def update_public_documents():
    # Reference to the collection
    public_ref = db.collection('Users').document('Active').collection('Public')
    # Get all documents in the collection
    public_docs = public_ref.stream()
    for doc in public_docs:
        if doc.id == "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2":
          # Get the document data
          doc_data = doc.to_dict()
          # Prepare the new fields
          public_organiser_events = []
          username = doc_data.get('firstName', '') + ('_' + doc_data.get('surname', '') if doc_data.get('surname') else '')
          is_searchable = False
          public_contact_information = {
              'email': '',
              'mobile': ''
          }
          name_tokens = doc_data.get('firstName', '').split() + doc_data.get('surname', '').split()
          bio = ""
          # Add new fields to the document
          public_ref.document(doc.id).update({
              'publicUpcomingOrganiserEvents': public_organiser_events,
              'username': username,
              'isSearchable': is_searchable,
              'publicContactInformation': public_contact_information,
              'nameTokens': name_tokens,
              'bio': bio
          })
          print(f"Updated public document: {doc.id}")

# Function to update documents in /Users/Active/Private
def update_private_documents():
    # Reference to the collection
    private_ref = db.collection('Users').document('Active').collection('Private')
    # Get all documents in the collection
    private_docs = private_ref.stream()
    for doc in private_docs:
        if doc.id == "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2":

          # Get the document data
          doc_data = doc.to_dict()
          # Update the 'organiserEvents' field to 'privateOrganiserEvents'
          organiser_events = doc_data.get('organiserEvents', [])
          private_ref.document(doc.id).update({
              'publicOrganiserEvents': [],
              'privateOrganiserEvents': organiser_events,
              'organiserEvents': firestore.DELETE_FIELD  # Remove the old field
          })
          print(f"Updated private document: {doc.id}")

@https_fn.on_request(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["get", "post"]), region="australia-southeast1")
def split_public_private_events(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"firebase_split_public_private_events_logger_{uid}")
  logger.add_tag("uuid", uid)
  update_public_documents()
  update_private_documents()
  return https_fn.Response(f"Updated All.")
 