package com.sillarvalley.ayni.review;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.assistant.ClaudeClient;
import com.sillarvalley.ayni.business.BusinessRecommendationRepository;
import com.sillarvalley.ayni.business.BusinessRepository;
import com.sillarvalley.ayni.post.Post;
import com.sillarvalley.ayni.post.PostRepository;
import com.sillarvalley.ayni.post.PostStatus;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ReviewQueueTest {

    private ReviewJobRepository jobs;
    private PostRepository posts;
    private ClaudeClient claude;
    private ReviewQueue queue;
    private Post post;

    @BeforeEach
    void setUp() {
        jobs = mock(ReviewJobRepository.class);
        posts = mock(PostRepository.class);
        claude = mock(ClaudeClient.class);
        when(claude.enabled()).thenReturn(true);
        queue = new ReviewQueue(jobs, posts, mock(BusinessRepository.class),
                mock(BusinessRecommendationRepository.class), new ReviewProperties(true, 5, 3, 30, 300), claude);

        post = new Post();
        ReflectionTestUtils.setField(post, "id", 10L);
        post.setStatus(PostStatus.PENDING);
        post.setAutoReview(AutoReview.QUEUED);
        when(posts.findById(10L)).thenReturn(Optional.of(post));
    }

    private ReviewJob processing(int generation, int attempts) {
        ReviewJob job = new ReviewJob(ReviewSubject.POST, 10L);
        ReflectionTestUtils.setField(job, "id", 1L);
        for (int i = 0; i < generation; i++) {
            job.requeue();
        }
        for (int i = 0; i < attempts; i++) {
            job.start(Instant.now());
        }
        when(jobs.lockById(1L)).thenReturn(Optional.of(job));
        return job;
    }

    private static ReviewQueue.Claim claim(int generation, int attempts) {
        return new ReviewQueue.Claim(1L, ReviewSubject.POST, 10L, generation, attempts);
    }

    @Test
    void sinApiKeyNoEncola() {
        when(claude.enabled()).thenReturn(false);
        assertFalse(queue.enqueue(ReviewSubject.POST, 10L));
        verify(jobs, never()).save(any());
    }

    @Test
    void editarVuelveAEncolarConOtraGeneracion() {
        ReviewJob job = processing(1, 1);
        when(jobs.findBySubjectTypeAndSubjectId(ReviewSubject.POST, 10L)).thenReturn(Optional.of(job));

        assertTrue(queue.enqueue(ReviewSubject.POST, 10L));

        assertEquals(2, job.getGeneration());
        assertEquals(ReviewJobStatus.QUEUED, job.getStatus());
        assertEquals(0, job.getAttempts());
    }

    @Test
    void aprobarPublicaLaPublicacion() {
        ReviewJob job = processing(1, 1);

        assertTrue(queue.finish(claim(1, 1), new ReviewResult(ReviewDecision.APROBAR, "Pedido claro.")));

        assertEquals(PostStatus.APPROVED, post.getStatus());
        assertEquals(AutoReview.APPROVED, post.getAutoReview());
        assertEquals(ReviewJobStatus.DONE, job.getStatus());
    }

    @Test
    void sospechosaQuedaPendienteParaElModerador() {
        processing(1, 1);

        queue.finish(claim(1, 1), new ReviewResult(ReviewDecision.SOSPECHOSA, "Pide un adelanto."));

        assertEquals(PostStatus.PENDING, post.getStatus());
        assertEquals(AutoReview.FLAGGED, post.getAutoReview());
        assertEquals("Pide un adelanto.", post.getAutoReviewNote());
    }

    @Test
    void resultadoViejoNoPisaUnaEdicion() {
        ReviewJob job = processing(2, 1);

        assertFalse(queue.finish(claim(1, 1), new ReviewResult(ReviewDecision.APROBAR, "")));

        assertEquals(PostStatus.PENDING, post.getStatus());
        assertEquals(AutoReview.QUEUED, post.getAutoReview());
        assertEquals(ReviewJobStatus.PROCESSING, job.getStatus());
    }

    @Test
    void siElModeradorYaDecidioNoSeToca() {
        processing(1, 1);
        post.setStatus(PostStatus.REJECTED);

        queue.finish(claim(1, 1), new ReviewResult(ReviewDecision.APROBAR, ""));

        assertEquals(PostStatus.REJECTED, post.getStatus());
        assertEquals(AutoReview.QUEUED, post.getAutoReview());
    }

    @Test
    void unErrorSeReintentaMasTarde() {
        ReviewJob job = processing(1, 1);

        assertTrue(queue.retryOrFail(claim(1, 1), "Sin conexión"));

        assertEquals(ReviewJobStatus.QUEUED, job.getStatus());
        assertTrue(job.getAvailableAt().isAfter(Instant.now().plusSeconds(20)));
        assertEquals(AutoReview.QUEUED, post.getAutoReview());
    }

    @Test
    void trasElUltimoIntentoPasaAlModerador() {
        ReviewJob job = processing(1, 3);

        assertFalse(queue.retryOrFail(claim(1, 3), "Sin conexión"));

        assertEquals(ReviewJobStatus.FAILED, job.getStatus());
        assertEquals(PostStatus.PENDING, post.getStatus());
        assertEquals(AutoReview.FAILED, post.getAutoReview());
        assertNull(post.getAutoReviewNote());
    }
}
