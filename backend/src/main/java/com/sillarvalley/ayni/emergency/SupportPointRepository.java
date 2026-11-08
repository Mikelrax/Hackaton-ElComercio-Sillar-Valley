package com.sillarvalley.ayni.emergency;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportPointRepository extends JpaRepository<SupportPoint, Long> {

    List<SupportPoint> findAllByOrderByNameAsc();

    long countByOpenTrue();
}
