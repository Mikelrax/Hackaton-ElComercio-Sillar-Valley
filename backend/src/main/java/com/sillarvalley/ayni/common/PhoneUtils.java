package com.sillarvalley.ayni.common;

/** Normaliza teléfonos peruanos: "+51 987-654-321" y "987654321" -> "51987654321". */
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
