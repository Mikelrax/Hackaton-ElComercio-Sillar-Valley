package com.sillarvalley.ayni.review;

public enum AutoReview {
    QUEUED("Revisándose automáticamente"),
    APPROVED("Aprobada automáticamente"),
    ESCALATED("Necesita tu revisión"),
    FLAGGED("Posible engaño o contenido dañino"),
    FAILED("No se pudo revisar automáticamente");

    private final String label;

    AutoReview(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
