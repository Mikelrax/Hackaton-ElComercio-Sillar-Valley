package com.sillarvalley.ayni.moderation;

import com.sillarvalley.ayni.common.PageResponse;
import com.sillarvalley.ayni.post.PostDtos;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.UserDtos;
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
public class ModerationController {

    private final ModerationService service;

    public ModerationController(ModerationService service) {
        this.service = service;
    }

    @GetMapping("/api/moderation/posts")
    public PageResponse<PostDtos.PostResponse> posts(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestParam(defaultValue = "PENDING") PostStatus status,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return service.listByStatus(CurrentUser.idOf(jwt), status, page, size);
    }

    @PostMapping("/api/moderation/posts/{id}/approve")
    public PostDtos.PostResponse approve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.approve(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/moderation/posts/{id}/reject")
    public PostDtos.PostResponse reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                        @Valid @RequestBody ModerationDtos.RejectRequest req) {
        return service.reject(CurrentUser.idOf(jwt), id, req.note());
    }

    @GetMapping("/api/moderation/reports")
    public PageResponse<ModerationDtos.ReportDto> reports(@AuthenticationPrincipal Jwt jwt,
                                                          @RequestParam(defaultValue = "OPEN") ReportStatus status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return service.listReports(CurrentUser.idOf(jwt), status, page, size);
    }

    @PostMapping("/api/moderation/reports/{id}/resolve")
    public ModerationDtos.ReportDto resolve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                            @Valid @RequestBody ModerationDtos.ResolveReportRequest req) {
        return service.resolve(CurrentUser.idOf(jwt), id, req.removePost(), req.note());
    }

    @GetMapping("/api/moderation/users")
    public java.util.List<UserDtos.UserResponse> users(@AuthenticationPrincipal Jwt jwt) {
        return service.listUsers(CurrentUser.idOf(jwt));
    }

    @PatchMapping("/api/moderation/users/{id}/active")
    public UserDtos.UserResponse setActive(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                           @RequestBody ModerationDtos.ActiveRequest req) {
        return service.setActive(CurrentUser.idOf(jwt), id, req.active());
    }

    @PostMapping("/api/posts/{postId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ModerationDtos.ReportDto report(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId,
                                           @Valid @RequestBody ModerationDtos.ReportRequest req) {
        return service.report(CurrentUser.idOf(jwt), postId, req.reason());
    }
}
