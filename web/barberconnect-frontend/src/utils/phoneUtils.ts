/**
 * Philippine Phone Number Utilities
 * Handles formatting, validation, and normalization of Philippine phone numbers
 */

/**
 * Formats a phone number to Philippine format: +63 9XX XXX XXXX
 * @param phoneNumber - Raw phone number string
 * @returns Formatted phone number or original if invalid
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  let normalizedDigits = digits;
  
  // If starts with 63, it's already in international format
  if (digits.startsWith('63')) {
    normalizedDigits = digits;
  }
  // If starts with 0, replace with 63
  else if (digits.startsWith('0')) {
    normalizedDigits = '63' + digits.substring(1);
  }
  // If starts with 9 and is 10 digits, add 63
  else if (digits.startsWith('9') && digits.length === 10) {
    normalizedDigits = '63' + digits;
  }
  
  // Format: +63 9XX XXX XXXX
  if (normalizedDigits.length === 12 && normalizedDigits.startsWith('63')) {
    const countryCode = normalizedDigits.substring(0, 2); // 63
    const areaCode = normalizedDigits.substring(2, 5); // 9XX
    const firstPart = normalizedDigits.substring(5, 8); // XXX
    const secondPart = normalizedDigits.substring(8, 12); // XXXX
    
    return `+${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
  }
  
  // Return original if can't format
  return phoneNumber;
};

/**
 * Validates Philippine phone number format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid Philippine mobile number
 */
export const validatePhilippinePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check different valid formats
  const validPatterns = [
    /^639\d{9}$/, // +639XXXXXXXXX (12 digits starting with 639)
    /^09\d{9}$/, // 09XXXXXXXXX (11 digits starting with 09)
    /^9\d{9}$/, // 9XXXXXXXXX (10 digits starting with 9)
  ];
  
  return validPatterns.some(pattern => pattern.test(digits));
};

/**
 * Normalizes phone number to international format (639XXXXXXXXX)
 * @param phoneNumber - Phone number to normalize
 * @returns Normalized phone number or empty string if invalid
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  if (digits.startsWith('639') && digits.length === 12) {
    return digits; // Already normalized
  } else if (digits.startsWith('09') && digits.length === 11) {
    return '63' + digits.substring(1); // Remove 0, add 63
  } else if (digits.startsWith('9') && digits.length === 10) {
    return '63' + digits; // Add 63 prefix
  }
  
  return ''; // Invalid format
};

/**
 * Formats phone number as user types (real-time formatting)
 * @param value - Current input value
 * @returns Formatted value for display
 */
export const formatPhoneNumberInput = (value: string): string => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // If empty, return empty
  if (!cleaned) return '';
  
  // If starts with +63, format accordingly
  if (cleaned.startsWith('+63')) {
    const digits = cleaned.substring(3);
    if (digits.length === 0) return '+63 ';
    if (digits.length <= 3) return `+63 ${digits}`;
    if (digits.length <= 6) return `+63 ${digits.substring(0, 3)} ${digits.substring(3)}`;
    return `+63 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 10)}`;
  }
  
  // If starts with 09, format as local number
  if (cleaned.startsWith('09')) {
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 11)}`;
  }
  
  // Default: just return the cleaned input
  return cleaned;
};

/**
 * Gets placeholder text for phone input
 * @returns Placeholder string
 */
export const getPhoneNumberPlaceholder = (): string => {
  return '+63 9XX XXX XXXX';
};

/**
 * Gets example phone numbers for help text
 * @returns Array of example phone numbers
 */
export const getPhoneNumberExamples = (): string[] => {
  return [
    '+63 917 123 4567',
    '+63 905 987 6543',
    '0917 123 4567',
    '09059876543'
  ];
};