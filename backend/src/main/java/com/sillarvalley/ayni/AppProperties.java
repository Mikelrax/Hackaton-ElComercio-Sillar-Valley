package com.sillarvalley.ayni;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// OBSERVACIÓN: @Validated hace que la app falle al iniciar si falta una propiedad
// o el secreto JWT es corto (antes fallaba tarde y de forma confusa).
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        // HS256 exige una clave de al menos 256 bits = 32 bytes
        @NotBlank @Size(min = 32, message = "app.jwt-secret debe tener al menos 32 caracteres") String jwtSecret,
        @Min(1) long jwtExpirationMinutes,
        @NotBlank String corsOrigins,
        @NotBlank String moderatorInviteCode,
        @NotBlank String timezone,
        @NotBlank String countryCode,
        @NotBlank String uploadDir,
        @NotBlank String publicBaseUrl,
        boolean seed
) {

    /** Convierte "http://a.com, http://b.com" en una lista (para CORS). */
    public List<String> corsOriginList() {
        return Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
