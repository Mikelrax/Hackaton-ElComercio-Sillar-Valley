package com.sillarvalley.ayni.assistant;

import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AssistantController {

    private final AssistantService service;

    public AssistantController(AssistantService service) {
        this.service = service;
    }

    @PostMapping("/api/assistant/chat")
    public AssistantDtos.ChatResponse chat(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody AssistantDtos.ChatRequest req) {
        return service.chat(CurrentUser.idOf(jwt), req);
    }
}
