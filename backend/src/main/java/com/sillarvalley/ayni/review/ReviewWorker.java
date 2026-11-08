package com.sillarvalley.ayni.review;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReviewWorker {

    private static final Logger log = LoggerFactory.getLogger(ReviewWorker.class);

    private final ReviewQueue queue;
    private final ContentReviewer reviewer;
    private final AtomicBoolean backfilled = new AtomicBoolean(false);

    public ReviewWorker(ReviewQueue queue, ContentReviewer reviewer) {
        this.queue = queue;
        this.reviewer = reviewer;
    }

    @Scheduled(initialDelayString = "${review.initial-delay-ms:10000}", fixedDelayString = "${review.poll-delay-ms:3000}")
    public void run() {
        if (!queue.active()) {
            return;
        }
        if (!backfilled.get()) {
            int queued = queue.backfill();
            backfilled.set(true);
            if (queued > 0) {
                log.info("Revisión automática: {} pendientes sin revisar entraron a la cola", queued);
            }
        }
        for (ReviewQueue.Claim claim : queue.claim()) {
            process(claim);
        }
    }

    private void process(ReviewQueue.Claim claim) {
        String subject = claim.type() + " " + claim.subjectId();
        try {
            Optional<ReviewContent> content = queue.load(claim);
            if (content.isEmpty()) {
                queue.skip(claim);
                return;
            }
            ReviewResult result = ReviewRules.apply(content.get(), reviewer.review(content.get()));
            if (queue.finish(claim, result)) {
                log.info("Revisión automática de {}: {} ({})", subject, result.decision(), result.reason());
            }
        } catch (ContentReviewer.Unavailable e) {
            log.warn("Revisión automática de {} falló (intento {}): {}", subject, claim.attempts(), e.getMessage());
            if (e.retryable()) {
                queue.retryOrFail(claim, e.getMessage());
            } else {
                queue.fail(claim, e.getMessage());
            }
        } catch (RuntimeException e) {
            log.warn("Revisión automática de {} falló (intento {})", subject, claim.attempts(), e);
            queue.retryOrFail(claim, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}
