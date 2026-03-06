/**
 * Philippine Phone Number Utilities
 */

export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  let cleaned = value.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('63')) {
    // If starts with 63, add +
    cleaned = '+63' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    // If starts with 0, replace with +63
    cleaned = '+63' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length <= 10) {
    // If starts with 9, add +63
    cleaned = '+63' + cleaned;
  }
  
  // Format the number for display
  if (cleaned.startsWith('+63') && cleaned.length > 3) {
    const number = cleaned.substring(3);
    if (number.length <= 3) {
      cleaned = '+63 ' + number;
    } else if (number.length <= 6) {
      cleaned = '+63 ' + number.substring(0, 3) + ' ' + number.substring(3);
    } else if (number.length <= 10) {
      cleaned = '+63 ' + number.substring(0, 3) + ' ' + number.substring(3, 6) + ' ' + number.substring(6);
    }
  }
  
  return cleaned;
};

export const validatePhilippinePhoneNumber = (phone: string): boolean => {
  // Remove spaces and formatting
  const cleaned = phone.replace(/\s/g, '');
  // Check if it matches Philippine format
  return /^(\+63|0)?[9][0-9]{9}$/.test(cleaned);
};

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all formatting and spaces
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert to +63 format
  if (cleaned.startsWith('63')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+63' + cleaned.substring(1);
  } else if (cleaned.startsWith('9')) {
    return '+63' + cleaned;
  }
  
  return phone; // Return original if can't normalize
};

export const getPhoneNumberExamples = (): string[] => {
  return [
    '+63 917 123 4567',
    '+63 918 123 4567',
    '+63 919 123 4567',
    '+63 920 123 4567',
    '+63 921 123 4567',
    '+63 922 123 4567',
    '+63 923 123 4567',
    '+63 924 123 4567',
    '+63 925 123 4567',
    '+63 926 123 4567',
    '+63 927 123 4567',
    '+63 928 123 4567',
    '+63 929 123 4567',
    '+63 930 123 4567',
    '+63 931 123 4567',
    '+63 932 123 4567',
    '+63 933 123 4567',
    '+63 934 123 4567',
    '+63 935 123 4567',
    '+63 936 123 4567',
    '+63 937 123 4567',
    '+63 938 123 4567',
    '+63 939 123 4567',
    '+63 940 123 4567',
    '+63 941 123 4567',
    '+63 942 123 4567',
    '+63 943 123 4567',
    '+63 944 123 4567',
    '+63 945 123 4567',
    '+63 946 123 4567',
    '+63 947 123 4567',
    '+63 948 123 4567',
    '+63 949 123 4567',
    '+63 950 123 4567'
  ];
};