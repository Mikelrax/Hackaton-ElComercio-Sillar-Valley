package com.sillarvalley.ayni.user;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public UserDtos.UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return service.me(CurrentUser.idOf(jwt));
    }

    @PutMapping("/me")
    public UserDtos.UserResponse update(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody UserDtos.UpdateProfileRequest req) {
        return service.updateProfile(CurrentUser.idOf(jwt), req);
    }

    /** Ranking de reciprocidad (top 20). */
    @GetMapping("/ranking")
    public List<UserDtos.UserSummary> ranking() {
        return service.ranking();
    }
}
