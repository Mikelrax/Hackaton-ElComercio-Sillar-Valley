package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BusinessController {

    private final BusinessService service;

    public BusinessController(BusinessService service) {
        this.service = service;
    }

    @GetMapping("/api/businesses")
    public BusinessDtos.SearchResponse search(@AuthenticationPrincipal Jwt jwt,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false) String category,
                                              @RequestParam(required = false) Double lat,
                                              @RequestParam(required = false) Double lng,
                                              @RequestParam(required = false) Integer radius,
                                              @RequestParam(defaultValue = "false") boolean openNow,
                                              @RequestParam(defaultValue = "recommended") String sort,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return service.search(CurrentUser.idOf(jwt), q, category, lat, lng, radius, openNow, sort, page, size);
    }

    @GetMapping("/api/businesses/categories")
    public List<BusinessDtos.CategoryResponse> categories() {
        return service.categories();
    }

    @GetMapping("/api/businesses/{id}")
    public BusinessDtos.BusinessDetail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                              @RequestParam(required = false) Double lat,
                                              @RequestParam(required = false) Double lng) {
        return service.detail(CurrentUser.idOf(jwt), id, lat, lng);
    }

    @PostMapping("/api/businesses")
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessDtos.BusinessDetail create(@AuthenticationPrincipal Jwt jwt,
                                              @Valid @RequestBody BusinessDtos.CreateBusinessRequest req) {
        return service.create(CurrentUser.idOf(jwt), req);
    }

    @PostMapping("/api/businesses/{id}/recommendations")
    public BusinessDtos.BusinessDetail recommend(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                 @Valid @RequestBody BusinessDtos.RecommendRequest req) {
        return service.recommend(CurrentUser.idOf(jwt), id, req);
    }

    @GetMapping("/api/moderation/businesses")
    public List<BusinessDtos.BusinessDetail> pending(@AuthenticationPrincipal Jwt jwt) {
        return service.listPending(CurrentUser.idOf(jwt));
    }

    @PostMapping("/api/moderation/businesses/{id}/approve")
    public BusinessDtos.BusinessDetail approve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.approve(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/moderation/businesses/{id}/reject")
    public BusinessDtos.BusinessDetail reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                              @Valid @RequestBody BusinessDtos.RejectRequest req) {
        return service.reject(CurrentUser.idOf(jwt), id, req.note());
    }
}
