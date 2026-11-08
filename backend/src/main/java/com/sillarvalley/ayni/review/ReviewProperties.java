package com.sillarvalley.ayni.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "review")
public record ReviewProperties(
        boolean enabled,
        @Min(1) @Max(20) int batchSize,
        @Min(1) @Max(10) int maxAttempts,
        @Min(5) int retryDelaySeconds,
        @Min(60) int staleSeconds
) {}
