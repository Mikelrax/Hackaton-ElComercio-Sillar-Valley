package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.emergency.EmergencyCategory;
import com.sillarvalley.ayni.emergency.EmergencyKind;
import com.sillarvalley.ayni.emergency.EmergencyReport;
import com.sillarvalley.ayni.emergency.EmergencyReportRepository;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.emergency.SupportPoint;
import com.sillarvalley.ayni.emergency.SupportPointRepository;
import com.sillarvalley.ayni.emergency.SupportPointType;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(3)
@ConditionalOnProperty(prefix = "app", name = "seed", havingValue = "true")
public class EmergencySeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmergencySeeder.class);
    private static final double LAT = -16.3889;
    private static final double LNG = -71.5422;

    private final EmergencyReportRepository reports;
    private final SupportPointRepository points;
    private final UserRepository users;

    public EmergencySeeder(EmergencyReportRepository reports, SupportPointRepository points, UserRepository users) {
        this.reports = reports;
        this.points = points;
        this.users = users;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (reports.count() > 0 || points.count() > 0) {
            return;
        }
        List<User> people = SeedAccounts.users(users);
        if (people.size() < 2) {
            return;
        }
        User moderator = people.stream().filter(u -> u.getRole() == Role.MODERATOR).findFirst().orElse(people.get(0));
        List<User> neighbors = people.stream().filter(u -> u.getRole() != Role.MODERATOR).toList();
        User first = neighbors.isEmpty() ? people.get(1) : neighbors.get(0);
        User second = neighbors.size() > 1 ? neighbors.get(1) : first;
        User third = neighbors.size() > 2 ? neighbors.get(2) : second;

        point("Albergue Colegio San José", SupportPointType.SHELTER, "Calle San José 120", 0.0045, 0.0030, true, moderator);
        point("Punto de agua potable · Plaza Yanahuara", SupportPointType.WATER, "Plaza de Yanahuara", 0.0010, -0.0025, true, moderator);
        point("Centro de salud Yanahuara", SupportPointType.HEALTH, "Av. Ejército 405", -0.0060, 0.0045, true, moderator);
        point("Centro de acopio Parroquia", SupportPointType.SUPPLIES, "Calle Cuesta del Ángel 202", 0.0025, 0.0060, false, moderator);
        point("Botiquín comunitario Los Arcos", SupportPointType.FIRST_AID, "Calle Los Arcos 210", -0.0018, -0.0040, true, moderator);

        report(first, EmergencyKind.NEED, EmergencyCategory.WATER, "Adulto mayor sin agua", 2,
                EmergencyStatus.URGENT, null, 0.0020, 0.0010, 5);
        report(second, EmergencyKind.NEED, EmergencyCategory.SHELTER, "Familia necesita refugio", 4,
                EmergencyStatus.ON_THE_WAY, third, -0.0035, 0.0028, 12);
        report(third, EmergencyKind.NEED, EmergencyCategory.MEDICINE, "Vecina con medicinas agotadas", 1,
                EmergencyStatus.ATTENDED, first, 0.0050, -0.0040, 35);
        log.info("Reportes y puntos de apoyo de ejemplo creados");
    }

    private void point(String name, SupportPointType type, String address, double dLat, double dLng, boolean open,
                       User creator) {
        SupportPoint p = new SupportPoint();
        p.setName(name);
        p.setType(type);
        p.setNeighborhood("Yanahuara");
        p.setAddress(address);
        p.setLatitude(LAT + dLat);
        p.setLongitude(LNG + dLng);
        p.setOpen(open);
        p.setCreatedBy(creator);
        points.save(p);
    }

    private void report(User reporter, EmergencyKind kind, EmergencyCategory category, String title, int people,
                        EmergencyStatus status, User helper, double dLat, double dLng, int minutesAgo) {
        EmergencyReport r = new EmergencyReport();
        r.setKind(kind);
        r.setCategory(category);
        r.setTitle(title);
        r.setPeopleCount(people);
        r.setSeverity(category.severity());
        r.setStatus(status);
        r.setReporter(reporter);
        r.setHelper(helper);
        r.setNeighborhood("Yanahuara");
        r.setLatitude(LAT + dLat);
        r.setLongitude(LNG + dLng);
        r.setCreatedAt(Instant.now().minus(minutesAgo, ChronoUnit.MINUTES));
        reports.save(r);
    }
}
