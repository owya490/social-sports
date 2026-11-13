package com.functions.users.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.users.repositories.UsernameRepository;
import com.functions.users.repositories.UsernameRepository.UsernameClaim;
import com.functions.users.services.UsernameService.UsernameOptions;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

public class UsernameServiceTest {
    @Test
    public void sanitizeUsername_keepsFirestoreSafeCharacters() {
        assertEquals("alexsmith", UsernameService.sanitizeUsername("Alex Smith!"));
        assertEquals("ada_lovelace-1", UsernameService.sanitizeUsername("Ada_Lovelace-1"));
        assertEquals("user", UsernameService.sanitizeUsername("!!!"));
        assertEquals("user", UsernameService.sanitizeUsername(null));
        assertEquals("user", UsernameService.sanitizeUsername("   "));
    }

    @Test
    public void usernameOptions_addsAShortFallbackSuffix() {
        UsernameOptions options = UsernameService.usernameOptions("Alex Smith");

        assertEquals("alexsmith", options.preferred());
        assertTrue(options.fallback().startsWith("alexsmith_"));
        assertEquals(4, options.fallback().length() - "alexsmith_".length());
    }

    @Test
    public void chooseUsername_usesThePreferredNameWhenItIsFree() throws Exception {
        DocumentSnapshot publicProfile = mock(DocumentSnapshot.class);
        when(publicProfile.exists()).thenReturn(false);
        UsernameClaim preferred = claim("alexsmith", false);

        try (MockedStatic<UsernameRepository> usernames = mockStatic(UsernameRepository.class)) {
            stubClaim(usernames, "uid-1", preferred);
            Transaction transaction = mock(Transaction.class);

            UsernameClaim chosen = UsernameService.chooseUsername(transaction, "uid-1", publicProfile,
                    new UsernameOptions("alexsmith", "alexsmith_abcd"));

            assertEquals("alexsmith", chosen.name());
            assertFalse(chosen.taken());
            usernames.verify(() -> UsernameRepository.verifyUsername(any(), any(), eq("alexsmith_abcd")), never());
        }
    }

    @Test
    public void chooseUsername_usesTheFallbackWhenThePreferredNameIsTaken() throws Exception {
        DocumentSnapshot publicProfile = mock(DocumentSnapshot.class);
        when(publicProfile.exists()).thenReturn(false);
        UsernameClaim preferred = claim("alexsmith", true);
        UsernameClaim fallback = claim("alexsmith_abcd", false);

        try (MockedStatic<UsernameRepository> usernames = mockStatic(UsernameRepository.class)) {
            stubClaim(usernames, "uid-1", preferred);
            stubClaim(usernames, "uid-1", fallback);

            UsernameClaim chosen = UsernameService.chooseUsername(mock(Transaction.class), "uid-1", publicProfile,
                    new UsernameOptions("alexsmith", "alexsmith_abcd"));

            assertEquals("alexsmith_abcd", chosen.name());
        }
    }

    @Test
    public void chooseUsername_rejectsWhenBothNamesAreTaken() throws Exception {
        DocumentSnapshot publicProfile = mock(DocumentSnapshot.class);
        when(publicProfile.exists()).thenReturn(false);

        try (MockedStatic<UsernameRepository> usernames = mockStatic(UsernameRepository.class)) {
            stubClaim(usernames, "uid-1", claim("alexsmith", true));
            stubClaim(usernames, "uid-1", claim("alexsmith_abcd", true));

            try {
                UsernameService.chooseUsername(mock(Transaction.class), "uid-1", publicProfile,
                        new UsernameOptions("alexsmith", "alexsmith_abcd"));
                fail("expected both username options to be rejected");
            } catch (IllegalStateException exception) {
                assertEquals("Could not generate a username", exception.getMessage());
            }
        }
    }

    @Test
    public void chooseUsername_keepsTheUsernameAlreadyStoredOnTheProfile() throws Exception {
        DocumentSnapshot publicProfile = mock(DocumentSnapshot.class);
        when(publicProfile.exists()).thenReturn(true);
        when(publicProfile.getString("username")).thenReturn("kept_name");
        UsernameClaim existing = claim("kept_name", false);

        try (MockedStatic<UsernameRepository> usernames = mockStatic(UsernameRepository.class)) {
            stubClaim(usernames, "uid-1", existing);

            UsernameClaim chosen = UsernameService.chooseUsername(mock(Transaction.class), "uid-1", publicProfile,
                    new UsernameOptions("alexsmith", "alexsmith_abcd"));

            assertEquals("kept_name", chosen.name());
            usernames.verify(() -> UsernameRepository.verifyUsername(any(), any(), eq("alexsmith")), never());
        }
    }

    private static UsernameClaim claim(String name, boolean taken) {
        return new UsernameClaim(name, mock(DocumentReference.class), mock(DocumentSnapshot.class), taken);
    }

    private static void stubClaim(MockedStatic<UsernameRepository> usernames, String uid, UsernameClaim claim) {
        usernames.when(() -> UsernameRepository.verifyUsername(any(), eq(uid), eq(claim.name()))).thenReturn(claim);
    }
}
