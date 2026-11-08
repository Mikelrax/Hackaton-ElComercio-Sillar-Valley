package com.sillarvalley.ayni.emergency;

public enum Severity {
    HIGH("Urgente"),
    MEDIUM("Prioritario"),
    LOW("Puede esperar");

    private final String label;

    Severity(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
