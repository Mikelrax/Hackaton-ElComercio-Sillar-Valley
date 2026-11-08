package com.sillarvalley.ayni.map;

import java.util.Arrays;
import java.util.Optional;

public enum MapLayer {
    BUSINESSES("businesses", "Negocios y servicios", "store"),
    WALL("wall", "Muro solidario", "heart-handshake"),
    EMERGENCIES("emergencies", "Emergencias", "siren"),
    SUPPORT_POINTS("supportPoints", "Puntos de apoyo", "life-buoy");

    private final String key;
    private final String label;
    private final String icon;

    MapLayer(String key, String label, String icon) {
        this.key = key;
        this.label = label;
        this.icon = icon;
    }

    public String key() {
        return key;
    }

    public String label() {
        return label;
    }

    public String icon() {
        return icon;
    }

    public static Optional<MapLayer> of(String key) {
        return Arrays.stream(values()).filter(l -> l.key.equalsIgnoreCase(key)).findFirst();
    }
}
