package com.sillarvalley.ayni.map;

import com.sillarvalley.ayni.geo.GeoDtos;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class MapDtos {

    private MapDtos() {}

    public record MapItem(String key, String layer, long id, String type, String title, String subtitle,
                          String icon, String badge, boolean alert, boolean mine, boolean approximate,
                          double latitude, double longitude, Integer distanceMeters, Instant createdAt) {}

    public record MapResponse(List<MapItem> items, Map<String, Integer> counts) {}

    public record SearchResponse(List<MapItem> items, List<GeoDtos.Place> places) {}
}
