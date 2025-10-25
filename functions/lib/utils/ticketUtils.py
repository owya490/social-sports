from google.cloud import firestore
from google.cloud.firestore import Transaction
from typing import Dict, List, Optional
import logging

db = firestore.Client()

class TicketType:
    def __init__(self, id: str, name: str, price: int, available_quantity: int, sold_quantity: int):
        self.id = id
        self.name = name
        self.price = price
        self.available_quantity = available_quantity
        self.sold_quantity = sold_quantity
    
    @property
    def remaining_quantity(self) -> int:
        return max(0, self.available_quantity - self.sold_quantity)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "availableQuantity": self.available_quantity,
            "soldQuantity": self.sold_quantity
        }

# TODO: seems like this function is hard coded to only get 2 types of ticket types at the moment.
# We should probably generalise it to be able to get all the available ticket types from an event.
def get_ticket_types_for_event(transaction: Transaction, event_ref, logger: logging.Logger) -> List[TicketType]:
    """Get all ticket types for a given event"""
    try:
        # Get document references and retrieve them using the same pattern as webhooks.py
        ticket_types_collection = event_ref.collection("TicketTypes")
        admin_ref = ticket_types_collection.document("Admin")
        general_ref = ticket_types_collection.document("General")
        
        # Get documents using the same pattern as webhooks.py: doc_ref.get(transaction=transaction)
        admin_doc = admin_ref.get(transaction=transaction)
        general_doc = general_ref.get(transaction=transaction)
        
        ticket_types = []
        
        # Process Admin ticket if it exists
        if admin_doc.exists:
            data = admin_doc.to_dict()
            ticket_type = TicketType(
                id="Admin",
                name=data.get("name", "Admin"),
                price=data.get("price", 0),
                available_quantity=data.get("availableQuantity", 999999),  # Infinite for admin
                sold_quantity=data.get("soldQuantity", 0)
            )
            ticket_types.append(ticket_type)
        
        # Process General ticket if it exists
        if general_doc.exists:
            data = general_doc.to_dict()
            ticket_type = TicketType(
                id="General",
                name=data.get("name", "General"),
                price=data.get("price", 0),
                available_quantity=data.get("availableQuantity", 0),
                sold_quantity=data.get("soldQuantity", 0)
            )
            ticket_types.append(ticket_type)
        
        logger.info(f"Retrieved {len(ticket_types)} ticket types for event {event_ref.path}")
        return ticket_types
    except Exception as e:
        logger.error(f"Failed to get ticket types for event {event_ref.path}: {e}")
        return []



def get_general_ticket_type(ticket_types: List[TicketType]) -> Optional[TicketType]:
    """Get the 'General' ticket type, fallback to lowest priced ticket"""
    # First try to find 'General' ticket type
    for tt in ticket_types:
        if tt.name.lower() == "general":
            return tt
    
    # Fallback to lowest priced ticket with availability
    available_tickets = [tt for tt in ticket_types if tt.remaining_quantity > 0]
    if not available_tickets:
        return None
    
    return min(available_tickets, key=lambda tt: tt.price)

# TODO: this workflow only handles General ticket types. We should probably generalise it to be able to handle all ticket types.
def update_ticket_type_sold_quantity(transaction: Transaction, event_ref, ticket_type_id: str, quantity_change: int, logger: logging.Logger):
    """Update the sold quantity for a specific ticket type and sync event-level vacancy"""
    try:
        ticket_type_ref = event_ref.collection("TicketTypes").document(ticket_type_id)
        transaction.update(ticket_type_ref, {
            "soldQuantity": firestore.Increment(quantity_change)
        })
        
        # Only sync event vacancy for General tickets (paid customer tickets)
        # Admin tickets don't affect vacancy since they have infinite quantity
        if ticket_type_id == "General":
            # Negative quantity_change means we're reducing sold tickets (increasing vacancy)
            transaction.update(event_ref, {
                "vacancy": firestore.Increment(-quantity_change)
            })
            logger.info(f"Updated General ticket sold quantity by {quantity_change} and synced event vacancy")
        else:
            logger.info(f"Updated {ticket_type_id} ticket sold quantity by {quantity_change} (no vacancy sync)")
            
    except Exception as e:
        logger.error(f"Failed to update ticket type sold quantity: {e}")
        raise e

def use_admin_tickets(transaction: Transaction, event_ref, quantity: int, logger: logging.Logger):
    """
    Use Admin tickets for organizer additions.
    Admin tickets consume General availability but don't count as General sales.
    """
    try:
        admin_ticket_ref = event_ref.collection("TicketTypes").document("Admin")
        general_ticket_ref = event_ref.collection("TicketTypes").document("General")
        
        # Track Admin ticket usage
        transaction.update(admin_ticket_ref, {
            "soldQuantity": firestore.Increment(quantity)
        })
        
        # Consume General availability (but not soldQuantity since no payment)
        transaction.update(general_ticket_ref, {
            "availableQuantity": firestore.Increment(-quantity)
        })
        
        # Reduce event vacancy since Admin tickets consume public spots
        transaction.update(event_ref, {
            "vacancy": firestore.Increment(-quantity)
        })
        
        logger.info(f"Used {quantity} Admin tickets, reduced General availability and event vacancy")
    except Exception as e:
        logger.error(f"Failed to use admin tickets: {e}")
        raise e

def reserve_tickets(transaction: Transaction, event_ref, quantity: int, logger: logging.Logger) -> Optional[TicketType]:
    """
    Reserve tickets by finding the appropriate ticket type and updating its sold quantity.
    For public checkout, this only uses General tickets (not Admin tickets).
    Returns the ticket type used for the reservation.
    """
    ticket_types = get_ticket_types_for_event(transaction, event_ref, logger)
    
    if not ticket_types:
        logger.warning(f"No ticket types found for event {event_ref.path}")
        return None
    
    # Use the general ticket type for public reservations (not Admin tickets)
    general_ticket = get_general_ticket_type(ticket_types)
    if not general_ticket:
        logger.warning(f"No General ticket type found for event {event_ref.path}")
        return None
        
    if general_ticket.remaining_quantity < quantity:
        logger.warning(f"General ticket type doesn't have enough availability. Requested: {quantity}, Available: {general_ticket.remaining_quantity}")
        return None
    
    # Reserve the tickets using General ticket type
    update_ticket_type_sold_quantity(transaction, event_ref, general_ticket.id, quantity, logger)
    return general_ticket 