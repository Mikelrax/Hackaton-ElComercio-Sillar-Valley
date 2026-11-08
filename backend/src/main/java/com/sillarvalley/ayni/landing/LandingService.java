package com.sillarvalley.ayni.landing;

import com.sillarvalley.ayni.emergency.SupportPointType;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LandingService {

    public record FeaturedBusiness(String name, String categoryName, String categoryIcon, int recommendations) {}

    public record FeaturedOffer(String title, String neighborhood) {}

    public record FeaturedSupportPoint(String name, String typeLabel, String neighborhood) {}

    public record Landing(List<String> zones, FeaturedBusiness business, FeaturedOffer offer,
                          FeaturedSupportPoint supportPoint) {}

    private final JdbcClient jdbc;

    public LandingService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public Landing landing() {
        List<String> zones = jdbc.sql("""
                        SELECT n.name FROM neighborhoods n
                        WHERE EXISTS (SELECT 1 FROM addresses a JOIN users u ON u.id = a.user_id
                                      WHERE u.active AND lower(a.neighborhood) = lower(n.name))
                           OR EXISTS (SELECT 1 FROM businesses b
                                      WHERE b.status = 'APPROVED' AND lower(b.neighborhood) = lower(n.name))
                        ORDER BY n.sort_order
                        """)
                .query(String.class)
                .list();

        FeaturedBusiness business = jdbc.sql("""
                        SELECT b.name, c.name AS category_name, c.icon, b.recommendations_count
                        FROM businesses b JOIN categories c ON c.id = b.category_id
                        WHERE b.status = 'APPROVED'
                        ORDER BY b.recommendations_count DESC, b.id
                        LIMIT 1
                        """)
                .query((rs, i) -> new FeaturedBusiness(rs.getString("name"), rs.getString("category_name"),
                        rs.getString("icon"), rs.getInt("recommendations_count")))
                .optional()
                .orElse(null);

        FeaturedOffer offer = jdbc.sql("""
                        SELECT title, neighborhood FROM posts
                        WHERE status = 'APPROVED' AND type = 'OFFER'
                        ORDER BY created_at DESC
                        LIMIT 1
                        """)
                .query((rs, i) -> new FeaturedOffer(rs.getString("title"), rs.getString("neighborhood")))
                .optional()
                .orElse(null);

        FeaturedSupportPoint supportPoint = jdbc.sql("""
                        SELECT name, type, neighborhood FROM support_points
                        WHERE is_open
                        ORDER BY created_at DESC, id
                        LIMIT 1
                        """)
                .query((rs, i) -> new FeaturedSupportPoint(rs.getString("name"),
                        SupportPointType.valueOf(rs.getString("type")).label(), rs.getString("neighborhood")))
                .optional()
                .orElse(null);

        return new Landing(zones, business, offer, supportPoint);
    }
}
