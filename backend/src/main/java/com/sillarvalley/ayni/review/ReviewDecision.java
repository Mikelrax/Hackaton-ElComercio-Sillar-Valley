package com.sillarvalley.ayni.review;

public enum ReviewDecision {
    APROBAR,
    REVISAR,
    SOSPECHOSA;

    ReviewDecision atLeast(ReviewDecision other) {
        return compareTo(other) >= 0 ? this : other;
    }

    AutoReview outcome() {
        return switch (this) {
            case APROBAR -> AutoReview.APPROVED;
            case REVISAR -> AutoReview.ESCALATED;
            case SOSPECHOSA -> AutoReview.FLAGGED;
        };
    }
}
