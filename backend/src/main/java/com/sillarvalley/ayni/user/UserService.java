package com.sillarvalley.ayni.user;

import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.common.ApiException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final CurrentUser currentUser;
    private final Locations locations;

    public UserService(UserRepository users, CurrentUser currentUser, Locations locations) {
        this.users = users;
        this.currentUser = currentUser;
        this.locations = locations;
    }

    @Transactional(readOnly = true)
    public UserDtos.UserResponse me(Long uid) {
        User u = currentUser.require(uid);
        return UserDtos.UserResponse.of(u, locations.of(u));
    }

    @Transactional
    public UserDtos.UserResponse updateProfile(Long uid, UserDtos.UpdateProfileRequest req) {
        User u = currentUser.require(uid);
        String email = (req.email() == null || req.email().isBlank()) ? null : req.email().trim().toLowerCase();
        if (email != null && !email.equals(u.getEmail()) && users.existsByEmail(email)) {
            throw ApiException.conflict("Ese email ya está registrado");
        }
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        return UserDtos.UserResponse.of(u, locations.of(u));
    }

    @Transactional(readOnly = true)
    public List<UserDtos.UserSummary> ranking() {
        return users.findTop20ByActiveTrueOrderByAyniPointsDescHelpGivenDesc()
                .stream().map(UserDtos.UserSummary::of).toList();
    }
}
