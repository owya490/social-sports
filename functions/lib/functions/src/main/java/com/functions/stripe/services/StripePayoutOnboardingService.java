package com.functions.stripe.services;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.global.exceptions.NotFoundException;
import com.functions.stripe.config.StripeConfig;
import com.functions.stripe.models.requests.StartStripePayoutOnboardingRequest;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.services.Users;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.PersonCollectionCreateParams;

/**
 * Creates a Standard Stripe account with the details from Getting Paid, then returns
 * the hosted onboarding link so the organiser can review and accept Stripe's terms.
 */
public class StripePayoutOnboardingService {
    private static final Logger logger = LoggerFactory.getLogger(StripePayoutOnboardingService.class);
    private static final ZoneId SYDNEY = ZoneId.of("Australia/Sydney");
    private static final Set<String> AU_STATES = Set.of("NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT");
    private static final int[] ABN_WEIGHTS = {10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
    static final String RETURN_URL = "https://www.sportshub.net.au/organiser/v2/settings";
    static final String REFRESH_URL = "https://www.sportshub.net.au/stripe/refreshAccountLink";
    private static final String PRODUCT_DESCRIPTION = "Sells tickets and takes bookings for social sports events on SPORTSHUB.";

    public static String start(String userId, StartStripePayoutOnboardingRequest request) throws Exception {
        PrivateUserData privateUser = Users.getPrivateUserDataById(userId);
        if (privateUser == null) {
            throw new NotFoundException("User was not found");
        }
        if (privateUser.getStripeAccount() != null && !privateUser.getStripeAccount().isBlank()) {
            throw new IllegalArgumentException("A Stripe account is already connected");
        }

        PublicUserData publicUser = Users.getPublicUserDataById(userId);
        String username = publicUser == null ? null : publicUser.getUsername();
        AccountCreateParams params = accountParams(userId, username, request);

        StripeConfig.initialize();
        Account account;
        AccountLink link;
        try {
            account = Account.create(params);
            if (request.hasAbn()) {
                account.persons().create(representativeParams(request));
            }
            link = AccountLink.create(linkParams(account.getId()));
        } catch (StripeException e) {
            logger.error("Stripe payout onboarding failed for user {} code={}", userId, e.getCode());
            throw new IllegalStateException("Stripe could not start payout onboarding");
        }

        StripeAccountStore.save(userId, account.getId());
        logger.info("Created Stripe account {} for user {}", account.getId(), userId);
        return link.getUrl();
    }

    static AccountCreateParams accountParams(String userId, String username, StartStripePayoutOnboardingRequest request) {
        String firstName = required(request.firstName(), "Enter your first name");
        String lastName = required(request.lastName(), "Enter your last name");
        String email = required(request.email(), "Enter your email");
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Enter a valid email");
        }
        String phone = optionalAustralianE164(request.phone());
        String accountHolderName = blankToNull(request.accountHolderName());
        if (accountHolderName == null) {
            accountHolderName = firstName + " " + lastName;
        }
        String bsb = digits(request.bsb());
        if (bsb.length() != 6) {
            throw new IllegalArgumentException("Enter a valid BSB");
        }
        String accountNumber = digits(request.accountNumber());
        if (accountNumber.length() < 5 || accountNumber.length() > 10) {
            throw new IllegalArgumentException("Enter a valid account number");
        }

        String profilePath = username == null || username.isBlank() ? userId : username;
        AccountCreateParams.Builder builder = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.STANDARD)
                .setCountry("AU")
                .setEmail(email)
                .setBusinessProfile(AccountCreateParams.BusinessProfile.builder()
                        .setMcc("7941")
                        .setProductDescription(PRODUCT_DESCRIPTION)
                        .setSupportPhone(phone)
                        .setUrl("https://www.sportshub.net.au/user/" + profilePath)
                        .build())
                .putExtraParam("external_account", bankAccount(accountHolderName, bsb, accountNumber, request.hasAbn()));

        String line1 = required(request.addressLine1(), "Enter your address");
        String city = required(request.city(), "Enter your city");
        String state = request.state() == null ? "" : request.state().trim().toUpperCase();
        if (!AU_STATES.contains(state)) {
            throw new IllegalArgumentException("Choose an Australian state");
        }
        String postcode = digits(request.postcode());
        if (postcode.length() != 4) {
            throw new IllegalArgumentException("Enter a 4-digit postcode");
        }

        parseAdultDob(request.dateOfBirth());

        if (request.hasAbn()) {
            String abn = digits(request.abn());
            if (!isValidAbn(abn)) {
                throw new IllegalArgumentException("Enter a valid ABN");
            }
            builder.setCompany(AccountCreateParams.Company.builder()
                    .setTaxId(abn)
                    .setAddress(AccountCreateParams.Company.Address.builder()
                            .setLine1(line1)
                            .setCity(city)
                            .setState(state)
                            .setPostalCode(postcode)
                            .setCountry("AU")
                            .build())
                    .build());
            return builder.build();
        }

        LocalDate dob = parseAdultDob(request.dateOfBirth());

        return builder
                .setBusinessType(AccountCreateParams.BusinessType.INDIVIDUAL)
                .setIndividual(AccountCreateParams.Individual.builder()
                        .setFirstName(firstName)
                        .setLastName(lastName)
                        .setEmail(email)
                        .setPhone(phone)
                        .setDob(AccountCreateParams.Individual.Dob.builder()
                                .setDay((long) dob.getDayOfMonth())
                                .setMonth((long) dob.getMonthValue())
                                .setYear((long) dob.getYear())
                                .build())
                        .setAddress(AccountCreateParams.Individual.Address.builder()
                                .setLine1(line1)
                                .setCity(city)
                                .setState(state)
                                .setPostalCode(postcode)
                                .setCountry("AU")
                                .build())
                        .build())
                .build();
    }

    /**
     * The person completing signup is the business representative. Stripe stores
     * that person separately when the account has an ABN.
     */
    static PersonCollectionCreateParams representativeParams(StartStripePayoutOnboardingRequest request) {
        LocalDate dob = parseAdultDob(request.dateOfBirth());
        String line1 = required(request.addressLine1(), "Enter your address");
        String city = required(request.city(), "Enter your city");
        String state = request.state() == null ? "" : request.state().trim().toUpperCase();
        String postcode = digits(request.postcode());
        return PersonCollectionCreateParams.builder()
                .setFirstName(required(request.firstName(), "Enter your first name"))
                .setLastName(required(request.lastName(), "Enter your last name"))
                .setEmail(required(request.email(), "Enter your email"))
                .setPhone(optionalAustralianE164(request.phone()))
                .setDob(PersonCollectionCreateParams.Dob.builder()
                        .setDay((long) dob.getDayOfMonth())
                        .setMonth((long) dob.getMonthValue())
                        .setYear((long) dob.getYear())
                        .build())
                .setAddress(PersonCollectionCreateParams.Address.builder()
                        .setLine1(line1)
                        .setCity(city)
                        .setState(state)
                        .setPostalCode(postcode)
                        .setCountry("AU")
                        .build())
                .setRelationship(PersonCollectionCreateParams.Relationship.builder()
                        .setRepresentative(true)
                        .build())
                .build();
    }

    static AccountLinkCreateParams linkParams(String accountId) {
        return AccountLinkCreateParams.builder()
                .setAccount(accountId)
                .setRefreshUrl(REFRESH_URL)
                .setReturnUrl(RETURN_URL)
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .setCollectionOptions(AccountLinkCreateParams.CollectionOptions.builder()
                        .setFields(AccountLinkCreateParams.CollectionOptions.Fields.EVENTUALLY_DUE)
                        .build())
                .build();
    }

    private static Map<String, Object> bankAccount(String accountHolderName, String bsb, String accountNumber, boolean hasAbn) {
        Map<String, Object> bank = new HashMap<>();
        bank.put("object", "bank_account");
        bank.put("country", "AU");
        bank.put("currency", "aud");
        bank.put("account_holder_name", accountHolderName);
        bank.put("account_holder_type", hasAbn ? "company" : "individual");
        bank.put("routing_number", bsb);
        bank.put("account_number", accountNumber);
        return bank;
    }

    private static LocalDate parseAdultDob(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Enter your date of birth");
        }
        LocalDate dob;
        try {
            dob = LocalDate.parse(value.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Enter your date of birth");
        }
        if (dob.plusYears(18).isAfter(LocalDate.now(SYDNEY))) {
            throw new IllegalArgumentException("You must be 18 or older");
        }
        return dob;
    }

    static boolean isValidAbn(String abn) {
        if (abn == null || !abn.matches("\\d{11}")) {
            return false;
        }
        int sum = 0;
        for (int i = 0; i < ABN_WEIGHTS.length; i++) {
            int digit = abn.charAt(i) - '0';
            if (i == 0) {
                digit -= 1;
            }
            sum += digit * ABN_WEIGHTS[i];
        }
        return sum % 89 == 0;
    }

    /**
     * Normalises an Australian phone number for Stripe prefill, returning null when
     * missing or non-AU so Stripe collects it during hosted onboarding instead of
     * blocking a step that has no phone field.
     */
    private static String optionalAustralianE164(String phone) {
        if (blankToNull(phone) == null) {
            return null;
        }
        String digits = digits(phone);
        if (digits.startsWith("0")) {
            digits = "61" + digits.substring(1);
        }
        if (!digits.startsWith("61") || digits.length() < 11) {
            return null;
        }
        return "+" + digits;
    }

    private static String digits(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    private static String required(String value, String message) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(message);
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

/** Writes only the new Stripe account id. Other private user fields stay as they are. */
class StripeAccountStore {
    static void save(String userId, String stripeAccountId) throws Exception {
        FirebaseService.getFirestore()
                .collection(CollectionPaths.USERS)
                .document(CollectionPaths.ACTIVE)
                .collection(CollectionPaths.PRIVATE)
                .document(userId)
                .update("stripeAccount", stripeAccountId, "stripeAccountActive", false)
                .get();
    }
}
