package com.functions.users.provisioning;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.users.repositories.UserProvisioningRepository;
import com.functions.users.repositories.UsernameRepository;
import com.functions.users.repositories.UsernameRepository.UsernameClaim;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;
import com.google.firebase.auth.UserInfo;
import com.google.firebase.auth.UserRecord;

public class UserProvisioningServiceTest {
    private static final String DEFAULT_PROFILE_PICTURE = "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c";

    @Test
    public void provision_rejectsUnverifiedEmailBeforeWriting() throws Exception {
        try (ProvisioningHarness harness = new ProvisioningHarness()) {
            harness.stubUser(user("Alex Smith", "ada@example.com", false, null, false));

            try {
                UserProvisioningService.provision("uid-1");
                fail("expected an unverified email to be rejected");
            } catch (IllegalArgumentException exception) {
                assertEquals("Email is not verified", exception.getMessage());
            }
            harness.repository.verify(() -> UserProvisioningRepository.runTransaction(any()), never());
        }
    }

    @Test
    public void provision_rejectsAMissingEmail() throws Exception {
        try (ProvisioningHarness harness = new ProvisioningHarness()) {
            harness.stubUser(user("Alex", "  ", true, null, false));

            try {
                UserProvisioningService.provision("uid-1");
                fail("expected a blank email to be rejected");
            } catch (IllegalArgumentException exception) {
                assertEquals("Email is required", exception.getMessage());
            }
        }
    }

    @Test
    public void provision_createsAnEmailProfileAndReadsBeforeWriting() throws Exception {
        try (ProvisioningHarness harness = new ProvisioningHarness()) {
            harness.stubUser(user("Alex Smith", "ada@example.com", true, "  ", false));

            assertEquals("uid-1", UserProvisioningService.provision("uid-1"));

            assertEquals("Alex Smith", harness.publicData.get("firstName"));
            assertEquals("", harness.publicData.get("surname"));
            assertEquals("alexsmith", harness.publicData.get("username"));
            assertEquals(DEFAULT_PROFILE_PICTURE, harness.publicData.get("profilePicture"));
            assertEquals(List.of("alex", "smith"), harness.publicData.get("nameTokens"));
            assertEquals(false, harness.publicData.get("isSearchable"));
            assertEquals("ada@example.com", contactEmail(harness.privateData));
            assertTrue(harness.privateData.containsKey("onboardingCompletedAt"));
            assertNull(harness.privateData.get("onboardingCompletedAt"));
            assertEquals(Map.of("userId", "uid-1"), harness.metadata);
            assertEquals(List.of(
                    "read-public",
                    "read-private",
                    "read-metadata",
                    "write-username",
                    "write-public",
                    "write-private",
                    "write-metadata"), harness.steps);
        }
    }

    @Test
    public void provision_usesTheGoogleGivenNameAndAuthPhoto() throws Exception {
        try (ProvisioningHarness harness = new ProvisioningHarness()) {
            harness.stubUser(user("Alex Smith", "ada@example.com", true, "https://photo.example/alex.jpg", true));

            UserProvisioningService.provision("uid-1");

            assertEquals("Alex", harness.publicData.get("firstName"));
            assertEquals("alex", harness.publicData.get("username"));
            assertEquals(List.of("alex"), harness.publicData.get("nameTokens"));
            assertEquals("https://photo.example/alex.jpg", harness.publicData.get("profilePicture"));
        }
    }

    @SuppressWarnings("unchecked")
    private static String contactEmail(Map<String, Object> privateData) {
        return (String) ((Map<String, Object>) privateData.get("contactInformation")).get("email");
    }

    private static UserRecord user(String displayName, String email, boolean verified, String photoUrl,
            boolean google) {
        UserRecord user = mock(UserRecord.class);
        when(user.getDisplayName()).thenReturn(displayName);
        when(user.getEmail()).thenReturn(email);
        when(user.isEmailVerified()).thenReturn(verified);
        when(user.getPhotoUrl()).thenReturn(photoUrl);
        if (google) {
            UserInfo provider = mock(UserInfo.class);
            when(provider.getProviderId()).thenReturn("google.com");
            when(user.getProviderData()).thenReturn(new UserInfo[] { provider });
        } else {
            when(user.getProviderData()).thenReturn(new UserInfo[0]);
        }
        return user;
    }

    private static final class ProvisioningHarness implements AutoCloseable {
        private final MockedStatic<UserProvisioningRepository> repository = mockStatic(UserProvisioningRepository.class);
        private final MockedStatic<UsernameRepository> usernames = mockStatic(UsernameRepository.class);
        private final Transaction transaction = mock(Transaction.class);
        private final Map<String, Object> publicData = new HashMap<>();
        private final Map<String, Object> privateData = new HashMap<>();
        private final Map<String, Object> metadata = new HashMap<>();
        private final List<String> steps = new ArrayList<>();

        private ProvisioningHarness() {
            DocumentReference usernameRef = mock(DocumentReference.class);
            DocumentSnapshot usernameSnap = mock(DocumentSnapshot.class);
            when(usernameSnap.exists()).thenReturn(false);
            repository.when(() -> UserProvisioningRepository.runTransaction(any())).thenAnswer(invocation -> {
                Transaction.Function<?> work = invocation.getArgument(0);
                return work.updateCallback(transaction);
            });
            repository.when(() -> UserProvisioningRepository.verifyPublicProfile(eq(transaction), eq("uid-1")))
                    .thenAnswer(invocation -> {
                        steps.add("read-public");
                        return mock(DocumentSnapshot.class);
                    });
            repository.when(() -> UserProvisioningRepository.verifyPrivateProfile(eq(transaction), eq("uid-1")))
                    .thenAnswer(invocation -> {
                        steps.add("read-private");
                        return mock(DocumentSnapshot.class);
                    });
            repository.when(() -> UserProvisioningRepository.verifyMetadata(eq(transaction), eq("uid-1")))
                    .thenAnswer(invocation -> {
                        steps.add("read-metadata");
                        return mock(DocumentSnapshot.class);
                    });
            usernames.when(() -> UsernameRepository.verifyUsername(eq(transaction), eq("uid-1"), anyString()))
                    .thenAnswer(invocation -> new UsernameClaim(invocation.getArgument(2), usernameRef, usernameSnap,
                            false));
            usernames.when(() -> UsernameRepository.createUsername(eq(transaction), any(), eq("uid-1")))
                    .thenAnswer(invocation -> {
                        steps.add("write-username");
                        return null;
                    });
            repository.when(() -> UserProvisioningRepository.createPublicProfile(eq(transaction), any(), any()))
                    .thenAnswer(invocation -> {
                        steps.add("write-public");
                        publicData.putAll(invocation.getArgument(2));
                        return null;
                    });
            repository.when(() -> UserProvisioningRepository.createPrivateProfile(eq(transaction), any(), any()))
                    .thenAnswer(invocation -> {
                        steps.add("write-private");
                        privateData.putAll(invocation.getArgument(2));
                        return null;
                    });
            repository.when(() -> UserProvisioningRepository.createMetadata(eq(transaction), any(), any()))
                    .thenAnswer(invocation -> {
                        steps.add("write-metadata");
                        metadata.putAll(invocation.getArgument(2));
                        return null;
                    });
        }

        private void stubUser(UserRecord user) {
            repository.when(() -> UserProvisioningRepository.getAuthUser("uid-1")).thenReturn(user);
        }

        @Override
        public void close() {
            usernames.close();
            repository.close();
        }
    }
}
