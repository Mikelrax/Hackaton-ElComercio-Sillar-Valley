package com.sillarvalley.ayni.address;

import com.sillarvalley.ayni.common.TextSearch;
import java.util.regex.Pattern;

public enum AddressPlace {
    HOME("Casa", "house", false),
    WORK("Trabajo", "briefcase", false),
    FAMILY("Casa de un familiar", "users", false),
    OTHER("Otro lugar", "map-pin", true);

    private static final Pattern FAMILY_WORDS = Pattern.compile("famili|mama|papa|abuel|tia\\b|tio\\b|hij|herman|suegr");
    private static final Pattern WORK_WORDS = Pattern.compile("trabajo|oficina|chamba|negocio|tienda");

    private final String label;
    private final String icon;
    private final boolean custom;

    AddressPlace(String label, String icon, boolean custom) {
        this.label = label;
        this.icon = icon;
        this.custom = custom;
    }

    public String label() { return label; }
    public String icon() { return icon; }
    public boolean custom() { return custom; }

    public static AddressPlace of(String label) {
        String text = TextSearch.normalize(label);
        if (FAMILY_WORDS.matcher(text).find()) return FAMILY;
        if (WORK_WORDS.matcher(text).find()) return WORK;
        if (text.contains("casa") || text.contains("hogar")) return HOME;
        return OTHER;
    }
}
