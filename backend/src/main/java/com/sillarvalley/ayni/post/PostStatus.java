package com.sillarvalley.ayni.post;

public enum PostStatus {
    PENDING("En revisión"),
    APPROVED("Publicada"),
    REJECTED("No aprobada"),
    TO_CONFIRM("Por confirmar"),
    FULFILLED("Cumplida"),
    CANCELLED("Cancelada");

    private final String label;

    PostStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
