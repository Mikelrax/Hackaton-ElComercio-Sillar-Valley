package com.sillarvalley.ayni.emergency;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class EmergencyDtos {

    private EmergencyDtos() {}

    public record ModeResponse(boolean active, String title, String message, Instant activatedAt, String activatedBy) {
        public static ModeResponse inactive() {
            return new ModeResponse(false, null, null, null, null);
        }
    }

    public record ReportResponse(
            Long id, EmergencyKind kind, String kindLabel, EmergencyCategory category, String categoryLabel,
            String title, int peopleCount, Severity severity, String severityLabel,
            EmergencyStatus status, String statusLabel, boolean verified,
            String reporter, String reporterPhone, String helper, boolean mine, boolean helpingByMe,
            String neighborhood, Integer distanceMeters, double latitude, double longitude, Instant createdAt) {}

    public record SupportPointResponse(
            Long id, String name, SupportPointType type, String typeLabel, String neighborhood, String address,
            boolean open, Integer distanceMeters, double latitude, double longitude) {}

    public record Overview(ModeResponse mode, List<ReportResponse> reports, List<SupportPointResponse> supportPoints) {}

    public record CreateReportRequest(
            @NotNull(message = "Elige si necesitas u ofreces ayuda") EmergencyKind kind,
            @NotNull(message = "Elige qué tipo de ayuda") EmergencyCategory category,
            @Size(max = 150) String title,
            @Min(1) @Max(50) Integer peopleCount,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude) {}

    public record ActivateRequest(
            @NotBlank(message = "Escribe qué está pasando") @Size(max = 80) String title,
            @Size(max = 500) String message) {}

    public record SupportPointRequest(
            @NotBlank(message = "Escribe el nombre del punto") @Size(max = 120) String name,
            @NotNull(message = "Elige el tipo de punto") SupportPointType type,
            @Size(max = 120) String neighborhood,
            @Size(max = 200) String address,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude) {}

    public record OpenRequest(boolean open) {}

    public record Stats(long activeReports, long openSupportPoints, long users, boolean emergencyActive) {}
}
