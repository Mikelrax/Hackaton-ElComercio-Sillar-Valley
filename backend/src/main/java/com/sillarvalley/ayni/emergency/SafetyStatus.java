package com.sillarvalley.ayni.emergency;

public enum SafetyStatus {
    SAFE("Estoy bien"),
    NEED_HELP("Necesito ayuda");

    private final String label;

    SafetyStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
