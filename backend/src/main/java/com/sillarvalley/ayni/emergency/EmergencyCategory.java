package com.sillarvalley.ayni.emergency;

public enum EmergencyCategory {
    RESCUE("Rescate", Severity.HIGH),
    FIRST_AID("Primeros auxilios", Severity.HIGH),
    WATER("Agua potable", Severity.MEDIUM),
    SHELTER("Refugio", Severity.MEDIUM),
    MEDICINE("Medicinas", Severity.MEDIUM),
    FOOD("Alimentos", Severity.LOW),
    OTHER("Otro", Severity.LOW);

    private final String label;
    private final Severity severity;

    EmergencyCategory(String label, Severity severity) {
        this.label = label;
        this.severity = severity;
    }

    public String label() {
        return label;
    }

    public Severity severity() {
        return severity;
    }
}
