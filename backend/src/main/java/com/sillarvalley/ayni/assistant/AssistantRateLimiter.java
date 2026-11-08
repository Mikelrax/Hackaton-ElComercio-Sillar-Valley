package com.sillarvalley.ayni.assistant;

import com.sillarvalley.ayni.common.ApiException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AssistantRateLimiter {

    private static final Duration WINDOW = Duration.ofHours(1);

    private final Map<Long, Deque<Instant>> calls = new ConcurrentHashMap<>();
    private final int limit;

    public AssistantRateLimiter(AssistantProperties props) {
        this.limit = props.hourlyLimit();
    }

    public void acquire(Long userId) {
        Instant now = Instant.now();
        Deque<Instant> history = calls.computeIfAbsent(userId, id -> new ArrayDeque<>());
        synchronized (history) {
            Instant from = now.minus(WINDOW);
            while (!history.isEmpty() && history.peekFirst().isBefore(from)) {
                history.pollFirst();
            }
            if (history.size() >= limit) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Ya conversaste mucho con Kusi en la última hora. Vuelve a intentarlo en unos minutos.");
            }
            history.addLast(now);
        }
    }
}
