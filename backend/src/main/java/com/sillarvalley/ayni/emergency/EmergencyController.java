package com.sillarvalley.ayni.emergency;

import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EmergencyController {

    private final EmergencyService service;

    public EmergencyController(EmergencyService service) {
        this.service = service;
    }

    @GetMapping("/api/emergency/mode")
    public EmergencyDtos.ModeResponse mode(@AuthenticationPrincipal Jwt jwt) {
        return service.mode(CurrentUser.idOf(jwt));
    }

    @GetMapping("/api/emergency")
    public EmergencyDtos.Overview overview(@AuthenticationPrincipal Jwt jwt,
                                           @RequestParam(required = false) Double lat,
                                           @RequestParam(required = false) Double lng) {
        return service.overview(CurrentUser.idOf(jwt), lat, lng);
    }

    @PostMapping("/api/emergency/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public EmergencyDtos.ReportResponse create(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody EmergencyDtos.CreateReportRequest req) {
        return service.create(CurrentUser.idOf(jwt), req);
    }

    @PostMapping("/api/emergency/reports/{id}/on-the-way")
    public EmergencyDtos.ReportResponse onTheWay(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.onTheWay(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/emergency/reports/{id}/attended")
    public EmergencyDtos.ReportResponse attended(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.attended(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/moderation/emergency/reports/{id}/verify")
    public EmergencyDtos.ReportResponse verify(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.verify(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/moderation/emergency/activate")
    public EmergencyDtos.ModeResponse activate(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody EmergencyDtos.ActivateRequest req) {
        return service.activate(CurrentUser.idOf(jwt), req);
    }

    @PostMapping("/api/moderation/emergency/deactivate")
    public EmergencyDtos.ModeResponse deactivate(@AuthenticationPrincipal Jwt jwt) {
        return service.deactivate(CurrentUser.idOf(jwt));
    }

    @PostMapping("/api/moderation/support-points")
    @ResponseStatus(HttpStatus.CREATED)
    public EmergencyDtos.SupportPointResponse createPoint(@AuthenticationPrincipal Jwt jwt,
                                                          @Valid @RequestBody EmergencyDtos.SupportPointRequest req) {
        return service.createPoint(CurrentUser.idOf(jwt), req);
    }

    @PatchMapping("/api/moderation/support-points/{id}")
    public EmergencyDtos.SupportPointResponse setOpen(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                      @RequestBody EmergencyDtos.OpenRequest req) {
        return service.setPointOpen(CurrentUser.idOf(jwt), id, req.open());
    }

    @GetMapping("/api/moderation/stats")
    public EmergencyDtos.Stats stats(@AuthenticationPrincipal Jwt jwt) {
        return service.stats(CurrentUser.idOf(jwt));
    }
}
