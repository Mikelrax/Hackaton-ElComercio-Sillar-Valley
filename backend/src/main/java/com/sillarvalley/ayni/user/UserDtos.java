package com.sillarvalley.ayni.user;

import com.sillarvalley.ayni.address.AddressDtos;
import com.sillarvalley.ayni.common.GeoPoint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class UserDtos {

    private UserDtos() {}

    public record UserSummary(Long id, String fullName, int ayniPoints, int helpGiven) {
        public static UserSummary of(User u) {
            return new UserSummary(u.getId(), u.getFullName(), u.getAyniPoints(), u.getHelpGiven());
        }
    }

    public record UserResponse(Long id, String fullName, String phone, String email, Role role,
                               int ayniPoints, int helpGiven, int helpReceived, boolean active, Instant createdAt,
                               AddressDtos.AddressResponse primaryAddress, GeoPoint location) {
        public static UserResponse of(User u, GeoPoint location) {
            return new UserResponse(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(), u.getRole(),
                    u.getAyniPoints(), u.getHelpGiven(), u.getHelpReceived(), u.isActive(), u.getCreatedAt(),
                    u.primaryAddress().map(AddressDtos.AddressResponse::of).orElse(null), location);
        }
    }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @Email @Size(max = 160) String email) {}
}
