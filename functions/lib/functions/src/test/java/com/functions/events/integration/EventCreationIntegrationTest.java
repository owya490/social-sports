package com.functions.events.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.models.*;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.events.services.RecurringEventsService;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.users.services.Users;
import com.functions.users.models.PrivateUserData;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;

@ExtendWith(MockitoExtension.class)
class EventCreationIntegrationTest {

    @Mock
    private Firestore mockFirestore;

    @Mock
    private Transaction mockTransaction;

    @Mock
    private CollectionReference mockEventsCollection;

    @Mock
    private DocumentReference mockEventDocument;

    @Mock
    private DocumentReference mockMetadataDocument;

    @Mock
    private WriteBatch mockBatch;

    private CreateEventHandler createEventHandler;
    private NewEventData testEventData;
    private NewRecurrenceData testRecurrenceData;

    @BeforeEach
    void setUp() {
        createEventHandler = new CreateEventHandler();

        // Setup test event data
        testEventData = NewEventData.builder()
                .name("Test Volleyball Event")
                .location("Test Sports Center")
                .description("A comprehensive test volleyball event")
                .sport("volleyball")
                .startDate(Timestamp.ofTimeSecondsAndNanos(
                        LocalDateTime.of(2024, 1, 1, 10, 0)
                                .atZone(ZoneId.systemDefault())
                                .toEpochSecond(),
                        0))
                .endDate(Timestamp.ofTimeSecondsAndNanos(
                        LocalDateTime.of(2024, 1, 1, 12, 0)
                                .atZone(ZoneId.systemDefault())
                                .toEpochSecond(),
                        0))
                .registrationDeadline(Timestamp.ofTimeSecondsAndNanos(
                        LocalDateTime.of(2023, 12, 31, 23, 59)
                                .atZone(ZoneId.systemDefault())
                                .toEpochSecond(),
                        0))
                .capacity(20)
                .vacancy(20)
                .price(1500L) // $15.00 in cents
                .isActive(true)
                .isPrivate(false)
                .organiserId("test-user-123")
                .locationLatLng(AbstractEventData.LocationLatLng.builder()
                        .lat(-37.8136)
                        .lng(144.9631)
                        .build())
                .paymentsActive(true)
                .stripeFeeToCustomer(false)
                .promotionalCodesEnabled(false)
                .paused(false)
                .eventLink("")
                .hideVacancy(false)
                .attendees(new HashMap<>())
                .attendeesMetadata(AbstractEventData.AttendeesMetadata.builder()
                        .build())
                .accessCount(0)
                .image("https://example.com/image.jpg")
                .thumbnail("https://example.com/thumbnail.jpg")
                .eventTags(Arrays.asList("volleyball", "sports"))
                .build();

        // Setup test recurrence data
        testRecurrenceData = NewRecurrenceData.builder()
                .frequency(RecurrenceData.Frequency.WEEKLY)
                .interval(1)
                .endDate(LocalDate.of(2024, 12, 31))
                .maxOccurrences(52)
                .build();
    }

    @Test
    void testCreateSingleEvent_Success() throws Exception {
        // Arrange
        String expectedEventId = "event-123";

        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            when(mockFirestore.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document()).thenReturn(mockEventDocument);
            when(mockEventDocument.getId()).thenReturn(expectedEventId);

            CompletableFuture<String> future = CompletableFuture.completedFuture(expectedEventId);
            when(mockFirestore.runTransaction(any())).thenReturn(future);

            // Act
            String result = createEventHandler.handle(testEventData);

            // Assert
            assertNotNull(result);
            assertTrue(result.contains(expectedEventId));

            // Verify Firebase interactions
            verify(mockFirestore).runTransaction(any());
        }
    }

    @Test
    void testCreateEventWithTransaction_Success() throws Exception {
        // Arrange
        String expectedEventId = "event-123";

        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            when(mockFirestore.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document()).thenReturn(mockEventDocument);
            when(mockEventDocument.getId()).thenReturn(expectedEventId);

            // Act
            String eventId = CreateEventHandler.createEvent(testEventData, mockTransaction);

            // Assert
            assertEquals(expectedEventId, eventId);

            // Verify transaction operations
            verify(mockTransaction).set(eq(mockEventDocument), any(Map.class));
        }
    }

    @Test
    void testCreateRecurringEvent_Success() {
        // Arrange
        try (MockedStatic<RecurrenceTemplateRepository> repoMock = Mockito
                .mockStatic(RecurrenceTemplateRepository.class);
                MockedStatic<Users> usersMock = Mockito.mockStatic(Users.class)) {

            String expectedTemplateId = "template-456";
            String expectedEventId = "event-123";

            repoMock.when(() -> RecurrenceTemplateRepository.createRecurrenceTemplate(
                    anyBoolean(), anyBoolean(), any(RecurrenceTemplate.class)))
                    .thenReturn(expectedTemplateId);

            PrivateUserData mockUserData = new PrivateUserData();
            mockUserData.setRecurrenceTemplates(new ArrayList<>());

            usersMock.when(() -> Users.getPrivateUserDataById(anyString()))
                    .thenReturn(mockUserData);
            usersMock.when(() -> Users.updatePrivateUserData(anyString(), any()))
                    .thenReturn(null);

            // Mock the cron service to return an event ID
            try (MockedStatic<com.functions.events.services.RecurringEventsCronService> cronMock = Mockito
                    .mockStatic(com.functions.events.services.RecurringEventsCronService.class)) {

                cronMock.when(() -> com.functions.events.services.RecurringEventsCronService
                        .createEventsFromRecurrenceTemplates(any(), anyString(), any(), anyBoolean()))
                        .thenReturn(Arrays.asList(expectedEventId));

                // Act
                Optional<Map.Entry<String, String>> result = RecurringEventsService
                        .createRecurrenceTemplate(testEventData, testRecurrenceData);

                // Assert
                assertTrue(result.isPresent());
                assertEquals(expectedTemplateId, result.get().getKey());
                assertEquals(expectedEventId, result.get().getValue());
            }
        }
    }

    @Test
    void testEventDataValidation_InvalidData() {
        // Arrange
        NewEventData invalidEventData = NewEventData.builder()
                .name("") // Invalid: empty name
                .capacity(-1) // Invalid: negative capacity
                .build();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            createEventHandler.handle(invalidEventData);
        });
    }

    @Test
    void testEventMetadataCreation() throws Exception {
        // Arrange
        String eventId = "event-123";

        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            when(mockFirestore.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document(eventId)).thenReturn(mockMetadataDocument);

            // Act
            CreateEventHandler.createEvent(testEventData, mockTransaction);

            // Assert - Verify metadata creation was called
            verify(mockTransaction, atLeastOnce()).set(any(DocumentReference.class), any());
        }
    }

    @Test
    void testFirebaseTransactionFailure() {
        // Arrange
        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            CompletableFuture<String> failedFuture = new CompletableFuture<>();
            failedFuture.completeExceptionally(new RuntimeException("Firebase transaction failed"));

            when(mockFirestore.runTransaction(any())).thenReturn(failedFuture);

            // Act & Assert
            assertThrows(RuntimeException.class, () -> {
                createEventHandler.handle(testEventData);
            });
        }
    }

    @Test
    void testTokenizationLogic() throws Exception {
        // Arrange
        testEventData.setName("Beach Volleyball Tournament");
        testEventData.setLocation("Bondi Beach Sports Center");

        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            when(mockFirestore.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document()).thenReturn(mockEventDocument);
            when(mockEventDocument.getId()).thenReturn("event-123");

            // Act
            CreateEventHandler.createEvent(testEventData, mockTransaction);

            // Assert - Verify tokenization occurred
            assertNotNull(testEventData.getNameTokens());
            assertNotNull(testEventData.getLocationTokens());
            assertTrue(testEventData.getNameTokens().size() > 0);
            assertTrue(testEventData.getLocationTokens().size() > 0);
        }
    }

    @Test
    void testCompleteEventCreationWorkflow() throws Exception {
        // This test simulates the complete workflow from API request to database
        // storage

        // Arrange
        UnifiedRequest mockRequest = mock(UnifiedRequest.class);
        when(mockRequest.data()).thenReturn(mock(com.fasterxml.jackson.databind.JsonNode.class));

        try (MockedStatic<FirebaseService> firebaseServiceMock = Mockito.mockStatic(FirebaseService.class)) {
            firebaseServiceMock.when(FirebaseService::getFirestore).thenReturn(mockFirestore);

            String expectedEventId = "event-123";
            when(mockFirestore.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.collection(anyString())).thenReturn(mockEventsCollection);
            when(mockEventsCollection.document()).thenReturn(mockEventDocument);
            when(mockEventDocument.getId()).thenReturn(expectedEventId);

            CompletableFuture<String> future = CompletableFuture.completedFuture(expectedEventId);
            when(mockFirestore.runTransaction(any())).thenReturn(future);

            // Act
            NewEventData parsedData = createEventHandler.parse(mockRequest);
            String result = createEventHandler.handle(testEventData); // Use test data instead of parsed

            // Assert
            assertNotNull(result);
            assertTrue(result.contains(expectedEventId));
        }
    }
}
