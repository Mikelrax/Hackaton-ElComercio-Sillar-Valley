package com.sillarvalley.ayni.assistant;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.OutputConfig;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ClaudeClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeClient.class);

    private final AssistantProperties props;
    private final AnthropicClient client;

    public ClaudeClient(AssistantProperties props) {
        this.props = props;
        this.client = props.enabled()
                ? AnthropicOkHttpClient.builder()
                        .apiKey(props.apiKey().trim())
                        .timeout(Duration.ofSeconds(props.timeoutSeconds()))
                        .maxRetries(1)
                        .build()
                : null;
        if (client == null) {
            log.info("Claude está desactivado: falta ANTHROPIC_API_KEY");
        }
    }

    public boolean enabled() {
        return client != null;
    }

    public AnthropicClient client() {
        if (client == null) {
            throw new IllegalStateException("Claude está desactivado");
        }
        return client;
    }

    public String model() {
        return props.model();
    }

    public long maxTokens() {
        return props.maxTokens();
    }

    public OutputConfig.Effort effort() {
        return OutputConfig.Effort.of(props.effort());
    }

    @PreDestroy
    void close() {
        if (client != null) {
            client.close();
        }
    }
}
