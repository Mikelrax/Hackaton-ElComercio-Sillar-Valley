package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.common.PageResponse;
import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDtos.PostResponse create(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody PostDtos.PostRequest req) {
        return service.create(CurrentUser.idOf(jwt), req);
    }

    @GetMapping
    public PageResponse<PostDtos.PostResponse> search(@AuthenticationPrincipal Jwt jwt,
                                                      @RequestParam(required = false) PostType type,
                                                      @RequestParam(required = false) Category category,
                                                      @RequestParam(required = false) String q,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return service.search(CurrentUser.idOf(jwt), type, category, q, page, size);
    }

    @GetMapping("/mine")
    public PageResponse<PostDtos.PostResponse> mine(@AuthenticationPrincipal Jwt jwt,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return service.mine(CurrentUser.idOf(jwt), page, size);
    }

    @GetMapping("/{id}")
    public PostDtos.PostResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.get(CurrentUser.idOf(jwt), id);
    }

    @PutMapping("/{id}")
    public PostDtos.PostResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                        @Valid @RequestBody PostDtos.PostRequest req) {
        return service.update(CurrentUser.idOf(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    public PostDtos.PostResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.cancel(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/{id}/fulfill")
    public PostDtos.PostResponse fulfill(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.fulfill(CurrentUser.idOf(jwt), id);
    }
}
