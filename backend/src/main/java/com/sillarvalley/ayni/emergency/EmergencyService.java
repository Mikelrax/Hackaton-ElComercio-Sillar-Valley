package com.sillarvalley.ayni.emergency;

import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.GeoPoint;
import com.sillarvalley.ayni.common.RichText;
import com.sillarvalley.ayni.geo.Distances;
import com.sillarvalley.ayni.geo.LocationPrivacy;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmergencyService {

    public static final int NEARBY_METERS = 2000;

    private static final Duration ATTENDED_VISIBLE = Duration.ofHours(24);

    private final EmergencyActivationRepository activations;
    private final EmergencyReportRepository reports;
    private final SupportPointRepository supportPoints;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final Locations locations;
    private final Distances distances;
    private final LocationPrivacy privacy;
    private final EmergencyClaims claims;
    private final SafetyChecks safety;

    public EmergencyService(EmergencyActivationRepository activations, EmergencyReportRepository reports,
                            SupportPointRepository supportPoints, UserRepository users, CurrentUser currentUser,
                            Locations locations, Distances distances, LocationPrivacy privacy,
                            EmergencyClaims claims, SafetyChecks safety) {
        this.activations = activations;
        this.reports = reports;
        this.supportPoints = supportPoints;
        this.users = users;
        this.currentUser = currentUser;
        this.locations = locations;
        this.distances = distances;
        this.privacy = privacy;
        this.claims = claims;
        this.safety = safety;
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.ModeResponse mode(Long uid) {
        currentUser.require(uid);
        return activeMode().map(this::toMode).orElse(EmergencyDtos.ModeResponse.inactive());
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.Overview overview(Long uid, Double lat, Double lng) {
        User user = currentUser.require(uid);
        boolean moderator = user.getRole() == Role.MODERATOR;
        List<EmergencyReport> recent = reports.findTop200ByOrderByCreatedAtDesc();
        List<Long> ids = recent.stream().map(EmergencyReport::getId).toList();
        Map<Long, Integer> reportDistances = distances.from(Distances.Table.EMERGENCY_REPORTS, lat, lng, ids);
        Map<Long, List<EmergencyClaims.Claimer>> claimsByReport = claims.of(ids);
        Instant cutoff = Instant.now().minus(ATTENDED_VISIBLE);
        List<EmergencyDtos.ReportResponse> list = recent.stream()
                .filter(r -> moderator || visibleTo(r, uid, reportDistances.get(r.getId()),
                        claimsByReport.getOrDefault(r.getId(), List.of()), cutoff))
                .map(r -> toReport(r, user, moderator, reportDistances.get(r.getId()),
                        claimsByReport.getOrDefault(r.getId(), List.of())))
                .sorted(Comparator.comparing((EmergencyDtos.ReportResponse r) -> r.status().ordinal())
                        .thenComparing(r -> r.severity().ordinal())
                        .thenComparing(r -> r.vulnerable().isEmpty())
                        .thenComparing(r -> r.distanceMeters() == null ? Integer.MAX_VALUE : r.distanceMeters()))
                .toList();
        List<SupportPoint> all = supportPoints.findAllByOrderByNameAsc();
        Map<Long, Integer> pointDistances = distances.from(Distances.Table.SUPPORT_POINTS, lat, lng,
                all.stream().map(SupportPoint::getId).toList());
        List<EmergencyDtos.SupportPointResponse> points = all.stream()
                .map(p -> toPoint(p, pointDistances.get(p.getId())))
                .sorted(Comparator.comparing((EmergencyDtos.SupportPointResponse p) -> !p.open())
                        .thenComparing(p -> p.distanceMeters() == null ? Integer.MAX_VALUE : p.distanceMeters()))
                .toList();
        Optional<EmergencyActivation> active = activeMode();
        SafetyStatus myCheckIn = active.flatMap(a -> safety.of(a.getId(), uid)).orElse(null);
        EmergencyDtos.SafetySummary summary = moderator ? active.map(this::summary).orElse(null) : null;
        return new EmergencyDtos.Overview(active.map(this::toMode).orElse(EmergencyDtos.ModeResponse.inactive()),
                list, points, moderator ? null : NEARBY_METERS, myCheckIn, summary, Instant.now());
    }

    @Transactional
    public EmergencyDtos.ReportResponse create(Long uid, EmergencyDtos.CreateReportRequest req) {
        User user = currentUser.require(uid);
        GeoPoint where = locations.pick(user, req.addressId(), req.latitude(), req.longitude());
        boolean offer = req.kind() == EmergencyKind.OFFER;
        Set<VulnerableGroup> vulnerable = offer || req.vulnerable() == null ? Set.of() : req.vulnerable();
        Severity base = req.category().severity();
        EmergencyReport r = new EmergencyReport();
        r.setKind(req.kind());
        r.setCategory(req.category());
        r.setTitle(req.title() == null || req.title().isBlank()
                ? (offer ? "Ofrezco " : "Necesito ") + req.category().label().toLowerCase()
                : req.title().trim());
        r.setPeopleCount(req.peopleCount() == null ? 1 : req.peopleCount());
        r.setVulnerable(vulnerable);
        r.setSeverity(offer ? Severity.LOW : vulnerable.isEmpty() ? base : base.raised());
        r.setStatus(offer ? EmergencyStatus.AVAILABLE : EmergencyStatus.URGENT);
        r.setReporter(user);
        r.setNeighborhood(where.neighborhood());
        r.setLatitude(where.latitude());
        r.setLongitude(where.longitude());
        reports.save(r);
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, List.of());
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.ReportResponse detail(Long uid, Long id, Double lat, Double lng) {
        User user = currentUser.require(uid);
        EmergencyReport r = find(id);
        Integer distance = distances.from(Distances.Table.EMERGENCY_REPORTS, lat, lng, r.getId());
        return toReport(r, user, user.getRole() == Role.MODERATOR, distance, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.ReportResponse onTheWay(Long uid, Long id, String message) {
        User user = currentUser.require(uid);
        EmergencyReport r = find(id);
        if (r.getKind() == EmergencyKind.OFFER) {
            throw ApiException.badRequest("Para un recurso ofrecido usa «Lo necesito»");
        }
        if (r.getReporter().getId().equals(uid)) {
            throw ApiException.badRequest("No puedes atender tu propio reporte");
        }
        if (r.getStatus() != EmergencyStatus.URGENT) {
            throw ApiException.conflict("Alguien ya va en camino o el reporte fue atendido");
        }
        r.setStatus(EmergencyStatus.ON_THE_WAY);
        r.setHelper(user);
        r.setHelperMessage(blankToNull(message));
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.ReportResponse release(Long uid, Long id) {
        User user = currentUser.require(uid);
        boolean moderator = user.getRole() == Role.MODERATOR;
        EmergencyReport r = find(id);
        if (r.getStatus() != EmergencyStatus.ON_THE_WAY || r.getHelper() == null) {
            throw ApiException.conflict("Nadie está en camino a este reporte");
        }
        if (!r.getHelper().getId().equals(uid) && !moderator) {
            throw ApiException.forbidden("Solo quien va en camino o un moderador pueden soltarlo");
        }
        r.setStatus(EmergencyStatus.URGENT);
        r.setHelper(null);
        r.setHelperMessage(null);
        return toReport(r, user, moderator, null, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.ReportResponse claim(Long uid, Long id, String message) {
        User user = currentUser.require(uid);
        EmergencyReport r = find(id);
        if (r.getKind() != EmergencyKind.OFFER) {
            throw ApiException.badRequest("Solo puedes pedir un recurso que alguien ofrece");
        }
        if (r.getReporter().getId().equals(uid)) {
            throw ApiException.badRequest("Este recurso lo ofreciste tú");
        }
        if (r.getStatus() != EmergencyStatus.AVAILABLE) {
            throw ApiException.conflict("Este recurso ya no está disponible");
        }
        claims.add(r.getId(), uid, blankToNull(message));
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.ReportResponse attended(Long uid, Long id) {
        User user = currentUser.require(uid);
        EmergencyReport r = find(id);
        boolean allowed = r.getReporter().getId().equals(uid)
                || (r.getHelper() != null && r.getHelper().getId().equals(uid))
                || user.getRole() == Role.MODERATOR;
        if (!allowed) {
            throw ApiException.forbidden("Solo quien reportó, quien ayuda o un moderador pueden cerrarlo");
        }
        if (r.getStatus() != EmergencyStatus.ATTENDED) {
            r.setStatus(EmergencyStatus.ATTENDED);
            r.setAttendedAt(Instant.now());
        }
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.ReportResponse verify(Long uid, Long id) {
        User mod = requireModerator(uid);
        EmergencyReport r = find(id);
        r.setVerified(true);
        return toReport(r, mod, true, null, claimsOf(r));
    }

    @Transactional
    public EmergencyDtos.CheckInResponse checkIn(Long uid, EmergencyDtos.CheckInRequest req) {
        currentUser.require(uid);
        EmergencyActivation a = activeMode()
                .orElseThrow(() -> ApiException.conflict("No hay una emergencia activa en este momento"));
        safety.save(a.getId(), uid, req.status());
        return new EmergencyDtos.CheckInResponse(req.status(), req.status().label());
    }

    @Transactional
    public EmergencyDtos.ModeResponse activate(Long uid, EmergencyDtos.ActivateRequest req) {
        User mod = requireModerator(uid);
        activeMode().ifPresent(a -> close(a, mod));
        EmergencyActivation a = new EmergencyActivation();
        a.setTitle(req.title().trim());
        a.setMessage(blankToNull(RichText.clean(req.message())));
        a.setActivatedBy(mod);
        activations.save(a);
        return toMode(a);
    }

    @Transactional
    public EmergencyDtos.ModeResponse deactivate(Long uid) {
        User mod = requireModerator(uid);
        activeMode().ifPresent(a -> close(a, mod));
        return EmergencyDtos.ModeResponse.inactive();
    }

    @Transactional
    public EmergencyDtos.SupportPointResponse createPoint(Long uid, EmergencyDtos.SupportPointRequest req) {
        User mod = requireModerator(uid);
        GeoPoint where = locations.resolve(req.neighborhood(), req.latitude(), req.longitude(), locations.of(mod));
        SupportPoint p = new SupportPoint();
        p.setName(req.name().trim());
        p.setType(req.type());
        p.setNeighborhood(where.neighborhood());
        p.setAddress(blankToNull(req.address()));
        p.setResources(req.resources() == null ? Set.of() : req.resources());
        p.setHours(blankToNull(req.hours()));
        p.setLatitude(where.latitude());
        p.setLongitude(where.longitude());
        p.setCreatedBy(mod);
        supportPoints.save(p);
        return toPoint(p, null);
    }

    @Transactional
    public EmergencyDtos.SupportPointResponse updatePoint(Long uid, Long id, EmergencyDtos.UpdatePointRequest req) {
        requireModerator(uid);
        SupportPoint p = supportPoints.findById(id).orElseThrow(() -> ApiException.notFound("Punto no encontrado"));
        if (req.open() != null) {
            p.setOpen(req.open());
        }
        if (req.resources() != null) {
            p.setResources(req.resources());
        }
        if (req.hours() != null) {
            p.setHours(blankToNull(req.hours()));
        }
        return toPoint(p, null);
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.Stats stats(Long uid) {
        requireModerator(uid);
        return new EmergencyDtos.Stats(
                reports.countByKindAndStatusIn(EmergencyKind.NEED,
                        List.of(EmergencyStatus.URGENT, EmergencyStatus.ON_THE_WAY)),
                supportPoints.countByOpenTrue(), users.count(), activeMode().isPresent());
    }

    private Optional<EmergencyActivation> activeMode() {
        return activations.findFirstByActiveTrueOrderByActivatedAtDesc();
    }

    private EmergencyDtos.SafetySummary summary(EmergencyActivation a) {
        Map<SafetyStatus, Long> counts = safety.neighborCounts(a.getId());
        long safe = counts.getOrDefault(SafetyStatus.SAFE, 0L);
        long needHelp = counts.getOrDefault(SafetyStatus.NEED_HELP, 0L);
        long pending = Math.max(0, safety.activeNeighbors() - safe - needHelp);
        List<EmergencyDtos.Contact> people = safety.needingHelp(a.getId()).stream()
                .map(p -> new EmergencyDtos.Contact(p.fullName(), p.phone()))
                .toList();
        return new EmergencyDtos.SafetySummary(safe, needHelp, pending, people);
    }

    private static boolean visibleTo(EmergencyReport r, Long uid, Integer distance,
                                     List<EmergencyClaims.Claimer> claimers, Instant cutoff) {
        if (r.getStatus() == EmergencyStatus.ATTENDED
                && (r.getAttendedAt() == null || r.getAttendedAt().isBefore(cutoff))) {
            return false;
        }
        boolean involved = r.getReporter().getId().equals(uid)
                || (r.getHelper() != null && r.getHelper().getId().equals(uid))
                || claimers.stream().anyMatch(c -> c.userId() == uid);
        return involved || distance == null || distance <= NEARBY_METERS;
    }

    private List<EmergencyClaims.Claimer> claimsOf(EmergencyReport r) {
        return claims.of(List.of(r.getId())).getOrDefault(r.getId(), List.of());
    }

    private void close(EmergencyActivation a, User mod) {
        a.setActive(false);
        a.setDeactivatedBy(mod);
        a.setDeactivatedAt(Instant.now());
    }

    private EmergencyDtos.ModeResponse toMode(EmergencyActivation a) {
        return new EmergencyDtos.ModeResponse(true, a.getTitle(), a.getMessage(), a.getActivatedAt(),
                firstName(a.getActivatedBy().getFullName()));
    }

    private EmergencyDtos.ReportResponse toReport(EmergencyReport r, User viewer, boolean moderator,
                                                  Integer distance, List<EmergencyClaims.Claimer> claimers) {
        long viewerId = viewer.getId();
        boolean mine = r.getReporter().getId() == viewerId;
        boolean helping = r.getHelper() != null && r.getHelper().getId() == viewerId;
        boolean claimed = claimers.stream().anyMatch(c -> c.userId() == viewerId);
        boolean exact = mine || helping || claimed || moderator;
        String phone = exact ? r.getReporter().getPhone() : null;
        LocationPrivacy.Point where = exact
                ? new LocationPrivacy.Point(r.getLatitude(), r.getLongitude())
                : privacy.blur("report", r.getId(), r.getLatitude(), r.getLongitude());
        List<EmergencyDtos.ClaimerResponse> contacts = mine || moderator
                ? claimers.stream()
                        .map(c -> new EmergencyDtos.ClaimerResponse(firstName(c.fullName()), c.phone(), c.message()))
                        .toList()
                : List.of();
        String helperMessage = mine || helping || moderator ? r.getHelperMessage() : null;
        List<EmergencyDtos.Label> vulnerable = r.getVulnerable().stream()
                .map(g -> new EmergencyDtos.Label(g.name(), g.label()))
                .toList();
        return new EmergencyDtos.ReportResponse(r.getId(), r.getKind(), r.getKind().label(), r.getCategory(),
                r.getCategory().label(), r.getTitle(), r.getPeopleCount(), vulnerable, r.getSeverity(),
                r.getSeverity().label(), r.getStatus(), r.getStatus().label(r.getKind()), r.isVerified(),
                firstName(r.getReporter().getFullName()), phone,
                r.getHelper() == null ? null : firstName(r.getHelper().getFullName()), helperMessage, mine, helping,
                claimers.size(), claimed, contacts,
                r.getNeighborhood(), exact ? distance : LocationPrivacy.rough(distance),
                where.latitude(), where.longitude(), !exact, r.getCreatedAt());
    }

    private EmergencyDtos.SupportPointResponse toPoint(SupportPoint p, Integer distance) {
        List<EmergencyDtos.Label> resources = p.getResources().stream()
                .map(s -> new EmergencyDtos.Label(s.name(), s.label()))
                .toList();
        return new EmergencyDtos.SupportPointResponse(p.getId(), p.getName(), p.getType(), p.getType().label(),
                p.getNeighborhood(), p.getAddress(), resources, p.getHours(), p.isOpen(), distance,
                p.getLatitude(), p.getLongitude());
    }

    private EmergencyReport find(Long id) {
        return reports.findById(id).orElseThrow(() -> ApiException.notFound("Reporte no encontrado"));
    }

    private User requireModerator(Long uid) {
        User u = currentUser.require(uid);
        if (u.getRole() != Role.MODERATOR) {
            throw ApiException.forbidden("Solo los moderadores pueden hacer esto");
        }
        return u;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstName(String fullName) {
        return fullName == null ? "" : fullName.trim().split("\\s+")[0];
    }
}
