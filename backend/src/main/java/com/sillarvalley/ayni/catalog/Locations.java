package com.sillarvalley.ayni.catalog;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.common.GeoPoint;
import com.sillarvalley.ayni.user.User;
import org.springframework.stereotype.Component;

@Component
public class Locations {

    private final NeighborhoodRepository neighborhoods;
    private final AppProperties.City city;

    public Locations(NeighborhoodRepository neighborhoods, AppProperties props) {
        this.neighborhoods = neighborhoods;
        this.city = props.city();
    }

    public GeoPoint city() {
        return new GeoPoint(city.latitude(), city.longitude(), city.name());
    }

    public GeoPoint resolve(String neighborhood, Double latitude, Double longitude, GeoPoint fallback) {
        boolean named = neighborhood != null && !neighborhood.isBlank();
        String name = named ? neighborhood.trim() : fallback.neighborhood();
        if (latitude != null && longitude != null) {
            return new GeoPoint(latitude, longitude, name);
        }
        if (!named) {
            return fallback;
        }
        return neighborhoods.findByNameIgnoreCase(name)
                .filter(n -> n.getLatitude() != null && n.getLongitude() != null)
                .map(n -> new GeoPoint(n.getLatitude(), n.getLongitude(), n.getName()))
                .orElseGet(() -> new GeoPoint(fallback.latitude(), fallback.longitude(), name));
    }

    public GeoPoint of(Address address) {
        return resolve(address.getNeighborhood(), address.getLatitude(), address.getLongitude(), city());
    }

    public GeoPoint of(User user) {
        return user.primaryAddress().map(this::of).orElseGet(this::city);
    }

    public Address locate(Address address) {
        GeoPoint point = of(address);
        address.setLatitude(point.latitude());
        address.setLongitude(point.longitude());
        return address;
    }
}
