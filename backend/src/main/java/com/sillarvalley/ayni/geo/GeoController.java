package com.sillarvalley.ayni.geo;

import com.sillarvalley.ayni.catalog.Locations;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final PlacesClient places;
    private final Locations locations;

    public GeoController(PlacesClient places, Locations locations) {
        this.places = places;
        this.locations = locations;
    }

    @GetMapping("/spot")
    public GeoDtos.Spot spot(@RequestParam double lat, @RequestParam double lng) {
        var street = places.street(lat, lng);
        return new GeoDtos.Spot(lat, lng, locations.neighborhoodAt(lat, lng),
                street.map(PlacesClient.Street::name).orElse(null),
                street.map(PlacesClient.Street::area).orElse(null));
    }

    @GetMapping("/places")
    public List<GeoDtos.Place> places(@RequestParam String q,
                                      @RequestParam(required = false) Double lat,
                                      @RequestParam(required = false) Double lng) {
        double nearLat = lat == null || lng == null ? locations.city().latitude() : lat;
        double nearLng = lat == null || lng == null ? locations.city().longitude() : lng;
        return places.search(q, nearLat, nearLng).stream()
                .map(h -> new GeoDtos.Place(h.name(), h.detail(), h.latitude(), h.longitude(),
                        locations.neighborhoodAt(h.latitude(), h.longitude())))
                .toList();
    }
}
