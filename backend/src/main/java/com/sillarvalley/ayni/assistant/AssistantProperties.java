package com.sillarvalley.ayni.assistant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "assistant")
public record AssistantProperties(
        String apiKey,
        @NotBlank String model,
        @NotBlank @Pattern(regexp = "low|medium|high") String effort,
        @Min(1) int hourlyLimit,
        @Min(512) @Max(8192) long maxTokens,
        @Min(5) @Max(120) int timeoutSeconds
) {

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }
}
