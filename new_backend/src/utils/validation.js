const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Normalizes and extracts 10 digits from phone string, handling optional +91, 91, or leading 0.
 */
function extractPhoneDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Returns true if the phone resolves to exactly 10 numeric digits.
 */
function isValidPhone(phone) {
  if (!phone) return false;
  const digits = extractPhoneDigits(phone);
  return digits.length === 10 && /^\d{10}$/.test(digits);
}

/**
 * Returns true if the email matches valid RFC format.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

module.exports = {
  EMAIL_REGEX,
  extractPhoneDigits,
  isValidPhone,
  isValidEmail,
};
