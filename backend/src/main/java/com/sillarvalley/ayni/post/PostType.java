package com.sillarvalley.ayni.post;

public enum PostType {
    REQUEST("Necesito"),
    OFFER("Ofrezco");

    private final String label;

    PostType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
