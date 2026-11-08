package com.sillarvalley.ayni.geo;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class Distances {

    public static final String POINT = "ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography";

    public enum Table {
        BUSINESSES("businesses"),
        POSTS("posts"),
        EMERGENCY_REPORTS("emergency_reports"),
        SUPPORT_POINTS("support_points");

        private final String sql;

        Table(String sql) {
            this.sql = sql;
        }
    }

    private record Row(long id, int meters) {}

    private final JdbcClient jdbc;

    public Distances(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<Long, Integer> from(Table table, Double latitude, Double longitude, Collection<Long> ids) {
        if (latitude == null || longitude == null || ids.isEmpty()) {
            return Map.of();
        }
        return jdbc.sql("SELECT id, round(ST_Distance(geog, " + POINT + ")) AS meters FROM " + table.sql
                        + " WHERE id IN (:ids)")
                .param("lat", latitude)
                .param("lng", longitude)
                .param("ids", ids)
                .query((rs, i) -> new Row(rs.getLong("id"), rs.getInt("meters")))
                .list()
                .stream()
                .collect(Collectors.toMap(Row::id, Row::meters));
    }

    public Integer from(Table table, Double latitude, Double longitude, Long id) {
        return id == null ? null : from(table, latitude, longitude, List.of(id)).get(id);
    }
}
