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
import com.functions.utils.UrlUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
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
    static final String RETURN_URL = UrlUtils.SPORTSHUB_URL + "/organiser/v2/settings";
    static final String REFRESH_URL = UrlUtils.SPORTSHUB_URL + "/stripe/refreshAccountLink";
    private static final String PRODUCT_DESCRIPTION = "Sells tickets and takes bookings for social sports events on SPORTSHUB.";

    record ValidatedDetails(
            String firstName,
            String lastName,
            String email,
            boolean hasAbn,
            String abn,
            LocalDate dob,
            String line1,
            String city,
            String state,
            String postcode,
            String accountHolderName,
            String bsb,
            String accountNumber) {
    }

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
        ValidatedDetails details = validate(request);
        AccountCreateParams params = accountParams(userId, username, details);

        StripeConfig.initialize();
        Account account = null;
        AccountLink link;
        try {
            account = Account.create(params);
            if (details.hasAbn()) {
                account.persons().create(representativeParams(details));
            }
            link = AccountLink.create(linkParams(account.getId()));
        } catch (StripeException e) {
            deleteQuietly(account, userId);
            logger.error("Stripe payout onboarding failed for user {} code={}", userId, e.getCode());
            // A 4xx from Stripe means Stripe rejected the details, so the organiser can fix them.
            Integer stripeStatus = e.getStatusCode();
            if (stripeStatus != null && stripeStatus >= 400 && stripeStatus < 500) {
                throw new IllegalArgumentException(e.getMessage());
            }
            throw new IllegalStateException("Stripe could not start payout onboarding");
        }

        try {
            StripeAccountStore.saveIfAbsent(userId, account.getId());
        } catch (Exception e) {
            deleteQuietly(account, userId);
            throw e;
        }
        logger.info("Created Stripe account {} for user {}", account.getId(), userId);
        return link.getUrl();
    }

    static ValidatedDetails validate(StartStripePayoutOnboardingRequest request) {
        String firstName = required(request.firstName(), "Enter your first name");
        String lastName = required(request.lastName(), "Enter your last name");
        String email = required(request.email(), "Enter your email");
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Enter a valid email");
        }
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
        LocalDate dob = parseAdultDob(request.dateOfBirth());

        String abn = null;
        if (request.hasAbn()) {
            abn = digits(request.abn());
            if (!isValidAbn(abn)) {
                throw new IllegalArgumentException("Enter a valid ABN");
            }
        }

        return new ValidatedDetails(
                firstName, lastName, email, request.hasAbn(), abn, dob,
                line1, city, state, postcode, accountHolderName, bsb, accountNumber);
    }

    static AccountCreateParams accountParams(String userId, String username, ValidatedDetails details) {
        String profilePath = username == null || username.isBlank() ? userId : username;
        AccountCreateParams.Builder builder = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.STANDARD)
                .setCountry("AU")
                .setEmail(details.email())
                .setBusinessProfile(AccountCreateParams.BusinessProfile.builder()
                        .setMcc("7941")
                        .setProductDescription(PRODUCT_DESCRIPTION)
                        .setUrl(UrlUtils.SPORTSHUB_URL + "/user/" + profilePath)
                        .build())
                .putExtraParam("external_account", bankAccount(details));

        String statementDescriptor = statementDescriptor(details.firstName(), details.lastName());
        String statementDescriptorPrefix = statementDescriptorPrefix(details.firstName(), details.lastName());
        if (statementDescriptor != null || statementDescriptorPrefix != null) {
            AccountCreateParams.Settings.Builder settings = AccountCreateParams.Settings.builder();
            if (statementDescriptor != null) {
                settings.setPayments(AccountCreateParams.Settings.Payments.builder()
                        .setStatementDescriptor(statementDescriptor)
                        .build());
            }
            if (statementDescriptorPrefix != null) {
                settings.setCardPayments(AccountCreateParams.Settings.CardPayments.builder()
                        .setStatementDescriptorPrefix(statementDescriptorPrefix)
                        .build());
            }
            builder.setSettings(settings.build());
        }

        if (details.hasAbn()) {
            return builder
                    .setCompany(AccountCreateParams.Company.builder()
                            .setTaxId(details.abn())
                            .setAddress(AccountCreateParams.Company.Address.builder()
                                    .setLine1(details.line1())
                                    .setCity(details.city())
                                    .setState(details.state())
                                    .setPostalCode(details.postcode())
                                    .setCountry("AU")
                                    .build())
                            .build())
                    .build();
        }

        return builder
                .setBusinessType(AccountCreateParams.BusinessType.INDIVIDUAL)
                .setIndividual(AccountCreateParams.Individual.builder()
                        .setFirstName(details.firstName())
                        .setLastName(details.lastName())
                        .setEmail(details.email())
                        .setDob(AccountCreateParams.Individual.Dob.builder()
                                .setDay((long) details.dob().getDayOfMonth())
                                .setMonth((long) details.dob().getMonthValue())
                                .setYear((long) details.dob().getYear())
                                .build())
                        .setAddress(AccountCreateParams.Individual.Address.builder()
                                .setLine1(details.line1())
                                .setCity(details.city())
                                .setState(details.state())
                                .setPostalCode(details.postcode())
                                .setCountry("AU")
                                .build())
                        .build())
                .build();
    }

    /**
     * The person completing signup is the business representative. Stripe stores
     * that person separately when the account has an ABN.
     */
    static PersonCollectionCreateParams representativeParams(ValidatedDetails details) {
        return PersonCollectionCreateParams.builder()
                .setFirstName(details.firstName())
                .setLastName(details.lastName())
                .setEmail(details.email())
                .setDob(PersonCollectionCreateParams.Dob.builder()
                        .setDay((long) details.dob().getDayOfMonth())
                        .setMonth((long) details.dob().getMonthValue())
                        .setYear((long) details.dob().getYear())
                        .build())
                .setAddress(PersonCollectionCreateParams.Address.builder()
                        .setLine1(details.line1())
                        .setCity(details.city())
                        .setState(details.state())
                        .setPostalCode(details.postcode())
                        .setCountry("AU")
                        .build())
                .setRelationship(PersonCollectionCreateParams.Relationship.builder()
                        .setRepresentative(true)
                        .build())
                .build();
    }

    private static AccountLinkCreateParams linkParams(String accountId) {
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

    private static Map<String, Object> bankAccount(ValidatedDetails details) {
        Map<String, Object> bank = new HashMap<>();
        bank.put("object", "bank_account");
        bank.put("country", "AU");
        bank.put("currency", "aud");
        bank.put("account_holder_name", details.accountHolderName());
        bank.put("account_holder_type", details.hasAbn() ? "company" : "individual");
        bank.put("routing_number", details.bsb());
        bank.put("account_number", details.accountNumber());
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

    private static void deleteQuietly(Account account, String userId) {
        if (account == null) {
            return;
        }
        try {
            account.delete();
        } catch (Exception deleteError) {
            logger.error("Failed to delete orphaned Stripe account {} for user {}", account.getId(), userId, deleteError);
        }
    }

    private static String statementDescriptor(String firstName, String lastName) {
        String candidate = sanitizeDescriptor(firstName);
        if (candidate.length() < 5) {
            candidate = sanitizeDescriptor(firstName + " " + lastName);
        }
        return clampDescriptor(candidate, 5, 22);
    }

    private static String statementDescriptorPrefix(String firstName, String lastName) {
        String candidate = sanitizeDescriptor(firstName);
        if (candidate.length() < 2) {
            candidate = sanitizeDescriptor(firstName + " " + lastName);
        }
        return clampDescriptor(candidate, 2, 10);
    }

    private static String sanitizeDescriptor(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^\\x20-\\x7E]|[<>\\\\\"'*]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String clampDescriptor(String candidate, int minLength, int maxLength) {
        String trimmed = candidate.length() > maxLength ? candidate.substring(0, maxLength).trim() : candidate;
        if (trimmed.length() < minLength || !trimmed.matches(".*[A-Za-z].*")) {
            return null;
        }
        return trimmed;
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
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

/**
 * Saves only the new Stripe account id inside a Firestore transaction when no Stripe account is connected yet.
 * Keeps external Stripe API calls outside the retryable transaction callback.
 */
class StripeAccountStore {
    static void saveIfAbsent(String userId, String stripeAccountId) throws Exception {
        FirebaseService.createFirestoreTransaction(transaction -> {
            DocumentReference privateRef = FirebaseService.getFirestore()
                    .collection(CollectionPaths.USERS)
                    .document(CollectionPaths.ACTIVE)
                    .collection(CollectionPaths.PRIVATE)
                    .document(userId);
            DocumentSnapshot snapshot = transaction.get(privateRef).get();
            if (!snapshot.exists()) {
                throw new NotFoundException("User was not found");
            }
            PrivateUserData privateUser = snapshot.toObject(PrivateUserData.class);
            if (privateUser == null) {
                throw new NotFoundException("User was not found");
            }
            if (privateUser.getStripeAccount() != null && !privateUser.getStripeAccount().isBlank()) {
                throw new IllegalArgumentException("A Stripe account is already connected");
            }
            transaction.update(privateRef, "stripeAccount", stripeAccountId, "stripeAccountActive", false);
            return null;
        });
    }
}
