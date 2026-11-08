package com.sillarvalley.ayni.emergency;

public enum SupportResource {
    WATER("Agua"),
    FOOD("Alimentos"),
    SHELTER("Refugio"),
    MEDICINE("Medicinas"),
    FIRST_AID("Primeros auxilios"),
    CHARGING("Carga de celular"),
    CLOTHES("Abrigo");

    private final String label;

    SupportResource(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
