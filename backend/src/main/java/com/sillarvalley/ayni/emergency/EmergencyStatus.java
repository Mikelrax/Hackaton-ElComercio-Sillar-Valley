package com.sillarvalley.ayni.emergency;

public enum EmergencyStatus {
    URGENT("Sin atender"),
    ON_THE_WAY("En camino"),
    AVAILABLE("Disponible"),
    ATTENDED("Atendido");

    private final String label;

    EmergencyStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public String label(EmergencyKind kind) {
        return kind == EmergencyKind.OFFER && this == ATTENDED ? "Ya no hay" : label;
    }
}
