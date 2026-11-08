package com.sillarvalley.ayni.common;

import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

public final class RichText {

    private static final Pattern RICH = Pattern.compile("^\\s*<(p|ul|ol)[\\s>]", Pattern.CASE_INSENSITIVE);
    private static final Pattern BREAKS = Pattern.compile("(?i)<br\\s*/?>|</p>|</li>");
    private static final Pattern BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Safelist SAFELIST = Safelist.none().addTags("p", "br", "strong", "em", "u", "s", "ul", "ol", "li");
    private static final Document.OutputSettings OUTPUT = new Document.OutputSettings().prettyPrint(false);

    private RichText() {}

    public static boolean isRich(String value) {
        return value != null && RICH.matcher(value).find();
    }

    public static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (!isRich(trimmed)) {
            return trimmed;
        }
        String html = Jsoup.clean(trimmed, "", SAFELIST, OUTPUT).trim();
        return plain(html).isEmpty() ? "" : html;
    }

    public static String plain(String value) {
        if (value == null) {
            return "";
        }
        if (!isRich(value)) {
            return value.trim();
        }
        String withBreaks = BREAKS.matcher(value).replaceAll("$0\n");
        String text = Jsoup.parse(withBreaks).wholeText().replace(' ', ' ');
        return BLANK_LINES.matcher(text.replaceAll("[ \\t]+\\n", "\n")).replaceAll("\n\n").trim();
    }
}
