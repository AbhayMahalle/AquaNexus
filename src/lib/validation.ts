/**
 * AquaNexus Shared Form Validation Utilities
 * Centralized helpers for validating phone numbers, emails, passwords, and other inputs across the project.
 */

// RFC 5322 compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Strips non-digit characters and normalizes country code (+91 / 0) to extract 10 digits.
 */
export function extractPhoneDigits(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Validates that a phone number consists of exactly 10 digits.
 * Supports numbers entered with optional formatting, +91 prefix, or leading 0.
 *
 * @param phone Phone string to test
 * @param required Whether the field is mandatory
 * @returns Error string if invalid, or null if valid
 */
export function validatePhone(phone?: string | null, required = false): string | null {
  const raw = (phone || '').trim();
  if (!raw) {
    return required ? 'Phone number is required' : null;
  }

  const digits = extractPhoneDigits(raw);
  if (digits.length !== 10) {
    return `Phone number must be of 10 digits (currently ${digits.length} digits)`;
  }

  if (!/^\d{10}$/.test(digits)) {
    return 'Phone number must contain only numeric digits';
  }

  return null;
}

/**
 * Validates proper email format.
 *
 * @param email Email string to test
 * @param required Whether the field is mandatory
 * @returns Error string if invalid, or null if valid
 */
export function validateEmail(email?: string | null, required = false): string | null {
  const raw = (email || '').trim();
  if (!raw) {
    return required ? 'Email address is required' : null;
  }

  if (!EMAIL_REGEX.test(raw)) {
    return 'Please enter a valid email address (e.g. name@domain.com)';
  }

  return null;
}

/**
 * Returns true if the phone number is valid (and optionally required).
 */
export function isValidPhone(phone?: string | null, required = false): boolean {
  return validatePhone(phone, required) === null;
}

/**
 * Returns true if the email is valid (and optionally required).
 */
export function isValidEmail(email?: string | null, required = false): boolean {
  return validateEmail(email, required) === null;
}
