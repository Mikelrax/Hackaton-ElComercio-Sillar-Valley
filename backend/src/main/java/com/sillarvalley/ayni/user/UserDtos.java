package com.sillarvalley.ayni.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class UserDtos {

    private UserDtos() {}

    /** Datos públicos de un vecino (nunca incluye teléfono ni email). */
    public record UserSummary(Long id, String fullName, int ayniPoints, int helpGiven) {
        public static UserSummary of(User u) {
            return new UserSummary(u.getId(), u.getFullName(), u.getAyniPoints(), u.getHelpGiven());
        }
    }

    /** Perfil completo: solo para el propio usuario. */
    public record UserResponse(Long id, String fullName, String phone, String email, Role role,
                               int ayniPoints, int helpGiven, int helpReceived, boolean active, Instant createdAt) {
        public static UserResponse of(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getPhone(), u.getEmail(), u.getRole(),
                    u.getAyniPoints(), u.getHelpGiven(), u.getHelpReceived(), u.isActive(), u.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @Email @Size(max = 160) String email) {}
}
