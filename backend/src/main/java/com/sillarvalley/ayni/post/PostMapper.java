package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.review.AutoReviewInfo;
import com.sillarvalley.ayni.storage.StorageService;
import com.sillarvalley.ayni.user.UserDtos;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    private final StorageService storage;

    public PostMapper(StorageService storage) {
        this.storage = storage;
    }

    public PostDtos.PostResponse toDto(Post p, boolean includeNote) {
        return toDto(p, includeNote, false);
    }

    public PostDtos.PostResponse toModeratorDto(Post p) {
        return toDto(p, true, true);
    }

    private PostDtos.PostResponse toDto(Post p, boolean includeNote, boolean moderatorView) {
        return new PostDtos.PostResponse(
                p.getId(), p.getType(), p.getCategory(), p.getCategory().label(), p.getTitle(), p.getDescription(),
                p.getNeighborhood(), p.getStatus(), p.getStatus().label(),
                p.getImages().stream().map(storage::publicUrl).toList(),
                UserDtos.UserSummary.of(p.getAuthor()),
                includeNote ? p.getModerationNote() : null,
                p.getCreatedAt(), p.getUpdatedAt(),
                includeNote ? AutoReviewInfo.of(p.getAutoReview(), p.getAutoReviewNote(), moderatorView) : null);
    }
}
