package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.models.requests.StartStripePayoutOnboardingRequest;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.services.Users;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.stripe.exception.InvalidRequestException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.PersonCollection;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.PersonCollectionCreateParams;

public class StripePayoutOnboardingServiceTest {
    @Test
    public void start_prefillsAnIndividualAndReturnsTheReviewLink() throws Exception {
        AtomicReference<AccountCreateParams> created = new AtomicReference<>();
        AtomicReference<AccountLinkCreateParams> link = new AtomicReference<>();

        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<StripeConfig> config = mockStatic(StripeConfig.class);
                MockedStatic<Account> accounts = mockStatic(Account.class);
                MockedStatic<AccountLink> links = mockStatic(AccountLink.class);
                MockedStatic<StripeAccountStore> store = mockStatic(StripeAccountStore.class)) {
            stubUser(users, null, "ada");
            Account account = mock(Account.class);
            when(account.getId()).thenReturn("acct_123");
            accounts.when(() -> Account.create(any(AccountCreateParams.class))).thenAnswer(invocation -> {
                created.set(invocation.getArgument(0));
                return account;
            });
            AccountLink accountLink = mock(AccountLink.class);
            when(accountLink.getUrl()).thenReturn("https://connect.stripe.com/setup/s/test");
            links.when(() -> AccountLink.create(any(AccountLinkCreateParams.class))).thenAnswer(invocation -> {
                link.set(invocation.getArgument(0));
                return accountLink;
            });

            String url = StripePayoutOnboardingService.start("uid-1", individualRequest());

            assertEquals("https://connect.stripe.com/setup/s/test", url);
            AccountCreateParams params = created.get();
            assertEquals(AccountCreateParams.BusinessType.INDIVIDUAL, params.getBusinessType());
            assertEquals("AU", params.getCountry());
            assertEquals("ada@example.com", params.getEmail());
            assertEquals("Ada", params.getIndividual().getFirstName());
            assertEquals("Lovelace", params.getIndividual().getLastName());
            assertNull(params.getIndividual().getPhone());
            AccountCreateParams.Individual.Dob dob = (AccountCreateParams.Individual.Dob) params.getIndividual().getDob();
            assertEquals(15L, dob.getDay().longValue());
            assertEquals("2000", params.getIndividual().getAddress().getPostalCode());
            assertEquals("7941", params.getBusinessProfile().getMcc());
            assertEquals("https://www.sportshub.net.au/user/ada", params.getBusinessProfile().getUrl());
            assertNull(params.getBusinessProfile().getSupportPhone());
            assertEquals("Ada Lovelace", params.getSettings().getPayments().getStatementDescriptor());
            assertEquals("Ada", params.getSettings().getCardPayments().getStatementDescriptorPrefix());
            assertNull(params.getCompany());
            Map<?, ?> bank = (Map<?, ?>) params.getExtraParams().get("external_account");
            assertEquals("individual", bank.get("account_holder_type"));
            assertEquals("062000", bank.get("routing_number"));
            assertEquals(StripePayoutOnboardingService.RETURN_URL, link.get().getReturnUrl());
            assertEquals(StripePayoutOnboardingService.REFRESH_URL, link.get().getRefreshUrl());
            assertEquals(AccountLinkCreateParams.CollectionOptions.Fields.EVENTUALLY_DUE,
                    link.get().getCollectionOptions().getFields());
            store.verify(() -> StripeAccountStore.saveIfAbsent("uid-1", "acct_123"));
            verify(account, never()).persons();
            verify(account, never()).delete();
        }
    }

    @Test
    public void start_prefillsAnAbnWithoutSettingIndividual() throws Exception {
        AtomicReference<AccountCreateParams> created = new AtomicReference<>();
        AtomicReference<PersonCollectionCreateParams> representative = new AtomicReference<>();

        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<StripeConfig> config = mockStatic(StripeConfig.class);
                MockedStatic<Account> accounts = mockStatic(Account.class);
                MockedStatic<AccountLink> links = mockStatic(AccountLink.class);
                MockedStatic<StripeAccountStore> store = mockStatic(StripeAccountStore.class)) {
            stubUser(users, null, "ada");
            Account account = mock(Account.class);
            when(account.getId()).thenReturn("acct_456");
            PersonCollection people = mock(PersonCollection.class);
            when(account.persons()).thenReturn(people);
            when(people.create(any(PersonCollectionCreateParams.class))).thenAnswer(invocation -> {
                representative.set(invocation.getArgument(0));
                return null;
            });
            accounts.when(() -> Account.create(any(AccountCreateParams.class))).thenAnswer(invocation -> {
                created.set(invocation.getArgument(0));
                return account;
            });
            AccountLink accountLink = mock(AccountLink.class);
            when(accountLink.getUrl()).thenReturn("https://connect.stripe.com/setup/s/abn");
            links.when(() -> AccountLink.create(any(AccountLinkCreateParams.class))).thenReturn(accountLink);

            StripePayoutOnboardingService.start("uid-1", abnRequest());

            AccountCreateParams params = created.get();
            assertNull(params.getBusinessType());
            assertNull(params.getIndividual());
            assertEquals("51824753556", params.getCompany().getTaxId());
            assertEquals("Sydney", params.getCompany().getAddress().getCity());
            PersonCollectionCreateParams person = representative.get();
            assertEquals("Ada", person.getFirstName());
            assertEquals("Lovelace", person.getLastName());
            assertNull(person.getPhone());
            assertEquals(Boolean.TRUE, person.getRelationship().getRepresentative());
            PersonCollectionCreateParams.Dob personDob = (PersonCollectionCreateParams.Dob) person.getDob();
            assertEquals(15L, personDob.getDay().longValue());
            assertEquals("2000", person.getAddress().getPostalCode());
            Map<?, ?> bank = (Map<?, ?>) params.getExtraParams().get("external_account");
            assertEquals("company", bank.get("account_holder_type"));
            store.verify(() -> StripeAccountStore.saveIfAbsent("uid-1", "acct_456"));
            verify(account, never()).delete();
        }
    }

    @Test
    public void start_doesNotCallStripeWhenAnAccountIsAlreadyStored() throws Exception {
        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<Account> accounts = mockStatic(Account.class);
                MockedStatic<StripeAccountStore> store = mockStatic(StripeAccountStore.class)) {
            stubUser(users, "acct_existing", "ada");

            try {
                StripePayoutOnboardingService.start("uid-1", individualRequest());
                fail("expected an existing Stripe account to be rejected");
            } catch (IllegalArgumentException exception) {
                assertEquals("A Stripe account is already connected", exception.getMessage());
            }

            accounts.verifyNoInteractions();
            store.verifyNoInteractions();
        }
    }

    @Test
    public void start_deletesCreatedAccountWhenAccountLinkFails() throws Exception {
        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<StripeConfig> config = mockStatic(StripeConfig.class);
                MockedStatic<Account> accounts = mockStatic(Account.class);
                MockedStatic<AccountLink> links = mockStatic(AccountLink.class);
                MockedStatic<StripeAccountStore> store = mockStatic(StripeAccountStore.class)) {
            stubUser(users, null, "ada");
            Account account = mock(Account.class);
            when(account.getId()).thenReturn("acct_orphan");
            accounts.when(() -> Account.create(any(AccountCreateParams.class))).thenReturn(account);
            links.when(() -> AccountLink.create(any(AccountLinkCreateParams.class)))
                    .thenThrow(new InvalidRequestException("Invalid link", null, "req_1", "invalid_request", 400, null));

            try {
                StripePayoutOnboardingService.start("uid-1", individualRequest());
                fail("expected Stripe validation failure");
            } catch (IllegalArgumentException exception) {
                // Expected 4xx Stripe error mapped to IllegalArgumentException.
            }

            verify(account).delete();
            store.verifyNoInteractions();
        }
    }

    @Test
    public void start_deletesCreatedAccountWhenTransactionalSaveConflicts() throws Exception {
        try (MockedStatic<Users> users = mockStatic(Users.class);
                MockedStatic<StripeConfig> config = mockStatic(StripeConfig.class);
                MockedStatic<Account> accounts = mockStatic(Account.class);
                MockedStatic<AccountLink> links = mockStatic(AccountLink.class);
                MockedStatic<StripeAccountStore> store = mockStatic(StripeAccountStore.class)) {
            stubUser(users, null, "ada");
            Account account = mock(Account.class);
            when(account.getId()).thenReturn("acct_duplicate");
            accounts.when(() -> Account.create(any(AccountCreateParams.class))).thenReturn(account);
            AccountLink accountLink = mock(AccountLink.class);
            when(accountLink.getUrl()).thenReturn("https://connect.stripe.com/setup/s/test");
            links.when(() -> AccountLink.create(any(AccountLinkCreateParams.class))).thenReturn(accountLink);
            store.when(() -> StripeAccountStore.saveIfAbsent("uid-1", "acct_duplicate"))
                    .thenThrow(new IllegalArgumentException("A Stripe account is already connected"));

            try {
                StripePayoutOnboardingService.start("uid-1", individualRequest());
                fail("expected concurrent save conflict");
            } catch (IllegalArgumentException exception) {
                assertEquals("A Stripe account is already connected", exception.getMessage());
            }

            verify(account).delete();
        }
    }

    @Test
    public void saveIfAbsent_updatesInsideTransactionWhenNoStripeAccountExists() throws Exception {
        Firestore firestore = mock(Firestore.class);
        DocumentReference privateRef = stubPrivateUserRef(firestore, "uid-1");
        Transaction transaction = mock(Transaction.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        @SuppressWarnings("unchecked")
        ApiFuture<DocumentSnapshot> snapshotFuture = mock(ApiFuture.class);
        PrivateUserData privateUser = new PrivateUserData();

        when(transaction.get(privateRef)).thenReturn(snapshotFuture);
        when(snapshotFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(PrivateUserData.class)).thenReturn(privateUser);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(firestore);
            firebase.when(() -> FirebaseService.createFirestoreTransaction(any())).thenAnswer(invocation -> {
                Transaction.Function<?> fn = invocation.getArgument(0);
                return fn.updateCallback(transaction);
            });

            StripeAccountStore.saveIfAbsent("uid-1", "acct_new");

            verify(transaction).update(privateRef, "stripeAccount", "acct_new", "stripeAccountActive", false);
        }
    }

    @Test
    public void saveIfAbsent_rejectsWithoutWritingWhenStripeAccountAlreadyExists() throws Exception {
        Firestore firestore = mock(Firestore.class);
        DocumentReference privateRef = stubPrivateUserRef(firestore, "uid-1");
        Transaction transaction = mock(Transaction.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        @SuppressWarnings("unchecked")
        ApiFuture<DocumentSnapshot> snapshotFuture = mock(ApiFuture.class);
        PrivateUserData privateUser = new PrivateUserData();
        privateUser.setStripeAccount("acct_existing");

        when(transaction.get(privateRef)).thenReturn(snapshotFuture);
        when(snapshotFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(PrivateUserData.class)).thenReturn(privateUser);

        try (MockedStatic<FirebaseService> firebase = mockStatic(FirebaseService.class)) {
            firebase.when(FirebaseService::getFirestore).thenReturn(firestore);
            firebase.when(() -> FirebaseService.createFirestoreTransaction(any())).thenAnswer(invocation -> {
                Transaction.Function<?> fn = invocation.getArgument(0);
                return fn.updateCallback(transaction);
            });

            try {
                StripeAccountStore.saveIfAbsent("uid-1", "acct_duplicate");
                fail("expected existing Stripe account in transaction to be rejected");
            } catch (IllegalArgumentException exception) {
                assertEquals("A Stripe account is already connected", exception.getMessage());
            }

            verify(transaction, never()).update(any(DocumentReference.class), any(String.class), any(), any());
        }
    }

    @Test
    public void accountParams_usesFirstNameForStatementDescriptorWhenLongEnough() {
        StartStripePayoutOnboardingRequest request = new StartStripePayoutOnboardingRequest(
                "Catherine", "Yang", "cat@example.com", false, null, "1990-01-15",
                "1 George Street", "Sydney", "NSW", "2000", "Catherine Yang", "000000", "000123456");

        AccountCreateParams params = StripePayoutOnboardingService.accountParams(
                "uid-1", "cat", StripePayoutOnboardingService.validate(request));

        assertEquals("Catherine", params.getSettings().getPayments().getStatementDescriptor());
        assertEquals("Catherine", params.getSettings().getCardPayments().getStatementDescriptorPrefix());
        assertNull(params.getBusinessProfile().getSupportPhone());
        assertNull(params.getIndividual().getPhone());
    }

    private static DocumentReference stubPrivateUserRef(Firestore firestore, String userId) {
        CollectionReference usersCollection = mock(CollectionReference.class);
        DocumentReference activeDoc = mock(DocumentReference.class);
        CollectionReference privateCollection = mock(CollectionReference.class);
        DocumentReference privateRef = mock(DocumentReference.class);
        when(firestore.collection(CollectionPaths.USERS)).thenReturn(usersCollection);
        when(usersCollection.document(CollectionPaths.ACTIVE)).thenReturn(activeDoc);
        when(activeDoc.collection(CollectionPaths.PRIVATE)).thenReturn(privateCollection);
        when(privateCollection.document(userId)).thenReturn(privateRef);
        return privateRef;
    }

    private static void stubUser(MockedStatic<Users> users, String stripeAccount, String username) throws Exception {
        PrivateUserData privateUser = new PrivateUserData();
        privateUser.setStripeAccount(stripeAccount);
        PublicUserData publicUser = new PublicUserData();
        publicUser.setUsername(username);
        users.when(() -> Users.getPrivateUserDataById("uid-1")).thenReturn(privateUser);
        users.when(() -> Users.getPublicUserDataById("uid-1")).thenReturn(publicUser);
    }

    private static StartStripePayoutOnboardingRequest individualRequest() {
        return new StartStripePayoutOnboardingRequest(
                "Ada",
                "Lovelace",
                "ada@example.com",
                false,
                null,
                "1990-01-15",
                "1 George Street",
                "Sydney",
                "NSW",
                "2000",
                "Ada Lovelace",
                "062-000",
                "12345678");
    }

    private static StartStripePayoutOnboardingRequest abnRequest() {
        return new StartStripePayoutOnboardingRequest(
                "Ada",
                "Lovelace",
                "ada@example.com",
                true,
                "51 824 753 556",
                "1990-01-15",
                "1 George Street",
                "Sydney",
                "NSW",
                "2000",
                "Ada Lovelace",
                "062000",
                "12345678");
    }
}
