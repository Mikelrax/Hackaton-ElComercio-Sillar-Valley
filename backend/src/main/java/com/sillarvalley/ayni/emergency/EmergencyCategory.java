package com.sillarvalley.ayni.emergency;

public enum EmergencyCategory {
    RESCUE("Rescate", Severity.HIGH, "life-buoy"),
    FIRST_AID("Primeros auxilios", Severity.HIGH, "briefcase-medical"),
    WATER("Agua potable", Severity.MEDIUM, "droplets"),
    SHELTER("Refugio", Severity.MEDIUM, "tent"),
    MEDICINE("Medicinas", Severity.MEDIUM, "pill"),
    FOOD("Alimentos", Severity.LOW, "utensils"),
    OTHER("Otro", Severity.LOW, "circle-alert");

    private final String label;
    private final Severity severity;
    private final String icon;

    EmergencyCategory(String label, Severity severity, String icon) {
        this.label = label;
        this.severity = severity;
        this.icon = icon;
    }

    public String label() {
        return label;
    }

    public Severity severity() {
        return severity;
    }

    public String icon() {
        return icon;
    }
}
