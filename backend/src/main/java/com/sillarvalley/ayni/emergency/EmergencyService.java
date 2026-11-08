package com.sillarvalley.ayni.emergency;

import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.common.GeoPoint;
import com.sillarvalley.ayni.geo.Distances;
import com.sillarvalley.ayni.geo.LocationPrivacy;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmergencyService {

    private final EmergencyActivationRepository activations;
    private final EmergencyReportRepository reports;
    private final SupportPointRepository supportPoints;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final Locations locations;
    private final Distances distances;
    private final LocationPrivacy privacy;

    public EmergencyService(EmergencyActivationRepository activations, EmergencyReportRepository reports,
                            SupportPointRepository supportPoints, UserRepository users, CurrentUser currentUser,
                            Locations locations, Distances distances, LocationPrivacy privacy) {
        this.activations = activations;
        this.reports = reports;
        this.supportPoints = supportPoints;
        this.users = users;
        this.currentUser = currentUser;
        this.locations = locations;
        this.distances = distances;
        this.privacy = privacy;
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.ModeResponse mode(Long uid) {
        currentUser.require(uid);
        return currentMode();
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.Overview overview(Long uid, Double lat, Double lng) {
        User user = currentUser.require(uid);
        boolean moderator = user.getRole() == Role.MODERATOR;
        List<EmergencyReport> recent = reports.findTop100ByOrderByCreatedAtDesc();
        Map<Long, Integer> reportDistances = distances.from(Distances.Table.EMERGENCY_REPORTS, lat, lng,
                recent.stream().map(EmergencyReport::getId).toList());
        List<EmergencyDtos.ReportResponse> list = recent.stream()
                .map(r -> toReport(r, user, moderator, reportDistances.get(r.getId())))
                .sorted(Comparator.comparing((EmergencyDtos.ReportResponse r) -> r.status().ordinal())
                        .thenComparing(r -> r.severity().ordinal())
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
        return new EmergencyDtos.Overview(currentMode(), list, points);
    }

    @Transactional
    public EmergencyDtos.ReportResponse create(Long uid, EmergencyDtos.CreateReportRequest req) {
        User user = currentUser.require(uid);
        GeoPoint where = locations.pick(user, req.addressId(), req.latitude(), req.longitude());
        EmergencyReport r = new EmergencyReport();
        r.setKind(req.kind());
        r.setCategory(req.category());
        r.setTitle(req.title() == null || req.title().isBlank()
                ? (req.kind() == EmergencyKind.NEED ? "Necesito " : "Ofrezco ") + req.category().label().toLowerCase()
                : req.title().trim());
        r.setPeopleCount(req.peopleCount() == null ? 1 : req.peopleCount());
        r.setSeverity(req.kind() == EmergencyKind.OFFER ? Severity.LOW : req.category().severity());
        r.setStatus(req.kind() == EmergencyKind.OFFER ? EmergencyStatus.ON_THE_WAY : EmergencyStatus.URGENT);
        r.setReporter(user);
        r.setNeighborhood(where.neighborhood());
        r.setLatitude(where.latitude());
        r.setLongitude(where.longitude());
        reports.save(r);
        return toReport(r, user, user.getRole() == Role.MODERATOR, null);
    }

    @Transactional
    public EmergencyDtos.ReportResponse onTheWay(Long uid, Long id) {
        User user = currentUser.require(uid);
        EmergencyReport r = find(id);
        if (r.getReporter().getId().equals(uid)) {
            throw ApiException.badRequest("No puedes atender tu propio reporte");
        }
        if (r.getStatus() != EmergencyStatus.URGENT) {
            throw ApiException.conflict("Alguien ya va en camino o el reporte fue atendido");
        }
        r.setStatus(EmergencyStatus.ON_THE_WAY);
        r.setHelper(user);
        return toReport(r, user, user.getRole() == Role.MODERATOR, null);
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
        r.setStatus(EmergencyStatus.ATTENDED);
        return toReport(r, user, user.getRole() == Role.MODERATOR, null);
    }

    @Transactional
    public EmergencyDtos.ReportResponse verify(Long uid, Long id) {
        User mod = requireModerator(uid);
        EmergencyReport r = find(id);
        r.setVerified(true);
        return toReport(r, mod, true, null);
    }

    @Transactional
    public EmergencyDtos.ModeResponse activate(Long uid, EmergencyDtos.ActivateRequest req) {
        User mod = requireModerator(uid);
        activations.findFirstByActiveTrueOrderByActivatedAtDesc().ifPresent(a -> close(a, mod));
        EmergencyActivation a = new EmergencyActivation();
        a.setTitle(req.title().trim());
        a.setMessage(req.message() == null || req.message().isBlank() ? null : req.message().trim());
        a.setActivatedBy(mod);
        activations.save(a);
        return toMode(a);
    }

    @Transactional
    public EmergencyDtos.ModeResponse deactivate(Long uid) {
        User mod = requireModerator(uid);
        activations.findFirstByActiveTrueOrderByActivatedAtDesc().ifPresent(a -> close(a, mod));
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
        p.setAddress(req.address() == null || req.address().isBlank() ? null : req.address().trim());
        p.setLatitude(where.latitude());
        p.setLongitude(where.longitude());
        p.setCreatedBy(mod);
        supportPoints.save(p);
        return toPoint(p, null);
    }

    @Transactional
    public EmergencyDtos.SupportPointResponse setPointOpen(Long uid, Long id, boolean open) {
        requireModerator(uid);
        SupportPoint p = supportPoints.findById(id).orElseThrow(() -> ApiException.notFound("Punto no encontrado"));
        p.setOpen(open);
        return toPoint(p, null);
    }

    @Transactional(readOnly = true)
    public EmergencyDtos.Stats stats(Long uid) {
        requireModerator(uid);
        return new EmergencyDtos.Stats(reports.countByStatusNot(EmergencyStatus.ATTENDED),
                supportPoints.countByOpenTrue(), users.count(),
                activations.findFirstByActiveTrueOrderByActivatedAtDesc().isPresent());
    }

    private EmergencyDtos.ModeResponse currentMode() {
        return activations.findFirstByActiveTrueOrderByActivatedAtDesc().map(this::toMode)
                .orElse(EmergencyDtos.ModeResponse.inactive());
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
                                                  Integer distance) {
        boolean mine = r.getReporter().getId().equals(viewer.getId());
        boolean helping = r.getHelper() != null && r.getHelper().getId().equals(viewer.getId());
        boolean exact = mine || helping || moderator;
        String phone = exact ? r.getReporter().getPhone() : null;
        LocationPrivacy.Point where = exact
                ? new LocationPrivacy.Point(r.getLatitude(), r.getLongitude())
                : privacy.blur("report", r.getId(), r.getLatitude(), r.getLongitude());
        return new EmergencyDtos.ReportResponse(r.getId(), r.getKind(), r.getKind().label(), r.getCategory(),
                r.getCategory().label(), r.getTitle(), r.getPeopleCount(), r.getSeverity(), r.getSeverity().label(),
                r.getStatus(), r.getStatus().label(), r.isVerified(), firstName(r.getReporter().getFullName()), phone,
                r.getHelper() == null ? null : firstName(r.getHelper().getFullName()), mine, helping,
                r.getNeighborhood(), exact ? distance : LocationPrivacy.rough(distance),
                where.latitude(), where.longitude(), !exact, r.getCreatedAt());
    }

    private EmergencyDtos.SupportPointResponse toPoint(SupportPoint p, Integer distance) {
        return new EmergencyDtos.SupportPointResponse(p.getId(), p.getName(), p.getType(), p.getType().label(),
                p.getNeighborhood(), p.getAddress(), p.isOpen(), distance, p.getLatitude(), p.getLongitude());
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

    private static String firstName(String fullName) {
        return fullName == null ? "" : fullName.trim().split("\\s+")[0];
    }
}
