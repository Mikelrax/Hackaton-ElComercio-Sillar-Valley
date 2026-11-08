package com.sillarvalley.ayni.seed;

import com.sillarvalley.ayni.emergency.EmergencyCategory;
import com.sillarvalley.ayni.emergency.EmergencyKind;
import com.sillarvalley.ayni.emergency.EmergencyReport;
import com.sillarvalley.ayni.emergency.EmergencyReportRepository;
import com.sillarvalley.ayni.emergency.EmergencyStatus;
import com.sillarvalley.ayni.emergency.Severity;
import com.sillarvalley.ayni.emergency.SupportPoint;
import com.sillarvalley.ayni.emergency.SupportPointRepository;
import com.sillarvalley.ayni.emergency.SupportPointType;
import com.sillarvalley.ayni.emergency.SupportResource;
import com.sillarvalley.ayni.emergency.VulnerableGroup;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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

    private record SampleReport(EmergencyKind kind, EmergencyCategory category, String title, int people,
                                Set<VulnerableGroup> vulnerable, EmergencyStatus status, double dLat, double dLng,
                                int minutesAgo) {}

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
        List<User> people = SeedAccounts.users(users);
        if (people.size() < 2) {
            return;
        }
        User moderator = people.stream().filter(u -> u.getRole() == Role.MODERATOR).findFirst().orElse(people.get(0));
        List<User> neighbors = people.stream().filter(u -> u.getRole() != Role.MODERATOR).toList();
        User first = neighbors.isEmpty() ? people.get(1) : neighbors.get(0);
        User second = neighbors.size() > 1 ? neighbors.get(1) : first;
        User third = neighbors.size() > 2 ? neighbors.get(2) : second;

        point("Albergue Colegio San José", SupportPointType.SHELTER, "Calle San José 120", 0.0045, 0.0030, true,
                Set.of(SupportResource.SHELTER, SupportResource.FOOD, SupportResource.CHARGING,
                        SupportResource.CLOTHES), "24 horas", moderator);
        point("Punto de agua potable · Plaza Yanahuara", SupportPointType.WATER, "Plaza de Yanahuara", 0.0010,
                -0.0025, true, Set.of(SupportResource.WATER), "7:00 a 19:00", moderator);
        point("Centro de salud Yanahuara", SupportPointType.HEALTH, "Av. Ejército 405", -0.0060, 0.0045, true,
                Set.of(SupportResource.FIRST_AID, SupportResource.MEDICINE), "24 horas", moderator);
        point("Centro de acopio Parroquia", SupportPointType.SUPPLIES, "Calle Cuesta del Ángel 202", 0.0025, 0.0060,
                false, Set.of(SupportResource.FOOD, SupportResource.WATER, SupportResource.CLOTHES), "9:00 a 17:00",
                moderator);
        point("Botiquín comunitario Los Arcos", SupportPointType.FIRST_AID, "Calle Los Arcos 210", -0.0018, -0.0040,
                true, Set.of(SupportResource.FIRST_AID), "8:00 a 20:00", moderator);

        report(first, null, new SampleReport(EmergencyKind.NEED, EmergencyCategory.WATER, "Adulto mayor sin agua", 2,
                Set.of(VulnerableGroup.ELDERLY), EmergencyStatus.URGENT, 0.0020, 0.0010, 5));
        report(second, third, new SampleReport(EmergencyKind.NEED, EmergencyCategory.SHELTER,
                "Familia necesita refugio", 4, Set.of(VulnerableGroup.CHILDREN), EmergencyStatus.ON_THE_WAY, -0.0035,
                0.0028, 12));
        report(third, first, new SampleReport(EmergencyKind.NEED, EmergencyCategory.MEDICINE,
                "Vecina con medicinas agotadas", 1, Set.of(), EmergencyStatus.ATTENDED, 0.0050, -0.0040, 35));
        report(second, null, new SampleReport(EmergencyKind.OFFER, EmergencyCategory.WATER,
                "Tengo bidones de agua para repartir", 1, Set.of(), EmergencyStatus.AVAILABLE, -0.0012, -0.0018, 20));
        log.info("Reportes y puntos de apoyo de ejemplo listos");
    }

    private void point(String name, SupportPointType type, String address, double dLat, double dLng, boolean open,
                       Set<SupportResource> resources, String hours, User creator) {
        Optional<SupportPoint> existing = points.findFirstByName(name);
        if (existing.isPresent()) {
            SupportPoint p = existing.get();
            if (!p.hasResources()) {
                p.setResources(resources);
            }
            if (p.getHours() == null) {
                p.setHours(hours);
            }
            return;
        }
        SupportPoint p = new SupportPoint();
        p.setName(name);
        p.setType(type);
        p.setNeighborhood("Yanahuara");
        p.setAddress(address);
        p.setResources(resources);
        p.setHours(hours);
        p.setLatitude(LAT + dLat);
        p.setLongitude(LNG + dLng);
        p.setOpen(open);
        p.setCreatedBy(creator);
        points.save(p);
    }

    private void report(User reporter, User helper, SampleReport sample) {
        Severity severity = sample.kind() == EmergencyKind.OFFER ? Severity.LOW
                : sample.vulnerable().isEmpty() ? sample.category().severity() : sample.category().severity().raised();
        Optional<EmergencyReport> existing = reports.findFirstByTitle(sample.title());
        if (existing.isPresent()) {
            EmergencyReport r = existing.get();
            if (!sample.vulnerable().isEmpty() && r.getVulnerable().isEmpty()
                    && r.getReporter().getId().equals(reporter.getId())) {
                r.setVulnerable(sample.vulnerable());
                r.setSeverity(severity);
            }
            return;
        }
        Instant createdAt = Instant.now().minus(sample.minutesAgo(), ChronoUnit.MINUTES);
        EmergencyReport r = new EmergencyReport();
        r.setKind(sample.kind());
        r.setCategory(sample.category());
        r.setTitle(sample.title());
        r.setPeopleCount(sample.people());
        r.setVulnerable(sample.vulnerable());
        r.setSeverity(severity);
        r.setStatus(sample.status());
        r.setReporter(reporter);
        r.setHelper(helper);
        r.setNeighborhood("Yanahuara");
        r.setLatitude(LAT + sample.dLat());
        r.setLongitude(LNG + sample.dLng());
        r.setCreatedAt(createdAt);
        if (sample.status() == EmergencyStatus.ATTENDED) {
            r.setAttendedAt(createdAt.plus(10, ChronoUnit.MINUTES));
        }
        reports.save(r);
    }
}
