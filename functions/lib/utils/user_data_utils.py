import json
import re
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
    username_dict = {}

    # Get all documents in the collection
    public_docs = public_ref.stream()
    for doc in public_docs:
        # Get the document data
        doc_data = doc.to_dict()
        # Prepare the new fields
        public_organiser_events = []
        username = re.sub(r'[^a-zA-Z0-9]', '', doc_data.get('firstName', '')).lower() + ('_' + re.sub(r'[^a-zA-Z0-9]', '', doc_data.get('surname', '')).lower() if doc_data.get('surname') else '')
        while username in username_dict:
            username = username + "1"
          
        username_dict[username] = username
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

# Function to add usernames and userId to the /Usernames collection
def add_usernames_to_collection():
    # Reference to the /Users/Active/Public collection
    public_ref = db.collection('Users').document('Active').collection('Public')

    # Get all documents from the /Users/Active/Public collection
    public_docs = public_ref.stream()

    # Reference to the /Usernames collection
    usernames_ref = db.collection('Usernames')

    for doc in public_docs:
        # Get the document ID and the 'username' field from the document
        doc_data = doc.to_dict()
        document_id = doc.id
        username = doc_data.get('username', '')

        # If username exists, add to /Usernames collection
        if username:
            # Create a document in /Usernames collection with the username as the key
            usernames_ref.document(username).set({
                'userId': document_id
            })
            print(f"Added {username} with userId {document_id} to /Usernames")


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["get", "post"]), region="australia-southeast1")
def split_public_private_events(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"firebase_split_public_private_events_logger_{uid}")
  logger.add_tag("uuid", uid)
  update_public_documents()
  return https_fn.Response(f"Updated All.")
 
@https_fn.on_request(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["get", "post"]), region="australia-southeast1")
def create_username_table(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"firebase_create_username_table_events_logger_{uid}")
  logger.add_tag("uuid", uid)
  add_usernames_to_collection()
  return https_fn.Response(f"Updated All.")