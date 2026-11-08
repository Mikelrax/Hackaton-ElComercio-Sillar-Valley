package com.sillarvalley.ayni.emergency;

public enum SupportPointType {
    SHELTER("Albergue", "tent"),
    HEALTH("Salud", "hospital"),
    WATER("Agua potable", "droplets"),
    SUPPLIES("Centro de acopio", "package"),
    FIRST_AID("Botiquín comunitario", "briefcase-medical");

    private final String label;
    private final String icon;

    SupportPointType(String label, String icon) {
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
