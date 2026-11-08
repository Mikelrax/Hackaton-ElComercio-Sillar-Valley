package com.sillarvalley.ayni.catalog;

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

    public record PlaceOption(String value, String label, String icon, boolean custom) {}

    public record RadiusOption(Integer meters, String label) {}

    public record DirectoryOptions(List<RadiusOption> radii, Integer defaultRadius, List<Option> sorts) {}

    public record Catalog(GeoPoint city, List<String> neighborhoods, List<Option> postCategories,
                          List<BusinessDtos.CategoryResponse> businessCategories,
                          List<Option> emergencyKinds, List<Option> emergencyCategories,
                          List<Option> supportPointTypes, List<Option> emergencyNumbers,
                          List<PlaceOption> addressPlaces, int maxAddresses, DirectoryOptions directory,
                          List<Option> recommendationTags) {}

    private static final List<Option> EMERGENCY_NUMBERS = List.of(
            new Option("105", "Policía"),
            new Option("116", "Bomberos"),
            new Option("106", "SAMU"));

    private static final DirectoryOptions DIRECTORY = new DirectoryOptions(
            List.of(new RadiusOption(500, "500 m"), new RadiusOption(1000, "1 km"), new RadiusOption(2000, "2 km"),
                    new RadiusOption(null, "Toda la ciudad")),
            2000,
            List.of(new Option("recommended", "Más recomendados"), new Option("distance", "Más cerca")));

    private final NeighborhoodRepository neighborhoods;
    private final BusinessService businesses;
    private final Locations locations;

    public CatalogController(NeighborhoodRepository neighborhoods, BusinessService businesses, Locations locations) {
        this.neighborhoods = neighborhoods;
        this.businesses = businesses;
        this.locations = locations;
    }

    @GetMapping("/api/catalog")
    public Catalog catalog() {
        return new Catalog(
                locations.city(),
                neighborhoods.findAllByOrderBySortOrderAsc().stream().map(Neighborhood::getName).toList(),
                Arrays.stream(Category.values()).map(c -> new Option(c.name(), c.label())).toList(),
                businesses.categories(),
                Arrays.stream(EmergencyKind.values()).map(k -> new Option(k.name(), k.label())).toList(),
                Arrays.stream(EmergencyCategory.values()).map(c -> new Option(c.name(), c.label())).toList(),
                Arrays.stream(SupportPointType.values()).map(t -> new Option(t.name(), t.label())).toList(),
                EMERGENCY_NUMBERS,
                Arrays.stream(AddressPlace.values())
                        .map(p -> new PlaceOption(p.name(), p.label(), p.icon(), p.custom())).toList(),
                AddressService.MAX_ADDRESSES,
                DIRECTORY,
                Arrays.stream(RecommendationTag.values()).map(t -> new Option(t.key(), t.label())).toList());
    }
}
