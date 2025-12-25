import PNF from "google-libphonenumber";

const phoneUtil = PNF.PhoneNumberUtil.getInstance();
const PNF_FORMAT = PNF.PhoneNumberFormat;

/**
 * Validates and formats a phone number to E.164 format.
 * @param {string|number} phone - The phone number to validate.
 * @param {string} defaultRegion - The country code (ISO 3166-1 alpha-2) to use if the number is missing a country code. Default is 'GB' (UK).
 * @returns {string|null} - Returns the formatted number (e.g., "+447123456789") or null if invalid.
 */
export const validatePhone = (phone, defaultRegion = "GB") => {
    if (!phone) return null;

    try {
        let numberStr = String(phone).trim();

        // 1. Try Strict Parsing (Best Case: Formats cleanly to E.164)
        try {
            const number = phoneUtil.parseAndKeepRawInput(numberStr, defaultRegion);
            if (phoneUtil.isValidNumber(number)) {
                return phoneUtil.format(number, PNF_FORMAT.E164);
            }
        } catch (e) {
            // Strict parsing failed
        }

        // 2. Permissive Fallback (User Request: "Remove Complications")
        // If it looks like enough digits, just clean it and return it.
        // Remove all non-numeric chars except '+'
        let cleaned = numberStr.replace(/[^0-9+]/g, "");

        // Fix common issues:
        // Double plus
        if (cleaned.startsWith("++")) cleaned = cleaned.substring(1);
        // OO prefix -> +
        if (cleaned.startsWith("00")) cleaned = "+" + cleaned.substring(2);

        // If it starts with a country code (e.g., 92, 1, 44) but no plus, add it.
        // Heuristic: If > 10 digits and no leading 0, likely Int'l.
        if (!cleaned.startsWith("+") && cleaned.length > 10 && !cleaned.startsWith("0")) {
            cleaned = "+" + cleaned;
        }

        // Final sanity check: does it have at least 7 digits?
        if (cleaned.replace(/[^0-9]/g, "").length >= 7) {
            // console.log(`Validator: Accepting raw/fallback number: ${cleaned}`);
            return cleaned;
        }

        return null;
    } catch (error) {
        return null;
    }
};
