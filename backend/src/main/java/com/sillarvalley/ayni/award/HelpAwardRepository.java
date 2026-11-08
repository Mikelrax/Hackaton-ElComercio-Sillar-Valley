package com.sillarvalley.ayni.award;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HelpAwardRepository extends JpaRepository<HelpAward, Long> {

    long countByHelperIdAndPointsGreaterThanAndCreatedAtAfter(Long helperId, int points, Instant since);

    @Query("select count(a) from HelpAward a where a.points > 0 and a.createdAt >= :since and "
            + "((a.helper.id = :first and a.receiver.id = :second) or (a.helper.id = :second and a.receiver.id = :first))")
    long countPointsBetween(@Param("first") Long first, @Param("second") Long second, @Param("since") Instant since);

    @Query("select a from HelpAward a join fetch a.helper join fetch a.receiver where a.createdAt >= :since")
    List<HelpAward> findSince(@Param("since") Instant since);
}
