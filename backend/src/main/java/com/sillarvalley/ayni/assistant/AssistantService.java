package com.sillarvalley.ayni.assistant;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.BadRequestException;
import com.anthropic.errors.PermissionDeniedException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.errors.UnauthorizedException;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.TextBlock;
import com.anthropic.models.messages.Tool;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.emergency.EmergencyService;
import com.sillarvalley.ayni.user.UserDtos;
import com.sillarvalley.ayni.user.UserService;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    private static final int MAX_HISTORY = 12;
    private static final int MAX_STEPS = 5;
    private static final String UNAVAILABLE = "Kusi no está disponible en este momento. Intenta de nuevo en un rato.";
    private static final String BUSY = "Kusi está atendiendo a muchos vecinos a la vez. Intenta de nuevo en un minuto.";
    private static final String NO_CONNECTION = "Kusi no pudo conectarse. Revisa tu internet e intenta de nuevo.";
    private static final String REFUSAL = "Con eso no te puedo ayudar. Si es una emergencia, llama a la Policía al 105, "
            + "a los Bomberos al 116 o al SAMU al 106.";
    private static final String FALLBACK = "Perdona, no te entendí bien. ¿Me lo cuentas con otras palabras?";

    private final AssistantProperties props;
    private final AnthropicClient client;
    private final AssistantTools tools;
    private final AssistantPrompt prompt;
    private final AssistantRateLimiter limiter;
    private final UserService users;
    private final EmergencyService emergency;

    public AssistantService(AssistantProperties props, AssistantTools tools, AssistantPrompt prompt,
                            AssistantRateLimiter limiter, UserService users,
                            EmergencyService emergency) {
        this.props = props;
        this.tools = tools;
        this.prompt = prompt;
        this.limiter = limiter;
        this.users = users;
        this.emergency = emergency;
        this.client = props.enabled()
                ? AnthropicOkHttpClient.builder()
                        .apiKey(props.apiKey().trim())
                        .timeout(Duration.ofSeconds(props.timeoutSeconds()))
                        .maxRetries(1)
                        .build()
                : null;
        if (client == null) {
            log.info("Kusi está desactivado: falta ANTHROPIC_API_KEY");
        }
    }

    public boolean enabled() {
        return client != null;
    }

    public AssistantDtos.ChatResponse chat(Long uid, AssistantDtos.ChatRequest req) {
        if (client == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
        UserDtos.UserResponse user = users.me(uid);
        List<MessageParam> messages = history(req.messages());
        if (messages.isEmpty()) {
            throw ApiException.badRequest("Escribe tu pregunta para Kusi");
        }
        limiter.acquire(uid);

        String system = prompt.build(firstName(user.fullName()), user.location().neighborhood(),
                emergency.mode(uid));
        AssistantTools.Session session = tools.session(uid, req.latitude(), req.longitude());
        List<Tool> definitions = session.definitions();
        long inputTokens = 0;
        long outputTokens = 0;

        try {
            for (int step = 0; step < MAX_STEPS; step++) {
                Message response = call(system, definitions, messages);
                inputTokens += response.usage().inputTokens();
                outputTokens += response.usage().outputTokens();
                StopReason stop = response.stopReason().orElse(StopReason.END_TURN);

                if (StopReason.REFUSAL.equals(stop)) {
                    return session.reply(REFUSAL);
                }
                if (!StopReason.TOOL_USE.equals(stop)) {
                    String text = text(response);
                    return session.reply(text.isBlank() ? FALLBACK : text);
                }

                messages.add(response.toParam());
                List<ContentBlockParam> results = response.content().stream()
                        .flatMap(block -> block.toolUse().stream())
                        .map(call -> ContentBlockParam.ofToolResult(session.run(call)))
                        .toList();
                messages.add(MessageParam.ofUserOfContentBlockParams(results));
            }
            return session.reply(FALLBACK);
        } finally {
            log.info("Kusi respondió al usuario {} ({} tokens de entrada, {} de salida)", uid, inputTokens,
                    outputTokens);
        }
    }

    private Message call(String system, List<Tool> definitions, List<MessageParam> messages) {
        MessageCreateParams.Builder params = MessageCreateParams.builder()
                .model(props.model())
                .maxTokens(props.maxTokens())
                .system(system)
                .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.of(props.effort())).build())
                .messages(messages);
        definitions.forEach(params::addTool);
        try {
            return client.messages().create(params.build());
        } catch (UnauthorizedException | PermissionDeniedException e) {
            log.error("Kusi: la API key de Anthropic no es válida o no tiene permisos ({})", e.statusCode());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        } catch (RateLimitException e) {
            log.warn("Kusi: límite de uso de Anthropic alcanzado");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, BUSY);
        } catch (BadRequestException e) {
            log.error("Kusi: solicitud rechazada por Anthropic: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        } catch (AnthropicServiceException e) {
            log.warn("Kusi: error de Anthropic {}: {}", e.statusCode(), e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        } catch (AnthropicIoException e) {
            log.warn("Kusi: sin conexión con Anthropic: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, NO_CONNECTION);
        }
    }

    static List<MessageParam> history(List<AssistantDtos.ChatMessage> input) {
        List<AssistantDtos.ChatMessage> recent = input.subList(Math.max(0, input.size() - MAX_HISTORY), input.size());
        int start = 0;
        while (start < recent.size() && !"user".equals(recent.get(start).role())) {
            start++;
        }
        List<MessageParam> out = new ArrayList<>();
        for (AssistantDtos.ChatMessage m : recent.subList(start, recent.size())) {
            String text = m.text().trim();
            out.add("user".equals(m.role()) ? MessageParam.ofUser(text) : MessageParam.ofAssistant(text));
        }
        if (!out.isEmpty() && !"user".equals(recent.getLast().role())) {
            return List.of();
        }
        return out;
    }

    private static String text(Message response) {
        return response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(TextBlock::text)
                .collect(Collectors.joining("\n"))
                .trim();
    }

    private static String firstName(String fullName) {
        String trimmed = fullName == null ? "" : fullName.trim();
        int space = trimmed.indexOf(' ');
        return space > 0 ? trimmed.substring(0, space) : trimmed;
    }

    @PreDestroy
    void close() {
        if (client != null) {
            client.close();
        }
    }
}
