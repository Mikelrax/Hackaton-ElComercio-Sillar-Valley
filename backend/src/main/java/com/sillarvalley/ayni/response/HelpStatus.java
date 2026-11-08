package com.sillarvalley.ayni.response;

public enum HelpStatus {
    PENDING("Esperando que te acepten"),
    ACCEPTED("¡Te aceptaron!"),
    DECLINED("Esta vez no fue posible"),
    WITHDRAWN("La retiraste");

    private final String label;

    HelpStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
