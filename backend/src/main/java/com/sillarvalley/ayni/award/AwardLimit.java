package com.sillarvalley.ayni.award;

public enum AwardLimit {
    DAILY_LIMIT("Llegaste al máximo de puntos por hoy. Tu ayuda quedó registrada, pero esta vez no suma puntos."),
    PAIR_LIMIT("Ya sumaste puntos ayudando a este vecino este mes. Tu ayuda quedó registrada, pero esta vez no suma puntos.");

    private final String message;

    AwardLimit(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}
