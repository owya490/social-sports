/**
 * Phone validation utilities for profile and other contact fields.
 */

/**
 * Validates that a phone number has more than 8 digits.
 * Non-digit characters are ignored so formatted values still count.
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 8;
};

export const PHONE_VALIDATION_ERROR_MESSAGE = "Phone number must be more than 8 digits";
