// Password validation utility
// Implements strong password policy for user authentication

/**
 * Validates password against security requirements
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  // Check minimum length (8 characters)
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/. test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number");
  }

  // Check for at least one special character
  if (!/[! @#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must include at least one special character (! @#$%^&*...)");
  }

  // Check for common/weak passwords
  const commonPasswords = [
    'password', 'password123', '123456', '123456789', '12345678',
    'qwerty', 'abc123', 'monkey', '1234567', 'letmein',
    'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
    'sunshine', 'ashley', 'bailey', 'shadow', 'superman',
    'qazwsx', 'welcome', 'admin', 'login', 'passw0rd'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("This password is too common. Please choose a more secure password");
  }

  // Check for sequential characters (e.g., "123", "abc")
  if (/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push("Password should not contain sequential characters");
  }

  // Check for repeated characters (e.g., "aaa", "111")
  if (/(. )\1{2,}/.test(password)) {
    errors.push("Password should not contain repeated characters (e.g., 'aaa', '111')");
  }

  return {
    isValid: errors.length === 0,
    errors:  errors
  };
};

/**
 * Returns formatted error message for validation errors
 * @param {string[]} errors - Array of error messages
 * @returns {string} - Formatted error message
 */
export const formatPasswordErrors = (errors) => {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0];
  }

  return `Password requirements not met:\n${errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`;
};