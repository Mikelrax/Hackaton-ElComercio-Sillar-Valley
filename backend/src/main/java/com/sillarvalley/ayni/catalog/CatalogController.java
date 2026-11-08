package com.sillarvalley.ayni.catalog;

import com.sillarvalley.ayni.business.BusinessDtos;
import com.sillarvalley.ayni.business.BusinessService;
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

    public record Catalog(List<String> neighborhoods, List<Option> postCategories,
                          List<BusinessDtos.CategoryResponse> businessCategories,
                          List<Option> emergencyKinds, List<Option> emergencyCategories,
                          List<Option> supportPointTypes) {}

    private final NeighborhoodRepository neighborhoods;
    private final BusinessService businesses;

    public CatalogController(NeighborhoodRepository neighborhoods, BusinessService businesses) {
        this.neighborhoods = neighborhoods;
        this.businesses = businesses;
    }

    @GetMapping("/api/catalog")
    public Catalog catalog() {
        return new Catalog(
                neighborhoods.findAllByOrderBySortOrderAsc().stream().map(Neighborhood::getName).toList(),
                Arrays.stream(Category.values()).map(c -> new Option(c.name(), c.label())).toList(),
                businesses.categories(),
                Arrays.stream(EmergencyKind.values()).map(k -> new Option(k.name(), k.label())).toList(),
                Arrays.stream(EmergencyCategory.values()).map(c -> new Option(c.name(), c.label())).toList(),
                Arrays.stream(SupportPointType.values()).map(t -> new Option(t.name(), t.label())).toList());
    }
}
