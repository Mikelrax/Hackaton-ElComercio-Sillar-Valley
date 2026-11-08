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
import java.util.Set;

public final class EmergencyDtos {

    private EmergencyDtos() {}

    public record Label(String value, String label) {}

    public record Contact(String name, String phone) {}

    public record ClaimerResponse(String name, String phone, String message) {}

    public record MessageRequest(@Size(max = 200, message = "El mensaje es muy largo") String message) {}

    public record ModeResponse(boolean active, String title, String message, Instant activatedAt, String activatedBy) {
        public static ModeResponse inactive() {
            return new ModeResponse(false, null, null, null, null);
        }
    }

    public record ReportResponse(
            Long id, EmergencyKind kind, String kindLabel, EmergencyCategory category, String categoryLabel,
            String title, int peopleCount, List<Label> vulnerable, Severity severity, String severityLabel,
            EmergencyStatus status, String statusLabel, boolean verified,
            String reporter, String reporterPhone, String helper, String helperMessage, boolean mine,
            boolean helpingByMe, int claimCount, boolean claimedByMe, List<ClaimerResponse> claimers,
            String neighborhood, Integer distanceMeters, double latitude, double longitude, boolean approximate,
            Instant createdAt) {}

    public record SupportPointResponse(
            Long id, String name, SupportPointType type, String typeLabel, String neighborhood, String address,
            List<Label> resources, String hours, boolean open, Integer distanceMeters, double latitude,
            double longitude) {}

    public record SafetySummary(long safe, long needHelp, long pending, List<Contact> needHelpPeople) {}

    public record Overview(ModeResponse mode, List<ReportResponse> reports, List<SupportPointResponse> supportPoints,
                           Integer nearbyMeters, SafetyStatus myCheckIn, SafetySummary safety, Instant generatedAt) {}

    public record CreateReportRequest(
            @NotNull(message = "Elige si necesitas u ofreces ayuda") EmergencyKind kind,
            @NotNull(message = "Elige qué tipo de ayuda") EmergencyCategory category,
            @Size(max = 150) String title,
            @Min(1) @Max(50) Integer peopleCount,
            Set<VulnerableGroup> vulnerable,
            Long addressId,
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
            Set<SupportResource> resources,
            @Size(max = 60, message = "El horario es muy largo") String hours,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude) {}

    public record UpdatePointRequest(
            Boolean open,
            Set<SupportResource> resources,
            @Size(max = 60, message = "El horario es muy largo") String hours) {}

    public record CheckInRequest(@NotNull(message = "Cuéntanos cómo estás") SafetyStatus status) {}

    public record CheckInResponse(SafetyStatus status, String label) {}

    public record Stats(long activeReports, long openSupportPoints, long users, boolean emergencyActive) {}
}
