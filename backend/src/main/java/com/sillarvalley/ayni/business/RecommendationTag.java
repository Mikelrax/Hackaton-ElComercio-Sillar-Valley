package com.sillarvalley.ayni.business;

public enum RecommendationTag {
    GOOD_PRICE("goodPrice", "Buen precio"),
    PUNCTUAL("punctual", "Puntual"),
    RELIABLE("reliable", "Confiable");

    private final String key;
    private final String label;

    RecommendationTag(String key, String label) {
        this.key = key;
        this.label = label;
    }

    public String key() { return key; }
    public String label() { return label; }
}
