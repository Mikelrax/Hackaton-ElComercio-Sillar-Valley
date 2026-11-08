package com.sillarvalley.ayni.emergency;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class EmergencyClaims {

    public record Claimer(long reportId, long userId, String fullName, String phone, String message) {}

    private final JdbcClient jdbc;

    public EmergencyClaims(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void add(long reportId, long userId, String message) {
        jdbc.sql("INSERT INTO emergency_claims (report_id, user_id, message) VALUES (:report, :user, :message)"
                        + " ON CONFLICT (report_id, user_id)"
                        + " DO UPDATE SET message = coalesce(EXCLUDED.message, emergency_claims.message)")
                .param("report", reportId)
                .param("user", userId)
                .param("message", message)
                .update();
    }

    public Map<Long, List<Claimer>> of(Collection<Long> reportIds) {
        if (reportIds.isEmpty()) {
            return Map.of();
        }
        return jdbc.sql("SELECT c.report_id, c.user_id, c.message, u.full_name, u.phone FROM emergency_claims c"
                        + " JOIN users u ON u.id = c.user_id WHERE c.report_id IN (:ids) ORDER BY c.created_at")
                .param("ids", reportIds)
                .query((rs, i) -> new Claimer(rs.getLong("report_id"), rs.getLong("user_id"),
                        rs.getString("full_name"), rs.getString("phone"), rs.getString("message")))
                .list()
                .stream()
                .collect(Collectors.groupingBy(Claimer::reportId));
    }
}
