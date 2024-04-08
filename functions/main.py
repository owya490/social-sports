# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import os
from datetime import date

import google.cloud.firestore
from firebase_admin import firestore, initialize_app, auth
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

import requests

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"


app = initialize_app()

db: google.cloud.firestore.Client = firestore.Client(project="socialsports-44162")

@firestore.transactional
def move_event_to_inactive(transaction: Transaction, old_event_ref: DocumentReference, new_event_ref: DocumentReference):
  
  # Get the event in the transaction to ensure operations are atomic
  event_snapshot = old_event_ref.get(transaction=transaction)
  event_dict = event_snapshot.to_dict()
  event_dict.update({"isActive": False})
  
  # Set the document in InActive
  transaction.set(new_event_ref, event_dict)
  
  # Delete from the active partition
  transaction.delete(old_event_ref)


@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def move_inactive_events(req: https_fn.Request) -> https_fn.Response:
  today = date.today()

  # Get all Active Events in Public
  public_events_ref = db.collection("Events/Active/Public")
  public_events = public_events_ref.stream()

  # Scan through and if the endDate is past todays date then move it to Events/Inactive/Public
  for event in public_events:
    event_id = event.id
    event_dict = event.to_dict()
    print(event_dict)
    print(event_dict.get("endDate"))
    event_end_date: Timestamp  = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection("Events/Active/Public").document(event_id), new_event_ref=db.collection("Events/InActive/Public").document(event_id))

  # Get all Active Private Events
  private_events_ref = db.collection("Events/Active/Private")
  private_events = private_events_ref.stream()
  
  # Repeat for Private events, checking if endDate has passed and move to Events/Inactive/Private
  for event in private_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection("Events/Active/Private").document(event_id), new_event_ref=db.collection("Events/InActive/Private").document(event_id))

  return https_fn.Response(f"Moved all Public and Private Active Events which are past their end date to Inactive.")
 
TEMPLATE_ID = 'd-63eb299010344bcf951af2537c42a410'

@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def send_email(req: https_fn.Request) -> https_fn.Response:
  email = req.get_json()
  to_email = email.get("to_email")
  to_first_name = email.get("first_name")
  to_event_name = email.get("event_name")
  to_event_location = email.get("event_location")
  to_event_startTime = email.get("event_startTime")
  to_event_finishTime = email.get("event_finishTime")
  to_event_sport = email.get("event_sport")
  to_event_price = email.get("event_price")
  to_event_capacity = email.get("event_capacity")
  to_event_isPrivate = email.get("event_isPrivate")
  to_event_tags = email.get("event_tags")
  
  message = Mail(
    from_email='team.sportshub@gmail.com',
    to_emails=to_email,
    subject=f"Event Notifications for {to_first_name}",
    html_content='<strong>Hi guys i am daniel</strong>')
  
  message.dynamic_template_data = {
        'event_name': to_event_name,
        'first_name': to_first_name,
        'event_location': to_event_location,
        'event_startTime': to_event_startTime,
        'event_finishTime': to_event_finishTime,
        'event_sport': to_event_sport,
        'event_price': to_event_price,
        'event_capacity': to_event_capacity,
        'event_isPrivate': to_event_isPrivate,
        'event_tags': to_event_tags,
        
  }
  message.template_id = TEMPLATE_ID
  
  try:
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    print(response.status_code)
    print(response.body)
    print(response.headers)

    return https_fn.Response("Email sent successfully", status=200)

  except Exception as e:
    
    return https_fn.Response("Error sending email", status=500)
  


@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def reset_password(req: https_fn.Request) -> https_fn.Response:
    request_data = req.get_json()
    email = request_data.get("email")

    try:
        # Send password reset email
        reset_link = auth.generate_password_reset_link(email)
        send_password_reset_email(email, reset_link)
        
        return https_fn.Response("Password reset email sent successfully", status=200)

    except auth.UserNotFoundError:
        return https_fn.Response("User not found", status=404)

    except Exception as e:
        return https_fn.Response("Error resetting password: " + str(e), status=500)

def send_password_reset_email(email: str, reset_link: str):
    message = Mail(
        from_email='team.sportshub@gmail.com',
        to_emails=email,
        subject="Password Reset",
    )
    
    # Set SendGrid template ID
    message.template_id = 'd-4742453a030d472cbbdce8249f4f79a6'
    
    # Add dynamic template data
    message.dynamic_template_data = {
        'reset_link': reset_link
    }

    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)

    except Exception as e:
        print("Error sending password reset email:", e)

@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def send_email_verification(req: https_fn.Request) -> https_fn.Response:
    request_data = req.get_json()
    userEmail = request_data.get("userEmail")
    verificationToken = request_data.get("verificationToken")
    
    # How does our verifcation token work
    # Construct the verification link with the token
    verification_link = f"https://www.sportshub.net.au/verify?token={verificationToken}"

    # Compose the email message
    email_message = {
        "to": userEmail,
        "from": "your@example.com",
        "template_id": "d-22d2ea068012467085e6e117985339cd",  # Replace with your SendGrid template ID
        "dynamic_template_data": {
            "verificationLink": verification_link
        }
    }

    # Send the email using SendGrid
    try:
        sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))
        response = sg.send(email_message)
        print("Verification email sent successfully.")
        return {"success": True}, 200
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return {"error": "Failed to send verification email."}, 500
