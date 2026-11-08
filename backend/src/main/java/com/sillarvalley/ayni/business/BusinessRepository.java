package com.sillarvalley.ayni.business;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    Page<Business> findByStatusOrderByCreatedAtAsc(BusinessStatus status, Pageable pageable);

    List<Business> findByStatusAndAutoReviewIsNull(BusinessStatus status);
}
