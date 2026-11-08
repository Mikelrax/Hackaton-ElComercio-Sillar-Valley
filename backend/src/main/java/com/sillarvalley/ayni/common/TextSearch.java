package com.sillarvalley.ayni.common;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

public final class TextSearch {

    private TextSearch() {}

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String noAccents = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return noAccents.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9ñ ]", " ").replaceAll("\\s+", " ").trim();
    }

    public static List<String> tokens(String query) {
        String normalized = normalize(query);
        if (normalized.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(normalized.split(" ")).filter(t -> t.length() >= 2).distinct().limit(6).toList();
    }
}
