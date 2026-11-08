package com.sillarvalley.ayni.business;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    Page<Business> findByStatusOrderByCreatedAtAsc(BusinessStatus status, Pageable pageable);
}
