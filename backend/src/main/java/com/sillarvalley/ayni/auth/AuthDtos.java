package com.sillarvalley.ayni.auth;

import com.sillarvalley.ayni.user.UserDtos;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank String phone,
            @Email @Size(max = 160) String email,
            // 72 = límite de bytes de BCrypt
            @NotBlank @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            /** Opcional: si coincide con app.moderator-invite-code, la cuenta será MODERATOR. */
            String inviteCode) {}

    /** identifier = teléfono (con o sin +51) o email. */
    public record LoginRequest(@NotBlank String identifier, @NotBlank String password) {}

    public record AuthResponse(String token, String tokenType, long expiresInSeconds, UserDtos.UserResponse user) {}
}
