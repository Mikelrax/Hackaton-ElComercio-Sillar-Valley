package com.sillarvalley.ayni.catalog;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.geo.LocationPrivacy;
import com.sillarvalley.ayni.map.MapLayer;
import com.sillarvalley.ayni.map.MapPeriod;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.address.AddressPlace;
import com.sillarvalley.ayni.address.AddressService;
import com.sillarvalley.ayni.business.BusinessDtos;
import com.sillarvalley.ayni.business.BusinessService;
import com.sillarvalley.ayni.business.RecommendationTag;
import com.sillarvalley.ayni.common.GeoPoint;
import com.sillarvalley.ayni.emergency.EmergencyCategory;
import com.sillarvalley.ayni.emergency.EmergencyKind;
import com.sillarvalley.ayni.emergency.SupportPointType;
import com.sillarvalley.ayni.post.Category;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogController {

    public record Option(String value, String label) {}

    public record IconOption(String value, String label, String icon) {}

    public record PlaceOption(String value, String label, String icon, boolean custom) {}

    public record RadiusOption(Integer meters, String label) {}

    public record DirectoryOptions(List<RadiusOption> radii, Integer defaultRadius, List<Option> sorts) {}

    public record MapOptions(String styleUrl, List<RadiusOption> radii, int defaultRadius, List<IconOption> layers,
                             List<String> emergencyLayers, List<Option> postTypes, List<Option> emergencyStatuses,
                             List<Option> periods, int approximateRadius) {}

    public record Catalog(GeoPoint city, List<String> neighborhoods, List<IconOption> postCategories,
                          List<BusinessDtos.CategoryResponse> businessCategories,
                          List<Option> emergencyKinds, List<IconOption> emergencyCategories,
                          List<IconOption> supportPointTypes, List<Option> emergencyNumbers,
                          List<PlaceOption> addressPlaces, int maxAddresses, DirectoryOptions directory,
                          List<Option> recommendationTags, List<Option> openDays, MapOptions map) {}

    private static final List<Option> OPEN_DAYS = List.of(
            new Option("1234567", "Todos los días"),
            new Option("123456", "Lunes a sábado"),
            new Option("12345", "Lunes a viernes"),
            new Option("67", "Fines de semana"));

    private static final List<Option> EMERGENCY_NUMBERS = List.of(
            new Option("105", "Policía"),
            new Option("116", "Bomberos"),
            new Option("106", "SAMU"));

    private static final DirectoryOptions DIRECTORY = new DirectoryOptions(
            List.of(new RadiusOption(500, "500 m"), new RadiusOption(1000, "1 km"), new RadiusOption(2000, "2 km"),
                    new RadiusOption(null, "Toda la ciudad")),
            2000,
            List.of(new Option("recommended", "Más recomendados"), new Option("distance", "Más cerca")));

    private static final List<RadiusOption> MAP_RADII = List.of(new RadiusOption(500, "500 m"),
            new RadiusOption(1000, "1 km"), new RadiusOption(2000, "2 km"), new RadiusOption(5000, "5 km"));

    private final NeighborhoodRepository neighborhoods;
    private final BusinessService businesses;
    private final Locations locations;
    private final String mapStyleUrl;

    public CatalogController(NeighborhoodRepository neighborhoods, BusinessService businesses, Locations locations,
                             AppProperties props) {
        this.neighborhoods = neighborhoods;
        this.businesses = businesses;
        this.locations = locations;
        this.mapStyleUrl = props.geo().styleUrl();
    }

    @GetMapping("/api/catalog")
    public Catalog catalog() {
        return new Catalog(
                locations.city(),
                neighborhoods.findAllByOrderBySortOrderAsc().stream().map(Neighborhood::getName).toList(),
                Arrays.stream(Category.values()).map(c -> new IconOption(c.name(), c.label(), c.icon())).toList(),
                businesses.categories(),
                Arrays.stream(EmergencyKind.values()).map(k -> new Option(k.name(), k.label())).toList(),
                Arrays.stream(EmergencyCategory.values())
                        .map(c -> new IconOption(c.name(), c.label(), c.icon())).toList(),
                Arrays.stream(SupportPointType.values())
                        .map(t -> new IconOption(t.name(), t.label(), t.icon())).toList(),
                EMERGENCY_NUMBERS,
                Arrays.stream(AddressPlace.values())
                        .map(p -> new PlaceOption(p.name(), p.label(), p.icon(), p.custom())).toList(),
                AddressService.MAX_ADDRESSES,
                DIRECTORY,
                Arrays.stream(RecommendationTag.values()).map(t -> new Option(t.key(), t.label())).toList(),
                OPEN_DAYS,
                mapOptions());
    }

    private MapOptions mapOptions() {
        return new MapOptions(
                mapStyleUrl,
                MAP_RADII,
                2000,
                Arrays.stream(MapLayer.values()).map(l -> new IconOption(l.key(), l.label(), l.icon())).toList(),
                List.of(MapLayer.EMERGENCIES.key(), MapLayer.SUPPORT_POINTS.key()),
                Arrays.stream(PostType.values()).map(t -> new Option(t.name(), t.label())).toList(),
                Arrays.stream(EmergencyStatus.values()).filter(s -> s != EmergencyStatus.ATTENDED)
                        .map(s -> new Option(s.name(), s.label())).toList(),
                Arrays.stream(MapPeriod.values()).map(p -> new Option(p.key(), p.label())).toList(),
                LocationPrivacy.RADIUS_METERS);
    }
}
