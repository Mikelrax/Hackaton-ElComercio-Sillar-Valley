package com.sillarvalley.ayni.review;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewJobRepository extends JpaRepository<ReviewJob, Long> {

    Optional<ReviewJob> findBySubjectTypeAndSubjectId(ReviewSubject subjectType, Long subjectId);

    @Query(value = """
            SELECT * FROM review_queue
            WHERE (status = 'QUEUED' AND available_at <= :now)
               OR (status = 'PROCESSING' AND locked_at < :staleBefore)
            ORDER BY available_at
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<ReviewJob> lockReady(@Param("now") Instant now, @Param("staleBefore") Instant staleBefore,
                              @Param("limit") int limit);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select j from ReviewJob j where j.id = :id")
    Optional<ReviewJob> lockById(@Param("id") Long id);
}
