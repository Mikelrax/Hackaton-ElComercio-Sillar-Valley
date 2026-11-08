package com.sillarvalley.ayni.review;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

final class ReviewRules {

    static final int NOTE_MAX = 300;

    private static final Pattern LINK = Pattern.compile(
            "(?i)(https?://|www\\.|\\b[a-z0-9-]+\\.(com|net|org|pe|ly|link|info|xyz)\\b)");
    private static final Pattern PHONE = Pattern.compile("(?<!\\d)\\d(?:[\\s.-]?\\d){6,}(?!\\d)");

    private ReviewRules() {}

    static ReviewResult apply(ReviewContent content, ReviewResult ai) {
        List<String> reasons = new ArrayList<>();
        if (LINK.matcher(content.freeText()).find()) {
            reasons.add("Tiene un enlace.");
        }
        if (content.type() == ReviewSubject.POST && PHONE.matcher(content.freeText()).find()) {
            reasons.add("Incluye un número de teléfono en el texto.");
        }
        if (content.images() > 0) {
            reasons.add("Tiene fotos y la revisión automática solo lee el texto.");
        }
        if (reasons.isEmpty()) {
            return new ReviewResult(ai.decision(), note(ai.reason()));
        }
        String note = String.join(" ", reasons) + (ai.reason().isBlank() ? "" : " " + ai.reason());
        return new ReviewResult(ai.decision().atLeast(ReviewDecision.REVISAR), note(note));
    }

    static String note(String text) {
        String clean = text == null ? "" : text.strip().replaceAll("\\s+", " ");
        return clean.length() <= NOTE_MAX ? clean : clean.substring(0, NOTE_MAX - 1).stripTrailing() + "…";
    }
}
