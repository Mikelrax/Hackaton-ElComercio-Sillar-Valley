package com.sillarvalley.ayni.emergency;

import com.sillarvalley.ayni.address.Address;
import com.sillarvalley.ayni.business.BusinessService;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmergencyService {

    private final EmergencyActivationRepository activations;
    private final EmergencyReportRepository reports;
    private final SupportPointRepository supportPoints;
    private final UserRepository users;
    private final CurrentUser currentUser;

    public EmergencyService(EmergencyActivationRepository activations, EmergencyReportRepository reports,
                            SupportPointRepository supportPoints, UserRepository users, CurrentUser currentUser) {
        this.activations = activations;
        this.reports = reports;
        this.supportPoints = supportPoints;
        this.users = users;
        this.currentUser = currentUser;
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
        List<EmergencyDtos.ReportResponse> list = reports.findTop100ByOrderByCreatedAtDesc().stream()
                .map(r -> toReport(r, user, moderator, lat, lng))
                .sorted(Comparator.comparing((EmergencyDtos.ReportResponse r) -> r.status().ordinal())
                        .thenComparing(r -> r.severity().ordinal())
                        .thenComparing(r -> r.distanceMeters() == null ? Integer.MAX_VALUE : r.distanceMeters()))
                .toList();
        List<EmergencyDtos.SupportPointResponse> points = supportPoints.findAllByOrderByNameAsc().stream()
                .map(p -> toPoint(p, lat, lng))
                .sorted(Comparator.comparing((EmergencyDtos.SupportPointResponse p) -> !p.open())
                        .thenComparing(p -> p.distanceMeters() == null ? Integer.MAX_VALUE : p.distanceMeters()))
                .toList();
        return new EmergencyDtos.Overview(currentMode(), list, points);
    }

    @Transactional
    public EmergencyDtos.ReportResponse create(Long uid, EmergencyDtos.CreateReportRequest req) {
        User user = currentUser.require(uid);
        Address home = user.primaryAddress().orElse(null);
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
        r.setNeighborhood(home == null ? "Arequipa" : home.getNeighborhood());
        r.setLatitude(req.latitude() != null ? req.latitude()
                : home != null && home.getLatitude() != null ? home.getLatitude() : BusinessService.DEFAULT_LATITUDE);
        r.setLongitude(req.longitude() != null ? req.longitude()
                : home != null && home.getLongitude() != null ? home.getLongitude() : BusinessService.DEFAULT_LONGITUDE);
        reports.save(r);
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, null);
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
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, null);
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
        return toReport(r, user, user.getRole() == Role.MODERATOR, null, null);
    }

    @Transactional
    public EmergencyDtos.ReportResponse verify(Long uid, Long id) {
        User mod = requireModerator(uid);
        EmergencyReport r = find(id);
        r.setVerified(true);
        return toReport(r, mod, true, null, null);
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
        Address home = mod.primaryAddress().orElse(null);
        SupportPoint p = new SupportPoint();
        p.setName(req.name().trim());
        p.setType(req.type());
        p.setNeighborhood(req.neighborhood() != null && !req.neighborhood().isBlank() ? req.neighborhood().trim()
                : home == null ? "Arequipa" : home.getNeighborhood());
        p.setAddress(req.address() == null || req.address().isBlank() ? null : req.address().trim());
        p.setLatitude(req.latitude() != null ? req.latitude()
                : home != null && home.getLatitude() != null ? home.getLatitude() : BusinessService.DEFAULT_LATITUDE);
        p.setLongitude(req.longitude() != null ? req.longitude()
                : home != null && home.getLongitude() != null ? home.getLongitude() : BusinessService.DEFAULT_LONGITUDE);
        p.setCreatedBy(mod);
        supportPoints.save(p);
        return toPoint(p, null, null);
    }

    @Transactional
    public EmergencyDtos.SupportPointResponse setPointOpen(Long uid, Long id, boolean open) {
        requireModerator(uid);
        SupportPoint p = supportPoints.findById(id).orElseThrow(() -> ApiException.notFound("Punto no encontrado"));
        p.setOpen(open);
        return toPoint(p, null, null);
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
                                                  Double lat, Double lng) {
        boolean mine = r.getReporter().getId().equals(viewer.getId());
        boolean helping = r.getHelper() != null && r.getHelper().getId().equals(viewer.getId());
        String phone = mine || helping || moderator ? r.getReporter().getPhone() : null;
        return new EmergencyDtos.ReportResponse(r.getId(), r.getKind(), r.getKind().label(), r.getCategory(),
                r.getCategory().label(), r.getTitle(), r.getPeopleCount(), r.getSeverity(), r.getSeverity().label(),
                r.getStatus(), r.getStatus().label(), r.isVerified(), firstName(r.getReporter().getFullName()), phone,
                r.getHelper() == null ? null : firstName(r.getHelper().getFullName()), mine, helping,
                r.getNeighborhood(), distance(lat, lng, r.getLatitude(), r.getLongitude()),
                r.getLatitude(), r.getLongitude(), r.getCreatedAt());
    }

    private EmergencyDtos.SupportPointResponse toPoint(SupportPoint p, Double lat, Double lng) {
        return new EmergencyDtos.SupportPointResponse(p.getId(), p.getName(), p.getType(), p.getType().label(),
                p.getNeighborhood(), p.getAddress(), p.isOpen(), distance(lat, lng, p.getLatitude(), p.getLongitude()),
                p.getLatitude(), p.getLongitude());
    }

    private static Integer distance(Double lat, Double lng, double toLat, double toLng) {
        return lat == null || lng == null ? null
                : (int) Math.round(BusinessService.distanceMeters(lat, lng, toLat, toLng));
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
