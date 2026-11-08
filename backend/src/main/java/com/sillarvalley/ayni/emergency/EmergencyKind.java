package com.sillarvalley.ayni.emergency;

public enum EmergencyKind {
    NEED("Necesito ayuda"),
    OFFER("Ofrezco recursos");

    private final String label;

    EmergencyKind(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
