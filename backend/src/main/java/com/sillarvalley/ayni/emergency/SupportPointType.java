package com.sillarvalley.ayni.emergency;

public enum SupportPointType {
    SHELTER("Albergue"),
    HEALTH("Salud"),
    WATER("Agua potable"),
    SUPPLIES("Centro de acopio"),
    FIRST_AID("Botiquín comunitario");

    private final String label;

    SupportPointType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
