/**
 * Email validation utilities for use across fulfilment types and other components.
 */

// Email validation regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format.
 * @param email - The email address to validate
 * @returns true if the email format is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Error message for invalid email format.
 */
export const EMAIL_VALIDATION_ERROR_MESSAGE = "Please enter a valid email address";


