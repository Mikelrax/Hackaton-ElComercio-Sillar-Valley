ALTER TABLE posts ADD COLUMN auto_review VARCHAR(20);
ALTER TABLE posts ADD COLUMN auto_review_note VARCHAR(300);

ALTER TABLE businesses ADD COLUMN auto_review VARCHAR(20);
ALTER TABLE businesses ADD COLUMN auto_review_note VARCHAR(300);

CREATE TABLE review_queue (
    id           BIGSERIAL    PRIMARY KEY,
    subject_type VARCHAR(20)  NOT NULL,
    subject_id   BIGINT       NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    generation   INT          NOT NULL DEFAULT 0,
    attempts     INT          NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    locked_at    TIMESTAMPTZ,
    last_error   VARCHAR(300),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    finished_at  TIMESTAMPTZ,
    CONSTRAINT uq_review_queue_subject UNIQUE (subject_type, subject_id)
);

CREATE INDEX idx_review_queue_ready ON review_queue (status, available_at);
