package com.sillarvalley.ayni.response;

import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ResponseController {

    private final ResponseService service;

    public ResponseController(ResponseService service) {
        this.service = service;
    }

    @PostMapping("/api/posts/{postId}/responses")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDtos.HelpResponseDto create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId,
                                               @Valid @RequestBody ResponseDtos.ResponseRequest req) {
        return service.create(CurrentUser.idOf(jwt), postId, req);
    }

    @GetMapping("/api/posts/{postId}/responses")
    public List<ResponseDtos.HelpResponseDto> listForPost(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable Long postId) {
        return service.listForPost(CurrentUser.idOf(jwt), postId);
    }

    @GetMapping("/api/responses/mine")
    public List<ResponseDtos.HelpResponseDto> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(CurrentUser.idOf(jwt));
    }

    @PostMapping("/api/responses/{id}/accept")
    public ResponseDtos.HelpResponseDto accept(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.accept(CurrentUser.idOf(jwt), id);
    }

    @PostMapping("/api/responses/{id}/decline")
    public ResponseDtos.HelpResponseDto decline(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.decline(CurrentUser.idOf(jwt), id);
    }

    @DeleteMapping("/api/responses/{id}")
    public ResponseDtos.HelpResponseDto withdraw(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.withdraw(CurrentUser.idOf(jwt), id);
    }
}
