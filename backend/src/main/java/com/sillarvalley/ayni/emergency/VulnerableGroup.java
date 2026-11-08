package com.sillarvalley.ayni.emergency;

public enum VulnerableGroup {
    ELDERLY("Adultos mayores"),
    CHILDREN("Niños"),
    DISABILITY("Personas con discapacidad"),
    PREGNANT("Gestantes");

    private final String label;

    VulnerableGroup(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
