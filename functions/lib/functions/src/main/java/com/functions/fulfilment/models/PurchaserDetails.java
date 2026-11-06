package com.functions.fulfilment.models;

import java.util.regex.Pattern;

/**
 * Name and email collected before Pyng checkout. The email check matches
 * {@code frontend/utilities/emailValidationUtils.ts} so a value the form accepts
 * is not rejected when it is saved.
 */
public final class PurchaserDetails {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private PurchaserDetails() {
    }

    public static boolean isValid(String name, String email) {
        if (name == null || email == null) {
            return false;
        }
        return !name.trim().isEmpty() && EMAIL.matcher(email.trim()).matches();
    }

    public static String normaliseName(String name) {
        return name == null ? "" : name.trim();
    }

    public static String normaliseEmail(String email) {
        return email == null ? "" : email.trim();
    }
}
