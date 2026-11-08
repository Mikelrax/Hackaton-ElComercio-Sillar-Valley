package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.common.TextSearch;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class BusinessSearch {

    public static final String DISTANCE_SQL = "(6371000 * 2 * asin(sqrt("
            + "power(sin(radians(b.latitude - :lat) / 2), 2) + "
            + "cos(radians(:lat)) * cos(radians(b.latitude)) * "
            + "power(sin(radians(b.longitude - :lng) / 2), 2))))";

    private static final String OPEN_NOW_SQL = " AND b.opens_at IS NOT NULL AND b.closes_at IS NOT NULL"
            + " AND (b.open_days IS NULL OR strpos(b.open_days, :dow) > 0)"
            + " AND ((b.opens_at <= b.closes_at AND :now >= b.opens_at AND :now < b.closes_at)"
            + " OR (b.opens_at > b.closes_at AND (:now >= b.opens_at OR :now < b.closes_at)))";

    public record Criteria(String query, String category, Double latitude, Double longitude, Integer radius,
                           boolean openNow, boolean sortByDistance, int page, int size,
                           LocalTime now, int dayOfWeek) {
        boolean hasLocation() {
            return latitude != null && longitude != null;
        }
    }

    public record Row(long id, String name, String categorySlug, String categoryName, String categoryIcon,
                      String neighborhood, double latitude, double longitude,
                      LocalTime opensAt, LocalTime closesAt, String openDays,
                      int recommendations, int goodPrice, int punctual, int reliable, Double distance) {}

    public record Facet(String slug, String name, String icon, long count) {}

    public record Result(List<Row> rows, long total, List<Facet> facets) {}

    private final JdbcClient jdbc;

    public BusinessSearch(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Result search(Criteria c) {
        Map<String, Object> params = new HashMap<>();
        String filters = filters(c, params);

        List<Facet> facets = jdbc.sql("SELECT c.slug, c.name, c.icon, COUNT(b.id) AS n FROM categories c"
                        + " LEFT JOIN businesses b ON b.category_id = c.id AND " + filters
                        + " GROUP BY c.id, c.slug, c.name, c.icon, c.sort_order ORDER BY c.sort_order")
                .params(params)
                .query((rs, i) -> new Facet(rs.getString("slug"), rs.getString("name"), rs.getString("icon"),
                        rs.getLong("n")))
                .list();

        String where = " WHERE " + filters;
        if (c.category() != null && !c.category().isBlank()) {
            where += " AND c.slug = :category";
            params.put("category", c.category());
        }
        String from = " FROM businesses b JOIN categories c ON c.id = b.category_id";

        long total = jdbc.sql("SELECT COUNT(*)" + from + where).params(params).query(Long.class).single();

        String distance = c.hasLocation() ? DISTANCE_SQL : "CAST(NULL AS DOUBLE PRECISION)";
        String order = c.sortByDistance() && c.hasLocation()
                ? " ORDER BY distance ASC, b.recommendations_count DESC"
                : " ORDER BY b.recommendations_count DESC" + (c.hasLocation() ? ", distance ASC" : ", b.name ASC");
        params.put("limit", c.size());
        params.put("offset", c.page() * c.size());

        List<Row> rows = jdbc.sql("SELECT b.id, b.name, c.slug, c.name AS category_name, c.icon, b.neighborhood,"
                        + " b.latitude, b.longitude, b.opens_at, b.closes_at, b.open_days,"
                        + " b.recommendations_count, b.good_price_count, b.punctual_count, b.reliable_count, "
                        + distance + " AS distance" + from + where + order + " LIMIT :limit OFFSET :offset")
                .params(params)
                .query((rs, i) -> {
                    double d = rs.getDouble("distance");
                    return new Row(rs.getLong("id"), rs.getString("name"), rs.getString("slug"),
                            rs.getString("category_name"), rs.getString("icon"), rs.getString("neighborhood"),
                            rs.getDouble("latitude"), rs.getDouble("longitude"),
                            rs.getObject("opens_at", LocalTime.class), rs.getObject("closes_at", LocalTime.class),
                            rs.getString("open_days"), rs.getInt("recommendations_count"),
                            rs.getInt("good_price_count"), rs.getInt("punctual_count"), rs.getInt("reliable_count"),
                            rs.wasNull() ? null : d);
                })
                .list();

        return new Result(rows, total, facets);
    }

    private static String filters(Criteria c, Map<String, Object> params) {
        StringBuilder sql = new StringBuilder("b.status = 'APPROVED'");
        List<String> tokens = TextSearch.tokens(c.query());
        for (int i = 0; i < tokens.size(); i++) {
            sql.append(" AND b.search_text LIKE :t").append(i);
            params.put("t" + i, "%" + tokens.get(i) + "%");
        }
        if (c.hasLocation()) {
            params.put("lat", c.latitude());
            params.put("lng", c.longitude());
            if (c.radius() != null) {
                sql.append(" AND ").append(DISTANCE_SQL).append(" <= :radius");
                params.put("radius", c.radius());
            }
        }
        if (c.openNow()) {
            sql.append(OPEN_NOW_SQL);
            params.put("now", c.now());
            params.put("dow", String.valueOf(c.dayOfWeek()));
        }
        return sql.toString();
    }
}
