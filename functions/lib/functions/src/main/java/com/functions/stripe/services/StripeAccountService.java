package com.functions.stripe.services;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.stripe.config.StripeConfig;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.users.utils.UsersUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.net.RequestOptions;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;

public final class StripeAccountService {
    private static final Logger logger = LoggerFactory.getLogger(StripeAccountService.class);

    private StripeAccountService() {
    }

    public static String getStripeStandardAccountUrl(String organiserId, String returnUrl, String refreshUrl)
            throws Exception {
        Firestore db = FirebaseService.getFirestore();
        DocumentReference organiserRef = UsersUtils.getUserRef(db, organiserId);
        PrivateUserData organiser = Users.getPrivateUserDataById(organiserId, Optional.empty());

        if (organiser == null) {
            logger.error("Provided organiser {} was not found in the database.", organiserRef.getPath());
            return StripeConfig.ERROR_URL;
        }

        if (Boolean.TRUE.equals(organiser.getStripeAccountActive())
                && organiser.getStripeAccount() != null
                && !organiser.getStripeAccount().isBlank()) {
            logger.info("Provided organiser {} already has an active Stripe account.", organiserRef.getPath());
            return returnUrl;
        }

        String organiserStripeAccountId = organiser.getStripeAccount();
        if (organiserStripeAccountId == null || organiserStripeAccountId.isBlank()) {
            Account account = createStripeStandardAccount(organiserId);
            String storedStripeAccountId = setStripeAccountIfMissing(organiserId, account.getId());
            AccountLink accountLink = createAccountLink(storedStripeAccountId, refreshUrl, returnUrl);
            logger.info("Created a new Stripe standard onboarding workflow for organiser {}.", organiserRef.getPath());
            return accountLink.getUrl();
        }

        Account account = Account.retrieve(organiserStripeAccountId);
        if (!Boolean.TRUE.equals(account.getChargesEnabled()) || !Boolean.TRUE.equals(account.getDetailsSubmitted())) {
            AccountLink accountLink = createAccountLink(organiserStripeAccountId, refreshUrl, returnUrl);
            logger.info("Reactivating Stripe onboarding for organiser {}.", organiserRef.getPath());
            return accountLink.getUrl();
        }

        activateStripeAccount(organiserId);
        logger.info("Organiser {} already has charges enabled and details submitted. Activating stripe account.",
                organiserRef.getPath());
        return returnUrl;
    }

    private static String setStripeAccountIfMissing(String organiserId, String stripeAccountId) throws Exception {
        return FirebaseService.createFirestoreTransaction(transaction -> {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference organiserRef = UsersUtils.getUserRef(db, organiserId);
            PrivateUserData organiser = Users.getPrivateUserDataById(organiserId, Optional.of(transaction));

            if (organiser == null) {
                logger.error("Provided organiser {} was not found before updating Stripe account.", organiserRef.getPath());
                return stripeAccountId;
            }

            if (organiser.getStripeAccount() == null || organiser.getStripeAccount().isBlank()) {
                transaction.update(organiserRef, Map.of(
                        "stripeAccount", stripeAccountId,
                        "stripeAccountActive", false));
                return stripeAccountId;
            }
            return organiser.getStripeAccount();
        });
    }

    private static void activateStripeAccount(String organiserId) throws Exception {
        FirebaseService.createFirestoreTransaction(transaction -> {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference organiserRef = UsersUtils.getUserRef(db, organiserId);
            PrivateUserData organiser = Users.getPrivateUserDataById(organiserId, Optional.of(transaction));

            if (organiser == null) {
                logger.error("Provided organiser {} was not found before activating Stripe account.",
                        organiserRef.getPath());
                return null;
            }

            transaction.update(organiserRef, "stripeAccountActive", true);
            return null;
        });
    }

    private static Account createStripeStandardAccount(String organiserId) throws StripeException {
        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey("create-stripe-standard-account-" + organiserId)
                .build();
        return Account.create(AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.STANDARD)
                .build(), requestOptions);
    }

    private static AccountLink createAccountLink(String stripeAccountId, String refreshUrl, String returnUrl)
            throws StripeException {
        return AccountLink.create(AccountLinkCreateParams.builder()
                .setAccount(stripeAccountId)
                .setRefreshUrl(refreshUrl)
                .setReturnUrl(returnUrl)
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build());
    }
}
