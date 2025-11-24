/**
 * Password validation utilities
 */

/**
 * Validate password strength
 * Requirements: 
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePasswordStrength = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Phải có ít nhất 1 chữ hoa');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Phải có ít nhất 1 chữ thường');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Phải có ít nhất 1 chữ số');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)');
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength: getPasswordStrength(password)
    };
};

/**
 * Get password strength level
 */
const getPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', label: 'Yếu', color: 'red' };
    if (strength <= 4) return { level: 'medium', label: 'Trung bình', color: 'yellow' };
    return { level: 'strong', label: 'Mạnh', color: 'green' };
};

/**
 * Generate a strong random password
 */
export const generateStrongPassword = (length = 12) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
