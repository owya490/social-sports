---
title: "[Feature] SPORTSHUB Forms"
date: "2025-09-25"
authors:
  - name: Brian Wang
    image: /images/brian-dp.png
    link: https://github.com/brian2w
tags:
  - SPORTSHUB
  - Forms
  - Architecture
  - Fulfilment
  - Backend
  - Tech
image: /images/forms-thumbnail.png
description: Deep dive into how we built SPORTSHUB's Forms feature by generalizing our payment workflow and unifying our backend architecture with the GlobalAppController.
---

![Forms Architecture](/images/forms-thumbnail-landscape.png)

# Building SPORTSHUB Forms 📝

One of SPORTSHUB's most powerful features is our **Forms system** – allowing event organizers to collect custom information from attendees during the ticket purchase process. But what makes this feature truly special isn't just what it does for users, but how we built it by fundamentally rethinking our payment architecture.

<!--more-->

## What Are SPORTSHUB Forms?

SPORTSHUB Forms transform the ticket purchasing experience by allowing event organizers to get the necessary information they need from attendees – all in one smooth, integrated workflow. Instead of juggling separate surveys, emails, and spreadsheets, organizers can gather everything from dietary preferences to emergency contacts right during checkout.

![Forms Gallery](/images/forms-gallery.png)

### What Makes Forms **Great** for Event Organizers:

**🎯 Collect Any Information You Need**
- Gather dietary restrictions, t-shirt sizes, skill levels, team preferences
- Collect emergency contacts, medical information, or accessibility needs

**⚡ Seamless Ticket Purchase Experience**
- No separate forms to send after payment – everything happens during checkout
- Attendees complete forms as part of buying tickets, ensuring 100% completion rates
- Each ticket can have its own custom information requirements
- Form links are **shareable**, meaning attendees can easily send a form to other attendees to complete

**🔧 Flexible Form Building**
- Choose from text input, multiple choice/dropdown and image sections
- Set required fields to ensure you get critical information
- Real-time validation prevents errors and incomplete submissions

**📊 Organized Data Collection**
- All responses automatically organized by event and ticket
- Export responses to CSV for easy analysis and planning
- No more chasing attendees for missing information after they've paid

![Forms Example](/images/forms-example.png)


## The Technical Challenge: Generalizing Payment Workflows

Initially, SPORTSHUB had a simple ticket purchasing flow: 
> Select tickets → Pay with Stripe → Done. 

But forms introduced a new complexity: we needed a **multi-step workflow** that could handle different types of interactions before, during, and after payment.

### From Simple to Multi-Step

```typescript
// Before: Simple ticket purchase
EventPayment → StripeCheckout → Success

// After: Multi-step workflow with forms
EventPayment → Form → Form → StripePayment → Success
```

This required us to completely rethink our payment architecture and led to the creation of our **Fulfilment Session** system.

![Forms Workflow](/images/forms-workflow.png)

## Fulfilment Sessions: The Foundation

We realized we needed to abstract the concept of "completing a purchase" into a series of **fulfilment entities** that could be processed in sequence. 

The beauty of this system lies in its **modular design**. Each fulfillment entity is completely independent and interchangeable, allowing us to easily swap components or add new functionality without touching existing code. Need to switch from Stripe to PayPal? Simply replace the `STRIPE` entity. Want to add a waiver signing step? Insert a `WAIVER` entity before payment. This plug-and-play approach gives us incredible flexibility to customize the user journey for different event types while maintaining a clean, maintainable codebase.

### The Core Concept

```java
public enum FulfilmentEntityType {
    FORMS,    // Collect custom information
    STRIPE,   // Process payment
    END       // Complete the transaction
}
```

Each fulfilment session contains an ordered list of entities that must be completed:

```java
// Example: Event with form → payment → completion
List<FulfilmentEntity> entities = [
    FormsFulfilmentEntity,  // Collect attendee info
    StripeFulfilmentEntity, // Process payment
    EndFulfilmentEntity     // Redirect to success page
]
```

### Multi-Ticket Forms

For events requiring multiple tickets, we create **one form entity per ticket**:

```java
// 3 tickets = 3 form entities + 1 payment + 1 end
List<FulfilmentEntity> entities = [
    FormsFulfilmentEntity, // Ticket 1 info
    FormsFulfilmentEntity, // Ticket 2 info  
    FormsFulfilmentEntity, // Ticket 3 info
    StripeFulfilmentEntity, // Single payment
    EndFulfilmentEntity     // Success
]
```

## From Stateful to Stateless: A Design Evolution

### The **Stateful** Approach (v1)

Initially, we built a stateful system where the backend tracked user progress:

```java
// Backend maintains state
class FulfilmentSession {
    private int currentEntityIndex;
    private String currentUserId;
    private Map<String, FulfilmentEntity> entities;
    
    public FulfilmentEntity getCurrentEntity() {
        return entities.get(currentEntityIndex);
    }
}
```

**Problems with this approach:**
- Complex state management
- Race conditions between multiple browser tabs
- Inability to accurately manage state when users are redirected to external sites
- Difficult error recovery
- Server-side session tracking overhead

### The **Stateless** Approach (v2)

We realized a much simpler approach: **if a user has a link to a specific fulfilment entity, they're on that step**. The URL becomes the state.

```typescript
// URL structure defines the current state
/fulfilment/{sessionId}/{entityId}

// No server-side tracking needed!
// The URL tells us exactly where the user is
```

**Benefits of stateless design:**
- **Simplicity**: No complex state tracking
- **Reliability**: Users can bookmark, refresh, or share links
- **Scalability**: No server-side session storage
- **Multi-device**: Same URL works across devices
- **Error Recovery**: Users can always return to their exact position

### Implementation Details

```java
public class FulfilmentService {
    // Stateless entity info retrieval
    public GetFulfilmentEntityInfoResponse getFulfilmentEntityInfo(
        String fulfilmentSessionId, 
        String fulfilmentEntityId
    ) {
        // No session tracking - just return entity details
        FulfilmentEntity entity = getEntityById(fulfilmentEntityId);
        return createResponse(entity);
    }
}
```

The frontend handles navigation between entities by constructing URLs:

```typescript
// Navigate to next entity
const nextEntityId = await getNextFulfilmentEntity(sessionId, currentEntityId);
router.push(`/fulfilment/${sessionId}/${nextEntityId}`);
```

## The GlobalAppController: Unifying Our Architecture

As our fulfilment and forms functionality grew, we faced another challenge: **endpoint proliferation**. We had separate cloud functions for:

- `initFulfilmentSession`
- `getFulfilmentEntityInfo`  
- `getNextFulfilmentEntity`
- `saveTempFormResponse`
- `updateFulfilmentEntity`
- ...and many more

### The Problem: Cold Starts and Complexity

Each separate endpoint meant:
- **Multiple cold starts**: Each function had to warm up independently
- **Resource inefficiency**: Couldn't share minimum instances across functions
- **Deployment complexity**: Managing dozens of individual functions
- **Inconsistent error handling**: Different patterns across functions

### The Solution: One Controller to Rule Them All

We created the **GlobalAppController** – a unified endpoint that routes all requests internally:

```java
@HttpFunction
public class GlobalAppController implements HttpFunction {
    
    public void service(HttpRequest request, HttpResponse response) {
        UnifiedRequest unifiedRequest = parseRequest(request);
        Object result = routeRequest(unifiedRequest);
        sendResponse(response, result);
    }
    
    private Object routeRequest(UnifiedRequest request) {
        EndpointType endpointType = request.endpointType();
        Handler handler = HandlerRegistry.getHandler(endpointType);
        return handler.handle(handler.parse(request));
    }
}
```

### Type-Safe Routing

The magic happens in our `EndpointType` enum and `HandlerRegistry`:

```java
public enum EndpointType {
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class, SaveTempFormResponseResponse.class),
    INIT_FULFILMENT_SESSION(InitCheckoutFulfilmentSessionRequest.class, InitCheckoutFulfilmentSessionResponse.class),
    GET_FULFILMENT_ENTITY_INFO(GetFulfilmentEntityInfoRequest.class, GetFulfilmentEntityInfoResponse.class),
    // ... all other endpoints
}

public class HandlerRegistry {
    private static final Map<EndpointType, Handler<?, ?>> handlers = new HashMap<>();
    
    static {
        handlers.put(SAVE_TEMP_FORM_RESPONSE, new SaveTempFormResponseHandler());
        handlers.put(INIT_FULFILMENT_SESSION, new InitFulfilmentSessionHandler());
        handlers.put(GET_FULFILMENT_ENTITY_INFO, new GetFulfilmentEntityInfoHandler());
        // ... register all handlers
    }
}
```

### Frontend Integration

The frontend sends all requests to a single endpoint via a central `executeGlobalAppControllerFunction` method, ensuring
our code remains modular to easily add any new functionalities on the GlobalAppController.

### The Benefits

**Performance Improvements:**
- **Reduced cold starts**: Single function stays warm longer
- **Efficient resource utilization**: One minimum instance handles all traffic
- **Better connection pooling**: Shared database connections

**Development Benefits:**
- **Unified error handling**: Consistent patterns across all endpoints
- **Easier testing**: Mock one controller instead of many functions
- **Simplified deployment**: Single function to deploy and monitor
- **Type safety**: Compile-time checks for request/response types

## The Result: A Powerful, Scalable System

The combination of stateless fulfilment sessions and the GlobalAppController created a system that is:

### For Users:
- **Seamless**: Forms feel like a natural part of checkout
- **Reliable**: Can resume from any point without losing progress  
- **Flexible**: Supports complex multi-step workflows

### For Developers:
- **Maintainable**: Clear separation of concerns
- **Scalable**: Stateless design handles any load
- **Extensible**: Easy to add new fulfilment entity types

### For Infrastructure:
- **Efficient**: Reduced cold starts and better resource utilization
- **Simple**: One endpoint to monitor and maintain
- **Cost-effective**: Optimized minimum instance allocation

## Looking Forward

The architecture we built for Forms has become the foundation for other SPORTSHUB features. The fulfilment session pattern is now used for:

- **Event creation workflows**
- **User onboarding flows**  
- **Payment processing**
- **Multi-step operations**

And the GlobalAppController pattern has simplified our entire backend architecture, making it easier to add new features while maintaining performance and reliability.

---

*The SPORTSHUB Forms feature represents a perfect example of how good architecture decisions compound over time. By thinking deeply about the underlying patterns and building flexible, reusable systems, we created something that works beautifully for users while being a joy to work with as developers.*

**Want to try SPORTSHUB Forms?** Create an event and add a custom form to see the magic in action! 🚀