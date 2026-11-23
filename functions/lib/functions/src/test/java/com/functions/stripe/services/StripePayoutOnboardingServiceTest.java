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

import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.models.requests.StartStripePayoutOnboardingRequest;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.services.Users;
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
            assertEquals("+61412345678", params.getIndividual().getPhone());
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
            store.verify(() -> StripeAccountStore.save("uid-1", "acct_123"));
            verify(account, never()).persons();
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
            assertEquals(Boolean.TRUE, person.getRelationship().getRepresentative());
            PersonCollectionCreateParams.Dob personDob = (PersonCollectionCreateParams.Dob) person.getDob();
            assertEquals(15L, personDob.getDay().longValue());
            assertEquals("2000", person.getAddress().getPostalCode());
            Map<?, ?> bank = (Map<?, ?>) params.getExtraParams().get("external_account");
            assertEquals("company", bank.get("account_holder_type"));
            store.verify(() -> StripeAccountStore.save("uid-1", "acct_456"));
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
    public void params_omitPhoneWhenMissingOrNonAustralian() {
        AccountCreateParams noPhone = StripePayoutOnboardingService.accountParams(
                "uid-1", "ada", StripePayoutOnboardingService.validate(individualRequest(null)));
        assertNull(noPhone.getBusinessProfile().getSupportPhone());
        assertNull(noPhone.getIndividual().getPhone());

        AccountCreateParams nonAu = StripePayoutOnboardingService.accountParams(
                "uid-1", "ada", StripePayoutOnboardingService.validate(individualRequest("412345678")));
        assertNull(nonAu.getBusinessProfile().getSupportPhone());
        assertNull(nonAu.getIndividual().getPhone());

        PersonCollectionCreateParams abnPerson = StripePayoutOnboardingService.representativeParams(
                StripePayoutOnboardingService.validate(abnRequest("   ")));
        assertNull(abnPerson.getPhone());
    }

    @Test
    public void accountParams_usesFirstNameForStatementDescriptorWhenLongEnough() {
        StartStripePayoutOnboardingRequest request = new StartStripePayoutOnboardingRequest(
                "Catherine", "Yang", "cat@example.com", null, false, null, "1990-01-15",
                "1 George Street", "Sydney", "NSW", "2000", "Catherine Yang", "000000", "000123456");

        AccountCreateParams params = StripePayoutOnboardingService.accountParams(
                "uid-1", "cat", StripePayoutOnboardingService.validate(request));

        assertEquals("Catherine", params.getSettings().getPayments().getStatementDescriptor());
        assertEquals("Catherine", params.getSettings().getCardPayments().getStatementDescriptorPrefix());
        assertNull(params.getBusinessProfile().getSupportPhone());
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
        return individualRequest("0412345678");
    }

    private static StartStripePayoutOnboardingRequest individualRequest(String phone) {
        return new StartStripePayoutOnboardingRequest(
                "Ada",
                "Lovelace",
                "ada@example.com",
                phone,
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
        return abnRequest("0412345678");
    }

    private static StartStripePayoutOnboardingRequest abnRequest(String phone) {
        return new StartStripePayoutOnboardingRequest(
                "Ada",
                "Lovelace",
                "ada@example.com",
                phone,
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
