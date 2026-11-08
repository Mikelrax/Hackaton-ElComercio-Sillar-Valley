package com.sillarvalley.ayni.post;

import com.sillarvalley.ayni.storage.StorageService;
import com.sillarvalley.ayni.user.UserDtos;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    private final StorageService storage;

    public PostMapper(StorageService storage) {
        this.storage = storage;
    }

    /** includeNote: la nota del moderador solo la ven el autor y los moderadores. */
    public PostDtos.PostResponse toDto(Post p, boolean includeNote) {
        return new PostDtos.PostResponse(
                p.getId(), p.getType(), p.getCategory(), p.getTitle(), p.getDescription(),
                p.getNeighborhood(), p.getStatus(),
                p.getImages().stream().map(storage::publicUrl).toList(),
                UserDtos.UserSummary.of(p.getAuthor()),
                includeNote ? p.getModerationNote() : null,
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
