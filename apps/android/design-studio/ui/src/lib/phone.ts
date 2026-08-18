/**
 * Converts Persian/Arabic digits to English digits.
 *
 * @example
 * toEnglishDigits('۰۹۱۲۳۴۵۶۷۸۹') // '09123456789'
 * toEnglishDigits('٠٩١٢٣٤٥٦٧٨٩') // '09123456789'
 */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
}

/**
 * Normalizes Iranian mobile phone numbers to standard 11-digit local format:
 *
 * Format:
 * 09xxxxxxxxx
 *
 * Supported inputs:
 *
 * @example
 * normalizePhone('+989121234567')     // '09121234567'
 * normalizePhone('+9809121234567')    // '09121234567'
 * normalizePhone('989121234567')      // '09121234567'
 * normalizePhone('9809121234567')     // '09121234567'
 * normalizePhone('09121234567')       // '09121234567'
 * normalizePhone('9121234567')        // '09121234567'
 * normalizePhone('۰۹۱۲۱۲۳۴۵۶۷')      // '09121234567'
 * normalizePhone('0912 123 4567')     // '09121234567'
 * normalizePhone('0912-123-4567')     // '09121234567'
 *
 * Notes:
 * - This function only normalizes the shape.
 * - If the input cannot be converted to a valid Iranian mobile format,
 *   it returns the cleaned numeric value.
 * - Use `isValidIranPhone()` after this function for validation.
 */
export function normalizePhone(phone: string): string {
  let value = toEnglishDigits(phone).trim()

  /**
   * Remove common separators:
   * spaces, dashes, parentheses, dots
   *
   * @example
   * '0912 123 4567' => '09121234567'
   * '0912-123-4567' => '09121234567'
   */
  value = value.replace(/[\s\-().]/g, "")

  /**
   * Convert international prefix to local prefix.
   *
   * @example
   * '+989121234567'  => '09121234567'
   * '+9809121234567' => '09121234567'
   */
  if (value.startsWith("+98")) {
    value = value.slice(3)
  }

  /**
   * Handle numbers without plus sign.
   *
   * @example
   * '989121234567'  => '9121234567'
   * '9809121234567' => '09121234567'
   */
  if (value.startsWith("98")) {
    value = value.slice(2)
  }

  /**
   * If number starts with 0098, convert it too.
   *
   * @example
   * '00989121234567'  => '09121234567'
   * '009809121234567' => '09121234567'
   */
  if (value.startsWith("0098")) {
    value = value.slice(4)
  }

  /**
   * If after removing country code it starts with 09, keep it.
   *
   * @example
   * '09121234567' => '09121234567'
   */
  if (/^09\d{9}$/.test(value)) {
    return value
  }

  /**
   * If it starts with 9 and has 10 digits, add leading zero.
   *
   * @example
   * '9121234567' => '09121234567'
   */
  if (/^9\d{9}$/.test(value)) {
    return `0${value}`
  }

  /**
   * Fallback:
   * remove every non-digit character and return cleaned value.
   * Validation should be done separately.
   */
  return value.replace(/\D/g, "")
}

/**
 * Validates Iranian mobile phone numbers.
 *
 * Valid final format:
 * 09xxxxxxxxx
 *
 * @example
 * isValidIranPhone('+989121234567')  // true
 * isValidIranPhone('09121234567')    // true
 * isValidIranPhone('9121234567')     // true
 * isValidIranPhone('02112345678')    // false
 * isValidIranPhone('12345')          // false
 */
export function isValidIranPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)

  return /^09\d{9}$/.test(normalized)
}

/**
 * Masks an Iranian phone number, showing only the first 3 and last 4 digits.
 *
 * @example
 * maskIranPhone('09121234567') // '091***4567'
 * maskIranPhone('+989121234567') // '091***4567'
 * maskIranPhone('9121234567') // '091***4567'
 * maskIranPhone('02112345678') // '021***5678' (not a valid mobile but still masked)
 */
export function maskIranPhone(phone: string): string {
  const normalized = normalizePhone(phone)

  if (!normalized) return phone || ""

  const head = normalized.slice(0, 3)
  const tail = normalized.slice(-4)
  return `${head}***${tail}`
}
