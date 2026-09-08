"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordPolicy = validatePasswordPolicy;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateDefaultPassword = generateDefaultPassword;
const crypto_1 = __importDefault(require("crypto"));
const ALLOWED_SPECIAL_CHARS = '!@#$%&_*';
const SPECIAL_CHAR_REGEX = /[!@#$%&_*]/;
const UPPERCASE_REGEX = /[A-Z]/;
const MIN_LENGTH = 9;
/**
 * Validates password according to studio security policy:
 * - Minimum Length: 9
 * - At least one uppercase letter (A-Z)
 * - At least one special character from (!@#$%&_*)
 */
function validatePasswordPolicy(password) {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            error: 'Password is required.',
            checks: { minLength: false, hasUppercase: false, hasSpecialChar: false },
        };
    }
    const minLength = password.length >= MIN_LENGTH;
    const hasUppercase = UPPERCASE_REGEX.test(password);
    const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);
    const isValid = minLength && hasUppercase && hasSpecialChar;
    if (!isValid) {
        const missing = [];
        if (!minLength)
            missing.push(`at least ${MIN_LENGTH} characters`);
        if (!hasUppercase)
            missing.push('one uppercase letter (A-Z)');
        if (!hasSpecialChar)
            missing.push(`one special character (${ALLOWED_SPECIAL_CHARS})`);
        return {
            isValid: false,
            error: `Password must contain ${missing.join(', ')}.`,
            checks: { minLength, hasUppercase, hasSpecialChar },
        };
    }
    return {
        isValid: true,
        checks: { minLength, hasUppercase, hasSpecialChar },
    };
}
/**
 * Generates a cryptographic scrypt hash with a random 16-byte salt.
 * Stored format: `salt:derivedKeyHex`
 */
function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const derivedKey = crypto_1.default.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
}
/**
 * Verifies a plain password against the stored `salt:derivedKeyHex` hash.
 */
function verifyPassword(password, storedHash) {
    if (!storedHash || !password)
        return false;
    const parts = storedHash.split(':');
    if (parts.length !== 2)
        return false;
    const [salt, keyHex] = parts;
    try {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        const derivedKey = crypto_1.default.scryptSync(password, salt, 64);
        return crypto_1.default.timingSafeEqual(keyBuffer, derivedKey);
    }
    catch {
        return false;
    }
}
/**
 * Generates a compliant default password for newly onboarded team members.
 */
function generateDefaultPassword() {
    return 'Orangyy@2026!';
}
