package com.sillarvalley.ayni.map;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.business.BusinessSearch;
import com.sillarvalley.ayni.business.OpeningHours;
import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.TextSearch;
import com.sillarvalley.ayni.emergency.EmergencyCategory;
import com.sillarvalley.ayni.emergency.EmergencyKind;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.emergency.SupportPointType;
import com.sillarvalley.ayni.geo.Distances;
import com.sillarvalley.ayni.geo.GeoDtos;
import com.sillarvalley.ayni.geo.LocationPrivacy;
import com.sillarvalley.ayni.geo.PlacesClient;
import com.sillarvalley.ayni.post.Category;
import com.sillarvalley.ayni.post.PostType;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MapService {

    public static final int MIN_RADIUS = 100;
    public static final int MAX_RADIUS = 15_000;
    private static final int LIMIT = 150;
    private static final int SEARCH_LIMIT = 8;
    private static final String PLAIN = "translate(lower(%s), 'áéíóúüàèìòù', 'aeiouuaeiou')";

    public record Query(double latitude, double longitude, int radius, Set<MapLayer> layers, String text,
                        String businessCategory, boolean openNow, boolean recommended,
                        PostType postType, Category postCategory,
                        EmergencyCategory emergencyCategory, EmergencyStatus emergencyStatus,
                        SupportPointType supportType, boolean openPoints, MapPeriod period) {

        static Query search(double latitude, double longitude, String text) {
            return new Query(latitude, longitude, MAX_RADIUS, EnumSet.allOf(MapLayer.class), text, null, false,
                    false, null, null, null, null, null, false, MapPeriod.ALL);
        }
    }

    private record Viewer(long id, boolean moderator) {}

    private record Filter(StringBuilder where, Map<String, Object> params) {

        Filter and(String sql) {
            where.append(" AND ").append(sql);
            return this;
        }

        Filter and(String sql, String name, Object value) {
            params.put(name, value);
            return and(sql);
        }
    }

    private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    private final LocationPrivacy privacy;
    private final PlacesClient places;
    private final Locations locations;
    private final ZoneId zone;

    public MapService(JdbcClient jdbc, CurrentUser currentUser, LocationPrivacy privacy, PlacesClient places,
                      Locations locations, AppProperties props) {
        this.jdbc = jdbc;
        this.currentUser = currentUser;
        this.privacy = privacy;
        this.places = places;
        this.locations = locations;
        this.zone = ZoneId.of(props.timezone());
    }

    @Transactional(readOnly = true)
    public MapDtos.MapResponse map(Long uid, Query query) {
        Viewer viewer = viewer(uid);
        Map<String, Integer> counts = new LinkedHashMap<>();
        List<MapDtos.MapItem> items = new ArrayList<>();
        for (MapLayer layer : MapLayer.values()) {
            if (!query.layers().contains(layer)) {
                continue;
            }
            List<MapDtos.MapItem> found = items(layer, query, viewer, LIMIT);
            counts.put(layer.key(), found.size());
            items.addAll(found);
        }
        items.sort(byDistance());
        return new MapDtos.MapResponse(items, counts);
    }

    @Transactional(readOnly = true)
    public MapDtos.SearchResponse search(Long uid, String text, double latitude, double longitude) {
        Viewer viewer = viewer(uid);
        if (TextSearch.tokens(text).isEmpty()) {
            return new MapDtos.SearchResponse(List.of(), List.of());
        }
        Query query = Query.search(latitude, longitude, text);
        List<MapDtos.MapItem> items = new ArrayList<>();
        for (MapLayer layer : MapLayer.values()) {
            items.addAll(items(layer, query, viewer, SEARCH_LIMIT));
        }
        items.sort(byDistance());
        List<GeoDtos.Place> found = places.search(text, latitude, longitude).stream()
                .map(h -> new GeoDtos.Place(h.name(), h.detail(), h.latitude(), h.longitude(),
                        locations.neighborhoodAt(h.latitude(), h.longitude())))
                .toList();
        return new MapDtos.SearchResponse(items.stream().limit(SEARCH_LIMIT).toList(), found);
    }

    private List<MapDtos.MapItem> items(MapLayer layer, Query q, Viewer viewer, int limit) {
        return switch (layer) {
            case BUSINESSES -> businesses(q, limit);
            case WALL -> wall(q, viewer, limit);
            case EMERGENCIES -> emergencies(q, viewer, limit);
            case SUPPORT_POINTS -> supportPoints(q, limit);
        };
    }

    private List<MapDtos.MapItem> businesses(Query q, int limit) {
        Filter f = filter("b", q, limit).and("b.status = 'APPROVED'");
        if (q.businessCategory() != null && !q.businessCategory().isBlank()) {
            f.and("c.slug = :businessCategory", "businessCategory", q.businessCategory());
        }
        if (q.recommended()) {
            f.and("b.recommendations_count > 0");
        }
        LocalDateTime now = LocalDateTime.now(zone);
        if (q.openNow()) {
            f.where().append(BusinessSearch.OPEN_NOW_SQL);
            f.params().put("now", now.toLocalTime());
            f.params().put("dow", String.valueOf(now.getDayOfWeek().getValue()));
        }
        tokens(f, "b.search_text", q.text());
        return jdbc.sql("SELECT b.id, b.name, c.name AS category_name, c.icon, b.latitude, b.longitude,"
                        + " b.opens_at, b.closes_at, b.open_days, b.recommendations_count, b.created_at, "
                        + meters("b") + " FROM businesses b JOIN categories c ON c.id = b.category_id"
                        + " WHERE " + f.where() + " ORDER BY meters LIMIT :limit")
                .params(f.params())
                .query((rs, i) -> {
                    int count = rs.getInt("recommendations_count");
                    String schedule = OpeningHours.describe(rs.getObject("opens_at", LocalTime.class),
                            rs.getObject("closes_at", LocalTime.class), rs.getString("open_days"), now);
                    return new MapDtos.MapItem("b-" + rs.getLong("id"), MapLayer.BUSINESSES.key(), rs.getLong("id"),
                            null, rs.getString("name"), join(rs.getString("category_name"), schedule),
                            rs.getString("icon"), count == 0 ? null : count == 1 ? "1 recomendación"
                            : count + " recomendaciones", false, false, false, rs.getDouble("latitude"),
                            rs.getDouble("longitude"), rs.getInt("meters"), instant(rs, "created_at"));
                })
                .list();
    }

    private List<MapDtos.MapItem> wall(Query q, Viewer viewer, int limit) {
        Filter f = filter("p", q, limit).and("p.status = 'APPROVED'");
        if (q.postType() != null) {
            f.and("p.type = :postType", "postType", q.postType().name());
        }
        if (q.postCategory() != null) {
            f.and("p.category = :postCategory", "postCategory", q.postCategory().name());
        }
        since(f, "p", q);
        tokens(f, PLAIN.formatted("p.title || ' ' || p.description"), q.text());
        f.params().put("uid", viewer.id());
        return jdbc.sql("SELECT p.id, p.type, p.category, p.title, p.latitude, p.longitude, p.created_at,"
                        + " p.author_id, u.full_name, " + meters("p") + ","
                        + " EXISTS (SELECT 1 FROM help_responses h WHERE h.post_id = p.id AND h.helper_id = :uid"
                        + " AND h.status = 'ACCEPTED') AS accepted"
                        + " FROM posts p JOIN users u ON u.id = p.author_id"
                        + " WHERE " + f.where() + " ORDER BY meters LIMIT :limit")
                .params(f.params())
                .query((rs, i) -> {
                    long id = rs.getLong("id");
                    PostType type = PostType.valueOf(rs.getString("type"));
                    Category category = Category.valueOf(rs.getString("category"));
                    boolean mine = rs.getLong("author_id") == viewer.id();
                    boolean exact = mine || viewer.moderator() || rs.getBoolean("accepted");
                    return located("post", id, rs, exact, (lat, lng, meters) -> new MapDtos.MapItem("p-" + id,
                            MapLayer.WALL.key(), id, type.name(), rs.getString("title"),
                            join(category.label(), firstName(rs.getString("full_name"))), category.icon(),
                            type.label(), false, mine, !exact, lat, lng, meters, instant(rs, "created_at")));
                })
                .list();
    }

    private List<MapDtos.MapItem> emergencies(Query q, Viewer viewer, int limit) {
        Filter f = filter("r", q, limit).and("r.status <> 'ATTENDED'");
        if (q.emergencyCategory() != null) {
            f.and("r.category = :emergencyCategory", "emergencyCategory", q.emergencyCategory().name());
        }
        if (q.emergencyStatus() != null) {
            f.and("r.status = :emergencyStatus", "emergencyStatus", q.emergencyStatus().name());
        }
        since(f, "r", q);
        tokens(f, PLAIN.formatted("r.title"), q.text());
        return jdbc.sql("SELECT r.id, r.kind, r.category, r.title, r.status, r.people_count, r.latitude,"
                        + " r.longitude, r.created_at, r.reporter_id, r.helper_id, " + meters("r")
                        + " FROM emergency_reports r WHERE " + f.where() + " ORDER BY meters LIMIT :limit")
                .params(f.params())
                .query((rs, i) -> {
                    long id = rs.getLong("id");
                    EmergencyKind kind = EmergencyKind.valueOf(rs.getString("kind"));
                    EmergencyCategory category = EmergencyCategory.valueOf(rs.getString("category"));
                    EmergencyStatus status = EmergencyStatus.valueOf(rs.getString("status"));
                    int people = rs.getInt("people_count");
                    boolean mine = rs.getLong("reporter_id") == viewer.id();
                    boolean exact = mine || viewer.moderator() || rs.getLong("helper_id") == viewer.id();
                    return located("report", id, rs, exact, (lat, lng, meters) -> new MapDtos.MapItem("r-" + id,
                            MapLayer.EMERGENCIES.key(), id, kind.name(), rs.getString("title"),
                            join(kind.label(), category.label(), people > 1 ? people + " personas" : null),
                            category.icon(), status.label(),
                            status == EmergencyStatus.URGENT && kind == EmergencyKind.NEED, mine, !exact,
                            lat, lng, meters, instant(rs, "created_at")));
                })
                .list();
    }

    private List<MapDtos.MapItem> supportPoints(Query q, int limit) {
        Filter f = filter("s", q, limit);
        if (q.supportType() != null) {
            f.and("s.type = :supportType", "supportType", q.supportType().name());
        }
        if (q.openPoints()) {
            f.and("s.is_open");
        }
        tokens(f, PLAIN.formatted("s.name || ' ' || coalesce(s.address, '')"), q.text());
        return jdbc.sql("SELECT s.id, s.name, s.type, s.address, s.is_open, s.latitude, s.longitude, s.created_at, "
                        + meters("s") + " FROM support_points s WHERE " + f.where() + " ORDER BY meters LIMIT :limit")
                .params(f.params())
                .query((rs, i) -> {
                    SupportPointType type = SupportPointType.valueOf(rs.getString("type"));
                    boolean open = rs.getBoolean("is_open");
                    return new MapDtos.MapItem("s-" + rs.getLong("id"), MapLayer.SUPPORT_POINTS.key(),
                            rs.getLong("id"), type.name(), rs.getString("name"),
                            join(type.label(), rs.getString("address")), type.icon(), open ? "Abierto" : "Cerrado",
                            false, false, false, rs.getDouble("latitude"), rs.getDouble("longitude"),
                            rs.getInt("meters"), instant(rs, "created_at"));
                })
                .list();
    }

    @FunctionalInterface
    private interface Located {
        MapDtos.MapItem build(double latitude, double longitude, Integer meters) throws SQLException;
    }

    private MapDtos.MapItem located(String kind, long id, ResultSet rs, boolean exact, Located build)
            throws SQLException {
        double lat = rs.getDouble("latitude");
        double lng = rs.getDouble("longitude");
        int meters = rs.getInt("meters");
        if (exact) {
            return build.build(lat, lng, meters);
        }
        LocationPrivacy.Point blurred = privacy.blur(kind, id, lat, lng);
        return build.build(blurred.latitude(), blurred.longitude(), LocationPrivacy.rough(meters));
    }

    private static Filter filter(String alias, Query q, int limit) {
        Map<String, Object> params = new HashMap<>();
        params.put("lat", q.latitude());
        params.put("lng", q.longitude());
        params.put("radius", q.radius());
        params.put("limit", limit);
        return new Filter(new StringBuilder("ST_DWithin(" + alias + ".geog, " + Distances.POINT + ", :radius)"),
                params);
    }

    private static String meters(String alias) {
        return "round(ST_Distance(" + alias + ".geog, " + Distances.POINT + "))::int AS meters";
    }

    private void since(Filter f, String alias, Query q) {
        q.period().since(zone).ifPresent(at -> f.and(alias + ".created_at >= :since", "since", at));
    }

    private static void tokens(Filter f, String column, String text) {
        List<String> tokens = TextSearch.tokens(text);
        for (int i = 0; i < tokens.size(); i++) {
            f.and(column + " LIKE :t" + i, "t" + i, "%" + tokens.get(i) + "%");
        }
    }

    private Viewer viewer(Long uid) {
        User user = currentUser.require(uid);
        return new Viewer(user.getId(), user.getRole() == Role.MODERATOR);
    }

    private static Comparator<MapDtos.MapItem> byDistance() {
        return Comparator.comparing(MapDtos.MapItem::distanceMeters, Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime at = rs.getObject(column, OffsetDateTime.class);
        return at == null ? null : at.toInstant();
    }

    private static String join(String... parts) {
        return String.join(" · ", Arrays.stream(parts).filter(p -> p != null && !p.isBlank()).toList());
    }

    private static String firstName(String fullName) {
        return fullName == null ? "" : fullName.trim().split("\\s+")[0];
    }
}
