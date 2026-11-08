package com.sillarvalley.ayni.moderation;

import com.sillarvalley.ayni.user.UserDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ModerationDtos {

    private ModerationDtos() {}

    public record RejectRequest(@NotBlank @Size(max = 500) String note) {}

    public record ReportRequest(@NotBlank @Size(max = 500) String reason) {}

    public record ResolveReportRequest(boolean removePost, @Size(max = 500) String note) {}

    public record ActiveRequest(boolean active) {}

    public record TemporaryPasswordResponse(String fullName, String password) {}

    public record ReportDto(Long id, Long postId, String postTitle, UserDtos.UserSummary reporter, String reason,
                            ReportStatus status, String resolutionNote, Instant createdAt, Instant resolvedAt) {}
}
