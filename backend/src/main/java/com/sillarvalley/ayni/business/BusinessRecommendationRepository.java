package com.sillarvalley.ayni.business;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRecommendationRepository extends JpaRepository<BusinessRecommendation, Long> {

    boolean existsByBusinessIdAndUserId(Long businessId, Long userId);

    List<BusinessRecommendation> findTop10ByBusinessIdOrderByCreatedAtDesc(Long businessId);
}
