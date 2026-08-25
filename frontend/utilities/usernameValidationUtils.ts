/**
 * Username validation utilities for profile and routing fields.
 */

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const DISALLOWED_USERNAME_CHARS_REGEX = /[^a-z0-9_-]/g;

/**
 * Normalizes username input by lowercasing and stripping spaces and invalid characters.
 */
export const sanitizeUsernameInput = (value: string): string => {
  return value.toLowerCase().replace(/\s/g, "").replace(DISALLOWED_USERNAME_CHARS_REGEX, "");
};

/**
 * Validates a username format after sanitization.
 */
export const isValidUsername = (username: string): boolean => {
  return username.length > 0 && USERNAME_REGEX.test(username);
};

export const USERNAME_VALIDATION_ERROR_MESSAGE =
  "Username may only use lowercase letters, numbers, hyphens, and underscores.";
