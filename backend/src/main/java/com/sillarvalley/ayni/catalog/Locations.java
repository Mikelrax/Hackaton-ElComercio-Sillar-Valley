package com.sillarvalley.ayni.catalog;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.common.ApiException;
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

    public String neighborhoodAt(double latitude, double longitude) {
        return neighborhoods.findNearest(latitude, longitude).map(Neighborhood::getName).orElse(city.name());
    }

    public GeoPoint at(double latitude, double longitude) {
        return new GeoPoint(latitude, longitude, neighborhoodAt(latitude, longitude));
    }

    public GeoPoint of(Address address) {
        return new GeoPoint(address.getLatitude(), address.getLongitude(), address.getNeighborhood());
    }

    public GeoPoint of(User user) {
        return user.primaryAddress().map(this::of).orElseGet(this::city);
    }

    public GeoPoint pick(User user, Long addressId, Double latitude, Double longitude) {
        if (addressId != null) {
            return user.getAddresses().stream()
                    .filter(a -> addressId.equals(a.getId()))
                    .findFirst()
                    .map(this::of)
                    .orElseThrow(() -> ApiException.badRequest("Esa dirección no está entre las tuyas"));
        }
        if (latitude != null && longitude != null) {
            return at(latitude, longitude);
        }
        return of(user);
    }

    public GeoPoint resolve(String neighborhood, Double latitude, Double longitude, GeoPoint fallback) {
        boolean named = neighborhood != null && !neighborhood.isBlank();
        if (latitude != null && longitude != null) {
            return named ? new GeoPoint(latitude, longitude, neighborhood.trim()) : at(latitude, longitude);
        }
        if (!named) {
            return fallback;
        }
        String name = neighborhood.trim();
        return neighborhoods.findByNameIgnoreCase(name)
                .map(n -> new GeoPoint(n.getLatitude(), n.getLongitude(), n.getName()))
                .orElseGet(() -> new GeoPoint(fallback.latitude(), fallback.longitude(), name));
    }

    public Address place(Address address) {
        address.setNeighborhood(neighborhoodAt(address.getLatitude(), address.getLongitude()));
        return address;
    }
}
