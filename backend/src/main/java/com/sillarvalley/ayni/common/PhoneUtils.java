package com.sillarvalley.ayni.common;

public final class PhoneUtils {

    private PhoneUtils() {}

    public static String normalize(String raw, String countryCode) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() == 9) {
            digits = countryCode + digits;
        }
        return digits;
    }

    public static boolean isValid(String normalized, String countryCode) {
        return normalized != null && normalized.matches("^" + countryCode + "\\d{9}$");
    }
}
