package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.review.AutoReviewInfo;
import com.sillarvalley.ayni.user.UserDtos;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class PostDtos {

    private PostDtos() {}

    public record PostRequest(
            @NotNull PostType type,
            @NotNull Category category,
            @NotBlank @Size(max = 150) String title,
            @NotBlank @Size(max = 4000) String description,
            Long addressId,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @Size(max = 4, message = "Máximo 4 imágenes") List<String> images) {}

    public record PostResponse(
            Long id, PostType type, Category category, String categoryLabel, String title, String description,
            String neighborhood, PostStatus status, String statusLabel, List<String> imageUrls,
            UserDtos.UserSummary author,
            String moderationNote, Instant createdAt, Instant updatedAt, AutoReviewInfo autoReview) {}
}
