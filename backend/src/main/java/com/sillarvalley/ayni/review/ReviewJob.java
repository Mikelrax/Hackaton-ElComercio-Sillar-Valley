package com.sillarvalley.ayni.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "review_queue")
public class ReviewJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewSubject subjectType;

    @Column(nullable = false)
    private Long subjectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewJobStatus status = ReviewJobStatus.QUEUED;

    @Column(nullable = false)
    private int generation;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private Instant availableAt = Instant.now();

    private Instant lockedAt;

    @Column(length = 300)
    private String lastError;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant finishedAt;

    protected ReviewJob() {}

    ReviewJob(ReviewSubject subjectType, Long subjectId) {
        this.subjectType = subjectType;
        this.subjectId = subjectId;
    }

    void requeue() {
        generation++;
        status = ReviewJobStatus.QUEUED;
        attempts = 0;
        availableAt = Instant.now();
        lockedAt = null;
        lastError = null;
        finishedAt = null;
    }

    void start(Instant now) {
        status = ReviewJobStatus.PROCESSING;
        lockedAt = now;
        attempts++;
    }

    void retryAt(Instant when, String error) {
        status = ReviewJobStatus.QUEUED;
        availableAt = when;
        lockedAt = null;
        lastError = error;
    }

    void finish(ReviewJobStatus result, String error) {
        status = result;
        lockedAt = null;
        lastError = error;
        finishedAt = Instant.now();
    }

    public Long getId() { return id; }
    public ReviewSubject getSubjectType() { return subjectType; }
    public Long getSubjectId() { return subjectId; }
    public ReviewJobStatus getStatus() { return status; }
    public int getGeneration() { return generation; }
    public int getAttempts() { return attempts; }
    public Instant getAvailableAt() { return availableAt; }
    public String getLastError() { return lastError; }
}
