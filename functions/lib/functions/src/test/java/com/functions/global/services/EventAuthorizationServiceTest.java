package com.functions.global.services;

import org.junit.Test;

import com.functions.global.exceptions.AuthorizationException;

/**
 * {@code requireOrganiserAccess} is not covered here: it calls
 * {@code EventsRepository.getEventById}, which hits Firestore. Exercising it would
 * need either a live Firestore connection or static mocking of the repository
 * call, and this project has no static-mocking dependency (e.g. Mockito) in
 * pom.xml to add without operator approval.
 */
public class EventAuthorizationServiceTest {

    @Test
    public void requireMatchingUser_allowsMatchingUid() {
        EventAuthorizationService.requireMatchingUser("uid-1", "uid-1", "denied");
    }

    @Test(expected = AuthorizationException.class)
    public void requireMatchingUser_rejectsDifferentUid() {
        EventAuthorizationService.requireMatchingUser("uid-1", "uid-2", "denied");
    }

    /**
     * Null on either side must deny rather than silently pass. A null uid means no
     * authenticated caller; a null expected owner means the resource has no
     * recorded owner. Neither is grounds for access.
     */
    @Test(expected = AuthorizationException.class)
    public void requireMatchingUser_rejectsNullUid() {
        EventAuthorizationService.requireMatchingUser(null, "uid-2", "denied");
    }

    @Test(expected = AuthorizationException.class)
    public void requireMatchingUser_rejectsNullExpectedUid() {
        EventAuthorizationService.requireMatchingUser("uid-1", null, "denied");
    }

    @Test(expected = AuthorizationException.class)
    public void requireMatchingUser_rejectsBothNull() {
        EventAuthorizationService.requireMatchingUser(null, null, "denied");
    }
}
