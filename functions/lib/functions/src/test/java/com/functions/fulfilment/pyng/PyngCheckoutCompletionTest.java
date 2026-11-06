package com.functions.fulfilment.pyng;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.PyngFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSessionStatus;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.services.FulfilmentSessionPublisher;

public class PyngCheckoutCompletionTest {
    private static final String SESSION_ID = "session-1";

    private final AtomicInteger publishes = new AtomicInteger();
    private final AtomicReference<String> publishedJson = new AtomicReference<>();
    private final AtomicReference<PyngCheckoutFulfilmentSession> stored = new AtomicReference<>();

    @Before
    public void setUp() {
        publishes.set(0);
        publishedJson.set(null);
        FulfilmentSessionPublisher.transport = json -> {
            publishes.incrementAndGet();
            publishedJson.set(json);
        };
        PyngCheckoutCompletion.sessions = id -> stored.get();
        PyngCheckoutCompletion.settlements = (id, metadata, status) -> {
            PyngCheckoutFulfilmentSession session = stored.get();
            session.setPyngMetadata(metadata);
            session.setStatus(status);
            session.setIsFulfilmentSessionCrystalised(true);
        };
    }

    @After
    public void tearDown() {
        FulfilmentSessionPublisher.resetTransport();
        PyngCheckoutCompletion.reset();
        PyngService.client = PyngCheckoutClient.http();
    }

    @Test
    public void settledPublishesCompletedOnceWithTheSavedPurchaser() throws Exception {
        stored.set(session(PaymentStatus.PENDING, "Ada Lovelace", "ada@example.com"));
        PyngService.client = clientReturning("Settled");

        assertEquals(PaymentStatus.SUCCEEDED, PyngCheckoutCompletion.refresh(SESSION_ID));
        assertEquals(PaymentStatus.SUCCEEDED, PyngCheckoutCompletion.refresh(SESSION_ID));

        assertEquals(1, publishes.get());
        FulfilmentSession published = FulfilmentSession.fromJson(publishedJson.get());
        assertEquals(FulfilmentSessionStatus.COMPLETED, published.getStatus());
        assertEquals("ada@example.com", published.getPurchaserEmail());
        assertEquals("Ada Lovelace", published.getPurchaserName());
        assertTrue(published.getIsFulfilmentSessionCrystalised());
        PyngCheckoutFulfilmentSession pyng = (PyngCheckoutFulfilmentSession) published;
        assertEquals(Integer.valueOf(1500), pyng.getPrice());
        assertEquals(PaymentStatus.SUCCEEDED, pyng.getPyngMetadata().getStatus());
    }

    @Test
    public void settledWithoutPurchaserDoesNotPublish() {
        stored.set(session(PaymentStatus.PENDING, null, null));
        PyngService.client = clientReturning("Settled");

        try {
            PyngCheckoutCompletion.refresh(SESSION_ID);
            fail("Expected IllegalStateException");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("purchaser"));
        }
        assertEquals(0, publishes.get());
        assertFalse(Boolean.TRUE.equals(stored.get().getIsFulfilmentSessionCrystalised()));
    }

    @Test
    public void expiredAndDeclinedPublishAnExpiredSession() throws Exception {
        stored.set(session(PaymentStatus.PENDING, "Ada", "ada@example.com"));
        PyngService.client = clientReturning("Expired");
        assertEquals(PaymentStatus.EXPIRED, PyngCheckoutCompletion.refresh(SESSION_ID));
        assertEquals(FulfilmentSessionStatus.EXPIRED, FulfilmentSession.fromJson(publishedJson.get()).getStatus());

        publishes.set(0);
        stored.set(session(PaymentStatus.PENDING, "Ada", "ada@example.com"));
        PyngService.client = clientReturning("Declined");
        assertEquals(PaymentStatus.CANCELLED, PyngCheckoutCompletion.refresh(SESSION_ID));
        FulfilmentSession declined = FulfilmentSession.fromJson(publishedJson.get());
        assertEquals(FulfilmentSessionStatus.EXPIRED, declined.getStatus());
        assertEquals(PaymentStatus.CANCELLED,
                ((PyngCheckoutFulfilmentSession) declined).getPyngMetadata().getStatus());
        assertEquals(1, publishes.get());
    }

    @Test
    public void pendingDoesNotPublish() throws Exception {
        stored.set(session(PaymentStatus.PENDING, "Ada", "ada@example.com"));
        PyngService.client = clientReturning("Pending");

        assertEquals(PaymentStatus.PENDING, PyngCheckoutCompletion.refresh(SESSION_ID));
        assertEquals(0, publishes.get());
    }

    private static PyngCheckoutClient clientReturning(String transactionStatus) {
        return new PyngCheckoutClient(request -> new PyngCheckoutClient.RawResponse(200, """
                {"data":{"checkoutSessionId":"cs-1","transactionStatus":"%s","orderId":"%s"},"traceId":"trace-1"}
                """.formatted(transactionStatus, SESSION_ID)));
    }

    private static PyngCheckoutFulfilmentSession session(PaymentStatus status, String name, String email) {
        EventData event = new EventData();
        event.setEventId("event-1");
        PyngFulfilmentEntity pyng = PyngFulfilmentEntity.builder().url("/fulfilment/session-1/pyng").build();
        EndFulfilmentEntity end = EndFulfilmentEntity.builder().url("https://sportshub.net.au/event/success/event-1").build();
        Map<String, FulfilmentEntity> entities = Map.of("pyng", pyng, "end", end);
        return PyngCheckoutFulfilmentSession.builder()
                .id(SESSION_ID)
                .eventData(event)
                .numTickets(2)
                .price(1500)
                .eventTicketTypeId("ticket-1")
                .purchaserName(name)
                .purchaserEmail(email)
                .fulfilmentEntityIds(List.of("pyng", "end"))
                .fulfilmentEntityMap(entities)
                .pyngMetadata(PyngMetadata.builder()
                        .checkoutSessionId("cs-1")
                        .hostedPageUrl("https://sample.pyng.com.au/launch/opaque")
                        .siteId("site-1")
                        .status(status)
                        .build())
                .build();
    }
}
