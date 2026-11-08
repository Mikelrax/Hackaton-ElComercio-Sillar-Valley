package com.sillarvalley.ayni.map;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Optional;

public enum MapPeriod {
    ALL("all", "Cualquier fecha", null),
    TODAY("today", "Hoy", 0),
    WEEK("week", "Últimos 7 días", 7),
    MONTH("month", "Últimos 30 días", 30);

    private final String key;
    private final String label;
    private final Integer days;

    MapPeriod(String key, String label, Integer days) {
        this.key = key;
        this.label = label;
        this.days = days;
    }

    public String key() {
        return key;
    }

    public String label() {
        return label;
    }

    public Optional<OffsetDateTime> since(ZoneId zone) {
        if (days == null) {
            return Optional.empty();
        }
        if (days == 0) {
            return Optional.of(LocalDate.now(zone).atStartOfDay(zone).toOffsetDateTime());
        }
        return Optional.of(OffsetDateTime.now(zone).minusDays(days));
    }

    public static MapPeriod of(String key) {
        return Arrays.stream(values()).filter(p -> p.key.equalsIgnoreCase(key)).findFirst().orElse(ALL);
    }
}
