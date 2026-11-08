package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.review.AutoReviewInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class BusinessDtos {

    private BusinessDtos() {}

    public record CategoryResponse(String slug, String name, String icon, long count) {}

    public record Tags(int goodPrice, int punctual, int reliable) {}

    public record BusinessSummary(
            Long id, String name, String categorySlug, String categoryName, String categoryIcon,
            String neighborhood, Integer distanceMeters, Boolean openNow, String scheduleText,
            int recommendationsCount, Tags tags, double latitude, double longitude) {}

    public record SearchResponse(List<BusinessSummary> content, long totalElements, List<CategoryResponse> categories) {}

    public record RecommendationResponse(String author, boolean goodPrice, boolean punctual, boolean reliable,
                                         String comment, Instant createdAt) {}

    public record BusinessDetail(
            Long id, String name, String categorySlug, String categoryName, String categoryIcon,
            String description, String phone, String neighborhood, String reference,
            Integer distanceMeters, Boolean openNow, String scheduleText, String priceHint,
            int recommendationsCount, Tags tags, double latitude, double longitude,
            BusinessStatus status, String moderationNote, String createdBy, boolean recommendedByMe,
            List<RecommendationResponse> recommendations, Instant createdAt, AutoReviewInfo autoReview) {}

    public record RecommendRequest(boolean goodPrice, boolean punctual, boolean reliable,
                                   @Size(max = 2000) String comment) {}

    public record CreateBusinessRequest(
            @NotBlank(message = "Escribe el nombre del negocio") @Size(max = 120) String name,
            @NotBlank(message = "Elige una categoría") String categorySlug,
            @Size(max = 1000) String description,
            String phone,
            Long addressId,
            @Size(max = 200) String reference,
            @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Usa el formato HH:mm") String opensAt,
            @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Usa el formato HH:mm") String closesAt,
            @Pattern(regexp = "^[1-7]{1,7}$", message = "Días inválidos") String openDays,
            @Size(max = 80) String priceHint,
            @Valid RecommendRequest recommendation) {}

    public record RejectRequest(@NotBlank @Size(max = 500) String note) {}
}
