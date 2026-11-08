package com.sillarvalley.ayni.review;

public record AutoReviewInfo(AutoReview state, String label, String note) {

    public static AutoReviewInfo of(AutoReview state, String note, boolean withNote) {
        return state == null ? null : new AutoReviewInfo(state, state.label(), withNote ? note : null);
    }
}
