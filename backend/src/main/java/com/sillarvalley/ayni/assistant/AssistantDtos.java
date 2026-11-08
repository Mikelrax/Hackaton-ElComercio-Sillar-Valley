package com.sillarvalley.ayni.assistant;

import com.sillarvalley.ayni.business.BusinessDtos;
import com.sillarvalley.ayni.emergency.EmergencyDtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class AssistantDtos {

    private AssistantDtos() {}

    public record ChatMessage(
            @NotNull @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 1200) String text) {}

    public record ChatRequest(
            @NotEmpty @Size(max = 30) List<@Valid ChatMessage> messages,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude) {}

    public record PostCard(Long id, String type, String typeLabel, String category, String categoryLabel,
                           String title, String neighborhood, Instant createdAt) {}

    public record PublishDraft(String type, String text) {}

    public record ChatResponse(
            String reply,
            List<BusinessDtos.BusinessSummary> businesses,
            List<PostCard> posts,
            List<EmergencyDtos.SupportPointResponse> supportPoints,
            PublishDraft draft,
            boolean showEmergencyNumbers) {}
}
