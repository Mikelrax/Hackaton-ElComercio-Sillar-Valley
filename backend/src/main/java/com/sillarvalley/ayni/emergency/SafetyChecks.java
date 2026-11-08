package com.sillarvalley.ayni.emergency;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class SafetyChecks {

    public record Person(String fullName, String phone) {}

    private final JdbcClient jdbc;

    public SafetyChecks(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void save(long activationId, long userId, SafetyStatus status) {
        jdbc.sql("INSERT INTO emergency_check_ins (activation_id, user_id, status) VALUES (:activation, :user, :status)"
                        + " ON CONFLICT (activation_id, user_id)"
                        + " DO UPDATE SET status = EXCLUDED.status, updated_at = now()")
                .param("activation", activationId)
                .param("user", userId)
                .param("status", status.name())
                .update();
    }

    public Optional<SafetyStatus> of(long activationId, long userId) {
        return jdbc.sql("SELECT status FROM emergency_check_ins WHERE activation_id = :activation AND user_id = :user")
                .param("activation", activationId)
                .param("user", userId)
                .query((rs, i) -> SafetyStatus.valueOf(rs.getString("status")))
                .optional();
    }

    public Map<SafetyStatus, Long> neighborCounts(long activationId) {
        Map<SafetyStatus, Long> counts = new EnumMap<>(SafetyStatus.class);
        jdbc.sql("SELECT c.status, count(*) AS total FROM emergency_check_ins c JOIN users u ON u.id = c.user_id"
                        + " WHERE c.activation_id = :activation AND u.role = 'NEIGHBOR' AND u.active GROUP BY c.status")
                .param("activation", activationId)
                .query((rs, i) -> Map.entry(SafetyStatus.valueOf(rs.getString("status")), rs.getLong("total")))
                .list()
                .forEach(e -> counts.put(e.getKey(), e.getValue()));
        return counts;
    }

    public long activeNeighbors() {
        return jdbc.sql("SELECT count(*) FROM users WHERE role = 'NEIGHBOR' AND active")
                .query(Long.class)
                .single();
    }

    public List<Person> needingHelp(long activationId) {
        return jdbc.sql("SELECT u.full_name, u.phone FROM emergency_check_ins c JOIN users u ON u.id = c.user_id"
                        + " WHERE c.activation_id = :activation AND c.status = 'NEED_HELP' ORDER BY c.updated_at DESC")
                .param("activation", activationId)
                .query((rs, i) -> new Person(rs.getString("full_name"), rs.getString("phone")))
                .list();
    }
}
