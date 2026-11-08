package com.sillarvalley.ayni.auth;

import com.sillarvalley.ayni.address.AddressDtos;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.UserDtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank String phone,
            @Email @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            String inviteCode,
            @NotNull(message = "Indica tu dirección") @Valid AddressDtos.AddressRequest address) {}

    public record LoginRequest(@NotBlank String identifier, @NotBlank String password) {}

    public record AuthResponse(String token, String tokenType, long expiresInSeconds, UserDtos.UserResponse user) {}

    public record DemoAccount(String key, String title, String summary, Role role, String fullName,
                              String neighborhood) {}
}
