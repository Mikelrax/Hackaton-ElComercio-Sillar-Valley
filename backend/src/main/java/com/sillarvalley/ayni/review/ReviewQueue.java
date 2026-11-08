package com.sillarvalley.ayni.review;

import com.sillarvalley.ayni.assistant.ClaudeClient;
import com.sillarvalley.ayni.business.Business;
import com.sillarvalley.ayni.business.BusinessRecommendation;
import com.sillarvalley.ayni.business.BusinessRecommendationRepository;
import com.sillarvalley.ayni.business.BusinessRepository;
import com.sillarvalley.ayni.business.BusinessStatus;
import com.sillarvalley.ayni.common.RichText;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import com.sillarvalley.ayni.post.PostType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewQueue {

    record Claim(Long id, ReviewSubject type, Long subjectId, int generation, int attempts) {}

    private final ReviewJobRepository jobs;
    private final PostRepository posts;
    private final BusinessRepository businesses;
    private final BusinessRecommendationRepository recommendations;
    private final ReviewProperties props;
    private final ClaudeClient claude;

    public ReviewQueue(ReviewJobRepository jobs, PostRepository posts, BusinessRepository businesses,
                       BusinessRecommendationRepository recommendations, ReviewProperties props,
                       ClaudeClient claude) {
        this.jobs = jobs;
        this.posts = posts;
        this.businesses = businesses;
        this.recommendations = recommendations;
        this.props = props;
        this.claude = claude;
    }

    public boolean active() {
        return props.enabled() && claude.enabled();
    }

    @Transactional
    public boolean enqueue(ReviewSubject type, Long subjectId) {
        if (!active()) {
            return false;
        }
        ReviewJob job = jobs.findBySubjectTypeAndSubjectId(type, subjectId)
                .orElseGet(() -> new ReviewJob(type, subjectId));
        job.requeue();
        jobs.save(job);
        return true;
    }

    @Transactional
    public int backfill() {
        if (!active()) {
            return 0;
        }
        int count = 0;
        for (Post p : posts.findByStatusAndAutoReviewIsNull(PostStatus.PENDING)) {
            enqueue(ReviewSubject.POST, p.getId());
            p.setAutoReview(AutoReview.QUEUED);
            count++;
        }
        for (Business b : businesses.findByStatusAndAutoReviewIsNull(BusinessStatus.PENDING)) {
            enqueue(ReviewSubject.BUSINESS, b.getId());
            b.setAutoReview(AutoReview.QUEUED);
            count++;
        }
        return count;
    }

    @Transactional
    List<Claim> claim() {
        Instant now = Instant.now();
        List<ReviewJob> ready = jobs.lockReady(now, now.minusSeconds(props.staleSeconds()), props.batchSize());
        List<Claim> claims = new ArrayList<>();
        for (ReviewJob job : ready) {
            job.start(now);
            claims.add(new Claim(job.getId(), job.getSubjectType(), job.getSubjectId(), job.getGeneration(),
                    job.getAttempts()));
        }
        return claims;
    }

    @Transactional(readOnly = true)
    Optional<ReviewContent> load(Claim claim) {
        return switch (claim.type()) {
            case POST -> posts.findById(claim.subjectId())
                    .filter(p -> p.getStatus() == PostStatus.PENDING)
                    .map(ReviewQueue::content);
            case BUSINESS -> businesses.findById(claim.subjectId())
                    .filter(b -> b.getStatus() == BusinessStatus.PENDING)
                    .map(this::content);
        };
    }

    @Transactional
    boolean finish(Claim claim, ReviewResult result) {
        Optional<ReviewJob> job = current(claim);
        if (job.isEmpty()) {
            return false;
        }
        mark(claim, result.decision().outcome(), result.reason());
        job.get().finish(ReviewJobStatus.DONE, null);
        return true;
    }

    @Transactional
    void skip(Claim claim) {
        current(claim).ifPresent(job -> job.finish(ReviewJobStatus.DONE, null));
    }

    @Transactional
    boolean retryOrFail(Claim claim, String error) {
        Optional<ReviewJob> found = current(claim);
        if (found.isEmpty()) {
            return false;
        }
        ReviewJob job = found.get();
        String note = ReviewRules.note(error);
        if (job.getAttempts() < props.maxAttempts()) {
            long delay = (long) props.retryDelaySeconds() << (job.getAttempts() - 1);
            job.retryAt(Instant.now().plusSeconds(delay), note);
            return true;
        }
        mark(claim, AutoReview.FAILED, null);
        job.finish(ReviewJobStatus.FAILED, note);
        return false;
    }

    @Transactional
    void fail(Claim claim, String error) {
        current(claim).ifPresent(job -> {
            mark(claim, AutoReview.FAILED, null);
            job.finish(ReviewJobStatus.FAILED, ReviewRules.note(error));
        });
    }

    private Optional<ReviewJob> current(Claim claim) {
        return jobs.lockById(claim.id())
                .filter(job -> job.getGeneration() == claim.generation())
                .filter(job -> job.getStatus() == ReviewJobStatus.PROCESSING);
    }

    private void mark(Claim claim, AutoReview outcome, String note) {
        switch (claim.type()) {
            case POST -> posts.findById(claim.subjectId())
                    .filter(p -> p.getStatus() == PostStatus.PENDING)
                    .ifPresent(p -> {
                        p.setAutoReview(outcome);
                        p.setAutoReviewNote(note);
                        if (outcome == AutoReview.APPROVED) {
                            p.setStatus(PostStatus.APPROVED);
                        }
                    });
            case BUSINESS -> businesses.findById(claim.subjectId())
                    .filter(b -> b.getStatus() == BusinessStatus.PENDING)
                    .ifPresent(b -> {
                        b.setAutoReview(outcome);
                        b.setAutoReviewNote(note);
                        if (outcome == AutoReview.APPROVED) {
                            b.setStatus(BusinessStatus.APPROVED);
                        }
                    });
        }
    }

    private static ReviewContent content(Post p) {
        String kind = p.getType() == PostType.REQUEST ? "Necesito (pide ayuda)" : "Ofrezco (ofrece ayuda)";
        String prompt = "<publicacion_del_muro>\n"
                + "Tipo: " + kind + "\n"
                + "Categoría: " + p.getCategory().label() + "\n"
                + line("Barrio", p.getNeighborhood())
                + "Título: " + p.getTitle() + "\n"
                + "Descripción: " + RichText.plain(p.getDescription()) + "\n"
                + "Fotos adjuntas: " + p.getImages().size() + "\n"
                + "</publicacion_del_muro>";
        return new ReviewContent(ReviewSubject.POST, prompt, p.getTitle() + "\n" + RichText.plain(p.getDescription()),
                p.getImages().size());
    }

    private ReviewContent content(Business b) {
        Optional<BusinessRecommendation> mine = recommendations.findTop10ByBusinessIdOrderByCreatedAtDesc(b.getId())
                .stream()
                .filter(r -> r.getUser().getId().equals(b.getCreatedBy().getId()))
                .findFirst();
        String reasons = mine.map(r -> Stream.of(
                        r.isGoodPrice() ? "buen precio" : null,
                        r.isPunctual() ? "puntual" : null,
                        r.isReliable() ? "confiable" : null)
                .filter(s -> s != null)
                .collect(Collectors.joining(", "))).orElse("");
        String comment = mine.map(r -> RichText.plain(r.getComment())).orElse(null);
        String hours = b.getOpensAt() == null || b.getClosesAt() == null ? null
                : "de " + b.getOpensAt() + " a " + b.getClosesAt();
        String prompt = "<recomendacion_de_negocio>\n"
                + "Nombre: " + b.getName() + "\n"
                + "Rubro: " + b.getCategory().getName() + "\n"
                + line("Barrio", b.getNeighborhood())
                + line("Descripción", b.getDescription())
                + line("Referencia de ubicación", b.getReference())
                + line("Horario", hours)
                + line("Precio", b.getPriceHint())
                + "Tiene teléfono de contacto: " + (b.getPhone() == null ? "no" : "sí") + "\n"
                + line("Lo recomienda por", reasons)
                + line("Comentario de quien lo recomienda", comment)
                + "</recomendacion_de_negocio>";
        String freeText = Stream.of(b.getName(), b.getDescription(), b.getReference(), b.getPriceHint(), comment)
                .filter(s -> s != null)
                .collect(Collectors.joining("\n"));
        return new ReviewContent(ReviewSubject.BUSINESS, prompt, freeText, 0);
    }

    private static String line(String label, String value) {
        return value == null || value.isBlank() ? "" : label + ": " + value + "\n";
    }
}
