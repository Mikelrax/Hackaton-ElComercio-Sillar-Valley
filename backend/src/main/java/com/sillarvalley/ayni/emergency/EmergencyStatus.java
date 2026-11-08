package com.sillarvalley.ayni.emergency;

public enum EmergencyStatus {
    URGENT("Sin atender"),
    ON_THE_WAY("En camino"),
    ATTENDED("Atendido");

    private final String label;

    EmergencyStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
