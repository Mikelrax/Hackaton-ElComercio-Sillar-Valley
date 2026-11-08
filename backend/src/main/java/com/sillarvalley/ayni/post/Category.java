package com.sillarvalley.ayni.post;

public enum Category {
    HERRAMIENTAS("Herramientas"),
    HOGAR("Hogar"),
    CUIDADO("Cuidado"),
    ALIMENTOS("Alimentos"),
    EDUCACION("Educación"),
    TRANSPORTE("Movilidad"),
    SALUD("Salud"),
    OTROS("Otros");

    private final String label;

    Category(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
