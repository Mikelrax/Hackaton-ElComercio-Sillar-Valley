package com.sillarvalley.ayni.geo;

public final class GeoDtos {

    private GeoDtos() {}

    public record Place(String name, String detail, double latitude, double longitude, String neighborhood) {}

    public record Spot(double latitude, double longitude, String neighborhood, String street, String area) {}
}
