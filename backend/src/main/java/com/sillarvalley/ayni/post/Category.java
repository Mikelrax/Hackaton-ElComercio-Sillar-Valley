package com.sillarvalley.ayni.post;

public enum Category {
    HERRAMIENTAS("Herramientas", "hammer"),
    HOGAR("Hogar", "house"),
    CUIDADO("Cuidado", "hand-heart"),
    ALIMENTOS("Alimentos", "utensils"),
    EDUCACION("Educación", "graduation-cap"),
    TRANSPORTE("Movilidad", "car"),
    SALUD("Salud", "heart-pulse"),
    OTROS("Otros", "circle-ellipsis");

    private final String label;
    private final String icon;

    Category(String label, String icon) {
        this.label = label;
        this.icon = icon;
    }

    public String label() {
        return label;
    }

    public String icon() {
        return icon;
    }
}
