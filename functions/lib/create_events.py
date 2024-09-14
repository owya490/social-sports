from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum
import re

from lib.constants import db
from lib.logging import Logger

from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp

class EventStatus(Enum):
    Active = "Active"
    Inactive = "InActive"

class EventPrivacy(Enum):
    Public = "Public"
    Private = "Private"

@dataclass
class LocationLatLng:
    lat: float
    lng: float

@dataclass
class AttendeeMetadata:
    names: List[str]
    phones: List[str]

@dataclass
class AbstractEventData:
    startDate: datetime
    endDate: datetime
    location: str
    locationLatLng: LocationLatLng
    capacity: int
    vacancy: int
    price: float
    organiserId: str
    registrationDeadline: datetime
    name: str
    description: str
    nameTokens: Optional[List[str]] = None
    locationTokens: Optional[List[str]] = None
    image: str
    eventTags: List[str]
    isActive: bool
    isPrivate: bool
    attendees: Dict[str, int]  # Email -> number of tickets
    attendeesMetadata: Dict[str, AttendeeMetadata]  # Email -> names & phones
    accessCount: int
    sport: str
    paymentsActive: bool

@dataclass
class ContactInformation:
    mobile: Optional[str] = None
    email: str

@dataclass
class ActiveBooking:
    eventId: str

@dataclass
class AbstractUserData:
    firstName: str
    surname: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[str] = None
    contactInformation: ContactInformation
    activeBookings: Optional[List[ActiveBooking]] = None
    profilePicture: str
    stripeAccount: Optional[str] = None
    stripeAccountActive: Optional[bool] = None
    organiserEvents: Optional[List[str]] = None
    isVerifiedOrganiser: Optional[bool] = None

@dataclass
class UserData(AbstractUserData):
    userId: str

@dataclass
class NewEventData(AbstractEventData):
    pass

class UserNotFoundError(Exception):
    def __init__(self, user_id: str, message: str = "User not found"):
        self.user_id = user_id
        self.message = message
        super().__init__(self.message)

def tokenize_text(text: str) -> List[str]:
    # Convert text to lowercase, split by whitespace, and filter out empty strings
    return [word for word in re.split(r'\s+', text.lower()) if word]

@firestore.transactional
def create_event_metadata(event_id: str, data: NewEventData, transaction: Transaction) -> None:
    try:
        # Extract event metadata fields from the data
        event_metadata = extract_events_metadata_fields(data)
        
        # Create a reference to the document
        doc_ref = db.collection("EventsMetadata").document(event_id)
        
        # Set the document in the batch
        transaction.set(doc_ref, event_metadata)
        
        # logger.info(f"createEventMetadata succeeded for {event_id}")
    except Exception as error:
        # logger.error(f"An error occurred in createEventMetadata for {event_id} error={error}")
        raise error
    
@firestore.transactional
def get_private_user_by_id(user_id: str, transaction: Transaction):
    user_doc_ref = db.collection("Users").document("Active").collection("Private").document(user_id)
    user_doc = user_doc_ref.get(transaction=transaction)

    if not user_doc.exists:
        raise UserNotFoundError(user_id)
    
    user_data = user_doc.to_dict()
    user_data['user_id'] = user_id

    return user_data

def extract_public_user_data(data: UserData):
    
    
@firestore.transactional
def update_user(user_id: str, new_user_data: UserData, transaction: Transaction):
    public_user_doc_ref = db.collection("Users").document("Active").collection("Public").document(user_id)
    private_user_doc_ref = db.collection("Users").document("Active").collection("Private").document(user_id)

    public_data_to_update = extract_public_user_data(new_user_data)

    transaction.update(public_user_doc_ref, public_data_to_update)

    private_data_to_update = extract_private_user_data(new_user_data)

    transaction.update(private_user_doc_ref, private_data_to_update)


@firestore.transactional
def create_event(data: NewEventData, transaction: Transaction):
    event_data_with_tokens = {
        **vars(data),
        "name_tokens": tokenize_text(data.name),
        "location_tokens": tokenize_text(data.location)
    }
    is_active = EventStatus.Active if data.is_active else EventStatus.Inactive
    is_private = EventPrivacy.Private if data.is_private else EventPrivacy.Private

    doc_ref = db.collection("Events").document(is_active).collection(is_private)
    transaction.set(doc_ref, event_data_with_tokens)

    create_event_metadata(doc_ref.id, data, transaction)

    user = get_private_user_by_id(data.organiser_id, transaction)

    if not user.get('organiser_events'):
        user['organiser_events'] = [doc_ref.id]
    else:
        user['organiser_events'].append(doc_ref.id)

    # logger.info(f"create event user: {user}")
    update_user(data.organiser_id, user, transaction)

    return doc_ref.id
