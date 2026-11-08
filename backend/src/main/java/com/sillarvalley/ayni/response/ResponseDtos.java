package com.sillarvalley.ayni.response;

import com.sillarvalley.ayni.user.UserDtos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ResponseDtos {

    private ResponseDtos() {}

    public record ResponseRequest(@NotBlank @Size(max = 1000) String message) {}

    public record HelpResponseDto(Long id, Long postId, String postTitle, UserDtos.UserSummary helper,
                                  String message, HelpStatus status, String contactPhone, Instant createdAt) {}
}
