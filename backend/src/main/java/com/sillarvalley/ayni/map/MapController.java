package com.sillarvalley.ayni.map;

import com.sillarvalley.ayni.emergency.EmergencyCategory;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.emergency.SupportPointType;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.user.CurrentUser;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MapController {

    private final MapService service;

    public MapController(MapService service) {
        this.service = service;
    }

    @GetMapping("/api/map")
    public MapDtos.MapResponse map(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam double lat,
                                   @RequestParam double lng,
                                   @RequestParam(defaultValue = "2000") int radius,
                                   @RequestParam(required = false) List<String> layers,
                                   @RequestParam(required = false) String q,
                                   @RequestParam(required = false) String businessCategory,
                                   @RequestParam(defaultValue = "false") boolean openNow,
                                   @RequestParam(defaultValue = "false") boolean recommended,
                                   @RequestParam(required = false) PostType postType,
                                   @RequestParam(required = false) Category postCategory,
                                   @RequestParam(required = false) EmergencyCategory emergencyCategory,
                                   @RequestParam(required = false) EmergencyStatus emergencyStatus,
                                   @RequestParam(required = false) SupportPointType supportType,
                                   @RequestParam(defaultValue = "false") boolean openPoints,
                                   @RequestParam(defaultValue = "all") String period) {
        MapService.Query query = new MapService.Query(lat, lng,
                Math.min(Math.max(radius, MapService.MIN_RADIUS), MapService.MAX_RADIUS), layers(layers), q,
                businessCategory, openNow, recommended, postType, postCategory, emergencyCategory, emergencyStatus,
                supportType, openPoints, MapPeriod.of(period));
        return service.map(CurrentUser.idOf(jwt), query);
    }

    @GetMapping("/api/map/search")
    public MapDtos.SearchResponse search(@AuthenticationPrincipal Jwt jwt,
                                         @RequestParam String q,
                                         @RequestParam double lat,
                                         @RequestParam double lng) {
        return service.search(CurrentUser.idOf(jwt), q, lat, lng);
    }

    private static Set<MapLayer> layers(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return EnumSet.allOf(MapLayer.class);
        }
        Set<MapLayer> found = keys.stream().map(MapLayer::of).flatMap(Optional::stream)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(MapLayer.class)));
        return found.isEmpty() ? EnumSet.allOf(MapLayer.class) : found;
    }
}
