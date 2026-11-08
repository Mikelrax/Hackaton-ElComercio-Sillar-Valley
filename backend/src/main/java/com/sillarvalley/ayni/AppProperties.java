package com.sillarvalley.ayni;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
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

    public List<String> corsOriginList() {
        return Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
