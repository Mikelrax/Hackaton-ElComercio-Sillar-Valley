package com.sillarvalley.ayni.business;

import java.time.LocalDateTime;
import java.time.LocalTime;

public final class OpeningHours {

    private OpeningHours() {}

    public static boolean opensOn(String days, int dayOfWeek) {
        return days == null || days.isBlank() || days.indexOf(Character.forDigit(dayOfWeek, 10)) >= 0;
    }

    public static boolean isWithin(LocalTime opens, LocalTime closes, LocalTime now) {
        if (opens.equals(closes)) {
            return true;
        }
        if (opens.isBefore(closes)) {
            return !now.isBefore(opens) && now.isBefore(closes);
        }
        return !now.isBefore(opens) || now.isBefore(closes);
    }

    public static Boolean isOpen(LocalTime opens, LocalTime closes, String days, LocalDateTime now) {
        if (opens == null || closes == null) {
            return null;
        }
        return opensOn(days, now.getDayOfWeek().getValue()) && isWithin(opens, closes, now.toLocalTime());
    }

    public static String describe(LocalTime opens, LocalTime closes, String days, LocalDateTime now) {
        Boolean open = isOpen(opens, closes, days, now);
        if (open == null) {
            return "Horario no indicado";
        }
        if (open) {
            return "Abierto hasta las " + format(closes);
        }
        boolean opensToday = opensOn(days, now.getDayOfWeek().getValue());
        if (opensToday && now.toLocalTime().isBefore(opens)) {
            return "Cerrado · abre a las " + format(opens);
        }
        return "Cerrado ahora";
    }

    public static String format(LocalTime time) {
        int hour = time.getHour() % 12 == 0 ? 12 : time.getHour() % 12;
        String minutes = time.getMinute() == 0 ? "" : String.format(":%02d", time.getMinute());
        return hour + minutes + (time.getHour() < 12 ? " a. m." : " p. m.");
    }
}
