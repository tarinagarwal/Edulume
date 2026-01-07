import { z } from 'zod';

/**
 * Password validation schema using Zod
 * Aligned with frontend PasswordInput component from PR #85
 * 
 * Criteria (matching frontend strength calculator):
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must include at least one special character (! @#$%^&*... )'
  )
  .refine(
    (password) => {
      // Block common passwords
      const commonPasswords = [
        'password', 'password123', '123456', '123456789', '12345678',
        'qwerty', 'abc123', 'monkey', '1234567', 'letmein',
        'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
        'sunshine', 'ashley', 'bailey', 'shadow', 'superman',
        'qazwsx', 'welcome', 'admin', 'login', 'passw0rd'
      ];
      return !commonPasswords.includes(password.toLowerCase());
    },
    { message: 'This password is too common.  Please choose a more secure password' }
  )
  .refine(
    (password) => {
      // Block sequential characters (abc, 123)
      const sequential = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
      return !sequential.test(password);
    },
    { message: 'Password should not contain sequential characters (e.g., "abc", "123")' }
  )
  .refine(
    (password) => {
      // Block repeated characters (aaa, 111)
      return !/(. )\1{2,}/.test(password);
    },
    { message: 'Password should not contain repeated characters (e.g., "aaa", "111")' }
  );

/**
 * Signup request validation schema
 */
export const signupSchema = z. object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    . string()
    .email('Please enter a valid email address'),
  password: passwordSchema,
  otp: z.string().optional()
});

/**
 * Reset password request validation schema
 */
export const resetPasswordSchema = z. object({
  email: z. string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits'),
  newPassword: passwordSchema
});

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});