package com.sillarvalley.ayni.assistant;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.anthropic.models.messages.MessageParam;
import com.sillarvalley.ayni.common.ApiException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AssistantServiceTest {

    private static AssistantDtos.ChatMessage user(String text) {
        return new AssistantDtos.ChatMessage("user", text);
    }

    private static AssistantDtos.ChatMessage assistant(String text) {
        return new AssistantDtos.ChatMessage("assistant", text);
    }

    @Test
    void descartaElSaludoInicialDeKusi() {
        List<MessageParam> history = AssistantService.history(List.of(assistant("Hola, soy Kusi"), user("Busco un gasfitero")));
        assertEquals(1, history.size());
        assertTrue(history.getFirst().isUser());
    }

    @Test
    void conservaSoloLosUltimosMensajesYEmpiezaPorElVecino() {
        List<AssistantDtos.ChatMessage> input = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            input.add(user("pregunta " + i));
            input.add(assistant("respuesta " + i));
        }
        input.add(user("última pregunta"));
        List<MessageParam> history = AssistantService.history(input);
        assertTrue(history.size() <= 12);
        assertTrue(history.getFirst().isUser());
        assertTrue(history.getLast().isUser());
    }

    @Test
    void rechazaUnaConversacionQueNoTerminaEnElVecino() {
        assertTrue(AssistantService.history(List.of(user("Hola"), assistant("¿En qué te ayudo?"))).isEmpty());
    }

    @Test
    void limitaLosMensajesPorHora() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(
                new AssistantProperties("", "claude-haiku-5-5", "low", 2, 2048, 45));
        assertDoesNotThrow(() -> limiter.acquire(1L));
        assertDoesNotThrow(() -> limiter.acquire(1L));
        ApiException e = assertThrows(ApiException.class, () -> limiter.acquire(1L));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, e.getStatus());
        assertDoesNotThrow(() -> limiter.acquire(2L));
    }
}
